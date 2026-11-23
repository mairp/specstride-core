# Traceability

Stage A synthesis artifact. Status: **approved by the owner on 2026-09-29** (`APPROVAL.md`), with the rulings applied.
Every `superseded-by` and `dropped` row is approved 2026-09-29 (ruling K8). Section 4.6 lists what the rulings changed here.

This file is generated. Its companions in the same directory are the machine-readable copies:

| File | Content |
|---|---|
| `traceability-frs.tsv` | The 133 rows of section 2, keyed by `origin_id` |
| `traceability-items.tsv` | One line per behaviour item, `B-0001` to `B-2785` (B-2784 and B-2785 were added in Stage B by feature 141, for the two `run_stop` write sites of `proposer.sh`), with its cluster, disposition, destination feature, proof and register or roadmap reference |
| `check-traceability.py` | The first half of the coverage check of the cross-feature review. Run it with `python3 docs/ecosystem/check-traceability.py` |

Sources: `research/R19-consolidation-map.md` (draft dispositions, re-mapped here), `research/R18-behaviour-inventory.tsv`
(items), `research/R18-behaviour-inventory-parity-oracle.md` (clusters, fixture families FX-01 to FX-37, normalization
rules N-01 to N-28), `consolidation.md` (divergence register DV-001 to DV-117, conflicts, defects), `architecture.md`
section 14 (the 40 Wave 1 features and the umbrella), `roadmap.md`, `APPROVAL.md` (the owner's rulings; ruling 19 for the
shape of this file, rulings 32, 32a and 32b for the adapters of dsh, Codex, pi and prime). Feature numbers and names are
those of `architecture.md` section 14.

One registry entry of the baseline is specific to the owner's machines. It is written "a locally registered backend".

## 1. Rules

### 1.1 The six dispositions and their proofs

| Disposition | Meaning | Proof written in this file |
|---|---|---|
| `ported` | Reproduced as it is | A parity test: fixture families `FX-nn` and the test name pattern |
| `merged-with <id>` | Combined with an equivalent from another system | A parity test for the 028 or 011 side; a characterization test `CT-<feature>-<n>` for a Lisa side |
| `translated` | The behaviour survives and its form changes under an owner decision | A parity test through the documented mapping: the register row or rule that holds the mapping is named |
| `superseded-by <id>` | Replaced on purpose | The divergence register row, `DV-nnn` in `consolidation.md`. Approved 2026-09-29 (ruling K8) |
| `deferred <wave>` | Kept for a later wave | The roadmap entry. Waves are written `2` and `3+` |
| `dropped` | Not carried over | The written justification. Approved 2026-09-29 (ruling K8) |

### 1.2 How a register row decides between `ported`, `translated` and `superseded-by`

The oracle handling of a register row decides, so that the disposition says which proof exists:

| Oracle handling in `consolidation.md` section 6 | Disposition of the as-is behaviour | Reason |
|---|---|---|
| off; not observable; none needed; no divergence | `ported`, with the row named | The `parity` profile reproduces the as-is behaviour, so a parity test proves it. The new default is proven by its own tests |
| mapped; a normalization rule N-xx | `translated`, with the row named | The comparison runs through a mapping table |
| waiver; not compared; not carried | `superseded-by <row>` | No parity test can pass; the register row is the proof |

### 1.3 Defaults by kind of behaviour item

| Kind | Default | Mapping |
|---|---|---|
| `behaviour`, `stop-reason`, `output-line` | `ported` | Output lines that start with an implementation file name are `translated` (DV-066, N-15). `[MOL-*]` and `[DIGEST]` lines are `translated` (DV-033, DV-007, N-20) |
| `event` | `translated` | DV-007: compared in the compatibility projection (N-12, N-13, N-14) |
| `file` | `translated` | DV-006: compared by logical name through the layout table (N-02). Template files that are read as data are `ported` |
| `env` | `translated` | DV-027: the variable name stays as an alias of a config key |
| `cli-command`, `cli-flag` | `ported` for the engine, the front door and the launcher; `translated` for every other module | DV-066: the command becomes a verb of the one `specstride` CLI or an internal call |
| `exit-code` | `ported` for a process that stays a process; `translated` for a component that the engine calls in-process | Layering rule LR-6 and `consolidation.md` section 3: the value is kept as the `exit_code` field of a result record |

An `env` or flag item goes to the feature that owns the behaviour the setting controls. Feature 110 owns the key
name, the alias table and the precedence, and receives only the items about configuration loading itself.

### 1.4 The merge rule

| # | Rule |
|---|---|
| 1 | Where systems overlap, 028 and 011 win, because parity binds them |
| 2 | Lisa wins where 028 and 011 are silent and its behaviour is sound: atomic writes (002 FR-013), exit 70 on an uncaught error (002 FR-005), the budget ledger (002 FR-041, 002 FR-042 with the fix of DV-063) |
| 3 | A Lisa row that loses to 028 on purpose is `superseded-by` the register row that records it (DV-040, DV-042, DV-043) |
| 4 | Implementation-describing requirements are `translated` or `superseded-by`, never skipped: 028 FR-029, 028 FR-030, 028 SC-008, 011 FR-009, 011 FR-010, 011 SC-001 |
| 5 | Legacy-compatibility behaviour is `superseded-by` the rows of decision 3: DV-036, DV-037, DV-038, DV-039 |
| 6 | A documented defect is preserved, and therefore `ported`, unless `consolidation.md` section 5.3 marks it fix or drop |
| 7 | Behaviour that belongs to dsh, Codex or prime goes to the adapter feature of that harness (130, 131, 138) and is `ported` or `translated` by the rules of sections 1.2 and 1.3, because every parity test passes before any release (owner rulings 32, 32b). Behaviour of a harness that stays in a later wave would be `deferred 3+` to its adapter feature; the inventory holds no such item |
| 8 | Behaviour of the locally registered backend is `superseded-by DV-064`: a consumer declares such a harness in the open registry |

### 1.5 How a cluster row covers its items

| # | Rule |
|---|---|
| 1 | A cluster is the set of items with the same system, source module and kind (R18 Appendix A). There are 255 |
| 2 | A cluster whose items all have the same disposition and destination feature has one row. Any other cluster is split into sub-rows `C-nnn.a`, `C-nnn.b`, and so on, one per pair of disposition and destination |
| 3 | A row names its items by range. Every item is in exactly one row. `traceability-items.tsv` holds the same assignment per item, and the check script proves that all 2,783 appear once |
| 4 | The proving parity test of an item is named `PT-<feature>-<cluster>-*` and runs on the fixture families of its row. The proving test of a requirement is named `PT-<feature>-<origin>-*`, for example `PT-104-028FR001-*` |
| 5 | A test may claim an item only if its fixture executed the item's evidence line (R18 O-8). The fixture families here are assigned by subject; the exercise map of feature 141 confirms or corrects them |
| 6 | Destination `roadmap` means a roadmap entry without a feature number; the entry is named. Destination `none` is used only with `dropped` |

## 2. As-is requirements and success criteria

110 requirements (028: 30, 011: 27, 002: 53) and 23 success criteria (028: 8, 011: 8, 002: 7).

### 028 Specstride

| Origin | Statement | Disposition | Destination | Proving test | Register or roadmap | Notes |
|---|---|---|---|---|---|---|
| 028 FR-001 | Spec resolution order without `-s`; candidates are listed and the run exits 3 | `ported` | 104-spec-input | FX-09; `PT-104-028FR001-*` | — | Input paths are in the consumer project, so no layout mapping |
| 028 FR-002 | Spec format detection: override, file name, content; an unknown explicit format is an error | `merged-with 002 FR-029` | 104-spec-input | FX-10; `PT-104-028FR002-*` | DV-073 | 028 names and order win (C-07); `openspec` accepted as an alias, one waiver |
| 028 FR-003 | First phase without an approval marker is the start; all approved runs release verification, then exit 0 | `merged-with 002 FR-008` | 101-gate-and-verdict | FX-01, FX-13, FX-15; `PT-101-028FR003-*` | DV-029 | 028 wins: release verification first. Marker existence compared by logical name; the release gate itself is specified in 105 |
| 028 FR-004 | One run per workdir; `flock` or the `lock.d` fallback; exit 5 | `translated` | 122-detached-runtime | FX-11; `PT-122-028FR004-*` | DV-022 | Exit 5 on a second run is compared; the lock file form is mapped per OS. R19 had 102; lock belongs to 122 (single-owner rule) |
| 028 FR-005 | A nonce per critic call; exactly one verdict line; anything else is MALFORMED | `merged-with 002 FR-019` | 101-gate-and-verdict | FX-05; `PT-101-028FR005-*` | — | Same grammar in both systems (16 hex) |
| 028 FR-006 | APPROVED writes the empty marker; REJECTED or MALFORMED writes feedback, and the critic exits 10 | `merged-with 002 FR-012` | 101-gate-and-verdict | FX-01, FX-02, FX-05; `PT-101-028FR006-*` | DV-029 | Critic exit 10 is kept as the `exit_code` of a result record (LR-6) |
| 028 FR-007 | A rejected attempt is archived with feedback, hint, acceleration note and transcript; `-<run-id>` suffix on collision | `merged-with 002 FR-014` | 101-gate-and-verdict | FX-02; `PT-101-028FR007-*` | DV-011 | 028 file set wins; the suffix rule stays for collisions (C-14) |
| 028 FR-008 | Retry until `MAX_REJECTS` (3), then exit 2 | `merged-with 002 FR-010` | 101-gate-and-verdict | FX-03; `PT-101-028FR008-*` | — | — |
| 028 FR-009 | An oscillating criterion halts the run with exit 2 after archiving | `ported` | 101-gate-and-verdict | FX-04; `PT-101-028FR009-*` | DV-044 | The as-is window is restored by the reset flag under the `parity` profile |
| 028 FR-010 | MALFORMED limit (3; 0 disables); exit 1 `critic_unavailable` | `merged-with 002 FR-011` | 101-gate-and-verdict | FX-05, FX-06, FX-07; `PT-101-028FR010-*` | — | Configuration errors already exit 3 `critic_config` in 028 code |
| 028 FR-011 | The diagnostician runs on a new unmet-criteria signature | `translated` | 101-gate-and-verdict | FX-08; `PT-101-028FR011-*` | DV-066 | Implementation names (`lib/critic.py --diagnose`) and the marker path change form; behaviour kept |
| 028 FR-012 | Conditions under which an accelerator attempt is due | `ported` | 101-gate-and-verdict | FX-08; `PT-101-028FR012-*` | — | — |
| 028 FR-013 | Task checkboxes are ticked after approval; a failure does not undo the approval | `ported` | 101-gate-and-verdict | FX-01; `PT-101-028FR013-*` | — | — |
| 028 FR-014 | Git commit after an approved phase when `auto`; never init, never push | `ported` | 101-gate-and-verdict | FX-27; `PT-101-028FR014-*` | — | N-22 for commit hashes |
| 028 FR-015 | `stop.flag` is honoured at boundaries and during a pass; exit 6; `--now` kills the pass tree | `merged-with 002 FR-046` | 102-run-control | FX-12; `PT-102-028FR015-*` | — | Stop belongs to 102 (single-owner rule) |
| 028 FR-016 | Resume refuses while locked; replays `last-run.conf`; extra arguments win | `merged-with 002 FR-016` | 102-run-control | FX-13; `PT-102-028FR016-*` | DV-021; DV-024 | Exit codes compared through the map 1 → 5 and 1 → 3 (owner ruling K2); settings that are not saved today are a waiver |
| 028 FR-017 | Watchdogs: idle 900 s, disk progress 1800 s, repetition 12 | `ported` | 118-pass-supervision-and-jobs | FX-21; `PT-118-028FR017-*` | DV-015 | The code value 12 is the truth (D-02). R19 had 103 |
| 028 FR-018 | Error and hard-cap breakers; engine exit 4 on proposer 4, 7, 8, 9, 10 | `ported` | 103-proposer-pass | FX-17, FX-18, FX-19, FX-20; `PT-103-028FR018-*` | DV-005; DV-010 | Hard-cap kills are specified in 118; the exit mapping in 100 |
| 028 FR-019 | Yield artifact `specstride-pass-yield/v1`; poll 30 s; at most 4 per attempt; command predicate off | `ported` | 118-pass-supervision-and-jobs | FX-22; `PT-118-028FR019-*` | DV-051 | R19 had 103 |
| 028 FR-020 | `--verification off|plan|required`, default `required`; any other value exits 3 | `ported` | 105-verification | FX-14; `PT-105-028FR020-*` | — | What `required` does to a verdict has no FR; it is taken from code (C-01) and traced by B-0319, B-0320 |
| 028 FR-021 | One backend registry; defaults proposer `dsh`, critic `claude` | `translated` | 109-harness-seam | FX-26, FX-01; `PT-109-028FR021-*` | DV-064; DV-004 | The registry becomes the open harness registry. The default-proposer part is `superseded-by DV-004` at item level (B-0013, B-0037, B-0466, B-0486). The entries of dsh, Codex and prime are `ported` in 130, 131 and 138 (owner ruling 32) |
| 028 FR-022 | Loki and OTel shipping off by default, with default addresses | `translated` | 128-telemetry-export | FX-31; `PT-128-028FR022-*` | DV-058 | One exporter; R19 had 111 |
| 028 FR-023 | Front-door verbs; read-only except stop, resume, learn and reverse | `merged-with 002 FR-003` | 119-front-door-and-presenter | FX-28; `PT-119-028FR023-*` | DV-062 | R19 had 102. `stop` and `resume` are specified in 102, `learn` in 106, `reverse` in 108, `status` data in 129 |
| 028 FR-024 | Learning adjusts only allow-listed knobs within bounds | `ported` | 106-learning | FX-29; `PT-106-028FR024-*` | DV-025 | — |
| 028 FR-025 | Reverse output naming and refusals | `ported` | 108-reverse | FX-30; `PT-108-028FR025-*` | — | The state-directory refusal maps to the new state roots |
| 028 FR-026 | Reverse guard against the baseline inventory | `ported` | 108-reverse | FX-30; `PT-108-028FR026-*` | — | — |
| 028 FR-027 | Reverse linter, per level | `ported` | 140-reverse-inventory-and-lint | FX-30; `PT-140-028FR027-*` | — | — |
| 028 FR-028 | A config-home overlay is declared in the registry entry; a scope variable selects it | `translated` | 109-harness-seam | FX-26; `PT-109-028FR028-*` | DV-002 | No fixture family declares an overlay today (section 5, item 2) |
| 028 FR-029 | One module owns the spec grammar; the shims and the critic import it | `translated` | 104-spec-input | FX-10, FX-32; `PT-104-028FR029-*` | DV-060 | Implementation-describing: becomes "one grammar owner" in TypeScript, proven by the spec commands on FX-10 and by the inventory output on FX-32. Lisa support is partial (R1v) |
| 028 FR-030 | A pytest suite and a CI workflow exist | `superseded-by DV-057` | 100-specstride | register row DV-057 | DV-057 | Implementation-describing; replaced by the TypeScript tests, the oracle (141) and CI on Linux and macOS. **Disposition approved 2026-09-29 (ruling K8)** |
| 028 SC-001 | All phases approved ends with exit 0 and `run_end outcome=all_approved` | `translated` | 101-gate-and-verdict | FX-01; `PT-101-028SC001-*` | DV-007 | Event compared in the compatibility projection |
| 028 SC-002 | No approval comes from a verdict line inside the evidence | `merged-with 002 SC-001` | 101-gate-and-verdict | FX-05; `PT-101-028SC002-*` | — | — |
| 028 SC-003 | Every halt cause maps to one exit code 0 to 6 | `merged-with 002 SC-004` | 100-specstride | FX-03, FX-04, FX-05, FX-07, FX-11, FX-12, FX-17; `PT-100-028SC003-*` | — | Per-process exit table, consolidation.md section 3.1 |
| 028 SC-004 | At most `MAX_REJECTS` critic-judged attempts | `ported` | 101-gate-and-verdict | FX-03; `PT-101-028SC004-*` | DV-011 | The meaning across a resume changes under decision 23; off under the `parity` profile |
| 028 SC-005 | One diagnostician pass per signature; one accelerator attempt per diagnosed signature | `ported` | 101-gate-and-verdict | FX-08; `PT-101-028SC005-*` | — | — |
| 028 SC-006 | A reverse run changes nothing outside its output and the state directory | `ported` | 108-reverse | FX-30; `PT-108-028SC006-*` | DV-006 | — |
| 028 SC-007 | No shipped backend declares an overlay; runs use the operator's real environment | `superseded-by DV-002` | 109-harness-seam | register row DV-002 | DV-002 | A statement about the shipped registry, not a behaviour. **Disposition approved 2026-09-29 (ruling K8)** |
| 028 SC-008 | CI succeeds only when the lint and test jobs succeed | `superseded-by DV-057` | 100-specstride | register row DV-057 | DV-057 | Implementation-describing. **Disposition approved 2026-09-29 (ruling K8)** |

### 011 mixture-of-loops

