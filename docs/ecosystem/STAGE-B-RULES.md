# STAGE-B-RULES — what every Stage B feature agent follows

Written by the orchestrator on 2026-09-29 from `prompts/specstride-stage-b.md` sections 1, 2 and 5 and
`HANDOFF.md` section 5. It adds one thing to them: the written form of a requirement and of a test
task (section 4), so that the coverage check can read the specs. Where this file and `APPROVAL.md`
differ, `APPROVAL.md` stands.

All paths are relative to `/root/specstride-claude`.

## 1. Authority

1. `docs/ecosystem/APPROVAL.md`, the owner's rulings
2. `docs/ecosystem/architecture.md` and `docs/ecosystem/consolidation.md`
3. `docs/ecosystem/feature-briefs.md`
4. The research reports in `docs/ecosystem/research/`
5. `prompts/specstride-ecosystem.md` and `prompts/analysis/`. Out of date in places; never take a
   decision from them without checking `APPROVAL.md`

The constitution in force is `.specify/memory/constitution.md` v3.0.0.

## 2. What you may write, and what you may not

| Rule | Content |
|---|---|
| Your directory | You write only inside your own `specs/<dir>/` |
| Never written by you | `docs/ecosystem/PROGRESS.md`, `CLARIFY-QUEUE.md`, `consolidation.md`, `traceability*`, `feature-briefs.md`, anything in `.specify/` except that the Spec Kit scripts may rewrite `.specify/feature.json` |
| No commits | You never run `git add`, `git commit`, `git stash`, `git checkout` or any git command that changes the repository. The orchestrator commits |
| No subagents | Do the work yourself. Do not spawn agents or workflows |
| Scratch files | The scratch directory is shared by all agents. Put every temporary file in a directory of your own, `<scratch>/<your feature number>/`, and never read or write a scratch file outside it |
| No product code | Stage B writes specifications only |
| Source repositories | `/root/specstride` (baseline `9cab15d`), `/root/mixture-of-loops` (`9c88f86`), `/root/lisa` (`363e6a3`; `76adfdc` for `packages/dashboard`) are read-only. Read a baseline with `git -C <repo> show <commit>:<path>`. Never create a worktree or branch in them, never write a file there |
| `/root/agentic-netops-srl` | Do not touch it |
| Secrets | Never read credential files, token stores or keychain entries |
| CLIs | Detection and introspection only: `command -v`, `--version`, `--help`. No logins, no state changes, no model calls |
| The machine-specific backend | One backend registered in `/root/specstride/lib/backends.py` is not dsh, claude, codex or prime. Its name appears in nothing you write, even where an as-is spec mentions it. Write "a locally registered backend". The same holds for launchers, models and gateways of the owner's machines |

## 3. Spec Kit mechanics on this repository

| Rule | Content |
|---|---|
| Steps | `speckit-specify` → `speckit-clarify` → `speckit-plan` → `speckit-tasks` → `speckit-analyze`. Invoke each as a skill. If the Skill tool is not available to you, read `/root/.claude/skills/<skill>/SKILL.md` and follow it |
| Directory | Every Spec Kit script call is prefixed with `SPECIFY_FEATURE_DIRECTORY=specs/<dir>`, because shell environment does not persist between tool calls and `.specify/feature.json` holds one pointer that parallel agents overwrite. Never trust `.specify/feature.json` |
| Creation | The directory is created by the `speckit-specify` run, with the directory stated explicitly, and never by hand before it. Auto-numbering gives the wrong number. After the run, confirm the directory has exactly the planned name and that no other `specs/1NN-*` directory appeared |
| Scripts | The scripts in `.specify/scripts/bash/` are not executable. Call them as `SPECIFY_FEATURE_DIRECTORY=specs/<dir> bash .specify/scripts/bash/<script> …`. The `speckit-specify` skill on this repository creates the directory itself from `SPECIFY_FEATURE_DIRECTORY`; do not call `create-new-feature.sh`, which renumbers |
| Branches | Spec Kit creates no branch here. "Feature Branch" in a template is a label: write the directory name |
| Hooks | `.specify/extensions.yml` does not exist; skip every hook check |
| Questions | `speckit-specify` and `speckit-clarify` normally stop to ask the user. You cannot. Answer each question from the rulings, the architecture, your brief, the as-is specs and the research, and record question, answer and source in the spec's `## Clarifications` section. No `[NEEDS CLARIFICATION]` marker stays in a finished spec |
| Questions the sources cannot answer | Report them to the orchestrator in your final message, each with: the question, the sources you looked at, a recommended answer, and what changes if it is answered otherwise. Proceed on your recommendation and mark the requirement `assumption: CQ-pending-<n>`. Label an answer as a report's recommendation only if that report really recommends it, and name the report |
| A ruling that cannot be specified as it reads | Do not work around it quietly. Report it with the evidence, proceed on the narrowest reading that lets the work continue, and say so |
| Research and architecture | Stay in `docs/ecosystem/`. Your feature's `research.md`, which `speckit-plan` writes, summarizes and links to them |
| Tests | Requested for every feature. Parity tests and characterization tests are required tasks in `tasks.md`, not optional ones |
| Analyze | Save the report as `specs/<dir>/analyze-report.md`. If it reports problems, fix and re-run, at most twice. Report what remains |
| Technology | `spec.md` describes behaviour without naming libraries, file layouts or APIs. Constraints the owner set go in a `## Constraints` section of the spec, taken from heading 11 of your brief, so that the specify checklist does not try to remove them. Technology choices below that level belong in `plan.md` |

