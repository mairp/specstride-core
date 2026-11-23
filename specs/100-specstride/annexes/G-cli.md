# Annex G — CLI (L6)

Part of the specification of feature `100-specstride`. Normative.

This annex holds the CLI protocol, the two output modes, the grammar of output lines, the exit
codes of every command, the interfaces of two extension points (EP-09, EP-14), and the schemas of
the launch contract, of the doctor's findings and of the judgment exchange. The tables of §G.4 are
the interface contract: no feature needs another document to find a code.

How to cite: "annex G, §G.4 Exit codes per command, F100-FR-183".

## §G.1 CLI protocol, version 1

The CLI protocol is what a host calls. It is one half of EP-01; the other half, the
host package contract, is in annex H.

| Part | Content |
|---|---|
| Protocol integer | 1. Printed by `specstride --protocol` and by nothing else in that call |
| Input | An argument list. Standard input only where a command says so. A host never passes repository text as an argument, except the consumer's comment, verbatim |
| Output | The exit code, and lines on standard output and standard error in one of the two output modes of §G.2. Structured output on request, by `--json` |
| Every fact a host needs | Is a line of a command, or a field of its `--json` output. A host reads no file of the product |

Commands of protocol 1. "Owner" is the feature that specifies the command; each command's lines
belong to its owner.

| Command | What it does | Owner |
|---|---|---|
| `--protocol` | Prints the protocol integer | 100 |
| `run` | Runs the engine in the foreground (start mode `standalone`); with `--detach` it makes a run request of kind `engine`. It continues an unfinished run of the feature and takes `--new-run` and `--reset-counts`, as `launch` does. It takes the ported flags of the baseline, among them `--telemetry`, `--loki-url`, `--otel`, `--otel-url` and `-j`; their keys and the rule that combines them are §K.10 of feature 110 | 101; detaching: 122; continuation: 102; telemetry flags: 128 |
| `launch` | Runs the launch checks, writes the launch record, starts the runtime root, waits for the handshake. `--dry-run` withholds the launch. `--new-run` starts a new run | 107; the handshake: 122 |
| `resume` | Continues a run from the records on disk. `--reset-counts` resets counts. `--accept-source-change` accepts an intended change of spec, plan or task list. `--resolve-roles` asks for a new resolution of roles, on `resume` and on `launch`. A run that was launched through the runtime root is continued through the runtime root | 102; `--resolve-roles`: 124 |
| `stop` | Writes the stop request. `--now` ends owned processes. `--jobs` also ends adoptable jobs | 102 |
| `status` | Prints the state of the run from the read model: text, `--line`, `--json` | 129; compatibility output: 119 |
| `wait` | With `--until-change`: prints nothing while nothing changes; prints and takes the cursor | 129 |
| `tail`, `events`, `verdicts`, `feedback`, `phases`, `watch` | Inspection commands, each with a byte cap | 119 |
| `learn` | Learning: show, advise, apply, revert, evaluate | 106 |
| `spec` | The spec module as a public command | 104 |
| `verify` | The verification plan and the verification gate as a public command | 105 |
| `reverse`, with `reverse plan`, `reverse lint`, `reverse guard`, `reverse inventory` | Reverse specification. `--detach` makes a run request of kind `engine`; `--comment` takes the consumer's comment | 108; lint and inventory: 140 |
| The launch-contract commands: derive (with the judgment exchange of §G.9), validate, promote, render | From sources to a promoted launch contract and a launcher. The spelling of the commands is the owner's | 107 |
| `pipeline run` | The pipeline entry in the foreground. `--dry-run` prints the plan | 123 |
| `supervise` with its verbs | Readers of a run, and `relaunch` with `relaunch.owner: supervise`. `supervise hold` and `supervise release` write and lift the inbox request `hold-relaunch` | 123 |
| `host event` | Writes an inbox request of type `host-event` on behalf of a host | 113 for the caller; 122 for the inbox |
| `doctor` | Runs the registered checks. With the launch checks only, it evaluates them without launching, for a host hook | 112 |
| `state export`, `state import`, `state adopt` | Move or take over the control plane of a feature | 122 |
| `harness verify` | Runs the conformance suite on a harness, on request, inside a budget that is an argument of the command. The command belongs to 109; the state of the harness that results belongs to 146. The registry queries of the baseline are internal operations with result records and are no commands | 109 |
| `config show`, `config schema` | The resolved configuration with its sources; the schema | 110 |
| `tripwire clear` | Clears the tripwire | 115 |

