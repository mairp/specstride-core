# R29 — Parallel `[P]` units as a Wave 1 option

Written 2026-09-29. Design research; no product code. Read-only work on every source repository. No
paid model call, no harness CLI invoked, no subagent, no external documentation fetched. Scratch:
`/tmp/specstride-research/R29/` (`pscope43.py`, `ceil.py`, and `probe/`, a throwaway git repository
created there to test the tree-store mechanism).

How to read the tags. `verified-local` means read or executed by me on this machine, with the file and
line or the command. A figure taken from another report is cited `R<n>:<line>` and belongs to that
report. `inferred` names the facts it rests on. Savings carry a second label: **[M]** measured, **[E]**
estimated (a method was run), **[I]** inferred (reasoned, no method run).

Terms. **Main line**: the ordinary serial pass loop of a phase attempt in the workspace. **Worker**: one
harness process working one assigned task in a tree of its own. **Group**: the workers started together
and integrated together. **Worker tree**: the directory a worker works in. **Tree store**: a repository
the runtime owns, outside the project's repository. **Delta**: the difference between the group's base
snapshot and a worker's final snapshot. **Integration**: scope audit, mechanical merge, application to
the workspace. **Merge check**: the inner check set run on the integrated tree. **Layer** without a
qualifier means the micro-loop layer of R27.

Rules are numbered PU-01 to PU-78. Each names its test. The owner's rulings are cited as "ruling n"
(`RULINGS-IN-PROGRESS.md`).

## Prior art consulted

| File | Read | Reused, extended or contradicted |
|---|---|---|
| `research/BRIEF-COMMON.md`; `prompts/specstride-ecosystem.md` §0, §1, §2 | in full | Frame. Decisions 4, 7, 17, 20, 21, 22, 23 bind |
| `RULINGS-IN-PROGRESS.md` | in full | Rulings 56, D2, D3 are the mandate. Rulings 5, 6, 9, 27, 28, 31, 34, 36, 38, 39, 41, 42, 50, 51, 53, 55, 57a, D1, 68 constrain the design. Two of them need a statement from the owner (section "Conflicts with owner rulings") |
| `architecture.md` | in full | **Reused**: layers, LR-1 to LR-11, the process tree, the state layout, SL-1 to SL-7, section 9. **Extended**: EP-04 (stacking, two directives, the tree-store service), the process tree (N harness processes under the engine), a fourth location (the worker root) |
| `research/R26-parallel-execution.md` | in full | **Reused**: the merge check F-8, the six constraints, the dispositions F-6, E6. **Extended**: the ceiling is recomputed with task order respected and with a worker cap (F-2). **Contradicted in one step**: F-8 step 4 runs the full gate as the merge check and demotes on failure; this design runs the inner set as the merge check and sends a failure to the serial repair path, because ruling 50 forbids the revert a demotion would need (O-3) |
| `/root/specstride-harness-roadmaps/roadmap/stage-parallelism-research.md` | in full | **Reused**: `writes[]`, "absent declared write-sets, keep it serial", the list of single-writer files, its five objections to merge (lines 249-257). Each objection is answered by a rule (F-9) |
| `research/R27-run-acceleration-synthesis.md` | in full | **Reused unchanged**: D1.1 to D1.13, caps, the fact block, the experiments' paired design. Nothing in it is changed; section "Beside the micro-loop layer" lists the five places where this design adds to it |
| `research/R23-inner-checks-gate-integrity.md`, `research/R23v-gate-red-team.md` | in full | IR-01 to IR-57, reviewed one by one for several workers (F-10) |
| `research/R15-ecosystem-architecture.md` A-3 (EP-04, EP-05, EP-13), A-5, A-7, A-8 | sections | **Reused**: EP-04's hooks and withheld writers (R15:314-321), the layout (R15:596-661). **Contradicted**: A-8 calls `[P]` units "a later addition to one component" (R15:824); R15v A-1 showed it is not |
| `research/R15v-architecture-red-team.md` A-1, A-2, C-7, C-8, P-10 | sections | **Reused**: `requestPass`, capability negotiation, LR-5 tested under contention (R15v:59-63); one file per writer (R15v:358-363) |
| `research/R11-security-threat-model.md` | T-19 to T-29, containment C0 to C3 (R11:665-668), R-1 to R-5 | **Reused**: containment as an adapter capability; the control plane outside the write scope |
| `research/R14-quotas-cost-observability.md` | envelope (R14:225-247), the pause (R14:156-166), EV-01 to EV-34 | **Reused**. **Extended**: two optional envelope fields; the pause with several workers |
| `research/R24-warm-start-context-carry-over.md` | F-2, F-3, F-5 to F-8 | **Reused**: drop rules, ledger, handoff. **Extended**: one further drop rule (PU-33). Its cache-scope fact (R24:91) decides the cost of a worker |
| `research/R21-time-use-baseline.md`, `research/R21v-baseline-recompute.md` | the figures as restated in R27 F-1 and F-2 (R27:97-138), and R21:318-320 | Baseline for every saving here |
| `old/002-as-is-lisa/spec.md` | FR-039 to FR-048 (`spec.md:201-219`) | 002 FR-048 moves to this feature, `translated` (F-7) |
| Lisa, read-only, tree per ruling 13: `packages/scheduler/src/{worktrees,integration,safety}.ts`, `packages/core/src/plan/graph.ts` | in full for the three scheduler files; `graph.ts:55-90` | The working tree of `/root/lisa` is at `76adfdc`; `git diff --stat HEAD main -- packages/scheduler` shows only a demo file and `package.json`, so the scheduler sources read are those of `363e6a3`. `graph.ts` was read with `git show main:` |
| Lisa `specs/memory/constitution.md:97-102` | the principle | Text of "Deterministic Parallelism" |
| `constitution-amendment.md` | section 2 and Principle VIII | `constitution-amendment.md:66` leaves the principle out; section "Constitution" proposes its return |
| `feature-briefs.md` brief 115 (`:4379-4553`), B.3 (`:172`) | sections | Template of the brief material. `:172` reserves "the next free number from 142" for splits, which collides with the proposed number (open question 9) |
| Real `tasks.md` files | 48 distinct forward-mode files from R26's list; NETOPS `004` read directly | How `[P]` is used (F-1) |

## Questions answered

