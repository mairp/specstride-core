# Data Model: mixture-of-loops (as-is)

**Scope**: the entities the current code at commit `9c88f86` reads, writes or passes between its scripts. There is no database: every persisted entity is a JSON or text file, and every in-memory entity is a Python `dict` or `@dataclass`. Nothing below is proposed; each entity is followed by the evidence comment that grounds it.

Persisted entities live in two places: the **launch contract** file the operator names (`LAUNCH_CONTRACT`), and the **artifact directory** `.mixture-of-loops/` beside the rendered launcher (`generated/<id>/<hash>/` and `runs/<id>/`).

## Launch contract and its parts

### LaunchContract
<!-- evidence: skills/mixture-of-loops/assets/launch-contract.schema.json:1-44 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

The JSON document that describes one pipeline. Written first by `bootstrap_contract.py`, completed by the model, promoted by `validate_contract.py --promote`, and copied (canonicalized) into a bundle by `render_launcher.py`.

**Fields** (schema `required` in bold): **`schema_version`** (const `"1.0"`), **`id`** (kebab-case `^[a-z0-9]+(?:-[a-z0-9]+)*$`; the bootstrap joins feature directory names with `-and-`), **`status`** (`draft` | `validated`), `generated_by` (object; bootstrap writes `{"tool": "mixture-of-loops/bootstrap_contract.py", "version": "1.0"}`), `promotion` (PromotionStamp), **`repository`** (`root`, `revision`, `dirty`), **`authorized_roots`** (≥1 path), `features` (FeatureRecord[]), **`sources`** (Source[], ≥1), `inventory` (object: `tasks`, `shell_candidates`, `prerequisites`, `verification_documents`), `configuration` (object; see AutoBudget and LearningBinding; the bootstrap also writes `color`, `specstride_live`, `agent_stream`, `live_detail`, `telemetry`), **`coverage`** (CoverageObligation[]), **`findings`** (Finding[]), **`stages`** (Stage[]). `additionalProperties` is `false` at the top level.

**Relationships**: owns its Sources, Features, CoverageObligations, Findings and Stages; is embedded in exactly one Bundle per distinct canonical content; identifies one RunState directory `runs/<id>/`.

**State transitions**: `(absent)` → `draft` (bootstrap, with the open blocker `semantic-derivation-required`) → `validated` + PromotionStamp (`--promote`, only when strict validation passes) → back to `draft` (`--promote` on a contract that fails strict validation). A `validated` status without a matching stamp is refused by the renderer (exit 20). A validated contract whose source hashes moved is refused as stale (exit 23).

### Source
<!-- evidence: skills/mixture-of-loops/assets/launch-contract.schema.json:44-59 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

One file the contract was derived from, bound by hash.

**Fields**: `path` (repository-relative or absolute), `kind` (string; e.g. `tasks`), `sha256` (64 hex), `semantic_sha256` (optional, 64 hex; the bootstrap writes it only for `tasks` sources so that checkbox progress does not make the contract stale), `lines` (integer ≥ 0). `additionalProperties: false`.

**Relationships**: belongs to one LaunchContract; re-hashed by `check_source_hashes` in `skills/mixture-of-loops/scripts/contract_lib.py` on every validate, render and launcher start.

**State transitions**: none stored; a mismatch between the stored and the recomputed hash makes the whole contract stale.

### FeatureRecord
<!-- evidence: skills/mixture-of-loops/scripts/bootstrap_contract.py:301-316 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

One Spec Kit feature directory the bootstrap inventoried.

**Fields**: `path`, `slug` (directory name), `phases` (parsed from `tasks.md`), `task_count`, `artifacts_present`, `artifacts_absent`.

**Relationships**: belongs to one LaunchContract; the schema types it only as `object` (`skills/mixture-of-loops/assets/launch-contract.schema.json:43`).

**State transitions**: none; written once by the bootstrap.

### CoverageObligation
<!-- evidence: skills/mixture-of-loops/assets/launch-contract.schema.json:88-117 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

One execution-relevant obligation found in a source (a task, a prerequisite, a verification, a decision or an operation) and how the pipeline answers it.

