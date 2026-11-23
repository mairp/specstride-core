# Feature Specification: Run control

**Feature Branch**: `102-run-control` (a label: Spec Kit creates no branch in this repository; the directory is `specs/102-run-control`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 102-run-control: stop and stop --now as the consumer sees them and as the engine honours them at its boundaries and during a pass; resume, its refusals and their exit codes; the comparison of the source hashes (spec, plan, task list) at launch and at resume; the intended change of a source accepted on resume; the run snapshot with pinned and tunable keys and its replay; counts and phase attempt numbers that survive a resume or relaunch, and the reset flag; when a launch continues an unfinished run and when it starts a new one; the operations of the run-state machine that a consumer can ask for."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority; rulings 8, 9, 10, 29, 33, K2, K3, P12), `architecture.md` (sections 4, 8, 14), `consolidation.md` (sections 1, 3, 4, 6; conflicts C-03, C-14, C-25), `feature-briefs.md` (brief 102-run-control, section D.8), `STAGE-B-RULES.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182), research R19, R16, R15, R15v, R23v, R11, R2v, R28, the as-is specifications 028, 011 and 002, the baseline `specstride` and `orchestrator.sh` at `9cab15d`, feature 100 (`specs/100-specstride/`) and feature 141 (`specs/141-parity-oracle/`).

## What this feature is

Run control is what a consumer does to a run that already exists: ask it to stop, and ask it to go on. It has four parts.

| Part | Content |
|---|---|
| Stop | The stop request, `stop` and `stop --now`, and how the engine honours a request at its boundaries and during a pass |
| Resume | `resume`, its refusals and their exit codes, the check of the source hashes, the acceptance of an intended change, the verification of approval records |
| Snapshot | The run snapshot: every resolved key with its source and its class, and its replay on resume |
| Counts and continuation | Counts that survive a resume or a relaunch, the reset flag, and when a launch continues a run or starts a new one |

**In scope**: as listed above, and the operations of the run-state machine that a consumer can ask for (`resume`, `stop`).

**Out of scope**:

| Out of scope | Owner |
|---|---|
| The lock, the lease, lock reclaim, the process registry, the inbox as a mechanism | 122 |
| The relaunch classifier and `supervise stop` | 123 |
| The front-door spelling of the verbs and their compatibility output | 119 |
| `status` | 129 (data and default output), 119 (compatibility output) |
| The ledger in which the counts live | 103 (content), 100 (schema) |
| Precedence ranks of the snapshot among config layers | 110 |
| Quota pause and its resume | 127 |
| The hashing and the staleness verdict | 104 |
| The comparison of the source hashes at every pass start | 103 |
| The check at critic start, which stays under the `parity` profile | 105 |
| The wait of the runtime root during the backoff of a relaunch, and the quota pause, as mechanisms; this feature specifies only that a stop request ends each of them (F102-FR-009) | 123 (backoff), 127 (pause) |
| The rendering of compatibility output lines from the compatibility projection; this feature gives the event the facts the lines need (F102-FR-004, F102-FR-010) | 144 (projection), 145 (presenter) |

Where this feature consumes what another feature owns, it names the interface contract of feature 100 through which it does so (see "Contracts of feature 100 used").

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The consumer stops a run (Priority: P1)

A consumer wants a run to end cleanly, or at once. `stop` asks for a clean stop after the current pass. `stop --now` also ends the pass in flight. The run ends with exit 6, and a later `resume` continues it.

**Why this priority**: A run is unattended and can run for many hours. Stop is the consumer's only brake, and it must never hurt anything else on the machine.

**Independent Test**: Fixture family FX-12 (feature 141, §O.2): stop before a phase, between passes, during a yield, with `--now`, and with no run active. In each, the engine exits 6 with the stop reason `stop_flag` and the request is gone. In a fixture with a reused process id, no signal is sent.

**Acceptance Scenarios**:

1. **Given** a run in a pass, **When** the consumer runs `stop`, **Then** the pass finishes, the engine exits 6 at the next boundary, and the request is removed (F102-FR-003, F102-FR-004).
2. **Given** a run in a pass, **When** the consumer runs `stop --now`, **Then** the owned processes of the pass end, the engine exits 6, and no adoptable detached job is touched (F102-FR-006, F102-FR-008).
3. **Given** no run is active, **When** the consumer runs `stop`, **Then** the command warns, writes the request, exits 0, and the next engine start stops at once (F102-FR-002).
4. **Given** a process record whose pid now belongs to an unrelated process, **When** the consumer runs `stop --now`, **Then** no signal is sent (F102-FR-007).

---

### User Story 2 - The consumer resumes a run (Priority: P1)

After a stop, a crash, a block or a failure, the consumer runs `resume`. The run goes on from the records on disk, with its counts, its snapshot and its approved phases. If it cannot go on, `resume` says why, with a code that a script can read.

**Why this priority**: Resume is the way back from every resting state. A wrong refusal loses work; a wrong acceptance runs on damaged records.

**Independent Test**: FX-13: resume after the reject limit, with pinned keys, with the lock held, with nothing to resume. The refusals exit 5 and 3, and the oracle maps the as-is code 1 to them.

**Acceptance Scenarios**:

1. **Given** a stopped run, **When** the consumer runs `resume`, **Then** a new launch record is written, the run continues at the first phase without a valid approval record, and it keeps its `runId` (F102-FR-011).
2. **Given** a workspace whose lock is held by a live owner, **When** the consumer runs `resume`, **Then** the command exits 5 (F102-FR-013).
3. **Given** a workspace that has state and no run to continue, **When** the consumer runs `resume`, **Then** the command exits 3 (F102-FR-012).
4. **Given** an owner that is dead and a recorded process group that is alive, **When** the consumer runs `resume`, **Then** the command refuses and names the survivors (F102-FR-014).
5. **Given** a workspace without state, **When** the consumer runs `resume`, **Then** the command exits 1, and no other check of `resume` has run (annex G §G.4; F102-FR-012).

---

### User Story 3 - The consumer changes a source in the middle of a run (Priority: P1)

The consumer edits the spec, the plan or the task list while a run rests. `resume` refuses with exit 3 and names the file. If the change was intended, the consumer says so with a flag, and the run keeps its counts and its delivered evidence.

**Why this priority**: An edit of `tasks.md` once made the critic refuse a 44 h attempt 22 h later (R28). The check must fire early, and the way past it must be explicit.

**Independent Test**: Change the spec, the plan and the text of the task list in turn between launch and resume: exit 3, the file named, the run read as `blocked-on-human`. Change only a checkbox: no refusal. Resume with the flag: the new hashes are recorded and the counts are unchanged.

**Acceptance Scenarios**:

1. **Given** a changed plan, **When** the consumer runs `resume`, **Then** the command exits 3 and names the plan (F102-FR-015).
2. **Given** a task list in which only checkboxes changed, **When** the consumer runs `resume`, **Then** there is no refusal (F102-FR-017).
3. **Given** a changed spec, **When** the consumer runs `resume --accept-source-change`, **Then** the plan and the check manifest are derived again, the new hashes are recorded, counts and delivered phase evidence stay, and every critic of the run is told the change as a fact (F102-FR-019, F102-FR-020).
4. **Given** the `parity` profile, **When** a source changed, **Then** neither `resume` nor a launch refuses, and the plan is checked when the critic starts, as at the baseline (F102-FR-018).

---

### User Story 4 - A limit means what it says (Priority: P1)

With the reject limit at 3, a run that was stopped and resumed after two rejections halts at the next one. Counts, phase attempt numbers, the MALFORMED streak, the pass index, the yield index and the breakers continue across a resume or a relaunch. The consumer can reset them on purpose, from the command line only.

**Why this priority**: The as-is systems start the counts again in every process, so a limit is per process and not per run (decision 23).

**Independent Test**: A characterization test with a reject limit of 3 reached across two resumes. A resume with the reset flag followed by a resume without it: the second one carries the counts.

**Acceptance Scenarios**:

1. **Given** a limit of 3 and two rejections before a stop, **When** the run is resumed and a third rejection comes, **Then** the run halts (F102-FR-032).
2. **Given** `--reset-counts` on one resume, **When** the next resume has no flag, **Then** the counts carry and the flag was never replayed (F102-FR-033).
3. **Given** an unfinished run of a feature, **When** the consumer launches again, **Then** the launch continues it and says so in one line; with `--new-run` it starts a new run (F102-FR-034).

---

### User Story 5 - Saved settings replay, and an exported value can win (Priority: P2)

On resume, the settings that give a run its identity (harness, model, spec format, feature, verification) are replayed from the run snapshot. Settings that are only a budget or a timeout can be changed by the consumer's environment, so that the remedy the engine prints (`SPECSTRIDE_PROPOSER_TIMEOUT=3600 specstride resume`) works.

**Why this priority**: At the baseline a saved timeout silently beat an exported one (defect D-35).

**Independent Test**: A tunable key set in the environment on resume takes effect. A pinned key set in the environment does not. A flag beats both. A failed write of the snapshot is a launch error.

**Acceptance Scenarios**:

1. **Given** a tunable key set in the environment, **When** the run is resumed, **Then** the environment value is used (F102-FR-027).
2. **Given** a pinned key, **When** the run is resumed, **Then** the snapshot value is used unless a flag names another (F102-FR-027).
3. **Given** a snapshot that cannot be written, **When** a launch runs, **Then** the launch is a launch error and no pass starts (F102-FR-025).

---

### Edge Cases

- A stop request is written while no run is active: the next engine start stops at once, and the engine removes the request when it honours it (F102-FR-002).
- A stop request is empty or cannot be read: it is a clean stop, and it never carries `--now` or `--jobs` (F102-FR-001).
- A stop arrives during the wait of a yield: the detached job is left running and is adopted by the next engine start (F102-FR-005).
- A stop arrives while the run is in a quota pause or in the backoff before a relaunch: the wait ends and the run rests as `stopped` (F102-FR-009).
- A source file is missing at resume that was there at launch: it counts as changed and is named (F102-FR-015).
- The run ended blocked on a changed source found at a pass start: plain `resume` refuses again until the change is reverted, accepted with the flag, or a new run is started (F102-FR-021).
- `--accept-source-change` is given and nothing changed: the command behaves as a plain `resume` and records no accepted change (F102-FR-019).
- The engine executable recorded at launch no longer exists: the product's own entry is used (F102-FR-030).
- A `resume` of a run that is `finished`: nothing to resume, exit 3 (F102-FR-012).
- A `resume` on a workspace without state: exit 1 from the state check of annex G §G.4, which comes first; the check of F102-FR-012 is not reached (F102-FR-012).
- A snapshot of an unknown major, or replayed values that fail validation again: `resume` exits 3 and names the record or the key (F102-FR-024).
- The task list changed only because the runtime ticked tasks after an approval: never a refusal (F102-FR-017).
- The machine rebooted: the run reads as `dead`; `resume` reclaims through the lock provider and continues (F102-FR-014).

## Requirements *(mandatory)*

### Functional Requirements

Group G1: stop and `stop --now`.

- **F102-FR-001**: `stop` MUST write one stop request per workspace into the inbox, under the logical name `inbox:stop`, as a temporary file renamed into place, so that no reader sees a partial request. The request is of the type `stop` of `specstride.inbox/1` with the fields `now` and `jobs` (both false unless asked) and, when a run was active, the hash of its run token. An empty request and a request that cannot be read MUST mean a clean stop with every default: they MUST never carry `now` or `jobs`. The runtime MUST validate the request before it acts on it. Nothing outside the runtime tree MUST write anything else to control state on behalf of `stop`.
  - origin: 028 FR-015; 002 FR-046; B-1439; B-0171; B-1514
  - disposition: merged-with 002 FR-046 (028 FR-015); merged-with 028 FR-015 (002 FR-046); ported (B-1439); translated (B-0171; B-1514)
  - test: PT-102-028FR015-*; CT-102-2; PT-102-C-108-*; PT-102-C-011-*; PT-102-C-113-*
  - divergence: DV-006
  - status: unverified (check: the write of the stop request from the host's shell tool with the shell sandbox on, on Linux and macOS; verified-on: —; pin: host versions of the spike of feature 122)

- **F102-FR-002**: `stop` with no run active MUST still write the request, MUST warn on the error stream that no run appears to be active and that the next engine start will honour the request, and MUST exit 0. The next engine start MUST stop at once, and the engine MUST remove the request when it honours it. `stop` MUST exit 0 in every branch once state exists, and 1 when the workspace has no state (no workspace record).
  - origin: B-1578; B-1493
  - disposition: ported
  - test: PT-102-C-115-*; PT-102-C-111-*
  - parity: on (compatibility output; not a switch)

- **F102-FR-003**: The engine MUST read the stop request at the top of every phase attempt (before the proposer starts, and not between the proposer and the critic), before a pass starts, after a pass that produced no phase evidence, and while it waits during a yield. The request MUST be honoured at each of these points, whichever loop layer is on.
  - origin: B-0126; B-0311; B-0584; B-0596
  - disposition: ported (B-0126; B-0311); translated (B-0584; B-0596)
  - test: PT-102-C-009-*; PT-102-C-013-*; PT-102-C-054-*
  - divergence: DV-066

- **F102-FR-004**: When the engine honours a stop request it MUST remove the request first, so that a rerun continues, and MUST end with exit 6, the stop reason `stop_flag`, `retryable: false`, cause `normal` and `causedBy: operator` in its terminal record. It MUST emit the stop event with the field `phase`, both when the request is found at the top of a phase attempt and when the pass loop returns the result 6, and with the field `foundAt`, `attempt-top` for the first case and `pass-loop` for the second (a request found before a pass, after a pass without phase evidence, or during a yield), so that the compatibility projection can choose the as-is line of F102-FR-010. The result 6 of the pass loop MUST win even when phase evidence exists. The pass loop MUST write no event of its own for a stop found before a pass starts.
  - origin: B-0128; B-0142; B-0144
  - disposition: ported
  - test: PT-102-C-009-*; PT-102-C-010-*
  - status: unverified (check: none needed; the stop request carries no field that says who asked, so `causedBy` is `operator` for every request; see assumption CQ-078)

- **F102-FR-005**: A stop request found during the wait of a yield MUST end the pass loop with the result 6. The detached job MUST be left running as an `adoptable` process, and the next engine start MUST adopt it. Compatibility output MUST print the as-is line that says the job is owned by the runtime and is left running, with its process id and the path of its log, with a logical component name where the baseline named an implementation file.
  - origin: B-0589; B-0658
  - disposition: translated
  - test: PT-102-C-054-*; PT-102-C-057-*
  - divergence: DV-066

- **F102-FR-006**: `stop --now` MUST write the same request as `stop` and MUST also end the owned processes of the pass in flight: the process recorded for it in the process registry (`run:<runId>:procs`) and every descendant of it that is not an `adoptable` job. The signal MUST be a termination signal only, with no forced kill, and a failure to signal MUST be ignored. Afterwards the engine finds no phase evidence, reads the request, and exits 6.
  - origin: B-1462; B-1515; B-1566; B-1579
  - disposition: ported (B-1462; B-1566; B-1579); translated (B-1515)
  - test: PT-102-C-109-*; PT-102-C-113-*; PT-102-C-115-*
  - divergence: DV-006

- **F102-FR-007**: Before it sends any signal, `stop --now` MUST check that the pid, the start time and the run token of the registry entry all match the live process. It MUST send no signal when any of the three differs. It MUST signal only entries of class `owned`.
  - test: CT-102-3
  - status: unverified (check: resolution of the process start time on macOS; verified-on: —; pin: macOS version of the runner)

- **F102-FR-008**: `stop` and `stop --now` MUST never end an `adoptable` detached job. `stop --jobs` (with or without `--now`) is the separate, explicit request that also ends `adoptable` jobs, again only after the identity check of F102-FR-007. An `adoptable` job MUST NOT make `resume` refuse.
  - test: CT-102-4
  - parity: not used (no as-is behaviour; row 63 of annex X §X.7)

- **F102-FR-009**: A stop request MUST be honoured while the run is in a quota pause and while the runtime root waits out the backoff of a relaunch: the wait ends, no relaunch starts, no budget is spent, and the run rests as `stopped`. The process that waits honours the request (transition T13 of annex E §E.2 from `paused-quota` and `relaunching`): the runtime root during the backoff, whose wait is feature 123's, and the process that holds the pause, which is feature 127's. This feature specifies the behaviour and tests it against those processes (CT-102-5); it builds neither wait.
  - test: CT-102-5
  - ep: EP-13 `specstride.lock/1` (consumes)

- **F102-FR-010**: Under compatibility output `stop` MUST print the as-is lines byte for byte after the rules of the oracle: `stop requested → ` followed by the path of `inbox:stop`; with `--now` one of `killed in-flight agent pass (pid <pid> + descendants)`, `recorded pass (pid <pid or ?>) is not running — nothing to kill`, or `no in-flight pass recorded (<path> missing) — flag-only stop`, and then `the run will exit 6 (clean stop) momentarily; resume with: specstride resume -w <workdir>`; without `--now` the line `the run finishes its current pass, then exits 6 (clean stop).` and the hint. In compatibility output the as-is engine lines `>>> stop.flag detected — halting cleanly (exit 6; rerun resumes).` (a request found at the top of a phase attempt, `foundAt: attempt-top`) and `>>> stop.flag detected during proposer — halting cleanly (exit 6; rerun resumes).` (a request found by the pass loop after a pass without phase evidence, `foundAt: pass-loop`) MUST be shown byte for byte; they are rendered by the presenter from the compatibility projection of the stop event of F102-FR-004 (annex G §G.3; features 144 and 145), and the engine writes the event and no line of its own. In default output `stop` MUST print one product line `[SPECSTRIDE-STOP]` with the keys `request` (the logical name), `now`, `ended` (number of processes ended) and `next`. Under the `parity` profile the default line MUST NOT be printed.
  - origin: B-1548; B-1549; B-1550; B-1551; B-1552; B-1553; B-0209; B-0215
  - disposition: ported
  - test: PT-102-C-114-*; PT-102-C-012-*
  - divergence: DV-034
  - parity: no new line (row 19 of annex X §X.7)

Group G2: `resume`, its refusals, the source hashes.

- **F102-FR-011**: `resume` MUST continue the run of the workspace from the records on disk, as the same run: the `runId` stays, a new launch record with reason `resume` and a new `launchId` is written (transition T1 and, where the runtime root starts, T2), and the run goes on at the first phase without a valid approval record. The launch record MUST record the flags `resetCounts` and `acceptSourceChange` of this launch. `resume` MUST continue the way the last launch of the run started: in the foreground, with the exit code of the engine and no wrapper process, or through the runtime root and the handshake of annex F §F.3.
  - origin: 028 FR-016; B-1440
  - disposition: merged-with 002 FR-016 (028 FR-016); ported (B-1440)
  - test: PT-102-028FR016-*; PT-102-C-108-*
  - assumption: CQ-072 (the route of a continued run and the launch-record fields for the two flags; annex G §G.4 gives `resume` the engine codes only)

- **F102-FR-012**: `resume` MUST exit 3 when there is nothing to resume. This check MUST come after the state check of annex G §G.4 (row `resume`: "1 without state, which is the first check"; the check is the front door's, F119-FR-009), which exits 1 on a workspace without state: on such a workspace `resume` MUST exit 1 and MUST NOT exit 3. Bare `resume` selects the run most recently launched in the workspace; `resume` with a feature selects the run of that feature. There is nothing to resume when no run snapshot exists for the selection, and when the selected run is `finished`. Among the checks of this feature this check MUST be the first, and it MUST come before the check of the lock. The as-is messages, in compatibility output, are `specstride resume: no last-run config for feature '<slug>' (<path>).` and `specstride resume: no <path> — launch the run once via orchestrator.sh first.` with the path of the logical name; in default output the failing item and its fix.
  - origin: 002 FR-016; B-1494; B-1495; B-0170; B-1516; B-1580
  - disposition: merged-with 028 FR-016 (002 FR-016); translated (B-1494; B-1495; B-0170; B-1516); ported (B-1580)
  - test: CT-102-1; CT-102-26; PT-102-C-111-*; PT-102-C-011-*; PT-102-C-113-*; PT-102-C-115-*
  - divergence: DV-021; DV-006
  - parity: the oracle maps the as-is code 1 to 3 (row 15 of annex X §X.7); the code 1 of a workspace without state is not mapped
  - assumption: CQ-073 (a `finished` run: the state machine has no transition from `finished`, so nothing to resume; the baseline runs the release verification again); CQ-184 (the state check comes first and exits 1)

- **F102-FR-013**: `resume` MUST exit 5 when the lock probe says the workspace is held by a live owner (`held-live`, `held-foreign` or `unknown`). The as-is message in compatibility output is `specstride resume: a run is already ACTIVE on <workdir> (lock held) — nothing to resume.`
  - origin: 028 FR-016; 002 FR-016; B-1496
  - disposition: merged-with 002 FR-016 (028 FR-016); merged-with 028 FR-016 (002 FR-016); translated (B-1496)
  - test: PT-102-028FR016-*; CT-102-1; PT-102-C-111-*
  - divergence: DV-021
  - parity: the oracle maps the as-is code 1 to 5 (row 15 of annex X §X.7)
  - ep: EP-13 `specstride.lock/1` (consumes)

- **F102-FR-014**: `resume` MUST reach the lock only through `probe` and `reclaim` of EP-13. On `stale-owner-dead` it MUST reclaim and go on. When the owner is dead and a recorded `owned` process group is alive (`owner-dead-group-alive`), it MUST refuse, name the survivors, and exit 5. A foreign owner MUST never be reclaimed. A `dead` run after a crash or a reboot MUST be continued by `resume` alone: the dead launch is closed with a synthesized `run.ended` (marked `synthesized`, cause `crash`, `causedBy` absent) at transition T4 of annex E §E.2, written by the process that acquires or reclaims the lock (the runtime root; in the foreground the engine itself, F100-FR-156), never by the CLI, and the run goes on at the first phase without a valid approval record.
  - test: CT-102-6
  - ep: EP-13 `specstride.lock/1` (consumes)
  - assumption: CQ-077 (exit 5 for the refusal with survivors; annex G §G.4 lists three refusals only)

- **F102-FR-015**: At `resume`, and at a `launch` that continues an unfinished run, the CLI MUST compare the hashes of the spec, the plan and the task list with the run snapshot, using the canonical hasher and its classification of the staleness verdict (annex X §X.5, F100-FR-207; the rules are feature 104's, CQ-214). A change, or a file that disappeared or appeared, MUST refuse the command with exit 3, and the refusal MUST name every changed file. The check MUST come after the checks of F102-FR-012 and F102-FR-013.
  - origin: 002 FR-016
  - disposition: merged-with 028 FR-016
  - test: CT-102-1; CT-102-7
  - divergence: DV-021; DV-082
  - parity: not active; the plan is checked at critic start (row 15 of annex X §X.7)

- **F102-FR-016**: The CLI MUST record a refusal for a changed source in the launch record (outcome `refused`, the file named), and MUST NOT write run state or an event (annex B §B.2, F100-FR-003). Readers MUST derive the run as `blocked-on-human` with the attention item `source-changed`. The event `blocked`, with the reason `source-changed`, MUST be written by the next process that becomes the writer of the event file, marked as synthesized.
  - divergence: DV-082; DV-067
  - test: CT-102-8
  - assumption: CQ-021 (who records state and event at a refused `resume`)

- **F102-FR-017**: For the task list the hash that ignores checkboxes MUST be the one compared. A tick MUST never refuse a resume, including a tick made by the runtime after an approval.
  - test: CT-102-9
  - divergence: DV-082

- **F102-FR-018**: Under the `parity` profile the two check points of `resume` and of the continuing launch MUST NOT be active, and `resume` MUST NOT refuse for a changed source; the plan MUST be checked when the critic starts, as at the baseline. The flag of F102-FR-019 is not used.
  - divergence: DV-082; DV-091
  - test: CT-102-10
  - parity: check at critic start only (row 15 of annex X §X.7, key `staleness.check_points`)

- **F102-FR-019**: `resume` MUST accept the flag `--accept-source-change`, by which the consumer accepts an intended change of the spec, the plan or the task list. With the flag, `resume` MUST derive the verification plan and the check manifest again, record the old hash, the new hash, the file and the time in the run snapshot (`acceptedChanges`), keep the counts and the phase evidence of phases already delivered, and continue. The CLI writes `acceptedChanges` and the new hashes into the snapshot, as it writes the snapshot at launch (F102-FR-025), before the engine starts; the engine reads them and writes no snapshot. With the flag and no changed source, `resume` MUST behave as a plain `resume`.
  - divergence: DV-091
  - test: CT-102-11
  - parity: not used (row 15 of annex X §X.7)
  - ep: EP-07 `specstride.verification-source/1` (consumes)
  - assumption: CQ-017 (the spelling of the flag)

- **F102-FR-020**: An accepted change MUST be emitted as an event of the type `source.change_accepted` (event catalogue, annex X §X.1 and row 73 of §X.6), one event for each file accepted, with the file (`spec`, `plan` or `tasks`), its logical name, the old hash, the new hash and the time of the acceptance in `data`, and with no text of the source. The event MUST be written by the process that becomes the writer of the event file for the launch that accepted the change, because the CLI writes no event (F102-FR-016). The accepted change MUST reach every critic of the run as a fact, in the fact block (annex D §D.7, member "an intended change of a source that was accepted"), for the rest of the run. The critic MUST receive no count and no detail of how the change was accepted.
  - divergence: DV-091
  - test: CT-102-12
  - assumption: CQ-019 (settled on 2026-09-30: the catalogue holds the type, F111-FR-051, table "Types added on 2026-09-30"; W-111-02 closed)

- **F102-FR-021**: Without the flag nothing MUST continue. A run that ended blocked on `source-changed`, whichever process found it, MUST be left only by `resume --accept-source-change`, by a `resume` after the change was reverted, or by a `launch` with `--new-run`. In default output the refusal MUST name the file and offer the three ways out: revert, `resume --accept-source-change`, `launch --new-run`.
  - test: CT-102-13

- **F102-FR-022**: `resume` MUST verify every approval record of the feature: the signature and every binding of annex B §B.14. It MUST continue at the first phase without a valid record. A record that fails, and a bare approval marker without a record, MUST count as not approved and MUST raise the integrity event `integrity.noted` (annex X §X.1; the group "Routing and integrity" of the catalogue of feature 111) with, in `data`, the phase, the logical name of the record or the marker, and which failed: the signature, a named binding of annex B §B.14, or the absence of a record. Whether the finding is also a breach of the phase gate (annex X §X.6 row 141) that trips the tripwire of F100-FR-074 is the phase gate's to decide (feature 101); this feature raises the event only.
  - divergence: DV-029
  - test: CT-102-14
  - parity: a planted marker is waived (FX-13, `planted-approval-marker`)

- **F102-FR-023**: `blocked-on-human` MUST be a resting state that only `resume` leaves (transition T17). `resume` MUST also leave `stopped`, `failed` and `dead`. Where the state is live (`starting`, `running`, `paused-quota`, `relaunching`, `stopping`) the lock is held and F102-FR-013 applies. The continuation after the reason `quota-wait-ceiling` belongs to the quota pause and is not specified here.
  - test: CT-102-15

- **F102-FR-024**: `resume` MUST exit 3 and name the record when a record of the run has a schema major that the reader does not support (`unsupported-record`), and MUST exit 3 and name the key when the replayed values fail validation against the config schema and the trust classes again (`settings-invalid`). A record written under an older schema major MUST NOT be read. The order of the six refusals of `resume` is: `nothing-to-resume` (F102-FR-012), `unsupported-record` (a record must be readable before the run can be selected further), `lock-held` and `owner-survivors` (F102-FR-013, F102-FR-014), `source-changed` (F102-FR-015), `settings-invalid` (after the replay of F102-FR-027); the state check of annex G §G.4 comes before all six.
  - divergence: DV-039
  - test: CT-102-16

Group G3: the run snapshot and its replay.

- **F102-FR-025**: At launch, after the launch checks passed and before the first pass, the CLI MUST write the run snapshot (`run:<runId>:snapshot`): every resolved configuration key with its value, its source (the rank of annex X §X.2) and its class, the id of the decision for a learned value, the name of the profile in force, and the hashes of the spec, the plan and the task list as pinned values. Secret references MUST be stored as references. A failed write MUST be a launch error: no pass starts, the launch record says why, and the engine exits 1 in the foreground and `launch` gives the outcome `refused`. A launch refused by a launch check MUST write no snapshot and replace none.
  - origin: B-0169
  - disposition: translated
  - test: PT-102-C-011-*; CT-102-17; CT-102-27 (every resolved key present; a planted canary secret appears only as its reference)
  - divergence: DV-024; DV-006
  - assumption: CQ-074 (the exit code of a failed write)

- **F102-FR-026**: Every key of the snapshot MUST have one of two classes. `pinned`: keys that give the run its identity, among them the harness and model of each role, the choice of the critic, the spec format, the feature, the verification mode, plan and commands, the containment level and the audience. `tunable`: timeouts, caps, budgets, poll intervals and telemetry endpoints. The class of each key is a column of the key table of the config envelope (annex X §X.2, which gives the content of the keys to feature 110; the two classes are the second half of row 76 of annex X §X.6); a key without a class MUST be read as `pinned`.
  - divergence: DV-024
  - test: CT-102-18
  - assumption: CQ-079 (the class of a key that has none)

- **F102-FR-027**: On resume, a pinned key MUST rank below flags and above the environment (rank 3 of annex X §X.2), and a tunable key MUST rank below the environment and above project configuration (between ranks 4 and 5). The pin of the launch contract (rank 1, for the children of the runtime root only) stays above both and above every flag; a flag on `resume` MUST beat both classes (the ported rule is F102-FR-029). Every key whose value differs from the snapshot MUST be recorded with the old value, the new value and the rank. The snapshot MUST keep the value of the launch.
  - divergence: DV-024
  - test: CT-102-19
  - parity: pinned keys compared; a tunable key in the environment is waived (FX-13, `resume-tunable-key-in-environment`)

- **F102-FR-028**: `resume` MUST replay the settings that the baseline replays: the workspace, the spec location and the feature; the harness of each role; the reject limit and the pass limit; the spec format; the verification mode, the test plan, the verification commands and the generation of tests; the pass ceiling and its per-phase overrides (the operator's overrides only, and not the ceilings of the verification-commands document); the telemetry switch with its address only when the switch is on, and the same for the second exporter; the long-job phase and command only when both are set; and the setting for commits after approval. A key that was empty MUST NOT be replayed. The path of the verification plan MUST be the plan of the run, and the verification commands MUST be recorded as given, before they were resolved to a path.
  - origin: B-0257; B-0258; B-0259; B-1473; B-1581; B-1583; B-1585; B-1586; B-1587; B-1588; B-1589; B-1590; B-1591; B-1592; B-1593; B-1594; B-1595
  - disposition: translated (B-0257; B-0258; B-0259; B-1473; B-1581; B-1583); ported (B-1585; B-1586; B-1587; B-1588; B-1589; B-1590; B-1591; B-1592; B-1593; B-1594; B-1595)
  - test: PT-102-C-013-*; PT-102-C-110-*; PT-102-C-115-*
  - divergence: DV-024; DV-027; DV-039
  - parity: settings not saved at the baseline are waived (FX-13, `resume-unsaved-setting`)

- **F102-FR-029**: Arguments given to `resume` MUST be applied after the replayed settings, and the last one MUST win. This is the as-is form of the rank rule of F102-FR-027 (rank 2 above rank 3); the two say one thing.
  - origin: 028 FR-016; B-1596
  - disposition: merged-with 002 FR-016 (028 FR-016); ported (B-1596)
  - test: PT-102-028FR016-*; PT-102-C-115-*

- **F102-FR-030**: `resume` MUST use the engine executable recorded in the launch record of the run when that file still exists, and otherwise the product's own entry. It MUST pin the executable it uses, by path and hash, in its new launch record.
  - origin: B-1582
  - disposition: ported
  - test: PT-102-C-115-*
  - parity: the oracle sets the key to its engine stub (row 41 of annex X §X.7)

- **F102-FR-031**: Under compatibility output `resume` MUST print `resuming: ` followed by the engine executable and the replayed argument list before it starts the engine. Under the `parity` profile it MUST print no line that has no as-is equivalent.
  - origin: B-1554
  - disposition: ported
  - test: PT-102-C-114-*
  - parity: no new line (row 19 of annex X §X.7)

Group G4: counts, the reset flag, continued or new run.

- **F102-FR-032**: Reject counts, the ordinals of phase attempts, the MALFORMED streak, the pass index, the yield index and the consecutive breakers MUST continue across a resume and across a relaunch. Each engine start MUST take them from the ledger. An identifier of a phase attempt MUST never be reused. The oscillation window MUST be keyed by the sequence of phase attempts.
  - divergence: DV-011; DV-044
  - test: CT-102-20
  - parity: resume fixtures pass `--reset-counts` (row 13 of annex X §X.7)

- **F102-FR-033**: `--reset-counts` MUST reset every count of F102-FR-032, and those of every loop layer, and MUST be recorded in the ledger and as the event `counters.reset`. The flag MUST be accepted from the command line only: never from the environment, the project or user configuration, the launch contract or the snapshot. It MUST never be replayed. Evidence, approval records and archives MUST NOT be removed by it.
  - divergence: DV-011
  - test: CT-102-21
  - parity: resume fixtures pass `--reset-counts` (row 13 of annex X §X.7)
  - ep: EP-04 `specstride.loop-layer/1` (consumes)

- **F102-FR-034**: A launch MUST continue the unfinished run of the same feature, with its `runId`, its snapshot and its counts, and MUST say so in one line: `[SPECSTRIDE-CONTINUE]` with the keys `run` and `counts` (`carried` or `reset`). A new run MUST start only when no unfinished run of the feature exists or when the consumer passes `--new-run`; it gets a new `runId`, a snapshot and counts of its own, and the records of the old run MUST stay. The foreground `run` MUST follow the same rule (annex G §G.1, row `run`), and `resume` prints the same line (annex G §G.3). A launch that continues a run MUST take the snapshot into account as `resume` does (annex X §X.2: the snapshot has the same rank at a continuing launch as at `resume`). The selection of the unfinished run, `--new-run`, the check of F102-FR-015 at a continuing launch, the rank of the snapshot and the line MUST be one module of the CLI that `launch`, `run` and `resume` call, so that the three commands cannot drift. Under the `parity` profile the line MUST NOT be printed.
  - divergence: DV-011; DV-034
  - test: CT-102-22
  - parity: `--new-run` not used (row 62 of annex X §X.7); no new line (row 19 of annex X §X.7)
  - assumption: CQ-075 (settled on 2026-09-30 by annex X §X.2); CQ-076 (settled on 2026-09-30 by annex G §G.1, row `run`)

- **F102-FR-035**: After a reset, the logical name of anything that belongs to a phase attempt MUST still carry the phase number, the ordinal of the engine start and the ordinal of the phase attempt. Where a directory of that name already exists, the as-is suffix rule MUST apply: the run id is appended.
  - divergence: DV-011
  - test: CT-102-23

- **F102-FR-036**: The run-control events MUST carry the facts named here; their types are those of the event catalogue (annex X §X.1; row 73 of annex X §X.6). `run.launched` MUST say whether counts were carried and whether they were reset. `counters.reset` MUST name the counts reset. `run.ended` for a stop MUST carry the cause, the field `causedBy` and the field `foundAt` of F102-FR-004; `run.ended` for a dead launch closed by `resume` MUST be marked `synthesized` with the cause `crash` (F102-FR-014). `integrity.noted` MUST carry the facts of F102-FR-022 for an approval record that fails. `blocked` MUST carry the reason `source-changed` and the file. `unblocked` MUST close an open `blocked` when `resume` leaves `blocked-on-human` (transition T17, F102-FR-023): it MUST be written by the process that becomes the writer of the event file for that launch, with the fields `by` (`operator`, as `causedBy` in F102-FR-004) and `latencyMs`. `source.change_accepted` MUST carry the fields of F102-FR-020. No event MUST hold a secret value or the text of a source.
  - test: CT-102-24
  - assumption: CQ-019 (event names and fields are the catalogue's); CQ-078 (`by` is `operator` for every `resume`)

- **F102-FR-037**: The operations that a consumer can ask of the run-state machine are `resume` and `stop`. The CLI MUST write only the transitions into and out of `created` (T1, T2, T3, T17). `stop` MUST write a request and no state. A host MUST write no transition. The transitions T13 and T14 MUST be written by the engine at boundaries and by the runtime root.
  - test: CT-102-25

### Key Entities

| Entity | What it is |
|---|---|
| Stop request | The inbox request of type `stop`; `now` and `jobs` false by default; empty means a clean stop |
| Run snapshot | The record of the resolved keys with source and class, and of the source hashes of the run |
| Pinned key, tunable key | The two classes of a key of the snapshot |
| Source hashes | The hashes of the spec, the plan and the task list (the last one ignoring checkboxes) |
| Accepted change | An intended change of a source, recorded by `resume --accept-source-change` |
| Launch record | The record of one launch; carries the two flags of `resume` |
| Counts | The values that limit a run and that live in the ledger |
| Refusal of `resume` | One of the members of the closed set below |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F102-SC-001**: A limit means what it says. With the reject limit at 3, a run stopped and resumed after two rejections halts at the next one, in 100 per cent of the fixtures, and the counters after each resume equal the counters before it.
- **F102-SC-002**: A stop never signals a foreign process. In fixtures with a reused pid, a changed start time and a changed run token, the number of signals sent is 0.
- **F102-SC-003**: Refusals are exact. In 100 per cent of the fixtures for the cases lock held, nothing to resume and a changed spec, plan or task list text, `resume` exits with 5, 3 and 3, and the hash refusal names the file; in 0 per cent of the fixtures in which only checkboxes changed does `resume` refuse.
- **F102-SC-004**: A stop is honoured. In 100 per cent of the fixtures of FX-12 the engine exits 6 with the stop reason `stop_flag` and the request is removed; after `stop --now` returns, 0 owned processes of the pass are alive 10 seconds later where the pass honours a termination signal.
- **F102-SC-005**: The snapshot is complete and clean. 100 per cent of the resolved keys of a run are in the snapshot with value, source and class, and none of the canary secrets planted in the configuration appears in it.
- **F102-SC-006**: Approval is verified. In 100 per cent of the fixtures with a wrong signature, a mismatched binding or a bare marker, the phase counts as not approved on resume and an integrity event is raised.
- **F102-SC-007**: The reset flag does not replay. After a resume with `--reset-counts` and a second resume without it, the counts carry in 100 per cent of the fixtures.
- **F102-SC-008**: Parity holds. Under the `parity` profile the oracle reports 0 results `different` for FX-12 and FX-13, and the waivers named in this specification are the only ones.

## Constraints

Set by the owner. They are not implementation detail to be removed.

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

## Extension points

This feature implements no extension point. It consumes three.

| EP | Id and version | Relation | What for |
|---|---|---|---|
| EP-13 | `specstride.lock/1` | consumes | `probe` and `reclaim` at `resume` (F102-FR-013, F102-FR-014) |
| EP-07 | `specstride.verification-source/1` | consumes | Deriving the verification plan again on `resume --accept-source-change` (F102-FR-019) |
| EP-04 | `specstride.loop-layer/1` | consumes | The counters of every loop layer are reset and carried with the others (F102-FR-033) |

The commands `stop` and `resume` belong to protocol 1 of EP-01 (annex G §G.1). This feature specifies their behaviour and adds no interface.

## Contracts of feature 100 used

| Interface contract | Version | Annex and section | Requirements |
|---|---|---|---|
| Run-state machine, blocked reasons | `specstride.run-state/1` | E §E.2 | F102-FR-009, F102-FR-016, F102-FR-021, F102-FR-023, F102-FR-037 |
| Stop-reason enumeration; engine exit codes | `specstride.stop-reason/1` | E §E.3, §E.4 | F102-FR-004 |
| Inbox request types | `specstride.inbox/1` | B §B.11 | F102-FR-001, F102-FR-002 |
| Process registry | `specstride.procs/1` | B §B.10 | F102-FR-006 to F102-FR-008 |
| Run snapshot | `specstride.snapshot/1` | B §B.12 | F102-FR-015, F102-FR-019, F102-FR-025 to F102-FR-027 |
| Ledger; approval record | `specstride.ledger/1`, `specstride.approval/1` | B §B.13, §B.14 | F102-FR-022, F102-FR-032, F102-FR-033 |
| Launch record; terminal record | `specstride.launch/1`, `specstride.terminal/1` | B §B.7, §B.15 | F102-FR-004, F102-FR-011, F102-FR-016 |
| Lock and liveness provider | `specstride.lock/1` | F §F.5 | F102-FR-013, F102-FR-014 |
| Config envelope and ranks | `specstride.config/1` | X §X.2 | F102-FR-026, F102-FR-027 |
| Event envelope; event types | `specstride.event/1` | X §X.1; X §X.6 row 73 | F102-FR-004, F102-FR-016, F102-FR-020, F102-FR-033, F102-FR-036 |
| Closed sets | — | X §X.6 rows 50, 51, 66, 76 | F102-FR-012 to F102-FR-016, F102-FR-020, F102-FR-024, F102-FR-026 |
| Threat model | — | X §X.9 | F102-FR-001, F102-FR-007, F102-FR-022, F102-FR-024 |
| Canonical hasher | — | X §X.5 | F102-FR-015, F102-FR-017 |
| Fact block | `specstride.fact-block/1` | D §D.7 | F102-FR-020 |
| Exit codes per command | — | G §G.4 | F102-FR-002, F102-FR-012, F102-FR-013 |
| Identifiers, common rules of records | — | B §B.3, §B.4 | F102-FR-011, F102-FR-024, F102-FR-032 |
| Output modes and line grammar | — | G §G.2, §G.3 | F102-FR-010, F102-FR-031, F102-FR-034 |
| The `parity` profile | `specstride.profile/1` | X §X.7 | rows 13, 15, 19, 41, 62, 63 |

Fixture families of feature 141 cited: FX-12 (stop at each check point), FX-13 (resume and replay), FX-11 (lock held), FX-22 (yield), FX-23, FX-27, FX-03, FX-16, FX-08.

## Rows of the `parity` profile

This feature introduces no configuration key. It introduces four command-line options (rows 13, 15, 62 and 63) and reads rows 15, 19 and 41.

| Option or switch | Default | Under `parity` | Row of annex X §X.7 | Register row |
|---|---|---|---|---|
| `--reset-counts` | counts continue | resume fixtures pass the flag | 13 | DV-011; DV-044 |
| `--accept-source-change` | not given | not used | 15 | DV-091; DV-082 |
| `staleness.check_points` (owned with 103 and 105) | launch, resume and every pass start | critic start only | 15 | DV-082 |
| `--new-run` | not given | not used | 62 (row granted) | DV-011 |
| `--jobs` of `stop` | not given | not used | 63 (row granted) | — |

Both rows that this feature asked for are granted in annex X §X.7: row 62, "Continuation of an unfinished run", the flag `--new-run`, default "a launch continues the unfinished run", under `parity` not used, owner 102, register row DV-011; row 63, "End of adoptable jobs at a stop", the flag `--jobs` of `stop`, default off, under `parity` not used, owner 102, no register row. Rows 44 and 45 of annex X §X.7 are the limits of the observability policy and the retention of captures; this feature does not read them.

## Closed sets

Stated as F100-FR-208 asks. Owner of each: 102.

| Closed set | Members | Closed by | Unknown value |
|---|---|---|---|
| Refusals of `resume` (row 51 of annex X §X.6) | `lock-held` (exit 5), `owner-survivors` (exit 5), `nothing-to-resume` (exit 3), `source-changed` (exit 3), `unsupported-record` (exit 3), `settings-invalid` (exit 3). Row 51 holds all six. Checked in the order of F102-FR-024: `nothing-to-resume`, `unsupported-record`, `lock-held` or `owner-survivors`, `source-changed`, `settings-invalid`. The exit 1 of a workspace without state is no member: it is the state check of annex G §G.4, which comes before every refusal of this set (F102-FR-012) | Owner decision, as row 51 says | Not applicable: the CLI writes them |
| Classes of a key of the run snapshot (second half of row 76) | `pinned`, `tunable` | Design | Read as `pinned`, as row 76 says |
| Kinds of accepted change | `spec`, `plan`, `tasks` (the files of row 50) | Design | Refused |
| Where a stop request was found (`foundAt` of `run.ended`, F102-FR-004) | `attempt-top`, `pass-loop`. Asked of annex X §X.6 (a row of its own) and of the catalogue of feature 111 (the `data` of `run.ended`); reported to the orchestrator | Design | Read as `pass-loop` |

## Threats

Stated as F100-FR-216 asks: the threats of feature 100, annex X §X.9, that name this feature as an owner, with the requirement that is the control of this feature's part, and its test.

| Threat | This feature's part of the control | Requirements | Tests |
|---|---|---|---|
| T-02, the proposer forges approval state | `resume` verifies the signature and every binding of each approval record; a record that fails and a bare marker count as not approved and raise an integrity event. The record and its signing are feature 100's and the phase gate's | F102-FR-022 | CT-102-14 |
| T-26, a process record points at an unrelated process | `stop --now` and `stop --jobs` send a signal only when the pid, the start time and the run token of the registry entry match the live process. The registry is the detached runtime's | F102-FR-007, F102-FR-008 | CT-102-3; CT-102-4 |
| T-28, the proposer writes a stop request, a snapshot or a state file | The stop request is validated before the runtime acts, and an unreadable one is a clean stop that never carries `now` or `jobs`; replayed settings are validated against the config schema and the trust classes again; `--reset-counts` is never read from a file | F102-FR-001, F102-FR-024, F102-FR-033 | CT-102-2; CT-102-16; CT-102-21 |

## As-is behaviour not carried

| As-is id | Behaviour (short) | Register row |
|---|---|---|
| B-0260 (C-013) | The saved settings omit six settings, a failed write is ignored, and the file is written before spec validation and the verification preflight | DV-024 |
| B-1584 (C-115) | `resume` does not replay the verification plan, a critic timeout, `--start-phase`, `--live` or `--debug` | DV-024 |

Both are replaced by the run snapshot of F102-FR-025 to F102-FR-028: every resolved key is saved, a failed write is a launch error, and a refused launch writes nothing. Their behaviour is not carried; the oracle waives each difference (FX-13, `resume-unsaved-setting`, `snapshot-write-fails`).

As-is ids carried, and where:

| As-is id | Disposition | Requirement | Test |
|---|---|---|---|
| 028 FR-015 | merged-with 002 FR-046 | F102-FR-001 | PT-102-028FR015-* |
| 002 FR-046 | merged-with 028 FR-015 | F102-FR-001 | CT-102-2 |
| 028 FR-016 | merged-with 002 FR-016 | F102-FR-011, F102-FR-013, F102-FR-029 | PT-102-028FR016-* |
| 002 FR-016 | merged-with 028 FR-016 | F102-FR-012, F102-FR-013, F102-FR-015 | CT-102-1 |
| C-009, C-010, C-011, C-012, C-013, C-054, C-057 | ported or translated | F102-FR-001 to F102-FR-005, F102-FR-010, F102-FR-025, F102-FR-028 | PT-102-C-nnn-* |
| C-108 to C-111, C-113 to C-115 | ported or translated | F102-FR-001, F102-FR-002, F102-FR-006, F102-FR-010 to F102-FR-013, F102-FR-028 to F102-FR-031 | PT-102-C-nnn-* |

## Clarifications

### Session 2026-09-29

Questions of `speckit-specify` and `speckit-clarify`, answered from the sources. No question was put to a person.

- Q: How does a consumer continue after an intended change of a source? → A: By `resume --accept-source-change`; the flag is spelled so by CQ-017. Without it `resume` refuses with exit 3 and names the file. A changed source otherwise needs a new run and loses the counts. (Source: ruling P12 and CQ-013, closed; CQ-017; F100-FR-173; DV-091)
- Q: What do rulings K2 and K3 give together at `resume`? → A: Exit 3 for the command and `blocked-on-human` for the run, for all three files. (Source: `feature-briefs.md` D.8 "Where rulings meet", row 1)
- Q: Who records the state and the event when `resume` is refused for a changed source? → A: The CLI records the refusal in the launch record; readers derive the state; the next event writer writes the synthesized `blocked` event. (Source: CQ-021; F100-FR-145)
- Q: Which stop reason and exit does a blocked run end with when the engine found the changed source? → A: `critic_config`, exit 3, `retryable: false`. This feature only refuses at `resume`; the engine's pass-start check is feature 103's. (Source: CQ-020; annex E §E.2)
- Q: Is the hash of the task list compared with or without checkboxes? → A: Without: a tick never refuses a resume. (Source: `feature-briefs.md` D.8 row 2; annex X §X.5)
- Q: In which order do the refusals of `resume` come? → A: Nothing to resume, then lock held, then changed source. The baseline checks the saved settings before the lock; Lisa lists the changed hash last. (Source: B-1580; 002 FR-016)
- Q: What does a stop request that cannot be read mean? → A: A clean stop, with no `now` and no `jobs`. (Source: 002 FR-046; F100-FR-065; F100-FR-217)
- Q: Does `stop --now` end detached jobs? → A: No. Only `stop --jobs` does, after the identity check. (Source: R15v P-2; R11 T-26; F100-FR-064)
- Q: What does a stop do in a quota pause? → A: The wait ends and the run rests `stopped`; no budget is spent. (Source: annex E §E.2, T13, T14; F100-FR-146)
- Q: Are the pass index, the yield index and the breakers among the counts that survive? → A: Yes; the oscillation window is keyed by the sequence of phase attempts. (Source: ruling 9; DP-053; R23v IR-50)
- Q: Where may `--reset-counts` come from? → A: The command line only; it is recorded and never replayed. (Source: R23v IR-50 (c); C-14)
- Q: Does a launch continue an unfinished run? → A: Yes; `--new-run` starts a new one. (Source: ruling 8; DP-081; F100-FR-045)
- Q: Which keys are pinned and which tunable? → A: R16 F5.5 gives the rule: identity keys are pinned; timeouts, caps, budgets, poll intervals and telemetry endpoints are tunable. Feature 110 owns the class of each key. (Source: R16 F5.5; annex B §B.12)
- Q: Does `resume` verify approval records? → A: Yes, signature and bindings; a bare marker counts as not approved. (Source: ruling 33; F100-FR-070)
- Q: Which questions could the sources not answer? → A: Eight, marked `CQ-072` to `CQ-079`, listed under "Assumptions".

### Session 2026-09-30

Answered from feature 100 as repaired and from the clarify queue. No question was put to a person.

- Q: `resume` on a workspace without state: exit 1 or exit 3? → A: Exit 1. The state check of annex G §G.4 is the first check of `resume`, as at the baseline (B-1482 before B-1494); then the checks of this feature follow in their order, of which "nothing to resume" (exit 3) is the first. The answer of the session of 2026-09-29 on the order of the refusals stands for the refusals of this feature. (Source: CQ-184, recommended answer of B-8.2b; annex G §G.4, row `resume`)
- Q: Which event type carries an accepted change of a source? → A: `source.change_accepted`, spelled as annex X §X.1 spells a type (dotted, lower case; an underscore inside a segment, as in `integrity.events_changed`). The type is asked of the event catalogue by review item W-111-02. (Source: W-111-02; annex X §X.1; annex X §X.6 row 66, fact `source-change-accepted`)
- Q: Who writes `unblocked`? → A: The process that becomes the writer of the event file when `resume` leaves `blocked-on-human`; the CLI writes no event. (Source: W-X-24; F100-FR-200; annex B §B.2)

Answered on the analysis of the same day (`analyze-report.md`, run of 2026-09-30). No question was put to a person.

- Q: Who records an accepted change in the run snapshot: the CLI or the engine? → A: The CLI, at `resume`, as it writes the snapshot at launch; the engine reads `acceptedChanges`, emits `source.change_accepted` and supplies the fact. The core packages return results and write only events and the ledger. (Source: F102-FR-025; F100-FR-012; annex B §B.2)
- Q: Who prints the as-is engine lines `>>> stop.flag detected …` in compatibility output? → A: The presenter, from the compatibility projection of the stop event; the engine writes the event with `foundAt` and no line. (Source: annex G §G.3, "Input" and "Output" of the presenter; Principle XI)
- Q: In which order do all six refusals of `resume` come? → A: `nothing-to-resume`, `unsupported-record`, `lock-held` or `owner-survivors`, `source-changed`, `settings-invalid`, after the state check of annex G §G.4. (Source: `contracts/resume-refusals.md`, unchanged since 2026-09-29; now stated in F102-FR-024)
- Q: Which event does a failed approval record raise on `resume`? → A: `integrity.noted`, the general integrity type of the catalogue; whether it is a breach of row 141 is the phase gate's. (Source: annex X §X.1; F111 group "Routing and integrity"; F100-FR-070)
- Q: Who closes a dead launch when `resume` continues a `dead` run? → A: A synthesized `run.ended` at T4, written by the process that takes the lock, never the CLI. (Source: annex E §E.2, T4; F100-FR-158; F100-FR-156)
- Q: Does a continuing launch take the snapshot as `resume` does, and does the foreground `run` continue a run? → A: Yes and yes; both are settled by feature 100 as repaired, so CQ-075 and CQ-076 are closed. (Source: annex X §X.2, last sentence of the rank rules; annex G §G.1, row `run`)

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary. The number of rows of the divergence register is not written here; feature 100 states it.
- The lines `[SPECSTRIDE-STOP]` and `[SPECSTRIDE-CONTINUE]` are new product lines of this feature under annex G §G.3 and are never printed under the `parity` profile.
- The compatibility output of the verbs (spelling, selection of the mode) is feature 119's; the texts of the lines above come from behaviour items assigned to this feature.

Readings that the sources do not settle. Each is marked in its requirement and reported to the orchestrator with a recommended answer.

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-072 | How does `resume` continue a run that was started through the runtime root, and how does a launch record carry the flags of `resume`? Annex G §G.4 gives `resume` the engine codes only; annex B §B.7 has no field for the flags | The route of the last launch is taken again; the launch record gets two truth values, `resetCounts` and `acceptSourceChange` | F102-FR-011 |
| CQ-073 | What does `resume` do on a `finished` run? The baseline runs the release verification again and exits 0; the state machine has no transition out of `finished` | Nothing to resume, exit 3 | F102-FR-012 |
| CQ-074 | Which exit code does a failed write of the snapshot give? | Exit 1 in the foreground; the outcome `refused` for `launch` | F102-FR-025 |
| CQ-075 | Which rank does the snapshot take at a launch that continues a run? | Settled on 2026-09-30: annex X §X.2 now says the snapshot has the same rank at a continuing launch as at `resume`. The constitution's precedence row still reads "on resume only"; a wording patch of that row is the owner's, outside this feature | F102-FR-034 |
| CQ-076 | Does the foreground `run` continue an unfinished run and accept `--new-run` and `--reset-counts`? | Settled on 2026-09-30: annex G §G.1, row `run`, says it does, as `launch` does | F102-FR-034 |
| CQ-077 | Which exit code does the refusal with survivors give? | 5 | F102-FR-014 |
| CQ-078 | Who asked for a stop? The inbox request has no such field, so `causedBy` cannot tell an operator from a supervisor or a host | `operator` for every request | F102-FR-004 |
| CQ-079 | What class does a key without a class have? | `pinned` | F102-FR-026 |
| CQ-184 | `resume` on a workspace without state: does the state check (exit 1) or the check "nothing to resume" (exit 3) come first? Raised by the cross-feature review | The state check of annex G §G.4 comes first and exits 1; then F102-FR-012 exits 3 | F102-FR-012 |

## Repairs after the cross-feature review

Dated 2026-09-30. Requirements changed in place; no id was renumbered or reused. The worklist is `docs/ecosystem/reviews/REPAIR-WORKLIST.md`.

| Requirement | Item | What changed |
|---|---|---|
| F102-FR-002 | W-X-06 | "the next run" and "a starting run" became "the next engine start" (ruling 24). The as-is warning text of compatibility output keeps its words |
| F102-FR-008 | W-X-03 | `parity:` cites row 63 of annex X §X.7 in place of "proposed row 45" |
| F102-FR-012 | W-100-24 (CQ-184) | The state check of annex G §G.4 comes first and exits 1; this check is the first of this feature's own. New test CT-102-26; `assumption: CQ-184` |
| F102-FR-020 | W-111-02 | The event type is named: `source.change_accepted`, with its fields and its writer |
| F102-FR-026 | W-X-33 | Names annex X §X.2 and row 76 of annex X §X.6 in place of "the key table of feature 110" |
| F102-FR-028 | W-100-14 | "iteration limit" became "pass limit" |
| F102-FR-033 | W-X-18 | Line `ep: EP-04` added |
| F102-FR-034 | W-X-03 | `parity:` cites row 62 of annex X §X.7 in place of "proposed row 44" |
| F102-FR-036 | W-X-33; W-X-24; W-111-02 | Names annex X §X.1 in place of "the catalogue of feature 111"; names the emitter of `unblocked`; names `source.change_accepted` |

Sections changed: user story 1 and "Edge Cases" (W-X-06); user story 2 and "Edge Cases" (W-100-24); "Contracts of feature 100 used" (rows for the event envelope, the closed sets and the threat model; rows 62 and 63); "Rows of the `parity` profile" (W-X-03); "Closed sets" (rows 51 and 76 of annex X §X.6 now hold what this feature proposed); "Threats" is new (W-X-22); "Clarifications", session 2026-09-30; "Assumptions" (CQ-184; the count of register rows is no longer written).

No change was needed for W-123-02: F102-FR-010 prints `[SPECSTRIDE-STOP]` with the keys `request`, `now`, `ended` and `next`, which are the keys of annex G §G.3.

## Repairs after the analysis of 2026-09-30

The findings are in `analyze-report.md`, run of 2026-09-30. Requirements changed in place; no id was renumbered or reused.

| Requirement | Finding | What changed |
|---|---|---|
| F102-FR-004 | I2, A2 | The stop event carries `foundAt` (`attempt-top`, `pass-loop`) so that the projection can choose the as-is line |
| F102-FR-009 | G3 | Names the process that honours a stop in the backoff (the root, 123) and in the pause (127); this feature builds neither wait |
| F102-FR-010 | I2, A2 | The engine's as-is lines are rendered by the presenter from the compatibility projection; each line is mapped to its `foundAt` |
| F102-FR-014 | U1 | The synthesized end event is `run.ended` at T4, cause `crash`, written by the process that takes the lock |
| F102-FR-019 | I1 | The CLI writes `acceptedChanges` and the new hashes into the snapshot before the engine starts |
| F102-FR-020 | I7 | `assumption: CQ-019` is settled by F111-FR-051 |
| F102-FR-021 | I6 | "two ways out" became the three ways out, named |
| F102-FR-022 | U3 | The integrity event is `integrity.noted` with its `data`; a breach of row 141 is the phase gate's |
| F102-FR-024 | U2, A3 | The order of all six refusals is stated; "older version" became "older schema major" |
| F102-FR-025 | G2 | New test CT-102-27 (every key present; the canary secret as a reference) |
| F102-FR-027, F102-FR-029 | A1, D1 | Rank 1, the pin of the launch contract, is named; the two requirements cite each other as one rule |
| F102-FR-034 | G1, C1 | One module of the CLI serves `launch`, `run` and `resume`; CQ-075 and CQ-076 are settled by annex X §X.2 and annex G §G.1 |
| F102-FR-036 | U1, U3, I2 | `foundAt` on `run.ended`; the synthesized `run.ended` of a dead launch; `integrity.noted` |

Sections changed: "Out of scope" (rows for 123 and 127, and for 144 and 145); "Closed sets" (the order of the refusals; a row for `foundAt`, asked of annex X §X.6 and of feature 111); "Clarifications", session 2026-09-30 (six answers); "Assumptions" (CQ-075, CQ-076 settled).

Asked of other features by this round: a row of annex X §X.6 for `foundAt` and its place in the `data` of `run.ended` (features 100 and 111); a wording patch of the constitution's precedence row for the continuing launch (the owner).
