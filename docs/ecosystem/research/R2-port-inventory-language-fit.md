# R2 — Port inventory and language fit

Baselines: Specstride `9cab15d`, mixture-of-loops `9c88f86`, Lisa local `main` `363e6a3` (used only to
name equivalents; R1 rules on the tree and on reuse). All trees were read through `git archive` into
`/tmp/specstride-research/R2/{ss,mol,lisa}`. No source repository was modified. No paid probes were run.

## Prior art consulted

| File | Use |
|---|---|
| `/root/specstride-harness-roadmaps/roadmap/bash-migration-language-research.md` | **Extended and partly contradicted.** Its decision (migrate Bash to Python, lines 3, 216) is superseded by owner decision 1. Its sizes (2,539 Bash lines, 8,077 Python lines, lines 7, 19-20) are stale: the baseline is 6,070 raw Bash lines and 18,146 raw Python lines. Its scores are "architectural judgments, not runtime benchmark results" (line 42). Reused: the target rules at lines 112-121 (argv arrays, cancellation as a state machine, concurrent stdout/stderr, one event append path, no native in-process plugin ABI) and the benchmark list at lines 136-143. Its TypeScript objection ("native PTY dependencies", line 79) is answered in F-12: the port needs no PTY. |
| `prompts/analysis/A1-local-fact-check.md` | Raw `wc -l` sizes (lines 82-85) confirmed for Specstride. Two claims corrected: `cloc` is now installed (F-1); "2.1k Bash" for mixture-of-loops (line 87) is not supported at `9c88f86` (F-4). |
| `prompts/analysis/A2-consolidation-analysis.md` | Lock comparison (lines 125, 182-185) and the per-OS note (line 358) reused and verified against code. |
| `old/028-as-is-specstride/`, `old/011-as-is-mixture-of-loops/` | Used as an index only; the code at the baseline is the source for every row below. |
| Prompt file §0, §1, §2 (decisions 1, 2, 3, 5, 12, 19) | Binding. |

## Questions answered

**Q1. Where does every Specstride `lib/*.py`, Bash driver and mixture-of-loops script go?**
Every one of the 42 product files maps to TypeScript. 39 map to a TypeScript module, 2 are dropped as
legacy aliases (decision 3), and 1 (`specstride-digest.sh`) is a machine-specific one-off whose function
is covered by the product digest. No file is a candidate for another language. See the port map in
Findings.

**Q2. How large is the port, by a method that can be re-run?**
20,932 `cloc` code lines of product source (17,376 Specstride, 3,556 mixture-of-loops) become an
estimated 21,900 TypeScript code lines (range 19,600 to 25,900). Tests are a further 19,121 code lines.
Method, commands and factors are in F-1 to F-6.

**Q3. What is the resulting share per language?**
Product: TypeScript about 99.9 %, Bash about 0.05 % (one generated launcher shim of about 10 lines),
everything else 0 %. Development only, not shipped: the Python and Bash reference implementations
pinned at the baselines for the parity oracle (decision 4).

**Q4. What are the Node equivalents of `fcntl`, `flock`, `pty` and process groups, and which need native modules?**
None of the four needs a native module in this product. Table in F-8 to F-13.

**Q5. Which components are Language Ledger candidates?**
None is recommended. Five were examined and rejected; one ledger entry is proposed for the permitted
Bash shim. See "Options compared".

## Findings

### Size method and counts

**F-1** `verified-local`. `cloc` is installed: `/usr/bin/cloc`, `cloc --version` prints `2.04`. The prompt
(§1 "This machine") and A1 line 86 say it is not; both are out of date.

**F-2** `verified-local`. Exact method. The verifier can run this unchanged:

```bash
export LC_ALL=C LANG=C
S=/tmp/specstride-research/R2v; mkdir -p $S/ss $S/mol
git -C /root/specstride        archive 9cab15d | tar -x -C $S/ss
git -C /root/mixture-of-loops  archive 9c88f86 | tar -x -C $S/mol

# (a) Specstride Bash drivers: the 7 tracked top-level scripts. --force-lang because
#     `specstride` and `wiggum` have no extension.
cd $S/ss && cloc --quiet --by-file --csv --force-lang="Bourne Again Shell",sh \
  orchestrator.sh proposer.sh specstride specstride-digest.sh specstride-lib.sh wiggum wiggum-lib.sh

# (b) Specstride product Python: lib/*.py, excluding tests and fixtures
cd $S/ss && cloc --quiet --by-file --csv --include-lang=Python --exclude-dir=fixtures \
  --not-match-f='^(test_.*|_test_.*|conftest)\.py$' lib

# (c) Specstride test Python
cd $S/ss && cloc --quiet --csv --include-lang=Python --exclude-dir=fixtures \
  --match-f='^(test_.*|_test_.*|conftest)\.py$' lib

# (d) mixture-of-loops product
cd $S/mol && cloc --quiet --by-file --csv --include-lang=Python skills
cd $S/mol && cloc --quiet --by-file --csv bin/onboard-skill

# (e) mixture-of-loops tests
cd $S/mol && cloc --quiet --csv --exclude-dir=repos,implementations \
  --include-lang=Python,JavaScript tests
```

Include and exclude rules: the unit is the `code` column (blank and comment lines excluded). Python
heredocs inside Bash count as Bash. Excluded from the product count: `lib/fixtures/**`, test files,
Markdown, JSON, YAML, `lib/speckit_templates/`, `telemetry/` (collector and dashboard configuration),
`.github/`. Only files tracked at the baseline commit count; untracked one-off scripts in the working
tree that A1 line 83 lists are out of scope. The full script, including the estimate arithmetic, is
`/tmp/specstride-research/R2/estimate.sh`.

**F-3** `verified-local`. Results of F-2 on 2026-09-29:

| Set | Files | cloc code | Raw lines (`wc -l`) |
|---|---:|---:|---:|
| Specstride Bash drivers | 7 | 4,128 | 6,070 |
| Specstride product Python | 27 | 13,248 | 18,146 |
| mixture-of-loops product Python | 7 | 3,283 | 4,072 |
| mixture-of-loops Bash (`bin/onboard-skill`) | 1 | 273 | 316 |
| **Product total** | **42** | **20,932** | **28,604** |
| Specstride test Python | 47 | 12,944 | 19,787 |
| mixture-of-loops tests (15 Python, 1 JavaScript) | 16 | 6,177 | not measured |
| **Test total** | **63** | **19,121** | |

Cross-check: `cloc --exclude-dir=fixtures` over the whole Specstride tree gives Python 26,192
(= 13,248 + 12,944) and shell 3,578 + 550 = 4,128.

**F-4** `verified-local`. The prompt's "about 18k lines of product Python and 6k of Bash" are raw line
counts, not code lines. Its "about 4k lines plus 2k of Bash" for mixture-of-loops does not hold at
`9c88f86`: the only tracked file with a shell shebang is `bin/onboard-skill` (316 raw lines). Command:
a shebang scan over `git ls-tree -r --name-only 9c88f86` returned that one file.

**F-5** `inferred`. Conversion factors, applied to the `code` column:

| Class | Factor | Reason | Range used for sensitivity |
|---|---:|---|---|
| Python module to TypeScript | 1.10 | Adds type declarations and runtime schema validation of JSON; loses `argparse` entry points, since modules are called in-process | 1.00 to 1.30 |
| Bash driver to TypeScript | 0.85 | Pipelines, quoting, `PIPESTATUS` handling and 86 `python3` call sites (F-7) collapse into function calls; help text and prompt text port one-to-one | 0.70 to 1.00 |
| Legacy alias (`wiggum`, `wiggum-lib.sh`) | 0 | Decision 3 | fixed |
| `lib/specstride_env.py` | 0.55 | Half of it is legacy-prefix compatibility | fixed |

These factors are reasoned and not calibrated against a measured port. No pair of modules with equal
behaviour exists in Python and TypeScript to calibrate on. R2v should treat the counts in F-3 as the
verifiable part and the factors as assumptions.

