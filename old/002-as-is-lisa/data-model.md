# Data Model: Lisa — As-Is (reverse-engineered at 76adfdc)

This document lists the entities that the source at `76adfdcbea7f` defines today: zod schemas, TypeScript interfaces and on-disk records. Each `###` heading below is one entity. The evidence comment under each heading cites the code that defines it. Fields, relationships and state transitions are copied from that code. None of it is a proposed design.

Conventions used below: `ULID` means the core `UlidSchema`. `sha256` means the core `Sha256Schema`. `ISO` means `IsoTimestampSchema`. "(default X)" is the zod `.default(X)` value.

### Job
<!-- evidence: packages/core/src/domain/index.ts:178-191, packages/core/src/domain/index.ts:81-99 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

The domain unit of work that the lifecycle engine drives.

| Field | Type | Notes |
|---|---|---|
| `id` | ULID | |
| `version` | int ≥ 0 | default 1 |
| `title` | string ≥ 1 char | |
| `workdir` | string ≥ 1 char | |
| `featureSlug` | FeatureSlug | |
| `specificationId` | ULID | the specification the job executes |
| `currentPlanRevision` | int ≥ 0, optional | |
| `state` | JobState | see transitions below |
| `dependsOn` | ULID[] | default `[]` |
| `policies` | JobPolicies | see the JobPolicies entity |
| `createdAt` | ISO | |
| `scheduleId` | ULID, optional | set when a Schedule created the job |

**JobState values**: INTAKE, NORMALIZING, PLANNING, PLAN_REVIEW, READY, EXECUTING, INTEGRATING, VERIFYING, COMPLETED, PAUSED, AWAITING_HUMAN, CANCELLED, FAILED, BUDGET_EXCEEDED.

**Relationships**: a Job has one JobPolicies. It references a specification by id, may reference a Schedule, and depends on other Jobs through `dependsOn`. Its transitions are recorded as JobTransition records.

**State transitions** (`transition()` in `packages/core/src/engine/lifecycle.ts:145-213`):

- From any non-terminal state:
  - `stop_requested` or `pause_requested` → PAUSED
  - `cancelled` → CANCELLED
  - `budget_exceeded` → BUDGET_EXCEEDED
  - `failed` → FAILED
  - `approval_required` → AWAITING_HUMAN
- INTAKE → NORMALIZING on `intake_received`.
- NORMALIZING → PLANNING on `normalized`.
- PLANNING → PLAN_REVIEW on `plan_generated` when `requiresReview` is true. Otherwise it goes to READY.
- PLAN_REVIEW → READY on `plan_approved`, and back to PLANNING on `plan_rejected`.
- READY → EXECUTING on `execution_started`.
- EXECUTING stays EXECUTING on `phase_approved`, and moves to INTEGRATING on `all_phases_approved`.
- INTEGRATING → VERIFYING on `integration_completed`.
- VERIFYING → COMPLETED on `verification_passed`, and → FAILED on `verification_failed`.
- PAUSED → READY on `resumed`.
- AWAITING_HUMAN → READY on `approval_granted` or `resumed`, and → FAILED on `approval_denied`.
- COMPLETED, CANCELLED, FAILED and BUDGET_EXCEEDED are terminal. Any other event throws `IllegalTransitionError`.

### JobTransition
<!-- evidence: packages/core/src/domain/index.ts:199-206 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

One persisted lifecycle step.

| Field | Type |
|---|---|
| `jobId` | ULID |
| `from` | JobState |
| `to` | JobState |
| `cause` | string ≥ 1 char (the lifecycle event kind) |
| `eventId` | ULID (the journal event that recorded it) |
| `occurredAt` | ISO |

**Relationships**: each record belongs to one Job and references one LisaEvent through `eventId`.

### JobPolicies
<!-- evidence: packages/core/src/domain/index.ts:114-175 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

The four policies embedded in every Job.

- **ExecutionPolicy**:
  - `maxRejects` (default 3)
  - `maxIterations` (default 30)
  - `proposerTimeoutSec` (default 1800)
  - `criticTimeoutSec` (default 300)
  - `gitCheckpoint`: `auto` | `on` | `off` (default `auto`)
  - `verifiedExecution` (default false)
