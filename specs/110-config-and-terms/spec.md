# Feature Specification: Configuration and terms

**Feature Branch**: `110-config-and-terms` (a label: Spec Kit creates no branch in this repository; the directory is `specs/110-config-and-terms`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 110-config-and-terms: the content of the configuration schema (every key, type, default, layers, trust class, spelling), precedence with per-phase overrides, narrow-only project configuration, environment aliases, the generic `--set`, provenance and `config show`, secret references and the three resolvers, launch defaults. The terms gate left for feature 147 in a split."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority), `architecture.md`, `consolidation.md`, `feature-briefs.md` (brief 110-config-and-terms), `STAGE-B-RULES.md`, `STAGE-B-F100-AMENDMENTS.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182), feature 100 (annexes B, C, X), feature 141, research R16 (F5, F6, F7), R8, R8v, R11 (T-10, T-13, T-16, T-18, T-35, T-36, R-4), R19 (C-24, C-25, C-33), R20, R29.

## What this feature is

Feature 100 fixes the envelope of configuration: eight ranks, four trust classes, the run snapshot and the interface of the secret resolver. This feature fills them. It says which keys exist, what each one is called, what type and default it has, which layers may set it, what its trust class is, and whether a resume replays it. It says how the eight ranks resolve a key, how a value is traced to its source, and how a secret is referred to and fetched. The terms gate (auth tiers, audience, provider terms) was split off as feature 147; this feature only spells its keys.

**In scope**: the catalogue of keys (§K.3 to §K.6); the spelling of every key, including the keys other features propose; precedence, per-phase overrides and inheritance; narrow-only project configuration; environment aliases and the generic `--set`; provenance and `config show`; secret references and the resolvers `env:`, `file:` and `keychain:`; the launch defaults.

**Out of scope**:

| Out of scope | Owner |
|---|---|
| The config envelope, the ranks as a contract, the trust classes as a contract | 100 |
| The run snapshot and its replay on resume | 102 |
| The meaning of a key that another feature owns (budgets, quota, pause, fallback, caps of the micro-loop layer, and so on) | The feature named in the catalogue |
| Role resolution, the harness descriptor | 124, 109 |
| Doctor checks on configuration | 112 |
| The meaning of the learning mode | 106 |
| The pattern set of the redactor | 111 |
| Auth tiers, the audience, the terms gate, its data and the rows of the Wave 1 adapters (the meaning of `distribution.audience`, `distribution.termsOverride` and `roles.<role>.tier`) | 147 |

Feature 100 is never edited by this feature. Where this feature needs something that feature 100 lacks, it says so under "Assumptions" and reports it.

## The catalogue

This section is normative. The tables are the schema. "How to cite": "feature 110, §K.3, `loop.maxIter`".

### §K.1 Reading the tables

| Column | Meaning |
|---|---|
| Key | The exact spelling. A path of segments joined by dots. `<N>` is a phase number, `<id>` a harness id, `<role>` a role id of the role registry |
| Type and range | The value. "secret ref" is a reference of §K.7. "list" replaces and never concatenates, except `harnesses` (F110-FR-016) |
| Default | The default of the layer "Default". "As at the baseline" values are those of the Specstride baseline at `9cab15d` (`orchestrator.sh`, `.env.example`, R16 F6) |
| Layers | The layers that may set the key: F flag, E environment, P project file, U user file. The contract pin (C) is added where the key is pinnable. A layer not listed is refused for the key |
| Class | Trust class of annex X §X.2. W widening. N narrowing, with what "stricter" means: `lo` lower is stricter, `lo0` lower is stricter and 0 means unlimited (so 0 is the least strict), `on` or `off` the stricter value, `sub` a subset. `-` neutral |
| Snap | Class of the key in the run snapshot: `p` pinned, `t` tunable (annex B §B.12) |
| Owner | The feature that owns the meaning of the key. This feature owns the spelling, the type, the class and the layers |

Rows of the `parity` profile (annex X §X.7) are named by number. A key that is not a switch has, under `parity`, the value it has at the baseline, which is its default here.

### §K.2 Rules of spelling

| # | Rule |
|---|---|
| 1 | The schema is a closed list of exact spellings. A segment is lowerCamelCase. The exceptions are the spellings that annex X §X.7 fixes for its 43 rows and their family names, which keep their underscores (`closing_check`, `failfast`, `failfast_action`, `step_runner`, `ledger_handoff`, `polite_stop`, `block_set`, `check_points`, `quota_headroom`, `allow_detect`, `tier_bump`, `gate_fingerprint`, `phase_entry`, `manifest_relaunch`). A unit is a suffix in camelCase: `Sec`, `Ms`, `Min`, `Days`, `Bytes`, `Percent` (annex X §X.7, introduction; CQ-160) |
| 2 | An unknown key is an error that refuses the launch. The error names the file, the key and the nearest known key. The nearest key is found ignoring case and underscores, so `closingCheck` suggests `loop.micro.closing_check` |
| 3 | Environment name of a key: `SPECSTRIDE_` followed by the path in upper case, with each dot replaced by an underscore and each camelCase boundary split by an underscore. Where the baseline has a name for the key, that name is the environment name (the alias, §K.8) and the derived name is not read |
| 4 | Flag: `--set <path>=<value>`, repeatable, for every key. A short flag exists only where the baseline has one |
| 5 | Keys under `x-` at any depth are free for the consumer and ignored |

### §K.3 Identity, distribution, roles

| Key | Type and range | Default | Layers | Class | Snap | Owner |
|---|---|---|---|---|---|---|
| `schema` | whole number, 1 | 1 | P U | - | - | 110 |
| `profile` | name of a shipped profile, or unset | unset | F E U | W | p | 100 |
| `distribution.audience` | `personal`, `distributed` | `distributed` | U | W | p | 147. Row 34; `personal`. User file only (ruling 2; F100-FR-028; F147-FR-002; assumption: CQ-205) |
| `distribution.termsOverride` | list of {provider, tier, ack} | empty | U | W | p | 147 |
| `state.dir` | path of the control root | the user's state directory, keyed by the workspace (outside the working tree) | F E U | W | p | 122. Row 116; (fixture) |
| `engine.executable` | path | the product's own entry | F E U | W | p | 122, 123. Row 41; (fixture) |
| `roles.proposer.harness` | harness id of the registry | the shipped default, Claude in Wave 1 | F E P U | - | p | 110, 124. Row 36; (fixture) |
| `roles.proposer.model` | text | the harness default | F E P U | - | p | 109 |
| `roles.proposer.effort` | text | the harness default | F E P U | - | p | 109 |
| `roles.proposer.tier` | 1 or 2 | by the terms row for the audience (annex C §C.12) | F E U | W | p | 147. 3 is never valid |
| `roles.proposer.credential` | secret ref | none | F E U | W | p | 110 |
| `roles.proposer.timeoutSec` | whole number of seconds | 1800 | F E P U | N `lo` | t | 103 |
| `roles.proposer.idleTimeoutSec` | seconds | 900 | F E P U | N `lo` | t | 118 |
| `roles.proposer.progressTimeoutSec` | seconds | 1800 | F E P U | N `lo` | t | 118 |
| `roles.proposer.repeatLimit` | whole number | 12 | F E P U | N `lo` | t | 118 |
| `roles.proposer.repeatIgnore` | list of expressions | the built-in list of the baseline | F E P U | N `sub` | t | 118 |
| `roles.proposer.progressPaths` | list of paths | the working directory | F E P U | N `sub` | t | 118 |
| `roles.proposer.maxErrors` | whole number | 2 | F E P U | N `lo` | t | 103 |
| `roles.proposer.maxCaps` | whole number | 3 | F E P U | N `lo` | t | 103 |
| `roles.proposer.maxNoProgress` | whole number, 0 disables | 3 | F E P U | N `lo0` | t | 103 |
| `roles.<role>.fallback` | list of {harness, model?, auth?} | empty (off) | F E U | W | p | 127. Row 40; off |
| `roles.critic.harness` | harness id | by the critic order (annex C §C.6) | F E U | W | p | 110, 124. Row 36; (fixture) |
| `roles.critic.model` | text | the harness default, on a model tier other than the proposer's | F E U | W | p | 124 |
| `roles.critic.effort` | text | the harness default | F E U | W | p | 109 |
| `roles.critic.tier` | 1 or 2 | as for the proposer | F E U | W | p | 147. 3 is never valid |
| `roles.critic.credential` | secret ref | none | F E U | W | p | 110 |
| `roles.critic.transport` | `auto`, `as-is` | `auto` | F E U | W | p | 109, 124, 131, 138. Row 28; `as-is` |
| `roles.critic.timeoutSec` | seconds | 300 | F E P U | N `lo` | t | 117 |
| `roles.critic.malformedLimit` | whole number, 0 disables | 3 | F E P U | N `lo0` | t | 101 |
| `roles.critic.grounding` | true, false | true | F E P U | N `on` | t | 117. Row 52; true, unless the fixture sets it |
| `roles.critic.groundingMaxFiles` | whole number | 80 | F E P U | N `lo` | t | 117. Row 53; `80` |
| `roles.critic.anchorMaxBytes` | whole number | 49152 | F E P U | N `lo` | t | 117. Row 54; `49152` |
| `roles.critic.contextTokens` | whole number | the window of the model | F E U | W | t | 117. Row 55; not set, unless the fixture sets it |
| `roles.critic.debug` | true, false | false | F E U | - | t | 117. Row 56; false, unless the fixture sets it |
| `critic.autoPick` | true, false | true | F E U | W | p | 124. Row 35; not reached |
| `critic.autoPickMaxUsd` | number | none; required when the pick is on a metered endpoint | F E U | W | t | 124. Row 91; not used |
| `critic.warnSameModel` | true, false | true | F E U | - | t | 124. Row 92; not printed |
| `roles.diagnostician.enabled` | true, false | true | F E P U | N `off` | t | 101 |
| `roles.accelerator.enabled` | true, false | true | F E P U | N `off` | t | 101 |
| `roles.diagnostician.harness` | harness id of the registry | the baseline's: the role runs as critic-class or proposer-class | F E U | W | p | 101 |
| `roles.diagnostician.model` | text | the baseline's: the role runs as critic-class or proposer-class | F E U | W | p | 101 |
| `roles.accelerator.harness` | harness id of the registry | the baseline's: the role runs as critic-class or proposer-class | F E U | W | p | 101 |
| `roles.accelerator.model` | text | the baseline's: the role runs as critic-class or proposer-class | F E U | W | p | 101 |

Values of `roles.proposer.timeoutSec` and the other numeric defaults are those of `orchestrator.sh` at `9cab15d` (the built-in defaults; `.env.example` counts only where it repeats them), checked by task T002.

### §K.4 Per-phase keys

| Key | Type and range | Default | Layers | Class | Snap | Owner |
|---|---|---|---|---|---|---|
| `phases.<N>.proposer.harness` | harness id of the registry | inherits the role key | F E P U | - | p | 101 |
| `phases.<N>.proposer.model` | text | inherits the role key | F E P U | - | p | 101 |
| `phases.<N>.proposer.effort` | text | inherits the role key | F E P U | - | p | 101 |
| `phases.<N>.proposer.timeoutSec` | seconds | the value that the verification-commands document declares for the phase, else inherits the role key | F E P U | N `lo` | t | 103 |
| `phases.<N>.proposer.idleTimeoutSec` | seconds | the value that the verification-commands document declares for the phase, else inherits the role key | F E P U | N `lo` | t | 103 |
| `phases.<N>.critic.harness` | harness id | inherits the role key | F E U | W | p | 124 |
| `phases.<N>.critic.model` | text | inherits the role key | F E U | W | p | 124 |
| `phases.<N>.critic.timeoutSec` | seconds | inherits the role key | F E P U | N `lo` | t | 117 |
| `phases.<N>.budget.*` | as the key of the same last segment under `budget.run` and `budget.role.<role>` | inherits the key without the phase | F E P U | N `lo` | t | 127 |

`<N>` is the phase number as the spec-format adapter gives it, as text. The baseline names: `SPECSTRIDE_PROPOSER_TIMEOUT_PHASE_<N>` and `--proposer-timeout-phase N=SEC`, repeatable.

### §K.5 Loop, verification, carry-over, integrity, options

| Key | Type and range | Default | Layers | Class | Snap | Owner |
|---|---|---|---|---|---|---|
| `loop.strategy` | `micro`, `classic` | `micro` | F E P U | N (`classic` is stricter) | p | 115. Row 1; `classic` |
| `loop.micro.closing_check` | on, off | on | F E P U | N `off` | p | 115. Row 2; off |
| `loop.micro.caps.repairs` | whole number | 2 | F E P U | N `lo` | t | 115. Row 65; not used |
| `loop.micro.caps.escalationsPerTask` | whole number | 1 | F E P U | N `lo` | t | 115. Row 65; not used |
| `loop.micro.caps.escalationsPerAttempt` | whole number | 2 | F E P U | N `lo` | t | 115. Row 65; not used |
| `loop.micro.caps.proposalMin` | whole number of minutes | 20 | F E P U | N `lo` | t | 115. Row 65; not used |
| `loop.micro.caps.unitMin` | whole number of minutes | 30 | F E P U | N `lo` | t | 115. Row 65; not used |
| `loop.micro.caps.checkMin` | whole number of minutes | 5 | F E P U | N `lo` | t | 115. Row 65; not used |
| `loop.micro.caps.checkSharePercent` | whole number percent | 15 | F E P U | N `lo` | t | 115. Row 65; not used |
| `loop.micro.caps.cyclesExtra` | whole number | 6 | F E P U | N `lo` | t | 115. Row 65; not used |
| `loop.micro.caps.cyclesMin` | whole number | 12 | F E P U | N `lo` | t | 115. Row 65; not used |
| `loop.micro.caps.unresolvedUnits` | whole number | 2 | F E P U | N `lo` | t | 115. Row 65; not used |
| `loop.routing` | on, off | on | F E P U | N `off` | p | 115. Row 64; not used |
| `loop.escalation` | on, off | on | F E P U | N `off` | p | 115. Row 3; off |
| `loop.maxRejects` | whole number | 3 | F E P U | N `lo` | t | 101 |
| `loop.maxIter` | whole number | 30 | F E P U | N `lo` | t | 103 |
| `loop.maxWallMin` | minutes, 0 unlimited | 0 | F E P U | N `lo0` | t | 127. Row 107; 0, unless the fixture sets it |
| `loop.oscMax` | whole number | 2 | F E P U | N `lo` | t | 101 |
| `loop.yield.pollSec` | seconds | 30 | F E P U | N `lo` | t | 118 |
| `loop.yield.maxPerAttempt` | whole number | 4 | F E P U | N `lo` | t | 118 |
| `loop.yield.countsAsIter` | true, false | false | F E P U | - | t | 118 |
| `loop.yield.allowCommand` | true, false | false | F E U | W | p | 118 |
| `loop.yield.waitEvery` | whole number of ticks, 0 disables | 10 | F E P U | - | t | 118 |
| `loop.yield.logHead` | whole number of lines | 40 | F E P U | - | t | 118 |
| `loop.yield.logTail` | whole number of lines | 80 | F E P U | - | t | 118 |
| `loop.yield.failureLedger` | true, false | true | F E P U | - | t | 118 |
| `loop.yield.failureLedgerMax` | whole number | 150 | F E P U | - | t | 118 |
| `loop.yield.failurePattern` | expression | the built-in pattern of the baseline | F E P U | - | t | 118. Alias `SPECSTRIDE_FAILURE_PATTERN` |
| `loop.promptMaxBytes` | whole number, 0 disables | 180000 | F E P U | N `lo0` | t | 103 |
| `loop.promptProtectedBlocks` | list of block names | `yield_contract` | F E P U | N `sub` | t | 103 |
| `loop.passPauseSec` | seconds | 2 | F E P U | - | t | 103 |
| `loop.watchdogTickSec` | seconds | 15 | F E P U | - | t | 118 |
| `loop.shortPass.sec` | seconds | 180 | F E P U | - | t | 118 |
| `loop.shortPass.nudgeAfter` | whole number | 2 | F E P U | - | t | 118 |
| `loop.noProgressStructured` | on, off | on | F E P U | N `on` | p | 103. Row 59; off |
| `loop.gitCommits` | `auto`, `on`, `off` | `auto` | F E P U | - | p | 101. The reverse command forces `off` |
| `loop.tickTasks` | true, false | true | F E P U | - | t | 104 |
| `loop.parallel.units` | on, off | off | F E P U | N `off` | p | 142. Row 20; off. Row 145 records what spec 154 adds to it (F154-FR-009…-011, -020…-025, -029) |
| `loop.parallel.noRepeat` | on, off | on | F E P U | N `on` | p | 154. Row 146; off. Amends F142-FR-023's scope; rides the layer switch |
| `loop.parallel.mergeBaseline` | on, off | off | F E P U | N `off` | p | 154. Row 147; off. Amends F142-FR-061 (CQ-154-17 A) |
| `loop.parallel.groupUnits` | on, off | off | F E P U | N `off` | p | 154. Row 148; off. CQ-154-02 C with (iii) |
| `loop.parallel.groupCheck` | on, off | off | F E P U | N `off` | p | 154. Row 149; off. CQ-154-04 A; amends F142-FR-059, F143-FR-011, F143-FR-012 |
| `host.limits` | on, off | off | F E P U | N `off` | p | 154. Row 150; off. CQ-154-14 A; files in user-level state, a wait is a pause |
| `pipeline.stageGroups` | on, off | off | F E P U | N `off` | p | 154. Row 151; off. CQ-154-05 A; amends F123-FR-019 and F107 |
| `loop.phases.parallel` | on, off | off | F E P U | N `off` | p | 154. Row 152; off. CQ-154-07 A; the dependency field of the canonical model |
| `loop.speculate` | on, off | off | F E P U | N `off` | p | 154. Row 153; off. CQ-154-08 A and CQ-154-18 A: depth 1, window 20 attempts, threshold 50 % |
| `loop.parallel.workers` | whole number, 1 to the value of `loop.parallel.workersMax` | 2 | F E P U | N `lo` | t | 142. Row 21; not used. A value above `loop.parallel.workersMax` is a configuration error |
| `loop.parallel.workersMax` | whole number, at least 1 | 4 | F E U; P lowers | W; P may lower | p | 142. Row 130; not used. The project file may lower it and never raise it (F110-FR-019) |
| `loop.parallel.quota_headroom` | percent, 1 to 100 | 70 | F E P U | N `lo` | t | 142. Row 22; not used |
| `loop.parallel.allow_detect` | on, off | off | U | W | p | 142. Row 23; off. From the user file only (F110-FR-019, CQ-183) |
| `loop.parallel.exclude` | list of task ids | empty | F E P U | N (a superset is stricter) | t | 142. Row 94; not used |
| `loop.parallel.scopes.<taskId>` | list of path prefixes | none | F E U; P narrows | W; see F110-FR-019 | p | 142. Row 93; not used |
| `loop.parallel.seedPaths` | list of paths | empty | F E U | W | p | 143. Row 95; not used |
| `loop.parallel.resources.<name>.capacity` | whole number | 1 | F E U | W | p | 142. Row 96; not used |
| `attempt.tier_bump` | on, off | off | F E P U | N `off` | p | 149. Row 24; off |
| `attempt.tier_bump_after` | whole number, at least 1 | 2 | F E P U | - | t | 149. Row 128; not used. K of the model-tier bump |
| `commit.backpressure` | on, off | on | F E P U | N `off` | p | 152. Row 134; off. The commit gate of F152-FR-021 |
| `verification.timeLimit.enforce` | on, off | on | F E P U | N `on` | p | 153. Row 135; on. The enforced time limit of F153-FR-029 (CQ-153-13 A: a ruled defect fix) |
| `loop.micro.closingCheck.skipWhenEqualToGate` | on, off | on | F E P U | N `on` | p | 153. Row 136; off. The closing-check skip of F153-FR-012 |
| `verification.inner.scoped` | on, off | on | F E P U | N `on` | p | 153. Row 137; off. The scoped inner set of F153-FR-045 |
| `critic.evidence.perTask` | on, off | on | F E P U | N `on` | p | 153. Row 138; off. The per-task critic evidence of F153-FR-051 |
| `verification.redGate.ownBudget` | on, off | on | F E P U | N `off` | p | 153. Row 139; off. The red gate's own budget of F153-FR-020 (CQ-153-05 answered A on 2026-11-13) |
| `verification.redGate.limit` | whole number, at least 1 | 3 | F E P U | N `lo` | t | 153. The size of the red-gate budget of F153-FR-021; a project file may lower it, never raise it |
| `commit.gate.beforeCritic` | on, off | on | F E P U | N `off` | p | 153. Row 140; off. The commit scan before the critic of F153-FR-024 (CQ-153-06 answered A on 2026-11-13: it runs only where `commit.backpressure` is also on) |
| `commit.scan.inPass` | on, off | on | F E P U | N `off` | p | 153. Row 141; off. The in-pass scan command of F153-FR-027 (CQ-153-17 answered A on 2026-11-13: the command `scan`, codes 0/2/1/3) |
| `loop.taskGroups` | on, off | off | F E P U | N `off` | p | 153. Row 142; off. The task groups of F153-FR-054 (CQ-153-15 answered A on 2026-11-13: a group of at most the sibling size key's tasks, default 5; off until one trial run with groups on has been read with `specstride report`) |
| `verification.gate.reuse` | on, off | off | F E P U | N `off` | p | 153. Row 143; off. The reuse of a green in-pass result at the gate of F153-FR-013 — CQ-153-02 answered B (refused) on 2026-11-13: not built; the gate executes every time (F153-FR-015) |
| `events.commitGateTiming` | on, off | on | F E P U | N `off` | p | 153. Row 144; off. The timed pair of the commit gate of F153-FR-036 (CQ-153-09 answered A on 2026-11-13: the pair is additive catalogue rows, no new `endCause`) |
| `harnesses.<id>.tiers` | list of model ids, lowest first | the tiers of the descriptor | F E U | W | p | 109. The ladder of the model-tier bump and of `loop.escalation` |
| `verification.mode` | `required`, `plan`, `off` | `required` | F E P U | N (`required` is stricter than `plan`, `plan` than `off`) | p | 105. Row 123; (fixture) |
| `verification.testPlan` | path under the working directory | `testautomation/<slug>/TEST_PLAN.md`, unless the mode is `off` | F E P | - | p | 105. Row 124; (fixture) |
| `verification.generateTests` | path under the working directory | `testautomation/<slug>/generated`, unless the mode is `off` | F E P | - | p | 105. Row 124; (fixture) |
| `verification.commands` | path | none | F E U | W | p | 105. Row 124; (fixture). Runs code |
| `verification.longJob.phase` | whole number (phase number) | none | F E | W | p | 118 |
| `verification.longJob.cmd` | command text | none | F E | W | p | 118 |
| `verification.parallelism` | 1 to 4 | 1 | F E P U | N `lo` | t | 148. Row 7; `1` |
| `verification.step_runner` | on, off | off | F E P U | N `off` | p | 148. Row 6; off |
| `verification.failfast` | on, off | on | F E P U | - | p | 118. Row 4; off |
| `verification.failfast_action` | `stop`, `continue-and-notify` | `stop` | F E P U | - | t | 118. Row 5; not used |
| `verification.failfastGraceSec` | seconds | 10 | F E P U | N `lo` | t | 118. Row 51; not used |
| `carry.ledger_handoff` | on, off | on | F E P U | - | p | 103. Row 8; off |
| `carry.index` | on, off | on | F E P U | - | p | 103. Row 9; off |
| `carry.polite_stop` | on, off | on | F E P U | - | p | 118. Row 11; off |
| `carry.continuation` | on, off | on, where the harness supports it | F E P U | - | p | 125, 103. Row 10; off |
| `carry.politeStopGraceSec` | seconds | 10 | F E P U | N `lo` | t | 118. Row 50; not used |
| `carry.handoffMaxBytes` | whole number of bytes | 6144 | F E P U | - | t | 103. Row 60; not used |
| `carry.indexTitleChars` | whole number of characters | set by the plan | F E P U | - | t | 103. Row 60; not used |
| `carry.maxContinuedPasses` | whole number | 3 | F E P U | - | t | 103. Row 60; not used |
| `carry.contextFillTokens` | whole number of tokens | 150000 | F E P U | - | t | 103. Row 60; not used |
| `carry.contextFillShare` | whole number percent | 50 | F E P U | - | t | 103. Row 60; not used |
| `carry.ageFallbackSec` | seconds | 300 | F E P U | - | t | 103. Row 60; not used |
| `prompt.block_set` | `current`, `as-is` | `current` | F E P U | - | p | 103. Row 12; `as-is` |
| `prompt.critic.block_set` | `current`, `as-is` | `current` | F E P U | - | p | 117. Row 58; `as-is` |
| `prompt.critic.overWindow` | `refuse`, `send` | `refuse` | F E U | W | t | 117. Row 57; `send` |
| `staleness.check_points` | list from `launch`, `resume`, `pass-start`, `critic-start` | `launch`, `resume`, `pass-start` | F E P U | N (a superset of the check points is stricter) | p | 102, 103, 105. Row 15; `critic-start` |
| `integrity.gate_fingerprint` | on, off | on | F E P U | N `on` | p | 148, 117. Row 31; off |
| `integrity.phase_entry` | on, off | on | F E P U | N `on` | p | 116. Row 32; off |
| `integrity.manifest_relaunch` | on, off | on | F E P U | N `on` | p | 105. Row 33; off |
| `toolchains.<id>` | profile of `specstride.toolchain/1` | none | U | W | p | 116. From the user file only; stored under `user:toolchain:<id>` |
| `relaunch.owner` | `root`, `supervise` | `root` | F E P U | N (`supervise` is stricter) | t | 123. Row 14; `supervise` |

### §K.6 Harnesses, safety, quota, telemetry, output, and the rest

| Key | Type and range | Default | Layers | Class | Snap | Owner |
|---|---|---|---|---|---|---|
| `harnesses.<id>` | descriptor of feature 109's schema | none | F U | W | p | 109. Lists merge by id (F110-FR-016) |
| `harnesses.<id>.bin` | path | found by the descriptor | F E U | W | p | 109 |
| `harnesses.<id>.profile` | text | none | F E U | W | p | 130 |
| `harnesses.<id>.overlay` | `none`, `pass`, `attempt` | unset: follows the auth tier | F E U | W | p | 109. Row 30; none |
| `harnesses.<id>.proposerCustomisations` | off, on | off | F E U | W | p | 131, 134. Row 131; `as-is`. Also read by 130 and 138. Never loaded into a critic-class call |
| `harnesses.<id>.transport` | `subprocess`, `sdk-in-process`, `direct-call` | `subprocess` | F E U | W | p | 109, 125. Row 27; `subprocess` |
| `harnesses.<id>.pluginAllowlist` | list of exact package@version | empty | F E U | W | p | 130. Row 118; (fixture) |
| `harnesses.<id>.pluginTimeoutSec` | seconds | 600 | F E U | N `lo` | t | 130 |
| `harnesses.<id>.auth.credential` | secret ref | none | F E U | W | p | 110 |
| `sandbox.level` | `C0` to `C3`, `auto` | `auto` | F E U; the value `C0` from U only | W | p | 109. Row 25; `C0` (as at the baseline: none). The value `C0` is accepted from the user file only (F110-FR-019, CQ-183) |
| `sandbox.permissionMode` | mode of the harness, or `baseline` | contained (`acceptEdits` for Claude) | F E U | W | p | 125, 130, 131, 134, 138. Row 26; `baseline`. The key that feature 125 reads for the bypass mode |
| `memory.native.proposer` | off, on, as-is | `off` | F E U | W | p | 109. Row 29; `as-is` |
| `discovery.enabled` | true, false | true | F E U | - | t | 146. Row 87; off |
| `discovery.online` | true, false | true when a credential reference exists | F E U | - | t | 146. Row 88; off |
| `budget.run.costUsd` | number | none | F E U; P lowers | N `lo0` | t | 127. Row 108; none |
| `budget.role.<role>.costUsd` | number | none | F E U; P lowers | N `lo0` | t | 127. Row 108; none |
| `budget.role.<role>.tokens` | whole number | none | F E U; P lowers | N `lo0` | t | 127. Row 108; none |
| `budget.role.<role>.softTokens` | whole number per window | none | F E P U | N `lo` | t | 127. Row 108; none |
| `budget.alerts.thresholds` | list of percent | 50, 75, 90 | F E U | - | t | 127. Row 109; not used |
| `pause.maxTotalMs` | milliseconds | 86400000 (24 h) | F E U; P lowers | N `lo` | t | 127. Row 39; not reached |
| `telemetry.enabled` | true, false | false | F E U | W | t | 128. Row 97; false, unless the fixture sets it |
| `telemetry.otel.enabled` | true, false | false | F E U | W | t | 128. Row 98; false, unless the fixture sets it |
| `telemetry.loki.url` | URL | `http://localhost:3100` | F E U | W | t | 128. Row 97; `http://localhost:3100` |
| `telemetry.otel.url` | URL | `http://localhost:4318` | F E U | W | t | 128. Row 98; `http://localhost:4318` |
| `telemetry.content` | `auto`, `off` | `auto` (captured whenever traces are on) | F E U | W | p | 128. Row 16; off |
| `telemetry.sinkTimeoutMs` | milliseconds | 2000 | F E U | N `lo` | t | 111. Row 46; not used. A time limit, so narrowing (annex X §X.2) |
| `telemetry.otel.legacyMetricNames` | on, off | off | F E U | - | t | 128. Row 42; off. Spelling corrected, see §K.9 |
| `observability.limits.text` | whole number | 4096 | F E P U | N `lo` | t | 111. Row 44; `4096` |
| `observability.limits.toolArguments` | whole number | 2048 | F E P U | N `lo` | t | 111. Row 44; `2048` |
| `observability.limits.toolResult` | whole number | 4096 | F E P U | N `lo` | t | 111. Row 44; `4096` |
| `observability.limits.diagnostic` | whole number | 1024 | F E P U | N `lo` | t | 111. Row 44; `1024` |
| `observability.limits.target` | whole number | 512 | F E P U | N `lo` | t | 111. Row 44; `512` |
| `observability.limits.maxTargets` | whole number | 8 | F E P U | N `lo` | t | 111. Row 44; `8` |
| `observability.limits.freeText` | whole number | 1024 | F E P U | N `lo` | t | 111. Row 44; `1024` |
| `observability.retention.rawCapture` | on, off | off | F E U | W | t | 111, 126. Row 45; off |
| `observability.retention.rawDays` | whole number of days | 7 | F E U | W | t | 111, 126. Row 45; `7` |
| `observability.retention.metadataDays` | whole number of days | 30 | F E U | W | t | 111, 126. Row 45; `30` |
| `compat.legacyEvents` | on, off | off | F E P U | - | p | 144. Row 17; on |
| `output.compat` | on, off | off | F E P U | - | p | 119, 123. Row 18; on (compatibility output) |
| `output.live` | `auto`, `true`, `false` | `auto` | F E P U, C | - | t | 145. Row 70; `auto`. Pinnable |
| `output.verbose` | true, false | false | F E | - | t | 119. Row 72; not used |
| `output.liveDetail` | `milestones`, `tools`, `full` | `tools` | F E P U | - | t | 145. Row 71; `tools` |
| `learning.mode` | off, suggest, apply | `off` | F E U, C | W | p | 106. Row 43; (fixture). Pinnable |
| `learning.through` | run id | none | C only | - | p | 106. Pinnable outside `parity` |
| `spec.format` | id of the spec-format registry | detected | F E P U | - | p | 104. Row 49; (fixture) |
| `spec.feature` | feature slug | the last active | F E P | - | p | 104. Row 49; (fixture) |
| `spec.contextBudget` | characters | 24000 | F E P U | N `lo` | t | 104. Row 49; `24000` |
| `reverse.contextBudget` | characters | 24000 | F E P U | N `lo` | t | 140. Row 69; `24000` |
| `reverse.maxFileBytes` | whole number of bytes | 1048576 | F E P U | N `lo` | t | 140. Row 69; `1048576` |
| `reverse.maxTotalBytes` | whole number of bytes | 20971520 | F E P U | N `lo` | t | 140. Row 69; `20971520` |
| `reverse.tasks` | `done`, and the members feature 108 lists | `done` | F E P U | - | t | 108. Row 68; `done` |
| `derive.judgment.harness` | harness id | unset | F E U | W | p | 107. Row 47; unset |
| `supervise.maxRelaunches` | 0 to 5 | 2 | F E U; P lowers | N `lo` | t | 107. Row 48; unset |
| `supervise.wallClockSec` | seconds | derived | F E U; P lowers | N `lo` | t | 107. Row 48; unset |
| `derive.stageTimeoutSec` | whole number of seconds, at least 1 | 86400 | F E U; P lowers | N `lo` | t | 107. The time limit of the action of a stage that derivation writes (F107-FR-041) |
| `verification.scopes.<commandId>.reads` | list of path prefixes, or `tree` | none | F E U | W | p | 107; read by 105 and 148 through the launch contract (`configuration.scopes`). Not used under `parity` |
| `verification.scopes.<commandId>.writes` | list of path prefixes | none | F E U | W | p | 107; read by 105 and 148, as above |
| `verification.scopes.<commandId>.sideEffects` | `none`, or unset | unset | F E U | W | p | 107; read by 105 and 148, as above |
| `doctor.staleAfterDays` | whole number of days | 90 | F E U | - | t | 112. Row 61; not used |
| `doctor.online` | true, false | true | F E U | - | t | 112. Row 61; not used |

Environment aliases that carry a key of this table are in §K.8. A key of the baseline that has no place in the port is listed in "As-is behaviour not carried".

### §K.6b Keys proposed by other features

Each key was proposed by the feature named in the catalogue file `contracts/config-keys.tsv`; spelling, type, class and layers are decided here. Where two features proposed different keys for one thing, one stands (§K.9).

| Key | Type and range | Default | Layers | Class | Snap | Owner |
|---|---|---|---|---|---|---|
| `verification.envAllowlist` | on, off | on | F E P U | N `on` | p | 148. Row 125; off |
| `verification.summary.tailLines` | whole number of lines | 80 | F E P U | - | t | 105. Row 126; `80`. Alias `SPECSTRIDE_VERIFY_TAIL_LINES` |
| `verification.summary.tailErrLines` | whole number of lines | 40 | F E P U | - | t | 105. Row 126; `40`. Alias `SPECSTRIDE_VERIFY_TAIL_ERR_LINES` |
| `doctor.probeTimeoutSec` | seconds | 5 | F E U | - | t | 112. Row 61; not used |
| `doctor.probeOutputBytes` | whole number of bytes | 65536 | F E U | - | t | 112. Row 61; not used |
| `output.color` | text | unset | F E P U | - | t | 145. Row 73; unset |
| `output.banner` | on, off | on | F E P U | - | t | 145. Row 74; on |
| `output.liveRail` | on, off | on | F E P U | - | t | 145. Row 76; on |
| `output.motion` | on, off | on where a terminal allows it | F E P U | - | t | 145. Row 75; as at the baseline |
| `output.bannerBg` | text | unset | F E P U | - | t | 145. Row 77; unset |
| `output.ascii` | on, off | off | F E P U | - | t | 145. Row 78; off |
| `runtime.detach.strategy` | id of the detach registry | `spawn-detached` | F E U | W | p | 122. Row 113; `spawn-detached` |
| `runtime.handshake.timeoutSec` | seconds | 30 | F E U | - | t | 122. Row 114; `30` |
| `runtime.lease.heartbeatSec` | seconds | 10 | F E U | - | t | 122. Row 114; `10` |
| `runtime.lease.graceSec` | seconds | 30 | F E U | - | t | 122. Row 114; `30` |
| `runtime.lock.provider` | id | the shipped provider | F E U | W | p | 122. Row 115; `the shipped provider` |
| `roles.refuseUnknown` | on, off | on | F E P U | N `on` | p | 124. Row 90; off |
| `critic.catalogueWindowMargin` | whole number percent | 20 | F E U | - | t | 146. Row 89; not used |
| `roles.critic.provider` | text | none | F E U | W | p | 130 |
| `harnesses.<id>.endpoint.base` | URL | the descriptor's | F E U | W | p | 131. Secured except loopback |
| `harnesses.<id>.authTier` | 1 or 2 | by the terms row for the audience | F E U | W | p | 131 |
| `harnesses.<id>.contextWindows` | map from model id to tokens | none | F E U | W | t | 130 |
| `harnesses.<id>.envAllow` | list of variable names | none | F E U | W | p | 138 |
| `harnesses.claude.proposerSkills` | on, off | off | F E U | W | p | 125. Row 119; off |
| `harnesses.claude.subprocessEnvScrub` | on, off | on | F E U | N `on` | p | 125. Row 120; off |
| `harnesses.claude.gitInstructions` | text | unset | F E U | - | p | 125. Row 121; unset |
| `harnesses.claude.disableSubagents` | on, off | off | F E U | N `on` | p | 125. Row 122; not used |
| `harnesses.claude.label` | text | unset | F E U | - | t | 125 |
| `harnesses.dsh.home` | path | the consumer's home of the harness | F E U | W | p | 130 |
| `harnesses.dsh.provider` | text | none | F E U | W | p | 130 |
| `harnesses.dsh.modelProviders` | table of model to provider | none | F E U | W | p | 130 |
| `harnesses.dsh.critic.proof` | `strict`, `none` | `strict` | F E U | N `strict` | p | 130. Row 117; none |
| `harnesses.prime.launcher` | path | the as-is default name | F E U | W | p | 138 |
| `harnesses.prime.tools` | list | none | F E U | N `sub` | p | 138 |
| `stream.tap` | on, off | on | F E U | - | p | 126. Row 79; on. Row 86 names the same switch |
| `stream.tapExecutable` | path | unset | F E U | W | p | 126. Row 80; unset |
| `stream.limits.lineBytes` | whole number of bytes | 1048576 | F E U | N `lo` | t | 126. Row 81; off |
| `stream.limits.linesPerSecond` | whole number | 5000 | F E U | N `lo` | t | 126. Row 81; off |
| `stream.noActivityFlag` | on, off | on | F E U | - | p | 126. Row 82; off |
| `invocation.recordAllPasses` | on, off | on | F E U | - | p | 126. Row 83; off |
| `invocation.idBase` | text | unset | F E U | - | t | 126. Row 84; unset |
| `invocation.debug` | on, off | off | F E U | W | t | 126. Row 85; off |
| `budget.role.<role>.calls` | whole number | none | F E U; P lowers | N `lo0` | t | 127. Row 108; none |
| `budget.run.tokens` | whole number | none | F E U; P lowers | N `lo0` | t | 127. Row 108; none |
| `budget.run.phaseAttempts` | whole number | none | F E U; P lowers | N `lo0` | t | 127. Row 108; none |
| `budget.run.calls` | whole number | none | F E U; P lowers | N `lo0` | t | 127. Row 108; none |
| `budget.rates` | table of model rates | unset | F E U | - | t | 127. Row 110; unset |
| `pause.marginMs` | milliseconds | 60000 | F E U | - | t | 127. Row 111; not reached |
| `pause.jitterMs` | milliseconds | 30000 | F E U | - | t | 127. Row 111; not reached |
| `pause.probeScheduleMs` | list of milliseconds | 300000, 900000, 1800000, 3600000 | F E U | - | t | 127. Row 111; not reached |
| `quota.transientMaxWaitMs` | milliseconds | 60000 | F E U | - | t | 127. Row 111; not reached |
| `quota.overloadRetries` | whole number | 3 | F E U | - | t | 127. Row 111; not reached |
| `roles.<role>.fallbackAfterMs` | milliseconds | 0 | F E U | W | t | 127. Row 112; not used |
| `roles.<role>.fallbackReturn` | `restore`, and the members 127 lists | `restore` | F E U | W | t | 127. Row 112; not used |
| `status.precompute` | on, off | on | F E U | - | p | 129. Row 127; off |
| `status.staleEventSec` | seconds | 1800 | F E U | - | t | 129 |
| `status.timelineRows` | whole number | 20 | F E U | - | t | 129 |
| `wait.pollSec` | seconds | 5 | F E U | - | t | 129 |
| `wait.timeoutSec` | seconds | 600 | F E U | - | t | 129 |
| `telemetry.contentMaxPromptBytes` | whole number of bytes | 262144 | F E U | N `lo` | t | 128. Row 101; not used |
| `telemetry.contentMaxReplyBytes` | whole number of bytes | 16384 | F E U | N `lo` | t | 128. Row 101; not used |
| `telemetry.otel.traces` | on, off | on | F E U | - | t | 128. Row 99; on |
| `telemetry.otel.dialects` | list | empty | F E U | - | t | 128. Row 100; empty |
| `telemetry.loki.timeoutMs` | milliseconds | 2500 | F E U | N `lo` | t | 128. Row 102; `2500` |
| `telemetry.otel.timeoutMs` | milliseconds | 2500 | F E U | N `lo` | t | 128. Row 102; `2500` |
| `telemetry.loki.maxBatchBytes` | whole number of bytes | 3145728 | F E U | N `lo` | t | 128. Row 103; `3145728` |
| `telemetry.otel.maxBatchBytes` | whole number of bytes | 3145728 | F E U | N `lo` | t | 128. Row 103; `3145728` |
| `telemetry.flush.intervalMs` | milliseconds, 0 flushes at every event | 2000 | F E U | N `lo` | t | 128. Row 104; `0` |
| `telemetry.queueMaxEvents` | whole number of events | 10000 | F E U | N `lo` | t | 128. Row 105; not used |
| `telemetry.loki.auth` | secret ref | unset | F E U | W | p | 128. Row 106; unset |
| `telemetry.otel.auth` | secret ref | unset | F E U | W | p | 128. Row 106; unset |

### §K.7 Secret references, resolvers, closed sets of this feature

| Scheme | Reference form | What it names |
|---|---|---|
| `env:` | `env:NAME` | A variable of the environment of the process |
| `file:` | `file:/absolute/path` (after expanding a leading `~/`) | A file that holds the value |
| `keychain:` | `keychain:SERVICE/ACCOUNT` | An entry of the keychain of the platform |

The results of `exists` are `yes`, `no`, `unprobed`. The errors are `missing`, `inline-secret`, `unsafe-file`.

### §K.8 Environment aliases

Annex X §X.8 holds the alias table as feature 100 fixed it. This feature adds the rows below and states two rules.

| As-is variable | Key |
|---|---|
| `SPECSTRIDE_DSH_PLUGIN_ALLOWLIST`, `SPECSTRIDE_DSH_PLUGIN_TIMEOUT` | `harnesses.dsh.pluginAllowlist`, `harnesses.dsh.pluginTimeoutSec` |
| `SPECSTRIDE_DSH_REASONING_EFFORT` | `roles.proposer.effort`, when the proposer is that harness |
| `SPECSTRIDE_CONTEXT_BUDGET` | both `spec.contextBudget` and `reverse.contextBudget` (one variable feeds two keys, as at the baseline) |
| `SPECSTRIDE_PROPOSER_MAX_NOPROGRESS`, `SPECSTRIDE_PROPOSER_REPEAT_IGNORE` | `roles.proposer.maxNoProgress`, `roles.proposer.repeatIgnore` |
| `SPECSTRIDE_PROMPT_PROTECTED_BLOCKS` | `loop.promptProtectedBlocks` |
| `SPECSTRIDE_TICK_TASKS` | `loop.tickTasks` |
| `SPECSTRIDE_YIELD_COUNTS_AS_ITER` | `loop.yield.countsAsIter` |
| `SPECSTRIDE_WATCHDOG_TICK` | `loop.watchdogTickSec` |
| `SPECSTRIDE_SHORT_PASS_SEC`, `SPECSTRIDE_SHORT_PASS_NUDGE_AFTER` | `loop.shortPass.sec`, `loop.shortPass.nudgeAfter` |
| `SPECSTRIDE_YIELD_WAIT_EVERY`, `SPECSTRIDE_YIELD_LOG_HEAD`, `SPECSTRIDE_YIELD_LOG_TAIL` | `loop.yield.waitEvery`, `loop.yield.logHead`, `loop.yield.logTail` |
| `SPECSTRIDE_FAILURE_LEDGER`, `SPECSTRIDE_FAILURE_LEDGER_MAX`, `SPECSTRIDE_FAILURE_PATTERN` | `loop.yield.failureLedger`, `loop.yield.failureLedgerMax`, `loop.yield.failurePattern` |
| `SPECSTRIDE_VERIFY_TAIL_LINES`, `SPECSTRIDE_VERIFY_TAIL_ERR_LINES` | `verification.summary.tailLines`, `verification.summary.tailErrLines` (B-1028, B-1029; row 126 of annex X §X.7) |
| `SPECSTRIDE_AGENT_STREAM`, `SPECSTRIDE_AGENT_TAP` | `stream.tap`, `stream.tapExecutable` (annex X §X.8; the keys of feature 126) |
| `SPECSTRIDE_OTEL_TRACES` | `telemetry.otel.traces` |
| `RALPH_LOKI_URL`, `RALPH_OTEL_URL` | `telemetry.loki.url`, `telemetry.otel.url` (the standalone shippers of the baseline read them; B-2277, B-2312) |
| `RALPH_LOKI_TIMEOUT`, `RALPH_OTEL_TIMEOUT` | `telemetry.loki.timeoutMs`, `telemetry.otel.timeoutMs`; the as-is value is seconds, decimal, and is converted to milliseconds (B-2275, B-2310) |
| `RALPH_LOKI_MAX_BATCH_BYTES`, `RALPH_OTEL_MAX_BATCH_BYTES` | `telemetry.loki.maxBatchBytes`, `telemetry.otel.maxBatchBytes` (B-2276, B-2311) |
| `SPECSTRIDE_PRIME_FLEET_BIN`, `SPECSTRIDE_PRIME_BIN` | `harnesses.prime.launcher`: the fleet variable is read first and the second when the first is unset, as at the baseline (B-0518, B-0827). This order is the one exception to F110-FR-020: the two names reach one key and do not refuse the launch when they differ; the first set wins. An empty first variable is read as unset (the narrowest reading; `assumption: CQ-196`) |
| `NO_COLOR`, `FORCE_COLOR`, `TERM`, `COLORTERM` | Variables of the platform: no key. They reach the output layer of feature 145 directly. The reading of `NO_COLOR` is the baseline's: set and non-empty gives colour depth `none`, checked after the caller's `--color` (B-1411) and before `FORCE_COLOR` (B-1412) |
| `SPECSTRIDE_OTEL_PORT`, `SPECSTRIDE_LOKI_PORT`, `SPECSTRIDE_GRAFANA_PORT`, `SPECSTRIDE_PROMETHEUS_PORT`, `SPECSTRIDE_OTEL_GRPC_PORT` | Ports of the bundled observability stack of the baseline: no key |
| Variables of a locally registered backend | Not carried (register row DV-064) |

Rule A: an as-is variable name is read only at rank 4. Rule B: when the as-is name and a flag or file give different values, the ranks decide; when two environment names reach one key and differ, the launch is refused (F110-FR-020). The full table is completed from the 226 items of kind `env` of the inventory by task T005.

### §K.9 Spelling of the keys of annex X §X.7, confirmed or corrected

| Row | Key of annex X | Decision |
|---|---|---|
| 1 to 5 | `loop.strategy`, `loop.micro.closing_check`, `loop.escalation`, `verification.failfast`, `verification.failfast_action` | Confirmed |
| 6, 7 | `verification.step_runner`, `verification.parallelism` | Confirmed |
| 8 to 12 | `carry.ledger_handoff`, `carry.index`, `carry.continuation`, `carry.polite_stop`, `prompt.block_set` | Confirmed |
| 13 | The flag `--reset-counts` | Confirmed: a flag of `resume` and no key. The flag is never read from a file or the environment |
| 14, 15 | `relaunch.owner`, `staleness.check_points` | Confirmed. Values of row 15: the four of §K.5 |
| 16 | `telemetry.content` | Confirmed. Type: `auto` or `off`, because "follows traces" is not a truth value |
| 17, 18 | `compat.legacyEvents`, `output.compat` | Confirmed |
| 19 | (follows rows 1, 18, 20) | Confirmed: no key |
| 20 to 23 | `loop.parallel.units`, `.workers`, `.quota_headroom`, `.allow_detect` | Confirmed |
| 24 | `attempt.tier_bump` | Confirmed; K is `attempt.tier_bump_after`, the ladder is `harnesses.<id>.tiers` |
| 25, 26 | `sandbox.level`, `sandbox.permissionMode` | Confirmed. Reserved literal `baseline` for the second under `parity` |
| 27, 28 | `harnesses.<id>.transport`, `roles.critic.transport` | Confirmed. Values of the second: `auto`, `as-is` |
| 29 | `memory.native.proposer` | Confirmed. Values `off`, `on`, `as-is` |
| 30 | (follows the auth tier) | Confirmed: key `harnesses.<id>.overlay` of the alias table |
| 31 to 33 | `integrity.gate_fingerprint`, `integrity.phase_entry`, `integrity.manifest_relaunch` | Confirmed |
| 34 | `distribution.audience` | Confirmed |
| 35 | `critic.autoPick` | Confirmed. Literal under `parity`: false |
| 36 | `roles.proposer.harness`, `roles.critic.harness` | Confirmed. Under `parity` the profile leaves them unset and the fixture sets them |
| 37 | (the argument of `launch`) | Confirmed: no key |
| 38 | (pins of the launch contract) | Confirmed: an attribute of the schema, not a key. Under `parity` only `learning.mode` and `output.live` are honoured as pins |
| 39 | `pause.maxTotalMs` | Confirmed. Default 24 h by ruling 28 (R16 proposed 12 h). Not used under `parity` |
| 40 | `roles.<role>.fallback` | Confirmed |
| 41 | `engine.executable` | Confirmed |
| 42 | `otel.legacyMetricNames` | **Corrected** to `telemetry.otel.legacyMetricNames`, so that all keys of the OTLP exporter lie under `telemetry.otel` |
| 43 | `learning.mode` | Confirmed |

Keys that other features proposed, decided one by one: the full list with the old spelling of every correction is `contracts/config-keys.tsv`. The rule of §K.2 decides: a key that is not one of the 43 rows of annex X §X.7 and that has an underscore or a wrong unit suffix is corrected to lowerCamelCase.

| Old spelling | Decision | Reason |
|---|---|---|
| `verification.failfast_grace_sec` (118) | `verification.failfastGraceSec` | §K.2 |
| `carry.polite_stop_grace_sec` (118) | `carry.politeStopGraceSec` | §K.2 |
| `verification.env_allowlist` (105) | `verification.envAllowlist` | §K.2 |
| `loop.micro.caps.escalations_per_task`, `escalations_per_attempt`, `proposal_minutes`, `unit_minutes`, `check_minutes`, `check_share_percent`, `cycles_extra`, `cycles_min`, `unresolved_units` (115) | the same in lowerCamelCase: `escalationsPerTask` and so on | §K.2 |
| `loop.parallel.seed_paths` (142) | `loop.parallel.seedPaths` | §K.2 |
| `status.stale_event_sec`, `status.timeline_rows`, `wait.poll_sec`, `wait.timeout_sec` (129) | `status.staleEventSec`, `status.timelineRows`, `wait.pollSec`, `wait.timeoutSec` | §K.2 |
| `supervise.wallClockSeconds` (107, and R16) | `supervise.wallClockSec` | Unit suffix `Sec` |
| `otel.legacyMetricNames`, `otel.dialects` (128) | `telemetry.otel.legacyMetricNames`, `telemetry.otel.dialects` | All keys of the exporter under `telemetry.otel` |
| `telemetry.lokiUrl` (128, R16) | `telemetry.loki.url` | `telemetry.loki.*` holds the other keys |
| `telemetry.content.maxPromptBytes`, `telemetry.content.maxReplyBytes` (128) | `telemetry.contentMaxPromptBytes`, `telemetry.contentMaxReplyBytes` | `telemetry.content` is a value (`auto`, `off`) and cannot also be a parent |
| `loop.yield.poll` (106) | `loop.yield.pollSec` | `loop.yield.*` of annex X §X.8; unit suffix |
| `state.controlRoot` (122) | `state.dir` | Named by DP-071 and R16 for the control root |
| `harnesses.pi.contextWindow` (134) | `harnesses.<id>.contextWindows` | One key for every harness; 130 proposed the plural for dsh |
| `harnesses.dsh.contextWindows` (130) | `harnesses.<id>.contextWindows` | As above |
| `harnesses.dsh.reasoningEffort` (130) | `roles.proposer.effort` | One key per role; the alias `SPECSTRIDE_DSH_REASONING_EFFORT` reaches it |
| `roles.critic.reasoningEffort` (130) | `roles.critic.effort` | As above |
| `stream.capture` (138) | `stream.tap`, alias `SPECSTRIDE_AGENT_STREAM` | Same switch as 126's tap |
| `loop.parallel.tasks.<taskId>.writes` and `.eligible` (this feature, earlier) | Withdrawn for `loop.parallel.scopes.<taskId>` and `loop.parallel.exclude` (142) | 142 has them in its requirements; the two describe the same things |
| `fallback.after` (R16, this feature earlier) | Withdrawn for `roles.<role>.fallbackAfterMs` (127) | Per role, in milliseconds |
| `budget.alertThresholds` (R16) | `budget.alerts.thresholds` (127) | 127's nesting |
| `harnesses.<id>.credential` (this feature earlier) | `harnesses.<id>.auth.credential` (131) | Same as the descriptor field `auth.credential` |
| `harnesses.codex.endpoint.base`, `harnesses.codex.auth.credential`, `harnesses.codex.authTier` (131) | The generic keys `harnesses.<id>.endpoint.base`, `.auth.credential`, `.authTier` | Any harness of endpoint kind may need them |
| `session.ttl_seconds` (R24, 103) | Not a key | Feature 103 places the cache lifetime in the descriptor and in `carry.ageFallbackSec` |

Conflicts settled: the auth tier of a role is `roles.<role>.tier`; the auth tier of a harness is `harnesses.<id>.authTier`; the role key wins where both are set. `SPECSTRIDE_CONTEXT_BUDGET` feeds `spec.contextBudget` (104) and `reverse.contextBudget` (108), both stand. All other keys that features proposed are confirmed as spelled: `carry.handoffMaxBytes`, `carry.indexTitleChars`, `carry.maxContinuedPasses`, `carry.contextFillTokens`, `carry.contextFillShare`, `carry.ageFallbackSec`, `loop.noProgressStructured`, `loop.promptProtectedBlocks`, `loop.passPauseSec`, `loop.watchdogTickSec`, `loop.shortPass.sec`, `loop.shortPass.nudgeAfter`, `roles.proposer.maxNoProgress`, `progressPaths`, `repeatIgnore`, `roles.critic.groundingMaxFiles`, `anchorMaxBytes`, `debug`, `contextTokens`, `prompt.critic.block_set`, `prompt.critic.overWindow`, `loop.routing`, `observability.limits.*`, `observability.retention.*`, `telemetry.sinkTimeoutMs`, `derive.judgment.harness`, `supervise.maxRelaunches`, `spec.contextBudget`, `reverse.*`, and those of §K.6b not named above.
### §K.10 Short flags of the baseline

Short flags exist only where the baseline has one (§K.2 rule 4). Each sets its key at rank 2 (flag), as `--set` would, and is taken by the command `run` of annex G §G.1 of feature 100. The feature named owns the meaning.

| Flag | Key and value | Items | Owner |
|---|---|---|---|
| `--telemetry` | `telemetry.enabled` = true | C-006 | 128 |
| `--loki-url URL` | `telemetry.loki.url` = URL | C-006 | 128 |
| `--otel` | `telemetry.otel.enabled` = true | C-006 | 128 |
| `--otel-url URL` | `telemetry.otel.url` = URL | C-006 | 128 |
| `-j`, `--stream-json` | `telemetry.enabled` = true, unless a URL flag is given (rule below) | C-051, C-052, C-058 | 128 |

Rule of the telemetry flags (F128-FR-005): when `--loki-url` or `--otel-url` is given with `-j`, `telemetry.enabled` is set to whether `--loki-url` was given and `telemetry.otel.enabled` to whether `--otel-url` was given, both at rank 2. `--otel` never sets `telemetry.enabled`, and `--telemetry` never sets `telemetry.otel.enabled`. (Added 2026-09-30 from proposal U1 of feature 128's analyze run.)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A consumer sets a value and can see where it came from (Priority: P1)

A consumer sets a timeout in the user file, a different one in the environment, and a third in the project file of a repository. They run `config show`. They must see the value that applies, the layer it came from, and the layers that lost.

**Why this priority**: Every other feature reads its settings through this one. A value with no visible source is how a run costs six hours before anyone knows why.

**Independent Test**: Set one key in four layers; `config show` names the winning layer and lists the losers; the run record of a run started with the same layers holds the same source.

**Acceptance Scenarios**:

1. **Given** a key set in flag, environment, project and user file, **When** the consumer runs `config show`, **Then** the flag value is shown with the source `flag`, and the other three are listed as shadowed (F110-FR-024, F110-FR-025).
2. **Given** a project file that sets the critic and a telemetry address, **When** the run launches, **Then** both keys are ignored, one launch message names each, and the doctor holds a warning (F110-FR-017).
3. **Given** a project file with a key that the schema does not know, **When** the run launches, **Then** the launch is refused and the message suggests the nearest key (F110-FR-002).

---

### User Story 2 - The oracle drives both systems with the same variables (Priority: P1)

The parity oracle sets the as-is environment variables of the baseline and selects the profile `parity`. The port must read them and reach the same behaviour as the baseline.

**Why this priority**: Parity is a release condition (Principle XVIII). The alias table is the bridge.

**Independent Test**: For every variable of the alias table the oracle sets a value and reads the resolved key; the value equals what the baseline used.

**Acceptance Scenarios**:

1. **Given** `SPECSTRIDE_MAX_REJECTS=1`, **When** the port resolves `loop.maxRejects`, **Then** it is 1 with the source `environment` (F110-FR-020).
2. **Given** the profile `parity` and no other setting, **When** every switch is resolved, **Then** each has its value of annex X §X.7 (F110-FR-008, F110-FR-013).
3. **Given** the old variable `WIGGUM_MAX_ITER`, **When** the port starts, **Then** it is not read (F110-FR-020).
4. **Given** `SPECSTRIDE_PRIME_FLEET_BIN` set to the empty string and `SPECSTRIDE_PRIME_BIN=/usr/bin/prime-alt`, **When** the port resolves `harnesses.prime.launcher`, **Then** it is `/usr/bin/prime-alt`: the empty first variable is read as unset (`assumption: CQ-196`; F110-FR-020, §K.8).

---

### User Story 3 - A secret never rests in a file or an argument (Priority: P1)

A consumer stores an API key. They write a reference, not the key. A run uses the key and no state file, event, log, launch contract or argument list holds it.

**Why this priority**: The threat model rests on this (T-16, T-35).

**Independent Test**: The canary test plants a canary in a variable behind an `env:` reference, runs, and searches every artifact and the process list.

**Acceptance Scenarios**:

1. **Given** a key value that is not a reference, **When** the file is loaded, **Then** the launch is refused with `inline-secret` (F110-FR-027).
2. **Given** a `file:` reference to a file inside the workspace, or readable by others, **When** it is resolved, **Then** the result is `unsafe-file` (F110-FR-030).
3. **Given** a resolved value, **When** any sink is read, **Then** the value is not there (F110-FR-032).

---

### Edge Cases

- A key is set in the environment with an empty value: the empty value is a value and wins over lower ranks, as at the baseline (a set-but-empty variable counts); a type that cannot be empty makes it a configuration error.
- A project file sets a narrowing key to a looser value: the value is ignored with a launch message; the lower-rank value applies.
- A resume with a tunable key in the environment: the environment value applies; a pinned key in the environment does not (F110-FR-022).
- A per-phase key set for a phase that does not exist: accepted, unused, one doctor note.
- Two `--set` flags for one key: the last wins.
- A `keychain:` reference on Linux where no silent query is known: `exists` is `unprobed`, `resolve` still works where the tool is present.
- A secret reference in a project file: the key is widening and ignored.

## Requirements *(mandatory)*

Groups: G1 schema content and defaults (F110-FR-001 to F110-FR-013); G2 precedence, per-phase overrides, trust classes, aliases, provenance (F110-FR-014 to F110-FR-026); G3 secret references and resolvers (F110-FR-027 to F110-FR-035). Group G4, the terms gate, is feature 147-terms-gate (see "Requirements moved to 147-terms-gate"). No requirement carries an `origin:`: every as-is item that the traceability files assign to this feature is `superseded-by` a register row (see "As-is behaviour not carried"). Tests named `CT-110-1nn` are characterization or own tests; `PT-110-*` are parity tests through the alias table.

### Functional Requirements

#### G1 — Schema content and defaults

- **F110-FR-001**: The configuration schema MUST be the catalogue of §K.3 to §K.6: for every key its exact spelling, type and range, default, the layers that may set it, its trust class of annex X §X.2, its class in the run snapshot, and the feature that owns its meaning. A key MUST exist in the schema only with all of these. A value MUST be validated against its type and range when the layers are merged, and an invalid value MUST refuse the launch with the key, the value, the layer and the range in the message.
  - divergence: DV-027
  - test: CT-110-101

- **F110-FR-002**: Keys MUST follow the rules of §K.2. An unknown key MUST refuse the launch with the file, the key and the nearest known key, found ignoring case and underscores. A key under `x-` MUST be ignored. The environment name of a key MUST be derived by rule 3 of §K.2, and the as-is name MUST replace the derived name where the baseline has one. Every key MUST be reachable through `--set <path>=<value>`.
  - divergence: DV-027
  - test: CT-110-102

- **F110-FR-003**: A configuration file MUST carry `schema` with the major 1. The user file MUST be the file of the logical name `user:config` and the project file the file of `project:config` (annex B §B.5); the user file MUST honour the variable that names the user configuration directory of the platform, and the same location MUST be used on macOS, where the statement is `unverified`. A file with another major MUST be refused. The project file MUST NOT be searched above the workspace root.
  - status: unverified (check: run the loader on a macOS runner and read the file written by `config show --path`; verified-on: —; pin: none)
  - test: CT-110-103

- **F110-FR-004**: The install-root `.env` file of the baseline MUST NOT be read. The user file MUST take its role: a machine-wide default that the environment beats. A key of the user file, the project file or the environment that holds a secret value in clear MUST be an error (F110-FR-027).
  - divergence: DV-023
  - test: CT-110-104

- **F110-FR-005**: The launch defaults MUST be: the proposer and the critic both Claude, on different model tiers, where no role is named; `verification.mode` `required`. The proposer MUST come from a flag, the environment, a configuration file or the shipped default only, and an absent proposer MUST refuse the launch and name the discovered candidates. Lisa's defaults (one model for both roles, verification `off`) MUST NOT apply.
  - divergence: DV-004; DV-043
  - parity: every fixture names both roles (row 36 of annex X §X.7); the verification default is the baseline's (`required`)
  - test: CT-110-105
  - ep: EP-02 `specstride.harness/1` (consumes)

- **F110-FR-006**: Every key that has a counterpart in the baseline MUST have the baseline's default, which is the value under `parity`. The reference for the defaults is `orchestrator.sh` at `9cab15d`, the built-in defaults; `.env.example` counts only for a key whose built-in default it repeats (it disagrees with the built-in defaults for the critic and for the Loki address, where defect D-42 is dropped and D-41 keeps port 3100). The defaults of §K.3 to §K.6 for those keys MUST equal the values of `orchestrator.sh` at `9cab15d`. A test MUST compare each with the baseline text.
  - divergence: DV-027
  - test: PT-110-defaults-*
  - fixture: FX-01

- **F110-FR-007**: The keys of the options that the owner added MUST exist with these defaults and values under `parity`: `loop.parallel.units` off, off; `loop.parallel.workers` 2, not used; `loop.parallel.quota_headroom` 70, not used; `loop.parallel.allow_detect` off, off; `verification.parallelism` 1, 1; `attempt.tier_bump` off, off with `attempt.tier_bump_after` 2 and the ladder `harnesses.<id>.tiers`; `staleness.check_points` launch, resume and pass-start against critic-start; `telemetry.content` `auto` against `off`; `harnesses.<id>.transport` `subprocess`, `subprocess`. `loop.parallel.workers` above 4 and `verification.parallelism` above 4 MUST be configuration errors.
  - divergence: DV-079; DV-080; DV-082; DV-083
  - parity: as written, rows 7, 15, 16, 20 to 24 and 27 of annex X §X.7
  - test: CT-110-106
  - assumption: CQ-156 (the default of K, `attempt.tier_bump_after`: no source gives it; 2 lies below the reject limit of 3)

- **F110-FR-008**: The schema MUST hold the spelling of every key of annex X §X.7 as decided in §K.9, and every switch of the product MUST have a value under `parity`. The literals `off`, `not used` (the profile leaves the key at its default because the run never reaches it), `baseline`, `as-is` and `(fixture)` (the fixture sets it) MUST be the only non-value entries. A test MUST fail when a switch of the schema has no row in the profile, and when a row names a key that is not in the schema.
  - parity: the profile itself (annex X §X.7)
  - test: CT-110-107

- **F110-FR-009**: Every key that another feature proposes MUST be entered in the catalogue before that feature freezes: the spelling, the type, the class and the layers are decided here, and the default and the meaning by the proposing feature. A key that is not in the catalogue MUST NOT be read by any feature. The catalogue MUST list the features that own each key.
  - test: CT-110-108

- **F110-FR-010**: Every key MUST have one trust class. A key without a class MUST be treated as widening. A build test MUST fail when a key of the catalogue has no class, no snapshot class, no owner, or a type that cannot hold its default.
  - test: CT-110-109

- **F110-FR-011**: The control root MUST be settable by the user-scope key `state.dir`, by the environment and by a flag, as annex B requires (F100-FR-034). The key MUST be widening. A control root inside the working tree MUST be accepted only together with the deny rule that annex B names.
  - divergence: DV-023
  - test: CT-110-110

- **F110-FR-012**: `config schema` MUST print the schema of this catalogue, with the version of the schema, in a machine-readable form and in a form for people, within the token budget of annex G §G.5. Its exit code MUST be 0, and 3 for a usage error.
  - test: CT-110-111

- **F110-FR-013**: The profile MUST be selected by the key `profile`, at flag, environment or user rank. Selecting `parity` MUST supply the value of every switch of the profile as the default of that switch, at the rank of the default (rank 8), and MUST do nothing else. An explicit setting at ranks 1 to 7 MUST beat the profile, so that a fixture that names a role or the second suite that sets row 1 to `micro` work. The profile MUST NOT be selectable by a project file.
  - parity: the profile itself
  - test: CT-110-112
  - assumption: CQ-157 (at which rank the profile values stand: annex X §X.7 says only that the profile "sets" the switches and is selected by ordinary configuration)

#### G2 — Precedence, per-phase overrides, trust classes, aliases, provenance

- **F110-FR-014**: Each key MUST be resolved through the eight ranks of annex X §X.2, highest first: contract pin, flag, run snapshot (on `resume` only), environment, project file, user file, learned value, default. Between two flags for one key the last MUST win. The default MUST be the built-in value, the value detected from the machine, or the value of the profile.
  - divergence: DV-023; DV-024; DV-025; DV-026
  - test: CT-110-113

- **F110-FR-015**: A per-phase key of §K.4 MUST refine the role key of the same name. A per-phase key that no rank sets MUST take the value of the role key, whichever rank set that. The value that the verification-commands document declares for a phase MUST be the default of the per-phase timeout key. A learned value for a per-phase key or for `loop.yield.pollSec` MUST apply only when `learning.mode` resolves to `apply`, and only for the knobs that feature 106 allows. So the order of the pass ceiling MUST be, as at the baseline: an explicit per-phase setting, the learned value, the value declared by the document, the role key. For the poll interval it MUST be: an explicit setting, the learned value, the default. The source of a learned value MUST carry the id of its decision.
  - divergence: DV-025
  - test: PT-110-DV025-*
  - fixture: FX-29
  - assumption: CQ-158 (annex X §X.2 places the learned value at rank 7 and adds a note for the pass ceiling; the declared value of the document is not one of the eight ranks, and is read as the default of the per-phase key)

- **F110-FR-016**: A list MUST replace and MUST NOT concatenate, with one exception. Entries of `harnesses` MUST merge by id, and for one id the entry of highest precedence MUST win in this order: declared by the consumer, tested harness adapter, bundled descriptor, detected.
  - test: CT-110-114
  - ep: EP-02 `specstride.harness/1` (consumes)

- **F110-FR-017**: Project configuration MUST be able to narrow a run and never to widen it. A key of the class widening in the project file MUST be ignored. Each ignored key MUST give one launch message that names the file and the key, and one doctor warning. The message MUST be shown whatever the output mode, except under the `parity` profile, where no line without an as-is equivalent is printed (row 19 of annex X §X.7); the doctor warning stays. The run MUST go on. No project key, no comment and no file inside the repository MUST be able to declare a harness, its command line, an endpoint, a secret reference, a critic, a containment level, a permission flag, a budget increase, a host hook, a telemetry address or content capture.
  - divergence: DV-068
  - test: CT-110-115

- **F110-FR-018**: A key of the class narrowing in the project file MUST be accepted only if its value is stricter than the value that the ranks below the project file would give, by the direction of the catalogue. An equal value MUST be accepted. A looser value MUST be ignored with one launch message, and the value of the lower ranks MUST apply. A list whose direction is `sub` MUST be accepted only as a subset.
  - divergence: DV-068
  - test: CT-110-116

- **F110-FR-019**: The keys that widen MUST be accepted from user file, environment and flags only: `harnesses.<id>.pluginAllowlist`, the launcher path `harnesses.<id>.bin` and `engine.executable`, `harnesses.<id>.transport`, `loop.parallel.scopes.<taskId>`, `verification.scopes.<commandId>.reads`, `.writes` and `.sideEffects`, `state.dir`, endpoints and credentials. `loop.parallel.allow_detect`, the opt-in to containment C0 in `sandbox.level`, `distribution.audience`, `distribution.termsOverride` and `toolchains.<id>` MUST be accepted from the user file only, and a value of one of them from the environment, a flag or project configuration MUST be ignored with a launch message and a doctor warning (F100-FR-111, F100-FR-112, F100-FR-028). Project configuration MAY add task ids to `loop.parallel.exclude` and MAY narrow a declared write scope to a subset; it MUST NOT remove a task id from the exclusion of a lower rank and MUST NOT add or widen a scope. A scope in the project file that is wider than the declared one MUST be refused with a doctor finding.
  - divergence: DV-068
  - test: CT-110-117
  - assumption: CQ-183; CQ-205 ("user config" in rulings 34, P2 and 2 is read as the user file only)

- **F110-FR-020**: The as-is environment variables MUST stay as aliases of keys, through the table of annex X §X.8 and §K.8, and MUST be read at rank 4 only. A variable named in the table MUST reach the key or the keys named there. When two environment names reach one key and their values differ, the launch MUST be refused with both names in the message. The variables of the `WIGGUM_*` family MUST NOT be read, and no deprecation line MUST be printed for them. Every as-is variable that the baseline reads MUST be in the table or in "As-is behaviour not carried". For the prime launcher pair of §K.8 the port takes the narrowest reading: an empty first variable is read as unset, as the pass loop of the baseline reads it (`proposer.sh:609` at `9cab15d`), so the second variable is then read; the critic of the baseline reads only an absent variable as unset (`lib/critic.py:2196`), and the sources do not settle the difference.
  - divergence: DV-027; DV-036
  - assumption: CQ-196 (the reading of an empty first variable of the prime launcher pair)
  - test: PT-110-alias-*
  - fixture: FX-01; FX-13; FX-14

- **F110-FR-021**: `--set <path>=<value>` MUST reach every key of the catalogue, including keys of the class widening, from the command line only. It MUST be repeatable and the last one MUST win. It MUST be rank 2, as a flag. The short flags of the baseline MUST keep working for the keys that have them.
  - divergence: DV-027
  - test: CT-110-118

- **F110-FR-022**: The run snapshot MUST hold, for each key, its value, its source rank and its class, and secret references as references (annex B §B.12). On `resume` a key of the class `pinned` MUST rank below flags and above the environment, and a key of the class `tunable` MUST rank below the environment and above the project file, so that an exported value works on a resume. The classes MUST be those of the catalogue. A key that is not in the snapshot of an older run MUST take its value from the ranks below.
  - divergence: DV-024
  - test: PT-110-DV024-*
  - fixture: FX-13

- **F110-FR-023**: The contract pin MUST apply only to a key marked pinnable, and only in a child of the runtime root. The pinnable keys MUST be `learning.mode`, `learning.through` and `output.live`. The shell value of a pinned key MUST be removed from the environment of the child. Under the `parity` profile only `learning.mode` and `output.live` MUST be honoured as pins, as at the baseline. A manual run on the shell MUST NOT be a run of a launch contract.
  - divergence: DV-026
  - parity: two pins (row 38 of annex X §X.7)
  - test: PT-110-DV026-*
  - fixture: FX-35; FX-36

- **F110-FR-024**: Every effective value MUST have a source: the rank, and where the rank has more than one place, the file or the name of the variable, and for a learned value the id of the decision. A default supplied by the profile MUST show the name of the profile. The values that a higher rank shadowed MUST be recorded with their ranks. The run record MUST hold the same sources as `config show`.
  - test: CT-110-119

- **F110-FR-025**: `config show` MUST print every key that has a value from a rank other than the default, and with `--all` every key, each with its value, its source and its shadowed values, in the output modes of annex G §G.2. It MUST print a secret reference as written and never a value, and it MUST NOT resolve one. It MUST read the same layers that a launch reads, and MUST report the same errors. Its exit code MUST be 0, and 3 where the configuration is invalid or the usage is wrong.
  - test: CT-110-120

- **F110-FR-026**: An environment value that a higher rank shadows MUST be reported as shadowed, in `config show` and as a finding to the doctor; the same holds for the environment value of a pinned key on `resume`. The report MUST name the key and the ranks.
  - divergence: DV-024
  - test: CT-110-121

#### G3 — Secret references and resolvers

- **F110-FR-027**: A secret in configuration MUST be a reference of the form `env:`, `file:` or `keychain:`. A key of the type secret ref whose value is not a reference of a scheme that a resolver handles MUST be `inline-secret` and MUST refuse the launch. A value in any string key, in a file or in the environment, that the redactor of annex X §X.4 changes when it passes through `redact` MUST be an `inline-secret` error as well. The error MUST name the key and never print the value.
  - divergence: DV-023
  - test: CT-110-122
  - ep: EP-10 `specstride.secret-resolver/1` (implements)

- **F110-FR-028**: There MUST be a resolver per scheme with the four operations `handles`, `exists`, `resolve` and `boundHost`, and the three errors `missing`, `inline-secret` and `unsafe-file`. `exists` MUST return `yes`, `no` or `unprobed` and never the value. `resolve` MUST return the value in memory only. No resolver MUST make a network call. A resolver that fails MUST give `missing`.
  - test: CT-110-123
  - ep: EP-10 `specstride.secret-resolver/1` (implements)

- **F110-FR-029**: The scheme `env:` MUST resolve to the value of the named variable of the environment of the runtime. A name that is not a valid variable name MUST be `inline-secret`. An unset or empty variable MUST be `missing`.
  - test: CT-110-124
  - ep: EP-10 `specstride.secret-resolver/1` (implements)

- **F110-FR-030**: The scheme `file:` MUST take an absolute path, after a leading `~/` is expanded. Its real path, after symbolic links, MUST lie outside the workspace and outside the control plane, and the file MUST be readable by its owner only; otherwise the result MUST be `unsafe-file`. One final line end MUST be removed from the value. An absent or empty file MUST be `missing`.
  - test: CT-110-125
  - ep: EP-10 `specstride.secret-resolver/1` (implements)

- **F110-FR-031**: The scheme `keychain:` MUST name an entry by service and account. `exists` MUST use a query that prints nothing of the value. Where no such query is known on a platform, as on Linux until one is found, `exists` MUST return `unprobed` and MUST NOT fall back to a query that prints the value. The behaviour on macOS is `unverified`.
  - status: unverified (check: a probe on Linux and on macOS that creates a test entry, queries its existence with output discarded, and removes the entry; verified-on: —; pin: none)
  - test: CT-110-126
  - ep: EP-10 `specstride.secret-resolver/1` (implements)

- **F110-FR-032**: A secret MUST be resolved at the moment of use and not earlier. Every resolved value MUST be registered with the redactor for exact-match removal. A secret MUST be passed to a harness by environment or by standard input, and never in an argument list. A secret MUST NOT be written to the run snapshot, the launch record, the launch contract, an event, a log, the digest, the status output, the read model or the output of `config show`. Test: the canary test of annex X §X.10 finds no canary in any of them.
  - test: CT-110-127
  - ep: EP-10 `specstride.secret-resolver/1` (implements)
  - ep: redaction `specstride.redaction/1` (consumes)

- **F110-FR-033**: A secret MUST be sent only to the host it is bound to. The binding MUST be made where the reference is declared: for a harness of an endpoint kind, the host of the endpoint of the same entry; for a harness of kind `cli`, the process of that harness only. `boundHost` MUST return that host, or null for the second case. An endpoint that is not encrypted MUST be refused except on the loopback address. The endpoint MUST come from user file, environment or flag only.
  - test: CT-110-128
  - ep: EP-10 `specstride.secret-resolver/1` (implements)
  - assumption: CQ-159 (how a credential of a harness of kind `cli` is bound to a host: annex C §C.11 says "the host the secret may be sent to" and gives no rule for a harness that owns its transport)

- **F110-FR-034**: A secret reference of a role in use that resolves to `missing` MUST refuse the launch before the first pass and name the reference and the key. In a run it MUST lead to the state `blocked-on-human`. The doctor MUST be able to check a reference with `exists` alone.
  - test: CT-110-129
  - ep: EP-10 `specstride.secret-resolver/1` (implements)

- **F110-FR-035**: The registry of schemes MUST be open. A reference with a scheme that no resolver handles MUST be a configuration error. A sample resolver for the scheme `test:` MUST be registered from the test tree, and the conformance suite of EP-10 MUST pass on it and on the three resolvers of Wave 1, with the canary test, without a change to a core file.
  - test: CT-110-130
  - ep: EP-10 `specstride.secret-resolver/1` (implements)

### Key Entities

- **Key**: an entry of the catalogue with spelling, type, default, layers, class, snapshot class and owner.
- **Layer**: one of the eight ranks of annex X §X.2.
- **Provenance**: for a resolved value, its rank, place and shadowed values.
- **Secret reference**: a scheme and a target; never a value.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F110-SC-001**: Every effective value has a source. For 100 per cent of the keys of the catalogue, `config show --all` names the rank of the value, and the run record of a run holds the same source for each key.
- **F110-SC-002**: No secret at rest. Over the canary test of annex X §X.10 with canaries behind `env:`, `file:` and `keychain:` references, the number of canaries found in a state file, an event, a log, a launch contract, a snapshot or an argument list is 0.
- **F110-SC-004**: Strict schema. 100 per cent of the keys that are not in the catalogue and are not under `x-` refuse a launch, and 100 per cent of the refusals name a nearest key where one exists within edit distance 3.
- **F110-SC-005**: Alias coverage. 100 per cent of the as-is variables of the inventory (226 items of kind `env`) are in the alias table or in "As-is behaviour not carried", and the oracle reads back the value it set for 100 per cent of the aliases.
- **F110-SC-006**: Profile complete. The number of switches without a value under `parity` is 0, and selecting the profile changes no key that is not a switch.
- **F110-SC-007**: Project file is narrow. Over a test file that sets every key of the class widening, the number of such keys that take effect is 0, and each is reported once.

## Constraints

Set by the owner. They are not implementation detail to be removed.

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated. Every statement about macOS is `unverified` | Decision 12; ruling 67 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. The dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| The project file is the file of the logical name `project:config`; the user file is the file of `user:config`. The physical paths behind the two names belong to the plan | Decision 9 |
| Secrets only as `env:`, `file:` or keychain references, resolved at the moment of use, never in an argument list | Decision 6; EP-10 |

What belongs in the plan and not here: libraries and their versions, the package and file layout, the physical paths behind the logical names, the schema validator, the test runner, the platform keychain tools.

## Extension points

| EP | Id and version | Relation | What for |
|---|---|---|---|
| EP-10 | `specstride.secret-resolver/1` | implements | The content of the resolvers `env:`, `file:`, `keychain:`, the conformance suite and the sample for `test:` |
| EP-02 | `specstride.harness/1` | consumes | Role resolution reads the keys of §K.3; the registry supplies harness ids; the descriptor field `tiers` is the default of the ladder |

## Threats

Threats of annex X §X.9 that this feature is named against, each with the requirement that is its control here.

| Threat | What it is | Control in this feature |
|---|---|---|
| T-33 | A secret printed by a tool reaches records | F110-FR-032 (a secret is resolved at the moment of use, registered with the redactor for exact-match removal, and never written to a sink) with F110-FR-027 (an inline secret is an error); features 111 and 101 hold the other controls |
| T-34 | The proposer inherits the whole environment | The key `harnesses.<id>.envAllow` of the catalogue (F110-FR-009, spelled here; owner of the meaning 138), which feature 109 applies per harness; the behaviour is features 109 and 138 |

## Contracts of feature 100 used

| Interface contract | Version | Where |
|---|---|---|
| Config envelope, ranks, trust classes | `specstride.config/1` | Annex X §X.2, F100-FR-201 to F100-FR-203 |
| Secret resolver | `specstride.secret-resolver/1` | Annex C §C.11, F100-FR-107 |
| Redactor | `specstride.redaction/1` | Annex X §X.4, F100-FR-205 |
| Alias table of the normalization contract | `specstride.oracle-normalization/1` | Annex X §X.8 |
| The `parity` profile | `specstride.profile/1` | Annex X §X.7, F100-FR-210 to F100-FR-212 |
| Run snapshot | `specstride.snapshot/1` | Annex B §B.12, F100-FR-066 |
| Logical names `user:config`, `project:config` | `specstride.layout/1` | Annex B §B.5 |
| Closed sets, rows 44, 45, 75, 76 | — | Annex X §X.6 |
| Exit codes of `config show`, `config schema` | — | Annex G §G.4 |
| Role plan and critic order | `specstride.registry/1` | Annex C §C.6 |
| Fixture families FX-01, FX-13, FX-14, FX-29, FX-35, FX-36 | — | Feature 141, §O.2 |

## Rows of the `parity` profile

This feature owns row 36 (with 124); row 34 (the audience) belongs to feature 147. It confirms the spelling of all 43 rows (§K.9) and corrects row 42. Every key of the catalogue that needs a row of annex X §X.7 has one: the rows 44 to 131 of §X.7 name them, with the key and the owner, as the column `profile_row` of `contracts/config-keys.tsv` records.

| Switch | Key | Default | Under `parity` | Register row |
|---|---|---|---|---|
| Profile selection | `profile` | unset | `parity` (the way the profile is selected, not a switch) | — |

The values under `parity` are those of the rows of §X.7; where this feature stated a value that a later row fixed, the row stands. The keys of this feature whose row was written on its statement carry in §K.5, §K.6 and §K.6b the number of the row and the value under `parity`.

Keys of this feature that are not switches and have no row of their own, because their value under `parity` equals the baseline or the row that governs them covers them: every `credential` key (none), `harnesses.<id>.tiers` (the descriptor's ladder), `attempt.tier_bump_after` (it is row 128 of annex X §X.7; it is read only when row 24 is on), `status.staleEventSec`, `status.timelineRows`, `wait.pollSec`, `wait.timeoutSec`, `harnesses.claude.label`, `roles.critic.provider`.

## Closed sets

Stated as F100-FR-208 asks. Owner of each: 110. Closed sets 40 to 42 (auth tiers, audiences, statuses of a terms row) belong to feature 147.

| Row of annex X §X.6 | Closed set | Members | Closed by | Unknown value |
|---|---|---|---|---|
| 44 | Secret schemes | Open registry; Wave 1: `env:`, `file:`, `keychain:` | Open | Configuration error |
| 45 | Results of `exists` | `yes`, `no`, `unprobed` | Design | `unprobed` |
| 237 | Errors of a secret resolver | `missing`, `inline-secret`, `unsafe-file` | Design | `missing` |
| 238 | Check points of staleness (values of `staleness.check_points`) | `launch`, `resume`, `pass-start`, `critic-start` | Owner decision (ruling K3) | Configuration error |
| 75, 76 | Key classes | trust: `W`, `N`, `-`; snapshot: `p`, `t`. Feature 100 owns the rows; the members are in annex X §X.6 | Feature 100 (rows 75, 76) | A key without a class is widening |
| 239 | Reserved literals of a profile row | `off`, `not used`, `baseline`, `as-is`, `(fixture)` | Design | The profile is invalid |
| 240 | Values of `telemetry.content` | `auto`, `off` | Design | Configuration error |
| 241 | Values of `memory.native.proposer` | `off`, `on`, `as-is` | Design | Configuration error |
| 242 | Values of `roles.critic.transport` | `auto`, `as-is` | Design | Configuration error |

## As-is behaviour not carried

The traceability files assign to this feature 1 requirement and 25 behaviour items in 14 clusters. All are `superseded-by`. Each is approved by ruling K8. None has a requirement with an `origin:`; the register row is the proof.

| As-is id | Behaviour (short) | Register row |
|---|---|---|
| 002 FR-006 | Launch defaults: one model for proposer and critic, verification `off` | DV-043; DV-004 |
| B-0001 | The template sets the critic to a value that differs from the built-in default | DV-023 |
| B-0002 | The template's telemetry address differs from the built-in port | DV-023 |
| B-0003 | The template documents a precedence that omits the caller environment | DV-023 |
| B-0004 to B-0007 | Deprecation line for `WIGGUM_*`; mapping of legacy names in Python; `.wiggum` state directory notice | DV-036 |
| B-0156, B-1505 | The install-root `.env` is sourced (main script and `reverse`) | DV-023 |
| B-0233 | Precedence defaults, `.env`, caller environment, flags | DV-023 |
| B-0234, B-0346, B-0355, B-0807, B-1282, B-1379, B-1995, B-2110 | Mapping of legacy names in the shell library and at import of each module; the per-process deprecation line | DV-036 |
| B-0379 to B-0385 | Documentation of settings in the template (plugin allowlist, overlay scope, error and cap limits, repeat limit, yield counts, unlisted variables). The settings live on as keys of their owner features | DV-023 |

Behaviour that stays with the owner of the setting, and only its key is spelled here: the values and effects of the settings named in B-0379 to B-0385 (features 130, 109, 103, 118) and the aliases of §K.8.

## Clarifications

### Session 2026-09-29

Questions of `speckit-specify` and `speckit-clarify`, answered from the sources. No question was put to a person.

- Q: Which key spelling holds where annex X §X.7 and the features mix camelCase and underscores? → A: The 43 rows of annex X keep their spelling; every other key is lowerCamelCase, and the keys of other features that break the rule are corrected (§K.9). (Source: annex X §X.7; §K.2)
- Q: How does the `parity` profile relate to the eight ranks? → A: It supplies the default of each switch, at rank 8, so that a fixture can still name a role or the second suite can set row 1. Reported as CQ-157. (Source: F100-FR-210, F100-FR-211; annex X §X.7 rows 36 and 1)
- Q: Where does the value that the verification-commands document declares for a phase stand? → A: It is the default of the per-phase timeout key; the role key is the last resort. That reproduces the baseline order (override, learned, declared, global) inside the eight ranks. (Source: `resolve_proposer_timeout` at `orchestrator.sh` of `9cab15d`; R16 F5.6; DV-025)
- Q: Does a learned value beat an explicit setting? → A: For the pass ceiling only a per-phase explicit setting beats it; for the yield poll interval any explicit setting does. (Source: `resolve_proposer_timeout`, `resolve_yield_poll` at `9cab15d`)
- Q: Which pause ceiling? → A: 24 hours, 86400000 ms, by ruling 28; R16 had proposed 12 hours. (Source: APPROVAL.md ruling 28; annex X §X.7 row 39)
- Q: Which trust class does a budget or a ceiling have? → A: Narrowing with direction `lo`, so that a project file may lower and an increase is ignored. R16 gave `pause.maxTotalMs` the class widening; the narrowing class gives the same protection and lets a project lower it. (Source: R11 T-13; annex X §X.2)
- Q: Are the keys of the diagnostician and the accelerator narrowing? → A: Their `enabled` switches are; their harness and model keys are widening, since choosing a harness for a role is a selection of the kind that R11 T-13 lists. R16 gave all of them the class N. (Source: R11 T-13, R-4)
- Q: Is the phase slug accepted where a phase number stands? → A: No, the number only. R16 also accepted the slug; the baseline knows only numbers, and another spelling can be added later. (Source: R16 F6; baseline variable `SPECSTRIDE_PROPOSER_TIMEOUT_PHASE_<N>`)
- Q: Where does the ladder of the model-tier bump live? → A: `harnesses.<id>.tiers`, overriding the `tiers` of the descriptor, and it is shared with `loop.escalation`. K is `attempt.tier_bump_after`. (Source: annex C §C.2, annex E F100-FR-140, annex D §D.4)
- Q: How does the loader detect an inline secret in a key that is not a secret ref? → A: By passing each string value through `redact`; a change is an error. The pattern set belongs to feature 111. (Source: annex X §X.4; R11 T-35)
- Q: Does one variable reach one key? → A: Usually. `SPECSTRIDE_CONTEXT_BUDGET` reaches `spec.contextBudget` and `reverse.contextBudget`, because the baseline uses it for both. (Source: `.env.example` of `9cab15d`; specs of features 104 and 108)
- Q: Which sources could not answer? → A: Four, CQ-156 to CQ-159, under "Assumptions".

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary.
- The divergence register runs to DV-097. The brief's figure of 85 is out of date.
- Where the architecture file, the brief and a ruling differ, the ruling stands.
- The defaults of R16 F6 are read from the baseline at `9cab15d`; task T002 checks each of them against the text.
- Feature 100 lacks: row 44 onward in annex X §X.7 for the keys named under "Rows of the `parity` profile"; an alias row for `SPECSTRIDE_CONTEXT_BUDGET`, `SPECSTRIDE_DSH_PLUGIN_ALLOWLIST`, `SPECSTRIDE_DSH_PLUGIN_TIMEOUT` and the others of §K.8; a closed-set row for the check points of staleness; and a statement in annex X §X.2 on where the declared per-phase value of the verification-commands document stands.

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-156 | What is the default of K, the number of critic rejections after which the model-tier bump acts? | 2, below the reject limit of 3. It matters only when row 24 is on. No source gives a number (R25 F-8 names K without a value) | F110-FR-007 |
| CQ-157 | At which rank do the values of the `parity` profile stand? | At rank 8, as the default of each switch, so that explicit settings win | F110-FR-013 |
| CQ-158 | Where does the declared per-phase value of the verification-commands document stand among the eight ranks, and how does the learned value relate to an explicit general setting? | The declared value is the default of the per-phase key; the learned value follows the baseline order per knob | F110-FR-015 |
| CQ-159 | How is a credential of a harness of kind `cli` bound to a host? | To the process of that harness only; `boundHost` is null | F110-FR-033 |

## Requirements moved to 147-terms-gate

Group G4 left this feature in a split. The old ids are never reused; the sequence of this feature ends at F110-FR-035, so it has no gap, and the success criteria have the gaps 003, 008 and 009.

| Old id | New id (feature 147-terms-gate) |
|---|---|
| F110-FR-036 to F110-FR-049 | F147-FR-001 to F147-FR-014, in the same order |
| F110-SC-003, F110-SC-008, F110-SC-009 | F147-SC-001, F147-SC-002, F147-SC-003 |
| CT-110-131 to CT-110-144 | CT-147-101 to CT-147-114, in the same order |
| User story 4 | User story 1 |

## Repairs after the cross-feature review

Dated 2026-09-30. Requirements changed in place; no id was renumbered or reused. The table rows
of §K.3 to §K.9 and `contracts/config-keys.tsv` were rewritten with the same intent (owners,
values under `parity`, renamed keys), and §K.8 gained alias rows.

| Requirement or place | Item | What changed |
|---|---|---|
| F110-FR-006 | W-110-10 | The reference for the defaults is `orchestrator.sh` at `9cab15d`; `.env.example` counts only where it repeats a built-in default |
| F110-FR-017 | W-110-08 | Under `parity`, no launch line without an as-is equivalent is printed (row 19 of annex X §X.7); the doctor warning stays |
| F110-FR-020 | W-110-03 | One exception stated: `SPECSTRIDE_PRIME_FLEET_BIN` is read before `SPECSTRIDE_PRIME_BIN`; the first set wins, no conflict refusal |
| §K.8 | W-110-02, W-110-03, W-123-04 | New alias rows (the six variables of feature 118, `SPECSTRIDE_OTEL_TRACES`, the four `RALPH_*` pairs, the prime launcher pair, the stream pair); `NO_COLOR`, `FORCE_COLOR`, `TERM`, `COLORTERM` declared variables of the platform that reach no key |
| §K.2 rule 1 | W-110-11 | Unit suffix `Days` added (`assumption: CQ-160`) |
| Section "Rows of the parity profile" | W-X-04, W-X-11 | Rows 44 to 131 of annex X §X.7 cited; `supervise.wallClockSec`; `attempt.tier_bump_after` named as row 128 |
| Section "Closed sets" | W-X-12 | The row numbers of annex X §X.6 (44, 45, 237 to 242; key classes = rows 75 and 76) |
| New section "Threats" | W-X-22 | T-33 and T-34 with the control of this feature each |
| Constraints table | W-110-13 | `project:config` and `user:config` as logical names; the paths stay with the plan |

## Second pass after the cross-feature review (2026-09-30)

Requirements changed in place in this pass; no id was renumbered or reused.

| Requirement or place | Item | What changed |
|---|---|---|
| F110-FR-020 | B8 | The narrowest reading of the prime launcher pair stated in the requirement, in §K.8 and in `contracts/alias-table.tsv`: an empty `SPECSTRIDE_PRIME_FLEET_BIN` is read as unset (`assumption: CQ-196`) |
| §K.6 (`harnesses.<id>.proposerCustomisations` row) | B7 | The further users 130 and 138 recorded also in `contracts/config-keys.tsv` (the row of the spec already named them) |

Verified in this pass and unchanged (the first pass had already applied them; checked against annex
X §X.7 and the repair reports of 116, 128, 130, 131, 134, 138, 142, 115): B1 (`toolchains.<id>`,
line 132 of the key list and §K.5), B2 (`integrity.phase_entry` owner 116), B3 (rows 97, 98, 101,
104, 105 of annex X §X.7 against the key list and §K.6), B4 (`compat.legacyEvents` owner 144),
B5 (`telemetry.sinkTimeoutMs` narrowing on both sides, row 46), B6 (the seven as-is environment
names in §K.8 and the alias table, seconds converted to milliseconds), B9 (`loop.parallel.workers`
1 to `loop.parallel.workersMax`, a value above it a configuration error), B10 (`proposalMin`,
`unitMin`, `checkMin`). B11 is a defect of feature 100's `research.md` and is not edited here.

## Re-check B-8.7 (2026-09-30)

Made by the re-check of act B-8.7 (`docs/ecosystem/reviews/B-8.7-D.md`). One requirement changed in
place; one cell of the key list changed.

| Place | What changed | Why |
|---|---|---|
| F110-FR-019 | Its first sentence listed `loop.parallel.allow_detect` and the opt-in to C0 among the keys accepted from user file, environment and flags, while §K.5, §K.6 and F100-FR-111, F100-FR-112 (CQ-183) accept them from the user file only; the first repair reported W-110-05 as done without the change. It now names the five keys of the user file only, and what happens to a value from another layer; `assumption: CQ-183; CQ-205` | W-110-05, W-100-23 (the file did not hold what the report says); CQ-205 |
| §K.3 row `distribution.audience`; `contracts/config-keys.tsv` | Layers `F E U` become `U`: the audience is set in the user file only | F100-FR-028 as changed on the recommended answer of CQ-205 (ruling 2); F147-FR-002 already says "once, in the user file". No as-is variable reaches the key, so the alias table is unchanged |

Verified in this pass and unchanged: every dotted key that a specification cites in backticks is in
`contracts/config-keys.tsv` with that spelling, or is an old spelling recorded in the table of
corrections of §K.9, or is no key (a doctor check id, a lint code, a descriptor field, an event
type); every owner of a key with a profile row equals the owner of that row of annex X §X.7 after
the splits; every value under `parity` equals the column "Under `parity`" of annex X §X.7 (rows 1
to 133); every as-is variable that a specification names as an alias of a key is in
`contracts/alias-table.tsv`. Feature 100 now names `SPECSTRIDE_PRIME_FLEET_BIN` in its alias table
(annex X §X.8), as the second pass of this feature asked.
