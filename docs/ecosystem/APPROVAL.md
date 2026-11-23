# APPROVAL

**The owner approved Stage A on 2026-09-29.**

The final question put to the owner was: "Do you approve Stage A? That is the architecture
(`architecture.md`), the amendment, the conflict rulings and the decomposition, as changed by your
answers. Wave 1 becomes 31 features and the umbrella: the 26 proposed, the dsh, Codex, pi and prime
adapters, and parallel units. On approval I write APPROVAL.md in your words, apply the rulings to the
artifacts, and write HANDOFF.md. The parallel-units design (R29) and its red team are still running and
are folded in before the handoff."

The owner's answer: **"Approve Stage A"**.

## How the rulings were given

The owner asked to be put the pending questions one by one. Each question offered options, one of them
marked as recommended, and the owner could write a free answer. This file records each answer as it was
chosen or written, in the order given. Text in quotation marks is the label of the option the owner
chose, or the owner's own words; the text after the colon restates what that option said. Nothing here
was inferred from silence.

Answers that differ from the recommended default are marked in bold. There are eight: rulings 14, 20,
32 (with 32a and 32b), 43, 48, 56, 57 and 57a.

The notes headed "To apply" were written by the orchestrator when the ruling was recorded. They are
work lists, not rulings.

## Rulings on the 90 entries of `DECISIONS-PENDING.md`


| # | Entry | Question put to the owner | Owner's answer (as chosen or written) | Same as the default? | Date |
|---|---|---|---|---|---|
| 1 | DP-042 | Which auth tier should the published npm package default to for Claude, Codex and the z.ai Coding Plan, given that Tier 1 is not allowed as a default in a distributed product? | "Tier 2 when distributed (Recommended)": own use keeps Tier 1 as the default; the published package defaults to Tier 2 for those three; a consumer can switch Tier 1 on for their own account, with a warning | Yes | 2026-09-29 |
| 2 | DP-057 | Which audience is the default of the terms gate in the package as shipped? | "distributed (Recommended)": the package ships with `distributed`; the owner sets `personal` once in user config | Yes | 2026-09-29 |
| 3 | DP-061 | What are decision 21's targets measured on, given that the micro-loop layer alone is estimated at 0–12 %? | "Default configuration (Recommended)": the targets apply to the whole default configuration against the parity configuration; the layer must separately earn its place in its own ablation | Yes | 2026-09-29 |
| 4 | DP-062 | Which mix of work is the elapsed-time target judged on? | "50:50, both reported (Recommended)": half long-verification work, half ordinary phases, fixed before the first run, both strata reported separately | Yes | 2026-09-29 |
| 5 | DP-063 | Does a pass ended by an inner cap of the micro-loop layer count as killed for the 50 % target? | "Yes, count them (Recommended)": every pass ended by any time limit or watchdog counts, inner caps included, in both arms, with hours reported beside the count | Yes | 2026-09-29 |
| 6 | DP-072, DP-080 | Who relaunches a run after a transient stop? | "Runtime root by default (Recommended)": the detached runtime relaunches by itself with a second classifier table; the host observes and can send `hold-relaunch`; `relaunch.owner: supervise` keeps today's behaviour and is the parity setting | Yes | 2026-09-29 |
| 7 | DP-035 | How should session continuation within an attempt ship, given that it saves little and can cost more tokens? | "On, under drop rules (Recommended)": on by default, dropped for a fresh session under the ten drop rules; a paired-run ablation decides whether it stays on | Yes | 2026-09-29 |
| 8 | DP-081 | When does a launch start a new logical run with fresh counts? | "Continue unless --new-run (Recommended)": a launch continues an unfinished run of the same feature and keeps its counts; `--new-run` starts a new run; `--reset-counts` resets counts inside the same run | Yes | 2026-09-29 |
| 9 | DP-037, DP-053 | Which counters does "counts survive a resume" cover? | "All, window re-keyed (Recommended)": reject counts, attempt numbers, pass index, yield index and breakers all continue; the oscillation window is keyed by attempt sequence | Yes | 2026-09-29 |
| 10 | DP-058 | Where do the as-is config layers that decision 9 does not name go? | "Extended order (Recommended)": contract pin > flag > run snapshot (on resume only) > env > project > user > learned > default; the install-root `.env` is folded into user config; inline secrets are errors; saved settings split into pinned and tunable | Yes | 2026-09-29 |
| 11 | DP-007 | How is the glob-expansion defect handled, given that it is already fixed at the baseline? | "Port the baseline (Recommended)": the port reproduces the baseline, which expands globs; no divergence row and no waiver | Yes | 2026-09-29 |

Group 1 of the reading guide is complete with ruling 11. DP-021 follows from ruling 1 and is confirmed with the other derived entries at the end.

