# Implementation Plan: Specstride As-Is

**Branch**: `028-as-is-specstride` (no branch is created; reverse runs never branch) | **Date**: 2026-09-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `old/028-as-is-specstride/spec.md`

**Note**: This is an as-is baseline reverse-engineered, read-only, from the Specstride source at git HEAD `9cab15d`. It records the current technology and layout. It plans no change. The file list, languages, manifests and entry points come from `.specstride/reverse/specstride/INVENTORY.md`.

## Summary

Specstride is a spec-driven loop runner. For each phase of a Spec Kit, OpenSpec or native spec, a bash orchestrator (`orchestrator.sh`) runs a headless coding-agent proposer (`proposer.sh`) until the phase's evidence file appears. It then asks an LLM critic (`lib/critic.py`) for a nonce-bound verdict and advances, retries or halts on that verdict. Around this loop the source ships an operator front door (`specstride`), a learning pass (`lib/learn.py`), a reverse-engineering mode (`lib/reverse.py`, `lib/reverse_inventory.py`) and optional Loki/OpenTelemetry shipping (`telemetry/`). The technical choices behind this are listed in [research.md](./research.md).

## Technical Context

**Language/Version**: Bash for the drivers (`orchestrator.sh`, `proposer.sh`, `specstride`, `specstride-lib.sh`, `specstride-digest.sh`, `wiggum`, `wiggum-lib.sh`) and Python 3 for every component under `lib/` (83 Python files in the inventory). CI pins Python 3.13 (`.github/workflows/ci.yml:36-38`). No minimum Bash version is declared anywhere in the tree; it is unknown.

**Primary Dependencies**: Python standard library only at runtime (for example `secrets` and `urllib` in `lib/critic.py:26`), plus coreutils, `git` and, optionally, `flock`. External coding-agent CLIs are chosen by backend name from `lib/backends.py` (`dsh`, `claude`, `codex`, `bebop`, `prime`). They are called as subprocesses, not imported. A registry entry may declare a throwaway config-home overlay in its optional `overlay` field, which `lib/backend_overlay.py` derives its table from; no shipped entry declares one (`lib/backends.py:36-45`, `lib/backend_overlay.py:44-50`).

**Storage**: Plain files. Per-workdir state lives under `.specstride/` (legacy `.wiggum/`): gate markers, evidence, feedback, attempts, `events.jsonl`, `run.log`, `last-run.conf` and the lock. There is no database.

**Testing**: pytest with pytest-xdist, dev-only (`python -m pytest lib/ -q -n 16`, `.github/workflows/ci.yml:39-43`), over 45 `lib/test_*.py` files and recorded fixtures under `lib/fixtures/`. `lib/conftest.py` keeps the suite hermetic from the host's telemetry settings (`lib/conftest.py:1-8`). The CI lint job runs `bash -n` and `shellcheck -S error` on every tracked shell script (`.github/workflows/ci.yml:19-29`). CI triggers on pull requests and pushes to `main`, merge groups and manual dispatch (`.github/workflows/ci.yml:3-10`).

**Target Platform**: A Linux host with bash (CI uses `ubuntu-latest`). The optional telemetry stack is a Docker Compose deployment (`telemetry/docker-compose.yml`: grafana, loki, otel-collector, prometheus).

**Project Type**: CLI tool / script suite (a bash front door and drivers over Python helper modules). There is no package manifest for Specstride itself; it runs from a clone.

**Performance Goals**: None are declared. Only bounded budgets exist: proposer timeout 1800 s, critic timeout 300 s, `MAX_ITER` 30 and `MAX_REJECTS` 3 (`orchestrator.sh:200-221`).

**Constraints**: One run per workdir (`flock` on `.specstride/lock`, else a `lock.d` directory; `orchestrator.sh:497-523`). Exit-code contract 0–6 (`orchestrator.sh:25-33`). No runtime third-party dependency. Telemetry is off by default. Overlay scope variables `SPECSTRIDE_<BACKEND>_OVERLAY` accept only unset, empty, `pass` or `attempt` (`lib/backend_overlay.py:198-232`).

**Scale/Scope**: 418 text files, 52,560 lines (inventory). The largest components are `lib/critic.py` (2,850 lines), `lib/verification_plan.py` (2,421), `proposer.sh` (2,365), `orchestrator.sh` (2,277), `lib/learn.py` (2,221) and `lib/reverse.py` (1,414).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Checked against `.specify/memory/constitution.md` (v2.0.3). This feature writes documentation only (under `old/028-as-is-specstride/` and `.specstride/`) and changes no code, so no gate can be violated by it. Each row also records whether the current code matches the principle.

**Core (I–VI, descriptive — re-verify if the feature touches them)**

- [x] I. ✅ Coordination stays file-based: the proposer loop gates on `test -f <evidence>` and the orchestrator hands the path to the critic only after that loop exits (`orchestrator.sh:13-15`, `proposer.sh:9-12`). Nothing here adds a watcher.
- [x] II. ✅ The gate accepts only a verdict line carrying the per-call nonce (`secrets.token_hex(8)`, `lib/critic.py:2690`). Ambiguity counts as REJECTED (`lib/critic.py:11-15`). Unchanged.
- [x] III. ✅ The critic grounds on read-only snapshots of cited files (`lib/critic.py:1-20`). Unchanged.
- [x] IV. ✅ Spec grammar is owned by `lib/specstride_spec.py`, which `lib/critic.py` imports (`lib/critic.py:28-33`) and which `specstride-lib.sh` reaches through thin `specstride_spec_*` shims (`specstride-lib.sh:148-165`). This feature adds no grammar.
- [x] V. ✅ Telemetry shipping is opt-in (`orchestrator.sh:206-209`). This feature adds no observability code.
- [x] VI. ✅ The runtime is stdlib + bash + coreutils. pytest/xdist is the one dev-only test runner (`.github/workflows/ci.yml:39-42`). This feature adds no dependency.

