# Incident: pipeline `121-dsh-kanban` halted at phase 3 by two instant proposer agent errors (exit 7, supervisor records `failed`, no auto-retry)

- **Found:** 2026-11-08 ~12:56 (+04), while keeping the `121-dsh-kanban` loop on track in
  `specstride-dsh` (round-1 check of the loop-keeper goal).
- **Severity:** blocker for the loop. Phases 1–2 are approved; phase 3 never started real work;
  the pipeline digested to `state=failed exit=22` and the relaunch rule table chose `failed`
  (`exit:3` → no retry), so the loop stays dead until an operator relaunches it.
- **Component:** the mixture-of-loops pass loop (`proposer.sh`, exit 7 breaker) plus the pipeline
  supervisor's relaunch table (`relaunch-root`, rule `exit:3`); observed on the dsh backend
  (`dsh:zai/glm-5.3-flash`).

## Timeline (all grounded in files)

- `…/runs/launch-mw7l37kd/pipeline.log`:
  - Phase 2 approved attempt 2, ticked 10 tasks, git checkpoint 08:56:04Z.
  - `08:56:06Z` phase 3 attempt 1 proposer started, pass 1/30.
  - `08:56:13Z` pass 1 errored (`agent_error`) — consecutive 1/2. ~7 s wall.
  - `08:56:15Z` pass 2 errored (`agent_error`) — consecutive 2/2. **~0.4 s wall** — the child died
    before doing anything; this is not an agent that "looped or produced nothing", it is an
    instant spawn/provider failure.
  - `proposer.sh: 2 consecutive agent errors — aborting (exit 7)` → `halted: phase evidence not
    found: gate:<N>:evidence` → `[FAIL] run-121-dsh-kanban exit 3` →
    `[DIGEST] state=failed exit=22`.
- `/root/.specstride/workspaces/9be8396c8c86ed7e/runs/run-dac8cefc-f2dc-48ad-bb1b-e5353f329ed2/events.jsonl`:
  two `iter_error` records, both `subtype=agent_error reason=agent_error kill_class=agent`;
  **no underlying provider message, exit code, or stderr is recorded** for either pass.
- The same wall-clock minute shows a burst of sibling spawns on the host (a fresh dsh home
  overlay sweep, `cc-socks`, `claude-0` and the `specstride-parallel` worker dirs all stamped
  12:56), consistent with a transient resource/provider contention window rather than a bad
  phase prompt: the identical backend answered a headless probe with `BACKEND-OK` at 13:07
  the same hour, and phases 1–2 passed minutes earlier on the same model.
- Supervisor: `.specstride/launches/launch-mw7l37kd/supervision.json` shows `relaunches: []`;
  `events.jsonl` records `supervisor.observed ruleId=exit:3 choice=failed` — the relaunch table
  treats exit 3 as terminal, so the breaker's remedy ("fix the phase harness") is unreachable
  from inside the loop.

## Root cause (confirmed 13:28 +04 by relaunch experiment)

The pipeline stage runs `specstride run` **without `SPECSTRIDE_PROPOSER` / `SPECSTRIDE_CRITIC` in
its environment**. `run-feature.ts` then falls back to `DEFAULT_MODEL = "sonnet"` and a `claude`
harness (`criticOf(undefined)` → `dshModel: null` → `callClaude`), and Claude Code is **not
installed on this host** (`specstride doctor`: `fail claude on the search path`). Every PLAIN
proposer pass therefore dies before any model call:

- the pass child exits non-zero in **~60 ms**, before `dsh` is ever spawned (a PATH wrapper on
  `/usr/bin/dsh` logged zero pass invocations), leaving no dsh session and no stderr anywhere;
- the accounting maps the non-zero exit to `agent_error`, two in a row trip the exit-7 breaker,
  the loop halts, and the supervisor's relaunch table (`exit:3` → `failed`) never retries.

Phases 1–2 were approved only because the **accelerator** layer carried them (the
`accelerator: phase N (claude)` recovery lane of the driving session), which masked the missing
proposer backend until the first plain pass of phase 3. The digest line names the twin symptom:
`stop=critic_config` — the critic defaults to the same missing claude harness.

The relaunch with `SPECSTRIDE_PROPOSER=dsh:zai/glm-5.3-flash`,
`SPECSTRIDE_CRITIC=dsh:compass-gpt5-high/gpt-5`, `SPECSTRIDE_MODEL=zai/glm-5.3-flash` exported
into the launch environment (they flow through `launchEnvironment`, which copies `process.env`)
started phase 3 with live dsh proposer passes and parallel groups — the loop is unblocked.

## Problems this exposes

1. **A run starts on a backend that was never probed.** The engine falls back to `claude` when
   no role is configured and only discovers the gap pass-by-pass, as instant `agent_error`s.
   The launch checks should refuse (or loudly warn, `specstride doctor`-style) when the
   configured-or-defaulted reviewer executable is not on the search path.
2. **No distinguishing signal for instant agent deaths.** A pass that dies in 0.4 s (spawn,
   ENOENT, provider 5xx) is counted identically to an agent that burned its whole timeout
   producing nothing. A minimum-lifetime or exit-code floor would have kept the loop up.
3. **The failure leaves no forensic record.** Neither the pipeline log nor the workspace
   `events.jsonl` carries the child's stderr/exit detail (`passOnDsh` hands the message back as
   `reply.stderr`, but the `erroredLine` accounting never prints it); diagnosing required a PATH
   wrapper on `dsh` to prove the spawn never happened. The pass result should capture at least
   the child exit code and the last N lines of the backend's output.
4. **The supervisor cannot recover exit 7.** The loop halt (exit 7 → stage exit 3) is final in
   the `relaunch-root` table. For a transient/config-class breaker trip the remedy is a bounded
   relaunch with backoff, not a terminal `failed` digest.
5. **The error breaker state outlives its cause.** The persisted `passLoop.errorCount` carried
   across relaunches (the first retry printed `consecutive errors: 3/2` on its very first
   pass), so an operator's relaunch can be aborted by errors accumulated under a DIFFERENT
   cause. The keeper had to reset the ledger's phase-3 `passLoop` counters by hand.

## Immediate remedy applied by the loop keeper

- Verified the dsh backend healthy (headless probe `BACKEND-OK`).
- Reset the phase-3 `passLoop` counters in the workspace ledger (errors accumulated under the
  missing-claude cause, not the phase's content).
- Relaunched with the dsh roles exported (`launch --mode run`, comment
  `loop-keeper-unblock-roles`): phase 3 attempt 1 is running with live proposer passes and the
  parallel layer engaged — recorded 13:28 +04.
