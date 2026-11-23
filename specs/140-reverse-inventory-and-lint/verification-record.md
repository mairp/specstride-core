# Verification record — 140-reverse-inventory-and-lint

**Date**: 2026-10-03. The record of what was verified, how, and what stays
`unverified` with its reason. Written by the implementation passes of phases 1 to
6; the per-test macOS record it points at is `tests/parity/140/README.md`.

## The out-of-band tasks of this feature

The owner's ruling of 2026-09-30 (OPERATOR SLOT): a paid, live, person-run or
macOS task is left unchecked and recorded as `unverified` with its reason; the
hermetic part is done on Linux; the rest is never run and never faked. A phase
whose only open work is of that kind counts as complete.

| Task | Kind | State | Reason, and what would settle it |
|---|---|---|---|
| T035 | macOS runner | **`unverified`** | This host is Linux (`process.platform` is `linux`) and this working tree has no git remote, so feature 100's build workflow — which already carries `macos-latest` in its matrix (`.github/workflows/build.yml`) — cannot be dispatched. The hermetic half WAS done: every one of the 19 test files of this feature was run on its own on Linux and its result recorded per test in `tests/parity/140/README.md`, with the macOS column `unverified` throughout and no row of it a pass. What would settle it: a person, under the owner's login, dispatching that workflow on a repository with a remote, on a macOS runner whose volume is case-insensitive |

No other task of this feature is paid, live or person-run. No task of this
feature calls a model (`tasks.md`, "Dependencies").

## The macOS statements that stay `unverified`

| Fact | Requirement | Where the statement is |
|---|---|---|
| The git output forms the walk parses are the same on macOS | F140-FR-017 | the `status:` line of F140-FR-017 in `spec.md`; `research.md`, "Facts that are `unverified`" |
| A case-insensitive file system does not change the file list, its order or the fingerprint | F140-FR-017, F140-FR-021 | `research.md`; `plan.md`, "Target Platform" |
| Opening a file without following links behaves the same on macOS | F140-FR-020 | `research.md`, "Facts that are `unverified`" |
| Every other test of this feature passes on macOS as it does on Linux | F140-FR-001 to F140-FR-026 | `plan.md`, "Target Platform" |

Each of the four is carried, with the check that would settle it, in
`tests/parity/140/README.md` ("The macOS statements that stay `unverified`"), and
nothing in this feature reads any of them as verified.

## What WAS verified, on Linux

| Tier | Files | Tests | Pass | Fail | Skipped, each with its reason |
|---|---|---|---|---|---|
| Parity — `tests/parity/140/` | 9 | 331 | 307 | 0 | 24 |
| Characterization — `tests/characterization/140/` | 1 | 13 | 13 | 0 | 0 |
| Package, the flat paths the tasks name — `packages/reverse/test/` | 5 | 71 | 71 | 0 | 0 |
| Package, this feature's own — `packages/reverse/test/140/` | 4 | 68 | 68 | 0 | 0 |
| **Total** | **19** | **483** | **459** | **0** | **24** |

The 24 skips are all the same prerequisite: feature 141's oracle is a skeleton,
so the comparison halves of the parity tests have no golden capture to compare
against. They are skips with their reason and never passes (the constitution,
principle XVII). The scenarios this feature needs from feature 141 are reported
in `reports/T032-fx30-parity-profile.md`.

## The reports of phase 6

| Report | Task | What it holds |
|---|---|---|
| `reports/T031-rows-against-feature-100.md` | T031 | The two tables of `spec.md` against row 69 of annex X §X.7 and rows 146 to 149 and 151 to 155 of §X.6: equal in substance, seven differences of wording or of detail, one of them worth a ruling. A report, not an edit |
| `reports/T032-fx30-parity-profile.md` | T032 | The 41 scenarios of the first set of FX-30 under the profile `parity`: none `equal`, all 41 a skip with its reason; and eight scenarios asked of feature 141 |
| `reports/T033-quickstart-results.md` | T033 | The eight scenarios of `quickstart.md`, run: 8 pass, 0 fail, 0 skip |
| `reports/T036-output-bytes.md` | T036 | The bytes of the default output of `reverse inventory` against the 1,120-byte cap (2,240 on a failure), and the size of the output of `reverse lint` per scenario of FX-30 |
| `tests/parity/140/README.md` | T035 | The per-test record, Linux measured and macOS `unverified` |
