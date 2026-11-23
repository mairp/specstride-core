# Data model: Learning (feature 106)

Entities of the spec, with their fields. Names of files are logical names of feature 100 annex B §B.5. No physical path is fixed here.

Orders of members stated below are read from the baseline code (`lib/learn.py` at `9cab15d`); task T004 captures them from the reference and corrects this file where a capture differs.

## Decision log entry (`specstride.learn.applied/2`, logical name `feature:<slug>:learning:decisions`)

Members in this order. Writer: learning. Readers: learning, validation of the launch contract (through the binding function of this feature).

| Entry | Members |
|---|---|
| `apply` | `schema`, `action`=`apply`, `run_id`, `knob`, `phase`, `shape`, `value`, `previous`, `samples`, `source_runs`, `metric`, `applied_at`, `baseline`; then `force`, `forced_over` only when forced over a quarantine |
| `revert` | `schema`, `action`=`revert`, then `auto`=`true` only on an automatic revert; then `run_id`, `reverts_run_id`, `knob`, `phase`, `shape`, `value`, `previous`; an automatic revert continues `quarantined_value`, `backend`, `reverted_ts`, `evaluated_from`, `guardrail`; every revert ends `applied_at`. (Captured order, `FX-29/quarantined` and `FX-29/revert`: `auto` stands right after `action`, not appended, and `applied_at` is the last member of an automatic revert — corrected by T004 from the capture.) |
| `evaluate` | The members of the evaluation result (table below), then `action_taken` where an action was taken, then `schema`, `action`=`evaluate`, `run_id`, `evaluated_at` (`learn.py:1736`). (Captured order, `FX-29/106-evaluate-recorded`: `knob … guardrails`, then `schema`, `action`, `run_id`, `evaluated_at`; no `action_taken` when no action was taken — equal, no correction.) |

Rules: one entry per line; a comma and a space between members; a colon and a space after a name; non-ASCII as `\uXXXX` in lower case, a character outside the basic plane as its two surrogate escapes; numbers as the baseline writes them; a line feed at the end; never rewritten (F106-FR-007). `applied_at` and `evaluated_at` are UTC to the second. A decision run id is `learn-` and twelve hexadecimal characters.

`baseline` of an `apply` entry: `backend`, `shape`, `runs`, `cost` and `wall` (lists of `[run, value]`), `guardrails` (the guardrail counts, table below).

### Evaluation result (the leading members of an `evaluate` entry)

Every result starts with `knob`, `phase`, `shape`, `evaluates_run_id`, `value`, `previous`, `reset`, `applied_runs`, `counterfactual`. What follows depends on the case (`learn.py:1508-1550`):

| Case | Further members, in order |
|---|---|
| No baseline recorded | `label`=`insufficient`, `reason`, `cost`, `wall` |
| Reset `shape` or `backend` | `backend`, `label`=`insufficient`, `cost`, `wall`, `reason` (`reset` keeps its place and holds the cause) |
| Evaluated | `backend`, `excluded_runs` (sorted), `cost`, `wall`, `label`, `applied_guardrails` (the guardrail counts of the applied arm), `guardrails` (the seven guardrail records, in the order of the table below) |

