# Annex E — Engine (L4)

Part of the specification of feature `100-specstride`. Normative.

This annex holds the internal seams of EP-18, the run-state machine with the run record, the closed
enumeration of stop reasons, and the exit codes and result records of the engine and of the
components it calls. The tables of §E.3 and §E.4 are the interface contract: no feature needs
another document to find a code or a reason.

How to cite: "annex E, §E.3 Stop-reason enumeration, F100-FR-148".

## §E.1 EP-18 Critic strategy and attempt planner

#### Id and version
`specstride.critic-strategy/1` and `specstride.attempt-planner/1`. Internal seams: versioned and
tested as every extension point, with no promise outside the product's repository in Wave 1.

#### Purpose
The critic strategy decides how a phase gate is judged. The attempt planner decides of which kind
the next phase attempt is. Both are seams so that a later strategy needs no change of the loop.

#### Caller and time
The engine calls `judge` once per phase gate, after the verification gate. The engine calls `next`
after every rejection.

#### Inputs
`judge`: the input of the phase gate (phase evidence, grounding snapshot, result of the
verification gate, fact block, the role plan), and the call function of the engine, which makes
one `completion` call with a nonce and a fresh session of its own and returns the reply with
the facts of the proof. A critic strategy reaches a harness through this function only. `next`:
the history of the phase attempts of the phase (verdicts, signatures of unmet criteria, counts
from the ledger), and two facts that the engine works out and hands over: whether a diagnosis
was made for the newest signature, and whether an accelerated phase attempt is due.

#### Outputs
`judge`: one verdict record, from the closed set APPROVED, REJECTED, MALFORMED. `next`: the kind
of the next phase attempt, from the closed set `plain`, `diagnosed`, `accelerated`, `bumped`.

#### Errors
`judge`: a configuration error of the critic (engine exit 3, `critic_config`); a transport error,
which is scored as MALFORMED. A missing credential of the critic is a configuration error under
the default profile and a failed call, scored as MALFORMED, under the `parity` profile, where the
finding before the call is inactive (row 133 of annex X §X.7; DV-117). `next`: none.

#### Guarantees of the core
Every `completion` call inside `judge` has a nonce of its own, of 64 bits from a secure random
source, and is a fresh session. A verdict is parsed only from the reply, as a full line, with
exactly one match; everything else is MALFORMED, which rejects. Only the engine writes the
approval record. The model of a critic-class call never equals a model that produced passes in the
phase attempt without the critic-diversity warning being raised and recorded. The warning is
raised for the results `same-model` and `unverified` of the diversity test. Ruling 49 calls it
"the same-model warning", which is the narrower name of the first result; the specifications
write "critic-diversity warning".

#### Guarantees of an implementation
A critic strategy returns exactly one verdict record and never approves on a MALFORMED reply of
any of its calls. An attempt planner is a pure function of the history.

#### Failure of an implementation
A critic strategy that fails gives MALFORMED, counted by the MALFORMED limit. An attempt planner
that fails gives `plain`.

#### Unknown-value rule
An unknown verdict is MALFORMED. An unknown kind of phase attempt is `plain`.

#### Wave 1 implementations
Critic strategy: one critic. Attempt planner: the recovery cycle as at the baseline (the
diagnostician on a new signature of unmet criteria, the accelerator when due); and the model-tier
bump after K rejections by the critic, as an option that is off by default.

#### Content owner
149. Feature 101 consumes both seams.

#### Proving test
Seam conformance: a sample critic strategy that makes two calls and a sample attempt planner, both
in the test tree, run a fixture with no change to the loop. The verdict parser is fuzzed with
every ledger record and every row of the fact block.

- **F100-FR-138**: The engine MUST judge every phase gate through the critic strategy seam and plan every phase attempt through the attempt planner seam, with the operations `judge` and `next` of §E.1. Wave 1 MUST ship one critic; a critic ensemble and human approvals are not part of Wave 1.
  - test: CT-100-238
  - ep: EP-18 `specstride.critic-strategy/1` (implements)

- **F100-FR-139**: Every critic call MUST carry a nonce of 64 bits of its own. The nonce MUST never be written to disk, to an event or to a span before the call has returned; afterwards only its hash MUST be recorded in events, spans, the ledger and the approval record. The verdict record and the feedback of the phase attempt MAY hold the nonce in clear after the call has returned, as at the baseline, because the oracle compares them.
  - test: CT-100-239
  - ep: EP-18 `specstride.critic-strategy/1` (implements)
  - assumption: CQ-173

