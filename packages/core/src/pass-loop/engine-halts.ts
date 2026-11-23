/**
 * The engine's own halting lines after a pass loop that ended without phase
 * evidence (F103-FR-011, F103-FR-014, F103-FR-017 and the stop reasons of
 * F103-FR-019 the watchdogs and the yield own): the `>>>` line names the
 * breaker that fired, and the guidance that follows tells the operator what to
 * read and which as-is variables to raise. The lines are the as-is engine's,
 * carried verbatim; the pass loop's own lines belong to the loop
 * (`accounting.ts`).
 */

/**
 * F103-FR-011 — `>>> proposer hit max-iter (<n>) without evidence for phase
 * <N> — halting (exit 4).` The engine's line after the loop returned the
 * result 4; the loop wrote no stop line of its own (D-45, preserved).
 */
export function maxIterHaltingLines(limit: number, phase: number): readonly string[] {
  return [
    `>>> proposer hit max-iter (${String(limit)}) without evidence for phase ${String(phase)} — halting (exit 4).`,
  ];
}

/**
 * F103-FR-14 — `>>> proposer aborted on consecutive agent errors for phase
 * <N> — halting (exit 4).` followed by the guidance that names the
 * `pass-checkpoints` directory and the four remedies.
 */
export function consecutiveErrorsHaltingLines(
  phase: number,
  workdir: string,
  featureSlug: string,
): readonly string[] {
  const checkpoints = `${workdir}/.specstride/features/${featureSlug}/pass-checkpoints`;
  return [
    `>>> proposer aborted on consecutive agent errors for phase ${String(phase)} — halting (exit 4).`,
    `#   the agent pass repeatedly ended in error, or was repeatedly killed by the`,
    `#   watchdog (subtype watchdog_*: repeat_stall = same tool call over and over,`,
    `#   progress_stall = nothing written to disk, idle_timeout = the tree is dead).`,
    `#   A hard_cap kill is NOT counted here — it has its own breaker (exit 10).`,
    `#   Each killed pass left a checkpoint in ${checkpoints} — read the`,
    `#   newest one first; it says what the agent was actually doing. Options:`,
    `#     - raise the per-pass timeout:  SPECSTRIDE_PROPOSER_TIMEOUT=3600 specstride resume -w ${workdir}`,
    `#     - raise the error tolerance:    SPECSTRIDE_PROPOSER_MAX_ERRORS=5 specstride resume -w ${workdir}`,
    `#     - loosen a futility detector:   SPECSTRIDE_PROPOSER_REPEAT_LIMIT=0 / SPECSTRIDE_PROPOSER_PROGRESS_TIMEOUT=0`,
    `#     - or fix the phase's live harness so a pass completes within the timeout.`,
  ];
}

/**
 * F103-FR-17 — `>>> proposer made no progress for phase <N> — halting (exit
 * 4).` followed by the guidance that points at `PROGRESS.md` and at
 * `specstride resume -w <workdir>`.
 */
export function noProgressHaltingLines(
  phase: number,
  workdir: string,
  featureSlug: string,
): readonly string[] {
  const progress = `${workdir}/.specstride/features/${featureSlug}/PROGRESS.md`;
  return [
    `>>> proposer made no progress for phase ${String(phase)} — halting (exit 4).`,
    `#   Consecutive passes completed cleanly and changed NOTHING outside the`,
    `#   loop's own bookkeeping. That is what a phase blocked on a decision looks`,
    `#   like: the agent will not break a spec rule or weaken a criterion to get`,
    `#   past it, so it writes its reasoning and waits. This is NOT a timeout and`,
    `#   raising a budget will not clear it.`,
    `#   Read, in this order:`,
    `#     - the newest agent note in ${progress} (it names the blocker)`,
    `#     - the phase's run note under the spec's runs/ directory (it usually lists`,
    `#       the options the operator has to choose between)`,
    `#   Record the decision where the note asks for it, then: specstride resume -w ${workdir}`,
  ];
}

/**
 * The stop reason `proposer_yield_budget` — `>>> proposer's yield budget is
 * spent for phase <N> — halting (exit 4).` with the guidance that names the
 * yield jobs directory and the three ways out.
 */
export function yieldBudgetHaltingLines(
  phase: number,
  workdir: string,
  featureSlug: string,
): readonly string[] {
  const jobs = `${workdir}/.specstride/features/${featureSlug}/yield-jobs/`;
  return [
    `>>> proposer's yield budget is spent for phase ${String(phase)} — halting (exit 4).`,
    `#   A pass ended cleanly while a job it depends on was still running, and`,
    `#   specstride waited for that job with no model session open — but the wait hit`,
    `#   the yield's own deadline_sec, or the run's wall-clock budget, or the`,
    `#   attempt yielded more than SPECSTRIDE_YIELD_MAX_PER_ATTEMPT (default 4) times.`,
    `#   The job was LEFT ALONE, not killed: read its log first (named in the`,
    `#   yield_timeout event and in ${jobs}).`,
    `#     - if the job is simply slower than declared: raise that phase's`,
    `#       deadline_sec, or its pass ceiling (--proposer-timeout-phase ${String(phase)}=SECONDS)`,
    `#     - if the job is hung: fix the job; no budget here will help`,
    `#     - if the phase needs several long jobs in sequence, it is really several`,
    `#       phases — split it rather than raising SPECSTRIDE_YIELD_MAX_PER_ATTEMPT`,
    `#   Then: specstride resume -w ${workdir}`,
  ];
}

/**
 * The stop reason `proposer_cap_exhausted` — `>>> proposer hit the pass
 * ceiling repeatedly for phase <N> — halting (exit 4).` with the guidance
 * that names the checkpoints, the long job and the ceiling.
 */
export function capExhaustedEngineHaltingLines(
  phase: number,
  workdir: string,
  featureSlug: string,
  ceilingSec: number,
): readonly string[] {
  const checkpoints = `${workdir}/.specstride/features/${featureSlug}/pass-checkpoints`;
  return [
    `>>> proposer hit the pass ceiling repeatedly for phase ${String(phase)} — halting (exit 4).`,
    `#   SPECSTRIDE_PROPOSER_MAX_CAPS (default 3) consecutive passes were killed at the`,
    `#   absolute pass ceiling (--proposer-timeout). That is a BUDGET signal, not an`,
    `#   agent error: the passes may have been productive the whole time. This phase's`,
    `#   work does not fit one pass.`,
    `#   Read the newest checkpoint in ${checkpoints} first. Then, in`,
    `#   order of preference:`,
    `#     - make the long step outlive the pass instead of filling it: declare it as`,
    `#       a long job (--long-job-phase ${String(phase)} --long-job-cmd '...') so the pass reads its`,
    `#       result rather than waiting for it`,
    `#     - split the phase so each pass has a finishable unit of work`,
    `#     - only if the work genuinely IS one indivisible pass, raise the ceiling:`,
    `#       SPECSTRIDE_PROPOSER_TIMEOUT=${String(ceilingSec)} specstride resume -w ${workdir}`,
    `#   Note: those passes report no cost at all (a kill severs the provider stream),`,
    `#   so their pass_cost_unknown events — not a cost metric — are the honest record.`,
  ];
}
