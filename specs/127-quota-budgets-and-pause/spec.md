# Feature Specification: Quota, budgets and pause

**Feature Branch**: `127-quota-budgets-and-pause` (a label: Spec Kit creates no branch in this repository; the directory is `specs/127-quota-budgets-and-pause`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 127-quota-budgets-and-pause: the quota classifier and its classes, the confirming probe, the quota pause as a state of a live run with its record, its resume at the window reset and its ceiling, the opt-in fallback order per role and what a switch does, budgets per role and per run with the whole-run wall-clock budget of the baseline among them, how spend is counted the same way across providers, the spend ledger, hard caps with API keys and observation-based alerts with subscriptions, alerts with their levels and delivery, and notional cost."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority), `architecture.md` (sections 8 and 12, LR-7, LR-8), `consolidation.md` (glossary; conflicts C-23; register rows DV-005, DV-027, DV-049, DV-063), `feature-briefs.md` (brief 127-quota-budgets-and-pause), `STAGE-B-RULES.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182), the research reports R14, R8v, R1, R1v, R19, R25, R11 (T-18), R3 and R15 (A-6), the as-is specifications `old/002-as-is-lisa/` and `old/028-as-is-specstride/`, and the baselines: Specstride at `9cab15d` (`orchestrator.sh`, `proposer.sh`) and Lisa at `363e6a3` (`packages/scheduler/src/budgets.ts`).

## What this feature is

Today a quota failure is a provider error. The proposer counts it, the engine exits 4 with `proposer_consecutive_errors`, and a supervisor relaunches it at once. A window that lasts five hours or a week burns the relaunch budget in minutes (R14 A6). This feature replaces that path with a state of the run: the run waits, alive, and spends no budget of any kind. It also holds the money side of the product: budgets, the one ledger of spend, hard caps, alerts and notional cost.

| Part | What it holds |
|---|---|
| Classifier (group G1) | The classes, the confidence, the reset time, the confirming probe, the source `host`, the limit-window state |
| Pause (group G2) | The quota pause as a run state, its record, the resume at the window reset, the ceiling, the blocked cases |
| Fallback (group G3) | The opt-in order of entries per role, what a switch does, the loudest alert |
| Budgets and spend (group G4) | Budgets per role and per run, the whole-run wall-clock budget, counting of spend, the ledger, hard caps, alerts, notional cost |

**In scope**: as the four groups say. This feature owns the content of EP-12 (the class set, the default text classifier, the rules), the pause record and the spend ledger.

**Out of scope**:

| Out of scope | Owner |
|---|---|
| A harness's own classifier entries | Its harness adapter: 125, 130, 131, 134, 138. The `failures` map of a harness descriptor is 109 |
| The pause of a group of parallel units and the headroom check before a group | 142. It uses the pause record, the classes and the caps of this feature |
| The terms gate that gates a fallback again | 147 |
| Usage events as a schema | 111 |
| Display of budget levels | 129 |
| Host hooks that show an alert | 113 |
| Lisa's scheduler, in which its budgets sat | Roadmap |

How to cite: "feature 127, §Q.1" for the class table; "feature 127, §Q.4" for the alert rules.

## The reference sections

The reference sections are normative. Requirements cite them. Terms follow the glossary of `consolidation.md` section 1: the run is the logical run; a pause is a quota pause; a phase attempt is one proposer-then-critic cycle; "model tier" and "auth tier" are always qualified.

### §Q.1 Classes and the action on each

Classes are the nine of feature 100 annex C §C.13. The engine acts on the class only.

| Class | Meaning | Action of the engine | Counts as | Spends reject, pass, MALFORMED, error, wall-clock, relaunch | `retryable` |
|---|---|---|---|---|---|
| `quota_window` | A limit that a window reset ends (five hours, week, per model family) | Pause the role (state `paused-quota`); with a fallback opted in, see group G3 | Neither an error nor a rejection | No | true |
| `quota_credit` | Credit, plan or billing: no clock refills it | A fallback if opted in; else `blocked-on-human`, reason `quota-credit` | Neither | No | false |
| `rate_limit_transient` | A short limit, a delay of seconds | The harness adapter waits and retries inside the pass up to `quota.transientMaxWaitMs`; beyond it the failure is read as `quota_window` | Neither | No | true |
| `overload` | The provider is busy (529, 503); not the consumer's limit | Retry with backoff up to `quota.overloadRetries`; beyond it, an ordinary provider error | An error only after the cap | After the cap | true |
| `auth` | The credential is refused or missing | `blocked-on-human`, reason `auth`; no retry, no fallback | Neither | No | false |
| `context_window` | The prompt is too large for the model | The existing error path | An error | Yes | false |
| `agent_failure` | The harness process failed | The existing error path | An error | Yes | true |
| `provider_other` | Any other provider failure, and the class of an input that matches nothing | The existing error path | An error | Yes | true |
| `budget_cap` | A cap of this feature was reached, in the pass by the harness's own limit or at a boundary by the engine | The budget path of §Q.3; never a relaunch | A budget stop | Cap counter only | false |

`retryable` is the fourth output of `classify` (feature 100 annex C §C.13). It says whether the failed call may be made again with no change made by a person. It is a constant of the class: this table gives the one value per class. An entry of a harness adapter or of a `failures` map that states no value takes the value of this table, and an entry that states another value is invalid. The engine writes the value to the event `harness.error`. The values follow feature 100 annex E §E.3: a stop by `proposer_consecutive_errors` is `retryable: true` for the classes `agent_failure` and `provider_other` and for `overload` after its cap, and false for `quota_credit` and `auth`. The terminal record of a stop that rests blocked on a human carries `retryable: false` whatever the class says (F127-FR-014, F127-FR-017).

### §Q.2 Confidence, sources of a reset time, and the probe

| Subject | Content |
|---|---|
| Confidence | The five of annex C §C.13: `structured`, `status`, `text`, `stall`, `host`. Order of evidence: a structured signal of the stream, then an HTTP status or code, then a text pattern of the descriptor or of the default text classifier, then the stall watchdog. `host` is a fact that a host observed |
| Pauses at once | `structured`, `status` |
| Pauses only after a confirming probe | `text`, `stall`, `host` |
| Sources of `resetsAt` | `structured` (a field of the stream), `header` (a reply header such as a retry delay), `parsed_text` (a time read from a message; a last resort, since a clock time without a zone is ambiguous), and null |
| Confirming probe | One minimal real call through the same harness adapter, role and model as the failed call. It confirms when it fails with a class `quota_window` or `quota_credit`. It refutes when it succeeds or fails with any other class; the original failure then takes the path of its refuted class, `provider_other` when none. A probe is a call: it is real spend and is written to the ledger; it is not a pass, a phase attempt or a call of the calls ceiling, and it spends nothing of the pass limit |
| Probe schedule | With `resetsAt` null, a pause in progress probes after 5, 15, 30 and 60 minutes and then every 60 minutes (`pause.probeScheduleMs`). The first probe of a text-confidence pause is the confirming probe and is made before the state is entered |
| Resume time | `resumeAt` = `resetsAt` + `pause.marginMs` + a random jitter of 0 to `pause.jitterMs`; or the time of the next probe |

### §Q.3 Budgets: dimensions, scopes, keys

| Subject | Content |
|---|---|
| Dimensions | `tokens` (input plus output; cache and reasoning tokens are shown apart and never folded in), `costUsd`, `wallClock`, `phaseAttempts`, `calls` (passes and critic-class calls; a probe is not one) |
| Scopes | Role: `tokens`, `costUsd`, `calls`. Run: all five |
| Off | A ceiling of 0, absent or not finite is off |
| Hard | `costUsd` and `tokens` count only records whose billing mode is `api`. `phaseAttempts` and `calls` are counts and always hard. These four are the caps of spend: their counts are kept in the spend ledger, survive a relaunch, and a reached one ends with the blocked reason `budget-cap` (F127-FR-034) |
| Wall clock | `wallClock` is always enforced. It is a ceiling of time and not a cap of spend: it is measured per engine start, and a trip ends as at the baseline, with the stop reason `wall_budget`, exit 4, `retryable: true` and no blocked reason (F127-FR-027; `assumption: CQ-192`) |
| Soft | `softTokens` per role counts every observed token of the role, per window where the harness reports the window's reset and else for the run. It only raises alerts |
| Keys (rows 107 and 108 of annex X §X.7; feature 110 owns the spelling) | `budget.role.<role>.tokens`, `.costUsd`, `.calls`, `.softTokens`; `budget.run.tokens`, `.costUsd`, `.phaseAttempts`, `.calls`; `loop.maxWallMin` for the wall clock (the alias of the as-is variable `SPECSTRIDE_MAX_WALL_MIN`, annex X §X.8) |
| Trust class | Ceilings and `pause.maxTotalMs` are narrowing keys (a project may only lower them); `roles.<role>.fallback` and its companions are widening keys; thresholds and the rate table are neutral |
| Enforced | At every usage record, and at the safe boundaries: before a pass, before a critic-class call, before a phase attempt, between units of work of the micro-loop layer |

### §Q.4 Alerts

| Subject | Content |
|---|---|
| Levels | `info`, `warn`, `loud` (annex X §X.6 row 48). `info` reaches `status` and the doctor. `warn` also reaches the digest. `loud` reaches every channel of §Q.5 |
| Kinds | `budget-threshold`, `provider-warning`, `billing-mode-change`, `spend-unmeasurable`, `ledger-unreadable` |
| Thresholds | 50, 75 and 90 per cent of a ceiling (`budget.alerts.thresholds`). With an API key: 50 is `info`, 75 and 90 are `loud`. For a soft budget on a subscription: 50 is `info`, 75 and 90 are `warn`. Any other ceiling (a role whose billing mode is `subscription` or `unknown`, or a run-scope ceiling while no role of the run is on an API key): 50 is `info`, 75 and 90 are `warn`. Reaching 100 per cent of a hard ceiling is the event `budget.exceeded` and not an alert |
| Fixed levels | `billing-mode-change`: `loud`. `provider-warning`: `warn`. `spend-unmeasurable`: `warn`. `ledger-unreadable`: `loud` where any hard ceiling is set, else `warn` |
| Deduplication | By the key (kind, role, threshold). A threshold fires once per window, and again after a reset re-arms it |
| Budget level | The level of a ceiling for readers is the highest threshold reached: none, 50, 75, 90, or exceeded |

### §Q.5 Delivery of alerts

The engine is the only source. Everything else reads.

| Channel | Reads | Note |
|---|---|---|
| `status` (text, `--json`, `--line`) | The alert events and the state files through the read model | Every level |
| Digest | The alerts and the summary of the ledger | `warn` and `loud`; the summary at the end and at each supervision cycle |
| Doctor | Open alerts, the caps in force, the billing mode, the fallback in force | Every level |
| Host hooks, where the host has them | A `loud` alert, `paused-quota`, `blocked`, finished | `unverified`: whether a watcher started by a host hook lives long enough (R3, R14 open question 7) |
| Announcement at launch and at `resume` | The caps in force and the billing mode of each role, the fallbacks in the role plan | Printed by the CLI from the resolved role plan and configuration |
| Host without host hooks | `status`, the digest and the doctor | Ruling 62; DP-003 |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A quota exhaustion pauses the run and spends nothing (Priority: P1)

A consumer runs unattended on a subscription. In the third pass of a phase attempt the provider says that the five-hour window is used up and when it resets. The run does not stop and does not count an error. It waits, alive, and goes on when the window reopens.

**Why this priority**: It is decision 8 and the reason the feature exists. Without it a window of hours ends the run in minutes.

**Independent Test**: In the conformance fixture a harness stub declares, in its failure map, a limit signal with a reset time, and the clock is fake. The run enters `paused-quota`, the pause record exists, the fake clock moves to the reset time plus the margin, and the run resumes. Reject count, pass count, MALFORMED streak, error count, wall-clock budget and relaunch budget are the same before and after.

**Acceptance Scenarios**:

1. **Given** a `quota_window` classification with confidence `structured`, **When** the engine reads it, **Then** the state is `paused-quota`, the pause record holds the role, class, confidence, `since`, `resetsAt`, `resumeAt`, `probeIndex` and `ceilingAt`, and the events `quota.signal` and `run.paused` are written (F127-FR-010).
2. **Given** a classification with confidence `text`, **When** the confirming probe fails with a limit class, **Then** the pause begins; **When** the probe succeeds, **Then** no pause begins and the failure takes the error path (F127-FR-006).
3. **Given** the reset time has passed plus the margin and jitter, **When** the engine wakes, **Then** it emits `run.resumed`, removes the pause record, gives the pass back and starts a new pass in the same phase attempt (F127-FR-013).
4. **Given** a pause that reaches its ceiling of 24 hours, **When** the ceiling passes, **Then** the run rests in `blocked-on-human` with the stop reason `paused_quota_ceiling` and exit 4 (F127-FR-014).
5. **Given** the critic is limited before it returned a parseable verdict, **When** the engine reads the class, **Then** the same state applies and the MALFORMED streak is unchanged (F127-FR-011).

---

### User Story 2 - The loudest alert is the switch to an API key (Priority: P1)

A consumer opted in to a fallback from a subscription to an API key with a cap. The subscription window runs out. The run switches, and tells the consumer first, in the loudest way, before any call is billed.

**Why this priority**: A switch from a flat plan to metered spend is the one event that can cost money the consumer did not expect.

**Independent Test**: Run a fixture with a fallback list whose second entry is an API-key entry with a cap, exhaust the first, and read the event order: the alert of kind `billing-mode-change` and level `loud` precedes the first usage record of the second entry.

**Acceptance Scenarios**:

1. **Given** a fallback entry with billing mode `api` and no declared cap, **When** the trigger fires, **Then** the entry is skipped with the event `fallback.skipped` (reason `no-cap`) and never used (F127-FR-021).
2. **Given** an entry with a cap, **When** the terms gate allows it, **Then** `alert` (`billing-mode-change`, `loud`) and `fallback.switched` are written before the first call on the key (F127-FR-021, F127-FR-022).
3. **Given** the terms gate refuses an entry, **When** the switch is due, **Then** the entry is skipped with the event `fallback.skipped` and the next entry is tried (F127-FR-020).

---

### User Story 3 - A hard cap holds (Priority: P1)

A consumer sets a cost cap on a role that runs on an API key. The run stops at a safe boundary when the cap is reached, tells the consumer what to do, and never forgets what it spent, even if its own ledger file is damaged.

**Why this priority**: A cap that can be exceeded or reset is not a cap.

**Independent Test**: A stub reports usage records of a known cost per call. With the cap at 10 units and 3 units per call, the recorded real spend after the stop is at most 12. Then the ledger file is made unreadable and the run resumes: spend is not zero.

**Acceptance Scenarios**:

1. **Given** a hard ceiling of spend, **When** a usage record brings the sum to the ceiling, **Then** the engine ends the live pass, writes `budget.exceeded`, and the run rests in `blocked-on-human` with the reason `budget-cap` (F127-FR-033, F127-FR-034).
2. **Given** several live harness processes, **When** any usage record arrives, **Then** the cap is evaluated on their sum (F127-FR-033).
3. **Given** a ledger that cannot be read, **When** the engine starts, **Then** spend is rebuilt from the previous generation and the events, and never reset to zero (F127-FR-032).

---

### User Story 4 - The whole-run wall-clock budget is as before (Priority: P1)

A consumer sets a wall-clock budget of 90 minutes. At the top of the next phase attempt after 90 whole minutes the run halts with exit 4 and the reason `wall_budget`, exactly as the baseline does. The stop may be relaunched: the terminal record says `retryable: true` and names no blocked reason. A budget of 0 means unlimited.

**Why this priority**: It is the one budget of the baseline, and the parity oracle compares it (FX-23).

**Independent Test**: FX-23 `wall-budget` on both sides gives `equal` on every surface.

**Acceptance Scenarios**:

1. **Given** `loop.maxWallMin` of 1 and 61 seconds elapsed, **When** the engine reaches the top of a phase attempt, **Then** it logs the as-is line, writes `run_stop` with the reason `wall_budget` and the phase, exits 4, and the terminal record carries `retryable: true` and no blocked reason (F127-FR-027).
2. **Given** a value of 0 or a non-numeric value, **When** any time has elapsed, **Then** the budget never trips (F127-FR-026).

---

### User Story 5 - An author declares a limit signal as data (Priority: P2)

The author of a harness descriptor for a harness the product has no tested harness adapter for writes the map of what its limit looks like. A fixture run of a fake harness then pauses on that signal.

**Why this priority**: The registry is open, and every harness must be able to pause a run without code.

**Independent Test**: The conformance suite of EP-12 registers a fake harness whose declared map holds one limit signal. The fixture run pauses and the reject count is unchanged; with the map removed, the same failure takes the error path.

**Acceptance Scenarios**:

1. **Given** a descriptor whose `failures` map declares a signal for `quota_window`, **When** the fake harness emits it, **Then** the run pauses (F127-FR-008).
2. **Given** an input that matches nothing, **When** the classifier runs, **Then** the class is `provider_other` with confidence `text` (F127-FR-001).

---

### Edge Cases

- The provider gives no reset time: the pause probes on the schedule of §Q.2 (F127-FR-013).
- The machine sleeps during a pause: on wake the remaining wait is computed from `resumeAt` and `ceilingAt`, never from a timer (F127-FR-015).
- The engine is killed during a pause and `resume` is run: the pause record is read and the pause is entered again (F127-FR-015).
- A stop is requested during a pause: the stop is honoured at the next tick (F127-FR-016).
- The resumed call is limited again: the pause continues in the same episode, and the ceiling is not restarted (F127-FR-014).
- A harness reports no cost: the cost ceiling cannot be measured, the wall-clock, phase-attempt and call ceilings apply, and the doctor says so (F127-FR-035).
- A cumulative usage record arrives twice: it is deduplicated by its `usageId` and converted to an increment (F127-FR-028).
- A subscription run reports a dollar figure: it is notional and is never added to real spend (F127-FR-029).
- Every fallback entry is limited: the role pauses until the earliest reset (F127-FR-023).
- The escalation target of the micro-loop layer is limited while the base model is not: the escalation is skipped and recorded (F127-FR-009).
- The consumer's comment asks to skip a cap: no comment, flag or mode bypasses a budget (F127-FR-034).
- The ledger is unreadable and no source can rebuild it: hard ceilings of spend are read as reached (F127-FR-032).

## Requirements *(mandatory)*

### Functional Requirements

#### Group G1: classifier

- **F127-FR-001**: The quota classifier MUST offer the operations `classify` and `observe`. `classify` MUST take what the harness adapter saw (a stream record, a status with headers and body code, an exit code, error text) and give a class, a confidence, `resetsAt` or null, and `retryable`, whose value MUST be the one that §Q.1 gives for the class. `observe` MUST take a gauge of remaining allowance or a fact a host observed and give an alert level or nothing. The classes are the nine of §Q.1 and the confidence values the five of §Q.2. An input that matches no entry MUST give `provider_other` with the confidence `text`; an unknown class from an implementation MUST be read as `provider_other` and an unknown confidence as `text`.
  - ep: EP-12 `specstride.quota-classifier/1` (implements)
  - test: CT-127-3
  - status: unverified (check: the quota signal of every Wave 1 harness is captured in a fixture by its harness adapter feature; verified-on: —; pin: harness versions of the captures)

- **F127-FR-002**: Every classification MUST carry a class, a confidence, `resetsAt` (a time, or null), the source of `resetsAt` (`structured`, `header`, `parsed_text` or null), `retryable`, the rate-limit type where the harness names one, the utilization where it gives one, and a fragment of the evidence that has passed the redactor. Evidence MUST be taken in the order of §Q.2: structured signal, status, text pattern, stall watchdog. A time read from text MUST be used only when no structured or header value exists.
  - ep: EP-12 `specstride.quota-classifier/1` (implements)
  - test: CT-127-4
  - status: unverified (check: a captured limit event of the Claude stream and of each other Wave 1 harness; verified-on: —; pin: harness versions of the captures)

- **F127-FR-003**: The classifier MUST be a pure table evaluated by the table evaluator: versioned data, no I/O, no clock and no model, with a default row and the rule id recorded with every classification. The product MUST ship a default text classifier whose classifications have the confidence `text`. A classifier that fails MUST give `provider_other`, and the failure MUST take the as-is path of consecutive errors.
  - ep: EP-12 `specstride.quota-classifier/1` (implements)
  - test: CT-127-5

- **F127-FR-004**: The engine MUST act on the class only and MUST take the action of the row of §Q.1. The pass-level wait of `rate_limit_transient` and the retry of `overload` MUST be bounded by `quota.transientMaxWaitMs` and `quota.overloadRetries`; a wait past the first bound MUST be read as `quota_window`, and a retry past the second as an ordinary provider error.
  - divergence: DV-005
  - parity: not observable (the stub agents emit no quota signal) (rows 39 and 111 of annex X §X.7)
  - test: CT-127-6
  - assumption: CQ-131

- **F127-FR-005**: The counter of consecutive errors MUST count only failures of the classes `agent_failure` and `provider_other`, and `overload` after its cap. A failure that is not classified as a quota class MUST take the as-is path: the pass loop's result 7 at the error limit, engine exit 4, the stop reason `proposer_consecutive_errors`. No quota class MUST spend a reject, a pass, a MALFORMED count, an error count, the wall-clock budget or the relaunch budget.
  - divergence: DV-005
  - parity: the as-is path (fixtures of FX-18 do not reach a quota class) (row 39 of annex X §X.7)
  - test: CT-127-7 (fixture: FX-18)

- **F127-FR-006**: A classification with the confidence `text`, `stall` or `host` MUST pause only after a confirming probe as §Q.2 states. A probe that confirms MUST lead to the pause; a probe that succeeds or fails with another class MUST refute it, and the original failure MUST take the path of the refuted class. A probe MUST be recorded in the ledger as real spend, MUST NOT count as a pass, a phase attempt or a call, MUST spend nothing of the pass limit, and MUST NOT be made when a hard ceiling is already reached.
  - ep: EP-12 `specstride.quota-classifier/1` (implements)
  - parity: not observable (row 39 of annex X §X.7)
  - test: CT-127-8
  - assumption: CQ-137

- **F127-FR-007**: The classifier MUST accept limits that a host observed, from the inbox request type `host-event`, with the source `host`. Such a fact MUST inform only: it MUST never pause, stop or relaunch a run by itself, and it MUST pass the confirming probe before a pause. A host fact under auth tier 1 MUST raise the estimate of the window use shared with the interactive session and MUST be an alert input.
  - ep: EP-12 `specstride.quota-classifier/1` (implements)
  - test: CT-127-9
  - status: unverified (check: the fields that a host hook receives on a limit, R3 and R14 open question 7; verified-on: —; pin: host version)

- **F127-FR-008**: The classifier entries of a harness MUST come from its harness adapter or from the `failures` map of its harness descriptor and MUST be read through the harness port's `classify`. A map declared for a fake harness MUST pause a fixture run, and the reject count MUST stay unchanged; without the map the same failure MUST take the error path. No shared code MUST test a harness name.
  - ep: EP-02 `specstride.harness/1` (consumes); EP-12 `specstride.quota-classifier/1` (implements)
  - test: CT-127-10
  - status: unverified (check: the quota signals of dsh, Codex, pi and prime are captured by their adapter features before their specifications freeze; until then a classification by text pauses only after the confirming probe; verified-on: —; pin: harness versions)

- **F127-FR-009**: The engine MUST keep, per harness and model tier, the last observed limit-window facts (class, `resetsAt`, utilization, rate-limit type) and MUST answer whether a target is limited. An escalation target and a target of the model-tier bump whose quota is exhausted MUST be skipped, the work MUST run on the base model, and the skip MUST be recorded. Such an exhaustion MUST NOT pause the run while the base model is not limited.
  - origin: ruling 47
  - ep: EP-12 `specstride.quota-classifier/1` (implements)
  - test: CT-127-11
  - assumption: CQ-136 (annex D §D.4 lists no quota signal for the router)

#### Group G2: pause, resume, ceiling

- **F127-FR-010**: When the classifier gives `quota_window` with sufficient confidence, the run MUST enter the state `paused-quota` and the engine MUST write the pause record, the event `quota.signal` and the event `run.paused` with the resume time. The pass in flight MUST end with `pass.ended` whose field `endCause` is `quota_pause`, a member of the closed set "End causes of a pass" of feature 111 (row 271 of annex X §X.6); the working tree MUST be kept; the phase attempt MUST stay open. One pause record and one pause event MUST cover the run, whatever the number of live harness processes.
  - divergence: DV-005
  - parity: not observable (row 39 of annex X §X.7)
  - test: CT-127-12
  - ep: EP-12 `specstride.quota-classifier/1` (implements)

- **F127-FR-011**: A pause MUST spend no reject, no pass, no MALFORMED count, no error count, no wall-clock budget and no relaunch budget, and the phase attempt MUST NOT be counted as a rejection. A quota pause on the critic MUST be the same state: the critic call ends with the outcome `quota_pause` (field `outcome` of `critic.call`), the MALFORMED streak and `critic_unavailable` are unchanged, and the call is made again with a new nonce after the resume.
  - divergence: DV-005
  - parity: not observable (row 39 of annex X §X.7)
  - test: CT-127-13

- **F127-FR-012**: Time in a pause MUST be excluded from the wall-clock budget, from the timeout of a pass and from the stall watchdog, and MUST be recorded as `pausedMs` on the phase attempt and on the run. A quota signal inside a unit of work of the micro-loop layer MUST pause like any pass and MUST NOT use an inner cap.
  - parity: not observable (row 39 of annex X §X.7)
  - test: CT-127-14

- **F127-FR-013**: The resume time MUST be `resetsAt` plus `pause.marginMs` (default 60 seconds) plus a random jitter of 0 to `pause.jitterMs` (default 30 seconds). With `resetsAt` null the run MUST probe on the schedule of §Q.2. When `resumeAt` is reached, or a probe succeeds, the engine MUST emit `run.resumed`, remove the pause record and give the pass back; the next pass MUST run in the same phase attempt, in a fresh session or a continued one where the harness supports it.
  - ep: EP-12 `specstride.quota-classifier/1` (implements)
  - parity: not reached (rows 39 and 111 of annex X §X.7)
  - test: CT-127-15
  - assumption: CQ-131

- **F127-FR-014**: A pause MUST have a ceiling, `pause.maxTotalMs`, that the consumer can set, with the default of 24 hours. The ceiling MUST bound a pause episode, which starts at the first pause and ends when a model call of the role succeeds; a resumed call that is limited again MUST continue the same episode. At the ceiling the engine MUST emit `blocked` with the reason `quota-wait-ceiling`, write the terminal record with the stop reason `paused_quota_ceiling`, exit code 4 and `retryable: false`, release the lock and end.
  - divergence: DV-005
  - parity: not reached (row 39 of annex X §X.7)
  - test: CT-127-16
  - assumption: CQ-129

- **F127-FR-015**: A pause MUST hold while the runtime lives. After a wake of the machine the engine MUST compute the remaining wait from `resumeAt` and `ceilingAt` of the record and never from a timer alone. After a crash of the runtime or a reboot nothing MUST relaunch by itself; `resume` MUST find the pause record and enter the pause again with the remaining wait computed the same way. A pause MUST give neither relaunch classifier table anything to classify.
  - divergence: DV-005
  - parity: not reached (row 39 of annex X §X.7)
  - test: CT-127-17
  - status: unverified (check: the behaviour of a sleeping machine on Linux and on macOS; verified-on: —; pin: operating-system versions; every macOS statement is unverified)

- **F127-FR-016**: A stop request MUST be honoured during a pause at least once a minute, and the state MUST pass to `stopping` and then `stopped` as the run-state machine says. A pause MUST never delay a stop.
  - test: CT-127-18

- **F127-FR-017**: The classes `quota_credit` and `auth`, when no fallback entry remains, and a hard cap of spend (F127-FR-034) MUST lead to `blocked-on-human`. A tripped wall-clock budget is not among them (F127-FR-027). The engine MUST emit `blocked` with the reason `quota-credit`, `auth` or `budget-cap`, say in one line what the consumer must do (add credit, repair the login, raise the cap), write the terminal record with the stop reason and exit code of the table of blocked reasons of feature 100 annex E §E.2 (`proposer_consecutive_errors` with 4 for the first two, `wall_budget` with 4 for the third, each with `retryable: false`), release the lock and end. Neither relaunch classifier table MUST relaunch it.
  - ep: EP-12 `specstride.quota-classifier/1` (implements)
  - test: CT-127-19
  - assumption: CQ-020 (which existing stop reason each blocked reason ends with; the sources name none; the reading of feature 100); CQ-192

#### Group G3: fallback

- **F127-FR-018**: A fallback MUST be opt-in per role, as an ordered list of entries in user-scope configuration (`roles.<role>.fallback`), off by default. Project configuration MUST NOT be able to set it: the key is widening. Each entry MUST name a harness, and MAY name a model and an auth tier; the entries MUST come from the resolved role plan of feature 100 annex C §C.6, and nothing MUST be resolved after launch.
  - ep: EP-02 `specstride.harness/1` (consumes)
  - parity: off (row 40 of annex X §X.7)
  - test: CT-127-20

- **F127-FR-019**: The trigger MUST be a `quota_window` or `quota_credit` classification on the current entry of the role, once `roles.<role>.fallbackAfterMs` (default 0, switch at once) has passed. When the reset time of the window is earlier than that delay, the role MUST wait and not switch. A classification `auth` MUST NOT trigger a fallback.
  - parity: off (rows 40 and 112 of annex X §X.7)
  - test: CT-127-21

- **F127-FR-020**: Every entry MUST be evaluated by the terms gate, with its provider, auth tier, the audience and the consumer's acknowledgements, at the moment of the switch. An entry that the terms gate does not allow MUST be skipped with the event `fallback.skipped` of the catalogue of feature 111, which names the entry and the reason (a member of the closed set of row 208 of annex X §X.6; here `terms-refused`), never silently, and the next entry MUST be tried. No comment, flag, mode or project key MUST bypass the terms gate.
  - ep: EP-11 `specstride.terms/1` (consumes)
  - parity: off (row 40 of annex X §X.7)
  - test: CT-127-22

- **F127-FR-021**: A switch from an entry with billing mode `subscription` to an entry with billing mode `api` MUST need a declared cap on that entry; an entry without one MUST be skipped with the event `fallback.skipped` and the reason `no-cap`. The switch MUST write an alert of kind `billing-mode-change` and level `loud` before the first call on the key, and the alert MUST appear in the attention items, the digest and the announcement of the next launch or `resume`. It is the loudest alert of the product.
  - parity: off (row 40 of annex X §X.7)
  - test: CT-127-23

- **F127-FR-022**: A switch MUST happen at a phase-attempt boundary where possible. A switch inside a phase attempt MUST start a fresh session, and context MUST be carried through files. Every switch MUST write `fallback.switched` with the entries, the reason, the phase attempt and the change of billing mode. A fallback that would make the critic and the proposer the same model MUST raise the critic-diversity warning of decision 7 and MUST NOT block. A fallback MUST NOT put a critic into the session of the proposer. An escalation to a higher model tier of the same harness MUST NOT count as a fallback and MUST NOT change the billing mode.
  - parity: off (row 40 of annex X §X.7)
  - test: CT-127-24

- **F127-FR-023**: At the first phase-attempt boundary after the reset time of the primary entry has passed, the role MUST return to it and MUST write `fallback.restored`, unless `roles.<role>.fallbackReturn` is `stay` (default `restore`). When every entry is limited or skipped, the role MUST pause until the earliest reset time. Every usage record MUST carry the harness, provider and billing mode, so that spend per entry is visible.
  - parity: off (rows 40 and 112 of annex X §X.7)
  - test: CT-127-25

#### Group G4: budgets, spend, alerts

- **F127-FR-024**: Budget evaluation MUST check the ceilings of §Q.3 at role and run scope. A ceiling of 0, absent or not finite MUST be off. Reaching any active ceiling MUST give the event `budget.exceeded` naming which ceiling tripped and by how much, and MUST leave the run resumable: raising the ceiling and running `resume` MUST continue where it stopped. The evaluation of several ceilings MUST report every exhausted one.
  - origin: 002 FR-041
  - disposition: translated
  - test: CT-127-1
  - parity: none: no ceiling is set (row 108 of annex X §X.7)

- **F127-FR-025**: A ceiling of `tokens` or `costUsd` MUST be hard and MUST count only usage records whose billing mode is `api`. The counts `phaseAttempts` and `calls` MUST always be hard. These four ceilings are the caps of spend: their counts are kept in the spend ledger and survive a relaunch, and a reached one MUST take the path of F127-FR-034. The ceiling `wallClock` of the run (`loop.maxWallMin`) MUST always be enforced, but it is a ceiling of time and not a cap of spend: it is measured per engine start (F127-FR-026), and a trip MUST take the path of F127-FR-027 and never the path of F127-FR-034. A soft budget (`softTokens`) MUST count every observed token of the role and MUST only raise alerts. Under a subscription the budget MUST therefore be an alert on what the product observes, and the provider's limit signal MUST be the trigger to pause. Records of billing mode `unknown` MUST count towards the observation and the soft budget and MUST NOT count towards a hard ceiling.
  - assumption: CQ-133; CQ-192
  - test: CT-127-26

- **F127-FR-026**: The whole-run wall-clock budget MUST be the key `loop.maxWallMin`, with the as-is variable `SPECSTRIDE_MAX_WALL_MIN` as its alias, in whole minutes. The default MUST be 0, which is unlimited. A value that is not a whole number, or 0, MUST never trip. Otherwise the budget MUST trip when the whole minutes elapsed since the engine started, less the time in a pause (F127-FR-012), are greater than or equal to the limit. The run start and the limit MUST be handed to the pass loop, so that the pass loop can test the budget in a wait on a yield.
  - origin: C-007; C-013; B-0049; B-0270
  - disposition: translated; ported
  - test: PT-127-C-007-*; PT-127-C-013-*
  - divergence: DV-027
  - parity: as at the baseline: the default 0, unless the fixture sets it (row 107 of annex X §X.7)
  - assumption: CQ-134

- **F127-FR-027**: The engine MUST test the wall-clock budget at each phase-boundary step of a phase attempt, after the stop request is tested. When it trips, the engine MUST log the line `>>> wall-clock budget (<m>min) exceeded — halting (exit 4).`, write `run_stop` with the reason `wall_budget` and the field `phase`, and exit 4. The terminal record MUST carry `retryable: true` and no blocked reason; the engine MUST NOT emit `blocked`, and the run MUST NOT rest in `blocked-on-human`: the stop is one that the relaunch classifier tables may relaunch, as at the baseline. The line MUST be printed in both output modes as the engine lines of the baseline are. During a wait on a yield the pass loop MUST test the same budget at each tick; the outcome of that wait, and the reason recorded for it, belong to the pass loop.
  - origin: C-007; C-009; C-010; C-012; B-0068; B-0127; B-0143; B-0210
  - disposition: translated; ported
  - test: PT-127-C-009-*; PT-127-C-010-*; PT-127-C-012-*; PT-127-C-007-*
  - parity: as at the baseline; no new line (rows 18 and 19 of annex X §X.7)
  - assumption: CQ-192

- **F127-FR-028**: Spend MUST be counted the same way for every provider. The unit of the ledger MUST be an increment: a cumulative report MUST be converted to an increment per session (the new value minus the last seen), or dropped in favour of a terminal total; a record MUST be deduplicated by its `usageId`; a sum over cumulative records MUST never be taken. A value the harness did not report MUST be `null` and MUST sum as unknown and not as zero; the ledger MUST carry the number of passes with a known cost and the total number of passes. A usage record MUST carry a billing mode (`api`, `subscription`, `unknown`). A killed pass MUST lose nothing already reported.
  - test: CT-127-27
  - status: unverified (check: which harnesses report usage per model call and which only at the end; verified-on: —; pin: harness versions)

- **F127-FR-029**: A cost that a harness reports under billing mode `subscription` MUST be labelled notional and MUST be kept in its own field of the ledger, apart from real spend. It MUST feed the alerts of §Q.4 and the digest as value used, MUST never be added to real spend and MUST never be checked against a hard ceiling. In the digest, spend under a subscription that is shared with interactive use MUST be marked "observed by Specstride only".
  - origin: ruling 66
  - test: CT-127-28

- **F127-FR-030**: A consumer MAY declare a rate table per harness and model (`budget.rates`). A figure computed from it MUST be a separate field of estimated cost, MUST be labelled as such, MUST never be merged with reported cost and MUST be off unless declared.
  - parity: unset (row 110 of annex X §X.7)
  - test: CT-127-29

- **F127-FR-031**: The spend ledger MUST hold, per role and per billing mode, the tokens, the real cost, the notional cost, the estimated cost, the number of calls and the coverage of F127-FR-028, and for the run the number of phase attempts started, the limit-window facts of F127-FR-009 and the start of the pause episode. It MUST be written atomically after every usage record, MUST have one writer (the engine) and MUST survive a resume, so that the spend of one run is one figure. The reset flag of `resume` MUST NOT reset it; only a new run starts a new ledger.
  - origin: 002 FR-042
  - disposition: translated
  - test: CT-127-2
  - assumption: CQ-130

- **F127-FR-032**: An unreadable ledger MUST never reset spend. The engine MUST first read the previous generation of the ledger, which it keeps, and replay the usage records of the event stream that follow it. When neither gives a value, the ledger is unknown: every hard ceiling of spend MUST be read as reached, the run MUST stop at the next safe boundary with the reason `budget-cap` and the note `ledger-unreadable`, and an alert of kind `ledger-unreadable` MUST be written. Where no hard ceiling of spend is set, the alert MUST be written and the run MUST go on with the ledger rebuilt from zero and marked as partial.
  - divergence: DV-063
  - test: CT-127-30
  - assumption: CQ-135

- **F127-FR-033**: A hard ceiling MUST be evaluated at every usage record and at the safe boundaries of §Q.3, on the sum of every live harness process. When a record brings a hard ceiling to its limit, the engine MUST end the live pass or critic-class call through the stop operation of the harness port (polite first), keep the work of the pass as a claim, and give no verdict. Where the harness descriptor declares a process-level spending limit, the engine MUST pass the remaining headroom to it at the start of a pass. Recorded real spend MUST NOT exceed a cap by more than one model call per live harness process.
  - ep: EP-02 `specstride.harness/1` (consumes)
  - test: CT-127-31

- **F127-FR-034**: When a hard ceiling of spend (`tokens`, `costUsd`, `calls` or `phaseAttempts`, F127-FR-025) is reached the engine MUST write `budget.exceeded` (the fields `dimension`, `limit`, `used`, `role` and `resumable` of the catalogue of feature 111) and MUST emit `blocked` with the reason `budget-cap`, as F127-FR-017 says. The ceiling `wallClock` is exempt: its trip ends as F127-FR-027 says. The stop MUST NOT be a rejection and MUST NOT spend a reject or a pass. No comment, flag, mode or project key MUST switch a budget off or raise it: raising a ceiling is a change of user configuration and a `resume`.
  - test: CT-127-32
  - assumption: CQ-192

- **F127-FR-035**: Where a harness reports no cost, its spend cannot be measured. At launch the announcement MUST say so for that role, the doctor MUST say so, an alert of kind `spend-unmeasurable` and level `warn` MUST be written once, and the ceilings `wallClock`, `phaseAttempts` and `calls` MUST still apply. A cost or token ceiling set on such a role MUST NOT be reported as enforced.
  - test: CT-127-33

- **F127-FR-036**: A critic that is picked automatically and runs on a metered endpoint MUST have a hard spending cap, and the cap MUST be announced at launch. A candidate without a declared cap (`budget.role.critic.costUsd`) MUST NOT be picked; the pick MUST record the reason `no-cap` and go on to the next candidate.
  - divergence: DV-049
  - parity: not reached (every fixture names the critic) (row 35 of annex X §X.7)
  - test: CT-127-34
  - assumption: CQ-132

- **F127-FR-037**: The engine MUST raise alerts at the thresholds of §Q.4 (`budget.alerts.thresholds`, default 50, 75 and 90 per cent), at the levels of §Q.4, once per key (kind, role, threshold) and again after a reset re-arms it. Every free-text field of an alert MUST pass the redactor. Under the `parity` profile no ceiling is set, so no threshold is reached.
  - parity: not used (row 109 of annex X §X.7)
  - test: CT-127-35

- **F127-FR-038**: A provider's own warning of an approaching limit (for example a warning status with a utilization) MUST pass through as an alert of kind `provider-warning` and level `warn`, with the rate-limit type and the reset time. With a subscription the engine MUST track what it observes (tokens per role per window, notional cost, passes, and the utilization the provider gives) and MUST alert on it, since the allowance itself is unknown until the provider signals it.
  - ep: EP-12 `specstride.quota-classifier/1` (implements)
  - test: CT-127-36
  - status: unverified (check: the limit and warning events of the Claude stream, captured on a real subscription run; verified-on: —; pin: Claude CLI version)

- **F127-FR-039**: The engine MUST be the only source of alerts. `status`, the digest, the doctor and the host hooks MUST only read them, and no reader MUST compute an alert or a budget level of its own. Delivery MUST be as §Q.5 says; on a host without host hooks, alerts MUST reach the consumer through `status`, the digest and the doctor. An alert MUST never stall or fail a run.
  - test: CT-127-37

- **F127-FR-040**: The engine MUST write the events `quota.signal`, `run.paused`, `run.resumed`, `harness.error`, `alert`, `budget.exceeded`, `fallback.switched`, `fallback.restored`, `fallback.skipped` and `blocked` under the envelope of feature 100 annex X §X.1, with no content and with free-text fields redacted and cut. Every one of them is a type of the catalogue of feature 111; this feature writes no event whose type the catalogue does not hold. A `run.paused` and a `run.resumed` MUST open and close a pair.
  - ep: EP-08 `specstride.event-sink/1` (consumes)
  - test: CT-127-38

- **F127-FR-041**: At launch and at `resume` the announcement MUST list, per role, the billing mode of the primary entry, the ceilings in force, the fallback entries with their billing mode and cap, and any role whose spend cannot be measured. It MUST say "API key in use, cap <value>" for a role on an API key, and MUST say so when no cap is set.
  - test: CT-127-39

### Key Entities *(include if feature involves data)*

| Entity | What it is |
|---|---|
| Quota classification | A class, a confidence, a reset time or null, `retryable` and redacted evidence, for one failure or gauge |
| Confirming probe | One minimal real call that confirms or refutes a classification of weak confidence |
| Pause, pause record, pause episode | The state `paused-quota`; its record with the resume time and the ceiling; the span from the first pause to the next successful call of the role |
| Limit-window state | The last observed window facts per harness and model tier |
| Fallback entry | One harness, model and auth tier in the ordered list of a role, with a billing mode and, for an API key, a cap |
| Budget, ceiling | A limit on one dimension at role or run scope; hard or soft |
| Spend ledger | The run's durable account of usage: real, notional and estimated, per role and billing mode |
| Notional cost | A cost figure under a subscription; never real spend |
| Alert | A record of level `info`, `warn` or `loud`, of a kind, written only by the engine |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F127-SC-001**: A quota exhaustion pauses the run without adding to the reject count. In the conformance fixture the run enters `paused-quota`, resumes at the reset, and reject count, pass count, MALFORMED streak, error count, wall-clock budget and relaunch budget are unchanged, in 100 per cent of the classes and confidence values that pause.
- **F127-SC-002**: Alerts are loudest with an API key. Every switch from a subscription to an API key produces an alert of the highest level before the first call on the key, in 100 per cent of the fixtures; an entry with no cap is never switched to.
- **F127-SC-003**: A hard cap holds. Recorded real spend never exceeds the cap by more than one model call per live harness process, in 100 per cent of the fixture runs, including runs with several live processes.
- **F127-SC-004**: The whole-run wall-clock budget is as at the baseline. The oracle reports 0 results `different` for FX-23 under the `parity` profile, and FX-18 still takes the old path of consecutive errors with 0 results `different`.
- **F127-SC-005**: Nothing pauses on weak evidence. In 100 per cent of the fixtures with the confidence `text`, `stall` or `host`, a probe is made before the pause, and in 0 fixtures a pause begins without one.
- **F127-SC-006**: Spend is never forgotten. In 100 per cent of the cases in which the ledger is made unreadable, the spend after the next start is not lower than the spend before it, or the run stops with the reason `budget-cap`.
- **F127-SC-007**: The ceiling is kept. In 100 per cent of the fixtures in which a pause outlasts `pause.maxTotalMs`, the run rests in `blocked-on-human` with `paused_quota_ceiling` and exit 4 within one tick of the ceiling.
- **F127-SC-008**: The resume is punctual. On a fake clock the run resumes not before the reset time plus the margin, and not later than the margin plus the jitter plus one tick after it, in 100 per cent of the fixtures with a known reset time.
- **F127-SC-009**: Notional cost is kept apart. In 100 per cent of the fixtures with a subscription, the real spend in the ledger is 0 and the notional cost is the sum of the reported figures.
- **F127-SC-010**: Every switch is gated and recorded. In 100 per cent of the fixture switches the terms gate was evaluated before the first call, and `fallback.switched` and the alert are in the event file.
- **F127-SC-011**: Classifier fixtures pass for each tested harness that has a captured quota signal, and the conformance suite of EP-12 passes with a sample classifier outside the core with 0 core files changed.

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
| Subscription quota is the main budget; auth tier 1 is the default for the audience `personal` | Decision 6 |
| A pause resumes when the window resets and is never counted as a rejection | Decision 8 |

## Extension points

| EP | Id and version | Relation | What for |
|---|---|---|---|
| EP-12 | `specstride.quota-classifier/1` | implements | The class set, the default text classifier, the operations `classify` and `observe`, the confirming probe, the conformance suite and the sample. This feature is the content owner (F127-FR-001 to F127-FR-009) |
| EP-02 | `specstride.harness/1` | consumes | `classify`, `stop`, `startPass` with a spending limit, the role plan and its fallback entries (F127-FR-008, F127-FR-018, F127-FR-033) |
| EP-11 | `specstride.terms/1` | consumes | `evaluate` at every switch to a fallback (F127-FR-020) |
| EP-08 | `specstride.event-sink/1` | consumes | The events of F127-FR-040 reach the sinks after the one writer has written them |

## Contracts of feature 100 used

| Interface contract | Version | Where |
|---|---|---|
| EP-12 quota classifier: classes, confidence, guarantees | `specstride.quota-classifier/1` | Annex C §C.13; F100-FR-109 |
| Pause record | `specstride.pause/1` | Annex B §B.17; F100-FR-073 |
| Run-state machine: `paused-quota`, `blocked-on-human`, transitions T6 to T9, blocked reasons | `specstride.run-state/1` | Annex E §E.2; F100-FR-141, F100-FR-144, F100-FR-146 |
| Stop reasons: `paused_quota_ceiling` (member 15), `wall_budget`, `proposer_consecutive_errors` | `specstride.stop-reason/1` | Annex E §E.3; F100-FR-148 |
| Exit codes of the engine | — | Annex E §E.4; F100-FR-152 |
| Table evaluator | `specstride.table/1` | Annex X §X.3; F100-FR-204 |
| Resolved registry and role plan; roles and their budget key | `specstride.registry/1` | Annex C §C.6; F100-FR-092, F100-FR-093, F100-FR-094 |
| Terms-gate data | `specstride.terms/1` | Annex C §C.12; F100-FR-108 |
| Inbox request types, `host-event` | `specstride.inbox/1` | Annex B §B.11; F100-FR-065 |
| Event envelope | `specstride.event/1` | Annex X §X.1; F100-FR-198 to F100-FR-200 |
| Harness port: `classify`, `stop`, `startPass`; descriptor fields `failures`, `cost`, `spendLimit` | `specstride.harness/1` | Annex C §C.1, §C.2; F100-FR-084 |
| Config envelope, ranks, trust classes; alias table | `specstride.config/1` | Annex X §X.2, §X.8; F100-FR-201, F100-FR-202 |
| Redactor | `specstride.redaction/1` | Annex X §X.4; F100-FR-205 |
| List of closed sets; the `parity` profile | `specstride.profile/1` | Annex X §X.6, §X.7; F100-FR-208, F100-FR-210 to F100-FR-212 |
| Layering rule for pure tables; role resolution | — | Annex A §A.1; F100-FR-007, F100-FR-008 |
| Threat model: T-10, T-13, T-18 | — | Annex X §X.9 |

Fixture families of feature 141 that this feature cites: FX-23 (`wall-budget`, feature 141, §O.2), FX-22 (the yield scenarios, feature 141, §O.2, where the pass loop tests the wall-clock budget in a wait on a yield) and FX-18 (`consecutive-errors-legacy`, `consecutive-errors-structured`, feature 141, §O.2). The stubs of feature 141 emit no quota signal (F141 §O.3), so the pause has no parity test; it has the conformance suite of EP-12 with the generic stub `stub-harness` and a descriptor of the fixture (feature 141, §O.7, first row) and the tests of this feature.

## Rows of the `parity` profile

This feature owns rows 39 and 40 and 107 to 112 of annex X §X.7.

| Row | Switch | Key | Default | Under `parity` | Register row |
|---|---|---|---|---|---|
| 39 | Quota pause | `pause.maxTotalMs` | On; ceiling 24 hours | Not reached: the stub agents emit no quota signal | DV-005 |
| 40 | Fallback of a role | `roles.<role>.fallback` | off | off | — |
| 107 | Wall-clock budget of a run | `loop.maxWallMin` | 0 (unlimited) | 0, unless the fixture sets it | — |
| 108 | Ceilings per role and per run | `budget.role.<role>.costUsd`, `.tokens`, `.softTokens`, `.calls`; `budget.run.costUsd`, `.tokens`, `.phaseAttempts`, `.calls` | none | none | — |
| 109 | Alert thresholds | `budget.alerts.thresholds` | 50, 75, 90 | Not used: no ceiling is set | — |
| 110 | Rate table for estimated cost | `budget.rates` | unset | unset | — |
| 111 | Margin, jitter and probe schedule of a quota pause; bounds of the retries at pass level | `pause.marginMs`, `pause.jitterMs`, `pause.probeScheduleMs`, `quota.transientMaxWaitMs`, `quota.overloadRetries` | 60000; 30000; 300000, 900000, 1800000, 3600000 (the last repeated); 60000; 3 | Not reached | DV-005 |
| 112 | Delay and return of a fallback | `roles.<role>.fallbackAfterMs`, `roles.<role>.fallbackReturn` | 0; `restore` | Not used (no fallback) | — |

Row 35 (automatic pick of the critic) and rows 18 and 19 (output) are read. The default "none" of row 108 is a ceiling that is not set; a ceiling of 0 is off as well (§Q.3). Feature 110 owns the spelling of every key, confirmed.

## Closed sets

Stated as F100-FR-208 asks. Owner of each: 127.

| Closed set | Members | Closed by | Unknown value |
|---|---|---|---|
| Quota classes (row 46) | `quota_window`, `quota_credit`, `rate_limit_transient`, `overload`, `auth`, `context_window`, `agent_failure`, `provider_other`, `budget_cap` | Design | `provider_other` |
| Quota confidence (row 47) | `structured`, `status`, `text`, `stall`, `host` | Design | `text` |
| Alert levels (row 48) | `info`, `warn`, `loud` | Design | `warn` |
| Alert kinds (row 205) | `budget-threshold`, `provider-warning`, `billing-mode-change`, `spend-unmeasurable`, `ledger-unreadable` | Design | Shown as text at level `warn` |
| Budget dimensions (row 206) | `tokens`, `costUsd`, `wallClock`, `phaseAttempts`, `calls` | Design | The key is refused as a configuration error |
| Sources of a reset time (row 207) | `structured`, `header`, `parsed_text` | Design | Read as `parsed_text` |
| Reasons that skip a fallback entry (row 208) | `terms-refused`, `no-cap`, `not-in-plan`, `limited` | Design | Shown as text; the entry is skipped |

## As-is behaviour not carried

The traceability files assign to this feature no row with the disposition `superseded-by` or `dropped`. The six behaviour items and the two Lisa requirements are all kept.

The as-is path of a quota failure (a provider error, exit 4, a relaunch) is not carried for classified quota classes; register row DV-005 records it. It stays for every other class (F127-FR-005).

As-is ids carried, and where:

| As-is id | Disposition | Requirement | Test |
|---|---|---|---|
| 002 FR-041 | translated | F127-FR-024 | CT-127-1 |
| 002 FR-042 | translated | F127-FR-031 | CT-127-2 |
| C-007 (B-0049, B-0068) | translated | F127-FR-026, F127-FR-027 | PT-127-C-007-* |
| C-009 (B-0127) | ported | F127-FR-027 | PT-127-C-009-* |
| C-010 (B-0143) | ported | F127-FR-027 | PT-127-C-010-* |
| C-012 (B-0210) | ported | F127-FR-027 | PT-127-C-012-* |
| C-013 (B-0270) | ported | F127-FR-026 | PT-127-C-013-* |

## Clarifications

### Session 2026-09-29

Questions of `speckit-specify` and `speckit-clarify`, answered from the sources. No question was put to a person.

- Q: Which class set and which confidence set hold, given that the brief lists four confidence values and R14 lists ten classes with `network`? → A: Feature 100 annex C §C.13: nine classes and five confidence values, including `host`. The annex stands over the brief and the report. Integrated in §Q.1 and §Q.2. (Source: annex C §C.13; annex X §X.6 rows 46 and 47)
- Q: Does a quota pause spend any budget? → A: No budget of any kind, and the phase attempt is not a rejection. Integrated in F127-FR-011. (Source: ruling 27; DP-028; F100-FR-146)
- Q: How long may a pause last, given that R14 proposes 12 hours? → A: 24 hours by default, configurable, then `blocked-on-human` with `paused_quota_ceiling`. (Source: ruling 28; DP-068; F100-FR-146). Integrated in F127-FR-014.
- Q: Does a pause outlive a reboot? → A: No. A pause holds while the runtime lives; `resume` after a reboot enters it again from the record. (Source: ruling 28; DP-085; R14 risk 10). Integrated in F127-FR-015.
- Q: Is the ceiling per pause or per episode, given that R14 says "a single pause" and a resumed call can be limited again at once? → A: Per episode, from the first pause to the next successful call of the role. Otherwise a role that is limited again after each resume would never reach the ceiling. Marked as an assumption. (Source: R14 "The pause" step 6; the record of feature 100 annex B §B.17)
- Q: How many probes before a pause on weak evidence? R14 says "one confirming probe" and also "downgraded after 2 probes". → A: One. The confirming probe is made before the state is entered and must return a limit class; anything else refutes the classification. A pause on weak confidence that was never confirmed therefore cannot exist, and the "2 probes" rule of R14 has nothing left to apply to. Marked as an assumption. (Source: R14 "The pause" steps 1 and 5; F100 annex C §C.13)
- Q: What does a host-observed limit do? → A: It informs and raises the window-use estimate; it pauses only through a confirming probe, and never by itself. (Source: F100-FR-065; annex C §C.13; R14 "Delivery"). Integrated in F127-FR-007.
- Q: What does an exhausted quota on an escalation target do? → A: Skip the escalation; the repair runs on the base model; the skip is recorded. R25 recommended a pause and asked the owner; the owner ruled "skip". (Source: ruling 47; DP-032; F100-FR-130, F100-FR-140). Integrated in F127-FR-009.
- Q: Which four ceilings of Lisa survive, given that Lisa's scheduler is not taken? → A: They become budgets per role and per run: `tokens`, `costUsd`, `wallClock` and the count of attempts, which is renamed `phaseAttempts` (Lisa's "job attempt" belongs to the scheduler); a role also has `calls`. The whole-run wall-clock budget of the baseline is the `wallClock` ceiling and keeps its key `loop.maxWallMin`. (Source: 002 FR-041; `packages/scheduler/src/budgets.ts` at `363e6a3`; glossary row 6; annex X §X.8). Integrated in §Q.3.
- Q: What counts against a hard ceiling? → A: Only real spend: records of billing mode `api`. The notional cost of a subscription is never spent money. (Source: R14 "Cost model" rule 3; ruling 66). Integrated in F127-FR-025 and F127-FR-029.
- Q: Which alert level does an API-key budget use at 75 and 90 per cent, given that R14 lists `warn` and also says warn and above are `loud` with an API key? → A: `loud`; 50 per cent is `info`. Integrated in §Q.4. (Source: R14 "Budget alerts")
- Q: How does a fallback from a subscription to an API key stay safe? → A: It needs a declared cap on the entry, else the entry is skipped; the alert of level `loud` precedes the first call. (Source: R14 "The fallback chain"; decision 8; ruling 60 for the same mandatory cap on a metered critic). Integrated in F127-FR-021 and F127-FR-036.
- Q: How does the wall-clock budget behave across a relaunch, given that the baseline starts its clock at each engine start? → A: As the baseline: the elapsed time is measured from the engine start. The relaunch budget of feature 100 bounds the whole. Marked as an assumption. (Source: `orchestrator.sh:888-896` at `9cab15d`; B-0270)
- Q: Where is the wall-clock budget also tested? → A: At each phase-boundary step after the stop request, and inside a wait on a yield at each tick, because the flock is held for the whole wait (`proposer.sh:1536-1538`). The outcome of the wait is the pass loop's. (Source: B-0068; B-0127; annex E §E.4 pass loop result 9). Integrated in F127-FR-027.
- Q: What happens to a ledger that cannot be read? → A: It is rebuilt from the previous generation and the event stream. If that fails the ledger is unknown and every hard ceiling is read as reached. Lisa's behaviour, loading as zero, is unsafe for a hard cap and is fixed. (Source: DV-063; D-33; 002 FR-042). Integrated in F127-FR-032. Marked as an assumption for the last step.
- Q: Does the reset flag of `resume` reset spend? → A: No. The reset flag resets counts inside a run, and a hard cap that could be reset by a flag would not hold. Only a new run starts a new ledger. Marked as an assumption. (Source: ruling 8; ruling K3 (no flag bypasses a budget); F100-FR-174)
- Q: What is a "billing mode" `unknown`? → A: A record of a harness that does not say what a dollar means. It counts towards observation and soft budgets and not towards a hard ceiling; the doctor says spend cannot be measured. Marked as an assumption. (Source: R11 T-18; R14 "Cost model")
- Q: Who reads the alerts and how does a host without host hooks get them? → A: The engine is the only source; readers are `status`, the digest, the doctor and host hooks; without host hooks the first three carry them. (Source: R14 "Delivery"; ruling 62; `architecture.md` section 12; F100 annex H §H.1)
- Q: Under which logical name is the spend ledger kept? → A: `run:<runId>:spend` of feature 100 annex B §B.5: root control, writer engine, readers engine, RunView and doctor. The CLI is no reader: `status` reads through the read model, and the announcement is printed from the resolved role plan and the configuration. The schema id is `specstride.spend/1` (annex B §B.20). (Source: annex B §B.5 and §B.20; F100-FR-053; changed on 2026-09-30, item W-X-10)
- Q: Which roles can pause, given that Wave 1 registers only `proposer` and `critic`? → A: Every registered role. The diagnostician runs under the critic-class rules and the accelerator under the proposer rules (annex C §C.6), so a limit on either takes the state of the role whose rules it follows. The loop is sequential, so in practice the run waits; the record names the role that waits. (Source: annex C §C.6; R14 "The pause" step 8)
- Q: Does a probe apply to a `structured` or `status` classification? → A: No. Those pause at once; a probe would cost a call to learn what the provider already said. (Source: R14 "The pause" step 1; §Q.2)
- Q: Which host-event kinds does the classifier read? → A: Two kinds that R14 names for the Claude Code host, a rate-limit failure and an automatic-resume notice of a quota. Their exact spelling is fixed by the host package; the classifier reads the field `kind` as text and ignores a kind it does not know. `unverified` until captured. (Source: R14 "Delivery" row "Host-observed quota"; annex B §B.11)
- Q: Is the announcement of caps a new output line? → A: In default output it is one line among the launch lines of the CLI, and under the `parity` profile nothing is printed (row 19 of annex X §X.7). Its label belongs to the family `SPECSTRIDE-` and is settled with feature 100 annex G §G.3. (Source: ruling 68; F100-FR-176)
- Q: Which questions could the sources not answer? → A: Nine readings, listed under "Assumptions" as `CQ-129` to `CQ-137`, each with a reading that this specification proceeds on. They are numbers of `docs/ecosystem/CLARIFY-QUEUE.md`. The cross-feature review added CQ-192.

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary.
- The divergence register of `consolidation.md` is cited by row, without a count. Rows DV-005, DV-027, DV-049 and DV-063 are the ones this feature cites.
- Where the architecture file, the brief and a ruling differ, the ruling stands.
- The default numbers (margin, jitter, probe schedule, thresholds, retry bounds) are proposals of R14 or of this specification and have low confidence; they are configuration and are to be tuned.
- The stubs of feature 141 emit no quota signal; the classifier, pause, fallback, budgets and alerts are proven by the tests of this feature and by the conformance suite of EP-12.
- Every fact about a provider's limit signal rests on documentation or on a type file only and is `unverified` until the adapter features capture it. Every statement about macOS is `unverified`.

