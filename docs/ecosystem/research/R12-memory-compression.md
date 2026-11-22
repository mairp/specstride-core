# R12 — Hierarchical memory and Markovian compression

Feeds `architecture.md` (the memory decision) and `feature-briefs.md` (whether 114-memory is specified, and in which wave).
Written 2026-09-29. No paid model calls were made. No source repository was modified.

Neighbours: R24 owns carry-over within a run (pass, attempt, phase, relaunch). R23 owns what the critic may see. This report owns memory across runs and projects, and the overall layering. Where this report touches their ground it states a constraint and defers the design.

Short answer: **do not build a memory subsystem in Wave 1.** The cold-start bill is mostly a prompt-assembly problem that a deterministic projection fixes, not a memory problem. Port the existing learning feature as it is. Keep a lessons store on the roadmap behind an experiment that it has to pass. Close one uncontrolled memory channel that exists today (harness-native memory).

## Prior art consulted

| Source | Read | Reused, extended or contradicted |
|---|---|---|
| `prompts/specstride-ecosystem.md` §0–§6 | in full | Decisions 3, 4, 6, 16, 19, 21, 22 and the 114-memory row (`:489`) constrain the answer. |
| `prompts/analysis/A5-run-time-evidence.md` | in full | **Reused** as the provisional baseline. **Extended**: I re-measured the prompt files and `PROGRESS.md` (Findings F1–F3). `PROGRESS.md` has grown from A5's 117 KB to 206 KB. |
| `prompts/analysis/A6-micro-loop-survey.md` §4 (`:187-218`) | sections on carry-over | **Reused**: "carry artefacts on disk plus a short distilled summary, not transcripts" (`:218`), and the point that practice on compaction flipped twice within a year (`:205-208`). **Extended** with sources A6 does not have (coding-task memory benchmarks from 2026). |
| `prompts/analysis/A7-local-loop-prior-art.md` | memory and learning rows (`:66-78`, `:121-122`, `:182`, `:298-299`) | **Reused**: the inventory of carriers, and "any memory must be Specstride-owned and outside `gates/`" (`:299`). Verified its claim that Lisa's `run.ts` does not reference the memory store. |
| `/root/specstride-harness-roadmaps/roadmap/self-improving-loop-plan.md` | in full | **Reused**: the rule "nothing the loop learns may change what the critic reads or what a verdict means" (`:12-14`), the evaluation discipline, the "What not to do" list (`:158-169`), and the Corrections (`:181-242`). **Extended**: items 8 and 9 (`:73-74`) are placed in the layering below with the conditions under which they may ship. |
| `.../self-improving-loop-report.md` | in full | **Reused**: the measured minimum detectable effect (`:134-139`), which sizes the experiment. The fact that no applied arm has ever run live (`:181-184`). |
| `.../self-improvement-loops-shipped.md` | in full | **Reused**: what exists (yield, prestage, knobs, evaluate). "Still open" (`:81-88`). |
| `.../research/self-improvement-loops/01-literature-and-patterns.md` | §2–§4 | **Reused**: recommendation 3 (append-only deltas with provenance and retirement, `:237-243`). **Contradicted in part**: it proposes the Reflector read archived `GATE*-FEEDBACK.md`; the later plan (risk 2, `:140-145`) and the 2026 evidence both say lessons must not come from critic feedback. The plan wins. |
| `.../02-wiggum-loop-design.md` §5 | `:319-434` | **Reused**: observations and decisions are separate stores (`:378-379`); five invariants (`:395-410`). `global.json` (`:375`) was designed and never built. |
| Specstride `lib/learn.py` at `9cab15d` | header, allowlist, observe, outline (2 221 lines) | **Reused** as the across-runs layer that exists. |
| Specstride `orchestrator.sh`, `proposer.sh`, `lib/critic.py`, `lib/verification_plan.py` at `9cab15d` | prompt assembly and carriers | Source of the carrier inventory (F4). |
| `old/028-as-is-specstride/spec.md` | learning story `:80-88`, 028 FR-024 `:155`, entities `:173-179` | The learning requirements that feature 106 receives. |
| `old/011-as-is-mixture-of-loops/spec.md` | 011 US6 `:92-103`; 011 FR-003 `:123`, FR-016 `:149`, FR-018 `:153`, FR-021 `:159`, FR-024 `:165` | The binding of learning into the contract, and the retrospective. |
| Lisa `packages/memory/src/{store,learn}.ts` | in full (668 lines of product code) | **Reused**: file format, atomic writes, provenance field, proposal-then-approval, redaction, retirement. **Contradicted**: its mining source, its critic addenda, its effect metric and its overwrite semantics (F7). |
| `.specify/memory/constitution.md` Principles I, VIII, IX | Principle I text `:103-119` | Every layer proposed is plain files read at a defined point. No daemon, no index service, no vector store. |
| `/root/agentic-netops-srl/.specstride/features/004-agentic-netops-composite/` | sizes and headings only, read-only | Measurements F1–F3. |

## Questions answered

