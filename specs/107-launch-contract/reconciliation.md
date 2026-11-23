
## reconcile-2026-11-01
- a) test coverage: uncovered:PT-107-011FR004-validation-identity,PT-107-011FR005-validation-coverage,PT-107-011FR006-promotion,PT-107-C-210-derive-flags,PT-107-C-216-artifact-names,PT-107-C-218-validator,PT-107-C-219-render-command,PT-107-C-220-replace-edited,PT-107-C-221-render-exit,PT-107-C-222-render-files,PT-107-C-223-render-lines,PT-107-C-224-render-behaviour,PT-107-C-232-validate-command,PT-107-C-233-validate-flags,PT-107-C-234-validate-exit,PT-107-C-235-validate-file,PT-107-C-236-validate-lines
- b) unresolved markers: ok
- c) dangling refs: ok
- d) headers: missing:tasks.md
- e) analyze-report: ok
- notes: tasks.md frontmatter description absent;

## reconcile-2026-11-01 coverage adjudication
- [PT-107-011FR004-validation-identity] found-unlabeled: tests/parity/107/validate-identity.test.ts:30 — "T024: the valid FX-33 scenario validates and promotes (golden `valid`)" (file header cites C-236; whole T024 suite covers identity, roots and sources)
- [PT-107-011FR005-validation-coverage] found-unlabeled: tests/parity/107/validate-coverage.test.ts:23 — "T025: invalid-open-blocker — an open blocker is reported (golden)" (also line 78 for unresolved coverage)
- [PT-107-011FR006-promotion] found-unlabeled: tests/parity/107/promote.test.ts:25 — "T026: promotion keeps the key order, writes the stamp LAST, ends with a line end (C-233)" (mapping success/failure/exit 20 at lines 68 and 88)
- [PT-107-C-210-derive-flags] found-unlabeled: tests/parity/107/draft.test.ts:61 — "PT-107-C-210: the draft's id is the feature name; repository facts carry the root" (title carries the short code C-210, not the full id)
- [PT-107-C-216-artifact-names] found-unlabeled: tests/parity/107/layout-names.test.ts:21 — "T027: the layout names of the three artifacts (C-216)"
- [PT-107-C-218-validator] found-unlabeled: tests/parity/107/validate-identity.test.ts:93 — "T024: invalid-action — an action that is not an argv is refused" (with lines 105 and 118 covering checks and the verification-commands file)
- [PT-107-C-219-render-command] found-unlabeled: tests/parity/107/render.test.ts:34 — "T028: FX-34/render — a promoted contract renders exit 0 with the golden lines (C-219)"
- [PT-107-C-220-replace-edited] found-unlabeled: tests/parity/107/render.test.ts:117 — "T028: C-220 — an edited launcher is refused exit 20, unchanged, until --replace-edited"
- [PT-107-C-221-render-exit] found-unlabeled: tests/parity/107/render.test.ts:163 — "T028: C-221 — the exit codes of the render are 0, 20 and 23"
- [PT-107-C-222-render-files] found-unlabeled: tests/parity/107/bundle.test.ts:63 — "T029: the bundle holds the canonical contract and a manifest of every OTHER file (C-222)"
- [PT-107-C-223-render-lines] found-unlabeled: tests/parity/107/launcher.test.ts:111 — "T030: N-17 — the body names the bundle by its logical name AND by its hash, and passes arguments through" (file header line 3 names C-223)
- [PT-107-C-224-render-behaviour] found-unlabeled: tests/parity/107/bundle.test.ts:133 — "T029: C-224 — an inconsistent existing bundle refuses with content-addressed bundle is inconsistent" (also line 155, seeded-edit re-check)
- [PT-107-C-232-validate-command] found-unlabeled: tests/parity/107/promote.test.ts:41 — comment "C-232 — a plain validate after promotion agrees (golden `promote`)" (file header line 3 cites C-232…C-235)
- [PT-107-C-233-validate-flags] found-unlabeled: tests/parity/107/promote.test.ts:25 — "T026: promotion keeps the key order, writes the stamp LAST, ends with a line end (C-233)"
- [PT-107-C-234-validate-exit] found-unlabeled: tests/parity/107/promote.test.ts:68 — "T026: stale-sources — a changed source is exit 23 with the list (C-234)"
- [PT-107-C-235-validate-file] found-unlabeled: tests/parity/107/promote.test.ts:77 — comment "C-235 — the stdout line and the stderr list of the golden."
- [PT-107-C-236-validate-lines] found-unlabeled: tests/parity/107/validate-identity.test.ts:38 — comment "C-236 — the line of a valid launch contract." (tests compare stderr line lists against the goldens)

## reconcile-2026-11-01
- a) test coverage: ok
- b) unresolved markers: ok
- c) dangling refs: ok
- d) headers: info:no-frontmatter
- e) analyze-report: ok
