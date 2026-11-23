# Annex F — Runtime root (L5)

Part of the specification of feature `100-specstride`. Normative.

This annex holds the process model of a run, the two kinds of run request, the handshake of a
launch, the owner of relaunch, the exit codes of the runtime root, and the interfaces of three
extension points (EP-13, EP-17, EP-19). The common rules of annex A §A.4 hold for every point.

How to cite: "annex F, §F.3 Handshake, F100-FR-160".

## §F.1 Process model

| Process | Started by | Lifetime | Class in the process registry |
|---|---|---|---|
| CLI command | The consumer or a host | Short. `launch` exits after the handshake | — |
| Runtime root | The detach strategy, once per launch | The leader of a process session of its own; lives until the run rests or ends | — |
| Stage child (stage kinds `setup`, `command`, `smoke`) | Runtime root | One stage attempt | `owned` |
| Engine (stage kind `specstride`, or a run request of kind `engine`) | Runtime root; or the consumer in the foreground | One engine start; one at a time per workspace | `owned` |
| Harness process, one per pass or critic-class call | Engine | One call; in a process group of its own | `owned` |
| Check command | Engine | One command; in a process group of its own | `owned` |
| Detached job of a yield | Engine | Outlives the pass; in a process session of its own | `adoptable` |
| Worker pass of a parallel group | Engine | One worker pass; in a process group of its own | `owned` |