| # | Entry | Question put to the owner | Owner's answer (as chosen or written) | Same as the default? | Date |
|---|---|---|---|---|---|
| 12 | DP-014 | How much of Lisa is reused? | "Selective extraction (Recommended)": about 11k of 48k lines extracted as source; the phase loop, CLI, config and generic adapter are written new; Lisa is neither the base nor a dependency | Yes | 2026-09-29 |
| 13 | DP-013 | Which Lisa tree is the source for extraction? | "main + dashboard from 76adfdc (Recommended)": local `main` (`363e6a3`) for 18 packages and `76adfdc` for `packages/dashboard` | Yes | 2026-09-29 |
| 14 | DP-015 | Which copyright name goes in the MIT LICENSE file? | "Your personal name", spelled "mairp", as in Lisa's existing LICENSE ("Copyright (c) 2026 mairp") | The default left the name open; now settled | 2026-09-29 |
| 15 | DP-078, DP-088 | How many Wave 1 features? | "26 + umbrella (Recommended)": nine suggested features split along seams; 122-detached-runtime and 141-parity-oracle added; 114-memory not specified; 115 and 108 each stay one feature with two requirement groups and split only if `speckit-specify` yields more than about 45 requirements | Yes | 2026-09-29 |
| 16 | DP-087 | How is feature 100 structured, at about 180 requirements? | "One feature, annexes by layer (Recommended)": the single source every other feature cites, with separate annex documents per layer, written first and alone | Yes | 2026-09-29 |
| 17 | DP-018 | Is feature 114-memory specified? | "Not specified (Recommended)": no memory feature in Wave 1; learning ported unchanged; a lessons store on the roadmap | Yes | 2026-09-29 |
| 18 | DP-043 | Are any components written in a language other than TypeScript? | "None; ledger empty (Recommended)": everything is TypeScript, including the launcher as a Node-shebang file; the Language Ledger is empty at the start of Wave 1 | Yes | 2026-09-29 |
| 19 | DP-059 | What shape does `traceability.md` take? | "Rows per cluster + data file (Recommended)": one row per as-is requirement and success criterion and one per cluster; every item in `traceability-items.tsv`, checked by script | Yes | 2026-09-29 |
| 20 | DP-079 | Is Lisa's Agent SDK harness extracted? | "Extract as optional": extracted in Wave 1 as a second, optional Claude transport for Tier 2; the proprietary Agent SDK is an optional dependency, never bundled, and its terms row applies | **No, differs from the default** (the default was not to extract in Wave 1) | 2026-09-29 |

Group 2 of the reading guide is complete with ruling 20.

