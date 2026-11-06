/**
 * T055 — rules N-15 to N-20: the text (F141-FR-020).
 *
 * | Rule | Subject | What the rule does |
 * |---|---|---|
 * | N-15 | implementation names in text | "A prefix that names an implementation file maps to a logical component name through the component-name table; the message after the prefix must be equal" |
 * | N-16 | generated-by fields | "Fields that name the generating tool compare through the component-name table" |
 * | N-17 | body of the launcher | "Compared as a logical record (marker present, hash valid, reference to the launch bundle resolves, arguments passed through), not as text" |
 * | N-18 | messages of the old interpreters | "Usage text and error text of the old language compare by exit code and by the class of the first line only" |
 * | N-19 | literals of the old language | "Compared as written. No rule hides them" |
 * | N-20 | output labels | "The supervisor lines and the digest are compared as written, in compatibility output" |
 *
 * The component-name table is `componentNames` of feature 100 and is READ here,
 * never copied (F141-FR-020). N-19 and N-20 replace nothing — they are the rules
 * that say a value is compared AS WRITTEN — so they count the values they were
 * applied to, and N-19 carries the sentence that matters most in the whole set:
 * "No rule hides them." A literal of the old language that one side prints and the
 * other does not is a `different` and nothing may remove it (F141-FR-024).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { componentNames } from "@specstride/contracts/grammar/line-keys";
import { oldSideItems } from "@specstride/contracts/profile/layout-old-side";

import { ORACLE_ROOT } from "../index.ts";
import { collect, countStrings, replaceInSurfaces } from "./walk.ts";
import { takeOutNotCarried } from "./not-carried-entry.ts";
import {
  NormalizationError,
  type MutableCapture,
  type NormalizeContext,
  type Rule,
} from "./types.ts";

/**
 * Which file of each pinned baseline each row of the component-name table names.
 * The table of feature 100 names its as-is implementations in PROSE ("The
 * pass-loop script"), and N-15 replaces a PREFIX of a message, which is a file
 * name. The binding of the prose to a file is a record of the reference trees at
 * the pinned commits and no table of normalization: the as-is-to-logical mapping
 * stays feature 100's and is read from it below (F141-FR-020).
 */
export const COMPONENT_FILES_FILE = join(ORACLE_ROOT, "reference", "component-files.json");

/** One row of that record, as it lies in the file. */
export type ComponentFilesRowOnDisk = {
  readonly asIs: string;
  readonly system: string;
  readonly files?: readonly string[];
  /**
   * The behaviour items of `layout-old-side.json` whose as-is paths name the files
   * of this row. F100-FR-026 reserves five file names of the three as-is systems to
   * that ONE file; a row that names one of them gives the item instead, and the
   * name is read from there. The record therefore carries no copy of a name only
   * that file may carry.
   */
  readonly filesFromOldSide?: readonly string[];
  /** The directories of the reference tree those files lie in; `""` is the root. */
  readonly directories?: readonly string[];
};

/** One row of that record, with its files resolved. */
export type ComponentFilesRow = {
  readonly asIs: string;
  readonly system: string;
  readonly files: readonly string[];
};

/** The as-is script names of one behaviour item of `layout-old-side.json`. */
export function scriptsOfOldSideItem(item: string): readonly string[] {
  const row = oldSideItems.find((entry) => entry.item === item);
  if (row === undefined) {
    throw new NormalizationError(
      `${COMPONENT_FILES_FILE} names the behaviour item ${item}, which ` +
        `layout-old-side.json of feature 100 does not hold`,
    );
  }
  return Object.freeze([...(row.asIsPaths ?? [])].filter((path) => /\.(sh|py)$/.test(path)));
}

/** The record, read from `packages/oracle/reference/component-files.json`. */
export function componentFiles(): readonly ComponentFilesRow[] {
  const parsed = JSON.parse(readFileSync(COMPONENT_FILES_FILE, "utf8")) as {
    rows?: ComponentFilesRowOnDisk[];
  };
  return Object.freeze(
    (parsed.rows ?? []).map((row) => {
      const fromOldSide = (row.filesFromOldSide ?? []).flatMap((item) =>
        scriptsOfOldSideItem(item),
      );
      const directories = row.directories ?? [""];
      const joined = fromOldSide.flatMap((name) =>
        directories.map((dir) => (dir === "" ? name : `${dir}/${name}`)),
      );
      return Object.freeze({
        asIs: row.asIs,
        system: row.system,
        files: Object.freeze([...(row.files ?? []), ...joined]),
      });
    }),
  );
}

/** One row of the component-name table, resolved to the files it names. */
export type ComponentRow = { readonly asIs: string; readonly logical: string };

