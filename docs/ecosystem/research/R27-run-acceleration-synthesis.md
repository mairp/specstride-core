# R27 — Run acceleration synthesis

Written 2026-09-29, 04:40 to 05:10 (+04:00). Read-only work. No paid model call, no harness CLI invoked,
no subagent. Scratch: `/tmp/specstride-research/R27/calc.py` (arithmetic over R21's tables; it reads one
report file and writes nothing).

How to read the tags. `verified-local` means: read by me at the cited line of a file on this machine. For
a figure taken from another research report the citation is `R<n>:<line>`; the measurement itself belongs
to that report. `inferred` names the facts it rests on. Savings carry a second label, as the assignment
requires: **[M]** measured, **[E]** estimated (a method exists), **[I]** inferred (reasoned, no method
run).

Verifiers. Both verifier reports appeared while this report was being written and were read in full.
- `R21v-baseline-recompute.md`: every headline figure used here reproduces within 0.1 h (R21v:707-732).
  Six figures are corrected and the corrected ones are used below (F-1).
- `R23v-gate-red-team.md`: 24 findings, 4 of which break gate integrity; rules IR-31 to IR-57;
  amendments to IR-03 and IR-10; 13 owner items. Where a finding and R23 disagree the finding stands.
  Every proposed rule is adopted or answered in the table "R23v rules" below.

Names. `NETOPS` is the reference run in `/root/agentic-netops-srl`. `P07` is R21's alias for the second
Claude sample. "Layer" means the micro-loop layer. "Parity configuration" means every switch in this
report off, which is what the parity oracle runs. "Engaged" means that at least one valid checkpoint has
been accepted in the current attempt.

## Prior art consulted

| File | Read | Reused, extended or contradicted |
|---|---|---|
| `docs/ecosystem/research/BRIEF-COMMON.md` | in full | Template, tags, safety rules. |
| `prompts/specstride-ecosystem.md` §0 to §6 | in full | Decisions 20–23 and the aims of §0 are the fixed frame. The scope line of feature 115 (`:488`) places fail-fast inside the micro-loop feature, which bears on DP-R27-1. |
| `R21-time-use-baseline.md` | in full, scripts included | **Reused** as the baseline. **Extended**: the Claude baseline is split into two strata (F-1); P07 totals and sample sizes are computed from its Appendix B (F-2, F-5). |
| `R21v-baseline-recompute.md` | in full | **Reused**: its corrected figures win. Its F-4 (the Claude baseline is a mixture that no run resembles) is the reason for the two strata. Its F-9 (the reference run has no recorded code version) becomes a rule of the paired-run design. |
| `R22-loop-design-survey.md` | in full | **Reused**: the definition, the cap table, the experiment verdicts, the tail analysis. **Extended**: a cycle cap and a check-time budget that R22 does not give. **Contradicted**: its 20-minute proposal cap cannot apply before the layer is engaged (D-05) and works against the kill target (D-06); its rule that a protected-path breach switches the layer off is overruled by R23v (D-18). |
| `R23-inner-checks-gate-integrity.md` | in full | **Reused**: unit by checkpoint, per-phase manifest, protected set, resume states, `[LOOP]` line, fail-fast mechanisms, IR-01 to IR-30 as amended by R23v. **Contradicted** by R23v in the places listed under "R23v rules". |
| `R23v-gate-red-team.md` | in full | **Reused** whole: IR-31 to IR-57 and both amendments are adopted, three of them with a stated limit. **Extended**: three rules of this report, IR-58 to IR-60. |
| `R24-warm-start-context-carry-over.md` | in full | **Reused**: what each scope inherits, the ten drop rules, the file formats, the build order. **Contradicted**: its ledger location (D-10); its checkpoint refs inside the project's repository (D-04, R23v O-13). |
| `R25-routing-cascades.md` | in full | **Reused**: the pure router, the three decision points, the escalation target rules. **Contradicted**: its repair ladder adds proposals beyond R22's cap (D-03); it reverts the tree (D-04); its per-unit check selection (D-07); its trigger needs parsed output (D-19); its quota rule is superseded by DP-032. |
| `R26-parallel-execution.md` | in full | **Reused** whole. No contradiction. |
| `R12-memory-compression.md` | in full | **Reused**: the index and ledger as a deterministic projection; the experiment's stage 1. **Corrected**: its token estimate uses 4 bytes per token against R17's measured 2.8 (D-15). |
| `docs/ecosystem/DECISIONS-PENDING.md` DP-019, DP-031 to DP-041 | in full | The defaults this design proceeds on. DP-031 and DP-041 are refined (D-03, D-09). |
| `prompts/analysis/A6-micro-loop-survey.md` §10, §11 (`:334-403`) | sections | Source of the disagreements between A6 and decision 21. Its overhead budget of 15 % (`:361`) is adopted as a cap. |
| `prompts/analysis/A8-micro-loops-and-parity.md` §5–§9 (`:327-505`) | sections | **Reused**: success criteria MS-1 to MS-7 as the start of the decision rules. **Extended** with power arithmetic (F-5). |
| `prompts/analysis/A7-local-loop-prior-art.md` `:42`, `:221` | lines | Within-phase sd of log cost 0.55–0.74. |
| `R14-quotas-cost-observability.md` `:268-324` | catalogue rows | Event names and EV-03, EV-16, EV-17, the cost-accounting precondition. |
| `R17-context-efficiency-runtime-language.md` `:55-66` | lines | 2.8 bytes per token. |

## Questions answered

**Q1. What is the micro-loop layer and what are its defaults?**
Section "The reconciled design" (D1.1 to D1.13). In one paragraph: inside one phase attempt the proposer
works one declared unit (it names task IDs in a checkpoint file and ends its pass); the runtime validates
the claim and runs a per-phase set of deterministic commands that was frozen at launch, taking a
fingerprint of the tree before and after; the result is keep, repair or unresolved. At most 2 repairs per
task, the second in a fresh session and on a stronger tier where one exists. Two unresolved units switch
the layer off for the attempt and the classic loop carries on from the tree, which the runtime never
resets and never commits inside an attempt. The critic receives results per command and tree, with the
proposer's task declaration marked as a declaration, and nothing about how the results came to be. The
layer is on only in a run whose verification gate executes. Every other acceleration technique has its
own switch.

**Q2. Where do the reports disagree, and how is each disagreement resolved?**
Twenty disagreements, D-01 to D-20, in the table of that name; the nine contradictions R23v lists (five
between R25 and R23, four between R11 and R23) are mapped to them in a second table.

**Q3. How do the techniques rank by saving and by risk?**
Table F-3. Against the Claude-proposer baseline (253.9 h alive): fail-fast 29.3 h, 11.5 %, as a ceiling
[M]; halving killed-pass time 16.2 h, 6.4 % [I]; rework caught inside the attempt 7–16 h, 2.7–6.2 % [I];
concurrent verification commands 2–4 % [I]; session continuation 1.5–2.4 h, 0.6–0.9 % [E]; parallel
agents 0 h of the waiting [M]; the index, a cache-stable start and escalation claim no hours.

**Q4. Are decision 21's targets reachable?**
- **Elapsed time down 25 %.** For the layer alone: no, on any fixture mix the evidence covers. Its gross
  ceiling is 10–20 % of alive time on ordinary phases (R22:233) and it pays for its own checks. For the
  whole default configuration against the parity configuration: reachable only on a mix in which long
  verification jobs that fail carry about half the alive time or more, and there only near the ceiling
  (central estimate 10–23 %, ceiling 32 %). On ordinary phases the central estimate is 1–15 %. On a mix
  weighted like the Claude baseline (half and half) the central estimate is 6–19 % and the ceiling 26 %.
- **Killed passes and iteration-exhaustion stops down 50 %.** Plausible for hard-cap kills, unproven,
  and at risk from the layer's own 20-minute cap, whose hits count as kills. Iteration exhaustion in the
  Claude baseline is a blocked-on-human problem; the blocked signal addresses it, the layer does not.
