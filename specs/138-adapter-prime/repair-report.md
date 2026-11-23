# Repair report — 138-adapter-prime

Dated 2026-09-30. All paths are relative to `specs/138-adapter-prime/` unless they start with `specs/` or `docs/`.

| Item | Class | Severity | State (`done`, `not applied`, `open`) | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-138-01 | repair | critical | done, with one point open | `spec.md` F138-FR-044, -045, -046 (new), F138-FR-005, -017, -020, -042 (in place); `plan.md` row VIII, argument table, Complexity Tracking; `contracts/argument-table.json`; `contracts/descriptor-prime.json`; `contracts/capture-plan.json`; `tasks.md` T064 to T066, T068 to T070 | Verified: the proposer call switched nothing off and `HOME` was in the allow-list with no overlay. The harness has a switch for each of the four kinds (help of version 0.7.3, read on 2026-09-30). It has **no switch for its configuration directory**: the throwaway home is made by redirecting the home variable, which is unverified. Row VIII is unticked and the deviation is in Complexity Tracking. Two differences from the worklist: the opt-in of the customisations is `harnesses.prime.proposerCustomisations` (row 131), as the table of feature 100 rules, and `memory.native.proposer` is the opt-in of native memory only; memory has a requirement of its own |
| W-138-02 | repair | critical | done | `spec.md` F138-FR-004, scenario 2 of user story 5, the independent test of user story 5, the clarification of 2026-09-29, Constraints | Wording of the worklist taken ("Under every audience ... as critic"), and the bar stated for both roles. F138-FR-047 bars the automatic pick as critic without a condition |
| W-138-03 | repair | medium | done | `spec.md` F138-FR-022, line `parity:`; `research.md` D-10 | |
| W-110-03 | repair | high | done on this side; open for 100 and 110 | `spec.md` F138-FR-003, table of settings; `contracts/parity-rows.json` | The baseline reads the variable: see below |
| W-X-01 | repair | high | done | `plan.md`, "Project Type" | The package is the one of the graph. The registration of a row of another package is stated |
| W-X-04 | repair | high | done | `contracts/parity-rows.json` | `stream.capture` was the one old spelling; `stream.tap` written. The marks "proposed" of three keys removed, because `config-keys.tsv` of feature 110 holds them as confirmed |
| W-100-23 | queue | medium | done | `spec.md` F138-FR-015, table of settings | CQ-183 is queued; user configuration only |
| W-127-02 | repair | medium | done | `contracts/classifier-entries.json` | `provider_other` is `retryable: true` (annex E §E.3). §Q.1 of feature 127 had no column yet when this was written |
| W-X-05 | repair | medium | done | `spec.md`, clarification on the register | The register is cited without a count; DV-112 exists and is no longer "proposed" |
| W-X-09 | repair | medium | done | `tasks.md` T072; `plan.md` row XVII, "Target Platform" | |
| W-X-16 | repair | medium | done | `spec.md`, table "Out of scope" and Assumptions | The terms gate is 147; the secret resolvers stay 110 |
| W-X-17 | repair | medium | done | `spec.md` F138-FR-047 (new); `tasks.md` T067, T071 | |
| W-X-19 | repair | medium | done | `spec.md` F138-FR-006, table "Extension points" | `implements (an entry)` |
| W-X-21 | repair | medium | done | `tasks.md`, 14 tasks | Each `proves:` holds the requirement id; the test name stays in the task text |
| W-X-33 | repair | low | done | `spec.md` F138-FR-043 | Annex C §C.5 named in place of feature 134 |

Found while repairing, and done:

| What | Where |
|---|---|
| Parity and characterization tests were placed inside the package; the plan of feature 100 puts them in `tests/parity/<feature number>/` and `tests/characterization/<feature number>/`. The worklist does not name feature 138 for this | `plan.md`, `tasks.md` (paths of 24 test tasks) |
| `spec.md` cited `FX-07/prime-empty-variant` only. Feature 141 has a second scenario of that name in FX-18, for the proposer | `spec.md`, user story 1 and "Fixture families cited" |
| Profile rows that the requirements use and the table did not hold: 29, 30, 34, 35, 36, 39, 79, 86, 92, 131 | `spec.md`, "Rows of the `parity` profile" |

