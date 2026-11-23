# Data Model: Specstride As-Is

**Feature**: `028-as-is-specstride` | **Source**: git HEAD `9cab15d` (read-only)

This file describes the entities Specstride persists or passes between its processes today. Specstride has no database. Every entity is a file or directory under the workdir's `.specstride/`, a JSON document, or an in-memory record that a Python module builds. Paths are relative to the workdir unless stated otherwise. Nothing here is a proposal.

## Entities

### Workdir state root
<!-- evidence: orchestrator.sh:448-463 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

- **Fields**: `.specstride/lock` (holds `<run-id> <iso-time>` while a run owns it), `.specstride/lock.d/owner` (the fallback when `flock` is absent), `.specstride/stop.flag`, `.specstride/proposer.pid`, root `last-run.conf`, and the symlinks `run.log` and `events.jsonl`.
- **Relationships**: owns one or more **Feature** namespaces under `features/<slug>/`. The lock and `stop.flag` are per workdir, not per feature.
- **State transitions**: lock free → held (`acquire_lock`) → released on exit. A held lock makes a second run exit 5. `stop.flag` absent → present (`specstride stop`) → the run exits 6 at its next check.

### Run lock
<!-- evidence: orchestrator.sh:506-523 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

- **Fields**: `LOCK` path, file descriptor `LOCK_FD`, owner line `<SPECSTRIDE_RUN_ID> <date -Is>`.
- **Relationships**: belongs to the **Workdir state root**. `specstride resume` reads it through `lock_held` and refuses while it is held.
- **State transitions**: `flock -n` succeeds → held. It fails → exit 5 (`E_LOCK`). Without `flock`, `mkdir lock.d` plays the same role and an exit hook removes the directory.

### Feature
<!-- evidence: orchestrator.sh:464-487 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

