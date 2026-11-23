# STAGE-B-REPAIR-PROMPT — what every repair agent of act 8.6 follows

Written by the orchestrator on 2026-09-30. All paths are relative to `/root/specstride-claude`.
You repair one feature after the cross-feature review. You write specifications only, no product code.

## 1. Read first, in this order

| # | File | What |
|---|---|---|
| 1 | `docs/ecosystem/STAGE-B-RULES.md` | The rules of every feature agent. They bind you: you write only inside your own `specs/<dir>/`; no git command that changes the repository; no subagents; source repositories read-only; the machine-specific backend is never named |
| 2 | `docs/ecosystem/reviews/REPAIR-WORKLIST.md` | The section "How to read this file", then **only the section of your feature** in section 2 (find it with `grep -n "^### .*<your number>\|^## " `), with its own items and its list "Items owned elsewhere that change files of this feature". The file has 3,900 lines: do not read it whole |
| 3 | `specs/100-specstride/repair-report.md` | The table "What the other features must follow". Feature 100 was repaired before you; where the worklist and this table differ, the table stands |
| 4 | `docs/ecosystem/reviews/QUEUE-MAP.md` and `docs/ecosystem/CLARIFY-QUEUE.md` | The proposed questions Q-01 to Q-12 of the worklist are CQ-182 to CQ-194 (CQ-187 is the question of feature 141 on a missing critic credential). The specs proceed on the recommended answers |
| 5 | `docs/ecosystem/APPROVAL.md` | The authority, where an item cites a ruling |

## 2. How to work

| Rule | Content |
|---|---|
| Verify first | The worklist was compiled from review reports and not verified again. Check every item against the file before you change anything. Line numbers may have moved. If an item is wrong, or is already done, do not apply it and say so with the evidence |
| Authority | `APPROVAL.md` > constitution v3.0.0 > feature 100 (annexes, then `contracts/`) > your brief. Where your feature disagrees with feature 100, your feature changes. If you think feature 100 is wrong, do not edit it: report it |
| Other features | Never edit another feature. Where an item needs two features to agree (a field name, a member of a set, an event type), take the side the worklist names; if it names none, take the spelling of the owner that feature 100 names, and report the choice |
| Ids | Never renumber or reuse a requirement id, task id or test name. Append new ones. A requirement changed in place is listed in your `spec.md` in a section "Repairs after the cross-feature review" (dated 2026-09-30), with the item id and one line on what changed |
| Questions | A change made on a queued question marks the requirement `assumption: CQ-<n>`. Replace every `CQ-pending-*` placeholder of your feature by the real number, or report the question |
| All artifacts | A change to a requirement is carried into `plan.md`, `tasks.md`, `data-model.md`, `quickstart.md`, `research.md` and `contracts/` of your feature where they repeat it. Every new requirement has a test and a test task with `proves:` |
| Packages | The package of your feature is the one `specs/100-specstride/contracts/data/package-graph.json` gives. Rename in plan and tasks; do not invent a package |
| Constitution Check | Where the worklist says a principle is marked as passed and is not, either the spec changes so that it passes, or the row becomes a stated deviation with a Complexity Tracking row and the queued question. Never leave a NON-NEGOTIABLE principle marked as passed against the text |
| Paid probes | A task that calls a model is marked paid, is never a precondition of an unpaid test, and is never run by you |
| Size | If your repairs bring the feature above 45 requirements, do not split; report the count |
| No CLIs beyond introspection, no model calls, no credentials | As in the rules |

## 3. When the items are done

1. If your feature has a generator or a check of its own in `contracts/tools/`, run it.
2. Run `python3 docs/ecosystem/check-traceability.py --require-all`. It must pass. If it fails on your feature, repair the cause; if it fails on another feature, report it and go on.
3. Append to `specs/<dir>/analyze-report.md` a dated section "After the cross-feature review": what changed, and a short consistency pass over your own spec, plan and tasks for the places you touched (requirement without a task, task without a requirement, a term or value that differs between the files).
4. Write `specs/<dir>/repair-report.md`, in steps as you go, so that an interruption loses little.

## 4. The repair report and your final message

```markdown
# Repair report — <feature>
| Item | Class | Severity | State (`done`, `not applied`, `open`) | Files and lines changed | Note |
## Requirements added or changed in place
## What another feature or the orchestrator must do
## New questions (each with a recommended answer and its source)
## Register rows needed (with the text)
## Checks
```

Your final message to the orchestrator, as plain text: the path of the report; counts of items done, not applied and open; the number of functional requirements and tasks now; what another feature or the orchestrator must do; new questions; whether the coverage check passes.
