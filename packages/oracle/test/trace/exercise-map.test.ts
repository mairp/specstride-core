/**
 * CT-141-131 — the exercise map (T076, T081, T082, T083; F141-FR-031).
 *
 * Two readings of the criterion, and both are decided against the live
 * baselines rather than against a recording:
 *
 * 1. **shell parts and Python parts of both baselines** — a run of
 *    `FX-01/three-phases` on the Specstride baseline at `9cab15d` is traced, and
 *    the trace holds the four shell parts the run reaches — the front door, the
 *    engine script, the pass-loop script and the shell library, each named here
 *    through the component-name table of feature 100 — and the Python modules
 *    under `lib/` it reaches. A run of `FX-32/greeting-ready` on the
 *    mixture-of-loops baseline at `9c88f86` is traced, and the trace holds the
 *    Python parts under `skills/mixture-of-loops/scripts/`. The shell part of the
 *    mixture-of-loops baseline is `bin/onboard-skill` — the only bash file of
 *    that tree — and it is traced directly, because the one family that drove it
 *    (FX-37, onboarding) is retired and no scenario reaches it;
 * 2. **a capture with tracing equals one without** — the same scenario is driven
 *    twice, once with the overlay of `installTracers` and once without, and the
 *    NORMALIZED captures are compared surface by surface. They must be equal: the
 *    trace goes to a descriptor of its own, so nothing of it reaches `stdout` or
 *    `stderr`; it is written outside the working directory, so nothing of it
 *    reaches `tree` or `state`; and the variables that switch it on are left out
 *    of a transcript, so nothing of it reaches `transcript` either.
 *
 * **Status of the criterion** (`tasks.md` T076): it was `unverified for the
 * Python parts until the capture job has run with tracing`. This test is that
 * run: `sitecustomize.py` is installed on `PYTHONPATH`, the live interpreters of
 * both baselines import it, and the modules they executed are asserted by name.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { normalize } from "../../src/normalize/index.ts";
import { readPins } from "../../src/reference/pins.ts";
import { driveSide, resolveComponentPlaceholders } from "../../src/run/driver.ts";
import { componentFiles } from "../../src/normalize/text.ts";
import { contextOfRun } from "../../src/run/self.ts";
import { ORACLE_ROOT } from "../../src/index.ts";
import {
  ExerciseMapError,
  assertValidExerciseMap,
  buildExerciseMap,
  didExecute,
  familyOfScenario,
  fromRanges,
  installTracers,
  partsOfTrace,
  readExerciseMap,
  readTrace,
  scenariosThatExecuted,
  sizeOfScenario,
  toRanges,
  writeExerciseMap,
} from "../../src/trace/map.ts";
import {
  SHELL_TRACE_MARKER,
  UNTRACED_FORMS as SHELL_UNTRACED,
  parseShellTrace,
  shellTracerText,
} from "../../src/trace/shell.ts";
import {
  PythonTraceError,
  UNTRACED_FORMS as PYTHON_UNTRACED,
  assertNoInterpreterFlagThatSkipsSite,
  parsePythonTrace,
  pythonTracerText,
} from "../../src/trace/python.ts";
import { declarationOf, referenceTreeOf, skipReasonFor } from "../reference-tree.ts";

const FIXTURES = join(ORACLE_ROOT, "fixtures");

/**
 * The file of the reference tree one LOGICAL component name of feature 100,
 * annex X §X.8 stands for. The names of the baseline are never written out in a
 * file of a package (F100-FR-026): the table is the single copy, and the driver
 * resolves a `<component:…>` of a scenario through the same one.
 */
function componentFile(logical: string, system: string): string {
  return resolveComponentPlaceholders(`<component:${logical}>`, system);
}

/** The shell parts of the Specstride baseline that a run of the front door reaches. */
function shellPartsOfTheSpecstrideBaseline(): readonly string[] {
  const front = componentFile("front-door", "specstride");
  return [
    front,
    componentFile("engine", "specstride"),
    componentFile("pass-loop", "specstride"),
    `${front}-lib.sh`,
  ];
}

