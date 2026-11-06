/**
 * T069 — the store of committed golden captures, and the comparison of the port
 * with them (F141-FR-025).
 *
 * Decision D-1 of `research.md` is a hybrid, and this module is its first half:
 *
 * > "For a change under review, the port MUST be compared with committed golden
 * > captures of the reference, so that the reference need not run."
 *
 * `../capture/golden.ts` of phase 4 is the FILE layout — one normalized capture
 * of one side of one scenario, its writer and its reader. This module is the
 * STORE over those files and the three rules F141-FR-025 states about them that
 * no single file can state about itself:
 *
 * | Rule of F141-FR-025 | Here |
 * |---|---|
 * | "A golden capture MUST be stored in normalized form and MUST hold no path, account or name of the machine that made it" | `assertNoMachineTrace`, `machineTracesIn`, `assertEveryGoldenCaptureIsNormalized` |
 * | "The repository of the product MUST hold no copy of a reference tree" | `assertNoReferenceTreeInTheRepository`, `referenceTreeCopiesIn` |
 * | "On macOS … the release condition MUST use the golden captures that the live run on Linux confirmed on the same build" | `goldenCaptureForThePlatformTier`, `readLiveRunConfirmation` |
 *
 * and the comparison itself: `comparePortWithGolden`, which is the hermetic test
 * tier of F141-FR-037.
 *
 * Why the comparison is not `compare()` of the comparator. `compare()` takes two
 * captures AS CAPTURED and normalizes both. A golden capture is already
 * normalized — that is what makes it committable — so normalizing it again would
 * run the rules of feature 100 over values they have already replaced and would
 * report their counts twice. The port's capture is normalized here, once, and its
 * surfaces are then compared with the golden surfaces through the same
 * `differencesOf` and the same waiver matching the comparator uses, so a result
 * means here exactly what it means there.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { homedir, hostname, tmpdir, userInfo } from "node:os";
import { join, resolve, sep } from "node:path";

import {
  RESULT_SCHEMA_ID,
  type ResultReport,
  type SurfaceResult,
  differencesOf,
  portOnlyLines,
  COMPARED_STREAMS,
} from "../compare/comparator.ts";
import { applyLaunchContractKeyMap } from "../compare/key-names.ts";
import { applyNotCompared } from "../compare/not-compared.ts";
import { ORACLE_ROOT } from "../index.ts";
import { normalize, type NormalizeContext, type NormalizedCapture } from "../normalize/index.ts";
import { componentFiles } from "../normalize/text.ts";
import { waiverFor, type Difference, type Waiver } from "../waivers/waivers.ts";
import {
  GOLDEN_DIR,
  GOLDEN_SCHEMA_ID,
  goldenFile,
  hasGoldenCapture,
  readGoldenCapture,
  type GoldenCapture,
} from "../capture/golden.ts";

/** A fault of the store: a capture that may not be committed, or a tree that may not be. */
export class GoldenStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoldenStoreError";
  }
}

// ---------------------------------------------------------------------------
// The store
// ---------------------------------------------------------------------------

/** One committed golden capture, as the store sees it. */
export type GoldenEntry = {
  /** The scenario, as `FX-nn/<name>`. */
  readonly fixture: string;
  readonly side: "reference" | "port";
  /** The file, relative to the root of the repository. */
  readonly file: string;
};

/** Every committed golden capture, in the order of family and name. */
export function goldenStoreEntries(dir: string = GOLDEN_DIR): readonly GoldenEntry[] {
  if (!existsSync(dir)) return Object.freeze([]);
  const entries: GoldenEntry[] = [];
  for (const family of readdirSync(dir).sort()) {
    const familyDir = join(dir, family);
    if (!statSync(familyDir).isDirectory()) continue;
    for (const file of readdirSync(familyDir).sort()) {
      const match = /^(.+)\.(reference|port)\.json$/.exec(file);
      if (match === null) continue;
      entries.push(
        Object.freeze({
          fixture: `${family}/${match[1] as string}`,
          side: match[2] as "reference" | "port",
          file: join(familyDir, file),
        }),
      );
    }
  }
  return Object.freeze(entries);
}

