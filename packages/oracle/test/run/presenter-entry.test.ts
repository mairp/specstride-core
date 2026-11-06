/**
 * CT-141-148 — the entry points of FX-40 beyond the front door (T152, T157;
 * F141-FR-014).
 *
 * > "The presenter, the banner and the theme tool are driven as entry points
 * > of FX-40 where the front door does not reach a behaviour; the
 * > pseudo-terminal has the size the fixture names and answers the background
 * > query from the fixture."
 *
 * What the test proves. A scenario of FX-40 names one of the three in
 * `fixture.json` → `entryPoint.reference`, and the driver resolves that name
 * into the argv of the reference tree (`src/run/entry-points.ts`), gives the
 * run the size of the pseudo-terminal as the fixture states it, and feeds the
 * answer of the background query into the terminal.
 *
 * - **driven as entry points**: the three names resolve to the three files of
 *   the pinned reference tree (`lib/present.py`, `lib/banner.py`,
 *   `lib/theme.py`), the argv is the interpreter, the file and the arguments
 *   the fixture states, and a fixture that declares a `command` of its own
 *   keeps it — the entry point is used where the fixture does not write the
 *   argv itself;
 * - **where the front door does not reach a behaviour**: the scenarios that
 *   name the three are on disk, one per behaviour — the banner alone, the
 *   theme tool alone, the presenter alone, and the pairs that drive the banner
 *   AND the presenter in one run (`colour-depth-16` and its siblings); each
 *   names its entry point per side, and every entry-point name a scenario of
 *   FX-40 writes is one of the three — a name of a tool the family does not
 *   drive is refused by the same predicate the driver applies;
 * - **the pseudo-terminal has the size the fixture names**: the columns and
 *   the rows a fixture declares under `pseudoTerminalSize` are what the driver
 *   reads (`declaredTerminalSize`), each falling back to the fixed default of
 *   `src/run/pty.ts` where the fixture names none;
 * - **answers the background query from the fixture**: the reply bytes the
 *   theme tool reads back come from `backgroundQuery` of the fixture and from
 *   nothing else — a fixture that names an answer gives the run that answer,
 *   and one that names none gives the run none;
 * - **live**: the reference is driven again for `FX-40/background-query` — the
 *   theme tool asks the device for the background colour with OSC 11 and the
 *   run answers it from the fixture — and its fresh capture is held against
 *   the committed one. Where no clone of the baseline is found this half is a
 *   SKIP WITH ITS REASON and never a pass.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { TERMINAL_COLUMNS, TERMINAL_ROWS } from "../../src/run/pty.ts";
import {
  ENTRY_POINT_FILES,
  FX40_ENTRY_POINTS,
  backgroundQueryAnswer,
  declaredTerminalSize,
  entryPointArgv,
  entryPointFile,
  isFx40EntryPoint,
  resolveStepArgv,
} from "../../src/run/entry-points.ts";
import {
  freshCaptureOfTheReference,
  isSkipped,
  type FreshCaptureOptions,
} from "../../src/golden/capture-job.ts";
import { readGoldenCapture } from "../../src/golden/store.ts";
import { cloneOf, pinOf, skipReasonFor } from "../reference-tree.ts";

const PACKAGE = resolve(dirname(dirname(dirname(fileURLToPath(import.meta.url)))));
const clone = cloneOf("specstride");
const pin = pinOf("specstride");

const FX40 = join(PACKAGE, "fixtures", "FX-40");

/** The fixture declaration of one scenario of FX-40. */
function declarationOf(scenario: string): FreshCaptureOptions["declaration"] {
  return JSON.parse(
    readFileSync(join(FX40, scenario, "fixture.json"), "utf8"),
  ) as FreshCaptureOptions["declaration"];
}

/** Every scenario of FX-40 on disk. */
function scenariosOfFx40(): readonly string[] {
  return readdirSync(FX40).filter((name) => {
    try {
      return (
        statSync(join(FX40, name)).isDirectory() && existsSync(join(FX40, name, "fixture.json"))
      );
    } catch {
      return false;
    }
  });
}

// ---------------------------------------------------------------------------
// 1. driven as entry points
// ---------------------------------------------------------------------------

