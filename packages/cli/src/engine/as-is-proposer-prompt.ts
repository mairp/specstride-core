/**
 * F153-FR-061 (`parity` profile) — the AS-IS PROPOSER prompt.
 *
 * Under the `parity` profile the standing prompt of a proposer pass is the
 * as-is launcher's own template, byte for byte, and not this engine's prompt
 * composition: the parity golden captures the transcript record the as-is `dsh`
 * child received, and the template's fixed lines — the working-directory
 * contract, the atomic-evidence instructions, the evidence contract the critic
 * grounds against, and the YIELD section — are part of what the six parity
 * subtests (CT-153-61) compare. The variable parts are the working directory,
 * the feature slug, the phase number and its title, the attempt ordinal, the
 * run id (which names the yield artifact), the phase's own task section, and
 * the phase context of the verification plan (empty where the plan has no gate
 * for the phase — the as-is engine left the block out entirely there).
 *
 * Two deliberate omissions, each one the as-is behaviour and not a loss:
 *  - the as-is proposer prompt carried NO critic-rejection feedback and NO
 *    diagnostician hint; the as-is engine carried both only in the
 *    accelerator's own prompt, so the parity composition carries neither;
 *  - the line breaks of the fixed paragraphs are the as-is template's own,
 *    which is why the interpolation reads mid-line: the as-is template held
 *    its breaks at fixed columns around the paths it spelled out.
 *
 * The verification context arrives as ready text (`renderPhaseContext` of
 * `@specstride/verification` — the as-is phase context, F105-FR-025); this
 * module only places it.
 */
import { join } from "node:path";

/** The input of the as-is proposer prompt of one attempt. */
export type AsIsProposerPromptInput = {
  /** The working directory of the run, as the pass's cwd spells it. */
  readonly workdir: string;
  /** The feature slug, as every `.specstride/features/<slug>` path spells it. */
  readonly slug: string;
  /** The phase the attempt implements (1-based). */
  readonly phase: number;
  /** The attempt ordinal within the phase (1-based). */
  readonly ordinal: number;
  /** The id of the run, which names the yield artifact of the template. */
  readonly runId: string;
  /**
   * The phase's own section of the task list, from its `## Phase N — Title`
   * heading through its acceptance criteria — the text the template places
   * under `## Acceptance criteria (the phase spec)`.
   */
  readonly phaseSection: string;
  /**
   * The phase context of the verification plan (`renderPhaseContext`), or the
   * empty string where the plan has no gate for the phase.
   */
  readonly verificationContext: string;
  /**
   * The PRIOR-REJECTION block of the as-is launcher (absent on a first
   * attempt with no rejected attempt behind the phase): when a previous
   * attempt of the phase was REJECTED, the as-is proposer prompt carries the
   * rejection — the heading with the attempt ordinal against the reject
   * limit, the feedback of the newest rejection in full under its gates
   * path, and one line per archived attempt with the reason the feedback
   * gave — between the criteria section and the yield section.
   */
  readonly priorRejection?: {
    /** The ordinal of THIS attempt (1-based), as the heading spells it. */
    readonly attempt: number;
    /** The reject limit of the loop, as the heading's `of <N>` spells it. */
    readonly ofAttempts: number;
    /** The gates path of the evidence the re-write targets. */
    readonly evidencePath: string;
    /** The gates path the feedback is quoted from. */
    readonly feedbackPath: string;
    /** The full text of the newest feedback (ends on its own blank line). */
    readonly feedbackText: string;
    /** One line per archived attempt: `- attempt<N>: <reason>`. */
    readonly earlier: readonly string[];
  };
};

/** The heading the acceptance section stands under (an as-is literal). */
const CRITERIA_HEADING = "## Acceptance criteria (the phase spec)" as const;

/**
 * The prompt, byte for byte as the as-is launcher assembled it. The evidence
 * path, the proofs folder and the yield artifact are spelled out of `slug`,
 * `phase`, `ordinal` and `runId` exactly where the template repeats them.
 */
