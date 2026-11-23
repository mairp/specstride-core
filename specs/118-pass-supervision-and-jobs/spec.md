# Feature Specification: Pass supervision and detached jobs

**Feature Branch**: `118-pass-supervision-and-jobs` (a label: Spec Kit creates no branch in this repository; the directory is `specs/118-pass-supervision-and-jobs`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 118-pass-supervision-and-jobs of Specstride: supervision of one pass. The idle, disk-progress and repetition watchdogs with their kill reasons and classes; the hard cap per pass and per phase; how a pass is ended (polite stop, then terminate, then kill) and the kill note; the yield artifact, its predicates, the poll, the limit per phase attempt, the deadline and the refusals; detached jobs of a yield and their adoption by the next engine start; long jobs; the failure ledger of the baseline; fail-fast through the first-failure predicate."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority), `architecture.md`, `consolidation.md`, `feature-briefs.md` (brief 118), `STAGE-B-RULES.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182), feature 100 (annexes B, C, D, E, X), feature 141, and the research reports R18, R21, R21v, R23, R23v, R24, R26, R27, R2v and R15v.

## Vision and aims

A pass is one invocation of the proposer inside a phase attempt. Most of the lost time in the baseline runs was lost in passes that nobody supervised well: passes that hung, passes that repeated one command, passes that waited on a job for hours after that job had already failed. This feature supervises one pass, and the jobs a pass leaves behind.

| # | Aim |
|---|---|
| 1 | A pass that hangs, loops or stalls is ended, and the next pass is told why |
| 2 | A pass is ended politely first, so that the work it did and its session survive |
| 3 | A pass that has nothing to do but wait hands the wait to the runtime, with no model session open |
| 4 | A long job outlives a stop and is picked up by the next engine start |
| 5 | A long verification job that has already failed does not run to its end (aim 1 of the product: fail fast) |

Everything the baseline does here is reproduced under the `parity` profile. The three new behaviours (the polite stop, the adoption of jobs, the first-failure predicate) are switchable, and each is off under `parity`.

## Constraints

Owner-set constraints, from heading 11 of the brief.

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

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A stuck pass is ended and the next pass is told why (Priority: P1)

An operator runs a phase unattended. The proposer starts a pass that stops producing anything, or that runs one command over and over, or that runs past its time limit. The runtime ends the pass, leaves a note of what the pass was doing, and the next pass starts with that note in its prompt.

**Why this priority**: Without it one hung pass consumes the whole run. It is the behaviour of the baseline that every other behaviour of the pass loop rests on.

**Independent Test**: With stub proposers that hang, repeat a command, write nothing to disk and run forever (fixture families FX-20 and FX-21), under the `parity` profile every kill has the reason, the class and the exit status of the baseline, the kill note exists, and the next pass prompt carries the block that names it.

**Acceptance Scenarios**:

1. **Given** a pass whose process tree uses no CPU for 900 seconds, **When** the watchdog ticks, **Then** the pass is ended with the reason `idle_timeout` and the class `hang` (F118-FR-003).
2. **Given** a pass that has run for its ceiling, **When** the watchdog ticks, **Then** the pass is ended with the reason `hard_cap` and the class `budget`, whatever it wrote (F118-FR-006).
3. **Given** a pass that was ended by a watchdog, **When** the next pass starts, **Then** its prompt holds the block "Your previous pass was terminated by the harness, not by you" and the path of the kill note (F118-FR-010).
4. **Given** three passes in a row ended at the ceiling, **When** the third is ended, **Then** the pass loop ends with the result 10 (F118-FR-011).

---

### User Story 2 - A pass yields to a job and no session waits (Priority: P1)

A pass has started a long job (a build, an acceptance run) and has nothing else to do. It writes a yield artifact. The runtime starts or adopts the job, waits with no model session open, and starts the next pass when the job is done.

**Why this priority**: Yields are how the baseline spends hours of waiting without spending tokens. The parity oracle proves them (FX-22).

**Independent Test**: For each of the seven kinds of predicate, a stub job and a stub proposer that writes a yield artifact (FX-22, scenarios `predicate-<kind>`), then the limit, the deadline and the refusal: the exits, the events and the resume block equal the reference.

**Acceptance Scenarios**:

1. **Given** a yield artifact with a `file_exists` predicate, **When** the file appears, **Then** the wait ends, the next pass gets the block "The job you yielded on has ENDED" and the pass is given back (F118-FR-018, F118-FR-023, F118-FR-024).
2. **Given** a fifth yield in one phase attempt, **When** the artifact is read, **Then** it is deleted, no job is started, and the pass loop ends with the result 9 (F118-FR-021).
3. **Given** a yield artifact that breaks the schema, **When** it is read, **Then** it is refused once, deleted, and the pass is accounted as a pass with no evidence (F118-FR-016).

---

### User Story 3 - A failed long job stops early (Priority: P1)

A verification job that takes hours writes a failed line at minute 40. Today the runtime waits until hour 3. With the first-failure predicate the wait ends within a few polls, the runtime stops the job if it started it and the yield allowed that, and the next pass repairs at once.

**Why this priority**: It is aim 1 of the product. The baseline data show that 29.3 of 42.9 hours of acceptance-job time ran after the first failure (R21v).

**Independent Test**: The replay fixture and the synthetic fixture of experiment X2, with `verification.failfast` on and off. Recovered hours, and the count of waits that ended on a stale line, a skipped row or an expected failure.

**Acceptance Scenarios**:

1. **Given** a launched job and a yield with `first_failure` and `stop`, **When** a line that matches is appended after the job started and is still there on the next poll, **Then** the runtime signals the job's process group, the stop is an event, and the wait ends (F118-FR-038, F118-FR-039).
2. **Given** a failed line that was already in the file when the job started, **When** the predicate is polled, **Then** it never fires (F118-FR-038).
3. **Given** a job in `adopt` mode, **When** a failure line appears, **Then** the wait ends and the job is never signalled (F118-FR-039).
4. **Given** a stopped job, **When** the critic is called and cites its result file, **Then** the critic is told, without counts, that the file belongs to a stopped job (F118-FR-040).

---

### User Story 4 - A stop does not kill the job, and the next start adopts it (Priority: P2)

The operator stops the run while a job is running. The job survives. When the run is started again, the engine finds the job and goes on waiting for it.

**Why this priority**: A relaunch by the runtime root is a new engine start. Without adoption every relaunch would lose a job that took hours.

**Independent Test**: A stub job is started by a yield; the engine is stopped and started again; the job's process is alive, is listed as `adoptable`, and the wait continues with the remaining deadline.

**Acceptance Scenarios**:

1. **Given** a running detached job, **When** `stop` or `stop --now` ends the run, **Then** the job is alive (F118-FR-031).
2. **Given** a job whose entry no longer matches the process (pid reused), **When** the next engine start reads the registry, **Then** the job is treated as ended and nothing is signalled (F118-FR-031).

---

### User Story 5 - A killed pass is polite first (Priority: P2)

With the polite stop on, a pass that must be ended first gets an interrupt and a grace period. Only if it is still alive does it get a termination, and then a kill. Every step is recorded.

**Why this priority**: An interrupt lets the harness end its turn and record its session; a termination leaves both unfinished (R24 F-7).

**Independent Test**: A stub proposer that ends on the interrupt, one that ends only on the termination, and one that ignores both: the kill record shows the steps that were taken, in order, with the grace period applied.

**Acceptance Scenarios**:

1. **Given** `carry.polite_stop` on and a stub that ends on the interrupt, **When** a watchdog ends the pass, **Then** the kill record shows the interrupt, the grace period and that the interrupt ended the pass (F118-FR-009).
2. **Given** the `parity` profile, **When** a watchdog ends the pass, **Then** the pass gets a termination, waits 3 seconds, and gets a kill (F118-FR-008).

---

### Edge Cases

- A yield artifact written by a pass that a watchdog then killed is ignored and reported as invalid (F118-FR-017).
- A job launched by a yield that never reports a pid within 10 seconds: the yield is refused (F118-FR-019).
- An `adopt` yield whose pid shares the proposer's own process session: refused, because the job would die with the pass (F118-FR-019).
- A predicate that can never be satisfied (`command` not runnable): the wait ends as `timeout`, failing closed (F118-FR-018).
- A failure pattern that matches a line written after the job started, in a file that was then truncated or replaced: the predicate resets and does not fire on the old bytes (F118-FR-038).
- A stop request arrives during the wait: the wait ends first of all its checks, and the job is left running (F118-FR-020).
- The wall-clock budget is spent during a wait: the wait ends as `wall_budget` (F118-FR-022).
- A yield in the same pass as a checkpoint: the checkpoint is refused and the yield stands (F118-FR-043).
- A worker pass of a parallel group writes a yield artifact: refused (F118-FR-016).
- The macOS process walk gives a different process list than Linux: every statement about it is `unverified` (F118-FR-003).

## Requirements *(mandatory)*

Each requirement is in the written form of `STAGE-B-RULES.md` section 4. Options that this feature introduces are collected in the table "Rows of the `parity` profile" below.

### Functional Requirements

#### G1. Watchdogs, kill reasons, hard cap, kill note, polite stop

- **F118-FR-001**: Proposer passes MUST be bounded by three watchdogs: an idle watchdog (default 900 seconds), a disk-progress watchdog (default 1,800 seconds) and a repetition watchdog (default limit 12). The repetition limit MUST be 12, as in the code of the baseline; the 5 that the documentation of the baseline states is wrong (defect D-02, preserved as 12).
  - origin: 028 FR-017
  - disposition: ported
  - test: PT-118-028FR017-*
  - parity: not used (no switch; the defaults are those of the baseline)

- **F118-FR-002**: The watchdogs MUST run while the pass runs in the background of the pass loop, and MUST tick every 15 seconds by default. On each tick they MUST check, in this order: idle, process-level repetition, tool-level repetition, disk progress (every fourth tick only), hard cap. They MUST read only the stream records that arrived after the pass started. A pass MUST be a background process so that `stop --now` can end the tree of the in-flight pass through its entry in the process registry (annex B §B.10).
  - origin: C-058; B-0704; B-0706; B-0766
  - disposition: ported
  - test: PT-118-C-058-*
  - status: unverified (check: the process walk that lists a pass's tree on macOS, on a macOS runner that passes the oracle; verified-on: —; pin: —)

- **F118-FR-003**: The idle watchdog MUST sum the CPU time of the whole process tree of the pass and MUST end the pass only after the idle period in which that sum did not change, with the kill reason `idle_timeout`. The disk-progress watchdog MUST be checked every fourth tick; any file created or modified under the progress roots MUST reset its timer; after the progress period without a change it MUST end the pass with the kill reason `progress_stall`. The progress roots are the whole working directory unless the consumer names roots. A progress period of 0 MUST disable the disk-progress watchdog.
  - origin: C-058; B-0601; B-0603; B-0707; B-0711
  - disposition: ported
  - test: PT-118-C-058-*; PT-118-C-055-*
  - status: unverified (check: the CPU-time reading of a process tree on macOS; verified-on: —; pin: —)

- **F118-FR-004**: The process-level repetition check MUST sample every process of the pass tree on each tick (the command line cut to 400 characters), MUST count each distinct process id and command line once, and MUST end the pass with the kill reason `repeat_stall` when one key, made of the latest tool call and a command line, reaches the repeat limit. A process whose command basename is `sleep` MUST never be counted. A command line that matches the repeat-ignore expression MUST never be counted by this check; the default of that expression covers the test runners, linters, formatters and type checkers of the baseline (pytest and its distributed-run bootstrap, ruff, mypy, black, flake8, eslint, prettier, tsc, jest, vitest, `go test` and `go vet`, `cargo test`, `cargo clippy` and `cargo fmt`, `make test`, `make lint` and `make check`) and the batch tools tesseract, convert, magick, compare, ffmpeg, pdftotext and identify, the last group anchored on the command name. An explicitly empty expression MUST switch the default off, so that everything except `sleep` is counted. A repeat limit of 0 MUST disable both repetition checks.
  - origin: C-058; B-0602; B-0708; B-0709; B-0710; B-0669
  - disposition: ported
  - test: PT-118-C-058-*; PT-118-C-055-*

- **F118-FR-005**: The tool-level repetition check MUST count identical pairs of tool name and target among the tool records of this pass, and MUST end the pass with the kill reason `repeat_stall` only when the pair that reached the limit is also the most recent call. The signature of a target MUST be the tool name plus the length, the first 96 and the last 96 characters of the target of the newest tool record; with no tool record yet the key is the command line alone. It MUST never end a pass on an empty target. A call of `Edit`, `Write`, `MultiEdit` or `NotebookEdit` MUST never be the offender, but MUST stay in the sequence, so that moving on to editing counts as moving on.
  - origin: C-058; B-0700; B-0701; B-0702; B-0703
  - disposition: ported
  - test: PT-118-C-058-*
  - ep: EP-02 `specstride.harness/1` (consumes; the tool records are the normalized stream records of kind `tool`, annex C §C.5)

- **F118-FR-006**: A hard cap MUST end a pass once its elapsed wall time reaches the ceiling, whatever the pass wrote, with the kill reason `hard_cap`. It MUST be checked last on each tick. The ceiling of a phase MUST be resolved once per phase, in the order of annex X §X.2 of feature 100, which is the order of the baseline: an explicit per-phase setting (the per-phase flag or the per-phase environment variable of the baseline, key `phases.<N>.proposer.timeoutSec`); else the learned value, when the learning mode resolves to `apply` and the arm is `applied`; else the value declared by the verification-commands document for the phase, which is the default of the per-phase key (at the baseline the `phaseTimeouts` entry of the launch contract); else the role key `roles.proposer.timeoutSec` (default 1,800 seconds), whichever rank set it. The per-phase flag values MUST be applied after the per-phase environment variables into one map, so that the flag wins over the variable for the same phase and a later repeat of the flag wins over an earlier one. A per-phase value that is not `<digits>=<digits greater than 0>`, and a `phaseTimeouts` entry that is not a positive integer number of seconds, MUST end the launch with exit 3 and the message of the baseline.
  - origin: C-058; C-013; B-0017; B-0018; B-0109; B-0123; B-0236; B-0302; B-0604; B-0712
  - disposition: ported
  - test: PT-118-C-006-*; PT-118-C-009-*; PT-118-C-013-*; PT-118-C-055-*; PT-118-C-058-*
  - divergence: DV-025
  - assumption: CQ-158 (the declared value is the default of the per-phase key; the learned pass ceiling stands above it and under an explicit per-phase setting)

- **F118-FR-007**: The kill reasons and their classes MUST be the closed family `idle_timeout` (class `hang`), `repeat_stall` and `progress_stall` (class `futility`), and `hard_cap` (class `budget`), with the literals of the baseline. A reason outside the family MUST be classed `futility`. The closed set is row 10 of annex X §X.6, of which this feature is the owner.
  - origin: C-055; B-0606
  - disposition: ported
  - test: PT-118-C-055-*; PT-118-028FR017-*

- **F118-FR-008**: When a pass is ended and `carry.polite_stop` is off, the runtime MUST write the kill note first, then send a termination to the pass, wait 3 seconds, and send a kill. A signal MUST be sent only when the process id, the start time and the run token of the registry entry all match (annex B §B.10).
  - origin: C-058; B-0705
  - disposition: ported
  - test: PT-118-C-058-*
  - ep: EP-02 `specstride.harness/1` (consumes; `stop` with `terminate` and `kill`)

- **F118-FR-009**: With `carry.polite_stop` on (default) a pass MUST be ended in three steps through the operation `stop` of the harness port: `polite` (an interrupt in the form the harness adapter declares), a grace period, `terminate`, a grace period of 3 seconds, `kill`. The next step MUST be taken only if the pass is still alive after the grace period. Every step, the grace period applied and the step that ended the pass MUST be recorded in the kill record (the kill note and the event of the kill). The polite stop MUST apply to proposer passes only. Its effect on the session of the harness (that an interrupt ends the turn cleanly and records the session) is a documented fact of the harness and MUST be treated as unverified.
  - divergence: DV-093
  - parity: `carry.polite_stop` is off (row 11 of annex X §X.7)
  - test: CT-118-1
  - ep: EP-02 `specstride.harness/1` (consumes; `stop`)
  - status: unverified (check: one stub-free probe per tested harness adapter that records the interrupt ending the turn; verified-on: —; pin: documentation of the harness only)
  - assumption: CQ-054 (the default length of the first grace period, 10 seconds)

- **F118-FR-010**: Each watchdog kill MUST leave a kill note in the control plane (logical name `pass:<passId>:kill-note`) whose heading is `# Pass terminated by the specstride watchdog`, and MUST write to standard error the line `run_with_idle_watchdog: <message> -- killing pid <pid>.`. The next pass prompt MUST carry the block headed `## Your previous pass was terminated by the harness, not by you`, followed by `Reason: **<reason>** after <n>s.`, an optional line `What it caught:`, advice specific to the reason, and the path of the kill note. The block MUST be offered as a prompt block (EP-15) and, under the `parity` profile, MUST be byte-equal to the baseline's.
  - origin: C-057; B-0643; B-0644; B-0645
  - disposition: ported
  - test: PT-118-C-057-*
  - ep: EP-15 `specstride.prompt-block/1` (implements)

- **F118-FR-011**: Consecutive kills of passes at the hard cap MUST be counted apart from the error counter. When the count reaches the limit (default 3) the pass loop MUST end with the result 10 and the engine MUST record the stop reason `proposer_cap_exhausted` with the fields `iter`, `kill_reason` and `consec`, on both the legacy path and the structured path of the pass loop, with the log lines of the baseline. A `hard_cap` kill MUST neither increase nor reset the error counter. The breaker rule and the counters are those of feature 100 annex D and annex E §E.3; this feature ends the pass at the ceiling and reports the kill.
  - origin: C-010; C-055; C-009; C-012; B-0133; B-0149; B-0220; B-0613; B-2784; B-0788
  - disposition: ported
  - test: PT-118-C-009-*; PT-118-C-010-*; PT-118-C-012-*; PT-118-C-055-*; PT-118-C-058-*

- **F118-FR-012**: A pass that ends clean in under 180 seconds with no phase evidence and no yield MUST count as short; any other such pass MUST reset the short-pass counter to 0. When the counter reaches 2 the next prompt MUST carry the block headed `## You have ended <n> passes in a row within <sec>s without evidence`, which prints the yield artifact path and a sample `specstride-pass-yield/v1` document. Nothing MUST halt on it, and the counter MUST keep growing while passes stay short.
  - origin: C-057; C-058; B-0651; B-0779; B-0780
  - disposition: ported
  - test: PT-118-C-057-*; PT-118-C-058-*
  - divergence: DV-013
  - parity: the counter and the nudge as at the baseline (no switch)

- **F118-FR-013**: A pass that ends at a valid checkpoint MUST leave the short-pass counter, the error counter and the counter of consecutive hard-cap kills as they were, neither raised nor reset, as a yield does; the test of no progress still applies. The exact argument lists of the inner check set MUST be exempt from the process-level repetition count; the tool-level count MUST be unchanged. The engine, not the layer, MUST carry out both exemptions when a loop layer returns the directives `exemptShortPass` and `exemptRepeatCounter`. Neither can occur when the layer is off.
  - divergence: DV-013; DV-015
  - parity: not observable (the layer is off) (row 1 of annex X §X.7)
  - test: CT-118-2
  - ep: EP-04 `specstride.loop-layer/1` (consumes; `exemptShortPass`, `exemptRepeatCounter`, `giveIterationBack`)

- **F118-FR-014**: The settings of the watchdogs and of the ceilings MUST keep the flags and variables of the baseline as aliases of configuration keys, with the values and defaults of the baseline: the absolute pass ceiling (`--timeout`, `--proposer-timeout`, `SPECSTRIDE_PROPOSER_TIMEOUT`, default 1,800; per phase `--proposer-timeout-phase N=SECONDS` and `SPECSTRIDE_PROPOSER_TIMEOUT_PHASE_<N>`); the idle period (`--idle-timeout`, `SPECSTRIDE_PROPOSER_IDLE_TIMEOUT`, 900); the progress period (`--progress-timeout`, `SPECSTRIDE_PROPOSER_PROGRESS_TIMEOUT`, 1,800, 0 disables); the progress roots (`--progress-path`, repeatable, and `SPECSTRIDE_PROPOSER_PROGRESS_PATHS`, colon-separated; explicit flags win); the repeat limit (`--repeat-limit`, `SPECSTRIDE_PROPOSER_REPEAT_LIMIT`, 12, 0 disables both checks); the repeat-ignore expression (`SPECSTRIDE_PROPOSER_REPEAT_IGNORE`; an empty value differs from an unset one); the tick (`SPECSTRIDE_WATCHDOG_TICK`, 15); the limit of consecutive cap kills (`SPECSTRIDE_PROPOSER_MAX_CAPS`, 3); the short-pass period and nudge (`SPECSTRIDE_SHORT_PASS_SEC`, 180; `SPECSTRIDE_SHORT_PASS_NUDGE_AFTER`, 2, 0 disables); the yield directory (`--yield-dir`, and `YIELD_DIR` when the flag is absent; default the outbox of the feature). The pass loop is not a public command; its flags are internal parameters.
  - origin: C-051; B-0470; B-0471; B-0472; B-0473; B-0474; B-0475; B-0046; B-0058; B-0488; B-0489; B-0490; B-0491; B-0492; B-0506; B-0507; B-0521; B-0538; B-0540; B-0541
  - disposition: translated
  - test: PT-118-C-051-*; PT-118-C-052-*; PT-118-C-007-*
  - divergence: DV-027; DV-015; DV-013
  - parity: the as-is names and defaults (alias table of annex X §X.8)

#### G2. Yield artifact, predicates, poll, limit, deadline, refusals

- **F118-FR-015**: A proposer pass MAY end cleanly by writing a yield artifact of the schema `specstride-pass-yield/v1`. The poll interval MUST be 30 seconds by default and MUST be resolved once per phase: an operator-set value first (source `override`), else a learned `yield_poll_interval` under `apply` (source `learned`), else the default (source `default`). The number of yields per phase attempt MUST be capped at 4 by default; 0 disables the cap. The `command` predicate MUST be off unless the consumer allows it.
  - origin: 028 FR-019; B-0304
  - disposition: ported
  - test: PT-118-028FR019-*; PT-118-C-013-*
  - divergence: DV-051

- **F118-FR-016**: The yield artifact MUST hold the fields of feature 100 annex D §D.6 and MUST be read as a claim. It MUST be refused when: `contract` is not `specstride-pass-yield/v1`; `reason` is not a non-empty text; `deadline_sec` is missing, is not a positive integer, or is a boolean; `on_resume` is present and is not a text; `job.mode` is not `launch` or `adopt`; `job.argv` (mode `launch`) is not a non-empty list of non-empty texts without newlines or NUL characters; `job.pid` (mode `adopt`) is not a positive integer; `job.cwd` is not an existing directory (it defaults to the working directory and is resolved against it); `resume_when.kind` is outside the closed set of row 69 of annex X §X.6; `resume_when.path` is missing for the kinds `file_exists`, `file_stable`, `grep` and `first_failure`; `resume_when.pattern` is missing or is not a valid regular expression for `grep` and `first_failure`; the kind is `command` and the consumer has not allowed it, or its `argv` is not a non-empty list of non-empty texts; `on_first_failure` is missing for `first_failure` or is outside `stop` and `continue-and-notify`. `job.log` is optional and defaults to the log of the job in the control plane. An artifact that is refused MUST be reported once, deleted, and the pass MUST be accounted exactly as a pass that wrote no evidence. An artifact from a pass of a parallel group MUST be refused (F100-FR-133).
  - origin: C-058; B-0713; B-0714; B-0715; B-0716; B-0717; B-0718; B-0719; B-0720; B-0721; B-0722; B-0723; B-0730; B-0731
  - disposition: ported
  - test: PT-118-C-058-*; PT-118-028FR019-*
  - ep: EP-04 `specstride.loop-layer/1` (consumes; the layer never yields for a worker)

- **F118-FR-017**: The yield artifact MUST be deleted before every pass and MUST be read only after the pass process has exited, so that only an artifact written by the pass that just ended is acted on. A yield written by a pass that a watchdog killed MUST be ignored and reported as invalid with the reason `the pass was killed by the watchdog (<reason>)`, and the kill MUST be accounted normally. The feature directory MUST be derived from the location of the phase evidence, so that the paths of yields, kill notes and the failure ledger follow the evidence and not the `--feature` argument.
  - origin: C-058; B-0674; B-0770; B-0771
  - disposition: ported
  - test: PT-118-C-058-*

- **F118-FR-018**: The kinds of `resume_when` MUST be `pid`, `exit_code_file`, `file_exists`, `file_stable`, `grep`, `command` and `first_failure`. A predicate MUST return 0 (satisfied), 1 (not yet) or 2 (unsatisfiable); an unsatisfiable predicate MUST end the wait with the outcome `timeout` (fail closed). `pid`: satisfied when the target process (`resume_when.pid`, else the launched or adopted job) is no longer alive. `exit_code_file`: satisfied when `resume_when.path` (default the job's own exit-code file) exists. `file_exists`: satisfied when the resolved path exists. `file_stable`: satisfied when the modification time of the file is at least `resume_when.stable_sec` seconds old (default 60, a positive integer); a missing file is not yet stable. `grep`: satisfied when the pattern matches within the last 4 MiB of the file; a missing file is not yet satisfied. `command`: runs the fixed argument list in the job's working directory with no shell, its output discarded, with a 120-second time limit; exit 0 satisfies; a command that cannot be run is unsatisfiable. The kind `first_failure` is specified in F118-FR-038.
  - origin: C-058; B-0724; B-0725; B-0726; B-0727; B-0728; B-0729; B-0736
  - disposition: ported
  - test: PT-118-C-058-*; PT-118-028FR019-*
  - status: unverified (check: the modification-time and process-liveness readings on macOS; verified-on: —; pin: —)

- **F118-FR-019**: In mode `launch` the runtime MUST start the job with the fixed argument list and no shell, in a process session of its own that is not the pass's, so that no kill of the pass reaches it. A wrapper MUST record the job's process id and, when it ends, its exit code, each written atomically. The runtime MUST wait up to 10 seconds (100 checks at 0.1 second) for the process id; without one the yield MUST be refused with `the launched job never reported a pid`. In mode `adopt` the yield MUST be refused when the process is not running or when it shares the process session of the proposer, because it would die with the pass.
  - origin: C-058; B-0732; B-0733; B-0734
  - disposition: ported
  - test: PT-118-C-058-*
  - status: unverified (check: that a job in a process session of its own survives the end of the pass on macOS and under each tested harness's containment; verified-on: —; pin: R15v open question 2)

- **F118-FR-020**: While it waits, the runtime MUST check on every tick, in this order: the stop request, the predicate, the deadline of the yield, the wall-clock budget of the run; and then sleep for the poll interval. The outcomes MUST be `satisfied`, `timeout`, `stop` and `wall_budget`. A stop request during the wait MUST end the run with the stop reason `stop_flag` with the fields `iter`, `yield=true`, `job_pid` and `job_log`, and the job MUST be left running. A deadline MUST give the reason `deadline` in the event `yield_timeout`, and a spent budget the reason `wall_budget`; each MUST end the run with the stop reason `proposer_yield_timeout` (field `iter`), which the engine records as `proposer_yield_budget` (annex E §E.3).
  - origin: C-058; C-055; B-0605; B-0608; B-0609; B-0610; B-0611; B-0735
  - disposition: ported
  - test: PT-118-C-058-*; PT-118-C-055-*
  - ep: EP-04 `specstride.loop-layer/1` (consumes; call order after a pass)

- **F118-FR-021**: When a phase attempt yields for the fifth time (the limit, default 4), the pass loop MUST delete the artifact, start no job, log the line of the baseline, write `run_stop reason=proposer_yield_budget` with the fields `iter`, `yields` and `max`, and end with the result 9, which the engine maps to exit 4. The yield counter MUST be per proposer invocation, MUST never be reset inside it, and MUST advance only on an accepted or over-budget yield. It MUST continue across a resume and a relaunch (F100-FR-069). The stop line for the same reason at phase level MUST carry the field `phase` and MUST print the guidance that names the directory of the yield jobs and `--proposer-timeout-phase`.
  - origin: C-055; C-010; C-009; C-058; B-0132; B-0148; B-0607; B-0772
  - disposition: ported
  - test: PT-118-C-055-*; PT-118-C-010-*; PT-118-C-009-*; PT-118-C-058-*

- **F118-FR-022**: When the deadline of a yield expires, or the predicate is unsatisfiable, or the wall-clock budget of the run is spent during a wait, the pass loop MUST end with the result 9 and the job MUST be left running, as at the baseline. The wall-clock check MUST use the run's start time and the budget of the run (`SPECSTRIDE_MAX_WALL_MIN`, whole minutes above 0); when no budget or no start time is known the check MUST be skipped. A job that the first-failure predicate stopped (F118-FR-039) is the one exception to "left running".
  - origin: C-054; B-0590; B-0591
  - disposition: translated
  - test: PT-118-C-054-*
  - divergence: DV-051
  - parity: `verification.failfast` is off (row 4 of annex X §X.7)

- **F118-FR-023**: When the predicate is satisfied the next pass MUST get one resume block, headed `## The job you yielded on has ENDED — resume from its result`, with the yield reason, the seconds waited, the log path, the job's exit code, the pass's own `on_resume` text on one line, and a slice of the job log: the whole log when it has at most as many lines as head plus tail (default 40 plus 80), else the head, the tail and the marker `[<n> lines elided from the middle ...]`. The exit code MUST come from the job's exit-code file; for an adopted job, or when the file is missing, it MUST be `unknown`. The resume block and the short-pass nudge MUST each be consumed by exactly one pass and MUST be cleared right after they were appended. The block MUST be a prompt block (EP-15); under the `parity` profile it MUST be byte-equal to the baseline's.
  - origin: C-057; C-058; B-0648; B-0717; B-0737; B-0765; B-0773
  - disposition: ported
  - test: PT-118-C-057-*; PT-118-C-058-*
  - ep: EP-15 `specstride.prompt-block/1` (implements)

- **F118-FR-024**: A yielded pass MUST be exempt from the no-progress breaker and MUST leave the error counter untouched. A satisfied yield MUST spend no pass of the pass limit by default (the pass is given back: the pass count is decremented, so a yield and its resume are one logical pass); with the setting `SPECSTRIDE_YIELD_COUNTS_AS_ITER` (key `loop.yield.countsAsIter`) at `true` the pass MUST be spent. After a satisfied yield the next pass MUST start at once, without the inter-pass sleep. A refused `adopt` MUST give the yield index back and the pass MUST be accounted as an ordinary pass with no evidence, to which the breakers and the short-pass counter apply.
  - origin: C-058; B-0774; B-0775; B-0776; B-0777
  - disposition: ported
  - test: PT-118-C-058-*
  - divergence: DV-014

- **F118-FR-025**: The settings of the yield MUST keep the variables of the baseline as aliases of the keys `loop.yield.*` (alias table of annex X §X.8 of feature 100; the keys and the variables are those of the table "Options, switches and configuration keys" below), with their values and defaults: the poll (`SPECSTRIDE_YIELD_POLL`, 30; when it is set at all, by set-ness and not value, it is an operator override with the source `override`; it is passed to one pass loop as a prefix of one command and is not exported, so that it never reads as an operator override at the next phase); the cap (`SPECSTRIDE_YIELD_MAX_PER_ATTEMPT`, 4); the `command` allowance (`SPECSTRIDE_YIELD_ALLOW_COMMAND`, `false`, which must be exactly `true` to allow); the counting of a satisfied yield against the pass limit (`SPECSTRIDE_YIELD_COUNTS_AS_ITER`, `false`); the emission of the wait event every N ticks (`SPECSTRIDE_YIELD_WAIT_EVERY`, key `loop.yield.waitEvery`, 10, 0 disables); the head and the tail of the log slice (`SPECSTRIDE_YIELD_LOG_HEAD`, key `loop.yield.logHead`, 40; `SPECSTRIDE_YIELD_LOG_TAIL`, key `loop.yield.logTail`, 80); the failure-ledger section (`SPECSTRIDE_FAILURE_LEDGER`, key `loop.yield.failureLedger`, `true`; `SPECSTRIDE_FAILURE_LEDGER_MAX`, key `loop.yield.failureLedgerMax`, 150; the pattern of F118-FR-036, `SPECSTRIDE_FAILURE_PATTERN`, key `loop.yield.failurePattern`); the wall-clock budget and the start time of the run for the wait (`SPECSTRIDE_MAX_WALL_MIN`, `SPECSTRIDE_RUN_START_EPOCH`, which the engine reads from its run record and no longer takes from the environment).
  - origin: C-052; C-007; B-0078; B-0080; B-0523; B-0524; B-0525; B-0526; B-0527; B-0528; B-0529; B-0530; B-0531; B-0532; B-0533
  - disposition: translated
  - test: PT-118-C-052-*; PT-118-C-007-*
  - divergence: DV-027
  - parity: the as-is names and defaults (alias table of annex X §X.8)

- **F118-FR-026**: The files of pass supervision MUST live in the control plane under logical names, with the content of the baseline: the yield artifact (written to `feature:<slug>:outbox`, moved to `job:<jobId>:yield` when read; as-is path `<feature-dir>/yield/phase<N>-attempt<M>-<run-id>.json`, told to the pass and deleted before every pass); the job's log, process id and exit code (`job:<jobId>:log`, as-is `yield-jobs/phase<P>-attempt<A>-<run-id>-yield<k>.{pid,rc,log}`); the kill note (`pass:<passId>:kill-note`, as-is `pass-checkpoints/<run-id>-phase<P>-attempt<A>-pass<i>-<time>.md`, with run, phase, attempt, pass, reason, elapsed, an optional detail, the last 25 tool calls and the last 5 text blocks of 600 characters each); the two sidecars of the last kill (the path of the note; one line `<reason>|<elapsed>|<detail>`), both removed at the start of the next pass after their content entered the prompt; the failure ledger (`feature:<slug>:failure-ledger`, an append-only file of JSON lines shared by all jobs of the feature); the entry of the pass in flight (the registry entry of kind `harness-pass`, replacing `proposer.pid`, written after the pass starts and removed when it ends and on exit). Run identifiers in file names keep the collision rule of the baseline (DV-011).
  - origin: C-056; C-011; B-0177; B-0620; B-0628; B-0629; B-0630; B-0631; B-0632; B-0638
  - disposition: translated
  - test: PT-118-C-056-*; PT-118-C-011-*
  - divergence: DV-006; DV-011
  - parity: compared by logical name through the layout table (N-02)

- **F118-FR-027**: The pass loop MUST emit, with the fields of the baseline, the events `proposer_cap` (`phase`, `attempt`, `role`, `seconds`, `source`, `arm`, `yield_poll`, `yield_poll_source`, `yield_poll_arm`, `tamper_bracket`), `pass_killed` (`iter`, `reason`, `class`, `elapsed`, `detail`, `checkpoint`), `yield_invalid` (`iter`, `reason`, `artifact`, and `log` for a launched job that never reported a pid), `yield_job_start` (`iter`, `mode`, `pid`, `log`, `sid`, and `argv` for launch), `yield_wait` (`iter`, `elapsed`, `predicate_kind`, `yield_index`), `pass_yield` (`iter`, `reason`, `predicate_kind`, `deadline_sec`, `job_mode`, `job_log`, `yield_index`), `yield_resume` (`iter`, `waited_sec`, `job_rc`, `job_duration_sec`, `yield_index`, `predicate_kind`), `yield_timeout` (`iter`, `reason`, `waited_sec`, `deadline_sec`, `predicate_kind`, `job_log`), `iter_short_pass` (`iter`, `elapsed`, `consec`), `iter_cap` (`iter`, `reason`, `elapsed`, `consec`, `max`) and `pass_cost_unknown` (`iter`, `reason`, `elapsed`, emitted for a hard-cap kill because the severed stream reports no usage). Each has a row in the compatibility projection (F100-FR-199); the primary event types and their fields are those of the catalogue that feature 100 annex X §X.1 assigns to the event schema, and this feature adds none by itself apart from those of F118-FR-042.
  - origin: C-053; C-008; B-0096; B-0543; B-0544; B-0545; B-0546; B-0554; B-0555; B-0556; B-0558; B-0559; B-0560
  - disposition: translated
  - test: PT-118-C-053-*; PT-118-C-008-*
  - divergence: DV-007
  - parity: compared in the compatibility projection (row 17 of annex X §X.7)

- **F118-FR-028**: The results and statuses of pass supervision MUST keep the values of the baseline as fields of the result record of the pass loop (annex E §E.4): the status 124 of a pass for every kill by a watchdog (the convention of `timeout`, kept in the pass's record and not the exit of a process); the result 9 when the attempt yields more than the cap allows (the artifact is deleted and no job is started); the result 10 when the consecutive count of cap kills reaches its limit. The results 9 and 10 map to engine exit 4.
  - origin: C-054; B-0576; B-0588; B-0593
  - disposition: translated
  - test: PT-118-C-054-*
  - divergence: DV-066

- **F118-FR-029**: The log lines of the baseline that carry no implementation name MUST be written byte for byte, in the compatibility output and under the `parity` profile: `      pass ceiling: <s>s (<source>); yield poll: <s>s (<source>)`; `>>> proposer's yield budget is spent for phase <N> — halting (exit 4).` with its guidance naming the directory of the yield jobs and `--proposer-timeout-phase`; `>>> proposer hit the pass ceiling repeatedly for phase <N> — halting (exit 4).` with its guidance that prefers a long job or a phase split over a higher ceiling; and the two long-job lines of F118-FR-035.
  - origin: C-012; C-021; B-0213; B-0219; B-0358
  - disposition: ported
  - test: PT-118-C-012-*; PT-118-C-021-*
  - parity: no new line is printed under `parity` (owner ruling 68)

- **F118-FR-030**: The lines of the baseline that begin with the name of an implementation file MUST be written with the logical component name in that place and the rest of the text equal (rule N-15): the refusal of a yield (`refusing the pass yield — <detail>`; `refusing the adopt yield — pid <n> is in this pass's own session (<sid>); ... Start it with setsid, or use mode 'launch'.`); the watchdog line (`pass <i> was terminated by the watchdog (<reason>, class <class>); its checkpoint is carried into the next pass.`); the yield lines (`this attempt has already yielded <n> times — aborting (exit 9). ...`; `pass <i> yielded — <reason>. Waiting on '<kind>' with NO model session open (deadline <n>s).`); the short-pass line (`pass <i> ended after <n>s with no evidence and no yield — <k> short passes in a row; the next pass is told to yield instead of waiting.`); and the ceiling lines (`pass <i> hit the pass ceiling (<reason>, <n>s) — consecutive cap kills: <k>/<max>`; `<n> consecutive passes hit the pass ceiling — aborting (exit 10). ... do NOT just raise the cap. Declare the long step as a yield, or pre-stage it as a verification command, or split the phase.`).
  - origin: C-057; B-0646; B-0647; B-0655; B-0656; B-0657; B-0660; B-0661; B-0662
  - disposition: translated
  - test: PT-118-C-057-*
  - divergence: DV-066
  - parity: compared through rule N-15

#### G3. Detached jobs, adoption, long jobs

- **F118-FR-031**: The detached job of an accepted yield MUST be entered in the process registry (`specstride.procs/1`) with the class `adoptable` and the kind `detached-job`, with its process id, process group, process session, start time and run-token hash. A stop, `stop --now` and the end of the engine MUST leave it alive; only `stop --jobs`, an explicit request, ends it (F100-FR-064). The next engine start MUST read the registry and the job's record, and for each `adoptable` entry whose process id, start time and run token all match MUST continue the wait with the same predicate and the remaining deadline of the yield; an entry that does not match MUST be treated as ended and MUST never be signalled. The wait after an adoption MUST start a new pass, with a fresh session, when it ends (owner ruling 55). Whether today's kill of a pass reaches a job in its own process session is `unverified`; the intended behaviour, that the job survives, is what this requirement fixes.
  - divergence: DV-098
  - parity: not observable unless a fixture resumes after a stop inside a wait (no switch and no row of annex X §X.7; register row DV-098)
  - test: CT-118-3
  - ep: EP-13 `specstride.lock/1` (consumes; an `adoptable` process never makes the probe report `owner-dead-group-alive`)
  - status: unverified (check: the spike of feature 122 for detach survival, and a macOS runner; verified-on: —; pin: R15v C-6). Outcome of the spike of feature 122, confirmed 2026-10-04 before this requirement freezes: `unverified` — that spike was not run (two of its tasks are paid and were skipped; see docs/ecosystem/PROGRESS.md, entry 122-detached-runtime), so detach survival inside a host session stays `unverified` with the check above. The Linux half of the question, whether the kill of a pass reaches a job in its own process session, is now measured: verified-on 2026-10-04 on Linux (no kill path of the baseline `9cab15d` reaches such a job — the watchdog's single-pid TERM/KILL, the `timeout` process-group tree kill, and an explicit `kill -- -PGID` were all applied; `tests/characterization/118/spike-tree-kill.md`, T001 of this feature). macOS remains `unverified` (no runner).

- **F118-FR-032**: A long job MUST be managed only for the phase equal to the long-job phase and only when the long-job command is not empty (`--long-job-phase N`, `--long-job-cmd CMD`). Before every attempt the runtime MUST ensure the long job and then run the prestage step, in that order, before the prompt is built; the long-job status block MUST be recomputed and the job ensured again before every pass and not once per invocation. A job with an ended marker for this run's attempt MUST never be touched or relaunched. If a pid file of another run for the same phase and attempt names a live process, no second instance MUST be launched, and the log of that run MUST be the one the prompt points to. If this run's pid file exists but the process is gone, the job MUST be marked ended (an empty ended marker) and MUST never be restarted within the attempt; a new attempt or a new run MUST launch a fresh instance. An owned long job MUST be started in the given working directory, in a process session of its own, with standard input from the null device and standard output and error truncating its log, and its process id written to its pid file.
  - origin: C-006; C-013; C-022; B-0032; B-0033; B-0312; B-0763; B-0368; B-0369; B-0370; B-0371; B-0373
  - disposition: ported
  - test: PT-118-C-006-*; PT-118-C-013-*; PT-118-C-022-*; PT-118-FX16-long-job
  - status: unverified (check: the detach and the process session of a long job on macOS; verified-on: —; pin: —)
  - assumption: CQ-055 (a long job is registered as `adoptable`, like the job of a yield, so that a stop leaves it alive as at the baseline)

- **F118-FR-033**: While a long job runs or after it has ended, the prompt MUST carry a block headed `## Long-running verification job: DONE`, `STILL RUNNING (~<s>s so far)` or `launching now`, which tells the agent not to re-run or wait on the job and to end the pass without evidence while it runs. The block MUST be a prompt block (EP-15) and, under the `parity` profile, byte-equal to the baseline's.
  - origin: C-022; B-0374
  - disposition: ported
  - test: PT-118-C-022-*
  - ep: EP-15 `specstride.prompt-block/1` (implements)

- **F118-FR-034**: The settings of a long job MUST keep their as-is names as aliases: `SPECSTRIDE_LONG_JOB_PHASE` and `SPECSTRIDE_LONG_JOB_CMD` (default empty; flags win), exported without a prefix as `LONG_JOB_PHASE` and `LONG_JOB_CMD` so that the pass loop can ensure the job from its own loop; `SPECSTRIDE_LONG_JOB_LOG` with the log path of the long job, or of the still-live job of an earlier run, so that the prompt can point the agent at it. The state of a long job MUST be per attempt and per run (as-is `long-jobs/phase<N>-attempt<M>-<run-id>.{pid,log,done}`, logical name `job:<jobId>:record` and `job:<jobId>:log`), because attempt numbers restarted at 1 in every run at the baseline. The launching process MUST NOT let the long job hold the workspace lock or the lease after the runtime has ended: the job is never a child that the lock provider counts (F100-FR-064).
  - origin: C-007; C-018; C-020; B-0055; B-0056; B-0057; B-0348; B-0353; B-0372
  - disposition: translated
  - test: PT-118-C-007-*; PT-118-C-018-*; PT-118-C-020-*; PT-118-C-022-*
  - divergence: DV-027; DV-006; DV-011; DV-022
  - parity: the as-is names (alias table of annex X §X.8)

- **F118-FR-035**: The runtime MUST emit the events `long_job_start` (`phase`, `attempt`, `cmd`, `log`) and `long_job_ended` (`phase`, `attempt`, `log`), each with a row in the compatibility projection, and MUST write the lines `>>> long-job(phase <N> attempt <M>): launching detached — <cmd>` and `>>> long-job(phase <N> attempt <M>): process <pid> no longer running — treating as ended, NOT auto-restarting. See <log>`.
  - origin: C-019; B-0349; B-0350
  - disposition: translated
  - test: PT-118-C-019-*
  - divergence: DV-007
  - parity: compared in the compatibility projection (row 17 of annex X §X.7)

- **F118-FR-036**: The failure ledger of the baseline (a list of failure signatures of the jobs of a feature, not the ledger of feature 100) MUST be produced by an internal component with the parameters log file, ledger file, job key, `--max` (default 150) and `--pattern`; it MUST print a Markdown section for the resume prompt. The pattern MUST be overridden by `SPECSTRIDE_FAILURE_PATTERN` (key `loop.yield.failurePattern`) when the parameter is absent; an empty value MUST read as unset, as at the baseline. The three variables `SPECSTRIDE_FAILURE_LEDGER`, `SPECSTRIDE_FAILURE_LEDGER_MAX` and `SPECSTRIDE_FAILURE_PATTERN` are aliases of keys (F118-FR-025). The component MUST always end with the status 0: any exception MUST print nothing and never break the resume prompt. Its file MUST hold one line `{"kind":"job","job","ts","log","failures"}` per job and one line `{"kind":"failure","job","sig"}` per distinct signature; a job that is already in the ledger MUST NOT be appended again. The job key MUST be `<run-id>:attempt<A>:yield<k>`, and the section MUST be produced only when the job's log exists and the ledger setting is exactly `true`.
  - origin: C-044; C-045; C-046; C-047; B-0451; B-0452; B-0453; B-0454; B-0738; B-0739
  - disposition: translated
  - test: PT-118-C-044-*; PT-118-C-045-*; PT-118-C-046-*; PT-118-C-047-*
  - divergence: DV-066; DV-027; DV-006
  - parity: the as-is names; the file compared by logical name (N-02)

- **F118-FR-037**: The section of the failure ledger MUST have the heading `### Every failure the job reported (<n> distinct, <m> matching lines in the whole log)`. Each failure MUST be listed as `- [NEW] <example>` or `- [RECURRING <k>/<n> earlier jobs] (x<count>) <example>`, recurring failures first. The default pattern MUST match `FAIL`, `FAILED`, `FAILURE` and `ERROR` as whole words, `Traceback (most recent`, `RC=<non-zero>` and `exit [code] <non-zero>`. A signature MUST strip timestamps, hexadecimal identifiers of 12 or more characters, UUIDs and numbers, collapse white space, and be cut to 300 characters; the example line MUST be cut to 240. The whole log MUST be scanned and not only the slice shown in the prompt, and failures MUST be deduplicated by signature with a repeat count. With no failure in the log the section MUST read `None: no line of the log matched the failure pattern.` and MUST be printed only when earlier jobs exist; otherwise nothing is printed. At most `--max` failures MUST be listed; the rest MUST be summarised as `- ... <n> more distinct failure(s) not shown; grep the log for the rest`.
  - origin: C-048; C-049; B-0455; B-0456; B-0457; B-0458; B-0459; B-0460; B-0461
  - disposition: ported
  - test: PT-118-C-048-*; PT-118-C-049-*

#### G4. Fail-fast: the first-failure predicate

- **F118-FR-038**: A yield MAY declare `resume_when` of the kind `first_failure` with a path and a pattern, and `on_first_failure` as `stop` or `continue-and-notify`. The predicate MUST read only whole lines (ended by a line break) that were appended to the same file after the job started, and MUST be satisfied only when the match is still present at two successive polls. A file that is truncated or replaced (its identity changes) MUST reset the predicate to the bytes after the change. A failed line that was in the file before the job started, an incomplete last line, and a line that the declared pattern does not match MUST never satisfy it. The content of a matched line is a claim; the runtime MUST NOT read it as the result of a check.
  - divergence: DV-051
  - parity: `verification.failfast` is off (row 4 of annex X §X.7)
  - test: CT-118-4
  - assumption: CQ-056 (the yield schema has no way to exclude expected failures and skipped rows other than the pattern)

- **F118-FR-039**: When the predicate is satisfied the wait MUST end. The runtime MUST stop the job only if it launched the job (mode `launch`) and the yield declared `on_first_failure` as `stop`; it MUST never stop a job in mode `adopt`, and MUST never stop a job when the action is `continue-and-notify`. The stop MUST be a signal to the process group of the job, with a grace period (default 10 seconds) between the termination and the kill, and MUST be sent only when the process id, the start time and the run token of the registry entry all match. In every other case the job MUST run on, and the resume block MUST say that the job is still running. The stop and its outcome MUST be an event. The default of `on_first_failure`, when a `first_failure` yield does not say, MUST be `stop`.
  - divergence: DV-051
  - parity: `verification.failfast` is off (row 4); `verification.failfast_action` is not used (row 5 of annex X §X.7)
  - test: CT-118-5
  - ep: EP-02 `specstride.harness/1` (consumes; the process-group signal is the runtime's own and not the harness's)
  - assumption: CQ-058 (the grace period of a job stop, 10 seconds, as a key of its own)

- **F118-FR-040**: What a result file of a job says MUST be a claim and never a check result. When a phase attempt holds a job that the runtime stopped, the fact block for the critic MUST hold, in `facts`, the member "a cited result file that belongs to a stopped job", by kind and without counts; the runtime MUST NOT tell the critic which line, which step or how many. Grounding MUST NOT change the state of a check because of what a result file says.
  - divergence: DV-051
  - parity: not observable (`verification.failfast` is off) (row 4 of annex X §X.7)
  - test: CT-118-6
  - status: unverified (check: experiment X2 on the replay fixture shows that a stitched result file is cited only with the fact present; verified-on: —; pin: R23v V-17)

- **F118-FR-041**: The first-failure predicate MUST be its own switch, `verification.failfast`, on by default, and MUST be off under the `parity` profile; nothing MUST ride on the switch of a loop layer. `verification.failfast_action` MUST be `stop` by default; `continue-and-notify` as the default is an option that is off. With `verification.failfast` off a yield of the kind `first_failure` MUST be refused with the reason `first-failure-off`, and the job MUST be left running as at the baseline.
  - divergence: DV-051
  - parity: off (rows 4, 5 of annex X §X.7)
  - test: CT-118-7

- **F118-FR-042**: The runtime MUST emit the events `job.started`, `job.step` (timestamped per step or cycle of a job that reports steps), `job.first_failure` (with the step), `job.ended` (with `msAfterFirstFailure`) and `resource.wait` (with `resource`, `holder` and `ms`) in the envelope `specstride.event/1`. A job MAY declare an exclusive `resource` that it needs; when a check or a job waits on a declared resource, `resource.wait` MUST be emitted. The doctor MUST be told which resources a job declared, so that it can name the ones it cannot check.
  - divergence: DV-007
  - parity: `job.*` and `resource.wait` project to nothing (F100-FR-199); off with `verification.failfast`
  - test: CT-118-8
  - assumption: CQ-057 (the yield schema of annex D §D.6 has no field `resource`; the narrowest reading is an optional `job.resource` of a minor of the schema)

- **F118-FR-043**: A yield artifact written in the same pass as a checkpoint MUST refuse the checkpoint: the engine MUST act on the yield, MUST leave the unit of work undeclared, and MUST record the refusal. No layer MUST be able to accept a checkpoint that was written beside a yield.
  - divergence: DV-012
  - parity: not observable (the layer is off) (row 1 of annex X §X.7)
  - test: CT-118-9
  - ep: EP-04 `specstride.loop-layer/1` (consumes; the return `refuse` of `afterPass`)

#### G5. Text from outside the runtime (added 2026-09-30)

- **F118-FR-044**: Every text that this feature takes from outside the runtime MUST enter through the one ingress of feature 100 (F100-FR-009), where the redactor of annex X §X.4 redacts it and cuts it to a size cap (F100-FR-205), before this feature writes it to a sink or to a prompt. No code of this feature MUST redact by itself, and none MUST write the unredacted form. The texts are: the detail of a kill and the line "What it caught" (a command line of the pass tree, or the tool name and target of a tool record), in the kill note, in the line on standard error, in the sidecar of the last kill, in the field `detail` of the event `pass_killed` and in the previous-pass block; the last 25 tool calls and the last 5 text blocks of the kill note; the fields `reason` and `on_resume` and the argument list `job.argv` of a yield artifact, in the events `pass_yield`, `yield_job_start` and `job.started`, in the log lines and in the resume block; the command of a long job, in the field `cmd` of `long_job_start` and in the line that launches it; the slice of a job log in the resume block; the example lines and the signatures of the failure ledger, in its file and in its section; the step of `job.first_failure`. The ingress class MUST be a member of closed set row 89 of annex X §X.6: `tool-arguments` for a command line and an argument list, `stream-text` for a text block of the pass, `check-output` for the log of a job and what is taken from it, `free-text` for the other texts. When the redactor cannot run the text MUST be dropped and the record MUST say so (F100-FR-205); the kill, the wait and the resume MUST go on without it. Under the `parity` profile the oracle compares these texts after the same redaction on both sides (annex X §X.8), so that the byte-equality of F118-FR-010, F118-FR-023 and F118-FR-033 holds on the fixtures, which hold no secret.
  - parity: not observable on the fixtures, which hold no secret; no switch
  - test: CT-118-10

### Key Entities

- **Pass**: one invocation of the proposer in a phase attempt, with a handle in the process registry. Ended by the pass itself, by a watchdog, or by a stop.
- **Watchdog**: a check made every tick while a pass runs. Four checks (idle, repetition at process level and at tool level, disk progress) and the hard cap.
- **Kill reason and class**: one of `idle_timeout`, `repeat_stall`, `progress_stall`, `hard_cap`, with the class `hang`, `futility` or `budget`.
- **Kill note**: the file a killed pass leaves in the control plane. Carried into the next prompt once.
- **Kill record**: the kill note together with the event of the kill; it holds the steps taken to end the pass.
- **Yield artifact**: the claim of a pass that it has nothing to do until a predicate holds. Schema `specstride-pass-yield/v1`.
- **Predicate**: one of seven kinds that says when the wait ends.
- **Detached job**: a process the engine waits on while no session is open. In the registry as `adoptable`.
- **Long job**: a detached job named by the consumer for one phase, launched before each attempt.
- **Failure ledger of the baseline**: the append-only list of failure signatures of all jobs of a feature.
- **Stopped job**: a job the runtime ended by the first-failure predicate.

### Options, switches and configuration keys

Feature 110 owns the spelling of every key, in its key table (its §K.5 and `contracts/config-keys.tsv`) and its alias table (§K.8). Every key of the table below is in the key table of feature 110, except the six of the row "Yield settings, read by the baseline and not yet listed". An unknown key refuses the launch (F100-FR-203), so these six must be listed before the code is written; they are reported to features 100 and 110 with the evidence (see "Repairs after the cross-feature review").

| Option | Key | Default | Under `parity` | Row of annex X §X.7 | Register row |
|---|---|---|---|---|---|
| First-failure predicate | `verification.failfast` | on | off | 4 | DV-051 |
| Default action on a first failure | `verification.failfast_action` | `stop` | not used | 5 | DV-051 |
| Polite stop | `carry.polite_stop` | on | off | 11 | DV-093 |
| Grace period between the interrupt and the termination | `carry.politeStopGraceSec` | 10 | not used | 50 | DV-093 |
| Grace period of a job stop | `verification.failfastGraceSec` | 10 | not used | 51 | DV-051 |
| Pass ceiling, global and per phase | `roles.proposer.timeoutSec`; `phases.<N>.proposer.timeoutSec` (alias table) | 1,800 | as at the baseline | none needed | DV-027 |
| Idle period, progress period, repeat limit, cap-kill limit | `roles.proposer.idleTimeoutSec`, `.progressTimeoutSec`, `.repeatLimit`, `.maxCaps` | 900; 1,800; 12; 3 | as at the baseline | none needed | DV-027 |
| Repeat-ignore expression; progress roots | `roles.proposer.repeatIgnore`; `roles.proposer.progressPaths` | the default of F118-FR-004; the working directory | as at the baseline | none needed | DV-027 |
| Tick of the watchdogs | `loop.watchdogTickSec` | 15 | 15 | none needed | DV-027 |
| Short-pass period and nudge | `loop.shortPass.sec`; `loop.shortPass.nudgeAfter` | 180; 2 | as at the baseline | none needed | DV-013 |
| Yield settings | `loop.yield.pollSec`, `.maxPerAttempt`, `.allowCommand`, `.countsAsIter` (key table of feature 110; alias table of annex X §X.8) | 30; 4; false; false | as at the baseline | none needed | DV-027 |
| Yield settings, read by the baseline and not yet listed | `loop.yield.waitEvery`, `.logHead`, `.logTail` (the spelling that the alias table of annex X §X.8 gives: "each of the others the key of the same meaning under `loop.yield.*`"); `loop.yield.failureLedger`, `.failureLedgerMax`, `.failurePattern` (the spelling of review item W-110-02; the alias table has no row for `SPECSTRIDE_FAILURE_*`) | 10; 40; 80; true; 150; the default pattern of F118-FR-037 | as at the baseline | none needed | DV-027 |
| Long job | `verification.longJob.phase`; `verification.longJob.cmd` | empty | as at the baseline | none needed | DV-027 |

### Rows of the `parity` profile

| Switch | Default | Value under `parity` | Row | Register row |
|---|---|---|---|---|
| `verification.failfast` | on | off | 4 | DV-051 |
| `verification.failfast_action` | `stop` | not used | 5 | DV-051 |
| `carry.polite_stop` | on | off | 11 | DV-093 |
| `carry.politeStopGraceSec` | 10 | not used | 50 | DV-093 |
| `verification.failfastGraceSec` | 10 | not used | 51 | DV-051 |

### Closed sets

| Set | Members | Owner | Rule for an unknown value |
|---|---|---|---|
| Kill reasons and their classes (row 10 of annex X §X.6) | `idle_timeout`: `hang`; `repeat_stall`: `futility`; `progress_stall`: `futility`; `hard_cap`: `budget` | 118 | The class is `futility`, as at the baseline (B-0606) and as row 10 of annex X §X.6 says |
| Predicates of a yield; actions on a first failure (row 69) | `pid`, `exit_code_file`, `file_exists`, `file_stable`, `grep`, `command`, `first_failure`; `stop`, `continue-and-notify` | 118 | The yield artifact is refused |
| Job modes of a yield (row 70) | `launch`, `adopt` | 118 | The yield artifact is refused |
| Outcomes of a wait on a yield, which are the members of the ending of a yield (row 112) | `satisfied`, `timeout`, `stop`, `wall_budget`: these four and no other, in this spelling | 118 | Read as `timeout` (fail closed) |
| Steps of the end of a pass (row 113) | `polite`, `terminate`, `kill` (the steps of the operation `stop` of the harness port) | 118, with 109 owning the port | A step outside the set is not taken |
| Results of the evaluation of a yield predicate (row 114) | 0 satisfied, 1 not yet, 2 unsatisfiable | 118 | Read as 2 |

## Contracts of feature 100 used

| Contract | Schema id | Annex and section | Used for |
|---|---|---|---|
| Yield artifact | `specstride-pass-yield/v1` | D §D.6, F100-FR-133, F100-FR-134 | Fields, the refusal of `command`, workers never yield, the switches |
| Process registry | `specstride.procs/1` | B §B.10, F100-FR-063, F100-FR-064 | `owned` and `adoptable`, identity check before a signal |
| Inbox | `specstride.inbox/1` | B §B.11 | The stop request read during a wait; `stop --jobs` |
| Harness port, operation `stop` | `specstride.harness/1` | C §C.1, F100-FR-076 | `polite`, `terminate`, `kill` |
| Stream readers | `specstride.stream-dialect/1` | C §C.5 | Normalized records of kind `tool` that the repetition check reads |
| Loop-layer interface | `specstride.loop-layer/1` | D §D.1, F100-FR-114, F100-FR-119 | Order after a pass, the exemption directives, `giveIterationBack`, `afterPass` |
| Prompt block provider | `specstride.prompt-block/1` | D §D.5, F100-FR-131 | The blocks this feature provides |
| Fact block | `specstride.fact-block/1` | D §D.7, F100-FR-135 | The fact about a stopped job |
| Stop reasons | `specstride.stop-reason/1` | E §E.3 | `stop_flag`, `proposer_yield_budget`, `proposer_yield_timeout`, `proposer_cap_exhausted`, `wall_budget` |
| Pass-loop results | — | E §E.4, F100-FR-150 | The results 9 and 10, the status 124, the kill reasons and classes |
| Ledger, counters | `specstride.ledger/1` | B §B.13, F100-FR-069 | Yield index and counters survive a resume |
| Event envelope | `specstride.event/1` | X §X.1, F100-FR-198 to F100-FR-200 | Every event of this feature |
| Closed sets | — | X §X.6, F100-FR-208 | Rows 10, 69, 70, 112, 113 and 114 |
| The `parity` profile | `specstride.profile/1` | X §X.7, F100-FR-210, F100-FR-212 | Rows 4, 5, 11, 50 and 51 |
| Ingress and redactor | `specstride.redaction/1` | A F100-FR-009; X §X.4, F100-FR-205; X §X.1, F100-FR-200; closed set row 89 (ingress classes) | The one point of redaction for every text this feature takes from outside the runtime (F118-FR-044) |
| Config envelope and ranks | — | X §X.2, F100-FR-203 | The order of the pass ceiling and of the poll interval; an unknown key refuses the launch |
| Threat model | — | X §X.9, F100-FR-216 | Threat T-25 |
| Normalization contract | `specstride.oracle-normalization/1` | X §X.8 | Alias table, layout table, N-15 |
| Logical names | `specstride.layout/1` | B §B.5 | `pass:<passId>:kill-note`, `job:<jobId>:yield`, `job:<jobId>:record`, `job:<jobId>:log`, `feature:<slug>:failure-ledger` |
| Fixture families | — | Feature 141 §O.2 | FX-16, FX-20, FX-21, FX-22, FX-23 |

## Extension points

| Point | Version | Role | Requirements |
|---|---|---|---|
| EP-02 harness port | `specstride.harness/1` | consumes: `stop` with `polite`, `terminate`, `kill`; normalized `tool` records | F118-FR-005, F118-FR-008, F118-FR-009 |
| EP-04 loop-layer interface | `specstride.loop-layer/1` | consumes: the order after a pass; the directives `exemptShortPass`, `exemptRepeatCounter`, `giveIterationBack`; the return `refuse` of `afterPass` | F118-FR-013, F118-FR-016, F118-FR-020, F118-FR-043 |
| EP-15 prompt block provider | `specstride.prompt-block/1` | implements: the previous-pass block, the resume block, the long-job block, the short-pass nudge block, the yield interface block | F118-FR-010, F118-FR-012, F118-FR-023, F118-FR-033 |
| EP-13 lock and liveness provider | `specstride.lock/1` | consumes: an `adoptable` process does not count as a living owner | F118-FR-031 |

This feature owns no extension point. It owns the content of the yield artifact schema and of the first-failure predicate.

## Threats

Threats of annex X §X.9 of feature 100 that name this feature as an owner (F100-FR-216), with the control and its test.

| Threat | What this feature controls | Requirement that is the control | Test |
|---|---|---|---|
| T-25, a check with huge output or without end | The first-failure predicate ends the wait on a job that has failed, and the stop ends the process group of a job that the runtime launched; the deadline of a yield and the wall-clock budget end a wait on a job without end; the hard cap ends a pass that waits on one. The output cap and the time limit of a check are the controls of features 105 and 148 | F118-FR-038, F118-FR-039, F118-FR-041 (first failure); F118-FR-020, F118-FR-022 (deadline and budget); F118-FR-006 (hard cap) | CT-118-4, CT-118-5, CT-118-7; PT-118-C-058-*, PT-118-C-054-*; PT-118-C-006-* |

With `verification.failfast` off (the `parity` profile) the first-failure control of T-25 is not in force; the deadline, the budget and the hard cap are. This is the value that row 4 of annex X §X.7 fixes and is no weakening of a control by this feature.

## Repairs after the cross-feature review

Dated 2026-09-30. Items of `docs/ecosystem/reviews/REPAIR-WORKLIST.md`. No id was renumbered or reused.

| Item | Requirement or place | What changed |
|---|---|---|
| W-118-01 | F118-FR-006 | The order of the pass ceiling is that of annex X §X.2 and F110-FR-015: an explicit per-phase setting, the learned value, the value declared by the verification-commands document, the role key. `assumption: CQ-158` added |
| W-110-02 | F118-FR-025, F118-FR-036, table of options | The six keys and their variables are named one by one; "proposals" and "(proposed)" dropped; the keys that feature 110 lists are cited from its key table; the six it does not list yet are reported |
| W-100-14 | F118-FR-024, F118-FR-025, acceptance scenario 1 of user story 2 | "pass limit", "pass count", "the pass is given back", "spends no pass". The literals `SPECSTRIDE_YIELD_COUNTS_AS_ITER`, `loop.yield.countsAsIter`, `giveIterationBack` and `iter` stay |
| W-X-23 | F118-FR-044 (new) | Text from outside the runtime enters through the one ingress before it is written |
| W-X-22 | Section "Threats" (new) | Threat T-25 with its controls and tests |
| W-X-03 | Tables of options and of the profile | Rows 50 and 51 were already written here; rows 50 and 51 added to "Contracts of feature 100 used" |
| W-X-20 | F118-FR-032 | No change of text: the test `PT-118-FX16-long-job` has a task now (T075) |
| Table of feature 100, rows 24 and 33 | Closed sets | Row 10: the note that annex X said `budget` is removed, annex X says `futility` now. Row 114 is cited for the results of a predicate |

### The six keys and their variables: evidence at the baseline

All six variables are read by the Specstride baseline at `9cab15d`, so none is removed.

| Variable | Read at the baseline | Default | Key |
|---|---|---|---|
| `SPECSTRIDE_YIELD_WAIT_EVERY` | `proposer.sh:1221` (default), `:1542` (used) | 10 | `loop.yield.waitEvery` |
| `SPECSTRIDE_YIELD_LOG_HEAD` | `proposer.sh:1223`, `:1570` to `:1573` | 40 | `loop.yield.logHead` |
| `SPECSTRIDE_YIELD_LOG_TAIL` | `proposer.sh:1224`, `:1570` to `:1576` | 80 | `loop.yield.logTail` |
| `SPECSTRIDE_FAILURE_LEDGER` | `proposer.sh:1227`, `:1584` | `true` | `loop.yield.failureLedger` |
| `SPECSTRIDE_FAILURE_LEDGER_MAX` | `proposer.sh:1228`, `:1588` | 150 | `loop.yield.failureLedgerMax` |
| `SPECSTRIDE_FAILURE_PATTERN` | `lib/failure_ledger.py:102` | the default pattern of F118-FR-037 | `loop.yield.failurePattern` |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F118-SC-001**: On the replay fixture of experiment X2, `verification.failfast` on recovers at least 50 per cent of the 29.3 hours that the baseline spends between the first failure and the end of the wait (at least 14.65 hours), and no wait ends on a stale line, a skipped row or an expected failure. Measured on the replay fixture and on the synthetic fixture, with the switch on and off.
  - test: PT-118-X2-failfast
  - origin-note: criterion of brief 118; measured by experiment X2

- **F118-SC-002**: With `carry.polite_stop` on, 100 per cent of the kill records of the fixtures of FX-20 and FX-21 show the interrupt, the grace period applied and the signal that ended the pass, in order.
  - test: CT-118-1

- **F118-SC-003**: Under the `parity` profile, every scenario of FX-16 (`long-job-running`, `long-job-finished`), FX-20, FX-21, FX-22 and FX-23 that this feature is named for compares as `equal`, or as `waived` with its register row, on every surface named for it.
  - test: PT-118-028FR017-*; PT-118-028FR019-*; PT-118-C-022-*; PT-118-C-055-*; PT-118-C-056-*; PT-118-FX16-long-job

- **F118-SC-004**: In every fixture in which a stop or a restart of the engine happens while a job runs, the job's process is alive after the stop, is listed `adoptable`, and is adopted by the next engine start with the remaining deadline; in 0 fixtures is a job signalled that the runtime did not launch, that was in mode `adopt`, or whose yield did not declare `stop`.
  - test: CT-118-3; CT-118-5

- **F118-SC-005**: With the default poll of 30 seconds, the wait on a first-failure predicate ends no later than three poll intervals after a matching line is appended, on the synthetic fixture.
  - test: CT-118-4

- **F118-SC-006**: The three own scenarios of the predicate (a stale failed line, a skipped row, a negative test that fails by design) end no wait under the patterns the fixture declares, in 100 per cent of their runs.
  - test: CT-118-4

## Assumptions

- The pass loop is not a public command. Its flags are internal parameters, and the only aliases of variables that stay are those of the alias table of annex X §X.8.
- The default length of the first grace period of the polite stop is 10 seconds; the sources say "a grace period" and give no value (CQ-054). The second grace period is 3 seconds, the wait of the baseline between a termination and a kill.
- A long job is registered as `adoptable` (CQ-055).
- The yield schema has no way to exclude expected failures; the pattern is all there is (CQ-056).
- The yield schema has no field `resource` (CQ-057).
- The grace period of the stop of a job is 10 seconds and has a key of its own (CQ-058).
- The critic-class calls are bounded by their own time limits, which belong to the critic's features. This feature supervises proposer passes.
- macOS statements are `unverified` (owner ruling 67). So is whether a job in its own process session survives a stop inside a host session (the spike of feature 122).
- Requirements are 44 after the repairs of 2026-09-30 (43 before), close to the estimate limit of 45; no split is proposed.

## As-is behaviour not carried

The traceability files assign 2 requirements and 181 behaviour items to this feature (180 items, and B-2784, which feature 141 added). None has the disposition `superseded-by` or `dropped`.

| As-is id | Disposition | Register row |
|---|---|---|
| — | none | — |

Behaviour that changes on purpose is carried with a kept disposition and a register row named in the requirement: DV-013, DV-014, DV-015 (exemptions for a checkpoint pass), DV-051 (the first-failure predicate), DV-093 (the polite stop) and DV-098 (adoption).

## Clarifications

### Session 2026-09-29

| # | Question | Answer | Source |
|---|---|---|---|
| 1 | What is the default of `on_first_failure`? | `stop`; `continue-and-notify` as the default is an option that is off | Owner ruling 52; R23v O-11; F100-FR-134 |
| 2 | Is the repetition limit 12 or 5? | 12, as in the code; the documentation is corrected | D-02; 028 FR-017; B-0491 |
| 3 | Which class has an unknown kill reason? | `futility`, as at the baseline. Annex X §X.6 row 10 says `budget`; the code is what parity means | B-0606; annex X §X.6 |
| 4 | Does the polite stop apply to the critic? | No. It applies to proposer passes. Critic-class calls end by their own limits | Brief 118 scope; R24 F-7 |
| 5 | Who reads the start time of the run for the wall-clock budget of a wait? | The engine, from its run record; the environment variable of the baseline is not needed | F100-FR-069; annex B §B.15 (run record) |
| 6 | What is the default length of the first grace period? | 10 seconds. The sources leave it open | R24 F-7; R27 D1.10 (CQ-054) |
| 7 | Which class has a long job in the registry? | `adoptable`, so that a stop leaves it alive as at the baseline | F100-FR-063; R15v C-6 (CQ-055) |
| 8 | Can the predicate exclude an expected failure or a skipped row? | Not in schema `v1`; the pattern only. An exclusion would be a change of feature 100 | Annex D §D.6; R23v V-17 B (CQ-056) |
| 9 | Does a job declare a `resource`? | Yes, by an optional field; the schema has none today | Brief 118 heading 4; R26; R14 EV-10 (CQ-057) |
| 10 | Is a job adopted after a relaunch by the runtime root? | Yes. A relaunch is an engine start; the next pass is a fresh session | Owner rulings 6, 55; F100-FR-064 |
| 11 | Does the first-failure predicate need the layer? | No. Nothing rides on the layer's switch | R27 D1.1, D1.8; brief 118 heading 4 |
| 12 | What happens to the wait when the predicate fires and the job is not stopped? | The wait ends and the resume block says the job is still running | R27 D1.8; R23v IR-51 |
