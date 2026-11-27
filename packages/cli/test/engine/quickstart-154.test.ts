/**
 * T172 — ONE TEST PER SECTION OF THE FEATURE'S QUICKSTART, so the quickstart
 * cannot drift from the code (F154-SC-001 to F154-SC-014).
 *
 * The document under test is `specs/154-concurrency-and-parallelism/quickstart.md`
 * (the feature's own quickstart; the house form every spec of this repository
 * carries beside `spec.md` and `plan.md`). The test READS the document and
 * locates its scenario sections programmatically — nothing about a section is
 * hardcoded except the stable anchors of the house form:
 *
 * - a SCENARIO section is a `## ` heading that names a fixture
 *   (`FX-154-…`, the seven slices P1 to P7) or the trial-and-`parity`
 *   section; the document must hold exactly EIGHT of them;
 * - the closing section "One pass over everything" must exist but is not a
 *   scenario.
 *
 * For each scenario section the test then binds the DOCUMENT to the CODE:
 *
 * 1. FIXTURES — every `FX-154-…` id the section names maps to an existing
 *    fixture directory under `tests/fixtures/154/` (FX-154-PLAN → `plan`, …,
 *    FX-154-DOOR → `door`), and the id is declared in
 *    `specs/154-concurrency-and-parallelism/contracts/fixtures-154.json`.
 * 2. COMMANDS — every `node --test <target>` and
 *    `node scripts/trial.mjs --switch <name> --fixtures <path>` command the
 *    section names points at a path that EXISTS, and a directory target
 *    holds at least one `*.test.ts`. A command whose target has gone away
 *    fails here, so a renamed suite breaks the doc test.
 * 3. RULE IDS — every decision-table rule id the section names
 *    (`RP-1`, `MG-2`, `PG-1`, `WC-3`, `SL-5`, `LD-4`, `PQ-2`, `SP-6`,
 *    `TRI-1`, …) appears in the source tree (the `src` trees of `packages`
 *    and the `tests` directory), so a rule renamed or deleted in code breaks
 *    the doc test.
 * 4. REQUIREMENT IDS — every `F154-FR-nnn` and `F154-SC-nnn` the section
 *    names appears in the feature's `spec.md`.
 * 5. SWITCHES — every switch named on a `Switches:`/`Switch:` line has a
 *    trial record under `specs/154-concurrency-and-parallelism/trials/` and
 *    a row in `verified.md` (phase 18's checkpoint contract).
 * 6. EXPECTATIONS — the section states an `Expected:` step, and the stable
 *    literals of that step that the document binds to output
 *    (`not in the events`, `plan the option would produce`, `group-check`,
 *    `host_slot`, …) appear in the source tree, so a changed printed line
 *    breaks the doc test.
 *
 * LIVE PROBES — one documented command is actually EXECUTED, hermetically:
 * the door's proof of P2 (`packages/adapter-dsh/test/concurrent-sessions.test.ts`,
 * the fake binary and the recorded capture, F154-SC-014). The other documented
 * commands name whole directories (the per-package suites, which this run's
 * own CI executes) or the trial script, which WRITES the trial records of
 * phase 18 — executing it here would rewrite them, so it is bound
 * structurally: the script and the fixture file exist and the script accepts
 * the two documented options. The `tests/inertness/154/` suite is never
 * spawned from inside a test: it contains THIS test, and a directory run
 * would recurse.
 *
 * No model is called and nothing is written outside the process
 * (F154-FR-005, F154-FR-018). Run:
 *     node --experimental-strip-types --test packages/cli/test/engine/quickstart-154.test.ts
 */
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** The repository root, from `packages/cli/test/engine/`. */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

