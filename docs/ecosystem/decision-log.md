# Decision log

Status: **approved by the owner on 2026-09-29** (`APPROVAL.md`). These are the decisions of this
effort, as distinct from the 23 owner decisions in the prompt. Sections A to F record what was proposed
and the research behind it; **section G records where the owner ruled differently, and G wins**
wherever it and an earlier row disagree. The column "Pending" names entries that are now closed.

Reversibility: **easy** = a configuration default or data; **moderate** = contained in one feature or
behind one extension point; **hard** = changes feature 100's contracts or the decomposition.

Confidence is the confidence of the supporting research after its verifier, where one exists.

## A. Architecture

| # | Decision | Alternatives considered | Evidence | Confidence | Reversibility | Pending |
|---|---|---|---|---|---|---|
| A1 | Loops at every level; the router is one pure rule table at three decision points in the pass-loop layer. Role choice is role resolution, not routing | Router as the top-level dispatcher of phases to modes (the prototype); no router | R25: per-step routing measured negative on coding work; two of the prototype's three modes have no critic. R15 Q1, held under R15v | High | Moderate (EP-06) | DP-031 |
| A2 | One detached process tree per run: a runtime root with the engine as its child | One process; today's chain of launcher, supervisor and engine as separate tools | R15 F-01, F-09: stage timeout, environment stripping and signals are process semantics; the oracle substitutes the engine by `PATH`. Held under R15v | Medium-high | Hard | DP-070 |
| A3 | Relaunch is done by the runtime root by default, with a second classifier table; `relaunch.owner: supervise` keeps today's behaviour and is the parity setting | Host only (the literal reading of decision 5); root only with the classifier "ported unchanged" | R21, R21v: 0 automatic relaunches, 135–143 manual restarts. R15v B-1: the classifier's input is a terminated launcher, so it cannot move unchanged | Medium | Easy (a configuration default) | DP-072, DP-080 |
| A4 | The control plane is outside the working tree, keyed by the real path of the workspace, with export, import and adopt | Inside the working tree with a deny rule per harness sandbox | R11 T-02, R23: every control file is inside the proposer's write scope today. R15v A-7, D-7, D-8 name the costs | Medium | Hard | DP-071, DP-084 |
| A5 | 19 public extension points and 1 internal seam, each with a version, a conformance suite and a sample outside the core | Fewer points, opened when needed; plug-ins as third-party code from the start | Owner's evolvability aim; decisions 11, 17, 20, 21. R1: the absence of seams is what closed Lisa's loop. R15v found 10 points too narrow, now widened | Medium-high | Hard to remove, easy to add | DP-075, DP-089 |
| A6 | Consumers extend by data in Wave 1 (descriptors, rule tables, profiles, terms rows); code extensions ship with the product | Third-party code extensions loaded from user config | R11 T-13, T-44 | High | Easy | DP-075 |
| A7 | One published npm package holding the CLI, the runtime entry and the Claude Code plugin; `contracts` and `testkit` also published | Plugin bundling one built file; install on first run | R3: a bundled file cannot carry native code; first-run install has network and silent-failure problems | High | Moderate | DP-090 |
| A8 | One workspace lock handed down as a lease; atomic `mkdir`, reclaim by rename, liveness backed by the kernel through something Node ships; the engine checks the lease at every boundary | Native `flock` module; a pid-file lock; Lisa's lock | R2: no `flock` in Node, native modules break plain install. R2v: Lisa's algorithm gave multiple winners in 297 of 300 rounds | Medium-high | Moderate (EP-13) | DP-005, DP-073 |
| A9 | "Run" means the logical run; a launch continues an unfinished run unless `--new-run` is given | "Run" as one engine invocation | Decision 23; R14; R15v B-6: no rule existed for when a new run starts | Medium | Hard (glossary and layout) | DP-074, DP-081 |
| A10 | A quota pause is a run state with a live process, a 24 h ceiling, and the stop reason `paused_quota_ceiling` | A stop with a timed relaunch | R14: today a quota failure exits 4 and burns the relaunch budget in minutes | Medium-high | Moderate | DP-028, DP-068, DP-085 |
| A11 | `blocked-on-human` is a resting state in Wave 1 | A live state with an answer channel | R21: one phase ran 51 passes blocked on a human decision. R19 C-12 | High | Moderate | DP-076 |
| A12 | The parity configuration is a named profile, not an oracle mode | Oracle-only code paths | R18 O-11; R15v B-5: at least twelve switches make up the configuration | High | Easy | — |

## B. Reuse, language and size

