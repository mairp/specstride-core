# R25 — Routing and cascades

Written 2026-09-29. No paid model call was made. Source repositories were read only. Web fetches were made until the session's usage limit was hit (see "Version/date pins" for what that cut off).

Naming: projects the prompt file does not name appear as in R21 (`NETOPS` is the reference run in `/root/agentic-netops-srl`; `P07` is the second Claude sample). "A locally registered backend" stands for any machine-specific backend.

## Prior art consulted

| File | Use |
|---|---|
| `/root/specstride-claude/prompts/specstride-ecosystem.md` §0, §1, §2 (decisions 6–9, 17, 20–23), §4 row R25 | Governing text. Decision 20 (routing is open; tools and kinds of loop; proposer and critic are not routing questions) and decision 21 (fixed points) bound everything below. |
| `docs/ecosystem/research/R21-time-use-baseline.md` | **Reused** as the only baseline. Every saving below is stated against it or is marked "not measurable against R21 yet". |
| `prompts/analysis/A6-micro-loop-survey.md` §5, §7, §11(a) | **Reused and re-verified in part**: §5 (routing sources) is the lead. I re-fetched S77 (TwinRouterBench), S76 (SWE-Router), S79 (Unblocked) and S12 (advisor) and found a more mixed picture than A6's summary: see F-3 and F-4. **Extended**: A6 §5.3 says "escalate on trajectory evidence"; this report turns that into a rule set. |
| `prompts/analysis/A7-local-loop-prior-art.md` §2.1, §3 (router prototype), §5.5 | **Reused**: what the prototype routes, that backend choice is static per role today, the correlated-retry statistic. Checked against the sources named next. |
| `/root/mixture-of-loops_lisa/design/speckit-execution-router.md`, `prototype/router/{rules,signals}.py`, `prompts/speckit-task-router-skill.prompt.md` | Read in full (`rules.py`, `signals.py`, design §0–§12, prompt head). Neither endorsed nor rejected: see Q4. `prototype/pipeline/*.ts` and `prototype/skill/SKILL.md` were sized (702 lines) and read through the design's description of them; I did not read each TypeScript line. |
| `/root/specstride-harness-roadmaps/roadmap/stage-parallelism-research.md` lines 315–351 and `roadmap/harnesses/cursor.md` lines 160–164 | Correlated-retry statistic (13 of 161 phases needed 10 or more attempts against 0.33 % under independence); a vendor auto-router judged unbudgetable. |
| `/root/lisa` branch `main`, `packages/core/src/domain/index.ts` lines 156–167 | Lisa's `ModelPolicy`: per-role ordered `provider/model` chains with an optional cost cap. |
| `docs/ecosystem/research/R14-quotas-cost-observability.md` (event catalogue EV-03, EV-19, EV-24, EV-25, EV-27, EV-30), `R5-claude-proposer-critic.md` | Event names the routing events must sit beside; the Claude critic tier rule. |

## Questions answered

**Q1. How is routing used for the three uses in decision 20?**

- **Tools**: a pure decision table that picks, per unit, which deterministic checks run and in what order (cheap first), from the repository's declared commands. It never picks a tool for the proposer's own harness and never invokes a model. The content of the check set is R23's; the router only selects among the entries R23 defines.
- **Kinds of loop**: a per-attempt choice between `micro` (the inner layer) and `classic`, and, later, `autoresearch`. In Wave 1 only `micro` and `classic` exist. The choice is made on signals the runtime can observe, defaults to `micro`, and falls back to `classic` per decision 21.
- **Escalation**: one rung on the repair ladder between "repair at the base model" and "leave the micro-loop layer". The trigger is a deterministic inner check failing with the same signature after N base repairs. The target is a stronger rung of the same harness, on the same auth mode, from a ladder the adapter declares.

**Q2. What does the evidence say about choosing a model up front versus escalating on failure?**

Up front, per step, on the prompt or the step: measured negative or unproven for coding (F-3). Escalation when a deterministic check fails: the best-supported form (F-4), but the measured numbers are from vendor documentation on one benchmark and one effort-based cascade, not from a gated multi-task loop like this one. There is no local measurement at all (F-9).

**Q3. What is worth keeping from the prototype?**

Kept: the pure first-match rule table that echoes rule id and signals, the separate verification axis (degrade, never deadlock), the rule that an unsure router goes to the independent judge, the router never deriving resume or writing approvals, the list of rejected signals, and the routing plan as a dry-run report. Changed or dropped: the ungated modes, per-phase granularity, the Lisa/Wiggum adapters, the session resume, the constants. Full table in "Options compared", option set 2.

**Q4. What is the concrete rule set for Wave 1?** See "Recommendation", sections RT-A to RT-F.

**Q5. How does escalation interact with quotas, budgets and the fixed points of decision 21?** See "Recommendation", RT-E and RT-F, and F-11.

## Findings