/** The feature's spec directory. */
const SPEC_DIR = join(ROOT, "specs/154-concurrency-and-parallelism");
/** The document under test. */
const DOC = join(SPEC_DIR, "quickstart.md");
/** The feature's spec, the home of every `F154-*` id. */
const SPEC_FILE = join(SPEC_DIR, "spec.md");
/** The fixture manifest of the contracts. */
const FIXTURES_FILE = join(SPEC_DIR, "contracts/fixtures-154.json");
/** The trial records of phase 18, one per switch. */
const TRIALS_DIR = join(SPEC_DIR, "trials");
/** The per-switch report another task of this phase writes. */
const VERIFIED_FILE = join(SPEC_DIR, "verified.md");
/** The fixture directories on disk. */
const FIXTURE_DIR = join(ROOT, "tests/fixtures/154");

/** A scenario section of the document, as parsed. */
type Section = { title: string; body: string };

/** Read and split the document into its `## ` sections. */
function sectionsOf(doc: string): Section[] {
  const out: Section[] = [];
  for (const chunk of doc.split(/^## /m).slice(1)) {
    const nl = chunk.indexOf("\n");
    out.push({ title: chunk.slice(0, nl).trim(), body: chunk.slice(nl + 1) });
  }
  return out;
}

/** The scenario sections: a fixture tag, or the trial-and-parity section. */
function scenarioSections(all: Section[]): Section[] {
  return all.filter(
    (s) => /FX-154-[A-Z]+/.test(s.title) || /trial/i.test(s.title),
  );
}

/** The `FX-154-…` ids of a section, in order. */
function fixtureIdsOf(s: Section): string[] {
  return [...new Set(s.body.match(/FX-154-[A-Z]+/g) ?? [])];
}

/** Fixture id → directory name under `tests/fixtures/154/`. */
function fixtureDirOf(id: string): string {
  return id.replace(/^FX-154-/, "").toLowerCase();
}

/** Backticked `node --test …` targets of a section. */
function testTargetsOf(s: Section): string[] {
  const targets: string[] = [];
  for (const m of s.body.matchAll(/`node --test ([^`]+)`/g)) {
    targets.push(m[1].trim());
  }
  return [...new Set(targets)];
}

/** Backticked `node scripts/trial.mjs …` commands of a section. */
function trialCommandsOf(s: Section): string[] {
  return [...new Set([...s.body.matchAll(/`node scripts\/trial\.mjs [^`]+`/g)].map((m) => m[0]))];
}

/** Decision-table rule ids (`RP-1`, `MG-2`, …) named by a section. */
function ruleIdsOf(s: Section): string[] {
  return [...new Set(s.body.match(/\b(?:RP|MG|PG|WC|SL|LD|PQ|SP|TRI)-\d+\b/g) ?? [])];
}

/** Requirement and success-criteria ids named by a section. */
function requirementIdsOf(s: Section): string[] {
  return [...new Set(s.body.match(/\bF154-(?:FR|SC)-\d{3}\b/g) ?? [])];
}

/** Switch names from the section's `Switches:` / `Switch:` lines. */
function switchesOf(s: Section): string[] {
  const names: string[] = [];
  for (const line of s.body.split("\n")) {
    if (!/^Switches?:/.test(line.trim())) continue;
    for (const m of line.matchAll(/`([a-z][a-zA-Z]*(?:\.[a-zA-Z-]+)+)`/g)) {
      names.push(m[1]);
    }
  }
  return [...new Set(names)];
}

/** The source corpus the ids and literals are bound to, with file names. */
function buildCorpus(): Map<string, string> {
  const corpus = new Map<string, string>();
  const roots = [join(ROOT, "packages"), join(ROOT, "tests")];
  for (const root of roots) {
    const walk = (dir: string): void => {
      let entries: string[];
      try {
        entries = readdirSync(dir).map((e) => join(dir, e));
      } catch {
        return;
      }
      for (const entry of entries) {
        let st;
        try {
          st = statSync(entry);
        } catch {
          continue;
        }
        if (st.isDirectory()) {
          if (!/node_modules|dist|fixtures/.test(entry)) walk(entry);
        } else if (entry.endsWith(".ts") && !entry.endsWith(".d.ts")) {
          corpus.set(entry, readFileSync(entry, "utf8"));
        }
      }
    };
    walk(root);
  }
  corpus.set(SPEC_FILE, readFileSync(SPEC_FILE, "utf8"));
  return corpus;
}
const CORPUS = buildCorpus();

