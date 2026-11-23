# Data model: Check runner (feature 148)

The check manifest (`specstride.manifest/1`) and the fact block (`specstride.fact-block/1`) are
schemas of feature 100 and are cited, not repeated.

| Entity | Where it lives | Key fields | Rules |
|---|---|---|---|
| Pin | `entries[].pin` of the manifest | kind; for `command`: absolute real path, size, hash | F148-FR-001, F148-FR-010 |
| Handle | In memory, for one check | opaque id; the process group | F148-FR-001 |
| Environment of a command | Computed, not stored: the allow-list with no provider credential, overlaid with the declared `env`; under the `parity` profile the environment of the process overlaid with the declared `env` | the variables and their values | F148-FR-002, F148-FR-019; returned by the operation `environment` of EP-05 (proposal P1 of `analyze-report.md`) |
| Result | A returned value. It is returned to the caller and is not stored by this feature. The engine stores it: for the verification gate under `attempt:<N>:<k>:<n>:verification`; for an inner check in `commands[]` of the record `specstride.check-result/1` at `unit:<unitId>:check:<i>`, whose fields feature 116 owns ("Mapping to the stored record") | `commandId`, `exitCode` or null, `signal`, `durationMs`, `stdout`, `stderr`, `passed`; `tainted`, `cached`, `flaky`, `interrupted`, `unchecked`, each a field; `reason`; `batch`, `slot`, `concurrent`; `steps`; `rerun` (the second result) | F148-FR-002 to F148-FR-004, F148-FR-016, F148-FR-017 |
| Step result | Inside the result of its command | step id, required, exit result, duration | F148-FR-008 |
| Run of steps (one execution of the steps of one command) | Inside the result | `full` or `partial`; the step it started from | F148-FR-009 |
| Fingerprint readings | Taken through the owner of the protected set, feature 116 (EP-16); compared here | before, after; declared writes left out | F148-FR-006, F148-FR-014 |
| Batch | Not stored; in the events `check.admission`, `check.started`, `check.ended` | batch id; slots; members by manifest position | F148-FR-012, F148-FR-017 |
| Admission | In the event `check.admission` | `checkId`, `batch`, `slot` (null for a refusal), `result` (`admitted`, `refused`), `reason` (row 236 of annex X §X.6) | F148-FR-012 |
| Effective parallelism | Field `verificationParallelism` of the run record (feature 100, annex E §E.2); an engine in start mode `child` puts it into the field `verificationParallelism` of its terminal record (annex B §B.15, proposal P2 of `analyze-report.md`), and the runtime root copies it; with a synthesized terminal record it is derived from the last `check.parallelism_lowered` (CQ-180) | configured value; lowered to 1 after a taint; the event `check.parallelism_lowered` | F148-FR-014 |

## States

| Thing | States | Transitions |
|---|---|---|
| Command in a check | pinned → started → ended, or cancelled | `start`; exit, time limit or `cancel` |
| Run of steps | `full`, `partial` | `partial` when it did not start at the first step |
| Parallelism of a run | configured value → 1 | On a taint of a batch; never back |

## Validation rules

| Rule | Requirement |
|---|---|
| Kind of identity is registered | F148-FR-001 |
| `verification.parallelism` between 1 and 4 | F148-FR-011 |
| Declared reads and writes come from the check manifest only, never from repository text; none means undeclared (CQ-190) | F148-FR-011 |
| Manifest hash and pin verify before every check | F148-FR-010 |
| No process of the pass alive | F148-FR-005 |
| Condition and reason in their closed sets | F148-FR-003 |

## Mapping to the stored record

The result of this feature is a returned value. The record stored at `unit:<unitId>:check:<i>` is
`specstride.check-result/1`; feature 116 owns its fields
(F116-FR-023 and the section "Records owned by this feature" of its specification, and its schema
file; feature 100, annex B §B.5 and §B.20). The engine builds one element of `commands[]` from one
returned result. Where the two spellings differ, the spelling of feature 116 is the stored one.

| Field of the returned result | Field of `commands[]` of `specstride.check-result/1` | Note |
|---|---|---|
| `commandId` | `id` | The id of the entry of the check manifest |
| `exitCode` (whole number or null) | `exit` | Null when there is no exit code |
| `tainted`, `cached`, `flaky`, `interrupted`, `unchecked`, each with `reason` | `conditions.tainted`, `conditions.cached`, `conditions.flaky`, `conditions.interrupted`, `conditions.unchecked`, each with its reason | One field per condition in both |
| `exitCode` of the first and of the second execution | `observed` | The two exit results of a command that carries `flaky`. The second result as a whole (`rerun`) is not stored |
| `durationMs` | `durationMs` | — |
| Reference to the captured output (logical name, hash, size) | `outputRef` (`name`, `hash`, `bytes`) | `stdout` and `stderr` themselves are not stored in the record |
| `signal`, `stdout`, `stderr`, `passed`, `batch`, `slot`, `concurrent`, `steps`, `rerun` | No field of the owner's list | Not stored in that record. A reader never depends on them there (F100-FR-227) |

`unitId`, `ordinal`, `treeBefore`, `treeAfter`, `protectedBefore`, `protectedAfter` and
`excluded[]` of the stored record are written from what feature 116 delivers and are no fields of
the returned result.

## Events this feature needs

The types are spelled as the event catalogue of feature 111 spells types (dotted, lower case,
feature 100, annex X §X.1).

| Type | Kind | State in the catalogue | Fields of `data` |
|---|---|---|---|
| `check.started` | open | exists (second pass of feature 111, 2026-09-30) | `checkId`, `commandRef`, `runner`, `unitId`, `batch`, `slot` |
| `check.ended` | close | exists (second pass of feature 111) | `checkId`, `result`, `durationMs`, `unitId`, `condition`, `batch`, `slot`, `concurrent` |
| `check.admission` | instant | exists (second pass of feature 111) | `checkId`, `batch`, `slot`, `result`, `reason` |
| `check.parallelism_lowered` | instant | exists (second pass of feature 111) | `from`, `to`, `batch`, `phase`, `attempt`, `reason` |
| `integrity.noted` | instant | exists: `kind`, `detail` | `kind`: `manifest-hash` |
