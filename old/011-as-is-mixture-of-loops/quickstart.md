# Quickstart: mixture-of-loops (as-is)

Every command below is copied from the repository's own manifests and documentation (`README.md`, `skills/mixture-of-loops/SKILL.md`, `.github/workflows/ci.yml`, `bin/onboard-skill`). **None of them was executed by the reverse run**: this phase was read-only, so each command carries the label `# not executed by the reverse run`, and no output shown here was observed. Upper-case words (`REPOSITORY`, `FEATURE_PATH`, `LAUNCH_CONTRACT`, `RUN_SCRIPT`, `SKILL_ROOT`, `MODE`) are the stand-ins the source documents use.

## Prerequisites (as documented)

Python 3.10 or newer (CI matrix 3.10–3.13), Bash 4 or newer, Linux or macOS, and, for a real run, a Specstride installation compatible with the contract. No package install step exists: there is no dependency manifest.
<!-- evidence: README.md:200-210, .github/workflows/ci.yml:20-30 | kind=declared | confidence=0.85 | contradicts=none | validation=verified -->

## 1. Install the skill into a harness

```bash
./bin/onboard-skill --harness codex --scope user   # not executed by the reverse run
./bin/onboard-skill --harness claude --scope user   # not executed by the reverse run
./bin/onboard-skill --harness all --scope user   # not executed by the reverse run
./bin/onboard-skill --harness all --scope repo --repo /path/to/project   # not executed by the reverse run
./bin/onboard-skill --harness all --scope user --check   # not executed by the reverse run
```
<!-- evidence: README.md:215-245, README.md:295-299 | kind=declared | confidence=0.90 | contradicts=none | validation=verified -->

## 2. Derive, promote and render a launcher (mode `generate`)

The documented sequence a harness runs, one shell command line each:

```bash
python3 SKILL_ROOT/scripts/supervise.py mode --request "THE REQUEST, VERBATIM"   # not executed by the reverse run
python3 SKILL_ROOT/scripts/supervise.py learning --request "THE REQUEST, VERBATIM"   # not executed by the reverse run
MOL_VIA=shell python3 SKILL_ROOT/scripts/bootstrap_contract.py --repo REPOSITORY --feature FEATURE_PATH --learning-mode MODE --output LAUNCH_CONTRACT   # not executed by the reverse run
MOL_VIA=shell python3 SKILL_ROOT/scripts/validate_contract.py --promote LAUNCH_CONTRACT   # not executed by the reverse run
MOL_VIA=shell python3 SKILL_ROOT/scripts/render_launcher.py --contract LAUNCH_CONTRACT --output RUN_SCRIPT   # not executed by the reverse run
bash -n RUN_SCRIPT   # not executed by the reverse run
RUN_SCRIPT --dry-run   # not executed by the reverse run
```
<!-- evidence: skills/mixture-of-loops/SKILL.md:53-73, skills/mixture-of-loops/SKILL.md:128-135, skills/mixture-of-loops/SKILL.md:180-208 | kind=declared | confidence=0.90 | contradicts=none | validation=verified -->

Between the bootstrap and `--promote`, the model completes the derivation in the contract; SKILL.md steps 4–7 describe that work, which has no command of its own.

## 3. Run and supervise (modes `run` and `auto`)

```bash
python3 SKILL_ROOT/scripts/supervise.py resolve --repo REPOSITORY --feature FEATURE_PATH   # not executed by the reverse run
python3 SKILL_ROOT/scripts/supervise.py gate --launcher RUN_SCRIPT   # not executed by the reverse run
python3 SKILL_ROOT/scripts/supervise.py auto --launcher RUN_SCRIPT   # not executed by the reverse run
python3 SKILL_ROOT/scripts/supervise.py observe --launcher RUN_SCRIPT   # not executed by the reverse run
python3 SKILL_ROOT/scripts/supervise.py stop --launcher RUN_SCRIPT   # not executed by the reverse run
```
<!-- evidence: skills/mixture-of-loops/SKILL.md:225-285 | kind=declared | confidence=0.90 | contradicts=none | validation=verified -->

The launcher can also be run directly, per the runtime's own flags:

```bash
RUN_SCRIPT --implement --smoke   # not executed by the reverse run
```
<!-- evidence: skills/mixture-of-loops/scripts/runtime.py:549-556 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

## 4. Invoke from a harness

```bash
dsh --profile headless "/mixture-of-loops derive a pipeline for specs/007-example"   # not executed by the reverse run
```
<!-- evidence: README.md:314-317 | kind=declared | confidence=0.85 | contradicts=none | validation=verified -->

## 5. Develop and validate

```bash
python3 -m unittest discover -s tests -v   # not executed by the reverse run
bash -n bin/onboard-skill   # not executed by the reverse run
shellcheck bin/onboard-skill   # not executed by the reverse run
python3 -m unittest tests.test_harness_discovery -v   # not executed by the reverse run
MOL_SHOW_MESSAGES=1 python3 -m unittest tests.test_execution_e2e -v   # not executed by the reverse run
MOL_LIVE_E2E=1 python3 tests/e2e/run_harness_e2e.py --harness all   # not executed by the reverse run
MOL_LIVE_E2E=1 python3 tests/e2e/run_harness_e2e.py --harness all --mode auto --fixture ready   # not executed by the reverse run
```
<!-- evidence: README.md:333-357, .github/workflows/ci.yml:56-63 | kind=declared | confidence=0.90 | contradicts=none | validation=verified -->

CI (`.github/workflows/ci.yml`) runs `bash -n bin/onboard-skill`, an `ast.parse` syntax check of every `*.py`, and `python3 -m unittest discover -s tests -v` with `PYTHONDONTWRITEBYTECODE=1`; Tier 3 stays skipped there because `MOL_LIVE_E2E` is unset.