## 4. The written form of a requirement

The coverage check reads the specs, so the form is fixed.

```markdown
- **F101-FR-012**: The engine MUST …
  - origin: 028 FR-005; C-101; B-0875
  - disposition: ported
  - test: PT-101-028FR005-*
  - divergence: DV-012
  - ep: EP-18 `specstride.critic-strategy/1` (implements)
  - parity: off
  - status: unverified (check: …; verified-on: —; pin: …)
```

| Field | When | Rule |
|---|---|---|
| Id | Always | `F<feature number>-FR-<nnn>` and `F<feature number>-SC-<nnn>`, three digits, unique. A cross-reference always uses the full id. Numbers are never reused after a deletion |
| `origin:` | The requirement carries an as-is behaviour | As-is ids with their origin, separated by `;`: `028 FR-012`, `011 SC-003`, `002 FR-040`, a cluster `C-101`, a behaviour item `B-0042` (four digits). A cluster id covers every item of the cluster that `traceability-items.tsv` assigns to your feature. Taken from `traceability-frs.tsv` and `traceability-items.tsv`, never invented |
| `disposition:` | With `origin:` | The disposition of the traceability files: `ported`, `translated`, `merged-with <id>` |
| `test:` | With `origin:`, and for every new requirement that has a named test | The test names of the traceability files (`PT-<feature>-…`, `CT-<feature>-<n>`), or a new name of the same pattern |
| `divergence:` | The requirement states an intended difference from today's behaviour | `DV-001` to the last row of the register. If you need a row that does not exist, write `divergence: DV-new-<n>` and report it; the orchestrator adds the row |
| `ep:` | The requirement implements or consumes an extension point | EP number, id with version, and `implements` or `consumes`. A feature that registers an entry in a registry owned by another feature writes `implements (an entry)` (W-X-19). For EP-01, feature 129 writes `consumes`: feature 100 sanctions a second implementer of EP-01 for 107 only (F100-FR-192), and 119 and 102 claim nothing |
| `parity:` | The requirement introduces an option or a switch | Its value under the `parity` profile |
| `status:` | A provider or host fact | `verified-on` date and version pin; or `unverified` with the check that would verify it. Facts from documentation only, all macOS behaviour, and detach survival inside a host session are `unverified` |

Every as-is requirement, success criterion and cluster that the traceability files assign to your
feature with a kept disposition (`ported`, `translated`, `merged-with`) appears in the `origin:` of at
least one of your requirements. Rows with `superseded-by` or `dropped` are listed in a table
"As-is behaviour not carried" in the spec, with the register row.

In `tasks.md` a test task names what it proves:

```markdown
- [ ] T014 [P] [US1] Parity test PT-101-028FR005-verdict-nonce in tests/parity/…
  - proves: 028 FR-005; C-101
  - fixture: FX-12
```

## 5. Rules for every spec

| Rule | Content |
|---|---|
| Terms | The glossary of `consolidation.md` section 1. "Run" is the logical run of one feature, which survives a resume and a relaunch; one start of the engine process is an "engine start". "Micro-loop" has its new meaning; the old README's use is "recovery cycle". A term marked "never bare" is written in its qualified form: phase gate, launch check, verification gate, phase attempt, stage attempt, launch contract, launch bundle, spec bundle, engine hook, host hook, harness adapter, auth tier, model tier |
| Harnesses | No requirement assumes a closed list of harnesses. Anything that enumerates harnesses reads the registry, which includes discovered ones |
| Critic | The critic never approves its own session. The critic-diversity rule and its warning are specified where a feature touches the critic |
| Extension points | A feature names the extension points it implements or consumes, with versions (EP-01 to EP-19), in a section `## Extension points` |
| Options | Every new option states its value under the `parity` profile |
| Tier 2 features cite feature 100 | A tier 2 feature cites only contracts of feature 100 (`specs/100-specstride/`), fixture families of feature 141 (`specs/141-parity-oracle/`) and the divergence register. It never cites another tier 2 feature's requirement as a precondition of its own text; where it consumes another feature's behaviour it names the contract of feature 100 through which it does so |
| Contradiction with feature 100 | If your brief or a ruling needs something the contracts of feature 100 do not offer or contradict, do not edit feature 100. Report it; the orchestrator changes feature 100 |
| Success criteria | Measurable. `feature-briefs.md` section D.5 assigns the prompt's criteria to their owning features; if your feature owns one, it is in your brief |
| Split | Only if `speckit-specify` yields more than about 45 requirements, and only along the requirement groups under heading 7 of your brief. You do not split. You propose the split in your analyze report and final message: which requirement ids leave, with their origins and tests. Feature 100 is never split |
| Language | Plain English, short sentences. No marketing language |

## 6. What you send back

Your final message to the orchestrator, as plain text:

1. The paths you wrote.
2. The number of functional requirements and of success criteria.
3. For each Spec Kit step: done or not, and the output file.
4. The questions the sources could not answer (section 3), each with its recommended answer.
5. Register rows you need that do not exist (`DV-new-<n>`), each with the text of the row.
6. Anything feature 100 lacks or contradicts.
7. The split you propose, if any.
8. What did not pass analyze after two repairs.
9. Every as-is id of your traceability rows that you could not place, and why.
