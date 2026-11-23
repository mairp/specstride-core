# Analysis report: Run control (feature 102)

Date: 2026-09-29. Read-only analysis of `spec.md`, `plan.md`, `tasks.md`, `research.md`, `data-model.md`, `contracts/`. Two passes; the first found the items marked "repaired".

## Findings

| # | Severity | Finding | Status |
|---|---|---|---|
| 1 | Medium | Task T040 did not name the run-control events of F102-FR-036 | Repaired |
| 2 | Low | A table header used the bare word "Contract" | Repaired ("Interface contract") |
| 3 | Medium | `--new-run` and `stop --jobs` have no row in annex X §X.7 | Reported: rows 44 and 45 proposed in the spec |
| 4 | Medium | Annex X §X.6 row 51 lists three refusals of `resume`; three more follow from F100-FR-049, F100-FR-158 and T-28 | Reported: extension proposed |
| 5 | Medium | The class of a key without a snapshot class: row 76 says "widening", a rule for trust classes | Reported: `pinned` proposed (CQ-079) |
| 6 | Medium | The launch record has no field for the flags of `resume` | Reported (CQ-072) |
| 7 | Low | Annex G §G.4 gives `resume` the engine codes only; the route through the runtime root and the refusal with survivors have no code | Reported (CQ-072, CQ-077) |

## Coverage

| Check | Result |
|---|---|
| Functional requirements | 37; each has a test name and at least one task |
| Success criteria | 8; each is named by a test task (`proves:`) or by T046, T047 |
| As-is rows with a kept disposition | 4 requirements and 54 items in 14 clusters, all in an `origin:`; `check-traceability.py` reports no line `[h…` for this feature |
| Test tasks | Every kept row and cluster is in the `proves:` of a parity or characterization task (T008 to T022, T026 to T030) |
| Not carried | B-0260 and B-1584, DV-024, in the spec table |
| Glossary | Qualified forms used; no bare "gate", "hook", "adapter", "tier", "bundle" |
| Harness list | No requirement names a harness |
| Machine-specific names | None |
| macOS | Both statements are `unverified` |
| Constitution | Twenty gates answered in plan.md; no violation |
| `[NEEDS CLARIFICATION]` | None |
| Feature 100 | Not edited |

## Consistency

- The order of refusals is the same in spec.md (F102-FR-012, -013, -015), data-model.md and contracts/resume-refusals.md.
- Exit codes agree with annex G §G.4 and annex E §E.4.
- Counts of requirements: 37, under the limit of about 45. No split is proposed.

## Remaining after two repairs

Nothing fails. Items 3 to 7 wait for the orchestrator.

## After the cross-feature review

Date: 2026-09-30. The feature had no item of its own and eleven pointers in `docs/ecosystem/reviews/REPAIR-WORKLIST.md`. Every pointer was checked against the file before a change. The full list is in `repair-report.md`.

### What changed

| Subject | Change | Files |
|---|---|---|
| `resume` on a workspace without state (CQ-184) | The state check of annex G §G.4 comes first and exits 1; "nothing to resume" (exit 3) is the first check of this feature's own. New test CT-102-26, task T049 | `spec.md` (F102-FR-012, user story 2, edge cases, closed sets, clarifications, assumptions), `tasks.md`, `data-model.md`, `quickstart.md`, `research.md` (D-2), `contracts/resume-refusals.md` |
| Rows of the `parity` profile | Rows 62 (`--new-run`) and 63 (`stop --jobs`) in place of the proposed rows 44 and 45 | `spec.md`, `tasks.md` (T048), `checklists/requirements.md` |
| Event types | `source.change_accepted` named in F102-FR-020 and F102-FR-036; the emitter of `unblocked` named in F102-FR-036 | `spec.md`, `data-model.md`, `tasks.md` (T037, T040), `quickstart.md`, `research.md` (D-19, D-20) |
| Terms | "engine start" for one start of the engine; "pass limit" for the limit | `spec.md`, `quickstart.md` |
| Contracts of feature 100 named in place of another feature | F102-FR-026 (annex X §X.2, row 76 of §X.6), F102-FR-036 (annex X §X.1, row 73 of §X.6) | `spec.md`, `contracts/snapshot-classes.md` |
| Extension point EP-04 | `ep:` line on F102-FR-033 | `spec.md` |
| Threats | New table: T-02, T-26 and T-28, the three threats of annex X §X.9 that name 102 | `spec.md` |
| Principle XVII | Row XVII is a pass with its reason; task T050 records the macOS result or the skip | `plan.md`, `tasks.md` |
| Core packages and files | The engine-side module reads through the kernel (F100-FR-012 as repaired) | `plan.md`, `tasks.md` (T006), `research.md` (D-21) |
| Closed sets | Rows 51 and 76 of annex X §X.6 hold what this feature proposed; the word "proposed" is gone | `spec.md`, `data-model.md` |