- **Gate quality no worse.** R23v shows that R23's rules as written did not guarantee it (4 breaks).
  With IR-31 to IR-57 it is reachable where the harness has a sandbox; on a harness without one,
  protection is detection (DP-040, R23v O-3). Anchoring of the critic is untested.
- **Cost no worse.** Not assured. One unit per pass multiplies cold starts of about 108 k tokens, so
  the layer needs the obligations index and a cache-stable prompt start to stay level. It cannot be
  judged until cost is counted for every pass.

**Q5. What enters Wave 1 on by default, what is an option, what goes to the roadmap?** Section
"Recommendation", tables W1-ON, W1-OPT and ROADMAP.

**Q6. Which experiments decide whether micro-loops stay the default?** X0 to X12 in section
"Experiments", with the precondition, the paired-run design, the window, the ablation arms and the rule
for immediate revert.

## Findings

### F-1 The baseline in two strata `verified-local`; the subtraction is confirmed by R21v:775-782

| Quantity | Claude baseline | NETOPS (stratum LONG) | Claude without NETOPS (stratum ORD) | P07 alone | Source |
|---|---|---|---|---|---|
| Alive h | 253.9 | 127.9 | 126.0 | 100.1 | R21:70, R21:73, R21:381-383; R21v:718, R21v:775 |
| Proposer h | 130.5 | 44.1 | 86.4 (68.6 %) | 73.1 | R21v:777; P07 from `calc.py` |
| Detached wait h | 82.0 | 82.0 | 0 | 0 | R21v:778 |
| Orchestrator verification h | 28.5 | 0 | 28.5 (22.6 %) | 20.9 | R21v:779; `calc.py` |
| Killed passes, n / h | 37 / 32.5 | 21 / 17.9 | 16 / 14.6 | 16 / 14.6 | R21v:723-726, R21v:781 |
| Attempts rejected by the critic, h | 85.6 | 49.7 | 35.9 | — | R21:93, R21:96 |
| Attempts that failed the verification gate, n / h | 19 / 21.1 | 0 | 19 / 21.1 | 12 attempts in 9 phases | R21:93; `calc.py` |
| Job time after the first failed step, h | 29.3 | 29.3 | 0 | 0 | R21v:731-732 |

Corrected figures from R21v that this report uses `verified-local`:

| Figure | R21 | Stands as | Source |
|---|---|---|---|
| Time to first action, Claude passes | 6.7 h, 5.2 % of pass time | 4.4–6.7 h, 3.3–5.2 % | R21v:843 |
| Failing rows at the end of acceptance runs r5, r7, r8, r9, r10 | 27, 5, 58, 51, 3 | 9, 5, 14, 7, 3; the rest were skipped | R21v:733 |
| Unrecorded cost, reference run | $590, $440–$760 | $480–$600; true spend $1,000–$1,100 | R21v:827 |
| Passes without any recorded cost | 1,152 (55 %) | 1,117 (53 %) | R21v:845 |
| Passes that declared a block | 76 passes, 3.57 h | 47–76 passes, 3.6–5.5 h; the count is not a measurement | R21v:829, R21v:847 |
| Glob expansion in the critic snapshot | a defect to fix | fixed at the baseline; the saving is taken and must not be counted | R21v:809 |

Three consequences `inferred`:

1. The shares 51 % proposer, 32 % wait, 11 % verification describe a mixture that no run resembles
   (R21v:784). Savings are therefore stated per stratum, and the mix is an explicit choice (DP-R27-2).
2. NETOPS's 49.7 h of failed attempts is 45.05 h of one phase-15 attempt, most of it waiting (R21:131,
   R21v:786). The failed-attempt pool and the wait pool overlap there and are not added.
3. The reference run used verification mode `plan` (R23:131-133), in which the gate executes nothing.
   Under IR-34 the layer would have been off for that run. The LONG stratum's layer saving applies only
   to runs whose gate executes.

### F-2 P07 recomputed from Appendix B `verified-local` (`python3 /tmp/specstride-research/R27/calc.py`)

47 phases, 109 attempts, 159 passes; attempt results A 47, R 27, N 20, V 12, M 3; proposer 73.1 h,
verification 20.9 h, critic 1.85 h, setup 1.86 h; failed-attempt time 55.4 h; killed-pass time 14.6 h;
recorded cost $1,342. The median phase takes 1.15 h, the mean 2.08 h; the standard deviation of log phase
time is 0.77 over all phases and 0.40 over the 23 first-attempt phases. One verification gate run takes
11.5 min on average (20.9 h over 109 attempts). These match R22:140-150. R22 gives P07's alive time as
99.1 h (R22:151); Appendix A sums to 100.1 h. The difference changes nothing.

### F-3 Ranking of techniques by saving and by risk

Pools, named so that nothing is counted twice: **W** detached waits (82.0 h); **K** killed passes
(32.5 h); **V** attempts that failed the verification gate (21.1 h); **R** attempts the critic rejected,
stratum ORD only (35.9 h); **G** orchestrator verification time (28.5 h); **C** cold-start orientation
(4.4–6.7 h); **P** proposer time as a whole (130.5 h); **T** tokens and cost, no hours; **X** calendar
gaps between runs, outside alive time (114–119 h in gaps of 24 h or less, whole population, R21:209,
R21v:377). K lies inside P; V and R contain part of K. Percentages are of the Claude baseline's 253.9 h
alive unless a stratum is named.