**Fields**: `id`, `source` (`path`, `line` ≥ 1, `anchor`), `kind` (`implementation` | `prerequisite` | `verification` | `decision` | `operation`), `timing` (string; the bootstrap writes `specstride-phase:<phase>` or `unclassified`), `producer` (string; the bootstrap writes `unclassified`), `disposition` (`mapped` | `optional` | `out-of-scope` | `unresolved` | `unsupported`), `stage_ids`, `verification_ids`, `rationale`, `evidence`.

**Relationships**: references Stages by `stage_ids`; anchored to one Source line.

**State transitions**: bootstrap writes every task as `disposition: unresolved`, `producer: unclassified` (`skills/mixture-of-loops/scripts/bootstrap_contract.py:321-336`); the model reclassifies it. Only a draft may keep `unresolved`/`unclassified` (`skills/mixture-of-loops/scripts/contract_lib.py:40-44`).

### Finding
<!-- evidence: skills/mixture-of-loops/assets/launch-contract.schema.json:118-132 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

A recorded issue with the derivation.

**Fields**: `id`, `severity` (`info` | `warning` | `blocker`), `status` (`open` | `resolved` | `accepted`), `message`, `source` (object), `resolution`.

**Relationships**: belongs to one LaunchContract. An `open` `blocker` prevents promotion.

**State transitions**: the bootstrap writes one `open` `blocker` `semantic-derivation-required` (`skills/mixture-of-loops/scripts/bootstrap_contract.py:366-375`); the model moves it to `resolved` when derivation is complete. While any blocker is `open`, `--promote` exits 20 and leaves `draft`.

### Stage
<!-- evidence: skills/mixture-of-loops/assets/launch-contract.schema.json:133-151 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

One step of the executable pipeline.

**Fields**: `id`, `kind` (`setup` | `decision` | `command` | `specstride` | `smoke`; legacy `wiggum` is accepted with a warning and normalized to `specstride`), `depends_on` (stage ids), `cwd`, `action` (Action), `resume` (Action used from the second attempt), `preconditions` (Check[]), `postconditions` (Check[]), `recovery` (Recovery), `evidence` (string[]).

**Relationships**: belongs to one LaunchContract; referenced by CoverageObligation `stage_ids`; recorded at run time as a StageRecord.

**State transitions**: static in the contract. Execution rules (`skills/mixture-of-loops/scripts/runtime.py:427-481`): a `setup` stage runs only with `--implement` (otherwise it passes when its postconditions already hold, else it blocks with `setup-required`); a `smoke` stage runs only with `--smoke`.

### Action
<!-- evidence: skills/mixture-of-loops/assets/launch-contract.schema.json:153-162 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

A command to run without a shell.

**Fields**: `argv` (≥1 string), `env` (object; each value is a literal string or `{"from_env": NAME, "required": bool}`), `timeout_seconds` (integer ≥ 1; default 3600 when absent, `skills/mixture-of-loops/scripts/contract_lib.py:51`).

**Relationships**: used by Stage `action`/`resume` and by `command_success` Checks. `SPECSTRIDE_LEARNING` is stripped from the inherited environment and, for a `specstride` stage, set to `off` unless the action's own `env` declares it (`skills/mixture-of-loops/scripts/runtime.py:112-144`).

**State transitions**: none.

### Check
<!-- evidence: skills/mixture-of-loops/assets/launch-contract.schema.json:163-170 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

A condition evaluated before or after a stage.

**Fields**: `type` (`file_exists` | `dir_exists` | `env_set` | `command_available` | `command_success` | `json_field_equals`), `timing` (`preflight` | `stage`; default `stage`), plus type-specific fields read by `check_condition` in `skills/mixture-of-loops/scripts/runtime.py`.

**Relationships**: belongs to a Stage as a precondition or postcondition. `preflight` checks run for every enabled stage before any stage runs; the dry run evaluates them read-only and reports a `command_success` check as `deferred` (`skills/mixture-of-loops/scripts/runtime.py:494-505`).

**State transitions**: none.

### Recovery
<!-- evidence: skills/mixture-of-loops/scripts/contract_lib.py:800-839 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

A stage's declared in-stage retry policy. The schema types it only as `object`; the fields are defined by the validator.

**Fields**: `max_attempts` (positive, default 1), `retry_exit_codes` (required when `max_attempts` > 1), `backoff_seconds` (non-negative numbers), `total_timeout_seconds` (positive), `reason` (`jsonl` path inside `authorized_roots`, `field` default `reason`, `allowed` — a non-empty string list). A `specstride` stage that retries exit 4 must carry `reason`, and its `allowed` values are limited to `RETRYABLE_STOP_REASONS` (`wall_budget`, `proposer_consecutive_errors`, `skills/mixture-of-loops/scripts/contract_lib.py:81`).

