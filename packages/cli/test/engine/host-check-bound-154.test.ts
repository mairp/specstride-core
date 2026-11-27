/**
 * T094 (feature 154, US4) — THE `host.checks.concurrent` BOUND THROUGH THE
 * ENGINE (F154-FR-039). With `host.limits` on (the environment name of the
 * catalogue key) and `SPECSTRIDE_HOST_CHECKS_CONCURRENT=1`, two engine runs
 * over two workspaces of ONE home — two PROCESSES, the way two runs of one
 * host really go:
 * - each records `host.slot.admission` events for the rule `checks`;
 * - their verification (gate) windows — read from the merged event streams
 *   of both runs, ordered by the events' `at` — never overlap: the second
 *   start waited for the `checks` slot the first held.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

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

/** One engine run as its own process over the fixture's work tree. */
function runOfTheFixture(workdir: string): Promise<number> {
  return new Promise((done) => {
    const child = spawn(process.execPath, [CLI, "run"], {
      cwd: workdir,
      env: {
        ...process.env,
        SPECSTRIDE_HOST_LIMITS: "on",
        SPECSTRIDE_HOST_CHECKS_CONCURRENT: "1",
      },
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => done((code ?? 1) as number));
    child.on("error", (error) => {
      console.error("[run] spawn failed:", String(error), stderr.slice(0, 400));
      done(1);
    });
  });
}

test("two engine processes under one checks bound never overlap their gate windows", async () => {
  const homeA = fixture154();
  const homeB = fixture154();
  // Both runs share the home the LAST fixture pinned: one user-state root,
  // one `checks` slot store, two workspaces, two processes.
  const sharedHome = process.env.HOME ?? join(tmpdir(), "specstride-host-checks-home");
  try {
    const [exitA, exitB] = await Promise.all([
      runOfTheFixture(homeA.work),
      runOfTheFixture(homeB.work),
    ]);
    assert.equal(exitA, 0, `the first run ended ${String(exitA)}`);
    assert.equal(exitB, 0, `the second run ended ${String(exitB)}`);
    const events = eventsUnderHome(sharedHome);
    assert.ok(
      events.some((event) => event.type === "host.slot.admission" && event.data.rule === "checks"),
      "no `host.slot.admission` event for the rule `checks` was recorded",
    );
    assert.ok(
      events.some((event) => event.type === "verification.started"),
      "the gate did not run",
    );
    // The merged streams, ordered by their `at`: no gate window opened while
    // another was open — the slot serialised the two runs' gate executions.
    const gates = events
      .filter(
        (event) => event.type === "verification.started" || event.type === "verification.ended",
      )
      .map((event) => ({ type: event.type, at: Date.parse(event.at ?? "") }));
    assert.ok(gates.length >= 2, "fewer than two gate windows were recorded");
    assert.ok(
      gates.every((gate) => !Number.isNaN(gate.at)),
      "a gate event carried no `at`",
    );
    let open: number | null = null;
    for (const gate of gates.sort((a, b) => a.at - b.at)) {
      if (gate.type === "verification.started") {
        assert.equal(open, null, "a gate window opened while another was open");
        open = gate.at;
      } else {
        open = null;
      }
    }
    assert.equal(open, null, "a gate window never closed");
  } finally {
    homeB.restore();
    homeA.restore();
  }
});

test("the checks seam waits while one slot is held and proceeds when it frees", async () => {
  // The engine's own seam, driven directly: the same `take` the gate and
  // every merge check of a start call.
  const { makeRunHostSlots } = await import("../../src/engine/host-slots.ts");
  const admissions: string[] = [];
  const slotsHome = mkdtempSync(join(tmpdir(), "specstride-checkbound-seam-"));
  const slots = makeRunHostSlots({
    home: slotsHome,
    workdir: process.cwd(),
    env: { SPECSTRIDE_HOST_CHECKS_CONCURRENT: "1" },
    limitsOn: true,
  });
  try {
    const first = await slots.take("checks", (admission) => admissions.push(admission.verdict));
    assert.ok(first !== null, "the first take did not acquire");
    let secondAcquired = false;
    const second = slots.take("checks", (admission) => admissions.push(admission.verdict));
    const probe = await Promise.race([
      second.then((release) => {
        secondAcquired = release !== null;
        return "acquired";
      }),
      new Promise((resolve) => setTimeout(() => resolve("timeout"), 300)),
    ]);
    assert.equal(probe, "timeout", "the second take acquired while the slot was held");
    assert.equal(secondAcquired, false);
    await first?.();
    const release = await Promise.race([
      second,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
    ]);
    assert.ok(release !== null, "the second take never acquired after the release");
    assert.ok(admissions.includes("take"), "no `take` admission was recorded");
    assert.ok(
      admissions.includes("wait"),
      "no `wait` admission was recorded while the slot was held",
    );
    await release;
  } finally {
    rmSync(slotsHome, { recursive: true, force: true });
  }
});
