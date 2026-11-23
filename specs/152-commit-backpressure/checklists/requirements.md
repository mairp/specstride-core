# Specification Quality Checklist: Commit backpressure

**Purpose**: Check that the specification is complete and of good quality before planning
**Created**: 2026-11-08
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs). The spec names no functions or
      layout. Code anchors appear only in Sources and Assumptions. The order of post-approval
      steps and how an approval is voided are left to the plan explicitly ("What belongs in the
      plan").
- [x] Focused on user value and business needs. The stories are told from the consumer's and
      maintainer's view: no drift, no churn, no loss on a crash, owned rules.
- [x] Written for non-technical stakeholders, as far as the house style allows. The domain
      terms (phase attempt, critic, reject limit) are the product's own vocabulary, as in specs
      101 and 149.
- [x] All mandatory sections completed: user scenarios, requirements, success criteria.

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain. The six owner rulings are `CQ-152-01` to `-06`,
      each with options and a recommendation. Requirements are written to the recommendation and
      cite it with `assumption:`.
- [x] Requirements are testable and unambiguous. There are 24 requirements, each naming a
      `CT-152-n` test, and each carries its *why*.
- [x] Success criteria are measurable. All of SC-001 to SC-008 are counts, percentages or a
      time bound.
- [x] Success criteria are technology-agnostic. SC-007 states a time ("under 1 second"), not a
      mechanism.
- [x] All acceptance scenarios are defined, for user stories 1 to 4.
- [x] Edge cases are identified (10).
- [x] Scope is clearly bounded. An in-scope paragraph and an out-of-scope table name the owners.
- [x] Dependencies and assumptions identified: the contracts used, the cross-spec amendments,
      the assumptions, and the parity rows.

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria. Each FR is cited by an
      acceptance scenario, an edge case or a success criterion.
- [x] User scenarios cover primary flows: block → retry (P1), repeated block → halt (P1),
      crash → resume (P2), rule data (P3).
- [x] Feature meets measurable outcomes defined in Success Criteria.
- [x] No implementation details leak into specification.

## Constitution coverage (stage 1 → stage 2)

Each item of "Constraints carried into stage 2" of `constitution-grounding.md`, and where the
spec states it:

| # | Constraint | Where in spec.md |
|---|---|---|
| 1 | A block voids the approval durably and before the retry | FR-001, FR-013, FR-014 |
| 2 | A retry is a new attempt: fresh session, full gate, fresh critic | FR-003 |
| 3 | Only the critic grants; the gate only withholds | FR-003 |
| 4 | The corrective block goes to the proposer only; the critic sees no block history | FR-009 |
| 5 | No secret, match text, content or output; paths are quoted, escaped and capped; a nonce | FR-010, FR-011 |
| 6 | Durable control-plane records written before the retry | FR-013 |
| 7 | A pure table with a rule id for retry or halt | FR-006 |
| 8 | Bounded by the reject limit; distinct non-transient halt; counts survive | FR-005, FR-006, FR-015 |
| 9 | The stop-reason / exit-code ruling | CQ-152-01; Closed sets |
| 10 | A switch, `parity` off, register row; the status of the 2026-11-04 rule | FR-021, FR-022; CQ-152-04, -05 |
| 11 | Rule data validated against a schema, pinned, fixed; a mid-run change halts | FR-016, FR-017 |
| 12 | Project rules only add | FR-018; L-4 |
| 13 | Phase level, on the merged tree; layers spend nothing | FR-008 |
| 14 | No control through events | FR-020 |
| 15 | Masking vectors as recorded residual risks | L-1 to L-3 |
| 16 | Stub-based tests, no paid call; parity tests required | SC-004 to SC-008 (fixtures); handed to tasks |
| 17 | No harness name in shared control flow | FR-024 |
| 18 | The corrective block is bounded | FR-012 |

## Notes

- Validation passed on the first iteration. One correction was made while checking the anchors:
  a scan hit carries `pattern`, not `rule`, so Assumptions now says how a rule id is derived for a
  registered-secret hit.
- Open owner rulings `CQ-152-01` to `-06` do not block planning. Stage 3 plans the recommended
  answer and states what changes under each other answer.
