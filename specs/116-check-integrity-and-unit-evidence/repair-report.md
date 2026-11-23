# Repair report — 116-check-integrity-and-unit-evidence

Date: 2026-09-30. Followed: `docs/ecosystem/STAGE-B-REPAIR-PROMPT.md`. Every item was checked
against the files before a change. Line numbers are those after the repair.

| Item | Class | Severity | State (`done`, `not applied`, `open`) | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-116-01 | repair | medium | done | `spec.md:146` (F116-FR-003), `:272` (T-19), `:529`, `:567`; `plan.md:41`, `:58` (row III), `:153`, `:154`, `:174` (Complexity Tracking); `research.md:28`, `:49` (D-6); `data-model.md` (`classA.ignoredListings`); `contracts/schemas/protected-set.schema.json`; `tasks.md:252` (T071), T074, T077 | Verified: the plan said "always by content" twice and "not over content" in the next row. Settled from rule IR-35 (R23v, adopted by R27 D1.4), which words the cover of an ignored path as a hash of its metadata listing, and from F116-FR-003. The exception is stated. Both options of the worklist are taken: content is hashed for pinned executables and for files that a class A pattern of a profile matches, and the residual risk is recorded (row III, Complexity Tracking, T-19). The listing holds the time of the last change of status, since a proposer can set a modification time. The sources do not decide whether the listing meets Principle III for the other files: question N-1, `assumption: CQ-197`. Row III is marked as a stated deviation and no longer as passed |
| W-100-02 | repair | high | done | `contracts/README.md:22`; `spec.md:268` (threat table), `:435`, `:559`, `:352` (annex B §B.20 cited); `plan.md:39`, `:89`, `:126`, `:143`; `research.md:22`, `:75`; `tasks.md:25` | Verified against annex B §B.20, annex C §C.14, annex D §D.7 line 397, annex X §X.6 rows 27, 65, 66, 142, 143, §X.9, and the package graph: feature 100 names 116 in each. Every sentence that said feature 100 still names 115, that the package is "proposed" or that the schema ids are "reported" is replaced |
| W-X-02 | repair | high | done | `plan.md:137`, `:138`; `tasks.md:25`, `:223` (T065); `quickstart.md` scenario 2 | `packages/testkit/src/conformance/EP-16/` and `packages/testkit/src/samples/EP-16/`. T065 adds the cases of this feature beside the contract-level suite of feature 100 |
| W-110-09 | repair | medium | done | `spec.md:196` (F116-FR-014), `:375`, `:530`; `plan.md:33`; `research.md:58` (D-7); `data-model.md`; `tasks.md` T060, T062; `quickstart.md` scenario 11 | Key named: `toolchains.<id>`. Reported to feature 110 below |
| W-148-01 | repair | medium | done (own side) | `spec.md:234` (F116-FR-023), `:386` to `:431`; `data-model.md`; `contracts/schemas/check-result.schema.json`; `tasks.md` T073, T076 | The worklist says "no change" for `data-model.md:36-42`. The field names are unchanged. What was added: F100-FR-227 asks the owner to list the fields in its specification, and they stood only in `data-model.md` as "proposals of the plan". They are now in `spec.md`. The mapping `commandId` to `id`, `exitCode` to `exit` is stated on this side too |
| W-X-12 | repair | medium | done | `spec.md:435`, `:442`, `:443`; `contracts/closed-sets.json`; `contracts/README.md:9` | Rows 142 and 143 verified in annex X §X.6 lines 313, 314 |
| W-X-14 | repair | medium | done | `plan.md:51`, `:68` (row X), `:86` to `:93` | Row X: "N/A: no harness adapter; the pins of executables are Principle III". The closing statement now counts 15 passes, 4 N/A, 1 deviation |
| W-X-18 | repair | medium | done | `spec.md:177` (F116-FR-010), `:214` (F116-FR-018) | `ep: EP-03 specstride.spec-format/1 (consumes)` on both requirements that read the text and the ids of tasks |
| W-X-24 | repair | medium | done | `spec.md:230` (F116-FR-022); `plan.md:69` (row XI); `tasks.md` T072, T075 | Verified in `specs/111-event-schema-and-projection/contracts/event-catalogue.tsv:94`: `integrity.noted`, fields `kind`, `detail`. This feature emits it for the four kinds it raises |
| W-100-10 | repair | low | done (no change of the file) | `spec.md:234`, `:559`; `contracts/README.md:22` | The schema file is where annex C §C.14 names it. This feature states that it writes and delivers it |
| W-100-16 | repair | low | done | `contracts/schemas/toolchain-profile.schema.json:3`, `protected-set.schema.json:3`, `check-result.schema.json:3`; `contracts/README.md:28` | `urn:specstride:schema:specstride.toolchain/1`, `urn:specstride:schema:specstride.protected-set/1`, `urn:specstride:schema:specstride.check-result/1`. The field `schema` of the data files (`closed-sets.json` and three others) is no `$id` and is unchanged |