| # | Decision | Alternatives considered | Evidence | Confidence | Reversibility | Pending |
|---|---|---|---|---|---|---|
| B1 | Lisa: selective extraction of about 11k of 48k lines as source; the loop, CLI, config and generic adapter are written new | Lisa as the base; Lisa as a dependency; no reuse | R1 gap table: 028 is 2 yes / 16 partial / 12 no; 011 is 0 / 6 / 21 (after R1v). All 19 packages are private. Six packages are never called in a run | High | Hard after Stage B | DP-014, DP-079 |
| B2 | Lisa tree: local `main` for 18 packages, `76adfdc` for the dashboard | Local `main` only; `76adfdc` only | R1, confirmed by R1v: no `.ts` file outside the dashboard differs | High | Easy | DP-013 |
| B3 | TypeScript for every component; the Language Ledger is empty | Go for the runtime; Rust or Go for hashing; native lock and PTY; a Bash launcher shim | R17: 3 ms against 62–83 ms startup is immaterial for hours-long runs, and language has no effect on context. R2v confirmed each rejection and challenged the Bash shim | High | Moderate (EP-13, EP-17) | DP-043 |
| B4 | Port size: 16,300–25,850 TypeScript lines, centre 21,900 | — | R2, recounted exactly by R2v; factor calibrated weakly on six Lisa ports | Medium | — | — |
| B5 | MIT for the whole product; proprietary SDKs only as optional dependencies, never bundled | — | Decision 19; R1 | High | — | DP-015 |

## C. Harnesses, auth and terms

| # | Decision | Alternatives considered | Evidence | Confidence | Reversibility | Pending |
|---|---|---|---|---|---|---|
| C1 | Claude adapter on the `claude -p` subprocess with the prompt on stdin; no Agent SDK dependency in Wave 1 | Agent SDK | R5; R8v: SDK docs restrict offering claude.ai login in third-party products. Flags confirmed by R3v; the combination has had no live call | High on structure, medium on the flag set | Moderate | DP-021 |
| C2 | Tier 3 ships as an empty allowlist | Enable per provider | R8, R8v: no provider's own page permits it; every "prohibited" cell confirmed | High | Easy (data) | DP-020 |
| C3 | Two audiences in the terms gate. Personal: Tier 1 default. Distributed: Tier 2 default for Claude, Codex and the z.ai Coding Plan, with Tier 1 as a consumer opt-in | Tier 1 default for everyone, as decision 6 reads | R8v: 5 of 42 cells downgraded, each with the quoted sentence. **Hard evidence against part of decision 6** | High | Easy (data) | DP-042, DP-057 |
| C4 | opencode is a later tested adapter, not a universal proposer | Universal proposer to reduce the adapter count | R10: it replaces vendor CLIs (breaks Tier 1), coarse stream, headless hangs, 130+ releases in 6 months | Medium-high | Easy | — |
| C5 | One generic adapter driven by a descriptor of kind `cli`, `openai-chat` or `anthropic-messages`; an unverified CLI is never auto-picked as critic, an unverified endpoint may be | Auto-pick any qualifying harness | R20; R11. A CLI may have tools; an endpoint is tool-less by construction | Medium-high | Moderate | DP-025, DP-026 |
| C6 | A critic must have a known context window; Codex under a read-only sandbox does not count as tool-less | Accept a read-only sandbox as tool-less | Decision 17; R6 | High | Easy | DP-001 |
| C7 | Proposer containment: the strongest level the harness offers; none only by opt-in. Claude proposer in accept-edits mode with an allow list | Today's bypass flags | R11 T-07; R5: bypass is refused as root outside a recognised sandbox, and this host runs as root | Medium (depends on each harness) | Easy | DP-008, DP-011 |
| C8 | Tier 1 uses the consumer's real config home with customisations off, never written to | A throwaway config home at every tier | R5, R7: a throwaway home has no login | High | Moderate | DP-012, DP-017, DP-038 |
| C9 | Project configuration may narrow a run, never widen it | A per-repository trust prompt | R11 T-13; a trust prompt sits badly with decision 18 | High | Moderate | DP-009 |
| C10 | Approval is a signed record in the control plane, verified on resume | Keep the bare marker | R11 T-02: the marker is an empty file the proposer can write, and resume never consults the nonce | High | Moderate | DP-010 |

## D. Run acceleration

