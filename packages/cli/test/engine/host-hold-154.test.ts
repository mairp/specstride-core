/**
 * T107 (feature 154, US4) — THE HOLD OF THE ACCOUNT (F154-FR-041, F154-FR-047,
 * T109). With `host.limits` on, the run's quota wait holds its account and
 * honours the holds it meets:
 *
 * 1. a critic reply that names a quota window writes the hold of the account
 *    ONCE, with the reset the `quota.signal` event names, and the pause is
 *    the state `paused-quota` for the length of the window (class
 *    `quota_window`, the closed-set class);
 * 2. a hold that still blocks (now < resetAt) waits the NEXT run of the same
 *    account through the pause — class `host_slot`, no model asked, the run
 *    proceeds only once the hold's reset has passed;
 * 3. a hold whose writer died is NOT reclaimed early: the wait ends at the
 *    hold's reset and the hold record still stands afterwards.
 */
import assert from "node:assert/strict";
import { chmodSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { fixture154 } from "../../../../tests/inertness/154/helpers.ts";

/** The holds directory the engine binds (T109): `userStateRoot/holds`. */
function holdsRootOf(home: string): string {
  return join(home, ".local", "state", "specstride", "user", "holds");
}

/** The hold record of one account, or null. */
function holdOf(home: string, account: string): Record<string, unknown> | null {
  const file = join(holdsRootOf(home), `${account}.json`);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
}

/** A stub that answers the FIRST critic call with a quota window, then judges. */
function quotaThenVerdictStub(): string {
  return `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path");
const argv = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
const session = argv[argv.indexOf("--session-id") + 1];
const critic = argv.includes("--max-turns") || prompt.startsWith("You are the CRITIC");
const role = prompt.includes("Diagnostician") ? "diagnostician" : (critic ? "critic" : "proposer");
const log = path.join(process.env.HOME, "prompts.jsonl");
fs.appendFileSync(log, JSON.stringify({ role, prompt, session, at: new Date().toISOString() }) + "\\n");
console.log(JSON.stringify({ type: "system", subtype: "init", tools: critic ? [] : ["Read"], session_id: session }));
if (role === "diagnostician") {
  console.log(JSON.stringify({ type: "result", result: "CASE: GROUNDING\\nName the missing test of T001." }));
} else if (critic) {
  const calls = fs.existsSync(log + ".calls") ? Number(fs.readFileSync(log + ".calls", "utf8")) : 0;
  fs.writeFileSync(log + ".calls", String(calls + 1));
  if (calls === 0) {
    // A quota window with a reset ~100 seconds out, in UTC (the 2026-11-25
    // format: resets 1:10am (Asia/Dubai)). Far enough out that the minute the
    // parser reads is still AHEAD of the run — a window a few seconds out
    // rounds down to the current minute, and the next occurrence of that
    // minute is tomorrow.
    const at = new Date(Date.now() + 100_000);
    const hh = String(at.getUTCHours() % 12 === 0 ? 12 : at.getUTCHours() % 12);
    const mm = String(at.getUTCMinutes()).padStart(2, "0");
    const ampm = at.getUTCHours() < 12 ? "am" : "pm";
    console.log(JSON.stringify({ type: "result", result: "You've hit your 5-hour limit \\u00b7 resets " + hh + ":" + mm + ampm + " (UTC)" }));
  } else {
    const nonce = (/VERDICT ([0-9a-f]+): APPROVED/.exec(prompt) ?? [])[1] ?? "0";
    console.log(JSON.stringify({ type: "result", result: "T001 judged.\\nVERDICT " + nonce + ": APPROVED" }));
  }
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

/**
 * The fixture's plain stub, with the `at` of every call logged: the hold
 * scenarios read WHEN the first model call happened, to prove the wait
 * happened before it (F154-FR-047 — no model asked during the wait).
 */
function plainStubWithAt(): string {
  return `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path");
const argv = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
const session = argv[argv.indexOf("--session-id") + 1];
const critic = argv.includes("--max-turns") || prompt.startsWith("You are the CRITIC");
const role = prompt.includes("Diagnostician") ? "diagnostician" : (critic ? "critic" : "proposer");
const log = path.join(process.env.HOME, "prompts.jsonl");
fs.appendFileSync(log, JSON.stringify({ role, prompt, session, at: new Date().toISOString() }) + "\\n");
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

/** Install one stub over the fixture's `claude` on PATH. */
function installStub(stubSource: string): void {
  const bin = (process.env.PATH ?? "").split(":")[0] ?? "";
  const stub = join(bin, "claude");
  rmSync(stub);
  writeFileSync(stub, stubSource);
  chmodSync(stub, 0o755);
}

test(
  "a critic quota window writes the hold of the account once, with the signalled reset",
  { timeout: 120_000 },
  async () => {
    const fixture = fixture154();
    process.env.SPECSTRIDE_HOST_LIMITS = "on";
    // The quota-then-verdict critic goes where the fixture's stub stands.
    installStub(quotaThenVerdictStub());
    try {
      const code = await fixture.run();
      assert.equal(code, 0, `the run did not complete: ${fixture.eventTypes().join(",")}`);
      const events = fixture.events();
      const signals = events.filter((event) => event.type === "quota.signal");
      assert.ok(signals.length >= 1, "no quota.signal opened the window");
      const resetsAt = signals[0]?.data["resetsAt"];
      assert.ok(typeof resetsAt === "string" && resetsAt !== "", "quota.signal names no reset");
      // The hold of the account, written ONCE, with that reset.
      const hold = holdOf(process.env.HOME ?? "", "default");
      assert.ok(hold !== null, "no hold was written for the account");
      assert.equal(
        hold?.["resetAt"],
        resetsAt,
        "the hold's reset differs from the signalled reset",
      );
      assert.equal(hold?.["schema"], "specstride.host-hold/1", "the hold record names no schema");
      // The window paused the run and the run resumed exactly once.
      assert.equal(
        events.filter((event) => event.type === "run.paused").length,
        1,
        "the pause opened more than once",
      );
      assert.equal(
        events.filter((event) => event.type === "run.resumed").length,
        1,
        "the resume happened more than once",
      );
      // The critic was called again after the window and its verdict stood.
      const calls = Number(
        readFileSync(join(process.env.HOME ?? "", "prompts.jsonl.calls"), "utf8"),
      );
      assert.equal(calls, 2, "the critic was not called again after the window");
      assert.equal(
        fixture.prompts().filter((p) => p.role === "critic").length,
        2,
        "the critic prompt count differs",
      );
    } finally {
      fixture.restore();
    }
  },
);

test(
  "a hold that still blocks waits the next run of the same account through the pause",
  { timeout: 120_000 },
  async () => {
    const { writeHold, readHold } =
      await import("../../../../packages/runtime/src/limits/hold-record.ts");
    const { userStateRoot } = await import("@specstride/contracts/ids/roots");
    const fixture = fixture154();
    process.env.SPECSTRIDE_HOST_LIMITS = "on";
    installStub(plainStubWithAt());
    const home = process.env.HOME ?? "";
    const root = userStateRoot({ home, workspaceRealPath: fixture.work, workspaceId: "" });
    const resetAt = new Date(Date.now() + 1_500).toISOString();
    // A hold from a PREVIOUS process of the same account (this pid stands for
    // it; scenario 3 covers the dead writer).
    writeHold(root, "default", resetAt, { pid: process.pid, runId: "run-previous" });
    try {
      const code = await fixture.run();
      assert.equal(code, 0, "the run did not complete once the hold's reset passed");
      const events = fixture.events();
      const paused = events.filter((event) => event.type === "run.paused");
      assert.equal(paused.length, 1, "the hold wait did not open exactly one pause");
      assert.equal(
        (paused[0]?.data["resetsAt"] as string | undefined) ?? null,
        resetAt,
        "the hold wait's pause names a different reset",
      );
      const resumed = events.filter((event) => event.type === "run.resumed");
      assert.equal(resumed.length, 1, "the resume happened more than once");
      assert.ok(
        typeof resumed[0]?.data["pausedMs"] === "number" &&
          (resumed[0].data["pausedMs"] as number) > 0,
        "run.resumed carries no paused milliseconds",
      );
      // No model was asked while the hold blocked: the FIRST prompt of the run
      // came at or after the hold's reset.
      const prompts = fixture.prompts() as readonly { role: string; at?: string }[];
      assert.ok(prompts.length >= 1, "the run asked no model at all");
      assert.ok(prompts[0]?.role === "proposer", "the first prompt is not the proposer's");
      const firstAt =
        prompts[0]?.["at"] !== undefined ? Date.parse(String(prompts[0]["at"])) : Number.NaN;
      assert.ok(
        !Number.isNaN(firstAt) && firstAt >= Date.parse(resetAt) - 250,
        `the first prompt preceded the hold's reset: ${String(prompts[0]?.["at"])} < ${resetAt}`,
      );
      // The pause record is gone and the hold stands.
      assert.equal(
        events.filter((event) => event.type === "quota.signal").length,
        1,
        "the hold wait signalled more than once",
      );
      assert.ok(readHold(root, "default") !== null, "the hold record vanished during the wait");
    } finally {
      fixture.restore();
      rmSync(join(holdsRootOf(home)), { recursive: true, force: true });
    }
  },
);

test(
  "a hold whose writer died is not reclaimed early; the wait ends at the hold's reset",
  { timeout: 120_000 },
  async () => {
    const { spawn } = await import("node:child_process");
    const { writeHold, readHold } =
      await import("../../../../packages/runtime/src/limits/hold-record.ts");
    const { userStateRoot } = await import("@specstride/contracts/ids/roots");
    const fixture = fixture154();
    process.env.SPECSTRIDE_HOST_LIMITS = "on";
    installStub(plainStubWithAt());
    const home = process.env.HOME ?? "";
    const root = userStateRoot({ home, workspaceRealPath: fixture.work, workspaceId: "" });
    const resetAt = new Date(Date.now() + 1_500).toISOString();
    // The dead writer: a process that exits at once, leaving its pid behind.
    const dead = spawnSync2(spawn);
    writeHold(root, "default", resetAt, { pid: dead, runId: "run-dead-writer" });
    try {
      const code = await fixture.run();
      assert.equal(code, 0, "the run did not complete once the hold's reset passed");
      const prompts = fixture.prompts() as readonly { role: string; at?: string }[];
      const firstAt =
        prompts[0]?.["at"] !== undefined ? Date.parse(String(prompts[0]["at"])) : Number.NaN;
      assert.ok(
        !Number.isNaN(firstAt) && firstAt >= Date.parse(resetAt) - 250,
        `the dead writer's hold was cleared before its reset: first prompt at ${String(prompts[0]?.["at"])}, reset at ${resetAt}`,
      );
      // The hold record still stands after the run: expiry, never an early
      // reclaim, let the run through.
      const hold = readHold(root, "default");
      assert.ok(hold !== null, "the dead writer's hold record was removed");
      assert.equal(
        new Date(hold?.["resetAt"] as string).toISOString(),
        resetAt,
        "the hold record changed",
      );
      assert.ok(
        Date.parse(new Date().toISOString()) >= Date.parse(resetAt),
        "the run ended before the hold's reset",
      );
    } finally {
      fixture.restore();
      rmSync(join(holdsRootOf(home)), { recursive: true, force: true });
    }
  },
);

/** A pid of a process that has already exited. */
function spawnSync2(spawn: typeof import("node:child_process").spawn): number {
  const child = spawn("true");
  return child.pid ?? 1;
}
