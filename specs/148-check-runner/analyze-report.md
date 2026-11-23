# Specification Analysis Report: Check runner (feature 148)

Date: 2026-09-29. Artifacts: `spec.md`, `plan.md`, `tasks.md`, with `research.md`,
`data-model.md`, `quickstart.md` and `contracts/`. Constitution v3.0.0. The feature was split
from `105-verification`. Two runs: the first found the row marked "repaired".

## Findings

| ID | Category | Severity | Location(s) | Summary | State |
|----|----------|----------|-------------|---------|-------|
| F1 | Inconsistency | MEDIUM | spec.md F148-FR-003 | "never count as a pass" read as if a caller had to fail on a condition; ruling 41 keeps approval possible at the verification gate | Repaired: "never be stated as a pass"; the decision belongs to the caller |
| U1 | Underspecification | MEDIUM | spec.md F148-FR-010 | When a manifest exists with the loop strategy `classic` outside the `parity` profile rests on a reading (CQ-153) | Open: in the queue |
| U2 | Underspecification | LOW | spec.md F148-FR-003 | The list of reasons rests on a reading (CQ-154) | Open: in the queue |
| U3 | Underspecification | LOW | spec.md F148-FR-014 | Where the lowered parallelism of a run is kept (CQ-180) | Open: reported |
| P1 | Plan | LOW | plan.md "Project Type" | The package graph of feature 100 has no package for this feature | Open: reported |
| C1 | Coverage | LOW | tasks.md T007 | The characterization test of the extracted Lisa executor names a requirement and no as-is id | Accepted |
| A1 | Ambiguity | LOW | plan.md "Performance Goals" | Starting values with low confidence | Accepted: a task measures them |

No finding is CRITICAL or HIGH. No requirement conflicts with a principle of the constitution.

## Coverage Summary

| Requirement keys | Has task? | Notes |
|---|---|---|
| F148-FR-001 to F148-FR-017 | Yes, each | One implementation task each, and one test task per test name |
| F148-FR-018 | Yes | The conformance suite, the sample, the plainer path, CT-148-305 |
| F148-SC-001 | Yes | CT-148-207 |
| F148-SC-002, F148-SC-003 | Yes | CT-148-303 |
| F148-SC-004 | Yes | CT-148-305 |
| F148-SC-005 | Yes | CT-148-301 |
| F148-SC-006 | Yes | PT-148-C-080-suite |
| F148-SC-007 | Yes | CT-148-304 |

As-is coverage: the 4 items that moved (B-1120, B-1121, B-1122, B-1124) are each named by the
origin of one requirement and by a `proves:`. `check-traceability.py` does not know this feature
until the orchestrator has moved the rows; the check of the split was made by a script of this
feature's author over both parts: 165 as-is ids, each in exactly one part, 0 problems.

## Constitution Alignment Issues

None. The twenty gates of `plan.md` pass.

## Unmapped Tasks

Setup and measurement tasks (T001 to T006, T008, T009 and the last three tasks) map to the plan.

## Metrics

| Metric | Value |
|---|---|
| Functional requirements | 18 |
| Success criteria | 7 |
| Tasks | 63 |
| Requirements with at least one task | 100 % |
| Ambiguity count | 1 |
| Duplication count | 0 |
| Critical issues | 0 |
| Open readings | 3 (CQ-153, CQ-154, CQ-180) |

## Next Actions

| # | Action | Who |
|---|---|---|
| 1 | Move the four rows of `traceability-items.tsv` and give the tests the names `PT-148-C-080-*` | Orchestrator |
| 2 | Add the package, the closed sets and the requested profile row to feature 100; give rows 53, 54, 6, 7, 31 and EP-05 the owner 148 | Orchestrator; feature 100 |
| 3 | Answer CQ-153, CQ-154 and CQ-180 | Owner, in the clarification round |

## After the cross-feature review

Dated 2026-09-30. The repairs of `docs/ecosystem/reviews/REPAIR-WORKLIST.md`, section
"Feature 148", and the items owned elsewhere that change files of this feature. Every item was
verified against the file before the change; none was found wrong or already done at the start.
The item table with the states is in `repair-report.md`.

What changed:

