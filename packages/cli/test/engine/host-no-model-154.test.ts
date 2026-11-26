/**
 * T110 (feature 154, US4) — NO MODEL IS ASKED DURING A WAIT (F154-FR-005,
 * F154-FR-047). With `host.limits` on, a run that waits — for the hold of its
 * account here, and by the same seam for a host slot — is held by the
 * engine and the runtime alone:
 *
 * - the stub harness of the fixture logs EVERY call it answers; while the
 *   hold blocks (now < resetAt) it is called ZERO times: no prompt of the
 *   run asks a model whether to wait, and no harness call sits inside the
 *   wait (the first call of the run comes at or after the hold's reset);
 * - the wait is the pause the engine enters (`paused-quota`, class
 *   `host_slot`), opened and closed by `run.paused`/`run.resumed` — events
 *   only the engine emits;
 * - models do not take or release slots or holds: the hold record the test
 *   wrote still stands at the end of the run with the owner and the reset
 *   the TEST gave it — no model (and no model-driven path) rewrote or
 *   released it, and the only `host.slot.admission` events of the run carry
 *   the engine's own rule names, not anything a model said.
 *
 * The stub errors if it is ever called with a wait decision: it does not
 * know how to answer one, so a model asked during the wait fails the run.
 */
import assert from "node:assert/strict";
import { chmodSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { fixture154 } from "../../../../tests/inertness/154/helpers.ts";

/** A stub that logs every call with `at`, and answers the phase's calls. */
function stubWithAt(): string {
  return `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path");
const argv = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
const session = argv[argv.indexOf("--session-id") + 1];
const critic = argv.includes("--max-turns") || prompt.startsWith("You are the CRITIC");
const role = prompt.includes("Diagnostician") ? "diagnostician" : (critic ? "critic" : "proposer");
const log = path.join(process.env.HOME, "prompts.jsonl");
fs.appendFileSync(log, JSON.stringify({ role, prompt, session, at: new Date().toISOString() }) + "\\n");
// F154-FR-047 — a model is never asked WHETHER TO WAIT. A prompt that asks
// the model about a slot or a hold is the failure this guard exists for.
if (/host\\.slot|hold record|should (we|the run) wait/i.test(prompt)) {
  fs.appendFileSync(path.join(process.env.HOME, "wait-asked.jsonl"), JSON.stringify({ role, prompt }) + "\\n");
  process.exit(3);
}
console.log(JSON.stringify({ type: "system", subtype: "init", tools: critic ? [] : ["Read"], session_id: session }));
if (role === "diagnostician") {
  console.log(JSON.stringify({ type: "result", result: "CASE: GROUNDING\\nName the missing test of T001." }));
} else if (critic) {
  const nonce = (/VERDICT ([0-9a-f]+): APPROVED/.exec(prompt) ?? [])[1] ?? "0";
  console.log(JSON.stringify({ type: "result", result: "T001 judged.\\nVERDICT " + nonce + ": APPROVED" }));
} else {
  const evidence = (/Write your evidence to (\\.specstride\\S+?) \\(/i.exec(prompt) ?? /write (\\.specstride\\S+?):/i.exec(prompt))[1];
  fs.mkdirSync(path.dirname(evidence), { recursive: true });
  fs.writeFileSync(evidence, "T001 done\\n");
  fs.mkdirSync(".specstride/features/001-one/outbox", { recursive: true });
  fs.writeFileSync(
    ".specstride/features/001-one/outbox/u1.checkpoint.json",
    JSON.stringify({ schema: "specstride.checkpoint/1", tasks: ["T001", "T002", "T003"] }),
  );
  const tasks = "specs/001-one/tasks.md";
  fs.writeFileSync(tasks, fs.readFileSync(tasks, "utf8").replaceAll("[ ]", "[x]"));
  console.log(JSON.stringify({ type: "result", result: "ok" }));
}
`;
}

test("a run that waits for a hold asks no model, and models take and release no slot or hold", { timeout: 120_000 }, async () => {
  const { writeHold, readHold } = await import("../../../../packages/runtime/src/limits/hold-record.ts");
  const { userStateRoot } = await import("@specstride/contracts/ids/roots");
  const fixture = fixture154();
  process.env.SPECSTRIDE_HOST_LIMITS = "on";
  // The stub logs the `at` of every call and EXITS if a prompt ever asks it
  // about a slot or a hold.
  const bin = (process.env.PATH ?? "").split(":")[0] ?? "";
  const stub = join(bin, "claude");
  rmSync(stub);
  writeFileSync(stub, stubWithAt());
  chmodSync(stub, 0o755);
  const home = process.env.HOME ?? "";
  const root = userStateRoot({ home, workspaceRealPath: fixture.work, workspaceId: "" });
  const resetAt = new Date(Date.now() + 1_500).toISOString();
  // The hold the TEST wrote, with the owner the TEST chose: if a model or a
  // model-driven path released or rewrote it, the record at the end differs.
  writeHold(root, "default", resetAt, { pid: 999_999, runId: "run-test-writer" });
  const before = readHold(root, "default");
  try {
    const code = await fixture.run();
    assert.equal(code, 0, `the run did not complete: ${fixture.eventTypes().join(",")}`);
    // 1. NO model call during the wait: the first call of the run came at or
    //    after the hold's reset (F154-FR-047).
    const prompts = fixture.prompts() as readonly { role: string; at?: string }[];
    assert.ok(prompts.length >= 1, "the run asked no model at all");
    const firstAt = prompts[0]?.["at"] !== undefined ? Date.parse(String(prompts[0]["at"])) : Number.NaN;
    assert.ok(
      !Number.isNaN(firstAt) && firstAt >= Date.parse(resetAt) - 250,
      `a model was called during the wait: first call at ${String(prompts[0]?.["at"])}, reset at ${resetAt}`,
    );
    // 2. No prompt ever asked a model whether to wait: the stub would have
    //    exited 3 and left a trace (F154-FR-047).
    assert.equal(
      fixture.prompts().some((p) => /host\.slot|hold record|should (we|the run) wait/i.test(p.prompt)),
      false,
      "a prompt asked the model about the wait",
    );
    // 3. The wait is the engine's pause, not a model's decision: exactly one
    //    run.paused with the proposed class, one run.resumed (F154-FR-005).
    const events = fixture.events();
    const paused = events.filter((event) => event.type === "run.paused");
    assert.equal(paused.length, 1, "the wait did not open exactly one pause");
    assert.equal(paused[0]?.data["class"], "host_slot", "the pause does not carry the host_slot class");
    assert.equal(events.filter((event) => event.type === "run.resumed").length, 1, "the resume happened more than once");
    // 4. Models take and release no slot: the ONLY admission events of the
    //    run name the engine's own rules; none carries a model's verdict.
    for (const admission of events.filter((event) => event.type === "host.slot.admission")) {
      const verdict = admission.data["verdict"];
      assert.ok(
        verdict === "admitted" || verdict === "queued" || verdict === "rejected",
        `an admission event carries a non-engine verdict: ${JSON.stringify(admission.data)}`,
      );
    }
    // 5. Models release no hold: the record still stands, with the owner and
    //    the reset the TEST wrote (an early release would delete or rewrite
    //    it before the reset; the run waited, and the record survived it).
    const after = readHold(root, "default");
    assert.ok(after !== null, "the hold record was released during the run");
    assert.equal(after?.["resetAt"], resetAt, "the hold's reset changed during the run");
    assert.equal(after?.["owner"] && (after.owner as Record<string, unknown>)["pid"], 999_999, "the hold's owner changed during the run");
    assert.equal(after?.["resetAt"], before?.["resetAt"], "the hold record was rewritten during the run");
  } finally {
    fixture.restore();
    rmSync(join(home, ".local", "state", "specstride", "user", "holds"), { recursive: true, force: true });
  }
});
