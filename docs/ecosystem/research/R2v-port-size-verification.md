# R2v — port size and language verification

Independent check of `docs/ecosystem/research/R2-port-inventory-language-fit.md` (and its script
`docs/ecosystem/research/scripts/R2-estimate.sh`). Date: 2026-09-29. Verifier saw only the finished
report. No source repository was modified, no package was installed, no paid model call was made.

Summary of the verdict:

- **Counts: confirmed exactly.** Every `cloc` figure in R2 F-3 reproduces to the line.
- **Inventory: complete for code files**, with gaps for non-code product assets and one estimate
  inconsistency (about 300 estimated lines for two files R2 itself says are not ported).
- **Conversion factors: R2's statement that no calibration pair exists is wrong.** Lisa contains
  self-declared ports of six Specstride modules. They give a Python to TypeScript ratio of 0.69 to 1.11
  (pooled 0.94). R2's 1.10 is at the top of that range, and its low bound of 1.00 is too high.
- **Language candidates:** all four rejections survive. The one proposed ledger entry (Bash shim) is
  challenged and stays TypeScript until the owner rules.
- **Lock design: R2's claim of "the same observable behaviour" does not hold.** Three defects were
  reproduced locally, and two pure-Node alternatives with kernel-released semantics were found.

## Method

All commands were run by the verifier on its own archives under `/tmp/specstride-research/R2v/`.

```bash
export LC_ALL=C LANG=C
S=/tmp/specstride-research/R2v; mkdir -p $S/ss $S/mol $S/lisa $S/ss-old $S/node
git -C /root/specstride       archive 9cab15d | tar -x -C $S/ss
git -C /root/mixture-of-loops archive 9c88f86 | tar -x -C $S/mol
git -C /root/lisa             archive 363e6a3 | tar -x -C $S/lisa
git -C /root/specstride       archive 8f57cec | tar -x -C $S/ss-old   # calibration, see below

# Recount: R2 F-2 commands (a) to (e), unchanged
cd $S/ss && cloc --quiet --by-file --csv --force-lang="Bourne Again Shell",sh \
  orchestrator.sh proposer.sh specstride specstride-digest.sh specstride-lib.sh wiggum wiggum-lib.sh
cd $S/ss && cloc --quiet --by-file --csv --include-lang=Python --exclude-dir=fixtures \
  --not-match-f='^(test_.*|_test_.*|conftest)\.py$' lib
cd $S/ss && cloc --quiet --csv --include-lang=Python --exclude-dir=fixtures \
  --match-f='^(test_.*|_test_.*|conftest)\.py$' lib
cd $S/mol && cloc --quiet --by-file --csv --include-lang=Python skills
cd $S/mol && cloc --quiet --by-file --csv bin/onboard-skill
cd $S/mol && cloc --quiet --csv --exclude-dir=repos,implementations --include-lang=Python,JavaScript tests

# Cross-checks
cloc --quiet --csv $S/ss --exclude-dir=fixtures ; cloc --quiet --csv $S/mol
cat <the 7 drivers> | wc -l ; ls lib/*.py | grep -v test | xargs cat | wc -l   # raw lines

# Inventory
git -C /root/specstride ls-tree -r --name-only 9cab15d        # plus a first-line shebang scan
git -C /root/mixture-of-loops ls-tree -r --name-only 9c88f86  # plus a first-line shebang scan

# Calibration
grep -rn -i -E "port(ed)? (of|from)|baseline" $S/lisa/packages/*/src --include=*.ts
git -C /root/specstride rev-list -1 --before='2026-07-28 00:00' 9cab15d     # -> 8f57cec
git -C /root/lisa log --format=%h --diff-filter=A -- <file>                  # first-add commit
git -C /root/lisa show <first-add>:<file> > $S/tmp/x.ts ; cloc --quiet --csv $S/tmp/x.ts

# Node and registry (read-only)
node -e '...typeof fs.flock, fs.fcntl...'
node pg.js ; node esc.js ; node race.js ; node sq.js ; node us.js       # scripts in $S/node
npm view <pkg> version license scripts.install dependencies optionalDependencies dist.unpackedSize
npm pack node-pty@1.1.0 --dry-run --json                                   # tarball file list only
```