Tags: `verified-doc`, `verified-local`, `inferred`, `unverified`. The measured/asserted split is written in the text of each finding, since the brief's tags say where a claim was read and not whether the source measured it.

### F-1 Today nothing is routed [M by reading code] `verified-local`

- Backend selection is static per role per run: `--proposer` and `--critic`, one registry, plus an optional accelerator backend; there is no per-phase or per-task backend choice (`/root/specstride/lib/backends.py:52-60` as cited by A7 §5.5, which I did not re-open; A7 tagged it verified). The only routing-shaped mechanism in the shipped code is that one accelerator override.
- Lisa's `ModelPolicy` holds ordered per-role chains, "tried in order" (`/root/lisa` `main`, `packages/core/src/domain/index.ts:156-167`, read with `git show main:`). A `git grep` for escalation and fallback in `packages/agents/src` and `packages/core/src/engine` on `main` finds only the human escalation on retry exhaustion (`phase-loop.test.ts:242-287`, FR-083) and env-var transition fallbacks, no model escalation. So the chain is an ordered list with no shipped consumer that escalates by failure. `verified-local` for what exists; whether some other package reads the chain as escalation is `unverified` (searched only the two directories above).
- A vendor auto-router was already refused as unbudgetable: the Cursor critic path "refuses to start" on `auto` because "a non-deterministic router can't be budgeted" (`/root/specstride-harness-roadmaps/roadmap/harnesses/cursor.md:162-164`). `verified-local`.

### F-2 The lever exists on the installed Claude CLI [M] `verified-local`

`claude --version` gives 2.1.284. `claude --help` lists `--model <model>` (alias or full name), `--effort <level>` with `low, medium, high, xhigh, max`, `--fallback-model <model>` ("when the default model is overloaded or not available"), `--max-budget-usd <amount>` (print mode only), `--fork-session`. So escalation on the Claude adapter is a per-session flag change (`--model`, `--effort`). `--fallback-model` is an availability fallback, not an escalation, and must not be conflated with it (see F-11). How a tier or effort change affects the prompt cache and whether the Claude Code docs allow changing them mid-session in `-p` mode I could not confirm: the `code.claude.com/docs/en/model-config` fetch failed on the usage limit. `unverified`.

### F-3 Up-front and per-step routing on coding: measured mixed to negative, asserted positive

| Source | What it says | Measured or asserted | Tag |
|---|---|---|---|
| TwinRouterBench, arXiv 2605.18859 (fetched `abs` and `html v2`, 2026-09-29) | Static track: "every router has negative cost savings there because one under-routed step fails the whole trajectory and triggers the failure-aware bill". On the four non-coding workloads, the best routers exceed 85 % savings. Dynamic track, 100 held-out SWE-bench Verified cases: the trained UncommonRoute cut API cost 53.1 % against unrouted Opus with 75/100 resolved; SR-KNN also resolved 75/100 at $55.61 against $54.73 unrouted. | Measured by the authors on their benchmark. One 100-case run per router; the trained router is the authors' own. I read it through the fetch tool's summary of the paper, not the full text. | `verified-doc` |
| Unblocked, "Model Routing for Coding Agents", 2026-06-09 | Routing "can cut a coding-agent bill 30–40%, then watch rework erase the win"; proposes "token yield" (share of tokens that produce shipped output). | Asserted. A vendor blog; the 30–40 % is a claim, and the RouteLLM "up to ~85 % cheap" quotation is a best-case result on chat benchmarks, second-hand. It also cites that same-task agent runs "have differed by up to 30x in total tokens" (second-hand, not checked). | `verified-doc` |
| RouteLLM (arXiv 2406.18665, older) via A6 S75 | Over 2x cost cut in some cases on chat benchmarks. | Measured, but not on agent trajectories. Carried from A6, not re-fetched. | `unverified` |
| CodeRescue, arXiv 2607.19338, via A6 S78 | Recovery routing beats always-escalate at 35 % of the recovery cost. | The paper was withdrawn (A6). Not usable. | `unverified` |

Reading: the two bad reports are consistent with the mechanism (a router that under-routes one critical step loses the trajectory, then the rework costs more than the saving). But TwinRouterBench's dynamic track also shows a router saving 53 % at equal resolve, so "per-step routing loses money on coding" is true for the static-track routers and for the failure-aware bill, not a law. What supports the decision here is narrower: no source shows an up-front router beating always-strong on a gated multi-task loop, and the one vendor auto-router this owner met was non-deterministic (F-1).

### F-4 Escalation on a checkable failure: the best-supported form, on vendor numbers

