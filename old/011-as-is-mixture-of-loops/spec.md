# Feature Specification: mixture-of-loops (as-is)

**Feature Branch**: `011-as-is-mixture-of-loops` (a label only; no git branch was created)

**Created**: 2026-09-28

**Status**: Draft

**Input**: Source-aware reverse engineering of the `mixture-of-loops` repository at commit `9c88f86`. Every statement below describes behavior observed in the current source, configuration, tests or documentation; none describes a desired or planned change.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Derive a validated launch contract and launcher (Priority: P1)

An operator invokes the skill from a harness (Codex, Claude Code, dsh, pi or prime) for one or more Spec Kit feature directories. The bootstrap script inventories the artifacts into a `draft` contract with one open blocker; the model completes the derivation; `validate_contract.py --promote` sets `validated` only when strict validation passes; `render_launcher.py` publishes a content-addressed bundle and a Bash launcher.

**Why this priority**: This is the product's default mode (`generate`) and the only path to an executable pipeline; every other story consumes its output.

**Independent Test**: Run the three scripts against the `tests/fixtures/repos/greeting-ready` fixture and confirm a `validated` contract with a promotion stamp, a launcher that passes `bash -n`, and a `--dry-run` that exits 0 and writes nothing.

**Acceptance Scenarios**:

1. **Given** a repository with a Spec Kit feature directory, **When** `bootstrap_contract.py --repo … --feature …` runs, **Then** it emits a contract with `status` `draft`, the SHA-256 of every source, and the open blocker `semantic-derivation-required`.
2. **Given** a derived contract that passes strict validation, **When** `validate_contract.py --promote` runs, **Then** it writes `status` `validated` with a `promotion` stamp and exits 0.
3. **Given** a promoted contract, **When** `render_launcher.py --contract … --output run-007.sh` runs, **Then** it publishes `.mixture-of-loops/generated/<id>/<hash>/` with the contract, `runtime.py` and `contract_lib.py`, and writes an executable launcher that carries its own content digest.

---

### User Story 2 - Refuse to produce a pipeline that is draft, blocked or stale (Priority: P2)

When derivation is incomplete, a non-delegable prerequisite is absent, or a source changed after derivation, the scripts refuse with a named reason and a distinct exit code instead of producing a runnable pipeline.

**Why this priority**: The design targets silent omission; refusing is what keeps an unreviewed or out-of-date pipeline from becoming an executable script.

**Independent Test**: Run the scripts against `tests/fixtures/repos/greeting-blocked` (approval file absent) and confirm `--promote` exits 20 with the contract left `draft`, and that the renderer refuses the draft.

**Acceptance Scenarios**:

1. **Given** a contract with an open blocker, **When** `validate_contract.py --promote` runs, **Then** it exits 20, sets `status` back to `draft`, and prints `next:` hints naming what the draft still owes.
2. **Given** a validated contract whose source hash changed (other than task checkbox progress), **When** it is validated or rendered, **Then** the script exits 23 with `stale contract sources`.
3. **Given** a contract whose `validated` status was typed by hand, **When** it is rendered, **Then** the renderer refuses with exit 20 because the promotion stamp is missing or does not match.

---

### User Story 3 - Run the pipeline unattended with resume and a final digest (Priority: P3)

The operator runs the generated launcher (optionally with `--implement`, `--smoke` or `--dry-run`). The runtime re-checks the contract, takes an exclusive lock on the run directory, runs a preflight, executes stages in order with declared in-stage recovery, skips completed stages whose postconditions still hold, and ends with one `[DIGEST]` line.

**Why this priority**: It is the executable result of Stories 1-2 and the thing the harness supervises in Story 4.

**Independent Test**: Execute the rendered `greeting-ready` launcher against the stub `tests/e2e/exec-stub-bin/specstride` and confirm `state.json` reaches `completed` and the launcher prints `[DIGEST] state=completed exit=0`.

**Acceptance Scenarios**:

1. **Given** a rendered launcher, **When** it runs with `--dry-run`, **Then** it prints the preflight and stage plan and `[DIGEST] state=dry-run exit=0` without executing any action.
2. **Given** another launcher already holds the run directory lock, **When** a second launcher starts, **Then** it prints `[BLOCKED]` and exits 24.
3. **Given** a stage recorded `completed` in `state.json` whose postconditions still hold, **When** the launcher is re-invoked, **Then** that stage is skipped with `[RESUME]`.

---

### User Story 4 - Harness-supervised `run` and `auto` modes (Priority: P4)

