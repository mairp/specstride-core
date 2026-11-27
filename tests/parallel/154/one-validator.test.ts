/**
 * T088 (feature 154, US4) — THE ONE-VALIDATOR GUARD (F154-FR-038).
 *
 * On every fixture of Phase 1 (`tests/fixtures/154/`, the directories T011
 * wrote) the stub engine runs once, and its events prove that the validation
 * stream runs ONE AT A TIME on the merged tree: no interval of a merge check
 * (`merge_check_started` → `merge_check_finished`), of the full verification
 * gate (`verification.started` → `verification.ended`) or of the critic
 * (`critic.started` → `verdict.recorded`) overlaps another, the gate runs
 * exactly once per phase attempt, and the critic starts only after the gate
 * has ended on the same tree (F154-FR-006: the full gate before the critic,
 * never scoped, never replaced).
 *
 * The same interval rule is applied to the recorded baseline events of
 * `tests/fixtures/154/parity-baseline/` (the run of `main` @ `aafb367f` with
 * the feature absent), so the guard pins the invariant the engine already
 * holds before Phase 11 adds any slot.
 *
 * Run from the repository root:
 *     node --experimental-strip-types --test tests/parallel/154/one-validator.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { fixture154 } from "../../inertness/154/helpers.ts";

/**
 * The fixture directories Phase 1 (T011) wrote under `tests/fixtures/154/`,
 * minus `door/`: FX-154-DOOR holds no task that runs (its stub configuration
 * names the adapter descriptor for the fake-binary test), so the engine
 * fixture below drives the six task fixtures only.
 */
const FIXTURE_DIRS = ["plan", "groups", "slots", "stages", "phases", "spec"] as const;

type Event = { type: string; at?: string; data: Record<string, unknown> };

/** One validator interval as the events name it. */
type Interval = {
  readonly kind: "merge-check" | "gate" | "critic";
  readonly start: number;
  readonly end: number;
};

/** Epoch milliseconds of an event; events without `at` are ordered only. */
function atOf(event: Event): number {
  return event.at === undefined ? Number.NaN : Date.parse(event.at);
}

/**
 * The validator intervals of one event stream: the merge checks, the full
 * gate (`verification.*` and the commit-gate pair), and the critic. The
 * critic's interval closes at `verdict.recorded` where the stream holds it
 * (the recorded baseline of `main` @ `aafb367f`); this engine's current
 * vocabulary writes no verdict event, so there the approval — `phase.ended`
 * — closes it. Either way the critic's interval holds the call and nothing
 * else starts inside it.
 */
function validatorIntervals(events: readonly Event[]): readonly Interval[] {
  const intervals: Interval[] = [];
  let open: { kind: Interval["kind"]; start: number } | null = null;
  for (const event of events) {
    const at = atOf(event);
    switch (event.type) {
      case "merge_check_started":
      case "verification.started":
      case "commit_gate.started":
      case "critic.started": {
        const kind =
          event.type === "merge_check_started"
            ? "merge-check"
            : event.type === "critic.started"
              ? "critic"
              : "gate";
        assert.ok(
          open === null,
          `${where(events)}: the ${kind} started while ${open?.kind ?? "?"} was open`,
        );
        open = { kind, start: at };
        break;
      }
      case "merge_check_finished":
      case "verification.ended":
      case "commit_gate.ended":
      case "verdict.recorded":
      case "phase.ended": {
        // `phase.ended` closes only a critic (the approval); the gate and the
        // merge check always close with their own `*ended` event.
        if (event.type === "phase.ended" && open?.kind !== "critic") break;
        assert.ok(open !== null, `${where(events)}: ${event.type} without an open interval`);
        intervals.push({ kind: open.kind, start: open.start, end: at });
        open = null;
        break;
      }
      default:
        break;
    }
  }
  assert.ok(open === null, `${where(events)}: the ${open?.kind ?? "?"} interval never closed`);
  return intervals;
}

/** The events around a failure, for the assertion's message. */
function where(events: readonly Event[]): string {
  return events
    .filter((event) => validatorKinds.has(event.type))
    .map((event) => event.type)
    .slice(-6)
    .join(" → ");
}