Counts: 11 items; 11 done, 0 not applied, 0 open.

Found while repairing and changed, inside this feature:

| Point | Change |
|---|---|
| F116-FR-006 and F116-FR-009 named no reason of `tainted` for a set changed before the check and for a failed pin | The reasons `protected-set-changed` and `pin-mismatch` of closed set row 53 (annex X §X.6) are named |
| The table "Out of scope" and the plan named feature 105 as owner of the check runner, of the pins and of row 31 | 148 (check runner, pins at launch; row 31 with 117); 105 keeps the derivation of the check manifest |

## Requirements added or changed in place

| Requirement | Kind | Item | What |
|---|---|---|---|
| F116-FR-003 | changed in place | W-116-01 | Content hashes and listing; content of the listing; the record says which; `status: unverified`; `assumption: CQ-197` |
| F116-FR-006 | changed in place | found | Reason `protected-set-changed` |
| F116-FR-009 | changed in place | found | A failed pin gives `tainted` with `pin-mismatch` |
| F116-FR-010 | changed in place | W-X-18 | `ep:` line EP-03 |
| F116-FR-014 | changed in place | W-110-09 | The key `toolchains.<id>`; `parity: not used` |
| F116-FR-018 | changed in place | W-X-18 | `ep:` line EP-03 |
| F116-FR-022 | new, test CT-116-22, tasks T072, T075 | W-X-24 | `integrity.noted` |
| F116-FR-023 | new, test CT-116-23, tasks T073, T076 | W-148-01, W-100-02 | The fields of the two records |

Now: 23 functional requirements, 3 success criteria, 77 tasks (T071 to T077 appended; no id
renumbered or reused).

### The record at `unit:<unitId>:check:<i>`, exactly

Schema id `specstride.check-result/1`; schema file
`specs/116-check-integrity-and-unit-evidence/contracts/schemas/check-result.schema.json`;
`spec.md`, "Records owned by this feature".

| Field | Type | Required |
|---|---|---|
| `schema` | the constant `specstride.check-result/1` | yes |
| `unitId` | text | yes |
| `ordinal` | whole number, the `<i>` of the logical name | yes |
| `treeBefore`, `treeAfter` | fingerprint (text) | yes |
| `protectedBefore`, `protectedAfter` | fingerprint (text) | yes |
| `commands` | list, in the order of the check manifest | yes |
| `commands[].id` | text; the check runner's `commandId` | yes |
| `commands[].exit` | whole number or null; the check runner's `exitCode` | yes |
| `commands[].conditions` | object with exactly the five fields `tainted`, `cached`, `flaky`, `interrupted`, `unchecked`; each is `false` or an object with `reason` (member of closed set row 53, or null) | yes |
| `commands[].observed` | list of two exit results, for a command that carries `flaky` | no |
| `commands[].durationMs` | whole number | no |
| `commands[].outputRef` | object with `name` (logical name), `hash`, `bytes` | no |
| `excluded` | list of objects with `id` and `reason` | no |

Not in the stored record: `signal`, `stdout`, `stderr`, `passed`, `batch`, `slot`, `concurrent`,
`steps`, `rerun` of the value that feature 148 returns. Output is kept by `outputRef`. A pass is
derived (exit 0 and every condition false) and is not stored. Freshness is derived and not stored.

## What another feature or the orchestrator must do