- **BudgetPolicy**: `maxTokens`, `maxCostUsd`, `maxWallClockMin`, `maxAttempts`. Each defaults to 0, and 0 means the ceiling is off.
- **ConcurrencyPolicy**:
  - `maxParallelTasks` (default 1)
  - `resourceClasses`: an array of `{resource, capacity}` (default `[]`)
  - `worktreeIsolation` (default false)
- **ModelPolicy**:
  - per-role `provider/model` chains: `proposer`, `critic`, `chat`, `planner` and `judge` (each default `[]`)
  - optional `maxCostUsdPerRole`

**Relationships**: a JobPolicies is owned by exactly one Job. BudgetPolicy is evaluated against the BudgetLedger.

### Phase
<!-- evidence: packages/core/src/domain/index.ts:229-236 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

The normalized parse unit that every spec-format adapter produces. The schema is `.strict()`.

| Field | Type | Notes |
|---|---|---|
| `n` | int | both the phase ordinal and the `GATE<n>` identity |
| `title` | string | |
| `section` | string | |
| `criteria` | string[] | acceptance criteria |

**Relationships**: a Phase has zero or more Attempts, and one GateState on disk.

### Attempt
<!-- evidence: packages/core/src/domain/index.ts:418-427, packages/core/src/domain/index.ts:377-383 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

One proposer → critic round for a phase.

| Field | Type | Notes |
|---|---|---|
| `phase` | int | |
| `attempt` | int > 0 | numbered from 1 |
| `planRevision` | int ≥ 0, optional | |
| `outcome` | `pending` \| `approved` \| `rejected` | default `pending` |
| `evidence` | Evidence, optional | `{phase, attempt, artifact, contentHash: sha256, writtenAt: ISO}` |
| `verdict` | CriticVerdict, optional | |
| `usage` | Usage, optional | |
| `archivedDir` | string, optional | set once the attempt is archived |

**State transitions**: `pending` → `approved`, or `pending` → `rejected`. A rejected attempt is archived under `attempts/phase<N>/attempt<M>/`. That behavior is FR-014 in spec.md.

### CriticVerdict
<!-- evidence: packages/core/src/domain/index.ts:392-406 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

| Field | Type | Notes |
|---|---|---|
| `phase` | int | |
| `attempt` | int > 0 | |
| `planRevision` | int ≥ 0, optional | |
| `nonce` | string ≥ 1 char | per-call nonce |
| `result` | `APPROVED` \| `REJECTED` \| `MALFORMED` | |
| `reason` | string, optional | |
| `provider` | string, optional | |
| `usage` | Usage, optional | |
| `decidedAt` | ISO | |

**Relationships**: one CriticVerdict belongs to one Attempt. Downstream, MALFORMED resolves to a rejection.

### GateState (on-disk gate files)
<!-- evidence: packages/core/src/gates/store.ts:41-49, packages/core/src/gates/store.ts:60-86, packages/core/src/gates/store.ts:179-196 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

This is the file-backed state of one phase under `<featureDir>/`. It is not a typed record.

- `gates/GATE<n>-EVIDENCE.md` holds the proposer evidence. It is written atomically (tmp, fsync, rename).
- `gates/GATE<n>-FEEDBACK.md` holds the critic feedback.
- `gates/GATE<n>-APPROVED` is an empty marker. Its existence means the phase is approved.
- `gates/proofs/` holds proof slices.
- `attempts/phase<n>/attempt<m>/` receives a moved evidence file, copied feedback and a copied `verdict.txt`.
- `attempts/phase<n>/approved/` receives leftover feedback once the phase is approved.
- `verdicts/phase<n>.attempt<m>.<tag>.txt` holds the critic transcripts.

**State transitions**:

- no evidence → evidence present (proposer writes)
- evidence present → approved: the marker is written and the evidence stays
- evidence present → rejected: the evidence is moved into `attempts/`, which resets the gate for the retry

The resume phase is derived as the first `n` without an APPROVED marker.

