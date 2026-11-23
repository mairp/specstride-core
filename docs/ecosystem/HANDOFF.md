# HANDOFF — Stage A to Stage B

Written on 2026-09-29, after the owner approved Stage A (`APPROVAL.md`), settled the clarify queue, and
the rulings were applied to every synthesis artifact. Stage B starts in a fresh session with the Stage B prompt,
`prompts/specstride-stage-b.md`, which the owner asked for on 2026-09-29. The Stage A prompt,
`prompts/specstride-ecosystem.md`, stays as the record of what Stage A was asked; it is out of date
where section 2 below says so.

All paths are relative to `docs/ecosystem/` unless they start with `specs/`, `.specify/` or `prompts/`.

## 1. Read these first, in this order

| # | File | Why |
|---|---|---|
| 1 | `HANDOFF.md` | This file |
| 2 | `PROGRESS.md` | The ledger. Stage B rows are added to it as the first act |
| 3 | `APPROVAL.md` | **The authority.** The owner's rulings: 1–70 on the 90 pending entries, D1–D3, K1–K9, and P1–P16 given after the approval. Where any other file disagrees with it, it wins |
| 4 | `architecture.md` | The approved architecture, with the rulings applied |
| 5 | `feature-briefs.md` | Sections A (decomposition), B (order and mechanics), then the brief of the feature at hand |
| 6 | `consolidation.md` | The glossary (section 1) and the divergence register (section 6) |
| 7 | `CLARIFY-QUEUE.md` | Sixteen entries, **all closed by the owner** (rulings P1 to P15). Stage B adds new entries from CQ-017 |

Do not read the research reports in full. Open one only when a brief leaves a decision unclear.

## 2. What the owner changed against the prompt and the proposal

The prompt's §2 decisions stand, with these changes from `APPROVAL.md`. A Stage B agent that follows
the prompt alone will get these wrong.

| Subject | The prompt or the proposal said | The owner ruled | Ruling |
|---|---|---|---|
| Wave 1 harness adapters | Claude only; one adapter per feature in later waves (decision 13) | dsh, Codex, pi and prime adapters are Wave 1 features | 32, 32a, 32b |
| Parity release gate | Proposal: behaviour of later-wave harnesses deferred | Every parity test passes before any release | 32 |
| Default auth tier | Tier 1 (decision 6) | Two audiences. `personal`: Tier 1. `distributed`, the package default: Tier 2 for Claude, Codex and the z.ai Coding Plan, with Tier 1 as a consumer opt-in | 1, 2 |
| Tier 3 | Allowed where terms permit | An empty allowlist at release | 59 |
| Micro-loop targets (decision 21) | Read as targets of the layer | Measured on the default configuration against the parity configuration; the layer earns its place in its own ablation; 50:50 fixture mix; inner-cap ends count as kills | 3, 4, 5 |
| Supervision (decision 5) | The host skill supervises and relaunches | The runtime root relaunches by default; `relaunch.owner: supervise` is the parity setting | 6 |
| Counts (decision 23) | Reject counts and attempt numbers survive | Also pass index, yield index and breakers; the oscillation window is keyed by attempt sequence; a launch continues an unfinished run unless `--new-run` | 8, 9 |
| Config precedence (decision 9) | Five layers | contract pin > flag > run snapshot (on resume) > env > project > user > learned > default | 10 |
| Glob expansion defect | A defect to fix with a register row | Already fixed at the baseline; ported as it is | 11 |
| Lisa | Open | Selective extraction; local `main` for 18 packages and `76adfdc` for the dashboard; the Agent SDK harness extracted as an optional Tier 2 transport | 12, 13, 20, 70 |
| Decomposition | 14 features suggested | **31 features and the umbrella** | 15, 32b, 56 |
| Memory (feature 114) | "Only if approved" | Not specified | 17 |
| Languages | Candidates to be proposed | None; the Language Ledger is empty | 18 |
| Critic has no tools | Principle IX | Exception: a critic with read-only tools in a sandbox (Codex), in the working tree, with the proposer's files hidden | 57, 57a, D1 |
| Telemetry content | Proposal: off by default | Captured whenever traces are on; always through the redaction point | 43 |
| Parallelism | Research decides | Parallel `[P]` units and concurrent verification commands are Wave 1 options, off by default. Parallel units need containment C2; 2 workers, ceiling 4; a repository of its own per worker; the merge check runs on the workspace; a killed worker's work is discarded. Verification commands declare reads and writes | 56, D2, P1 to P11 |
| Ruling 50 (no commit, no revert by the runtime) | — | Two exceptions with parallel units on: snapshot commits in the runtime's own store, and the application of a merged delta with its ticks | P1 |
| Continuing after an intended change of spec, plan or tasks | Not covered | A flag on `resume`; without it, exit 3 naming the changed file | P12 |
| Critic with read-only tools in the critic order | — | Step 3 of decision 17's order, behind every tool-less candidate | P13 |
| dsh and prime, whose terms are unknown | — | Usable when the consumer names them; never a default; never picked automatically | P14 |
| dsh plugin install | — | Only for plugins in the consumer's allowlist | P15 |
| Verdict nonce | R11 proposed 128 bits | 64 bits, as today | P16 |
| Tier bump after critic rejections | Proposal: roadmap | A Wave 1 option, off by default | 48 |
| Staleness of spec and plan | Not covered | Checked at launch, at resume and at every pass start | K3 |
| Licence | MIT | MIT, "Copyright (c) 2026 mairp" | 14 |

