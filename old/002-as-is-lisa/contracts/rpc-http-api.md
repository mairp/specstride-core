# Contract: management channel, JSON-RPC and HTTP API (`@lisa/server`, `@lisa/rpc`)

**Surface**: `lisa serve` binds a Unix-domain JSON-RPC socket at `<workdir>/.lisa/rpc.sock`. With `--port <n>`, it also starts the Fastify `ApiServer` (HTTP and WebSocket). Both transports dispatch to the same method registry.

Each section cites its source in an evidence comment. This describes current behavior only.

## Host and authentication

<!-- evidence: packages/cli/src/commands/serve.ts:137-169, packages/cli/src/commands/serve.ts:211-218, packages/server/src/api.ts:139-147 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

- **Bind host**: `LISA_SERVER_HOST`, default `127.0.0.1`.
- **Bearer tokens**: read from `LISA_SERVER_TOKENS` in the form `token=caller,token2=caller2`. With no tokens set, the token table is empty and every authenticated call is rejected.
- **Unauthenticated HTTP requests**: an authenticated route answers `401 {"error":"unauthorized: a valid bearer token is required"}`.

## HTTP routes

<!-- evidence: packages/server/src/api.ts:155-238 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

| Method and path | Auth | Behavior |
|---|---|---|
| `GET /healthz` | none | `{"ok": true}` |
| `POST /rpc` | bearer | One JSON-RPC 2.0 request or a batch (array). A notification answers 204. |
| `GET /events/stream` | bearer | Server-Sent Events tail of the journal. Query: `types` (comma list), `jobId`, `sinceEventId`. Reads only. |
| `POST /webhooks/jobs` | bearer | The body is validated by `EnqueueJobWebhookSchema` (400 when invalid), then dispatched as `lisa.jobs.run@v1`. |
| `POST /webhooks/approvals` | bearer | The body is `{id, targetHash, response, note?}`. A `response` matching `reject\|rejected\|deny\|denied\|stop\|discard` (case-insensitive) is sent to `lisa.approvals.reject@v1`. Any other response goes to `lisa.approvals.approve@v1`. |

**How RPC results map to webhook HTTP replies**:

- an `APPROVAL_REQUIRED` error → 202 `{status:"approval_required"}`
- an `UNAUTHORIZED` error → 403
- any other error → 400
- success → 200 `{status:"ok", result}`

## WebSocket

<!-- evidence: packages/server/src/api.ts:251-300 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->

- Only an HTTP upgrade on a path starting with `/rpc` is accepted, and it requires a bearer token. Without a token the server writes `401` and destroys the socket.
- Each text frame is one JSON-RPC message.
- Subscription pushes arrive as `{"jsonrpc":"2.0","method":"lisa.event","params":<LisaEvent>}` notifications.

## Registered methods

<!-- evidence: packages/rpc/src/registry.ts:365-455 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

**Queries** (non-mutating):

- jobs: `lisa.jobs.list@v1`
- plan: `lisa.plan.review@v1`
- verification: `lisa.verification.inspect@v1`
- approvals: `lisa.approvals.list@v1`
- specs (v1): `lisa.specs.ingest@v1`, `lisa.specs.validate@v1`
- specs (v2): `lisa.specs.inspect@v2`, `lisa.specs.validate@v2`, `lisa.specs.get@v2`
- schedules: `lisa.schedules.list@v1`
- operations: `lisa.doctor.run@v1`, `lisa.replay.run@v1`, `lisa.memory.list@v1`, `lisa.health.check@v1`

**Mutations**:

- jobs: `lisa.jobs.run@v1`, `lisa.jobs.stop@v1`, `lisa.jobs.stopAll@v1`, `lisa.jobs.resume@v1`
- plan: `lisa.plan.generate@v1`, `lisa.plan.approve@v1`
- verification: `lisa.verification.plan@v1`, `lisa.verification.scaffold@v1`, `lisa.verification.check@v1`
- approvals: `lisa.approvals.approve@v1`, `lisa.approvals.reject@v1`
- specs (v1): `lisa.specs.convert@v1`
- specs (v2): `lisa.specs.ingest@v2`, `lisa.specs.project@v2`, `lisa.specs.publish@v2`
- schedules: `lisa.schedules.add@v1`, `lisa.schedules.remove@v1`, `lisa.schedules.runNow@v1`

**Subscription**: `lisa.events.subscribe@v1`. It fails with `INVALID_REQUEST` on a transport that is not bound to a connection. It returns `{subscribed, filter, historyIntact}`.

The `lisa.verification.*` methods are registered only when the host supplies verification services.

## Error codes

<!-- evidence: packages/rpc/src/methods.ts:76-96 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

**Standard JSON-RPC codes**:

| Name | Code |
|---|---|
| `PARSE_ERROR` | -32700 |
| `INVALID_REQUEST` | -32600 |
| `METHOD_NOT_FOUND` | -32601 |
| `INVALID_PARAMS` | -32602 |
| `INTERNAL_ERROR` | -32603 |

**Lisa-specific codes**:

| Name | Code |
|---|---|
| `ALREADY_RUNNING` | -32001 |
| `UNAUTHORIZED` | -32002 |
| `APPROVAL_REQUIRED` | -32003 |
| `STALE_HASH` | -32004 |
| `NOT_FOUND` | -32005 |
| `IDEMPOTENCY_CONFLICT` | -32006 |
| `PAYLOAD_TOO_LARGE` | -32007 |
