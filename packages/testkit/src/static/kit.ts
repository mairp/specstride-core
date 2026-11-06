/**
 * The frame the static checks of feature 100 share (annex X, §X.10).
 *
 * Every check is a function from the corpus to a list of findings. A check
 * that returns no finding passes; the runner of T264 reports each check as
 * one test and names the file, the line and the value of every finding.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

/** The root of the repository: four levels up from `packages/testkit/src/static`. */
export const ROOT = resolve(
  dirname(dirname(dirname(dirname(fileURLToPath(import.meta.url))))),
  "..",
);

/** One finding of a static check. */
export type Finding = {
  /** The file the finding is in, relative to the root of the repository. */
  readonly file: string;
  /** The line, 1-indexed, where the check found it; 0 where it is file-wide. */
  readonly line: number;
  /** The value the check found, where it found one. */
  readonly value?: string | undefined;
  /** What is wrong, in one sentence, naming the requirement. */
  readonly message: string;
};

/** A static check of the test kit. */
export type StaticCheck = {
  /** The name the runner reports, as the table of quickstart.md scenario 3 names it. */
  readonly name: string;
  /** The requirements the check covers. */
  readonly covers: readonly string[];
  /** Run the check; an empty list is a pass. */
  run(options?: CheckOptions): readonly Finding[];
};

/** What a caller may point a check at; the defaults are this repository. */
export type CheckOptions = {
  /** The root of the repository. */
  readonly root?: string | undefined;
  /** The glob-free list of specification files, where a caller gives its own. */
  readonly specFiles?: readonly string[] | undefined;
  /**
   * T305 — the SUBJECT of the checks that read the specifications: the feature
   * folder names under `specs/` the run is about. `undefined` or an empty list
   * means every feature. The checks still read every folder of `specs/1*` as
   * REFERENCE, through `referenceSpecFiles` and its siblings, and the checks of
   * the `contracts` package are not scoped at all
   * (annex X §X.10; F100-FR-225, F100-FR-226 as amended on 2026-09-30).
   */
  readonly scope?: readonly string[] | undefined;
};

/* ------------------------------------------------------------------ *
 * T305 — the scope of the static review (owner ruling of 2026-09-30;
 * F100-FR-225, F100-FR-226 as amended).
 * ------------------------------------------------------------------ */

/** The environment variable the runner of T264 reads for the scope. */
export const STATIC_SCOPE_VARIABLE = "TESTKIT_STATIC_SCOPE" as const;

/**
 * The scope the environment names: feature folder names separated by commas.
 * Unset, empty or all-blank means every feature, which is the empty list.
 */
export function scopeFromEnvironment(
  env: Readonly<Record<string, string | undefined>> = process.env,
): readonly string[] {
  const raw = env[STATIC_SCOPE_VARIABLE];
  if (raw === undefined) return Object.freeze([]);
  return Object.freeze(
    raw
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name !== ""),
  );
}

/** A folder the scope names that `specs/` does not hold: the run fails. */
export class UnknownScopeError extends Error {
  readonly unknown: readonly string[];
  readonly known: readonly string[];
  constructor(unknown: readonly string[], known: readonly string[]) {
    super(
      `${STATIC_SCOPE_VARIABLE} names ${unknown.length === 1 ? "a folder" : "folders"} ` +
        `that \`specs/\` does not hold: ${unknown.join(", ")}. ` +
        `The folders of \`specs/\` are: ${known.join(", ")} ` +
        "(F100-FR-226 as amended on 2026-09-30)",
    );
    this.name = "UnknownScopeError";
    this.unknown = Object.freeze([...unknown]);
    this.known = Object.freeze([...known]);
  }
}

/** Every file under a directory, depth first, skipping `node_modules`. */
export function walk(directory: string, keep: (file: string) => boolean = () => true): string[] {
  const out: string[] = [];
  let entries;
  try {
    entries = readdirSync(directory, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".build") continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) out.push(...walk(path, keep));
    else if (entry.isFile() && keep(path)) out.push(path);
  }
  return out;
}

/** The directories of `specs` whose name starts with 1, in order. */
export function specDirectories(root: string = ROOT): string[] {
  const specs = join(root, "specs");
  let names: string[];
  try {
    names = readdirSync(specs);
  } catch {
    return [];
  }
  return names
    .filter((n) => /^1/.test(n))
    .map((n) => join(specs, n))
    .filter((p) => {
      try {
        return statSync(p).isDirectory();
      } catch {
        return false;
      }
    })
    .sort();
}

/**
 * T305 — every folder of `specs/1*`, whatever the scope. This is the
 * REFERENCE corpus: a check that needs the whole product reads it here, and a
 * scoped run does not narrow it.
 */
export function referenceSpecDirectories(root: string = ROOT): string[] {
  return specDirectories(root);
}

/**
 * T305 — the SUBJECT directories of a run: the folders the scope names, or
 * every folder of `specs/1*` where the scope is empty. A named folder that
 * `specs/` does not hold fails the run (F100-FR-226).
 */