Tool versions: cloc 2.04, Node v22.23.2 (LTS "Jod", bundled SQLite 3.51.3), Linux x86_64, root
filesystem ZFS, `/tmp` tmpfs, `pid_max` 4,194,304.

Note on one test: `esc.js` cleaned up with `pkill -f "sleep 61"`, which also matched the verifier's own
shell (exit 144). Only the verifier's own processes were affected; an unrelated `sleep 60` owned by a
system daemon was inspected with `ps` and left alone. The lesson for the product is in "Lock design
risks" item 8: never signal by command-line pattern.

## Recount

`verified-local` for every row: commands above, run 2026-09-29.

| Set | Files (R2) | Files (R2v) | cloc code (R2) | cloc code (R2v) | Difference | Raw lines (R2) | Raw lines (R2v) |
|---|---:|---:|---:|---:|---:|---:|---:|
| Specstride Bash drivers | 7 | 7 | 4,128 | 4,128 | 0 | 6,070 | 6,070 |
| Specstride product Python | 27 | 27 | 13,248 | 13,248 | 0 | 18,146 | 18,146 |
| mixture-of-loops product Python | 7 | 7 | 3,283 | 3,283 | 0 | 4,072 | 4,072 |
| mixture-of-loops Bash | 1 | 1 | 273 | 273 | 0 | 316 | 316 |
| **Product total** | **42** | **42** | **20,932** | **20,932** | **0** | 28,604 | 28,604 |
| Specstride test Python | 47 | 47 | 12,944 | 12,944 | 0 | 19,787 | 19,787 |
| mixture-of-loops tests | 16 | 16 | 6,177 | 6,177 (Python 6,065 + JavaScript 112) | 0 | not measured | not measured |
| **Test total** | **63** | **63** | **19,121** | **19,121** | **0** | | |

Per system and language:

| System | Language | R2 | R2v | Difference |
|---|---|---:|---:|---:|
| Specstride | product Python | 13,248 | 13,248 | 0 |
| Specstride | product Bash | 4,128 | 4,128 | 0 |
| Specstride | tests | 12,944 | 12,944 | 0 |
| mixture-of-loops | product Python | 3,283 | 3,283 | 0 |
| mixture-of-loops | product Bash | 273 | 273 | 0 |
| mixture-of-loops | tests | 6,177 | 6,177 | 0 |

Per-file figures: all 27 + 7 + 7 + 1 per-file `code` values in R2's three port-map tables match the
verifier's `--by-file` output.

Cross-checks:

| Check | R2 | R2v | Tag |
|---|---|---|---|
| Whole Specstride tree, `--exclude-dir=fixtures`, Python | 26,192 | 26,192 (74 files = 27 + 47) | `verified-local` |
| Whole Specstride tree, shell | 3,578 + 550 = 4,128 | 3,578 + 550 = 4,128 | `verified-local` |
| Whole mixture-of-loops tree, Python | not stated | 9,360 in 24 files = 3,283 product + 6,065 tests + 12 in the two excluded fixture files | `verified-local` |
| Estimate arithmetic (F-6), recomputed by hand from the factors | 21,894 / 19,586 / 25,850 | same | `verified-local` |
| `python3` occurrences in drivers (F-7) | 27 / 27 / 18 / 14 = 86 | 27 / 27 / 18 / 14 = 86 | `verified-local` |
| Inline Python sites (F-7) | 17 | 17 (11 heredoc blocks + 6 `python3 -c`) | `verified-local` |
| Lisa non-test TypeScript under `packages/` | 32,522 in 160 files | 32,677 in 161 files | `verified-local`; difference +155 lines, 1 file. R2 did not state its exclude rule, so the verifier's filter (`--not-match-f='\.(test|spec)\.ts$'`, excluding `node_modules,dist,__tests__,test,tests`) may differ. Context figure only; it enters no estimate |

mixture-of-loops has 15 Python test files because the two extensionless stubs
`tests/e2e/stub-bin/specstride` and `tests/e2e/exec-stub-bin/specstride` carry a Python shebang and
`cloc` classifies them by it. `verified-local`.