| Origin | Statement | Disposition | Destination | Proving test | Register or roadmap | Notes |
|---|---|---|---|---|---|---|
| 011 FR-001 | Bootstrap inventories the sources with SHA-256, line count, and a semantic hash for `tasks.md` | `ported` | 107-launch-contract | FX-32; `PT-107-011FR001-*` | — | The hashing scheme is the one hasher of 104 |
| 011 FR-002 | Bootstrap emits a draft with the open blocker `semantic-derivation-required` | `ported` | 107-launch-contract | FX-32; `PT-107-011FR002-*` | DV-066 | `generated_by.tool` compares through N-16 |
| 011 FR-003 | The learning decision log is bound into `configuration.learning` | `translated` | 106-learning | FX-33; `PT-106-011FR003-*` | DV-006 | Path of the decision log in the new layout; its byte format is kept, since the hash binding depends on it |
| 011 FR-004 | Strict validation rules | `ported` | 107-launch-contract | FX-33; `PT-107-011FR004-*` | DV-059 | The validator's behaviour is the reference |
| 011 FR-005 | Open blockers and unresolved coverage are rejected | `ported` | 107-launch-contract | FX-33; `PT-107-011FR005-*` | — | — |
| 011 FR-006 | `--promote` writes `validated` and the stamp; a failure sets `draft`, prints `next:` hints, exits 20 | `translated` | 107-launch-contract | FX-33; `PT-107-011FR006-*` | DV-066 | The stamp's `by` literal and the command name change form |
| 011 FR-007 | Stale sources exit 23, except checkbox-only changes | `ported` | 104-spec-input | FX-33; `PT-104-011FR007-*` | — | Staleness rests on the one hashing scheme of 104; the exit code is raised by the commands of 107 |
| 011 FR-008 | The renderer re-validates, requires the stamp, and refuses an edited launcher unless `--replace-edited` | `ported` | 107-launch-contract | FX-34; `PT-107-011FR008-*` | — | — |
| 011 FR-009 | Content-addressed bundle with the contract, `runtime.py` and `contract_lib.py` | `translated` | 107-launch-contract | FX-34; `PT-107-011FR009-*` | DV-008 | Implementation-describing: the bundle holds TypeScript artifacts; N-10, N-11 |
| 011 FR-010 | A generated Bash launcher with a marker and a self-digest executes `runtime.py` | `translated` | 107-launch-contract | FX-34; `PT-107-011FR010-*` | DV-054; DV-008 | Implementation-describing: a Node-shebang launcher compared as a logical record (N-17) |
| 011 FR-011 | The runtime exits 23 or 20 with `[DIGEST] state=failed`; a dry run prints the plan and `[DIGEST] state=dry-run exit=0` | `ported` | 123-pipeline-runtime-and-supervisor | FX-35; `PT-123-011FR011-*` | — | R19 had 107 |
| 011 FR-012 | Run state under `runs/<id>/`; exclusive lock; exit 24 | `translated` | 123-pipeline-runtime-and-supervisor | FX-35; `PT-123-011FR012-*` | DV-006; DV-022 | The lock mechanism is specified in 122 |
| 011 FR-013 | Preflight; exit 21 `preflight` | `ported` | 123-pipeline-runtime-and-supervisor | FX-35; `PT-123-011FR013-*` | — | — |
| 011 FR-014 | Stages run in order; completed ones are skipped; state resets on a digest change; `state.json` records it | `ported` | 123-pipeline-runtime-and-supervisor | FX-35; `PT-123-011FR014-*` | DV-006 | — |
| 011 FR-015 | In-stage retry by exit code and stop reason; exit 22 or 128+N; child exit 6 means stopped | `ported` | 123-pipeline-runtime-and-supervisor | FX-35; `PT-123-011FR015-*` | DV-028 | The terminal record carries the same values |
| 011 FR-016 | Inherited learning environment is stripped; `off` is forced unless the stage declares a mode | `ported` | 106-learning | FX-35; `PT-106-011FR016-*` | DV-026; DV-038 | A named exception to decision 9. The `WIGGUM_LEARNING` part is superseded (decision 3) |
| 011 FR-017 | Mode selection defaults to `generate` | `superseded-by DV-009` | 113-host-claude-code | register row DV-009 | DV-009 | `generate` maps to `dry-run`; `run` and `auto` to `run`; the default case is a waiver. **Disposition approved 2026-09-29 (ruling K8)** |
| 011 FR-018 | The learning mode is selected from the request | `ported` | 106-learning | FX-36; `PT-106-011FR018-*` | — | The host comment of decision 18 cannot widen it |
| 011 FR-019 | Six ordered launch checks; the first failure refuses; a held lock yields `attach` | `translated` | 123-pipeline-runtime-and-supervisor | FX-36; `PT-123-011FR019-*` | DV-054 | `launcher-syntax` checks the launcher in its new form |
| 011 FR-020 | Detached launch: stdin closed, new session, logs, `harness-run.json` | `translated` | 123-pipeline-runtime-and-supervisor | FX-36; `PT-123-011FR020-*` | DV-006 | The detach strategy itself (EP-17) is specified in 122 |
| 011 FR-021 | Relaunch classifier conditions; every refusal is named | `ported` | 123-pipeline-runtime-and-supervisor | FX-36; `PT-123-011FR021-*` | DV-005 | Reproduced with `relaunch.owner: supervise`, which the `parity` profile sets |
| 011 FR-022 | Relaunch budget: default 2, declared 0 to 5 | `translated` | 123-pipeline-runtime-and-supervisor | FX-36; `PT-123-011FR022-*` | DV-055 | The key `configuration.auto` is renamed `configuration.relaunch` |
| 011 FR-023 | `[MOL-*]` labelled lines and the fields of the final digest | `translated` | 123-pipeline-runtime-and-supervisor | FX-35, FX-36; `PT-123-011FR023-*` | DV-033; DV-007 | The line grammar belongs to 100, each line to its feature; compared in compatibility output (N-20). R19 had 111 |
| 011 FR-024 | A retrospective per contract digest; suggestions are not run | `translated` | 106-learning | FX-36; `PT-106-011FR024-*` | DV-006 | Path in the new layout |
| 011 FR-025 | `bin/onboard-skill` links the skill and has its own exit codes | `superseded-by DV-056` | 113-host-claude-code | register row DV-056 | DV-056 | Plugin installation replaces it; its `--check` becomes doctor checks (112). **Disposition approved 2026-09-29 (ruling K8)** |
| 011 FR-026 | A reminder on stderr when `MOL_VIA` is not `shell` | `dropped` | none | written justification (notes) | DV-061 | Justification: the reminder exists to steer a model toward the scripts; one CLI with terse output (decision 16) removes the cause. **Disposition approved 2026-09-29 (ruling K8)** |
| 011 FR-027 | Legacy `wiggum` spellings are normalized with a warning | `superseded-by DV-038` | 107-launch-contract | register row DV-038 | DV-038 | Legacy compatibility (decision 3). **Disposition approved 2026-09-29 (ruling K8)** |
| 011 SC-001 | CI matrix on Python 3.10 to 3.13 | `superseded-by DV-057` | 100-specstride | register row DV-057 | DV-057 | Implementation-describing. **Disposition approved 2026-09-29 (ruling K8)** |
| 011 SC-002 | Mergify merges automatically with a label and a green CI | `dropped` | none | written justification (notes) | DV-057 | Justification: repository merge automation, not product behaviour. **Disposition approved 2026-09-29 (ruling K8)** |
| 011 SC-003 | `--dry-run` exits 0, does nothing, prints one `[DIGEST] state=dry-run` | `ported` | 123-pipeline-runtime-and-supervisor | FX-35; `PT-123-011SC003-*` | — | This is the behaviour behind the `dry-run` mode of decision 18 |
| 011 SC-004 | Launcher failure classes map to 20 to 24 | `ported` | 100-specstride | FX-33, FX-35; `PT-100-011SC004-*` | — | Per-process exit table, consolidation.md section 3.9 |
| 011 SC-005 | Poll at least 60 s, factor 1.5, cap 600 s | `ported` | 123-pipeline-runtime-and-supervisor | FX-36; `PT-123-011SC005-*` | — | — |
| 011 SC-006 | At most 5 relaunches, 2 by default | `ported` | 123-pipeline-runtime-and-supervisor | FX-36; `PT-123-011SC006-*` | DV-055 | — |
| 011 SC-007 | Seven supervision outcomes map to exit codes | `ported` | 100-specstride | FX-36; `PT-100-011SC007-*` | — | Per-process exit table, consolidation.md section 3.10 (C-16) |
| 011 SC-008 | Fixture expectations `greeting-blocked` and `greeting-ready` | `translated` | 141-parity-oracle | FX-32; `PT-141-011SC008-*` | — | The fixtures become oracle fixtures |

### 002 Lisa

| Origin | Statement | Disposition | Destination | Proving test | Register or roadmap | Notes |
|---|---|---|---|---|---|---|
| 002 FR-001 | An unknown verb exits 1 with outcome `unknown` | `merged-with 028 FR-023` | 119-front-door-and-presenter | `CT-119-1` (028 side: FX-28) | — | 028 also exits 1 (B-1499) |
| 002 FR-002 | Usage and exit 0 on empty arguments or help | `merged-with 028 FR-023` | 119-front-door-and-presenter | `CT-119-2` (028 side: FX-28) | — | — |
| 002 FR-003 | `run`, `start` or a leading flag launches | `merged-with 028 FR-023` | 119-front-door-and-presenter | `CT-119-3` (028 side: FX-28) | — | Same routing (B-1428 to B-1430) |
| 002 FR-004 | Verbs that are recognized but not implemented exit 1 `verb_not_implemented` | `superseded-by DV-042` | 119-front-door-and-presenter | register row DV-042 | DV-042 | The new product implements these verbs. **Disposition approved 2026-09-29 (ruling K8)** |
| 002 FR-005 | The process exits with the router code; 70 on an uncaught error | `ported` | 119-front-door-and-presenter | `CT-119-4` | — | 028 and 011 are silent; sound; enters the exit table of consolidation.md section 3.12 |
| 002 FR-006 | Launch defaults: Opus for proposer and critic, verification `off` | `superseded-by DV-043` | 110-config-and-terms | register row DV-043 | DV-043; DV-004 | 028's `required` wins; harness defaults come from decision 13. The row names Lisa's Agent SDK harness only as the default proposer; the harness itself is extracted into 125 (owner ruling 20; section 5, item 15). **Disposition approved 2026-09-29 (ruling K8)** |
| 002 FR-007 | A strict flag parser rejects unknown flags | `merged-with 028 FR-023` | 119-front-door-and-presenter | `CT-119-5` (028 side: FX-28) | — | 028 prints usage and exits 3 on an unknown argument (B-0108); 028 wins |
| 002 FR-008 | Resume at the first unapproved phase; all approved ends at once | `merged-with 028 FR-003` | 101-gate-and-verdict | `CT-101-1` (028 side: FX-01) | — | 028 wins on release verification |
| 002 FR-009 | Approval advances only when verification passes; else rejection | `superseded-by DV-040` | 105-verification | register row DV-040 | DV-040 | Same outcome, other order; 028's order wins (C-01). **Disposition approved 2026-09-29 (ruling K8)** |
| 002 FR-010 | Halt with `max_rejects`, or archive and retry | `merged-with 028 FR-008` | 101-gate-and-verdict | `CT-101-2` (028 side: FX-03) | — | — |
| 002 FR-011 | A transport error is MALFORMED; a configuration error halts | `merged-with 028 FR-010` | 101-gate-and-verdict | `CT-101-3` (028 side: FX-06, FX-07) | — | Agrees with 028 code |
| 002 FR-012 | On approval: marker, leftover feedback archived, events, optional checkpoint | `merged-with 028 FR-006` | 101-gate-and-verdict | `CT-101-4` (028 side: FX-01) | DV-029 | — |
| 002 FR-013 | Evidence is written atomically (temporary file, fsync, rename); the approval marker is empty | `ported` | 101-gate-and-verdict | `CT-101-5` | DV-072; DV-029 | Lisa wins where 028 is silent; the rule SL-2 applies to every runtime-written file |
| 002 FR-014 | A rejected attempt is archived | `merged-with 028 FR-007` | 101-gate-and-verdict | `CT-101-6` (028 side: FX-02) | — | A subset of 028 |
| 002 FR-015 | Exit vocabulary 0 to 6 | `merged-with 028 SC-003` | 100-specstride | `CT-100-1` | — | — |
| 002 FR-016 | Resume refusals: nothing to resume, already running, spec hash changed | `merged-with 028 FR-016` | 102-run-control | `CT-102-1` (028 side: FX-13) | DV-021; DV-082 | The new codes 5 and 3 and the spec-hash refusal are adopted (C-03, owner ruling K2). The hash check at resume is one of the three check points of owner ruling K3 |
| 002 FR-017 | `status` reports RUNNING whenever the lock directory exists | `superseded-by DV-042` | 129-run-view-and-status | register row DV-042 | DV-042 | 028's lock probe wins (D-07). **Disposition approved 2026-09-29 (ruling K8)** |
| 002 FR-018 | A fresh 16-hex nonce per review | `merged-with 028 FR-005` | 101-gate-and-verdict | `CT-101-7` (028 side: FX-05) | — | — |
| 002 FR-019 | Exactly one verdict line with the exact nonce | `merged-with 028 FR-005` | 101-gate-and-verdict | `CT-101-8` (028 side: FX-05) | — | — |
| 002 FR-020 | MALFORMED feedback states the fail-safe rejection | `merged-with 028 FR-006` | 101-gate-and-verdict | `CT-101-9` (028 side: FX-05) | — | 028 writes the same sentence (B-0880) |
| 002 FR-021 | Grounding presence lines up to a cap; beyond the cap NOT-SHOWN | `merged-with 028 FR-006` | 117-critic-grounding-and-prompt | `CT-117-1` (028 side: FX-25) | — | 028 code has the rule with no FR (B-0808, B-0953). R19 had 101; grounding belongs to 117 |
| 002 FR-022 | Critic ensemble: a second judge must concur | `deferred 3+` | roadmap | roadmap entry "Critic ensemble" | roadmap: Critic ensemble | The critic-strategy seam (EP-18) exists in Wave 1 with one critic (C-11) |
| 002 FR-023 | Best-effort emission: the v2 journal plus a v1 line | `translated` | 144-compatibility-projection | `CT-144-1` | DV-007 | The pattern becomes the primary writer plus the compatibility projection |
| 002 FR-024 | A delivery dispatcher keyed by adapter id and idempotency key | `deferred 3+` | roadmap | roadmap entry "Event delivery dispatcher" | roadmap: Event delivery dispatcher | Returns as an event sink (EP-08) |
| 002 FR-025 | Refusal rules for an approval decision | `deferred 3+` | roadmap | roadmap entry "Human approvals of plan revisions" | roadmap: Human approvals of plan revisions | C-12; Wave 1 has blocked-on-human as a resting state (DP-076) |
| 002 FR-026 | The approval store is idempotent and rewritten atomically | `deferred 3+` | roadmap | roadmap entry "Human approvals of plan revisions" | roadmap: Human approvals of plan revisions | C-12 |
| 002 FR-027 | The approvals CLI exits 2 when refused | `deferred 3+` | roadmap | roadmap entry "Human approvals of plan revisions" | roadmap: Human approvals of plan revisions | C-12 |
| 002 FR-028 | Five spec-format adapters are registered | `merged-with 028 FR-029` | 104-spec-input | `CT-104-1` (028 side: FX-10) | DV-036 | The `wiggum` adapter falls under decision 3; the `chat` adapter is not carried in Wave 1 |
| 002 FR-029 | Detection order with environment steps | `merged-with 028 FR-002` | 104-spec-input | `CT-104-2` (028 side: FX-10) | DV-073 | 028 order wins (C-07); D-53 is fixed by the alias |
| 002 FR-030 | `spec import-project` refusals | `deferred 3+` | roadmap | roadmap entry "Spec bundle import and verification plans bound to a spec bundle" | roadmap: Spec bundle import and verification plans bound to a spec bundle | C-20. R19 named 104 as destination; no Wave 1 feature receives it |
| 002 FR-031 | Artifact selection by role | `deferred 3+` | roadmap | roadmap entry "Spec bundle import and verification plans bound to a spec bundle" | roadmap: Spec bundle import and verification plans bound to a spec bundle | Overlaps the inventory of 011 FR-001, which wins |
| 002 FR-032 | Exactly one spec and one tasks artifact | `deferred 3+` | roadmap | roadmap entry "Spec bundle import and verification plans bound to a spec bundle" | roadmap: Spec bundle import and verification plans bound to a spec bundle | — |
| 002 FR-033 | `--require-traceability` failures | `deferred 3+` | roadmap | roadmap entry "Spec bundle import and verification plans bound to a spec bundle" | roadmap: Spec bundle import and verification plans bound to a spec bundle | — |
| 002 FR-034 | Fields of the import summary | `deferred 3+` | roadmap | roadmap entry "Spec bundle import and verification plans bound to a spec bundle" | roadmap: Spec bundle import and verification plans bound to a spec bundle | — |
| 002 FR-035 | Artifacts are snapshotted and the semantic hash recomputed | `deferred 3+` | roadmap | roadmap entry "Spec bundle import and verification plans bound to a spec bundle" | roadmap: Spec bundle import and verification plans bound to a spec bundle | D-16 travels with it |
| 002 FR-036 | The bundle store refuses on a hash mismatch | `deferred 3+` | roadmap | roadmap entry "Spec bundle import and verification plans bound to a spec bundle" | roadmap: Spec bundle import and verification plans bound to a spec bundle | — |
| 002 FR-037 | A verification plan is bound to a bundle; the store is immutable | `deferred 3+` | roadmap | roadmap entry "Spec bundle import and verification plans bound to a spec bundle" | roadmap: Spec bundle import and verification plans bound to a spec bundle | 028 derives the plan per run; 028 wins in Wave 1 |
| 002 FR-038 | TEST_PLAN starts with a content-hash comment and provenance | `merged-with 028 FR-020` | 105-verification | `CT-105-1` (028 side: FX-14) | — | 028 code renders the same marker (B-items of C-078 and C-080) |
| 002 FR-039 | Scheduler safety predicate, five checks | `deferred 3+` | roadmap | roadmap entry "Feature parallelism in separate workspaces" | roadmap: Feature parallelism in separate workspaces | No production caller in Lisa (R26). The roadmap entry does not name this requirement (section 5, item 5) |
| 002 FR-040 | Greedy batch admission up to `maxParallel` | `deferred 3+` | roadmap | roadmap entry "Feature parallelism in separate workspaces" | roadmap: Feature parallelism in separate workspaces | As 002 FR-039 |
| 002 FR-041 | Budget evaluation over four ceilings; 0 is off | `translated` | 127-quota-budgets-and-pause | `CT-127-1` | — | Becomes per-role budgets (decision 8). R19 had 110 |
| 002 FR-042 | The budget ledger is persisted atomically; an unreadable one loads as zero | `translated` | 127-quota-budgets-and-pause | `CT-127-2` | DV-063 | The "loads as zero" part is fixed (D-33): the characterization test covers the fixed behaviour |
| 002 FR-043 | Queue selection by priority, then first in first out | `deferred 3+` | roadmap | roadmap entry "Scheduler queue and cron" | roadmap: Scheduler queue and cron | DP-034 |
| 002 FR-044 | Idempotent attempt start | `deferred 3+` | roadmap | roadmap entry "Scheduler queue and cron" | roadmap: Scheduler queue and cron | DP-034 |
| 002 FR-045 | Queue crash recovery | `deferred 3+` | roadmap | roadmap entry "Scheduler queue and cron" | roadmap: Scheduler queue and cron | DP-034 |
| 002 FR-046 | `stop.flag` is written atomically; empty means a clean stop | `merged-with 028 FR-015` | 102-run-control | `CT-102-2` (028 side: FX-12) | — | — |
| 002 FR-047 | Cron evaluation and misfire policy | `deferred 3+` | roadmap | roadmap entry "Scheduler queue and cron" | roadmap: Scheduler queue and cron | DP-034; D-20 travels with it |
| 002 FR-048 | Worktree creation rules | `translated` | 142-parallel-units | `CT-142-1` | DV-080 | Owner rulings 56 and D2. The rules were written for features in separate workspaces; they are kept for `[P]` units of one phase, as a loop layer that is off by default and off under the `parity` profile. No 028 or 011 requirement is equivalent, so nothing is merged. The design is R29 (section 5, item 16) |
| 002 FR-049 | API server: authentication, `healthz`, JSON-RPC | `deferred 3+` | roadmap | roadmap entry "Server mode and the index database" | roadmap: Server mode and the index database | R19 had Wave 2 and 121; the Wave 2 viewer is read-only and loopback (DP-004), which is not this server |
| 002 FR-050 | Approvals webhook: routing of the response | `deferred 3+` | roadmap | roadmap entry "Human approvals of plan revisions" | roadmap: Human approvals of plan revisions | C-12 |
| 002 FR-051 | Trajectory paging: clamp and cursor | `deferred 2` | 121-kanban-ui | roadmap entry "121-kanban-ui" | roadmap: 121-kanban-ui | Exists only on `76adfdc` (DP-013) |
| 002 FR-052 | Engine hooks fail closed at blockable points | `deferred 3+` | roadmap | roadmap entry "Engine hooks" | roadmap: Engine hooks | Host hooks are a different thing and belong to 113 |
| 002 FR-053 | SQLite index in WAL mode, rebuildable | `deferred 3+` | roadmap | roadmap entry "Server mode and the index database" | roadmap: Server mode and the index database | Native module; files stay the truth; a candidate for `dropped` if the owner prefers |
| 002 SC-001 | A reply without exactly one nonce line is a non-approval | `merged-with 028 SC-002` | 101-gate-and-verdict | `CT-101-10` (028 side: FX-05) | — | — |
| 002 SC-002 | Resume starts at the first unapproved phase; no counter is stored | `merged-with 028 FR-003` | 101-gate-and-verdict | `CT-101-11` (028 side: FX-13) | DV-011 | Counts survive a resume (decision 23); the phase position stays derived from approvals |
| 002 SC-003 | No reader sees a partial evidence file | `ported` | 101-gate-and-verdict | `CT-101-12` | DV-072 | With 002 FR-013 |
| 002 SC-004 | Every termination maps to 0 to 6 | `merged-with 028 SC-003` | 100-specstride | `CT-100-2` | — | — |
| 002 SC-005 | Bundles whose hashes disagree are refused on read | `deferred 3+` | roadmap | roadmap entry "Spec bundle import and verification plans bound to a spec bundle" | roadmap: Spec bundle import and verification plans bound to a spec bundle | — |
| 002 SC-006 | Approval decisions with a stale hash are refused | `deferred 3+` | roadmap | roadmap entry "Human approvals of plan revisions" | roadmap: Human approvals of plan revisions | D-21 travels with it |
| 002 SC-007 | A trajectory page holds at most 500 records | `deferred 2` | 121-kanban-ui | roadmap entry "121-kanban-ui" | roadmap: 121-kanban-ui | Exists only on `76adfdc` (DP-013) |

