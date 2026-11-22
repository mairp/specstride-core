# R17 — Context efficiency and runtime language

Governing text: decision 2 (TypeScript first, Language Ledger) and decision 16 (context efficiency is a
requirement with a budget). Constraining: 5, 12, 19. Neighbours deferred to: R3 (packaging, hook
mechanics), R2 (port map, per-module language candidates), R14 (observability), R19 (contract and
launcher behaviour).

All measurements were taken on 2026-09-29 on this machine. **No paid model call was made.** Scratch
material is under `/tmp/specstride-research/R17/` (`mol/` = `git archive 9c88f86`, `work/` = fixture run,
`plugin/` and `cal/` = token-projection wrappers, `bench/` = startup benchmarks).

## Prior art consulted

| File | Use |
|---|---|
| `prompts/specstride-ecosystem.md` §0, §1, §2, §4 row R17 | Governing. Aim 6 ("a host skill that uses little context") and decision 16 define the deliverable. |
| `prompts/analysis/A4-claude-code-host-facts.md` | **Reused and re-verified**: resident name+description only, 1,536-character cap, 500-line advice, MCP schemas deferred by tool search, `claude plugin details` reports projected token cost. **Extended**: I ran `claude plugin details` and calibrated its estimator (F1), and added the compaction re-attach budget and the hook output cap, which A4 does not have. |
| `prompts/analysis/A1-local-fact-check.md` | Reused for tool versions and mixture-of-loops line counts (SKILL.md 377 lines, references 455 lines). Confirmed by my own `wc`. |
| `/root/specstride-harness-roadmaps/roadmap/bash-migration-language-research.md` | **Partly contradicted by changed premises.** It recommends Python because a tested Python core already existed, and says "for a new process-orchestration CLI, Go would be the strongest general-purpose default" (line 7). Its matrix scores are "architectural judgments, not runtime benchmark results" (line 42). Decision 1 (full rewrite in TypeScript) removes its main argument (reuse of the Python core). Its still-valid points are reused: wall time is dominated by agent calls, not local throughput (line 63); argv arrays; out-of-process extension by NDJSON/JSON-RPC instead of native plugin ABIs (lines 120-121); the benchmark list (lines 136-143). |
| `/root/mixture-of-loops` at `9c88f86` (`skills/mixture-of-loops/**`) | The measured subject. The installed skill `~/.claude/skills/mixture-of-loops` is a symlink to the working tree; `diff -rq` of the skill directory against the baseline archive shows no difference apart from `__pycache__`. |
| `/root/agentic-netops-srl/.mixture-of-loops/**` (read only) | Real command output and real artifact sizes from the 188-hour run. |

## Questions answered

**(a) What does today's mixture-of-loops skill cost in context?**
About 20k tokens of instructions before any work is done (SKILL.md plus the two references and the schema
that the workflow makes mandatory), using the host's own estimator. The scripts themselves are already
terse (0 to 320 tokens per call). The real cost is elsewhere: the skill tells the host to read every
inventoried source in full and to complete a contract whose draft embeds the whole task inventory. On the
real project that is 2.1 MB of sources (about 530k to 750k tokens) and a 535 KB contract (about 134k to
191k tokens). Neither fits in a host context. Supervision adds about 100 to 150 tokens per poll, and the
real run logged 801 polls. Details in F2 to F9.

**(b) Which techniques reduce it?**
Seven, ranked by measured effect in F10 to F16: move derivation facts into the CLI and hand the host only
judgment items; progressive disclosure with a short SKILL.md; plain CLI on the plugin `bin/` path instead
of an MCP server; terse, change-only output; supervision that does not wake the main session when nothing
changed; hook-based status reading a precomputed file; supervision in a subagent when a loop is needed.

**(c) What are the budgets, and how does CI measure them without paid calls?**
Budgets are in the Recommendation section. CI measures bytes, converts with one pinned ratio, and
cross-checks with `claude plugin details`, which makes no model call.

**(d) TypeScript/Node, Go or Rust for the detached runtime, the CLI and the doctor?**
TypeScript for all three. The language has **no effect on context**: the model sees bytes of output, and
those are a design property, not a language property. Go starts 20 to 25 times faster (3 ms against 62 to
83 ms) and idles at a twentieth of the memory, but neither gain is material for a run that lasts hours
and spends its time in harness subprocesses, and the one place where startup matters (hooks) can be served
by a precomputed file. No non-TypeScript component is proposed for the Language Ledger.