- **F100-FR-170**: The CLI MUST implement protocol 1 of §G.1 and MUST print the integer 1, and nothing else, for `specstride --protocol`. A host package MUST compare the integer with the range it supports and MUST refuse a mismatch with one line that names the doctor. A change that removes or renames a command, a flag, a line or a field of `--json` output MUST raise the integer.
  - test: CT-100-270
  - ep: EP-01 `specstride.host/1` (implements)

- **F100-FR-171**: Of the module entry points of the Specstride baseline, exactly three MUST be public commands, with the exit codes of the baseline: `spec`, `verify` and `learn`. The pass loop and the critic MUST NOT be commands; their codes are fields of result records (annex E §E.4).
  - divergence: DV-066
  - test: CT-100-271

- **F100-FR-172**: Every command that prints facts MUST offer `--json`. Its output MUST be one record with a `schema` field (in compatibility output `events --json` prints one record per line, as the baseline does), in a stable order of keys, without escape sequences for colour, and without a secret value, an account identifier or a token. `--json` and `--verbose` MUST be opt-in.
  - test: CT-100-272

- **F100-FR-173**: `resume` MUST accept a flag by which the consumer accepts an intended change of spec, plan or task list. With the flag, `resume` MUST derive the verification plan and the check manifest again, record the new hashes in the run snapshot, keep the counts and the phase evidence of phases already delivered, and emit an event that every critic of the run receives as a fact. Without the flag, `resume` MUST refuse with exit 3 and name the changed file. The flag MUST be spelled `--accept-source-change`.
  - divergence: DV-091
  - parity: not used (row 15 of annex X §X.7)
  - test: CT-100-273
  - assumption: CQ-017 (the name of the flag; ruling P12 leaves it to be settled)

- **F100-FR-174**: A command MUST NOT have a flag that switches off a launch check, the terms gate or a budget cap. The consumer's comment MUST only select among options that validation of the launch contract accepts. Anything that widens scope or spend MUST need a flag or a configuration key set by the consumer, and MUST never be inferred from text.
  - test: CT-100-274

## §G.2 Output modes

| Mode | What it prints | When |
|---|---|---|
| Default output | Terse lines: one line for a success; for a failure the failing items only, each with its fix; nothing for an unchanged state; paths relative to the root of the repository and only once. Renamed product lines carry the prefix `[SPECSTRIDE-` | Always, unless compatibility output is selected |
| Compatibility output | The lines of the baselines byte for byte, artefacts of the old languages included, and no other line | Selected by configuration (`output.compat`); always under the `parity` profile |

- **F100-FR-175**: The CLI MUST have exactly the two output modes of §G.2. Compatibility output MUST reproduce every as-is line byte for byte, including the literal for an absent child exit code, the quoting of the old language in the relaunch line, and the hold line on every unchanged poll.
  - divergence: DV-033; DV-070
  - parity: compatibility output (row 18 of annex X §X.7)
  - test: CT-100-275

- **F100-FR-176**: A line that has no as-is equivalent MUST never be written to a stream that the oracle compares with the reference. Under the `parity` profile the product MUST print no such line on any stream. Outside it, a new line MUST be printed only when the feature it belongs to is on.
  - divergence: DV-034
  - parity: no new line (row 19 of annex X §X.7)
  - test: CT-100-276

- **F100-FR-177**: Text from outside the runtime (feedback of the critic, names of tests, messages of a harness) MUST never be echoed into default output. Default output MUST refer to it by logical name. Every message that names state MUST name it by logical name; a message that at the baseline carried a physical path of state is compared through the layout table.
  - test: CT-100-277

## §G.3 Line grammar

A labelled line has the form: an opening square bracket, a label, a closing square bracket, one
space, a body, the end of the line. A label is made of upper-case letters, digits and hyphens.

