# What feature 110 sends the orchestrator

**Task**: T043. **Date**: 2026-10-01. **Generated** by `packages/config/tools/orchestrator-report-gen.ts` (`--check` compares, no argument writes); every table of part A is derived from the files it names and nothing in it is written by hand.

This is the report the spec's "Assumptions" asks for: the keys and rows that other features and annex X §X.7 need. It is a report and never a repair — this feature edits no file of another feature (`specs/110-config-and-terms/spec.md`, "Feature 100 is never edited by this feature").

## Part A.1 — the four things the spec says feature 100 lacked

Each row is read from the shipped contract data or from the annex text today, by the `check` of `GAPS` in the generator, so this table can never go stale in silence.

| Id | What this feature asked for | State | Read from |
| --- | --- | --- | --- |
| G-1 | Row 44 onward in annex X §X.7 for the keys named under "Rows of the `parity` profile" | **supplied** | packages/contracts/data/parity-profile.json carries the rows 1 to 153 of §X.7 with no gap (153 rows), and the catalogue's `profile_row` column reaches row 153 |
| G-2 | An alias row for `SPECSTRIDE_CONTEXT_BUDGET`, `SPECSTRIDE_DSH_PLUGIN_ALLOWLIST`, `SPECSTRIDE_DSH_PLUGIN_TIMEOUT` and the others of §K.8 | **supplied** | all three names have a row in annex X §X.8 (specs/100-specstride/annexes/X-cross-layer.md), and `packages/contracts/data/normalization.json` ships them |
| G-3 | A closed-set row for the check points of staleness | **supplied** | annex X §X.6 row 238, "Check points of staleness", is shipped in packages/contracts/data/closed-sets.json |
| G-4 | A statement in annex X §X.2 on where the declared per-phase value of the verification-commands document stands | **supplied** | annex X §X.2 states it: "A per-phase time limit that the verification-commands document declares is the default of the per-phase key, at rank 8 (CQ-158)" |

4 of 4 are supplied. Nothing further is asked for the supplied ones; they are listed so that the owner can close the "Assumptions" bullet of `spec.md` with a reading of the files rather than a memory.

## Part A.2 — the rows annex X §X.7 still needs

A switch of the schema is a key whose cell "Under `parity`" is not `as default` (F110-FR-008). Every one of them needs a row of §X.7. These are the ones the catalogue carries with no row number:

| Key | Owner feature | Value under `parity` | What is asked |
| --- | --- | --- | --- |
| `toolchains.<id>` | 116 | `not used` | a row of annex X §X.7 with the key, the owner and the value under `parity` |
| `harnesses.prime.tools` | 138 | `not used` | a row of annex X §X.7 with the key, the owner and the value under `parity` |

## Part A.3 — the keys this catalogue spells for every other feature

The catalogue holds 282 keys and names 42 owner features. The spelling, the type, the class and the layers of every key are decided here (§K.9); the meaning of a key belongs to its owner. A feature that reads a key not in its row below is reading a key no catalogue carries (F110-FR-009).

