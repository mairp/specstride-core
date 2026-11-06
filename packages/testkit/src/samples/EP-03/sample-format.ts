/**
 * T041 of feature 104 — THE SAMPLE FORMAT, added from the test tree.
 *
 * `./index.ts` is feature 100's MINIMAL sample of EP-03 (T101): a data-shaped
 * implementation whose `parse` hands back a frozen model, enough for the five
 * checks every conformance suite makes at contract level. This module is the
 * same format with a WORKING grammar beside it, which is what F104-FR-009 and
 * F104-SC-006 ask for:
 *
 *   "A sample format registered from the test tree MUST be detected, parsed,
 *    validated, ticked and run with no change to a core file."
 *
 * It is ONE format, not two: `SAMPLE_FORMAT` below IS the `FORMAT` of
 * `./index.ts`, and `detect` is that module's own `detect`, imported rather
 * than restated. What is added here is the grammar half — `phasesOf`,
 * `findingsOf`, `titleOfASection`, `mayBeTicked` — and the `inputs` of
 * F104-FR-023 over real files.
 *
 * Two things about the way it is written matter as much as what it does.
 *
 *  1. It writes NO grammar of its own for a checkbox or a task line. Every
 *     task line is read by `structuredTaskOfLine` of the one grammar owner
 *     (`@specstride/spec-formats`, F104-FR-008, F104-SC-001), and the shared
 *     duplicate and contiguity findings of B-2004 and B-2005 are the native
 *     adapter's own exported function. The only rules this module adds are the
 *     two the SAMPLE FORMAT differs by: its step heading and its criteria
 *     heading, neither of which recognises a heading or a task line of any
 *     format of Wave 1.
 *  2. It is reached only from the test tree. No file of a core package of
 *     `packages/contracts/data/package-graph.json` names this module, this
 *     format or `@specstride/spec-formats`; the static test of T041
 *     (`packages/spec-formats/test/static/sample-format-outside-the-core.test.ts`)
 *     measures that and is falsifiable in both directions.
 *
 * The format itself, in four lines:
 *
 *   ## Step <n> — <title>     a phase heading
 *   ### Checks                the acceptance criteria of the step
 *   ### Tasks                 the task lines of the step
 *   - [ ] T001 [P] text       a task, in the `T` id form of F104-FR-022
 */
import { adapters, model, registry, sources, tick, validate } from "@specstride/spec-formats";
import { FORMAT, operations as minimalOperations } from "./index.ts";
import type { Implementation } from "../../conformance/frame.ts";

/* ------------------------------------------------------------------ *
 * The name, and where it comes from.
 * ------------------------------------------------------------------ */

/**
 * The name of the added format. It IS the `FORMAT` of `./index.ts`: the
 * minimal sample of feature 100 and this grammar are two faces of one format,
 * so a test can prove that the suite's contract-level cases and its behaviour
 * cases speak about the same thing.
 */
export const SAMPLE_FORMAT: string = FORMAT;

/** The format is NOT a format of Wave 1 (F104-FR-008). */
export const IS_A_FORMAT_OF_WAVE_1 = false as const;

/** The band of F104-FR-009 an added format claims in: below every built-in. */
export const SAMPLE_BAND: registry.PriorityBandName = "added";

/** The step of the detection order an added format is asked at (CQ-040). */
export const SAMPLE_DETECTION_STEP = 5.5 as const;

/** The feature slug the sample's fixture belongs to. */
export const SAMPLE_FEATURE = "000-sample" as const;

/** The repository-relative path of the sample's fixture. */
export const SAMPLE_PATH = "specs/000-sample/the-sample.sample.md" as const;

/* ------------------------------------------------------------------ *
 * The two rules the sample format adds.
 * ------------------------------------------------------------------ */

/**
 * The step heading: `## Step <digits>`, then the rest of the line. It is the
 * sample's own phase heading, and it recognises NO heading of `native`,
 * `speckit-tasks` or `openspec-change` — which is what makes the sample a
 * format of its own rather than a second reader of a Wave 1 grammar.
 */
