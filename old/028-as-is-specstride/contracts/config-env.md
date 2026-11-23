# Contract: Configuration and environment

**Surface**: the environment variables and the `.env` file that configure a run. Precedence runs from built-in defaults, to `.env`, to CLI flags. Only defaults visible in source are listed. `.env.example` documents the full set.

<!-- evidence: .env.example:1-12 | kind=declared | confidence=0.85 | contradicts=none | validation=verified -->

## Orchestrator

<!-- evidence: orchestrator.sh:199-233 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

| Variable | Default | Flag |
|---|---|---|
| `SPECSTRIDE_SPEC_FORMAT` | auto-detect | `--spec-format` |
| `SPECSTRIDE_FEATURE` | derived slug | `--feature` |
| `SPECSTRIDE_PROPOSER` | `dsh` | `--proposer` |
| `SPECSTRIDE_CRITIC` | `claude` | `--critic` |
| `SPECSTRIDE_MAX_REJECTS` | `3` | `--max-rejects` |
| `SPECSTRIDE_MAX_ITER` | `30` | `--max-iter` |
| `SPECSTRIDE_TELEMETRY_ENABLED` | `false` | `--telemetry` |
| `SPECSTRIDE_LOKI_URL` | `http://localhost:3100` | `--loki-url` |
| `SPECSTRIDE_OTEL_ENABLED` | `false` | `--otel` |
| `SPECSTRIDE_OTEL_URL` | `http://localhost:4318` | `--otel-url` |
| `SPECSTRIDE_LIVE` | `auto` | `--live` / `--no-live` |
| `SPECSTRIDE_PROPOSER_TIMEOUT` | `1800` | `--proposer-timeout` |
| `SPECSTRIDE_PROPOSER_TIMEOUT_PHASE_<N>` | none | `--proposer-timeout-phase N=S` |
| `SPECSTRIDE_CRITIC_TIMEOUT` | `300` | `--critic-timeout` |
| `SPECSTRIDE_CRITIC_MALFORMED_LIMIT` | `3` (0 = off) | none |
| `SPECSTRIDE_MAX_WALL_MIN` | `0` | none |
| `SPECSTRIDE_GIT_COMMITS` | `auto` | none |
| `SPECSTRIDE_VERIFICATION` | `required` | `--verification` |
| `SPECSTRIDE_TEST_PLAN`, `SPECSTRIDE_VERIFICATION_COMMANDS`, `SPECSTRIDE_GENERATE_TESTS` | empty | matching flags |
| `SPECSTRIDE_LONG_JOB_PHASE`, `SPECSTRIDE_LONG_JOB_CMD` | empty | `--long-job-phase`, `--long-job-cmd` |
| `SPECSTRIDE_DIAGNOSTICIAN` | `true` | none (`orchestrator.sh:1073`) |

## Proposer watchdogs and yield

<!-- evidence: proposer.sh:155-166, proposer.sh:1207-1227, proposer.sh:1897-1897, proposer.sh:1912-1912 | kind=observed | confidence=0.85 | contradicts=README.md:1352-1353 | validation=verified -->

| Variable | Default |
|---|---|
| `SPECSTRIDE_PROPOSER_IDLE_TIMEOUT` | `900` |
| `SPECSTRIDE_PROPOSER_PROGRESS_TIMEOUT` | `1800` |
| `SPECSTRIDE_PROPOSER_REPEAT_LIMIT` | `12` in code and `.env.example`; README says `5` |
| `SPECSTRIDE_PROPOSER_MAX_ERRORS` | `2` |
| `SPECSTRIDE_PROPOSER_MAX_CAPS` | `3` |
| `SPECSTRIDE_YIELD_POLL` | `30` |
| `SPECSTRIDE_YIELD_MAX_PER_ATTEMPT` | `4` |
| `SPECSTRIDE_YIELD_ALLOW_COMMAND` | `false` |
| `SPECSTRIDE_YIELD_COUNTS_AS_ITER` | `false` |
| `SPECSTRIDE_FAILURE_LEDGER` / `_MAX` | `true` / `150` |

## Learning and reverse

<!-- evidence: specstride:24-35, lib/reverse.py:1384-1390, lib/reverse_inventory.py:816-817 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->

- `SPECSTRIDE_LEARNING=apply` is the only way learned decisions take effect at run time.
- `SPECSTRIDE_REVERSE_TASKS` (`done` by default, or `open`), `SPECSTRIDE_REVERSE_MAX_TOTAL_BYTES` and `SPECSTRIDE_REVERSE_MAX_FILE_BYTES`.

## Backend config-home overlay

<!-- evidence: lib/backend_overlay.py:198-249, orchestrator.sh:347-353, proposer.sh:1805-1809 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

| Variable | Accepted values | Effect today |
|---|---|---|
| `SPECSTRIDE_<BACKEND>_OVERLAY` (e.g. `SPECSTRIDE_CLAUDE_OVERLAY`; `<BACKEND>` is the upper-cased registry name without qualifier) | unset, empty, `pass`, `attempt` | Any other value is a config error (orchestrator exit 3, before any proposer pass). No shipped backend declares an overlay, so every backend resolves to scope `none`; an explicit `pass`/`attempt` only makes the proposer print a warning on stderr and is otherwise ignored. |
