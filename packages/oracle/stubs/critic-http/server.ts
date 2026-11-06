#!/usr/bin/env node
/**
 * T040 — the critic stub over HTTP, in the two request shapes the reference
 * uses, with the diagnostician part (F141-FR-008).
 *
 * CH is ONE local server. The reference reaches it in two request shapes:
 *
 * | Shape | Path | Request | Reply |
 * |---|---|---|---|
 * | `messages` | `/v1/messages` | `messages[0].content` is the prompt | `content[]` blocks of type `text` |
 * | `chat-completions` | `/v1/chat/completions` | `messages[0].content` is the prompt | `choices[0].message.content` |
 *
 * Both are read at the baseline: `call_claude` builds `<base>/v1/messages` and
 * reads `content[].text`; `call_openai_chat` builds `<base>/chat/completions`
 * and reads `choices[0].message.content`, and fails on an empty list of
 * choices — which is what the argument `choices: none` of the verb `empty`
 * exercises, in the second request shape only.
 *
 * The verdict text is `replyFor` of `../lib/critic-cli.ts`, and the nonce comes
 * from the prompt through `nonceFromPrompt` of the same module: one script, one
 * verdict, two transports (F141-FR-011). A call whose prompt holds no nonce is
 * answered from the diagnostician part of the script.
 *
 * The server listens on loopback only. The network guard of the run would end a
 * connection to anything else with its own exit code (F141-FR-038).
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import process from "node:process";

import { assertLoopback } from "../../src/env/guard.ts";
import {
  CRITIC_HTTP_VERBS,
  DIAGNOSTICIAN_VERBS,
  CriticStubError,
  completionFormOf,
  nonceFromPrompt,
  replyFor,
  roleOfCall,
  type CompletionForm,
} from "../lib/critic-cli.ts";
import { nextInvocation } from "../lib/counter.ts";
import { readScript, stepFor, type ScriptStep, type StubScript } from "../lib/script.ts";
import { environmentNames, writeTranscriptRecord } from "../lib/transcript.ts";

/** The two request shapes of §O.3, as the data form of the vocabulary holds them. */
export const REQUEST_SHAPES = ["messages", "chat-completions"] as const;
export type RequestShape = (typeof REQUEST_SHAPES)[number];

/** The path of each request shape, as the baseline builds it. */
export const SHAPE_PATHS: Readonly<Record<RequestShape, string>> = Object.freeze({
  messages: "/v1/messages",
  "chat-completions": "/chat/completions",
});

/** The argument of `empty` that the second request shape answers with no choice. */
export const CHOICES_NONE = "none" as const;

/** Which request shape a path is. */
export function shapeOfPath(path: string): RequestShape | undefined {
  const clean = path.split("?")[0] ?? path;
  if (clean.endsWith(SHAPE_PATHS.messages)) return "messages";
  if (clean.endsWith(SHAPE_PATHS["chat-completions"])) return "chat-completions";
  return undefined;
}

/** The prompt of a request body, in either shape. */
export function promptOfRequest(body: Readonly<Record<string, unknown>>): string {
  const messages = body["messages"];
  if (!Array.isArray(messages) || messages.length === 0) return "";
  const first = messages[0] as { content?: unknown };
  if (typeof first.content === "string") return first.content;
  if (Array.isArray(first.content)) {
    return (first.content as { text?: unknown }[]).map((b) => String(b.text ?? "")).join("");
  }
  return "";
}

/** The body of the reply in the `messages` shape. */
export function answerMessages(text: string): Record<string, unknown> {
  return { content: text === "" ? [] : [{ type: "text", text }], stop_reason: "end_turn" };
}

/**
 * The body of the reply in the `chat-completions` shape. With `choicesNone`
 * the list of choices is empty, which is the argument `choices: none` of the
 * verb `empty` and which the baseline reports as "empty choices".
 */
export function answerChatCompletions(text: string, choicesNone = false): Record<string, unknown> {
  if (choicesNone) return { choices: [] };
  return { choices: [{ index: 0, message: { role: "assistant", content: text } }] };
}

/** The reply of the diagnostician part: a hint, or a failed call. */
export function diagnosticianAnswer(step: ScriptStep): {
  readonly text: string;
  readonly status: number;
} {
  for (const verb of step.verbs) {
    if (!DIAGNOSTICIAN_VERBS.includes(verb)) {
      throw new CriticStubError(
        `${verb} is no verb of the diagnostician part of the critic stub; §O.3 names ` +
          `${DIAGNOSTICIAN_VERBS.join(", ")}`,
      );
    }
  }
  const reply = replyFor(step.verbs[0] as string, undefined, step.args ?? {});
  return { text: reply.text, status: reply.failWith ?? 200 };
}

