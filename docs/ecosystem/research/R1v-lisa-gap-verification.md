# R1v — Lisa gap table verification

Verification date: 2026-09-29. Subject: `docs/ecosystem/research/R1-lisa-reuse-audit.md` (F-A "Which Lisa",
F-B2 "unwired packages", F-B extraction list, F-D gap table). The verifier saw only the finished report.

All `file:line` citations are relative to `/root/lisa/packages/` at local `main` `363e6a3`, unless tagged
`@76adfdc`. Every claim below is `verified-local` (read or grepped on this date) unless tagged otherwise.

## Method

1. Both trees were exported read-only into scratch with `git archive`:
   `363e6a3 packages` → `/tmp/specstride-research/R1v/main/`, `76adfdc packages/dashboard .github` →
   `/tmp/specstride-research/R1v/base/`. Nothing was checked out, fetched or written in `/root/lisa`,
   `/root/specstride` or `/root/mixture-of-loops`. Specstride was read with `git show 9cab15d:<path>`.
2. The as-is requirement text was read from `old/028-as-is-specstride/spec.md:109-167` and
   `old/011-as-is-mixture-of-loops/spec.md`.
3. 36 of the 57 cells were sampled: all 3 "yes", all 15 "partial" of 028 except 028 FR-030 (14), all 6
   "partial" of 011, and 13 "no" cells. For a "yes" or "partial" cell the cited lines were opened and
   compared with the requirement. For a "no" cell the capability was searched for over **all** packages
   (R1 sometimes searched a subset), non-test `.ts`/`.tsx`, plus `packages/dashboard` at `76adfdc`.
4. A cell fails when the code does not support the requirement to the stated degree. A cell whose
   verdict holds but whose evidence text is imprecise is recorded as "holds, note".
5. No Lisa test, build or lint was run. No paid model call was made.

## Sampled cells

### "yes" cells (3 of 3)

| Requirement | R1's cell | Cited evidence | What was found | Verdict |
|---|---|---|---|---|
| 028 FR-003 phase derived from markers | yes | `core/src/engine/phase-loop.ts:309-312`, `:337-340`; `core/src/gates/store.ts:156-161`; `cli/src/commands/run.ts:613-646` | `resumePhase()` returns `startPhase` when set, else `firstUnapproved` (`phase-loop.ts:309-312`); `firstUnapproved` walks markers on disk (`store.ts:156-161`); all approved returns exit 0 (`phase-loop.ts:337-340`); `--start-phase` is parsed (`run.ts:190-191`, passed at `:540`). Release verification runs only when the mode is `required` (`run.ts:613-618`). That condition is the same in Specstride (`orchestrator.sh:969@9cab15d`: `[[ "$VERIFICATION" == "required" ]] \|\| return 0`). | **holds** |
| 028 FR-005 per-call nonce, strict parse | yes | `core/src/critic/verdict.ts:40-42`, `:56-76` | `newNonce()` is `randomBytes(8).toString("hex")` (`verdict.ts:40-42`). `parseVerdict` builds a regex anchored on the escaped nonce, returns MALFORMED on zero matches (two distinct reasons) and on more than one match (`verdict.ts:56-76`). A new nonce is made per critic call (`phase-loop.ts:623`) and again for the repair call (`:694`). | **holds** |
| 028 FR-029 one owner of the spec grammar | yes | `specs/src/registry.ts:877-884`; `cli/src/commands/run.ts:384-390`; `phase-loop.ts:10-11` | The run path has one owner: `defaultRegistry()` (`registry.ts:877-884`), sole call `run.ts:386-387`; `@lisa/core` has no import of `@lisa/specs`. **But a second parser exists outside the owner:** `dashboard/src/run-tasks.ts:146` matches phase headings with its own regex and `:148` matches task checkboxes with its own regex; the file imports only `node:fs`, `node:path` and local types (`run-tasks.ts:1-3`) and is called by the served dashboard (`dashboard/src/server.ts:8`). The file is identical at `76adfdc`. 028 FR-029 says no other component keeps its own parser. | **fails → partial** |

### "partial" cells, 028 (14 of 15)

