/**
 * T025 — the `speckit-tasks` adapter: the as-is Spec Kit grammar
 * (F104-FR-012) and its findings (F104-FR-015).
 *
 * The records it is measured against, each read at its line of
 * `lib/specstride_spec.py` by research report R18:
 *
 *  - B-2024 the explicit heading, `## Phase <digits>` with an optional `:` and
 *    free title text;
 *  - B-2025 the priority form, `## P<N>` / `## p<N>` with an optional `-`, em
 *    dash or `:` separator;
 *  - B-2026 the criteria: every checkbox line with non-empty text ANYWHERE in
 *    the phase section, under any `###` heading, not only `T###` lines;
 *  - B-2027 the priority form's phases and their contiguous numbering;
 *  - B-2028 the level-2 sections after the last task-bearing group, appended
 *    to every phase's section as shared constraints;
 *  - B-2029 the priority title, which keeps the priority label;
 *  - B-2030 explicit headings win; the priority form is used only when no
 *    explicit phase exists;
 *  - B-2006, B-2007 the two findings of this format.
 *
 * Two readings are recorded in the code rather than chosen silently; both are
 * exported, so a test MEASURES where they differ.
 *
 *  1. **What makes a priority section a phase.** F104-FR-012, the authority,
 *     says "only sections that hold CHECKBOXES are phases"; B-2027 says "task
 *     checkboxes", and B-2007's text names `"- [ ] T### ..."` lines. The
 *     requirement is followed (`holdsACheckbox`); `holdsATaskCheckbox` carries
 *     the narrower reading.
 *  2. **Where the criteria and the tasks of a priority phase come from.** The
 *     shared constraints of B-2028 are appended to the phase's `section`, but
 *     the criteria and the tasks are read from the phase's OWN section: B-2028
 *     calls them constraints, not criteria. `criteriaOf` is exported, so the
 *     other reading is one call away and the difference is measurable.
 */
import {
  type SpecFinding,
  type SpecGrammar,
  type SpecPhase,
  type SpecTask,
  CRITERIA_HEADING,
  isACheckboxWithText,
  level2SectionsOf,
  linesOf,
  readCheckboxLine,
  structuredTaskOfLine,
  textOfSection,
  type Level2Section,
} from "../model.ts";
import { duplicateAndContiguityFindings, finding } from "./native.ts";

/**
 * B-2004 and B-2005 are "(all formats)", and `finding` is the one shape of a
 * finding: all three are re-exported here rather than restated, so that the
 * sharing is OBSERVABLE (the parity test of T018 compares the three adapters'
 * exports by identity) and a second copy of either text cannot appear.
 */
export { duplicateAndContiguityFindings, finding };

/** The name of the format this module is the grammar of. */
export const FORMAT = "speckit-tasks" as const;

/** The requirements this module carries out. */
export const REQUIREMENTS = [
  "F104-FR-012",
  "F104-FR-014",
  "F104-FR-015",
  "F104-FR-017",
  "F154-FR-056",
] as const;

/** The records of the baseline it is measured against. */
export const BEHAVIOUR_ROWS = Object.freeze([
  "B-2024",
  "B-2025",
  "B-2026",
  "B-2027",
  "B-2028",
  "B-2029",
  "B-2030",
  "B-2006",
  "B-2007",
  "B-2054",
]);

/**
 * B-2024 — the EXPLICIT heading: `## Phase <digits>`, then a run of the
 * separators (`-`, the em dash, `:`) with surrounding blanks, then free title
 * text. Case-sensitive: a lower-case `## phase 1:` is not a phase heading
 * (DV-119, CQ-045). The separator run mirrors the baseline's
 * `_NATIVE_TITLE_STRIP` (`^[0-9]+[ \t]*[-—:]*[ \t]*`), which strips the
 * number AND the separator run from the title — `## Phase 1 — Setup` titles
 * the phase `Setup`, not `— Setup` (F153-FR-061, the parity drive: the
 * as-is obligation's `- Action:` line names the stripped title).
 */
export const EXPLICIT_PHASE_HEADING = /^##[ \t]+Phase[ \t]+(\d+)[ \t]*[-—:]*[ \t]*(.*)$/;

/** B-2025 — the PRIORITY heading: `## P<N>` or `## p<N>`, then a separator. */
export const PRIORITY_PHASE_HEADING = /^##[ \t]*([Pp])(\d+)[ \t]*[-—:]?[ \t]*(.*)$/;

/** The separators B-2025 allows after the priority number. */
export const PRIORITY_SEPARATORS = Object.freeze(["-", "—", ":"]);

