# Research: Specstride As-Is

**Feature**: `028-as-is-specstride` | **Date**: 2026-09-28 | **Plan**: [plan.md](./plan.md)

This file records the technical decisions already present in the Specstride source at git HEAD `9cab15d`. It proposes none. Every **Decision** is followed by its evidence comment. The rationale is quoted or paraphrased from the source only where the source states it. Decisions are split in two groups:

- **Group A — rationale recovered**: the source itself (a code comment, a module docstring, a CI comment) states why. The rationale cites that location. Comments rank lowest in the evidence order, so these rationales are `kind=declared` statements from the authors, not proven intent.
- **Group B — rationale unknown**: the decision is observed in the code, but no file in the tree says why. The rationale is written `unknown` and not guessed.

"Alternatives" lists only alternatives that the source itself names or visibly replaced. Where none is recorded, it says `none recorded`.

## Group A — Decisions with a recovered rationale

- **Decision**: Phase progress is coordinated by the presence of files on disk. The proposer loop's gate is a plain `test -f <evidence>`, and the orchestrator hands the evidence path to the critic only after that loop has exited.
<!-- evidence: orchestrator.sh:13-15, proposer.sh:9-12 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
  - **Rationale**: "no race window": because the loop has already stopped, the file is complete when it is read. The model is told to write it atomically with tmp + `mv` (`proposer.sh:9-12`, `orchestrator.sh:13-15`).
  - **Alternatives**: none recorded in the tracked source. The constitution (outside the inventoried tree) names an inotify watcher, a message queue or a daemon as what this excludes.

- **Decision**: The critic accepts a verdict only from its own reply, and only from a line carrying a random per-call nonce (`secrets.token_hex(8)`). A missing, duplicated or wrong-nonce verdict is recorded as `MALFORMED` and handled as a rejection.
<!-- evidence: lib/critic.py:11-15, lib/critic.py:1849-1860, lib/critic.py:2690-2690 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
  - **Rationale**: The evidence author cannot know the nonce, so a spoofed `VERDICT ...: APPROVED` inside the evidence can never approve the gate. An unattended loop "must never auto-approve on ambiguity" (`lib/critic.py:11-15`).
  - **Alternatives**: none recorded.

- **Decision**: The runtime uses only the Python standard library (for example `urllib` for HTTP, `secrets` for the nonce), plus bash and coreutils. pytest and pytest-xdist are installed only in CI, as the test runner.
<!-- evidence: lib/critic.py:16-26, .github/workflows/ci.yml:39-42 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
  - **Rationale**: "HTTP paths use stdlib urllib. No pip installs." (`lib/critic.py:19-20`). The CI comment says "The runtime is stdlib-only; pytest (+ xdist) is the only test-time dependency" (`.github/workflows/ci.yml:39-41`).
  - **Alternatives**: none recorded.

- **Decision**: Spec parsing (native, Spec Kit `tasks.md`, OpenSpec change) is owned by one module, `lib/specstride_spec.py`, behind a document-type adapter registry. `lib/critic.py` imports it instead of carrying its own grammar, and the bash side reaches it only through thin `specstride_spec_*` shims in `specstride-lib.sh`.
<!-- evidence: lib/specstride_spec.py:1-20, lib/critic.py:28-33, specstride-lib.sh:148-165 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
  - **Rationale**: The grammar "was hardcoded twice — awk in specstride-lib.sh and a regex mirror in lib/critic.py — kept in sync by hand". The module unifies them so that "a new spec format is one adapter, not a second parser to keep in sync" (`lib/specstride_spec.py:4-8`).
  - **Alternatives**: the replaced design: an awk parser in `specstride-lib.sh` plus a regex mirror in `lib/critic.py` (`lib/specstride_spec.py:4-6`). The shims "keep the exact names, arguments, stdout and exit codes the awk had" (`specstride-lib.sh:157-158`).

- **Decision**: Backend names and spellings for both roles (`dsh`, `claude`, `codex`, `bebop`, `prime`) live in one registry, `lib/backends.py`. Every other backend list is rendered from it or checked against it by `lib/test_backend_registry.py`.
<!-- evidence: lib/backends.py:1-21 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
  - **Rationale**: "no backend list may be hand-copied anywhere else". Adding a backend is one registry entry, one dispatch arm, and the test that names whatever is still missing (`lib/backends.py:4-21`).
  - **Alternatives**: the hand-copied lists this replaced are named only in the constitution's Sync Impact Report, which is outside the inventoried tree. They are not recoverable from the tracked source.