| # | Decision | Alternatives considered | Evidence | Confidence | Reversibility | Pending |
|---|---|---|---|---|---|---|
| D1 | The micro-loop layer ships on by default at level L1, with every other technique on its own switch | Layer and techniques on one switch | R27 D1.1; R23v IR-52: nothing may ride on the layer's switch | Medium-high | Easy | — |
| D2 | Decision 21's targets are measured on the default configuration against the parity configuration; the layer earns its place in a separate ablation | The layer alone must show 25 % | R27, R22: the layer alone reaches 0–12 % net. **Hard evidence that the layer alone cannot meet 25 %** | High that the layer alone misses; medium-low that the configuration meets it | Easy | DP-061, DP-062, DP-063 |
| D3 | Fail-fast is independent of the layer and belongs to the yield and jobs feature | Inside the micro-loop feature, as the suggested decomposition has it | R27: it carries 22.9 % of the reference run and acts on a yield; R21v confirms 29.3 h of 42.9 h | High | Moderate | — |
| D4 | The layer is off in a run whose verification gate does not execute | Layer on with inner results standing alone | R23v V-03; decision 21: the full gate always runs again | High | Easy | DP-045, DP-064 |
| D5 | Protection of checks is detect-and-void everywhere and prevent where a sandbox exists | Prevention required | Decision 21: the default level works on every harness. R23v V-01, V-04 show detection's limits | Medium | Easy | DP-040, DP-046 |
| D6 | The unit of work is declared by the proposer and validated by the runtime; the check set is per phase | One Spec Kit task as a fixed unit; checks per task | R23: obligations map to tasks one to one (188 of 188) but 3 commands serve 188 obligations, and commands carry no task link | Medium-high | Moderate | — |
| D7 | The runtime never commits, reverts or resets the tree inside an attempt | A commit or ref per kept unit; revert of unresolved units | R23v O-13; R27 D-04: a revert destroys work and a clean tree enables reuse that a dirty tree blocks | Medium | Moderate | DP-056 |
| D8 | Escalation is the second repair, to a stronger tier of the same harness; skipped when the target's quota is exhausted | Escalation in addition to repairs; to another harness; pause on exhausted quota | R25, R27 D-03. The deterministic-failure pool is at most 21.1 h, so this is a small lever | Medium-low on the default | Easy | DP-031, DP-032 |
| D9 | Session continuation is built as decided, active only within the drop rules and gated by a paired-run measurement | On wherever the harness supports it | R24: saves at most 1–2 % of Claude pass time; costs more tokens after about 24–86 turns | High for the file layer, low-medium for continuation's net benefit | Easy | DP-035, DP-036 |
| D10 | The "Inherited obligations" block becomes an index, off under the oracle | Keep the block | R12: the block is 69–70 % of the proposer prompt | High | Easy | DP-019 |
| D11 | No agent parallelism in Wave 1, not even as an option | `[P]` tasks in worktrees; parallel phases | R26: ceiling 1.18–1.30x; parallelism would have saved 0 h of the reference run's 82 h of waiting | Medium-high | Easy to add later | DP-034 |
| D12 | No memory feature; learning is ported unchanged | Feature 114 behind a flag | R12 | High | Easy to add later (EP-15) | DP-018 |

## E. Host, context and UI

| # | Decision | Alternatives considered | Evidence | Confidence | Reversibility | Pending |
|---|---|---|---|---|---|---|
| E1 | The CLI inventories sources deterministically; the host judges bounded batches | The host reads the sources | R17: the reference contract is 535 KB and its sources 2.1 MB | High | Hard | DP-023 |
| E2 | Token budgets gated on bytes at 2.8 bytes per token: `specstride-run` 8,000, `specstride-reverse` 7,000, doctor 1,500, a supervision cycle 150, a whole run 3,000 | 4 bytes per token | R17 measured the ratio. Today's skill carries about 20k tokens of mandatory instructions; 801 polls, 98 % unchanged | Medium-high | Easy | DP-024 |
| E3 | No MCP server in Wave 1; plain CLI calls | MCP tools | R17: resident schemas cost context in every turn | High | Easy | — |
| E4 | Hooks: `SessionStart` for re-attachment, `UserPromptSubmit` for status, `PreToolUse` as launch guard; no run depends on a hook | Hook-driven supervision | R3, R3v (`asyncRewake` hooks time out at 600 s) | High | Easy | DP-003 |
| E5 | The host port is a capability port shared by Claude Code and dsh, with the CLI as the only channel | One shared plugin artifact | R4: dsh has no plugin manifest | Medium-high | Moderate | DP-002 |
| E6 | Wave 1 specifies `RunView` and `status`; renderers are Wave 2 | A web kanban in Wave 1 | R13: Lisa's view-model builders are never called by its dashboard; MCP UI resources are dropped by Claude Code | High | Easy | DP-004 |

## F. Parity and specifications

