/**
 * T071 of feature 123 — the conformance test CT-123-110 for EP-19, the stage
 * kind and the precondition check (F123-FR-010; measures F123-SC-009).
 *
 * The claim of User Story 4: an author adds a stage kind WITHOUT TOUCHING
 * THE CORE. The proof, all from the test tree:
 *
 *  1. the sample kind (`samples/EP-19/pipeline-kind.ts`) and the sample
 *     check (`samples/EP-19/pipeline-check.ts`) REGISTER into the two open
 *     registries of `@specstride/pipeline` beside the built-ins;
 *  2. `validate`, `run` and `evaluate` of both are shown by the DRY RUN
 *     (`planDryRun` prints the `[PREFLIGHT]` and `[PLAN]` lines of the
 *     sample) and EXECUTED (the stage loop runs the sample kind through the
 *     registries, a real child process writes the marker file);
 *  3. no change to the schema of the launch contract or to the stage
 *     executor: the sample kind/check pass through the entry's registry
 *     validation and the contract hash without any schema or executor edit,
 *     and NO CORE FILE NAMES THE SAMPLE (`coreFilesNamingASample()` empty);
 *  4. the import-boundary check FAILS when a core file names the sample
 *     (rule `core:names-sample`, observed on a scratch copy).
 *
 * This module is the home of the cases; `stage-kind.test.ts` beside it
 * imports it so the `node --test` glob of the test kit runs them.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  StageKindRegistry,
  PreconditionCheckRegistry,
  RegistryDuplicateError,
  unknownRegistryEntries,
  type EvaluationContext,
} from "../../../../../packages/pipeline/src/kinds/registry.ts";
import { BUILTIN_KINDS } from "../../../../../packages/pipeline/src/kinds/builtin.ts";
import { BUILTIN_CHECKS } from "../../../../../packages/pipeline/src/checks/builtin.ts";
import { planDryRun } from "../../../../../packages/pipeline/src/entry/dry-run.ts";
import {
  runStageLoop,
  launchContractHash,
} from "../../../../../packages/pipeline/src/executor/stage-loop.ts";
import type { Stage } from "../../../../../packages/pipeline/src/executor/types.ts";
import { sampleStageKind, SAMPLE_KIND_ID } from "../../samples/EP-19/pipeline-kind.ts";
import { sampleCheck, SAMPLE_CHECK_ID } from "../../samples/EP-19/pipeline-check.ts";
import { coreFilesNamingASample } from "../register-samples.ts";
import { observeACoreFileNamingASample } from "../EP-18/samples-outside-the-core.ts";

const SAMPLE_PATH = "packages/testkit/src/samples/EP-19/pipeline-kind.ts" as const;

/** The registries of a launch: the five built-ins and the registered sample. */
function registries() {
  const kinds = new StageKindRegistry(BUILTIN_KINDS);
  kinds.register(SAMPLE_KIND_ID, sampleStageKind);
  const checks = new PreconditionCheckRegistry(BUILTIN_CHECKS);
  checks.register(SAMPLE_CHECK_ID, sampleCheck);
  return { kinds, checks };
}

function context(dir: string, implement = false): EvaluationContext {
  return { env: { PATH: process.env["PATH"] ?? "" }, cwd: dir, implement };
}

function stage(overrides: Partial<Stage> = {}): Stage {
  return {
    id: "sample-stage-1",
    kind: SAMPLE_KIND_ID,
    dependencies: [],
    action: { argv: [process.execPath, "-e", "process.exit(0)"], env: [] },
    preconditions: [],
    postconditions: [],
    recovery: undefined,
    ...overrides,
  };
}

const CLOCK = { now: () => 1_700_000_000_000, sleep: async (ms: number) => ms };