/**
 * The component-name table of feature 100, resolved to file names: one entry per
 * file of the baseline, with the logical component name of the row that names it.
 * The ROW ORDER and the NAMES are feature 100's; only the files come from the
 * record of the reference. A row of the table with no entry in that record fails
 * here, so the two can never drift apart silently.
 */
export function componentTable(): readonly ComponentRow[] {
  const bound = componentFiles();
  const rows: ComponentRow[] = [];
  for (const row of componentNames) {
    const entry = bound.find((b) => b.asIs === row.asIs);
    if (entry === undefined) {
      throw new NormalizationError(
        `the component-name table of feature 100 holds the row ${JSON.stringify(row.asIs)} and ` +
          `${COMPONENT_FILES_FILE} says no file of the reference it names, so N-15 could not ` +
          `replace its prefix (F141-FR-020)`,
      );
    }
    // A row that gives more than one logical name gives them in the order of its
    // files; the n-th file carries the n-th name, and a single name serves every
    // file of its row.
    entry.files.forEach((file, i) => {
      const logical = row.names.length === 1 ? row.names[0] : row.names[Math.floor(i / 2)];
      if (logical !== undefined) rows.push({ asIs: file, logical });
    });
  }
  // The longest file name first, so `lib/critic.py` is replaced before `critic.py`.
  return Object.freeze(rows.sort((a, b) => b.asIs.length - a.asIs.length));
}

/** The placeholder an as-is implementation file name becomes where it is a PATH. */
export const COMPONENT_PLACEHOLDER = (logical: string): string => `<component:${logical}>`;

/**
 * N-15: a prefix that names an implementation file becomes the logical component
 * name.
 *
 * Two forms, because an implementation file is named in two ways:
 *
 * 1. as the PREFIX of a message — `proposer.sh: evidence appeared after pass 1` —
 *    where the file name and the colon become the component name and the colon, and
 *    the message after it is left exactly as it is and must be equal;
 * 2. as a FILE of a captured tree or of the body of a generated file — the launch
 *    bundle of mixture-of-loops holds its pipeline runtime by its as-is name, and
 *    the launcher's body names it — where the name becomes
 *    `<component:pipeline-runtime>`. The port's bundle holds the port's own
 *    implementation under its own name, so comparing the two NAMES compares two
 *    implementations and nothing else; the component name is what makes the two
 *    sides comparable, which is the whole subject of this rule.
 *
 * The second form acts on a name that carries an extension (`.sh`, `.py`) only. The
 * front-door script of the Specstride baseline is called `specstride` with no
 * extension, and that word is a path component of the state layout of BOTH sides;
 * replacing it as a file name would rewrite half of every capture.
 */
export const N15: Rule = {
  id: "N-15",
  subject: "Implementation names in text",
  surfaces: [
    "stdout",
    "stderr",
    "transcript",
    "events",
    "tree",
    "state",
    "pipeline",
    "launcher",
    "home",
  ],
  apply(capture: MutableCapture, context: NormalizeContext): number {
    const table = componentTable();
    const asAFile = table.filter((row) => /\.(sh|py)$/.test(row.asIs));
    // The registry entry that the port does not carry is handled by THIS rule
    // (CQ-029: "N-15 applies: the entry is taken out of the reference side before
    // storage and comparison"), so its removals are counted as N-15's own and no
    // rule of its own is added to the twenty-nine (F141-FR-020).
    const notCarried = takeOutNotCarried(capture, context);
    return (
      notCarried +
      replaceInSurfaces(capture.surfaces, this.surfaces, (value) => {
        let text = value;
        for (const row of table) {
          text = text.split(`${row.asIs}:`).join(`${row.logical}:`);
        }
        for (const row of asAFile) {
          // The name of a FILE: at the start of a value or after a path separator or a
          // quote, and not followed by a word character.
          text = text.replace(
            new RegExp(
              `(^|[/"'\\s=:(])${row.asIs.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w.])`,
              "g",
            ),
            (_whole, before: string) => `${before}${COMPONENT_PLACEHOLDER(row.logical)}`,
          );
        }
        return text;
      })
    );
  },
};

/** The fields that name the generating tool (N-16). */
export const GENERATED_BY_FIELDS: readonly string[] = Object.freeze([
  "generated_by",
  "generatedBy",
  "generator",
  "tool",
  "written_by",
  "writtenBy",
]);

