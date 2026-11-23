# Data model: Event schema (feature 111)

## Entities

| Entity | Fields | Relations |
|---|---|---|
| Event | The envelope of annex X §X.1 and `data` | One type; one writer; delivered to sinks |
| Event type | name, kind, partner, `data` schema, free-text fields | Partner: the closer or the opener |
| Pattern set | `schema`, `version`, `keyNames`, `values` | Version in the run record |
| Ingress class | name, byte limit | Nine classes, closed |
| Sink | id, accepted majors, time limit, queue | Registered in the EP-08 registry |

## Ingress classes and limits (bytes)

| Class | Default limit | Source |
|---|---|---|
| `stream-text` | 4096 | B-2213 |
| `tool-arguments` | 2048 | B-2213 |
| `tool-result` | 4096 | B-2213 |
| `diagnostic` | 1024 | B-2213 |
| `target` | 512 (at most 8 targets) | B-2213 |
| `check-output`, `critic-reply`, `comment`, `free-text` | 1024 (`observability.limits.freeText`, row 44 of annex X §X.7) | none in the baseline |

## State of an event

Created by an emitter, then validated, then redacted at the ingress, then appended with `seq`, then delivered to each sink. A failure at any step after validation leaves the primary event as it is.

## Free-text fields

A free-text field is a `data` field whose value is text and is none of: a member of a closed set, an id, a logical name, a hash, a time. The column "Free-text fields" of the catalogue marks every such field with the ingress class whose cap applies. The mark is the only list: F111-FR-016 refers to it, and a field that is added later and holds free text gets the mark with it. A marked field has passed the redaction ingress and is cut to the cap of its class before the event is written. A value of a marked field that is a list is treated member by member.

The column `free_text_fields` of `contracts/event-catalogue.tsv` holds the same marks in the form `field:class`.

## End causes and outcomes (closed sets)

The `data` field is `endCause`. The envelope field `cause` (annex X §X.1) is something else: the `seq` or the id of the event that led to this one. No `data` of a catalogue type has a field named `cause`.

### `pass.ended`, field `endCause`

| Member | Meaning | Fields that go with it |
|---|---|---|
| `evidence` | The pass ended and the phase evidence exists | `evidence` |
| `completed` | The pass ended without an error and without phase evidence | `pluginRestart` true when the pass ended for a restart after a plugin install |
| `yield` | The pass ended by a yield that was taken | `yielded` true, `waitedSec` |
| `no_progress` | The pass ended successfully and changed nothing | `consec` |
| `error` | The harness ended with an error | `subtype`, `consec`, `reason` |
| `killed` | A watchdog, or a time limit of a loop layer, ended the pass; the kill class is `hang` or `futility` | `reason` (a kill reason of annex X §X.6 row 10), `killClass`, `consec` |
| `hard_cap` | The pass was ended at its ceiling; the kill class is `budget` | `reason`, `elapsed`, `consec`, `max` |
| `quota_pause` | The pass ended because the run entered a quota pause | none |
| `stopped` | A stop request, or the loss of the owner of the lease, ended the pass | none |
| `crash` | The process died; only on a closer marked `synthesized` | `synthesized` |

Unknown value: read as `error`.

### `attempt.ended`, field `endCause`

| Member | Meaning |
|---|---|
| `approved` | The verdict APPROVED was recorded |
| `rejected` | The verdict REJECTED was recorded |
| `malformed` | The verdict MALFORMED was recorded |
| `verification-failed` | The verification gate failed |
| `no-evidence` | The pass loop ended without phase evidence, by a limit or a breaker |
| `budget` | The wall-clock budget or a budget ceiling ended the run inside the phase attempt |
| `blocked` | The run rests blocked on a human (a reason of annex E §E.2) |
| `stopped` | A stop request, or the loss of the owner of the lease |
| `error` | A configuration error or an internal error, before a verdict |
| `crash` | The process died; only on a closer marked `synthesized` |

Unknown value: read as `error`. A quota pause does not end a phase attempt, so the set holds no member for it.

### `phase.ended`, field `outcome`

