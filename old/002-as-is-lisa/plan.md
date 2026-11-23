# Implementation Plan: Lisa — As-Is Behavior (reverse-engineered at 76adfdc)

**Branch**: `002-as-is-lisa` (label only; no branch was created) | **Date**: 2026-09-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `old/002-as-is-lisa/spec.md`

**Note**: This plan describes the repository as it exists at commit `76adfdcbea7f`. It is an as-is record, not a design for new work. Every fact cites a `lisa-76adfdc`-relative source path. Where the repository's own declared plan (`specs/plan.md`) disagrees with the manifests or source, the source wins, and the disagreement is recorded in `research.md`.

## Summary

Lisa is a TypeScript pnpm monorepo for specification-driven agent orchestration. It has 19 workspace packages matched by the `packages/*` glob (`pnpm-workspace.yaml:4-5`). The core is a gated proposer → critic phase loop. The loop keeps its durable state as files under `.lisa/` and uses SQLite only as a rebuildable index (`packages/persistence/src/index-db.ts:1-13`). Around that loop sit several edges: a CLI (`packages/cli/bin/lisa.mjs`), a Fastify HTTP/WebSocket server (`packages/server/src/api.ts:23`), a React + Vite dashboard (`packages/dashboard/package.json:13-26`), a scheduler, spec-format adapters, a verification planner, provider adapters, and best-effort telemetry forwarders. `research.md` lists the technical decisions visible in the code. Each decision has evidence, and any rationale that the repository does not record is marked `unknown`.

## Technical Context

**Language/Version**: TypeScript `^5.7.2` (`package.json:27`) with strict compiler settings, ES2022 target, and NodeNext ESM modules (`tsconfig.base.json:5-19`). Node.js `>=22.8.0` and pnpm `>=9` are required (`package.json:7-10`). The pinned package manager is `pnpm@11.17.0` (`package.json:11`), and CI runs Node 22 (`.github/workflows/ci.yml:23-26`). The `lisa` executable and the per-package `demo-*.mjs` scripts are plain ESM JavaScript. One Python file, `packages/testkit/src/characterization/verify_parity.py`, exists in the test kit.

**Primary Dependencies**:
- `zod ^4.4.3` in core, specs, rpc, server, agents and sdk (`packages/core/package.json:19-21`).
- `@anthropic-ai/claude-agent-sdk ^0.3.220`, `@anthropic-ai/sdk ^0.115.0`, and `prime-agent` from a release-tarball URL, all in `packages/agents` (`packages/agents/package.json:19-24`).
- `better-sqlite3 ^13.0.1` in `packages/persistence/package.json:19-26`.
- `fastify ^5.10.0`, `ws ^8.18.0` and `@modelcontextprotocol/sdk ^1.29.0` in `packages/server/package.json:19-30`.
- `react`/`react-dom ^19.2.0` with `vite 5.4.21`, `@vitejs/plugin-react 4.3.4` and `rollup 4.24.0` pinned in `packages/dashboard/package.json:13-26`.
- `@lisa/otel` and `@lisa/hooks` have no dependencies (`packages/otel/package.json:1-19`).
- No OpenTelemetry SDK, PostgreSQL driver, Temporal SDK or Ink dependency appears in any `packages/*/package.json`.

**Storage**:
- Files on disk under `.lisa/` are the durable state. This includes the workspace lock `lock.d/` (`packages/cli/src/layout.ts:1-20`), gate evidence and approval markers (`packages/core/src/gates/store.ts:97-129`), attempts, approvals and journals.
- `index.db` is an SQLite index in WAL mode that `rebuildFromDisk()` can rebuild from those files (`packages/persistence/src/index-db.ts:77-180`).
- Specification bundles and verification plans are stored as content-hashed JSON (`packages/persistence/src/specification-bundle-store.ts:464-502`, `packages/verification/src/store.ts:84-130`).

**Testing**:
- Vitest `^2.1.8` (`package.json:29`) runs as a single workspace project, `lisa`. It picks up `packages/*/src/**/*.{test,spec}.{ts,tsx}` and `packages/*/test/**` in a `node` environment (`vitest.workspace.ts:7-22`).
- CI runs `pnpm build`, `pnpm test` and `pnpm lint` as separate jobs (`.github/workflows/ci.yml:16-55`).
- Mergify gates its merge queue on those three checks (`.mergify.yml:1-12`).
- None of these were executed for this record.

**Target Platform**: Node.js ≥ 22.8 on a Linux-style host. This is inferred from the CI `ubuntu-latest` runners (`.github/workflows/ci.yml:19`) and from the POSIX `mkdir`-lock and `git worktree` primitives (`packages/cli/src/layout.ts:112-135`, `packages/scheduler/src/worktrees.ts:112-130`). The dashboard dev and preview server binds port 13000 and proxies `/api` to `127.0.0.1:13001` (`packages/dashboard/vite.config.ts:10-23`). An optional Grafana/Loki/Tempo/Prometheus/OTel-collector stack is defined in `telemetry/docker-compose.yml`.

