# Verification record of feature 141

What was verified, where, and what stays `unverified`. One row per obligation of
[`tasks.md`](tasks.md) whose answer is not simply "its test passes"; everything else is in the
tests themselves and in the evidence of the phase gates under
`.specstride/features/141-parity-oracle/gates/`.

Written on 2026-10-02, on Linux `x86_64` with Node `v22.23.2`, at build
`99d53011d909a76d239eeddc906c642f37278c8f`.

## T067 — CT-141-136, the macOS runner

**`unverified`.** No macOS runner has run the parity oracle.

**Reason**: the owner's policy of 2026-09-30 puts a macOS task out of band — it is never run and
never faked by an automated pass ([`tasks.md`](tasks.md), T067 and T074). Two prerequisites are
also missing in this working tree, and a missing prerequisite is a skip with its reason and never
a pass (F141-FR-037):

| Prerequisite                                        | How it is checked                                    | State on 2026-10-02                                              |
| --------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------- |
| A git remote the `oracle` workflow can be dispatched on | `git remote -v`; `gh workflow list`              | **missing** — this working tree has no remote and was never pushed |
| A passing `reference` job on the same build         | `packages/oracle/golden/live-run.json` of that build | **missing** — the live differential run has not run on a build     |
| A GitHub-hosted `macos-latest` runner               | the job `platform` of `.github/workflows/oracle.yml` | **unknown** — no remote to dispatch on                             |

**What was done instead**: the hermetic half, on Linux, and it passes. The release check **blocks**
while no macOS runner has passed and **says** that every statement about macOS stays `unverified`;
a record of a run that did not pass, or of another build, blocks the same way; a record that passed
on the build to be released lifts that one cause and nothing else. Decided by
[`tests/release/141/macos-runner.test.ts`](../../tests/release/141/macos-runner.test.ts)
(CT-141-136, 8 tests) against
[`packages/oracle/src/release/release-check.ts`](../../packages/oracle/src/release/release-check.ts)
and [`packages/oracle/src/release/per-os.ts`](../../packages/oracle/src/release/per-os.ts). That no
record exists in this repository is read off disk by the first of those tests, so the suite cannot
be green on a tree where someone wrote one by hand.

**What stays `unverified`**: which per-OS expectation **holds** on macOS. Only a macOS runner can
decide it. Until then every row of
[`packages/oracle/data/per-os-expectations.json`](../../packages/oracle/data/per-os-expectations.json)
stays `inferred` (F141-FR-035) and every statement of every specification about macOS stays
`unverified` (F141-FR-036).

## T074 — the procedure of the first macOS run and the form of its report

**Written, and `unverified` as a result.** The procedure, the prerequisites, the seven steps, the
nine subjects of the report and the JSON shape of the record are
[`tests/release/141/macos-first-run.md`](../../tests/release/141/macos-first-run.md). The document
is the procedure and the form of the report; it is **not** the run and **not** the report, and it
says so in its own status line.

**Reason it is not run**: as T067 above. The document names who runs it (a person, under the
owner's login, on the job `platform` of `.github/workflows/oracle.yml`), and forbids an automated
pass to write `tests/release/141/macos-verified.json`, to mark any per-OS expectation `verified`,
or to change the status line of `per-os-expectations.json`.

**Held to the code**: two tests of CT-141-136 hold the document and the shape
`MacosRunRecord` of `packages/oracle/src/release/per-os.ts` to each other — every field of the
record is named in the document, every subject of `per-os-expectations.json` is a row of its table,
and the document reports the run as a research result ("which expectations held and which did not").

## The same two facts in `research.md`

[`research.md`](research.md), "Facts that are `unverified`", carries the two rows this record is
about and names the check that would verify each:

| Fact                           | Requirement | Check that would verify it                      | Owner |
| ------------------------------ | ----------- | ----------------------------------------------- | ----- |
| Every per-OS expectation       | F141-FR-035 | The first run of the oracle on a macOS runner   | 141   |
| That a macOS runner passes     | F141-FR-036 | The platform job before a release               | 141   |

`script(1)` on macOS (decision D-9) is `unverified` for the same reason and by the same check.

## What needs no verification record

Every other task of phase 5 is decided on Linux by a test that runs in
`npm test -w @specstride/oracle` or `npm run test:release`, with no missing prerequisite:
T064 (`packages/oracle/test/golden/golden.test.ts`), T065
(`packages/oracle/test/release/release-check.test.ts`), T066
(`packages/oracle/test/release/per-os.test.ts`), T068
(`packages/oracle/test/release/tiers.test.ts`), and the implementations T069 to T073.
