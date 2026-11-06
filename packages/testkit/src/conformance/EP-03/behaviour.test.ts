/**
 * T040 of feature 104 — CT-104-4, the BEHAVIOUR cases of the conformance suite
 * of EP-03, the spec-format adapter, beside the contract-level suite of
 * feature 100 (`./contract.test.ts`, T100).
 *
 * Annex A §A.4 splits the suite of a point in two: feature 100 owns the five
 * checks every suite makes at contract level and states where the behaviour
 * cases go — "the folder of the point is the place" — and the CONTENT OWNER
 * writes them. EP-03's content owner is feature 104, and these are its five
 * cases:
 *
 *  | `CT-104-4/golden-models`                     | F104-FR-009, F104-FR-010, 002 FR-028 |
 *  | `CT-104-4/tick-round-trip`                   | F104-FR-009, F104-FR-017             |
 *  | `CT-104-4/hash-stability`                    | F104-FR-021, F104-FR-022             |
 *  | `CT-104-4/added-format-in-the-detection-order` | F104-FR-009 (CQ-040)               |
 *  | `CT-104-4/sample-format-from-the-test-tree`  | F104-FR-009, F104-SC-006             |
 *
 * The SUBJECT of all five is the sample format of `../../samples/EP-03/sample-format.ts`
 * (T041): a format added from the test tree, which F104-FR-009 requires to be
 * "detected, parsed, validated, ticked and run with no change to a core file".
 * The suite runs THROUGH THE FRAME — the implementation is offered to
 * `registryOf("EP-03")` and run by `runSuite` of `../run.ts` — so the report
 * names the point, the implementation, the class and the major.
 *
 * Every golden in this file is a frozen LITERAL written here, in the test, and
 * never read back out of the sample: a model, a finding, a hash or a changed
 * byte that the implementation itself supplied would be no oracle at all.
 *
 * 002 FR-028 ("the default spec registry registers five format adapters") is
 * READ from the record this repository holds of Lisa,
 * `old/002-as-is-lisa/spec.md`, rather than restated, which is the rule the
 * characterization tests of this feature follow.
 */
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  BUILT_IN_FORMATS_WIN,
  FORMAT_NAMES,
  OPERATIONS,
  POINT_ID,
} from "@specstride/contracts/ep/spec-format";
import {
  PHASE_VIEW_FIELDS,
  isCanonicalSpecModel,
  phaseViews,
} from "@specstride/contracts/records/canonical-spec-model";
import { contentHash, phaseShape, taskListHashIgnoringCheckboxes } from "@specstride/kernel/hasher";
import {
  adapters,
  model as specModel,
  registry as specRegistry,
  taskReading,
  tick as specTick,
  validate as specValidate,
} from "@specstride/spec-formats";
import { FORMAT as MINIMAL_SAMPLE_FORMAT } from "../../samples/EP-03/index.ts";
import * as sample from "../../samples/EP-03/sample-format.ts";
import { ROOT, registryOf } from "../frame.ts";
import { coreFilesNamingASample, SAMPLE_CLASS, registerSamples } from "../register-samples.ts";
import { operationOf } from "../common.ts";
import { casesAsTests, type ConformanceCase } from "../run.ts";

/** The record of Lisa this file reads 002 FR-028 out of. */
const LISA_SPEC = "old/002-as-is-lisa/spec.md";

/** The static test of T041, named here so the two are findable from each other. */
const THE_STATIC_TEST_OF_T041 =
  "packages/spec-formats/test/static/sample-format-outside-the-core.test.ts";

/* ==================================================================== *
 * The goldens. Literals, written here, never read out of the sample.
 * ==================================================================== */