/** The number of an explicit heading, or `undefined`. */
export function explicitPhaseNumberOf(headingLine: string): number | undefined {
  const found = EXPLICIT_PHASE_HEADING.exec(headingLine);
  if (found === null) return undefined;
  return Number.parseInt(found[1] as string, 10);
}

/** B-2024 — the title of an explicit heading: the free text after the number and its separator run. */
export function titleOfAnExplicitHeading(headingLine: string): string {
  const found = EXPLICIT_PHASE_HEADING.exec(headingLine);
  if (found === null) return "";
  return (found[2] as string).trimEnd();
}

/** The priority number of a priority heading, or `undefined`. */
export function priorityNumberOf(headingLine: string): number | undefined {
  const found = PRIORITY_PHASE_HEADING.exec(headingLine);
  if (found === null) return undefined;
  return Number.parseInt(found[2] as string, 10);
}

/**
 * B-2029 — the title of a priority phase KEEPS the priority label: it is the
 * whole heading text after `##`.
 */
export function titleOfAPriorityHeading(headingLine: string): string {
  return headingLine.replace(/^##[ \t]*/, "").trimEnd();
}

/** B-2030 — true where the text holds at least one EXPLICIT phase heading. */
export function hasAnExplicitPhase(text: string): boolean {
  return linesOf(text).some((line) => EXPLICIT_PHASE_HEADING.test(line));
}

/**
 * B-2026 — the criteria: every checkbox line with non-empty text anywhere in
 * the section, under any `###` heading. The TEXT of the line is the criterion,
 * `T###` lines included.
 */
export function criteriaOf(section: string): readonly string[] {
  return Object.freeze(
    linesOf(section)
      .map((line) => readCheckboxLine(line))
      .filter((box): box is NonNullable<typeof box> => box !== undefined && box.text !== "")
      .map((box) => box.text),
  );
}

/** F104-FR-012 — a section is a phase of the priority form when it holds a checkbox. */
export function holdsACheckbox(section: string): boolean {
  return linesOf(section).some((line) => isACheckboxWithText(line));
}

/**
 * The NARROWER reading of B-2027 and B-2007: a section holds a checkbox whose
 * text opens with a `T` task id. It is not the rule — F104-FR-012 is — but the
 * difference between the two is measured by the parity tests of T019.
 */
export function holdsATaskCheckbox(section: string): boolean {
  return linesOf(section).some(
    (line, index) => structuredTaskOfLine(line, index + 1, "", "T-id") !== undefined,
  );
}

/** The structured tasks of a section, with the file's own line numbers. */
export function tasksOf(section: Level2Section, file: string): readonly SpecTask[] {
  const tasks: SpecTask[] = [];
  section.lines.forEach((line, offset) => {
    const task = structuredTaskOfLine(line, section.headingLine + offset, file, "T-id");
    if (task !== undefined) tasks.push(task);
  });
  return Object.freeze(tasks);
}

/**
 * F104-FR-012 — the phases of a Spec Kit task list. Explicit headings win
 * (B-2030); the priority form is read only when there is no explicit phase.
 * A pure function of the text.
 */
export function phasesOf(text: string, file: string): readonly SpecPhase[] {
  const sections = level2SectionsOf(text);
  if (hasAnExplicitPhase(text)) {
    const phases: SpecPhase[] = [];
    for (const section of sections) {
      const number = explicitPhaseNumberOf(section.heading);
      if (number === undefined) continue;
      const body = textOfSection(section);
      phases.push(
        // F154-FR-056 (T131) — the phase's own specstride comment line, when
        // the section carries one; a phase with no line carries the EMPTY
        // `dependsOn` list (no declared dependencies) and no write scope.
        withDependencyFields(
          Object.freeze({
            number,
            title: titleOfAnExplicitHeading(section.heading),
            section: body,
            criteria: criteriaOf(body),
            tasks: tasksOf(section, file),
          }),
          section,
        ),
      );
    }
    return Object.freeze(phases);
  }
  return priorityPhasesOf(sections, file);
}

/**
 * B-2027, B-2028, B-2029 — the priority form. Only sections that hold a
 * checkbox are phases; they are numbered contiguously in document order from
 * the FIRST priority number, so a repeated priority is valid; the level-2
 * sections after the last such group are appended to every phase's section as
 * shared constraints.
 */
export function priorityPhasesOf(
  sections: readonly Level2Section[],
  file: string,
): readonly SpecPhase[] {
  const bearing = sections
    .map((section, index) => ({ section, index, priority: priorityNumberOf(section.heading) }))
    .filter(
      (entry): entry is { section: Level2Section; index: number; priority: number } =>
        entry.priority !== undefined && holdsACheckbox(textOfSection(entry.section)),
    );
  if (bearing.length === 0) return Object.freeze([]);
  const first = (bearing[0] as { priority: number }).priority;
  const last = bearing[bearing.length - 1] as { index: number };
  // B-2028 — every level-2 section AFTER the last task-bearing group.
  const shared = sections.slice(last.index + 1).map((section) => textOfSection(section));
  return Object.freeze(
    bearing.map((entry, offset) => {
      const own = textOfSection(entry.section);
      return withDependencyFields(
        Object.freeze({
          number: first + offset,
          title: titleOfAPriorityHeading(entry.section.heading),
          // The shared constraints are part of what an agent is shown...
          section: [own, ...shared].join("\n"),
          // ...but the criteria and the tasks are the phase's OWN (see the note
          // at the head of this module, reading 2).
          criteria: criteriaOf(own),
          tasks: tasksOf(entry.section, file),
        }),
        entry.section,
      );
    }),
  );
}

/* ------------------------------------------------------------------ *
 * The specstride dependency line (feature 154, F154-FR-056; T131).
 *
 * UNDER EACH PHASE HEADING there may be EXACTLY ONE comment line of the
 * form
 *
 *     <!-- specstride: depends-on: [2, 5] scope: packages/a/ packages/b/ -->
 *
 * Nothing else is parsed (Principle IV): any other line, marker or
 * annotation of the section is text, and a specstride comment that is NOT
 * immediately after the heading is an error, not an ignored line.
 * ------------------------------------------------------------------ */

/** The token names the line may carry — no other token is parsed. */
export const DEPENDENCY_LINE_TOKENS = Object.freeze(["depends-on", "scope"]);

/** The fields one parsed line carries; a token left out stays absent. */
export type DependencyLine = {
  readonly dependsOn?: readonly number[];
  readonly writeScope?: readonly string[];
};

/**
 * The parse error of a malformed line: the 1-based line of the file and the
 * 1-based column of the offending character travel WITH the error.
 */
export class SpecstrideLineError extends Error {
  readonly line: number;
  readonly column: number;
  constructor(message: string, line: number, column: number) {
    super(`${message} (line ${String(line)}, column ${String(column)})`);
    this.name = "SpecstrideLineError";
    this.line = line;
    this.column = column;
  }
}

/** True where the line IS a specstride comment line (well-formed or not). */
export function isASpecstrideLine(line: string): boolean {
  return line.includes("specstride:") && /^\s*<!--/.test(line);
}

/**
 * T131 — parse ONE specstride comment line. `undefined` where the line is
 * no specstride comment line at all; a `SpecstrideLineError` where it is
 * one and malformed. Duplicated numbers of `depends-on` are de-duplicated
 * silently, first occurrence first; the prefixes of `scope` keep their
 * order and are normalized to end with `/`; nothing is resolved to an
 * absolute path.
 */
export function parseDependencyLine(line: string, lineNumber: number): DependencyLine | undefined {
  if (!isASpecstrideLine(line)) return undefined;
  const open = line.indexOf("<!--");
  const specAt = line.indexOf("specstride:");
  const afterOpen = open + 4;
  const afterOpenText = line.slice(afterOpen, specAt < 0 ? afterOpen : specAt);
  if (specAt < afterOpen || !/^\s*$/.test(afterOpenText)) {
    throw new SpecstrideLineError(
      "the specstride comment must open `<!-- specstride:`",
      lineNumber,
      (specAt < 0 ? open : specAt) + 1,
    );
  }
  const contentStart = specAt + "specstride:".length;
  const close = line.indexOf("-->", contentStart);
  if (close === -1) {
    throw new SpecstrideLineError(
      "the specstride comment never closes (`-->` missing)",
      lineNumber,
      line.length + 1,
    );
  }
  if (line.slice(close + 3).trim() !== "") {
    throw new SpecstrideLineError("text after the comment close", lineNumber, close + 4);
  }
  const content = line.slice(contentStart, close);
  const at = (index: number): number => contentStart + index + 1;
  const seen = new Set<string>();
  let p = 0;
  let parsed: { dependsOn?: readonly number[]; writeScope?: readonly string[] } = {};
  for (;;) {
    while (p < content.length && /\s/.test(content[p] as string)) p += 1;
    if (p >= content.length) break;
    const nameStart = p;
    const name = (content.slice(p).match(/^[A-Za-z][A-Za-z0-9-]*/) ?? [""])[0];
    if (name === "") {
      throw new SpecstrideLineError("expected a token name", lineNumber, at(p));
    }
    p += name.length;
    if (!DEPENDENCY_LINE_TOKENS.includes(name)) {
      throw new SpecstrideLineError(`unknown token \`${name}\``, lineNumber, at(nameStart));
    }
    if (seen.has(name)) {
      throw new SpecstrideLineError(`duplicate token \`${name}\``, lineNumber, at(nameStart));
    }
    while (p < content.length && /\s/.test(content[p] as string)) p += 1;
    if (content[p] !== ":") {
      throw new SpecstrideLineError(`expected \`:\` after \`${name}\``, lineNumber, at(p));
    }
    p += 1;
    seen.add(name);
    if (name === "depends-on") {
      while (p < content.length && /\s/.test(content[p] as string)) p += 1;
      if (content[p] !== "[") {
        throw new SpecstrideLineError("`depends-on` needs a bracketed list", lineNumber, at(p));
      }
      p += 1;
      const numbers: number[] = [];
      for (;;) {
        while (p < content.length && /[\s,]/.test(content[p] as string)) p += 1;
        if (p >= content.length) {
          throw new SpecstrideLineError(
            "the `depends-on` list never closes (`]` missing)",
            lineNumber,
            at(content.length - 1) + 1,
          );
        }
        if (content[p] === "]") {
          p += 1;
          break;
        }
        const digits = (content.slice(p).match(/^\d+/) ?? [""])[0];
        if (digits === "") {
          throw new SpecstrideLineError(
            "`depends-on` holds a value that is not an integer",
            lineNumber,
            at(p),
          );
        }
        const endOfDigits = p + digits.length;
        const after = content[endOfDigits] ?? "";
        if (after !== "" && !/[\s,\]]/.test(after)) {
          throw new SpecstrideLineError(
            "`depends-on` holds a value that is not an integer",
            lineNumber,
            at(endOfDigits),
          );
        }
        const value = Number.parseInt(digits, 10);
        if (!numbers.includes(value)) numbers.push(value);
        p = endOfDigits;
      }
      parsed = { ...parsed, dependsOn: Object.freeze(numbers) };
    } else {
      // `scope` — one or more path prefixes, whitespace separated, in order.
      while (p < content.length && /\s/.test(content[p] as string)) p += 1;
      const restStart = p;
      const prefixes = content
        .slice(p)
        .split(/\s+/)
        .filter((one) => one !== "");
      if (prefixes.length === 0) {
        throw new SpecstrideLineError(
          "`scope` needs at least one path prefix",
          lineNumber,
          at(restStart),
        );
      }
      const normalized = prefixes.map((one) => (one.endsWith("/") ? one : `${one}/`));
      p = content.length;
      parsed = { ...parsed, writeScope: Object.freeze(normalized) };
    }
  }
  const frozen: DependencyLine = {
    ...(parsed.dependsOn === undefined ? {} : { dependsOn: parsed.dependsOn }),
    ...(parsed.writeScope === undefined ? {} : { writeScope: parsed.writeScope }),
  };
  return frozen;
}

