# Annex D — Pass loop (L3)

Part of the specification of feature `100-specstride`. Normative.

This annex holds the interfaces of three extension points (EP-04, EP-06, EP-15), the tree-store
service, and the schemas of the parallel plan, the yield artifact, the fact block and the check
manifest. The common rules of annex A §A.4 hold for every point.

How to cite: "annex D, §D.1 EP-04 Loop-layer interface, F100-FR-114".

## §D.1 EP-04 Loop-layer interface

#### Id and version
`specstride.loop-layer/1`.

#### Purpose
To let a kind of loop work inside a phase attempt of the one engine, between the passes of the
proposer, without being able to touch the phase gate. The classic loop is the engine with the
layer `none`.

#### Caller and time
The engine calls a layer at eight fixed call points of a phase attempt. After a pass the order is
fixed: kill check, yield check, layer, classic accounting.

| # | Call point | When | What the layer returns |
|---|---|---|---|
| 1 | `contributePrompt` | Before a pass, when the prompt is assembled | Prompt blocks (the form of §D.5) |
| 2 | `afterPass` | After a pass has exited | `accept`, `refuse` or `none`, for the checkpoint found in the outbox |
| 3 | `betweenPasses` | While no session is open | An outcome with directives |
| 4 | `nextPassBlock` | Before the next pass | The block for the next pass, or `none` |
| 5 | `onEvidence` | When phase evidence appears | Whether a closing check runs, or `none` |
| 6 | `contributeCriticInput` | Before the critic prompt is assembled | The rows of the fact block (§D.7), or `none` |
| 7 | `resume` | At a start of the engine inside a phase attempt | What to do with open work, from the state of the ledger |
| 8 | `report` | At the end of the run | The fields of the `[LOOP]` line |

#### Inputs
A read-only view of the phase attempt (counters, check manifest, fingerprints, and with parallel
units on `workerId` and `groupId`); a namespace of the layer's own in the ledger, written through
the engine; the working directory as a parameter; the check runner; a handle on the router; the
services the layer declared and the engine offers.

#### Outputs
Directives from a closed set, executed and accounted by the engine:

| Directive | Meaning |
|---|---|
| `keep` | The unit of work is kept: a ledger record bound to the tree fingerprint |
| `repair` | The proposer gets the output of the check on the current tree |
| `unresolved` | The unit stays as it is; the tree is not touched |
| `layerOffForAttempt` | The layer is off for the rest of the phase attempt |
| `layerOffForRun` | The layer is off for the rest of the run |
| `giveIterationBack` | The pass is given back: it does not count towards the pass limit. The literal keeps the retired word |
| `exemptShortPass` | The pass leaves the short-pass counter as it was |
| `exemptRepeatCounter` | The exact argument lists of the inner check set are exempt from the process-level repeat counter |
| `requestPass` | The engine runs one pass: prompt block, working directory, session directive, time limit, worker id |
| `requestPassGroup` | The engine runs a list of `requestPass` with a concurrency limit and returns when every pass has ended |
| `integrateGroup` | The engine integrates the results of a group through the tree-store service (§D.2). It carries, per worker, `accepted` or the refusal reason, which is how the verdicts of the audits of feature 142 reach the engine before `compose` |

The engine reports to the layer, and the layer acts on, four further facts: a missing object in the
tree store, a changed ledger, an application of a group that was not completed, and a harness
adapter that declares no spending limit (features 143 and 142).

#### Errors
A thrown error, an invalid ledger, a spent cap and a check that cannot start. Each switches the
layer off for the phase attempt. None stops a run.

#### Guarantees of the core
The order after a pass is fixed. With the layer `none`, and with a layer that never engages,
output is identical to the classic loop apart from the fields the divergence register names. The
strategy is pinned at launch and recorded per run and per phase attempt. Withheld from every
layer by construction: every writer of the phase gate (approval, verdict, feedback, hint, recovery
markers); every counter of the outer loop; a harness handle; the event writer and the ledger
writer; the project's repository; any path of the workspace or of a worker tree as a writable
handle.

#### Guarantees of an implementation
A layer declares at registration the directives and the services it uses. It holds no state
outside its ledger namespace. It adds nothing to a prompt and executes nothing in a phase attempt
in which no unit of work was declared, apart from its protocol block. It reveals nothing to the
critic beyond the fact block.