## 3. Behaviour items, by cluster

527 rows for 255 clusters and 2,785 items. "With FR" is the number of items that an as-is requirement states.
The proving test of every `ported`, `merged-with` and `translated` row is `PT-<feature>-<cluster>-*` on the fixture
families named, except where a characterization test `CT-` is named.

| Row | System | Module | Kind | B-items | Count | With FR | Disposition | Destination | Fixtures or test | Register or roadmap |
|---|---|---|---|---|---|---|---|---|---|---|
| C-001 | SS | `.env.example` | env | B-0001…B-0002, B-0379…B-0385 | 9 | 4 | `superseded-by DV-023` | 110-config-and-terms | — | DV-023 |
| C-002 | SS | `.env.example` | output-line | B-0003 | 1 | 0 | `superseded-by DV-023` | 110-config-and-terms | — | DV-023 |
| C-003 | SS | `specstride_env` | output-line | B-0004 | 1 | 0 | `superseded-by DV-036` | 110-config-and-terms | — | DV-036 |
| C-004 | SS | `specstride_env` | behaviour | B-0005…B-0007 | 3 | 0 | `superseded-by DV-036` | 110-config-and-terms | — | DV-036 |
| C-005 | SS | `orchestrator` | cli-command | B-0008 | 1 | 0 | `ported` | 101-gate-and-verdict | FX-01, FX-02, FX-03 | — |
| C-006.a | SS | `orchestrator` | cli-flag | B-0009, B-0034 | 2 | 2 | `ported` | 119-front-door-and-presenter | FX-28 | — |
| C-006.i | SS | `orchestrator` | cli-flag | B-0029…B-0030 | 2 | 2 | `ported` | 145-presenter | FX-28 | — |
| C-006.b | SS | `orchestrator` | cli-flag | B-0010…B-0012 | 3 | 3 | `ported` | 104-spec-input | FX-09, FX-10 | — |
| C-006.c | SS | `orchestrator` | cli-flag | B-0013…B-0014 | 2 | 2 | `superseded-by DV-004` | 124-harness-discovery-and-roles | — | DV-004 |
| C-006.d | SS | `orchestrator` | cli-flag | B-0015, B-0019…B-0020 | 3 | 1 | `ported` | 101-gate-and-verdict | FX-03, FX-13, FX-23 | — |
| C-006.e | SS | `orchestrator` | cli-flag | B-0016, B-0031 | 2 | 0 | `ported` | 103-proposer-pass | FX-17, FX-18, FX-19, FX-24 | — |
| C-006.f | SS | `orchestrator` | cli-flag | B-0017…B-0018, B-0032…B-0033 | 4 | 0 | `ported` | 118-pass-supervision-and-jobs | FX-16, FX-20, FX-23 | — |
| C-006.g | SS | `orchestrator` | cli-flag | B-0021…B-0024 | 4 | 1 | `ported` | 105-verification | FX-14, FX-15, FX-16 | — |
| C-006.h | SS | `orchestrator` | cli-flag | B-0025…B-0028 | 4 | 4 | `ported` | 128-telemetry-export | FX-31 | — |
| C-007.a | SS | `orchestrator` | env | B-0035…B-0036, B-0060 | 3 | 0 | `translated` | 104-spec-input | FX-09, FX-10 | DV-027 |
| C-007.b | SS | `orchestrator` | env | B-0037…B-0038 | 2 | 2 | `superseded-by DV-004` | 124-harness-discovery-and-roles | — | DV-004 |
| C-007.c | SS | `orchestrator` | env | B-0039, B-0047…B-0048, B-0050, B-0070…B-0074, B-0081…B-0083 | 12 | 5 | `translated` | 101-gate-and-verdict | FX-01, FX-02, FX-03, FX-04, FX-05, FX-08, FX-27 | DV-027 |
| C-007.d | SS | `orchestrator` | env | B-0040, B-0075…B-0076 | 3 | 0 | `translated` | 103-proposer-pass | FX-08, FX-17, FX-22 | DV-014; DV-020; DV-027 |
| C-007.e | SS | `orchestrator` | env | B-0041…B-0044, B-0063, B-0065 | 6 | 4 | `translated` | 128-telemetry-export | FX-31 | DV-027 |
| C-007.f | SS | `orchestrator` | env | B-0045, B-0069 | 2 | 0 | `translated` | 145-presenter | FX-28 | DV-027 |
| C-007.g | SS | `orchestrator` | env | B-0046, B-0055…B-0058, B-0078, B-0080 | 7 | 0 | `translated` | 118-pass-supervision-and-jobs | FX-16, FX-20, FX-22 | DV-027 |
| C-007.h | SS | `orchestrator` | env | B-0049, B-0068 | 2 | 0 | `translated` | 127-quota-budgets-and-pause | FX-22, FX-23 | DV-027 |
| C-007.i | SS | `orchestrator` | env | B-0051…B-0054 | 4 | 1 | `translated` | 105-verification | FX-14, FX-15, FX-16 | DV-027 |
| C-007.j | SS | `orchestrator` | env | B-0059, B-0067 | 2 | 1 | `translated` | 109-harness-seam | FX-26 | DV-027; DV-030 |
| C-007.k | SS | `orchestrator` | env | B-0061 | 1 | 0 | `translated` | 122-detached-runtime | FX-11 | DV-022; DV-027 |
| C-007.l | SS | `orchestrator` | env | B-0062, B-0064, B-0066 | 3 | 0 | `translated` | 144-compatibility-projection | FX-01, FX-26 | DV-027 |
| C-007.m | SS | `orchestrator` | env | B-0077, B-0079 | 2 | 0 | `translated` | 106-learning | FX-29 | DV-027 |
| C-008.a | SS | `orchestrator` | event | B-0084 | 1 | 0 | `superseded-by DV-037` | 100-specstride | — | DV-037 |
| C-008.b | SS | `orchestrator` | event | B-0085 | 1 | 0 | `translated` | 100-specstride | FX-01 | DV-007 |
| C-008.c | SS | `orchestrator` | event | B-0086, B-0088…B-0090, B-0093…B-0094, B-0098, B-0102…B-0103, B-0105…B-0107 | 12 | 0 | `translated` | 101-gate-and-verdict | FX-01, FX-02, FX-03, FX-04, FX-05, FX-08, FX-13, FX-27 | DV-007 |
| C-008.d | SS | `orchestrator` | event | B-0087, B-0099…B-0101, B-1136…B-1139 | 8 | 0 | `translated` | 105-verification | FX-14, FX-15, FX-16 | DV-007 |
| C-008.e | SS | `orchestrator` | event | B-0091…B-0092, B-0095 | 3 | 0 | `translated` | 103-proposer-pass | FX-17, FX-18, FX-19, FX-24 | DV-007 |
| C-008.f | SS | `orchestrator` | event | B-0096 | 1 | 0 | `translated` | 118-pass-supervision-and-jobs | FX-08 | DV-007 |
| C-008.g | SS | `orchestrator` | event | B-0097, B-0104 | 2 | 0 | `translated` | 106-learning | FX-29 | DV-007 |
| C-009.a | SS | `orchestrator` | exit-code | B-0108, B-0110…B-0111 | 3 | 0 | `ported` | 119-front-door-and-presenter | FX-28 | — |
| C-009.b | SS | `orchestrator` | exit-code | B-0109, B-0123, B-0132…B-0133 | 4 | 2 | `ported` | 118-pass-supervision-and-jobs | FX-20, FX-21, FX-22 | — |
| C-009.c | SS | `orchestrator` | exit-code | B-0112…B-0114, B-0121…B-0122, B-0124 | 6 | 1 | `ported` | 105-verification | FX-14, FX-15, FX-16 | — |
| C-009.d | SS | `orchestrator` | exit-code | B-0115 | 1 | 1 | `ported` | 109-harness-seam | FX-11 | — |
| C-009.e | SS | `orchestrator` | exit-code | B-0116…B-0117, B-0120 | 3 | 1 | `ported` | 104-spec-input | FX-09, FX-10 | — |
| C-009.f | SS | `orchestrator` | exit-code | B-0118 | 1 | 0 | `superseded-by DV-065` | 100-specstride | — | DV-065 |
| C-009.g | SS | `orchestrator` | exit-code | B-0119 | 1 | 1 | `ported` | 122-detached-runtime | FX-11 | — |
| C-009.h | SS | `orchestrator` | exit-code | B-0125, B-0135…B-0139 | 6 | 4 | `ported` | 101-gate-and-verdict | FX-01, FX-02, FX-03, FX-04, FX-05, FX-07, FX-15 | — |
| C-009.i | SS | `orchestrator` | exit-code | B-0126, B-0128 | 2 | 2 | `ported` | 102-run-control | FX-12 | — |
| C-009.j | SS | `orchestrator` | exit-code | B-0127 | 1 | 1 | `ported` | 127-quota-budgets-and-pause | FX-23 | — |
| C-009.k | SS | `orchestrator` | exit-code | B-0129…B-0131, B-0134 | 4 | 3 | `ported` | 103-proposer-pass | FX-17, FX-18, FX-19, FX-21, FX-24 | DV-005 |
| C-010.a | SS | `orchestrator` | stop-reason | B-0140, B-1140…B-1141 | 3 | 0 | `ported` | 105-verification | FX-14, FX-15, FX-16 | — |
| C-010.b | SS | `orchestrator` | stop-reason | B-0141, B-0151…B-0155 | 6 | 1 | `ported` | 101-gate-and-verdict | FX-01, FX-02, FX-03, FX-04, FX-07, FX-15 | — |
| C-010.c | SS | `orchestrator` | stop-reason | B-0142, B-0144 | 2 | 0 | `ported` | 102-run-control | FX-12 | — |
| C-010.d | SS | `orchestrator` | stop-reason | B-0143 | 1 | 0 | `ported` | 127-quota-budgets-and-pause | FX-23 | — |
| C-010.e | SS | `orchestrator` | stop-reason | B-0145…B-0147, B-0150 | 4 | 0 | `ported` | 103-proposer-pass | FX-17, FX-18, FX-19, FX-24 | DV-005 |
| C-010.f | SS | `orchestrator` | stop-reason | B-0148…B-0149 | 2 | 0 | `ported` | 118-pass-supervision-and-jobs | FX-20, FX-22 | — |
| C-011.a | SS | `orchestrator` | file | B-0156 | 1 | 0 | `superseded-by DV-023` | 110-config-and-terms | — | DV-023 |
| C-011.b | SS | `orchestrator` | file | B-0157, B-0165, B-0167…B-0168 | 4 | 0 | `translated` | 100-specstride | FX-01 | DV-006 |
| C-011.c | SS | `orchestrator` | file | B-0158…B-0160, B-0172, B-0181…B-0182, B-1142…B-1144 | 9 | 0 | `translated` | 105-verification | FX-14, FX-15, FX-16 | DV-006 |
| C-011.d | SS | `orchestrator` | file | B-0161…B-0162 | 2 | 1 | `translated` | 122-detached-runtime | FX-11 | DV-006; DV-022 |
| C-011.e | SS | `orchestrator` | file | B-0163…B-0164 | 2 | 1 | `superseded-by DV-022` | 122-detached-runtime | — | DV-022 |
| C-011.f | SS | `orchestrator` | file | B-0166 | 1 | 0 | `translated` | 144-compatibility-projection | FX-01, FX-26 | DV-006 |
| C-011.g | SS | `orchestrator` | file | B-0169…B-0171 | 3 | 1 | `translated` | 102-run-control | FX-12, FX-13 | DV-006; DV-024 |
| C-011.h | SS | `orchestrator` | file | B-0173…B-0176, B-0179…B-0180, B-0183…B-0185 | 9 | 2 | `translated` | 101-gate-and-verdict | FX-01, FX-02, FX-03, FX-08 | DV-006 |
| C-011.i | SS | `orchestrator` | file | B-0177 | 1 | 0 | `translated` | 118-pass-supervision-and-jobs | FX-22 | DV-006 |
| C-011.j | SS | `orchestrator` | file | B-0178 | 1 | 0 | `translated` | 103-proposer-pass | FX-08 | DV-006 |
| C-011.k | SS | `orchestrator` | file | B-0186 | 1 | 0 | `translated` | 106-learning | FX-29 | DV-006 |
| C-012.a | SS | `orchestrator` | output-line | B-0187 | 1 | 0 | `ported` | 119-front-door-and-presenter | FX-28 | — |
| C-012.o | SS | `orchestrator` | output-line | B-0195…B-0198, B-0200…B-0201, B-0229…B-0230 | 8 | 0 | `ported` | 145-presenter | FX-28 | — |
| C-012.b | SS | `orchestrator` | output-line | B-0188 | 1 | 0 | `ported` | 124-harness-discovery-and-roles | FX-01 | — |
| C-012.c | SS | `orchestrator` | output-line | B-0189…B-0191 | 3 | 1 | `ported` | 104-spec-input | FX-09, FX-10 | — |
| C-012.d | SS | `orchestrator` | output-line | B-0192 | 1 | 0 | `translated` | 122-detached-runtime | FX-11 | DV-066 |
| C-012.e | SS | `orchestrator` | output-line | B-0193 | 1 | 0 | `superseded-by DV-037` | 100-specstride | — | DV-037 |
| C-012.f | SS | `orchestrator` | output-line | B-0194 | 1 | 0 | `ported` | 100-specstride | FX-01 | — |
| C-012.g | SS | `orchestrator` | output-line | B-0199 | 1 | 0 | `ported` | 128-telemetry-export | FX-31 | — |
| C-012.h | SS | `orchestrator` | output-line | B-0202…B-0203, B-0222, B-1145 | 4 | 0 | `ported` | 105-verification | FX-14, FX-15, FX-16 | — |
| C-012.i | SS | `orchestrator` | output-line | B-0204…B-0206, B-0208, B-0211, B-0223…B-0228, B-0231…B-0232 | 13 | 1 | `ported` | 101-gate-and-verdict | FX-01, FX-02, FX-03, FX-05, FX-07, FX-08, FX-27 | — |
| C-012.j | SS | `orchestrator` | output-line | B-0207, B-0212, B-0216…B-0218, B-0221 | 6 | 0 | `ported` | 103-proposer-pass | FX-03, FX-17, FX-18, FX-19, FX-24 | — |
| C-012.k | SS | `orchestrator` | output-line | B-0209, B-0215 | 2 | 0 | `ported` | 102-run-control | FX-12 | — |
| C-012.l | SS | `orchestrator` | output-line | B-0210 | 1 | 0 | `ported` | 127-quota-budgets-and-pause | FX-23 | — |
| C-012.m | SS | `orchestrator` | output-line | B-0213, B-0219…B-0220 | 3 | 0 | `ported` | 118-pass-supervision-and-jobs | FX-16, FX-22 | — |
| C-012.n | SS | `orchestrator` | output-line | B-0214 | 1 | 0 | `ported` | 106-learning | FX-29 | — |
| C-013.a | SS | `orchestrator` | behaviour | B-0233 | 1 | 0 | `superseded-by DV-023` | 110-config-and-terms | — | DV-023 |
| C-013.b | SS | `orchestrator` | behaviour | B-0234 | 1 | 0 | `superseded-by DV-036` | 110-config-and-terms | — | DV-036 |
| C-013.c | SS | `orchestrator` | behaviour | B-0235 | 1 | 0 | `ported` | 119-front-door-and-presenter | FX-28 | — |
| C-013.u | SS | `orchestrator` | behaviour | B-0261…B-0262, B-0264…B-0266, B-0335 | 6 | 0 | `ported` | 145-presenter | FX-28 | — |
| C-013.d | SS | `orchestrator` | behaviour | B-0236, B-0302, B-0304, B-0312 | 4 | 0 | `ported` | 118-pass-supervision-and-jobs | FX-16, FX-20, FX-21, FX-22 | DV-025 |
| C-013.e | SS | `orchestrator` | behaviour | B-0237, B-0239…B-0247 | 10 | 4 | `ported` | 104-spec-input | FX-09, FX-10 | — |
| C-013.f | SS | `orchestrator` | behaviour | B-0238, B-0267…B-0269, B-0274, B-0319…B-0320, B-0322, B-1146, B-1150 | 10 | 0 | `ported` | 105-verification | FX-03, FX-14, FX-15, FX-16, FX-20 | — |
| C-013.g | SS | `orchestrator` | behaviour | B-0248, B-0256 | 2 | 0 | `ported` | 100-specstride | FX-01 | — |
| C-013.h | SS | `orchestrator` | behaviour | B-0249 | 1 | 0 | `ported` | 122-detached-runtime | FX-13 | — |
| C-013.i | SS | `orchestrator` | behaviour | B-0250, B-0273, B-0275…B-0294, B-0306…B-0310, B-0313, B-0321, B-0324, B-0326…B-0334, B-0336…B-0337, B-1147…B-1149 | 44 | 16 | `ported` | 101-gate-and-verdict | FX-01, FX-02, FX-03, FX-04, FX-05, FX-08, FX-13, FX-15, FX-27 | DV-011; DV-044 |
| C-013.j | SS | `orchestrator` | behaviour | B-0251 | 1 | 0 | `superseded-by DV-022` | 122-detached-runtime | — | DV-022 |
| C-013.k | SS | `orchestrator` | behaviour | B-0252…B-0255, B-0272 | 5 | 0 | `superseded-by DV-037` | 100-specstride | — | DV-037 |
| C-013.l | SS | `orchestrator` | behaviour | B-0257…B-0259 | 3 | 0 | `translated` | 102-run-control | FX-12, FX-13, FX-27 | DV-024 |
| C-013.m | SS | `orchestrator` | behaviour | B-0260 | 1 | 0 | `superseded-by DV-024` | 102-run-control | — | DV-024 |
| C-013.n | SS | `orchestrator` | behaviour | B-0263, B-2463…B-2464 | 3 | 0 | `ported` | 144-compatibility-projection | FX-01, FX-26 | — |
| C-013.o | SS | `orchestrator` | behaviour | B-0270 | 1 | 0 | `ported` | 127-quota-budgets-and-pause | FX-23 | — |
| C-013.p | SS | `orchestrator` | behaviour | B-0271, B-0323 | 2 | 1 | `translated` | 101-gate-and-verdict | FX-01, FX-02, FX-03, FX-13 | DV-029 |
| C-013.q | SS | `orchestrator` | behaviour | B-0295…B-0301, B-0314…B-0315, B-0318 | 10 | 1 | `ported` | 103-proposer-pass | FX-08, FX-17, FX-18, FX-19, FX-22, FX-24 | DV-020 |
| C-013.r | SS | `orchestrator` | behaviour | B-0303, B-0305, B-0317, B-0325 | 4 | 0 | `ported` | 106-learning | FX-29 | DV-025 |
| C-013.s | SS | `orchestrator` | behaviour | B-0311 | 1 | 0 | `ported` | 102-run-control | FX-23 | — |
| C-013.t | SS | `orchestrator` | behaviour | B-0316 | 1 | 0 | `ported` | 128-telemetry-export | FX-31 | — |
| C-014 | SS | `specstride-digest` | cli-command | B-0338 | 1 | 0 | `dropped` | none | — | DV-061 |
| C-015 | SS | `specstride-digest` | file | B-0339…B-0340 | 2 | 0 | `dropped` | none | — | DV-061 |
| C-016 | SS | `specstride-digest` | output-line | B-0341…B-0343 | 3 | 0 | `dropped` | none | — | DV-061 |
| C-017 | SS | `specstride-digest` | behaviour | B-0344…B-0345 | 2 | 0 | `dropped` | none | — | DV-061 |
| C-018.a | SS | `specstride-lib` | env | B-0346 | 1 | 0 | `superseded-by DV-036` | 110-config-and-terms | — | DV-036 |
| C-018.b | SS | `specstride-lib` | env | B-0347 | 1 | 0 | `superseded-by DV-036` | 100-specstride | — | DV-036 |
| C-018.c | SS | `specstride-lib` | env | B-0348 | 1 | 0 | `translated` | 118-pass-supervision-and-jobs | FX-16 | DV-027 |
| C-019.a | SS | `specstride-lib` | event | B-0349…B-0350 | 2 | 0 | `translated` | 118-pass-supervision-and-jobs | FX-16 | DV-007 |
| C-019.b | SS | `specstride-lib` | event | B-0351 | 1 | 0 | `translated` | 105-verification | FX-16 | DV-007 |
| C-020.a | SS | `specstride-lib` | file | B-0352 | 1 | 0 | `translated` | 111-event-schema-and-projection | FX-01, FX-26 | DV-006 |
| C-020.b | SS | `specstride-lib` | file | B-0353 | 1 | 0 | `translated` | 118-pass-supervision-and-jobs | FX-16 | DV-006; DV-011 |
| C-021.a | SS | `specstride-lib` | output-line | B-0354 | 1 | 0 | `superseded-by DV-036` | 100-specstride | — | DV-036 |
| C-021.b | SS | `specstride-lib` | output-line | B-0355 | 1 | 0 | `superseded-by DV-036` | 110-config-and-terms | — | DV-036 |
| C-021.c | SS | `specstride-lib` | output-line | B-0356 | 1 | 0 | `ported` | 109-harness-seam | characterization test CT-109-109 | — |
| C-021.d | SS | `specstride-lib` | output-line | B-0357 | 1 | 0 | `ported` | 128-telemetry-export | FX-31 | — |
| C-021.e | SS | `specstride-lib` | output-line | B-0358 | 1 | 0 | `ported` | 118-pass-supervision-and-jobs | FX-16 | — |
| C-021.f | SS | `specstride-lib` | output-line | B-0359 | 1 | 0 | `ported` | 105-verification | FX-16 | — |
| C-022.a | SS | `specstride-lib` | behaviour | B-0360 | 1 | 0 | `superseded-by DV-036` | 100-specstride | — | DV-036 |
| C-022.b | SS | `specstride-lib` | behaviour | B-0361…B-0363, B-2465…B-2466 | 5 | 0 | `ported` | 144-compatibility-projection | FX-01, FX-26 | — |
| C-022.c | SS | `specstride-lib` | behaviour | B-0364…B-0365, B-2433 | 3 | 0 | `ported` | 128-telemetry-export | FX-31 | — |
| C-022.d | SS | `specstride-lib` | behaviour | B-0366…B-0367 | 2 | 1 | `ported` | 104-spec-input | FX-09, FX-10 | — |
| C-022.e | SS | `specstride-lib` | behaviour | B-0368…B-0371, B-0373…B-0374 | 6 | 0 | `ported` | 118-pass-supervision-and-jobs | FX-16, FX-20, FX-21, FX-22 | — |
| C-022.f | SS | `specstride-lib` | behaviour | B-0372 | 1 | 0 | `translated` | 118-pass-supervision-and-jobs | FX-11 | DV-022 |
| C-022.g | SS | `specstride-lib` | behaviour | B-0375 | 1 | 0 | `ported` | 105-verification | FX-16 | — |
| C-022.h | SS | `specstride-lib` | behaviour | B-2432 | 1 | 0 | `ported` | 126-stream-seam-and-invocation | FX-26 | — |
| C-023 | SS | `wiggum` | cli-command | B-0376 | 1 | 0 | `superseded-by DV-036` | 119-front-door-and-presenter | — | DV-036 |
| C-024 | SS | `wiggum` | output-line | B-0377 | 1 | 0 | `superseded-by DV-036` | 119-front-door-and-presenter | — | DV-036 |
| C-025 | SS | `wiggum-lib` | behaviour | B-0378 | 1 | 0 | `superseded-by DV-036` | 119-front-door-and-presenter | — | DV-036 |
| C-026 | SS | `backend_overlay` | cli-command | B-0386…B-0391 | 6 | 0 | `translated` | 109-harness-seam | FX-39 | DV-066 |
| C-027 | SS | `backend_overlay` | env | B-0392 | 1 | 1 | `translated` | 109-harness-seam | FX-39 | DV-027 |
| C-028 | SS | `backend_overlay` | exit-code | B-0393…B-0394 | 2 | 0 | `translated` | 109-harness-seam | FX-39 | LR-6 |
| C-029 | SS | `backend_overlay` | file | B-0395…B-0398 | 4 | 0 | `translated` | 109-harness-seam | FX-39 | DV-006 |
| C-030 | SS | `backend_overlay` | output-line | B-0399…B-0401 | 3 | 1 | `ported` | 109-harness-seam | FX-39 | — |
| C-031 | SS | `backend_overlay` | behaviour | B-0402…B-0417 | 16 | 4 | `ported` | 109-harness-seam | FX-39 | — |
| C-032 | SS | `backends` | cli-command | B-0418…B-0420 | 3 | 0 | `translated` | 109-harness-seam | FX-26 | DV-064; DV-066 |
| C-033 | SS | `backends` | cli-flag | B-0421 | 1 | 0 | `translated` | 109-harness-seam | FX-26 | DV-064; DV-066 |
| C-034 | SS | `backends` | output-line | B-0422 | 1 | 0 | `translated` | 109-harness-seam | FX-26 | DV-064 |
| C-035.a | SS | `backends` | behaviour | B-0423…B-0424, B-0431…B-0432 | 4 | 2 | `translated` | 109-harness-seam | FX-26 | DV-064 |
| C-035.b | SS | `backends` | behaviour | B-0425, B-0429 | 2 | 2 | `superseded-by DV-064` | 109-harness-seam | — | DV-064 |
| C-035.c | SS | `backends` | behaviour | B-0426 | 1 | 1 | `ported` | 130-adapter-dsh | FX-26 | — |
| C-035.d | SS | `backends` | behaviour | B-0427 | 1 | 1 | `ported` | 109-harness-seam | FX-26 | — |
| C-035.e | SS | `backends` | behaviour | B-0428 | 1 | 1 | `ported` | 131-adapter-codex | FX-26 | — |
| C-035.f | SS | `backends` | behaviour | B-0430 | 1 | 1 | `ported` | 138-adapter-prime | FX-26 | — |
| C-036 | SS | `dsh_plugin_requests` | cli-flag | B-0433 | 1 | 0 | `translated` | 130-adapter-dsh | FX-38 | DV-066 |
| C-037 | SS | `dsh_plugin_requests` | exit-code | B-0434 | 1 | 0 | `translated` | 130-adapter-dsh | FX-38 | LR-6 |
| C-038 | SS | `dsh_plugin_requests` | file | B-0435…B-0436 | 2 | 0 | `translated` | 130-adapter-dsh | FX-38 | DV-006 |
| C-039 | SS | `dsh_plugin_requests` | output-line | B-0437 | 1 | 0 | `ported` | 130-adapter-dsh | FX-38 | — |
| C-040 | SS | `dsh_plugin_requests` | behaviour | B-0438…B-0443 | 6 | 0 | `ported` | 130-adapter-dsh | FX-38 | — |
| C-041 | SS | `error_breaker` | stop-reason | B-0444 | 1 | 0 | `ported` | 103-proposer-pass | FX-20 | — |
| C-042 | SS | `error_breaker` | file | B-0445 | 1 | 0 | `translated` | 103-proposer-pass | FX-17, FX-18, FX-19, FX-24 | DV-006 |
| C-043 | SS | `error_breaker` | behaviour | B-0446…B-0450 | 5 | 2 | `ported` | 103-proposer-pass | FX-17, FX-18, FX-19, FX-24 | — |
| C-044 | SS | `failure_ledger` | cli-command | B-0451 | 1 | 0 | `translated` | 118-pass-supervision-and-jobs | FX-13 | DV-066 |
| C-045 | SS | `failure_ledger` | env | B-0452 | 1 | 0 | `translated` | 118-pass-supervision-and-jobs | FX-20, FX-21, FX-22 | DV-027 |
| C-046 | SS | `failure_ledger` | exit-code | B-0453 | 1 | 0 | `translated` | 118-pass-supervision-and-jobs | FX-13 | LR-6 |
| C-047 | SS | `failure_ledger` | file | B-0454 | 1 | 0 | `translated` | 118-pass-supervision-and-jobs | FX-20, FX-21, FX-22 | DV-006 |
| C-048 | SS | `failure_ledger` | output-line | B-0455…B-0456 | 2 | 0 | `ported` | 118-pass-supervision-and-jobs | FX-20, FX-21, FX-22 | — |
| C-049 | SS | `failure_ledger` | behaviour | B-0457…B-0461 | 5 | 0 | `ported` | 118-pass-supervision-and-jobs | FX-20, FX-21, FX-22 | — |
| C-050 | SS | `proposer` | cli-command | B-0462 | 1 | 0 | `translated` | 103-proposer-pass | FX-17, FX-18, FX-19, FX-24 | DV-066 |
| C-051.a | SS | `proposer` | cli-flag | B-0463…B-0465, B-0468…B-0469, B-0477, B-0479…B-0480, B-0485 | 9 | 0 | `translated` | 103-proposer-pass | FX-17, FX-18, FX-19, FX-22, FX-24 | DV-066 |
| C-051.b | SS | `proposer` | cli-flag | B-0466 | 1 | 0 | `superseded-by DV-004` | 124-harness-discovery-and-roles | — | DV-004 |
| C-051.c | SS | `proposer` | cli-flag | B-0467 | 1 | 0 | `translated` | 124-harness-discovery-and-roles | FX-01 | DV-066 |
| C-051.d | SS | `proposer` | cli-flag | B-0470…B-0475 | 6 | 0 | `translated` | 118-pass-supervision-and-jobs | FX-20, FX-21, FX-22 | DV-066 |
| C-051.e | SS | `proposer` | cli-flag | B-0476, B-0482…B-0483 | 3 | 0 | `translated` | 128-telemetry-export | FX-31 | DV-066 |
| C-051.f | SS | `proposer` | cli-flag | B-0478, B-0481, B-0484 | 3 | 0 | `translated` | 126-stream-seam-and-invocation | FX-26 | DV-066 |
| C-052.a | SS | `proposer` | env | B-0486 | 1 | 0 | `superseded-by DV-004` | 124-harness-discovery-and-roles | — | DV-004 |
| C-052.b | SS | `proposer` | env | B-0487, B-0501, B-0503…B-0504, B-0537, B-0539 | 6 | 1 | `translated` | 103-proposer-pass | FX-17, FX-18, FX-19, FX-24 | DV-027 |
| C-052.c | SS | `proposer` | env | B-0488…B-0492, B-0506…B-0507, B-0521, B-0523…B-0533, B-0538, B-0540…B-0541 | 22 | 7 | `translated` | 118-pass-supervision-and-jobs | FX-20, FX-21, FX-22 | DV-013; DV-015; DV-027 |
| C-052.d | SS | `proposer` | env | B-0493…B-0494 | 2 | 2 | `translated` | 128-telemetry-export | FX-31 | DV-027 |
| C-052.e | SS | `proposer` | env | B-0495…B-0496, B-0498…B-0499, B-0502, B-0505, B-0535 | 7 | 0 | `translated` | 126-stream-seam-and-invocation | FX-26 | DV-027 |
| C-052.f | SS | `proposer` | env | B-0497, B-0511…B-0512 | 3 | 0 | `translated` | 109-harness-seam | FX-26 | DV-027; DV-030 |
| C-052.g | SS | `proposer` | env | B-0500 | 1 | 0 | `translated` | 144-compatibility-projection | FX-01, FX-26 | DV-027 |
| C-052.h | SS | `proposer` | env | B-0508…B-0510, B-0513…B-0516, B-0536, B-0542 | 9 | 0 | `translated` | 130-adapter-dsh | FX-01, FX-17, FX-18, FX-26 | DV-027; DV-030 |
| C-052.i | SS | `proposer` | env | B-0517…B-0518 | 2 | 0 | `translated` | 138-adapter-prime | FX-01, FX-26 | DV-027 |
| C-052.j | SS | `proposer` | env | B-0519…B-0520 | 2 | 0 | `superseded-by DV-064` | 109-harness-seam | — | DV-064 |
| C-052.k | SS | `proposer` | env | B-0522, B-0534 | 2 | 0 | `translated` | 125-adapter-claude | FX-01, FX-06 | DV-027; DV-031 |
| C-053.a | SS | `proposer` | event | B-0543…B-0546, B-0554…B-0556, B-0558…B-0560 | 10 | 0 | `translated` | 118-pass-supervision-and-jobs | FX-20, FX-21, FX-22, FX-24 | DV-007; DV-013 |
| C-053.b | SS | `proposer` | event | B-0547 | 1 | 0 | `translated` | 138-adapter-prime | FX-01, FX-26 | DV-007 |
| C-053.c | SS | `proposer` | event | B-0548, B-2425 | 2 | 0 | `translated` | 126-stream-seam-and-invocation | FX-26 | DV-007 |
| C-053.d | SS | `proposer` | event | B-0549…B-0550, B-0557, B-0561…B-0562 | 5 | 1 | `translated` | 103-proposer-pass | FX-17, FX-18, FX-19, FX-24 | DV-007 |
| C-053.e | SS | `proposer` | event | B-0551…B-0553, B-0563 | 4 | 0 | `translated` | 130-adapter-dsh | FX-17, FX-18, FX-19, FX-22 | DV-007 |
| C-054.a | SS | `proposer` | exit-code | B-0564…B-0567, B-0577…B-0578, B-0592, B-0594…B-0595, B-0597 | 10 | 3 | `translated` | 103-proposer-pass | FX-13, FX-17, FX-18, FX-19, FX-24 | DV-005; DV-046; LR-6 |
| C-054.b | SS | `proposer` | exit-code | B-0568…B-0569 | 2 | 0 | `superseded-by DV-065` | 128-telemetry-export | — | DV-065 |
| C-054.c | SS | `proposer` | exit-code | B-0570, B-0579…B-0583 | 6 | 0 | `translated` | 109-harness-seam | FX-26 | LR-6 |
| C-054.d | SS | `proposer` | exit-code | B-0571, B-0585…B-0587 | 4 | 0 | `translated` | 130-adapter-dsh | FX-17, FX-18 | LR-6 |
| C-054.e | SS | `proposer` | exit-code | B-0572…B-0573 | 2 | 0 | `translated` | 138-adapter-prime | FX-18 | LR-6 |
| C-054.f | SS | `proposer` | exit-code | B-0574 | 1 | 0 | `superseded-by DV-064` | 109-harness-seam | — | DV-064 |
| C-054.g | SS | `proposer` | exit-code | B-0575 | 1 | 0 | `translated` | 124-harness-discovery-and-roles | FX-01 | DV-064; LR-6 |
| C-054.h | SS | `proposer` | exit-code | B-0576, B-0588, B-0590…B-0591, B-0593 | 5 | 2 | `translated` | 118-pass-supervision-and-jobs | FX-20, FX-21, FX-22 | DV-051; LR-6 |
| C-054.i | SS | `proposer` | exit-code | B-0584, B-0589, B-0596 | 3 | 3 | `translated` | 102-run-control | FX-12, FX-22 | LR-6 |
| C-055.a | SS | `proposer` | stop-reason | B-0598, B-0600, B-2426, B-2428 | 4 | 0 | `ported` | 126-stream-seam-and-invocation | FX-26 | — |
| C-055.b | SS | `proposer` | stop-reason | B-0599, B-2427 | 2 | 0 | `superseded-by DV-065` | 126-stream-seam-and-invocation | — | DV-065 |
| C-055.c | SS | `proposer` | stop-reason | B-0601…B-0611, B-0613, B-2784 | 13 | 0 | `ported` | 118-pass-supervision-and-jobs | FX-20, FX-21, FX-22, FX-23 | DV-015 |
| C-055.d | SS | `proposer` | stop-reason | B-0612, B-0614…B-0616, B-2785 | 5 | 0 | `ported` | 103-proposer-pass | FX-17, FX-18, FX-19, FX-21, FX-24 | — |
| C-056.a | SS | `proposer` | file | B-0617, B-0637 | 2 | 0 | `translated` | 103-proposer-pass | FX-17, FX-18, FX-19, FX-24 | DV-006 |
| C-056.b | SS | `proposer` | file | B-0618…B-0619, B-0621, B-0624 | 4 | 0 | `translated` | 130-adapter-dsh | FX-17, FX-18, FX-26 | DV-006 |
| C-056.c | SS | `proposer` | file | B-0620, B-0628…B-0632, B-0638 | 7 | 0 | `translated` | 118-pass-supervision-and-jobs | FX-20, FX-21, FX-22 | DV-006 |
| C-056.d | SS | `proposer` | file | B-0622…B-0623 | 2 | 0 | `translated` | 109-harness-seam | FX-21, FX-26 | DV-006 |
| C-056.e | SS | `proposer` | file | B-0625 | 1 | 0 | `translated` | 125-adapter-claude | FX-01, FX-06 | DV-006 |
| C-056.f | SS | `proposer` | file | B-0626…B-0627, B-0633…B-0636 | 6 | 0 | `translated` | 126-stream-seam-and-invocation | FX-26 | DV-006 |
| C-057.a | SS | `proposer` | output-line | B-0639, B-0652 | 2 | 0 | `ported` | 103-proposer-pass | FX-17, FX-18, FX-19, FX-24 | — |
| C-057.b | SS | `proposer` | output-line | B-0640 | 1 | 1 | `ported` | 124-harness-discovery-and-roles | FX-01 | — |
| C-057.c | SS | `proposer` | output-line | B-0641 | 1 | 0 | `translated` | 109-harness-seam | FX-26 | DV-066 |
| C-057.d | SS | `proposer` | output-line | B-0642, B-0653…B-0654 | 3 | 0 | `translated` | 130-adapter-dsh | FX-17, FX-18 | DV-066 |
| C-057.e | SS | `proposer` | output-line | B-0643…B-0645, B-0648, B-0651 | 5 | 0 | `ported` | 118-pass-supervision-and-jobs | FX-20, FX-21, FX-22 | — |
| C-057.f | SS | `proposer` | output-line | B-0646…B-0647, B-0655…B-0657, B-0660…B-0662 | 8 | 0 | `translated` | 118-pass-supervision-and-jobs | FX-20, FX-21, FX-22 | DV-066 |
| C-057.g | SS | `proposer` | output-line | B-0649, B-0659, B-0663…B-0667 | 7 | 0 | `translated` | 103-proposer-pass | FX-17, FX-18, FX-19, FX-24 | DV-066 |
| C-057.h | SS | `proposer` | output-line | B-0650 | 1 | 0 | `ported` | 130-adapter-dsh | FX-17, FX-18 | — |
| C-057.i | SS | `proposer` | output-line | B-0658 | 1 | 0 | `translated` | 102-run-control | FX-22 | DV-066 |
| C-058.a | SS | `proposer` | behaviour | B-0668, B-0670…B-0671, B-0743, B-0755…B-0756, B-0760…B-0762, B-0778, B-0784…B-0787, B-0789…B-0792 | 18 | 3 | `ported` | 103-proposer-pass | FX-08, FX-17, FX-18, FX-19, FX-20, FX-21, FX-22, FX-24 | DV-010; DV-067 |
| C-058.b | SS | `proposer` | behaviour | B-0669, B-0674, B-0700…B-0739, B-0763, B-0765…B-0766, B-0770…B-0777, B-0779…B-0780, B-0788 | 56 | 10 | `ported` | 118-pass-supervision-and-jobs | FX-12, FX-13, FX-16, FX-20, FX-21, FX-22, FX-24 | DV-013; DV-014 |
| C-058.c | SS | `proposer` | behaviour | B-0672, B-0753 | 2 | 0 | `ported` | 128-telemetry-export | FX-31 | — |
| C-058.d | SS | `proposer` | behaviour | B-0673 | 1 | 0 | `superseded-by DV-065` | 126-stream-seam-and-invocation | — | DV-065 |
| C-058.e | SS | `proposer` | behaviour | B-0675, B-0698, B-0746, B-0748…B-0752, B-0754, B-0781…B-0783, B-2429…B-2431 | 15 | 0 | `ported` | 126-stream-seam-and-invocation | FX-26 | — |
| C-058.f | SS | `proposer` | behaviour | B-0676…B-0679, B-0686…B-0688, B-0757, B-0764, B-0768…B-0769 | 11 | 0 | `ported` | 130-adapter-dsh | FX-01, FX-16, FX-17, FX-18, FX-20, FX-22, FX-24, FX-26 | DV-020; DV-030 |
| C-058.g | SS | `proposer` | behaviour | B-0680…B-0684, B-0758…B-0759, B-0767 | 8 | 2 | `ported` | 109-harness-seam | FX-21, FX-26 | — |
| C-058.h | SS | `proposer` | behaviour | B-0685 | 1 | 1 | `translated` | 109-harness-seam | FX-26 | DV-064 |
| C-058.i | SS | `proposer` | behaviour | B-0689, B-0740…B-0742 | 4 | 0 | `translated` | 125-adapter-claude | FX-01, FX-06 | DV-031 |
| C-058.j | SS | `proposer` | behaviour | B-0690…B-0691 | 2 | 0 | `ported` | 131-adapter-codex | FX-01, FX-26 | DV-030; DV-064 |
| C-058.k | SS | `proposer` | behaviour | B-0692…B-0696, B-0747 | 6 | 0 | `ported` | 138-adapter-prime | FX-01, FX-18, FX-26 | DV-010; DV-064 |
| C-058.l | SS | `proposer` | behaviour | B-0697 | 1 | 0 | `superseded-by DV-064` | 109-harness-seam | — | DV-064 |
| C-058.m | SS | `proposer` | behaviour | B-0699 | 1 | 0 | `translated` | 103-proposer-pass | FX-17, FX-18, FX-19, FX-24 | DV-036 |
| C-058.n | SS | `proposer` | behaviour | B-0744…B-0745 | 2 | 0 | `ported` | 125-adapter-claude | FX-01, FX-06 | — |
| C-059 | SS | `critic` | cli-command | B-0793 | 1 | 1 | `translated` | 101-gate-and-verdict | FX-01, FX-02, FX-03 | DV-066 |
| C-060.a | SS | `critic` | cli-flag | B-0794, B-0797…B-0798, B-0805 | 4 | 2 | `translated` | 101-gate-and-verdict | FX-01, FX-02, FX-03, FX-08 | DV-066 |
| C-060.b | SS | `critic` | cli-flag | B-0795…B-0796, B-0802, B-0806 | 4 | 1 | `translated` | 104-spec-input | FX-09, FX-10 | DV-066 |
| C-060.c | SS | `critic` | cli-flag | B-0799 | 1 | 1 | `translated` | 124-harness-discovery-and-roles | FX-01 | DV-066 |
| C-060.d | SS | `critic` | cli-flag | B-0800 | 1 | 0 | `translated` | 109-harness-seam | FX-06 | DV-066 |
| C-060.e | SS | `critic` | cli-flag | B-0801, B-0804 | 2 | 0 | `translated` | 117-critic-grounding-and-prompt | FX-25 | DV-066 |
| C-060.f | SS | `critic` | cli-flag | B-0803 | 1 | 0 | `translated` | 105-verification | FX-14, FX-15, FX-16 | DV-066; DV-082 |
| C-061.a | SS | `critic` | env | B-0807 | 1 | 0 | `superseded-by DV-036` | 110-config-and-terms | — | DV-036 |
| C-061.b | SS | `critic` | env | B-0808…B-0810, B-0847 | 4 | 0 | `translated` | 117-critic-grounding-and-prompt | FX-25 | DV-027 |
| C-061.c | SS | `critic` | env | B-0811…B-0814, B-0830 | 5 | 0 | `translated` | 125-adapter-claude | FX-01, FX-05, FX-06 | DV-027 |
| C-061.d | SS | `critic` | env | B-0815…B-0816, B-0834…B-0838 | 7 | 0 | `superseded-by DV-064` | 109-harness-seam | — | DV-064 |
| C-061.e | SS | `critic` | env | B-0817…B-0826 | 10 | 0 | `translated` | 130-adapter-dsh | FX-01, FX-06, FX-07 | DV-027 |
| C-061.f | SS | `critic` | env | B-0827…B-0829, B-0839 | 4 | 0 | `translated` | 138-adapter-prime | FX-01, FX-06, FX-26 | DV-027 |
| C-061.g | SS | `critic` | env | B-0831…B-0833 | 3 | 0 | `translated` | 131-adapter-codex | FX-01, FX-06, FX-07, FX-25 | DV-027; DV-081 |
| C-061.h | SS | `critic` | env | B-0840…B-0843 | 4 | 0 | `translated` | 128-telemetry-export | FX-31 | DV-027 |
| C-061.i | SS | `critic` | env | B-0844 | 1 | 1 | `translated` | 101-gate-and-verdict | FX-03 | DV-027 |
| C-061.j | SS | `critic` | env | B-0845 | 1 | 1 | `translated` | 124-harness-discovery-and-roles | FX-01 | DV-027 |
| C-061.k | SS | `critic` | env | B-0846 | 1 | 0 | `translated` | 109-harness-seam | FX-26 | DV-027 |
| C-061.l | SS | `critic` | env | B-0848 | 1 | 0 | `translated` | 104-spec-input | FX-09, FX-10 | DV-027 |
| C-061.m | SS | `critic` | env | B-0849 | 1 | 0 | `translated` | 105-verification | FX-14, FX-15, FX-16 | DV-027 |
| C-061.n | SS | `critic` | env | B-0850 | 1 | 0 | `translated` | 144-compatibility-projection | FX-01, FX-26 | DV-027 |
| C-062.a | SS | `critic` | event | B-0851…B-0853, B-0855, B-0858…B-0859 | 6 | 0 | `translated` | 101-gate-and-verdict | FX-01, FX-02, FX-03, FX-05, FX-06, FX-08 | DV-007 |
| C-062.b | SS | `critic` | event | B-0854, B-0857 | 2 | 0 | `translated` | 117-critic-grounding-and-prompt | FX-25 | DV-007 |
| C-062.c | SS | `critic` | event | B-0856 | 1 | 0 | `translated` | 138-adapter-prime | FX-01, FX-26 | DV-007 |
| C-063.a | SS | `critic` | exit-code | B-0860, B-0865…B-0868 | 5 | 1 | `translated` | 101-gate-and-verdict | FX-01, FX-02, FX-03, FX-05, FX-08 | LR-6 |
| C-063.b | SS | `critic` | exit-code | B-0861…B-0863 | 3 | 1 | `translated` | 104-spec-input | FX-09, FX-10 | LR-6 |
| C-063.c | SS | `critic` | exit-code | B-0864 | 1 | 0 | `translated` | 105-verification | FX-14, FX-15, FX-16 | DV-082; LR-6 |
| C-064.a | SS | `critic` | file | B-0869…B-0872, B-0874…B-0881 | 12 | 2 | `translated` | 101-gate-and-verdict | FX-01, FX-02, FX-03, FX-05, FX-06, FX-08 | DV-006; DV-029; DV-036; DV-072 |
| C-064.b | SS | `critic` | file | B-0873, B-0882 | 2 | 0 | `translated` | 117-critic-grounding-and-prompt | FX-25 | DV-006 |
| C-065.a | SS | `critic` | output-line | B-0883 | 1 | 0 | `translated` | 101-gate-and-verdict | FX-01, FX-02, FX-03 | DV-066 |
| C-065.b | SS | `critic` | output-line | B-0884…B-0892, B-0895…B-0899 | 14 | 0 | `ported` | 117-critic-grounding-and-prompt | FX-25 | — |
| C-065.c | SS | `critic` | output-line | B-0893…B-0894, B-0900…B-0901 | 4 | 0 | `ported` | 101-gate-and-verdict | FX-01, FX-02, FX-03, FX-05, FX-08 | — |
| C-066.a | SS | `critic` | behaviour | B-0902…B-0904, B-0913…B-0916, B-0918…B-0961, B-0964, B-0968…B-0972, B-0974, B-1001…B-1002, B-1004…B-1009, B-1011, B-1015…B-1016 | 69 | 0 | `ported` | 117-critic-grounding-and-prompt | FX-25 | DV-019; DV-032 |
| C-066.b | SS | `critic` | behaviour | B-0905…B-0909, B-0982 | 6 | 0 | `superseded-by DV-064` | 109-harness-seam | — | DV-064 |
| C-066.c | SS | `critic` | behaviour | B-0910 | 1 | 0 | `ported` | 131-adapter-codex | FX-25 | — |
| C-066.d | SS | `critic` | behaviour | B-0911 | 1 | 0 | `ported` | 125-adapter-claude | FX-01, FX-06 | — |
| C-066.e | SS | `critic` | behaviour | B-0912, B-0983…B-0988, B-0990 | 8 | 0 | `ported` | 130-adapter-dsh | FX-01, FX-06, FX-07, FX-25 | — |
| C-066.f | SS | `critic` | behaviour | B-0917, B-0962…B-0963, B-0965…B-0967, B-0973, B-0975…B-0979, B-1003, B-1010, B-1017 | 15 | 7 | `ported` | 101-gate-and-verdict | FX-01, FX-02, FX-03, FX-05, FX-08, FX-21 | — |
| C-066.g | SS | `critic` | behaviour | B-0980 | 1 | 0 | `translated` | 125-adapter-claude | FX-06 | DV-001 |
| C-066.h | SS | `critic` | behaviour | B-0981 | 1 | 0 | `translated` | 131-adapter-codex | FX-06, FX-07 | DV-001; DV-081 |
| C-066.i | SS | `critic` | behaviour | B-0989, B-0992, B-1012…B-1014 | 5 | 1 | `ported` | 109-harness-seam | FX-05, FX-06 | — |
| C-066.j | SS | `critic` | behaviour | B-0991, B-0994…B-0995 | 3 | 0 | `ported` | 138-adapter-prime | FX-01, FX-06, FX-07, FX-26 | DV-010 |
| C-066.k | SS | `critic` | behaviour | B-0993 | 1 | 1 | `translated` | 109-harness-seam | FX-06 | DV-064 |
| C-066.l | SS | `critic` | behaviour | B-0996 | 1 | 0 | `translated` | 124-harness-discovery-and-roles | FX-01 | DV-064 |
| C-066.m | SS | `critic` | behaviour | B-0997…B-0998 | 2 | 0 | `ported` | 144-compatibility-projection | FX-01, FX-26 | — |
| C-066.n | SS | `critic` | behaviour | B-0999…B-1000 | 2 | 0 | `ported` | 128-telemetry-export | FX-31 | — |
| C-067 | SS | `verdict_pins` | file | B-1018…B-1019 | 2 | 0 | `translated` | 117-critic-grounding-and-prompt | FX-25 | DV-006 |
| C-068 | SS | `verdict_pins` | behaviour | B-1020…B-1026 | 7 | 0 | `ported` | 117-critic-grounding-and-prompt | FX-25 | — |
| C-069 | SS | `verification_failure_digest` | cli-command | B-1027 | 1 | 0 | `translated` | 105-verification | FX-14, FX-15, FX-16 | DV-066 |
| C-070 | SS | `verification_failure_digest` | env | B-1028…B-1029 | 2 | 0 | `translated` | 105-verification | FX-14, FX-15, FX-16 | DV-027 |
| C-071 | SS | `verification_failure_digest` | exit-code | B-1030…B-1031 | 2 | 0 | `translated` | 105-verification | FX-14, FX-15, FX-16 | LR-6 |
| C-072 | SS | `verification_failure_digest` | output-line | B-1032…B-1035 | 4 | 0 | `ported` | 105-verification | FX-14, FX-15, FX-16 | — |
| C-073 | SS | `verification_failure_digest` | behaviour | B-1036 | 1 | 0 | `ported` | 105-verification | FX-14, FX-15, FX-16 | — |
| C-074 | SS | `verification_plan` | cli-command | B-1037…B-1043 | 7 | 0 | `translated` | 105-verification | FX-14, FX-15, FX-16 | DV-066 |
| C-075 | SS | `verification_plan` | cli-flag | B-1044…B-1054 | 11 | 0 | `translated` | 105-verification | FX-14, FX-15, FX-16 | DV-066 |
| C-076 | SS | `verification_plan` | exit-code | B-1055…B-1058 | 4 | 0 | `translated` | 105-verification | FX-14, FX-15, FX-16 | LR-6 |
| C-077 | SS | `verification_plan` | stop-reason | B-1059 | 1 | 0 | `ported` | 105-verification | FX-14, FX-15, FX-16 | — |
| C-078 | SS | `verification_plan` | file | B-1060…B-1071 | 12 | 0 | `translated` | 105-verification | FX-14, FX-15, FX-16 | DV-006 |
| C-079 | SS | `verification_plan` | output-line | B-1072…B-1076 | 5 | 0 | `ported` | 105-verification | FX-14, FX-15, FX-16 | — |
| C-080 | SS | `verification_plan` | behaviour | B-1077…B-1119, B-1123, B-1125…B-1135 | 55 | 2 | `ported` | 105-verification | FX-06, FX-11, FX-14, FX-15, FX-16, FX-22 | DV-045; DV-082 |
| C-080.a | SS | `verification_plan` | behaviour | B-1120…B-1122, B-1124 | 4 | 0 | `ported` | 148-check-runner | FX-06, FX-11, FX-14, FX-15, FX-16, FX-22 | DV-045; DV-082 |
| C-081 | SS | `banner` | cli-command | B-1151 | 1 | 0 | `translated` | 145-presenter | FX-40 | DV-066 |
| C-082 | SS | `banner` | cli-flag | B-1152…B-1160 | 9 | 0 | `translated` | 145-presenter | FX-01, FX-40 | DV-066 |
| C-083 | SS | `banner` | env | B-1161…B-1164 | 4 | 0 | `translated` | 145-presenter | FX-40 | DV-027 |
| C-084 | SS | `banner` | exit-code | B-1165 | 1 | 0 | `translated` | 145-presenter | FX-01 | LR-6 |
| C-085 | SS | `banner` | output-line | B-1166…B-1167 | 2 | 0 | `ported` | 145-presenter | FX-01 | — |
| C-086 | SS | `banner` | behaviour | B-1168…B-1173 | 6 | 0 | `ported` | 145-presenter | FX-01, FX-40 | — |
| C-087 | SS | `learn` | cli-command | B-1174…B-1182 | 9 | 0 | `translated` | 106-learning | FX-29 | DV-066 |
| C-088 | SS | `learn` | cli-flag | B-1183…B-1203 | 21 | 1 | `translated` | 106-learning | FX-29 | DV-066 |
| C-089 | SS | `learn` | env | B-1204…B-1205 | 2 | 0 | `translated` | 106-learning | FX-29 | DV-027 |
| C-090 | SS | `learn` | event | B-1206…B-1229 | 24 | 0 | `translated` | 106-learning | FX-29 | DV-007 |
| C-091 | SS | `learn` | exit-code | B-1230…B-1241 | 12 | 0 | `ported` | 106-learning | FX-29 | — |
| C-092 | SS | `learn` | stop-reason | B-1242…B-1253 | 12 | 0 | `ported` | 106-learning | FX-29 | — |
| C-093 | SS | `learn` | file | B-1254…B-1266 | 13 | 0 | `translated` | 106-learning | FX-29 | DV-006 |
| C-094 | SS | `learn` | output-line | B-1267…B-1281 | 15 | 0 | `ported` | 106-learning | FX-29 | — |
| C-095.a | SS | `learn` | behaviour | B-1282 | 1 | 0 | `superseded-by DV-036` | 110-config-and-terms | — | DV-036 |
| C-095.b | SS | `learn` | behaviour | B-1283…B-1327 | 45 | 4 | `ported` | 106-learning | FX-29 | — |
| C-096 | SS | `present` | cli-command | B-1328 | 1 | 0 | `translated` | 145-presenter | FX-28 | DV-066 |
| C-097 | SS | `present` | cli-flag | B-1329…B-1336 | 8 | 0 | `translated` | 145-presenter | FX-28, FX-40 | DV-066 |
| C-098 | SS | `present` | env | B-1337 | 1 | 0 | `translated` | 145-presenter | FX-40 | DV-027 |
| C-099 | SS | `present` | event | B-1338…B-1365 | 28 | 0 | `translated` | 145-presenter | FX-40 | DV-007 |
| C-100 | SS | `present` | exit-code | B-1366 | 1 | 0 | `translated` | 145-presenter | FX-28 | LR-6 |
| C-101 | SS | `present` | file | B-1367 | 1 | 0 | `translated` | 145-presenter | FX-40 | DV-006 |
| C-102 | SS | `present` | output-line | B-1368…B-1378 | 11 | 0 | `ported` | 145-presenter | FX-28, FX-40 | — |
| C-103.a | SS | `present` | behaviour | B-1379 | 1 | 0 | `superseded-by DV-036` | 110-config-and-terms | — | DV-036 |
| C-103.b | SS | `present` | behaviour | B-1380…B-1407 | 28 | 0 | `ported` | 145-presenter | FX-28 | — |
| C-104 | SS | `theme` | cli-command | B-1408 | 1 | 0 | `translated` | 145-presenter | FX-40 | DV-066 |
| C-105 | SS | `theme` | env | B-1409…B-1419 | 11 | 0 | `translated` | 145-presenter | FX-01, FX-40 | DV-027 |
| C-106 | SS | `theme` | exit-code | B-1420 | 1 | 0 | `translated` | 145-presenter | FX-40 | LR-6 |
| C-107 | SS | `theme` | behaviour | B-1421…B-1426 | 6 | 0 | `ported` | 145-presenter | FX-40 | — |
| C-108.a | SS | `specstride` | cli-command | B-1427 | 1 | 1 | `ported` | 108-reverse | FX-30 | — |
| C-108.b | SS | `specstride` | cli-command | B-1428…B-1438, B-1442…B-1443 | 13 | 9 | `ported` | 119-front-door-and-presenter | FX-28 | — |
| C-108.c | SS | `specstride` | cli-command | B-1439…B-1440 | 2 | 2 | `ported` | 102-run-control | FX-12, FX-13 | — |
| C-108.d | SS | `specstride` | cli-command | B-1441 | 1 | 0 | `ported` | 106-learning | FX-29 | — |
| C-109.a | SS | `specstride` | cli-flag | B-1444…B-1455 | 12 | 0 | `ported` | 108-reverse | FX-30 | — |
| C-109.b | SS | `specstride` | cli-flag | B-1456…B-1461, B-1463…B-1465 | 9 | 1 | `ported` | 119-front-door-and-presenter | FX-28 | — |
| C-109.c | SS | `specstride` | cli-flag | B-1462 | 1 | 1 | `ported` | 102-run-control | FX-12 | — |
| C-109.d | SS | `specstride` | cli-flag | B-1466…B-1471 | 6 | 0 | `ported` | 106-learning | FX-29 | — |
| C-110.a | SS | `specstride` | env | B-1472 | 1 | 0 | `translated` | 108-reverse | FX-30 | DV-027 |
| C-110.b | SS | `specstride` | env | B-1473 | 1 | 0 | `translated` | 102-run-control | FX-27 | DV-027 |
| C-110.c | SS | `specstride` | env | B-1474…B-1475 | 2 | 0 | `translated` | 106-learning | FX-29 | DV-027 |
| C-111.a | SS | `specstride` | exit-code | B-1476…B-1481 | 6 | 0 | `ported` | 108-reverse | FX-30 | — |
| C-111.b | SS | `specstride` | exit-code | B-1482…B-1492, B-1499 | 12 | 0 | `ported` | 119-front-door-and-presenter | FX-28 | — |
| C-111.c | SS | `specstride` | exit-code | B-1493 | 1 | 0 | `ported` | 102-run-control | FX-12, FX-13 | — |
| C-111.d | SS | `specstride` | exit-code | B-1494…B-1496 | 3 | 1 | `translated` | 102-run-control | FX-13 | DV-021 |
| C-111.e | SS | `specstride` | exit-code | B-1497…B-1498 | 2 | 0 | `ported` | 106-learning | FX-29 | — |
| C-112 | SS | `specstride` | stop-reason | B-1500…B-1504 | 5 | 0 | `ported` | 119-front-door-and-presenter | FX-28 | — |
| C-113.a | SS | `specstride` | file | B-1505 | 1 | 0 | `superseded-by DV-023` | 110-config-and-terms | — | DV-023 |
| C-113.b | SS | `specstride` | file | B-1506…B-1508, B-1511…B-1512 | 5 | 0 | `translated` | 119-front-door-and-presenter | FX-28 | DV-006; DV-036 |
| C-113.c | SS | `specstride` | file | B-1509…B-1510 | 2 | 1 | `translated` | 122-detached-runtime | FX-11 | DV-006; DV-022 |
| C-113.d | SS | `specstride` | file | B-1513 | 1 | 0 | `superseded-by DV-062` | 119-front-door-and-presenter | — | DV-062 |
| C-113.e | SS | `specstride` | file | B-1514…B-1516 | 3 | 2 | `translated` | 102-run-control | FX-12, FX-13 | DV-006 |
| C-114.a | SS | `specstride` | output-line | B-1517…B-1518, B-1523…B-1547 | 27 | 0 | `ported` | 119-front-door-and-presenter | FX-28 | — |
| C-114.b | SS | `specstride` | output-line | B-1519…B-1522 | 4 | 0 | `ported` | 108-reverse | FX-30 | — |
| C-114.c | SS | `specstride` | output-line | B-1548…B-1554 | 7 | 0 | `ported` | 102-run-control | FX-08, FX-12, FX-13 | — |
| C-115.a | SS | `specstride` | behaviour | B-1555, B-1558…B-1564, B-1567…B-1577 | 19 | 1 | `ported` | 119-front-door-and-presenter | FX-28 | — |
| C-115.b | SS | `specstride` | behaviour | B-1556…B-1557 | 2 | 0 | `ported` | 108-reverse | FX-30 | — |
| C-115.c | SS | `specstride` | behaviour | B-1565 | 1 | 0 | `ported` | 122-detached-runtime | FX-11 | — |
| C-115.d | SS | `specstride` | behaviour | B-1566, B-1578…B-1580, B-1582, B-1585…B-1596 | 17 | 12 | `ported` | 102-run-control | FX-12, FX-13, FX-16 | DV-039 |
| C-115.e | SS | `specstride` | behaviour | B-1581, B-1583 | 2 | 1 | `translated` | 102-run-control | FX-03, FX-13 | DV-024 |
| C-115.f | SS | `specstride` | behaviour | B-1584 | 1 | 0 | `superseded-by DV-024` | 102-run-control | — | DV-024 |
| C-115.g | SS | `specstride` | behaviour | B-1597…B-1598 | 2 | 0 | `ported` | 106-learning | FX-29 | — |
| C-116 | SS | `reverse` | cli-command | B-1599…B-1602 | 4 | 0 | `translated` | 108-reverse | FX-30 | DV-066 |
| C-117 | SS | `reverse` | cli-flag | B-1603, B-1605…B-1606, B-1611…B-1612, B-1616…B-1617 | 7 | 5 | `translated` | 108-reverse | FX-30 | DV-066 |
| C-117.a | SS | `reverse` | cli-flag | B-1604, B-1607…B-1610, B-1613…B-1615 | 8 | 4 | `translated` | 140-reverse-inventory-and-lint | FX-30 | DV-066 |
| C-118 | SS | `reverse` | env | B-1619…B-1620 | 2 | 1 | `translated` | 108-reverse | FX-30 | DV-027; DV-036 |
| C-118.a | SS | `reverse` | env | B-1618 | 1 | 0 | `translated` | 140-reverse-inventory-and-lint | FX-30 | DV-027; DV-036 |
| C-119 | SS | `reverse` | exit-code | B-1623, B-1625…B-1627 | 4 | 3 | `ported` | 108-reverse | FX-30 | — |
| C-119.a | SS | `reverse` | exit-code | B-1621…B-1622, B-1624 | 3 | 3 | `ported` | 140-reverse-inventory-and-lint | FX-30 | — |
| C-120.a | SS | `reverse` | stop-reason | B-1628…B-1630, B-1632…B-1635 | 7 | 5 | `ported` | 108-reverse | FX-30 | — |
| C-120.c | SS | `reverse` | stop-reason | B-1636…B-1697 | 62 | 8 | `ported` | 140-reverse-inventory-and-lint | FX-30 | — |
| C-120.b | SS | `reverse` | stop-reason | B-1631 | 1 | 1 | `translated` | 108-reverse | FX-30 | DV-036 |
| C-121 | SS | `reverse` | file | B-1698…B-1708 | 11 | 1 | `translated` | 108-reverse | FX-30 | DV-006 |
| C-122 | SS | `reverse` | output-line | B-1709…B-1733, B-1737…B-1740 | 29 | 9 | `ported` | 108-reverse | FX-30 | — |
| C-122.a | SS | `reverse` | output-line | B-1734…B-1736 | 3 | 0 | `ported` | 140-reverse-inventory-and-lint | FX-30 | — |
| C-123.a | SS | `reverse` | behaviour | B-1764…B-1822, B-1855…B-1862 | 67 | 4 | `ported` | 108-reverse | FX-30 | — |
| C-123.c | SS | `reverse` | behaviour | B-1741…B-1762, B-1823…B-1854 | 54 | 6 | `ported` | 140-reverse-inventory-and-lint | FX-30 | — |
| C-123.b | SS | `reverse` | behaviour | B-1763 | 1 | 0 | `superseded-by DV-036` | 108-reverse | — | DV-036 |
| C-124 | SS | `reverse_inventory` | cli-command | B-1863 | 1 | 0 | `translated` | 140-reverse-inventory-and-lint | FX-30 | DV-066 |
| C-125 | SS | `reverse_inventory` | cli-flag | B-1864…B-1867 | 4 | 0 | `translated` | 140-reverse-inventory-and-lint | FX-30 | DV-066 |
| C-126 | SS | `reverse_inventory` | env | B-1868…B-1870 | 3 | 0 | `translated` | 140-reverse-inventory-and-lint | FX-30 | DV-027 |
| C-127 | SS | `reverse_inventory` | exit-code | B-1871…B-1872 | 2 | 0 | `translated` | 140-reverse-inventory-and-lint | FX-30 | LR-6 |
| C-128 | SS | `reverse_inventory` | stop-reason | B-1873…B-1874 | 2 | 0 | `ported` | 140-reverse-inventory-and-lint | FX-30 | — |
| C-129 | SS | `reverse_inventory` | file | B-1875…B-1901 | 27 | 0 | `translated` | 140-reverse-inventory-and-lint | FX-30 | DV-006 |
| C-130 | SS | `reverse_inventory` | output-line | B-1902 | 1 | 0 | `ported` | 140-reverse-inventory-and-lint | FX-30 | — |
| C-131.a | SS | `reverse_inventory` | behaviour | B-1903…B-1909, B-1911…B-1913, B-1915…B-1966 | 62 | 0 | `ported` | 140-reverse-inventory-and-lint | FX-30 | — |
| C-131.b | SS | `reverse_inventory` | behaviour | B-1910 | 1 | 0 | `translated` | 140-reverse-inventory-and-lint | FX-30 | DV-036 |
| C-131.c | SS | `reverse_inventory` | behaviour | B-1914 | 1 | 0 | `superseded-by DV-036` | 140-reverse-inventory-and-lint | — | DV-036 |
| C-132 | SS | `README` | file | B-1967 | 1 | 1 | `ported` | 140-reverse-inventory-and-lint | FX-30 | — |
| C-133 | SS | `checklist-template` | file | B-1968 | 1 | 0 | `ported` | 140-reverse-inventory-and-lint | FX-30 | — |
| C-134 | SS | `constitution-template` | file | B-1969…B-1970 | 2 | 0 | `ported` | 140-reverse-inventory-and-lint | FX-30 | — |
| C-135 | SS | `plan-template` | file | B-1971 | 1 | 0 | `ported` | 140-reverse-inventory-and-lint | FX-30 | — |
| C-136 | SS | `spec-template` | file | B-1972…B-1975 | 4 | 0 | `ported` | 140-reverse-inventory-and-lint | FX-30 | — |
| C-137 | SS | `tasks-template` | file | B-1976…B-1977 | 2 | 0 | `ported` | 140-reverse-inventory-and-lint | FX-30 | — |
| C-138 | SS | `specstride_spec` | cli-command | B-1978…B-1988 | 11 | 8 | `translated` | 104-spec-input | FX-09, FX-10 | DV-066 |
| C-139 | SS | `specstride_spec` | cli-flag | B-1989…B-1994 | 6 | 1 | `translated` | 104-spec-input | FX-09, FX-10 | DV-066 |
| C-140.a | SS | `specstride_spec` | env | B-1995 | 1 | 0 | `superseded-by DV-036` | 110-config-and-terms | — | DV-036 |
| C-140.b | SS | `specstride_spec` | env | B-1996…B-1997 | 2 | 1 | `translated` | 104-spec-input | FX-09, FX-10 | DV-027 |
| C-141.a | SS | `specstride_spec` | exit-code | B-1998, B-2000…B-2001 | 3 | 0 | `translated` | 104-spec-input | FX-09, FX-10 | LR-6 |
| C-141.b | SS | `specstride_spec` | exit-code | B-1999 | 1 | 1 | `superseded-by DV-073` | 104-spec-input | — | DV-073 |
| C-142 | SS | `specstride_spec` | stop-reason | B-2002…B-2009 | 8 | 0 | `ported` | 104-spec-input | FX-09, FX-10 | — |
| C-143 | SS | `specstride_spec` | file | B-2010 | 1 | 0 | `translated` | 104-spec-input | FX-09, FX-10 | DV-006 |
| C-144 | SS | `specstride_spec` | output-line | B-2011…B-2016 | 6 | 0 | `ported` | 104-spec-input | FX-09, FX-10 | — |
| C-145 | SS | `specstride_spec` | behaviour | B-2017…B-2058 | 42 | 8 | `ported` | 104-spec-input | FX-09, FX-10 | — |
| C-146 | SS | `agent_stream` | cli-command | B-2059 | 1 | 0 | `translated` | 126-stream-seam-and-invocation | FX-26 | DV-066 |
| C-147 | SS | `agent_stream` | cli-flag | B-2060…B-2076 | 17 | 0 | `translated` | 126-stream-seam-and-invocation | FX-26 | DV-066 |
| C-148 | SS | `agent_stream` | env | B-2077…B-2081 | 5 | 0 | `translated` | 126-stream-seam-and-invocation | FX-26 | DV-027 |
| C-149 | SS | `agent_stream` | event | B-2082…B-2091 | 10 | 0 | `translated` | 126-stream-seam-and-invocation | FX-26 | DV-007 |
| C-150 | SS | `agent_stream` | exit-code | B-2092…B-2093 | 2 | 0 | `translated` | 126-stream-seam-and-invocation | FX-26 | LR-6 |
| C-151 | SS | `agent_stream` | stop-reason | B-2094…B-2097 | 4 | 0 | `ported` | 126-stream-seam-and-invocation | FX-26 | — |
| C-152 | SS | `agent_stream` | file | B-2098…B-2099 | 2 | 0 | `translated` | 126-stream-seam-and-invocation | FX-26 | DV-006 |
| C-153 | SS | `agent_stream` | output-line | B-2100…B-2109 | 10 | 0 | `ported` | 126-stream-seam-and-invocation | FX-26 | — |
| C-154.a | SS | `agent_stream` | behaviour | B-2110 | 1 | 0 | `superseded-by DV-036` | 110-config-and-terms | — | DV-036 |
| C-154.b | SS | `agent_stream` | behaviour | B-2111, B-2113…B-2119, B-2121…B-2144 | 32 | 0 | `ported` | 126-stream-seam-and-invocation | FX-26 | — |
| C-154.d | SS | `agent_stream` | behaviour | B-2112 | 1 | 0 | `translated` | 126-stream-seam-and-invocation | FX-26 | DV-115 |
| C-154.c | SS | `agent_stream` | behaviour | B-2120 | 1 | 0 | `ported` | 138-adapter-prime | FX-26 | — |
| C-155 | SS | `finalize_invocation` | cli-command | B-2145 | 1 | 0 | `translated` | 126-stream-seam-and-invocation | FX-26 | DV-066 |
| C-156 | SS | `finalize_invocation` | cli-flag | B-2146…B-2148 | 3 | 0 | `translated` | 126-stream-seam-and-invocation | FX-26 | DV-066 |
| C-157 | SS | `finalize_invocation` | event | B-2149 | 1 | 0 | `translated` | 126-stream-seam-and-invocation | FX-26 | DV-007 |
| C-158 | SS | `finalize_invocation` | exit-code | B-2150 | 1 | 0 | `translated` | 126-stream-seam-and-invocation | FX-26 | LR-6 |
| C-159 | SS | `finalize_invocation` | stop-reason | B-2151…B-2153 | 3 | 0 | `ported` | 126-stream-seam-and-invocation | FX-26 | — |
| C-160 | SS | `finalize_invocation` | file | B-2154…B-2158 | 5 | 0 | `translated` | 126-stream-seam-and-invocation | FX-26 | DV-006 |
| C-161 | SS | `finalize_invocation` | output-line | B-2159 | 1 | 0 | `ported` | 126-stream-seam-and-invocation | FX-26 | — |
| C-162 | SS | `finalize_invocation` | behaviour | B-2160…B-2164 | 5 | 0 | `ported` | 126-stream-seam-and-invocation | FX-26 | — |
| C-163 | SS | `invocation_result` | event | B-2165 | 1 | 0 | `translated` | 126-stream-seam-and-invocation | FX-26 | DV-007 |
| C-164 | SS | `invocation_result` | stop-reason | B-2166…B-2178 | 13 | 0 | `ported` | 126-stream-seam-and-invocation | FX-26 | — |
| C-165 | SS | `invocation_result` | file | B-2179…B-2183 | 5 | 0 | `translated` | 126-stream-seam-and-invocation | FX-26 | DV-006 |
| C-166 | SS | `invocation_result` | behaviour | B-2184…B-2202 | 19 | 0 | `ported` | 126-stream-seam-and-invocation | FX-26 | — |
| C-167 | SS | `observability_policy` | behaviour | B-2203…B-2223 | 21 | 0 | `ported` | 111-event-schema-and-projection | FX-01, FX-26 | — |
| C-168 | SS | `prime_stream` | event | B-2224…B-2240 | 17 | 0 | `translated` | 138-adapter-prime | FX-26 | DV-007 |
| C-169 | SS | `prime_stream` | stop-reason | B-2241…B-2243 | 3 | 0 | `ported` | 138-adapter-prime | FX-26 | — |
| C-170 | SS | `prime_stream` | output-line | B-2244…B-2248 | 5 | 0 | `ported` | 138-adapter-prime | FX-26 | — |
| C-171 | SS | `prime_stream` | behaviour | B-2249…B-2264 | 16 | 0 | `ported` | 138-adapter-prime | FX-26 | — |
| C-172 | SS | `ralph_loki_ship` | cli-command | B-2265…B-2266 | 2 | 0 | `translated` | 128-telemetry-export | FX-31 | DV-058; DV-066 |
| C-173 | SS | `ralph_loki_ship` | cli-flag | B-2267…B-2274 | 8 | 1 | `translated` | 128-telemetry-export | FX-31 | DV-058; DV-066 |
| C-174 | SS | `ralph_loki_ship` | env | B-2275…B-2277 | 3 | 0 | `translated` | 128-telemetry-export | FX-31 | DV-027; DV-058 |
| C-175 | SS | `ralph_loki_ship` | event | B-2278…B-2279 | 2 | 0 | `translated` | 128-telemetry-export | FX-31 | DV-007; DV-058 |
| C-176 | SS | `ralph_loki_ship` | exit-code | B-2280 | 1 | 0 | `translated` | 128-telemetry-export | FX-31 | DV-058; LR-6 |
| C-177 | SS | `ralph_loki_ship` | stop-reason | B-2281…B-2282 | 2 | 0 | `translated` | 128-telemetry-export | FX-31 | DV-058 |
| C-178 | SS | `ralph_loki_ship` | output-line | B-2283…B-2286 | 4 | 0 | `translated` | 128-telemetry-export | FX-31 | DV-058 |
| C-179 | SS | `ralph_loki_ship` | behaviour | B-2287…B-2299 | 13 | 0 | `translated` | 128-telemetry-export | FX-31 | DV-058 |
| C-180 | SS | `ralph_otel_ship` | cli-command | B-2300…B-2301 | 2 | 0 | `translated` | 128-telemetry-export | FX-31 | DV-058; DV-066 |
| C-181 | SS | `ralph_otel_ship` | cli-flag | B-2302…B-2309 | 8 | 1 | `translated` | 128-telemetry-export | FX-31 | DV-058; DV-066 |
| C-182 | SS | `ralph_otel_ship` | env | B-2310…B-2312 | 3 | 0 | `translated` | 128-telemetry-export | FX-31 | DV-027; DV-058 |
| C-183 | SS | `ralph_otel_ship` | event | B-2313 | 1 | 0 | `translated` | 128-telemetry-export | FX-31 | DV-007; DV-058 |
| C-184 | SS | `ralph_otel_ship` | exit-code | B-2314 | 1 | 0 | `translated` | 128-telemetry-export | FX-31 | DV-058; LR-6 |
| C-185 | SS | `ralph_otel_ship` | output-line | B-2315…B-2318 | 4 | 0 | `translated` | 128-telemetry-export | FX-31 | DV-058 |
| C-186 | SS | `ralph_otel_ship` | behaviour | B-2319…B-2335 | 17 | 0 | `translated` | 128-telemetry-export | FX-31 | DV-058 |
| C-187 | SS | `ralph_otel_spans` | env | B-2336…B-2339 | 4 | 0 | `translated` | 128-telemetry-export | FX-31 | DV-027; DV-058 |
| C-188 | SS | `ralph_otel_spans` | event | B-2340…B-2362 | 23 | 0 | `translated` | 128-telemetry-export | FX-31 | DV-007; DV-058 |
| C-189 | SS | `ralph_otel_spans` | file | B-2363 | 1 | 0 | `translated` | 128-telemetry-export | FX-31 | DV-006; DV-058 |
| C-190 | SS | `ralph_otel_spans` | behaviour | B-2364…B-2375 | 12 | 0 | `translated` | 128-telemetry-export | FX-31 | DV-058 |
| C-191 | SS | `stream_seam` | event | B-2376…B-2379 | 4 | 0 | `translated` | 126-stream-seam-and-invocation | FX-26 | DV-007 |
| C-192 | SS | `stream_seam` | stop-reason | B-2380 | 1 | 0 | `ported` | 126-stream-seam-and-invocation | FX-26 | — |
| C-193 | SS | `stream_seam` | output-line | B-2381…B-2382 | 2 | 0 | `ported` | 126-stream-seam-and-invocation | FX-26 | — |
| C-194 | SS | `stream_seam` | behaviour | B-2383…B-2404 | 22 | 0 | `ported` | 126-stream-seam-and-invocation | FX-26 | — |
| C-195 | SS | `telemetry_delivery` | cli-command | B-2405…B-2406 | 2 | 0 | `translated` | 128-telemetry-export | FX-31 | DV-058; DV-066 |
| C-196 | SS | `telemetry_delivery` | cli-flag | B-2407…B-2408 | 2 | 0 | `translated` | 128-telemetry-export | FX-31 | DV-058; DV-066 |
| C-197 | SS | `telemetry_delivery` | event | B-2409 | 1 | 0 | `translated` | 128-telemetry-export | FX-31 | DV-007; DV-058 |
| C-198 | SS | `telemetry_delivery` | exit-code | B-2410…B-2412 | 3 | 0 | `translated` | 128-telemetry-export | FX-31 | DV-058; LR-6 |
| C-199 | SS | `telemetry_delivery` | output-line | B-2413…B-2414 | 2 | 0 | `translated` | 128-telemetry-export | FX-31 | DV-058 |
| C-200 | SS | `telemetry_delivery` | behaviour | B-2415…B-2424 | 10 | 0 | `translated` | 128-telemetry-export | FX-31 | DV-058 |
| C-201 | SS | `ralph-loops` | behaviour | B-2434…B-2441 | 8 | 0 | `translated` | 128-telemetry-export | CT-128-1 | DV-058 |
| C-202 | SS | `docker-compose` | env | B-2442…B-2446 | 5 | 0 | `translated` | 128-telemetry-export | CT-128-2 | DV-036; DV-058 |
| C-203 | SS | `docker-compose` | behaviour | B-2447…B-2449 | 3 | 0 | `translated` | 128-telemetry-export | CT-128-3 | DV-036; DV-058 |
| C-204 | SS | `loki-config` | behaviour | B-2450 | 1 | 0 | `translated` | 128-telemetry-export | CT-128-4 | DV-058 |
| C-205 | SS | `collector-config` | behaviour | B-2451…B-2458 | 8 | 0 | `translated` | 128-telemetry-export | CT-128-5 | DV-058 |
| C-206 | SS | `prometheus` | behaviour | B-2459, B-2462 | 2 | 0 | `translated` | 128-telemetry-export | CT-128-6 | DV-058 |
| C-207 | SS | `dashboards` | behaviour | B-2460 | 1 | 0 | `translated` | 128-telemetry-export | CT-128-7 | DV-058 |
| C-208 | SS | `loki` | behaviour | B-2461 | 1 | 0 | `translated` | 128-telemetry-export | CT-128-8 | DV-058 |
| C-209 | MOL | `bootstrap_contract` | cli-command | B-2467 | 1 | 1 | `translated` | 107-launch-contract | FX-32 | DV-066 |
| C-210.a | MOL | `bootstrap_contract` | cli-flag | B-2468…B-2469, B-2472 | 3 | 1 | `translated` | 107-launch-contract | FX-32 | DV-066 |
| C-210.b | MOL | `bootstrap_contract` | cli-flag | B-2470…B-2471 | 2 | 2 | `translated` | 106-learning | FX-29 | DV-066 |
| C-211 | MOL | `bootstrap_contract` | exit-code | B-2473 | 1 | 0 | `ported` | 107-launch-contract | FX-32 | — |
| C-212 | MOL | `bootstrap_contract` | output-line | B-2474 | 1 | 0 | `ported` | 107-launch-contract | FX-33 | — |
| C-213.a | MOL | `bootstrap_contract` | behaviour | B-2475…B-2476 | 2 | 0 | `merged-with 028 FR-029` | 104-spec-input | FX-32 | DV-060 |
| C-213.b | MOL | `bootstrap_contract` | behaviour | B-2477 | 1 | 1 | `ported` | 104-spec-input | FX-09, FX-10 | — |
| C-213.c | MOL | `bootstrap_contract` | behaviour | B-2478…B-2487, B-2490 | 11 | 7 | `ported` | 107-launch-contract | FX-32, FX-33 | — |
| C-213.d | MOL | `bootstrap_contract` | behaviour | B-2488 | 1 | 1 | `translated` | 107-launch-contract | FX-32 | DV-066 |
| C-213.e | MOL | `bootstrap_contract` | behaviour | B-2489 | 1 | 0 | `dropped` | none | — | DV-061 |
| C-213.f | MOL | `bootstrap_contract` | behaviour | B-2491 | 1 | 1 | `ported` | 106-learning | FX-29 | — |
| C-214.a | MOL | `contract_lib` | env | B-2492 | 1 | 1 | `dropped` | none | — | DV-061 |
| C-214.b | MOL | `contract_lib` | env | B-2493 | 1 | 0 | `superseded-by DV-038` | 106-learning | — | DV-038 |
| C-214.c | MOL | `contract_lib` | env | B-2494…B-2495 | 2 | 1 | `translated` | 106-learning | FX-29 | DV-027 |
| C-215 | MOL | `contract_lib` | stop-reason | B-2496 | 1 | 0 | `ported` | 123-pipeline-runtime-and-supervisor | FX-35, FX-36 | DV-005 |
| C-216 | MOL | `contract_lib` | file | B-2497 | 1 | 0 | `translated` | 107-launch-contract | FX-33 | DV-006 |
| C-217 | MOL | `contract_lib` | output-line | B-2498 | 1 | 1 | `dropped` | none | — | DV-061 |
| C-218.a | MOL | `contract_lib` | behaviour | B-2499…B-2510, B-2514, B-2522…B-2531, B-2533…B-2542 | 33 | 12 | `ported` | 107-launch-contract | FX-32, FX-33 | — |
| C-218.b | MOL | `contract_lib` | behaviour | B-2511 | 1 | 1 | `ported` | 104-spec-input | FX-09, FX-10 | — |
| C-218.c | MOL | `contract_lib` | behaviour | B-2512…B-2513, B-2532 | 3 | 2 | `ported` | 123-pipeline-runtime-and-supervisor | FX-35, FX-36 | — |
| C-218.d | MOL | `contract_lib` | behaviour | B-2515…B-2517 | 3 | 0 | `ported` | 106-learning | FX-29 | — |
| C-218.e | MOL | `contract_lib` | behaviour | B-2518 | 1 | 1 | `translated` | 123-pipeline-runtime-and-supervisor | FX-35, FX-36 | DV-055 |
| C-218.f | MOL | `contract_lib` | behaviour | B-2519, B-2521 | 2 | 1 | `translated` | 107-launch-contract | FX-33 | DV-036; DV-059 |
| C-218.g | MOL | `contract_lib` | behaviour | B-2520 | 1 | 1 | `superseded-by DV-038` | 107-launch-contract | — | DV-038 |
| C-219 | MOL | `render_launcher` | cli-command | B-2543 | 1 | 1 | `translated` | 107-launch-contract | FX-34 | DV-066 |
| C-220 | MOL | `render_launcher` | cli-flag | B-2544 | 1 | 1 | `translated` | 107-launch-contract | FX-34 | DV-066 |
| C-221 | MOL | `render_launcher` | exit-code | B-2545…B-2546 | 2 | 2 | `ported` | 107-launch-contract | FX-34 | — |
| C-222 | MOL | `render_launcher` | file | B-2547…B-2548 | 2 | 1 | `translated` | 107-launch-contract | FX-33, FX-34 | DV-006; DV-008 |
| C-223 | MOL | `render_launcher` | output-line | B-2549…B-2551 | 3 | 2 | `translated` | 107-launch-contract | FX-34 | DV-008; DV-054 |
| C-224 | MOL | `render_launcher` | behaviour | B-2552…B-2554 | 3 | 2 | `translated` | 107-launch-contract | FX-34 | DV-008; DV-054 |
| C-225 | MOL | `runtime` | cli-flag | B-2555…B-2560 | 6 | 2 | `ported` | 123-pipeline-runtime-and-supervisor | FX-35, FX-36 | — |
| C-226.a | MOL | `runtime` | env | B-2561 | 1 | 1 | `translated` | 106-learning | FX-29 | DV-026; DV-027; DV-038 |
| C-226.b | MOL | `runtime` | env | B-2562…B-2563 | 2 | 0 | `translated` | 123-pipeline-runtime-and-supervisor | FX-35, FX-36 | DV-027 |
| C-227 | MOL | `runtime` | exit-code | B-2564…B-2571 | 8 | 7 | `ported` | 123-pipeline-runtime-and-supervisor | FX-35, FX-36 | — |
| C-228 | MOL | `runtime` | stop-reason | B-2572…B-2585 | 14 | 2 | `ported` | 123-pipeline-runtime-and-supervisor | FX-35, FX-36 | — |
| C-229.a | MOL | `runtime` | file | B-2586…B-2587 | 2 | 1 | `translated` | 123-pipeline-runtime-and-supervisor | FX-35, FX-36 | DV-006 |
| C-229.b | MOL | `runtime` | file | B-2588 | 1 | 1 | `translated` | 122-detached-runtime | FX-11 | DV-006; DV-022 |
| C-230.a | MOL | `runtime` | output-line | B-2589…B-2602, B-2604, B-2609…B-2610 | 17 | 2 | `ported` | 123-pipeline-runtime-and-supervisor | FX-35, FX-36 | — |
| C-230.b | MOL | `runtime` | output-line | B-2603, B-2605…B-2608, B-2611…B-2612 | 7 | 6 | `translated` | 123-pipeline-runtime-and-supervisor | FX-35, FX-36 | DV-007; DV-033; DV-070 |
| C-231.a | MOL | `runtime` | behaviour | B-2613, B-2615…B-2628 | 15 | 7 | `ported` | 123-pipeline-runtime-and-supervisor | FX-35, FX-36 | DV-026; DV-028 |
| C-231.b | MOL | `runtime` | behaviour | B-2614 | 1 | 0 | `translated` | 123-pipeline-runtime-and-supervisor | FX-35, FX-36 | DV-036 |
| C-232 | MOL | `validate_contract` | cli-command | B-2629 | 1 | 1 | `translated` | 107-launch-contract | FX-33 | DV-066 |
| C-233 | MOL | `validate_contract` | cli-flag | B-2630…B-2632 | 3 | 1 | `translated` | 107-launch-contract | FX-32, FX-33 | DV-066 |
| C-234.a | MOL | `validate_contract` | exit-code | B-2633, B-2635…B-2636 | 3 | 1 | `ported` | 107-launch-contract | FX-32, FX-33 | — |
| C-234.b | MOL | `validate_contract` | exit-code | B-2634 | 1 | 1 | `ported` | 104-spec-input | FX-09, FX-10 | — |
| C-235 | MOL | `validate_contract` | file | B-2637 | 1 | 0 | `translated` | 107-launch-contract | FX-33 | DV-006 |
| C-236.a | MOL | `validate_contract` | output-line | B-2638…B-2639, B-2641 | 3 | 2 | `ported` | 107-launch-contract | FX-32, FX-33 | — |
| C-236.b | MOL | `validate_contract` | output-line | B-2640 | 1 | 1 | `superseded-by DV-038` | 107-launch-contract | — | DV-038 |
| C-237 | MOL | `onboard-skill` | cli-command | B-2642 | 1 | 1 | `superseded-by DV-056` | 113-host-claude-code | — | DV-056 |
| C-238 | MOL | `onboard-skill` | cli-flag | B-2643…B-2645 | 3 | 3 | `superseded-by DV-056` | 113-host-claude-code | — | DV-056 |
| C-239 | MOL | `onboard-skill` | env | B-2646 | 1 | 0 | `superseded-by DV-056` | 113-host-claude-code | — | DV-056 |
| C-240 | MOL | `onboard-skill` | exit-code | B-2647…B-2653 | 7 | 6 | `superseded-by DV-056` | 113-host-claude-code | — | DV-056 |
| C-241 | MOL | `onboard-skill` | file | B-2654 | 1 | 0 | `superseded-by DV-056` | 113-host-claude-code | — | DV-056 |
| C-242 | MOL | `onboard-skill` | output-line | B-2655…B-2657 | 3 | 0 | `superseded-by DV-056` | 113-host-claude-code | — | DV-056 |
| C-243 | MOL | `onboard-skill` | behaviour | B-2658…B-2660 | 3 | 0 | `superseded-by DV-056` | 113-host-claude-code | — | DV-056 |
| C-244 | MOL | `SKILL` | file | B-2661…B-2662 | 2 | 0 | `translated` | 113-host-claude-code | CT-113-1 | DV-006 |
| C-245.a | MOL | `SKILL` | behaviour | B-2663…B-2664, B-2666…B-2668 | 5 | 0 | `translated` | 113-host-claude-code | CT-113-2 | DV-009; DV-033 |
| C-245.b | MOL | `SKILL` | behaviour | B-2665 | 1 | 1 | `superseded-by DV-009` | 113-host-claude-code | — | DV-009 |
| C-246.a | MOL | `supervise` | cli-command | B-2669, B-2671…B-2677 | 8 | 3 | `translated` | 123-pipeline-runtime-and-supervisor | FX-35, FX-36 | DV-009; DV-066 |
| C-246.b | MOL | `supervise` | cli-command | B-2670, B-2678 | 2 | 2 | `translated` | 106-learning | FX-29 | DV-066 |
| C-247 | MOL | `supervise` | cli-flag | B-2679…B-2684 | 6 | 0 | `translated` | 123-pipeline-runtime-and-supervisor | FX-35, FX-36 | DV-066 |
| C-248 | MOL | `supervise` | exit-code | B-2685…B-2688 | 4 | 0 | `ported` | 123-pipeline-runtime-and-supervisor | FX-35, FX-36 | — |
| C-249.a | MOL | `supervise` | output-line | B-2689…B-2690 | 2 | 0 | `translated` | 123-pipeline-runtime-and-supervisor | FX-35, FX-36 | DV-007; DV-033 |
| C-249.b | MOL | `supervise` | output-line | B-2691…B-2693 | 3 | 2 | `translated` | 106-learning | FX-29 | DV-007; DV-033 |
| C-250 | MOL | `supervisor_lib` | env | B-2694 | 1 | 0 | `translated` | 123-pipeline-runtime-and-supervisor | FX-35, FX-36 | DV-027 |
| C-251 | MOL | `supervisor_lib` | exit-code | B-2695 | 1 | 0 | `ported` | 123-pipeline-runtime-and-supervisor | FX-35, FX-36 | — |
| C-252 | MOL | `supervisor_lib` | stop-reason | B-2696…B-2731 | 36 | 24 | `ported` | 123-pipeline-runtime-and-supervisor | FX-35, FX-36 | — |
| C-253.a | MOL | `supervisor_lib` | file | B-2732…B-2734 | 3 | 2 | `translated` | 123-pipeline-runtime-and-supervisor | FX-35, FX-36 | DV-006 |
| C-253.b | MOL | `supervisor_lib` | file | B-2735 | 1 | 1 | `translated` | 106-learning | FX-29 | DV-006 |
| C-254.a | MOL | `supervisor_lib` | output-line | B-2736, B-2738…B-2748 | 12 | 6 | `translated` | 123-pipeline-runtime-and-supervisor | FX-35, FX-36 | DV-007; DV-033; DV-070 |
| C-254.b | MOL | `supervisor_lib` | output-line | B-2737 | 1 | 0 | `translated` | 106-learning | FX-29 | DV-007; DV-033 |
| C-255.a | MOL | `supervisor_lib` | behaviour | B-2749…B-2750, B-2759, B-2761…B-2763, B-2766…B-2768, B-2770…B-2780 | 20 | 4 | `ported` | 123-pipeline-runtime-and-supervisor | FX-35, FX-36 | DV-028; DV-070 |
| C-255.b | MOL | `supervisor_lib` | behaviour | B-2751…B-2756, B-2765 | 7 | 5 | `translated` | 123-pipeline-runtime-and-supervisor | FX-35, FX-36 | DV-009; DV-055 |
| C-255.c | MOL | `supervisor_lib` | behaviour | B-2757 | 1 | 1 | `superseded-by DV-009` | 123-pipeline-runtime-and-supervisor | — | DV-009 |
| C-255.d | MOL | `supervisor_lib` | behaviour | B-2758, B-2781, B-2783 | 3 | 3 | `ported` | 106-learning | FX-29 | — |
| C-255.e | MOL | `supervisor_lib` | behaviour | B-2760 | 1 | 0 | `translated` | 122-detached-runtime | FX-11 | DV-022 |
| C-255.f | MOL | `supervisor_lib` | behaviour | B-2764, B-2769 | 2 | 1 | `ported` | 122-detached-runtime | FX-11 | — |
| C-255.g | MOL | `supervisor_lib` | behaviour | B-2782 | 1 | 0 | `translated` | 106-learning | FX-29 | DV-036 |