/**
 * The ONE specstride comment line of a phase section: the first non-blank
 * line after the heading, at most one in the whole section (F154-FR-056).
 * `undefined` where the section declares none.
 */
export function dependencyOfTheSection(section: Level2Section): DependencyLine | undefined {
  let seen: { readonly fields: DependencyLine } | undefined;
  let firstBlankPassed = false;
  for (let index = 1; index < section.lines.length; index += 1) {
    const line = section.lines[index] as string;
    const lineNumber = section.headingLine + index;
    const fields = parseDependencyLine(line, lineNumber);
    if (fields === undefined) {
      if (line.trim() !== "") firstBlankPassed = true;
      continue;
    }
    const columnOfFirstChar = (line.match(/\S/)?.index ?? 0) + 1;
    if (firstBlankPassed) {
      throw new SpecstrideLineError(
        "the specstride comment line must come immediately after the phase heading",
        lineNumber,
        columnOfFirstChar,
      );
    }
    if (seen !== undefined) {
      throw new SpecstrideLineError(
        "a phase carries at most one specstride comment line",
        lineNumber,
        columnOfFirstChar,
      );
    }
    seen = { fields };
  }
  return seen?.fields;
}

/**
 * The fields of the line folded into a phase.
 *
 * T131 (F154-FR-056) — a phase whose section carries NO specstride line has
 * NO DECLARED DEPENDENCIES, and the phase carries that fact EXPLICITLY as
 * `dependsOn: []` (the empty list, the same value a declared empty
 * `depends-on: []` gives, so a reader answers one shape for both); its
 * `writeScope` stays absent, because the source declares no scope. The queue
 * of the engine (PQ-3) treats a missing and an empty declared list
 * identically; the parser infers nothing beyond the empty list.
 */
