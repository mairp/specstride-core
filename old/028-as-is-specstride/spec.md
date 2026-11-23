# Feature Specification: Specstride As-Is

**Feature Branch**: `028-as-is-specstride`

**Created**: 2026-09-28

**Status**: Draft (as-is baseline, reverse-engineered)

**Input**: Reverse-engineered, read-only, from the Specstride source tree at git HEAD `9cab15d` (inventory: `.specstride/reverse/specstride/INVENTORY.md`). This document describes what the system does today. It proposes nothing.

## User Scenarios & Testing

### User Story 1 - Drive a Spec Kit feature phase by phase behind a critic gate (Priority: P1)

An operator points Specstride at a project workdir that holds a Spec Kit feature. Specstride runs a coding-agent proposer on the first unapproved phase until the proposer writes that phase's evidence file. It then asks an LLM critic for a verdict. An approved phase unlocks the next one. A rejected phase is retried with the critic's feedback, up to a bounded number of attempts.

**Why this priority**: This is the product's core loop. Every other capability (inspection, learning, reverse engineering, telemetry) observes or feeds this loop.

**Independent Test**: Copy `examples/speckit-tasks.example.md` to `<dir>/specs/001-greeting/tasks.md`, run `specstride run -w <dir>`, and observe `GATE<N>-EVIDENCE.md` and then `GATE<N>-APPROVED` or `GATE<N>-FEEDBACK.md` appear under `.specstride/features/<slug>/gates/`, ending with exit code 0 once every phase is approved.

**Acceptance Scenarios**:

1. **Given** a workdir with one Spec Kit `specs/*/tasks.md` and no `-s` flag, **When** the operator runs `specstride run -w <dir>`, **Then** that `tasks.md` is resolved as the spec and phase 1 starts.
2. **Given** a phase whose evidence file exists, **When** the critic's reply ends with `VERDICT <nonce>: APPROVED` carrying the per-call nonce, **Then** an empty `GATE<N>-APPROVED` marker is written, the phase's task checkboxes are ticked, and the next phase starts.
3. **Given** a rejected phase, **When** the attempt count reaches `MAX_REJECTS` (default 3), **Then** the run halts with exit code 2 and prints the evidence, feedback and attempt-history paths.
4. **Given** a run killed mid-phase, **When** the same command is rerun, **Then** the phase to resume is derived from the `GATE*-APPROVED` markers on disk, not from a stored counter.

---

### User Story 2 - Recover a stuck phase with the diagnostician and the accelerator (Priority: P2)

When the critic rejects a phase with a set of unmet criteria not seen before for that phase, Specstride runs a tool-free diagnostician pass that writes a hint. The next attempt is a narrowed accelerator pass that acts on that hint. It runs once per signature and never twice in a row.

**Why this priority**: Without it a stalled phase uses its full retry budget re-deriving the same fix. It depends on the P1 loop.

**Independent Test**: Force a rejection whose feedback names new `T###` IDs and observe `GATE<N>-HINT.md`, the `.diagnosed-phase<N>` signature marker, and an `accelerator_start` event for the next attempt.

**Acceptance Scenarios**:

1. **Given** a rejection whose unmet-criteria signature differs from the stored `.diagnosed-phase<N>`, **When** the orchestrator handles the rejection, **Then** it runs `lib/critic.py --diagnose` and stores the new signature.
2. **Given** the same signature as the last diagnosis, **When** the phase is rejected again, **Then** no diagnostician pass runs.
3. **Given** the previous attempt was an accelerator pass, **When** the next attempt is chosen, **Then** it is an ordinary proposer pass.

---

### User Story 3 - Inspect and control a run from a second terminal (Priority: P3)

While a run is in progress (or after it ends), the operator uses the `specstride` front door to see state, phases, events, verdicts and feedback, and to stop or resume the run.

**Why this priority**: The loop runs unattended, so the operator needs a way to see and control it. It adds nothing to what gets built.

