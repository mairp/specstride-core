/**
 * T096 (feature 154, US4) — THE `sessions/<account>` BOUND THROUGH THE
 * ENGINE (F154-FR-040). The proposer pass of a start takes the
 * `sessions/<account>` slot before its pass loop runs and releases it when
 * the pass ends, so one host never runs more concurrent sessions of one
 * account than the bound allows:
 * - three seam takes under `SPECSTRIDE_HOST_SESSIONS_DEFAULT=2`: the first
 *   two acquire, the third waits until one of them releases;
 * - an engine run with the bound set records `host.slot.admission` events
 *   for the rule `sessions/default`;
 * - a non-positive-integer bound is refused and the run proceeds unbounded.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import test from "node:test";

import { fixture154 } from "../../../../tests/inertness/154/helpers.ts";

const CLI = join(dirname(fileURLToPath(import.meta.url)), "../../bin/specstride");

type Event = { type: string; at?: string; data: Record<string, unknown> };

/** Every event of every run under the fixture home, in file order. */
function eventsUnderHome(home: string): Event[] {
  const all: Event[] = [];
  const walk = (dir: string): void => {
    let entries: string[] = [];
    try {
      entries = readdirSync(dir).sort();
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry);
      if (entry === "events.jsonl") {
        for (const line of readFileSync(full, "utf8").split("\n")) {
          if (line.trim() !== "") all.push(JSON.parse(line) as Event);
        }
      } else {
        walk(full);
      }
    }
  };
  walk(home);
  return all;
}

test("three takes under a sessions bound of two hold two and the third waits", async () => {
  // The engine's own seam, driven directly: the same `take` the proposer
  // pass of every start call wraps its pass loop in.
  const { makeRunHostSlots } = await import("../../src/engine/host-slots.ts");
  const admissions: string[] = [];
  const slotsHome = mkdtempSync(join(tmpdir(), "specstride-sessions-seam-"));
  const slots = makeRunHostSlots({
    home: slotsHome,
    workdir: process.cwd(),
    env: { SPECSTRIDE_HOST_SESSIONS_DEFAULT: "2" },
    limitsOn: true,
  });
  try {
    const first = await slots.take("sessions/default", (admission) =>
      admissions.push(admission.verdict),
    );
    const second = await slots.take("sessions/default", (admission) =>
      admissions.push(admission.verdict),
    );
    assert.ok(first !== null, "the first session take did not acquire");
    assert.ok(second !== null, "the second session take did not acquire");
    let thirdAcquired = false;
    const third = slots.take("sessions/default", (admission) =>
      admissions.push(admission.verdict),
    );
    const probe = await Promise.race([
      third.then((release) => {
        thirdAcquired = release !== null;
        return "acquired";
      }),
      new Promise((resolve) => setTimeout(() => resolve("timeout"), 300)),
    ]);
    assert.equal(probe, "timeout", "the third session take acquired past the bound");
    assert.equal(thirdAcquired, false);
    await first?.();
    const release = await Promise.race([
      third,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
    ]);
    assert.ok(release !== null, "the third session take never acquired after a release");
    assert.equal(admissions.filter((verdict) => verdict === "take").length, 3);
    assert.ok(admissions.includes("wait"), "no `wait` admission while both sessions were held");
    await release;
    await second?.();
  } finally {
    rmSync(slotsHome, { recursive: true, force: true });
  }
});

test("an engine run with a sessions bound records admissions for the account rule", async () => {
  const fixture = fixture154();
  const home = process.env.HOME ?? join(tmpdir(), "specstride-host-sessions-home");
  try {
    const exit = await new Promise<number>((done) => {
      const child = spawn(process.execPath, [CLI, "run"], {
        cwd: fixture.work,
        env: {
          ...process.env,
          SPECSTRIDE_HOST_LIMITS: "on",
          SPECSTRIDE_HOST_SESSIONS_DEFAULT: "1",
        },
        stdio: ["ignore", "ignore", "pipe"],
      });
      child.on("close", (code) => done((code ?? 1) as number));
    });
    assert.equal(exit, 0, `the run ended ${String(exit)}`);
    const events = eventsUnderHome(home);
    assert.ok(
      events.some(
        (event) =>
          event.type === "host.slot.admission" && event.data.rule === "sessions/default",
      ),
      "no `host.slot.admission` event for the rule `sessions/default` was recorded",
    );
  } finally {
    fixture.restore();
  }
});

test("a non-positive sessions bound is refused and the run proceeds", async () => {
  const { makeRunHostSlots } = await import("../../src/engine/host-slots.ts");
  const slotsHome = mkdtempSync(join(tmpdir(), "specstride-sessions-refused-"));
  const slots = makeRunHostSlots({
    home: slotsHome,
    workdir: process.cwd(),
    env: { SPECSTRIDE_HOST_SESSIONS_DEFAULT: "0" },
    limitsOn: true,
  });
  try {
    assert.ok(
      slots.refusals.some((refusal) => refusal.includes("SPECSTRIDE_HOST_SESSIONS_DEFAULT")),
      "the zero bound was not refused",
    );
    const admissions: string[] = [];
    const release = await slots.take("sessions/default", (admission) =>
      admissions.push(admission.verdict),
    );
    assert.equal(release, null, "a refused bound still gated the take");
    assert.deepEqual(admissions, ["unbounded"], "the refused bound did not answer `unbounded`");
  } finally {
    rmSync(slotsHome, { recursive: true, force: true });
  }
});