## Inventory completeness

**Code files: complete, none missing, none double-counted.** `verified-local`.

| Baseline set | Tracked at baseline | In R2's map | Missing | Double-counted |
|---|---:|---:|---|---|
| Specstride `lib/*.py`, non-test, outside `lib/fixtures/` | 27 | 27 | none | none |
| Specstride Bash drivers (shell shebang, outside fixtures) | 7 | 7 | none | none |
| mixture-of-loops `skills/mixture-of-loops/scripts/*.py` | 7 | 7 | none | none |
| mixture-of-loops shell scripts | 1 (`bin/onboard-skill`) | 1 | none | none |

R2 F-4 (only one tracked shell-shebang file in mixture-of-loops) is confirmed. The prompt's "2k of
Bash" for mixture-of-loops is not supported at `9c88f86`.

**Gaps, in order of weight:**

1. `inferred` from R2's own tables. **The estimate counts two files that R2 says are not ported.**
   `specstride-digest.sh` (81 code, 69 estimated) is "not ported as is", and `bin/onboard-skill`
   (273 code, 232 estimated) is "mostly replaced by plugin packaging". Both still carry factor 0.85 in
   the script. Up to 301 estimated lines are therefore overstated. They should be zero-rated or given
   an explicit partial factor, as `wiggum` and `specstride_env.py` were.

2. `verified-local`. **Non-code product assets have no row and no destination.** R2's exclusion rule
   is stated, so this is not a counting error, but these are shipped behaviour and each needs a
   destination in the consolidation map:

   | Asset | Size | Why it matters |
   |---|---:|---|
   | `skills/mixture-of-loops/assets/launch-contract.schema.json` | 172 lines | The launch contract schema. R2 maps `contract_lib.py` to `contract/{schema,validate}` but the schema file itself is unlisted |
   | `skills/mixture-of-loops/SKILL.md`, `references/contract.md`, `references/derivation.md` | 377 + 284 + 171 lines | Skill prose is the product for a host plugin |
   | `skills/mixture-of-loops/agents/openai.yaml` | 6 lines | Harness-specific agent descriptor |
   | `lib/speckit_templates/*.md` | 5 templates, 591 lines | Shipped templates |
   | `telemetry/` | dashboard JSON 865 lines, compose and collector configuration | Shipped observability stack |
   | `.env.example` | | Configuration surface |

3. `verified-local`. **Python inside Bash is rated with the Bash factor.** The drivers hold 400 lines
   of Python in 11 heredoc blocks (`proposer.sh` 295, `orchestrator.sh` 57, `specstride` 48). At 1.10
   instead of 0.85 that is +100 estimated lines. The drivers also hold 349 lines of heredoc text
   (prompts and messages) that port one-to-one. So about 18 % of driver code (749 of 4,128) will not
   shrink, which pushes the realistic Bash factor toward the top of R2's range.

4. `verified-local`. **Test support files that are not tests** sit inside the 6,177: `tests/e2e/*.py`
   helpers, `tests/fixtures/derive_expectations.py`, the two stub executables and
   `tests/harness_probe.mjs`. They are already counted; the point is that "63 test files" is not 63
   test suites.

5. `verified-local`. `lib/fixtures/**` holds 281 Python, 35 shell and 476 JSON code lines that the
   parity oracle will need. R2 excludes them by rule; R15 should size them.

## Conversion factors

**R2 F-5 says: "No pair of modules with equal behaviour exists in Python and TypeScript to calibrate
on." This is contradicted by the Lisa tree.** `verified-local`. Lisa modules declare themselves ports
of Specstride (then named differently) modules:

| Lisa file at `363e6a3` | Line | Text |
|---|---:|---|
| `packages/otel/src/loki.ts` | 3 | "Port of the baseline `lib/ralph_loki_ship.py`" |
| `packages/tui/src/presenter.ts` | 8 | "the TypeScript port of the baseline `lib/present.py`" |
| `packages/core/src/critic/grounding.ts` | 2 | "A faithful TypeScript port of the baseline critic's grounding pass" |
| `packages/specs/src/wiggum/adapter.ts` | 4 | "a BYTE-EQUIVALENT port of the baseline single-source-of-truth parser" |
| `packages/specs/src/resolve.ts` | 4 | "Ported from the baseline", naming functions and line ranges in the Python and in `orchestrator.sh` |

