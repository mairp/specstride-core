# Research: Harness discovery and roles (feature 124)

Phase 0 of the plan. The research itself is in `docs/ecosystem/research/`; this file records the
decisions this feature takes from it and links to the source. No unknown of the Technical Context
is left open.

| Report | What this feature takes from it |
|---|---|
| [R20](../../docs/ecosystem/research/R20-harness-discovery.md) | The critic order, the qualification and ranking, the stored pick |
| [R16](../../docs/ecosystem/research/R16-doctor-config.md) | The keys `critic.autoPick`, `critic.autoPickMaxUsd`, `critic.warnSameModel`, now rows 35, 91 and 92 of annex X §X.7; the doctor checks `critic.*` |
| [R11](../../docs/ecosystem/research/R11-security-threat-model.md) | Threats T-13 and T-14 |
| [R14](../../docs/ecosystem/research/R14-quotas-cost-observability.md) | EV-28, the event `critic.selected` |
| [R15v](../../docs/ecosystem/research/R15v-architecture-red-team.md) | B-3 (the proposer guarantee), B-4 and P-11 (the plan) |
| [R23v](../../docs/ecosystem/research/R23v-gate-red-team.md) | V-13 and rule IR-47 (the comparison of models before every critic-class call, which raises the critic-diversity warning) |
| [R29v](../../docs/ecosystem/research/R29v-parallel-units-red-team.md) | PU-91 (the pass-over when the worker root is not empty) |
| [R8](../../docs/ecosystem/research/R8-subscription-terms-matrix.md), [R8v](../../docs/ecosystem/research/R8v-terms-verification.md) | Unknown terms; auth tiers per audience |
| [R25](../../docs/ecosystem/research/R25-routing-cascades.md) | Choosing a role is not routing |
| [R5](../../docs/ecosystem/research/R5-claude-proposer-critic.md), [R6](../../docs/ecosystem/research/R6-codex-openrouter-zai.md) | The critic forms of the default harness and of the first harness with read-only tools |

## Decisions

Decisions D-1 to D-4 and D-10 to D-12 concerned discovery and left with the split; the numbers are not reused.

### D-5 Ranking and qualification are data

- **Decision**: `ranking-table.json` holds the six comparison keys in order; `qualification.json` holds conditions Q1 to Q10 with their reasons. The comparison of two candidates is a decision point of the table evaluator with the choice set `first`, `second`, `next-key`.
- **Rationale**: the brief names the table evaluator for the ranking; LR-7 and Principle XIII ask for a rule id with every decision.
- **Alternatives considered**: a comparison function in code (no rule id, no version).

### D-6 Unknown role names: refusal by default, the baseline behind a switch

- **Decision**: a switch, on by default, off under `parity`.
- **Rationale**: the baseline lets an unknown name into the run (`consolidation.md` section 3, row "127 (pass status)"; items B-0575 and B-0996), and the traceability files keep both items. A default run gains nothing from passes that all fail.
- **Alternatives considered**: the baseline behaviour always (a run that burns its budget on a typing error); refusal always (the two kept items could not pass a parity test).
- **Register row**: DV-104. **Proofs**: B-0575 on `FX-18/unknown-harness-name`, B-0996 on `FX-07/unknown-harness-name`, both scenarios of feature 141.

### D-7 The runners-up are part of the plan of an automatic pick

- **Decision**: for an automatically picked critic the plan holds the ranked runners-up and step 4.
- **Rationale**: ruling D1 and R29v PU-91 ask that the next of the order is used at call time, and nothing is resolved after launch (F100-FR-092).
- **Alternatives considered**: resolving again at call time (against LR-8).

### D-8 No demotion in the middle of a run

- **Decision**: not specified. A hard failure of the picked critic follows the rules of the critic as today.
- **Rationale**: R20 gives the rule medium confidence and no data of a run; the brief does not list it.
- **Alternatives considered**: R20's demotion after three transport failures (reported as a candidate for a later wave).

### D-9 The cap of a metered pick is a key that must be set

- **Decision**: `critic.autoPickMaxUsd` has no default; without it a metered candidate does not qualify.
- **Rationale**: R16 lists the key as "required when metered"; ruling 60 calls the cap mandatory. A default amount would spend money the consumer never agreed to.
- **Alternatives considered**: a shipped default amount.

## Facts that are `unverified`

| Fact | Check that would verify it |
|---|---|
| Every statement about macOS | A macOS runner passes the tests of this feature |
| The read-only sandbox of the first harness with read-only tools denies reads of the withheld paths | The fixture capture of that harness adapter |
