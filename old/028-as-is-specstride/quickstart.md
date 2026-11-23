# Quickstart: Specstride As-Is

This quickstart restates the commands that Specstride's own manifests and docs give (`README.md`, `.github/workflows/ci.yml`). **Every command below is labelled *not executed by the reverse run*.** The reverse run was read-only. It ran none of these commands, so their output is not observed here.

Prerequisites, as the README states them: Python 3.13, Bash, a proposer CLI (for example Claude Code) and the critic's API key (`ANTHROPIC_API_KEY`, or `OPENAI_API_KEY` for `codex`).
<!-- evidence: README.md:26-27 | kind=declared | confidence=0.80 | contradicts=none | validation=unverified -->

## 1. Get the code and configure it

<!-- evidence: README.md:29-33, README.md:643-644 | kind=declared | confidence=0.80 | contradicts=none | validation=unverified -->

```bash
git clone https://github.com/mairp/specstride && cd specstride   # not executed by the reverse run
cp .env.example .env                                              # not executed by the reverse run
```

## 2. Run a demo feature

<!-- evidence: README.md:30-32, README.md:650-652 | kind=declared | confidence=0.80 | contradicts=none | validation=unverified -->

```bash
mkdir -p /tmp/demo/specs/001-greeting                                                  # not executed by the reverse run
cp examples/speckit-tasks.example.md /tmp/demo/specs/001-greeting/tasks.md             # not executed by the reverse run
SPECSTRIDE_PROPOSER=claude SPECSTRIDE_CRITIC=claude ./specstride run -w /tmp/demo      # not executed by the reverse run
```

## 3. Inspect and control the run from a second terminal

<!-- evidence: README.md:34-34, README.md:413-417, specstride:22-23 | kind=declared | confidence=0.80 | contradicts=none | validation=unverified -->

```bash
./specstride watch  -w /tmp/demo     # not executed by the reverse run
./specstride status -w /tmp/demo     # not executed by the reverse run
./specstride stop   -w /tmp/demo     # not executed by the reverse run
./specstride resume -w /tmp/demo     # not executed by the reverse run
```

## 4. Reverse-engineer a codebase

<!-- evidence: README.md:226-227 | kind=declared | confidence=0.80 | contradicts=none | validation=unverified -->

```bash
./specstride reverse ~/projects/foo --dry-run    # not executed by the reverse run
./specstride reverse ~/projects/foo              # not executed by the reverse run
```

## 5. Learning loop (read-only by default)

<!-- evidence: README.md:750-764 | kind=declared | confidence=0.80 | contradicts=none | validation=unverified -->

```bash
./specstride learn --show        # not executed by the reverse run
./specstride learn --summarize   # not executed by the reverse run
```

## 6. Optional telemetry stack

<!-- evidence: README.md:1412-1413 | kind=declared | confidence=0.75 | contradicts=none | validation=unverified -->

```bash
(cd telemetry && docker compose up -d)                              # not executed by the reverse run
./specstride --telemetry --loki-url http://localhost:3110 -w /tmp/demo   # not executed by the reverse run
```

## 7. Tests and shell lint, as CI runs them

CI has two jobs, `lint` and `test`, on pull requests and pushes to `main`, merge groups and manual dispatch. `lib/conftest.py` keeps the tests hermetic from host telemetry settings.

<!-- evidence: .github/workflows/ci.yml:1-43, lib/conftest.py:1-8 | kind=declared | confidence=0.85 | contradicts=none | validation=unverified -->

```bash
python -m pip install pytest pytest-xdist       # not executed by the reverse run
python -m pytest lib/ -q -n 16 --durations=10   # not executed by the reverse run
```

The `lint` job, over every tracked shell script:

```bash
mapfile -t scripts < <(git ls-files -z | xargs -0 file | grep -i 'shell script' | cut -d: -f1)   # not executed by the reverse run
for f in "${scripts[@]}"; do bash -n "$f"; done                                                  # not executed by the reverse run
shellcheck -S error "${scripts[@]}"                                                              # not executed by the reverse run
```
