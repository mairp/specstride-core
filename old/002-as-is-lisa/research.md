# Research: Lisa — As-Is Technical Decisions (reverse-engineered at 76adfdc)

**Feature**: `002-as-is-lisa` | **Date**: 2026-09-28 | **Plan**: [plan.md](./plan.md)

This file records technical decisions that are already built into the code at `76adfdcbea7f`. It is not a list of proposals. Each entry has four parts:

- Decision (bold in each entry): what the source does now. The evidence comment on the next line cites executable source or configuration, so every decision is evidenced.
- **Rationale**: why the decision was made, recovered only from what the repository states. Each rationale names its source, which is either a code comment or the constitution (`specs/memory/constitution.md`, which `.specify/memory/constitution.md` symlinks to). When the repository records no reason, the rationale is written `unknown`.
- **Alternatives**: only alternatives the repository itself names as rejected or deferred. When none are named, this is written `unknown`.
- Disagreements between declared intent and the source are recorded in `contradicts=`, and the source is treated as authoritative.

The two sections below keep decisions with a recovered rationale apart from decisions whose rationale is unknown.

## A. Evidenced decisions with a recorded rationale

- **Decision**: Durable run state is kept as files under `.lisa/`. Gate evidence is written tmp → fsync → rename, and a gate is passed when an approval marker file exists.
  <!-- evidence: packages/core/src/gates/store.ts:97-129 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
  **Rationale**: Constitution I says progress is coordinated through durable markers on disk and that evidence appears atomically, so the gate never sees a half-written file (`specs/memory/constitution.md:16-28`).
  **Alternatives**: Constitution I names three rejected mechanisms: an inotify watcher, a message queue, and an in-memory counter (`specs/memory/constitution.md:18-19`).

- **Decision**: The resume phase is derived from disk. It is the first phase that has no `GATE<N>-APPROVED` marker; no counter is stored.
  <!-- evidence: packages/core/src/gates/store.ts:156-161 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
  **Rationale**: Constitution I says the resume position is derived from markers and never read from a stored counter (`specs/memory/constitution.md:21-22`).
  **Alternatives**: A stored resume counter is named as rejected (`specs/memory/constitution.md:21-22`).

- **Decision**: SQLite (`better-sqlite3`, WAL mode) is used only as an index. `rebuildFromDisk()` drops every table and repopulates them from the on-disk files.
  <!-- evidence: packages/persistence/src/index-db.ts:1-13, packages/persistence/src/index-db.ts:77-185 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
  **Rationale**: The module header says the database "is an INDEX, never the source of truth" and that `index.db` may be deleted at any time (`packages/persistence/src/index-db.ts:1-13`).
  **Alternatives**: The constitution names PostgreSQL for server mode (`specs/memory/constitution.md:23-24`). No PostgreSQL driver appears in any package manifest, so that alternative exists only as a declaration.

- **Decision**: One run per workspace is enforced by an atomic `mkdir` of `.lisa/lock.d`. A lock whose owner process is dead is reclaimed. A held lock yields the distinct exit code 5.
  <!-- evidence: packages/cli/src/layout.ts:112-135 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
  **Rationale**: The layout header states that the lock uses atomic `mkdir` and that dead owners are reclaimed so that a restart recovers automatically (`packages/cli/src/layout.ts:1-20`, `packages/cli/src/layout.ts:126-135`).
  **Alternatives**: `flock` is named as not used ("No flock dependency", `packages/cli/src/layout.ts:15-18`).

- **Decision**: Critic verdicts are bound to a fresh 8-byte (16-hex) nonce per review. Only a single line `VERDICT <nonce>: APPROVED` approves. A missing, duplicate or wrong-nonce verdict is MALFORMED and fails safe as a rejection.
  <!-- evidence: packages/core/src/critic/verdict.ts:40-81 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
  **Rationale**: Constitution II says the authoring role can never approve its own work, and that a spoofed approval string inside evidence can never pass (`specs/memory/constitution.md:30-37`).
  **Alternatives**: unknown