## 4. Summaries

### 4.1 Counts per disposition

| Disposition | FRs | SCs | Clusters with one disposition | Cluster rows | B-items |
|---|---|---|---|---|---|
| `ported` | 28 | 9 | 65 | 199 | 1631 |
| `merged-with` | 29 | 5 | 0 | 1 | 2 |
| `translated` | 20 | 2 | 132 | 262 | 1039 |
| `superseded-by` | 8 | 3 | 14 | 58 | 102 |
| `deferred` | 24 | 3 | 0 | 0 | 0 |
| `dropped` | 1 | 1 | 5 | 7 | 11 |
| Clusters split over several dispositions | — | — | 39 | — | — |
| Total | 110 | 23 | 255 | 527 | 2785 |

### 4.2 Load per destination feature

"Parity items" are the items that are `ported`, `merged-with` or `translated`. "Estimate" is parity items divided by
6.7, the measured grain of items per requirement (R15 F-08); it excludes every requirement that comes from research and
not from as-is behaviour. A feature is flagged above about 270 items, which is 40 requirements.

| Destination | FRs | SCs | Clusters | B-items | Parity items | Estimate | Flag |
|---|---|---|---|---|---|---|---|
| 100-specstride | 2 | 6 | 8 | 19 | 8 | 1 |  |
| 141-parity-oracle | 0 | 1 | 0 | 0 | 0 | 0 |  |
| 101-gate-and-verdict | 20 | 7 | 17 | 157 | 157 | 23 |  |
| 149-attempt-planner-and-seams | 0 | 0 | 0 | 0 | 0 | 0 |  |
| 117-critic-grounding-and-prompt | 1 | 0 | 8 | 102 | 102 | 15 |  |
| 102-run-control | 4 | 0 | 14 | 56 | 54 | 8 |  |
| 119-front-door-and-presenter | 7 | 0 | 14 | 101 | 97 | 14 |  |
| 145-presenter | 0 | 0 | 22 | 139 | 139 | 21 |  |
| 103-proposer-pass | 1 | 0 | 20 | 106 | 106 | 16 |  |
| 118-pass-supervision-and-jobs | 2 | 0 | 27 | 181 | 181 | 27 |  |
| 104-spec-input | 6 | 0 | 20 | 117 | 116 | 17 |  |
| 105-verification | 3 | 0 | 26 | 159 | 159 | 24 |  |
| 148-check-runner | 0 | 0 | 1 | 4 | 4 | 1 |  |
| 106-learning | 5 | 0 | 29 | 197 | 196 | 29 |  |
| 107-launch-contract | 9 | 0 | 18 | 79 | 77 | 11 |  |
| 123-pipeline-runtime-and-supervisor | 10 | 3 | 19 | 178 | 177 | 26 |  |
| 122-detached-runtime | 1 | 0 | 9 | 16 | 13 | 2 |  |
| 108-reverse | 2 | 1 | 14 | 159 | 158 | 24 |  |
| 140-reverse-inventory-and-lint | 1 | 0 | 20 | 246 | 245 | 37 |  |
| 109-harness-seam | 2 | 1 | 21 | 94 | 75 | 11 |  |
| 124-harness-discovery-and-roles | 0 | 0 | 10 | 13 | 7 | 1 |  |
| 146-harness-discovery | 0 | 0 | 0 | 0 | 0 | 0 |  |
| 125-adapter-claude | 0 | 0 | 5 | 16 | 16 | 2 |  |
| 126-stream-seam-and-invocation | 0 | 0 | 32 | 212 | 209 | 31 |  |
| 110-config-and-terms | 1 | 0 | 14 | 25 | 0 | 0 |  |
| 147-terms-gate | 0 | 0 | 0 | 0 | 0 | 0 |  |
| 127-quota-budgets-and-pause | 2 | 0 | 5 | 6 | 6 | 1 |  |
| 111-event-schema-and-projection | 0 | 0 | 2 | 22 | 22 | 3 |  |
| 144-compatibility-projection | 1 | 0 | 7 | 16 | 16 | 2 |  |
| 128-telemetry-export | 1 | 0 | 45 | 191 | 189 | 28 |  |
| 129-run-view-and-status | 1 | 0 | 0 | 0 | 0 | 0 |  |
| 112-doctor | 0 | 0 | 0 | 0 | 0 | 0 |  |
| 113-host-claude-code | 2 | 0 | 9 | 27 | 7 | 1 |  |
| 115-micro-loop-layer | 0 | 0 | 0 | 0 | 0 | 0 |  |
| 116-check-integrity-and-unit-evidence | 0 | 0 | 0 | 0 | 0 | 0 |  |
| 130-adapter-dsh | 0 | 0 | 14 | 66 | 66 | 10 |  |
| 131-adapter-codex | 0 | 0 | 4 | 8 | 8 | 1 |  |
| 134-adapter-pi | 0 | 0 | 0 | 0 | 0 | 0 |  |
| 138-adapter-prime | 0 | 0 | 13 | 62 | 62 | 9 |  |
| 142-parallel-units | 1 | 0 | 0 | 0 | 0 | 0 |  |
| 143-parallel-engine-services | 0 | 0 | 0 | 0 | 0 | 0 |  |
| 120-host-dsh | 0 | 0 | 0 | 0 | 0 | 0 | |
| 121-kanban-ui | 1 | 1 | 0 | 0 | 0 | 0 |  |
| roadmap | 23 | 2 | 0 | 0 | 0 | 0 |  |
| none | 1 | 1 | 7 | 11 | 0 | 0 |  |
| Total | 110 | 23 | — | 2785 | 2672 | — | |

