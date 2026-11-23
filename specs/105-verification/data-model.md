# Data model: Verification (feature 105)

Schemas owned by feature 100 are cited, not repeated: the check manifest
(`specstride.manifest/1`, annex D §D.8) and the fact block (`specstride.fact-block/1`, annex D §D.7).

## Entities

| Entity | Logical name | Writer | Key fields | Rules |
|---|---|---|---|---|
| Verification plan | `run:<runId>:verification:plan` | Engine at launch | `id`, `kind`, `version`, `source`, `project`, `obligations`, `commands`, `suites`, `gates`, `assumptions`, `ambiguities`, `unsupportedCapabilities`, `declaredCommands`, `contentHash` | F105-FR-011 to F105-FR-013. Frozen; replaced only by an accepted change of a source. `contentHash` and the ids are hashes over the text form of the baseline (no final line end), not the canonical record hash |
| Source binding | inside the plan, `source` | Engine | `specPath`, `format`, `projection` (`tasks-v2`), `contentHash`, `bundleId` | F105-FR-012. The projection is a record `projection`, `format`, `phases` (`n`, `title`, `criteria`), built from the canonical spec model |
| Verification obligation | inside the plan | Engine | `id` (`VO-…`), `kind`, `level`, `acceptanceRefs`, `oracle`, `witnesses`, `negativeCases`, `automationStatus` | F105-FR-014 |
| Command | inside the plan | Plan source | `id` (`CMD-…`), `declaredId`, `source`, `phase`, `executable`, `args`, `env`, `cwd`, `timeoutSec`, `stage` (`pre` is stored as `prestage`), `reusePolicy`, `detached`, `cumulative`, `kind`, `label`, `reportPath`, provenance, optional `steps`, `resource`. Never `reads`, `writes` or `sideEffects` from the verification-commands document (CQ-190) | F105-FR-015, F105-FR-016 |
| Suite, gate | inside the plan | Engine | `SUITE-phase-<N>`, `GATE-phase-<N>`, `SUITE-release`, `GATE-release`; `obligationRefs`, `suiteRefs`, `excludedCommandRefs`, `cumulative`, `required` | F105-FR-018 |
| Check manifest | `phase:<N>:manifest` | Engine at launch | As annex D §D.8. The entries are the commands of the phase itself (`SUITE-phase-<N>`); the cumulative verification gate reads the manifests of the phases it covers; every entry has `inner` true; `pin` from the check runner at launch; `searchPath` as at launch; `hash` is the canonical record hash. `reads` and `writes` of an entry only from the launch contract (`configuration.scopes`) with the provenance user configuration, the environment or a flag; otherwise absent, which means serial | F105-FR-020, F105-FR-021 |
| Verification mode in force | `run:<runId>:snapshot`, key `verification.mode` (read) | CLI at launch (feature 100, annex B §B.12) | The resolved key with its source | F105-FR-010. This feature writes no field of the run record |
| Result record of the verification gate | `attempt:<N>:<k>:<n>:verification`; `run:<runId>:verification:release` | Engine | `planId`, `planHash`, `gateId`, `phase`, `passed`, `sourceRevision`, `commands`, `buildArtifacts`, `summary` | F105-FR-009. Written once |
| Command result | inside a result record | Check runner (feature 100, annex C §C.8); `reused` and `reusedFrom` by this feature | The as-is fields of F105-FR-009; `reused`, `reusedFrom`; one field per condition the check runner returned, absent when there is none | F105-FR-009, F105-FR-032, F105-FR-033 |
| Record of staged commands | `attempt:<N>:<k>:<n>:prestage` | Engine | `kind`, `version`, `planId`, `planHash`, `phase`, `attempt`, `sourceRevision`, times, `commands`, `passed`, `summary`; per detached command a log and a status. The log is written by the process itself through the streams the engine gave it (a raw capture); what is read from it passes the ingress | F105-FR-034, F105-FR-035, F105-FR-054 |
| Plan for people | `feature:<slug>:verification:test-plan` | Engine | marker line, six sections | F105-FR-022 |
| Scaffolds | `feature:<slug>:verification:scaffolds` | Engine | one file per known test runner; the list | F105-FR-024 |

## Relations

```text
spec (canonical model) ─┐
plan sources ───────────┼─> verification plan ──> check manifest (one per phase)
commands document ──────┘          │                      │
                                   │                      ├─> check runner (annex C §C.8) ─> command results
                                   └─> phase context      │
                                                          └─> result record ─> failure summary ─> feedback
staged commands ─> record of staged commands ─(reuse rules)─> result record
```

## States

| Thing | States | Transitions |
|---|---|---|
| Detached staged command | running → completed, or `deadline_exceeded` | Never killed at the deadline |
| Verification gate of a phase attempt | passed (code 0) or failed (code 10: a command failed; code 3: the verification gate could not run) | Any code other than 0 is the same rejection with the result code 10 (F105-FR-005) |
| Staged result at the verification gate | taken over, or executed | Taken over only for the stage `prestage` under the reuse rules, and never while a loop layer is engaged in the phase attempt (F105-FR-033) |

## Validation rules

| Rule | Requirement |
|---|---|
| Mode in the closed set | F105-FR-001 |
| Places absolute, inside the working directory, no link | F105-FR-002, F105-FR-023 |
| Plan: kind, version, absolute paths, hash, source | F105-FR-013 |
| Command declaration: required fields, no repeated id, phase exists, not `detached` at stage `gate` | F105-FR-016 |
| Command declaration: `reads`, `writes`, `sideEffects` ignored with a finding; any other field that is not named ignored with a finding; `pre` stored as `prestage` | F105-FR-016 |
| A blocker of a plan source is an entry of `ambiguities`; its command is not in the plan | F105-FR-015, F105-FR-019 |
| Output of a command passes the one ingress before it is written | F105-FR-054 |
