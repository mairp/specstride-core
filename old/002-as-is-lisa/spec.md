# Feature Specification: Lisa — As-Is Behavior (reverse-engineered at 76adfdc)

**Feature Branch**: `002-as-is-lisa` (label only; no branch was created)

**Created**: 2026-09-28

**Status**: Draft

**Input**: Reverse-engineering request: "Describe the current, observable behavior of the Lisa monorepo at commit 76adfdc, grounded in its source."

This document records what the code at `76adfdcbea7f` does today. It is a description of current behavior, not a target design. Each requirement reads "MUST" because the source enforces that behavior now. It contains no remediation or enhancement proposals. Where documentation and source disagree, the source is taken as authoritative and the disagreement is recorded in `contradicts=`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Run a specification through the gated proposer → critic loop (Priority: P1)

An operator launches `lisa run` against a specification. For each phase in turn, the authoring role writes evidence and an independent critic judges it. A phase advances only on an approval that is bound to a nonce and that also passes the phase's verification. A run that exceeds its rejection limit halts with a distinct exit code.

**Why this priority**: The gated loop is the product's core. Every other capability (resume, approvals, scheduling, dashboard) consumes or observes the state this loop produces.

**Independent Test**: Launch a run on a single-phase spec with a stub proposer that writes evidence, and a stub critic that replies once with the correct nonce and once without it. Observe that only the nonce-bound approval creates the phase's approval marker.

**Acceptance Scenarios**:

1. **Given** a phase whose evidence file exists, **When** the critic replies `VERDICT <nonce>: APPROVED` with the review's nonce and phase verification passes, **Then** the phase's approval marker is written and the loop advances to the next phase.
2. **Given** a critic reply that has no verdict line, a wrong nonce, or two verdict lines, **When** the reply is parsed, **Then** the result is MALFORMED and the phase is treated as rejected.
3. **Given** a phase that has been rejected `maxRejects` times, **When** another rejection arrives, **Then** the run halts with stop reason `max_rejects` and exit code 2.

---

### User Story 2 - Resume, stop and inspect a run from on-disk state (Priority: P2)

An operator can stop a run, see its status and resume it later. Lisa derives the resume position from the approval markers on disk, not from a stored counter.

**Why this priority**: Durable resumability is what makes long, multi-phase runs practical. It depends on the loop from User Story 1.

**Independent Test**: Create approval markers for phases 1–2 of a three-phase run, then invoke resume. Observe that phase 3 is selected. With all markers present, observe the `all_approved` outcome.

**Acceptance Scenarios**:

1. **Given** phases 1 and 2 have approval markers, **When** the loop starts without `--start-phase`, **Then** it resumes at phase 3.
2. **Given** no saved `last-run.conf`, **When** `lisa resume` is invoked, **Then** it exits with the SPEC code and outcome `nothing_to_resume`.
3. **Given** a `stop.flag` file in the state directory, **When** the stop check runs, **Then** a stop is reported (an empty flag means a clean stop), and the stop exit code is 6.

---

### User Story 3 - Import a Spec Kit project into a hash-bound bundle and plan verification (Priority: P3)

An operator imports a Spec Kit feature directory as an immutable SpecificationBundle v2 with a semantic content hash. From that bundle identity the operator derives a hash-bound VerificationPlan v1 and its markdown projection.

**Why this priority**: Import gives the loop requirement-level traceability. It is a separate, optional entry path next to the tasks-only format.

**Independent Test**: Run `lisa spec import-project <abs dir> --workdir <abs dir> --method speckit --json` on a fixture with one spec.md and one tasks.md. Observe the JSON summary fields. Tamper with the stored manifest and observe a hash-mismatch refusal on read.

**Acceptance Scenarios**:

1. **Given** a relative feature path or a `--method` other than `speckit`, **When** the import runs, **Then** it refuses with the SPEC exit code.
2. **Given** `--require-traceability` and a requirement that no task covers, **When** the project is compiled, **Then** the import fails with a BundleError of code InvalidTrace.
3. **Given** a stored bundle whose recorded hash no longer matches its recomputed semantic hash, **When** it is read, **Then** the store throws HashMismatch.

---

### User Story 4 - Decide durable human approval requests (Priority: P4)

An approver approves or rejects a pending request, either from the CLI or through the server webhook. A decision against a stale target hash is refused and makes no change.

**Why this priority**: Human approvals gate escalations, but most runs complete without one.

