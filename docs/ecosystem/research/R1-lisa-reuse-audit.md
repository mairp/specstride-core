# R1 — Lisa reuse audit

Audit date: 2026-09-29. All `file:line` citations are relative to `/root/lisa` and were read or
grepped on this date. Unless a citation carries a tree tag (`@76adfdc` or `@363e6a3`), the cited file is
byte-identical in both trees, so the line numbers hold for either (see F-A3).

## Prior art consulted

| File | Used for | Reused / extended / contradicted |
|---|---|---|
| `prompts/specstride-ecosystem.md` §0, §1 ("Which Lisa"), §2, §4 row R1 | Assignment, decisions 1, 2, 3, 4, 11, 19 | Followed as written. The "Which Lisa" table is **extended and partly contradicted**: local `main` is not the newer tree for product code (F-A). The prompt counts "missing 89" commits on `main`; `git rev-list` counts 88 against `76adfdc` (the 89th is the merge commit `1fa98e3` on `origin/main`). |
| `old/002-as-is-lisa/spec.md` (full), `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `tasks.md`, `contracts/*` (grepped for every cited path) | Baseline of Lisa behaviour; source of candidate line cites | Reused. Line cites spot-checked against source (`speckit/project.ts:804-815`, `verification/store.ts:84-130`, `specification-bundle-store.ts:464-480`, `queue.ts:287-300` all correct). Its Assumption that the scheduler safety predicate has no production caller is **confirmed and widened** (F-B2). |
| `old/028-as-is-specstride/spec.md` (full) | The 30 FRs of the gap table | Reused as the row list. |
| `old/011-as-is-mixture-of-loops/spec.md` (full) | The 27 FRs of the gap table | Reused as the row list. |
| `prompts/analysis/A2-consolidation-analysis.md` (all Lisa rows) | Leads | **Confirmed**: no consecutive-MALFORMED limit, no diagnostician/accelerator, `watch/tail/verdicts/feedback/phases` unimplemented, Lisa gate layout is a subset. **Extended**: Lisa's MALFORMED handling is not just missing a limit, it halts on the first unrepaired MALFORMED with exit 2 (F-C2). **Corrected**: A2 treats `@lisa/otel`, hooks, ensemble, memory and plugins as Lisa capabilities; none of them is wired into the run path (F-B2). |
| `/root/lisa` at `76adfdc` and `363e6a3` | The audit itself | Read with `git diff`, `git show`, `git ls-tree`, `git log`, `git cat-file` and file reads of the checked-out tree (HEAD is `76adfdc`, no tracked modifications). Nothing was fetched, checked out or written. |

## Questions answered

**Q1. Which Lisa tree is current?**
Neither is a superset. The two refs are parallel histories with the same commit messages and different
hashes. For product code under `packages/`, 18 of 19 packages have identical source in both trees.
The exception is `packages/dashboard`, where **`76adfdc` is newer** (three feature commits that local
`main` does not have). Local `main` is newer only in housekeeping: the MIT `LICENSE`, a `"license":
"MIT"` field in 20 `package.json` files, and the removal of demo scripts and planning material.
**The audit uses local `main` (`363e6a3`) for the 18 identical packages and `76adfdc` for
`packages/dashboard`.** This goes to `DECISIONS-PENDING.md` because it contradicts the owner's belief
that local `main` is current. Details and the affected 002 requirements are in F-A.

**Q2. Reuse, extract or reimplement, per package?**
Reuse as-is: 0 packages. Extract (copy selected modules into the new codebase, rename, add
characterization tests): 9 packages. Reimplement: 3. Defer to the roadmap or drop: 7. Table in F-B.

**Q3. Can Lisa's core express Specstride semantics?**
Per-call nonce verdicts: yes, exactly. MALFORMED limit, diagnostician/accelerator, yield and
learning: no, and the phase loop has no seam to add them without editing the loop itself. Details
in F-C.

**Q4. Gap table.**
028: 3 yes, 15 partial, 12 no. 011: 0 yes, 6 partial, 21 no. Tables in F-D.

**Q5. Reverse-engineered requirements for web, otel, agents, tui, memory, plugins.**
46 requirements, `RL-WEB-*`, `RL-OTEL-*`, `RL-AGENT-*`, `RL-TUI-*`, `RL-MEM-*`, `RL-PLUG-*`, in F-E.

**Q6. Licence.**
Moving to MIT is within the owner's power for all three baselines: every commit in the three baseline
ancestries is by the owner's identities (plus two dependabot commits in mixture-of-loops). It needs six
concrete actions (F-F2). Two dependency facts need attention: `@anthropic-ai/claude-agent-sdk` is
proprietary, and `prime-agent` is installed from a release tarball URL and brings about 190 transitive
packages including native modules (F-F3).

## Findings

### F-A. Which Lisa

| # | Claim | Tag | Evidence |
|---|---|---|---|
| A1 | `76adfdc` and `363e6a3` share only the initial commit `6dc2970` (2026-07-27) as merge base. `76adfdc` has 88 commits `main` lacks; `main` has 76 that `76adfdc` lacks. | verified-local | `git merge-base 76adfdc 363e6a3` → `6dc29708…`; `git rev-list --left-right --count 76adfdc...363e6a3` → `88 76` |
| A2 | The two histories are parallel rewrites: the same commit messages and dates appear on both sides with different hashes (for example "feat(dashboard): report health of the configured proposer/critic providers" is `bd0634e` on the baseline side and `6d2228d` on `main`, both dated 2026-09-27 19:03:32, with the same 5-file stat). | verified-local | `git log --format='%h %ad %s' 363e6a3..76adfdc` and `76adfdc..363e6a3`; `git show --stat bd0634e 6d2228d` |
| A3 | Under `packages/` the diff `76adfdc → 363e6a3` is 65 paths: 40 deleted, 24 modified, 1 added. Of these, 36 are in `packages/dashboard` (29 deleted, 6 modified, 1 added). The 18 modifications outside `packages/dashboard` are each a one-line `"license": "MIT"` insertion in a `package.json`. The 11 deletions outside `packages/dashboard` are 9 `demo-*.mjs` scripts and 2 probe scripts under `packages/sdk/.wiggum-phase8/`. **No `.ts` or `.tsx` file outside `packages/dashboard` differs.** | verified-local | `git diff --name-status 76adfdc 363e6a3 -- packages`; `git diff 76adfdc 363e6a3 -- packages/core/package.json` |
| A4 | `packages/dashboard`: `76adfdc` is newer. It carries three commits after the shared "provider health" commit that `main` lacks: `03b8ed0` (paged trajectory API), `28a247a` (trajectory view), `152eef2` (chat-first shell). `main` still has the older monolith: `App.tsx` is 1139 lines on `main` and 247 on `76adfdc`; `styles.css` (3065 lines) exists only on `main` and was split into five files on `76adfdc`; `trajectory.ts` (585 lines), `trajectory.test.ts` and 19 further `.ts`/`.tsx` files (components, sections, lib, trajectory views) exist only on `76adfdc`. | verified-local | `git diff --stat bd0634e 76adfdc`; `git show 363e6a3:packages/dashboard/src/App.tsx \| wc -l` → 1139; `git show 76adfdc:… \| wc -l` → 247 |
| A5 | Commit dates agree with A4: `76adfdc` is dated 2026-09-28 00:20, `363e6a3` 2026-09-27 22:19. | verified-local | `git log -1 --format='%ad' --date=iso` on each |
| A6 | Outside `packages/`, `main` is newer in intent: it adds `LICENSE` (MIT, "Copyright (c) 2026 mairp"), adds `"license": "MIT"` to the root `package.json`, rewrites the README licence section, extends `.gitignore`, and untracks planning material (`specs/`, `.specify/`, `roadmap/`, `testautomation/`, `AGENTS.md`, `TASK.md`, `SPECS.md`, `REFACTOR.md`, `docs/`, `artifacts/`). | verified-local | `git show --stat 363e6a3`; `git show --stat 3da57d2`; `git diff 76adfdc 363e6a3 -- .gitignore README.md package.json` |
| A7 | Outside `packages/`, `76adfdc` is newer in CI: `.github/workflows/ci.yml` and `.mergify.yml` exist only there (commits `f24ece8`, `76adfdc`). | verified-local | `git diff --name-status 76adfdc 363e6a3 -- .github .mergify.yml` → both `D` |
| A8 | Lisa's constitution (`.specify/memory/constitution.md`, a symlink to `specs/memory/constitution.md`) is tracked at `76adfdc` and **untracked on `main`**. The prompt's statement "Lisa has its own in its repo" holds only for `76adfdc` and for the owner's working directory. | verified-local | `git ls-tree --name-only 363e6a3` has no `.specify` or `specs`; `002 plan.md:64` |

**Per-difference ruling**

| Difference | Newer side | Tree the audit uses |
|---|---|---|
| Source of 18 packages (all but dashboard) | identical | `363e6a3` (equal to `76adfdc`) |
| `packages/dashboard` source, styles, tests | `76adfdc` | `76adfdc` |
| `"license": "MIT"` in 20 `package.json`, root `LICENSE`, README licence text | `363e6a3` | `363e6a3` |
| `demo-*.mjs`, `.wiggum-phase8/*.mjs` | `363e6a3` (deliberate removal, `.gitignore` lines added) | `363e6a3`; none is product code |
| CI workflow and Mergify config | `76adfdc` | not audited (002 declares CI out of scope) |
| Planning material and constitution | `363e6a3` (deliberate untracking) | `76adfdc` for reading the constitution only |

**002 requirements the choice affects**

| Item | Effect if local `main` alone were taken as current |
|---|---|
| `002 FR-051` | Its only evidence file, `packages/dashboard/src/trajectory.ts`, does not exist on `main`. The requirement would describe nothing. |
| `002 SC-007` | Same file; same effect. |
| `002` User Story 6, acceptance scenario 2 (`spec.md:105`) | The trajectory route does not exist on `main`. |
| `002 data-model.md` `TrajectoryRecord` (`:472-492`) | Entity absent on `main`. |
| `002 contracts/dashboard-http-api.md` | `GET /api/jobs/:id/trajectory` is absent on `main`; every `server.ts` line cite in the contract is shifted on `main` (the file is 92 lines shorter; for example the `spawn` call is at `:767` on `76adfdc` and `:691` on `main`). |
| `002 data-model.md` `DashboardJob` (`:448-470`), `contracts/files-on-disk.md:79-83`, `contracts/config-env.md:33` | Behaviour unchanged; `server.ts` line numbers shift. |
| `002 tasks.md` T057, T060; `plan.md:47` | Refer to the trajectory; void on `main`. |
| `002 plan.md:37` | Cites `.github/workflows/ci.yml:19`, absent on `main`. |
| `002 research.md:47,62,99,104,114`, `plan.md:18-23,74`, `quickstart.md:53,122` | Cite `package.json` line ranges; on `main` every line after line 3 is shifted by +1. |
| All other 52 FRs and 6 SCs | Unaffected: every other cited path is identical in both trees. Checked by extracting the 98 distinct paths cited anywhere in `old/002-as-is-lisa/` and running `git diff --quiet 76adfdc 363e6a3 -- <path>` on each. |

### F-B. The 19 packages

Sizes are non-test `.ts`/`.tsx` lines in tracked files (`git ls-files packages/<p>`), measured on the
checked-out `76adfdc` tree; test lines are `*.test.ts(x)`. R2 owns the port size estimate.

| # | Claim | Tag | Evidence |
|---|---|---|---|
| B1 | All 19 packages are `"private": true`, version `0.0.0`, scope `@lisa/*`. None is published. "Reuse" can therefore only mean copying source into the new repository; there is no npm dependency to take. | verified-local | `packages/core/package.json:2-5`; same in every package |
| B2 | Seven packages have **no non-test importer anywhere in the monorepo**: `otel`, `web`, `memory`, `plugins`, `hooks`, `server`, `sdk` (also `testkit` and `dashboard`, which are leaves by design). In addition, `core/critic/ensemble.ts`, and the scheduler's queue, cron, safety, worktree and integration modules, are never referenced from `cli`, `server` or `rpc`. They are libraries with unit tests, not behaviour a run exhibits. | verified-local | `grep -rl 'from "@lisa/<p>"' packages/*/src` excluding `*.test.*` returns nothing for those packages; `grep -rn "runEnsemble\|HookRunner\|MemoryStore\|PluginRegistry\|admitBatch\|evaluateBudgets" packages/{cli,server,rpc}/src` returns nothing; `cli` imports only `PassRegistry` and `StopController` from the scheduler (`packages/cli/src/commands/run.ts:62`) |
| B3 | `@lisa/core` depends only on `zod`, and no provider type crosses into it. | verified-local | `packages/core/package.json` dependencies; `packages/agents/src/provider.ts:26` imports types from core, not the reverse |
| B4 | The source contains names that are specific to the owner's machines: a locally registered backend is hard-coded as a CLI harness arm (`packages/agents/src/openai-compat/completion.ts:168,219-226`) and machine-specific service names appear in 9 further files (`agents/src/anthropic/completion.ts`, `cli/src/commands/doctor.ts`, `core/src/domain/index.ts`, `dashboard/src/{types,server,chat}.ts`, `dashboard/src/components/RunDetails.tsx`, `dashboard/src/lib/local-chat.ts`, `sdk/examples/operational-readiness.ts`). Extraction must remove them (decisions 17 and 19). | verified-local | case-insensitive grep over `packages/*/src`, tests excluded |
| B5 | `lisa stop --now` finds child processes by scanning `/proc`, which does not exist on macOS; on a host without `/proc` it signals only the recorded pid. The recorded pid is the orchestrator's own (`process.pid`), because the SDK harness runs in-process. | verified-local | `packages/scheduler/src/stop-now.ts:151-159`; `packages/cli/src/commands/run.ts:685-691` |
| B6 | The verification executor runs every command of a gate and only then computes pass/fail. It does not stop at the first failure. | verified-local | `packages/verification/src/executor.ts:125-131` (`commands.map(...)` then `evidence.every(...)`) |
| B7 | Neither Lisa's grounding nor Specstride's expands `*` globs. Lisa expands brace lists (up to 32 items) and lists directory children (cap 24). The documented Specstride defect (§0) is reduced but not removed by taking Lisa's grounding. | verified-local | `packages/core/src/critic/grounding.ts:99-106`, `:39`; no match for `glob` or a `*` wildcard branch in that file |

**Per-package ruling**

| Package | Src / test lines | Depends on | Wired into a run? | Ruling | Coupling and licence notes |
|---|---|---|---|---|---|
| `core` | 8404 / 5179 | `zod` (MIT) | yes | **Extract** `critic/verdict.ts`, `critic/grounding.ts`, `gates/store.ts`, `engine/lifecycle.ts` (exit codes only), `engine/proposer-context.ts`, the v1-projection pattern of `events/journal.ts`. **Reimplement** `engine/phase-loop.ts`. **Defer** `domain/approvals.ts`, `domain/escalation.ts`, `plan/*`, `domain/specification-bundle.ts`, `critic/ensemble.ts`. | `.lisa` paths are built inside the loop (`phase-loop.ts:992`). Event types are a closed array (`events/journal.ts:48-96`), which works against decision 11's single schema being extensible. The 14-state Job lifecycle (`lifecycle.ts:145-215`) has no counterpart in 028 or 011. |
| `specs` | 5977 / 2967 | `core`, `zod` | yes | **Extract** `resolve.ts`, `speckit/adapter.ts`, `openspec/adapter.ts`, `wiggum/adapter.ts` (native grammar), `validate.ts`, `context.ts`, the adapter-registry shape of `registry.ts`. **Defer** `bundle/*`, `speckit/project.ts`, `reverse/*`. | The registry is the right seam for decision 17-style openness: adapters register by id (`registry.ts:877-884`). Format names differ from 028 (`openspec` vs `openspec-change`); R19 owns the rename. `reverse/*` is a different model from `028 FR-025..027` (claims and bundles, no inventory, lint or guard). |
| `agents` | 2054 / 878 | `core`, `zod`, `@anthropic-ai/claude-agent-sdk` (proprietary), `@anthropic-ai/sdk` (MIT), `prime-agent` (MIT, tarball URL) | yes | **Extract** `provider.ts` (the seam), `claude-agent-sdk/harness.ts`, `claude-agent-sdk/tap.ts`, `anthropic/completion.ts`, `openai-compat/completion.ts` (`OpenAiCompatCompletion` only). **Reimplement** `CliHarness` as the descriptor-driven generic adapter (R20). **Defer** `prime-agent/*` to its own adapter feature. | The seam is two capabilities, `harness` and `completion`, checked at registration (`provider.ts:186-202`). It has no notion of version pin, auth tier, quota signal, session continuation or discovery, all of which decisions 6, 8, 10, 17 and 22 need. `CliHarness` is a closed `if` chain over three backends (`completion.ts:214-232`). `prime-agent` must become an optional dependency (F-F3). |
| `verification` | 1290 / 279 | `core` | yes | **Extract** whole package. | Writes under `.lisa/verification/` (`store.ts:106-107`). No fail-fast (B6); aim 1 needs it added. One test file for 1290 lines. |
| `otel` | 1345 / 791 | none | **no** | **Extract** whole package as the starting point for decision 11's exporter. | No SDK dependency: OTLP/HTTP+JSON and Loki payloads are hand-built. Never called from a run (B2), so its behaviour is proven only by unit tests. R14 owns the schema; this is input to it. |
| `tui` | 939 / 559 | `rpc` (via `watch-client.ts` only) | partly (`presenter.ts` via `lisa status/events`) | **Extract** `presenter.ts`. **Defer** `modes.ts`, `watch-client.ts`. | `presenter.ts` has no package dependency (`node:fs` only) and reads the v1 event file, which is what `028 FR-023` `watch`/`tail`/`events` need. `modes.ts` and `watch-client.ts` depend on the RPC daemon. |
| `scheduler` | 2025 / 1039 | `core` | partly (`stop.ts`, `stop-now.ts`) | **Extract** `stop.ts`, `stop-now.ts` (add a macOS child walk), `budgets.ts`. **Defer** `queue.ts`, `cron.ts`, `safety.ts`, `worktrees.ts`, `integration.ts` to R26's roadmap. | Built but unused, as the prompt says (row R26). `budgets.ts` is pure and maps onto decision 8's per-role budgets. |
| `web` | 1257 / 481 | `react`, `react-dom` (MIT) | **no** | **Extract** `theme/tokens.ts` and the pure builders in `App.tsx` and `galaxy.ts`, in Wave 2. | A component library with no entry point, bundler config or server. Its read model is the 14-state Job (`App.tsx:32-35`), not phases and attempts, so the view models need a new input contract (R13). `kanbanColumns` is 14 lines (`App.tsx:132-145`). |
| `dashboard` | 6547 / 1183 (`@76adfdc`) | `core`, `persistence`, `specs`, `react`, `react-dom`; dev: `vite`, `rollup` | standalone app | **Extract** `trajectory.ts` (pure projection of a run journal) and `provider-health.ts`, in Wave 2. **Reimplement** the rest. | This is the only UI that is actually served. It uses a different job-state vocabulary from `web` (`packages/dashboard/src/types.ts:3@76adfdc`, `:1@363e6a3`: 6 states). `server.ts` spawns `lisa run` and keeps its own `jobs.json`; it carries machine-specific integrations (B4). `index.html@76adfdc` loads fonts from a remote host. |
| `cli` | 6302 / 3602 | 8 workspace packages | yes | **Reimplement**, using `layout.ts` (lock), `commands/resume.ts`, `commands/status.ts`, `commands/doctor.ts` and `interrupts.ts` as reference. | 14 files carry `.lisa`/`LISA_*` names. Config is env-and-flag only; decision 9's precedence chain does not exist. Five of the front-door verbs 028 requires are stubs (`index.ts:246-252`). `doctor.ts` is prior art for decision 14. |
| `hooks` | 488 / 186 | none | no | **Defer** (roadmap). | The name collides with host hooks (R19). Fail-closed exit semantics are sound (`runner.ts:282-310`) but nothing in 028/011 needs them. |
| `memory` | 678 / 249 | `core` | no | **Defer**; input to R12. | File-based store plus mined "lessons". Not the knob-tuning of `028 FR-024`. |
| `plugins` | 520 / 202 | `core` | no | **Drop** `registry.ts`; **defer** `skills.ts`. | The registry records manifests and permissions but loads nothing and connects no contribution to any real registry (`registry.ts:171-235`); `CONTRIBUTION_KINDS` is a closed list (`:35-45`). It does not provide the plug-in behaviour the evolvability goal asks for. |
| `persistence` | 1807 / 2000 | `core`, `specs`, `better-sqlite3` (MIT, native) | yes (bundle store) | **Defer**. | `better-sqlite3` is a native module; adopting it needs a Language Ledger-style portability entry (decisions 2, 12). 028/011 need no SQL index. |
| `rpc` | 1667 / 524 | `core`, `ws`, `zod` | yes (`lisa serve`) | **Defer**. | Decision 5 coordinates host and runtime through files only; a JSON-RPC daemon is outside Wave 1. |
| `server` | 2439 / 1358 | 6 workspace packages, `fastify`, `@modelcontextprotocol/sdk`, `ws`, `zod` | via `lisa serve --port` | **Defer**. | Largest third-party closure after `agents`. R13 decides whether a local server is wanted for the kanban. |
| `sdk` | 3826 / 3650 | `ws`, `zod` | no | **Drop**. | A client for the RPC surface; no consumer. |
| `workflow` | 407 / 221 | `core`, `scheduler` | no | **Drop**. | One embedded engine plus a Temporal scaffold whose methods throw (`engine.ts:310`). |
| `testkit` | 4 / 1100 | 4 workspace packages | tests only | **Extract** the characterization-test pattern, not the code. | Decision 4 asks for characterization tests of kept Lisa behaviour; the suite under `src/characterization/` is the model. Whether it passes was not run (see Open questions). |

Totals: about 48 000 source lines in Lisa; the modules marked **Extract** come to roughly 11 000
source lines (core 2300, specs 2100, agents 1400, verification 1300, otel 1350, tui 590, scheduler 650,
web 900, dashboard 800). Tag: `inferred` from the per-file line counts listed by
`git ls-files … | wc -l`.

### F-C. Can Lisa's core express Specstride semantics?

| # | Semantic | Answer | Tag | Evidence |
|---|---|---|---|---|
| C1 | Per-call nonce verdict (`028 FR-005`, `SC-002`) | **Yes, exactly.** 8 random bytes → 16 hex characters per review; the parser accepts exactly one `VERDICT <nonce>: APPROVED\|REJECTED` line; zero or several matches give MALFORMED. | verified-local | `packages/core/src/critic/verdict.ts:40-42`, `:56-76`; nonce created per critic call at `packages/core/src/engine/phase-loop.ts:623` |
| C2 | MALFORMED limit (`028 FR-010`) | **No, and the existing behaviour conflicts.** On a MALFORMED reply Lisa makes one "protocol repair" critic call with a new nonce. If the repair is also MALFORMED, or the reply was empty, the run halts at once with outcome `critic_protocol` and exit **2**. There is no counter of consecutive MALFORMED verdicts, no exit 1 and no `critic_unavailable` reason. Only a thrown transport error becomes a MALFORMED rejection that is retried. | verified-local | `phase-loop.ts:681-750` (repair path), `:903-914` (`haltCriticProtocol`, `ExitCode.REJECTS`), `:653-667` (transport error); `grep -rniE "malformed.?limit\|critic_unavailable" packages/*/src` → no match |
| C3 | Diagnostician / accelerator (`028 FR-011`, `FR-012`, `SC-005`) | **No.** No hint file, no signature marker, no attempt kind. The closest code, `diagnoseRetryExhaustion`, runs once after the reject limit is reached and produces text for a human approval request. | verified-local | `grep -rniE "accelerat" packages/{core,cli,specs,agents}/src` → no match; `packages/core/src/domain/escalation.ts:89`, called only by `buildRetryEscalation` (`escalation.ts:215`), which the loop calls only inside `haltMaxRejects` (`phase-loop.ts:941`) |
| C4 | Yield (`028 FR-019`) | **No.** A pass ends on evidence, on its own result, on abort, or on the wall-clock timeout. There is no yield artifact, poll or per-attempt cap. | verified-local | `packages/agents/src/claude-agent-sdk/harness.ts:7-12`, `:189-208`; `grep -rniE "pass-yield\|yield_" packages/*/src` → no match |
| C5 | Learning (`028 FR-024`, `011 FR-003/016/018`) | **No.** `@lisa/memory` mines recurring rejections into proposed "lesson" and "policy" entries behind a human approval. It has no knob allowlist, no bounds, no `applied.json` and no mode. It is also unwired (B2). | verified-local | `packages/memory/src/learn.ts:130-196`, `:220-243` |
| C6 | Oscillation halt (`028 FR-009`) | **No.** | verified-local | `grep -rniE "oscillat" packages/*/src` → no match |
| C7 | Extension seams of the loop | The loop takes three injected callbacks (`runProposerPass`, `runCritic`, `verifyPhase`) and nothing else. What happens after a rejection, which kind of attempt comes next, and what a pass may return are fixed in `runPhase` and `runProposerUntilEvidence`. `ProposerPassResult` has no field for a yield. `PhaseLoopOutcome` is a closed union of 8 values. Adding any of C2–C6, or the micro-loop layer of decision 21, means editing the loop. | verified-local | `phase-loop.ts:195-227` (collaborators), `:99-104` (pass result), `:229-237` (outcomes), `:359-459`, `:466-607` |
| C8 | Counts survive a resume (decision 23) | **Not expressible as built.** The attempt number is a local variable initialised to 1 on every `runPhase` call; usage is an in-memory field. After a resume the next rejection archives into `attempt1` again, where `mkdirSync(recursive)` succeeds and `renameSync` overwrites the earlier evidence. 028's `-<run-id>` suffix rule (`028 FR-007`) is absent. | verified-local | `phase-loop.ts:368`, `:282`; `packages/core/src/gates/store.ts:179-186` |
| C9 | Quota pause (decision 8) | **Not expressible as built.** The harness classifies `rate_limited`, but the loop treats every failure kind except `timed_out`, `transport_failed` and `context_window_exceeded` as `proposer_no_evidence` with exit 1. | verified-local | `packages/agents/src/provider.ts:29-37`; `harness.ts:368-370`; `phase-loop.ts:523-561` |
| C10 | Session continuation within an attempt (decision 22) | **Not expressible as built.** Each pass is a new SDK `query()` with no resume; the request type has no session field. | verified-local | `harness.ts:3-6`, `:231`; `provider.ts:45-66` |
| C11 | Proposer watchdogs and breakers (`028 FR-017`, `FR-018`) | **Partly.** Lisa has the wall-clock pass timeout and a no-progress fingerprint (threshold 2). It has no idle or disk-progress watchdog; the SDK's own idle timeout is switched off on purpose. It allows one transient retry instead of 028's error and hard-cap breakers. | verified-local | `harness.ts:189-196`, `:46-55`; `phase-loop.ts:479`, `:562-590`, `:523-549` |
| C12 | What Lisa adds that 028 lacks and that fits the aims in §0 | Bounded proposer context with a per-source budget and compaction of `PROGRESS.md` (aim 4); typed failure kinds; approval must also pass a deterministic verification gate (`002 FR-009`); dead-owner lock reclaim (aim 3); a durable "awaiting human" request at the reject limit (the "blocked on me" signal of aim 3). | verified-local | `packages/core/src/engine/proposer-context.ts:127`, `:257`; `phase-loop.ts:401-423`; `packages/cli/src/layout.ts:151-171`; `phase-loop.ts:927-966` |

Conclusion for Q3 (`inferred` from C1–C11): Lisa's **primitives** around the loop are a faithful port of
an earlier Specstride and are worth taking. Lisa's **loop** is a port of that same earlier version
without the mechanisms added since, and its shape is closed. Writing the new engine with strategy
seams, and plugging Lisa's primitives into it, costs less than retrofitting five mechanisms and three
decisions into `phase-loop.ts`.

### F-D. Gap table

Legend: **yes** = the behaviour in the FR is implemented and reachable in a run; **partial** = a
recognisable part is implemented, with the stated difference; **no** = absent. For **no** rows the
evidence is the search that found nothing, plus the nearest analogue where one exists. All greps are
over `packages/*/src`, non-test files.

#### 028 Specstride (30 FRs): 3 yes, 15 partial, 12 no

| FR | Lisa | Evidence | Difference |
|---|---|---|---|
| 028 FR-001 spec resolution order | partial | `packages/core/src/gates/features.ts:231-307`; caller `packages/cli/src/commands/run.ts:331-346` | Same walk (`SPECS.md`, `.specify/feature.json`, `specs/*/tasks.md`), same never-auto-select rule, exit 3. No `openspec/changes/*/tasks.md` candidates. A second copy of the walk exists in `packages/specs/src/resolve.ts:101-183`. |
| 028 FR-002 format auto-detection | partial | `packages/specs/src/resolve.ts:45-71` | Override → filename → content, unknown override throws (`:58-60`). Detectable set is `native`, `wiggum`, `speckit-tasks` (`:22`); OpenSpec is never auto-detected and is named `openspec`. An env step (`LISA_SPEC_FORMAT`) sits in the order. |
| 028 FR-003 phase derived from markers | **yes** | `packages/core/src/engine/phase-loop.ts:309-312`, `:337-340`; `packages/core/src/gates/store.ts:156-161`; release verification `packages/cli/src/commands/run.ts:613-646` | — |
| 028 FR-004 one run per workdir, exit 5 | partial | `packages/cli/src/layout.ts:141-171`; `run.ts:416-424` | Atomic `mkdir lock.d` only, no `flock`. Adds reclaim of a lock whose owner pid is dead. |
| 028 FR-005 per-call nonce, strict parse | **yes** | `packages/core/src/critic/verdict.ts:40-42`, `:56-76` | — |
| 028 FR-006 marker on APPROVED, feedback and exit 10 otherwise | partial | `store.ts:124-129`; `phase-loop.ts:831-835`, `:772-789` | The loop, not a critic process, writes the marker. No exit 10 (the critic is in-process). The marker is written only after the verification gate passes (`phase-loop.ts:401-406`). |
| 028 FR-007 archive rejected attempt | partial | `store.ts:179-196` | Moves evidence, copies feedback and newest transcript. No hint or acceleration note. No `-<run-id>` suffix: an existing attempt directory is reused (C8). |
| 028 FR-008 retry until `MAX_REJECTS`, exit 2 | partial | `phase-loop.ts:440-446`, `:967-974`; default 3 at `run.ts:129` | Limit and exit code match. The halt does not log the evidence, feedback, hint and trail paths; it opens an approval request instead. |
| 028 FR-009 oscillation halt | no | grep `oscillat` → no match | — |
| 028 FR-010 MALFORMED limit, exit 1 `critic_unavailable` | no | grep `malformed.?limit\|critic_unavailable` → no match; contrary behaviour at `phase-loop.ts:736-748`, `:903-914` | One unrepaired MALFORMED halts with exit 2 (C2). |
| 028 FR-011 diagnostician | no | grep `\-\-diagnose\|diagnosed-phase\|HINT\.md` → no match | Nearest: `escalation.ts:89`, post-exhaustion, for a human. |
| 028 FR-012 accelerator | no | grep `accelerat` → no match in core, cli, specs, agents | — |
| 028 FR-013 tick task checkboxes | no | grep `tick` in `packages/cli/src`, `packages/specs/src/speckit/adapter.ts`, `packages/specs/src/validate.ts` → no match | The Spec Kit adapter parses checkboxes and never writes them back. |
| 028 FR-014 git commit after approval | partial | `phase-loop.ts:1198-1237` (message at `:1229`), `:840-842` | `git add -A` and commit, never init or push: matches. Message prefix is `lisa:`. The CLI fixes the mode to `auto` (`run.ts:523`); no flag or env turns it off. |
| 028 FR-015 `stop.flag`, exit 6, `stop --now` | partial | checks at `phase-loop.ts:371`, `:482`, `:497`; halt `:853-857`; flag `packages/scheduler/src/stop.ts:81-105`; `--now` `packages/scheduler/src/stop-now.ts:195-230`; verb `packages/cli/src/interrupts.ts:303` | `--now` targets the orchestrator's own pid and walks children through `/proc` only (B5). The flag is deleted after a clean halt. |
| 028 FR-016 resume | partial | `packages/cli/src/commands/resume.ts:128-209` | Refuses with exit 5 (028 says exit 1 per A2) and only when the lock owner is alive. Replays 11 settings (`:186-196`); not critic timeout, wall budget or telemetry. Adds a refusal when the spec hash changed (`:175-180`). |
| 028 FR-017 three watchdogs | partial | `harness.ts:189-196`; `phase-loop.ts:562-590`; `harness.ts:46-55` | Wall-clock timeout and a repetition fingerprint (threshold 2, not 12). No idle or disk-progress watchdog (C11). |
| 028 FR-018 breakers, exit 4 on budget exits | partial | `phase-loop.ts:859-867` (exit 4 for wall budget and max-iter); `:523-561` | No consecutive-error or hard-cap breaker. A proposer error other than one transient retry ends the run with exit 1, not 4. |
| 028 FR-019 yield | no | grep `pass-yield\|YIELD_` → no match | — |
| 028 FR-020 `--verification off\|plan\|required` | partial | `run.ts:875-882`; usage error → exit 3 at `:271-274` | Same three values, same exit. Default is `off` (`run.ts:135-137`), not `required`. |
| 028 FR-021 one backend registry | partial | `packages/agents/src/provider.ts:178-257`; `run.ts:661-669` | One registry with a capability contract. Different members (SDK harness, two completion adapters, a CLI harness, `prime-agent`) and different defaults (`run.ts:127-128`). The CLI harness is a closed list (B-table, `agents`). |
| 028 FR-022 Loki and OTel off by default | partial | `packages/otel/src/loki.ts:195-205`, `packages/otel/src/otlp.ts:118` | Forwarders exist but no run ever constructs one (B2), so shipping is always off. No default endpoints are defined: `url` is a required option (`loki.ts:170-172`). |
| 028 FR-023 front door | partial | `packages/cli/src/index.ts:52-62`, `:88-139`, `:246-252` | Implemented: `run`, `status`, `events`, `stop`, `resume`. Recognised but answering exit 1 `verb_not_implemented`: `watch`, `tail`, `verdicts`, `feedback`, `phases`. Absent: `learn`, `reverse`. |
| 028 FR-024 learn knob allowlist | no | grep `yield_poll_interval\|applied\.json\|learn --` → no match; the proposer timeout exists only as a launch setting (`run.ts:131-134`) | Nearest: `packages/memory/src/learn.ts:130` (a different mechanism, C5). |
| 028 FR-025 reverse output naming and refusals | no | grep `as-is-` in `packages/specs/src/reverse` → no match | Nearest: `packages/specs/src/reverse/investigate.ts:187` asks a human for the destination. No CLI verb reaches it. |
| 028 FR-026 reverse guard | no | grep `guard` in `packages/specs/src/reverse` → no match | — |
| 028 FR-027 reverse linter | no | grep `lint` in `packages/specs/src/reverse` → no match | Nearest: `packages/specs/src/reverse/asis-tobe.ts:163` checks only that no `desired` claim is in the as-is set. |
| 028 FR-028 config-home overlay | no | grep `overlay` in `packages/agents/src`, `packages/core/src` → no match | — |
| 028 FR-029 one owner of the spec grammar | **yes** | `packages/specs/src/registry.ts:877-884`; sole caller path `run.ts:384-390`; `phase-loop.ts:10-11` ("core takes no dependency on the grammar package") | Spec *discovery* is duplicated (see FR-001); grammar is not. |
| 028 FR-030 automated checks and CI | partial | `.github/workflows/ci.yml@76adfdc` (absent `@363e6a3`); root `package.json` scripts `test`, `lint` | Different toolchain (vitest, eslint). CI exists only on the `76adfdc` side. |

#### 011 mixture-of-loops (27 FRs): 0 yes, 6 partial, 21 no

Lisa has no launch contract, no renderer, no launcher and no supervisor. grep for `launcher` finds one
unrelated comment (`packages/cli/src/commands/serve.ts`); grep for `relaunch` finds one comment in
`resume.ts`; grep for `retry_exit_codes|retryExitCodes`, `DIGEST]`, `MOL-` finds nothing.

| FR | Lisa | Evidence | Difference / nearest analogue |
|---|---|---|---|
| 011 FR-001 source inventory with hashes | partial | `packages/cli/src/commands/spec-import-project.ts:165-175` | Each imported artifact is snapshotted against its SHA-256. No line count and no checkbox-insensitive hash for `tasks.md` (`packages/specs/src/bundle/hash.ts:11-29` hashes canonical JSON only). |
| 011 FR-002 draft contract with open blocker | no | no contract entity | Analogue: a verification plan's `ambiguities` (`run.ts:448`). |
| 011 FR-003 bind the learning decision log | no | grep `learning` in `packages/{cli,specs,verification}/src` → no match | — |
| 011 FR-004 strict validation of the contract | no | no contract entity | Analogue: zod schema validation of bundles. |
| 011 FR-005 reject open blockers and unresolved coverage | partial | `packages/specs/src/speckit/project.ts:804-815` | With `--require-traceability`, uncovered requirements and unlinked work items fail the import. Applies to a bundle, not a contract; no `blocker` findings. |
| 011 FR-006 `--promote` with a stamp | no | grep `promotion` stamp → none in cli | `promote` in `memory` and `server/chat` means something else. |
| 011 FR-007 stale sources, exit 23 | partial | `packages/cli/src/commands/resume.ts:175-180`; `run.ts:288-295` | A changed input refuses with exit 3 (`input_changed`, `spec_bundle_stale`). Checkbox-only changes are **not** exempt. |
| 011 FR-008 renderer re-validates, refuses edited launcher | no | no renderer | — |
| 011 FR-009 content-addressed bundle directory | partial | `packages/verification/src/store.ts:94-108`; `packages/persistence/src/specification-bundle-store.ts:464-480` | Plans and bundles are stored immutably under a content hash and never overwritten. They hold specifications, not a runtime copy. |
| 011 FR-010 generated Bash launcher with own digest | no | no launcher | — |
| 011 FR-011 runtime exits 23/20, `--dry-run` | no | grep `dry-run\|dryRun` in `packages/cli/src/commands/run.ts` → no match | — |
| 011 FR-012 run-directory lock, exit 24 | partial | `packages/cli/src/layout.ts:141-171` | Lock is per workdir and exits 5. |
| 011 FR-013 preflight, exit 21 | partial | `run.ts:448-455` | One preflight check: `required` verification with unresolved commands refuses with exit 3 before any pass. |
| 011 FR-014 ordered stages, skip completed, `state.json` | no | no stage entity, no `state.json` | Analogue at phase level: `store.ts:156-161`. |
| 011 FR-015 in-stage retry by exit code and stop reason | no | grep `retry_exit_codes\|retryExitCodes` → no match | Analogue, unwired: `packages/scheduler/src/queue.ts:287-300`. |
| 011 FR-016 strip inherited learning env | no | grep `_LEARNING` → no match | — |
| 011 FR-017 mode selection from the request | no | no `generate/run/auto` modes | — |
| 011 FR-018 learning-mode selection | no | as FR-016 | — |
| 011 FR-019 six-check launch gate | no | no gate sequence | Analogue: `packages/cli/src/commands/doctor.ts:557`. |
| 011 FR-020 detached launch with a launch record | no | the only child launch is `packages/dashboard/src/server.ts:767-770@76adfdc` (`:691-694@363e6a3`), with `detached: false` | A run dies with the dashboard API process. |
| 011 FR-021 relaunch classifier | no | grep `relaunch` → one comment | — |
| 011 FR-022 relaunch budget | no | as FR-021 | — |
| 011 FR-023 labelled lines and final digest | no | grep `MOL-\|DIGEST\]` → no match | — |
| 011 FR-024 retrospective | no | no `retro` | Analogue, unwired: `packages/memory/src/learn.ts:298`. |
| 011 FR-025 onboard-skill linker | no | no skill linking | — |
| 011 FR-026 `MOL_VIA` reminder | no | grep `MOL_VIA` → no match | — |
| 011 FR-027 legacy contract spellings | no | no contract | Analogue: `WIGGUM_*` env fallbacks (`run.ts:127-141`). Superseded by decision 3 either way. |

### F-E. Reverse-engineered requirements for packages with no as-is FRs

Each requirement describes what the code does today. "Unwired" means no run exercises it (B2), so
its evidence is source plus unit tests. IDs are local to this report; R19 decides dispositions.

**web (kanban)**: unwired

| ID | Requirement | Evidence |
|---|---|---|
| RL-WEB-01 | The kanban groups job cards into eight fixed lanes in a fixed order and appends a lane for any other state that has at least one job. Empty canonical lanes are still shown. | `packages/web/src/App.tsx:115-145` |
| RL-WEB-02 | Budget burn-down per job is cost divided by ceiling; with no ceiling the fraction is undefined; `over` is true only above 1. | `App.tsx:159-171` |
| RL-WEB-03 | Plan tasks are laid out in topological levels; a dependency cycle is cut at level 0 instead of looping. | `App.tsx:174-195` |
| RL-WEB-04 | Every view-model builder is a pure function with no DOM, clock or random input. | `App.tsx:13-15`; `packages/web/src/galaxy.ts:8-12` |
| RL-WEB-05 | Every mutation is a named JSON-RPC method and fires only after a confirmation callback returns true. | `App.tsx:232-239`, `:553-557` |
| RL-WEB-06 | Job state is shown with glyph, label and colour together, never colour alone. | `App.tsx:245-259`; `packages/web/src/theme/tokens.ts:174` |
| RL-WEB-07 | Light and dark themes come from one token file shared with the TUI, with a contrast function that checks WCAG AA (4.5 normal, 3.0 large). | `tokens.ts:61-72`, `:106-157` |
| RL-WEB-08 | The galaxy view derives bodies from jobs when none are supplied and marks a job over budget as high risk. | `App.tsx:202-214` |

**otel**: unwired

| ID | Requirement | Evidence |
|---|---|---|
| RL-OTEL-01 | Every forwarder is best-effort: a failed or unreachable backend produces a warning and never throws into the caller. | `packages/otel/src/index.ts:1-4`; `packages/otel/src/loki.ts:8-12`, `:255` |
| RL-OTEL-02 | Loki streams carry only low-cardinality labels (`job`, `task`, `backend`, `event`, plus `model` on `api_request` and `tool_use`); all other fields go in a logfmt line. | `loki.ts:13-19`, `:69`, `:105` |
| RL-OTEL-03 | OTLP logs and metrics are built by hand as OTLP/HTTP+JSON with no SDK; the log body is the same logfmt string the Loki forwarder emits. | `packages/otel/src/otlp.ts:1-20`, `:118` |
| RL-OTEL-04 | Metrics use delta temporality; duration histogram bounds are fixed (8 bounds in ms for iterations, 10 in s for phases). | `otlp.ts:24-27`; `packages/otel/src/metrics.ts:23-24` |
| RL-OTEL-05 | Six metric families are recorded: jobs by state, phase duration, verdicts by result, token spend and cost, queue depth, approval latency. | `metrics.ts:107-158`, `:187` |
| RL-OTEL-06 | Span names are a fixed set of 15 under the `lisa.` prefix. | `packages/otel/src/tracer.ts:85-101` |
| RL-OTEL-07 | Trace context follows W3C `traceparent` version 00; ids are random and never all-zero; the context is injected into a child's environment and into HTTP headers, and read back from the environment. | `tracer.ts:37-66`, `:317`, `:332`, `:343` |
| RL-OTEL-08 | A v1 event record can be converted to a telemetry event, so the forwarders consume the same stream the presenter reads. | `loki.ts:105` |

**agents**: wired

| ID | Requirement | Evidence |
|---|---|---|
| RL-AGENT-01 | A provider declares `harness`, `completion` or both; registering one whose declared capability has no matching method fails. | `packages/agents/src/provider.ts:129-140`, `:186-202` |
| RL-AGENT-02 | A role policy entry is `provider/model`; text after the first slash is the model; a bare id means the provider's default. | `provider.ts:272-294` |
| RL-AGENT-03 | A completion call has no tools and no shell. | `provider.ts:17-20`; `packages/agents/src/anthropic/completion.ts:5` |
| RL-AGENT-04 | Usage comes from the provider's own accounting; a provider that reports none returns zeros. | `provider.ts:22-24`, `:297-303`; `packages/agents/src/claude-agent-sdk/harness.ts:94-111` |
| RL-AGENT-05 | Each harness pass is a new session. It ends when the evidence file appears (polled every 250 ms), when the session ends, on abort, or on the wall-clock timeout. | `harness.ts:3-12`, `:35`, `:189-208` |
| RL-AGENT-06 | A pass that finds the evidence file already present does no model work and returns success with zero usage. | `harness.ts:163-173` |
| RL-AGENT-07 | An abort caused by the evidence file appearing is reported as success. | `harness.ts:265-290` |
| RL-AGENT-08 | The proposer runs with permission prompts bypassed unless the operator overrides the mode. | `harness.ts:220-222` |
| RL-AGENT-09 | Failures are classified into seven kinds; structured codes win over text matching. | `provider.ts:29-37`; `harness.ts:359-412` |
| RL-AGENT-10 | Each pass result carries a SHA-256 fingerprint of its tool calls, text and result, used to detect repeated identical passes. | `harness.ts:229-257` |
| RL-AGENT-11 | Harness events are mapped onto the five v1 agent-tap events and a one-line human echo; a tap failure never breaks the loop. | `packages/agents/src/claude-agent-sdk/tap.ts:1-27`, `:90`, `:197` |
| RL-AGENT-12 | The OpenAI-compatible completion adapter reads its base URL, key and model from `OPENAI_BASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL`. | `packages/agents/src/openai-compat/completion.ts:93-96` |
| RL-AGENT-13 | The CLI harness runs one CLI process per pass, reports zero usage, and selects its argv from a fixed set of backends. | `completion.ts:198-232`, `:267-286` |

**tui**: `presenter.ts` wired through `lisa status` and `lisa events`; the rest unwired

| ID | Requirement | Evidence |
|---|---|---|
| RL-TUI-01 | The presenter reads the run's v1 event file and nothing else. | `packages/tui/src/presenter.ts:3-6`; caller `packages/cli/src/commands/status.ts:31` |
| RL-TUI-02 | Without a TTY, with `NO_COLOR` set or with `TERM=dumb`, output degrades to plain `HH:MM:SS event key=value` lines with no cursor control. | `presenter.ts:50-56`, `:65-71`, `:351` |
| RL-TUI-03 | In follow mode a change of the file's device and inode yields a `_reopen` marker and the view continues on the new run. | `presenter.ts:22-24`, `:394`, `:258` |
| RL-TUI-04 | On a TTY a heartbeat shows when more than 2 s have passed since the last line. | `presenter.ts:565` |
| RL-TUI-05 | Narration has three detail levels: `milestones`, `tools`, `full`. | `presenter.ts:242-256` |
| RL-TUI-06 | Six views and three control modes exist; `observe` denies mutations, `interactive` requires confirmation, `autonomous` allows them. | `packages/tui/src/modes.ts:24`, `:37`, `:222-231` |
| RL-TUI-07 | When no daemon socket answers, the watch client falls back to the event file. | `packages/tui/src/watch-client.ts:13-15` |

**memory**: unwired

| ID | Requirement | Evidence |
|---|---|---|
| RL-MEM-01 | A memory is a markdown file with frontmatter (`name`, `description`, `type`, `scope`), one of four types, in feature or global scope, written atomically. | `packages/memory/src/store.ts:39-60`, `:246` |
| RL-MEM-02 | Recall is lexical, semantic (injected embedder, or token overlap without one) or merged; every hit names its source file. | `store.ts:293`, `:320`, `:341` |
| RL-MEM-03 | The store cannot approve or gate anything. | `store.ts:14-16` |
| RL-MEM-04 | A rejection pattern becomes a proposal when the same criterion failed at least twice (configurable). | `packages/memory/src/learn.ts:131`, `:142-144` |
| RL-MEM-05 | Text containing a raw-prompt marker is discarded; secret-shaped substrings are replaced; a body emptied by redaction is discarded. | `learn.ts:57-73`, `:88-108` |
| RL-MEM-06 | A proposal becomes active only after an approval whose target hash equals the hash of the proposed entry. | `learn.ts:220-243`, `:251-262` |
| RL-MEM-07 | A memory's effect is the change in reject rate plus the change in attempts per phase; above +0.05 is `helped`, below −0.05 is `hurt`. | `learn.ts:298-318` |

**plugins**: unwired

| ID | Requirement | Evidence |
|---|---|---|
| RL-PLUG-01 | A plugin manifest declares contributions from nine fixed kinds and permissions from six grantable tokens. | `packages/plugins/src/registry.ts:35-62` |
| RL-PLUG-02 | Declaring any of four forbidden permissions, or an unknown one, fails the load. | `registry.ts:65-70`, `:140-150` |
| RL-PLUG-03 | A plugin that throws during setup is recorded as failed and does not affect others. | `registry.ts:20-22`, `:171` |
| RL-PLUG-04 | Every contribution is stamped as attached to the orchestrator; there is no API to attach inside a proposer pass. | `registry.ts:23-25`, `:120-133` |
| RL-PLUG-05 | Skills are selected explicitly or by matching a task's required capabilities, and rendered as read-only background within a character budget (default 24 000, floor 800 per document). | `packages/plugins/src/skills.ts:130`, `:166-168`, `:217` |

### F-F. Licence

| # | Claim | Tag | Evidence |
|---|---|---|---|
| F1 | Every commit in the ancestry of the three baselines is authored under the owner's identities. Specstride `9cab15d`: 226 commits, 3 identities, all the owner. Lisa `363e6a3`: 77 commits; `76adfdc`: 89 commits; all the owner. mixture-of-loops `9c88f86`: 29 owner commits and 2 by dependabot. | verified-local | `git log <baseline> --format='%an\|%ae' \| sort \| uniq -c` in each repository |
| F2 | Commits under other identities exist **outside** the baselines: three commits on a non-baseline Specstride branch under a second personal identity, and one commit on a non-baseline Lisa branch under a corporate-domain address (it changes only a file mode). None is an ancestor of a baseline. | verified-local | `git log --all --format='%h %an'`; `git merge-base --is-ancestor <c> <baseline>` false for each |
| F3 | Many commits carry `Co-Authored-By: Claude …` trailers (Specstride 275 or more, Lisa 39, mixture-of-loops 42 or more). No third party holds rights through them; whether model-written text is copyrightable at all is a legal question this report does not settle. | verified-local (counts), unverified (legal effect) | `git log --all --format='%b' \| grep -i '^co-authored-by'`. Provider terms were not read for this report; R8 owns terms. |
| F4 | Specstride is Apache-2.0 with "Copyright 2026 Marlon De Paz". `CONTRIBUTING.md` requires DCO sign-off and states that contributions are licensed Apache-2.0. | verified-local | `/root/specstride/LICENSE:1-3`, `:189`; `/root/specstride/CONTRIBUTING.md:27`, `:31` |
| F5 | Specstride vendors GitHub's Spec Kit templates with their own MIT licence ("Copyright GitHub, Inc."), 7 files. | verified-local | `git show 9cab15d:lib/speckit_templates/LICENSE` |
| F6 | mixture-of-loops has **no licence file** at the baseline. | verified-local | `git ls-tree -r --name-only 9c88f86 \| grep -i licen` → nothing |
| F7 | Lisa's MIT `LICENSE` reads "Copyright (c) 2026 mairp" and exists only on unpushed local `main`. GitHub's `main` therefore publishes Lisa with no licence. | verified-local | `git show 363e6a3:LICENSE`; `git ls-tree --name-only 76adfdc` has no `LICENSE` |
| F8 | `@anthropic-ai/claude-agent-sdk` 0.3.220 is not open source: its `license` field is "SEE LICENSE IN README.md" and its `LICENSE.md` reads "© Anthropic PBC. All rights reserved. Use is subject to the Legal Agreements…". It ships per-platform native binaries as optional dependencies. | verified-local | `node_modules/.pnpm/@anthropic-ai+claude-agent-sdk@*/node_modules/@anthropic-ai/claude-agent-sdk/{package.json,LICENSE.md}` |
| F9 | `prime-agent` 0.7.1 is MIT but is installed from a GitHub release tarball URL, not the npm registry. Its installed closure is about 190 packages and includes `zeromq` ("MIT AND MPL-2.0", native), `koffi`, `protobufjs` and `@google/genai` (build scripts allowed in `pnpm-workspace.yaml:9-15`). | verified-local | `packages/agents/package.json` dependencies; BFS over the installed tree with `/tmp/specstride-research/R1/lic.cjs` |
| F10 | Direct dependencies of the packages marked **Extract**, other than F8 and F9, are all MIT: `zod` 4.4.3, `@anthropic-ai/sdk` 0.115.0, `react` 19.2.8, `react-dom` 19.2.8. `otel`, `verification`, `scheduler`, `tui/presenter.ts` and `hooks` have no third-party dependency. | verified-local | `package.json` `license` fields under `node_modules/.pnpm/`; same script |
| F11 | Dependencies of the packages marked **Defer**: `better-sqlite3` 13.0.1 (MIT, native), `fastify` 5.10.0 (MIT), `@modelcontextprotocol/sdk` 1.29.0 (MIT), `ws` 8.21.1 (MIT); dev-only `vite` 5.4.21, `rollup` 4.24.0, `@vitejs/plugin-react` 4.3.4 (MIT). In the `server` closure the licences found are MIT, ISC, BSD-2/3-Clause, Apache-2.0, BlueOak-1.0.0, 0BSD, Unlicense, plus F8 and the `zeromq` entry of F9 (both reached through `cli → agents`). | verified-local | same script |

**F-F2. What moving everything to MIT requires** (tag: `inferred` from F1–F7; this is an engineering
checklist, not legal advice)

1. **Decide the copyright line once.** Specstride says "Marlon De Paz", Lisa says "mairp". Use one
   legal name in the new `LICENSE` and in every `package.json` `author` field.
2. **New repository, MIT from the first commit.** The TypeScript product is new code by the owner.
   Put the MIT `LICENSE` at the root and `"license": "MIT"` in every package, as Lisa's `main` already
   does.
3. **Lisa code that is extracted** comes from the owner's own work. Take it from a tree that carries
   the MIT grant (local `main`, or `76adfdc` for the dashboard, which has no licence file but the same
   author). Pushing local `main`, or stating the grant in the new repository's history, removes the
   ambiguity of F7.
4. **Specstride Apache-2.0 → MIT.** As sole author of the baseline the owner may license the same work
   under MIT. Copies already published under Apache-2.0 stay available under Apache-2.0. Two
   consequences to accept knowingly: MIT has no express patent grant, and `CONTRIBUTING.md` must change
   from "Apache-2.0" to "MIT" before any outside contribution is accepted. If the branch in F2 under a
   second identity is ever merged, confirm that identity is the owner's or obtain the contributor's
   agreement first.
5. **mixture-of-loops** needs a licence only if its repository stays public; the new product does not
   copy its Python.
6. **Third-party notices.** Keep the Spec Kit templates' MIT notice next to any templates that ship
   (F5). Generate a third-party notice file from the production closure in CI and fail the build on a
   licence outside an allowlist.

**F-F3. Dependency constraints on distribution** (tag: `inferred` from F8, F9, F11)

- The Claude adapter may **depend on** the Agent SDK as a normal or peer dependency that the consumer's
  npm installs. It must not be **bundled** into a single-file plugin or redistributed inside the
  Specstride package, because its terms are not MIT. This constrains R3's packaging options and R5's
  choice between the SDK and `claude -p`.
- `prime-agent` must be an optional dependency of a separate adapter package, never of the core
  install: a tarball URL dependency and native builds would break `npm install` for consumers who do
  not use it.
- `better-sqlite3` is a native module. If `persistence` is ever adopted, it needs prebuilt binaries for
  Linux and macOS and an entry equivalent to the Language Ledger.

## Version/date pins

| Item | Value | Verified on |
|---|---|---|
| Lisa baseline of spec 002 | `76adfdcbea7f236c9a93cb4a25f3d5205caa01df`, 2026-09-28 00:20 +0400 | 2026-09-29 |
| Lisa local `main` | `363e6a392ff6e59ec4905c044fb3b0a5239cbffc`, 2026-09-27 22:19 +0400 | 2026-09-29 |
| Merge base of the two | `6dc29708d64db528369f0da82ed2f600fd21de5b`, 2026-07-27 | 2026-09-29 |
| Specstride baseline | `9cab15d` | 2026-09-29 |
| mixture-of-loops baseline | `9c88f86` | 2026-09-29 |
| Lisa toolchain | Node ≥ 22.8.0, pnpm 11.17.0, TypeScript ^5.7.2, vitest ^2.1.8 (root `package.json`) | 2026-09-29 |
| `@anthropic-ai/claude-agent-sdk` | 0.3.220 installed (`^0.3.220` declared) | 2026-09-29 |
| `@anthropic-ai/sdk` | 0.115.0 | 2026-09-29 |
| `prime-agent` | 0.7.1, release tarball | 2026-09-29 |
| `zod` | 4.4.3 | 2026-09-29 |
| `react`, `react-dom` | 19.2.8 | 2026-09-29 |
| `better-sqlite3` | 13.0.1 | 2026-09-29 |
| `fastify` / `ws` / `@modelcontextprotocol/sdk` | 5.10.0 / 8.21.1 / 1.29.0 | 2026-09-29 |

## Options compared

| Criterion | A. Lisa as the base (rename and extend in place) | B. Selective extraction into a new codebase | C. No reuse (reference only) |
|---|---|---|---|
| 028 parity (decision 1, 4) | 12 FRs absent, 15 divergent; the loop must be reopened for each (C7) | Engine written to 028's behaviour; Lisa primitives slot in | Same as B for the engine |
| 011 parity | 21 of 27 absent | Same work | Same work |
| Evolvability | Closed event list, closed outcome union, closed CLI-harness list, closed plugin kinds must all be opened | Seams designed first; extracted modules are leaf functions | Seams designed first |
| Decisions 8, 21, 22, 23 | None expressible in the current loop (C7–C10) | Designed in | Designed in |
| Greenfield state (decision 3) | `.lisa` and `LISA_*` in 14 CLI files and 8 core files | Renamed during extraction | Not applicable |
| Code saved | Most of 48k lines kept, of which about 60 % serves features no as-is FR of 028/011 needs (jobs, plans, approvals, RPC, SQLite, scheduler) | About 11k lines plus their tests | 0 |
| Risk carried in | Unwired packages presented as features (B2); machine-specific names (B4); Linux-only stop (B5) | Each extracted module gets characterization tests first | Re-deriving grounding (761 lines, many edge cases) and the nonce parser invites regressions |
| Licence | Same as B | MIT, owner's own code; two dependency constraints (F-F3) | None |
| Dependency weight for consumers | Whole closure incl. native modules | `zod` plus the Claude SDKs for Wave 1 | Chosen freely |

## Recommendation

**Option B: selective extraction. Do not adopt Lisa as the base, and do not depend on it as a
package.** Confidence: **high** that Lisa should not be the base (the evidence in F-C and F-D is
direct); **medium** on the exact extraction list, because no Lisa test was executed for this report.

1. **Tree.** Extract from local `main` (`363e6a3`) for every package except `dashboard`; extract
   dashboard modules from `76adfdc`.
2. **Wave 1, extract** (each behind a characterization test written before the copy, per decision 4):
   `core/critic/verdict.ts`, `core/critic/grounding.ts`, `core/gates/store.ts`, the exit-code table of
   `core/engine/lifecycle.ts`, `core/engine/proposer-context.ts`, the one-emit-two-encodings pattern
   of `core/events/journal.ts` (as the compatibility projection named in §2), `specs` adapters and
   `resolve.ts`, `verification`, `agents/provider.ts` with the Claude SDK harness, tap and the two
   completion adapters, `otel`, `scheduler/stop*.ts` and `budgets.ts`, `tui/presenter.ts`, and
   `cli/commands/doctor.ts` as the model for the doctor.
3. **Wave 1, reimplement:** the phase loop (as an engine with strategy seams for rejection handling,
   attempt kind, pass outcome and the micro-loop layer), the CLI and config, the generic CLI adapter.
4. **Wave 2, extract:** `web` tokens and pure view-model builders, `dashboard/trajectory.ts`.
5. **Roadmap, not now:** scheduler queue, cron, safety, worktrees (R26); approvals and escalation;
   hooks; memory (R12); `persistence`, `rpc`, `server`.
6. **Drop:** `sdk`, `workflow`, `plugins/registry.ts`.
7. **When extracting:** remove the names in B4, add a macOS process-tree walk (B5), add fail-fast to the
   verification executor (B6), add glob expansion to grounding (B7), and fix attempt-directory reuse
   (C8).

Cost of choosing B over A, stated as the brief asks: about 37 000 lines of working, tested Lisa code
are left behind, including a scheduler and an approval system that may be wanted later and would then
be extracted from a codebase that has stopped moving.

## Matrix rows

None. Lisa's adapters are evidence for R5 (Claude), R9 (prime) and R20 (generic adapter); those
reports own the rows.

## Open questions / risks

| # | Item | For `DECISIONS-PENDING.md`? |
|---|---|---|
| O1 | **Which Lisa.** The owner believes local `main` is current. For `packages/dashboard` it is three feature commits behind `76adfdc` (A4). **Default:** `main` for 18 packages, `76adfdc` for dashboard. **If the owner rules "`main` only":** `002 FR-051`, `002 SC-007`, the `TrajectoryRecord` entity and the trajectory route get the disposition "dropped, not in the current tree", and the Wave 2 extraction of `trajectory.ts` is removed. **If the owner rules "`76adfdc` only":** nothing in this audit changes except that the MIT grant must be added by hand. | **Yes** |
| O2 | **R1 recommends against reusing Lisa as the base** (one of the cases §3 expects). Default: option B. If the owner chooses A, the gap tables in F-D become the work list and decisions 8, 21, 22 and 23 each need a redesign of `phase-loop.ts`. | **Yes** |
| O3 | **Decision 19 and the Claude Agent SDK.** The SDK is proprietary (F8). Depending on it is compatible with an MIT product; bundling it is not. Default: depend, never bundle. If R3 recommends a single-file bundled plugin, the Claude adapter must use `claude -p` or load the SDK from the consumer's install. | **Yes** |
| O4 | **Copyright holder name and the second identities** (F-F2 items 1 and 4, F2). Default: one legal name; branches under other identities are not merged until confirmed. | **Yes** (owner action, no design impact) |
| O5 | No Lisa test, build or lint was run, because running them writes into the source repository. Whether the 139 test files pass at either tree is `unverified`. R1v or the first extraction step should run them in a scratch clone. | No |
| O6 | The "about 11 000 lines" extraction figure is the sum of whole-file line counts; R2 owns the estimate and should replace it. | No |
| O7 | Lisa's constitution is untracked on `main` (A8). The constitution amendment work should read it from `76adfdc` (`git show 76adfdc:specs/memory/constitution.md`). | No |
| O8 | `lib/speckit_templates` in Specstride is third-party MIT (F5). If the TypeScript product ships Spec Kit templates, the notice must ship with them. | No |
| O9 | The dependency closures in F9 and F11 were computed from the installed tree on Linux x64. Optional platform packages for other systems were not installed and were not inspected. | No |