/** Drive one scenario on its baseline, with and without the tracers. */
function driveTwice(
  fixtureDir: string,
  referenceRoot: string,
): {
  readonly plain: ReturnType<typeof normalize>;
  readonly traced: ReturnType<typeof normalize>;
  readonly trace: ReturnType<typeof readTrace>;
} {
  const declaration = declarationOf(fixtureDir) as Record<string, string> & {
    environment?: Record<string, string>;
  };
  const id = declaration["id"] as string;
  const slug = declaration.environment?.["SPECSTRIDE_FEATURE"] ?? "001-greeting";
  const run = (overlay?: Readonly<Record<string, string>>): ReturnType<typeof normalize> => {
    const result = driveSide({
      scenario: id,
      side: "reference",
      fixtureDir,
      runRoot: mkdtempSync(join(tmpdir(), "oracle-trace-run-")),
      fixture: declaration as never,
      implementationRoot: referenceRoot,
      criticStubAddress: "http://127.0.0.1:1",
      slug,
      ...(declaration["variant"] === "@engine-stub" ? { engineStub: "specstride" } : {}),
      ...(overlay === undefined ? {} : { traceOverlay: overlay }),
    });
    return normalize(
      result.capture,
      contextOfRun(result, { referenceRoot, slug, fixture: id }, declaration as never),
    );
  };
  const plain = run();
  const tracers = installTracers({ traceDir: mkdtempSync(join(tmpdir(), "oracle-tracedir-")) });
  const traced = run(tracers.env);
  return { plain, traced, trace: readTrace(tracers.traceDir, referenceRoot) };
}

test("CT-141-131 the Specstride baseline is traced in its shell parts and its Python parts", (t) => {
  const tree = referenceTreeOf("specstride");
  if (tree === undefined) {
    t.skip(skipReasonFor("specstride"));
    return;
  }
  const { trace } = driveTwice(join(FIXTURES, "FX-01", "three-phases"), tree.root);
  const parts = partsOfTrace(trace);
  // The shell parts: the front door, the engine, the pass loop and the library.
  for (const file of shellPartsOfTheSpecstrideBaseline()) {
    assert.ok(
      parts.shell.includes(file),
      `the shell trace has no ${file}: ${parts.shell.join(", ")}`,
    );
  }
  // The Python parts: the modules of `lib/` the run reached.
  assert.ok(parts.python.length >= 5, `too few Python parts: ${parts.python.join(", ")}`);
  for (const file of [componentFile("critic", "specstride"), componentFile("spec", "specstride")]) {
    assert.ok(parts.python.includes(file), `the Python trace has no ${file}`);
  }
  for (const file of parts.python) assert.match(file, /^lib\/.*\.py$/);
  // The lines are real line numbers of the files they name.
  for (const [file, lines] of [...trace.shell, ...trace.python]) {
    const count = readFileSync(join(tree.root, file), "utf8").split("\n").length;
    for (const line of lines)
      assert.ok(line >= 1 && line <= count, `${file}:${line} is past the file`);
  }
  // And the trace is substantial: a run of three phases is thousands of lines.
  let total = 0;
  for (const lines of [...trace.shell.values(), ...trace.python.values()]) total += lines.size;
  assert.ok(total > 500, `only ${total} lines traced`);
});

test("CT-141-131 a capture of the Specstride baseline with tracing equals one without", (t) => {
  const tree = referenceTreeOf("specstride");
  if (tree === undefined) {
    t.skip(skipReasonFor("specstride"));
    return;
  }
  const { plain, traced } = driveTwice(join(FIXTURES, "FX-01", "three-phases"), tree.root);
  assert.deepEqual(Object.keys(traced.surfaces).sort(), Object.keys(plain.surfaces).sort());
  for (const surface of Object.keys(plain.surfaces).sort()) {
    assert.deepEqual(
      traced.surfaces[surface as keyof typeof traced.surfaces],
      plain.surfaces[surface as keyof typeof plain.surfaces],
      `the surface ${surface} differs between a traced and an untraced capture`,
    );
  }
  // Nothing of the tracer is in any compared surface, by its own name either.
  const text = JSON.stringify(traced.surfaces);
  for (const name of ["ORACLE_TRACE_DIR", "BASH_ENV", "PYTHONPATH", SHELL_TRACE_MARKER]) {
    assert.ok(!text.includes(name), `the surfaces name ${name}`);
  }
});

