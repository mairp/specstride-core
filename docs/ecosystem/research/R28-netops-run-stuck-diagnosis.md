# R28 — Why the agentic-netops-srl run is stuck, and how to unblock it

Observation window: 2026-09-29 08:16 to 08:23 +04 (epoch 1790655401 to about 1790655800). All times are
+04 (Asia/Dubai) unless marked UTC. `/tmp/p15/chain.log` and the `sections.tsv` files are in UTC.
Nothing in `/root/agentic-netops-srl`, `/root/specstride` or `/root/mixture-of-loops` was changed.

Tags: `verified-local` (file:line or command and output), `inferred` (with the facts), `unverified` (with what was tried).

## Summary

- **The run is alive.** It was relaunched by hand at 2026-09-29 08:11:19 +04 and is, at 08:21:18, in the first
  yield of a new attempt 1 of phase 15, waiting on a detached job (`live_chain30.sh`, the T153 r6 delta walk,
  expected 2 to 5 h, deadline 50,000 s). `verified-local`
- **It is not stuck in one place; it is stuck in one phase.** Phase 15 of 16 has been open since
  2026-09-25 03:58 +04 (100.3 h at the observation). In that time the critic produced **one verdict**
  (REJECTED, 2026-09-27 01:01). `verified-local`
- **The last stop was a product limit, not a project failure.** On 2026-09-29 05:32:53 the proposer delivered
  evidence after a 44 h attempt, and the critic refused to judge it: `verification plan is stale`. The cause was
  the operator's amendment of `tasks.md` on 2026-09-28 07:31, made while the run was alive. The engine checks
  staleness only when the critic starts. The supervisor then refused to relaunch (exit 3 is not retryable). The
  run stayed dead 2 h 38 min until the manual relaunch. `verified-local`
- **The underlying cause of the days** is that phase 15 packs 14 tasks, five of them needing multi-hour runs on
  one live lab, into one unit judged only at the end. Each lab run found a different defect. The original
  criteria (three consecutive clean cycles; an independent person) could not be met inside the loop and were
  amended by the operator on 2026-09-27 and 2026-09-28. `verified-local` / `inferred`
- **Recommended action:** do not restart anything. Do not edit `tasks.md` until a verdict exists. Watch
  `phase15/t153/r6/sections.tsv`; if a walked section fails, stop the job early rather than waiting hours.
  Expect the critic's verdict later today; prepare for a rejection on T151/T153 evidence form.

## Current state

### Processes (all `verified-local`, `ps -eo pid,ppid,lstart,etimes,stat,cmd`, `pstree -ap`, 08:16 to 08:22 +04)

| PID | Started (+04) | What | State |
|---|---|---|---|
| 2410215 | 2026-09-24 06:57:55 | Interactive Claude Code session, cwd `/root/agentic-netops-srl` (the "operator's session") | Parent of the supervisor and the watchdog |
| 198993 | 2026-09-29 08:11:19 | `supervise.py auto --launcher …/run-004-agentic-netops-composite.sh --implement` | Polling; `[MOL-HOLD] unchanged=4 … total-elapsed=548s` |
| 199016 | 08:11:19 | Pipeline `runtime.py` (bundle `f3504f7ae8e7c1f4f7c1`), pgid 199016 | Stage `run-004` running |
| 199125 | 08:11:20 | `/root/specstride/orchestrator.sh … --proposer claude --critic dsh:<profile>/gpt-5 --verification plan` | Waiting on the proposer |
| 199726 | 08:11:24 | `proposer.sh … --phase 15 --attempt 1 --max-iter 30 --timeout 3600` | 100 % CPU in bash for 548 s, then pass 1, then yield wait |
| 236448 | 08:20:31 | `claude --model opus --safe-mode -p …` (pass 1) | Ended after 37 s with a yield |
| 239441 | 08:21:17 | `/bin/bash …/phase15/live_chain30.sh` (the yield job, mode `launch`) | Running |
| 239681 | 08:21:17 | `quickstart_drive_r6.sh` | Running section `gate0` (`make test-static`, pid 240607) |
| 200290 | 08:11:34 | `watchdog.sh` in the operator session's scratchpad: tails `launcher.log`, flags 1,500 s without writes | Running; read-only |

No other acceptance, removability or provisioning job of this project is running. No lab cluster or device
container of this project is up (`docker ps`): the lab was torn down at 2026-09-29 01:13:35 UTC and is being
rebuilt by the r6 walk. A second, unrelated Specstride run (`/root/deepseek-harness`, started 08:15:20) is
alive on the same host.

