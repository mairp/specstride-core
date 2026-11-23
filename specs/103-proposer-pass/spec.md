# Feature Specification: Proposer pass

**Feature Branch**: `103-proposer-pass` (a label: Spec Kit creates no branch in this repository; the directory is `specs/103-proposer-pass`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 103-proposer-pass: the pass loop inside one phase attempt, ported for parity (pass numbering, the pass limit, the consecutive-error breaker, the no-progress breaker, the pass-ceiling breaker, the mapping of the loop's result to the engine's exit); the source hashes compared at every pass start; the start-up of a pass in linear time; the call points of the loop-layer interface and the built-in layer `none`, with the core side for a stacked layer; the proposer's prompt assembler and its blocks; carry-over (ledger, handoff, index of verification obligations, cache-stable prompt start) and the session directive of every pass."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority), `architecture.md` (sections 2, 3, 8, 9), `consolidation.md` (sections 1, 3, 4, 5, 6), `feature-briefs.md` (brief 103-proposer-pass, sections D.5 and D.8), `STAGE-B-RULES.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182), `traceability.md`, `traceability-frs.tsv`, `traceability-items.tsv`, `research/R18-behaviour-inventory.tsv`, `research/R24-warm-start-context-carry-over.md`, `research/R27-run-acceleration-synthesis.md` (D1.1, D1.10, D1.11), `research/R28-netops-run-stuck-diagnosis.md`, `research/R12-memory-compression.md`, `research/R29-parallel-units-design.md` (PU-05, PU-33), feature 100 (`specs/100-specstride/`) and feature 141 (`specs/141-parity-oracle/`). Behaviour was read from the Specstride baseline `9cab15d` (`proposer.sh`, `orchestrator.sh`, `lib/error_breaker.py`) and from Lisa `363e6a3` (`packages/core/src/engine/proposer-context.ts`).

## What this feature is

Inside one phase attempt the proposer works in passes. A pass is one start of a harness with a prompt. The pass loop decides when the next pass starts, what its prompt holds, whether it continues a session, and when the loop must stop because the phase evidence exists, a limit was reached, a breaker fired, or a source changed.

Today the loop is a Bash script. It has one flaw that costs about nine minutes of processor time before every start of a proposer on a large prompt, and it has no memory: every start begins with counters at zero, a fresh session and a prompt of up to 275 kB. This feature ports the loop for parity, fixes the start-up, and adds the parts that let later work stay small: the call points at which a loop layer may act, one assembler for the proposer's prompt, and carry-over through files that the runtime writes.

**In scope**: the pass loop of one phase attempt: pass numbering, the pass limit, the consecutive-error breaker, the no-progress breaker, the pass-ceiling breaker, the short-pass counter's place in the accounting order, the end of the loop the instant phase evidence exists; the mapping of the loop's result to the engine's exit and stop reason; the call points of the loop-layer interface and the built-in layer `none`; the core side of the loop-layer interface for a stacked layer; the assembler of the proposer's prompt and its blocks; the ledger, the handoff, the index of verification obligations and the cache-stable start of the prompt; the comparison of the source hashes at the start of every pass; the start-up of a pass in time that grows linearly with the size of the prompt; the session directive of every pass.

**Out of scope**:

| Out of scope | Owner |
|---|---|
| Watchdogs, kills, the polite stop, yield and detached jobs, fail-fast | 118 |
| The micro-loop layer and the router table | 115 |
| The layer `parallel`, the group executor, the tree store and integration | 142 |
| The hashing and the staleness verdict; the comparison at launch and at resume | 104; 102 |
| Starting a harness, its arguments, session directives as arguments | 109; the harness adapters 125, 130, 131, 134, 138 |
| Reading the stream of a pass | 126 |
| The critic's prompt | 117 |
| The rule that counts survive a resume as a consumer-visible rule, and the reset flag | 102 |
| Quota classification of a failed pass; the whole-run wall-clock budget | 127 |
| The short-pass counter, its limit and the nudge block, which the traceability files assign to 118 | 118 |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A run halts at the right limit with the right code (Priority: P1)

An operator, or a script of theirs, runs a feature. The proposer never delivers phase evidence: it errors, it changes nothing, it is killed at the pass ceiling, or it uses every pass. The run must halt after the same number of passes, with the same exit code, the same stop reason and the same lines as the baseline.

**Why this priority**: Exit codes and stop reasons are matched by other programs today. The supervisor's classifier, the learning layer and the operator's own scripts read them. A changed limit or a changed number burns either money or a run.

**Independent Test**: Run fixture families FX-17 to FX-20 and FX-24 through the oracle under the `parity` profile. Every surface is `equal`.

**Acceptance Scenarios**:

1. **Given** a proposer that never writes phase evidence and a pass limit of N, **When** N passes have ended, **Then** the pass loop returns 4, no stop line of its own is written, the engine writes `proposer_max_iter` and exits 4 (F103-FR-011, F103-FR-019).
2. **Given** a proposer whose passes end in error, **When** the count reaches the limit (2 by default), **Then** the result is 7, the stop reason is `proposer_consecutive_errors` and the engine exits 4 (F103-FR-012, F103-FR-014, F103-FR-019).
3. **Given** a proposer whose passes end cleanly and change nothing, **When** three passes in a row changed nothing, **Then** the result is 8, the stop reason is `proposer_no_progress` and the engine exits 4 (F103-FR-017, F103-FR-019).
4. **Given** passes killed at the pass ceiling, **When** the third in a row is killed, **Then** the result is 10, the stop reason is `proposer_cap_exhausted`, the error counter is untouched and the engine exits 4 (F103-FR-015, F103-FR-019).
5. **Given** phase evidence that exists after a pass that also ended in error, **When** the pass loop looks, **Then** the result is 0 and no breaker fires (F103-FR-005).

---

### User Story 2 - A changed source costs at most one pass (Priority: P1)

An operator amends the task list, the plan or the spec while a run works. Today the change is noticed when the critic starts, hours later. The run must notice it before the next pass starts, say which file changed, and rest until the operator answers.

**Why this priority**: The reference run lost a 44-hour phase attempt, because an edit of the task list made the critic refuse the evidence 22 hours after the edit (R28).

**Independent Test**: Edit the text of the task list between two passes: no further pass starts, and the file is named. Tick a checkbox instead: the run goes on.

**Acceptance Scenarios**:

1. **Given** a run inside a phase attempt, **When** the text of the spec, the plan or the task list differs from the hash pinned in the run snapshot at the start of a pass, **Then** the pass does not start, the run rests in `blocked-on-human` with the file named, and delivered phase evidence stays in place (F103-FR-021).
2. **Given** the same run, **When** only a checkbox of the task list changed, **Then** the pass starts (F103-FR-021).
3. **Given** the `parity` profile, **When** a source changes, **Then** the pass loop does not check; the plan is checked when the critic starts, as at the baseline (F103-FR-021).

---

### User Story 3 - A pass starts at once, with a small prompt (Priority: P1)

The proposer of a large phase must start in seconds and read a prompt that repeats nothing the runtime already knows.

**Why this priority**: The baseline spends 548 seconds of one core before a proposer starts on a prompt of 319 kB, and the first turn of a pass reads 107.8k tokens at the median.

**Independent Test**: Measure the time from the decision to start a pass to the start of the harness process for prompts from 20 kB to 320 kB: it does not grow faster than the size of the prompt. Compare first-turn tokens with and without the index of verification obligations.

**Acceptance Scenarios**:

1. **Given** a prompt of 320 kB, **When** a pass starts, **Then** the start-up takes under 1 s of processor time (F103-FR-008).
2. **Given** a prompt that holds only white space, **When** a pass would start, **Then** it is refused as today (F103-FR-006).
3. **Given** the index of verification obligations on, **When** the proposer's prompt is built, **Then** it holds one short line per obligation and the path of the full text, and the critic's prompt is unchanged (F103-FR-037).
4. **Given** any pass, **When** the prompt is built, **Then** `prompt.built` names every block and every drop (F103-FR-034).

---

### User Story 4 - A killed pass leaves a trail (Priority: P2)

A pass is killed after hours of work. The next pass must know what was in progress and must not start from a description written by the proposer.

**Why this priority**: 24.9 per cent of the proposer time of the reference run went into killed passes (R21).

**Independent Test**: Kill a pass of a fixture with a unit of work in progress. The next handoff names the unit; the tree is byte-identical to the tree the kill left.

**Acceptance Scenarios**:

1. **Given** a pass killed by a watchdog, **When** the next pass starts, **Then** the handoff was written again from the ledger, holds the tree fingerprint and the line that the tree wins, and the session is fresh (F103-FR-041, F103-FR-042).
2. **Given** a ledger that was edited, truncated or reordered, **When** the engine reads it on resume, **Then** every loop layer is off for the phase attempt and nothing stops (F103-FR-039).

---

### User Story 5 - An author adds a loop layer without touching the core (Priority: P2)

The author of a later loop layer registers it behind the call points of this feature. A layer that does nothing must leave every output unchanged; a stacked layer may ask for passes.

**Why this priority**: The micro-loop layer and parallel units are both layers. Neither may change the classic loop when it does not engage.

**Independent Test**: Register a sample layer `noop` outside the core: the whole oracle passes. Register a second sample layer above it that requests a group of two stub passes and integrates them: the whole oracle still passes when it is unregistered.

**Acceptance Scenarios**:

1. **Given** the layer `none`, or a layer that never engages, **When** any fixture runs, **Then** the output is identical to the classic loop apart from the fields the register names (F103-FR-023).
2. **Given** a layer that declares a directive the engine does not offer, **When** it registers, **Then** it is refused (F103-FR-025).
3. **Given** two layers, **When** a call point is reached, **Then** the outer layer is called first and the inner layer only when the outer returns `none` (F103-FR-024).

---

### Edge Cases

- The task list is edited between two passes and only the text of a checkbox changes: no stop (F103-FR-021).
- Phase evidence exists before the first pass (a resume that goes to the critic): exit 0 with no pass and before the prompt is read (F103-FR-006).
- A pass ends in error and writes phase evidence in the same pass: phase evidence wins (F103-FR-005).
- A pass is killed at the ceiling and left a yield artifact: the yield is refused and the kill is counted (F103-FR-015; the refusal is 118's).
- A harness emits no terminal record: a crashed pass reads as clean, as at the baseline (F103-FR-012).
- The no-progress breaker on the structured path: never evaluated under the `parity` profile, evaluated otherwise; a firing rests the run in `blocked-on-human` when a declaration of the proposer or a question of the harness was seen in the counted passes, and in `failed` otherwise (F103-FR-018).
- A pass fails with a quota class: no counter changes and the pass number is handed back (F103-FR-020).
- The ledger is invalid at resume: every loop layer is off for the phase attempt and the run goes on (F103-FR-039).
- A harness cannot continue a session: every pass is fresh and files carry the context (F103-FR-043).
- The empty prompt: refused with exit 1, after the check for phase evidence (F103-FR-006).
- A layer throws at a call point: the layer is off for the phase attempt and the classic loop carries on (F103-FR-027).
- A block is over the budget and protected: it is kept and said so; over the budget and not protected: dropped and said so (F103-FR-033).

## Requirements *(mandatory)*

### Functional Requirements

Requirements are grouped as the brief groups them: G1 the classic pass loop, G2 the loop-layer call points and the layer `none`, G3 the assembler and its blocks, G4 carry-over and the session directive. Every requirement is in the written form of `STAGE-B-RULES.md` section 4. A line printed by the baseline is printed in compatibility output only; where the baseline's text names an implementation file, the prefix is the logical component name of feature 100, annex X §X.8 (`pass-loop`, `engine`), by rule N-15.

#### G1 — The classic pass loop

- **F103-FR-001**: The engine MUST call the pass loop once per phase attempt with one request record and MUST receive one result record. The request MUST carry: the working directory; the path of the phase evidence; the standing prompt; the harness; the role (`proposer` or `accelerator`); the pass limit; the pause between passes; the feature slug; the phase number; the number of the phase attempt; the base of the invocation ids; the time limit of a pass; the place for yield artifacts (`feature:<slug>:outbox`); the debug switch. When a field is absent the as-is value MUST hold: feature slug `default`, phase 0, phase attempt 1. The result MUST carry `exit_code`, and `exit_code` MUST be a value of the table "Pass loop" of annex E §E.4 and no other. The pass loop MUST NOT be a public command.
  - origin: B-0462; B-0314; B-0477; B-0479; B-0480; B-0501; B-0503; B-0504
  - disposition: translated (B-0462, B-0477, B-0479, B-0480, B-0501, B-0503, B-0504); ported (B-0314)
  - test: PT-103-C-050-*; PT-103-C-051-*; PT-103-C-052-*; PT-103-C-013-*
  - divergence: DV-066; DV-027

- **F103-FR-002**: A request MUST end with `exit_code` 1 and the as-is message when the working directory is empty or is not a directory (`--workdir DIR required (got '<value>')`), when the evidence path is empty (`--evidence FILE required`), when the prompt is missing or is not a regular file (`--prompt-file FILE required (got '<value>')`), and when the loop cannot enter the working directory. The working directory MUST be used in its canonical form. A relative evidence path MUST be resolved against the working directory. The parent directory of the evidence path and the state directory of the feature MUST be created when they are missing. A field that is present without a value MUST end the request with a parameter error and never with the usage text. A field the pass loop does not know MUST end the request with `unknown arg: <name>` and the usage text, `exit_code` 1. The usage text MUST list the codes 0, 1, 4, 6, 7, 8, 9 and 10 and, as at the baseline, MUST NOT list 3. A request with `help` set MUST return `exit_code` 0 and the usage text.
  - origin: B-0463; B-0464; B-0465; B-0485; B-0564; B-0565; B-0566; B-0567; B-0617; B-0639; B-0670; B-0671
  - disposition: translated (B-0463, B-0464, B-0465, B-0485, B-0564, B-0565, B-0566, B-0567, B-0617); ported (B-0639, B-0670, B-0671)
  - test: PT-103-C-051-*; PT-103-C-054-*; PT-103-C-056-*; PT-103-C-057-*; PT-103-C-058-*
  - divergence: DV-066; DV-006

- **F103-FR-003**: Passes inside one phase attempt MUST be numbered from 1 up to the pass limit (the as-is `MAX_ITER`). The default limit MUST be 30. It MUST come from the request, which takes it from the key `loop.maxIter` (alias `SPECSTRIDE_MAX_ITER`; the flag `--max-iter` overrides). The pass loop MUST make no check of its own on the value. Under the `parity` profile every pass MUST be a fresh session. The pass loop MUST pause between passes for the pause of the request, by default 2 seconds with no variable for it, and MUST NOT pause after the last pass. A non-zero exit of the harness in one pass MUST NOT end the loop; only the rules of this group end it.
  - origin: B-0016; B-0040; B-0468; B-0487; B-0469; B-0761; B-0792; B-0668
  - disposition: ported (B-0016, B-0761, B-0792, B-0668); translated (B-0040, B-0468, B-0487, B-0469)
  - test: PT-103-C-006-*; PT-103-C-007-*; PT-103-C-051-*; PT-103-C-052-*; PT-103-C-058-*
  - divergence: DV-010; DV-014; DV-027
  - parity: `carry.continuation` off, so every pass is fresh (row 10 of annex X §X.7)

- **F103-FR-004**: Before every phase attempt of the proposer the engine MUST print `----- proposer: phase <N> attempt <M>/<MAX_REJECTS> (<harness>) -----` and emit an event that the compatibility projection renders as `proposer_start` with the fields `phase`, `attempt` and `backend`. Before every pass the pass loop MUST emit an event that the projection renders as `iter_start` with the fields `iter` and `max_iter`, and MUST print `----- proposer pass <i>/<max>  <ISO time> -----` on standard error. After a pass that ended with no phase evidence and no other end, the pass loop MUST emit an event that the projection renders as `iter_done` with `iter` and `evidence=missing`. The variants of `iter_done` for a yield and for a plugin restart are the content of the features that own them. No new line MUST be printed under the `parity` profile.
  - origin: B-0095; B-0212; B-0550; B-0652
  - disposition: translated (B-0095, B-0550); ported (B-0212, B-0652)
  - test: PT-103-C-008-*; PT-103-C-012-*; PT-103-C-053-*; PT-103-C-057-*
  - divergence: DV-007; DV-066
  - parity: compatibility output, no line without an as-is equivalent (rows 18 and 19 of annex X §X.7)

- **F103-FR-005**: Phase evidence MUST win outright. After each pass, whatever the pass ended with (an error, a kill, or a yield artifact written in the same pass), the pass loop MUST end with `exit_code` 0 when the phase evidence exists. It MUST emit an event that the projection renders as `evidence_written` with `file` (the base name) and `iters` (the pass number), and MUST print `proposer.sh: evidence appeared after pass <i> (<path>).` with the logical prefix. The engine MUST examine a result of the pass loop other than 6 only when the phase evidence is absent. From the moment phase evidence exists no limit and no breaker of the pass loop MUST stop the run.
  - origin: B-0557; B-0592; B-0659; B-0778; B-0318
  - disposition: translated (B-0557, B-0592, B-0659); ported (B-0778, B-0318)
  - test: PT-103-C-013-*; PT-103-C-053-*; PT-103-C-054-*; PT-103-C-057-*; PT-103-C-058-*
  - divergence: DV-007; DV-046; DV-066

- **F103-FR-006**: Before any prompt is read and before any pass starts, the pass loop MUST end with `exit_code` 0 when the phase evidence already exists (the case of a resume that goes straight to the critic). It MUST emit an event that the projection renders as `evidence_present` with `file` (the base name) and `iters` set to 0, and MUST print `proposer.sh: evidence already exists (<path>); nothing to do.` on standard error with the logical prefix. After that check a prompt that holds only white space MUST be refused with `exit_code` 1 and the line `proposer.sh: prompt is empty`.
  - origin: B-0549; B-0577; B-0649; B-0578
  - disposition: translated
  - test: PT-103-C-053-*; PT-103-C-054-*; PT-103-C-057-*
  - divergence: DV-007; DV-066; DV-087

- **F103-FR-007**: The standing prompt of a phase attempt MUST be read once, when the attempt starts. A change of a file it was built from during the attempt MUST NOT reach a later pass of the attempt. The proposer sends the standing prompt as given; the pass loop MUST add only the per-pass blocks of F103-FR-031. The prompt handed to a pass MUST be stored under the logical name `pass:<passId>:prompt`. The prompt of the proposer, or of the accelerator, of a phase attempt MUST be overwritten by the prompt of the next phase attempt of the same phase, so that the old side of the layout table can map the as-is files `proposer-prompt.phase<N>.txt` and `accelerator-prompt.phase<N>.txt` to it.
  - origin: B-0756; B-0178
  - disposition: ported (B-0756); translated (B-0178)
  - test: PT-103-C-058-*; PT-103-C-011-*
  - divergence: DV-006

- **F103-FR-008**: The pass loop MUST test whether the prompt is empty in time that grows linearly with the size of the prompt. The time from the decision to start a pass to the start of the harness process MUST NOT grow faster than the size of the prompt. What an observer sees MUST stay: an empty prompt is refused as F103-FR-006 says, so that no fixture differs. This fixes, and does not port, the expansion at `proposer.sh:1807`, which costs 2 s at 20 kB, 33 s at 80 kB and 548 s observed at 319 kB in a UTF-8 locale.
  - divergence: DV-087
  - test: CT-103-108
  - status: verified-on 2026-09-29 for the baseline figures (R28, measured on Linux with copies of the prompt; pin: `proposer.sh` at `9cab15d`). The figures of the port on Linux and every figure on macOS are `unverified` (check: the start-up measured with prompts from 20 kB to 320 kB on both systems; verified-on: —; pin: Node version of the run)

- **F103-FR-009**: The base of the invocation ids of a proposer request MUST be `<run-id>-<role>-phase-<N>-attempt-<M>`, with the run id in the as-is form of F100-FR-046. The id of the invocation of a pass MUST be `<base>-iter-<n>` when a base is given, and `inv-<pass number zero-padded to 6>-<8 hexadecimal characters>` otherwise. With the debug switch set, every invocation of the phase attempt, proposer and critic-class calls alike, MUST retain its raw prompt and reply under the logical names `pass:<passId>:prompt` and `pass:<passId>:response`; what retention holds and for how long is the content of the stream feature.
  - origin: B-0315; B-0743; B-0031
  - disposition: ported
  - test: PT-103-C-013-*; PT-103-C-058-*; PT-103-C-006-*
  - divergence: DV-006

- **F103-FR-010**: The pass loop MUST start every pass through the operation `startPass` of the harness port and MUST NOT test the name of a harness. After every pass, and before the kill check of F103-FR-022, it MUST call `betweenPasses` with the handle of the pass that ended, its result and the working directory. `continue` MUST go on. `stop` with the result 4 MUST end the loop with `exit_code` 4, and `stop` with the result 7 MUST end it with `exit_code` 7; neither counts against a breaker. A failure of `betweenPasses`, and a value outside the closed set, MUST be read as `continue`. The way a harness makes use of `betweenPasses` (the dsh plugin protocol, for one) is the content of its harness adapter.
  - test: CT-103-110
  - ep: EP-02 `specstride.harness/1` (consumes)

- **F103-FR-011**: When the pass limit is reached with no phase evidence the pass loop MUST return `exit_code` 4 and MUST print `proposer.sh: max-iter (<n>) reached without <evidence path>` with the logical prefix, and MUST write NO stop line of its own (defect D-45, preserved). The engine MUST then write the stop line `run_stop` with the reason `proposer_max_iter` and the field `phase`, print `>>> proposer hit max-iter (<n>) without evidence for phase <N> — halting (exit 4).`, and exit 4.
  - origin: B-0597; B-0667; B-0216; B-0145
  - disposition: translated (B-0597, B-0667); ported (B-0216, B-0145)
  - test: PT-103-C-054-*; PT-103-C-057-*; PT-103-C-012-*; PT-103-C-010-*
  - divergence: DV-066

- **F103-FR-012**: After a pass with no phase evidence, on every path except the structured path of F103-FR-013, the pass loop MUST take the last `agent_result` record of the whole event file: `is_error` true, as a truth value or as the text `true`, MUST count as an error; false, and no such record, MUST count as clean. A kill of class futility or hang MUST override the record: the pass counts as an error with the subtype `watchdog_<reason>`. An erroring pass MUST add one to the error counter and reset the cap counter; a clean pass MUST reset both. When an erroring pass was not killed, its reason MUST be `agent_error` and its kill class `agent`. For a harness that emits no `agent_result` record a crashed pass MUST read as clean, and such a harness MUST be able to trip the error breaker only through a futility or hang kill (defect D-48, preserved); a flag of the stream seam that the terminal record is missing MUST change no counter. An erroring pass MUST emit an event that the projection renders as `iter_error` with `iter`, `subtype`, `consec`, `reason` and `kill_class`.
  - origin: B-0786; B-0787; B-0789; B-0785; B-0614; B-0561
  - disposition: ported (B-0786, B-0787, B-0789, B-0785, B-0614); translated (B-0561)
  - test: PT-103-C-058-*; PT-103-C-055-*; PT-103-C-053-*
  - divergence: DV-007

- **F103-FR-013**: On the structured path (a harness whose stream is read by the structured reader, and a harness routed through the registry) the pass loop MUST take the result of the invocation of this pass, found by its identity and never by the newest file and never by the last record of a log. A result whose run id, feature, role, phase or phase attempt differs from the scope of the breaker MUST be refused with an error. A second finalisation of one invocation MUST NOT be counted twice. One invocation MUST be charged to exactly one counter: a kill of class budget to the cap counter, with the error count untouched; anything else to the error counter, which also clears the cap streak. The result of an invocation MUST be written once, under the logical name `pass:<passId>:result`. The finalisation MUST return one of the decisions `cap_halt` (result 10) and `halt` (result 7); any other value MUST continue the loop. The kill reason MUST be handed in by the pass loop, since a kill severs the stream.
  - origin: B-0445; B-0446; B-0447; B-0448; B-0449; B-0612
  - disposition: translated (B-0445); ported (B-0446, B-0447, B-0448, B-0449, B-0612)
  - test: PT-103-C-042-*; PT-103-C-043-*; PT-103-C-055-*
  - divergence: DV-006

- **F103-FR-014**: The error breaker MUST halt the loop when the error count is at least the limit; the limit MUST default to 2 and MUST come from the key `roles.proposer.maxErrors` (alias `SPECSTRIDE_PROPOSER_MAX_ERRORS`). The halt MUST return `exit_code` 7 on both paths. It MUST write the stop line `run_stop` with the reason `proposer_consecutive_errors` and the fields `iter`, `subtype`, `kill_reason` and `kill_class`, on the structured path as well. It MUST print `proposer.sh: pass <i> errored (subtype '<s>', is_error) — consecutive errors: <n>/<max>` for each erroring pass and `proposer.sh: <n> consecutive agent errors — aborting (exit 7). Raise --timeout or SPECSTRIDE_PROPOSER_MAX_ERRORS, or fix the phase harness ...`. The engine MUST then write `run_stop` with the reason `proposer_consecutive_errors` and the field `phase`, and print `>>> proposer aborted on consecutive agent errors for phase <N> — halting (exit 4).` followed by the guidance that names `pass-checkpoints` and the four remedies `SPECSTRIDE_PROPOSER_TIMEOUT`, `_MAX_ERRORS`, `_REPEAT_LIMIT` and `_PROGRESS_TIMEOUT`.
  - origin: B-0537; B-0594; B-0615; B-2785; B-0147; B-0218; B-0663; B-0664
  - disposition: translated (B-0537, B-0594, B-0663, B-0664); ported (B-0615, B-2785, B-0147, B-0218)
  - test: PT-103-C-052-*; PT-103-C-054-*; PT-103-C-055-*; PT-103-C-057-*; PT-103-C-010-*; PT-103-C-012-*
  - divergence: DV-005; DV-027; DV-066

- **F103-FR-015**: The kill reasons and their classes MUST be as at the baseline: `hard_cap` is class budget, `idle_timeout` is hang, `repeat_stall` and `progress_stall` are futility, and an unknown reason is futility. A kill of class budget MUST be counted by the cap counter and by no other (F103-FR-013). The cap breaker MUST halt the loop only when its limit is above 0 and the cap count has reached it. The halt MUST return `exit_code` 10. The kill itself, the kill note, the events and lines of a cap, and the limit's default belong to the feature that owns the watchdogs.
  - origin: B-0444; B-0450; 028 FR-018
  - disposition: ported
  - test: PT-103-C-041-*; PT-103-C-043-*; PT-103-028FR018-*
  - divergence: DV-005

- **F103-FR-016**: A pass MUST count as having made progress when any file under the progress roots has a modification time later than one second before the pass started, with the start stamp taken one second earlier because the comparison is strictly greater. The measurement MUST ignore everything under the project's repository directory, the workspace part (which holds the state, the notebook and the outbox), `node_modules` and `.venv`; the control plane lies outside the working tree and is not measured. A write by the proposer to its notebook, to the state or to the outbox MUST NOT count; a file written by a background job under the working directory MUST count. The legacy name of the state directory is not carried. The measurement emits no event of its own beyond the one of F103-FR-017; the event `progress.swept` is the sweep of a stray notebook at the start of a phase (F100-FR-057, F100-FR-058) and is not emitted by the pass loop.
  - origin: B-0790; B-0699; B-0760; B-0762
  - disposition: ported (B-0790, B-0760, B-0762); translated (B-0699)
  - test: PT-103-C-058-*
  - divergence: DV-036

- **F103-FR-017**: The no-progress breaker MUST count consecutive passes that made no progress, MUST reset the count to 0 after any pass with progress, and MUST measure an erroring pass and a hard-capped pass as well. Its limit MUST default to 3, MUST come from the key `roles.proposer.maxNoProgress` (alias `SPECSTRIDE_PROPOSER_MAX_NOPROGRESS`), and 0 MUST disable it. Each pass without progress MUST emit an event that the projection renders as `iter_no_progress` with `iter` and `consec`, and MUST print `proposer.sh: pass <i> changed nothing outside .specstride — consecutive no-progress passes: <k>/<max>`. At the limit the loop MUST print `proposer.sh: <k> consecutive passes wrote nothing — the phase is blocked on something the agent cannot decide for itself (exit 8). ...`, write `run_stop` with the reason `proposer_no_progress` and the fields `iter` and `consec`, and return `exit_code` 8. The engine MUST then write `run_stop` with the field `phase` and print `>>> proposer made no progress for phase <N> — halting (exit 4).` followed by the guidance lines that point at `PROGRESS.md` and at `specstride resume -w <workdir>`.
  - origin: B-0539; B-0791; B-0562; B-0595; B-0665; B-0666; B-0616; B-0146; B-0217
  - disposition: translated (B-0539, B-0562, B-0595, B-0665, B-0666); ported (B-0791, B-0616, B-0146, B-0217)
  - test: PT-103-C-052-*; PT-103-C-053-*; PT-103-C-054-*; PT-103-C-055-*; PT-103-C-057-*; PT-103-C-058-*; PT-103-C-010-*; PT-103-C-012-*
  - divergence: DV-007; DV-027; DV-066

- **F103-FR-018**: The no-progress breaker was never evaluated on the structured path at the baseline (defect D-44). Under the `parity` profile it MUST stay so. Outside the profile it MUST be evaluated on every path. When it fires, the pass loop MUST mark its result 8 as `declared-block` only when a declaration of the proposer that it needs a human, or a question of the harness, was seen in the counted passes; then the engine MUST emit `blocked` with that reason and what it needs, end with the stop reason `proposer_no_progress` and exit 4, rest in the state `blocked-on-human` and not be relaunched (F100-FR-144; annex E §E.2, blocked reason `declared-block`). When no such declaration or question was seen in the counted passes, the run MUST NOT rest in `blocked-on-human`: the stop reason is `proposer_no_progress`, `retryable` is false, and the run rests in the state `failed`. On the path where the breaker fires at the baseline, the exit code, the stop reason and the lines stay as F103-FR-017 says.
  - origin: B-0784
  - disposition: ported
  - test: PT-103-C-058-*; CT-103-118
  - divergence: DV-067
  - parity: `loop.noProgressStructured` off (row 59 of annex X §X.7; see "Rows of the `parity` profile")
  - ep: EP-02 `specstride.harness/1` (consumes)

- **F103-FR-019**: The engine MUST map the result of the pass loop to its exit and to a stop reason by one table, and only when phase evidence is absent. The results 4, 7, 8, 9 and 10 MUST end the engine with exit 4 and the stop reasons `proposer_max_iter`, `proposer_consecutive_errors`, `proposer_no_progress`, `proposer_yield_budget` and `proposer_cap_exhausted`, in that order. The result 6 MUST end it with exit 6. Any other result without phase evidence, 0, 1 and 3 included, MUST end it with exit 1, the stop reason `proposer_no_evidence`, the field `rc` and the line `>>> proposer exited (<rc>) without writing evidence for phase <N> — internal error.`. The stop reasons of the results 9 and 10 are written by the engine with the fields the stop-reason enumeration gives; the passes and the waits behind them belong to the feature that owns watchdogs and yield. A result that carries the field `blocked` MUST be mapped by the table of blocked reasons of annex E §E.2 before the code table is consulted (`source-changed`: F103-FR-021; `declared-block`: F103-FR-018); the code table applies to a result without that field.
  - origin: 028 FR-018; B-0129; B-0130; B-0131; B-0134; B-0150; B-0221
  - disposition: ported
  - test: PT-103-028FR018-*; PT-103-C-009-*; PT-103-C-010-*; PT-103-C-012-*
  - divergence: DV-005

- **F103-FR-020**: A failure that the quota classifier (EP-12) gives a quota class MUST NOT be counted as a consecutive error, as a cap kill or as a pass without progress, and MUST NOT reset any of them. Only the classes `agent_failure` and `provider_other`, and `overload` after its cap, MUST add to the error counter. A pass that failed with a quota class MUST give its pass number back and MUST change no counter of the loop. The pause, the resume time and the wait belong to the quota feature; the classes `quota_credit`, `auth` and `budget_cap` lead to the state `blocked-on-human` through the table of annex E §E.2.
  - divergence: DV-005
  - parity: not observable, since the stub agents emit no quota signal (row 39 of annex X §X.7)
  - test: CT-103-120
  - ep: EP-12 `specstride.quota-classifier/1` (consumes)
  - status: unverified (check: the quota signal of every tested harness adapter is captured in a fixture of its own feature; verified-on: —; pin: harness versions of the captures)

- **F103-FR-021**: Before every pass starts, and before its prompt is built, the pass loop MUST compare the hash of the spec, of the plan and of the task list with the hash pinned in the run snapshot (`run:<runId>:snapshot`), through the hasher of annex X §X.5. For the task list the hash that ignores checkboxes MUST be the one compared. A difference MUST stop the run before the pass: no pass starts, the event `blocked` names the file, the reason is `source-changed`, the stop reason is `critic_config`, the engine exit is 3, the run rests in `blocked-on-human` and the lock is released. Phase evidence that was delivered MUST be kept. A tick of a checkbox MUST NOT stop the run. The pass loop MUST report the stop as the result 3 with the field `blocked` set to `source-changed` (annex E §E.4, table "Pass loop", row 3); the engine maps it by the table of blocked reasons (F103-FR-019). Under the `parity` profile the pass loop MUST make no check, and the plan MUST be checked when the critic starts, as at the baseline.
  - divergence: DV-082
  - parity: check at critic start only (row 15 of annex X §X.7)
  - test: CT-103-121
  - assumption: CQ-067, closed on 2026-09-30: annex E §E.4, table "Pass loop", row 3 carries this stop

#### G2 — Call points of the loop-layer interface and the layer `none`

- **F103-FR-022**: The engine MUST call a loop layer at the eight call points of annex D §D.1: `contributePrompt`, `afterPass`, `betweenPasses`, `nextPassBlock`, `onEvidence`, `contributeCriticInput`, `resume` and `report`. After every pass it MUST keep the fixed order: the kill check, the yield check, the layer, and then the classic accounting of F103-FR-012 to F103-FR-017 and F103-FR-011. The return of `afterPass` MUST be one of `accept`, `refuse` and `none`; a value outside the set MUST be read as `none` and MUST switch the layer off for the phase attempt. Before the first pass of a phase attempt the engine MUST consult the router at the decision point `loop`, record the decision, and take from it only a registered layer or off; the router MUST NOT be able to switch a layer on.
  - test: CT-103-122
  - ep: EP-04 `specstride.loop-layer/1` (implements)
  - ep: EP-06 `specstride.router-rules/1` (consumes)

- **F103-FR-023**: The classic loop MUST be the engine with the built-in layer `none`: the strategy `classic`, whose value in the key `loop.strategy` is the value under the `parity` profile. The layer `none` MUST return `none` at every call point. With the layer `none`, and with a layer that is on and never engages because no unit of work is declared, the output MUST be identical to the classic loop apart from the fields that the divergence register names (the layer fields of the run record and the `[LOOP]` line, the protocol block of F103-FR-038, and the ledger records of F103-FR-039). Until a layer is engaged no time limit of a pass and no command of the runtime MUST differ from the classic loop. In a run whose verification gate does not execute the layer MUST be off, announced with the reason `gate-not-executing`.
  - divergence: DV-012; DV-018; DV-020; DV-053
  - parity: `loop.strategy` is `classic` (row 1 of annex X §X.7)
  - test: CT-103-123
  - ep: EP-04 `specstride.loop-layer/1` (implements)

- **F103-FR-024**: Layers MUST stack in a fixed order to a depth of at most 2. At every call point the outer layer MUST be called first, and the inner layer only when the outer layer returns `none`. The view of the phase attempt that a layer reads MUST be read-only and MUST hold `workerId` and `groupId`; with parallel units off both are absent. Each layer MUST have a ledger namespace of its own in which it writes through the engine and reads the rest of the ledger read-only. A layer MUST hold no state outside its namespace.
  - divergence: DV-080
  - test: CT-103-124
  - ep: EP-04 `specstride.loop-layer/1` (implements)

- **F103-FR-025**: A layer MUST declare at registration the directives and the services it uses. The engine MUST refuse at registration a layer that declares a directive or a service the engine does not offer, with a message that names the layer and the directive or service. The directives the engine offers are the eleven of the closed set "Directives of a loop layer" below; the service it can offer is the tree store (F103-FR-029). The engine MUST read the capability `concurrentSessions` of the harness port and MUST refuse a request for a group of passes when the harness adapter does not declare it. A layer MUST be accepted only as data or as first-party code (F100-FR-014).
  - divergence: DV-080
  - test: CT-103-125
  - ep: EP-04 `specstride.loop-layer/1` (implements)
  - ep: EP-02 `specstride.harness/1` (consumes)

- **F103-FR-026**: The engine MUST execute and account for every directive of a layer. `requestPass` MUST run one pass with the prompt block, working directory, session directive, time limit and worker id it names. A pass that a layer requests, and a pass of a worker, MUST be outside the iteration loop and MUST change no counter of the outer loop. `giveIterationBack` MUST hand the pass number back, as a yield does. `exemptShortPass` MUST leave the short-pass counter as it was. `exemptRepeatCounter` MUST exempt the exact argument lists of the inner check set from the process-level repeat counter. `layerOffForAttempt` and `layerOffForRun` MUST switch the layer off for the scope they name. The directives `requestPassGroup` and `integrateGroup` are executed by the services of the feature that builds parallel units; with parallel units off, no directive of a group is ever issued. The directives `keep`, `repair` and `unresolved` are the outcomes a layer declares for a unit of work: the engine MUST record each, with the unit it names, in the layer's namespace of the ledger, MUST change no counter of the outer loop for them, and MUST take no other action; what follows from them is the content of the layer. The call points and the directives are here; the rules that use them are the content of the layer.
  - divergence: DV-013; DV-014; DV-015; DV-080
  - parity: not observable, since the layer is off (row 1 and row 20 of annex X §X.7)
  - test: CT-103-126
  - ep: EP-04 `specstride.loop-layer/1` (implements)

- **F103-FR-027**: A thrown error of a layer, an invalid ledger, a spent cap and a check that cannot start MUST each switch the layer off for the phase attempt, announced and recorded, and the classic loop MUST carry on. A failure of the application of a group MUST switch the layer off for the run. An unknown return value at a call point MUST be read as `none` and MUST switch the layer off for the phase attempt. None of these MUST produce a run state, an exit code or a stop reason (F100-FR-031).
  - test: CT-103-127
  - ep: EP-04 `specstride.loop-layer/1` (implements)

- **F103-FR-028**: Withheld from every layer by construction: every writer of the phase gate (approval, verdict, feedback, hint, recovery markers); every counter of the outer loop; a harness handle; the event writer and the ledger writer; the project's repository; any path of the workspace or of a worker tree as a writable handle. The build MUST prove by a static check that the module graph of a layer imports no writer of the phase gate, and MUST fail when a core file names the layer `micro` or the layer `parallel`.
  - test: CT-103-128
  - ep: EP-04 `specstride.loop-layer/1` (implements)

- **F103-FR-029**: The interface of EP-04 MUST reserve the tree-store service of annex D §D.2. This feature MUST build nothing of it. The engine MUST offer the service to a layer that declared it only when an implementation is registered, and MUST refuse the layer at registration otherwise. What is built for it (the subset that parallel units need) is the content of feature 142, behind this reserved interface; nothing is built for a loop that would search the tree.
  - divergence: DV-080
  - parity: off, since no operation is called (row 20 of annex X §X.7)
  - test: CT-103-129
  - ep: EP-04 `specstride.loop-layer/1` (implements)

#### G3 — The assembler of the proposer's prompt and its blocks

- **F103-FR-030**: There MUST be one assembler of the proposer's prompt. It MUST offer providers the one operation `blocks`, whose input is the context of the pass (phase, phase attempt, pass ordinal, strategy, what changed since the pass before) and whose output is a list of blocks, each with its id, bytes, hash, writer, `protected` or not, and `stable` or `volatile`. Block ids MUST be an open set. An unknown value of `protected` MUST be read as not protected and an unknown value of `stable` as volatile. A provider MUST be a pure function of the context of the pass and of the files it names, and MUST frame text from outside the runtime as data. A block over the size its provider declared MUST be cut and recorded. A provider that fails MUST leave its block out, and the omission MUST be recorded in `prompt.built`; a failure of the provider of a protected block MUST be an error of the pass, by the existing breakers. The shipped providers are: the spec context; the index of verification obligations; the handoff; feedback; hint; the acceleration note; the block of the yield artifact schema; the protocol block of a layer; the plugin protocol section of one harness. Under the block set `current` the feedback provider MUST take from the feedback file only the criterion ids and the text that follows each of them, cut to the size the provider declares, and MUST leave out the verdict line and everything else of the critic's reply (threat T-08); under the block set `as-is` the feedback is the baseline's full text (F103-FR-032). No block of the proposer's assembler MUST reach the critic.
  - test: CT-103-130; CT-103-145
  - ep: EP-15 `specstride.prompt-block/1` (implements)

- **F103-FR-031**: Under the block set `as-is`, which the `parity` profile selects, the prompt of a pass MUST hold five blocks in this fixed order: the standing prompt (with the plugin protocol section of the harness when it is enabled); the status block of the detached job; the block of the kill note of the pass that was killed before; the block that resumes after a yield; the block that nudges after short passes. The blocks MUST be joined by one blank line, and each MUST be present only when it is not empty. The pass loop MUST inject no feedback, hint, acceleration note or notebook itself: the standing prompt already holds them. The prompt MUST equal the baseline's byte for byte. The general part of the order and of the event `iter_done` of F103-FR-004 is specified here; the variants of the dsh harness are the content of the feature of its harness adapter.
  - origin: B-0755
  - disposition: ported
  - test: PT-103-C-058-*; CT-103-131
  - divergence: DV-094
  - parity: `prompt.block_set` is `as-is` (row 12 of annex X §X.7)
  - ep: EP-15 `specstride.prompt-block/1` (implements)

- **F103-FR-032**: The standing prompt of the proposer MUST hold, in this order: the statement that the proposer works on one phase and stops; the working directory, the notebook path and the rule that the working directory root stays clean; the phase title and the task; the instruction to write the phase evidence atomically, only when the phase is truly done, at the path relative to the working directory; the evidence block, which tells the proposer to cite workspace-relative file paths, to stage line-numbered proof slices, and how the grounding snapshot of the critic works (anchored excerpts of about 15 lines either side, a byte budget, no method names as files); the criteria heading that the spec format decides (`## OpenSpec tasks to complete …`, `## Tasks to complete …` or `## Acceptance criteria (the phase spec)`) with the full phase slice; the block of the document-set context and, unless verification is `off`, the verification slice of the phase (the proposer's prompt only, not the accelerator's); when feedback exists, `## A PRIOR ATTEMPT WAS REJECTED — this is attempt <M> of <MAX_REJECTS>` with the full feedback, one gist line per archived phase attempt, the hint when present and the acceleration note when present; and, last, the block of the yield artifact schema, which shows a `specstride-pass-yield/v1` example with `reason`, `job.mode` (`launch` or `adopt`), `resume_when.kind`, the required `deadline_sec` and `on_resume`, tells the proposer to write it atomically and to stop without phase evidence instead of waiting inside a pass, and does not advertise the predicate `command`. Under the block set `as-is` the text MUST be the baseline's. Under the block set `current` the notebook MUST no longer be the required first read.
  - origin: B-0295; B-0297; B-0298; B-0299; B-0300; B-0301
  - disposition: ported
  - test: PT-103-C-013-*
  - divergence: DV-094; DV-092
  - parity: `prompt.block_set` is `as-is` (row 12 of annex X §X.7)
  - ep: EP-15 `specstride.prompt-block/1` (implements)

- **F103-FR-033**: The block of the yield artifact schema MUST be added last and only if the size assembled so far plus the size of the block fits the budget of the prompt. The budget MUST come from the key `loop.promptMaxBytes` (alias `SPECSTRIDE_PROMPT_MAX_BYTES`; default 180000; 0 disables the budget). The set of protected blocks MUST come from the key `loop.promptProtectedBlocks` (alias `SPECSTRIDE_PROMPT_PROTECTED_BLOCKS`; default `yield_contract`; set but empty protects nothing). A protected block that is over the budget MUST be kept and the fact MUST be said out loud: the line `>>> prompt block '<name>' kept over budget (protected): <have>B already assembled + <need>B exceeds SPECSTRIDE_PROMPT_MAX_BYTES=<n>` and an event rendered as `prompt_block_protected`. A block that is not protected and is over the budget MUST be dropped: the line `>>> prompt block '<name>' dropped: <have>B already assembled + <need>B exceeds SPECSTRIDE_PROMPT_MAX_BYTES=<n>` and an event rendered as `prompt_block_dropped`. Both events MUST carry `block`, `assembled_bytes`, `block_bytes` and `budget_bytes`. The rest of the prompt MUST never be truncated by the assembler. Under the block set `current` the assembler MUST budget the whole prompt by the same rules: it MUST admit blocks with stable blocks first and volatile blocks after them, MUST drop a block that would take the assembled size over the budget unless the block is protected, MUST keep the fixed instructions and the task of the phase as protected blocks, and MUST never drop a protected block.
  - origin: B-0075; B-0076; B-0296; B-0091; B-0092; B-0207
  - disposition: translated (B-0075, B-0076, B-0091, B-0092); ported (B-0296, B-0207)
  - test: PT-103-C-007-*; PT-103-C-008-*; PT-103-C-012-*; PT-103-C-013-*
  - divergence: DV-007; DV-020; DV-027
  - parity: `prompt.block_set` is `as-is` (row 12 of annex X §X.7)
  - ep: EP-15 `specstride.prompt-block/1` (implements)

- **F103-FR-034**: Every pass MUST emit `prompt.built` with the blocks of the prompt (id, bytes, hash, writer, `protected`, `stable`), with every block that was dropped or left out and why, and with the hash of the stable start of the prompt. No block MUST be dropped or left out without an entry in `prompt.built`. The events rendered as `prompt_block_protected` and `prompt_block_dropped` MUST be derived from the same record.
  - divergence: DV-007
  - test: CT-103-134
  - ep: EP-15 `specstride.prompt-block/1` (implements)

- **F103-FR-035**: Lisa's budgeting of the proposer's context MUST be the first implementation behind the provider operation, under the block set `current`. It MUST treat the sources fixed instructions, phase, feedback, progress, optional context and rejection history. The fixed instructions and the phase MUST never be truncated; when they alone exceed the input budget (the context window less the reserve for tools and output) the assembler MUST refuse the pass with an error that names the required size, the input budget and the model. The other sources MUST be admitted in the fixed order feedback, progress, optional context, history, each up to its own cap, and each contribution MUST be recorded with its original and included sizes, its hash, and whether it was cut or dropped. Progress from the notebook MUST be compacted deterministically to its cap and MUST keep the newest notes. The starting values are those of the extracted code: a context window of 160,000 characters, a reserve of 32,000, and caps of 12,000 for progress, 24,000 for optional context, 16,000 for feedback and 8,000 for history. The context window MUST come from the capability of the harness, the smaller of the declared and the effective value (F100-FR-077). The harness gives the window in tokens (annex C §C.2, record `models`) and the caps are in characters: the assembler MUST convert the window to characters by the ratio the plan fixes, MUST record the window, the ratio and the character budget in `prompt.built`, and, where the harness gives no window, MUST use the starting value of 160,000 characters and record in `prompt.built` that the window is unknown. The budget of F103-FR-033 and these caps MUST both hold; the smaller governs. Under the block set `as-is` none of this applies.
  - test: CT-103-135
  - parity: `prompt.block_set` is `as-is`, and this policy is not used (row 12 of annex X §X.7)
  - ep: EP-15 `specstride.prompt-block/1` (implements)

- **F103-FR-036**: Under the block set `current` the assembler MUST place stable blocks first and volatile blocks last, and the start of the prompt up to the first volatile block MUST be byte-identical in every pass of one phase attempt. No value that changes from pass to pass (a time, a pass ordinal, an identifier of a pass) MUST stand before that start. The hash of the stable start MUST be recorded in `prompt.built`, and a test MUST compare it across the passes of a phase attempt. Under the block set `as-is` the order and the text MUST be the baseline's.
  - divergence: DV-094
  - parity: `prompt.block_set` is `as-is` (row 12 of annex X §X.7)
  - test: CT-103-136
  - ep: EP-15 `specstride.prompt-block/1` (implements)
  - status: unverified (check: experiment X4 compares first-turn cache reads of passes with and without the stable start on a tested harness adapter; verified-on: —; pin: version of the harness of the run)

- **F103-FR-037**: With the switch `carry.index` on, the block of inherited verification obligations in the proposer's prompt MUST be replaced by an index that holds, for each verification obligation, its id, its title cut to a fixed length (`carry.indexTitleChars`, the same in every pass of a run) and the path of its full text. The index MUST be a pure function of the verification plan: a test MUST regenerate it from the plan and compare it with the stored one. It MUST appear in the proposer's prompt only; the critic's copy of the block MUST be unchanged. With the switch off, the block MUST be the baseline's, one line per obligation, so that the prompt is compared in full.
  - divergence: DV-045
  - parity: `carry.index` off (row 9 of annex X §X.7)
  - test: CT-103-137
  - ep: EP-15 `specstride.prompt-block/1` (consumes)
  - assumption: CQ-069 (where the path of the full text of a verification obligation points)

- **F103-FR-038**: The protocol block of a loop layer MUST be added by the provider of that layer at pass level and MUST be protected. For the layer `micro` it is the checkpoint block; for the layer `parallel` it is the block of reserved tasks and the block of a worker. The block MUST be a named layer field in the sense of the divergence register: it, and the values derived from the prompt (its size and its hash), differ from the classic loop, and the rest of the prompt MUST be compared in full. With no unit of work declared the layer MUST add nothing but this block.
  - divergence: DV-020
  - parity: not observable, since the layer is off (row 1 of annex X §X.7)
  - test: CT-103-138
  - ep: EP-15 `specstride.prompt-block/1` (implements)

#### G4 — Carry-over and the session directive

- **F103-FR-039**: A run MUST have one ledger, in the control plane (`run:<runId>:ledger`): append-only, each record chained to the one before, and signed with a key that is not the approval key (`run:<runId>:ledger-key`). The namespace `core` MUST hold the record kinds of the closed set "Kinds of record of the namespace `core`" below; each record MUST carry the counters as they stand after it. The engine MUST write a record when a phase attempt opens and when it closes, and MUST write a record after every pass when `carry.ledger_handoff` is on. With every layer off the ledger MUST hold at least one record per phase attempt. The ledger MUST be validated on resume: a record that was edited, truncated or reordered MUST be detected, and the effect MUST be that every loop layer is off for the phase attempt, with an event, and never a stop. The ledger MUST be refused by grounding.
  - divergence: DV-092; DV-011
  - parity: `carry.ledger_handoff` off, where records after every pass and the handoff are not written; the records at the boundaries of a phase attempt are still written (row 8 of annex X §X.7)
  - test: CT-103-139
  - assumption: CQ-066 (whether the switch `carry.ledger_handoff` off stops the whole ledger or only the carry-over parts)

- **F103-FR-040**: The pass index, the yield index and the consecutive breakers MUST live in the counters of the ledger and MUST continue across a resume and a relaunch. The per-run file that holds the breaker state of the structured path at the baseline (`.breaker-state.<run-id>.json`), which the baseline deletes at every start so that no counter carries over between invocations, MUST NOT be written. `--reset-counts` MUST set them all to zero and MUST be recorded as a record of kind `counts-reset`. Under the `parity` profile the resume fixtures pass the flag, so that the pass loop starts every engine start with all counters at zero, as at the baseline.
  - origin: B-0637
  - disposition: translated
  - test: PT-103-C-056-*; CT-103-140
  - divergence: DV-011; DV-006
  - parity: resume fixtures pass `--reset-counts` (row 13 of annex X §X.7)

- **F103-FR-041**: With `carry.ledger_handoff` on, the engine MUST write the handoff (`feature:<slug>:handoff`) at the start of every pass. It MUST regenerate the file every time and never append to it. It MUST be at most 6 KB (`carry.handoffMaxBytes`). The runtime MUST never read it back. It MUST hold: the phase; the number of the phase attempt; the counters; the last lines of the ledger; the remaining units of work, which are the plan less the ledger; the newest kill note; the `on_resume` text and the result of a detached job; the pointers to the feedback files; the fingerprint of the tree it was built against; and the line that the tree wins where the handoff and the tree disagree. No model MUST write any part of it. Every text in it that comes from the workspace MUST be data. After a kill the next handoff MUST name the unit of work that was in progress, where a layer declared one, and the runtime MUST NOT change the tree. Grounding MUST refuse the handoff. Under the block set `current` the proposer's prompt MUST name it, and the notebook MUST no longer be the required first read; under the block set `as-is` the prompt is the baseline's and names nothing (F103-FR-031).
  - divergence: DV-092
  - parity: `carry.ledger_handoff` off (row 8 of annex X §X.7)
  - test: CT-103-141

- **F103-FR-042**: Every pass MUST get a session directive from the core: `fresh` with a minted id, or `continue` with an id. It MUST be `fresh` for a new phase attempt, a critic-class call, a relaunch, a kill by a watchdog, the second repair of a unit of work, an escalation and a change of configuration. Otherwise a session MAY be continued, where the capability `continuation` of the harness is set, when the switch `carry.continuation` is on and none of the eleven drop rules of the closed set "Reasons for a fresh session" below holds. The rules are: a new phase attempt; a kill by a watchdog; a repeated failure (two consecutive passes without phase evidence and without a kept unit); the context fill (the last observed context exceeds the smaller of `carry.contextFillTokens` and the share `carry.contextFillShare`, in per cent, of the known window; a harness that reports no usage falls back to at most 2 continued passes); the age (the time since the last request exceeds `continuation.cacheTtlSec` of the harness descriptor, annex C §C.2, and `carry.ageFallbackSec` where the descriptor declares none); a change of configuration; a relaunch; a session that is unavailable, announced by an event; the cap of `carry.maxContinuedPasses` continued passes in a phase attempt (default 3); the profile `parity`; and the first pass of the main line after a parallel group was applied. A `fresh` that a layer names in `requestPass` (the second repair of a unit of work, an escalation) MUST be recorded with the reason `layer-requested`. The directive and its reason MUST be recorded per pass. Under the `parity` profile no invocation MUST carry a continuation argument.
  - divergence: DV-010
  - parity: `carry.continuation` off (row 10 of annex X §X.7)
  - test: CT-103-142
  - ep: EP-02 `specstride.harness/1` (consumes)
  - status: unverified (check: for each tested harness adapter that declares continuation, a paired run shows that a continued pass finds its session and that the age rule uses the harness's own cache lifetime; verified-on: —; pin: harness versions of the run)
  - assumption: CQ-068, closed on 2026-09-30: the field `continuation.cacheTtlSec` of annex C §C.2

- **F103-FR-043**: For a harness whose capability `continuation` is absent, null or false, the session directive MUST always be `fresh`, and files MUST carry the context: the handoff, the ledger and the feedback files. The pass loop MUST name no harness to decide this.
  - parity: `carry.continuation` off (row 10 of annex X §X.7)
  - test: CT-103-143
  - ep: EP-02 `specstride.harness/1` (consumes)

- **F103-FR-044**: The pass loop MUST emit the events `task.planned` and `task.ticked` of the catalogue of feature 111. At the open of a phase attempt it MUST emit `task.planned` once per task of the phase slice, with the field `taskId` and `estimateMs` where the format of the task list gives an estimate. After a pass, for every task whose checkbox changed from unticked to ticked during that pass, it MUST emit `task.ticked` with the field `taskId` and `elapsedMs` measured from the open of the phase attempt, where the time is known. The loop MUST tick no checkbox and MUST edit the task list in no way; it reads the change by comparing the task list, read through the spec-format adapter port, before and after the pass. Both events MUST be emitted in every profile: they project to nothing at the baseline, so no compared surface changes under `parity`, and selecting the profile changes nothing else (F100-FR-210).
  - test: CT-103-144
  - parity: not observable; emitted in every profile and projected to nothing (no switch, so no row of annex X §X.7)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F103-SC-001**: Smaller cold start. The first-turn tokens per pass are at least 40 per cent lower at the median than the baseline of 107.8k, with the index of verification obligations on, and no phase goes over the prompt budget (experiment X3, run by the experiment plan of the micro-loop feature on the switches of this feature).
- **F103-SC-002**: Work survives a killed pass. After a kill by a watchdog, in 100 per cent of the fixtures with a unit of work in progress the next handoff names that unit, and the tree that the next pass finds is byte-identical to the tree the kill left.
- **F103-SC-003**: No prompt block is dropped silently. In 100 per cent of the passes of the fixtures, every block that is dropped or left out has an entry in `prompt.built`.
- **F103-SC-004**: A pass starts at once. With a prompt of 320 kB the start-up of a pass takes under 1 s of processor time on the reference machine (the Linux runner of the build workflow, named in the plan), against the baseline's 548 s measured again on the same machine, and the time measured from 20 kB to 320 kB grows no faster than the size of the prompt. The figure has low confidence.
- **F103-SC-005**: A changed source costs at most one pass. After an edit of the spec, of the plan or of the text of the task list, 0 further passes start and 0 critic calls are made on the old plan; after a tick of a checkbox the number of stops is 0.
- **F103-SC-006**: The classic loop is the baseline. Under the `parity` profile the results of the fixture families FX-17, FX-18, FX-19, FX-20 and FX-24, and of the golden prompts, are `equal` on 100 per cent of the compared surfaces, or `waived` with a register row.
- **F103-SC-007**: A layer that does not engage is inert. With the layer `micro` on and stub agents that never declare a unit of work, 0 differences appear on any fixture outside the layer fields, and the counters are equal on 100 per cent of the fixtures.
- **F103-SC-008**: Quota classes are not counted. In 100 per cent of the passes that fail with a quota class the error counter, the cap counter and the no-progress counter are unchanged.
- **F103-SC-009**: Carry-over can be checked. The index regenerated from the verification plan equals the stored index in 100 per cent of the test cases, and in 100 per cent of the cases of an invalid ledger the loop layers are off for the phase attempt and no run stops.

## Constraints

Set by the owner. They are not implementation detail to be removed.

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated. Every statement about macOS is `unverified` | Decision 12; ruling 67 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime harness adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |
| Every parity test passes before any release | Ruling 32 |

| Feature-specific constraint | Source |
|---|---|
| A new phase attempt and every critic-class call start a fresh session | Decision 22 |
| The core imports no harness adapter, sink or config loader | `architecture.md` section 6 |

What belongs in the plan and not here: libraries and their versions, the layout of packages and files, the physical paths behind the logical names, the test runner, bundling, and the spelling of internal functions.

## Extension points

Feature 103 is the content owner of the core side of EP-04 (the call points and the layer `none`) and of EP-15 (the proposer's assembler and the shipped blocks). It consumes EP-02, EP-06 and EP-12.

| EP | Id and version | Relation | What for |
|---|---|---|---|
| EP-04 | `specstride.loop-layer/1` | implements | The eight call points, their fixed order, the built-in layer `none`, stacking, negotiation, the execution of directives (F103-FR-022 to F103-FR-029) |
| EP-15 | `specstride.prompt-block/1` | implements | The proposer's assembler and its shipped providers (F103-FR-030 to F103-FR-038); consumes for the index of verification obligations (F103-FR-037) |
| EP-02 | `specstride.harness/1` | consumes | `startPass`, `betweenPasses`, and the capabilities `continuation`, `concurrentSessions` and the context window (F103-FR-010, F103-FR-025, F103-FR-035, F103-FR-042, F103-FR-043) |
| EP-06 | `specstride.router-rules/1` | consumes | The decision point `loop`, call site only (F103-FR-022) |
| EP-12 | `specstride.quota-classifier/1` | consumes | The class of a failed pass (F103-FR-020) |

## Contracts of feature 100 used

| Interface contract | Version | Where |
|---|---|---|
| Loop-layer interface: call points, directives, stacking, negotiation | `specstride.loop-layer/1` | Annex D §D.1, F100-FR-114 to F100-FR-120 |
| Tree-store service (reserved) | `specstride.tree-store/1` | Annex D §D.2, F100-FR-121 to F100-FR-125 |
| Prompt block provider | `specstride.prompt-block/1` | Annex D §D.5, F100-FR-131, F100-FR-132 |
| Yield artifact schema (the yield check) | `specstride-pass-yield/v1` | Annex D §D.6 |
| Harness port, level `proposer`; forms of session; capabilities | `specstride.harness/1` | Annex C §C.1, F100-FR-076, F100-FR-077, F100-FR-083 |
| Quota classifier | `specstride.quota-classifier/1` | Annex C §C.13, F100-FR-109 |
| Ledger | `specstride.ledger/1` | Annex B §B.13, F100-FR-068, F100-FR-069 |
| Run snapshot, with the source hashes | `specstride.snapshot/1` | Annex B §B.12, F100-FR-066, F100-FR-067 |
| Logical names, one writer per state file | `specstride.layout/1` | Annex B §B.5, F100-FR-051, F100-FR-053 |
| Run-state machine, blocked reasons | `specstride.run-state/1` | Annex E §E.2, F100-FR-141, F100-FR-144, F100-FR-145 |
| Stop reasons; exit codes and result records of the engine and of the pass loop | `specstride.stop-reason/1` | Annex E §E.3, §E.4, F100-FR-148, F100-FR-151, F100-FR-153 |
| Event envelope | `specstride.event/1` | Annex X §X.1 |
| Canonical hasher | — | Annex X §X.5, F100-FR-207 |
| Closed sets 57 and 58 | — | Annex X §X.6, F100-FR-208 |
| The `parity` profile | `specstride.profile/1` | Annex X §X.7, F100-FR-210 to F100-FR-212 |
| Normalization rules N-05, N-15, N-24 and the tables of §X.8 | `specstride.oracle-normalization/1` | Annex X §X.8, F100-FR-213, F100-FR-214 |

Feature 141 supplies the fixture families FX-17 to FX-20, FX-24 (with FX-03, FX-08, FX-13, FX-21 and FX-22 for single items), the stub verbs of its §O.3 and the surfaces of its §O.4. This feature adds no fixture family, no stub verb and no surface.

## Rows of the `parity` profile

This feature reads the rows 1, 8, 9, 10, 12, 13, 15 and 18 and 19 of annex X §X.7. It introduces one switch and one group of parameters, with their final rows.

| # | Switch | Key | Default | Under `parity` | Owner | Register row |
|---|---|---|---|---|---|---|
| 59 | The no-progress breaker on the structured path | `loop.noProgressStructured` | on | off | 103 | DV-067 |
| 60 | The parameters of carry-over: the size of the handoff, the length of an index title, the cap of continued passes, the context-fill limit and share, the cache lifetime that applies when the harness descriptor declares none | `carry.handoffMaxBytes`, `carry.indexTitleChars`, `carry.maxContinuedPasses`, `carry.contextFillTokens`, `carry.contextFillShare`, `carry.ageFallbackSec` | 6144; 80 (set by the plan, low confidence); 3; 150000; 50 (per cent); 300 | not used, since rows 8, 9 and 10 are off | 103 | DV-092; DV-045; DV-010 |

The parameters of an as-is setting (`loop.maxIter`, `loop.promptMaxBytes`, `loop.promptProtectedBlocks`, `roles.proposer.maxErrors`, `roles.proposer.maxNoProgress`) are not new switches. Their value under `parity` is the as-is value, and the alias table of annex X §X.8 maps the as-is variables.

## Configuration keys

Feature 110 owns the spelling of every key. Where annex X §X.7 or §X.8 has a spelling, it is used; otherwise the spelling is a proposal.

| Key | Source of the spelling | As-is variable | Default | Requirement |
|---|---|---|---|---|
| `loop.maxIter` | Annex X §X.8, alias table | `SPECSTRIDE_MAX_ITER` | 30 | F103-FR-003 |
| `loop.promptMaxBytes` | Annex X §X.8, alias table | `SPECSTRIDE_PROMPT_MAX_BYTES` | 180000 | F103-FR-033 |
| `loop.promptProtectedBlocks` | Proposal | `SPECSTRIDE_PROMPT_PROTECTED_BLOCKS` | `yield_contract` | F103-FR-033 |
| `loop.passPauseSec` | Proposal | none | 2 | F103-FR-003 |
| `roles.proposer.maxErrors` | Proposal under the pattern of annex X §X.8 ("the keys of the same meaning under `roles.proposer`") | `SPECSTRIDE_PROPOSER_MAX_ERRORS` | 2 | F103-FR-014 |
| `roles.proposer.maxNoProgress` | Proposal, as above | `SPECSTRIDE_PROPOSER_MAX_NOPROGRESS` | 3 (0 disables) | F103-FR-017 |
| `loop.strategy` | Annex X §X.7 row 1 | none | `micro` | F103-FR-023 |
| `carry.ledger_handoff` | Annex X §X.7 row 8 | none | on | F103-FR-039, F103-FR-041 |
| `carry.index` | Annex X §X.7 row 9 | none | on | F103-FR-037 |
| `carry.continuation` | Annex X §X.7 row 10 | none | on, where the harness supports it | F103-FR-042, F103-FR-043 |
| `prompt.block_set` | Annex X §X.7 row 12 | none | `current` | F103-FR-031 to F103-FR-036 |
| `staleness.check_points` | Annex X §X.7 row 15 | none | launch, resume and every pass start | F103-FR-021 |
| `loop.noProgressStructured` | Annex X §X.7 row 59 | none | on | F103-FR-018 |
| `carry.handoffMaxBytes`, `carry.indexTitleChars`, `carry.maxContinuedPasses`, `carry.contextFillTokens`, `carry.contextFillShare`, `carry.ageFallbackSec` | Annex X §X.7 row 60 | none | as the row says | F103-FR-037, F103-FR-041, F103-FR-042 |

## Threats

Threats of annex X §X.9 that this feature owns a control for (F100-FR-216).

| Threat | What it is | Control of this feature |
|---|---|---|
| T-08 | An injected critic reply reaches the next phase attempt through feedback | F103-FR-030: the assembler frames text from outside the runtime as data; the feedback provider takes only criterion ids and the text after them, with a cap, and removes the verdict line |
| T-31 | The event file is edited or cut | F103-FR-039: the ledger is append-only, chained and signed, and is validated on resume; an edited, truncated or reordered record switches every loop layer off for the phase attempt |

## Closed sets

Stated as F100-FR-208 asks. Owner of each: 103.

| Closed set | Members | Closed by | Unknown value |
|---|---|---|---|
| Directives of a loop layer (row 57 of annex X §X.6) | `keep`, `repair`, `unresolved`, `layerOffForAttempt`, `layerOffForRun`, `giveIterationBack`, `exemptShortPass`, `exemptRepeatCounter`, `requestPass`, `requestPassGroup`, `integrateGroup` | Design | The layer is refused at registration |
| Returns of `afterPass` (row 58) | `accept`, `refuse`, `none` | Design | Read as `none`; the layer is off for the phase attempt |
| Kinds of record of the namespace `core` | `attempt-open`, `attempt-closed`, `pass-closed`, `counts-reset` | Design | A reader keeps the record in the check of the chain and ignores its content |
| Reasons for a fresh session | `new-attempt`, `watchdog-kill`, `repeated-failure`, `context-fill`, `age`, `configuration-change`, `relaunch`, `session-unavailable`, `continuation-cap`, `profile-parity`, `group-applied`; `no-continuation` for a harness that cannot continue; and `layer-requested` for a `fresh` that a layer named in `requestPass` | Design | Read as `new-attempt` |
| Block sets of the proposer's prompt | `current`, `as-is` | Design | Configuration error |
| Values of the session directive | `fresh`, `continue` | Design (annex C §C.1) | Read as `fresh` |

Open sets: block ids (open by the registry of providers).

## As-is behaviour not carried

The traceability files assign no row to feature 103 with the disposition `superseded-by` or `dropped`. Every row of the group `proposer.sh` and of the group `orchestrator.sh` that was assigned to it is `ported` or `translated`.

| As-is id | Behaviour (short) | Register row |
|---|---|---|
| (none assigned to this feature) | — | — |

The behaviour of the pass loop that the port does not keep as a process is kept as a call and a result record (F103-FR-001, F103-FR-002): the entry point `proposer.sh`, its flags and its usage text, under DV-066.

As-is ids carried, and where:

| As-is id | Disposition | Requirement | Test |
|---|---|---|---|
| 028 FR-018 | ported | F103-FR-015, F103-FR-019 | PT-103-028FR018-* |
| C-006: B-0016, B-0031 | ported | F103-FR-003, F103-FR-009 | PT-103-C-006-* |
| C-007: B-0040, B-0075, B-0076 | translated | F103-FR-003, F103-FR-033 | PT-103-C-007-* |
| C-008: B-0091, B-0092, B-0095 | translated | F103-FR-033, F103-FR-004 | PT-103-C-008-* |
| C-009: B-0129, B-0130, B-0131, B-0134 | ported | F103-FR-019 | PT-103-C-009-* |
| C-010: B-0145, B-0146, B-0147, B-0150 | ported | F103-FR-011, F103-FR-017, F103-FR-014, F103-FR-019 | PT-103-C-010-* |
| C-011: B-0178 | translated | F103-FR-007 | PT-103-C-011-* |
| C-012: B-0207, B-0212, B-0216, B-0217, B-0218, B-0221 | ported | F103-FR-033, F103-FR-004, F103-FR-011, F103-FR-017, F103-FR-014, F103-FR-019 | PT-103-C-012-* |
| C-013: B-0295, B-0296, B-0297, B-0298, B-0299, B-0300, B-0301, B-0314, B-0315, B-0318 | ported | F103-FR-032, F103-FR-033, F103-FR-001, F103-FR-009, F103-FR-005 | PT-103-C-013-* |
| C-041: B-0444 | ported | F103-FR-015 | PT-103-C-041-* |
| C-042: B-0445 | translated | F103-FR-013 | PT-103-C-042-* |
| C-043: B-0446, B-0447, B-0448, B-0449, B-0450 | ported | F103-FR-013, F103-FR-015 | PT-103-C-043-* |
| C-050: B-0462 | translated | F103-FR-001 | PT-103-C-050-* |
| C-051: B-0463, B-0464, B-0465, B-0468, B-0469, B-0477, B-0479, B-0480, B-0485 | translated | F103-FR-002, F103-FR-003, F103-FR-001 | PT-103-C-051-* |
| C-052: B-0487, B-0501, B-0503, B-0504, B-0537, B-0539 | translated | F103-FR-003, F103-FR-001, F103-FR-014, F103-FR-017 | PT-103-C-052-* |
| C-053: B-0549, B-0550, B-0557, B-0561, B-0562 | translated | F103-FR-006, F103-FR-004, F103-FR-005, F103-FR-012, F103-FR-017 | PT-103-C-053-* |
| C-054: B-0564, B-0565, B-0566, B-0567, B-0577, B-0578, B-0592, B-0594, B-0595, B-0597 | translated | F103-FR-002, F103-FR-006, F103-FR-005, F103-FR-014, F103-FR-017, F103-FR-011 | PT-103-C-054-* |
| C-055: B-0612, B-0614, B-0615, B-0616, B-2785 | ported | F103-FR-013, F103-FR-012, F103-FR-014, F103-FR-017 | PT-103-C-055-* |
| C-056: B-0617, B-0637 | translated | F103-FR-002, F103-FR-040 | PT-103-C-056-* |
| C-057: B-0639, B-0649, B-0652, B-0659, B-0663, B-0664, B-0665, B-0666, B-0667 | ported and translated | F103-FR-002, F103-FR-006, F103-FR-004, F103-FR-005, F103-FR-014, F103-FR-017, F103-FR-011 | PT-103-C-057-* |
| C-058: B-0668, B-0670, B-0671, B-0699, B-0743, B-0755, B-0756, B-0760, B-0761, B-0762, B-0778, B-0784, B-0785, B-0786, B-0787, B-0789, B-0790, B-0791, B-0792 | ported and translated | F103-FR-003, F103-FR-002, F103-FR-016, F103-FR-009, F103-FR-031, F103-FR-007, F103-FR-005, F103-FR-018, F103-FR-012, F103-FR-017 | PT-103-C-058-* |

## Clarifications

### Session 2026-09-29

Questions of `speckit-specify` and `speckit-clarify`, answered from the sources. No question was put to a person.

- Q: The brief lists nine "hook points" and names `requestPass` among them. Annex D has eight call points and makes `requestPass` a directive. Which stands? → A: Annex D. The eight call points are in F103-FR-022 and the eleven directives, `requestPass` among them, are in the closed set of directives. (Source: `feature-briefs.md` brief 103, heading 4; F100-FR-114; the annex of feature 100 stands where a file and the brief differ)
- Q: The brief lists the short-pass nudge in scope, and the traceability files assign B-0540, B-0541 and B-0558 to feature 118. Who owns them? → A: The traceability files. Feature 118 owns the short-pass counter, its limit, its variable and the nudge block. This feature fixes the place of the counter in the order of the accounting after a pass (F103-FR-022) and the place of the nudge block in the prompt (F103-FR-031), and claims none of the three items. (Source: `traceability-items.tsv`, B-0540, B-0541, B-0558; `traceability.md` section 5)
- Q: The brief says the register holds no row for the fix of the start-up (ruling K7). Is there one? → A: Yes, DV-087, added after the brief was written. F103-FR-006 and F103-FR-008 cite it. (Source: `consolidation.md` section 6, DV-087; `feature-briefs.md` D.8)
- Q: The brief counts 105 behaviour items. How many are assigned? → A: 106. B-2785 was added by feature 141 for the write site of the stop line on the structured path, and F103-FR-014 carries it. (Source: `traceability-items.tsv`; `traceability.md` section 1)
- Q: Which requirement carries the general part of B-0563 and B-0764, which the traceability files assign to feature 130? → A: F103-FR-004 (`iter_done`) and F103-FR-031 (the order of the prompt blocks). They carry no `origin:` for these two ids, since they are not kept rows of this feature; the dsh variants stay with feature 130. (Source: `feature-briefs.md` brief 103, heading 4, row "The general part of two items"; `traceability.md` section 5, item 20)
- Q: Does the pass loop write a stop line when the pass limit is reached? → A: No. The baseline writes none for the result 4; the engine writes `proposer_max_iter`. The defect is preserved (D-45). (Source: `consolidation.md` section 5, D-45; B-0597; F100-FR-149)
- Q: Is the no-progress breaker evaluated on the structured path? → A: Not under the `parity` profile (D-44 preserved). Outside it, yes, and a firing ends the run as blocked on a human (since W-103-01: only when a declaration of the proposer or a question of the harness was seen in the counted passes; otherwise the run ends `failed`, F103-FR-018). That needs a row of the profile, which did not exist on that day: row 44 was reported. Settled on 2026-09-30: the row is row 59 of annex X §X.7 (W-X-03). (Source: `consolidation.md` D-44, DV-067; annex E §E.2, blocked reason `declared-block`; F100-FR-212)
- Q: How does the engine learn of a stop for a changed source, which happens before a pass starts, when annex E §E.4 has no such result of the pass loop? → A: The result carries the field `blocked`; the engine maps it by the table of blocked reasons and not by `exit_code` alone. Reported as CQ-067. (Source: annex E §E.2, §E.4; ruling K3; R28)
- Q: How many drop rules of continuation are there? → A: Ten of R24 and an eleventh from parallel units: a new phase attempt (which includes a critic-class call and a change of role), a watchdog kill, a repeated failure, the context fill, the age, a change of configuration, a relaunch, an unavailable session, the cap of three continued passes, the parity profile, and the first pass after a group was applied. The second repair and an escalation are `fresh` because the layer that requests them asks for `fresh`. (Source: R24 F-6; R27 D1.5; R29 PU-33; ruling 7; ruling 55)
- Q: What does a harness that reports no usage do for the context-fill rule? → A: It falls back to at most 2 continued passes. (Source: R24 F-6 rule 4)
- Q: Does the switch `carry.ledger_handoff` off stop the whole ledger? → A: Assumed not: the records that keep the counters and the boundaries of a phase attempt are still written, because counts must survive a resume (F100-FR-069); the records after every pass and the handoff are the parts that the switch stops. Reported as CQ-066. (Source: annex B §B.13; F100-FR-068, F100-FR-069; row 8 of annex X §X.7; DV-092)
- Q: Where does the age rule read the cache lifetime of a session? → A: From the harness adapter. Annex C §C.2 has a record `continuation` and a record `session` but no field for the lifetime. Assumed: a field of one of them, and 300 seconds where none is declared. Reported as CQ-068. (Source: R24 F-5, F-6 rule 5; annex C §C.2)
- Q: Where is the path of the full text of a verification obligation that the index points to? → A: In the verification plan for people, `feature:<slug>:verification:test-plan`. Reported as CQ-069. (Source: R12 Recommendation; R27 D1.11; annex B §B.5)
- Q: Which prompt budget holds under the block set `current`, given Lisa's caps in characters and the baseline's budget in bytes? → A: Both. The whole prompt stays within `loop.promptMaxBytes`, each source stays within its own cap, and the smaller governs. (Source: R12 Recommendation part 2; R27 D1.11; Lisa `proposer-context.ts`)
- Q: Is Lisa's no-progress threshold of 2 taken? → A: No. The threshold of the baseline, 3, wins. (Source: `feature-briefs.md` brief 103, heading 3; the merge rule)
- Q: Which config keys does this feature name? → A: Where annex X gives a spelling it is used (`loop.maxIter`, `loop.promptMaxBytes`, `loop.strategy`, `carry.*`, `prompt.block_set`, `staleness.check_points`); the others are proposals and are listed under "Configuration keys". (Source: annex X §X.7, §X.8; F100-FR-212)
- Q: In which order does the whole-prompt budget drop blocks under the block set `current`? → A: Blocks are admitted stable first and volatile after; a block that would take the total over the budget is dropped unless protected, as the baseline appends its one budgeted block. The fixed instructions and the task of the phase are protected, as Lisa's policy never truncates them. (Source: F100 annex D §D.5; `orchestrator.sh` `append_budgeted_block` at `9cab15d`; Lisa `proposer-context.ts`; R27 D1.11)
- Q: Who builds the prompt of the accelerator, and does the pass loop run it? → A: The feature that owns the recovery cycle builds it through the same provider operation; the pass loop runs it as a pass of the role `accelerator` with the same rules, and B-0178 names both prompt files. (Source: brief 103 heading 1; B-0178; `orchestrator.sh:1793` at `9cab15d`)
- Q: Is the event `blocked` emitted under the `parity` profile when the no-progress breaker fires on the path where it fires at the baseline? → A: Yes. The event projects to nothing, so no compared surface changes; only the structured path differs under the profile. (Source: DV-067; F100-FR-144)
- Q: Which questions could the sources not answer? → A: Four, CQ-066 to CQ-069, listed under "Assumptions".

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary. "Pass limit" is the as-is iteration limit; the words "iteration" and "backend" survive only in the literals of the compatibility projection.
- The divergence register of `consolidation.md` section 6 is the authority for the rows and their numbers; this specification cites rows by id and states no count of rows. The brief's figure of 85 rows is out of date.
- Where the architecture file, the brief and a ruling differ, the ruling stands. Where the brief and an annex of feature 100 differ, the annex stands.
- The old side of the layout table maps `proposer-prompt.phase<N>.txt` and `accelerator-prompt.phase<N>.txt` to the prompt of the first pass of the newest phase attempt of the phase; the table is data of feature 141's plan (CQ-026).
- The compatibility projection, compatibility output and the argument tables of the harness adapters exist when the fixtures that compare them run.

Readings that the sources do not settle. Each is marked in its requirement and reported to the orchestrator with a recommended answer. Two of the four were settled by feature 100 on 2026-09-30 and are closed.

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-066 | Does `carry.ledger_handoff` off stop the whole ledger? Row 8 says the ledger and the handoff are off under `parity`; F100-FR-069 says counts live in the ledger | Only the carry-over parts stop; the counter records at the boundaries of a phase attempt stay | F103-FR-039 |
| CQ-067 (closed) | With which result does the pass loop report a stop before a pass because a source changed? | Closed: annex E §E.4, table "Pass loop", row 3: `exit_code` 3 with the field `blocked` set to `source-changed`; the engine maps the field by the table of blocked reasons | F103-FR-019, F103-FR-021 |
| CQ-068 (closed) | Where is the cache lifetime of a session declared? | Closed: `continuation.cacheTtlSec` of annex C §C.2; `carry.ageFallbackSec` (300) where the descriptor declares none | F103-FR-042 |
| CQ-069 | Where does the path in the index of verification obligations point? | To the verification plan for people, `feature:<slug>:verification:test-plan` | F103-FR-037 |

## Repairs after the cross-feature review

Dated 2026-09-30. Requirement ids are never renumbered or reused; new ids are appended.

| Item | Requirement | What changed |
|---|---|---|
| W-103-01 | F103-FR-018 | Result 8 is marked `declared-block` only when a declaration of the proposer or a question of the harness was seen in the counted passes; otherwise the stop is `proposer_no_progress`, `retryable: false`, state `failed` (annex E §E.2) |
| W-X-03 | F103-FR-018 | The parity row of `loop.noProgressStructured` is row 59 of annex X §X.7, not the proposed row 44; "is needed" dropped |
| W-X-24 | F103-FR-016 | Names the event `progress.swept` that the pass loop emits after every pass |
| W-X-24 | F103-FR-044 (new) | Names the events `task.planned` and `task.ticked` that the pass loop emits, with their fields and their absence under `parity` |
| W-X-22 | (section "Threats", new) | Threats T-08 and T-31 of annex X §X.9 named with their controlling requirements |
| W-X-05 | (Assumptions) | The stale count of register rows (94) replaced by a reference to `consolidation.md` section 6 without a count |
| B-8.7 | F103-FR-016 | The sentence added under W-X-24 is withdrawn: `progress.swept` is the as-is `progress_swept`, the sweep of a stray notebook into the canonical place with `from` and `to` as paths (B-0085), which feature 100 carries (F100-FR-057, F100-FR-058); the pass loop does not emit it |
| B-8.7 | F103-FR-044 | The events are emitted in every profile and project to nothing; the suppression under `parity` is withdrawn, since a behaviour that differs under the profile needs a row of annex X §X.7 (F100-FR-210) and none exists. The change is read through the spec-format adapter port, not from the hashes of F103-FR-021, which make no check under `parity` |
| B-8.7 | (Clarifications, Rows of the `parity` profile) | The stale note "row 44 is reported" now names row 59; the heading "Key (as proposed)" is "Key"; an empty second heading "Closed sets" removed |

## Repairs after the analyze run of 2026-09-30

Findings of `speckit-analyze` (the report is `analyze-report.md`). Requirement ids are never renumbered or reused.

| Finding | Requirement | What changed |
|---|---|---|
| I1 | (Edge Cases) | The no-progress edge case names the two branches of F103-FR-018 (`blocked-on-human` with a declaration or a question seen, `failed` otherwise) |
| I2 | F103-FR-019 | A result with the field `blocked` is mapped by the table of blocked reasons before the code table |
| I3 | F103-FR-021, F103-FR-042, (Assumptions) | CQ-067 closed by annex E §E.4 row 3 of the table "Pass loop"; CQ-068 closed by `continuation.cacheTtlSec` of annex C §C.2 |
| U1 | F103-FR-030 | The control of threat T-08 is a requirement: under `current` the feedback provider takes only criterion ids and the text after them, cut to its declared size, and drops the verdict line; test CT-103-145 |
| U2 | F103-FR-035 | The window of the harness is in tokens and is converted to characters by the ratio the plan fixes; window, ratio and character budget are recorded in `prompt.built` |
| U3 | (Rows of the `parity` profile, row 60) | `carry.indexTitleChars` starts at 80 (set by the plan, low confidence) |
| U4 | F103-FR-026 | The engine records `keep`, `repair` and `unresolved` in the layer's namespace and changes no counter for them |
| U5 | F103-FR-042, (Closed sets) | `layer-requested` added to the reasons for a fresh session |
| U6 | F103-FR-041 | The prompt names the handoff under the block set `current` only |
| A1 | F103-SC-004 | The reference machine is the Linux runner of the build workflow; the baseline is measured again on it |
| A2, D1 | F103-FR-042, row 60 | `carry.contextFillShare` is in per cent; `carry.ageFallbackSec` applies only where the descriptor declares no `cacheTtlSec` |
