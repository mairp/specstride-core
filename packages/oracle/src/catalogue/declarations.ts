/**
 * T023 — the declaration check of parity tests and characterization tests
 * (F141-FR-027, F141-FR-028).
 *
 * §O.6 gives every test of the product a name and, for a parity test, three
 * declared fields: `proves:`, `fixture:` and `surfaces:`. This module is the
 * check of those names and fields. It has two faces:
 *
 * - **the refusal**, `assertDeclarationMayRun`, which is what F141-FR-027 asks
 *   for: the oracle refuses to RUN a parity test whose declaration names a
 *   family outside the catalogue, a retired family, a scenario the catalogue
 *   does not hold, or a surface outside §O.4 or outside the surfaces of the
 *   family;
 * - **the sweep**, `checkDeclarations`, which reads the `tasks.md` of every
 *   feature and the tests under `tests/parity/`, finds every declaration in
 *   them and runs the same rules over each one.
 *
 * The sweep separates what the oracle OWNS from what another feature owns. A
 * declaration under `tests/parity/141/`, under `packages/oracle/fixtures/` or in
 * `specs/141-parity-oracle/tasks.md` is the oracle's own, and a finding there is
 * a `refusal`: `checkDeclarations` ends with a non-zero code. A declaration in
 * another feature's `tasks.md` or test is that feature's own, and a finding
 * there is `external`: it is reported with its file, its line and the rule it
 * breaks, and the feature that owns it repairs it — the oracle never edits
 * another feature's specification. `--strict` makes an external finding end the
 * check as well, which is what the release check uses once the specifications
 * are repaired.
 *
 * F141-FR-028 is the other half: for pi, for a harness without a tested harness
 * adapter and for kept Lisa behaviour there is NO parity test. A declaration
 * that claims to be one is refused, and `offeredInstead` names what §O.7 gives
 * in its place.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

import {
  CatalogueError,
  OWNING_FEATURE,
  activeFamilyIds,
  familyStatus,
  resolveCitation,
  surfacesOf,
} from "./catalogue.ts";
import { knownSurfaceNames, oracleData } from "./data.ts";
import { LISA, SYSTEMS_WITHOUT_A_PIN } from "../reference/pins.ts";

/** Raised when a declaration may not run (F141-FR-027, F141-FR-028). */
export class DeclarationError extends Error {
  /** The test or the task the error is about. */
  readonly subject: string;
  constructor(subject: string, message: string) {
    super(`${subject}: ${message}`);
    this.name = "DeclarationError";
    this.subject = subject;
  }
}

// ---------------------------------------------------------------------------
// §O.6 — the names
// ---------------------------------------------------------------------------

/**
 * The name of a parity test of an as-is requirement or success criterion, or of
 * a cluster of behaviour items: `PT-<feature>-<origin>-<slug>`, the origin
 * without spaces and hyphens (`PT-104-028FR001-detection-order`,
 * `PT-130-C-040-request-schema`).
 */
export const PARITY_TEST_NAME =
  /^PT-([0-9]{3})-((?:028|011|002)(?:FR|SC)[0-9]{3}|C-[0-9]{3})-([a-z0-9][a-z0-9-]*)$/;

/** The name of a characterization test: `CT-<feature>-<n>` (`CT-134-3`). */
export const CHARACTERIZATION_TEST_NAME = /^CT-([0-9]{3})-([0-9]+)$/;

/** What a name of §O.6 is. */
export type TestKind = "parity" | "characterization";

/** The kind of test a name is, or `undefined` for a name that is neither. */
export function kindOfName(name: string): TestKind | undefined {
  if (PARITY_TEST_NAME.test(name)) return "parity";
  if (CHARACTERIZATION_TEST_NAME.test(name)) return "characterization";
  return undefined;
}

/** The three-digit number of the feature that owns a test, from its name. */
export function featureOfName(name: string): string | undefined {
  const parity = PARITY_TEST_NAME.exec(name);
  if (parity !== null) return parity[1];
  const characterization = CHARACTERIZATION_TEST_NAME.exec(name);
  if (characterization !== null) return characterization[1];
  return undefined;
}