- **Decision**: A throwaway config-home overlay can be declared per backend only in the optional `overlay` field of its `lib/backends.py` registry entry. `lib/backend_overlay.py` derives its declaration table from the registry, validates it once per process, and accepts only unset, empty, `pass` or `attempt` in `SPECSTRIDE_<BACKEND>_OVERLAY`. No shipped entry sets `overlay`, so every backend resolves to scope `none`.
<!-- evidence: lib/backend_overlay.py:1-50, lib/backend_overlay.py:179-232, lib/backends.py:36-45 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
  - **Rationale**: The overlay lets a backend run "so the backend never mutates the operator's config and leaves nothing behind". The table is "DERIVED from that registry — it is never a hand-written table, so there is exactly one place a backend's overlay is described". Validation runs once so that "a bad entry stops every run before pass 1, so it cannot hide". A missing registry must "degrade to 'no backend has an overlay' ... never to a traceback" (`lib/backend_overlay.py:4-15`, `lib/backend_overlay.py:19-21`, `lib/backend_overlay.py:32-35`).
  - **Alternatives**: a hand-written declaration table, which the docstring rules out (`lib/backend_overlay.py:12-13`). Why no shipped backend declares an overlay yet is not stated.

- **Decision**: Stream adapters sit behind one seam module, `lib/stream_seam.py`, which imports only the standard library and `observability_policy`.
<!-- evidence: lib/stream_seam.py:1-8 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
  - **Rationale**: Adapters import from the seam and "never from the tap itself (`agent_stream`), which would create an import cycle" (`lib/stream_seam.py:3-6`).
  - **Alternatives**: importing from `lib/agent_stream.py` directly, which the docstring rejects (`lib/stream_seam.py:5-6`).

- **Decision**: Loki and OpenTelemetry shipping are off by default. The shippers swallow every failure with a stderr warning.
<!-- evidence: orchestrator.sh:206-209, lib/ralph_loki_ship.py:1-5 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
  - **Rationale**: Shipping is "BEST-EFFORT", so that a failure "can NEVER break the loop that calls it" (`lib/ralph_loki_ship.py:4-5`). The optional stack is "a NEW, INDEPENDENT deployment" whose ports avoid ones the host already uses (`telemetry/docker-compose.yml:1-10`).
  - **Alternatives**: none recorded.

- **Decision**: The per-workdir state directory is `.specstride/`. A workdir that has only the legacy `.wiggum/` directory keeps using it, and `SPECSTRIDE_<X>` variables fall back to legacy `WIGGUM_<X>`. `wiggum` and `wiggum-lib.sh` are forwarding aliases.
<!-- evidence: specstride-lib.sh:25-50, wiggum:1-5 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
  - **Rationale**: "Specstride was formerly Wiggum". The legacy directory is "never moved: live runs commit into it" (`specstride-lib.sh:25-29`).
  - **Alternatives**: moving the legacy directory, which the comment rules out (`specstride-lib.sh:28`).

- **Decision**: `specstride learn` may adjust only two allowlisted knobs, `proposer_timeout` and `yield_poll_interval`, within hard bounds and with at most ±50% change per step.
<!-- evidence: lib/learn.py:888-913 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
  - **Rationale**: A critic-facing knob or a breaker setting "must never be addable here without deliberately editing that test". `inject_yield_hint` was dropped because the orchestrator already appends the yield contract unconditionally, and "Narrowing the allowlist can never weaken the gate" (`lib/learn.py:888-903`).
  - **Alternatives**: `inject_yield_hint`, which was listed in the design and removed (`lib/learn.py:895-903`).

- **Decision**: A reverse run first builds a deterministic inventory without an LLM (a stdlib walk that records every file, manifest, workspace and a fingerprint). A source guard compares the source against that fingerprint after each phase.
<!-- evidence: lib/reverse_inventory.py:1-12 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
  - **Rationale**: What exists in a codebase "is not a matter for the agent's judgement, so it is settled here first, without an LLM" (`lib/reverse_inventory.py:4-6`).
  - **Alternatives**: none recorded.

- **Decision**: The reverse linter derives required headings from the Spec Kit templates at run time: the source's own `.specify/templates/` first, otherwise copies vendored unchanged in `lib/speckit_templates/` from spec-kit commit `4a7341a9`.
<!-- evidence: lib/speckit_templates/README.md:1-10, lib/reverse.py:604-611 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
  - **Rationale**: "nothing in the code lists their headings". Following a newer Spec Kit means copying the files over and rerunning `lib/test_reverse.py` (`lib/speckit_templates/README.md:7-10`).
  - **Alternatives**: none recorded.

