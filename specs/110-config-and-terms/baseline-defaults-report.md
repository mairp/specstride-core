# T002 — the baseline defaults of the catalogue, checked against `9cab15d`

**Task**: T002 of `tasks.md`. **Requirement**: F110-FR-006. **Date**: 2026-10-01.

**Reference**: the Specstride baseline at commit `9cab15d`
(`git -C <baseline checkout> show 9cab15d:orchestrator.sh`). The built-in defaults are the
reference; `.env.example` counts only for a key whose built-in default it repeats.

**How it was checked**: `specs/110-config-and-terms/contracts/tools/baseline-defaults-extract.ts` reads every
`${NAME:-default}`, `${NAME:=default}`, `os.environ.get(NAME, default)` and
`os.getenv(NAME, default)` of the baseline's own sources (the fixture, wiki, docs and
`telemetry/` trees excluded) and prints one row per variable, with the file and line that holds
the default. Where two sources default the same variable, `orchestrator.sh` is the reference.
The result is the committed snapshot `specs/110-config-and-terms/contracts/baseline-defaults.tsv`, joined to the
keys through `contracts/alias-table.tsv` and compared with the `default` column of
`contracts/config-keys.tsv` by `tests/characterization/110/baseline-defaults.test.ts`.

## Result

| Verdict | Rows | Meaning |
|---|---|---|
| `same` | 45 | the catalogue default is the baseline default, character for character |
| `same (spelled)` | 36 | the same value, written the way §K.2 spells it (an empty baseline value written as `unset`, `none`, `off` or the thing the baseline derives from it; `true` written as the switch value `on`; seconds converted to milliseconds; an arithmetic literal evaluated) — each row says which |
| `differs` | 6 | listed below, for the orchestrator |
| `n/a (no key)` | 14 | a variable the port exports as run context and that reaches no key |
| `n/a (DV-064)` | 4 | a variable of the locally registered backend, which the port does not carry |
| **total** | **105** | every as-is variable the baseline gives a built-in default |

No key of `contracts/config-keys.tsv` that has a baseline counterpart carries a value that
differs from the baseline by accident. The six differences below are each a decision that an
approved register row or another feature already made; they are reported, not repaired here.

## The six differences, for the orchestrator

| # | Key | Baseline at `9cab15d` | Catalogue | Why it differs |
|---|---|---|---|---|
| 1 | `roles.proposer.harness` | `dsh` (`orchestrator.sh:202`, `SPECSTRIDE_PROPOSER`) | the shipped default, Claude in Wave 1 | The as-is item is `superseded-by DV-004` (`docs/ecosystem/traceability.md`, row `028 FR-021`: "The default-proposer part is `superseded-by DV-004` at item level"). The port does not carry the baseline literal. **No repair is proposed**; the orchestrator should confirm that DV-004 covers the default and that F110-FR-006 is read as "every key whose baseline counterpart is carried". |
| 2 | `roles.critic.harness` | `claude` (`orchestrator.sh:203`, `SPECSTRIDE_CRITIC`) | by the critic order (annex C §C.6) | Feature 124 replaces the fixed default with the critic order and `critic.autoPick`. The baseline literal is not a default of the port. `.env.example:30` ships `dsh` for the same variable, which is defect D-42 and is dropped (F110-FR-006); the built-in `claude` is the reference. |
| 3 | `harnesses.<id>.profile` | `headless` for dsh (`lib/critic.py:2103`, `proposer.sh:540`) | `none` | In the port the profile of a harness belongs to its descriptor (feature 130), not to a built-in default of the catalogue. Under `parity` the fixture sets it. |
| 4 | `harnesses.<id>.bin` | `dsh` (`lib/critic.py:2102`) | found by the descriptor | As above: the launcher name of a harness is a field of the harness descriptor (feature 109/130), not a built-in default of the catalogue. |
| 5 | `harnesses.<id>.bin` (prime) | `prime-agent` (`lib/critic.py:2200`, `SPECSTRIDE_PRIME_AGENT_BIN`) | found by the descriptor | As #4, for feature 138. `harnesses.prime.launcher` keeps the as-is default name (`prime`) because §K.8 carries the launcher pair. |
| 6 | `sandbox.permissionMode` | `workspace-write` (`proposer.sh:562`) | `contained (acceptEdits for Claude)` | Owner 109. §K.9 row 26 reserves the literal `baseline` for this key under the `parity` profile, so the baseline value is reached through the profile and not through the default. The orchestrator should confirm that the reserved literal is the intended carrier. |

Differences 3 to 5 share one shape: **a harness's own launch facts (executable, profile) are
defaults of the harness descriptor in the port and not of the configuration catalogue.** If the
orchestrator wants them in the catalogue instead, three rows of §K.6 change; if not, nothing
changes and this report is the record.

## The two disagreements of `.env.example` that F110-FR-006 names

Both were confirmed against the text at `9cab15d` and both resolve as the requirement says.

| Variable | `.env.example` | Built-in default | Resolution |
|---|---|---|---|
| `SPECSTRIDE_CRITIC` | `dsh` (`.env.example:30`) | `claude` (`orchestrator.sh:203`) | Defect D-42: dropped. The built-in default is the reference. |
| `SPECSTRIDE_LOKI_URL` | `http://localhost:3110` (`.env.example:315`) | `http://localhost:3100` (`orchestrator.sh:207`) | Defect D-41: port 3100 stands, and `telemetry.loki.url` carries it. |

## What else the check covers

- Every variable of the snapshot has a row in `contracts/alias-table.tsv` (T005), except the
  four of DV-064.
- Every key the snapshot names is a key of `contracts/config-keys.tsv`, and the default the
  snapshot quotes is the catalogue's own, so the snapshot cannot go stale against the catalogue.
- One as-is variable that feeds several keys (`SPECSTRIDE_CONTEXT_BUDGET` feeds
  `spec.contextBudget` and `reverse.contextBudget`, §K.8) is checked to give both the same
  default, which is the baseline's one value (24000, `lib/specstride_spec.py:657`).
- When a checkout of the baseline at `9cab15d` is present, the last test re-derives the whole
  snapshot from it and fails on any drift in a value, a place, or the number of defaults. Set
  `SPECSTRIDE_BASELINE_CHECKOUT` to point at one; without it that single test skips and the
  committed snapshot stands.