**F-6** `inferred` from F-3 and F-5. Estimated TypeScript code lines:

| System | Source language | cloc code | Estimated TS | Low | High |
|---|---|---:|---:|---:|---:|
| Specstride | Python | 13,248 | 14,550 | 13,229 | 17,190 |
| Specstride | Bash | 4,128 | 3,501 | 2,883 | 4,119 |
| mixture-of-loops | Python | 3,283 | 3,611 | 3,283 | 4,268 |
| mixture-of-loops | Bash | 273 | 232 | 191 | 273 |
| **Total** | | **20,932** | **21,894** | **19,586** | **25,850** |

Tests at factor 1.0: about 19,100 lines, if every test is ported. The parity oracle (decision 4)
replaces part of that, which is for R15 to size. For scale: Lisa's non-test TypeScript under
`packages/` at `363e6a3` is 32,522 code lines in 160 files.

**F-7** `verified-local`. The Bash drivers are application code. `grep -c python3`: `orchestrator.sh`
27, `proposer.sh` 27, `specstride` 18, `specstride-lib.sh` 14; 17 of those are inline Python
(`python3 -` heredoc or `-c`). Each call starts an interpreter.

### Port map: Specstride `lib/*.py`

Target module names are proposals for `architecture.md`. "Lisa equivalent" names the closest file at
`363e6a3` and makes no statement on reuse (R1). "none found" means a keyword search over
`packages/*/src` found no counterpart. All rows: target language TypeScript.

| File | code | Est. TS | Role | Proposed TS module | Lisa equivalent (name only) | Platform primitive |
|---|---:|---:|---|---|---|---|
| `verification_plan.py` | 2,003 | 2,203 | Hash-bound verification plan, fixed-argv gates, detached verification job | `verification/{plan,discover,execute,render,detached-job}` | `packages/verification/src/{planner,discovery,executor,hash,render,store}.ts` | `start_new_session=True` (line 1772) |
| `critic.py` | 1,631 | 1,794 | Approval gate: slicing, grounding snapshot, nonce verdict, window fitting | `critic/{grounding,prompt-budget,verdict,transport}` | `packages/core/src/critic/{verdict,grounding,ensemble}.ts` | subprocess, HTTP |
| `learn.py` | 1,614 | 1,775 | Metrics from events, knob resolution, apply, evaluate, revert | `learning/{metrics,decisions,resolve}` | `packages/memory/src/learn.ts` (name match only) | none |
| `reverse.py` | 1,187 | 1,306 | Reverse `plan`, `lint`, `guard` | `reverse/{plan,lint,guard}` | `packages/specs/src/reverse/*.ts` | none |
| `present.py` | 874 | 961 | Live presenter over the event stream | `present/{timeline,card,rail}` | `packages/tui/src/presenter.ts` | TTY |
| `reverse_inventory.py` | 779 | 857 | Deterministic source inventory, fingerprint, manifests | `reverse/inventory` | `packages/specs/src/reverse/investigate.ts` | SHA-256, directory walk, git |
| `specstride_spec.py` | 631 | 694 | Single grammar owner: native, speckit, openspec | `spec-formats/{registry,native,speckit,openspec}` | `packages/specs/src/{registry,speckit/adapter,openspec/adapter,wiggum/adapter}.ts` | none |
| `backend_overlay.py` | 519 | 571 | Throwaway config home, reap, sweep | `harness/overlay` | none found | `/proc/<pid>/stat` start time (lines 289-302) |
| `agent_stream.py` | 456 | 502 | Stream tap: JSONL to events | `harness/stream/tap` | `packages/agents/src/claude-agent-sdk/tap.ts` | SIGTERM handler (line 381) |
| `invocation_result.py` | 386 | 425 | Invocation identity, envelope, reconciliation, retention | `runtime/invocation` | none found | atomic rename |
| `banner.py` | 382 | 420 | Startup splash and phase rail | `present/banner` | none found | signal handlers (lines 379-404) |
| `ralph_otel_ship.py` | 375 | 413 | OTLP/HTTP JSON shipper | `observability/otlp` | `packages/otel/src/{otlp,metrics}.ts` | HTTP |
| `prime_stream.py` | 358 | 394 | prime schema-v3 adapter | `harness/adapters/prime/stream` | `packages/agents/src/prime-agent/events.ts` | none |
| `stream_seam.py` | 286 | 315 | Adapter seam, format registry | `harness/stream/seam` | `packages/agents/src/provider.ts` | none |
| `ralph_loki_ship.py` | 244 | 268 | Loki shipper | `observability/loki` | `packages/otel/src/loki.ts` | HTTP |
| `ralph_otel_spans.py` | 232 | 255 | Spans from paired events, state file under lock | `observability/spans` | `packages/otel/src/tracer.ts` | `fcntl.flock` (lines 167-185) |
| `observability_policy.py` | 226 | 249 | Redaction, byte limits | `observability/policy` | none found in core; `packages/sdk` has redaction | none |
| `theme.py` | 210 | 231 | Colour roles, depth and background detection | `present/theme` | `packages/tui/src/modes.ts` | `termios`, `select` (lines 109-132) |
| `telemetry_delivery.py` | 141 | 155 | Local-first fan-out, receiver state | `observability/delivery` | `packages/core/src/events/delivery.ts` | none |
| `dsh_plugin_requests.py` | 122 | 134 | Allowlisted dsh plugin install | `harness/adapters/dsh/plugin-requests` | none found | `fcntl.flock` blocking (line 89) |
| `finalize_invocation.py` | 119 | 131 | Producer and tap reconciliation | `runtime/invocation` | none found | none |
| `backends.py` | 105 | 116 | Backend registry | `harness/registry` (open, decision 17) | `packages/agents/src/provider.ts` | none |
| `failure_ledger.py` | 103 | 113 | Failure signatures of yielded jobs | `runtime/yield/failure-ledger` | none found | none |
| `error_breaker.py` | 83 | 91 | Consecutive-error breaker | `runtime/error-breaker` | none found | none |
| `verdict_pins.py` | 80 | 88 | Per-criterion verdict pinning | `critic/pins` | none found | none |
| `verification_failure_digest.py` | 59 | 65 | Actionable failure text | `verification/failure-digest` | none found | none |
| `specstride_env.py` | 43 | 24 | Env names and legacy prefixes | `config/env` (legacy half dropped) | none | none |