/**
 * The name of the variable that carries the file a server stub writes its
 * address into once it is listening. The driver of a side sets it; the stub
 * writes the file last, so its existence means "the socket is open".
 */
export const SERVER_STUB_ADDRESS_FILE = "ORACLE_SERVER_ADDRESS_FILE" as const;

/**
 * The script of one role, from the file the driver wrote. `writeStubScripts`
 * writes one file per kind of stub, holding `{ steps: [...] }` and no role, so
 * the role is the kind of the file the driver named.
 */
export function scriptOfFile(file: string, role: "critic-http" | "diagnostician"): StubScript {
  const parsed = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
  return readScript(file, { harness: "claude", ...parsed, role });
}

/** What the server was started with. */
export type CriticHttpOptions = {
  /** The script of the critic part: one step per invocation index. */
  readonly script: StubScript;
  /** The script of the diagnostician part; a prompt without a nonce is answered from it. */
  readonly diagnostician?: StubScript;
  /** Where the invocation counters live: outside the working directory (§O.3, rule 1). */
  readonly stateDir: string;
  /** Where the transcript is appended; outside the working directory (F141-FR-011). */
  readonly transcript: string;
  readonly host?: string;
  readonly port?: number;
  readonly env?: Readonly<Record<string, string | undefined>>;
};

/** One answered call, as the server recorded it. */
export type CriticHttpCall = {
  readonly shape: RequestShape;
  readonly role: "critic" | "diagnostician";
  readonly call: number;
  readonly nonce?: string;
  readonly completionForm: CompletionForm;
  readonly status: number;
};

/** The started server. */
export type CriticHttpStub = {
  readonly server: Server;
  readonly address: string;
  readonly calls: readonly CriticHttpCall[];
  close: () => Promise<void>;
};

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((done, fail) => {
    const chunks: Buffer[] = [];
    request.on("data", (c: Buffer) => void chunks.push(c));
    request.on("end", () => done(Buffer.concat(chunks).toString("utf8")));
    request.on("error", fail);
  });
}

/**
 * Start the critic stub over HTTP. It answers the two request shapes from one
 * script, takes the nonce from the prompt, and answers a prompt without a nonce
 * from the diagnostician part.
 */