| Family | Label | Body | Printed by | Stream |
|---|---|---|---|---|
| Runtime lines | `WARN`, `STALE`, `INVALID`, `DRY-RUN`, `PREFLIGHT`, `SKIP`, `CHECK`, `PLAN`, `BLOCKED`, `READY`, `RUN`, `PASS`, `ERROR`, `RECOVER`, `FAIL`, `RESUME` | A message | The pipeline entry and the runtime root | Standard output; `WARN`, `STALE`, `INVALID` on standard error |
| Digest | `DIGEST` | `state=<state> exit=<whole number> last-stage=<id or none>`, then `child-exit=<code>` only on a failed or stopped stage, then `evidence=<digest evidence path or none>` | The pipeline entry and the runtime root | Standard output; with `STALE` or `INVALID` on standard error. It is the final line of every run |
| Supervisor lines | `MOL-MODE`, `MOL-LEARNING`, `MOL-LAUNCHER`, `MOL-GATE`, `MOL-LAUNCH`, `MOL-STATE`, `MOL-HOLD`, `MOL-RELAUNCH`, `MOL-DIGEST`, `MOL-REFUSE`, `MOL-ANOMALY`, `MOL-NEXT`, `MOL-STOP`, `MOL-RETRO` | Pairs `key=value` separated by one space. A text value is quoted as in JSON | `supervise`; with `relaunch.owner: root` the compatibility projection of the root's events | Standard output |
| Loop line | `LOOP` | Pairs `key=value` separated by one space. With the layer on: `strategy`, `level`, `containment`, `protection`, `units`, `pass`, `fail`, `unchecked`, `tainted`, `cycles`, `disengaged`, `escalations`, `failfast-stops`, `fallback`. The value of `protection` is `prevent`, `detect`, or `detect,basic` where only the basic protection holds. With the layer off: `strategy=classic reason=<reason>`. Only with parallel units on, also: `parallel`, `workers`, `groups`, `group-failures`, `refused`, `worker-caches`, `wall-hours`, `agent-hours`, and the fallback reason | The engine, before the digest | Standard output, default output only |
| Product lines | A label that starts with `SPECSTRIDE-` | Pairs `key=value` separated by one space. A text value is quoted as in JSON | Any command, in default output | Standard output |
| Status line | None | Pairs `key=value` separated by one space, starting with `run=` and `st=`; with `validUntil=` where it is precomputed | `status --line`; the host hook shim | Standard output |
| Engine and front-door lines | As at the Specstride baseline | As at the baseline. A prefix that named an implementation file is replaced by a logical component name | The engine, the front door | As at the baseline |

Keys of the supervisor lines:

| Line | Keys |
|---|---|
| `[MOL-MODE]` | `mode`, `source`, `evidence`, `flags` |
| `[MOL-LEARNING]` | `mode`, `source`, `evidence` |
| `[MOL-LAUNCHER]` | `launcher`, `source` |
| `[MOL-GATE]` with `check=` | `check`, `status` (`pass`, `fail`, `not-evaluated`), optional `reason`, `detail` |
| `[MOL-GATE]` with `decision=` | `decision` (`launch`, `refuse`, `attach`), optional `reason`, `detail`, `next` |
| `[MOL-LAUNCH]` | `pipeline`, `mode`, `launcher`, `run-dir`, `stages`, `flags`, `relaunch-budget`, `wall-clock-ceiling`, `pid`, `stop` |
| `[MOL-STATE]` | `pipeline`, `stage`, `id`, `state`, `stage-elapsed`, `total-elapsed`, optional `detail` |
| `[MOL-HOLD]` | `pipeline`, `unchanged`, `stage`, `id`, `state`, `total-elapsed` |
| `[MOL-RELAUNCH]` | `pipeline`, `attempt`, `reason`, `exit`, `child-exit`, `stage`, `stop-reason`, `budget-remaining`, `detail` |
| `[MOL-DIGEST]` | `pipeline`, `state`, `exit`, `child-exit`, `last-stage`, `evidence`, `state-path`, `next` |
| `[MOL-REFUSE]` | `action`, `reason`, `detail`, optional `next` |
| `[MOL-ANOMALY]` | `pipeline`, `detail` or `launch-log` |
| `[MOL-NEXT]` | `next`, or `poll-in`; after a retrospective, the free text `suggestion (not run): <command>` in place of the pairs |
| `[MOL-STOP]` | `pipeline`, `sent`, and further keys of the owner |
| `[MOL-RETRO]` | Per stage: `pipeline`, `stage`, `status`, `detail`, `path`; when no stage can be read: `status`, `reason`, and `pipeline` and `path` where known; a copied evaluation line: the label, three spaces, and the line as `learn` printed it |

The states of the digest are a closed set: `completed`, `failed`, `stopped`, `dry-run`.

The grammar of the digest line is the as-is grammar and has no field for facts that the baseline
does not know. Where a requirement says that a fact "is shown in the digest" (the hash of the
comment and what was changed because of it, a delegation of judgment, the picked critic, a
fallback in force, open alerts), the fact is a field of the digest record of `status --json`,
and in default output it is printed on a line with the label `SPECSTRIDE-DIGEST` before the
digest line. Under the `parity` profile neither is printed.

Product lines that two or more features read:

| Line | Keys | Printed by |
|---|---|---|
| `[SPECSTRIDE-LAUNCH]` | `run`, `state` | `launch` (122) |
| `[SPECSTRIDE-DIGEST]` | `run`, `comment`, `changed`, `delegated`, `critic`, `fallback`, `alerts` | The runtime (123) |
| `[SPECSTRIDE-STOP]` | `request`, `now`, `ended`, `next` | `stop` (102) |
| `[SPECSTRIDE-CONTINUE]` | `run`, `counts` | `launch`, `run`, `resume` (102) |
| `[SPECSTRIDE-REFUSE]` | `action`, `reason`, optional `file`, `next` | Any command that refuses |
| `[SPECSTRIDE-STATE]` | `action`, `feature`, `approvals`, and where the command has one, `out` or `from` | `state export`, `state import`, `state adopt` (122) |