The ports were first committed on 2026-07-28. The matching Specstride tree is the last commit before
that date, `8f57cec` (2026-07-27). Comparing the 2026-09-29 Python with these ports would be wrong,
because the Python has since grown about threefold (`critic.py` 573 to 1,631 code lines). The table
compares the Python at `8f57cec` with each TypeScript file **at its first-add commit**.

| Python at `8f57cec` | code | TypeScript at first add | code | Ratio | Caveat |
|---|---:|---|---:|---:|---|
| `lib/agent_stream.py` | 198 | `agents/src/claude-agent-sdk/tap.ts` (`3d2f6ff`) | 136 | 0.69 | Scope probably narrower (one stream format) |
| `lib/present.py` | 546 | `tui/src/presenter.ts` (`3d2f6ff`) | 436 | 0.80 | With `tui/src/modes.ts` (138 at `363e6a3`) the ratio is 1.05 |
| `lib/ralph_loki_ship.py` | 184 | `otel/src/loki.ts` (`b4cbdd7`) | 154 | 0.84 | The Python `stream` mode's human summary is not in this file |
| `lib/ralph_otel_ship.py` | 308 | `otel/src/otlp.ts` (`b4cbdd7`) | 286 | 0.93 | With `metrics.ts` (215) the ratio is 1.63, but metrics is new function |
| `lib/critic.py` | 573 | `core/src/critic/grounding.ts` + `verdict.ts` (`f4d4eac`) | 438 + 174 = 612 | 1.07 | Excludes transports. With the provider files it would be about 1.6, but those serve more than the critic |
| `lib/wiggum_spec.py` | 425 | `specs/src/wiggum/adapter.ts` + `resolve.ts` (`354cb6d`) | 268 + 203 = 471 | 1.11 | Only pair that claims byte equivalence. `resolve.ts` also absorbs about 75 lines of `orchestrator.sh`; with those in the denominator the ratio is 0.94 |
| **Pooled** | **2,234** | | **2,095** | **0.94** | |

All rows `verified-local` for the counts; the pairing itself is `inferred` from the header comments.

What the calibration supports and what it does not:

- **Range 0.69 to 1.11, pooled 0.94.** R2's central factor 1.10 lies at the upper edge. R2's
  sensitivity floor of 1.00 is above the pooled measurement.
- **It is a weak calibration.** Behavioural equality is claimed by the port authors, not proven by
  the verifier. Only one pair claims byte equivalence, and it has the highest ratio. The modules were
  small (184 to 573 lines); today's largest modules (`verification_plan.py` 2,003, `learn.py` 1,614)
  may behave differently. Lisa's ports are comment-heavy, which `cloc` excludes and so does not bias
  the ratio, but it shows that the raw-line size of the port will exceed its code-line size by a wide
  margin (Lisa: 9,257 comment lines against 32,677 code lines).
- **Direction of the likely bias:** ports with narrower scope push the ratio down. So the true
  like-for-like factor is probably above 0.94 and at or below 1.10.
- **Bash: no clean pair exists.** `resolve.ts` absorbs one Bash function group and Lisa's engine
  (`phase-loop.ts` 1,056, `lifecycle.ts` 174, `proposer-context.ts` 279) has a different scope from
  `orchestrator.sh` at `8f57cec` (634). The 0.85 factor remains `unverified`. Inventory gap 3 argues
  for the upper half of R2's 0.70 to 1.00 range.

Ruling within the verifier's remit: the counts stand as verified; the factor **range** for Python
should be widened downward to 0.80 to 1.30 with a central value of 1.00 to 1.10. R2's open question 3
(a calibration port early in implementation) stays valid but should start from these six pairs.

## Language candidates challenged

Node claims checked locally on v22.23.2, all `verified-local` unless marked:

| R2 claim | Result |
|---|---|
| F-8: no `flock` or `fcntl` in core | **Confirmed.** `typeof fs.flock`, `fs.fcntl`, `fs.flockSync` are all `undefined`; no key of `fs` matches `/lock\|fcntl/i` |
| F-14: `spawn({detached:true})` makes a new session and group | **Confirmed.** Child and both grandchildren had pgid = sid = child pid; the parent's differed |
| F-14: `process.kill(-pgid)` signals the group | **Confirmed.** No process remained; `process.kill(-pgid, 0)` then gave `ESRCH` |
| F-14, not stated by R2 | **A grandchild that calls `setsid` escapes the group kill.** `bash -c 'setsid sleep 61 & ...'` survived `process.kill(-pid,'SIGTERM')`. Specstride's own long job does exactly this (`specstride-lib.sh` line 471, `setsid nohup`). The supervisor needs a pid-file or process-tree path besides group signalling. This is the same in Python today, so it is parity, but the port map should say so |
| F-12: the only PTY use is `runtime.py` line 346 | **Confirmed** by grep over both trees (`pty`, `openpty`, `forkpty`, `script -q`, `unbuffer`, `stdbuf`). The guard at line 341 is as quoted |
| F-12: the PTY is not needed after consolidation | **Holds for this use.** `inferred`. It does not cover third-party harness CLIs that change output or refuse to run without a terminal; R2 defers that to the adapter reports, which is correct, so the claim is narrower than "no PTY is needed" |
| F-13: `node-pty` 1.1.0 has no Linux prebuild | **Confirmed.** `npm pack --dry-run --json` lists `prebuilds/` for `darwin-arm64`, `darwin-x64`, `win32-arm64`, `win32-x64` only; unpacked size 64,363,742 bytes; install script `node scripts/prebuild.js \|\| node-gyp rebuild` |
| F-13: `@lydell/node-pty` 1.2.0-beta.15 | **Confirmed**: no install script, six per-platform optional dependencies. Added: the Linux package declares `os` and `cpu` but no `libc`, so musl support is `unverified` |
| F-13, not listed by R2 | `@homebridge/node-pty-prebuilt-multiarch` 0.14.1 (MIT) uses `prebuild-install`, which downloads binaries at install time and falls back to compiling. A third option, with a network dependency at install |
| F-9: `fs-ext` 2.1.1 | **Confirmed**: install script `node-gyp configure build`, dependency `nan`, no licence field in the registry record |
| F-9: `proper-lockfile` 4.1.2 | **Confirmed**: MIT, no install script. Registry `time.modified` is 2022-06-24; unmaintained for years |

Each candidate, argued from the opposite side:

