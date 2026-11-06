#!/usr/bin/env node
/**
 * T043 — the telemetry sink stub (F141-FR-009).
 *
 * "Telemetry sink stub (T). One local server that accepts the payloads of the
 * shippers and stores them. Verbs: `accept`, `refuse` with a status code,
 * `down`."
 *
 * The sink is the surface `telemetry` of §O.4: "the payloads at the telemetry
 * sink stub", compared after N-03, N-04 and N-07 (the run id, the timestamps and
 * the process ids). So the sink stores every payload it was handed, in the order
 * it was handed them, with the path it arrived on — and nothing of its own: no
 * time of arrival, no address of the shipper. The oracle consumes
 * `specstride.event-sink/1` here (EP-08) and implements nothing.
 *
 * | Verb | What the sink does |
 * |---|---|
 * | `accept` | stores the payload and answers 204 |
 * | `refuse` | stores nothing and answers the status code the script names |
 * | `down` | does not listen at all, so the shipper's connection is refused |
 */
import { appendFileSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import process from "node:process";

import { assertLoopback } from "../../src/env/guard.ts";
import { SERVER_STUB_ADDRESS_FILE } from "../critic-http/server.ts";
import { verbsOf } from "../lib/script.ts";

/** The three verbs of the telemetry sink stub (`kinds.telemetry-sink`). */
export const SINK_VERBS: readonly string[] = verbsOf("telemetry-sink") ?? [];

/** The status the sink answers an accepted payload with. */
export const ACCEPTED_STATUS = 204 as const;

/** The status `refuse` answers with where the script names none. */
export const DEFAULT_REFUSED_STATUS = 503 as const;

/** A call of the sink stub outside the vocabulary of §O.3. */
export class SinkStubError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SinkStubError";
  }
}

/** One stored payload: the path it arrived on and the body, and nothing else. */
export type StoredPayload = {
  readonly path: string;
  readonly body: string;
};

/** What the sink was started with. */
export type SinkOptions = {
  /** The verb of this run of the sink: one verb for the whole run. */
  readonly verb: string;
  /** The status `refuse` answers with. */
  readonly status?: number;
  /** The file the payloads are stored in, outside the working directory. */
  readonly store?: string;
  readonly host?: string;
  readonly port?: number;
};

/** The started sink. */
export type TelemetrySinkStub = {
  readonly server: Server | undefined;
  readonly address: string;
  readonly payloads: readonly StoredPayload[];
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
 * Start the telemetry sink stub. `down` listens on nothing and gives back an
 * address no one answers at, which is what a shipper sees when its sink is down.
 */
export async function startTelemetrySinkStub(options: SinkOptions): Promise<TelemetrySinkStub> {
  if (!SINK_VERBS.includes(options.verb)) {
    throw new SinkStubError(
      `${options.verb} is no verb of the telemetry sink stub; §O.3 names ${SINK_VERBS.join(", ")}`,
    );
  }
  const host = options.host ?? "127.0.0.1";
  assertLoopback(host, options.port);
  const payloads: StoredPayload[] = [];

  if (options.verb === "down") {
    // No listener: the connection of the shipper is refused. The port is one the
    // sink never binds, so nothing of the machine answers it either.
    return {
      server: undefined,
      address: `http://${host}:${String(options.port ?? 1)}`,
      get payloads(): readonly StoredPayload[] {
        return payloads;
      },
      close: () => Promise.resolve(),
    };
  }

  const server = createServer((request: IncomingMessage, response: ServerResponse) => {
    void (async (): Promise<void> => {
      const body = await readBody(request);
      if (options.verb === "refuse") {
        response.writeHead(options.status ?? DEFAULT_REFUSED_STATUS, {
          "content-type": "text/plain",
        });
        response.end("the telemetry sink stub refused this payload\n");
        return;
      }
      const stored: StoredPayload = { path: request.url ?? "/", body };
      payloads.push(stored);
      if (options.store !== undefined) {
        mkdirSync(dirname(options.store), { recursive: true });
        appendFileSync(options.store, `${JSON.stringify(stored)}\n`, "utf8");
      }
      response.writeHead(ACCEPTED_STATUS);
      response.end();
    })().catch(() => {
      response.writeHead(500);
      response.end();
    });
  });

  await new Promise<void>((done) => server.listen(options.port ?? 0, host, done));
  const bound = server.address();
  const port = typeof bound === "object" && bound !== null ? bound.port : (options.port ?? 0);
  return {
    server,
    address: `http://${host}:${String(port)}`,
    get payloads(): readonly StoredPayload[] {
      return payloads;
    },
    close: () => new Promise<void>((done) => server.close(() => done())),
  };
}

/** The sink as a process, started by the driver of a side. */
export async function sinkMain(
  env: Readonly<Record<string, string | undefined>> = process.env,
): Promise<void> {
  const stub = await startTelemetrySinkStub({
    verb: env["ORACLE_SINK_VERB"] ?? "accept",
    ...(env["ORACLE_SINK_STATUS"] === undefined
      ? {}
      : { status: Number(env["ORACLE_SINK_STATUS"]) }),
    ...(env["ORACLE_SINK_STORE"] === undefined ? {} : { store: env["ORACLE_SINK_STORE"] }),
    port: Number(env["ORACLE_SINK_PORT"] ?? 0),
  });
  // The same handshake as the critic stub over HTTP: the address file appears
  // once the sink is listening, so the driver never points a shipper at a port
  // nothing answers. `down` writes it too — its address is one nobody answers
  // on purpose, and the driver has to know which one that is.
  const addressFile = env[SERVER_STUB_ADDRESS_FILE];
  if (addressFile !== undefined && addressFile !== "") {
    mkdirSync(dirname(addressFile), { recursive: true });
    writeFileSync(`${addressFile}.tmp`, `${stub.address}\n`, "utf8");
    renameSync(`${addressFile}.tmp`, addressFile);
  }
  process.stdout.write(`${stub.address}\n`);
}

if (process.argv[1] !== undefined && process.argv[1].endsWith("sink/server.ts")) {
  await sinkMain();
}
