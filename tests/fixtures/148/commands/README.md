# Scripted commands of feature 148

T005. Eight commands, each a Node script with no dependency and no shell, that the tests of the
check runner run through `spawnSync`/`spawn` with a fixed argument list. Every one of them is a
real executable with an absolute path, so it can be pinned (F148-FR-001) and run as the kind
`command` runs it (F148-FR-002).

| File                       | The command of the task   | Exit result                   | What it is for                                                                                               |
| -------------------------- | ------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `pass.ts`                  | pass                      | 0                             | `passed: true`                                                                                               |
| `fail-at-step.ts`          | fail at step n            | the number of the failed step | the step runner: stop at the first failed required step, resume with `--from <n>` (F148-FR-008, F148-FR-009) |
| `slow.ts`                  | slow                      | 0 after `FIXTURE_SLEEP_MS`    | a time limit above it passes, one below it gives the time-limit result (F148-FR-004)                         |
| `never-ending.ts`          | never ending              | none of its own               | only the time limit or `cancel` ends it (F148-FR-004, `interrupted`)                                         |
| `large-output.ts`          | very large output         | 0                             | the 64000-character cap per stream (F148-FR-002, `research.md` D-9)                                          |
| `print-environment.ts`     | prints its environment    | 0                             | no provider credential outside the `parity` profile (F148-SC-002)                                            |
| `write-undeclared-file.ts` | writes an undeclared file | 0                             | a write the manifest does not declare (F148-FR-006, F148-FR-014)                                             |
| `change-protected-file.ts` | changes a protected file  | 0                             | the taint `changed-during-check` (F148-FR-006)                                                               |

Every knob is an environment variable with a default, except `FIXTURE_PROTECTED_PATH`, which
`change-protected-file.ts` requires: a fixture that guessed which file is protected would make a
taint that proves nothing. `index.ts` names the eight paths for a test that needs them.