test("CT-141-131 the mixture-of-loops baseline is traced in its Python parts", (t) => {
  const tree = referenceTreeOf("mixture-of-loops");
  if (tree === undefined) {
    t.skip(skipReasonFor("mixture-of-loops"));
    return;
  }
  const { plain, traced, trace } = driveTwice(join(FIXTURES, "FX-32", "greeting-ready"), tree.root);
  const parts = partsOfTrace(trace);
  assert.ok(
    parts.python.includes(componentFile("contract-derive", "mixture-of-loops")),
    `the Python trace has no derivation tool: ${parts.python.join(", ")}`,
  );
  // And the library the derivation tool reads, which is a located file of the
  // pipeline-runtime component of the same baseline.
  const library = componentFiles()
    .filter((row) => row.system === "mixture-of-loops")
    .flatMap((row) => row.files)
    .filter((file) => file.includes("/") && parts.python.includes(file));
  assert.ok(library.length >= 1, `no located Python part was traced: ${parts.python.join(", ")}`);
  for (const file of parts.python)
    assert.match(file, /^skills\/mixture-of-loops\/scripts\/.*\.py$/);
  let total = 0;
  for (const lines of trace.python.values()) total += lines.size;
  assert.ok(total > 100, `only ${total} lines traced`);
  // And the same capture with and without tracing, on this baseline too.
  for (const surface of Object.keys(plain.surfaces).sort()) {
    assert.deepEqual(
      traced.surfaces[surface as keyof typeof traced.surfaces],
      plain.surfaces[surface as keyof typeof plain.surfaces],
      `the surface ${surface} differs between a traced and an untraced capture`,
    );
  }
});

test("CT-141-131 the shell part of the mixture-of-loops baseline is traced", (t) => {
  const tree = referenceTreeOf("mixture-of-loops");
  if (tree === undefined) {
    t.skip(skipReasonFor("mixture-of-loops"));
    return;
  }
  // `bin/onboard-skill` is the ONE bash file of that tree, and the family that
  // drove it (FX-37, onboarding) is retired: no scenario reaches it, so the
  // tracer is shown to reach the shell part of this baseline directly.
  const bash = readdirSync(join(tree.root, "bin"));
  assert.ok(bash.includes("onboard-skill"));
  const traceDir = mkdtempSync(join(tmpdir(), "oracle-mol-shell-"));
  const tracers = installTracers({ traceDir });
  const result = spawnSync(join(tree.root, "bin", "onboard-skill"), ["--help"], {
    env: { PATH: "/usr/bin:/bin", ...tracers.env },
    encoding: "utf8",
  });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage: onboard-skill/);
  // Nothing of the trace reached either output channel.
  assert.ok(!result.stdout.includes(SHELL_TRACE_MARKER));
  assert.equal(result.stderr, "");
  const trace = readTrace(traceDir, tree.root);
  const lines = trace.shell.get("bin/onboard-skill");
  assert.ok(lines !== undefined && lines.size > 3, "the shell part was not traced");
  assert.equal(
    didExecute(
      buildExerciseMap({
        pins: readPins(),
        traces: [
          {
            scenario: "FX-37/none",
            system: "mixture-of-loops",
            shell: trace.shell,
            python: new Map(),
          },
        ],
      }),
      "FX-37/none",
      `bin/onboard-skill:${[...lines][0] as number}`,
    ),
    true,
  );
});

