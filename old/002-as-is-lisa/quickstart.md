# Quickstart: Lisa (as-is at 76adfdc)

Every command below is copied from a manifest (`package.json` scripts, `bin`) or from the repository documentation (`README.md`). **None of them was run.** This reverse run is read-only: no install, no build, no tests and no services.

Each command is labelled *not executed by the reverse run*, and each carries the same label as a trailing shell comment. Their outcomes are not observed here.

## Prerequisites (declared)

<!-- evidence: package.json:7-18, README.md:32-36 | kind=declared | confidence=0.80 | contradicts=package.json:7-10 | validation=unverified -->

- **Node.js**: `package.json` `engines` declares `node >=22.8.0`. The README says "Node.js ≥ 22 (LTS)". The two differ in the minor version, so this is recorded as a contradiction.
- **pnpm**: `>=9`, with `packageManager: pnpm@11.17.0`.
- **Git** is needed for the worktree and checkpoint features.
- **Docker** is used only by the telemetry stack.

## 1. Install and build the workspace

<!-- evidence: README.md:38-44, package.json:12-18 | kind=declared | confidence=0.80 | contradicts=none | validation=unverified -->

*not executed by the reverse run*: copy the provider configuration template.

```bash
cp .env.example .env   # not executed by the reverse run
```

*not executed by the reverse run*: install dependencies.

```bash
pnpm install   # not executed by the reverse run
```

*not executed by the reverse run*: build, using the root script `pnpm -r --if-present run build`.

```bash
pnpm build   # not executed by the reverse run
```

*not executed by the reverse run*: run the test suite, using the root script `vitest run`.

```bash
pnpm test   # not executed by the reverse run
```

*not executed by the reverse run*: lint and check formatting, using the root scripts `eslint .` and `prettier --check .`.

```bash
pnpm lint   # not executed by the reverse run
pnpm format:check   # not executed by the reverse run
```

## 2. Launch a run behind the critic gate

<!-- evidence: README.md:70-74, packages/cli/package.json:1-20, packages/cli/src/index.ts:502-538 | kind=declared | confidence=0.80 | contradicts=none | validation=unverified -->

*not executed by the reverse run*: run a spec file. The `lisa` binary is `packages/cli/bin/lisa.mjs`.

```bash
lisa run -s specs/SPECS.md   # not executed by the reverse run
```

*not executed by the reverse run*: run a Spec Kit `tasks.md` with an explicit format.

```bash
lisa run --spec-format speckit-tasks -s tasks.md   # not executed by the reverse run
```

## 3. Import a Spec Kit project and plan verification

<!-- evidence: README.md:82-90, README.md:120-134 | kind=declared | confidence=0.80 | contradicts=none | validation=unverified -->

*not executed by the reverse run*: import a feature directory as one SpecificationBundle v2. Both paths must be absolute.

```bash
lisa spec import-project /abs/project/specs/001-feature --workdir /abs/project --method speckit --require-traceability --json   # not executed by the reverse run
```

*not executed by the reverse run*: create the hash-bound TEST_PLAN from the returned identity.

```bash
lisa verification plan --workdir /abs/project --bundle-id BUNDLE_ID --expected-content-hash CONTENT_HASH --output /abs/project/testautomation/TEST_PLAN.md --required   # not executed by the reverse run
```

*not executed by the reverse run*: run the bundle with required verification.

```bash
lisa run --workdir /abs/project --bundle-id BUNDLE_ID --expected-content-hash CONTENT_HASH --verification required --test-plan /abs/project/testautomation/TEST_PLAN.md   # not executed by the reverse run
```

## 4. Inspect, stop, resume and approve

<!-- evidence: packages/cli/src/index.ts:502-538, README.md:416-427 | kind=declared | confidence=0.80 | contradicts=none | validation=unverified -->

*not executed by the reverse run*: read the run state and events.

```bash
lisa status   # not executed by the reverse run
lisa events --follow   # not executed by the reverse run
```

*not executed by the reverse run*: request a clean stop, then resume from the on-disk markers.

```bash
lisa stop   # not executed by the reverse run
lisa resume   # not executed by the reverse run
```

*not executed by the reverse run*: list pending approvals and decide one against its current hash.

```bash
lisa approvals --json   # not executed by the reverse run
lisa approve <id> --note <text>   # not executed by the reverse run
```

*not executed by the reverse run*: run diagnostics.

```bash
lisa doctor   # not executed by the reverse run
```

## 5. Control plane and dashboard

<!-- evidence: packages/cli/src/index.ts:502-538, packages/cli/src/commands/serve.ts:137-169, packages/dashboard/package.json:7-12 | kind=declared | confidence=0.75 | contradicts=none | validation=unverified -->

*not executed by the reverse run*: start the management daemon. `--port` adds the HTTP and WebSocket host. Tokens come from `LISA_SERVER_TOKENS`.

```bash
lisa serve --port <N>   # not executed by the reverse run
```

*not executed by the reverse run*: start the dashboard API (port 13001 by default) and the web UI (port 13000). These are the dashboard package scripts.

```bash
pnpm --filter @lisa/dashboard start:api   # not executed by the reverse run
pnpm --filter @lisa/dashboard dev   # not executed by the reverse run
```

## 6. Optional telemetry stack

<!-- evidence: README.md:393-399 | kind=declared | confidence=0.75 | contradicts=none | validation=unverified -->

*not executed by the reverse run*: bring up Loki, the OTLP collector, Prometheus, Tempo and Grafana.

```bash
cd telemetry && docker compose up -d   # not executed by the reverse run
```

## Expected outcomes

These outcomes are stated by the documentation and source. None was observed. Exit codes follow `contracts/cli.md`:

- A run ends with one of the codes 0–6.
- A stale approval decision exits 2.
- An unknown verb exits 1.
