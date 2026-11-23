# Research: Parallel engine services (feature 143)

Phase 0 of the plan. The research itself stays in `docs/ecosystem/`. This file records the
decisions of the plan and links to the reports. No unknown of the Technical Context is left open.

| Report | Used for |
|---|---|
| [R29](../../docs/ecosystem/research/R29-parallel-units-design.md) | The design, rules PU-05 to PU-07, PU-18 to PU-36, PU-38, PU-41, PU-42, PU-46, PU-47, PU-55 to PU-59, PU-64, PU-65; the probe F-6 |
| [R29v](../../docs/ecosystem/research/R29v-parallel-units-red-team.md) | Rules PU-80, PU-81, PU-85, PU-88, PU-90, PU-93 to PU-97, PU-100, which stand over R29; items O-1, O-2, O-4, O-5, closed by rulings P1, P6, P7 |
| [R11](../../docs/ecosystem/research/R11-security-threat-model.md) | Controls R-1 and R-2; threat T-26 (the identity check before a signal) |
| [R14](../../docs/ecosystem/research/R14-quotas-cost-observability.md), [R24](../../docs/ecosystem/research/R24-warm-start-context-carry-over.md) | Quota signals; the drop rules of session continuation |

## D-1 Composition, not merge

- **Decision**: the composed tree is built by replacing entries of the base tree; deltas must be pairwise disjoint by path.
- **Rationale**: R29v V-10. A content merge can start a merge driver, detect renames and depend on order.
- **Alternatives considered**: the three-way merge of R29 PU-47 (amended by PU-80); a model that resolves conflicts (excluded by decision 21).

## D-2 A repository of its own per worker tree

- **Decision**: the repository directory lies inside the worker tree and borrows the objects of the store read-only.
- **Rationale**: ruling P6; R29v V-06. A linked worktree puts the worker's repository directory in the control plane, inside a proposer's write scope.
- **Alternatives considered**: linked worktrees of the store (R29 PU-23); plain directory copies without a repository.

## D-3 The git floor

- **Decision**: 2.31, stated by the doctor check `bin.git.version`
  (`packages/tree-store/src/doctor.ts`). **Verified** on 2026-10-02 by task T002; no longer
  `unverified`.
- **Rationale**: with composition the floor is what a snapshot needs (R29v PU-80).
- **Alternatives considered**: keep 2.38 of R29 (needlessly strict); no floor (a failure in the
  middle of a group).

### The result of task T002 — the probe on the floor version

Task T002 ran the probe of task T001, `CT-143-132`
(`tests/characterization/143/ct-143-132-probe.test.ts`), on the floor version itself. The probe
takes the git executable from the variable `SPECSTRIDE_143_PROBE_GIT`, so one test file serves
both runs and nothing about the probe differs between them except the executable.

| Run | git | Probe | Snapshot tree id | `%aI` of the store commit |
|---|---|---|---|---|
| The floor | **2.31.0**, built from source with `NO_CURL NO_OPENSSL NO_GETTEXT NO_TCLTK NO_PERL NO_PYTHON NO_EXPAT BLK_SHA1` | **pass**, 7/7 | `0e3fb8d48cbf1055e8caa412515ccbdbfb25e76c` | `1970-01-01T00:00:00+00:00` |
| The machine | 2.47.3 (Debian trixie) | **pass**, 7/7 | `0e3fb8d48cbf1055e8caa412515ccbdbfb25e76c` | `1970-01-01T00:00:00Z` |

What the two runs establish:

1. **2.31 holds as the floor.** Every observation of the probe is true on 2.31.0: the hashes of
   all 29 files under the project's repository directory are equal before and after, the reported
   status of the working tree is equal, no reference was made, the project cannot see the snapshot
   commit at all, every object of the snapshot is present in the store, the worker tree has a
   repository of its own, and it borrows the store's objects read-only. The commands the design
   needs — `hash-object -w --no-filters --stdin`, `update-index --index-info` against a temporary
   index, `write-tree`, `commit-tree`, `ls-tree -r --full-tree`, `cat-file blob`, and
   `objects/info/alternates` — are all present and behave alike on both versions.
2. **The snapshot tree id and the store commit id are byte-identical across the two versions.**
   The store is therefore portable across the supported range, and a tree id recorded in the
   ledger by one version means the same tree to another (F143-FR-025 reads tree ids back after a
   relaunch).
