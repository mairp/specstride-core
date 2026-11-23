# R23v — gate integrity red team

Written 2026-09-29. Independent review of `R23-inner-checks-gate-integrity.md` (rules IR-01 to IR-30).
Read-only work: no paid model call, no harness CLI run, nothing executed against a source repository
beyond `git rev-parse`, `grep` and `sed` for reading. Source paths are relative to `/root/specstride`
at `9cab15d` (confirmed with `git rev-parse --short HEAD`). Every attack below is an attack on paper.

## Method

1. Read `BRIEF-COMMON.md`, decisions 7, 21, 22, 23 and the known tensions in §2 of the prompt file,
   Principles I, II and III of the constitution, R23 in full, R11 (STRIDE rows T-01 to T-35, R-1 to R-5)
   and R25 in full.
2. Re-read the baseline code R23 cites and checked the line numbers: `proposer.sh:798-808`, `:186`,
   `:1250`, `:1296-1310`, `:1519-1547`, `:1897`, `:1912`, `:1934`, `:2083-2195`, `:2302-2365`;
   `orchestrator.sh:226`, `:1007-1008`, `:1742`, `:1765`, `:1979-2059`; `lib/critic.py:234-237`, `:813`,
   `:836-841`, `:1328`, `:1444-1453`; `lib/verification_plan.py:1956-2031`, `:2121-2172`.
3. For each attack class (a) to (g) of the assignment, tried to build a step-by-step scenario against the
   rules as written, assuming a proposer at containment C0 unless stated (decision 21 requires the
   default level to work on every harness, so C0 is the governing case).
4. Compared R23's rules with R11's mitigations and R25's escalation rules, line by line.

Severity scale: **breaks** (an approval or a recorded `pass` can exist that the rules say cannot, and
nothing detects it), **weakens** (a rule is evadable, a fact can be hidden, or a limit does not mean
what it says), **cosmetic** (wording or test defect, no attack).

Disposition: **rule** (goes into the design as written under "Proposed new or amended rules") or
**owner** (a pending decision, listed under "Items for the owner").

Tags follow the brief: `verified-local` for facts read in the code or in a report, `inferred` for the
scenario built on them.

## Findings

Totals: 24 findings. Breaks 4 (V-01 to V-04). Weakens 17 (V-05 to V-21). Cosmetic 3 (V-22 to V-24).

### Breaks gate integrity

**V-01. The fingerprint is compared before a check and never after it.** `inferred` from IR-11, IR-16;
`verified-local` for the baseline facts.

- Facts. IR-11 compares the protected set "before each check and before the gate". IR-16 binds a result
  to "the tree fingerprint it ran on". IR-10 requires "no pass alive". The baseline leaves
  proposer-started processes alive by design: yield mode `adopt` takes a pid the proposer started
  (`proposer.sh:1296-1310`), and on stop the job "is LEFT RUNNING" (`proposer.sh:2146-2149`). A process
  that called `setsid` is outside the pass's process group.
- Scenario. (1) In a pass the proposer starts a detached process. (2) The pass exits with a checkpoint.
  (3) The runtime compares the protected set: unchanged. (4) The detached process sees the check's
  process appear in the process table, replaces `tests/x_test.go` with a weakened copy. (5) The check
  runs and exits 0. (6) When the check's process exits, the detached process restores the original.
  (7) The ledger holds `pass` bound to a fingerprint that the check did not run on. The same sequence
  works at the verification gate and during the critic's grounding.
- Defeats IR-11, IR-16, and IR-28's fourth breach condition without raising it.
- Severity: breaks.
- Proposed rule: IR-31 and IR-32. Disposition: rule. The stronger alternative (run the gate on an
  immutable snapshot) is an owner item, O-1.

**V-02. The phase-entry fingerprint launders changes made between phases.** `verified-local` for the
commit facts, `inferred` for the scenario.

- Facts. IR-11 fingerprints "at phase entry". The runtime commits the whole tree when a phase is approved
  (`git add -A`, then `commit`, `orchestrator.sh:1007-1008`). Nothing in R23 ties the entry state of
  phase N+1 to the state phase N's critic approved.
- Scenario A (between phases). A process left by phase N's proposer edits a test file after the gate
  of phase N and before phase N+1 is entered (also during a stop and resume between phases). The phase
  N+1 fingerprint includes the weakened file as the baseline. No check is ever `tainted`, no fact row is
  ever written, no critic is ever told.
- Scenario B (across phases). A weakening made in phase N is reported once, to phase N's critic, and is
  the baseline for all later phases. A change that looked harmless in phase N's context (a skip marker
  "until phase N+2 lands") is never reported again.
- Defeats IR-11; no rule covers it.
- Severity: breaks (A), weakens (B).
- Proposed rule: IR-33. Disposition: rule.

**V-03. With verification mode `plan` or `off` the gate does not execute, and the inner result stands
alone.** `verified-local`.

- Facts. The gate executes only when `VERIFICATION == "required"` (`orchestrator.sh:1979`); in the
  other modes `verification_ok` stays `true` and the critic is called (`:1977`, `:2023`). The reference
  run used `VERIFICATION=plan` (R23 F-05). IR-02's test accepts "`verification_passed` (or mode not
  `required`)". IR-03 says the gate "executes every command of the phase gate on every attempt". The
  manifest is derived "from the sources the verification gate uses" (IR-08), which exist in `plan` mode.