### Locks and state files (`verified-local`)

- `.specstride/lock`: `20260929-081121-199125 2026-09-29T08:11:21+04:00`; held open as fd 10 by the proposer
  (`ls -la /proc/199726/fd`). Owner is the live run. No stale lock.
- `.mixture-of-loops/…/runs/004-agentic-netops-composite/lock`: empty file, mtime 2026-09-21 06:07:07.
- `state.json`: `state: running`, `last_stage: run-004`, `started_at 1790655080`, contract digest `38944bbd…`,
  `superseded_contract_digest be13f4d0…` (the contract was re-derived before the relaunch).
- `harness-run.json`: `mode auto`, `pid 199016`, `relaunches: []`, `relaunch_budget.remaining 2` of 2,
  `supervision.unchanged 2`, interval 135 s.
- `.specstride/last-run.conf`: `VERIFICATION=plan`, `MAX_REJECTS=30`, `MAX_ITER=30`, `PROPOSER_TIMEOUT=3600`,
  `LONG_JOB_CMD=''`, `ORCHESTRATOR=/root/specstride/orchestrator.sh`.
- No `stop.flag` in `.specstride/` or in the feature directory.
- Gates: `GATE1` to `GATE14` approved (last: 2026-09-25 03:58). No `GATE15-EVIDENCE.md` in `gates/`; the unjudged
  one from 05:32 was archived to `attempts/phase15/attemptresume-20260929-081121-199125/` at 08:11:22.
- Yield artifact `yield/phase15-attempt1-20260929-081121-199125.json`: predicate `grep "CHAIN30 DONE"` in
  `/tmp/p15/chain.log`, `deadline_sec 50000`.
- Live source: `/root/specstride` at commit `936afea` (2026-09-28 19:19), files written 2026-09-29 05:44:13, so
  the relaunched run executes newer engine code than run 6 did.

### Last lines

- Engine: `proposer.sh: pass 1 yielded — T153 r6 delta walk … Waiting on 'grep' with NO model session open (deadline 50000s).`
- Previous run: `critic.py: invalid verification plan: verification plan is stale: expected source hash 549ec9e5… got 7eb0dc03…`
  then `>>> critic config/usage error (exit 3) — halting.`, `[FAIL] run-004 exit 3 (exit)`,
  `[DIGEST] state=failed exit=22 last-stage=run-004 child-exit=3` (`launcher.log` 17043 to 17046).
- Supervisor: `[MOL-DIGEST] … state=failed exit=22 child-exit=3 … next="no relaunch (child-exit-not-retryable): child exit 3 is not in the stage's retry_exit_codes [4]"` (`harness-report.log:880`).
- Job: `== CHAIN30 start 04:21:17`, `== preT153r6 off.sh RC=0 04:21:18`, `== T153 r6 delta walk start 04:21:18` (UTC);
  `r6/sections.tsv`: `prereq … ok`.

## Timeline of the last days

All `verified-local` from `events.jsonl` of runs 5 to 7, `harness-report.log`, `/tmp/p15/chain.log`, `PROGRESS.md`.