| Item | Change |
|---|---|
| W-148-01 | The result of the runner is a returned value; the stored record at `unit:<unitId>:check:<i>` is `specstride.check-result/1` of feature 116, with the mapping `commandId` to `id` and `exitCode` to `exit` in `data-model.md`, "Mapping to the stored record" |
| W-100-02 (pointer) | Owner of fingerprints, the protected set and the toolchain profiles written as 116 (EP-16) in "Out of scope", "Assumptions", `data-model.md` and the table of dependencies of `tasks.md` |
| W-111-02 (pointer) | The event types are named in the requirements: `check.parallelism_lowered` (F148-FR-014), `check.admission` (F148-FR-012), `integrity.noted` (F148-FR-010); the catalogue spellings of the fields of `check.started` and `check.ended` in F148-FR-007 and F148-FR-017 |
| W-X-04 (pointer) | `verification.env_allowlist` became `verification.envAllowlist` in `contracts/parity-rows.json`; the other keys match `config-keys.tsv` |
| W-X-06 (pointer) | "execution" for one execution of a command; "run of steps" kept as the name of row 235 of annex X §X.6 and defined as never the logical run |
| W-X-07 (pointer) | `plan.md` states the present package graph: `@specstride/check-runner`, L1, owner 148 |
| W-X-11 (pointer) | "row 125 of annex X §X.7" in place of "row requested"; `contracts/parity-rows.json` gives every entry a `row` and the status `confirmed` |
| W-X-12 (pointer) | "Closed sets" and `contracts/closed-sets.json` name rows 233, 235 and 236 of annex X §X.6; `DEADLINE` of row 233 named with its owner 105 |
| W-105-03, CQ-190 | F148-FR-011: declarations come from the frozen check manifest only, never from repository text; `assumption: CQ-190`; new test CT-148-208 with task T064 |

Not applied: none. Open: CQ-180 stays open by design — its premise was stale (annex E §E.2 has
the field `verificationParallelism` since the amendments), so the question narrows to who writes
the field when the engine is a child of the runtime root; the spec proceeds on the recommended
answer of the queue (derive from the event `check.parallelism_lowered` where the record cannot be
written).

Consistency pass over the places touched (spec, plan, tasks, data-model, contracts):

| Check | Result |
|---|---|
| Requirement without a task | None: all 18 functional requirements and all 7 success criteria have at least one task |
| Task without a requirement | Only the setup and measurement tasks the earlier analyse pass already listed (T001 to T006, T008, T009, T061 to T063); they map to the plan |
| Terms and values between the files | The new event types, the field `verificationParallelism`, row 125, rows 233/235/236, owner 116 and CQ-190 are spelled the same in `spec.md`, `plan.md`, `tasks.md`, `data-model.md`, `quickstart.md`, `research.md` and `contracts/` |
| Ids | No id renumbered or reused. New: test CT-148-208, task T064 |
| Counts | 18 functional requirements, 7 success criteria, 64 tasks |
| Coverage check | `python3 docs/ecosystem/check-traceability.py --require-all`: passed (checks a to h); feature 148 has 4 items, 4 kept |

No requirement of this feature exceeds 45 in count; no split is proposed.

## Re-check B-8.7

Dated 2026-09-30. The re-check after the repairs added F148-FR-019 (the environment of the kind `command` for a detached command staged before; N-105-1), with test CT-148-119 and tasks T065 and T066, and marked the four event types of "Events this feature needs" in `data-model.md` as present in the catalogue of feature 111. Counts now: 19 functional requirements, 7 success criteria, 66 tasks; every requirement has a task.

## Analysis of 2026-09-30 (third run) — findings and states

Constitution v3.0.1. Counts: 19 functional requirements, 7 success criteria, 66 tasks; every
requirement has a task. No CRITICAL finding; no conflict with a principle.