function withDependencyFields(phase: SpecPhase, section: Level2Section): SpecPhase {
  const fields = dependencyOfTheSection(section);
  return Object.freeze({
    ...phase,
    dependsOn: fields?.dependsOn ?? [],
    ...(fields?.writeScope === undefined ? {} : { writeScope: fields.writeScope }),
  });
}

/** B-2028 — the shared constraints of a priority-form task list, as text. */
export function sharedConstraintsOf(text: string): readonly string[] {
  const sections = level2SectionsOf(text);
  if (hasAnExplicitPhase(text)) return Object.freeze([]);
  let last = -1;
  sections.forEach((section, index) => {
    if (priorityNumberOf(section.heading) !== undefined && holdsACheckbox(textOfSection(section))) {
      last = index;
    }
  });
  if (last === -1) return Object.freeze([]);
  return Object.freeze(sections.slice(last + 1).map((section) => textOfSection(section)));
}

/* ------------------------------------------------------------------ *
 * The findings of `validate` (F104-FR-015).
 * ------------------------------------------------------------------ */

/** B-2006 — the Spec Kit "zero phases" finding. */
export const ZERO_PHASES =
  'tasks.md has zero phases (need task-bearing "## Phase <N>:" or "## P<N>" sections)';

/** B-2007 — the Spec Kit "no task checkboxes" finding, per phase. */
export function noTaskCheckboxes(number: number, title: string): string {
  return `phase ${number} (${title}) has no task checkboxes ("- [ ] T### ..." lines)`;
}