3. **One difference was found, and it is a presentation difference, not a behaviour difference.**
   `%aI` renders the fixed UTC instant as `+00:00` on 2.31.0 and as `Z` on 2.47.3. The instant
   itself (`%at`, `%ct`) is `0` on both. **The product must therefore compare the date of a store
   commit as an instant and never as a rendered string** (F143-FR-003, the fixed author, date and
   message). The probe asserts the instant and accepts either rendering;
   `FIXED_COMMIT.datesAsGitPrintsThem` in `tests/characterization/143/support/probe-git.ts`
   records both forms and why.
4. **Two environment variables of the hardening are newer than the floor.**
   `GIT_CONFIG_GLOBAL` and `GIT_CONFIG_SYSTEM` arrived in git 2.32, one minor version above the
   floor, so they cannot be what removes the global configuration (F143-FR-004). The probe moves
   `HOME` and `XDG_CONFIG_HOME` to an empty directory and sets `GIT_CONFIG_NOSYSTEM=1`, which
   works from 2.31 down; it still sets the two newer variables, but relies on neither. Task T007
   inherits this.

The recorded results are
`.specstride/features/143-parallel-engine-services/gates/proofs/probe-on-the-floor-2.31.0.json`
and `probe-on-2.47.3.json`; each is written by the probe itself, and its field `result` is
computed from the observations rather than asserted, so the file cannot read `pass` unless they
hold.

**How to repeat it**:

```text
SPECSTRIDE_143_PROBE_GIT=/path/to/git-2.31/bin/git \
  node --test "tests/characterization/143/**/*.test.ts"
```

## D-4 The application writes bytes itself

- **Decision**: the store code reads each object and writes it to the workspace by temporary name and rename; no checkout and no patch.
- **Rationale**: R29v PU-81; ruling P1: no index, no reference.
- **Alternatives considered**: applying a difference as a patch (R29 F-6; fails on binary files and honours attributes).

## D-5 Where the engine services live

- **Decision**: the tree store is an edge package behind `specstride.tree-store/1`; the group executor and integration are modules of the core.
- **Rationale**: the core may not start a process (architecture section 6); the engine owns the executor (PU-07). The package graph of feature 100 holds the package `@specstride/tree-store` (layer L1, owner 143, may start a process); the core receives the store through an interface of the `contracts` package (F100-FR-234).

## D-6 Test names

- **Decision**: `CT-143-<100+n>` for requirement n; `CT-143-129` to `CT-143-132` for the conformance test, the kill test, the property test and the probe.

## D-7 Facts that stay `unverified`

| Fact | Check | Who captures it |
|---|---|---|
| Every macOS statement | The macOS runner of the release | The release |
| ~~The git floor~~ — **captured on 2026-10-02**, D-3 | The probe on the floor version | This feature, task T002 (done: `CT-143-132` passes on 2.31.0) |
| A sandbox confines the harness's own file tools to the write root it was given | A worker at C2 tries to write the workspace with its edit tool | The harness adapter features |

### The result of task T070 — the platform run (2026-10-05)

The task asks for a run of `tests/characterization/143` and of the cases of this feature in
`packages/testkit/src/conformance/EP-04` on macOS. **The macOS part is `unverified` and stays
`unverified`: no macOS runner was available to this work, and the owner's ruling of 2026-09-30
(see the campaign scope in this feature's progress notes, and the tasks of phase 6) forbids
faking it.** The reason, stated plainly: this pass ran on Linux only (Debian trixie, git
2.47.3, Node v22.23.2); the macOS statements of the plan (copy-on-write copies, process
groups, the place of the worker root) can be confirmed only by the macOS runner of the
release, which is who captures the fact in the table above. Every macOS statement therefore
remains `unverified` until that runner passes.

The hermetic part of the task — the same two bodies of tests on Linux — was run and passes:

| Body of tests | Command | Result |
|---|---|---|
| `tests/characterization/143` (32 files) | `npm run test` (whole suite, which contains it) | exit 0 — 2228 tests, 2201 pass, 0 fail, 27 skipped; the 27 skips are the pre-existing feature-111/144 prerequisite skips |
| The cases of this feature in `packages/testkit/src/conformance/EP-04` | `node tests/isolate.ts node --test packages/testkit/src/conformance/EP-04/ct-143-129-tree-store.test.ts` | exit 0 — 17 tests, 17 pass, 0 fail |

The Linux run says nothing about macOS and is not a substitute for it; it is recorded here
only as the part of T070 that could be done hermetically.