export function asIsProposerPrompt(input: AsIsProposerPromptInput): string {
  const slug = input.slug;
  const phase = String(input.phase);
  const featureDir = `.specstride/features/${slug}`;
  const gatesDir = `${featureDir}/gates`;
  const evidence = `${gatesDir}/GATE${phase}-EVIDENCE.md`;
  const taskHeading = input.phaseSection.split("\n", 1)[0]?.replace(/^##\s+/, "") ?? "";
  const yieldArtifact =
    `${featureDir}/yield/phase${phase}-attempt${String(input.ordinal)}-${input.runId}.json`;

  const head = [    "You are the PROPOSER in an automated spec-driven loop. Do the work for",
    "ONE phase, then write its evidence and STOP.",
    "",
    "## Working directory",
    `You are operating in: ${input.workdir}`,
    `Maintain your progress notes in ${featureDir}/PROGRESS.md (done / verified /`,
    "blocked / next). Read it FIRST each pass; never redo verified work. Keep the",
    `workdir ROOT clean — all your bookkeeping goes under ${featureDir}/, not here`,
    `(gate evidence/feedback files live in ${gatesDir}/).`,
    "",
    `## Your task: ${taskHeading}`,
    "Implement everything the phase requires so that EVERY acceptance criterion",
    "below is genuinely satisfied. A separate automated critic will verify your",
    "evidence against these criteria and will reject unsupported claims.",
    "",
    "## When (and only when) the phase is truly done",
    `Write your evidence to ${evidence} (path relative to the`,
    `workdir; the ${gatesDir}/ folder already exists). Write it ATOMICALLY: write`,
    `${evidence}.tmp first, then \`mv\` it onto`,
    `${evidence} (mv within the same folder is atomic, so the`,
    "gate never sees a half file).",
    "The evidence must, for EACH acceptance criterion, state concretely how it is",
    "met and cite the exact files/paths that prove it. Do NOT write the evidence",
    "file until the work is actually complete — its mere existence ends this phase.",
    "",
    evidenceContractBlock(gatesDir),
    "",
    CRITERIA_HEADING,
    input.phaseSection.replace(/\n+$/, ""),
  ].join("\n");

  const verification =
    input.verificationContext === "" ? "" : `\n\n${input.verificationContext.replace(/\n+$/, "")}`;

  // The as-is launcher's prior-rejection block: present only when a previous
  // attempt of the phase was rejected, always between the criteria section
  // and the yield section.
  const rejection = input.priorRejection === undefined ? "" : priorRejectionBlock(input.priorRejection);

  const yield_ = yieldBlock(input.workdir, yieldArtifact);

  return head + rejection + verification + yield_;
}

/**
 * The as-is launcher's prior-rejection block, byte for byte: the heading with
 * the attempt ordinal against the reject limit, the fixed two-and-a-half-line
 * admonition, the newest feedback quoted in full under its gates path, and
 * the `### Earlier attempts` list of every archived attempt's reason.
 */
function priorRejectionBlock(input: NonNullable<AsIsProposerPromptInput["priorRejection"]>): string {
  return [
    "",
    "",
    `## A PRIOR ATTEMPT WAS REJECTED — this is attempt ${String(input.attempt)} of ${String(input.ofAttempts)}`,
    "The critic rejected your last evidence. Read the feedback below and address",
    `EVERY point before re-writing ${input.evidencePath}. Do not merely`,
    "reassert; fix the actual gaps.",
    "",
    `### Critic feedback (${input.feedbackPath})`,
    `${input.feedbackText}### Earlier attempts were already rejected for THESE reasons — do NOT repeat those fixes`,
    ...input.earlier,
  ].join("\n");
}

/**
 * The AS-IS EVIDENCE CONTRACT of a proposer-class prompt (B-0876's fixed
 * lines): what the critic grounds against. Shared by the proposer prompt and
 * the accelerator's own prompt, which carry it word for word.
 */
function evidenceContractBlock(gatesDir: string): string {
  return [
    "## Evidence contract — READ THIS or your evidence will be rejected despite correct code",
    "A separate automated CRITIC judges ONLY (a) this evidence file and (b) a",
    "read-only grounding snapshot of the files you CITE. It cannot browse the repo.",
    "So for EVERY acceptance criterion that names a file and/or a symbol:",
    "  1. Cite THAT exact file path in your evidence (a workdir-relative path with a",
    "     slash, e.g. `packages/sdk/src/resilience.ts`, not a bare method name).",
    "  2. Stage a LINE-NUMBERED proof slice of that file showing the exact symbols",
    `     the criterion names, under ${gatesDir}/proofs/ (e.g.`,
    "     `sed -n '52,78p' packages/sdk/src/resilience.ts` piped through `nl -ba`,",
    "     or `grep -n`), and cite the proof file. Quote the symbol, not just its",
    "     surrounding function — the critic greps your cited file for that symbol.",
    "How the critic's snapshot works (write evidence it can actually ground):",
    "  - Files your criteria NAME are shown with ANCHORED excerpts: ±15 line-numbered",
    "    lines around each named symbol. So naming the symbol in the criterion (and",
    "    ensuring it appears verbatim in the cited file) is what makes it verifiable —",
    "    a mid-file implementation IS reachable this way; a vague citation is not.",
    "  - There is a per-snapshot byte budget. A snapshot line 'content excerpt",
    "    omitted — grounding byte budget reached' means the file was VERIFIED PRESENT;",
    "    it is NOT a missing file. Criterion-named files are never omitted, so cite",
    "    the precise path the criterion is about rather than dozens of tangential ones.",
    "  - Cite files by real relative paths. Do NOT cite RPC method names (`jobs.run`,",
    "    `events.subscribe@v1`) as if they were files — they are not, and the critic",
    "    ignores them.",
  ].join("\n");
}

/** The AS-IS YIELD section the proposer-class prompts end in (feature 118). */
function yieldBlock(workdir: string, yieldArtifact: string): string {
  return [
    "",
    "",
    "## If this phase depends on a job that cannot finish inside one pass: YIELD",
    "Do NOT sleep, poll, tail, or `until ... done` your way through a long job.",
    "Waiting inside a pass costs a full context rebuild per pass and gets the pass",
    "killed at the ceiling — which also kills the job, because a job you start from",
    "your own Bash tool lives in the pass's process tree.",
    "Instead, END THE PASS and let specstride do the waiting with no model session open.",
    "Write this file ATOMICALLY (tmp then `mv`), then STOP without writing evidence:",
    `  ${workdir}/${yieldArtifact}`,
    "```json",
    '{"contract": "specstride-pass-yield/v1",',
    ' "reason": "one line: what you are waiting on and why the evidence needs it",',
    ` "job": {"mode": "launch", "argv": ["/usr/bin/make", "live"], "cwd": "${workdir}"},`,
    ' "resume_when": {"kind": "exit_code_file"},',
    ' "deadline_sec": 7200,',
    ' "on_resume": "exactly what the next pass should do with the result"}',
    "```",
    '- `job.mode`: "launch" (PREFERRED — specstride starts it in its own session, where no',
    '  pass kill can reach it) or "adopt" with `pid: N` if you already started it',
    "  under `setsid`. An adopt naming a pid in this pass's own session is REFUSED.",
    "- `resume_when.kind`: exit_code_file (defaults to the rc file specstride writes for a",
    "  job it launched) | pid (defaults to the job it launched) | file_exists |",
    "  file_stable (+ `stable_sec`) | grep (+ `path`, `pattern`).",
    "- `deadline_sec` is REQUIRED — the run holds this workdir for the whole wait.",
    "- `on_resume` is handed back to you verbatim next pass, with the job's exit code",
    "  and a bounded slice of its log. Say what you will do with them.",
    "A yield is not a failure: it does not count as an error, it is not a stall, and",
    "by default it does not even burn an iteration. Yielding on a 90-minute job is",
    "the CORRECT move; waiting for it inside the pass is the expensive one.",
  ].join("\n");
}

/**
 * F153-FR-061 (`parity` profile) — the AS-IS SHORT-PASS NUDGE.
 *
 * The nudge the as-is `proposer.sh` appended to the prompt of the pass that
 * follows two short passes in a row (B-0651, feature 118's `short_pass_nudge`
 * block): the heading, the four-line admonition, the as-is yield artifact of
 * the CURRENT attempt (`yield/phase<N>-attempt<M>-<run id>.json`, a file the
 * engine has not written yet — the nudge names where it WOULD go), the sample
 * document in the as-is one-line form with the `adopt`/pid shape, and the
 * three closing sentences. The golden capture of feature 141 is the authority
 * for the bytes; the engine's own nudge (`shortPassNudgeBlock` of feature 118)
 * stands everywhere but the `parity` profile.
 */
export function asIsShortPassNudgeBlock(input: {
  readonly workdir: string;
  readonly slug: string;
  readonly phase: number;
  readonly ordinal: number;
  readonly runId: string;
  readonly consec: number;
  readonly shortPassSec: number;
  /** The pid of the pass that just ended, which the sample document adopts. */
  readonly pid: number;
}): string {
  const yieldArtifact = join(
    ".specstride",
    "features",
    input.slug,
    "yield",
    `phase${String(input.phase)}-attempt${String(input.ordinal)}-${input.runId}.json`,
  );
  return [
    `## You have ended ${String(input.consec)} passes in a row within ${String(input.shortPassSec)}s without evidence`,
    "Each of those passes cost an iteration of this attempt. If you are ending passes to",
    "WAIT for a job that is still running, stop doing that: end THIS pass with a YIELD so",
    "specstride waits with no model session open and gives the iteration back.",
    "Write this file atomically (tmp then `mv`), then stop without writing evidence:",
    `  ${input.workdir}/${yieldArtifact}`,
    "```json",
    '{"contract": "specstride-pass-yield/v1",',
    ' "reason": "one line: what you are waiting on and why the evidence needs it",',
    ` "job": {"mode": "adopt", "pid": ${String(input.pid)}},`,
    ' "resume_when": {"kind": "pid"},',
    ' "deadline_sec": 7200,',
    ' "on_resume": "exactly what the next pass should do with the result"}',
    "```",
    'Use `"mode": "launch"` with an `argv` to have specstride start the job itself, or',
    '`"adopt"` with the pid of a job you already started under `setsid`. `resume_when.kind`',
    "can also be exit_code_file, file_exists, file_stable or grep (+ `path`, `pattern`).",
    "`deadline_sec` is REQUIRED and must cover the whole wait.",
  ].join("\n");
}

/**
 * F153-FR-061 (`parity` profile) — the AS-IS ACCELERATOR prompt.
 *
 * The prompt of an ACCELERATED phase attempt, as the as-is engine assembled it
 * for the pass the accelerator runs: its own head paragraph, the working
 * directory contract of the acceleration (progress notes + one `acceleration`
 * entry), the UNMET criteria banner over the NARROWED phase section (headings
 * and the lines that name an unmet id — `narrowedPhaseSection` of feature 101
 * gives the same narrowing), the critic feedback and the diagnostician hint
 * under their as-is headings, the footprint rule, the as-is evidence contract,
 * the splice instruction over the archived evidence of the attempt before, and
 * the as-is yield section. The golden capture of feature 141 is the authority
 * for the bytes; the block-set prompt of feature 101 stands everywhere but the
 * `parity` profile.
 */
export function asIsAcceleratorPrompt(input: {
  readonly workdir: string;
  readonly slug: string;
  readonly phase: number;
  readonly ordinal: number;
  readonly rejectLimit: number;
  readonly runId: string;
  /** The phase's own section, from which the narrowed section is cut. */
  readonly phaseSection: string;
  /** The ids still unmet, which the narrowing keeps lines for. */
  readonly unmetIds: readonly string[];
  /** Whether the signature names task ids at all (no ids: the whole section). */
  readonly signatureNamesTaskIds: boolean;
  readonly feedback: string;
  readonly hint: string;
  /**
   * The workdir-relative path of the newest archived evidence of the phase
   * (`attempts/phase<N>/attempt<M>/GATE<N>-EVIDENCE.md`).
   */
  readonly newestArchivedEvidence: string;
}): string {
  const phase = String(input.phase);
  const featureDir = `.specstride/features/${input.slug}`;
  const gatesDir = `${featureDir}/gates`;
  const evidence = `${gatesDir}/GATE${phase}-EVIDENCE.md`;
  const title = input.phaseSection.split("\n", 1)[0]?.replace(/^##\s+/, "") ?? "";
  const narrowed = input.signatureNamesTaskIds
    ? input.phaseSection
        .split(/\r\n|\n|\r/)
        .filter((line) => {
          const trimmed = line.trim();
          if (trimmed.startsWith("#")) return true;
          return input.unmetIds.some((id) => id !== "" && line.includes(id));
        })
        .join("\n")
    : input.phaseSection.replace(/\n+$/, "");
  const yieldArtifact = `${featureDir}/yield/phase${phase}-attempt${String(input.ordinal)}-${input.runId}.json`;

  const head = [
    "You are the ACCELERATOR in an automated spec-driven loop. A previous attempt at",
    "this phase was REJECTED on a SMALL set of criteria, and a diagnostician (a",
    "second reviewer that saw the full, untruncated files) has already worked out",
    "why. Your job is NARROW: fix exactly those criteria, restage their proof,",
    "splice the previous evidence, then STOP. Do not re-verify or rework the rest.",
    "",
    "## Working directory",
    `You are operating in: ${input.workdir}`,
    `Progress notes live in ${featureDir}/PROGRESS.md — read it FIRST, and append one`,
    "short 'acceleration' entry when done. Keep the workdir ROOT clean — all your",
    `bookkeeping goes under ${featureDir}/, not here.`,
    "",
    `## ${title}: the criteria still UNMET`,
    "Only these criteria were rejected. Everything else in the phase is already",
    "confirmed and pinned — its code and its evidence must be left exactly as is.",
    "",
    narrowed,
    "",
    `## Critic feedback (${gatesDir}/GATE${phase}-FEEDBACK.md) — what must become true`,
    input.feedback.replace(/\n+$/, ""),
    "",
    "",
    `## Diagnostician hint (${gatesDir}/GATE${phase}-HINT.md) — your PRIMARY instruction`,
    "It was written with the full files in view and usually contains the exact fix.",
    "Apply it unless the code proves it wrong; if it IS wrong, do the right fix and",
    `say why in ${gatesDir}/GATE${phase}-ACCELERATOR-NOTE.md (a short, optional note —`,
    "also use it for anything you could not finish). A `CASE: GROUNDING` hint means",
    "the code is fine and only the proof slice / citation needs restaging.",
    input.hint.replace(/\n+$/, ""),
    "",
    "",
    "## Footprint rule — touch ONLY what the unmet criteria and the hint cite",
    "Confirmed criteria are pinned to a content hash of their backing files. Editing",
    "an unrelated file drops those pins and re-opens criteria that already passed —",
    "the exact non-convergence this pass exists to avoid. Run the tests that cover",
    "the files you change; do not reformat, rename, or tidy anything else.",
    "",
    evidenceContractBlock(gatesDir),
    "",
    "## Evidence: splice, don't rewrite",
    "The previous (rejected) evidence is archived at:",
    `  ${input.workdir}/${input.newestArchivedEvidence}`,
    `Read it. Produce the new ${evidence} by copying it and`,
    "replacing ONLY the sections for the unmet criteria above (fresh, line-numbered",
    `proof slices under ${gatesDir}/proofs/). Every other section stays byte-for-byte.`,
    `Write it ATOMICALLY: ${evidence}.tmp first, then \`mv\` it onto`,
    `${evidence}. Its existence ends this pass, so write it LAST,`,
    "after the code change and its tests are done.",
    `This is attempt ${String(input.ordinal)} of ${String(input.rejectLimit)} for this phase.`,
  ].join("\n");

  return head + yieldBlock(input.workdir, yieldArtifact);
}