| Owner feature | Keys | Spellings |
| --- | --- | --- |
| 100 | 1 | `profile` |
| 101 | 13 | `loop.gitCommits`, `loop.maxRejects`, `loop.oscMax`, `phases.<N>.proposer.effort`, `phases.<N>.proposer.harness`, `phases.<N>.proposer.model`, `roles.accelerator.enabled`, `roles.accelerator.harness`, `roles.accelerator.model`, `roles.critic.malformedLimit`, `roles.diagnostician.enabled`, `roles.diagnostician.harness`, `roles.diagnostician.model` |
| 102 | 1 | `staleness.check_points` |
| 103 | 22 | `carry.ageFallbackSec`, `carry.contextFillShare`, `carry.contextFillTokens`, `carry.continuation`, `carry.handoffMaxBytes`, `carry.index`, `carry.indexTitleChars`, `carry.ledger_handoff`, `carry.maxContinuedPasses`, `loop.maxIter`, `loop.noProgressStructured`, `loop.passPauseSec`, `loop.promptMaxBytes`, `loop.promptProtectedBlocks`, `phases.<N>.proposer.idleTimeoutSec`, `phases.<N>.proposer.timeoutSec`, `prompt.block_set`, `roles.proposer.maxCaps`, `roles.proposer.maxErrors`, `roles.proposer.maxNoProgress`, `roles.proposer.timeoutSec`, `staleness.check_points` |
| 104 | 4 | `loop.tickTasks`, `spec.contextBudget`, `spec.feature`, `spec.format` |
| 105 | 8 | `integrity.manifest_relaunch`, `staleness.check_points`, `verification.commands`, `verification.generateTests`, `verification.mode`, `verification.summary.tailErrLines`, `verification.summary.tailLines`, `verification.testPlan` |
| 106 | 2 | `learning.mode`, `learning.through` |
| 107 | 3 | `derive.judgment.harness`, `supervise.maxRelaunches`, `supervise.wallClockSec` |
| 108 | 1 | `reverse.tasks` |
| 109 | 11 | `harnesses.<id>`, `harnesses.<id>.bin`, `harnesses.<id>.overlay`, `harnesses.<id>.tiers`, `harnesses.<id>.transport`, `memory.native.proposer`, `roles.critic.effort`, `roles.critic.transport`, `roles.proposer.effort`, `roles.proposer.model`, `sandbox.level` |
| 110 | 6 | `harnesses.<id>.auth.credential`, `roles.critic.credential`, `roles.critic.harness`, `roles.proposer.credential`, `roles.proposer.harness`, `schema` |
| 111 | 11 | `observability.limits.diagnostic`, `observability.limits.freeText`, `observability.limits.maxTargets`, `observability.limits.target`, `observability.limits.text`, `observability.limits.toolArguments`, `observability.limits.toolResult`, `observability.retention.metadataDays`, `observability.retention.rawCapture`, `observability.retention.rawDays`, `telemetry.sinkTimeoutMs` |
| 112 | 4 | `doctor.online`, `doctor.probeOutputBytes`, `doctor.probeTimeoutSec`, `doctor.staleAfterDays` |
| 115 | 14 | `loop.escalation`, `loop.micro.caps.checkMin`, `loop.micro.caps.checkSharePercent`, `loop.micro.caps.cyclesExtra`, `loop.micro.caps.cyclesMin`, `loop.micro.caps.escalationsPerAttempt`, `loop.micro.caps.escalationsPerTask`, `loop.micro.caps.proposalMin`, `loop.micro.caps.repairs`, `loop.micro.caps.unitMin`, `loop.micro.caps.unresolvedUnits`, `loop.micro.closing_check`, `loop.routing`, `loop.strategy` |
| 116 | 2 | `integrity.phase_entry`, `toolchains.<id>` |
| 117 | 10 | `integrity.gate_fingerprint`, `phases.<N>.critic.timeoutSec`, `prompt.critic.block_set`, `prompt.critic.overWindow`, `roles.critic.anchorMaxBytes`, `roles.critic.contextTokens`, `roles.critic.debug`, `roles.critic.grounding`, `roles.critic.groundingMaxFiles`, `roles.critic.timeoutSec` |
| 118 | 25 | `carry.politeStopGraceSec`, `carry.polite_stop`, `loop.shortPass.nudgeAfter`, `loop.shortPass.sec`, `loop.watchdogTickSec`, `loop.yield.allowCommand`, `loop.yield.countsAsIter`, `loop.yield.failureLedger`, `loop.yield.failureLedgerMax`, `loop.yield.failurePattern`, `loop.yield.logHead`, `loop.yield.logTail`, `loop.yield.maxPerAttempt`, `loop.yield.pollSec`, `loop.yield.waitEvery`, `roles.proposer.idleTimeoutSec`, `roles.proposer.progressPaths`, `roles.proposer.progressTimeoutSec`, `roles.proposer.repeatIgnore`, `roles.proposer.repeatLimit`, `verification.failfast`, `verification.failfastGraceSec`, `verification.failfast_action`, `verification.longJob.cmd`, `verification.longJob.phase` |
| 119 | 2 | `output.compat`, `output.verbose` |
| 122 | 7 | `engine.executable`, `runtime.detach.strategy`, `runtime.handshake.timeoutSec`, `runtime.lease.graceSec`, `runtime.lease.heartbeatSec`, `runtime.lock.provider`, `state.dir` |
| 123 | 3 | `engine.executable`, `output.compat`, `relaunch.owner` |
| 124 | 10 | `critic.autoPick`, `critic.autoPickMaxUsd`, `critic.warnSameModel`, `phases.<N>.critic.harness`, `phases.<N>.critic.model`, `roles.critic.harness`, `roles.critic.model`, `roles.critic.transport`, `roles.proposer.harness`, `roles.refuseUnknown` |
| 125 | 8 | `carry.continuation`, `harnesses.<id>.transport`, `harnesses.claude.disableSubagents`, `harnesses.claude.gitInstructions`, `harnesses.claude.label`, `harnesses.claude.proposerSkills`, `harnesses.claude.subprocessEnvScrub`, `sandbox.permissionMode` |
| 126 | 11 | `invocation.debug`, `invocation.idBase`, `invocation.recordAllPasses`, `observability.retention.metadataDays`, `observability.retention.rawCapture`, `observability.retention.rawDays`, `stream.limits.lineBytes`, `stream.limits.linesPerSecond`, `stream.noActivityFlag`, `stream.tap`, `stream.tapExecutable` |
| 127 | 21 | `budget.alerts.thresholds`, `budget.rates`, `budget.role.<role>.calls`, `budget.role.<role>.costUsd`, `budget.role.<role>.softTokens`, `budget.role.<role>.tokens`, `budget.run.calls`, `budget.run.costUsd`, `budget.run.phaseAttempts`, `budget.run.tokens`, `loop.maxWallMin`, `pause.jitterMs`, `pause.marginMs`, `pause.maxTotalMs`, `pause.probeScheduleMs`, `phases.<N>.budget.*`, `quota.overloadRetries`, `quota.transientMaxWaitMs`, `roles.<role>.fallback`, `roles.<role>.fallbackAfterMs`, `roles.<role>.fallbackReturn` |
| 128 | 18 | `telemetry.content`, `telemetry.contentMaxPromptBytes`, `telemetry.contentMaxReplyBytes`, `telemetry.enabled`, `telemetry.flush.intervalMs`, `telemetry.loki.auth`, `telemetry.loki.maxBatchBytes`, `telemetry.loki.timeoutMs`, `telemetry.loki.url`, `telemetry.otel.auth`, `telemetry.otel.dialects`, `telemetry.otel.enabled`, `telemetry.otel.legacyMetricNames`, `telemetry.otel.maxBatchBytes`, `telemetry.otel.timeoutMs`, `telemetry.otel.traces`, `telemetry.otel.url`, `telemetry.queueMaxEvents` |
| 129 | 5 | `status.precompute`, `status.staleEventSec`, `status.timelineRows`, `wait.pollSec`, `wait.timeoutSec` |
| 130 | 10 | `harnesses.<id>.contextWindows`, `harnesses.<id>.pluginAllowlist`, `harnesses.<id>.pluginTimeoutSec`, `harnesses.<id>.profile`, `harnesses.dsh.critic.proof`, `harnesses.dsh.home`, `harnesses.dsh.modelProviders`, `harnesses.dsh.provider`, `roles.critic.provider`, `sandbox.permissionMode` |
| 131 | 5 | `harnesses.<id>.authTier`, `harnesses.<id>.endpoint.base`, `harnesses.<id>.proposerCustomisations`, `roles.critic.transport`, `sandbox.permissionMode` |
| 134 | 2 | `harnesses.<id>.proposerCustomisations`, `sandbox.permissionMode` |
| 138 | 5 | `harnesses.<id>.envAllow`, `harnesses.prime.launcher`, `harnesses.prime.tools`, `roles.critic.transport`, `sandbox.permissionMode` |
| 140 | 3 | `reverse.contextBudget`, `reverse.maxFileBytes`, `reverse.maxTotalBytes` |
| 142 | 8 | `loop.parallel.allow_detect`, `loop.parallel.exclude`, `loop.parallel.quota_headroom`, `loop.parallel.resources.<name>.capacity`, `loop.parallel.scopes.<taskId>`, `loop.parallel.units`, `loop.parallel.workers`, `loop.parallel.workersMax` |
| 143 | 1 | `loop.parallel.seedPaths` |
| 144 | 1 | `compat.legacyEvents` |
| 145 | 8 | `output.ascii`, `output.banner`, `output.bannerBg`, `output.color`, `output.live`, `output.liveDetail`, `output.liveRail`, `output.motion` |
| 146 | 3 | `critic.catalogueWindowMargin`, `discovery.enabled`, `discovery.online` |
| 147 | 4 | `distribution.audience`, `distribution.termsOverride`, `roles.critic.tier`, `roles.proposer.tier` |
| 148 | 4 | `integrity.gate_fingerprint`, `verification.envAllowlist`, `verification.parallelism`, `verification.step_runner` |
| 149 | 2 | `attempt.tier_bump`, `attempt.tier_bump_after` |
| 152 | 1 | `commit.backpressure` |
| 153 | 11 | `commit.gate.beforeCritic`, `commit.scan.inPass`, `critic.evidence.perTask`, `events.commitGateTiming`, `loop.micro.closingCheck.skipWhenEqualToGate`, `loop.taskGroups`, `verification.gate.reuse`, `verification.inner.scoped`, `verification.redGate.limit`, `verification.redGate.ownBudget`, `verification.timeLimit.enforce` |
| 154 | 11 | `host.limits`, `loop.parallel.groupCheck`, `loop.parallel.groupUnits`, `loop.parallel.mergeBaseline`, `loop.parallel.noRepeat`, `loop.phases.parallel`, `loop.speculate`, `loop.speculate.depth`, `loop.speculate.minRate`, `loop.speculate.window`, `pipeline.stageGroups` |