| ID | Severity | Location | Summary | State |
|---|---|---|---|---|
| I1 | HIGH | spec F148-FR-019; tasks T065, T066 | The environment is to be given "through the interface of EP-05", but annex C §C.8 has no such operation | Proposed upstream (P1); this feature names the operation `environment` and waits for it |
| I2 | MEDIUM | spec, assumptions | CQ-153, CQ-154, CQ-180, CQ-190, N-105-1 (CQ-215) shown as open; closed 2026-09-30 | Repaired |
| A1 | MEDIUM | spec F148-FR-006, US2 | "the condition" not named | Repaired: `tainted`, `protected-set-changed` |
| C1 | MEDIUM | tasks T025, T028 | Containment and "no count of tests" of FR-006 had no task | Repaired |
| I3 | MEDIUM | tasks T065 | A test task among the implementation tasks | Repaired: moved, id kept |
| U1 | MEDIUM | spec F148-FR-014 | With the engine a child, the lowered value survived only through a best-effort event | Proposed upstream (P2); FR-014 states the terminal-record path |
| I4 | LOW | plan, tasks | "second run" for "second execution" | Repaired |
| I5 | LOW | tasks T009 | Rows 1 and 25 read but not named | Repaired |
| U2 | LOW | spec F148-FR-015 | The refusal `steps` had no requirement | Repaired |
| C2 | LOW | spec US1; ids table | FR-019 without a scenario; new ids missing from the table | Repaired |
| I6 | LOW | plan structure | `integrity.noted` and `repair-report.md` missing | Repaired |
| U3 | LOW | spec F148-FR-003 | Who sets `cached` and `interrupted` was not stated | Repaired: FR-003 names the setter of each condition (`cached`: F116-FR-009) |
| I7 | LOW | checklists/requirements.md | Stale counts and open readings | Repaired |
| A2 | LOW | spec | "No … MUST" phrasing | Accepted: house style |
| C3 | LOW | tasks T007 | Names a requirement, not an as-is id | Accepted |
| A3 | LOW | plan | Performance starting values | Accepted: T062 measures them |

## Proposed upstream fixes

Ready to apply by the owner of each target. Feature 148 is written as if both were applied, and
until they are, the tasks that depend on them are skips with their reason (tasks.md, table of
dependencies).

### P1 — The operation `environment` of EP-05 (finding I1; N-105-1, CQ-215)

**Target**: feature 100 — `annexes/C-ports-and-edges.md`, §C.8 EP-05 Check runner; the generated
`contracts/extension-points/EP-05.check-runner.json` (key `operations`); the interface types of
EP-05 that task T106 of feature 100 writes (`packages/contracts/src/ep/check-runner.ts`).

**Change in §C.8**:

- "Caller and time": append — "`environment` whenever a caller outside the runner needs the
  environment a command would get (the detached command staged before, F105-FR-035)."
- "Inputs": append — "`environment`: an entry of the check manifest (its declared `env`) and the
  profile in force."
- "Outputs": append — "`environment`: the environment the kind `command` would give that entry:
  the allow-list with no provider credential overlaid with the declared `env`, and under the
  `parity` profile the environment of the process overlaid with the declared `env` (row 125 of
  annex X §X.7). It starts no process and returns no handle."
- "Guarantees of the core": append — "The environment that `environment` returns equals the one
  `start` gives the same entry."
- `EP-05.check-runner.json`: `"operations": ["pin", "start", "poll", "result", "cancel",
  "environment"]`.

**Why**: F105-FR-035 requires that a detached command gets the environment of the check runner,
and the composition root must take it from the runner. The runner must not start that command
itself, because it ends every command at its time limit. Without an operation in the contract,
feature 105 would have to build the environment itself (threat T-21), or the runner would need
a second, detached start mode. CQ-215's "if answered otherwise" names that mode as the costlier
alternative. A pure operation with no side effects is the smallest safe change: the version
stays `/1`, because the addition adds an operation and removes nothing.

### P2 — The lowered parallelism of an engine in start mode `child` (finding U1; CQ-180)

**Target**: feature 100 — `annexes/B-state.md`, §B.15 Terminal record (content owner 101, which
"may add fields"), and `annexes/E-engine.md`, §E.2 Run record, row `verificationParallelism`.

**Change**:

- §B.15, add a row to the field table:
  `| verificationParallelism | The parallelism of verification commands in force at the exit, when the engine lowered it below the configured value (F148-FR-014) | Whole number | No |`
- §E.2, row `verificationParallelism`, column "Meaning": append — "In start mode `child` the
  runtime root copies it from the field of the same name of the terminal record before the next
  engine start. Where the root synthesized the terminal record, it takes the value `to` of the
  last event `check.parallelism_lowered` of the run."

**Why**: the run record has one writer (F100-FR-143), and in start mode `child` that writer is
the runtime root, not the engine that saw the taint. The events are best-effort (Principle V), so
the event alone cannot carry a MUST of F148-FR-014 across a relaunch. The terminal record is
written by the engine on every exit path (F100-FR-071), is read by the root, and its owner may add
fields. That makes it the existing, reliable channel. The event stays as the fallback for the
one path on which no engine-written terminal record exists.