| Requirement | R1's cell | Cited evidence | What was found | Verdict |
|---|---|---|---|---|
| 028 FR-001 spec resolution | partial | `core/src/gates/features.ts:231-307`; `run.ts:331-346` | Order is explicit `-s`, `SPECS.md`, `.specify/feature.json`, `specs/*/tasks.md` (`features.ts:237-278`); several candidates are never auto-selected (`:289-294`); not found lists three locations (`:297-305`); exit 3 (`run.ts:336-346`). No `openspec` string in the file. | holds |
| 028 FR-002 format detection | partial | `specs/src/resolve.ts:45-71` | Override, then env, then filename, then content (`resolve.ts:51-71`); unknown override throws (`:58-60`); detectable set has three members, none OpenSpec (`:22`). Note: an explicit `openspec` override also throws here, although an `openspec` adapter is registered (`registry.ts:882`). | holds, note |
| 028 FR-004 one run per workdir | partial | `cli/src/layout.ts:141-171`; `run.ts:416-424` | Non-recursive `mkdirSync(lockDir)` (`layout.ts:149`); live owner gives `WorkspaceLockError` (`:156-158`); dead owner is reclaimed (`:160-162`); exit 5 (`run.ts:420-423`). `flock` appears only in a comment (`layout.ts:18`). | holds |
| 028 FR-006 marker and feedback | partial | `store.ts:124-129`; `phase-loop.ts:831-835`, `:772-789` | Empty marker (`store.ts:124-129`) written by the loop in `onApprove` (`phase-loop.ts:831-834`), only after `verifyPhase` passed (`:401-406`). No exit 10 in the exit table (`core/src/engine/lifecycle.ts:24-32`, codes 0 to 6). | holds |
| 028 FR-007 archive rejected attempt | partial | `store.ts:179-196` | Evidence moved, feedback copied, newest transcript copied (`store.ts:179-195`); directory name is `attempt<M>` with no suffix (`:180`); no hint or acceleration file is handled. | holds |
| 028 FR-008 `MAX_REJECTS`, exit 2 | partial | `phase-loop.ts:440-446`, `:967-974`; `run.ts:129` | Limit check (`phase-loop.ts:440-446`); exit `REJECTS` = 2 (`:967-974`, `lifecycle.ts:27`); default 3 (`run.ts:129`). The halt opens an approval request (`:927-966`) and emits no path list. | holds |
| 028 FR-014 git commit | partial | `phase-loop.ts:1198-1237`, `:840-842`; `run.ts:523` | `rev-parse`, `status --porcelain`, `add -A`, `commit` with prefix `lisa:` (`phase-loop.ts:1206-1232`); no `init` or `push`. Mode hard-coded `"auto"` (`run.ts:523`); grep for a flag or env that sets it finds none in `cli/src`. | holds |
| 028 FR-015 stop | partial | `phase-loop.ts:371`, `:482`, `:497`; `:853-857`; `scheduler/src/stop.ts:81-105`; `stop-now.ts:195-230` | Boundary checks at the cited lines; exit 6 and flag consumed (`phase-loop.ts:853-857`); `/proc`-only child walk returning `[]` elsewhere (`stop-now.ts:151-159`); the recorded pid is `process.pid` (`run.ts:691`). | holds |
| 028 FR-016 resume | partial | `cli/src/commands/resume.ts:128-209` | Refuses with `ExitCode.LOCK` only for a live owner (`resume.ts:148-152`); refuses a changed spec hash (`:175-180`); replays 11 values (`:186-196`), none of them critic timeout, wall budget or telemetry. | holds |
| 028 FR-017 watchdogs | partial | `agents/src/claude-agent-sdk/harness.ts:189-196`, `:46-55`; `phase-loop.ts:562-590` | Wall-clock timer (`harness.ts:189-196`); SDK idle timeout forced to `"0"` (`:46-55`); fingerprint repeat with threshold `max(2, …)` (`phase-loop.ts:479`, `:562-590`). Grep for an idle or disk-progress timeout in `agents`, `core/src/engine` and `run.ts` finds only the SDK variable. | holds |
| 028 FR-018 breakers | partial | `phase-loop.ts:859-867`, `:523-561` | Exit 4 for wall budget and max-iter (`:859-867`); one transient retry (`:523-549`); any other failure ends with `ExitCode.INTERNAL` = 1 (`:550-561`, `:869-876`). No error counter or cap counter. | holds |
| 028 FR-020 `--verification` | partial | `run.ts:875-882`, `:271-274`, `:135-137` | Three accepted values, usage error otherwise (`:875-882`), mapped to exit 3 (`:271-274`); default `"off"` (`:135-137`). | holds |
| 028 FR-021 one backend registry | partial | `agents/src/provider.ts:178-257`; `run.ts:661-669` | One `ProviderRegistry` with capability checks (`provider.ts:186-202`); five registrations (`run.ts:661-669`); the CLI harness chooses argv through a fixed `if` chain (`agents/src/openai-compat/completion.ts:210-229`). | holds |
| 028 FR-022 Loki and OTel off by default | partial | `otel/src/loki.ts:195-205`, `otel/src/otlp.ts:118` | No non-test file imports `@lisa/otel` (see the unwired re-check). `url` is required (`loki.ts:170-172`); no default endpoint constant exists (grep for `:3100` and `:4318` finds one comment). R1 omits one fact: the telemetry URL variables are read by `lisa doctor` for a reachability probe only (`cli/src/index.ts:228-230`, `cli/src/commands/doctor.ts:503-505`). That does not ship anything. | holds, note |
| 028 FR-023 front door | partial | `cli/src/index.ts:52-62`, `:88-139`, `:246-252` | Implemented routes: `run`/`start` (`:88`), `status`, `events` (`:116`), `stop` (`:122`), `resume` (`:136`). `watch`, `tail`, `verdicts`, `feedback`, `phases` fall to `verb_not_implemented` exit 1 (`:246-252`). No `learn` or `reverse` route in the file. | holds |