The keys of every other product line are in the specification of the feature that prints it.

- **F100-FR-178**: Every labelled line of the product MUST follow the grammar of §G.3. Feature 100 owns the grammar; each line belongs to the feature that prints it, which specifies its keys and values inside the grammar. A label of one family MUST never be used by another family.
  - divergence: DV-033
  - test: CT-100-278

- **F100-FR-179**: The `[LOOP]` line MUST be printed before the digest, in default output only, and only when a loop layer is on or was switched off by rule with an announced reason. Its `parallel=` fields MUST be printed only with parallel units on. It MUST never be printed under the `parity` profile.
  - divergence: DV-018; DV-088
  - parity: not printed (rows 19, 20 of annex X §X.7)
  - test: CT-100-279

- **F100-FR-180**: The digest MUST be the final line of every run of the pipeline entry, with the grammar of §G.3. The runtime MUST produce it from events; a host skill MUST print it verbatim.
  - test: CT-100-280

- **F100-FR-181**: Messages and records that at the baseline name an implementation file MUST name a logical component instead, through the component-name table of annex X §X.8. The text after the name MUST be equal to the baseline's.
  - divergence: DV-066
  - test: CT-100-281

## §G.4 Exit codes per command

One executable; the code depends on the command. Codes of the engine are in annex E §E.4; codes
of the runtime root and the pipeline entry in annex F §F.8. They are repeated here per command.

| Command | Codes |
|---|---|
| Any command, uncaught error | 70 |
| Any command, unknown first argument (verb) | 1 |
| A front-door command, a flag given without its value | 127, as at the baseline |
| The shim of a host package, protocol mismatch | 4, with one line `[SPECSTRIDE-REFUSE] action=protocol reason=protocol-mismatch` that names the doctor |
| `--protocol` | 0 |
| `run` | 0, 1, 2, 3, 4, 5, 6 (the engine table). Unknown argument: 3 |
| `resume` | In the foreground the codes of the engine; through the runtime root the codes of `launch`. Refusals: 1 without state, which is the first check, as at the baseline (CQ-184); then 5 when the lock is held; 5 when the owner of the lock is dead and a process group of it survives; 3 when there is nothing to resume, which includes a run that is `finished`; 3 when a source hash changed since launch; 3 for a record of an unsupported major or settings that do not validate |
| `stop` | 0 always, once state exists; 1 without state |
| `status`, `tail`, `events`, `verdicts`, `feedback`, `watch` | 0; 1 on missing state, feature, log, events, verdicts or feedback, and on wrong usage of `feedback` |
| `phases` | 0; 1; 3 on an invalid spec |
| `learn` | 0 success; 1 `advise` without telemetry, and wrong usage through the front door; 2 usage, a knob outside the allowlist, missing input; 3 `apply` refused for no telemetry or below the sample floor; 4 `apply` refused as quarantined |
| `spec` | 0; 1 a phase number that is not a number, as at the baseline; 2 usage; 3 invalid spec, unknown explicit format, unreadable file, a missing phase number of `tick`, `title`, `shape` or `slice` (F104-FR-020) |
| `verify` | 0; 3 any verification error; 10 the verification gate failed; 11 a command staged before failed |
| `reverse` | 0 success, dry run included; 2 missing source or unexpected argument; 3 a flag the reverse run sets itself, or a refused mode; otherwise the code of planning when planning fails |
| Reverse plan, reverse lint, reverse guard | 0; 2 usage; 3 findings, and invalid input alike |
| Reverse inventory | 0; 2 usage; 3 invalid input |
| Launch-contract commands | Derive: 0; 2 any error. Validate: 0 valid; 2 promotion together with allowing a draft; 20 invalid; 23 stale sources or changed learning decisions. Render: 0; 2 usage; 20 cannot render; 23 stale |
| `pipeline run`, the launcher, the runtime root | 0, 2, 20, 21, 22, 23, 24, 128+N (annex F §F.8) |
| `launch` | 0 started; 4 attached or refused; 20, 21, 23, 24 where the refusal is one of the pipeline's |
| `supervise hold`, `supervise release` | 0 written; 4 refused |
| `host event` | 0 written; 1 no state; 3 usage |
| `supervise` | 0 completed, a reading taken, a relaunch started; 1 a status the exit map does not know; 2 stopped, and also a usage error; 3 unknown-terminal; 4 refused, and also the launch decision `attach`; 5 supervision expired; 22 failed; 24 lock conflict; 130 interrupted, the run is left alone |
| `doctor` | 0 no `fail` finding; 1 the doctor could not run; 2 at least one `fail` finding; 3 usage error. `--strict` makes a warning exit 2 |
| `wait` | 0 a change was printed, or the time limit passed with nothing printed; 1 no state; 3 usage |
| `state export`, `state import`, `state adopt` | 0; 1 no state, or a verification of the archive failed; 3 usage or invalid input; 5 a run of the feature is alive |
| `harness verify` | 0 conformance passed; 2 conformance failed; 3 usage or unknown harness |
| `config show`, `config schema` | 0; 3 configuration invalid or usage |
| `tripwire clear` | 0; 1 no tripwire; 3 usage |