/** The model `parse` must produce from the sample's valid fixture. */
const GOLDEN_MODEL = Object.freeze({
  format: "sample-format",
  feature: "000-sample",
  sources: [],
  phases: [
    {
      number: 1,
      title: "Read the sample",
      section:
        "## Step 1 — Read the sample\n" +
        "\n" +
        "### Checks\n" +
        "\n" +
        "- [ ] the added format is detected when its file is named\n" +
        "- [ ] the added format loses to every built-in rule\n" +
        "\n" +
        "### Tasks\n" +
        "\n" +
        "- [ ] T001 [P] read the sample\n" +
        "- [ ] T002 hash the sample\n" +
        "\n",
      criteria: [
        "the added format is detected when its file is named",
        "the added format loses to every built-in rule",
      ],
      tasks: [
        {
          id: "T001",
          markers: ["[P]"],
          text: "read the sample",
          ticked: false,
          line: 14,
          file: "specs/000-sample/the-sample.sample.md",
        },
        {
          id: "T002",
          markers: [],
          text: "hash the sample",
          ticked: false,
          line: 15,
          file: "specs/000-sample/the-sample.sample.md",
        },
      ],
    },
    {
      number: 2,
      title: "Tick the sample",
      section:
        "## Step 2 — Tick the sample\n" +
        "\n" +
        "### Checks\n" +
        "\n" +
        "- [ ] a tick changes checkbox bytes and nothing else\n" +
        "\n" +
        "### Tasks\n" +
        "\n" +
        "- [ ] T003 tick the sample\n",
      criteria: ["a tick changes checkbox bytes and nothing else"],
      tasks: [
        {
          id: "T003",
          markers: [],
          text: "tick the sample",
          ticked: false,
          line: 25,
          file: "specs/000-sample/the-sample.sample.md",
        },
      ],
    },
  ],
});

/** The findings the INVALID fixture must give, in order. */
const GOLDEN_FINDINGS = Object.freeze([
  Object.freeze({ severity: "fail", message: 'phase 3 has no "### Checks" block' }),
  Object.freeze({
    severity: "fail",
    message: "non-contiguous phases: 3 follows 1 (must ascend by 1)",
  }),
]);

/** The ids the sample's own `tick` is asked for, and what it must change. */
const THE_THREE_TASKS = Object.freeze(["T001", "T002", "T003"]);
const GOLDEN_TICKED_LINES = Object.freeze([14, 15, 25]);

/**
 * The ONLY bytes a tick of the three tasks may change: three marks, each a
 * space that becomes an `x`, at these offsets of the fixture (F104-FR-017).
 */
const GOLDEN_CHANGED_BYTES = Object.freeze([
  Object.freeze([250, " ", "x"]),
  Object.freeze([281, " ", "x"]),
  Object.freeze([415, " ", "x"]),
]);

/** The hashes of the canonical hasher over the sample's fixture (annex X §X.5). */
const GOLDEN_HASHES = Object.freeze({
  /** `contentHash` of the fixture as it is. */
  content: "ddfeea15a96b4c4500c8a66c70fcdc565ece2c3603228743d5dbaeb90ab48e58",
  /** `contentHash` after the three tasks are ticked: it MOVES. */
  contentAfterTheTick: "b502a56dbbe810b54424d22a5573fd3e0473df4145b0c593a7ce500878734f36",
  /** The hash that ignores checkboxes: the SAME before and after (F104-FR-022). */
  ignoringCheckboxes: "ddfeea15a96b4c4500c8a66c70fcdc565ece2c3603228743d5dbaeb90ab48e58",
  /** The shape of each phase: 16 hexadecimal characters (annex X §X.5). */
  shapeOfStep1: "d329bd896d395dd8",
  shapeOfStep2: "df7f5d7a5a1cd066",
  /** The canonical record hash of phase 1's task-list reading. */
  taskListReadingOfStep1: "c619716f8232ae4f218a8c6881b4e77ffc1711e4b67e4b2ee17430319f36ddeb",
});

/** The priority the sample's `detect` returns, and the one the registry keeps. */
const RAW_PRIORITY = 900 as const;
const CLAMPED_PRIORITY = 399 as const;

/* ==================================================================== *
 * Helpers of the cases.
 * ==================================================================== */

/** The 002 FR-028 line of the record of Lisa, read and not restated. */
function lisaRequirement(id: string): string {
  const line = readFileSync(join(ROOT, LISA_SPEC), "utf8")
    .split("\n")
    .find((text) => text.includes(`**${id}**`));
  assert.ok(line !== undefined, `${LISA_SPEC} holds no ${id}`);
  return line;
}

/** Every back-ticked name of a line of the record. */
function backtickedNamesOf(line: string): readonly string[] {
  return Object.freeze([...line.matchAll(/`([a-z-]+)`/g)].map((m) => m[1] as string));
}

