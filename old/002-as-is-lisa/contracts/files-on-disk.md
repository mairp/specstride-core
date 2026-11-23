# Contract: on-disk state layout (`<workdir>/.lisa/` and dashboard state)

**Surface**: this contract covers the files that Lisa reads and writes as durable state. Other processes (resume, status, the dashboard, the scheduler) read them.

Each section cites its source in an evidence comment. This describes current behavior only.

## Run layout (workspace root scope)

<!-- evidence: packages/cli/src/layout.ts:1-94, packages/cli/src/layout.ts:141-180 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

```text
<workdir>/.lisa/
├── lock.d/owner          workspace lock (atomic mkdir); owner file records pid=<n>
├── stop.flag             clean/now stop request (workspace scope)
├── last-run.conf         KEY=value resolved launch config (resume reads it)
├── run.log -> features/<slug>/runs/<runId>/run.log        (relative symlink)
├── events.jsonl -> features/<slug>/runs/<runId>/events.jsonl
├── rpc.sock              management-channel UDS (lisa serve)
├── daemon-journal.jsonl  daemon event journal (lisa serve)
└── features/<slug>/
    ├── gates/GATE<n>-EVIDENCE.md | GATE<n>-FEEDBACK.md | GATE<n>-APPROVED | proofs/
    ├── attempts/phase<n>/attempt<m>/ (evidence moved, feedback + verdict.txt copied)
    ├── attempts/phase<n>/approved/
    ├── verdicts/phase<n>.attempt<m>.<tag>.txt
    ├── approvals/<requestId>.json
    ├── jobs/<jobId>/budget.json
    └── runs/<runId>/run.log, events.jsonl
```

<!-- evidence: packages/core/src/gates/store.ts:41-49, packages/core/src/gates/store.ts:60-86, packages/core/src/gates/store.ts:179-244, packages/core/src/domain/approvals.ts:208-230, packages/scheduler/src/budgets.ts:164-167, packages/scheduler/src/stop.ts:37-59, packages/cli/src/commands/serve-services.ts:100-105 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

**Write disciplines**:

- These are written atomically (tmp, fsync, rename):
  - gate evidence
  - approval records
  - `budget.json`
  - `stop.flag`
- `GATE<n>-APPROVED` is an empty marker, and its existence is the signal.
- `last-run.conf` is written with a plain `writeFileSync`, and a failed write is ignored.

## Scheduler queue

<!-- evidence: packages/scheduler/src/queue.ts:1-11, packages/scheduler/src/queue.ts:93-146 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

- `.lisa/queue/jobs/<id>.json` holds one QueueJob per file.
- `.lisa/queue/retries/<encodeURIComponent(key)>.json` holds one RetryRecord per file.
- Each file is written atomically. The runnable set is derived by scanning these files.

## Specification bundles (v2)

<!-- evidence: packages/persistence/src/specification-bundle-store.ts:67-79, packages/persistence/src/specification-bundle-store.ts:316-324, packages/persistence/src/specification-bundle-store.ts:464-502, packages/persistence/src/specification-bundle-store.ts:596-605 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

```text
<workdir>/.lisa/specifications/
├── <bundleId>/bundle.v2.json      manifest (write-once)
├── <bundleId>/bundle.v2.sha256    recorded content hash
├── <bundleId>/transforms/<id>.json
├── <bundleId>/executions/<projectionHash>.md
└── blobs/sha256/<hex[0:2]>/<hex>  artifact snapshots
```

Files are created with mode 0600 and directories with 0700.

## Verification plans

<!-- evidence: packages/verification/src/store.ts:84-130 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->

- The plan is stored at `<workdir>/.lisa/verification/<bundleId>/<contentHash>/verification-plan.json`. It is immutable, and different bytes for an existing plan are refused.
- The TEST_PLAN markdown goes to an authorized output path that the operator supplies.

## SQLite index

<!-- evidence: packages/persistence/src/index-db.ts:77-180 | kind=observed | confidence=0.80 | contradicts=none | validation=verified -->

- The index opens in WAL mode.
- It can be rebuilt from the files above inside one transaction.

## Dashboard state

<!-- evidence: packages/dashboard/src/server.ts:29-39, packages/dashboard/src/server.ts:83-103 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

- The dashboard keeps its jobs in `<repo>/.lisa-dashboard/jobs.json`, a JSON array of DashboardJob records.
- The file is written to a temp file with mode 0600 and then renamed.