- Anthropic's cost-and-intelligence page (`https://platform.claude.com/docs/en/about-claude/models/optimizing-for-cost-and-intelligence`, fetched 2026-09-29) recommends a cascade "for work with verifiable outputs": run at `low` effort and re-run failures at `high`. Its measured example (SWE-bench Pro, Opus 5.5): all at `low` 87 % pass at about $0.10 per task; failures re-run at `high` reach 97 % at about $0.17 per task in total; all at `high` 95.3 % at $0.29. That is a higher pass rate for about 58 % less cost than all-`high`, with more wall-clock on the failed tasks. `verified-doc`. Measured by the vendor on one benchmark, with the whole task as the unit and the test result as the failure signal. It is not a per-unit inner loop, and the failure detector there is the benchmark's own test.
- Same page, effort curve for long-horizon coding (Opus 5.5, SWE-bench Pro): `low` −8 points for about a third of the cost; `medium` −2.5 points for about 70 %; `xhigh` +1.4 points for 2.5x cost. So raising effort for every unit is a poor buy; raising it only after a failure is the case the page measures. `verified-doc`.
- Advisor pattern (`https://platform.claude.com/docs/en/agents-and-tools/tool-use/advisor-tool`, beta header `advisor-tool-2026-03-01`, `max_uses` per request; same page family): measured internal coding benchmark, Opus 5.5 at `high` with a Fable 5.1 advisor 90.1 % at $2.92 per attempt against 88.4 % at $1.38 alone. The gain shrinks as the executor approaches the advisor's capability, and low-effort executors "sometimes stop asking entirely". `verified-doc`. This is a Messages API server tool. Whether `claude -p` exposes it is `unverified` (not found in `--help`). So it is not an escalation lever for the Tier 1 CLI path in Wave 1; it is a candidate for a Tier 2 adapter, and it puts the escalation decision in the model's hands, which decision 21 does not allow for inner checks.
- SWE-Router, arXiv 2607.00053 (abstract fetched 2026-09-29): a cheap model explores for a few turns, then routing is decided from the partial trajectory; the authors prove that conditioning on the partial trajectory never hurts. The abstract says it "maintain[s] the majority of the performances of the stronger model" with better cost efficiency across weak-to-strong pairs. I did not obtain its numbers. `verified-doc` for the design and claim, `unverified` for the size of the saving.
- A6 §5.3 reached the same shape from the same sources: escalate after a deterministic failure, never up front and never by a cheap judge's opinion. Confirmed by this re-check, with the narrowing that the strongest numbers are effort-based, not model-based.

### F-5 Retry on the same backend is correlated; a different rung is a more independent sample [M] `verified-local`

`stage-parallelism-research.md:315-351` (local, measured on the recorded gate history): 13 of 161 approved phases (8.1 %) needed 10 or more attempts, against 0.33 % if attempts were independent. "Retrying the same backend on a phase it already failed is a positively correlated sample… A different backend is the only genuinely independent sample available." This supports a rung change over more repairs at the same rung. Two limits: it measures phase attempts judged by the critic, not inner check repairs (`inferred` that the correlation carries over to units), and it argues for a different backend, whereas this report's rung stays on the same harness (decision 20 keeps the choice of proposer out of routing). A tier or effort change gives less independence than a different backend. `inferred`.

### F-6 Self-conditioning favours a fresh context on escalation [M] `verified-doc`

A6 §2.1 (S26, arXiv 2509.09677 v3): models become more likely to err when their context holds earlier errors. Not re-fetched here; carried from A6, which tagged it measured. Consequence used in RT-D: an escalated attempt starts a fresh session with a distilled failure note, not a continuation. This also follows from F-2's cache point: a model or effort change ends the cached prefix anyway (`inferred`), so nothing is lost by starting fresh.

### F-7 Where the prototype's rules came from and how far they got [M] `verified-local`

- What it routes: phases of a Spec Kit feature to `speckit-implement`, `goal`, `orchestrated` or `skip` by a first-match rule table over seven regex-extracted signals (`prototype/router/rules.py:83-157`, `signals.py:28-46`). It routes neither tools, nor roles, nor models. The design itself says so: it chooses granularity "per phase, not per task" because "neither orchestrator can accept a task as a unit" (design §2.1).
- Thresholds: `T_PATH_DETERMINISTIC` 0.90, `T_PATH_CONVERGENT` 0.60, `T_TEST_ORACLE` 0.25, `N_SESSION_BUDGET` 12, `N_ORCHESTRATOR` 20, `BLAST_ORCHESTRATOR` 25 (`rules.py:32-37`). Corpus: 44 features, 316 phases; 57 % `speckit-implement`, 21 % `orchestrated`, 13 % `skip`, 6 % `goal`, 5 % flagged `needs_review` (design §2.7).
- What the design admits: `path_ratio` "is a proxy for determinism, not a measure of it"; the survey found about 22 % of tasks open-ended against 6 % of phases sent to `goal`; the false-deterministic rate is unmeasured (design §10.1 and open question 1: "hand-label 50 phases"); no tests or fixtures; the TypeScript half was never exercised end to end (A7 §3, whose `rules.py` run I did not repeat; I read the source instead).
- Two modes, `speckit-implement` and `goal`, run without a gate. Under decision 21 no path may skip the phase gate, so those two modes cannot be kept.
- It was never measured for time or cost. There is no saving to state against R21.