| # | Technique | Pool | Ceiling | Central estimate | Label | Risk | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | Fail-fast: first-failure predicate on a wait | W | 29.3 h; 11.5 %; 22.9 % of LONG; 0 of ORD | 14.7–23.4 h (50–80 % of the ceiling); 11.5–18.3 % of LONG | ceiling [M], central [I] | **Low to medium.** The runs that went on found 2 to 13 further failing rows each, which stopping forfeits; a job the proposer started is never stopped by the runtime (IR-51); two polls must agree; a stopped job can leave a lab in a bad state (R23v:292-295) | R21v:731-733; R23:314-319 |
| 2 | Micro-loop units: a pass ends at each checkpoint | K | 16.2 h if killed time is halved; 6.4 %; 7.0 % of LONG; 5.8 % of ORD | 6–10 h; 2.5–4 %, because killed passes leave their files (R24:53) and 35–41 % of their time was waiting (R24:130, R21:241) | [I] | **Medium.** More passes, so more cold starts; the layer's own time caps end passes too | R21v:723; R22:151 |
| 3 | Inner checks and the closing check catch rework inside the attempt | V, and the catchable part of R | R22's ceiling: 54 h, 21 %, if every failed attempt were catchable and its redo halved | 7–16 h; 2.7–6.2 %; 5.5–12.5 % of ORD. Method: 25–50 % of V plus 10–30 % of R at half the redo | [I]; the catchable share of R is unknown until X1 | **Medium to high.** R23v's four breaks show how a `pass` can be wrong; a check can pass without testing the unit (R22:122); anchoring | R22:151; R23:328; R23v:38-112 |
| 4 | Cost of techniques 2 and 3: inner check time, two fingerprints per check, executable and toolchain verification | P | Capped by design at 15 % of attempt time (D1.5): at most about 10 % of ORD alive | 3–10 % of ORD. A cost, not a saving | [I]; no check duration is on record (R21 gap 19, R23:131-136, R23v:469) | — | R22:152; F-2 |
| 5 | Step runner with resume from the failed step | W, the part before the first failure | 13.6 h; 5.4 %; 10.6 % of LONG | Unknown; applies only to runs that are not the evidence run, and only where steps are declared as fixed argument lists (2 of 47 command texts in NETOPS, R23:117-118) | [I] | **Medium.** A resumed run is `partial` and never evidence (IR-30); a proposer script that resumes by itself stitches a result file (R23v:288-291) | R23:318 |
| 6 | Concurrent independent verification commands | G | 2–4 % | 1–2 %; 0 of LONG | [I] | **Low** when write scopes are declared | R26:108, R26:142 |
| 7 | Session continuation within an attempt | C | 1.5–2.4 h; 0.6–0.9 %; 0.6 % of LONG | About half the ceiling | [E] | **Medium.** Costs more tokens after 24–86 turns; carries failed reasoning | R24:101-105, R24:119; R21v:843 |
| 8 | Runtime handoff and ledger | C | Under 1 % | Under 1 % | [E] | **Low.** | R24:223 |
| 9 | Obligations index | T | 0 h. First-turn tokens down by at least 40 %; 25–30 % of pass cost | 0 h | [E] for tokens | **Low to medium.** The index hides a text the pass needed; the gate catches it at the cost of a rejection (R12:305) | R12:62-69; R24:126 |
| 10 | Cache-stable fresh start | T | 0 h. 12–20 % of pass cost if the cause of the misses is confirmed | 0 h | [E], mechanism `unverified` | **Low.** | R24:80, R24:125 |
| 11 | Model-tier escalation after a deterministic failure | V, the part base repairs do not fix | A fraction of 21.1 h; possibly 0 where the base is already the top tier | 0 h claimed | [I] | **Medium.** Adds spend on a dearer tier; collision with a critic-class model (IR-47) | R25:93-95, R25:263 |
| 12 | Polite stop (SIGINT first) | K | No hours claimed | — | [I] | **Low.** | R24:180 |
| 13 | Blocked-on-human signal (owned by R14, EV-06) | P; and the iteration-exhaustion target | 3.6–5.5 h whole population; 0.5–2.1 % of LONG | Same | [E]; the pass count is unstable (R21v:829) | **Low.** | R21:184-196 |
| 14 | Automatic relaunch (owned by feature 107) | X | Calendar time only: NETOPS 61.4 h of 189.2 h calendar | Unknown; part of each gap is a person deciding | [M] pool, [I] saving | **Low.** | R21:384; R21v:377 |
| 15 | Critic snapshot expands globs | — | 0: already at the baseline | 0 | [M] | None | R21v:809 |
| 16 | Parallel `[P]` tasks in worktrees | P | 7.8–11.9 % | 4–6 %, `unverified` | [I] | **High.** | R26:47, R26:139 |
| 17 | Parallel independent phases | P | 3.5–5.2 % of LONG | Below 3.5 %; blocked by one lab | [I] | **High.** | R26:57 |
| 18 | Overlap a detached wait with other work | W | 0 h | 0 h | [M] | — | R26:112 |
| 19 | Selection: N backends on one phase | P | 1.2–1.3 times faster at 1.5–1.6 times the cost | Lower | [I] | **High** on cost | R26:102 |
| 20 | Attempt-level tier bump after K rejections | R | The tail: 8 P07 phases hold 40.4 h of failed-attempt time | Unknown | [I] | **Medium to high.** Touches the classic loop (DP-033) | R22:148; R25:94 |

Additivity. Techniques 1, 5 and 18 draw on W; 1 and 5 are disjoint (after and before the first failure).
Techniques 2 and 3 draw on K, V and R, which overlap; their central estimates count the killed time
inside failed attempts once, under 2. Technique 4 is subtracted. Techniques 6 to 8 draw on G and C and
add to the rest. Techniques 9 to 12 claim no hours.

### F-4 What the combination reaches `inferred` from F-1 and F-3

Default configuration against parity configuration, share of alive time:

| Fixture stratum | Central estimate | Ceiling | What carries it |
|---|---|---|---|
| LONG, gate executing | 10–23 % | 32 % (22.9 + 7.0 + 2.1) | Fail-fast. The step runner (option) adds up to 10.6 points to the ceiling |
| LONG, verification mode `plan` or `off`, as the reference run was | 9–20 % | 25 % (22.9 + 2.1) | Fail-fast alone; the layer is off (IR-34) |
| ORD | 1–15 % | 20 % | Rework caught early and fewer kills, less check overhead |
| Mixed 50 : 50 by alive time | 6–19 % | 26 % | Both |

The layer alone against the classic loop with every other switch on: ORD 0–12 %, LONG 0–5 %. Fail-fast
is in both arms of that comparison, so only techniques 2 to 4 differ.

The 50 % cut in killed passes. Hard-cap kills are 23 of the 37 (R21v:724). A pass that ends at a
checkpoint after one task cannot run for an hour, so the cut is plausible for them. Against it: at
NETOPS's all-in pace 4 of 15 phases average more than 20 minutes per task (26, 21, 25.5 and 46 minutes,
R22:139), so the 20-minute cap would end many passes, and each such end is a pass killed by a time limit.

The 50 % cut in iteration-exhaustion stops. 14 of 172 runs (R21v:747). Of the three such runs with a
Claude proposer that both reports list, 39 to 73 of 102 passes declared a block, by pattern (R21:188-190,
R21v:690-693). Iteration give-back does nothing for them (R23:331).

### F-5 Sample sizes `inferred`

From the within-phase sd of log cost 0.55–0.74 (A7:42), used as a stand-in for elapsed time; one-sided
5 %, power 80 %, paired phases with correlation 0 to 0.5 (`calc.py`):

| True effect | Pairs needed |
|---|---|
| 25 % | 23–82 |
| 15 % | 71–257 |
| 10 % | 169–611 |

A window of 48 paired phases can confirm a 25 % effect. It cannot tell a 10 % effect from none. The
layer's own expected effect (0–12 %) is below what phase-level paired runs resolve, which is why X1, X2
and X10 are built on replays, units and counters.

### The reconciled design (D1)

Each item is `inferred` from the cited lines and the decisions. Numeric defaults have **low confidence**
throughout (R22:212); they are starting values for X7 and X8.

**D1.1 Switches.** One engine. Every technique has its own switch. The parity oracle runs with all of
them off; the inertness suite turns on `loop.strategy` only. Rests on decision 21's inertness clause and
IR-52: nothing else may ride on the layer's switch. Names are proposals; R16 owns the schema.

| Switch | Default | Under the oracle |
|---|---|---|
| `loop.strategy: micro \| classic` | `micro`, and `classic` with an announcement in any run whose gate does not execute (IR-34) | `classic` |
| `loop.micro.closing_check` | on | off |
| `loop.escalation` | on (DP-031) | off |
| `verification.failfast` | on | off |
| `verification.step_runner`, `verification.parallelism` | off, 1 | off |
| `carry.ledger_handoff`, `carry.index`, `carry.continuation`, `carry.polite_stop` | on | off |
| Integrity rules that are not part of the layer (IR-31 at the gate and at grounding, IR-33, IR-45, IR-54, the fingerprint in the approval record) | on | each has its own register row (IR-52) |
| Counts survive a resume (decision 23) | on | mapped by the oracle (DP-037) |

**D1.2 Unit of work.** A unit is declared by the proposer in a checkpoint that names one or more task IDs
of the current phase (criterion indexes for the native and openspec formats). The prompt asks for one
task per unit, sized at 5–15 minutes of agent time, and allows a group when the tasks cannot be checked
apart (R23:34-40; R22:214). The runtime reads only the IDs and a bounded note. The checkpoint must be a
regular file in the outbox, newer than the pass, read after the pass exited, opened without following
links; it is moved into the control plane when read (IR-09, IR-55, IR-45). IDs are validated against the
task list as read at launch (IR-56). A checkpoint is refused if the pass was killed, an ID is foreign, or
a yield was written in the same pass.

**D1.3 Level.** L1 (the pass ends at the checkpoint) is the default on every harness, tested or
discovered. L3 (session continuation) is added where a tested adapter declares resume by ID. L2 (a check
tool inside the pass) is not in Wave 1 (D-02).