/**
 * Whether the value of a generating-tool field names one component of the table.
 *
 * Three forms reach this rule, and all three are the SAME component:
 *
 * 1. the as-is implementation file, as the baseline writes it — `bootstrap_contract.py`,
 *    on its own or behind the name of the system (`mixture-of-loops/bootstrap_contract.py`);
 * 2. the same value after N-15 has already replaced the FILE NAME in the text of a
 *    captured file, `mixture-of-loops/<component:contract-derive>` — N-15 runs first,
 *    so this is the form the rule actually meets on the reference side of a draft;
 * 3. the LOGICAL component name itself, which is what the product writes: F107-FR-005
 *    obliges `generated_by.tool` of a launch contract to name the component
 *    `contract-derive` and "never an implementation file".
 *
 * Register row DV-066 names N-15 and N-16 together as the handling of "records name
 * implementation files: … `generated_by.tool`", and the two settle it this way: N-15
 * replaces a NAME inside a text, N-16 decides the WHOLE value of a field that names
 * the generating tool. Without the third form a conformant port and the baseline read
 * `different` on that field for no divergence of behaviour — the one thing the rule
 * exists to prevent.
 */
export function componentOfGeneratingTool(
  value: string,
  table: readonly ComponentRow[] = componentTable(),
): string | undefined {
  const asAFile = table.find((row) => value.includes(row.asIs));
  if (asAFile !== undefined) return asAFile.logical;
  const alreadyReplaced = table.find((row) => value.includes(COMPONENT_PLACEHOLDER(row.logical)));
  if (alreadyReplaced !== undefined) return alreadyReplaced.logical;
  const byLogicalName = table.find(
    (row) => value === row.logical || value.endsWith(`/${row.logical}`),
  );
  return byLogicalName?.logical;
}

/** Every form of a generating-tool field in the text of a captured file. */
function generatingToolInText(text: string, table: readonly ComponentRow[]): [string, number] {
  let changed = 0;
  let out = text;
  for (const field of GENERATED_BY_FIELDS) {
    // `"tool": "<value>"` and `tool: <value>`, the two ways a capture carries it.
    for (const pattern of [
      new RegExp(`"${field}"\\s*:\\s*"([^"\\n]*)"`, "g"),
      new RegExp(`\\b${field}:[ \\t]*([^\\n,"]+)`, "g"),
    ]) {
      out = out.replace(pattern, (whole: string, value: string) => {
        const logical = componentOfGeneratingTool(value, table);
        if (logical === undefined || value === logical) return whole;
        changed += 1;
        return whole.split(value).join(logical);
      });
    }
  }
  return [out, changed];
}

/** N-16: fields that name the generating tool compare through the component-name table. */
export const N16: Rule = {
  id: "N-16",
  subject: "Generated-by fields",
  surfaces: [],
  apply(capture: MutableCapture): number {
    const table = componentTable();
    let changed = 0;
    const walk = (node: unknown): unknown => {
      if (Array.isArray(node)) return node.map(walk);
      if (node !== null && typeof node === "object") {
        const out: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
          if (GENERATED_BY_FIELDS.includes(key) && typeof value === "string") {
            const logical = componentOfGeneratingTool(value, table);
            if (logical !== undefined) {
              out[key] = logical;
              if (logical !== value) changed += 1;
              continue;
            }
          }
          out[key] = walk(value);
        }
        return out;
      }
      return node;
    };
    for (const name of Object.keys(capture.surfaces)) {
      capture.surfaces[name] = walk(capture.surfaces[name]);
    }
    // The same fields appear inside the TEXT of a captured file — a file of state as
    // one line, and a launch contract written with `--output` as a member of its JSON.
    changed += replaceInSurfaces(capture.surfaces, [], (value) => {
      if (!GENERATED_BY_FIELDS.some((field) => value.includes(field))) return value;
      return generatingToolInText(value, table)[0];
    });
    return changed;
  },
};

/**
 * N-17: the body of the launcher is compared as a logical record and not as text.
 * The capture already holds the four facts of the record
 * (`src/capture/launcher.ts`); this rule drops what is left of the body, so that no
 * later comparison can fall back on the text.
 */
export const N17: Rule = {
  id: "N-17",
  subject: "Body of the launcher",
  surfaces: ["launcher"],
  apply(capture: MutableCapture): number {
    const launcher = capture.surfaces["launcher"] as
      | (Record<string, unknown> & { launcher?: Record<string, unknown>; bundle?: unknown })
      | undefined;
    if (launcher?.launcher === undefined) return 0;
    const record = launcher.launcher;
    const facts = {
      name: record["name"],
      exists: record["exists"],
      markerPresent: record["markerPresent"],
      hashValid: record["hashValid"],
      bundleResolves: record["bundleResolves"],
      argumentsPassedThrough: record["argumentsPassedThrough"],
      comparedAs: "a logical record, not as text",
    };
    // The RECORD is rebuilt from the four facts, so the body cannot be compared as
    // text. Every other field of the SURFACE is carried over unchanged: a rule
    // replaces what it names and never drops a field it does not touch.
    capture.surfaces["launcher"] = { ...launcher, launcher: facts, bundle: launcher.bundle };
    return 1;
  },
};