When the request asks for execution, `supervise.py` selects the mode, gates the launcher through six named checks, starts it detached, reports progress from telemetry, relaunches only classified transient stops within a declared budget, and prints one final `[MOL-DIGEST]`.

**Why this priority**: Execution by the harness is opt-in and builds on Stories 1-3.

**Independent Test**: Use `supervise.py gate` and `supervise.py auto` on the `greeting-ready` launcher with the pipeline-acting stub and confirm a `[MOL-LAUNCH]`, at least one `[MOL-STATE]`, and a `[MOL-DIGEST]` agreeing with the launcher's own `DIGEST`.

**Acceptance Scenarios**:

1. **Given** a request with no execution phrasing, **When** `supervise.py mode` reads it, **Then** it selects `generate` with source `default`.
2. **Given** a launcher whose generated-content digest no longer matches, **When** the gate runs, **Then** it refuses at `launcher-intact` with `launcher-edited` and reports the later checks as `not-evaluated`.
3. **Given** a run that failed with a child exit in `retry_exit_codes`, an allowed `run_stop.reason` and budget remaining, **When** the supervisor classifies it, **Then** it announces `[MOL-RELAUNCH]` and re-invokes the same launcher.

---

### User Story 5 - Onboard the skill into each harness (Priority: P5)

A maintainer runs `bin/onboard-skill` to link the canonical `skills/mixture-of-loops` directory into Codex, Claude Code, dsh, pi or prime at user or repository scope, or to check or repair those links.

**Why this priority**: It is a one-time setup step; the skill cannot be invoked without it, but it carries no pipeline behavior.

**Independent Test**: Run `bin/onboard-skill --harness all --scope user` under a temporary `HOME` and confirm the `.agents/skills` and `.claude/skills` links, then `--check` exits 0.

**Acceptance Scenarios**:

1. **Given** an unrelated real directory at the target path, **When** the linker runs, **Then** it refuses with exit 4 and does not replace it.
2. **Given** a missing link, **When** the linker runs with `--check`, **Then** it exits 5 without changing the filesystem.

---

### User Story 6 - Bind Specstride learning mode and read a retrospective (Priority: P6)

The operator's request determines the Specstride learning mode each `specstride` stage declares; the contract may bind a prefix of Specstride's decision log; after a run, `supervise.py retro` writes a read-only retrospective.

**Why this priority**: Optional and additive to a working pipeline.

**Independent Test**: Call `supervise.py learning --request "…"` with and without learning phrases and confirm `off` by default and `apply` only for explicit phrases; run `retro` and confirm it writes only under the run directory.

**Acceptance Scenarios**:

1. **Given** a request that says nothing about learning, **When** the learning mode is selected, **Then** it is `off` with source `default`.
2. **Given** a completed run, **When** `supervise.py retro --launcher …` runs, **Then** it writes `runs/<id>/retrospectives/<contract-digest>.json` and prints suggestions only as `[MOL-NEXT] suggestion (not run)`.

### Edge Cases