028 FR-030 was not sampled.

### "partial" cells, 011 (6 of 6)

| Requirement | R1's cell | Cited evidence | What was found | Verdict |
|---|---|---|---|---|
| 011 FR-001 source inventory with hashes | partial | `cli/src/commands/spec-import-project.ts:165-175`; `specs/src/bundle/hash.ts:11-29` | Each artifact is snapshotted with `expectedSha256` (`spec-import-project.ts:166-174`); `hash.ts` hashes canonical JSON only (`:11-29`). No line count, no checkbox-insensitive hash. | holds |
| 011 FR-005 reject open blockers | partial | `specs/src/speckit/project.ts:804-815` | `hasStrictTraceabilityFailure` fails on uncovered requirements and unlinked work items, and on six further conditions (`:804-815`). | holds |
| 011 FR-007 stale sources | partial | `resume.ts:175-180`; `run.ts:288-295` | Both refuse with `ExitCode.SPEC` = 3 (`resume.ts:175-180`, `run.ts:288-294`). No checkbox exemption in either path. | holds |
| 011 FR-009 content-addressed bundle directory | partial | `verification/src/store.ts:94-108`; `persistence/src/specification-bundle-store.ts:464-480` | The verification plan path contains the content hash (`store.ts:105-110`). The bundle directory is keyed by **bundle id**, not by hash (`specification-bundle-store.ts:474`), with the hash checked (`:465-472`) and overwrite refused (`:479-482`). R1's sentence "stored immutably under a content hash" is exact for plans and loose for bundles. | holds, note |
| 011 FR-012 run-directory lock | partial | `cli/src/layout.ts:141-171` | As 028 FR-004. Per workdir, exit 5. | holds |
| 011 FR-013 preflight | partial | `run.ts:448-455` | One check: `required` with ambiguities returns `verification_blocked`, exit 3 (`:448-455`). | holds |

### "no" cells (13)