export async function startCriticHttpStub(options: CriticHttpOptions): Promise<CriticHttpStub> {
  const host = options.host ?? "127.0.0.1";
  assertLoopback(host, options.port);
  const calls: CriticHttpCall[] = [];
  const env = options.env ?? {};

  const server = createServer((request: IncomingMessage, response: ServerResponse) => {
    void (async (): Promise<void> => {
      const shape = shapeOfPath(request.url ?? "/");
      if (shape === undefined || request.method !== "POST") {
        response.writeHead(404, { "content-type": "application/json" });
        response.end(JSON.stringify({ error: `no request shape of §O.3 at ${request.url ?? ""}` }));
        return;
      }
      const raw = await readBody(request);
      const body = (raw === "" ? {} : JSON.parse(raw)) as Record<string, unknown>;
      const prompt = promptOfRequest(body);
      const role = roleOfCall(prompt);
      const nonce = nonceFromPrompt(prompt);
      const completionForm = completionFormOf({ tools: body["tools"], env });

      const script = role === "diagnostician" ? options.diagnostician : options.script;
      if (script === undefined) {
        response.writeHead(500, { "content-type": "application/json" });
        response.end(JSON.stringify({ error: "the scenario has no diagnostician part" }));
        return;
      }
      const call = nextInvocation(options.stateDir, role, "claude");
      const step = stepFor(script, call);

      // One record per invocation, the names of the variables and never a value,
      // and the prompt in a form neutral to the transport (F141-FR-011).
      writeTranscriptRecord(options.transcript, {
        role,
        harness: "claude",
        call,
        argv: [request.method, shape],
        envNames: [...environmentNames(env)],
        prompt,
        promptChannel: "request-body",
        ...(step === undefined ? { overrun: true } : { step: { verbs: [...step.verbs] } }),
      });

      if (step === undefined) {
        // A call beyond the last step of the script (F141-FR-005).
        response.writeHead(599, { "content-type": "application/json" });
        response.end(JSON.stringify({ error: "the critic stub was called beyond its script" }));
        calls.push({ shape, role, call, completionForm, status: 599, ...(nonce ? { nonce } : {}) });
        return;
      }

      if (role === "diagnostician") {
        const answer = diagnosticianAnswer(step);
        const payload =
          shape === "messages" ? answerMessages(answer.text) : answerChatCompletions(answer.text);
        response.writeHead(answer.status, { "content-type": "application/json" });
        response.end(JSON.stringify(payload));
        calls.push({ shape, role, call, completionForm, status: answer.status });
        return;
      }

      for (const verb of step.verbs) {
        if (!CRITIC_HTTP_VERBS.includes(verb)) {
          response.writeHead(500, { "content-type": "application/json" });
          response.end(
            JSON.stringify({
              error:
                `${verb} is no verb of the critic stub over HTTP; §O.3 names ` +
                CRITIC_HTTP_VERBS.join(", "),
            }),
          );
          return;
        }
      }
      const reply = replyFor(step.verbs[0] as string, nonce, step.args ?? {});
      if (reply.hang === true) {
        // Never reply: the socket stays open and the caller's own timeout ends it.
        calls.push({ shape, role, call, completionForm, status: 0, ...(nonce ? { nonce } : {}) });
        return;
      }
      const status = reply.failWith ?? 200;
      const choicesNone = reply.choicesNone === true && shape === "chat-completions";
      const payload =
        shape === "messages"
          ? answerMessages(reply.text)
          : answerChatCompletions(reply.text, choicesNone);
      response.writeHead(status, { "content-type": "application/json" });
      response.end(JSON.stringify(payload));
      calls.push({ shape, role, call, completionForm, status, ...(nonce ? { nonce } : {}) });
    })().catch((error: unknown) => {
      response.writeHead(500, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: String(error) }));
    });
  });

  await new Promise<void>((done) => server.listen(options.port ?? 0, host, done));
  const bound = server.address();
  const port = typeof bound === "object" && bound !== null ? bound.port : (options.port ?? 0);
  return {
    server,
    address: `http://${host}:${String(port)}`,
    get calls(): readonly CriticHttpCall[] {
      return calls;
    },
    close: () => new Promise<void>((done) => server.close(() => done())),
  };
}

/**
 * The server as a process: the driver of a side starts it this way, so the stub
 * runs in its own process and the test process never holds its event loop.
 * `ORACLE_CRITIC_HTTP_*` name the script, the counters, the transcript and the
 * port; the address is printed on standard output as one line.
 */
export async function criticHttpMain(
  env: Readonly<Record<string, string | undefined>> = process.env,
): Promise<void> {
  const scriptFile = env["ORACLE_CRITIC_HTTP_SCRIPT"];
  if (scriptFile === undefined) throw new CriticStubError("ORACLE_CRITIC_HTTP_SCRIPT is not set");
  const script = scriptOfFile(scriptFile, "critic-http");
  const diagnosticianFile = env["ORACLE_CRITIC_DIAGNOSTICIAN_SCRIPT"];
  const diagnostician =
    diagnosticianFile === undefined || !existsSync(diagnosticianFile)
      ? undefined
      : scriptOfFile(diagnosticianFile, "diagnostician");
  const stub = await startCriticHttpStub({
    script,
    ...(diagnostician === undefined ? {} : { diagnostician }),
    stateDir: env["ORACLE_STUB_STATE_DIR"] ?? "",
    transcript: env["ORACLE_STUB_TRANSCRIPT"] ?? "",
    port: Number(env["ORACLE_CRITIC_HTTP_PORT"] ?? 0),
    env,
  });
  // The address the stub actually bound, for the driver that started it. The
  // file is the handshake: it appears only once the socket is listening, so the
  // driver never points the run at a port nothing answers.
  const addressFile = env[SERVER_STUB_ADDRESS_FILE];
  if (addressFile !== undefined && addressFile !== "") {
    mkdirSync(dirname(addressFile), { recursive: true });
    writeFileSync(`${addressFile}.tmp`, `${stub.address}\n`, "utf8");
    renameSync(`${addressFile}.tmp`, addressFile);
  }
  process.stdout.write(`${stub.address}\n`);
}

if (process.argv[1] !== undefined && process.argv[1].endsWith("critic-http/server.ts")) {
  await criticHttpMain();
}