- Scenario. A run in `plan` mode with the layer on. Inner checks run and produce `pass` rows. The gate
  executes nothing. The critic receives runtime-stated `pass` rows as the only deterministic result.
  Decision 21's fixed point "the full verification gate always runs again before it" is false for this
  run, and the inner result has in effect replaced the gate.
- Defeats IR-03 and IR-05 through IR-02's exception.
- Severity: breaks (of a fixed point of decision 21).
- Proposed rule: IR-34. Disposition: rule, with owner item O-2 on which of the two behaviours applies.

**V-04. The scope of the fingerprint is undefined, and what a check reads lies largely outside it.**
`inferred`; `verified-local` that R23 defines neither "tree fingerprint" nor the treatment of ignored
files.

- Scenarios, each leaving class A and class B byte-identical:
  1. User-level toolchain configuration. `go env -w GOFLAGS=-run=^$` writes to the user's Go
     environment file outside the workspace; `go test ./...` then runs no test and exits 0. The same
     class: `~/.npmrc`, `~/.config/pip`, a user-level `pytest` plugin, `~/.gitconfig` filters.
  2. Executable resolution. The manifest argv names `go`, `npm` or `make`. A script with that name in a
     writable directory earlier on `PATH` (`~/.local/bin`, `node_modules/.bin`) replaces the tool.
     R11 T-15 covers harness binaries only.
  3. Ignored files. The runner itself lives in `node_modules` or `.venv`. If the fingerprint follows
     git's view, editing the runner is invisible.
  4. Result caches. `.tsbuildinfo`, task-runner caches and test caches can replay a pass without an
     execution. The files are ignored and can be planted.
  5. Checks that write. A build or a test run changes the workspace (outputs, snapshots). Either every
     row is `superseded` at the gate, or the fingerprint silently excludes those paths and scenario 3
     applies.
- Defeats IR-11 and decision 21 ("the proposer cannot edit a check"); IR-14's "same fingerprint" is also
  unsound when a first run leaves state that changes the second.
- Severity: breaks at C0 and C1. The classic gate shares the weakness today; R23 Open question 5
  names indirect dependencies but none of these five.
- Proposed rules: IR-35, IR-36, IR-37. Disposition: rule; residual at C0 goes to owner item O-3.

### Weakens gate integrity

**V-05. New files change what a check does, and additions do not taint.** `inferred` from IR-11, IR-12.

- Facts. Class A is "the files a check is defined by", class B "test files that exist at phase entry".
  IR-12: "New test files are allowed and listed."
- Scenario. The proposer adds a new `_test.go` file with a `TestMain` that exits 0, or a new
  `conftest.py` in a subdirectory that skips collection, or a new `.eslintignore`, or a nested
  `tsconfig.json` with `exclude`. No file that existed at phase entry changed. The check passes and is
  not `tainted`. The addition is listed among many legitimate new test files.
- Defeats IR-11.
- Proposed rule: IR-38. Disposition: rule.

**V-06. Suppressions in product code and the test count are not observed.** `verified-local` for R11.

- Facts. R11 T-20 includes "Test counts before and after are compared". R23 F-19 maps T-20 to IR-11,
  IR-12 and IR-15; none compares counts. No rule observes `// nolint`, `# type: ignore`,
  `eslint-disable`, `@ts-ignore` or `#[allow(...)]` added to product files.
- Scenario. The proposer clears a lint or type failure by adding a suppression in its own file, or
  removes three test functions from a test file that a task authorised it to change. Both yield `pass`.
- Rule missing.
- Proposed rule: IR-39. Disposition: rule for suppressions (a diff count needs no runner knowledge);
  owner item O-4 for test counts, which need a per-runner parser and so cost evolvability.

**V-07. `tainted` and `flaky` hide `fail`, legitimate work taints for the whole phase, and the gate's
behaviour on taint is unspecified.** `inferred` from IR-11, IR-14, F-16.

- Scenario A. A check fails. The proposer touches a class A file. The next check is recorded `tainted`.
  F-16 gives one status per task, so the row reads `tainted`, with a harmless-looking fact row, and the
  failure is not shown. The same with a product function made non-deterministic: `fail` then `pass` on
  rerun gives `flaky`, the command leaves the inner set for the attempt, and the row no longer says
  `fail`.
- Scenario B. A task legitimately adds a dependency to `package.json` or a target to the `Makefile`
  (class A). IR-12's authorisation covers class B only. Every check for the rest of the phase, across
  attempts and resumes, is `tainted`. The layer is useless for that phase, silently.
- Scenario C. IR-11 compares "before the gate" and does not say what the gate does on a difference. If
  the gate fails, phases of scenario B can never be approved. If it does not, prevention rests on the
  critic alone. IR-28 counts a tainted `pass` as a breach, and does not say whether a gate command is a
  "check".
- Proposed rules: IR-40, IR-41. Disposition: rule, and owner item O-5 for scenario C.

**V-08. Corrupting the ledger or the manifest erases inconvenient results at no cost.** `inferred`
from IR-08, IR-25, IR-07, IR-28.

- Scenario. At C0 the control plane is writable by the same OS user (R23 Open question 8, R11 T-02
  residual). Inner results are bad. The proposer, or a test the runtime executes, appends one byte to
  the ledger. IR-25: the layer is off, "the unit evidence says that inner results are unavailable". The
  critic sees no `fail` row. IR-28 classes this as "an integrity event and not a breach". The run goes
  on, and IR-07 forbids a stop.