| Requirement | R1's cell | R1's search | Verifier's search over all packages | Verdict |
|---|---|---|---|---|
| 028 FR-009 oscillation | no | `oscillat` | No match anywhere. | holds |
| 028 FR-010 MALFORMED limit | no | `malformed.?limit\|critic_unavailable` | No match, also none for `consecutive.?malformed`. Contrary behaviour confirmed: an unrepaired MALFORMED halts (`phase-loop.ts:736-748`) with `ExitCode.REJECTS` (`:903-914`). | holds |
| 028 FR-011 diagnostician | no | `--diagnose\|diagnosed-phase\|HINT.md` | `diagnos` matches `core/src/domain/escalation.ts` (post-exhaustion text) and unrelated files; no per-rejection diagnosis. | holds |
| 028 FR-012 accelerator | no | `accelerat` in four packages | Widened to all packages: three hits, all the word "accelerating" as an activity trend label (`dashboard/src/intelligence.ts:166`, `:169`, `dashboard/src/types.ts:212`). Unrelated. | holds |
| 028 FR-013 tick checkboxes | no | `tick` in three files | No writer of checkboxes anywhere. `taskChecklist` (`run.ts:543`) only changes prompt wording (`phase-loop.ts:1020-1036`). | holds |
| 028 FR-019 yield | no | `pass-yield\|YIELD_` | All `yield` hits are the JavaScript keyword (for example `harness.ts:122`). | holds |
| 028 FR-024 learn knobs | no | `yield_poll_interval\|applied.json` | No match. | holds |
| 028 FR-025 reverse naming | no | `as-is-` in `specs/src/reverse` | No match in any package. | holds |
| 028 FR-028 overlay | no | `overlay` in two packages | Widened: hits in `server/src/api.ts`, `cli/src/commands/serve*.ts`, `dashboard/src/App.tsx` mean a service overlay or a UI overlay. No config-home overlay. | holds |
| 011 FR-011 `--dry-run` | no | `dry-run\|dryRun` in `run.ts` | One hit in a comment about `git merge-tree` (`scheduler/src/worktrees.ts:172`). No run flag. | holds |
| 011 FR-014 stages and `state.json` | no | none stated | No match for `state\.json`. | holds |
| 011 FR-015 in-stage retry | no | `retry_exit_codes\|retryExitCodes` | No match. | holds |
| 011 FR-020 detached launch | no | cites `dashboard/src/server.ts:767-770@76adfdc`, `:691-694@363e6a3` | `detached: false` at `server.ts:770@76adfdc` and `:694@363e6a3`; no other `detached` anywhere. | holds |

## Which-Lisa re-check

Command: `git -C /root/lisa diff --stat 76adfdc 363e6a3 -- packages/` → `65 files changed, 4111 insertions(+),
10026 deletions(-)`.

| R1 claim | Result | Evidence |
|---|---|---|
| A1: merge base `6dc2970`, 88 and 76 commits apart | confirmed | `git merge-base` → `6dc29708…`; `git rev-list --left-right --count 76adfdc...363e6a3` → `88 76` |
| A3: 65 paths, 40 deleted, 24 modified, 1 added | confirmed | `git diff --name-status … -- packages` counted: `1 A`, `40 D`, `24 M` |
| A3: 36 of them in `packages/dashboard` (29 D, 6 M, 1 A) | confirmed | same command limited to `packages/dashboard` |
| A3: outside dashboard, 18 `package.json` modifications and 11 deletions (9 `demo-*.mjs`, 2 probe scripts) | confirmed | the 29 paths were listed; `--stat` outside dashboard: `29 files changed, 18 insertions(+), 3159 deletions(-)`, that is one inserted line per `package.json` |
| A3: no `.ts`/`.tsx` outside dashboard differs | confirmed | filtering the name list for `\.(ts\|tsx)$` outside dashboard returns nothing |
| 19 packages | confirmed | `ls packages \| wc -l` → 19 |
| A4: dashboard is newer on `76adfdc` | confirmed | `git log 76adfdc -- packages/dashboard` shows `152eef2`, `28a247a`, `03b8ed0` on top of `bd0634e`; `main` stops at the twin of `bd0634e` (`6d2228d`) plus the licence commit. `App.tsx` is 1139 lines on `main`, 247 on `76adfdc`. `trajectory.ts` does not exist on `main`. |
| A5: commit dates | confirmed | `76adfdc` 2026-09-28 00:20:25 +0400; `363e6a3` 2026-09-27 22:19:19 +0400 |
| A7: CI only on `76adfdc` | confirmed | `.github/workflows/ci.yml` present at `76adfdc`; `git ls-tree -r 363e6a3` has no `.github` path |

