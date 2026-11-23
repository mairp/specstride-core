
## reconcile-2026-11-01
- a) test coverage: uncovered:CT-101-19,CT-101-28
- b) unresolved markers: ok
- c) dangling refs: ok
- d) headers: missing:tasks.md
- e) analyze-report: ok
- notes: tasks.md frontmatter description absent;

## reconcile-2026-11-01 coverage adjudication
- [CT-101-19] found-unlabeled: tests/characterization/149/ct-149-01-critic-strategy.test.ts:2 — "CT-149-1 (T008) — the critic never judges in a session of the proposer (F149-FR-001; criterion F149-SC-001)" — the id itself moved to 149 in the 2026-09-29 split (specs/101-gate-and-verdict/spec.md:723: CT-101-19 → CT-149-1); the implementing test carries only the new id.
- [CT-101-28] found-unlabeled: packages/testkit/src/conformance/EP-18/ep18.conformance.test.ts:2 — "T028 of feature 149 — CONFORMANCE TEST CT-149-10 (F149-FR-010; criterion F149-SC-004)" — split mapping CT-101-28 → CT-149-10 (specs/101-gate-and-verdict/spec.md:732); no test anywhere names the old id (grep "CT-101-28" tests packages: 0 hits).

## reconcile-2026-11-01
- a) test coverage: ok
- b) unresolved markers: ok
- c) dangling refs: ok
- d) headers: info:no-frontmatter
- e) analyze-report: ok