/** Where the two texts differ, as `[offset, before, after]` triples. */
function changedBytesOf(before: string, after: string): readonly (readonly unknown[])[] {
  assert.equal(after.length, before.length, "a tick changes no byte count");
  const changed: (readonly unknown[])[] = [];
  for (let at = 0; at < before.length; at += 1) {
    if (before[at] !== after[at]) changed.push(Object.freeze([at, before[at], after[at]]));
  }
  return Object.freeze(changed);
}

/** A scratch workspace holding the sample's fixture, removed by the caller. */
function workspaceWithTheFixture(text: string = sample.SAMPLE_SPEC): {
  readonly root: string;
  readonly path: string;
} {
  const root = mkdtempSync(join(tmpdir(), "specstride-ep03-sample-"));
  const path = join(root, sample.SAMPLE_PATH);
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, text, { mode: 0o644 });
  return { root, path };
}

/* ==================================================================== *
 * The five behaviour cases.
 * ==================================================================== */

const golden: ConformanceCase = {
  id: "CT-104-4/golden-models",
  title:
    "the added format parses to the golden canonical model, the model validates against " +
    "`specstride.spec-format/1:model`, the four-field phase view is its projection, and the " +
    "shared findings are the one grammar owner's own (002 FR-028, F104-FR-009, F104-FR-010)",
  level: "behaviour",
  proves: ["002 FR-028", "F104-FR-009", "F104-FR-010", "F104-FR-015"],
  run(implementation) {
    // The port offers the five operations of EP-03 over the added format.
    for (const operation of OPERATIONS) {
      assert.equal(
        typeof operationOf(implementation, operation),
        "function",
        `the sample format offers no \`${operation}\``,
      );
    }

    // The golden model, byte for byte — including the raw section, whose
    // trailing blank line belongs to the section it follows (B-2019).
    const parsed = sample.parseText(sample.SAMPLE_SPEC);
    assert.deepEqual(parsed, GOLDEN_MODEL);

    // It IS a canonical spec model of annex C §C.7: the schema of feature 100
    // accepts a model whose `format` is the added format's own name.
    assert.equal(isCanonicalSpecModel(parsed), true);
    assert.equal(parsed.format, sample.SAMPLE_FORMAT);

    // The four-field view is a projection of it, and nothing more.
    const views = phaseViews(parsed);
    assert.equal(views.length, 2);
    for (const view of views) {
      assert.deepEqual(Object.keys(view).sort(), [...PHASE_VIEW_FIELDS].sort());
    }
    assert.deepEqual(
      views,
      GOLDEN_MODEL.phases.map((phase) => ({
        number: phase.number,
        title: phase.title,
        section: phase.section,
        criteria: phase.criteria,
      })),
    );

    // `parse` is a PURE function of its input (F104-FR-010).
    assert.deepEqual(sample.parseText(sample.SAMPLE_SPEC), parsed);

    // The valid fixture has no finding; the invalid one has exactly two.
    assert.deepEqual([...sample.validateText(sample.SAMPLE_SPEC)], []);
    assert.equal(specModel.isValid(sample.validateText(sample.SAMPLE_SPEC)), true);
    const findings = sample.validateText(sample.INVALID_SAMPLE_SPEC);
    assert.deepEqual([...findings], [...GOLDEN_FINDINGS]);
    assert.equal(specModel.isValid(findings), false);

    // The contiguity text is the NATIVE adapter's own function, not a second
    // copy: B-2004 and B-2005 are "(all formats)", so an added format shares
    // them (F104-FR-008, one grammar owner).
    assert.equal(
      (findings[1] as { message: string }).message,
      adapters.native.nonContiguousPhases(1, 3),
    );

    // 002 FR-028 — Lisa registered FIVE adapters; the port registers the three
    // of Wave 1, and an added format does not change which three are built-in.
    const five = backtickedNamesOf(lisaRequirement("FR-028"));
    assert.equal(five.length, 5, `002 FR-028 names ${JSON.stringify(five)}`);
    const waveOne = adapters.createFullRegistry();
    assert.deepEqual([...waveOne.names()], [...FORMAT_NAMES]);
    for (const refused of specRegistry.ADAPTERS_NOT_REGISTERED) {
      assert.equal(waveOne.adapterOf(refused), undefined, `\`${refused}\` is not registered`);
    }
    const withTheSample = sample.registryWithTheSampleFormat();
    assert.equal(withTheSample.adapters().filter((one) => one.builtIn).length, 3);
    assert.equal(withTheSample.adapterOf(sample.SAMPLE_FORMAT)?.builtIn, false);
  },
};