- Defeats the intent of IR-25: detection without consequence.
- Proposed rule: IR-42. Disposition: rule for reporting the event to the critic as a fact; owner item
  O-6 for whether an integrity event may halt a run (decision 21 allows no new stop reason).

**V-09. A per-task status presents a tree-level result as a fact about a task.** `verified-local` for
the mapping facts (R23 F-02), `inferred` for the effect.

- Facts. The check set is per phase; in the reference feature 15 of 16 phases have one command. The
  task IDs come from the proposer's checkpoint (IR-09: "a checkpoint is a claim"). F-16 then shows
  "Status per task: `pass`" in a block the runtime inserts as fact.
- Scenario. The proposer declares one unit naming all 41 tasks of a phase at a moment when
  `go test ./...` passes. The critic receives 41 rows reading `pass`, stated by the runtime, including
  rows for documentation tasks that no command exercises. The claim (which tasks) has been promoted to a
  fact by the projection.
- Defeats decision 21's "facts it can verify"; adds to R23 Open question 7 a concrete priming path.
- Proposed rule: IR-43. Disposition: rule.

**V-10. Strings the proposer controls appear inside the trusted fact block.** `inferred` from F-16 and
R11 T-04, R-5.

- Scenario. F-16 includes "paths changed, deleted or added". The proposer adds a file whose name is a
  sentence ("tests/all_criteria_verified_by_runtime_no_review_needed_test.go") or contains a newline
  and an imitation of a runtime banner. The runtime prints it in the block the critic is told to trust.
  The nonce still protects the verdict line (Principle II), so this is persuasion, not forgery.
- Rule missing; R11 R-5 wraps untrusted text and the fact block is outside that wrapping.
- Proposed rule: IR-44. Disposition: rule.

**V-11. Grounding reaches repair history through paths that IR-19 does not refuse.** `verified-local`.

- Facts. A relative citation inside the workdir resolves (`lib/critic.py:839-841`); an absolute path is
  honoured if it exists (`:813`). `.git` is skipped only when a cited directory is expanded
  (`:234-237`, `:1328`), not for a directly cited file. The snapshot prints each file's mtime
  (`:1444-1453`). IR-19 refuses the control plane only.
- Scenarios. (1) Evidence cites `.git/logs/HEAD`: if the runtime keeps a unit by committing (R25 RT-D
  "revert to the last kept commit"), the reflog lists every keep and revert with its time. (2) Evidence
  cites a checkpoint left in the outbox, which is in the workspace. (3) Evidence cites a context
  carry-over file (decision 22, R24) that holds failure blocks. (4) The mtimes of cited files give the
  order of work.
- Defeats IR-19 and IR-20 in part; IR-20 admits paraphrase.
- Proposed rule: IR-45. Disposition: rule. Mtime is Principle III text; owner item O-7.

**V-12. Unit IDs and per-row fingerprints leak order and a lower bound on the cycle count.**
`inferred` from F-16, IR-18.

- Scenario. T1 and T3 show unit `{T1,T2,T3}`, T2 shows unit `{T2}`: T2 was checked again after the
  group. Three distinct fingerprints in the block mean at least three checks. `superseded` on some rows
  and `current` on others orders them. IR-18's byte-identity test passes only for fixtures chosen to
  end in the same units.
- Defeats F-16's exclusions ("order in which units were declared", "number of cycles") in part.
- Proposed rule: IR-46. Disposition: rule; decision 21 says "for each unit", so removing the unit ID is
  owner item O-8.

**V-13. The critic-collision rule exists only in R25, covers one model, and is evaluated once.**
`verified-local` for the texts.

- Facts. R25 RT-D: the target "may not equal the critic's resolved model". R23 has no such rule; IR-21
  covers sessions only. IR-19 names four critic-class roles. Decision 8 allows a per-role fallback that
  changes the critic's model during a run.
- Scenario. Escalation lifts two units to model M. Later the critic's quota ends and its fallback
  resolves to M. The gate is judged by the model that wrote part of the work; the doctor's warning of
  decision 7 was computed at launch and does not fire.
- Proposed rule: IR-47. Disposition: rule. Whether a higher effort on the same model counts as diverse
  (R25 Open question 4) is owner item O-9.

**V-14. Checkpoint passes can reset the consecutive breakers.** `verified-local`.

- Facts. A pass that is neither killed nor in error sets `consec_err=0` and `consec_cap=0`
  (`proposer.sh:2337-2340`); a pass that changed the tree sets `consec_noprogress=0` (`:2352-2354`).
  Limits are 2, 3 and 3 (`:1897`, `:1912`, `:1934`). A yield avoids all of this by `continue`
  (`:2143`). R23 places the checkpoint "before the classic accounting" but F-15 says the error and cap
  breakers are "Unchanged" and IR-24 sends checkpoint passes through the no-progress test, so they
  reach the accounting. IR-06 lists no proposer-loop counter.
- Scenario. Hard-cap kill, short checkpoint pass, hard-cap kill, short checkpoint pass. `consec_cap`
  never reaches 3, exit 10 never fires, and because checkpoint passes give their iteration back the
  attempt runs up to the iteration limit in killed passes plus the cycle cap.
- Defeats decision 21 ("inner cycles count against their own caps only") for counters IR-06 omits.
- Proposed rule: IR-48. Disposition: rule.