#### Failure of an implementation
The layer is off for the phase attempt and the classic loop carries on, announced and recorded. A
failure of the application of a group switches the layer off for the run. No exit code and no stop
reason results.

#### Unknown-value rule
A directive or a service that the engine does not offer refuses the layer at registration; a new
directive is therefore a minor version. An unknown return value at a call point is read as `none`
and switches the layer off for the phase attempt.

#### Wave 1 implementations
`none` (built in, the classic loop); `micro` (on by default where the verification gate
executes); `parallel`, stacked above `micro`, as an option that is off by default. Reserved and
not built: `autoresearch`.

#### Content owner
103. The implementation `micro`: 115. The implementation `parallel`: 142. The engine services
behind the group directives: 143.

#### Proving test
(i) The inertness suite: every fixture of the oracle with the layer on and stub agents that never
declare a unit of work. (ii) A sample layer `noop` in the test tree passes the whole oracle.
(iii) A second sample layer stacks above `noop`, requests a group of two stub passes and
integrates them, and the whole oracle still passes with the sample unregistered. (iv) Static: the
package of a layer imports no writer of the phase gate, and the build fails if a core file names
`micro` or `parallel`.

- **F100-FR-114**: The loop-layer interface MUST have the eight call points of §D.1, called by the engine in the fixed order, and the closed set of directives of §D.1. The engine, and never a layer, MUST execute and account for every directive.
  - test: CT-100-214
  - ep: EP-04 `specstride.loop-layer/1` (implements)

- **F100-FR-115**: Layers MUST stack in a fixed order, to a depth of at most 2 in Wave 1. At every call point the outer layer MUST be called first and the inner layer only when the outer one returns `none`. Each layer MUST have a ledger namespace of its own.
  - test: CT-100-215
  - ep: EP-04 `specstride.loop-layer/1` (implements)

- **F100-FR-116**: A layer MUST declare the directives and the services it uses. The engine MUST refuse at registration a layer that declares one the engine does not offer. The harness port MUST declare `concurrentSessions`; a group MUST run only on a tested harness adapter that declares it.
  - test: CT-100-216
  - ep: EP-04 `specstride.loop-layer/1` (implements)

- **F100-FR-117**: A layer MUST NOT be able to write an approval, a verdict, feedback, a hint or a recovery marker; to change a counter of the outer loop; to hold a harness; to write an event or a ledger record except through the engine; or to write the project's repository. The build MUST prove it on the package graph of every layer.
  - test: CT-100-217
  - ep: EP-04 `specstride.loop-layer/1` (implements)

- **F100-FR-118**: With no unit of work declared in a phase attempt, a layer MUST execute nothing and MUST add nothing to any prompt but its protocol block; until the layer is engaged, a time limit of a pass and a command of the runtime MUST NOT differ from the classic loop. In a run whose verification gate does not execute (mode `plan` or `off`) the layer MUST be off, announced with the reason `gate-not-executing`.
  - divergence: DV-012; DV-020; DV-053
  - parity: `loop.strategy` is `classic` (row 1 of annex X §X.7)
  - test: CT-100-218
  - ep: EP-04 `specstride.loop-layer/1` (implements)

- **F100-FR-119**: A pass that ends at a valid checkpoint MUST leave the short-pass counter as it was; a pass with a valid checkpoint and a changed tree MUST be given back, so that it does not raise the pass count, and MUST spend one cycle of the layer's own cap; the exact argument lists of the inner check set MUST be exempt from the process-level repeat counter. A worker pass MUST be outside the pass loop, MUST spend no pass of the pass limit and MUST change no counter of the outer loop.
  - divergence: DV-013; DV-014; DV-015
  - parity: not observable (the layer is off) (row 1 of annex X §X.7)
  - test: CT-100-219
  - ep: EP-04 `specstride.loop-layer/1` (implements)

- **F100-FR-120**: The closing check MUST be its own switch, `loop.micro.closing_check`, on by default. It MUST run only in a phase attempt in which a unit of work was declared, inside the cycle cap, and MUST return the proposer to work at most twice. From the moment phase evidence exists, a limit or a breaker of the pass loop MUST NOT stop the run.
  - divergence: DV-046
  - parity: off (row 2 of annex X §X.7)
  - test: CT-100-220
  - ep: EP-04 `specstride.loop-layer/1` (consumes)

## §D.2 Tree-store service