| Member | Meaning |
|---|---|
| `approved` | The phase was approved |
| `halted` | The run ended in the phase by a stop reason of annex E §E.3 other than `stop_flag` |
| `blocked` | The run rests blocked on a human in the phase |
| `stopped` | A stop request, or the loss of the owner of the lease |
| `crash` | The process died; only on a closer marked `synthesized` |

Unknown value: read as `halted`.

### `run.ended`, field `endCause`

| `synthesized` | Set | Members |
|---|---|---|
| absent or false | Annex X §X.6 row 5, the `cause` of the terminal record (annex B §B.15), copied | `normal`, `crash`, `owner-lost` |
| true | Annex X §X.6 row 96 | `crash`, `host_exit`, `operator_stop` |

### `microloop.unit`, fields `layerOff` and `fallbackReason`

`layerOff` is the cause that the ledger record `disengaged` of feature 115 carries; `fallbackReason` is the fallback reason of annex X §X.6 row 59 where one applies. Both are null while the layer stays on. The set of causes has no row of annex X §X.6 yet (N-111-1).

| `layerOff` | Meaning | `fallbackReason` |
|---|---|---|
| `caps` | A cap of cycles is spent, or the cap of unresolved units is reached (rule `loop.caps`) | null |
| `integrity` | An integrity event other than a taint, `ledger-invalid` among them (rule `loop.integrity`; F115-FR-032) | null |
| `check-error` | A check cannot start (rule `loop.check-error`) | null |
| `no-check` | Two consecutive units are `unchecked` and the inner set is empty (rule `loop.no-check`) | `no-check` |
| `single-unit` | The phase holds one task, or the first unit names every task (rule `loop.single-unit`) | `single-unit` |
| `layer-error` | The code of the layer failed, or it returned a value the engine does not know (annex D §D.1) | null |
| `breach` | A breach of the integrity of the phase gate; the layer is off for the run (`layerOffForRun`, F115-FR-040) | null |

Unknown value of `layerOff`: shown as text, as row 59 does for a fallback reason.

## Event catalogue