/** The scenarios the store holds a capture of the reference for. */
export function fixturesWithAGoldenCapture(dir: string = GOLDEN_DIR): readonly string[] {
  return Object.freeze(
    goldenStoreEntries(dir)
      .filter((entry) => entry.side === "reference")
      .map((entry) => entry.fixture),
  );
}

// ---------------------------------------------------------------------------
// "no path, account or name of the machine that made it"
// ---------------------------------------------------------------------------

/**
 * The roots under which a path names a place of ONE machine: a home, a temporary
 * directory, a removable volume. A normalized capture carries `<WORK>`, `<RUN>`,
 * `<IMPL>`, `<HOME>` and `<TMP>` instead (N-01), so any of these in a committed
 * capture is a rule that did not fire.
 *
 * `/usr`, `/bin` and `/etc` are deliberately NOT here: a captured file may hold
 * `#!/usr/bin/env python3`, which is content of the run and the same on every
 * machine, not a trace of the machine that made the capture.
 */
export const MACHINE_PATH_ROOTS: readonly string[] = Object.freeze([
  "/home",
  "/Users",
  "/root",
  "/tmp",
  "/var/tmp",
  "/var/folders",
  "/private/var",
  "/Volumes",
  "/srv",
  "/mnt",
  "/media",
]);

/** A literal, as a part of a regular expression. */
export function quoted(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * A path of the machine is a path that STARTS at one of the machine roots, and the
 * root is a whole path component: `<local-path>` and `/tmp` are, `/rootless` and
 * `/tmpfiles` are not. A relative mention of the word (`the repository root`) is
 * not a path at all.
 */
export function machinePathsIn(text: string): readonly string[] {
  const found: string[] = [];
  for (const root of MACHINE_PATH_ROOTS) {
    if (new RegExp(`${quoted(root)}(?:/|$|["'\\s,;:)\\]}])`).test(text)) found.push(root);
  }
  return Object.freeze(found);
}

/**
 * Where the fixtures lie, which is where a path a SCENARIO carries is committed.
 */
export const FIXTURES_DIRECTORY = join(ORACLE_ROOT, "fixtures");

/** Files of a fixture that are read as text when its committed paths are collected. */
const READABLE_FIXTURE_FILE = /\.(?:json|jsonl|md|txt|py|sh|ts|toml|yaml|yml|log|tsv|csv)$/;

/** The most bytes of one file of a fixture that are read for the collection. */
const FIXTURE_FILE_BYTE_CAP = 2_000_000 as const;

/**
 * Every path under a machine root that the COMMITTED input of one scenario carries.
 *
 * A path of the machine in a capture is a rule that did not fire — unless the
 * scenario's own input carries that path as a literal. The as-is stream fixtures
 * of the Specstride baseline do: `test_golden_evidence_event.jsonl` records a
 * `Write` tool call whose target is `/tmp/stream-golden/GATE2-EVIDENCE.md`, and
 * FX-26 replays that stream byte for byte, so the capture holds the target the
 * stream named. That literal is committed in this repository, is the same on every
 * machine, and names no place of the machine that made the capture — exactly the
 * reason `/usr`, `/bin` and `/etc` are not machine roots above. Found by
 * `FX-26/claude-evidence-event` and
 * `FX-26/claude-adapter-preserves-visible-event-mapping-and-exact-evidence`.
 *
 * The collection reads the scenario's directory and nothing else: an imported
 * as-is asset reaches a scenario as a file of its fixture, so a literal that is
 * allowed here is a literal a reader of the fixture can see.
 */
export function committedPathsOfTheScenario(
  fixture: string,
  root: string = FIXTURES_DIRECTORY,
): readonly string[] {
  const [family, ...rest] = fixture.split("/");
  const name = rest.join("/");
  if (family === undefined || name === "") return Object.freeze([]);
  const directory = join(root, family, name);
  if (!existsSync(directory)) return Object.freeze([]);
  const roots = MACHINE_PATH_ROOTS.map((machine) => quoted(machine)).join("|");
  const pattern = new RegExp(`(?:${roots})(?:/[^\\s"',;:)\\]}]+)+`, "g");
  const found = new Set<string>();
  const walk = (path: string): void => {
    const stat = statSync(path);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(path).sort()) walk(join(path, entry));
      return;
    }
    if (!READABLE_FIXTURE_FILE.test(path) || stat.size > FIXTURE_FILE_BYTE_CAP) return;
    for (const match of readFileSync(path, "utf8").matchAll(pattern)) found.add(match[0]);
  };
  walk(directory);
  // The longest first, so stripping one never leaves the tail of another behind.
  return Object.freeze([...found].sort((a, b) => b.length - a.length));
}