/**
 * §O.6 — a name that is meant to be a test name of this product but is neither
 * a parity nor a characterization name. `PT-` and `CT-` are the two prefixes;
 * anything that starts with one of them and does not match is a bad name.
 */
export function nameIsMalformed(name: string): boolean {
  return /^(PT|CT)-/.test(name) && kindOfName(name) === undefined;
}

/** The shape of a full id of `proves:`: `028 FR-005`, `011 SC-003`, `C-101`, `B-0042`. */
export const PROVES_ID = /^((?:028|011|002) (?:FR|SC)-[0-9]{3}|C-[0-9]{3}|B-[0-9]{4})$/;

// ---------------------------------------------------------------------------
// A declaration
// ---------------------------------------------------------------------------

/** A declaration of §O.6, as it was read from a `tasks.md` or from a test. */
export type Declaration = {
  readonly name: string;
  readonly kind: TestKind;
  /** The file it was read from, relative to the root of the repository. */
  readonly file: string;
  /** The line of the file the declaration starts on, one-based. */
  readonly line: number;
  /** `proves:` as written, or `undefined` where the declaration has none. */
  readonly proves?: string;
  /** `fixture:` as written, or `undefined` where the declaration has none. */
  readonly fixture?: string;
  /** `surfaces:` as written, or `undefined` where the declaration has none. */
  readonly surfaces?: string;
  /** True for a declaration in a `tasks.md`, where `surfaces:` may be left out. */
  readonly inATask: boolean;
};

/** One thing a declaration gets wrong. */
export type Finding = {
  readonly file: string;
  readonly line: number;
  readonly test: string;
  /** The rule of §O.6 or of a requirement that the declaration breaks. */
  readonly rule: string;
  readonly message: string;
  /**
   * `refusal` for a declaration the oracle owns, which ends the check with a
   * non-zero code; `external` for a declaration another feature owns, which is
   * reported for that feature to repair.
   */
  readonly severity: "refusal" | "external";
};

// ---------------------------------------------------------------------------
// The rules of §O.6, over one declaration
// ---------------------------------------------------------------------------

/** Every `FX-nn`, `FX-nn/<scenario>` and `FX-nn/<scenario>@<variant>` of a `fixture:` field. */
export function citationsOf(field: string): readonly string[] {
  return [
    ...field.matchAll(/FX-[0-9]{2}(?:\/[a-z0-9][a-z0-9<>-]*)?(?:@engine-stub|@full-stack)?/g),
  ].map((m) => m[0]);
}

/** Every surface name of a `surfaces:` field, in the order it is written. */
export function surfaceNamesOf(field: string): readonly string[] {
  return field
    .split(/[,;]/)
    .map((part) => part.trim().replace(/^`|`$/g, "").trim())
    .filter((part) => part !== "" && /^[a-z][a-z-]*(\.[a-z]+)?$/.test(part));
}

/** Every full id of a `proves:` field, in the order it is written. */
export function provesIdsOf(field: string): readonly string[] {
  return field
    .split(";")
    .map((part) => part.trim().replace(/^`|`$/g, "").trim())
    .filter((part) => part !== "");
}

/**
 * F141-FR-027 — the rules of §O.6 over one declaration. Gives the list of what
 * it gets wrong; an empty list means the declaration holds up.
 *
 * A declaration in a `tasks.md` may leave `surfaces:` out: the test then
 * compares every surface of the family (§O.6). In a test it may not.
 */
