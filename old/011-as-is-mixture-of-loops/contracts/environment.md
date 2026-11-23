# Contract: configuration and environment (as-is)

The product has no configuration file of its own. Behaviour is configured by command-line arguments ([cli.md](cli.md)), by the launch contract's `configuration` object ([../data-model.md](../data-model.md)), and by the environment variables below.

## Read by the skill scripts and the runtime

| Variable | Read by | Effect |
|---|---|---|
| `MOL_VIA` | `bootstrap_contract.py`, `validate_contract.py`, `render_launcher.py` | unless `shell`, a reminder is printed to stderr; no other effect |
| `NO_COLOR` | `runtime.py` | when present and no explicit `--color always` is given, output is uncolored |
| `SPECSTRIDE_LEARNING` (legacy `WIGGUM_LEARNING`) | `runtime.py` `resolve_env` | always stripped from a child's inherited environment; a `specstride` stage gets `off` unless its action `env` declares a value |
| `SPECSTRIDE_LEARNING_THROUGH` | contract validation | must be declared literally by every `specstride` stage when `configuration.learning` is bound |
| any `from_env` source named in an action `env` | `runtime.py` | copied into the child; a missing required one blocks preflight (`action_env_ready`) |
| any `env_set` check's variable | `runtime.py` `check_condition` | read from the launcher's own environment |
<!-- evidence: skills/mixture-of-loops/scripts/contract_lib.py:53-74, skills/mixture-of-loops/assets/launch-contract.schema.json:73-74, skills/mixture-of-loops/scripts/runtime.py:112-144, skills/mixture-of-loops/scripts/runtime.py:401-413, skills/mixture-of-loops/scripts/runtime.py:517-527 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

## Set by the supervisor on the launcher it starts

`NO_COLOR=1` and `PYTHONDONTWRITEBYTECODE=1`, on both launch and relaunch and on the gate's dry run; stdin is `/dev/null` and the child gets a new session.
<!-- evidence: skills/mixture-of-loops/scripts/supervisor_lib.py:595-603, skills/mixture-of-loops/scripts/supervisor_lib.py:659-663 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

## Read by `bin/onboard-skill`

`HOME` (required), `DSH_HOME`, `DSH_AGENTS_HOME`, `PI_CODING_AGENT_DIR`, `PRIME_AGENT_CODING_AGENT_DIR` (a leading `~/` is expanded for the last two).
<!-- evidence: bin/onboard-skill:51-81, bin/onboard-skill:296-302 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

## Read by the tests only

| Variable | Effect |
|---|---|
| `MOL_LIVE_E2E=1` | enables Tier 3 live harness runs (`tests/test_live_e2e.py`, `tests/e2e/run_harness_e2e.py`) |
| `MOL_SHOW_MESSAGES=1` | echoes supervisor messages in `tests/test_execution_e2e.py` |
| `MOL_EXEC_STUB_*` | drive the pipeline-acting stub `tests/e2e/exec-stub-bin/specstride` |
<!-- evidence: tests/test_live_e2e.py:18-22, tests/test_execution_e2e.py:36-39, tests/e2e/exec-stub-bin/specstride:7-10 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

## Contract-level configuration keys

`configuration.auto` (`max_relaunches` 0–5, `wall_clock_seconds` > 0) and `configuration.learning` are the only keys the schema defines; the bootstrap additionally writes `color`, `specstride_live`, `agent_stream`, `live_detail` and `telemetry` (Loki and OTel both `enabled: false`). No code in `skills/mixture-of-loops/scripts/runtime.py` was found reading those five additional keys; `skills/mixture-of-loops/scripts/contract_lib.py:640-641` only renames the legacy `wiggum_live` to `specstride_live`. Their consumer, if any, is **unknown**.
<!-- evidence: skills/mixture-of-loops/assets/launch-contract.schema.json:61-87, skills/mixture-of-loops/scripts/bootstrap_contract.py:358-364, skills/mixture-of-loops/scripts/contract_lib.py:636-642 | kind=inferred | confidence=0.70 | contradicts=none | validation=unverified -->