To apply for ruling 20 once approved: `architecture.md` sections 5, 13 and 14 (feature 125 gains an SDK transport for Tier 2; Lisa's `agents/claude-agent-sdk/harness.ts` and `tap.ts` join the extraction list); `decision-log.md` C1 and B1; `roadmap.md` (the Agent SDK transport leaves the roadmap); `feature-briefs.md` brief 125; `research-synthesis.md` Claude row; DP-021 stays as it is (subscription login only through the `claude` subprocess; the SDK with API keys only).

| # | Entry | Question put to the owner | Owner's answer (as chosen or written) | Same as the default? | Date |
|---|---|---|---|---|---|
| 21 | DP-070, DP-073 | Is the engine a child process of a detached runtime root, and is there one workspace lock? | "Child process, one lock (Recommended)": a runtime root per run with the engine as its child; one lock per workspace handed down as a lease; one register row with a waiver for the second-pipeline case | Yes | 2026-09-29 |
| 22 | DP-071, DP-084 | Where does control state live? | "Outside the tree (Recommended)": in the user's state directory, keyed by the workspace's real path, with `state export`, `import` and `adopt`, an advisory marker, and the spike testing writability | Yes | 2026-09-29 |
| 23 | DP-005 | Which lock mechanism? | "Directory lock + kernel liveness (Recommended)": atomic `mkdir`, reclaim by rename, liveness backed by the kernel through something Node ships; no native module; Lisa's lock code not reused | Yes | 2026-09-29 |
| 24 | DP-074 | What does "run" mean in the specs? | "The logical run (Recommended)": the run of one feature, whose id survives resume and relaunch; one engine process is an "engine start" | Yes | 2026-09-29 |
| 25 | DP-077 | Does `specstride-reverse` use the detached runtime without a launch contract? | "Yes, an 'engine' request (Recommended)": the runtime accepts a promoted launch contract or a single engine invocation | Yes | 2026-09-29 |
| 26 | DP-082 | Which module entry points become public `specstride` commands? | "spec, verify, learn only (Recommended)": those three are public with today's exit codes; the pass loop and the critic stay internal and are `translated` | Yes | 2026-09-29 |
| 27 | DP-028 | Is a quota pause a run state or a stop? | "A run state (Recommended)": the runtime stays alive and waits; the pause spends no budget of any kind | Yes | 2026-09-29 |
| 28 | DP-068, DP-085 | How long may a run wait in a quota pause, and what happens after a reboot? | "24 h ceiling; resume after reboot (Recommended)": configurable ceiling, default 24 h, then blocked-on-human with the stop reason `paused_quota_ceiling`; a pause holds while the runtime lives; `resume` after a reboot | Yes | 2026-09-29 |
| 29 | DP-076 | What does a run do when it is blocked on a human decision? | "Rest and signal (Recommended)": it emits `blocked`, says what it needs, releases the lock and ends; the consumer answers and runs `resume` | Yes | 2026-09-29 |
| 30 | DP-075, DP-090 | How may consumers extend Specstride in Wave 1, and which packages are published? | "Data only; publish contracts (Recommended)": extension by data; code extensions ship with the product; `specstride`, `contracts` and `testkit` are published | Yes | 2026-09-29 |
| 31 | DP-089 | Should the Wave 1 loop-layer interface make room for an autoresearch loop? | "Reserve, build nothing (Recommended)": the interface reserves the tree-store service; nothing is built in Wave 1 | Yes | 2026-09-29 |
| 32 | DP-083 | Must the parity tests for behaviour of later-wave harnesses (dsh, prime, Codex: 136 items) pass before the Wave 1 release? | "Yes, all parity first": every parity test passes before any release; the dsh, prime and Codex stream and invocation behaviour is ported in Wave 1 | **No, differs from the default** (the default deferred those items per wave) | 2026-09-29 |

Group 3 of the reading guide is complete with ruling 32.

To apply for ruling 32 once approved: it bears on decision 13 (Wave 1 is Claude as proposer and critic; one harness adapter per feature in later waves). A follow-up question settles the form in which dsh, prime and Codex behaviour enters Wave 1. Then: `traceability.md` and its data files (136 items move from `deferred 3+` to `ported` or `translated`), `architecture.md` section 14, `feature-briefs.md`, `roadmap.md` (features 130, 131, 138), `research-synthesis.md` (delivery wave column), `decision-log.md`.

| # | Entry | Question put to the owner | Owner's answer (as chosen or written) | Same as the default? | Date |
|---|---|---|---|---|---|
| 32a | DP-083, follow-up | In what form does the dsh, prime and Codex behaviour enter Wave 1? | Written by the owner: "Adapters dsh, codex and pi". Being clarified: the as-is parity behaviour belongs to dsh, prime and Codex; pi has no adapter today | Open | 2026-09-29 |
| 32b | DP-083, clarification | You wrote "Adapters dsh, codex and pi"; what about prime, which holds 62 of the parity items? | "dsh, Codex, pi AND prime": four full adapter features in Wave 1 (130-adapter-dsh, 131-adapter-codex, 134-adapter-pi, 138-adapter-prime); pi and prime share one JSONL reader with a dialect table; Wave 1 becomes 30 features and the umbrella | **Differs from the default and changes decision 13 for these four harnesses** | 2026-09-29 |

To apply for rulings 32, 32a and 32b once approved, in addition to the list above: four more Stage B features; their briefs are written from R9 (dsh, pi, prime) and R6 (Codex); tiers per R8v (dsh and prime: fleet only, unknown terms; Codex: personal Tier 1 with conditions, distributed Tier 2; pi: gated by its back end); DP-001 (Codex as critic only by direct API) and DP-016 (dsh cannot continue a session) now bear on Wave 1; the unverified items of R9 and R6 need fixture captures before the specs freeze (pi's exit code on a provider error, Codex's structured quota event, dsh's approval behaviour in headless mode).

| # | Entry | Question put to the owner | Owner's answer (as chosen or written) | Same as the default? | Date |
|---|---|---|---|---|---|
| 33 | DP-010 | Replace the bare approval marker? | "Signed approval record (Recommended)": written by the runtime, bound to the verdict, the evidence hash and the verification result, kept in the control plane; resume verifies it | Yes | 2026-09-29 |
| 34 | DP-008, DP-011 | How contained is a proposer pass by default? | "Strongest available (Recommended)": the strongest containment the harness offers; none only by opt-in in user config; the Claude proposer in accept-edits mode with an allow list; today's behaviour under the parity oracle | Yes | 2026-09-29 |
| 35 | DP-009 | May a project's `specstride.yaml` declare harness command lines, critics or endpoints? | "Narrow only (Recommended)": project config may narrow a run, never widen it; harness declarations, endpoints and secret references only from user config, flags and environment | Yes | 2026-09-29 |
| 36 | DP-012, DP-038 | How is the throwaway config home reconciled with Tier 1? | "Real home, customisations off (Recommended)": Tier 1 uses the real config home, never written to, with plugins, hooks, skills and MCP servers off; Tier 2 uses a throwaway home; session state lives per attempt; Principle VIII reworded | Yes | 2026-09-29 |
| 37 | DP-017 | What is the rule for harness-native memory? | "Off for critic; proposer off by default (Recommended)": always off for the critic; off by default for the proposer with an opt-in; the setting recorded per run | Yes | 2026-09-29 |
| 38 | DP-040, DP-046 | How is "the proposer cannot edit a check" enforced without a sandbox? | "Detect everywhere, prevent where possible (Recommended)": fingerprints before and after every check; a changed set gives `tainted`, never `pass`; prevention where the harness has a sandbox | Yes | 2026-09-29 |
| 39 | DP-044 | Should the gate and grounding run on an immutable copy of the tree? | "No copy; detect (Recommended)": no snapshot in Wave 1; the runtime ends the pass's processes before a check and fingerprints before and after; the snapshot goes on the roadmap | Yes | 2026-09-29 |
| 40 | DP-045, DP-064 | What happens to micro-loops in a run whose gate does not execute, and which verification mode does contract derivation set? | "Layer off; prefer `required` (Recommended)": classic loop, announced, still with fail-fast and carry-over; derivation states the mode it sets and prefers `required` where commands are declared | Yes | 2026-09-29 |
| 41 | DP-048, DP-049 | What does the runtime do when protected files were changed without authority? | "Report to the critic, no halt (Recommended)": the gate runs, its result carries the condition, the critic is told; approval stays possible; no halt | Yes | 2026-09-29 |
| 42 | DP-066 | How immediate is the return to classic on a breach of gate integrity? | "Three levels, with a tripwire (Recommended)": the run (layer off, approval void, phase gated again), the machine (a tripwire until the operator clears it), the product (the breach blocks the release) | Yes | 2026-09-29 |
| 43 | DP-029 | Are prompts and model responses captured in telemetry? | "On whenever traces are on": as in the OTel work tree today, content follows traces | **No, differs from the default** (the default was off, opt-in) | 2026-09-29 |

Group 4 of the reading guide is complete with ruling 43.

To apply for ruling 43 once approved: `constitution-amendment.md` Principle XI (the content-capture bullet becomes "content is captured when traces are on and always passes the single redaction point; it can be switched off") and the plan template's gate XI; `architecture.md` sections 12 and 17 (control R-3 keeps the fail-closed redaction point; the redaction rules now carry the risk, so the narrow patterns R11 found must be widened and tested with planted canaries before release); `decision-log.md`; feature briefs 111 and 128; the divergence register needs no row (the OTel tree is past the baseline).

| # | Entry | Question put to the owner | Owner's answer (as chosen or written) | Same as the default? | Date |
|---|---|---|---|---|---|
| 44 | DP-039, DP-055 | How is the inertness of the layer kept, given that the protocol changes the prompt? | "Prompt block is a named field (Recommended)": the protocol block is added at pass level and named in the divergence register; with no unit declared the layer executes nothing else | Yes | 2026-09-29 |
| 45 | DP-041 | Does the runtime run a closing check before the gate? | "On, only in an engaged attempt (Recommended)": only where a unit was declared, bounded by the cycle cap, at most two returns to work; off under the parity oracle | Yes | 2026-09-29 |
| 46 | DP-031 | Where does routing end, and is escalation on by default? | "Same harness, on, capped (Recommended)": the second repair runs on the next tier of the same harness, in a fresh session, never on the critic's model; caps 1 per task and 2 per attempt; on by default with an off-switch and an ablation arm | Yes | 2026-09-29 |
| 47 | DP-032 | What does the run do when the escalation target's quota is exhausted? | "Skip the escalation (Recommended)": the repair runs on the base model; the skip is recorded in events | Yes | 2026-09-29 |
| 48 | DP-033 | Is a tier bump after K critic rejections in Wave 1? | "Wave 1 option, off by default": specified in Wave 1 as an option that is off by default, switched off under the oracle, with a divergence register row and its own ablation | **No, differs from the default** (the default was off, as a roadmap experiment) | 2026-09-29 |

To apply for ruling 48 once approved: `architecture.md` section 9 (options) and EP-18 (the attempt planner gains a second implementation); `roadmap.md` (the item leaves the roadmap); `consolidation.md` (a divergence register row, off under the `parity` profile); `feature-briefs.md` brief 101, which owns the attempt planner; the experiments gain an ablation arm; the value of K and the ladder come from config.

| # | Entry | Question put to the owner | Owner's answer (as chosen or written) | Same as the default? | Date |
|---|---|---|---|---|---|
| 49 | DP-052 | Is a higher effort on the critic's model a collision? | "Not a collision; warn (Recommended)": allowed; the same-model warning of decision 7 is raised and recorded | Yes | 2026-09-29 |
| 50 | DP-056 | Does the runtime commit kept units and revert unresolved ones? | "No commit, no revert (Recommended)": inside an attempt the runtime never commits, reverts, resets or cleans the tree; kept units are ledger records; the commit at approval stays | Yes | 2026-09-29 |
| 51 | DP-065 | Do inner checks run every command or stop at the first failure? | "Run every command (Recommended)": every command runs in every check, so the failure signature is complete | Yes | 2026-09-29 |
| 52 | DP-054 | What does the runtime do by default at the first failure of a long verification job? | "Stop declared jobs; tell the critic (Recommended)": it stops a job only if it launched it and the yield declared `stop`; otherwise the wait ends; the critic is told, without counts, that a cited result file belongs to a stopped job | Yes | 2026-09-29 |
| 53 | DP-047, DP-050, DP-051 | Three details of what the critic is shown | "All three defaults (Recommended)": no test counts in Wave 1, only suppression counts; file modification times stay in the grounding snapshot; the fact block keeps the unit id and no fingerprint values | Yes | 2026-09-29 |
| 54 | DP-019 | Replace the "Inherited obligations" block with an index? | "Yes, index on by default (Recommended)": an index plus a runtime-written ledger in the proposer's prompt only; off under the parity oracle; a divergence register row and an ablation | Yes | 2026-09-29 |
| 55 | DP-036 | Is a relaunch a fresh session? | "Yes, always fresh (Recommended)": a fresh session after a relaunch, with context carried through files | Yes | 2026-09-29 |
| 56 | DP-034 | What parallelism enters Wave 1? | "Parallel [P] tasks as an option": tasks marked `[P]` may run in parallel worktrees with a merge check before the critic, as a Wave 1 option that is off by default; adds a feature | **No, differs from the default** (the default was no agent parallelism in Wave 1) | 2026-09-29 |

Group 5 of the reading guide is complete with ruling 56.

To apply for ruling 56 once approved: a new Wave 1 feature for parallel units (proposed number 142-parallel-units), implemented as a loop layer behind EP-04 with R26's merge check before the critic, off by default and off under the `parity` profile; 002 FR-048 (worktree creation rules) moves from `deferred 3+` to this feature; `architecture.md` sections 9 and 14, `roadmap.md`, `traceability.md`, `feature-briefs.md`, `decision-log.md` D11; a divergence register row; an experiment (R26's E6) measures it before it can become a default; the gate red team's rules (processes ended before a check, fingerprints, one writer of the event file at a time) have to be extended to several workers, which no report has reviewed. Assumption to confirm with the owner at the end: the concurrent-verification option of the recommended answer stays in Wave 1 as well, and the rest of 002 FR-039 to FR-047 stays deferred.

| # | Entry | Question put to the owner | Owner's answer (as chosen or written) | Same as the default? | Date |
|---|---|---|---|---|---|
| 57 | DP-001 | Can Codex be a critic under a read-only sandbox? | "Yes, read-only counts": a read-only sandbox is accepted as tool-less; Codex qualifies as a subscription-backed critic and enters the critic order of decision 17 | **No, differs from the default** (the default was critic only by direct API) | 2026-09-29 |
| 57a | DP-001, follow-up | Where does the read-only Codex critic run? | "In the working tree": the Codex critic runs read-only inside the project and may read files by itself | **Differs from the recommendation. It conflicts with decision 21 (the critic does not see the history of repairs), with Principle III (the critic judges from the grounding snapshot, never from what it reads itself) and with Principle IX (no tools); each needs a stated exception for this harness** | 2026-09-29 |

To apply for rulings 57 and 57a once approved: `constitution-amendment.md` Principles II, III and IX (an exception: a harness critic may hold read-only tools inside an operating-system sandbox; stated as an exception, since both principles are non-negotiable); decision 21's fourth fixed point gets a register row for this harness; `architecture.md` EP-02 (the `completion` level gains a variant "read-only tools") and section 17 (a new threat: repository text and the proposer's own files reach the critic without passing the grounding snapshot); `research-synthesis.md` Codex row; `decision-log.md` C6; feature briefs 131, 117 and 124 (critic order). Mitigation to propose to the owner at the end: before a critic with read tools starts, the runtime moves the proposer's notebook, handoff and outbox out of the working tree, and the sandbox denies reads of `.specstride/`, so that repair history stays withheld even though the critic can read the project.

