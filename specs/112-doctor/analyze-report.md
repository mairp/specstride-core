# Specification Analysis Report: feature 112-doctor

Date: 2026-09-30 (second analyze run). Artifacts read: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/` (README, `check-catalogue.tsv`), `tasks.md`, the constitution **v3.0.1**, and the contracts of feature 100 that this feature consumes (annex G §G.1 to §G.7, annex C, annex X §X.6/§X.7). Mechanical checks were scripts and searches; the rest was reading. The first run of 2026-09-29 and the cross-feature review are summarised at the end of this file. The user authorized automatic remediation of the findings of this run; each repair is recorded below and in `spec.md`, section "Repairs after the analyze run of 2026-09-30".

## Findings

| ID | Category | Severity | Location(s) | Summary | Recommendation | State |
|---|---|---|---|---|---|---|
| K1 | Constitution | MEDIUM | `plan.md` Constitution Check (version line, row IX) | The Constitution Check was answered against v3.0.0 and deferred the re-read of Principle IX against the weaker-proof sentence (CQ-182) to "the next analyze run of this feature"; the constitution in force is v3.0.1 | Record the re-read. The Pass stands: the weaker proof of the tool-less form is an adapter duty, recorded for every call in the record of the call (features 109, 130, 134); the doctor makes and accepts no proof, and `critic.independence` judges only whether the critic path can call tools, which the weaker proof establishes it cannot. No requirement changes. Style of features 105, 111 and 103 | **Repaired** (A-K1) |
| F1 | Inconsistency | HIGH | `spec.md` F112-FR-026 and Edge Cases; `data-model.md` "State of a check run"; `tasks.md` T018; annex G §G.7 unknown-value rule | FR-026 and the edge case ("A check id in a filter that no check has: usage error, exit 3") require a filter that accepts check ids, but FR-026's closed flag list defines none; R16 F4 names no such flag either, so CT-112-126 ("unknown check id gives exit 3") was untestable as specified | Define the surface: the flag `--check <id>`, repeatable, selecting only the named checks; unknown id is a usage error, exit 3. This is the minimal surface that satisfies FR-026, the edge case and the unknown-value rule of annex G §G.7, whose content this feature owns | **Repaired** (A-F1) |
| C1 | Coverage | HIGH | annex G §G.4 command table, row `doctor` (owner 112); `spec.md` F112-FR-030; `tasks.md` T038, T039; consumer F113-FR-023 | The contract's command table says the doctor "with the launch checks only … evaluates them without launching, for a host hook" (consumed by the guardrail host hook of feature 113), but no flag, requirement clause or task of this feature exposed that mode; FR-030 only exported the `lb` subset "for `launch`" | Define the surface: the flag `--launch-checks`, running exactly the `lb` subset, in its fixed order, through the same functions as a launch, evaluated without launching; exit code follows F112-FR-027 (exit 2 on an `lb` `fail`), which is what a guardrail hook denies on | **Repaired** (A-C1) |
| I1 | Inconsistency | LOW | `spec.md` F112-FR-019; `contracts/check-catalogue.tsv` row 39 (`sandbox.level`) | The catalogue's severity rule for `sandbox.level` adds a `fail` trigger ("a bypass flag is configured that the harness would refuse") that the text of F112-FR-019 does not state, though the spec's table allows `fail` | None required: the catalogue is the authority for severity rules (G2 preamble; the spec fixes ids, severities and flags). Optional wording alignment at the next edit of FR-019 | Open (informational) |
| I2 | Inconsistency | LOW | `tasks.md` T006 | T006 writes the tests CT-112-102 **and** CT-112-103 (CT-112-103 is the test of F112-FR-003) but its `proves:` line names only F112-FR-002; F112-FR-003 is covered by T007's `covers:` and its test precedes it, so only the metadata is imprecise | Add F112-FR-003 to the `proves:` line of T006 at the next edit of `tasks.md` | Open (informational) |
| I3 | Inconsistency | LOW | `plan.md` Constitution Check; `plan.md` "Documentation (this feature)" | Principle XX is listed under the heading "The host skill (XIII-XVII)"; the documentation tree lists `analyze-report.md` but not `repair-report.md`, which the directory holds | Cosmetic; fix at the next edit of `plan.md` | Open (informational) |

No CRITICAL finding. Both HIGH findings are repaired in place; requirements kept their ids and tests.

## Verification of the repairs

| Check | Result |
|---|---|
| K1 | `plan.md` version line says v3.0.1; the IX row records the re-read and why the Pass stands; the pattern matches features 105 (`plan.md:59`) and 111 (`plan.md:46,61`) |
| F1 | `--check <id>` is in F112-FR-026 with its rule (repeatable, only the named checks run), in `data-model.md` (Flags) and in T018; the edge case and the unknown-value rule of annex G §G.7 now name a real surface |
| C1 | `--launch-checks` is in F112-FR-026 and F112-FR-030 (the same functions as a launch, evaluated without launching, for a host hook, annex G §G.4; F113-FR-023), in `data-model.md` and in T018, T038, T039 |
| No new ids | No FR, SC, CT or task id was added or renumbered; the flag surface of a command is not a protocol-integer change (F100-FR-170 names removal and renaming) |
| Provenance | `spec.md` "Repairs after the analyze run of 2026-09-30" holds A-K1, A-F1, A-C1; no question went to the queue (both surfaces are mandated by annex G, whose content this feature owns) |

## Coverage Summary Table

All 33 functional requirements and all 9 success criteria have at least one task. Full mapping (requirement → task ids holding it in `covers:` or `proves:`):

| Requirement key | Has task? | Task IDs | Notes |
|---|---|---|---|
| F112-FR-001 | Yes | T004, T005 | Characterization CT-112-1 |
| F112-FR-002 | Yes | T002, T003, T006, T043, T044, T066 | |
| F112-FR-003 | Yes | T006, T007, T009 | T006 writes CT-112-103 (see I2) |
| F112-FR-004 | Yes | T052, T057 | |
| F112-FR-005 | Yes | T054, T057 | |
| F112-FR-006 | Yes | T001, T053, T057 | T001 is the spike |
| F112-FR-007 | Yes | T008, T009 | |
| F112-FR-008 | Yes | T009, T010 | |
| F112-FR-009 | Yes | T047, T048 | |
| F112-FR-010 | Yes | T011, T012 | |
| F112-FR-011 | Yes | T024, T025, T065 | |
| F112-FR-012 | Yes | T056, T065 | Probes supplied by the host package (out of scope); doctor side is test + catalogue rows |
| F112-FR-013 | Yes | T046, T047 | |
| F112-FR-014 | Yes | T049, T050 | |
| F112-FR-015 | Yes | T040, T041 | Re-read against Principle IX v3.0.1: unchanged (K1) |
| F112-FR-016 | Yes | T028, T029 | |
| F112-FR-017 | Yes | T030, T031 | |
| F112-FR-018 | Yes | T026, T027 | |
| F112-FR-019 | Yes | T032, T033, T065 | See I1 |
| F112-FR-020 | Yes | T034, T035 | |
| F112-FR-021 | Yes | T051 | Check registered by the owner of EP-16 (out of scope); this feature renders it |
| F112-FR-022 | Yes | T043, T044, T045 | |
| F112-FR-023 | Yes | T013, T015 | |
| F112-FR-024 | Yes | T014, T015, T060 | |
| F112-FR-025 | Yes | T020, T021, T055 | |
| F112-FR-026 | Yes | T018, T019 | Now with `--check <id>` and `--launch-checks` (A-F1, A-C1) |
| F112-FR-027 | Yes | T016, T017, T066 | Characterization CT-112-2 |
| F112-FR-028 | Yes | T058, T059 | |
| F112-FR-029 | Yes | T022, T023 | |
| F112-FR-030 | Yes | T003, T038, T039 | Now with the `--launch-checks` evaluation (A-C1) |
| F112-FR-031 | Yes | T040, T041 | |
| F112-FR-032 | Yes | T036, T037 | |
| F112-FR-033 | Yes | T067, T068 | |
| F112-SC-001 | Yes | T046, T062 | |
| F112-SC-002 | Yes | T042 | |
| F112-SC-003 | Yes | T062 | |
| F112-SC-004 | Yes | T052, T053, T064 | |
| F112-SC-005 | Yes | T060 | |
| F112-SC-006 | Yes | T061 | |
| F112-SC-007 | Yes | T044 | |
| F112-SC-008 | Yes | T055 | |
| F112-SC-009 | Yes | T063 | |

## Constitution Alignment Issues

- **K1 (repaired)**: the deferred re-read of Principle IX against v3.0.1 (CQ-182) is recorded; the row stands and no requirement changes.
- No principle is violated by the artifacts. Spot checks: XIX (budget measured in bytes at 2.8 bytes per token, build fails on a breach, F112-FR-024); VI (conformance suite and sample outside the core, T043/T044); VII (per-harness entries from the resolved registry only, F112-FR-009); XII (no secret value read or printed, F112-FR-006, F112-FR-025); XVII (`unprobed` and skips, never passes); II (the doctor never approves and never blocks, F112-FR-008); XVIII (no parity test: no baseline has a doctor; divergences DV-041, DV-048, DV-056, DV-068, DV-071).

## Unmapped Tasks

None. Every task T001 to T068 names at least one requirement or criterion in `covers:` or `proves:`; the two doc/spike tasks (T001, T066) map to F112-FR-006 and F112-FR-002/F112-FR-027.

## Metrics

- Total requirements: 42 (33 FR, 9 SC)
- Total tasks: 68
- Coverage: 100% (every FR and SC has at least one task)
- Ambiguity count: 2 found, 2 repaired (F1, C1)
- Duplication count: 0
- Critical issues: 0; HIGH: 2, both repaired; open LOW: 3 (I1 to I3, informational)

## Catalogue and consistency checks

| Check | Result |
|---|---|
| Catalogue rows | 45 data rows; ids, groups (19 distinct) and the ten `lb` rows match F112-FR-030 and the spec table; every message at most 200 bytes |
| Severity sets | Every check's severities in `contracts/check-catalogue.tsv` are within the set the spec's table gives (one rule-level addition at `sandbox.level`, I1) |
| Ids | F112-FR-001 to F112-FR-033 and F112-SC-001 to F112-SC-009, sequential, none twice; tasks T001 to T068, none renumbered |
| Test names | Every test of `spec.md` appears in `tasks.md` (CT-112-127 is not used: F112-FR-027 keeps the characterization id CT-112-2) |
| Flags | The flag list is the same in F112-FR-026, `data-model.md` and T018 after the repair (11 flags) |
| Counts in `plan.md` | 33 requirements, 9 criteria, 45 checks, 19 groups, 4 severities, 4 exit codes: all verified |

## Next Actions

1. No CRITICAL issue is open; the feature may proceed to `/speckit-implement` once its turn comes in the wave order.
2. Optional, at the next edit: I1 (state the `fail` trigger of `sandbox.level` in F112-FR-019's text), I2 (add F112-FR-003 to T006's `proves:`), I3 (heading and doc-tree cosmetics in `plan.md`).
3. Reported before and still standing, outside this feature's power: the skill-body allocation of feature 113 (800 tokens + 150 listing + 1,700 worst-case output = 160 bytes over 4,200); annex G §G.7 "Wave 1 implementations" still says "44 checks" and "a loop layer its toolchain check" (feature 100 is not edited by this run; the spec of 112 supersedes both in place).
4. T065 remains `unverified` until a macOS runner exists; T001 (the keychain spike) decides whether `unprobed` stays on Linux.

## History

- First run, 2026-09-29 (constitution v3.0.0): findings C1, G1, U1 to U3, K1-none; U1 settled as CQ-070 (`events.gateIntegrity` is the 45th check), U2 settled by rows 134 (§X.6) and 61 (§X.7), U3 open as CQ-108/CQ-150. No CRITICAL, no open HIGH.
- Cross-feature review, 2026-09-30: critic-diversity wording; new F112-FR-033 (T067, T068); the toolchain check to the owner of EP-16; the token figure 1,500; the conformance suite and sample paths; the threats section. Details in `repair-report.md`.
- This run, 2026-09-30 (constitution v3.0.1): K1, F1, C1 repaired (A-K1, A-F1, A-C1); I1 to I3 informational; coverage 100%; report rewritten in place.
