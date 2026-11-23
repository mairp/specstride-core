# Contract: dashboard HTTP API (`@lisa/dashboard`, `src/server.ts`)

**Surface**: this is a plain `node:http` server started by the dashboard's `start:api` script (`node --env-file=../../.env dist/compiled/server.js`). It binds only when `server.ts` is the process entrypoint. It has no authentication. The web UI is served separately by Vite on port 13000.

Each section cites its source in an evidence comment. This describes current behavior only.

## Binding and headers

<!-- evidence: packages/dashboard/src/server.ts:29-39, packages/dashboard/src/server.ts:108-120, packages/dashboard/src/server.ts:1172-1188, packages/dashboard/package.json:1-27 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

- **Host**: `LISA_DASHBOARD_HOST`, default `127.0.0.1`.
- **Port**: `LISA_DASHBOARD_API_PORT`, default 13001.
- **CORS**: `Access-Control-Allow-Origin: http://localhost:13000`, with methods `GET,POST,OPTIONS`.
- **OPTIONS requests**: answer 204.
- **Unknown routes**: answer 404 `{"error":"not_found"}`.
- **SIGINT and SIGTERM**: send SIGTERM to every child `lisa` process, then close the server.

## Routes

<!-- evidence: packages/dashboard/src/server.ts:800-835, packages/dashboard/src/server.ts:908-940, packages/dashboard/src/server.ts:1065-1168, packages/dashboard/src/trajectory.ts:572-585 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->

**Health**

- `GET /api/health`: returns a HealthStatus `{ok, lisa, provider, providers[], apiStartedAt}`. The status is 200 when `ok`, otherwise 503.

**Jobs**

- `GET /api/jobs`: returns `{jobs: DashboardJob[]}`, newest first. It refreshes agentctl projections before answering.
- `POST /api/jobs`: the body is `{title, objective, workdir}`.
  - When the title is missing, the objective is under 10 characters, or the workdir does not exist, it answers 422.
  - Otherwise it spawns a run and answers 201 `{job}`.
- `POST /api/agentctl/jobs`: the body is `{runId (UUID), workdir (absolute), specPath (absolute), …}`. Invalid input answers 422.
- `GET /api/jobs/:id/trajectory?before=&limit=`: returns a TrajectoryResponse. An unknown id answers 404. `limit` is clamped to [1, 500] and defaults to 50. The page holds records whose `seq` is strictly before `before`, and `before` in the response is null once no earlier records remain (FR-051).
- `GET /api/jobs/:id/logs`: returns the observed log lines and their source.
- `GET /api/jobs/:id/tasks`: returns `{tasks}`. An unknown id answers 404.
- `GET /api/jobs/:id/intelligence`: returns the run intelligence built from the logs and Tempo spans. An unknown id answers 404.
- `POST /api/jobs/:id/publish`: re-resolves the bound bundle and answers `{ok, bundle}`. When the run has no bundle or it fails verification, it answers 409.
- `POST /api/jobs/:id/stop`: sends SIGTERM to the child process and answers `{ok:true}`. When the run is not active, it answers 409.

**Chat**

- `POST /api/chat`: the body is `{message}`. An empty message answers 422.
- `POST /api/chat/confirm`: the body is `{action}`. An invalid action answers 422.

## State

<!-- evidence: packages/dashboard/src/server.ts:83-103 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

- Jobs persist to `<repo>/.lisa-dashboard/jobs.json`. The file is written to a temp file with mode 0600 and then renamed.
- On load, active jobs that have a local PID are recovered through `recoverRestartJob`.