Every module imports the standard library only (import scan in scratch; no third-party package
appears). That removes any dependency-porting risk.

### Port map: Bash drivers

| File | code | Est. TS | Role | Proposed TS module | Lisa equivalent (name only) | Platform primitive |
|---|---:|---:|---|---|---|---|
| `orchestrator.sh` | 1,621 | 1,378 | Run state machine: lock, phase derivation, prompts, diagnostician, accelerator, oscillation check, archive, git checkpoint | `engine/{run,phase,prompt,accelerator,oscillation}`, `state/{lock,layout}` | `packages/core/src/engine/{phase-loop,lifecycle,proposer-context}.ts`, `packages/cli/src/layout.ts` | `flock -n` with `mkdir` fallback (lines 506-521), `PIPESTATUS` (978, 1862, 1988, 2056) |
| `proposer.sh` | 1,585 | 1,347 | Pass loop, backend argv, idle and progress watchdog, repeat detector, yield, checkpoints, signals | `engine/proposer/{loop,watchdog,yield,checkpoint}`, `runtime/process-supervisor` | `packages/agents/src/claude-agent-sdk/harness.ts` (has a watchdog) | process tree by `pgrep -P` and `ps -o cputimes=` (lines 776-790), session check `ps -o sid=` (line 1465), `kill -TERM` then `-KILL` (1041), traps (1842-1875) |
| `specstride` | 547 | 465 | Front door: run, reverse, status, tail, events, verdicts, feedback, watch, phases, stop, resume, learn | `cli/commands/*` | `packages/cli/src/commands/*.ts`, `packages/scheduler/src/{stop,stop-now}.ts` | `flock -n ... -c true` probe (lines 264-271), `kill -0` |
| `specstride-lib.sh` | 285 | 242 | Event emit, spec shims, detached long job | `events/emit`, `runtime/long-job` | `packages/core/src/events/journal.ts` | `setsid nohup ... &` plus pid file (line 471) |
| `specstride-digest.sh` | 81 | 69 | One-off digest with a hard-coded project path (line 12) | Not ported as is; the product digest covers it | none | `kill -0` |
| `wiggum` | 3 | 0 | Deprecated alias | Dropped (decision 3) | | |
| `wiggum-lib.sh` | 6 | 0 | Deprecated alias | Dropped (decision 3) | | |

