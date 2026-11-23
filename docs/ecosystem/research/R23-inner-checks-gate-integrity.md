# R23 — Inner checks and gate integrity

Written 2026-09-29. Read-only work. No paid model call, no CLI invocation of any harness. Source paths
are relative to `/root/specstride` at `9cab15d` (HEAD of `main`, confirmed with `git rev-parse --short HEAD`)
unless a full path is given. Scratch scripts are in `/tmp/specstride-research/R23/` (`map.py`, `map2.py`,
`corpus.py`). Savings are stated against R21's two-tier baseline (R21 Recommendation, option D).

Terms used here: **unit** (the work between two inner checks), **checkpoint** (the artifact with which
the proposer declares a unit finished), **cycle** (one pass that ends at a checkpoint plus the check that
follows), **ledger** (the runtime's full record of cycles), **unit evidence** (the projection of the
ledger that the critic receives), **control plane** (R11 R-1: the runtime-owned directory outside the
proposer's write scope), **outbox** (the one workspace directory where the proposer writes artifacts for
the runtime: evidence, yield, checkpoint).

## Prior art consulted

| File | Use |
|---|---|
| `prompts/analysis/A8-micro-loops-and-parity.md` | **Primary. Reused**: the layered strategy, the placement between passes as a sibling of yield, the proposer-declared checkpoint, rules G1–G4 and G7, disengage instead of halt, the ladder L0–L3, the separate digest line. **Extended**: G1–G7 become 30 numbered rules with a test each; the critic's view is specified field by field; resume states are enumerated; fail-fast for long jobs is added. **Contradicted** in six places, listed in F-20. |
| `prompts/analysis/A6-micro-loop-survey.md` §3, §7, §8, §10, §11 | **Reused**: deterministic checks run by the harness, frozen before work; protected paths; flaky-check handling; "unchecked" as its own status. **Contradicted**: §10 proposes that the critic gets the ledger "as evidence"; decision 21 withholds the history, so the critic gets a projection. §11(a) allows an optional cheap model judge; decision 21 excludes it in Wave 1. |
| `prompts/analysis/A7-local-loop-prior-art.md` §5, §7 Q1, Q5, Q6, §8 | **Reused** as the inventory of mechanisms, re-checked line by line (F-08 to F-14). **Confirmed**: commands are keyed by phase, not by task; the proposer can write `events.jsonl`; `required` verification with no command must degrade, not fail. |
| `docs/ecosystem/research/R11-security-threat-model.md` T-02, T-13, T-19 to T-25, T-28, T-30, T-31, R-1, R-2 | **Reused**: control plane outside the write scope, signed records, containment levels C0–C3, config trust tiers. R11 lists threats and leaves the rules to this report; the mapping from each threat to a rule is in F-19. |
| `docs/ecosystem/research/R21-time-use-baseline.md` | The baseline for every saving stated here (Questions answered, F-3, F-4, F-5, Recommendation). |
| `prompts/specstride-ecosystem.md` §0, §2 (decisions 4, 7, 17, 21, 22, 23, known tensions), §4 row R23, §6 | Governing text. |
| Source: `proposer.sh`, `orchestrator.sh`, `lib/verification_plan.py`, `lib/critic.py`, `specstride-lib.sh` | Read at `9cab15d`. |
| `/root/agentic-netops-srl` (read-only): `specs/004-agentic-netops-composite/tasks.md`, the run's `verification-plan.json`, the launch contract's `verification-commands.json`, `testautomation/.../verification.generated.json`, `last-run.conf` (setting names only), `bin/acceptance/p15-t151r10/{plan,results}.tsv`, run events | Real Spec Kit feature for the task-to-check mapping and for the shape of a long job. |
| `old/011-as-is-mixture-of-loops/contracts/output-lines.md`, `old/028-as-is-specstride/spec.md` | Digest grammar and FR numbers. |

Not available when this was written: R18, R20, R22, R24, R25, R26. Where this report needs a value they
own, it names the parameter and leaves the number to them.

## Questions answered

**Q1. What is the unit of work?**
A unit the proposer declares with a checkpoint that names one or more task IDs of the current phase. The
prompt asks for one task per unit and allows a group when the tasks cannot be checked apart. The runtime
validates the IDs against the phase and owns everything else. One fixed task per unit is rejected because
40 % of tasks are marked parallel and 38.6 % are test tasks whose implementation is another task (F-03);
a fixed group is rejected because nothing in Spec Kit declares groups. For the native and openspec formats
the unit names criterion indexes. Size defaults belong to R22.

**Q2. Do verification obligations map to tasks one to one?**
Obligations do; commands do not. Every task line becomes exactly one obligation (188 of 188 in the
reference feature, F-01), but an obligation carries no command, and a command carries a phase and no
obligation or task reference (F-02). In the reference feature 3 commands serve 188 obligations, and 15 of
16 phases have no declared command. A task-scoped check subset, which A8 assumed, cannot be derived from
today's plan. The inner check set is therefore fixed **per phase**, and the unit's task IDs are used for
the ledger and the critic's coverage table, not for selecting commands.

**Q3. What is the check set, and how is it fixed before work starts?**
It is a manifest derived at launch from the same sources as the verification gate (discovered build,
type check, lint and test commands, plus declared commands), reduced to the commands whose timeout fits
the inner-check time limit. It is stored in the control plane with its hash, the hash is recorded in the
run's events, and the runtime verifies it before each check. Nothing the proposer writes can add, remove
or change a command (rules IR-08, IR-09).

