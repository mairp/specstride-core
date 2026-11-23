# R29v — parallel units red team

Written 2026-09-29 by verifier R29v. Independent review of
`research/R29-parallel-units-design.md` (rules PU-01 to PU-78). Design review on paper: no product
code, no paid model call, no harness CLI invoked, no subagent, nothing executed against a source
repository. Two read-only scripts were run over the task-file corpus R29 used; they live in
`/tmp/specstride-research/R29v/` (`v.py`) and wrote nothing outside that directory.

Tags: `verified-local` (read or computed by me, with the file and line or the command), `inferred`
(reasoned, with the facts it rests on), `unverified` (could not be confirmed, with what was tried).
No claim here is `verified-doc`: no external documentation was consulted.

Severity: **breaks** gate integrity, **weakens** it, or **cosmetic**. Disposition: every finding
becomes a **rule** (section "Proposed new or amended rules") or an **owner item** (section "Items for
the owner"). New rules continue R29's numbering from PU-79.

## Method

Read in full: `BRIEF-COMMON.md`; owner decisions 4, 7, 21, 22, 23 (`prompts/specstride-ecosystem.md:151-204`);
`APPROVAL.md`; R29. Read in the parts that bear on several workers: `architecture.md` sections 3 to 9
(`:86-331`); `constitution-amendment.md` Principle XX (`:378-389`); R27 F-5 and D1.1 to D1.12
(`:201-361`); R23 IR-01 to IR-30 (`:343-392`); R23v IR-31 to IR-57 and owner items (`:409-457`);
R11 containment levels (`:665-668`) and T-26 (`:545`); R14 envelope and EV-21 (`:231`, `:316`);
R26 F-8 (`:92-99`).

For each of the eight attack classes (a) to (h) of the assignment I tried to construct a sequence of
steps that the rules of R29, read literally, allow. Where a rule's test would pass while the attack
succeeds, the rule is counted as defeated. Where R29 is silent, the rule is counted as missing. A
scenario that gives a worker no more than a serial proposer already has is recorded under "Rules that
held".

Arithmetic: `ceil.py` of R29 was re-run unchanged, then re-implemented (`v.py`) with three variants:
ceilings per phase instead of per file; a task made serial inside a run of `[P]` tasks splits the
run; sub-headings break a run.

## Findings

Count: 27 findings. **Breaks: 4** (V-01 to V-04). **Weakens: 17** (V-05 to V-21). **Cosmetic: 6**
(V-22 to V-27).

### Breaks gate integrity

#### V-01 The integrity kinds tell the critic that a group ran and that a delta was refused — class (c) `inferred`

1. PU-60 forbids in the fact block any "word that distinguishes a group from a serial unit"
   (R29:480). PU-66 makes "a critic-class input that holds a field PU-60 withholds" a breach (R29:486).
2. PU-61 adds two kinds that reach the critic: `workspace-changed-during-group` and
   `protected-change-refused` (R29:481). PU-65 state 6 adds `apply-incomplete`, which "reaches the
   critic" (R29:485).
3. The first kind holds the word "group". The second says that a change was proposed and refused,
   which is the record of a retry: the task then returns to the serial path and is done again. The
   third says that the runtime applied something.
4. A critic that reads any of the three knows that parallel work ran and that at least one proposal
   was discarded. Decision 21's fourth fixed point withholds "the history of repairs, retries and
   escalations" (`specstride-ecosystem.md:195`).

Defeats: PU-60 by PU-61 and PU-65; by PU-66's own definition it is a breach. The test of PU-60
compares two fixtures without an integrity event, so it passes.
Disposition: rule PU-83 (neutral kinds, a vocabulary test). Whether a refused protected change is
reported at all is owner item O-6.

#### V-02 The worker tree's path, with run, group and worker id, travels into the merged tree — class (c) `inferred`

1. A worker tree lives at `…/workers/<workspace-id>/<runId>/<groupId>/<workerId>/` (PU-22, R29:425).
   The worker also holds `SPECSTRIDE_WORKER_ID` and `SPECSTRIDE_WORKER_INDEX` (PU-28, R29:431).
2. A tool the worker runs writes an absolute path into a tracked or untracked, not ignored file
   inside the scope: a generated configuration, a recorded test snapshot, a golden file, a lock file
   with a `file:` reference, a stack trace kept as a fixture. No adversary is needed.
3. The scope audit compares paths with the scope, not content (PU-43, R29:458). The delta is applied.
4. The file is now in the workspace. Evidence cites it; the grounding snapshot prints it. A critic
   with read-only tools in the working tree (rulings 57a, D1) can read it without a citation.
5. The critic reads a path that names a group and a worker, and an index that gives a lower bound on
   the worker count. PU-63 removed the directory, not the string.

A second effect: the path points at a directory that no longer exists, so the merged tree can fail at
the gate for a reason that no worker's own run would have shown.

Defeats: PU-60, PU-63; a breach by PU-66's fourth condition. Likelihood is low to medium; the effect
needs no intent.
Disposition: rule PU-82.

#### V-03 A group can be kept with no merge check having run — class (b), ruling 56 `inferred`

1. The merge check is "the inner check set of the phase" (PU-48, R29:463). The inner set can shrink
   inside a run: a command is excluded as `slow`, as `flaky`, or by the 15 % budget (R27:269-273).
   PU-70 itself excludes "the slowest command" when snapshots were slow (R29:502). A phase can also
   have no command at all (IR-15, R23:362).
2. PU-02 lists seven reasons for which the option is off; an empty inner set is not among them
   (R29:395). The micro-loop layer has the fallback reason `no-check` (R27:364); the `parallel` layer
   does not inherit it.
3. A group runs, is applied, and the merge check has nothing to run. PU-49 says "Pass without
   condition: the integrated tasks form one kept unit" (R29:464). Zero commands, none failed.
4. Ruling 56 allows parallel worktrees "with a merge check before the critic" (`APPROVAL.md:126`).
   Principle XX requires that "a deterministic merge check run on the merged tree"
   (`constitution-amendment.md:385-386`). Neither happened. IR-28 counts "a `pass` recorded for a check
   that did not run" as a breach (R23:385).

Defeats: PU-48, PU-49; rule missing in PU-13.
Disposition: rule PU-79.

#### V-04 Concurrent verification commands: a result that depends on the interleaving — class (b) `inferred`

1. PU-74 lets two commands share a batch when their `writes[]` are disjoint (R29:514). Reads are not
   declared.
2. The manifest holds, in order, `build` (`writes: [dist]`) and `test` (`sideEffects: none`), where
   `test` runs what is in `dist`. Serial order is the dependency. The batch is formed greedily in
   manifest order, so both run together.
3. `test` starts while `dist` still holds the output of an earlier tree. It passes on the old build.
4. PU-76 brackets the batch with one fingerprint pair (R29:516). `dist` is usually ignored, so it is
   outside the fingerprint scope (IR-35); where it is not, it is a declared write. Nothing is tainted.
5. The gate records `pass` for a test that did not run on the tree it is bound to. The option applies
   "to the gate and to inner checks alike" (PU-73, R29:513).

A second, weaker form: two test commands both write an undeclared, ignored file (a coverage file, a
runner cache). Neither the declaration nor the fingerprint sees it.

Defeats: PU-74, PU-76, IR-16.
Disposition: rule PU-101.

### Weakens gate integrity

#### V-05 The runtime's git runs code and conversions that the worker chooses — class (a) `inferred`

1. The snapshot is `git add -A` with the store as git directory and the worker tree as work tree
   (R29:237-239). Git reads the store's `config`, the user's global configuration and the
   `.gitattributes` files of the tree it adds.
2. At C0 and C1 the worker can write the store (R29:842). It sets a clean filter, `core.fsmonitor` or
   `core.hooksPath` in the store's configuration. At C2 it cannot, but it can still write
   `.gitattributes` in its tree, and a filter the consumer has in the global configuration (large-file
   filters are common) then runs on the worker's files.
3. The engine takes the final snapshot after the worker's processes were ended (PU-41). The filter or
   monitor command runs now, as a child of the engine, with the engine's environment, outside any
   sandbox and outside the allow-list of IR-10.
4. Independently, end-of-line attributes make the snapshot differ from the bytes on disk, and the
   application writes converted bytes. Fingerprint (e) compares tree ids, so it reports equality.

Defeats: PU-42 and IR-32 (a process of the worker's making runs after the barrier), PU-53 (e).
At C0 the serial path has a comparable exposure through the project's own `.git/config`; the new part
is the store's configuration and the run after the barrier.
Disposition: rule PU-81.

#### V-06 A worker's git directory is in the control plane — class (a), ruling 22 `inferred`

1. The store is "a bare repository in the control plane" (PU-20, R29:423). A worker tree's `.git` is
   a file that points to `store.git/worktrees/<w>` (R29:248).
2. F-5 rejects worker trees inside the control plane because "the control plane would be inside a
   proposer's write scope, against R-1" (R29:226).
3. Any git command of the worker that writes (index refresh, `add`, `commit`, `stash`) writes under
   `store.git/worktrees/<w>` and into `store.git/objects`, which all workers share. PU-23 expects such
   commands (R29:426).
4. So either the sandbox allows the write and the control plane is in a proposer's write scope, or
   PU-26 denies it (R29:429) and ordinary git commands fail inside a worker at exactly the containment
   level R29 recommends.

Defeats: PU-26 against PU-23; the purpose of ruling 22.
Disposition: owner item O-4, with the amended PU-23 as the recommended answer.

#### V-07 Symbolic links that are already in the base give workers shared state — class (a) `inferred`

1. PU-43 refuses a link "whose target resolves outside the tree" when it is part of a **delta**
   (R29:458). A link that the project already tracks is in the base snapshot and in every worker tree.
2. An absolute link resolves to the same directory from every worker tree and from the workspace. A
   relative link that leaves the tree resolves, from a worker tree, inside the worker root.
3. Workers A and B write through the absolute link. The target is outside every tree: no snapshot, no
   fingerprint, no audit, no delta. The writes are concurrent and both reach what the merge check and
   the gate later read through the same link.

Defeats: PU-43, PU-54. Rule missing in PU-13.
Disposition: rule PU-84.

#### V-08 Caches, configuration home, ports and temporary files outside the trees — class (a) `inferred`

1. PU-24 isolates seeded paths inside the tree; PU-37 covers a resource somebody declared. Caches at
   user level (package caches, compiler caches, build daemons), the harness's one configuration home
   (ruling 36) and fixed ports are shared by all workers at once and declared nowhere.
2. IR-37 protects the **checks** where a toolchain profile knows the cache. It does not protect a
   worker from a sibling: worker A's test reaches worker B's server on the fixed port and A builds on
   what it saw.
3. `TMPDIR` is "inside its tree's ignored area" (PU-28, R29:431). A project's ignore file names no
   such area. Temporary files are then untracked and not ignored, enter the final snapshot, fail the
   scope audit and refuse an honest worker.

Defeats: PU-28. No worker result is evidence (IR-13 holds), so the gate is not reached directly.
Disposition: rules PU-85 and PU-97. Concurrent sessions under one real configuration home stay
`unverified`, as R29 says (R29:865).

#### V-09 A write into a sibling's tree is detectable after the sibling ended — class (a) `inferred`

R29 flags the residual itself (R29:842-845). I confirm its core: a write inside the sibling's scope
**while the sibling runs** cannot be detected at C0 or C1, and it gives no authority the serial path
lacks, because IR-12 authorises by "a task of the phase" (R23:359) while PU-44 is stricter. Two parts
can be closed:

1. PU-41 does not say when the final snapshot is taken: at the worker's end or at the barrier
   (R29:456). If at the barrier, a worker that ended at minute 5 stays writable by its sibling until
   minute 20.
2. No fingerprint compares a worker tree at the barrier with its final snapshot.
3. A sibling can also write **outside** the victim's scope, which refuses the victim and costs a
   cycle and a pass.

Disposition: rule PU-96; the containment floor is owner item O-3.

#### V-10 Composition by `merge-tree` admits content that no audit saw; the conflict branch is unreachable — class (b) `inferred`

1. Admitted scopes are pairwise disjoint (PU-13) and every path of a delta lies inside its scope
   (PU-43). The task list is dropped (PU-45). So the path sets of accepted deltas are disjoint.
2. Then no file is changed by two workers, no textual merge ever happens, and the conflict of PU-47
   cannot occur. The probe's conflict (two workers, one file, R29:249-250) is a case the eligibility
   rule excludes. E6's fixture "conflicts on adjacent lines" and the class "conflict" of metric (e)
   (R29:593-595) cannot be produced by a run that obeys PU-43.
3. What `merge-tree` adds is behaviour nobody needs: rename and directory-rename detection, and merge
   drivers named by attributes. Each can put into the merged tree a path or a blob that is in no
   audited delta. PU-66 checks the workspace against the merged tree, not the merged tree against the
   deltas.

Defeats: PU-47 in part; PU-66 lacks a condition.
Disposition: rule PU-80. It also removes the git 2.38 floor.

#### V-11 Ticks: a third write by the runtime, outside the ledger and the resume states — classes (b), (f) `inferred`

1. PU-47 calls the application "the only act by which the runtime writes project files inside an
   attempt" (R29:462). PU-46 has the runtime tick the task list (R29:461). That is a second act, and
   the statement put to the owner under ruling 50 omits it.
2. The twelve ledger records (PU-55, R29:475) hold none for ticks. Kill the engine after `applied`
   and before the ticks: PU-65 state 7 runs the merge check; the ticks are never written. The ledger
   says the tasks are integrated, the task list says they are open, and the main line's next pass
   does them again.
3. PU-53 (e) requires the workspace after application to equal the merged tree (R29:473). With ticks
   applied it does not, unless the task list is outside the comparison. If the task list were outside
   the **snapshot** (PU-45 allows "excluded from the snapshot scope"), a worker tree would hold no
   task list for the worker to read.
4. The staleness check of ruling K3 runs "at every pass start" (`APPROVAL.md:183`). R29 does not say
   on which copy a worker's pass is checked.

Disposition: rule PU-94; the act itself joins owner item O-2.

#### V-12 Workers that outlive the engine — classes (d), (f) `inferred`

1. Each worker is in a process group of its own (PU-32). The engine dies by SIGKILL or out of memory.
   The workers live on.
2. They keep calling the model. Nobody reads their streams: the usage is in no event, under no cap,
   in no quota observation.
3. With `relaunch.owner: root` a new engine ends them at PU-65 state 2. With the root gone, or after
   a rest, nothing does until `resume`, which may be hours later.
4. If the engine died between the spawn and the registry record, the process is recorded nowhere.
   PU-27's sweep then deletes a tree in which a process still writes; PU-63 can never find the worker
   root empty.

Defeats: PU-27, PU-42, PU-63, PU-39. The serial path has the same defect for one process; here it
is N processes.
Disposition: rule PU-90.

#### V-13 PU-63 can hold the critic back without limit — classes (f), (h) `inferred`

PU-63's test: "the call is delayed until the sweep has removed it" (R29:483). A tree that cannot be
removed (V-12 step 4, a busy mount, a permission the worker changed) delays the critic for ever. The
run neither stops nor advances and has no stop reason to give. Rulings 38 and 41 and decision 21
allow neither a halt nor a new stop reason.

Disposition: rule PU-91.

#### V-14 A job of an earlier yield voids every group — class (f) `inferred`

1. PU-16 requires "no yield wait open" (R29:414). A wait can end while its job runs on: "the wait ends
   and the resume prompt says that the job is still running" (R27:310-311). The job is `adoptable` and
   survives.
2. The job writes result files in the workspace during the group. Fingerprint (d) differs from (a).
3. PU-54 refuses every worker, counts the group as failed and raises an integrity event that reaches
   the critic, for a cause that is not an attack. Two such groups switch the layer off (PU-52).

Disposition: rule PU-92.

#### V-15 Group size against the group's time cap — class (d) `inferred`

1. A group may hold up to 15 tasks (R29:135); the executor runs `workers` at a time (PU-32).
2. The group cap is 30 minutes "from group start to the end of the merge check"; the proposal cap is
   20 minutes (R29:488-491).
3. A group of 5 with 2 workers needs three rounds. Two rounds of ordinary length spend the 30
   minutes. Live workers are killed, the group counts as failed, and each kill counts against the
   50 % target (PU-71).

The ceiling of F-2 already assumes rounds of `workers` tasks (`ceil.py`: `math.ceil(len(adm)/N)`), so
nothing is lost by making the round the group.
Disposition: rule PU-86.

#### V-16 Cycle accounting contradicts the pause rule — class (d) `inferred`

1. PU-68: "each worker pass that started spends one cycle" (R29:500). PU-38: the pause "spends no
   cycle", and after the resume "each unfinished worker gets a new pass"; its test demands that "every
   counter equals its value before the pause" (R29:446).
2. The pass closed with `quota_pause` had started. Either it spent a cycle, against PU-38, or a
   started pass spent none, against PU-68.
3. PU-68 admits a group when the remaining cycles are "at least its worker count". A group of 7 with
   2 workers starts 7 passes.

Disposition: rule PU-87.

#### V-17 N workers cross a hard cap before it is seen — class (d) `inferred`

1. PU-39 (b) checks headroom once, at admission, against the p90 cost of earlier passes (R29:447).
2. During the group the cap is evaluated as usage records arrive. Each worker has one model call in
   flight; the overshoot is N calls instead of one, and an unusually costly worker task is bounded by
   nothing per process.
3. PU-39 (a) admits a group when no utilisation "has been observed". On a subscription with no
   observation, the first group runs with the configured worker count on no information.

Disposition: rule PU-88.

#### V-18 Harness errors in workers pass by the error breaker — class (d) `inferred`

PU-67 leaves `consec_err` as it was "whatever its end" (R29:499). A harness that fails at start
(expired login, outage) fails N workers per group; two failed groups switch the layer off (PU-52).
Up to 2 × the group size of failed passes per attempt reach no breaker. Bounded, so not a bypass of
the counter, but it delays the breaker that exists for this case.

Disposition: rule PU-89.

#### V-19 `stop` in the middle of a group is undefined; resume state 5 checks too little — class (f) `inferred`

1. R29 defines `stop --now` (R29:492-493) and not the polite `stop`, the budget stop or the time-cap
   stop while a group is live.
2. PU-65 state 5 checks "every path of the merged delta" (R29:485). States 4 verify the whole
   workspace against fingerprint (a); state 5 does not verify the paths **outside** the delta. After a
   crash, a change there (V-12, or the consumer) is carried into the kept unit unseen until the merge
   check's own fingerprints.
3. PU-27 removes worker directories. The store keeps an entry under `worktrees/` for each; nothing
   prunes them.

Disposition: rules PU-93 and PU-95.

#### V-20 Off is not quite absent — class (g) `inferred`

1. PU-62 applies "with the option off" (R29:482). Under the `parity` profile a fixture whose evidence
   cites a path under the worker root is then refused where the baseline grounds it. IR-45 has a
   register row for the same reason (R27:436). R29's seven register rows hold none for PU-62
   (R29:669-677).
2. PU-04 names the fields that may differ with the option on and no group started. It does not name
   the `parallel.admission` events of PU-58, which PU-13 requires for every task.
3. PU-15 has `launch --dry-run` and the doctor print the groups. With the option off that is a new
   line; under `parity` ruling 68 forbids it.
4. The layer-on parity suite of decision 21 runs with this option off, so it is touched by point 1
   only.

Disposition: rule PU-98.

#### V-21 The proposer is a channel — class (c) `inferred`

1. The worker is told its id and index (PU-28) and its handoff names the scope (PU-25). The main
   line is told that tasks are "reserved" (PU-16).
2. The main line writes the evidence. It may write "T012 to T014 were done by parallel workers, one
   was refused". IR-20 removes pasted failure blocks by marker; nothing marks this.
3. The evidence reaches the critic.

This cannot be closed, only narrowed: a proposer can always describe its work. What the runtime
controls is what it tells the proposer.
Disposition: rule PU-103.

### Cosmetic or low

#### V-22 A task made serial inside a run: order undefined `verified-local` for the figures

PU-13 sends a task that fails a check to the serial path (R29:411). Whether it then splits the run is
not said. `ceil.py` does not split: tasks 1 and 3 form a group around a serial task 2. If task 2 has
no scope it "overlaps everything" (PU-12), so it cannot be ordered against the group. Splitting costs
little: pooled 1.061 against 1.063, median 1.034 against 1.038, at two workers (`v.py`).
Disposition: rule PU-102.

#### V-23 Modification times cluster at the application `inferred`

Ruling 53 keeps file modification times in the grounding snapshot (`APPROVAL.md:123`). Files written
by the application carry one instant; files of a task done again carry a later one. The test of PU-60
must normalise times to pass at all, so it cannot see this. The serial path leaks order in the same
way and the owner accepted that (R23v O-7, R23v:452).
Disposition: owner item O-7.

#### V-24 PU-56 says more than the architecture allows `verified-local`

"The engine process is the only writer of … every control-plane file of the run" (R29:476). The root
writes the lease and the CLI writes the inbox (`architecture.md:92-93`, `:136`); LR-5 says one writer
"at any moment" (`architecture.md:94`). PU-57 holds inside the engine. Restarted worker passes need an
ordinal that PU-59 does not give.
Disposition: rule PU-98.

#### V-25 Scopes on a file system that ignores case `inferred`

`src/Api` and `src/api` are disjoint for PU-11 and one directory on the default macOS file system.
Disposition: rule PU-99.

#### V-26 Objects borrowed through the alternates entry can vanish `inferred`

R29's open question 8 covers committed content (R29:856-859). A blob that the proposer staged and
never committed is in the project's object store, unreachable from any ref. The snapshot finds it
there and writes no copy. A prune by the consumer removes it and the base snapshot is broken. A
worker that edits an ignore file changes which files its own final snapshot holds.
Disposition: rule PU-100.

#### V-27 Arithmetic and experiment design `verified-local` for the figures, `inferred` for the rest

| Claim of R29 | Check | Result |
|---|---|---|
| Table F-2 (R29:158-163) | `ceil.py` re-run | Every figure reproduced |
| End to end 3.0 / 4.1 / 2.0 % and the two other rows (R29:172-176) | share × (1 − 1/s) with shares 51.4, 68.6, 34.5 % | 3.05, 4.07, 2.04; 4.42, 5.89, 2.96; 7.99, 10.66, 5.36. Correct |
| F-1 percentages (R29:129-139) | recomputed from the counts | Correct |
| "About one file in ten reaches 1.19" (R29:577) | `v.py` | Correct: 5 of 48. The criterion next to it asks for 1.2, which 3 of 48 reach |
| E6 cost: "about one phase in ten … so about 5 phases of the 47" (R29:601) | `v.py`, ceilings per phase | **Wrong basis.** F-2 is per file. Per phase, 85 of 399 (21 %) reach 1.15 at two workers, so about 10 of 47 |
| Central estimate "1 to 3 %" (R29:562) | — | No method. The lower bound can be below 0: one cold start per worker against a task of 5 to 15 minutes |
| Pass mark (a): P2 at least 15 % lower on phases with a ceiling of 1.15 or more (R29:595, 599) | 0.686 × (1 − 1/1.15) | **Inconsistent.** A phase at 1.15 can save at most 8.9 % of alive time. 15 % needs a ceiling of 1.28, which 31 of 399 phases reach |
| Pass mark (a): 5 % lower over the whole of FX-ORD | R29's own ceiling for ORD | **Unreachable**: the ceiling is 4.1 % |
| 24 triples | R27 F-5 (R27:203-210): 15 % needs 71 to 257 pairs | With 24 pairs the power for a true 15 % is about 0.3 to 0.6 at one-sided 10 %; and a point estimate of 15 % is reached half the time when the truth is 15 % |
| Mark (d) "within 5 points" | 1 phase of 24 is 4.2 points | The mark means "at most one phase"; it cannot show that quality is no worse |

Disposition: owner item O-8 for the marks; rule PU-104 for the fixtures.

## Rules that held

| Rule | Attack tried | Why it held |
|---|---|---|
| PU-01, PU-02, PU-03 | A failure inside a group that needs a new exit code or stop reason | Every path ends in serial, layer off for the attempt, or layer off for the run. The one hidden halt is V-13 |
| PU-06, IR-01 | The layer writes a verdict or an approval | It holds no gate writer; one approval per attempt, after the gate |
| PU-09, PU-12 | A proposer widens eligibility | Marker and scope come from the launch-time reading or the consumer; an empty scope is the whole tree |
| PU-15 | A changed plan after launch | Hash checked; the recorded plan applies on relaunch |
| PU-20 | Writes under the project's `.git` | The probe's hashes are equal (R29:251-253). Not repeated by me |
| PU-33, PU-34 | A session or a tier carried through a worker | Always fresh, base tier |
| PU-36 | A worker yields or leaves a job | Refused; ended at the barrier |
| PU-44 | A worker changes a protected file through a sibling (V-09) | The result equals the authority of the serial path (IR-12), never more |
| PU-47, order | Completion order changes the merged tree | Launch-time task order; with PU-80 the order has no effect on content at all |
| PU-48, PU-49, PU-51 | A worker tree's result shown as the merged tree's | No check runs in a worker tree; the kept unit is bound to the workspace fingerprint; the gate runs in full |
| PU-54 | A C0 worker writes the workspace inside the fingerprint scope | Detected at (d). Ignored paths are IR-35's and IR-37's matter, as on the serial path |
| PU-55, PU-57 | Two writers, `seq` gaps, a forked chain | One process, one queue; workers write no control-plane file |
| PU-67, PU-69, PU-71 | A worker changes an outer counter or stretches a time cap | None is touched; wall time advances once. Exceptions: V-16, V-18 |
| PU-77 | A failed command cancels another | Every command runs to its end |
| Ruling 50 | A revert after a failed merge check | None: the failure goes to the repair path (O-3 of R29) |
| Rulings 38, 41 | A detection that halts | None, apart from V-13 |

## Proposed new or amended rules

| ID | Rule | From |
|---|---|---|
| PU-79 | Admission gains the check `check`: a group is admitted only if the inner set of the phase, after every exclusion in force, holds at least one command. Otherwise the tasks are serial, reason `no-check`. If the set is empty when the merge check is due, the unit is `unchecked`, is not kept, and the layer is off for the attempt. Group overhead never excludes a command: on a breach of the 15 % budget caused by snapshots or application, no further group is admitted and the inner set stays as it is | V-03 |
| PU-80 | **Composition replaces merge.** The integrated tree is the base in which each path of an accepted delta holds the blob of that worker's final snapshot. The path sets of accepted deltas must be pairwise disjoint; a delta that shares a path with an earlier one in task order is `refused`, reason `overlap`. No content is merged, no rename is detected, no merge driver runs. PU-66 gains: "an integrated tree that holds a path or a blob that is in no audited delta". The git floor of PU-02 falls to what the snapshot needs | V-10 |
| PU-81 | Every git process of the runtime runs without the system and the global configuration, with the store's configuration compared with its recorded hash first, with hooks and the file-system monitor off, and with no filter, text conversion, external diff or merge driver. A snapshot stores the bytes on disk; the application writes the bytes of the blob. Test: a worker tree with an attributes file that names a filter and end-of-line conversion; no process is started; bytes are equal | V-05 |
| PU-82 | The worker tree's path holds one opaque random component and no run, group or worker ordinal. The environment of a worker holds one opaque token and no index or count (amends PU-28). Before integration every added or changed blob of a delta is searched for the real path of the worker root, of the store and of the control plane, and for the worker's token; a hit refuses the delta, reason `path-leak` | V-02 |
| PU-83 | Kinds that reach the critic are neutral: `tree-changed-outside-pass` (for PU-54 and for state 6 of PU-65) and, if O-6 is answered with "report", `protected-change-not-applied`. A vocabulary test over every critic-class input of every parallel fixture finds none of: group, worker, parallel, merge, integrat-, refus-, snapshot, the opaque tokens (amends PU-60, PU-61, PU-65) | V-01 |
| PU-84 | Admission gains the check `links`: when the base snapshot holds a symbolic link that is absolute or resolves outside the tree, a task whose scope contains the link or lies behind it is serial; at C0 and C1 the phase has no group. At C2 and above the sandbox denies writes to the targets | V-07 |
| PU-85 | `TMPDIR` of a worker is a directory beside its tree in the worker root, inside the sandbox's write roots, never part of a snapshot, removed at group close (amends PU-28) | V-08 |
| PU-86 | A group holds at most `workers` tasks. A longer run gives successive groups, each with its own base snapshot, barrier and merge check. The group cap covers one round | V-15 |
| PU-87 | One cycle is charged per admitted worker task, at its first `worker_started`. A pass started again after a quota pause or an interruption the worker did not cause charges none. A group is admitted only if the remaining cycles are at least the number of its tasks (amends PU-68) | V-16 |
| PU-88 | Under a hard cap each worker pass starts with a process-level spending limit of the remaining role budget divided by the tasks of the group, where the adapter declares that capability; where it does not, the headroom factor of PU-39 (b) is doubled. The cap is evaluated on the sum over live workers at every usage record, and crossing it ends every worker of the group. With no quota observation in the run, a group has 2 workers whatever is configured (amends PU-39) | V-17 |
| PU-89 | A worker pass that ends with a harness error (no checkpoint, no kill by a cap, no quota signal) closes the group at the barrier, and the layer is off for the attempt. The task goes to the main line, where the breakers count as they always do | V-18 |
| PU-90 | Every worker process carries the run token and its opaque token in its environment. When the engine exits for any cause, the root ends every `owned` process after the identity check, before it relaunches or rests. Engine start, `resume`, `status` and the doctor search the process table for holders of the run token and report them; engine start and `resume` end them. A tree is swept only after its processes are ended. A pass whose stream was lost is recorded with `usage: unknown`, and every cost report that includes it says that it is incomplete | V-12 |
| PU-91 | The verification before a critic-class call ends processes and sweeps once. If the worker root is still not empty: a critic without tools is called and the event `tree-changed-outside-pass` is raised; a critic with read tools is called only if the adapter confirmed the read denial, otherwise the next critic of the order of decision 17 is used, announced. The call is never delayed beyond one sweep (amends PU-63) | V-13 |
| PU-92 | Admission gains the check `jobs`: no group starts while an `adoptable` job of the run is alive in the process registry | V-14 |
| PU-93 | `stop` with a group live: no further worker starts; live workers run to the end of their pass; integration and the merge check run through `group_closed`; then the stop takes effect. `stop --now`, a budget stop and a run time cap end the workers and leave the group to PU-65. Removing a worker tree includes pruning its entry in the store | V-19 |
| PU-94 | The task list is in every snapshot and is dropped from every delta. Ticks are written after `applied` and before the merge check, under a ledger record `ticks_applied` that lists the task ids; they are idempotent. PU-53 (e) is an equality apart from the single-writer files. PU-65 gains the state "`applied` without `ticks_applied`: write the ticks". The staleness check of ruling K3 for a worker pass reads the workspace's files (amends PU-45, PU-46, PU-53, PU-55, PU-65) | V-11 |
| PU-95 | PU-65 state 5 also verifies that the workspace outside the paths of the integrated delta equals fingerprint (a). A difference is state 6 | V-19 |
| PU-96 | The final snapshot of a worker is taken when that worker's processes have been ended, not at the barrier. At the barrier every worker tree is fingerprinted again; a tree that differs from its final snapshot gives the event `worker-tree-changed-after-end` (not shown to the critic), and that worker is `refused` (amends PU-41, PU-53) | V-09 |
| PU-97 | A toolchain profile may give, per worker, the environment that moves a cache which is unsafe for several writers. For a toolchain without a profile the run record and the `[LOOP]` line say `worker-caches=shared`, and the doctor names it. The runtime promises no port; the opaque token is what a project may derive one from | V-08 |
| PU-98 | Register: a row for PU-62 against the oracle, as IR-45 has. PU-04 names `parallel.admission`. The plan is printed by `launch --dry-run` and the doctor only with the option on. PU-56 reads: "while a group is open the engine is the only writer of the event file and the ledger; workers write no control-plane file", in the words of LR-4 and LR-5. A pass ordinal is the triple of group ordinal, task position and restart index (amends PU-04, PU-15, PU-56, PU-59) | V-20, V-24 |
| PU-99 | On a file system that ignores case, scopes and delta paths are compared after case folding and Unicode normalisation (amends PU-11) | V-25 |
| PU-100 | A snapshot copies into the store every object that no ref of the project reaches. Before `materialize` and before the application the store verifies that every object of the tree is present; a missing object refuses the group and switches the layer off for the attempt. A final snapshot uses the ignore rules of the base snapshot | V-26 |
| PU-101 | A verification command runs beside another only if the manifest declares both its writes and its reads (or `sideEffects: none` together with `reads: tree`), and no command of the batch reads what another writes. A command with declared writes never shares a batch with a command that follows it in manifest order, unless that command's reads are declared disjoint from those writes. Declared writes and reads include ignored paths. A command that fails in a batch of more than one is run once more alone, and both results are stated (IR-14, IR-40) (amends PU-74, PU-76) | V-04 |
| PU-102 | A candidate that admission makes serial ends the run of candidates at its position: a group is a run of consecutive **admitted** tasks (amends PU-10, PU-13) | V-22 |
| PU-103 | What the runtime tells a proposer about parallel work is minimal and neutral. The worker's prompt names its task and its scope and no sibling, count, index or group. The main line's block says up to which task to work and does not say why. After a group the handoff lists the integrated tasks as kept units in the words used for a serial unit | V-21 |
| PU-104 | FX-PAR-S replaces "conflicts on adjacent lines" with "two deltas that share a path" (PU-80), and adds fixtures for V-02, V-03, V-05, V-07, V-11, V-12 and V-14. Metric (e) replaces the class `conflict` with `overlap` and adds `path-leak` | V-27 |

## Items for the owner

| # | Question | Evidence | Recommended answer | What changes otherwise |
|---|---|---|---|---|
| O-1 | Ruling 50, first reading: are commit objects in a store the runtime owns "commits" in the sense of the ruling? | The ruling's words: the runtime "never commits, reverts, resets or cleans **the tree**" (`APPROVAL.md:120`). Its purpose, from the conflict it settled (R27:377): no work destroyed, no history that grounding can reach, no tree made clean. A store commit changes no `HEAD`, index, ref or reflog of the project (R29:251-253), is refused by grounding (PU-62) and leaves `git status` as it was. Ruling 56 says "worktrees", and `git worktree add` needs a commit | **Compatible.** Narrowest reading: ruling 50 forbids acts on the project's working tree and repository. A store commit is allowed under four conditions: outside the project's repository; fixed author, date and message, so that it carries no time and no identity; never the parent of a project commit and never pushed; removed with the run. Register row 4 of R29 stays, with these conditions | Worker trees are plain directories made from tree objects; a harness that expects a repository may misbehave; 002 FR-048 is `superseded`, not `translated` |
| O-2 | Ruling 50, second reading: may the runtime write an integrated delta, and the ticks, into the workspace inside an attempt? | Without it ruling 56 cannot be implemented (R29:828). The ruling names four verbs; applying is none of them, but IR-60 adds "checks out" (R27:324), and writing blobs from a store into the working tree is a checkout of those paths. R29 also omits the ticks (V-11) | **Compatible with the purpose, not with IR-60's words.** Allow exactly two acts, and amend IR-60 to name them: (1) the application: forward only; only paths of audited deltas; only onto a workspace equal to the base; bytes that a proposer wrote; no index, no ref, nothing under `.git`; write-ahead; never undone; (2) ticks of integrated tasks through the spec-format adapter. Register row 3 of R29, widened to both acts | No parallel units in Wave 1, against ruling 56 |
| O-3 | Does the option need containment C2? | At C0 and C1 a worker can write a sibling's tree, the store and the workspace; part of it is undetectable (V-09, R29:842). Ruling 34 asks for the strongest containment available; ruling 38 for prevention where possible | **C2 or above by default.** At C0 and C1 the option is off, reason `containment`, unless user configuration sets `loop.parallel.allow_detect`; then `protection=detect` is stated | With detection only as the default, attribution inside a group is unreliable on every harness without a sandbox. Whether the Claude adapter confines its file tools to a write root other than the workspace is `unverified` (R29:869) |
| O-4 | Form of a worker tree: a linked worktree of the store, or a repository of its own inside the tree? | V-06: a linked worktree puts the worker's git directory in the control plane | **A repository of its own**: the `.git` directory lies inside the worker tree, borrows the store's objects read-only, and the store stays unwritable by any worker. The runtime's snapshot excludes it | With linked worktrees, either git commands fail inside a worker at C2, or a control-plane path is in a proposer's write scope, against ruling 22. The disposition of 002 FR-048's third clause is worded anew |
| O-5 | Ruling 39 says "no snapshot in Wave 1". Does it bar the tree store's snapshots? | `APPROVAL.md:97`. The question put was whether the gate and grounding run on an immutable copy. R29 cites the ruling and lists no conflict | **No.** The ruling concerns what the gate and grounding run on, and they still run on the working tree. A sentence in the decision log says so | The tree store cannot be built; as O-2 |
| O-6 | Is a protected change that was refused, and so never reached the tree, reported to the critic? | Ruling 41 reports protected files that "were changed" (`APPROVAL.md:99`). Here the tree is unchanged. Reporting tells the critic that a proposal was discarded (V-01) | **Report, by a neutral kind, without count** (PU-83): the critic should know that the proposer tried to change a check | Withheld: the event stays in the event file and the doctor only |
| O-7 | Modification times after an application (V-23) | Ruling 53 kept the times; R23v O-7 | **Accept**, with a register row that names it. The application does not set times | The application sets every written file's time to the barrier's instant and the grounding snapshot coarsens times; Principle III's text needs wording |
| O-8 | E6's pass marks (V-27) | The mark for a default is unreachable by R29's own ceiling; 24 triples cannot resolve 15 % or 5 points | Keep E6 as a **safety** experiment: no breach, failure classes measured, cost and killed passes reported. State that a default cannot be shown at this size, and that the option stays off until a corpus with phase ceilings of 1.28 or more and at least 71 pairs exists | The marks stay and are missed by construction; the result reads as a failure of the option and not of the experiment |

Items O-1 and O-2 must be answered before Stage B writes feature 142; R29 says the same (R29:833-834).

## Open questions / risks

1. **Read denial for a critic with read tools** is assumed by D1, by PU-63 and by PU-91. Whether the
   sandbox of any harness can deny reads of paths outside the working tree is `unverified`: no
   documentation was consulted and no harness was run. If it cannot, the store and the control plane
   are readable by such a critic, with the option on or off.
2. **C2 for file tools.** A sandbox for shell commands does not by itself confine a harness's own
   edit tools. `unverified` (R29:869). O-3's answer rests on it.
3. **PU-82's search is by string.** A path that a tool writes encoded or relative to another root is
   not found. The rule narrows V-02; it does not close it.
4. **V-21 cannot be closed.** A proposer can describe parallel work in the evidence. Decision 21
   withholds what the runtime knows, not what the proposer says.
5. **The rule count.** 26 new rules on 72 put feature 142 above the split mark of about 45
   requirements (R29:643). G-B, the engine services, should be planned as a feature of its own.
6. **The saving does not pay for the rules.** R29's ceiling is 3 to 4 % of alive time before any cost
   (reproduced); this review adds overhead (PU-86 gives more snapshots and merge checks, PU-88 smaller
   groups) and removes none. That is evidence on the value of ruling 56, not on its feasibility: the
   ruling can be implemented. I record it as a `DECISIONS-PENDING` note and proceed on the ruling as
   written.
7. **Not checked by me:** the probe of F-6 was not repeated; macOS; submodules, large-file storage
   and sparse checkouts; the oracle's normalizer; R24's drop rules; R15's text of EP-04.
