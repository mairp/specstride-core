# Research: Gate and verdict (feature 101)

Phase 0 of the plan. The research of this feature is in `docs/ecosystem/`; this file summarizes
what the plan takes from it and links to it. No `NEEDS CLARIFICATION` is left in the Technical
Context.

## Sources read

| Source | What was taken |
|---|---|
| `docs/ecosystem/APPROVAL.md` | Rulings 9, 12, 26, 33, 41, 50, K1, K4, K7, P16 |
| `docs/ecosystem/architecture.md` | Sections 2, 4, 5 (EP-18), 8, 9, 13, 17 |
| `docs/ecosystem/consolidation.md` | Glossary; conflicts C-01, C-08, C-09, C-10, C-12, C-14, C-26; sections 3.1, 3.3, 4; defects D-04, D-05, D-34, D-47; register rows |
| `docs/ecosystem/research/R18-behaviour-inventory.tsv` | The text of the 157 behaviour items |
| `docs/ecosystem/research/R23-inner-checks-gate-integrity.md` | IR-01 to IR-07 |
| `docs/ecosystem/research/R23v-gate-red-team.md` | IR-33, IR-47, IR-57 |
| `docs/ecosystem/research/R14-quotas-cost-observability.md` | EV-07, EV-08, EV-20, EV-23 |
| `docs/ecosystem/research/R11-security-threat-model.md`, through feature 100 annex X §X.9 | T-01, T-02, T-05, T-06, T-08, T-22 |
| The baselines, read with `git show` | `orchestrator.sh` and `lib/critic.py` at `9cab15d`, through the evidence lines of the inventory |

## Decisions

### D1. The loop is written new; two pieces of Lisa are extracted

- **Decision**: port the loop of the Specstride baseline; extract Lisa's nonce verdict parser and
  gate store as source, and rewrite the store for the approval record.
- **Rationale**: ruling 12 (DP-014). Lisa's loop has no seam for the MALFORMED limit, the recovery
  cycle, the oscillation halt or a loop layer (`architecture.md` section 13). The parser has the
  same grammar as the baseline (16 hexadecimal characters, exactly one line).
- **Alternatives considered**: Lisa's phase loop as the base (rejected by the owner); a parser
  written new (rejected: the extracted one has tests, and characterization tests keep it honest).
- **Check before use**: the extracted parser must search the whole reply, match without regard to
  case and count agreeing duplicates as MALFORMED (B-0975, B-0978, B-0979). Where it differs, it is
  brought to the baseline first; the characterization tests CT-101-7 to CT-101-10 are written
  against the result.

### D2. Signature of the approval record

- **Decision**: HMAC-SHA-256 with a key per feature, over the canonical record hash.
- **Rationale**: the threat is a proposer that writes approval state (T-02). The key lies in the
  control plane, outside the write scope of the proposer. Writer and verifier are the same
  runtime, so a key pair adds nothing. `node:crypto` ships the primitive; no native module.
- **Alternatives considered**: an asymmetric signature (Ed25519): useful only when another party
  verifies, which `state export` could want later; the key id in the record leaves room for it.
  No signature, location only: rejected by ruling 33.
- **Residual risk**: at containment C0 and C1 the same user of the operating system can read the
  key. The run then records `protection=detect` (F100-FR-040). Accepted in `consolidation.md` C-26.

### D3. The key of the approval record is not the key of the ledger

- **Decision**: two keys, two logical names (`feature:<slug>:approval-key`,
  `run:<runId>:ledger-key`), different lifetimes: the approval key lives as long as the feature,
  the ledger key as long as the run.
- **Rationale**: R23v IR-57. The ledger is written during passes and checks; a leak of its key must
  not let anything sign an approval.

### D4. The oscillation window

- **Decision**: the window is the ordered list of feedback records of the phase attempts of the
  phase since the last reset of counts, read from the control plane in the order of the ordinals.
  Under `--reset-counts` the window starts at the reset, which gives the as-is window for a
  resume.
- **Rationale**: ruling 9 (DP-037); DV-044. The baseline filters by the modification time of files
  against the start of the engine; ordinals are stable where times are not.
- **Alternatives considered**: keep the filter by time (rejected: it opens a new window on every
  relaunch, which hides an oscillation from a run that relaunches itself).

### D5. Left with the split

The decision on the model-tier bump as a second attempt planner left with group G4.

### D6. The verdict record keeps the as-is content

- **Decision**: the verdict record holds the prompt and the reply in full, as the as-is transcript
  does, and is written after the call has returned.
- **Rationale**: the oracle compares the file (surface `state`). The nonce is of use for one call
  only (ruling P16), so a nonce on disk after the return opens no path.
- **Open**: F100-FR-139 allows only the hash after the return (CQ-173).

### D7. No stop reason is invented

- **Decision**: exits that the enumeration does not cover carry no stop reason in the terminal
  record, and the compatibility projection writes no stop line for them.
- **Rationale**: the enumeration is closed (ruling K4); the baseline writes no stop line on these
  paths, and the oracle compares the event file.
- **Open**: F100-FR-148 asks for a member on every exit other than 0 (CQ-174).

## Inherited work

| Item | Kind | Where it lands |
|---|---|---|
| Characterization of Lisa's verdict parser and gate store as extracted | Characterization tests | Tasks of phase 2 and of user stories 1 and 3 |
| Surviving counts as they reach the reject limit | Own test | CT-101-16 |

No spike, no fixture capture and no live probe is assigned to this feature by its brief.

## Risks

| Risk | Carried by |
|---|---|
| The exercise map of feature 141 may show that a fixture family does not execute the evidence line of an item assigned to it | The test then names another family or becomes a characterization test, by a correction of the traceability files |
| The content of the approval commit differs from the reference because the control plane lies outside the tree | CQ-171 |
| Fixtures whose specification holds ticked tasks and no approval | CQ-172 |
| A missing credential of the critic: the baseline scores it as a failed call (feature 141, follow-up report of 2026-09-29; the critic module of the Specstride baseline at `9cab15d`, lines 1883, 1904 and 2738) | CQ-187: a failed call under the `parity` profile, a configuration error outside it, with a register row and a row of the profile that are asked for |
| The feature had 51 requirements | Split on 2026-09-29; 41 stayed. One was added by the repair of 2026-09-30 (F101-FR-052), so the feature has 42 |
