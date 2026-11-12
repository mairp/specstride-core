/**
 * T171 — the resume re-scan predicate of the commit gate (F152-FR-014; plan.md,
 * "The residual and resume case").
 *
 * The engine died after an approval record was written and before the steps
 * after the approval ran. At the next start, ONE engine-start step asks this
 * pure predicate whether the pending approval has to be re-scanned by the
 * commit gate before it is honoured. It is true only when ALL SIX hold:
 *
 * | Flag | What it asks |
 * |---|---|
 * | `approved` | the record of the phase verifies (F101-FR-031) |
 * | `boundCommit` | the bound record carries no `commit` — the approval never committed |
 * | `switchOn` | the commit backpressure switch is on (F152-FR-021) |
 * | `commits` | the approval commit is enabled (`auto`) |
 * | `insideAWorkTree` | the workspace lies inside a git work tree |
 * | `changed` | the working tree holds changes |
 *
 * The predicate decides NOTHING else: the composition root calls it, runs
 * `commitGate` where it is true, and handles the block. It is a pure function
 * of the six flags, so it is tested without a workspace (T170).
 */

/** The six flags the predicate reads, as the composition root reports them. */
export type MustReScanOnResumeInputs = {
  readonly approved: boolean;
  /** True where the bound record has NO `commit` (the approval never committed). */
  readonly boundCommit: boolean;
  readonly switchOn: boolean;
  readonly commits: boolean;
  readonly insideAWorkTree: boolean;
  readonly changed: boolean;
};

/**
 * T171 — re-scan the pending approval at a resume only when all six hold.
 */
export function mustReScanOnResume(inputs: MustReScanOnResumeInputs): boolean {
  return (
    inputs.approved === true &&
    inputs.boundCommit === true &&
    inputs.switchOn === true &&
    inputs.commits === true &&
    inputs.insideAWorkTree === true &&
    inputs.changed === true
  );
}