Numbers that collide, by process:

| Value | Meanings |
|---|---|
| 1 | Engine internal error · pass loop usage · critic uncaught error · front door missing state or unknown first argument (verb) · `learn advise` without telemetry · supervisor unknown status · doctor could not run |
| 2 | Engine rejects, oscillation, release verification · usage error of the commands that came from modules with an argument parser · `reverse` argument error · supervisor stopped · supervisor usage error · doctor `fail` finding · `learn` usage |
| 3 | Engine invalid input · critic configuration error · reverse findings · invalid spec · supervisor unknown-terminal · `learn apply` refused · doctor usage · `resume` nothing to resume or a changed source |
| 4 | Engine budget · pass limit of the pass loop · supervisor refused or `attach` · `learn apply` quarantined |
| 5 | Engine lock held · supervisor supervision expired · `resume` lock held |
| 6 | Engine stop · pass loop stop. The 6 of a stage child becomes the pipeline code 22 with the state `stopped` |
| 10 | Pass loop kills at the ceiling · critic rejected or malformed · verification gate failed |
| 22, 24 | The pipeline and the supervisor use both with the same meaning: stage failed, lock conflict |

- **F100-FR-182**: Every command MUST exit with exactly the codes of its row in §G.4. A usage error MUST keep the as-is code of its command. An uncaught error of any command MUST exit 70. An unknown first argument (verb) MUST exit 1; an unknown sub-verb of a command exits with the code of the row of that command.
  - test: CT-100-282
  - assumption: CQ-201 ("unknown subcommand" is read as an unknown first argument only)

- **F100-FR-183**: `resume` MUST refuse with exit 5 when the lock is held, with exit 3 when there is nothing to resume, and with exit 3 when the hash of the spec, of the plan or of the task list changed since launch. For the task list the hash that ignores checkboxes MUST be compared, so that a tick never refuses a resume.
  - divergence: DV-021
  - parity: the oracle maps the as-is code 1 to 5 and to 3; the refusal for a changed source has no reference (row 15 of annex X §X.7)
  - test: CT-100-283

- **F100-FR-184**: Supervision MUST end with one of seven outcomes, each mapped to one exit code: completed 0, stopped 2, unknown-terminal 3, refused 4, supervision-expired 5, failed 22, lock-conflict 24. The double uses of the baseline MUST be kept: 2 also for a usage error, 4 also for the launch decision `attach`.
  - origin: 011 SC-007
  - disposition: ported
  - test: PT-100-011SC007-*

- **F100-FR-185**: The doctor MUST exit 0 when no finding has the severity `fail`, 1 when it could not run, 2 when at least one finding has the severity `fail`, and 3 on a usage error. With `--strict` a warning MUST exit 2. A probe that times out inside a check MUST never raise the code above that of a warning.
  - divergence: DV-041
  - test: CT-100-285

- **F100-FR-186**: The commands that have no as-is equivalent (`launch`, `wait`, `state export`, `state import`, `state adopt`, `harness verify`, `config show`, `config schema`, `tripwire clear`) MUST exit with the codes of their rows in §G.4.
  - test: CT-100-286
  - assumption: CQ-023 (the codes of commands that have no as-is equivalent, other than those of `launch` after the handshake; the sources give none)

## §G.5 Token budgets of host-facing output

| Subject | Budget |
|---|---|
| Host skill `specstride-run` | 8,000 tokens |
| Host skill `specstride-reverse` | 7,000 tokens |
| Doctor skill | 1,500 tokens |
| One supervision cycle | 150 tokens; an unchanged cycle 0 |
| Supervision of a whole run | 3,000 tokens |
| One batch of the judgment exchange | 3,000 tokens |
| Measure in the build | Bytes, at 2.8 bytes per token |