Flagged: 108-reverse with 403 parity items, about 60 requirements.
`architecture.md` section 14 keeps 108 as one feature with two requirement groups and splits it only if
`speckit-specify` yields more than about 45 requirements. This count says the split is likely.

Heaviest five by B-items: 108-reverse 405; 119-front-door-and-presenter 240; 126-stream-seam-and-invocation 212; 106-learning 197; 128-telemetry-export 191.

The five features the owner added to Wave 1: 130-adapter-dsh 66 items, 66 of them parity items; 131-adapter-codex 8 items, 8 of them parity items; 134-adapter-pi 0 items, 0 of them parity items; 138-adapter-prime 62 items, 62 of them parity items; 142-parallel-units 0 items, 0 of them parity items.
None is near the flag. 142-parallel-units also receives 002 FR-048.

Features that receive no as-is item: 141-parity-oracle, 129-run-view-and-status, 112-doctor, 115-micro-loop-layer,
134-adapter-pi, 142-parallel-units. Their requirements come from research. 141 receives 011 SC-008. 129 receives
002 FR-017, which is superseded. 142 receives 002 FR-048. 134 receives nothing: pi has no adapter in any of the three systems.

### 4.3 Approved as `superseded-by` or `dropped`

The owner approved all of them on 2026-09-29 (ruling K8): 2 dropped and 11 superseded requirements and success criteria,
and 113 superseded or dropped behaviour items, each with its register row or written justification.

