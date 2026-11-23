# Feature Specification: Pipeline runtime and supervisor

**Feature Branch**: `123-pipeline-runtime-and-supervisor` (a label: Spec Kit creates no branch in this repository; the directory is `specs/123-pipeline-runtime-and-supervisor`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 123-pipeline-runtime-and-supervisor: the pipeline stage executor inside the runtime root (start-up refusals, the dry-run plan, preflight, stages in order, skipping of completed stages and reset on a changed launch contract hash, in-stage retry by exit code and stop reason, stage timeout, signals, pipeline state); stage kinds and precondition checks as an extension point (EP-19); the launch checks; the `launch` verb of supervision and the record it leaves, started through the detach strategy; both relaunch classifier tables and the relaunch budget; the `supervise` verbs with their exit codes and poll backoff; the digest and the `[MOL-*]` lines in compatibility output and their terse equivalents; the run request of kind `engine`."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority), `architecture.md` sections 4 and 8, `consolidation.md` (glossary, sections 3.9, 3.10, 4.4, 5 and 6), `feature-briefs.md` (brief 123-pipeline-runtime-and-supervisor), `STAGE-B-RULES.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182), the research reports R19, R18, R15, R15v, R14, R17, R21, R21v and R16, the as-is specification `old/011-as-is-mixture-of-loops/`, and the baseline of mixture-of-loops at `9c88f86`.

## What this feature is

A run of the product is one detached tree of processes. Its root, the runtime root, runs a pipeline: the ordered stages of a promoted launch contract. One kind of stage runs the engine. This feature specifies what the runtime root does around the engine and around the other stages, and what the consumer's host does to watch it.

| Part | What it holds |
|---|---|
| Stage executor (group G1) | Start-up refusals, the dry-run plan, preflight, stages in order, skipping and reset, in-stage retry, stage timeout, signals, pipeline state, the registries of stage kinds and precondition checks (EP-19), the digest, the run request of kind `engine` |
| Launch checks (group G2) | The six ordered checks, the launch decision, the `launch` verb and the record it leaves, mode selection, launcher resolution |
| Relaunch (group G3) | Both classifier tables, the relaunch budget, `relaunch.owner`, `hold-relaunch`, what is never relaunched |
| Supervision (group G4) | The `supervise` verbs, their exit codes, the poll backoff, the labelled lines in compatibility output, the terse equivalents, the budgets of output |

**In scope**: as the four groups say. The single owner of both relaunch classifier tables is this feature.

**Out of scope**:

| Out of scope | Owner |
|---|---|
| Deriving, validating, promoting and rendering the launch contract | 107 |
| Detach strategies, the lock, the lease, the handshake, the inbox as a mechanism | 122. This feature owns the observable launch and calls the detach strategy for the start |
| The `stop` command | 102. `supervise stop` is its compatibility spelling here |
| `status` and `wait` | 129 |
| Quota pause | 127. A pause is a state, so the classifier has nothing to classify |
| The engine, the pass loop | 101, 103 |
| The `supervise retro` verb and the retrospective | 106 (its behaviour items are assigned there) |

How to cite: "feature 123, §R.5, F123-FR-021" for a launch check; "feature 123, §R.6" for a classifier table.

## The reference sections

The reference sections are normative. Requirements cite them. They hold literals that a parity test compares, so they are behaviour and not implementation. Terms follow the glossary of `consolidation.md` section 1: the run of feature 100 is the logical run; the as-is "run directory" is the pipeline run; a stage attempt is one try of an action inside one stage; a relaunch is the start of the runtime again after a stop that was classified as transient.

### §R.1 The pipeline entry: arguments and exit codes

The pipeline entry is `pipeline run` in the foreground and the entry of the runtime root when the run is detached. The launcher is the generated file that calls it (feature 100, annex F, F100-FR-157).

| Argument | Meaning | Default |
|---|---|---|
| `--contract`, `--launch-dir` (hidden) | Location of the launch contract and directory of the launcher. Both required; supplied by the launcher only | — |
| `--implement` | Run declared setup stages | off |
| `--dry-run` | Inspect only. Takes precedence over every execution flag. Creates no pipeline run, log, lock or state | off |
| `--smoke` | Run declared smoke stages | off |
| `--color auto`, `--color always`, `--color never` | Colour mode | auto |
| `--no-color` | Force colour off. Wins over `--color always` | off |

| Exit code | Meaning |
|---|---|
| 0 | Every stage complete, or a dry run |
| 2 | Usage error: an unknown flag, or a bad value of `--color` |
| 20 | The launch contract is invalid at start |
| 21 | Preflight failed |
| 22 | A stage failed and no signal was received; also when the child exited 6 and the state is `stopped` |
| 23 | Stale sources, or changed learning decisions, at start |
| 24 | The lock is held |
| 128+N | A signal N was received: interrupt, termination or hang-up |

### §R.2 Lines of the pipeline entry (compatibility output)

Every line has the grammar of feature 100, annex G §G.3, family "Runtime lines" or "Digest". "Plain" means that the pipeline log receives the line without colour whatever the mode. Colour applies to the label only.

| Line | When | Stream | Hue |
|---|---|---|---|
| `[WARN] <warning>` | At start, once per validation warning | Standard error; never coloured; not logged | none |
| `[STALE] <detail>` then `[DIGEST] state=failed exit=23 last-stage=none evidence=none` | Sources are stale or learning decisions changed | Standard error; nothing is logged | none |
| `[INVALID] <detail>` then `[DIGEST] state=failed exit=20 last-stage=none evidence=none` | The launch contract is invalid | Standard error; nothing is logged | none |
| `[DRY-RUN] contract <id> is source-current; no actions or writes will occur` | First line of a dry run | Standard output | green |
| `[PREFLIGHT] <stage>: <check detail>: pass`, `fail` or `deferred` | Dry run, once per preflight-timed precondition of each stage that will run | Standard output | green when passed, yellow otherwise |
| `[SKIP] <stage> (enable with --smoke)` | Dry run, a smoke stage without `--smoke` | Standard output | yellow |
| `[CHECK] <stage> uses existing prerequisite; --implement would run setup` | Dry run, a setup stage without `--implement` | Standard output | cyan |
| `[PLAN] <stage>: <redacted action>` | Dry run, every other stage | Standard output | cyan |
| `[DIGEST] state=dry-run exit=0 last-stage=none evidence=none` | Last line of a dry run | Standard output | dim |
| `[BLOCKED] another launcher owns <pipeline run>` then `[DIGEST] state=failed exit=24 last-stage=none evidence=<pipeline run>` | The lock is held | Standard output | red |
| `[BLOCKED] <failure>` once per preflight failure, then `[DIGEST] state=failed exit=21 last-stage=none evidence=<pipeline run>` | Preflight failed | Standard output | red |
| `[SKIP] <stage> smoke stage disabled` | Live run, a smoke stage without `--smoke` | Standard output | yellow |
| `[RESUME] <stage> postconditions still hold; skipping` or `[RESUME] <stage> postconditions changed; rerunning` | A stage that was completed in an earlier launch | Standard output | green, yellow |
| `[READY] <stage> already satisfies setup postconditions` | Setup stage, no `--implement`, postconditions hold | Standard output | green |
| `[BLOCKED] <stage>: <failure>; rerun with --implement` | Setup stage, no `--implement`, a postcondition fails | Standard output | red |
| `[BLOCKED] <stage>: <failure>` | A stage-timed precondition failed | Standard output | red |
| `[RUN] <stage> attempt <n>/<max>: <redacted action>` | Each stage attempt | Standard output | cyan |
| `[PASS] <stage> completed` | The action exited 0 and the postconditions hold | Standard output | green |
| `[ERROR] <stage> postcondition: <failure>` | The action exited 0 and a postcondition failed | Standard output | red |
| `[RECOVER] <stage> exit <code>[, reason=<reason>]; retry in <delay>s` | A stage attempt failed and will be retried | Standard output | magenta |
| `[FAIL] <stage> exit <code> (<outcome>)` | A stage failed for good | Standard output | red |
| `[DIGEST] state=<failed or stopped> exit=<code> last-stage=<id> child-exit=<code or None> evidence=<pipeline run>` | A stage failed or the run was stopped | Standard output | dim |
| `[DIGEST] state=completed exit=0 last-stage=<id of the last stage of the launch contract, even if skipped> evidence=<pipeline run>` | Every stage complete | Standard output | dim |

A redacted action is the argument list with every item quoted as in JSON and separated by a space; when the action has environment entries the text is prefixed with `env[<sorted names>] `, and no value is ever printed.

### §R.3 Stage kinds and precondition checks (EP-19)

Stage kinds are an open registry. Wave 1 holds five.

| Kind | What the stage executor does |
|---|---|
| `setup` | Idempotent set-up. Without `--implement`, the stage is satisfied when its postconditions hold (`[READY]`, stage reason `existing-prerequisite`, no child exit, counts as success); otherwise it fails with the stage reason `setup-required`. With `--implement`, it runs its action |
| `decision` | Runs its declared action as a `command` does. The executor does not branch on this kind |
| `command` | Runs its declared action |
| `specstride` | Runs the engine as a child. Its outcome is read from the terminal record of the engine. It is the only kind whose child output is logged when colour is off |
| `smoke` | Runs its declared action only with `--smoke`; otherwise it is skipped |

Precondition checks are an open registry. Wave 1 holds six. A check has a timing, `preflight` or `stage`, and a working directory.

| Check | Passes when |
|---|---|
| `file_exists` | The path is a regular file |
| `dir_exists` | The path is a directory |
| `env_set` | The variable is non-empty in the environment of the pipeline entry itself |
| `command_available` | The command is on the search path |
| `command_success` | The command exits 0 within its time limit (default 60 seconds). Never executed in a dry run; it then reads `deferred` |
| `json_field_equals` | The dotted field of the JSON file equals the declared value |

An unknown check type makes the launch contract invalid at validation (F123-FR-010). The evaluator of checks keeps the as-is answer for a type it does not know, a failure with the message `unsupported check` (behaviour item B-2615), which a validated launch contract does not reach. A condition path that begins with the state directory name of a legacy product is not carried (register row DV-036).

### §R.4 Stage reasons, states and their values

| Family | Values |
|---|---|
| Stage reason, transient | `exit`, `timeout`, `recovery-deadline`, `recovery-exhausted` (declared and unreachable) |
| Stage reason, deliberate | `postcondition`, `stage-precondition`, `setup-required`, `interrupted`, `existing-prerequisite`, `completed`, and `exec-error:` followed by a detail |
| Pipeline exit reason | `preflight`, `all-stages-complete`, or a stage reason |
| Pipeline state | `preflight`, `ready`, `running`, `failed`, `stopped`, `completed` |
| State of one stage | `running`, `completed`, `failed`, `stopped` |
| Digest state | `completed`, `failed`, `stopped`, `dry-run` |

The state record of the pipeline holds, at top level: `pipeline`, `contract_digest` (the literal of the compatibility projection; the value is a hash), `state`, `updated_at`, `stages`, `last_stage`, `exit_reason`, `superseded_contract_digest`. Times are whole seconds since the epoch. A stage entry holds `status`, `started_at`, `finished_at`, `child_exit_code`, `reason` and, on completion, `evidence`.

### §R.5 Launch checks and launch decisions

The six launch checks run in this order. The first failure decides; the later checks are reported `not-evaluated`.

| # | Check name | Refusal reason on failure | Decision |
|---|---|---|---|
| 1 | `launcher-intact` | `launcher-not-found` (the file is absent); `launcher-edited` (the file was edited, or was not generated by the product, so its recorded hash no longer matches) | `refuse` |
| 2 | `contract-validated` | `learning-decisions-changed`; `stale-sources`; `open-blocker`; `draft-contract`; `invalid-contract`. The last three are chosen by the text of the validation error: an open blocking finding, a status that is not `validated`, or anything else | `refuse` |
| 3 | `authorized-root` | `unauthorized-root` (the repository root is outside the authorized roots) | `refuse` |
| 4 | `launcher-syntax` | `launcher-syntax-error` (the launcher does not parse; the detail is the first 400 characters of the message) | `refuse` |
| 5 | `launcher-dry-run` | `dry-run-failed` (the launcher run with `--dry-run --no-color` and the flags of the launch does not exit 0 within 300 seconds; the detail is the last 400 characters of its output) | `refuse` |
| 6 | `run-directory-free` | `already-running` (the workspace lock is held) | `attach` |

The 11 refusal reasons of this table are the closed set "Launch-check refusals" (feature 100, annex X §X.6, row 13). The decision is `launch` when all six pass.

### §R.6 The two relaunch classifier tables

Both tables are tables of the evaluator of feature 100, annex X §X.3. Each has one decision point, `relaunch`. Its choice is a literal of the closed set "Relaunch refusals" (row 14) or one of the two approvals `classified-transient` and `classified-crash`; `relaunch-held` is a hold. Rows are tried in order; the first whose predicate holds fires; the last row of each table has no predicate. The rule id and the table version are recorded with every decision.

The named signals of table 1, `relaunch-observe`: `noRelaunch`, `terminal`, `stopRequested`, `status`, `launcherExit`, `runState`, `stageKnown`, `stageReasonClass`, `blocked`, `retryable`, `parityProfile`, `childExitListed`, `reasonAllowed`, `contractChanged`, `learningChanged`, `launcherEdited`, `budgetRemaining`, `deadlinePassed`. Three of them, `blocked`, `retryable` and `parityProfile`, were added on 2026-09-30 (F123-FR-042); `blocked` and `retryable` are read from the terminal record of the engine (feature 100, annex B §B.15, which names both tables as its readers), and `parityProfile` from the profile in force. Every other signal is read from what the observation of a terminated launcher records.

**Table 1, `relaunch-observe`.** Used by `supervise observe` when `relaunch.owner` is `supervise`. It reproduces the baseline, and adds the two rows O-33 and O-34, which the baseline does not have; the order is part of the observable output. Row O-33 is active under every profile (`assumption: CQ-238`); row O-34 is inactive under the `parity` profile (register row DV-114). The rows O-33 and O-34 stand between O-24 and O-25; they carry the next free ids, because a rule id is never renumbered.

| Rule | Fires when | Literal | Decision |
|---|---|---|---|
| O-01 | `noRelaunch` (the flag `--no-relaunch`) | `relaunch-disabled` | refuse |
| O-02 | not `terminal` | `still-running` | refuse |
| O-03 | `stopRequested` | `operator-stop` | refuse |
| O-04 | `status` is `completed` | `completed` | refuse |
| O-05 | `status` is `stopped` | `deliberate-stop` | refuse |
| O-06 | `status` is `unknown-terminal` | `unknown-terminal` | refuse |
| O-07 | `status` is `lock-conflict` | `lock-conflict` | refuse |
| O-08 | `launcherExit` is not present | `unknown-launcher-exit` | refuse |
| O-09 | `launcherExit` is not less than 128 | `signal-stop` | refuse |
| O-10 | `launcherExit` is 20 | `invalid-contract` | refuse |
| O-11 | `launcherExit` is 21 | `preflight-blocked` | refuse |
| O-12 | `launcherExit` is 23 | `stale-sources` | refuse |
| O-13 | `launcherExit` is 24 | `lock-conflict` | refuse |
| O-14 | `launcherExit` is not 22 | `launcher-exit-<n>`, with n the value | refuse |
| O-15 | `runState` is not `failed` | `state-not-failed` | refuse |
| O-16 | not `stageKnown` | `unknown-stage` | refuse |
| O-17 | `stageReasonClass` is `postcondition` | `postcondition-failure` | refuse |
| O-18 | `stageReasonClass` is `stage-precondition` | `stage-precondition` | refuse |
| O-19 | `stageReasonClass` is `setup-required` | `setup-required` | refuse |
| O-20 | `stageReasonClass` is `interrupted` | `interrupted` | refuse |
| O-21 | `stageReasonClass` is `existing-prerequisite` | `stage-did-not-run` | refuse |
| O-22 | `stageReasonClass` is `completed` | `stage-did-not-fail` | refuse |
| O-23 | `stageReasonClass` is `exec-error` | `exec-error` | refuse |
| O-24 | `stageReasonClass` is `other` | `stage-reason-not-transient` | refuse |
| O-33 | `blocked` | `blocked-on-human` | refuse |
| O-34 | not `parityProfile` and not `retryable` | `stop-not-retryable` | refuse |
| O-25 | not `childExitListed` | `child-exit-not-retryable` | refuse |
| O-26 | not `reasonAllowed` | `stop-reason-not-allowed` | refuse |
| O-27 | `contractChanged` | `contract-digest-changed` | refuse |
| O-28 | `learningChanged` | `learning-decisions-changed` | refuse |
| O-29 | `launcherEdited` | `launcher-edited` | refuse |
| O-30 | `budgetRemaining` is not greater than 0 | `budget-exhausted` | refuse |
| O-31 | `deadlinePassed` | `budget-deadline-exceeded` | refuse |
| O-32 | (default) | `classified-transient` | relaunch |

`stageReasonClass` is `transient` for the stage reasons `exit`, `timeout`, `recovery-deadline` and `recovery-exhausted`, the name of the reason for each deliberate reason, `exec-error` for a reason that starts with `exec-error`, and `other` for any other value. `contractChanged` is true when the state is bound to a different launch contract hash than the one launched, or when the launcher now points at a different launch contract. `reasonAllowed` is true when the stage declares no reason rule or the newest stop reason is in its allowed list. `childExitListed` is true when the child exit is in the exit codes the stage lists for retry.

The three signals of F123-FR-042, in table 1:

| Signal | Value |
|---|---|
| `blocked` | True when the stage that failed is of kind `specstride` and the terminal record of its engine start carries a blocked reason (feature 100, annex E §E.2: `declared-block`, `quota-credit`, `auth`, `budget-cap`, `quota-wait-ceiling`, `source-changed`). False for every other kind of stage and for a terminal record without the field |
| `retryable` | For a stage of kind `specstride`: the value `retryable` of the terminal record, synthesized or not; false when the record is absent, cannot be read, or holds a value that is no truth value. True for every other kind of stage |
| `parityProfile` | True when the profile in force is `parity`. It makes the row O-34 inactive under that profile, where the baseline classifies a stop that is not retryable by the listed exit codes and the allowed reasons only (register row DV-114). Row O-33 does not read it (`assumption: CQ-238`) |

A run that rests blocked on a human (`auth`, `quota-credit`, `budget-cap` and the other three reasons) ends the pipeline with 22 and the state `failed`, its stage reason is `exit`, and its child exit is 4 or 3. Before 2026-09-30 such a run passed O-25 and O-26 where the stage lists the exit code and allows the stop reason, and reached O-32. It now stops at O-33 under every profile, the `parity` profile included (`assumption: CQ-238`); no fixture of FX-35 or FX-36 ends with a blocked reason, because the engine stub and the agent stubs of the oracle raise none, so O-33 changes no compared output. Only O-34 is inactive under the `parity` profile, as register row DV-114 says, because it would change the rule id of scenarios of FX-36 that end not retryable. A stop by a tripped wall-clock budget carries `retryable: true` and no blocked reason (feature 100, annex E §E.3, row 2), so it passes O-33 and O-34 and is relaunched when the rows after them allow it (`assumption: CQ-192`).

**Table 2, `relaunch-root`.** Used by the runtime root when `relaunch.owner` is `root`. New behaviour (register row DV-074). Signals, all read from records the root holds: `stopRequested`, `interrupted`, `blocked`, `cause`, `exitCode`, `retryable`, `stageReasonClass`, `childExitListed`, `reasonAllowed`, `contractChanged`, `learningChanged`, `launcherEdited`, `budgetRemaining`, `deadlinePassed`, `held`. `blocked` is true when the terminal record carries a blocked reason. `cause` is `normal`, `crash` or `owner-lost` from the terminal record; a terminal record that the root had to write itself has `cause` `crash`. `retryable` is the value of the terminal record for a stage of kind `specstride`, and true for every other kind. A tripped wall-clock budget has `retryable` true and `blocked` false, so it reaches R-24 (`assumption: CQ-192`).

| Rule | Fires when | Literal | Decision |
|---|---|---|---|
| R-01 | `stopRequested` | `operator-stop` | refuse |
| R-02 | `interrupted` (the root received a signal) | `signal-stop` | refuse |
| R-03 | `blocked` | `blocked-on-human` | refuse |
| R-04 | `cause` is `owner-lost` | `lease-lost` | refuse |
| R-05 | `exitCode` is 6 and `cause` is `normal` | `deliberate-stop` | refuse |
| R-06 | `stageReasonClass` is `postcondition` | `postcondition-failure` | refuse |
| R-07 | `stageReasonClass` is `stage-precondition` | `stage-precondition` | refuse |
| R-08 | `stageReasonClass` is `setup-required` | `setup-required` | refuse |
| R-09 | `stageReasonClass` is `interrupted` | `interrupted` | refuse |
| R-10 | `stageReasonClass` is `existing-prerequisite` | `stage-did-not-run` | refuse |
| R-11 | `stageReasonClass` is `completed` | `stage-did-not-fail` | refuse |
| R-12 | `stageReasonClass` is `exec-error` | `exec-error` | refuse |
| R-13 | `stageReasonClass` is `other` | `stage-reason-not-transient` | refuse |
| R-14 | `cause` is not `crash` and not `retryable` | `stop-not-retryable` | refuse |
| R-15 | `cause` is not `crash` and not `childExitListed` | `child-exit-not-retryable` | refuse |
| R-16 | `cause` is not `crash` and not `reasonAllowed` | `stop-reason-not-allowed` | refuse |
| R-17 | `contractChanged` | `contract-digest-changed` | refuse |
| R-18 | `learningChanged` | `learning-decisions-changed` | refuse |
| R-19 | `launcherEdited` | `launcher-edited` | refuse |
| R-20 | `budgetRemaining` is not greater than 0 | `budget-exhausted` | refuse |
| R-21 | `deadlinePassed` | `budget-deadline-exceeded` | refuse |
| R-22 | `held` | `relaunch-held` | hold |
| R-23 | `cause` is `crash` | `classified-crash` | relaunch |
| R-24 | (default) | `classified-transient` | relaunch |

A hold is not final: the root stays in the state `relaunching` and evaluates the table again when the hold is lifted or the deadline of the budget passes, whichever comes first (F123-FR-032).

### §R.7 The `supervise` verbs

`supervise` reads a run and, with `relaunch.owner: supervise`, relaunches it. A verb takes `--launcher PATH` or `--run-dir DIR` (exactly one; `gate`, `launch` and `auto` take only `--launcher`).

| Verb | What it does | Exit |
|---|---|---|
| `mode --request TEXT [--token TOK ...]` | Prints the mode line; prints the next-step line when the mode is `dry-run` | 0 always |
| `resolve --repo DIR [--feature SLUG] [--launcher PATH]` | Prints the launcher line, or a refusal | 0; 4 on refusal |
| `gate --launcher PATH [--implement] [--smoke]` | Runs the six launch checks and prints every check and the decision | 0 for `launch`; 4 for `refuse` and for `attach` |
| `launch --launcher PATH [--mode run or auto] [--implement] [--smoke]` | Runs the launch checks, then starts the launcher detached, then prints the launch line | 0; 4 when the decision is not `launch` |
| `watch (--launcher or --run-dir) [cadence]` | Supervises a launched run until it is terminal or supervision expires | The exit map |
| `observe (--launcher or --run-dir) [cadence] [--json]` | Takes one reading; when terminal prints the digest and, with `relaunch.owner: supervise`, may relaunch; otherwise prints the next poll interval | 0, or a refusal code |
| `auto --launcher PATH [--mode run or auto] [--implement] [--smoke] [cadence]` | `launch`, then `watch`, in one call. `--mode` defaults to `auto` | The exit map |
| `stop (--launcher or --run-dir) [cadence]` | Records the stop request, signals the process group of the run, prints the stop line, then supervises without relaunch (poll `min(poll, 5)` seconds, at most 120 seconds by default) | 0 when nothing could be signalled; else the exit map |
| `hold`, `release` | Write the inbox request `hold-relaunch` with `hold` true or false, and an optional reason | 0 written; 4 refused, `no-live-run` |

Cadence flags: `--poll-seconds` (default 60), `--max-poll-seconds` (default 600), `--max-wait-seconds` (default: the supervision ceiling of the launch contract, measured from the first launch), `--no-relaunch` (report a classified transient and do not relaunch it). `observe --json` also prints the raw observation as sorted JSON on standard output and does not mirror it to the report log. The default of `--mode` is `run` for `launch` and `auto` for `auto`.

Exit map of supervision: completed 0, stopped 2, unknown-terminal 3, refused 4, supervision-expired 5, failed 22, lock-conflict 24; any other status 1; interrupted by the operator 130 with the reason `interrupted` (the run is left alone). A usage error exits 2, and a refusal that carries a supervisor reason exits 4.

### §R.8 The supervisor lines

In compatibility output the supervisor prints these lines, in the grammar of feature 100, annex G §G.3. A text value is quoted as in JSON unless said otherwise. Keys are those of the keys table of §G.3.

| Line | Form |
|---|---|
| `[MOL-MODE]` | `mode=<m> source=<token, refusal, prose or default> evidence=<json string> flags=<json string>` |
| `[MOL-LAUNCHER]` | `launcher=<path> source=<request, feature-default or generated-marker>` |
| `[MOL-GATE]` | `check=<name> status=<pass, fail or not-evaluated>` with ` reason=<r> detail=<json>` only when a reason is set; and `decision=<launch, refuse or attach>` with the optional `reason`, `detail` and `next` |
| `[MOL-LAUNCH]` | `pipeline= mode= launcher= run-dir= stages= flags=<json> relaunch-budget=<remaining>/<max> (<source>) wall-clock-ceiling=<g>s pid= stop="kill -TERM -<pgid>"` |
| `[MOL-STATE]` | `pipeline= stage=<i>/<n> id=<id or none> state=<status> stage-elapsed=<Ns or -> total-elapsed=<Ns>` and optional `detail=<json>`; printed when the signature of the observation changed |
| `[MOL-HOLD]` | `pipeline= unchanged=<count> stage=<i>/<n> id= state= total-elapsed=`; printed on every unchanged observation |
| `[MOL-DIGEST]` | `pipeline= state= exit=<int or unknown> child-exit=<int or none> last-stage=<id or none> evidence=<path> state-path=<path> next=<json>` |
| `[MOL-RELAUNCH]` | `pipeline= attempt=<n>/<max> reason= exit= child-exit= stage= stop-reason=<python repr> budget-remaining= detail=<json>`; `stop-reason` is the repr of a Python value (single quotes, or `None`), not JSON |
| `[MOL-REFUSE]` | `action=<a> reason=<r> detail=<json>` and optional `next=<json>` |
| `[MOL-ANOMALY]` | `pipeline= detail=<json>` per anomaly; for `unknown-terminal` also `pipeline= launch-log=<json of the last 600 characters>` |
| `[MOL-NEXT]` | `poll-in=<g>s` after a non-terminal `observe` and after a relaunch; or `next=<text>` |
| `[MOL-STOP]` | `pipeline=<id> sent=<true or false> detail=<json>` |

The next-action texts of the digest are: for a relaunch `relaunch: <detail>`; for a failed run with a decision `no relaunch (<reason>): <detail>`; otherwise one fixed text per status, `completed`: "none; the pipeline completed and its evidence is in the run directory"; `failed`: "operator: read the stage's evidence, then regenerate or relaunch by hand"; `stopped`: "none; the stop was intentional and is never relaunched automatically"; `unknown-terminal`: "operator: the launcher died without writing a terminal state; read the harness launch log before treating anything as done"; `lock-conflict`: "attach to the launcher that already owns the run directory"; `supervision-expired`: "operator: the run is still going past the declared supervision ceiling; reattach or stop it".

**Default output.** The product lines carry the prefix `[SPECSTRIDE-`. One line per change, nothing for an unchanged state, paths relative and only once, no text from a run. Four labels have an owner and keys that this feature does not choose (feature 100, annex G §G.3, and the state commands of the CLI), so they are not labels of `supervise`: `[SPECSTRIDE-LAUNCH]` (keys `run`, `state`; printed by the `launch` command), `[SPECSTRIDE-STOP]` (keys `request`, `now`, `ended`, `next`; printed by the `stop` command), `[SPECSTRIDE-STATE]` (the line of the commands `state export`, `state import` and `state adopt`) and `[SPECSTRIDE-DIGEST]`, which this feature prints with the keys that annex G §G.3 fixes (last row of the table, F123-FR-043). No verb of `supervise` prints one of the first three. The four lines of `supervise` that carried these labels before 2026-09-30 carry labels of their own, which start with `[SPECSTRIDE-SUPERVISE-`.

| Line | Keys | Printed |
|---|---|---|
| `[SPECSTRIDE-MODE]` | `mode`, `source` | Once, by `supervise mode` |
| `[SPECSTRIDE-LAUNCHER]` | `launcher` | Once, by `supervise resolve` |
| `[SPECSTRIDE-GATE]` | `decision`, and for a refusal `check`, `reason`, `next` | Once per launch attempt; the passing checks are not listed |
| `[SPECSTRIDE-SUPERVISE-LAUNCH]` | `pipeline`, `state`, `stages`, `relaunch` (remaining and maximum), `stop` | Once per launch, by `supervise launch` and `supervise auto` |
| `[SPECSTRIDE-SUPERVISE-STATE]` | `pipeline`, `stage` (`i/n`), `id`, `state` | Only when the signature of the observation changed |
| `[SPECSTRIDE-RELAUNCH]` | `pipeline`, `attempt`, `reason`, `stage` | Once per relaunch |
| `[SPECSTRIDE-NEXT]` | `poll-in` | After a non-terminal reading |
| `[SPECSTRIDE-REFUSE]` | `action`, `reason`, `next` | Once per refusal |
| `[SPECSTRIDE-SUPERVISE-STOP]` | `pipeline`, `sent` | Once per stop, by `supervise stop` |
| `[SPECSTRIDE-ANOMALY]` | `pipeline`, `detail` | Per anomaly |
| `[SPECSTRIDE-SUPERVISE-DIGEST]` | `pipeline`, `state`, `exit`, `last-stage`, `next` | Once, when the run is terminal, by `supervise` |
| `[SPECSTRIDE-DIGEST]` | `run`, `comment`, `changed`, `delegated`, `critic`, `fallback`, `alerts` (the keys of annex G §G.3) | Once per run, by the runtime, on the line before the digest line; never under the `parity` profile (F123-FR-043) |

`[MOL-HOLD]` has no equivalent in default output. The pipeline entry in default output prints, besides the digest, only `[WARN]`, the failure lines (`[BLOCKED]`, `[INVALID]`, `[STALE]`, `[ERROR]`, `[FAIL]`), and the dry-run plan; the progress lines go to the pipeline log only.

### §R.9 The supervision record

Written by the CLI (`supervise` verbs), read by the CLI and the run view. Schema `specstride.supervision/1` (feature 100, annex B §B.16). It holds the cadence state (`interval`, `unchanged`, `signature`), `stopRequested` (signal and time), and with `relaunch.owner: supervise` the relaunch budget (maximum, remaining, wall-clock seconds, deadline, declared pipeline seconds, source) and one entry per relaunch (`reason`, `detail`, launcher exit, child exit, stage, stage reason, stop reason, time, process id, remaining). The compatibility projection renders it as the as-is launch record of the pipeline (`pipeline:<pipelineId>:harness-run`) with the fields of the baseline: `schema pipeline mode launcher argv cwd contract bundle cmdline_markers contract_digest flags pid pgid launched_at first_launched_at launcher_log_offset run_dir state_path launcher_log launch_log report_log stage_count relaunch_budget relaunches supervision`, and `stop_requested` once a stop was asked.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A run looks after itself (Priority: P1)

A consumer launches a pipeline and closes the host session. The engine ends on a transient stop reason, or crashes. The runtime root, which is still alive, classifies the end, waits, and starts the engine again within the relaunch budget. The consumer comes back to a finished run or to a named reason why it is not.

**Why this priority**: Aim 3 of the product. The reference runs needed 135 to 143 manual restarts, and a host-side classifier acts only while a host session is open.

**Independent Test**: With `relaunch.owner: root` and no host process, an engine stub ends with `wall_budget` and `retryable: true` twice, then succeeds. The pipeline exits 0 after two relaunches, the ledger counts are carried, and no `supervise` verb ran. Then the stub crashes with a signal: the same run relaunches on the row for a crashed engine.

**Acceptance Scenarios**:

1. **Given** a stage of kind `specstride` whose terminal record says `retryable: true`, **When** the engine exits, **Then** the root consults table 2, fires `classified-transient`, records the rule id, and relaunches within budget (F123-FR-029, F123-FR-033).
2. **Given** an engine that dies by a signal and left no terminal record, **When** the root sees the end, **Then** it writes a synthesized terminal record with the cause `crash`, ends every owned process, and fires `classified-crash` (F123-FR-015, F123-FR-029).
3. **Given** a run that rests in `blocked-on-human`, **When** the root consults table 2, or `supervise observe` consults table 1 under any profile, the `parity` profile included, **Then** the decision is the refusal `blocked-on-human` and nothing is relaunched, even where the stage lists the exit code and allows the stop reason (F123-FR-030, F123-FR-042).
4. **Given** the host writes `hold-relaunch`, **When** a relaunch is due, **Then** the root stays in `relaunching` and does not relaunch until the hold is lifted or the deadline of the budget passes (F123-FR-032).

---

### User Story 2 - Supervision is cheap and every refusal is named (Priority: P1)

A host, or an operator, watches a run through `supervise`. Each cycle prints at most one short line. A refusal to launch or to relaunch prints a literal from a closed family and what to do next.

**Why this priority**: The host skill has a budget of 3,000 tokens for a whole run, and the consumer must never have to guess why a run did not start.

**Independent Test**: A fixture with a fake clock supervises a run of 24 hours in default output; the bytes printed stay under the limit of F123-FR-041. A fixture per refusal literal shows the literal and the exit code.

**Acceptance Scenarios**:

1. **Given** a launcher that was edited, **When** `supervise gate` runs, **Then** it prints the refusal `launcher-edited`, reports the checks after it as `not-evaluated`, and exits 4 (F123-FR-021).
2. **Given** a live run, **When** `supervise launch` runs, **Then** the decision is `attach`, reason `already-running`, and the exit is 4 (F123-FR-021, F123-FR-022).
3. **Given** a run that did not change between two readings, **When** default output is on, **Then** nothing is printed for the second reading; in compatibility output `[MOL-HOLD]` is printed (F123-FR-038, F123-FR-039).

---

### User Story 3 - The port behaves as the baseline under the `parity` profile (Priority: P1)

The differential oracle runs the fixture families FX-35 and FX-36 against the port and against the baseline of mixture-of-loops, each twice: against the engine stub and against the real engine with agent stubs.

**Why this priority**: Every parity test passes before any release (ruling 32).

**Independent Test**: Run FX-35 and FX-36 under the profile `parity`. Every result is `equal`, or `waived` with the register row DV-075 or DV-009.

**Acceptance Scenarios**:

1. **Given** the profile `parity`, **When** a stage fails, **Then** the pipeline entry exits 22 at once with the state and digest of the baseline and the root does not stay alive (F123-FR-027, F123-FR-013).
2. **Given** the profile `parity`, **When** `supervise observe` reads a failed run, **Then** it classifies with table 1 and prints `[MOL-RELAUNCH]` as the baseline does (F123-FR-028, F123-FR-038).
3. **Given** a second pipeline on a workspace whose lock is held, **When** it starts, **Then** it exits 24, where the baseline ends 22 with child exit 5; the fixture carries the waiver DV-075 (F123-FR-007).

---

### User Story 4 - An author adds a stage kind without touching the core (Priority: P2)

The author of a later stage kind, or of a later precondition check, registers it from a package. The schema of the launch contract, its validator and the stage executor do not change.

**Why this priority**: Stage kinds were a closed list in the as-is launch contract; the architecture makes them an extension point (EP-19).

**Independent Test**: A sample stage kind and a sample check are registered from the test tree; a launch contract that names them validates, shows in the dry-run plan, and runs; then the sample is removed and no core file differs.

**Acceptance Scenarios**:

1. **Given** a registered sample kind, **When** the launch contract uses it, **Then** it is validated, planned and run (F123-FR-010).
2. **Given** a kind or a check that no registry holds, **When** the launch contract is validated, **Then** it is invalid and the pipeline entry exits 20 (F123-FR-010).

---

### User Story 5 - A consumer sees the plan before anything runs (Priority: P2)

A consumer runs the pipeline entry with `--dry-run` and reads what would happen.

**Why this priority**: Invocation is consent; a dry run withholds it (Principle XV).

**Independent Test**: A dry run on a fixture launch contract exits 0, creates no pipeline run, log, lock or state, and prints exactly one `[DIGEST] state=dry-run` line.

**Acceptance Scenarios**:

1. **Given** a valid launch contract, **When** `--dry-run` is given with `--implement` and `--smoke`, **Then** nothing is executed and nothing is written (F123-FR-005).
2. **Given** parallel units on, **When** a dry run prints the plan, **Then** it includes the parallel plan; with them off, or under the `parity` profile, it prints no line about it (F123-FR-006).

---

### Edge Cases

- The launch contract is stale and invalid at once: staleness is reported first, as at the baseline (F123-FR-004).
- A required environment variable is unset for an action: preflight fails and names it; the run does not start (F123-FR-008).
- Stage state was written for another launch contract hash: it is reset and the old hash is recorded (F123-FR-009).
- A stage child ignores the termination signal: it is killed after 5 seconds and the stage reason is `timeout` (F123-FR-011).
- The runtime root receives a signal while a stage attempt sleeps in backoff: no further attempt starts; the state is `stopped` (F123-FR-014).
- A stage of kind `specstride` ends with the child exit 6: the pipeline ends with 22 and the state `stopped`, and nothing relaunches it (F123-FR-013, F123-FR-030).
- The terminal record of the engine is missing: the end is classified as a crash from the exit code (F123-FR-015).
- The launcher was edited after the launch checks passed: the next relaunch refuses with `launcher-edited` (F123-FR-028, F123-FR-029).
- The runtime root dies, or the machine reboots: nothing relaunches by itself; the run reads as `dead` and `resume` continues it (F123-FR-030).
- A hold is in force and the wall-clock deadline of the budget passes: the run ends `failed` with the reason `budget-deadline-exceeded` (F123-FR-032).
- The stop was asked for because a source changed: the run rests in `blocked-on-human`, and neither table relaunches it (F123-FR-030).
- A run ends blocked for `auth`, `quota-credit` or `budget-cap` with engine exit 4, and the stage lists exit 4 and allows the stop reason: table 1 refuses at O-33 and table 2 at R-03 (F123-FR-042).
- The wall-clock budget of the engine trips: the stop is `retryable: true` with no blocked reason, and both tables may relaunch it (F123-FR-030; CQ-192).
- The platform has no tool for a terminal: the child of a `specstride` stage runs through the pipe and the run goes on (F123-FR-011, F123-FR-044).

## Requirements *(mandatory)*

### Functional Requirements

#### Group G1: stage executor

- **F123-FR-001**: The pipeline entry MUST accept the arguments of §R.1 and no others. `--dry-run` MUST take precedence over `--implement` and `--smoke`. `--contract` and `--launch-dir` MUST be required and MUST be supplied by the launcher only. An unknown argument, or a value of `--color` other than `auto`, `always` or `never`, MUST end with exit 2.
  - origin: C-225; B-2555; B-2556; B-2558; B-2564
  - disposition: ported
  - test: PT-123-C-225-*
  - ep: EP-19 `specstride.stage-kind/1` (implements)

- **F123-FR-002**: Colour MUST be decided in this order: `--no-color` (off), then `--color always` or `--color never`, then the presence of the variable `NO_COLOR` with any value (off), then `auto` (on only when standard output is a terminal). Only the label of a labelled line MUST be wrapped in colour, with the hue of §R.2, and the pipeline log MUST always receive the plain line. The reading of `NO_COLOR` by presence, with any value and with the empty value, is that of the baseline of mixture-of-loops (behaviour item B-2563). The presenter of the front door reads the same variable as "set and non-empty", which is the baseline of Specstride (behaviour item B-1411); the two readings differ for the empty value only, and each is kept because a parity test compares it. The variable reaches no configuration key.
  - origin: C-225; C-226; C-230; B-2559; B-2560; B-2563; B-2589
  - disposition: translated
  - test: PT-123-C-226-*; PT-123-C-230-*
  - divergence: DV-027
  - parity: as at the baseline; the fixtures run with colour off (rows 18 and 38 of annex X §X.7)

- **F123-FR-003**: Every child of the pipeline MUST run with an environment built as follows. An entry taken from a named variable copies that variable; a missing required variable is the message `required environment variable is unset: <name>`; a missing optional one removes the target name. Keys pinned by the launch contract MUST take the value of the launch contract and the value from the shell MUST be stripped; this MUST apply to the learning mode, to the bound of learning decisions, and to live output in a run without a terminal, and to no other key. With colour off every child MUST get `NO_COLOR=1` unless it declares its own, and a stage of kind `specstride` MUST run without live output. An action printed in a line MUST be redacted as in §R.2.
  - origin: C-226; C-231; B-2562; B-2613; B-2617
  - disposition: translated; ported
  - test: PT-123-C-226-*; PT-123-C-231-*
  - divergence: DV-026; DV-027
  - parity: as at the baseline (the two as-is keys only) (rows 38 and 43 of annex X §X.7)

- **F123-FR-004**: At start the pipeline entry MUST, in this order: read the arguments; load the launch contract and validate it against the sources; print each validation warning as `[WARN]`; refuse with exit 23 when the sources are stale or the bound learning decisions changed (`[STALE]`, then the digest, both on standard error); refuse with exit 20 when the launch contract is invalid (`[INVALID]`, then the digest, both on standard error); handle a dry run; take the lock. On both refusals nothing MUST be written to the pipeline log. The verdict on staleness is that of feature 100, annex C §C.7; the entry prints exit 23 on it.
  - origin: 011 FR-011; C-227; C-230; B-2564; B-2565; B-2566; B-2604; B-2605; B-2606
  - disposition: ported; translated
  - test: PT-123-011FR011-*; PT-123-C-227-*; PT-123-C-230-*
  - divergence: DV-007; DV-033

- **F123-FR-005**: With `--dry-run` the pipeline entry MUST print the plan of §R.2 and MUST NOT execute an action, create a pipeline run, a log, a lock or a state record. The plan MUST also be printed when `launch` in the mode `dry-run` asks for it (F107-FR-033); the call reads and writes as the dry run does. It MUST print `[DRY-RUN]` first; for each stage that would run, `[PREFLIGHT]` once per preflight-timed precondition, where a `command_success` check is not executed and reads `deferred`; then for each stage `[SKIP]`, `[CHECK]` or `[PLAN]`; and exactly one `[DIGEST] state=dry-run exit=0 last-stage=none evidence=none` as the last line. It MUST exit 0.
  - origin: 011 FR-011; 011 SC-003; C-225; C-230; B-2557; B-2598; B-2599; B-2600; B-2601; B-2602; B-2603
  - disposition: ported; translated
  - test: PT-123-011FR011-*; PT-123-011SC003-*; PT-123-C-225-*; PT-123-C-230-*
  - divergence: DV-007; DV-033

- **F123-FR-006**: With parallel units on, the dry-run plan of the pipeline entry MUST include the parallel plan, read from the stored plan or derived by the same pure function, as feature 100 annex D §D.3 states. With parallel units off, and under the `parity` profile, the dry run MUST print no line about it.
  - divergence: DV-080; DV-088
  - parity: no line (row 20 of annex X §X.7)
  - test: CT-123-106

- **F123-FR-007**: The pipeline entry MUST take the one lock of the workspace, before any state is written, and MUST end with exit 24 when it is held, printing `[BLOCKED] another launcher owns <pipeline run>` and the digest with `exit=24`. It MUST keep the state of the pipeline in one record that it writes atomically, whose unreadable content is read as empty, and MUST append every labelled line to the pipeline log. A second pipeline on a workspace whose lock is held MUST end with 24 at launch.
  - origin: 011 FR-012; C-227; C-228; C-229; C-230; B-2567; B-2583; B-2586; B-2587; B-2607
  - disposition: translated; ported
  - test: PT-123-011FR012-*; PT-123-C-229-*; PT-123-C-227-*
  - divergence: DV-006; DV-022; DV-075
  - ep: EP-13 `specstride.lock/1` (consumes)

- **F123-FR-008**: Preflight MUST run over every enabled stage before any stage runs and MUST collect every failure before it exits. For each enabled stage it MUST check: that every required variable of the action and of the resume action is set (skipped for a setup stage without `--implement`); every preflight-timed precondition; and, for a setup stage without `--implement`, its postconditions, with the failure text ending `; rerun with --implement`. A failure MUST print `[BLOCKED] <failure>`, set the pipeline state `failed` with the exit reason `preflight`, print the digest with `exit=21`, and exit 21.
  - origin: 011 FR-013; C-227; C-228; C-230; C-231; B-2569; B-2584; B-2608; B-2626
  - disposition: ported; translated
  - test: PT-123-011FR013-*; PT-123-C-231-*
  - divergence: DV-007; DV-033

- **F123-FR-009**: Stages MUST run in the order of the launch contract. A smoke stage without `--smoke` MUST be skipped (`[SKIP] <stage> smoke stage disabled`). A stage that an earlier launch completed MUST be skipped when its postconditions still hold, and rerun when they do not (`[RESUME]`). When the launch contract hash differs from the one in the state record, the state of every stage MUST be reset and the old hash MUST be recorded as `superseded_contract_digest`. The hash MUST be taken over the launch contract without its `inventory`, its generation data, and the revision and dirty flag of its repository, with the hash of a task-list source that ignores checkboxes in place of its plain hash, by the canonical hasher of feature 100, annex X §X.5, so that a tick never resets a stage. The state record MUST hold the fields of §R.4; the state MUST pass through `preflight`, `ready`, `running` and a terminal value; and the digest of a complete run MUST name the last stage of the launch contract even when it was skipped.
  - origin: 011 FR-014; C-228; C-230; C-231; B-2585; B-2609; B-2610; B-2612; B-2623; B-2624; B-2625; B-2628
  - disposition: ported; translated
  - test: PT-123-011FR014-*; PT-123-C-231-*
  - divergence: DV-006
  - assumption: CQ-046 (the hash that ignores checkboxes is the launch contract hash of this requirement; feature 104 owns the hashing scheme)

- **F123-FR-010**: Stage kinds and precondition checks MUST be two open registries with the built-in entries of §R.3, and the stage executor MUST reach both through the registries only. A registered kind MUST offer the operations `validate`, `run` and `evaluate` of feature 100, annex F §F.7; a kind or a check that no registry holds MUST make the launch contract invalid (exit 20). A setup stage MUST behave as §R.3 says, including `[READY]`, `[BLOCKED] <stage>: <failure>; rerun with --implement` and the reasons `existing-prerequisite` and `setup-required`; a stage-timed precondition that fails MUST print `[BLOCKED] <stage>: <failure>` and end the stage with the reason `stage-precondition`. A precondition check MUST read and never write. A condition path or an evidence path that is a logical name of annex B §B.5 MUST be resolved through the state layout, by the same function that validation of the launch contract uses (F107-FR-026), and is outside the rule of the authorized roots; a condition path that begins with the name of the workspace part MUST be resolved under the workspace part; the as-is fallback to the state directory of a legacy product MUST NOT be carried; the as-is spelling of the stage kind `specstride` of the legacy product MUST NOT be accepted. A kind that throws MUST end the stage with `exec-error:` and its detail; a check that throws MUST be `fail`.
  - origin: C-231; C-228; C-230; B-2614; B-2615; B-2575; B-2576; B-2577; B-2590; B-2591; B-2592
  - disposition: ported; translated
  - test: PT-123-C-231-*; PT-123-C-228-*; CT-123-110
  - divergence: DV-036; DV-038
  - ep: EP-19 `specstride.stage-kind/1` (implements)
  - assumption: CQ-022 (the operations are those of annex F §F.7)

- **F123-FR-011**: A stage attempt MUST run its action from a fixed argument list without a shell, in the working directory of the stage, with standard input closed and in a process session of its own. A stage of kind `specstride` MUST have its output shown as the child produced it: with a terminal when colour is on and standard output is not a terminal; through a pipe, echoed and logged with escape sequences removed, when colour is off. The terminal comes from a tool of the platform that the product does not ship (`script`; `plan.md`, Technical Context). Where no terminal can be given, because the tool is absent, cannot be started or ends before the child starts, the stage attempt MUST run its child through the pipe as it does with colour off, the run MUST go on, and the pipeline entry MUST print one `[WARN]` line for the run, on the stream and in the form of the `[WARN]` row of §R.2, that names the missing tool; the absence MUST never fail a stage, a preflight or a launch check. Every other kind MUST inherit the streams of the pipeline entry and MUST NOT be logged. An action that exceeds its time limit (default 3,600 seconds) MUST be sent the termination signal to its process group and the kill signal after 5 seconds; the child code MUST be 124 and the stage reason `timeout`. An action that cannot start MUST have the child code 127 and the stage reason `exec-error:` followed by the cause. `[RUN] <stage> attempt <n>/<max>: <redacted action>` MUST be printed at every attempt.
  - origin: C-228; C-230; C-231; B-2572; B-2574; B-2593; B-2618; B-2619
  - disposition: ported
  - test: PT-123-C-228-*; PT-123-C-231-*; CT-123-144
  - status: unverified (check: FX-35 `stage-timeout` and the stream fixtures on a macOS runner; verified-on: —; pin: macOS version of the runner)

- **F123-FR-012**: In-stage retry MUST follow the declared recovery of the stage: attempts up to the maximum (default 1); from the second attempt the resume action replaces the action when one is declared; a failed attempt is retried only when its exit code is in the declared list and, where a reason rule is declared, the newest stop reason is one of the allowed reasons; the delay is the declared backoff at index `min(attempt-1, length-1)`, or 0; and when the elapsed time reaches the declared total time limit the retry MUST stop with the stage reason `recovery-deadline`. A child exit 0 with a failed postcondition MUST print `[ERROR] <stage> postcondition: <failure>`, end with the reason `postcondition`, and never be retried. A retry MUST print `[RECOVER] <stage> exit <code>[, reason=<reason>]; retry in <delay>s`; a final failure `[FAIL] <stage> exit <code> (<outcome>)`; a success `[PASS] <stage> completed`, with the stage reason `completed`. The stage reason `recovery-exhausted` MUST be accepted and MUST never be produced.
  - origin: 011 FR-015; C-228; C-230; C-231; B-2573; B-2579; B-2580; B-2581; B-2582; B-2594; B-2595; B-2596; B-2597; B-2620; B-2621; B-2622
  - disposition: ported
  - test: PT-123-011FR015-*; PT-123-C-228-*; PT-123-C-231-*
  - divergence: DV-028

- **F123-FR-013**: The pipeline entry MUST exit with exactly the codes of §R.1, each class of failure with one distinct code. A stage that failed and was not interrupted MUST end the pipeline with 22. A stage whose child exited 6 MUST end the pipeline with 22 and the state `stopped`, and MUST never be relaunched. The state values MUST be those of §R.4; the exit reason of a complete run MUST be `all-stages-complete`. The runtime root MUST write the transitions of the run-state machine that annex E §E.2 gives it (T4, T5, T10, T11, T12, T14, T15, T16, and its part of T8 and T9) and no other. With `relaunch.owner: root` the code 22 MUST be the code with which the root finally exits when it does not relaunch, and the state and the digest MUST show the same values as with `supervise`.
  - origin: 011 FR-015; C-227; C-228; C-231; B-2570; B-2571; B-2627
  - disposition: ported
  - test: PT-123-011FR015-*; PT-123-C-227-*; PT-123-C-231-*
  - divergence: DV-074

- **F123-FR-014**: On an interrupt, a termination or a hang-up the pipeline entry MUST forward the signal to the process group of the running child, MUST start no further stage attempt and no backoff wait, MUST end the stage with the reason `interrupted` and the child code 128 plus the signal, set the state `stopped`, and exit 128 plus the signal number.
  - origin: C-227; C-228; B-2568; B-2578
  - disposition: ported
  - test: PT-123-C-227-*; PT-123-C-228-*
  - status: unverified (check: FX-35 `signal-<name>` on a macOS runner; verified-on: —; pin: macOS version of the runner)

- **F123-FR-015**: The executor MUST read the outcome of a stage of kind `specstride` from the terminal record of the engine: exit code, stop reason and `retryable`. When the record is missing it MUST classify the end as a crash from the exit code and write a synthesized terminal record with the cause `crash`. The retry rules of a stage MUST use the stop reason of the terminal record. A stage may list in its reason rule only stop reasons of feature 100, annex E §E.3, whose attribute `transient` is yes; at the baseline exactly `wall_budget` and `proposer_consecutive_errors`. A reason rule MUST hold a non-empty list of allowed stop reasons; in a launch contract of the baseline it also names a source of reasons inside the authorized roots, an optional field (default `reason`) and an optional event name. Where a reason rule names a source of reasons, the value printed as `stop-reason=` in compatibility output MUST be that of the newest line of the projected events that carries a reason field, as at the baseline.
  - origin: C-231; C-215; C-218; B-2616; B-2496; B-2532
  - disposition: ported
  - test: PT-123-C-231-*; PT-123-C-215-*; PT-123-C-218-*
  - divergence: DV-028; DV-005
  - ep: EP-19 `specstride.stage-kind/1` (implements)

- **F123-FR-016**: The digest MUST be the final line of every run of the pipeline entry, in the grammar of feature 100, annex G §G.3: `state`, `exit`, `last-stage`, then `child-exit` only for a failed or stopped stage, then `evidence`. `child-exit` MUST print the literal `None` when the stage never ran its action. The digest MUST be produced from events by the runtime and never composed by a host. The digests of a stale or an invalid launch contract MUST go to standard error with `evidence=none`.
  - origin: 011 FR-023; C-230; B-2603; B-2605; B-2606; B-2607; B-2608; B-2611; B-2612
  - disposition: translated
  - test: PT-123-011FR023-*; PT-123-C-230-*
  - divergence: DV-007; DV-033; DV-070

- **F123-FR-017**: The pipeline entry MUST have the two output modes of feature 100, annex G §G.2. In compatibility output it MUST print the lines of §R.2 byte for byte, the literal `None` and the labels included. In default output it MUST print only the digest, `[WARN]`, the failure lines, and the dry-run plan; the progress lines MUST go to the pipeline log only.
  - divergence: DV-033; DV-034
  - parity: compatibility output (row 18 of annex X §X.7)
  - test: CT-123-117

- **F123-FR-018**: Before any launch check of the pipeline and before any stage, the launcher, the pipeline entry and the runtime root MUST call the integrity check of the launch bundle and the launcher of feature 107 (F107-FR-031), and a failure MUST end the start with exit 20. The runtime root MUST emit the events `stage.started` and `stage.ended` for every stage attempt of every launch, and the events `supervisor.observed`, `supervisor.relaunch` and `supervisor.stopped` as annex E §E.2 says, in the envelope of feature 100, annex X §X.1. It MUST also emit four more types of the event catalogue (annex X §X.6, row 73): `pipeline.started` once per launch and per relaunch, after it took the lock and before preflight; `pipeline.ended` once for each `pipeline.started`, with the state, the exit reason, the exit code, the last stage and the child exit of the digest; `digest.written` once, when it produces the digest of F123-FR-016; and `launch.checked` once for each launch check that the root itself verifies at its start and before every relaunch (the launcher, the launch contract and the workspace lock), with the name of the check, its status, the decision and the reason. `pipeline.started` MUST carry, where the launch holds them, `commentHash` (from the launch record), `comment` (from the comment record beside the launch record, through the ingress class `comment`), `changed` (the options of `configuration.comment` of the launch contract, as a list of option names) and `delegated` (the harness ids that the provenance of the judgment answers of the launch contract names with the route `delegated-harness`). A dry run and the two start-up refusals of F123-FR-004 write no event, because they write nothing. The launch checks that the CLI evaluates before a runtime root exists are no events: the CLI does not write the event file, and their result is in the launch record and in the lines of §R.8. Every event that opens something MUST have a matching event that closes it. No event MUST hold output of a stage.
  - divergence: DV-007
  - test: CT-123-118
  - assumption: CQ-222 (which process emits `launch.checked`; reported on 2026-09-30)

- **F123-FR-019**: The stage graph MUST be serial: one stage at a time, in the declared order. The rule that decides whether a stage is skipped on resume MUST be defined over groups of stages, and in Wave 1 every group MUST hold one stage.
  - test: CT-123-119
  - status: unverified (check: research R15 A-8; the six constraints that keep later graphs possible are not tested in Wave 1; verified-on: —; pin: —)

- **F123-FR-020**: The runtime root MUST accept the run request of kind `engine`: one engine start with its arguments, for `specstride-reverse` and for `run --detach`, with the same lock, lease, relaunch classifier and digest as a request of kind `pipeline`, no launch contract to validate, and no stage. The classifier tables MUST treat the engine start as one stage of kind `specstride` that declares no recovery: the signals `childExitListed` and `reasonAllowed` are true, and the `retryable` of the terminal record decides. The relaunch budget of such a request MUST be 2 relaunches with no wall-clock deadline of its own; the wall-clock budget of the engine applies.
  - divergence: DV-074
  - test: CT-123-120
  - ep: EP-19 `specstride.stage-kind/1` (consumes)

#### Group G2: launch checks and launch

- **F123-FR-021**: The launch checks MUST be the six of §R.5, in that order, and MUST stop at the first failure: the checks after it MUST be reported `not-evaluated`. Each failure MUST name its refusal reason from the 11 of §R.5 and a detail, and the decision MUST be `refuse`, except for `already-running`, where it MUST be `attach`. The decision MUST be `launch` when all six pass. The launch dry run MUST pass `--implement` and `--smoke` through, and run with colour off, standard input closed, a new process session and the launcher directory as working directory. The pipeline entry MUST print the exit 23, 20, 21 or 24 of the refusal when the refusal is one of the pipeline's.
  - origin: 011 FR-019; C-252; C-255; B-2703; B-2704; B-2705; B-2706; B-2707; B-2708; B-2709; B-2710; B-2711; B-2761; B-2762
  - disposition: translated; ported
  - test: PT-123-011FR019-*; PT-123-C-252-*; PT-123-C-255-*
  - divergence: DV-054
  - ep: EP-14 `specstride.doctor/1` (implements (an entry))

- **F123-FR-022**: The launch checks MUST be checks of the doctor registry with the launch-blocking flag set and a fixed order, so that `launch` and the doctor cannot disagree. The six checks of §R.5 MUST come first. Other launch-blocking checks that other packages register MUST run after them, and a failure of one of them MUST refuse the launch with its own reason. Under the `parity` profile only the six checks MUST print a line. The check `run-directory-free` MUST report a held workspace lock before the launch, from the lock provider, and a held lock MUST give the decision `attach`. The critic-diversity warning MUST never be a launch check.
  - divergence: DV-028; DV-075
  - test: CT-123-122
  - ep: EP-14 `specstride.doctor/1` (implements (an entry)); EP-13 `specstride.lock/1` (consumes)
  - assumption: CQ-047 (how other launch-blocking checks print under compatibility output; the feature 100 text says only that the launch checks are exactly the flagged subset)

- **F123-FR-023**: The `launch` verb MUST start the launcher through the detach strategy, once, with the argument list `[launcher, --no-color]` followed by `--implement` and `--smoke` when given, never a shell string. The started process MUST have standard input closed, be the leader of a process session of its own, and write both of its streams to the launch log, which MUST receive the header `=== launch <time> <argv> ===` at each launch and `=== relaunch <time> <argv> ===` at each relaunch. The environment of the launch, of a relaunch and of the launch dry run MUST carry `NO_COLOR=1`; no cache file of a language MUST be written into the working directory. `launch` MUST leave the record of §R.9 with the process and process-group identity, the launch contract hash, the flags, the offset of the pipeline log at launch, the number of stages that will run, and the relaunch budget with its source, and MUST print the launch line. The mode MUST be recorded in the record and in the line only; no behaviour of supervision or relaunch MUST branch on it.
  - origin: 011 FR-020; C-255; C-253; C-254; C-250; B-2763; B-2765; B-2766; B-2732; B-2733; B-2742; B-2694
  - disposition: translated; ported
  - test: PT-123-011FR020-*; PT-123-C-255-*; PT-123-C-253-*
  - divergence: DV-006; DV-027; DV-055
  - ep: EP-17 `specstride.detach/1` (consumes)

- **F123-FR-024**: A launch MUST end in exactly one handshake outcome of feature 100, annex F §F.3. `started` MUST exit 0. `attached` MUST exit 4, as the launch decision `attach` does at the baseline. `refused` MUST exit 4, or the pipeline code 20, 21, 23 or 24 where the refusal is one of the pipeline's. The refusal line MUST name the literal of the closed family and the next step.
  - divergence: DV-075
  - test: CT-123-124
  - ep: EP-17 `specstride.detach/1` (consumes)

- **F123-FR-025**: `supervise mode` MUST choose the mode of a launch from a request text and tokens. A token `--auto`, `--run` or `--generate`, from `--token` or found in the text, MUST win over all prose; the first matching token decides. Otherwise ten refusal phrases (do not run, execute, launch or start; without running; no execution; do not auto; only derive or generate; generation only; dry-run only; no auto) MUST give `generate` with the source `refusal`; auto phrases (`auto`; a generation verb followed by run, then run, launch or execute) MUST give `auto` with the source `prose`; run phrases (run it, this, that or them; run the pipeline, launcher, script, loop or stage; execute, launch, start or kick off it or the launcher; resume the run or pipeline; for real; then run; and run it) MUST give `run`, or `auto` when a generation word is also present; a bare dry-run mention MUST give `generate` with the evidence `dry-run`. The flags `implement` and `smoke` MUST be read from the tokens or the phrases `with --implement`, `implement setup`, `with --smoke`, `smoke stage(s)`. The mode MUST map to the modes of the host skill: `generate` to `dry-run`, `run` and `auto` to `run`. The default mode MUST be `run`, and the request text MUST only select among options that the validation of the launch contract accepts; no text MUST switch off a launch check, the terms gate or a budget.
  - origin: C-246; C-255; B-2669; B-2751; B-2752; B-2753; B-2754; B-2755; B-2756
  - disposition: translated
  - test: PT-123-C-246-*; PT-123-C-255-*
  - divergence: DV-009
  - parity: mapped through the mode map (row 37 of annex X §X.7); the case "no execution phrasing" carries the waiver of DV-009

- **F123-FR-026**: `supervise resolve` MUST find the launcher in this order: the requested path (relative to the repository); the default launcher of the feature; the single file in the repository whose first 400 bytes carry the marker of generated launchers (skipping the version-control directory, links, and the directories of generated bundles and of pipeline runs). It MUST print the launcher line, or refuse with `launcher-not-found`, `launcher-missing` or `launcher-ambiguous`, and it MUST refuse with `launcher-unreadable` or `launcher-not-generated` when the launch bundle cannot be read from the launcher. The refusal MUST print `next="ask for `auto` to generate the launcher first"` and exit 4.
  - origin: C-246; C-252; C-254; C-255; B-2671; B-2699; B-2700; B-2701; B-2702; B-2739; B-2759
  - disposition: translated; ported
  - test: PT-123-C-246-*; PT-123-C-252-*; PT-123-C-254-*; PT-123-C-255-*
  - divergence: DV-066
  - assumption: CQ-052 (the five refusals of `resolve` form a closed set of their own, proposed as a new row of annex X §X.6)

#### Group G3: relaunch

- **F123-FR-027**: `relaunch.owner` MUST be ordinary configuration with the values `root` and `supervise` and the default `root`. With `root` the runtime root MUST stay alive after a failed stage and MUST consult table 2 of §R.6. With `supervise` the runtime root MUST exit with the pipeline code at a failed stage, and `supervise observe` MUST classify with table 1 and relaunch. An unknown value MUST be a configuration error. The value MUST be recorded in the run record, and MUST be the same for the whole run.
  - divergence: DV-074
  - parity: `supervise` (row 14 of annex X §X.7)
  - test: CT-123-127
  - ep: EP-19 `specstride.stage-kind/1` (consumes)

- **F123-FR-028**: Table 1 of §R.6 MUST classify the end of a run for `supervise observe` and MUST reproduce the baseline: the first failing condition names the refusal, and every refusal MUST print its literal, `detail` and the reason in `[MOL-REFUSE]`, `[MOL-RELAUNCH]` or the digest. A relaunch MUST be permitted only for a terminal `failed` run with launcher exit 22, a transient stage reason, a child exit in the stage's list, an allowed stop reason where one is declared, an unchanged launch contract hash, unchanged bound learning decisions, an intact launcher, and relaunch budget and wall clock remaining. A relaunch by `supervise observe` MUST re-invoke the recorded argument list in the recorded working directory with the environment of the supervisor at that moment, decrement the remaining count, append the justification of the decision (reason, detail, launcher exit, child exit, stage, stage reason, stop reason, time, process id, remaining) to the record, and reset the cadence state. The order of the rows MUST be observable and MUST not change. The closed family of relaunch refusals MUST be the members listed under "Closed sets". Every row MUST have a golden test, and for every input exactly one row MUST fire.
  - origin: 011 FR-021; C-252; C-255; B-2696; B-2697; B-2698; B-2712; B-2713; B-2714; B-2715; B-2716; B-2717; B-2718; B-2719; B-2720; B-2721; B-2722; B-2723; B-2724; B-2725; B-2726; B-2727; B-2728; B-2729; B-2730; B-2731; B-2750; B-2775; B-2776
  - disposition: ported
  - test: PT-123-011FR021-*; PT-123-C-252-*; PT-123-C-255-*
  - divergence: DV-005; DV-028; DV-070
  - ep: EP-19 `specstride.stage-kind/1` (consumes)
  - assumption: CQ-052 (the closed family holds 30 spellings in the code, where annex X §X.6 says 21)

- **F123-FR-029**: Table 2 of §R.6 MUST be the only classifier of the runtime root. It MUST be a pure table of the evaluator of annex X §X.3: versioned data, no input beyond the named signals, the rule id and the table version recorded with every decision, and one row that fires for every vector of signals. A crashed engine (`cause` `crash`) MUST be relaunched within the budget, whatever exit codes and reasons the stage lists, and every counter MUST be carried from the ledger. Every row MUST have a golden decision and a property test that exactly one row fires for every input.
  - divergence: DV-074; DV-005
  - test: CT-123-129
  - ep: EP-19 `specstride.stage-kind/1` (consumes)
  - assumption: CQ-053 (the five literals that table 2 adds: `blocked-on-human`, `lease-lost`, `stop-not-retryable`, `relaunch-held`, `classified-crash`)

- **F123-FR-030**: Neither table MUST relaunch a run whose terminal record says `retryable: false`, a run that rests in `blocked-on-human` (among them a run that stopped because a source changed), a run that was stopped on request or by a signal, or a run while `hold-relaunch` is in force. The tables MUST refuse such a run by rows of their own: table 1 by O-33 (`blocked-on-human`) and O-34 (`stop-not-retryable`), table 2 by R-03 and R-14 (F123-FR-042). Two cases are outside the rule on `retryable: false`, and no other: a crashed engine, whose synthesized terminal record carries `retryable: false` and which table 2 relaunches by its cause (row R-23, F123-FR-029); and, under the `parity` profile, table 1, where the row O-34 is inactive and a stop that is not retryable and not blocked is classified as the baseline does (F123-FR-042; register row DV-114). Under every profile, the `parity` profile included, a run that rests blocked on a human MUST be relaunched 0 times under either value of `relaunch.owner`. A stop by a tripped wall-clock budget, which carries `retryable: true` and no blocked reason, MUST stay relaunchable under both tables. A quota pause MUST give the classifier nothing to classify, and `paused_quota_ceiling` and `proposer_consecutive_errors` of a class that is not quota MUST be classified by their attribute `retryable`. A stage of kind `specstride` whose terminal record carries a blocked reason MUST end the pipeline with 22 and the state `failed`, its digest MUST carry the child exit of the engine, and the runtime root MUST release the lock and end; the run record MUST show `blocked-on-human`. When the runtime root itself dies, or the machine reboots, nothing MUST relaunch by itself: the run reads as `dead` and `resume` continues it.
  - divergence: DV-005; DV-082; DV-067; DV-114
  - test: CT-123-130; CT-123-142
  - assumption: CQ-192 (a tripped wall-clock budget is `retryable: true` and carries no blocked reason); CQ-238 (row O-33 is active under every profile, the `parity` profile included)

- **F123-FR-031**: The relaunch budget MUST default to 2 relaunches, and a declared budget MUST allow 0 to 5, whatever the mode. The wall-clock ceiling MUST be at most (relaunches + 1) times the declared seconds of the pipeline, which by default is that value; the declared seconds of a stage are its number of attempts times the time limit of its action (default 3,600 seconds) plus the sum of its declared backoff. The deadline MUST be fixed at the first launch and MUST NOT be extended by relaunches; every relaunch MUST decrement the remaining count and record why. The budget MUST be one per launch, shared by all stages; a launch or a `resume` started by the consumer MUST start a new budget, and only relaunches by the runtime root or by `supervise observe` MUST consume it. The budget MUST have a source, `declared` or `default`. The declared budget MUST be read from the launch contract under the key `configuration.relaunch`, which accepts only the maximum of relaunches (a whole number from 0 to 5) and the wall-clock seconds (above 0 and not above (relaunches + 1) times the declared seconds of the pipeline), the validation of the launch contract against its schema (feature 100, annex G §G.8, F100-FR-190) refusing anything else; the compatibility projection MUST print the as-is name `configuration.auto` and the as-is key names `max_relaunches` and `wall_clock_seconds`. A run MUST never be relaunched more than 5 times, and by default not more than 2.
  - origin: 011 FR-022; 011 SC-006; C-218; C-255; B-2512; B-2513; B-2518; B-2766; B-2767
  - disposition: translated; ported
  - test: PT-123-011FR022-*; PT-123-011SC006-*; PT-123-C-218-*; PT-123-C-255-*
  - divergence: DV-055

- **F123-FR-032**: The inbox request `hold-relaunch` MUST hold every relaunch by the runtime root while `hold` is true and MUST lift the hold when `hold` is false. The host MUST write it through `supervise hold` and `supervise release`. A held relaunch MUST leave the root in the state `relaunching`, MUST emit nothing that changes the count, and MUST be decided again when the hold is lifted. When the deadline of the relaunch budget passes while a hold is in force, the run MUST end `failed` with the reason `budget-deadline-exceeded`, and the detail of that decision MUST say that the relaunch was held; the digest of `supervise` prints it in the next-action text `no relaunch (<reason>): <detail>` of §R.8, because the digest line of §R.2 has no field for it. With `relaunch.owner: supervise` the request MUST have no effect and the verbs MUST refuse with `no-live-run`, the one member of the closed set "Hold refusals" under "Closed sets", and exit 4.
  - divergence: DV-074
  - test: CT-123-132
  - assumption: CQ-048 (the relaunch window of annex E §E.2 T12 is the deadline of the budget; the verbs `hold` and `release` and their refusal are not in annex G §G.1)

- **F123-FR-033**: A relaunch by the runtime root MUST end every `owned` process of the run, wait the declared backoff (the backoff of the failed stage at the index of the relaunch, or 0), mint a new launch identity and a new engine start, start the engine with a fresh session, and re-enter the pipeline entry after the lock: preflight again, then the stage loop, which skips the stages that are complete under the rule of F123-FR-009 and so resumes at the failed stage. The counts and the identities of attempts MUST come from the ledger. The run state MUST be `relaunching` from the decision to the start; it is a state of the run-state machine of feature 100, annex E §E.2 (T10 to T12), and not a value of the pipeline state of §R.4. Each decision MUST be an event `supervisor.observed` and each start an event `supervisor.relaunch` with the rule id and the table version; the compatibility projection MUST render the as-is relaunch line from the root's event.
  - divergence: DV-074; DV-033
  - test: CT-123-133
  - assumption: CQ-049 (the backoff before a relaunch by the root; annex E §E.2 T11 names a backoff and no source gives its value)

#### Group G4: supervision

- **F123-FR-034**: The verbs of §R.7 MUST take the arguments and give the results of §R.7. `--launcher` and `--run-dir` MUST be mutually exclusive and one MUST be required; `gate`, `launch` and `auto` MUST accept only `--launcher`. `observe --json` MUST also print the raw observation as sorted JSON. `--no-relaunch` MUST report a classified transient instead of relaunching it. `stop` MUST record the stop request in the supervision record before it signals, MUST send the termination signal to the process group of the run and no kill signal, MUST print the stop line, and MUST then supervise without relaunch. `auto` MUST equal `launch` then `watch`. `supervise stop` is the compatibility spelling of the `stop` command of the CLI protocol (feature 100, annex G §G.1) and MUST leave the inbox request that command leaves (annex B §B.11). It MUST NOT print the line `[SPECSTRIDE-STOP]`, which belongs to that command.
  - origin: C-246; C-247; B-2672; B-2673; B-2674; B-2675; B-2676; B-2677; B-2679; B-2680; B-2684; B-2768
  - disposition: translated; ported
  - test: PT-123-C-246-*; PT-123-C-247-*; PT-123-C-255-*
  - divergence: DV-066
  - parity: every verb with its as-is arguments (row 18 of annex X §X.7)

- **F123-FR-035**: Supervision MUST poll no more often than every 60 seconds by default, MUST multiply the interval by 1.5 after each reading that shows no change, MUST cap it at 600 seconds, and MUST return to the base interval on a change or when the detail starts with `RECOVER`. The flags `--poll-seconds`, `--max-poll-seconds` and `--max-wait-seconds` MUST have the defaults 60, 600 and the supervision ceiling of the launch contract measured from the first launch. The state of the cadence MUST be persisted after every non-terminal reading and cleared at a terminal one, so that separate `observe` wake-ups agree with a continuous `watch`. When the next interval would pass the deadline, supervision MUST print the refusal `supervision-expired` and a digest, leave the run running, and exit 5.
  - origin: 011 SC-005; C-247; C-255; B-2681; B-2682; B-2683; B-2778; B-2779; B-2780
  - disposition: ported; translated
  - test: PT-123-011SC005-*; PT-123-C-247-*; PT-123-C-255-*
  - divergence: DV-066

- **F123-FR-036**: An observation MUST take its facts in this order of authority: the state of the pipeline; the liveness of the process; the labelled lines of the pipeline log from the offset recorded at launch; the newest stop reason of the engine; the last 2,000 bytes of the launch log. The status MUST be derived thus: alive is `running` when the state is `ready` or `running`, else `starting`; not alive and launcher exit 24 is `lock-conflict`; a state of `completed`, `failed` or `stopped` is that status; otherwise from the launcher exit (0 completed, 128 or more stopped, other failed); otherwise `unknown-terminal`. The change signature MUST be status, run state, stage id, stage index, stage reason, detail and launcher exit, and no clock. Stage elapsed time MUST be clamped to the interval from 0 to the total elapsed time, which counts from the first launch. The detail MUST be the newest `RECOVER`, `BLOCKED`, `RESUME`, `ERROR` or `FAIL` line as `<LABEL>: <message>`. The newest stop reason MUST be read for the whole pipeline of the stage, not from the offset before an attempt. A line MUST be recognised as labelled by the grammar of annex G §G.3, and the digest line MUST be parsed as `state`, `exit`, `last-stage`, an optional `child-exit` where `None` reads as absent, and `evidence`, the newest digest of the pipeline log winning over the launch log.
  - origin: C-255; B-2749; B-2750; B-2770; B-2771; B-2772; B-2773; B-2774; B-2775
  - disposition: ported
  - test: PT-123-C-255-*
  - divergence: DV-028; DV-070

- **F123-FR-037**: Supervision MUST end with one of the outcomes of the exit map of §R.7 and MUST map each to its code, keeping the double uses: 2 also for a usage error, 4 also for the launch decision `attach`, 130 for an interrupt of supervision, which leaves the run alone. An error of supervision that carries a reason MUST print `[MOL-REFUSE] action=<command> reason=<reason>` and exit 4; an invalid launch contract outside the launch checks MUST use the reason `invalid-contract`; an interrupt MUST use the reason `interrupted` with the detail "supervision was interrupted; the run was left alone".
  - origin: C-248; C-251; B-2685; B-2686; B-2687; B-2688; B-2695
  - disposition: ported
  - test: PT-123-C-248-*; PT-123-C-251-*
  - divergence: DV-066

- **F123-FR-038**: In compatibility output the supervisor MUST print the lines of §R.8 byte for byte, with the digest fields, the next-action texts, the printing of `[MOL-STATE]` on a changed signature and of `[MOL-HOLD]` on every unchanged reading, `child-exit=None` and the repr of `stop-reason`. Every line MUST also be appended once to the report log as soon as the pipeline run is known, and a write failure MUST be ignored. `[MOL-NEXT] poll-in=<g>s` MUST follow a non-terminal `observe` and an `observe` that relaunched; `[MOL-STOP]` MUST print `sent` and the detail, and when nothing could be signalled the command MUST exit 0 without supervising. The lines MUST carry no absolute path of state except where the baseline does, compared through the layout table.
  - origin: 011 FR-023; C-254; C-249; C-255; C-253; B-2689; B-2690; B-2734; B-2736; B-2738; B-2740; B-2741; B-2742; B-2743; B-2744; B-2745; B-2746; B-2747; B-2748; B-2777
  - disposition: translated; ported
  - test: PT-123-011FR023-*; PT-123-C-254-*; PT-123-C-249-*
  - divergence: DV-007; DV-033; DV-070

- **F123-FR-039**: In default output the supervisor MUST print the lines of the table "Default output" of §R.8: one line per change, nothing for an unchanged state, paths relative and only once, and no text that came from a run. Under the `parity` profile no line without an as-is equivalent MUST be printed on any stream. No verb of `supervise` MUST print a line with the label `[SPECSTRIDE-LAUNCH]`, `[SPECSTRIDE-STOP]` or `[SPECSTRIDE-STATE]`; the lines of `supervise` for a launch, a changed observation, a stop and the terminal reading MUST carry the labels `[SPECSTRIDE-SUPERVISE-LAUNCH]`, `[SPECSTRIDE-SUPERVISE-STATE]`, `[SPECSTRIDE-SUPERVISE-STOP]` and `[SPECSTRIDE-SUPERVISE-DIGEST]`. A refusal MUST be printed as `[SPECSTRIDE-REFUSE]` with the keys of annex G §G.3.
  - divergence: DV-033; DV-034
  - parity: compatibility output (rows 18 and 19 of annex X §X.7)
  - test: CT-123-139
  - assumption: CQ-050 (the labels and keys of the terse lines are proposed here; annex G §G.3 fixes the prefix `[SPECSTRIDE-` and the five product lines that two or more features read)

- **F123-FR-040**: The supervision record MUST be written by the CLI only, as one state file per writer, and MUST hold the fields of §R.9. With `relaunch.owner: root` the record MUST hold the cadence state and the stop request only, and the relaunch budget and the relaunch list MUST be read from the events `supervisor.relaunch` of the root, which carry the attempt, the maximum and the remaining count. With `relaunch.owner: root` the verbs `watch`, `observe` and `auto` MUST read and print and MUST NOT relaunch; the relaunch line MUST be projected from the root's events.
  - divergence: DV-074
  - test: CT-123-140
  - assumption: CQ-051 (the behaviour of `observe` with `relaunch.owner: root`; the sources say the root relaunches and say nothing of what the verb does then)

- **F123-FR-041**: In default output one supervision cycle MUST print at most 420 bytes (150 tokens at 2.8 bytes per token), an unchanged cycle 0 bytes, the terminal digest, which is the line `[SPECSTRIDE-SUPERVISE-DIGEST]`, at most 700 bytes (250 tokens), and all supervision output of a run, whatever its duration, at most 8,400 bytes (3,000 tokens). The build MUST measure bytes and fail on a breach. The budget of a whole run holds with `relaunch.owner: root`; with `supervise` the host watches for the whole run and the budget is not promised.
  - test: CT-123-141
  - status: unverified (check: the ratio of 2.8 bytes per token is the build's measure; the tokenizer of a host is not measured; verified-on: —; pin: —)

#### Added after the cross-feature review (2026-09-30)

- **F123-FR-042**: Table 1 of §R.6 MUST read the signals `blocked` and `retryable` from the terminal record of the engine start that ended the failed stage, and the signal `parityProfile` from the profile in force, with the values of the table of signals in §R.6. Under every profile, the `parity` profile included, it MUST refuse by the row O-33 with `blocked-on-human` when `blocked` is true. Outside the `parity` profile it MUST refuse by the row O-34 with `stop-not-retryable` when `retryable` is false. Both rows MUST stand after O-24 and before O-25, so that a stage that lists the child exit and allows the stop reason cannot carry a blocked run to O-32. Under the `parity` profile the row O-34 MUST be inactive, and the table MUST then decide a run that is not blocked as the baseline does. `supervise observe` MUST read the terminal record through its logical name and MUST NOT match a stop reason by string. A terminal record of a stage of kind `specstride` that is absent or cannot be read MUST give `blocked` false and `retryable` false. A terminal record that the pipeline stage executor synthesizes (F123-FR-015) MUST carry `retryable: false` and no blocked reason; table 2 relaunches a crashed engine by its cause (R-23), and table 1 has no row for a crash. Both refusals MUST print their literal, the detail and the next step as every refusal of table 1 does; the detail of `blocked-on-human` MUST name the blocked reason and the command `resume`. Each of the two rows MUST have a golden decision, the property that exactly one row fires for every vector of signals MUST hold for table 1 with the three new signals, and a test MUST prove for each of the six blocked reasons and for each value of `relaunch.owner` that the run is relaunched 0 times.
  - divergence: DV-114; DV-074
  - parity: row O-33 active, row O-34 inactive (row 132 of annex X §X.7, which has no key: it follows the profile; register row DV-114, for O-34 only; row 14 of §X.7 sets `relaunch.owner: supervise`). No scenario of FX-35 or FX-36 ends blocked, so O-33 changes no compared output
  - test: CT-123-142
  - assumption: CQ-192 (a tripped wall-clock budget is `retryable: true` and carries no blocked reason); CQ-053 (the literals `blocked-on-human` and `stop-not-retryable`); CQ-238 (row O-33 is active under every profile, the `parity` profile included; row O-34 stays inactive under `parity`; closed by the owner on 2026-09-30)

- **F123-FR-043**: In default output the runtime MUST print the line `[SPECSTRIDE-DIGEST]` with the keys that feature 100, annex G §G.3 fixes, in this order: `run`, `comment`, `changed`, `delegated`, `critic`, `fallback`, `alerts`. It MUST print the line once per run, on the line before the digest line, from the events of the run and never from text that a host composed. The keys `comment`, `changed` and `delegated` MUST be read from the fields `commentHash`, `changed` and `delegated` of the newest `pipeline.started` of the run; `comment` shows the hash and never the text. The value of each key MUST be that of the field of the same name of the digest record of `status --json` (annex G §G.3); a key whose fact the run does not hold MUST be left out, and when only `run` would remain the line MUST NOT be printed. No value MUST hold text from a run: a value is an identifier, a hash, a count or a member of a closed set, and it passes the redactor. The line MUST NOT be printed in compatibility output, in a dry run, or under the `parity` profile, and the digest line MUST stay the final line of the run (F123-FR-016).
  - divergence: DV-033; DV-034
  - parity: not printed (rows 18 and 19 of annex X §X.7)
  - test: CT-123-143
  - assumption: CQ-050; CQ-223 (the line is left out when the run holds none of the six facts; reported on 2026-09-30)

- **F123-FR-044**: The tool of the platform that gives a stage child a terminal MUST be probed by a check of the doctor registry (feature 100, annex G §G.7) that this feature registers. The check MUST NOT be launch-blocking. It MUST report a warning when the tool is absent or does not answer its probe, with a message that says that the output of a stage of kind `specstride` is then shown through a pipe and without colour, and a fix hint that names the tool. It MUST read and never write, start no stage and call no model. The product MUST name the tool among its system requirements as optional.
  - test: CT-123-145
  - ep: EP-14 `specstride.doctor/1` (implements (an entry))
  - status: unverified (check: the probe of the tool on a macOS runner, where its flags differ; verified-on: —; pin: macOS version of the runner)

### Key Entities *(include if feature involves data)*

| Entity | What it is |
|---|---|
| Pipeline | The ordered stages of one launch contract, run by the pipeline stage executor |
| Stage, stage attempt | One step of the pipeline, and one try of its action; never a phase and never a phase attempt |
| Stage kind, precondition check | Entries of the two open registries of EP-19 |
| Pipeline state record | The current state of the pipeline and of each stage; one writer, the runtime root |
| Launch check, launch decision | One of the six ordered checks; the result `launch`, `refuse` or `attach` |
| Relaunch, relaunch decision, relaunch budget | The start of the runtime again after a classified transient stop; the literal the classifier gives; the count and the wall clock that bound it |
| Relaunch classifier table | Table 1 (`relaunch-observe`) or table 2 (`relaunch-root`) |
| Supervision record | The cadence state, the stop request and, under `relaunch.owner: supervise`, the budget and the relaunch list; one writer, the CLI |
| Digest | The one final line of a run |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F123-SC-001**: Runs look after themselves. On the fixtures of FX-35 and FX-36 run with `relaunch.owner: root` and no host process, 100 per cent of the runs whose engine ends on a stop reason with `retryable: true`, or crashes, are relaunched by the runtime root within their budget, and 0 runs are relaunched more often than the budget allows.
- **F123-SC-002**: Supervision is cheap. All supervision output of a run in default output, whatever its duration, is at most 8,400 bytes (3,000 tokens at 2.8 bytes per token), on a simulated run of 24 hours with `relaunch.owner: root` (F123-FR-041 does not promise the limit of a whole run with `supervise`); one cycle is at most 420 bytes, an unchanged cycle 0 bytes, and the terminal digest at most 700 bytes.
- **F123-SC-003**: Every refusal is named. For 100 per cent of the 11 launch-check refusals and of the members of the relaunch refusals in §R.6 a fixture prints the literal of the closed family, in both output modes, with the exit code of its row.
- **F123-SC-004**: Parity. The oracle reports 0 results `different` for FX-35 and FX-36 under the `parity` profile, in both variants (`@engine-stub`, `@full-stack`); the only waivers are those of DV-075 and DV-009.
- **F123-SC-005**: The dry run takes no action. In 100 per cent of the dry-run fixtures, with and without `--implement` and `--smoke`, the pipeline entry exits 0, creates 0 files, and prints exactly one `[DIGEST] state=dry-run` line.
- **F123-SC-006**: Supervision polls no more often than every 60 seconds by default, backs off by a factor of 1.5, and caps the interval at 600 seconds, in 100 per cent of the intervals of a fake-clock run.
- **F123-SC-007**: A supervised run is relaunched at most 5 times under any launch contract, and at most 2 times when the launch contract declares no budget.
- **F123-SC-008**: Exactly one row of each classifier table fires for every vector of signals of the property test, and every row has a golden decision (100 per cent of the rows of §R.6).
- **F123-SC-009**: Evolvability. A sample stage kind and a sample check registered from the test tree run as a stage with 0 core files changed.
- **F123-SC-010**: A run that rests in `blocked-on-human`, that was stopped on request, or that is held (a hold exists with `relaunch.owner: root` only, F123-FR-032) is relaunched 0 times in 100 per cent of the fixtures, with `relaunch.owner: root` and with `relaunch.owner: supervise`, for each of the six blocked reasons.

## Constraints

Set by the owner. They are not implementation detail to be removed.

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |
| The host observes and asks; it never edits run state | Decision 5; Principle XVI |

## Extension points

| EP | Id and version | Relation | What for |
|---|---|---|---|
| EP-19 | `specstride.stage-kind/1` | implements | The two registries of stage kinds and precondition checks, their built-in entries, the operations `validate`, `run` and `evaluate`, the conformance suite and the sample (F123-FR-010, F123-FR-015). This feature is the content owner |
| EP-14 | `specstride.doctor/1` | implements (an entry) | This feature registers its checks in the registry that feature 112 owns: the six launch checks, with the launch-blocking flag and a fixed order (F123-FR-021, F123-FR-022), and the check of the terminal tool, which is not launch-blocking (F123-FR-044) |
| EP-13 | `specstride.lock/1` | consumes | The pipeline entry takes the workspace lock; the launch check reads it (F123-FR-007, F123-FR-022) |
| EP-17 | `specstride.detach/1` | consumes | `launch` starts the runtime root through the detach strategy (F123-FR-023, F123-FR-024) |

## Contracts of feature 100 used

| Interface contract | Version | Where |
|---|---|---|
| Process model; run requests; handshake outcomes; `relaunch.owner` | — | Annex F §F.1 to §F.4; F100-FR-155 to F100-FR-163 |
| Stage kind and precondition check (EP-19) | `specstride.stage-kind/1` | Annex F §F.7; F100-FR-166, F100-FR-167 |
| Exit codes of the runtime root and the pipeline entry | — | Annex F §F.8; F100-FR-168, F100-FR-169 |
| Lock and liveness provider (EP-13); detach strategy (EP-17) | `specstride.lock/1`; `specstride.detach/1` | Annex F §F.5, §F.6 |
| Run-state machine, blocked reasons | `specstride.run-state/1` | Annex E §E.2; F100-FR-141 to F100-FR-147 |
| Stop reasons with `retryable`; closed families of stage reasons | `specstride.stop-reason/1` | Annex E §E.3; F100-FR-148 to F100-FR-150 |
| Exit codes of the engine and of the result records | — | Annex E §E.4 |
| Terminal record | `specstride.terminal/1` | Annex B §B.15; F100-FR-071 |
| Launch record, lease, inbox request types, supervision record | `specstride.launch/1`, `specstride.lease/1`, `specstride.inbox/1`, `specstride.supervision/1` | Annex B §B.7, §B.8, §B.11, §B.16; F100-FR-060, F100-FR-061, F100-FR-065, F100-FR-072 |
| Logical names of the pipeline state, the compared logs and the records | `specstride.layout/1` | Annex B §B.5; F100-FR-054 |
| Process registry, classes `owned` and `adoptable` | `specstride.procs/1` | Annex B §B.10; F100-FR-063, F100-FR-064 |
| Table evaluator | `specstride.table/1` | Annex X §X.3; F100-FR-204 |
| Event envelope | `specstride.event/1` | Annex X §X.1 |
| Canonical hasher | — | Annex X §X.5 |
| Doctor check registry (launch-blocking subset) | `specstride.doctor/1` | Annex G §G.7; F100-FR-189 |
| Launch-contract schema | `specstride.launch-contract/1` | Annex G §G.8; F100-FR-190, F100-FR-191 |
| CLI protocol, output modes, line grammar, the product line `[SPECSTRIDE-DIGEST]` with its keys, exit codes per command, token budgets | protocol 1 | Annex G §G.1 to §G.5; F100-FR-175 to F100-FR-187 |
| Parallel plan (read by the dry run) | `specstride.parallel-plan/1` | Annex D §D.3; F100-FR-126 |
| List of closed sets; the `parity` profile; normalization contract | `specstride.profile/1`, `specstride.oracle-normalization/1` | Annex X §X.6 to §X.8; F100-FR-208, F100-FR-210 to F100-FR-215 |

Fixture families of feature 141 that this feature cites: FX-35 and FX-36, each in both variants, `@engine-stub` and `@full-stack` (feature 141, §O.2 and F141-FR-016). The oracle drives the engine stub through row 41 of the profile.

## Threats

Threats of feature 100, annex X §X.9, that name this feature as an owner, each with the requirement that is its control (F100-FR-216).

| Threat | What it is | Control |
|---|---|---|
| T-11 | The host model reports a run wrongly | F123-FR-016: the digest is produced by the runtime from events and printed verbatim. F123-FR-043 for the line `[SPECSTRIDE-DIGEST]` |
| T-47 | The launch bundle is edited between rendering and launch | F123-FR-021: the launch check `launcher-intact` compares the recorded hash at launch. F123-FR-028 (row O-29) and F123-FR-029 (row R-19): an edited launcher refuses every relaunch. Feature 107 shares the threat for the hash of the launch bundle |

## Rows of the `parity` profile

This feature introduces no new key. It owns three rows of annex X §X.7 and shares two; row 132 has no key and follows the profile (F123-FR-042).

| Row | Switch | Key | Default | Under `parity` | Register row |
|---|---|---|---|---|---|
| 14 | Owner of relaunch | `relaunch.owner` | `root` | `supervise` | DV-074 |
| 38 | Pins of the launch contract | — | The pinnable keys | The two as-is keys only | DV-026 |
| 132 | The reading of `retryable` by table 1 (row O-34) | — (follows the tables) | on: O-34 refuses with `stop-not-retryable` | off: O-34 is inactive | DV-114 |
| 18 (shared with 119) | Output mode | `output.compat` | default output | compatibility output | DV-033 |
| 41 (shared with 122) | Executable of the engine | `engine.executable` | The product's own entry | Set by the oracle to its engine stub | — |

Rows 19, 20, 37 and 43 are read: the pipeline entry prints no new line (19), prints nothing about the parallel plan (20), takes the mode through the mode map (37) and takes the learning mode from the fixture (43). No key is proposed here beyond those of annex X §X.7.

## Closed sets

Stated as F100-FR-208 asks. Owner of each: 123. "Unknown value" is what a reader does with a value outside the set.

| Closed set | Members | Closed by | Unknown value |
|---|---|---|---|
| Stage reasons, transient (row 11) | `exit`, `timeout`, `recovery-deadline`, `recovery-exhausted` | Design | Not transient |
| Stage reasons, deliberate (row 11) | `postcondition`, `stage-precondition`, `setup-required`, `interrupted`, `existing-prerequisite`, `completed`, `exec-error:` with a detail | Design | Not transient |
| Pipeline exit reasons (row 12) | `preflight`, `all-stages-complete`, or a stage reason | Design | Not transient |
| Launch-check refusals (row 13) | `launcher-not-found`, `launcher-edited`, `learning-decisions-changed`, `stale-sources`, `open-blocker`, `draft-contract`, `invalid-contract`, `unauthorized-root`, `launcher-syntax-error`, `dry-run-failed`, `already-running` (11) | Design | Refusal |
| Relaunch refusals and approvals (row 14) | Of table 1: `relaunch-disabled`, `still-running`, `operator-stop`, `completed`, `deliberate-stop`, `unknown-terminal`, `lock-conflict`, `unknown-launcher-exit`, `signal-stop`, `invalid-contract`, `preflight-blocked`, `stale-sources`, `launcher-exit-<n>`, `state-not-failed`, `unknown-stage`, `postcondition-failure`, `stage-precondition`, `setup-required`, `interrupted`, `stage-did-not-run`, `stage-did-not-fail`, `exec-error`, `stage-reason-not-transient`, `child-exit-not-retryable`, `stop-reason-not-allowed`, `contract-digest-changed`, `learning-decisions-changed`, `launcher-edited`, `budget-exhausted`, `budget-deadline-exceeded`; the approval `classified-transient`. Beyond the baseline: `blocked-on-human` and `stop-not-retryable` (both tables; in table 1 since 2026-09-30, rows O-33 and O-34), `lease-lost` and `relaunch-held` (table 2); the approval `classified-crash` (table 2) | Design | Refusal |
| Resolve refusals (row 101) | `launcher-not-found`, `launcher-missing`, `launcher-ambiguous`, `launcher-unreadable`, `launcher-not-generated` | Design | Refusal |
| Hold refusals (proposed row 279 of annex X §X.6; `analyze-report.md`, "Proposed upstream fixes") | `no-live-run` | Design | Refusal |
| Digest states (row 15) | `completed`, `failed`, `stopped`, `dry-run` | Design | Supervisor outcome `unknown-terminal` |
| Supervision outcomes (row 16) | `completed`, `stopped`, `unknown-terminal`, `refused`, `supervision-expired`, `failed`, `lock-conflict` | Design | Exit 1 |
| Kinds of run request (row 18) | `pipeline`, `engine` | Design | The launch is refused |
| `relaunch.owner` (row 20) | `root`, `supervise` | Owner decision | Configuration error |
| Stage kinds; precondition checks (row 25) | Open registries. Wave 1: `setup`, `decision`, `command`, `specstride`, `smoke`; `file_exists`, `dir_exists`, `env_set`, `command_available`, `command_success`, `json_field_equals` | Open | The launch contract is invalid |
| Pipeline states; states of one stage | `preflight`, `ready`, `running`, `failed`, `stopped`, `completed`; `running`, `completed`, `failed`, `stopped` | Design | The record is read as empty |
| Launch decisions; launch checks and their statuses | `launch`, `refuse`, `attach`; the six names of §R.5 with the statuses `pass`, `fail`, `not-evaluated` | Design | `refuse` |
| Relaunch decisions | `relaunch`, `refuse`, `hold` | Design | `refuse` |
| Classes of a stage reason | `transient`, `postcondition`, `stage-precondition`, `setup-required`, `interrupted`, `existing-prerequisite`, `completed`, `exec-error`, `other` | Design | `other` |
| Observation statuses | `running`, `starting`, `lock-conflict`, `completed`, `failed`, `stopped`, `unknown-terminal` | Design | `unknown-terminal` |
| Modes of a launch by `supervise`; sources of a mode; sources of a launcher | `generate`, `run`, `auto`; `token`, `refusal`, `prose`, `default`; `request`, `feature-default`, `generated-marker` | Owner decision (decision 18, mapped) | The launch is withheld |
| Timings and results of a precondition check | `preflight`, `stage`; `pass`, `fail`, `deferred` | Design | The check is `fail` |
| Colour modes | `auto`, `always`, `never` | Design | Usage error, exit 2 |
| Relaunch classifier tables | `relaunch-observe`, `relaunch-root` | Design | The table is invalid |
| Verbs of `supervise` | `mode`, `resolve`, `gate`, `launch`, `watch`, `observe`, `auto`, `stop`, `hold`, `release` (and `learning` and `retro`, owned by 106) | Design | Usage error, exit 2 |

Open sets: stage kinds and precondition checks, by registry.

## As-is behaviour not carried

Rows of the traceability files assigned to this feature with the disposition `superseded-by` or `dropped`. The owner approved each (ruling K8).

| As-is id | Behaviour (short) | Register row |
|---|---|---|
| B-2757 (C-255) | The default mode of the supervisor is `generate`, with the source `default` and empty evidence | DV-009 |

Two behaviours of the baseline are named here because they are not carried although their rows are kept: the rewrite of a condition path to the state directory of a legacy product (DV-036), and the as-is spelling of the stage kind `specstride` of the legacy product (DV-038). Both are stated in F123-FR-010.

As-is ids carried, and where:

| As-is id | Disposition | Requirement | Test |
|---|---|---|---|
| 011 FR-011 | ported | F123-FR-004, F123-FR-005 | PT-123-011FR011-* |
| 011 FR-012 | translated | F123-FR-007 | PT-123-011FR012-* |
| 011 FR-013 | ported | F123-FR-008 | PT-123-011FR013-* |
| 011 FR-014 | ported | F123-FR-009 | PT-123-011FR014-* |
| 011 FR-015 | ported | F123-FR-012, F123-FR-013 | PT-123-011FR015-* |
| 011 FR-019 | translated | F123-FR-021 | PT-123-011FR019-* |
| 011 FR-020 | translated | F123-FR-023 | PT-123-011FR020-* |
| 011 FR-021 | ported | F123-FR-028 | PT-123-011FR021-* |
| 011 FR-022 | translated | F123-FR-031 | PT-123-011FR022-* |
| 011 FR-023 | translated | F123-FR-016, F123-FR-038 | PT-123-011FR023-* |
| 011 SC-003 | ported | F123-FR-005 | PT-123-011SC003-* |
| 011 SC-005 | ported | F123-FR-035 | PT-123-011SC005-* |
| 011 SC-006 | ported | F123-FR-031 | PT-123-011SC006-* |
| Clusters C-215, C-218, C-225 to C-231, C-246 to C-255 (178 items, 177 kept) | ported, translated | F123-FR-001 to F123-FR-038 | PT-123-C-nnn-* |

## Repairs after the cross-feature review

Dated 2026-09-30. Items of `docs/ecosystem/reviews/REPAIR-WORKLIST.md`. No requirement id, task id, rule id or test name was renumbered or reused.

| Requirement or place | Item | What changed |
|---|---|---|
| §R.6, table 1 | W-123-01 | Signals `blocked`, `retryable` and `parityProfile`; rows O-33 (`blocked-on-human`) and O-34 (`stop-not-retryable`) between O-24 and O-25; register row DV-114 |
| F123-FR-030 | W-123-01; W-127-01 | Names the refusing rows of both tables; a blocked run is relaunched 0 times under either owner; a tripped wall-clock budget stays relaunchable (CQ-192); cites DV-114; test CT-123-142 added |
| F123-FR-042 (new) | W-123-01 | The two rows and the three signals of table 1. Test CT-123-142 |
| F123-SC-010; User Story 1, scenario 3; Edge Cases | W-123-01 | Both owners and the six blocked reasons are named |
| Clarifications, answer on CQ-020 | W-123-01 | The sentence "table 1, which cannot see the field" is corrected |
| §R.8, table "Default output" | W-123-02 | Four lines of `supervise` renamed to `[SPECSTRIDE-SUPERVISE-LAUNCH]`, `[SPECSTRIDE-SUPERVISE-STATE]`, `[SPECSTRIDE-SUPERVISE-STOP]`, `[SPECSTRIDE-SUPERVISE-DIGEST]`; `[SPECSTRIDE-DIGEST]` takes the keys of annex G §G.3 |
| F123-FR-039, F123-FR-034, F123-FR-041 | W-123-02 | The labels of other owners are never printed by `supervise`; the byte limit of the terminal digest names its line |
| F123-FR-043 (new) | W-123-02 | The runtime prints `[SPECSTRIDE-DIGEST]`. Test CT-123-143 |
| F123-FR-011 | W-123-03 | Where no terminal can be given the child runs through the pipe and the run goes on. Test CT-123-144 added |
| F123-FR-044 (new) | W-123-03 | A doctor check, not launch-blocking, probes the tool. Test CT-123-145 |
| F123-FR-002 | W-123-04 | The two readings of `NO_COLOR` are those of the two baselines (B-2563, B-1411) |
| Assumptions | W-X-05 | The register is named without a count |
| F123-FR-020 | W-X-06 | "engine invocation" became "engine start" |
| F123-FR-021, F123-FR-022; table "Extension points" | W-X-19 | EP-14: `consumes` became `implements (an entry)` |
| Section "Threats" (new) | W-X-22 | T-11 and T-47 with their controls |
| F123-FR-018 | W-X-24 | Names `pipeline.started`, `pipeline.ended`, `launch.checked`, `digest.written` and who emits them |
| F123-FR-031, F123-FR-034 | W-X-33 | The contract of feature 100 is named in place of features 107 and 102 |
| Table "Closed sets" | Found while repairing | The resolve refusals are row 101 of annex X §X.6; the literals beyond the baseline are listed per table |
| F123-FR-042 | Re-check B-8.7, pass-on (2026-09-30) | `parity:` cites row 132 of annex X §X.7 (both rows inactive under the profile) and names the deviation from Principle VIII; `assumption: CQ-238` added. The requirement text is unchanged. `plan.md` rows VIII and XVI and Complexity Tracking record the deviation |
| F123-FR-030 | CQ-238, answer of the owner (2026-09-30) | A blocked run is relaunched 0 times under every profile, the `parity` profile included; `assumption: CQ-238` added |
| F123-FR-042; §R.6, table 1 (row O-33, signal `parityProfile`); User Story 1, scenario 3; Clarifications | CQ-238, answer of the owner (2026-09-30) | The predicate of O-33 loses `parityProfile`: O-33 is active under every profile; O-34 stays inactive under `parity`; `parity:` and `assumption: CQ-238` rewritten; DV-114 is cited for O-34 only. `plan.md` no longer records a deviation from Principle VIII |

## Clarifications

### Session 2026-09-29

Questions of `speckit-specify` and `speckit-clarify`, answered from the sources. No question was put to a person.

- Q: With which stop reason and exit code does a run end that rests blocked on a human, given that the closed enumeration has no reason for it? (CQ-020) → A: With an existing reason, all `retryable: false`: a changed source gives `critic_config` and engine exit 3; credit or authorization gives `proposer_consecutive_errors`; a hard cap gives `wall_budget`; a declared block gives `proposer_no_progress`; the quota wait ceiling gives `paused_quota_ceiling`. The blocked reason is a field of the terminal record. For this feature: a stage of kind `specstride` whose terminal record carries a blocked reason ends the pipeline with 22 and the state `failed`, the digest carries the child exit of the engine, and both tables refuse with `blocked-on-human`: table 2 by row R-03, and table 1 by row O-33 under every profile (CQ-238). Until 2026-09-30 this answer said that table 1 could not see the field and refused with the ordinary literal of the stop; that did not hold where the stage lists the exit code and allows the stop reason, and table 1 now reads the field (item W-123-01, register row DV-114). Integrated in F123-FR-030, F123-FR-042, table 1, row O-33, and table 2, row R-03. (Source: `CLARIFY-QUEUE.md` CQ-020; F100-FR-144)
- Q: Which operations does EP-19 have, given that the sources name only the two registries? (CQ-022) → A: `validate`, `run` and `evaluate`, as feature 100 annex F §F.7 states. The conformance suite of this feature registers a sample kind and a sample check from the test tree. Integrated in F123-FR-010. (Source: `CLARIFY-QUEUE.md` CQ-022; F100-FR-166)
- Q: Does the second table replace the first, given that the parity profile sets `relaunch.owner: supervise`? → A: No. Table 1 reproduces the baseline and serves `supervise observe`; table 2 serves the runtime root. They share the closed family of literals; table 2 adds five. Integrated in F123-FR-027 to F123-FR-029. (Source: `architecture.md` section 4; R15v B-1, P-1; DV-074)
- Q: Does a crashed engine need the stage to list its exit code for retry? → A: No. A crash has no stop reason and no listed exit code to compare; it is relaunched within the budget, and every counter comes from the ledger. The as-is rule would have refused it with `child-exit-not-retryable`; this is new behaviour with the register row DV-074. Integrated in F123-FR-029. (Source: R15v B-1 (2); DV-074)
- Q: Who reads the outcome of the engine: the exit code and the newest reason line, or the terminal record? → A: The terminal record, with the same values, compared on the fixtures. The reader that takes the newest line with any `reason` field is kept only in the compatibility projection, for the printed `stop-reason=`. Integrated in F123-FR-015. (Source: DV-028; brief 123 heading 3, D-10, D-11)
- Q: How many literals does the closed set of relaunch refusals hold, given that annex X §X.6 says 21 and the approval `classified-transient`? → A: The baseline holds 30 spellings of refusals reachable in the classifier and in the supervise verbs (29 fixed literals and the pattern `launcher-exit-<n>`), and the approval; the figure 21 counts only part of them. The list under "Closed sets" is from the code at `9c88f86` and the items B-2696 to B-2731. Reported to the orchestrator. (Source: `supervisor_lib.py` at `9c88f86`, lines 54 to 90 and 962 to 1056; `consolidation.md` section 4.4)
- Q: Are the refusals of `resolve` (`launcher-missing`, `launcher-ambiguous`, `launcher-unreadable`, `launcher-not-generated`) launch-check refusals? → A: No. Row 13 holds the 11 of the checks; the five that `resolve` prints form a set of their own, proposed as a new row. Integrated in F123-FR-026. (Source: B-2699 to B-2703; `supervisor_lib.py`)
- Q: Where does the `retro` verb belong? → A: To feature 106, which holds its behaviour items (B-2678, B-2691 to B-2693, B-2735, B-2781 to B-2783). The label `[MOL-RETRO]` stays in the line grammar of feature 100. This feature carries the verbs that its own items name. (Source: `traceability-items.tsv`; brief 123 heading 2)
- Q: How does the host write `hold-relaunch`, given that annex G §G.1 lists no verb for it? → A: By two verbs of `supervise`, `hold` and `release`, which write the inbox request and touch nothing else. Reported as a need of feature 100. Integrated in F123-FR-032. (Source: F100-FR-065; brief 123 heading 4)
- Q: What is the "relaunch window" of annex E §E.2 T12, at whose end a hold ends the run? → A: The wall-clock deadline of the relaunch budget, which is fixed at the first launch. Integrated in F123-FR-032. (Source: F100 annex E §E.2 T12; B-2766)
- Q: What does `observe` do when `relaunch.owner` is `root`? → A: It reads and prints and never relaunches; the relaunch line is projected from the root's event. Integrated in F123-FR-040. (Source: F100 annex F §F.4; `architecture.md` section 4)
- Q: What backoff does the root wait before a relaunch? → A: The declared backoff of the failed stage, at the index of the relaunch, or 0. The baseline waits nothing before a relaunch, so with no backoff declared the port is as the baseline. Integrated in F123-FR-033. (Source: B-2622, B-2767; annex E §E.2 T11)
- Q: What does the check `run-directory-free` read now that one lock covers the workspace? → A: The workspace lock, through the lock provider. A lock held by any live run gives the decision `attach` with the reason `already-running`, as the baseline gives it for its pipeline run; the pipeline entry itself ends with 24 when it finds the lock held at start. Integrated in F123-FR-022. (Source: DV-075; DV-028; F100-FR-156)
- Q: How does `supervise launch` relate to the `launch` command of protocol 1, which feature 107 fronts and feature 122 completes? → A: Both run the same launch checks and call the same detach strategy, and both leave the launch record of feature 100 annex B §B.7; `supervise launch` is the compatibility spelling with the as-is arguments, the record of §R.9 and the lines of §R.8. Integrated in F123-FR-023 and F123-FR-024. (Source: F100 annex G §G.1; brief 123 heading 1)
- Q: What does a run request of kind `engine` do about the retry list of a stage, given that it has no launch contract and no stage? → A: It is one stage that declares no recovery; the terminal record's `retryable` alone decides, with 2 relaunches and no deadline of its own. Integrated in F123-FR-020. (Source: DP-077, ruling 25; F100 annex F §F.2)
- Q: Is the relaunch budget per stage, per launch or per run? → A: Per launch, shared by all stages, as the baseline's launch record is. A launch or a `resume` by the consumer starts a new budget; the counts of the engine (rejects, attempts, breakers) are a different thing and survive a resume through the ledger. Integrated in F123-FR-031. (Source: B-2766; F100-FR-069; ruling 8)
- Q: Where does `supervise observe` find the relaunch count when the root relaunches, given that the supervision record then holds only the cadence? → A: In the events `supervisor.relaunch`, which carry the attempt, the maximum and the remaining count. Integrated in F123-FR-040. (Source: F100 annex B §B.16; annex E §E.2 T10)
- Q: Does the dry-run plan of the pipeline entry belong to this feature or to feature 107, which owns the `dry-run` mode of the host skill? → A: The plan belongs here, because the pipeline entry prints it; feature 107 owns the mode that calls it. (Source: brief D.8 "Decided here" row 2)
- Q: What does the default output of the pipeline entry print? → A: The digest, the warnings, the failure lines and the dry-run plan; progress lines go to the pipeline log. Integrated in F123-FR-017. (Source: F100 annex G §G.2; DV-033)
- Q: Do the token budgets bind bytes? → A: Yes. At 2.8 bytes per token the limits are 420, 700 and 8,400 bytes. Integrated in F123-FR-041. (Source: F100 annex G §G.5; F100-FR-187; ruling 65)
- Q: Which questions could the sources not answer? → A: Eight, listed under "Assumptions" as CQ-046 to CQ-053, each with a reading that this specification proceeds on.

### Session 2026-09-30

After the cross-feature review. No question was put to a person.

- Q: Are the two rows that table 1 gains active under the `parity` profile? → A: Row O-33 is; row O-34 is not. Until 2026-09-30 register row DV-114 set both off under that profile. The owner answered CQ-238 on 2026-09-30: O-33 is active under every profile, since no scenario of FX-35 or FX-36 ends blocked and it changes no compared output; O-34 stays off under `parity`, since it would change the rule id of FX-36 scenarios that end not retryable, and DV-114 is narrowed to O-34. Outside the profile both are active, for both values of `relaunch.owner`. Integrated in F123-FR-030 and F123-FR-042. (Source: `CLARIFY-QUEUE.md` CQ-238; register row DV-114; F100-FR-163; item W-123-01)
- Q: Is a tripped wall-clock budget relaunched? → A: Yes. It ends with `wall_budget`, `retryable: true` and no blocked reason; `budget-cap` is for caps of spend. Integrated in F123-FR-030 and F123-FR-042. (Source: CQ-192; feature 100, annex E §E.3, row 2)
- Q: Which labels do the lines of `supervise` carry where annex G §G.3 or another command owns the label? → A: Labels of their own, `[SPECSTRIDE-SUPERVISE-LAUNCH]`, `[SPECSTRIDE-SUPERVISE-STATE]`, `[SPECSTRIDE-SUPERVISE-STOP]` and `[SPECSTRIDE-SUPERVISE-DIGEST]`. `[SPECSTRIDE-DIGEST]` is printed by the runtime with the keys of the annex. Integrated in §R.8, F123-FR-039 and F123-FR-043. (Source: feature 100, annex G §G.3, F100-FR-178; CQ-050; item W-123-02)
- Q: What happens where the platform gives no tool for a terminal? → A: The child runs through the pipe, the run goes on, one warning is printed, and a doctor check that is not launch-blocking reports the absence. Integrated in F123-FR-011 and F123-FR-044. (Source: constitution v3.0.0, Principle VI and Development Workflow; item W-123-03)
- Q: Which process emits `launch.checked`, given that the CLI evaluates the launch checks and does not write the event file? → A: The runtime root, for the checks it verifies itself at its start and before every relaunch. Reported as CQ-222. Integrated in F123-FR-018. (Source: feature 100, annex X §X.6 row 73; annex B §B.7; item W-X-24)

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary.
- The divergence register is section 6 of `consolidation.md`. The brief's figure of 85 rows is out of date.
- Where the architecture file, the brief and a ruling differ, the ruling stands.
- The launch contract, its validation and its promotion, the compatibility projection, the detach strategy, the lock, and the engine exist when the fixtures of FX-35 and FX-36 run; the engine stub stands in for the engine in the variant `@engine-stub`.
- The three baselines are read-only; the behaviour is that of `9c88f86` for mixture-of-loops.

Readings that the sources do not settle. Each is marked in its requirement and reported to the orchestrator with a recommended answer.

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-046 | Which hash decides that stage state is reset, given that feature 104 owns the hashing scheme? | The launch contract hash of the baseline (without inventory, generation data, revision and dirty flag, with the hash of a task list that ignores checkboxes), computed by the canonical hasher of feature 100 | F123-FR-009 |
| CQ-047 | How do launch-blocking checks that other packages register print in compatibility output? | They run after the six, and print a line only outside the `parity` profile | F123-FR-022 |
| CQ-048 | Annex E §E.2 T12 speaks of "the relaunch window"; annex G §G.1 has no verb for `hold-relaunch` | The window is the deadline of the budget; the verbs are `supervise hold` and `supervise release`; a request with `relaunch.owner: supervise` is refused with `no-live-run` | F123-FR-032 |
| CQ-049 | The backoff before a relaunch by the root | The declared backoff of the failed stage, or 0 | F123-FR-033 |
| CQ-050 | The labels and keys of the terse lines | The table "Default output" of §R.8 | F123-FR-039 |
| CQ-051 | What `observe` and `watch` do when `relaunch.owner` is `root` | They read and print only | F123-FR-040 |
| CQ-052 | The count of relaunch refusals (21 in annex X §X.6; 30 spellings in the code) and a set for the refusals of `resolve` | The list of the code; a new row for the resolve refusals | F123-FR-026, F123-FR-028 |
| CQ-053 | The literals that table 2 adds to the closed family | `blocked-on-human`, `lease-lost`, `stop-not-retryable`, `relaunch-held`, `classified-crash` | F123-FR-029, F123-FR-042 |
| CQ-192 | Is a tripped wall-clock budget relaunched, or does it rest blocked on a human? | It is relaunched: `retryable: true`, no blocked reason | F123-FR-030, F123-FR-042 |
| CQ-238 | May row O-33 of table 1 be active under the `parity` profile too, so that Principle VIII holds under every profile? Raised by the re-check B-8.7 | Closed by the owner on 2026-09-30: O-33 is active under every profile; O-34 stays inactive under `parity` (register row DV-114, narrowed to O-34). Principle VIII holds under every profile | F123-FR-030, F123-FR-042 |
| CQ-222 | Which process emits `launch.checked`? | The runtime root, for the checks it verifies itself | F123-FR-018 |
| CQ-223 | Is `[SPECSTRIDE-DIGEST]` printed when the run holds none of the six facts? | No: a key without a fact is left out, and a line that would hold `run` only is not printed | F123-FR-043 |
