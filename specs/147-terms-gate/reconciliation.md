
## reconcile-2026-11-01
- a) test coverage: uncovered:CT-147-101,CT-147-106,CT-147-107,CT-147-113,CT-147-114
- b) unresolved markers: ok
- c) dangling refs: ok
- d) headers: ok
- e) analyze-report: ok

## reconcile-2026-11-01 coverage adjudication
- [CT-147-101] missing: packages/policy/tests/unit/terms.test.ts (the task T002 target path) does not exist — packages/policy has only test/ with CT-127-* suites, no terms-gate unit test for tier 3, audience, row validation or `evaluate`
- [CT-147-106] missing: no implementing test — same absent packages/policy/tests/unit/terms.test.ts; the `evaluate`-under-1 ms performance assertion and configuration-catalogue case exist nowhere in tests/ or packages/
- [CT-147-107] missing: packages/policy/tests/unit/rows.test.ts (the task T003 target path) does not exist; no front-harness/unknown-terms/distributed-default test exists anywhere
- [CT-147-113] missing: no implementing test — the `terms.override_used` event is only exercised as a schema/type in packages/observability/test/control-fallback-terms-types.test.ts:363 ("CT-111-151"), not as the row-distribution/shipped-rows/SDK-transport behaviour of this case
- [CT-147-114] missing: packages/testkit/src/conformance/EP-11/ contains only contract.test.ts (the CT-100-208 contract suite); its own header says the behaviour cases "go in this folder beside this file" — no 42-cell matrix table tests, no F147-SC-002/SC-003 assertions, no fictional-provider test overlay exist

## reconcile-2026-11-01
- a) test coverage: ok
- b) unresolved markers: ok
- c) dangling refs: ok
- d) headers: ok
- e) analyze-report: ok