**Relationships**: belongs to one Stage; its `reason.jsonl` is read by `latest_reason` to decide whether an exit is retryable.

**State transitions**: per attempt — retry when the exit code is in `retry_exit_codes`, the read reason is `allowed`, attempts remain and the deadline has not passed; otherwise the stage ends with outcome `exit`, `timeout`, `recovery-deadline` or `exec-error:<e>` (`skills/mixture-of-loops/scripts/runtime.py:416-481`).

### AutoBudget
<!-- evidence: skills/mixture-of-loops/scripts/contract_lib.py:401-423 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

The harness-side relaunch budget, `configuration.auto`, and the effective budget derived from it.

**Fields**: declared — `max_relaunches` (0–5), `wall_clock_seconds` (> 0). Effective — `max_relaunches` (default 2), `wall_clock_seconds` (default `(relaunches + 1) × declared pipeline seconds`), `declared_pipeline_seconds`, `source` (`declared` | `default`).

**Relationships**: read by `launch` in `skills/mixture-of-loops/scripts/supervisor_lib.py` into the HarnessRunRecord's `relaunch_budget`.

**State transitions**: none in the contract; the `remaining` count lives in the HarnessRunRecord.

### LearningBinding
<!-- evidence: skills/mixture-of-loops/assets/launch-contract.schema.json:73-85 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

`configuration.learning`: a hash-bound prefix of Specstride's decision log (`learning/applied.json`).

**Fields**: `mode` (`off` | `suggest` | `apply`), `decisions_through`, `decisions_sha256`, `effective` (object of objects), `source_path`.

**Relationships**: written by `learning_block` in `skills/mixture-of-loops/scripts/bootstrap_contract.py` when an applied file exists; every `specstride` stage must declare `SPECSTRIDE_LEARNING` and `SPECSTRIDE_LEARNING_THROUGH` literals matching it.

**State transitions**: none stored; a changed decision prefix raises `LearningDecisionsChanged`, a stale-source refusal.

### PromotionStamp
<!-- evidence: skills/mixture-of-loops/scripts/contract_lib.py:955-977 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

`promotion`: proof that `validate_contract.py --promote` wrote `validated`.

**Fields**: `by` (`"validate_contract.py --promote"`), `sha256` (SHA-256 of the canonical contract without `status` and `promotion`).

**Relationships**: belongs to one LaunchContract; checked by `require_promoted` before rendering.

**State transitions**: written by `--promote`; invalidated by any later edit of the contract body.

## Generated artifacts

### Bundle
<!-- evidence: skills/mixture-of-loops/scripts/render_launcher.py:66-94 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

The content-addressed directory `.mixture-of-loops/generated/<id>/<first 20 hex of contract SHA-256>/`.

