# R22 — Loop design survey

Written 2026-09-29. Scope: verify and update `prompts/analysis/A6-micro-loop-survey.md` (A6) from current sources, then propose the micro-loop definition, default caps, and which of A6's nine experiments remain. Decision 21 is taken as fixed. Savings are stated only against R21's Claude-proposer baseline.

Method note. Web pages were read through `WebFetch`, which returns a summary written by a small model, not the raw page. arXiv abstracts came back verbatim; blog and docs pages came back paraphrased. Where a figure matters to a default I say whether it was seen as a quoted string. The session usage limit was reached part-way through the last verification batch (the reset message was received, no further probes were attempted), so a set of A6 sources was not re-checked. They are listed in F-3 as "carried, not re-checked".

## Prior art consulted

| File | Use |
|---|---|
| `prompts/analysis/A6-micro-loop-survey.md` | **Verified and extended.** Structure kept (taxonomy, granularity, checks, stopping, failure modes, products). Corrected in six places (F-2). Three of its nine experiments dropped or moved, one reshaped. |
| `docs/ecosystem/research/R21-time-use-baseline.md` | **Baseline for every saving.** Used: F-2, F-3, F-4, F-8, F-10, Appendices A and B. I re-derived the P07 per-phase tail from Appendix B (F-8 below). |
| `prompts/specstride-ecosystem.md` §0, §2 (decisions 21–23, tensions), §4 rows R21–R27 | Fixed points of the definition. |
| `prompts/analysis/A8-micro-loops-and-parity.md` (§0 only) | Confirms the layer sits at the pass loop; neighbour R23 owns it. |
| `/root/specstride/proposer.sh:129-137, 144, 1945-1946` | Existing pass mechanisms and constants (see F-9). |
| `/root/agentic-netops-srl/specs/004-agentic-netops-composite/tasks.md` (read only) | Task count per phase, to size a unit (F-8). |

## Questions answered

**Q1. What is a micro-loop, in one paragraph?** See Recommendation, item 1.

**Q2. Is "micro-loop" an established term?** No. A6's finding stands (F-1). Nothing found in this pass changes it.

**Q3. What do sources know about the size of the unit between checks?** Only indirect evidence. Success falls with task length, self-conditioning makes long contexts worse, and every published long-running harness runs one feature/task per cycle. No study varies check cadence on realistic multi-task coding with elapsed time as the outcome (F-4). The only local evidence on sizing is R21 (F-8).

**Q4. What caps should the inner loop have?** Repairs per unit 2; units per pass 1; time per unit 20 min per proposal and 30 min per unit in total. Evidence and confidence per value in the Recommendation table. Every value is a starting point for experiment E3/E5 and none is settled by a source.

**Q5. What stopping and escalation rules are supported?** Fixed caps plus same-signature and diff-hash no-progress stops are supported by product practice and small repair studies. Escalation to a stronger model is out of scope of Wave 1 for this report (R25). One conflict with decision 21 is in A6's escalation rule (F-6, Open question 1).

**Q6. What fails in fine-grained loops?** A6's nine failure modes stand; two are re-graded (F-5).

**Q7. Which of A6's nine experiments still make sense?** E1, E3, E5, E8 keep. E2 loses its judge arm. E4 is R24's. E6 and E7 leave Wave 1. E9 is reshaped. Two new ones added (E0, E10). Table in "Options compared".

**Q8. What can the micro-loop layer save, against R21?** Upper bounds only, and they are not additive; see F-8. Honest central estimate: 10–20 % of alive time on ordinary phases (P07-like work), with the 25 % target reachable only if a deterministic check catches most of the rework in the tail phases. Low confidence, because R21 does not record why attempts were rejected.

## Findings

Tags: `verified-doc` (URL, accessed 2026-09-29), `verified-local`, `inferred`, `unverified`. Each finding separates what a source **measured** (M) from what it **asserts** (A).

### F-1 Taxonomy of loops for coding agents `inferred`

A6 §1.1 is accepted as the taxonomy: outer retry (Ralph), plan-execute-verify, generator-critic, reflection, generate-test-repair, nested, autoresearch keep-or-revert, orchestrator-worker, advisor-executor, massively decomposed. Basis: the sources below, each of which was re-read for what it does.