| When (+04) | Event |
|---|---|
| 09-25 03:58 | Phase 14 approved; phase 15 starts (run 5, `20260924-074615-2937262`) |
| 09-25 08:00, 18:10 | Operator answers the stop-and-ask items of T144 (second provider) and T153 |
| 09-25 09:45 | Operator note: stop burning passes while waiting, use the yield |
| 09-25 10:35 to 09-26 23:23 | Four yields: 10.81 h, 0.04 h, 8.49 h, 16.16 h. All four jobs ended with exit code 1. T151 r5 to r8 failed |
| 09-27 01:00 | Evidence written; 01:01 critic verdict REJECTED (T151, T152, T153, T154, T155) |
| 09-27 01:03 | Attempt 2 yields on CHAIN24 |
| 09-27 01:20 | Operator decision: a fresh agent under delegation qualifies for T153 |
| 09-27 07:44 | Run 5 killed by the 72 h stage timeout (child exit 124); supervisor: no relaunch |
| 09-27 09:27 | Manual relaunch, run 6 (`20260927-092715-907142`), stage timeout raised to 14 days; plan compiled with source hash `549ec9e5…` |
| 09-27 10:02 to 09-28 05:36 | Yield 1, 19.55 h (CHAIN24 to 26). T151 r9 and r10 fail, T152 r8 and r9 fail |
| 09-27 23:45 | Operator decision: one retry per step inside a cycle |
| 09-28 06:28 to 18:45 | Yield 2, 12.28 h (CHAIN27). T153 r3 walk; T151 r11 stopped by the operator after 5 s; **T152 r10 passes** |
| 09-28 07:00, 07:30 | Operator decisions: T151 = one full cycle plus delta re-runs; delta rule extended to T152, T153. **`tasks.md` written 07:31:53** |
| 09-28 19:22 to 09-29 00:46 | Yield 3, 5.41 h (CHAIN28, T153 r4): most failures are one bug in the walk driver |
| 09-29 00:49 to 05:13 | Yield 4, 4.41 h (CHAIN29, T153 r5): 4 failures left (§12, §24, §26, SC-013 acl) |
| 09-29 05:32:52 | Evidence written with T153 marked unmet |
| 09-29 05:32:53 | **Critic refuses the stale plan, exit 3, `run_stop reason=critic_config`**; supervisor: no relaunch |
| 09-29 05:44 | `/root/specstride` working tree updated |
| 09-29 08:10 | `launch-contract.json` re-derived (`relaunch_2026_09_29`: "critic refused a stale verification plan (tasks.md amended mid-run …)") |
| 09-29 08:11:19 | Manual relaunch, run 7 (`20260929-081121-199125`); new plan carries source hash `7eb0dc03…` |
| 09-29 08:11:24 to 08:20:31 | Proposer start-up, 548 s of bash CPU before the first pass |
| 09-29 08:20:31 to 08:21:18 | Pass 1 (37 s, $1.44) yields on CHAIN30 |

Phase 15 totals at the observation: 37 passes, 8 finished yields with 77.1 h of waiting, 1 verdict,
$399.78 recorded cost, 3 engine runs, 2 manual relaunches.

## Where it is stuck

**Stage** `run-004` (2 of 2). **Feature** `004-agentic-netops-composite`. **Phase 15** of 16, "Hardening,
Evidence & Removability (plan P11)". **Attempt 1** of run 7 (the third "attempt 1" of this phase, because
attempt numbering restarts with each run), pass 1, yield 1 of 4.

### What the phase requires (`verified-local`, `specs/004-agentic-netops-composite/tasks.md:537-558`)

Fourteen tasks: T143 to T155, T175, T188. Five need long live runs on the single lab: T144 (two model
providers), T151 (acceptance: a full deploy, test, destroy cycle, SC-001 to SC-050), T152 (removability on a
re-provisioned lab), T153 (clean-host quickstart walk by someone who did not build the platform, plus the
SC-013 trial), T154 (evidence audit over all of it). Declared verification commands cover phase 2 only
(`verification-commands.json`: `count 2`, `phases [2]`), and the mode is `plan`, so the engine's gate
executes nothing for phase 15; every check runs inside proposer passes or detached jobs.

### What the critic said (2026-09-27 01:01, `gates/GATE15-FEEDBACK.md`)

REJECTED on five tasks: T151 (no three clean cycles; r8 aborted in cycle 3, closing `verify-evidence` exit 2),
T152 (r2, r5, r6, r7 all exit 1), T153 (not an independent person; walk failed; SC-032 took 37 min against 30),
T154 (`docs/media/p11-evidence-index.json` absent), T155 (items 3, 8, 17 open). The diagnostician classed it
`REAL-GAP`. The other nine tasks were not disputed.

### State of each rejected task today (`verified-local` from `PROGRESS.md` passes 4 to 6 and the archived evidence; the proposer's own claims, not yet judged)

| Task | Claimed | Basis |
|---|---|---|
| T151 | met under the amended text | Cycle 1 of `acceptance-20260928T061440Z` (61 of 61 steps ok), closing delta `20260928T145001Z`, `verify-compat` delta ok |
| T152 | met | r10, exit 0, `verify-evidence` exit 0 (`chain.log`: `t152r10 RC=0 14:45:03` UTC) |
| T154 | met | Index over 37 runs, 0 failed, one exclusion with reason |
| T155 | met | Items 3, 8, 17 closed by the 2026-09-28 probe |
| T153 | **unmet** | r5: §12, §24, §26 and SC-013 construct 2 (acl) failed |

### The latest job results (`verified-local`, `phase15/t153/r5/sections.tsv`, `sc013-results.tsv`, `sc032.txt`)