test("CT-141-131 the tracers are the instrument and name their own limits", (t) => {
  // The shell tracer sends xtrace to a descriptor of its own and sets PS4 itself,
  // because bash 5.2 resets PS4 from the environment.
  const text = shellTracerText();
  assert.match(text, /BASH_XTRACEFD=/);
  assert.match(text, /PS4='\+@ss-trace@ \$\{BASH_SOURCE\}:\$\{LINENO\} @ss-trace@/);
  assert.match(text, /set -x/);
  // The Python tracer is a sitecustomize, installs both tracers and flushes at exit.
  const python = pythonTracerText();
  assert.match(python, /sys\.settrace/);
  assert.match(python, /threading\.settrace/);
  assert.match(python, /atexit\.register/);
  assert.match(python, /ORACLE_TRACE_DIR/);
  // Both record what they do not reach, rather than leaving it unsaid.
  assert.ok(SHELL_UNTRACED.some((form) => form.includes("bash -c")));
  assert.ok(PYTHON_UNTRACED.some((form) => form.includes("python3 -S")));
  // And an interpreter that would skip `site` fails the capture job.
  assert.throws(
    () =>
      assertNoInterpreterFlagThatSkipsSite([
        { path: componentFile("engine", "specstride"), text: "x=1\npython3 -S a-module.py\n" },
      ]),
    PythonTraceError,
  );
  const tree = referenceTreeOf("specstride");
  if (tree === undefined) {
    t.skip(skipReasonFor("specstride"));
    return;
  }
  // The baselines themselves start no interpreter in such a form.
  const shellFiles = shellPartsOfTheSpecstrideBaseline().map((path) => ({
    path,
    text: readFileSync(join(tree.root, path), "utf8"),
  }));
  assert.doesNotThrow(() => assertNoInterpreterFlagThatSkipsSite(shellFiles));
});

test("CT-141-131 the map is ranges, is validated against its schema, and needs its pins", () => {
  assert.deepEqual(toRanges([3, 1, 2, 7, 8, 20, 20]), [
    [1, 3],
    [7, 8],
    [20, 20],
  ]);
  assert.deepEqual(
    [
      ...fromRanges([
        [1, 3],
        [7, 8],
      ]),
    ],
    [1, 2, 3, 7, 8],
  );
  const map = buildExerciseMap({
    pins: readPins(),
    traces: [
      {
        scenario: "FX-01/three-phases",
        system: "specstride",
        shell: new Map([["proposer.sh", new Set([10, 11, 12, 40])]]),
        python: new Map([["lib/critic.py", new Set([5])]]),
      },
    ],
  });
  assert.deepEqual(map.scenarios["FX-01/three-phases"], {
    "lib/critic.py": [[5, 5]],
    "proposer.sh": [
      [10, 12],
      [40, 40],
    ],
  });
  assert.deepEqual(sizeOfScenario(map, "FX-01/three-phases"), { files: 2, lines: 5 });
  assert.equal(familyOfScenario("FX-01/three-phases"), "FX-01");
  assert.deepEqual(scenariosThatExecuted(map, "proposer.sh:11"), ["FX-01/three-phases"]);
  assert.deepEqual(scenariosThatExecuted(map, "proposer.sh:13"), []);
  assert.doesNotThrow(() => assertValidExerciseMap(map));

  // A scenario of a system the pins do not name is refused.
  assert.throws(
    () =>
      buildExerciseMap({
        pins: readPins().filter((p) => p.system !== "specstride"),
        traces: [
          {
            scenario: "FX-01/three-phases",
            system: "specstride",
            shell: new Map(),
            python: new Map(),
          },
        ],
      }),
    ExerciseMapError,
  );
  // And a map the schema refuses is never written.
  assert.throws(
    () => assertValidExerciseMap({ schema: "wrong", pins: {}, scenarios: {} }),
    ExerciseMapError,
  );
  const file = join(mkdtempSync(join(tmpdir(), "oracle-map-")), "exercise-map.json");
  writeExerciseMap(map, file);
  assert.deepEqual(readExerciseMap(file), map);
});

test("CT-141-131 the readers keep to the reference tree and to real line numbers", () => {
  const root = "/tmp/oracle-fake-reference";
  const shell = parseShellTrace(
    [
      `+${SHELL_TRACE_MARKER} ${root}/proposer.sh:42 ${SHELL_TRACE_MARKER}`,
      "echo hello",
      `++${SHELL_TRACE_MARKER} ${root}/proposer.sh:43 ${SHELL_TRACE_MARKER}`,
      `+${SHELL_TRACE_MARKER} /usr/bin/something-of-the-machine:1 ${SHELL_TRACE_MARKER}`,
      `+${SHELL_TRACE_MARKER} ${root}/lib/x.sh:0 ${SHELL_TRACE_MARKER}`,
      "a line with no marker at all",
    ].join("\n"),
    root,
  );
  assert.deepEqual([...shell.keys()], ["proposer.sh"]);
  assert.deepEqual([...(shell.get("proposer.sh") as ReadonlySet<number>)], [42, 43]);
  const python = parsePythonTrace(
    [`${root}/lib/critic.py:17`, `${root}/lib/critic.py:0`, "/usr/lib/python3/site.py:9", ""].join(
      "\n",
    ),
    root,
  );
  assert.deepEqual([...python.keys()], ["lib/critic.py"]);
  assert.deepEqual([...(python.get("lib/critic.py") as ReadonlySet<number>)], [17]);
});
