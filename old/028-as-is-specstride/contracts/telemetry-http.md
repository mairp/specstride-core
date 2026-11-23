# Contract: Outbound telemetry over HTTP

**Surface**: Specstride serves no HTTP API. Its only HTTP surface is outbound. When telemetry is enabled, the shippers push event copies to a Loki and/or an OTLP/HTTP endpoint. Both are off by default. The bundled `telemetry/docker-compose.yml` stack (Grafana, Loki, otel-collector, Prometheus) was not started by the reverse run.

## Enablement

<!-- evidence: orchestrator.sh:206-209, specstride-lib.sh:129-144 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

- Loki: `--telemetry` / `SPECSTRIDE_TELEMETRY_ENABLED=true`, with the base URL from `--loki-url` / `SPECSTRIDE_LOKI_URL` (default `http://localhost:3100`).
- OTLP: `--otel` / `SPECSTRIDE_OTEL_ENABLED=true`, with the base URL from `--otel-url` / `SPECSTRIDE_OTEL_URL` (default `http://localhost:4318`).
- Each `events.jsonl` line is piped to the shipper. Shipping is best-effort and never fails the loop.

## Endpoints called

<!-- evidence: lib/ralph_loki_ship.py:67-70, lib/ralph_otel_ship.py:100-106 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

| Sink | Method / path |
|---|---|
| Loki | push to `<base>/loki/api/v1/push` (batched streams, labels `job`/`task`/`backend`/`event`) |
| OTLP | `<base>/v1/logs`, `<base>/v1/metrics`, `<base>/v1/traces` |

## Critic events

<!-- evidence: lib/critic.py:2432-2440 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

`lib/critic.py` `_ship_remote` mirrors critic events (`critic_start`, `verdict`, `grounding_gap`, …) to the same sinks under the same enable flags. Telemetry never affects the verdict.
