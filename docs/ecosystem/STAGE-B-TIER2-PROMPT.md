# STAGE-B-TIER2-PROMPT — the prompt of a tier 2 feature agent

Written by the orchestrator on 2026-09-29. One agent per feature. The orchestrator replaces `{DIR}`
(for example `101-gate-and-verdict`), `{NUM}` (`101`) and `{EXTRA}` (the row of the table at the end)
and sends the text below the line. A session that resumes Stage B uses the same text for a feature
whose rows in `PROGRESS.md` are unfinished, and adds which output files already exist.

| Model | Features |
|---|---|
| top | 101, 105, 109, 115, 117, 122, 124, 142 |
| mid | all others |

---

You are writing the specification of feature `{DIR}` of a product called Specstride. The repository is `/root/specstride-claude`. This is Stage B of a consolidation effort: three existing systems (Specstride in Bash and Python, mixture-of-loops in Python, Lisa in TypeScript) become one TypeScript product, delivered through host plugins. Stage A produced research, an approved architecture, the owner's rulings and a brief for every feature. Stage B writes specifications with the Spec Kit skills. It writes no product code.

Thirty features are being specified at the same time, one agent each. You are one of them. Feature `100-specstride` (every cross-feature contract) and feature `141-parity-oracle` (fixtures, stubs, compared surfaces) are finished; you cite them and never edit them. You cite no other feature's requirements: where you consume another feature's behaviour, you name the contract of feature 100 through which you do so.

## Your task

Run all five Spec Kit steps for `SPECIFY_FEATURE_DIRECTORY=specs/{DIR}`, in order: `speckit-specify`, `speckit-clarify`, `speckit-plan`, `speckit-tasks`, `speckit-analyze`. Write files to disk as you go, so that an interruption loses little.

## Read first, in this order

1. `docs/ecosystem/STAGE-B-RULES.md` — the rules you follow, including the fixed written form of a requirement and of a test task. Follow it exactly; a script reads your spec.
2. Your brief: in `docs/ecosystem/feature-briefs.md`, the section that starts at the heading `### {DIR}` and ends before the next `### 1` heading. Find the line with `grep -n '^### 1' docs/ecosystem/feature-briefs.md`. Read it in full, all eleven headings. Read also lines 1–46 (conventions) and 245–262 (how to read a brief), and section D.8 near the end of the file (table "Where rulings meet").
3. `docs/ecosystem/APPROVAL.md` — the owner's rulings. The authority: where your brief, the architecture and a ruling differ, the ruling stands. Read all of it; the rulings your brief names under heading 6 bind you directly.
4. `docs/ecosystem/architecture.md`.
5. `docs/ecosystem/consolidation.md` section 1 (the glossary), and the register rows (section 6) that your brief names. The register has 94 rows, DV-001 to DV-094; your brief may say 85 or 91.
6. Feature 100: `specs/100-specstride/spec.md` first (it has the table "Where each interface contract is"), then the annexes your brief names under heading 5, in `specs/100-specstride/annexes/`. Always read annex X §X.6 (closed sets) and §X.7 (the `parity` profile). The machine-readable forms are in `specs/100-specstride/contracts/`; where a file and an annex differ, the annex stands.
7. Feature 141: `specs/141-parity-oracle/spec.md`, the section "How a feature cites the oracle" and the catalogue of fixture families.
8. Your traceability rows: the rows of `docs/ecosystem/traceability-frs.tsv` and `docs/ecosystem/traceability-items.tsv` whose feature column is `{DIR}`, and `docs/ecosystem/traceability.md` section 1 for the rules. For the text of a behaviour item, look its id up in `docs/ecosystem/research/R18-behaviour-inventory.tsv`.
9. `.specify/memory/constitution.md` v3.0.0; your brief names the principles that bind you under heading 9.
10. `docs/ecosystem/CLARIFY-QUEUE.md`: CQ-001 to CQ-016 are closed by rulings. CQ-017 and upward are open, and every feature proceeds on the recommended answer.
11. The research reports your brief names under heading 10, in `docs/ecosystem/research/`. Open one when the brief leaves a decision unclear. Do not read reports in full that you do not need.
{EXTRA}

The as-is specifications are `old/028-as-is-specstride/`, `old/011-as-is-mixture-of-loops/` and `old/002-as-is-lisa/`. The baselines are read-only: `/root/specstride` at `9cab15d`, `/root/mixture-of-loops` at `9c88f86` (its checkout is on another branch with uncommitted changes; only the commit counts), `/root/lisa` at `363e6a3`, and `76adfdc` for `packages/dashboard`. Read with `git -C <repo> show <commit>:<path>`. Where an as-is spec and the baseline code disagree, the code is what parity means.

## What the spec must hold