One addition to R1: the dashboard `package.json` also gains the licence line on `main`, so the dashboard
difference is not purely "`76adfdc` newer"; the licence field must be carried over by hand when the
dashboard is taken from `76adfdc`. R1's ruling table already implies this.

**The "Which Lisa" finding stands in full.**

## Unwired-packages re-check

Search: for each package, every non-test `.ts`, `.tsx`, `.mjs`, `.js`, `.cjs` file under `packages/` outside the
package itself, for a static import, a dynamic `import()` or a `require()` of `@lisa/<p>` or a subpath;
plus relative imports that cross a package boundary; plus symbol names in `cli`, `core/src/engine`,
`agents`, `rpc`, `server`, `verification`.

| Package or module | Importers found | Result |
|---|---|---|
| `otel` | none. Only a dev dependency of `sdk` (`sdk/package.json:26`). | confirmed unwired |
| `web` | none | confirmed unwired |
| `memory` | none | confirmed unwired |
| `plugins` | none. Only a dependency of `testkit` (`testkit/package.json:23`). | confirmed unwired |
| `hooks` | none | confirmed unwired |
| scheduler `queue.ts` | `workflow/src/engine.ts:30-31` imports `JobQueue`; `workflow` itself has no importer. | confirmed unwired in a run |
| scheduler `cron`, `safety`, `worktrees`, `integration`, `budgets` | no symbol use in `cli`, `server`, `rpc` | confirmed unwired |
| `core/critic/ensemble.ts` | `runEnsemble` not referenced in `cli`, `server`, `rpc` | confirmed |

No cross-package relative import exists. Symbol grep for `LokiForwarder`, `otlp`, `Tracer`, `traceparent`,
`runEnsemble`, `HookRunner`, `MemoryStore`, `PluginRegistry`, `admitBatch`, `evaluateBudgets`, `JobQueue`,
`WorktreeManager` in the run path returns nothing relevant.

Two corrections of detail, neither changes the finding:

1. R1 writes that `cli` imports "only `PassRegistry` and `StopController`" from the scheduler. It also
   imports `stopNow` and `ProcessControls` (`cli/src/interrupts.ts:32-35`) and `hasLiveInFlightPass`
   (`cli/src/commands/serve-services.ts:42`). All come from `stop.ts` and `stop-now.ts`, the two modules R1
   marks as wired.
2. `server` has no static importer but is loaded at run time by `lisa serve --port` through a computed
   specifier (`cli/src/commands/serve.ts:174-183`). R1's package table says so; its B2 sentence lists
   `server` among packages with "no non-test importer" without that qualifier.

**The unwired finding stands.**

## Extraction spot-checks