| # | Entry | Question put to the owner | Owner's answer (as chosen or written) | Same as the default? | Date |
|---|---|---|---|---|---|
| 58 | DP-016 | Does decision 22 require every proposer to continue a session, given that dsh cannot? | "No; files carry context (Recommended)": dsh is fresh-per-pass with file-carried context | Yes | 2026-09-29 |
| 59 | DP-020, DP-022 | Tier 3 and Gemini CLI's tier | "Tier 3 empty; Gemini Tier 2 (Recommended)": Tier 3 ships as an empty allowlist; Gemini CLI is Tier 2 only; terms data re-checked every 30 days | Yes | 2026-09-29 |
| 60 | DP-025 | What guards an auto-picked critic on a metered endpoint? | "Auto-pick with a hard cap (Recommended)": a mandatory hard spending cap, announced at launch; an unverified CLI is never auto-picked; an unverified endpoint may be | Yes | 2026-09-29 |
| 61 | DP-026, DP-027 | May discovery send a credential to a free `GET /models` endpoint, and how is the DeepSeek example read? | "Allow the GET; example is generic (Recommended)": allowed, GET only, the value never stored or logged; the example is any DeepSeek-backed agent or endpoint without a tested adapter | Yes | 2026-09-29 |
| 62 | DP-002, DP-003 | How are skill-trigger evals and budget alerts met on dsh? | "Build an eval driver; engine alerts (Recommended)": a session-log eval driver in Wave 2; alerts from the engine through the digest, the doctor and status output | Yes | 2026-09-29 |
| 63 | DP-004 | Is a user-started, read-only, loopback web viewer allowed under Principle I? | "Yes, allowed (Recommended)": Principle I gets one clarifying sentence; Wave 2 has a web viewer, a terminal follower and a static export | Yes | 2026-09-29 |
| 64 | DP-023, DP-086 | Who reads the sources during derivation, and what does a host without a model do? | "CLI inventories; host judges batches (Recommended)": the CLI inventories; the host judges batches of at most 3,000 tokens; a model-less host may delegate the judgment to a harness named in user config, recorded in the digest | Yes | 2026-09-29 |
| 65 | DP-024 | Which token budgets for the host skills? | "8k / 7k / 1.5k (Recommended)": `specstride-run` 8,000, `specstride-reverse` 7,000, doctor 1,500; a supervision cycle 150, an unchanged cycle 0, a whole run 3,000; CI gates on bytes at 2.8 bytes per token | Yes | 2026-09-29 |
| 66 | DP-030 | How is the cost Claude reports under a subscription treated? | "Notional, kept apart (Recommended)": labelled notional and kept separate from real API-key spend | Yes | 2026-09-29 |
| 67 | DP-006 | How do we proceed on macOS, which is unverified? | "Specify now, verify before release (Recommended)": design from documentation, mark macOS `unverified`, and require a macOS CI runner to pass the parity oracle before release | Yes | 2026-09-29 |

