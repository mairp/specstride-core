# Roadmap: everything after Wave 1

Status: **approved by the owner on 2026-09-29**, with the rulings applied. The single copy; feature 100 links here.

Wave 1 is the core engine and the Claude Code plugin with Claude as proposer and critic, the adapter
seam with harness discovery, the doctor and the observability contract (decision 13), and by the
owner's rulings of 2026-09-29 also the dsh, Codex, pi and prime adapters and two parallelism options. Its features are
in `feature-briefs.md`; Stage B split nine of them along the groups their briefs name (section A.1a
there), so Wave 1 is 41 specifications. Everything below comes later and is **not specified in this
effort**.

Every entry names the research that supports it. Tiers follow R8v's corrected matrix for two audiences:
**P** personal use by the account holder, **D** a distributed product. Tier 3 is refused for every
provider at release.

## Wave 2

| Feature | Scope | Depends on (Wave 1) | Research |
|---|---|---|---|
| 120-host-dsh | The dsh plugin on the same host port. Skills only, with `specstride-doctor` as a user-invoked skill. The `specstride` CLI with `--json` is the only channel to the engine. Alerts come from the engine through status and the digest, since dsh has no user-facing hooks (DP-003). A session-log driver for skill-trigger evals (DP-002) | Host port, CLI protocol, run view and status | R4, R17 |
| 121-kanban-ui | Renderers over the UI read model: a terminal follower (`specstride watch`), a read-only loopback web viewer (`specstride ui`, DP-004), and an opt-in static export. Lisa's pure view-model builders and the dashboard trajectory (from `76adfdc`, DP-013) are the starting material. The viewer inherits the threat-model obligations of annex X §X.9: T-38 (only the read model is read), T-39 (no engine state written), T-40 (the web viewer binds to loopback), T-41 (a session token bound to one run) and T-42 (a stale view is marked); 145's presenter is the rendering contract it extends | Run view and status, event schema, presenter (145) | R13, R1, R1v |

## Wave 3 and later: one harness adapter per feature

Each adapter is a descriptor, optional code hooks and recorded fixtures, specified against the harness
seam exactly as the Claude adapter is. Until its adapter ships, a harness is usable through the generic
descriptor-driven adapter as an unverified harness (decision 17).

| Feature | Harness | Tier P | Tier D | Roles | What has to be settled first | Research |
|---|---|---|---|---|---|---|
| 132-adapter-gemini-cli | Gemini CLI | 2 | 2 | Proposer; tool-less critic by a deny-all policy | The critic mode needs a probe on a machine with the CLI. How quota errors surface | R7, R8v |
| 133-adapter-copilot | GitHub Copilot CLI | 1, 2 | 1, 2 | Proposer | No documented zero-tool mode and an undocumented default-model window, so it is never auto-picked as critic | R7, R8v |
| 135-adapter-opencode | opencode | 2 | 2 | Proposer with API-key providers; critic by a deny-all agent | Not a universal proposer (R10). Drive `serve` with the SDK, not one-shot `run`. Headless hangs on 429 | R10, R8v |
| 136-adapter-openrouter | OpenRouter | 2 | 2 | Critic; proposer only through a harness that hosts the tool loop | Usable in Wave 1 as a critic through the generic descriptor | R6 |
| 137-adapter-zai | z.ai | 1 through a listed tool, 2 | 2 | Critic; proposer only through a harness | Coding Plan keys are not used in a Specstride adapter | R6, R8v |
| 139-adapter-specstride | Specstride's own harness | — | — | — | Last. Not designed | — |

**Moved to Wave 1 by the owner** (rulings 32, 32b): 130-adapter-dsh, 131-adapter-codex, 134-adapter-pi
and 138-adapter-prime. The **Agent SDK transport** for Claude is also in Wave 1, as an optional Tier 2
transport of feature 125, with API keys only (rulings 20 and 70). They are in `feature-briefs.md`.

## Run acceleration after Wave 1

Ordered as R27 orders them. Each returns only after the measurement named.