### F-8 What R21's baseline can and cannot say about escalation [M for the pools, E for the bound] `verified-local`

Claude-proposer attempts (R21 F-3): 331 attempts, 251.7 h in all. Approved 79.0 h; rejected by the critic 85.6 h (34.0 %); malformed 2.2 h; verification-failed 21.1 h (8.4 %, 19 attempts); no verdict 63.8 h. Killed passes are 24.9 % of Claude proposer time (R21 F-4). The 79.0+85.6+2.2+21.1+63.8 sum is mine, from R21's table.

- **The deterministic-failure pool is small.** Attempts that ended in a failed orchestrator verification are 21.1 h of 251.7 h for the Claude proposer (8.4 %), and that is the ceiling of what "escalate after a deterministic failure" can touch, before the micro-loop itself (R23) has recovered any of it at the base rung. So the incremental saving from a stronger rung is a fraction of a fraction: it is the part of those 21.1 h that repairs at the base rung would not fix but a stronger rung would. `inferred`.
- **The long tail is critic rejection, not deterministic failure.** P07 phase 17 took 12 attempts (NRRNRRNMNMNA, 5.7 h failed) and P07-F24 phase 15 took 8 (NVNRVRRA, 18.1 h failed, 12.7 h proposer) (R21 Appendix B). Their results are mostly `R` (critic) and `N` (no verdict), not `V`. An inner-check trigger does not fire on a critic rejection. The tail that F-5 says is correlated is therefore outside decision 21's escalation. An attempt-level tier bump after K critic rejections would target it; it is not a deterministic-failure trigger and is not covered by the fixed points, so it is an option (RT-G), not a Wave 1 rule.
- **NETOPS already ran the top tier.** The reference run's proposer was `claude-opus-5-5` (R21 "Version/date pins"). A stronger tier than that is Fable-class (named in the advisor docs, F-4), and whether the consumer's subscription includes it is not known here (`unverified`). For that run the model-tier ceiling of a rung above the base could be 0 and the only lever would be effort. So no saving from escalation can be claimed for the reference run, and none can be claimed against the Claude-proposer baseline before the ledger exists.
- **Cost is measurable only with R21's caveat.** Recorded cost misses about half the reference run's spend, concentrated in killed passes (R21 F-6, gap 16). Escalation adds tokens on a more expensive rung; a comparison on recorded cost alone will be wrong in the direction R21 describes. Cost per approved phase must use recorded plus estimated cost, and EV-03 (usage per model call, so a kill loses nothing) is a precondition.
- **Statistical power.** A7 records a within-phase sd of log cost of 0.55–0.74 and a need for 58–97 passes per arm to detect a 30 % change (cited in R21 risk 3). Phase-level paired runs cannot detect a small escalation effect. Unit-level data can (RT-H).

### F-9 What is not known [U]

No local run has ever escalated a model tier inside a phase attempt, so the rescue rate (share of units failing at the base rung that a stronger rung fixes), its cost and its time are all unmeasured here `unverified`. Everything below that is a parameter is a starting value, not a result.

### F-10 The events the router needs already have neighbours [M by reading R14] `verified-local`

R14 defines `check.started/ended` with `runner:"runtime"|"proposer"` (EV-19), `usage.reported` with `model`, `billing`, `role` (EV-24), `strategy` in the envelope and `microloop.unit.layerOff` (EV-27), `quota.signal`, `run.paused`, `run.resumed` (EV-11, EV-25), `fallback.switched|restored` and `alert`, `budget.exceeded` (EV-30). The routing events below extend that set with one new type. `route.decided` is mine; R14 owns the schema, so it is a request to R14, not a definition.

### F-11 Interactions with decisions 7, 8, 17, 21, 22, 23 [I] `inferred`

- **Decision 7 (critic independence).** In a Claude-only setup the critic uses a different model tier from the proposer. An escalation whose target equals the resolved critic model would put the same model on both sides for that unit. The critic never sees the repair history (decision 21), so it cannot compensate. Rule in RT-D: the target may not equal the critic's resolved model.
- **Decision 8 (quotas).** Escalation is more spend on a more expensive rung. With an API key the projected cost is checked against the role's hard cap before the escalation starts. On a subscription it is an alert input. A quota signal during an escalated pass is the provider's limit and pauses the run through the existing path; the attempt is not a rejection.
- **Decision 8 fallback order.** A per-role fallback that moves a run from subscription to an API key is the user's opt-in. Escalation never crosses the auth mode. `--fallback-model` (F-2) is availability, a different mechanism, and is not used as escalation.
- **Decision 21 (fixed points).** Escalation is inside the inner layer; inner cycles count against their own caps only; no new exit codes or stop reasons; when caps run out the layer switches off for that attempt and the classic loop carries on; checks are run by the runtime; the critic sees only the final check result. All six hold if the escalation counters live beside the micro-loop's and never touch the iteration, reject or MALFORMED counts.
- **Decision 22 (session continuation).** Continuation within an attempt is allowed where the harness supports it. Escalation always starts a fresh session, so it ends a continued session. That is one more reason for R24 to record "why the session ended".
- **Decision 23 (counts survive a resume).** The per-unit and per-attempt escalation counters are inner counters, so they are R23's resume rules (mid-micro-loop resume). This report requires only that a resume never resets an escalation used and never re-escalates a unit already at the top rung. The pinned ladder (RT-D) also survives the resume, as the discovered critic pick does (R20).
- **Decision 17 (open harnesses).** A discovered, unverified harness has no known ladder. Escalation is available only on adapters that declare `tiers` in their descriptor. Everything else records `route.decided{choice:"none", rule:"no-ladder"}` and goes straight to leaving the layer. That keeps the router closed to no harness and asks nothing of one.