const validatorKinds = new Set([
  "merge_check_started",
  "merge_check_finished",
  "verification.started",
  "verification.ended",
  "commit_gate.started",
  "commit_gate.ended",
  "critic.started",
  "verdict.recorded",
  "phase.ended",
]);

/** The heart of the guard: no two validator intervals overlap. */
function assertOneAtATime(intervals: readonly Interval[], where: string): void {
  const ordered = [...intervals].sort((a, b) => a.start - b.start);
  for (let i = 1; i < ordered.length; i += 1) {
    const before = ordered[i - 1]!;
    const after = ordered[i]!;
    assert.ok(
      after.start >= before.end,
      `${where}: the ${after.kind} interval started before the ${before.kind} interval ended`,
    );
  }
}

/** The engine run of one fixture: the one-validator assertions over its events. */
async function guardOneFixture(dir: string): Promise<void> {
  const tasksFile = join(import.meta.dirname, "../../fixtures/154", dir, "tasks.md");
  assert.ok(existsSync(tasksFile), `the fixture ${dir} holds its tasks.md`);
  const f = fixture154();
  try {
    // The fixture's own task list replaces the helper's default: the engine
    // runs the same stub proposer and critic over the fixture's tasks.
    writeFileSync(join(f.work, "specs", "001-one", "tasks.md"), readFileSync(tasksFile, "utf8"));
    const exit = await f.run();
    assert.equal(exit, 0, `the engine run over ${dir} exits 0`);
    const events = f.events();
    assert.ok(events.length > 0, `the run over ${dir} wrote events`);
    assert.ok(
      events.some((event) => event.type === "verification.started"),
      `${dir}: the full gate ran`,
    );
    assert.ok(
      events.some((event) => event.type === "critic.started"),
      `${dir}: the critic ran`,
    );
    // One at a time: no validator interval overlaps another (F154-FR-038).
    assertOneAtATime(validatorIntervals(events), dir);
    // The gate runs exactly once per phase attempt: one phase per fixture,
    // and one full-gate execution per attempt the run made.
    const gates = events.filter((event) => event.type === "verification.started");
    const attempts = new Set(
      events
        .filter((event) => event.type === "attempt.started")
        .map((event) => String(event.data.attempt)),
    );
    assert.equal(
      gates.length,
      Math.max(attempts.size, 1),
      `${dir}: exactly one full-gate execution per attempt started`,
    );
    // The full gate before the critic, on the same tree (F154-FR-006): the
    // first critic of the run starts after the last full gate has ended.
    const lastGateEnd = Math.max(
      ...events.filter((e) => e.type === "verification.ended").map(atOf),
    );
    const firstCriticStart = Math.min(
      ...events.filter((e) => e.type === "critic.started").map(atOf),
    );
    assert.ok(
      firstCriticStart >= lastGateEnd,
      `${dir}: the critic started before the gate had ended`,
    );
  } finally {
    f.restore();
  }
}

test("T088 every Phase 1 fixture: merge check, gate and critic run one at a time, gate before critic", async () => {
  for (const dir of FIXTURE_DIRS) {
    await guardOneFixture(dir);
  }
});

test("T088 the recorded baseline of main: the same one-validator invariant holds", () => {
  const file = join(import.meta.dirname, "../../fixtures/154/parity-baseline/events-00.json");
  const recorded = JSON.parse(readFileSync(file, "utf8")) as { lines: string[] };
  const events = recorded.lines.map((line) => JSON.parse(line) as Event);
  const intervals = validatorIntervals(events);
  assert.ok(
    intervals.some((interval) => interval.kind === "gate"),
    "the baseline holds a gate interval",
  );
  assert.ok(
    intervals.some((interval) => interval.kind === "critic"),
    "the baseline holds a critic interval",
  );
  assertOneAtATime(intervals, "parity-baseline");
  const lastGateEnd = Math.max(
    ...intervals.filter((interval) => interval.kind === "gate").map((gate) => gate.end),
  );
  const firstCriticStart = Math.min(
    ...intervals.filter((interval) => interval.kind === "critic").map((c) => c.start),
  );
  assert.ok(
    firstCriticStart >= lastGateEnd,
    "the baseline critic started before the gate had ended",
  );
});
