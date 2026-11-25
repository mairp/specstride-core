# Specification Quality Checklist: Concurrency and parallelism

**Purpose**: Validate the completeness and quality of `spec.md` before planning
**Created**: 2026-11-25 (re-validated the same day after four read-only validators)
**Feature**: [spec.md](../spec.md)

## Content quality

- [x] CHK001 The spec states what and why. File paths appear only in Sources and Assumptions; no FR text names a path or a symbol.
- [x] CHK002 Every requirement carries a *Why* clause (81 of 81).
- [x] CHK003 Every requirement names its switch and its behaviour under `parity` (81 `switch:` lines; G0 and G8 state that they are invariants over every switch).
- [x] CHK004 No requirement promises a saving. F154-FR-008 forbids it, and F154-FR-011 prints a ceiling with its statement.
- [x] CHK005 The mandatory sections are present: user stories, requirements, success criteria.

## Requirement completeness

- [x] CHK006 The required behaviours 1–7 of the feature input map to stories P1–P7 and groups G1–G7.
- [x] CHK007 All 18 constraints carried from stage 1 appear as requirements ("Constraints carried from stage 1" table), including the tails: the set-aside unit has no attempt kind (F154-FR-064), the critic never sees the tree (F154-FR-067), a ticked group is cancelled (F154-FR-020), the tables live in core or the layer (F154-FR-003).
- [x] CHK008 Every ruling and amendment request of stage 1 (CQ-154-02 to -10) is a Clarifications row, and the requirement text states what the spec does under the other answer.
- [x] CHK009 Every red-team channel that stage 1 marked widened or re-opened has a requirement (G8, F154-FR-068 to -081), and G8 names CQ-154-10 as its ruling.
- [x] CHK010 Behaviours already required by 142 are written as "deliver F142-FR-nnn" ("Where the spec already requires it"), behind 142's own switch.
- [x] CHK011 Every edge case named has a requirement that decides it.
- [x] CHK012 Every record named in the FRs has an entity row and a schema id (Key Entities: 14 rows).
- [x] CHK013 Every cross-spec change is a row of "Cross-spec amendments", among them F143-FR-012 (CQ-154-04) and annex D and E. No other spec is edited.
- [x] CHK014 The defaults of the host bounds when `host.limits` is on are ruled: CQ-154-14 answered A (check sets 1; sessions per account unset).
- [x] CHK015 The speculation threshold, window and depth are ruled: CQ-154-18 answered A (depth 1, window 20, 50 %), stated in F154-FR-062 and F154-FR-066.

## Requirement clarity

- [x] CHK016 "Independent" between two groups is defined only by the source CQ-154-02 rules (C with (iii)), with the fallback to serial stated (F154-FR-032).
- [x] CHK017 A "trial" is defined, with its pass mark and its reader (F154-FR-018); CQ-154-15 records that this is stricter than register rows 134 and 137.
- [x] CHK018 "Pause" is used only in Principle XVI's sense (F154-FR-045).
- [x] CHK019 The baseline of the merge check is a result whose recorded fingerprint equals the group's base snapshot (F116-FR-005), compared by the failure signature of F115-FR-019. No new check condition is added. With no such result the old rule applies (F154-FR-028).
- [x] CHK026 "Tested" for `concurrentSessions` is defined by three proofs (F154-FR-030), and the dsh adapter meets one of the three today (a recorded live check); the claude adapter none.

## Measurability

- [x] CHK020 Every success criterion is a count, a share, a byte comparison or an invariant over named fixtures (SC-001, -006 and -012 name FX-154-PLAN, -GROUPS, -SLOTS, -STAGES, -PHASES, -SPEC and FX-PAR-S).
- [x] CHK021 SC-009, SC-010 and SC-011 are measured against the record of feature 153 (R-M9, R-M16).

## Consistency

- [x] CHK022 Requirement ids F154-FR-001 to -081 are unique and contiguous.
- [x] CHK023 No requirement adds an exit code, a stop reason or a run state (F154-FR-002; "Closed sets").
- [x] CHK024 Governance is restated as a requirement and is not weakened (F154-FR-006).
- [x] CHK025 F153-FR-042 is read as the gate path; in-pass batching is out of scope and stays feature 115's follow-up (CQ-154-16 A; "Out of scope"; the amendment row).
- [x] CHK027 Every cross-reference to another spec's requirement id and every number matches its source: 118 ids and 19 numbers checked first-hand; the six mismatches found were corrected (F116-FR-008 → F116-FR-005, F105-FR-037 dropped, F143-FR-012 amended, F142-FR-017 and -018 wording, DV-088, the ledger row ranges, the two line anchors).
- [x] CHK028 Under `parity` the plan line is not printed with the option off either (F154-FR-009), so F154-SC-012 holds.

## Notes

Every ruling row is answered: 3 by the owner and 16 by research-backed recommendation on 2026-11-25,
each with its evidence anchors and the other answer kept in the requirement text. The owner may
overturn any of them; the plan treats the recommended answer as primary and the other as the
fallback branch.
