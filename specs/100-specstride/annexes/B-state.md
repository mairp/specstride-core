# Annex B — State (L0)

Part of the specification of feature `100-specstride`. Normative.

This annex holds the locations of state, the rules of the layout, the identifiers, the table of
logical names, and the schemas of the records that two or more features read. Physical paths below
a root are not part of the specification: they belong to the plan, behind the logical names.

How to cite: "annex B, §B.5 Logical names, F100-FR-053".

## §B.1 Locations

| Location | Logical root | What it is | Who writes | Who reads |
|---|---|---|---|---|
| User-level state | `user` | The consumer's configuration, consumer-declared harness descriptors and toolchain profiles, newer terms-gate data, results of harness verification, the tripwire | The consumer; the CLI on the consumer's request; the runtime for the tripwire only | CLI, runtime, doctor |
| Control plane, one per workspace | `control` | Everything the runtime decides on. It lies outside the working tree, in the user's state directory, keyed by the workspace id | The runtime tree. The CLI writes only what the table of §B.5 gives it as writer: inbox requests, launch records with the comment beside them, the supervision record, the run snapshot and the resolved registry at launch, the launch contract with its bundle and retrospective, and the inventory and the verification commands of a reverse run (F100-FR-003, F100-FR-217) | CLI, doctor, renderers, the builder of the fact block |
| Workspace part | `workspace` | What the proposer produces for the runtime, and the handoff the runtime writes for the proposer. It lies inside the working tree | The proposer; the runtime for the handoff and the advisory marker | The proposer, the runtime, grounding (phase evidence only) |
| Worker root | `worker-root` | The trees of the workers of parallel units. It lies outside the workspace and outside the control plane, in the user's cache directory | The engine creates and removes trees; a worker's harness writes inside its own tree | The engine |

- **F100-FR-032**: The product MUST keep state in exactly three roots (user-level state, the control plane of the workspace, the workspace part) and, with parallel units on, in the worker root, as in the table of §B.1. The control plane MUST lie outside the working tree. A mutable file MUST NOT be shared between two workspaces.
  - origin: C-011
  - disposition: translated
  - test: PT-100-C-011-*
  - divergence: DV-006

- **F100-FR-033**: The worker root MUST lie outside the workspace and outside the control plane. The tree store MUST lie in the control plane of the run. The worker root and the tree store MUST NOT exist when parallel units are off. Both MUST be removed when the run ends.
  - divergence: DV-084
  - parity: off (neither location exists) (row 20 of annex X §X.7)
  - test: CT-100-133
  - status: unverified (check: location and permissions of the worker root on macOS; verified-on: —; pin: —)

