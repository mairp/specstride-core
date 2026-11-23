# Research: Harness seam (feature 109)

Phase 0 of `plan.md`. Research and architecture stay in `docs/ecosystem/`; this file summarizes
what the plan takes from them and links to the source. No `NEEDS CLARIFICATION` remains.

## Decisions

### D-1 One port, two levels; a tested harness adapter is a descriptor plus code

- **Decision**: one harness port with the levels `proposer` and `completion`. The generic harness adapter is the port driven by a descriptor alone.
- **Rationale**: Lisa's provider seam has exactly this shape and is sound; it lacks version pin, auth tier, quota signal, continuation and discovery, which are added. A closed chain over named harnesses, which both the baseline and Lisa's CLI harness have, is what decision 17 removes.
- **Alternatives considered**: a registry of harness adapters written as code only (no harness without a release); a plugin interface for third-party code (ruling 30 allows data only in Wave 1).
- **Source**: `docs/ecosystem/research/R20-harness-discovery.md` (Recommendation, option D); `R1-lisa-reuse-audit.md` (table B, row `agents`; RL-AGENT-01 to RL-AGENT-13); `R15v-architecture-red-team.md` (P-10).

### D-2 The overlay is ported function by function

- **Decision**: the overlay tool of the baseline is ported with its order of steps, its file names, its messages and its result codes.
- **Rationale**: 51 kept behaviour items describe it, 35 of them `ported`. The oracle compares the home and the temporary directory (surface `home`) and the environment variable names in the transcript.
- **Alternatives considered**: a new overlay built on a sandbox of the operating system (no parity; not every harness has one).
- **Source**: the overlay tool and the pass-loop script of the Specstride baseline at `9cab15d`; `consolidation.md` DV-002; feature 141, FX-39.

### D-3 What "throwaway home" means per auth tier

- **Decision**: auth tier 1 uses the real home, never written, customisations off. Auth tier 2 uses the overlay. Under `parity` the scope is `none`.
- **Rationale**: a throwaway home has no login (R7, R5). Ruling 36.
- **Source**: `APPROVAL.md` ruling 36; `consolidation.md` DV-002; `R11-security-threat-model.md` R-2 rule 4.

### D-4 Containment as a capability with a ceiling

- **Decision**: levels C0 to C3; each entry declares a ceiling with provenance; default C2 where offered, else C1; C0 by opt-in in user configuration only, not from the environment, a flag or project configuration (ruling 34; CQ-183); C3 detected.
- **Rationale**: R11 R-2. What is achievable differs per harness, so the level is a capability and not a setting of the core.
- **Alternatives considered**: a sandbox of the product around every harness (needs a native component; Language Ledger is empty).
- **Source**: `R11-security-threat-model.md` R-2, T-07; `APPROVAL.md` rulings 34, 38.

### D-5 Three kinds of proof of the critic's form

- **Decision**: `initial-record`, `pinned-configuration` (weaker, tested harness adapters only), `read-only-sandbox`.
- **Rationale**: a harness with a text stream emits no initial record (R9 F11, F12), so a second proof is needed for it. The second form follows rulings 57, 57a and D1.
- **Deviation** (added 2026-09-30; closed the same day): `pinned-configuration` departs from the text of Principle IX v3.0.0, which asks for the proof from the harness's own initial record. The owner ruled on CQ-182 (2026-09-30): the weaker proof is allowed for a tested harness adapter, and Principle IX v3.0.1 names it. It stays recorded in `plan.md`, row IX and Complexity Tracking, until the first implementation slice removes the row (sync note of v3.0.1).
- **Alternatives considered**: refusing a harness without an initial record as critic (such a harness could be a critic only under the `parity` profile).
- **Source**: `R5-claude-proposer-critic.md`; `R9-pi-dsh-prime.md` F11, F12; `R6-codex-openrouter-zai.md`; brief 109, heading 6, "Point for the orchestrator".

### D-6 The endpoint clients come from Lisa, without names and without fixed variables

- **Decision**: extract the two completion clients; remove every machine-specific name; take address, key and model from the descriptor.
- **Rationale**: R1 finding B4 lists the names to remove. Lisa reads three fixed variable names (RL-AGENT-12); a registry with several endpoints cannot.
- **Source**: `R1-lisa-reuse-audit.md` B4, RL-AGENT-03, RL-AGENT-04, RL-AGENT-12; `R1v-lisa-gap-verification.md`.

### D-7 Registry queries are functions, not commands

- **Decision**: `names`, `stream`, `invocation-model` and the display line are internal operations with result records.
- **Rationale**: feature 100, annex G §G.1 lists no such command; LR-6 keeps the code as a field.
- **Source**: `traceability.md` section 1.3; `architecture.md` LR-6.

### D-8 Precedence of sources for one id

- **Decision**: consumer-declared, tested harness adapter, bundled descriptor, detected. The winner wins as a whole.
- **Rationale**: decision 9's order applied to descriptors. Merging field by field would let a descriptor change half of a tested harness adapter and keep its `tested` state.
- **Source**: `R20-harness-discovery.md` Q1.

### D-9 No new dependency

- **Decision**: the HTTP client, the process start and the file calls that Node ships; the validator of feature 100. Descriptors are YAML files: they are read with the one YAML parser of the workspace, a dependency of the configuration loader of feature 110 only (`specs/100-specstride/research.md` D-8); this package names no parser.
- **Rationale**: Principle VI; threat T-44.
- **Source**: `specs/100-specstride/research.md` D-2, D-8.

## Facts that are `unverified`

| Fact | Check that would verify it | Owner of the check |
|---|---|---|
| Every macOS statement: file modes of an overlay, start time of a process, a sandbox at C2 | The conformance suite and the parity tests on a macOS runner | This feature, before release |
| The flag combination of a tool-less critic on a CLI shows an empty tool list in the initial record | One live call per role: a paid probe, logged | 125 |
| The read-only sandbox of the first harness of the second form denies reads of named paths | A fixture capture | 131 |
| Several headless processes of one harness under one home and one login | A fixture capture per harness adapter | 125, 130, 131, 134, 138 |
| The starting values of the performance goals | Measured in the build | This feature |

## Open points reported to the orchestrator

See `spec.md`, "Assumptions": CQ-063 (budget of `harness verify`), CQ-064 (fields
and scope word of the overlay marker), CQ-065 (logical name of a bundled descriptor; answered:
`package:harness:<id>`, annex B §B.5), and from the cross-feature review CQ-182 (the weaker
proof), CQ-183 (the opt-in to C0) and CQ-193 (no fixture changes the reference tree).

### D-10 Two facts of the follow-up of feature 141 (added 2026-09-30)

- **Decision**: the line for a registry that cannot be read is proven by a characterization test (CT-109-109), and the scenario `FX-26/root-sandbox-assertion` declares the effective user id 0 as its prerequisite.
- **Rationale**: feature 141 refused the scenario `FX-26/help-list-unavailable`: it is outside the scope of FX-26 and needs a reference whose registry module cannot run, and the reference tree is read-only. The baseline prints the line from the function that shows the display of a role, when the registry query gives no output (`specstride-lib.sh` at `9cab15d`, read for this repair). The assertion of a sandbox runs only for the effective user id 0.
- **Source**: `specs/141-parity-oracle/followup-report.md`, sections 2.2 and 5; feature 141, F141-FR-037; CQ-193.