export const STEP_HEADING = /^##[ \t]+Step[ \t]+(\d+)(.*)$/;

/** The heading the sample shows its acceptance criteria under. */
export const CRITERIA_HEADING = "### Checks" as const;

/** That heading as a line rule. */
export const CRITERIA_HEADING_LINE = /^###[ \t]*Checks[ \t]*$/;

/** The form a task id takes in the sample format (F104-FR-022). */
export const TASK_ID_FORM = "T-id" as const;

/** The step number of a heading line, or `undefined` where it is none. */
export function stepNumberOf(headingLine: string): number | undefined {
  const found = STEP_HEADING.exec(headingLine);
  if (found === null) return undefined;
  return Number.parseInt(found[1] as string, 10);
}

/** The title of a step heading: the text after the number, separators removed. */
export function titleOfHeading(headingLine: string): string {
  const found = STEP_HEADING.exec(headingLine);
  if (found === null) return "";
  return (found[2] as string)
    .trim()
    .replace(adapters.native.LEADING_TITLE_SEPARATORS, "")
    .trimEnd();
}

/** Whether a step section holds a `### Checks` block at all. */
export function hasACriteriaBlock(section: string): boolean {
  return model.linesOf(section).some((line) => CRITERIA_HEADING_LINE.test(line));
}

/**
 * The criteria of a step: the TEXT of the checkbox lines inside its `### Checks`
 * block, which ends at the next level-3 heading. The checkbox itself is read by
 * `readCheckboxLine` of the one grammar owner.
 */
export function criteriaOf(section: string): readonly string[] {
  const criteria: string[] = [];
  let inside = false;
  for (const line of model.linesOf(section)) {
    if (inside && model.LEVEL_3_HEADING.test(line)) break;
    if (!inside) {
      if (CRITERIA_HEADING_LINE.test(line)) inside = true;
      continue;
    }
    const box = model.readCheckboxLine(line);
    if (box !== undefined) criteria.push(box.text);
  }
  return Object.freeze(criteria);
}

/* ------------------------------------------------------------------ *
 * The grammar (F104-FR-009: `parse`, `validate`, `tick`).
 * ------------------------------------------------------------------ */

/**
 * The phases of a sample spec: a PURE function of the text. The line geometry
 * (`level2SectionsOf`, trailing blank lines kept) and every task line come from
 * the one grammar owner; the only thing read here is the step heading.
 */
export function phasesOf(text: string, file: string): readonly model.SpecPhase[] {
  const phases: model.SpecPhase[] = [];
  for (const section of model.level2SectionsOf(text)) {
    const number = stepNumberOf(section.heading);
    if (number === undefined) continue;
    const body = model.textOfSection(section);
    const tasks: model.SpecTask[] = [];
    section.lines.forEach((line, index) => {
      const task = model.structuredTaskOfLine(
        line,
        section.headingLine + index,
        file,
        TASK_ID_FORM,
      );
      if (task !== undefined) tasks.push(task);
    });
    phases.push(
      Object.freeze({
        number,
        title: titleOfHeading(section.heading),
        section: body,
        criteria: criteriaOf(body),
        tasks: Object.freeze(tasks),
      }),
    );
  }
  return Object.freeze(phases);
}

/** The sample's "zero steps" finding. */
export const ZERO_STEPS = 'spec has zero phases (need at least one "## Step <N>")';

/** The sample's "no criteria block" finding, per step. */
export function noCriteriaBlock(number: number): string {
  return `phase ${number} has no "${CRITERIA_HEADING}" block`;
}

/**
 * The findings of the sample format. The duplicate and the contiguity finding
 * are "(all formats)" in B-2004 and B-2005, so they are the native adapter's
 * own exported function and are NOT restated here.
 */