## Requirements added or changed in place

| Requirement | State | Test | Task |
|---|---|---|---|
| F138-FR-003 | changed | PT-138-C-052-*, PT-138-C-061-* | T012, T044 |
| F138-FR-004 | changed | CT-138-4 | T052 |
| F138-FR-005 | changed | CT-138-5 | T052 |
| F138-FR-006 | changed (`ep:` line) | CT-138-6 | T053 |
| F138-FR-015 | changed | CT-138-15 | T052 |
| F138-FR-017 | changed (one sentence) | PT-138-C-066-* | T043 |
| F138-FR-020 | changed | CT-138-20 | T046 |
| F138-FR-022 | changed (`parity:` line) | CT-138-22 | T046 |
| F138-FR-042 | changed (capture 5) | CT-138-42 | T060 |
| F138-FR-043 | changed | CT-138-43 | T029, T059 |
| F138-FR-044 | new | CT-138-44 | T064, T068 |
| F138-FR-045 | new | CT-138-45 | T065, T069 |
| F138-FR-046 | new | CT-138-46 | T066, T070 |
| F138-FR-047 | new | CT-138-47 | T067, T071 |

Counts now: 47 functional requirements, 11 success criteria, 72 tasks. The feature is above 45
requirements; no split was made.

## What another feature or the orchestrator must do

| Who | What | Evidence |
|---|---|---|
| 100 and 110 | `SPECSTRIDE_PRIME_FLEET_BIN` is read by the baseline and is in no alias table. Annex X §X.8 holds `SPECSTRIDE_PRIME_BIN` and `SPECSTRIDE_PRIME_AGENT_BIN` only (`specs/100-specstride/annexes/X-cross-layer.md:727`); `specs/110-config-and-terms/spec.md` holds no variable of prime. The table needs the variable, and the order: the first variable wins, the second is read when the first is unset | Baseline `9cab15d`: `proposer.sh:609` (the launcher is the first variable, else the second, else the default name) and `:610` (the message names the first variable); `lib/critic.py:2196`-`2197` and `:2257`-`2258` (the same order in the critic); `.env.example:100`-`101` (the second is called the legacy override) |
| 110 | F110-FR-020 refuses a launch when two variables reach one key and differ. The baseline does not refuse for these two: the first wins. The pair needs the exception, stated in §K.8 | The same lines |
| 110 | The two sides of the baseline differ on an empty value. The pass loop reads an empty first variable as unset (shell default expansion, `proposer.sh:609`); the critic reads only an absent variable as unset (`lib/critic.py:2196`), so an empty first variable gives the critic an empty launcher. The fixtures of the baseline set both to the empty string for bare prime. The alias table must say which reading the port takes; under `parity` the difference is observable only with a variant and an empty first variable | `proposer.sh:609`; `lib/critic.py:2196`-`2197` |
| 110 | The key `harnesses.<id>.proposerCustomisations` (row 131) is not in `config-keys.tsv`; this feature uses it with the id `prime`. Row 131 of annex X §X.7 names the owners 131 and 134: 138 is a third user | `specs/100-specstride/annexes/X-cross-layer.md:596` |
| 100 | Rows 26 and 28 of annex X §X.7 name 138 as an owner; rows 29, 30 and 131 do not, and this feature now gives their value for prime | `spec.md`, "Rows of the `parity` profile" |
| 134 | The pi adapter registers its dialect row with the function that the reader exports, from its own package; `@specstride/adapter-prime` imports nothing of it. Its plan still names `@specstride/stream` | `plan.md`, "Project Type" |
| Orchestrator | Register row DV-112: see "Register rows needed" | |
| Orchestrator | Capture (5) is new. Its first part calls no model; the other two parts are read from capture (1), which must be made in a watched home and with the four switches | `contracts/capture-plan.json` |
| Orchestrator | The coverage check does not pass, on files that are not of this feature: the register now holds DV-114 to DV-117 and the check expects 113 rows; `traceability.md` (row C-154.b, and two counts of section 4.1) is behind `traceability-items.tsv` since B-2112 of feature 126 became `translated` with DV-115 | Runs of 2026-09-30; see "Checks" |