### Port map: mixture-of-loops

| File | code | Est. TS | Role | Proposed TS module | Lisa equivalent (name only) | Platform primitive |
|---|---:|---:|---|---|---|---|
| `scripts/supervisor_lib.py` | 1,075 | 1,182 | Host-side policy: mode, gate, detached launch, telemetry read, stop | `supervisor/{launch,gate,observe,stop}` | `packages/scheduler/src/*.ts` (partial) | `start_new_session=True` (lines 531, 604, 663), `os.getpgid` (607), `os.killpg` (691), `fcntl.flock` probe (446-447), `/proc/<pid>/cmdline` (744) |
| `scripts/contract_lib.py` | 782 | 860 | Contract load and validation | `contract/{schema,validate}` | none found (no launch contract in Lisa) | none |
| `scripts/runtime.py` | 616 | 678 | Executes a validated contract, emits `[DIGEST]` | `launcher/runtime` | none found | `pty.openpty` (346), `start_new_session` (359), `os.killpg` (90, 269, 273), `fcntl.flock` non-blocking (582), `selectors` (279-317) |
| `scripts/bootstrap_contract.py` | 384 | 422 | Draft contract from Spec Kit artifacts | `contract/derive` | `packages/specs/src/speckit/project.ts` (partial) | subprocess (git) |
| `scripts/supervise.py` | 215 | 237 | CLI over `supervisor_lib` | `cli/commands/supervise` | none | none |
| `scripts/render_launcher.py` | 124 | 136 | Renders the Bash launcher and the content-addressed bundle | `launcher/render` | none | none |
| `scripts/validate_contract.py` | 87 | 96 | Validate and promote | `contract/promote` | none | none |
| `bin/onboard-skill` | 273 | 232 | Symlinks the skill into each harness's skill directory | Mostly replaced by plugin packaging (R3); remainder `cli/commands/doctor` checks | none | symlinks |

### Node equivalents

**F-8** `verified-local`. Node has no `flock` or `fcntl` API. `node -e` on v22.23.2 printed
`has flock api: undefined has fcntl: undefined` for `fs.flock` and `fs.fcntl`.

**F-9** Lock equivalents:

| Option | Native module | Crash behaviour | Tag and evidence |
|---|---|---|---|
| Atomic `mkdir lock.d` with an `owner` file, liveness probe and reclaim | No | Stale lock after a crash; needs owner pid plus start time to reclaim safely | `verified-local`: Lisa does this, `packages/cli/src/layout.ts` lines 16-19 and 228; Specstride's own fallback does it, `orchestrator.sh` lines 515-520 |
| `fs.openSync(path, 'wx')` | No | Same as above | `verified-local`: second open returned `EEXIST` |
| `proper-lockfile` 4.1.2 (MIT) | No | `mkdir` strategy with periodic mtime refresh and a stale threshold | `verified-doc`: https://github.com/moxystudio/node-proper-lockfile, 2026-09-29. Last release 2021-01-25 per the npm registry |
| `fs-ext` 2.1.1 | Yes | True kernel `flock` | `verified-local`: npm registry shows install script `node-gyp configure build`, dependency `nan`, no prebuilt binaries, no licence field. Every consumer would need a C++ toolchain. Rejected |
| Hold a kernel lock through `flock(1)` on an inherited descriptor | No | Kernel releases on death | `verified-local` on Linux: `flock -n 3` on an fd passed by `spawnSync` returned 0, a second contender returned 1, and 0 after Node closed the fd. Not portable: see F-10 |