- **Decision**: CI runs the suite with `pytest -n 16` (xdist) and oversubscribes the workers.
<!-- evidence: .github/workflows/ci.yml:31-43 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
  - **Rationale**: The suite is "sleep/timeout-bound (~32 min serial, ~3 min CPU), so oversubscribing workers is what keeps it fast" (`.github/workflows/ci.yml:40-41`).
  - **Alternatives**: a serial run, whose cost the comment quotes (`.github/workflows/ci.yml:40`).

- **Decision**: The pytest suite scrubs the caller's telemetry and run settings from the environment in `lib/conftest.py` before tests spawn orchestrator or proposer subprocesses.
<!-- evidence: lib/conftest.py:1-8 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
  - **Rationale**: Hosts often export `SPECSTRIDE_OTEL_*`/`LOKI_*`, and "without this every fixture run would be shipped to the host's LIVE Loki/OTLP stack and show up in Grafana as a real run" (`lib/conftest.py:3-6`).
  - **Alternatives**: none recorded. Tests that exercise telemetry set their own capture-server URLs instead (`lib/conftest.py:7`).

## Group B — Decisions whose rationale is unknown

- **Decision**: The drivers (front door, orchestrator, proposer) are bash scripts, while every other component is a Python module under `lib/`.
<!-- evidence: orchestrator.sh:1-23, proposer.sh:1-16 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
  - **Rationale**: unknown. No file in the tree says why the drivers are bash and not Python. The `proposer.sh` header says only that it is "a trimmed descendant of /root/utilities/ralph_loop.sh", a file outside the tree (`proposer.sh:4`).
  - **Alternatives**: unknown.

- **Decision**: A single run per workdir is enforced with `flock -n` on `.specstride/lock`, falling back to an atomic `mkdir` of `lock.d` when `flock` is absent. A held lock exits 5.
<!-- evidence: orchestrator.sh:497-523 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
  - **Rationale**: unknown. The comment names the mechanism ("flock if available, else mkdir") but not why a single run is required or why the fallback exists.
  - **Alternatives**: the `mkdir` fallback itself is the only alternative visible.

- **Decision**: The exit-code contract is fixed at 0 done, 1 internal or critic unavailable, 2 rejects exceeded, 3 invalid spec or config, 4 budget, 5 lock held, 6 stopped.
<!-- evidence: orchestrator.sh:25-33 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
  - **Rationale**: unknown. The header documents the mapping but not why these numbers were chosen.
  - **Alternatives**: unknown.

- **Decision**: The default budgets and backends are: proposer `dsh`, critic `claude`, `MAX_REJECTS` 3, `MAX_ITER` 30, proposer timeout 1800 s, critic timeout 300 s, malformed-verdict limit 3, git commits `auto`, verification `required`.
<!-- evidence: orchestrator.sh:202-227 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
  - **Rationale**: unknown for the defaults themselves. Only the malformed-verdict breaker has a stated purpose: stop "spending the rest of MAX_REJECTS on proposer passes the critic will never read" (`orchestrator.sh:218-220`).
  - **Alternatives**: unknown.

- **Decision**: The proposer repetition watchdog defaults to 12 in the code and `.env.example`, while `README.md` documents 5. The code value is the one in effect.
<!-- evidence: proposer.sh:155-166, .env.example:208-208 | kind=observed | confidence=0.80 | contradicts=README.md:1352-1353 | validation=verified -->
  - **Rationale**: unknown. No file explains the value 12 or the disagreement with the README. The disagreement is recorded, not resolved.
  - **Alternatives**: 5, as documented in `README.md:1352-1353`.

- **Decision**: CI runs on pull requests and pushes to `main`, merge groups and manual dispatch. It pins Python 3.13 on `ubuntu-latest`, and the lint job runs `bash -n` plus `shellcheck -S error` (errors only) on every tracked shell script.
<!-- evidence: .github/workflows/ci.yml:3-9, .github/workflows/ci.yml:18-38 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
  - **Rationale**: unknown. No file states why these triggers, why 3.13 or why shellcheck runs at error severity only. No minimum supported Python or Bash version is declared anywhere.
  - **Alternatives**: unknown.
