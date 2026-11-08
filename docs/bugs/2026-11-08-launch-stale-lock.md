# Bug: `launch` refuses with `already-running` because of a stale lock it cannot tell from a live one

- **Found:** 2026-11-08, launching feature `121-dsh-kanban` in `specstride-dsh` through the Claude Code plugin
  (`specstride-run` skill → shim → CLI protocol 1).
- **Severity:** blocker. The launch cannot proceed, and the product offers no way out: the suggested next step
  watches nothing, and no command clears a stale lock.
- **Component:** `packages/cli/src/commands/launch.ts` (the launch-check context) and
  `packages/pipeline/src/launch-checks/checks.ts` (check 6, `run-directory-free`).
- **Requirements touched:** F123-FR-021 (the six launch checks), F123-FR-022 (a held lock **attaches**),
  EP-13 (the lock provider).

## Symptom

```
$ specstride launch --mode run --comment "…"
[SPECSTRIDE-REFUSE] action=launch reason=already-running next="another launch owns this run; `specstride wait` watches it"
exit=24
```

Nothing was running in the workspace:

- `.specstride/lock` was a **file** of 50 bytes,
  `20261106-232038-3905018 2026-11-06T23:20:38+04:00`, written by the **bash orchestrator**
  (`/root/specstride/orchestrator.sh`) for run `20261106-232038-3905018` of feature `120-host-dsh`.
- That run had finished two days earlier: its `run.log` ends with
  `# DONE — all 9 phase(s) approved. 2026-11-07T01:21:48+04:00`, and no process held the lock.
- `specstride wait --until-change` (the suggested next step) printed nothing: there was no run to watch.
- `launch --mode dry-run` passed every check (it does not run check 6), so the dry run said "go" while the real
  launch said "already running".

The launch went through only after the lock was moved aside by hand
(`mv .specstride/lock .specstride/backups/…`). The new run then created its own lock, a **directory** holding
`lease.json` and `owner.json`, and started normally.

## Root cause

`launch.ts` builds the launch-check context with:

```ts
// packages/cli/src/commands/launch.ts:386
lockHeld: existsSync(join(controlRoot, "lock")),
```

and check 6 refuses on that boolean alone:

```ts
// packages/pipeline/src/launch-checks/checks.ts:318
export function checkRunDirectoryFree(ctx: LaunchCheckContext): LaunchCheckOutcome {
  if (ctx.lockHeld) {
    return { order: 6, name: "run-directory-free", status: "fail", reason: "already-running" };
  }
  …
}
```

So **any** path named `lock` under the control plane counts as a live run: a file or a directory, ours or
another engine's, live or dead, two seconds old or two days old.

This contradicts the module's own contract (`checks.ts`, header comment):

> The check `run-directory-free` reads the workspace lock through the lock provider of EP-13; a held lock gives
> the decision `attach` (F123-FR-022).

Three gaps between the specification and the code:

1. **It does not read through the lock provider.** The EP-13 provider (`packages/pipeline/src/entry/lock.ts`)
   writes an owner record with the `pid` and a lease. The launch check never reads either, so it cannot tell a
   live owner from a dead one, or our lock format (a directory with `lease.json` + `owner.json`) from a
   foreign one (the bash orchestrator's single-line file).
2. **It never attaches.** F123-FR-022 says a held lock gives the decision `attach`. The CLI instead prints a
   refusal and exits 24 (`launch.ts:389-404`); no code path attaches to the run that holds the lock.
3. **The next step is wrong when the lock is stale.** `next="… specstride wait watches it"` sends the user to
   watch a run that does not exist; `wait` prints nothing forever.

There is also a **shared control plane with no ownership rule**: the bash orchestrator and the TypeScript engine
both use `<repo>/.specstride/` and both name their lock `lock`, in two incompatible formats. A repository that
moves from the old orchestrator to the plugin (exactly `specstride-dsh`, which ran 120 on the orchestrator and
121 on the plugin) is blocked by default.

## Reproduction

```bash
# in any repository with a promoted, rendered launch contract
mkdir -p .specstride
printf '20261106-232038-3905018 2026-11-06T23:20:38+04:00\n' > .specstride/lock   # a stale foreign lock
specstride launch --mode dry-run   # passes every check
specstride launch --mode run       # [SPECSTRIDE-REFUSE] … reason=already-running … exit 24
specstride wait --until-change     # prints nothing: there is no run
```

## Expected behaviour

- A lock whose owner is **alive** (our format, the `pid` in `owner.json` is running and the lease is current):
  the decision is `attach`, as F123-FR-022 says. The CLI prints the `attached` outcome and the run it attached to.
- A lock whose owner is **dead**, or whose lease has expired: the lock is reported as **stale**, with its owner
  and age, and either reclaimed by the provider's own stale-lease rule or refused with a precise fix.
- A lock in a **foreign format** (the bash orchestrator's file): refused with a reason that names it, for
  example `reason=foreign-lock owner=orchestrator run=20261106-232038-3905018 age=2d`, and a `next=` that says how
  to clear it safely. Never `already-running`.
- `launch --mode dry-run` evaluates check 6 the same way, so a dry run that passes means the launch passes.

## Suggested fix

1. Build `lockHeld` from the lock provider of EP-13, not from `existsSync`: read `owner.json` and `lease.json`,
   check `pid` liveness (`process.kill(pid, 0)`) and lease expiry, and return
   `{ state: "held" | "stale" | "foreign" | "free", owner?, age? }`.
2. In check 6: `held` → decision `attach`, and implement the attach path in `launch.ts`. `stale` → reclaim through
   the provider, or refuse with `reason=stale-lock`. `foreign` → refuse with `reason=foreign-lock`.
   Either new reason needs a row in the closed set of launch-check refusals (annex X §X.6, row 13).
3. Add a safe recovery command (for example `specstride unlock --stale`) that only removes a lock whose owner is
   provably dead, and moves it to `.specstride/backups/` instead of deleting it.
4. Run check 6 in `launch --mode dry-run` too.
5. Tests: a live lock attaches; a lock with a dead `pid` is stale; the orchestrator's one-line file is foreign; a
   dry run and a run agree on all three.

## Other defects found in the same launch

Each of these stopped the same launch before the lock did. The first six are fixed in this working tree
(uncommitted, typechecked, suites not yet run); the rest are open.

| # | Where | Defect | State |
|---|---|---|---|
| 1 | `pipeline/src/contract/inventory/features.ts` `countingPhaseNumberOf` | `## Phase 3: User Story 1 — …` rejected because the **title** holds an em-dash; every Spec Kit story phase loses its phase, and its tasks fall into the classify-obligation exchange | fixed: the colon form always counts |
| 2 | `pipeline/src/contract/draft/complete.ts` (coverage) | classify answers keyed by item anchor (`OBL-…`) but looked up by `entry.source.anchor` (`T012`): answers never apply; `mapped` left `unresolved`, `optional` became `unsupported`; 72 validation errors after a "completed" exchange | fixed |
| 3 | `pipeline/src/contract/validate/rules.ts` `resolveContractPath` | `holdsLogicalName` given the filled name `pipeline:<id>:contract` instead of the masked template; the fallback evidence of a feature with no declared commands always fails | fixed |
| 4 | `pipeline/src/contract/draft/complete.ts` (preconditions) | directory prerequisites (`src/`) written as `file_exists`, which the strict rule refuses | fixed: `dir_exists` for a trailing `/` |
| 5 | `cli/src/commands/launch.ts` (dry-run branch) | `contractFile: deps.dryRunInput?.contractFile ?? ""`: a real dry run always refuses `no-contract` | fixed: the newest pipeline contract, as in mode `run` |
| 6 | `pipeline/src/entry/start.ts` (launcher `--dry-run`) | raw contract stages cast to `Stage[]`, so conditions have no `params`; every preflight check fails with `Cannot read properties of undefined (reading 'path')` while the dry run exits 0 | fixed: same `target` → `path` mapping as `pipeline-main.ts` `conditionOf` |
| 7 | judgment exchange | `mapped` on an **absent** prerequisite writes a preflight `file_exists` check that fails at launch; the choices do not say so | open |
| 8 | judgment exchange | prerequisite ids restart per source file: three different prerequisites shared `JT-settle-prerequisite-pre-1`, so one answer had to cover all three | open |
| 9 | prerequisite extraction | most of the 50 items were fragments of task prose (`.ts`, `JSON.stringify`, `Math.random`, a regex, `card.lane`) | open |
| 10 | declared-command extraction | the only "command" found was the directory tree of `plan.md:87`; the contract has `commands=0` with `verification=required` | open |
| 11 | `contract validate` | strict and requires the status `validated`, which only `promote` writes: "validate, then promote" always refuses at the first step | open |
| 12 | `status` | `status --feature 121-dsh-kanban` sees only the orchestrator's feature directories, not the TypeScript pipeline's runs | open |
| 13 | `wait --until-change` | printed nothing for 120 s across a phase approval and a phase rejection of the live run | open |
| 14 | parallel layer | `loop.parallel.units: true` silently has no effect: the layer is off because the adapter is `declared`, not `tested`; one log line says so | open |

The installed plugin bundle (`specstride-claude`, core pinned at `59c7898b`) carries none of the fixes above. They
reach a run only through `SPECSTRIDE_BIN` pointing at this tree, until core is committed, re-pinned and the plugin
rebuilt.