export function scopedSpecDirectories(options: CheckOptions = {}): string[] {
  const root = options.root ?? ROOT;
  const every = specDirectories(root);
  const scope = options.scope ?? [];
  if (scope.length === 0) return every;
  const byName = new Map(every.map((d) => [basename(d), d]));
  const unknown = scope.filter((name) => !byName.has(name));
  if (unknown.length > 0) {
    throw new UnknownScopeError(unknown, [...byName.keys()]);
  }
  // In the order of `specs/`, not the order the scope was written in.
  return every.filter((d) => scope.includes(basename(d)));
}

/**
 * Every Markdown and JSON file of the SUBJECT of the run: the folders the
 * scope names, or every folder of `specs/1*` where the scope is empty
 * (F100-FR-225, F100-FR-226; T305).
 */
export function specFiles(options: CheckOptions = {}): string[] {
  if (options.specFiles !== undefined) return [...options.specFiles];
  return scopedSpecDirectories(options).flatMap((d) => walk(d, (f) => /\.(md|json|tsv)$/.test(f)));
}

/**
 * T305 — the same files over EVERY folder of `specs/1*`, whatever the scope.
 * A check that needs the whole product as reference reads them here.
 */
export function referenceSpecFiles(options: CheckOptions = {}): string[] {
  if (options.specFiles !== undefined) return [...options.specFiles];
  return referenceSpecDirectories(options.root ?? ROOT).flatMap((d) =>
    walk(d, (f) => /\.(md|json|tsv)$/.test(f)),
  );
}

/**
 * The specification files proper: `spec.md` and the annexes. The reports of
 * the authoring process (`analyze-report.md`, `repair-report.md`,
 * `followup-report.md`) and `research.md` record how the specification was
 * made; they are not the specification.
 */
export function specificationFiles(options: CheckOptions = {}): string[] {
  return specFiles(options).filter(
    (f) => /(^|\/)spec\.md$/.test(f) || f.includes(`${"/"}annexes${"/"}`),
  );
}

/**
 * T305 — the specification files proper over EVERY folder of `specs/1*`,
 * whatever the scope: the reference half of a check that compares the feature
 * it is about with the rest of the product.
 */
export function referenceSpecificationFiles(options: CheckOptions = {}): string[] {
  return referenceSpecFiles(options).filter(
    (f) => /(^|\/)spec\.md$/.test(f) || f.includes(`${"/"}annexes${"/"}`),
  );
}

/** The path of a file relative to the root of the repository. */
export function rel(file: string, root: string = ROOT): string {
  return relative(root, file);
}

/** The lines of a file; an unreadable file gives none. */
export function linesOf(file: string): string[] {
  try {
    return readFileSync(file, "utf8").split("\n");
  } catch {
    return [];
  }
}

/** The text of a file; an unreadable file gives the empty string. */
export function textOf(file: string): string {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

/** A JSON file of the repository. */
export function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

/** A data file of the `contracts` package. */
export function contractsData<T>(name: string, root: string = ROOT): T {
  return readJson<T>(join(root, "packages", "contracts", "data", name));
}

/** A schema file of the `contracts` package. */
export function contractsSchema<T>(name: string, root: string = ROOT): T {
  return readJson<T>(join(root, "packages", "contracts", "schemas", name));
}

/** Replace every code span of a line with blanks, so that prose is left. */
export function prose(line: string): string {
  return line.replace(/`[^`]*`/g, (m) => " ".repeat(m.length));
}

/** The shape of a requirement line: `- **F100-FR-022**: …`. */
export const REQUIREMENT_LINE = /^\s*-\s+\*\*(F\d{3}-FR-\d{3})\*\*:/;

/** The requirement id a line states, or `undefined`. */
export function requirementOf(line: string): string | undefined {
  return REQUIREMENT_LINE.exec(line)?.[1];
}

/** A requirement with the sub-bullets that belong to it (`test:`, `status:`). */
export type RequirementBlock = {
  readonly id: string;
  readonly file: string;
  readonly line: number;
  /** The requirement line itself. */
  readonly text: string;
  /** The requirement line and every indented sub-bullet under it. */
  readonly block: string;
};

/** Every requirement of a file, with its block. */
export function requirementBlocks(file: string, root: string = ROOT): RequirementBlock[] {
  const lines = linesOf(file);
  const out: RequirementBlock[] = [];
  for (let i = 0; i < lines.length; i++) {
    const id = requirementOf(lines[i] as string);
    if (id === undefined) continue;
    let block = lines[i] as string;
    for (let j = i + 1; j < lines.length; j++) {
      const next = lines[j] as string;
      if (!/^\s{2,}-\s/.test(next)) break;
      block += "\n" + next;
    }
    out.push({ id, file: rel(file, root), line: i + 1, text: lines[i] as string, block });
  }
  return out;
}

/** Build a finding. */
export function finding(file: string, line: number, message: string, value?: string): Finding {
  return Object.freeze({ file, line, value, message });
}