- **F100-FR-140**: The model-tier bump MUST be an option, off by default: after K rejections of one phase by the critic, the next phase attempt runs on the next model tier of the same harness. K and the model-tier ladder MUST come from configuration. A failed verification gate and a MALFORMED reply MUST NOT count towards K. A target that equals a critic-class call of the run in model and in effort, and a target whose quota is exhausted, MUST be skipped. A target that shares the model of a critic-class call and differs from it in effort is not a collision (ruling 49): it MAY be used, and the critic-diversity warning MUST be raised and recorded, as for escalation (F100-FR-130). The bump and the escalation of annex D §D.4 MUST be separate rules with separate counts.
  - divergence: DV-079
  - assumption: CQ-204; CQ-191 (ruling 49 is read to allow a target on the critic's model at another effort, with the warning, for the bump as for escalation)
  - parity: off (row 24 of annex X §X.7)
  - test: CT-100-240
  - ep: EP-18 `specstride.attempt-planner/1` (implements)

## §E.2 Run-state machine

Schema id `specstride.run-state/1`.

### States

| State | A process is alive | Lock held | Meaning |
|---|---|---|---|
| `created` | The CLI only | No | The launch checks passed and the launch record is written |
| `starting` | Runtime root | Being taken | The root is up; the handshake is not yet confirmed |
| `running` | Root and engine | Yes | The loop is working |
| `paused-quota` | Root and engine, asleep | Yes | A quota window is closed. No budget of any kind is spent |
| `relaunching` | Root | Yes | The engine ended with a classified transient; the root waits out the backoff |
| `stopping` | Root, perhaps the engine | Yes | A stop request was seen |
| `blocked-on-human` | None | No | The run cannot go on without the consumer. It rests until `resume` |
| `finished` | None | No | Every phase approved, release verification passed, remaining stages complete |
| `stopped` | None | No | Stopped on request |
| `failed` | None | No | A halt with a stop that is not retryable, or the relaunch budget is spent |
| `dead` (derived) | None | Stale | The record shows a live state and the lease has no live owner. Never written |

What the engine is doing inside `running` (proposing, checking, verifying, reviewing, waiting on a
job) is read from open events and is not a state. Two more conditions are derived by readers and
never written: `stale` (the owner lives; heartbeat and newest event are both old) and
`launch-abandoned` (a launch record without an outcome and without a lease, older than the
handshake limit).

### Transitions and the process that owns each

"Root" is the runtime root. In start mode `standalone` there is no root, and the engine owns every
transition that the table gives to the root.

| # | From | To | Trigger | Owner | Written |
|---|---|---|---|---|---|
| T1 | — | `created` | `launch` or `resume` passes the launch checks | CLI | Launch record |
| T2 | `created` | `starting` | The detach strategy starts the root | CLI | — |
| T3 | `created` | `blocked-on-human` | At `resume`, or at a `launch` that continues a run, a source hash differs from the run snapshot | CLI | Launch record with the outcome `refused` and the file named. The command exits 3 |
| T4 | `starting` | `running` | Lock acquired or reclaimed; lease written with the launch nonce; an earlier launch that died is closed | Root | Lease; `run.launched`; a synthesized `run.ended` for a dead predecessor |
| T5 | `starting` | `failed` | Lock conflict, stale sources, invalid launch contract, failed launch check | Root | Terminal record; pipeline codes 24, 23, 20, 21 |
| T6 | `running` | `paused-quota` | The quota classifier returns `quota_window` with enough confidence | Engine | Pause record; `quota.signal`; `run.paused` |
| T7 | `paused-quota` | `running` | `resumeAt` is reached, or a probe succeeds | Engine | `run.resumed`; the pause record is removed |
| T8 | `paused-quota` | `blocked-on-human` | The wait ceiling is reached | Engine, then root | `blocked`; terminal record with `paused_quota_ceiling` |
| T9 | `running` | `blocked-on-human` | A blocked reason of the table below | Engine, then root | `blocked`; `run.ended`; terminal record |
| T10 | `running` | `relaunching` | The engine exits; the relaunch classifier of the root says transient and budget remains; no `hold-relaunch` is in force | Root | `supervisor.observed`; `supervisor.relaunch` |
| T11 | `relaunching` | `running` | The backoff is over. The backoff is the one that the failed stage declares, or 0 | Root | A new `engineStartId`; counts carried |
| T12 | `relaunching` | `failed` | A `hold-relaunch` stays in force to the end of the relaunch window, which is the wall-clock deadline of the relaunch budget, or the budget is spent | Root | Terminal record; digest |
| T13 | `running`, `paused-quota`, `relaunching` | `stopping` | A stop request in the inbox, seen at a boundary; `stop --now` also signals the recorded owned process groups | Engine at boundaries; root for `--now` | The request is removed when honoured |
| T14 | `stopping` | `stopped` | The engine exits 6 | Root | `supervisor.stopped`; terminal record |
| T15 | `running` | `finished` | The last stage completes | Root | `run.ended` with the outcome `all_approved`; digest |
| T16 | `running`, `relaunching` | `failed` | A stop that is not retryable, or no relaunch budget is left. With `relaunch.owner: supervise`: any failed stage | Root | Terminal record; digest |
| T17 | `blocked-on-human`, `stopped`, `failed`, `dead` | `created` | `resume`, by the consumer or by the host skill on the consumer's request | CLI | A new launch record |
| T18 | any live state | `dead` | The owner is gone | Nobody | Derived |

### Blocked reasons

A closed set. Each ends the engine with a stop reason of §E.3 and the state `blocked-on-human`.

| Blocked reason | When | Stop reason | Engine exit | `retryable` |
|---|---|---|---|---|
| `declared-block` | The proposer declared that it needs a human, or a harness asked a question, and the no-progress breaker fired | `proposer_no_progress` | 4 | No |
| `quota-credit` | The class `quota_credit`: credit, plan or billing | `proposer_consecutive_errors` | 4 | No |
| `auth` | The class `auth` | `proposer_consecutive_errors` | 4 | No |
| `budget-cap` | A hard cap of spend was reached | `wall_budget` | 4 | No |
| `quota-wait-ceiling` | The wait ceiling of a quota pause was reached | `paused_quota_ceiling` | 4 | No |
| `source-changed` | The spec, the plan or the task list changed since launch | `critic_config` | 3 | No |
| `commit-gate` | Two consecutive blocked approval commits of one phase with the same signature (F152-FR-006), or a voided approval whose task list a human changed beyond its ticks, so the pre-tick bytes cannot be restored (F152-FR-014) | `max_rejects` | 2 | No |

### Run record

| Subject | Content |
|---|---|
| Schema id | `specstride.run-state/1` |
| Logical name | `run:<runId>:record` |
| Writer | Runtime root; the engine in start mode `standalone` |
| Readers | All |
| Content owner | 100. The operations that change it: 102. The transitions of the root: 122, 123 |

| Field | Meaning | Type in words | Required |
|---|---|---|---|
| `schema` | Schema id | Text | Yes |
| `runId`, `workspaceId`, `feature` | Identifiers and feature slug | Text | Yes |
| `state` | A state of the machine, never a derived condition | Member of a closed set | Yes |
| `stateSince` | Time of the last transition | Timestamp, UTC | Yes |
| `transition` | Number of the last transition, T1 to T17 | Text | Yes |
| `launchId`, `engineStartId` | The current launch and engine start | Text | Yes |
| `startMode` | `standalone` or `child` | Member of a closed set | Yes |
| `requestKind` | `pipeline` or `engine` | Member of a closed set | Yes |
| `productVersions` | Product version of every engine start of the run | List of text | Yes |
| `relaunchOwner` | `root` or `supervise` | Member of a closed set | Yes |
| `loop` | The pinned strategy and its named fields: `loop.strategy`, `loop.level`, `loop.manifest_hash`, and with parallel units the fields `loop.parallel.*` | Record | Yes |
| `containment` | Level in force per role, and `protection` (`prevent` or `detect`) | Record | Yes |
| `criticProof` | Result of the proof of the form of the `completion` level | Record | Yes |
| `redaction` | Version of the pattern set of the redactor | Text | Yes |
| `nativeMemory` | The setting of harness-native memory per role | Record | Yes |
| `caps` | The caps and budgets in force | Record | Yes |
| `verificationParallelism` | The parallelism of verification commands in force, when the runtime lowered it below the configured value. In start mode `child` the runtime root copies it from the field of the same name of the terminal record before the next engine start. Where the root synthesized the terminal record, it takes the value `to` of the last event `check.parallelism_lowered` of the run | Whole number | No |

- **F100-FR-141**: A run MUST be in exactly one of the ten written states of §E.2. `dead`, `stale` and `launch-abandoned` MUST be derived by readers and never written. A quota pause MUST be a state and never a stop. `blocked-on-human` MUST be a resting state: no process, the lock released, left only by `resume`.
  - test: CT-100-241

- **F100-FR-142**: The only transitions of a run MUST be T1 to T18 of §E.2, each written by the process the table names. A host MUST write no transition. The CLI MUST write only transitions into and out of `created` (T1, T2, T3, T17).
  - test: CT-100-242

- **F100-FR-143**: The run record MUST hold the fields of §E.2, among them the containment level, the result of the proof that the critic holds no tools or only read-only tools, and the version of the redaction pattern set. It MUST have one writer.
  - test: CT-100-243
  - assumption: CQ-019 (field names; the sources name the content)

- **F100-FR-144**: A run that cannot go on without the consumer MUST emit the event `blocked` with a reason from the closed set of §E.2 and what it needs, write the terminal record with the stop reason and the exit code of the table of blocked reasons, release the lock and end. It MUST NOT be relaunched by either relaunch classifier table.
  - divergence: DV-067
  - test: CT-100-244
  - assumption: CQ-020 (which existing stop reason each blocked reason ends with; the sources say "an existing stop reason" and name none except for the wait ceiling)

- **F100-FR-145**: When `resume`, or a `launch` that continues a run, finds a changed source hash, the CLI MUST refuse with exit 3, name the file, and record the refusal in the launch record (T3). Readers MUST show the run as `blocked-on-human` with the attention item `source-changed`. The event `blocked` for it MUST be written by the next process that becomes the writer of the event file, marked as synthesized.
  - divergence: DV-021; DV-082
  - parity: no check at `resume` (the check is at critic start) (row 15 of annex X §X.7)
  - test: CT-100-245
  - assumption: CQ-021 (who writes the state and the event at a refused `resume`, since the CLI is not a writer of run state or of the event file)

- **F100-FR-146**: A quota pause MUST spend no reject, no pass, no MALFORMED count, no error count, no wall-clock budget and no relaunch budget. It MUST hold while the runtime lives. It MUST have a ceiling, `pause.maxTotalMs`, that the consumer can set, with the default of 24 hours; at the ceiling the run MUST rest in `blocked-on-human` with the stop reason `paused_quota_ceiling`. After a reboot nothing relaunches by itself; `resume` enters the pause again.
  - divergence: DV-005
  - parity: not observable (row 39 of annex X §X.7)
  - test: CT-100-246

- **F100-FR-147**: The engine MUST verify the lease at every boundary at which it reads the stop request. When the owner of the lease is lost, the engine MUST finish the current pass, run no phase gate, write its terminal record with the cause `owner-lost`, the stop reason `stop_flag` and `causedBy: crash`, and exit 6.
  - test: CT-100-247
  - ep: EP-13 `specstride.lock/1` (consumes)

## §E.3 Stop-reason enumeration

Schema id `specstride.stop-reason/1`. A closed, versioned enumeration of 15 members: the 14
literals of the Specstride baseline and `paused_quota_ceiling`.

"Transient" is the attribute of the member: whether a stop with this reason may be relaunched at
all. "`retryable` in the terminal record" is the value the engine writes for one stop; it is never
true for a member that is not transient.

| # | Stop reason | Written by | Engine exit | Transient | `retryable` in the terminal record | Matched by string at the baseline |
|---|---|---|---|---|---|---|
| 1 | `stop_flag` | Engine; pass loop during the wait of a yield | 6 | No | false | No |
| 2 | `wall_budget` | Engine | 4 | Yes | true, except false when the stop is blocked on a human (`budget-cap`) | Yes |
| 3 | `proposer_max_iter` | Engine. The result 4 of the pass loop writes no line of its own | 4 | No | false | No |
| 4 | `proposer_no_progress` | Engine; pass loop | 4 | No | false | No |
| 5 | `proposer_consecutive_errors` | Engine; pass loop | 4 | Yes, for failure classes that are not quota | true for the classes `agent_failure`, `provider_other`, and `overload` after its cap; false when blocked on a human (`quota-credit`, `auth`) | Yes |
| 6 | `proposer_yield_budget` | Engine; pass loop | 4 | No | false | No |
| 7 | `proposer_yield_timeout` | Pass loop only. The engine records member 6 for the same stop | 4 | No | false | No |
| 8 | `proposer_cap_exhausted` | Engine; pass loop | 4 | No | false | No |
| 9 | `proposer_no_evidence` | Engine | 1 | No | false | No |
| 10 | `critic_config` | Engine | 3 | No | false | No |
| 11 | `critic_unavailable` | Engine | 1 | No | false | No |
| 12 | `gate_oscillation` | Engine | 2 | No | false | No |
| 13 | `max_rejects` | Engine | 2 | No | false | No |
| 14 | `release_verification` | Engine | 2 | No | false | No |
| 15 | `paused_quota_ceiling` | Engine | 4 | No | false | — (new) |

Not members, and never to be added as members: a quota pause (a run state); `blocked` (an event);
outcomes of the micro-loop layer and of parallel units (they switch a layer off); integrity events
(reported to the critic, no halt); the two extra reasons that Lisa emits.

- **F100-FR-148**: The stop reasons of the product MUST be exactly the 15 members of §E.3, each with its engine exit code and its attribute `transient`. The terminal record MUST carry one of them on every exit that has a member in the column "Stop reasons" of the engine table of §E.4. On an exit that has none (0, 5, 70, and the causes of 1 and 3 without a member) the field MUST be null, `retryable` MUST be false, and an as-is stop line MUST NOT be written. A reader that finds another value MUST treat the stop as not retryable and report it.
  - test: CT-100-248
  - assumption: CQ-174

- **F100-FR-149**: The compatibility projection MUST keep writing the as-is stop line with the as-is literal for every member 1 to 14. Where the engine and the pass loop both write a reason for one stop, the projection MUST hold two lines with different fields, the engine's line being the newer one, and the line of the pass loop MUST carry the as-is iteration field. The only outcome literal of the as-is end line MUST be `all_approved`. The four literals that learning reads as arbitration signals (`max_rejects`, `gate_oscillation`, `critic_config`, `proposer_no_progress`) MUST keep their meaning.
  - divergence: DV-007
  - parity: on (the projection is compared) (row 17 of annex X §X.7)
  - test: CT-100-249

- **F100-FR-150**: The closed families that are not stop reasons MUST be kept with their as-is literals, each listed in annex X §X.6: the kill reasons of the watchdogs with their class (`idle_timeout`: hang; `repeat_stall`, `progress_stall`: futility; `hard_cap`: budget); the stage reasons, transient (`exit`, `timeout`, `recovery-deadline`, `recovery-exhausted`) and deliberate (`postcondition`, `stage-precondition`, `setup-required`, `interrupted`, `existing-prerequisite`, `completed`, and `exec-error:` with a detail); the pipeline exit reasons (`preflight`, `all-stages-complete`, or a stage reason); the refusals of the launch checks; the relaunch refusals and the approval `classified-transient`.
  - test: CT-100-250

## §E.4 Exit codes and result records of the engine

Codes are per process. The same number means different things in different processes, and a
caller must always know which process it called. The stop reason, not the code, tells the causes
inside one code apart.

### Engine

The engine is a process: `specstride run` in the foreground, `resume` in the foreground, and the
engine child of the runtime root.

| Code | Meaning | Stop reasons |
|---|---|---|
| 0 | Every phase approved, in this run or before it, and release verification passed or not required | — |
| 1 | Internal error (no member); the working directory cannot be entered (no member); the MALFORMED limit reached (`critic_unavailable`); the proposer ended without phase evidence on a status that has no mapping (`proposer_no_evidence`) | `critic_unavailable`, `proposer_no_evidence` |
| 2 | Rejects exceeded (`max_rejects`); oscillation (`gate_oscillation`); release verification failed (`release_verification`) | `max_rejects`, `gate_oscillation`, `release_verification` |
| 3 | Invalid spec, configuration or argument (no member); the preflight of verification failed (no member); a configuration error of the critic (`critic_config`); a changed source (`critic_config`, the blocked reason `source-changed` of §E.2) | `critic_config` |
| 4 | Wall-clock budget; the results 4, 7, 8, 9, 10 of the pass loop; the wait ceiling of a quota pause | `wall_budget`, `proposer_max_iter`, `proposer_consecutive_errors`, `proposer_no_progress`, `proposer_yield_budget`, `proposer_yield_timeout`, `proposer_cap_exhausted`, `paused_quota_ceiling` |
| 5 | The workspace lock is held (start mode `standalone`) | — |
| 6 | Stop request, or the result 6 of the pass loop; the owner of the lease was lost | `stop_flag` |
| 70 | An uncaught error | — |

The mapping from the result of the pass loop applies only when phase evidence is absent. With
phase evidence present, every result of the pass loop except 6 is ignored. The member in
parentheses after a cause is the stop reason that cause carries; "no member" means that the
terminal record holds null (F100-FR-148). The pairing is the baseline's (`consolidation.md`
section 3, B-0150, B-0152) and adds only the changed source (ruling K3).