123 types. Fourteen types were added on 2026-09-30: the thirteen from `strategy.selected` on (F111-FR-050, F111-FR-051) and `critic.citation_unresolved` (F117-FR-015, proposal P1 of feature 117's analyze run); the two proposed types `critic.passed_over` and `critic.diversity` were retired before the catalogue took them (second pass, item C8), and their facts ride `critic.selected` and `critic.call`.

Every type of the kind `close` carries the `data` field `synthesized`. F111-FR-004 has the next writer write the closers a dead process never wrote, *marked `synthesized: true` with the cause of the death*; a closer whose row had no such field could not be written at all, because the writer refuses a `data` field the catalogue does not know (F111-FR-020). The field was added to the sixteen closers that did not have it on 2026-10-01 (phase 3, T020); `run.ended` and the opener `blocked`, which carries it for a refused `resume`, had it already. The change is additive, as a change inside a major must be (F111-FR-001).

| Type | Kind | Partner | `data` fields | Free-text fields (ingress class) |
|---|---|---|---|---|
| `run.launched` | instant |  | reason, countsCarried, countsReset, startMode, requestKind, productVersion |  |
| `run.started` | open | `run.ended` | workdir, phases, featureSlug, proposer, critic, resumeAt, states, verificationMode, verificationPlanRef | `workdir` (target) |
| `run.ended` | close | `run.started` | outcome, stopReason, exitCode, endCause, causedBy, synthesized, phase, phases, rc, evidenceRef, attempts, streak |  |
| `run.paused` | open | `run.resumed` | class, role, harness, resetsAt, resumeAt |  |
| `run.resumed` | close | `run.paused` | pausedMs, probeIndex, how, synthesized |  |
| `quota.signal` | instant |  | class, confidence, rateLimitType, utilization, resetsAt, resetsAtSource, status, evidence | `evidence` (diagnostic) |
| `harness.error` | instant |  | class, retryable, status, message | `message` (diagnostic) |
| `fallback.switched` | instant |  | from, to, reason, billingChange | `reason` (free-text) |
| `fallback.restored` | instant |  | from, to, reason | `reason` (free-text) |
| `alert` | instant |  | kind, level, role, threshold, value, limit |  |
| `budget.exceeded` | instant |  | dimension, limit, used, role, resumable |  |
| `host.quota_observed` | instant |  | kind, data | `data` (free-text) |
| `blocked` | open | `unblocked` | reason, needs, changedSource, changedRef, since, question, options, synthesized | `needs` (free-text), `question` (free-text), `options` (free-text) |
| `unblocked` | close | `blocked` | by, answerRef, latencyMs, synthesized | `by` (free-text) |
| `counters.reset` | instant |  | which, by | `by` (free-text) |
| `pipeline.started` | open | `pipeline.ended` | pipelineId, mode, stages, launcherRef, commentHash, comment, changed, delegated | `comment` (comment) |
| `pipeline.ended` | close | `pipeline.started` | state, exitReason, exitCode, lastStage, childExit, evidencePath, synthesized | `evidencePath` (target) |
| `stage.started` | open | `stage.ended` | stageId, kind |  |
| `stage.ended` | close | `stage.started` | outcome, reason, exitCode, synthesized |  |
| `launch.checked` | instant |  | check, status, decision, reason, detail | `reason` (free-text), `detail` (diagnostic) |
| `supervisor.observed` | instant |  | exitCode, childExit, stopReason, budgetLeft |  |
| `supervisor.relaunch` | instant |  | attempt, reason, exit, childExit, stage, stopReason, budgetRemaining, detail | `detail` (diagnostic) |
| `supervisor.stopped` | instant |  | sent, detail | `detail` (diagnostic) |
| `digest.written` | instant |  | state, exit, lastStage, childExit, evidencePath | `evidencePath` (target) |
| `phase.started` | open | `phase.ended` | phase, title, total, shape | `title` (free-text) |
| `phase.ended` | close | `phase.started` | phase, attempt, title, outcome, synthesized | `title` (free-text) |
| `attempt.started` | open | `attempt.ended` | phase, attempt, kind, backend, criteria, strategy | `criteria` (free-text) |
| `attempt.ended` | close | `attempt.started` | phase, attempt, endCause, workProducts, synthesized |  |
| `attempt.archived` | instant |  | phase, attempt, dirRef |  |
| `attempt.acceleration_note` | instant |  | phase, attempt, noteRef |  |
| `attempt.tier_bumped` | instant |  | fromTier, toTier, k, rejections |  |
| `attempt.tier_bump_skipped` | instant |  | reason | `reason` (free-text) |
| `escalation.skipped` | instant |  | reason |  |
| `recovery.triggered` | instant |  | phase, attempt |  |
| `recovery.diagnosis_started` | open | `recovery.diagnosis_done` | phase, attempt, provider |  |
| `recovery.diagnosis_done` | close | `recovery.diagnosis_started` | phase, attempt, bytes, case, synthesized |  |
| `recovery.diagnosis_failed` | close | `recovery.diagnosis_started` | phase, attempt, error, synthesized | `error` (diagnostic) |
| `gate.oscillation` | instant |  | phase, attempt, criterion, reappears | `criterion` (free-text) |
| `pass.started` | open | `pass.ended` | iter, maxIter, sessionId, continued |  |
| `pass.ended` | close | `pass.started` | iter, endCause, timeBreakdown, firstEditAt, usageComplete, transcriptRef, evidence, yielded, waitedSec, pluginRestart, subtype, consec, reason, killClass, elapsed, max, synthesized | `subtype` (free-text), `reason` (free-text) |
| `pass.limits_set` | instant |  | phase, attempt, role, seconds, source, arm, yieldPoll, yieldPollSource, yieldPollArm, tamperBracket |  |
| `pass.killed` | instant |  | iter, reason, class, elapsed, detail, checkpointRef | `detail` (diagnostic) |
| `pass.short` | instant |  | iter, elapsed, consec |  |
| `pass.halted` | instant |  | iter, reason, yields, max, killReason, consec, subtype, killClass, jobPid, jobLogRef | `reason` (free-text), `subtype` (free-text) |
| `prompt.built` | instant |  | promptRef, blocks, totalTokensEst |  |
| `prompt.block_dropped` | instant |  | block, assembledBytes, blockBytes, budgetBytes |  |
| `prompt.block_protected` | instant |  | block, assembledBytes, blockBytes, budgetBytes |  |
| `evidence.present` | instant |  | file, iters | `file` (target) |
| `evidence.written` | instant |  | file, iters | `file` (target) |
| `progress.swept` | instant |  | from, to | `from` (target), `to` (target) |
| `commit.made` | instant |  | phase |  |
| `plugin.installed` | instant |  | iter, profile, plugins | `profile` (free-text), `plugins` (free-text) |
| `plugin.install_failed` | instant |  | iter, reason | `reason` (free-text) |
| `plugin.install_denied` | instant |  | iter, reason |  |
| `tool.call` | instant |  | tool, toolId, status, category, target, targets, argsRef, resultRef, durationMs, ok, redacted, truncated, originalBytes, retainedBytes | `tool` (free-text), `target` (target), `targets` (target) |
| `stream.init` | instant |  | model, tools, schemaVersion, sessionId, cwd, provider, update | `tools` (free-text), `cwd` (target) |
| `stream.text` | instant |  | textRef, messageKey, messageId, contentIndex, finalFragment, redacted, truncated, originalBytes, retainedBytes |  |
| `stream.result` | instant |  | model, isError, subtype, costUsd, durationMs, numTurns, inputTokens, outputTokens, cacheReadTokens, cacheCreationTokens, status, reasonCode, reason, source, providerStatus, providerStopReason, producerExitCode, producerSignal, parserExitCode, timedOut | `subtype` (free-text), `reason` (free-text), `providerStatus` (free-text), `providerStopReason` (free-text) |
| `stream.diagnostic` | instant |  | code, severity, message, providerRecordType, toolId, tool, attempt, delayMs | `message` (diagnostic), `providerRecordType` (free-text), `tool` (free-text) |
| `stream.mode` | instant |  | mode, reason, providerFormat, role, supportedSignals | `reason` (free-text) |
| `stream.evidence_writing` | instant |  | tool, target, match, toolId | `tool` (free-text), `target` (target), `match` (free-text) |
| `stream.missing_terminal` | instant |  | passId |  |
| `usage.reported` | instant |  | usageId, scope, cumulative, inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, reasoningTokens, costUsd, costSource, billing |  |
| `usage.unavailable` | instant |  | reason, scope, iter, elapsed | `reason` (free-text) |
| `verification.started` | open | `verification.ended` | phase, attempt, planRef |  |
| `verification.ended` | close | `verification.started` | phase, attempt, result, rc, evidenceRef, synthesized |  |
| `verification.release_passed` | instant |  | evidenceRef |  |
| `verification.prestaged` | instant |  | phase, attempt, rc, summary | `summary` (free-text) |
| `check.started` | open | `check.ended` | checkId, commandRef, runner, unitId, batch, slot |  |
| `check.ended` | close | `check.started` | checkId, result, durationMs, unitId, condition, batch, slot, concurrent, synthesized |  |
| `job.started` | open | `job.ended` | kind, phase, attempt, cmd, logRef, iter, mode, pid, sid, argv | `cmd` (free-text), `argv` (free-text) |
| `job.step` | instant |  | jobId, cycle, stepTs |  |
| `job.first_failure` | instant |  | jobId, failedAt |  |
| `job.ended` | close | `job.started` | kind, phase, attempt, logRef, msAfterFirstFailure, synthesized |  |
| `yield.started` | open | `yield.ended` | iter, reason, predicateKind, deadlineSec, jobMode, jobLogRef, yieldIndex | `reason` (free-text) |
| `yield.waiting` | instant |  | iter, elapsed, predicateKind, yieldIndex |  |
| `yield.ended` | close | `yield.started` | iter, outcome, reason, waitedSec, jobRc, jobDurationSec, yieldIndex, predicateKind, deadlineSec, jobLogRef, synthesized | `reason` (free-text) |
| `yield.refused` | instant |  | iter, reason, artifactRef, logRef | `reason` (free-text) |
| `resource.wait` | instant |  | resource, holder, ms | `resource` (free-text), `holder` (free-text) |
| `microloop.unit` | instant |  | unitId, check, result, layerOff, fallbackReason |  |
| `task.planned` | instant |  | taskId, estimateMs |  |
| `task.ticked` | instant |  | taskId, elapsedMs |  |
| `tasks.ticked` | instant |  | phase, count, taskIds |  |
| `critic.selected` | instant |  | harness, model, why, diversity, sameModelWarning | `why` (free-text) |
| `critic.started` | open | `critic.call` | phase, attempt, provider |  |
| `critic.call` | close | `critic.started` | promptRef, form, outcome, latencyMs, usage, diversity, sameModelWarning, synthesized |  |
| `critic.grounding_gap` | instant |  | phase, attempt, paths | `paths` (target) |
| `critic.grounding_carried` | instant |  | phase, attempt, paths | `paths` (target) |
| `critic.citation_unresolved` | instant |  | phase, attempt, paths | `paths` (target) |
| `critic.malformed` | instant |  | phase, attempt, streak, limit |  |
| `verdict.recorded` | instant |  | verdictId, phase, attempt, result, title, reason, maxRejects, nonceOk, malformedStreak | `title` (free-text), `reason` (free-text) |
| `verdict.adjudicated` | instant |  | verdictId, falseNegative, by | `by` (free-text) |
| `route.decided` | instant |  | tableId, tableVersion, point, ruleId, signals, choice |  |
| `integrity.noted` | instant |  | kind, detail | `detail` (diagnostic) |
| `integrity.events_changed` | instant |  | phase, attempt, file | `file` (target) |
| `learning.observed` | instant |  | phase, pathRef |  |
| `learning.knob_adjusted` | instant |  | knob, phase, from, to, reason, metric, samples, runId, revertsRunId | `reason` (free-text) |
| `learning.knob_auto_reverted` | instant |  | knob, phase, guardrail, from, to, runId, revertsRunId |  |
| `learning.knob_evaluated` | instant |  | knob, phase, label, action, reset, costR, costMde, wallR, wallMde, nApplied, nBaseline, runId, evaluatesRunId |  |
| `telemetry.delivery` | instant |  | sink, batchId, eventCount, status, httpStatus, reasonCode |  |
| `event.dropped` | instant |  | count, reason |  |
| `redaction.commit_blocked` | instant |  | files, counts | `files` (target) |
| `commit_gate.blocked` | instant |  | phase, attempt, rules, fileCount, signature |  |
| `redaction.dropped` | instant |  | ingressClass, mark, count |  |
| `parallel.plan` | instant |  | groupId, hash |  |
| `parallel.admission` | instant |  | groupId, taskId, check, result |  |
| `parallel.group.started` | open | `parallel.group.ended` | groupId |  |
| `parallel.group.ended` | close | `parallel.group.started` | groupId, outcome, synthesized |  |
| `parallel.worker.started` | open | `parallel.worker.ended` | groupId, workerId |  |
| `parallel.worker.ended` | close | `parallel.worker.started` | groupId, workerId, outcome, synthesized |  |
| `parallel.integration` | instant |  | groupId, step, pathCount, result, refusal |  |
| `strategy.selected` | instant |  | strategy, level, manifestHashes, fallbackReason |  |
| `microloop.inert` | instant |  | phase, attempt |  |
| `checkpoint.accepted` | instant |  | unitId, taskIds, checkpointRef | `taskIds` (free-text) |
| `checkpoint.refused` | instant |  | reason, bytes |  |
| `checkpoint.removed` | instant |  | bytes |  |
| `check.excluded` | instant |  | checkId, reason, scope, durationMs, ruleId |  |
| `check.admission` | instant |  | checkId, batch, slot, result, reason |  |
| `check.parallelism_lowered` | instant |  | from, to, batch, phase, attempt, reason |  |
| `tripwire.raised` | instant |  | kind, ruleId |  |
| `tripwire.cleared` | instant |  | clearedAt |  |
| `source.change_accepted` | instant |  | file, changedRef, oldHash, newHash, acceptedAt |  |
| `fallback.skipped` | instant |  | entry, entryHarness, entryProvider, authTier, audience, reason |  |
| `terms.override_used` | instant |  | termsProvider, authTier, audience |  |