- Passed: prereq, gate0, §1, 8, 10, 11, 13, 16, 17, 21, 26a, 27; SC-032 14.6 min (bound 30); SC-013 vlan, mac-vrf, ip-vrf `COMPLETED`, `Ready=True`.
- §12 exit 1: three gNMI reads returned rc 4. The quickstart asked the state datastore for configuration-only leaves, expected MAC entries before traffic, and a route under the wrong key. Documentation error.
- §26 exit 1: `kubectl … get networks` rc 5 (needs `--show-managed-fields`), and the answer lacked the live description. Documentation error plus a small product gap (`deployer/status.py`).
- SC-013 acl: `final=FAILED`, a connection error from the model provider. Environmental, transient; the same construct completed in r4.
- §24 exit 1: `off.sh --purge-intent-tier --remove-services` rc 1. The dashboard patch revert is positional and raced with the Deployment controller (HTTP 422); namespaces and the policy stayed. **Product defect**, fixed with a retry in `scripts/lib/intent_tier.sh`.

All four are fixed in the tree by the proposer's account; none is re-verified live. That is what CHAIN30 does.

### The T151 acceptance job, historically (`verified-local` from R21 F-5, re-checked against `chain.log`)

Eleven runs, no clean three-cycle run. The first failing step was different every time: r5 `provision-rerun`,
r7 `test-reverify`, r8 `verify-topology-view`, r9 `credential-scan`, r10 `degradation-e2e` (all in cycle 1);
r6 died in 2 s on an orphan cluster; r11 was stopped after 5 s. So the failure is **not one deterministic
defect and not pure flakiness**: it is a sequence of distinct real defects (product, test harness, quickstart)
and environmental faults (host port 9090 clash, orphan cluster without a context, leaked file descriptor,
provider connection error), found one per multi-hour run.

## Root cause analysis

Ranked. Letters refer to the task's categories.

### 1. (g) + (e) A phase too large, with criteria that could not be met inside the loop — primary

- Fourteen tasks and five multi-hour live checks are one unit with one verdict at the end. 100.3 h, 1 verdict. `verified-local`
- "Three consecutive clean cycles" costs 7 to 14 h per try and is lost at the first failing step; 0 of 10 tries passed and 29.3 of 42.9 h ran after the failure was visible (R21 F-5). `verified-local`
- "Someone who did not build the platform" cannot be satisfied by an unattended run at all. `verified-local` (critic feedback and hint)
- The operator amended both (2026-09-27 01:20, 2026-09-28 07:00 and 07:30). Since then progress is real: T152 passed, the walk went from many failures to four. `verified-local`
- Each run exposed genuine defects, so (e) applies, but each was fixable in scope; none blocks alone. `inferred` from the pass notes.

### 2. (f) Specstride and mixture-of-loops limits — what turned slow progress into stops

| Limit | Evidence | Cost |
|---|---|---|
| Staleness is checked only at critic start (`lib/critic.py:2608` is the only `load_plan` call; `lib/verification_plan.py:1131-1136`) and is fatal (`orchestrator.sh:2137-2141`) | Edit 09-28 07:31, halt 09-29 05:32 | 22 h of work ended with no verdict; evidence archived unjudged |
| A requirement change needs an edit of the hashed source, so any operator amendment during a run guarantees this halt | `launch-contract.json:49` | Recurs on every amendment |
| Exit 3 and exit 124 are not retryable; `retry_exit_codes [4]` | `harness-report.log:601, 880` | Dead 09-27 07:44 to 09:27 and 09-29 05:32 to 08:11 |
| Relaunch restarts the attempt: evidence archived, proposer starts again | `attempt_archived` event 08:11:22 | The critic never saw the 05:32 evidence |
| Yield cap of 4 per attempt (`proposer.sh:1234`); a fifth ends the run with exit 9 | Operator note 09-29 01:05 | Forced an evidence file known to be incomplete |
| No first-failure predicate on a yield | R21 F-5 | 29.3 h |
| Proposer start-up is quadratic in prompt size: `[[ -n "${PROMPT//[[:space:]]/}" ]]` (`proposer.sh:1807`) in a UTF-8 locale | Measured on copies of the prompt: 20 kB 2.07 s, 40 kB 8.78 s, 80 kB 32.68 s; with `LC_ALL=C` 80 kB 0.06 s. Observed 548 s at 319 kB; 98 to 338 s in earlier phases | About 9 min per proposer start, 100 % of one core |
| Prompt 319,435 bytes against a budget of 180,000; the yield contract survives only because it is protected | `prompt_block_protected` event | Context pressure in every pass |
| Mode `plan`: the gate executes nothing | `last-run.conf` | All verification is proposer-run and invisible to the engine |

