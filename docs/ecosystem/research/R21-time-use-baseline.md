# R21 — Time-use baseline

Measured 2026-09-29 03:25 (+04:00). Cutoff for every figure from a live file: epoch `1790637900` (2026-09-29 03:25:00 +04:00); the scripts ignore later events, so a verifier gets the same numbers while the run continues. All access was read-only. No lock, process or file of any source project was touched. No paid model call was made.

Labels: **[M]** measured (source given), **[E]** estimated (method given). Every row also carries a claim tag from the common brief.

Naming: projects that the prompt file does not name appear as `P01`–`P16`. The mapping is produced by `baseline.py` into `aliases.tsv` in the scratch directory (rule: sorted discovery order of the project roots), and features as `<project>-F<nn>` in `feature-aliases.tsv`. Proposer and critic families are `claude`, `dsh`, `prime` and `local-backend` (any locally registered backend).

## Prior art consulted

| File | Use |
|---|---|
| `prompts/analysis/A5-run-time-evidence.md` | **Reused** as the structure of the baseline and for its transcript-measured in-pass activity split (A5 §2.2), which events alone cannot reproduce. **Extended** in five places: all other runs on the machine (A5 had 3 comparison samples, this report has 172 runs); time and cost inside failed attempts; the cost of passes that recorded none; a measured replacement for A5's 25 h estimate; restart latency by stop reason. **Contradicted** in two places, both small: see F-13 and F-14. |
| `prompts/analysis/A7-local-loop-prior-art.md` §2 | **Reused** as a cross-check: A7 cites an earlier measurement that 49.0 % of cost sat in rejected or malformed attempts and that 7 killed passes were 18.6 % of a calendar span. This report finds 53 % of recorded cost and 52.5 % of attempt time in failed attempts over the whole population, the same order. |
| `prompts/specstride-ecosystem.md` §0, §1, §2 (decisions 21–23), §4 row R21 | Scope and the aims the baseline serves. |
| Run state | `/root/agentic-netops-srl/.specstride/**`, its `.mixture-of-loops/**` supervisor state, `bin/acceptance/p15-t151r*`, `.evidence/*/acceptance-*`, `/tmp/p15/chain.log`; 285 `events.jsonl` files under `/root` in `.specstride/`, `.wiggum/` (the older name of the same loop) and `.lisa/`; Claude Code session transcripts under `/root/.claude/projects/-root-agentic-netops-srl/` (usage fields only). |

## Questions answered

**Q1. Where does the time go, per stage, phase and pass?**
In the reference run (NETOPS, 127.9 h alive): detached waits 82.0 h (64.1 %), proposer passes 44.1 h (34.5 %), setup 1.17 h, critic 0.44 h, diagnostician 0.06 h. Over all 172 real runs on the machine (587.9 h alive): proposer passes 71.0 %, detached waits 14.0 %, orchestrator verification 8.2 %, critic 3.2 %, setup 1.3 %. The reference run is the only one that used yield; without it the population is 81 % proposer time. Per-phase tables are in F-4 and Appendix B; stage-level figures in F-12.

**Q2. How much time goes into attempts that fail?**
52.5 % of attempt time over all runs (301 h of 574 h) sits in attempts that ended rejected, malformed or verification-failed; a further 22.9 % (131 h) sits in attempts that never reached a verdict. For the Claude proposer: 43.3 % failed, 25.4 % no verdict. For the reference run: 49.7 h failed (45.1 h of it one phase-15 attempt), 58.6 h no verdict.

**Q3. How much is lost to passes killed by limits and to stalls?**
66 killed passes, 40.6 h, 9.7 % of proposer time overall. For the Claude proposer 37 kills, 32.5 h, **24.9 % of proposer time**. Hard-cap kills are 28 passes and 31.6 h; stall kills 38 passes and 9.0 h.

**Q4. What do restarts cost?**
0 automatic relaunches in the reference run. Across the machine 137 restarts followed a stopped run; median gap 0.18 h, p90 2.6 h. Total gap time is 441.8 h, of which 118.5 h is in gaps of 24 h or less. 19 of 35 features needed more than one run; finished Claude-proposer features needed a median of 8 runs.

**Q5. How much time is blocked on a person?**
Not recorded anywhere. Estimated from the text of closing messages: 76 passes in 6 runs declared a block (3.6 h, $82 recorded), 54 of them in the reference run's phase 3. The waiting itself shows only as restart gaps (Q4).

**Q6. What does cold start cost?**
In time, little: median 0.5 min to the first action for Claude passes, 6.7 h in total, 5.2 % of Claude pass time (event-based). In tokens, much: median 107.8 k tokens on the first turn of each pass, 138 k in the newest run.

**Q7. Tokens and cost?**
Recorded: $6,915 over 944 passes; 1,152 passes (55 %) recorded no cost at all. In the reference run $516 is recorded and an estimated $590 is not, so true spend is about $1,100.

**Q8. What can today's telemetry not answer?**
20 items, in the section "Telemetry gaps for R14".

## Findings

### F-1 Population [M] `verified-local`

Command: `python3 baseline.py 1790637900 && python3 aggregate.py`.

| Item | Value |
|---|---|
| `events.jsonl` files found | 285 |
| Unique runs after removing copies (same run id and first timestamp) | 209 (106 copies dropped; two project roots are copies of each other, and each state directory keeps a top-level copy of its latest run) |
| Excluded: `.lisa/` fixture and proof runs | 21 |
| Excluded: runs with no proposer pass | 16 |
| **Real runs analysed** | **172**, in 35 features and 19 project roots |
| Period | 2026-07-25 to 2026-09-29 |
| Proposer family | claude 55 runs (253.9 h), dsh 73 (201.2 h), local-backend 42 (130.4 h), prime 2 (2.3 h) |
| Passes | 2,096 |
| Verdicts | 1,474 raw lines in all files; in the analysed runs 400 approved, 597 rejected, 81 malformed attempts |

### F-2 Time by category [M] `verified-local`

Hours, with the share of alive time. "Alive" is first to last event of a run. Intervals: proposer = `iter_start` to the pass end (`pass_yield`, `iter_done`, `evidence_written`, `pass_killed`, `iter_error`); yield = `pass_yield` to `yield_resume`; verification = `verification_start` to `verification_passed/failed`; critic = `critic_start` to `verdict`; setup = `proposer_start` to the first `iter_start`.

| Group | Runs | Alive h | Proposer | Detached wait (yield) | Orchestrator verification | Critic | Diagnostician | Setup | Unattributed |
|---|---|---|---|---|---|---|---|---|---|
| All | 172 | 587.9 | 417.6 (71.0 %) | 82.0 (14.0 %) | 48.1 (8.2 %) | 18.6 (3.2 %) | 1.0 (0.2 %) | 7.4 (1.3 %) | 0.5 |
| All except NETOPS | 166 | 460.0 | 373.6 (81.2 %) | 0 | 48.1 (10.5 %) | 18.2 (3.9 %) | 1.0 | 6.3 (1.4 %) | 0.3 |
| **Claude proposer** | 55 | 253.9 | 130.5 (51.4 %) | 82.0 (32.3 %) | 28.5 (11.2 %) | 5.5 (2.2 %) | 0.8 | 4.5 (1.8 %) | 2.2 |
| dsh proposer | 73 | 201.2 | 168.4 (83.7 %) | 0 | 18.2 (9.0 %) | 9.0 (4.4 %) | 0.2 | 2.4 | see note |
| local-backend proposer | 42 | 130.4 | 116.7 (89.5 %) | 0 | 1.4 | 3.9 (3.0 %) | 0 | 0.6 | 7.8 |
| **NETOPS (reference run)** | 6 | 127.9 | 44.1 (34.5 %) | 82.0 (64.1 %) | 0 | 0.44 (0.3 %) | 0.06 | 1.17 (0.9 %) | 0.13 |

Notes. The older `long_job_start`/`long_job_ended` mechanism adds 12.6 h in one project; it overlaps proposer passes, so it is not additive and the dsh row sums to more than 100 %. In NETOPS verification runs inside passes, so its verification column is 0.

Distributions [M]:

| Group | Pass length, min (median / p90 / max) | Critic, s (n; median / p90 / max) | Setup, s (median / p90) |
|---|---|---|---|
| All | 5.8 / 30.0 / 180 | 1,079; 58 / 105 / 310 | 12 / 43 |
| Claude proposer | 3.4 / 51.3 / 106.8 | 276; 66 / 100 / 300 | 26 / 125 |
| dsh proposer | 5.6 / 24.4 / 180 | 485; 62 / 109 / 310 | 13 / 23 |
| local-backend | 7.6 / 30.0 / 60 | 305; 42 / 81 / 300 | 2 / 17 |

### F-3 Failed attempts [M] `verified-local`

An attempt starts at `proposer_start` or `accelerator_start` and takes the first verdict that follows. Its time is proposer + yield + verification + critic + setup + diagnostician.

| Group | Attempts | Approved n / h | Rejected n / h | Malformed n / h | Verification-failed n / h | No verdict n / h | Failed share of attempt time | Recorded cost in failed attempts / total |
|---|---|---|---|---|---|---|---|---|
| All | 1,286 | 400 / 141.6 | 597 / 242.4 | 81 / 16.1 | 92 / 42.9 | 116 / 131.4 | **52.5 %** | $3,675 / $6,915 (53 %) |
| Claude proposer | 331 | 230 / 79.0 | 42 / 85.6 | 4 / 2.2 | 19 / 21.1 | 36 / 63.8 | 43.3 % | $936 / $2,264 (41 %) |
| dsh proposer | 610 | 63 / 21.1 | 380 / 96.6 | 41 / 9.9 | 72 / 18.9 | 54 / 51.2 | 63.4 % | not recorded |
| local-backend | 332 | 94 / 39.2 | 175 / 60.2 | 36 / 4.0 | 1 / 2.9 | 26 / 16.4 | 54.7 % | $2,739 / $4,651 |
| NETOPS | 25 | 14 / 19.5 | 5 / 49.7 | 0 | 0 | 6 / 58.6 | 38.9 % | — |

- Attempts to approval, per phase, across runs: 399 phases judged, 393 approved, 283 (72 %) on the first attempt; mean 2.41, median 1, p90 5, max 46. [M]
- "Failed" time is not all waste: the tree is kept and the next attempt builds on it. The figure is the time between a launch and a verdict that did not approve. `inferred` from the archive-and-continue behaviour A5 §3 describes.
- "No verdict" attempts ended because the run ended: stop flag, iteration limit, kill, or still open.

### F-4 Killed passes, stalls and errors [M] `verified-local`

| Group | Passes | Killed n / h | Share of proposer time | Hard cap n / h | Repeat stall n / h | Progress stall n / h | Agent errors n / h |
|---|---|---|---|---|---|---|---|
| All | 2,096 | 66 / 40.6 | 9.7 % | 28 / 31.6 | 35 / 6.9 | 3 / 2.1 | 30 / 4.1 |
| **Claude proposer** | 515 | 37 / 32.5 | **24.9 %** | 23 / 26.6 | 14 / 5.9 | 0 | 19 / 0.1 |
| dsh proposer | 976 | 29 / 8.1 | 4.8 % | 5 / 5.0 | 21 / 1.0 | 3 / 2.1 | 0 |
| local-backend | 592 | 0 | 0 | 0 | 0 | 0 | 11 / 4.1 |
| NETOPS | 142 | 21 / 17.9 | 40.5 % | 16 / 16.0 | 5 / 1.8 | 0 | 1 / 0 |
| P07 (second Claude sample) | 159 | 16 / 14.6 | 20.0 % | 7 / 10.5 | 9 / 4.1 | 0 | — |

Per phase, NETOPS, at the cutoff. Attempt results in order: A approved, R rejected, N no verdict.

| Phase | Attempts | Passes | Cap kills (h) | Stall kills (h) | Proposer h | Detached wait h | Critic min | Setup min | Failed-attempt h | No-verdict h | Recorded $ | Passes without cost | Estimated unrecorded $ [E] |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1 (A) | 1 | 0 | 0 | 0.22 | 0 | 1.1 | 0.2 | 0 | 0 | 4 | 0 | 0 |
| 2 | 1 (A) | 2 | 0 | 0 | 0.81 | 0 | 1.6 | 1.3 | 0 | 0 | 54 | 0 | 0 |
| 3 | 3 (NNA) | 64 | 3 (3.01) | 1 (0.33) | 8.27 | 0 | 2.4 | 13.3 | 0 | 5.71 | 152 | 4 | 169 |
| 4 | 3 (NNA) | 10 | 4 (4.01) | 0 | 7.26 | 0 | 1.5 | 10.4 | 0 | 4.26 | 41 | 6 | 90 |
| 5 | 1 (A) | 2 | 1 (1.00) | 0 | 1.37 | 0 | 1.3 | 1.6 | 0 | 0 | 3 | 1 | 34 |
| 6 | 1 (A) | 5 | 2 (2.00) | 0 | 3.57 | 0 | 2.0 | 3.6 | 0 | 0 | 11 | 2 | 62 |
| 7 | 2 (RA) | 3 | 1 (1.00) | 0 | 1.83 | 0 | 3.1 | 3.7 | 1.91 | 0 | 10 | 1 | 48 |
| 8 | 2 (RA) | 3 | 1 (1.00) | 0 | 1.63 | 0 | 2.6 | 2.7 | 1.65 | 0 | 6 | 1 | 48 |
| 9 | 1 (A) | 3 | 0 | 1 (0.24) | 1.40 | 0 | 1.1 | 2.8 | 0 | 0 | 18 | 1 | 2 |
| 10 | 3 (RRA) | 4 | 0 | 0 | 1.23 | 0 | 3.7 | 8.1 | 1.11 | 0 | 15 | 0 | 0 |
| 11 | 1 (A) | 2 | 0 | 0 | 0.49 | 0 | 1.1 | 2.9 | 0 | 0 | 10 | 0 | 0 |
| 12 | 1 (A) | 3 | 1 (1.00) | 0 | 2.22 | 0 | 1.6 | 4.4 | 0 | 0 | 14 | 1 | 52 |
| 13 | 1 (A) | 3 | 1 (1.00) | 0 | 1.70 | 0 | 1.3 | 2.8 | 0 | 0 | 18 | 1 | 7 |
| 14 | 1 (A) | 2 | 0 | 1 (0.39) | 0.57 | 0 | 1.0 | 3.2 | 0 | 0 | 2 | 1 | 16 |
| 15 (open) | 3 (RNN) | 35 | 2 (2.00) | 2 (0.86) | 11.50 | **82.01** | 1.3 | 8.8 | 45.05 | 48.66 | 159 | 4 | 64 |