### Pass loop (result record; not a process)

| `exit_code` | Meaning |
|---|---|
| 0 | Phase evidence exists |
| 1 | Usage or set-up failure |
| 3 | Invalid overlay declaration or scope, passed through; a stop before a pass because a source changed, with the field `blocked` set to `source-changed` |
| 4 | Pass limit; a plugin was installed on the final pass |
| 6 | Stop request |
| 7 | Consecutive errors; a plugin request was refused or failed. Quota classes do not count |
| 8 | Consecutive passes without progress |
| 9 | Yield limit, yield deadline, or the wall clock spent during a yield |
| 10 | Consecutive kills at the ceiling of a pass |
| 130, 143 | Interrupt, termination; only with an overlay of scope `attempt` |
| 124 (status of a pass) | Any kill of one pass by a watchdog. Kept in the record of the pass |
| 127 (status of a pass) | The command of the harness was not found. The loop goes on until a breaker ends it. Kept in the record of the pass |

### Critic call (result record; not a process)

| `exit_code` | `result` | Meaning |
|---|---|---|
| 0 | `approved` | APPROVED. Always 0 in the mode of the diagnostician |
| 1 | `error` | Uncaught error |
| 2 | `usage` | Usage error |
| 3 | `config_error` | Missing spec, invalid format, phase not found, invalid plan, phase evidence missing |
| 10 | `rejected` or `malformed` | REJECTED and MALFORMED alike |