const roundTrip: ConformanceCase = {
  id: "CT-104-4/tick-round-trip",
  title:
    "`tick` of the added format changes exactly the three mark bytes, is idempotent, keeps the " +
    "mode of the file, writes nothing when no line changed, and the re-read model shows the " +
    "ticks (F104-FR-009, F104-FR-017)",
  level: "behaviour",
  proves: ["F104-FR-009", "F104-FR-017"],
  run() {
    // Over a TEXT: the three task lines, and only their marks.
    const ticked = sample.tickTextOfTheSample(sample.SAMPLE_SPEC, { taskIds: THE_THREE_TASKS });
    assert.equal(ticked.tickable, true);
    assert.equal(ticked.changed, 3);
    assert.deepEqual([...ticked.lines], [...GOLDEN_TICKED_LINES]);
    assert.deepEqual([...ticked.taskIds], [...THE_THREE_TASKS]);
    assert.equal(ticked.otherBytesChanged, false);
    assert.deepEqual(changedBytesOf(sample.SAMPLE_SPEC, ticked.text), [...GOLDEN_CHANGED_BYTES]);

    // The ROUND TRIP: re-parse and the three tasks are ticked, with every other
    // field of the model unchanged — the criteria included.
    const after = sample.parseText(ticked.text);
    assert.deepEqual(
      after.phases.flatMap((phase) => phase.tasks.map((task) => [task.id, task.ticked])),
      [
        ["T001", true],
        ["T002", true],
        ["T003", true],
      ],
    );
    assert.deepEqual(
      after.phases.map((phase) => phase.criteria),
      GOLDEN_MODEL.phases.map((phase) => phase.criteria),
    );
    assert.deepEqual(
      after.phases.map((phase) => [phase.number, phase.title]),
      GOLDEN_MODEL.phases.map((phase) => [phase.number, phase.title]),
    );

    // Idempotent: a second tick changes nothing and hands back the same text.
    const again = sample.tickTextOfTheSample(ticked.text, { taskIds: THE_THREE_TASKS });
    assert.equal(again.changed, 0);
    assert.equal(again.text, ticked.text);
    assert.deepEqual([...specTick.untickedTaskIdsOf(after, 1)], []);
    assert.deepEqual(
      [...specTick.untickedTaskIdsOf(sample.parseText(sample.SAMPLE_SPEC), 1)],
      ["T001", "T002"],
    );

    // Over a FILE: the atomic write of the kernel, the mode kept, and NOTHING
    // written when no line changed (B-2010).
    const workspace = workspaceWithTheFixture();
    try {
      const first = specTick.tickFile(
        {
          path: workspace.path,
          format: sample.SAMPLE_FORMAT,
          request: { taskIds: THE_THREE_TASKS },
          file: sample.SAMPLE_PATH,
        },
        sample.grammar,
      );
      assert.equal(first.changed, 3);
      assert.equal(readFileSync(workspace.path, "utf8"), ticked.text);
      assert.equal(statSync(workspace.path).mode & 0o777, 0o644);
      const stamp = statSync(workspace.path).mtimeMs;
      const second = specTick.tickFile(
        {
          path: workspace.path,
          format: sample.SAMPLE_FORMAT,
          request: { taskIds: THE_THREE_TASKS },
          file: sample.SAMPLE_PATH,
        },
        sample.grammar,
      );
      assert.equal(second.changed, 0);
      assert.equal(statSync(workspace.path).mtimeMs, stamp, "nothing is written on a no-op tick");
    } finally {
      rmSync(workspace.root, { recursive: true, force: true });
    }
  },
};