- **Decision**: The exit-code set is fixed as OK=0, INTERNAL=1, REJECTS=2, SPEC=3, BUDGET=4, LOCK=5, STOP=6.
  <!-- evidence: packages/core/src/engine/lifecycle.ts:24-68 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
  **Rationale**: The comment says the vocabulary is "PRESERVED … carried verbatim from the Wiggum baseline" (`packages/core/src/engine/lifecycle.ts:1-12`). This matches the constitution's fixed exit-code contract (`specs/memory/constitution.md:123-124`).
  **Alternatives**: unknown

- **Decision**: `@lisa/core` has one runtime dependency, `zod`. Provider SDKs (`@anthropic-ai/claude-agent-sdk`, `@anthropic-ai/sdk`, `prime-agent`) are confined to `@lisa/agents`.
  <!-- evidence: packages/core/package.json:19-21, packages/agents/package.json:19-24 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
  **Rationale**: Constitution VI says the core domain depends on zero provider SDKs, workflow engines, storage drivers or UI frameworks, and that integrations are replaceable adapters (`specs/memory/constitution.md:73-86`).
  **Alternatives**: The constitution records that v1 "Stdlib-Only, Clone-and-Run" was superseded for TypeScript (`specs/memory/constitution.md:73-76`).

- **Decision**: The OpenAI-compatible provider path calls `fetch` directly and has no SDK dependency. A `CliHarness` that shells out to agent CLIs serves as the legacy fallback.
  <!-- evidence: packages/agents/src/openai-compat/completion.ts:1-19 | kind=observed | confidence=0.85 | contradicts=specs/plan.md:33-36 | validation=verified -->
  **Rationale**: The header explains that the baseline critic spoke this exact wire with stdlib urllib, and that the CLI harness is used when the Agent SDK is unavailable (`packages/agents/src/openai-compat/completion.ts:11-19`).
  **Alternatives**: `specs/plan.md:33-36` declares "an OpenAI-compatible client", but no such client package is a dependency.

- **Decision**: All specification formats go through one registry with five adapters: native, wiggum, speckit-tasks, openspec and chat.
  <!-- evidence: packages/specs/src/registry.ts:877-884 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
  **Rationale**: Constitution IV says a new format is a new adapter, never a second parser (`specs/memory/constitution.md:53-58`).
  **Alternatives**: A second parser elsewhere is named as rejected (`specs/memory/constitution.md:56`).

- **Decision**: Journal writes and telemetry forwarders are best-effort. Exceptions from either journal sink are swallowed, and `@lisa/otel` pushes to Loki and OTLP with an injectable `fetch` and has no dependencies.
  <!-- evidence: packages/core/src/events/journal.ts:345-366, packages/otel/src/index.ts:1-4, packages/otel/package.json:1-19 | kind=observed | confidence=0.85 | contradicts=specs/plan.md:38 | validation=verified -->
  **Rationale**: Constitution V says observability must never stall or fail a run (`specs/memory/constitution.md:62-71`). The `@lisa/otel` header states the same (`packages/otel/src/index.ts:1-4`).
  **Alternatives**: `@opentelemetry/sdk-node` plus OTLP exporters are declared in `specs/plan.md:38`. They are absent from `packages/otel/package.json`, so the declared plan contradicts the code.

- **Decision**: Hooks fail closed at blockable points. Exit code 2 blocks, and any other non-clean outcome blocks with `failedClosed=true` unless the hook opts into `failurePolicy: "open"`.
  <!-- evidence: packages/hooks/src/runner.ts:282-310 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
  **Rationale**: The runner header says that, per FR-057, a blockable point MUST fail closed (`packages/hooks/src/runner.ts:14-20`). The constitution says the same (`specs/memory/constitution.md:129`).
  **Alternatives**: A fail-open policy is available only by explicit opt-in (`packages/hooks/src/runner.ts:14-20`).

- **Decision**: Parallel admission requires five gates to pass: dependencies, write_scope, resource_class, budget and human_block.
  <!-- evidence: packages/scheduler/src/safety.ts:158-176 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
  **Rationale**: Constitution VIII says parallel execution is permitted only after deterministic dependency and resource-conflict checks (`specs/memory/constitution.md:97-102`).
  **Alternatives**: unknown

