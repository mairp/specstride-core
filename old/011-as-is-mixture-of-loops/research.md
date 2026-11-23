# Research: mixture-of-loops (as-is)

Recovered technical decisions of the repository at commit `9c88f86`. Each **Decision**
states what the code, configuration or tests do today and carries its evidence on the next
line. **Rationale** is quoted or paraphrased only from a source that states it (the cited
line is given); where no source states why, it is written `unknown` and nothing is
inferred. **Alternatives** names only alternatives the repository itself mentions; otherwise
`unknown`. Nothing here is a recommendation.

The decisions are split in two groups so that evidenced rationale and unknown rationale do
not mix.

## Decisions with an evidenced rationale

- **Decision**: The package uses only the Python standard library (Python 3.10+) and tracks no dependencies other than GitHub Actions pins.
<!-- evidence: README.md:202-207, .github/dependabot.yml:1-11, .github/workflows/ci.yml:25-27 | kind=declared | confidence=0.90 | contradicts=none | validation=verified -->
  - **Rationale**: Dependabot only tracks Actions because "the package itself has no dependencies to track" (`.github/dependabot.yml:3-5`). Why a standard-library-only design was chosen in the first place is unknown.
  - **Alternatives**: unknown.

- **Decision**: CI syntax-checks every Python file with `ast.parse` (parse only), never with `compileall`.
<!-- evidence: .github/workflows/ci.yml:38-54 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
  - **Rationale**: `compileall` writes `__pycache__` beside the sources, including the two fixture repositories, which a test asserts are byte-identical apart from the approval file (`README.md:447-450`, `.github/workflows/ci.yml:39-41`).
  - **Alternatives**: `compileall`, named and rejected in the same comment.

- **Decision**: The bootstrap records only literal facts and always emits a `draft` contract with one open blocker; the model adds judgment with provenance; only `validate_contract.py --promote` writes `validated`.
<!-- evidence: skills/mixture-of-loops/scripts/bootstrap_contract.py:343-377, README.md:170-183 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
  - **Rationale**: The failure the design targets is "silent omission" — a generic test passes while a declared command or policy was never exercised — so facts and judgment are separated (`README.md:172-180`).
  - **Alternatives**: unknown.

- **Decision**: `--promote` writes a `promotion` stamp (SHA-256 over the canonical contract minus `status` and `promotion`), and the renderer refuses a `validated` contract whose stamp is missing or does not match.
<!-- evidence: skills/mixture-of-loops/scripts/contract_lib.py:951-977 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
  - **Rationale**: A comment states it was added after a live run in which a model (2026-09-24, gpt-5, prime) set `validated` itself (`skills/mixture-of-loops/scripts/contract_lib.py:969-973`). Comment-level evidence, lowest precedence.
  - **Alternatives**: unknown.

- **Decision**: Source files are hashed twice: raw SHA-256 and, for `tasks.md`, a semantic SHA-256 with task checkboxes normalized; a raw mismatch is stale unless the semantic hash still matches.
<!-- evidence: skills/mixture-of-loops/scripts/bootstrap_contract.py:36-49, skills/mixture-of-loops/scripts/contract_lib.py:340-371 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
  - **Rationale**: So that task progress is not mistaken for a requirements change, which is what makes resume safe (`README.md:185-188`).
  - **Alternatives**: unknown.

- **Decision**: The renderer publishes a content-addressed bundle `.mixture-of-loops/generated/<id>/<sha256[:20]>/` holding the canonical contract, `runtime.py` and `contract_lib.py`, written to a temporary directory, fsynced and moved into place with `os.replace`.
<!-- evidence: skills/mixture-of-loops/scripts/render_launcher.py:67-94 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
  - **Rationale**: "The contract is the artifact; the launcher is disposable"; a content-addressed bundle lets the runtime re-check the binding and skip stages that already hold (`README.md:185-188`).
  - **Alternatives**: unknown.

- **Decision**: Every child action runs with `stdin=DEVNULL` in its own session (`start_new_session=True`); a `specstride` stage gets a pseudo-terminal only when colour is on and stdout is not a TTY.
<!-- evidence: skills/mixture-of-loops/scripts/runtime.py:340-361 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
  - **Rationale**: The pipeline must finish, recover or fail with evidence "while stdin is closed and no terminal is attached" (`skills/mixture-of-loops/SKILL.md:8-10`). Why a PTY is used for colour output specifically is unknown.
  - **Alternatives**: unknown.

