# R26 — Parallel execution

Measured 2026-09-29. All source repositories read-only. No paid model call. Scratch scripts: `/tmp/specstride-research/R26/{par.py,ov.py}`. Savings are stated against R21's two-tier baseline (Claude-proposer population; NETOPS phase 15 as the long-verification baseline). Project names other than NETOPS and P07 are omitted on purpose.

## Prior art consulted

| File | Use |
|---|---|
| `/root/specstride-harness-roadmaps/roadmap/stage-parallelism-research.md` | **Reused** (levels L1/L2/L3, `writes[]` rule, serial by default). **Verified** its 1.22x method (F-1). **Extended**: it measures one contract; F-1 measures 43. **Contradicted in part**: its Part III selection table does not transfer to a Claude-only population (F-9). |
| `docs/ecosystem/research/R21-time-use-baseline.md` | Baseline for every saving here (F-2, F-3, F-5). |
| `docs/ecosystem/research/R1-lisa-reuse-audit.md` (B2, scheduler row) | **Confirmed** the scheduler is unwired; R1 says extract `stop.ts`, `stop-now.ts`, `budgets.ts`, defer the rest to this report. **Agreed**, with one addition (F-6). |
| `prompts/analysis/A6-micro-loop-survey.md` §6 | Conflict-rate sources and the `[P]` option. **Verified** S80/S81/S11 (F-7). **Contradicted**: A6 §7 lists `[P]` units in worktrees as a first-release option; this report advises against it for Wave 1. |
| `prompts/analysis/A7-local-loop-prior-art.md` §2.1, §3 | Lock at `orchestrator.sh`, yield/long-job mechanisms, repeat-stall risks. |
| `/root/lisa/packages/scheduler/src/{safety,integration,worktrees,queue}.ts`, `packages/core/src/plan/graph.ts`, `old/002-as-is-lisa/spec.md` | Read in full for the parts cited. |
| NETOPS `specs/004-…/tasks.md`, `bin/acceptance/p15-t151r10/plan.tsv`, `.evidence/…/acceptance-…r10-…/`, `verification-plan.json` | Phase DAG, acceptance-job structure, gate commands. |

## Questions answered

**Q1. What does parallel tasks / stages / features save against the baseline, and what does it risk?**
Agent parallelism saves little on the Claude baseline. Upper bounds, before any coordination cost: parallel `[P]` tasks inside a phase at most 7.8 % of alive time (median ceiling) to 11.9 % (pooled ceiling); phase parallelism in NETOPS at most 3.5 % (2 workers) to 5.2 % (unbounded), and it is blocked by the one shared lab; feature parallelism has no measured population benefit. None touches the 32 % (Claude) / 64 % (NETOPS) that is detached waiting. Table in the Options section.

**Q2. Does the 1.22x ceiling for merge-based task parallelism still hold?**
Yes, as a ceiling on proposer time, and it is if anything generous. The method reproduces (F-1). Across 43 distinct local `tasks.md` files the ceiling has median 1.18, pooled 1.30, p90 1.67, max 2.12. Only NETOPS (1.62) and a few others exceed 1.5. It applies to proposer time only (51.4 % of Claude alive time, 34.5 % of NETOPS), so end-to-end it is a smaller number. The rejection of merge-based L3 stands for Wave 1; the "selection" numbers in Part III do not transfer (F-9).

**Q3. Lisa's scheduler and 002's requirements?** Built, unit-tested, never called by a run (F-5). Disposition proposal in F-6 and Matrix.

**Q4. Conflict rates, when safe, and the merge check?** Measured rates exist only for independent agent PRs (F-7), not for scope-disjoint scheduled work; nothing local is measured. Safe means declared write scopes disjoint and the diff audit passes. The merge check is a fixed deterministic sequence (F-8).

**Q5. Non-agent parallelism?** Concurrent independent verification commands is the only measured-plausible one and it is small (F-10). Overlapping the long detached waits with other work saves nothing in the reference run (F-11). Neither is the large lever; fail-fast (R23) is.

