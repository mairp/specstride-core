# Implementation Plan: mixture-of-loops (as-is)

**Branch**: `011-as-is-mixture-of-loops` (a label only; no git branch was created) | **Date**: 2026-09-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `old/011-as-is-mixture-of-loops/spec.md`, recovered from the repository at commit `9c88f86`. This plan records the technical context and layout that exist today; it proposes no change.

## Summary

`mixture-of-loops` is one Agent Skills package (`skills/mixture-of-loops/`) that five harnesses (Codex, Claude Code, dsh, pi, prime) load through symlinks. Its Python scripts turn Spec Kit feature artifacts into a provenance-bound launch contract (`bootstrap_contract.py` → model derivation → `validate_contract.py --promote`), render a content-addressed bundle plus a thin Bash launcher (`render_launcher.py`), execute it unattended with locking, resume and a final `[DIGEST]` line (`runtime.py`), and let the harness supervise a launched run from its telemetry (`supervise.py` / `supervisor_lib.py`). A Bash linker (`bin/onboard-skill`) installs the links. Technical choices behind this are recorded in [research.md](research.md).

## Technical Context

**Language/Version**: Python 3.10 or newer (CI matrix 3.10, 3.11, 3.12, 3.13 — `.github/workflows/ci.yml:25-27`); Bash 4 or newer for `bin/onboard-skill` and the generated launcher (`README.md:202-207`); one Node.js ES module test probe (`tests/harness_probe.mjs`).

**Primary Dependencies**: None beyond the Python standard library (`README.md:205`, `.github/dependabot.yml:3-5`). The runtime relies on POSIX modules `fcntl`, `pty`, `selectors` and `signal` (`skills/mixture-of-loops/scripts/runtime.py:6-23`). At run time the generated pipeline invokes an externally installed `specstride` CLI (`README.md:207`).

**Storage**: Files only. Launch contracts are JSON (`schema_version` `1.0`, `skills/mixture-of-loops/assets/launch-contract.schema.json`); bundles and run state live under `.mixture-of-loops/` beside the launcher (`generated/<id>/<hash>/`, `runs/<id>/state.json`, `lock`, `launcher.log`, `harness-run.json` — `skills/mixture-of-loops/scripts/contract_lib.py:30-31`, `skills/mixture-of-loops/scripts/supervisor_lib.py:63-68`).

**Testing**: `unittest` (`python3 -m unittest discover -s tests -v`, `.github/workflows/ci.yml:56-63`) in three tiers: hermetic, Tier 2 discovery/execution, Tier 3 live behind `MOL_LIVE_E2E=1` (`README.md:329-357`). `pytest.ini` also exists and limits collection to `tests/` without recursing into `fixtures`. `bash -n` and `shellcheck` on the linker.

**Target Platform**: Linux or macOS local execution; Windows and cloud-hosted skill sync are declared not validated (`README.md:202-210`).

**Project Type**: Agent Skills package — command-line scripts plus a skill instruction file (`skills/mixture-of-loops/SKILL.md`), with a Bash installer.

**Performance Goals**: No throughput target exists. Observed bounds: CI test job timeout 10 minutes, fan-in job 5 minutes (`.github/workflows/ci.yml:22,70`); supervisor polling at 60 s base, ×1.5 back-off, 600 s cap (`skills/mixture-of-loops/scripts/supervisor_lib.py:71-73`); default stage timeout 3600 s and relaunch budget default 2, maximum 5 (`skills/mixture-of-loops/scripts/contract_lib.py:49-51`).

**Constraints**: Runs unattended with stdin closed and no terminal (`skills/mixture-of-loops/SKILL.md:8-10`); child processes get `stdin=DEVNULL` and their own session; exit codes 20–24 are interface (`skills/mixture-of-loops/scripts/runtime.py:42-46`); CI never calls a model (`README.md:442-444`); the model must stay inside the repository and `SKILL_ROOT` (`skills/mixture-of-loops/SKILL.md:22-30`).

**Scale/Scope**: 50 tracked text files, 14 302 lines (inventory). Seven Python scripts totalling 4 072 lines in `skills/mixture-of-loops/scripts/`; nine top-level test modules plus the e2e runner and two fixture repositories.

## Constitution Check

*GATE: checked against `old/011-as-is-mixture-of-loops/memory/constitution.md` (recovered). Because this is an as-is record, the check asks whether the current code conforms to each recovered principle.*