- **F100-FR-034**: Where the host's shell or the detached runtime cannot write the control root, the consumer MUST be able to set another control root in user configuration, the environment or a flag. A control root inside the working tree MUST be accepted only together with a deny rule for the proposer's harness, and the run MUST then record `protection=detect` unless the harness adapter confirms the denial.
  - test: CT-100-134
  - status: unverified (check: the spike of the detached runtime writes the control root from the host's shell tool and from the detached root, with the shell sandbox off and on; verified-on: —; pin: host versions of the spike)

## §B.2 Rules of the layout

- **F100-FR-035**: A file in the workspace part MUST NOT decide anything. The runtime MUST read the outbox and the phase evidence as claims, after the pass has exited, as regular files and without following links. (SL-1)
  - test: CT-100-135

- **F100-FR-036**: Every file the runtime writes MUST be written to a temporary name in the same directory and renamed into place, so that no reader sees a partial file. A state file MUST hold current state only; history is the event stream. (SL-2)
  - divergence: DV-072
  - test: CT-100-136

- **F100-FR-037**: Grounding MUST refuse, by real path, every path of the control plane, of the event stream, of the outbox, of the carry-over files (the handoff and the proposer's notebook), of the worker root and of the tree store, and every path under the project's repository directory, whatever the phase evidence cites and whether a loop layer is on or off. (SL-3)
  - divergence: DV-032; DV-089
  - test: CT-100-137

- **F100-FR-038**: Feature 100 MUST own one table from logical names to locations, with a layout version. Specifications, the parity oracle, the doctor and messages to the consumer MUST name state by logical name. A change of layout MUST change that table and the layout version and nothing else in any specification. (SL-4)
  - test: CT-100-138

- **F100-FR-039**: After launch, the inbox MUST be the only place where a process outside the runtime tree writes, apart from the supervision record of §B.16. A stop request MUST be honoured as at the baseline, including when it was written while no run was active. (SL-5)
  - test: CT-100-139

- **F100-FR-040**: At containment levels C0 and C1 the control plane is protected by its location and by detection, not by the operating system. The run record and the `[LOOP]` line MUST then say `protection=detect`. At C2 and above they MUST say `protection=prevent` only when the harness adapter confirmed that the sandbox denies writes to the control plane. (SL-6)
  - test: CT-100-140

- **F100-FR-041**: State trees of the three as-is systems MUST NOT be read. The workspace part MUST carry a layout version file, so that it can be told apart from an old tree of the same name. (SL-7)
  - divergence: DV-035
  - test: CT-100-141

- **F100-FR-042**: While a run is alive the runtime root MUST keep an advisory marker in the workspace part that holds the owner record of §B.9. A launch that finds a marker whose owner it cannot probe MUST be refused with `foreign-owner`. The marker is a safety measure and decides nothing else; its removal by a pass MUST be reported as an integrity event.
  - test: CT-100-142

- **F100-FR-043**: Directories of the control plane, of the user-level state and of the worker root MUST be readable and writable by their owner only, and files likewise. The runtime MUST resolve real paths and require them to stay inside their root, MUST refuse a symbolic link inside the control plane, and MUST open files it reads as claims without following links.
  - test: CT-100-143

- **F100-FR-228**: When the learning mode is not `off`, the engine MUST, before each proposer pass, record the size and the hash of the leading bytes of three files that the proposer could reach: the event stream of the run, the decision log of learning and the observation of the current phase; and MUST check after the pass that those leading bytes are unchanged. Appends are allowed. A file that shrank, or whose leading bytes changed, MUST give one event `integrity.events_changed` with the phase, the phase attempt and the file, and MUST mark the run as left out of every baseline and every evaluation of learning. The engine executes the bracket through the calls of F100-FR-235; the rule and its thresholds belong to feature 106 (F106-FR-037).
  - test: CT-100-328
  - assumption: CQ-115

## §B.3 Identifiers

| Identifier | Scope | Minted by | Rule |
|---|---|---|---|
| `workspaceId` | Workspace | The runtime, derived | A hash of the real path of the workspace root, with a readable prefix. Never read from a file inside the workspace |
| `pipelineId` | Launch contract | Derivation of the launch contract | The pipeline id of the as-is launch contract |
| `runId` | The logical run of one feature | The CLI at the first launch | Stable across resume and relaunch. It ends when every phase is approved or when the consumer starts a new run |
| `launchId` | One start of the runtime root | The CLI at `launch` and `resume`; the runtime root at a relaunch it performs | A new value at every launch, resume and relaunch |
| `engineStartId` | One start of the engine process | The runtime root; the engine itself in start mode `standalone` | Carries an ordinal inside the run. It is what the compatibility projection writes as the as-is run id |
| `attemptId` | One phase attempt | The engine | Minted once, never reused. The ordinal of the phase attempt is a count in the ledger, not the id |
| `passId` | One pass | The engine | Unique per start of a session. A resume after a yield starts a new pass with a new id and the same `attemptId` |
| `unitId` | One unit of work | The engine | The id of a unit that came from a parallel group is the hash of its sorted task ids |
| `jobId` | One detached job | The engine | — |
| `verdictId` | One verdict | The engine | Bound into the approval record |
| `workerId`, `groupId` | One worker, one parallel group | The engine | Present only with parallel units on. Neither appears in any input of a critic-class call |

- **F100-FR-044**: The identifiers of §B.3 MUST be minted by the process named there, with the scope and the rule named there. Every record and every event that concerns an identified thing MUST carry its identifiers.
  - test: CT-100-144

- **F100-FR-045**: A `launch` MUST continue the unfinished run of the same feature, with its `runId` and its counts, and MUST say so in one line. A new run MUST start only when no unfinished run of the feature exists or when the consumer passes `--new-run`. Counts inside a run MUST be reset only by `--reset-counts`, which is accepted from the command line only and is never stored in the run snapshot.
  - divergence: DV-011
  - parity: resume fixtures pass `--reset-counts` (row 13 of annex X §X.7)
  - test: CT-100-145

- **F100-FR-046**: Where the compatibility projection or compatibility output shows the as-is run id, it MUST show a value of the as-is form: date and time of the engine start to the second, a hyphen, and the process id of the engine.
  - origin: C-013; B-0248
  - disposition: ported
  - test: PT-100-C-013-*

- **F100-FR-047**: The logical name of anything that belongs to a phase attempt MUST carry the phase number, the ordinal of the engine start and the ordinal of the phase attempt, so that the name stays unique when counts were reset. Where a directory of that name already exists, the as-is suffix rule MUST apply: the run id is appended.
  - divergence: DV-011
  - test: CT-100-147

## §B.4 Common rules of records

- **F100-FR-048**: Every file of the control plane and every record of §B.7 to §B.18 MUST carry a field `schema` whose value is the schema id with its major, for example `specstride.lease/1`. A file of several records MUST carry it in every record.
  - test: CT-100-148

- **F100-FR-049**: A reader MUST refuse a record whose schema id it does not know or whose major differs from the one it supports, with a message that names the logical name, the major found and the major supported, and with a doctor finding. `resume` on a run whose records have a different major MUST refuse with exit 3. A reader MUST ignore a field it does not know. A writer MUST add fields inside a major only in an additive way.
  - divergence: DV-039
  - test: CT-100-149

- **F100-FR-050**: The run record MUST hold the version of the product that started the run and the version of every later engine start. A difference MUST be recorded as an event and shown by the doctor.
  - test: CT-100-150

- **F100-FR-051**: Every state file MUST have exactly one writing process, named in the table of §B.5. Two processes MUST never write the same state file. Where two processes need to record state about one thing, each MUST have its own file.
  - test: CT-100-151

- **F100-FR-052**: A record of this annex MUST NOT hold a secret value, a nonce before its call has returned, or prompt or reply content. A secret is stored as its reference; a nonce as its hash; content as a logical name with hash and size.
  - test: CT-100-152

## §B.5 Logical names

Grammar: a logical name is a sequence of segments separated by `:`. A segment is lower-case letters,
digits and hyphens, or a parameter. Parameters are written here in angle brackets: `<slug>` is the
feature slug, `<N>` the phase number, `<k>` the ordinal of the engine start, `<n>` the ordinal of
the phase attempt. "Root" is one of `user`, `control`, `workspace`, `worker-root`. Three further
places appear in the table and are not roots of state: `temp` (the temporary directory of the
system; what is put there is removed after use), `package` (data shipped with the product, read
only; the build of the published package copies each workspace package's `data/` tree into it, so
that the descriptors and the catalogue that the harness package holds as data feed
`package:harness:<id>` and `package:catalogue`, and code reads these files only through their
logical names; the two path templates stand in `plan.md` and in feature 100's `contracts/`,
F100-FR-038) and `harness-home` (the configuration home of a harness, which a run reads and does not
write, apart from the installs the consumer listed).

| Logical name | Root | Writer | Readers | Schema or content |
|---|---|---|---|---|
| `user:config` | user | Consumer | CLI, runtime, doctor | `specstride.config/1` |
| `user:harness:<id>` | user | Consumer | CLI, runtime, doctor | Harness descriptor, `descriptorVersion: 1` |
| `user:toolchain:<id>` | user | Consumer | Runtime, doctor | `specstride.toolchain/1` |
| `user:terms` | user | Consumer, CLI on request | Runtime, doctor | `specstride.terms/1` |
| `user:harness-verify:<id>` | user | CLI on request | Runtime, doctor | `specstride.harness-verify/1`: harness, version, hash of the descriptor, date, outcome |
| `user:tripwire` | user | Runtime | Runtime, doctor, CLI | `specstride.tripwire/1` |
| `user:catalogue` | user (cache) | CLI on request | Runtime, doctor | Dated snapshot of a model catalogue |
| `project:config` | workspace (the working tree, outside the workspace part) | Consumer | CLI, runtime, doctor | `specstride.config/1`, narrowing keys only |
| `workspace:record` | control | Runtime root | All | `specstride.layout/1` |
| `workspace:lock` | control | Lock provider | Runtime, CLI, doctor | EP-13 |
| `workspace:current:events` | control | — (resolves to `run:<runId>:events` of the current run) | CLI | — |
| `workspace:current:engine-log` | control | — (resolves to `run:<runId>:engine-log` of the current run) | CLI | — |
| `workspace:active` | workspace | Runtime root | CLI at launch | Advisory marker |
| `workspace:layout-version` | workspace | Runtime root (the engine at start, mode `standalone`; F122-FR-043) | Runtime, doctor | Layout version |
| `inbox:stop` | control | CLI | Engine, runtime root | `specstride.inbox/1`, type `stop` |
| `inbox:hold-relaunch` | control | CLI | Runtime root | `specstride.inbox/1`, type `hold-relaunch` |
| `inbox:host-events:<launchId>` | control | CLI on behalf of a host | Engine | `specstride.inbox/1`, type `host-event` |
| `launch:<launchId>:record` | control | CLI | Runtime root, CLI, doctor | `specstride.launch/1` |
| `launch:<launchId>:supervision` | control | CLI | CLI, RunView | `specstride.supervision/1` |
| `launch:<launchId>:runtime-log` | control | Runtime root | CLI | Text |
| `pipeline:<pipelineId>:contract` | control | CLI | Runtime root, CLI | `specstride.launch-contract/1` |
| `pipeline:<pipelineId>:bundle:<hash>` | control | CLI | Runtime root | Launch bundle |
| `pipeline:<pipelineId>:launcher` | workspace (the working tree, outside the workspace part) | CLI | Consumer, runtime root | Launcher |
| `pipeline:<pipelineId>:state` | control | Runtime root | CLI, supervisor | Stage state, current only |
| `pipeline:<pipelineId>:launcher-log` | control | Compatibility projection | Oracle, CLI | Compared log |
| `pipeline:<pipelineId>:report-log` | control | Compatibility projection | Oracle, CLI | Compared log |
| `pipeline:<pipelineId>:launch-log` | control | Compatibility projection | Oracle, CLI | Compared log |
| `pipeline:<pipelineId>:harness-run` | control | Compatibility projection | Oracle, CLI | Compared record |
| `pipeline:<pipelineId>:retrospective:<hash>` | control | CLI | CLI | Retrospective |
| `feature:<slug>:learning:decisions` | control | Learning (own writer domain) | Learning, launch-contract validation | Decision log, byte format kept |
| `feature:<slug>:learning:events` | control | Learning (own writer domain) | Compatibility projection, CLI | `specstride.event/1` |
| `feature:<slug>:learning:events-legacy` | control | Compatibility projection | Oracle, CLI, consumers | The as-is event file of the feature, where the baseline's `learn` command appends its lines: the as-is lines of the learning stream, written only with the projection on |
| `feature:<slug>:approval-key` | control | Runtime | Runtime | Key |
| `gate:<N>:approved` | control | Engine | Engine, CLI, doctor | `specstride.approval/1`. Short for `feature:<slug>:gate:<N>:approved` |
| `gate:<N>:evidence` | workspace | Proposer | Engine, grounding | Phase evidence |
| `feature:<slug>:outbox` | workspace | Proposer | Engine | Checkpoints and yield artifacts, as claims |
| `feature:<slug>:notebook` | workspace | Proposer | Proposer | The proposer's notebook |
| `feature:<slug>:handoff` | workspace | Engine | Proposer | Handoff |
| `run:<runId>:record` | control | Runtime root (engine in start mode `standalone`) | All | `specstride.run-state/1` |
| `run:<runId>:terminal` | control | Engine (runtime root after a crash of the engine) | Runtime root, CLI, RunView | `specstride.terminal/1` |
| `run:<runId>:pause` | control | Engine | RunView, CLI, doctor | `specstride.pause/1` |
| `run:<runId>:snapshot` | control | CLI at launch; engine for an accepted change | Engine, CLI, doctor | `specstride.snapshot/1` |
| `run:<runId>:registry` | control | CLI at launch | Engine, doctor | `specstride.registry/1` |
| `run:<runId>:lease` | control | Runtime root (engine in start mode `standalone`) | Engine, CLI, RunView | `specstride.lease/1` |
| `run:<runId>:events` | control | The one event writer | RunView, sinks, CLI | `specstride.event/1` |
| `run:<runId>:events-legacy` | control | Compatibility projection | Oracle, consumers | As-is event vocabulary |
| `run:<runId>:engine-log` | control | Engine | CLI, oracle | Compared log |
| `run:<runId>:view` | control | Runtime | Renderers | `specstride.view/1`, disposable |
| `run:<runId>:status-line` | control | Runtime | Host hook shim | One line, with `validUntil` |
| `run:<runId>:ledger` | control | Engine | Engine, doctor | `specstride.ledger/1` |
| `run:<runId>:ledger-key` | control | Runtime | Engine | Key; never the approval key |
| `run:<runId>:procs` | control | Runtime root, engine (one file per writer) | Runtime, CLI, doctor | `specstride.procs/1` |
| `run:<runId>:verification:plan` | control | Engine at launch | Engine | Verification plan with its hash and the pins |
| `run:<runId>:parallel-plan` | control | Engine at launch | Engine, doctor, pipeline dry run | `specstride.parallel-plan/1` |
| `tree-store` | control | Engine | Engine | Short for `run:<runId>:tree-store` |
| `worker-root` | worker-root | Engine | Engine | Short for the worker root of the run |
| `phase:<N>:manifest` | control | Engine at launch | Engine, fact block, doctor | `specstride.manifest/1` |
| `phase:<N>:protected-set` | control | Engine | Engine | Fingerprints at phase entry |
| `attempt:<N>:<k>:<n>:record` | control | Engine | Engine, CLI | Kind, strategy, session directive, outcome |
| `attempt:<N>:<k>:<n>:evidence` | control | Engine | Engine, CLI, oracle | Phase evidence set aside, with its hash |
| `attempt:<N>:<k>:<n>:verification` | control | Engine | Engine, CLI | Result of the verification gate |
| `attempt:<N>:<k>:<n>:verdict` | control | Engine | Engine, CLI, oracle | Verdict record |
| `attempt:<N>:<k>:<n>:critic-prompt` | control | Engine | CLI, oracle | Prompt of the critic call |
| `attempt:<N>:<k>:<n>:fact-block` | control | Engine | Critic prompt assembler | `specstride.fact-block/1` |
| `attempt:<N>:<k>:<n>:feedback` | control | Engine | Engine, CLI, oracle | Feedback |
| `attempt:<N>:<k>:<n>:hint` | control | Engine | Engine, CLI | Hint of the diagnostician |
| `attempt:<N>:<k>:<n>:acceleration` | control | Engine | Engine | Acceleration note |
| `attempt:<N>:<k>:<n>:session` | control or a location the sandbox lets the harness write; the run never writes session state into the configuration home of the harness | Harness | Harness adapter | Session state; removed when the phase attempt ends. At auth tier 1 no session state is kept in the configuration home by the run; where the harness cannot keep it elsewhere, continuation is off |
| `pass:<passId>:prompt` | control | Engine | CLI, oracle, sinks by reference | Prompt |
| `pass:<passId>:stream` | control | Stream adapter | Engine, CLI | Raw stream |
| `pass:<passId>:invocation` | control | Engine | CLI, oracle | Invocation record |
| `pass:<passId>:usage` | control | Engine | CLI | Usage |
| `pass:<passId>:kill-note` | control | Engine | Engine | Kill note |
| `unit:<unitId>:checkpoint` | control | Engine (moved from the outbox when read) | Engine | Checkpoint |
| `unit:<unitId>:check:<i>` | control | Engine | Engine, fact block | Result per command, fingerprints before and after |
| `job:<jobId>:record` | control | Engine | Engine, CLI | Identity, predicate, step times of a detached job |
| `job:<jobId>:yield` | control | Engine (moved from the outbox when read) | Engine | `specstride-pass-yield/v1` |
| `job:<jobId>:log` | control | The job, through the engine | Engine, CLI | Output, process id and exit code of a detached job |
| `feature:<slug>:failure-ledger` | control | Engine | Engine | Failure signatures of the jobs of a feature, append-only |
| `feature:<slug>:verification:commands` | control | CLI | Engine | The verification-commands document that the derivation of a launch contract wrote |
| `feature:<slug>:verification:test-plan` | workspace (the working tree, outside the workspace part) | Engine | Proposer, consumer | The verification plan for people |
| `feature:<slug>:verification:scaffolds` | workspace (the working tree, outside the workspace part) | Engine | Proposer | Generated test scaffolds and their list |
| `run:<runId>:verification:release` | control | Engine | Engine, CLI | Result of release verification |
| `attempt:<N>:<k>:<n>:prestage` | control | Engine | Engine | Result and logs of commands staged before the verification gate |
| `attempt:<N>:<k>:<n>:critic-invocation` | control | Engine | CLI, oracle | Invocation record of the critic call |
| `attempt:<N>:<k>:<n>:accelerator-snapshot` | control | Engine | Engine | State of the tree before and after an accelerated phase attempt |
| `attempt:<N>:<k>:<n>:accelerator-note` | workspace | Proposer | Engine | Note of the accelerator, as a claim; taken into the acceleration note and removed |
| `phase:<N>:recovery-markers` | control | Engine | Engine | The signatures for which a diagnosis and an acceleration were made |
| `phase:<N>:approved-archive` | control | Engine | CLI | Feedback, hint and acceleration note set aside at approval |
| `phase:<N>:verdict-pins` | control | Engine | Critic prompt assembler | Verdict pins |
| `pass:<passId>:producer-status` | control | Stream adapter | Engine | How the process of the harness ended |
| `pass:<passId>:provider-terminal` | control | Stream adapter | Engine | Terminal record of the stream |
| `pass:<passId>:result` | control | Engine | Engine, CLI, oracle | Result of the invocation, written once |
| `pass:<passId>:response` | control | Stream adapter | CLI | Reply text; may be pruned |
| `run:<runId>:current-pass` | control | Engine | Engine | Which pass is in flight |
| `run:<runId>:span-state` | control | Exporter | Exporter | Open spans of the run |
| `feature:<slug>:learning:observation:<N>` | control | Learning (own writer domain) | Learning | Observation of an approved phase |
| `feature:<slug>:learning:summary` | control | Learning (own writer domain) | Learning, CLI | Summary document |
| `reverse:<slug>:inventory` | control | CLI | Engine, CLI | Source inventory |
| `reverse:<slug>:inventory-summary` | workspace | CLI | Proposer | Source inventory for the proposer |
| `reverse:<slug>:driver` | workspace | CLI | Engine, proposer | Driver spec |
| `reverse:<slug>:verification-commands` | control | CLI | Engine | Verification commands of a reverse run |
| `reverse:<slug>:analysis` | workspace | Proposer | Consumer | Analysis report |
| `reverse:<slug>:output` | workspace (the working tree, outside the workspace part) | Proposer | Consumer | The as-is specification that a reverse run writes |
| `harness:<id>:plugin-request` | workspace | Proposer | Harness adapter | Plugin request of one harness, as a claim |
| `harness:<id>:plugin-installs` | control | Harness adapter | Harness adapter, doctor | Archived requests and receipts |
| `harness:<id>:install-lock` | harness-home | Harness adapter | Harness adapter | Serialises installs |
| `overlay:<id>:tree` | temp | Harness layer | Harness layer | Overlay of a configuration home: marker, environment record, variables, seeds (`specstride-overlay/v1`) |
| `pass:<passId>:prompt-transfer` | temp | Harness adapter | Harness | A prompt handed over as a file |
| `package:templates:<name>` | package | — | Reverse lint | Specification templates shipped with the product |
| `run:<runId>:events-legacy:<k>` | control | Compatibility projection | Oracle, consumers | The as-is event file of the engine start with the ordinal `<k>`. `run:<runId>:events-legacy` resolves to the file of the newest engine start |
| `run:<runId>:engine-log:<k>` | control | Compatibility projection | CLI, oracle | The engine log of the engine start with the ordinal `<k>`, created empty at that start. `run:<runId>:engine-log` resolves to the file of the newest engine start |
| `launch:<launchId>:comment` | control | CLI | Runtime root, digest | The consumer's comment, verbatim and redacted, beside the launch record |
| `attempt:<N>:<k>:<n>:withheld-paths` | control | Engine | Harness adapter of the critic, CLI | `specstride.withheld-paths/1`, one record per critic-class call of the second form |
| `attempt:<N>:<k>:<n>:hidden-files` | control | Engine | Engine | The proposer's files that were moved out for a critic-class call, with the record `specstride.hidden-files/1` |
| `gate:<N>:proofs` | workspace | Proposer | Grounding | Proofs that the proposer puts beside the phase evidence, as claims |
| `package:harness:<id>` | package | — | Harness layer, doctor | A harness descriptor shipped with the product |
| `package:catalogue` | package | — | Harness layer, doctor | The dated snapshot of a model catalogue shipped with the product |
| `package:context-budget` | package | — | Exporter, doctor | The context-budget report of the build |
| `run:<runId>:spend` | control | Engine | Engine, doctor, digest | The spend ledger of the run. RunView is not a reader: it takes spend from the event `usage.reported` (F129-FR-001, F129-FR-020) (assumption: CQ-229) |
| `run:<runId>:task-list` | control | Engine at launch | Engine, loop layers | The task list as read at launch, with the record `specstride.task-list/1` (fields: feature 104, annex B §B.20) |
| `reverse:<slug>:claims:<unit-key>` | workspace | Proposer | Reverse lint | Scratch claims of a reverse run |
| `reverse:<slug>:test-plan` | workspace | Engine | Proposer | The verification plan for people of a reverse run |
| `reverse:<slug>:scaffolds` | workspace | Engine | Proposer | Test scaffolds of a reverse run |
| `pass:<passId>:critic-patch` | temp | Harness adapter | Harness | A file that switches tools off for a critic-class call |
| `feature:<slug>:learning:lock` | control | Lock provider | Learning | The lock of the writer domain of learning |
| `workspace:current:status-line` | control | Runtime | Host hook shim | A pointer to `run:<runId>:status-line` of the current run, at a place that depends on the workspace only, so that a shell shim finds it without starting the product |

- **F100-FR-053**: The table of §B.5 MUST be the complete list of logical names of Wave 1, each with its root, its one writer and its readers. A feature that needs a name the table does not hold MUST NOT invent one: it reports the need, and the name is added here with a new minor of the layout version.
  - test: CT-100-153
  - assumption: CQ-018 (the spelling of every logical name other than `gate:<N>:approved`, `attempt:…:evidence`, `run:<id>:events`, `worker-root` and `tree-store`, which the sources give)

- **F100-FR-054**: The five compared logs and records of the as-is pipeline runtime and supervisor, and the engine log, MUST have the logical names `pipeline:<pipelineId>:launcher-log`, `pipeline:<pipelineId>:report-log`, `pipeline:<pipelineId>:launch-log`, `pipeline:<pipelineId>:harness-run` and `run:<runId>:engine-log`. The compatibility projection MUST write them as files, so that the oracle compares them by logical name. The engine log MUST be written once per engine start, under `run:<runId>:engine-log:<k>`, and the bare name `run:<runId>:engine-log` MUST resolve to the newest engine start, as for `run:<runId>:events-legacy:<k>` (F100-FR-229).
  - test: CT-100-154
  - parity: written (the compatibility projection is on) (row 17 of annex X §X.7)

- **F100-FR-055**: The names `workspace:current:events` and `workspace:current:engine-log` MUST resolve to the event file and the engine log of the newest engine start of the workspace, and the state of a feature MUST be reachable under the feature slug. They take the place of the as-is links at the top of the state directory and of the as-is directories per feature and per run.
  - origin: C-011; B-0157; B-0165; B-0167; B-0168
  - disposition: translated
  - test: PT-100-C-011-*
  - divergence: DV-006

- **F100-FR-056**: The old side of the layout table (as-is path to logical name, for each of the two baselines) MUST be part of the normalization contract of annex X §X.8, fixed by the `file` rows of the behaviour inventory. It MUST map the as-is approval marker to `gate:<N>:approved`.
  - divergence: DV-006; DV-029
  - test: CT-100-156

- **F100-FR-057**: At the start of every phase the engine MUST look for a stray notebook of the proposer at the two as-is stray places (the directory of the phase evidence and the root of the working tree) and move it to `feature:<slug>:notebook`. The newer file wins: the stray file is deleted when the canonical file is newer, and replaces it otherwise. The engine MUST write the as-is log line of the sweep with both paths.
  - origin: C-013; B-0256; C-012; B-0194
  - disposition: ported
  - test: PT-100-C-013-*; PT-100-C-012-*

- **F100-FR-058**: For every sweep of F100-FR-057 the engine MUST emit the event `progress.swept`, and the compatibility projection MUST render it as the as-is event of the sweep with the fields `from` (the stray path) and `to` (the canonical path).
  - origin: C-008; B-0085
  - disposition: translated
  - test: PT-100-C-008-*
  - divergence: DV-007

- **F100-FR-229**: The as-is event file MUST be written once per engine start, under `run:<runId>:events-legacy:<k>`. The consumer's comment MUST be kept verbatim, after redaction, under `launch:<launchId>:comment`, and the launch record MUST hold only its hash. A shell shim of a host MUST find the precomputed status line through `workspace:current:status-line`, whose place depends on the real path of the workspace only.
  - test: CT-100-329
  - divergence: DV-007
  - assumption: CQ-033; CQ-038

## §B.6 Workspace record

| Subject | Content |
|---|---|
| Schema id | `specstride.layout/1` |
| Logical name | `workspace:record` |
| Writer | Runtime root (engine in start mode `standalone`), at the first launch in the workspace |
| Readers | All |
| Content owner | 100 |

| Field | Meaning | Type in words | Required |
|---|---|---|---|
| `schema` | Schema id | Text | Yes |
| `layoutVersion` | Version of the layout table | Major and minor, as text | Yes |
| `workspaceId` | Identifier of §B.3 | Text | Yes |
| `realPath` | Real path of the workspace root at creation | Text | Yes |
| `createdAt` | Time of creation | Timestamp, UTC | Yes |
| `productVersion` | Product version that created the record | Text | Yes |
| `lockProvider` | Id and version of the lock provider that first acquired the lock | Record of two texts | Yes |

- **F100-FR-059**: The workspace record MUST hold the fields above. A launch whose lock provider differs from the recorded one MUST be refused with a doctor finding. A launch in a workspace whose spec shows ticked phases that have no approval record MUST be refused and MUST name the commands `state export`, `state import` and `state adopt`.
  - test: CT-100-159

## §B.7 Launch record

| Subject | Content |
|---|---|
| Schema id | `specstride.launch/1` |
| Logical name | `launch:<launchId>:record` |
| Writer | CLI (`launch`, `resume`, `supervise relaunch`); the runtime root for a relaunch it performs |
| Readers | Runtime root, CLI, doctor, RunView |
| Content owner | 122. It may add fields about the detach strategy |

| Field | Meaning | Type in words | Required |
|---|---|---|---|
| `schema` | Schema id | Text | Yes |
| `launchId`, `runId`, `workspaceId` | Identifiers | Text | Yes |
| `requestKind` | `pipeline` or `engine` (§F.2) | Member of a closed set | Yes |
| `request` | For `pipeline`: pipeline id and hash of the launch bundle. For `engine`: the argument list of the one engine start | Record | Yes |
| `mode` | `run`. The mode `dry-run` writes no launch record and no run state | Member of a closed set | Yes |
| `reason` | `first`, `resume`, `relaunch` or `manual` | Member of a closed set | Yes |
| `host` | The host that launched: a host id, or `cli` | Text | Yes |
| `commentHash` | Hash of the consumer's comment, taken before any repository text was printed | Text, or null | Yes |
| `detachStrategy` | Id of the detach strategy in use | Text | Yes |
| `launchNonce` | Nonce that the lease must carry | Text | Yes |
| `engineExecutable` | Path and hash of the engine executable pinned at launch | Record | Yes |
| `createdAt` | Time of the launch | Timestamp, UTC | Yes |
| `productVersion`, `protocol` | Product version and CLI protocol integer of the launching CLI | Text, whole number | Yes |
| `outcome` | Handshake outcome: `started`, `attached` or `refused`; absent until the handshake ends | Member of a closed set | No |
| `refusal` | Reason of a refusal, from the closed sets of the refusals of a launch and of `resume` | Text | No |
| `refusalFile` | The file that changed, when the refusal is `source-changed` | Text | No |
| `resetCounts`, `acceptSourceChange`, `newRun`, `resolveRoles` | The flags of the command that made the launch, so that a continuation through the runtime root can apply them | Truth values | No, default false |

- **F100-FR-060**: The launch record MUST hold the fields above and MUST be written before the detach strategy is called. A launch record older than the handshake limit that has no `outcome` and no lease with its nonce MUST be derived by readers as `launch-abandoned`, shown as an attention item, and closed by the next launch.
  - test: CT-100-160
  - assumption: CQ-019 (fields beyond mode, comment hash, detach strategy and launch nonce, which the sources name)

## §B.8 Lease

| Subject | Content |
|---|---|
| Schema id | `specstride.lease/1` |
| Logical name | `run:<runId>:lease` |
| Writer | Runtime root (engine in start mode `standalone`) |
| Readers | Engine (at every boundary), CLI, RunView, doctor |
| Content owner | 122 |

| Field | Meaning | Type in words | Required |
|---|---|---|---|
| `schema` | Schema id | Text | Yes |
| `runId`, `launchId` | Identifiers | Text | Yes |
| `launchNonce` | The nonce of the launch record | Text | Yes |
| `owner` | The owner record of §B.9 | Record | Yes |
| `lockProvider` | Id of the lock provider | Text | Yes |
| `heartbeatAt` | Time of the last heartbeat | Timestamp, UTC | Yes |
| `heartbeatEverySeconds` | Interval of the heartbeat | Whole number | Yes |
| `validUntil` | Heartbeat plus grace; after it a precomputed status line is stale | Timestamp, UTC | Yes |
| `leaseTokenHash` | Hash of the token handed down to the engine | Text | Yes |

- **F100-FR-061**: The lease MUST hold the fields above. Liveness MUST be read from the lease through the lock provider and MUST never be an event. A reader MUST derive `dead` when the run record shows a live state and the lease has no live owner, and `stale` when the owner lives and both the heartbeat and the newest event are old.
  - test: CT-100-161
  - ep: EP-13 `specstride.lock/1` (consumes)

## §B.9 Owner record

| Field | Meaning | Type in words | Required |
|---|---|---|---|
| `pid` | Process id | Whole number | Yes |
| `processGroup` | Process group id | Whole number | Yes |
| `startTime` | Start time of the process, from the operating system | Text | Yes |
| `bootId` | Identity of the boot | Text | Yes |
| `hostName` | Host name | Text | Yes |
| `pidNamespace` | Identity of the pid namespace | Text, or null | Yes |
| `launchId` | Identifier | Text | Yes |
| `runTokenHash` | Hash of the run token | Text | Yes |

- **F100-FR-062**: The owner record MUST hold the fields above. It is part of the lease, of the lock and of the advisory marker. A lock MUST never exist without an owner record.
  - test: CT-100-162
  - status: unverified (check: resolution of the process start time and the boot identity on macOS; verified-on: —; pin: —)

## §B.10 Process registry

| Subject | Content |
|---|---|
| Schema id | `specstride.procs/1` |
| Logical name | `run:<runId>:procs` |
| Writer | The process that started the child: the runtime root for the engine and for stage children, the engine for every other child. One file per writer |
| Readers | Runtime, CLI (`stop --now`, `status`, `resume`), doctor |
| Content owner | 122 |

| Field | Meaning | Type in words | Required |
|---|---|---|---|
| `schema` | Schema id | Text | Yes |
| `procId` | Identifier of the entry | Text | Yes |
| `class` | `owned` or `adoptable` | Member of a closed set | Yes |
| `kind` | `engine`, `stage-child`, `harness-pass`, `critic-call`, `check`, `detached-job`, `worker-pass` | Member of a closed set | Yes |
| `pid`, `processGroup`, `processSession` | Identity from the operating system | Whole numbers | Yes |
| `startTime` | Start time of the process | Text | Yes |
| `runTokenHash` | Hash of the run token that the process holds in its environment | Text | Yes |
| `runId`, `engineStartId` | Identifiers | Text | Yes |
| `attemptId`, `passId`, `jobId`, `workerId` | Identifiers, where they apply | Text | No |
| `startedAt`, `endedAt` | Times | Timestamp, UTC | `startedAt` yes |
| `endCause` | How the process ended | Text | No |

- **F100-FR-063**: The process registry MUST hold one entry per child process, with the fields above. Processes of a pass, of a critic-class call, of a check, of a stage and of a worker MUST be of class `owned`. The detached job of an accepted yield and a long verification job MUST be of class `adoptable`, with the kind `detached-job`; no process of a worker is ever `adoptable`.
  - test: CT-100-163

- **F100-FR-064**: A stop and `stop --now` MUST end `owned` processes only, and only after pid, start time and run token all match. An `adoptable` process MUST survive a stop, MUST NOT make the lock provider report `owner-dead-group-alive`, and MUST be adopted by the next engine start; ending one MUST be a separate, explicit request. When the engine exits for any cause, the runtime root MUST end every `owned` process before it relaunches or rests.
  - test: CT-100-164

## §B.11 Inbox requests

| Subject | Content |
|---|---|
| Schema id | `specstride.inbox/1` |
| Logical names | `inbox:stop`, `inbox:hold-relaunch`, `inbox:host-events:<launchId>` |
| Writer | CLI |
| Readers | Engine (stop, host events), runtime root (stop, hold-relaunch) |
| Content owner | 122 for the mechanism; 102 for `stop`; 123 for `hold-relaunch`; host events are written on behalf of the host by 113 and read by 127 |

Request types are a closed set: `stop`, `hold-relaunch`, `host-event`.

| Type | Field | Meaning | Type in words | Required |
|---|---|---|---|---|
| all | `schema`, `type`, `at` | Schema id, request type, time of the request | Text, member of the closed set, timestamp | Yes, except in the empty stop request |
| all | `runTokenHash` | Hash of the run token, when a run was active | Text | No |
| `stop` | `now` | End owned processes at once | Truth value | No, default false |
| `stop` | `jobs` | Also end adoptable jobs | Truth value | No, default false |
| `stop` | `causedBy` | Who asked: `operator` for every request of Wave 1 | Member of the closed set of the terminal record | No, default `operator` |
| `hold-relaunch` | `hold` | True holds every relaunch by the runtime root; false lifts the hold | Truth value | Yes |
| `hold-relaunch` | `reason` | Why, for the digest | Text, redacted | No |
| `host-event` | `kind` | What the host observed, for example a limit of the host | Text | Yes |
| `host-event` | `data` | Facts of the observation, redacted | Record | No |

- **F100-FR-065**: The inbox MUST accept exactly the three request types above. An empty stop request MUST mean a clean stop with every default. The engine MUST read the stop request at the boundaries of the baseline and during a pass, and MUST remove it when it honours it. A host event MUST inform only: it never pauses, stops or relaunches a run by itself.
  - test: CT-100-165
  - assumption: CQ-019 (field names of the three request types)

## §B.12 Run snapshot

| Subject | Content |
|---|---|
| Schema id | `specstride.snapshot/1` |
| Logical name | `run:<runId>:snapshot` |
| Writer | CLI at launch, before the first pass; the engine when an intended change of a source is accepted |
| Readers | Engine, CLI (`resume`, `status`), doctor, digest |
| Content owner | 102. The hashing and the staleness verdict: 104. The keys themselves: 110 |

| Field | Meaning | Type in words | Required |
|---|---|---|---|
| `schema` | Schema id | Text | Yes |
| `runId` | Identifier | Text | Yes |
| `createdAt` | Time of the first write | Timestamp, UTC | Yes |
| `profile` | Name of the profile in force, or null | Text, or null | Yes |
| `keys` | For every resolved configuration key: `value`, `source` (rank of §X.2), `class` (`pinned` or `tunable`), and for a learned value the id of the decision | Map from key to record | Yes |
| `sourceHashes` | For each of the files `spec`, `plan`, `tasks`: logical path, content hash, and for `tasks` also the hash that ignores checkboxes | Map from file to record | Yes |
| `acceptedChanges` | Every intended change accepted on `resume`: time, file, old hash, new hash | List of records | No |

- **F100-FR-066**: The run snapshot MUST hold every resolved key with its source and its class, and the source hashes of the run as pinned values. A failed write of the snapshot MUST be a launch error. Secret references MUST be stored as references. On `resume`, a pinned key MUST rank below flags and above the environment, and a tunable key MUST rank below the environment.
  - divergence: DV-024
  - test: CT-100-166

- **F100-FR-067**: The source hashes MUST be compared with the snapshot at launch of a continued run, at `resume` and at the start of every pass. For the task list the hash that ignores checkboxes MUST be the one compared. A change MUST stop the run with the blocked-on-human signal, name the file, and leave phase evidence that was delivered in place. Under the `parity` profile the three check points MUST NOT be active, and the plan MUST be checked when the critic starts, as at the baseline.
  - divergence: DV-082
  - parity: check at critic start only (row 15 of annex X §X.7)
  - test: CT-100-167

## §B.13 Ledger

| Subject | Content |
|---|---|
| Schema id | `specstride.ledger/1` |
| Logical name | `run:<runId>:ledger` |
| Writer | Engine. A loop layer appends through the engine, in its own namespace |
| Readers | Engine, loop layers (their namespace, and a read-only view of the rest), doctor |
| Content owner | 103 for the envelope and the namespace `core`. Each loop layer owns the record kinds of its namespace (115: `micro`; 143: `parallel`, the namespace of the layer of 142, whose records the engine services write) and lists them as a closed set in its own specification |

| Field | Meaning | Type in words | Required |
|---|---|---|---|
| `schema` | Schema id | Text | Yes |
| `seq` | Position in the ledger, from 1, without gaps | Whole number | Yes |
| `prev` | Hash of the record before | Text | Yes |
| `sig` | Signature over the record, made with the ledger key | Text | Yes |
| `ts` | Time of the append | Timestamp, UTC | Yes |
| `runId`, `engineStartId` | Identifiers | Text | Yes |
| `phase`, `attemptId`, `passId`, `unitId` | Identifiers, where they apply | Whole number, text | No |
| `workerId`, `groupId` | Identifiers, only in the namespace `parallel` | Text | No |
| `ns` | Namespace: `core` or the id of a loop layer | Text | Yes |
| `kind` | Record kind, from the closed set of the namespace | Text | Yes |
| `counters` | In the namespace `core`: reject count, ordinal of the phase attempt, MALFORMED streak, pass index, yield index, the consecutive breakers, as they stand after this record | Record of whole numbers | In `core` |
| `treeHash` | Fingerprint of the tree the record is bound to | Text | No |
| `sessionId` | Session of the pass | Text | No |
| `data` | Content of the kind | Record | No |

- **F100-FR-068**: A run MUST have one ledger: append-only, every record chained to the one before and signed with a key that is not the approval key. With every loop layer off it MUST hold at least one record per phase attempt. A truncated, reordered or edited ledger MUST be detected; the effect is that every loop layer is off for the phase attempt, and never a stop.
  - test: CT-100-168
  - assumption: CQ-019 (field names of the envelope; the sources name the properties and the fields `pass_id`, `attempt_id`, `tree_hash`, check durations and `session_id`)

- **F100-FR-069**: The counts that limit a run MUST live in the ledger and MUST continue across a resume and a relaunch: reject counts, ordinals of phase attempts, the MALFORMED streak, pass index, yield index, the consecutive breakers, and the counters of every loop layer. The oscillation window MUST be keyed by the sequence of phase attempts. `--reset-counts` MUST reset them all and MUST be recorded.
  - divergence: DV-011; DV-044
  - parity: resume fixtures pass `--reset-counts` (row 13 of annex X §X.7)
  - test: CT-100-169

## §B.14 Approval record

| Subject | Content |
|---|---|
| Schema id | `specstride.approval/1` |
| Logical name | `gate:<N>:approved` |
| Writer | Engine, on a verdict APPROVED, after the verification gate |
| Readers | Engine (`resume`, phase entry), CLI, doctor, `state export` |
| Content owner | 101. It may add bound facts; it may not remove one |

| Field | Meaning | Type in words | Required |
|---|---|---|---|
| `schema` | Schema id | Text | Yes |
| `feature`, `phase` | Feature slug and phase number | Text, whole number | Yes |
| `runId`, `engineStartId`, `attemptId` | Identifiers | Text | Yes |
| `verdictId` | The verdict the approval rests on | Text | Yes |
| `nonceHash` | Hash of the nonce of the critic call | Text | Yes |
| `critic` | Harness, provider, model, form of the `completion` level, result of the tool-less proof | Record | Yes |
| `evidenceHash` | Hash of the phase evidence that was judged | Text | Yes |
| `verification` | Mode and hash of the result of the verification gate | Record | Yes |
| `treeFingerprint` | Fingerprint of the tree at the phase gate | Text | Yes |
| `approvedAt` | Time | Timestamp, UTC | Yes |
| `keyId` | Which approval key signed | Text | Yes |
| `sig` | Signature over every field above | Text | Yes |

- **F100-FR-070**: The runtime MUST accept an approval only from a record it wrote itself, signed with the approval key of the feature and bound to the verdict, the hash of the phase evidence, the result of the verification gate and the tree fingerprint. `resume` MUST verify the signature and every binding; a record that fails, and a bare marker without a record, MUST count as not approved and MUST raise an integrity event. Approval records MUST survive runs.
  - divergence: DV-029
  - test: CT-100-170

## §B.15 Terminal record

| Subject | Content |
|---|---|
| Schema id | `specstride.terminal/1` |
| Logical name | `run:<runId>:terminal` |
| Writer | Engine, before it exits. The runtime root writes it, marked `synthesized`, when the engine ended without one |
| Readers | Runtime root, both relaunch classifier tables, pipeline stage executor, CLI, RunView |
| Content owner | 101. It may add fields; the five fields marked "fixed" may not change |

| Field | Meaning | Type in words | Required |
|---|---|---|---|
| `schema` | Schema id | Text | Yes |
| `exitCode` (fixed) | Code of the engine, from §E.4 | Whole number | Yes |
| `stopReason` (fixed) | Member of the enumeration of §E.3, or null when the exit has no member (annex E §E.3, F100-FR-148) | Member of a closed set, or null | Yes |
| `retryable` (fixed) | Whether this stop may be relaunched. Decided for this stop, never above the `transient` attribute of its stop reason | Truth value | Yes |
| `cause` (fixed) | `normal`, `crash` or `owner-lost` | Member of a closed set | Yes |
| `causedBy` (fixed) | `self`, `operator`, `supervisor`, `host` or `crash` | Member of a closed set | Yes |
| `blocked` | When the run rests blocked on a human: reason from the closed set of §E.2, what is needed, the file that changed | Record | No |
| `runId`, `launchId`, `engineStartId` | Identifiers | Text | Yes |
| `phase`, `attemptId` | Where the run stood | Whole number, text | No |
| `at` | Time | Timestamp, UTC | Yes |
| `synthesized` | True when the runtime root wrote the record | Truth value | Yes |
| `verificationParallelism` | The parallelism of verification commands in force at the exit, when the engine lowered it below the configured value (F148-FR-014) | Whole number | No |

- **F100-FR-071**: The engine MUST write the terminal record before it exits, on every exit path. The runtime root, the pipeline stage executor and both relaunch classifier tables MUST read the record and MUST NOT match a stop reason by string in the event file. When the record is missing they MUST classify the end as a crash from the exit code and write a synthesized record.
  - divergence: DV-028
  - test: CT-100-171

## §B.16 Supervision record

| Subject | Content |
|---|---|
| Schema id | `specstride.supervision/1` |
| Logical name | `launch:<launchId>:supervision` |
| Writer | CLI (`supervise` verbs) |
| Readers | CLI, RunView, compatibility projection (for `pipeline:<pipelineId>:harness-run`) |
| Content owner | 123 |

| Field | Meaning | Type in words | Required |
|---|---|---|---|
| `schema` | Schema id | Text | Yes |
| `launchId`, `pipelineId` | Identifiers | Text | Yes |
| `interval` | Current polling interval | Whole number of seconds | Yes |
| `unchanged` | Count of readings without a change | Whole number | Yes |
| `signature` | Signature of the last observation | Text | Yes |
| `stopRequested` | Signal and time of a stop asked through `supervise stop` | Record | No |
| `relaunchBudget` | Maximum, remaining, wall-clock seconds, deadline, declared pipeline seconds, source | Record | With `relaunch.owner: supervise` |
| `relaunches` | One entry per relaunch with its justification | List of records | With `relaunch.owner: supervise` |

- **F100-FR-072**: The cadence state of supervision and, with `relaunch.owner: supervise`, the relaunch budget and the list of relaunches MUST be kept in the supervision record, written by the CLI. It is the only file of run-related state that the CLI writes after launch, apart from inbox requests.
  - test: CT-100-172

## §B.17 Pause record

| Subject | Content |
|---|---|
| Schema id | `specstride.pause/1` |
| Logical name | `run:<runId>:pause` |
| Writer | Engine |
| Readers | RunView, CLI, doctor, engine after a restart |
| Content owner | 127 |

| Field | Meaning | Type in words | Required |
|---|---|---|---|
| `schema` | Schema id | Text | Yes |
| `runId`, `attemptId` | Identifiers | Text | Yes |
| `role` | The role that waits | Text, from the role registry | Yes |
| `harness` | Harness of the role | Text | Yes |
| `class` | Class of the quota classifier that caused the pause | Member of the closed set of §C.13 | Yes |
| `confidence` | Confidence of the classification | Member of the closed set of §C.13 | Yes |
| `since` | Start of the pause | Timestamp, UTC | Yes |
| `resetsAt` | When the provider's window resets, or null | Timestamp, or null | Yes |
| `resumeAt` | When the run will try again | Timestamp, or null | Yes |
| `probeIndex` | Position in the probe schedule | Whole number | Yes |
| `ceilingAt` | When the wait ceiling is reached | Timestamp, UTC | Yes |

- **F100-FR-073**: The pause record MUST exist exactly while the run is in the state `paused-quota`, and there MUST be one per run whatever the number of workers. A start of the engine that finds a pause record MUST enter the pause again and compute the remaining wait from `resumeAt` and `ceilingAt`, never from a timer.
  - divergence: DV-005
  - test: CT-100-173

## §B.18 Tripwire record

| Subject | Content |
|---|---|
| Schema id | `specstride.tripwire/1` |
| Logical name | `user:tripwire` |
| Writer | Runtime (the only write the runtime makes to user-level state) |
| Readers | Runtime at launch, doctor, CLI |
| Content owner | 115 |

| Field | Meaning | Type in words | Required |
|---|---|---|---|
| `schema` | Schema id | Text | Yes |
| `raisedAt` | Time | Timestamp, UTC | Yes |
| `workspaceId`, `runId` | Where the breach was found | Text | Yes |
| `kind` | Kind of the breach of integrity of the phase gate | Member of the closed set of breach kinds (annex X §X.6 row 141) | Yes |
| `ruleId` | The rule that found it | Text | Yes |
| `productVersion` | Product version | Text | Yes |

- **F100-FR-074**: On a breach of the integrity of the phase gate the runtime MUST write the tripwire record. While it exists, every run on the machine MUST run with every loop layer off, announced, until the operator clears the tripwire by a command. Clearing MUST remove the record and MUST be recorded as an event in the next run.
  - test: CT-100-174
  - assumption: CQ-019 (field names)

## §B.19 State export, import and adopt

- **F100-FR-075**: The control plane of a feature MUST be movable: `state export` writes a signed archive (schema id `specstride.state-archive/1`) of the approval records, the ledger and the learning log of one feature; `state import` verifies and installs it; `state adopt` takes over the control plane of the same working tree at an old path. The three commands MUST NOT run while a run of the feature is alive.
  - test: CT-100-175


## §B.20 Further schema ids

Records that one feature writes and that other features read by logical name only. Feature 100
fixes the schema id, the logical name and the owner. The fields are in the specification of the
owner, and the common rules of §B.4 hold for each.

| Schema id | Record | Logical name | Owner |
|---|---|---|---|
| `specstride.hidden-files/1` | What was moved out of the working tree for a critic-class call, and where it is kept | `attempt:<N>:<k>:<n>:hidden-files` | 117 |
| `specstride.checkpoint/1` | A checkpoint, as read from the outbox | `unit:<unitId>:checkpoint` | 115 |
| `specstride.protected-set/1` | The protected set of a phase with its fingerprints | `phase:<N>:protected-set` | 116 |
| `specstride.check-result/1` | The result of one inner check | `unit:<unitId>:check:<i>` | 116 |
| `specstride.invocation/1` | The invocation record of a pass (as-is name `specstride-invocation/v1`) | `pass:<passId>:invocation` | 126 |
| `specstride.producer-status/1` | How the process of the harness ended (as-is name `specstride-producer-status/v1`) | `pass:<passId>:producer-status` | 126 |
| `specstride.provider-terminal/1` | The terminal record of the stream (as-is name `specstride-provider-terminal/v1`) | `pass:<passId>:provider-terminal` | 126 |
| `specstride.invocation-result/1` | The result of an invocation, written once | `pass:<passId>:result` | 126 |
| `specstride.harness-verify/1` | The result of `harness verify` | `user:harness-verify:<id>` | 146 |
| `specstride.retrospective/1` | The retrospective of a pipeline (as-is name `mol.retrospective/1`) | `pipeline:<pipelineId>:retrospective:<hash>` | 106 |
| `specstride.learn.applied/2` | An entry of the decision log of learning, one per line, byte format kept (as-is id the same; entries of `/1` are read) | `feature:<slug>:learning:decisions` | 106 |
| `specstride.learn.summary/7` | The metric summary of the runs of a feature (as-is id the same) | `feature:<slug>:learning:summary` | 106 |
| `specstride.learn.observation/1` | The observation of an approved phase (as-is id the same) | `feature:<slug>:learning:observation:<N>` | 106 |
| `specstride.state-archive/1` | The archive of `state export` | — (a file the consumer names) | 122 |
| `specstride.reverse-inventory/1` | The source inventory of a reverse run, with the walk rules and the fingerprint that made it | `reverse:<slug>:inventory` | 140 |
| `specstride.spend/1` | A record of the spend ledger | `run:<runId>:spend` | 127 |
| `specstride.inspect.<verb>/1` | The `--json` record of an inspection command | — (output) | 119 |
| `specstride.span-state/1` | The open spans of a run: the trace id and the stack of open scopes | `run:<runId>:span-state` | 128 |
| `specstride.task-list/1` | The task list as read at launch: per phase its tasks (id, markers, text) in order and the canonical record hash of the phase | `run:<runId>:task-list` | 104 |
| `urn:specstride:schema:internal:130:plugin-request/1` | The request record of a plugin call of dsh (as-is id `specstride-dsh-plugin-request/v1`) | — (internal to feature 130; no reader outside it) | 130 |
| `urn:specstride:schema:internal:130:plugin-install/1` | The result record of a plugin installation of dsh (as-is id `specstride-dsh-plugin-install/v1`) | — (internal to feature 130; no reader outside it) | 130 |

The two records of feature 130 above are no contract of the `contracts` package: they are internal
to one adapter, so they carry the internal form `urn:specstride:schema:internal:130:<name>/1`
instead of a `specstride.*` id, and they hold no logical name. The common rules of §B.4 hold for
them as for the rest of the table.

- **F100-FR-227**: Every record of the table of §B.20 MUST carry its schema id and follow the common rules of §B.4. The feature named as owner MUST list the fields in its specification and deliver the schema file to the `contracts` package. A feature that reads such a record MUST read it by its logical name and through its schema, and MUST NOT depend on a field that the owner's specification does not list. In compatibility output and in the compatibility projection the as-is name of a record MUST be written where the baseline writes it.
  - test: CT-100-327
  - assumption: CQ-105; CQ-114 (the schema ids; the queue recommends that feature 100 gives them)