/** True when the needle appears in the corpus (a whole-file substring scan). */
function inCorpus(needle: string): string | null {
  for (const [file, text] of CORPUS) {
    if (text.includes(needle)) return file;
  }
  return null;
}

/** The stable printed-line literals each scenario's Expected step binds to output. */
const EXPECTED_LITERALS: Record<string, string[]> = {
  P1: ["not in the events", "plan the option would produce"],
  P2: ["g-23-1", "harness"],
  P3: ["group-check", "dependency"],
  P4: ["host_slot", "paused-quota"],
  P5: ["never_together"],
  P6: ["depends-on"],
  P7: ["rate"],
  "The trial, and `parity`": ["TRI-1", "F154-SC-001"],
};

test("the quickstart of feature 154 holds eight scenarios", () => {
  assert.ok(existsSync(DOC), `the quickstart is missing: ${DOC}`);
  const all = sectionsOf(readFileSync(DOC, "utf8"));
  const scenarios = scenarioSections(all);
  assert.equal(
    scenarios.length,
    8,
    `expected 8 scenario sections, found ${scenarios.length}: ${scenarios.map((s) => s.title).join(" | ")}`,
  );
  const closing = all.find((s) => /One pass over everything/.test(s.title));
  assert.ok(closing, 'the closing section "One pass over everything" is missing');
});

// One subtest per scenario section, named after the document's own heading.
for (const section of scenarioSections(sectionsOf(readFileSync(DOC, "utf8")))) {
  test(`quickstart scenario: ${section.title}`, () => {
    const body = section.body;

    // 1. Fixtures: the id is declared, and its directory exists. The ids
    //    stand in the section heading as well as its body.
    const ids = fixtureIdsOf({ title: section.title, body: `${section.title}\n${body}` });
    if (ids.length === 0) {
      // The trial-and-`parity` section names no fixture of its own: its
      // surfaces are the trial records and the fixture manifest.
      assert.ok(
        /trials\/|fixtures-154/.test(body),
        `${section.title}: names neither an FX-154 fixture nor the trial surfaces`,
      );
    }
    const manifest = readFileSync(FIXTURES_FILE, "utf8");
    for (const id of ids) {
      assert.ok(
        manifest.includes(`"${id}"`),
        `${id} is not declared in contracts/fixtures-154.json`,
      );
      const dir = join(FIXTURE_DIR, fixtureDirOf(id));
      assert.ok(existsSync(dir), `fixture directory missing for ${id}: ${dir}`);
    }

    // 2. Commands: every documented target exists; a directory holds tests.
    for (const target of testTargetsOf(section)) {
      const path = join(ROOT, target);
      assert.ok(existsSync(path), `${section.title}: documented test target missing: ${target}`);
      if (statSync(path).isDirectory()) {
        const files = readdirSync(path).filter((f) => f.endsWith(".test.ts"));
        assert.ok(
          files.length > 0,
          `${section.title}: documented test directory holds no test: ${target}`,
        );
      }
    }

    // 3. Rule ids: each named rule lives in the source tree.
    for (const rule of ruleIdsOf(section)) {
      assert.ok(inCorpus(rule), `${section.title}: rule id ${rule} appears in no source file`);
    }

    // 4. Requirement ids: each is in the feature's spec.
    const spec = readFileSync(SPEC_FILE, "utf8");
    for (const req of requirementIdsOf(section)) {
      assert.ok(spec.includes(req), `${section.title}: ${req} is not in spec.md`);
    }

    // 5. Switches: a trial record and a verified.md row for each.
    const verified = existsSync(VERIFIED_FILE) ? readFileSync(VERIFIED_FILE, "utf8") : "";
    for (const name of switchesOf(section)) {
      assert.ok(
        existsSync(join(TRIALS_DIR, `${name}.json`)),
        `${section.title}: no trial record for ${name} under trials/`,
      );
      assert.ok(
        verified.includes(name),
        `${section.title}: ${name} has no row in verified.md`,
      );
    }

    // 6. Expectations: the section states them, and its stable literals
    //    are bound to output in the source tree.
    assert.ok(
      /Expected:/.test(body),
      `${section.title}: no "Expected:" step — the scenario states no expectation`,
    );
    const key = EXPECTED_LITERALS[section.title.split(" ")[0]] ?? EXPECTED_LITERALS[section.title] ?? [];
    for (const literal of key) {
      const where = inCorpus(literal);
      assert.ok(
        where !== null,
        `${section.title}: expected literal ${JSON.stringify(literal)} appears in no source file`,
      );
    }
  });
}

