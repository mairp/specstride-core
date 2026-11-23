# Contract: the command `learn`

Public command of CLI protocol 1 (annex G §G.1). Exit codes are those of the baseline (annex G §G.4).

| Mode | Runs | Writes | Exit |
|---|---|---|---|
| `--show` (default) | Advice, then the report of the last evaluations | Nothing | That of the advice |
| `--apply [--phase N ...]` | `apply` for the feature | One entry and one event per applied knob | 0, 2, 3, 4 |
| `--revert <run id>` | `revert` | One entry and one event | 0, 2; 1 without an id |
| `--off` | `off` | One entry and one event per decision | 0, 2 |
| `--summarize` | `summarize` | Nothing (JSON on standard output) | 0, 2 |
| `--evaluate` | `evaluate --dry-run` | Nothing | 0, 2 |
| Any other mode | Nothing | Nothing | 1, with the message of F106-FR-022 |

Options of the operations: `--events` (repeatable), `--summary`, `--out`, `--pretty`, `--specs`, `--spec-format`, `--phase-shape`, `--verification-dir`, `--verdicts-dir`, `--run-log`, `--live-regex`, `--feature-dir`, `--applied-file`, `--events-file`, `--knob`, `--phase`, `--default`, `--run-id`, `--force`, `--dry-run`, `--report`.

The mode is the first argument that the front door does not take as one of its own options; the default is `--show`.

The operations resolve and observe are internal calls made by the engine; they are not modes, and the lines they return go to the engine log. `--knob` accepts the two members of the allowlist only; another name is a usage error with exit 2.

`--json` follows annex G F100-FR-172 for `--summarize` and `--show`.