const hashes: ConformanceCase = {
  id: "CT-104-4/hash-stability",
  title:
    "the canonical hasher over the added format is stable: the content hash is the golden value " +
    "and moves with a tick, the hash that ignores checkboxes does NOT, and the phase shape and " +
    "the task-list reading hash are the golden values (F104-FR-021, F104-FR-022)",
  level: "behaviour",
  proves: ["F104-FR-009", "F104-FR-021", "F104-FR-022"],
  run() {
    // Stable across calls, and equal to the golden literal.
    assert.equal(contentHash(sample.SAMPLE_SPEC), GOLDEN_HASHES.content);
    assert.equal(contentHash(sample.SAMPLE_SPEC), contentHash(sample.SAMPLE_SPEC));

    const ticked = sample.tickTextOfTheSample(sample.SAMPLE_SPEC, { taskIds: THE_THREE_TASKS });

    // The content hash MOVES: a tick is a change of the file.
    assert.equal(contentHash(ticked.text), GOLDEN_HASHES.contentAfterTheTick);
    assert.notEqual(GOLDEN_HASHES.contentAfterTheTick, GOLDEN_HASHES.content);

    // The hash that ignores checkboxes does NOT move (F104-FR-022), which is
    // what keeps the engine's own tick from making a run stale.
    assert.equal(
      taskListHashIgnoringCheckboxes(sample.SAMPLE_SPEC),
      GOLDEN_HASHES.ignoringCheckboxes,
    );
    assert.equal(taskListHashIgnoringCheckboxes(ticked.text), GOLDEN_HASHES.ignoringCheckboxes);

    // The BOUNDARY of that rule, measured rather than assumed: the mark rule of
    // F104-FR-022 covers a line that carries a TASK ID. A criteria checkbox
    // carries none, so ticking one IS a change of the task list — which is why
    // the round-trip case ticks by task id and not by phase.
    const wholeSection = sample.tickTextOfTheSample(sample.SAMPLE_SPEC, { phase: 1 });
    assert.equal(wholeSection.changed, 4);
    assert.notEqual(
      taskListHashIgnoringCheckboxes(wholeSection.text),
      GOLDEN_HASHES.ignoringCheckboxes,
    );

    // The phase shape: 16 hexadecimal characters, the golden value per phase.
    const parsed = sample.parseText(sample.SAMPLE_SPEC);
    const shapes = parsed.phases.map((phase) => phaseShape(phase));
    assert.deepEqual(shapes, [GOLDEN_HASHES.shapeOfStep1, GOLDEN_HASHES.shapeOfStep2]);
    for (const shape of shapes) assert.match(shape, /^[0-9a-f]{16}$/);

    // The task-list reading of a phase: its hash is the canonical record hash
    // of the id, markers and text only, so a tick never moves it.
    const before = taskReading.readingOfPhaseNumber(parsed, 1);
    const after = taskReading.readingOfPhaseNumber(sample.parseText(ticked.text), 1);
    assert.equal(before?.hash, GOLDEN_HASHES.taskListReadingOfStep1);
    assert.equal(after?.hash, GOLDEN_HASHES.taskListReadingOfStep1);
    assert.deepEqual(before?.tasks, [
      { id: "T001", markers: ["[P]"], text: "read the sample" },
      { id: "T002", markers: [], text: "hash the sample" },
    ]);
  },
};