| Subject | Content |
|---|---|
| Schema id | `specstride.tree-store/1` |
| Logical names | `tree-store`, `worker-root` |
| Offered by | The engine, as a service to a layer that declared it |
| Used by | The layer `parallel`, through the directives `requestPassGroup` and `integrateGroup` |
| Content owner | 143, which builds the part that parallel units need. Nothing is built for `autoresearch` |

Operations are a closed set:

| Operation | Input | Output | Writes |
|---|---|---|---|
| `snapshot` | A directory | A tree id | The store |
| `materialize` | A tree id | A worker tree | The worker root |
| `changed` | A base tree id and a tree id | The paths that differ, each with its kind (added, changed, deleted, mode changed) | Nothing |
| `compose` | A base tree id and audited deltas in the order of the tasks at launch | A tree id, or a refusal with the reason `overlap` and the paths | The store |
| `apply` | The base, the composed tree, the workspace | The paths written | The workspace: exactly the paths of the composed delta |
| `release` | A worker tree | — | The worker root |
| `sweep` | — | The trees removed | The worker root and the store |

- **F100-FR-121**: The tree-store service MUST offer exactly the seven operations `snapshot`, `materialize`, `changed`, `compose`, `apply`, `release` and `sweep`. It MUST offer no restore, no reset and no checkout of the workspace, and an operation other than `apply` MUST NOT be able to write a path of the workspace. The interface is reserved in EP-04 major 1; Wave 1 builds only what parallel units need.
  - divergence: DV-080
  - parity: off (no operation is called) (row 20 of annex X §X.7)
  - test: CT-100-221
  - ep: EP-04 `specstride.loop-layer/1` (implements)

- **F100-FR-122**: Integration MUST be composition and never a merge of content: the composed tree is the base in which each path of an accepted delta holds the content of that worker's final snapshot. The path sets of accepted deltas MUST be pairwise disjoint; a delta that shares a path with an earlier one in the order of the tasks at launch MUST be refused with the reason `overlap`. A model MUST NOT take part in integration.
  - test: CT-100-222
  - ep: EP-04 `specstride.loop-layer/1` (implements)

- **F100-FR-123**: Snapshot commits MUST exist only in the store, which lies outside the project's repository. They MUST have a fixed author, date and message, MUST never be a parent of a commit of the project, MUST never be pushed, and MUST be removed with the run. An operation of the store or of a layer MUST NOT write a file under the project's repository directory, create a reference there or change the project's index. The store MUST be unwritable by any worker; each worker tree MUST hold a repository of its own that borrows the objects of the store read-only.
  - divergence: DV-084
  - parity: off (row 20 of annex X §X.7)
  - test: CT-100-223
  - ep: EP-04 `specstride.loop-layer/1` (implements)

- **F100-FR-124**: Inside a phase attempt the runtime MUST never commit to, revert, reset, clean or check out the workspace, and MUST write nothing under the project's repository directory except the approval commit that exists at the baseline. With parallel units on, and only then, the runtime MAY make exactly two writes to the workspace: (1) the application of the composed delta of a group — forward only, only paths of audited deltas, only onto a workspace equal to the base, recorded before it is made, never undone, nothing under the repository directory; (2) the ticks of the integrated tasks, through the spec-format adapter. (Rule IR-60 as amended.)
  - divergence: DV-085; DV-086
  - parity: off (row 20 of annex X §X.7)
  - test: CT-100-224
  - ep: EP-04 `specstride.loop-layer/1` (implements)

- **F100-FR-125**: After the application the engine MUST run the inner check set of the phase on the workspace, once per group, through the check runner. A failure MUST go to serial repair by the proposer in the ordinary loop; the applied changes MUST NOT be reverted. A result obtained in a worker tree or a merge check MUST NOT replace an execution at the verification gate, which runs in full on the workspace before the critic. The partial work of a killed worker MUST be discarded and its task returns to the serial loop.
  - test: CT-100-225
  - ep: EP-04 `specstride.loop-layer/1` (consumes)

## §D.3 Parallel plan

| Subject | Content |
|---|---|
| Schema id | `specstride.parallel-plan/1` |
| Logical name | `run:<runId>:parallel-plan` |
| Writer | Engine, at launch. Never computed again inside a run |
| Readers | Engine, doctor, the dry-run plan of the pipeline entry (only with the option on) |
| Content owner | 142 |

