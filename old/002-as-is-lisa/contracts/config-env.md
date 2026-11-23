# Contract: configuration and environment variables

**Surface**: these are the environment variables that non-test source under `packages/*/src` reads today, plus the ones that `.env.example` declares. Where a legacy `WIGGUM_*` fallback exists, the `LISA_*` name takes precedence.

Each section cites its source in an evidence comment. This describes current behavior only.

## Run launch (`packages/cli/src/commands/run.ts`)

<!-- evidence: packages/cli/src/commands/run.ts:123-142, packages/cli/src/commands/run.ts:515-540 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

| Variable (fallback) | Default | Effect |
|---|---|---|
| `LISA_PROPOSER` (`WIGGUM_PROPOSER`) | `claude-agent-sdk/claude-opus-4.8` | proposer policy |
| `LISA_CRITIC` (`WIGGUM_CRITIC`) | `anthropic/claude-opus-4.8` | critic policy |
| `LISA_MAX_REJECTS` (`WIGGUM_MAX_REJECTS`) | 3 | rejects before a halt |
| `LISA_MAX_ITER` (`WIGGUM_MAX_ITER`) | 30 | proposer passes per phase |
| `LISA_PROPOSER_TIMEOUT` (`WIGGUM_PROPOSER_TIMEOUT`) | 1800 | seconds per pass |
| `LISA_VERIFICATION` (`WIGGUM_VERIFICATION`) | `off` | `off\|plan\|required` |
| `LISA_SPEC_FORMAT` (`WIGGUM_SPEC_FORMAT`) | detect | spec adapter |
| `LISA_FEATURE` (`WIGGUM_FEATURE`) | derived | feature slug |
| `LISA_CRITIC_TIMEOUT` (`WIGGUM_CRITIC_TIMEOUT`) | 300 | critic seconds |
| `LISA_MAX_WALL_MIN` (`WIGGUM_MAX_WALL_MIN`) | 0 (off) | wall-clock budget |
| `LISA_PROPOSER_CONTEXT_CHARS` | 160000 | proposer context window |
| `LISA_PROPOSER_RESERVED_CHARS` | 32000 | reserved tool and output characters |
| `LISA_PROGRESS_MAX_CHARS` | 12000 | cap on progress text |
| `LISA_OPTIONAL_CONTEXT_MAX_CHARS` | 24000 | cap on optional context |
| `LISA_FEEDBACK_MAX_CHARS` | 16000 | cap on feedback |
| `LISA_REJECTION_HISTORY_MAX_CHARS` | 8000 | cap on rejection history |
| `LISA_NO_PROGRESS_THRESHOLD` | 2 | no-progress detector |

## Servers

<!-- evidence: packages/cli/src/commands/serve.ts:137-169, packages/dashboard/src/server.ts:29-39 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

| Variable | Default | Reader |
|---|---|---|
| `LISA_SERVER_TOKENS` | empty (every call rejected) | `lisa serve --port` |
| `LISA_SERVER_HOST` | `127.0.0.1` | `lisa serve --port` |
| `LISA_DASHBOARD_HOST` | `127.0.0.1` | dashboard API |
| `LISA_DASHBOARD_API_PORT` | 13001 | dashboard API |
| `LISA_TEMPO_URL` | `http://127.0.0.1:13012` | dashboard API |
| `LISA_AGENTCTL_CONTROLLER_URL` | `http://127.0.0.1:8080` | dashboard API |
| `LISA_AGENTCTL_TRACE_URL` | `http://127.0.0.1:8000` | dashboard API |

## Providers and diagnostics

<!-- evidence: packages/agents/src/anthropic/completion.ts:110-122, packages/agents/src/openai-compat/completion.ts:90-97, packages/cli/src/index.ts:222-230, packages/specs/src/resolve.ts:51-70 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->

- **Anthropic provider**: `ANTHROPIC_BASE_URL`, then `WIGGUM_CLAUDE_CRITIC_BASE_URL`. `ANTHROPIC_API_KEY`, then `WIGGUM_CLAUDE_CRITIC_API_KEY`. `ANTHROPIC_AUTH_TOKEN`.
- **OpenAI-compatible provider**: `OPENAI_BASE_URL` (default `https://api.openai.com/v1`), `OPENAI_API_KEY`, `OPENAI_MODEL`.
- **Prime-agent provider**: `LISA_PRIME_AGENT_DIR`.
- **`lisa doctor` reachability probes**:
  - The gateway probe uses `ANTHROPIC_BASE_URL`.
  - The telemetry probe uses `LISA_LOKI_URL`, then `LISA_OTEL_URL`, then `OTEL_EXPORTER_OTLP_ENDPOINT`.
- **Spec-format resolution**: an explicit override, then `LISA_SPEC_FORMAT`, then `WIGGUM_SPEC_FORMAT`, then content detection.

## Declared in `.env.example` with no reader in `packages/`

<!-- evidence: .env.example:33-73 | kind=declared | confidence=0.70 | contradicts=packages/cli/src/commands/run.ts:123-142 | validation=unverified -->

`.env.example` declares these variables, but none is read in non-test `packages/` source:

- `LISA_CHAT`
- `LISA_RESOURCE_CLASSES`
- `LISA_BUDGET_PER_ATTEMPT_USD`
- `LISA_BUDGET_PER_JOB_USD`
- `LISA_CONTEXT_BUDGET`

`LISA_OTEL` and `LISA_TELEMETRY` appear only in `.env.example`, the README, `examples/` and `telemetry/docker-compose.yml`.

Whether some other consumer reads any of these is unverified.