## Findings

### Token estimation

**F1. The host's estimator is about 2.8 bytes per token for this kind of content.** `verified-local`
`claude --plugin-dir <scratch wrapper> plugin details <name>` on four Markdown bodies:

| Content | Bytes | Projected on-invoke | Bytes per token |
|---|---|---|---|
| SKILL.md (baseline) | 22,929 | ~8k | 2.87 |
| references/contract.md (wrapped as a skill) | 15,282 | ~5.6k | 2.73 |
| references/derivation.md (wrapped) | 10,757 | ~3.8k | 2.83 |
| First 3,000 bytes of SKILL.md (wrapped) | 3,046 | ~1.1k | 2.77 |

The tool prints "Token counts are estimates and may differ from actual usage". The conventional rule of
thumb for English prose is 4 bytes per token. This report gives both: **host** = bytes / 2.8 and
**conventional** = bytes / 4. Budgets are set against the host figure because it is the one a consumer
sees and CI can reproduce. `tiktoken` is not installed on the host (`ModuleNotFoundError`), and it would
be the wrong tokenizer for Claude in any case.

### Cost of today's skill (deliverable a)

**F2. Resident cost is small: about 118 tokens.** `verified-local` `claude plugin details` reports
"Always-on: ~118 tok" for the skill's name and description (SKILL.md lines 2-3).

**F3. Instruction load is about 20k tokens, and the workflow makes all of it mandatory.** `verified-local`

| File | Bytes | Words | Lines | Host tokens | Conventional | Loaded when |
|---|---|---|---|---|---|---|
| `SKILL.md` | 22,929 | 3,274 | 377 | ~8.2k | ~5.7k | on invocation |
| `references/derivation.md` | 10,706 | 1,547 | 171 | ~3.8k | ~2.7k | step 1, always (SKILL.md:103) |
| `references/contract.md` | 15,233 | 2,061 | 284 | ~5.4k | ~3.8k | step 4, always (SKILL.md:138-140) |
| `assets/launch-contract.schema.json` | 6,724 | 569 | 172 | ~2.4k | ~1.7k | step 4, always (SKILL.md:140) |
| **Total** | **55,592** | | | **~19.9k** | **~13.9k** | |

The references are nominally "on demand", but steps 1 and 4 instruct the host to read them on every
generation, so progressive disclosure saves nothing today. About 40 % of SKILL.md (lines 219-377, the
Execution and Required runtime behaviour sections) concerns `run`/`auto` and is loaded even in `generate`.

**F4. Skill content stays in context for the whole session and is partly re-attached after compaction.**
`verified-doc` https://code.claude.com/docs/en/skills (2026-09-29): "Once a skill loads, its content stays
in context across turns, so every line is a recurring token cost"; after auto-compaction the host
re-attaches "the most recent invocation of each skill ... keeping the first 5,000 tokens of each", with a
combined budget of 25,000 tokens. Consequence (`inferred` from this and F3): today's 8k-token SKILL.md is
truncated on re-attach, and what is lost is the tail, which is the supervision and relaunch rules. A
SKILL.md under 5,000 tokens survives compaction whole.

**F5. Script output is already terse.** `verified-local` Scripts from the baseline archive run against
the `greeting-ready` fixture copied to scratch, and lines taken from the real run's
`harness-report.log`:

| Command | Output | Bytes | Host tokens |
|---|---|---|---|
| `bootstrap_contract.py` | nothing on stdout or stderr | 0 | 0 |
| `validate_contract.py --promote` (refusal, exit 20) | 9 lines on stderr | 890 | ~320 |
| `supervise.py mode` | one `[MOL-MODE]` line | 66 | ~25 |
| `supervise.py learning` | one `[MOL-LEARNING]` line | 50 | ~20 |
| `supervise.py resolve` (refusal) | one `[MOL-REFUSE]` line | 185 | ~65 |
| `supervise.py gate` | 7 `[MOL-GATE]` lines, 43 bytes average | ~304 | ~110 |
| launch | one `[MOL-LAUNCH]` line | 450 | ~160 |
| state change | one `[MOL-STATE]` line | 125 avg, 193 max | ~45 |
| unchanged poll | one `[MOL-HOLD]` line | 119 | ~43 |
| terminal | one `[MOL-DIGEST]` line | 485 avg, 537 max | ~175 |
| `supervise.py --help` | | 2,208 | ~790 |

