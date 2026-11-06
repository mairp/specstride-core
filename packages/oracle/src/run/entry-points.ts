/**
 * T157 — the entry points of FX-40 beyond the front door (F141-FR-014).
 *
 * FX-40 "MUST run the front door on a pseudo-terminal, and MUST drive the
 * presenter, the banner and the theme tool where the front door does not reach
 * a behaviour". A scenario names one of the three in
 * `fixture.json` → `entryPoint.reference`, and the DRIVER of one side resolves
 * that name into the argv of the reference tree, gives the run the size of the
 * pseudo-terminal as the fixture states it (`pseudoTerminalSize`), and feeds the
 * answer to the background query (`backgroundQuery`) into the terminal, because
 * the theme tool asks the device for the background colour with OSC 11 and the
 * answer is data of the scenario, never of the host.
 *
 * Everything here is DATA of the fixture plus the file layout of the reference
 * tree at the pinned commit (`lib/banner.py`, `lib/present.py`, `lib/theme.py`
 * at `9cab15d`). Nothing here is read from the machine: the background query
 * answer comes from the fixture, the terminal size comes from the fixture, and
 * the interpreter is the one the reference tier already declares as a
 * prerequisite (`python3`).
 *
 * status: unverified on macOS (T132 carries the same note for the device
 * itself); `openpty` and `TIOCSCTTY` are POSIX and present on Darwin, but no
 * run of this module on macOS is recorded — the per-OS expectations of
 * F141-FR-035 carry the row.
 */
import { join } from "node:path";

/** The three entry points of FX-40 the front door does not reach. */
export const FX40_ENTRY_POINTS = ["presenter", "banner", "theme"] as const;
export type Fx40EntryPoint = (typeof FX40_ENTRY_POINTS)[number];

/** The file of the reference tree each entry point is, at the pinned commit. */
export const ENTRY_POINT_FILES: Readonly<Record<Fx40EntryPoint, string>> = Object.freeze({
  banner: "lib/banner.py",
  presenter: "lib/present.py",
  theme: "lib/theme.py",
});

/** Whether a name is one of the three entry points of FX-40. */
export function isFx40EntryPoint(name: string | undefined): name is Fx40EntryPoint {
  return (FX40_ENTRY_POINTS as readonly string[]).includes(name ?? "");
}

/** The file of the reference tree an entry point names, as `<IMPL>` resolves it. */
export function entryPointFile(entryPoint: Fx40EntryPoint): string {
  return ENTRY_POINT_FILES[entryPoint];
}

/**
 * The argv of the entry point: the interpreter, the file of the tree, and the
 * arguments the fixture states in `entryPointArguments.reference` (the flags
 * that pick the behaviour the scenario proves — `--color=always`, `--mode
 * card`, `bg` for the theme tool). A fixture may also write the whole argv in
 * `command.reference`; this builder is what the driver uses when it does not,
 * so a scenario names the ENTRY POINT and its ARGUMENTS, never a path of the
 * tree.
 */
export function entryPointArgv(
  entryPoint: Fx40EntryPoint,
  implementationRoot: string,
  fixtureArguments: readonly string[] = [],
): string[] {
  return ["python3", join(implementationRoot, entryPointFile(entryPoint)), ...fixtureArguments];
}

/**
 * The answer to the background query, as DATA of the fixture: what the theme
 * tool reads back when it asks the device for the background colour with
 * OSC 11 (`lib/theme.py`, `detect_bg` at `9cab15d`). `backgroundQuery` holds
 * the literal reply bytes; a fixture that names no answer gives the run none,
 * which is the `background-query` scenario's "or does not answer".
 */
export function backgroundQueryAnswer(
  fixture: Readonly<Record<string, unknown>>,
): string | undefined {
  const declared = fixture["backgroundQuery"];
  if (typeof declared !== "string" || declared === "") return undefined;
  return declared;
}

/**
 * The declared size of the terminal, read for the driver: `pseudoTerminalSize`
 * with `columns` and `rows`, each falling back to the fixed default of
 * `src/run/pty.ts` when the fixture names none. The same reading
 * `terminalSizeOf` of `src/run/driver.ts` does; it lives here so the entry
 * point, the size and the query answer are ONE module the driver reads.
 */
export function declaredTerminalSize(fixture: Readonly<Record<string, unknown>>): {
  columns?: number;
  rows?: number;
} {
  const declared = fixture["pseudoTerminalSize"] as Record<string, unknown> | undefined;
  if (declared === undefined) return {};
  const out: { columns?: number; rows?: number } = {};
  for (const key of ["columns", "rows"] as const) {
    const parsed = Number(declared[key]);
    if (declared[key] !== undefined && Number.isFinite(parsed) && parsed > 0) {
      out[key] = Math.trunc(parsed);
    }
  }
  return out;
}

/**
 * The argv of one step of one side, resolved: a fixture whose entry point is
 * one of the three of FX-40 and that writes no `command` of its own gets the
 * argv built from the entry point and `entryPointArguments`; every other
 * fixture keeps the command it declared, unchanged.
 */
/**
 * The argv of one step of one side, resolved: a fixture whose entry point is
 * one of the three of FX-40 and that writes no `command` of its own gets the
 * argv built from the entry point and `entryPointArguments`; every other
 * fixture keeps the command it declared, unchanged. A STEP may name its own
 * entry point (`entryPoint`, `entryPointArguments` on the step), which is how
 * the scenarios that drive the banner AND the presenter in one run
 * (`colour-depth-16` and its siblings) name each side of the pair.
 */
export function resolveStepArgv(
  fixture: Readonly<Record<string, unknown>>,
  side: "reference" | "port",
  implementationRoot: string,
  declared: readonly string[] | undefined,
  step: Readonly<Record<string, unknown>> = {},
): readonly string[] | undefined {
  if (declared !== undefined && declared.length > 0) return declared;
  const stepArguments = step["entryPointArguments"] as Record<string, string[]> | undefined;
  const namedStep = step["entryPoint"] as string | undefined;
  const entryPoints =
    namedStep === undefined
      ? (fixture["entryPoint"] as Record<string, string> | undefined)
      : { reference: namedStep, port: namedStep };
  const named = entryPoints?.[side];
  if (!isFx40EntryPoint(named)) return declared;
  const allArguments =
    stepArguments ?? (fixture["entryPointArguments"] as Record<string, string[]> | undefined);
  return entryPointArgv(named, implementationRoot, allArguments?.[side] ?? []);
}
