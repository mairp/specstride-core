# mixture-of-loops Constitution (recovered as-is)

This constitution is reconstructed from evidence in the repository at commit `9c88f86`. The
repository has no `.specify/memory/constitution.md`, no `AGENTS.md` and no `CONTRIBUTING.md`;
each principle below restates a rule the code, CI configuration, tests or README already
enforce or declare, and cites where. Nothing here is a new or recommended rule.

## Core Principles

### I. Facts and Judgment Are Separated

The bootstrap records only what is literally in the Spec Kit files (sources with SHA-256,
tasks, phases, declared commands, prerequisites) and always emits a `draft` contract with one
open blocker. The model adds the judgment, and every entry it adds carries provenance. The
model never writes `status`: only `validate_contract.py --promote` sets `validated` (with a
promotion stamp), and the renderer refuses anything not promoted.
<!-- evidence: skills/mixture-of-loops/scripts/bootstrap_contract.py:343-377, skills/mixture-of-loops/scripts/contract_lib.py:969-977, README.md:172-183 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

### II. Declared Verification Is Preserved, Never Invented

Verification commands come only from an existing `verification-commands.json` or commands
literally declared in `plan.md` / `tasks.md`. Conflicts or commands that cannot be expressed
as fixed argv become blockers rather than guesses; a phase with no declared commands stays
explicitly empty.
<!-- evidence: README.md:192-200, skills/mixture-of-loops/scripts/bootstrap_contract.py:294-299 | kind=declared | confidence=0.85 | contradicts=none | validation=verified -->

### III. Silence Is Never Consent to Execute

Generation is the default mode. Only an explicit token or execution phrasing selects `run`
or `auto`; a refusal phrase beats an invitation, an explicit token beats all prose, and
`--dry-run` never selects an execution mode.
<!-- evidence: skills/mixture-of-loops/scripts/supervisor_lib.py:114-208 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

### IV. The Supervisor Only Reads, and Relaunches Only Classified Transients

Progress comes from run telemetry (`state.json`, process liveness, logs), never from model
narration. The supervisor never edits `state.json`, removes a lock or deletes a run
directory, and relaunches only a stop the run's own records classify as transient, within a
declared budget.
<!-- evidence: skills/mixture-of-loops/scripts/supervisor_lib.py:829-845, skills/mixture-of-loops/scripts/supervisor_lib.py:962-1055, README.md:163-168 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

### V. Missing Prerequisites Are Skips, Never Passes

The test suite is tiered (hermetic, discovery/execution, live). Each tier runs on its own; a
missing prerequisite (harness binary, `MOL_LIVE_E2E`) is reported as a skip with its reason,
and CI never calls a model.
<!-- evidence: README.md:329-332, README.md:438-445, .github/workflows/ci.yml:56-63 | kind=declared | confidence=0.85 | contradicts=none | validation=verified -->

## Additional Constraints

- Standard library only: Python 3.10 or newer, Bash 4 or newer for the generated launcher,
  Linux or macOS; Dependabot tracks only GitHub Actions because the package has no
  dependencies.
<!-- evidence: README.md:202-210, .github/dependabot.yml:1-11 | kind=declared | confidence=0.90 | contradicts=none | validation=verified -->
- One canonical skill directory: every harness links to `skills/mixture-of-loops`; copied
  harness variants are not kept, and the linker refuses to replace an unrelated path.
<!-- evidence: README.md:13-14, README.md:308-309, bin/onboard-skill:250-279 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
- Exit codes are part of the interface: 20 invalid, 21 preflight, 22 stage, 23 stale, 24 lock.
<!-- evidence: skills/mixture-of-loops/scripts/runtime.py:42-46 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

## Development Workflow

- Every push to `main` and every pull request runs `.github/workflows/ci.yml`: `bash -n` on
  the linker, a parse-only `ast.parse` syntax check (never `compileall`, which would write
  `__pycache__` into the fixture repositories), and the unittest suite across Python 3.10 to
  3.13, each job bounded by a timeout.
<!-- evidence: .github/workflows/ci.yml:1-63 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- A single `ci` job fans in the matrix and is the one required check; Mergify merges
  squash-only, and only pull requests labelled `automerge` once `ci-must-pass` holds.
<!-- evidence: .github/workflows/ci.yml:65-77, .mergify.yml:1-23 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
- Pytest collects only `tests/` and never recurses into fixture repositories.
<!-- evidence: pytest.ini:1-5 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

## Governance

No amendment procedure, ratification record or versioning policy for principles exists in the
repository. The governance that is observable is the merge path: `main` requires the `ci`
check, rejects force pushes and deletions, and applies this to administrators, so every
change lands through a pull request. Branch protection itself is repository configuration
outside the tree; it is recorded here as declared in the README only.
<!-- evidence: README.md:456-462 | kind=declared | confidence=0.70 | contradicts=none | validation=unverified -->

**Version**: 0.0.0-recovered (no versioned constitution exists) | **Ratified**: unknown (no ratification recorded) | **Last Amended**: 2026-09-28 (recovered from commit 9c88f86)
