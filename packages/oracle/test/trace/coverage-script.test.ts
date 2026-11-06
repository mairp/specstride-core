/**
 * CT-141-134 — the coverage script (T079, T086; F141-FR-034).
 *
 * > "The coverage script of the cross-feature review MUST check that every row of
 * > the traceability files with a kept disposition is named by the `proves:` of at
 * > least one test of its feature; that every id a test or an `origin:` names
 * > exists; that every `fixture:` names a family of the catalogue that is not
 * > retired; and, where an exercise map exists, that every claim passes
 * > F141-FR-032. It MUST be kept with the traceability files and MUST exit with a
 * > failure when a check fails."
 *
 * The script is `docs/ecosystem/check-traceability.py` — kept WITH the
 * traceability files, as the requirement asks, and run as a gate command of this
 * feature. The checks are decided here by RUNNING it, as a subprocess, over the
 * real repository and over a fake repository whose inputs are symbolic links to
 * the real ones and whose exercise map the test writes. A failing check must make
 * it exit non-zero, so every negative case below asserts the exit code and the
 * message, not only the message.
 *
 * The exercise map is NOT a committed file: it is written by the capture job,
 * which needs both baselines (F141-FR-031). The script therefore notes its
 * absence in a checkout that has none, and this test supplies one.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { activeFamilies, family } from "../../src/catalogue/data.ts";
import { ORACLE_ROOT } from "../../src/index.ts";
import { readPins } from "../../src/reference/pins.ts";
import { resolveComponentPlaceholders } from "../../src/run/driver.ts";
import { SUPPLEMENT_FILE, buildExerciseMap } from "../../src/trace/map.ts";

const REPOSITORY_ROOT = join(ORACLE_ROOT, "..", "..");
const SCRIPT = join("docs", "ecosystem", "check-traceability.py");

/** Run the script in one root and give its exit code and its output. */
function runScript(root: string): { readonly code: number; readonly out: string } {
  const result = spawnSync("python3", [join(root, SCRIPT)], { encoding: "utf8" });
  return { code: result.status ?? -1, out: `${result.stdout}${result.stderr}` };
}

/**
 * A repository whose `docs/ecosystem` and `specs` are symbolic links to the real
 * ones, and whose `packages/oracle/exercise-map` the caller fills. The script
 * resolves every input relative to its own file, so a link tree is enough and
 * nothing of the real repository is written.
 */
function fakeRepository(options?: {
  readonly editedFeature?: string;
  readonly edit?: (text: string) => string;
}): string {
  const root = mkdtempSync(join(tmpdir(), "oracle-coverage-"));
  const ecosystem = join(root, "docs", "ecosystem");
  mkdirSync(ecosystem, { recursive: true });
  const real = join(REPOSITORY_ROOT, "docs", "ecosystem");
  for (const name of readdirSync(real)) symlinkSync(join(real, name), join(ecosystem, name));
  const specs = join(REPOSITORY_ROOT, "specs");
  if (options?.editedFeature === undefined) {
    symlinkSync(specs, join(root, "specs"));
  } else {
    // A link farm: every feature is the real directory, and the one named is an
    // edited copy. Nothing of the real specification tree is written.
    const farm = join(root, "specs");
    mkdirSync(farm, { recursive: true });
    for (const name of readdirSync(specs)) {
      if (name === options.editedFeature) continue;
      symlinkSync(join(specs, name), join(farm, name));
    }
    const copy = join(farm, options.editedFeature);
    cpSync(join(specs, options.editedFeature), copy, { recursive: true, dereference: true });
    const tasks = join(copy, "tasks.md");
    writeFileSync(tasks, (options.edit ?? ((text) => text))(readFileSync(tasks, "utf8")), "utf8");
  }
  const exerciseMap = join(root, "packages", "oracle", "exercise-map");
  mkdirSync(exerciseMap, { recursive: true });
  symlinkSync(SUPPLEMENT_FILE, join(exerciseMap, "supplement.tsv"));
  return root;
}

/**
 * The evidence lines every claim of this repository that names one of these
 * families needs, computed BY THE SCRIPT ITSELF: the script's own reading of the
 * declarations and of the traceability files decides which claims a map of these
 * families makes it decide, so the positive case below is built from the same
 * reading the check uses and cannot pass by disagreeing with it.
 */