| # | Candidate | R2 verdict | Opposite case | Does R2's conclusion survive? |
|---|---|---|---|---|
| 1 | Generated launcher as a **Bash** shim | Propose | The shim buys nothing. It needs `node` on `PATH` anyway, and `#!/usr/bin/env node` resolves it the same way. Its three jobs (locate its own directory, pass arguments, `exec`) were reproduced by an extensionless Node file with a shebang: it ran, resolved its directory and passed arguments (`verified-local`). The content-hash header works in a `//` comment as well as in a `#` comment. A Bash shim adds a second language, a quoting surface and a Bash version dependency (macOS ships 3.2) for no measured gain, which is exactly what decision 2 asks a ledger entry to justify. The only argument for Bash is continuity with `011`'s launcher shape and a host that insists on a shell script; neither is evidenced | **Challenged.** Per the rule, the launcher stays TypeScript (a Node-shebang file) until the owner rules. If R3 or R19 shows a host that can only run a shell file, the ledger entry returns with that evidence. Product share becomes 100 % TypeScript |
| 2 | Run lock as a **C++ addon** (`fs-ext`) | Reject | The kernel lock is the only design that is correct by construction: released on death, held by the whole process tree, no reclaim logic. R2's replacement is shown below to differ in behaviour and to race | **The rejection survives; the reasoning does not.** A compile-at-install addon with no prebuilds and no licence field is unacceptable under decision 19. But "gives the same observable behaviour" is false (see "Lock design risks"). Kernel-released locking is available without any npm native module; see the alternatives there |
| 3 | PTY as a **C++ addon** (`node-pty`) | Reject | Some CLIs buffer differently, drop progress output or refuse to start without a terminal. If one required harness does, the product needs a PTY on day one | **Survives** for the core. The need is unproven and the cost is confirmed. It should be recorded as an adapter-level extension point: an adapter that needs a PTY brings it as an optional dependency, so the core stays free of native code |
| 4 | Detached runtime and supervisor in **Go** | Reject | A supervisor that lives for hours should be small and boring. Measured idle Node RSS is 30.9 MB (`verified-local`); a Go binary would be a fraction. Go reads pgid and sid directly, where Node must call `ps`. Go gives real `flock`, which removes the whole lock problem. Node cannot make itself a session leader; it must be spawned detached by a parent | **Survives.** 30 MB for one process per run is not material next to harness CLIs. The `flock` argument is the strongest, and it is answered by the pure-Node alternatives below. The cost (six prebuilt binaries, a second toolchain, a cross-language contract) is real. Go is installed on this machine, so R17 can measure if it wants to reopen this |
| 5 | Inventory walk and hashing in **Rust or Go** | Reject | Large repositories in reverse mode hash many files | **Survives, now with a measurement.** Node `crypto` SHA-256 over 512 MiB took 880 ms (582 MB/s) against 760 ms for `sha256sum` on the same file (`verified-local`). The gap is 16 %, inside noise for a step that is not on the critical path |
| 6 | Keep `learn.py` in **Python** | Reject | 1,614 lines of statistics logic is the largest porting risk for silent numeric drift (rounding, percentile interpolation) | **Survives.** The module is standard library only. Requiring Python 3 on the consumer's machine breaks npm-only installation. The drift risk is real and belongs to the parity oracle: `learn.py` should have golden numeric fixtures |

Candidates R2 did not examine:

| Candidate | Finding | Tag |
|---|---|---|
| `better-sqlite3` through a reused Lisa package | R2 lists it as open question 4 but not as a candidate. It is a C++ addon and would be the product's first native dependency. It needs a ledger row or a replacement if R1 recommends reusing `@lisa/persistence` | `verified-local` (R2's evidence, not re-read) |
| `node:sqlite` (built into Node) | Present in v22.23.2 and works, but prints `ExperimentalWarning: SQLite is an experimental feature`. It is not a second language and needs no ledger entry, but it is an experimental API. Relevant both as a replacement for `better-sqlite3` and as a lock primitive | `verified-local` |
| Shelling out to `ps`, `pgrep`, `git`, `flock(1)` | Not a language choice, but each is an undeclared platform dependency with keyword differences between procps and macOS. They should be listed in one platform-dependency table in `architecture.md` | `inferred` |

## Lock design risks

R2 recommends "an atomic directory lock whose owner record holds pid and process start time" and says
in the options table that it "gives the same observable behaviour" as the kernel lock. It cites Lisa's
`packages/cli/src/layout.ts` as the working precedent. The verifier finds the recommendation
incomplete and the equivalence claim false.

