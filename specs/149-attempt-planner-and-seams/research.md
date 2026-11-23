# Research: Attempt planner and seams (feature 149)

Phase 0 of the plan. The research is in `docs/ecosystem/`; this file says what the plan takes
from it. Nothing in the Technical Context is left to be clarified.

## Sources read

| Source | What was taken |
|---|---|
| `docs/ecosystem/APPROVAL.md` | Rulings 41, 46, 47, 48, 49, 55, K5 |
| `docs/ecosystem/architecture.md` | Section 5 (EP-18), section 9 (options), section 17 |
| `docs/ecosystem/consolidation.md` | Glossary; C-11; register rows DV-076, DV-077, DV-079 |
| `docs/ecosystem/feature-briefs.md` | Brief 101, headings 4, 7 (group G4) and 8; D.5; D.8 row 9 |
| `docs/ecosystem/research/R23-inner-checks-gate-integrity.md` | IR-01 to IR-07 |
| `docs/ecosystem/research/R23v-gate-red-team.md` | IR-33, IR-47 |
| `docs/ecosystem/research/R25-routing-cascades.md` | F-8 and option C |
| `docs/ecosystem/research/R27-run-acceleration-synthesis.md` | Row 20 of the techniques: the tail of failed phase attempts |
| Feature 100 | Annex E §E.1; annex D §D.1, §D.4, §D.7; annex X §X.3, §X.6, §X.7 |

## Decisions

### D1. Two planners behind one seam, in a fixed order

- **Decision**: the planner of the recovery cycle gives the kind; the planner of the bump gives
  the model tier and turns `plain` into `bumped`.
- **Rationale**: ruling 48 adds a second implementation to the seam; R25 F-8 option C leaves the
  reject semantics as they are. A phase attempt that is due for both stays `accelerated`, so the
  as-is kinds are unchanged with the option on.
- **Alternatives considered**: the bump as a row of the router table (rejected: the router acts
  inside a phase attempt on deterministic failures, and ruling 46 keeps the two rules apart); the
  bump in place of the accelerator (rejected: it would change more than the ruling asks).

### D2. The default of K

- **Decision**: 2.
- **Rationale**: no source gives a value (CQ-175). With the default reject limit of 3, K = 2 is
  the one value below the limit that leaves the first repair on the base model tier.
- **Alternatives considered**: 1 (every repair on the higher model tier, which costs most);
  3 (no effect under the default reject limit).

### D3. A strategy never sees a nonce

- **Decision**: the engine hands a call function to the strategy.
- **Rationale**: feature 100 annex E §E.1 makes the nonce and the fresh session guarantees of the
  core. A strategy that minted nonces itself could reuse one.
- **Alternatives considered**: the strategy calls the harness port itself (rejected: the core may
  not import an implementation, and the guarantee would rest on every later strategy).

### D4. The state of a quota is read, never probed

- **Decision**: the signal `targetQuotaExhausted` comes from records of the run.
- **Rationale**: the table evaluator has no I/O; a probe would be a model call made to decide
  routing, which can be a paid call.

### D5. The bump is tried again after a skip

- **Decision**: the row that marks a phase as bumped fires only after a bump, not after a skip.
- **Rationale**: a quota that was exhausted at one rejection may be open at the next; ruling 47
  asks only that the skip is recorded.

## Inherited work

| Item | Kind | Where it lands |
|---|---|---|
| Fuzz of the verdict parser with every ledger record and fact-block row | Own test | CT-149-7 |
| Ablation arm of the bump | Experiment. It is defined by a task and not run in Stage B; every live arm is paid and must be logged | `contracts/ablation-tier-bump.md` |
| Conformance suite and samples of EP-18 | Conformance | CT-149-10 |

No spike, no fixture capture and no live probe is assigned to this feature.

## Risks

| Risk | Carried by |
|---|---|
| The effect of the bump is unknown; the reference run was already on the top model tier (R25 F-8) | The option is off by default; the ablation arm |
| Feature 100 did not name the bump table among the users of the table evaluator (F100-FR-204) | Resolved: F100-FR-204 now names the attempt planner and the point `attempt-tier` |
| Row 32 of annex X §X.7 says "116; 101 performs the comparison", while since the split 149 performs it | Proposal P3 of `analyze-report.md`; this feature reads the switch `integrity.phase_entry` of 116 and performs the comparison |