### 3. (d) Blocked on human decisions — real earlier, resolved now

T144's second provider and T153's person requirement were stop-and-ask items, answered 09-25 and 09-27.
No open decision blocks the run at the observation. `verified-local` (`PROGRESS.md:1325, 1403, 1566`)

### 4. (b) Waiting on detached jobs — true as a description, not as a fault

The run waits on CHAIN30 now, legitimately. No job hangs. `verified-local`

### Ruled out

- **(a) Dead and not relaunched:** false at the observation. True for two windows (1 h 43 min and 2 h 38 min). `verified-local`
- **(c) Looping on the same failure:** false. Failures differ per run and the failing set shrinks. `verified-local`
- **Lock, budget, quota:** the lock is held by the live run; relaunch budget 2 of 2; wall clock unlimited (`wall: 0min`); stage timeout 14 days from 08:11. `verified-local`
- **Credentials or network for the engine:** Loki and OTel endpoints reachable, pass 1 ran. `verified-local`

## Proposed solution

### (i) Immediate unblock

1. **Leave the run alone; do not relaunch.** It is doing the one thing left. Confirm with
   `tail -5 /tmp/p15/chain.log` and `cat /root/agentic-netops-srl/.specstride/features/004-agentic-netops-composite/phase15/t153/r6/sections.tsv`.
   Success is `== CHAIN30 DONE` and every walked row `ok`. Risk: none.
2. **Do not write to `specs/004-agentic-netops-composite/tasks.md` until a `verdict` event exists.** Ticking
   checkboxes is safe (the `tasks-v2` projection ignores ticks); changing task text is not. Put guidance in
   `PROGRESS.md` as before. Check before the critic runs:
   `sha256sum specs/004-agentic-netops-composite/tasks.md` must stay `b823a32b…f65469`.
   Why: removes the cause of the 05:32 halt. Risk: none.
3. **If an amendment is unavoidable, do it as a stop, not as an edit under a live run:**
   `touch /root/agentic-netops-srl/.specstride/stop.flag`, wait for exit 6, edit, re-derive the contract with the
   mixture-of-loops skill, relaunch. Risk: the attempt restarts.
4. **After the verdict:** `grep '"event":"verdict"' .specstride/events.jsonl | tail -1`. On APPROVED the run moves to
   phase 16. On REJECTED a new attempt starts with four fresh yields; read `gates/GATE15-FEEDBACK.md`.

### (ii) Stop the waste while it runs

