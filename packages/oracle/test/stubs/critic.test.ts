/**
 * CT-141-108 — the critic stub (T028, T040, T041; F141-FR-008).
 *
 * What the test proves. The HTTP half starts the REAL server of
 * `packages/oracle/stubs/critic-http/server.ts` on loopback and calls it with
 * `fetch`; the CLI half calls the real answerer.
 *
 * - **two request shapes over HTTP and the CLI**: `/v1/messages` and
 *   `/v1/chat/completions` are both answered, from ONE script, and the same script
 *   answers over a command line; a path that is neither shape is refused;
 * - **the verbs**: the eight of the HTTP form and the eight of the CLI form are
 *   exactly those of `data/stub-vocabulary.json`, they differ by one on each side
 *   (`http-error` over HTTP, `exit` as a CLI), and a verb of the wrong form is
 *   refused by name;
 * - **the nonce comes from the prompt**: the verdict line carries the nonce of the
 *   prompt of THAT call and the script never holds one; `malformed-wrong-nonce`
 *   answers with another one, which is the behaviour the reference is compared on;
 * - **both forms of the `completion` level**: tool-less and read-only-tools are
 *   recorded per call and change nothing in the script;
 * - **a prompt without a nonce is the diagnostician**: such a call is answered from
 *   the diagnostician part, with its own two verbs, and a verb of the critic is
 *   refused there;
 * - **the argument `choices: none` of `empty` in the second request shape**: the
 *   reply holds an empty list of choices, and only in that shape.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  CHOICES_NONE,
  REQUEST_SHAPES,
  SHAPE_PATHS,
  answerChatCompletions,
  answerMessages,
  promptOfRequest,
  scriptOfFile,
  shapeOfPath,
  startCriticHttpStub,
} from "../../stubs/critic-http/server.ts";
import {
  COMPLETION_FORMS,
  CRITIC_CLI_VERBS,
  CRITIC_HTTP_VERBS,
  DIAGNOSTICIAN_VERBS,
  CriticStubError,
  VERDICT_LINE,
  answerAsCli,
  completionFormOf,
  isDiagnosticianCall,
  nonceFromPrompt,
  replyFor,
  roleNamedByThePrompt,
  roleOfCall,
  roleOfPrompt,
} from "../../stubs/lib/critic-cli.ts";
import { readTranscript } from "../../stubs/lib/transcript.ts";

const PACKAGE = resolve(dirname(dirname(dirname(fileURLToPath(import.meta.url)))));
const VOCABULARY = JSON.parse(readFileSync(join(PACKAGE, "data/stub-vocabulary.json"), "utf8")) as {
  kinds: Record<
    string,
    {
      verbs: string[];
      requestShapes?: string[];
      arguments?: Record<string, Record<string, unknown>>;
      recognizedBy?: string;
    }
  >;
};

const NONCE = "0123456789abcdef";
const PROMPT = (nonce = NONCE): string =>
  `Judge the evidence.\nEnd with the single line \`${VERDICT_LINE(nonce, "APPROVED")}\`.`;

/** A script of the critic part, as a fixture holds it: no nonce, no time, no path. */
const script = (steps: { verbs: string[]; args?: Record<string, unknown> }[]) => ({
  role: "critic-http",
  harness: "claude",
  steps,
});

/** Start the stub, run a body of work against it, and close it. */
async function withTheStub(
  steps: { verbs: string[]; args?: Record<string, unknown> }[],
  body: (
    stub: Awaited<ReturnType<typeof startCriticHttpStub>>,
    transcript: string,
  ) => Promise<void>,
  options: {
    diagnostician?: { verbs: string[]; args?: Record<string, unknown> }[];
    env?: Record<string, string>;
  } = {},
): Promise<void> {
  const root = mkdtempSync(join(tmpdir(), "oracle-critic-"));
  const transcript = join(root, "transcript.jsonl");
  const stub = await startCriticHttpStub({
    script: script(steps) as never,
    ...(options.diagnostician === undefined
      ? {}
      : {
          diagnostician: {
            role: "diagnostician",
            harness: "claude",
            steps: options.diagnostician,
          } as never,
        }),
    stateDir: join(root, "stub-state"),
    transcript,
    ...(options.env === undefined ? {} : { env: options.env }),
  });
  try {
    await body(stub, transcript);
  } finally {
    await stub.close();
  }
}