**Project Type**: pnpm monorepo that ships:
- a CLI (`packages/cli/package.json` bin `lisa`),
- libraries (the `@lisa/*` packages export `./dist/index.js`),
- an HTTP/WebSocket/MCP server (`packages/server`),
- a web dashboard (`packages/dashboard`, `packages/web`),
- a TUI presenter (`packages/tui`).

**Performance Goals**: No executable performance target is enforced in source. Bounded behaviors that are observed:
- The trajectory page limit is clamped to [1, 500], with a default of 50 (`packages/dashboard/src/trajectory.ts:578-585`).
- The critic grounding snapshot is capped at `GROUNDING_MAX_FILES` (`packages/core/src/critic/grounding.ts:379-403`).
- The "within 2 s" live-view goal in `specs/plan.md:59-61` is declared only. It is unverified here.

**Constraints**:
- Fixed exit codes: 0 OK, 1 INTERNAL, 2 REJECTS, 3 SPEC, 4 BUDGET, 5 LOCK, 6 STOP (`packages/core/src/engine/lifecycle.ts:24-68`).
- One run per workspace, enforced by an atomic `mkdir` of `.lisa/lock.d` with dead-owner reclaim (`packages/cli/src/layout.ts:112-135`).
- Critic verdicts are nonce-bound and fail safe (`packages/core/src/critic/verdict.ts:40-81`).
- Evidence is written atomically with tmp → fsync → rename (`packages/core/src/gates/store.ts:97-129`).
- Journal sinks never throw (`packages/core/src/events/journal.ts:345-366`).
- Hooks fail closed at blockable points (`packages/hooks/src/runner.ts:282-310`).

**Scale/Scope**: 613 inventoried text files, 115,494 lines in total. There are 320 TypeScript files and 20 `package.json` units, of which 19 match the `packages/*` workspace glob (`.specstride/reverse/lisa/INVENTORY.md`). Runtime scale limits such as users or jobs are not declared in source (unknown).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The constitution is `.specify/memory/constitution.md`, a symlink to `specs/memory/constitution.md` (v2.0.0, prescriptive). Each principle below is compared with what the code at `76adfdc` does. "Observed" means source enforces it. "Not verified" means this read-only pass could not confirm it without running the code.

| Principle | As-is observation | Status |
|-----------|-------------------|--------|
| I. Durable state on disk, no watcher | Tmp+fsync+rename evidence, and gates are bare file-existence checks (`packages/core/src/gates/store.ts:97-129`). Resume is derived from the first phase that has no `GATE<N>-APPROVED` marker (`packages/core/src/gates/store.ts:156-161`). SQLite is rebuilt from disk (`packages/persistence/src/index-db.ts:1-13`). | Observed |
| II. Adversarial, non-self-approving gate | Each review gets a fresh 16-hex nonce. Missing, duplicate or wrong-nonce verdicts are MALFORMED, which counts as rejected (`packages/core/src/critic/verdict.ts:40-81`). A transport error becomes MALFORMED (`packages/core/src/engine/phase-loop.ts:653-667`). | Observed |
| III. Grounded, read-only verification | The grounding snapshot lists each cited path's presence up to a cap (`packages/core/src/critic/grounding.ts:379-403`). Verification execution defaults to `off` (`packages/cli/src/commands/run.ts:124-138`). | Observed (sandbox not verified) |
| IV. Single source of spec grammar | One registry holds five adapters: native, wiggum, speckit-tasks, openspec, chat (`packages/specs/src/registry.ts:877-884`). | Observed |
| V. Best-effort observability | Journal sink exceptions are swallowed (`packages/core/src/events/journal.ts:345-366`). The `@lisa/otel` header declares its forwarders best-effort (`packages/otel/src/index.ts:1-4`). | Observed |
| VI. Typed core, replaceable edges | `@lisa/core` depends only on `zod` (`packages/core/package.json:19-21`). Provider SDKs are confined to `@lisa/agents` (`packages/agents/package.json:19-24`). Strict TS is set in `tsconfig.base.json:11-19`. A clean-clone `pnpm install && pnpm build && pnpm test` was not run. | Observed (build not verified) |
| VII. Immutable inputs, versioned derivations | Bundles and verification plans are hash-bound and re-verified on read (`packages/persistence/src/specification-bundle-store.ts:546-589`, `packages/verification/src/store.ts:84-130`). Approvals are refused when the target hash is stale (`packages/core/src/domain/approvals.ts:147-163`). | Observed |
| VIII. Deterministic parallelism | Five admission gates: dependencies, write_scope, resource_class, budget, human_block (`packages/scheduler/src/safety.ts:158-176`). | Observed |
| IX. Evidence and provenance | Verification plans render with a provenance section (`packages/verification/src/render.ts:30-53`). | Observed |
| X. Compatibility before capability | A characterization suite exists under `packages/testkit/src/characterization/`. Whether it passes was not verified (no tests were executed). | Not verified |