1. **Fail fast by hand on the walk.** If §1, §10 or §11 (preconditions) show a non-zero row in `r6/sections.tsv`,
   the rest cannot pass. The owner may end the job so the pass resumes at once:
   `kill -TERM -- -239438` (the job's session leader), then
   `echo "== CHAIN30 DONE (stopped by operator after first failure)" >> /tmp/p15/chain.log`.
   Risk: a half-built lab is left; the next chain starts with `off.sh`, which has handled that since the 09-25 fix.
   Confirm with a `yield_resume` event.
2. **Never launch a three-cycle acceptance again.** The amended T151 needs one cycle; use
   `make test-acceptance-rerun ONLY=<step>` for deltas (owner or proposer, not this report).
3. **Keep one live job per yield** and let the chain script stop at the first non-zero step rather than "leave
   the lab standing and continue". A note in `PROGRESS.md` is enough.
4. **Avoid a second concurrent engine run on this host during lab runs** if lab timing matters (SC-032 is a
   30-minute bound). `inferred`; load average was 3.0.

### (iii) Human decisions

| Decision | Options |
|---|---|
| Will the critic accept T151 built from cycle 1 of a T153 walk plus deltas? | (a) Wait and see. (b) Add a line in `docs/decisions/live-findings.md`, which is not hashed, stating the mapping explicitly |
| Evidence directories carry invented future dates (`20261002T060000Z-p15-T153r5-s24`, `20261003T…`) while T154 demands "none hand-authored" | (a) Accept and state the naming rule in the evidence. (b) Have the scripts use real timestamps from now on |
| Split phase 15 if it is rejected again | (a) Keep. (b) Move T153 to its own phase, or to a manual sign-off outside the run, so phases 15 and 16 can close |
| Rotate the second provider's key | The evidence states it appeared on a recorded command line in run r8. Rotate it regardless of the run |
| Who watches | The supervisor lives inside one interactive session (pid 2410215). If that session ends, supervision ends. Decide whether to run it under `tmux`/systemd |

### (iv) Product changes (architecture.md section 9 and "Who relaunches")

1. **Fail-fast: first-failure predicate on a yield** (Wave 1 item 3, feature 118; experiment X2). Would have saved about 29 h here.
2. **Blocked-on-human signal** as a stop reason with its own exit code, so that a phase needing a decision ends in minutes and the supervisor reports it.
3. **Automatic relaunch with a second classifier table** (`relaunch.owner = root`). Add rows for `critic_config` with a stale plan (re-derive the plan, keep the evidence, call the critic) and for stage timeout during a yield.
4. **Staleness handling.** Check the source hash at every pass start and at yield resume, not only at critic start; on a mismatch re-derive and report, or stop at once. Never discard delivered evidence: a relaunch that finds unjudged evidence should send it to the critic. New finding of this report.
5. **Operator amendments as a first-class input** (an amendment record outside the hashed source), so a decision does not invalidate the plan.
6. **Smaller units** (micro-loop layer; feature 115): one task per unit, and a verdict per long check rather than per phase.
7. **Start-up cost.** Replace `proposer.sh:1807` by a linear test, for example `[[ "$PROMPT" =~ [^[:space:]] ]]` or the same expansion under `LC_ALL=C`. New finding.
8. **Whole-prompt budget and obligations index** (Wave 1 item 5): 319 kB against 180 kB.
9. **Yield cap:** count only yields whose job failed, or make the cap a per-phase setting in the contract.
10. **Attempt numbering that survives a relaunch** (Wave 1 item 4, runtime ledger).

## What could not be determined read-only

- Whether CHAIN30 will pass. `unverified`; settle with `r6/sections.tsv` and `r6/sc013-results.tsv`.
- Whether the four r5 fixes work live. They have unit tests by the proposer's account; not run here.
- Whether the critic will accept the amended T151 and T153 evidence, and the invented directory dates. `unverified`; only a verdict settles it.
- Whether the staleness check would also trip on edits to `spec.md` or `plan.md`. The plan's `source.specPath` is `tasks.md` only, so `inferred` no; not tested.
- The exact bash statement that consumed the 548 s. `inferred` from the measured scaling (predicted about 520 s) and the absence of child processes; no profiler was attached.
- Whether the engine update of 05:44 changes behaviour for this run beyond telemetry. The diff of `936afea` was read for `proposer.sh` only.
- Whether the second engine run on the host shares any resource with the lab. Not inspected.
- Provider quota or credential validity. Credential files were not read by rule.

## Method

Read-only commands, as text:

```
date; date +%s; uptime
ps -eo pid,ppid,lstart,etimes,stat,cmd --sort=start_time | grep -Ei '<run terms>'
pstree -ap <pid>; tr '\0' ' ' < /proc/<pid>/cmdline; cat /proc/<pid>/stat; ls -la /proc/<pid>/fd; ls -l /proc/<pid>/cwd
tr '\0' '\n' < /proc/199726/environ | grep -E '^(LANG|LC_)'      # locale variables only
docker ps --format '{{.Names}}\t{{.Status}}\t{{.Image}}'
ls -la, stat -c '%y %n', cat, tail, sed -n, grep -n, wc -l, sha256sum on:
  /root/agentic-netops-srl/.specstride/{lock,last-run.conf,features/004-…/**}
  /root/agentic-netops-srl/.mixture-of-loops/004-…/{launch-contract.json,…/runs/004-…/{state.json,harness-run.json,harness-report.log,launcher.log}}
  /root/agentic-netops-srl/specs/004-agentic-netops-composite/tasks.md
  /tmp/p15/chain.log, /tmp/p15/t153-r6/
python3 (inline, read-only) over runs/*/events.jsonl: event counts, run_stop, verdict, yields, start-up delays
git log / git status --short / git show 936afea   in /root/specstride and /root/agentic-netops-srl
grep/sed over /root/specstride/{proposer.sh,orchestrator.sh,lib/verification_plan.py,lib/critic.py}
Timing test in /tmp/specstride-research/R28/ on copies of the first 20, 40, 80 kB of the phase-15 prompt:
  bash -c 'X="$(cat s.txt)"; [[ -n "${X//[[:space:]]/}" ]]'   with and without LC_ALL=C
Prior work read: R21-time-use-baseline.md (F-4, F-5), architecture.md sections 4 and 9
```

Not run: the launcher, the supervisor, `specstride run/resume/stop`, any `make` target or test of the project,
any signal, any model call. Not read: `.env` files, tokens, `auth.json`. One chain script that was read
sources an `.env` file by path; the file itself was not opened.