Requirements and success criteria:

| Origin | Disposition | Register row | Destination |
|---|---|---|---|
| 028 FR-030 | `superseded-by DV-057` | DV-057 | 100-specstride |
| 028 SC-007 | `superseded-by DV-002` | DV-002 | 109-harness-seam |
| 028 SC-008 | `superseded-by DV-057` | DV-057 | 100-specstride |
| 011 FR-017 | `superseded-by DV-009` | DV-009 | 113-host-claude-code |
| 011 FR-025 | `superseded-by DV-056` | DV-056 | 113-host-claude-code |
| 011 FR-026 | `dropped` | DV-061 | none |
| 011 FR-027 | `superseded-by DV-038` | DV-038 | 107-launch-contract |
| 011 SC-001 | `superseded-by DV-057` | DV-057 | 100-specstride |
| 011 SC-002 | `dropped` | DV-057 | none |
| 002 FR-004 | `superseded-by DV-042` | DV-042 | 119-front-door-and-presenter |
| 002 FR-006 | `superseded-by DV-043` | DV-043; DV-004 | 110-config-and-terms |
| 002 FR-009 | `superseded-by DV-040` | DV-040 | 105-verification |
| 002 FR-017 | `superseded-by DV-042` | DV-042 | 129-run-view-and-status |

