/**
 * T275 to T278 — the pure workspace-selection table (feature 153,
 * F153-FR-045 to F153-FR-047, US3 "checks run in parallel and in-pass
 * checks are scoped").
 *
 * With `verification.inner.scoped` on, an IN-PASS check may run a subset of
 * the inner check set: the declared commands whose workspace a changed file
 * belongs to, and the declared commands of every workspace that depends on
 * one of them by a reverse-dependency walk of the static package graph read
 * as data. Only declared fixed-argv commands are selected — no command is
 * ever synthesised from the graph (Principle XIV) — and every form of
 * uncertainty WIDENS to the full inner set, never narrows (F153-FR-046,
 * constitution grounding T-g). The verification gate of a phase is never
 * scoped (F153-FR-047, CQ-153-08 A): with `caller: "gate"` the choice is
 * always `full`.
 *
 * The decision is made by the rule table `workspace-selection`
 * (`specs/153-loop-feedback-speed/contracts/workspace-selection-table.json`,
 * task T267), never guessed at the call site: rows WS-1 to WS-7 of plan.md
 * ("Rule-id sets fixed by this plan"), in that order; the first row that
 * matches decides.
 *
 * ## The constant and the contract file are the same table
 *
 * The constant below and the contract file hold the same predicates in the
 * same shape — `{op, signal, value}` leaves and `{op, of}` combinators, the
 * form `loadTable` of `@specstride/kernel` reads. There is no translation
 * step, and the equality is asserted by a test
 * (`../test/ct-153-45-153.test.ts`, case "T267 the contract file is this
 * table"), which loads the contract file from the checkout and compares it
 * to the constant field by field; the test FAILS when the checkout carries
 * no contract file, so a green run proves the file exists and is equal.
 * The constant is validated once at module load through `loadTable`, so a
 * table that fails the load fails at load, never mid-run.
 *
 * ## What the table does not see
 *
 * The `parity` profile is folded into the switch before this module runs:
 * `loopConfigurationOf` reads `verification.inner.scoped` off under
 * `profile: parity`, so the parity branch of WS-1 of plan.md arrives here
 * as `switchOn: false` and the behaviour is exactly the pre-feature one —
 * the full inner set runs. The graph arrives as DATA taken at phase entry
 * (F153-FR-045): this module does no I/O and reads no file, so the caller
 * is free to have re-read the graph and to hand both hashes in; the table
 * decides WS-4 when they differ (or when either is unknown).
 */
import { evaluateTable, loadTable, type LoadedTable } from "@specstride/kernel";

/** One package of the static graph, as `specstride.package-graph/1` holds it. */
export type SelectionGraphPackage = {
  readonly name: string;
  readonly mayImport?: readonly string[];
};

/** The static package graph, read as data at phase entry (F153-FR-045). */
export type SelectionGraph = {
  readonly packages: readonly SelectionGraphPackage[];
};

/** One workspace of the run: its directory and the package name that lives there. */
export type SelectionWorkspace = {
  readonly dir: string;
  readonly name: string;
};

/** One declared command of the inner check set, by id and working directory. */
export type SelectionCommand = {
  readonly id: string;
  readonly cwd: string;
};

/**
 * What the caller gives the table: whether the switch is on (already
 * profile-folded — under `profile: parity` it reads off), who is asking
 * (the gate is never scoped, F153-FR-047), the graph and its hashes at
 * phase entry and now, the workspaces of the run, the changed paths, and
 * the declared commands of the inner set.
 */
export type SelectionInput = {
  readonly switchOn: boolean;
  readonly caller: "in-pass" | "gate";
  /** `undefined` when the graph cannot be read or fails its schema (WS-3). */
  readonly graph: SelectionGraph | undefined;
  readonly graphHashAtPhaseEntry: string | null;
  readonly graphHashNow: string | null;
  readonly workspaces: readonly SelectionWorkspace[];
  readonly changedPaths: readonly string[];
  readonly commands: readonly SelectionCommand[];
};

/** What the table decided: the choice, the rule that decided it, the ids. */
export type SelectionDecision = {
  /** `full` — every declared command of the inner set; `scoped` — the closure. */
  readonly choice: "full" | "scoped";
  /** The rule id of the row that fired. */
  readonly ruleId: string;
  /** The ids of the declared commands to run, in the order of `commands`. */
  readonly selectedCommandIds: readonly string[];
  /** The changed workspaces plus their dependents, sorted (scoped only). */
  readonly selectedWorkspaces: readonly string[];
  /** The id and version of the table that decided (F100-FR-204). */
  readonly tableId: string;
  readonly tableVersion: string;
};

/** The id of the table, recorded with every decision (F100-FR-204). */
export const WORKSPACE_SELECTION_TABLE_ID = "workspace-selection" as const;

/** The version of the table, recorded with every decision (F100-FR-204). */
export const WORKSPACE_SELECTION_TABLE_VERSION = "1.0.0" as const;

/** The one decision point of the table. */
export const WORKSPACE_SELECTION_POINT = "workspace-selection" as const;