test("CT-123-110: the sample kind and the sample check register from the test tree (EP-19)", () => {
  const plain = {
    kinds: new StageKindRegistry(BUILTIN_KINDS),
    checks: new PreconditionCheckRegistry(BUILTIN_CHECKS),
  };
  // Before the registration the sample names are unknown (the refusal the
  // entry turns into exit 20):
  assert.equal(plain.kinds.has(SAMPLE_KIND_ID), false);
  assert.equal(plain.checks.has(SAMPLE_CHECK_ID), false);
  assert.throws(() => plain.kinds.get(SAMPLE_KIND_ID), /no stage kind sample-stage is registered/);
  assert.deepEqual(
    unknownRegistryEntries({ stages: [stage()], kinds: plain.kinds, checks: plain.checks }),
    ["no stage kind sample-stage is registered (F123-FR-010)"],
  );

  // The registration, the whole act of authorship; the core is untouched:
  const { kinds, checks } = registries();
  assert.equal(kinds.has(SAMPLE_KIND_ID), true);
  assert.equal(checks.has(SAMPLE_CHECK_ID), true);
  assert.deepEqual(
    unknownRegistryEntries({ stages: [stage()], kinds, checks }),
    [],
    "with the sample registered, the same contract validates",
  );
  // The registries stay open and refuse a duplicate:
  assert.throws(() => kinds.register(SAMPLE_KIND_ID, sampleStageKind), RegistryDuplicateError);
  assert.deepEqual([...kinds.names()].sort(), [
    "command",
    "decision",
    "sample-stage",
    "setup",
    "smoke",
    "specstride",
  ]);
});

test("CT-123-110: validate of the sample kind, through the registry", () => {
  const { kinds } = registries();
  assert.deepEqual(kinds.get(SAMPLE_KIND_ID).validate(stage()), []);
  const problems = kinds.get(SAMPLE_KIND_ID).validate(stage({ action: undefined, id: "broken" }));
  assert.deepEqual(problems, ["the stage broken declares no action"]);
});

test("CT-123-110: the dry run shows the sample kind and the sample check, executing nothing", async () => {
  const { checks } = registries();
  const dir = mkdtempSync(join(tmpdir(), "ep19-dry-"));
  const dry: Stage = stage({
    preconditions: [{ check: SAMPLE_CHECK_ID, timing: "preflight", params: { subject: dir } }],
  });
  const plan = await planDryRun({
    contractId: "ep19-sample",
    stages: [dry],
    implement: false,
    smoke: false,
    checks,
    context: context(dir),
    shell: {},
  });
  const labels = plan.lines.map((line) => `${line.label} ${line.text}`);
  assert.equal(labels.length >= 4, true);
  assert.match(labels[0], /^\[DRY-RUN\] contract ep19-sample/);
  assert.ok(
    labels.some((l) => l.startsWith("[PREFLIGHT]") && l.includes(`${SAMPLE_CHECK_ID}: pass`)),
  );
  assert.ok(labels.some((l) => l.startsWith("[PLAN]") && l.includes("sample-stage-1")));
  assert.ok(labels.at(-1)?.startsWith("[DIGEST] state=dry-run exit=0"));
  // The dry run executes nothing: the deferred form of the check is available too.
  const deferredPlan = await planDryRun({
    contractId: "ep19-sample",
    stages: [
      stage({
        preconditions: [
          { check: SAMPLE_CHECK_ID, timing: "preflight", params: { expect: "deferred" } },
        ],
      }),
    ],
    implement: false,
    smoke: false,
    checks,
    context: context(dir),
    shell: {},
  });
  assert.ok(
    deferredPlan.lines.some((l) => l.label === "[PREFLIGHT]" && l.text.includes("deferred")),
  );
});

test("CT-123-110: the sample kind runs as a stage — the loop executes it through the registry", async () => {
  const { kinds, checks } = registries();
  const dir = mkdtempSync(join(tmpdir(), "ep19-run-"));
  const marker = join(dir, "marker.txt");
  const scripted: Stage = stage({
    action: {
      argv: [
        process.execPath,
        "-e",
        `require("node:fs").writeFileSync(${JSON.stringify(marker)}, "ran")`,
      ],
      env: [],
    },
  });
  // The runner is dispatched by the registry, never by a switch on the name:
  const runner = async (input: {
    stage: Stage;
    action: { argv: string[] };
    attempt: number;
    maxAttempts: number;
  }) => {
    const outcome = await kinds.get(input.stage.kind).run({
      stage: input.stage,
      attempt: input.attempt,
      maxAttempts: input.maxAttempts,
      runChild: async (call) => {
        const ran = spawnSync(call.action.argv[0]!, call.action.argv.slice(1), {
          encoding: "utf8",
        });
        return { code: ran.status ?? 1, signal: ran.signal ?? null, timedOut: false };
      },
      context: {
        colourOn: false,
        stdoutIsTerminal: false,
        env: {},
        runChild: async () => ({ code: 0, signal: null, timedOut: false }),
      },
    });
    return { code: outcome.ok ? 0 : (outcome.childExitCode ?? 1), signal: null, timedOut: false };
  };
  const result = await runStageLoop({
    pipelineId: "ep19-sample",
    contract: { id: "ep19-sample", stages: [scripted] },
    stages: [scripted],
    statePath: join(dir, "state.json"),
    smoke: false,
    implement: false,
    checks,
    checkContext: context(dir),
    clock: CLOCK,
    runner,
    readTerminal: () => null,
  });
  assert.equal(result.completed, true);
  assert.equal(result.state.state, "completed");
  assert.equal(result.state.stages["sample-stage-1"]?.status, "completed");
  assert.ok(result.digest, "the executed run digests");
  assert.equal(existsSync(marker), true, "the sample stage's child really ran");
});

