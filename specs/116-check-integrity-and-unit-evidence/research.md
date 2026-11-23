# Research: Check integrity and unit evidence (feature 116)

Phase 0 of the plan. The research of this effort stays in `docs/ecosystem/`; this file says which
report settles what, records the decisions of the plan, and lists what is `unverified`.

## Sources

| Subject | Source | Used for |
|---|---|---|
| The reconciled design | `docs/ecosystem/research/R27-run-acceleration-synthesis.md`, D1.4, D1.6, D1.12, D-16, D-18 | Every requirement |
| Integrity rules IR-11 to IR-18 | `docs/ecosystem/research/R23-inner-checks-gate-integrity.md`, F-16 | Protected set; fact block |
| Integrity rules IR-31 to IR-46 | `docs/ecosystem/research/R23v-gate-red-team.md` | Fingerprints, patterns, caches, conditions; the verifier stands over R23 |
| Threats T-19, T-20, T-23, T-24 | `docs/ecosystem/research/R11-security-threat-model.md`; feature 100 annex X §X.9 | Threat table of the spec |
| Rulings | `docs/ecosystem/APPROVAL.md` rulings 38, 39, 41, 53 | Every group |
| Contracts | `specs/100-specstride/annexes/` B, C, D, E, G, X | Interfaces |
| The split | `docs/ecosystem/STAGE-B-SPLIT-PROMPT.md` | Ids, the rule on citations |

## Decisions

### D-1 One edge package

- **Decision**: `@specstride/integrity`, layer L1. The package graph of feature 100 holds it with owner 116.
- **Rationale**: fingerprints and profiles need the file system, which a core package may not use directly (F100-FR-012). The architecture names one owner of fingerprints and the protected set (R15v E-3).
- **Alternatives considered**: a directory of the package of the check runner (two owners in one package).

### D-2 The tree fingerprint reads metadata first

- **Decision**: a list of tracked and untracked files from the version control tool, a cache keyed by path, size and modification time, content hashes only for entries that changed. Files of the protected set inside this list are always hashed by content. Ignored paths are the exception; see D-6.
- **Rationale**: two fingerprints bracket every check (IR-31) and count against the time of the phase attempt. No check duration has ever been measured (R27 risk 2).
- **Alternatives considered**: full content hash each time (cost grows with the tree); modification times only (a proposer can set them).

### D-3 A profile may name how the effective configuration is read

- **Decision**: one fixed argument list of a pinned executable per profile, run through the check runner (CQ-085).
- **Rationale**: rule IR-36 compares the effective configuration "where the adapter for that toolchain can print it"; annex C §C.14 says a profile names no command to run.
- **Alternatives considered**: leave the comparison out in Wave 1 (then user-level configuration of a toolchain is covered by class A patterns only).

### D-4 The fact block is a pure function

- **Decision**: the builder takes the check results, the protected set, the ledger records of the phase attempt and the task list at launch, and returns the record. It reads no clock and no file of the workspace.
- **Rationale**: rules IR-17 and IR-18; byte-identical output for equal final states is the test.
- **Alternatives considered**: building the block while units are worked (order and history would leak into it).

### D-5 The tamper fixtures live here, the experiment does not

- **Decision**: this feature builds the seven seeded tamperings and the test that each gives its condition. The run and the report of experiment X12 belong to the feature that owns the experiments.
- **Rationale**: the split rule forbids a citation of the sibling; the fixtures are what F116-SC-001 measures.

### D-6 Ignored paths from which a check executes: a listing, and content where it is named

Added on 2026-09-30 (review item W-116-01).

- **Decision**: such a path is in class A by a hash of its listing, as rule IR-35 says. The listing holds name, kind, size, mode, modification time and the time of the last change of status. Content is hashed for pinned executables (rule IR-36) and for files that a class A pattern of a profile matches (rule IR-38).
- **Rationale**: D-2 rejects modification times as the only basis because a proposer can set them. The time of the last change of status is set by the system and not by a call of the user; with it a change that restores size and modification time still changes the listing. The files that decide what a runner does are named by the patterns of the profile and are hashed by content.
- **Residual risk**: a file that is neither pinned nor matched, changed with every value of the listing kept. Recorded in row III of the Constitution Check, in Complexity Tracking and in the threat table of the spec (T-19). Reported as a question (CQ-197).
- **Alternatives considered**: content hashes of the whole path around every check (cost; no check duration has been measured); a new field of the profile that names the files an executable loads (annex C §C.14 of feature 100 does not list such a field; the class A patterns already serve).

### D-7 The key of a consumer profile

Added on 2026-09-30 (review item W-110-09).

- **Decision**: `toolchains.<id>`, user configuration only, trust class widening, no default, not used under `parity`; stored under `user:toolchain:<id>`.
- **Rationale**: the form of `harnesses.<id>` and `user:harness:<id>`. The spelling belongs to the owner of the key list, to which it is reported.

## Unverified

| Item | Check that would verify it |
|---|---|
| Every statement about macOS: the file list of the version control tool, modification times, permissions | A macOS runner passes the tests of this feature |
| That the sandbox of a harness denies writes to named paths inside the workspace, which `protection=prevent` needs | A capture per harness adapter, by its feature |
| That a process of the proposer's user cannot set the time of the last change of status of a file, on Linux and on macOS | A test on both runners that writes a file, restores size and modification time, and compares the listing |
| The duration of two fingerprints on a real tree | Records of check times of real runs |
| That the patterns of the shipped profiles are complete for their toolchains | Review per toolchain; the patterns age and are versioned |

## Open points reported to the orchestrator

CQ-084 and CQ-085, which stay open in the queue. CQ-197 (D-6) and the key `toolchains.<id>`
(D-7), reported on 2026-09-30.

Settled by feature 100 since 2026-09-29: the package `@specstride/integrity` (package graph,
owner 116); the content owner of EP-16 (annex C §C.14) and of the fact block (annex D §D.7);
closed set rows 27, 65, 66, 142 and 143 (annex X §X.6); the schema ids
`specstride.protected-set/1` and `specstride.check-result/1` (annex B §B.20); the fifth further
fact `task-list-changed` (row 66).