/** The rule id of the row for a switch that is off, or parity (WS-1). */
export const WS_1 = "WS-1" as const;
/** The rule id of the row for the verification gate, which is never scoped (WS-2). */
export const WS_2 = "WS-2" as const;
/** The rule id of the row for a graph that cannot be read or fails its schema (WS-3). */
export const WS_3 = "WS-3" as const;
/** The rule id of the row for a graph that changed since phase entry (WS-4). */
export const WS_4 = "WS-4" as const;
/** The rule id of the row for a changed file under no workspace (WS-5). */
export const WS_5 = "WS-5" as const;
/** The rule id of the row for a declared command under no workspace (WS-6). */
export const WS_6 = "WS-6" as const;
/** The rule id of the default row: the reverse-dependency closure (WS-7). */
export const WS_7 = "WS-7" as const;

/** The rule ids of the table, in row order. */
export const WORKSPACE_SELECTION_RULES = Object.freeze([
  WS_1,
  WS_2,
  WS_3,
  WS_4,
  WS_5,
  WS_6,
  WS_7,
]);

/** A leaf or a combinator of a predicate, in the leaf form of annex X §X.3. */
export type WorkspaceSelectionPredicate = {
  readonly op: string;
  readonly signal?: string;
  readonly value?: unknown;
  readonly of?: readonly WorkspaceSelectionPredicate[];
};

/** One row of the table: the rule id, the predicate (absent in the default row), the choice. */
export type WorkspaceSelectionTableRow = {
  readonly ruleId: string;
  readonly when?: WorkspaceSelectionPredicate;
  readonly choice: string;
};

/** The table, in the shape `specstride.table/1` gives (annex X §X.3). */
export type WorkspaceSelectionTable = {
  readonly schema: string;
  readonly id: string;
  readonly version: string;
  readonly points: {
    readonly "workspace-selection": {
      readonly signals: Readonly<Record<string, string>>;
      readonly choices: readonly string[];
    };
  };
  readonly rows: {
    readonly "workspace-selection": readonly WorkspaceSelectionTableRow[];
  };
};

/** Freeze a value and everything it holds, so that no reader can change the table. */
function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  for (const key of Object.getOwnPropertyNames(value)) {
    deepFreeze((value as Record<string, unknown>)[key]);
  }
  return Object.freeze(value);
}

/**
 * The rule table of the in-pass workspace selection, frozen through and
 * through. Equal to
 * `specs/153-loop-feedback-speed/contracts/workspace-selection-table.json`,
 * with the leaf form of annex X §X.3 that the load check of the kernel reads.
 */
export const WORKSPACE_SELECTION_TABLE: WorkspaceSelectionTable = deepFreeze({
  schema: "specstride.table/1",
  id: WORKSPACE_SELECTION_TABLE_ID,
  version: WORKSPACE_SELECTION_TABLE_VERSION,
  points: {
    "workspace-selection": {
      signals: {
        switchOn: "boolean",
        callerIsGate: "boolean",
        graphUnreadable: "boolean",
        graphHashChanged: "boolean",
        changedPathUnmapped: "boolean",
        commandUnmapped: "boolean",
      },
      choices: ["full", "scoped"],
    },
  },
  rows: {
    "workspace-selection": [
      {
        // WS-1 — the switch is off: every command of the inner set runs,
        // exactly as F115-FR-013 has it. The `parity` profile arrives here
        // too, folded into the switch (module header).
        ruleId: WS_1,
        when: { op: "equal", signal: "switchOn", value: false },
        choice: "full",
      },
      {
        // WS-2 — the caller is the verification gate of the phase: the gate
        // is what approval rests on and is NEVER scoped (F153-FR-047,
        // CQ-153-08 A).
        ruleId: WS_2,
        when: { op: "equal", signal: "callerIsGate", value: true },
        choice: "full",
      },
      {
        // WS-3 — the graph cannot be read or fails its schema: uncertainty
        // widens the in-pass set (T-g) and never narrows it.
        ruleId: WS_3,
        when: { op: "equal", signal: "graphUnreadable", value: true },
        choice: "full",
      },
      {
        // WS-4 — the graph changed since phase entry: the entry-time data
        // no longer describes the tree, so the full set runs.
        ruleId: WS_4,
        when: { op: "equal", signal: "graphHashChanged", value: true },
        choice: "full",
      },
      {
        // WS-5 — a changed file maps to no workspace (a path under no
        // workspace directory, the `tools/` case): the full set runs.
        ruleId: WS_5,
        when: { op: "equal", signal: "changedPathUnmapped", value: true },
        choice: "full",
      },
      {
        // WS-6 — a declared command of the inner set maps to no workspace
        // (its `cwd` is under no workspace directory): the full set runs.
        ruleId: WS_6,
        when: { op: "equal", signal: "commandUnmapped", value: true },
        choice: "full",
      },
      // WS-7 — the default row (F100-FR-204): the declared commands of the
      // changed workspaces and of every workspace that depends on one of
      // them, in the order of `commands`.
      { ruleId: WS_7, choice: "scoped" },
    ],
  },
});