- **F100-FR-155**: A run MUST be a detached tree of processes as in §F.1: one runtime root per launch, and the engine as its child. The root MUST NOT be connected to the host after the handshake: no pipe, no socket the host must keep, no parent that waits. A run MUST NOT depend on a host hook, a monitor or a host process.
  - divergence: DV-074
  - test: CT-100-255
  - status: unverified (check: the spike starts the root from the host's shell tool in an interactive session and in headless mode, with the shell sandbox off and on, on Linux and macOS, ends the session, and confirms that the root lives; verified-on: —; pin: host versions of the spike)

- **F100-FR-156**: There MUST be one lock per workspace, taken by the runtime root and handed down to the engine as a lease; a child MUST never take a second lock. A second pipeline on a held workspace MUST end with the pipeline code 24 at launch. A foreground `specstride run` on a held workspace MUST end with the engine code 5.
  - divergence: DV-075; DV-022
  - test: CT-100-256
  - ep: EP-13 `specstride.lock/1` (consumes)

- **F100-FR-157**: The launcher MUST be a file the operator can see and run, whose only job is to call the pipeline entry with the hash of the launch bundle. The runtime root MUST verify the hash of the launch bundle and the launcher's own hash at launch and at every relaunch, and MUST refuse an edited launcher.
  - divergence: DV-054; DV-008
  - test: CT-100-257

- **F100-FR-158**: When the engine ends with a code outside 0 to 6, or by a signal, the runtime root MUST write a synthesized terminal record with the cause `crash`, end every `owned` process, and consult its relaunch classifier. When the runtime root itself dies, or the machine reboots, a relaunch MUST NOT happen by itself in Wave 1: the run reads as `dead`, and `resume` reclaims the lock, closes the dead launch with a synthesized end event, and continues at the first phase without a valid approval record. When the owner is dead and an `owned` process group is alive, `resume` MUST refuse and name the survivors.
  - test: CT-100-258

## §F.2 Run requests

| Kind | What it is | Produced by | Has a launch contract and stages |
|---|---|---|---|
| `pipeline` | A promoted launch contract | The host skill `specstride-run`; `launch` | Yes |
| `engine` | One engine start with its arguments | The host skill `specstride-reverse`; `specstride run --detach` | No |

- **F100-FR-159**: The runtime root MUST accept exactly the two kinds of run request of §F.2. A request of kind `engine` MUST have the same lock, lease, relaunch classifier and digest as one of kind `pipeline`, and no launch contract to validate.
  - test: CT-100-259

## §F.3 Handshake

| Step | Actor | Act |
|---|---|---|
| 1 | CLI | Resolves the run request, runs the launch checks (the launch-blocking subset of the doctor's checks), writes the launch record with a fresh launch nonce |
| 2 | CLI | Calls the detach strategy |
| 3 | Runtime root | Takes the workspace lock; writes the lease with the launch nonce; emits `run.launched` |
| 4 | CLI | Waits for a lease with its nonce, for a bounded time and no longer; records the outcome in the launch record; prints one line; exits |

Outcomes are a closed set:

| Outcome | Meaning | The CLI prints | Exit of `launch` |
|---|---|---|---|
| `started` | A lease with the nonce of this launch exists | The launch line with the run and its state | 0 |
| `attached` | Another launch holds the lease of a live run | The run that lives | 4 (the supervisor's code for the launch decision `attach`) |
| `refused` | A launch check failed, the lock is in conflict, or no lease appeared in time | The refusal with its reason | 4 (the supervisor's refusal code) for every refusal of the closed set of annex X §X.6 row 212, except `lock-conflict` and `lock-unknown`, which give 24; the pipeline code 20, 21 or 23 where the refusal is one of the pipeline's; 3 for a refusal of role resolution in the foreground `run` |

- **F100-FR-160**: A launch MUST follow the four steps of §F.3 and MUST end in exactly one of the outcomes `started`, `attached`, `refused`. Readiness MUST be confirmed by the lease that carries the launch nonce, whatever the detach strategy. An unanswered launch MUST be closed as `launch-abandoned` by the next launch.
  - test: CT-100-260
  - ep: EP-17 `specstride.detach/1` (consumes)

- **F100-FR-161**: Re-attachment MUST be reading only. A new host session MUST learn of a run through `status` or through a host hook shim that prints a precomputed status line. The line MUST carry `validUntil`, which is `none`, without expiry, for a run that rests and has no lease; when a time is given and has passed the shim MUST print that the state is unknown and name the command `status`.
  - test: CT-100-261
  - ep: EP-09 `specstride.view/1` (consumes)
  - assumption: CQ-163

## §F.4 Who relaunches

| `relaunch.owner` | Behaviour | Where |
|---|---|---|
| `root` (default) | After a failed stage the runtime root stays alive and consults the second relaunch classifier table, which has a row for a crashed engine. The inbox accepts `hold-relaunch`. The as-is relaunch line is projected from the root's event | Normal runs |
| `supervise` | At a failed stage the runtime root exits with the pipeline code. `specstride supervise observe` classifies and relaunches as at the baseline, with every named refusal, and prints the as-is relaunch line | The `parity` profile; consumers who want supervision by the host |

- **F100-FR-162**: `relaunch.owner` MUST be ordinary configuration with the values `root` and `supervise` and the default `root`. Both relaunch classifier tables MUST be pure tables evaluated by the table evaluator. A relaunch MUST always start a fresh session and MUST carry counts and ids from the ledger.
  - divergence: DV-074
  - parity: `supervise` (row 14 of annex X §X.7)
  - test: CT-100-262

- **F100-FR-163**: Each relaunch classifier table MUST NOT relaunch a run whose terminal record says `retryable: false`, a run in `blocked-on-human`, a run that was stopped on request, or a run while `hold-relaunch` is in force. A quota pause MUST give the classifier nothing to classify. A run in `blocked-on-human` MUST NOT be relaunched under any profile, the `parity` profile included: the row of table 1 (`relaunch-observe`, feature 123) that refuses it, O-33, is active under every profile. Under the `parity` profile only the row of table 1 that refuses a stop with `retryable: false`, O-34, is inactive (row 132 of annex X §X.7; DV-114): there table 1 classifies a stopped launcher that is not blocked as the baseline does, from the listed exit codes and the allowed stop reasons only.
  - divergence: DV-114
  - parity: table 1 reads the blocked reason (row O-33) and does not read `retryable` (row O-34 inactive; row 132 of annex X §X.7)
  - test: CT-100-263
  - assumption: CQ-238 (answered by the owner on 2026-09-30: the row of table 1 that refuses a blocked run is active under every profile; register row DV-114 covers the row that refuses a stop that is not retryable only)

## §F.5 EP-13 Lock and liveness provider

#### Id and version
`specstride.lock/1`.

#### Purpose
To make sure that one run at a time works in a workspace, and to tell a live owner from a dead one.

#### Caller and time
The runtime root (the engine in start mode `standalone`) at launch, at a heartbeat, at the end.
The engine at every boundary (`verify`). The CLI and the doctor (`probe`). `resume` (`reclaim`).

#### Inputs
`acquire`: the scope (the workspace) and the owner record of annex B §B.9. `heartbeat`,
`release`: the lease. `probe`, `reclaim`: the scope. `handDown`: the lease. `verify`: a token.

#### Outputs
`acquire`: a lease, or a conflict that names the holder. `probe`: one of the closed set `free`,
`held-live`, `held-foreign`, `stale-owner-dead`, `owner-dead-group-alive`, `unknown`. `reclaim`:
a lease, or `lost-race`. `handDown`: a token for a child. `verify`: whether the parent still
holds the lease.

#### Errors
`conflict` (engine code 5, pipeline code 24); `foreign-owner`, which is never reclaimed
automatically; `unknown`, which counts as held.

#### Guarantees of the core
One run per workspace. The scope is the workspace. A lease is handed down, so a child never takes
a second lock. `owner-dead-group-alive` refuses a start and names the survivors; `adoptable`
processes never cause it. A signal is sent only when pid, start time and run token all match. The
provider in use is recorded in the workspace record; a different provider refuses.

#### Guarantees of an implementation
Exclusion is atomic. A lock never exists without its owner record. Reclaim is atomic and never a
removal followed by a creation. Liveness rests on something the kernel releases when the owner
dies. Behaviour is the same on Linux and macOS. No component is compiled at install.

#### Failure of an implementation
A provider that fails in `acquire` or `probe` gives `unknown`, which counts as held: the launch is
refused with exit 5 or 24. A provider that fails in `verify` makes the engine treat the owner as
lost.

#### Unknown-value rule
An unknown result of `probe` is read as `unknown`. An owner record with an unknown field is
accepted; one that lacks a required field is `unknown`.

#### Wave 1 implementations
One provider: a directory lock with the owner record renamed into place, reclaim by rename, and
liveness backed by the kernel through something the runtime platform ships.

#### Content owner
122.

#### Proving test
Provider conformance: 8 contenders over 300 rounds give exactly one winner in every round; the
owner killed without warning; the owner dead with a live child; a reused pid after a changed boot
identity; a foreign host name. A sample provider that keeps locks in memory is registered from the
test tree.

- **F100-FR-164**: The lock and liveness provider MUST offer `acquire`, `heartbeat`, `release`, `probe`, `reclaim`, `handDown` and `verify` with the results and errors of §F.5. A foreign owner MUST never be reclaimed automatically. The as-is lock fallback that was never released MUST NOT be carried.
  - divergence: DV-022
  - test: CT-100-264
  - ep: EP-13 `specstride.lock/1` (implements)
  - status: unverified (check: the provider's conformance suite on macOS; verified-on: —; pin: —)

## §F.6 EP-17 Detach strategy

#### Id and version
`specstride.detach/1`.

#### Purpose
To start the runtime root so that it outlives the process that started it.

#### Caller and time
The CLI, once per launch (step 2 of the handshake).

#### Inputs
`available`: nothing. `start`: the entry of the runtime, the environment allow-list, the logical
name of the runtime log, the launch nonce. `describe`: nothing.

#### Outputs
`available`: yes or no, with the reason. `start`: the identity of the started process.
`describe`: the id of the strategy and what it survives (the end of the parent, the end of the
host session, a reboot).

#### Errors
`unavailable`; `not-ready`, when the handshake does not complete in time.

#### Guarantees of the core
Whatever the strategy, readiness is confirmed by the lease that carries the launch nonce. The CLI
waits for the handshake and no longer. The strategy in use is in the launch record and in the
doctor's output.

#### Guarantees of an implementation
The started process has standard input closed and its output on the runtime log, runs with the
environment allow-list, and is the leader of a process session of its own (except `foreground`).

#### Failure of an implementation
A strategy that is `unavailable` or `not-ready` refuses the launch with the outcome `refused`;
the message names the strategy `foreground` as the way to run without detaching.

#### Unknown-value rule
An unknown strategy id in configuration is a configuration error (exit 3).

#### Wave 1 implementations
`spawn-detached` (the default); `foreground` (the consumer starts the runtime root in a terminal
of their own). A strategy that survives a reboot is not part of Wave 1.

#### Content owner
122.

#### Proving test
Strategy conformance: start; end the parent; confirm that the child lives and that the lease is
valid; then the same with the parent killed by a signal. A sample strategy is registered from the
test tree.

- **F100-FR-165**: A detach strategy MUST offer `available`, `start` and `describe` as in §F.6. The product MUST work with the strategy `foreground` wherever `spawn-detached` does not survive the end of a host session.
  - test: CT-100-265
  - ep: EP-17 `specstride.detach/1` (implements)
  - status: unverified (check: the spike of the detached runtime, as in F100-FR-155; verified-on: —; pin: —)

## §F.7 EP-19 Stage kind and precondition check

#### Id and version
`specstride.stage-kind/1`. Two registries: stage kinds and precondition checks.

#### Purpose
To let a launch contract name a kind of stage and a kind of check by id, so that a new kind needs
no change of the schema of the launch contract, of its validator or of the stage executor.

#### Caller and time
Validation of a launch contract (`validate`); the pipeline stage executor of the runtime root
(`run`, `evaluate`); the dry run of the pipeline entry (`evaluate` in read-only form).

#### Inputs
Stage kind, `validate`: the stage as the launch contract declares it. Stage kind, `run`: the
stage, the flags of the launch (`implement`, `smoke`), the environment after the pins of the
launch contract were applied, the time limit. Precondition check, `evaluate`: the check as
declared, its timing (`preflight` or `stage`), and whether the evaluation is a dry run.

#### Outputs
`validate`: findings. `run`: the exit code of the child, a stage reason from the closed families
of annex E §E.3, and the digest evidence path. `evaluate`: `pass`, `fail` or `deferred`.

#### Errors
A stage kind or a check that the registries do not hold makes the launch contract invalid
(pipeline code 20).

#### Guarantees of the core
The stage executor runs stages in the declared order, one at a time; applies the in-stage retry
policy of the launch contract; reads the outcome of a stage of kind `specstride` from the
terminal record of the engine; strips the pinned keys of the launch contract from the environment
of every child. A stage whose child exits 6 ends the pipeline with code 22 and the state
`stopped`.

#### Guarantees of an implementation
A stage kind runs a fixed argument list without a shell. A precondition check reads and never
writes; in a dry run it executes nothing and reports `deferred` where it would have to execute.

#### Failure of an implementation
A stage kind that throws ends the stage with the stage reason `exec-error:` and its detail. A
check that throws is `fail`.

#### Unknown-value rule
An unknown stage kind and an unknown check type each make the launch contract invalid. The as-is
legacy spelling of the stage kind `specstride` is not accepted.

#### Wave 1 implementations
Stage kinds: `setup`, `decision`, `command`, `specstride`, `smoke`. Precondition checks:
`file_exists`, `dir_exists`, `env_set`, `command_available`, `command_success`,
`json_field_equals`.

#### Content owner
123.

#### Proving test
Registry conformance: a sample stage kind and a sample check registered from the test tree are
validated, shown by the dry run and executed, with no change to the schema of the launch contract
or to the stage executor.

- **F100-FR-166**: Stage kinds and precondition checks MUST be registries with the five and the six built-in entries of §F.7. The schema of the launch contract MUST name a kind by id and MUST NOT hold a closed list of kinds.
  - divergence: DV-038
  - test: CT-100-266
  - ep: EP-19 `specstride.stage-kind/1` (implements)
  - assumption: CQ-022 (the names of the operations `validate`, `run` and `evaluate`; the sources give the two registries and their built-in entries only)

- **F100-FR-167**: A key that the launch contract pins MUST take the value of the launch contract in every child of the runtime root, and the value from the shell MUST be stripped. This MUST apply to the learning mode, to the bound of learning decisions, and to live output in a run without a terminal, and to no other key.
  - divergence: DV-026
  - parity: as at the baseline (the two as-is keys only) (rows 38, 43 of annex X §X.7)
  - test: CT-100-267
  - ep: EP-19 `specstride.stage-kind/1` (consumes)

## §F.8 Exit codes of the runtime root and the pipeline entry

The runtime root and the pipeline entry in the foreground are processes.

| Code | Meaning |
|---|---|
| 0 | Every stage complete, or a dry run |
| 2 | Usage error |
| 20 | The launch contract is invalid at start |
| 21 | A launch check of the pipeline (preflight) failed |
| 22 | A stage failed; also when the child exited 6 and the state is `stopped` |
| 23 | Stale sources |
| 24 | The lock is held |
| 128+N | Ended by the signal N (interrupt, termination, hang-up) |

Status of a stage child, kept in the record of the stage: 124 on a timeout, 127 when the action
cannot start.

- **F100-FR-168**: The runtime root and the pipeline entry MUST exit with exactly the codes of §F.8. Each class of failure of the launcher MUST map to one distinct code: 20 invalid, 21 preflight, 22 stage, 23 stale, 24 lock.
  - origin: 011 SC-004
  - disposition: ported
  - test: PT-100-011SC004-*

- **F100-FR-169**: With `relaunch.owner: root` the runtime root stays alive after a failed stage, so the code 22 MUST be the code with which the root finally exits when it does not relaunch, and the pipeline state and the digest MUST show the same values as with `supervise`.
  - divergence: DV-074
  - parity: `supervise` (the root exits at the failed stage) (row 14 of annex X §X.7)
  - test: CT-100-269