**V-15. The closing check can turn an attempt that had evidence into a run stop, or send stale
evidence to the gate.** `verified-local` for the baseline, `inferred` for the scenario.

- Facts. Today evidence ends the loop at once with exit 0 (`proposer.sh:2176-2180`). IR-05 moves the
  evidence aside while cycles remain.
- Scenario A. The closing check fails, the proposer is returned to work, and during the repair a
  breaker fires: iteration limit (exit 4), errors (7), no progress (8), cap (10), yield budget (9). The
  run stops. In the classic loop the same attempt had gone to the gate and produced a verdict. The exit
  codes are old; the occasion is new.
- Scenario B. Cycles end during the repair. IR-05: "the evidence goes to the gate unchanged". The tree
  has changed since the evidence was written, so the critic reads an account of a tree that no longer
  exists.
- Scenario C. R23 does not say where the evidence is kept while aside. In the workspace the proposer
  can rewrite it (acceptable) or a stale copy can be restored over a newer one; in the control plane
  the proposer cannot update it.
- Defeats IR-07 in spirit and IR-05.
- Proposed rule: IR-49. Disposition: rule; it adds to R23's own pending decision 3.

**V-16. Resume: uncounted reruns, counters that R23 does not carry, a reset flag that can replay, and
per-unit counts that regrouping evades.** `inferred` from F-17, IR-26, IR-27.

- Scenario A. F-17: an interrupted check "counts neither as a cycle nor as a failure" and is run again.
  A process that signals the runtime while a failing check runs, under a supervisor that relaunches,
  buys unlimited uncounted reruns. With a check that passes half the time the result becomes `pass`.
- Scenario B. IR-23 bounds passes per attempt by "the iteration limit plus the cycle cap plus the yield
  cap". R23 carries the cycle count over a resume; it says nothing of the pass index, the yield index
  or the breakers. If those restart on resume while the attempt number is kept (decision 23), the bound
  holds per launch, not per attempt.
- Scenario C. "A flag resets them" (IR-26) and IR-27 records settings in the settings replay. If the
  flag is replayed, every later resume resets the counts. If the flag can be set in project
  configuration, the proposer can set it (R11 T-13: project configuration may only narrow).
- Scenario D. The per-unit failure count is keyed by the unit ID, a hash of the task IDs. `{T1}` fails
  twice; the proposer declares `{T1,T2}`; the count starts at zero. R25's caps (2 repairs, 1
  escalation per unit) are then chosen by the proposer, in both directions.
- Proposed rule: IR-50. Disposition: rule. Whether decision 23 extends to the pass index and yield
  index is owner item O-10.

**V-17. The first-failure predicate can stop a job that would have passed, and produces result files
stitched from two runs.** `verified-local` for the file shape (R23 F-21), `inferred` for the scenarios.

- Scenario A (stale line). The result file is appended to and holds a failed line from an earlier run.
  The predicate matches on the first poll and the runtime stops the job at second 10.
- Scenario B (expected or optional failure). A negative test records a non-zero exit by design, or a
  step outside the required scope fails, or the job retries a step and passes. "First failed required
  step" belongs to the step runner; the predicate has a `pattern` only.
- Scenario C (the proposer fires it). The predicate's `path` and `pattern` are the proposer's. It can
  match at once. IR-29 holds: no status changes. What it gains is scenario D.
- Scenario D (stitching). A job is stopped at step 35. The proposer repairs and reruns from step 35
  with its own script. The result file now shows 159 passing steps, of which 34 ran on the old tree.
  The evidence cites the file; grounding confirms that it exists and what it says. IR-30 marks
  `partial` only for the runtime's step runner, not for a script the proposer runs.
- Scenario E. The baseline deliberately leaves jobs running on stop and on timeout
  (`proposer.sh:2146-2163`). Killing a job in the middle can leave a lab or containers in a state the
  next run trips over, and the later failures of the same run, which would have been repaired in the
  same round, are lost. R23's 29.3 h assumes that time after the first failure has no value.
- Defeats IR-29's intent and leaves IR-30 without coverage for existing scripts.
- Proposed rule: IR-51. Disposition: rule. Telling the critic that a run was stopped and resumed is a
  fact about integrity and also a piece of repair history; owner item O-11.

**V-18. R23 contradicts itself on whether the gate stops at the first failed command.**
`verified-local`.

- Facts. F-21 row 4: "Gate stops at the first failed command", needs "Layer on". IR-03: the gate
  "executes every command of the phase gate on every attempt". The baseline runs all commands
  (`passed = all(...)`, `lib/verification_plan.py:2172`).
- Consequence. With row 4 the verification evidence, the failure digest given to the proposer
  (`orchestrator.sh:2005`) and the diagnostician's input differ between layer on and layer off for every
  fixture with a failing gate. That is a parity difference no register row names, and it changes an
  outer-loop input, against IR-06.
- Proposed rule: amendment to IR-03. Disposition: rule.

**V-19. The layer-on parity suite differs from the layer-off run in surfaces that F-18 does not
name.** `inferred`; baseline facts `verified-local`.