| Principle | Status | Where the current code shows it |
|---|---|---|
| I. Facts and Judgment Are Separated | Pass | bootstrap emits `draft` + blocker; only `--promote` stamps `validated` (`skills/mixture-of-loops/scripts/contract_lib.py:951-977`) |
| II. Declared Verification Is Preserved, Never Invented | Pass | candidates only from declared commands (`skills/mixture-of-loops/scripts/bootstrap_contract.py:161-188`) |
| III. Silence Is Never Consent to Execute | Pass | `select_mode` defaults to `generate` (`skills/mixture-of-loops/scripts/supervisor_lib.py:179-208`) |
| IV. Supervisor Only Reads, Relaunches Only Classified Transients | Pass | `TRANSIENT_STAGE_REASONS` (`skills/mixture-of-loops/scripts/supervisor_lib.py:80`) and the relaunch classifier `classify_relaunch` (`skills/mixture-of-loops/scripts/supervisor_lib.py:962-1055`) |
| V. Missing Prerequisites Are Skips, Never Passes | Pass | Tier 2/3 skip without binaries or `MOL_LIVE_E2E` (`.github/workflows/ci.yml:56-63`) |
| Standard library only | Pass | no dependency manifest; Dependabot tracks only GitHub Actions |
| One canonical skill directory | Pass | `.agents/skills/mixture-of-loops` and `.claude/skills/mixture-of-loops` are symlinks to `../../skills/mixture-of-loops` |
| Exit codes are interface | Pass | `E_INVALID`…`E_LOCK` defined identically in `runtime.py:42-46` and `supervisor_lib.py:48-53` |
| CI workflow / Mergify merge path | Pass | `.github/workflows/ci.yml:1-77`, `.mergify.yml:1-23` |

No violation was found, so *Complexity Tracking* is empty.

## Project Structure

### Documentation (this feature)

```text
old/011-as-is-mixture-of-loops/
├── memory/
│   └── constitution.md      # recovered constitution (phase 1)
├── spec.md                  # as-is specification (phase 1)
├── checklists/
│   └── requirements.md      # specification quality checklist (phase 1)
├── plan.md                  # this file (phase 2)
└── research.md              # recovered technical decisions (phase 2)
```

### Source Code (repository root)

```text
.
├── .agents/skills/mixture-of-loops -> ../../skills/mixture-of-loops   # symlink (Codex, dsh, pi, prime)
├── .claude/skills/mixture-of-loops -> ../../skills/mixture-of-loops   # symlink (Claude Code)
├── .github/
│   ├── dependabot.yml               # weekly GitHub Actions bumps, label automerge
│   └── workflows/ci.yml             # syntax check + unittest matrix 3.10–3.13, fan-in `ci`
├── .gitignore
├── .mergify.yml                     # squash-merge queue on label automerge + ci
├── README.md
├── pytest.ini                       # testpaths = tests, norecursedirs = fixtures
├── bin/
│   └── onboard-skill                # Bash linker: --harness, --scope, --check, --repair
├── skills/
│   └── mixture-of-loops/            # the one canonical skill package (SKILL_ROOT)
│       ├── SKILL.md                 # skill instructions read by every harness
│       ├── agents/openai.yaml       # Codex interface metadata
│       ├── assets/launch-contract.schema.json
│       ├── references/
│       │   ├── contract.md
│       │   └── derivation.md
│       └── scripts/
│           ├── bootstrap_contract.py    # facts → draft contract
│           ├── contract_lib.py          # shared validation, hashing, promotion stamp
│           ├── validate_contract.py     # strict check, --promote
│           ├── render_launcher.py       # bundle + Bash launcher
│           ├── runtime.py               # unattended executor (copied into each bundle)
│           ├── supervise.py             # harness-side CLI: mode, gate, launch, watch, retro …
│           └── supervisor_lib.py        # mode selection, launch gate, telemetry, relaunch policy
└── tests/
    ├── harness_probe.mjs            # Tier 2 Node probe of pi / prime loaders
    ├── test_docs.py
    ├── test_e2e_logic.py
    ├── test_execution_e2e.py        # Tier 2 execution against exec-stub-bin
    ├── test_fixtures.py
    ├── test_harness_discovery.py    # Tier 2 discovery
    ├── test_live_e2e.py             # Tier 3 gate (MOL_LIVE_E2E)
    ├── test_mixture_of_loops.py
    ├── test_onboarding_harnesses.py
    ├── test_supervision.py
    ├── e2e/
    │   ├── exec-stub-bin/specstride     # pipeline-acting stub
    │   ├── stub-bin/specstride          # refusing dry-run stub
    │   ├── home_snapshot.py
    │   ├── mol_e2e.py
    │   └── run_harness_e2e.py           # Tier 3 live runner
    └── fixtures/
        ├── derive_expectations.py
        ├── expectations/{greeting-blocked,greeting-ready}.json
        ├── implementations/greeting/{src/greet.py,tests/test_greet.py}
        └── repos/
            ├── greeting-blocked/{README.md,specs/001-greeting/{spec,plan,tasks}.md}
            └── greeting-ready/{README.md,approvals/release-approval.json,specs/001-greeting/{spec,plan,tasks}.md}
```

**Structure Decision**: A single-package layout. All product code is the one skill directory `skills/mixture-of-loops/` (scripts, references, assets, `SKILL.md`); harness-specific discovery is provided by symlinks and by `bin/onboard-skill`, never by copies. Tests live flat in `tests/` with live/e2e runners in `tests/e2e/` and hermetic fixture repositories in `tests/fixtures/`. There is no `src/`, no frontend/backend split and no mobile target.

## Complexity Tracking

None.