/** The classes of a first line of a message of an old interpreter (N-18). */
export const OLD_INTERPRETER_LINE_CLASSES: readonly {
  readonly class: string;
  readonly pattern: RegExp;
}[] = Object.freeze([
  { class: "usage", pattern: /^usage:/i },
  { class: "traceback", pattern: /^Traceback \(most recent call last\)/ },
  { class: "syntax-error", pattern: /SyntaxError/ },
  { class: "name-error", pattern: /NameError|NameError:/ },
  { class: "shell-not-found", pattern: /command not found|: not found$/ },
  { class: "shell-unbound", pattern: /unbound variable/ },
  { class: "shell-syntax", pattern: /syntax error near unexpected token/ },
  { class: "module-not-found", pattern: /ModuleNotFoundError|No module named/ },
]);

/** The class of one first line, or `undefined` where it is no message of an old interpreter. */
export function lineClassOf(line: string): string | undefined {
  return OLD_INTERPRETER_LINE_CLASSES.find((c) => c.pattern.test(line))?.class;
}

/**
 * N-18: usage text and error text of the old language compare by exit code and by
 * the class of the first line only. The text after the first line is dropped: the
 * port writes its own messages and comparing them would compare the wording of two
 * languages.
 */
export const N18: Rule = {
  id: "N-18",
  subject: "Messages of the old interpreters",
  surfaces: ["stdout", "stderr"],
  apply(capture: MutableCapture): number {
    let changed = 0;
    for (const name of ["stdout", "stderr"]) {
      const stream = capture.surfaces[name] as
        { text?: string; perCommand?: string[]; bytes?: unknown } | undefined;
      if (stream?.text === undefined) continue;
      const lines = stream.text.split("\n");
      const out: string[] = [];
      let i = 0;
      while (i < lines.length) {
        const line = lines[i] as string;
        const lineClass = lineClassOf(line);
        if (lineClass === undefined) {
          out.push(line);
          i += 1;
          continue;
        }
        // The class of the first line, and nothing after it until a line that is
        // no continuation of the message.
        out.push(`<old-interpreter-message class=${lineClass}>`);
        changed += 1;
        i += 1;
        while (i < lines.length && /^(\s|at |\s*File ")/.test(lines[i] as string)) i += 1;
      }
      capture.surfaces[name] = {
        ...stream,
        bytes: undefined,
        text: out.join("\n"),
        perCommand: undefined,
      };
    }
    return changed;
  },
};

/** The literals of the old language that N-19 compares as written. */
export const OLD_LANGUAGE_LITERALS: readonly string[] = Object.freeze([
  "APPROVED",
  "REJECTED",
  "MALFORMED",
  "HALT",
  "DONE",
  "VERDICT",
  "run_stop",
  "stop_reason",
]);

/**
 * N-19: the literals of the old language are compared as written. No rule hides
 * them. The rule replaces nothing; it counts the values it was applied to, and it
 * is the rule that makes F141-FR-024 provable — a literal that only one side
 * prints survives every other rule and reaches the comparator.
 */
export const N19: Rule = {
  id: "N-19",
  subject: "Literals of the old language",
  surfaces: [],
  apply(capture: MutableCapture): number {
    return countStrings(capture.surfaces, (value) =>
      OLD_LANGUAGE_LITERALS.some((literal) => value.includes(literal)),
    );
  },
};

/** The labels of the supervisor and the digest that N-20 compares as written. */
export const OUTPUT_LABELS: readonly string[] = Object.freeze([
  "PHASE",
  "APPROVED",
  "DONE",
  "proposer:",
  "critic:",
  "supervisor:",
  "digest:",
  "stage:",
]);

/**
 * N-20: the supervisor lines and the digest are compared as written, in
 * compatibility output. The rule replaces nothing and counts the lines it was
 * applied to; the first suite drives the port in compatibility output
 * (F141-FR-024), which is what makes the two sides' labels comparable at all.
 */
export const N20: Rule = {
  id: "N-20",
  subject: "Output labels",
  surfaces: ["stdout", "stderr", "pipeline"],
  apply(capture: MutableCapture): number {
    let count = 0;
    for (const name of this.surfaces) {
      const surface = capture.surfaces[name];
      if (surface === undefined) continue;
      count += countStrings(surface, (value) =>
        OUTPUT_LABELS.some((label) => value.includes(label)),
      );
    }
    return count;
  },
};

/** Every label and literal the two rules above compare as written, for the report. */
export function comparedAsWritten(): readonly string[] {
  return Object.freeze([...OLD_LANGUAGE_LITERALS, ...OUTPUT_LABELS]);
}

/** The first lines of a capture, for the report of N-18. */
export function firstLinesOf(value: unknown): readonly string[] {
  return Object.freeze(
    collect(value, (node) => (typeof node === "string" ? node.split("\n")[0] : undefined)),
  );
}