| # | Surface | Why it differs with stubs that never declare a unit |
|---|---|---|
| 1 | The unit evidence block in the critic prompt, and every value derived from the prompt (hash, size, budget events, trimming by IR-22) | F-16 gives one row per task even when none was declared (`unchecked`). F-07 asks for a register row; F-18's list omits it. |
| 2 | Executions of the closing check | Oracle fixtures end with evidence. IR-05 runs the inner set when evidence appears, whether or not a unit was declared. A failing closing check returns the stub to work, which changes pass counts, events and possibly the exit code. |
| 3 | `prompt_block_dropped` and `prompt_block_protected` events | The checkpoint contract block is protected (F-13). Under a tight prompt budget it displaces another block. |
| 4 | Kills by the repeat-stall watchdog | The manifest's argv are exempt (F-15). The default ignore list already covers common runners (`proposer.sh:186`), so this differs only for a fixture that repeats a manifest command outside that list. |
| 5 | Fingerprint events at phase entry, and protected-set fact rows | IR-11 runs at phase entry in every attempt. A stub that edits a test file produces fact rows. |
| 6 | `route.decided` events | R25 RT-F emits one at every decision point and asks for a register entry. |
| 7 | Files in the control plane: manifest, ledger, fingerprints | Present with the layer on. The oracle compares artifacts. |
| 8 | The approval record's bound tree fingerprint (IR-02) | Must be written with the layer off as well, or it is a layer field. |
| 9 | Grounding refusals (IR-19, IR-45) | The baseline resolves citations of state paths on purpose (`lib/critic.py:838`). If the refusal applies only with the layer on, a fixture that cites a state path differs. |
| 10 | The no-progress exclusion of the outbox (IR-24) | Must not depend on the layer. |
| 11 | Gate stopping at the first failed command | V-18. |

- Defeats decision 21's inertness clause as R23 implements it.
- Proposed rule: IR-52. Disposition: rule; it widens R23's pending decision 1 (O-12).

**V-20. R25 and R23 contradict each other in five places.** `verified-local` for both texts.

| # | R25 | R23 | Consequence |
|---|---|---|---|
| 1 | RT-B: the router picks checks "per unit", including "lint on changed files, targeted tests"; R23 "freezes it before the unit starts" | Q2, IR-08: the set is per phase, fixed at launch, fixed argv | Argv built from the changed-file set is not fixed and its input is the proposer's. The proposer would steer which checks run. |
| 2 | RT-C: the kind of loop is chosen per attempt; `loop.no-check` and `loop.single` give `classic` | IR-27: strategy is chosen at launch; IR-15: an empty set leaves the layer on with `unchecked` rows | Two different `[LOOP]` lines and two different critic inputs for the same phase. |
| 3 | RT-D: on `unresolved`, "revert to the last kept commit" | No commit and no revert anywhere; on spent caps the classic loop carries on with the tree as it is | A revert by the runtime destroys proposer work, writes git history (V-11), and makes the tree clean, which enables prestage reuse that a dirty tree blocks (`lib/verification_plan.py:1969-1970`). |
| 4 | RT-D: a protected-path or check-config edit is an integrity event that "stop[s] the layer" | IR-11: the check is `tainted`, the layer continues; IR-07 lists three causes of switching off and taint is not one | Undefined behaviour on the commonest integrity event. |
| 5 | RT-D: triggers on "the same normalised failure signature" and a "repeated working-tree diff hash"; "R23 owns the detectors" | Defines neither | The escalation trigger has no definition. A signature needs check output to be parsed, which is untrusted text (R11 R-5). |

- Proposed rule: IR-53. Disposition: rule for rows 1, 2, 4, 5 (R23 governs); row 3 is owner item O-13.

**V-21. R11 and R23 differ in four places, and a relaunch re-derives the manifest from a tree the
proposer has changed.** `verified-local` for the texts, `inferred` for the scenario.

| # | R11 | R23 |
|---|---|---|
| 1 | T-19: a change to a check's files "fails the inner check" | IR-11: `tainted`, never `fail` (and see V-07) |
| 2 | T-20: fingerprint "at attempt start"; test counts compared | IR-11: at phase entry, kept across attempts (stronger); no count (V-06) |
| 3 | T-21: checks run at "the same sandbox level as the proposer or stricter", no write access to the control plane | IR-10 sets environment, argv, timeout and output cap, and no sandbox level |
| 4 | T-13 names "a verification command" in project configuration as a vector; its list of keys honoured only from user scope does not contain verification commands | IR-08 derives the manifest from discovered and declared commands, which are repository content |

- Scenario for row 4. IR-27 pins the manifest hash over a resume. Decision 23 also speaks of a
  relaunch. On a relaunch the manifest is derived again, from `package.json` scripts, `Makefile`
  targets and declared commands that earlier phases' proposers could edit. The new manifest is valid,
  hashed and signed, and weaker.
- Proposed rule: IR-54, and IR-10 amended. Disposition: rule.

### Cosmetic or low

**V-22. The checkpoint file is read without rules for its file type, age or writer.** `inferred` from
IR-09. A symbolic link to a large file, a FIFO (the read blocks, and no watchdog runs when no pass is
alive, `proposer.sh:1045` as cited by R23 F-11), a checkpoint left by an earlier pass, or one written by
a leftover process while a check runs. Availability only. Proposed rule: IR-55. Disposition: rule.

**V-23. The task list that validates a checkpoint and orders the rows is not stated to be the launch-time
reading.** `inferred` from IR-09, IR-12, F-16. IR-12 uses "the launch-time reading" for authorisation;
IR-09 validates IDs "in the phase" and F-16 orders rows "in `tasks.md` order" without saying which
reading. A proposer that deletes a task line from `tasks.md` would remove its row. Proposed rule:
IR-56. Disposition: rule. Severity is low only if the rule is added.