## Version/date pins

| Item | Value |
|---|---|
| Date | 2026-09-29 |
| `claude` | 2.1.284 (`claude --version`, this machine) |
| Advisor tool | beta header `advisor-tool-2026-03-01` (docs page accessed 2026-09-29) |
| Models named by the vendor docs | Opus 5.5, Sonnet 5.5, Sonnet 5, Fable 5.1, Mythos 5.1 (docs pages, accessed 2026-09-29). The ladder must be read from the adapter at run time and not from this table. |
| TwinRouterBench | arXiv 2605.18859 v2, accessed 2026-09-29 |
| SWE-Router | arXiv 2607.00053, accessed 2026-09-29 |
| Not fetched | `code.claude.com/docs/en/model-config` and one web search on cascade papers: the session hit its usage limit ("resets 4:30am (Asia/Dubai)"). Anything that depends on them is `unverified` and named as such. A6's sources not listed in F-3 to F-6 were not re-fetched. |
| Prototype | design dated 2026-09-09, `claude` 2.1.266 in the design; the design says it was verified against that version |

## Options compared

### Option set 1: when a model is chosen

| Criterion | Up front (per phase, task or step) | Escalate on deterministic failure | Model-initiated (advisor) | Nothing (static, as today) |
|---|---|---|---|---|
| Evidence for coding | Mixed to negative (F-3) | Vendor-measured on one benchmark, effort-based (F-4) | Vendor-measured, beta, API tool (F-4) | Local baseline exists (R21) |
| Signal is deterministic | No (a model or heuristic guesses difficulty) | Yes (exit code plus stable signature) | No (model decides when to ask) | n/a |
| Fits decision 21 (runtime-run checks, no model reviewer) | Yes | Yes | Conflicts: the model judges its own difficulty | Yes |
| Works on discovered harnesses | Needs a ladder | Needs a ladder | Only where the API tool exists | Yes |
| Parity oracle | Off under oracle | Off under oracle | Off under oracle | Native |
| Risk | A wrong route fails the whole trajectory (F-3) | Extra cost on a hard unit that would fail anyway (F-9) | Low-effort executors stop asking (F-4) | Nothing changes |
| Wave 1 | No | **Yes, capped, ablation-gated** | No (roadmap, Tier 2 adapter) | The fallback when routing is off |

### Option set 2: what the prototype offers

| Prototype element | Keep | Change | Drop |
|---|---|---|---|
| Pure function, no model, no I/O, rule id and exact signals echoed in the decision | Keep | | |
| First-match ordered rule table, replayable from the JSON | Keep, as data behind a versioned extension point | | |
| Signal extraction by regex from `tasks.md` | | Use only `task_count`, `path_ratio`, `test_ratio`, `blocking` as unit-sizing and check-availability inputs; the rest moves to R23's unit definition | `parallel_ratio` (unused by any rule, design open question 8) and `blast_radius` as a gate on the mode |
| Verification as a separate axis so a phase with no oracle degrades and does not deadlock | Keep as RT-B rule (a unit with no resolvable check is "unchecked", not failed) | | |
| "When unsure, go to the independent judge, flag `needs_review`, do not halt" | Keep in spirit: when no rule matches, choose `classic` and flag | | |
| Router never derives the resume point and never writes approvals or edits `specs/` | Keep | | |
| Recorded rejected signals (SC measurability, convergence verbs, runnable acceptance blocks) | Keep as a "do not retry" list | | |
| Routing plan shown before running (`plan.json`) | Keep as the `dry-run` output | | |
| Modes `speckit-implement` and `goal` (no gate) | | | Drop: they skip the phase gate, which decision 21 forbids |
| Per-phase granularity | | Overturn: micro-loops work below the phase | |
| Mode `orchestrated` = the gated loop | | It is `classic` here, and the gated loop is always the outer loop | |
| Session resume into `/goal` inside a phase | | | Drop: conflicts with fresh-critic and attempt rules (decisions 21, 22) |
| Lisa or Wiggum adapter seam, `@lisa/sdk` link dependency, Python decision function | | | Drop: this product has one engine and one language (decisions 1, 2) |
| Thresholds 0.90 / 0.60 / 0.25 / 12 / 20 / 25 | | Do not adopt as constants; they are corpus percentiles with an unmeasured false-deterministic rate | |