/** The keys whose value names an account or a machine wherever it is written. */
export const IDENTITY_KEYS: readonly string[] = Object.freeze([
  "user",
  "username",
  "USER",
  "USERNAME",
  "LOGNAME",
  "owner",
  "account",
  "HOME",
  "host",
  "hostname",
  "HOSTNAME",
  "machine",
]);

/** The values an identity key may carry: a placeholder, and loopback. */
export const IDENTITY_VALUES_ALLOWED: readonly string[] = Object.freeze([
  "<HOME>",
  "<USER>",
  "<HOST>",
  "localhost",
  "127.0.0.1",
  "::1",
  "",
]);

/** Who and where the machine that runs this is. */
export type MachineIdentity = {
  readonly home: string;
  readonly temporaryDirectory: string;
  readonly account: string;
  readonly machine: string;
};

/** The identity of the machine that runs this, for the scan. */
export function machineIdentity(): MachineIdentity {
  return Object.freeze({
    home: homedir(),
    temporaryDirectory: tmpdir(),
    account: userInfo().username,
    machine: hostname(),
  });
}

/** What the scan found: one trace, with the place in the capture it was found at. */
export type MachineTrace = {
  readonly kind: "path" | "account" | "machine";
  readonly at: string;
  readonly found: string;
};

/**
 * Where an account or the name of a machine IDENTIFIES rather than merely occurs.
 *
 * A bare occurrence of either is not a trace. The account of this machine is
 * `root` on a great many machines and the word stands in ordinary English — "run
 * from the repository root" — and a hostname may be an ordinary word too. What
 * makes an occurrence a trace is the POSITION: a component of a path, the value of
 * an identity key (`IDENTITY_KEYS`, read separately), the local part of a mail-like
 * address, the host of a URL, or a `.local` name.
 *
 * So the three kinds of F141-FR-025 are each found by what they are: a path by its
 * root, an account and a machine by an identifying position.
 */
export function identifyingPositionsOf(literal: string): readonly RegExp[] {
  const name = quoted(literal);
  return Object.freeze([
    // a component of an absolute path: /home/<name>/…, /Users/<name>, /<name>/…
    new RegExp(`/${name}(?:/|$|["'\\s,;:)\\]}])`),
    // the local part of a mail-like address, or the user of a URL
    new RegExp(`(?:^|[\\s"'(<])${name}@`),
    // the host of a URL or of a mail-like address, or a name of the local network
    new RegExp(`://${name}(?:[:/]|$)`),
    new RegExp(`@${name}(?:[:/\\s"']|$)`),
    new RegExp(`\\b${name}\\.local\\b`),
  ]);
}

/** True where a value holds the literal in a position that identifies. */
export function identifiesIn(text: string, literal: string): boolean {
  if (literal === "" || IDENTITY_VALUES_ALLOWED.includes(literal)) return false;
  return identifyingPositionsOf(literal).some((pattern) => pattern.test(text));
}

/**
 * Every trace of a machine in one value, walked key by key.
 *
 * The three kinds are F141-FR-025's own: a **path** of the machine, an **account**
 * and a **name of the machine**.
 */