**Fields** (files): `launch-contract.json` (canonical bytes: sorted keys, compact separators, trailing newline), `runtime.py`, `contract_lib.py` (copies of the skill's scripts).

**Relationships**: one per distinct canonical contract; referenced by a GeneratedLauncher through `BUNDLE_DIR`. In memory, `Bundle` in `skills/mixture-of-loops/scripts/supervisor_lib.py:341-362` also carries `launcher`, `contract_path`, `contract`, `pipeline`, `run_dir`, `digest`, `warnings`.

**State transitions**: `(absent)` → published by an atomic directory rename; an existing bundle whose contract hash differs raises `content-addressed bundle is inconsistent`.

### GeneratedLauncher
<!-- evidence: skills/mixture-of-loops/scripts/render_launcher.py:97-111 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

The executable Bash file written at `--output`.

**Fields**: header `# mixture-of-loops-generated: renderer=1.0 contract-sha256=<hash>`, `# generated-content-sha256: <digest of the text with the digest placeholder>`, `BUNDLE_DIR="$SCRIPT_DIR/<relative bundle>"`, and an `exec python3 "$BUNDLE_DIR/runtime.py" --contract … --launch-dir "$SCRIPT_DIR" "$@"` line.

**Relationships**: points at one Bundle; its directory decides the artifact root (`skills/mixture-of-loops/scripts/contract_lib.py:563-573`).

**State transitions**: `intact` (digest matches) or `edited` (digest mismatch). The renderer refuses to replace an edited launcher without `--replace-edited`; the supervisor gate refuses to launch it (`launcher-edited`).

## Run-time records

### RunState
<!-- evidence: skills/mixture-of-loops/scripts/runtime.py:588-609 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

`runs/<id>/state.json`, owned by the runtime and written atomically.

**Fields**: `pipeline`, `contract_digest` (semantic digest), `superseded_contract_digest` (previous digest when the contract changed), `state`, `updated_at` (epoch seconds), `last_stage`, `exit_reason` (`preflight`, a stage reason, or `all-stages-complete`), `stages` (map of stage id → StageRecord).

**Relationships**: one per pipeline id, reused across relaunches; guarded by the `runs/<id>/lock` `flock`.

**State transitions**: `preflight` → `failed` (exit 21) | `ready` → `running` → `completed` (exit 0) | `failed` (exit 22) | `stopped` (signal, or child exit 6). A different contract digest resets `stages` to `{}` (`skills/mixture-of-loops/scripts/runtime.py:594-600`).

### StageRecord
<!-- evidence: skills/mixture-of-loops/scripts/runtime.py:659-683 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

One entry of `state.json` `stages`.

**Fields**: `status`, `started_at`, `finished_at`, `child_exit_code`, `reason` (`completed`, `existing-prerequisite`, `postcondition`, `stage-precondition`, `setup-required`, `interrupted`, `exit`, `timeout`, `recovery-deadline`, `exec-error:<e>`), `evidence` (copied from the Stage on completion).

**Relationships**: belongs to RunState; keyed by Stage `id`.

**State transitions**: `running` → `completed` | `failed` | `stopped`. On re-invocation a `completed` stage whose postconditions still hold is skipped (`[RESUME]`); otherwise it reruns.

### HarnessRunRecord
<!-- evidence: skills/mixture-of-loops/scripts/supervisor_lib.py:611-646 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

`runs/<id>/harness-run.json`, the supervisor's own launch record (`schema: "mixture-of-loops/harness-run/1"`).

**Fields**: `schema`, `pipeline`, `mode` (`run` | `auto`), `launcher`, `argv`, `cwd`, `contract`, `bundle`, `cmdline_markers`, `contract_digest`, `flags` (`implement`, `smoke`), `pid`, `pgid`, `launched_at`, `first_launched_at`, `launcher_log_offset`, `run_dir`, `state_path`, `launcher_log`, `launch_log`, `report_log`, `stage_count`, `relaunch_budget` (`max_relaunches`, `remaining`, `wall_clock_seconds`, `deadline`, `declared_pipeline_seconds`, `source`), `relaunches` (list), `supervision` (`interval`, `unchanged`, `signature`), and `stop_requested` (`signal`, `at`) once a stop is asked.

**Relationships**: sits beside RunState in the same run directory; never substitutes for it when reporting.

**State transitions**: written at launch; each relaunch appends to `relaunches` and decrements `relaunch_budget.remaining` (`skills/mixture-of-loops/scripts/supervisor_lib.py:649-678`); `stop` adds `stop_requested`.

### Retrospective
<!-- evidence: skills/mixture-of-loops/scripts/supervisor_lib.py:1373-1390 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

`runs/<id>/retrospectives/<contract_digest>.json`, written by `supervise.py retro`.

**Fields**: `schema` (`mol.retrospective/1`), `pipeline`, `contract_digest`, `generated_at`, `stages` (per `specstride` stage: `stage`, `status` `ok` | `unavailable`, `reason`, `workdir`, `feature_dir`, `feature`, `summary_schema`, `totals`, `phases`, `evaluations`, `suggestions`).

**Relationships**: one per contract digest under a run directory; read-only with respect to Specstride (it only suggests `specstride learn --revert` lines).

**State transitions**: none; rewritten atomically on each `retro`.

## Supervisor decisions (in memory)

### ModeDecision
<!-- evidence: skills/mixture-of-loops/scripts/supervisor_lib.py:156-168 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

**Fields**: `mode` (`generate` | `run` | `auto`), `source` (`token` | `refusal` | `prose` | `default`), `evidence`, `implement`, `smoke`.

**Relationships**: produced by `select_mode`; printed as `[MOL-MODE]`.

**State transitions**: none; absent any execution phrasing the mode is `generate` with source `default`.

### LearningDecision
<!-- evidence: skills/mixture-of-loops/scripts/supervisor_lib.py:235-265 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

**Fields**: `mode` (`off` | `suggest` | `apply`), `source`, `evidence`.

**Relationships**: produced by `select_learning_mode`; printed as `[MOL-LEARNING]`; its mode is what the bootstrap's `--learning-mode` receives per SKILL.md.

**State transitions**: none; default `off`.

### LauncherResolution
<!-- evidence: skills/mixture-of-loops/scripts/supervisor_lib.py:269-282 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

**Fields**: `launcher` (path or none), `source` (`request` | `feature-default` | `generated-marker`), `candidates`, `reason`, `detail`.

**Relationships**: produced by `resolve_launcher`; printed as `[MOL-LAUNCHER]` or `[MOL-REFUSE] action=resolve`.

**State transitions**: none.

### GateReport
<!-- evidence: skills/mixture-of-loops/scripts/supervisor_lib.py:395-422 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

**Fields**: `checks` (GateCheck: `name`, `status` `pass` | `fail` | `not-evaluated`, `reason`, `detail`), `decision` (`launch` | `refuse` | `attach`), `reason`, `detail`, `next_action`, `bundle`.

**Relationships**: produced by `gate`; the six ordered check names are `launcher-intact`, `contract-validated`, `authorized-root`, `launcher-syntax`, `launcher-dry-run`, `run-directory-free` (`skills/mixture-of-loops/scripts/supervisor_lib.py:463-464`).

**State transitions**: the first failing check decides `refuse` and marks every later check `not-evaluated`; a held run-directory lock decides `attach`.

### Observation
<!-- evidence: skills/mixture-of-loops/scripts/supervisor_lib.py:795-826 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

One reading of a launched run.

**Fields**: `status` (`starting` | `running` | `completed` | `failed` | `stopped` | `unknown-terminal` | `lock-conflict`), `pipeline`, `alive`, `run_state`, `stage_id`, `stage_index`, `stage_count`, `stage_elapsed`, `total_elapsed`, `launcher_exit`, `child_exit`, `stage_reason`, `stop_reason`, `contract_digest`, `superseded_digest`, `detail`, `evidence`, `state_path`, `launch_log_tail`, `anomalies`.

**Relationships**: built by `observe` from a HarnessRunRecord, RunState and the launcher log; its `signature()` decides whether a poll is `[MOL-HOLD]` (unchanged) or `[MOL-STATE]`.

**State transitions**: terminal when `status` is neither `starting` nor `running`; the terminal status maps to the supervisor exit via `EXIT_STATUS` (`skills/mixture-of-loops/scripts/supervisor_lib.py:91-92`).

### RelaunchDecision
<!-- evidence: skills/mixture-of-loops/scripts/supervisor_lib.py:947-960 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

**Fields**: `relaunch` (bool), `reason`, `detail`; its `justification()` adds `launcher_exit`, `child_exit`, `stage`, `stage_reason`, `stop_reason`.

**Relationships**: produced by `classify_relaunch` from an Observation and the HarnessRunRecord; appended to `relaunches` when `relaunch` is true.

**State transitions**: none; only stage reasons in `TRANSIENT_STAGE_REASONS` (`exit`, `timeout`, `recovery-deadline`, `recovery-exhausted`) can lead to a relaunch (`skills/mixture-of-loops/scripts/supervisor_lib.py:80`).

## Onboarding

### SkillLink
<!-- evidence: bin/onboard-skill:70-80 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

A symlink named `mixture-of-loops` that a harness scans, pointing at the canonical `skills/mixture-of-loops` directory.

**Fields**: harness (`codex` | `claude` | `dsh` | `pi` | `prime`), scope (`user` | `repo`), target path (per harness and scope, e.g. `$HOME/.agents/skills/mixture-of-loops` or `$REPO/.claude/skills/mixture-of-loops`), link destination (the absolute skill directory).

**Relationships**: the repository itself carries two such links, `.agents/skills/mixture-of-loops` and `.claude/skills/mixture-of-loops` (inventory role `symlink`).

**State transitions**: `missing` → `linked` (install); `linked elsewhere` → `linked` only with `--repair`; a real file or directory in the way is refused (exit 4).