## 3. The first acts of Stage B, in order

| # | Act | Detail |
|---|---|---|
| 1 | Add the Stage B rows to `PROGRESS.md` | One row per feature × Spec Kit step (specify, clarify, plan, tasks, analyze): 32 features × 5 |
| 2 | Apply the constitution amendment | `speckit-constitution` with the text of `constitution-amendment.md` section 3 (twenty principles, v3.0.0), sections 4 to 6, and the sync impact report. It replaces `.specify/memory/constitution.md` v2.0.3 |
| 3 | Rewrite the plan template's Constitution Check | `.specify/templates/plan-template.md`, with the text of `constitution-amendment.md` section 7; change the Technical Context examples to TypeScript on Node.js LTS |
| 4 | Commit | "docs: constitution v3.0.0 and plan template" |
| 5 | Specify feature **100-specstride** alone and completely | One feature with annexes by layer (ruling 16). Every other feature cites its contracts. Expect about 180 requirements; its size is accepted |
| 6 | Specify feature **141-parity-oracle** | Right after 100, alone |
| 7 | Fan out the other 30 features | One subagent each, in parallel, within the concurrency limit (20 subagents at once on this machine). Each gets: its brief, the feature 100 contracts, the glossary, its traceability rows, `APPROVAL.md` |
| 8 | Cross-feature review | The coverage check, the consistency review, the constitution review (prompt §6) |
| 9 | One clarification round with the owner | The entries Stage B adds to `CLARIFY-QUEUE.md`, once all Wave 1 features have been through clarify. The sixteen entries of Stage A are closed |

## 4. Features and directories

Pass the directory explicitly on every Spec Kit script call: `SPECIFY_FEATURE_DIRECTORY=specs/<dir>`.
Never create a `specs/1NN-*` directory by hand. Confirm the directory name after `speckit-specify`.

| Tier | Features |
|---|---|
| 1, alone | `100-specstride`, then `141-parity-oracle` |
| 2, in parallel | `101-gate-and-verdict`, `102-run-control`, `103-proposer-pass`, `104-spec-input`, `105-verification`, `106-learning`, `107-launch-contract`, `108-reverse`, `109-harness-seam`, `110-config-and-terms`, `111-event-schema-and-projection`, `112-doctor`, `113-host-claude-code`, `115-micro-loop-layer`, `117-critic-grounding-and-prompt`, `118-pass-supervision-and-jobs`, `119-front-door-and-presenter`, `122-detached-runtime`, `123-pipeline-runtime-and-supervisor`, `124-harness-discovery-and-roles`, `125-adapter-claude`, `126-stream-seam-and-invocation`, `127-quota-budgets-and-pause`, `128-telemetry-export`, `129-run-view-and-status`, `130-adapter-dsh`, `131-adapter-codex`, `134-adapter-pi`, `138-adapter-prime`, `142-parallel-units` |

Unused numbers: 114 (memory, not specified), 116 and 140 (reserved for splits of 115 and 108), 143
(reserved for a split of 142). A feature is split only if `speckit-specify` yields more than about 45
requirements, and then along the requirement groups its brief names. Expected splits: 108 (405 behaviour
items), 115 and 142. Features 110 and 111 are estimated at 47, just above the mark. The briefs estimate
about 1,308 requirements in total, with low confidence, of which about 180 in feature 100.