Findings 3, 4, 5 and 6 of the table above of 2026-09-29 are settled by feature 100: rows 62 and 63 of annex X §X.7, rows 51 and 76 of annex X §X.6, and the fields `resetCounts`, `acceptSourceChange` and `newRun` of annex B §B.7. Finding 7 is settled by the row `resume` of annex G §G.4.

### Consistency pass over the places touched

| Check | Result |
|---|---|
| Requirement without a task | None. F102-FR-012 has T031, T033, T029 and the new T049; F102-FR-020 has T035 and T037; F102-FR-036 has T039 and T040 |
| Task without a requirement | None. T049 proves F102-FR-012; T050 covers F102-FR-001 and F102-FR-007; T048 is a check of citations |
| Test without a task | None. CT-102-26 is in T049 |
| Order of the checks of `resume` | The same in `spec.md` (F102-FR-012, F102-FR-013, F102-FR-015), `data-model.md`, `contracts/resume-refusals.md`, `research.md` D-2 and `quickstart.md` step 4: state check (exit 1), then the six refusals in their order |
| Exit codes | Agree with annex G §G.4, row `resume`, as repaired |
| Row numbers of annex X §X.7 | 13, 15, 19, 41, 62, 63; each checked against the annex. No file of the feature cites row 44 or 45 as its own |
| Keys of `[SPECSTRIDE-STOP]` and `[SPECSTRIDE-CONTINUE]` | Equal to annex G §G.3 |
| Event types | Spelled as annex X §X.1 asks. `source.change_accepted` is not yet in the catalogue; see `repair-report.md` |
| Terms | No "iteration", no "next run", no "starting run" outside the record of the repairs. "Pass ceiling" in F102-FR-028 is the time ceiling of a pass, a term of annex X §X.2, and not the pass limit |
| Counts | 37 functional requirements, 8 success criteria, 50 tasks, 26 characterization tests. The same in `plan.md` and `checklists/requirements.md` |
| Placeholders | No `CQ-pending-*` and no `DV-new-*` in the feature |

## Third run: after the owner's answers

Date: 2026-09-30. Read-only pass over `spec.md`, `plan.md`, `tasks.md` against the constitution v3.0.1, then the repairs, on the owner's instruction "fix all issues found". No CRITICAL finding; one HIGH, nine MEDIUM, ten LOW. Every finding was repaired in the same round. Ids are those of the run.

