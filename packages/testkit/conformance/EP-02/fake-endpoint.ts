/**
 * The fake endpoint of the conformance suite of the harness port (EP-02).
 *
 * F109-FR-042 — the suite must exercise the two completion transports without
 * a paid or an external service. This module is the observed side of that
 * assertion for the kinds `openai-chat` and `anthropic-messages`: an HTTP
 * server on loopback that answers in the two request shapes and can redirect,
 * fail or hang.
 *
 * The suite starts it with `startFakeEndpoint`, drives a harness adapter at
 * its URL, and reads `requests` — one record per request the endpoint
 * received, with the shape, the path, the headers and the parsed body — to
 * assert what the adapter sent. No connection is accepted beyond loopback:
 * the server binds `127.0.0.1` and refuses to start otherwise.
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { once } from "node:events";

/** The two request shapes the endpoint answers. */
export type EndpointShape = "openai-chat" | "anthropic-messages";

/** What the endpoint did with one received request. */
export interface FakeRequestRecord {
  shape: EndpointShape | "unknown";
  method: string;
  path: string;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
  at: string;
}

/** One scripted behaviour. */
export type Behaviour =
  /** Answer in the shape of the request. `text` is the reply content.
   *  `omitUsage` answers without the usage record, to characterize the null
   *  usage of a client whose endpoint reports none (F109-FR-017). */
  | { kind: "answer"; shape?: EndpointShape; text?: string; model?: string; omitUsage?: boolean }
  /** Redirect to the given location (a path or an absolute URL). */
  | { kind: "redirect"; location: string; status?: 301 | 302 | 307 | 308 }
  /** Fail with the status and body. */
  | { kind: "fail"; status: number; body?: string }
  /** Never answer; the caller's time limit has to end the request. */
  | { kind: "hang" };

export interface FakeEndpointOptions {
  /** Behaviours, consumed in order per request; the last one repeats. */
  behaviours: Behaviour[];
  /** Pin the port; the default is an ephemeral one. */
  port?: number;
}

export interface FakeEndpoint {
  /** `http://127.0.0.1:<port>` */
  url: string;
  port: number;
  /** The paths of the two shapes, for the descriptor of a fixture. */
  paths: Record<EndpointShape, string>;
  /** Every request received since the start, in arrival order. */
  requests: readonly FakeRequestRecord[];
  /** Stop listening and wait for the close. Idempotent. */
  close(): Promise<void>;
}

export const OPENAI_CHAT_PATH = "/v1/chat/completions";
export const ANTHROPIC_MESSAGES_PATH = "/v1/messages";

function shapeOf(path: string): EndpointShape | "unknown" {
  if (path === OPENAI_CHAT_PATH) return "openai-chat";
  if (path === ANTHROPIC_MESSAGES_PATH) return "anthropic-messages";
  return "unknown";
}

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolveBody, rejectBody) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => resolveBody(Buffer.concat(chunks).toString("utf8")));
    request.on("error", rejectBody);
  });
}

function replyOf(
  shape: EndpointShape,
  behaviour: {
    text?: string;
    model?: string;
    omitUsage?: boolean;
  },
): string {
  const text = behaviour.text ?? "ok";
  const model = behaviour.model ?? "fake-model";
  if (shape === "anthropic-messages") {
    return JSON.stringify({
      id: "msg_fake_0001",
      type: "message",
      role: "assistant",
      model,
      content: [{ type: "text", text }],
      stop_reason: "end_turn",
      ...(behaviour.omitUsage ? {} : { usage: { input_tokens: 1, output_tokens: 1 } }),
    });
  }
  return JSON.stringify({
    id: "chatcmpl-fake0001",
    object: "chat.completion",
    model,
    choices: [{ index: 0, message: { role: "assistant", content: text }, finish_reason: "stop" }],
    ...(behaviour.omitUsage
      ? {}
      : { usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } }),
  });
}

/**
 * Start the fake endpoint on loopback. The returned promise settles when the
 * server listens.
 */
export async function startFakeEndpoint(options: FakeEndpointOptions): Promise<FakeEndpoint> {
  const behaviours = [...options.behaviours];
  const requests: FakeRequestRecord[] = [];
  let behaviourIndex = 0;
  const nextBehaviour = (): Behaviour => {
    if (behaviourIndex < behaviours.length - 1) return behaviours[behaviourIndex++];
    return behaviours[behaviours.length - 1] ?? { kind: "answer" };
  };

  const server: Server = createServer((request, response) => {
    void handle(request, response);
  });
  // A hung behaviour holds its connection open; `close` must be able to end
  // the wait, so every socket is tracked and destroyed on close.
  const sockets = new Set<import("node:net").Socket>();
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });

  async function handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const raw = await readBody(request);
    let body: unknown = raw;
    try {
      body = JSON.parse(raw) as unknown;
    } catch {
      /* keep the raw text */
    }
    const record: FakeRequestRecord = {
      shape: shapeOf(request.url ?? ""),
      method: request.method ?? "",
      path: request.url ?? "",
      headers: request.headers,
      body,
      at: new Date().toISOString(),
    };
    requests.push(record);

    const behaviour = nextBehaviour();
    switch (behaviour.kind) {
      case "answer": {
        const shape =
          behaviour.shape ?? (record.shape === "unknown" ? "openai-chat" : record.shape);
        response.writeHead(200, { "content-type": "application/json" });
        response.end(replyOf(shape, behaviour));
        return;
      }
      case "redirect": {
        response.writeHead(behaviour.status ?? 302, { location: behaviour.location });
        response.end();
        return;
      }
      case "fail": {
        response.writeHead(behaviour.status, { "content-type": "text/plain" });
        response.end(behaviour.body ?? "fake endpoint failure");
        return;
      }
      case "hang": {
        // Deliberately no answer and no end: the caller's time limit ends it.
        return;
      }
    }
  }

  const host = "127.0.0.1";
  server.listen(options.port ?? 0, host);
  await once(server, "listening");
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("the fake endpoint did not get a loopback port");
  }
  return {
    url: `http://${host}:${address.port}`,
    port: address.port,
    paths: { "openai-chat": OPENAI_CHAT_PATH, "anthropic-messages": ANTHROPIC_MESSAGES_PATH },
    requests,
    close: async () => {
      if (!server.listening) return;
      for (const socket of sockets) socket.destroy();
      server.close();
      await once(server, "close");
    },
  };
}
