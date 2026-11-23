# Contract: files on disk (as-is)

The files the current code reads and writes, by path and owner. Field-level structure of each JSON document is in [../data-model.md](../data-model.md).

## Inputs read

| Path | Read by | Purpose |
|---|---|---|
| `<repo>/.specify/memory/constitution.md`; per feature `spec.md`, `plan.md`, `tasks.md`, `research.md`, `data-model.md`, `quickstart.md`, `verification-commands.json`, and every file under `contracts/` and `checklists/` | `bootstrap_contract.py` | inventoried and hashed into `sources`; shell candidates come from `plan.md`/`quickstart.md`, prerequisites from every `.md`, verification documents from `verification-commands.json` |
| `<repo>/.specstride/features/<slug>/learning/applied.json` (legacy `.wiggum/`) | `bootstrap_contract.py`, `contract_lib.py` | optional decision log bound as `configuration.learning` |
| every contract `sources[].path` | `contract_lib.py` `check_source_hashes` | re-hashed on validate, render, launcher start and gate |
| `recovery.reason.jsonl` | `runtime.py` `latest_reason` | the latest stop reason for retry decisions |
<!-- evidence: skills/mixture-of-loops/scripts/bootstrap_contract.py:113-129, skills/mixture-of-loops/scripts/bootstrap_contract.py:280-299 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

## The launch contract file

`LAUNCH_CONTRACT` — a JSON file at the path the operator chooses (SKILL.md suggests keeping it under `.mixture-of-loops/`). Schema: `skills/mixture-of-loops/assets/launch-contract.schema.json` (draft 2020-12, `schema_version` `"1.0"`). Written by `bootstrap_contract.py --output` (atomic) and rewritten in place by `validate_contract.py --promote` (status and promotion stamp only).
<!-- evidence: skills/mixture-of-loops/assets/launch-contract.schema.json:1-21 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

## The artifact directory `.mixture-of-loops/`

Created beside the rendered launcher, or equal to the launcher's directory when the launcher sits inside a directory already named `.mixture-of-loops`. It is listed in this repository's `.gitignore`.
<!-- evidence: skills/mixture-of-loops/scripts/contract_lib.py:563-573 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

```text
<launcher dir>/
├── RUN_SCRIPT                                   # generated Bash launcher (0755)
└── .mixture-of-loops/
    ├── generated/<id>/<sha256[:20]>/            # content-addressed bundle (render_launcher.py)
    │   ├── launch-contract.json                 # canonical JSON of the contract
    │   ├── runtime.py
    │   └── contract_lib.py
    └── runs/<id>/
        ├── lock                                 # flock held by the running launcher (runtime.py)
        ├── state.json                           # run state (runtime.py, atomic)
        ├── launcher.log                         # runtime's labeled lines + child output, ANSI stripped
        ├── harness-run.json                     # supervisor launch record (supervisor_lib.py, atomic)
        ├── harness-launch.log                   # launcher stdout+stderr when started by the supervisor
        ├── harness-report.log                   # every [MOL-*] line the supervisor emitted
        └── retrospectives/<contract_digest>.json  # supervise.py retro
```
<!-- evidence: skills/mixture-of-loops/scripts/supervisor_lib.py:62-68 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

| File | Writer | Write discipline |
|---|---|---|
| bundle directory | `render_launcher.py` `publish_bundle` | built in a `.publish-*` temp dir, fsynced, then `os.replace`; an existing bundle is reused only if its contract hash matches |
| `RUN_SCRIPT` | `render_launcher.py` | temp file + `os.replace`, mode `0755`; carries `generated-content-sha256` |
| `state.json` | `runtime.py` `atomic_json` | temp file + fsync + `os.replace` |
| `lock` | `runtime.py` | `fcntl.flock(LOCK_EX | LOCK_NB)`; a held lock exits 24 |
| `launcher.log` | `runtime.py` `Reporter` | append |
| `harness-run.json` | `supervisor_lib.py` | `atomic_json` |
| `harness-launch.log`, `harness-report.log` | `supervisor_lib.py` | append |
<!-- evidence: skills/mixture-of-loops/scripts/render_launcher.py:50-94, skills/mixture-of-loops/scripts/runtime.py:574-586 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

## Skill links (onboarding)

`bin/onboard-skill` creates or checks one symlink `mixture-of-loops` → the absolute `skills/mixture-of-loops` directory at:

| Harness | `--scope user` | `--scope repo` |
|---|---|---|
| codex | `$HOME/.agents/skills/` | `$REPO/.agents/skills/` |
| claude | `$HOME/.claude/skills/` | `$REPO/.claude/skills/` |
| dsh | `${DSH_HOME:-$HOME/.dsh}/skills/` | `$REPO/.dsh/skills/` |
| pi | `${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}/skills/` | `$REPO/.pi/skills/` |
| prime | `${PRIME_AGENT_CODING_AGENT_DIR:-$HOME/.prime/agent}/skills/` | `$REPO/.prime/agent/skills/` |
<!-- evidence: bin/onboard-skill:63-81 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

The repository itself tracks two such links: `.agents/skills/mixture-of-loops` and `.claude/skills/mixture-of-loops`.