| # | Decision | Alternatives considered | Evidence | Confidence | Reversibility | Pending |
|---|---|---|---|---|---|---|
| F1 | Hybrid oracle: committed golden captures for pull requests, a live differential run as the release gate; 28 normalization rules; waivers, no bug-compatible switches | Live only; goldens only | R18; a probe ran the baseline against stubs in 10 s | High on Linux, medium on macOS | Moderate | DP-006 |
| F2 | `traceability.md` has one row per as-is requirement and success criterion and one per cluster; per-item rows are in a data file that a script checks | About 2,900 visible rows | R18: 2,785 items, 2,402 without a covering requirement | High | Easy | DP-059 |
| F3 | Language artefacts in output lines are reproduced byte for byte | Clean them with register rows | R18; mixture-of-loops matches output by string | Medium | Easy | DP-060 |
| F4 | Under the parity profile the port prints no line the reference does not print | A normalization rule that drops new lines by prefix | `consolidation.md` DV-034 | Medium | Easy | DP-067 |
| F5 | Glob expansion in the critic snapshot is ported as the baseline has it; no divergence row | A fix with a waiver, as the prompt lists | R19, R18, R21v: fixed at `d6dab74`, an ancestor of the baseline | High | — | DP-007 |
| F6 | 26 Wave 1 features and the umbrella; feature 100 with annexes by layer; Stage B in two tiers | The suggested 14; R15's 27 | R15 F-08: nine suggested features would exceed 40 requirements. R15v E-1 to E-6 | Medium; estimates low | Hard once Stage B has started | DP-078, DP-087, DP-088 |
| F7 | Config precedence: contract pin > flag > run snapshot (on resume) > env > project > user > learned > default | Decision 9's five layers only | R16, from source reading at the baselines | Medium-high | Moderate | DP-058 |
| F8 | Constitution v3.0.0 with nineteen principles, all prescriptive | Amend v2 in place | `constitution-amendment.md` | Medium-high | — | several |

## What was decided against the research's own default

| Item | Research default | This log | Why |
|---|---|---|---|
| DP-032, exhausted quota on the escalation target | R25: pause the run | Skip the escalation and continue at the base tier | An optional step should not stall a run that can continue |
| DP-078, decomposition | R15: 27 features | 26 | R15v: two cuts were artificial, and no feature owned the oracle |
| DP-072, relaunch | R15: classifier moved into the root unchanged | A second table in the root, with `supervise` kept | R15v B-1 |

## G. Decisions the owner made differently from the proposal

| # | Decision (owner's ruling) | What had been proposed | Evidence the owner was given | Reversibility | Ruling |
|---|---|---|---|---|---|
| G1 | Lisa's Agent SDK harness is extracted in Wave 1 as an optional Claude transport, Tier 2, API keys only | Not extracted; on the roadmap (B1, C1) | R5 recommended the CLI subprocess; R8v: the SDK may not offer subscription login in a third-party product | Moderate (behind EP-02) | 20, 70 |
| G2 | Every parity test passes before any release; dsh, Codex, pi and prime adapters are Wave 1 features | Behaviour of later-wave harnesses deferred per wave; adapters in Wave 3 (F6) | 136 behaviour items belong to dsh, prime and Codex; pi has none and shares prime's stream format. Changes decision 13 for four harnesses | Hard once Stage B has started | 32, 32a, 32b |
| G3 | Prompt and response content is captured whenever traces are on | Off by default, opt-in (A-level control R-3) | R11 T-32, T-33: prompts ride on spans and the redaction patterns are narrow | Easy (a default) | 43 |
| G4 | A tier bump after K critic rejections is a Wave 1 option, off by default | Off; a roadmap experiment | R22: eight phases hold 73 % of failed-attempt time; it touches the classic loop | Easy | 48 |
| G5 | Parallel `[P]` units are a Wave 1 option, off by default; concurrent verification commands as well | No agent parallelism in Wave 1 (D11) | R26: ceiling 1.18–1.30x; 0 h of the reference run's waiting saved. No report had designed it, so R29 and R29v come first | Easy to leave off; the feature itself is moderate | 56, D2, D3 |
| G6 | Codex under a read-only sandbox counts as a critic, runs in the working tree, with the proposer's files hidden from it | Critic only by direct API (C6) | It is an exception to Principles III and IX. Repository text can reach this critic without passing the grounding snapshot; the owner accepted that with the mitigation of D1 | Easy (per harness) | 57, 57a, D1 |
| G7 | Copyright "mairp" | Left open | Lisa's LICENSE on local `main` | Easy | 14 |
| G8 | The hashes of spec, plan and tasks are checked at launch, at resume and at every pass start | Not in any proposal; found by R28 | An edit of `tasks.md` made the critic refuse a 44 h attempt 22 h later | Easy | K3 |

Rows of sections A to F that G changes: B1 (extraction list), C1 (SDK transport), C6 (Codex critic),
D11 (parallelism), F6 (31 features and the umbrella, not 26). Every other row stands as proposed and
is approved.