**Q1. What does the literature on bounded-state (Markovian) reasoning support?**
It supports the idea, not a mechanism Specstride can adopt. The measured results are on a single model's reasoning trace for mathematics and question answering, and one of them needs the model to be trained for it. On software engineering the one controlled comparison found shows a fresh-context loop resolving the fewest tasks. What transfers is the design rule: make the state that crosses a boundary small, explicit and on disk. Specstride already has the structure (each pass is a function of the files on disk). What it lacks is a compact state: the state it carries is 206 KB of prose plus a 193–216 KB block that is re-sent every pass. (F1–F3, F8–F10)

**Q2. What does the literature on tiered agent memory support?**
For coding agents, measured on repository tasks in 2026: memory helps when the content is curated or verified, and is neutral or harmful when the agent builds and retrieves it by itself. Eleven of twelve solver and memory-system pairings failed to beat memory-off in the most recent benchmark. Automatically generated repository context files lowered success and raised cost by over 20 %. Unfiltered accumulation propagates errors. The headline numbers vendors quote come from conversational benchmarks where full context wins or ties. (F11–F17)

**Q3. What does the literature on context compaction support?**
Deterministic trimming (masking or dropping old tool output) matches LLM summarization on solve rate at the same or lower cost, on SWE-bench Verified. Summaries lengthen trajectories, and every method tested loses track of which files were touched. Rewriting a summary of a summary is the documented failure. (F18–F21)

**Q4. Does memory make sense at each Specstride scope?** See "Options compared", table 1. In one line each:

| Scope | Answer |
|---|---|
| Within an attempt | No memory. Session continuation (decision 22) and deterministic trimming. R24 owns it. |
| Across attempts in a phase | Already exists and works (feedback, anti-fixation gist, hint, acceleration note, checkpoint). Port it. Add nothing. |
| Across phases | Yes, as a **deterministic projection**, not as memory. This is where the tokens are. |
| Across runs, same feature | Yes, in the form that exists: numeric observations and bounded knob decisions (feature 106). A text lessons store only after an experiment, off by default, operator-approved. |
| Across projects | No content memory. Numeric priors stay on the roadmap, never applied without local samples. |

**Q5. How does this relate to what exists?** See F4–F7 and "Prior art consulted". The learning feature is the across-runs memory and is reused unchanged. Lisa's memory package contributes its file format and governance and nothing else. The plan's items 8 and 9 are kept, with conditions.

**Q6. What is the experiment?** One experiment in two stages with three arms, against A5's cold-start baseline. Stage 1 costs nothing (offline prompt assembly over recorded state). Stage 2 is live and is sized by the measured minimum detectable effect. See "Recommendation", part 5.

**Q7. Does the recommendation change the shape of the core engine?** No. It adds one interface (a provider of proposer prompt blocks, with a byte budget and a digest) and one rule (harness-native memory is off for the critic, and off by default for the proposer). Three items still need the owner's ruling and are listed under "Open questions / risks".

## Findings

### Local measurements

**F1.** `verified-local` The proposer prompt in the reference run is dominated by one block. Command: a heading-to-heading byte count over `proposer-prompt.phase12.txt` and `proposer-prompt.phase15.txt` in `/root/agentic-netops-srl/.specstride/features/004-agentic-netops-composite/`.

| Prompt file | Total bytes | "Inherited obligations from earlier approved phases" | Share |
|---|---|---|---|
| phase 12 | 274 729 | 193 251 | 70 % |
| phase 15 | 311 964 | 215 924 | 69 % |

This confirms A5's figure (193 KB of 272 KB). In phase 12 the block holds 152 list entries averaging 1 282 bytes each. Prompt files run from 54 KB (phase 1) to 312 KB (phase 15); thirteen of fifteen exceed the 180 000-byte budget at `orchestrator.sh:1430`.

**F2.** `verified-local` The block is generated, not remembered. `lib/verification_plan.py:1194-1200` at `9cab15d` emits one line per inherited obligation as `"- %s — %s" % (o["id"], o["title"])`. The titles are whole task texts, which is why a "compact one-liner" (the wording at `lib/critic.py:1255-1257`) averages 1.3 KB.

**F3.** `verified-local` `PROGRESS.md` in that run is 206 041 bytes and 1 693 lines (`wc`), against 117 KB and 1 580 lines when A5 measured it. It is append-only prose that the prompt tells every pass to "Read FIRST" (`orchestrator.sh:1505-1506`). Nothing bounds it and nothing retires entries.

**F3a.** `inferred` The inherited block is roughly 48–54 k tokens of the 107.8 k median first-turn context, so about half. Rests on F1 and an assumed 4 bytes per token for English technical prose. The exact figure is what stage 1 of the experiment measures.

**F3b.** `inferred` Because a pass keeps its prompt in context for every turn, the block is paid for again as a cache read on each turn, not once. A5 records 998 M input tokens "almost all cache reads" over 141 passes against 15.3 M first-turn tokens, a ratio of about 65 turns' worth of context per pass. Rests on A5 §4 and F1. Removing the block therefore cuts far more than first-turn tokens.

### What already carries context (the as-is layering)

**F4.** `verified-local` Specstride at `9cab15d` has eight carriers. None is called memory.