Not specified in this effort: Wave 2 (`120-host-dsh`, `121-kanban-ui`) and the later adapters (132, 133,
135, 136, 137, 139). They are in `roadmap.md`.

## 5. Rules every Stage B agent must follow

These add to "Rules for every spec" in the prompt's §6.

| Rule | Content |
|---|---|
| Authority | `APPROVAL.md` > `architecture.md` and `consolidation.md` > `feature-briefs.md` > research reports > analysis files in `prompts/analysis/` |
| Ids | `F101-FR-012`, `F101-SC-003`. As-is ids always with their origin: `028 FR-012`, `B-0042` (four digits) |
| Carried behaviour | Each requirement that carries as-is behaviour cites origin, disposition and proving test, taken from `traceability.md` and `traceability-items.tsv` |
| Divergences | An intended difference cites its register row, `DV-001` to `DV-091`. A new one needs a new row in `consolidation.md`, added by the orchestrator only |
| Terms | The glossary of `consolidation.md` section 1. "Run" is the logical run; "recovery cycle" is the old README's "micro-loop"; "micro-loop" has its new meaning |
| Harnesses | No requirement assumes a closed list. The machine-specific backend name appears nowhere: write "a locally registered backend" |
| Extension points | A feature names the extension points it implements or consumes, with versions (EP-01 to EP-19) |
| Parity profile | Every new option states its value under the `parity` profile |
| Tests | Requested for every feature. Parity tests and characterization tests are required tasks |
| Unverified facts | macOS behaviour, detach survival in a host session, and provider facts from documentation only are marked `unverified`, with the check that would verify them |
| Questions | A question the sources cannot answer goes to `CLARIFY-QUEUE.md` with a recommended answer, and the feature proceeds on it |
| Who writes what | Subagents write inside their own `specs/<dir>/`. Only the orchestrator writes `PROGRESS.md`, `CLARIFY-QUEUE.md`, `consolidation.md`, `traceability*`, and commits |

## 6. Work that Stage B inherits

| Item | Owner feature | Source |
|---|---|---|
| The detach spike: does a process started from the host's shell tool survive the session, and can it write the control root? Linux and macOS, sandbox off and on | 122 | `architecture.md` section 4 |
| Fixtures for dsh, Codex and prime; a fixture family for the dsh plugin protocol (27 items) | 141 | Ruling 32; `traceability.md` section 5 |
| Two inventory rows for the `run_stop` write sites at `proposer.sh:2253` and `:2259` | 141 | `consolidation.md` section 4 |
| Fixture captures for facts that are unverified: pi's exit code on a provider error, Codex's structured quota event, dsh's approval behaviour in headless mode | 134, 131, 130 | R9, R6 |
| One live call per role to confirm the Claude critic's flag combination. A paid probe: log it in `PROGRESS.md` | 125 | R5, R3v |
| Redaction patterns widened and tested with planted canaries, as a release condition | 111, 128 | Ruling 43 |
| A macOS runner passes the parity oracle before any release | 141 | Ruling 67 |
| Experiments X0 to X12 and E6; X0 (cost counted for every pass) comes first | 115, 142, 111 | `architecture.md` section 9 |
| The Stage B half of `check-traceability.py` (rows against specs) | orchestrator | The marked stub `check_specs` |
| About two thirds of A6's sources were never re-fetched | — | R22; low priority |

## 7. State of the repository

| Item | State |
|---|---|
| Branch | `main`, no remote |
| Research | 29 reports (R1–R29) and 8 verifier reports, in `research/` |
| Rulings that touch each other | `feature-briefs.md` section D.8, table "Where rulings meet": ten points, each with the reading the briefs use. pi and prime have no sandbox, so as proposers they need the consumer's opt-in to no containment (rulings 34, P2) |
| Synthesis | `research-synthesis.md`, `architecture.md`, `consolidation.md`, `traceability.md` with two data files, `decision-log.md`, `constitution-amendment.md`, `feature-briefs.md`, `roadmap.md` |
| Checks | `python3 docs/ecosystem/check-traceability.py` passes |
| Paid probes | None were run in Stage A |
| Source repositories | Untouched. They stay read-only in Stage B |
| Constitution | v2.0.3 is still in force until act 2 above |
| The stuck run in `/root/agentic-netops-srl` | Diagnosed in `research/R28-netops-run-stuck-diagnosis.md`; not part of Stage B |