## New questions (each with a recommended answer and its source)

| Id | Question | Sources looked at | Recommended answer | What changes if answered otherwise |
|---|---|---|---|---|
| CQ-234 | The harness has no variable for its configuration directory. Is a home made by redirecting the home variable the throwaway home of ruling 36 and Principle VIII, and what holds if a capture shows that the agent executable does not follow the home variable? | Ruling 36; Principle VIII; F100-FR-113; annex C §C.16; R9 F16; the help of the agent executable 0.7.3 | Yes. Until capture (5) has passed the fact is `unverified` and row VIII of the plan is open. If the capture fails, prime is refused at auth tier 2 (source: the reading of this feature; no report recommends an answer) | If auth tier 2 may use the real home with the customisations off, F138-FR-045 loses the overlay and the deviation becomes permanent, with a register row |
| CQ-235 | Two as-is variables reach `harnesses.prime.launcher` in an order. Does the refusal of F110-FR-020 apply to them? | Baseline lines above; F110-FR-020; review item W-110-03 | No: the order of the baseline is the one exception (source: the worklist, item W-110-03, which chooses the exception) | With the refusal, a launch with both variables set and different is refused; a register row and a waiver are needed where a fixture sets both |
| CQ-236 | What holds if the pinned version has a native memory that no switch turns off? | Ruling 37; F100-FR-082; CQ-189 | As the recommended answer of CQ-189 for dsh: reported as null, warned by the doctor, recorded per run; prime is refused as critic (source: the orchestrator's answer to CQ-189, applied to a like case) | If such a memory bars the proposer as well, F138-FR-046 refuses the launch |

## Register rows needed (with the text)

No new row. One row needs another wording.

| Row | Column | Now | Needed |
|---|---|---|---|
| DV-112 | Oracle handling | "**Waiver** on the surface `transcript` for the two variable names, in the prime scenarios of FX-01, FX-06, FX-18 and FX-26" | "**Waiver** on the surface `transcript` for the two variable names, in the scenarios of FX-01, FX-06 and FX-26 in which the prime stub is started" |

Reason: in the four prime scenarios of FX-18 (`harness-missing-prime`, `harness-missing-prime-launcher`,
`prime-variant-with-model`, `prime-empty-variant`) the pass fails before the harness starts, so the stub
records no environment and a waiver would match nothing, which fails the suite (F141-FR-022). Feature 141
writes no waiver for FX-18 already (`specs/141-parity-oracle/contracts/register-map.json`, note of DV-112).
The column "Source" of the row names owner ruling 37; the telemetry rule comes from R14 rule 7 and R9 F17.

## Checks

| Check | Result |
|---|---|
| Generator or check of its own in `contracts/tools/` | None exists in this feature |
| The six changed JSON files of `contracts/` | Each parses |
| `python3 docs/ecosystem/check-traceability.py --require-all` | Does not pass, and no error is on feature 138; its 62 items are kept, 62 of 62. The result changed between two runs of 2026-09-30, because files of `docs/ecosystem/` were being edited by others. First run: 1 error, `[h2] F126-FR-016: still cites a register row to be written (DV-new-1)`. Second run: 7 errors, four of check `[d]` (the register holds DV-114 to DV-117, beyond the 113 rows the check expects) and three of check `[f]` (`traceability.md` disagrees with `traceability-items.tsv` on B-2112 of feature 126 and on two counts of section 4.1). All are in files of the orchestrator or of feature 126 |
| Requirements without a task; duplicate task ids | None; 72 ids, 72 distinct |
| Every changed requirement read again at the end | Done; one addition came from it (the session directory variable in the allow-list of F138-FR-005) |
| Paid probes | None run. No test of Phase 10 waits for a capture |
| Introspection used | `command -v`, the version flag and the help of the agent executable only |