### ApprovalRequest
<!-- evidence: packages/core/src/domain/index.ts:450-468, packages/core/src/domain/approvals.ts:208-230 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

A durable human-approval request, stored as `<featureDir>/approvals/<id>.json`.

| Field | Type | Notes |
|---|---|---|
| `id` | ULID | |
| `version` | int ≥ 0 | default 1 |
| `jobId` | ULID | |
| `planRevision` | int ≥ 0 | |
| `phase` | int, optional | |
| `taskId` | string, optional | |
| `attempt` | int > 0, optional | |
| `decisionRequested` | string ≥ 1 char | |
| `targetHash` | sha256 | the frozen target the decision must name |
| `context` | ApprovalContext | `criteria`, `evidenceRefs`, `verdictRefs`, `diffRefs`, `risks`, `costs` |
| `allowedResponses` | string[] | default `["approve","reject"]` |
| `expiresAt` | ISO, optional | |
| `escalation` | `{afterSec, action: notify\|auto_reject\|escalate, target?}`, optional | |
| `status` | `pending` \| `approved` \| `rejected` \| `expired` | default `pending` |

**State transitions**: `pending` → `approved` or `rejected`, through an accepted ApprovalDecision (`packages/core/src/domain/approvals.ts:147-177`). A decision is refused, and the request is left unchanged, when the request is not pending, the response is not allowed, or the hash is stale. `expired` is declared in the enum. This reverse run did not trace which code path sets it (see Assumptions below).

### ApprovalDecision
<!-- evidence: packages/core/src/domain/index.ts:478-487 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

