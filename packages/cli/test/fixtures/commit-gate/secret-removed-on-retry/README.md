# Fixture: `secret-removed-on-retry` (quickstart.md scenario 1)

A minimal spec of one phase and one task, and one stub `claude` executable
that is the proposer P and the critic CC of the run:

- P plants a `ghp_` GitHub token (36 characters, taken from the environment
  `STUB_SECRET`) in `creds.txt` on attempt 1 and removes the file on every
  later attempt;
- CC approves every attempt.

Used by `packages/cli/test/engine/commit-gate-retry.test.ts`
(CT-152-2, -3, -4, -9, and the no-leak and event cases T161 and T164).
