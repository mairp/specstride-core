// Feature 153, phase 14 (US4) — per-task critic evidence (F153-FR-051 to
// F153-FR-053, F153-SC-010, F153-SC-012).
//
// The evidence is a pure function of the task list, the changed paths and
// the file contents: the same tree gives byte-identical evidence however the
// run reached it (F153-SC-010). The unit reads nothing itself — the task→
// paths map, the changed paths and the `contentOf` reader are inputs handed
// in by the composition root (core imports neither the file system nor the
// carry modules). A path the budget leaves out is named NOT-SHOWN, never
// missing (F153-FR-052, F117-FR-008).
//
// The per-file cap is the grounding budget of F117-FR-011 scaled by the
// window of the critic model actually used (F117-FR-025, `scaledCap`),
// never below `MIN_SCALED_BUDGET_BYTES` (Principle IX). A file above the
// head-tail threshold is shown as its head, a left-out byte count and its
// tail, with the sizes the grounding budget states.

import {
  BUDGETS,
  GROUNDING_HEAD_BYTES,
  GROUNDING_HEAD_TAIL_THRESHOLD,
  GROUNDING_TAIL_BYTES,
} from "../grounding/grounding.ts";
import { MIN_SCALED_BUDGET_BYTES, scaledCap } from "../prompt/fit.ts";

/** The input: the tasks of the phase (or group), the changed tree, a reader. */
export interface PerTaskEvidenceInput {
  /** The tasks in their canonical order, each with the paths its text names. */
  readonly tasks: readonly {
    readonly id: string;
    readonly paths: readonly string[];
  }[];
  /** The changed paths of the candidate, in any order. */
  readonly changedPaths: readonly string[];
  /** The reader of one path's content; `undefined` when the file is missing. */
  readonly contentOf: (path: string) => string | undefined;
  /** The window of the critic model actually used, in tokens; undefined when unknown. */
  readonly windowTokens: number | undefined;
  /** The total byte budget of the evidence block. */
  readonly totalBudgetBytes: number;
}

/** The result: the rendered text and what was shown or left out. */
export interface PerTaskEvidence {
  /** The rendered evidence text. */
  readonly text: string;
  /** The paths whose content was rendered. */
  readonly shown: readonly string[];
  /** The paths named under `NOT-SHOWN` because the budget ran out. */
  readonly notShown: readonly string[];
}

/** The heading of the list of paths the budget left out (F117-FR-008). */
export const NOT_SHOWN_HEADING = "NOT-SHOWN";

/** The heading of the changes outside every task's files (F153-FR-052). */
export const OUTSIDE_TASKS_HEADING = "Changes outside every task";

/**
 * The per-file budget: the grounding budget of F117-FR-011 scaled linearly
 * to the window in force, never below the floor (`scaledCap`). An unknown
 * window keeps the unscaled reference budget.
 */
export function fileCapOf(windowTokens: number | undefined): number {
  return scaledCap(
    BUDGETS.groundingBudgetBytes,
    windowTokens ?? BUDGETS.referenceWindowTokens,
    MIN_SCALED_BUDGET_BYTES,
  );
}

/** The byte length of a text in UTF-8. */
function byteLength(text: string): number {
  return Buffer.byteLength(text, "utf8");
}

/**
 * The excerpt of one file: the whole text under the cap; otherwise the head,
 * a line that says how many bytes were left out, and the tail, with the head
 * and tail sizes of the grounding budget (F117-FR-011). When the cap is too
 * small for the grounding sizes, they shrink proportionally and keep a tail
 * only when it still fits beside the head.
 */
export function excerptOf(text: string, cap: number): string {
  if (byteLength(text) <= cap) return text;

  let headBytes = Math.min(GROUNDING_HEAD_BYTES, cap);
  const tailBytes = Math.min(GROUNDING_TAIL_BYTES, Math.max(0, cap - headBytes));
  if (headBytes + tailBytes > cap) {
    headBytes = Math.max(0, cap - tailBytes);
  }
  const raw = Buffer.from(text, "utf8");
  const head = raw.subarray(0, headBytes).toString("utf8");
  const tail = tailBytes > 0 ? raw.subarray(raw.length - tailBytes).toString("utf8") : "";
  const leftOut = raw.length - headBytes - tailBytes;
  const note = `[… ${leftOut} bytes left out …]`;
  return tail.length > 0 ? `${head}\n${note}\n${tail}` : `${head}\n${note}`;
}

/** One rendered path inside a task section. */
function renderPath(
  path: string,
  content: string | undefined,
  cap: number,
): { text: string; bytes: number } {
  if (content === undefined) {
    const line = `### ${path}\n\nMISSING\n`;
    return { text: line, bytes: byteLength(line) };
  }
  const excerpt = excerptOf(content, cap);
  const text = `### ${path}\n\n\`\`\`\n${excerpt}\n\`\`\`\n`;
  return { text, bytes: byteLength(text) };
}

/**
 * The per-task evidence: one section per task in the order given, each
 * holding its named files' excerpts (`MISSING` where the reader gives
 * `undefined`), then the changes outside every task's files, sorted, with
 * every path the budget leaves out named under `NOT-SHOWN`. A task that
 * names no file says so; the changes it may have made stay in the
 * outside-every-task set (F153-FR-052, edge case).
 */
