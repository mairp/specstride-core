# Data model: Launch contract

Entities of the spec, with fields in words. The top-level field names of the JSON are those of annex G §G.8. The member names inside the records are those of the baseline (the derivation tool and the contract library of mixture-of-loops at `9c88f86`), listed under "Member names" below, because the oracle compares the draft on FX-32. Two names differ from the baseline: `schema` (for `schema_version`) and `configuration.relaunch` (for `configuration.auto`).

| Entity | Fields | Rules |
|---|---|---|
| Launch contract | schema, id, status, generated_by, promotion, repository, authorized_roots, features, sources, inventory, configuration (relaunch, learning, verification, comment, scopes), coverage, findings, stages | One schema is the validator; unknown top-level key refused, a key under `x-` ignored; only validation sets `validated` |
| Feature record | path, slug, phases (number, title, line), task count, artifacts present, artifacts absent | One per feature in scope |
| Source | path, kind, content hash, line count, hash ignoring checkboxes (tasks) | Path inside authorized roots; no duplicate path; not a learning-decisions file; at least one source |
| Candidate | shell block, prerequisite, verification document | Deterministic; `candidate-only`; the reading of fences is the baseline's |
| Coverage obligation | id (`OBL-` + 12 hex), source (path, line, anchor), kind, timing, producer, disposition, stage ids, verification ids, rationale, evidence | Strict validation refuses `unresolved`, `unsupported`, `unclassified`. Settled by fact for tasks, by an answer for the rest (F107-FR-041) |
| Finding | id, severity, status, message, source, resolution, provenance | An open blocker refuses promotion |
| Judgment record (`inventory.judgment`) | items (id, kind, anchor, the ids of its choices, batch id), answers (item id, choice, provenance, the coverage ids and finding ids it settled) | Written by the first `--next-batch`, never by the plain `contract derive`; the only state of the exchange |
| Judgment item (as printed) | id, kind, anchor, excerpt, choices (id, text) | Answer must be the id of one choice; the excerpt is redacted, cut at a line end, framed as data |
| Batch (as printed) | schema, draft, id, items, remaining count, boundary | At most 8,400 bytes; boundaries are computed from the items, not stored |
| Answer | item id, choice id, provenance (who, route, harness, batch id) | Recorded in `inventory.judgment` and in every finding it wrote |
| Stage | id, kind, depends_on, cwd, action, resume action, preconditions, postconditions, recovery, evidence, writes (optional) | Kind from the registry; written by the completion of the draft, one of kind `specstride` per feature |
| Verification-commands document | commands (id, phase, executable, args, cwd, timeoutSec, optional env) | Written by the completion under `feature:<slug>:verification:commands`, in the shape of F105-FR-016; only declared commands |
| Promotion stamp | `by` (the component and the flag), `sha256` (hash of canonical form without status and promotion) | Checked on the file as written; the last key after a promotion; removed on a set-back |
| Launcher | interpreter line, marker (product, renderer version, hash of the launch contract), own-content hash, body (logical name and hash of the launch bundle) | Mode 0755; compared as a logical record |
| Launch bundle | address (20 hex), canonical contract, implementation artifacts, manifest of every other file with its hash | The hash of the launch bundle is the content hash of the manifest. Reused only when consistent |
| Comment record | text after redaction, written at launch; the hash of the text as typed, recorded first in the draft | `launch:<launchId>:comment` (annex B §B.5); the launch record holds only the hash; none in the mode `dry-run` |
| `configuration.comment` | hash, changed (one entry per option that the comment selected: option, value in force) | The hash is written by `contract derive` before it prints; `launch` compares it |
| Declaration (`configuration.scopes`) | task scope or command reads and writes, source | From user configuration, the environment or a flag; never from repository text. A command without one is undeclared and runs alone (CQ-190) |
| Error class | one of `unreadable`, `structure`, `action`, `check`, `verification-commands`, `learning`, `auto`, `open-blocker`, `unchecked-prerequisite`, `not-promoted` | Every error of validation has exactly one; exit 20; named in `--json` only (F107-FR-040, CQ-194) |

State transitions of the launch contract: `draft` (as the plain `contract derive` writes it) -> `draft`, complete (stages written, the bootstrap finding resolved; after the last answer) -> `validated` (only by promotion, on strict success); `validated` -> `draft` (failed promotion of an edited file; the stamp is removed). A `validated` contract is frozen.

## Member names

As the baseline writes them. T001 confirms each by capture; where a capture differs, this table is corrected.

| Record | Members |
|---|---|
| Top level | `schema`, `id`, `status`, `generated_by`, `promotion`, `repository`, `authorized_roots`, `features`, `sources`, `inventory`, `configuration`, `coverage`, `findings`, `stages` |
| `generated_by` | `tool` (the logical component `contract-derive`), `version` |
| `promotion` | `by` (`contract-validate --promote`), `sha256` |
| `repository` | `root`, `revision`, `dirty` |
| `features[]` | `path`, `slug`, `phases[]` (`number`, `title`, `line`), `task_count`, `artifacts_present`, `artifacts_absent` |
| `sources[]` | `path`, `kind`, `sha256`, `lines`, and for a task list `semantic_sha256` |
| `inventory` | `tasks`, `shell_candidates`, `prerequisites`, `verification_documents`, and after the first `--next-batch` `judgment` |
| `inventory.tasks[]` | `id`, `phase`, `line`, `checked`, `parallel_marker`, `story`, `text`, `source`; the values come from the canonical spec model |
| `inventory.shell_candidates[]` | `path`, `start_line`, `end_line`, `text`, `classification` |
| `inventory.prerequisites[]` | `id`, `source` (`path`, `line`, `anchor`), `path`, `resolved`, `present` |
| `inventory.verification_documents[]` | `path`, `valid_json`, and `error` or `feature`, `phase_map`, `commands` |
| `configuration.relaunch` | `max_relaunches`, `wall_clock_seconds` |
| `configuration.learning` | `mode`, `decisions_through`, `decisions_sha256`, `effective`, `source_path` (the block is the owner's, F106-FR-027) |
| `coverage[]` | `id`, `source` (`path`, `line`, `anchor`), `kind`, `timing`, `producer`, `disposition`, `stage_ids`, `verification_ids`, `rationale`, `evidence` |
| `findings[]` | `id`, `severity`, `status`, `message`, `source`, `resolution`, and for a judgment `provenance` |
| `stages[]` | `id`, `kind`, `depends_on`, `cwd`, `action` and `resume` (`argv`, `env`, `timeout_seconds`), `preconditions`, `postconditions` (each a check with `type`, its fields and `timing`), `recovery` (`max_attempts`, `retry_exit_codes`, `backoff_seconds`, `total_timeout_seconds`, `reason`), `evidence`, optional `writes` |

## Two readings taken from the baseline code

| Subject | Reading |
|---|---|
| Line count of a source | The file is read as UTF-8 text with every form of line end taken as one; the count is that of the baseline's split of the text into lines, in which these characters end a line: line feed, carriage return, vertical tab, form feed, the file, group and record separators, next line, line separator and paragraph separator; a last line without a line end counts. A file that is not UTF-8 has the count 0 |
| Fences of shell candidates | An opening fence stands at column 0 and is followed by nothing, `bash`, `sh`, `shell` or `console`; a closing fence may be indented. A fence of another kind opens nothing, so its closing fence opens a plain block. The first line of a candidate is the line after its opening fence, the last the line before its closing fence |