**Independent Test**: Create a pending approval request with a target hash, then submit a decision carrying a different hash. Observe outcome `refused` with exit code 2 and an unchanged request file.

**Acceptance Scenarios**:

1. **Given** a pending request, **When** a decision is submitted with a different `targetHash`, **Then** it is refused as `stale_hash` and the request file is not rewritten.
2. **Given** a decision already applied with the same decision id, **When** it is replayed, **Then** the store treats it as idempotent.

---

### User Story 5 - Schedule jobs with parallel-safety, budgets and cron (Priority: P5)

The scheduler library queues jobs by priority and dependency, admits parallel tasks only when every safety gate passes, enforces budget ceilings, and fires cron schedules according to a misfire policy.

**Why this priority**: This is platform infrastructure around the core loop. Where it is wired in production is partly unknown (see Assumptions).

**Independent Test**: Enqueue three jobs with different priorities and one dependency, then call next-job selection. Observe the priority-then-FIFO order and that the dependent job is held back until its dependency succeeds.

**Acceptance Scenarios**:

1. **Given** two queued jobs with equal priority, **When** the next job is selected, **Then** the one enqueued earlier is chosen.
2. **Given** a token ceiling of 100 and 100 tokens used, **When** budgets are evaluated, **Then** the result is not ok and the next state is `BUDGET_EXCEEDED`.
3. **Given** jobs left `running` by a crash, **When** queue recovery runs, **Then** they are demoted to `queued`.

---

### User Story 6 - Observe runs through the HTTP API, hooks and dashboard trajectory (Priority: P6)

An integrator calls the authenticated JSON-RPC API. Lifecycle hooks can block at blockable points. The dashboard pages a run's trajectory backwards through a cursor.

**Why this priority**: Observability surfaces are read-mostly and do not change gate outcomes.

**Independent Test**: Call `GET /healthz` without a token (200 expected), then call `POST /rpc` without a token (401 expected).

**Acceptance Scenarios**:

1. **Given** a request without a valid bearer token, **When** it hits an authenticated route, **Then** the API responds 401.
2. **Given** a trajectory page request with `limit` 10000, **When** it is served, **Then** at most 500 records are returned.
3. **Given** a hook at a blockable point that exits 2, **When** it runs, **Then** the action is blocked.

---

### Edge Cases