**D1.4 Check set.** One manifest per phase, derived at launch from the sources the verification gate
uses, stored in the control plane with its hash, verified before every check (IR-08). Each executable is
resolved at launch to an absolute path with size and hash; `PATH` is the launch-time value; known cache
locations are disabled or protected (IR-36, IR-37). The router orders and excludes among manifest
entries, adds none and builds no argument list (IR-53). Every command of the inner set runs in every
check; a check does not stop at a failure (IR-03 as amended, read strictly). Deterministic commands only.
Before a check the runtime ends every process of the pass it can identify, except a job held by an
accepted yield (IR-32), and it takes the fingerprint before and after (IR-31). The fingerprint's scope is
defined in the specification (IR-35). Checks run at the proposer's containment level or stricter (IR-10
as amended).

**D1.5 Caps.** All inner; none touches iterations, rejects, the MALFORMED limit or the consecutive
breakers (IR-06, IR-48).

| Parameter | Default | From | Note |
|---|---|---|---|
| Repairs | 2 per task ID (three proposals); a unit's count is the highest among its tasks | R22:220; IR-50 d | Regrouping tasks does not reset a count. Repair 1 may continue the session. Repair 2 is always a fresh session with a runtime-built note, on the next tier if escalation applies |
| Escalations | 1 per task ID, 2 per attempt | DP-031; R25:214 | Inside the 2 repairs, never in addition (D-03) |
| Time per proposal | 20 min | R22:223 | Only once the layer is engaged. Until then the classic pass cap applies (IR-58) |
| Time per unit | 30 min, proposals, repairs and checks together | R22:224 | |
| Time per check command | 5 min | R22:225 | A command that exceeds it is excluded for the phase with the reason `slow`; the result reads `unchecked`, not `fail`. Measured durations are kept per phase shape |
| Inner check time per attempt | 15 % of the attempt's elapsed time, tested from the third cycle | A6:361 | New in this report. On breach the slowest command is excluded with the reason `budget` |
| Cycles per attempt | tasks in the phase + 6, at least 12 | A8:334; IR-23 needs a bound | New in this report |
| Unresolved units before the layer goes off | 2 | R22:226 | Also after 2 consecutive `unchecked` units when the inner set has become empty (D-13). A tainted check does not switch the layer off (IR-53) |
| Flaky check | One re-run; a flip excludes the command for the attempt | R22:227; IR-14 | Both observed results are stated (IR-40). It still runs at the gate |
| Interrupted check | Run again; the second interruption of the same check counts as a cycle | IR-50 a | |
| Continued passes per attempt | 3, and the context-fill rule | R24:171, R24:166 | D-14 |

Pass index, yield index, cycle count, per-task counts, escalations used and the breakers are in the
ledger and continue after a resume or relaunch (decision 23, IR-26, IR-50 b). The reset flag is accepted
from the command line only and is never replayed (IR-50 c).

**D1.6 Keep, repair, unresolved.**

| Check result | Action |
|---|---|
| Every command exits 0, fingerprints equal before and after, no condition | **Keep.** A ledger record bound to the tree fingerprint. No commit, no ref, nothing written to the project's repository (IR-60, R23v O-13) |
| A command fails, or the result carries `tainted` or `cached`; repairs remain | **Repair.** The proposer gets the output of the check on the current tree, never an earlier trace (R22:121), with the per-run marker token of IR-20. For a taint it is told which protected path changed |
| Same failure signature as before and the same tree fingerprint | The continued session is dropped; go to the fresh-session repair. The signature is the ordered list of failed command IDs with exit codes; no output is parsed (IR-53) |
| Same signature on two consecutive proposals, tier ladder declared, caps and budget allow, target equals no critic-class model resolved for the run (IR-47), and the failure is not a taint or another integrity event | The fresh-session repair runs on the next tier (R25:208-214) |
| Repairs spent or the unit cap hit | **Unresolved.** The tree stays as it is (IR-60) |
| Two unresolved units; a cap spent; a check that cannot start; an integrity event other than taint (invalid ledger, manifest mismatch, phase-entry mismatch) | **Layer off for the attempt.** The classic loop carries on. No exit code, no stop reason (IR-07). The event is a row in the critic's fact block (IR-42) |

Decision 21's word "escalate" covers the last two rows. Moving to a stronger tier is a kind of repair.

**D1.7 Closing check.** When evidence appears and the layer is engaged, the runtime runs the inner set on
the final tree, unless the last check already passed on the same fingerprint. A failure returns the
proposer to work at most twice and only while cycles remain. From the moment evidence exists no limit or
breaker of the proposer loop may stop the run: if one fires during such a repair, the repair ends and the
attempt goes to the gate. The evidence set aside is kept in the control plane with its hash; the gate
takes the newer of it and the proposer's rewritten evidence; if the tree changed and the evidence did
not, the critic is told that the evidence predates the tree (IR-05, IR-49, DP-041). When the layer is not
engaged the closing check does not run (IR-52, D-09). The verification gate then runs in full, never
stops at a failed command, and reuses nothing (IR-03).

**D1.8 Fail-fast for long verification jobs.** Independent of the layer.
- *First-failure predicate*, on by default. A yield may declare
  `resume_when: {kind: "first_failure", path, pattern}` and `on_first_failure: stop | continue-and-notify`.
  The predicate reads only whole lines appended to the same file after the job started and must match on
  two successive polls. The runtime stops a job only if it launched the job and the yield declared
  `stop`; it never stops a job in `adopt` mode; a stop is a signal to the process group with a grace
  period, and an event (IR-51, R23v O-11). In every other case the wait ends and the resume prompt says
  that the job is still running. The file's content is a claim and never a check result (IR-29). The
  critic is told, without counts, when a cited result file belongs to a job that was stopped.
- *Step runner*, option. Steps declared as fixed argument lists are run by the runtime, which stops at
  the first failed required step and can resume from it. A resumed run is `partial` and never evidence
  (IR-30).
- Events: `job.started`, `job.step`, `job.first_failure`, `job.ended{msAfterFirstFailure}` (R14:273).

**D1.9 Integrity.** IR-01 to IR-30 as amended, IR-31 to IR-57 (table "R23v rules"), and three rules of
this report:
- IR-58. Until the layer is engaged in an attempt, no pass timeout and no runtime command differs from
  the classic loop. Extends IR-52, which names prompts and executions and not timeouts.
- IR-59. Grounding refuses the event stream as it refuses the control plane. Extends IR-45: `microloop.*`
  and `route.decided` events hold the history that decision 21 withholds.
- IR-60. The runtime never resets, cleans, checks out or commits the working tree inside an attempt, and
  writes nothing under the project's `.git` except the commit at approval that exists today.

**D1.10 Carry-over.**

| Item | Rule | Source |
|---|---|---|
| Ledger | One, in the control plane, append-only, chained, signed with a key that is not the approval key (IR-57). R24's fields (`pass_id`, `attempt_id`, `tree_hash`, check durations, `session_id`) join R23's record. With the layer off it has one record per phase attempt | R23:382; R24:194; D-10 |
| Handoff | At most 6 KB, written by the runtime at every pass start, never appended, never read back by the runtime; carries the tree fingerprint it was built on and the line "if this disagrees with the tree, the tree wins". Refused by grounding (IR-45) | R24:196 |
| `PROGRESS.md` | The proposer's notebook; no longer the required first read | R24:198 |
| Session | New attempt, critic, relaunch, watchdog kill, second repair, escalation, configuration change: always fresh. Otherwise continued under R24's drop rules | decision 22; R24:163-172; DP-036 |
| Prompt start | Stable material first, volatile last, byte-stable within an attempt. Whether to switch off the harness's git snapshot waits for X4 | R24:80 |
| Killed pass | SIGINT before SIGTERM with a grace period; the next handoff names the unit that was in progress | R24:180-184 |

**D1.11 Obligations index.** The "Inherited obligations" block becomes an index: ID, a title cut to a
fixed length, the path of the full text. It is a pure function of the verification plan; a test
regenerates and compares it. The proposer's prompt only; the critic's copy is unchanged (R12:226-232,
DP-019). The assembler budgets the whole prompt.

**D1.12 What the critic sees.** A fact block built by the runtime from the control plane, present only
when at least one unit was declared in the attempt (IR-52):