test("CT-141-148: the three entry points are the three files of the reference tree", (t) => {
  assert.deepEqual([...FX40_ENTRY_POINTS], ["presenter", "banner", "theme"]);
  assert.deepEqual(
    { ...ENTRY_POINT_FILES },
    {
      presenter: "lib/present.py",
      banner: "lib/banner.py",
      theme: "lib/theme.py",
    },
  );
  if (clone === undefined) {
    t.skip(
      `no clone of the specstride baseline: the files cannot be read (${skipReasonFor("specstride")})`,
    );
    return;
  }
  for (const entryPoint of FX40_ENTRY_POINTS) {
    assert.ok(
      existsSync(join(clone, entryPointFile(entryPoint))),
      `${entryPointFile(entryPoint)} is in the tree at ${pin.commit}`,
    );
  }
});

test("CT-141-148: the argv of an entry point is interpreter, file, and the fixture's arguments", () => {
  const argv = entryPointArgv("presenter", "/ref/root", ["--workdir", "<WORK>"]);
  assert.deepEqual([...argv], ["python3", "/ref/root/lib/present.py", "--workdir", "<WORK>"]);
  assert.deepEqual(
    [...entryPointArgv("theme", "/ref/root")],
    ["python3", "/ref/root/lib/theme.py"],
  );
});

test("CT-141-148: the driver resolves a step's argv through the entry point", () => {
  const fixture = declarationOf("timeline-narrow");
  const step = (fixture["steps"] as Record<string, unknown>[])[0] as Record<string, unknown>;
  // The step names its entry point; the driver builds the argv of the side.
  const reference = resolveStepArgv(fixture, "reference", "/ref/root", undefined, step);
  assert.deepEqual(
    [...(reference as string[])],
    ["python3", "/ref/root/lib/present.py", "--workdir", "<WORK>"],
  );
  // A step (or a fixture) that declares the whole command keeps it unchanged.
  const declared = ["/bin/sh", "card-run.sh"];
  assert.equal(resolveStepArgv(fixture, "reference", "/ref/root", declared, step), declared);
  // A fixture whose entry point is one of the three and whose step names none
  // takes the entry point of the fixture.
  const themeFixture = declarationOf("theme-usage");
  const themeArgv = resolveStepArgv(themeFixture, "reference", "/ref/root", undefined, {});
  assert.deepEqual(
    [...(themeArgv as string[])],
    ["python3", "/ref/root/lib/theme.py", "--no-such-flag"],
  );
  // A fixture whose entry point is the front door is no entry point of the
  // three: with no declared argv the driver builds none here (the front
  // door's own command is read where the driver assembles the run).
  const front = declarationOf("banner");
  assert.equal(resolveStepArgv(front, "reference", "/ref/root", undefined, {}), undefined);
});

// ---------------------------------------------------------------------------
// 2. where the front door does not reach a behaviour
// ---------------------------------------------------------------------------

test("CT-141-148: the scenarios that name the three entry points are on disk", () => {
  const byEntry: Record<string, number> = { presenter: 0, banner: 0, theme: 0 };
  for (const scenario of scenariosOfFx40()) {
    const fixture = declarationOf(scenario);
    const named = fixture["entryPoint"] as Record<string, string> | undefined;
    const entry = named?.reference;
    if (entry !== undefined && entry !== "front-door") {
      assert.ok(
        isFx40EntryPoint(entry),
        `${scenario}: the entry point ${entry} is one of the three`,
      );
      byEntry[entry] = (byEntry[entry] ?? 0) + 1;
    }
    for (const step of (fixture["steps"] as Record<string, unknown>[] | undefined) ?? []) {
      const stepEntry = step["entryPoint"] as string | undefined;
      if (stepEntry === undefined) continue;
      assert.ok(
        isFx40EntryPoint(stepEntry),
        `${scenario}: the step's entry point ${stepEntry} is one of the three`,
      );
      byEntry[stepEntry] = (byEntry[stepEntry] ?? 0) + 1;
    }
  }
  assert.ok(byEntry.banner >= 5, `${byEntry.banner} scenarios drive the banner`);
  assert.ok(byEntry.theme >= 2, `${byEntry.theme} scenarios drive the theme tool`);
  assert.ok(byEntry.presenter >= 5, `${byEntry.presenter} scenarios drive the presenter`);
  // And the front-door scenarios are still the front door, on a pty.
  const front = declarationOf("banner");
  assert.equal((front["entryPoint"] as Record<string, string>).reference, "front-door");
  assert.equal(front["pseudoTerminal"], true);
});

