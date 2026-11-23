# Specification Quality Checklist: Configuration and terms

**Purpose**: Validate specification completeness and quality before planning
**Created**: 2026-09-29
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (no library, file layout or API is named; key names, scheme names and provider terms are interface content)
- [x] Focused on the consumer's and the operator's needs
- [x] All mandatory sections completed, with the sections that STAGE-B-RULES.md adds

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous (each names its test)
- [x] Success criteria are measurable
- [x] Acceptance scenarios and edge cases are defined
- [x] Scope is bounded (out-of-scope table)
- [x] Dependencies and assumptions identified (four CQ-pending readings)

## Feature Readiness

- [x] Every requirement is in the written form of STAGE-B-RULES.md section 4
- [x] Every as-is row assigned to this feature is listed in "As-is behaviour not carried" with its register row
- [x] Every switch has a value under the `parity` profile

## Notes

- 49 requirements: above the split mark. Proposed split in analyze-report.md: G4 leaves.