Behaviour items, grouped by register row:

| Disposition | Subject | B-items | Count | Destinations |
|---|---|---|---|---|
| `superseded-by DV-004` | Default proposer and critic | B-0013…B-0014, B-0037…B-0038, B-0466, B-0486 | 6 | 124-harness-discovery-and-roles |
| `superseded-by DV-009` | Default mode `generate` | B-2665, B-2757 | 2 | 113-host-claude-code, 123-pipeline-runtime-and-supervisor |
| `superseded-by DV-022` | The `mkdir` lock fallback that is never released (D-06) | B-0163…B-0164, B-0251 | 3 | 122-detached-runtime |
| `superseded-by DV-023` | The install-root `.env` layer and `.env.example` | B-0001…B-0003, B-0156, B-0233, B-0379…B-0385, B-1505 | 13 | 110-config-and-terms |
| `superseded-by DV-024` | Settings that resume does not replay; ignored write failure (D-22, D-23) | B-0260, B-1584 | 2 | 102-run-control |
| `superseded-by DV-036` | `wiggum` alias, `WIGGUM_*` variables, `.wiggum/` state directory | B-0004…B-0007, B-0234, B-0346…B-0347, B-0354…B-0355, B-0360, B-0376…B-0378, B-0807, B-1282, B-1379, B-1763, B-1914, B-1995, B-2110 | 20 | 100-specstride, 108-reverse, 110-config-and-terms, 119-front-door-and-presenter |
| `superseded-by DV-037` | Migrations of the pre-v2 layout | B-0084, B-0193, B-0252…B-0255, B-0272 | 7 | 100-specstride |
| `superseded-by DV-038` | Legacy spellings in the launch contract | B-2493, B-2520, B-2640 | 3 | 106-learning, 107-launch-contract |
| `superseded-by DV-056` | `bin/onboard-skill` | B-2642…B-2660 | 19 | 113-host-claude-code |
| `dropped` | `specstride-digest.sh`, the `MOL_VIA` reminder, five contract keys with no reader | B-0338…B-0345, B-2489, B-2492, B-2498 | 11 | none |
| `superseded-by DV-062` | Fixed temporary file of `specstride phases` | B-1513 | 1 | 119-front-door-and-presenter |
| `superseded-by DV-064` | The closed registry and the locally registered backend | B-0425, B-0429, B-0519…B-0520, B-0574, B-0697, B-0815…B-0816, B-0834…B-0838, B-0905…B-0909, B-0982 | 19 | 109-harness-seam |
| `superseded-by DV-065` | Behaviour of the Python interpreter and of a missing `python3` | B-0118, B-0568…B-0569, B-0599, B-0673, B-2427 | 6 | 100-specstride, 126-stream-seam-and-invocation, 128-telemetry-export |
| `superseded-by DV-073` | Explicit format `openspec` exits 3 | B-1999 | 1 | 104-spec-input |