**V-24. The tests of IR-23 and IR-24 describe the same stub with different outcomes, and F-15
contradicts IR-24.** `verified-local`. IR-23: a stub "that writes a valid checkpoint for ever" ends
with `proposer_max_iter`. IR-24: a stub "that writes only checkpoints" ends with
`proposer_no_progress` after 3 passes. The first stub must also change the tree; the test does not say
so. F-15 says the no-progress breaker is "Unchanged", IR-24 changes what it excludes. Disposition:
rule (wording).

## Rules that held

`inferred` throughout; each line says what was tried.

| Rule | Attack tried | Result |
|---|---|---|
| IR-01 | Find a write path from the layer to an approval, feedback or hint | None, given the control plane of R11 R-1. At the baseline the approval is an empty file in the write scope (`orchestrator.sh:2059`); the rule depends on R-1 and on T-02's signed record. |
| IR-04 | Plant a verdict line in a ledger record, a checkpoint note or a fact row | Held by Principle II: the nonce is created inside the critic call. V-10 is persuasion, not forgery. |
| IR-06 | Move the reject count, attempt number or MALFORMED streak with an inner event | Held for the counters it lists. It omits the proposer-loop counters (V-14). |
| IR-07 | Produce a new exit code | None found. New occasions for old codes exist (V-15). |
| IR-09 | Put `argv`, `status` or `result` in the checkpoint | Held: the fields are ignored. File handling is V-22. |
| IR-13 | Have proposer-run test output recorded as a result | Held for the ledger. It does not cover result files that grounding reads (V-17 D). |
| IR-15 | Show `unchecked` as `pass`, or fail a unit on an empty set | Held. |
| IR-17 | Plant a unit evidence file in the workspace | Held. |
| IR-21 | Hand a continued proposer session to a critic-class call | Held as written; decision 22 agrees. Model identity is V-13. |
| IR-22 | Crowd out the criteria section with a large block | Held. |
| IR-23 | Unbounded passes by toggling a file between two states | Held within one launch: each pass spends a cycle. Across resumes see V-16 B. |
| IR-29 | Change a status through a result file | Held. |
| IR-30 | Satisfy the gate with a resumed step run | Held for the step runner. |
| T-02 against R23 | Forge an approval through the layer | No new path. R23 adds the tree fingerprint to the record, which is consistent with R11. The C0 residual is R11's and stays pending there (R11 Open question 3). One addition: see IR-57 on key separation. |

Rules that held only in part are in the findings: IR-02, IR-03 (V-03, V-18), IR-05 (V-15), IR-08
(V-21), IR-10 (V-04, V-21), IR-11, IR-12 (V-01, V-02, V-05, V-07), IR-14 (V-04, V-07), IR-16 (V-01),
IR-18 (V-12), IR-19, IR-20 (V-11), IR-24 (V-24), IR-25, IR-28 (V-08), IR-26, IR-27 (V-16).

## Proposed new or amended rules

