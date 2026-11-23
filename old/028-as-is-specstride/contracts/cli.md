# Contract: Command-line interface

**Surface**: the `specstride` front door, `orchestrator.sh` launch flags, and the `lib/reverse.py` sub-CLI. This describes what the source does today. None of these commands was executed by the reverse run.

## `specstride` subcommands

<!-- evidence: specstride:1-49, specstride:176-186 | kind=declared | confidence=0.90 | contradicts=none | validation=verified -->

| Invocation | Effect | Writes |
|---|---|---|
| `specstride run [flags]`, `specstride start [flags]` or `specstride -<flag> …` | `exec bash orchestrator.sh "$@"` | the run's state (see `files-on-disk.md`) |
| `specstride status [-w DIR] [--feature S] [--all]` | one-screen state | nothing |
| `specstride watch [-w DIR]` | live status card | nothing |
| `specstride tail [-w DIR] [--feature S]` | `tail -f` on `run.log` | nothing |
| `specstride events [-w DIR] [--feature S] [-f] [--json]` | the raw event stream | nothing |
| `specstride verdicts [-w DIR] [--feature S] [N]` | dumps critic transcripts | nothing |
| `specstride feedback <N> [-w DIR] [--feature S]` | prints `GATE<N>-FEEDBACK.md` | nothing |
| `specstride phases [-w DIR] [-s SPEC] [--feature S]` | phases and per-phase state | nothing |
| `specstride stop [-w DIR] [--now]` | clean stop; `--now` also kills the `proposer.pid` process tree | `.specstride/stop.flag` |
| `specstride resume [-w DIR] [--feature S] [overrides…]` | re-execs the orchestrator from `last-run.conf`; refused (exit 1) while the lock is held | whatever the resumed run writes |
| `specstride learn [--show\|--apply\|--revert <run-id>\|--off\|--summarize\|--evaluate]` | dispatches to `lib/learn.py`; `--show` is the default | `learning/applied.json` for `--apply`, `--revert` and `--off` |
| `specstride reverse <SRC> [--out DIR] [--name SLUG] [--tasks done\|open] [--dry-run]` | `reverse.py plan`, then an orchestrator run with `SPECSTRIDE_GIT_COMMITS=off` | the output dir and `SRC/.specstride/` |
| `specstride reverse --lint <FEATURE_DIR> [--src SRC] [--upto N] [--json]` | the linter; no LLM | nothing |

`specstride reverse` refuses `-w`, `-s`, `--spec-format`, `--feature`, `--verification`, `--verification-commands`, `--test-plan` and `--generate-tests` with exit 3 (`specstride:81-100`).

## `orchestrator.sh` launch flags

<!-- evidence: orchestrator.sh:233-262 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

`-w|--workdir`, `-s|--specs`, `--spec-format`, `--feature`, `--proposer`, `--critic`, `--max-rejects`, `--max-iter`, `--proposer-timeout`, `--proposer-timeout-phase N=SECONDS` (repeatable), `--critic-timeout`, `--start-phase`, `--verification off|plan|required`, `--test-plan`, `--verification-commands`, `--generate-tests`, `--telemetry`, `--loki-url`, `--otel`, `--otel-url`, `--live`, `--no-live`, `--debug`, `--long-job-phase`, `--long-job-cmd` and `-h|--help`. An unknown argument prints usage and exits 3.

## Exit codes

<!-- evidence: orchestrator.sh:25-33, lib/critic.py:2846-2846, proposer.sh:117-133, proposer.sh:2051-2051, proposer.sh:2112-2112, orchestrator.sh:1888-1966, lib/reverse.py:42-42, proposer.sh:1805-1809, orchestrator.sh:347-353 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

| Process | Code | Meaning |
|---|---|---|
| `orchestrator.sh` | 0 | all phases approved |
| | 1 | internal error, including `critic_unavailable` |
| | 2 | `MAX_REJECTS` exceeded or an oscillating criterion (a human must arbitrate) |
| | 3 | invalid spec or config, including an invalid `SPECSTRIDE_<BACKEND>_OVERLAY` value or overlay declaration |
| | 4 | budget exceeded: own wall clock, or proposer exit 4, 7, 8, 9 or 10 |
| | 5 | lock held |
| | 6 | stopped via `stop.flag` |
| `lib/critic.py` | 10 | verdict `REJECTED` or `MALFORMED` |
| `proposer.sh` | 0 | evidence file appeared |
| | 1 | bad usage |
| | 3 | invalid overlay declaration or `SPECSTRIDE_<BACKEND>_OVERLAY` value at startup (the `backend_overlay.py startup` status, passed through) |
| | 4 | `MAX_ITER` reached without evidence |
| | 6 | stopped via `stop.flag` |
| | 7 | consecutive-error breaker tripped (`SPECSTRIDE_PROPOSER_MAX_ERRORS`, default 2) |
| | 8 | consecutive no-progress passes (`SPECSTRIDE_PROPOSER_MAX_NOPROGRESS`, default 3) |
| | 9 | yield limit, yield deadline or wall clock expired during a yield |
| | 10 | consecutive hard-cap kills (`SPECSTRIDE_PROPOSER_MAX_CAPS`, default 3) |
| `lib/reverse.py lint` / `guard` | 0 or 3 | clean, or findings / errors (`E_FINDINGS`) |

## `lib/reverse.py`

<!-- evidence: lib/reverse.py:1364-1382 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

- `reverse.py plan <src> [--out] [--name] [--tasks done|open]` prints the plan as JSON.
- `reverse.py lint <feature_dir> [--src] [--baseline] [--upto N (default 5)] [--claims] [--json]`
- `reverse.py guard <src> --baseline <inventory.json> --out <dir>` prints `guard: ok — …` or one `guard: <problem>` line per change, then `guard: FAILED — …`.