const detection: ConformanceCase = {
  id: "CT-104-4/added-format-in-the-detection-order",
  title:
    "the added format is asked after the built-in path and content rules and before the " +
    "fallback `native`, its priority is clamped into the `added` band, it is chosen when its " +
    "file is named explicitly, and a built-in rule always wins (F104-FR-009, CQ-040)",
  level: "behaviour",
  proves: ["F104-FR-009", "002 FR-028"],
  run() {
    // The place, as data: ONE step for an added format, numbered 5.5, between
    // the last built-in content rule and the fallback.
    const added = specRegistry.DETECTION_ORDER.filter((step) => step.kind === "added");
    assert.equal(added.length, 1);
    assert.equal((added[0] as { step: number }).step, sample.SAMPLE_DETECTION_STEP);
    const steps = specRegistry.DETECTION_ORDER.map((step) => step.step);
    assert.deepEqual(steps, [1, 2, 3, 4, 5, 5.5, 6]);
    assert.equal(
      specRegistry.DETECTION_ORDER[specRegistry.DETECTION_ORDER.length - 1]?.kind,
      "fallback",
    );

    // The bands put it below every built-in band and above the fallback.
    assert.deepEqual(
      [...specRegistry.PRIORITY_BAND_ORDER],
      ["builtInPath", "builtInName", "builtInContent", "added", "fallback"],
    );
    assert.equal(specRegistry.PRIORITY_BAND_ORDER.indexOf(sample.SAMPLE_BAND), 3);

    // The sample asks for 900 and the registry CLAMPS it into its band: a host
    // cannot outrank a built-in rule by returning a large number.
    assert.equal(sample.adapter().detect({ path: "a.sample.md", head: "" }).priority, RAW_PRIORITY);
    assert.equal(specRegistry.priorityInBand(sample.SAMPLE_BAND, RAW_PRIORITY), CLAMPED_PRIORITY);

    const withTheSample = sample.registryWithTheSampleFormat();
    const waveOne = adapters.createFullRegistry();
    const claim = withTheSample
      .claims({ path: "a.sample.md", head: "" })
      .find((one) => one.name === sample.SAMPLE_FORMAT);
    assert.deepEqual(claim, {
      name: sample.SAMPLE_FORMAT,
      band: sample.SAMPLE_BAND,
      priority: CLAMPED_PRIORITY,
      claims: true,
    });

    // Its own file: with the sample registered the format is the sample's;
    // WITHOUT it the same file is the fallback `native`. That difference is
    // what places the added format between the built-in rules and the fallback.
    const own = { path: sample.SAMPLE_PATH, head: "# sample-format\n" };
    assert.equal(withTheSample.detectFormat(own), sample.SAMPLE_FORMAT);
    assert.equal(waveOne.detectFormat(own), specModel.FALLBACK_FORMAT);

    // A built-in rule always wins, even where the sample also claims.
    assert.equal(BUILT_IN_FORMATS_WIN, true);
    const builtInWins: readonly (readonly [string, string, string])[] = Object.freeze([
      ["specs/x/tasks.md", "# sample-format\n", "speckit-tasks"],
      ["openspec/changes/c/tasks.md", "# sample-format\n", "openspec-change"],
      ["specs/x/notes.md", "# sample-format\n\n## Phase 1: x\n\n- [ ] T001 a\n", "speckit-tasks"],
    ]);
    for (const [path, head, expected] of builtInWins) {
      const input = { path, head };
      assert.equal(
        withTheSample.claims(input).some((one) => one.name === sample.SAMPLE_FORMAT && one.claims),
        true,
        `the sample claims ${path}`,
      );
      assert.equal(withTheSample.detectFormat(input), expected, path);
      assert.equal(waveOne.detectFormat(input), expected, `${path} without the sample`);
    }

    // Named explicitly it is chosen at once, and its grammar is reachable.
    assert.equal(withTheSample.detectFormat(own, sample.SAMPLE_FORMAT), sample.SAMPLE_FORMAT);
    assert.equal(
      withTheSample.detectFormat({ path: "specs/x/tasks.md", head: "" }, sample.SAMPLE_FORMAT),
      sample.SAMPLE_FORMAT,
    );
    assert.equal(
      adapters.grammarOf(sample.SAMPLE_FORMAT, withTheSample)?.name,
      sample.SAMPLE_FORMAT,
    );

    // The names, in REGISTRATION order: the three of Wave 1, then the added one.
    assert.deepEqual([...withTheSample.names()], [...FORMAT_NAMES, sample.SAMPLE_FORMAT]);

    // An added adapter that THROWS in `detect` is passed over, and detection
    // still answers (F104-FR-009).
    const withAThrower = adapters.createFullRegistry();
    withAThrower.register(
      Object.freeze({
        name: "a-format-that-fails-to-detect",
        band: sample.SAMPLE_BAND,
        builtIn: false,
        detect(): never {
          throw new Error("the adapter fails in `detect`");
        },
      }),
    );
    assert.equal(
      withAThrower.claims(own).some((one) => one.name === "a-format-that-fails-to-detect"),
      false,
    );
    assert.equal(withAThrower.detectFormat(own), specModel.FALLBACK_FORMAT);
  },
};