- **F100-FR-187**: The output of every command that a host skill calls MUST stay inside the byte limit that its owner derives from the budgets of §G.5. The build MUST measure bytes and MUST fail on a breach. The budget for a whole run holds with `relaunch.owner: root`; with `supervise` the host watches for the whole run and the budget is not promised.
  - test: CT-100-287

## §G.6 EP-09 UI read model (`RunView`)

#### Id and version
`specstride.view/1`.

#### Purpose
To give every renderer one read model of a run, so that no renderer opens the event file or
derives a lane by itself.

#### Caller and time
`status`, `wait`, the writer of the precomputed status line, and later renderers, whenever they
show a run.

#### Inputs
`project`: the event stream; the named state files (the run record, the terminal record, the
pause record); and values that the caller supplies to the pure function: the result of a probe
of the lease, the newest launch record, the supervision record, the result of a search of the
process table for the run token, the limit of the handshake, and the time now. `reduce`: a view and one event.
A cursor, held by the caller: file, offset, last `seq`, and 8 hexadecimal characters of a hash of
the change signature, so that a change of a state file or of the clock moves the cursor too.

#### Outputs
A `RunView`: the state of the run, with the derived conditions `dead`, `stale` and
`launch-abandoned`; lanes; attention items; budget levels; the current phase, phase attempt and
pass; the strategy; the owner text of the lock that `status` prints for a running run; and the
cursor to continue from. The schema of the view is delivered by feature 129 to the `contracts`
package under the id `specstride.view/1`.

#### Errors
A torn last line of the event file is tolerated. An event major outside the accepted range gives
a view marked `stale` with the reason, and a doctor warning.

#### Guarantees of the core
Lanes, attention items and budget levels are derived in the read model, never in a renderer.
Projecting a batch equals folding event by event. A cached view is disposable. Fields are additive
inside a major. The cursor is held by the caller; `wait` prints it and takes it back as an
argument, so that two hosts never consume each other's changes.

#### Guarantees of an implementation
A renderer takes a `RunView` and is given no file handle. It renders every text that comes from a
run as text.

#### Failure of an implementation
A renderer that fails prints one line that names the command `status --json`. It changes no state.

#### Unknown-value rule
An unknown event type and an unknown field are ignored. An unknown state of the run is shown as
`unknown` with an attention item.

#### Wave 1 implementations
`status` as text and with `--line` and `--json`; `wait --until-change`; the host hook shim that
prints the precomputed status line.

#### Content owner
129.

#### Proving test
Golden views from event logs of fixtures, the oracle's included, and one with a torn line. The
property that a batch projection equals folding. A sample renderer in the test tree takes the
`RunView` record and no file handle.

- **F100-FR-188**: The read model MUST offer the pure operations `project` and `reduce` of §G.6, and a cursor held by the caller. The event stream and the named state files MUST be its only inputs. An attention item for a run that is blocked on a human MUST name what the run needs, and for a changed source the file.
  - test: CT-100-288
  - ep: EP-09 `specstride.view/1` (implements)

## §G.7 EP-14 Doctor check registry

#### Id and version
`specstride.doctor/1`.

#### Purpose
To let every package register checks of the consumer's set-up, and to make the launch checks the
same tests as the doctor's.

#### Caller and time
`doctor`; and `launch`, which runs the launch-blocking subset as its launch checks.

#### Inputs
A check: a stable dotted id; a severity rule; the flag `lb` (launch-blocking); an order; a probe
that receives injected probes; a message template of at most 200 bytes; a fix hint. `run`: the
context and the flags of the doctor.

#### Outputs
Findings, each with: id, severity, `lb`, message, fix, redacted evidence.

#### Errors
A probe that times out gives a warning `probe timed out`. A check that throws makes the doctor
exit 1 and does nothing to a run.

#### Guarantees of the core
The launch checks are exactly the `lb` subset, so the doctor and a launch cannot disagree. The
critic-diversity warning is never `lb`. The doctor never blocks a run by being unhealthy. Ids are
never renamed.

#### Guarantees of an implementation
A check reads and never writes, makes no paid call, reads no secret value, opens no credential
store, closes standard input of every process it starts, and keeps to its time limit and its
output cap.

#### Failure of an implementation
The check's finding is a warning with the message `probe timed out` or the doctor exits 1, as
under "Errors". A failing check of the `lb` subset at launch refuses the launch.

#### Unknown-value rule
A severity that a reader does not know is read as `warn`. An unknown check id in a filter is a
usage error (exit 3).

