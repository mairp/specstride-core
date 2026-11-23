
## reconcile-2026-11-01
- a) test coverage: uncovered:PT-119-C-112-halted-texts,PT-119-C-114-status-lines
- b) unresolved markers: ok
- c) dangling refs: ok
- d) headers: ok
- e) analyze-report: ok

## reconcile-2026-11-01 coverage adjudication
- [PT-119-C-112-halted-texts] found-unlabeled: tests/parity/119/halted-texts.test.ts:2 — "PT-119-C-112 — the parity test of the halted texts of `status` (T035, …)" — the file exists in tests/ and its titles DO carry the id (e.g. line 58 "PT-119-C-112 PORT: the headline is `specstride status — <work>  (feature: <slug>)`"), so the premise "verbatim nowhere in tests/" is false; tasks.md T035 is still unchecked.
- [PT-119-C-114-status-lines] found-unlabeled: tests/parity/119/status-lines.test.ts:2 — "PT-119-C-114 — the parity test of the FX-28 `status` scenarios (T036, …)" — labeled cases at lines 56, 69, 80, 96; the id IS verbatim in tests/, contrary to the premise; tasks.md T036 is still unchecked.

## reconcile-2026-11-01
- a) test coverage: ok
- b) unresolved markers: ok
- c) dangling refs: ok
- d) headers: ok
- e) analyze-report: ok