**Q4. How is the proposer kept from editing or gaming checks and the tests they rely on?**
By four layers, in rules IR-08 to IR-16: the manifest is outside the write scope; a protected set (check
definitions and the tests that existed at phase entry) is fingerprinted at phase entry and compared
before every check and before the gate; a check that ran against a changed protected set is recorded as
`tainted`, never as `pass`; and where the harness has an OS sandbox the protected paths are read-only.
On a harness with no sandbox the protection is detect-and-void, not prevention. That limit is stated in
the digest and is a pending decision (Open questions 2).

**Q5. How do final results reach the critic while the repair history is withheld?**
The runtime keeps two records in the control plane. The ledger holds everything. The unit evidence is a
projection with a fixed field list, written by the runtime when the proposer loop ends, and inserted in
the critic prompt by the runtime as a fact block. It has one row per task of the phase with the final
status, and it omits counts, order, times, earlier results and check output (rules IR-17 to IR-22, field
list in F-16).

**Q6. Where does the layer sit, and how does it cooperate with the other mechanisms?**
Inside one attempt, between passes, handled after the kill check and the yield check and before the
classic accounting of a pass (F-08, table in F-15). It never touches the rejection path, so the
diagnostician, the accelerator, oscillation and the MALFORMED limit see only gate outcomes.

**Q7. Which mechanisms would misfire, and what is the rule for each?**
The short-pass nudge, the iteration limit and the repeat-stall watchdog. All three were confirmed in the
code (F-09 to F-11). A pass that ends at a valid checkpoint is handled before the nudge code, gives its
iteration back and is counted against the layer's own cap, and the manifest's commands are exempt from
the process-level repeat counter.

**Q8. Counting, resume and the digest?**
Cycles count against the layer's caps only. The counters survive a resume (decision 23), which corrects
A8. Five ledger states are defined with what resume does in each (F-17). The `[DIGEST]` line is
unchanged and stays last; a line before it reports the strategy and the unit totals (F-18).

**Q9. What is the capability ladder?**
L0 classic, L1 pass-boundary checkpoint (the default, needs only what any proposer does), L2 a check
tool inside the pass, L3 session continuation. L2 and L3 are for tested adapters. A second axis, R11's
containment level, decides whether protection is prevention or detection (Matrix rows).

**Q10. Fail-fast for long verification jobs?**
Two mechanisms. A **first-failure predicate** on a yield ends the wait when the job's step-result file
shows a failed step; it works on every harness and on existing scripts. A **step runner** executes a
declared step list in the runtime, stops at the first failed step and can resume from it. Resumed runs
are marked `partial` and never count as gate evidence. Against the long-verification baseline the first
mechanism addresses 29.3 h of 42.9 h of acceptance-job time (F-21).

## Findings

### Unit of work and the mapping

**F-01** `verified-local`. In the reference feature every task line is one obligation.
`python3 /tmp/specstride-research/R23/map.py`: `phases 16 tasks 188 [P] 87`; the generated plan has
`obligations 188`, per phase `{1: 8, 2: 18, 3: 41, … 16: 9}` equal to the task counts per phase,
`title carries a T-id 188`, `distinct T ids 188`, `workItemRefs non-empty 0`. The cause is in
`lib/verification_plan.py:794-841`: one obligation per criterion, `acceptanceRefs` set to
`phase-<n>-criterion-<index>`, `workItemRefs` always `[]`.

**F-02** `verified-local`. Commands are keyed by phase and have no link to an obligation or a task.
A declared command has the fields `id, phase, executable, args, cwd, timeoutSec, env` and staging fields
(`lib/verification_plan.py:235-361`); a discovered command has none of `phase`, obligation or task
(`:183-194`). A suite joins obligations and commands only at phase level (`:891-900`). `map2.py` on the
run's plan: `obl 188 cmds 3`, `any command->obligation field: False`, every phase suite has 1 command
(the discovered `go test ./...`) except phase 2 with 3. The launch contract's own file records
`"emptyPhases"` for 15 of 16 phases and `"counts": {"declarations": 163, "distinct_command_texts": 47,
"normalized_commands": 2}`: of 47 command texts in the Spec Kit documents only 2 could be expressed as
fixed argv. mixture-of-loops keeps a `source_tasks` list per command, which Specstride does not read.