test("CT-123-110: evaluate of the sample kind and of the sample check", async () => {
  const { kinds, checks } = registries();
  const dir = mkdtempSync(join(tmpdir(), "ep19-eval-"));
  // `evaluate` of the kind: no postconditions hold trivially; the marker form
  // reads through the stage's evidence.
  assert.equal(await kinds.get(SAMPLE_KIND_ID).evaluate(stage(), context(dir)), true);
  assert.equal(
    await kinds.get(SAMPLE_KIND_ID).evaluate(
      stage({
        postconditions: [{ check: SAMPLE_CHECK_ID, timing: "postcondition", params: {} }],
      }),
      context(dir),
    ),
    false,
  );
  assert.equal(
    await kinds.get(SAMPLE_KIND_ID).evaluate(
      stage({
        evidence: "sample-ready",
        postconditions: [{ check: SAMPLE_CHECK_ID, timing: "postcondition", params: {} }],
      }),
      context(dir),
    ),
    true,
  );
  // `evaluate` of the check through the registry: pass, fail, deferred.
  assert.equal(
    (await checks.run({ check: SAMPLE_CHECK_ID, timing: "preflight", params: {} }, context(dir)))
      .result,
    "pass",
  );
  assert.equal(
    (
      await checks.run(
        { check: SAMPLE_CHECK_ID, timing: "preflight", params: { expect: "fail" } },
        context(dir),
      )
    ).result,
    "fail",
  );
  assert.equal(
    (
      await checks.run(
        { check: SAMPLE_CHECK_ID, timing: "preflight", params: { expect: "deferred" } },
        context(dir),
      )
    ).result,
    "deferred",
  );
  // A check that throws is `fail`, never a crash (F123-FR-010):
  const throwing = new PreconditionCheckRegistry({
    [SAMPLE_CHECK_ID]: () => {
      throw new Error("sample blew up");
    },
  });
  const failed = await throwing.run(
    { check: SAMPLE_CHECK_ID, timing: "preflight", params: {} },
    context(dir),
  );
  assert.equal(failed.result, "fail");
  assert.match(failed.detail, /sample blew up/);
});

test("CT-123-110: no core file names the sample; the contract hash needs no schema change", () => {
  // The launch-contract schema was not changed for the sample: a contract
  // naming the sample kind hashes through the same canonical hash as one
  // naming only built-ins, and no core file names the sample by path.
  const withSample = launchContractHash({ id: "p", stages: [stage()] });
  const withBuiltin = launchContractHash({ id: "p", stages: [stage({ kind: "command" })] });
  assert.notEqual(withSample, withBuiltin);
  assert.match(withSample, /^[0-9a-f]{64}$/);
  const naming = coreFilesNamingASample();
  const sampleNaming = naming.filter((entry) => entry.name.includes("EP-19"));
  assert.deepEqual(
    sampleNaming,
    [],
    `no core file names the sample: ${JSON.stringify(sampleNaming)}`,
  );
});

test("CT-123-110: the import-boundary check fails when a core file names the sample (F123-SC-009)", () => {
  const observation = observeACoreFileNamingASample(SAMPLE_PATH);
  assert.equal(observation.cleanCode, 0, "the untouched copy passes the check");
  assert.equal(observation.namedCode !== 0, true, "the naming must fail the check");
  assert.match(observation.namedOutput, /core:names-sample/);
  assert.equal(observation.restoredCode, 0, "taking the naming out restores the pass");
  assert.equal(observation.offendingFile.endsWith("names-a-sample.ts"), true);
});