export function machineTracesIn(
  value: unknown,
  identity: MachineIdentity = machineIdentity(),
  at = "",
  /**
   * Paths the scenario's own committed input carries, which are content of the run
   * and no trace of the machine (`committedPathsOfTheScenario`).
   */
  carried: readonly string[] = [],
): readonly MachineTrace[] {
  const traces: MachineTrace[] = [];
  const withoutWhatTheScenarioCarries = (text: string): string => {
    let rest = text;
    for (const literal of carried) rest = rest.split(literal).join("");
    return rest;
  };
  const walk = (held: unknown, where: string): void => {
    if (typeof held === "string") {
      for (const root of machinePathsIn(withoutWhatTheScenarioCarries(held))) {
        traces.push({ kind: "path", at: where, found: root });
      }
      for (const [kind, literal] of [
        ["account", identity.account],
        ["machine", identity.machine],
      ] as const) {
        if (identifiesIn(held, literal)) traces.push({ kind, at: where, found: literal });
      }
      return;
    }
    if (Array.isArray(held)) {
      held.forEach((item, index) => walk(item, `${where}[${index}]`));
      return;
    }
    if (typeof held === "object" && held !== null) {
      for (const [key, item] of Object.entries(held)) {
        const place = where === "" ? key : `${where}.${key}`;
        if (
          IDENTITY_KEYS.includes(key) &&
          typeof item === "string" &&
          !IDENTITY_VALUES_ALLOWED.includes(item)
        ) {
          traces.push({
            kind:
              key === "host" || key === "hostname" || key === "HOSTNAME" || key === "machine"
                ? "machine"
                : "account",
            at: place,
            found: item,
          });
        }
        walk(item, place);
      }
    }
  };
  walk(value, at);
  // One trace per kind, place and value: a long string that holds the same root
  // twice is one finding, not two.
  const seen = new Set<string>();
  return Object.freeze(
    traces.filter((trace) => {
      const key = `${trace.kind}|${trace.at}|${trace.found}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }),
  );
}

/**
 * F141-FR-025 — a golden capture holds no path, account or name of the machine
 * that made it. Throws and names every trace it found.
 */
export function assertNoMachineTrace(
  golden: GoldenCapture,
  identity: MachineIdentity = machineIdentity(),
  carried: readonly string[] = committedPathsOfTheScenario(golden.fixture),
): void {
  const traces = machineTracesIn(golden.surfaces, identity, "", carried);
  if (traces.length === 0) return;
  throw new GoldenStoreError(
    `the golden capture of ${golden.fixture} (${golden.side}) holds ${traces.length} trace(s) of ` +
      `the machine that made it, which F141-FR-025 forbids: ` +
      traces
        .slice(0, 8)
        .map((trace) => `${trace.kind} \`${trace.found}\` at ${trace.at}`)
        .join("; "),
  );
}

/**
 * F141-FR-025 — a golden capture is stored in NORMALIZED form. What makes it
 * normalized is that the rules of feature 100 ran: the capture carries their
 * counts. A file with no counts was hand-written, and a hand-written golden
 * capture is an expectation nobody captured.
 */
export function assertEveryGoldenCaptureIsNormalized(golden: GoldenCapture): void {
  if (golden.schema !== GOLDEN_SCHEMA_ID) {
    throw new GoldenStoreError(
      `${golden.fixture}: the golden capture names the schema ${String(golden.schema)}`,
    );
  }
  const counted = Object.keys(golden.counts).length;
  if (counted === 0) {
    throw new GoldenStoreError(
      `the golden capture of ${golden.fixture} (${golden.side}) carries no count of any ` +
        `normalization rule, so it was not stored in normalized form (F141-FR-025)`,
    );
  }
}

/** Every committed golden capture, checked: normalized, and with no trace of a machine. */
export function checkTheStore(dir: string = GOLDEN_DIR): readonly string[] {
  const refusals: string[] = [];
  for (const entry of goldenStoreEntries(dir)) {
    let golden: GoldenCapture;
    try {
      golden = JSON.parse(readFileSync(entry.file, "utf8")) as GoldenCapture;
    } catch (error) {
      refusals.push(`${entry.file}: ${(error as Error).message}`);
      continue;
    }
    for (const check of [assertEveryGoldenCaptureIsNormalized, assertNoMachineTrace] as const) {
      try {
        check(golden);
      } catch (error) {
        refusals.push((error as Error).message);
      }
    }
  }
  return Object.freeze(refusals);
}

// ---------------------------------------------------------------------------
// "The repository of the product MUST hold no copy of a reference tree"
// ---------------------------------------------------------------------------

/**
 * How many as-is implementations of one baseline must stand in one directory
 * before it is a copy of that baseline's tree. One file is an imported asset or a
 * coincidence of names; three together are the baseline.
 */
export const REFERENCE_TREE_MARKER_COUNT = 3 as const;

/** The directories the walk never enters: not the product, or not in the repository. */
export const NEVER_WALKED: readonly string[] = Object.freeze([
  ".git",
  "node_modules",
  "specs",
  "dist",
  "coverage",
]);

/** The marker files of one baseline, read from the component-name table of feature 100. */
export function referenceTreeMarkers(system: string): readonly (readonly string[])[] {
  return Object.freeze(
    componentFiles()
      .filter((row) => row.system === system)
      .map((row) => Object.freeze([...row.files])),
  );
}

/** One directory that holds a copy of a reference tree, and which baseline it is of. */
export type ReferenceTreeCopy = {
  readonly directory: string;
  readonly system: string;
  readonly markers: readonly string[];
};

/** How many as-is implementations of one baseline stand under one directory. */
export function markersUnder(directory: string, system: string): readonly string[] {
  const found: string[] = [];
  for (const row of referenceTreeMarkers(system)) {
    const file = row.find((candidate) => existsSync(join(directory, candidate)));
    if (file !== undefined) found.push(file);
  }
  return Object.freeze(found);
}

/**
 * Every directory of a tree that is a copy of a reference tree (F141-FR-025).
 *
 * A reference tree is produced at run time, into scratch, from a local clone; the
 * repository of the product holds none. The check is what makes that true of a
 * commit rather than of a habit.
 */
export function referenceTreeCopiesIn(
  root: string,
  systems: readonly string[] = ["specstride", "mixture-of-loops"],
): readonly ReferenceTreeCopy[] {
  const copies: ReferenceTreeCopy[] = [];
  const walk = (directory: string, depth: number): void => {
    for (const system of systems) {
      const markers = markersUnder(directory, system);
      if (markers.length >= REFERENCE_TREE_MARKER_COUNT) {
        copies.push(Object.freeze({ directory, system, markers }));
      }
    }
    if (depth === 0) return;
    let children: string[];
    try {
      children = readdirSync(directory);
    } catch {
      return;
    }
    for (const child of children.sort()) {
      if (NEVER_WALKED.includes(child)) continue;
      const path = join(directory, child);
      let isDirectory: boolean;
      try {
        isDirectory = statSync(path).isDirectory();
      } catch {
        continue;
      }
      if (isDirectory) walk(path, depth - 1);
    }
  };
  walk(resolve(root), 6);
  return Object.freeze(copies);
}

/** F141-FR-025 — the repository holds no copy of a reference tree. */
export function assertNoReferenceTreeInTheRepository(root: string): void {
  const copies = referenceTreeCopiesIn(root);
  if (copies.length === 0) return;
  throw new GoldenStoreError(
    `the repository holds ${copies.length} copy(ies) of a reference tree, which F141-FR-025 ` +
      `forbids: ` +
      copies
        .map(
          (copy) =>
            `${copy.directory.slice(resolve(root).length + 1)} (${copy.system}: ${copy.markers.join(", ")})`,
        )
        .join("; ") +
      `. A reference tree is produced at run time into scratch from a local clone`,
  );
}

// ---------------------------------------------------------------------------
// The comparison of the port with the store (the hermetic test tier)
// ---------------------------------------------------------------------------

/** The capture of the port as it was captured, before the rules ran. */
export type PortCapture = {
  readonly scenario: string;
  readonly side: "port";
  readonly suite?: "first" | "second";
  readonly layer?: "off" | "on";
  readonly surfaces: Readonly<Record<string, unknown>>;
  readonly missing?: Readonly<Record<string, string>>;
};

/** What `comparePortWithGolden` was asked to do. */
export type ComparePortWithGoldenOptions = {
  readonly fixture: string;
  readonly golden: GoldenCapture;
  readonly portContext: NormalizeContext;
  readonly waivers?: readonly Waiver[];
  readonly tier?: "hermetic" | "reference" | "platform";
  readonly skipped?: { readonly reason: string };
};

/** What the comparison with the store gives back. */
export type GoldenComparison = {
  readonly report: ResultReport;
  readonly normalizedPort: NormalizedCapture;
  readonly differences: readonly Difference[];
};

/**
 * Compare the port with a committed golden capture of the reference, surface by
 * surface (F141-FR-025, the hermetic test tier of F141-FR-037).
 *
 * The golden capture is read as it lies: it is already normalized. The port's
 * capture goes through the key-name map of the launch contract, the members the
 * register does not compare, and then the rules — exactly the order `compare()`
 * uses — and the surfaces are compared with `differencesOf` and waived with
 * `waiverFor`, so a `different` here is a `different` there.
 */
export function comparePortWithGolden(
  portAsCaptured: PortCapture,
  options: ComparePortWithGoldenOptions,
): GoldenComparison {
  const tier = options.tier ?? "hermetic";
  const empty: NormalizedCapture = {
    scenario: options.fixture,
    side: "port",
    suite: portAsCaptured.suite ?? "first",
    layer: portAsCaptured.layer ?? "off",
    surfaces: {},
    missing: {},
    counts: {},
    findings: [],
  };
  if (options.skipped !== undefined) {
    return Object.freeze({
      report: {
        schema: RESULT_SCHEMA_ID,
        suite: portAsCaptured.suite ?? "first",
        tier,
        fixture: options.fixture,
        skipped: options.skipped,
        results: {},
        replacements: {},
      },
      normalizedPort: empty,
      differences: Object.freeze([]),
    });
  }
  const mapped = applyLaunchContractKeyMap(portAsCaptured);
  const dropped = applyNotCompared(mapped.capture);
  // The members the register does NOT compare are dropped from the golden capture
  // too (DV-061, DV-097). A golden capture is stored normalized but not
  // register-handled — `writeGoldenCapture` writes what the rules of feature 100
  // gave — so dropping on the port side alone would read `different` on every
  // member the register takes out of the comparison, which is the one thing those
  // rows say must not happen. `compare()` drops both sides for the same reason.
  const goldenDropped = applyNotCompared({
    scenario: options.fixture,
    side: "reference" as const,
    surfaces: options.golden.surfaces,
    missing: options.golden.missing,
  });
  const goldenSurfaces = goldenDropped.capture.surfaces;
  const normalizedPort = normalize(
    {
      scenario: options.fixture,
      side: "port",
      suite: portAsCaptured.suite ?? "first",
      layer: portAsCaptured.layer ?? "off",
      surfaces: dropped.capture.surfaces,
      missing: dropped.capture.missing ?? {},
    },
    options.portContext,
  );

  const names = [
    ...new Set([
      ...Object.keys(goldenSurfaces),
      ...Object.keys(normalizedPort.surfaces),
      ...Object.keys(options.golden.missing),
      ...Object.keys(normalizedPort.missing),
    ]),
  ].sort();

  const results: Record<string, SurfaceResult> = {};
  const every: Difference[] = [];
  const waivers = options.waivers ?? [];

  for (const surface of names) {
    const missing = options.golden.missing[surface] ?? normalizedPort.missing[surface] ?? undefined;
    if (missing !== undefined) {
      const difference: Difference = {
        fixture: options.fixture,
        surface,
        selector: surface,
        reference: `missing: ${missing}`,
        port: `missing: ${missing}`,
      };
      results[surface] = { result: "different", differences: [difference] };
      every.push(difference);
      continue;
    }
    const differences = differencesOf(
      options.fixture,
      surface,
      goldenSurfaces[surface],
      normalizedPort.surfaces[surface],
    );
    every.push(...differences);
    const onlyPort = COMPARED_STREAMS.includes(surface)
      ? portOnlyLines(goldenSurfaces[surface], normalizedPort.surfaces[surface])
      : [];
    if (onlyPort.length > 0) {
      results[surface] = {
        result: "different",
        differences: [
          ...differences,
          ...onlyPort.map((line) => ({
            fixture: options.fixture,
            surface,
            selector: "a line that only the port prints",
            reference: null,
            port: line,
          })),
        ],
      };
      continue;
    }
    if (differences.length === 0) {
      results[surface] = { result: "equal" };
      continue;
    }
    const matched = differences.map((difference) => waiverFor(waivers, difference));
    if (matched.every((waiver) => waiver !== undefined)) {
      results[surface] = {
        result: "waived",
        row: (matched[0] as Waiver).row,
        differences,
      };
      continue;
    }
    results[surface] = { result: "different", differences };
  }

  return Object.freeze({
    report: {
      schema: RESULT_SCHEMA_ID,
      suite: portAsCaptured.suite ?? "first",
      tier,
      fixture: options.fixture,
      results: Object.freeze(results),
      replacements: Object.freeze({ ...normalizedPort.counts }),
    },
    normalizedPort,
    differences: Object.freeze(every),
  });
}

// ---------------------------------------------------------------------------
// macOS: the captures the live run on Linux confirmed on the same build
// ---------------------------------------------------------------------------

/**
 * The record the live differential run on Linux leaves behind: the build it ran
 * on, and the golden captures it confirmed against a fresh capture of the
 * reference. The platform tier on macOS reads it and compares the port with
 * exactly those captures (F141-FR-025, F141-FR-035).
 */
export type LiveRunConfirmation = {
  readonly schema: typeof LIVE_RUN_CONFIRMATION_SCHEMA_ID;
  /** The commit of the product the live run ran on. */
  readonly build: string;
  readonly platform: "linux";
  /** The scenarios whose golden capture a fresh capture of the reference confirmed. */
  readonly confirmed: readonly string[];
  readonly passed: boolean;
};

export const LIVE_RUN_CONFIRMATION_SCHEMA_ID =
  "urn:specstride:schema:internal:141:oracle-live-run/1" as const;

/** Where the live run leaves its confirmation. */
export const LIVE_RUN_CONFIRMATION_FILE = join(GOLDEN_DIR, "live-run.json");

/** The confirmation of the live run, or `undefined` where there is none. */
export function readLiveRunConfirmation(
  file: string = LIVE_RUN_CONFIRMATION_FILE,
): LiveRunConfirmation | undefined {
  if (!existsSync(file)) return undefined;
  const parsed = JSON.parse(readFileSync(file, "utf8")) as LiveRunConfirmation;
  if (parsed.schema !== LIVE_RUN_CONFIRMATION_SCHEMA_ID) {
    throw new GoldenStoreError(
      `${file}: the confirmation names the schema ${String(parsed.schema)}`,
    );
  }
  return parsed;
}

/**
 * The golden capture the platform tier compares the port with on macOS
 * (F141-FR-025: "On macOS, where the Specstride reference does not run, the
 * release condition MUST use the golden captures that the live run on Linux
 * confirmed on the same build").
 *
 * Three ways this refuses, and each is a refusal and never a quiet fallback:
 * there is no committed capture; there is no confirmation of a live run; the
 * confirmation is of another build, did not pass, or does not name this scenario.
 */
export function goldenCaptureForThePlatformTier(options: {
  readonly fixture: string;
  readonly build: string;
  readonly confirmation?: LiveRunConfirmation | undefined;
  readonly dir?: string;
}): GoldenCapture {
  const { fixture, build } = options;
  if (!hasGoldenCapture(fixture)) {
    throw new GoldenStoreError(
      `${fixture}: the store holds no golden capture of the reference, and the Specstride ` +
        `reference does not run on macOS, so the platform tier has nothing to compare with ` +
        `(F141-FR-025)`,
    );
  }
  const confirmation = options.confirmation;
  if (confirmation === undefined) {
    throw new GoldenStoreError(
      `${fixture}: no live differential run on Linux has confirmed the golden captures, so the ` +
        `platform tier on macOS has no confirmed capture to use (F141-FR-025). The live run is ` +
        `the \`reference\` tier; its confirmation is ${LIVE_RUN_CONFIRMATION_FILE}`,
    );
  }
  if (!confirmation.passed) {
    throw new GoldenStoreError(
      `${fixture}: the live differential run on Linux of build ${confirmation.build} did not ` +
        `pass, so its golden captures are not confirmed (F141-FR-025)`,
    );
  }
  if (confirmation.build !== build) {
    throw new GoldenStoreError(
      `${fixture}: the live differential run on Linux confirmed the golden captures on build ` +
        `${confirmation.build}, and the platform tier is running on build ${build}. ` +
        `F141-FR-025 asks for the captures the live run confirmed on the SAME build`,
    );
  }
  if (!confirmation.confirmed.includes(fixture)) {
    throw new GoldenStoreError(
      `${fixture}: the live differential run on Linux of build ${build} did not confirm this ` +
        `scenario, so the platform tier may not use its golden capture (F141-FR-025)`,
    );
  }
  return readGoldenCapture(fixture);
}

export {
  GOLDEN_DIR,
  GOLDEN_SCHEMA_ID,
  goldenFile,
  hasGoldenCapture,
  readGoldenCapture,
  type GoldenCapture,
};
export { sep as PATH_SEPARATOR };
