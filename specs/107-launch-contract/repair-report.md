# Repair report — 107-launch-contract

Dated 2026-09-30. Act 8.6. Feature 107 has no item of its own; the twelve items below are pointers from `docs/ecosystem/reviews/REPAIR-WORKLIST.md`, section 2, "Feature 107". Every item was checked against the files before a change.

| Item | Class | Severity | State (`done`, `not applied`, `open`) | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-X-01 | repair | high | done | `plan.md` Summary, Technical Context (Primary Dependencies, Project Type), Project Structure, Structure Decision; `tasks.md` T002, T006, T007, T008 and every task path | Verified: the graph gives `@specstride/pipeline`, layer L5, owners 107 and 123, `mayImport` contracts, kernel, spec-formats, config. Code is in `packages/pipeline/src/contract/`. The proposal `packages/launch-contract` is withdrawn. The package may import neither the harness package nor the layer of parallel units, so delegated judgment (EP-02) and the parallel plan of `dry-run` (EP-04) reach it as ports that the command wiring in `@specstride/cli` hands over |
| W-105-03 (CQ-190) | queue | medium | done | `spec.md` F107-FR-008, F107-FR-037, Clarifications, Assumptions; `plan.md` Design points; `tasks.md` T013, T050; `data-model.md`; `research.md` row 15; `quickstart.md` step 11 | Verified: F107-FR-008 still held the clause. It left. F107-FR-037 stands and now names `configuration.scopes` (annex G §G.8), as feature 105 cites it. Both carry `assumption: CQ-190` |
| W-110-06 | repair | medium | done | `spec.md`, table "Rows of the `parity` profile", row of the ceilings; F107-FR-025 `parity:` | Verified against row 48 of annex X §X.7: "2; derived". The sentence "asks for one" left, because rows 47 and 48 exist |
| W-141-02 (CQ-194) | queue | medium | done | `spec.md` F107-FR-040 (new), "Closed sets" (one row and the table of classes), Key Entities; `tasks.md` T001, T003, T024, T025, T028, T063, T064; `data-model.md`; `research.md` row 16; `quickstart.md` step 10; `contracts/commands.md` | Verified against the contract library at `9c88f86`: the ten validators are there at the lines that feature 141 names; the body of the validator starts at line 656. The spelling of the members is that of feature 141 |
| W-X-07 | repair | medium | done | `plan.md` Constitution Check row XVIII; `tasks.md` T061; `analyze-report.md` | Verified: DV-096 and DV-097 are in the register. T061 no longer asks for them. The count of register rows left the Assumptions of `spec.md`, because the register grows during the repairs |
| W-X-10 | repair | medium | done | `spec.md` F107-FR-034 (`assumption:` line), Assumptions row CQ-038; `plan.md` Storage | Verified: `specs/100-specstride/annexes/B-state.md:246` holds the name |
| W-X-14 | repair | medium | done | `plan.md` Constitution Check, Complexity Tracking | Twenty rows with ✅ or N/A, the requirement behind each pass, v3.0.0 named. Row XX was marked as passed and is N/A: the feature runs nothing in parallel. No row is ❌ |
| W-X-20 | repair | medium | done | `tasks.md` T010, T024, T026, T028, T029, T030 | Verified: 16 names of `test:` lines were in no task (the cluster tests of C-209 to C-212, C-218 to C-224, C-232 to C-236). Each is now named in the parity task of its file. 44 names, all in a task |
| W-X-27 | repair | medium | done | `plan.md` Primary Dependencies | The plan refers to the validator of feature 100 (Ajv, research D-2) and reads no YAML |
| W-X-28 | repair | low | done | `plan.md` Testing, Project Structure; `tasks.md`, every test path | `tests/parity/107/`, `tests/characterization/107/`; the generator of the payload check is in `tests/characterization/107/payload-check/` |
| W-X-31 | repair | low | done | `spec.md` Clarifications; `plan.md`; `tasks.md` T004, T059; `research.md` row 3; `quickstart.md` step 8 | "payload check" everywhere, not only at the one line named |
| W-X-32 | repair | low | done | `spec.md` F107-FR-030; `tasks.md` T039 | The runtime is named in `## Constraints` only |

Counts: 12 done, 0 not applied, 0 open.

## Requirements added or changed in place