#### Wave 1 implementations
The catalogue of 44 checks. Every package registers its own: a harness adapter its checks of
executable, login and version; a host its host checks; a loop layer its toolchain check. The six
launch checks of the as-is supervisor (`launcher-intact`, `contract-validated`,
`authorized-root`, `launcher-syntax`, `launcher-dry-run`, `run-directory-free`) are registered by
feature 123 with `lb` set and in this order. A harness adapter proposes the ids of its checks in
the form `harness.<id>.<check>`; feature 112 confirms them. The registration call lives in the
kernel package, so that a package registers checks without importing the doctor. Feature 123
registers `pipeline.terminalTool` with severity `warn` and not launch-blocking: the tool that the
pipeline names as its terminal is not the one of the reference. The ids that the harness adapters
propose (130, 131, 134, 138) are still to be confirmed by feature 112 (CQ-108, CQ-150).

#### Content owner
112.

#### Proving test
Registry conformance. A sample check registered from the test tree appears in `--json` output,
and with `lb` set it refuses a launch, with no core file changed.

Severities are a closed set: `ok`, `info`, `warn`, `fail`.

Schema of the doctor's findings (`--json`), schema id `specstride.doctor/1`:

| Field | Meaning | Type in words | Required |
|---|---|---|---|
| `schema` | Schema id | Text | Yes |
| `at` | Time | Timestamp, UTC | Yes |
| `host` | The calling host: a host id, or `cli` | Text | Yes |
| `audience` | `personal` or `distributed` | Member of a closed set | Yes |
| `exit` | The exit code of the doctor | Whole number | Yes |
| `summary` | Counts per severity | Record of whole numbers | Yes |
| `findings` | Per finding: `id`, `severity`, `lb`, `message`, `fix`, `evidence` (redacted) | List of records | Yes |
| `registry` | Summary of the resolved harness registry | Record | No |
| `pick` | The critic the product would pick, and why each other candidate lost | Record | No |
| `sources` | Summary of where configuration values came from | Record | No |

- **F100-FR-189**: The doctor MUST be a registry of checks with the form of §G.7, and its `--json` output MUST follow the schema of §G.7. The launch checks MUST be exactly the checks whose flag `lb` is set.
  - test: CT-100-289
  - ep: EP-14 `specstride.doctor/1` (implements)

## §G.8 Launch-contract schema

| Subject | Content |
|---|---|
| Schema id | `specstride.launch-contract/1` |
| Logical name | `pipeline:<pipelineId>:contract` |
| Writer | The launch-contract commands of the CLI. Only validation promotes |
| Readers | Runtime root, pipeline stage executor, learning (the binding), CLI |
| Content owner | 107. It may add fields to `inventory` and `configuration` |

| Field | Meaning | Type in words | Required |
|---|---|---|---|
| `schema` | Schema id | Text | Yes |
| `id` | The pipeline id | Lower-case words joined by hyphens | Yes |
| `status` | `draft` or `validated` | Member of a closed set | Yes |
| `generated_by` | The logical component that wrote the draft, with its version | Record | No |
| `promotion` | Proof of promotion: the logical component that promoted, and the hash of the canonical launch contract without `status` and `promotion` | Record | With `validated` |
| `repository` | Root, revision, whether the tree is dirty | Record | Yes |
| `authorized_roots` | Paths a stage may touch | List of text, at least one | Yes |
| `features` | Per feature: path, slug, phases, task count, artifacts present and absent | List of records | No |
| `sources` | Per source: path, kind, content hash, for a task list also the hash that ignores checkboxes, line count | List of records, at least one | Yes |
| `inventory` | Tasks, shell candidates, prerequisites, verification documents | Record | No |
| `configuration.relaunch` | Relaunch budget: maximum of relaunches (0 to 5, default 2) and wall-clock seconds. It applies to every mode | Record | No |
| `configuration.learning` | The binding of learning: mode, bound of decisions, their hash, effective values, source | Record | No |
| `configuration.verification` | The verification mode the derivation set | Member of a closed set | Yes |
| `configuration.comment` | Hash of the consumer's comment, and what was changed because of it | Record | No |
| `configuration.scopes` | Declared write scopes of tasks, and declared reads and writes of verification commands, each with its source | Record | No |
| `coverage` | Per coverage obligation: id, source with path, line and anchor, kind (`implementation`, `prerequisite`, `verification`, `decision`, `operation`), timing, producer, disposition (`mapped`, `optional`, `out-of-scope`, `unresolved`, `unsupported`), stage ids, verification ids, rationale, evidence | List of records | Yes |
| `findings` | Per finding: id, severity (`info`, `warning`, `blocker`), status (`open`, `resolved`, `accepted`), message, source, resolution, and for a judgment the provenance of the answer | List of records | Yes |
| `stages` | Per stage: id, kind (an id of the registry of stage kinds), dependencies, working directory, action, action on resume, preconditions and postconditions (each a check of the registry, with its timing), recovery, evidence | List of records | Yes |
| `stages[].action` | Argument list (at least one entry), environment (a literal, or a value taken from a named variable with whether it is required), time limit in seconds (default 3600) | Record | For kinds that run a command |
| `stages[].recovery` | Maximum of stage attempts (default 1), exit codes to retry, backoff, total time limit, and the reason rule: which stop reasons of the terminal record allow a retry (members of annex E §E.3 that are transient) | Record | No |