**Q1. Shape.** A loop layer of its own, `parallel`, registered behind EP-04 and **stacked above**
`micro`. It is neither a mode of the micro-loop layer (R27's design stays untouched) nor an engine
capability by itself. The mechanics that a layer must not hold are engine services offered through
EP-04: the pass-group executor, the tree store and integration. The layer decides; the engine executes
and accounts. Off by default, off under the `parity` profile, no exit code, no stop reason. With the
option off the layer is not in the stack and no service is called. EP-04 major 1 must contain the seven
items of PU-05. Rules PU-01 to PU-08.

**Q2. Eligibility.** `[P]` alone is not enough. A task is eligible when it carries `[P]`, belongs to a
run of consecutive `[P]` tasks in the launch-time task list, has a write scope, and that scope is
disjoint from the scope of every task already admitted to the group. The scope is derived by the
runtime at launch from the paths the task's own text names, or declared by the consumer in user
configuration or in the launch contract. The proposer declares nothing. A missing scope means the whole
tree, which means serial. An overlap sends the later task to the serial path. Every scope is a claim
until the scope audit has compared it with what the worker actually changed. Rules PU-09 to PU-17.

**Q3. Workers and worktrees.** A worker gets a git worktree of a **tree store**: a bare repository in
the control plane that borrows the project's objects read-only. The base is a snapshot of the attempt's
current tree, not `HEAD`, because inside an attempt the tree is uncommitted (ruling 50). Worker trees
live in a fourth location, the worker root, outside the workspace and outside the control plane.
Nothing is written under the project's `.git`; a probe confirmed it byte for byte (F-6). Ignored files
are not in a worker tree; declared seed paths are copied, never linked. Workers cannot yield, start
detached jobs or hold a shared resource. Ruling 50 is kept in its words; two acts need the owner's
statement: commit objects in the runtime's own store, and the application of an integrated delta to
the workspace. Rules PU-18 to PU-30.

**Q4. Harness sessions.** One harness process per worker, always a fresh session, base tier, one pass.
Default 2 workers, ceiling 4. The option needs a tested adapter that declares `concurrentSessions`; on
a discovered, unverified harness it is off and announced, which decision 21 allows for "anything more
demanding". A quota signal from any worker pauses the whole group under the one pause record. A group
is admitted only with quota and budget headroom. Rules PU-31 to PU-40.

**Q5. Merge and the merge check.** Five deterministic steps, fixed order, run by the engine: barrier
(every worker's processes ended), scope audit, mechanical merge in task order with no model,
application to the workspace, the inner check set on the integrated tree. A conflict or a violation
sends that task and every later task of the group to the serial path. The verification gate runs again
in full on the workspace, and only then the critic. Rules PU-41 to PU-52.

**Q6. Gate integrity with several workers.** Of IR-01 to IR-60, 21 hold unchanged, 36 need a
multi-worker form, 3 do not apply inside a worker. 14 new rules close what no existing rule covers.
One ledger and one event file, both written by the engine process only; workers are harness processes
and write neither. `seq` is assigned at the append, in process. The critic sees one unit per
integrated group, on the integrated tree, with no worker, no group and no sign that anything ran in
parallel. Table F-10; rules PU-53 to PU-66.

**Q7. Accounting.** Worker passes take no iteration, no reject, nothing of the MALFORMED limit and
leave the consecutive breakers as they were. Each worker spends one cycle of the layer. Integration
and merge-check time count inside the 15 % inner-check budget. A worker pass ended by a time limit
counts as killed, with its hours (ruling 5). Wall hours and agent hours are both reported. Rules PU-67
to PU-72.

**Q8. Concurrent verification commands.** Owned by feature 105 behind EP-05. A command runs beside
another only with a scope declared in the frozen manifest; one fingerprint pair brackets the batch;
every command runs to its end (ruling 51), results are ordered by manifest position. Rules PU-73 to
PU-78.

**Q9. Savings and cost.** Ceiling on proposer time with 2 workers and the eligibility rule of Q2:
pooled 1.063, median 1.038 **[E]**. End to end that is at most 3.0 % of alive time on the Claude
baseline, 4.1 % on ordinary phases, 2.0 % on the long-verification stratum **[I]**. Central estimate
after overhead and failed groups: 1 to 3 % **[I]**. Cost: one cold start per worker, 65 to 108 k
first-turn tokens, written to the cache and not read from it. Worth switching on for single phases,
not for a run. E6 is defined in section "Experiment E6".

**Q10. Out of Wave 1.** Feature parallelism across workspaces, the phase graph, selection among N
candidates, the overlap of a check with the next unit, Lisa's safety predicate as a general admission
function, queue and cron (002 FR-039 to FR-047). Section "What stays out".

**Q11. Feature brief material.** Section "Feature brief material for 142-parallel-units": 41 estimated
requirements in three groups, seven register rows, a principle XX.

## Findings

### F-1 How `[P]` is used in real task files `verified-local`

Command: `python3 /tmp/specstride-research/R29/pscope43.py`. Input: the file list of R26
(`/tmp/specstride-research/R26/files.txt`), as-is specs excluded, duplicates removed by content hash.
A group is a maximal run of consecutive `[P]` task lines with no heading and no serial task between
them. A path is a backticked token that contains `/` or ends in a file extension.

| Quantity | Value |
|---|---|
| Files, tasks | 48; 3,968 |
| `[P]` tasks | 1,091 (27.5 %) |
| `[P]` tasks whose text names at least one path | 784 (71.9 %) |
| Groups of consecutive `[P]` tasks | 407, of which 146 hold one task |
| Groups of two or more | 261, holding 945 tasks; size median 3, mean 3.62, p90 7, max 15 |
| Pairs inside those groups | 1,737 |
| Pairs whose named paths overlap (equal, or one a prefix of the other) | 168 (9.7 %) |
| Groups in which every task names a path | 180 of 261 (69 %) |
| Groups in which every task names a path and no pair overlaps | 134 of 261 (51 %) |

- R23 found 91.3 % of all tasks naming a path in 18 files (R23:121-124). The lower share here is for
  `[P]` tasks over a wider population; it varies by author.
- NETOPS states the marker's meaning itself: "can run in parallel (different files, no dependency on
  an incomplete task)" (`specs/004-agentic-netops-composite/tasks.md:30`), and withdraws it by hand
  where two tasks share a file (`:106`, "so this task is not `[P]`").
- 146 of 407 groups are a single `[P]` task between serial tasks. R26's method collapses every `[P]`
  task of a phase into one unit whatever its position (R26:36); that ignores task order, which the
  same files use to express dependencies.
- Limit: a path named in task text is not the path edited (R26:90). The measure sizes the eligibility
  rule; it predicts no conflict rate.

### F-2 The ceiling, with task order and a worker cap `verified-local` for the computation, [E]

Command: `python3 /tmp/specstride-research/R29/ceil.py`. Equal task cost, no coordination cost. Rule
A: `[P]` alone. Rule B: `[P]`, a named path, and no overlap with a task already admitted; a task that
fails either condition is serial.

| Workers | Rule A pooled / median / p90 | Rule B pooled / median / p90 |
|---|---|---|
| 2 | 1.117 / 1.077 / 1.221 | **1.063 / 1.038 / 1.190** |
| 3 | 1.164 / 1.117 / 1.333 | 1.087 / 1.052 / 1.278 |
| 4 | 1.184 / 1.125 / 1.383 | 1.094 / 1.052 / 1.314 |
| unbounded | 1.208 / 1.125 / 1.442 | 1.104 / 1.052 / 1.333 |

- R26's pooled 1.30 and median 1.18 (R26:43) are the unbounded, order-free ceiling. With order
  respected the unbounded ceiling is 1.208. R26's conclusion stands and is, as R26 said, generous.
- Two workers reach 1.063 of the 1.104 available under rule B. The third and fourth worker add 0.031
  together. This is the basis of the default of 2 and the ceiling of 4 (PU-31).
- End to end `inferred` from the proposer shares of R27 F-1 (51.4 % Claude baseline, 68.6 % ORD,
  34.5 % LONG; R27:101-102, R26:50):

| Case | Claude baseline | ORD | LONG |
|---|---|---|---|
| Rule B, 2 workers (the default) | 3.0 % | 4.1 % | 2.0 % |
| Rule B, 4 workers | 4.4 % | 5.9 % | 3.0 % |
| Rule A, 4 workers (not offered) | 8.0 % | 10.7 % | 5.4 % |

### F-3 Lisa's scheduler code, read for this design `verified-local`

- `worktrees.ts:126`: `git worktree add -B <branch> <path> <baseRef>` with `baseRef` default `HEAD`
  (`:116`), inside the project's own repository, on a branch `lisa/<job>/<task>` (`:66-68`). Worktrees
  live under `<stateDir>/worktrees/` (`:88`), which is inside the workspace. `create` removes a stale
  worktree of the same identity first (`:121`) and refuses a non-git workspace (`:113-115`). This is
  002 FR-048 (`spec.md:219`).
- `worktrees.ts:163-168`: `integrate` runs `git checkout <ontoRef>` and `git merge --no-ff` **in the
  repository root**. Both write the project's working tree, index and history. Ruling 50 forbids all
  three inside an attempt.
- `integration.ts:112-130`: the first failed merge demotes the group. `:134`: the next step is
  `deps.systemCritic`, a model. No deterministic step lies between. `wouldConflict`
  (`worktrees.ts:175-195`) has no caller in `integration.ts`. R26 F-5 is confirmed (R26:64).
- `integration.ts:109`: only branches whose "own task-level critic approved" are merged. A critic per
  task is a second verdict source, which decision 21 excludes.
- `graph.ts:81-88` (`git show main:`): `taskScopesOverlap` loops over both lists. With an **empty
  list** on either side the loop body never runs and the function returns `false`: two tasks without
  scopes are reported disjoint. `scopesOverlap` treats the empty **string** as the whole tree
  (`graph.ts:74`), and the planner fills a default scope (`planner.ts:236-238`), so the defect is
  masked there. R26 read "an empty scope collides with everything" (R26:63), which is true of the
  string and false of the list. Rule PU-12 states the list case.
- `safety.ts:108-119`, `:188-214`: the write-scope gate and the greedy admission in caller order with
  a cap. The shape is reused (PU-13); the code is not extracted, because its inputs are Lisa's plan
  types.
- Nothing in the three files compares a declared scope with the diff a worker produced (R26:63
  confirmed).

### F-4 Why worktrees of the project's repository cannot be used `inferred`

From ruling 50, IR-60 (R27:324-325), R24:53 and F-3.

1. Inside an attempt the workspace holds uncommitted work of earlier units; kept units are ledger
   records, not commits (ruling 50). A worktree added from `HEAD` would lack that work, so a worker
   would build on the tree of the last approved phase.
2. `git worktree add` in the project's repository writes `.git/worktrees/<name>/`, and `-B` writes a
   ref. IR-60: the runtime "writes nothing under the project's `.git` except the commit at approval".
3. Any ref or reflog entry in the project's repository is reachable by grounding unless refused, and
   holds the order of work (R23v:196-197). IR-45 refuses `.git`; not writing there is the stronger
   control.
4. A merge in the project's repository changes index, working tree and history (F-3).

### F-5 Where worker trees can live `inferred`

From architecture section 7, R11 R-1 and R-2, ruling 22, ruling 57a and D1.

| Location | Proposer write scope | Grounding | Verdict |
|---|---|---|---|
| Inside the workspace, as Lisa does | The main line and every worker can write every tree | Reachable by citation; a critic with read tools (ruling 57a) can read it | Rejected |
| Inside the control plane | A worker must write its tree, so the control plane would be inside a proposer's write scope, against R-1 | Refused already | Rejected |
| **A worker root outside both** | A sandbox confines a worker to its own tree | Outside the workdir; refused by real path (PU-62) | Adopted |

### F-6 The tree-store mechanism works and leaves the project's repository untouched `verified-local`

Probe in `/tmp/specstride-research/R29/probe/`, a repository created there; git 2.47.3. Steps:

1. A workspace with one commit, then uncommitted work: a changed tracked file, an untracked file, an
   ignored file, an ignored directory, a file under `.specstride/`.
2. `git init --bare store.git`; the line `<workspace>/.git/objects` written to
   `store.git/objects/info/alternates`.
3. Snapshot: with a temporary `GIT_INDEX_FILE`,
   `git --git-dir=store.git --work-tree=<dir> add -A -- . ':(exclude).specstride'`, then `write-tree`,
   then `commit-tree -p <parent>`.
4. `git --git-dir=store.git worktree add --detach <worker dir> <snapshot>` three times.
5. Edits in the three trees; a snapshot of each; `git diff --name-status`; `git merge-tree
   --write-tree --merge-base=<base>`; `git apply` of the merged difference in the workspace.

| Observation | Result |
|---|---|
| The snapshot holds tracked files with their uncommitted changes and untracked files that are not ignored | `.gitignore`, `src/m.txt`, `src/shared.txt`, `src/untracked.txt` |
| Ignored files and `.specstride/` are absent from the snapshot and from every worker tree | `ls -a w1` prints `.git .gitignore src` |
| A worker tree's `.git` is a file that points into the store | `gitdir: …/store.git/worktrees/w1` |
| Two workers changing lines 2 and 7 of one file merge | exit 0 |
| A third worker changing line 3, next to line 2, conflicts | `CONFLICT (content)`, exit 1 |
| SHA-256 over every file under the project's `.git`, before, after the merges and after the apply | identical three times |
| `git status --porcelain` of the workspace, before and after the snapshots and merges | identical |
| `git worktree list` in the project | the workspace only |

Consequences: edits to **adjacent lines** conflict, so checkbox edits by workers on consecutive task
lines of `tasks.md` would conflict in most groups (PU-46). Empty directories do not exist in a worker
tree. The mechanism needs `merge-tree --write-tree`, git 2.38 or later (R26:95). macOS is `unverified`.

### F-7 Disposition of 002 FR-048 `inferred` from F-3, F-4, F-6

| Clause of 002 FR-048 (`spec.md:219`) | Disposition |
|---|---|
| Refuse a non-git workspace | **Kept**: the option is off for the run, announced with the reason `not-git` (PU-18). It is a fallback, not an error |
| Remove a stale worktree for the same job and task | **Kept**, keyed by run, group and worker (PU-27) |
| `git worktree add -B` from a base ref that defaults to `HEAD` | **Translated, with a register row**: `git worktree add --detach` in the tree store, from the attempt's base snapshot. No branch, no ref in the project's repository |

002 FR-048 moves from `deferred 3+` to `translated` in feature 142, with a characterization test of
the two kept clauses.

### F-8 The cost of a worker in tokens `inferred`

- A fresh pass reads a median 107.8 k first-turn tokens (R21v:741 as cited at R27:594). With the
  obligations index the start is about 65 k (R27:387).
- "The cache is effectively scoped to one machine and directory" (R24:91, the prompt-caching page as
  R24 read it). Every worker is in a different directory, so a worker's first turn is a cache write.
  `inferred`; no call was made to confirm it.
- A serial unit is also one pass (L1), but up to three passes of an attempt may continue a session
  (R27:275) and a fresh serial pass started within the cache lifetime in the same directory can read
  its prefix (R24:77-80).
- So a group of N workers costs, beyond the serial path, up to N first-turn prompts written instead of
  read: 130 to 216 k tokens at N = 2, 260 to 432 k at N = 4. A refused worker adds one wasted pass.
- Money is not stated. The provider's price list was not consulted, and the recorded cost of the
  baseline misses about half the spend (R27:553-555).

### F-9 The note's five objections to merge, and the rule that answers each `inferred`

| Objection (`stage-parallelism-research.md:249-257`) | Answer |
|---|---|
| `[P]` is an unverified claim | PU-09 to PU-15: scope derived by the runtime; PU-43: audit of the actual delta |
| A clean textual merge proves nothing; an integration gate eats the gain | PU-48: one merge check replaces the N inner checks the serial path would run; the gate runs once, as it does anyway |
| Evidence files are single-writer | PU-45, PU-46: excluded from every worker tree and delta; ticks re-applied by the runtime |
| A rejection discards N proposers' work | It discards one attempt's work in both cases; workers are inside one attempt. No multiplication arises, since no verdict exists per worker |
| A merged diff is a larger gate payload | PU-60: the critic's input is that of a serial attempt on the same tree; no per-worker block exists |

### F-10 IR-01 to IR-60 with several workers `inferred`

"U" holds unchanged. "M" needs the multi-worker form in the right column. "N" does not apply inside a
worker.

| Rule | | Multi-worker form, or the reason it holds |
|---|---|---|
| IR-01 | U | The `parallel` layer receives no gate writer (PU-06). Static test extended to its package |
| IR-02 | U | One approval per attempt, after the gate on the workspace |
| IR-03 | M | The gate executes on the **workspace after integration**. No result from a worker tree or from the merge check replaces an execution (PU-51) |
| IR-04 | U | Group and worker records are ledger record types; the verdict parser is fuzzed with them |
| IR-05 | U | The closing check is the layer's; no group starts once evidence exists (PU-40) |
| IR-06 | M | The list gains: no worker event changes an outer counter (PU-67) |
| IR-07 | M | The sets of exit codes and stop reasons over all parallel fixtures are subsets of the classic sets (PU-03) |
| IR-08 | M | One manifest per phase, verified before the merge check. The parallel plan is a second frozen document with its own hash (PU-15) |
| IR-09 | M | One checkpoint per worker, read from that worker's outbox; an id other than the assigned task is foreign (PU-35) |
| IR-10 | M | The merge check runs in the workspace with no pass of any worker alive (PU-42) |
| IR-11 | M | The protected set of the phase is compared on every delta before integration; an unauthorised change refuses the delta, which is stricter than `tainted` (PU-44) |
| IR-12 | M | Authorisation is per worker: only the launch-time text of the **assigned** task authorises a protected path |
| IR-13 | U | Whatever a worker ran is never a result |
| IR-14 | U | Applies to the merge check as to any check |
| IR-15 | U | |
| IR-16 | M | A result is bound to the fingerprint of the integrated tree in the workspace. No result is bound to a worker tree, since no check runs there (PU-49) |
| IR-17 | U | |
| IR-18 | M | The byte-identity test gains a pair: the same final tree reached serially and through a group gives identical unit evidence (PU-60) |
| IR-19 | M | The refusals gain the worker root and the tree store (PU-62) |
| IR-20 | U | Workers receive no failure block: they make no repair |
| IR-21 | U | A worker session is never handed to a critic-class call |
| IR-22 | U | |
| IR-23 | M | Passes in an attempt are bounded by the iteration limit plus the cycle cap plus the yield cap; each worker pass spends one cycle (PU-68) |
| IR-24 | M | The no-progress test runs on the main line only and excludes the worker root |
| IR-25 | M | One ledger, one writer; group and worker records join the chain (PU-55) |
| IR-26 | M | Group counters survive a resume and a relaunch (PU-64) |
| IR-27 | M | The option, the worker count and the plan hash are pinned at launch and recorded |
| IR-28 | M | Breach conditions gain four (PU-66) |
| IR-29, IR-30 | N | Workers cannot yield (PU-36). On the main line both hold unchanged |
| IR-31 | M | Fingerprints: of the workspace at group start and at the barrier; of each worker tree at creation and at its end; of the workspace before and after the merge check (PU-53) |
| IR-32 | M | Before a worker's snapshot, every process of that worker is ended. Before integration, every process of every worker of the group (PU-42) |
| IR-33 | U | Phase entry is a main-line event |
| IR-34 | M | No group in a run whose gate does not execute; the `parallel` layer needs the micro-loop layer on (PU-02) |
| IR-35 | M | The snapshot scope equals the fingerprint scope, less the workspace part (PU-21) |
| IR-36 | U | Executables are pinned once; the merge check uses them. Workers run no check |
| IR-37 | M | Seeded cache paths are copies; a cache written by a worker is never integrated (PU-24) |
| IR-38 | M | Class A patterns are evaluated on every delta (PU-44) |
| IR-39 | U | Counted on the workspace diff since phase entry, which includes integrated deltas |
| IR-40 | U | |
| IR-41 | M | As IR-12: per assigned task |
| IR-42 | M | Two kinds are added; refused deltas that touched no protected path are not reported (PU-61) |
| IR-43 | M | The group is one unit in the fact block; its tasks are those the kept workers named (PU-60) |
| IR-44 | U | |
| IR-45 | M | As IR-19 (PU-62) |
| IR-46 | U | |
| IR-47 | M | The set of models that produced passes in the attempt includes every worker's model. Workers run the base tier, so the set does not grow (PU-34) |
| IR-48 | M | A worker pass leaves `consec_err`, `consec_cap` and `consec_short` as they were, whatever its end (PU-67) |
| IR-49 | U | |
| IR-50 | M | (a) an interrupted group step is recorded, the second interruption of the same step counts as a cycle; (b) group counters are in the ledger; (d) a failed merge check charges one repair to every task of the unit (PU-50, PU-64) |
| IR-51 | N | As IR-29 |
| IR-52 | M | Inertness of the option: with the option on and no group admitted, output equals that of the option off apart from named fields (PU-04) |
| IR-53 | M | The router's `loop` point may switch the `parallel` layer off for an attempt and never on |
| IR-54 | M | A relaunch compares the newly derived parallel plan with the recorded one; the recorded one applies (PU-15) |
| IR-55 | M | Per worker tree; a checkpoint present in a worker's outbox when its pass starts is removed with an event |
| IR-56 | U | The plan is built from the launch-time reading |
| IR-57 | U | Snapshot ids are in the ledger and so under the ledger key |
| IR-58 | M | Until a group has started in an attempt, nothing differs from the run with the option off (PU-04) |
| IR-59 | U | Grounding refuses the event stream, which now also holds `parallel.*` events |
| IR-60 | M | Kept in its words. Two acts are stated beside it (PU-29, PU-47) and need the owner's word |

Count: U 21, M 36, N 3.

New rules with no ancestor among IR-01 to IR-60: PU-13 (admission recorded per check), PU-20 (store
outside the project's repository), PU-37 (no shared resource), PU-38 (group pause), PU-41 (barrier),
PU-43 (scope audit), PU-45 (single-writer files), PU-47 (application), PU-54 (the workspace is frozen
during a group), PU-56 (one writer process), PU-57 (`seq` under contention), PU-60 (the critic cannot
tell), PU-63 (worker trees removed before any critic-class call), PU-65 (resume states of a group).

### F-11 What the event and ledger writers need `inferred`

From LR-5, R14:231, R14:316 (EV-21), R15v:56-63, R15v:358-363.

- A worker is a harness process. It is a child of the engine, as a pass is today (architecture
  section 4). It writes no control-plane file. The engine reads N streams with N readers inside one
  Node process and appends through one queue. One process is the writer, as LR-5 requires; nothing
  contends across processes.
- What changes is the order of arrival. Records of different workers interleave by wall time, which no
  test can pin. Two optional envelope fields make the stream comparable: `workerId` (absent on the
  main line) and `wseq` (an ordinal per worker pass). The normalizer of the parallel tests orders by
  `(groupId, workerId, wseq)`.
- R15v asked that the append lock of LR-5 be "tested under contention in Wave 1" (R15v:62-63). With
  the writer in process the test is a property test of the queue (PU-57).

## The design

Each rule is `inferred` from the findings and rulings it cites. Numeric defaults have **low
confidence**; they are starting values for E6.

### A. Shape (answers Q1)

| ID | Rule | Test |
|---|---|---|
| PU-01 | Parallel units is an implementation of the loop-layer interface with the id `parallel`. It is registered only when `loop.parallel.units` is `on`. The default is `off`. The `parity` profile sets it `off`. | Launch with defaults and with the `parity` profile: the resolved layer stack holds no `parallel`; `run.json` records `loop.parallel.units=off`. |
| PU-02 | The layer runs only stacked above `micro`. It is off for the run, announced, when any precondition fails: `loop.strategy` is not `micro`; the gate does not execute (IR-34); the workspace is not a git repository, has submodules, or git is older than 2.38; the proposer's adapter does not declare `concurrentSessions`; the plan holds no group. Reasons: `classic`, `gate-not-executing`, `not-git`, `submodules`, `git-version`, `harness`, `no-group`. | One fixture per reason; each prints the reason in the `[LOOP]` line and completes as the same run with the option off. |
| PU-03 | The layer adds no exit code, no stop reason and no run state. Every failure inside a group ends in one of: the task returns to the serial path; the layer is off for the attempt; the layer is off for the run. | The sets of exit codes, stop reasons and run states over all parallel fixtures are subsets of the sets over the same fixtures with the option off. |
| PU-04 | Inertness. With the option off, no service of section C is called and no file of the layer exists. With the option on and no group started in an attempt, prompts, timeouts, runtime commands, events and files equal those of the option off, apart from fields the divergence register names: the run record fields `loop.parallel.*`, the plan file and its hash event, the reserved-tasks prompt block (PU-16), the `parallel=` fields of the `[LOOP]` line. | Every micro-loop fixture run three times: option off; option on with a task list without `[P]`; option on with stubs that tick every `[P]` task serially. Outputs equal after the named fields are removed. |
| PU-05 | EP-04 major 1 contains, beyond R15's eight hooks: (1) **layer stacking**, ordered, depth at most 2 in Wave 1; for each hook the outer layer is called first and the inner one when the outer returns `none`; (2) the directive `requestPass` (prompt block, working directory, session directive, time limit, worker id), executed and accounted by the engine (R15v A-1); (3) the directive `requestPassGroup` (a list of `requestPass`, a concurrency limit), which returns when every pass has ended; (4) the directive `integrateGroup`; (5) **capability negotiation**: a layer declares the directives and services it uses, the engine refuses at registration what it does not offer, the harness port declares `concurrentSessions`; (6) the **tree-store service** of PU-19; (7) `workerId` and `groupId` in the attempt view, and a ledger namespace per layer. | EP-04 conformance: a sample layer in the test tree stacks above `noop`, requests a group of two stub passes, integrates them, and the whole oracle still passes with the sample unregistered. The import-boundary check fails if a core file names `parallel`. |
| PU-06 | Withheld from the layer by construction: every gate writer (IR-01); every outer counter (IR-06, IR-48); a harness handle; the event writer and the ledger writer (it appends through the engine, in its namespace); raw git; any path of the workspace or of a worker tree as a writable handle. | Static: the module graph of the layer package imports `contracts` and `kernel` only, and neither `node:child_process` nor `node:fs` write calls. |
| PU-07 | The engine, not the layer, owns the group executor, the tree store and integration. Their home is feature 142's engine group; the package rule of architecture section 6 applies to `@specstride/layer-parallel` as to `@specstride/layer-micro`. | Import-boundary check. |
| PU-08 | The `strategy` envelope field keeps its two values. A run with the option on records `strategy=micro` and `loop.parallel.units=on`. No closed set of feature 100 gains a value except the fallback reasons of PU-02 and the event types of PU-58. | Schema test over all parallel fixtures. |

### B. Eligibility (answers Q2)

| ID | Rule | Test |
|---|---|---|
| PU-09 | A task is a candidate only if the launch-time reading of the task list (IR-56) carries the marker `[P]` on it. The marker is necessary and never sufficient. | A task without the marker is never assigned to a worker, whatever configuration says. |
| PU-10 | A candidate group is a maximal run of consecutive candidates in launch-time order inside one phase, with no heading and no other task between them. Groups never cross a phase. | The 48-file corpus: the planner's groups equal those of `pscope43.py`. |
| PU-11 | A write scope is a list of path prefixes relative to the workspace root, normalised (no leading `./`, no `..`, no absolute path, no trailing slash), compared with a boundary so that `src/a` does not match `src/ab`. Two scopes overlap when any prefix of one equals or is an ancestor of any prefix of the other. | Table test, including the prefix boundary and a path with `..`, which is refused. |
| PU-12 | A scope comes from one of two sources, in this order: a declaration by the consumer, keyed by task id, in user configuration or in the promoted launch contract; otherwise the paths that the task's own launch-time text names. **An empty or absent list means the whole tree** and overlaps everything. Project configuration may remove a task from eligibility and may narrow a scope; it may not add or widen one (ruling 35). Nothing the proposer writes is a source. | A task with no path is serial. Two tasks with empty lists are serial (the case that Lisa's `taskScopesOverlap` reports as disjoint, F-3). A scope in `specstride.yaml` wider than the derived one is refused with a doctor line. |
| PU-13 | Admission is greedy in task order with the worker cap, as a pure function. Five checks, each recorded with its verdict and detail: `marker`, `scope` (present and disjoint from every task admitted before it), `protected` (the scope holds no single-writer path of PU-45), `resource` (PU-37), `headroom` (PU-39). A task that fails a check is serial; it is never dropped. | Golden decisions on fixture task lists. Property: the same inputs give the same plan; every task of the phase appears in exactly one of a group or the serial list. |
| PU-14 | A group of fewer than 2 admitted tasks is not a group. | Fixture with one eligible task: no worker starts. |
| PU-15 | The plan of every phase is computed at launch, stored in the control plane with its hash, and the hash is an event. It is never recomputed inside a run. A relaunch that derives a different plan announces the difference and uses the recorded plan (IR-54). `launch --dry-run` and the doctor print, per feature, the groups, the tasks made serial with the reason, and the ceiling under equal task cost. | Change one byte of the stored plan: no group starts and the layer is off for the run with an integrity event. Edit `tasks.md` between launch and relaunch: the recorded plan applies. |
| PU-16 | A group starts only at a pass boundary of the main line, with no session open, no yield wait open and no evidence present, and only when every task of the phase that precedes the group in launch-time order is named by a kept unit in the ledger. Until then the main line's prompt holds a block that lists the reserved task ids and asks the proposer to end its pass before them. | Stub that does the preceding tasks and stops: the group starts. Stub that stops early: no group starts. |
| PU-17 | The reservation is a request. When a serial pass names a reserved task in a checkpoint, or the task is ticked in `tasks.md` as read at the boundary, the task leaves its group; a group left with fewer than 2 tasks is cancelled. A tick only ever removes a task from a group. | Stub that works a reserved task serially: the group shrinks; no worker receives that task. |

### C. Workers and worktrees (answers Q3)

| ID | Rule | Test |
|---|---|---|
| PU-18 | The workspace must be inside a git work tree. Otherwise the option is off for the run with the reason `not-git` (002 FR-048, first clause). | Fixture in a plain directory. |
| PU-19 | The tree store is a service of the engine with a closed set of operations: `snapshot(directory) → treeId`; `materialize(treeId) → worker tree`; `changed(base, tree) → paths with kind`; `merge(base, trees in order) → treeId or conflict with paths`; `apply(base, merged, workspace)`; `release(worker tree)`; `sweep()`. It offers no restore, reset or checkout of the workspace. | Service conformance with scripted trees. The interface has no operation that can write a workspace path outside `apply`. |
| PU-20 | The store is a bare repository in the control plane, per run. It reads the project's objects through an alternates entry and writes none. No operation of the store or of the layer writes any file under the project's `.git`, creates a ref there, or changes the project's index. | Hash every file under the project's `.git` and the output of `git status --porcelain` before a group and after it: equal (the probe of F-6 as a test). |
| PU-21 | A snapshot covers exactly the fingerprint scope of IR-35 (tracked files with their uncommitted changes, and untracked files that are not ignored), less the workspace part `.specstride/`. It is taken with an index of its own. The base snapshot of a group is taken at group start, after the main line's processes have been ended (IR-32). | The base snapshot of a dirty fixture lists the modified and the untracked file and no ignored file. |
| PU-22 | Worker trees live in the **worker root**, `$XDG_CACHE_HOME/specstride/workers/<workspace-id>/<runId>/<groupId>/<workerId>/`, directories `0700`. The worker root is outside the workspace and outside the control plane. Feature 100's table of logical names gains `worker-root` and `tree-store`. | Path test on Linux; macOS `unverified` (ruling 67). |
| PU-23 | A worker tree is created with `git worktree add --detach` in the store, from the base snapshot. A worker's own commits, refs or stashes in its tree have no effect: the delta is taken from the files (PU-41). | A stub worker that commits, resets and stashes: the delta equals the file difference. |
| PU-24 | Ignored paths are absent from a worker tree. A toolchain profile (EP-16) or user configuration may name **seed paths**; each is **copied** into every worker tree before the pass, by reflink where the file system offers it. A seed path is never linked and never shared writable. Nothing under a seed path or under any ignored path is part of a delta. | A stub worker that rewrites a seeded dependency directory: the workspace's copy and the sibling's copy are unchanged. |
| PU-25 | Each worker tree receives a workspace part of its own: an empty outbox and a handoff written by the runtime that names the assigned task, the scope and the base fingerprint. The evidence file, the notebook and the main line's outbox are not copied. | File listing of a new worker tree. |
| PU-26 | A worker runs at the strongest containment its harness offers (ruling 34), with its tree as the write root. At C2 and above the sandbox denies writes to the workspace, the sibling trees, the control plane and the store. At C0 and C1 the run record and the `[LOOP]` line say `protection=detect`, and PU-53 and PU-54 are the control. | Adapter call record per worker: working directory and write root equal the worker tree. |
| PU-27 | Clean-up. Before a worker tree is created, a stale tree of the same run, group and worker is removed (002 FR-048, second clause). At group close every worker tree of the group is removed, on success and on failure. At engine start a sweep removes every worker tree that no open group in the ledger owns. Snapshots of refused or killed workers stay in the store until the attempt ends, for the operator; the store is removed when the run ends. | Kill the engine with SIGKILL in the middle of a group, relaunch: the sweep removes exactly the trees of groups the ledger has closed. |
| PU-28 | Each worker gets `TMPDIR` inside its tree's ignored area, `SPECSTRIDE_WORKER_ID` and `SPECSTRIDE_WORKER_INDEX`. The runtime promises no port range and no lab. | Environment of the adapter call record. |
| PU-29 | **Ruling 50, as applied.** The runtime never commits to, reverts, resets, cleans or checks out the workspace inside an attempt. Snapshot commits exist only in the store. *This rule needs the owner's statement that commit objects in a store the runtime owns are not commits in the sense of ruling 50*, and a divergence register row. | As PU-20. |
| PU-30 | Disk. A group is admitted only when the free space of the worker root's file system is at least the size of the base snapshot plus the seed paths, times the worker count, times 2. Otherwise the tasks are serial with the reason `headroom`. | Fixture with a small quota on the worker root. |

### D. Harness sessions (answers Q4)

| ID | Rule | Test |
|---|---|---|
| PU-31 | `loop.parallel.workers` defaults to 2 and has the ceiling 4 in Wave 1. A configured value above 4 is a configuration error at launch. Basis: F-2. | Launch with 5: refused with the doctor line. |
| PU-32 | One harness process per worker, in its own process group, registered in the process registry as `owned` with pid, start time, run token and worker id. The group executor starts at most `workers` processes at a time. | Process registry during a group of 4 with `workers=2`: never more than 2 live worker entries. |
| PU-33 | Every worker pass is a fresh session with a minted id. No session is continued into a worker or out of one. After a group has been applied, the next main-line pass is a fresh session: the tree was changed by another writer. This adds one drop rule to R24's ten. Session state of a worker lives under the attempt, per worker, and is removed when the group closes (ruling 36). | Adapter call records: `fresh` on every worker and on the first main-line pass after an applied group. |
| PU-34 | A worker runs the base tier of the proposer's harness and model as resolved at launch. No escalation happens inside a worker. IR-47 is evaluated over the models of all passes of the attempt, workers included. | Call records. |
| PU-35 | A worker makes **one proposal**: one pass that ends at a checkpoint naming its assigned task. No repair and no check take place in a worker tree. A checkpoint that names another task, that is absent, or that was written by a killed pass gives the worker the outcome `refused`. A worker is restarted once in the same tree, in a fresh session, only after an interruption it did not cause: an engine crash, a relaunch, a quota pause. | Stubs: a foreign id; no checkpoint; a kill; an engine crash during the pass. |
| PU-36 | A worker cannot yield. A yield artifact in a worker's outbox is refused with an event and the worker's outcome is `refused`. A process that a worker left behind is ended at the barrier (PU-42); no job of a worker is `adoptable`. | Stub worker that writes a yield and starts a process in a session of its own: the yield is refused; the process is ended or the group is void (PU-42). |
| PU-37 | A phase in which a manifest command, a declared job or the launch contract names an exclusive `resource` has no group, unless user configuration gives that resource a capacity of at least the worker count. The doctor names resources it cannot check (ports, labs). | Fixture whose verification plan declares `resource: lab`: the plan holds no group for the phase, reason `resource`. |
| PU-38 | **A pause pauses the group.** On a `quota_window` classification from any worker, with the confidence rules of R14, the engine starts no further worker, sends the polite stop to every live worker of the group, closes their passes with the cause `quota_pause`, keeps their trees, writes the one `pause.record` and emits `run.paused` once. The pause spends no cycle, no worker restart, no time cap and no budget (ruling 27). On `run.resumed` each unfinished worker gets a new pass in its tree. After a reboot, `resume` does the same (ruling 28). | Stub worker that emits the limit signal while a sibling works: one `run.paused`; both passes end with `quota_pause`; after the resume both finish; every counter equals its value before the pause. |
| PU-39 | Headroom. A group is admitted only when (a) the last observed utilisation of every quota window of the proposer's account is below `loop.parallel.quota_headroom`, default 70 %, or none has been observed; (b) under a hard cap, the remaining budget of the role is at least the worker count times the p90 cost of the attempt's passes so far, or of the run's when the attempt has none. A rate limit classified `rate_limit_transient` on two workers of one group halves the worker count for the rest of the attempt. | Fixtures with utilisation 80 %, with a nearly spent cap, and with two transient limits. |
| PU-40 | The option needs a tested adapter that declares `concurrentSessions`: several processes may run at once under one configuration home and one login, with separate session stores. A discovered or unverified harness never runs a group; the fallback is announced (decision 21, sixth fixed point). No requirement names a harness. No group starts once evidence exists in the attempt. | The descriptor-only fixture with the option on completes with `parallel=off reason=harness`. |

### E. Merge and the merge check (answers Q5)

Order is fixed. Every step is deterministic and run by the engine. No model takes part.

| ID | Rule | Test |
|---|---|---|
| PU-41 | **Barrier.** Integration starts when every worker pass of the group has ended. For each worker, after its processes have been ended, the engine takes the final snapshot of its tree and records the tree id in the ledger before any other step. | Ledger order in every group fixture: `worker_ended` for all, then `group_barrier`. |
| PU-42 | Before the barrier closes, every process of every worker of the group that the runtime can identify is ended: process group, session, and the sandbox or cgroup where one exists. Where it cannot guarantee that none remains, `protection=detect` is stated and PU-53 is the control. No check and no gate command runs while a worker process is known to live. | Stub worker that leaves a process in a session of its own: it is ended, or the run states `protection=detect`. |
| PU-43 | **Scope audit.** For each worker with a valid checkpoint, the paths of its delta (added, changed, deleted, mode changed) must each lie inside its scope. A symbolic link whose target resolves outside the tree is a violation. One violation gives the worker the outcome `refused`. The audit reads the store and nothing in a worker's directory. | Stub workers: a path beside the scope; a lock file at the root; a link to `/etc`; a deletion outside the scope. |
| PU-44 | **Protected-set audit.** A delta that changes, adds or deletes a path of class A (by pattern, IR-38) or class B without authorisation from the launch-time text of the worker's **assigned task** is `refused`. An authorised change is integrated and becomes a fact row as on the serial path. | Stub worker that edits the runner configuration; one that adds a start-up file matching a class A pattern; one whose task text names the test file it changes. |
| PU-45 | **Single-writer files** are never part of a delta: the task list, the evidence file, the notebook, the handoff, anything under the workspace part. They are excluded from the snapshot scope or dropped from the delta, and a change to one by a worker is not a violation. | Stub worker that rewrites the notebook: nothing of it reaches the workspace. |
| PU-46 | Checkbox edits are re-applied by the runtime. For each integrated worker whose delta ticked the line of its assigned task, the runtime ticks that task through the spec-format adapter's `tick`. Any other change to the task list by a worker is dropped. A tick remains the worker's claim. Basis: edits on adjacent lines conflict (F-6). | Group of three consecutive tasks, every worker ticks its line: three ticks in the workspace, no conflict. |
| PU-47 | **Mechanical merge and application.** Deltas are merged in launch-time task order, never in order of completion, with `merge-tree` in the store. The first delta that conflicts is `refused`, and so is every later one of the group. The merged tree of the accepted prefix is applied to the workspace only if the workspace's fingerprint equals the base snapshot's (PU-54). Application writes and deletes exactly the paths of the merged delta, touches no index and no ref, and is recorded write-ahead. *This is the only act by which the runtime writes project files inside an attempt; it needs the owner's statement beside ruling 50 and a divergence register row.* | Three workers of which the second conflicts: the first is applied, the second and third are `refused`. The workspace after application equals the merged tree in the snapshot scope. |
| PU-48 | **Merge check.** After application the engine runs the inner check set of the phase on the workspace: every command, none skipped at a failure (ruling 51), with the fingerprints of IR-31 before and after, through the check runner, exactly as an inner check of the micro-loop layer. It runs once per group, whatever the worker count. | One `check.started` and `check.ended` per manifest command per group. |
| PU-49 | Outcome of the merge check. Pass without condition: the integrated tasks form **one kept unit**, a ledger record bound to the workspace fingerprint, naming the tasks that the integrated workers named. Failure or condition: the same unit takes the repair path of the micro-loop layer on the main line, unchanged (R27 D1.6). Nothing is reverted. | Group whose merged tree fails a test: the next pass is a serial repair pass with the check output; the workspace still holds the integrated work. |
| PU-50 | A failed merge check charges one repair to every task of the unit (IR-50 d). A `refused` worker charges nothing to its task; the task returns to the serial path with its counts as they were. | Ledger counters after both cases. |
| PU-51 | No result obtained in a worker tree, and no merge check, replaces an execution at the verification gate. The gate runs in full on the workspace after the proposer loop has ended, and the critic is called after it (decision 21, second fixed point). | Group fixture: one execution record per gate command, none with `reusedFrom`. |
| PU-52 | Group failures: a group in which any worker was `refused` or killed, or whose merge check failed, counts as one. After 2 in an attempt the layer is off for the attempt and the micro-loop layer carries on serially. A failed application (PU-65, state 6) switches the layer off for the run. Each is an event with its reason; none stops a run. | Two failing groups, then an eligible third: no worker starts. |

### F. Gate integrity with several workers (answers Q6)

| ID | Rule | Test |
|---|---|---|
| PU-53 | Fingerprints of a group, all recorded in the ledger: (a) the workspace at group start, equal to the base snapshot; (b) each worker tree after creation, equal to (a) in the snapshot scope; (c) each worker tree at its end, which is its final snapshot; (d) the workspace at the barrier; (e) the workspace after application, equal to the merged tree; (f) and (g) the workspace before and after the merge check (IR-31). The protected set is compared at (d) against (a). | Each equality is asserted in every group fixture; each has a fixture that breaks it. |
| PU-54 | **The workspace is frozen during a group.** No main-line pass, no check and no job of the runtime runs in it between (a) and (d). If (d) differs from (a), nothing is applied, every worker of the group is `refused`, the group counts as failed, and the integrity event `workspace-changed-during-group` is raised. | Stub worker at C0 that writes a file into the workspace: nothing is integrated; the event exists; the critic's fact block carries the kind. |
| PU-55 | **One ledger.** Group and worker records join the run's one ledger: append-only, chained, signed with the ledger key (IR-25, IR-57). Records are written ahead: `group_planned`, `group_started`, `worker_started`, `worker_ended`, `group_barrier`, `audit_done`, `merge_done`, `apply_started`, `applied`, `merge_check_started`, `merge_check_finished`, `group_closed`. Every worker record carries `workerId`. | Truncate, reorder or edit the ledger inside a group: detected; the layer is off for the attempt. |
| PU-56 | **One writer process.** The engine process is the only writer of the event file, the ledger and every control-plane file of the run, with workers live or not. A worker is a harness process; no runtime code runs in a worker tree, and no process with a worker tree as working directory holds a handle on the control plane. | Static: the group executor is in the engine package. Dynamic: `lsof`-style check in the group fixture finds no writer other than the engine. |
| PU-57 | **`seq` under contention.** Records from N stream readers pass one in-process queue; `seq` is assigned at the append, monotonic and without gaps. Within one worker, records keep the order of its stream. The envelope gains two optional fields, `workerId` and `wseq`; both are absent on the main line. | Property test: 4 stub streams of 10,000 records each at random intervals; the file has 40,000 lines, `seq` is 1 to 40,000, no torn line, `wseq` rises within each `workerId`. The same with the engine killed mid-run: readers tolerate the torn last line only. |
| PU-58 | Events of the layer: `parallel.plan` (hash, groups), `parallel.admission` (task, verdict per check), `parallel.group.started` and `.ended` (outcome), `parallel.worker.started` and `.ended` (outcome `integrated`, `refused` with the reason, `killed`, `paused`), `parallel.integration` (step, paths counted, no path text beyond the redaction rules). All are new-only: the legacy projection maps them to nothing. R14 owns the names. | Schema tests; the legacy projection of a group fixture holds no line from them. |
| PU-59 | Pass identity. Every worker pass has a `passId` and an ordinal that is unique in the attempt. Ordinals are assigned at group start in task order, so they do not depend on timing. | Two runs of one group fixture with different stub delays: equal ordinals. |
| PU-60 | **What the critic sees.** The fact block is built as R27 D1.12 builds it, from the workspace and the ledger's kept units. An integrated group appears as one unit whose id is the hash of its sorted task ids, with the merge check's results per command and tree. The block holds no worker id, no group id, no worker count, no outcome of any worker, no order of integration, and no word that distinguishes a group from a serial unit that named the same tasks. | Two fixtures that end in the same tree and the same kept units, one serial and one through a group with a refused third worker: byte-identical critic prompts. |
| PU-61 | Integrity events reach the critic by kind and without count (IR-42). The layer adds two kinds: `workspace-changed-during-group` (PU-54) and `protected-change-refused` (a delta refused by PU-44). A delta refused for scope alone, a conflict, a killed worker and a failed merge check are scheduling and repair history and are withheld (decision 21, fourth fixed point). | Fact block of fixtures for each case. |
| PU-62 | Grounding refuses, by real path, the worker root and the tree store, as it refuses the control plane (IR-19, IR-45). The rule is independent of the option and applies with it off. | Evidence that cites a file of a worker tree by absolute path and through a link: not grounded. |
| PU-63 | No worker tree exists when a critic-class call starts. Before such a call the engine verifies that every group of the attempt is closed and the worker root of the run is empty. With a critic that holds read tools (ruling 57a), the sandbox also denies reads of the worker root and the store (D1). | Force a critic call with a leftover tree in the test harness: the call is delayed until the sweep has removed it. |
| PU-64 | Counters of the layer, all in the ledger, all continuing after a resume or a relaunch (ruling 9): groups started and failed per attempt; per worker, passes started and restarts used; cycles spent. The reset flag of decision 23 resets them with the others. | Stop and resume in each state of PU-65: the counts continue. |
| PU-65 | **Resume and relaunch in the middle of a group.** The last ledger record decides. (1) `group_planned`: start the group. (2) `group_started` or `worker_started` without `worker_ended`: end the recorded processes of that worker after the identity check (R11 T-26); its pass is lost; restart it in its tree if its restart is unused, otherwise `killed`. (3) `worker_ended`: its snapshot is in the store; verify the id against the ledger. (4) `group_barrier`, `audit_done` or `merge_done`: verify the workspace against fingerprint (a) and repeat from the audit, which is deterministic. (5) `apply_started`: for every path of the merged delta the workspace must hold either the base content or the merged content; then the application is repeated in full. (6) If a path holds neither, nothing more is written, the layer is off for the run, the event `apply-incomplete` is raised and reaches the critic, and the micro-loop layer carries on from the tree as it is. (7) `applied` or `merge_check_started`: run the merge check; an interrupted check is handled by IR-50 (a). Every session after a relaunch is fresh (ruling 55). | Kill the engine with SIGKILL after each of the twelve records; relaunch; each run ends in the same workspace tree and the same kept units as the uninterrupted run, or in state 6 with its event. |
| PU-66 | A breach of gate integrity (IR-28, for the revert rule of decision 21 and the tripwire of ruling 42) is also: a delta applied that did not pass PU-43 and PU-44; a workspace after application that differs from the merged tree; a kept unit recorded for a merge check that ran while a worker process was known to live; a critic-class input that holds a field PU-60 withholds. A detected and refused attempt is an event and not a breach. | Each condition is an invariant checked on every run's event log by the doctor and in CI. |

Kills and watchdogs. Each worker pass has the watchdogs of a pass (idle, progress, repeat-stall) and
the proposal cap of 20 minutes (R27 D1.5); a kill is delivered to that worker's process group only,
polite stop first. A group has the unit cap of 30 minutes of wall time from group start to the end of
the merge check, quota pauses excluded; when it is hit, live workers are killed, the workers that
ended are integrated, and the group counts as failed. `stop --now` signals every recorded worker
group after the identity check.

### G. Accounting (answers Q7)

| ID | Rule | Test |
|---|---|---|
| PU-67 | A worker pass is outside the iteration loop. It takes no iteration, changes no reject count, no attempt number, no MALFORMED streak, no oscillation input, and leaves `consec_err`, `consec_cap`, `consec_short` and the no-progress counter as they were, whatever its end. | Snapshot of the counters of IR-06 and IR-48 before and after every group fixture: equal. |
| PU-68 | Each worker pass that started spends one cycle of the micro-loop layer's cycle cap, integrated or not. A group is admitted only if the remaining cycles are at least its worker count. | A phase with many groups and a small cycle cap: groups stop when cycles run short, and the serial path carries on. |
| PU-69 | Time caps count wall time. The run's wall-clock budget and the attempt's elapsed time advance once per second whatever the worker count. Paused time is excluded (ruling 27). | Group of 4 stub workers of 10 minutes each: the attempt's elapsed time grows by about 10 minutes. |
| PU-70 | The inner-check budget of 15 % of the attempt's elapsed time (R27 D1.5) includes, for every group: snapshots, fingerprints of worker trees, audit, merge, application, the merge check. On a breach the layer's rule applies (the slowest command is excluded) and no further group is admitted in the attempt. | Fixture with slow snapshots. |
| PU-71 | A worker pass ended by any time limit or watchdog counts as a killed pass for the 50 % target of decision 21, in every arm (ruling 5). Reports give the count, the agent hours and the wall hours of killed passes. | The kill metric of a group with one killed worker is 1. |
| PU-72 | Every report and the `[LOOP]` line give both **wall hours** and **agent hours** (the sum over passes) when the option is on. The `[LOOP]` line gains, only then: `parallel=on|off`, `workers=`, `groups=`, `group-failures=`, `refused=`, and the reason of PU-02. Usage is counted per model call per worker (X0 of R27 is a precondition). | Line grammar test; the sum of `usage.reported` over workers equals the group's total. |

### H. Concurrent verification commands (answers Q8)

The second option of ruling D2. It belongs to feature 105 and EP-05, not to the `parallel` layer; the
rules are stated here because no report designed it beyond R26's recommendation 2 (R26:151).

| ID | Rule | Test |
|---|---|---|
| PU-73 | `verification.parallelism` defaults to 1, has the ceiling 4, and is 1 under the `parity` profile. It applies to the gate and to inner checks alike, since both use one runner. | Configuration tests. |
| PU-74 | A command may run beside another only if the frozen manifest carries, for it, `sideEffects: none` or a list `writes[]`, read at launch from the sources the verification gate uses. A command without either is run alone. Two commands run together only if their `writes[]` are disjoint (PU-11) and no toolchain profile marks a cache they share as exclusive. Batches are formed in manifest order, greedily. | Manifest fixtures; a command without a declaration never shares a batch. |
| PU-75 | Isolation. Commands of a batch run in the same tree, each in its own process group, with its own `TMPDIR`, its own captured-output file with its own cap, its own time limit, and the environment allow-list of IR-10. | Two commands that print 10 MB each: two capped files, no interleaving. |
| PU-76 | One fingerprint pair brackets a batch (IR-31). If a path changed that lies outside the union of the declared `writes[]` and outputs, every command of the batch carries `tainted` with the reason `changed-during-check`, since the change cannot be attributed; the manifest's parallelism is 1 for the rest of the run, with an event. | A command declared `sideEffects: none` that writes a file. |
| PU-77 | Every command of a batch runs to its end. No command is cancelled because another failed (ruling 51; IR-03 as amended). The first-failure predicate concerns jobs of a yield and has no effect here. The step runner's steps are never concurrent. Results, the failure signature of IR-53 and the fact block are ordered by manifest position, never by completion. | A batch whose first command fails at once: the second runs to its end; two fixtures with opposite completion orders give equal signatures. |
| PU-78 | One `check.started` and one `check.ended` per command, with `batchId`, the slot, the duration and the result, through the one writer. A duration measured in a batch of more than one command is flagged `concurrent` and is never used for the `slow` exclusion or as a learned duration. | Event schema test. |

### Beside the micro-loop layer

R27's design is unchanged. The `parallel` layer adds to a run, only with the option on:

| Place | Addition |
|---|---|
| Prompt of a main-line pass | The reserved-tasks block (PU-16), through EP-15 |
| Drop rules of session continuation | One rule: fresh after an applied group (PU-33) |
| Kept units | A group is one unit, produced by integration and not by a checkpoint of the main line (PU-49) |
| Repairs | A failed merge check enters the repair path as a failed check of that unit (PU-49, PU-50) |
| `[LOOP]` line | The fields of PU-72 |

Everything else of D1.1 to D1.13 applies as written: the manifest, the protected set, the caps, the
closing check, the fact block, the router, the fallback rules.

## What stays out of Wave 1 (answers Q10)

| Item | Why | Returns with |
|---|---|---|
| Feature parallelism across workspaces | Independence of features is undeclared and unmeasured (R26:141, R26:166) | A contract that declares features independent |
| A phase graph | The graph exists in prose only; one lab serialises the reference project (R26:56-57) | A machine-declared `depends_on` per phase |
| Selection among N candidates | 1.2 to 1.3 times faster at 1.5 to 1.6 times the cost on the Claude population (R26:102) | Diverse backends; the attempt planner seam (EP-18) |
| Overlap of a check with the next unit | No check duration exists yet (R26:113) | Data from X5 |
| Repairs, checks or escalation inside a worker | Each multiplies the state a resume must handle | Data from E6 |
| Integration of a killed worker's partial work | A half-written delta can fail the merge check of its siblings | Data from E6 (open question 4) |
| Lisa's safety predicate as a general admission function, batch admission across jobs (002 FR-039, FR-040) | PU-13 is the subset a group needs | Feature parallelism |
| Queue, idempotency key, crash recovery of the queue, cron (002 FR-043, FR-044, FR-045, FR-047) | One run per workspace; lock and resume cover it (R26:76-78) | A multi-workspace supervisor |
| Budgets and stop (002 FR-041, FR-042, FR-046) | Not parallelism; extracted elsewhere per R1 and R26:75-77 | — |
| Lisa's model "system-level critic" after a merge (`integration.ts:134`) | A second model judge between the merge and the phase critic; decision 21 allows deterministic checks only | Not planned |
| A model that resolves a conflict | Excluded by PU-47 | Not planned |

## Savings and cost (answers Q9)

Against R21's baseline as confirmed by R21v, in the two strata of R27 F-1.

| Quantity | Value | Label |
|---|---|---|
| Ceiling on proposer time, R26's method (order-free, unbounded) | pooled 1.30, median 1.18 | [M], R26:43 |
| Ceiling with task order, unbounded, `[P]` alone | pooled 1.208, median 1.125 | [E], F-2 |
| Ceiling with the eligibility rule, 2 workers | pooled 1.063, median 1.038, p90 1.190 | [E], F-2 |
| Ceiling with the eligibility rule, 4 workers | pooled 1.094, median 1.052, p90 1.314 | [E], F-2 |
| End to end, default, before any cost | 3.0 % of alive time (Claude baseline), 4.1 % (ORD), 2.0 % (LONG) | [I], F-2 |
| Central estimate after snapshots, integration, refused workers and failed groups | 1 to 3 % of alive time on ORD; under 2 % on LONG | [I]; no run exists |
| Saving on the 82.0 h of detached waits | 0 h | [M], R26:112 |
| Check time | One merge check replaces the N inner checks of the serial path, so check time per integrated task falls by up to (N − 1)/N | [I] |
| Tokens per group beyond the serial path | Up to N first-turn prompts of 65 to 108 k written to the cache instead of read: 130 to 216 k at N = 2 | [I], F-8 |
| Tokens per refused or killed worker | One pass, wasted | [I] |
| Quota | The window is consumed up to N times faster while a group runs | [I] |
| Money | Not stated (F-8) | — |

Every assumption of the ceiling favours parallelism: equal task cost, no coordination cost, every
derived scope honest. The effect expected for a whole run is below what 48 paired phases can resolve:
a true effect of 10 % needs 169 to 611 pairs (R27:206-210).

**When the option is worth switching on** `inferred`:

1. The plan printed by `launch --dry-run` (PU-15) shows a ceiling of 1.2 or more for the feature, or
   a phase with a group of 4 or more tasks. In the corpus, about one file in ten reaches 1.19 at two
   workers.
2. The phase's time is proposer time: no long detached job and no shared lab.
3. The harness has a sandbox (C2), so that scopes are prevented and not only detected.
4. Quota is not the binding limit: an API key with a cap that has room, or a subscription window
   observed well below the headroom.
5. Elapsed time matters more to the consumer than tokens.

Where these do not hold the option costs tokens and buys nothing.

### Experiment E6

| | E6 Parallel units |
|---|---|
| Question | Does the option shorten eligible phases at a cost and a gate quality no worse than the serial default, and may it ever be a default? |
| Precondition | X0 of R27 has passed (usage counted for every pass, killed ones included). PU-57 and PU-65 pass on stubs |
| Metrics | (a) wall hours alive per approved phase; (b) agent hours per approved phase; (c) cost per approved phase, every pass counted; (d) first-attempt approval rate, and unmet criteria found by an audit critic after approval; (e) share of groups failed, split into scope refusal, protected refusal, conflict, kill, failed merge check; (f) passes ended by a time limit, count and hours; (g) integration and merge-check time as a share of the attempt |
| Baseline | Arm S: the default configuration of R27 (arm M), `loop.parallel.units` off. For (a): 1.22 h median per approved phase (R21:318). For (e): none exists |
| Fixtures | **FX-PAR-S**, stubs, no cost: synthetic task lists shaped like the 48-file corpus and like NETOPS `004`, scripted workers with seeded scope violations, conflicts on adjacent lines, a semantic conflict that merges cleanly and fails a test, a worker killed at the cap, a quota signal, an engine kill after each ledger record. **FX-PAR-L**, live: the phases of FX-ORD (R27:579) whose plan has a ceiling of at least 1.15 at two workers, fixed before the first run |
| Arms | S (serial), P2 (2 workers), P4 (4 workers). Same commit, spec, harness version, model, effort and budgets; verification mode `required`; every phase starts from the same snapshot in every arm; arm order rotates by phase (S P2 P4, P2 P4 S, P4 S P2) |
| Size | FX-PAR-S once per release candidate. FX-PAR-L: at least 24 valid phase triples; a triple is void if any arm met a harness outage |
| Pass mark for keeping the option in the product | FX-PAR-S: every rule's test passes; no breach of PU-66. FX-PAR-L: (d) within 5 points of S; no breach |
| Pass mark for ever proposing it as a default | All of: (a) P2 at least 15 % lower than S on FX-PAR-L, with a one-sided 90 % interval that excludes 0; (a) at least 5 % lower over the whole of FX-ORD, eligible or not; (c) no more than 5 % above S; (d) within 5 points; (e) at most 15 % of groups failed; (f) no higher than S; zero breaches. P4 is reported and cannot by itself carry the mark |
| Decision rule | If the mark is missed the option stays an option, off by default. A breach of gate integrity that involves the layer removes the option from the next release and triggers the tripwire of ruling 42 |
| Cost | FX-PAR-S none. FX-PAR-L: three arms over the eligible phases; by F-2 about one phase in ten of FX-ORD is expected to qualify, so about 5 phases of the 47; 24 triples need further projects. `inferred` |

## Feature brief material for 142-parallel-units (answers Q11)

Directory: `specs/142-parallel-units`. Tier 2. Estimated requirements: 41.

### 1. Scope

**In scope.** The `parallel` loop layer; the parallel plan and its admission checks; the pass-group
executor; the tree store and the worker root; worker trees, their seed paths and their clean-up (002
FR-048); worker sessions and their limits; the group pause; the barrier, the scope audit, the
protected-set audit, the mechanical merge, the application, the merge check; the ledger records and
resume states of a group; the events and the `[LOOP]` fields of the layer; the integrity rules PU-01
to PU-72; experiment E6.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| EP-04 itself: stacking, the two directives, capability negotiation, the tree-store interface | 100 (contract), 103 (hook points) |
| The micro-loop layer, the manifest, the protected set, fingerprints, the fact block | 115 |
| The check runner and concurrent verification commands (PU-73 to PU-78) | 105 |
| Watchdogs, kills, the polite stop, the process registry | 118, 122 |
| The quota classifier, the pause record, budgets | 127 |
| The event envelope (`workerId`, `wseq`) and the event names | 111 |
| The `concurrentSessions` capability of the harness port; its value for Claude | 109, 125 |
| Grounding refusals of the worker root and the store | 117 |
| Everything in the table "What stays out of Wave 1" | Roadmap |

### 2. As-is requirements received

002 FR-048, from `deferred 3+` to `translated` (F-7). No behaviour item of 028 or 011. Lisa's
`integration.ts` has no requirement in 002 (R26:80); its demotion policy is not carried.

### 3. Requirement groups and estimate

| Group | Content | Rules | Est. |
|---|---|---|---|
| **G-A, the layer and its plan** | Switches, preconditions and fallback reasons, inertness, eligibility, scopes, admission, reservation, limits, headroom, accounting, reporting | PU-01 to PU-04, PU-08 to PU-17, PU-31, PU-37, PU-39, PU-40, PU-52, PU-67 to PU-72 | 15 |
| **G-B, the engine services** | The group executor, the tree store, worker trees, seed paths, clean-up, sessions, the group pause, the barrier, the merge, the application, resume states, the single writer | PU-05 to PU-07, PU-18 to PU-30, PU-32 to PU-36, PU-38, PU-41, PU-42, PU-47, PU-55 to PU-59, PU-64, PU-65 | 16 |
| **G-C, integrity of integration** | The audits, single-writer files, the merge check and its outcome, fingerprints of a group, the frozen workspace, what the critic sees, grounding, breach conditions | PU-43 to PU-46, PU-48 to PU-51, PU-53, PU-54, PU-60 to PU-63, PU-66 | 10 |

Total about 41. It stays below the split mark of about 45 (feature-briefs B.3). If
`speckit-specify` yields more, G-B splits off as the engine-service feature.

### 4. Contracts

| Depends on (feature 100) | Version |
|---|---|
| EP-04 loop-layer interface, with the seven items of PU-05 | `specstride.loop-layer/1` |
| EP-05 check runner | `specstride.check-runner/1` |
| EP-02 harness port: `concurrentSessions`, containment level, polite stop | `specstride.harness/1` |
| EP-03 canonical spec model: task ids, markers, `tick` | `specstride.spec-format/1` |
| EP-12 quota classifier; the pause record | `specstride.quota-classifier/1` |
| EP-15 prompt block provider (the reserved-tasks block, the worker block) | `specstride.prompt-block/1` |
| EP-16 toolchain profile (seed paths, exclusive caches) | `specstride.toolchain/1` |
| Check manifest; fact block; ledger | `specstride.manifest/1`, `specstride.fact-block/1`, `specstride.ledger/1` |
| Event envelope | `specstride.event/1` |
| CLI protocol and line grammar (`[LOOP]`) | protocol 1 |

**Owns (content):** the implementation `parallel` of EP-04; the parallel plan
(`specstride.parallel-plan/1`); the tree-store service's implementation; the logical names
`worker-root` and `tree-store`.

### 5. Divergence register rows needed

Numbers are for the register's owner to assign; the register ends at DV-078 today.

| # | As-is | New | Oracle treatment |
|---|---|---|---|
| 1 | No parallel work inside a phase (028); Lisa's scheduler unwired | Parallel `[P]` units, an option, off by default | **Not observable**: off under the `parity` profile (ruling 56) |
| 2 | 002 FR-048: `git worktree add -B` from `HEAD` in the project's repository | `--detach`, from the attempt's snapshot, in the runtime's tree store | Characterization test of the two kept clauses |
| 3 | The runtime writes project files only at the approval commit (IR-60) | The application of an integrated delta (PU-47) | Not observable; needs the owner's statement |
| 4 | — | Snapshot commits in the runtime's store (PU-29) | Not observable; needs the owner's statement |
| 5 | Verification commands run one after another (`lib/verification_plan.py:1623-1656` as cited at R23:152-153) | Concurrent commands, an option, default 1 | Not observable under `parity` |
| 6 | — | The named fields of PU-04, PU-57 and PU-72 | Listed by name, as DV-016 to DV-020 are for the layer |
| 7 | Ten drop rules of continuation | An eleventh (PU-33) | Not observable: continuation is off under `parity` |

### 6. Tests required

| Kind | Content |
|---|---|
| Parity | None of its own. The parity suite runs with the option off |
| Inertness | PU-04: every micro-loop fixture, three ways |
| Own tests | One per rule PU-01 to PU-72; the engine killed after each of the twelve ledger records (PU-65); the contention property test (PU-57); the project's `.git` hashed before and after (PU-20) |
| Conformance | EP-04: the stacked sample layer (PU-05). Tree-store service conformance |
| Characterization | 002 FR-048: refusal of a non-git workspace; removal of a stale worktree |
| Platform | Linux. macOS is `unverified` and must pass before release (ruling 67): reflink copies, process groups, the worker root's location |
| Experiment | E6 |

Success criteria the feature carries:

| Criterion | Measure |
|---|---|
| Off means absent | PU-04 |
| The project's repository is never written inside an attempt | PU-20 |
| No model merges | No model call between `group_barrier` and `merge_check_finished` in any run's events |
| The critic cannot tell | PU-60 |
| A run survives a crash in any state of a group | PU-65 |
| A quota pause holds every worker | PU-38 |

### 7. Constitution

Principles that bind the feature (draft v3.0.0): I, II, III, VIII, XI, XIII, XIV, XVII, XVIII, and the
new XX below.

Lisa's Principle VIII, "Deterministic Parallelism" (`/root/lisa/specs/memory/constitution.md:97-102`),
was left out of v3 because "agent parallelism is not in Wave 1", to return "with the roadmap item that
introduces parallelism" (`constitution-amendment.md:66`). Ruling 56 introduces it. **It must come
back**, as a new principle XX in Part B, not marked non-negotiable, because it binds two options that
are off by default. Its last sentence in Lisa, "system-level criticism follows every parallel group",
is replaced: the phase critic is the only critic.

Proposed text:

> #### XX. Deterministic Parallelism
>
> Work runs concurrently only where the runtime has shown, before the work starts and without a
> model, that it may.
>
> - **A marker is a claim.** `[P]`, a declared write scope and a declared side-effect-free command
>   are claims. Work without a scope is serial. A scope that overlaps another is serial.
> - **Every admission is recorded**, with the verdict of each check: marker, write scope, protected
>   paths, shared resources, quota and budget headroom.
> - **Each worker has a tree of its own**, outside the workspace and outside the control plane. What
>   a worker changed is compared with its scope before anything is integrated.
> - **No model merges.** Integration is mechanical and in declared order. A conflict or a violation
>   returns the work to the serial path. Nothing is reverted.
> - **Deterministic verification runs on the integrated tree** before any critic-class call. The
>   full verification gate and the independent critic judge the integrated tree only, and the critic
>   is not told how the tree came to be.
> - **One writer.** One process writes the events and the ledger, whatever the number of workers.
> - **Parallelism decides nothing.** It adds no verdict, no exit code and no stop reason. It is off
>   by default and off under the `parity` profile.
>
> *Precedent and evidence.* Lisa Principle VIII; `stage-parallelism-research.md` ("absent declared
> write-sets, keep it serial"); R26 F-8; R29.

The plan template's Constitution Check gains one line: "XX. No concurrency without a recorded
admission · no model in integration · one writer".

### 8. Research that supports it

R29, R26, R27, R23, R23v, R15 (A-3, A-5, A-8), R15v (A-1, A-2), R11, R14, R24, R21, R21v, the
parallelism note.

## Version/date pins

| Item | Value |
|---|---|
| Date | 2026-09-29 |
| git on this machine | 2.47.3 (`git --version`); the design needs 2.38 or later |
| Lisa tree read | Scheduler sources as in the working tree at `76adfdc`, identical to `363e6a3` for `packages/scheduler/src` (`git diff --stat HEAD main -- packages/scheduler`); `graph.ts` and `planner.ts` by `git show main:` |
| Spec 002 | `old/002-as-is-lisa/spec.md`, baseline `76adfdc` |
| Corpus | 48 distinct forward-mode `tasks.md` files from R26's list, read 2026-09-29; R26 counted 43 on the same list, so the two populations differ by five files and the figures are not interchangeable |
| Baseline | R21 as corrected by R21v, as restated in R27 F-1 |
| Integrity rules | IR-01 to IR-60; PU-01 to PU-78 |
| Rulings | `RULINGS-IN-PROGRESS.md` as of ruling 70 and D1 to D3 |
| Machine | 22 cores, ZFS (`nproc`, `df -T`); no timing was measured |
| External documentation | None consulted. No claim here is `verified-doc`; R26's are cited through R26 |

## Options compared

### O-1 Shape

| Option | Micro-loop layer unchanged | Core unchanged when off | A later layer can reuse the mechanics | EP-04 cost | Verdict |
|---|---|---|---|---|---|
| A mode of the `micro` layer | No: R27's design gains states and caps | Yes | No | None | Rejected; R27 owns that design |
| An engine capability switched by configuration | Yes | No: the pass loop itself branches | Yes | None | Rejected; the decision "when" would sit in the core |
| A layer that replaces `micro` | Yes | Yes | Yes | None | Rejected: it would copy the whole of the micro-loop layer |
| **A layer stacked above `micro`, mechanics as engine services** | Yes | Yes | Yes: `autoresearch` and selection need the same store and executor | Stacking, two directives, one service | **Adopted** |

### O-2 How a worker gets its tree

| Option | Holds the attempt's uncommitted work | Writes under the project's `.git` | Ignored files | Disk and time | Verdict |
|---|---|---|---|---|---|
| Worktree of the project's repository from `HEAD` (Lisa, 002 FR-048 literally) | No | Yes | Absent | Low | Rejected (F-4) |
| Worktree of the project's repository from a snapshot commit | Yes | Yes: objects, a worktree entry | Absent | Low | Rejected: IR-60 |
| Full copy of the workspace directory | Yes | No | Present, with absolute paths that may be wrong | High without reflink | Rejected as the default; its useful part is the seed paths |
| **Worktree of a runtime-owned store, from a snapshot** | Yes | No (F-6) | Absent; seed paths copied | Low | **Adopted** |

### O-3 Where the merge check runs, and what a failure does

| Option | Dependencies and caches present | Result bound to the tree the gate sees | Needs a revert | Work kept on failure | Verdict |
|---|---|---|---|---|---|
| In an integration tree, before application; failure discards the group (R26 F-8, "demotion") | No | No | No | No | Rejected: N passes lost; a check without dependencies fails for the wrong reason |
| In the workspace after application; failure reverts | Yes | Yes | **Yes** | No | Rejected: ruling 50 |
| **In the workspace after application; failure goes to the serial repair path** | Yes | Yes | No | Yes | **Adopted** |

The cost of the adopted option: a merged tree that fails its check stays in the workspace. That is
the state a serial unit leaves when its check fails, and the micro-loop layer already handles it.

### O-4 Eligibility

| Option | Ceiling at 2 workers (pooled) | Conflicts designed out | Works on today's task files | Verdict |
|---|---|---|---|---|
| `[P]` alone | 1.117 | None; 9.7 % of pairs overlap by their own text | Yes | Rejected |
| `[P]` and a scope declared in the task file | — | Yes | No: Spec Kit has no such field | Rejected as the only source |
| **`[P]` and a scope derived from the task's text or declared by the consumer, audited afterwards** | 1.063 | Yes, as far as the text is honest; the audit catches the rest | Yes: 71.9 % of `[P]` tasks name a path | **Adopted** |

## Recommendation

**Specify parallel units as feature 142: a loop layer `parallel` stacked above `micro` behind EP-04,
with the group executor, the tree store and integration as engine services; eligibility by `[P]` plus
a derived or consumer-declared scope that is audited against the actual delta; one single-pass worker
per task in a worktree of a runtime-owned store; integration in task order with no model; the inner
check set on the integrated tree in the workspace; off by default with 2 workers and a ceiling of 4.
Specify concurrent verification commands in feature 105 by PU-73 to PU-78.**

Confidence: **medium-high** on the shape and on the tree-store mechanism, which was run (F-6);
**medium** on the integrity rules, which no red team has yet seen and which at C0 are detection;
**high** that the saving is small (at most 3 to 4 % of alive time at the default, F-2); **low** on
every numeric default; **high** that the option should not become a default on present evidence.

## Matrix rows

One proposed column for the Harness Capability Matrix, **concurrent sessions**, with the value
`declared`, `probed`, `adapter` or `null` as for every capability (R15:289). No value is contributed:
no harness was run. For Claude Code, R26 records that the vendor documents isolated parallel sessions
per worktree (R26:88, `verified-doc` there); whether several headless processes may share one
configuration home at Tier 1 is `unverified` and needs a fixture capture in feature 125. No host row.

## Conflicts with owner rulings

| # | Ruling | Point | Default this design proceeds on | If ruled otherwise |
|---|---|---|---|---|
| 1 | 50 (no commit, no revert) and IR-60 | Snapshots are commit objects, in a store the runtime owns, outside the project's repository (PU-29) | They are not commits in the sense of ruling 50 | Without commit objects `git worktree add` cannot be used; worker trees are made by `read-tree` and `checkout-index` and are not git repositories, which departs from 002 FR-048 and may confuse a harness that expects one |
| 2 | 50 and IR-60 | The application of an integrated delta writes and deletes project files inside an attempt (PU-47) | It is a fifth act, allowed only in this form: forward, audited, base verified, no index, no ref | Without it ruling 56 cannot be implemented: the results of workers could never reach the tree the gate runs on |
| 3 | 31 (tree store: "reserve, build nothing") | Ruling 56 needs a subset of the store built: snapshot, materialize, merge, apply | The subset is built in 142; `restore` stays unbuilt | — |
| 4 | 56 as recorded ("R26's merge check") | R26 F-8 step 4 uses the full gate as the merge check and demotes on failure; this design uses the inner set and the repair path (O-3) | O-3 | With R26's form a failure discards the group's work and the gate runs twice per attempt |
| 5 | Feature-briefs B.3 | "The next free number from 142" is reserved for splits | 142 is this feature; splits take numbers from 143 | — |

None of these shows a decision or a ruling to be infeasible. Items 1 and 2 must be answered before
Stage B writes the feature.

## Open questions / risks

1. **No run exists.** Every saving is a bound or an inference. No group has ever run on this machine.
   The conflict rate of scope-disjoint work is unmeasured anywhere (R26:89).
2. **Semantic conflicts.** Two deltas that merge cleanly can break each other. The merge check catches
   what a manifest command exercises and nothing else; the gate and the critic have the same limit.
3. **Containment C0 and C1.** A worker can write the workspace, a sibling's tree or the store. PU-53
   and PU-54 detect a changed workspace. A write into a sibling's tree before its snapshot, inside
   that sibling's scope, is not detected; the content still faces the merge check, the gate and the
   critic, so attribution is wrong and gate integrity holds. For the red team.
4. **Work of a killed worker is discarded** from integration, which sits badly with aim 2 ("keep work
   that was done when a pass ends"). Default: discard, snapshot kept for the operator. The other
   ruling integrates it when it passes the audits, at the risk of failing its siblings' check.
5. **The reservation is cooperative** (PU-16, PU-17). A proposer that ignores it does the tasks
   serially; the option then does nothing, safely.
6. **Derived scopes are a heuristic.** A task that names `src/api/` and edits a lock file is refused
   at the audit and redone serially, which wastes a pass. E6 metric (e) measures it.
7. **Worker trees lack ignored files.** A worker without its dependencies may spend its pass
   installing them, or fail. Seed paths answer it at the price of disk and copy time. Absolute paths
   inside a seeded virtual environment point at the workspace; the doctor should warn.
8. **The alternates entry** makes the store depend on objects of the project's repository. A `gc` by
   the consumer during a run could remove an object only if it became unreachable from every ref of
   the project, which the base snapshot's parent (the project's `HEAD`) prevents for committed
   content. `inferred`, not tested.
9. **Feature number.** See conflict 5.
10. **Cache scope per directory** (F-8) is taken from R24's reading of the documentation and was not
    confirmed by a call. If the cache were shared across directories the token cost of a worker would
    fall.
11. **macOS** is `unverified` throughout (ruling 67).
12. **Concurrent sessions at Tier 1** under one real configuration home are `unverified` (Matrix
    rows). If they do not work, the option is limited to Tier 2 for that harness.
13. **Machine-wide quota.** Two runs in two workspaces, each with workers, share one account's
    window. Nothing here coordinates them (R26:173).
14. **What I did not check.** The Claude adapter's sandbox configuration with a write root other than
    the workspace; the behaviour of `git apply` on binary files and mode changes beyond the probe;
    Git LFS and sparse checkouts; the pattern sets of EP-16 for seed paths; the oracle's normalizer
    rules.
