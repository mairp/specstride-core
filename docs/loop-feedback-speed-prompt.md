# PROMPT: loop feedback speed — spec 153 (`specs/153-loop-feedback-speed`)

> Grounded on 2026-11-12. Every number, anchor and requirement id below is checked in
> `docs/prompts/2026-11-12-loop-speed-grounding-ledger.md`. Anchors are written as **symbol +
> range**, so an anchor that has drifted can be found again by its symbol. It is the shared study
> input of the three stage prompts
> `docs/prompts/2026-11-12-153-{1-constitution,2-specify,3-plan}.md`. The evaluation behind it is
> a local, uncommitted report (`.eval/`, ignored by git). This file carries everything from it
> that a stage needs, so no stage depends on the report.

The feature: remove the measured losses of the propose → verify → review → commit loop — **red
gates that name no failure, a critic that cannot see the work, a deterministic check that runs
after an opinion, a suite that runs twice on one tree — without giving up its governance**, by
fixing the feedback path first. Five capabilities, in the order of
work: (1) cheap, early, specific deterministic feedback; (2) the loop reports on itself;
(3) parallel and scoped checks with an enforced time limit; (4) per-task critic evidence with
carried-over confirmations; (5) task-group units with a real handoff between passes.

---

0a. study `specs/101-gate-and-verdict/spec.md` F101-FR-005, -011, -014, -017, -029, -033, -035,
    -052 and `specs/105-verification/spec.md` F105-FR-005, -006, -009, -020, -032, -033, -037 to
    learn the gate order, the reject count, the reuse ban and the failure summary that the spec
    already requires.