| Field | Meaning | Type in words | Required |
|---|---|---|---|
| `schema` | Schema id | Text | Yes |
| `runId` | Identifier | Text | Yes |
| `hash` | Hash of the plan, which is also an event | Text | Yes |
| `workers` | Worker count in force (default 2; the ceiling is `loop.parallel.workersMax`, default 4) | Whole number | Yes |
| `phases` | Per phase: its groups, its serial tasks, and the ceiling of the speed-up under equal task cost | List of records | Yes |
| `phases[].groups` | Per group: ordinal, and the task ids in the order of the tasks at launch. A group holds at least 2 and at most `workers` tasks, all consecutive and admitted | List of records | Yes (may be empty) |
| `phases[].tasks` | Per candidate task: id, write scope (path prefixes relative to the workspace root), the source of the scope (consumer declaration, or the task's own text at launch), and the verdict of every admission check with its detail | List of records | Yes |
| `phases[].serial` | Tasks made serial, each with the reason | List of records | Yes (may be empty) |
| `fallback` | When the layer is off for the run: the reason, from the closed set of fallback reasons | Member of a closed set, or null | Yes |

- **F100-FR-126**: The parallel plan MUST hold the fields of §D.3, MUST be computed at launch as a pure function of the task list as read at launch and of configuration, and MUST be stored in the control plane with its hash. A relaunch that derives a different plan MUST announce the difference and use the stored plan. A stored plan whose hash does not match MUST switch the layer off for the run with an integrity event. The plan MUST be printed only with the option on.
  - divergence: DV-080; DV-088
  - parity: off (no plan file exists) (row 20 of annex X §X.7)
  - test: CT-100-226

- **F100-FR-127**: `loop.parallel.units` MUST default to `off`. `loop.parallel.workers` MUST default to 2. Its ceiling MUST be the key `loop.parallel.workersMax`, a whole number of 1 or more that MUST default to 4 and MUST be a widening key: project configuration may lower it and never raise it, and a higher value in project configuration is ignored with a launch message and a doctor warning, as F100-FR-202 says for a widening key. A value of `loop.parallel.workers` above the ceiling in force MUST be a configuration error at launch. `loop.parallel.quota_headroom` MUST default to 70 per cent. `loop.parallel.allow_detect` MUST default to off and MUST be a widening key.
  - parity: `loop.parallel.units` off (rows 20, 21, 22, 23 and 130 of annex X §X.7)
  - test: CT-100-227
  - assumption: CQ-198 (the ceiling has no upper bound in the product)

- **F100-FR-128**: Information about groups or workers MUST NOT reach a critic-class call: no worker id, no group id, no count, no outcome of a worker, no order of integration, and no word that tells a group from a serial unit of work that named the same tasks. An integrated group MUST appear in the fact block as one unit. The two integrity kinds that parallel units add MUST be neutral: `tree-changed-outside-pass` and `protected-change-not-applied`, reported by kind and without a count. A worker tree MUST NOT exist when a critic-class call starts.
  - test: CT-100-228

## §D.4 EP-06 Router rule table

#### Id and version
`specstride.router-rules/1`. Data.

#### Purpose
To decide, from recorded signals only, among choices that are already fixed. The router runs
nothing.

#### Caller and time
The engine and a loop layer, at three decision points inside a phase attempt.

| Decision point | Chooses | Never |
|---|---|---|
| `tools` | The order of, and exclusions among, entries of the frozen check manifest of the phase | Adds a command or builds an argument list |
| `loop` | A registered loop layer, or off for this phase attempt | Switches a layer on; replaces the gated loop |
| `escalation` | The next rung of the pinned model-tier ladder of the same harness, or `skip` with a reason | Moves to another harness; targets a rung that equals a critic-class call of the run in model and in effort (signal `targetIsCriticModel`) |

#### Inputs
The decision point; signals (counts, exit codes, the failure signature as the ordered list of
failed command ids with their exit codes, tree fingerprints, measured durations, caps left, the state of the limit window of the target of an escalation);
configuration; the model-tier ladder. Never task prose, output of a check or anything a model
wrote.

#### Outputs
The choice, the id of the rule that fired, the signals, the table version.

#### Errors
A table without a default row for a decision point fails validation at load.

#### Guarantees of the core
One function evaluates the table, with no I/O, no clock and no model. Once a loop layer is engaged in the phase attempt, every decision is an event
(`route.decided`), including one that changes nothing. No routing decision reaches the critic.
Choosing the proposer and the critic is role resolution and not routing.

#### Guarantees of an implementation
For every vector of signals exactly one row fires. A row holds a rule id, a predicate over named
signals and a choice from the closed choice set of its decision point.

#### Failure of an implementation
An invalid table switches routing off for the run, announced, and `route.decided` carries the rule
id `config-off`. The loop then runs in manifest order, on the base model tier, with the pinned layer.

#### Unknown-value rule
An unknown decision point, an unknown signal name and a choice outside the choice set each make the
table invalid.

#### Wave 1 implementations
The shipped table. A loop layer contributes the rows of the decision points it consults.

#### Content owner
115.

#### Proving test
Golden decisions per row. The property that exactly one row fires for every vector of signals. The
sample layer of EP-04 adds a decision point with two rows, and the engine is unchanged.

- **F100-FR-129**: The router MUST be one pure function over a versioned rule table with the three decision points of §D.4. It MUST run nothing, read no critic prompt, no nonce and no verdict, change no role and no counter of the outer loop, and MUST NOT be able to switch a layer on. The router prototype's modes that run a phase without a critic MUST NOT exist.
  - test: CT-100-229
  - ep: EP-06 `specstride.router-rules/1` (implements)

- **F100-FR-130**: Escalation MUST be its own switch, `loop.escalation`, on by default. The second repair of a unit of work MAY run on the next model tier of the same harness, in a fresh session, never on a rung that equals a critic-class call of the run in model and in effort (the signal `targetIsCriticModel`), capped at 1 per task and 2 per phase attempt, inside the cap of repairs. A rung that shares the model of a critic-class call and differs in effort is not a collision: it MAY be used, and the critic-diversity warning MUST be raised and recorded. When the quota of the target is exhausted the escalation MUST be skipped, the repair MUST run on the base model, and the skip MUST be recorded.
  - divergence: DV-050
  - assumption: CQ-191 (ruling 49 is read to allow a rung on the critic's model at another effort, with the warning)
  - parity: off (row 3 of annex X §X.7)
  - test: CT-100-230
  - ep: EP-06 `specstride.router-rules/1` (consumes)

## §D.5 EP-15 Prompt block provider

#### Id and version
`specstride.prompt-block/1`.

#### Purpose
To let any component contribute a block to the proposer's prompt, while one assembler keeps the
budget of the whole prompt.

#### Caller and time
The prompt assembler of the pass loop, before every pass.

#### Inputs
`blocks`: the context of the pass (phase, phase attempt, pass ordinal, strategy, what changed
since the pass before).

#### Outputs
Blocks, each with: id, bytes, hash, its writer, `protected` or not, `stable` or `volatile`.

#### Errors
None of its own. A block over the size its provider declared is cut and recorded.

#### Guarantees of the core
One assembler budgets the whole prompt, places stable blocks first and keeps the start of the
prompt byte-stable inside a phase attempt. Every pass emits `prompt.built` with the blocks and
what was dropped. A protected block is never dropped. The critic has an assembler and a block set
of its own; no block of the proposer reaches the critic through this point. With the as-is block
set selected, the prompt equals the baseline's byte for byte.

#### Guarantees of an implementation
A provider is a pure function of the context of the pass and of files it names. It frames text
from outside the runtime as data. It reveals nothing to the proposer about groups, workers or
routing beyond what its content owner specifies.

#### Failure of an implementation
The block is left out, the omission is recorded in `prompt.built`, and the pass runs. A provider
of a protected block that fails is an error of the pass, by the existing breakers.

#### Unknown-value rule
An unknown block id is accepted, since block ids are an open set. An unknown value of `protected`
or of `stable` is read as not protected and volatile.

#### Wave 1 implementations
Spec context; the obligations index; the handoff; feedback; hint; acceleration note; the yield
interface block; the protocol block of the layer `micro`; the reserved-tasks block and the worker
block of the layer `parallel`; the section of the plugin protocol of one harness.

#### Content owner
103. The critic's own assembler: 117.

#### Proving test
Golden prompts on the fixtures of the oracle. A sample provider adds a block that shows up in
`prompt.built`.

- **F100-FR-131**: A prompt block provider MUST offer the one operation `blocks` of §D.5. One assembler MUST budget the whole prompt. With the as-is block set, which the `parity` profile selects, the prompt MUST equal the baseline's byte for byte.
  - parity: the as-is block set (row 12 of annex X §X.7)
  - test: CT-100-231
  - ep: EP-15 `specstride.prompt-block/1` (implements)

- **F100-FR-132**: Carry-over MUST consist of the ledger, a handoff that the runtime writes at the start of every pass and never reads back, and the obligations index, which replaces the block of inherited verification obligations in the proposer's prompt only. Each MUST have its own switch (`carry.ledger_handoff`, `carry.index`), on by default, and the cache-stable start of the prompt likewise.
  - divergence: DV-045; DV-092; DV-094
  - parity: off (rows 8, 9, 12 of annex X §X.7)
  - test: CT-100-232
  - ep: EP-15 `specstride.prompt-block/1` (consumes)

## §D.6 Yield artifact

| Subject | Content |
|---|---|
| Schema id | `specstride-pass-yield/v1` (the as-is name is kept) |
| Logical name | Written to `feature:<slug>:outbox`; moved to `job:<jobId>:yield` when read |
| Writer | The proposer, as a claim |
| Readers | Engine |
| Content owner | 118. It may add kinds of predicate through a new minor |

| Field | Meaning | Type in words | Required |
|---|---|---|---|
| `contract` | Schema id | Text | Yes |
| `reason` | Why the pass yields | Text, not empty | Yes |
| `job.mode` | `launch` or `adopt` | Member of a closed set | Yes |
| `job.argv` | The command the runtime launches | List of text, not empty | With `launch` |
| `job.pid` | The process the runtime adopts | Whole number above zero | With `adopt` |
| `job.cwd`, `job.log` | Working directory and log of the job | Text | No |
| `resume_when.kind` | `pid`, `exit_code_file`, `file_exists`, `file_stable`, `grep`, `command`, `first_failure` | Member of a closed set | Yes |
| `resume_when.path`, `resume_when.pattern` | What the predicate reads | Text | Where the kind needs them |
| `resume_when.stable_sec` | For `file_stable`: how long the file must stay unchanged | Whole number above zero | With `file_stable` |
| `resume_when.pid` | For `pid`: the process whose end is awaited | Whole number above zero | With `pid` |
| `resume_when.argv` | For `command`: the fixed argument list of the predicate | List of text, not empty | With `command` |
| `on_first_failure` | `stop` or `continue-and-notify` | Member of a closed set | With `first_failure` |
| `deadline_sec` | Deadline of the wait | Whole number above zero | Yes |
| `on_resume` | What the next pass is told | Text | No |

- **F100-FR-133**: The yield artifact MUST hold the fields of §D.6 and MUST be read as a claim under the rules of annex B §B.2. The predicate `command` MUST be refused unless the consumer allowed it. A worker of a parallel group MUST NOT yield; its yield artifact is refused.
  - test: CT-100-233

- **F100-FR-134**: The first-failure predicate MUST be its own switch, `verification.failfast`, on by default; it MUST NOT ride on the switch of a loop layer. The runtime MUST stop a job only if it launched the job and the yield declared `stop`; otherwise the wait ends and the job runs on. The default of `on_first_failure` MUST be `stop`; `continue-and-notify` as the default is an option that is off. The polite stop (an interrupt before a termination, with a grace period) MUST be its own switch, `carry.polite_stop`, on by default.
  - divergence: DV-051; DV-093
  - parity: off (rows 4, 5, 11 of annex X §X.7)
  - test: CT-100-234

## §D.7 Fact block

| Subject | Content |
|---|---|
| Schema id | `specstride.fact-block/1` |
| Logical name | `attempt:<N>:<k>:<n>:fact-block` |
| Writer | Engine, from the control plane and the ledger, through the call point `contributeCriticInput` |
| Readers | The critic prompt assembler |
| Content owner | 116. Its slot and its escaping in the critic prompt: 117 |

The block is present only when at least one unit of work was declared in the phase attempt, or
when an integrity rule that is independent of the layer found a fact.

| Field | Meaning | Type in words | Required |
|---|---|---|---|
| `schema` | Schema id | Text | Yes |
| `manifestHash`, `commands` | Hash of the check manifest and the list of its commands by id | Text, list | Yes |
| `treeFingerprint` | Fingerprint of the tree at the phase gate, once | Text | Yes |
| `units` | Per unit of work: its id; the tasks it named, headed as the proposer's declaration; per command the exit result and, in separate fields, each condition (`tainted`, `flaky` with both observed results, `superseded` or `current`, `cached`) | List of records | Yes (may be empty) |
| `unnamedTasks` | Tasks of the phase that no unit named | List of text | Yes |
| `notice` | One fixed sentence: a result is evidence about the tree and not about a task | Fixed text | Yes |
| `protected` | Paths of the protected set changed since phase entry, and which were authorised from the text of the task at launch; protected paths changed since launch in phases already approved; suppression markers added and removed, per file | Record | Yes |
| `integrity` | Integrity events, by kind from the closed set of §X.6, without counts | List of members of a closed set | Yes (may be empty) |
| `facts` | Further facts, each from a closed set: a check manifest that a relaunch derived differently; a cited result file that belongs to a stopped job; phase evidence that predates the tree; an intended change of a source that was accepted; a task list that changed since launch | List of members of a closed set | Yes (may be empty) |
| `excluded` | Commands excluded from the inner set, each with the reason | List of records | Yes (may be empty) |

Never in the block: counts, order, times, output of a command, earlier results, fingerprint values
per row, model tiers, sessions, routing decisions, whether a result came from the closing check,
and anything about groups or workers.

- **F100-FR-135**: The fact block MUST hold the fields of §D.7 and nothing from the list of what is never in the block. Every text in it that comes from the workspace MUST be escaped, cut, stripped of control characters and printed inside a data boundary with a token of the call. Test counts MUST NOT be shown in Wave 1, only counts of suppression markers. File modification times stay in the grounding snapshot.
  - test: CT-100-235

- **F100-FR-136**: When files of the protected set were changed without authority, the verification gate MUST still run, its result MUST carry the condition, and the critic MUST be told. Approval stays possible and the run MUST NOT halt. At phase entry the tree MUST be compared with the approved tree of the phase before; a difference is a fact for the critic and never blocks.
  - divergence: DV-077
  - parity: off (row 32 of annex X §X.7)
  - test: CT-100-236

## §D.8 Check manifest

| Subject | Content |
|---|---|
| Schema id | `specstride.manifest/1` |
| Logical name | `phase:<N>:manifest` |
| Writer | Engine, at launch, from the verification plan |
| Readers | Engine, check runner, router (decision point `tools`), fact block, doctor |
| Content owner | 105 |

| Field | Meaning | Type in words | Required |
|---|---|---|---|
| `schema` | Schema id | Text | Yes |
| `phase` | Phase number | Whole number | Yes |
| `hash` | Hash of the manifest, verified before every check | Text | Yes |
| `searchPath` | The search path for executables as it was at launch | Text | Yes |
| `entries` | The commands of the phase itself, in the order of the verification plan; the commands of earlier phases are in their own manifests, and the cumulative verification gate takes its commands from the manifests of the phases it covers (F105-FR-020) | List of records | Yes (may be empty) |
| `entries[].id` | Id of the command, stable inside the run | Text | Yes |
| `entries[].kind` | Kind of the identity: `command`, or a registered kind | Member of an open set | Yes |
| `entries[].argv` | The fixed argument list | List of text | For `command` |
| `entries[].pin` | The identity record of the check runner: for `command` the absolute path of the executable with size and hash | Record | Yes |
| `entries[].provenance` | File and line of the declaration | Record | Yes |
| `entries[].timeLimit` | Time limit of the command | Whole number of seconds | Yes |
| `entries[].tasks` | Tasks the declaration names | List of text | No |
| `entries[].steps` | Steps, for the step runner | List of records | No |
| `entries[].reads`, `entries[].writes` | Declared reads and writes, ignored paths included; or `sideEffects: none` together with `reads: tree` | Lists of path prefixes | No; undeclared means serial |
| `entries[].resource` | An exclusive resource the command needs | Text | No |
| `entries[].inner` | Whether the command belongs to the inner check set. The writer sets it true for every entry: the inner check set is the manifest, and only the runtime takes a command out of it during a phase attempt, with a reason (F105-FR-020; F115-FR-013) | Truth value | Yes |

- **F100-FR-137**: There MUST be one check manifest per phase, written when the loop strategy is not `classic` or when one of the switches of rows 6, 7, 31 and 33 of annex X §X.7 is on, and never under the `parity` profile. It MUST be derived at launch from the sources the verification gate uses and from nothing else, stored in the control plane with its hash, and verified before every check. It MUST hold deterministic commands only. The router MAY order and exclude among its entries; nothing MAY add an entry after launch.
  - divergence: DV-052
  - parity: no manifest file exists (rows 1, 6, 7, 31, 33 of annex X §X.7)
  - test: CT-100-237
  - assumption: CQ-153