/**
 * F104-FR-015 — the Spec Kit findings: zero phases, then the per-phase
 * "no task checkboxes" message in scan order, then the duplicate and
 * contiguity messages of B-2004 and B-2005, which are "(all formats)".
 */
export function findingsOf(phases: readonly SpecPhase[], _text: string): readonly SpecFinding[] {
  if (phases.length === 0) return Object.freeze([finding(ZERO_PHASES)]);
  const findings: SpecFinding[] = [];
  for (const phase of phases) {
    if (phase.criteria.length === 0) {
      findings.push(finding(noTaskCheckboxes(phase.number, phase.title)));
    }
  }
  findings.push(...duplicateAndContiguityFindings(phases.map((p) => p.number)));
  return Object.freeze(findings);
}

/** F104-FR-014, B-2042 — the title of a bare section, explicit form first. */
export function titleOfASection(section: string): string | undefined {
  const lines = linesOf(section);
  const explicit = lines.find((line) => EXPLICIT_PHASE_HEADING.test(line));
  if (explicit !== undefined) return titleOfAnExplicitHeading(explicit);
  const priority = lines.find((line) => PRIORITY_PHASE_HEADING.test(line));
  if (priority !== undefined) return titleOfAPriorityHeading(priority);
  return undefined;
}

/** F104-FR-014 — the title of a bare section read as the PRIORITY form only. */
export function titleOfAPrioritySection(section: string): string | undefined {
  const priority = linesOf(section).find((line) => PRIORITY_PHASE_HEADING.test(line));
  if (priority === undefined) return undefined;
  return titleOfAPriorityHeading(priority);
}

/** F104-FR-014 — the title of a bare section read as the EXPLICIT form only. */
export function titleOfAnExplicitSection(section: string): string | undefined {
  const explicit = linesOf(section).find((line) => EXPLICIT_PHASE_HEADING.test(line));
  if (explicit === undefined) return undefined;
  return titleOfAnExplicitHeading(explicit);
}

/**
 * F104-FR-017, B-2054 — only a Spec Kit file with EXPLICIT `## Phase N`
 * headings may be ticked; the priority form is left as it is, with 0 ticked.
 */
export function mayBeTicked(text: string): boolean {
  return hasAnExplicitPhase(text);
}

/** The `speckit-tasks` grammar. */
export const grammar: SpecGrammar = Object.freeze({
  name: FORMAT,
  taskIdForm: "T-id" as const,
  criteriaHeading: CRITERIA_HEADING[FORMAT],
  phasesOf,
  findingsOf,
  titleOfASection,
  mayBeTicked,
});
