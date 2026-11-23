# Ablation arm of the model-tier bump

Task T027 of feature 149 (F149-FR-006, last sentence: "The option MUST have an ablation arm of its
own in the experiments of the product, and tests of its own").

> **PAID.** Every live run of this arm is paid. It MUST be logged with its cost BEFORE it starts,
> it is never run by a build job, and nothing in this repository starts it
> (feature 115, F115-FR-066, last sentence; Principle XII). Nothing of this arm was run while this
> file was written. The arm is DEFINED here and run by the owner, by hand, later.

## 1. What the arm asks

Does the model-tier bump after K rejections by the critic pay for itself?

The arm is one of the ablations by the paired design that feature 115 lists in F115-FR-066: "X9
(continuation off), X10 (escalation off), X11 (obligations index off), and **one arm for the
model-tier bump after critic rejections**". This file is that one arm. It is numbered **X13** here,
after the twelve experiments of `docs/ecosystem/architecture.md`, "The experiments"; where feature
115 assigns the arm a number of its own, 115's numbering stands and only the number changes.

## 2. The two arms

| Arm | Configuration |
|---|---|
| **A, the control** | The default configuration, unchanged. `attempt.tier_bump` is `off`, which is its default (row 24 of annex X §X.7) |
| **B, the treatment** | The default configuration with `attempt.tier_bump` **on** and `attempt.tier_bump_after` at its default **2** (row 128) |

Nothing else differs. Every other switch of annex X §X.7 holds its default in both arms, including
every other option that is off by default: the arm measures the bump alone and not a bundle.

Why the default configuration and not the `parity` configuration as the control: the bump is `off`
under `parity` (row 24), so a `parity` control would differ from arm B in more than the bump.

## 3. The paired design

The design is feature 115's, F115-FR-064, taken over without change. It is restated here because
this arm is run on its own and a reader of this file must not have to reconstruct it:

| Rule | Content |
|---|---|
| Same everything | The same commit, spec, harness version, model, effort and budgets in every arm |
| Installed copy | The product is run from an installed copy whose identity is recorded |
| Verification mode | `required` in every arm |
| Unit of pairing | The phase, started in every arm from the approved tree of the phase before |
| Order | Arms alternate ABBA |
| Time | Pass time and wait time are separated |
| Excluded | Quota pauses and time blocked on a person |
| Void pair | A pair is void when either side met an outage of a harness |
| Killed passes | Every pass ended by a time limit or a watchdog counts as killed in both arms, with hours beside the count (F115-FR-065) |

Precondition: **X0 (cost accounting) has passed** — "no paired run counts until usage is complete
or explicitly unavailable for 100 per cent of passes and totals agree within 2 per cent"
(F115-FR-066). Without X0 this arm is not started: its whole question is about cost against
quality, and an arm that cannot count cost cannot answer it.

## 4. The fixtures

The same fixtures in both arms, from the catalogue of feature 141 (`specs/141-parity-oracle/`),
taken LIVE and not on the port side — the bump changes which model answers a pass, which a stub
cannot show:

| Stratum | Fixtures | Share |
|---|---|---|
| Phases the critic rejects at least twice | FX-02 (reject then approve), FX-03 (the reject limit), FX-08 (the recovery cycle) | 50 per cent |
| Phases the critic approves first time | FX-01 | 50 per cent |

The mix is fixed before the first run, at 50:50, and both strata are reported apart
(F115-FR-065). The second stratum carries no rejection, so the bump can never fire in it; it is in
the mix on purpose, as the measure of the cost the option adds to the phases it cannot help. A
stratum that the option cannot reach must show NO difference, which is the arm's own check on
F149-FR-003.

Scenarios of FX-05, FX-06, FX-07 and FX-14 are **not** in the mix: their phase attempts end
MALFORMED, at a configuration error or at a failed verification gate, none of which counts towards
K (F149-FR-004), so they can only add noise and cost.

## 5. The measures

Per pair of phases, and reported per stratum:

| # | Measure | Unit |
|---|---|---|
| M1 | Phases approved | count, and share of pairs |
| M2 | Phase attempts to approval | count per approved phase |
| M3 | Rejections by the critic to approval | count per approved phase |
| M4 | Wall-clock to approval | minutes per approved phase, pass time and wait time apart |
| M5 | Cost to approval | USD and tokens per approved phase, from the recorded usage of X0 |
| M6 | Passes killed by a time limit or a watchdog | count, with hours beside it |
| M7 | Phases that reached the reject limit | count |
| M8 | Bumps made, and bumps skipped by reason | count per reason (`ladder-top`, `critic-model`, `quota-exhausted`), from the events `ep18.attempt.tier-bump` and `ep18.attempt.tier-bump-skipped` |
| M9 | Critic-diversity warnings raised | count |

M8 and M9 are of arm B alone: arm A has no planner of the bump in its order of the seam and raises
neither event. They are not comparisons; they are the record that the arm did what it says, and
M8 at 0 bumps voids the arm rather than showing the option has no effect.

## 6. The pass marks

The arm is decided on the stratum of rejected phases. The marks are proposals of this feature; the
owner sets the final numbers before the first run, as for every experiment of the product.

| Mark | Condition |
|---|---|
| **P1, it works** | M3 falls by at least 0.5 rejections per approved phase, and M1 does not fall |
| **P2, it is affordable** | M5 rises by no more than 25 per cent per approved phase |
| **P3, it costs nothing where it cannot help** | On the stratum of first-time approvals every measure M1 to M7 is within the noise of the arm, and M8 is 0 |
| **P4, it is quiet** | No exit code and no stop reason appears in arm B that does not appear in arm A, and no count of the phase gate differs at equal verdicts (F149-FR-004, F149-FR-007) |

Decision: the option ships **on by default** only when P1, P2, P3 and P4 all hold. P1 or P2 not
shown leaves the default `off`, which is what it already is, and the arm is then a record of a
measurement and not a regression. P3 or P4 not shown is a **defect of this feature**, not a result:
it means the option changes something it must not, and the arm stops and the defect is repaired
before the arm is run again.

## 7. The window

The window of F115-FR-065 holds: it opens at the first valid pair after X0 passed and closes at 48
valid paired phases or after 6 weeks, whichever comes first. The arm is run after X5 and X6, with
the other ablations (F115-FR-066).

## 8. What is already proven without a live run

These hold in this repository, hermetically, and the arm does not re-ask them:

| Claim | Test |
|---|---|
| With the option off, no surface of a fixture differs from a build without the option | CT-149-3, `tests/characterization/149/ct-149-03-bump-option.test.ts` |
| K − 1 rejections bump nothing; K bump exactly once; a failed verification gate and a MALFORMED verdict add nothing | CT-149-4, `tests/characterization/149/ct-149-04-bump-count.test.ts` |
| The three guards skip and record; nothing of a bump reaches the critic | CT-149-5, `tests/characterization/149/ct-149-05-bump-guards.test.ts` |
| One row of the table fires per vector of signals; an invalid table switches the option off, announced | CT-149-6, `tests/characterization/149/ct-149-06-bump-table.test.ts` |
| The bump adds no exit code and no stop reason, and moves no count of the phase gate | CT-149-7, `tests/characterization/149/ct-149-07-invariants.test.ts` |

So the live arm asks ONE question only: whether the stronger model tier earns its cost. Everything
about safety is settled before a paid call is made.

## 9. Logging a run of the arm

Before a live run starts, the owner records, in the run's own log and before the first call:

| Field | Content |
|---|---|
| Arm | `X13-A` or `X13-B` |
| Expected cost | USD, with the basis of the estimate |
| Fixtures | The scenarios of the pair, by family and scenario |
| Commit, product identity | As F115-FR-064 requires |
| Date and operator | Who started it |

A run of this arm without that record is void.

References: [spec.md](../spec.md) (F149-FR-003 to F149-FR-006), [bump-table.json](bump-table.json),
[ep18-seams.md](ep18-seams.md), [README.md](README.md), feature 115 (F115-FR-064 to F115-FR-066),
`docs/ecosystem/architecture.md` ("The experiments").