Written justifications for `dropped`:

| Subject | Justification |
|---|---|
| 011 FR-026; B-2492, B-2498 | The reminder exists to steer a model toward the scripts. One CLI with terse output (decision 16) removes the cause (D-14) |
| 011 SC-002 | Merge automation of the repository is not product behaviour |
| B-0338 to B-0345 | `specstride-digest.sh` is hard-wired to one workdir, one feature and one phase (D-03). The digest line and `specstride status` replace it |
| B-2489 | Five configuration keys are written by the bootstrap and read by no code (D-12). The contract hashes differ anyway (DV-008) |

### 4.4 Deferred

No behaviour item is deferred: the 136 items of dsh (66), Codex (8) and prime (62) moved to Wave 1 (owner ruling 32).
24 requirements and 3 success criteria stay deferred, all from 002.

| Disposition | Destination | B-items | FRs and SCs |
|---|---|---|---|
| `deferred 2` | 121-kanban-ui | 0 | 2 |
| `deferred 3+` | roadmap, "Critic ensemble" | 0 | 1 |
| `deferred 3+` | roadmap, "Engine hooks" | 0 | 1 |
| `deferred 3+` | roadmap, "Event delivery dispatcher" | 0 | 1 |
| `deferred 3+` | roadmap, "Feature parallelism in separate workspaces" | 0 | 2 |
| `deferred 3+` | roadmap, "Human approvals of plan revisions" | 0 | 5 |
| `deferred 3+` | roadmap, "Scheduler queue and cron" | 0 | 4 |
| `deferred 3+` | roadmap, "Server mode and the index database" | 0 | 2 |
| `deferred 3+` | roadmap, "Spec bundle import and verification plans bound to a spec bundle" | 0 | 9 |

### 4.5 Items whose disposition differs in class from the requirement that states them

A requirement has one disposition; the items under it may differ, because an item is narrower. The table lists every
case where the requirement is kept and an item is not, or the reverse.

| Requirement | Its disposition | Item disposition | Items |
|---|---|---|---|
| 011 FR-017 | `superseded-by` | `translated` | 6 |
| 028 FR-002 | `merged-with` | `superseded-by` | 1 |
| 028 FR-004 | `translated` | `superseded-by` | 1 |
| 028 FR-017 | `ported` | `superseded-by` | 1 |
| 028 FR-018 | `ported` | `superseded-by` | 2 |
| 028 FR-021 | `translated` | `superseded-by` | 6 |
| 028 FR-028 | `translated` | `superseded-by` | 1 |
| 028 SC-007 | `superseded-by` | `ported` | 1 |

### 4.6 What the rulings of 2026-09-29 changed in this file

| Ruling | Register row | Change here |
|---|---|---|
| 32, 32a, 32b | — | 136 items leave `deferred 3+`: 66 to 130-adapter-dsh, 8 to 131-adapter-codex, 62 to 138-adapter-prime, each `ported` or `translated` with fixture families. 134-adapter-pi receives no as-is item. The 19 items of the closed registry and the locally registered backend stay `superseded-by DV-064` |
| 56, D2, D3 | DV-080 | 002 FR-048 leaves `deferred 3+` and is `translated` to 142-parallel-units, proved by `CT-142-1`. 002 FR-039, FR-040, FR-043, FR-044, FR-045 and FR-047 stay `deferred 3+` |
| 20, 70 | — | No row changes: no requirement or success criterion of 002 describes the Agent SDK harness (section 5, item 15) |
| 48 | DV-079 | No row changes: the option has no as-is item, and no row cited the roadmap entry that was removed |
| 57, 57a, D1 | DV-081 | B-0981 and B-0831 to B-0833 (the Codex critic transport and its settings) cite DV-081 |
| K3 | DV-082 | B-0803, B-0864 and B-1114 (plan staleness at critic start) cite DV-082 and keep their dispositions, since the `parity` profile checks at critic start as today. 002 FR-016 cites it for the check at resume |
| K2 | DV-021 | No disposition changes: 028 FR-016, 002 FR-016 and B-1494 to B-1496 already compare through the exit-code map |
| 43 | DV-083 | No row changes: the baseline captures no content, so no as-is item exists |
| K8 | — | Every `superseded-by` and `dropped` row says "approved 2026-09-29 (ruling K8)" |

## 5. What could not be assigned, or was assigned with a reservation

Every requirement, success criterion and behaviour item has a disposition and a destination. Nothing is left without
one. Every ruling of `APPROVAL.md` that bears on this file was applied; items 15 to 20 are the reservations they add. The reservations below are the places where the assignment rests on a choice that the inputs do not settle.

| # | Subject | Items | What is open | What this file does |
|---|---|---|---|---|
| 1 | Non-code assets: the bundled telemetry stack (`telemetry/`), the vendored Spec Kit templates, the skill prose (`SKILL.md`) | 29, 11 and 8 items | `consolidation.md` section 6.7 says the feature briefs place them. No fixture can execute a configuration file or a prose rule (R18 O-8 item 4) | Telemetry stack: `translated` to 128 with a characterization test, DV-058. Templates: `ported` to 108, since the linter reads them as data (FX-30). Skill rules: `translated` to 113 with a characterization test |
| 2 | Config-home overlay: `backend_overlay` (C-026 to C-031) and the overlay items of `proposer` | 32 items and 19 more, and the 8 items of the dsh settings overlay in 130 | No fixture family declares an overlay: no shipped registry entry has one (028 SC-007), so the stubs run with scope `none` (R18 O-11). FX-26 is named, and it does not exercise an overlay today | `ported` or `translated` to 109. Feature 141 needs a fixture with a declared overlay, or these rows move to characterization tests |
| 3 | Presenter, banner and theme (C-081 to C-086, C-096 to C-107) | 122 items | FX-28 covers the front-door inspection commands. Terminal rendering, colour detection and the live timeline need a fixture with a pseudo-terminal (N-21) | `ported` or `translated` to 119 on FX-28. The exercise map will show which items FX-28 reaches |
| 4 | Redaction and retention policy (`observability_policy`, C-167) | 21 items | The module is reached only through the stream tap and the shippers. Whether it belongs to 111 (the redaction ingress) or 128 (content capture) is a cut inside one module | All 21 to 111, on FX-01 and FX-26 |
| 5 | Lisa platform requirements | 27 rows | The table "Platform features from Lisa" in `roadmap.md` names a wave for each entry. 002 FR-049, 002 FR-050, 002 FR-053, 002 SC-005 and 002 SC-006 are named by an entry; 002 FR-039 and 002 FR-040 are named by "Scheduler safety predicate and batch admission", which points to the entry these rows cite | All are Wave 3 or later except the dashboard trajectory (Wave 2, feature 121). 002 FR-048 left this group for 142-parallel-units (owner ruling 56). Dropping one needs a written justification and the owner's ruling |
| 6 | Requirements that R19 sent to a feature that has since been split | 11 rows | R19 used the suggested decomposition | Re-mapped by subject and single-owner rule; each such row says "R19 had" in its notes |
| 7 | Items that join a carried behaviour with a legacy part | 15 items | One item, two fates: for example B-0699 (disk progress ignores the state directory under its current and its legacy name) | The item keeps the disposition of its carried part and names DV-036 or DV-038 for the legacy part |
| 8 | Settings and flags | 454 items of kind `env` and `cli-flag` | R15 A-9 counted them all toward 110 | Assigned to the feature that owns the behaviour (section 1.3). 110 keeps the key names and the alias table. If the owner prefers R15's reading, 110 receives 391 more items and is far above the limit |
| 9 | `status` | 38 items of the front door | The single-owner rule gives the data and the default output to 129 and the compatibility output to 119 | Every as-is `status` item is compatibility output, so all go to 119. 129 receives no as-is item |
| 10 | Two write sites of `run_stop` on the structured path, `proposer.sh:2253` and `:2259` | 0 items | The inventory has no row for them (`consolidation.md` section 4.1); the nearest is B-0612 | Not traceable here. Feature 141 should add two inventory rows before the fixtures of FX-18 and FX-20 are written |
| 11 | Register rows still to be written (`consolidation.md` section 6.7): integrity rules IR-31, IR-33, IR-54 | 0 items | They add behaviour and change no as-is item | No row here cites them |
| 12 | Fixture families | every parity row | Families are assigned by subject. The exercise map (R18 O-8 item 3) has not run | A row whose family turns out not to execute the item's evidence line gets another family or a new one |
| 13 | macOS | every parity row | All expectations are `inferred` (DP-006, DV-071) | No row is split by operating system |
| 14 | DP-059 | — | It says the inventory file carries a cluster column. It does not | `traceability-items.tsv` carries it; the check script recomputes the clusters from the inventory and compares |
| 15 | Lisa's Agent SDK harness (owner rulings 20 and 70) | 0 rows | 002 has no requirement and no success criterion for the `agents` package. The only row that names the harness is 002 FR-006, as the default proposer, and it is `superseded-by DV-043`. 002 FR-011 is about the critic's transport errors, not about this harness | No row changes. The harness and its stream tap are extracted into 125-adapter-claude as an optional Tier 2 transport and get characterization tests `CT-125-n`, written in Stage B from Lisa's code at `363e6a3`. This file holds no origin for them |
| 16 | Parallel units (owner rulings 56, D2, D3) | 1 row | 002 FR-048 is proved by `CT-142-1`. The design of feature 142 is R29 with its red team R29v; the owner has not approved that design (`APPROVAL.md`, "Not approved, because not asked"). Lisa's rules were written for whole features in separate workspaces and have no production caller (R26) | `translated` to 142, citing DV-080. If R29 keeps fewer of the rules than 002 FR-048 states, the rest needs a register row or a ruling in `CLARIFY-QUEUE.md` |
| 17 | The dsh plugin request protocol (C-036 to C-040 and the plugin items of `proposer`) | 27 items | No fixture family of R18 O-4 exercises a plugin request. The protocol ends a pass with exit 7 or 4, so FX-18 and FX-17 are named | `ported` or `translated` to 130 on FX-17 and FX-18. Feature 141 needs scenarios with a request file and a stub installer inside those families, or a new family |
| 18 | Streams and invocations of dsh, Codex and prime | 136 items | Ruling 32 makes them release-blocking. FX-26 covers stream formats through the seam; the fixtures for these three harnesses do not exist yet, and R9 and R6 left facts unverified that the fixtures depend on (dsh's approval behaviour in headless mode, Codex's structured quota event). The reference side needs only stub executables named after the as-is commands (DV-064) | Families assigned by subject: FX-26 for streams and proposer invocations, FX-01 and FX-06 for critic calls, FX-18 for a pass that fails before the harness starts, FX-25 for context windows. The exercise map confirms or corrects them (item 12) |
| 19 | The Codex critic (owner rulings 57, 57a, D1) | 4 items | As-is the Codex critic is a direct HTTP call (B-0981). The new default is a harness critic with read-only tools in a sandbox. DV-081 says the difference is not observable, because the stub critic serves both forms | B-0981 is `translated` through the transport-neutral transcript, as B-0980 is for Claude, citing DV-001 and DV-081. B-0831 to B-0833 cite DV-081 |
| 20 | Items of 130 that are not specific to dsh | 4 items | B-0563 (the `iter_done` event) and B-0764 (the order of the prompt blocks, cited by DV-020) describe general behaviour of the pass loop with one dsh variant each. B-0677 and B-0984 map bare model ids to providers, and one target is specific to the owner's machines | All four stay in 130, so that the feature carries the 66 items `architecture.md` section 14 states. The spec of 103 must cover the general part of the first two. For the last two the spec of 130 decides whether the table ships or becomes user configuration |

