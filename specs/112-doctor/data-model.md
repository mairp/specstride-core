# Data model: Doctor (feature 112)

## Entities

| Entity | Fields | Relations |
|---|---|---|
| Check | id, group, order, `lb`, severity rule, message template (at most 200 bytes), fix hint, probe | Registered by one package, in which its code lives (F112-FR-033); belongs to one group |
| Probe bag | clock, file metadata reader, subprocess runner (stdin closed, limit, cap), network reader (GET only), resolved registry, resolved configuration, run records | Injected; never the real machine in a test |
| Finding | id, severity, `lb`, message, fix, evidence (redacted) | Produced by one check |
| Doctor run | `schema`, `at`, `host`, `audience`, `exit`, `summary`, `findings`, `registry`, `pick`, `sources` | Schema `specstride.doctor/1` |
| Flags | `json`, `verbose`, `quick`, `offline`, `online`, `role`, `harness`, `check` (a filter of check ids), `launch-checks` (the `lb` subset, evaluated without launching), `strict`, `workdir` | Parsed once |

## Closed sets

| Set | Members |
|---|---|
| Severity | `ok`, `info`, `warn`, `fail` |
| Group | `env`, `cli`, `host`, `bin`, `harness`, `auth`, `model`, `critic`, `terms`, `quota`, `budget`, `config`, `secret`, `run`, `sandbox`, `ui`, `telemetry`, `events`, `memory` |
| Exit code | 0, 1, 2, 3 |
| Result of the diversity test (read, not owned; row 183 of annex X §X.6) | `diverse` gives `ok`; `same-provider` gives `info`; `same-model` and `unverified` give `warn`; an unknown result is read as `unverified` |

## State of a check run

Registered, then selected by flags and filters, then probed (in parallel, bounded), then given a severity by its rule, then rendered. A timeout gives `warn`; a throw ends the run with exit 1.

## Limits

| Item | Default | Source |
|---|---|---|
| Probe time | 5 s | R16 F2 |
| Model-list request time | 3 s | R16 F4 |
| Probe output | 64 KiB | R16 F2 |
| Finding message | 200 bytes | R16 F3 |
| Finding lines with `fail` | 7 | R16 F4 |
| Worst-case output | 1,700 bytes | R16 F4 |
| Whole doctor skill (listing, body and worst-case output) | 1,500 tokens, 4,200 bytes | Brief 112; ruling 65; annex G §G.5 |
| Old `verified-on` | 90 days | R16 F6 |
| Old terms data | 30 days | ruling 59 |