**Independent Test**: With a run active, run `specstride status`, `specstride events --json` and `specstride stop`. Observe `stop.flag` being written and the run exiting with code 6. Then run `specstride resume` and observe the saved launch flags being replayed.

**Acceptance Scenarios**:

1. **Given** an active run, **When** the operator runs `specstride stop`, **Then** `.specstride/stop.flag` is written and the run exits 6 at its next check.
2. **Given** no active run and a saved `.specstride/last-run.conf`, **When** the operator runs `specstride resume`, **Then** the orchestrator is re-executed with the saved flags plus any extra overrides.
3. **Given** a run holding the lock, **When** the operator runs `specstride resume`, **Then** it refuses with a non-zero exit.

---

### User Story 4 - Reverse-engineer an existing codebase into an as-is Spec Kit feature (Priority: P4)

The operator runs `specstride reverse <SRC>`. Specstride writes a deterministic inventory and a phased driver spec under `<SRC>/.specstride/reverse/<slug>/`, then runs the ordinary loop to fill `<SRC>/specs/NNN-as-is-<slug>/`. Every gate runs a deterministic linter and a guard that fails if anything outside the output and state directories changed.

**Why this priority**: It produces the loop's input for projects that have no spec yet. The run itself is the P1 loop.

**Independent Test**: Run `python3 lib/reverse.py lint <dir> --src <SRC> --baseline <inventory.json> --upto 1` on a feature directory and `python3 lib/reverse.py guard <SRC> --baseline <inventory.json> --out <dir>`. Observe exit 0 on clean inputs and a non-zero exit plus findings otherwise.

**Acceptance Scenarios**:

1. **Given** an FR line with no evidence comment on the next line, **When** the linter runs, **Then** it reports `evidence.missing` and exits non-zero.
2. **Given** a tracked source file changed after the baseline was taken, **When** the guard runs, **Then** it reports `changed: <path>` and exits non-zero.
3. **Given** `--out` pointing at the source root, `.git/`, `.specify/` or a non-empty directory, **When** planning, **Then** the output directory is refused.

---

### User Story 5 - Let the loop suggest and apply per-phase settings from its own telemetry (Priority: P5)

`specstride learn` reads the feature's recorded runs and suggests per-phase values for a fixed allowlist of knobs. The operator can apply, revert or turn off those decisions. They take effect only in runs launched with `SPECSTRIDE_LEARNING=apply`.

**Why this priority**: It is opt-in and only changes budgets. The loop works without it.

**Independent Test**: Run `specstride learn --show` on a feature with recorded runs and check that nothing under `learning/` changes. Then run `--apply` and observe an append-only entry in `learning/applied.json`.

**Acceptance Scenarios**:

1. **Given** recorded runs, **When** the operator runs `specstride learn` with no mode, **Then** suggestions are printed and nothing is written.
2. **Given** any suggestion, **When** it names a knob, **Then** the knob is `proposer_timeout` or `yield_poll_interval`.

---

### Edge Cases

- Several `specs/*/tasks.md` or `openspec/changes/*/tasks.md` candidates and no `--feature`: nothing is auto-selected. Every candidate is listed with the `-s` and `--feature` forms, and the run exits 3.
- A second `specstride run` in the same workdir, even for a different feature, exits 5 because the lock is per workdir.
- A critic reply with no verdict line, the wrong nonce, or more than one verdict line is recorded as `MALFORMED` and treated as a rejection. `SPECSTRIDE_CRITIC_MALFORMED_LIMIT` (default 3) consecutive `MALFORMED` verdicts halt the run with exit 1 and reason `critic_unavailable`.
- A criterion that was cleared and is then re-rejected across attempts halts the phase as oscillating (exit 2) before `MAX_REJECTS` is reached.
- A resumed run whose attempt directory already exists archives into `attempt<M>-<run-id>`, so audit history from an earlier run is never overwritten.
- A proposer pass that needs a long job may yield by writing a `specstride-pass-yield/v1` artifact. The `command` predicate is refused unless `SPECSTRIDE_YIELD_ALLOW_COMMAND=true`, and more than `SPECSTRIDE_YIELD_MAX_PER_ATTEMPT` (default 4) yields in one attempt ends the proposer with exit 9, which the orchestrator turns into a halt with exit 4.
- The documented default of the repetition watchdog (`5` in `README.md`) disagrees with the code and `.env.example` (`12`). The code value is the one in effect (FR-017).

