/**
 * F107-FR-041a (a): a derived `specstride` stage declares its time limit, the
 * resolved value of `derive.stageTimeoutSec` (default 86,400 s). It is never
 * left to the runner's own 3,600 s default, which killed a live campaign with
 * exit 124 one hour in.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  completeDraft,
  DEFAULT_STAGE_TIME_LIMIT_SEC,
  stageTimeLimitOf,
} from "../src/contract/draft/complete.ts";
import { stageTimeoutFromEnvironment } from "../src/contract/commands/derive.ts";
import { StageKindRegistry } from "../src/kinds/registry.ts";
import { DEFAULT_STAGE_KINDS } from "../src/contract/default-registries.ts";

test("the default is 86,400 s; a whole number of seconds from 1 to 86,400 is kept, anything else falls back", () => {
  assert.equal(DEFAULT_STAGE_TIME_LIMIT_SEC, 86_400);
  assert.equal(stageTimeLimitOf(undefined), 86_400);
  assert.equal(stageTimeLimitOf(7200), 7200);
  for (const bad of [0, -1, 1.5, 86_401, Number.NaN])
    assert.equal(stageTimeLimitOf(bad), 86_400, String(bad));
});

test("SPECSTRIDE_DERIVE_STAGE_TIMEOUT_SEC: whole seconds 1..86,400, else unset", () => {
  assert.equal(stageTimeoutFromEnvironment(undefined), undefined);
  assert.equal(stageTimeoutFromEnvironment(" 43200 "), 43_200);
  for (const bad of ["", "0", "-5", "1.5", "86401", "a day"])
    assert.equal(stageTimeoutFromEnvironment(bad), undefined, bad);
});

const draft = (root: string) =>
  ({
    id: "c-1",
    repository: { root },
    features: [{ slug: "150-host-hermes", path: "specs/150-host-hermes" }],
    inventory: { tasks: [], prerequisites: [], judgment: { items: [], answers: [] } },
    stages: [],
    coverage: [],
    findings: [],
  }) as never;

test("every derived specstride stage declares time_limit_sec: the default, or the resolved value", () => {
  const registry = new StageKindRegistry(DEFAULT_STAGE_KINDS, "test");
  const byDefault = completeDraft({ draft: draft("/w"), registry, declaredCommands: [] });
  const stages = (
    byDefault.draft as unknown as {
      stages: { id: string; time_limit_sec?: number; recovery: unknown }[];
    }
  ).stages;
  assert.equal(stages.length, 1);
  assert.equal(stages[0]!.time_limit_sec, 86_400);
  assert.deepEqual(stages[0]!.recovery, { max_attempts: 1 });
  const resolved = completeDraft({
    draft: draft("/w"),
    registry,
    declaredCommands: [],
    stageTimeoutSec: 43_200,
  });
  assert.equal(
    (resolved.draft as unknown as { stages: { time_limit_sec: number }[] }).stages[0]!
      .time_limit_sec,
    43_200,
  );
});

test("the strict validator accepts the time limit a derived stage declares, and refuses one out of range", async () => {
  const { validateComposed } = await import("../src/contract/validate/compose.ts");
  const registry = new StageKindRegistry(DEFAULT_STAGE_KINDS, "test");
  const completed = completeDraft({ draft: draft("/w"), registry, declaredCommands: [] })
    .draft as unknown as Record<string, unknown>;
  const stageErrors = (value: unknown) => {
    const result = validateComposed(value);
    return result.ok ? [] : result.errors.filter((e) => JSON.stringify(e).includes("/stages/"));
  };
  assert.deepEqual(
    stageErrors(completed),
    [],
    "a derived stage with time_limit_sec passes the stage schema",
  );
  const stages = completed["stages"] as Record<string, unknown>[];
  const tooLong = { ...completed, stages: [{ ...stages[0], time_limit_sec: 86_401 }] };
  assert.ok(stageErrors(tooLong).length > 0, "above 86,400 s is refused");
});