export function violationsOfDeclaration(declaration: Declaration): readonly {
  rule: string;
  message: string;
}[] {
  const violations: { rule: string; message: string }[] = [];
  const add = (rule: string, message: string): void => void violations.push({ rule, message });

  if (nameIsMalformed(declaration.name)) {
    add("§O.6 name", `\`${declaration.name}\` is no name of §O.6`);
  }

  if (declaration.kind === "characterization") {
    // A characterization test declares `proves:`. It declares no `fixture:`
    // unless it uses the stubs of the oracle, and it is never counted as a
    // parity test — so there is nothing more to check here.
    if (declaration.proves === undefined || provesIdsOf(declaration.proves).length === 0) {
      add("§O.6 proves", "a characterization test declares `proves:`");
    }
    return violations;
  }

  // A parity test declares all three. A test without all three is not a parity
  // test (rule 2 of §O.1).
  if (declaration.proves === undefined || provesIdsOf(declaration.proves).length === 0) {
    add("§O.1 rule 2", "a parity test declares `proves:`");
  }
  if (declaration.fixture === undefined) {
    add("§O.1 rule 2", "a parity test declares `fixture:`");
  }
  if (!declaration.inATask && declaration.surfaces === undefined) {
    add(
      "§O.6 surfaces",
      "`surfaces:` is required in the test; a test that cites no surface is refused",
    );
  }

  const citations = citationsOf(declaration.fixture ?? "");
  const cited: string[] = [];
  for (const citation of citations) {
    try {
      const resolved = resolveCitation(citation);
      cited.push(resolved.familyId);
    } catch (error) {
      add(
        error instanceof CatalogueError && /is retired/.test(error.message)
          ? "F141-FR-027 retired family"
          : "F141-FR-027 citation",
        (error as Error).message,
      );
    }
  }

  const known = new Set(knownSurfaceNames());
  for (const surface of surfaceNamesOf(declaration.surfaces ?? "")) {
    if (!known.has(surface)) {
      add("F141-FR-027 surface", `\`${surface}\` is no surface of §O.4`);
      continue;
    }
    // A declaration may cite several families with one surface list. The
    // surface must belong to a family the declaration cites.
    const active = cited.filter((id) => familyStatus(id) === "active");
    if (active.length > 0 && !active.some((id) => surfacesOf(id).includes(surface))) {
      add(
        "F141-FR-027 surface",
        `the surface \`${surface}\` is outside the surfaces of ${active.join(", ")}`,
      );
    }
  }

  return violations;
}

/**
 * F141-FR-027 — the refusal. The oracle refuses to run a parity test whose
 * declaration does not hold up. Throws `DeclarationError` with every rule the
 * declaration breaks.
 */
export function assertDeclarationMayRun(declaration: Declaration): void {
  const violations = violationsOfDeclaration(declaration);
  if (violations.length === 0) return;
  throw new DeclarationError(
    declaration.name,
    violations.map((v) => `${v.rule}: ${v.message}`).join("; "),
  );
}

// ---------------------------------------------------------------------------
// F141-FR-028 — behaviour with no reference (§O.7)
// ---------------------------------------------------------------------------

/**
 * The harnesses that have as-is behaviour at a baseline and a Wave 1 harness
 * adapter under test: a parity test of one of them is possible. Read from
 * `data/stub-vocabulary.json`: a harness stub whose `sides` is `both` runs on
 * the reference as well as on the port. The generic stub is not a harness.
 */
export function harnessesWithATestedAdapter(): readonly string[] {
  return oracleData.stubVocabulary.harnessStubs
    .filter((h) => String(h["sides"]) === "both" && String(h["harness"]) !== "generic")
    .map((h) => String(h["harness"]));
}

/**
 * The harnesses the oracle has a stub for that run on the PORT side only: they
 * have no as-is behaviour and no reference, so no fixture family names them and
 * they have no parity test (§O.7). `pi` is the one of Wave 1.
 */
export function harnessesWithNoReference(): readonly string[] {
  return oracleData.stubVocabulary.harnessStubs
    .filter((h) => /^port only/.test(String(h["sides"])))
    .map((h) => String(h["harness"]));
}

/** The systems that have no pinned reference tree and therefore no reference run. */
export const SYSTEMS_WITH_NO_REFERENCE: readonly string[] = SYSTEMS_WITHOUT_A_PIN;

/** What §O.7 offers in place of a parity test. */
export type OfferedInstead = {
  readonly subject: string;
  readonly parityTest: false;
  readonly why: string;
  /** The stubs of §O.3 the subject is proved with instead. */
  readonly stubs: readonly string[];
  /** The scenarios of the catalogue that prove the registry half, where there is one. */
  readonly scenarios: readonly string[];
  /** The kind of test that proves the behaviour instead. */
  readonly instead: readonly string[];
};