No principle is observed to be violated, so *Complexity Tracking* stays empty. The repository contains `.mjs` and one `.py` file at tooling edges (demo scripts, `verify_parity.py`). The constitution allows other languages "only at demonstrated-need edges", so these are recorded here as an observation, not as a violation.

## Project Structure

### Documentation (this feature)

```text
old/002-as-is-lisa/
├── plan.md              # This file (as-is technical context)
├── research.md          # As-is technical decisions with evidence
├── spec.md              # As-is behavior specification (phase 1)
└── checklists/
    └── requirements.md  # Spec quality checklist (phase 1)
```

### Source Code (repository root)

```text
lisa-76adfdc/
├── package.json               # root scripts: build/test/lint/format; engines node>=22.8, pnpm>=9
├── pnpm-workspace.yaml        # workspaces: packages/*; allowBuilds; rollup override
├── tsconfig.base.json         # strict ES2022/NodeNext baseline
├── tsconfig.json              # tsc -b solution referencing every package
├── vitest.workspace.ts        # single "lisa" Vitest project
├── eslint.config.js
├── .github/workflows/ci.yml   # build / test / lint jobs
├── .mergify.yml               # merge queue gated on build/test/lint
├── .specify/                  # Spec Kit templates, scripts, constitution symlink
├── packages/
│   ├── core/          # @lisa/core — src/{critic,domain,engine,events,gates,plan}; zod only
│   ├── specs/         # @lisa/specs — format registry; src/{bundle,chat,openspec,reverse,speckit,wiggum}; test/
│   ├── verification/  # @lisa/verification — planner, store, render, executor, scaffold
│   ├── agents/        # @lisa/agents — src/{anthropic,claude-agent-sdk,openai-compat,prime-agent}
│   ├── workflow/      # @lisa/workflow — embedded engine; Temporal scaffold behind WorkflowEngine
│   ├── scheduler/     # @lisa/scheduler — queue, safety, budgets, cron, stop, worktrees
│   ├── memory/        # @lisa/memory — store, learn
│   ├── hooks/         # @lisa/hooks — hook runner (fail-closed)
│   ├── plugins/       # @lisa/plugins — registry, skills
│   ├── otel/          # @lisa/otel — Loki/OTLP forwarders, tracer, metrics (no deps)
│   ├── persistence/   # @lisa/persistence — SQLite index-db, bundle store, wiggum import
│   ├── rpc/           # @lisa/rpc — method registry over ws
│   ├── server/        # @lisa/server — Fastify api, chat, rules, spec/verification services
│   ├── web/           # @lisa/web — React App, galaxy view, theme
│   ├── dashboard/     # @lisa/dashboard — Vite+React control room, trajectory, server.ts
│   ├── tui/           # @lisa/tui — presenter, modes, watch-client
│   ├── cli/           # @lisa/cli — bin/lisa.mjs, src/commands, layout (lock), demo-*.mjs
│   ├── testkit/       # @lisa/testkit — adversarial tests, characterization (incl. verify_parity.py)
│   └── sdk/           # @lisa/sdk — client, transport, resilience; examples/consumer-smoke (own package.json, outside the `packages/*` glob)
├── specs/             # existing Spec Kit features (001-*, root plan/spec/tasks, memory/constitution.md)
├── telemetry/         # docker-compose.yml + config for grafana/loki/otel-collector/prometheus/tempo
├── scripts/           # bringup.sh, fixture/golden generators (.mjs)
├── docs/
├── wiki/
├── roadmap/
├── examples/
├── artifacts/
├── testautomation/
├── README.md
├── AGENTS.md
├── TASK.md
├── REFACTOR.md
└── SPECS.md
```

**Structure Decision**: The repository is a single pnpm workspace, `packages/*` (`pnpm-workspace.yaml:4-5`). It is built as one TypeScript project graph through `tsconfig.json` references to all 19 packages. Unit tests sit next to the source as `*.test.ts` files under each `packages/<name>/src/`. Only `packages/specs` also has a `test/` directory with fixtures. There are no top-level `src/`, `backend/` or `frontend/` directories. The web front ends are the `packages/web` and `packages/dashboard` workspace members.

## Complexity Tracking

None. No Constitution Check principle was observed to be violated.
