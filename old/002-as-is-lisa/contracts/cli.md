# Contract: `lisa` command-line interface (as-is at 76adfdc)

**Surface**: this contract covers the `lisa` executable that the `bin` entry of `packages/cli/package.json` declares (`./bin/lisa.mjs`). Routing lives entirely in `route()` in `packages/cli/src/index.ts`.

Each section cites its source in an evidence comment. This describes current behavior only.

## Process boundary

<!-- evidence: packages/cli/bin/lisa.mjs:11-21 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

- `argv` minus the node and script prefix is passed to `route()`.
- Log lines stream to stdout. The final `message`, if there is one, goes to stdout.
- The process exits with the routed `exitCode`.
- An uncaught error prints `lisa: <stack>` to stderr and exits 70.

## Routing (first argument)

<!-- evidence: packages/cli/src/index.ts:50-61, packages/cli/src/index.ts:72-256 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

| First argument | Action | Notes |
|---|---|---|
| none, `-h`, `--help`, `help` | print usage | exit 0, outcome `help` |
| `run`, `start` | launch the rest of argv | see Launch flags |
| `serve` | management-channel daemon | blocks until a signal |
| any token starting with `-` | launch the whole argv | |
| `status`, `events`, `replay` | readouts | shared readout flags |
| `stop` | request a stop | `--all`, `--now` |
| `resume` | relaunch from `last-run.conf` | operator overrides are applied last |
| `spec convert\|inspect\|import\|import-project` | spec tooling | any other sub-verb: exit 1, outcome `unknown` |
| `verification plan\|scaffold\|check` | verification tooling | any other sub-verb: exit 1 |
| `approvals`, `approve <id>`, `reject <id>` | approval channel | over `.lisa/rpc.sock` when a daemon is up, otherwise in-process |
| `doctor [--fix]` | diagnostics | |
| `watch`, `tail`, `verdicts`, `feedback`, `phases` | recognized, not implemented | exit 1, outcome `verb_not_implemented` |
| anything else | error | exit 1, outcome `unknown`, `unknown subcommand: <verb>` |

## Launch flags (`lisa run …`)

<!-- evidence: packages/cli/src/commands/run.ts:123-215 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

| Flag | Value | Default or source |
|---|---|---|
| `--run-id` | ID | |
| `-w`, `--workdir` | DIR | the launch directory |
| `-s`, `--specs` | FILE | resolved when absent |
| `--bundle-id` | ID | |
| `--expected-content-hash` | H | |
| `--spec-format` | FMT | `LISA_SPEC_FORMAT`, then `WIGGUM_SPEC_FORMAT` |
| `--feature` | SLUG | `LISA_FEATURE`, then `WIGGUM_FEATURE` |
| `--proposer` | P/M | `claude-agent-sdk/claude-opus-4.8` |
| `--critic` | P/M | `anthropic/claude-opus-4.8` |
| `--max-rejects` | N | 3 |
| `--max-iter` | N | 30 |
| `--proposer-timeout` | N (positive) | 1800 |
| `--start-phase` | N | derived from the gate markers |
| `--verification` | `off\|plan\|required` | `off` |
| `--test-plan` | absolute FILE | |
| `--generate-tests` | absolute DIR | |

The parser rejects the following as usage errors:

- unknown flags
- stray positional arguments
- a flag with no value
- a relative `--test-plan` or `--generate-tests`

## Other verb flags

<!-- evidence: packages/cli/src/index.ts:267-295, packages/cli/src/index.ts:357-401, packages/cli/src/commands/verification.ts:50-105, packages/cli/src/commands/spec-import-project.ts:250-272, packages/cli/src/interrupts.ts:265-290, packages/cli/src/commands/serve.ts:59-75 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->

- **Readouts** (`status`, `events`, `replay <run>`):
  - flags: `-w`/`--workdir`, `--feature`, `-f`/`--follow`, `--json`
  - `replay` with no run id exits 1 with outcome `usage`
- **Approvals**:
  - flags: `-w`/`--workdir`, `--feature`, `--json`, `--note`, `--response`, plus the positional request id
  - `approve` or `reject` without an id exits 1 with outcome `usage`
- **`verification`**: `--workdir`, `--specs`, `--output`, `--bundle-id`, `--expected-content-hash`, `--plan`, `--phase`, `--generate-tests`, `--required`, `--format`/`--spec-format`.
- **`spec import-project <dir>`**: `--workdir`, `--method` (only `speckit` is accepted), `--require-traceability`, `--json`.
- **`stop`**: `-w`/`--workdir`, `--feature`, `--all`, `--now`.
- **`serve`**: `-w`/`--workdir`, `--port <n>`.

## Exit codes

<!-- evidence: packages/core/src/engine/lifecycle.ts:24-68, packages/cli/src/commands/doctor.ts:600-630 | kind=observed | confidence=0.90 | contradicts=README.md:416-419 | validation=verified -->

**Run lifecycle codes**:

| Code | Name | Meaning |
|---|---|---|
| 0 | OK | |
| 1 | INTERNAL | |
| 2 | REJECTS | |
| 3 | SPEC | |
| 4 | BUDGET | |
| 5 | LOCK | |
| 6 | STOP | |

**`run_stop` reason → exit code**:

| Reason | Exit code |
|---|---|
| `stop_flag` | 6 |
| `wall_budget` | 4 |
| `proposer_max_iter` | 4 |
| `proposer_no_evidence` | 1 |
| `critic_config` | 3 |
| `max_rejects` | 2 |

**Other commands**:

- `approve` and `reject` return 2 with outcome `refused` for a refused decision.
- `doctor` returns 0 (`healthy`), 2 (`findings`) or 1 (`error`).
- The README states that `doctor` returns 3 for bad usage. No exit-code-3 path was found in `doctor.ts`, so that statement is recorded as a contradiction.
