# STAGE-B-RECHECK-PROMPT — act B-8.7, the re-check after the repairs

Written by the orchestrator on 2026-09-30. All paths are relative to `/root/specstride-claude`.

## 1. Why this pass exists

Act 8.6 repaired all 41 specifications from `docs/ecosystem/reviews/REPAIR-WORKLIST.md`. The repairs
were made by two sessions. Twenty-five features were repaired by agents on a top-tier model. Fifteen
(103, 106, 108, 110, 119, 127, 129, 134, 141, 144, 145, 146, 147, 148, 149) and the second pass on
100, 110, 111 and 116 (`docs/ecosystem/reviews/SECOND-PASS-LIST.md`) were made by another session on
a small local model (a 27B quantised model), whose work is unreviewed. Every repair is committed.

You re-check assigned features: you verify that the repair is right and complete, and you fix what is
not. You are the last pass before the owner's clarification round, so what you leave stands.

## 2. Rules

| Rule | Content |
|---|---|
| Rules of the feature agents | `docs/ecosystem/STAGE-B-RULES.md` binds you (no git command that changes the repository; no subagents; source repositories read-only; never name the machine-specific backend; no model calls, no credentials) |
| What you may write | Only inside the `specs/<dir>/` of the features assigned to you, and your report in `docs/ecosystem/reviews/`. Nothing else |
| Authority | `docs/ecosystem/APPROVAL.md` > constitution v3.0.0 > feature 100 (annexes, then `contracts/`) > the brief |
| Evidence | Verify against the files. Line numbers in the worklist and the reports have moved; search by id |
| Ids | Never renumber or reuse an id; append. A requirement changed in place is listed in the spec's section "Repairs after the cross-feature review" with the date and one line |
| Questions | The specs proceed on the recommended answers of `docs/ecosystem/CLARIFY-QUEUE.md` (CQ-017 to CQ-204). A question the sources cannot answer goes in your report with a recommended answer; do not write `CQ-pending-*` into a spec, name the question `N-<feature>-<n>` and cite it in an `assumption:` line |
| Checks | At the end run `python3 docs/ecosystem/check-traceability.py --require-all`, and for feature 100 or 141 the feature's `contracts/tools/generate.py --check`. They must pass |

## 3. What to check for each assigned feature

1. **The repair report against the files.** For every worklist item of the feature (its own items and its pointers in `REPAIR-WORKLIST.md` section 2, and its rows in `SECOND-PASS-LIST.md`), does the file hold what the report says? An item marked `done` that the file does not show is fixed. An item marked `not applied` with a wrong reason is applied.
2. **Damage.** Did the repair break something that was right: a requirement weakened, a citation removed, a test task lost, a value changed without an item asking for it, a `proves:` line emptied, text of another feature copied in? Compare with `git log -p --follow` of the file where needed.
3. **Consistency inside the feature.** Spec, plan, tasks, data model, quickstart, research and `contracts/` agree on every value the repair touched (names, numbers, row numbers, package, test paths).
4. **Consistency with feature 100** as it stands now (after its second pass): closed-set row numbers, profile rows, logical names, schema ids, package graph, extension-point owners, labels, exit codes.
5. **The Constitution Check** of the plan: every row that says "passed" is supported; a deviation from a NON-NEGOTIABLE principle has a Complexity Tracking row and its question.
6. **The critical and high items** of the reviews that touch the feature (`REPAIR-WORKLIST.md` front matter and the reports `B-8.*`): read the repaired text once more as a hostile reviewer.

## 4. Report

`docs/ecosystem/reviews/B-8.7-<your part>.md`:

```markdown
# B-8.7 <part> — re-check of <features>
## Summary (per feature: verdict `sound`, `repaired here`, `open`; counts)
## Findings and fixes
| Feature | What was wrong | Evidence (`path:line`) | Fixed here? | If not, who |
## Requirements changed in place by this pass
## Questions (N-<feature>-<n>, with recommended answer and source)
## Checks
```

Your final message to the orchestrator: the path of the report; per feature the verdict; the fixes made; what is open and for whom; whether the checks pass.
