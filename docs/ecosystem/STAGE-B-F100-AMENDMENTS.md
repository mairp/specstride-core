# STAGE-B-F100-AMENDMENTS

What the tier 2 features need from feature 100. Collected by the orchestrator during the fan-out and applied to feature 100 in one change after it, by appending and never renumbering. Ids in the text are already the final register and queue ids.

| Feature | Wanted from feature 100 | Applied |
|---|---|---|
| 111 | Annex X §X.7: row 44 `observability.limits.*` (defaults 4096, 2048, 4096, 1024, 512, 8, 1024; same under `parity`; narrowing keys), row 45 `observability.retention.rawCapture`, `.rawDays`, `.metadataDays` (off, 7, 30; same under `parity`), row 46 `telemetry.sinkTimeoutMs` (2000; not used under `parity`) | no |
| 111 | Annex X §X.6: rows for eight closed sets owned by 111: ingress classes, marks of dropped content, writer classes of the projection, row shapes of the projection, delivery statuses, reasons for a dropped event, tool-call categories, causes of a synthesized `run.ended` | no |
| 111 | Annex C §C.10 (EP-08): say what the context of `open` holds; 111 gave it a content accessor (CQ-032) | no |
| 111 | Annex B §B.5: a logical name for the legacy event file per engine start (CQ-033) | no |
| 111 | The brief's count of 62 event names is the run stream alone; the inventory has 70 and 65 are carried. No change wanted, recorded only | no |
| 107 | Annex X §X.7: a row for `derive.judgment.harness` (unset; unset under `parity`; DV-096) and a row for `supervise.maxRelaunches` and `supervise.wallClockSeconds` (narrowing ceilings; unset under `parity`; DV-055) | no |
| 107 | Annex G §G.3: the digest line grammar has no field for the comment or for delegation, although F100-FR-192 says the digest records them | no |
| 107 | Annex B §B.7 allows a launch record with mode `dry-run` (CQ-037) | no |
| 107 | Annex B §B.5: a logical name for the verbatim comment (CQ-038) | no |
| 107 | Annex G §G.8: the launch-contract schema has no field for declared scopes, reads and writes; 107 placed them under `configuration` | no |
| 107 | F100-FR-192: say who implements the derivation half of EP-01 | no |
| 104 | Annex X §X.8: an alias row for `SPECSTRIDE_CONTEXT_BUDGET` (proposed key `spec.contextBudget`, default 24000) | no |
| 104 | Annex X §X.7: whether `spec.format`, `spec.feature`, `spec.contextBudget` get rows; 104 treats them as inputs with the as-is default under `parity` | no |
| 104 | Annex G §G.4: exit 1 for the `spec` verb (CQ-042) | no |
| 104 | Annex C §C.7: `tick` takes task ids; the as-is verb ticks a whole phase, so it must also accept a phase | no |
| 104 | Closed sets of 104 beyond rows 49 and 50: kinds of source, states of a source in a verdict, errors of an adapter, subcommands of `spec` | no |
| 104 | Feature-briefs label FX-33 "staleness"; in feature 141 it is "validate and promote" with the scenario `stale-sources`. Recorded only | no |
| 123 | Annex X §X.6 row 14: 30 relaunch refusals, not 21 (CQ-052); a new row for the five `resolve` refusals; the five literals of the second classifier table (CQ-053) | no |
| 123 | Annex G §G.1: verbs `supervise hold` and `supervise release` (CQ-048) | no |
| 123 | Annex E §E.2: define "relaunch window" (T12) and the source of the backoff (T11) | no |
| 123 | Package graph: the doctor registration call must be reachable without importing the doctor package; proposed place is the kernel | no |
| 123 | Feature 141: scenarios wanted in FX-35 and FX-36: `stale-sources`, `invalid-launch-contract`, `colour-always`, `colour-never`, `setup-without-implement`, `precondition-fails`, `relaunch-budget-<n>`, `observe-cadence`, `gate-<refusal>` | no |
| 118 | Annex X §X.6 row 10: an unknown kill reason gets the class `futility` at the baseline (B-0606), not `budget`; 118 follows the baseline | no |
| 118 | Annex D §D.6: the yield artifact schema omits three fields the baseline requires: `resume_when.stable_sec` (B-0727), `resume_when.pid` (B-0724), `resume_when.argv` (B-0723) | no |
| 118 | Annex X §X.7: row for `carry.polite_stop_grace_sec` (10; not used under `parity`) and for `verification.failfast_grace_sec` (10; not used under `parity`) | yes (B-8.6b and B-8.6c): rows 50 and 51 of annex X §X.7 as `carry.politeStopGraceSec` and `verification.failfastGraceSec`; the key list of 110 carries both |
| 118 | Annex X §X.6: closed sets of 118: outcomes of a wait on a yield (`satisfied`, `timeout`, `stop`, `wall_budget`); steps of the end of a pass (`polite`, `terminate`, `kill`) | no |
| 118 | No annex lists the operations of the kernel's process primitive, which the core must use because it may not import the process module | no |
| 118 | Annex B §B.10: the registry class of a long job (CQ-055) | no |
| 118 | Config keys proposed to 110: `roles.proposer.idleTimeoutSec`, `progressTimeoutSec`, `repeatLimit`, `maxCaps`, `repeatIgnore`, `progressPaths`, `loop.watchdogTickSec`, `loop.shortPass.sec`, `loop.shortPass.nudgeAfter`, `loop.yield.*`, `verification.longJob.phase`, `verification.longJob.cmd` | yes (B-8.6c, feature 110): every key stands in its key list, the `loop.yield.*` keys with the `SPECSTRIDE_YIELD_*` and `SPECSTRIDE_FAILURE_*` aliases in its alias table |
| 117 | Annex X §X.7: rows for seven switches, proposed keys `roles.critic.grounding`, `roles.critic.groundingMaxFiles`, `roles.critic.anchorMaxBytes`, `roles.critic.contextTokens`, `roles.critic.debug`, `prompt.critic.overWindow` (DV-099), `prompt.critic.block_set` (DV-100) | no |
| 117 | Annex X §X.8 alias table: `SPECSTRIDE_GROUNDING_MAX_FILES`, `SPECSTRIDE_ANCHOR_MAX_BYTES_CEIL` | no |
| 117 | Annex B §B.5: three logical names (record of the withheld paths per call; the place where the hidden files are kept; the proofs directory beside the phase evidence) and a schema id for the hidden-files record (proposed `specstride.hidden-files/1`) | no |
| 117 | Annex X §X.6: rows for the eight closed sets listed in the spec of 117 | no |
| 117 | F100-FR-037 says "carry-over files" without listing them; 117 reads the handoff and the proposer's notebook | no |
| 117 | F100-FR-203 validates configuration at launch; at the baseline a cap of presence lines that is not an integer fails the critic before a verdict (B-0808); 117 keeps the as-is failure through the alias | no |
| 117 | Feature 141 lists 117 under FX-25 only; its tests also cite FX-02, FX-05, FX-08 | no |
| 109 | Annex C §C.16 and the overlay schema: owner and creation fields; the scope word `critic` in the marker (CQ-064) | no |
| 109 | Annex B §B.5: a logical name for bundled descriptors (CQ-065) | no |
| 109 | Annex G §G.1 has no command for the as-is registry queries (`names`, `display`, `stream`, `invocation-model`); 109 treats them as internal operations with result records | no |
| 109 | Annex X §X.6: rows for nine closed sets that 109 introduces, listed in its spec | no |
| 109 | Ruling 34 (the runtime never asserts a sandbox) against the parity items B-0067 and B-0497: 109 sets the assertion variable only under the `parity` profile (row 25, DV-030) | no |
| 109 | B-0405 names one harness that may never declare an overlay; the descriptor schema has no field for it, so the adapter refuses the declaration | no |
| 109 | Config key proposed to 110: `roles.critic.timeoutSec` (alias `SPECSTRIDE_CRITIC_TIMEOUT`, default 300) | no |
| 109 | Traceability files: the overlay items should cite FX-39, not FX-26 | no |
| 103 | Annex E §E.4: a result of the pass loop for a stop before a pass caused by a changed source (CQ-067) | no |
| 103 | Annex C §C.2: a field for the cache lifetime of a session (CQ-068) | no |
| 103 | Annex X §X.7: a row for `loop.noProgressStructured` (on; off under `parity`, which preserves defect D-44; DV-067) and a row for the carry-over parameters `carry.handoffMaxBytes` (6144), `carry.indexTitleChars` (set by the plan), `carry.maxContinuedPasses` (3), `carry.contextFillTokens` (150000), `carry.contextFillShare` (50), `carry.ageFallbackSec` (300), not used under `parity` | no |
| 103 | The brief lists nine hook points including `requestPass`; annex D has eight call points and treats `requestPass` as a directive; 103 follows annex D | no |
| 103 | Annex X §X.8, old side of the layout table: no row for `proposer-prompt.phase<N>.txt` or `accelerator-prompt.phase<N>.txt` | no |
| 103 | Config keys proposed to 110: `loop.passPauseSec`, `loop.promptProtectedBlocks`, `roles.proposer.maxErrors`, `roles.proposer.maxNoProgress`, and the `carry.*` keys | no |
| 112 | Annex X §X.6: a row for the 19 check groups of the doctor (owner 112; an unknown group is refused at registration) | no |
| 112 | Annex X §X.7: rows for `doctor.staleAfterDays` (90), `doctor.online` (true), `doctor.probeTimeoutSec` (5), `doctor.probeOutputBytes` (65536), each not used under `parity`; spellings for 110 to confirm | no |
| 112 | Annex G §G.7 says "the six launch checks of the as-is supervisor" without naming them or saying where the list is; 123 names and registers them | no |
| 112 | Feature 123 asks that the doctor registration call live in the kernel, so that a package can register checks without importing the doctor | no |
| 102 | Annex B §B.7: fields of the launch record for the flags of `resume` (CQ-072) | no |
| 102 | Annex G §G.4: `resume` has the engine codes only; nothing covers the route through the runtime root or the refusal with survivors (CQ-077) | no |
| 102 | Annex G §G.1: whether the foreground `run` continues a run and accepts the two flags (CQ-076) | no |
| 102 | Annex B §B.11: a field for who asked for a stop (CQ-078) | no |
| 102 | Annex X §X.7: a row for `--new-run` (continue the unfinished run; not used under `parity`; DV-011) and a row for `stop --jobs` (off; not used under `parity`); row 13 names resume fixtures only, and a rerun through `run` or `launch` needs the same treatment | no |
| 102 | Annex X §X.6: row 51 gains the refusals `owner-survivors`, `unsupported-record`, `settings-invalid`; row 76 gains the unknown-value rule "read as `pinned`" (CQ-079) | no |
| 102 | Annex G §G.3: two lines of 102, `[SPECSTRIDE-STOP]` (keys `request`, `now`, `ended`, `next`) and `[SPECSTRIDE-CONTINUE]` (keys `run`, `counts`) | no |
| 115 | Annex X §X.6: row 59 gains `tripwire` (CQ-080); row 66 gains a fifth protected-set fact, `task-list-changed` (IR-56), where annex D §D.7 names four; rows for eight closed sets of 115: unit outcomes, `unchecked`, checkpoint refusals, ledger kinds of `micro`, escalation skip reasons, breach kinds, protected-set classes, result freshness | no |
| 115 | Annex B §B.18: the set of `kind` in the tripwire record (CQ-083) | no |
| 115 | Annex D §D.4 says every router decision is an event; with inertness this holds only once the layer is engaged | no |
| 115 | Annex C §C.14 against IR-36 (CQ-085) | no |
| 115 | Annex G §G.3: basic protection in the `[LOOP]` line (CQ-082) | no |
| 115 | Package graph: an edge package for 115 that may touch the file system, proposed `@specstride/integrity` (L1) | no |
| 115 | New schema ids: `specstride.checkpoint/1`, `specstride.protected-set/1`, `specstride.check-result/1` | no |
| 115 | Annex X §X.7: eleven rows, all not used under `parity`, narrowing: `loop.routing` (on), `loop.micro.caps.repairs` (2), `.escalations_per_task` (1), `.escalations_per_attempt` (2), `.proposal_minutes` (20), `.unit_minutes` (30), `.check_minutes` (5), `.check_share_percent` (15), `.cycles_extra` (6), `.cycles_min` (12), `.unresolved_units` (2) | no |
| 115 | Feature 111: the event names of the layer; the register names only `loop_strategy_selected` and `micro_inert` | no |
| 115 | DV-052: wider wording (CQ-084) | no |
| 113 | Annex G §G.1: no command writes an inbox request of type `host-event`; annex B §B.11 says only "CLI on behalf of a host" | no |
| 113 | No exit code and no form of the refusal line for a protocol mismatch found by the shim | no |
| 113 | Annex B §B.5: how a shell shim finds `run:<runId>:status-line` without starting Node | no |
| 113 | Annex G does not fix the judgment and the modes of the reverse skill, which 113 consumes from 108 | no |
| 113 | Annex X §X.6: two rows proposed: logical ids of host skills and entries; the seven checks of the context-cost CI (F113-FR-037). Row 84 (six host capabilities) is listed in the spec of 113 with all members | the checks row is named "Checks of the context-cost CI" in the spec of 113 (second pass of feature 111, note 7); the row itself was not added by feature 100 — decide in B-8.7 whether the spec of 113 needs it |
| 108 | Annex B §B.5 against F100-FR-003, F100-FR-004, F100-FR-217: the CLI as writer of two control-plane files (CQ-092) | no |
| 108 | Annex B §B.5: three logical names for a reverse run (CQ-093) | no |
| 108 | Annex X §X.8 alias table: `SPECSTRIDE_CONTEXT_BUDGET` (proposed key `reverse.contextBudget`; 104 proposed `spec.contextBudget` for the same variable, so the two must be settled together) | no |
| 108 | Annex G §G.1: `--detach` on `reverse` and the name of the comment argument | no |
| 108 | Annex X §X.7: rows for `--detach`, `--comment`, and the keys `reverse.tasks` (done), `reverse.maxFileBytes` (1048576), `reverse.maxTotalBytes` (20971520), `reverse.contextBudget` (24000), each with its as-is default under `parity` | no |
| 108 | Annex X §X.6: rows for the closed sets of 108, the 38 finding codes of the reverse lint among them | no |
| 119 | Annex X §X.8 alias table: `SPECSTRIDE_COLOR`, `SPECSTRIDE_MOTION`, `SPECSTRIDE_BANNER`, `SPECSTRIDE_LIVE_RAIL`, `SPECSTRIDE_BANNER_BG`, `SPECSTRIDE_ASCII` (translated, DV-027) | no |
| 119 | Annex X §X.7: nine rows for output options, as-is value under `parity`: `output.live` (auto), `output.liveDetail` (tools), `output.verbose` (off; not used), `output.color` (unset), `output.banner` (on), `output.motion`, `output.liveRail` (on), `output.bannerBg` (unset), `output.ascii` (off) | no |
| 119 | F100-FR-172 says every `--json` output is one record; the baseline's `events --json` prints one object per line, which compatibility output keeps | no |
| 119 | Annex G §G.4: no row for a flag without its value (CQ-098) | no |
| 119 | EP-09: the read model does not expose the owner text that `status` prints after `RUNNING` | no |
| 119 | EP-08: no operation returns the status line of a sink, which `status` needs for its telemetry section | no |
| 119 | Annex G §G.3: keys of the `[SPECSTRIDE-…]` lines of the inspection verbs (CQ-094) | no |
| 119 | Annex X §X.6: rows for the 12 closed sets of 119 | no |
| 119 | Traceability files: terminal rendering items should cite FX-40, not FX-28 | no |
| 126 | Annex X §X.7: seven rows: `stream.tap` (on; on), `stream.tapExecutable` (unset; unset), `stream.limits.lineBytes` and `.linesPerSecond` (1048576, 5000; off under `parity`; DV-102), `stream.noActivityFlag` (on; off; DV-101), `invocation.recordAllPasses` (on; off; DV-103), `invocation.idBase` (unset; unset), `invocation.debug` (off; off) | no |
| 126 | Annex B: schema ids for the four invocation artifacts (CQ-105) and a logical name for the breaker state of the finalizer; 126 put the five breaker fields in the `core` counters of the ledger | no |
| 126 | Annex C §C.10: what the context of `open` holds; 126 proposes the labels `job`, `service.name`, `task`, `backend` for the parity of the exporters of 128 | no |
| 126 | Annex X §X.6 row 31 (stream formats): 126 lists the registered Wave 1 formats | no |
| 126 | 126 uses the retention keys that 111 proposed (`observability.retention.rawDays`, `.metadataDays`) | no |
| 124 | Annex X §X.7: six rows: `discovery.enabled` (off under `parity`), `discovery.online` (off), `roles.refuseUnknown` (off; DV-104), `critic.autoPickMaxUsd` (not used), `critic.catalogueWindowMargin` (not used), `critic.warnSameModel` (not printed) | no |
| 124 | Annex G §G.3: the digest grammar has no field for the picked critic, although F100-FR-093 says the pick is shown in the digest (the same gap 107 found for the comment and delegation) | no |
| 124 | Annex B §B.5: logical names for a bundled harness descriptor (109 proposed `package:harness:<id>`) and for the bundled catalogue snapshot | no |
| 124 | `user:harness-verify:<id>` has no schema; 124 reads harness, version, descriptor hash, date, outcome | no |
| 124 | Annex G gives `harness verify` to 109, the brief puts promotion in 124; read as: 109 owns the command, 124 the resulting state | no |
| 124 | Annex C §C.6: the role plan names only fallbacks of the consumer; the pass-over of F100-FR-089 needs the ranked runners-up; 124 added them as an additive field | no |
| 124 | Annex X §X.6: rows for six closed sets of 124 | no |
| 124 | Feature 111: event names `harness.discovered`, `roles.resolved`, `critic.passed-over`, `critic.diversity` | no |
| 124 | Feature 141: FX-07 is described as exit 3 for an unknown harness name, while the baseline scores MALFORMED with exit 10 | no |
| 134 | Annex C §C.3: the critic proof requires a minted session, which a critic without a session cannot give (CQ-110) | no |
| 134 | Annex G §G.7: who assigns the ids of the doctor checks of a harness adapter (CQ-108) | no |
| 134 | Config key proposed to 110: `harnesses.pi.contextWindow` (a map from model id to tokens) | no |
| 142 | Annex G §G.3, the `[LOOP]` line: fields `worker-caches=`, wall hours and agent hours (PU-72, PU-97) | no |
| 142 | Package graph: an edge package for the tree store, which must start a process; proposed `@specstride/tree-store`, owner 142 | no |
| 142 | Annex X §X.6: three rows: ledger record kinds of the namespace `parallel` (13 members); reasons the layer is switched off inside a run (`group-failures`, `harness-error`, `unchecked`, `missing-object`, `ledger`, `check-budget`, `plan-hash`, `apply-incomplete`); sources of a scope (`consumer`, `task-text`) | no |
| 142 | Annex X §X.7: four rows, all not used under `parity`, DV-080: `loop.parallel.scopes.<taskId>`, `loop.parallel.exclude`, `loop.parallel.seed_paths`, `loop.parallel.resources.<name>.capacity` | no |
| 142 | Closed set rows 60 to 64 are listed in the spec of 142 with all members | no |
| 106 | No contract for the tamper bracket (CQ-115) | no |
| 106 | Annex B §B.5: a logical name for the lock file of the learning writer domain; a schema id for the retrospective (CQ-114) | no |
| 106 | Feature 111: event type names for `knob_adjusted`, `knob_auto_reverted`, `knob_evaluated`, `learning_observed`, `events_tampered` | no |
| 106 | No interface at L2 for the engine's calls `resolve`, `observe`, `evaluate`; 106 reads a plain function interface in the contracts package | no |
| 106 | Config key proposed to 110: `loop.yield.poll` | no |
| 106 | Annex X §X.6: row 77 listed with all members, and 12 further closed sets of 106: knobs, decision actions, arms, evaluation labels, actions taken, reset causes, guardrails and their states, counterfactuals, kill classes, pass outcomes, selector sources, retrospective statuses | no |
| 131 | Annex X §X.8 alias table: `OPENAI_BASE_URL` to `harnesses.codex.endpoint.base`, `OPENAI_API_KEY` to the secret reference `harnesses.codex.auth.credential` (B-0832, B-0833 are translated through the table) | no |
| 131 | Annex C §C.15: containment C2 says credential paths are denied; whether the read-only sandbox of Codex denies reads of credential paths or of the control plane is unverified until a capture | no |
| 131 | Annex C §C.1: a minted session id (CQ-117; the same point as CQ-110 of feature 134) | no |
| 131 | Config keys proposed to 110: `harnesses.codex.endpoint.base`, `harnesses.codex.auth.credential`, `harnesses.codex.authTier`, `roles.critic.contextTokens` | no |
| 131 | Feature 141: FX-07 scenario `codex-missing-key` (CQ-116); 124 found the same kind of mismatch in FX-07 for an unknown harness name | no |
| 128 | Annex X §X.7 row 42: `otel.legacyMetricNames` is off under `parity`, while F100-FR-212 asks for the value that reproduces the baseline; 128 reads row 42 as written and DV-058 waives the scenario | no |
| 128 | Annex C §C.10: the context of `open` has no content accessor and no lookup of the as-is name (CQ-119; also 111 and 126) | no |
| 128 | Annex X §X.7: rows for 15 options of 128, spellings in its `contracts/config-keys.tsv` | no |
| 128 | Annex X §X.6: closed sets of 128: sink labels, receiver states, delivery reasons, OTLP signals, attribute dialects, scopes of a span, metric names, forms of a payload | no |
| 128 | Annex G §G.1 lists no flags `--telemetry`, `--loki-url`, `--otel`, `--otel-url`, `-j`; 128 specifies them as ported flags | no |
| 128 | Annex B §B.5: a logical name for the context-budget report (CQ-123) | no |
| 128 | The fields of `telemetry.delivery` have no signal field, so a failed traces request cannot be told apart | no |
| 127 | Annex B §B.5: a logical name for the spend ledger, proposed `run:<runId>:spend` | yes (confirmed by 127 on 2026-10-03, T085): annex B §B.5 carries `run:<runId>:spend`, writer the engine; worklist row 138 is ticked |
| 127 | Annex X §X.7: rows for `loop.maxWallMin` (0; 0), `budget.role.<role>.*` and `budget.run.*` (off; off), `budget.alerts.thresholds` (50, 75, 90; not used), `budget.rates` (unset); sharing row 39: `pause.marginMs` (60000), `pause.jitterMs` (30000), `pause.probeScheduleMs`, `quota.transientMaxWaitMs` (60000), `quota.overloadRetries` (3); sharing row 40: `roles.<role>.fallbackAfterMs` (0), `roles.<role>.fallbackReturn` (`restore`) | yes (confirmed by 127 on 2026-10-03, T085): annex X §X.7 rows 107 to 112 carry `loop.maxWallMin`, `budget.role.<role>.*`, `budget.run.*`, `budget.alerts.thresholds`, `budget.rates`, the pause keys and the fallback keys; worklist row 139 is ticked |
| 127 | Annex X §X.6: four closed sets of 127: alert kinds, budget dimensions, sources of a reset time, reasons that skip a fallback entry | yes (confirmed by 127 on 2026-10-03, T085): annex X §X.6 rows 205 to 208 carry alert kinds, budget dimensions, sources of a reset time and reasons that skip a fallback entry; worklist row 140 is ticked |
| 127 | Annex D §D.4 lists no quota signal for the router, although F100-FR-130 and F100-FR-140 need a skip on a limited target (CQ-136) | yes (confirmed by 127 on 2026-10-03, T085): annex D §D.4, Inputs, lists "the state of the limit window of the target of an escalation", and F100-FR-130 skips the escalation when the quota of the target is exhausted; `specs/100-specstride/spec.md` records it for 115 and 127 under CQ-136; worklist row 141 is ticked. This is the confirmation CQ-136 asked for, so the need is closed |
| 127 | Annex B §B.17 removes the pause record at resume, so 127 keeps the start of a pause episode in the ledger | no |
| 122 | Annex X §X.7: six rows: `runtime.detach.strategy` (`spawn-detached` under `parity`), `runtime.handshake.timeoutSec`, `runtime.lease.heartbeatSec`, `runtime.lease.graceSec`, `runtime.lock.provider`, `state.controlRoot` | no |
| 122 | Annex X §X.8: the alias table maps the as-is state-directory variable to "the control root" without a key | no |
| 122 | Annex X §X.6: six closed sets of 122: results of `reclaim`, errors of a detach strategy, what a strategy survives, launch refusals written by 122, end causes of a registry entry, results of a spike case | no |
| 122 | The brief says the strategy in use is in the run record; feature 100 has it in the launch record (`detachStrategy`); 122 follows feature 100 | no |
| 122 | Annex B: a schema id for the export archive, proposed `specstride.state-archive/1` | no |
| 122 | Annex G §G.1: a command to free a foreign or unknown lock (CQ-140) | no |
| 122 | Annex F §F.3: confirm `lock-conflict` and `lock-unknown` as exit 24 and the other refusals of 122 as 4 | no |
| 130 | Annex X §X.7: rows for `harnesses.dsh.critic.proof` (`strict`; `none` under `parity`; DV-110) and `harnesses.dsh.pluginAllowlist` (empty; as the fixture sets it; DV-091) | no |
| 130 | Annex X §X.8 alias table: nine keys without an alias: `harnesses.dsh.home`, `.provider`, `.reasoningEffort`, `.pluginAllowlist`, `.pluginTimeoutSec`, `.modelProviders`, `.contextWindows`, `roles.critic.provider`, `roles.critic.reasoningEffort` | no |
| 130 | Annex B §B.5: a logical name for the temporary critic patch file, proposed `pass:<passId>:critic-patch` in the place `temp` | no |
| 130 | Feature 141: FX-07 scenarios of dsh (CQ-141); the third mismatch found in that family | no |
| 125 | Annex X §X.8 alias table: `SPECSTRIDE_PROPOSER_SKILLS`, `SPECSTRIDE_CLAUDE_CRITIC_API_KEY`, `SPECSTRIDE_CLAUDE_CRITIC_BASE_URL`, `SPECSTRIDE_CLAUDE_CRITIC_MODEL`, `SPECSTRIDE_BACKEND_LABEL`, `SPECSTRIDE_STDIN_FILE`, `SPECSTRIDE_CRITIC_CONTEXT_TOKENS` | no |
| 125 | Annex X §X.7: four rows: `harnesses.claude.proposerSkills` (off; off), `harnesses.claude.subprocessEnvScrub` (on; off), `harnesses.claude.gitInstructions` (unset; unset), `harnesses.claude.disableSubagents` (off; not used) | no |
| 125 | Annex B §B.5: whether the logical name of session state applies at Tier 1, where the harness keeps it inside its configuration home (CQ-143) | no |
| 125 | A failed critic proof: refusal that halts (feature 100) against a failed critic call (R5) | no |
| 138 | Annex X §X.7: no row for `stream.capture` (alias `SPECSTRIDE_AGENT_STREAM`; on under `parity`; owner 126); row 26 also covers the extra critic flags and the tool allow-list, which its text does not name; row 28 is also used for the as-is context window of 98,304 tokens | no |
| 138 | Dialect row schema (annex C §C.5): no fields for the line and rate caps of the reader, and none for the words at the end of an agent's stream, which sit in the reader; a pi row that needs other words would need the row extended | no |
| 138 | Annex X §X.6: row 39 (dialects) listed with `prime` and `pi`; six closed sets of 138: reader diagnostic codes, severities, reader terminal reason codes, tool statuses, words of the end of the agent, critic call modes | no |
| 138 | Doctor check ids of the adapter, `harness.prime.<check>` (the same question as CQ-108 of feature 134) | no |
| 138 | Config keys proposed to 110: `harnesses.prime.launcher`, `.tools`, `.envAllow`, `roles.critic.contextTokens` | no |
| 105 | Annex X §X.7: seven rows: `verification.mode`, `verification.testPlan`, `verification.commands`, `verification.generateTests`, `verification.env_allowlist` (DV-113), `verification.summary.tailLines`, `verification.summary.tailErrLines` | no |
| 105 | Annex X §X.6 row 53: `changed-during-check` belongs to `tainted`, not `unchecked` (CQ-154); eight closed sets of 105 lack a row: stages, reuse policies, `discovery`, obligation kinds, `automationStatus`, result signals, `verify` sub-commands, state of a step run | no |
| 105 | F100-FR-137 ties the check manifest to profile row 1, while rows 7, 31 and 33 need it with the layer off (CQ-153) | no |
| 110 | Annex X §X.7 row 42: the key becomes `telemetry.otel.legacyMetricNames`; row 16 `telemetry.content` takes `auto` or `off`; literals under `parity`: row 26 `baseline`, row 29 `as-is` | no |
| 110 | Annex X §X.8: `SPECSTRIDE_CONTEXT_BUDGET` feeds both `spec.contextBudget` and `reverse.contextBudget`; alias rows for the two `SPECSTRIDE_DSH_PLUGIN_*` variables and the others listed in the spec of 110 | no |
| 110 | Annex X §X.6: a closed set for the check points of staleness (`launch`, `resume`, `pass-start`, `critic-start`), and for the values of `telemetry.content`, `memory.native.proposer`, `roles.critic.transport` | no |
| 110 | Annex X §X.2: where a per-phase value declared in the verification-commands document stands (CQ-158) | no |
| 110 | New keys of 110: `harnesses.<id>.tiers`, `attempt.tier_bump_after`, `loop.parallel.tasks.<taskId>.eligible` and `.writes`, `profile`, `harnesses.<id>.pluginAllowlist` and `.pluginTimeoutSec`, `loop.tickTasks`, `distribution.termsOverride`; `session.ttl_seconds` is not a key | no |
| 110 | 142 proposed `loop.parallel.scopes.<taskId>` where 110 spells `loop.parallel.tasks.<taskId>.writes`; 110 owns the spelling | no |
| 110 | Feature 141 does not list 110 under FX-13 and FX-29, which brief 110 names | no |
| 129 | Annex G §G.6: the inputs of the read model (CQ-161, CQ-166) and the cursor (CQ-164) | no |
| 129 | F100-FR-161: `validUntil` of a resting run (CQ-163) | no |
| 129 | Contracts: no schema for the view; a task of 129 adds one to the contracts package | no |
| 129 | Package graph: the view package may import only the contracts package, so the table evaluator, the redaction function and the canonical hasher are handed in by the caller | no |
| 129 | Annex X §X.7: a row for `status.precompute` (on; off under `parity`) | no |
| 129 | Annex X §X.6: eight closed sets of 129: lanes, kinds of attention item, budget levels, liveness values, reasons of `stale`, keys of the status line, quota states of a budget row, the rows of the lane table | no |
| 129 | Config keys proposed to 110: `status.stale_event_sec` (1800), `status.timeline_rows` (20), `wait.poll_sec` (5), `wait.timeout_sec` (600), `status.precompute` | no |
| 101 | F100-FR-148 asks for a stop reason on every exit other than 0; annex E §E.4 lists none for the exits 1, 3, 5 and 70 (CQ-174) | no |
| 101 | F100-FR-139 (hash only after the return) against the as-is content that parity compares (CQ-173) | no |
| 101 | F100-FR-204 does not name the bump table of the attempt planner among the users of the table evaluator; 101 gives it the form `specstride.table/1` with one decision point `attempt-tier`, which belongs to the planner and not to the router | no |
| 101 | Annex X §X.7: a row for K (`attempt.tier_bump_after`; 2; not used under `parity`) and a row for the refusal of ticked phases without an approval record (CQ-172); a row number for the block set of the critic prompt (DV-100), which the diagnostician prompt also reads | no |
| 101 | Annex X §X.7 row 32 (`integrity.phase_entry`) names 115 as owner; brief 101 gives the comparison at phase entry to 101; 101 performs it and reads the switch | no |
| 101 | Annex X §X.6: five closed sets of 101: details of a MALFORMED verdict, cases of a diagnosis, outcomes of the bump rule, reasons of a skipped bump, what failed in an approval record; rows 5, 8 and 9 are listed in its spec with every member | no |
| 101 | Threat T-06 says a halt at the MALFORMED limit is reported as blocked on a human; the closed set of blocked reasons has no member for a halt by a limit; 101 makes it a stop that is not retryable, with no `blocked` event | no |
| 101 | Config keys proposed to 110: `attempt.tier_bump`, `loop.maxRejects`, `loop.oscMax`, `loop.gitCommits`, `roles.critic.malformedLimit`, `roles.diagnostician.enabled`, `roles.accelerator.enabled`, `roles.accelerator.harness` | no |
| 144 | EP-08 is implemented by 111 (core side, writer, conformance suite, sample sink) and by 144 (the projection sink); profile row 17 (`compat.legacyEvents`) belongs to 144; two closed sets proposed by 111 (writer classes, row shapes of the projection) belong to 144 | no |
| 140 | No contract for the format of the source inventory, which the reverse guard and the plan of 108 and the lint of 140 all read; a schema id is proposed for annex B, for example `specstride.reverse-inventory/1`; the same holds for the walk rules and the fingerprint, which the guard applies again | no |
| 140 | Package graph: one package `@specstride/reverse`, owned by 108; 140 places its code in that package; a package of its own would need a change to the graph | no |
| 140 | Annex X §X.6: closed sets of 140: lint finding codes (38), severities, lint levels, evidence kinds and validations, walk modes, skip reasons, roles, entry-point kinds, languages, the schema of the inventory; the modes of tasks and the kinds of guard problem stay with 108 | no |
| 140 | Annex X §X.7: the rows `reverse.maxFileBytes`, `reverse.maxTotalBytes`, `reverse.contextBudget` belong to 140 | no |
| 145 | Feature 100 holds no contract for the presenter, the banner or the theme; F119-FR-021 (`watch`) says the card is rendered by the presenter, and 145 says the front door calls its card and plain forms; a contract between the front door and the presenter is needed in annex G | no |
| 145 | 145 consumes EP-08; 119 keeps EP-01, EP-02, EP-03, EP-09, and EP-08 for the delivery status of a sink only | no |
| 145 | Annex X §X.6: nine closed sets of 145: presenter modes, detail levels, colour depths, colour arguments, backgrounds, colour roles, banner tiers, rail states, live settings | no |
| 145 | Annex X §X.7: the rows for `output.live`, `output.liveDetail`, `output.color`, `output.banner`, `output.motion`, `output.liveRail`, `output.bannerBg`, `output.ascii` belong to 145; `output.verbose` stays with 119 | no |
| 147 | EP-11 (`specstride.terms/1`) and the closed set rows 40, 41 and 42 of annex X §X.6 belong to 147; profile row 34 is read by 147 | no |
| 147 | Nothing in feature 100 covers `distribution.termsOverride` or `roles.<role>.tier` | no |
| 147 | Superseded line of this file: 110 no longer spells `loop.parallel.tasks.<taskId>.writes`; `loop.parallel.scopes.<taskId>` and `loop.parallel.exclude` of 142 stand | no |
| 147 | Config keys: the confirmed list is `specs/110-config-and-terms/contracts/config-keys.tsv` (253 rows). Rule: the 43 rows of annex X §X.7 keep their spelling; every other key is lowerCamelCase with the suffixes `Sec`, `Ms`, `Min`, `Bytes` | no |
| 147 | Feature 141 lists neither 110 nor 147 under FX-13 or FX-29 | no |
| 149 | EP-18 (both seams) belongs to 149 as content owner; 101 consumes it. Closed set row 9 (kinds of phase attempt) and profile row 24 (`attempt.tier_bump`) belong to 149; two new closed sets of 149: outcomes of the bump rule (`bump`, `skip`, `none`), reasons of a skipped bump (`critic-model`, `quota-exhausted`, `ladder-top`) | no |
| 149 | Annex E §E.1: the inputs of `next` lack two facts that the recovery planner needs: whether a diagnosis was made, and whether an accelerated phase attempt is due; the engine (101) works them out and hands them over | no |
| 149 | Annex E §E.1 states the guarantees of a critic call (own nonce, fresh session) but does not name the call function that the engine hands to a critic strategy | no |
| 149 | Feature-briefs D.5: the criterion "the critic never approves its own session" is assigned to 101 and is now F149-SC-001 | no |
| 148 | EP-05 belongs to 148 as content owner; 105 consumes it and keeps EP-07. Closed set rows 53 and 54 and profile rows 6, 7 and 31 belong to 148; rows 15 and 33 and closed set row 52 stay with 105 | no |
| 148 | Feature 100 states no rule for the reuse of staged commands; 148 names the logical name `attempt:<N>:<k>:<n>:prestage` instead | no |
| 148 | Package graph: one package for verification, owner 105; 148 proposes `@specstride/check-runner`, layer L1 | no |
| 148 | Annex E §E.2: a field of the run record for the lowered parallelism (CQ-pending-1 of 148) | no |
| 148 | New closed sets of 148: the signals `TIMEOUT` and `EXEC_ERROR`; state of a run of steps; reasons of an admission to a batch | no |
| 146 | Closed set row 34 (states of a harness) belongs to 146; two closed sets of 146 without a row: sources of discovery, steps of the probe ladder; profile rows requested by 146: `discovery.enabled`, `discovery.online`, `critic.catalogueWindowMargin`; 124 keeps rows 35 and 36 and requests `roles.refuseUnknown`, `critic.autoPickMaxUsd`, `critic.warnSameModel` | no |
| 146 | The list of candidates is handed from discovery to role resolution in memory, inside one command; feature 100 holds only the resulting record (annex C §C.6, field `harnesses`) | no |
| 146 | Package graph: 146 joins 109, 124 and 126 as owner of the harness package | no |
| 146 | The logical names for a bundled harness descriptor and the bundled catalogue snapshot, and the schema of `user:harness-verify:<id>`, are now needed by 146 | no |
| 143 | Closed set rows 62 (outcomes of a worker) and 64 (operations of the tree store) belong to 143, and so do the thirteen ledger record kinds of the namespace `parallel`; rows 60, 61 and 63 stay with 142; the option for seed paths (`loop.parallel.seedPaths`) belongs to 143 | yes (B-8.6b, W-100-03) |
| 143 | Annex D does not say that `integrateGroup` carries, per worker, accepted or the refusal reason, which is how the verdicts of the audits of 142 reach the engine before `compose` | no — to the second pass of feature 100 (B-8.6e; item 3 of the repair report of 143) |
| 143 | Annex D §D.1 names none of the four reports of the engine that 142 acts on: a missing object, a changed ledger, an application that was not completed, a harness adapter without a spending limit | no — to the second pass of feature 100 (B-8.6e; item 2 of the repair report of 143) |
| 143 | The thirteen ledger record kinds of the namespace `parallel` have no row, although requirements of 142 name two of them (`group_barrier`, `merge_check_finished`) | yes (B-8.6b, W-100-03; row 184 of annex X §X.6, owner 143) |
| 143 | Package graph: no package for the tree store | yes (B-8.6b, W-100-03; `@specstride/tree-store`, owner 143) |
| 116 | EP-16, the fact block (annex D §D.7), closed set rows 27, 65 and 66, profile row 32, the threats T-20 and T-24 and three schemas belong to 116; T-19, T-23 and T-49 are shared with 115; 115 keeps EP-04 (`micro`), EP-06, closed set rows 55, 56, 59 and 67 and profile rows 1, 2 and 3 | yes (B-8.6b, W-100-02) |
| 116 | Annex D §D.1 speaks of the services a layer declares and the engine offers and names none; 115 declares fingerprints and the builder of the fact block as such services; a list of services is needed | no — not required by the repaired features 115 and 143; decide in B-8.7 |
| 116 | Annex B §B.5: a logical name for the task list as read at launch (CQ-pending-1) | yes (B-8.6b; `run:<runId>:task-list` in annex B §B.5) |
| 116 | Packages proposed: `@specstride/integrity` for 116 and `@specstride/layer-micro-io` for 115 | yes (B-8.6b, W-100-02) |
| 128 | Annex B §B.20: the schema id of the span state, `specstride.span-state/1`, logical name `run:<runId>:span-state`, owner 128 (worklist item W-100-09) | yes (B-8.6b, W-100-09) |
| 111 | Annex X §X.6: three closed sets — the end causes of a pass, the end causes of a phase attempt and the outcomes of a phase (worklist item W-111-05) | the members are listed by 111 (B-8.6c, its repair report); the rows to §X.6 are pending (W-100-18, second pass B-8.6e) |
| 142 | Annex X §X.7: the worker-ceiling key `loop.parallel.workersMax` (default 4, widening; a `loop.parallel.workers` above the ceiling is a configuration error; worklist item W-100-06) | yes (B-8.6b, W-100-06) |
| 113 | A requirement that controls the threat T-43, the host hook reading the project (worklist item W-100-17) | yes (B-8.6b, W-100-17): F100-FR-236 |