| Included | Rule |
|---|---|
| Manifest hash and the command list | IR-08 |
| Per unit (ID kept, R23v O-8) and per command: the exit result, and in separate columns each condition: `tainted`, `flaky` with both observed results, `superseded` or `current`, `cached` | IR-40, IR-43, IR-46 |
| The fingerprint of the tree at the gate, once | IR-46 |
| The tasks each unit named, headed as the proposer's declaration; tasks that no unit named; one fixed sentence saying that a result is evidence about the tree and not about a task | IR-43, IR-56 |
| Protected-set facts: paths changed since phase entry and which were authorised from the launch-time task text; protected paths changed since launch in phases already approved; suppression markers added and removed, per file | IR-12, IR-33, IR-39, IR-41 |
| Integrity events, by kind, without counts; a manifest that a relaunch derived differently; a cited result file that belongs to a stopped job; evidence that predates the tree | IR-42, IR-54, IR-51, IR-49 |
| Commands excluded from the inner set, with the reason | IR-08 |

Every string that originates in the workspace is escaped, cut, stripped of control characters and
printed inside a data boundary with a per-call token (IR-44). Not included: counts, order, times,
output, earlier results, fingerprint values per row, tiers, sessions, routing decisions, whether a
result came from the closing check. The critic is a fresh session without tools, and no critic-class call
uses a model that produced passes in the attempt without the warning of decision 7 being raised and
recorded (IR-21, IR-47).

**D1.13 Reporting.** The `[LOOP]` line before `[DIGEST]` (R23:268) with `escalations=`,
`failfast-stops=`, `protection=prevent|detect` and the fallback reason (`gate-not-executing`,
`no-check`, `single-unit`, `harness`, `config`). R14 owns event names; this design needs
`microloop.unit`, `check.started/ended`, `job.*`, `route.decided`, the `strategy` envelope field and
`usage.reported` per model call. The doctor names the toolchains a run detected and which of them have
pattern sets (R23v:466-468).

### Disagreements and resolutions

| ID | Disagreement | Resolution | Reason |
|---|---|---|---|
| D-01 | Unit: R22 "one Spec Kit task" (R22:214); R23 "declared by the proposer, one or more tasks" (R23:34); A6 split and merge by file and line counts (A6:356) | R23's rule; R22's size is prompt guidance; A6's thresholds are dropped | 40 % of tasks are `[P]` and 38.6 % are test tasks whose code is another task (R23:121-124); nothing below a task has an ID the runtime could validate |
| D-02 | R22 "1 unit per pass" (R22:222) against R23's ladder, whose L2 allows a check inside a pass (R23:88) | At L1 they are the same thing. L2 leaves Wave 1. X8 tests one unit per pass against several | With L2 a kill loses a pass again, not a unit, and IR-32 cannot hold while a pass is alive |
| D-03 | R22: 2 repairs, 3 proposals (R22:220). R25: 2 base repairs, 1 escalation, up to 2 repairs there (R25:209), so up to 6 proposals. A6 and A8: 3 | 2 repairs in all; the escalated proposal is the second repair | R22 owns loop parameters and R25 concedes them (R25:217). Six proposals do not fit the 30-minute unit cap. It bounds escalation spend to one proposal per task |
| D-04 | A6 and R25: an unresolved unit reverts to the last kept commit (A6:363, R25:209). R22 and R24: the tree is kept (R22:223, R24:53). R24: a ref per kept unit in the project's repository (R24:182). R23 has no commits (R23v:338) | No revert, no commit, no ref in the project's repository (IR-60) | R23v O-13's default stands until the owner rules. A revert destroys work, writes history that grounding could reach, and makes the tree clean, which enables prestage reuse that a dirty tree blocks (R23v:338) |
| D-05 | R22's 20-minute proposal cap against the inertness clause and against L1, where the unit is unknown until the pass ends | The cap applies once the layer is engaged (IR-58) | A proposer that ignores the protocol would otherwise be killed at 20 minutes instead of at the classic cap |
| D-06 | R22's caps against decision 21's target on killed passes | A pass ended by any time limit or watchdog, inner caps included, counts as killed, in both arms; hours are reported beside the count | Counting otherwise would meet the target by renaming kills (DP-R27-3) |
| D-07 | A6, A8 and R25 select checks per unit from its files (A6:337, R25:185-186). R23: no command refers to a task; 3 commands serve 188 obligations (R23:42-48). R23v: an argument list built from changed files is steered by the proposer (R23v:336) | Per-phase manifest (IR-53). Per-unit selection goes to the roadmap | The mapping does not exist in any plan on this machine |
| D-08 | A check over the limit: A8 turns it into a yield (A8:340); R22 sends it to the gate (R22:225); R23 excludes it (R23:212) | Exclude on measured duration only | The runtime must not spend the proposer's yield budget; exclusion by declared timeout would empty NETOPS's set (R23:131-136) |
| D-09 | R23's closing check runs whenever evidence appears (R23:213). Decision 21 requires identical output when no unit is ever completed. R23v finds eleven surfaces that differ (R23v:315-327) | IR-52: with no unit declared the layer executes nothing and adds only the protocol block | Oracle fixtures reach evidence |
| D-10 | Ledger: R24 under the phase state directory (R24:194); R23 in the control plane (R23:382); A8 inside the state directory (R23:301) | Control plane, one ledger, R24's fields merged in | Every file in the state directory is inside the proposer's write scope (R23:140-146) |
| D-11 | R24's handoff holds the last failing check signature; grounding honours any cited path inside the workdir (R23:196-202) | IR-45 and IR-59 | One citation in the evidence would carry repair history to the critic |
| D-12 | R23 recommends the step runner in feature 115 beside the predicate (R23:437-438) | Predicate on by default; step runner an option | Both address the same 29.3 h (R23:317). The predicate works on existing scripts; the runner needs a declared step list |
| D-13 | A phase with no check or with one unit: R25 routes it to `classic` per attempt (R25:197-198); R23 pins the strategy at launch and keeps the layer on with `unchecked` rows (IR-27, IR-15) | The strategy is pinned at launch. The router may switch the layer off for an attempt, with an announcement and a reason in the `[LOOP]` line; it may never switch it on (IR-53) | One `[LOOP]` line and one critic input per phase |
| D-14 | R24's cap of 3 continued passes was sized for 1.56 passes per attempt (R24:171); the layer makes 6–11 | Keep 3 and the context-fill rule | They agree once the index is on. A classic pass grows its context by about 42 k tokens in 18.6 minutes (R24:107, R24:119), so a 12-minute unit adds about 27 k; from an indexed start of about 65 k, three units fit under 150 k |
| D-15 | R12 sizes the inherited block at 48–54 k tokens at 4 bytes per token (R12:75); R17 measured 2.8 (R17:55-66) | Byte shares are the fact (69–70 %, R12:62-69); X3 settles tokens | At 2.8 the block is about 69 k of 108 k first-turn tokens, so R24's "43 k fewer per turn" is conservative |
| D-16 | The critic's view: A6 the ledger (A6:338); R23 one status per task (R23:238); R23v results per command and tree, the task a declaration (R23v:167-178) | R23v (IR-40, IR-43, IR-46) | One unit naming all 41 tasks while one command passes would give the critic 41 rows reading `pass` |
| D-17 | A6 ends the attempt early and sends it to the critic once units are unresolved (A6:363). Decision 21: the layer switches off and the classic loop carries on | Decision 21 | Decided. It also saves a critic call and a counted reject (R22:128) |
| D-18 | A protected-path edit: R22 and R25 switch the layer off at once (R22:226, R25:210); R23 records `tainted` and continues (IR-11); R11 T-19 says the check fails | The result keeps its exit code and carries the condition; the unit is not kept; the failure counts against the task's repairs; the layer goes off only through the ordinary caps (IR-40, IR-53) | A task can change a `Makefile` or a dependency file with authority (IR-41); switching off would silence the layer for such phases |
| D-19 | R25's trigger is "the same normalised failure signature" and "R23 owns the detectors" (R25:210); R23 defines none | The signature is the ordered list of failed command IDs with exit codes; the diff hash is the tree fingerprint (IR-53) | Check output is untrusted text |
| D-20 | R23 F-21 row 4 lets the gate stop at its first failed command; IR-03 says it executes every command (R23v:300-310) | IR-03 as amended: the gate never stops early. This report reads the amendment strictly and applies it to inner checks as well | The failure digest and the diagnostician's input must not differ between layer on and off; a full signature needs every command |