**Scope (XII, every feature)**

- [x] XII. ✅ The whole baseline was produced read-only on this host: `ls`, `cat`, `grep`, `git log`, and the local `lib/reverse.py` lint/guard. It needs no network, vendor account, other person or service.

**Backends (VII–XI, normative — required for features that touch a proposer/critic arm)**

- [x] VII. N/A — no backend is added or renamed. For the record, the single registry is `lib/backends.py`, and the config-home overlay declarations are derived from it rather than hand-copied (`lib/backend_overlay.py:7-15`).
- [x] VIII. N/A — no proposer arm is touched.
- [x] IX. N/A — no critic path is touched.
- [x] X. N/A — no harness version handling is touched.
- [x] XI. N/A — no stream adapter is added. For the record, the seam is `lib/stream_seam.py`.
- [x] N/A — no backend fact is relied on beyond what the source files state.
- [x] N/A — no backend arm is touched, so no fake-binary test is owed.

Result: PASS (no violations; see *Complexity Tracking*).

## Project Structure

### Documentation (this feature)

```text
old/028-as-is-specstride/
├── spec.md                   # Phase 1: as-is specification (written)
├── checklists/
│   └── requirements.md       # Phase 1: spec quality checklist (written)
├── plan.md                   # Phase 2: this file
├── research.md               # Phase 2: evidenced decisions
├── data-model.md             # Phase 3: entities (written)
├── quickstart.md             # Phase 3: documented commands, not executed (written)
├── contracts/                # Phase 3: cli, events, files-on-disk, config-env, telemetry-http (written)
└── tasks.md                  # Phase 4: as-is task record (written)
```

### Source Code (repository root)

The tree below is the git-tracked layout at HEAD `9cab15d`, taken from the inventory. Directories with many files are summarised with counts. Untracked or ignored local directories (`specs/`, `.specify/`, `roadmap/`, `drafts/`, `prompts/`, `testautomation/` and so on) are not part of the inventory and are not shown.

```text
specstride/
├── specstride               # bash front door: run/status/watch/tail/events/verdicts/feedback/phases/stop/resume/learn/reverse …
├── orchestrator.sh          # "Maggie": phase loop, lock, exit-code contract, retries, diagnostician/accelerator
├── proposer.sh              # "Ralph": headless coding-agent pass loop, watchdogs, yield contract
├── specstride-lib.sh        # shared bash helpers: state-dir resolution, env aliasing, event stream
├── specstride-digest.sh     # compresses one live run's state into ~40 lines for a babysitting agent (workdir hard-coded)
├── wiggum, wiggum-lib.sh    # deprecated aliases from the Wiggum rename
├── .env.example             # every SPECSTRIDE_* knob with its default
├── README.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md, ENHANCEMENT.md, LICENSE, SPECS.example.md
├── .gitignore, .mailmap, .mergify.yml
├── .github/
│   ├── workflows/ci.yml     # lint (bash -n + shellcheck) and test (pytest -n 16, Python 3.13)
│   ├── ISSUE_TEMPLATE/      # bug_report.md, feature_request.md, config.yml
│   └── pull_request_template.md
├── .claude/
│   ├── skills/              # 28 files: project skills and archived skills
│   └── autoharness/         # 37 files: recorded harness run state
├── lib/                     # every Python component (74 files at this level)
│   ├── critic.py            # "Lisa": grounded, nonce-bound critic and diagnostician
│   ├── specstride_spec.py   # the one spec grammar (native / speckit-tasks / openspec-change)
│   ├── backends.py          # the one backend registry
│   ├── backend_overlay.py   # throwaway config-home overlays (table derived from backends.py; empty in the shipped tree)
│   ├── agent_stream.py, stream_seam.py, prime_stream.py   # stream tap and adapters
│   ├── verification_plan.py, verification_failure_digest.py, verdict_pins.py
│   ├── learn.py             # `specstride learn`
│   ├── reverse.py, reverse_inventory.py   # reverse mode: plan / lint / guard, inventory
│   ├── present.py, banner.py, theme.py    # terminal presentation
│   ├── ralph_loki_ship.py, ralph_otel_ship.py, ralph_otel_spans.py, telemetry_delivery.py
│   ├── error_breaker.py, failure_ledger.py, finalize_invocation.py, invocation_result.py
│   ├── observability_policy.py, specstride_env.py, dsh_plugin_requests.py, _test_http.py
│   ├── conftest.py, test_*.py   # hermetic-env fixture + 45 pytest modules
│   ├── speckit_templates/   # 7 files: vendored Spec Kit templates + LICENSE + README
│   └── fixtures/            # 226 files: learn, overlay_baseline, prime-v3, reverse, stream-golden, stream-test-v1, fake prime
├── telemetry/               # optional stack: docker-compose.yml, loki/, otel/, prometheus/, provisioning/, dashboards/
├── docs/                    # LOCAL-MODEL-TUNING.md, media/ (demo tape, events, gif/png)
├── examples/                # speckit-tasks.example.md, openspec-tasks.example.md
└── wiki/                    # 11 pages: Architecture, CLI-Reference, Configuration, … Telemetry
```

**Structure Decision**: The repository is one flat CLI project: bash entry scripts at the root and all Python modules, with their tests beside them, in `lib/`. It has no `src/` or `tests/` split, no package manifest and no workspaces of its own. The only `package.json`/`pyproject.toml` files are test fixtures under `lib/fixtures/reverse/`. Optional deployment assets are in `telemetry/`, and user documentation is in `README.md`, `wiki/` and `docs/`.

## Complexity Tracking

None. The Constitution Check has no violation to justify.