Four keys of §K.6 are **not** in the catalogue and belong to feature 107's own contract: `derive.stageTimeoutSec`, `verification.scopes.<commandId>.reads`, `verification.scopes.<commandId>.writes`, `verification.scopes.<commandId>.sideEffects`. T004's acceptance fixes the count at 282; the difference is the register rows W-ORC-01 to W-ORC-03 (R-110-02 below).

## Part A.4 — the spellings other features must correct in their own specifications

36 keys were corrected under the rule of §K.2. The standing spelling is the one this catalogue carries; the old spelling lives in the `confirmed_or_corrected` column of the standing key and never as a row of its own. Each owner feature below carries the old spelling somewhere in its own specification and must move to the new one.

| Standing key | Old spelling | Owner feature | Proposed by |
| --- | --- | --- | --- |
| `state.dir` | `state.controlRoot` | 122 | 122 |
| `roles.proposer.effort` | `harnesses.dsh.reasoningEffort` | 109 | 130 |
| `roles.critic.effort` | `roles.critic.reasoningEffort` | 109 | 130 |
| `loop.micro.caps.escalationsPerTask` | `loop.micro.caps.escalations_per_task` | 115 | 115 |
| `loop.micro.caps.escalationsPerAttempt` | `loop.micro.caps.escalations_per_attempt` | 115 | 115 |
| `loop.micro.caps.proposalMin` | `loop.micro.caps.proposalMinutes`, `loop.micro.caps.proposal_minutes` | 115 | 115 |
| `loop.micro.caps.unitMin` | `loop.micro.caps.unitMinutes`, `loop.micro.caps.unit_minutes` | 115 | 115 |
| `loop.micro.caps.checkMin` | `loop.micro.caps.checkMinutes`, `loop.micro.caps.check_minutes` | 115 | 115 |
| `loop.micro.caps.checkSharePercent` | `loop.micro.caps.check_share_percent` | 115 | 115 |
| `loop.micro.caps.cyclesExtra` | `loop.micro.caps.cycles_extra` | 115 | 115 |
| `loop.micro.caps.cyclesMin` | `loop.micro.caps.cycles_min` | 115 | 115 |
| `loop.micro.caps.unresolvedUnits` | `loop.micro.caps.unresolved_units` | 115 | 115 |
| `loop.yield.pollSec` | `loop.yield.poll` | 118 | 118 |
| `loop.parallel.exclude` | `loop.parallel.tasks.<taskId>.eligible` | 142 | 142 |
| `loop.parallel.scopes.<taskId>` | `loop.parallel.tasks.<taskId>.writes` | 142 | 142 |
| `loop.parallel.seedPaths` | `loop.parallel.seed_paths` | 143 | 142 |
| `verification.failfastGraceSec` | `verification.failfast_grace_sec` | 118 | 118 |
| `carry.politeStopGraceSec` | `carry.polite_stop_grace_sec` | 118 | 118 |
| `harnesses.<id>.auth.credential` | `harnesses.<id>.credential`, `harnesses.codex.auth.credential` | 110 | 131 |
| `budget.alerts.thresholds` | `budget.alertThresholds` | 127 | 127 |
| `telemetry.loki.url` | `telemetry.lokiUrl` | 128 | 128 |
| `telemetry.otel.legacyMetricNames` | `otel.legacyMetricNames` | 128 | 128 |
| `supervise.wallClockSec` | `supervise.wallClockSeconds` | 107 | 107 |
| `verification.envAllowlist` | `verification.env_allowlist` | 148 | 148 |
| `harnesses.<id>.endpoint.base` | `harnesses.codex.endpoint.base` | 131 | 131 |
| `harnesses.<id>.authTier` | `harnesses.codex.authTier` | 131 | 131 |
| `harnesses.<id>.contextWindows` | `harnesses.pi.contextWindow`, `harnesses.dsh.contextWindows` | 130 | 130 |
| `stream.tap` | `stream.capture` | 126 | 126 |
| `roles.<role>.fallbackAfterMs` | `fallback.after` | 127 | 127 |
| `status.staleEventSec` | `status.stale_event_sec` | 129 | 129 |
| `status.timelineRows` | `status.timeline_rows` | 129 | 129 |
| `wait.pollSec` | `wait.poll_sec` | 129 | 129 |
| `wait.timeoutSec` | `wait.timeout_sec` | 129 | 129 |
| `telemetry.contentMaxPromptBytes` | `telemetry.content.maxPromptBytes` | 128 | 128 |
| `telemetry.contentMaxReplyBytes` | `telemetry.content.maxReplyBytes` | 128 | 128 |
| `telemetry.otel.dialects` | `otel.dialects` | 128 | 128 |

