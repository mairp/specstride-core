# Quickstart: Spec input (feature 104)

Prerequisites: the packages `@specstride/spec-formats` and `@specstride/kernel` built; the fixtures of FX-09, FX-10, FX-32, FX-33 of feature 141. Tests: `tests/parity/104/`, `tests/characterization/104/`.

1. Resolve: in a workspace with two features under `specs/`, run `specstride run` with no spec: expect the listing and exit 3 (F104-FR-004).
2. Detect and validate: `specstride spec detect --specs specs/x/tasks.md` prints `speckit-tasks`; `spec validate` prints the phase count.
3. Alias: `spec detect --format openspec --specs <file>` succeeds (F104-FR-006).
4. Tick: `spec tick 1 --specs <file>` prints the count; a second run prints 0; `git diff` shows checkbox bytes only.
5. Verdict: record the sources; tick a task; the verdict is fresh; edit a task's text; the verdict is stale and names `tasks` (F104-FR-024).
6. Sample format: the conformance suite of EP-03 in the test kit registers the sample format and passes with no core change.
7. Exit codes: `spec nosuch --specs <file>` exits 2; `spec title x --specs <file>` exits 1 (F104-FR-020).

Contracts: [contracts/spec-verb.md](contracts/spec-verb.md), [contracts/verdict.md](contracts/verdict.md).