- A `tasks.md` whose only change is checkbox progress is not stale: the semantic hash normalizes `[x]` to `[ ]` for task lines.
- A contract written before the Wiggum-to-Specstride rename still validates: legacy spellings are normalized in memory with a warning.
- A launcher process gone without a terminal `state.json` is reported as `unknown-terminal` and never relaunched.
- A run that exited on a signal (launcher exit 128 or above) or a deliberate child stop is reported as stopped and never relaunched.
- A run already owned by another launcher makes the gate return `attach` rather than starting a second run.
- A pi project that is untrusted makes pi skip repository skills silently in headless runs; `--check` exits 7 for `--harness pi --scope repo`.
- An inherited `SPECSTRIDE_LEARNING` in the operator's shell never reaches a stage; an undeclared mode runs as `off`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The bootstrap resolves the requested feature directories and records each source file's repository-relative path, kind, SHA-256 and line count, plus a checkbox-insensitive semantic hash for `tasks.md`.
<!-- evidence: skills/mixture-of-loops/scripts/bootstrap_contract.py:273-299, skills/mixture-of-loops/scripts/bootstrap_contract.py:44-49 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-002**: The bootstrap emits `status` `draft`, `authorized_roots` set to the repository root, an inventory of tasks, shell candidates, prerequisites and verification documents, one `unresolved` coverage entry per task, and the open blocker `semantic-derivation-required`.
<!-- evidence: skills/mixture-of-loops/scripts/bootstrap_contract.py:319-377 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-003**: The bootstrap binds Specstride's decision log into `configuration.learning` (mode, last run id, SHA-256 of the log prefix, effective values, path) when an applied-decisions file with a run id exists; learning mode defaults to `off`.
<!-- evidence: skills/mixture-of-loops/scripts/bootstrap_contract.py:380-431 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-004**: Strict validation requires `schema_version` 1.0, a kebab-case id, `status` `validated`, bootstrap provenance (`generated_by` and `inventory`), an absolute repository root, nonempty absolute `authorized_roots`, and source and stage paths inside those roots.
<!-- evidence: skills/mixture-of-loops/scripts/contract_lib.py:656-760 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-005**: Strict validation rejects any open blocker finding and any coverage entry still `unresolved` or `unsupported`.
<!-- evidence: skills/mixture-of-loops/scripts/contract_lib.py:852-870, skills/mixture-of-loops/scripts/contract_lib.py:924-935 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-006**: `validate_contract.py --promote` writes `validated` with a promotion stamp only when strict validation passes; on failure it sets the contract back to `draft`, prints `next:` hints for the open bootstrap placeholder and for absent prerequisites without a blocker at their line, and exits 20.
<!-- evidence: skills/mixture-of-loops/scripts/validate_contract.py:27-112 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-007**: Source-hash checking reports a contract as stale (exit 23) when a source's SHA-256 changed, unless the source is `tasks.md` and only task checkbox state changed.
<!-- evidence: skills/mixture-of-loops/scripts/contract_lib.py:340-371, skills/mixture-of-loops/scripts/validate_contract.py:92-94 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-008**: The renderer re-validates strictly, refuses a contract whose promotion stamp is missing or does not match, and refuses to overwrite an edited or non-generated launcher unless `--replace-edited` is passed.
<!-- evidence: skills/mixture-of-loops/scripts/render_launcher.py:113-151, skills/mixture-of-loops/scripts/contract_lib.py:969-977 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-009**: The renderer publishes a bundle at `.mixture-of-loops/generated/<id>/<first 20 hex of the contract SHA-256>/` holding the canonical contract, `runtime.py` and `contract_lib.py`, and reuses an existing bundle only if its contract hash matches.
<!-- evidence: skills/mixture-of-loops/scripts/render_launcher.py:67-94 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-010**: The generated launcher is a Bash script that carries a `mixture-of-loops-generated` marker and a `generated-content-sha256` over its own text, and `exec`s the bundled `runtime.py` with the bundled contract.
<!-- evidence: skills/mixture-of-loops/scripts/render_launcher.py:97-110 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-011**: The runtime exits 23 on stale sources and 20 on an invalid contract, each with a `[DIGEST] state=failed` line, and with `--dry-run` prints preflight and stage plans without executing actions and ends with `[DIGEST] state=dry-run exit=0`.
<!-- evidence: skills/mixture-of-loops/scripts/runtime.py:559-573, skills/mixture-of-loops/scripts/runtime.py:484-514 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-012**: The runtime keeps run state under `.mixture-of-loops/runs/<id>/`, takes a non-blocking exclusive lock there and exits 24 when another launcher holds it.
<!-- evidence: skills/mixture-of-loops/scripts/runtime.py:575-586 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-013**: The runtime runs a preflight over every enabled stage (environment readiness, preflight-timed preconditions, and setup postconditions when `--implement` is absent) and exits 21 with `exit_reason` `preflight` on any failure.
<!-- evidence: skills/mixture-of-loops/scripts/runtime.py:615-639 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-014**: The runtime executes stages in order, skips smoke stages without `--smoke`, skips a previously completed stage whose postconditions still hold, resets stage state when the contract digest changed, and records each stage's status, child exit and reason in `state.json`.
<!-- evidence: skills/mixture-of-loops/scripts/runtime.py:591-688 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-015**: Within a stage the runtime retries only exit codes in `recovery.retry_exit_codes`, optionally only for an allowed newest `run_stop.reason`, with declared backoff, up to `max_attempts` and `total_timeout_seconds`; a failed stage ends the launcher with exit 22, or 128 plus the signal when interrupted, and child exit 6 is recorded as `stopped`.
<!-- evidence: skills/mixture-of-loops/scripts/runtime.py:416-481, skills/mixture-of-loops/scripts/runtime.py:661-678 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-016**: The runtime strips inherited `SPECSTRIDE_LEARNING` and `WIGGUM_LEARNING` from every child's environment and sets `SPECSTRIDE_LEARNING=off` for `specstride` stages unless the stage's own `env` declares a value.
<!-- evidence: skills/mixture-of-loops/scripts/runtime.py:112-144 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-017**: Mode selection returns `generate` by default; an explicit `--auto`, `--run` or `--generate` token wins over prose, a refusal phrase or a bare dry-run mention yields `generate`, and execution phrasing yields `auto` (with generation words) or `run`.
<!-- evidence: skills/mixture-of-loops/scripts/supervisor_lib.py:114-208 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-018**: Learning-mode selection returns `off` by default; a `--learning-*` token wins, a refusal phrase yields `off`, `apply` requires an explicit phrase about applied or learned values, and other learning phrases yield `suggest`.
<!-- evidence: skills/mixture-of-loops/scripts/supervisor_lib.py:211-264 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-019**: The launch gate evaluates, in order, `launcher-intact`, `contract-validated`, `authorized-root`, `launcher-syntax`, `launcher-dry-run` and `run-directory-free`; the first failure names the refusal reason, later checks are reported `not-evaluated`, and a held run directory yields `attach` instead of `launch`.
<!-- evidence: skills/mixture-of-loops/scripts/supervisor_lib.py:455-549 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-020**: The supervisor launches the launcher from an argv array with `--no-color`, stdin closed, a new session and both streams appended to `harness-launch.log`, and writes `harness-run.json` with pid, pgid, contract digest and relaunch budget.
<!-- evidence: skills/mixture-of-loops/scripts/supervisor_lib.py:569-646 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-021**: The relaunch classifier permits a relaunch only for a terminal `failed` run with launcher exit 22, a transient stage reason, a child exit in the stage's `retry_exit_codes`, an allowed `run_stop.reason` when one is declared, an unchanged contract digest, unchanged bound learning decisions, an intact launcher, and relaunch budget and wall clock remaining; every refusal carries a named reason.
<!-- evidence: skills/mixture-of-loops/scripts/supervisor_lib.py:962-1055 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-022**: The relaunch budget defaults to 2 relaunches with a wall clock of (relaunches + 1) times the stages' declared seconds; a declared `configuration.auto` allows 0 to 5 relaunches and no more wall clock than the stages declare.
<!-- evidence: skills/mixture-of-loops/scripts/contract_lib.py:401-423, skills/mixture-of-loops/scripts/contract_lib.py:536-560 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-023**: The supervisor reports with labelled lines (`[MOL-MODE]`, `[MOL-LAUNCH]`, `[MOL-STATE]`, `[MOL-RELAUNCH]`, `[MOL-REFUSE]`, `[MOL-DIGEST]`), and the final digest carries state, launcher exit, child exit, last stage, evidence, state path and a next action.
<!-- evidence: skills/mixture-of-loops/scripts/supervisor_lib.py:1117-1160 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-024**: `supervise.py retro` writes a retrospective per contract digest under the run directory, reports missing data as `unavailable`, and prints any `specstride learn --revert` only as a suggestion that is not run.
<!-- evidence: skills/mixture-of-loops/scripts/supervise.py:162-190 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-025**: `bin/onboard-skill` links the canonical skill directory for codex, claude, dsh, pi, prime or all at user or repo scope, supports `--check` and `--repair`, and exits 2 usage, 3 missing source, 4 path in the way, 5 missing link, 6 collision, 7 untrusted pi project.
<!-- evidence: bin/onboard-skill:4-19, bin/onboard-skill:250-316 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-026**: Each script prints a stderr reminder, without changing its exit code or stdout, when it runs without `MOL_VIA=shell` in its environment.
<!-- evidence: skills/mixture-of-loops/scripts/contract_lib.py:96-108 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-027**: Contracts that use the legacy `wiggum` stage kind and related legacy spellings are normalized in memory to the Specstride spellings and reported as warnings, not errors.
<!-- evidence: skills/mixture-of-loops/scripts/contract_lib.py:17-29, skills/mixture-of-loops/scripts/contract_lib.py:656-661 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->