| Requirement | Kind | Item | Change |
|---|---|---|---|
| F107-FR-040 | added | W-141-02, CQ-194 | Every error of validation has exactly one of ten error classes; `--json` names it; exit 20. Test CT-107-18, task T063 (`proves: F107-FR-040`), implementation T064 |
| F107-FR-008 | changed | W-105-03, CQ-190 | The source reports no reads, writes or side effects from a file of the repository |
| F107-FR-037 | changed | W-105-03, CQ-190 | `configuration.scopes`; a command without a declaration of the allowed provenance is undeclared and runs alone; `divergence: DV-097` |
| F107-FR-034 | changed | W-X-10; F100-FR-229 | Logical name from annex B §B.5. The text kept is the comment after the redactor, the hash is over the text as typed, the launch record holds only the hash. Before, the spec kept the text unredacted, which differed from F100-FR-229 |
| F107-FR-030 | changed | W-X-32 | No runtime named |
| F107-FR-025 | changed | W-110-06 | `parity:` cites row 48 |

Functional requirements: 40. Success criteria: 9. Tasks: 64 (T001 to T064). Under 45 requirements; no split.

## What another feature or the orchestrator must do

| Who | What |
|---|---|
| Feature 100 (orchestrator) | Add a row to annex X §X.6 for the closed set below, and cite it in annex G §G.8 |
| Feature 141 | Replace `CQ-pending-141-2` by CQ-194 and cite F107-FR-040 as the closed set behind `FX-33/invalid-<class>`. Note that `invalid-not-promoted` is raised by the renderer at the baseline (`render_launcher.py:130` calls `require_promoted`, `contract_lib.py:969`), while FX-33 drives the verb `contract-validate`; the scenario needs the render verb, or moves to FX-34. `tasks.md` T028 of this feature runs it with the render tests |
| Features 106 and 123 | The rules behind the classes `learning` (`contract_lib.py:483`, items B-2515 to B-2517, owner 106) and `auto` (line 536, item B-2518, owner 123) are theirs; feature 107 calls them and gives their errors the class. Nothing to change if they keep the rules |
| Features 119, 122 (owners of the CLI package and of `launch`) | The verb wiring `packages/cli/src/commands/contract.ts` is new and belongs to this feature; it hands two ports to the library (harness registry with the `completion` call; the parallel plan) |
| Feature 123 | Its plan puts `CT-123-*` in `packages/pipeline/test/`; feature 100 gives `tests/characterization/123/`. Not changed by me |
| Orchestrator | The coverage check fails on rows that are not of this feature, see "Checks" |

The closed set to report, with the text of the row for annex X §X.6:

| Closed set | Members | Owner | Closed by | Unknown value |
|---|---|---|---|---|
| Error classes of the validation of a launch contract | `unreadable`, `structure`, `action`, `check`, `verification-commands`, `learning`, `auto`, `open-blocker`, `unchecked-prerequisite`, `not-promoted` | 107 | Design (the validators of the baseline; `assumption: CQ-194`) | The build fails; no class is added at run time |

Choices made where two features had to agree:

| Subject | Choice | Why |
|---|---|---|
| Spelling of the classes | That of feature 141 (`fixture-catalogue.json`, members of `invalid-<class>`) | The catalogue is the register of scenario names; the worklist names no side |
| Class `auto` | Name of the baseline kept, although the block is `configuration.relaunch` (DV-055) | The scenario is `invalid-auto`. If the owner prefers `relaunch`, features 141 and 107 change together |
| Name of the field of declarations | `configuration.scopes` | Annex G §G.8 and feature 105 |

## New questions (each with a recommended answer and its source)

None. Feature 100 is not contradicted. One remark, no question: annex B §B.5 describes the comment as "verbatim and redacted" and F100-FR-229 as "verbatim, after redaction"; this feature reads both as "the text after the redactor, with no other change".

## Register rows needed (with the text)

None. DV-096 and DV-097 exist.

## Checks

| Check | Result |
|---|---|
| Generator or check of its own in `contracts/tools/` | None exists in this feature |
| `python3 docs/ecosystem/check-traceability.py --require-all` | First run, before my changes: failed with 1 error, `[h2] F126-FR-016: still cites a register row to be written (DV-new-1)`, feature 126. Last run: failed with 7 errors, none of this feature: four `[d]` (the register holds DV-114 to DV-117, the script expects 113 rows) and three `[f]` (`traceability.md` against the TSV files, row C-154.b and the counts of section 4.1). These files are the orchestrator's. Feature 107: 79 rows assigned, 77 covered, as before the repair; the two others are the superseded rows of DV-038 |
| Test names of `test:` lines against `tasks.md` | 44 names, none without a task |
| Requirement ids | 40, each once; none renumbered |
| Paid probes | T057 only; not run |
| Not done | No Spec Kit script was run again; no product code; no file outside `specs/107-launch-contract/` was written |