Every finding of a validation carries one error class of the closed set "Error classes of the
validation of a launch contract" (annex X §X.6 row 274, owner 107). A class the reader does not
know fails the build (assumption: CQ-194).

The records inside the fields of this table (a source, the records of `inventory`, the members of `configuration`, a coverage entry, a finding, a stage with its action, its checks and its recovery) are specified by the content owner, 107, whose package holds their schemas with ids of the internal form. The generated record schema and those item schemas, joined by reference, are the one schema of F100-FR-190; neither states a rule of the other.

- **F100-FR-190**: The launch contract MUST follow the schema of §G.8, and that one schema MUST also be the validator. A launch contract MUST be promoted only by validation. A validated launch contract without a matching proof of promotion, and one whose sources changed, MUST be refused with the pipeline codes 20 and 23. A top-level key the schema does not hold MUST refuse the launch contract.
  - divergence: DV-059; DV-055; DV-061
  - test: CT-100-290
  - ep: EP-19 `specstride.stage-kind/1` (consumes)

- **F100-FR-191**: The host skill `specstride-run` MUST launch by default. Its modes MUST be `run` and `dry-run`. `dry-run` MUST withhold the launch and print the plan. The as-is mode names MUST map: `generate` to `dry-run`; `run` and `auto` to `run`.
  - divergence: DV-009
  - parity: mapped through the mode map (row 37 of annex X §X.7)
  - test: CT-100-291

## §G.9 Judgment exchange

Schema id `specstride.judgment/1`. The exchange is the part of the CLI protocol through which
derivation of a launch contract asks for judgment on items that the inventory could not settle.

| Step | Actor | Act |
|---|---|---|
| 1 | CLI | Inventories the sources, hashes them, and pages the items that need judgment into batches of at most 3,000 tokens. Each item has an id, a source anchor and a short excerpt |
| 2 | Host model, or a harness named in user configuration for a host without a model | Answers each item with one of the choices the item offers |
| 3 | CLI | Records each answer with its provenance (who answered, through which harness) in the launch contract and in the digest |

- **F100-FR-192**: Derivation MUST expose judgment as the exchange of §G.9, which feature 107 implements as the derivation half of EP-01: the CLI inventories, and the host judges batches of at most 3,000 tokens. A host without a model MAY delegate the judgment to a harness named in user configuration, through the `completion` level; the delegation MUST be recorded in the digest. The host MUST never need to open the launch contract or the sources.
  - test: CT-100-292
  - ep: EP-01 `specstride.host/1` (implements)
  - assumption: CQ-024 (the schema id `specstride.judgment/1` and the three steps come from the red team of the architecture; the architecture file names the delegation only)


## §G.10 Presenter interface

The presenter renders a run for a person. The front door calls it; nothing else does. It is no
extension point in Wave 1.

| Subject | Content |
|---|---|
| Schema id | `specstride.presenter/1` |
| Called by | The front door (119): `run` and `resume` in the foreground for the timeline, `watch` for the card, the inspection commands for the plain form |
| Provided by | The presenter (145), with the banner and the theme |
| Input | A stream of events: the compatibility projection in compatibility output, the primary event stream in default output (CQ-101); the mode; the detail level; the settings of colour, motion, banner, rail, background and glyphs; the size of the terminal; whether the stream is a terminal |
| Modes | `timeline`, `card`, `plain` (annex X §X.6 row 160) |
| Output | Lines on the stream the front door names. In compatibility output the lines of the baseline byte for byte. In default output no free text from outside the runtime |
| Errors | None that reaches the run. A presenter that fails prints one line and leaves the exit code of the command as it is |
| Owner of the four summary lines of the stream | The presenter, in compatibility output (CQ-121) |

- **F100-FR-233**: The front door MUST reach the presenter only through the interface of §G.10, and the presenter MUST read nothing but the stream of events and the settings it is handed. The presenter MUST never change the exit code of a command, MUST never write state, and MUST be best-effort: a failure of the presenter MUST NOT stall or fail a run.
  - test: CT-100-333
  - assumption: CQ-101; CQ-121 (the interface is new: the split of feature 119 needs it, and no source states it)