### Key Entities

- **Launch contract** (data-model `LaunchContract`): JSON document (`schema_version` 1.0) with id, status (`draft` or `validated`), promotion stamp, repository root and revision, authorized roots, features, hashed sources, inventory, configuration, coverage, findings and stages; schema in `skills/mixture-of-loops/assets/launch-contract.schema.json`.
- **Stage** (data-model `Stage`): kebab-case id, kind (`setup`, `decision`, `command`, `specstride`, `smoke`), cwd, dependencies, action (fixed argv), preconditions, postconditions, recovery and evidence.
- **Coverage entry** (data-model `CoverageObligation`): one obligation traced to a source line, with kind, timing, producer, disposition (`mapped`, `optional`, `out-of-scope`, `unresolved`, `unsupported`), stage ids and verification ids.
- **Finding** (data-model `Finding`): id, severity (`info`, `warning`, `blocker`), status (`open`, `resolved`, `accepted`), message, source and resolution.
- **Bundle** (data-model `Bundle`): content-addressed directory under `.mixture-of-loops/generated/<id>/` holding the canonical contract and runtime copies.
- **Run state** (data-model `RunState`): `.mixture-of-loops/runs/<id>/` with the runtime's `state.json`, `launcher.log` and `lock`, and the supervisor's `harness-run.json`, `harness-launch.log` and `harness-report.log`.
- **Launch record** (data-model `HarnessRunRecord`): `harness-run.json` with argv, pid, pgid, contract digest, flags, log offsets, relaunch budget and relaunch history.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every push to `main` and every pull request runs the hermetic suite on Python 3.10, 3.11, 3.12 and 3.13, each job bounded at 10 minutes, and a single `ci` job passes only when the whole matrix succeeded.
<!-- evidence: .github/workflows/ci.yml:1-77 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **SC-002**: A pull request merges automatically only with the `automerge` label and a successful `ci` check, and is squashed.
<!-- evidence: .mergify.yml:1-18 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **SC-003**: A launcher `--dry-run` exits 0 without executing any stage action and prints exactly one `[DIGEST] state=dry-run` line.
<!-- evidence: skills/mixture-of-loops/scripts/runtime.py:484-514 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **SC-004**: Each launcher failure class maps to one distinct exit code: 20 invalid, 21 preflight, 22 stage, 23 stale, 24 lock.
<!-- evidence: skills/mixture-of-loops/scripts/runtime.py:42-46, skills/mixture-of-loops/scripts/supervisor_lib.py:48-60 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **SC-005**: Supervision polls no more often than every 60 seconds, backs off by a factor of 1.5, and caps the interval at 600 seconds.
<!-- evidence: skills/mixture-of-loops/scripts/supervisor_lib.py:70-73 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **SC-006**: A supervised run relaunches at most 5 times under any contract, and at most 2 times when the contract declares no budget.
<!-- evidence: skills/mixture-of-loops/scripts/contract_lib.py:49-52, skills/mixture-of-loops/scripts/contract_lib.py:546-550 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **SC-007**: Supervision ends with one of seven terminal outcomes mapped to process exits: completed 0, stopped 2, unknown-terminal 3, refused 4, supervision-expired 5, failed 22, lock-conflict 24.
<!-- evidence: skills/mixture-of-loops/scripts/supervisor_lib.py:90-92 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **SC-008**: For the `greeting-blocked` fixture the expected outcome is a blocked draft whose open blocker points at `plan.md` line 17; for `greeting-ready` it is a validated contract and a launcher.
<!-- evidence: tests/fixtures/expectations/greeting-blocked.json:1-53, tests/fixtures/repos/greeting-blocked/specs/001-greeting/plan.md:15-17, README.md:393-396 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->

