# STAGE-B-REVIEW-PROMPT — what every cross-feature review agent follows

Written by the orchestrator on 2026-09-29 for act 8 of Stage B (`prompts/specstride-stage-b.md` §6).
All paths are relative to `/root/specstride-claude`.

## 1. What this is

Stage B wrote 41 specifications for the product Specstride: `specs/100-specstride` (the umbrella, which
holds every contract), `specs/141-parity-oracle`, and 39 others, `specs/101-*` to `specs/149-*`. The
directories `specs/002-*`, `specs/011-*` and `specs/028-*` are the as-is specifications and are not
under review. Each feature has `spec.md`, `plan.md`, `tasks.md` and `analyze-report.md`.

`speckit-analyze` looked at one feature at a time. You look across features. You are an independent
reviewer: you did not write these specs, and you report what you find, not what the specs say about
themselves.

## 2. Authority

1. `docs/ecosystem/APPROVAL.md`, the owner's rulings
2. `docs/ecosystem/architecture.md` and `docs/ecosystem/consolidation.md`
3. Feature 100: `specs/100-specstride/spec.md`, `annexes/A` to `H` and `X`, and `contracts/` (generated
   from the annexes; where they differ, the annex stands)
4. `docs/ecosystem/feature-briefs.md`

Where a feature disagrees with feature 100, the feature is wrong unless a ruling says otherwise; then
feature 100 is wrong, and you say so.

`docs/ecosystem/CLARIFY-QUEUE.md` holds open questions CQ-017 to CQ-181, each with a recommended answer
the specs proceed on. A difference that is already a queued question is not a finding: name the CQ id
and move on. `docs/ecosystem/STAGE-B-RULES.md` section 4 gives the written form of a requirement.

## 3. What you may do

| Rule | Content |
|---|---|
| You write one file | Your report, at the path your task names, under `docs/ecosystem/reviews/`. Nothing else in the repository |
| You repair nothing | You change no spec, plan, task list or contract. The orchestrator decides the repairs |
| No git | No git command that changes the repository. Reading (`git log`, `git show`, `git grep`) is fine |
| No subagents | Do the work yourself. Do not spawn agents or workflows |
| Scratch | Temporary files and scripts go in `/tmp/claude-0/-root-specstride-claude/cd1d66b8-8dd9-4586-a794-f99f996770a4/scratchpad/<your review id>/`, and nowhere else |
| Source repositories | `/root/specstride`, `/root/mixture-of-loops`, `/root/lisa` are read-only. `/root/agentic-netops-srl` is not touched at all |
| Secrets, CLIs, model calls | Never read credential files. No logins, no paid model calls |
| Method | The specs are 2.5 MB. Do not read them end to end. Extract with `grep`, `rg` or a small script, then read the places that matter. Check every finding against the file before you report it, and cite `path:line` |

## 4. The report

```markdown
# <review id> — <title>

Reviewer: independent agent. Date. Scope: what was checked, and how (commands or scripts, in short).

## Summary
Counts by severity. What holds. The three most serious findings.

## Findings
| Id | Severity | Feature(s) | Where (`path:line`) | What disagrees with what | Proposed repair |

## Checked and found consistent
What you checked that holds, with the count of places checked.

## Not checked
What your task named and you could not check, and why.
```

| Severity | Meaning |
|---|---|
| `critical` | Two specs cannot both be implemented as written, a ruling is contradicted, or a NON-NEGOTIABLE principle is violated |
| `high` | A contract of feature 100 is used with a different name, value, version or owner, so an implementation would not interoperate |
| `medium` | An inconsistency that a reader resolves with effort: a stale number, a dangling reference, a term in its unqualified form where it misleads |
| `low` | Wording |

Finding ids are `<review id>-<nnn>`. One finding per distinct fault; where the same fault occurs in many
places, one finding with the list of places. A proposed repair names the file to change and the text.
Do not pad: a report with few findings is a good result if the check was thorough, and the section
"Checked and found consistent" is where you show that it was.

Your final message to the orchestrator: the path of the report, the counts by severity, and the
critical and high findings in one line each.