## Requirements

All requirements below describe observed current behavior of the code at the cited lines.

### Functional Requirements

- **FR-001**: Specstride resolves the spec without `-s` in a fixed order: `<workdir>/SPECS.md`, then `.specify/feature.json` → `feature_directory/tasks.md`, then exactly one `specs/*/tasks.md` or `openspec/changes/*/tasks.md` candidate (`--feature` selects among several). Otherwise it lists every location tried and exits 3.
<!-- evidence: orchestrator.sh:354-430 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-002**: Specstride auto-detects the spec format (`native`, `speckit-tasks`, `openspec-change`) from an explicit override, then the filename, then content. An unknown explicit format raises an error instead of guessing.
<!-- evidence: lib/specstride_spec.py:397-420 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-003**: Specstride derives the phase to run as the first phase lacking `GATE<N>-APPROVED`, unless `--start-phase` is given. If every phase is already approved it runs release verification and exits 0.
<!-- evidence: orchestrator.sh:899-922, orchestrator.sh:990-996 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-004**: Specstride allows only one run per workdir. It takes an exclusive `flock` on `.specstride/lock` (or a `lock.d` directory when `flock` is absent) and exits 5 when the lock is held.
<!-- evidence: orchestrator.sh:506-523 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-005**: The critic generates a random nonce per call and parses the verdict only from its own reply. Only exactly one `VERDICT <nonce>: APPROVED|REJECTED` line counts. A missing, mismatched or duplicated verdict yields `MALFORMED`.
<!-- evidence: lib/critic.py:1847-1860, lib/critic.py:2690-2690 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-006**: On `APPROVED` the critic writes an empty `GATE<N>-APPROVED` marker. On `REJECTED` or `MALFORMED` it writes `GATE<N>-FEEDBACK.md` and exits 10.
<!-- evidence: lib/critic.py:2750-2757, lib/critic.py:2805-2846 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-007**: Before a retry, the orchestrator moves the rejected `GATE<N>-EVIDENCE.md` into `attempts/phase<N>/attempt<M>/` and copies the feedback, hint, acceleration note and newest verdict transcript there. An existing attempt directory gets a `-<run-id>` suffix.
<!-- evidence: orchestrator.sh:1358-1380 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-008**: A phase is retried until the attempt count reaches `MAX_REJECTS` (default 3, `SPECSTRIDE_MAX_REJECTS`). The run then halts with exit 2 and logs the latest evidence, feedback, hint and rejection trail.
<!-- evidence: orchestrator.sh:204-204, orchestrator.sh:2219-2253 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-009**: A criterion that was cleared and then re-rejected across attempts halts the run as oscillating with exit 2, after archiving the attempt.
<!-- evidence: orchestrator.sh:2195-2217 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-010**: `SPECSTRIDE_CRITIC_MALFORMED_LIMIT` (default 3; 0 disables) consecutive `MALFORMED` verdicts halt the run with exit 1 and a `run_stop reason=critic_unavailable` event.
<!-- evidence: orchestrator.sh:220-223, orchestrator.sh:2155-2186 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-011**: On a rejection whose unmet-criteria signature differs from the stored `.diagnosed-phase<N>`, the orchestrator runs `lib/critic.py --diagnose` with the critic backend and stores the signature. It is disabled with `SPECSTRIDE_DIAGNOSTICIAN=false`.
<!-- evidence: orchestrator.sh:1073-1091 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-012**: An accelerator attempt is due only when the accelerator is enabled, the previous attempt was not an accelerator, a hint and feedback exist, and the diagnosed signature has not already been accelerated.
<!-- evidence: orchestrator.sh:1105-1121 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-013**: After a phase is approved, Specstride ticks that phase's task checkboxes in the spec (not for the native format; off with `SPECSTRIDE_TICK_TASKS=false`). A failed tick is logged and the approval stands.
<!-- evidence: orchestrator.sh:2075-2090 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-014**: After an approved phase, when `SPECSTRIDE_GIT_COMMITS` is `auto` and the workdir is a git work tree with changes, Specstride runs `git add -A` and commits `specstride: phase <N> approved — <title>`. It never initialises or pushes a repository.
<!-- evidence: orchestrator.sh:224-224, orchestrator.sh:999-1012 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-015**: `stop.flag` is honoured at each phase-boundary step and during a proposer pass, and exits 6. `specstride stop` writes the flag, and `--now` also kills the recorded in-flight proposer process tree.
<!-- evidence: orchestrator.sh:1766-1772, specstride:549-575 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-016**: `specstride resume` refuses when the lock is held. Otherwise it re-executes the orchestrator from the saved `last-run.conf` (root or per feature), replaying backends, limits, feature, spec format, verification settings, timeouts and telemetry, with extra arguments appended last-wins.
<!-- evidence: specstride:577-630 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-017**: Proposer passes are bounded by watchdogs: idle (`SPECSTRIDE_PROPOSER_IDLE_TIMEOUT`, default 900 s), disk-progress (`SPECSTRIDE_PROPOSER_PROGRESS_TIMEOUT`, default 1800 s) and repetition (`SPECSTRIDE_PROPOSER_REPEAT_LIMIT`, default 12 in code).
<!-- evidence: proposer.sh:155-166, .env.example:208-208 | kind=observed | confidence=0.80 | contradicts=README.md:1352-1353 | validation=verified -->
- **FR-018**: A consecutive-error breaker (`SPECSTRIDE_PROPOSER_MAX_ERRORS`, default 2) and a hard-cap breaker (`SPECSTRIDE_PROPOSER_MAX_CAPS`, default 3) end the proposer (proposer exits 7 and 10). The orchestrator halts with exit 4 on its own wall-clock budget and on every proposer budget exit: 4 (`MAX_ITER` without evidence), 7, 8 (no progress), 9 (yield budget spent) and 10.
<!-- evidence: proposer.sh:1897-1897, proposer.sh:1912-1912, orchestrator.sh:1774-1776, orchestrator.sh:1888-1966, proposer.sh:117-133 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->
- **FR-019**: A proposer pass may end cleanly by writing a `specstride-pass-yield/v1` artifact. The poll is `SPECSTRIDE_YIELD_POLL` (default 30 s), yields per attempt are capped by `SPECSTRIDE_YIELD_MAX_PER_ATTEMPT` (default 4), and the `command` predicate is disabled unless `SPECSTRIDE_YIELD_ALLOW_COMMAND=true`.
<!-- evidence: proposer.sh:1185-1216 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-020**: `--verification` accepts only `off`, `plan` or `required` (default `required`, `SPECSTRIDE_VERIFICATION`). Any other value exits 3.
<!-- evidence: orchestrator.sh:226-226, orchestrator.sh:326-330 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-021**: The proposer and critic backends come from one registry: `dsh`, `claude`, `codex`, `bebop` and `prime` for the proposer and critic, each with its own qualifier spelling. The orchestrator defaults are proposer `dsh` and critic `claude`.
<!-- evidence: lib/backends.py:51-62, orchestrator.sh:202-203 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-022**: Loki and OpenTelemetry shipping are both off by default, with default endpoints `http://localhost:3100` and `http://localhost:4318`.
<!-- evidence: orchestrator.sh:206-209 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-023**: The `specstride` front door routes `run` and a leading flag to the orchestrator, and exposes `status`, `watch`, `tail`, `events`, `verdicts`, `feedback`, `phases`, `stop`, `resume`, `learn` and `reverse`. It documents every subcommand other than `stop`, `resume` and the `learn`/`reverse` writes as read-only.
<!-- evidence: specstride:1-49 | kind=declared | confidence=0.85 | contradicts=none | validation=verified -->
- **FR-024**: `specstride learn` may only adjust the allowlisted knobs `proposer_timeout` (hard minimum 900 s, at most 2× the default) and `yield_poll_interval` (10–300 s), with at most ±50% change per step.
<!-- evidence: lib/learn.py:904-913 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-025**: `reverse.py` names the default output `specs/NNN-as-is-<slug>/`, with NNN one above the highest existing spec number. It refuses an output at the source root, outside the source, inside `.git/`, the state directory or `.specify/`, or in a non-empty directory.
<!-- evidence: lib/reverse.py:199-229 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-026**: The reverse guard re-walks the source against the baseline inventory, excluding the output directory. It reports added, deleted and changed files, a moved git HEAD, and new git status entries outside the output and state directories. Any finding fails the guard.
<!-- evidence: lib/reverse.py:1291-1344 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-027**: The reverse linter checks each level's owned artifacts. At level 1 these are `spec.md`, `checklists/requirements.md` and a constitution only when the source has none. It checks template sections, leftover placeholders, story format, and an evidence comment with a resolvable path range for every FR and SC.
<!-- evidence: lib/reverse.py:51-60, lib/reverse.py:985-1044 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-028**: A backend registry entry may declare a throwaway config-home overlay in its optional `overlay` field (`{"vars": (...), "seeds": (...)}`), which `lib/backend_overlay.py` derives its declaration table from and validates once per process. The scope variable `SPECSTRIDE_<BACKEND>_OVERLAY` accepts only unset, empty, `pass` or `attempt`; any other value is an error. A backend without a declaration resolves to scope `none`, and an explicit `pass`/`attempt` for it only prints a warning. No shipped registry entry sets `overlay`, and a missing or broken registry degrades to an empty table.
<!-- evidence: lib/backends.py:36-45, lib/backend_overlay.py:1-50, lib/backend_overlay.py:179-250 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-029**: `lib/specstride_spec.py` is the one owner of the spec grammar for every supported format (`native`, `speckit-tasks`, `openspec-change`). The bash side reaches it through thin `specstride_spec_*` shims in `specstride-lib.sh`, and `lib/critic.py` imports it for slicing, titles, format detection and context rendering, so neither keeps its own parser.
<!-- evidence: lib/specstride_spec.py:1-43, specstride-lib.sh:148-165, specstride-lib.sh:236-251, lib/critic.py:29-33, lib/critic.py:348-357 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-030**: The repository's automated checks are a pytest suite under `lib/` (with `lib/conftest.py` keeping tests hermetic from host telemetry settings) and a CI workflow with two jobs: `lint` runs `bash -n` and `shellcheck -S error` on every tracked shell script, and `test` installs only `pytest` and `pytest-xdist` on Python 3.13 and runs `python -m pytest lib/ -q -n 16 --durations=10`. CI runs on pull requests and pushes to `main`, merge groups and manual dispatch.
<!-- evidence: .github/workflows/ci.yml:1-43, lib/conftest.py:1-8 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