| Item | Condition to return | Research |
|---|---|---|
| A check tool inside the pass (level L2) | Experiment X8 shows several units per pass beat one | R23, R27 |
| Check selection per unit | Declared commands carry a `tasks` field | R23, R27 D-07 |
| Test counts before and after a check | A result parser per runner behind the check-runner extension point (owner ruling 53) | R23v O-4 |
| The gate and grounding on an immutable snapshot of the tree | The owner ruled no snapshot in Wave 1 (ruling 39); returns on demand | R23v O-1 |
| Commits or snapshots per kept unit | The owner ruled no commit and no revert in Wave 1 (ruling 50); returns on demand | R23v O-13, R24 |
| A model as inner reviewer | Wave 1 data; decision 21 excludes it for Wave 1 | R22 |
| A second harness as an escalation rung; up-front routing; learned routers | Data from the escalation ablation (X10) | R25 |
| `autoresearch` as a kind of loop | An implementation of the loop-layer interface; rule rows when it exists | R25, R15 |
| Feature parallelism in separate workspaces | First of the parallelism items; each after a measurement | R26 |
| A phase graph (parallel independent phases) | After feature parallelism | R26 |
| `[P]` units in worktrees as a **default** | Wave 1 has them as an option that is off by default (feature 142, owner ruling 56). They become a default only if their experiment shows a saving beyond the measured ceiling of 1.18–1.30x | R26, R29 |
| Selection among N candidates on one phase attempt | Last; recomputed at 1.2–1.3x faster for 1.5–1.6x the cost | R26 |

## Memory

| Item | Condition to return | Research |
|---|---|---|
| Lessons store: operator-approved, process-only, never sourced from critic feedback, never read by the critic | R12's three-arm experiment, arm C. It plugs in as a prompt block provider, so the engine does not change | R12 |
| Cross-project content memory | Not planned. R12 found no evidence for it and a risk to the critic's independence | R12 |
| Feature 114-memory | Not specified (DP-018). The number stays unused | R12 |

## Platform features from Lisa

These as-is requirements are `deferred` (R19, R26, DP-034). Wave 2 is the dsh plugin and the kanban UI
(decision 13), so everything here is Wave 3 or later. Dropping one needs a written justification and
the owner's ruling. Two requirements are the likeliest candidates for `dropped`: 002 FR-053 (the index
needs a native module and files stay the truth) and 002 FR-049 (a server in the control path conflicts
with Principle I).

| Item | As-is origin | Wave | Condition to return | Research |
|---|---|---|---|---|
| Human approvals of plan revisions, the approvals webhook, and a live blocked-on-human state with an answer channel | 002 FR-025, 002 FR-026, 002 FR-027, 002 FR-050, 002 SC-006 | 3+ | Owner demand. Wave 1 has blocked-on-human as a resting state (DP-076) | R19 C-12, R15 |
| Event delivery dispatcher | 002 FR-024 | 3+ | An event sink behind EP-08 | R14 |
| Critic ensemble | 002 FR-022 | 3+ | The critic-strategy seam exists in Wave 1 with one critic | R19 C-11, R15 |
| Spec bundle import and verification plans bound to a spec bundle | 002 FR-030 to 002 FR-037, 002 SC-005 | 3+ | A spec-format adapter and a verification-plan source | R19, R15 |
| Engine hooks | 002 FR-052 | 3+ | Owner demand; they fail closed at blockable points | R19 |
| Scheduler queue and cron | 002 FR-043, 002 FR-044, 002 FR-045, 002 FR-047 | 3+ | With parallelism, above | R26 |
| Scheduler safety predicate and batch admission | 002 FR-039, 002 FR-040 | 3+ | With "Feature parallelism in separate workspaces", above | R26 |
| Server mode and the index database | 002 FR-049, 002 FR-053 | 3+ | Owner demand. Conflicts with Principle I as a control path; possible as a read-only index | R13, R19 C-20 |
| Dashboard trajectory | 002 FR-051, 002 SC-007 | 2 | Part of 121-kanban-ui | R13, R1 |

## Packaging and platforms

| Item | Condition to return | Research |
|---|---|---|
| A service detach strategy (systemd user unit, launchd agent) that survives a reboot | After the detach spike of Wave 1 | R15, R3 |
| Third-party code extensions loaded by consumers | The owner ruled data only in Wave 1 (ruling 30); returns on demand | R15, R11 |
| A native kernel lock | The owner ruled for the directory lock (ruling 23); a native lock returns only on demand, as a Language Ledger entry | R2, R2v |
| Windows and WSL | Recorded as unvalidated (decision 12) | — |
| macOS verification | A macOS runner passes the parity oracle before any release (DP-006). This is a release condition of Wave 1, listed here because no macOS host was available during research | R2, R18 |

## Terms data

Terms change. The terms-gate data is re-checked every 30 days and can be replaced without a product
release (R8, R15 EP-11). Two changes would move entries in this roadmap:

- Agreement to Anthropic's Commercial Terms with written confirmation would make Tier 1 the distributed
  default for Claude again (DP-042).
- Any provider that publishes explicit permission for third-party reuse of a subscription token could
  enter the Tier 3 allowlist, with R8-style evidence and an adversarial check.