### Option set 3: default for model-tier escalation in Wave 1

| Option | Merit | Cost |
|---|---|---|
| A. Off by default; ship the code and the events | Cannot make cost worse; no unmeasured behaviour on by default | Never collects the unit-level data that decides it (F-9) |
| B. On inside the micro-loop, capped, gated by an ablation arm, off by one key | Collects data; the cap bounds spend; the target only exists where an adapter declares a ladder and the projected cost fits | Some runs pay for rungs that do not rescue (F-9) |
| C. On, and also at attempt level after K rejects | Targets the real tail (F-8) | Not a deterministic trigger; touches the reject semantics that decision 21 fixes |

## Recommendation

One recommendation: a small deterministic router with three decision points, model-tier escalation on inside the micro-loop ladder with hard caps and an ablation gate, and everything else deferred. Confidence: **medium-high** for the structure and the restrictions (no up-front model routing, no ungated modes, no proposer or critic choice); **medium-low** that escalation earns its default, because there is no local measurement and the vendor numbers are effort-based on one benchmark. Escalation is the cheapest thing to turn off if the ablation says so, and turning it off does not touch the micro-loop default.

### RT-A The router

- One pure function per decision point: `route(point, signals, config, ladder) -> Decision{choice, ruleId, signals, routerVersion}`. No I/O, no model call, no clock. Rules are an ordered table, first match wins, held as versioned data behind an extension point (`RouterRules`), so a new loop kind or a new harness's ladder plugs in without core change. The engine acts on the decision; the router runs nothing.
- The router cannot read the critic's prompt, nonce or verdict history, cannot write or infer a verdict, cannot change the proposer or the critic, and cannot change any count that belongs to the outer loop. It may read the same signals as R23's ledger.
- Decision points: `tools` (which checks, RT-B), `loop` (which kind, RT-C), `escalation` (RT-D).

### RT-B Tool routing

| Item | Rule |
|---|---|
| Input | The unit (R23), the phase's declared verification commands, project toolchain detection (build, type, lint, test entry points), the changed-file set, per-check median duration once known. |
| Output | An ordered list of deterministic checks: fast tier first (type check, lint on changed files, targeted tests), then build; the full suite stays at the phase gate. R23 defines what is in each tier and freezes it before the unit starts. |
| Rule `tools.none` | If no check resolves for the unit, choice = `unchecked`. The unit is recorded as unchecked, the layer does not reject it, and the phase gate covers it. This is the prototype's anti-deadlock lesson applied per unit (design §2.5, §10.3). |
| Rule `tools.slow` | A check whose median exceeds the per-unit wall-clock cap moves to the phase tier. |
| Not routed | The proposer's own tools, tool schemas, permission posture. No model ever chooses a check. |

### RT-C Kind of loop

| Rule id | Predicate | Choice |
|---|---|---|
| `loop.off` | `microloops: off` in config (any layer), or the parity-oracle mode | `classic` |
| `loop.caps` | The micro-loop caps for this attempt are spent | `classic` for the rest of the attempt (decision 21) |
| `loop.no-check` | No unit in the phase has a resolvable check | `classic`, flag `needs_review` |
| `loop.single` | The phase parses to one unit that spans the phase | `classic` (a micro-loop adds only overhead) |
| `loop.harness` | The adapter cannot support the requested capability level | The level the harness supports, else `classic`; the fallback is announced (decision 21) |
| `loop.default` | otherwise | `micro` |

`autoresearch` is not a Wave 1 choice. When it comes (roadmap): a unit that declares a single scalar metric, a frozen harness the proposer cannot edit, a fixed time budget and a held-out check; it runs in a scratch worktree; its result is a candidate that still goes through the full verification and the phase critic. The reason for the restriction is measured: keep-if-better loops produced memorisation until a held-out set was added (A6 S39, `unverified` here, carried).

### RT-D Escalation on deterministic failure