Token columns are left out of this table on purpose: events carry no token count for killed passes, so event-based sums understate (189 M input tokens for phase 3 against A5's transcript-based 236 M). Use A5 §2.3 for tokens per phase.

The same table for the second Claude sample (P07, three finished features, 47 phases) is Appendix B.

### F-5 Detached waits in the reference run [M] `verified-local`

| Yield result | Waits | Hours |
|---|---|---|
| Job exit code 1 | 4 | 35.50 |
| Job exit code 0 | 2 | 17.69 |
| Exit code unknown | 1 | 19.55 |
| Open (one cut by the stage timeout, one running at the cutoff) | 2 | 9.28 |
| **Total** | 9 | **82.0** |

Source: `pass_yield`/`yield_resume` events; `aggregate.py`, section "yields".

Time spent after a long job had already failed, measured from file modification times (`t151.py`):

| Acceptance run | Duration h | First failing step | Known after h | Kept running h | Failing rows at the end |
|---|---|---|---|---|---|
| r5 | 4.02 | cycle-1 `provision-rerun` rc 1 (row 15 of 61) | 0.69 | 3.33 | 27 |
| r7 | 7.15 | cycle-1 `test-reverify` rc 2 (row 38 of 71) | 3.45 | 3.70 | 5 |
| r8 | 13.87 | cycle-1 `verify-topology-view` rc 2 (row 35 of 168) | 2.80 | 11.06 | 58 |
| r9 | 7.33 | cycle-1 `credential-scan` rc 1 (row 58 of 168) | 3.06 | 4.26 | 51 |
| r10 | 10.53 | cycle-1 `degradation-e2e` rc 1 (row 59 of 169) | 3.58 | 6.95 | 3 |
| **Total** | **42.9** | | | **29.3** | |

- The criterion needs three clean cycles, so every one of these runs was lost at the first failing step. **29.3 h of 42.9 h (68 %) ran after that point.** [M] by the modification time of `acceptance.<step>.json` in the run's `cycle-1` evidence directory, against `plan.tsv` (start) and `results.tsv` (end).
- This replaces A5's estimate of about 25 h, which assumed equal cycle lengths and covered r7–r10 only. r5 is added.
- New since A5: run r11 started 2026-09-28 16:16 and ended after 5 s with exit code 143 and an empty `results.tsv` (`/tmp/p15/chain.log` lines 221–222). That makes 10 attempts at the three-cycle job and 0 successes. [M]

### F-6 Cost that was never recorded [E] `inferred`

Method (`killcost.py`): sum API usage per session transcript, de-duplicated by message id, with subagent transcripts added; join sessions to passes by start time (141 of 142 joined); fit a price scale on the 118 joined passes that recorded a cost, with the price ratios fixed at input 1 : cache write 2 : cache read 0.1 : output 5; apply to the 23 passes without cost.

| Passes without recorded cost | n | Hours | Estimated $ |
|---|---|---|---|
| Killed at the hard cap | 16 | 16.04 | 499 |
| Killed for repeat stall | 4 | 1.18 | 62 |
| Open when the run ended | 2 | 1.01 | 13 |
| Agent error | 1 | 0 | 18 |
| **Total** | 23 | 18.2 | **592** |

- Fit quality: R² 0.88, median absolute error $0.29 per pass, p90 $3.70; predicted $515 against $504 recorded on the fitted passes. A split-half check puts the total within −25 % to +29 % (5th–95th percentile). So the unrecorded amount is **$440–$760, central $590**.
- Recorded spend is $516, so the true spend of the reference run is about **$1,100**, a little over twice what the events say.
- Killed passes are the expensive ones: about $31 per hour against $19.8 per hour for passes with a recorded cost. They carry 720 M cache-read tokens in subagents against 204 M in the main sessions. [M] for tokens, [E] for dollars.
- The dollars are the CLI's API-equivalent figure. Under a subscription they measure consumption of allowance, not money paid. `inferred`
- A simpler estimate, hours × the $/hour of known passes, gives $361. It is lower because it ignores that killed passes are subagent-heavy.

### F-7 Blocked on a person [E] `inferred`

Method (`blocked.py`): a pass counts as "declared blocked" when it wrote no evidence and its closing message matches a fixed pattern ("still blocked", "blocked on … operator/decision", "decisions only you", "waiting for the operator's …").

| Project | Run ended with | Passes | Declared blocked | Their hours | Their recorded $ |
|---|---|---|---|---|---|
| NETOPS run 2 | iteration limit | 30 | 28 | 2.36 | 55 |
| NETOPS run 1 | iteration limit | 33 | 26 | 0.30 | 12 |
| P07 | iteration limit | 39 | 19 | 0.65 | 8 |
| three other runs | mixed | 138 | 3 | 0.27 | 5 |
| **All** | | | **76** | **3.57** | **82** |

Runs stopped by the iteration limit [M]: 14 runs, 576 passes, 47.8 h, $846 recorded. 366 of those passes (64 %) ran under 2 minutes, together 3.8 h. 5 of the 14 runs produced no evidence in 30 passes.

The waiting for the answer is not in any pass. It shows as the gap before the next run: median 0.44 h and p90 4.2 h after an iteration-limit stop (F-8).

### F-8 Restarts [M] `verified-local`

| Previous run ended with | Restarts | Gap median h | p90 h | Max h | Sum h | Sum of gaps ≤ 24 h |
|---|---|---|---|---|---|---|
| Stop flag (operator) | 56 | 0.11 | 3.12 | 34.1 | 79.1 | 45.0 |
| No terminal event (killed or crashed) | 46 | 0.31 | 1.70 | 230.7 | 316.7 | 27.4 |
| Iteration limit | 14 | 0.44 | 4.18 | 11.6 | 23.6 | 23.6 |
| Reject limit | 11 | 0.15 | 2.16 | 8.9 | 12.7 | 12.7 |
| Gate oscillation | 5 | 0.53 | 4.81 | 6.4 | 9.4 | 9.4 |
| Consecutive proposer errors | 3 | 0.03 | 0.04 | 0.04 | 0.1 | 0.1 |
| Other | 2 | — | — | — | 0.2 | 0.2 |
| **All** | **137** | **0.18** | **2.60** | 230.7 | 441.8 | **118.5** |

- Run endings over 172 runs: stop flag 57, no terminal event 51, all approved 26, iteration limit 14, reject limit 12, gate oscillation 5, consecutive errors 3, release verification 2, other 2. **Only 26 runs (15 %) ended because the work was done.**
- The first pass after a resume: n = 125, median 11.2 min, p90 56.8 min, 40.4 h in total. This is the length of that pass, not pure re-orientation; it bounds the cost from above. `inferred`
- NETOPS: `"relaunches": []` with `"remaining": 2` in `harness-run.json`; 0 automatic relaunches. The supervisor log shows 256 consecutive unchanged supervision cycles at a 600 s interval at the cutoff.

### F-9 Launch to all gates approved [M] `verified-local`

Per feature (`features.py`; full table in Appendix A).

| Group | Features | Calendar h, median / p90 | Alive h, median / p90 | Alive h per approved phase, median / p90 | Runs per feature, median / max |
|---|---|---|---|---|---|
| Finished, all proposers | 25 of 35 | 6.1 / 42.4 | 4.8 / 35.7 | 0.77 / 3.27 | 2 / 19 |
| Finished, Claude proposer | 7 | 21.8 / 159.0 | 20.7 / 53.5 | 1.22 / 4.85 | 8 / 19 |
| Finished, Claude proposer, forward, 15–17 phases (P07, 3 features) | 3 | 43.1 (21.8–58.6) | 26.9 (20.7–52.5) | 1.80 (1.22–3.50) | 10 (8–13) |
| NETOPS (not finished, 14 of 16 phases) | 1 | 189.2 so far | 127.9 so far | 9.13 | 6 |

### F-10 Cold start [M] for times, [E] for the category split `verified-local`

Method (`inpass.py`): from `agent_tool` events only. "First action" is the first source edit, non-read shell command, or subagent launch.

| Group | Passes | Minutes to first action, median / p90 | Total h | Share of pass time | Calls before it, median / p90 | Passes touching `PROGRESS.md` (within the first 3 calls) |
|---|---|---|---|---|---|---|
| All with tool events | 1,009 | 0.6 / 2.6 | 18.5 | 7.5 % | 4 / 20 | 997 (988) |
| Claude proposer | 473 | 0.5 / 2.0 | 6.7 | 5.2 % | 4 / 18 | 468 (463) |
| local-backend | 530 | 0.8 / 3.0 | 11.7 | 10.1 % | 4 / 21 | 529 (525) |
| NETOPS | 141 | 0.3 / 0.8 | 0.9 | 2.0 % | 3 / 8 | 139 (139) |
| P07 | 141 | 0.8 / 3.8 | 3.5 | 4.9 % | 6 / 31 | 140 (138) |
| P08 (reverse, small phases) | 158 | 0.3 / 1.6 | 1.8 | 20.6 % | 3 / 14 | 156 (153) |

- A5 measured 3.2 h for NETOPS from transcripts with a wider definition of "action" timing; events give 0.9 h. Both agree that orientation is a small share of time in large phases and a large one in small phases (20.6 % in P08). The range 0.9–3.2 h is the honest figure for NETOPS.
- First-turn context, NETOPS [M] transcripts: median 107,798 tokens, p90 129,271, max 138,781; 15.3 M tokens over 141 passes. In the newest run (6 passes) the median is 138,226. The assembled prompt for phase 15 is 311,964 bytes against a 180,000-byte budget.
- Time following each kind of tool call, all passes with tool events [E]: shell execution 41 %, read and search 25 %, model text 13 %, wait calls 12.5 % (Claude 19.9 %, NETOPS 25.5 %). Each bucket includes the model turn that follows the call, and subagent work is mixed into the parent's stream, so these are not comparable with A5 §2.2 category by category. The robust part: **passes killed at the hard cap spent 41 % of their time after wait calls**, against 9 % for passes that wrote evidence.

### F-11 What changed in the reference run since A5 [M] `verified-local`

| Item | A5 (02:30) | Now (03:25) |
|---|---|---|
| Alive time | 127.0 h | 127.9 h |
| Calendar | 188.3 h | 189.2 h |
| Yield | 81.09 h | 82.0 h |
| Phase | 15, in a yield wait | 15, still in the same wait (yield index 4, 9,330 s elapsed at the cutoff, deadline 50,000 s) |
| Run 6 since the relaunch | | 42.0 h alive: 39.8 h yield (95 %), 2.04 h in 6 passes, 0.08 h setup; $61 recorded; 0 verdicts |
| Acceptance job | 9 attempts, 0 passed | 10 attempts, 0 passed (r11 died in 5 s) |
| Walk job (T153) | 4 done, 5th running | r3 9.8 h, r4 5.4 h done with exit 0; r5 running |
| `PROGRESS.md` | 117 KB | 206 KB |

### F-12 Stage level [M] `verified-local`

Source: supervisor `state.json` files.

| Pipeline | Stages | Stage times |
|---|---|---|
| NETOPS | 2 | shim setup under 1 s; the run stage has been open since the relaunch |
| SPECSTRIDE, three features in one pipeline | 3 | 2.21 h, 4.79 h, 9.26 h; 16.25 h in total; all child exit codes 0; no relaunch budget |
| P07 feature 2 | 4 | preparation stages 9 s in total; run stage 1.40 h |
| P07 feature 3 | 5 | preparation stages 18 s in total; run stage 0.26 h |

Stage preparation is seconds. `state.json` keeps only the timestamps of the last launch of each stage: P07's two features show 1.40 h and 0.26 h there, while their events show 52.5 h and 26.9 h alive over 8 and 10 runs.

### F-13 Difference from A5: pass outcome counts `verified-local`

A5 counts 7 yield passes and 4 cut-off passes; this report counts 9 and 2. The total of 142 agrees. The difference is one of definition: a pass that yielded and whose wait was later cut by the end of the run is a yield pass here. Hours differ by under 0.1 h.

### F-14 Difference from A5: blocked passes `verified-local`

A5 counts 51 no-progress passes in phase 3 (0.66 h, $33). The text heuristic finds 54 passes and 2.66 h, because it includes three long passes that worked and then closed by declaring a block. A5's figure is the better lower bound; the true cost lies between.

## Telemetry gaps for R14

A5 §7 lists 13 gaps; all stand. Items 14–20 are new. Each is something this baseline needed and could only estimate, reconstruct or not answer.

| # | Cannot be answered today | Evidence | What the schema needs |
|---|---|---|---|
| 1–13 | As A5 §7 | A5 | As A5 |
| 14 | **Pass identity.** `iter` is reused after a yield resume (iter 1 twice and iter 3 three times in the newest run), so a pass has no unique key | events of run `20260927-092715-907142` | A pass id that is unique per session start, plus the attempt id it belongs to |
| 15 | **Why a run ended.** 51 of 172 runs have no terminal event; an operator stop, a supervisor timeout and a crash look the same | F-8 | A terminal event on every exit path, with the cause and who caused it |
| 16 | **Cost for 55 % of passes.** dsh and prime passes record no tokens or cost (989 passes); killed passes record none on any harness | F-2, F-6 | Usage counted per model call as it happens, so a kill loses nothing; a harness that cannot report usage says so explicitly |
| 17 | **Cost is repeated, not attributed.** One pass emits several `agent_result` lines carrying the same cumulative `cost_usd`; a naive sum over-counts | run 6, pass at 05:36 | Cost per session with parent and child ids, and a flag for cumulative versus incremental |
| 18 | **Stage history.** `state.json` holds only the last launch of a stage | F-12 | Stage start and end per launch, appended |
| 19 | **Verification inside a pass.** When the proposer runs the verification itself, the orchestrator sees proposer time only | F-2 (NETOPS verification = 0) | A check event with command, duration and result, whoever runs it; this is also what a micro-loop check will emit |
| 20 | **Attempt outcome and what carried over.** Nothing records whether the work of a failed or unfinished attempt was kept, so "time in failed attempts" cannot be split into lost and reused | F-3 | Per attempt: end cause, and the work products that carried into the next one |

## Version/date pins

| Item | Value |
|---|---|
| Measurement time and cutoff | 2026-09-29 03:25 +04:00; epoch 1790637900 |
| Reference run | feature `004-agentic-netops-composite`, 6 Specstride runs, 2026-09-21 06:10 to the cutoff; proposer `claude` (model `claude-opus-5-5` in `agent_init`), critic through `dsh` |
| Specstride baseline | `9cab15d` (per the prompt file) |
| Installed CLI | `claude` 2.1.284 (per the prompt file §1; not re-run) |
| Population period | 2026-07-25 to 2026-09-29 |
| Tools | Python 3 with numpy, for `killcost.py` only |

## Options compared

Which baseline the acceleration reports and the decision-21 evaluation should measure against.

| Option | Represents Wave 1 (Claude proposer) | Sample size | Has long detached jobs | Has cost | Finished features | Risk |
|---|---|---|---|---|---|---|
| A. NETOPS alone (A5's choice) | Yes | 1 feature, 142 passes | Yes, dominant | Partly | No | One phase is 73 % of the time; a saving there says little about ordinary phases |
| B. Whole population | Mixed harnesses and older loop versions | 172 runs, 2,096 passes | Rare | 45 % of passes | 25 | Rejection rates of 60–70 % on older local models would overstate what micro-loops can save for Claude |
| C. Claude-proposer population | Yes | 55 runs, 515 passes, 331 attempts | Yes (NETOPS) | 82 % of passes | 7 | Two projects carry 90 % of the hours |
| **D. Two tiers: C as the general baseline, with NETOPS phase 15 kept as a separate "long verification" baseline** | Yes | as C | Reported apart | as C | 7 | Two numbers to carry instead of one |

## Recommendation

Adopt option D. **Confidence: medium-high** for the structure, **high** for the measured figures, **medium** for the two estimates (unrecorded cost, blocked passes).

1. Reports R22–R27 state savings against the **Claude-proposer baseline**: 51 % proposer, 32 % detached wait, 11 % orchestrator verification, 2.2 % critic; 24.9 % of proposer time in killed passes; 43 % of attempt time in failed attempts and 25 % in attempts with no verdict; 1.22 h alive per approved phase (median over finished features); 8 runs per finished feature.
2. Savings on long detached jobs are stated separately against the **long-verification baseline**: 82.0 h of waits, of which 35.5 h ended in a failed job and 29.3 h of job time ran after the first failure was known.
3. For the decision-21 targets, the paired-run metrics map to: elapsed = alive hours per approved phase; killed passes = 37 of 515 (7.2 % of passes, 24.9 % of proposer time); iteration exhaustion = 14 of 172 runs; cost = recorded plus estimated unrecorded cost, never recorded cost alone.
4. R14 takes gaps 14–20 with A5's 13.

## Matrix rows

None. One observation for the harness matrix owner, column "quota signal / usage": in this population the `dsh` and `prime` proposers emitted no token or cost fields in any of 989 passes `verified-local` (`aggregate.py`, cost table).

## Open questions / risks

1. **The 25 % elapsed-time target and detached waits.** In the reference run 64 % of alive time is outside any pass. A micro-loop inside a pass cannot shorten it; only fail-fast inside the long job can (29.3 h measured). If the evaluation uses projects without long jobs, this largest saving will not show; if it uses NETOPS alone, it will dominate. R27 should define the fixture mix. Not a conflict with decision 21.
2. **Cost comparisons are unsound on recorded cost.** Recorded cost misses about half of the reference run's spend, and the missing half is concentrated in killed passes. A strategy that removes kills would look more expensive on recorded cost while being cheaper. The "cost no worse" test of decision 21 needs gap 16 closed first.
3. **Two projects carry the Claude baseline.** NETOPS and P07 are 228 of 254 h. Confidence intervals were not computed; A7 cites within-phase cost variance large enough that a 30 % change needs 58–97 passes per arm.
4. **Loop version drift.** The population spans two months of changes to the loop (yield, stall watchdogs and cost reporting arrived part-way). Kill counts before those features existed are structurally 0 for some harnesses.
5. **Modification times as clocks.** F-5 relies on file modification times in the evidence tree. A later rewrite of a step file would move the time; each cycle has its own directory, which makes that unlikely. `inferred`
6. **Heuristics.** Blocked-pass detection (F-7) and the tool categories (F-10) are pattern-based and English-only.
7. **Copies.** Two project roots hold identical runs; the de-duplication keeps one. If they are in fact separate executions with copied state, the population is understated by 31 runs.
8. **Transcripts are outside the project** and not guaranteed to be kept; F-6 and the first-turn figures cannot be recomputed once they are pruned.

## Method: how to recompute

```
mkdir -p /tmp/specstride-research/R21 && cd /tmp/specstride-research/R21
# save the scripts below under their names, then:
python3 baseline.py 1790637900      # writes runs.json, aliases.tsv
python3 aggregate.py                # F-1, F-2, F-3, F-4, F-5 (yields), F-8
python3 features.py NETOPS          # F-9, Appendix A, per-phase table of F-4
python3 features.py P07             # Appendix B
python3 inpass.py 1790637900        # F-10
python3 blocked.py 1790637900       # F-7
python3 killcost.py 1790637900      # F-6, first-turn context (needs numpy)
python3 t151.py                     # F-5 (time after first failure)
```

All scripts only open files for reading. `baseline.py` runs one `find` under `/root`. Supervisor figures (F-8, F-12) were read directly from `harness-run.json`, `state.json` and `grep -n "MOL-" harness-report.log`.

## Appendix A: every feature

| feature | mode | proposer | critic | runs | phases | phases approved | finished | calendar h | alive h | gap h | passes | killed passes | A | R | M | recorded cost $ | alive h per approved phase |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| P09-F01 | forward | local-backend | local-backend | 5 | 5 | 4 | no | 4.5 | 3.7 | 0.8 | 22 | 0 | 4 | 13 | 0 | 42 | 0.91 |
| P15-F02 | forward | local-backend | local-backend | 2 | 2 | 2 | yes | 6.1 | 4.7 | 1.4 | 11 | 0 | 2 | 1 | 0 | 56 | 2.35 |
| P01-F03 | reverse | local-backend | local-backend | 1 | 13 | 13 | yes | 1.3 | 1.3 | 0.0 | 16 | 0 | 13 | 3 | 0 | 18 | 0.10 |
| P03-F04 | reverse | local-backend | local-backend | 2 | 6 | 6 | yes | 2.1 | 1.5 | 0.6 | 15 | 0 | 6 | 4 | 1 | 22 | 0.25 |
| P02-F05 | reverse | local-backend | local-backend | 3 | 6 | 3 | no | 4.2 | 4.1 | 0.2 | 32 | 0 | 3 | 30 | 0 | 169 | 1.36 |
| P04-F06 | forward | local-backend | local-backend | 4 | 10 | 10 | yes | 19.3 | 17.5 | 1.8 | 78 | 0 | 10 | 25 | 0 | 451 | 1.75 |
| P04-F07 | forward | local-backend | local-backend | 1 | 1 | 1 | yes | 0.0 | 0.0 | 0.0 | 1 | 0 | 1 | 0 | 0 | 1 | 0.01 |
| SPECSTRIDE-F08 | forward | local-backend | local-backend | 4 | 7 | 7 | yes | 3.0 | 2.7 | 0.4 | 20 | 0 | 7 | 11 | 0 | 41 | 0.38 |
| LISA-F09 | forward | local-backend | local-backend | 1 | 13 | 13 | yes | 10.0 | 10.0 | 0.0 | 40 | 0 | 13 | 21 | 0 | 525 | 0.77 |
| P16-F10 | forward | local-backend | local-backend | 3 | 14 | 14 | yes | 41.4 | 41.0 | 0.4 | 109 | 0 | 14 | 22 | 0 | 1067 | 2.93 |
| LISA-F11 | forward | claude+local-backend | local-backend | 20 | 8 | 7 | no | 40.5 | 29.8 | 10.6 | 119 | 0 | 7 | 51 | 1 | 1695 | 4.26 |
| P12-F12 | forward | local-backend | local-backend | 1 | 6 | 6 | yes | 8.1 | 8.1 | 0.0 | 17 | 0 | 6 | 1 | 0 | 58 | 1.35 |
| LISA-F13 | forward | prime | prime | 1 | 7 | 7 | yes | 0.8 | 0.8 | 0.0 | 7 | 0 | 7 | 0 | 0 | 0 | 0.12 |
| P12-F14 | forward | local-backend | local-backend | 1 | 6 | 6 | yes | 0.2 | 0.2 | 0.0 | 6 | 0 | 6 | 0 | 0 | 16 | 0.04 |
| SPECSTRIDE-F15 | forward | local-backend | local-backend | 1 | 9 | 2 | no | 0.6 | 0.6 | 0.0 | 21 | 0 | 2 | 0 | 0 | 0 | 0.29 |
| P11-F16 | forward | prime | local-backend | 1 | 6 | 6 | yes | 1.5 | 1.5 | 0.0 | 6 | 0 | 6 | 0 | 0 | 0 | 0.24 |
| P05-F17 | forward | dsh | dsh | 10 | 7 | 7 | no | 14.0 | 10.4 | 3.6 | 94 | 0 | 7 | 48 | 33 | 0 | 1.48 |
| P05-F18 | forward | dsh | dsh | 6 | 7 | 7 | yes | 37.0 | 18.0 | 19.0 | 155 | 0 | 7 | 81 | 2 | 0 | 2.58 |
| P05-F19 | forward | dsh | dsh | 3 | 7 | 7 | yes | 10.1 | 7.6 | 2.6 | 77 | 0 | 7 | 35 | 0 | 0 | 1.08 |
| P05-F20 | forward | claude+dsh+local-backend | dsh+local-backend | 19 | 8 | 8 | yes | 309.5 | 55.0 | 254.5 | 302 | 0 | 8 | 95 | 35 | 228 | 6.87 |
| P06-F21 | forward | dsh+local-backend | dsh+local-backend | 25 | 9 | 9 | no | 128.3 | 73.8 | 54.5 | 289 | 7 | 9 | 66 | 5 | 368 | 8.20 |
| P06-F22 | forward | dsh | dsh | 11 | 8 | 6 | yes | 34.3 | 27.7 | 6.6 | 114 | 2 | 6 | 57 | 0 | 0 | 4.61 |
| P07-F23 | forward | claude | dsh | 13 | 17 | 17 | yes | 21.8 | 20.7 | 1.1 | 49 | 3 | 17 | 7 | 2 | 458 | 1.22 |
| P07-F24 | forward | claude | dsh | 8 | 15 | 15 | yes | 58.6 | 52.5 | 6.1 | 73 | 10 | 15 | 10 | 1 | 369 | 3.50 |
| P07-F25 | forward | claude | dsh | 10 | 15 | 15 | yes | 43.1 | 26.9 | 16.1 | 37 | 3 | 15 | 10 | 0 | 515 | 1.80 |
| NETOPS-F26 | forward | claude | dsh | 6 | 16 | 14 | no | 189.2 | 127.9 | 61.4 | 142 | 21 | 14 | 5 | 0 | 516 | 9.13 |
| SPECSTRIDE-F27 | forward | dsh | dsh | 1 | 6 | 0 | no | 1.2 | 1.2 | 0.0 | 13 | 1 | 0 | 0 | 0 | 0 | - |
| SPECSTRIDE-F28 | forward | dsh | dsh | 1 | 6 | 0 | no | 0.5 | 0.5 | 0.0 | 27 | 18 | 0 | 0 | 0 | 0 | - |
| SPECSTRIDE-F29 | forward | dsh | dsh | 1 | 6 | 6 | yes | 2.2 | 2.2 | 0.0 | 9 | 0 | 6 | 0 | 0 | 0 | 0.37 |
| SPECSTRIDE-F30 | forward | dsh | dsh | 1 | 7 | 7 | yes | 4.8 | 4.8 | 0.0 | 7 | 0 | 7 | 0 | 0 | 0 | 0.68 |
| SPECSTRIDE-F31 | forward | dsh | dsh | 1 | 7 | 7 | yes | 9.3 | 9.3 | 0.0 | 9 | 1 | 7 | 0 | 0 | 0 | 1.32 |
| P08-F32 | reverse | claude | dsh | 1 | 355 | 148 | no | 20.2 | 20.2 | 0.0 | 158 | 0 | 148 | 1 | 1 | 270 | 0.14 |
| SPECSTRIDE-F33 | reverse | claude | dsh | 2 | 5 | 10 | yes | 0.8 | 0.7 | 0.2 | 10 | 0 | 10 | 0 | 0 | 10 | 0.07 |
| P10-F34 | reverse | claude | dsh | 1 | 5 | 5 | yes | 0.4 | 0.4 | 0.0 | 5 | 0 | 5 | 0 | 0 | 7 | 0.08 |
| P14-F35 | reverse | claude | dsh | 1 | 5 | 5 | yes | 0.6 | 0.6 | 0.0 | 6 | 0 | 5 | 1 | 0 | 11 | 0.11 |


## Appendix B: per phase, second Claude sample (P07)

Columns as in F-4; V = verification failed, M = malformed. Token columns come from events and miss killed passes.

| feature | phase | attempts (results in order) | passes | cap kills (h) | stall kills (h) | proposer h | detached wait h | orch. verification h | critic min | setup min | time in attempts that failed h | time in attempts with no verdict h | recorded cost $ | passes without cost | input tokens M | output tokens M |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| P07-F23 | 1 | 4 (NNRA) | 14 | 0 (0.00) | 0 (0.00) | 0.54 | 0.00 | 0.00 | 2.1 | 0.3 | 0.45 | 0.05 | 12 | 12 | 13 | 0.12 |
| P07-F23 | 2 | 2 (RA) | 2 | 0 (0.00) | 0 (0.00) | 1.42 | 0.00 | 0.00 | 4.4 | 0.9 | 1.31 | 0.00 | 55 | 0 | 75 | 0.42 |
| P07-F23 | 3 | 1 (A) | 2 | 0 (0.00) | 1 (0.39) | 0.73 | 0.00 | 0.00 | 1.7 | 0.3 | 0.00 | 0.00 | 10 | 1 | 12 | 0.09 |
| P07-F23 | 4 | 2 (NA) | 3 | 0 (0.00) | 2 (0.36) | 0.72 | 0.00 | 0.01 | 1.4 | 0.5 | 0.00 | 0.37 | 9 | 2 | 11 | 0.08 |
| P07-F23 | 5 | 2 (NA) | 2 | 0 (0.00) | 0 (0.00) | 0.94 | 0.00 | 0.01 | 1.2 | 0.5 | 0.00 | 0.56 | 10 | 1 | 13 | 0.07 |
| P07-F23 | 6 | 1 (A) | 1 | 0 (0.00) | 0 (0.00) | 0.56 | 0.00 | 0.01 | 1.2 | 0.2 | 0.00 | 0.00 | 18 | 0 | 23 | 0.13 |
| P07-F23 | 7 | 1 (A) | 1 | 0 (0.00) | 0 (0.00) | 0.74 | 0.00 | 0.01 | 1.1 | 0.6 | 0.00 | 0.00 | 21 | 0 | 27 | 0.16 |
| P07-F23 | 8 | 1 (A) | 1 | 0 (0.00) | 0 (0.00) | 0.72 | 0.00 | 0.02 | 1.1 | 0.7 | 0.00 | 0.00 | 26 | 0 | 38 | 0.15 |
| P07-F23 | 9 | 2 (RA) | 2 | 0 (0.00) | 0 (0.00) | 0.93 | 0.00 | 0.03 | 2.2 | 0.6 | 0.60 | 0.00 | 19 | 0 | 22 | 0.15 |
| P07-F23 | 10 | 1 (A) | 1 | 0 (0.00) | 0 (0.00) | 0.54 | 0.00 | 0.02 | 1.6 | 0.6 | 0.00 | 0.00 | 18 | 0 | 24 | 0.12 |
| P07-F23 | 11 | 1 (A) | 1 | 0 (0.00) | 0 (0.00) | 1.31 | 0.00 | 0.02 | 1.5 | 0.9 | 0.00 | 0.00 | 43 | 0 | 65 | 0.24 |
| P07-F23 | 12 | 2 (VA) | 2 | 0 (0.00) | 0 (0.00) | 0.59 | 0.00 | 0.02 | 1.0 | 0.9 | 0.51 | 0.00 | 18 | 0 | 24 | 0.10 |
| P07-F23 | 13 | 2 (VA) | 2 | 0 (0.00) | 0 (0.00) | 0.79 | 0.00 | 0.05 | 0.9 | 0.6 | 0.67 | 0.00 | 16 | 0 | 21 | 0.12 |
| P07-F23 | 14 | 1 (A) | 1 | 0 (0.00) | 0 (0.00) | 0.98 | 0.00 | 0.03 | 1.4 | 0.8 | 0.00 | 0.00 | 23 | 0 | 33 | 0.14 |
| P07-F23 | 15 | 1 (A) | 1 | 0 (0.00) | 0 (0.00) | 0.93 | 0.00 | 0.03 | 0.9 | 0.8 | 0.00 | 0.00 | 17 | 0 | 23 | 0.11 |
| P07-F23 | 16 | 1 (A) | 1 | 0 (0.00) | 0 (0.00) | 0.57 | 0.00 | 0.03 | 1.6 | 0.7 | 0.00 | 0.00 | 25 | 0 | 38 | 0.11 |
| P07-F23 | 17 | 12 (NRRNRRNMNMNA) | 12 | 0 (0.00) | 0 (0.00) | 5.74 | 0.00 | 0.31 | 14.1 | 16.0 | 5.69 | 0.09 | 119 | 5 | 160 | 0.84 |
| P07-F24 | 1 | 2 (NA) | 2 | 0 (0.00) | 0 (0.00) | 0.27 | 0.00 | 0.06 | 1.4 | 0.8 | 0.00 | 0.02 | 7 | 1 | 8 | 0.07 |
| P07-F24 | 2 | 5 (VRMRA) | 7 | 0 (0.00) | 2 (1.31) | 2.74 | 0.00 | 0.70 | 7.4 | 5.8 | 3.25 | 0.00 | 42 | 2 | 56 | 0.24 |
| P07-F24 | 3 | 4 (RVRA) | 5 | 0 (0.00) | 1 (0.69) | 2.63 | 0.00 | 0.81 | 3.9 | 1.4 | 3.20 | 0.00 | 35 | 1 | 46 | 0.23 |
| P07-F24 | 4 | 2 (RA) | 2 | 0 (0.00) | 0 (0.00) | 1.22 | 0.00 | 0.64 | 2.1 | 0.6 | 1.49 | 0.00 | 26 | 0 | 38 | 0.15 |
| P07-F24 | 5 | 3 (RVA) | 4 | 0 (0.00) | 0 (0.00) | 1.86 | 0.00 | 1.05 | 2.2 | 2.1 | 2.17 | 0.00 | 46 | 1 | 66 | 0.26 |
| P07-F24 | 6 | 2 (NA) | 21 | 0 (0.00) | 0 (0.00) | 1.78 | 0.00 | 0.37 | 0.9 | 1.3 | 0.00 | 1.29 | 29 | 0 | 28 | 0.27 |
| P07-F24 | 7 | 1 (A) | 2 | 0 (0.00) | 0 (0.00) | 0.84 | 0.00 | 0.39 | 1.1 | 0.8 | 0.00 | 0.00 | 10 | 0 | 9 | 0.09 |
| P07-F24 | 8 | 1 (A) | 2 | 0 (0.00) | 0 (0.00) | 0.62 | 0.00 | 0.41 | 0.8 | 0.7 | 0.00 | 0.00 | 11 | 0 | 9 | 0.12 |
| P07-F24 | 9 | 1 (A) | 3 | 0 (0.00) | 0 (0.00) | 0.60 | 0.00 | 0.44 | 1.0 | 1.0 | 0.00 | 0.00 | 10 | 0 | 8 | 0.10 |
| P07-F24 | 10 | 3 (VNA) | 3 | 0 (0.00) | 0 (0.00) | 1.76 | 0.00 | 1.04 | 1.5 | 2.0 | 1.66 | 0.06 | 23 | 1 | 24 | 0.25 |
| P07-F24 | 11 | 1 (A) | 2 | 1 (1.50) | 0 (0.00) | 2.31 | 0.00 | 0.59 | 1.5 | 1.1 | 0.00 | 0.00 | 8 | 1 | 11 | 0.04 |
| P07-F24 | 12 | 1 (A) | 1 | 0 (0.00) | 0 (0.00) | 0.81 | 0.00 | 0.57 | 0.9 | 1.0 | 0.00 | 0.00 | 4 | 0 | 4 | 0.02 |
| P07-F24 | 13 | 3 (RNA) | 3 | 0 (0.00) | 0 (0.00) | 1.63 | 0.00 | 1.75 | 2.2 | 2.1 | 2.33 | 0.05 | 26 | 0 | 35 | 0.13 |
| P07-F24 | 14 | 1 (A) | 1 | 0 (0.00) | 0 (0.00) | 1.37 | 0.00 | 0.90 | 1.2 | 0.9 | 0.00 | 0.00 | 17 | 0 | 25 | 0.09 |
| P07-F24 | 15 | 8 (NVNRVRRA) | 15 | 5 (7.52) | 1 (0.94) | 12.74 | 0.00 | 6.68 | 6.8 | 16.8 | 18.09 | 0.16 | 73 | 8 | 98 | 0.40 |
| P07-F25 | 1 | 2 (VA) | 2 | 0 (0.00) | 0 (0.00) | 0.82 | 0.00 | 0.13 | 1.2 | 0.7 | 0.64 | 0.00 | 18 | 0 | 21 | 0.15 |
| P07-F25 | 2 | 7 (NNRRNNA) | 6 | 0 (0.00) | 0 (0.00) | 2.55 | 0.00 | 0.27 | 6.3 | 10.3 | 1.46 | 1.22 | 69 | 2 | 96 | 0.43 |
| P07-F25 | 3 | 1 (A) | 1 | 0 (0.00) | 0 (0.00) | 0.80 | 0.00 | 0.09 | 1.3 | 0.8 | 0.00 | 0.00 | 22 | 0 | 32 | 0.11 |
| P07-F25 | 4 | 1 (A) | 1 | 0 (0.00) | 0 (0.00) | 1.09 | 0.00 | 0.10 | 1.5 | 1.0 | 0.00 | 0.00 | 23 | 0 | 34 | 0.13 |
| P07-F25 | 5 | 2 (RA) | 2 | 0 (0.00) | 0 (0.00) | 1.62 | 0.00 | 0.20 | 3.1 | 1.8 | 1.56 | 0.00 | 59 | 0 | 90 | 0.29 |
| P07-F25 | 6 | 1 (A) | 1 | 0 (0.00) | 0 (0.00) | 0.54 | 0.00 | 0.11 | 1.1 | 1.1 | 0.00 | 0.00 | 15 | 0 | 20 | 0.10 |
| P07-F25 | 7 | 1 (A) | 1 | 0 (0.00) | 0 (0.00) | 0.65 | 0.00 | 0.11 | 1.2 | 1.2 | 0.00 | 0.00 | 13 | 0 | 17 | 0.09 |
| P07-F25 | 8 | 1 (A) | 1 | 0 (0.00) | 0 (0.00) | 1.25 | 0.00 | 0.11 | 1.3 | 1.5 | 0.00 | 0.00 | 41 | 0 | 63 | 0.21 |
| P07-F25 | 9 | 1 (A) | 1 | 0 (0.00) | 0 (0.00) | 0.98 | 0.00 | 0.12 | 1.5 | 1.6 | 0.00 | 0.00 | 31 | 0 | 47 | 0.16 |
| P07-F25 | 10 | 2 (RA) | 2 | 0 (0.00) | 0 (0.00) | 1.27 | 0.00 | 0.23 | 1.9 | 2.9 | 1.35 | 0.00 | 24 | 0 | 34 | 0.14 |
| P07-F25 | 11 | 1 (A) | 1 | 0 (0.00) | 0 (0.00) | 0.59 | 0.00 | 0.12 | 1.1 | 1.5 | 0.00 | 0.00 | 16 | 0 | 23 | 0.10 |
| P07-F25 | 12 | 5 (RRRRA) | 6 | 1 (1.50) | 0 (0.00) | 4.20 | 0.00 | 0.61 | 8.4 | 7.2 | 4.54 | 0.00 | 66 | 1 | 95 | 0.33 |
| P07-F25 | 13 | 1 (A) | 1 | 0 (0.00) | 0 (0.00) | 0.45 | 0.00 | 0.13 | 0.9 | 1.8 | 0.00 | 0.00 | 13 | 0 | 17 | 0.08 |
| P07-F25 | 14 | 3 (NRA) | 6 | 0 (0.00) | 2 (0.38) | 1.34 | 0.00 | 0.29 | 2.8 | 5.2 | 0.69 | 0.42 | 24 | 4 | 33 | 0.13 |
| P07-F25 | 15 | 5 (VVRVA) | 5 | 0 (0.00) | 0 (0.00) | 3.00 | 0.00 | 1.28 | 3.1 | 9.0 | 3.72 | 0.00 | 82 | 0 | 121 | 0.38 |


## Appendix C: scripts

### `baseline.py`

```python
#!/usr/bin/env python3
"""R21 time-use baseline. Read-only over run state. Usage:
   python3 baseline.py [CUTOFF_EPOCH]  -> writes runs.json, aliases.tsv in this directory
Every events.jsonl from the Specstride lineage (.specstride/, .wiggum/) and .lisa/ under /root is parsed.
Events after CUTOFF_EPOCH are ignored, so a verifier can reproduce a figure on a live run.
"""
import json, os, sys, hashlib, subprocess, collections, re

OUT = os.path.dirname(os.path.abspath(__file__))
CUTOFF = float(sys.argv[1]) if len(sys.argv) > 1 else 9e18
NOISE = ('agent_tool', 'agent_text', 'agent_diagnostic', 'telemetry_delivery', 'yield_wait')


def find_files():
    cmd = ("find /root -name events.jsonl \\( -path '*/.specstride/*' -o -path '*/.wiggum/*' -o -path '*/.lisa/*' \\) "
           "-not -path '*/node_modules/*' -not -path '/root/.claude/*' -size +0 2>/dev/null | sort")
    return subprocess.check_output(cmd, shell=True, text=True).split()


def ts_of(e):
    t = e.get('ts')
    try:
        return float(t)
    except Exception:
        return None


def family(p):
    p = str(p or '')
    if p.startswith('claude-agent-sdk'): return 'claude-sdk'
    if p.startswith('claude'): return 'claude'
    if p.startswith('dsh'): return 'dsh'
    if p.startswith('prime'): return 'prime'
    if p.startswith('fake'): return 'stub'
    if p in ('', 'None'): return 'none'
    return 'local-backend'


def project_root(path):
    m = re.match(r'(/root/[^/]+)', path)
    return m.group(1)


def parse(path):
    evs = []
    tools = collections.Counter()
    with open(path, errors='replace') as fh:
        for l in fh:
            try:
                e = json.loads(l)
            except Exception:
                continue
            t = ts_of(e)
            if t is None or t > CUTOFF:
                continue
            ev = e.get('event') or e.get('type')
            if ev in NOISE:
                if ev == 'yield_wait':
                    evs.append((t, '_tick', {}))
                else:
                    evs.append((t, '_tick', {}))
                continue
            evs.append((t, ev, e))
    return evs


def analyse(path):
    evs = parse(path)
    if not evs:
        return None
    r = dict(path=path, n=len(evs), t0=evs[0][0], t1=evs[-1][0])
    rs = next((e for _, ev, e in evs if ev == 'run_start'), {})
    r['run_id'] = rs.get('run_id') or os.path.basename(os.path.dirname(path))
    r['proposer'] = family(rs.get('proposer'))
    r['critic'] = family(rs.get('critic'))
    r['same_family'] = r['proposer'] == r['critic']
    r['feature'] = rs.get('feature') or ''
    r['resume'] = rs.get('resume')
    r['phases_total'] = rs.get('phases')
    r['verification_mode'] = rs.get('verification')
    stop = [e for _, ev, e in evs if ev in ('run_stop', 'run_end')]
    r['stop'] = (stop[-1].get('reason') or stop[-1].get('outcome') or stop[-1].get('event')) if stop else 'no_terminal_event'

    phase = attempt = None
    passes = []      # dict per pass
    attempts = {}    # (phase, attempt_seq) -> dict
    aseq = 0
    cur = None       # open pass
    open_iv = {}     # kind -> start ts
    tot = collections.Counter()
    verdicts = []
    yields = []
    curatt = None
    last_pass_end_kind = None

    def att():
        nonlocal curatt
        return curatt

    def close_pass(t, kind):
        nonlocal cur, last_pass_end_kind
        if cur is None:
            return
        cur['end'] = t
        cur['active'] = max(0.0, t - cur['start'])
        if cur.get('outcome') is None:
            cur['outcome'] = kind
        passes.append(cur)
        if curatt is not None:
            curatt['proposer'] += cur['active']
            curatt['passes'] += 1
        last_pass_end_kind = cur['outcome']
        cur = None

    for t, ev, e in evs:
        if ev == '_tick':
            continue
        if ev == 'phase_start':
            phase = e.get('phase')
        elif ev in ('proposer_start', 'accelerator_start'):
            close_pass(t, 'superseded')
            aseq += 1
            attempt = e.get('attempt')
            phase = e.get('phase', phase)
            curatt = dict(phase=phase, attempt=attempt, seq=aseq, kind=ev, start=t, proposer=0.0, yield_=0.0,
                          critic=0.0, verification=0.0, setup=0.0, diag=0.0, passes=0, kills=0, cost=0.0,
                          result=None, end=None)
            attempts[aseq] = curatt
            open_iv['setup'] = t
        elif ev == 'iter_start':
            close_pass(t, 'superseded')
            if 'setup' in open_iv:
                d = t - open_iv.pop('setup')
                tot['setup'] += d
                if curatt: curatt['setup'] += d
            cur = dict(start=t, iter=e.get('iter'), phase=phase, attempt=attempt, aseq=aseq, outcome=None,
                       cost=None, results=0, inits=0, in_tok=0, out_tok=0, cr_tok=0, cc_tok=0, killed=None,
                       after=last_pass_end_kind, max_dur=-1)
        elif ev == 'agent_init':
            if cur: cur['inits'] += 1
        elif ev == 'agent_result':
            if cur:
                cur['results'] += 1
                for k, f in (('in_tok', 'input_tokens'), ('out_tok', 'output_tokens'),
                             ('cr_tok', 'cache_read_tokens'), ('cc_tok', 'cache_creation_tokens')):
                    try: cur[k] += int(e.get(f) or 0)
                    except Exception: pass
                try:
                    c = float(e.get('cost_usd'))
                    cur['cost'] = max(cur['cost'] or 0.0, c)
                except Exception:
                    pass
        elif ev == 'pass_killed':
            if cur:
                cur['killed'] = e.get('reason')
                cur['outcome'] = 'killed:' + str(e.get('reason'))
                if curatt: curatt['kills'] += 1
                close_pass(t, 'killed')
        elif ev == 'iter_error':
            if cur:
                st = e.get('subtype') or e.get('reason')
                if st and st.startswith('watchdog_'):
                    cur['killed'] = st.replace('watchdog_', '')
                    cur['outcome'] = 'killed:' + cur['killed']
                    if curatt: curatt['kills'] += 1
                elif st == 'success':
                    cur['outcome'] = 'error:empty_success'
                else:
                    cur['outcome'] = 'error:' + str(st)
                close_pass(t, 'error')
        elif ev == 'pass_yield':
            if cur:
                cur['outcome'] = 'yield'
                close_pass(t, 'yield')
            open_iv['yield'] = t
        elif ev == 'yield_resume':
            if 'yield' in open_iv:
                s = open_iv.pop('yield')
                d = t - s
                tot['yield'] += d
                if curatt: curatt['yield_'] += d
                yields.append(dict(start=s, dur=d, rc=e.get('job_rc'), phase=phase, open=False))
        elif ev == 'long_job_start':
            open_iv['longjob'] = t
        elif ev == 'long_job_ended':
            if 'longjob' in open_iv:
                tot['longjob'] += t - open_iv.pop('longjob')
        elif ev in ('iter_done', 'evidence_written'):
            if cur:
                if ev == 'evidence_written' or e.get('evidence') not in (None, 'missing'):
                    cur['outcome'] = 'evidence'
                close_pass(t, 'normal')
            elif ev == 'evidence_written' and passes and passes[-1]['outcome'] == 'normal' and t - passes[-1]['end'] < 5:
                passes[-1]['outcome'] = 'evidence'
        elif ev == 'verification_start':
            close_pass(t, 'normal')
            open_iv['verification'] = t
        elif ev in ('verification_passed', 'verification_failed', 'verification_release_passed'):
            if 'verification' in open_iv:
                d = t - open_iv.pop('verification')
                tot['verification'] += d
                if curatt: curatt['verification'] += d
            if ev == 'verification_failed' and curatt is not None:
                curatt['vfail'] = True
        elif ev == 'critic_start':
            close_pass(t, 'normal')
            open_iv['critic'] = t
        elif ev == 'verdict':
            d = 0.0
            if 'critic' in open_iv:
                d = t - open_iv.pop('critic')
                tot['critic'] += d
                if curatt: curatt['critic'] += d
            verdicts.append(dict(t=t, phase=e.get('phase'), attempt=e.get('attempt'), result=e.get('result'), critic_s=d,
                                 aseq=aseq))
            if curatt is not None and curatt['result'] is None:
                curatt['result'] = e.get('result')
                curatt['end'] = t
        elif ev == 'diagnostician_start':
            open_iv['diag'] = t
        elif ev in ('diagnostician_done', 'diagnostician_error'):
            if 'diag' in open_iv:
                d = t - open_iv.pop('diag')
                tot['diag'] += d
                if curatt: curatt['diag'] += d
        elif ev in ('run_stop', 'run_end'):
            close_pass(t, 'cut_by_run_end')
    # open intervals at end of file
    tend = evs[-1][0]
    if cur is not None:
        cur['outcome'] = 'open_at_end'
        close_pass(tend, 'open_at_end')
    if 'yield' in open_iv:
        s = open_iv.pop('yield'); d = tend - s
        tot['yield'] += d
        if curatt: curatt['yield_'] += d
        yields.append(dict(start=s, dur=d, rc='open', phase=phase, open=True))
    for k in ('critic', 'verification', 'diag', 'setup', 'longjob'):
        if k in open_iv:
            tot[k] += tend - open_iv[k]
    for p in passes:
        a = attempts.get(p['aseq'])
        if a is not None and p['cost']:
            a['cost'] += p['cost']
    tot['proposer'] = sum(p['active'] for p in passes)
    r['alive'] = r['t1'] - r['t0']
    r['tot'] = dict(tot)
    r['unattributed'] = r['alive'] - sum(tot.values())
    r['passes'] = passes
    r['attempts'] = list(attempts.values())
    r['verdicts'] = verdicts
    r['yields'] = yields
    r['phase_done'] = sum(1 for _, ev, _e in evs if ev == 'phase_done')
    r['real_agent'] = any(p['results'] or p['inits'] for p in passes)
    return r


def main():
    files = find_files()
    roots = sorted({project_root(f) for f in files})
    keep_names = {'/root/agentic-netops-srl': 'NETOPS', '/root/specstride': 'SPECSTRIDE', '/root/lisa': 'LISA',
                  '/root/mixture-of-loops': 'MOL'}
    alias = {}
    i = 0
    for rt in roots:
        if rt in keep_names:
            alias[rt] = keep_names[rt]
        else:
            i += 1
            alias[rt] = 'P%02d' % i
    with open(os.path.join(OUT, 'aliases.tsv'), 'w') as fh:
        for rt in roots:
            fh.write('%s\t%s\n' % (alias[rt], rt))
    runs = []
    seen = {}
    for f in files:
        try:
            r = analyse(f)
        except Exception as ex:
            print('ERR', f, ex, file=sys.stderr)
            continue
        if not r:
            continue
        r['project'] = alias[project_root(f)]
        r['store'] = '.lisa' if '/.lisa/' in f else ('.specstride' if '/.specstride/' in f else '.wiggum')
        key = (r['run_id'], round(r['t0'], 3))
        if key in seen:
            o = seen[key]
            o.setdefault('dup_paths', []).append(f)
            o.setdefault('dup_projects', []).append(r['project'])
            better = ('/runs/' in f and '/runs/' not in o['path']) or (r['n'] > o['n'] and not ('/runs/' in o['path'] and '/runs/' not in f))
            if better:
                r['dup_paths'] = o.get('dup_paths', []) + [o['path']]
                r['dup_projects'] = o['dup_projects']
                runs[runs.index(o)] = r
                seen[key] = r
            continue
        seen[key] = r
        runs.append(r)
    json.dump(runs, open(os.path.join(OUT, 'runs.json'), 'w'))
    print('files', len(files), 'unique runs', len(runs), 'cutoff', CUTOFF)


if __name__ == '__main__':
    main()
```

### `aggregate.py`

```python
#!/usr/bin/env python3
"""Aggregate runs.json (from baseline.py). Usage: python3 aggregate.py [section]"""
import json, sys, collections, statistics as st, os
D = os.path.dirname(os.path.abspath(__file__))
runs = json.load(open(os.path.join(D, 'runs.json')))
H = 3600.0


def pct(xs, p):
    xs = sorted(xs)
    if not xs: return float('nan')
    k = (len(xs) - 1) * p / 100.0
    f = int(k); c = min(f + 1, len(xs) - 1)
    return xs[f] + (xs[c] - xs[f]) * (k - f)


def real(r):
    return r['store'] != '.lisa' and r['proposer'] not in ('stub', 'none') and len(r['passes']) > 0


def table(rows, hdr):
    print('| ' + ' | '.join(hdr) + ' |')
    print('|' + '---|' * len(hdr))
    for r in rows:
        print('| ' + ' | '.join(str(x) for x in r) + ' |')
    print()


def f1(x): return '%.1f' % x
def f2(x): return '%.2f' % x


R = [r for r in runs if real(r)]
print('## population')
print('unique runs', len(runs), 'real (non-stub, non-.lisa, >=1 pass)', len(R))
print('excluded: .lisa', sum(1 for r in runs if r['store'] == '.lisa'), 'stub/none', sum(1 for r in runs if r['store'] != '.lisa' and r['proposer'] in ('stub', 'none')),
      'no pass', sum(1 for r in runs if r['store'] != '.lisa' and r['proposer'] not in ('stub', 'none') and not r['passes']))
print('duplicated copies dropped:', sum(len(r.get('dup_paths', [])) for r in runs))
print('date range', min(r['t0'] for r in R), max(r['t1'] for r in R))

cats = ['proposer', 'yield', 'longjob', 'verification', 'critic', 'diag', 'setup']


def agg(rs):
    a = collections.Counter()
    for r in rs:
        a['alive'] += r['alive']
        for c in cats: a[c] += r['tot'].get(c, 0)
        a['unattr'] += r['unattributed']
        a['passes'] += len(r['passes'])
        for p in r['passes']:
            if p['killed']:
                a['kills'] += 1; a['kill_s'] += p['active']
                a['kill_' + p['killed']] += 1; a['kills_' + p['killed']] += p['active']
            if p['outcome'].startswith('error'):
                a['errors'] += 1; a['error_s'] += p['active']
            if p['cost']:
                a['cost'] += p['cost']; a['cost_n'] += 1
            else:
                a['nocost_n'] += 1; a['nocost_s'] += p['active']
            a['in'] += p['in_tok'] + p['cr_tok'] + p['cc_tok']; a['out'] += p['out_tok']
        for v in r['verdicts']:
            a['v_' + str(v['result'])] += 1
        for t in r['attempts']:
            s = t['proposer'] + t['yield_'] + t['critic'] + t['verification'] + t['setup'] + t['diag']
            res = t['result'] or ('VFAIL' if t.get('vfail') else 'NONE')
            a['att_' + res] += 1; a['atts_' + res] += s; a['attc_' + res] += t['cost']
        a['phase_done'] += r['phase_done']
    return a


print('## by project x proposer family')
g = collections.defaultdict(list)
for r in R: g[(r['project'], r['proposer'], r['critic'])].append(r)
rows = []
for k in sorted(g, key=lambda k: -sum(r['alive'] for r in g[k])):
    a = agg(g[k])
    nv = a['v_APPROVED'] + a['v_REJECTED'] + a['v_MALFORMED']
    rows.append([k[0], k[1], k[2], len(g[k]), f1(a['alive'] / H), f1(a['proposer'] / H), f1((a['yield'] + a['longjob']) / H),
                 f1(a['verification'] / H), f2(a['critic'] / H), a['passes'], a['kills'], f1(a['kill_s'] / H), nv, a['v_APPROVED'],
                 a['v_REJECTED'], a['v_MALFORMED'], a['phase_done'], '%.0f' % a['cost'], a['cost_n']])
table(rows, ['project', 'proposer', 'critic', 'runs', 'alive h', 'proposer h', 'detached-wait h', 'orch. verification h', 'critic h',
             'passes', 'killed', 'killed h', 'verdicts', 'A', 'R', 'M', 'phases approved', 'cost $', 'passes with cost'])

print('## overall and by proposer family')
g = collections.defaultdict(list)
for r in R:
    g['ALL'].append(r); g['fam:' + r['proposer']].append(r)
    if r['project'] != 'NETOPS': g['ALL-except-NETOPS'].append(r)
    g['era:' + r['store']].append(r)
rows = []
for k in sorted(g):
    a = agg(g[k]); al = a['alive']
    rows.append([k, len(g[k]), f1(al / H)] + ['%s (%.1f%%)' % (f1(a[c] / H), 100 * a[c] / al) for c in cats] +
                ['%s (%.1f%%)' % (f1(a['unattr'] / H), 100 * a['unattr'] / al)])
table(rows, ['group', 'runs', 'alive h'] + cats + ['unattributed'])

rows = []
for k in sorted(g):
    a = agg(g[k])
    rows.append([k, a['passes'], a['kills'], f1(a['kill_s'] / H), '%.1f%%' % (100 * a['kill_s'] / max(a['proposer'], 1)),
                 a['kill_hard_cap'], f1(a['kills_hard_cap'] / H), a['kill_repeat_stall'], f1(a['kills_repeat_stall'] / H),
                 a['kill_progress_stall'], f1(a['kills_progress_stall'] / H), a['errors'], f1(a['error_s'] / H)])
table(rows, ['group', 'passes', 'killed', 'killed h', 'killed % of proposer h', 'hard_cap n', 'hard_cap h', 'repeat_stall n', 'repeat_stall h',
             'progress_stall n', 'progress_stall h', 'errors n', 'errors h'])

rows = []
for k in sorted(g):
    a = agg(g[k])
    na = sum(a[x] for x in a if x.startswith('att_'))
    sa = sum(a[x] for x in a if x.startswith('atts_'))
    rej = a['atts_REJECTED'] + a['atts_MALFORMED'] + a['atts_VFAIL']
    rows.append([k, na, a['att_APPROVED'], f1(a['atts_APPROVED'] / H), a['att_REJECTED'], f1(a['atts_REJECTED'] / H), a['att_MALFORMED'],
                 f1(a['atts_MALFORMED'] / H), a['att_VFAIL'], f1(a['atts_VFAIL'] / H), a['att_NONE'], f1(a['atts_NONE'] / H),
                 '%.1f%%' % (100 * rej / max(sa, 1)), '%.0f' % (a['attc_REJECTED'] + a['attc_MALFORMED'] + a['attc_VFAIL']), '%.0f' % a['cost']])
table(rows, ['group', 'attempts', 'approved n', 'approved h', 'rejected n', 'rejected h', 'malformed n', 'malformed h', 'verification-failed n',
             'verification-failed h', 'no verdict n', 'no verdict h', 'time in failed attempts % of attempt time', 'cost in failed attempts $', 'cost total $'])

rows = []
for k in sorted(g):
    a = agg(g[k])
    rows.append([k, a['cost_n'], '%.0f' % a['cost'], a['nocost_n'], f1(a['nocost_s'] / H), '%.0f' % (a['in'] / 1e6), '%.1f' % (a['out'] / 1e6)])
table(rows, ['group', 'passes with cost', 'cost $', 'passes without cost', 'their hours', 'input tokens M (incl. cache)', 'output tokens M'])

print('## distributions (all real runs)')
for k in ['ALL', 'ALL-except-NETOPS', 'fam:claude', 'fam:dsh', 'fam:local-backend']:
    ps = [p for r in g.get(k, []) for p in r['passes']]
    act = [p['active'] / 60 for p in ps]
    cr = [v['critic_s'] for r in g.get(k, []) for v in r['verdicts'] if v['critic_s'] > 0]
    su = [t['setup'] for r in g.get(k, []) for t in r['attempts'] if t['setup'] > 0]
    print(k, 'passes', len(ps), 'pass min median %.1f p90 %.1f max %.1f' % (pct(act, 50), pct(act, 90), max(act)),
          '| critic s n=%d median %.0f p90 %.0f max %.0f' % (len(cr), pct(cr, 50), pct(cr, 90), max(cr) if cr else 0),
          '| setup s n=%d median %.0f p90 %.0f' % (len(su), pct(su, 50), pct(su, 90)))

print('## attempts to approval per phase (per project+feature+phase, across runs)')
ph = collections.defaultdict(list)
for r in sorted(R, key=lambda r: r['t0']):
    for v in r['verdicts']:
        ph[(r['project'], r['feature'], r['path'].split('/runs/')[0], v['phase'])].append(v['result'])
napp = []; first = 0; never = 0
for k, v in ph.items():
    if 'APPROVED' in v:
        i = v.index('APPROVED') + 1; napp.append(i)
        if i == 1: first += 1
    else:
        never += 1
print('phases judged', len(ph), 'approved', len(napp), 'first-try', first, 'never approved', never,
      'attempts to approval mean %.2f median %.0f p90 %.0f max %d' % (st.mean(napp), pct(napp, 50), pct(napp, 90), max(napp)))

print('## stops and restart gaps')
c = collections.Counter(r['stop'] for r in R)
print(dict(c))
seq = collections.defaultdict(list)
for r in R: seq[r['path'].split('/runs/')[0]].append(r)
gaps = collections.defaultdict(list)
for k, v in seq.items():
    v.sort(key=lambda r: r['t0'])
    for a, b in zip(v, v[1:]):
        gaps[a['stop']].append((b['t0'] - a['t1']) / H)
rows = []
allg = []
for k, v in sorted(gaps.items(), key=lambda x: -len(x[1])):
    allg += v
    rows.append([k, len(v), f2(pct(v, 50)), f2(pct(v, 90)), f1(max(v)), f1(sum(v)), f1(sum(x for x in v if x <= 24))])
rows.append(['all', len(allg), f2(pct(allg, 50)), f2(pct(allg, 90)), f1(max(allg)), f1(sum(allg)), f1(sum(x for x in allg if x <= 24))])
table(rows, ['previous run ended with', 'restarts', 'gap median h', 'gap p90 h', 'gap max h', 'gap sum h', 'gap sum h (gaps <= 24 h only)'])
print('features with >1 run', sum(1 for v in seq.values() if len(v) > 1), 'of', len(seq), '; runs per feature median', pct([len(v) for v in seq.values()], 50), 'max', max(len(v) for v in seq.values()))
tot_alive = sum(r['alive'] for r in R) / H
print('total alive h', tot_alive, 'total gap h', sum(allg))

print('## first pass of a run (re-orientation after restart) vs other passes')
fp = [r['passes'][0]['active'] / 60 for r in R if r['resume'] not in (None, '', '0', '1') and r['passes']]
print('first pass after resume n=%d median %.1f min p90 %.1f sum %.1f h' % (len(fp), pct(fp, 50), pct(fp, 90), sum(fp) / 60))

print('## yields')
ys = [(r['project'], y) for r in R for y in r['yields']]
c = collections.Counter(); hs = collections.Counter()
for p, y in ys:
    c[(p, str(y['rc']))] += 1; hs[(p, str(y['rc']))] += y['dur'] / H
for k in sorted(c): print(k, c[k], f2(hs[k]))
```

### `features.py`

```python
#!/usr/bin/env python3
"""Per feature (one state directory = one feature): launch-to-done calendar time, alive time, gaps, phases, passes, cost.
And per-phase table for a chosen project (arg 2)."""
import json, os, sys, collections
D = os.path.dirname(os.path.abspath(__file__))
runs = json.load(open(os.path.join(D, 'runs.json')))
H = 3600.0
def pct(xs, p):
    xs = sorted(xs)
    if not xs: return float('nan')
    k = (len(xs) - 1) * p / 100.0
    f = int(k); c = min(f + 1, len(xs) - 1)
    return xs[f] + (xs[c] - xs[f]) * (k - f)
feat = collections.defaultdict(list)
for r in runs:
    if r['store'] == '.lisa' or r['proposer'] in ('stub', 'none') or not r['passes']: continue
    feat[r['path'].split('/runs/')[0]].append(r)
names = {}
rows = []
for i, (k, v) in enumerate(sorted(feat.items(), key=lambda kv: min(r['t0'] for r in kv[1]))):
    v.sort(key=lambda r: r['t0'])
    fid = '%s-F%02d' % (v[0]['project'], i + 1); names[k] = fid
    alive = sum(r['alive'] for r in v) / H
    cal = (v[-1]['t1'] - v[0]['t0']) / H
    done = v[-1]['stop'] == 'all_approved'
    ph = sum(r['phase_done'] for r in v)
    tot = v[-1]['phases_total']
    passes = sum(len(r['passes']) for r in v)
    kills = sum(1 for r in v for p in r['passes'] if p['killed'])
    nv = collections.Counter(x['result'] for r in v for x in r['verdicts'])
    cost = sum(p['cost'] or 0 for r in v for p in r['passes'])
    prop = sorted({r['proposer'] for r in v}); crit = sorted({r['critic'] for r in v})
    mode = 'reverse' if ('reverse' in k.lower() or 'reverse' in (v[0]['feature'] or '').lower() or 'as-is' in (v[0]['feature'] or '').lower()) else 'forward'
    rows.append([fid, mode, '+'.join(prop), '+'.join(crit), len(v), tot, ph, 'yes' if done else 'no', '%.1f' % cal, '%.1f' % alive, '%.1f' % (cal - alive), passes, kills,
                 nv['APPROVED'], nv['REJECTED'], nv['MALFORMED'], '%.0f' % cost, '%.2f' % (alive / ph) if ph else '-'])
hdr = ['feature', 'mode', 'proposer', 'critic', 'runs', 'phases', 'phases approved', 'finished', 'calendar h', 'alive h', 'gap h', 'passes', 'killed passes', 'A', 'R', 'M', 'recorded cost $', 'alive h per approved phase']
print('| ' + ' | '.join(hdr) + ' |'); print('|' + '---|' * len(hdr))
for r in rows: print('| ' + ' | '.join(str(x) for x in r) + ' |')
fin = [r for r in rows if r[7] == 'yes']
print('\nfinished features', len(fin), 'of', len(rows))
for lab, sel in (('finished, claude proposer', [r for r in fin if 'claude' in r[2]]), ('finished, all', fin)):
    if sel:
        print(lab, 'n=%d' % len(sel), 'calendar h median %.1f p90 %.1f | alive h median %.1f p90 %.1f | alive h per approved phase median %.2f p90 %.2f | runs per feature median %.0f max %d' % (
            pct([float(r[8]) for r in sel], 50), pct([float(r[8]) for r in sel], 90), pct([float(r[9]) for r in sel], 50), pct([float(r[9]) for r in sel], 90),
            pct([float(r[17]) for r in sel if r[17] != '-'], 50), pct([float(r[17]) for r in sel if r[17] != '-'], 90), pct([r[4] for r in sel], 50), max(r[4] for r in sel)))
with open(os.path.join(D, 'feature-aliases.tsv'), 'w') as fh:
    for k, v in names.items(): fh.write('%s\t%s\n' % (v, k))

proj = sys.argv[1] if len(sys.argv) > 1 else 'NETOPS'
print('\n## per phase,', proj)
ph = collections.defaultdict(lambda: collections.Counter())
res = collections.defaultdict(list)
for k, v in feat.items():
    if v[0]['project'] != proj: continue
    for r in v:
        for a in r['attempts']:
            key = (names[k], int(a['phase'] or 0))
            c = ph[key]
            c['attempts'] += 1
            for f in ('proposer', 'yield_', 'critic', 'verification', 'setup', 'diag'): c[f] += a[f]
            s = sum(a[f] for f in ('proposer', 'yield_', 'critic', 'verification', 'setup', 'diag'))
            resu = a['result'] or ('VFAIL' if a.get('vfail') else 'NONE')
            c['t_' + resu] += s; c['n_' + resu] += 1
            res[key].append(resu[0])
        for p in r['passes']:
            key = (names[k], int(p['phase'] or 0)); c = ph[key]
            c['passes'] += 1
            if p['killed'] == 'hard_cap': c['cap'] += 1; c['cap_s'] += p['active']
            elif p['killed']: c['stall'] += 1; c['stall_s'] += p['active']
            c['cost'] += p['cost'] or 0
            if not p['cost']: c['nocost'] += 1
            c['tok_in'] += p['in_tok'] + p['cr_tok'] + p['cc_tok']; c['tok_out'] += p['out_tok']
hdr = ['feature', 'phase', 'attempts (results in order)', 'passes', 'cap kills (h)', 'stall kills (h)', 'proposer h', 'detached wait h', 'orch. verification h', 'critic min', 'setup min',
       'time in attempts that failed h', 'time in attempts with no verdict h', 'recorded cost $', 'passes without cost', 'input tokens M', 'output tokens M']
print('| ' + ' | '.join(hdr) + ' |'); print('|' + '---|' * len(hdr))
for key in sorted(ph):
    c = ph[key]
    print('| %s | %d | %d (%s) | %d | %d (%.2f) | %d (%.2f) | %.2f | %.2f | %.2f | %.1f | %.1f | %.2f | %.2f | %.0f | %d | %.0f | %.2f |' % (
        key[0], key[1], c['attempts'], ''.join(res[key]), c['passes'], c['cap'], c['cap_s'] / H, c['stall'], c['stall_s'] / H, c['proposer'] / H, c['yield_'] / H, c['verification'] / H,
        c['critic'] / 60, c['setup'] / 60, (c['t_REJECTED'] + c['t_MALFORMED'] + c['t_VFAIL']) / H, c['t_NONE'] / H, c['cost'], c['nocost'], c['tok_in'] / 1e6, c['tok_out'] / 1e6))
```

### `inpass.py`

```python
#!/usr/bin/env python3
"""In-pass activity and orientation, from agent_tool/agent_text events only (no transcripts).
Interval between consecutive agent events inside a pass is attributed to the EARLIER event's category,
so a tool's bucket = tool run time + the model turn that follows it. ESTIMATE by construction."""
import json, os, re, sys, collections
D = os.path.dirname(os.path.abspath(__file__))
runs = json.load(open(os.path.join(D, 'runs.json')))
CUTOFF = float(sys.argv[1]) if len(sys.argv) > 1 else 9e18
H = 3600.0
READ = re.compile(r'^\s*(cd [^;&]+(;|&&)\s*)?(cat|ls|grep|rg|head|tail|find|wc|sed -n|git (log|status|diff|show)|stat|tree|jq|awk)\b')
WAIT = re.compile(r'(\bsleep \d|\buntil\b.*\bdo\b|\bwhile\b.*\bsleep\b|\bwait\b \$?\d*|tail -f)')
BOOK = re.compile(r'(PROGRESS\.md|/\.specstride/|/\.wiggum/|GATE\d+-|/gates/)')
PROBE = re.compile(r'^\s*(kubectl (get|logs|describe)|docker (ps|logs|inspect)|ps |pgrep|ss |curl )')


def cat(e):
    t = e.get('tool') or ''
    tg = str(e.get('target') or '')
    if t in ('Read', 'Grep', 'Glob', 'LS', 'NotebookRead'): return 'read'
    if t in ('Edit', 'Write', 'MultiEdit', 'NotebookEdit'):
        return 'bookkeeping' if BOOK.search(tg) else 'edit'
    if t in ('Agent', 'Task'): return 'subagent'
    if t in ('Monitor', 'ScheduleWakeup', 'TaskOutput', 'BashOutput'): return 'wait'
    if t == 'Bash':
        if WAIT.search(tg): return 'wait'
        if PROBE.search(tg): return 'probe'
        if READ.search(tg): return 'read'
        return 'exec'
    return 'other'


def pct(xs, p):
    xs = sorted(xs)
    if not xs: return float('nan')
    k = (len(xs) - 1) * p / 100.0
    f = int(k); c = min(f + 1, len(xs) - 1)
    return xs[f] + (xs[c] - xs[f]) * (k - f)


res = collections.defaultdict(lambda: dict(cat=collections.Counter(), orient=[], orient_calls=[], share=[], passes=0, hours=0.0,
                                           byout=collections.defaultdict(collections.Counter), prog=0, first3=0, noact=0))
for r in runs:
    if r['store'] == '.lisa' or r['proposer'] in ('stub', 'none') or not r['passes']:
        continue
    evs = []
    for l in open(r['path'], errors='replace'):
        if '"agent_' not in l: continue
        try: e = json.loads(l)
        except Exception: continue
        if e.get('event') not in ('agent_tool', 'agent_text', 'agent_init'): continue
        try: t = float(e['ts'])
        except Exception: continue
        if t > CUTOFF: continue
        evs.append((t, e))
    evs.sort(key=lambda x: x[0])
    i = 0
    for p in r['passes']:
        while i < len(evs) and evs[i][0] < p['start']: i += 1
        j = i
        seq = []
        while j < len(evs) and evs[j][0] <= p['end']:
            seq.append(evs[j]); j += 1
        i = j
        if not any(e['event'] == 'agent_tool' for _, e in seq):
            continue
        for key in (r['proposer'], r['proposer'] + '/' + r['project'], 'ALL'):
            g = res[key]
            g['passes'] += 1; g['hours'] += p['active'] / H
            out = p['outcome']
            prev_t = p['start']; prev_c = 'startup'
            first_action = None; calls = 0; ncall = 0; sawprog = False; prog3 = False
            for t, e in seq:
                g['cat'][prev_c] += t - prev_t
                g['byout'][out][prev_c] += t - prev_t
                if e['event'] == 'agent_tool':
                    c = cat(e); ncall += 1
                    if 'PROGRESS.md' in str(e.get('target') or ''):
                        if not sawprog and ncall <= 3: prog3 = True
                        sawprog = True
                    if first_action is None:
                        if c in ('edit', 'exec', 'subagent'):
                            first_action = t - p['start']
                        else:
                            calls += 1
                elif e['event'] == 'agent_text':
                    c = 'model'
                else:
                    c = prev_c
                prev_t, prev_c = t, c
            g['cat'][prev_c] += max(0, p['end'] - prev_t)
            g['byout'][out][prev_c] += max(0, p['end'] - prev_t)
            if sawprog: g['prog'] += 1
            if prog3: g['first3'] += 1
            if first_action is None:
                g['noact'] += 1
            else:
                g['orient'].append(first_action); g['orient_calls'].append(calls)
                if p['active'] > 0: g['share'].append(first_action / p['active'])

cats = ['model', 'exec', 'wait', 'subagent', 'edit', 'bookkeeping', 'read', 'probe', 'other', 'startup']
print('| group | passes with tool events | hours | ' + ' | '.join(c + ' %' for c in cats) + ' |')
print('|---|---|---|' + '---|' * len(cats))
for k in sorted(res, key=lambda k: -res[k]['hours']):
    g = res[k]
    if g['passes'] < 5: continue
    tot = sum(g['cat'].values()) or 1
    print('| %s | %d | %.1f | ' % (k, g['passes'], g['hours']) + ' | '.join('%.1f' % (100 * g['cat'][c] / tot) for c in cats) + ' |')
print()
print('| group | passes | passes reaching an action | min to first action median | p90 | sum h | % of pass hours | orientation calls median | p90 | share of pass median | passes touching PROGRESS.md | within first 3 calls |')
print('|---|---|---|---|---|---|---|---|---|---|---|---|')
for k in sorted(res, key=lambda k: -res[k]['hours']):
    g = res[k]
    if g['passes'] < 5: continue
    o = g['orient']
    print('| %s | %d | %d | %.1f | %.1f | %.1f | %.1f | %.0f | %.0f | %.1f%% | %d | %d |' % (
        k, g['passes'], len(o), pct(o, 50) / 60, pct(o, 90) / 60, sum(o) / H, 100 * (sum(o) / H) / max(g['hours'], 1e-9),
        pct(g['orient_calls'], 50), pct(g['orient_calls'], 90), 100 * pct(g['share'], 50), g['prog'], g['first3']))
print()
g = res['ALL']
print('by outcome (ALL): share of time per category')
for out, c in sorted(g['byout'].items(), key=lambda x: -sum(x[1].values())):
    tot = sum(c.values()) or 1
    print(out, '%.1f h' % (tot / H), {k: round(100 * v / tot, 1) for k, v in c.most_common(6)})
g = res.get('claude/NETOPS')
if g:
    print('by outcome (claude/NETOPS)')
    for out, c in sorted(g['byout'].items(), key=lambda x: -sum(x[1].values())):
        tot = sum(c.values()) or 1
        print(out, '%.1f h' % (tot / H), {k: round(100 * v / tot, 1) for k, v in c.most_common(6)})
```

### `blocked.py`

```python
#!/usr/bin/env python3
"""Passes that declared themselves blocked on a person (text heuristic over agent_text; ESTIMATE),
plus no-progress tails of runs stopped by proposer_max_iter (measured)."""
import json, re, os, sys, collections
D = os.path.dirname(os.path.abspath(__file__))
CUTOFF = float(sys.argv[1]) if len(sys.argv) > 1 else 9e18
runs = json.load(open(os.path.join(D, 'runs.json')))
PAT = re.compile(r"(still blocked|is blocked on|blocked on (a |an |the |seven |three |\w+ )?(operator|human|user|owner|decision)|decisions? (that )?only you|waiting (for|on) (the |an |a )?(operator|human|user|owner)('s)? (decision|input|answer|approval)|needs? (a|an|your|the) (operator|human|owner|user)('s)? (decision|input|approval)|operator decision)", re.I)
tot = collections.defaultdict(lambda: [0, 0.0, 0.0, 0])
rows = []
for r in runs:
    if r['store'] == '.lisa' or r['proposer'] in ('stub', 'none') or not r['passes']: continue
    txt = []
    for l in open(r['path'], errors='replace'):
        if '"agent_text"' not in l: continue
        try: e = json.loads(l)
        except Exception: continue
        t = float(e['ts'])
        if t <= CUTOFF: txt.append((t, e.get('text') or ''))
    n = 0; s = 0.0; c = 0.0
    for p in r['passes']:
        if p['outcome'] == 'evidence': continue
        ts = [x for t, x in txt if p['start'] <= t <= p['end']]
        if not ts: continue
        if PAT.search(ts[-1]) or (len(ts) > 1 and PAT.search(ts[0]) and p['active'] < 300):
            n += 1; s += p['active']; c += p['cost'] or 0
    if n:
        rows.append((r['project'], r['run_id'], r['proposer'], r['stop'], len(r['passes']), n, s / 3600, c))
    for k in ('ALL', r['project']):
        tot[k][0] += n; tot[k][1] += s / 3600; tot[k][2] += c; tot[k][3] += 1 if n else 0
print('| project | run | proposer | run ended with | passes | passes declaring a block | their hours | their recorded cost $ |')
print('|---|---|---|---|---|---|---|---|')
for x in sorted(rows, key=lambda x: -x[5]): print('| %s | %s | %s | %s | %d | %d | %.2f | %.0f |' % x)
print('ALL', tot['ALL'])
print('\nruns stopped by proposer_max_iter')
print('| project | run | proposer | passes | hours | passes with evidence | passes under 2 min | hours in passes under 2 min | recorded cost $ |')
print('|---|---|---|---|---|---|---|---|---|')
a = [0, 0.0, 0, 0.0, 0.0]
for r in runs:
    if r['stop'] != 'proposer_max_iter' or r['store'] == '.lisa': continue
    ps = r['passes']; sh = [p for p in ps if p['active'] < 120]
    c = sum(p['cost'] or 0 for p in ps)
    print('| %s | %s | %s | %d | %.2f | %d | %d | %.2f | %.0f |' % (r['project'], r['run_id'], r['proposer'], len(ps), sum(p['active'] for p in ps) / 3600,
          sum(1 for p in ps if p['outcome'] == 'evidence'), len(sh), sum(p['active'] for p in sh) / 3600, c))
    a[0] += len(ps); a[1] += sum(p['active'] for p in ps) / 3600; a[2] += len(sh); a[3] += sum(p['active'] for p in sh) / 3600; a[4] += c
print('total', a)
```

### `killcost.py`

```python
#!/usr/bin/env python3
"""Estimate the cost of NETOPS passes that recorded no cost (killed / cut), from Claude Code session transcripts.
Read-only. Transcripts: /root/.claude/projects/-root-agentic-netops-srl/*.jsonl (+ <session>/subagents/*.jsonl).
Method: sum API usage per session (deduplicated by message id), join session -> pass by start time,
fit per-token prices by least squares on passes whose cost WAS recorded, apply to passes without cost."""
import json, os, glob, sys, datetime, collections
import numpy as np
D = os.path.dirname(os.path.abspath(__file__))
TX = '/root/.claude/projects/-root-agentic-netops-srl'
CUTOFF = float(sys.argv[1]) if len(sys.argv) > 1 else 9e18
runs = [r for r in json.load(open(os.path.join(D, 'runs.json'))) if r['project'] == 'NETOPS']


def ep(s):
    return datetime.datetime.fromisoformat(s.replace('Z', '+00:00')).timestamp()


def usage(path):
    msgs = {}
    first = last = None
    entry = None
    for l in open(path, errors='replace'):
        try: e = json.loads(l)
        except Exception: continue
        ts = e.get('timestamp')
        if ts:
            t = ep(ts)
            if t > CUTOFF: continue
            first = t if first is None else min(first, t)
            last = t if last is None else max(last, t)
        if entry is None and e.get('entrypoint'): entry = e.get('entrypoint')
        if e.get('type') == 'assistant':
            m = e.get('message') or {}
            u = m.get('usage')
            if u and m.get('id'):
                msgs[m['id']] = u
    v = np.zeros(4)
    for u in msgs.values():
        v += np.array([u.get('input_tokens') or 0, u.get('cache_creation_input_tokens') or 0,
                       u.get('cache_read_input_tokens') or 0, u.get('output_tokens') or 0], dtype=float)
    return first, last, v, len(msgs), entry


sessions = []
for f in glob.glob(TX + '/*.jsonl'):
    first, last, v, n, entry = usage(f)
    if first is None or n == 0: continue
    sid = os.path.basename(f)[:-6]
    sub = np.zeros(4); nsub = 0
    for sf in glob.glob(os.path.join(TX, sid, 'subagents', '*.jsonl')):
        _, _, sv, sn, _ = usage(sf)
        sub += sv; nsub += 1
    sessions.append(dict(sid=sid, first=first, last=last, main=v, sub=sub, nsub=nsub, entry=entry))
sessions.sort(key=lambda s: s['first'])
print('sessions with usage', len(sessions), 'entrypoints', collections.Counter(s['entry'] for s in sessions))

passes = [p for r in runs for p in r['passes']]
passes.sort(key=lambda p: p['start'])
used = set(); joined = []
for p in passes:
    best = None
    for s in sessions:
        d = s['first'] - p['start']
        if -1 <= d <= 30 and s['sid'] not in used:
            if best is None or d < best[0]: best = (d, s)
    if best:
        used.add(best[1]['sid']); joined.append((p, best[1]))
print('passes', len(passes), 'joined', len(joined))

known = [(p, s) for p, s in joined if p['cost']]
unk = [(p, s) for p, s in joined if not p['cost']]
for label, tok in (('main only', lambda s: s['main']), ('main + subagents', lambda s: s['main'] + s['sub'])):
    X = np.array([tok(s) for _, s in known]); y = np.array([p['cost'] for p, _ in known])
    w, res, rk, sv = np.linalg.lstsq(X, y, rcond=None)
    pred = X @ w
    ss = 1 - ((y - pred) ** 2).sum() / ((y - y.mean()) ** 2).sum()
    print('\nfit on', label, 'n=%d' % len(known), 'USD per M tokens [input, cache write, cache read, output] =', np.round(w * 1e6, 3), 'R2=%.4f' % ss,
          'median abs err $%.2f' % np.median(np.abs(y - pred)), 'sum known $%.0f predicted $%.0f' % (y.sum(), pred.sum()))
    Xu = np.array([tok(s) for _, s in unk])
    pu = Xu @ w
    by = collections.defaultdict(lambda: [0, 0.0, 0.0, np.zeros(4)])
    for (p, s), c in zip(unk, pu):
        b = by[p['outcome']]; b[0] += 1; b[1] += c; b[2] += p['active'] / 3600; b[3] += tok(s)
    for k, b in by.items():
        print('  no-cost passes', k, 'n=%d' % b[0], 'estimated $%.0f' % b[1], 'hours %.2f' % b[2], 'tokens M [in,cw,cr,out]', np.round(b[3] / 1e6, 2))
    print('  total estimated unrecorded $%.0f' % pu.sum())
    # simple alternative: $ per active hour of known passes
rate = sum(p['cost'] for p, _ in known) / (sum(p['active'] for p, _ in known) / 3600)
print('\nalternative estimate: known-cost passes run at $%.2f per active hour; no-cost passes %.2f h -> $%.0f' % (
    rate, sum(p['active'] for p, _ in unk) / 3600, rate * sum(p['active'] for p, _ in unk) / 3600))
tm = sum(s['main'] for _, s in joined); ts = sum(s['sub'] for _, s in joined)
print('tokens, joined passes, M [in,cw,cr,out]: main', np.round(tm / 1e6, 1), 'subagents', np.round(ts / 1e6, 1))
ft = []
for p, s in joined:
    pass

# ---- constrained fit: fixed price ratios (input 1 : cache write(1h) 2 : cache read 0.1 : output 5), free scale per main / subagent
print('\n== constrained fit (price ratios fixed at 1 : 2 : 0.1 : 5; scale fitted, non-negative)')
R = np.array([1.0, 2.0, 0.1, 5.0])
from itertools import product
def nnls2(A, y):
    best = None
    for mask in product([0, 1], repeat=A.shape[1]):
        if not any(mask): continue
        idx = [i for i, m in enumerate(mask) if m]
        w, *_ = np.linalg.lstsq(A[:, idx], y, rcond=None)
        if (w < 0).any(): continue
        full = np.zeros(A.shape[1]); full[idx] = w
        err = ((A @ full - y) ** 2).sum()
        if best is None or err < best[0]: best = (err, full)
    return best[1]
A = np.array([[s['main'] @ R, s['sub'] @ R] for _, s in known]); y = np.array([p['cost'] for p, _ in known])
w = nnls2(A, y); pred = A @ w
print('scale USD per M input-equivalent tokens: main %.2f, subagents %.2f' % (w[0] * 1e6, w[1] * 1e6),
      'R2=%.4f' % (1 - ((y - pred) ** 2).sum() / ((y - y.mean()) ** 2).sum()), 'known $%.0f predicted $%.0f' % (y.sum(), pred.sum()),
      'median abs err $%.2f, p90 abs err $%.2f' % (np.median(np.abs(y - pred)), np.percentile(np.abs(y - pred), 90)))
Au = np.array([[s['main'] @ R, s['sub'] @ R] for _, s in unk]); pu = Au @ w
by = collections.defaultdict(lambda: [0, 0.0, 0.0])
for (p, s), c in zip(unk, pu):
    b = by[p['outcome']]; b[0] += 1; b[1] += c; b[2] += p['active'] / 3600
for k, b in by.items(): print('  ', k, 'n=%d' % b[0], 'estimated $%.0f' % b[1], 'hours %.2f' % b[2])
print('  total estimated unrecorded $%.0f ; recorded $%.0f ; estimated true total $%.0f' % (pu.sum(), y.sum(), pu.sum() + y.sum()))
byph = collections.Counter()
for (p, s), c in zip(unk, pu): byph[p['phase']] += c
print('  by phase', {k: round(v) for k, v in sorted(byph.items(), key=lambda x: int(x[0]))})
# leave-one-out style check: relative error of total on random halves
rng = np.random.default_rng(1); errs = []
for _ in range(200):
    idx = rng.permutation(len(y)); a, b = idx[:len(y) // 2], idx[len(y) // 2:]
    ww = nnls2(A[a], y[a]); errs.append((A[b] @ ww).sum() / y[b].sum() - 1)
print('  split-half check of total: median rel. error %.1f%%, 5th..95th pct %.1f%% .. %.1f%%' % (100 * np.median(errs), 100 * np.percentile(errs, 5), 100 * np.percentile(errs, 95)))
# first-turn context per pass
ft = []
for p, s in joined:
    for l in open(os.path.join(TX, s['sid'] + '.jsonl'), errors='replace'):
        if '"type":"assistant"' not in l and '"type": "assistant"' not in l: continue
        u = (json.loads(l).get('message') or {}).get('usage') or {}
        ft.append(((u.get('input_tokens') or 0) + (u.get('cache_creation_input_tokens') or 0) + (u.get('cache_read_input_tokens') or 0), p['phase'], p['start']))
        break
v = sorted(x[0] for x in ft)
print('first-turn context tokens n=%d median %.0f p90 %.0f max %.0f sum M %.1f' % (len(v), np.median(v), np.percentile(v, 90), max(v), sum(v) / 1e6))
new = [x[0] for x in ft if x[2] >= 1790486835]
print('run 6 only (since relaunch): n=%d median %.0f' % (len(new), np.median(new) if new else 0))
```

### `t151.py`

```python
#!/usr/bin/env python3
"""When did each T151 acceptance run first fail, and how long did it keep running afterwards?
Read-only. Sources: bin/acceptance/p15-t151r*/{plan.tsv,results.tsv} and the evidence base of each run
(.evidence/*/acceptance-*-p15-t151r*/<scope>/<files>), using file modification times."""
import os, glob, re, datetime
ROOT = '/root/agentic-netops-srl'
fmt = lambda t: datetime.datetime.fromtimestamp(t).strftime('%m-%d %H:%M')
tot_after = tot_run = 0.0
print('| run | start | end | duration h | result rows | first failing row (scope step rc) | row index / rows | first failure known at | h before | h after first failure | failing rows |')
print('|---|---|---|---|---|---|---|---|---|---|---|')
for d in sorted(glob.glob(ROOT + '/bin/acceptance/p15-t151r*'), key=lambda p: int(re.search(r'r(\d+)$', p).group(1))):
    name = os.path.basename(d)
    plan, res = d + '/plan.tsv', d + '/results.tsv'
    if not os.path.exists(res):
        print('| %s | %s | - | - | no results.tsv | - | - | - | - | - | - |' % (name, fmt(os.path.getmtime(d)))); continue
    start = os.path.getmtime(plan) if os.path.exists(plan) else os.path.getmtime(d)
    end = os.path.getmtime(res)
    rows = [l.rstrip('\n').split('\t') for l in open(res) if l.strip()]
    fails = [(i, r) for i, r in enumerate(rows) if len(r) >= 3 and r[2].strip() not in ('0', '')]
    bases = glob.glob(ROOT + '/.evidence/*/acceptance-*-' + name)
    known = None; src = ''
    if fails and bases:
        scope, step = fails[0][1][0], fails[0][1][1]
        cands = []
        for b in bases:
            for f in glob.glob(os.path.join(b, scope, '*')) + glob.glob(os.path.join(b, scope + '.' + step, '*')) + glob.glob(os.path.join(b, scope + '.' + step)):
                if step in os.path.basename(f) or f.endswith(scope + '.' + step):
                    m = os.path.getmtime(f)
                    if start - 60 <= m <= end + 60: cands.append(m)
        if cands:
            known = max(cands); src = 'mtime of step files'
    dur = (end - start) / 3600
    if fails and known is None:
        # fall back to row proportion (estimate)
        known = start + (end - start) * (fails[0][0] + 1) / len(rows); src = 'ESTIMATE by row position'
    if fails:
        after = (end - known) / 3600
        tot_after += after
        f = fails[0][1]
        print('| %s | %s | %s | %.2f | %d | %s %s %s | %d / %d | %s (%s) | %.2f | %.2f | %d |' % (
            name, fmt(start), fmt(end), dur, len(rows), f[0], f[1], f[2], fails[0][0] + 1, len(rows), fmt(known), src,
            (known - start) / 3600, after, len(fails)))
    else:
        print('| %s | %s | %s | %.2f | %d | none | - | - | - | - | 0 |' % (name, fmt(start), fmt(end), dur, len(rows)))
    tot_run += dur
print('\ntotal run hours (runs with results.tsv) %.2f ; hours after the first failing step was known %.2f' % (tot_run, tot_after))
```