Absolute paths are the main waste: the run directory path (137 bytes) appears twice in every
`[MOL-DIGEST]` and twice in `[MOL-LAUNCH]`, so roughly 60 % of those lines is repeated path.

**F6. The draft contract is the first large cost, and it scales with the project.** `verified-local`
The bootstrap writes the draft to a file and the skill tells the host to complete it (SKILL.md:138-142,
188-189).

| Project | Contract bytes | Host tokens | Conventional |
|---|---|---|---|
| `greeting-ready` fixture (2 tasks) | 4,539 | ~1.6k | ~1.1k |
| Real project (188 tasks, 195 coverage rows, 2 stages) | 534,679 | ~191k | ~134k |

Breakdown of the real contract (compact JSON, 488,925 bytes): `inventory` 66.9 % (of which `tasks`
262,501 bytes and `shell_candidates` 64,542 bytes), `coverage` 27.6 %, `findings` 1.9 %, `stages` 1.2 %.
The part that carries judgment (stages, findings, configuration) is about 4 %. Each inventory task
repeats the full task text, and each coverage row repeats its first 300 characters as `rationale`.

**F7. "Read every inventoried execution-relevant source in full" is the largest cost and cannot be met on
a complex project.** `verified-local` SKILL.md:138 gives the instruction. The real contract lists 25
sources totalling 2,109,987 bytes: about 750k host tokens, about 530k conventional. `research.md` alone
is 492,849 bytes. `inferred`: the host that derived this contract cannot have read them in full in one
context, so it either sampled or delegated, and the skill gives no guidance on which. This is the concrete
form of the prompt's statement that the skill "spends context that the host needs for judgment".

**F8. One supervision poll costs about 100 to 150 tokens of new context.** `verified-local` for the
output, `inferred` for the total. `supervise.py observe` prints one `[MOL-STATE]` or `[MOL-HOLD]` line
(119 to 193 bytes) and one `[MOL-NEXT] poll-in=<n>s` line (`supervise.py:132-135`), about 145 bytes or
~52 host tokens. The command the host must issue is about 130 bytes (~46 tokens) because it carries the
absolute launcher path. Tool-call framing adds an amount I did not measure. Cadence is 60 s base, backing
off to 600 s (`supervisor_lib.py:71-72`).

**F9. Over a long run, polling dominates everything the scripts print.** `verified-local` The real run's
`harness-report.log` holds 867 lines and 104,646 bytes: 788 `[MOL-HOLD]` (93,641 bytes, 89 % of the
file), 49 gate lines, 13 state lines, 8 digests, 7 launches, 2 stops. That is 801 polls, of which 98 %
reported no change. If relayed to the host as SKILL.md:270 instructs, the log alone is ~37k host tokens,
and ~80k to 120k with call overhead. `inferred`: the larger cost is not the tokens added but the turn
itself, because every wake-up re-reads the entire session context, and a 600 s poll interval is longer
than a short prompt-cache lifetime, so long-interval polls may be billed as uncached input. I did not
measure cache behaviour (`unverified`; it would need paid probes and depends on the account type).

### Techniques (deliverable b)

**F10. Move facts into the CLI; hand the host judgment items only.** `inferred` from F6 and F7. This is
the largest available saving, two orders of magnitude on a complex project. The CLI inventories sources,
extracts tasks and declared commands, and writes the contract. It prints a bounded list of items that
need a decision (unclassified obligations, conflicting declarations, absent prerequisites), each with a
source anchor and a short excerpt. The host answers through CLI arguments or a small answers file, and
never opens the contract or the full sources. Decision 16 already requires that "the model must never
need to read product source to operate Specstride"; the same rule should cover generated artifacts.
R19 owns the behaviour; R17 contributes the budget (judgment payload, below).

**F11. Progressive disclosure works only if references are conditional.** `verified-doc` (skills page,
2026-09-29): "Keep SKILL.md under 500 lines. Move detailed reference material to separate files";
supporting files let "Claude access detailed reference material only when needed". `inferred` from F3:
SKILL.md must name the condition for each reference ("read X only when validation prints code Y"), and
the happy path must need none. Error messages from the CLI should carry the fix, so the reference is
rarely needed.