| ID | Severity | Finding | Repair |
|---|---|---|---|
| I1 | High | The writer of `acceptedChanges` was stated three ways (spec: `resume`; data model: the engine; T037: a core module) | The CLI writes the snapshot at `resume` as at launch; the engine reads it, emits the event and supplies the fact. F102-FR-019, plan (Approach, tree), `data-model.md`, T037 split into T037 (CLI) and T051 (engine); D-22 |
| G1 | Medium | Continuation at `launch` and `run` had no task or file; T040 put it in `resume.ts` | One module `continue-or-new.ts` for the three commands: F102-FR-034, plan tree, T052; D-24 |
| G2 | Medium | SC-005 (complete snapshot; canary secret absent) had no test that plants a canary or checks completeness | CT-102-27, task T053; cited in F102-FR-025 |
| G3 | Medium | The runtime root's part of F102-FR-009 (stop during the backoff) had no task and no owner named | F102-FR-009 names the root (123) and the pause (127) as the processes that honour the request; out-of-scope row; T023 says so |
| U1 | Medium | The synthesized end event of a dead launch (F102-FR-014) had no type and no writer | `run.ended`, `synthesized`, cause `crash`, at T4, by the process that takes the lock; F102-FR-036 and the data model |
| U2 | Medium | The order of `unsupported-record` and `settings-invalid` lived only in derived documents | Stated in F102-FR-024 and in the closed-set row |
| U3 | Medium | The integrity event of F102-FR-022 had no type | `integrity.noted` with its `data`; a breach of row 141 is the phase gate's |
| I2 | Medium | F102-FR-010 had the engine write the as-is stop lines; plan row XI had the projection keep them, citing F102-FR-004 | The presenter renders them from the compatibility projection (annex G §G.3); the stop event carries `foundAt`; plan row XI corrected; T012, T023; D-23 |
| I3 | Medium | Seven task files were absent from the plan tree; two modules were both `stop-request.ts` | Plan tree rewritten; the CLI writer is `stop-request-writer.ts` (T004) |
| A1 | Medium | F102-FR-027 omitted rank 1, the pin of the launch contract | Named, with its scope; `contracts/snapshot-classes.md` |
| C1 | Medium | The constitution's precedence row says "run snapshot (on resume only)"; F102-FR-034 uses it at a continuing launch (CQ-075) | Annex X §X.2 already settles it; CQ-075 marked settled; the plan's Constitution Check answers the Additional Constraints; the wording of the row is reported to the owner |
| U4 | Low | T038, T041, T042, T045 had no file | Files added |
| I4 | Low | T049 sat in Polish though it belongs to the tests of US2 | Moved to Phase 4 |
| I5 | Low | T040 listed events that other tasks emit | T040 keeps `run.launched`, `counters.reset`, `unblocked`; the others are named to T023, T036, T051 |
| I6 | Low | F102-FR-021 said "two ways out" of three | The three named |
| U5 | Low | T040 did not name the EP-04 reset | Named |
| A2 | Low | The line `detected during proposer` and F102-FR-003 read as if in tension | Each line mapped to its `foundAt` in F102-FR-010 |
| G4 | Low | The performance goal of the plan had no measuring task | T047 measures it; the plan says reported, not gated |
| I7 | Low | CQ-019 still said the event type was asked of the catalogue | Settled by F111-FR-051; T048 confirms it |
| D1 | Low | F102-FR-027 and F102-FR-029 said the same thing | They cite each other as one rule |
| A3 | Low | "an older version" in F102-FR-024 | "an older schema major" |

### Consistency after the repairs

| Check | Result |
|---|---|
| Requirements | 37 functional, 8 success criteria; each has at least one task |
| Tasks | 53 (T051 to T053 new; no id renumbered); 27 characterization tests, CT-102-27 new |
| Writer of every record | Snapshot: CLI only. Events: never the CLI. Run record: never this feature. The same in `spec.md`, `plan.md`, `data-model.md`, `research.md` |
| Order of the refusals | Six, in one order, in `spec.md` (F102-FR-024, "Closed sets"), `data-model.md`, `contracts/resume-refusals.md` |
| Assumptions still open | CQ-072, CQ-073, CQ-074, CQ-077, CQ-078, CQ-079, CQ-184 (readings recorded); CQ-019, CQ-075, CQ-076 settled |
| Asked of other features | A row of annex X §X.6 and the field `foundAt` of `run.ended` (features 100, 111); the wording of the constitution's precedence row (the owner). T048 checks whether they were granted |
| Constitution | No violation; Additional Constraints answered in the plan |