- A critic transport error other than a configuration error is recorded as a MALFORMED rejection and never as an approval. A critic configuration error halts the run (FR-011).
- When a critic ensemble requires concurrence, a second judge that reuses the primary nonce, or that returns anything other than APPROVED, turns the approval into REJECTED (FR-022).
- When all phases are already approved, the run ends immediately with outcome `all_approved` and exit code 0 (FR-008).
- The CLI recognizes some verbs that this build does not implement (for example `watch` and `tail`). These exit 1 with outcome `verb_not_implemented`, which is distinct from an unknown verb (FR-004).
- A grounding snapshot that hits its file cap marks the remaining paths as NOT-SHOWN, not as missing (FR-021).
- A budget ceiling of 0 or a non-finite ceiling is treated as off (FR-041).
- An empty or unparseable `stop.flag` is read as a clean stop (FR-046).
- Journal sink failures are swallowed, so emitting an event never throws inside the loop (FR-023).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The CLI MUST return exit code 1 with outcome `unknown` and the message `unknown subcommand: <verb>` for any first argument that is not a recognized verb, help token or leading flag.
<!-- evidence: packages/cli/src/index.ts:254-255 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-002**: The CLI MUST print usage and exit 0 when argv is empty or its first argument is `-h`, `--help` or `help`.
<!-- evidence: packages/cli/src/index.ts:82-85 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-003**: The CLI MUST treat the verbs `run` and `start`, and any first argument that begins with `-`, as a run launch.
<!-- evidence: packages/cli/src/index.ts:87-112 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-004**: The CLI MUST answer recognized but unimplemented inspection verbs with exit code 1 and outcome `verb_not_implemented`.
<!-- evidence: packages/cli/src/index.ts:246-252 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-005**: The `lisa` executable MUST exit with the router's exit code, and MUST exit 70 on an uncaught internal error.
<!-- evidence: packages/cli/bin/lisa.mjs:11-21 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-006**: A run launch MUST default to these settings, each overridable through `LISA_*` or legacy `WIGGUM_*` environment variables: proposer `claude-agent-sdk/claude-opus-4.8`; critic `anthropic/claude-opus-4.8`; max-rejects 3; max-iter 30; proposer timeout 1800 s; verification `off`.
<!-- evidence: packages/cli/src/commands/run.ts:124-138 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-007**: The run flag parser MUST reject unknown flags, stray positional arguments and flags that have no value, rather than ignoring them.
<!-- evidence: packages/cli/src/commands/run.ts:202-208 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-008**: The phase loop MUST resume at `--start-phase` when it is given. Otherwise it resumes at the first phase that has no approval marker. When every phase is approved, it ends with outcome `all_approved`.
<!-- evidence: packages/core/src/engine/phase-loop.ts:309-340, packages/core/src/gates/store.ts:156-161 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-009**: A critic APPROVED verdict MUST advance a phase only when the phase's separate verification also passes. When verification fails, the approval becomes a rejection.
<!-- evidence: packages/core/src/engine/phase-loop.ts:386-407 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-010**: After a REJECTED or MALFORMED verdict, the loop MUST halt with `max_rejects` once the attempt count reaches `maxRejects`. Otherwise it MUST archive the rejected attempt's evidence and retry.
<!-- evidence: packages/core/src/engine/phase-loop.ts:440-451 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-011**: A critic transport error other than a configuration error MUST be recorded as a fail-safe MALFORMED rejection. A critic configuration error MUST halt the run.
<!-- evidence: packages/core/src/engine/phase-loop.ts:653-667 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-012**: On approval, the loop MUST: write the `GATE<N>-APPROVED` marker; archive leftover feedback; emit completion and approval events; optionally create a git checkpoint.
<!-- evidence: packages/core/src/engine/phase-loop.ts:831-843 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-013**: Gate evidence MUST be written atomically: write a `.tmp` sibling, fsync it, then rename it. The approval marker MUST be an empty file whose existence is the signal.
<!-- evidence: packages/core/src/gates/store.ts:97-129 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-014**: Archiving a rejected attempt MUST move its evidence into `attempts/phase<N>/attempt<M>/`, and MUST copy the feedback and the newest verdict transcript alongside it.
<!-- evidence: packages/core/src/gates/store.ts:179-196 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-015**: The run lifecycle MUST map stop reasons onto a fixed exit-code vocabulary: OK=0, INTERNAL=1, REJECTS=2, SPEC=3, BUDGET=4, LOCK=5, STOP=6.
<!-- evidence: packages/core/src/engine/lifecycle.ts:24-68 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-016**: `lisa resume` MUST refuse with SPEC and outcome `nothing_to_resume` when no run configuration was saved, with LOCK and outcome `already_running` when a live owner holds the lock, and with SPEC when the recorded spec hash has changed. Otherwise it MUST relaunch with the saved flags, applying operator overrides last.
<!-- evidence: packages/cli/src/commands/resume.ts:140-198 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->
- **FR-017**: `lisa status` MUST report RUNNING, with the owner when one is known, whenever the lock directory exists. It MUST report "no run recorded yet" when there is no events stream.
<!-- evidence: packages/cli/src/commands/status.ts:120-132 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->
- **FR-018**: The critic MUST generate a fresh 16-hex-character nonce for each review.
<!-- evidence: packages/core/src/critic/verdict.ts:40-42 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-019**: The verdict parser MUST accept exactly one line of the form `VERDICT <exact nonce>: APPROVED|REJECTED`. Zero strict matches, or more than one, MUST yield MALFORMED. Only APPROVED counts as approval.
<!-- evidence: packages/core/src/critic/verdict.ts:56-81 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **FR-020**: Feedback for a MALFORMED verdict MUST state that the phase is treated as REJECTED by fail-safe.
<!-- evidence: packages/core/src/critic/verdict.ts:288-308 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-021**: The grounding snapshot MUST emit a presence line for each cited path, up to its file cap. Beyond the cap, paths MUST be marked NOT-SHOWN, not missing.
<!-- evidence: packages/core/src/critic/grounding.ts:379-403 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->
- **FR-022**: A critic ensemble MUST require second-judge concurrence for approvals from the configured attempt onward (default 2). A missing secondary judge, a reused nonce or a non-APPROVED second verdict MUST yield REJECTED.
<!-- evidence: packages/core/src/critic/ensemble.ts:146-208 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->
- **FR-023**: Event emission MUST be best-effort: it writes the v2 journal and, for mapped types, a v1 `events.jsonl` line. Sink errors are swallowed.
<!-- evidence: packages/core/src/events/journal.ts:345-366 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-024**: The delivery dispatcher MUST key each delivery by adapter id plus the event's idempotency key, and MUST convert adapter exceptions into `{ ok: false }` results.
<!-- evidence: packages/core/src/events/delivery.ts:171-256 | kind=observed | confidence=0.80 | contradicts=none | validation=verified -->
- **FR-025**: An approval decision MUST be refused without mutation in any of these cases: the request is not pending; the response is not one of the declared allowed responses; the target hash differs from the request's frozen hash.
<!-- evidence: packages/core/src/domain/approvals.ts:147-163 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-026**: The approval store MUST treat a replayed decision id as idempotent. For other decisions it MUST atomically rewrite `approvals/<requestId>.json`. It MUST derive pending requests by scanning that directory.
<!-- evidence: packages/core/src/domain/approvals.ts:265-311 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->
- **FR-027**: The approvals CLI MUST print a refused decision and return exit code 2 with outcome `refused`.
<!-- evidence: packages/cli/src/commands/approvals.ts:154-158 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-028**: The default spec registry MUST register five format adapters: `native`, `wiggum`, `speckit-tasks`, `openspec` and `chat`.
<!-- evidence: packages/specs/src/registry.ts:877-884 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-029**: Spec format detection MUST try these sources in order: an explicit override; `LISA_SPEC_FORMAT`; `WIGGUM_SPEC_FORMAT`; content-based detection, in which a file named `tasks.md` is always `speckit-tasks`.
<!-- evidence: packages/specs/src/resolve.ts:51-70 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-030**: `lisa spec import-project` MUST refuse with the SPEC exit code when: either path is missing; either path is non-absolute; `--method` is anything other than `speckit`.
<!-- evidence: packages/cli/src/commands/spec-import-project.ts:86-113 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-031**: Project import MUST select these artifacts by role: the known top-level Spec Kit files; text files under `contracts/` and `checklists/`; the workdir's `.specify/memory/constitution.md`.
<!-- evidence: packages/cli/src/commands/spec-import-project.ts:281-314 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->
- **FR-032**: Project compilation MUST require exactly one spec artifact and exactly one tasks artifact. Missing roles MUST fail as IncompatibleProfile, and duplicated roles as AmbiguousEntrypoint.
<!-- evidence: packages/specs/src/speckit/project.ts:467-500 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-033**: With `--require-traceability`, compilation MUST fail with InvalidTrace if any of the following exist: zero requirements; uncovered requirements; unlinked work items; unknown references; duplicate ids; contradictions.
<!-- evidence: packages/specs/src/speckit/project.ts:804-815 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-034**: A successful import MUST return a summary, as JSON with `--json`, with outcome `imported_project`. Fields: bundle id, version, profile, content hash and manifest path; entity counts and coverage percent; the complete uncovered-requirement and unlinked-work-item id lists. The summary lists the full id lists; it applies no size bound.
<!-- evidence: packages/cli/src/commands/spec-import-project.ts:203-240 | kind=observed | confidence=0.75 | contradicts=README.md:108-111 | validation=verified -->
- **FR-035**: The import MUST snapshot every artifact against its compiled sha256, then recompute the bundle's semantic content hash before creating the bundle.
<!-- evidence: packages/cli/src/commands/spec-import-project.ts:165-201 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->
- **FR-036**: The bundle store MUST refuse to create a bundle whose content hash differs from its recomputed semantic hash. It MUST refuse to overwrite an existing manifest. On read, it MUST throw HashMismatch unless the recorded, manifest and recomputed hashes all agree.
<!-- evidence: packages/persistence/src/specification-bundle-store.ts:464-502, packages/persistence/src/specification-bundle-store.ts:546-589 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-037**: Verification planning MUST bind a VerificationPlan v1 to the bundle id and bundle content hash, and MUST hash the plan itself. The store MUST re-verify that hash, write it immutably under `.lisa/verification/<bundleId>/<contentHash>/`, and refuse differing bytes for an existing plan.
<!-- evidence: packages/verification/src/planner.ts:309-340, packages/verification/src/store.ts:84-130 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->
- **FR-038**: The rendered TEST_PLAN markdown MUST start with a content-hash comment and a Provenance section that names the plan and source hashes.
<!-- evidence: packages/verification/src/render.ts:30-53 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->
- **FR-039**: The scheduler's safety predicate MUST allow a parallel task only when all five of its gates pass, and MUST record each gate's verdict. The five gates are: dependencies; write scope; resource class; budget; human block.
<!-- evidence: packages/scheduler/src/safety.ts:158-176, packages/scheduler/src/safety.ts:121-137 | kind=observed | confidence=0.75 | contradicts=none | validation=verified -->
- **FR-040**: Batch admission MUST admit candidates greedily in caller order, and MUST deny candidates once `maxParallel` tasks are running.
<!-- evidence: packages/scheduler/src/safety.ts:194-214 | kind=observed | confidence=0.75 | contradicts=none | validation=verified -->
- **FR-041**: Budget evaluation MUST check four ceilings: tokens, cost, wall clock and attempts. A ceiling that is 0 or non-finite is off. Reaching any active ceiling MUST yield `BUDGET_EXCEEDED`.
<!-- evidence: packages/scheduler/src/budgets.ts:87-127 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-042**: The per-job budget ledger MUST be persisted atomically to `budget.json`. An unreadable ledger MUST load as zero usage.
<!-- evidence: packages/scheduler/src/budgets.ts:186-227 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->
- **FR-043**: The job queue MUST select among queued jobs whose dependencies have all succeeded. It MUST order them by priority descending, then by enqueue sequence ascending.
<!-- evidence: packages/scheduler/src/queue.ts:249-262 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-044**: Starting an attempt MUST report a duplicate, without re-running, when its idempotency key already succeeded. It MUST report exhaustion when `maxAttempts` would be exceeded.
<!-- evidence: packages/scheduler/src/queue.ts:287-312 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->
- **FR-045**: Queue crash recovery MUST: demote `running` jobs to `queued`; mark pending retry records as failed with "interrupted by crash"; re-derive blocked and queued states.
<!-- evidence: packages/scheduler/src/queue.ts:343-365 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->
- **FR-046**: A stop MUST be requested by atomically writing a `stop.flag` file, and detected by the file's existence. An empty or unparseable flag MUST mean a clean stop.
<!-- evidence: packages/scheduler/src/stop.ts:102-123 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-047**: Cron evaluation MUST: fire nothing for disabled schedules; on first evaluation, fire only the latest instant within the last 60 s; handle missed instants according to the misfire policy: `skip` collapses them to the last one, and `queue` fires each one.
<!-- evidence: packages/scheduler/src/cron.ts:191-210 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->
- **FR-048**: Worktree creation MUST refuse non-git workspaces, MUST remove a stale worktree for the same job and task, and MUST run `git worktree add -B` from a base ref that defaults to HEAD.
<!-- evidence: packages/scheduler/src/worktrees.ts:112-130 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->
- **FR-049**: The API server MUST: answer 401 on authenticated routes that lack a valid bearer token; expose an unauthenticated `GET /healthz`; dispatch JSON-RPC batches on `POST /rpc`; answer 204 for notifications.
<!-- evidence: packages/server/src/api.ts:140-174 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->
- **FR-050**: The approvals webhook MUST route responses matching reject/rejected/deny/denied/stop/discard (case-insensitive) to the reject method. All other responses MUST go to the approve method.
<!-- evidence: packages/server/src/api.ts:229-232 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **FR-051**: Trajectory paging MUST clamp `limit` to [1, 500], with a default of 50. It MUST return records strictly before the cursor, and MUST return a next cursor only while earlier records remain.
<!-- evidence: packages/dashboard/src/trajectory.ts:578-585 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->
- **FR-052**: At a blockable hook point, the runner MUST block when a hook exits 2. It MUST also block, fail-closed, on any other non-clean outcome unless the hook's failure policy is `open`. At non-blockable points, hooks MUST NOT block.
<!-- evidence: packages/hooks/src/runner.ts:282-310 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->
- **FR-053**: The SQLite index MUST open in WAL mode, and MUST be rebuildable purely from on-disk files inside one transaction.
<!-- evidence: packages/persistence/src/index-db.ts:77-180 | kind=observed | confidence=0.80 | contradicts=none | validation=verified -->