Settled by a pending-decision default and followed without change: an exhausted quota on the escalation
target means skip (DP-032 against R25:224); a relaunch is a fresh session (DP-036); counters survive a
resume and the oscillation window is keyed by attempt sequence (DP-037 against A8:364); the protocol
block is a named divergence field (DP-039); protection is detect-and-void where there is no sandbox
(DP-040); no agent parallelism in Wave 1 (DP-034 against A6:365). Two naming disagreements go to their
owners: event names to R14, config keys to R16.

**The contradictions R23v lists.** R23v has two tables: five contradictions between R25 and R23
(R23v:334-340) and four differences between R11 and R23 (R23v:347-352). It has no table of R25 against
R11.

| R23v item | Resolved by |
|---|---|
| V-20 (1) check selection per unit | D-07, IR-53 |
| V-20 (2) kind of loop per attempt | D-13, IR-53 |
| V-20 (3) revert to the last kept commit | D-04, IR-60, O-13 |
| V-20 (4) a protected-path edit stops the layer | D-18, IR-53 |
| V-20 (5) the escalation trigger is undefined | D-19, IR-53 |
| V-21 (1) R11: a changed check file fails the check; R23: `tainted` | D-18, IR-40: both columns are shown |
| V-21 (2) R11: fingerprint at attempt start, test counts compared; R23: at phase entry, no counts | IR-33 (launch and phase entry, the stronger of the two); suppression counts in Wave 1 (IR-39); test counts on the roadmap (O-4) |
| V-21 (3) R11: checks at the proposer's sandbox level or stricter; R23: none stated | IR-10 as amended |
| V-21 (4) R11: a verification command in project configuration is a vector; R23 derives the manifest from repository content | IR-54; the files the derivation reads are class A; DP-009 stays with its owner |

**R23v rules: adopted or answered.**

| Rule | Status | Where | Effect on defaults or savings |
|---|---|---|---|
| IR-31 fingerprint before and after | Adopted | D1.4, D1.6 | Two fingerprints per check; inside the 15 % budget |
| IR-32 end the pass's processes before a check | Adopted | D1.4 | `protection=detect` where it cannot be guaranteed |
| IR-33 phase entry equals the approved tree; launch fingerprint | Adopted; applies with the layer off as well | D1.1, D1.12 | An operator's edit between phases becomes a fact row. It does not block |
| IR-34 layer only when the gate executes | Adopted | D1.1, F-1, F-4 | The reference run's configuration gets no layer saving |
| IR-35 fingerprint scope defined | Adopted | D1.4 | — |
| IR-36 executables, `PATH`, toolchain configuration | Adopted, **with a limit**: per-toolchain data; a toolchain without an entry has R23's protection only, and the doctor says so | D1.4, D1.13 | — |
| IR-37 caches; `cached` is not `pass` | Adopted, same limit | D1.4, D1.6 | Checks run slower without caches; X12 measures |
| IR-38 class A as patterns | Adopted, same limit | D1.12 | — |
| IR-39 suppression counts | Adopted | D1.12 | Test counts are not in Wave 1 (O-4) |
| IR-40 exit result and conditions in separate columns | Adopted | D1.12 | — |
| IR-41 authorisation covers class A | Adopted | D1.12 | Keeps the layer useful in phases that change build files |
| IR-42 integrity events reach the critic | Adopted | D1.6, D1.12 | No halt (O-6) |
| IR-43 results per command and tree | Adopted, **with a limit**: the runtime cannot tell which tasks a command exercises (D-07), so a task row never carries a result; it says declared or not declared | D1.12 | — |
| IR-44 escaping inside a data boundary | Adopted | D1.12 | — |
| IR-45 grounding refusals, independent of the layer | Adopted, extended by IR-59 | D1.9 | A register row against the oracle |
| IR-46 no fingerprint value per row | Adopted | D1.12 | — |
| IR-47 critic collision checked at launch and before every critic-class call | Adopted | D1.6, D1.12 | In a Claude-only run escalation is mostly by effort (O-9) |
| IR-48 checkpoint passes leave the consecutive breakers untouched | Adopted | D1.5 | — |
| IR-49 no stop once evidence exists | Adopted | D1.7 | — |
| IR-50 resume, reset flag, counts per task ID | Adopted | D1.5 | Caps are per task ID |
| IR-51 predicate reads appended lines, two polls, never stops an adopted job | Adopted | D1.8 | Lowers the central estimate of fail-fast from 60–85 % to 50–80 % of its ceiling |
| IR-03 amended | Adopted, read strictly (D-20) | D1.4, D1.7 | The option "gate stops at its first failed command" is withdrawn |
| IR-52 inertness | Adopted, extended by IR-58 | D1.1, D1.7, D1.12 | — |
| IR-53 router limits, signature definition | Adopted | D1.4, D1.6 | — |
| IR-54 manifest compared on relaunch | Adopted | D1.12 | — |
| IR-10 amended | Adopted | D1.4 | — |
| IR-55 checkpoint file handling | Adopted | D1.2 | — |
| IR-56 task list read at launch | Adopted | D1.2, D1.12 | — |
| IR-57 separate keys | Adopted | D1.10 | — |
| IR-23, IR-24 wording | Adopted | — | — |
| R23v open question 1, retry until green | Answered: X12 gains a flaky-check canary; no rule | Experiments | — |

Owner items O-1 to O-13 of R23v: this design proceeds on the default R23v states for each. Three of them
change a saving or a default here: O-11 (what the predicate may stop), O-13 (no commit, no revert) and
O-2 (no layer without an executing gate).

## Version/date pins

| Item | Value |
|---|---|
| Date | 2026-09-29 |
| Baseline | R21 as corrected by R21v; cutoff epoch 1790637900 |
| Integrity rules | R23 IR-01 to IR-30 as amended; R23v IR-31 to IR-57; R27 IR-58 to IR-60 |
| Specstride / mixture-of-loops | `9cab15d` / `9c88f86`, as cited by the reports; no source line was re-read for this report. The reference run has no recorded code version (R21v:794) |
| Claude Code | 2.1.284, per the reports; not run |
| Pending decisions relied on | DP-019, DP-031 to DP-041 as in `DECISIONS-PENDING.md` on 2026-09-29 03:58 |
| External documentation | None consulted; no claim here is `verified-doc` |

## Options compared

### What the decision-21 comparison compares

Arms: **P** parity configuration; **C** classic loop with every other Wave 1 default on; **M** the
default configuration.

| Option | Elapsed target reachable | What a revert changes | Risk |
|---|---|---|---|
| 1. M against P only | On a LONG-heavy mix, near the ceiling | Unclear: the layer could stay on the strength of fail-fast | Keeps a layer that did not earn its place |
| 2. M against C only, 25 % | No (F-4) | The layer | Reverts the default whatever the layer does for kills and rework |
| **3. Both: M against P for the targets; M against C as the layer's own test** | As option 1 | Each component separately | Two rules to explain |

### Fixture mix for the elapsed target

| Mix | Central estimate, M against P | Verdict |
|---|---|---|
| ORD only | 1–15 % | Target missed |
| LONG only | 10–23 % | Reached near the ceiling; one project decides everything |
| **50 : 50 by baseline alive time, both strata also reported apart** | 6–19 % | Reached only at the ceiling; mirrors the Claude baseline (127.9 of 253.9 h) |

## Recommendation