| Field | Type |
|---|---|
| `id` | ULID |
| `requestId` | ULID (the ApprovalRequest it decides) |
| `decider` | string ≥ 1 char |
| `channel` | `web` \| `cli` \| `chat` \| `webhook` |
| `decision` | `approved` \| `rejected` |
| `note` | string, optional |
| `targetHash` | sha256 (must equal the request's `targetHash`) |
| `decidedAt` | ISO |

**Relationships**: a decision is written into the same `<requestId>.json` file as its request. A replayed decision id is idempotent.

### Schedule
<!-- evidence: packages/core/src/domain/index.ts:493-503, packages/scheduler/src/cron.ts:48-62 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->

A cron schedule. It has two shapes:

- **Domain schema** fields: `id` (ULID), `cron`, `misfirePolicy` (`skip` | `queue`, default `skip`), `enabled` (default true), `lastFireAt` and `nextFireAt` (ISO, optional).
- **Scheduler interface**: `id`, `cron` (5-field or `@macro`), `featureSlug`, `jobTitle`, `enabled`, `misfirePolicy`, `lastFiredAtMs` (epoch ms, optional) and `priority` (optional).

**Relationships**: firing a schedule creates QueueJobs that carry `scheduleId`. The two shapes differ in field names (`lastFireAt` versus `lastFiredAtMs`). Both exist in source.

### QueueJob
<!-- evidence: packages/scheduler/src/queue.ts:47-76, packages/scheduler/src/queue.ts:127-146 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

The scheduler's durable queue record, stored as `.lisa/queue/jobs/<id>.json`.

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `title` | string | |
| `featureSlug` | string | |
| `dependsOn` | string[] | job ids that must reach `succeeded` first |
| `priority` | number | higher runs first |
| `seq` | number | monotonic enqueue sequence (FIFO tiebreak) |
| `state` | QueueJobState | |
| `enqueuedAt` | ISO string, optional | |
| `scheduleId` | string, optional | |

**QueueJobState values**: `queued`, `blocked`, `running`, `paused`, `succeeded`, `failed`, `cancelled`.

**State transitions**:

- `queued` ↔ `blocked`, re-derived from dependency status.
- `queued` → `running` on dispatch.
- `running` → `succeeded` or `failed`.
- Any state → `cancelled` through `cancel()`, which leaves gate markers untouched.
- `running` → `queued` on crash recovery. That behavior is FR-045.

A QueueJob is a separate record from the domain Job, and its state names are separate from JobState.

### RetryRecord
<!-- evidence: packages/scheduler/src/queue.ts:78-88 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

A per-idempotency-key retry ledger entry, stored as `.lisa/queue/retries/<encodeURIComponent(key)>.json`. Fields: `idempotencyKey`, `jobId`, `attempts`, `outcome` (`pending` | `succeeded` | `failed`), `result` (optional, opaque) and `lastError` (optional).

**State transitions**:

- `pending` → `succeeded` or `failed`.
- `failed` → `pending` on the next attempt, up to `maxAttempts`.
- On crash recovery, `pending` → `failed` with "interrupted by crash".

### BudgetLedger
<!-- evidence: packages/scheduler/src/budgets.ts:42-56, packages/scheduler/src/budgets.ts:164-176 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->

Per-job usage, stored at `.lisa/features/<slug>/jobs/<jobId>/budget.json`.

**BudgetUsage fields**: `tokens`, `costUsd`, `wallClockMin`, `attempts`.

**Budget dimensions**: `tokens`, `cost`, `wallClock`, `attempts`.

**Relationships**: the ledger is evaluated against the Job's BudgetPolicy. Reaching an active ceiling yields `BUDGET_EXCEEDED`.

### StopRequest
<!-- evidence: packages/scheduler/src/stop.ts:37-59 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

The parsed contents of `.lisa/stop.flag`, a file at the `.lisa/` root that applies to the whole workspace. Fields: `mode` (`clean` | `now`), `requestedAt` (optional) and `by` (optional). A stop exits with code 6 and outcome `stopped`.

### RunLayout and WorkspaceLock
<!-- evidence: packages/cli/src/layout.ts:1-75 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

The resolved paths of one run (`LisaLayout`):

- `workdir`
- `stateDir` = `<workdir>/.lisa`
- `featureSlug`
- `featureDir` = `.lisa/features/<slug>`
- `gatesDir`, `gatesRel`, `stateRel`
- `runId`
- `runDir` = `<featureDir>/runs/<runId>`
- `runLog`
- `eventsPath` = `<runDir>/events.jsonl`
- `lockDir` = `.lisa/lock.d`
- `stopFlag`
- `lastRunConf` = `.lisa/last-run.conf`

**WorkspaceLock**: an atomic `mkdir` of `lock.d`. Its `owner` file records `pid=<n>`. When the recorded owner is dead, the lock is reclaimed. When the owner is alive, the result is `WorkspaceLockError`, which maps to exit 5 (`packages/cli/src/layout.ts:141-180`).

### RunConfig (last-run.conf)
<!-- evidence: packages/cli/src/commands/run.ts:829-872 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

Resolved launch settings, written as `KEY=value` lines. The keys are:

- `WORKDIR`, `SPECS`, `SPEC_FORMAT`, `FEATURE`
- `PROPOSER`, `CRITIC`, `MAX_REJECTS`, `MAX_ITER`, `PROPOSER_TIMEOUT_SEC`
- `BUNDLE_ID`, `SEMANTIC_CONTENT_HASH`, `PROJECTION_HASH`
- `ADAPTER_ID`, `ADAPTER_VERSION`, `PROFILE`, `SNAPSHOT_PATH`
- `VERIFICATION_MODE`

When a verification plan is attached, the file also has `VERIFICATION_PLAN_ID`, `VERIFICATION_PLAN_HASH`, `VERIFICATION_PLAN_PATH` and `TEST_PLAN_PATH`. A failed write is ignored. `lisa resume` reads this file (FR-016).

### LisaEvent (v2 journal record)
<!-- evidence: packages/core/src/events/journal.ts:26-95 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

| Field | Type |
|---|---|
| `id` | ULID |
| `type` | string ≥ 1 char (one of `LISA_EVENT_TYPES`) |
| `version` | int ≥ 0, default 1 |
| `occurredAt` | ISO |
| `jobId` | string ≥ 1 char |
| `taskId` | string, optional |
| `planRevision` | int ≥ 0 |
| `traceId`, `spanId`, `causationId` | string, optional |
| `correlationId` | string ≥ 1 char |
| `idempotencyKey` | string, optional |
| `payload` | unknown |

**Relationships**: a v2 type maps to at most one V1Event name. The full type list is in `contracts/events.md`.

### V1Event (events.jsonl line)
<!-- evidence: packages/core/src/events/journal.ts:100-145 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

The baseline envelope. Fields appear in a fixed order: `ts`, `time`, `event`, then the optional `run_id`, `task` and `backend`, then the payload `key=value` fields. Unset optional fields are omitted, never written as null. `event` is one of `V1_EVENT_NAMES`.

### SpecificationBundleV2
<!-- evidence: packages/core/src/domain/specification-bundle.ts:350-377, packages/persistence/src/specification-bundle-store.ts:67-79 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

An immutable, content-hashed specification.

| Field | Type |
|---|---|
| `id` | ULID |
| `kind` | literal `specification-bundle` |
| `version` | literal 2 |
| `profile` | `delivery` \| `reverse-as-is` \| `change-proposal` \| `method-import` |
| `sourceProfile` | SourceProfile |
| `artifacts` | SpecificationArtifact[] |
| `requirements` | CanonicalRequirement[] |
| `workItems` | SpecificationWorkItem[] |
| `traceLinks` | TraceLink[] |
| `checkpoints` | WorkflowCheckpoint[] |
| `claims` | SpecificationClaim[], default `[]` |
| `transformReport` | BundleTransformReport |
| `extensions` | Extension[], default `[]` |
| `contentHash` | sha256 |

**On-disk layout**: `.lisa/specifications/<bundleId>/bundle.v2.json` and `.lisa/specifications/<bundleId>/bundle.v2.sha256`. Artifact blobs go to `.lisa/specifications/blobs/sha256/<2-hex>/<hex>`. Transforms go to `transforms/`. Files are created with mode 0600 and directories with 0700.

**State transitions**: none. A bundle is write-once. Creating over an existing manifest is refused (FR-036).

### SpecificationArtifact
<!-- evidence: packages/core/src/domain/specification-bundle.ts:118-131 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

Fields (strict):

- `id` (ULID)
- `role`
- `order` (int ≥ 0)
- `mediaType`
- `sourcePath` and `snapshotPath` (absolute paths)
- `bytes`
- `sha256`
- `origin` (`source` | `derived`)
- `derivedFrom` (ULID[], default `[]`)

**Relationships**: an artifact belongs to one SpecificationBundleV2.

### CanonicalRequirement
<!-- evidence: packages/core/src/domain/specification-bundle.ts:162-182 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

Fields (strict):

- `id` (ULID)
- `statement`
- `kind` (`functional` | `constraint` | `nonfunctional`)
- `priority` (`low` | `medium` | `high`, optional)
- `status` (optional)
- `acceptanceCriteria`
- `evidence`
- `sourceReferences`
- `externalIds`

**Relationships**: TraceLinks connect requirements to work items. A VerificationObligation references requirements through `requirementRefs`.

### SpecificationWorkItem
<!-- evidence: packages/core/src/domain/specification-bundle.ts:186-206 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

Fields (strict):

- `id` (ULID)
- `title`
- `objective`
- `acceptanceRefs`
- `dependencies` (ULID[])
- `writeScopes` (absolute paths)
- `requiredCapabilities`
- `risk` (`low` | `medium` | `high`, optional)
- `approvalPolicy` (`none` | `on_high_risk` | `always`, optional)
- `expectedArtifacts` (absolute paths)
- `sourceReferences`

### TraceLink
<!-- evidence: packages/core/src/domain/specification-bundle.ts:212-233 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

Fields (strict):

- `id` (ULID)
- `type`: one of `derives-from`, `satisfies`, `verifies`, `depends-on`, `contradicts`, `refines`, `supersedes`
- `from`
- `to`

### VerificationPlan v1
<!-- evidence: packages/core/src/domain/verification-plan.ts:50-145, packages/verification/src/store.ts:100-111 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

A hash-bound verification plan.

| Field | Type |
|---|---|
| `id` | string |
| `kind` | literal `verification-plan` |
| `version` | literal 1 |
| `source` | `{bundleId: ULID, contentHash: sha256, specPath: absolute}` |
| `project` | `{workdir: absolute, fingerprint: sha256, frameworks: string[]}` |
| `obligations` | VerificationObligation[] (≥ 1) |
| `commands` | VerificationCommand[] |
| `suites` | VerificationSuite[] (≥ 1) |
| `gates` | VerificationGate[] (≥ 1) |
| `assumptions`, `ambiguities`, `unsupportedCapabilities` | string[] |
| `contentHash` | sha256 |

**Sub-records**:

- **VerificationObligation**:
  - identity and refs: `id`, `title`, `phase`, `requirementRefs`, `acceptanceRefs`, `workItemRefs`
  - `level`: `unit`, `contract`, `integration`, `e2e`, `security` or `operator`
  - `kind`: `positive`, `negative`, `property`, `recovery` or `effect-witness`
  - test description: `setup`, `action`, `oracle`, `witnesses`, `negativeCases`
  - `automationStatus`: `planned`, `generated`, `executable`, `passing`, `blocked` or `manual`
- **VerificationCommand**:
  - `id`, `label`
  - `kind`: `test`, `build`, `lint`, `format` or `custom`
  - how it runs: absolute `executable`, `args`, absolute `cwd`, `timeoutSec` ≤ 86400
- **VerificationSuite**: `scope` is `phase`, `cumulative` or `release`. It references obligations and commands.
- **VerificationGate**: `scope` is `phase` or `release`, plus `cumulative` and `required` flags.

**On-disk layout**: `.lisa/verification/<bundleId>/<contentHash>/verification-plan.json`. It is written immutably.

**Relationships**: a plan is bound to exactly one SpecificationBundleV2 through `source.bundleId` and `source.contentHash`.

### DashboardJob
<!-- evidence: packages/dashboard/src/types.ts:3-3, packages/dashboard/src/types.ts:48-75, packages/dashboard/src/server.ts:29-39, packages/dashboard/src/server.ts:83-103 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->

The dashboard's own record of a job. All records are persisted together in `<repo>/.lisa-dashboard/jobs.json` (temp file, then rename; mode 0600).

**Fields**:

- identity and input: `id`, `title`, `objective`, `workdir`, `specPath`
- origin: `kind` (`objective` | `reverse-engineering`), `outputPath`
- lifecycle: `state`, `createdAt`, `updatedAt`
- process: `exitCode`, `pid`, `lastMessage`
- agentctl projection: `controllerRunId`, `kanbanCardId`, `observability`
- bundle: `bundle` (a BundleBinding: `bundleId`, `version`, `profile`, `contentHash`, `semanticContentHash`, `complianceLevel`, artifacts and counts)

**State values**: QUEUED, EXECUTING, REVIEWING, COMPLETED, FAILED, STOPPED.

**State transitions**: when the child process exits (`packages/dashboard/src/server.ts:780-790`):

- exit on SIGTERM or SIGINT → STOPPED
- exit code 0 → COMPLETED
- any other exit → FAILED

This state set is different from the core JobState.

### TrajectoryRecord
<!-- evidence: packages/dashboard/src/trajectory.ts:17-73 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->

One projected line of a run's `events.jsonl`.

**Fields**:

- identity and position:
  - `id` (`r<seq>`)
  - `seq`: the 0-based line index, which is also the paging cursor
- classification:
  - `kind`: `system`, `plan`, `proposer-turn`, `tool`, `critic`, `verdict`, `approval`, `gate`, `integration` or `error`
  - `event`
  - `schema`: `v1` or `v2`
- context: `phase`, `attempt`, `taskId`, `parentId`
- timing: `startedAt`, `endedAt`, `durationMs`, `running`
- cost: `tokens`, `costUsd`, `model`
- display: `title`, `summary`, `truncated`, `result`, `transcript`
- source data: `raw`, `twin`

**Relationships**: records are grouped into TrajectoryResponse pages of at most 500 records (FR-051).

## Assumptions

- Unknown: the `expired` ApprovalStatus is declared, but this reverse run did not trace which code path writes it.
- Unknown: the domain `Schedule` schema and the scheduler `Schedule` interface use different field names. Whether any code converts between them was not traced.
