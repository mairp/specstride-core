---

description: "Task list template for feature implementation"
---
<!-- specstride-reverse: tasks=done -->

# Tasks: Lisa — As-Is Behavior (reverse-engineered at 76adfdc)

**Input**: Design documents from `old/002-as-is-lisa/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The repository already has colocated `*.test.ts` files next to the source. The tasks below name them where the evidence shows them. This is an as-is baseline, so every task is ticked `[x]` because the code it describes exists at commit `76adfdc`. The list records existing work and proposes no new work.

**Organization**: Tasks are grouped by user story (spec.md, P1–P6) so each story can be tested on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US6)
- Each description names the exact `lisa-76adfdc`-relative file path

## Path Conventions

- pnpm monorepo: 19 workspace packages under `packages/*` (`pnpm-workspace.yaml`), each with `src/` and colocated `*.test.ts` files.
- Paths follow the structure recorded in `old/002-as-is-lisa/plan.md`.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure (already present)

- [x] T001 Workspace root declares Node `>=22.8.0`, pnpm `>=9` and TypeScript `^5.7.2` in package.json, with the `packages/*` glob in pnpm-workspace.yaml
- [x] T002 [P] Strict ES2022 / NodeNext compiler settings shared by all packages in tsconfig.base.json
- [x] T003 [P] Build/test/lint CI workflow on Node 22 in .github/workflows/ci.yml
- [x] T004 [P] Mergify merge queue configuration in .mergify.yml

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that every user story depends on (already present)

**⚠️ CRITICAL**: The user stories below all consume these modules

- [x] T005 `lisa` executable propagates the router exit code and exits 70 on an uncaught internal error in packages/cli/bin/lisa.mjs (FR-005)
- [x] T006 CLI router prints usage for empty argv/`-h`/`--help`/`help`, treats `run`/`start`/leading-flag argv as a run launch, answers unknown verbs with `unknown subcommand` and unimplemented verbs with `verb_not_implemented` in packages/cli/src/index.ts (FR-001, FR-002, FR-003, FR-004)
- [x] T007 [P] Workspace state layout under `.lisa/` including the `lock.d/` workspace lock in packages/cli/src/layout.ts
- [x] T008 [P] Fixed stop-reason → exit-code vocabulary OK=0 … STOP=6 in packages/core/src/engine/lifecycle.ts (FR-015)
- [x] T009 [P] Best-effort event emission to the v2 journal plus mapped v1 `events.jsonl` lines, swallowing sink errors, in packages/core/src/events/journal.ts (FR-023)
- [x] T010 [P] Delivery dispatcher keyed by adapter id plus idempotency key, converting adapter exceptions into `{ ok: false }`, in packages/core/src/events/delivery.ts (FR-024)
- [x] T011 [P] SQLite index opened in WAL mode and rebuildable from on-disk files in one transaction in packages/persistence/src/index-db.ts (FR-053)
- [x] T012 [P] Default spec registry with the five adapters `native`, `wiggum`, `speckit-tasks`, `openspec`, `chat` in packages/specs/src/registry.ts (FR-028)
- [x] T013 [P] Spec format resolution order override → `LISA_SPEC_FORMAT` → `WIGGUM_SPEC_FORMAT` → content detection in packages/specs/src/resolve.ts (FR-029)

**Checkpoint**: Foundation present — every user story below builds on it

---

## Phase 3: User Story 1 - Run a specification through the gated proposer → critic loop (Priority: P1) 🎯 MVP

**Goal**: A phase advances only on a nonce-bound critic approval that also passes phase verification.

**Independent Test**: Single-phase spec with a stub proposer and a stub critic; only the nonce-bound approval creates the `GATE<N>-APPROVED` marker.

### Tests for User Story 1

- [x] T014 [P] [US1] Phase-loop behavior tests in packages/core/src/engine/phase-loop.test.ts
- [x] T015 [P] [US1] Critic and verdict tests in packages/core/src/critic/critic.test.ts
- [x] T016 [P] [US1] Ensemble concurrence tests in packages/core/src/critic/ensemble.test.ts
- [x] T017 [P] [US1] Gate store tests in packages/core/src/gates/store.test.ts

### Implementation for User Story 1

- [x] T018 [P] [US1] Run-launch defaults (proposer, critic, max-rejects 3, max-iter 30, timeout 1800 s, verification off) with `LISA_*`/`WIGGUM_*` overrides, and a strict flag parser that rejects unknown flags, stray positionals and valueless flags, in packages/cli/src/commands/run.ts (FR-006, FR-007)
- [x] T019 [P] [US1] Atomic gate evidence write (tmp, fsync, rename), empty `GATE<N>-APPROVED` marker, and rejected-attempt archiving into `attempts/phase<N>/attempt<M>/` in packages/core/src/gates/store.ts (FR-013, FR-014)
- [x] T020 [P] [US1] Fresh 16-hex nonce per review, strict single `VERDICT <nonce>: APPROVED|REJECTED` parsing with MALFORMED otherwise, and fail-safe MALFORMED feedback in packages/core/src/critic/verdict.ts (FR-018, FR-019, FR-020)
- [x] T021 [P] [US1] Grounding snapshot presence lines per cited path with NOT-SHOWN beyond the file cap in packages/core/src/critic/grounding.ts (FR-021)
- [x] T022 [P] [US1] Critic ensemble requiring second-judge concurrence from the configured attempt onward in packages/core/src/critic/ensemble.ts (FR-022)
- [x] T023 [US1] Phase loop: resume position, verification-gated approval, `max_rejects` halt and archive-and-retry, fail-safe MALFORMED on transport errors with halt on configuration errors, and approval side effects (marker, feedback archive, events, optional git checkpoint) in packages/core/src/engine/phase-loop.ts (FR-008, FR-009, FR-010, FR-011, FR-012) (depends on T019–T022)

**Checkpoint**: The gated loop is functional and testable on its own

---

## Phase 4: User Story 2 - Resume, stop and inspect a run from on-disk state (Priority: P2)

**Goal**: Stop, inspect and resume a run from approval markers and saved configuration on disk.

**Independent Test**: With markers for phases 1–2 of a three-phase run, resume selects phase 3; with all markers present the outcome is `all_approved`.

### Tests for User Story 2

- [x] T024 [P] [US2] Resume command tests in packages/cli/src/commands/resume.test.ts
- [x] T025 [P] [US2] Status command tests in packages/cli/src/commands/status.test.ts
- [x] T026 [P] [US2] Stop-flag tests in packages/scheduler/src/stop.test.ts

### Implementation for User Story 2

- [x] T027 [P] [US2] `lisa resume` refusals `nothing_to_resume` (SPEC), `already_running` (LOCK) and changed spec hash (SPEC), otherwise relaunch with saved flags and operator overrides last, in packages/cli/src/commands/resume.ts (FR-016)
- [x] T028 [P] [US2] `lisa status` reporting RUNNING with owner while the lock directory exists, and "no run recorded yet" without an events stream, in packages/cli/src/commands/status.ts (FR-017)
- [x] T029 [P] [US2] Atomic `stop.flag` request and existence-based detection, where an empty or unparseable flag means a clean stop, in packages/scheduler/src/stop.ts (FR-046)

**Checkpoint**: User Stories 1 and 2 both work on their own

---

## Phase 5: User Story 3 - Import a Spec Kit project into a hash-bound bundle and plan verification (Priority: P3)

**Goal**: Import a Spec Kit feature directory as an immutable, content-hashed SpecificationBundle v2 and derive a hash-bound VerificationPlan v1.

**Independent Test**: `lisa spec import-project <abs dir> --workdir <abs dir> --method speckit --json` on a one-spec/one-tasks fixture; tampering with the stored manifest yields HashMismatch on read.

### Tests for User Story 3

- [x] T030 [P] [US3] Import command tests in packages/cli/src/commands/spec-import-project.test.ts
- [x] T031 [P] [US3] Project compilation tests in packages/specs/src/speckit/project.test.ts
- [x] T032 [P] [US3] Bundle store tests in packages/persistence/src/specification-bundle-store.test.ts
- [x] T033 [P] [US3] Verification planner, store and render tests in packages/verification/src/verification.test.ts

### Implementation for User Story 3

- [x] T034 [P] [US3] Project compilation requiring exactly one spec and one tasks artifact (IncompatibleProfile / AmbiguousEntrypoint) and `--require-traceability` InvalidTrace checks in packages/specs/src/speckit/project.ts (FR-032, FR-033)
- [x] T035 [P] [US3] Bundle store refusing hash-mismatched creates and manifest overwrites, and throwing HashMismatch on read unless all three hashes agree, in packages/persistence/src/specification-bundle-store.ts (FR-036)
- [x] T036 [P] [US3] VerificationPlan v1 bound to bundle id and content hash, with the plan self-hash, in packages/verification/src/planner.ts (FR-037)
- [x] T037 [P] [US3] Immutable plan storage under `.lisa/verification/<bundleId>/<contentHash>/` with hash re-verification and refusal of differing bytes in packages/verification/src/store.ts (FR-037)
- [x] T038 [P] [US3] TEST_PLAN markdown starting with a content-hash comment and a Provenance section in packages/verification/src/render.ts (FR-038)
- [x] T039 [US3] `lisa spec import-project` argument refusals, role-based artifact selection, sha256 snapshot and semantic hash recomputation before bundle creation, and the `imported_project` JSON summary in packages/cli/src/commands/spec-import-project.ts (FR-030, FR-031, FR-034, FR-035) (depends on T034, T035)

**Checkpoint**: Import and verification planning work on their own

---

## Phase 6: User Story 4 - Decide durable human approval requests (Priority: P4)

**Goal**: Approve or reject pending requests from the CLI or the webhook; stale-hash decisions are refused without mutation.

**Independent Test**: A decision carrying a different target hash is refused with exit code 2 and the request file is unchanged.

### Tests for User Story 4

- [x] T040 [P] [US4] Approval domain tests in packages/core/src/domain/approvals.test.ts
- [x] T041 [P] [US4] Approvals CLI tests in packages/cli/src/commands/approvals.test.ts

### Implementation for User Story 4

- [x] T042 [US4] Decision refusal (not pending, disallowed response, stale target hash), idempotent replay by decision id, atomic `approvals/<requestId>.json` rewrite and pending scan in packages/core/src/domain/approvals.ts (FR-025, FR-026)
- [x] T043 [US4] Approvals CLI printing a refused decision with exit code 2 and outcome `refused` in packages/cli/src/commands/approvals.ts (FR-027) (depends on T042)
- [x] T044 [US4] Approvals webhook routing reject/rejected/deny/denied/stop/discard (case-insensitive) to reject and everything else to approve in packages/server/src/api.ts (FR-050) (depends on T042)

**Checkpoint**: Approvals work from both the CLI and the webhook

---

## Phase 7: User Story 5 - Schedule jobs with parallel-safety, budgets and cron (Priority: P5)

**Goal**: Queue jobs by priority and dependency, admit parallel tasks only through the five safety gates, enforce budgets and fire cron schedules.

**Independent Test**: Three jobs with different priorities and one dependency; next-job selection follows priority then FIFO and holds the dependent job back.

### Tests for User Story 5

- [x] T045 [P] [US5] Safety predicate tests in packages/scheduler/src/safety.test.ts
- [x] T046 [P] [US5] Budget tests in packages/scheduler/src/budgets.test.ts
- [x] T047 [P] [US5] Queue tests in packages/scheduler/src/queue.test.ts
- [x] T048 [P] [US5] Cron tests in packages/scheduler/src/cron.test.ts
- [x] T049 [P] [US5] Worktree tests in packages/scheduler/src/worktrees.test.ts

### Implementation for User Story 5

- [x] T050 [P] [US5] Five-gate parallel safety predicate with per-gate verdicts and greedy batch admission capped at `maxParallel` in packages/scheduler/src/safety.ts (FR-039, FR-040)
- [x] T051 [P] [US5] Four budget ceilings (0/non-finite = off) yielding `BUDGET_EXCEEDED`, with an atomically persisted `budget.json` ledger that loads as zero when unreadable, in packages/scheduler/src/budgets.ts (FR-041, FR-042)
- [x] T052 [P] [US5] Priority-desc / sequence-asc selection over dependency-satisfied jobs, idempotent duplicate and `maxAttempts` exhaustion on attempt start, and crash recovery in packages/scheduler/src/queue.ts (FR-043, FR-044, FR-045)
- [x] T053 [P] [US5] Cron evaluation with disabled schedules, first-evaluation 60 s window and `skip`/`queue` misfire policies in packages/scheduler/src/cron.ts (FR-047)
- [x] T054 [P] [US5] Git worktree creation refusing non-git workspaces, removing stale worktrees and running `git worktree add -B` from HEAD by default in packages/scheduler/src/worktrees.ts (FR-048)

**Checkpoint**: Scheduler library behavior is testable on its own (its production wiring is an explicit unknown in spec.md Assumptions)

---

## Phase 8: User Story 6 - Observe runs through the HTTP API, hooks and dashboard trajectory (Priority: P6)

**Goal**: Authenticated JSON-RPC API, blocking lifecycle hooks and backwards trajectory paging.

**Independent Test**: `GET /healthz` without a token returns 200; `POST /rpc` without a token returns 401.

### Tests for User Story 6

- [x] T055 [P] [US6] API server tests in packages/server/src/api.test.ts
- [x] T056 [P] [US6] Hook runner tests in packages/hooks/src/runner.test.ts
- [x] T057 [P] [US6] Trajectory paging tests in packages/dashboard/src/trajectory.test.ts

### Implementation for User Story 6

- [x] T058 [P] [US6] Bearer-token 401 on authenticated routes, unauthenticated `GET /healthz`, JSON-RPC batch dispatch on `POST /rpc` and 204 for notifications in packages/server/src/api.ts (FR-049)
- [x] T059 [P] [US6] Hook runner blocking on exit 2 and fail-closed on other non-clean outcomes unless the failure policy is `open`, never blocking at non-blockable points, in packages/hooks/src/runner.ts (FR-052)
- [x] T060 [P] [US6] Trajectory paging clamping `limit` to [1, 500] (default 50), returning records before the cursor and a next cursor only while earlier records remain, in packages/dashboard/src/trajectory.ts (FR-051)

**Checkpoint**: All six user stories are independently observable

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Cross-cutting pieces that span several stories (already present)

- [x] T061 [P] Characterization parity script in the test kit at packages/testkit/src/characterization/verify_parity.py
- [x] T062 [P] Adversarial test-kit checks in packages/testkit/src/adversarial.test.ts
- [x] T063 [P] Lifecycle exit-code tests in packages/core/src/engine/lifecycle.test.ts
- [x] T064 [P] Journal and delivery tests in packages/core/src/events/journal.test.ts and packages/core/src/events/delivery.test.ts
- [x] T065 [P] Index rebuild and crash-recovery tests in packages/persistence/src/index-db.test.ts and packages/persistence/src/crash-recovery.test.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — the workspace manifests and CI files.
- **Foundational (Phase 2)**: Depends on Setup. The CLI router (T005, T006), lifecycle codes (T008), events (T009, T010), index (T011) and spec registry (T012, T013) are consumed by every story.
- **User Stories (Phases 3–8)**: All depend on Foundational.
  - US2 (Phase 4) reads the markers, lock and events that US1 (Phase 3) produces.
  - US3–US6 depend only on Foundational and can be read or extended in any order.
- **Polish (Phase 9)**: Tests that span several stories; depends on the stories they exercise.

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational — no dependency on other stories.
- **User Story 2 (P2)**: Uses the gate store (T019) and phase-loop resume position (T023) from US1.
- **User Story 3 (P3)**: Starts after Foundational (uses the registry, T012) — independent of US1/US2.
- **User Story 4 (P4)**: Starts after Foundational; its webhook (T044) shares packages/server/src/api.ts with US6's T058.
- **User Story 5 (P5)**: Starts after Foundational; its stop flag is also used by US2 (T029).
- **User Story 6 (P6)**: Starts after Foundational; reads the journal written by T009.

### Within Each User Story

- The colocated tests sit next to the modules they exercise.
- Leaf modules (gate store, verdict, grounding, ensemble) before the phase loop (T023).
- Compiler and bundle store (T034, T035) before the import command (T039).
- Approval domain (T042) before the CLI and webhook surfaces (T043, T044).

### Parallel Opportunities

- T002–T004 in Setup touch different files and can run in parallel.
- T007–T013 in Foundational touch different files and can run in parallel.
- Within each story, the `[P]` tasks touch distinct files.
- US3, US5 and US6 are independent of each other once Foundational is present.

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Phase-loop behavior tests in packages/core/src/engine/phase-loop.test.ts"
Task: "Critic and verdict tests in packages/core/src/critic/critic.test.ts"
Task: "Gate store tests in packages/core/src/gates/store.test.ts"

# Launch the leaf modules of User Story 1 together:
Task: "Atomic gate evidence write in packages/core/src/gates/store.ts"
Task: "Nonce and verdict parsing in packages/core/src/critic/verdict.ts"
Task: "Grounding snapshot in packages/core/src/critic/grounding.ts"
Task: "Critic ensemble in packages/core/src/critic/ensemble.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

The as-is MVP is Setup + Foundational + User Story 1: the gated proposer → critic loop in packages/core/src/engine/phase-loop.ts, driven by `lisa run`.

### Incremental Delivery

The baseline already contains all six stories. A later `/speckit.converge` run can extend any story phase by adding unticked tasks after the existing ones, without renumbering T001–T065.

### Parallel Team Strategy

Once Foundational is present, the stories live in separate packages: core (US1), cli + scheduler stop (US2), specs + persistence + verification (US3), core domain + cli + server (US4), scheduler (US5), server + hooks + dashboard (US6).

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps each task to its user story for traceability
- Every task is `[x]`: it describes code present at commit `76adfdc`, not planned work
- FR-001 … FR-053 each appear in at least one task description