| Scope | Carrier | Where | Form |
|---|---|---|---|
| Pass → pass | `PROGRESS.md` | prompt text `orchestrator.sh:1505-1508` | Unbounded prose, written by the proposer |
| Pass → pass, after a kill | Pass checkpoint | `proposer.sh:944` (write), `:1131` (prompt block) | Last 25 tool calls, last 5 messages, per-reason advice |
| Pass → pass, across a wait | Yield `on_resume` | `orchestrator.sh:1485-1486` | One string handed back verbatim with the job result |
| Attempt → attempt | Critic feedback | `orchestrator.sh:1564-1572` | The rejection, in full |
| Attempt → attempt | Anti-fixation gist | `orchestrator.sh:1573-1589` | One line per earlier rejection, about 200 bytes each |
| Attempt → attempt | Diagnostician hint, acceleration note | `orchestrator.sh:1590-1606` | Advisory text; "do NOT redo" |
| Phase → phase | Inherited obligations | `verification_plan.py:1194-1200` | F1, F2 |
| Run → run | Learning observations and decisions | `lib/learn.py`; `<feature-dir>/learning/phase-<N>.json`, `learning/applied.json` | Numbers only |

After approval the attempt-level files are moved into `attempts/` (`orchestrator.sh:2065-2070`) and are never read again by a later phase or run.

**F5.** `verified-local` The across-runs layer is numeric and locked. `ADJUSTABLE_KNOBS` holds exactly `proposer_timeout` and `yield_poll_interval` (`lib/learn.py:904-907`), with hard bounds and a ±50 % step (`:911-913`). Observations and decisions are separate files by design (`learn.py` docstring; `02-wiggum-loop-design.md:378-379`). Learned state is keyed on a hash of the phase's text, so an edited phase does not inherit old samples (`self-improving-loop-report.md:38-47`). This is 028 FR-024 (`spec.md:155`).

**F6.** `verified-local` The reference run wrote observations and no decisions: `learning/` holds `phase-4.json` … `phase-14.json` and no `applied.json` (`ls`). The shipped record says the same of every run: "No live run has exercised an applied arm" (`self-improvement-loops-shipped.md:83-84`). So the across-runs memory that exists has never changed a run's behaviour. Any claim about its benefit is untested.

**F7.** `verified-local` Lisa's memory package is a library nothing uses, and its learning half conflicts with Specstride's rules.

| Aspect | Evidence | Verdict |
|---|---|---|
| Wiring | No file outside `packages/memory/` imports `@lisa/memory` (`grep -rn "lisa/memory"` over `*.ts`, `*.tsx`, `*.mjs`, `package.json`, excluding `node_modules` and `dist`). | Unused |
| Baseline drift | `git diff --stat 76adfdc 363e6a3 -- packages/memory`: a removed demo file and a `"license": "MIT"` line. `src/` is identical on both trees. | R1's ruling on the tree does not affect this package |
| Store | Markdown with frontmatter, one file per entry, atomic write, directory scan as the only state (`store.ts:197-208`, `:266-287`); a `source` provenance field (`:55-56`) | **Reuse the format.** Consistent with Principle I |
| Governance | Proposals are never written without approval; the approval commits to a hash of the exact entry (`learn.ts:220-262`). Redaction drops secrets and raw prompts (`learn.ts:57-108`). Retirement exists (`:265-267`) | **Reuse the rules** |
| Mining source | Lessons are mined from **critic rejections**, and the body quotes the critic's feedback (`learn.ts:130-168`) | **Contradicts** plan risk 2 (`self-improving-loop-plan.md:140-145`) |
| Critic addenda | A policy pack "becomes a standing critic addendum" (`learn.ts:237`; header `:5`) | **Contradicts** the rule that nothing learned reaches the critic |
| Effect metric | `effectMetrics` scores a memory by reject rate and attempts per phase (`learn.ts:298-318`) | **Contradicts** "Reward approval rate or attempts-to-approval" in What not to do (`plan:160`) |
| Writes | `put()` overwrites an entry (`store.ts:246-251`) | **Contradicts** the append-only, delta-only rule (F13) |
| Recall | Lexical and semantic ranking (`store.ts:293-349`) | Not needed. A lessons block must be selected deterministically so that the launch contract can bind its hash |
| Default scope | Operator corrections are promoted to `scope: "global"` (`learn.ts:187`) | Crosses projects by default. Not acceptable for a distributed product (decision 19) |

### Harness-native memory: an uncontrolled channel

**F8.** `verified-doc` Claude Code loads two kinds of memory at the start of every session: CLAUDE.md files, and auto memory, which the model writes for itself. Auto memory is on by default, is stored per repository at `~/.claude/projects/<project>/memory/`, and the first 200 lines or 25 KB of its `MEMORY.md` are loaded into every session. It is disabled with `autoMemoryEnabled: false` or `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`. It is machine-local. The main conversation's auto memory is not loaded into subagents. (https://code.claude.com/docs/en/memory, accessed 2026-09-29)

**F8a.** `verified-local` The reference run's proposer sessions use the operator's real config home: A5 located their transcripts under `/root/.claude/projects/-root-agentic-netops-srl/`. That directory has a `memory/` folder with a `MEMORY.md` of 2 132 bytes modified 2026-09-28, while the run was alive (`ls -la`). I did not read its content and did not establish whether a proposer pass or an interactive session wrote it.