**One recommendation: ship the layer of D1 on by default with every other technique on its own switch,
judge the default configuration against the parity configuration on a mix fixed in advance, and make each
component pass its own ablation.**

Confidence: **medium-high** on the structure and on the resolutions that follow a decision, code that was
read, or a red-team finding (D-04, D-07, D-09, D-10, D-11, D-16 to D-20); **high** that fail-fast is the
largest saving and that parallelism saves none of the waiting; **low** on every numeric default;
**medium-low** that the 25 % target is met; **high** that the layer alone does not meet it; **medium**
that gate quality holds on a harness without a sandbox.

### W1-ON: Wave 1, on by default (all off under the parity oracle)

| # | Technique | Feature |
|---|---|---|
| 1 | Micro-loop layer at L1, only in runs whose gate executes: D1.2 to D1.6, D1.9, D1.12, D1.13 | 115 |
| 2 | Closing check, only in an engaged attempt (D1.7) | 115 |
| 3 | Fail-fast: first-failure predicate (D1.8) | 115, 103 |
| 4 | Runtime ledger, counters that survive a resume, regenerated handoff | 103, 115 |
| 5 | Obligations index and a whole-prompt budget | 103 |
| 6 | Cache-stable prompt start | 103, 109 |
| 7 | Session continuation within an attempt, under the drop rules | 109, 115 |
| 8 | Polite stop (SIGINT first) | 103 |
| 9 | Model-tier escalation as the second repair, capped | 115 |
| 10 | The deterministic router: ordering and exclusion of checks, layer off per attempt, escalation | 115 |
| 11 | Usage counted per model call for every pass (R14 EV-03, EV-16, EV-17). Not an acceleration; the precondition for judging one | 111 |
| 12 | The integrity rules that are independent of the layer (D1.1) | 101, 105 |

Needed by the targets and owned elsewhere: the blocked-on-human signal (R14 EV-06) and automatic relaunch
(feature 107).

### W1-OPT: Wave 1, options, off by default

| Option | Why not on |
|---|---|
| Step runner with resume from the failed step | Needs declared steps; `partial` runs need care |
| Concurrent independent verification commands (`verification.parallelism`, default 1) | Saving unmeasured; needs declared write scopes (DP-034) |
| Snapshots of kept units in a store the runtime owns, inside the control plane and outside the project's repository | Disk and time; waits for the ruling on R23v O-13 |
| `on_first_failure: continue-and-notify` as the default of the predicate | For jobs whose later failures are independent of the first (R23v O-11) |

### ROADMAP

| Item | Condition to return | Source |
|---|---|---|
| L2: a check tool inside the pass | X8 shows several units per pass beat one | R23:88 |
| Check selection per unit | Declared commands carry a `tasks` field | R23:452 |
| Test counts before and after | A result parser per runner behind an extension point | R23v O-4 |
| The gate and grounding on an immutable snapshot | Owner ruling on R23v O-1 | R23v:446 |
| A model as inner reviewer | Wave 1 data; decision 21 excludes it now | R22:200 |
| Attempt-level tier bump after K rejections | Owner ruling (DP-033) | R25:240 |
| A second harness as an escalation rung; the advisor rung; up-front routing; learned routers; `autoresearch` as a loop kind | Data from X10 first | R25:238-255 |
| Feature parallelism in separate workspaces, then the phase graph, then `[P]` units in worktrees with R26's merge check, then check overlap, then selection | In that order, each after a measurement | R26:153 |
| Lessons store | R12's arm C | R12:240-255 |

Architecture constraints that cost nothing now and keep the roadmap open (R26:152): run state and lock
are local to the workspace; the unit executor takes its working directory as a parameter; a unit record
carries `writes[]`; unit and check events carry a worker ID; the adapter descriptor has optional `tiers`
and `session.*` fields; pattern sets for toolchains are versioned data.

### Experiments

**Precondition X0.** No paired run counts until cost is counted for every pass. Recorded cost misses about
half the reference run's spend, and the missing half sits in killed passes ($516 recorded, $480–$600 not;
R21v:827), so a strategy that removes kills looks dearer on recorded cost while being cheaper (R21:330).

| | X0 Cost accounting |
|---|---|
| Metric | Share of passes whose usage is complete or explicitly unavailable; difference between summed `usage.reported` increments and the harness's own session total; subagent usage attributed to its parent pass |
| Baseline | 47 % of passes carry a cost today (R21v:845); killed passes carry none |
| Fixture | Stub agents that emit usage and are killed mid-pass; then 20 live passes of any run, 5 of them killed on purpose |
| Pass mark | 100 % of passes accounted for; totals within 2 %; subscription figures labelled notional (DP-030) |

**Paired-run design, for X5, X6 and X9 to X11.**
- Same commit, spec, harness version, model, effort and budgets in every arm. The product runs from an
  installed, immutable copy whose identity is recorded at run start (R21v:855).
- Verification mode `required` in every arm, so that the gate executes (IR-34).
- The unit of pairing is the phase. Every phase starts, in every arm, from the same snapshot: the
  approved tree of the previous phase in a trunk run.
- Arms alternate in the order ABBA across phases.
- Attempt time is split into pass time and wait time before shares are compared (R21v:857). Quota pauses
  and time blocked on a person are recorded and excluded from elapsed time.
- A pair is void if either side met a harness outage.

**Fixtures.**

| ID | Content | Cost |
|---|---|---|
| FX-ORD | Sandbox copies of the three P07 features at their starting commits: 47 phases, baseline 100.1 h alive, 1.22–3.50 h per approved phase, 16 kills | Live; about 100 h per arm |
| FX-LONG-R | Replay of NETOPS phase 15: the step times of acceptance runs r5 and r7 to r10 from the evidence records (`utc_finished`), fed to the real predicate code by a stub job | None |
| FX-LONG-S | A synthetic job: three cycles of scripted steps with a seeded failure at a chosen step, a stale failed line in the file, and a negative test that fails by design | None |
| FX-ORACLE | Every parity oracle fixture | None |
| FX-SEED | Small features with seeded defects and with tasks whose test contradicts the spec | Live, small |

**Evaluation window.** Opens at the first valid pair after X0 passes. Closes at 48 valid pairs on FX-ORD
or 6 weeks, whichever comes first. FX-LONG-R and FX-LONG-S are deterministic and run once per release
candidate. If the window closes with the targets not shown, the default returns to `classic` (decision
21 as written).