| Item | Rule |
|---|---|
| Ladder | Declared by the adapter descriptor as an ordered `tiers` list (model, effort or both). The Claude adapter derives it from `--model` and `--effort` (F-2). No `tiers` means no escalation (`no-ladder`). The base is what the consumer configured or discovery chose. The ladder is resolved once at launch and pinned for the run. |
| Position in the repair ladder | repair at base (up to R repairs) → **one** escalation to the next rung → up to R repairs there → unit `unresolved`: revert to the last kept commit and leave the layer for this attempt (decision 21). |
| Trigger | Only a check run by the runtime, exit code non-zero, with the same normalised failure signature on two consecutive attempts at the rung, or a repeated working-tree diff hash (R23 owns the detectors). Never: quota or rate errors, timeouts, harness crashes, a MALFORMED verdict, a protected-path edit or a check-config edit (integrity events stop the layer, they do not buy a stronger model), a check that flips on re-run (flaky, quarantined per A6 §8). |
| Target | The next rung on the pinned ladder, same harness, same auth mode, same provider account. It may not equal the critic's resolved model (F-11). If the only next rung does, the outcome is `skip:critic-collision`. |
| Session | Fresh session with the frozen unit text, the frozen check, the current diff by reference and a one-paragraph distilled failure note (A6 §4.3). No transcript is carried. |
| Cost check | API key: before starting, compare the projected cost of the escalated unit (median cost of resolved units on the current rung times the rung's price ratio from the adapter) against the remaining role budget; if it does not fit, `skip:budget`. Subscription: no hard check; the spend feeds the alert path. |
| Caps (proposed, unproven) | Base repairs R = 2; escalations per unit = 1; per attempt = 2; the per-unit wall-clock cap from A6 §11(a) covers the escalated rung as well. All are inner caps and count nowhere else. |
| Off | `routing.escalation: off`. |

Numbers R, 1 and 2 are defaults proposed for the ablation, not results. R22 owns the loop parameters and may change them; the shape stays.

### RT-E Budgets and quotas

1. Escalation spend is emitted through `usage.reported` with `model` and the rung, and counts against the proposer role's budget (decision 8). It is not a separate budget.
2. A `quota.signal` during any pass, escalated or not, follows the existing pause path (`run.paused`, resume on reset). The attempt is not a rejection and no new stop reason appears. On resume the unit continues at the rung it was on; the counters carry over (decision 23).
3. Escalation never moves a run between auth modes and never turns on `--fallback-model` as a substitute. Any subscription to API-key move stays the user's opt-in fallback with its loud alert.
4. If the escalation target's quota is exhausted while the base's is not, that is still the provider's limit signal and pauses the run. The alternative (skip escalation and leave the layer) would hide a limit that decision 8 says must pause; record it as an open question (O-3), not a silent rule.

### RT-F Recording, digest, and off-switches

| Where | What |
|---|---|
| Event `route.decided` (proposed for R14's schema, EV-27 neighbour) | `{point, ruleId, choice, previous, signals{...names and values}, routerVersion, attemptId, unitId?, applied}`. Emitted at every decision point, including the boring ones (`loop.default`, `tools.none`, `skip:*`), so a reader can tell "did not escalate" from "was not asked". `applied:false` marks shadow decisions (RT-H). |
| Existing events | `check.started/ended` (EV-19) carry the result; `usage.reported` carries `model`; the envelope `strategy` (EV-27) carries the loop kind; `microloop.unit.layerOff` carries the reason. |
| Ledger row per unit (A6 §10) | Rung, repairs per rung, cost and wall-clock per rung, outcome. This is the data that estimates the rescue rate. |
| Digest | One line: `routing: loop micro 14/16 phases (2 classic: no-check, single); escalations 3, rescued 2, skipped 1 (budget); escalation cost $X (Y% of proposer)`. Terse by default (decision 16); a verbose form lists rule ids. |
| Critic | Sees only the final check result per unit. Routing decisions, rungs and escalations are not shown to it (decision 21). Which model produced a unit is not part of the evidence. |
| Switches (decision 9 precedence) | `routing.enabled: false` turns off all three decision points (static behaviour as today, event `route.decided` with `ruleId:"config-off"` once per run). `routing.escalation: off` turns off RT-D only. `microloops: off` (decision 21) already forces `loop.off`. A flag `--no-routing` and an env var mirror the config key. The parity oracle runs with routing off; the second suite (layer on, stubs that never complete a unit) needs no divergence entry for routing beyond the fields that record the strategy, because an inert router writes the same decisions each time. `divergence register`: list `route.decided` by name next to the strategy fields (R14/R27 to confirm). |
| `dry-run` | Shows the resolved ladder, the chosen loop kind per phase, the check tier per unit where derivable, and `needs_review` flags. This is the prototype's routing plan kept as a report. |

### RT-G Options (not on by default in Wave 1)

1. **Attempt-level tier bump after K critic rejections of one phase** (F-8: the tail is rejections). Off. It is not a deterministic trigger and it changes the effective proposer for later attempts of the phase; the rejection count and limits stay as they are. Needs a ruling because decision 21's fixed points do not cover outer-loop behaviour (see DECISIONS-PENDING item 2 in the digest).
2. **A configured second harness as an escalation rung.** F-5 argues that diversity breaks the correlated tail. Decision 20 says the proposer is chosen from config and discovery, so this stays a user-declared option only, never chosen by the router.
3. **Advisor rung on a Tier 2 adapter** (F-4). The escalation is model-initiated; consider only after the deterministic version has data.
4. **Routing plan hints for `unchecked` units from a cheap advisory model.** Decision 21 excludes any model as inner reviewer in Wave 1.

### RT-H The experiment that decides it

Escalation gets an ablation arm inside R27's micro-loop evaluation: `micro` with RT-D against `micro` with RT-D off, same fixtures. Phase-level paired runs cannot resolve the effect (F-8, power). So:

- **Unit-level shadow and randomisation.** During the evaluation window only, at each trigger the router randomises `escalate` against `continue at base` (50/50, logged with `applied`), and the ledger records the outcome of both. Units are numerous (a feature has on the order of a hundred tasks, from the prototype's corpus: 117-task feature, design §2.1 example) where phases are not.
- **Primary metric**: cost per resolved unit and per approved phase, using recorded plus estimated cost (R21 rule); **secondary**: wall-clock per resolved unit, unresolved-unit rate, later critic rejection of escalated units, share of escalations skipped for budget or critic collision.
- **Decision rule**: keep escalation on if the rescue rate times the avoided cost of further base repairs and lost time beats the extra spend of the stronger rung: per-rung success per dollar `q/c` and per hour `q/t` both no worse than base (`inferred`, formula from the ledger). Otherwise flip `routing.escalation` to off; no other default changes.

### What goes to the roadmap

Up-front difficulty routing of any kind (evidence F-3, and it needs a labelled set of about 50 phases to measure the false-deterministic rate, the prototype's own open question 1); `autoresearch` loops (RT-C); learned routers; the advisor rung; RT-G items after data; per-task cheap-model exploration (SWE-Router style) if a cheap tier is ever the base.

### Savings against R21's baseline

| Mechanism | Saving stated against R21 | Status |
|---|---|---|
| Tool routing | None of its own | It is the mechanism through which R23's checks apply; the saving belongs to R23. |
| Loop-kind fallback (`loop.single`, `loop.no-check`) | Avoids micro-loop overhead on phases where it cannot help. Size unknown: R21 does not count single-unit phases or phases without checks. | Not measurable against R21 yet. |
| Model-tier escalation | Ceiling: the 21.1 h (8.4 %) of Claude attempt time in verification-failed attempts, minus what base repairs already recover. Reference run: possibly 0 on tier (already the top tier, F-8). | Not measurable against R21 yet; ablation RT-H. No saving is claimed. |
| Everything | The 43.3 % failed-attempt time, the 24.9 % killed-pass share and the 64 % detached-wait share are addressed by micro-loops (R23), warm start (R24) and fail-fast (R23), not by routing. | Outside this report. |

## Matrix rows

None. One request for the harness descriptor and the Claude row (R20, R5): the descriptor gains an optional `tiers` field (ordered rungs the harness can be told to run at: model and effort), and the Claude adapter row's "headless invocation" carries `--model` and `--effort low|medium|high|xhigh|max` as its escalation levers (`verified-local`, `claude` 2.1.284). Without `tiers`, the matrix's "escalation-capable" column is "no".

## Open questions / risks

1. **No local evidence for escalation.** F-9. The default (option B) is a bet with a cheap off-switch. If the owner prefers option A (off until measured), only the default changes.
2. **DECISIONS-PENDING candidate: the boundary of decision 20.** Escalating to a stronger tier or effort of the same harness is treated here as routing inside decision 21's ladder. Escalating to a different harness is not (that would choose the proposer). Default to proceed on: same harness only. If the owner rules otherwise: the ladder accepts declared cross-harness rungs (RT-G 2) and the critic-collision rule widens to a same-provider check.
3. **DECISIONS-PENDING candidate: quota on the escalation target while the base still has allowance** (RT-E 4). Default: pause per decision 8. The alternative (skip escalation and continue at base) keeps runs moving but hides a limit.
4. **Critic collision.** In a Claude-only setup the tier above the base may be the critic's model. The rule skips escalation in that case; the result may be that the Claude-only default rarely escalates at all, and only by effort. The doctor's same-model warning (decision 7) is unaffected. Effort escalation on the same model is treated as diverse enough for this rule; that is a judgment, `inferred`.
5. **Cost measurement.** Comparing escalation on recorded cost is unsound (R21 gap 16). EV-03 must ship first, or the ablation reads cost wrong in escalation's favour.
6. **Cache and session behaviour on a tier change** could not be confirmed from Claude Code documentation (F-2). If a mid-session tier change is allowed and cheap, fresh-session escalation is a slight over-cost; if not, it is required. Either way fresh is safe.
7. **Two of the three vendor numbers** (cascade and advisor) come from one vendor page measuring its own models. They are the best available and they favour the vendor's products; treat the 58 % as an upper bound of the gain. A6's S79 claim is a blog assertion.
8. **Stale defaults.** A6 §8 (S7): harness assumptions go stale as models change. The `tiers` ladder must be read from the adapter at run time, and R, 1 and 2 must be re-run through the ablation on each model generation.
9. **The router as an attack surface.** Routing inputs come from repository content (task text, file paths). Signals are counts and exit codes, never task prose interpreted by a model, so injection cannot steer a route (R11 territory). `inferred`.
10. **Prototype signals were tested only on the owner's corpus** (44 features across 7 projects). If a later phase adopts `path_ratio` for unit sizing, the labelled-set measurement (prototype open question 1) comes first.