- **Decision**: The workflow-engine boundary has one finished implementation, `EmbeddedWorkflowEngine`. `TemporalWorkflowEngine` is only scaffolded behind the same interface, and no Temporal SDK is a dependency.
  <!-- evidence: packages/workflow/src/engine.ts:1-20 | kind=observed | confidence=0.80 | contradicts=specs/plan.md:39 | validation=verified -->
  **Rationale**: The header says the durable-execution backend is a replaceable adapter, and that `@lisa/core` never learns which one is mounted (`packages/workflow/src/engine.ts:1-6`).
  **Alternatives**: A Temporal/PostgreSQL server mode is named as the scaffolded, not finished, alternative (`packages/workflow/src/engine.ts:17-18`).

## B. Evidenced decisions with unknown rationale

- **Decision**: The monorepo uses pnpm workspaces over the single glob `packages/*`, with `packageManager` pinned to `pnpm@11.17.0`.
  <!-- evidence: pnpm-workspace.yaml:4-5, package.json:11 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
  **Rationale**: unknown. The constitution only says "pnpm monorepo per plan.md" and gives no reason for choosing pnpm.
  **Alternatives**: unknown

- **Decision**: TypeScript is compiled with a strict ES2022 / NodeNext ESM baseline that includes `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. It is built as a `tsc -b` project-reference graph.
  <!-- evidence: tsconfig.base.json:4-30, tsconfig.json:1-24 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
  **Rationale**: unknown. Strictness is mandated by Constitution VI, but no reason is recorded for ES2022, NodeNext, or these specific extra flags.
  **Alternatives**: unknown

- **Decision**: Tests run on Vitest as one workspace project named `lisa`, in the `node` environment. They are colocated `*.test.ts` files under `packages/*/src` and `packages/*/test`.
  <!-- evidence: vitest.workspace.ts:7-22, package.json:14 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
  **Rationale**: unknown
  **Alternatives**: unknown

- **Decision**: The HTTP API is built on Fastify 5, with `ws` for WebSockets and `@modelcontextprotocol/sdk`, inside `@lisa/server`. `@lisa/rpc` defines JSON-RPC 2.0 methods over a Unix-domain socket.
  <!-- evidence: packages/server/package.json:19-30, packages/server/src/api.ts:134-174, packages/rpc/src/index.ts:1-4 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
  **Rationale**: unknown
  **Alternatives**: unknown

- **Decision**: The dashboard is React 19 served by Vite. Vite `5.4.21`, `@vitejs/plugin-react 4.3.4` and `rollup 4.24.0` are pinned exactly, and a workspace-wide `rollup` override also pins 4.24.0.
  <!-- evidence: packages/dashboard/package.json:13-26, pnpm-workspace.yaml:16-17 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
  **Rationale**: unknown. The introducing commit `1131335` ("feat(dashboard): add standalone execution control room") gives no reason for the exact pins.
  **Alternatives**: unknown

- **Decision**: The dashboard dev and preview server binds port 13000 with `strictPort` and proxies `/api` to `127.0.0.1:13001`.
  <!-- evidence: packages/dashboard/vite.config.ts:10-23 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
  **Rationale**: unknown
  **Alternatives**: unknown

- **Decision**: `prime-agent` is installed from an immutable GitHub release-tarball URL, and the native builds it and other packages need are allow-listed.
  <!-- evidence: pnpm-workspace.yaml:6-15, packages/agents/package.json:23 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->
  **Rationale**: unknown. The workspace comment says only what is done ("pins its branded component tarballs by immutable release URLs"), not why.
  **Alternatives**: unknown

- **Decision**: CI runs three independent GitHub Actions jobs (build, test, lint) on Node 22 with `pnpm install --frozen-lockfile`. Mergify queues only PRs labelled `automerge` once all three checks pass.
  <!-- evidence: .github/workflows/ci.yml:16-55, .mergify.yml:1-23 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
  **Rationale**: unknown
  **Alternatives**: unknown