| # | Risk | Evidence | Tag | Severity |
|---|---|---|---|---|
| 1 | **Reclaim race: several contenders all win.** The cited precedent does `mkdir`; on `EEXIST` reads the owner; if dead, `rmSync` then `mkdirSync`. Contender B can remove the directory that contender A has just re-created | The algorithm at `layout.ts` lines 141-183 was re-implemented in scratch (`race.js`). 8 contenders racing for one stale lock, 300 rounds: **297 rounds ended with more than one winner**, 0 with none | `verified-local` | High. Two runs in one working tree |
| 2 | **Owner-file window.** The owner file is written after `mkdir`. A contender that arrives in between reads no pid; the precedent treats "unknown owner" as stale and reclaims (lines 156-162), stealing the lock from a live process | `layout.ts` lines 149, 155-162, 173-178 | `verified-local` for the code, `inferred` for the outcome | High |
| 3 | **A kernel lock is held by the process tree; a pid lock is held by one process.** Today `proposer.sh` and its children inherit the lock descriptor (`orchestrator.sh` comment after line 521; `specstride-lib.sh` lines 445-447). If the orchestrator dies and a proposer or harness child lives on, the lock stays held. With a pid record, the owner is dead, the lock is reclaimed, and a second run starts while the orphan still writes to the working tree | Reproduced: owner killed with SIGKILL, its child alive, `flock -n` probe still reported held; it became free only when the child exited | `verified-local` | High. This is the behavioural difference R2 did not list. Node also opens descriptors close-on-exec (`verified-local`: a spawned child did not see the parent's descriptor), so inheritance cannot be relied on by accident |
| 4 | **Pid reuse.** Pid plus start time is sound within one boot. `/proc/<pid>/stat` field 22 is ticks since boot, so after a reboot the same pair can recur for an early-started process | `backend_overlay.py` lines 289-302; `pid_max` 4,194,304 here; macOS default is far smaller | `inferred` | Medium. Add the boot identifier (`/proc/sys/kernel/random/boot_id` on Linux, `kern.boottime` on macOS) to the owner record |
| 5 | **Liveness fallbacks fail open.** `owner_is_live` in `backend_overlay.py` treats an unreadable start time as live, which is safe. The Lisa precedent treats an unknown owner as dead, which is unsafe. The specification must state which side each unknown falls on. A zombie owner answers `kill(pid, 0)` as alive | code read | `verified-local` | Medium |
| 6 | **macOS start time.** `ps -o lstart=` has one-second resolution and a locale-dependent format | not testable here | `unverified` | Medium |
| 7 | **Pid namespaces and shared volumes.** A working tree mounted into a container, or shared between host and container, carries a pid that means nothing, or something else, on the other side | reasoning from pid namespaces | `inferred` | Medium. Owner record needs a host and namespace identity; a foreign identity must never be reclaimed automatically |
| 8 | **NFS and other network filesystems.** `mkdir` is atomic on NFS, so acquisition is fine. Liveness probing is not possible across hosts, so a lock owned from another host can never be proven stale. `proper-lockfile`'s mtime heartbeat depends on clock agreement and attribute caching | reasoning; this machine has ZFS and tmpfs only | `unverified` | Medium. Rule: different hostname in the owner record means "held", with a manual `unlock` command |
| 9 | **Release on exit.** Today's `mkdir` fallback releases through an EXIT trap. In Node, handlers do not run on SIGKILL or an out-of-memory kill, and `process.on('exit')` permits synchronous work only | Node process documentation, read by R2; not re-read | `inferred` | Low; this is what reclaim is for |
| 10 | **The blocking lock.** `dsh_plugin_requests.py` line 89 blocks until it gets the lock. "Acquire with retry" needs a bound and an outcome for timeout, which today cannot occur | code read | `verified-local` | Low |

**Pure-Node alternatives with kernel-released semantics, not considered by R2.** Both were tested
(`verified-local`, scripts `sq.js` and `us.js`):

| Alternative | Test result | Limits |
|---|---|---|
| **`node:sqlite` exclusive transaction** on a lock database. SQLite takes POSIX locks itself | Holder alive: second process got `database is locked`. After SIGKILL of the holder: second process acquired at once. No stale state, no reclaim code | Experimental API in Node 22 (warning printed). POSIX locks are per process, so children do not hold it (risk 3 remains). SQLite's own documentation warns about network filesystems |
| **Unix domain socket as the liveness signal.** Owner listens on `lock.sock`; a contender connects | Holder alive: connect succeeded. After SIGKILL: `ECONNREFUSED`, socket file still present. So "stale" is decided by the kernel, not by a pid | The stale file must be unlinked and re-bound, which needs the `mkdir` mutex around it. Socket path limit is about 104 bytes on macOS. Not usable on network filesystems |

Recommended shape for the specification (`inferred` from the above): keep the atomic `mkdir` for
mutual exclusion, replace pid probing with a kernel-backed liveness signal where the filesystem is
local, reclaim by **atomic rename** of the stale directory to a unique name (only one contender's
rename succeeds) and never by remove-then-create, write the owner record into a temporary directory
and rename it into place so a lock never exists without an owner, and track the run's process group
as well as the owner pid so risk 3 is detected ("owner dead, group alive" is a distinct outcome that
refuses to start and names the survivors).

## Figures that stand corrected

| Figure | R2 | R2v | Status |
|---|---|---|---|
| All `cloc` counts in F-3 (product 20,932; tests 19,121) | as stated | identical | **Confirmed, no correction** |
| Raw line counts | 6,070 / 18,146 / 4,072 / 316 | identical | **Confirmed** |
| Lisa non-test TypeScript (context only) | 32,522 in 160 files | 32,677 in 161 files | Corrected by the verifier's filter; R2's filter was not stated |
| "No pair of modules with equal behaviour exists" (F-5) | claim | six self-declared port pairs exist | **Corrected** |
| Python to TypeScript factor | 1.10, range 1.00 to 1.30 | measured 0.69 to 1.11, pooled 0.94; recommended range 0.80 to 1.30, central 1.00 to 1.10 | **Range corrected downward** |
| Bash to TypeScript factor | 0.85, range 0.70 to 1.00 | no calibration available; 18 % of driver code is heredoc Python or text that does not shrink | Unverified; upper half of the range more likely |
| Estimated TypeScript product code | 21,894 (19,586 to 25,850) | central 20,200 to 21,900; range **16,300 to 25,850** | **Low bound corrected.** 16,300 = Python at 0.80 plus Bash at 0.70. 20,200 = Python at 1.00 plus Bash at 0.85 |
| Estimate for files R2 says are not ported | 69 + 232 = 301 lines included | should be zero-rated or partially rated | **Corrected**: up to -301 |
| Estimate for Python inside Bash heredocs | rated 0.85 | 400 lines at the Python factor | **Corrected**: about +100 at 1.10 |
| Product language share | TypeScript 99.95 %, Bash 0.05 % | TypeScript 100 % until the owner rules on the shim | **Changed by the challenge rule** |
| Directory lock "gives the same observable behaviour" | claim | false in three reproduced ways | **Corrected** |
| `proper-lockfile` "last release 2021-01-25" | as stated | registry `time.modified` 2022-06-24; release date not re-checked | Minor, unresolved |

The corrections to the estimate nearly cancel in the centre and matter mostly at the low bound. The
planning figure of about 21,900 remains usable as a conservative central value.

## Open questions / risks

1. **DECISIONS-PENDING: the generated launcher's language.** Default to proceed on: a Node-shebang
   file, no Language Ledger entry. If the owner rules for the Bash shim, one ledger entry is added and
   nothing else changes.
2. **DECISIONS-PENDING: run-lock semantics.** The port changes crash behaviour and, as shown, process
   tree behaviour. Default to proceed on: the shape in "Lock design risks" (atomic `mkdir`, reclaim by
   rename, kernel-backed liveness on local filesystems, process group tracked, foreign host never
   reclaimed). If the owner prefers exact parity with today's Linux behaviour, the only routes are a
   native addon or a helper process that holds `flock(1)`, neither of which is portable to macOS
   without extra work.
3. **Lisa's workspace lock has a reproducible race** (risk 1 and 2). This is a finding for R1: the
   file should not be reused as is.
4. **The calibration is weak.** Six small modules, pairing inferred from comments, behaviour equality
   not tested. It is better than no calibration and worse than a measured port.
5. **The Bash factor has no evidence at all.** A calibration port of one function group of
   `proposer.sh` is the cheapest way to get it.
6. **Non-code product assets have no destination** (inventory gap 2). The consolidation map must
   place the launch contract schema, the skill prose, the templates and the telemetry stack.
7. **macOS remains untested** in this report as in R2. Every macOS statement here is `unverified` or
   `inferred`.
8. **`node:sqlite` is experimental in Node 22.** Its status in the Node version the product will pin
   must be read from current documentation before it is used for either persistence or locking. Not
   checked here.
9. **Process termination must be by pid or process group, never by command-line pattern.** The
   verifier's own `pkill -f` matched its own shell. A product `stop` that matches on command text
   could signal an unrelated run on the same machine.
10. **No owner decision is contradicted** by anything found here. Decision 2 is applied more strictly
    than R2 applied it.