(Captured, `FX-29/106-evaluate-recorded`: a result whose baseline IS recorded keeps this third row's member order even when the label is `insufficient` because the applied arm is below the floor — `backend`, `excluded_runs`, `cost`, `wall`, `label`, `applied_guardrails`, `guardrails`, with no `reason` and no cause in `reset` (`null`). The `reason` member belongs to the first two rows only.)

`counterfactual`: `kind` (`none`, `censored`, `shorter_cap_wall_only`); with `censored` also `note`; with `shorter_cap_wall_only` also `note` and `wall` (a primary record). It never feeds the label.

A primary record (`cost`, `wall`): `n_a`, `n_b`, `r`, `mde`, `s`, `deff`, `label`; when both arms reach the floor of six, also `sd` and `mbar` after them. `n_a` is the applied arm and `n_b` the baseline arm. `sd` is the pooled deviation of the log values; `s` is the larger of `sd` and 0.50; `mbar` is the number of samples of both arms divided by the number of their episodes (runs); `deff` is 1 + (`mbar` − 1) × 0.5. `r`, `mde`, `s`, `sd` and `deff` are rounded to four decimals, `mbar` to three. Below the floor `r`, `mde`, `s` and `deff` are null.

### Guardrail counts (one record per arm)

In this order (`learn.py:1426-1448`). The attempts of an arm are the phase attempts of the phase, under the shape of the decision, in the runs of the arm.

| Member | Count |
|---|---|
| `attempts` | Phase attempts of the arm |
| `verdicts` | Phase attempts that have a verdict |
| `malformed` | Of those, the verdicts `MALFORMED` |
| `grounding_gap` | Of those, the phase attempts with at least one grounding-gap path |
| `verification_failed` | Phase attempts whose verification failed |
| `first_verdicts` | Phase attempts with a verdict and the attempt number 1 |
| `first_approved` | Of those, the approved ones |
| `diagnostician_cases` | Phase attempts with a case of the diagnostician |
| `diagnostician_grounding` | Of those, the case `grounding` |
| `episodes` | Runs that hold a phase attempt of the arm |
| `arbitration` | Of those, the runs that stopped at this phase with `max_rejects`, `gate_oscillation`, `critic_config` or `proposer_no_progress` |
| `critic_prompt_bytes` | The list of the sizes of the critic prompts that are known |

### Guardrail records (the map `guardrails`, in this order)

| Guardrail | Kind | Counted cases / trials | Record |
|---|---|---|---|
| `grounding_gap_rate` | rate, one-sided | `grounding_gap` / `verdicts` | `k_applied`, `n_applied`, `k_baseline`, `n_baseline`, `p`, `state` |
| `malformed_rate` | rate, one-sided | `malformed` / `verdicts` | as above |
| `verification` | any count | `breach` when the applied arm has a failed verification and the baseline had none; `unknown` when the applied arm has no phase attempt; else `ok` | `state`, `applied_failed`, `baseline_failed` |
| `diagnostician_grounding_share` | rate, one-sided | `diagnostician_grounding` / `diagnostician_cases` | as the rate record |
| `critic_input_size` | exact rank test | `unknown` below six sizes in either arm. k is the number of applied-arm sizes larger than the largest baseline size; p = C(n_a, k) / C(n_a + n_b, k), and 1 when k is 0; `breach` when p < 0.01 | `n_applied`, `n_baseline`, `p`, then `k` (only when both arms reach six), `state` |
| `arbitration_proxy` | rate, one-sided | `arbitration` / `episodes` | as the rate record |
| `first_attempt_approval` | rate, two-sided | `first_approved` / `first_verdicts`; p is the smaller of the upper and the lower tail | as the rate record |

A rate guardrail is `unknown`, with `p` null, below ten applied-arm trials or when the baseline has no trial. Otherwise the baseline rate is (k + 0.5) / (n + 1), p is the exact binomial tail P(X ≥ k) of the applied arm against that rate (for the two-sided guardrail the smaller of P(X ≥ k) and P(X ≤ k)), rounded to six decimals, and the state is `breach` when p < 0.01.

The signature of an evaluation (F106-FR-018) is the label, the reset, `action_taken`, `cost.n_a`, `cost.n_b`, `wall.n_a`, `wall.n_b` and the whole map `guardrails`.

## Events

The field names are those of the event catalogue held by annex X §X.6 row 73; the as-is name of the compatibility projection is in brackets, and the as-is field names the projection writes where they differ.

### Learning stream (envelope `specstride.event/1`, logical name `feature:<slug>:learning:events`; writer: learning)

| Type | Data |
|---|---|
| `learning.knob_adjusted` [`knob_adjusted`] | `knob`, `phase`, `from`, `to`, `reason`, `metric`, `samples`, `runId` [`run_id`], `revertsRunId` [`reverts_run_id`]; a revert carries `revertsRunId` and has `samples`, `metric` null |
| `learning.knob_auto_reverted` [`knob_auto_reverted`] | `knob`, `phase`, `guardrail` (the names joined by commas), `from`, `to`, `runId` [`run_id`], `revertsRunId` [`reverts_run_id`] |
| `learning.knob_evaluated` [`knob_evaluated`] | `knob`, `phase`, `label`, `action`, `reset`, `costR` [`cost_r`], `costMde` [`cost_mde`], `wallR` [`wall_r`], `wallMde` [`wall_mde`], `nApplied` [`n_applied`], `nBaseline` [`n_baseline`], `runId` [`run_id`], `evaluatesRunId` [`evaluates_run_id`] |

Three types. The as-is line of an event that the command `learn` recorded is projected to the as-is event file of the feature; the as-is line of an event that a call of the engine recorded is projected to the as-is event file of the engine start (F106-FR-021).

### Event stream of the run (writer: the engine)

| Type | Data |
|---|---|
| `learning.observed` [`learning_observed`] | `phase`, `pathRef` (the logical name of the observation). Recorded after the observation was written (F106-FR-006, F106-FR-036) |
| `integrity.events_changed` [`events_tampered`] | `phase`, `attempt`, `file` (written by the engine's bracket, F106-FR-037; an integrity event) |

The record of the pass limit that the run writes carries, for each of the two knobs, the value, its source and its arm, and whether the tamper bracket was on (F106-FR-036); the evaluation reads it to assign a run to an arm.

## Summary (`specstride.learn.summary/7`, `feature:<slug>:learning:summary`)

Members in the order the baseline writes them: `schema`, `runs`, `attempts`, `phases`, `totals`, `inputs`. Per attempt: passes, work seconds, billed cost, kill class, outcome, gate duration and live share, critic prompt size. Per phase: work samples, job-duration samples, percentiles, `runs_seen`, `other_shape_attempts`, the episodes, the pass samples, and the records of the pass limit of each run.

## Observation (`specstride.learn.observation/1`, `feature:<slug>:learning:observation:<N>`)

`schema`, `phase`, `shape`, `generated_at`, `observation` (null without telemetry), `inputs`. Overwritten whole.

## Binding (block `configuration.learning` of `specstride.launch-contract/1`)

| Field | Meaning |
|---|---|
| `mode` | `off`, `suggest` or `apply` |
| `decisions_through` | Run id of the last log line with a text `run_id`, whatever its action |
| `decisions_sha256` | Content hash (SHA-256, 64 hexadecimal digits in lower case) of the bytes of the log up to and including the first line with that run id |
| `effective` | A map from the knob to a map from the phase number, as text, to the value: for each knob, phase and shape the last line of the bound prefix that is an `apply`, a `revert` or an entry with no `action`, kept only where that line is not a `revert`. The value is not clamped |
| `source_path` | The logical name of the log, `feature:<slug>:learning:decisions` with the slug filled in; never an absolute path. Under `parity` compared through the layout table |

State: absent when the log is absent or has no run id.

## Retrospective (`specstride.retrospective/1`, `pipeline:<pipelineId>:retrospective:<hash>`; annex B §B.20, owner 106)

`schema`, `pipeline`, `contract_digest` (the launch contract hash), `generated_at`, `stages`. Per stage: `stage`, `status` (`ok` or `unavailable`), `reason`; for a located feature `workdir`, `feature_dir`, `feature`; for `ok` also `summary_schema`, `totals`, `phases` (copied from the summary), `evaluations` (lines) and `suggestions` (lines, sorted, each once, never run). The field names are the baseline's. The schema file is `contracts/schemas/retrospective.schema.json`. This feature builds the document; the command writes the file (annex B §B.5 names the CLI as its writer).

## Mode selection result

`mode`, `source` (`token`, `refusal`, `prose`, `default`), `evidence` (text).

## State transitions of a decision

```text
(none) --apply--> active --revert--> reverted
active --apply (newer, same knob, phase, shape)--> superseded
active --evaluate: breach--> auto-reverted --quarantine--> free after 6 new samples
active --off--> reverted
```

An `evaluate` entry never moves a value.

Two values are read from the log, and they differ in the state `reverted` (F106-FR-011):

| Value | Read by | In the state `reverted` |
|---|---|---|
| The value in force at run time | `resolve`, at the start of a pass | The default handed in; the arm is `baseline` |
| The replayed value | `advise` and `apply` (the current value, the base of the step window, the `previous` of a new entry) | The value the revert recorded: the `previous` of the reverted apply, which is an older learned value when two applies were stacked |