## Part B — the requests of phases 1 to 5

Each is an entry of "Reported to the orchestrator — not repaired here" of `.specstride/features/110-config-and-terms/PROGRESS.md`, with the file that shows the need. None of them is repaired by this feature.

| Id | What the orchestrator or the owner must do | Where it shows | Raised in |
| --- | --- | --- | --- |
| R-110-01 | Widen CT-100-322's inventory of filled packages of the graph to carry `@specstride/config`, so that `packages/config/package.json` can drop `specstride.skeleton: true`. The marker is inaccurate today — `src/schema/`, `src/load/`, `src/secrets/` and `src/cli/` are full — and it stays only because that test reads the field to decide the inventory. This feature does not edit feature 100's test. | packages/testkit/test/acceptance-core.test.ts (`packagesUnderTest`); packages/config/package.json (`specstride.skeletonNote`) | phases 1 to 5 |
| R-110-02 | Rule on the count difference: the tables of §K.3 to §K.6b hold 263 keys and the catalogue carries 260, because T004's acceptance fixes the count at 260 and the four keys of feature 107 that §K.6 also lists belong to feature 107's own contract. They are named in `EXCLUDED_KEYS` of the generator with that reason, and the exclusion is checked in both directions. The register rows W-ORC-01 to W-ORC-03 carry the difference. | packages/config/tools/config-keys-gen.ts (`EXCLUDED_KEYS`, `CATALOGUE_KEY_COUNT`); specs/110-config-and-terms/contracts/README.md | phase 1 |
| R-110-03 | Give annex B §B.20 a row for the `--json` output of `config show` and of `config schema`. Both records carry a schema id of the internal form today (`urn:specstride:schema:internal:110:config-show/1`, `…:config-schema/1`), which §B.20's note says is no contract of the `contracts` package. | packages/config/src/cli/show.ts; packages/config/src/cli/schema.ts | phase 3 |
| R-110-04 | Derive the per-command share of the §G.5 token budget, or confirm the share this feature chose: one quarter of the 8,000-token budget of the host skill `specstride-run` (2,000 tokens, 5,600 bytes) for one host-facing configuration command. F100-FR-187 puts the derivation on the owner and §G.5 gives no per-command figure. One constant moves if the owner wants another share. | packages/config/src/cli/budget.ts | phase 3 |
| R-110-05 | Decide whether a configuration FILE may spell the two literals of a key whose type is `on, off`. YAML 1.2's core schema reads only `true`/`false` as booleans, so `loop.escalation: off` in a file is refused as a type error, while `--set loop.escalation=off` and the environment both work (those paths coerce text). | packages/config/src/load/files.ts (`YAML_PARSE_OPTIONS`); packages/config/src/schema/validate.ts | phase 3 |
| R-110-06 | State the proposer's alias order in annex X §X.8 or §K.8 as the critic's is stated. The row of `SPECSTRIDE_DSH_MODEL` orders it for the critic only, so `roles.proposer.model` resolves as a conflict when `SPECSTRIDE_DSH_PROPOSER_MODEL` and `SPECSTRIDE_DSH_MODEL` disagree, and the launch is refused with both names. Nothing was invented for the proposer. | specs/110-config-and-terms/contracts/alias-table.tsv; packages/config/src/load/alias.ts | phase 4 |
| R-110-07 | Decide what a shell export of `SPECSTRIDE_LEARNING_THROUGH` does. The name reaches `learning.through` as F110-FR-020 requires, and the layer check then refuses the value with `layer-not-allowed`, because the key is `C only`. The alternative is to ignore it with one launch message, as F110-FR-019 does for the five user-file-only keys. | specs/110-config-and-terms/contracts/alias-table.tsv; packages/config/tests/parity/alias.test.ts | phase 4 |
| R-110-08 | Say which key each of `SPECSTRIDE_DIAGNOSTICIAN`, `SPECSTRIDE_ACCELERATOR` and `SPECSTRIDE_ACCELERATOR_BACKEND` sets (feature 101 owns the keys). The variable tail is not the key tail and the catalogue holds `.enabled`, `.harness` and `.model` for each role, so the port resolves them to no key and names them unresolved rather than picking a field. The catch-all row `loop.yield.<key>` of §K.8 has the same shape. | packages/config/src/load/alias.ts (`unresolvedFamilyNames`) | phase 4 |
| R-110-09 | Correct one of the two citations of the canary test: annex C §C.11 and F110-FR-032 cite "the canary test of annex X §X.10", while the canary harness of feature 100 is §X.9 (F100-FR-219) and §X.10 is the integration-acceptance section. | packages/config/tests/conformance/canary.test.ts (CT-110-127) | phase 5 |
| R-110-10 | Decide where the pair a bound host needs is built. `boundHostOfDeclaration` needs the harness kind and the endpoint of the same entry; `harnesses.<id>.auth.credential` is a key of this catalogue, while the `kind` and `endpoint` of that entry belong to the harness descriptor (features 109 and 131). The port therefore takes the declarations as an input and the composition root of feature 122 must build them. | packages/config/src/secrets/binding.ts (`createSecretBindings`) | phase 5 |
| R-110-11 | Rule on `observability.captureContent`, which appears as a switch label of the sink context of feature 100's EP-08 conformance sample and is in no table of §K.3 to §K.6b and in no row of annex X §X.7. If it is a configuration key that a package reads, its owning feature must propose it (F110-FR-009); this feature neither carries nor edits it. | packages/testkit/src/canary/scan.ts; packages/config/tests/unit/catalogue.test.ts (`NOT_A_CONFIGURATION_KEY`) | phase 2 |
| R-110-12 | Note that `plan.md` names the licence of the YAML parser as MIT and the package is ISC — permissive and compatible with MIT, which is what F100-FR-029 asks for. Recorded in `research.md` §T044 and in `DEPENDENCIES.md`; no specification was edited for it. | specs/110-config-and-terms/research.md (§T044); packages/config/DEPENDENCIES.md | phase 6 (T044) |
| R-110-13 | Three lines of `docs/ecosystem/feature-briefs.md` still give the terms gate, the audience and its config keys to this feature, which the split of 2026-09-29 moved to 147-terms-gate. `check-traceability.py` does not read that file, so it passes; the lines are reported and not edited, because the file belongs to the orchestrator. | docs/ecosystem/feature-briefs.md lines 80, 3423, 3976 | phase 6 (T042) |