0b. study `specs/116-check-integrity-and-unit-evidence/spec.md` F116-FR-003, -005, -006, -008
    (tree fingerprint, `tainted`, `current`/`superseded`), `specs/148-check-runner/spec.md`
    F148-FR-003, -005, -007, -011…-017 (conditions, one runner, `verification.parallelism`),
    `specs/117-critic-grounding-and-prompt/spec.md` F117-FR-003…-012, -027, -030…-032 (the
    critic's input, and the verdict pins), and `specs/115-micro-loop-layer/spec.md` F115-FR-009,
    -013, -018, -022, -023, -027.
0c. study `specs/103-proposer-pass/spec.md` F103-FR-003, -041, -042, `specs/118-pass-supervision-and-jobs/spec.md`
    F118-FR-006, -011, `specs/111-event-schema-and-projection/spec.md` F111-FR-001, -004, -010,
    -016, -019, `specs/129-run-view-and-status/spec.md` F129-FR-001, -015, and the closed
    vocabularies in `specs/100-specstride/annexes/E-engine.md` §E.1 (attempt kinds), §E.2
    (blocked reasons), §E.3 (stop reasons, F100-FR-148) and §E.4 (exit codes), plus F100-FR-031
    (layers add no run state, exit code or stop reason).
0d. study `specs/152-commit-backpressure/spec.md` (F152-FR-001…-021). Spec 152 changes the same
    commit gate this feature moves. Its phases 2–3 are on `main`
    (PR #22, `b9e21809`: commit-gate backpressure, corrective blocks, and the 16th stop reason
    `commit_gate` in `packages/contracts/data/stop-reasons.json`, `b6d26882`); its later phases
    are still being built on branch `feat/152-commit-backpressure` (`/root/specstride-152`).
    Spec 153 builds on 152's requirements and its merged code, never on its unmerged code.
0e. study the code anchors (table below) with parallel read subagents. Before you claim something
    is missing, search for it (don't assume it is not implemented). Two of the five capabilities
    already exist as library code that the engine does not call.

1. Your task is the ONE stage your stage prompt names (constitution check, specify, or plan) for
   spec 153. Do that one stage and nothing else.
2. Subagents: **Sonnet** for reading and searching, **Haiku** for pure counting and grep, at most
   **4 in parallel**, each with a narrow brief and a word cap on its answer. Use **only 1
   subagent for any build, test or validation run**. The owner's token quota is shared with live
   runs, so a stage spends on research, not on fan-out.
3. Every claim you write must carry its anchor: a requirement id, `file:symbol:range`, a count
   from the ledger, or a cited URL. If you can't anchor a claim, write it as an open question
   (`CQ-153-nn`).
4. Record learnings as you go, briefly, in `specs/153-loop-feedback-speed/research.md` under
   "Learnings".

---

## Background: why (measured on feature 152, 9–12 November 2026)

Feature 152 is the engine building itself (`/root/specstride-152`, workspace
`~/.specstride/workspaces/94f747a310013d36`). Re-measured on 2026-11-12 at about 17:50, while
phase 4 was still live. Numbers that move with the live run are marked "≥".

| Measure | Value |
| --- | --- |
| Phases approved | 3 of 7, on attempts 12, 11 and 13 |
| Closed attempts | 37 of 84 started (47 have no closing event); 20.8 h; median 26.7 min |
| In-pass `npm test` checks (`check.ended`) | ≥ 56, 28 failed, median 365 s, 7.56 h; 279–706 s plus one of 6,421 s (107 min) |
| Passes that ran the full 45 minutes (from `runtime.log` banners) | 23 passes, 17.3 h |
| Rejection notices | ≥ 36 |
| … red gate, critic never called | 17, all the same 212 bytes ("- npm test FAILED") |
| … critic: the work is missing or wrong | 7 |
| … critic: "no diff shows it" / "no evidence" | 8 |
| … commit gate blocked a critic-approved attempt | 4 (`cg-sk-prefix` ×2 in `tasks.md`, `cg-url-embedded-credentials` ×2 in a test fixture) |
| Tasks per phase | 8, 39, 41, 26, 29, 17, 13 |
| Phase 2 critic verdicts, rejections 4 / 6 / 7 | 38 MET 1 UNMET / 1 MET 38 UNMET / 38 MET 1 UNMET |
| Diagnostician | 24 calls, median 54 s |

Elsewhere: feature 151 phase 2 is at ≥ 15 rejections and feature 150 phase 10 took 4 attempts
(`~/.specstride/workspaces/002a79217166a359`). Of the ≥ 36 rejections, at most 7 were the critic
finding real missing or wrong work. The rest are loop mechanics: a blind red gate, a critic that
could not see the work, a deterministic check that ran after an opinion.

The repository's own feedback speed is part of every attempt, because the gate is the
repository's test command: CI run 43131798853 spent 5 min 43 s in `npm test`. `scripts/ci-test.mjs`
runs 32 workspaces (30 packages plus 2 tools) one after another, on a 22-core host.

The principle, in Huntley's words (verified in `docs/prompts/2026-11-08-huntley-grounding-ledger.md`
E3, https://ghuntley.com/ralph/): "Anything can be wired in as back pressure to reject invalid code
generation… But the key collective sum is that the wheel has got to turn fast." Here the wheel is
slow because the unit of work is a whole phase, and every form of feedback on that unit is slow,
late or blind.

## Current behaviour and code anchors (verified 2026-11-12, `main` @ `efe8897f`)

| # | What happens today | Anchor |
|---|---|---|
| A1 | The gate command is the literal `npm test` when `package.json` has `scripts.test`, otherwise the gate is off. It is not the manifest's command | `packages/cli/src/engine/run-feature.ts` `checkCommandOf` :601-606 |
| A2 | The gate runs `spawnSync("sh", ["-c", check])` with **no timeout**. A comment says "a result of an earlier run is never accepted". It consults no fingerprint | `run-feature.ts` `runVerificationGate` :2819-2841 |
| A3 | The micro layer already records a tree fingerprint per check (`lastPassedTreeFingerprint`, `results[].treeAfter`, the `changed-during-check` taint in `micro/phase<N>.json`). Its own closing check skips a re-run on an equal tree | `run-feature.ts` `workingTreeFingerprint` :496; `packages/cli/src/engine/micro-layer.ts` `runCheckCommand` :313-350, `closingCheck` :551-573 |
| A4 | The manifest timeout (300 s) reaches `spawnSync({timeout})` as a SIGTERM to the direct child only (`shell: false`). There is no process-group kill and no SIGKILL escalation, so grandchildren keep the pipes open, and `SPECSTRIDE_LIMITS=off` drops it. The check-runner service spawn has no timeout | `packages/check-runner/src/command/lisa-executor.ts` `execute` :76-101; `run-feature.ts` check-runner service :1971-1975 |
| A5 | A red gate's notice is a heading, "The verification gate failed in mode `required`, so the critic was not called.", and `- npm test FAILED`. The 4,000-character output tail `checkOutput` is captured but goes only into the critic's evidence | `packages/core/src/gate/feedback.ts` `feedbackOfTheVerificationGate` :405-433; `run-feature.ts` `checkOutput` :2796, :2826, :2932 |
| A6 | The failure summary F105-FR-037 requires (`### <commandId> — exit <code>`, "Failing assertions / tests:", stdout and stderr tails 80 and 40) **exists as library code but is not wired into the gate feedback** | `packages/verification/src/summary/failure-summary.ts` (`DEFAULT_TAIL_LINES`, `DEFAULT_TAIL_ERR_LINES`) |
| A7 | A red gate is a rejection kind (`gate-failed`) and spends one of the 3 phase attempts | `packages/core/src/gate/limits.ts` `REJECT_LIMIT_DEFAULT` :66, `gate-failed` :119, `afterARejection` :424-462; `packages/core/src/engine/phase.ts` `runPhaseAttempts` :416-455; bridge `run-feature.ts` :3339-3360 |
| A8 | Order: verification gate → critic → approval → tick → commit gate. The commit gate is a closure inside `runFeature` (it also mutates `commitsBlocked`), so no proposer can run it in a pass | `packages/core/src/gate/phase-gate.ts` `runPhaseGate` :200-333; `run-feature.ts` call :2800, `callTheCritic` :2842, `scanBeforeTheCommit` :1785-1807, `commitPorts` :3274-3279; `packages/core/src/post-approval/order.ts` |
| A9 | The critic sees `git diff HEAD` plus untracked content, cut at `CHANGE_CAP_BYTES = 200_000`. New files over `NEW_FILE_CAP_BYTES = 40_000` are named but not shown | `run-feature.ts` :290, :293, `changeOf` :536-557 |
| A10 | The verdict is phase-level (`unmetCriteria` plus its signature). The verdict pins of F117-FR-030…-032 (criteria confirmed earlier against the same file hash, "PREVIOUSLY CONFIRMED (W9 verdict pins)") **exist as library code but the engine never calls them** | `packages/core/src/critic-input/pins/store.ts` (`specstride.verdict-pins/1`); `packages/core/src/ep18/history.ts` :115-120 |
| A11 | Every pass is a fresh session. `PROPOSER_LIMIT_MS` (45 min) is a **floor**: `max(45 min, ceiling + kill grace)`. The watchdog's `hard_cap` kill writes a kill note whose detail can be one line ("exit 0; 0 processes in the tree;") | `run-feature.ts` `PROPOSER_LIMIT_MS` :261, `proposerLimitMsOf` :270-274, watchdog :2288-2317, `carryTheKillNoteIntoThePrompt` :2171-2183; `packages/core/src/pass-supervision/kill-note/index.ts` `renderKillNote` :85-115; `packages/adapter-claude/src/session.ts` `mintSessionId` :49-52; `packages/core/src/pass-loop/loop.ts` `EVERY_PASS_IS_FRESH_UNDER_PARITY` :113 |
| A12 | A micro unit is the set of task ids the proposer claims in its checkpoint, not a slice made at derive time. Phase size only feeds the cycle cap `max(n+6, 12)` | `micro-layer.ts` :72-80, :409-440; `packages/layer-micro/src/caps/exemptions.ts` :112 |
| A13 | The engine emits no start or end for the gate or the critic, although the F111 catalogue already defines such types. The commit-gate events of spec 152 are emitted through `packages/core/src/gate/events.ts` (corrected in stage 2). No CLI command aggregates timings: `cli/src/commands` has no `report`, and `cli/src/inspect` has `tail-events`, `verdicts`, `phases`, `watch` | `run-feature.ts` `emit` calls; `packages/layer-micro/src/report/events.ts` `attemptStarted` :125; `packages/check-runner/src/events/check-events.ts` `CHECK_ENDED_FIELDS` :55-65 |
| A14 | The diagnostician runs when the unmet-criteria signature changes, one call per signature and phase | `packages/core/src/recovery/markers.ts` `aDiagnosisIsDue` :187-193 |
| A15 | The import-boundary tool reads a **static** package graph (`packages/contracts/data/package-graph.json`). It builds none from code, so a reverse-dependency walk over that file is the seam for scoped tests | `tools/import-boundary/src/index.ts` :139-151; `tools/import-boundary/src/rules.ts` `loadGraph` |
| A16 | Test isolation: each workspace runs in a PID namespace (`tests/isolate.ts`, softdog safety) with `maxBuffer: 1 << 30`. Parallel runs must keep both | `scripts/ci-test.mjs` :16-42 |
| A17 | `runFeature` is lines 946–3650 of a 3,650-line file, with 52 `../../../<pkg>/src` imports (36 into `core`). `core/src/pass-loop/loop.ts` injects effects but is an effectful loop, not a pure state machine | `run-feature.ts`; `loop.ts` :394-545 |

## Requirements this feature presses on (verified)

| Area | Today's rule | Anchor |
|---|---|---|
| Reuse | "No result of an earlier run of a check MUST stand in for the verification gate"; reuse only for `prestage` results; "with a loop layer engaged nothing is reused" (DV-012) | F101-FR-005, F105-FR-033 |
| Integrity | Every result is bound to the tree fingerprint it ran on (`current`/`superseded`); `tainted` is never a pass; `cached` is no pass | F116-FR-005, -006, -008; F148-FR-003 |
| Reject count | A failed gate is a rejection with result code 10 and counts toward the reject limit (default 3). Only REJECTED counts toward K | F105-FR-005, F101-FR-014, F149-FR-004 |
| Feedback | Engine-written gate feedback with "## What actually failed"; failure summary with failing lines first; all outside text through the single ingress, redacted and capped | F105-FR-006, F105-FR-037, F101-FR-052, F100-FR-009 |
| Order | "pass loop ended and phase evidence exists; then the verification gate; then the critic; then the approval record". Spec 152 moves the commit gate before the approval record behind one switch, off under `parity` | F101-FR-005, F101-FR-033, F152-FR-021 |
| Critic input | No count, check output, earlier check result, tier, session or routing decision; the pins are the only sanctioned carry-over | F117-FR-027, F117-FR-030…-032, F116-FR-016…-019 |
| Unit | One approval and one commit per approved phase; a micro unit is a checkpoint claim; layers add no run state, exit code or stop reason | F101-FR-011, -029, -035; F115-FR-009; F100-FR-031 |
| Passes | Fresh session per pass under `parity`; a ≤ 6 KB handoff `feature:<slug>:handoff`, regenerated each pass and never read back | F103-FR-003, F103-FR-041 |
| Checks in parallel | `verification.parallelism` default 1, ceiling 4, batches from declared read and write scopes; changed-file test selection: none | F148-FR-011…-016 |
| Events | Versioned catalogue; open/close pairs; `attempt.ended` `endCause` is a closed set; events hold no content; best effort | F111-FR-001, -004, -010, -016, -019 |
| Status | `status` and `wait` are pure projections and write no file | F129-FR-001, -015 |

## Required behaviour (design to this)

1. **Cheap, early, specific deterministic feedback** (report items 1, 2, 5).
   a. *Reuse a green check by fingerprint.* The gate may stand on an in-pass result only when the
      same pinned argv ran through the same runner on an equal tree fingerprint, untainted, and
      `current`. Today the gate's command (A1) and the manifest's are not the same object, so
      unify them first. This amends F101-FR-005 and F105-FR-033, so it needs a ruling.
   b. *Red-gate notices with the failure.* Wire the failure summary F105-FR-037 already requires
      (A6) into the gate feedback, through the single ingress, capped. Keep the tail out of the
      hashed verification record (A5).
   c. *A red gate is not a critic rejection.* It still spends a bounded budget (a separate
      gate-red limit, or the reject limit with a different ordinal kind). The run must not gain
      an unbounded loop. Needs a ruling against F101-FR-014 and F105-FR-005.
   d. *Commit gate before the critic.* Run the deterministic commit scan on the candidate change
      before the critic is called. Expose the same scan to the proposer as a command it can run
      in the pass. This builds on F152 and must not contradict F152-FR-001…-021.
   e. *Enforce the check time limit.* A process-group kill with SIGKILL escalation on every check
      path (gate, micro layer, check-runner service), bounded even under `SPECSTRIDE_LIMITS=off`
      or with a recorded reason why not.
2. **The loop reports on itself** (report item 7). Timed open and close events for the gate, the
   critic and the commit gate; an `attempt.ended` for every started attempt with its cause; and a
   read-only `specstride report` that prints the measurements table above from the event stream
   alone. New event types go into the F111 catalogue as versioned additions. The report writes
   no file (F129 precedent).
3. **Parallel and scoped checks** (report item 3). Run test workspaces in parallel, keeping the
   PID-namespace isolation (A16). Select the workspaces a change touches by a reverse-dependency
   walk of the static graph (A15) for **in-pass** checks only. The approval gate keeps the full
   declared suite, unless a ruling says otherwise. Scoping narrows; it never widens or invents a
   command (Principle XIV).
4. **Per-task critic evidence and carried confirmations** (report item 4). Wire the verdict pins
   F117-FR-030…-032 (A10). Give the critic per-task evidence read from the tree (the files and
   tests a task names) instead of a capped whole diff (A9). The verdict stays the critic's, and
   it stays fresh: a pin only tells the critic what was confirmed against an unchanged hash.
5. **Task-group units with a handoff** (report items 3 and 6). Slice a phase into groups of a few
   tasks at derive time. Each group carries its write scope and an executable acceptance check.
   The group is the unit that is checked and reviewed. Whether it is also the unit of approval
   and commit is a ruling (F101-FR-011/-029/-035, FX-27). Between passes the next pass gets the
   F103-FR-041 handoff: tasks done, tasks open, the last failing output (check first whether the
   handoff is wired).

Every new behaviour is off under the `parity` profile until a register row and a ruling turn it
on (Principle XVIII), and each has its own switch. Two are not new: the failure summary (1b,
F105-FR-006/-037) and the verdict pins (4, F117-FR-030…-032) are ported baseline requirements
that the engine does not wire, so wiring them restores parity and they are on under `parity`
(corrected by stage 1, `specs/153-loop-feedback-speed/constitution-grounding.md` "Profiles").

## Constraints and locks

- **Governance stays.** Separate critic; nonce-bound verdicts; signed approval records; one
  commit per approval; the single ingress; "Models propose; the engine disposes."
- **NON-NEGOTIABLE principles** II, III and XVIII cannot be justified away. Any tension on them
  is resolved by design or raised as a proposed amendment (`CQ-153-nn`), never recorded as a
  deviation.
- **Closed vocabularies** (stop reasons F100-FR-148, exit codes, attempt kinds §E.1, blocked
  reasons §E.2, `endCause`, kill reasons F118-FR-007) change only by an owner ruling.
- **No speed-up estimates** that the data cannot derive. "This removes N of M rejected attempts
  in run X" is fine. "3× faster" is not.
- **Spec 152 first.** Item 1d depends on F152. State the dependency; do not re-specify 152.

## Out of scope (tracked follow-ups, not this spec)

- Moving the attempt loop into `core` as a pure state machine (A17). This feature must not make
  that move harder, and it names the seams it adds.
- Running the critic and the full suite **alongside** the next group, with a roll-back to the
  group's commit. It is only safe once groups are small and checks are scoped.
- Calling the diagnostician on repetition only (A14). It costs 0.4 h in the sample.

## Limits of the evidence

One large feature on the engine's own repository (the worst case for suite time), plus ledgers of
150 and 151. The live runs use the installed build under `/usr/lib/node_modules/specstride`,
which is behind `main` (PRs #26–#28 are newer). The critic split between "missing or wrong" and
"no evidence" is a manual reading. The split of gate time and critic time is not in the records
(A13). Small trial features on this host mostly pass in zero to three rejections.

## Deliverables (homed in `specs/153-loop-feedback-speed/`)

Stage 1: `constitution-grounding.md`. Stage 2: `spec.md`, `checklists/requirements.md`,
`research.md` (Learnings). Stage 3: `plan.md`, `research.md` (appended), `data-model.md`,
`contracts/`, `quickstart.md`. No `tasks.md`.