Group 6 of the reading guide is complete with ruling 67.

| # | Entry | Question put to the owner | Owner's answer (as chosen or written) | Same as the default? | Date |
|---|---|---|---|---|---|
| 68 | DP-060, DP-067 | How are output lines handled under parity? | "Reproduce; no new lines under parity (Recommended)": old lines byte for byte, language artefacts included; under the `parity` profile the port prints no new line | Yes | 2026-09-29 |
| 69 | DP-069 | Accept `openspec` as an alias of `openspec-change`? | "Accept the alias (Recommended)": accepted; one fixture changes from exit 3 to success, with a register row and a waiver | Yes | 2026-09-29 |

Group 7 of the reading guide is complete with ruling 69.

| # | Entry | Question put to the owner | Owner's answer (as chosen or written) | Same as the default? | Date |
|---|---|---|---|---|---|
| 70 | DP-021 | How may the Agent SDK transport authenticate? | "API keys only (Recommended)": Tier 2 only; subscription use only through the `claude` CLI subprocess; the SDK is an optional dependency, never bundled | Yes | 2026-09-29 |

All 90 entries of `DECISIONS-PENDING.md` have an answer.

## Points that follow from the rulings

| # | Follows from | Question put to the owner | Owner's answer (as chosen or written) | Date |
|---|---|---|---|---|
| D1 | 57a | Should the runtime hide the proposer's own files from a critic that has read tools? | "Yes, hide them (Recommended)": before such a critic starts, the runtime moves the proposer's notebook, handoff and outbox out of the working tree, and the sandbox denies reads of `.specstride/`; decision 21 holds; the exception to Principles III and IX is limited to reading project files | 2026-09-29 |
| D2 | 56 | Does the concurrent-verification option stay in Wave 1 beside parallel `[P]` tasks? | "Yes, both options (Recommended)": two parallelism options in Wave 1, both off by default; the rest of Lisa's scheduler (002 FR-039 to 002 FR-047, apart from 002 FR-048) stays deferred | 2026-09-29 |
| D3 | 56 | How is the parallel-units feature prepared? | "Research and red team first (Recommended)": a follow-up report R29 designs parallel units as a loop layer with the merge check, and a verifier red-teams it for gate integrity with several workers, before Stage B | 2026-09-29 |