export function findingsOf(
  phases: readonly model.SpecPhase[],
  _text: string,
): readonly model.SpecFinding[] {
  if (phases.length === 0) return Object.freeze([adapters.native.finding(ZERO_STEPS)]);
  const findings: model.SpecFinding[] = [];
  for (const phase of phases) {
    if (!hasACriteriaBlock(phase.section)) {
      findings.push(adapters.native.finding(noCriteriaBlock(phase.number)));
    }
  }
  findings.push(...adapters.native.duplicateAndContiguityFindings(phases.map((p) => p.number)));
  return Object.freeze(findings);
}

/** The title of a bare section of the sample format, or `undefined`. */
export function titleOfASection(section: string): string | undefined {
  const heading = model.linesOf(section).find((line) => STEP_HEADING.test(line));
  if (heading === undefined) return undefined;
  return titleOfHeading(heading);
}

/** A sample spec carries task lines, so it may be ticked (F104-FR-017). */
export function mayBeTicked(_text: string): boolean {
  return true;
}

/** The grammar of the sample format, as `parse`, `validate` and `tick` take it. */
export const grammar: model.SpecGrammar = Object.freeze({
  name: SAMPLE_FORMAT,
  taskIdForm: TASK_ID_FORM,
  criteriaHeading: CRITERIA_HEADING,
  phasesOf,
  findingsOf,
  titleOfASection,
  mayBeTicked,
});

/* ------------------------------------------------------------------ *
 * The adapter the registry of F104-FR-008 takes.
 * ------------------------------------------------------------------ */

/**
 * The registrable adapter: the `detect` of the minimal sample, the band of an
 * added format, and the grammar above. `detect` returns the priority 900,
 * which the registry CLAMPS into the `added` band — a host cannot lift an added
 * format over a built-in rule by returning a large number (F104-FR-009).
 */
export function adapter(): registry.RegisteredAdapter {
  return Object.freeze({
    name: SAMPLE_FORMAT,
    band: SAMPLE_BAND,
    builtIn: IS_A_FORMAT_OF_WAVE_1,
    detect: minimalOperations.detect,
    grammar,
  });
}

/** A registry with the three formats of Wave 1 AND the sample format. */
export function registryWithTheSampleFormat(): registry.SpecFormatRegistry {
  const withTheSample = adapters.createFullRegistry();
  withTheSample.register(adapter());
  return withTheSample;
}

/* ------------------------------------------------------------------ *
 * The operations of EP-03 over the sample format.
 * ------------------------------------------------------------------ */

/** `parse` over a text of the sample format (F104-FR-010). */
export function parseText(
  text: string,
  file: string = SAMPLE_PATH,
  declared: readonly model.SpecSource[] = Object.freeze([]),
): model.CanonicalSpecModel {
  return validate.parse(
    { file, text, format: SAMPLE_FORMAT, feature: SAMPLE_FEATURE, sources: declared },
    grammar,
  );
}

/** `validate` over a text of the sample format (F104-FR-015). */
export function validateText(
  text: string,
  file: string = SAMPLE_PATH,
): readonly model.SpecFinding[] {
  return validate.validate(parseText(text, file), text, grammar);
}

/** `tick` over a text of the sample format: checkbox bytes and nothing else. */
export function tickTextOfTheSample(
  text: string,
  request: tick.TickRequest,
  file: string = SAMPLE_PATH,
): tick.TickResult {
  return tick.tickText({ text, format: SAMPLE_FORMAT, request, file }, grammar);
}

/**
 * `inputs` over the sample format: the ONE file, as `spec` and as `tasks`,
 * because a sample spec holds its criteria and its task list in one file. The
 * records come from `sourceRecordOf` of the one grammar owner, so every hash is
 * the canonical hasher's (F104-FR-023).
 */
export function inputsOf(
  root: string,
  specPath: string = SAMPLE_PATH,
): readonly model.SpecSource[] {
  const records: model.SpecSource[] = [];
  for (const declared of DECLARED_SOURCES) {
    const record = sources.sourceRecordOf({
      root,
      path: specPath,
      name: declared.name,
      kind: declared.kind,
    });
    if (record !== undefined) records.push(record);
  }
  return Object.freeze(records);
}