- **Fields**: `SLUG` (the `--feature`/`SPECSTRIDE_FEATURE` value with characters outside `A-Za-z0-9._-` replaced by `-`, else the spec's Spec Kit/OpenSpec directory basename, else `default`), `FEATURE_DIR=.specstride/features/<slug>`, `GATES_DIR=<feature>/gates`. `TEST_PLAN` and `GENERATE_TESTS` default under `testautomation/<slug>/` unless verification is `off`.
- **Relationships**: holds `gates/`, `attempts/`, `verdicts/`, `runs/`, `learning/`, `yield/`, `PROGRESS.md` and a per-feature `last-run.conf`. It has many **Phase**, **Run** and **Attempt** records.
- **State transitions**: created on first run. Pre-v2 flat layouts (`.specstride/gates/`, root `PROGRESS.md`) are migrated into `features/default/`.

### Phase
<!-- evidence: lib/specstride_spec.py:64-74 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

- **Fields**: `n` (int, also the `GATE<N>` id), `title` (str), `section` (the raw heading-to-next-heading text), `criteria` (list of checkable acceptance lines).
- **Relationships**: every spec adapter (`native`, `speckit-tasks`, `openspec-change`) maps a document onto this shape. `lib/specstride_spec.py` is the one module that builds it; the bash side reaches it through the `specstride_spec_*` shims in `specstride-lib.sh`, and `lib/critic.py` imports it (FR-029). One phase has many **Attempt** records and one set of **Gate files**.
- **State transitions**: not stored as a field. The current phase is derived as the first phase without `GATE<N>-APPROVED` (`derive_phase`, `orchestrator.sh:899-912`). The states are unstarted → in progress (evidence pending) → evidence written → approved or rejected (retry) → approved.

### Gate files
<!-- evidence: lib/critic.py:2745-2757, orchestrator.sh:483-486 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

- **Fields**: `GATE<N>-EVIDENCE.md` (written by the proposer), `GATE<N>-APPROVED` (an empty marker from the critic), `GATE<N>-FEEDBACK.md` (from the critic on `REJECTED`/`MALFORMED`), `GATE<N>-HINT.md` (from the diagnostician), `GATE<N>-ACCELERATION.md` (from the orchestrator), `.diagnosed-phase<N>` (the last diagnosed unmet-criteria signature), and `gates/proofs/`.
- **Relationships**: live in the **Feature**'s `gates/`. They drive **Phase** state.
- **State transitions**: EVIDENCE present → critic verdict → APPROVED (the phase is done) or FEEDBACK (EVIDENCE is archived into an **Attempt** and the phase is retried).

### Diagnosis signature
<!-- evidence: orchestrator.sh:1073-1091 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

- **Fields**: `sig`, from `unmet_signature` over `GATE<N>-FEEDBACK.md` (unmet IDs, or `text:<sha256>` of the feedback without the verdict line), stored in `gates/.diagnosed-phase<N>`.
- **Relationships**: one per **Phase**. It gates the diagnostician and, through it, the accelerator attempt.
- **State transitions**: absent or different → the diagnostician runs → the marker is overwritten with the new signature. Equal → no diagnostician pass.

### Attempt
<!-- evidence: orchestrator.sh:1358-1380 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

- **Fields**: directory `attempts/phase<N>/attempt<M>/` (or `attempt<M>-<run-id>` when that name already exists), holding the moved `GATE<N>-EVIDENCE.md` and copies of the feedback, hint, acceleration note and newest verdict transcript.
- **Relationships**: belongs to one **Phase** of one **Feature**. It references one **Verdict transcript**.
- **State transitions**: created only on rejection, before a retry. The count is bounded by `MAX_REJECTS` (default 3), after which the run exits 2.

### Verdict transcript
<!-- evidence: lib/critic.py:2726-2726, lib/critic.py:2792-2800 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

- **Fields**: path `verdicts/phase<N>.attempt<M>.<ts>.txt`. The header holds `phase`, `attempt`, `provider`, `nonce`, `verdict` and `parse`, followed by the full PROMPT and REPLY.
- **Relationships**: one per critic call. The newest one is copied into the **Attempt**. `specstride verdicts` reads it.
- **State transitions**: write-once.

### Verdict
<!-- evidence: lib/critic.py:1847-1860, lib/critic.py:2690-2690 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

- **Fields**: `nonce` (`secrets.token_hex(8)`, 16 hex characters), result `APPROVED` | `REJECTED` | `MALFORMED`, and `detail`.
- **Relationships**: produced by `parse_verdict` from the critic reply only. It produces **Gate files** and a `verdict` **Event**.
- **State transitions**: no verdict line, a wrong nonce, or more than one verdict line → `MALFORMED` (counted toward `SPECSTRIDE_CRITIC_MALFORMED_LIMIT`).

### Run
<!-- evidence: orchestrator.sh:487-489, orchestrator.sh:627-634 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

- **Fields**: `SPECSTRIDE_RUN_ID` (`YYYYmmdd-HHMMSS-<pid>`), `RUN_DIR=<feature>/runs/<run-id>`, `run.log`, `events.jsonl`, and `verification/verification-plan.json`.
- **Relationships**: belongs to a **Feature**. The root `.specstride/run.log` and `.specstride/events.jsonl` symlinks point at the newest run. It holds many **Event** records.
- **State transitions**: started (`run_start`) → ended (`run_end outcome=all_approved`, exit 0) or stopped (`run_stop`, exit 1–6).

### Event
<!-- evidence: specstride-lib.sh:103-124 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

- **Fields**: one JSON object per line: `ts` (epoch seconds), `time` (ISO), `event` (the name), and, when set, `run_id`, `task`, `backend`, `feature` and `trace_id`, followed by free key/value pairs. The bash emitter writes every value as a string. The critic's Python emitter (`lib/critic.py:2417-2429`) writes the same `ts`/`time`/`event` keys with typed values.
- **Relationships**: appended to the **Run**'s `events.jsonl`. When telemetry is enabled it is also shipped to Loki and/or OTLP.
- **State transitions**: append-only.

### Last-run config
<!-- evidence: orchestrator.sh:639-685 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

- **Fields**: sourceable `KEY=%q` lines: `WORKDIR`, `SPECS`, `SPEC_FORMAT`, `FEATURE`, `PROPOSER_BACKEND`, `CRITIC_BACKEND`, `MAX_REJECTS`, `MAX_ITER`, `PROPOSER_TIMEOUT`, `PROPOSER_TIMEOUT_PHASES`, `TELEMETRY`, `LOKI_URL`, `OTEL`, `OTEL_URL`, `VERIFICATION`, `TEST_PLAN`, `GENERATE_TESTS`, `VERIFICATION_PLAN`, `VERIFICATION_COMMANDS`, `LONG_JOB_PHASE`, `LONG_JOB_CMD`, `GIT_COMMITS`, `ORCHESTRATOR`.
- **Relationships**: written twice, to the **Feature** directory and to the **Workdir state root**. `specstride resume` sources it (`specstride:577-630`).
- **State transitions**: overwritten at every run start.

### Yield artifact
<!-- evidence: proposer.sh:1186-1216, proposer.sh:1249-1330 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

- **Fields**: `contract` (`specstride-pass-yield/v1`), `reason` (non-empty), `job.mode` (`launch` with non-empty `argv`, or `adopt` with positive `pid`), optional `job.cwd` and `job.log`, `resume_when.kind` (`pid`, `exit_code_file`, `file_exists`, `file_stable`, `grep`, `command`) with `path`/`pattern` where required, `deadline_sec` (a positive integer, required) and `on_resume` (a string).
- **Relationships**: written by a proposer pass to `<feature>/yield/phase<N>-attempt<M>-<run-id>.json` (`proposer.sh:317-319`). It belongs to one **Attempt**.
- **State transitions**: written → validated → job launched or adopted → predicate polled every `SPECSTRIDE_YIELD_POLL` seconds → satisfied (a new pass resumes) or deadline/wall budget expired (exit 9; the orchestrator then halts with exit 4, `orchestrator.sh:1926-1941`). More than `SPECSTRIDE_YIELD_MAX_PER_ATTEMPT` yields → exit 9 (orchestrator exit 4).

### Learning decision
<!-- evidence: lib/learn.py:925-925, lib/learn.py:1180-1195, lib/learn.py:1276-1287 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

- **Fields**: `schema` (`specstride.learn.applied/2`), `action` (`apply` | `revert` | `evaluate`), `run_id`, `knob`, `phase`, `shape`, `value`, `previous`, `samples`, `source_runs`, `metric`, `applied_at` and `baseline`. It may also carry `reverts_run_id`, `force` and `forced_over`.
- **Relationships**: an append-only JSON-lines entry in `<feature>/learning/applied.json`. Each write also appends a `knob_adjusted` **Event**.
- **State transitions**: apply → (evaluate) → revert. A revert must name the currently active apply for that knob, phase and shape, or it is refused.

### Backend
<!-- evidence: lib/backends.py:29-62 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

- **Fields**: `name`, `roles` (ordered `(role, Qualifier)` pairs, with role `proposer` | `critic`), `stream` (the canonical stream format, or none for raw text) and `overlay` (optional `{"vars": (...), "seeds": (...)}`; no shipped entry sets it). `Qualifier.form` is `none` | `optional` | `required`, with a `label`.
- **Relationships**: `REGISTRY` holds `dsh`, `claude`, `codex`, `bebop` and `prime`, in display order. It is selected by `--proposer`/`--critic`. An entry whose `overlay` is set is the only source of an **Overlay declaration** (FR-028).
- **State transitions**: none (frozen dataclass).

### Overlay declaration
<!-- evidence: lib/backend_overlay.py:46-51, lib/backend_overlay.py:87-113, lib/backend_overlay.py:179-232 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

- **Fields**: `Declaration.key` (the registry name without qualifier), `vars` (the environment variables to redirect), `seeds` (`Seed` records: `var`, `path`, `content`) and `unset` (derived: the XDG base directories not themselves overlaid, only when `HOME` is overlaid). The scope comes from `SPECSTRIDE_<BACKEND>_OVERLAY`: unset/empty, `pass` or `attempt`.
- **Relationships**: `DECLARATIONS` is derived from the **Backend** `REGISTRY` entries whose `overlay` is set, so it is empty in the shipped tree. A missing or broken registry also yields an empty table. One declaration per **Backend** at most; `dsh` may not declare one.
- **State transitions**: none stored. The table is validated once per process (`load_declarations`). A bad declaration or scope value raises `DeclarationError`/`ScopeError`; the CLI then exits 3 and the orchestrator exits 3 (`E_SPEC`, `orchestrator.sh:353`). Scope resolution: no declaration → `none` (an explicit `pass`/`attempt` only prints a warning); declared → the value, or `pass` when unset or empty.

### Overlay tree
<!-- evidence: lib/backend_overlay.py:262-282, lib/backend_overlay.py:428-445, lib/backend_overlay.py:537-554, lib/backend_overlay.py:661-701, proposer.sh:465-489, proposer.sh:1834-1841 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->

- **Fields**: a temp directory `specstride-overlay.<key>.*` holding the marker `specstride-overlay.json` (`contract` `specstride-overlay/v1`, `backend`, `scope`, `owner_pid`, `owner_start`, `created_at`, `vars`), one `0700` subdirectory per declared variable, `specstride-overlay.env` and `specstride-overlay.gitconfig`. The Python caller sees it as `Overlay(root, backend, scope)`.
- **Relationships**: made from one **Overlay declaration** for one proposer pass (scope `pass`), one proposer process (scope `attempt`) or one CLI critic call (`critic_overlay`). Its env records reach only the harness process (`backend_overlay_exec`).
- **State transitions**: created (marker written first) → populated → used by the harness → removed after the pass or call. On a creation failure the half-made tree is removed and the pass fails. At proposer exit, `reap` removes this owner's trees. At proposer startup, `sweep` removes trees whose owner process is gone. With scope `none` no tree is ever created, which is every backend in the shipped tree.

### Verification plan
<!-- evidence: lib/verification_plan.py:1011-1035, lib/verification_plan.py:817-830 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

- **Fields**: `kind` (`verification-plan`), `version` (1), `source` (`bundleId`, `contentHash`, `projection`, `specPath`), `project` (`workdir`, `fingerprint`, `frameworks`), `obligations`, `commands`, `suites`, `gates`, `assumptions`, `ambiguities` and `unsupportedCapabilities`. Each obligation holds `id`, `title`, `phase`, `level`, `kind`, `action`, `oracle` and `witnesses`.
- **Relationships**: written to the **Run**'s `verification/verification-plan.json` when verification is not `off`. Each **Phase**'s acceptance criteria become obligations.
- **State transitions**: derived per run from the spec. It is a companion artifact and never mutates the spec.

### Reverse inventory
<!-- evidence: lib/reverse_inventory.py:821-839, lib/reverse_inventory.py:382-383 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

- **Fields**: `schema_version`, `src`, `walk` (`git` or a filesystem walk), `excludes`, `limits`, `totals`, `oversize`, `files[]` (`path`, `bytes`, `lines`, `sha256`, `language`, `role`), `skipped[]` (`path`, `reason`, `bytes`, `sha256`), `project`, `units`, `specify`, `fingerprint`, `git_head`, `git_status` and `testautomation`.
- **Relationships**: written to `<SRC>/.specstride/reverse/<slug>/inventory.json`. It is the baseline for both `reverse.py lint --baseline` and `reverse.py guard`.
- **State transitions**: written once by `reverse.py plan`. The guard re-walks the source and compares against it.