## Conflict rulings of `consolidation.md` that have no pending decision

Conflicts C-04, C-14, C-17, C-20, C-22 to C-27, C-29, C-30, C-31 and C-33 are settled by the rulings above on their pending decisions. C-05 and C-15 are settled by rulings 21 and 22. C-07 is settled by ruling 69. C-28 follows from ruling 22 (grounding refuses every path of the control plane).

| # | Conflict | Question put to the owner | Owner's answer (as chosen or written) | Date |
|---|---|---|---|---|
| K1 | C-01 | Verification default and order: 028 or Lisa? | "028 in full (Recommended)": default mode `required`; the verification gate runs before the critic; Lisa's order is superseded | 2026-09-29 |
| K2 | C-03 | `resume` refusals | "New codes and a spec-hash check (Recommended)": exit 5 when the lock is held, 3 when there is nothing to resume, 3 when the spec's hash changed since launch; the oracle maps the old code 1 | 2026-09-29 |
| K3 | New, from R28 | When does the product check that the spec and plan are unchanged? | "At launch and every pass start (Recommended)": hashes of spec, plan and tasks checked at launch, at resume and at every pass start; a change stops the run with the blocked-on-human signal, naming the file; a divergence register row; today's check at critic start stays under the `parity` profile | 2026-09-29 |
| K4 | C-06, C-08 | Event vocabulary and stop reasons | "New schema + projection; closed enum (Recommended)": one new primary schema; a compatibility projection to a separate file, byte-identical on the oracle's fixtures; stop reasons as a closed, versioned enumeration, each marked transient or not | 2026-09-29 |
| K5 | C-11, C-12 | The critic ensemble and human approvals | "Defer both (Recommended)": one critic in Wave 1 with the critic-strategy seam in place; approvals deferred to Wave 3 or later | 2026-09-29 |
| K6 | C-16, C-21, C-32 | Exit codes | "Keep per-process codes (Recommended)": each process keeps today's codes; usage errors keep the as-is code per command; the doctor exits 0, 1, 2 or 3, with `--strict` making warnings exit 2 | 2026-09-29 |
| K7 | Defect policy | The 54 documented defects and the two found since | "Accept the proposed policy (Recommended)": 25 preserve, 13 fix, 13 drop, 3 deferred as listed in `consolidation.md` section 5, plus "fix" for the proposer start-up that burns about 9 minutes of CPU (`proposer.sh:1807`) and for the `mkdir` lock fallback that is never released; every fix and drop has a register row | 2026-09-29 |
| K8 | Superseded and dropped | The 2 dropped and 11 superseded requirements and success criteria, and the 113 superseded or dropped behaviour items | "Approve all (Recommended)": as listed in `traceability.md` section 4.3, each with its register row or written justification | 2026-09-29 |
| K9 | Constitution amendment | Approve v3.0.0? | "Approve with those three edits (Recommended)": v3.0.0 as proposed, with the edits the rulings require: Principle XI (content captured whenever traces are on), Principles III and IX (an exception for a critic with read-only tools in a sandbox), and the return of Lisa's "Deterministic Parallelism" principle | 2026-09-29 |