test("CT-141-148: an entry point the family does not drive is refused", () => {
  for (const name of [undefined, "front-door", "engine", "critic", "theme.py", ""]) {
    assert.equal(isFx40EntryPoint(name), false, `${String(name)}: not one of the three`);
  }
});

// ---------------------------------------------------------------------------
// 3. the pseudo-terminal has the size the fixture names
// ---------------------------------------------------------------------------

test("CT-141-148: the size of the terminal is the fixture's, or the fixed default", () => {
  assert.deepEqual(declaredTerminalSize(declarationOf("banner-width-line")), {
    columns: 30,
    rows: 12,
  });
  assert.deepEqual(declaredTerminalSize(declarationOf("timeline-narrow")), {
    columns: 36,
    rows: 12,
  });
  // A fixture that names no size falls back to the default of the pty module.
  assert.deepEqual(declaredTerminalSize(declarationOf("banner")), {});
  assert.deepEqual(declaredTerminalSize({}), {});
  assert.equal(TERMINAL_COLUMNS, 80);
  assert.equal(TERMINAL_ROWS, 24);
});

// ---------------------------------------------------------------------------
// 4. the background query is answered from the fixture
// ---------------------------------------------------------------------------

test("CT-141-148: the background query is answered from the fixture or not at all", () => {
  const answer = backgroundQueryAnswer(declarationOf("background-query"));
  assert.equal(answer, "\x1b]11;rgb:1c1c/1c1c/1c1c\x1b\\");
  // Every other scenario of the family gives the run no answer.
  for (const scenario of scenariosOfFx40()) {
    if (scenario === "background-query") continue;
    assert.equal(
      backgroundQueryAnswer(declarationOf(scenario)),
      undefined,
      `${scenario}: no background answer of its own`,
    );
  }
});

// ---------------------------------------------------------------------------
// 5. live: the theme tool over the pseudo-terminal, answered from the fixture
// ---------------------------------------------------------------------------

test(
  "CT-141-148: live — FX-40/background-query answers from the fixture",
  { skip: clone === undefined ? skipReasonFor("specstride") : false },
  () => {
    const fixtureId = "FX-40/background-query";
    const runRoot = mkdtempSync(join(tmpdir(), "fx40-theme-"));
    const fresh = freshCaptureOfTheReference({
      fixture: fixtureId,
      fixtureDir: join(FX40, "background-query"),
      declaration: declarationOf("background-query"),
      system: "specstride",
      commit: pin.commit,
      referenceRoot: clone,
      runRoot,
      criticStubAddress: "http://127.0.0.1:39999",
    });
    if (isSkipped(fresh)) assert.fail(fresh.skipped);
    // The fresh capture shows the behaviour the scenario proves: the theme
    // tool read the background colour the fixture answered with. The board
    // also repeats two lines of the HOST's configuration (the model the
    // ambient environment names, and the sandbox note the root user gets),
    // which are not part of what the scenario compares — the byte-for-byte
    // comparison of every surface is the capture job's, run in the isolated
    // runner where the host names no model. Here the two lines are set aside
    // and the rest of the board is held against the committed capture.
    const golden = readGoldenCapture(fixtureId);
    const shown = ((fresh.normalized.surfaces["stdout"] as { text?: string }).text ?? "")
      .split("\n")
      .map((line) => line.replace(/\s*\(model [^)]*window [0-9]+ tokens\)\s*$/, ""))
      .filter((line) => !/IS_SANDBOX/.test(line))
      .join("\n");
    const held = ((golden.surfaces["stdout"] as { text?: string }).text ?? "")
      .split("\n")
      .map((line) => line.replace(/\s*\(model [^)]*window [0-9]+ tokens\)\s*$/, ""))
      .filter((line) => !/IS_SANDBOX/.test(line))
      .join("\n");
    assert.equal(shown, held);
  },
);