### Verification gate (result record inside the engine; a process as the public command `verify`)

| `exit_code` | Meaning |
|---|---|
| 0 | Success; the verification gate passed; every command staged before passed |
| 3 | Any verification error |
| 10 | The verification gate failed |
| 11 | A command staged before failed; for information |

The failure summary of verification: 0, and 2 on wrong usage. Inside the engine every `exit_code` of the verification gate other than 0 is a failed verification gate: the phase attempt is a rejection with the result code 10 of the critic's table, the critic is not called, and the rejection counts toward the reject limit; the event of the failure carries the code of the verification gate itself, 3 or 10 (F105-FR-005, as at the baseline, B-0320). The code 11 is never a result of the verification gate of a phase attempt; it belongs to the step of commands staged before, for information.

### Internal helpers (result records)

| Component | Values kept in its result record |
|---|---|
| Overlay handling | 0, 1, 3 |
| Plugin requests of one harness | 0, 2 |
| Stream tap, exporters, presenter, banner, failure ledger | 0 on every path of a run; they never break the loop |

- **F100-FR-151**: The engine MUST exit with exactly the codes of the table "Engine" of §E.4, and every cause of a halt MUST map to exactly one code. The mapping from the result of the pass loop MUST apply only when phase evidence is absent.
  - origin: 028 SC-003
  - disposition: merged-with 002 SC-004
  - test: PT-100-028SC003-*

- **F100-FR-152**: Every termination of a run MUST map to exactly one of the seven codes 0 to 6 of the engine, with the meanings done 0, internal 1, rejects 2, spec 3, budget 4, lock 5, stop 6, which is the vocabulary that the Specstride baseline and Lisa share. Code 70 is for an uncaught error of a command and is not a termination of a run.
  - origin: 002 FR-015; 002 SC-004
  - disposition: merged-with 028 SC-003
  - test: CT-100-1; CT-100-2

- **F100-FR-153**: The pass loop, the critic call, the verification gate inside the engine and the internal helpers MUST return result records whose `exit_code` carries the numbers of §E.4. Where the baseline prints such a number, compatibility output MUST print the same number.
  - test: CT-100-253

- **F100-FR-154**: The engine MUST have two start modes. In `standalone` it takes the workspace lock, writes the lease and the run record, and owns the transitions of the root. In `child` it verifies the lease handed down by the root and never takes a lock. The executable of the engine MUST be resolved at launch and pinned by path and hash in the launch record, from a configuration key whose default is the product's own entry.
  - test: CT-100-254
  - parity: the oracle sets the key to its engine stub where a fixture needs one (row 41 of annex X §X.7)