/** The generic descriptor-driven stub of §O.3, by the one name it carries. */
export function genericStubName(): string {
  const generic = oracleData.stubVocabulary.harnessStubs.find(
    (h) => String(h["harness"]) === "generic",
  );
  return String((generic?.["executables"] as string[] | undefined)?.[0] ?? "stub-harness");
}

/** The pi stub of §O.3, by the one name it carries. */
export function piStubName(): string {
  const pi = oracleData.stubVocabulary.harnessStubs.find((h) => String(h["harness"]) === "pi");
  return String((pi?.["executables"] as string[] | undefined)?.[0] ?? "pi");
}

/**
 * The two scenarios of the catalogue that §O.7 names: they prove that the
 * reference and the port treat a harness that is only DECLARED in the same way,
 * which is a parity test of the registry and not of the harness.
 */
export const REGISTRY_SCENARIOS = ["FX-01/harness-generic", "FX-26/generic-text"] as const;

/**
 * F141-FR-028 — what the oracle offers for a subject that has no reference, or
 * `undefined` for a subject that does have one.
 *
 * The subject is a harness name, the name of a system without a pin, or a
 * string that names one of them.
 */
export function noReferenceSubject(subject: string): OfferedInstead | undefined {
  const needle = subject.trim().toLowerCase();
  const word = (name: string): boolean =>
    new RegExp(`(^|[^a-z0-9])${name.toLowerCase()}([^a-z0-9]|$)`).test(needle);

  for (const harness of harnessesWithNoReference()) {
    if (word(harness)) {
      return {
        subject: harness,
        parityTest: false,
        why: `${harness} has no as-is behaviour and no reference, so no fixture family names its stub (§O.7)`,
        stubs: [piStubName(), genericStubName()],
        scenarios: [...REGISTRY_SCENARIOS],
        instead: [
          `characterization tests CT-134-<n> of feature 134`,
          `the conformance suite of the harness port (EP-02) with the ${piStubName()} stub and recorded streams that feature 134 owns`,
        ],
      };
    }
  }

  for (const system of SYSTEMS_WITH_NO_REFERENCE) {
    if (word(system)) {
      return {
        subject: system,
        parityTest: false,
        why: `${system} has no reference run in the oracle: it has no pin (§O.7, F141-FR-001)`,
        stubs: [genericStubName()],
        scenarios: [],
        instead: ["a characterization test in the feature that keeps the behaviour"],
      };
    }
  }

  // A harness the product has no tested harness adapter for. The subject names
  // a harness, and the harness is not one of those with as-is behaviour.
  const named = /harness\s+([a-z0-9][a-z0-9-]*)/.exec(needle)?.[1];
  if (named !== undefined && !harnessesWithATestedAdapter().includes(named)) {
    return {
      subject: named,
      parityTest: false,
      why: `the reference has no behaviour for the harness ${named}: the product has no tested harness adapter for it (§O.7)`,
      stubs: [genericStubName()],
      scenarios: [...REGISTRY_SCENARIOS],
      instead: [
        `the conformance suite of the harness port (EP-02), run with the ${genericStubName()} stub and a harness descriptor of the fixture`,
      ],
    };
  }

  return undefined;
}

/**
 * F141-FR-028 — a test that declares itself a parity test of a behaviour with no
 * reference is refused. The subject is the text of the test's own declaration:
 * its name, its `proves:` and whatever the caller knows about what it drives.
 */
export function assertNotAParityTestOfABehaviourWithNoReference(
  name: string,
  subject: string,
): void {
  const offered = noReferenceSubject(subject);
  if (offered === undefined) return;
  throw new DeclarationError(
    name,
    `declares itself a parity test of ${offered.subject}, and there is none: ${offered.why}. ` +
      `Offered instead: ${offered.instead.join("; ")}; the stubs ${offered.stubs.join(", ")}` +
      (offered.scenarios.length > 0 ? `; the scenarios ${offered.scenarios.join(", ")}` : ""),
  );
}

