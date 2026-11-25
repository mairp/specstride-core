/**
 * A quota line from the critic's harness is a pause, not a malformed verdict
 * (`critic-quota.ts`; found by the run of spec 154 on 2026-11-25).
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  callTheCriticThroughQuota,
  criticQuotaWindowOf,
  QUOTA_FALLBACK_WAIT_MS,
  resetsAtOf,
} from "../../src/engine/critic-quota.ts";

const LINE = "You've hit your 5-hour limit · resets 1:10am (Asia/Dubai)";
/** 2026-11-25T20:03:30Z, when the line was recorded. */
const NOW = Date.parse("2026-11-25T20:03:30Z");

test("the line of 2026-11-25 is a quota window, not a verdict", () => {
  const window = criticQuotaWindowOf(LINE, NOW);
  assert.notEqual(window, null);
  assert.equal(window?.quotaClass, "quota_window");
  // 01:10 Asia/Dubai (+04:00) is 21:10Z the same day: 67 minutes after NOW.
  assert.equal(window?.resetsAt, Date.parse("2026-11-25T21:10:00Z"));
  assert.equal(window?.waitMs, Date.parse("2026-11-25T21:10:00Z") - NOW);
});

test("a verdict is not a quota window", () => {
  assert.equal(criticQuotaWindowOf("APPROVED\nThe evidence is complete.", NOW), null);
  assert.equal(criticQuotaWindowOf("REJECTED\nT018 is not done.", NOW), null);
});

test("a window without a reset waits the fallback", () => {
  const window = criticQuotaWindowOf("weekly limit reached, QUOTA: exhausted", NOW);
  assert.notEqual(window, null);
  assert.equal(window?.resetsAt, null);
  assert.equal(window?.waitMs, QUOTA_FALLBACK_WAIT_MS);
});

test("the reset is the next occurrence of the clock time in its zone", () => {
  const zone = "Asia/Dubai";
  // Just after 01:10 in the zone: the next reset is the day after.
  const late = Date.parse("2026-11-25T21:20:00Z");
  assert.equal(resetsAtOf("resets 1:10am (Asia/Dubai)", late), Date.parse("2026-11-26T21:10:00Z"));
  assert.equal(typeof zone, "string");
  // A zone Intl does not know gives null.
  assert.equal(resetsAtOf("resets 1:10am (Mars/Olympus)", NOW), null);
  // Text without a time gives null.
  assert.equal(resetsAtOf("no time here", NOW), null);
});

test("the critic is called again after the wait, with the same prompt", async () => {
  const slept: number[] = [];
  const said: string[] = [];
  const prompts: string[] = [];
  let now = NOW;
  const outcome = await callTheCriticThroughQuota(
    async () => {
      const reply = prompts.length === 0 ? LINE : "APPROVED\nall tasks have evidence";
      prompts.push("the prompt with its nonce");
      return { reply, proof: "pinned" };
    },
    (one) => one.reply,
    {
      now: () => now,
      sleep: async (ms) => {
        slept.push(ms);
        now += ms;
      },
      say: (line) => said.push(line),
      maxWaits: 3,
    },
  );
  assert.equal(outcome.reply.startsWith("APPROVED"), true);
  assert.equal(outcome.proof, "pinned");
  assert.deepEqual(slept, [Date.parse("2026-11-25T21:10:00Z") - NOW]);
  assert.equal(said.length, 1);
  assert.match(said[0] ?? "", /quota_window; waiting 3990s until 2026-11-25T21:10:00.000Z/);
  assert.equal(prompts.length, 2);
});

test("a reply that judges is returned at once, with no wait", async () => {
  let calls = 0;
  const outcome = await callTheCriticThroughQuota(
    async () => {
      calls += 1;
      return "REJECTED\nT019 is missing";
    },
    (one) => one,
    {
      now: () => NOW,
      sleep: async () => assert.fail("no sleep"),
      say: () => undefined,
      maxWaits: 3,
    },
  );
  assert.equal(calls, 1);
  assert.equal(outcome.startsWith("REJECTED"), true);
});

test("the waits are bounded: after maxWaits the last reply stands", async () => {
  let calls = 0;
  let now = NOW;
  const outcome = await callTheCriticThroughQuota(
    async () => {
      calls += 1;
      return LINE;
    },
    (one) => one,
    {
      now: () => now,
      sleep: async (ms) => {
        now += ms;
      },
      say: () => undefined,
      maxWaits: 2,
    },
  );
  assert.equal(outcome, LINE);
  assert.equal(calls, 3);
});