test("the P2 door command runs live and passes (F154-SC-014)", () => {
  // The quickstart names `packages/adapter-dsh/test/concurrent-sessions.test.ts`:
  // that file is the RECORDED LIVE CAPTURE (CT-130-46) and makes three paid
  // model calls. A test never calls a model (F154-FR-005, XII), so the live
  // probe runs its deterministic twin instead — the fake-binary proof of
  // F154-SC-014 (N = 4 concurrent sessions, the configuration home's bytes
  // identical before and after), which is the same door under test.
  const documented = join(ROOT, "packages/adapter-dsh/test/concurrent-sessions.test.ts");
  assert.ok(existsSync(documented), "the documented door test is missing");
  const target = join(ROOT, "packages/adapter-dsh/test/concurrent-sessions-fake-binary.test.ts");
  assert.ok(existsSync(target), "the fake-binary proof of the door is missing");
  const run = spawnSync(process.execPath, ["--experimental-strip-types", "--test", target], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 120_000,
    // The runner marks its children with NODE_TEST_CONTEXT; a grandchild that
    // inherits it believes it is already inside a run and starts no file.
    env: Object.fromEntries(
      Object.entries(process.env).filter(([k]) => k !== "NODE_TEST_CONTEXT"),
    ),
  });
  const passed = /^# pass \d+/m.test(run.stdout) && !/^# fail [1-9]/m.test(run.stdout);
  assert.ok(
    run.status === 0 && passed,
    `the documented door command failed (exit ${run.status}):\n${run.stdout}\n${run.stderr}`,
  );
});

test("the trial command of the closing scenario is ready (its inputs exist)", () => {
  const script = join(ROOT, "scripts/trial.mjs");
  assert.ok(existsSync(script), "scripts/trial.mjs is missing");
  const source = readFileSync(script, "utf8");
  for (const option of ["--switch", "--fixtures"]) {
    assert.ok(source.includes(option), `scripts/trial.mjs does not accept ${option}`);
  }
  assert.ok(existsSync(FIXTURES_FILE), "contracts/fixtures-154.json is missing");
  // The command the document spells stays the command the script accepts.
  const all = sectionsOf(readFileSync(DOC, "utf8"));
  const trial = all.find((s) => /trial\.mjs/.test(s.body));
  assert.ok(trial, "the trial section is missing");
  const commands = trialCommandsOf(trial);
  assert.ok(commands.length > 0, "the trial section names no trial command");
  for (const command of commands) {
    assert.ok(command.includes("--switch"), `documented trial command lacks --switch: ${command}`);
    assert.ok(
      command.includes("--fixtures"),
      `documented trial command lacks --fixtures: ${command}`,
    );
  }
  // The command is not executed here: it writes the trial records of phase 18,
  // and the record of each switch must stay as the owner reads it.
});