function linesNeededBy(families: readonly string[]): readonly string[] {
  const program = [
    "import importlib.util, json, csv, collections, sys",
    `spec = importlib.util.spec_from_file_location("ct", ${JSON.stringify(join(REPOSITORY_ROOT, SCRIPT))})`,
    "m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)",
    `families = set(${JSON.stringify(families)})`,
    `items = [dict(r) for r in csv.DictReader(open(${JSON.stringify(join(REPOSITORY_ROOT, "docs", "ecosystem", "traceability-items.tsv"))}), delimiter="\t", quoting=csv.QUOTE_NONE)]`,
    "evidence = m.inventory_evidence()",
    "clusters = collections.defaultdict(list)",
    "for row in items: clusters[row['cluster']].append(row)",
    "by_item = {row['b_id']: row for row in items}",
    "declarations = []",
    "for feature in m.WAVE1:",
    "    root, _ = m.spec_files(feature)",
    "    declarations.extend(m.read_declarations(root) or [])",
    "needed = set()",
    "for d in declarations:",
    "    if not families & set(d['fixture']): continue",
    "    for claim in set(d['proves']):",
    "        if claim in by_item and evidence.get(claim): needed.add(evidence[claim])",
    "        elif claim in clusters:",
    "            for row in clusters[claim]:",
    "                if row['feature'].split('-')[0] == d['feature'] and m.kind(row['disposition']) in m.KEPT_START and evidence.get(row['b_id']):",
    "                    needed.add(evidence[row['b_id']])",
    "print(json.dumps(sorted(needed)))",
  ].join("\n");
  const result = spawnSync("python3", ["-c", program], { encoding: "utf8" });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  return JSON.parse(result.stdout) as readonly string[];
}

/** An exercise map in which one scenario executed exactly these evidence lines. */
function mapOf(scenario: string, lines: Iterable<string>): string {
  const perFile = new Map<string, Set<number>>();
  for (const line of lines) {
    const at = line.lastIndexOf(":");
    const file = line.slice(0, at);
    let known = perFile.get(file);
    if (known === undefined) {
      known = new Set<number>();
      perFile.set(file, known);
    }
    known.add(Number(line.slice(at + 1)));
  }
  return JSON.stringify(
    buildExerciseMap({
      pins: readPins(),
      traces: [{ scenario, system: "specstride", shell: perFile, python: new Map() }],
    }),
  );
}

test("CT-141-134 the script is kept with the traceability files and passes on this repository", () => {
  const { code, out } = runScript(REPOSITORY_ROOT);
  assert.equal(code, 0, out);
  assert.match(out, /PASSED: checks a to j/);
  // The four checks the requirement names are in the script's own description.
  assert.match(out, /traceability check/);
  // Without a capture there is no exercise map, and that is a note, never a pass
  // of the claim check.
  assert.match(out, /no exercise map has been captured/);
  // And check j is described, so a reader of the script finds the rule.
  assert.match(out, /checks a to j/);
});

test("CT-141-134 every kept row is named by a test of its feature, and every id exists", () => {
  // Both are checks of the script (h3). They are decided by RUNNING it over a
  // repository whose specification tree is a link farm with ONE feature replaced
  // by an edited copy: the real tree is never written.
  const feature = "127-quota-budgets-and-pause";

  // 1. a kept row of that feature is no longer named by any test of it.
  const dropped = fakeRepository({
    editedFeature: feature,
    edit: (text) => text.replace("- proves: C-013; B-0270", "- proves: C-012"),
  });
  const first = runScript(dropped);
  assert.equal(first.code, 1, first.out);
  assert.match(
    first.out,
    /\[h3\] 127-quota-budgets-and-pause: no test task proves \d+ kept items of C-013/,
  );

  // 2. a test names an id that does not exist.
  const invented = fakeRepository({
    editedFeature: feature,
    edit: (text) =>
      `${text}\n- [ ] T999 Parity test PT-127-C-013-invented in tests/parity/127/invented.test.ts\n  - proves: B-9999\n`,
  });
  const second = runScript(invented);
  assert.equal(second.code, 1, second.out);
  assert.match(
    second.out,
    /\[h3\] 127-quota-budgets-and-pause: a test proves B-9999, which does not exist/,
  );

  // 3. the same repository with the feature copied UNCHANGED passes, so the two
  //    failures are the edits and not the copy.
  const untouched = fakeRepository({ editedFeature: feature, edit: (text) => text });
  const third = runScript(untouched);
  assert.equal(third.code, 0, third.out);
});