**F8b.** `inferred` Under decision 6 (Tier 1 runs the installed CLI under the user's own login) every proposer pass loads the repository's auto memory, and a critic invoked as a CLI subprocess in the same working directory would load it too. That is a channel from one session to another that the launch contract does not record, the digest does not cover, and the critic's independence rule does not see. It is the same kind of hole as the inherited `SPECSTRIDE_LEARNING` variable the plan closed as item 0 (`self-improving-loop-plan.md:37-44`). Rests on F8, F8a and decision 6. `--bare` would close it but needs an API key (A4 `:32`), so it is unavailable on a subscription. Other harnesses have the same kind of feature (F16).

### Survey: bounded-state and Markovian reasoning

Survey figures marked † come from a paper's HTML tables read through a fetch-and-extract step by a delegated agent. I re-fetched the pages behind F8, F9, F9a, F10a, F13, F14, F15, F15a, F17b, F18 and F21 myself (abstracts or documentation pages) and they agree; the other rows rest on the delegated agent's reading alone; table-level numbers should be spot-checked before they are quoted elsewhere. All accessed 2026-09-29.

| # | Claim | Measured or asserted | Tag and source |
|---|---|---|---|
| F9 | The Markovian Thinker trains a 1.5 B model to reason in 8 K chunks with a short carried state and matches a 24 K-budget baseline. Estimated training cost at 96 K thinking: 7 against 27 H100-months. | Measured, mathematics. Needs reinforcement-learning training of the model. Coding gains described as modest†. | `verified-doc` https://arxiv.org/abs/2510.06557 |
| F9a | Atom of Thoughts decomposes reasoning into self-contained units so each state drops its history. Reported gains over chain-of-thought on mathematics, question answering and single-function code†. | Measured. No repository-level tasks. | `verified-doc` https://arxiv.org/abs/2502.12018 |
| F9b | Markov Chain of Thought compresses prior steps into a simplified question. | Measured on mathematics; the abstract gives no figures. | `verified-doc` https://arxiv.org/abs/2410.17635 |
| F10 | The "Ralph loop" (fresh context each iteration, state in files) is supported by anecdote: a contract delivered for USD 297. | Asserted. No control. | `verified-doc` https://ghuntley.com/ralph/ |
| F10a | LoopsBench: 112 tasks as dependency graphs, 8 languages. The strongest configuration resolves 25.00 %. Per-loop table†: Ralph loop 7.84 % resolved with 0.17 regressions per run; stateful goal modes 17.65–20.59 %; dynamic workflows 24.11 % with 0.36 regressions. | Measured, software engineering. The only controlled comparison of a fresh-context loop found. | `verified-doc` https://arxiv.org/abs/2608.00267 |
| F10b | Anthropic's long-running harness uses fresh sessions with a progress file and a feature list and states that compaction is not sufficient. | Asserted. No benchmark. | `verified-doc` https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents |

**F10c.** `inferred` None of F9–F9b measures a tool-using agent whose state is a repository. They show that a small explicit state can replace a long history when the task is self-contained reasoning. F10a suggests a pure fresh-context loop costs resolution but regresses less. Specstride's gate already supplies what the Ralph loop lacks (an independent check), so the transferable part is the compact state and not the reset.

### Survey: tiered and hierarchical memory

| # | Claim | Measured or asserted | Tag and source |
|---|---|---|---|
| F11 | Mem0 reports a 26 % relative gain over a vendor memory and over 90 % token savings on LoCoMo. Its own table† shows full context scoring higher (72.90) than Mem0 (66.88–68.44). | Measured by the vendor, conversational | `verified-doc` https://arxiv.org/abs/2504.19413 |
| F11a | A competing vendor disputes those figures and notes LoCoMo conversations fit in a context window. A third vendor reports a plain filesystem agent scoring 74.0 % on the same benchmark. | Measured by interested parties; unreplicated | `verified-doc` https://blog.getzep.com/lies-damn-lies-statistics-is-mem0-really-sota-in-agent-memory/ ; https://www.letta.com/blog/benchmarking-ai-agent-memory |
| F11b | An audit claims 6.4 % of LoCoMo's answer key is wrong. | Not confirmed | `unverified` Seen only as a search snippet; the page was not fetched. |
| F12 | Reflexion reaches 91 % pass@1 on HumanEval against 80 %. It is a reflection buffer across retries of **the same task**, driven by test feedback. | Measured, function-level code | `verified-doc` https://arxiv.org/abs/2303.11366 |
| F13 | ACE names two failure modes: brevity bias ("drops domain insights for concise summaries") and context collapse ("iterative rewriting erodes details over time"). Its remedy is structured incremental updates. +10.6 % on agent benchmarks. Example†: one rewrite took a context from 18 282 tokens to 122 and accuracy from 66.7 to 57.1. | Measured; not coding | `verified-doc` https://arxiv.org/abs/2510.04618 |
| F14 | Repository context files "do not generally improve task success rates, while increasing inference cost by over 20% on average". Agents follow instructions in them; repository overviews "are not helpful". Generated files lowered success slightly; developer-written files raised it by about 4 %†. | Measured, software engineering | `verified-doc` https://arxiv.org/abs/2602.11988 |
| F15 | SWE-ContextBench (1 100 base and 376 related tasks): accurately summarized and retrieved experience improves resolution and cost; "unfiltered or incorrectly selected context provides limited or negative benefits". Lite subset†: no context 26.26 %, oracle summary 34.34 %, self-retrieved summary 22.22 %. | Measured, software engineering | `verified-doc` https://arxiv.org/abs/2602.08316 |
| F15a | VibeMemBench (111 targets, 3 634 historical trajectories): directly injected experience adds 1.1 to 4.5 points, and "eleven of twelve solver and system pairings fail to exceed the matched memory-off baseline". | Measured, software engineering; nine days old | `verified-doc` https://arxiv.org/abs/2609.23570 |
| F15b | Subtask-level memory adds 4.7 points on SWE-bench Verified; instance-level memory misguides retrieval. Cross-domain memory adds 3.7 % on six coding benchmarks; abstract insights transfer and low-level traces transfer negatively. | Measured by the methods' authors | `verified-doc` https://arxiv.org/abs/2602.21611 ; https://arxiv.org/abs/2604.14004 |
| F16 | Other harnesses have their own memory: Codex concatenates `AGENTS.md` files and has a memories feature that is off by default; Devin has a knowledge store being replaced by skills. None publishes efficacy figures. | Asserted (product documentation) | `verified-doc` https://learn.chatgpt.com/docs/agent-configuration/agents-md ; https://docs.devin.ai/product-guides/knowledge |
| F17 | Agents replay what they retrieve: similar records produce similar outputs, so a stored error is repeated. Adding everything to memory scored 55.48 % against 70.95 % with strict selective addition†. | Measured; one of four agents generates code | `verified-doc` https://arxiv.org/abs/2505.16067 |
| F17a | Memory can be poisoned through ordinary inputs, with injection success above 95 %† and attack success above 80 % at a poison rate under 0.1 %. | Measured; not repository agents | `verified-doc` https://arxiv.org/abs/2503.03704 ; https://arxiv.org/abs/2407.12784 |
| F17b | Anthropic's memory tool with context editing improved an internal agentic-search evaluation by 39 %, context editing alone by 29 %, and cut tokens by 84 % on a 100-turn web-search evaluation. The memory tool stores files client-side. | Measured by the vendor on unreleased, non-coding evaluations | `verified-doc` https://claude.com/blog/context-management |

### Survey: context compaction

| # | Claim | Measured or asserted | Tag and source |
|---|---|---|---|
| F18 | On SWE-bench Verified, masking old observations halves cost against an unmanaged agent and matches or beats LLM summarization on solve rate. Example†: raw 53.4 % at USD 1.29, masking 54.8 % at 0.61, summary 53.8 % at 0.64. Summaries lengthen trajectories by about 15 %†. | Measured, software engineering, five model configurations. The strongest source in this survey. | `verified-doc` https://arxiv.org/abs/2508.21433 |
| F18a | A 2026 method that only truncates or drops, never rewrites, and never compacts a compaction reports up to 50 % lower cost at equal or better Terminal-Bench performance. | Measured; one week old | `verified-doc` https://arxiv.org/abs/2609.26779 |
| F19 | A vendor evaluation of compaction over 36 611 messages scores every method between 2.19 and 2.45 out of 5 on tracking which artifacts were touched, its weakest dimension†. | Measured by a vendor with an LLM judge; not task success | `verified-doc` https://factory.com/news/evaluating-compression |
| F20 | Model performance degrades as input grows, and distractors make it worse. | Measured on retrieval tasks, not coding | `verified-doc` https://www.trychroma.com/research/context-rot |
| F20a | One vendor reports that notes the model wrote for itself "weren't comprehensive enough" and that relying on them degraded performance. | Asserted (internal observation) | `verified-doc` https://cognition.com/blog/devin-sonnet-4-5-lessons-and-challenges |
| F21 | Anthropic prompt caching: a 5-minute cache write costs 1.25× base input, a 1-hour write 2×, a cache read 0.1× with lower model-specific rates listed on the page. Changing earlier content invalidates everything after it. | Documentation | `verified-doc` https://platform.claude.com/docs/en/build-with-claude/prompt-caching |
| F21a | Compaction and tool-result clearing both invalidate the cached prefix, and server-side compaction is billed as its own sampling step. OpenAI's compaction item is encrypted and "not intended to be human-interpretable". | Documentation | `verified-doc` https://platform.claude.com/docs/en/build-with-claude/context-editing ; https://platform.claude.com/docs/en/build-with-claude/compaction ; https://developers.openai.com/api/docs/guides/compaction |
| F21b | No source measured the net cost of fresh-context against compacted loops once caching is priced in. | — | `unverified` Searched across the sources above; none reports it. The experiment below measures it for Specstride. |

### What the evidence adds up to

**F22.** `inferred` A summary written by the proposer is not evidence. It loses the artifact trail (F19), it can collapse under rewriting (F13), and the proposer's account of its own progress is what decision 21 already keeps from the critic. Anything the critic reads must be read from disk or produced by the runtime. Rests on F13, F19 and decision 21.

**F23.** `inferred` Memory written without a check is more likely to hurt than help a coding agent today. Rests on F14, F15, F15a, F17. The exception the evidence supports is small, curated, instruction-like content (F14: instructions are followed; developer-written files gain about 4 %).

**F24.** `inferred` The cheapest saving available is removing generated text that is re-sent, not adding remembered text. Rests on F1–F3b and F18. An index of 152 obligations at about 120 bytes each is 18 KB in place of 193 KB.

**F25.** `inferred` An opaque or harness-managed compaction cannot be verified by Specstride and differs by harness, so it cannot be part of a contract that must work on discovered harnesses (decision 17). Anything Specstride carries must be a file Specstride wrote. Rests on F21a, decision 17 and Principle I.

## Version/date pins

| Item | Pin | Verified on |
|---|---|---|
| Specstride baseline | `9cab15d` (`git show`, extracted to scratch) | 2026-09-29 |
| mixture-of-loops baseline | `9c88f86`; retrospective at `skills/mixture-of-loops/scripts/supervisor_lib.py:1292-1386` | 2026-09-29 |
| Lisa | `packages/memory/src` identical at `76adfdc` and `363e6a3` | 2026-09-29 |
| Claude Code | installed 2.1.284 (prompt §1); memory documentation as published | 2026-09-29 |
| Claude Code auto memory | on by default; 200 lines or 25 KB loaded; `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` | 2026-09-29 |
| Anthropic prompt caching | write 1.25× (5 min), 2× (1 h); read 0.1× with model-specific exceptions | 2026-09-29 |
| Reference run state | `PROGRESS.md` 206 041 bytes; prompt files as in F1 | 2026-09-29; the run is live, so these grow |
| Survey | about 50 primary pages fetched by a delegated agent; 11 re-fetched by me | 2026-09-29 |

## Options compared

### Table 1. Scope by scope

Cost is the cost of building and running the layer. Verifiability is whether a third party can check the carried content against something else. Critic risk is the risk of removing or colouring evidence the independent critic needs.

| Scope | Does memory make sense? | Form | Cost | Verifiability | Critic risk | Owner |
|---|---|---|---|---|---|---|
| Within an attempt | No. The session is the memory (decision 22). | Session continuation where supported; files otherwise. If context must shrink, mask or drop old tool output; never summarize with a model. | Low | High: nothing is rewritten | None, provided the critic always starts fresh (decision 22) | R24 |
| Across attempts in a phase | It exists (F4). | Feedback, gist, hint, acceleration note, checkpoint. Ported for parity. | None beyond the port | High: each is a file with a known writer | Low. These are proposer inputs. The critic's own view of earlier attempts is R23's. | R24, R23 |
| Across phases | Yes, as derived state | (a) Inherited obligations as an **index**: ID, a title cut to a fixed length, and the path where the full text is. (b) A **ledger** written by the runtime: per kept unit, the task ID, commit, check result and time. `PROGRESS.md` stays the proposer's notebook and stops being the required first read. | Low. A change to prompt assembly. | **Full**: both can be regenerated from the plan, git and events and compared byte for byte | None for the proposer side. The critic's copy of the block is not changed by this report (R23). | R24 designs; this report sets the constraint |
| Across runs, same feature | Yes, numeric. Text only after the experiment. | Today's observations and decisions (feature 106). Later, a lessons file: append-only entries, operator-approved, process-only, budgeted, with provenance and a retirement rule. | Numeric: the port. Text: medium, mostly the evaluation. | Numeric: high (recomputable from events). Text: medium (provenance points at events; usefulness is statistical). | Numeric: low, guarded by the allowlist and the critic-input guardrails. Text: **high if lessons come from critic feedback**, so they must not. | This report |
| Across projects | No content. | Numeric priors keyed on phase shape and harness label, used only to shrink an estimate, never applied without local samples (plan item 9). | Medium | Low: different projects, models and harness versions | Low for numbers. **High for text**: leaks one project's content into another and is an injection path (F17a). | This report; roadmap |

### Table 2. What to build

| Option | Token saving against baseline | Build cost | Risk to the gate | Evolvability | Evidence |
|---|---|---|---|---|---|
| A. Nothing: port as-is | 0 | 0 | None | Neutral | — |
| B. Deterministic projection (index and ledger) | Large: about half of first-turn context (F3a), repeated on every turn (F3b) | Low | None | Good: a prompt-block provider is an extension point | F1–F3, F18, F18a |
| C. LLM-written rolling summary of progress | Similar to B on paper | Medium, plus a model call per boundary | Medium: a proposer-side narrative, lossy (F13, F19) | Poor: quality depends on the model (A6 `:205-208`) | Against: F13, F18, F19, F20a |
| D. Lessons store across runs, automatic | Negative: it adds tokens | Medium | High (F17, plan risk 2) | Medium | Against: F14, F15, F15a, F17 |
| E. Lessons store across runs, operator-approved, process-only, off by default | Negative in tokens; possible saving in passes | Medium | Low if the rules in part 4 hold | Good | For, weakly: F14 (instructions), F15 (curated). Unproven here. |
| F. Retrieval memory (lexical or vector recall, as in Lisa or a fleet memory server) | Negative | High | Medium; non-deterministic selection cannot be bound into a contract | Poor: adds a service or an index | Against: F15, F15a |
| G. Harness-native memory left on | Unknown | 0 | **Uncontrolled** (F8b) | Poor: differs per harness | Against: F8b, F14 |

B is chosen for Wave 1 through R24 and R27. E goes to the roadmap behind the experiment. C, D, F and G are rejected.

## Recommendation

**One recommendation, in five parts. Confidence: high for parts 1, 2 and 3; medium for parts 4 and 5.**

**1. Do not specify 114-memory in Wave 1.** No layer this report chooses needs a feature of its own in Wave 1. The memory decision for `architecture.md` is the layering in table 1: state crosses a boundary only as a file the runtime or a named role wrote, and only three kinds of thing may cross: evidence (on disk, read by the critic), derived state (regenerable), and decisions (append-only, bounded, reversible).

**2. Fix the cold start with a deterministic projection, not with memory.** This belongs to R24 and R27 and lands in features 103 and 115. The constraints this report sets on it:

- The projection is a pure function of the verification plan, git and the event stream. A test regenerates it and compares.
- No model writes any part of it.
- It is switched off under the parity oracle and has a divergence register row, because it changes the proposer prompt that the old code produces.
- The critic's prompt is not changed by it. Whether the critic's copy of the inherited block can also be indexed is R23's question, and the default is that it is not.
- The 180 000-byte budget at `orchestrator.sh:1430` applies per block today and was exceeded in thirteen of fifteen phases (F1); the new assembler budgets the whole prompt.

**3. Port the learning feature unchanged as the across-runs layer, and close the harness-memory channel.**

- Feature 106 receives 028 FR-024 and 011 FR-003, FR-016, FR-018, FR-021 and FR-024 as they are. The allowlist stays at two knobs. The invariants of `02-wiggum-loop-design.md:395-410` and the Corrections in the plan are carried into the spec as requirements.
- The critic never starts with harness-native memory. For Claude that means auto memory disabled and no CLAUDE.md discovery in the critic's session; the exact flags are R5's. For any harness, the adapter descriptor declares whether the harness has native memory and how to switch it off, and a harness that cannot switch it off does not qualify as a critic.
- The proposer runs with harness auto memory off by default. A project's own checked-in instruction file (CLAUDE.md, AGENTS.md) is repository content and stays. Each run records in its events and digest whether harness memory was on. The doctor reports it.

**4. Keep a lessons store on the roadmap, with these rules fixed now** so that nothing built earlier closes the door or opens the wrong one:

| Rule | Reason |
|---|---|
| Off by default; the launch contract declares it and binds a hash of the entries in force, as it does for learning decisions (011 FR-003) | The contract says what runs |
| Entries are proposed by the runtime and activated only by the operator | F7, F15, F23 |
| Sources are proposer-side process events only: kill reasons, repeat-stall targets, dropped prompt blocks, failed inner checks. Never critic feedback, verdicts or diagnostician output | Plan risk 2; F22 |
| Read only by the proposer prompt assembler. A test locks the read sites, as for `learn.py` | `self-improving-loop-report.md:54-57` |
| Stored outside every directory the critic's grounding search covers (`lib/critic.py:505-530`) | A7 `:223` |
| Append-only entries with provenance (run, event) and a retirement rule; never rewritten as a whole | F13; plan `:165`, `:169` |
| A fixed byte budget for the whole block, selected deterministically | F14 (cost), F25 |
| Scope is the feature. Project scope needs a second approval. There is no global scope | Decision 19; F17a |
| Redaction before proposal | Lisa `learn.ts:57-108` |
| Judged by cost and time per pass with the critic-input guardrails; a shift in first-attempt approval in either direction is an alarm | Plan `:118-119` |

Cross-project numeric priors (plan item 9) stay on the roadmap after this, unchanged.

**5. The experiment.** One experiment, two stages.

| | |
|---|---|
| Question | How much of the cold-start bill does a deterministic compact state remove, and does an approved lessons block add anything on top? |
| Baseline | A5 §4: median first-turn context 107.8 k tokens per pass (p90 129 k); 998 M input tokens and USD 515 recorded over 141 passes; 3.2 h before first action. R21's figures replace these when R21 is done. |
| Arms | **A** cold start as today. **B** A with the index and ledger of part 2. **C** B with a lessons block under the rules of part 4. |
| Stage 1 (offline, no model calls) | Re-assemble the proposer prompt for every recorded pass of the reference run under A and B and count tokens with the provider's token counter. Output: first-turn tokens per pass and per phase. |
| Stage 1 pass mark | First-turn tokens under B at least 40 % below A at the median, and no phase over the prompt budget. |
| Stage 2 (live) | Paired runs of the same feature on a reference project, arms interleaved by phase, same model and harness version throughout. |
| Primary metrics | Input tokens per pass (first-turn and total), and cost per pass on the log scale, clustered by phase. |
| Secondary | Tool calls and minutes before the first action; passes per approved phase. |
| Guardrails (any breach fails the arm) | The critic's input is byte-identical across arms for the same tree; the false-MISSING rate and MALFORMED rate do not rise; first-attempt approval does not shift in either direction; no rejection traced to a stale ledger or index entry. |
| Size | Token counts in stage 1 are deterministic, so one replay decides. For cost per pass the measured within-phase spread (sd of log cost 0.554 median) puts the detectable effect at about +218 % with 3 passes per arm, and 30 % needs 58–97 passes per arm (`self-improving-loop-report.md:134-139`). Stage 2 therefore needs on the order of 60 passes per arm for B against A. |
| Decision rule | B enters the default if stage 1 passes and stage 2 breaches no guardrail. C is adopted only if it beats B by more than the detectable effect on cost or passes per approved phase; otherwise 114-memory is not specified and the lessons store stays on the roadmap. |
| Expected result | B passes. C shows no detectable effect at an affordable sample size. That outcome is a finding, not a failure: it confirms the "no". |

R27 owns the experiment list; this is offered to it as one entry.

## Matrix rows

None for the two matrices as defined.

One fact for R5 and R20 to place, since neither matrix has a column for it:

| Harness | Native memory | Loaded when | Off switch | Source |
|---|---|---|---|---|
| Claude Code | CLAUDE.md files and auto memory | Every session start; auto memory limited to 200 lines or 25 KB | `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`, `autoMemoryEnabled: false`; `--bare` skips CLAUDE.md but needs an API key | F8; A4 `:32` |
| Codex | `AGENTS.md` concatenation (32 KiB cap); memories feature off by default | Session start | Per its documentation; not verified here | F16 |
| Any discovered harness | Unknown | Unknown | Must be declared in the descriptor; undeclared means not eligible as critic | Part 3 |

## Open questions / risks

### For `DECISIONS-PENDING.md`

**DP-R12-1. Harness-native memory is off for the critic and off by default for the proposer.**
Evidence: F8, F8a, F8b. Tension: decision 6 says Tier 1 uses the CLI under the user's own login, which a reader may take to include the user's memory. Default I proceed on: off for both, recorded per run, and the proposer's setting can be turned on in config. If the owner rules that the proposer keeps harness memory on by default, the run must still record it, the digest must show it, and the experiment's arms must hold it constant. The critic rule does not change under either ruling, because it follows from decision 7.

**DP-R12-2. 114-memory is not specified in Wave 1.**
Evidence: F14, F15, F15a, F17, F23, and F6 (the existing learning layer has never run an applied arm). Default I proceed on: the feature list drops 114 from Wave 1; the lessons store is a roadmap entry conditional on arm C. If the owner wants it in Wave 1 anyway, it is specified behind a flag under the rules of part 4 and with the experiment as its acceptance test, and it still does not change the engine.

**DP-R12-3. The proposer's inherited-obligations block becomes an index.**
Evidence: F1, F2, F24. This changes a prompt the parity oracle pins, so it needs a divergence register row and is off under the oracle. Default I proceed on: R24 and R27 adopt it for Wave 1. If the owner rules against it, the cold-start token bill stays near the baseline and the saving from session continuation (decision 22) is the only one left.

None of the three changes the shape of the core engine. The engine gains one interface: a provider of proposer prompt blocks, each with a name, a byte budget, a writer and a digest. The index, the ledger and a future lessons block are all providers.

### Risks

1. **The index hides something the proposer needs.** A pass that must re-check an inherited obligation has to open the file the index points to. If it does not, regressions rise. The cumulative gate still re-runs the inherited commands, so the gate catches it, at the cost of a rejection. Stage 2's guardrails measure this.
2. **A stale ledger.** A ledger that says a unit is kept when the tree has moved on misleads the next pass. It must be keyed on commit, and regenerated rather than edited.
3. **The 2026 coding-memory benchmarks are young.** F15a is nine days old and F15 and F14 are this year's. They agree with each other and with the older error-propagation work, but they are benchmarks of short tasks. Long multi-phase features may differ. That is a reason to run arm C once, not a reason to build first.
4. **Model dependence.** Practice on compaction flipped twice in twelve months (A6 `:205-208`). The recommendation avoids model-written summaries for that reason; if a future model makes them reliable, the provider interface accepts one without a core change.
5. **Table-level survey figures.** Those marked † were extracted from HTML by a delegated agent and not all re-checked. The recommendation rests on the abstracts, which I re-fetched.
6. **The reference run is live.** F1 and F3 will grow. R21 should re-measure.

### Open questions for other reports

| For | Question |
|---|---|
| R23 | May the critic's copy of the inherited block be indexed too? Critic prompts are about 620 KB per verdict (`ls -lS verdicts/`), and the critic must still see regression context (`lib/critic.py:1264-1266`). |
| R24 | Does `PROGRESS.md` stay as a proposer notebook once the ledger exists, and is it bounded? |
| R5 | The exact flags that give a Claude critic session no CLAUDE.md and no auto memory on a subscription, where `--bare` is unavailable. |
| R20 | A descriptor field for native memory and its off switch. |
| R11 | Harness memory and a future lessons store as injection paths (F17a): repository content that a proposer writes into memory today reaches every later session in that repository. |
| R14 | Events the experiment needs: per-pass first-turn tokens, prompt size by block, and whether harness memory was on. A5 §7 items 4 and 9 cover the first two. |