- The sections of the Spec Kit spec template, and in addition: `## Constraints` (from heading 11 of your brief), `## Extension points` (implemented and consumed, with versions), `## Contracts of feature 100 used` (annex and section), "As-is behaviour not carried" (the rows of your traceability files with `superseded-by` or `dropped`, with the register row), and `## Clarifications`.
- Every requirement in the written form of STAGE-B-RULES.md section 4, with ids `F{NUM}-FR-001` upward and `F{NUM}-SC-001` upward.
- Every as-is requirement, success criterion and cluster that the traceability files assign to you with a kept disposition, in the `origin:` of at least one requirement. A cluster is carried by requirements that state its behaviour, not by one sentence that names the cluster: read the items of the cluster and write what the product must do.
- Every option or switch you introduce, with its value under the `parity` profile. If the option has a row in annex X §X.7, name the row. If it has none, say so in your report, with the row you need.
- The closed sets your feature owns, with every member. Annex X §X.6 names six sets whose members it leaves to the owner: rows 13 and 14 (feature 123), 53 (feature 105), 60 (feature 142), 63 and 65 (feature 115). If one is yours, list its members and the rule for an unknown value.
- Config keys: feature 110 owns the spelling of every key. Use the spelling of annex X §X.7 where a row exists, and otherwise propose one and list it in your report.
- Success criteria that can be measured. If your brief assigns you one of the criteria of `feature-briefs.md` section D.5, it must be there.
- Work your brief inherits (spikes, fixture captures, live probes, experiments, canary tests): as requirements where they bind the product, and as tasks in `tasks.md`. A spike or a capture is the first task of its feature. A paid probe is a task that says it is paid and must be logged; you do not run it.

## Points where you must be careful

- No closed list of harnesses anywhere. Anything that enumerates harnesses reads the registry, which includes discovered ones.
- The machine-specific backend that is registered in `/root/specstride/lib/backends.py` and is not dsh, claude, codex or prime is never named in anything you write. Write "a locally registered backend". The same holds for launchers, models and gateways of the owner's machines.
- Every macOS statement is `unverified`. So is every provider or host fact that rests on documentation only.
- Glossary terms only; "never bare" terms in their qualified form.
- Do not invent interface detail that would bind other features. If feature 100 lacks something you need, or contradicts your brief or a ruling, report it and proceed on the narrowest reading. Do not edit feature 100.
- You do not split the feature. If `speckit-specify` yields more than about 45 requirements, finish all five steps on the whole feature, and propose the split along the requirement groups under heading 7 of your brief: which requirement ids leave, with their origins and tests.

## Mechanics

- Invoke the skills with the Skill tool if you have it; otherwise read `/root/.claude/skills/speckit-<name>/SKILL.md` and follow it. State the directory explicitly. Confirm afterwards that your directory is exactly `specs/{DIR}`.
- Scripts: `SPECIFY_FEATURE_DIRECTORY=specs/{DIR} bash .specify/scripts/bash/<script>`. Never rely on `.specify/feature.json`: other agents overwrite it.
- You answer the clarify questions yourself from the sources and record question, answer and source in `## Clarifications`.
- The plan's Constitution Check covers twenty principles; answer every gate.
- Analyze report: `specs/{DIR}/analyze-report.md`. Fix and re-run at most twice. Then run `python3 docs/ecosystem/check-traceability.py` and look only at lines that start with `[h` and name your feature or your requirement ids; repair those. Lines about other features are not yours.
- You write only inside `specs/{DIR}/`. You never commit, never run a git command that changes the repository, and never spawn agents.
- If you are cut off and resumed, look at what is on disk in `specs/{DIR}/` and continue from the first step whose output is missing or incomplete.

## Report

Send the report described in STAGE-B-RULES.md section 6, as plain text. Keep it short: tables, no prose summary of the spec.

---

## `{EXTRA}` per feature

Item 12 of the reading list. Empty where the brief's heading 10 is enough.

| Feature | Extra reading and notes |
|---|---|
| 102 | CQ-017, CQ-020, CQ-021 bear on you |
| 105 | `research/R29v-parallel-units-red-team.md` finding V-04 and ruling P11, for the concurrent commands. Closed set row 53 is yours |
| 107, 113 | CQ-024 bears on you |
| 108 | Feature 100 placed the reverse files by its own reading: the driver spec, the inventory summary and the analysis report in the workspace part; the inventory and the verification commands in the control plane (annex B §B.5). Confirm or report |
| 110 | You own the spelling of every config key. Annex X §X.7 holds proposed spellings; confirm or correct each in your report |
| 115 | Closed set rows 63 and 65 are yours. Experiments X0 to X12: X0 comes first |
| 122 | The detach spike is the first task. CQ-023 bears on you |
| 123 | Closed set rows 13 and 14 are yours. CQ-020, CQ-022 bear on you |
| 125 | One live call per role confirms the critic's flag combination: a paid probe, a task, not run by you. R5, R1, R3v |
| 128 | Profile row 42 of annex X §X.7 (as-is names of metrics) is yours alone |
| 129 | Threats T-38 to T-42 of the threat model (the viewer) have no Wave 1 owner beyond your read model; say what the read model guarantees |
| 130 | R9, R4. Fixture capture: dsh's approval behaviour in headless mode. Rulings P14, P15 |
| 131 | R6. Fixture capture: Codex's structured quota event. Rulings 57, 57a, D1, P13 |
| 134 | R9. Fixture capture: pi's exit code on a provider error. No sandbox: as proposer it needs the consumer's opt-in to no containment (rulings 34, P2) |
| 138 | R9. No sandbox, as 134. Ruling P14 |
| 142 | `research/R29-parallel-units-design.md` and `research/R29v-parallel-units-red-team.md`; where R29v amends R29, R29v stands. Rulings 56, D2, P1 to P10. Closed set row 60 is yours. E6 is a safety experiment |