- Ralph, Huntley `ghuntley.com/ralph/` `verified-doc`. **Asserts** "one thing per loop", back pressure, one subagent for build/tests. **Measured nothing**: the page has no benchmark, timing or success rate; its only numbers are an anecdote ($297 against a $50k contract) and a hackathon claim. A6 labelled it [A]; correct.
- Anthropic Ralph plugin README `verified-doc` (`raw.githubusercontent.com/anthropics/claude-code/main/plugins/ralph-wiggum/README.md`). `--max-iterations` default is unlimited; the README calls it the "primary safety mechanism"; the completion promise is one exact string. Asserts only.
- Karpathy `program.md` `verified-doc` (raw GitHub). Asserts the loop design: one editable file, fixed 5 minute budget, "If val_bpb improved ... keeping the git commit. If ... equal or worse, you git reset", "If a run exceeds 10 minutes, kill it", "after more than a few attempts, give up". Measured nothing in this file. A6's 2.02 h to 1.80 h result stays `unverified` (X post not fetchable).
- Anthropic "Effective harnesses for long-running agents" `verified-doc` (`anthropic.com/engineering/effective-harnesses-for-long-running-agents`). Asserts "one feature at a time" and JSON over Markdown for the feature list ("less likely to inappropriately change or overwrite"). **Reports no quantitative metric.** A6 said "No numbers are given"; correct.
- Nested form: A6 cites arXiv 2604.03515 for "11 of 13 scaffolds compose several loop primitives". Not re-fetched (limit). `unverified` in this pass.

### F-2 What A6 gets wrong or omits (corrections)

1. **The 80 % horizon is not "4–6 times shorter" for current models.** A6 §2.1 takes the ratio from the 2025 paper. For Claude Opus 4.5, METR reports a 50 % horizon of about 4 h 49 min (CI 1 h 49 min to 20 h 25 min) and an 80 % horizon of 27 min, a ratio near 11 (LessWrong post quoting METR, dated 2025-12-20, `verified-doc` `lesswrong.com/posts/q5ejXr4CRuPxkgzJD/...`). The METR page (updated 2026-05-08) carries "Measurements above 16 hrs are unreliable with our current task suite" `verified-doc` `metr.org/time-horizons/`. METR's own note says the logistic fit does not treat the two ends independently and the suite has about 170 tasks `verified-doc` `metr.org/notes/2026-01-22-time-horizon-limitations/`.
2. **Horizons are in human minutes, not agent minutes.** A6 §2.1 and §11(a) tie a "5–20 minutes of agent wall-clock" unit to the 80 % horizon. Those are different clocks. The horizon supports only the ordinal claim "shorter tasks succeed more reliably". `inferred` (METR defines the horizon by expert human time, `verified-doc` metr.org/time-horizons).
3. **Claude Code `/goal` is missing from A6 §9.** `/goal <condition>` runs a session-scoped prompt-based Stop hook: after every turn a small fast model (Haiku by default) judges the condition against the conversation; it "doesn't run commands or read files independently"; it stops on met, judged impossible, or unrecoverable error; you bound it by writing a turn or time clause into the condition; three automatic retries, then pause; at most three idle check-ins `verified-doc` `code.claude.com/docs/en/goal`. This is the closest product analogue to a keep/repair loop, and it is exactly the model-as-reviewer design decision 21 excludes from Wave 1. It also confirms A6's closing sentence (no product has a frozen check plus a ledger feeding an independent gate).
4. **Stop hook cap citation.** A6 cites the hooks reference for "8 consecutive continuations". The statement is in the hooks guide, section "Stop hook hits the block cap": "Claude Code overrides a Stop hook after it blocks eight times in a row without progress", raisable with `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` `verified-doc` `code.claude.com/docs/en/hooks-guide` (line 1007 of the saved fetch). The reference page has no such statement. Community issue titles mention a "9-block" override, so whether the eighth or ninth block is overridden is `unverified`.
5. **Codex auto-review thresholds.** A6 gives "3 consecutive denials or 10 within the last 50 reviews" from a search snippet. The current page (redirected to `learn.chatgpt.com/docs/sandboxing/auto-review`) says only that a circuit breaker interrupts turns "after consecutive or accumulated denials within a rolling window"; no numbers `verified-doc`. Treat the numbers as `unverified`. They concern sandbox approvals, not code quality, so they carry no weight for defaults.
6. **CodeRescue (S78) is withdrawn**, confirmed: "Withdrawn at the request of ByteDance ... before completing the company's required internal review", dated 2026-07-30 `verified-doc` `arxiv.org/abs/2607.19338`. A6 already flagged it; keep it out of any evidence table.

### F-3 Source audit: measured versus asserted

Verified this pass. "M" is what was measured, "A" is what is asserted.