### Key Entities

- **Workdir**: the project a run operates on (`-w`, default `$PWD`). It holds the single run lock and `stop.flag` at `.specstride/`.
- **Feature**: a namespace `.specstride/features/<slug>/` for one spec's gates, runs, attempts, verdicts, learning state and `PROGRESS.md`. `<slug>` is the feature directory's basename, or `default`.
- **Phase**: an ordered unit of the spec, with a title, tasks or acceptance criteria. It is identified by number, and its state is derived from gate files.
- **Gate files**: `GATE<N>-EVIDENCE.md` (proposer), `GATE<N>-APPROVED` and `GATE<N>-FEEDBACK.md` (critic), `GATE<N>-HINT.md` (diagnostician) and `GATE<N>-ACCELERATION.md` (orchestrator).
- **Attempt**: one proposer-then-critic cycle of a phase, archived under `attempts/phase<N>/attempt<M>/` when rejected.
- **Event**: one JSON line in the run's `events.jsonl` (for example `run_start`, `verdict`, `reject`, `run_stop`), rendered by the presenter and the inspection CLI.
- **Yield artifact**: a `specstride-pass-yield/v1` JSON file describing a job, a resume predicate and a deadline.
- **Learning decision**: an append-only entry in `learning/applied.json` (apply, revert, evaluate) for an allowlisted knob.
- **Inventory**: the deterministic `inventory.json` of a reverse run, which is the baseline both the linter and the guard check against.
- **Backend**: one entry of the `lib/backends.py` registry (`dsh`, `claude`, `codex`, `bebop`, `prime`), selected by `--proposer`/`--critic`, with an optional `overlay` field.
- **Overlay declaration**: the config-home overlay a backend declares through its registry `overlay` field; none is declared in the shipped tree.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A run in which every phase reaches `GATE<N>-APPROVED` ends with exit code 0 and a `run_end outcome=all_approved` event.
<!-- evidence: orchestrator.sh:2268-2277 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **SC-002**: 0 phases are approved by a verdict line placed in the evidence file: only a reply line carrying the per-call 16-hex-character nonce produces `APPROVED`.
<!-- evidence: lib/critic.py:1847-1860, lib/critic.py:2690-2690 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **SC-003**: Each halt cause maps to exactly one documented exit code: 0 done, 1 internal or critic unavailable, 2 rejects exceeded, 3 invalid spec or config, 4 budget, 5 lock held, 6 stopped.
<!-- evidence: orchestrator.sh:25-33 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **SC-004**: A rejected phase makes at most `MAX_REJECTS` critic-judged attempts (default 3) before a human is asked to arbitrate.
<!-- evidence: orchestrator.sh:2219-2253 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **SC-005**: At most one diagnostician pass runs per distinct unmet-criteria signature per phase, and at most one accelerator attempt runs per diagnosed signature.
<!-- evidence: orchestrator.sh:1074-1091, orchestrator.sh:1110-1121 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **SC-006**: A reverse run whose gates pass has changed 0 files outside its output directory and `.specstride/`, as checked by the guard's fingerprint and git-status comparison.
<!-- evidence: lib/reverse.py:1291-1344 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **SC-007**: In the shipped tree 0 backends declare a config-home overlay, so every backend resolves to overlay scope `none` and runs against the operator's real environment.
<!-- evidence: lib/backends.py:41-62, lib/backend_overlay.py:44-50, lib/backend_overlay.py:218-232 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->
- **SC-008**: A CI run succeeds only when both jobs succeed: 0 `bash -n` or `shellcheck -S error` failures across tracked shell scripts within 10 minutes, and 0 failing tests in `python -m pytest lib/` within 30 minutes.
<!-- evidence: .github/workflows/ci.yml:18-43 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->

## Assumptions

- Unknown: whether the vendor context-window figures the critic uses to size its grounding budget still match the vendors' current published values. This was not verifiable offline.
<!-- evidence: README.md:618-637 | kind=declared | confidence=0.40 | contradicts=none | validation=unverified -->
- Unknown: the runtime behavior of each backend CLI (`claude`, `codex`, `dsh`, `bebop`, `prime`) against live providers. This run executed nothing, so behavior is taken from source and docs only.
<!-- evidence: lib/backends.py:51-62 | kind=inferred | confidence=0.40 | contradicts=none | validation=unverified -->
- Unknown: whether the bundled telemetry stack (`telemetry/docker-compose.yml`) starts and ingests as documented. No containers were run.
<!-- evidence: telemetry/docker-compose.yml:1-10 | kind=inferred | confidence=0.40 | contradicts=none | validation=unverified -->
- Scope: vendored Spec Kit templates, test fixtures under `lib/fixtures/` and the `wiki/` pages are treated as supporting material, not as separate features of the product.