Readings that the sources do not settle. Each is marked in its requirement and reported to the orchestrator with a recommended answer.

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-129 | Is the pause ceiling per pause or per episode? | Per episode | F127-FR-014 |
| CQ-130 | Does the reset flag of `resume` reset the spend ledger? | No; only a new run does | F127-FR-031 |
| CQ-131 | The numbers of the pass-level retries (60 seconds, 3 retries), the margin and the jitter | The proposals of §Q.2 and of the profile table | F127-FR-004, F127-FR-013 |
| CQ-132 | Does an automatically picked metered critic get a default cap, or is it not picked without one? | Not picked without a declared cap | F127-FR-036 |
| CQ-133 | Do records of billing mode `unknown` count against a hard ceiling? | No; observation only | F127-FR-025 |
| CQ-134 | Does the wall-clock budget survive a relaunch? | No: per engine start, as at the baseline | F127-FR-026 |
| CQ-135 | What does an unreadable ledger that cannot be rebuilt do? | Hard ceilings are read as reached | F127-FR-032 |
| CQ-136 | Which names does the escalation skip use to ask about a limited target? | A query of the limit-window state | F127-FR-009 |
| CQ-137 | How many probes confirm a weak classification? | One | F127-FR-006 |
| CQ-192 | Is the wall-clock ceiling of a run a hard ceiling that rests blocked on a human? | No: a tripped wall-clock budget ends as at the baseline, with `retryable: true` and no blocked reason; `budget-cap` is for the caps of spend, which are `tokens`, `costUsd`, `calls` and `phaseAttempts` | F127-FR-017, F127-FR-025, F127-FR-027, F127-FR-034 |