- **Decision**: Execution mode defaults to `generate`; only an explicit token or execution phrasing selects `run` or `auto`, and `--dry-run` never selects an execution mode.
<!-- evidence: skills/mixture-of-loops/scripts/supervisor_lib.py:114-208 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
  - **Rationale**: "Silence is never consent to execute" (`README.md:37-39`).
  - **Alternatives**: the three modes `generate`, `run`, `auto` are the documented options (`README.md:41-49`).

- **Decision**: The contract still accepts the legacy stage kind `wiggum`, legacy `WIGGUM_` environment prefix and `.wiggum` state directory, normalizing them to `specstride` with a deprecation warning.
<!-- evidence: skills/mixture-of-loops/scripts/contract_lib.py:16-29, skills/mixture-of-loops/scripts/contract_lib.py:615-656 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
  - **Rationale**: Specstride was formerly Wiggum; older contracts keep validating (`README.md:10-11`).
  - **Alternatives**: unknown.

- **Decision**: One canonical skill directory is shared by all harnesses through symlinks created by `bin/onboard-skill`, which refuses to replace an unrelated path and repairs only existing symlinks.
<!-- evidence: bin/onboard-skill:250-279, README.md:13-14, README.md:301-309 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
  - **Rationale**: "so fixes do not drift between copies" (`README.md:13-14`).
  - **Alternatives**: copied per-harness variants, which the README says not to keep (`README.md:308-309`).

- **Decision**: Tier 2 discovery tests call each harness's own resource loader through a Node.js probe (`tests/harness_probe.mjs`) with a temporary `HOME`, and skip when `node`, `pi` or `prime-agent` is missing.
<!-- evidence: tests/harness_probe.mjs:1-20, README.md:370-376 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->
  - **Rationale**: To check discovery by the installed loaders themselves without calling a model, making network requests or starting a daemon (`tests/harness_probe.mjs:2-3`).
  - **Alternatives**: unknown.

- **Decision**: The supervisor polls run telemetry no tighter than every 60 s, backs off ×1.5 up to 600 s while a stage runs long, and returns to the base interval at a stage boundary or recovery.
<!-- evidence: skills/mixture-of-loops/scripts/supervisor_lib.py:71-73, skills/mixture-of-loops/scripts/supervisor_lib.py:1175-1180 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
  - **Rationale**: Only the behaviour is stated in the docstring (`skills/mixture-of-loops/scripts/supervisor_lib.py:1177-1178`); why these particular numbers were chosen is unknown.
  - **Alternatives**: unknown.

## Decisions whose rationale is unknown

- **Decision**: The launcher is a thin Bash script that embeds its own content digest (`# generated-content-sha256:`) and `exec`s `python3 runtime.py --contract … --launch-dir …` from the bundle.
<!-- evidence: skills/mixture-of-loops/scripts/render_launcher.py:97-110 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
  - **Rationale**: unknown.
  - **Alternatives**: unknown.

- **Decision**: The runtime takes a non-blocking exclusive `fcntl.flock` on `runs/<id>/lock`; a second launcher prints `[BLOCKED]` and exits 24.
<!-- evidence: skills/mixture-of-loops/scripts/runtime.py:575-586 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
  - **Rationale**: unknown.
  - **Alternatives**: unknown.

- **Decision**: Exit codes 20 (invalid), 21 (preflight), 22 (stage), 23 (stale), 24 (lock) are defined as constants, duplicated in `runtime.py` and `supervisor_lib.py`.
<!-- evidence: skills/mixture-of-loops/scripts/runtime.py:42-46, skills/mixture-of-loops/scripts/supervisor_lib.py:48-53 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->
  - **Rationale**: unknown (neither the numbering nor the duplication is explained).
  - **Alternatives**: unknown.

- **Decision**: The JSON Schema `assets/launch-contract.schema.json` is documentation and model guidance; no script loads it — validation is hand-written in `contract_lib.validate_contract` and is stricter than the schema.
<!-- evidence: skills/mixture-of-loops/references/contract.md:3-6, skills/mixture-of-loops/scripts/contract_lib.py:656-661 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->
  - **Rationale**: unknown (a standard-library-only constraint is plausible but is not stated anywhere).
  - **Alternatives**: unknown.

- **Decision**: The suite is run with `unittest` (`python3 -m unittest discover -s tests`), while a `pytest.ini` is also kept that limits collection to `tests/` and excludes `fixtures`.
<!-- evidence: .github/workflows/ci.yml:56-63, pytest.ini:1-5 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
  - **Rationale**: unknown for having both. `pytest.ini`'s own comment says only that fixture repositories carry their own tests that must not be collected (`pytest.ini:2-3`).
  - **Alternatives**: unknown.