### Key Entities *(include if feature involves data)*

- **Run** (data-model: RunLayout and WorkspaceLock, RunConfig): One launch of the loop over a resolved spec. Its settings are the launch flags, it is identified by its state directory, and it holds a lock while running.
- **Phase / Gate** (data-model: Phase, Attempt, GateState): A numbered unit of work. Its state on disk is an evidence file, a feedback file, an approval marker and archived attempts.
- **Verdict** (data-model: CriticVerdict): The critic's nonce-bound result: APPROVED, REJECTED or MALFORMED.
- **Approval Request / Decision** (data-model: ApprovalRequest, ApprovalDecision): A durable JSON record with a frozen target hash, allowed responses and a status. A decision advances the status.
- **SpecificationBundle v2** (data-model: SpecificationBundleV2): An immutable, content-hashed set of role-tagged artifacts with requirements, work items and trace links.
- **VerificationPlan v1** (data-model: VerificationPlan v1): A hash-bound plan derived from a bundle, with coverage obligations and a markdown projection.
- **Job** (data-model: Job, QueueJob, RetryRecord): A queued unit of scheduler work with a priority, dependencies, an idempotency key and a `maxAttempts` limit. Its attempts are scheduler attempts, not the phase Attempt above.
- **Budget Ledger** (data-model: BudgetLedger): Per-job usage against four ceilings: tokens, cost, wall clock and attempts.
- **Event** (data-model: LisaEvent, V1Event): A journal entry written to the v2 journal and, when mapped, as a v1 `events.jsonl` line.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of critic replies without exactly one line bearing the exact nonce are recorded as non-approvals.
<!-- evidence: packages/core/src/critic/verdict.ts:56-81 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- **SC-002**: A resumed run starts at the first unapproved phase in 100% of cases where `--start-phase` is not given, with no stored counter consulted.
<!-- evidence: packages/core/src/gates/store.ts:156-161 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **SC-003**: No reader ever observes a partially written evidence file, because every evidence write lands through a single rename.
<!-- evidence: packages/core/src/gates/store.ts:97-117 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **SC-004**: Every run termination maps to one of exactly seven exit codes (0–6).
<!-- evidence: packages/core/src/engine/lifecycle.ts:24-68 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **SC-005**: 100% of stored bundles whose recorded, manifest or recomputed hashes disagree are refused on read.
<!-- evidence: packages/persistence/src/specification-bundle-store.ts:546-589 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **SC-006**: 100% of approval decisions against a stale target hash are refused, and the request is left unchanged.
<!-- evidence: packages/core/src/domain/approvals.ts:147-163 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- **SC-007**: A single trajectory page never contains more than 500 records.
<!-- evidence: packages/dashboard/src/trajectory.ts:578-585 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->