**Q6. Wave 1 option versus roadmap?** See Recommendation.

## Findings

### F-1 The 1.22x method reproduces and the conclusion holds `verified-local`
Method in the note (lines 215-236): count tasks per phase, count `[P]` tasks; a phase with any `[P]` collapses to (serial tasks + 1) units; ceiling = tasks / units; unbounded workers, zero coordination, equal task cost.
I re-implemented it (`par.py`, phase = `## Phase` heading, task = `- [ ] T###`, parallel = literal `[P]`).

| Sample | Tasks | `[P]` | Units | Ceiling |
|---|---|---|---|---|
| The note's reference `tasks.md`, today (file has grown since 2026-09-10) | 122 | 32 | 101 | 1.21 (note: 117/32/96, 1.22) |
| NETOPS `004` | 188 | 87 | 116 | 1.62 |
| 43 distinct forward-mode `tasks.md` files on this machine (as-is reverse-engineered specs excluded; duplicates removed) | 3,505 | 1,021 (29 %) | 2,698 | pooled 1.30; per file median 1.18, mean 1.27, p90 1.67, max 2.12, min 1.00; 65 % of files at or below 1.25 |

- The as-is reverse specs are outliers (`002-as-is-lisa/tasks.md`: 57 of 65 tasks `[P]`, ceiling 3.82) because reverse-engineering phases are independent reads; they are excluded and are not representative of forward mode.
- Weaknesses of the method, none of which reverses the conclusion: (a) task cost is assumed equal; (b) `[P]` is an author claim, not verified (F-7 shows it is sometimes contradicted by the same file's own paths); (c) it ignores rejected attempts, which cost N times more under parallelism; (d) it says nothing about the shared serial files it lists (`PROGRESS.md`, evidence); (e) it is a ceiling on proposer time, not on run time.
- End-to-end bound `inferred` from F-1 and R21 F-2: Claude population, proposer share 51.4 %: pooled ceiling gives 51.4 % × (1 − 1/1.30) = 11.9 %; median ceiling gives 7.8 %. NETOPS: 34.5 % × (1 − 1/1.62) = 13.2 %. After coordination cost (a per-phase integration gate, N cold starts of about 108 k tokens each per R21 F-10, and rejection multiplication) a realistic figure is about half of these: 4-6 % of alive time. The realistic half is `unverified` (no experiment exists; A6's E6).

### F-2 Where the time is, restated for parallelism `verified-local` (R21 F-2, F-3)
Claude population alive 253.9 h: proposer 51.4 %, detached wait 32.3 %, orchestrator verification 11.2 %, critic 2.2 %. NETOPS 127.9 h: wait 64.1 %, proposer 34.5 %. Agent parallelism can act only on the proposer share and, at most, verification. The wait share, and all of its 82.0 h, is untouched by any agent parallelism.

### F-3 Stage parallelism in the launch contract `verified-local` (note, Findings 1-3; A7 §2.1)
The contract declares `depends_on`, the runtime iterates a list. The note's contract has two siblings that bring up stacks in minutes against a run measured in hours: Amdahl serial fraction about 99 %. R21 F-12 confirms stage preparation is seconds (9 s and 18 s for P07 features). So L1 saves seconds. Not re-measured in full, since the launcher is Python that decision 1 replaces.

### F-4 Phase parallelism in NETOPS: the DAG exists in prose, the shared lab defeats it `verified-local`
`specs/004-…/tasks.md:580-650` gives the phase graph. After US4, phases 5, 8, 9, 10 and 12 "can be staffed in parallel", and US11 (phase 11) "can start as soon as US1 is done", "the serial files above excepted" (`Makefile`, `scripts/provision.sh`, `scripts/lib/intent_tier.sh`, controller files are "serial with each other across stories"). Phase 15's runs "share the one lab and are serial" (line 670).
Time in those six phases from R21 F-4: proposer 8.34 h, setup 0.38 h, critic 0.19 h, about 8.9 h. Longest single one (phase 12) about 2.3 h. Bound: unbounded workers save 8.9 − 2.3 = 6.6 h, which is 5.2 % of 127.9 h; two workers about 4.4 h, 3.5 %. `inferred` from R21 F-4 columns. It also needs several live verifications against one lab, which the tasks file itself forbids as serial, so the realistic figure is below 3.5 %. The dependency graph is in prose: turning it into machine form is a model judgement, the "silent omission" risk of Finding 5 of the note.

### F-5 Lisa's scheduler: built, tested, not called `verified-local`
- Files: `queue.ts` 366 lines, `safety.ts` 215, `worktrees.ts` 270, `integration.ts` 147, `budgets.ts` 233, `cron.ts` 349, `stop.ts` 162, `stop-now.ts` 253 (3,064 with tests).
- `cli/src/commands/run.ts:64-67` imports the workspace lock and stop machinery; R1 B2 records that `admitBatch`, `decideSafety`, `WorktreeManager` and `runIntegration` have no non-test caller (I did not re-run the grep; R1's command stands, and `run.ts` imports only `PassRegistry` and `StopController` from the scheduler per R1).
- `safety.ts` (`decideSafety`, `admitBatch`) is a pure predicate over five gates: dependencies, write scope, resource class capacity, budget headroom, human block. Every decision is returned with a reason per gate. `admitBatch` is greedy in caller order with a `maxParallel` cap. It serialises, never drops.
- Write scope is a **declared path prefix** (`core/plan/graph.ts:71-90`); an empty scope collides with everything. This is the same default as the note's "undeclared means serial". It is a declaration, not an observation: nothing compares it with the diff the worker actually produced.
- `integration.ts` (`runIntegration`): merges each approved branch in order; the first conflict demotes the whole group to sequential; if all merge, a **model** "system-level critic" judges the combined tree; a rejection also demotes. **There is no deterministic build or test step between the merge and the critic**, and `WorktreeManager.wouldConflict` (a `merge-tree` dry run) is not used by `runIntegration`. That is the gap F-8 closes.
- `worktrees.ts`: `git worktree add -B`, clean-before-create, `merge --no-ff`, orphan sweep after a crash. It refuses non-git workspaces.
- It is the merge-based design that the note discarded, built without the note's evidence (A7 §5 item 5).

### F-6 Disposition of 002's scheduler requirements `inferred` (from F-5, R1, decision 21)
Numbers are Lisa spec `002` FR numbers. Note that code comments in the scheduler cite Lisa-internal numbering (FR-042/043/044) that is not 002's.

| Requirement | Content | Proposed disposition |
|---|---|---|
| 002 FR-039 | five-gate safety predicate, verdict per gate | Roadmap. Keep the five gates and the "reason per gate" event as the design of the future admission function; rewrite in TypeScript against the new schema. |
| 002 FR-040 | greedy batch admission with a cap | Roadmap, with FR-039. |
| 002 FR-041, FR-042 | four-ceiling budgets, atomic ledger | R1: extract `budgets.ts` for decision 8. Not a parallelism item. |
| 002 FR-043, FR-044, FR-045 | job queue, idempotency key, crash recovery | Drop for Wave 1 (one run per workspace, lock and resume already cover it). Revisit only if a multi-workspace supervisor is built (roadmap). |
| 002 FR-046 | `stop.flag` | R1: extract. |
| 002 FR-047 | cron | Not parallelism. Defer to whoever owns scheduled runs; not needed for Wave 1. |
| 002 FR-048 | worktree create/clean | Roadmap, first user is candidate isolation or snapshot checks. |
| Unnumbered in 002: `integration.ts` demotion policy | No 002 requirement covers it | Roadmap, with the F-8 changes below. |

I agree with R1 and add one thing: `integration.ts` should not be extracted as it stands, for the missing deterministic step.

### F-7 Conflict rates: measured for independent PRs, none for scoped work `verified-doc`, `verified-local`
- AgenticFlict: 142K agent PRs, 107K processed, **27.67 %** have a textual merge conflict; mean 4.36 files, median 2 (arXiv 2604.03551 via search result, 2026-09-29) `verified-doc`.
- Xu, Subramanian, Karthik, 33,596 PRs, 2,807 repositories: **19.8 %** textual conflict for same-agent PR pairs, **41.7 %** for cross-agent pairs (non-overlapping 95 % intervals); cross-agent collaboration in about 4.3 % of repositories (arxiv.org/abs/2607.04697, fetched 2026-09-29) `verified-doc`. The "84.4 % of conflicted files are source code" figure is in the same abstract; the 26.8 % modify/delete figure is from a secondary write-up and is `unverified`.
- Anthropic C compiler: 16 agents in containers, task locks as files, "merge conflicts are frequent, but Claude is smart enough to figure that out"; when all agents hit the same kernel bug they overwrote each other's fixes until an oracle split the problem; about 2,000 sessions, just under $20,000 (anthropic.com/engineering/building-c-compiler, fetched 2026-09-29) `verified-doc`. The speed-up is asserted in the source, not measured against a serial arm.
- Claude Code documents `claude --worktree <name>` for isolated parallel sessions, one branch per worktree, created from an existing commit (code.claude.com/docs/en/common-workflows, fetched 2026-09-29) `verified-doc`. Agent teams and their token cost are only in A6 (S20); not re-verified.
- **Limit of these rates.** They come from independent PRs that were not planned to be disjoint. A scheduler that admits only scope-disjoint work should see fewer conflicts, but a rate for that case does not exist anywhere I could find, and semantic conflicts with a clean textual merge are not counted by either study. Treat these as design-around figures, not predictions. Local rate: none measured; no local run has ever executed concurrent proposers in one repository.
- **Local proxy for `[P]` honesty** `inferred` (`ov.py`): declared file paths in `[P]` task lines of the same phase. Pairs sharing an identical declared file: NETOPS 4 of 210 (1.9 %), the note's reference contract 1 of 75 (1.3 %), one 52-`[P]` file 20 of 89 (22 %), a 118-`[P]` file 75 of 640 (11.7 %). Same-directory-only overlaps are additional. Two files had no extractable paths (0 pairs). It shows `[P]` claims are sometimes contradicted by their own text and that the rate varies by an order of magnitude by author; it does not measure the true conflict rate, since the paths in task text are not the paths edited.

### F-8 The merge check that runs before the critic `inferred` (from F-5, F-7, decision 21)
Applies whenever two or more workers produced changes to one phase attempt (roadmap feature; specified now so the architecture leaves room). Order is fixed, all deterministic, run by the runtime, never by a worker or a model:
1. **Scope audit.** Each unit's actual changed paths (from `git diff --name-only` in its worktree, plus untracked files) must be within its declared write scope, and must not touch a protected path (checks, tests the check relies on, gate files). One violation fails that unit and serialises the group (no critic involvement).
2. **Mechanical merge** in an integration worktree, dry run first with `git merge-tree --write-tree` (needs git 2.38; `worktrees.ts` has a fallback for older git). Any conflict demotes the group to sequential, as Lisa's `integration.ts` already does; no model resolves a conflict.
3. **Single-writer files assembled by the runtime**, not merged: progress notes and evidence are rebuilt from per-unit records.
4. **Full phase verification gate** on the merged tree (decision 21 already requires this gate to run before the critic; here it also serves as the integration test). Per-unit passes count for nothing at this point.
5. Only then the critic, with the merged result and each unit's final check result, and without the history of retries (decision 21).
Demotion to sequential is the safe outcome at every step and is recorded as an event with the reason. Lisa's model "system critic" is not used as a merge check.

### F-9 Reconciliation by selection does not transfer to the Claude population `verified-local`, `inferred`
The note's Part III uses p = 0.47 first-attempt success, 3.21 mean attempts, from 803 verdicts across older local models (measured 2026-09-10; 70 % rejected). R21 F-3 for the Claude proposer: 331 attempts, 230 approved (69 % of attempts; 78 % of attempts that reached a verdict), 43.3 % of attempt time failed. R21 overall: 72 % of phases approve on the first attempt, mean 2.41, median 1. Recomputing the note's model (independence assumed, which favours selection): p = 0.69 gives 1.45 expected rounds serial, 1.11 with N = 2, so 1.31x faster at 2.21 versus 1.45 cost units, i.e. **1.5x the cost**; p = 0.78 gives 1.22x faster at 1.6x the cost. The note's "2.3x faster at 0.87x cost" does not hold. Wave 1 also runs a single provider (decision 13), and the note itself says identical backends inherit the correlation. Heavy-tail phases (one NETOPS attempt cost 45 h) are where selection might still pay; the one-day validation the note proposes is the right gate and is unrun. Routing across backends belongs to R25.

### F-10 Concurrent independent verification commands `verified-local` for structure, `inferred` for the saving
- NETOPS acceptance job, r10: 159 planned steps: 13 offline, 3 cycles of 48 live steps, 2 closing (`plan.tsv`).
- The 13 offline steps (unit tests, static verifiers) finished within 171 s of each other by file mtimes, run serially. Perfect parallelism saves at most about 2 minutes of a 10.5 h job (`verified-local`, mtimes in `.evidence/…r10…/offline/`).
- Cycle-1 has 58 evidence files spanning 3.16 h; the top 8 steps are 70 % of it (largest 29 min). The live steps deploy, drift, delete and fail targets on one cluster (`test-target-failure`, `test-service-delete`, `lifecycle:deploy/redeploy`). Parallel live steps are unsafe without more labs; the three cycles are lifecycle repeats of one lab (deploy, destroy, redeploy), and a CIDR-overlap preflight exists in the README task, which suggests concurrent labs collide `inferred`. So intra-job parallelism buys no measured hours.
- The phase gate for the same run has three commands with fixed argv: `go test ./...` (1800 s cap), `go build ./...` (1800 s), `make test-static` (3600 s) (`verification-plan.json`). Running them concurrently is possible; per-command durations are not recorded (R21 gap 19), so the saving is unmeasured. Bound `inferred`: orchestrator verification is 11.2 % of Claude alive time (P07 carries most of it); if commands run 2-3 wide and half of that time overlaps, 2-4 % of alive time. This estimate has no measurement behind it.
- NETOPS itself shows 0 h of orchestrator verification (verification runs inside passes, R21 F-2 notes), so this saving does not appear in the long-verification baseline at all.

### F-11 Overlapping a detached wait with other work: nothing to overlap in the reference run `verified-local`
Phase 16 depends on phase 15 (`tasks.md:628`), and all other phases were approved before phase 15 began (R21 F-4). During the 82.0 h of waits, no dependency-free phase remained. A machine-readable DAG would have found no work either. The only work that could overlap is the next unit inside the same phase, which sits behind the very job being waited for. Parallelism therefore saves 0 h of the 82.0 h; the 29.3 h that ran after a failure was already visible (R21 F-5) is R23's fail-fast.
Overlapping a **micro-loop** unit check with the proposer's next unit (check in a snapshot worktree while the proposer continues): this recovers check time only when the check passes, and a failure means repair on top of later edits. There is no baseline for it (micro-checks do not exist yet). Unit pass rates are unmeasured. `inferred`; roadmap, after R23's check durations exist.

### F-12 Constraints that any parallelism must respect `verified-local`
- One run per workspace: the lock is `flock -n` on `$LOCK`, exit `$E_LOCK` if held (`/root/specstride/orchestrator.sh`, `acquire_lock` around line 506). Lisa has `acquireWorkspaceLock` (`cli/src/layout.ts:141`, called at `run.ts:418`). Parallel **workers inside a run** are compatible with the lock (the run holds it); parallel **runs** need separate workspaces (worktrees or clones), each with its own lock and state. Decision 3's greenfield state layout should therefore be workspace-local with no global mutable file.
- Sessions: decision 22 continues a session within an attempt; each parallel worker would need its own session, and the critic is always fresh.
- Micro-loops "revert to the last kept commit" (A6 escalation row) assumes a linear history in one tree; parallel workers break that and would need one history per worktree.
- Decision 21 counters and caps: inner cycles count only against their own caps; a parallel layer would add a second cap set and new stop reasons unless it degrades to serial silently. It can be done (demotion), but the wording "adds no exit codes" must hold.

## Version/date pins

| Item | Value |
|---|---|
| Measurement date | 2026-09-29 |
| Lisa tree read | local `main` `363e6a3` (`packages/scheduler`, `packages/core/src/plan/graph.ts`, `cli`), spec `002` at baseline `76adfdc` |
| Specstride | `9cab15d` (lock function read from `/root/specstride/orchestrator.sh`) |
| NETOPS run state | R21's cutoff 1790637900 for all figures; files opened read-only |
| Claude Code docs | code.claude.com/docs/en/common-workflows, accessed 2026-09-29 |
| arXiv | 2607.04697 (submitted 2026-07-06, revised 2026-07-07), accessed 2026-09-29; 2604.03551 via search result summary, accessed 2026-09-29 |
| Anthropic engineering post | building-c-compiler, accessed 2026-09-29 |

## Options compared

Savings are upper bounds on alive time against R21 (Claude population unless stated). "Realistic" is `inferred`.

| Option | Upper bound | Realistic | Acts on | Main risk | Cost side | Lock/decision 21 fit |
|---|---|---|---|---|---|---|
| A. Parallel `[P]` tasks, worktrees, merge (Lisa scheduler shape) | 7.8-11.9 % (NETOPS 13.2 %) | 4-6 % (`unverified`) | proposer 51 % | conflict rates by analogy (19.8-41.7 % for PR pairs, F-7), semantic conflicts, rejection multiplied by N, wrong `[P]` claims (F-7 proxy), critic payload growth | N cold starts of about 108 k tokens; integration gate per phase | Inside the lock; breaks linear revert |
| B. Parallel independent phases (phase DAG) | NETOPS 3.5 % (2 workers) to 5.2 % | below 3.5 %; blocked by one lab and serial files | proposer of independent phases | DAG only in prose; shared lab; serial files | tokens roughly equal, wall time shorter | Needs workspaces or a shared-resource model |
| C. Parallel features in separate workspaces | Unmeasured; one 3-feature pipeline (16.25 h, 2.8 % of all alive time) if independent (not verified) | n/a | whole runs | Independence unknown; shared machine resources (ports, labs, quota) | Cost unchanged, quota burn faster | Fits the lock best (one lock per workspace) |
| D1. Independent verification commands run concurrently | about 2-4 % (`inferred`; per-command times unrecorded) | about 1-2 % | orchestrator verification 11.2 % | Commands that write shared caches or a lab | none | Pure runtime; no agent; fits |
| D2. Overlap detached wait with other work | 0 h in the reference run (F-11) | 0 | wait 32-64 % | Speculating on unapproved work | none | Would breach "gate before next phase" |
| D3. Overlap micro-check with next unit | unmeasurable until micro-checks exist | unknown | new layer | Repairs on moved tree | none | Fits decision 21 if checks stay runtime-run |
| E. Selection: N backends on one phase | 1.2-1.3x faster at 1.5-1.6x cost (Claude p, F-9) | lower | first-pass success | Cost; needs diverse backends | +50-60 % | Fits; routing is R25 |
| F. Fail-fast in long jobs (R23) | 29.3 h of 82.0 h in NETOPS (R21 F-5) | R23 | detached wait | none new | none | R23 |

## Recommendation

1. **Do not ship agent parallelism in Wave 1, not even as an option.** The ceilings are 7.8-11.9 % of alive time before costs, 3.5-5.2 % for phase parallelism, and the risks (semantic conflicts, cold starts, linear-history assumptions in micro-loops and session continuation, a second cap set under decision 21) land in the same layer that Wave 1 must prove. This departs from A6 §7 (parallel `[P]` as an option) and follows the note's rejection of merge-based L3. Confidence: medium-high.
2. **Ship in Wave 1, off by default: concurrent independent verification commands** (`verification.parallelism`, default 1). A command may run concurrently only if the plan declares it side-effect-free or declares disjoint write paths (the note's `writes[]` rule, undeclared means serial). The runtime emits one check event per command with duration and result (closes R21 gap 19 and feeds R14). Small, pure runtime, no agent, no merge. Confidence: medium on the value (the saving is `inferred`), high on the safety.
3. **Wave 1 architecture constraints, no feature:** (a) all run state and the lock are workspace-local, no global mutable state, so two runs in two workspaces are safe today; the doctor names shared external resources (ports, labs) it cannot check; (b) the unit executor takes the working directory as a parameter and a unit record carries `writes[]` (empty means the whole tree) so worktree isolation can be added later without core changes; (c) unit and check events carry a worker or workspace id.
4. **Roadmap, in this order:** (i) feature parallelism in separate workspaces, once a contract can declare features independent and a measurement shows they are; (ii) phase-DAG parallelism, requiring a machine-declared `depends_on` and `writes[]` and shared-resource classes (Lisa's `resource_class` gate is the reusable idea); (iii) `[P]` units in worktrees with the F-8 check, run first as experiment E6 (serial versus 2 versus 4) on NETOPS-like contracts before any default; (iv) micro-check overlap (D3), after R23's check durations; (v) selection (E) only with diverse backends and after the note's one-day validation, owned with R25.
5. **Lisa scheduler:** extract `stop.ts`, `stop-now.ts`, `budgets.ts` (R1); keep `safety.ts`, `worktrees.ts` and `queue.ts` as reference for the roadmap, not as dependencies; do not adopt `integration.ts` without the deterministic steps 1-4 of F-8 in front of its critic. Dispositions in F-6.
6. The largest saving in the baseline, the waits, is not a parallelism problem. State this in `roadmap.md` so that no parallelism feature is credited with it.

Overall confidence: medium-high that agent parallelism is not worth Wave 1; medium that the verification option earns its place.

## Matrix rows

Host capability matrix, one observation: Claude Code, parallel sessions: `claude --worktree <name>` creates an isolated worktree session (`verified-doc`, code.claude.com/docs/en/common-workflows, 2026-09-29); background subagents and agent teams not re-verified here (see A6). No harness row.

## Open questions / risks

1. **No measurement of parallel-worker conflicts or speed-up exists here.** Every parallelism figure is a bound or an analogy. Experiment E6 (A6) or a scripted stub experiment on NETOPS-like task graphs is required before any default. Possibly R27's fixture mix.
2. **Feature independence** in the one 3-feature pipeline (2.21, 4.79, 9.26 h) was not checked.
3. **Per-command verification durations** are not recorded (R21 gap 19); the D1 estimate is unmeasured.
4. **`[P]` proxy** (F-7) measures declared paths in task text, not edited files.
5. **The 1.22x number is a ceiling** and the tasks file it measured has grown from 117 to 122 tasks; other numbers here come from 43 files written by one author.
6. **Selection numbers** assume independent attempts, which flatters the model; the true Claude-only case is worse.
7. **Possible DECISIONS-PENDING (information, not a conflict with a decision):** whether Lisa's queue and cron (002 FR-043 to FR-047) have a future owner (scheduled or multi-workspace runs) or are dropped; default proposed: drop for Wave 1, keep on the roadmap.
8. **Conflict-rate figures are for independent PRs** and describe a different situation from scope-disjoint scheduling; semantic conflicts are uncounted.
9. **Shared resources across workspaces** (quota windows, ports, labs) are not covered by a workspace lock; concurrent runs could race on them.