/** The whole of §O.7 as data, for the page of `CITING.md` and for a reader. */
export function behaviourWithNoReference(): readonly OfferedInstead[] {
  const rows: OfferedInstead[] = [];
  const generic = noReferenceSubject("harness only-declared");
  if (generic !== undefined) rows.push(generic);
  for (const harness of harnessesWithNoReference()) {
    const row = noReferenceSubject(harness);
    if (row !== undefined) rows.push(row);
  }
  const lisa = noReferenceSubject(LISA);
  if (lisa !== undefined) rows.push(lisa);
  return rows;
}

// ---------------------------------------------------------------------------
// The sweep: `tasks.md` of every feature, and the tests under tests/parity/
// ---------------------------------------------------------------------------

/** Where the sweep reads from. */
export type SweepPaths = {
  /** The root of the repository. */
  readonly root: string;
  /** The specification tree, relative to the root. It is a local tree and may be absent. */
  readonly specs: string;
  /** The parity tests of the product, relative to the root. */
  readonly parityTests: string;
};

/** The default places: `specs/` and `tests/parity/`. */
export const SWEEP: Omit<SweepPaths, "root"> = Object.freeze({
  specs: "specs",
  parityTests: join("tests", "parity"),
});

/** The paths the oracle itself owns; a finding in one of them is a refusal. */
export const OWNED_PATHS: readonly string[] = Object.freeze([
  join("specs", `${OWNING_FEATURE}-parity-oracle`),
  join("tests", "parity", OWNING_FEATURE),
  join("packages", "oracle"),
]);

/** True when a file of the sweep belongs to this feature. */
export function isOwnedByTheOracle(file: string): boolean {
  const normalized = file.split(sep).join("/");
  return OWNED_PATHS.some((owned) => normalized.startsWith(owned.split(sep).join("/")));
}

/** The result of the sweep. */
export type Report = {
  readonly declarations: readonly Declaration[];
  readonly findings: readonly Finding[];
  /** The files the sweep read. */
  readonly filesRead: readonly string[];
  /** What the sweep could not read, with the reason: never a silent pass. */
  readonly skipped: readonly { readonly path: string; readonly reason: string }[];
};

/**
 * A task of a `tasks.md` and the declaration under it. The task line is
 * `- [ ] T016 … Parity test PT-104-028FR001-detection-order in …`; the keys
 * stand under it, one per line, as `  - proves: …`.
 */
const TASK_LINE = /^-\s*\[[ xX]\]\s*(T[0-9]+)\b(.*)$/;
const KEY_LINE = /^\s*-\s*(proves|fixture|surfaces|requirement|covers|reads):\s*(.*)$/;

/** Every name of §O.6 a line names. */
export function namesOfLine(line: string): readonly string[] {
  return [...line.matchAll(/\b(?:PT|CT)-[0-9]{3}-[A-Za-z0-9-]+/g)].map((m) => m[0]);
}

/**
 * Read the declarations of one `tasks.md`.
 *
 * A task declares a test when it names a test of §O.6 AND carries at least one
 * of the three keys. The keys are what a declaration IS (§O.6): a task that
 * names a test in its prose and carries none of them is a cross-reference to a
 * test another task declares — `specs/100-specstride/tasks.md` T225 names
 * CT-141-126 as a release condition, and `specs/103-proposer-pass/tasks.md` T005
 * names PT-124-C-057-usage-list as the test its scenario gives an entry point to
 * — and reading those as declarations would report the feature that mentions a
 * test rather than the one that writes it.
 */