**F12. Plain CLI calls carry no resident schema; an MCP server does, unless tool search defers it.**
`verified-doc` https://code.claude.com/docs/en/mcp (2026-09-29): tool search is the default; it is off
with "a custom `ANTHROPIC_BASE_URL`, `ENABLE_TOOL_SEARCH=false`, and a model earlier than the Claude 4.5
generation on Google Cloud's Agent Platform". MCP output warns above 10,000 tokens and is capped at
25,000 by default. `verified-local`: in this session deferred MCP tools appear by name only and need a
`ToolSearch` round trip before use, while server instructions are resident (the two servers attached here
carry roughly 3,900 bytes of resident instructions between them). The prompt's §1 says the owner's setup
uses a host model gateway; a gateway reached through a custom base URL is exactly the case where deferral
is off and every schema becomes resident. A plugin `bin/` executable is on the Bash PATH (A4, plugin
layout) and costs nothing until called. **Conclusion: no MCP server in the Wave 1 plugin.** Evolvability
cost: hosts without a shell tool would need an MCP or RPC surface later; the CLI's `--json` output is the
seam for that, so nothing is lost by deferring.

**F13. Compact output: change-only, relative paths, one line per fact.** `inferred` from F5 and F9.
Rules: print paths relative to the repository root and only once; print nothing for an unchanged state
(exit code and an empty stdout are the answer); success prints one line; failures print the failing items
only, each with its fix; `--verbose` and `--json` are opt-in (decision 16). A status line of the form
`run=<id> st=running ph=3/7 unit=12/40 rej=1 el=5h12m next=600s` is 60 bytes, about 21 host tokens,
against 119 bytes today.

**F14. Supervision should not wake the main session when nothing changed.** `inferred` from F9 and
`verified-doc` for the mechanisms. The detached runtime already writes state to files (decision 5,
Principle I). Options, cheapest first:

| Mechanism | Context cost per unchanged interval | Source |
|---|---|---|
| A blocking wait in the CLI (`specstride wait --until-change --timeout <n>`), run as a background Bash task; the host is re-invoked only when it exits | 0 while waiting; one line on exit | Bash `run_in_background` re-invokes the host on exit (`verified-local`, this session's tool description). Background Bash survives turns, not sessions (A4). |
| Hook injecting the status line on `SessionStart` or `UserPromptSubmit` | 0 when the runtime has nothing new; ~25 tokens otherwise | `verified-doc` https://code.claude.com/docs/en/hooks (2026-09-29): these events can add `additionalContext` or plain stdout; output is capped at 10,000 characters per field, beyond which the model gets a file path and a 2,000-character preview. |
| `asyncRewake` hook that exits 2 when the run needs attention | 0 until it fires | `verified-doc` hooks page: "runs in the background and wakes Claude on exit code 2"; the timeout is not enforced on async hooks. |
| Supervision in a subagent that returns only the digest | The subagent's own context, discarded; the main session pays for the final report only | `verified-doc` skills page: `context: fork` runs the skill in a subagent that "doesn't see your conversation history"; `background` defaults to true from v2.1.218. |
| Polling from the main session (today) | 100 to 150 tokens plus a full context re-read, every interval | F8, F9 |

That a hook which prints nothing adds nothing to context is `inferred` (the hooks page describes context
injection only for returned output; it does not state the empty case in so many words).

**F15. A hook should read a precomputed file, not start the product.** `verified-local` for the timings
(F17), `inferred` for the design. The runtime writes `status.line` (one line, atomically) on every state
change. The hook is a thin shim that prints that file if it changed since the last print. This gives
native-speed hooks (a Bash `cat` is about 5 ms) without any native component, and Bash thin shims are
allowed by decision 2. Hook mechanics and packaging are R3's.

**F16. Keep SKILL.md under the compaction re-attach limit.** `inferred` from F4. Under 5,000 host tokens
the skill survives compaction intact; the budget below sets 2,500 to leave room.

### Runtime language (deliverable d)

**F17. Startup on this machine.** `verified-local` Python harness timing `subprocess.run`, 30 runs each
(10 for the installed CLIs), machine under load (load average 10.5 on 22 cores), so the figures are
upper-side; ratios are more reliable than absolutes.

| Command | Median | p90 | Min | Note |
|---|---|---|---|---|
| `/bin/true` | 2.4 ms | 3.0 | 1.6 | process spawn floor |
| `bash -c :` | 4.9 ms | 6.1 | 3.5 | thin shim |
| Go 1.24.4 static CLI (flag + json + one line) | 3.2 ms | 3.7 | 2.5 | built in scratch, `-ldflags "-s -w"` |
| `python3 -c pass` | 36.3 ms | 43.7 | 26.6 | |
| `node empty.mjs` (v22.23.2) | 62.2 ms | 68.3 | 49.3 | Node floor |
| `node cli.mjs` (`node:fs`, `node:util` parseArgs, one line) | 82.5 ms | 113.4 | 66.2 | |
| same with `module.enableCompileCache` | 68.4 ms | 92.2 | 58.9 | little to gain on a tiny script |
| `python3 supervise.py mode` (today's skill) | 191.2 ms | 222.7 | 140.0 | the baseline to beat |
| `dsh --version` (Node, many packages) | 156.1 ms | 222.1 | 127.8 | |
| `pi --version` (Node, unbundled) | 1,855 ms | 2,336 | 1,560 | what an unbundled Node CLI can cost |
| `codex --version` (Node launcher + native binary) | 83.3 ms | 107.4 | 70.0 | pays the Node floor anyway |
| `claude --version` (native binary) | 15.0 ms | 19.0 | 12.3 | |

A bundled TypeScript CLI at about 80 ms is already 2.3 times faster than today's Python entry point.
Rust was not measured: `rustc` and `cargo` are not installed (`command -v` empty). `inferred`: Rust
startup is in the same class as Go (both are static native binaries with no runtime warm-up).

**F18. Footprint.** `verified-local` Maximum RSS: Node one-shot CLI 35,180 kB; Node idle with a timer
34,144 kB; Go CLI 1,900 kB; `python3 -c pass` 7,808 kB. The Node binary is 124.8 MB but is already on the
consumer's machine, since npm requires it. Go binaries for the four targets are 1.75 to 1.89 MB each
(stripped, `CGO_ENABLED=0`). For scale, the installed Claude Code native binary is 243 MB and each harness
subprocess the runtime starts uses far more memory than the runtime itself.

**F19. Distribution: prebuilt native components over npm are a solved pattern, with a real cost.**
`verified-local` Both installed native-backed CLIs ship per-platform packages as `optionalDependencies`:
`/usr/lib/node_modules/@anthropic-ai/claude-code/package.json:23-31` lists eight (darwin arm64/x64, linux
x64/arm64, two musl variants, win32 x64/arm64), and `/usr/lib/node_modules/@openai/codex/package.json:22-29`
lists six. Cross-compiling Go for linux/arm64, darwin/arm64 and darwin/amd64 from this Linux host worked
with no extra toolchain. `inferred` cost for Specstride: a minimum of four platform packages for decision
12 (six with musl), a release matrix, a launcher that resolves the right package, failure modes when
`--omit=optional` or an offline mirror drops the platform package, and a second toolchain and test suite.
Rust cross-compilation to macOS from Linux needs an Apple SDK or macOS runners (`unverified`; not tried,
no Rust toolchain here).

**F20. Concurrency and efficiency.** `inferred` from the workload in §0 and decision 21. The detached
runtime supervises a handful of child processes (proposer, critic, deterministic checks), reads their
streams, writes events and state files, and waits. It is I/O-bound, and Node's event loop with
`child_process` and streams handles that natively. 99.7 % of run time in the measured run was spent
inside harness passes and verification jobs (§0 table), none in the supervisor. Go's goroutines and
Rust's async would give true parallelism for CPU work, which this workload does not have. The two places
where a native language has a technical edge are process-group and signal handling (Node exposes
`detached: true` and negative-PID `process.kill`; `verified-local` on Linux with Node v22.23.2: a child
spawned with `detached: true, stdio: 'ignore'` and `unref()` outlived its parent, was re-parented to PID 1
with its own PGID and SID, and `process.kill(-pid, 'SIGTERM')` ended the group; macOS is `unverified`,
the Node API page could not be fetched on 2026-09-29) and
file locking (Node has no `flock`; an atomic `mkdir`/`O_EXCL` lock with a PID and heartbeat is the
portable substitute). Neither justifies a second language. R5 and R2 own the mechanism.

**F21. The effect of language on context is nil.** `inferred` The model's context holds SKILL.md, the
references, tool schemas and command output. None of those depend on the implementation language. The
only indirect path is latency: a slow hook or status command delays the turn, and it does not add tokens.
Any context argument for Go or Rust is therefore a startup or footprint argument under another name.

## Version/date pins

| Item | Version | Verified on |
|---|---|---|
| Claude Code | 2.1.284 | 2026-09-29 (`claude plugin details`, `claude plugin --help`) |
| Claude Code docs: skills, mcp, hooks | code.claude.com/docs/en/{skills,mcp,hooks} | accessed 2026-09-29 |
| mixture-of-loops | `9c88f86` (archive into scratch) | 2026-09-29 |
| Node | v22.23.2, linux x86_64 | 2026-09-29 |
| Go | go1.24.4 linux/amd64 | 2026-09-29 |
| Python | 3.13 | 2026-09-29 |
| codex | 0.153.4; dsh 0.1.0-rc.8; pi 0.80.6 | 2026-09-29 (`--version` timing only) |
| Token ratio | 2.8 bytes per token (host estimator, F1) | 2026-09-29; re-calibrate when the host version pin moves |

## Options compared

### Supervision mechanism

| Option | Context per unchanged interval | Survives session end | Needs host feature | Portable to other hosts |
|---|---|---|---|---|
| Main-session polling (today) | 100-150 tokens + context re-read | no | none | yes |
| Blocking `wait` as a background task | 0 | no (re-attach on next session) | background Bash | mostly (needs a background primitive) |
| Hook prints changed status line | 0, or ~25 on change | yes (fires on next session start) | hooks | per-host shim |
| Subagent loop | subagent's context only | no | subagents | partly |

### Language for the detached runtime, the CLI and the doctor

Effect on context is a separate row, as the assignment requires.

| Criterion | TypeScript/Node 22 | Go | Rust |
|---|---|---|---|
| **Effect on context** | none | none | none |
| Cold start (measured) | 62-83 ms | 3 ms | not measured; same class as Go (inferred) |
| Idle memory (measured) | ~34 MB | ~2 MB | not measured; same class or lower (inferred) |
| Concurrency for this workload (I/O-bound child supervision) | sufficient | excellent | excellent |
| Process groups, signals, detach | sufficient on Linux and macOS | strong | strong |
| Distribution through npm | native: one package, pure JS | 4-6 prebuilt platform packages + launcher | same as Go, harder cross-build for macOS |
| Works where optional dependencies are dropped | yes | no | no |
| Shares code with host plugins, provider SDKs, schema, Lisa | yes | no, duplicate types across a process boundary | no |
| One toolchain, one test suite, one parity oracle target | yes | no | no |
| Evolvability (new adapter or strategy plugs in without core change) | in-process TS modules or descriptors | out-of-process protocol required | out-of-process protocol required |
| Material gain over TypeScript | baseline | ~75 ms per invocation, ~32 MB per run | as Go |

## Recommendation

**One recommendation, two parts. Confidence: high on the language, medium-high on the budget figures**
(the structure is well evidenced; the exact numbers are set from one measured skill and one real run, and
should be re-fitted after the first Wave 1 implementation).

### Part 1: language

TypeScript for the detached runtime, the CLI and the doctor. No Language Ledger entry is proposed.
Conditions that make TypeScript adequate, to be written into feature 113 and the core features:

1. The CLI is one bundled ESM file with lazy imports; no dependency is loaded for a command that does
   not use it. Target: `specstride status` cold start at or below 150 ms p90 on the reference machine,
   checked in CI (F17 shows 80 ms is reachable and 1.8 s is what happens without bundling).
2. Hooks never start Node. They are thin shims that print a file the runtime precomputed (F15).
3. The runtime is a single long-lived process per run; it never starts a process per event.

Draft Language Ledger (for `architecture.md`):

| Component | Language | Gain over TypeScript | Portability and install cost | Interface | Status |
|---|---|---|---|---|---|
| Detached runtime | TypeScript | n/a | none | files (Principle I) | default |
| CLI | TypeScript | n/a | none | argv, stdout, exit codes | default |
| Doctor | TypeScript | n/a | none | same as CLI | default |
| Hook status shim | Bash (thin shim, allowed by decision 2) | avoids ~75 ms Node start per hook | none on Linux and macOS | reads `status.line` | proposed; R3 owns the mechanics |
| Native status or hook helper | Go | ~75 ms per invocation, ~32 MB | 4-6 prebuilt packages, launcher, second toolchain | same files | **not proposed**; revisit only if a measured hook p90 exceeds 150 ms with the shim in place |

### Part 2: token budgets

Unit: **host tokens = ceil(bytes / 2.8)**. The gate is on bytes, so the limit is deterministic; the token
figure is what is reported. "Resident" means present in every session whether or not the skill is used.

| Item | `specstride-run` | `specstride-reverse` | doctor | Today (mixture-of-loops) |
|---|---|---|---|---|
| Resident listing (name + description) | 150 tok (420 B) | 150 tok | 100 tok | ~118 |
| Resident tool schemas | 0 | 0 | 0 | 0 |
| `SKILL.md` body | 2,500 tok (7,000 B) | 2,000 tok (5,600 B) | 800 tok (2,240 B) | ~8,200 |
| References needed on the happy path | 0 | 0 | 0 | ~11,600 (all mandatory) |
| Any single reference, on demand | 2,000 tok | 2,000 tok | none shipped | up to ~5,400 |
| All references together | 6,000 tok | 4,000 tok | 0 | ~11,600 |
| Any single command, default output | 400 tok (1,120 B) | 400 tok | 600 tok | 0-320 |
| Any single command, failure output | 800 tok | 800 tok | 800 tok | ~320 |
| All command output, invocation to launch | 1,500 tok | 1,200 tok | 600 tok | ~700 |
| Judgment payload (items the host must decide), per batch | 3,000 tok | 3,000 tok | n/a | 134k-750k (F6, F7) |
| **Total, invocation to launch, happy path** | **8,000 tok** | **7,000 tok** | **1,500 tok** | ~21k + artifacts |

Supervision cycle (shared by both skills):

| Item | Budget | Today |
|---|---|---|
| Status line | 60 tok (170 B) | ~43-70 |
| One full cycle: command text + output | 150 tok | ~100-150 |
| Cycle with no state change | 0 tok (no host wake-up) | ~100-150 + context re-read |
| Terminal digest | 250 tok (700 B) | ~175 |
| All supervision for a run, regardless of duration | 3,000 tok | ~37k-120k over 801 polls |

Rules that go with the budgets:

- The host never reads product source, the launch contract, run state files or logs. Every fact it needs
  is a CLI line.
- Output uses repository-relative paths, printed once.
- A judgment payload larger than one batch is paged by the CLI; the count of remaining batches is
  printed, so the host can hand the work to a subagent when it is large.
- No MCP server in Wave 1. If one is added later, its resident cost is budgeted at 300 tokens with tool
  search and measured as fully resident (every schema counted) for the no-deferral case.
- Budgets are checked per host plugin. The dsh plugin uses the same byte limits until R4 supplies a
  different estimator.

### CI measurement method (no paid calls)

1. **Static size gate.** A script walks the built plugin, measures bytes of each `SKILL.md` body,
   frontmatter description, each reference and any `.mcp.json` tool schema, converts with the pinned
   ratio and fails on any limit. It also fails if `SKILL.md` exceeds 500 lines.
2. **Reference closure gate.** Every path named in `SKILL.md` and the references must resolve inside the
   skill directory. Any path into product source, state directories or logs fails the build. This enforces
   "never read product source" mechanically.
3. **Golden output gate.** Each CLI command the skills name is run on fixtures with stub agents (the same
   fixtures as the parity oracle), in default mode, on a success case and a failure case. Combined stdout
   and stderr bytes are compared with the per-command limit, and the sum along the scripted happy path
   with the path limit. Absolute paths in default output fail the test.
4. **Supervision cycle gate.** A fixture run directory is stepped through scripted state changes. The
   test asserts that an unchanged state produces zero bytes, a changed state produces at most one line
   within the limit, and the terminal digest is within its limit.
5. **Judgment payload gate.** Derivation on a large synthetic feature (at least 200 tasks) must produce
   batches within the limit, and the total printed must not grow with source size.
6. **Host cross-check.** `claude plugin details` is run on the built plugin and its "always-on" and
   "on-invoke" figures are recorded beside the script's own. A difference of more than 15 % fails the job
   and signals that the ratio needs re-calibration. It made no model call in my use and needed no login
   prompt (`verified-local` for the absence of a prompt; that it sends nothing to a model is `inferred`
   from its instant, offline-style output). If the host CLI is absent in CI the step is skipped with a
   warning and steps 1-5 still gate.
7. **Startup gate.** Median and p90 of `specstride status` and `specstride doctor --quick` over 30 runs
   against the limits in Part 1.

A report file (`context-budget.json`) is produced on every run with measured bytes, tokens and limits,
so the trend is visible (R14 may want it as an observability artifact).

## Matrix rows

Host Capability Matrix, context-related cells only (R3 and R13 own the full row):

| host | skills | hooks | background processes | UI surfaces | packaging | evals |
|---|---|---|---|---|---|---|
| Claude Code 2.1.284 | Resident cost is name + description only (~118 tok measured for today's skill); description + `when_to_use` cut at 1,536 characters; listing budget 1 % of the context window; body stays in context after invocation; after compaction the first 5,000 tokens per skill are re-attached within 25,000 combined; `context: fork` runs a skill in a subagent | Context injection through `additionalContext` or stdout on `SessionStart`, `UserPromptSubmit`, `PostToolUse` and others; 10,000-character cap per field, then path + 2,000-character preview; `asyncRewake` wakes the model on exit 2 | Background Bash re-invokes the model on exit; survives turns, not sessions (A4) | defer to R13 | `claude plugin details` gives a free projected token cost, usable in CI; plugin `bin/` on PATH costs no context | defer to R3 |

Harness Capability Matrix: none.

## Open questions / risks

1. **Derivation cannot stay a read-everything task (evidence F6, F7).** Decision 5 assigns derivation to
   the host skill, and decision 16 caps its context. On the real project the two are only compatible if
   the CLI does the inventory and the host decides bounded judgment items. This does not contradict a
   decision, but it constrains R19's design and changes what "derivation" means for the host. Proposed
   for `DECISIONS-PENDING.md` so the owner sees it. Default to proceed on: CLI derives, host judges
   batches of at most 3,000 tokens. If the owner rules that the host must read sources itself, the
   `specstride-run` total budget cannot be a fixed number and must be stated per megabyte of spec.
2. **The token unit.** Budgets use the host estimator (2.8 bytes per token), which is about 40 % more
   conservative than the conventional 4. If the owner prefers the conventional ratio, every token figure
   above shrinks by 30 % while the byte limits stay the same. Proposed for `DECISIONS-PENDING.md`.
   Default: gate on bytes, report host tokens.
3. **Prompt-cache behaviour during supervision is unmeasured** (F9). If wake-ups after long intervals are
   billed as uncached input, the money cost of polling is far higher than its token count suggests. The
   recommendation (no wake-up when unchanged) is robust to either answer. A measurement would need paid
   probes; R21 or a later run can take it from real usage records.
4. **Tool-call framing overhead is unmeasured.** The 150-token cycle budget covers command text and
   output, which CI can measure. The host's own framing per tool call is outside the plugin's control.
5. **Hook and background mechanisms are host features that can change** (the `background` frontmatter
   field arrived in v2.1.218). The budget is expressed independently of the mechanism, so a host without
   hooks falls back to the blocking `wait` command and still meets the zero-on-unchanged rule only if it
   has a background primitive. For a host with neither, the 150-token cycle applies and the run total
   becomes duration-dependent; the doctor should report which mode is in effect.
6. **Gateway setups disable MCP tool search** (F12). This is the reason to avoid an MCP server in the
   plugin; if R13 or the kanban work proposes one, its schemas must be counted as resident.
7. **Startup figures were taken under load** and on one Linux x86_64 machine. macOS and arm64 were not
   measured. The 150 ms limit should be confirmed on a macOS runner before it gates a release.
8. **Rust was not measured** (no toolchain installed; installing one was out of scope). It is not needed
   to reach the recommendation, since Go already bounds what a native binary can gain.
9. **Fixed defect candidates for the divergence register** (R19 decides): absolute paths repeated in
   `[MOL-LAUNCH]` and `[MOL-DIGEST]`, and a hold line printed on every unchanged poll. Both are output
   the parity oracle compares (decision 4), so terser output needs register rows or a normalizer.