| Item on the extract list | Imports | Separable? |
|---|---|---|
| `core/critic/verdict.ts` (332 lines) with `core/critic/grounding.ts` (761 lines) | `verdict.ts`: `node:crypto`, `./grounding.js`, and one **type-only** import, `VerdictResult`, from `../domain/index.js` (`verdict.ts:22-23`). `grounding.ts`: `node:child_process`, `node:fs`, `node:path` only; it runs `git check-ignore` (`grounding.ts:502`). | **Yes.** One type must be redeclared. `domain/index.ts` is 692 lines and carries machine-specific names (R1 B4), so the type should be copied, not the file. Three `.lisa`/`LISA_` strings in the two files need renaming. |
| `tui/presenter.ts` (586 lines) | `node:fs` only. | **Yes**, as R1 states. One `.lisa`/`LISA_` string. |
| `verification` (whole package) | `@lisa/core` in 8 import statements, `node:*`. From core it takes `VerificationPlanV1Schema` and the plan types (`core/src/domain/verification-plan.ts`, 250 lines, **not on R1's extract list**) and, in `planner.ts`, `SpecificationBundleV2` and `SpecificationBundleV2Schema` (`core/src/domain/specification-bundle.ts:658-661`, 698 lines, which R1 marks **Defer**). Both are zod schemas. | **Not as stated.** "Extract whole package" contradicts "Defer `domain/specification-bundle.ts`". Either the executor, store and hash are extracted with `verification-plan.ts` and the planner gets a new input type, or the bundle schema comes along. R1's F10 statement that `verification` has "no third-party dependency" holds only for direct dependencies; it needs `zod` through core. |

Two further items were looked at briefly. `otel`: the only non-relative import in the package is
`node:crypto`; fully separable. `scheduler/budgets.ts`: type-only import of `BudgetPolicy` and `JobState`
from core (`budgets.ts:39`); `JobState` is the 14-state job lifecycle that R1 says has no counterpart in
028 or 011, so the budget module needs a new state input. `dashboard/trajectory.ts@76adfdc` has no import
statement at all.

Result: two of three spot-checked items are separable as R1 says; one (`verification`) needs the extract
list corrected. This matches the confidence R1 gave itself (medium on the exact list).

## Failure rate and consequence

| Measure | Value |
|---|---|
| Cells in the gap table | 57 |
| Cells sampled | 36 (3 yes, 20 partial, 13 no) |
| Cells failed | 1 |
| Failure rate | 1 / 36 = 2.8 % |
| Threshold for re-examination | 20 % |
| Cells that hold with a note on the evidence text | 3 (028 FR-002, 028 FR-022, 011 FR-009) |

**Downgraded cell:** 028 FR-029, yes → partial. Corrected 028 totals: **2 yes, 16 partial, 12 no**
(R1: 3, 15, 12). 011 totals are unchanged: 0 yes, 6 partial, 21 no.

The failure rate is far below one fifth. The single failure moves the table **further from** "Lisa
already covers this", which is the same direction as R1's recommendation. **R1's recommendation (option
B, selective extraction, Lisa not the base) stands.** Its "high" confidence that Lisa should not be the
base is supported by this check: every sampled "no" was confirmed by a wider search than R1's own, and
the loop-level absences (MALFORMED limit, diagnostician, accelerator, yield, oscillation) are real.

Correction required in R1's extraction list: `verification` cannot be extracted whole while
`core/domain/specification-bundle.ts` is deferred; `core/domain/verification-plan.ts` must be added to the
list.

## Open questions / risks

| # | Item | For `DECISIONS-PENDING.md`? |
|---|---|---|
| V1 | 028 FR-029 downgrade rests on reading the dashboard as part of the product. If the dashboard is reimplemented (R1's ruling for everything but `trajectory.ts` and `provider-health.ts`), the second parser disappears with it. The new product should state as a requirement that UI surfaces read phases and tasks through the grammar owner. | No |
| V2 | `verification` extraction scope (see spot-checks). R2 owns the line estimate and should count `verification-plan.ts` (250 lines) and decide on the planner's input type. | No |
| V3 | `specs/src/resolve.ts:57-60` rejects an explicit `openspec` format although an adapter of that id is registered (`registry.ts:882`). Whether another code path accepts it was not traced. If `resolve.ts` is extracted, a characterization test should pin the behaviour before the rename R19 owns. | No |
| V4 | No Lisa test was run (R1 O5 remains open). Running them needs an install in a scratch clone; that was outside this assignment. The "tested" in R1's phrase "working, tested Lisa code" is therefore still `unverified`. | No |
| V5 | 21 cells were not sampled: 028 FR-030, 028 FR-026 and FR-027, and 18 "no" cells of 011. The unsampled 011 cells all depend on entities (contract, renderer, launcher, supervisor) for which the searches above found no trace, so the risk of a hidden "yes" is low (`inferred` from the greps for `relaunch`, `promot`, `state\.json`, `detached`, `dry-?run`). | No |
| V6 | The "Which Lisa" ruling remains an owner decision (R1 O1). This check confirms the facts it rests on; it adds nothing new to decide. | Already raised by R1 |