test("CT-141-134 every `fixture:` names an active family of the catalogue", () => {
  const root = fakeRepository();
  // As the repository stands, every citation holds up.
  assert.equal(runScript(root).code, 0);
  // The catalogue it is checked against is real: 40 families, FX-37 retired.
  assert.equal(activeFamilies().length, 39);
  assert.equal(family("FX-37")?.status, "retired");

  // A declaration that names a family outside the catalogue fails check i, and
  // one that names the retired family fails it too. Both are shown through the
  // script's own reading of a `tasks.md`, in a fake specification tree.
  const specs = mkdtempSync(join(tmpdir(), "oracle-specs-"));
  for (const [name, citation, expected] of [
    ["FX-99", "FX-99", /does not hold/],
    ["FX-37", "FX-37", /is retired/],
  ] as const) {
    const feature = join(specs, "103-proposer-pass");
    mkdirSync(feature, { recursive: true });
    writeFileSync(
      join(feature, "tasks.md"),
      `- [ ] T001 Parity test PT-103-C-001-x in tests/parity/103/x.test.ts\n` +
        `  - fixture: ${citation}\n  - proves: C-001\n`,
      "utf8",
    );
    const result = spawnSync(
      "python3",
      [
        "-c",
        [
          "import importlib.util,sys",
          `spec=importlib.util.spec_from_file_location("ct",${JSON.stringify(join(REPOSITORY_ROOT, SCRIPT))})`,
          "m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)",
          `d=m.read_declarations(${JSON.stringify(feature)})`,
          "assert d, 'no declaration was read'",
          "m.check_fixture_citations('103-proposer-pass', d, m.fixture_catalogue())",
          "print('\\n'.join(m.errors)); sys.exit(1 if m.errors else 0)",
        ].join("\n"),
      ],
      { encoding: "utf8" },
    );
    assert.equal(result.status, 1, `${name}: ${result.stdout}${result.stderr}`);
    assert.match(result.stdout, expected);
    assert.match(result.stdout, /PT-103-C-001-x/);
  }
});

test("CT-141-134 claims pass where a map exists, and a failing claim exits non-zero", () => {
  const needed = linesNeededBy(["FX-01", "FX-02"]);
  assert.ok(needed.length > 20, `only ${needed.length} lines needed`);

  // A map in which FX-01/three-phases executed every line the claims that name
  // FX-01 or FX-02 need: every decided claim passes and the script exits 0.
  const passing = fakeRepository();
  writeFileSync(
    join(passing, "packages", "oracle", "exercise-map", "exercise-map.json"),
    mapOf("FX-01/three-phases", needed),
    "utf8",
  );
  const ok = runScript(passing);
  assert.equal(ok.code, 0, ok.out);
  const decided = /claim check: (\d+) claim\(s\) decided/.exec(ok.out);
  assert.ok(decided !== null, ok.out);
  assert.ok(Number(decided[1]) > 100, `only ${decided[1] as string} claims were decided`);
  assert.doesNotMatch(ok.out, /no exercise map has been captured/);

  // Take ONE line out of the same map — the evidence line of B-0248, which
  // PT-100-C-013-run-id claims — and the script fails, names the test and the
  // item, and exits non-zero.
  const evidence = `${resolveComponentPlaceholders("<component:engine>", "specstride")}:487`;
  assert.ok(needed.includes(evidence), "the evidence line of B-0248 is not among the lines needed");
  const failing = fakeRepository();
  writeFileSync(
    join(failing, "packages", "oracle", "exercise-map", "exercise-map.json"),
    mapOf(
      "FX-01/three-phases",
      needed.filter((line) => line !== evidence),
    ),
    "utf8",
  );
  const bad = runScript(failing);
  assert.equal(bad.code, 1, bad.out);
  assert.match(bad.out, /FAILED: \d+ error\(s\)/);
  assert.match(bad.out, /\[j\] PT-100-C-013-run-id claims the item B-0248/);
  assert.ok(bad.out.includes(evidence), `the message does not name ${evidence}`);
  assert.match(bad.out, /FX-01\/three-phases/);
});

test("CT-141-134 the two changes T086 asked for that were already in the script", () => {
  const text = spawnSync(
    "python3",
    ["-c", `print(open(${JSON.stringify(join(REPOSITORY_ROOT, SCRIPT))}).read())`],
    {
      encoding: "utf8",
    },
  ).stdout;
  // check g accepts the families FX-38 to FX-40 that feature 141 added.
  assert.match(text, /if not 1 <= int\(family\) <= 40:/);
  assert.match(text, /FX-38 to FX-40 were added by feature 141/);
  // check d reads the number of register rows OUT OF the register.
  assert.match(text, /n_register = max\(int\(dv\[3:\]\) for dv in dv_rows\)/);
  assert.doesNotMatch(text, /N_REGISTER = 117/);
  // And the register really holds more rows than the old constant expected, so
  // the change is what lets the script pass at all (quickstart.md scenario 15).
  const { out } = runScript(REPOSITORY_ROOT);
  const rows = /register rows cited: \d+ of (\d+)/.exec(out);
  assert.ok(rows !== null, out);
  assert.ok(Number(rows[1]) >= 119, `the register holds ${rows[1] as string} rows`);
});
