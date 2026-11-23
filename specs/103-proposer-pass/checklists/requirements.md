# Specification Quality Checklist: Proposer pass

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-09-29
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs). The owner's constraints (TypeScript, Node 22, npm) are in `## Constraints`, as `STAGE-B-RULES.md` section 3 asks. Literals of the baseline (`iter_start`, `run_stop`, variable names) are behaviour that parity binds, not implementation
- [x] Focused on user value and business needs: the operator's halts, the cost of a changed source, the cost of a cold start
- [x] Written for non-technical stakeholders as far as the subject allows: each user story states the operator's problem before the requirement
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain. Four readings that the sources do not settle are marked `assumption: CQ-pending-<n>` and listed under "Assumptions"
- [x] Requirements are testable and unambiguous: each has a `test:` and most name the fixture families that prove them
- [x] Success criteria are measurable (F103-SC-001 to F103-SC-009)
- [x] Success criteria are technology-agnostic
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded (the out-of-scope table names an owner for each subject)
- [x] Dependencies and assumptions identified ("Contracts of feature 100 used", "Extension points", "Assumptions")

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Stage B rules

- [x] Every requirement is in the written form of `STAGE-B-RULES.md` section 4
- [x] Every kept row of the traceability files assigned to feature 103 is in the `origin:` of at least one requirement (028 FR-018 and 106 behaviour items)
- [x] Every option or switch has its value under the `parity` profile; rows 59 and 60 of annex X §X.7 (reported as 44 and 45 before the rows existed)
- [x] Every closed set that the feature owns is listed with its members and its rule for an unknown value
- [x] No closed list of harnesses; no machine-specific name; every macOS statement is `unverified`
- [x] Glossary terms only, "never bare" terms in their qualified form

## Notes

- 22 of the 43 requirements have no `origin:`: they state new behaviour from research and rulings (F103-FR-008, 010, 020, 021, the eight of G2, six of G3 and four of G4).