**F-03** `verified-local`. Corpus of 18 Spec Kit features on this machine (`corpus.py`, parsed with the
baseline's own `specstride_spec.get_phases`): 141 phases, 938 tasks; tasks per phase median 6, p75 8,
p90 11, max 41; 100 % of tasks carry a unique `T` ID; 40.0 % are marked `[P]`; 38.6 % mention a test;
91.3 % name a path; 9.3 % name a runnable command.

**F-04** `inferred` from F-01 to F-03. A unit cannot select its own commands. The three unit options
compare as in "Options compared" O-1. The 91.3 % of tasks that name a path make one thing derivable at
launch without the proposer: which existing test files a task of the phase is entitled to change
(rule IR-12).

**F-05** `verified-local`. The reference run did not execute the deterministic gate at all.
`last-run.conf` line 17 is `VERIFICATION=plan`, and `grep -c '"event":"verification_'` over the six
event files returns 0 for each. So no duration of the three commands is on record; their declared
timeouts are 1800 s, 1800 s and 3600 s. An inner-check time limit below 1800 s would exclude all three
by timeout value, which is why exclusion must use measured duration once one exists (IR-08, Open
questions 4).

### Where checks and state live today

**F-06** `verified-local`. Every control file is inside the proposer's write scope.
`STATE_DIR="$WORKDIR/$STATE_BASENAME"` (`orchestrator.sh:463`, `proposer.sh:256`), gate files in
`$FEATURE_DIR/gates` (`orchestrator.sh:486`), the stop flag (`:687`), the yield artifact
(`proposer.sh:319`), the verification evidence (`orchestrator.sh:1980`). The approval is an empty file
whose presence is tested at `orchestrator.sh:2059`. The orchestrator's own comment at `:1849-1852` says
the proposer "runs unsandboxed in this tree and appends to the same events.jsonl". Any inner-check
record kept in this layout could be forged, which confirms R11 T-02 and T-24 for the layer.

**F-07** `verified-local`. The critic never sees a verification result today. `lib/critic.py` takes
`--verification-plan` and renders obligations and the command list through `render_phase_context`
(`lib/critic.py:2547-2558`, `lib/verification_plan.py:1146-1243`); `grep -n 'RUN_DIR\|evidence-output'
lib/critic.py` finds nothing. So the unit evidence block is a new input to the critic prompt and needs a
divergence register row. The gate executes every command even after one fails
(`lib/verification_plan.py:1623-1656`, `passed = all(...)` at `:2172`), with the whole environment
(`os.environ.copy()` at `:1569`).

### Nesting and the three misfires

**F-08** `verified-local`. Order of handling after a pass, `proposer.sh`: kill sidecar read
(`:2083-2089`); a yield written by a killed pass is refused (`:2095-2102`); yield handling, which ends
in `continue` (`:2105-2172`); evidence present ends the loop with exit 0 (`:2176-2180`); short-pass
accounting (`:2184-2195`); error and cap breakers (`:2302-2340`); no-progress breaker (`:2343-2354`);
stop flag (`:2356-2359`). The attempt loop is `orchestrator.sh:1765`, with `local attempt=1` at `:1742`,
the gate at `:1979-2021`, the critic at `:2055`, and the rejection path at `:2139-2259`.

**F-09** `verified-local`. Short-pass nudge. A pass with no kill, no evidence and no yield that ends in
under 180 s increments `consec_short`; at 2 the next prompt tells the agent to yield
(`proposer.sh:1945-1946`, `:2185-2192`, text at `:1949-1971`). A checkpoint pass is short by design and
would receive that advice. A yield leaves the counter untouched, because its `continue` at `:2143` comes
before `:2184`; it does not reset it, as A8 §3.5 states.

**F-10** `verified-local`. Iteration limit. The loop is `for (( i=1; i<=MAX_ITER; i++ ))` with
`MAX_ITER` default 30 (`proposer.sh:142`, `:1976`), exit 4 at `:2365`, mapped to stop reason
`proposer_max_iter` (`orchestrator.sh:1888-1892`). A yield hands the iteration back with
`i=$(( i - 1 ))` unless `SPECSTRIDE_YIELD_COUNTS_AS_ITER` is true (`proposer.sh:2142`, default false at
`:1218`). With a phase median of 6 tasks and p90 of 11 (F-03), one cycle per task plus repairs reaches
30 on ordinary phases.

**F-11** `verified-local`. Repeat-stall watchdog. It runs only while a pass is alive
(`while kill -0 "$cmd_pid"`, `proposer.sh:1045`) and samples only the pass's process tree
(`:1061-1088`). A check run by the runtime after the pass has exited is invisible to it. The misfire
that remains is the proposer re-running the project's check inside a pass: the process counter ignores
commands by name only (`REPEAT_IGNORE`, `:186`), and the tool-level counter has no exemption
(`:1090-1098`, `_repeat_offender` at `:896`). Limit 12 (`:166`). In the Claude-proposer baseline repeat
stall killed 14 passes for 5.9 h (R21 F-4).

**F-12** `verified-local`. The no-progress breaker tests for any file newer than the pass start outside
`.git`, the state directory, `node_modules` and `.venv` (`proposer.sh:798-808`, `:2343`). A checkpoint
written into the workspace outside the state directory would count as progress, so the outbox must be
excluded from the test (IR-24).

**F-13** `verified-local`. The protocol block can be lost. The reference run has 18
`prompt_block_dropped` events, all for `yield_contract` (1, 1, 2, 1 and 13 over five runs), and 1
`prompt_block_protected` in the newest run. At the baseline the block is protected by default
(`orchestrator.sh:1431`). The checkpoint contract needs the same protection.

**F-14** `verified-local`. Grounding can reach state files by citation. A cited absolute path is
honoured if it exists (`lib/critic.py:813-814`); a relative path that stays inside the workdir resolves,
"covers evidence that cites the full .specstride/... path" (`:838-841`); only relative escapes are
refused (`:836-837`). A8's G7 stores micro records under `attempts/phase<N>/attempt<M>/micro/` inside
the state directory, where a citation in the evidence would pull the repair history into the critic's
snapshot. The nonce is `secrets.token_hex(8)`, generated inside the critic call (`:2690`), and the
verdict pattern is anchored to `VERDICT <nonce>` (`:1850`).

### The design

**F-15** `inferred` from F-06 to F-14 and decisions 21 to 23. Cooperation of the layer with each
existing mechanism.

| Mechanism | Rule with the layer on |
|---|---|
| Kill by a watchdog | A checkpoint written by a killed pass is refused, as a yield is. The kill is accounted as today. |
| Yield | Handled first. If a pass writes both, the yield is taken and the checkpoint is refused with an event. A check that exceeds the inner time limit is not converted into a yield by the runtime; it is excluded from the inner set and left to the gate. (A8 proposed conversion; a yield is a proposer's declaration and counts against the proposer's yield budget, which the runtime must not spend.) |
| Evidence | Evidence still ends the proposer loop. With the closing check on (IR-05) the runtime first runs the inner check set on the final tree. |
| Prestage | Unchanged. Inner checks never write or reuse prestage documents. |
| Verification gate | Runs in full on every attempt. Reuses nothing from the layer. |
| Critic | Receives the unit evidence block. Nothing else changes. |
| Diagnostician | Runs only after a gate rejection. Receives no ledger and no unit evidence beyond what the critic had. `.diagnosed-phase<N>` is never written by the layer. |
| Accelerator | An accelerator attempt is an attempt; the layer applies to it with the same manifest. Its units name the unmet criteria. |
| Short-pass nudge | A pass ending at a valid checkpoint is handled before the nudge accounting and resets the counter. |
| Iteration limit | A valid checkpoint with a changed tree gives the iteration back and spends one cycle. |
| Repeat-stall | Runtime checks are outside the pass. Inside a pass, the manifest's exact argv are exempt from the process-level counter; the tool-level counter is unchanged. |
| Idle and progress watchdogs | Unchanged; no pass is alive during a check. |
| Error breaker | Unchanged. A check that cannot start is a layer error and counts toward disengagement only. |
| Cap breaker | Unchanged. |
| No-progress breaker | Unchanged, and it still counts a checkpoint pass that changed nothing in the workspace. |
| Stop flag | Checked before a check starts and on every poll while it runs; `stop --now` kills the check's process group. |
| Wall-clock budget | Checked as in a yield wait (`proposer.sh:1535-1540`). |
| Quota pause | Entered at a pass or check boundary. The paused cycle is not counted. |
| Learning | Reads no ledger field that could change what the critic reads. The two learnable knobs are unchanged. |
| Verdict pins | Unchanged; they live in the critic path. |

**F-16** `inferred` from decision 21 and F-07, F-14. The unit evidence, field by field.

| Included | Excluded |
|---|---|
| Manifest hash and the list of command IDs with argv | Number of cycles, repairs, retries, failures |
| One row per task of the phase, in `tasks.md` order | Order in which units were declared |
| Status per task: `pass`, `fail`, `tainted`, `flaky`, `unchecked` | Any earlier status of the same task |
| Unit ID, a hash of the sorted task IDs | Cycle numbers and pass numbers |
| Exit code per command of the final check | Check output, in whole or in part |
| Tree fingerprint of the final check, and `current` or `superseded` against the tree at the gate | Timestamps and durations |
| Protected-set facts: paths changed, deleted or added since phase entry, and which changes were authorised at launch | Escalations, model or tier used, session IDs |
| Commands excluded from the inner set, with the reason | The proposer's note in the checkpoint |

A task that no checkpoint ever named has the status `unchecked`, so leaving out a failing unit is not
possible. The final status of a task is that of the last check whose unit included it.

**F-17** `inferred` from F-08 and decision 23. Resume states. The ledger is written ahead: a record is
appended before the action it describes.

| Last ledger record | State | On resume |
|---|---|---|
| `pass_started` | A pass was running | The pass is lost as today (what is kept from it belongs to R24). No cycle is counted. |
| `unit_declared` | Checkpoint accepted, check not started | Run the check on the current tree. If the fingerprint differs from the declared one, mark the declaration `superseded` and attribute the result to the current fingerprint. |
| `check_started` | A check was running | Run it again. The interrupted run is recorded as `interrupted` and counts neither as a cycle nor as a failure. |
| `check_finished` | Result not delivered | Deliver it in the first pass, if the fingerprint still matches; otherwise run the check again. |
| `disengaged` | Caps were spent in this attempt | The layer stays off for the rest of this attempt. |

The attempt number, the cycle count and the per-unit failure count are read from the ledger. A flag
resets them. An invalid ledger (broken chain or signature) starts the attempt with the layer off and
raises an integrity event.

**F-18** `inferred` from `old/011-as-is-mixture-of-loops/contracts/output-lines.md:30` and decision
21. The `[DIGEST]` line keeps its grammar and stays the final line of every run, as
`output-lines.md:24` requires. A line printed immediately before it carries the layer:

```
[LOOP] strategy=micro level=L1 containment=C0 protection=detect units=14 pass=12 fail=1 unchecked=1 tainted=0 cycles=19 disengaged=0 failfast-stops=1 fallback=none
```

With the layer off it reads `[LOOP] strategy=classic reason=config`. Surfaces that differ between the
oracle run and the inertness run, to be listed by name in the divergence register: the event
`loop_strategy_selected`; the run record fields `loop.strategy`, `loop.level`, `loop.manifest_hash`; the
settings-replay keys of the same names; the `[LOOP]` line; the status line; the event `micro_inert`; and
the checkpoint contract block of the pass prompt (Open questions 1).

**F-19** `inferred`. Each R11 threat and the rule that answers it.

| Threat | Rules |
|---|---|
| T-02 approval forgery | IR-01, IR-02, IR-25 |
| T-13 project config widens capability | IR-08 |
| T-19 check definitions edited | IR-08, IR-11 |
| T-20 tests weakened | IR-11, IR-12, IR-15 |
| T-21 check runs repository code as the runtime | IR-10 |
| T-22 inner result taken for a verdict | IR-01 to IR-04 |
| T-23 repair history reaches the critic | IR-17 to IR-20 |
| T-24 final result overwritten | IR-17, IR-25 |
| T-25 huge output or endless check | IR-10 |
| T-28 control input written by the proposer | IR-09, IR-25 |
| T-30 path traversal and symlinks | IR-19 |
| T-31 audit trail edited | IR-25 |

**F-20** `verified-local` for the facts, `inferred` for the consequence. Where A8 is corrected.

| A8 | Finding |
|---|---|
| §3.3: the check set is the commands "whose obligations map to the named tasks" | No such mapping exists (F-02). The check set is per phase. |
| §3.5: a checkpoint pass "resets `consec_short`, as a yield does" | A yield leaves it untouched (F-09). |
| §5.3: micro counters restart with the attempt on resume | Decision 23 postdates A8. Counters survive a resume (IR-26). |
| §4.2 G7: records under `attempts/phase<N>/attempt<M>/micro/` | That path is inside the write scope and reachable by grounding (F-06, F-14). Records go to the control plane. |
| §4.2 G5, G6: an optional model reviewer | Excluded in Wave 1 by decision 21. The grammar separation is kept as IR-04. |
| §3.4: a check over the time limit "becomes a yield" | The runtime must not spend the proposer's yield budget (F-15). |

### Fail-fast

**F-21** `verified-local` for the measurements, which are R21's; `inferred` for the design.
R21 F-5: five acceptance runs took 42.9 h, and 29.3 h (68 %) ran after the first failed step was on
disk. The job is a list of steps with one result line per step: `plan.tsv` has 159 lines of
`stage, step, scope, -, command`, and `results.tsv` has lines of `stage, step, exit code`
(`/root/agentic-netops-srl/bin/acceptance/p15-t151r10/`). The runtime waited on a predicate that only
fires when the job ends (`proposer.sh:1519-1536`; kinds at `:1250`).

| Mechanism | What it needs | Addressable time in the long-verification baseline |
|---|---|---|
| First-failure predicate: a yield may declare `resume_when: {kind: "first_failure", path, pattern}`; the runtime ends the wait when a failed step appears, and stops a job it launched itself | A result file the job appends to. Works at L1 and on existing scripts. | 29.3 h of 42.9 h of job time; that is 35.7 % of the 82.0 h of detached waits and 22.9 % of the 127.9 h alive |
| Step runner: steps declared in the verification plan are run by the runtime, which stops at the first failed required step and records each result in the control plane | A declared step list from a trusted source | The same 29.3 h; not additive |
| Resume from the failed step | The step runner, and steps that declare themselves repeatable | Upper bound 13.6 h, the time the five runs spent before their first failure (42.9 − 29.3). `inferred`, not measured: it applies only when the earlier steps are still valid, and never to the run that serves as evidence. |
| Gate stops at the first failed command | Layer on | `unverified`: events record the gate as one interval, not per command. Tried: `verification_start` and `verification_failed` pairs carry no per-command time. |

### Savings that the inner checks address

**F-22** `inferred` from R21 F-3 and F-4. Pools, not predictions. The size of each saving belongs to
R22 and R27.

| Pool in the Claude-proposer baseline | Size | What in this design addresses it |
|---|---|---|
| Attempts that failed the deterministic gate | 19 attempts, 21.1 h, 8.4 % of 251.7 h of attempt time | The closing check turns a counted rejection into a repair inside the attempt |
| Passes killed at the hard cap | 23 passes, 26.6 h | Units that end a pass at each checkpoint |
| Passes killed for repeat stall | 14 passes, 5.9 h | The exemption in F-15 |
| Runs stopped by the iteration limit | 14 of 172 runs in the whole population | Iteration give-back. It does not help the blocked phases among them: 366 of their 576 passes ran under 2 minutes and declared a block (R21 F-7), which the no-progress breaker must keep catching. |

The inner checks also cost time, once per cycle. That cost is unmeasured here (F-05).

## Integrity rules

Numbered and testable. "Layer" means the micro-loop layer. Each rule names the test that proves it.

### A. Verdict isolation

| ID | Rule | Test |
|---|---|---|
| IR-01 | The layer holds no capability to write an approval record, a verdict record, a feedback file, a hint, or a diagnostician or accelerator marker. These writers are passed only to the gate component. | Static: the layer's module graph has no import of the gate writers. Dynamic: over every micro fixture, the set of writes to the gate namespace equals that of the same fixture with the layer off. |
| IR-02 | An approval is issued only after a critic reply with the matching nonce, from a call made after the proposer loop ended and after the full verification gate ran in the same attempt. The approval record binds the hashes of the evidence, the verification result and the tree fingerprint. | Property test: for every approval record there is a `verification_passed` (or mode not `required`) and a verdict event with the same attempt and a later sequence number than the last pass. |
| IR-03 | The verification gate executes every command of the phase gate on every attempt. No inner result is accepted in place of an execution. The only reuse is today's prestage rule. | Fixture: all inner checks pass on tree T, the gate runs on T; assert one execution record per gate command with no `reusedFrom` naming a ledger record. |
| IR-04 | Inner results are a separate record type with their own grammar. The verdict parser accepts none of them. No nonce exists while the proposer loop runs. | Fuzz the verdict parser with every ledger record and unit-evidence row; all must parse as no verdict. Assert the nonce's creation event follows `proposer_done`. |
| IR-05 | An inner result may delay the gate and may never skip or replace it. The closing check may return the proposer to work only while cycles remain; when they are spent the evidence goes to the gate unchanged. | Fixture with a closing check that always fails: the gate is reached after exactly the remaining number of cycles. |
| IR-06 | Inner events change none of: reject count, attempt number, MALFORMED streak, oscillation input, diagnostician signature, verdict pins, learning observations. | Snapshot these before and after each cycle in every micro fixture; they must be equal. |
| IR-07 | The layer adds no exit code and no stop reason. Cap exhaustion, a check that cannot start, and an invalid ledger each switch the layer off for the attempt. | The sets of exit codes and stop reasons over all micro fixtures are subsets of the classic sets. |

### B. Check integrity

| ID | Rule | Test |
|---|---|---|
| IR-08 | The manifest is derived at launch from the sources the verification gate uses. It is stored in the control plane, its hash is in the `loop_strategy_selected` event, and the hash is verified before every check. A command is excluded from the inner set only by the runtime, for a stated reason (timeout value, measured duration, flaky), and every exclusion is in the unit evidence. | Change one byte of the stored manifest between two checks; the second check must not run and the layer must switch off with an integrity event. |
| IR-09 | A checkpoint is a claim. The runtime reads from it the task IDs and a note of bounded length, and ignores every other field. It is read after the pass has exited, and refused if the pass was killed, if an ID is not in the phase, or if it is larger than the size limit. | Fixtures: a checkpoint with `argv`, `result` or `status` fields; with a foreign task ID; written by a killed pass. |
| IR-10 | The runtime runs each check itself: fixed argv, no shell, its own process group, no pass alive, an environment reduced to an allow-list with no provider credentials, a timeout, and a cap on captured output. The result is the exit status the runtime observed. It is never read from a file. | A check that writes a file named like a result and exits 1 is recorded as failed. A check that prints a provider variable prints nothing. |
| IR-11 | The protected set is fingerprinted at phase entry and kept for the whole phase, across attempts and resumes. It has two classes. Class A: the files a check is defined by (runner and lint configuration, scripts and build targets named by the manifest, CI files). Class B: test files that exist at phase entry. Before each check and before the gate the runtime compares. A check that ran while class A differs, or while class B differs without authorisation, is recorded as `tainted`. `tainted` is never `pass` and the unit is not kept. | Fixtures: the proposer edits the runner configuration; deletes a test; adds a skip marker to an existing test. Each yields `tainted` and a fact row. |
| IR-12 | Authorisation to change an existing test file comes only from the launch-time reading of the phase's task text (a task of the phase names the path). The proposer cannot grant it. An authorised change is still listed as a fact for the critic. New test files are allowed and listed. | A checkpoint note that claims authorisation changes nothing. A task that names `tests/x_test.go` authorises that path only. |
| IR-13 | Output of a test the proposer ran is never recorded as a check result. | No ledger record has a source other than the runtime's runner. |
| IR-14 | A failed check is run once more on the same fingerprint. If the result differs, the command is `flaky`, is excluded from the inner set for the attempt, and is reported to the critic as a fact. It still runs at the gate. | A command that alternates fail and pass appears as `flaky` in the unit evidence and executes at the gate. |
| IR-15 | A unit with no command to run is `unchecked`. A task no checkpoint named is `unchecked`. `unchecked` is never shown as `pass`, and an empty inner set never fails a unit. | A phase with no command: every task is `unchecked`, no cycle fails, the attempt proceeds. |
| IR-16 | Every result is bound to the tree fingerprint it ran on. In the unit evidence a result is `current` only if that fingerprint equals the tree at the gate. | Edit a file after the last check; the row reads `superseded`. |

### C. Critic independence

| ID | Rule | Test |
|---|---|---|
| IR-17 | The critic receives the unit evidence from the runtime, built from the ledger in the control plane. Nothing in it is read from the workspace. | Plant a file in the workspace with the unit evidence's name and different content; the critic prompt is unchanged. |
| IR-18 | The unit evidence has exactly the fields of F-16. Rows are in task order. Unit IDs are hashes. | Two fixtures with the same final state, one reached in 1 cycle and one in 9, produce byte-identical unit evidence. |
| IR-19 | No critic-class call (critic, diagnostician, release verification, any ensemble member) receives the ledger or a micro event. Grounding refuses every path whose real path lies in the control plane, whether the citation is absolute, relative or through a symbolic link. | Evidence that cites the ledger by absolute path, by `../` path and through a link in the workspace: each is reported as not grounded. |
| IR-20 | Every failure block the runtime gives the proposer carries a marker token that is random per run. Lines carrying the token are removed from the evidence and from grounded files before the critic sees them, and the removal is recorded. The critic prompt states that the proposer's account of its own work is a claim. | Evidence that pastes a failure block reaches the critic without it. This detects copying; it does not detect paraphrase. |
| IR-21 | The critic is a fresh session with no tools on every call. A continued proposer session (decision 22) is never handed to a critic-class call, and no session ID of the proposer appears in its input. | Assert on the adapter call record of every critic-class call. |
| IR-22 | The unit evidence is part of the critic's budget. When it does not fit it is reduced by a fixed rule (rows that are not `pass` in full, then counts per status) and the reduction is stated in the block. It is never dropped silently, and the criteria section is never shortened to make room. | A phase with 41 tasks under a small window: the block shows every non-pass row and a count line. |

### D. Counting and resume

| ID | Rule | Test |
|---|---|---|
| IR-23 | A pass gives its iteration back only when its checkpoint is valid and the tree fingerprint differs from that of the previous checkpoint. Each such pass spends one cycle. Passes in an attempt are bounded by the iteration limit plus the cycle cap plus the yield cap. | A stub that writes a valid checkpoint for ever: the attempt ends with `proposer_max_iter` after exactly that many passes. |
| IR-24 | The no-progress test excludes the outbox and the control plane. A checkpoint pass that changed nothing else counts as a no-progress pass. | A stub that writes only checkpoints: exit with `proposer_no_progress` after 3 passes. |
| IR-25 | The ledger is in the control plane, append-only, each record carrying a sequence number, the hash of the previous record and a signature with the per-run key. It is validated on resume and before the unit evidence is built. If it is invalid the layer is off for the attempt, the unit evidence says that inner results are unavailable, and an integrity event is raised. | Truncate, reorder or edit the ledger; each case is detected. |
| IR-26 | The cycle count, the per-unit failure count and the disengaged state survive a resume and a relaunch. A flag resets them. A check run again after an interruption is not counted. | Stop and resume in each state of F-17; the counts continue. |
| IR-27 | Strategy, level and manifest hash are chosen at launch, recorded in the settings replay and unchanged by a resume. Every fallback to the classic loop is announced at launch or when it happens, and is in the events, the status, the doctor and the `[LOOP]` line. | Resume with a different configured level: the recorded one applies and a warning is printed. |
| IR-28 | Breach of gate integrity, for the revert rule of decision 21, is any of: an approval without the conditions of IR-02; a change to a counter of IR-06 caused by an inner event; a critic-class input that contains a field excluded by F-16; a `pass` recorded for a check that did not run or ran tainted. A detected and refused attempt is an integrity event and not a breach. | Each breach condition is an invariant checked on every run's event log by the doctor and in CI. |

### E. Fail-fast

| ID | Rule | Test |
|---|---|---|
| IR-29 | A first-failure predicate only ends a wait and, for a job the runtime launched, stops that job. What the job's result file says is a claim and is never a check result. | A result file that reports a failure that did not happen ends the wait and changes no status. |
| IR-30 | A step run that started from a step other than the first is `partial`. A `partial` run never satisfies the gate and never appears as `pass` in the unit evidence. The run that serves as evidence starts at step one, except for steps reused under the prestage rule (same revision, clean tree). | Resume from step 35, all remaining steps pass: the gate still requires and performs a full run. |

## Version/date pins

| Item | Value |
|---|---|
| Date | 2026-09-29 |
| Specstride | `9cab15d`, commit date 2026-09-28, `main` |
| Reference feature | `/root/agentic-netops-srl`, `004-agentic-netops-composite`, plan of run `20260927-092715-907142` |
| Baseline | R21, cutoff epoch 1790637900 |
| Corpus | 18 `tasks.md` files under `/root/specstride/specs`, `/root/mixture-of-loops/specs`, `/root/lisa/specs`, `/root/agentic-netops-srl/specs`, `/root/specstride-claude/specs` |
| External documentation | None consulted; no claim here is `verified-doc` |

## Options compared

### O-1. Unit of work

| Option | Check can be selected per unit | Works with today's plan | Handles test tasks and `[P]` tasks | Gaming surface | Pass length |
|---|---|---|---|---|---|
| One task, fixed | No (F-02) | Yes | No: a test task and its implementation task fail apart | None | Shortest |
| Task group, fixed by the runtime | No | No: Spec Kit declares no groups; user-story headings are not phases' units | Partly | None | Medium |
| **Declared by the proposer, validated by the runtime** | No | Yes | Yes | The grouping is a claim; bounded by IR-09, IR-15, IR-18 | Set by the prompt and R22's defaults |

### O-2. What happens when a protected file changes

| Option | Meets "cannot edit" (decision 21) | Works at containment C0 | Blocks legitimate test changes | Cost |
|---|---|---|---|---|
| Report only (R11 T-20) | No | Yes | No | Low |
| **Void the check (`tainted`), authorise from task text, report as fact; read-only where a sandbox exists** | In effect: an edit cannot produce a `pass` | Yes | No | Low |
| Run checks on a copy with the protected files restored from phase entry | Yes | Yes | Yes, unless authorised paths are exempt | A second tree per check; build caches lost |
| Read-only by sandbox only | Yes | No | Yes, unless exempt | Limits the default to sandboxed harnesses |

### O-3. Where the critic's view comes from

| Option | History withheld | Forgery by the proposer | Omission of a failing unit |
|---|---|---|---|
| The ledger itself (A6 §10) | No | — | — |
| A file in the workspace written by the runtime | Yes | Possible (F-06) | Possible |
| **Projection built by the runtime from the control plane, one row per task of the phase** | Yes | Needs the control plane and the run key | Not possible |

## Recommendation

Adopt the layer as designed above: a unit declared by checkpoint and validated by the runtime; a
per-phase check manifest fixed at launch; a protected set fingerprinted at phase entry, with `tainted`
results voided; the unit evidence as the critic's only view; the 30 rules IR-01 to IR-30 as requirements
of feature 115, with IR-01 to IR-07 also as invariant tests of feature 101; the first-failure predicate
in Wave 1 and the step runner as its companion in feature 115.

**Confidence: medium-high** for the structure and for the rules of groups A, C and D, which rest on code
that was read. **Medium** for group B, because protection on a harness with no sandbox is detection, and
indirect test dependencies cannot be listed completely. **High** for the fail-fast finding, which is
measured. No saving from the inner checks themselves is claimed; F-22 gives the pools.

Inputs for the other features:

| Feature | What it takes from this report |
|---|---|
| 100 | The loop-layer interface: prompt contribution, post-pass artifact handling, runtime work with no session open, next-pass block, critic-input contribution. The outbox and the control plane in the state layout. |
| 101 | Invariants IR-01 to IR-07; the unit evidence block in the critic prompt; the grounding refusal of IR-19. |
| 103 | The order of post-pass handling (F-08) with the checkpoint step after yield; the three exemptions. |
| 105 | The manifest derivation; an optional `tasks` field on declared commands for later per-unit selection; the step list for long jobs. |
| 115 | Everything else. |
| consolidation.md | Register rows: default strategy; checkpoint contract block; unit evidence in the critic prompt; iteration give-back; short-pass exemption; repeat-stall exemption; closing check; `[LOOP]` line and the named fields of F-18; first-failure predicate. |

## Matrix rows

No harness row. One proposed column for the Harness Capability Matrix, **micro level**, with these values:

| Harness class | Micro level | Protection of checks | Basis |
|---|---|---|---|
| Discovered, unverified, no declared sandbox | L1 | Detect and void (C0) | Decision 17, decision 21; R11 R-2 |
| Tested adapter with tool restriction only | L1, L2 if tool injection is verified | Detect and void (C1) | R11 R-2 |
| Tested adapter with an OS sandbox | L1, L2, L3 where R24 confirms continuation | Read-only protected paths and no access to the control plane (C2) | R11 R-2 |
| Harness that cannot write a file headless | L0 | — | A8 §6.1 |

Which named harness falls in which class is for R5, R6, R7, R9, R10 and R20. `unverified` here.

## Open questions / risks

1. **DECISIONS-PENDING: the inertness clause and the protocol block.** Decision 21 requires the
   layer-on suite to be identical "apart from the fields that record which layer was active". The
   proposer must be told the checkpoint protocol, which changes the prompt it receives. Default: the
   block is added to the pass prompt by the layer and kept out of the on-disk phase prompt, and it is
   named in the register with the fields of F-18. If the owner reads the clause strictly, the block is
   sent only after the proposer's first pass of an attempt wrote no evidence, which costs one pass per
   attempt.
2. **DECISIONS-PENDING: "cannot edit" on a harness with no sandbox.** Evidence: F-06, R11 T-02 residual.
   Default: detect and void at every level, prevention where a sandbox exists, and the `[LOOP]` line
   says which. If the owner requires prevention, the default level is limited to harnesses at
   containment C2, which conflicts with "works on every harness".
3. **DECISIONS-PENDING: the closing check.** It moves the evidence aside and returns the proposer to
   work, which changes Principle I's rule that the loop ends the instant the evidence exists. Default:
   on with the layer, bounded by IR-05, with a register row and amendment wording. If ruled out, the
   21.1 h pool of F-22 stays with the gate.
4. **Check duration is unknown.** The reference run never ran its gate (F-05). A baseline check at
   phase entry would measure duration and find failures that predate the work, but it executes commands
   even when no unit is ever declared, so it breaks inertness. Default: off; duration is learned from
   the first check of an attempt.
5. **Indirect dependencies.** A helper imported by a test, a fixture file or a generated file is outside
   the protected set unless a pattern catches it. The full gate and the critic have the same weakness.
6. **Special-casing.** A proposer can write code that satisfies a test without doing the work. No
   deterministic rule prevents it. The critic and the canary experiment of A6 (E8) are the answer.
7. **Anchoring.** Whether the unit evidence moves the critic toward approval is untested (A6 E9).
   Decision 21 fixes that the critic sees it; R27 should keep E9 among the experiments, with seeded
   defects.
8. **Same OS user.** At C0 a test run by the runtime can write to the control plane. IR-10 and IR-25
   make a forged result detectable only while the run key is unreadable to it, which a file on the same
   account does not guarantee.
9. **The `[LOOP]` line and mixture-of-loops' parser.** `[DIGEST]` is the final line of every run
   (011 `output-lines.md:24`), so `[LOOP]` is printed before it. Whether the supervisor ignores a line
   with an unknown prefix is `unverified`: the parser source was not read. R18 should confirm it.
10. **Telemetry.** A pass that gives its iteration back reuses its `iter` number (R21 gap 14). The
    ledger needs the unique pass ID that R14 defines.