const LOADED: LoadedTable = loadTable(WORKSPACE_SELECTION_TABLE);

/**
 * The workspace of one path: the workspace whose `dir` is the longest
 * prefix of the path at a path boundary, or `undefined` when no workspace
 * holds it. A prefix matches only at a `/` boundary, so `pkgs/a` does not
 * hold `pkgs/ab/src/x.ts`. Pure: reads only its arguments.
 */
export function workspaceOfPath(
  path: string,
  workspaces: readonly SelectionWorkspace[],
): SelectionWorkspace | undefined {
  let best: SelectionWorkspace | undefined;
  for (const workspace of workspaces) {
    const dir = workspace.dir;
    if (dir === "" || dir.length > path.length) continue;
    if (!path.startsWith(dir)) continue;
    if (dir.length === path.length || path.charAt(dir.length) === "/") {
      if (best === undefined || dir.length > best.dir.length) best = workspace;
    }
  }
  return best;
}

/**
 * The names reached from `names` by following "is in the `mayImport` of" —
 * the reverse direction of the import edges — transitively, sorted. The
 * starting names are part of the answer. Pure: reads only its arguments.
 */
export function dependentsOf(
  names: readonly string[],
  graph: SelectionGraph | undefined,
): string[] {
  if (!graph) return [];
  const importedBy = new Map<string, Set<string>>();
  for (const pkg of graph.packages) {
    for (const target of pkg.mayImport ?? []) {
      let set = importedBy.get(target);
      if (!set) importedBy.set(target, (set = new Set<string>()));
      set.add(pkg.name);
    }
  }
  const reached = new Set<string>(names);
  const queue = [...names];
  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) break;
    for (const next of importedBy.get(current) ?? []) {
      if (!reached.has(next)) {
        reached.add(next);
        queue.push(next);
      }
    }
  }
  return [...reached].sort();
}

/**
 * The graph is usable only when it is held and every package of it is
 * schema-valid: a non-empty string name and, when held, string entries in
 * `mayImport`. `undefined` (unreadable) and anything invalid widen (WS-3).
 */
function graphUnreadable(graph: SelectionGraph | undefined): boolean {
  if (!graph || !Array.isArray(graph.packages)) return true;
  for (const pkg of graph.packages) {
    if (pkg === null || typeof pkg !== "object") return true;
    if (typeof pkg.name !== "string" || pkg.name === "") return true;
    if (pkg.mayImport !== undefined) {
      if (!Array.isArray(pkg.mayImport)) return true;
      for (const entry of pkg.mayImport) {
        if (typeof entry !== "string") return true;
      }
    }
  }
  return false;
}

/** Two hashes bind the same graph only when both are held and equal. */
function graphHashChanged(atEntry: string | null, now: string | null): boolean {
  return atEntry === null || now === null || atEntry !== now;
}

/**
 * The decision of the table at one in-pass check: rows WS-1 to WS-7, in
 * order, the first match decides, the default row scopes. When the choice
 * is `scoped`, the selected ids are those of the declared commands whose
 * workspace is a changed one or a dependent of one, in the order of
 * `commands`; when the choice is `full`, no selection is made and the
 * caller runs the whole inner set. Pure: no I/O, no clock, no randomness,
 * no model.
 */
export function selectionOf(input: SelectionInput): SelectionDecision {
  const unreadable = graphUnreadable(input.graph);
  const workspaces = input.workspaces;
  const changed = input.changedPaths.map((path) => workspaceOfPath(path, workspaces));
  const changedPathUnmapped = changed.some((workspace) => workspace === undefined);
  const commandUnmapped = input.commands.some(
    (command) => workspaceOfPath(command.cwd, workspaces) === undefined,
  );
  const decision = evaluateTable(LOADED, WORKSPACE_SELECTION_POINT, {
    switchOn: input.switchOn,
    callerIsGate: input.caller === "gate",
    graphUnreadable: unreadable,
    graphHashChanged: graphHashChanged(input.graphHashAtPhaseEntry, input.graphHashNow),
    changedPathUnmapped,
    commandUnmapped,
  });

  const fullIds = input.commands.map((command) => command.id);
  if (decision.choice !== "scoped") {
    return {
      choice: "full",
      ruleId: decision.ruleId,
      selectedCommandIds: fullIds,
      selectedWorkspaces: workspaces.map((workspace) => workspace.name).sort(),
      tableId: decision.tableId,
      tableVersion: decision.tableVersion,
    };
  }

  const changedNames = new Set<string>();
  for (const workspace of changed) {
    if (workspace !== undefined) changedNames.add(workspace.name);
  }
  const closure = dependentsOf([...changedNames], input.graph);
  const selected = new Set(closure);
  return {
    choice: "scoped",
    ruleId: decision.ruleId,
    selectedCommandIds: input.commands
      .filter((command) => {
        const workspace = workspaceOfPath(command.cwd, workspaces);
        return workspace !== undefined && selected.has(workspace.name);
      })
      .map((command) => command.id),
    selectedWorkspaces: closure,
    tableId: decision.tableId,
    tableVersion: decision.tableVersion,
  };
}