/** The sources the sample format declares, in the order spec, tasks. */
export const DECLARED_SOURCES: readonly sources.DeclaredSource[] = Object.freeze([
  Object.freeze({ name: "spec", kind: "spec" as const, file: "the-sample.sample.md" }),
  Object.freeze({ name: "tasks", kind: "tasks" as const, file: "the-sample.sample.md" }),
]);

/* ------------------------------------------------------------------ *
 * The fixtures.
 * ------------------------------------------------------------------ */

/** The valid fixture of the sample format: two steps, three tasks. */
export const SAMPLE_SPEC = [
  "# sample-format",
  "",
  "The specification of the sample format, which the test tree adds.",
  "",
  "## Step 1 — Read the sample",
  "",
  "### Checks",
  "",
  "- [ ] the added format is detected when its file is named",
  "- [ ] the added format loses to every built-in rule",
  "",
  "### Tasks",
  "",
  "- [ ] T001 [P] read the sample",
  "- [ ] T002 hash the sample",
  "",
  "## Step 2 — Tick the sample",
  "",
  "### Checks",
  "",
  "- [ ] a tick changes checkbox bytes and nothing else",
  "",
  "### Tasks",
  "",
  "- [ ] T003 tick the sample",
  "",
].join("\n");

/** An INVALID fixture: step 1, then step 3, and step 3 has no checks block. */
export const INVALID_SAMPLE_SPEC = [
  "# sample-format",
  "",
  "## Step 1 — The first step",
  "",
  "### Checks",
  "",
  "- [ ] the first step is checked",
  "",
  "## Step 3 — The step that skips a number",
  "",
  "### Tasks",
  "",
  "- [ ] T009 a task with no checks block above it",
  "",
].join("\n");

/* ------------------------------------------------------------------ *
 * The frame-shaped implementation, for `runSuite` of the test kit.
 * ------------------------------------------------------------------ */

/** The id the conformance report names this implementation by. */
export const IMPLEMENTATION_ID = "sample-spec-format-with-a-grammar" as const;

/** The five operations of EP-03, over the sample format's own fixture. */
export const operations = Object.freeze({
  detect: minimalOperations.detect,
  parse(files: readonly string[]): model.CanonicalSpecModel {
    return parseText(SAMPLE_SPEC, files[0] ?? SAMPLE_PATH);
  },
  validate(candidate: model.CanonicalSpecModel): readonly model.SpecFinding[] {
    return findingsOf(candidate.phases, SAMPLE_SPEC);
  },
  tick(request: tick.TickRequest): {
    readonly ticked: readonly { readonly taskId: string; readonly line: number }[];
    readonly otherBytesChanged: false;
  } {
    const result = tickTextOfTheSample(SAMPLE_SPEC, request);
    return Object.freeze({
      ticked: Object.freeze(
        result.taskIds.map((taskId, index) =>
          Object.freeze({ taskId, line: result.lines[index] ?? 0 }),
        ),
      ),
      otherBytesChanged: false as const,
    });
  },
  /**
   * `inputs` lists the sources THAT EXIST (F104-FR-023), and the fixture of
   * this sample is a string in this module rather than a file of the
   * repository: there is nothing on disk for the port to list, and a record
   * with an invented hash would be worse than an empty list. `inputsOf` above
   * is the operation over real files; `CT-104-4/sample-format-from-the-test-tree`
   * runs it against a scratch workspace it writes the fixture into.
   */
  inputs(): readonly model.SpecSource[] {
    return Object.freeze([]);
  },
  /** The same operation over a root that really holds the fixture. */
  inputsOf,
});

/** The implementation the registry of EP-03 takes (F100-FR-018). */
export const implementation: Implementation = Object.freeze({
  ep: "EP-03",
  pointId: "specstride.spec-format/1",
  id: IMPLEMENTATION_ID,
  implementationClass: "first-party",
  majors: [1],
  provenance: "default",
  operations,
});
