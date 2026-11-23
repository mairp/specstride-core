# Quickstart: 153-loop-feedback-speed

How a reviewer sees each slice work **without a live run**: fixtures, fakes and recorded state
only — no engine is started against this host, no paid call is made (F153-FR-060; the owner's
quota is shared with live runs). Commands below are the *shape* of the validation `speckit-tasks`
will spell out; nothing here runs today because this stage writes no code. Entities D1–D11 are
[data-model.md](./data-model.md); records are [contracts/](./contracts/).

Prerequisites (all already true of this repository): Node ≥ 22 (tests run from source), the
per-package runner `node ../../tests/isolate.ts node --test "test/**/*.test.ts"`, fake binaries
under the fixtures of each package's `test/` tree.

## P1b — the notice carries the failure

1. Fixture: a gate result record with one failed command whose captured output holds a failing
   test line, a stack tail, a planted secret, and a planted `ignore the gate` instruction line.
2. Run the engine wiring test (`packages/cli/test/engine/`): the feedback written beside the
   record starts with `# Phase <N> deterministic verification gate rejected` (the F105-FR-006
   frame, rendered by `packages/verification`), names the failing test under
   `Failing assertions / tests:` inside `## What actually failed` with ≤ 40 failing lines and
   tails 80/40, holds the secret nowhere, shows the planted instruction only inside the fenced
   tail, and the hashed verification record itself is unchanged (compare digests).
3. Expected: the notice renders via the existing summary module; no summary producible ⇒ the
   placeholder `(failure digest unavailable — read the evidence document below)`.

## P1e — the enforced time limit

1. Fixture: a fake sleeping binary that spawns a grandchild which inherits the group.
2. Run the engine wiring tests on each of the three paths (gate, micro layer, check-runner
   service): at the declared limit the group dies (SIGTERM, then SIGKILL after the check runner's
   own grace of 2,000 ms, `GRACE_MS`), the result carries **no exit code**, signal `TIMEOUT`,
   "command timed out" in stderr, and no process outside the group was signalled.
3. Expected: the grandchild is gone (assert by pid); tests needing process groups skip with their
   reason where the host lacks them; macOS group-kill stays marked unverified.

## P2 — the loop reports on itself

1. Fixture: a recorded run directory (the frozen copy of CQ-153-18 A, or the synthetic shape of B).
2. Run the report verb against the fixture: `specstride report --feature <slug>` (in a test:
   `route(["report", "--feature", "<slug>"])`), and again with `--json`.
3. Expected: every started attempt has an `attempt.ended` with an `endCause` from row 272 (or is
   shown as unclosed, synthesized where death was joined); gate/critic/commit sums and per-command
   durations with `concurrent` flags; unknowns null; terse by default, `--json` rows per
   `contracts/schemas/report-rows.schema.json`; exit 0 with state, 1 without (CQ-153-16 A).

## P4 — pins and per-task evidence

1. Fixture: a parsed REJECTED verdict with criteria and hashes, then a file edit that changes one
   backing hash.
2. Run the critic-input tests: the next prompt block `PREVIOUSLY CONFIRMED (W9 verdict pins)`
   lists only criteria whose hash is unchanged; the changed pin is absent; on APPROVED the pins of
   the phase are gone; a load failure yields only `W9 pin load skipped`.
3. Per-task evidence: a fixture task→files map and a tree; every changed file is excerpted within
   the budget or named `NOT-SHOWN`; the checkpoint note and the handoff appear nowhere.

## P1a — the gate runs what was declared, once

1. Fixture: a verification plan with a `GATE-phase-<N>` command set; a micro ledger
   (`micro/phase<N>.json`) whose closing command set and fingerprint equal the gate binding (D1).
2. Run the gate and micro-layer tests: the gate runs the declared set of the plan through the
   F105 gate and the one check runner (never the literal `npm test` of `checkCommandOf`), with one
   `check.started` and one `check.ended` per command; the closing check is skipped with rule
   `CS-4` recorded; a differing fingerprint (`CS-3`) or command set (`CS-2`) makes it run.
3. Reuse (only if CQ-153-02 A is adopted and `verification.gate.reuse` is on; otherwise this
   fixture is skipped with the ruling id): with the tree unchanged since the in-pass close and the
   F116 pins `current`, the gate runs **zero** commands and writes a result record marked
   `reused: true` naming `reusedFrom` (the F153-FR-013/-014 record, D1's binding); edit one file
   the checks touch (or taint the batch) and the gate executes every command fresh. Under
   `parity` reuse is off: the gate always executes.

## P3 — parallel and scoped checks

1. Fixture: the static graph plus a changed-file list mapping to two workspaces, one file mapping
   to none.
2. Run the selection tests: the inner set narrows to the mapped workspaces; the unmapped file or
   a changed graph widens to the full set; the gate set is never narrowed; every admission carries
   its rule id.
3. Repository suite: `node scripts/ci-test.mjs --parallel 4` runs workspaces concurrently with
   order preserved; `--parallel 1` (or no flag) matches today's serial behaviour.

## P5a — the pass handoff

1. Fixture: a run with one failing feedback record from P1b.
2. Run the engine wiring tests: at each pass start the handoff is written fresh (≤ 6 KB,
   `carry.handoffMaxBytes`), holds F103-FR-041's list as written — the counters, the remaining
   units of work (the plan less the ledger), the tree fingerprint — among the feedback pointers
   the **pointer** to that feedback, and grounding refuses to read it; under `parity` no handoff
   is written.

## Blocked slices (P1c, P1d, P5b)

Each has fixture tests only under its recommended ruling branch, kept in the same packages but
skipped with the ruling id as the skip reason until `rulings.md` is answered: the budget halts at
`verification.redGate.limit` (CQ-153-05 A); the pre-critic step blocks before the critic with
`commit.backpressure` on (CQ-153-06 A; **SC-003: 0 critic calls on a blocked candidate** — the
blocked candidate never reaches the critic) and the in-pass command exits 0/2/1/3 (CQ-153-17 A);
groups slice deterministically, hash into the launch contract, and a group review's only durable
effect is pins (CQ-153-07 A, CQ-153-15 A).

## One pass over everything

`node scripts/ci-test.mjs` in the touched packages only — never the full suite on this host
(also see "Constraints" in [plan.md](./plan.md) and the baseline in [research.md](./research.md)).
Parity acceptance (SC-013, F153-FR-060): with the parity profile on, the characterization oracle
reports **0 results `different`** — only register-row flips (a restoration on, a new behaviour
off) are expected and each is listed.
