# Verification record: feature 108 (Reverse specification)

The verification record of feature 108. It exists for the **out-of-band** tasks
of this feature — the tasks the owner's ruling of 2026-09-30 says are never run
and never faked inside a proposer pass — and it records, for each of them, what
was done here and what stays `unverified` with its reason.

The hermetic part of such a task is always done. Only the part that needs a
live host, a paid call, a person or a macOS runner stays `unverified`.

| Task | Phase | Kind | Hermetic part | Live part |
|---|---|---|---|---|
| T010 | 3 | live host | done, on Linux | `unverified` (below) |
| T032 | 7 | macOS runner | done, on Linux (per test) | `unverified` (below) |

## T010 — the detached reverse run (F108-FR-009, F108-SC-001)

T010 reads: *Own test CT-108-109 in `tests/characterization/108/detach.test.ts`:
a reverse run through the run request of kind `engine` survives the end of the
host session, and the source tree is byte-identical before and after (a skip
with its reason where no live host exists; `unverified` until the spike of
feature 122 passes).*

The task has two halves, and they are kept apart on purpose.

### The hermetic half — DONE, on Linux

Done in `tests/characterization/108/detach.test.ts`:

- **PT-108-028SC006-source-untouched**: the source tree is **byte-identical**
  before and after a reverse run, outside the output directory and the
  workspace part. The test hashes every regular file of the source with the
  canonical hasher of annex X §X.5 before the run and after it, and compares
  the two maps. It covers the dry run, the detached run and the foreground run.
- **CT-108-109 (hermetic part)**: the run request a detached reverse run makes
  is of kind `engine`, carries the one engine start and its arguments, and
  carries no launch contract — the properties of annex F §F.2 that make the run
  outlive the session that asked for it. The REQUEST is this feature's; the
  mechanism that keeps the run alive is feature 122's.

### The live half — `unverified`

| Fact | Requirement | Status | Reason | Check that would settle it |
|---|---|---|---|---|
| A run request of kind `engine` survives the end of the host session | F108-FR-009 | `unverified` | No live host exists in this checkout, and a live-host probe is out of band (the owner's ruling of 2026-09-30): it is never run here and never faked. The detach mechanism itself belongs to feature 122, which has not landed its spike. | The spike of feature 122: start a run request of kind `engine` from the host's shell tool, end the session, and confirm with `status` that the run lives. `verified-on`: —. `pin`: the host versions of the spike. |
| `status` shows the surviving run | F108-FR-009 | `unverified` | The same reason: the command `status` reads run state a live detached run writes, and no live run exists here. | The same spike. |

`specs/108-reverse/research.md` carries the same fact in its table of facts that
are `unverified`, with the same check.

The test file reports the live half as a **skip with its reason**, never as a
pass (the constitution, principle XVII). `tests/characterization/108/detach.test.ts`
holds this record to that: it fails if the record stops naming T010's live half
as `unverified`, so the record cannot quietly become a claim.

## T032 — the tests of this feature on the macOS runner (F108-FR-009, F108-FR-027)

T032 reads: *Run the parity tests and the characterization tests of this feature
on the macOS runner of the build workflow of feature 100 when it exists, and
record the result per test with the version of the system in
`tests/characterization/108/macos.md`; until then every macOS statement of this
feature stays `unverified`. A test whose prerequisite is missing (git, the
reference tree, the oracle, a live host for CT-108-109, a macOS runner) reports
a skip with its reason and never a pass (Principle XVII).*

The owner's ruling of 2026-09-30 puts the macOS runner part out of band: it is
never run inside a proposer pass and never faked. The task is complete when
this record exists.

### The hermetic part — DONE, on Linux

Every parity test and every characterization test of this feature was run, each
file on its own, and the result per file — tests, passes, failures, skips and
exit code — is recorded with the version of the system in
`tests/characterization/108/macos.md`. The system was Linux 7.0.14-15-pve
(x86_64) on Node.js v22.23.2, on 2026-10-02. The totals were **23 files, 449
tests, 417 passes, 0 failures, 32 skips** — parity 6 files / 210 tests,
characterization 12 files / 138 tests, the package's own unit tier 5 files /
101 tests — every file exit 0. Each of the 32
skips carries its reason — the comparison with feature 141's golden captures of
FX-30, which are not built; the live-host half of CT-108-109; the live half of
quickstart scenario 6 — and none of them is read as a pass.

`tests/characterization/108/records.test.ts` holds that record to account: it
reads `tests/parity/108/`, `tests/characterization/108/` and
`packages/reverse/test/` from disk, so a test file of this feature that is not
recorded fails the run, and it fails too if a
macOS cell stops saying `unverified` or if the record names a system other than
the one the run is on.

### The macOS runner part — `unverified`

| Fact | Requirement | Status | Reason | Check that would settle it |
|---|---|---|---|---|
| The tests of this feature pass on macOS as they do on Linux | F108-FR-001 to F108-FR-034 | `unverified` | The macOS runner part is out of band (the owner's ruling of 2026-09-30): it is never run here and never faked. The runner itself EXISTS — `.github/workflows/build.yml` carries `macos-latest` in its matrix (line 28) — but this working tree has no git remote and has never been pushed, so the workflow cannot be dispatched from here. A missing prerequisite is a skip with its reason, never a pass (Principle XVII). | A person dispatches feature 100's build workflow on a repository with `macos-latest` enabled, and the macOS job's record is committed as feature 100's T206 does it. `verified-on`: —. `pin`: the runner image and the `sw_vers -productVersion` of the run. |
| The git output forms the guard parses are the same on macOS | F108-FR-027, F108-FR-030 | `unverified` | `git status --porcelain` and `git rev-parse HEAD` are read as text, and the guard's fixtures pin the Linux forms. | The FX-30 guard fixtures on a macOS runner. |
| Opening a file without following links behaves the same on macOS | F108-FR-027, F108-FR-032 | `unverified` | The guard opens regular files with `O_NOFOLLOW`, whose error number differs between kernels. | `tests/characterization/108/guard-links.test.ts` on a macOS runner. |
| A run request of kind `engine` survives the end of the host session on macOS | F108-FR-009 | `unverified` | The same reason as T010's live half, and on macOS in addition. | The spike of feature 122, on macOS. |

`specs/108-reverse/research.md` carries the first three facts in its table of
facts that are `unverified`, with the same checks.