| A6 id | Source | Checked | M (measured) | A (asserted) | A6 claim holds? |
|---|---|---|---|---|---|
| S6 | Anthropic long-running harness | yes | nothing | one feature at a time; JSON list | Yes |
| S7 | Anthropic harness design, 2026-03-24 | partly | cost/duration table (a V2 harness run at 3 h 50 min and $124.70; solo 20 min $9 against full harness 6 h $200 for one retro-game example); one prompt, not a benchmark | evaluator "unnecessary overhead" within the model's reliable range; "worth the cost when the task sits beyond what the current model does reliably solo"; agents "confidently praising" their own work; sprint contract (Sprint 3 had 27 criteria) | Yes. The fetched text names Opus 4.6 for removing the sprint construct; A6's "Opus 4.5" for the table row was not confirmed. |
| S13 | Code Review for Claude Code | yes | at Anthropic: PRs over 1,000 lines 84 % with findings, 7.5 issues on average; under 50 lines 31 %, 0.5 issues; about 20 min and $15–25 per review; under 1 % of findings marked incorrect | none material | Yes. Note it does not measure yield per dollar; A6's inference "low yield per dollar for small units" is `inferred`. |
| S15 | Hooks | yes | none | TaskCompleted exit 2 blocks completion; prompt hooks (fast model by default); agent hooks experimental; cap of eight in the guide | Yes, but wrong page (F-2.4) |
| S26 | Sinha et al. v3 | yes (abstract verbatim) | per-step accuracy falls with steps; self-conditioning on prior errors; not fixed by scale; thinking mitigates it | none | Yes. Add: the abstract says **thinking mitigates self-conditioning**, which A6 omits. It weakens the "fresh context is needed" argument for thinking models. |
| S27 | Park and Choi 2607.25152 | yes (verbatim) | 54 cycles; 56 % had delta of zero or below; 44 % regressions accepted and 38 % improvements rejected by the strongest in-band judge | none | Yes. Small (54 cycles, one agent), a testbed not coding tasks. |
| S28 | SEAL 2607.24300 | yes | six models, three seeds, sealed audit beats unprotected baselines | none | Yes; not a coding-agent setting (self-improving policy agents) |
| S35 | ExecCritic 2609.09133 | yes | on SWE-bench Verified: 61.2 % without tests, 57.3 % with weak tests, 65.3 % with strong tests (the strong tests come from a stronger model, not the same trajectory) | "errors can agree" | Yes, with that caveat |
| S36 | TDFlow | yes | 88.8 % Lite, 94.3 % Verified; 7 hacks in 800 runs, with human-written reproduction tests | bottleneck is reproduction tests | Yes |
| S38 | METR reward hacking | yes | o3 hacked in 0.7 % of HCAST runs, in every trajectory on one RE-Bench task; more than 43 times as common on RE-Bench | "possibly because" models could see the scoring function | **Partly.** A6 says hacking was 43 times as common "when the model could see the scoring function"; the source states the ratio as measured and the cause as a possibility. |
| S39 | Autoresearch with coding agents | yes | one production task (verse detection); Codex memorised 19–41 ids per run; disappeared after an announced held-out set | none | Yes; one task |
| S41 | Rehearse 2607.27687 | yes | judge's selective accuracy falls from 82.8 % to 56.9 % as kept changes accumulate; 4,000 runs in three ML domains | none | **Misused.** The judge predicts whether an ML training change helps; it is not a coding-agent reviewer. A6 §8.2 uses it as coding drift evidence. Keep as an analogy only. |
| S43 | SWE-agent | yes (Table 3) | lint at edit time: 15.0 % to 18.0 % on SWE-bench Lite | guardrails help recovery | Yes; older (2024), one benchmark |
| S44 | Type-error ablation | yes | controlled, in a small typed teaching language (Shplait); type information helped more than test failures | none | Yes; small language, weak transfer |
| S45 | Post-edit re-verification | yes | 94/120 against 32/120 re-verifications; 95/120 against 35/120 final success; simulator-backed engineering agents | none | Yes; measures instruction following in a non-coding domain |
| S47 | Runtime-structured decomposition | yes (abstract verbatim) | 10 runs per arm on two workloads (Kubernetes root cause analysis, multi-file debugging); static 1,632 against monolithic 904 tokens; only-failed-subtask rerun 436 tokens; up to 51.7 % and 73.2 % lower retry cost | none | Numbers right. **Weak transfer**: the workloads are analysis/debug pipelines with LLM judgement subtasks, and retry cost is a few hundred tokens. A6 uses it as "51.7–73.2 % lower retry cost" for micro-loops; treat it as the direction of an effect only. |
| S50 | SWE-EVO | yes | 48 tasks, 21 files and 874 tests on average; GPT-5.4 with OpenHands 25 % against 72.8 % for GPT-5.2 on Verified | none | Yes |
| S54 | OpenHands condenser | yes | less than half the per-turn cost, 54 % against 53 % | none | Yes |
| S55 | OpenHands stuck detector | yes | none | thresholds: 4+ identical action-observation, 3+ action-error, 3+ monologue, 6+ ping-pong cycles; on by default | Yes |
| S77 | TwinRouterBench | yes | "every router has negative cost savings there because one under-routed step fails the whole trajectory"; two rule/kNN routers over 85 % on non-coding workloads; 100-case held-out slice | none | Yes (routing is R25's) |
| S12 | Advisor strategy | partly | Sonnet with Opus advisor +2.7 points on SWE-bench Multilingual at 11.9 % lower cost; Haiku 41.2 % against 19.7 % on BrowseComp | none | Yes (vendor) |
| S3/S4 | Karpathy | see F-1 | | | |
| S34 | R2E-Gym | yes | test-based and execution-free verifiers each plateau at 42–43 %, hybrid 51 % on SWE-bench Verified | none | Yes; this is best-of-n verifier selection, not repair |
| S82 | Over-mocked tests | yes | 36 % of agent commits add mocks against 26 % for non-agents (1.2 M commits) | none | Yes |
| S81 | Xu et al. | partly | 33,596 PRs; 747 PR pairs replayed; 41.7 % cross-agent against 19.8 % same-agent conflict | | Yes for the two rates. The "84.4 %" and "26.8 % modify/delete" figures were not seen; the fetched summary gave about 42 % structural conflicts (modify/delete or add/add). Treat those two as `unverified`. |

Carried from A6, **not re-checked** (limit reached or not attempted): S5, S8–S11, S14, S16–S20, S22–S25 (S22 caveat re-read, see F-2), S29–S33, S37, S40, S42, S46, S48–S49, S51–S53, S56–S66, S67–S68, S70–S76, S79–S80, S83–S84, S86. These stay at A6's labels. `unverified` in this pass.

Sources new to this survey (all read this pass):

| Source | M | A | Bearing |
|---|---|---|---|
| "How Many Tries Does It Take?" arXiv 2604.10508, 2026-04-12 `verified-doc` | 7 models, HumanEval (164) and MBPP Sanitized (257), up to 5 attempts; self-repair adds +4.9 to +17.1 pp on HumanEval and +16.0 to +30.0 pp on MBPP; 76–95 % of gains within the first two attempts; assertion errors the hardest (about 45 % repaired) | none | Direct evidence on repair caps. **Transfer is weak**: single-function generation, not multi-file agent work. |
| "Is Three the Magic Number?" arXiv 2607.05197, 2026-07-06 `verified-doc` | "the first three to four repair iterations account for most achievable gains"; code generation, test generation, translation; 4-page NIER paper | budgets should be explicit variables | Same limit: not agentic multi-file work. |
| "Looping Is Not Reliability" arXiv 2607.24604, 2026-07-27, rev 2026-09-14 `verified-doc` (summary read) | 900 three-revision trajectories from 30 HumanEval repairs; correctness with current traces 0.820 after one revision and 0.673 after two; stale traces caused 34 of 135 correct starts to fail against 4 with current traces (22.2 points); repository experiment on 24 bugs | "repetition alone provides no reliability guarantee" | Supports "each repair must see the fresh check output of the current tree" and shows a second revision can lose ground. Tiny, and only the abstract-level figures were read. |
| "Validation Evidence in LLM Repair Agents" arXiv 2607.28871, 2026-07-30 `verified-doc` | 3,730 events over 643 repair attempts: 46.0 % of passing validation events carry no bug-discriminating information | none | A passing check can be uninformative; supports checks that are tied to the unit (declared before), not any green run. |
| Claude Code `/goal` docs | product behaviour | none | F-2.3 |
| METR Opus 4.5 horizon | M, quoted | none | F-2.1 |

### F-4 Size of the unit of work between checks `inferred`

Consistent, indirect evidence; no direct comparison.

- Success falls with task length (METR, A6 S22–S24; horizons in human time). Half-life models (A6 S25, not re-checked).
- Per-step accuracy falls with steps and prior errors in context hurt (S26 `verified-doc`); thinking mitigates it.
- Every long-running harness reviewed runs one task or feature per cycle with a check (S1, S6 `verified-doc`; S11 and S59 not re-checked).
- Direct cadence data: SWE-agent lint at edit time +3.0 points (S43); post-edit re-verification instructions raise re-verification and bounded success in a simulator domain (S45); neither is a coding-task cadence study with elapsed time.
- Anthropic's own harness (S7): a per-sprint evaluator was needed on the weaker model and removed on the stronger one. Value of an intermediate check is model dependent; this is stated as experience, and the cost table is a single example.
- **I found no study that varies check frequency on realistic multi-task coding and reports elapsed time.** Searches on 2026-09-29 for "check cadence per-task verification" returned only repair-loop and verification-loop papers (F-3, new sources) and vendor explainers. The claim that micro-loops cut elapsed time remains `unverified`.

### F-5 Failure modes of fine-grained loops

A6 §8's nine modes stand. Changes:

- Mode 2 (local optimisation breaks coherence): drop S41 as evidence (F-3). Keep S11 and S66 as assertions (not re-checked).
- Mode 4 (weak self-written tests): keep; S35's caveat applies; add S28 and 2607.28871 (46 % of passing events uninformative).
- New mode 10, **stale evidence in repair**: a repair prompt that carries an old failure trace instead of the current tree's check output loses correctness (2607.24604, above). Consequence for defaults: the repair prompt is assembled by the runtime from the check run on the current tree, never from earlier turns.
- New mode 11, **a check passes but does not test the unit**: 2607.28871. A per-unit check needs a link to the unit (task id to file set), or it is decoration.

### F-6 Stopping and escalation rules `inferred`

Observed practice (all asserted, none measured): Ralph plugin unlimited by default (S21); Stop hook cap eight, raisable (F-2.4); `/goal` three automatic retries then pause and three idle check-ins (goal docs); OpenHands stuck detector 3–6 repeats (S55); autoresearch "more than a few attempts, give up" and a 10-minute kill for a 5-minute budget (S4). **The one measured cluster is on repair rounds**: two rounds capture most gains on small tasks (2604.10508), three to four in a broader set (2607.05197). The consistent range across products is 3–8 blocks or retries, across papers 2–4 repairs.

Conflict with decision 21 in A6 §11(a) "Escalation" step (3): "end the phase attempt early once any unit is unresolved and send the attempt to the critic". Decision 21 says that when caps run out the layer switches off for that attempt and the classic loop carries on, with no new exit codes or stop reasons. Sending a known-incomplete attempt to the critic also wastes a critic call and a reject. See Recommendation item 4 and Open question 1.

### F-7 How current products do it

A6 §9 stands with two edits: add `/goal` (F-2.3); correct the Codex row (F-2.5). Nothing found in this pass changes A6's conclusion that no product ships a frozen-check-plus-ledger primitive feeding an independent gate. Closest compositions: Claude Code `PostToolUse` plus `TaskCompleted` plus a Stop hook (deterministic command hooks are supported by the same mechanism as `/goal`), and Aider's auto-lint/auto-test (S72, not re-checked).

### F-8 Local evidence for sizing and for what can be saved `verified-local` unless tagged

All figures from R21 unless stated. "P07" is R21's second Claude sample, three finished features, 47 phases, no long detached jobs.

1. **Pass length, Claude proposer** (R21 F-2): median 3.4 min, p90 51.3 min, max 106.8 min. Killed passes: 37 of 515 (7.2 % of passes) taking 32.5 h, 24.9 % of proposer time; 23 hard-cap kills took 26.6 h (R21 F-4). The kill loss is concentrated in a few long passes, not spread thin.
2. **Time per task, NETOPS** `inferred` (Method: phase proposer hours from R21 F-4 table divided by the task count of the same phase in `specs/004-agentic-netops-composite/tasks.md`, 188 tasks over 16 phases; all-in, including failed and killed passes). Phase 1–15 minutes per task: 1.7, 2.7, 12 (phase 3: 8.27 h over 41 tasks), 26, 6.9, 15, 7.3, 8.9, 21, 18, 5.9, 19, 25.5, 8.6, 46. Median about 12 min per task, range 2–46. Phase 15 (15 tasks, 11.5 h) is the outlier. **Phases hold 4–41 tasks (median 11).**
3. **First-attempt success** (R21 F-3): 72 % of 399 phases in all runs, mean 2.41 attempts, p90 5, max 46. **In P07 only 23 of 47 phases (49 %) were approved on the first attempt**; 109 attempts over 47 phases (mean 2.32). I computed this from Appendix B rows; the script is in `/tmp/specstride-research/R22/`.
4. **The tail carries the loss.** P07, from Appendix B:

| Phases with | Phases | Proposer h | Share of P07 proposer h (73.1) | Failed-attempt h | Share of failed-attempt h (55.4) | Recorded $ |
|---|---|---|---|---|---|---|
| 1 attempt | 23 | 20.0 | 27 % | 0 | 0 % | — |
| 2 or more | 24 | 53.1 | 73 % | 55.4 | 100 % | 907 of 1,342 |
| 3 or more | 12 | 40.7 | 56 % | 47.2 | 85 % | 617 |
| 4 or more | 8 | 34.1 | 47 % | 40.4 | 73 % | 498 |

Eight phases (17 %) hold 73 % of the failed-attempt time. Micro-loops matter where a phase needs several attempts, not on the median phase (median proposer time of a first-attempt phase 0.74 h).
5. **Bounds on savings against the Claude baseline** `inferred`. Claude population, 253.9 h alive: killed passes 32.5 h = 12.8 % of alive time; failed attempts 108.9 h = 43 % of alive time; verification by the orchestrator 28.5 h = 11.2 %. These overlap and are not additive. If the layer halves the killed-pass time (the decision's target is at least 50 % fewer kills): at most 16 h, 6.4 % of alive. If it halves the redo cost of failed attempts, and if a deterministic check would have caught the defect: at most about 54 h, 21 %. In P07 the halved tail (8 phases with 4+ attempts) is 20 h, 20 % of its 99.1 alive hours. **The 25 % elapsed-time target needs both effects near their ceilings, or the fail-fast component on long jobs (R23; 29.3 h, 23 % of NETOPS alive time, R21 F-5).** The key unknown is the share of rejections that a task-scoped deterministic check would have caught. R21 does not record rejection reasons, and NETOPS shows 3 of 5 rejections were false (critic glob snapshot), which no micro-loop can prevent (prompt §0).
6. **Cost of the layer.** The orchestrator's final verification is already 11.2 % of Claude alive time, and in P07 20.9 h against 73.1 proposer h. A per-unit check therefore has to be scoped and fast, or it adds a second full gate. No measurement of scoped-check duration exists locally (R21 gap 19).
7. **Cold start is not the constraint.** Median 0.5 min to first action, 5.2 % of Claude pass time; the 108 k first-turn tokens are the cost (R21 F-10). Passes ending at a unit boundary therefore pay mostly in tokens. With decision 22 the next pass may continue the session where the harness supports it.

### F-9 Existing mechanisms the layer must fit `verified-local`

`/root/specstride/proposer.sh`: default pass timeout `SPECSTRIDE_PROPOSER_TIMEOUT` 1800 s (line 144; the reference run used a 60-minute cap per R21); consecutive passes with no change outside bookkeeping, `SPECSTRIDE_PROPOSER_MAX_NOPROGRESS` default 3 (lines 122–124); consecutive hard-cap kills, `SPECSTRIDE_PROPOSER_MAX_CAPS` default 3, with the note "the work did not fit a pass. The remedy is to make the work fit ... or split the phase" (lines 129–133); yield cap 4 per attempt (line 128); short-pass nudge after `SPECSTRIDE_SHORT_PASS_SEC` 180 s, `..._NUDGE_AFTER` 2 (lines 1945–1946); critic reject limit `SPECSTRIDE_MAX_REJECTS` 3 (`lib/critic.py:2483`). The code's own comment at line 129 is the local statement of the micro-loop premise: the fix for a pass that did not fit is smaller work, not a bigger cap. Passes that end at a unit check are short by design, so the short-pass nudge and the iteration limit must exempt them (prompt tensions; R23 owns the mechanism).

## Version/date pins

| Item | Value |
|---|---|
| Access date for every `verified-doc` | 2026-09-29 |
| Claude Code docs | `/goal` page carries "Before v2.1.239", "v2.1.246", "v2.1.269" notes; installed CLI 2.1.284 per prompt §1 (not re-run) |
| METR time horizons page | updated 2026-05-08 |
| METR Opus 4.5 figures | 2025-12-20 |
| Sinha et al. | v3, 2026-03-13 |
| Park and Choi | 2026-07-27 |
| ExecCritic | 2026-09-08 |
| Runtime-structured decomposition | 2026-05-14 |
| R21 cutoff | epoch 1790637900 (2026-09-29 03:25 +04:00) |
| Unverified model claims | METR figures for the Claude version now used as proposer (`claude-opus-5-5` per R21) were not found |

## Options compared

### Unit of work (R23 owns the final rule; this is the sizing input)

| Option | Fits R21 pass data | Catches tail failures early | Overhead | Evidence |
|---|---|---|---|---|
| Whole phase (classic) | Median pass fits; p90 51 min and 24.9 % kills do not | No | None | Baseline |
| One Spec Kit task, 5–15 min typical | Yes: NETOPS median 12 min per task all-in | Yes | Check per task | Indirect (F-4) |
| Group of tasks by file set | Between | Partly | Lower | None |
| Unit the proposer declares | Depends | Depends | Depends | None; R23 |

### Repair cap per unit

| Value | Supporting evidence | Against |
|---|---|---|
| 1 | Second revision lost ground in one small study (0.820 to 0.673) | Two rounds capture 76–95 % of gains in another |
| **2** | 2604.10508 (two rounds), product blocks 3–8 counting attempts, self-conditioning | Papers are single-function tasks |
| 3–4 | 2607.05197; OpenHands 3 identical errors; `/goal` 3 retries | More transcript in context; cost on the tail |
| 8+ | Stop hook cap | That is a runaway guard, not a design value |

### A6's nine experiments

| # | Verdict | Change |
|---|---|---|
| E0 (new) | **Add first** | Retrospective, no model calls: for the 42 rejected and 19 verification-failed Claude attempts (R21 F-3), classify the critic's reason as "a deterministic task-scoped command would have failed" or not. It sets the ceiling on rework savings (F-8.5). Uses existing critic feedback files and R21's scripts. |
| E1 | Keep | Paired runs, the decision's targets. Unit: alive hours per approved phase (R21 recommendation 3). Needs cost with unrecorded spend estimated (R21 gap 16). Population variance is large; A7's figure of 58–97 passes per arm for a 30 % effect is cited by R21 and not re-derived. |
| E2 | Reduce | Drop the cheap-judge and self-review arms (decision 21 excludes model inner review in Wave 1). Keep none against deterministic, for false-block rate and escaped defects. Judge arm to the roadmap. |
| E3 | Keep | Cap 1/2/3 by in-session against fresh-context repair. Default is the row in the Recommendation table. |
| E4 | Give to R24 | Carry-over is R24's. |
| E5 | Keep, raise priority | Unit size: task against group of tasks against phase (classic). Requires fixtures with 10 or more tasks per phase (NETOPS median 11). |
| E6 | Move out of Wave 1 | Parallel `[P]`; R26. |
| E7 | Move out of Wave 1 | Routing cascade; R25. |
| E8 | Keep | Gaming canary. Half of it needs no model: scripted stubs that edit a protected path or weaken a check, as part of the conformance suite. Add a few live proposer runs. |
| E9 | Reshape | Decision 21 already fixes that the critic sees final check results but not repair history. Test whether green final results anchor the critic toward approval: arms are "critic sees final results" against "critic sees none", on seeded defects. |
| E10 (new) | Add | Overhead audit: log every micro-loop check with command, duration, result (R21 gap 19), and report inner check time as a share of phase time. Its output is the input to the time caps. |

## Recommendation

One recommendation. **Confidence: medium on the definition and structure; low on every numeric default.** No source fixes a numeric value; the values are chosen from R21 pass data and small repair studies and should be treated as the starting point of E3 and E5.

1. **Definition.** A micro-loop is a bounded cycle inside one phase attempt. It takes one declared unit of work, by default one Spec Kit task, sized to the typical unit of 5–15 minutes of agent time seen in NETOPS. The proposer implements the unit. The runtime then runs the unit's check: deterministic commands only (build, type check, lint, tests), fixed before the unit starts, executed by the runtime and out of the proposer's reach. The cycle ends in exactly one of three outcomes: **keep** (checkpoint commit and a ledger entry with command, exit code and log path), **repair** (a bounded retry that receives the current tree's fresh check output), or **escalate** (the layer switches off for the rest of the attempt and the classic loop continues with the kept work). Inner cycles count against their own caps only; a micro-loop never approves anything, adds no exit code or stop reason, and the full gate and the independent critic always run afterwards. The critic sees each unit's final check result, not the repair history.

2. **Default caps.**

| Parameter | Default | Evidence | Confidence |
|---|---|---|---|
| Repairs per unit | **2** (three proposals in all). First repair may continue the session; second repair starts a fresh session with a runtime-built note (check command, exit code, tail of the output, changed files). No model-written summary. | 76–95 % of repair gains in the first two rounds on small tasks (2604.10508); "three to four" in 2607.05197; a second revision lost correctness when the trace was stale (2607.24604, tiny); self-conditioning (S26) with the caveat that thinking mitigates it; A6 proposed 3. Product blocks cluster at 3–8 but count runaway guards. Local: 72 % of phases pass first time, so most units need no repair. | Low |
| Same-signature stop | Stop repairing when a repair leaves the normalised failing-check signature and the working-tree diff unchanged (a no-op repair). | OpenHands 3+ identical action-error (S55); product practice. | Medium as mechanism, low as threshold |
| Units per pass | **1**: the pass ends at the unit's check; the next pass continues the session if the harness supports it (decision 22), otherwise starts fresh from files. | R21: 24.9 % of Claude proposer time was in killed passes, p90 pass 51 min, so a smaller unit per pass bounds what a kill can lose to one unit; cold start is 5.2 % of pass time and 108 k tokens (F-8.1, F-8.7). Ralph's "one thing per loop" is asserted only. No source compares 1 with 3 units per pass. | Low. E5 decides. |
| Time per proposal | **20 min** wall-clock per proposal pass, including its own checks' waiting | Under half the observed 60-minute cap; NETOPS median task took about 12 min all-in and 9 of 15 phases averaged under 20 min per task (F-8.2). A hit ends the proposal as unresolved and keeps the tree state as a work-in-progress commit rather than discarding it (aim 2 of §0; classic keeps the tree too, R21 F-3). | Low |
| Time per unit in total (proposals, repairs, checks) | **30 min** | Twice the proposal cap after one repair; equals the code's default pass timeout (`proposer.sh:144`). | Low |
| Time per check | **5 min** default per check command. A check that cannot finish in that time is not a micro-loop check: it goes to the phase gate or to R23's fail-fast path. | Chosen so that scoped checks do not repeat the 11.2 % orchestrator verification share per unit. No local measurement of scoped-check time exists (R21 gap 19); E10 supplies it. | Low |
| Unresolved units before the layer switches off for the attempt | **2** units, or the first unit that breaches a protected path or a spec-versus-test conflict | A6 heuristic; the switch-off rule is decision 21's | Low |
| Flaky check | Re-run a failing check once; if it flips, mark it flaky, drop it from the inner set and report it to the critic as evidence | Practice, not studied (A6 S8.5) | Low |

3. **Why a numeric floor still matters.** The tail carries the loss: in P07 the 8 phases with four or more attempts hold 73 % of failed-attempt time (F-8.4). The caps exist to keep a unit that will not converge from becoming another tail phase inside the attempt. The switch-off rule returns the attempt to classic behaviour on those units, where R21 already measured the cost.

4. **Escalation, adjusted to decision 21.** Escalate means: mark the unit unresolved, keep the last kept commit, switch the layer off for the rest of that attempt, and let the classic pass loop finish the phase from the tree. This replaces A6's "end the attempt early and send it to the critic" (F-6). Model-tier escalation belongs to R25 and is not part of the Wave 1 definition.

5. **What the default is expected to save (against R21's Claude baseline).** `inferred`, low confidence: 10–20 % of alive time on ordinary multi-attempt work, from cutting the tail's redo cost and part of the 24.9 % killed-pass share (F-8.5). The 25 % target is reachable on P07-like work only if E0 shows that most of the tail's rejections were catchable by a task-scoped deterministic check; on long-job work it depends on R23's fail-fast. The savings figures are ceilings, not forecasts.

6. **Evolvability.** Keep every value above in config with the strategy name recorded per run (decision 21), and keep the loop-strategy seam separate from the unit rule, so a new unit definition or check source plugs in without touching the engine.

## Matrix rows

None.

## Open questions / risks

1. **A6's escalation rule conflicts with decision 21** (F-6). Not evidence against the decision; the design above follows the decision. R23 owns the mechanism.
2. **No measurement of what a check would have caught** (E0). Without it, the 25 % target is a hope. R21 records the outcome of each attempt but not the reason; a retrospective on the critic feedback files is possible now and free.
3. **Repair caps rest on single-function studies.** 2604.10508 and 2607.05197 use HumanEval-style tasks and economical models; 2607.24604 is tiny. The values 2 and 3 are not separated by agent-scale evidence.
4. **The horizon numbers are in human time and for a different model.** No METR figure was found for the model now used as proposer. Do not derive a unit length from METR.
5. **`/goal` is a built-in that competes in shape but not in design.** It uses a model evaluator; decision 21 forbids one in Wave 1. If Claude Code users combine `/goal` with the plugin, two loops could run around one pass. The host-integration report (R3) should note it. `unverified` for the interaction; I did not test it.
6. **Thinking mitigates self-conditioning** (S26 abstract). If the proposer runs with thinking on, the fresh-context second repair may buy less than the design assumes. Included in E3.
7. **Unit sizing needs a task-count check.** NETOPS phases hold 4–41 tasks; phase 3 (41 tasks, 64 passes) shows a large phase can still burn many passes. Whether a task is a fair unit for tasks that are 2 minutes or 46 minutes (F-8.2) is what E5 must answer.
8. **Coverage.** Roughly two thirds of A6's sources were not re-fetched (F-3), after the session usage limit was reached. Figures from those stay at A6's labels.
9. **Summaries, not raw pages.** Blog and docs figures came through a summariser (Method note). Numbers that drive a default (cap of eight, 61.2/57.3/65.3, 15.0 to 18.0, 76–95 %) were seen as quoted strings; others were paraphrased.
10. **Target realism (soft DECISIONS-PENDING candidate).** The 25 % target of decision 21 may be unreachable on Claude work without long jobs. Proceed on the decision as written; the evaluation window decides. If E0 shows a low catch share, R27 should state which part of the target rests on fail-fast for long jobs alone.