## Assumptions

- The analysis is static: no script, test, build or harness was executed, so runtime claims are read from source and marked `verified` only in the sense that the cited source was read.
<!-- evidence: README.md:329-357 | kind=inferred | confidence=0.80 | contradicts=none | validation=unverified -->
- The README states that Tier 2 skips on the CI runner because no harness binary is installed, while the CI workflow comment states the Tier 2 execution tests always run against the stub; which subset of Tier 2 runs in CI is an explicit unknown here.
<!-- evidence: .github/workflows/ci.yml:56-63 | kind=observed | confidence=0.60 | contradicts=README.md:442-443 | validation=unverified -->
- Branch protection on `main` (required `ci` check, no force pushes, enforced for administrators) is repository configuration outside the tree; it is known only from the README.
<!-- evidence: README.md:456-462 | kind=declared | confidence=0.50 | contradicts=none | validation=unverified -->
- A comment in `supervisor_lib.py` cites stage outcomes at `runtime.py:412-466`, but that code now sits at lines 427-481; the classifier's accepted reasons still match the literals the runtime records.
<!-- evidence: skills/mixture-of-loops/scripts/supervisor_lib.py:75-80, skills/mixture-of-loops/scripts/runtime.py:427-481 | kind=observed | confidence=0.80 | contradicts=none | validation=verified -->
- The harness discovery paths for Codex, Claude Code, dsh, pi and prime are taken from the README, which records when and against which versions they were checked; they were not re-verified.
<!-- evidence: README.md:246-271 | kind=declared | confidence=0.60 | contradicts=none | validation=unverified -->
- Target users are operators of the five supported agent harnesses who maintain Spec Kit feature directories and have Specstride installed; Windows execution and cloud-hosted skill synchronization are declared unvalidated.
<!-- evidence: README.md:5-8, README.md:202-210 | kind=declared | confidence=0.85 | contradicts=none | validation=verified -->