## Approved without a separate question

Approved by the final answer, as part of "the architecture, the amendment, the conflict rulings and the
decomposition": every proposal in `architecture.md`, `decision-log.md`, `consolidation.md`,
`traceability.md`, `feature-briefs.md` and `roadmap.md` that no ruling above changes.

## Not approved, because not asked

- The parallel-units design. The owner ruled that it is researched and red-teamed first (D3). The
  feature is specified from R29 and R29v. If they raise a point that needs a ruling, it goes to
  `CLARIFY-QUEUE.md` with a recommended answer, as Stage B does for any open question.
- Any paid probe. None was run in Stage A.

## Rulings given after the approval, on parallel units

R29 and its red team (R29v) both said that feature 142 cannot be written until the owner settles how
ruling 50 reads for it. The owner was asked on 2026-09-29, after the approval.

| # | Follows from | Question put to the owner | Owner's answer (as chosen or written) | Date |
|---|---|---|---|---|
| P1 | 50, 56 | May the runtime (1) make snapshot commits in its own store outside the project's repository, and (2) write the merged result of a parallel group, and the task ticks, into the workspace? | "Yes to both, under conditions (Recommended)": (1) store commits are allowed: outside the project's repository, with fixed author, date and message, never a parent of a project commit, never pushed, removed with the run; (2) exactly two writes to the workspace are allowed, only when the option is on: applying the merged delta (forward only, only audited paths, never undone, nothing under `.git`) and ticking the merged tasks. Ruling 50 stands for everything else | 2026-09-29 |
| P2 | 34, 38, 56 | Does the parallel option require an operating-system sandbox? | "Sandbox required by default (Recommended)": parallel units run only at containment C2 or above; on a harness without a sandbox the option stays off, with the reason stated, unless the consumer sets `loop.parallel.allow_detect` in user config, and then the run says `protection=detect` | 2026-09-29 |
| P3 | 31, 56 | May the part of the tree store that parallel units need be built, although ruling 31 reserved the store and built nothing? | "Build the needed subset (Recommended)": feature 142 builds only the part parallel units need, behind the reserved interface; nothing is built for autoresearch; ruling 31 stands for everything else | 2026-09-29 |
| P4 | 56 | Where does the merge check run, and what happens when it fails? (Asked twice: the first time one option carried the label "Recommended by the red team", which was wrong, since the red team took no position. The orchestrator said so and asked again with the sources stated correctly. Only the second answer counts.) | "Workspace only (R29's recommendation)": the merged delta is applied first and checked on the workspace; a failure goes to serial repair by the proposer in the ordinary loop | 2026-09-29 |
| P5 | 56 | What happens to the partial work of a killed worker, and how many workers run by default? | "Discard; 2 workers, ceiling 4 (R29's recommendation)": a killed worker's partial work is discarded and its unit returns to the serial loop; two workers by default, at most four, both configurable | 2026-09-29 |
| P6 | 22, 56 | What form does a worker's tree take? | "A repository of its own (R29v's recommendation)": each worker tree has its own `.git` inside the tree, borrowing the store's objects read-only; the store stays unwritable by any worker | 2026-09-29 |
| P7 | 39, 56 | Does ruling 39 (no snapshot in Wave 1) bar the tree store's snapshots for parallel workers? | "No, it does not bar them (R29v's recommendation)": ruling 39 concerns what the gate and grounding run on, and they still run on the working tree | 2026-09-29 |
| P8 | 41, 56 | Is the critic told about a protected change that was refused and so never reached the tree? | "Tell the critic, neutrally (R29v's recommendation)": by a neutral kind of event, without a count, revealing nothing about groups or workers | 2026-09-29 |
| P9 | 53, 56 | Is the clustering of file modification times after a merged delta is applied accepted? | "Accept, with a register row (R29v's recommendation)": accepted as a small, named leak; a divergence register row records it; ruling 53 stands | 2026-09-29 |
| P10 | 56 | What is experiment E6 for, given that its pass marks cannot be reached at its planned size? | "A safety experiment (R29v's recommendation)": E6 shows that the option is safe and does not try to prove a saving; the option stays off by default until a corpus exists with phase ceilings of 1.28x or more and at least 71 paired runs | 2026-09-29 |
| P11 | D2 | Concurrent verification commands: what must a command declare? | "Declare reads and writes (R29v's recommendation)": a command declares what it reads and what it writes; two commands run side by side only when neither reads what the other writes; undeclared means serial; the option stays in Wave 1, off by default | 2026-09-29 |
| P12 | K3 | How does a consumer continue after an intended change of spec, plan or task list? | "A flag on resume (Recommended)": a flag on `resume` derives the plan and the check manifest again, records the new hashes, and keeps the counts and the evidence of phases already delivered; without the flag, `resume` refuses with exit 3 and names the changed file; the name of the flag is to be settled | 2026-09-29 |
| P13 | 57, 57a; decision 17 | Where in the critic order does a critic with read-only tools stand when it is picked automatically? | "Step 3, after tool-less candidates (Recommended)": in step 3 of decision 17's order, behind every tool-less candidate of that step; a critic the consumer configured is step 1 as always | 2026-09-29 |
| P14 | 32b; decision 17 | What does the terms gate do for dsh and prime, whose terms are unknown? | "Usable when named; never a default (Recommended)": usable when the consumer names it in config, with the unknown-terms warning; never a default; never picked automatically as critic | 2026-09-29 |
| P15 | 36, 32b | A dsh plugin install writes into the consumer's real home, which ruling 36 says a run never writes. Which holds? | "Allowed for plugins you listed (Recommended)": a plugin install is allowed only for plugins named in an allowlist in user config; the allowlist is the consent to exactly that write; every install is recorded; ruling 36 holds for everything else | 2026-09-29 |
| P16 | R11 | Which size does the verdict nonce have? (The owner first asked "Wat is the benefit of 128?"; the orchestrator explained that a nonce is used for one critic call and allows one guess, so more bits add no practical protection, and asked again.) | "Keep 64 bits (Recommended)": parity with today; no register row | 2026-09-29 |
