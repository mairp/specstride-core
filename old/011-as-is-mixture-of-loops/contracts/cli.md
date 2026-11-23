# Contract: command-line interfaces (as-is)

Every executable surface the repository ships at commit `9c88f86`, with the arguments, outputs and exit codes the current code defines. There is no HTTP API, no network listener and no library API published for import by other projects: the only external surfaces are these commands, the files in [files-on-disk.md](files-on-disk.md), the output lines in [output-lines.md](output-lines.md) and the variables in [environment.md](environment.md).

All Python scripts run on the standard library only. `bootstrap_contract.py`, `validate_contract.py` and `render_launcher.py` print a reminder to stderr when `MOL_VIA=shell` is unset; it never changes stdout or the exit code.
<!-- evidence: skills/mixture-of-loops/scripts/contract_lib.py:96-108 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

## `skills/mixture-of-loops/scripts/bootstrap_contract.py`

```text
bootstrap_contract.py --repo DIR [--feature PATH ...] [--output PATH|-]
                      [--applied-file PATH] [--learning-mode off|suggest|apply]
```
<!-- evidence: skills/mixture-of-loops/scripts/bootstrap_contract.py:408-440 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

| Argument | Required | Meaning |
|---|---|---|
| `--repo` | yes | repository root; must be a directory |
| `--feature` | no, repeatable | a Spec Kit feature directory |
| `--output` | no (default `-`) | contract path (written atomically) or `-` for stdout |
| `--applied-file` | no | Specstride `learning/applied.json` to bind; default `<state dir>/features/<slug>/learning/applied.json` for a single feature |
| `--learning-mode` | no (default `off`) | `off`, `suggest` or `apply` |

**Output**: a `draft` launch contract as sorted, indented JSON with one open blocker `semantic-derivation-required`. **Exit**: 0 on success; argparse usage error (2) when the repository is not a directory or an `OSError`/`ValueError` is raised.

## `skills/mixture-of-loops/scripts/validate_contract.py`

```text
validate_contract.py CONTRACT [--allow-draft] [--no-source-check] [--promote]
```
<!-- evidence: skills/mixture-of-loops/scripts/validate_contract.py:68-112 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

| Argument | Meaning |
|---|---|
| `CONTRACT` | path to the launch contract |
| `--allow-draft` | validate structure without execution readiness |
| `--no-source-check` | skip source hash comparison |
| `--promote` | write `validated` + promotion stamp only if strict validation passes; otherwise write `draft` |

`--promote` and `--allow-draft` together are a usage error. **Stdout**: `promoted to validated: <id>` (when it promoted) and `valid <status> launch contract: <id>`. **Stderr**: `warning: …`, `invalid launch contract:` plus the errors, `next: …` hints, `stale contract sources:`. **Exit**: 0 valid; 20 invalid (and, with `--promote`, status set back to `draft`); 23 stale sources.

## `skills/mixture-of-loops/scripts/render_launcher.py`

```text
render_launcher.py --contract CONTRACT --output RUN_SCRIPT [--replace-edited]
```
<!-- evidence: skills/mixture-of-loops/scripts/render_launcher.py:113-151 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

Validates strictly with source checks, requires a matching promotion stamp, publishes the content-addressed bundle, and writes the launcher atomically with mode `0755`. Refuses to overwrite an existing launcher that is edited or not generated unless `--replace-edited` is passed. **Stdout**: `rendered <output>` and `bundle <bundle>`. **Exit**: 0; 20 (`cannot render launcher: …`, including an unstamped `validated`); 23 stale sources.

## Generated launcher (`RUN_SCRIPT`) → bundled `runtime.py`

```text
RUN_SCRIPT [--implement] [--smoke] [--dry-run] [--color auto|always|never] [--no-color]
```
<!-- evidence: skills/mixture-of-loops/scripts/runtime.py:548-570 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

The launcher `exec`s `python3 <bundle>/runtime.py --contract <bundle>/launch-contract.json --launch-dir <launcher dir>` and passes its own arguments through (`--contract` and `--launch-dir` are hidden). `--dry-run` takes precedence over the other execution flags and writes nothing. **Exit codes** (identical constants in `skills/mixture-of-loops/scripts/runtime.py:42-46` and `skills/mixture-of-loops/scripts/supervisor_lib.py:48-53`):

| Code | Meaning |
|---|---|
| 0 | completed (or dry run) |
| 20 | invalid contract |
| 21 | preflight blocked |
| 22 | stage failed |
| 23 | stale sources |
| 24 | run directory lock held by another launcher |
| 128+N | interrupted by signal N |

## `skills/mixture-of-loops/scripts/supervise.py`

```text
supervise.py mode     --request TEXT [--token TOK ...]
supervise.py learning --request TEXT [--token TOK ...]
supervise.py resolve  --repo DIR [--feature SLUG] [--launcher PATH]
supervise.py gate     --launcher PATH [--implement] [--smoke]
supervise.py launch   --launcher PATH [--mode run|auto] [--implement] [--smoke]
supervise.py watch    (--launcher PATH | --run-dir DIR) [cadence]
supervise.py observe  (--launcher PATH | --run-dir DIR) [cadence] [--json]
supervise.py auto     --launcher PATH [--mode run|auto] [--implement] [--smoke] [cadence]
supervise.py stop     (--launcher PATH | --run-dir DIR) [cadence]
supervise.py retro    (--launcher PATH | --run-dir DIR)
```
<!-- evidence: skills/mixture-of-loops/scripts/supervise.py:193-276 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

`cadence` is `--poll-seconds` (default 60), `--max-poll-seconds` (default 600), `--max-wait-seconds` (default: the contract's declared supervision ceiling) and `--no-relaunch`. `launch` defaults to `--mode run`; `auto` defaults to `--mode auto`. Output is one `[MOL-*]` line per event (see [output-lines.md](output-lines.md)).

**Exit** (`EXIT_STATUS`, `skills/mixture-of-loops/scripts/supervisor_lib.py:91-92`): 0 completed (and 0 for `mode`, `learning`, a successful `resolve`/`gate`/`launch`, a non-terminal `observe`, and `retro`); 2 stopped; 3 unknown-terminal; 4 refused (gate refusal, unresolvable launcher, invalid contract, any `SupervisorError`); 5 supervision-expired; 22 failed; 24 lock-conflict; 130 interrupted supervision.
<!-- evidence: skills/mixture-of-loops/scripts/supervise.py:65-190 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

## `bin/onboard-skill`

```text
onboard-skill --harness codex|claude|dsh|pi|prime|all --scope user|repo
              [--repo DIR] [--check] [--repair] [-h|--help]
```
<!-- evidence: bin/onboard-skill:4-40 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

Links the canonical `skills/mixture-of-loops` into each harness's skill root (targets in [files-on-disk.md](files-on-disk.md)). `--check` changes nothing; `--repair` replaces only an existing symlink that points elsewhere. **Exit**: 0 ok; 2 usage; 3 missing source or repository; 4 unrelated path or link in the way; 5 link missing (`--check`); 6 a different `mixture-of-loops` skill is visible to pi or prime; 7 pi skips the repository link headless because the project is untrusted (`--harness pi --scope repo --check`).

## Test entry points (development only)

`python3 -m unittest discover -s tests -v` runs Tiers 1–2; `tests/e2e/run_harness_e2e.py` is the Tier 3 live runner, active only with `MOL_LIVE_E2E=1`. These are not product interfaces.
<!-- evidence: README.md:329-357 | kind=declared | confidence=0.85 | contradicts=none | validation=verified -->