const ask = async (
  address: string,
  shape: "messages" | "chat-completions",
  prompt: string,
  extra: Record<string, unknown> = {},
): Promise<{ status: number; body: Record<string, unknown> }> => {
  const response = await fetch(`${address}${SHAPE_PATHS[shape]}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: prompt }], ...extra }),
  });
  return { status: response.status, body: (await response.json()) as Record<string, unknown> };
};

test("CT-141-108: the two request shapes of §O.3, and their paths", () => {
  assert.deepEqual([...REQUEST_SHAPES], VOCABULARY.kinds["critic-http"]?.requestShapes);
  assert.deepEqual([...REQUEST_SHAPES], ["messages", "chat-completions"]);
  assert.equal(shapeOfPath("/v1/messages"), "messages");
  assert.equal(shapeOfPath("/v1/chat/completions?stream=false"), "chat-completions");
  assert.equal(shapeOfPath("/v1/embeddings"), undefined);
  // The prompt is read out of either shape's body, text blocks included.
  assert.equal(promptOfRequest({ messages: [{ role: "user", content: "p" }] }), "p");
  assert.equal(
    promptOfRequest({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "a" },
            { type: "text", text: "b" },
          ],
        },
      ],
    }),
    "ab",
  );
});

test("CT-141-108: the verbs of the HTTP form and of the CLI form", () => {
  assert.deepEqual([...CRITIC_HTTP_VERBS], VOCABULARY.kinds["critic-http"]?.verbs);
  assert.deepEqual([...CRITIC_CLI_VERBS], VOCABULARY.kinds["critic-cli"]?.verbs);
  assert.deepEqual([...DIAGNOSTICIAN_VERBS], VOCABULARY.kinds["diagnostician"]?.verbs);
  assert.deepEqual([...DIAGNOSTICIAN_VERBS], ["hint", "fail"]);
  // They differ by exactly one verb on each side: how a call FAILS differs with the
  // transport, and nothing else does.
  assert.deepEqual(
    CRITIC_HTTP_VERBS.filter((v) => !CRITIC_CLI_VERBS.includes(v)),
    ["http-error"],
  );
  assert.deepEqual(
    CRITIC_CLI_VERBS.filter((v) => !CRITIC_HTTP_VERBS.includes(v)),
    ["exit"],
  );
});

test("CT-141-108: one script answers both request shapes over HTTP", async () => {
  await withTheStub(
    [{ verbs: ["approve"] }, { verbs: ["reject"], args: { ids: ["T001", "T002"] } }],
    async (stub, transcript) => {
      const first = await ask(stub.address, "messages", PROMPT());
      assert.equal(first.status, 200);
      assert.match(JSON.stringify(first.body), /VERDICT 0123456789abcdef: APPROVED/);
      // The SECOND shape, answered from the SECOND step of the same script.
      const second = await ask(stub.address, "chat-completions", PROMPT("fedcba9876543210"));
      assert.equal(second.status, 200);
      const choices = second.body["choices"] as { message: { content: string } }[];
      assert.match(choices[0]?.message.content ?? "", /VERDICT fedcba9876543210: REJECTED/);
      assert.match(choices[0]?.message.content ?? "", /T001, T002/);
      // One record per invocation, in the order of the calls.
      const records = readTranscript(transcript);
      assert.deepEqual(
        records.map((r) => r.call),
        [1, 2],
      );
      assert.deepEqual(
        records.map((r) => r.role),
        ["critic", "critic"],
      );
      // Transport-neutral: the record names the shape in the argument list, which the
      // comparator leaves out for a critic.
      assert.deepEqual(
        stub.calls.map((c) => c.shape),
        ["messages", "chat-completions"],
      );
    },
  );
  // A path that is neither shape is refused.
  await withTheStub([{ verbs: ["approve"] }], async (stub) => {
    const response = await fetch(`${stub.address}/v1/embeddings`, { method: "POST", body: "{}" });
    assert.equal(response.status, 404);
  });
});

test("CT-141-108: the same script answers over the CLI", () => {
  const said: string[] = [];
  const out = {
    stdout: (t: string): void => void said.push(`out:${t}`),
    stderr: (t: string): void => void said.push(`err:${t}`),
  };
  assert.equal(answerAsCli(["approve"], PROMPT(), {}, out), 0);
  assert.ok(said[0]?.includes(`VERDICT ${NONCE}: APPROVED`));
  said.length = 0;
  assert.equal(answerAsCli(["reject"], PROMPT(), { ids: ["T003"] }, out), 0);
  assert.ok(said[0]?.includes(`VERDICT ${NONCE}: REJECTED`));
  // `exit` is the CLI's own way of failing a call, on the stream it names.
  said.length = 0;
  assert.equal(answerAsCli(["exit"], PROMPT(), { code: 2 }, out), 2);
  assert.ok(said[0]?.startsWith("err:"));
  // And `http-error`, the HTTP form's own verb, is refused as a CLI.
  assert.throws(
    () => answerAsCli(["http-error"], PROMPT(), {}, out),
    (error: unknown) =>
      error instanceof CriticStubError &&
      /http-error is no verb of the critic part of the critic stub as a CLI/.test(error.message),
  );
});

test("CT-141-108: the role a prompt names is what tells the roles apart", () => {
  assert.equal(roleNamedByThePrompt("You are the CRITIC (an automated approval gate)"), "critic");
  assert.equal(
    roleNamedByThePrompt("You are the DIAGNOSTICIAN in an automated loop"),
    "diagnostician",
  );
  assert.equal(roleNamedByThePrompt("You are the PROPOSER in an automated loop"), "proposer");
  assert.equal(roleNamedByThePrompt("You are the ACCELERATOR in an automated loop"), "proposer");
  assert.equal(roleNamedByThePrompt("a prompt that names no role"), undefined);
});

test("CT-141-108: the nonce comes from the prompt and never from the script", () => {
  assert.equal(nonceFromPrompt(PROMPT()), NONCE);
  assert.equal(nonceFromPrompt("VERDICT abcdefabcdefabcd: REJECTED"), "abcdefabcdefabcd");
  assert.equal(nonceFromPrompt("no nonce in this prompt"), undefined);
  // The reply of `approve` is built from the nonce it was given; two calls with two
  // prompts give two verdict lines.
  assert.match(replyFor("approve", NONCE).text, new RegExp(`VERDICT ${NONCE}: APPROVED`));
  assert.match(replyFor("approve", "fedcba9876543210").text, /VERDICT fedcba9876543210: APPROVED/);
  // A verb that needs a nonce and got none is refused, so the two parts of the
  // script can never answer for each other.
  for (const verb of ["approve", "reject", "malformed-duplicate"]) {
    assert.throws(() => replyFor(verb, undefined), CriticStubError, verb);
  }
  // `malformed-wrong-nonce` answers with ANOTHER nonce: that is the behaviour under
  // test, and it is the only place a nonce is a constant.
  assert.match(replyFor("malformed-wrong-nonce", NONCE).text, /VERDICT 0123456789abcdef/);
  assert.doesNotMatch(
    replyFor("malformed-wrong-nonce", "aaaaaaaaaaaaaaaa").text,
    /aaaaaaaaaaaaaaaa/,
  );
  // `malformed-none` gives no verdict line at all; `malformed-duplicate` gives two.
  assert.doesNotMatch(replyFor("malformed-none", NONCE).text, /VERDICT/);
  assert.equal(replyFor("malformed-duplicate", NONCE).text.match(/VERDICT/g)?.length, 2);
});

test("CT-141-108: both forms of the `completion` level, recorded per call", async () => {
  assert.deepEqual([...COMPLETION_FORMS], ["tool-less", "read-only-tools"]);
  assert.equal(completionFormOf({}), "tool-less");
  assert.equal(completionFormOf({ tools: [] }), "tool-less");
  assert.equal(completionFormOf({ tools: [{ name: "read" }] }), "read-only-tools");
  assert.equal(completionFormOf({ env: { SPECSTRIDE_CRITIC_TOOLS: "read" } }), "read-only-tools");
  // The form changes nothing in the script: the same step answers both.
  await withTheStub([{ verbs: ["approve"] }, { verbs: ["approve"] }], async (stub) => {
    const toolLess = await ask(stub.address, "messages", PROMPT());
    const withTools = await ask(stub.address, "messages", PROMPT(), { tools: [{ name: "read" }] });
    assert.equal(toolLess.status, 200);
    assert.equal(withTools.status, 200);
    assert.deepEqual(
      stub.calls.map((c) => c.completionForm),
      ["tool-less", "read-only-tools"],
    );
    // And the verdict is the same one.
    assert.equal(JSON.stringify(toolLess.body), JSON.stringify(withTools.body));
  });
});

test("CT-141-108: a prompt without a nonce is the diagnostician", async () => {
  assert.equal(VOCABULARY.kinds["diagnostician"]?.recognizedBy, "a prompt without a nonce");
  assert.ok(isDiagnosticianCall("the unmet set changed; say what is missing"));
  assert.equal(roleOfCall("the unmet set changed"), "diagnostician");
  assert.equal(roleOfCall(PROMPT()), "critic");

  // The prompt the Specstride baseline actually sends: it NAMES the role, and it
  // QUOTES the verdict line of the rejection it is asked about. The quoted line is
  // not this call's verdict contract, so the word VERDICT is not what tells the two
  // roles apart — the role the prompt names is.
  const asTheBaselineSendsIt =
    "You are the DIAGNOSTICIAN in an automated spec-driven loop — NOT the\n" +
    "critic and NOT the proposer. A critic has REJECTED phase 1 at least once.\n\n" +
    "These are not met: T001.\n" +
    `VERDICT ${NONCE}: REJECTED\n`;
  assert.ok(isDiagnosticianCall(asTheBaselineSendsIt));
  assert.equal(roleOfCall(asTheBaselineSendsIt), "diagnostician");
  assert.equal(roleOfPrompt(asTheBaselineSendsIt), "diagnostician");
  assert.equal(nonceFromPrompt(asTheBaselineSendsIt), undefined);
  // The accelerator prompt carries the archived evidence and the feedback, so it
  // quotes a verdict line too; it is a proposer pass.
  const accelerator =
    "You are the ACCELERATOR in an automated spec-driven loop. A previous attempt at\n" +
    `this phase was REJECTED.\n\nVERDICT ${NONCE}: REJECTED\n`;
  assert.equal(roleOfPrompt(accelerator), "proposer");
  assert.ok(!isDiagnosticianCall(PROMPT()));
  assert.equal(roleOfPrompt(PROMPT()), "critic");

  await withTheStub(
    [{ verbs: ["approve"] }],
    async (stub, transcript) => {
      const hinted = await ask(stub.address, "messages", "the unmet set changed; what is missing?");
      assert.equal(hinted.status, 200);
      assert.match(JSON.stringify(hinted.body), /cites no file/);
      // The record says it was the diagnostician, and the critic's own counter was
      // not spent on it.
      const records = readTranscript(transcript);
      assert.deepEqual(
        records.map((r) => r.role),
        ["diagnostician"],
      );
      assert.deepEqual(
        records.map((r) => r.call),
        [1],
      );
      assert.deepEqual(
        stub.calls.map((c) => c.role),
        ["diagnostician"],
      );
      // The critic's first step is still unspent: the next critic call gets it.
      const judged = await ask(stub.address, "messages", PROMPT());
      assert.match(JSON.stringify(judged.body), /APPROVED/);
    },
    { diagnostician: [{ verbs: ["hint"] }] },
  );

  // A verb of the critic is refused in the diagnostician part.
  assert.throws(
    () => answerAsCli(["approve"], "no nonce here"),
    (error: unknown) =>
      error instanceof CriticStubError &&
      /approve is no verb of the diagnostician part/.test(error.message),
  );
  // And a scenario with no diagnostician part says so rather than answering.
  await withTheStub([{ verbs: ["approve"] }], async (stub) => {
    const response = await fetch(`${stub.address}${SHAPE_PATHS.messages}`, {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "no nonce" }] }),
    });
    assert.equal(response.status, 500);
    assert.match(JSON.stringify(await response.json()), /no diagnostician part/);
  });
});

test("CT-141-108: `choices: none` of `empty`, in the second request shape only", async () => {
  assert.equal(CHOICES_NONE, "none");
  assert.deepEqual(VOCABULARY.kinds["critic-http"]?.arguments?.["empty"]?.["choices"], ["none"]);
  assert.equal(replyFor("empty", NONCE, { choices: "none" }).choicesNone, true);
  assert.equal(replyFor("empty", NONCE).choicesNone, false);
  // The body of the second shape with an empty list of choices, which the baseline
  // reports as "empty choices".
  assert.deepEqual(answerChatCompletions("", true), { choices: [] });
  assert.deepEqual(answerMessages(""), { content: [], stop_reason: "end_turn" });

  await withTheStub(
    [
      { verbs: ["empty"], args: { choices: "none" } },
      { verbs: ["empty"], args: { choices: "none" } },
    ],
    async (stub) => {
      const second = await ask(stub.address, "chat-completions", PROMPT());
      assert.deepEqual(second.body, { choices: [] });
      // The FIRST shape has no list of choices at all, so the argument does nothing
      // there: the reply is the empty content of that shape.
      const first = await ask(stub.address, "messages", PROMPT());
      assert.deepEqual(first.body, { content: [], stop_reason: "end_turn" });
    },
  );
});

test("CT-141-108: `http-error` answers with the status the script names", async () => {
  await withTheStub([{ verbs: ["http-error"], args: { status: 503 } }], async (stub) => {
    const response = await ask(stub.address, "messages", PROMPT());
    assert.equal(response.status, 503);
  });
});

test("CT-141-108: a call beyond the last step of the script is the overrun", async () => {
  await withTheStub([{ verbs: ["approve"] }], async (stub, transcript) => {
    await ask(stub.address, "messages", PROMPT());
    const beyond = await ask(stub.address, "messages", PROMPT());
    assert.equal(beyond.status, 599);
    assert.match(JSON.stringify(beyond.body), /beyond its script/);
    const records = readTranscript(transcript);
    assert.equal(records[1]?.overrun, true);
  });
});

test("CT-141-108: the script of a role is read from the file the driver wrote", () => {
  const root = mkdtempSync(join(tmpdir(), "oracle-critic-script-"));
  const file = join(root, "critic-http.json");
  writeFileSync(file, JSON.stringify({ steps: [{ verbs: ["approve"] }] }), "utf8");
  // The file the driver writes holds the steps and no role; the role is the kind of
  // the file the driver named.
  const parsed = scriptOfFile(file, "critic-http");
  assert.equal(parsed.role, "critic-http");
  assert.deepEqual([...(parsed.steps[0]?.verbs ?? [])], ["approve"]);
  // And a diagnostician file is read as the diagnostician, whose verbs differ.
  const other = join(root, "diagnostician.json");
  writeFileSync(other, JSON.stringify({ steps: [{ verbs: ["hint"] }] }), "utf8");
  assert.equal(scriptOfFile(other, "diagnostician").role, "diagnostician");
});