export function declarationsOfTasksFile(text: string, file: string): readonly Declaration[] {
  const declarations: Declaration[] = [];
  const lines = text.split("\n");
  let task: { line: number; names: string[]; keys: Record<string, string> } | undefined;

  const flush = (): void => {
    if (task === undefined) return;
    const declares =
      task.keys["proves"] !== undefined ||
      task.keys["fixture"] !== undefined ||
      task.keys["surfaces"] !== undefined;
    if (!declares) {
      task = undefined;
      return;
    }
    for (const name of task.names) {
      const kind = kindOfName(name);
      if (kind === undefined) continue;
      const entry: Declaration = {
        name,
        kind,
        file,
        line: task.line,
        inATask: true,
        ...(task.keys["proves"] === undefined ? {} : { proves: task.keys["proves"] }),
        ...(task.keys["fixture"] === undefined ? {} : { fixture: task.keys["fixture"] }),
        ...(task.keys["surfaces"] === undefined ? {} : { surfaces: task.keys["surfaces"] }),
      };
      declarations.push(entry);
    }
    task = undefined;
  };

  for (const [index, line] of lines.entries()) {
    const taskMatch = TASK_LINE.exec(line);
    if (taskMatch !== null) {
      flush();
      const names = namesOfLine(taskMatch[2] ?? "");
      task = { line: index + 1, names: [...names], keys: {} };
      continue;
    }
    if (task === undefined) continue;
    const keyMatch = KEY_LINE.exec(line);
    if (keyMatch !== null) {
      const [, key, value] = keyMatch as unknown as [string, string, string];
      if (task.keys[key] === undefined) task.keys[key] = value.trim();
      continue;
    }
    // A blank line or a new heading ends the task's block.
    if (/^\s*$/.test(line) || /^#/.test(line)) flush();
  }
  flush();
  return declarations;
}

/**
 * Read the declarations of one test file.
 *
 * A test of the product carries its name and its declaration in the HEADER
 * comment of the file — the first `/** … *\/` block — in the same three keys
 * (`proves:`, `fixture:`, `surfaces:`). Only the header is read for names: a
 * name further down the file is a reference to another test, as in a table of
 * the cases a suite covers, and is not this file's declaration. The keys are
 * read from the whole file, because a test may write them beside the case they
 * belong to.
 *
 * Unlike a task, a file under `tests/parity/` IS the parity test, so a missing
 * key here is a finding and not a cross-reference: §O.6 requires the three keys
 * in the test itself.
 */
export function declarationsOfTestFile(text: string, file: string): readonly Declaration[] {
  const declarations: Declaration[] = [];
  const lines = text.split("\n");
  const keys: Record<string, string> = {};
  const names: { name: string; line: number }[] = [];
  const headerEnd = headerEndOf(lines);
  for (const [index, line] of lines.entries()) {
    if (index < headerEnd) {
      for (const name of namesOfLine(line)) {
        if (!names.some((n) => n.name === name)) names.push({ name, line: index + 1 });
      }
    }
    const keyMatch = /^\s*(?:\*|\/\/|-)?\s*(proves|fixture|surfaces):\s*(.*)$/.exec(line);
    if (keyMatch !== null) {
      const [, key, value] = keyMatch as unknown as [string, string, string];
      if (keys[key] === undefined)
        keys[key] = value
          .trim()
          .replace(/\*\/\s*$/, "")
          .trim();
    }
  }
  for (const { name, line } of names) {
    const kind = kindOfName(name);
    if (kind === undefined) continue;
    declarations.push({
      name,
      kind,
      file,
      line,
      inATask: false,
      ...(keys["proves"] === undefined ? {} : { proves: keys["proves"] }),
      ...(keys["fixture"] === undefined ? {} : { fixture: keys["fixture"] }),
      ...(keys["surfaces"] === undefined ? {} : { surfaces: keys["surfaces"] }),
    });
  }
  return declarations;
}

/**
 * Where the header comment of a test file ends: the line after the first `*\/`.
 * A file that opens with no comment has no header, and declares nothing.
 */
export function headerEndOf(lines: readonly string[]): number {
  if (!/^\s*\/\*/.test(lines[0] ?? "")) return 0;
  for (const [index, line] of lines.entries()) {
    if (index > 0 && line.includes("*/")) return index + 1;
  }
  return 0;
}

/** Every file of a directory tree that matches, depth first, in a stable order. */
function filesUnder(directory: string, matches: (file: string) => boolean): readonly string[] {
  if (!existsSync(directory)) return [];
  const found: string[] = [];
  for (const entry of readdirSync(directory).sort()) {
    const path = join(directory, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) found.push(...filesUnder(path, matches));
    else if (matches(path)) found.push(path);
  }
  return found;
}

/**
 * The sweep of F141-FR-027: read the `tasks.md` of every feature and the tests
 * under `tests/parity/`, and run the rules of §O.6 over every declaration.
 */
export function checkDeclarations(
  options: { readonly root: string } & Partial<SweepPaths>,
): Report {
  const root = options.root;
  const specsDirectory = join(root, options.specs ?? SWEEP.specs);
  const parityDirectory = join(root, options.parityTests ?? SWEEP.parityTests);

  const declarations: Declaration[] = [];
  const filesRead: string[] = [];
  const skipped: { path: string; reason: string }[] = [];

  if (!existsSync(specsDirectory)) {
    skipped.push({
      path: options.specs ?? SWEEP.specs,
      reason:
        "the specification tree is a local tree and is not in this checkout; the declarations of " +
        "`tasks.md` are not checked here",
    });
  } else {
    for (const feature of readdirSync(specsDirectory).sort()) {
      const tasks = join(specsDirectory, feature, "tasks.md");
      if (!existsSync(tasks)) continue;
      const relativePath = relative(root, tasks);
      filesRead.push(relativePath);
      declarations.push(...declarationsOfTasksFile(readFileSync(tasks, "utf8"), relativePath));
    }
  }

  if (!existsSync(parityDirectory)) {
    skipped.push({
      path: options.parityTests ?? SWEEP.parityTests,
      reason: "no parity test of the product is written yet",
    });
  } else {
    for (const file of filesUnder(parityDirectory, (f) => f.endsWith(".test.ts"))) {
      const relativePath = relative(root, file);
      filesRead.push(relativePath);
      declarations.push(...declarationsOfTestFile(readFileSync(file, "utf8"), relativePath));
    }
  }

  const findings: Finding[] = [];
  for (const declaration of declarations) {
    for (const violation of violationsOfDeclaration(declaration)) {
      findings.push({
        file: declaration.file,
        line: declaration.line,
        test: declaration.name,
        rule: violation.rule,
        message: violation.message,
        severity: isOwnedByTheOracle(declaration.file) ? "refusal" : "external",
      });
    }
  }

  return { declarations, findings, filesRead, skipped };
}

/** The refusals of a report: the findings in the oracle's own paths. */
export function refusalsOf(report: Report): readonly Finding[] {
  return report.findings.filter((f) => f.severity === "refusal");
}

/** The external findings of a report: what another feature owns and repairs. */
export function externalFindingsOf(report: Report): readonly Finding[] {
  return report.findings.filter((f) => f.severity === "external");
}

/**
 * The exit code of the check: 0 when nothing the oracle owns is wrong, 1 when
 * something is. With `strict`, an external finding counts as well.
 */
export function exitCodeOf(report: Report, strict = false): number {
  if (refusalsOf(report).length > 0) return 1;
  if (strict && externalFindingsOf(report).length > 0) return 1;
  return 0;
}

/** The report as the lines the command prints. Every finding is named; none is hidden. */
export function reportLines(report: Report, strict = false): readonly string[] {
  const lines: string[] = [];
  lines.push(
    `declaration check (F141-FR-027, F141-FR-028): ${report.declarations.length} declarations in ` +
      `${report.filesRead.length} files; ${activeFamilyIds().length} active fixture families`,
  );
  for (const skip of report.skipped) {
    lines.push(`  skip: ${skip.path}: ${skip.reason}`);
  }
  const refusals = refusalsOf(report);
  const external = externalFindingsOf(report);
  for (const finding of refusals) {
    lines.push(
      `  REFUSED ${finding.file}:${finding.line} ${finding.test}: ${finding.rule}: ${finding.message}`,
    );
  }
  for (const finding of external) {
    lines.push(
      `  external ${finding.file}:${finding.line} ${finding.test}: ${finding.rule}: ${finding.message}`,
    );
  }
  lines.push(
    `  ${refusals.length} refused, ${external.length} external` +
      (external.length > 0 && !strict
        ? " (reported for the feature that owns the declaration; the oracle never edits another feature's specification)"
        : ""),
  );
  lines.push(
    exitCodeOf(report, strict) === 0 ? "declaration check: ok" : "declaration check: FAILED",
  );
  return lines;
}