## Assumptions

These are explicit unknowns: the source at 76adfdc does not settle them. They are recorded as unverified and are not current-behavior claims.

- Unknown: no non-test caller of the scheduler's batch admission and safety predicate was found. Whether the production scheduler loop applies FR-039 and FR-040 is unverified.
<!-- evidence: packages/scheduler/src/safety.ts:194-214 | kind=inferred | confidence=0.40 | contradicts=none | validation=unverified -->
- Unknown: the README calls the event journal "CloudEvents-compatible", but the event schema defines no `specversion` or `source` fields. Actual CloudEvents conformance is unverified.
<!-- evidence: packages/core/src/events/journal.ts:26-40 | kind=inferred | confidence=0.40 | contradicts=README.md:6-6 | validation=unverified -->
- Unknown: `lisa status` reports RUNNING whenever the lock directory exists, whereas resume checks for a live owner. How status behaves with a stale lock left by a crashed process is unverified.
<!-- evidence: packages/cli/src/commands/status.ts:120-132 | kind=inferred | confidence=0.40 | contradicts=none | validation=unverified -->
- Unknown: `lisa serve --port` fills the API's token table from `LISA_SERVER_TOKENS` (see contracts/rpc-http-api.md). Whether any other production host constructs the API server with its own token table is unverified.
<!-- evidence: packages/cli/src/commands/serve.ts:135-170 | kind=inferred | confidence=0.60 | contradicts=none | validation=unverified -->
- Unknown: two canonicalizers exist, and whether they always produce the same semantic content hash is unverified. The CLI's `semanticContentHashFor` and the persistence store's hash may canonicalize keys differently.
<!-- evidence: packages/cli/src/commands/spec-import-project.ts:165-201 | kind=inferred | confidence=0.40 | contradicts=none | validation=unverified -->
- Scope: this specification covers runtime behavior only. The telemetry Docker stack, the CI workflow and the wiki are out of scope, and nothing here was executed.