**F-10** `unverified`. macOS ships no `flock(1)`. No macOS host was available. Supporting facts:
Specstride already branches on `command -v flock` (`orchestrator.sh` line 507, `specstride` line 265),
and A2 line 358 makes the same claim as inferred.

**F-11** `inferred` from F-9 and A2 lines 182-185. The observable difference is stale locks. A kernel
lock disappears with its owner; a directory lock does not. The port needs owner pid plus process
start time, since a pid alone can be reused. Start time is `/proc/<pid>/stat` field 22 on Linux
(`backend_overlay.py` lines 289-302 already does this) and `ps -o lstart= -p <pid>` on macOS
(`unverified`, no macOS host). One blocking lock exists (`dsh_plugin_requests.py` line 89); it
becomes acquire-with-retry.

**F-12** `verified-local`. The only PTY use in the three codebases is `runtime.py` line 346, guarded
by line 341: `use_pty = kind == CURRENT_KIND and reporter.color and not sys.stdout.isatty()`. Its
purpose is to make the child (today's `specstride`) emit colour when the launcher's output is not a
terminal. After consolidation the child is the product's own code, so colour is decided by
configuration and no PTY is needed. `theme.py` lines 119-132 use `termios` raw mode to query the
terminal background; Node's `process.stdin.setRawMode` covers that without a native module
(`inferred` from the Node TTY API).

**F-13** PTY cost, if a future harness adapter required one:

| Package | Finding | Tag |
|---|---|---|
| `node-pty` 1.1.0 (MIT, 2025-12-22) | Install script `node scripts/prebuild.js \|\| node-gyp rebuild`. Tarball holds prebuilds for `darwin-arm64`, `darwin-x64`, `win32-arm64`, `win32-x64` and **none for Linux**, so Linux consumers compile with node-gyp (make, Python, a C++ compiler). Unpacked size 64 MB | `verified-local`: npm registry metadata and tarball listing, 2026-09-29 |
| `node-pty` build requirements | README lists `make python build-essential` on Linux and Xcode on macOS | `verified-doc`: https://github.com/microsoft/node-pty, 2026-09-29 |
| `@lydell/node-pty` 1.2.0-beta.15 (MIT) | No install script; per-platform optional dependencies for linux, darwin and win32 on x64 and arm64. It is a beta from a third party | `verified-local`: npm registry metadata |

A PTY dependency would therefore break plain `npm install` on Linux or tie the product to a
third-party beta. Whether any harness needs a terminal in headless mode is for the adapter reports.

**F-14** Process groups and detachment:

| Need | Today | Node | Native | Tag and evidence |
|---|---|---|---|---|
| New session and process group | `start_new_session=True`, `setsid` | `spawn(cmd, args, {detached: true})` | No | `verified-doc`: "the child process will be made the leader of a new process group and session", https://nodejs.org/api/child_process.html (v26.10.0 page), 2026-09-29. `verified-local` on v22.23.2: child and both grandchildren showed pgid = sid = child pid |
| Survive the parent | `setsid nohup ... &` | `detached: true`, `stdio` not connected to the parent, then `unref()` | No | `verified-doc`, same page |
| Signal a whole group | `os.killpg` | `process.kill(-pgid, signal)` | No | `verified-local`: after `process.kill(-pid, 'SIGTERM')` no process remained in the group. The Node documentation does not describe negative pids, so this rests on `kill(2)` semantics and on the local test. `unverified` on macOS |
| Liveness probe | `kill -0` | `process.kill(pid, 0)` | No | `verified-doc`: https://nodejs.org/api/process.html, 2026-09-29. `EPERM` means alive (Lisa `layout.ts` handles it) |
| Read a pgid or sid | `os.getpgid`, `ps -o sid=` | No API. For a child spawned detached, pgid equals its pid. For a foreign pid, call `ps` | No | `inferred` from the Node API; affects the adopt-yield session check at `proposer.sh` line 1465 |
| Process tree CPU time | `pgrep -P`, `ps -o cputimes=` | Same commands through `execFile`, or `/proc` on Linux | No | `verified-local` for the source lines. The `cputimes` and `sid` keywords are procps-specific; macOS `ps` keywords differ (`unverified`) |
| Signal handlers | `trap`, `signal.signal` | `process.on('SIGTERM' \| 'SIGINT' \| 'SIGHUP')` | No | `verified-doc`: process page |
| Multiplexed reads with a deadline | `selectors`, `PIPESTATUS` | Streams and the event loop; each child's exit code comes from its own `exit` event | No | `inferred` |

**F-15** `verified-local`. Linux-only constructs the port must replace for decision 12:
`/proc` reads (`backend_overlay.py` line 297, `supervisor_lib.py` line 744, Lisa
`packages/scheduler/src/stop-now.ts` "`/proc` walking"), `setsid(1)`, `flock(1)`, `readlink -f`,
`date +%s%3N`, `find -newermt`. Today's Specstride and Lisa's stop-now are therefore not
macOS-clean as written. This is a finding for the behaviour inventory and for R1.

### Performance and startup

**F-16** `verified-local`. Cold start on this machine (Linux x86_64, 22 cores), mean of 30 runs,
measured with `date +%s%N` around a loop:

| Command | Mean |
|---|---:|
| `bash -c true` | 2 ms |
| `python3 -c pass` | 31 ms |
| `python3 -c 'import json,os,re,sys,argparse,hashlib,subprocess,pathlib,dataclasses'` | 94 ms |
| `python3 lib/specstride_spec.py --help` (10 runs) | 104 ms |
| `python3 lib/learn.py --help` (10 runs) | 126 ms |
| `node -e 0` | 47 ms |
| `node -e` requiring `fs`, `child_process`, `crypto`, `path` | 59 ms |
| `node h.mjs` (one-line ES module) | 70 ms |

Node starts faster than today's Python modules with their imports. The port also removes process
starts: the 86 `python3` call sites in the drivers become function calls.

**F-17** `inferred` from A5 (prompt §0): 64 % of run time was waiting on verification jobs, 35 %
proposer passes, 0.3 % critic. Local computation is not a measurable share, so no component has an
efficiency case for a compiled language. The CPU-heavy steps are SHA-256 over files
(`reverse_inventory.py`, `verification_plan.py`) and JSONL parsing; Node's `crypto` is native code
and `JSON.parse` is native.

**F-18** `verified-doc`. Node single executable applications are "Stability: 1.1 - Active
development"; macOS requires `codesign --sign -`; native addons need a temp-file workaround.
https://nodejs.org/api/single-executable-applications.html (v26.10.0 page), 2026-09-29. Single-binary
distribution is not required by decision 19 (consumers install with npm).

## Version/date pins

| Item | Value | Date |
|---|---|---|
| Specstride baseline | `9cab15d` | 2026-09-29 |
| mixture-of-loops baseline | `9c88f86` | 2026-09-29 |
| Lisa tree used to name equivalents | `363e6a3` (local `main`) | 2026-09-29 |
| cloc | 2.04 | 2026-09-29 |
| Node (local tests) | v22.23.2 | 2026-09-29 |
| Node documentation pages read | v26.10.0 | 2026-09-29 |
| Python, Bash (local) | 3.13.5, 5.2.37 | 2026-09-29 |
| node-pty | 1.1.0 | registry read 2026-09-29 |
| @lydell/node-pty | 1.2.0-beta.15 | registry read 2026-09-29 |
| proper-lockfile | 4.1.2 | registry read 2026-09-29 |
| fs-ext | 2.1.1 | registry read 2026-09-29 |

## Options compared

Language Ledger candidates, per decision 2. Default is TypeScript.

| # | Component | Candidate language | Claimed gain | Evidence | Portability and installation cost | Interface to TS | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | Generated launcher | Bash (thin shim) | Executable entry point that a person or a host can run directly; keeps 011's launcher shape | `render_launcher.py` lines 97-110: a 10-line template, `exec`s the runtime | None: Bash is present on Linux and macOS | `exec node <bundle>/runtime.js --contract ... "$@"` | **Propose.** Permitted by decision 2. A `#!/usr/bin/env node` file would remove even this; R3 and R19 choose |
| 2 | Run lock | C++ addon (`fs-ext`) | Kernel lock released on death | F-9 | Compiles at install; no prebuilt binaries | N-API | **Reject.** Directory lock with pid and start time gives the same observable behaviour |
| 3 | PTY | C++ addon (`node-pty`) | Colour from children on a pipe | F-12, F-13 | No Linux prebuild; 64 MB | N-API | **Reject.** The need disappears |
| 4 | Detached runtime and process supervisor | Go | Startup, single binary, goroutines | F-14, F-16, F-17 | Six prebuilt binaries (linux and darwin, x64 and arm64, plus musl), per-platform optional packages, a second toolchain and a cross-language contract | NDJSON over stdio or files | **Reject from R2's evidence.** Every primitive exists in Node without native code; startup is 50-70 ms against runs of hours. R17 owns the final recommendation |
| 5 | Inventory walk and hashing | Rust or Go | CPU efficiency | F-17 | As row 4 | subprocess | **Reject.** Hashing is already native in Node; no measurement shows a bottleneck |
| 6 | Learning and metrics (`learn.py`) | Python (keep) | Avoids porting 1,614 lines; statistics libraries | Import scan: stdlib only, uses `statistics` and `math` | Consumers would need Python 3; breaks npm-only installation (decision 19) | subprocess | **Reject.** Percentiles and rounding are small to port |

Resulting share if the verdicts stand:

| Language | Product code lines | Share |
|---|---:|---:|
| TypeScript | about 21,900 | 99.95 % |
| Bash (generated shim) | about 10 | 0.05 % |
| Go, Rust, Python, C++ | 0 | 0 % |

## Recommendation

Port everything to TypeScript, with no native npm dependency and no second compiled language. Plan
for about 21,900 TypeScript code lines of product code (19,600 to 25,900) from 20,932 source code
lines, plus the test work. Enter one item in the Language Ledger: the generated Bash launcher shim.
Implement the run lock as an atomic directory lock whose owner record holds pid and process start
time, and build one process-supervisor module on `spawn({detached: true})` and
`process.kill(-pgid)`, with the macOS paths covered by tests on a macOS host.

Confidence: **high** for the port map, the counts and the absence of a native-module need on Linux.
**Medium** for the size estimate, because the factors are reasoned. **Medium** for macOS, because no
claim about macOS could be tested on this machine.

## Matrix rows

None. R2 contributes no harness or host rows.

## Open questions / risks

1. **macOS is untested.** F-10, F-11, F-14 and F-15 carry `unverified` macOS claims. A macOS host or
   CI runner is needed before the process-supervisor and lock designs are final (decision 12).
2. **Lock semantics are a specification decision.** Replacing the kernel lock changes crash
   behaviour (F-11). The parity oracle needs an expectation for "owner died, lock remains", which
   today's Linux path never produces. This needs a divergence register row.
3. **The size factors are assumptions** (F-5). A calibration port of one Python module and one Bash
   function group early in implementation would replace them with a measurement.
4. **Lisa carries one native dependency.** `@lisa/persistence` depends on `better-sqlite3`
   (`verified-local`, its `package.json` at `363e6a3`). If R1 recommends reusing that package, the
   native-module question returns through that route. Flagged for R1 and R3.
5. **The prompt's size figures mix units** (F-4). Raw lines and code lines differ by about 27 %. The
   synthesis should state one unit; this report uses `cloc` code lines.
6. **`specstride-digest.sh` has a hard-coded project path** and is not general product behaviour.
   R18 should confirm it carries no requirement.
7. **Inline Python inside Bash** (17 sites) is counted as Bash and holds logic that no `lib/` test
   covers directly. R18 should inventory those sites so the port does not lose behaviour.
8. **No decision is contradicted.** Nothing found here is evidence against decisions 1, 2, 3, 5, 12
   or 19.