| # | Question | Metric | Baseline | Fixture | Design and arms | Decision rule |
|---|---|---|---|---|---|---|
| X1 | What share of rejections would a deterministic command have caught? | Share of the 42 rejected and 19 gate-failed Claude attempts whose stated reason a command in the phase's manifest would have failed | None exists; R21 records no reasons | Feedback files of the Claude population | Retrospective, two independent readers, no model call required | Sets the ceiling of technique 3. Below 20 %: the layer's elapsed effect is expected under 5 %, and X5 is run for kills and quality only |
| X2 | What does fail-fast save? | Hours between the first failed step and the end of the wait; detection latency; false stops | 29.3 h of 42.9 h (R21v:732) | FX-LONG-R, FX-LONG-S | Predicate on against off | On by default if at least 50 % of the baseline hours are recovered and no wait ends on a stale line, a skipped row or an expected failure |
| X3 | How much prompt does the index remove? | First-turn tokens per pass, provider's counter | Median 107.8 k (R21v:741) | Recorded passes of NETOPS | R12's stage 1: offline re-assembly | At least 40 % lower at the median and no phase over the prompt budget |
| X4 | Why do productive fresh passes miss the cache? | First-turn cache-read tokens | 41 % of first turns read 60 k or more from cache (R24:75) | Replay from transcripts; otherwise a few small calls, which the orchestrator must authorise | Git snapshot in context against not | Sets the adapter default |
| X5 | **Does the default configuration meet decision 21's targets?** | (a) Alive hours per approved phase. (b) Passes ended by a time limit or watchdog, and runs stopped by the iteration limit, per approved phase, with hours. (c) First-attempt approval rate, and unmet criteria found by an audit critic after approval. (d) Cost per approved phase, all passes counted | (a) 1.22 h median, Claude, finished features (R21:222). (b) 37 of 515 passes, 24.9 % of proposer time (R21v:723). (d) recorded plus estimated cost | FX-ORD for all four; FX-LONG-R and FX-LONG-S for (a) | M against P. Pooled figure weighted 50 : 50 between strata, both reported apart | (a) point estimate at least 25 % lower with a one-sided 90 % interval excluding 0; (b) at least 50 % lower; (c) within 5 points; (d) no higher than P. All four, or the default returns to `classic` |
| X6 | Does the layer itself earn its place? | As X5 | Arm C | FX-ORD | M against C | The layer stays on if (b) is met and (a), (c), (d) are no worse than C (DP-R27-1) |
| X7 | Repair cap and repair context | Units resolved per minute and per token; share later rejected | Default of D1.5 | FX-ORD, unit level | Cap 1, 2, 3 by continued against fresh | Changes the default only on a difference larger than the unit-level noise |
| X8 | Unit size and units per pass | Alive hours per approved phase; check time share; passes per attempt | One task, one unit per pass | Phases of FX-ORD with 10 tasks or more | Task against group against phase | Input to the prompt guidance and to L2 |
| X9 | **Ablation: continuation off** | Cost per pass; minutes to first action | M | FX-ORD, phases with short passes | M against M with `carry.continuation` off | Off by default unless cost per pass is no worse and first-attempt rejects do not rise (R24:231) |
| X10 | **Ablation: escalation off** | Cost and time per resolved unit; rescue rate; unresolved units; later rejection of escalated units | M | FX-ORD | M against M with `loop.escalation` off; and at each trigger a logged 50 : 50 choice between escalating and staying (R25:249) | Off by default unless success per dollar and per hour on the higher tier are no worse than at the base |
| X11 | **Ablation: index off** | Input tokens per pass; passes per approved phase; rejections traced to a text the index hid | M | FX-ORD, about 60 passes per arm (R12:270) | M against M with `carry.index` off | Off if any guardrail of R12:269 is breached |
| X12 | Gate integrity and gaming | (i) Output difference, layer on against off, with stubs that never declare a unit. (ii) The condition recorded when a stub edits a check file, deletes a test, adds a skip, adds a start-up file, swaps a test during the check, writes user-level toolchain configuration, or plants a cache. (iii) A check that passes half the time, declared again until green. (iv) Detection of seeded defects by the critic with and without the fact block | (i) none allowed beyond the named fields. (iv) the critic without the block | FX-ORACLE; FX-SEED | Stubs for (i) to (iii); live critic calls for (iv) | (i) and (ii) block a release. (iii) is reported. (iv): if detection falls by more than 5 points, the wording of D1.12 changes and the test is repeated before the default ships |

Every run also logs each check with command, duration and result (R22's E10); the inner check time share
and the time spent on fingerprints are reported per phase. Further ablations by the same design, if the
window allows: closing check off, fail-fast off.

**Immediate revert on a breach of gate integrity.** A breach is any condition of IR-28 (R23:385), with
"check" read to include gate commands: an approval without a nonce-matched critic reply after the full
gate executed; a counter of IR-06 or IR-48 changed by an inner event; a critic-class input holding a
field that D1.12 excludes; a `pass` for a check that did not run, ran tainted, or whose fingerprints
differed before and after. An attempt that the runtime detected and refused is an integrity event, not a
breach; it reaches the critic (IR-42). On a breach:

1. In the run: the layer goes off for the rest of the run, the approval concerned is void and the phase
   is gated again, and the event is in the digest.
2. On the machine: the runtime writes a tripwire record in the user-level state; every later launch
   defaults to `classic` and says so, until the operator clears it.
3. In the product: the breach blocks the release; the next release ships `loop.strategy: classic` as the
   default. No evaluation result offsets it.

The invariants are checked on every run's event log by the doctor and in CI.

## Matrix rows

None of my own. Three additions by other reports are needed by this design and are endorsed: the column
**micro level** with the protection level (R23:458-465), the column **session continuation** (R24:237),
and the descriptor field `tiers` (R25:268).

## Open questions / risks

### For `DECISIONS-PENDING.md`

**DP-R27-1. What decision 21's targets are measured on.** Evidence: the layer's gross ceiling is 10–20 %
of alive time on ordinary phases (R22:233) and it pays 3–10 % for its checks; fail-fast is independent of
the layer and carries 22.9 % of the reference run (R21v:732). **This is hard evidence that the 25 %
target cannot be met by the layer alone.** Default: option 3; the targets apply to the default
configuration against the parity configuration, and the layer must separately pass X6. If the owner rules
that the layer alone must show 25 % against the classic loop, the evidence says the default returns to
`classic` after the window.

**DP-R27-2. The fixture mix.** Evidence: F-4; R21v:784. Default: 50 : 50 between a long-verification
stratum and an ordinary stratum, fixed before the first run, both reported apart. If ordinary phases
only, the elapsed target is expected to be missed (central estimate 1–15 %).

**DP-R27-3. What counts as a killed pass.** Evidence: D-06. Default: every pass ended by a time limit or
watchdog counts, inner caps included. If inner-cap ends are not counted, the kill target is met almost by
definition.

**DP-R27-4. The layer is off in a run whose gate does not execute** (IR-34, R23v O-2). Evidence: the
reference run used `plan` mode. Default: classic loop, announced. Consequence: projects launched as the
reference run was get fail-fast and carry-over and no layer, unless the launch contract sets the mode to
`required`. The contract derivation (feature 107) should say which mode it sets and why.

**DP-R27-5. Refinements of DP-031 and DP-041.** Escalation is the second repair, not an addition (D-03);
the closing check runs only in an engaged attempt (D-09, IR-52).

**DP-R27-6. Inner checks run every command** (D-20). If the owner reads the amended IR-03 as binding the
gate only, inner checks may stop at the first failing command, which lowers technique 4 and shortens the
failure signature to one command.

**DP-R27-7. The local tripwire** writes a user-level record that changes a default. If that is not
wanted, the revert is by release only and "immediately" means the next release.

### Risks

1. **Gate quality on a harness without a sandbox.** R23v's breaks V-01 and V-04 are detected, not
   prevented, at containment C0 and C1. Decision 21 requires the default level to work on every harness,
   so this is the governing case (DP-040, R23v O-3).
2. **Check duration is unknown.** No inner check has ever run, and the reference run never ran its gate
   (R23:131). With two fingerprints per check and caches disabled, technique 4 could exceed technique 3.
   The 15 % budget bounds it; it does not make the layer pay.
3. **Fail-fast hides later failures and may not stop the job.** Stopping at the first failure can need
   more job runs to find independent failures one at a time, and the runtime stops only jobs it launched.
   X2 measures recovered hours, not the number of reruns.
4. **Two projects carry the baseline** (R21:331), one phase carries the LONG stratum, and the reference
   run's code changed under it (R21v:794). FX-LONG is a replay and a synthetic job, so the largest
   saving is demonstrated without a live rerun of the lab.
5. **Cost of the evaluation.** X5 on FX-ORD is about 100 h alive per arm and about $1,342 of notional
   cost per arm at baseline rates (F-2); X6 and three ablations multiply it. X1 to X4 and X12 (i) to
   (iii) cost nothing and come first.
6. **Anchoring.** Decision 21 fixes that the critic sees the results; X12 (iv) is the only check on what
   that does to its judgment.
7. **Stale defaults and stale patterns.** The caps rest on small studies of single-function repair
   (R22:245) and on one model generation; the toolchain pattern sets age (R23v:466). Both need a re-run
   when the proposer model or a toolchain changes.
8. **The central estimates are mine.** The capture share of fail-fast (50–80 %), the lost share of
   killed time, and the catchable share of rejections have no measurement behind them. They are stated
   so that X1, X2 and X5 can replace them.