## Repairs after the cross-feature review

Dated 2026-09-30. Items of `docs/ecosystem/reviews/REPAIR-WORKLIST.md`. No id was renumbered or reused, and no requirement or test was added: 41 functional requirements and 11 success criteria, as before.

| Requirement or place | Item | What changed |
|---|---|---|
| §Q.1; F127-FR-001 | W-127-02 | The column `retryable` gives one value per class; `classify` returns that value; an entry of an adapter that states none takes it |
| §Q.3; F127-FR-025 | W-127-01 (CQ-192) | `wallClock` is no longer among the hard ceilings that rest blocked; the caps of spend are `tokens`, `costUsd`, `calls` and `phaseAttempts` |
| F127-FR-027; User Story 4 | W-127-01 (CQ-192) | A tripped wall-clock budget writes `retryable: true` and no blocked reason, and emits no `blocked` |
| F127-FR-034; F127-FR-017; F127-FR-032 | W-127-01 (CQ-192) | The blocked reason `budget-cap` is for a hard ceiling of spend; `wallClock` is exempt |
| F127-FR-020; F127-FR-021; F127-FR-040 | W-111-02 | A skipped fallback entry is the event `fallback.skipped`; the list of events names `fallback.skipped` and `blocked` |
| F127-FR-010; F127-FR-011 | W-111-05 | `quota_pause` is the value of the field `endCause` of `pass.ended`, and of the field `outcome` of `critic.call` |
| F127-FR-004, -013, -019, -023; table of profile rows | W-X-03 | Rows "39 (shared)" and "40 (shared)" are rows 111 and 112 |
| F127-FR-024, -026, -030, -037 | W-X-11 (same fault, found while repairing) | "a new row" became the row number: 108, 107, 110, 109 |
| Table of profile rows, row 108 | W-110-06 | Default and value under `parity` are "none"; `budget.run.phaseAttempts` added |
| §Q.1, §Q.2; F127-FR-005, -006, -011, -013, -034; F127-SC-001; User Story 1 | W-100-14 | "iteration" as a counted unit became "pass"; the pass is given back |
| F127-FR-022 | Table of feature 100, row 23 | "same-model warning" became "critic-diversity warning" |
| Clarification on the logical name of the ledger | W-X-10 | The name is cited from annex B §B.5 with the readers of annex B; the CLI is no reader |
| Assumptions | W-X-05 | The register is named without a count |
| Closed sets | W-X-12 (same fault, found while repairing) | The four sets marked "new" carry their rows 205 to 208 of annex X §X.6 |
| Out of scope | W-X-16 (same fault, found while repairing) | The terms gate belongs to feature 147 |
| F127-FR-034 | Re-check B-8.7 | The fields of `budget.exceeded` are named as the catalogue of feature 111 holds them (`dimension`, not "ceiling"; `resumable` added) |
| F127-FR-010 | Re-check B-8.7 | The closed set of the end causes of a pass is cited by its row, 271 of annex X §X.6 |