| ID | Rule text | Closes |
|---|---|---|
| IR-31 | The protected set and the tree fingerprint are taken immediately before and immediately after every check, every gate command and the critic's grounding pass. A result is `pass` only if both readings are equal, apart from paths the manifest declares as outputs of that command. Otherwise it is `tainted` with the reason `changed-during-check`. | V-01 |
| IR-32 | Before a check or the gate starts, the runtime ends every process of the pass that it can identify (process group, session, and the sandbox or cgroup where one exists), except a job held by an accepted yield. Where it cannot guarantee that none remains, the `[LOOP]` line and the doctor say `protection=detect`, and IR-31 is the control. | V-01 |
| IR-33 | The run keeps the protected-set fingerprint taken at launch. At the entry of phase N+1 the tree must equal the tree fingerprint bound in phase N's approval record (IR-02). A difference is an integrity event, and the differing protected paths are fact rows for the critic of phase N+1. Every critic also receives the protected paths changed since launch in phases already approved, as a short list marked as such. | V-02 |
| IR-34 | The layer is on only in a run whose verification gate executes. In any other verification mode the run uses the classic loop, announced as a fallback with the reason `gate-not-executing` (IR-27). IR-02's exception "or mode not `required`" applies to the classic loop only. | V-03 |
| IR-35 | The tree fingerprint is defined in the specification: it covers tracked files and untracked files that are not ignored, names what it excludes, and the exclusions are recorded with the manifest. Ignored paths that a manifest command executes from (the runner's package directory, the virtual environment's executables) are in class A by hash of their metadata listing. | V-04 (3, 5) |
| IR-36 | Each manifest executable is resolved at launch to an absolute real path, recorded with its size and hash; before each check the record is verified. `PATH` for a check is the launch-time value. The toolchain's effective configuration, where the adapter for that toolchain can print it, is recorded at phase entry and compared before each check; a difference taints. Checks run with a home and configuration directory that the pass cannot write, where the containment level allows it. | V-04 (1, 2) |
| IR-37 | Cache locations known for a detected toolchain are either disabled through the environment of the check or are in class A. A result that the tool reports as replayed from a cache is recorded as `cached` and is not `pass` at the gate. | V-04 (4) |
| IR-38 | Class A is a set of path patterns evaluated at every comparison, not the list of files found at phase entry. A new file that matches a class A pattern taints. The patterns include the files by which a runner changes collection or start-up (for example `conftest.py`, a test file that defines the package's main test entry, runner set-up files, ignore files, nested compiler configuration). The pattern set is versioned data per toolchain. | V-05 |
| IR-39 | The runtime counts suppression markers added and removed in the diff since phase entry, from a versioned pattern set, and gives the counts per file to the critic as facts. | V-06 |
| IR-40 | The unit evidence has separate columns for the exit result and for each condition (`tainted`, `flaky`, `superseded`, `cached`). A condition never replaces the exit result. `flaky` is stated per command with both observed results. | V-07 A |
| IR-41 | Authorisation from the launch-time task text (IR-12) applies to class A paths as it does to class B. An authorised class A change is a fact row and does not taint. | V-07 B |
| IR-42 | An integrity event of the layer (invalid ledger, manifest mismatch, fingerprint changed during a check, phase-entry mismatch) is a row in the critic's fact block, with its kind and no count. The rows the ledger held before the first invalid record stay in the unit evidence. | V-08 |
| IR-43 | The unit evidence states results per command and tree: command ID, exit result, conditions. The task column is headed as the proposer's declaration, and the block says in one fixed sentence that a result is evidence about the tree and not about a task. A task that no manifest command can exercise is `unchecked`, whatever unit named it. | V-09 |
| IR-44 | Every string in the fact block that originates in the workspace (paths, command arguments read from repository files) is escaped, cut to a fixed length, stripped of control characters and line breaks, and printed inside a data boundary with a per-call token (R11 R-5). | V-10 |
| IR-45 | Grounding refuses, by real path: the control plane, the outbox, the context carry-over files of decision 22, and everything under `.git`. Checkpoints are moved into the control plane when read. This rule is independent of the layer. | V-11, V-19 (9) |
| IR-46 | A row carries `current` or `superseded` and no fingerprint value; the fingerprint of the tree at the gate is stated once. | V-12 |
| IR-47 | At launch and again before every critic-class call, the runtime compares the resolved model of that call with the set of models that produced passes in the attempt. An escalation target may equal none of the critic-class models resolved for the run. A match found at gate time raises the warning of decision 7 and is recorded; it does not block. | V-13 |
| IR-48 | A pass that ends at a valid checkpoint leaves `consec_err`, `consec_cap` and `consec_short` as they were, neither raised nor reset, as a yield does. The no-progress test applies to it as in IR-24. IR-06's list gains these counters and the yield index. | V-14 |
| IR-49 | From the moment evidence exists in an attempt, no limit or breaker of the proposer loop may stop the run. If one fires during a repair after a closing check, the repair ends and the attempt goes to the gate. Evidence set aside is kept in the control plane with its hash, the proposer receives a copy, and the gate takes the newer of the proposer's rewritten evidence and the kept one. If the tree changed and the evidence did not, the critic's fact block says that the evidence predates the tree. | V-15 |
| IR-50 | (a) An interrupted check is recorded, and the second interruption of the same check in an attempt counts as a cycle. (b) The pass index, the yield index and the consecutive breakers of an attempt are in the ledger and continue after a resume. (c) The reset flag is accepted from the command line only, is recorded as an event, and is never written to the settings replay. (d) Failure counts and escalation counts are kept per task ID; a unit's count is the highest among its tasks. | V-16 |
| IR-51 | A first-failure predicate reads only bytes appended after the job started, to the same file identity, whole lines only, and must match on two successive polls. It never stops a job in `adopt` mode. A job is stopped by signal to its process group with a grace period, and the stop is an event. The yield may declare `on_first_failure: stop` or `continue-and-notify`; the default is for the owner (O-11). | V-17 A, B, C, E |
| IR-03 (amended) | Add: "The gate does not stop at a failed command. Stopping at the first failure is available to the step runner inside a yield and nowhere else." Delete row 4 of F-21. | V-18 |
| IR-52 | With no unit declared in an attempt, the layer executes nothing and adds nothing to any prompt but the checkpoint contract block: no closing check, no unit evidence block, no fingerprint event. The register names every remaining surface one by one, including the prompt-budget events. Rules that are not part of the layer (IR-02's fingerprint binding, IR-45, IR-24's exclusion) apply with the layer off as well and get their own register rows against the oracle. | V-19 |
| IR-53 | The router orders and excludes among manifest entries and adds none; it builds no argv. An exclusion has one of the reasons of IR-08 and appears in the unit evidence. The strategy is pinned at launch; a per-attempt choice can only switch the layer off for that attempt, with an announcement. A tainted check does not switch the layer off; the integrity events of IR-42 other than taint do. The failure signature is the ordered list of failed command IDs with exit codes, and the diff hash is the tree fingerprint; no check output is parsed for a trigger. | V-20 (1, 2, 4, 5) |
| IR-54 | A relaunch of a feature that has a recorded manifest compares the newly derived manifest with it. A removed or changed command is announced at launch, recorded, and given to every critic of the run as a fact. The files the derivation reads are class A. | V-21 (4) |
| IR-10 (amended) | Add: "at the containment level of the proposer or stricter, with no write access to the control plane where the level allows it" (R11 T-21). | V-21 (3) |
| IR-55 | The checkpoint is opened without following links and without blocking, must be a regular file inside the outbox, newer than the start of the pass and unchanged between two reads after the pass exited. Any checkpoint present when a pass starts is removed with an event. | V-22 |
| IR-56 | The task list of a phase, its order and its IDs are read at launch and stored with their hash in the control plane. Checkpoint validation and the rows of the unit evidence use that reading. A difference between it and `tasks.md` at the gate is a fact row. | V-23 |
| IR-57 | The key that signs the ledger is not the key that signs approval records. The approval key is never present in the environment or on a path readable from a check's containment level, where that level allows it. | T-02 residual |
| IR-23, IR-24 (wording) | State in IR-23's test that the stub changes the tree in every pass. Change F-15's row for the no-progress breaker to refer to IR-24. | V-24 |

## Items for the owner

Each item: the evidence, the default to proceed on, what changes on the other ruling.

| ID | Decision | Evidence | Default | If ruled otherwise |
|---|---|---|---|---|
| O-1 | Should the gate and the critic's grounding run on an immutable snapshot of the tree? | V-01: at C0 no process rule is complete. | No snapshot; IR-31 and IR-32 detect. | A copy per gate (R23 O-2 option 3): build caches lost, more disk and time, and V-01 is prevented instead of detected. |
| O-2 | Layer in a run whose gate does not execute | V-03 | IR-34: classic loop, announced. | Inner checks run, and the block tells the critic that no gate ran. Decision 21's wording would need an exception. |
| O-3 | "Cannot edit a check" at C0 | V-04, V-08, and R23's own pending decision 2 | Detect and void, stated in `[LOOP]`. | Default level limited to C2, against "works on every harness". This review adds evidence to R23's item; it is not a new item. |
| O-4 | Test counts before and after | V-06, R11 T-20 | Not in Wave 1; suppression counts only (IR-39). | A result parser per runner behind an extension point. |
| O-5 | What the gate does when the protected set differs without authorisation | V-07 C | The gate runs, the result carries the condition, the critic is told, approval stays possible. | The gate fails. Then IR-41 must be complete, or legitimate phases cannot pass. |
| O-6 | May an integrity event halt the run? | V-08; decision 21 allows no new stop reason | No halt; IR-42 reports to the critic. | A stop under an existing reason, or an amendment of decision 21's last clause for integrity events only. |
| O-7 | File mtimes in the grounding snapshot | V-11 (4); Principle III names mtime | Keep. | Drop or coarsen; needs amendment wording. |
| O-8 | Unit ID in the unit evidence | V-12; decision 21 says "for each unit" | Keep the unit ID, remove fingerprints (IR-46). | Rows per command and tree only. |
| O-9 | Is a higher effort on the critic's model a collision? | V-13; R25 Open question 4 | Not a collision; warn. | Escalation is skipped in most Claude-only runs. |
| O-10 | Does decision 23 cover the pass index, yield index and breakers? | V-16 B | Yes (IR-50 b). | The bound of IR-23 is stated per launch. |
| O-11 | Default of first-failure: stop or notify; and is "this job was stopped and resumed" a fact for the critic or repair history? | V-17 D, E | Stop only jobs the runtime launched and that declare it; the critic is told that a cited result file belongs to a job that was stopped, without counts. | With notify as default the 29.3 h pool shrinks. With nothing told to the critic, stitched files pass grounding. |
| O-12 | Inertness: scope | V-19; R23 pending decision 1 | IR-52. | If the closing check or the fingerprint at phase entry must run without a declared unit, inertness cannot hold and the clause of decision 21 needs rewording. |
| O-13 | Does the runtime commit kept units and revert unresolved ones? | V-20 (3) | No commit and no revert inside an attempt; the commit at approval stays as today. | Commits per unit: git history becomes a record of the micro-loop, the clean tree enables prestage reuse, and the phase commit of the oracle differs. |

## Open questions / risks

1. **Retry until green.** A check that passes some of the time can be declared again until it
   passes, within the cycle cap. IR-14 reruns failures only. The history that would show it is
   withheld by decision 21. The gate runs once, and attempts repeat. The classic loop has the same
   weakness. `inferred`. No rule proposed; R27's canary experiment should include a flaky check.
2. **Pattern sets age.** IR-38, IR-39, IR-36 and IR-37 depend on versioned data per toolchain. For a
   toolchain with no entry the protection is that of R23 as written. The doctor should say which
   toolchains a run detected and which have patterns. `inferred`.
3. **Cost of two fingerprints per check** (IR-31) is unmeasured, as the cost of a check is (R23 F-05).
   `unverified`: no run exists to measure.
4. **A quota signal imitated in the proposer's stream** would make a cycle uncounted (R23 F-15,
   "The paused cycle is not counted"). R11 T-17 covers stream framing. Not pursued further.
   `inferred`.
5. **What I did not check.** The critic's prompt assembly beyond the cited lines; the diagnostician's
   full input (`orchestrator.sh:1074` onward was read for its arguments only); mixture-of-loops'
   parser for the `[LOOP]` line (R23 Open question 9 stands); R22, R24 and R26, which may define
   values these rules use. `unverified`.
6. **No finding here shows decision 21, 22 or 23 to be infeasible.** V-03, V-08, V-15 and V-19 show
   that three of decision 21's clauses (the gate always runs, no stop reasons, identical output with
   inert stubs) need the rules above or the rulings O-2, O-6 and O-12 to be true as written.