| Who | What |
|---|---|
| 148 | Nothing further on the mapping: read on 2026-09-30, `specs/148-check-runner/data-model.md:40` to `:53` already maps `commandId` to `id`, `exitCode` to `exit`, the five conditions, `observed`, `durationMs` and `outputRef`, equal to the list above. It cites `data-model.md` of this feature; the list is now also in `spec.md`, "Records owned by this feature". If feature 148 needs `signal`, `steps` or `rerun` in the stored record, it reports the field; this feature adds it through a minor |
| 148, 105 | Write 116 for the owner of fingerprints, the protected set and toolchain profiles (`specs/148-check-runner/spec.md:37`, `specs/105-verification/spec.md:36`; W-100-02). Both are being repaired by their own agents; the state at the time of this report was not relied on |
| 110 | Add the key `toolchains.<id>` to the key list: value a profile of `specstride.toolchain/1`; no default; trust class widening (W, snapshot p); under `parity` not used; owner 116; proposed by 116. Also: `config-keys.tsv:123` gives owner 105 for `integrity.phase_entry`; annex X §X.7 row 32 gives 116 (W-110 item on owners) |
| 100 (orchestrator) | Decide whether `toolchains.<id>` needs a row in annex X §X.7. This feature proceeds without one: the key is data and no switch |
| 100 (orchestrator) | Row 32 of annex X §X.7 says "116; 101 performs the comparison". F116-FR-012 specifies the comparison, the event and the facts. No conflict in behaviour was found; the sentence may be kept or made plainer |
| 112, orchestrator | T064 places the doctor check of toolchains in `packages/doctor/src/checks/toolchains.ts`, a package of feature 112. If checks are registered by their owners through the registration call of the kernel (F100-FR-234), the file belongs in `packages/integrity/`. No review item names it; not changed |
| Orchestrator | CQ-084 and CQ-085: the column "feature" of the queue says 115; the owner is 116 (W-ORC-21). Add question N-1 to the queue and give its number, so that the placeholder can be replaced in `spec.md:149`, `:272`, `:530`, `:541`, `:567`, `plan.md:58`, `:178`, `research.md` D-6 and `checklists/requirements.md`. Done on 2026-09-30: N-1 is CQ-197, and every place names it |

## New questions (each with a recommended answer and its source)

| # | Question | Sources looked at | Recommended answer | If answered otherwise |
|---|---|---|---|---|
| N-1 (`CQ-197`) | Rule IR-35 covers an ignored path from which a check executes (the directory of the runner, the executables of a virtual environment) by a hash of its metadata listing. Principle III (NON-NEGOTIABLE) says that a change is detected everywhere. Is the listing enough for the files of such a path that are neither pinned executables nor matched by a class A pattern of a toolchain profile? | Constitution v3.0.0, Principle III; R23v V-04 item 3, IR-35, IR-36, IR-38; R27 D1.4; `APPROVAL.md` rulings 38 and 39; F116-FR-003; review finding B-8.3b-010 | Yes for Wave 1, as a stated deviation: the listing with name, kind, size, mode, modification time and time of the last change of status; content hashes for pinned executables and for files matched by a class A pattern. Source: IR-35 for the listing. The time of the last change of status and the content hashes of matched files are the narrowest reading of this repair; no research report recommends them | Content of every file of such a path is hashed around every check: F116-FR-003 and the performance goal of the plan change, and the cost of a check grows with the dependency directory. Or the owner amends Principle III to name the limit |

## Register rows needed (with the text)

None. No requirement cites `DV-new-<n>`. DV-052 and DV-077 exist.

## Checks

| Check | Result |
|---|---|
| Generator or check of its own in `contracts/tools/` | None exists in this feature |
| JSON files of `contracts/` parse | 7 of 7 |
| `python3 docs/ecosystem/check-traceability.py --require-all` | Fails with 1 error, on another feature: `[h2] F126-FR-016: still cites a register row to be written (DV-new-1)`. No line of the output names feature 116 |
| Consistency pass | `analyze-report.md`, section "After the cross-feature review" |
| Files written | Only inside `specs/116-check-integrity-and-unit-evidence/`. No git command that changes the repository, no subagent, no model call |