export function perTaskEvidenceOf(input: PerTaskEvidenceInput): PerTaskEvidence {
  const cap = fileCapOf(input.windowTokens);
  const named = new Set<string>();
  for (const task of input.tasks) {
    for (const path of task.paths) named.add(path);
  }
  const outside = [...new Set(input.changedPaths)]
    .filter((path) => !named.has(path))
    .sort();

  /** The `NOT-SHOWN` section for a list of left-out paths (`""` when none). */
  const notShownSectionOf = (list: readonly string[]): string => {
    if (list.length === 0) return "";
    return [`## ${NOT_SHOWN_HEADING}`, "", ...[...list].sort().map((p) => `- ${p}`), ""].join(
      "\n",
    );
  };

  // The bound is on the rendered text, so the reserve the `NOT-SHOWN` list
  // needs is measured, not estimated: admitting a file moves it into the
  // list, the list grows, and the room left shrinks — hence the fixed
  // point. Greedy admission is not provably monotone (a bigger list can
  // push a big earlier file out, whose room lets a later one back in), so
  // the loop carries a hard cap of one round per path plus one; whatever
  // round it stops on, the state is safe by construction — every section
  // is admitted against a measured candidate, `shown` is committed only
  // inside a successful admission, and the final text is measured against
  // the whole budget.
  const pathCount = named.size + outside.length;
  let excluded: string[] = [];
  let sections: string[] = [];
  let shown: string[] = [];
  for (let round = 0; round <= pathCount + 1; round += 1) {
    // The reserve is the `NOT-SHOWN` list plus the `"\n"` that will join it
    // to the sections in the final `${text}\n${listed}` candidate: without
    // that one byte a section admitted up to `free` makes the final
    // candidate overshoot the budget by exactly 1, the list falls to the
    // count line (which can be longer than the list) and a left-out path is
    // named nowhere. At a settled round `excluded` is the final list, so
    // the reserve is exact.
    const reserve = byteLength(notShownSectionOf(excluded)) + (excluded.length > 0 ? 1 : 0);
    const free = input.totalBudgetBytes - reserve;
    sections = [];
    let used = 0; // byteLength(sections.join("\n")) — separators counted.
    shown = [];
    const nextExcluded: string[] = [];
    const seen = new Set<string>();

    /**
     * Admits one measured top-level section, with the separator before it
     * and the paths it shows committed only when it fits.
     */
    const admitSection = (piece: string, paths: readonly string[]): void => {
      const cost = (sections.length > 0 ? 1 : 0) + byteLength(piece);
      if (used + cost > free) {
        // Exact accounting above means this cannot happen; if it ever
        // does, the section's paths are left out by name, never shown
        // without their text (F153-SC-012).
        nextExcluded.push(...paths);
        return;
      }
      used += cost;
      sections.push(piece);
      shown.push(...paths);
    };

    /** Grows one section file by file against measured candidates. */
    const growSection = (
      heading: string,
      paths: readonly string[],
    ): { piece: string; admitted: string[] } => {
      let piece = heading;
      const admitted: string[] = [];
      for (const path of paths) {
        if (seen.has(path)) continue;
        seen.add(path);
        const rendered = renderPath(path, input.contentOf(path), cap);
        const candidate = `${piece}\n${rendered.text}`;
        const projected = used + (sections.length > 0 ? 1 : 0) + byteLength(candidate);
        if (projected > free) {
          nextExcluded.push(path);
          continue;
        }
        piece = candidate;
        admitted.push(path);
      }
      return { piece, admitted };
    };

    for (const task of input.tasks) {
      const heading = `## Task ${task.id}`;
      if (task.paths.length === 0) {
        admitSection(`${heading}\n\n_This task names no file._`, []);
        continue;
      }
      // The section is one piece: its heading plus the files admitted into
      // it, each addition measured with the `"\n"` the join adds. A heading
      // with no file under it is never emitted.
      const { piece, admitted } = growSection(heading, task.paths);
      if (admitted.length > 0) {
        admitSection(piece, admitted);
      } else {
        // One section per task (T184): a task whose files were all shown
        // under an earlier task still gets its own section, saying so —
        // never a silent absence. The names it repeats are already shown
        // above or named under `NOT-SHOWN`, so nothing is hidden.
        const note = `_Its files appear above or under NOT-SHOWN: ${[...task.paths].sort().join(", ")}._`;
        admitSection(`${heading}\n\n${note}`, []);
      }
    }

    if (outside.length > 0) {
      const heading = `## ${OUTSIDE_TASKS_HEADING}`;
      const { piece, admitted } = growSection(heading, outside);
      if (admitted.length > 0) admitSection(piece, admitted);
    }

    const settled =
      excluded.length === nextExcluded.length &&
      [...excluded].sort().join("\n") === [...nextExcluded].sort().join("\n");
    excluded = nextExcluded;
    if (settled) break;
  }

  // The final text is measured, never estimated: sections, the separators
  // between them and the `NOT-SHOWN` list all count against the budget.
  const notShown = [...excluded].sort();
  let text = sections.join("\n");
  if (notShown.length > 0) {
    // The variants in order of preference; the first that fits wins, and
    // the short count line keeps the names in the text wherever the budget
    // can hold one line — the empty text is the last resort, only when the
    // budget cannot even say how many paths it left out.
    const listed = notShownSectionOf(notShown);
    const n = notShown.length;
    const countLine = `## ${NOT_SHOWN_HEADING} (${n} path${n === 1 ? "" : "s"} left out)`;
    const candidates =
      text === ""
        ? [listed, countLine, ""]
        : [`${text}\n${listed}`, `${text}\n${countLine}`, text];
    text = candidates.find((c) => byteLength(c) <= input.totalBudgetBytes) ?? "";
  }
  if (byteLength(text) > input.totalBudgetBytes) {
    throw new Error(
      `per-task evidence is ${byteLength(text)} bytes over its ${input.totalBudgetBytes}-byte budget`,
    );
  }
  return { text, shown, notShown };
}

/** The head-tail threshold, re-exported for the tests of the phase. */
export { GROUNDING_HEAD_TAIL_THRESHOLD };