const fromTheTestTree: ConformanceCase = {
  id: "CT-104-4/sample-format-from-the-test-tree",
  title:
    "the sample format is registered from the test tree with the class `first-party`, is " +
    "detected, parsed, validated, ticked and has its `inputs` read over real files, and no core " +
    "file names a sample (F104-FR-009, F104-SC-006, F100-FR-018)",
  level: "behaviour",
  proves: ["F104-FR-009", "F104-SC-006"],
  async run(implementation) {
    // F100-FR-018 — the sample of EP-03 registers from the test tree.
    const registered = await registerSamples({ only: ["EP-03"] });
    assert.equal(registered.length, 1);
    assert.equal(registered[0]?.ep, "EP-03");
    assert.equal(registered[0]?.implementationClass, SAMPLE_CLASS);

    // And this suite's own implementation is in the registry of the point,
    // because `runSuite` of the frame put it there (F100-FR-017).
    const records = registryOf(POINT_ID).resolved();
    const mine = records.find((one) => one.implementationId === implementation.id);
    assert.ok(mine !== undefined, `the registry of EP-03 holds ${implementation.id}`);
    assert.equal(mine.implementationClass, "first-party");
    assert.equal(mine.major, 1);
    assert.equal(mine.pointId, POINT_ID);

    // ONE format, two faces: the minimal sample of feature 100 and the grammar
    // of T041 answer to the same name, and it is no format of Wave 1.
    assert.equal(sample.SAMPLE_FORMAT, MINIMAL_SAMPLE_FORMAT);
    assert.equal(sample.IS_A_FORMAT_OF_WAVE_1, false);
    assert.equal((FORMAT_NAMES as readonly string[]).includes(sample.SAMPLE_FORMAT), false);

    // The whole chain over a REAL file, in a scratch workspace: detect, parse,
    // validate, tick, inputs.
    const workspace = workspaceWithTheFixture();
    try {
      const text = readFileSync(workspace.path, "utf8");
      const registry = sample.registryWithTheSampleFormat();
      const format = registry.detectFormat({ path: sample.SAMPLE_PATH, head: text.slice(0, 400) });
      assert.equal(format, sample.SAMPLE_FORMAT);

      const grammar = adapters.grammarOf(format, registry);
      assert.ok(grammar !== undefined);

      const declared = sample.inputsOf(workspace.root, workspace.path);
      assert.deepEqual(
        declared.map((one) => [one.name, one.kind, one.path]),
        [
          ["spec", "spec", sample.SAMPLE_PATH],
          ["tasks", "tasks", sample.SAMPLE_PATH],
        ],
      );
      // Every hash is the canonical hasher's, and only the task list carries
      // the hash that ignores checkboxes (`contracts/verdict.md`).
      for (const one of declared) assert.equal(one.contentHash, GOLDEN_HASHES.content);
      assert.equal(declared[0]?.checkboxInsensitiveHash, undefined);
      assert.equal(declared[1]?.checkboxInsensitiveHash, GOLDEN_HASHES.ignoringCheckboxes);

      const model = specValidate.parse(
        {
          file: sample.SAMPLE_PATH,
          text,
          format,
          feature: sample.SAMPLE_FEATURE,
          sources: declared,
        },
        grammar,
      );
      assert.deepEqual([...specValidate.validate(model, text, grammar)], []);
      assert.equal(specValidate.phaseCountOf(model), 2);
      assert.deepEqual([...specValidate.numbersOf(model)], [1, 2]);
      assert.equal(specValidate.titleOf(model, 2), "Tick the sample");
      assert.equal(specValidate.shapeOf(model, 1), GOLDEN_HASHES.shapeOfStep1);

      const result = specTick.tickFile(
        {
          path: workspace.path,
          format,
          request: { taskIds: THE_THREE_TASKS },
          file: sample.SAMPLE_PATH,
        },
        grammar,
      );
      assert.equal(result.changed, 3);
      assert.deepEqual(changedBytesOf(text, readFileSync(workspace.path, "utf8")), [
        ...GOLDEN_CHANGED_BYTES,
      ]);
    } finally {
      rmSync(workspace.root, { recursive: true, force: true });
    }

    // F104-SC-006 — and no core file names a sample of the test tree. The
    // whole of that criterion, with its falsification, is the static test of
    // T041; this is the part the suite itself can answer.
    assert.deepEqual([...coreFilesNamingASample()], []);
    assert.match(THE_STATIC_TEST_OF_T041, /\.test\.ts$/);
  },
};

/** CT-104-4 — the behaviour cases of EP-03, in the order of the table above. */
export const cases: readonly ConformanceCase[] = Object.freeze([
  golden,
  roundTrip,
  hashes,
  detection,
  fromTheTestTree,
]);

/** The subject of the cases: the sample format added from the test tree. */
export const implementation = sample.implementation;

await casesAsTests(POINT_ID, implementation, cases);
