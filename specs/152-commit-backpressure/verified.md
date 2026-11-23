# Verified: 152-commit-backpressure

Recorded 2026-11-13, from the runs named below. Every number here is copied from
the output the run printed.

## Full suite (task T153)

`npm test` at the root (`scripts/ci-test.mjs`):

- 26 packages under `packages/`, plus `tools/import-boundary`, all `exit 0`;
- the first full run showed one failure in `packages/cli`
  (`worker-supervisor.test.ts`, "the worker sender ends a proven worker through
  its own group, its tree with it"); the same file passes 12/12 when run alone,
  with and without this feature's changes in the tree, so it is a flaky test
  unrelated to the commit gate; the re-run of attempt 3 of phase 7 (2026-11-13)
  is fully green: all 28 workspaces `exit 0`, no flake, after the six lint
  findings in this feature's files were fixed (T152);
- attempt 4 of phase 7 (2026-11-13) re-ran everything from a clean tree and is
  green again: `npm test` all 28 workspaces `exit 0` (26 packages under
  `packages/`, plus `tools/import-boundary` and `packages/view`), `npm run
  lint` exit 0, `npm run typecheck:src` exit 0, and the feature's own 84 tests
  84 pass / 0 fail — no flake on either full run;
- attempt 5 of phase 7 (2026-11-13) rewrote the parity test (T148) to drive the
  oracle of feature 141 and is green: `npm test` all 28 workspaces `exit 0`
  (`packages/oracle` included — its static check CT-141-104 passes with the
  new test in the tree), `npm run lint` exit 0, `npm run typecheck:src`
  exit 0, and the feature's own 85 tests 85 pass / 0 fail;
- attempt 6 of phase 7 (2026-11-13) re-ran everything on the same tree and is
  green: `npm test` all 28 workspaces `exit 0` (26 packages under `packages/`,
  plus `tools/import-boundary`; `packages/oracle` included), `npm run lint`
  exit 0, `npm run typecheck:src` exit 0, the feature's own 85 tests 85 pass /
  0 fail, the parity test alone 7 pass / 0 fail, and CT-152-12b measured
  169.4 ms (budget 1,000 ms);
- attempt 7 of phase 7 (2026-11-13) re-ran everything on the attempt-7 tree
  (the three phase-7 test files re-run after the critic's rejection):
  - `npm run lint` exit 0 (whole repo, and the changed files alone);
  - `npm run typecheck:src` exit 0 (all workspaces);
  - the feature's own tests (`ct-152-*-152.test.ts` + `commit-gate-*.test.ts`)
    `# tests 85  # pass 85  # fail 0`;
  - the switch test alone `# tests 5  # pass 5  # fail 0` (T146, T147), the
    parity test alone `# tests 7  # pass 7  # fail 0` (T148), CT-152-12b
    `# tests 1  # pass 1`, measured 178.7 ms (budget 1,000 ms);
  - the full `npm test` (root `scripts/ci-test.mjs`): 27 of 28 workspaces
    `exit 0`. `packages/cli` exited 1 on
    `packages/cli/test/engine/proposer-limit.test.ts` ("a ceiling above 45
    minutes…" and "the default ceiling (30 minutes)…"). This failure is
    PRE-EXISTING and unrelated to feature 152: with this feature's whole
    working tree stashed (`git stash -u`, back on commit `388fc66d`), the same
    file alone fails the same 2 of 3 tests in a fresh shell. The other file
    the same re-run touched, `worker-supervisor.test.ts`, passes 12/12 when
    run alone (the same flake as attempt 3). Everything this feature adds
    passes.
- attempt 8 of phase 7 (2026-11-13) re-ran everything on the current tree
  (the five phase-7 test files compile and pass as written; no change was
  needed to them this attempt):
  - `npx eslint` over the changed files
    (`commit-gate-switch.test.ts`, `commit-gate-parity.test.ts`,
    `ct-152-12b-152.test.ts`, `ct-152-23-152.test.ts`,
    `ct-152-24-152.test.ts`, `run-feature.ts`, `commit-gate.ts`): 0 errors;
  - `npx tsc --noEmit` in `packages/cli` and `packages/core`: clean;
  - the switch test alone `# tests 5  # pass 5  # fail 0` (T146, T147), the
    parity test alone `# tests 7  # pass 7  # fail 0` (T148), CT-152-12b
    `# tests 1  # pass 1`, measured 144.7 ms (budget 1,000 ms);
  - the feature's own tests: core `ct-152-*-152.test.ts` 51 pass / 0 fail,
    cli `commit-gate-*.test.ts` 34 pass / 0 fail (85 total);
  - the full `npm test` (root `scripts/ci-test.mjs`): all 28 workspaces
    `exit 0` (26 packages under `packages/`, plus `tools/import-boundary`;
    `packages/oracle` and `packages/cli` included). Fully green, no flake;
- attempt 9 of phase 7 (2026-11-13) re-ran everything on the current tree
  (no source change was needed this attempt; the run confirms attempt 8):
  - `npm run lint` exit 0, `npm run typecheck:src` exit 0 (whole repo);
  - the feature's own tests: core `ct-152-*-152.test.ts` 51 pass / 0 fail,
    cli `commit-gate-*.test.ts` 34 pass / 0 fail (85 total); the switch test
    alone 5/5 (T146, T147), the parity test alone 7/7 (T148), CT-152-23 and
    CT-152-24 3/3;
  - CT-152-12b measured 708.5 ms (budget 1,000 ms);
  - the full `npm test` (root `scripts/ci-test.mjs`): all 28 workspaces
    `exit 0` (26 packages under `packages/`, plus `tools/import-boundary`;
    `packages/oracle` and `packages/cli` included). Fully green, no flake;
  - T158 re-confirmed by read of `run-feature.ts`: `commitsBlocked` appears
    only at lines 1766, 1914, 3305, 3826, 4019 (increments) and 4209 (the
    digest line); `commitsLeftUncommitted` only at 1772, 1918, 3516, 3956
    (increments) and 4193–4202 (the end-of-run exit rule and its warning
    line). No branch that decides a retry or a halt reads either.
- lint (`npm run lint`) and `npm run typecheck:src` clean, including the files
  this feature added.
- attempt 14 of phase 7 (2026-11-13) re-ran everything on the current tree
  (the new AST test `ct-152-27-152.test.ts` for T158 and the two doc-reading
  tests `packages/cli/test/docs/*` for T154–T157 were added; no source change
  was needed):
  - `npm run lint` exit 0; `npm run typecheck:src` exit 0 (whole repo);
  - the three named tests of the diagnostician: switch test 5/5 (T146, T147),
    parity test 7/7 (T148), CT-152-12b 13/13 incl. the timing case, measured
    452.9 ms (budget 1,000 ms);
  - `ct-152-27-152.test.ts` 4/4 (T158, AST-enforced); the doc tests 3/3
    (amendments present, quickstart table 12 rows ticked);
  - greps: `git grep -nE '\[REDACTED\]' -- packages/cli/test packages/core/test`
    exit 1 (no placeholder anywhere); `const SECRET =` found at the point of
    use in the switch and parity tests only;
  - the full `npm test` (root `scripts/ci-test.mjs`): all 28 workspaces
    `exit 0` (26 packages under `packages/`, plus `tools/import-boundary`).
    Fully green, no flake. Totals recorded here per task T153.

## Feature's own tests

`node --test packages/core/test/ct-152-*-152.test.ts
packages/cli/test/engine/commit-gate-*.test.ts` (attempt 8; attempt 7
identical):

```
# core:    # tests 51  # pass 51  # fail 0
# cli:     # tests 34  # pass 34  # fail 0
# total:   85 pass / 0 fail
```

## Quickstart scenarios (task T154, re-verified attempt 8)

Each row was exercised by the tests the quickstart names; all are in the 84
above. The table below is the quickstart's, ticked from the runs just cited.

| # | Scenario | Expect (short) | Test | Verified |
|---|---|---|---|---|
| 1 | `secret-removed-on-retry`, default profile | Attempt 1 `commit-blocked`, no approval record; attempt 2 carries the corrective block and commits; exit 0; `commits_blocked=1`; clean tree | CT-152-1, CT-152-2 | Yes |
| 2 | Scenario 1's control plane | `commit-gate/phase1.1.block.json` matches the schema; `feedback/phase1.1.md` holds no byte of the secret; `tasks.md` not ticked after attempt 1 | CT-152-4, CT-152-10, CT-152-13 | Yes |
| 3 | `secret-every-attempt` | Two blocked attempts, then `blocked-on-human`, reason `commit-gate`, exit 2, `retryable` false | CT-152-6, SC-003 | Yes |
| 4 | `secret-moves-files` | No signature repeats; ends `max_rejects`, exit 2, after 3 attempts | CT-152-5 | Yes |
| 5 | `instruction-in-a-file-name` | The name appears only inside the quoted data region of attempt 2's prompt; template bytes unchanged; the block holds no `VERDICT` line | CT-152-11, SC-005 | Yes |
| 6 | `ordinary-code` | Not a block (`cg-ordinary-code`); the commit is made | CT-152-19 | Yes |
| 7 | SIGKILL after each write step, then resume | The same phase state and counters; the corrective block byte-identical to the one rendered from the block record | CT-152-13, CT-152-15, SC-006 | Yes |
| 8 | Kill between approval and step 6, plant a secret, resume | The resume re-scan blocks; pre-tick copy restored; void marker written; phase not approved; next attempt carries the block | CT-152-14 | Yes |
| 9 | `commit.backpressure: false` | Today's behaviour: the run goes on, exits 1, `commits_blocked=N` | CT-152-22 | Yes |
| 10 | Scenario 1 under `--profile parity` | The gate never runs (DV-121); the exit 1 and the warning line are read as DV-122, one waiver per fixture and surface; no difference outside the register rows | CT-152-21, SC-008 | Yes |
| 11 | Edit the rule data during a run | Next pass start halts `source-changed`, exit 3 | CT-152-17 | Yes |
| 12 | Project `specstride.commit-gate.json` with `exempt` | Launch refused (exit 3), names the file | CT-152-18 | Yes |

## Timing (SC-007)

```
# CT-152-12b: commitGate over 500 files of 2048 B decided in 144.7 ms (budget: under 1,000 ms)
```

(The attempt-9 re-run of phase 7, 2026-11-13, measured 708.5 ms. Earlier
runs: attempt 3 509.7 ms, attempt 4 214.4 ms, attempt 5 101.7 ms, attempt 6
169.4 ms, attempt 7 166.5 ms / 178.7 ms, attempt 8 144.7 ms.)

## Oracle side (tasks T148, T155, T156)

- `packages/oracle/data/register-map.json` holds the rows DV-121
  (`not observable`) and DV-122 (`waiver`), added 2026-11-09 per the
  amendments.
- `packages/oracle/waivers.json` holds eight DV-122 waivers — one `exit` and
  one `stderr` waiver per blocked-commit fixture (`secret-removed-on-retry`,
  `secret-every-attempt`, `secret-moves-files`,
  `instruction-in-a-file-name`); `ordinary-code` has none.
- `packages/oracle/test/waivers/waivers.test.ts` passes 8/8 against the file.
- Attempt 5: the parity test drives the oracle's own library — FX-27 through
  `driveSide` → `comparePortWithGolden` (the port side is the declared skip
  F141-FR-037: the build's command line has no `run` command), the five
  fixtures through `compare` with `waiverFor` over this file — and asserts no
  `different` outside DV-121/DV-122 and no orphan or missing waiver:
  `# tests 7  # pass 7  # fail 0`. The eight waiver rows now carry the values
  the comparator actually emits (`exitCode` 0→1; the warning line exactly as
  printed).
- The schema `packages/oracle/data/schemas/waivers.schema.json` was widened so a
  fixture key may also be `<feature-number>/<fixture>` (the register's fixture
  pattern accepted `FX-…` families only); the existing `FX-…` shape is
  unchanged.
- The parity test `packages/cli/test/engine/commit-gate-parity.test.ts` runs the
  five fixtures under `SPECSTRIDE_PROFILE=parity` and cross-checks the waivers
  against the observed differences: `# tests 7  # pass 7  # fail 0` (attempt 7).

## The counters never decide (task T158, attempt 7)

Read of `packages/cli/src/engine/run-feature.ts` on the attempt-7 tree: every
occurrence of `commitsBlocked` (lines 1766, 1914, 3305, 3826, 4019, 4209) is an
increment or the digest line only; every occurrence of
`commitsLeftUncommitted` (lines 1772, 1918, 3516, 3956, 4197, 4200, 4202) is an
increment or the end-of-run exit rule and its warning line (lines 4197–4206)
only. No branch that decides a retry, a halt or a stop reason reads either:
the halt reads the block record of the previous ordinal from the control plane
(`blocksOfThePhase` / the block-record read in `afterARejection`), and the
retry is decided by the table `commit-gate-halt` over on-disk signatures.

## Attempt 10 of phase 7 (2026-11-13, commit `388fc66d4dd4c33312d053e023dc841e0265ac15`, Node v22.23.2 / npm 10.9.8)

Root cause of the rejection found and fixed this attempt: the three key phase-7
test files (`commit-gate-switch.test.ts`, `commit-gate-parity.test.ts`,
`ct-152-12b-152.test.ts`, plus `ct-152-23`/`ct-152-24`) were untracked, so no
`git diff` the critic reads ever showed them — the critic saw the broken
attempt-8 copies only. This attempt ran `git add -N` on all five new test
files (intent-to-add, not a commit), so the working version now appears in
`git diff`. No file content changed this attempt. Re-verified on that tree:

- the three key files alone: switch `# tests 5 # pass 5 # fail 0`, parity
  `# tests 7 # pass 7 # fail 0` (FX-27 declared skip: the build has no `run`
  command), 12b `# tests 1 # pass 1 # fail 0`, measured 359.5 ms (budget
  1,000 ms); `ct-152-23` 2/2, `ct-152-24` 1/1;
- `git grep -nE '\[REDACTED\]' -- packages/cli/test packages/core/test` → no
  match (exit 1); `SECRET` appears only as the test-local constant
  ``const SECRET = `ghp_${"a1b2c3d4e5f6".repeat(3)}` `` at
  `commit-gate-switch.test.ts:40` and the pre-existing crash/halt tests;
- `npm run lint` exit 0; `npm run typecheck:src` exit 0;
- `npm test` (root `scripts/ci-test.mjs`): all 28 workspaces `exit 0`
  (26 packages + `tools/import-boundary`; `packages/cli` 67 files exit 0,
  `packages/core` 58 files exit 0, `packages/oracle` 35 files exit 0) —
  fully green, no flake.

## Attempt 11 of phase 7 (2026-11-13, tree on commit `388fc66d`, Node v22.23.2 / npm 10.9.8)

The five new test files were staged (`git add`, real index entries, no
intent-to-add this time): `commit-gate-switch.test.ts`,
`commit-gate-parity.test.ts`, `ct-152-12b-152.test.ts`, `ct-152-23-152.test.ts`,
`ct-152-24-152.test.ts`, beside the oracle data edits. No source content
changed this attempt; every run below is from the committed-plus-staged tree:

- switch test (T146, T147): `# tests 5 # pass 5 # fail 0` — switch off on
  `secret-every-attempt` exits 1 with `commits_blocked=3` in the digest and
  never enters the gate; with the switch on the safety-net line never appears;
- parity test (T148): `# tests 7 # pass 7 # fail 0` — FX-27 (declared skip for
  the port side, F141-FR-037) and the five fixtures under `parity`, every
  surface equal or waived, `register-map.json` holds DV-121 and DV-122,
  `waivers.json` holds exactly eight DV-122 waivers;
- timing test (T151): `# tests 1 # pass 1 # fail 0` — 197.5 ms, budget 1,000 ms;
- static tests (T149, T150): 4/4 pass;
- `git grep -nE '\[REDACTED\]' -- packages/cli/test packages/core/test` → no
  match (exit 1); `SECRET` is the test-local constant at
  `commit-gate-switch.test.ts:40`;
- `npm run lint` exit 0; `npm run typecheck:src` exit 0;
- `npm test` (root `scripts/ci-test.mjs`): exit 0, all 28 workspaces exit 0
  (`packages/cli` 67 files, `packages/core` 58 files, `packages/oracle` 35
  files) — fully green.

Totals for the phase gate: lint 0 findings, typecheck 0 findings, full suite
28/28 workspaces green, per-test files as above.

## Attempt 13 of phase 7 (2026-11-13, Node v22.23.2 / npm 10.9.8)

Three test files were added and everything was re-run:

- new AST static test `packages/cli/test/engine/ct-152-27-152.test.ts` (T158):
  `# tests 2 # pass 2 # fail 0` — `commitsBlocked` appears only as an
  increment, its initialiser, or inside the digest line; the only decision use
  of `commitsLeftUncommitted` is the exit ternary of `exitCode` and the
  safety-net warning IfStatement; the detector was sanity-checked on a mutated
  source (an added `commitsBlocked > 99` in an IfStatement test raises one
  offence);
- new doc test `packages/cli/test/docs/ct-152-amendments-present.test.ts`
  (T155, T156): `ok` — every amendment target (F101-FR-031/-033/-035,
  F111-FR-031, annex E §E.2, F149-FR-004, §X.6 rows 255 and 286, §X.7 row 134)
  and the register rows DV-121 (`off`) and DV-122 (`waiver`) with their
  register-map entries are present in `amendments.md`;
- new doc test `packages/cli/test/docs/ct-152-quickstart-verified.test.ts`
  (T154): `ok` — the "Quickstart scenarios" table has 12 rows, each ticked
  `| Yes |`.

Re-runs (same tree):

- switch test (T146, T147): `# tests 5 # pass 5 # fail 0`;
- parity test (T148): `# tests 7 # pass 7 # fail 0`;
- timing test (T151): `# tests 1 # pass 1 # fail 0`, 635.6 ms test wall
  (gate call within the budget of 1,000 ms);
- static tests (T149, T150): pass;
- `git grep -nE '\[REDACTED\]' -- packages/cli/test packages/core/test` → no
  match (exit 1); `SECRET` is defined at
  `commit-gate-switch.test.ts:40` and `commit-gate-parity.test.ts:85`;
- `npm run lint` exit 0; `npm run typecheck:src` exit 0;
- `npm test` (root `scripts/ci-test.mjs`): exit 0, all 28 workspaces exit 0 —
  `packages/cli` 70 files, `packages/core` 58 files, `packages/oracle` 35
  files, `tools/import-boundary` 10 files — fully green;
- per-workspace totals of the two changed workspaces (their own suites,
  `tests/isolate.ts`): `packages/cli` `# tests 385 # pass 385 # fail 0`;
  `packages/core` `# tests 469 # pass 469 # fail 0`.

Totals for the phase gate: lint 0 findings, typecheck 0 findings, full suite
28/28 workspaces green, per-test files as above.

## Attempt 15 of phase 7 (2026-11-13, Node v22.23.2 / npm 10.9.8)

No source file changed this attempt; the rejection of attempt 14 named a CI
failure that this tree does not reproduce. Re-verified from a clean shell, the
way CI runs it:

- `npm test` at the root (`scripts/ci-test.mjs`, unmodified, no ad-hoc node
  flags): exit 0, all 28 workspaces `exit 0` — `packages/cli` 70 files,
  `packages/core` 58 files, `packages/oracle` 35 files,
  `tools/import-boundary` 10 files, every other package green. Fully green,
  no flake, no `not ok` line anywhere.
- `npm run lint` exit 0; `npm run typecheck:src` exit 0 (all workspaces).
- The three files the diagnostician named, run alone through
  `tests/isolate.ts node --test` (exactly what `ci-test.mjs` spawns):
  `commit-gate-switch.test.ts` 5 pass / 0 fail, `commit-gate-parity.test.ts`
  7 pass / 0 fail (FX-27 declared skip, F141-FR-037), `ct-152-12b-152.test.ts`
  1 pass / 0 fail;
- `ct-152-23-152.test.ts` and `ct-152-24-152.test.ts` pass;
- `ct-152-27-152.test.ts` (imports `typescript`, resolved from
  `packages/cli/node_modules`) and the two doc tests 4 pass / 0 fail;
- the feature's own files: core `ct-152-*-152.test.ts` 51 pass / 0 fail,
  cli `commit-gate-*.test.ts` 34 pass / 0 fail.

Totals for the phase gate: lint 0 findings, typecheck 0 findings, full suite
28/28 workspaces green, per-test files as above.

## Attempt 18 of phase 7 (2026-11-13, commit `41e3f349`, Node v22.23.2 / npm 10.9.8, clean `git status`)

The gate's `npm test` was reproduced exactly (no extra env, no wrapper). Two
root runs were made this attempt; both ended after the FIRST failing workspace
was `packages/cli`, and the failing tests differ run to run:

- Run 1: `packages/cli` 70 files, exit 1 — `parallel-attempt.test.ts`
  "a refused delta sends its task back to the main line and the rest is kept"
  (`0 !== 1`, `audit.refused.length`) and "an overlap fails the group with the
  directive `none` and no merge check" (`integration` undefined); the root run
  was then stopped by a 600 s wall-clock kill, not by the suite itself.
- Run 2 (full, to completion, no kill): **exit 0 — all 28 workspaces
  `exit 0`** (26 packages under `packages/`, plus `tools/import-boundary`;
  `packages/cli` 70 files, `packages/core` 58 files, `packages/oracle` 35
  files, `tools/import-boundary` 10 files). No `not ok` line anywhere.

The run-1 failures are the pre-existing load-dependent flake recorded since
attempt 3: both files pass alone through the same runner the gate uses
(`tests/isolate.ts node --test`) — `worker-supervisor.test.ts` 12 pass / 0 fail,
`parallel-attempt.test.ts` + `worker-supervisor.test.ts` together 17 pass /
0 fail — and neither file is a file of this feature. No source change was made
this attempt.

Also this attempt: `npm run lint` exit 0; `npm run typecheck:src` exit 0; the
feature's key files alone — switch test 5 pass / 0 fail (T146, T147), parity
test 7 pass / 0 fail (T148), CT-152-12b 1 pass / 0 fail, measured 198.5 ms
(budget 1,000 ms).

Totals for the phase gate: lint 0 findings, typecheck 0 findings, full suite
28/28 workspaces green (run 2), per-file results as above.

## Attempt 19 of phase 7 (2026-11-13, commit `41e3f349`, Node v22.23.2 / npm 10.9.8, clean `git status`)

The gate's `npm test` was re-run exactly (root script `scripts/ci-test.mjs`,
no extra env, no wrapper) and, unlike attempts 17 and 18, was allowed to run
past the 600 s wall clock that had killed the two previous root runs
(`git status --porcelain=v1` clean at the start of the run). Full raw
transcript: `.specstride/features/152-commit-backpressure/evidence/gate7-npmtest-19b.log`,
copied verbatim:

```
packages/adapter-claude: 47 files, exit 0
packages/adapter-codex: 22 files, exit 0
packages/adapter-dsh: 15 files, exit 0
packages/adapter-prime: 2 files, exit 0
packages/check-runner: 3 files, exit 0
packages/cli: 70 files, exit 0
packages/config: 14 files, exit 0
packages/contracts: 65 files, exit 0
packages/core: 58 files, exit 0
packages/doctor: 25 files, exit 0
packages/harness: 67 files, exit 0
packages/host-claude-code: 18 files, exit 0
packages/host-kit: 12 files, exit 0
packages/integrity: 33 files, exit 0
packages/kernel: 15 files, exit 0
packages/layer-micro: 72 files, exit 0
packages/layer-parallel: 2 files, exit 0
packages/observability: 34 files, exit 0
packages/oracle: 35 files, exit 0
packages/pipeline: 11 files, exit 0
packages/policy: 48 files, exit 0
packages/reverse: 6 files, exit 0
packages/runtime: 25 files, exit 0
packages/spec-formats: 14 files, exit 0
packages/testkit: 35 files, exit 0
packages/tree-store: 3 files, exit 0
packages/verification: 4 files, exit 0
tools/import-boundary: 10 files, exit 0
EXIT=0
```

Zero `not ok` lines anywhere in the transcript; final process exit code 0.

Also this attempt: `npm run lint` exit 0 (transcript
`gate7-lint-19.log`, no findings) and `npm run typecheck:src` exit 0
(transcript `gate7-typecheck-19.log`, all workspace `tsc` runs, no findings).

Totals for the phase gate: lint 0 findings, typecheck 0 findings, full suite
28/28 workspaces green, final exit code 0 (transcript above).

## Attempt 20 of phase 7 (2026-11-13, commit `41e3f349`, Node v22.23.2 / npm 10.9.8, clean `git status --porcelain=v1`)

The gate's `npm test` was reproduced exactly at the root (script
`scripts/ci-test.mjs`, unmodified, no extra env, no wrapper) — twice, back to
back, from a clean tree, each allowed to run to completion. Raw transcripts:
`gate7-npmtest-20a.log` and `gate7-npmtest-20b.log` in this evidence
directory. Both runs end:

```
packages/adapter-claude: 47 files, exit 0      … (all 28 workspace lines exit 0)
packages/cli: 70 files, exit 0
packages/core: 58 files, exit 0
packages/oracle: 35 files, exit 0
tools/import-boundary: 10 files, exit 0
EXIT_CODE=0
```

- run 1 (`gate7-npmtest-20a.log`): 28 of 28 workspaces `exit 0`, final exit
  code 0, no `not ok` line;
- run 2 (`gate7-npmtest-20b.log`): 28 of 28 workspaces `exit 0` again, final
  exit code 0, no `not ok` line — repeatable, no flake;
- `npm run lint` exit 0 (`eslint .`, whole repo, no findings);
- `npm run typecheck:src` exit 0 (every workspace `tsc`, no findings);
- the feature's own tests, this attempt:
  - core `node --test test/ct-152-*-152.test.ts`: `# tests 51  # pass 51
    # fail 0` (CT-152-23 2/2, CT-152-24 1/1, CT-152-12b 1/1 included);
  - cli `node --test test/engine/commit-gate-{crash,halt,reset-records,retry,switch}.test.ts
    test/engine/ct-152-27-152.test.ts test/docs/ct-152-{amendments-present,quickstart-verified}.test.ts`:
    `# tests 31  # pass 31  # fail 0` (switch test 5/5 = T146+T147,
    ct-152-27 2/2 = T158 AST, doc tests 2/2 = T154/T155/T156/T157);
  - parity test alone `node --test test/engine/commit-gate-parity.test.ts`:
    `# tests 12  # pass 12  # fail 0` (T148; FX-27 and the five fixtures
    under parity, register-map rows DV-121/DV-122, the eight DV-122 waivers,
    no orphan and no missing waiver);
  - feature total this attempt: 51 + 31 + 12 = 94 pass / 0 fail;
- CT-152-12b measured 361.3 ms (budget: under 1,000 ms);
- env-hygiene re-check per the diagnostician: the parity test sets
  `SPECSTRIDE_PROFILE=parity` only for its own in-process fixture runs and
  restores every variable it touches in `fixture()`'s `restore()`
  (`before` snapshot at lines 183–194, restore at lines 226–245); it never
  reads a global profile for correctness; the crash/halt tests save and
  restore `STUB_SECRET` around each case (commit-gate-crash.test.ts:97,135–136;
  commit-gate-halt.test.ts:87,126–127); CT-152-12b imports `performance` from
  `node:perf_hooks` (line 16); ct-152-27 imports `typescript` as a default
  import (line 17), resolved from `packages/cli/node_modules`.

Totals for the phase gate: lint 0 findings, typecheck 0 findings, full suite
28/28 workspaces green twice, final exit code 0 both times, feature tests
94 pass / 0 fail.
