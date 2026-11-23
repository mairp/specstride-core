# Repair report — 130-adapter-dsh

Written by the repair agent of feature 130 on 2026-09-30, from the section "Feature 130" of
`docs/ecosystem/reviews/REPAIR-WORKLIST.md`. Paths are relative to `specs/130-adapter-dsh/`
unless they begin with `specs/` or `docs/`. Line numbers are those of the files after the repair.
Every item was checked against the file before it was changed. No id was renumbered or reused.
Nothing outside `specs/130-adapter-dsh/` was written. No model was called and no capture was run.

| Item | Class | Severity | State (`done`, `not applied`, `open`) | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-130-01 | repair | critical | done | `spec.md:222` (F130-FR-003), `:235` (F130-FR-005), `:293` (F130-FR-014), `:301` (F130-FR-015), `:438` (F130-FR-034), `:490` (F130-FR-042), `:496` to `:517` (F130-FR-043 to F130-FR-045); `plan.md:77`, `:97` to `:103`, `:205` to `:210`; `tasks.md:299` to `:320`; `data-model.md`; `research.md` (D-11); `quickstart.md` (step 7); `contracts/descriptor-dsh.json`; `contracts/capture-plan.json` | Verified: row VIII was ticked and the spec said nothing of native memory beyond a null switch. Row VIII is now a deviation with a Complexity Tracking row |
| W-130-02 | queue | critical | done | The same requirements carry `assumption: CQ-189` | Proceeds on the recommended answer of CQ-189 |
| W-100-19 | repair | critical | done | `plan.md:77`, `:78`, `:97` to `:103`, `:205` to `:210`; `spec.md:373` (F130-FR-025) | The Complexity Tracking row on the prompt as an argument is removed; row VIII says the bounded-argument rule applies and is met; row IX is unticked and a deviation |
| W-100-20 | queue | critical | done | `plan.md:210`; `spec.md:373` | `assumption: CQ-182` |
| W-138-02 | repair | critical | done | `spec.md:228` (F130-FR-004), `:409` (F130-FR-030); `tasks.md` T014, T015, T068; `research.md` (D-12) | Verified: the bar was under `distributed` only. It now holds under every audience, for both roles |
| W-110-03 | repair | high | done | `spec.md:253`, `:351` (parity lines of F130-FR-008, F130-FR-022); the table of settings, `spec.md:650` to `:666` | Verified against annex X §X.8, lines 720 to 722 |
| W-100-23 | queue | medium | done | `spec.md:267` (F130-FR-010), `:318` (F130-FR-018); `plan.md` row XX; `tasks.md` T024 | `assumption: CQ-183`. F130-FR-010 was changed as well, because ruling 34 bears on the opt-in to C0 |
| W-X-05 | repair | medium | done | `spec.md`, clarification on the register; `plan.md:94` | 113 rows |
| W-X-07 | repair | medium | done | `plan.md:94` | DV-108 to DV-111 exist |
| W-X-11 | repair | medium | done | `spec.md:619` to `:648`; `:365`, `:431`, `:438`; `contracts/parity-rows.json` | Rows 117 and 118 by number; `rowsAskedFor` became `rowsOwned` with `row` and `status: confirmed` |
| W-X-14 | repair | medium | done | `plan.md:73` | Heading added |
| W-X-18 | repair | medium | done | `spec.md:484` (F130-FR-041); `tasks.md` T076 | The `ep:` line for EP-10 is on F130-FR-041, with one sentence on the resolver |
| W-X-19 | repair | medium | done | `spec.md:235`, and the row of EP-14 in "Extension points" | `implements (an entry)` |
| W-X-20 | repair | medium | done | `tasks.md:303` (T068) | Verified: no task named CT-130-30 |
| W-X-25 | repair | medium | done | `spec.md:358` (F130-FR-023); `plan.md` "Storage"; `data-model.md` | |
| W-100-16 | repair | low | done | `contracts/plugin-request.schema.json:3`, `contracts/plugin-receipt.schema.json:3` | `urn:specstride:schema:<as-is id>` |
| W-X-33 | repair | low | done | `spec.md:209` (F130-FR-001) | Names annex C §C.5 |
| Follow-up of feature 141 | — | — | done | `spec.md:394` (F130-FR-028), `:381` (F130-FR-026); clarifications; assumptions table | The note on CQ-141 is removed; CQ-187 is on F130-FR-026 |
| Table of feature 100, rows 17, 35, 39, 40 | — | — | done | `spec.md` row 30 (key `harnesses.dsh.overlay`); `plan.md:157` (place of the conformance suite) | Rows 23 and 24 (the names of the warning and of the pass): nothing to change, the feature used neither old word |

Counts: 17 items of the worklist done (2 own, 15 pointers), 0 not applied, 0 open; the follow-up
of feature 141 and the table of feature 100 done besides.

## Requirements added or changed in place

Changed in place (listed in `spec.md:806`, "Repairs after the cross-feature review"):
F130-FR-001, -003, -004, -005, -008, -010, -014, -015, -018, -022, -023, -024, -025, -026, -028,
-030, -033, -034, -041, -042, and F130-SC-008.

Added: F130-FR-043 (customisations in a proposer pass; CT-130-43; T069, T073), F130-FR-044
(native memory declared and recorded per run, ruling 37; CT-130-44; T070, T073), F130-FR-045
(refusal of the critic role; CT-130-45; T071, T074). Tasks added: T068 to T076.

Now: 45 functional requirements (not above 45), 9 success criteria, 76 tasks.

## What dsh may do in each role

| Role | Under the `parity` profile | Outside the `parity` profile |
|---|---|---|
| Proposer, named by the consumer | Runs as at the baseline. Every fixture names it (row 36). No flag or patch about memory or customisations is passed; the states are recorded as `as-is`; no new line is printed | Runs, with the unknown-terms warning. The profile is loaded: each kind of customisation and native memory has the state `not-switchable` (or `opted-in`), the switch is null in `capabilities`, the launch and the doctor say so, the run record holds it. Deviation from Principle VIII (CQ-189) |
| Proposer, not named | Not reached | Never: not a default, not picked, under every audience |
| Critic, named by the consumer | Runs as at the baseline: no proof (`harnesses.dsh.critic.proof` is `none`), no check of memory, the working directory and the default window of the baseline | Refused unless all hold: version equal to the pin, every tool id covered by the patch, a known window, and native memory shown to be `off` or `absent`. Today the last is not established, so the role is refused with `memory-not-off` until capture 6 exists. When it runs: weaker proof, recorded per call (deviation from Principle IX, CQ-182), unknown-terms warning |
| Critic, not named | Not reached | Never: not the default critic, never picked in any step of the critic order, under every audience (`terms-unknown`) |
| Plugin install into the real home | As the fixture sets the allowlist | Only for plugins of the allowlist (ruling P15), the one exception to ruling 36 |
| Parallel units | Off | Off, unless `loop.parallel.allow_detect` is set in user configuration |

## What another feature or the orchestrator must do

| # | Who | What |
|---|---|---|
| 1 | Feature 100 | Two rows in annex X §X.6, owner 130: kinds of customisation of the profile of dsh (`plugins`, `host-hooks`, `skills`, `tool-servers`; unknown: recorded as `not-switchable`); states of a customisation or of native memory (`off`, `absent`, `opted-in`, `not-switchable`, `as-is`; unknown: read as `not-switchable`) |
| 2 | Feature 100 | Row 131 of annex X §X.7 names the owners 131 and 134. Feature 130 now reads the key for dsh; add 130 to the owners |
| 3 | Feature 100 | Annex B §B.20 holds no row for the schema ids `specstride-dsh-plugin-request/v1` and `specstride-dsh-plugin-install/v1`. The two files use `urn:specstride:schema:<id>` with the as-is id. If they are no contract, the form becomes `urn:specstride:schema:internal:130:<name>/1` |
| 4 | Feature 110 | `harnesses.<id>.proposerCustomisations` in the key list, if not there yet (`config-keys.tsv` holds no such line today) |
| 5 | Features 109 and 124 | F130-FR-045 reports `memory-not-off` with the typed failure `capability_absent`. No contract names the typed failure for this refusal; this is a choice of this repair |
| 6 | Orchestrator | A capture 6 is needed before dsh can be a critic outside the `parity` profile. It is not paid. It was not run |

## New questions (each with a recommended answer and its source)

| # | Question | Sources | Recommended answer | If answered otherwise |
|---|---|---|---|---|
| N-1 | Is the critic role on dsh refused while it is not established whether the harness keeps a native memory? | F100-FR-082; F109-FR-022; row 182 of annex X §X.6; CQ-189 | Yes: a state that is not established is read as not off (this repair's reading; no report recommends it) | The role is admitted until a capture shows a memory; F130-FR-045 changes |
| N-2 | May a critic-class call on dsh run with a customisation of the profile that gives the model no tool and cannot be switched off (a host hook, for example)? Row 131 of annex X §X.7 says customisations are never loaded into a critic-class call | Row 131; Principles VIII and IX; ruling 36; F130-FR-024 | No: refuse the role as for native memory, once capture 6 shows that such a customisation exists. Until then F130-FR-045 records and warns (this repair's reading) | F130-FR-045 stays |
| N-3 | Does "user config" in ruling P15 mean the user configuration only? F130-FR-034 accepts the allowlist from user configuration, the environment or flags; the baseline sets it by a variable, and fixtures of FX-38 do | Ruling P15; ruling 35; CQ-183; annex X §X.8 line 720 | Outside the `parity` profile the user configuration only; under the profile the as-is variable stays (this repair's reading, by analogy with CQ-183) | F130-FR-034 stays |

## Register rows needed (with the text)

None. DV-108 to DV-111 exist. The new requirements cite DV-002, DV-047 and DV-110.

## Checks

| Check | Result |
|---|---|
| Generator or check of its own in `contracts/tools/` | None exists in this feature |
| `python3 docs/ecosystem/check-traceability.py --require-all` | PASSED: checks a to h; 130-adapter-dsh 66 of 66 |
| JSON files of `contracts/` | All parse |
| Requirements, tests and tasks | 45 requirements, each in a task; every test name of `spec.md` is in `tasks.md`; no unknown id |
| Fact verified in this repair | `dsh --version` gives `0.1.0-rc.8`; `dsh --help` lists `--dump-config` and `--dump-default-config` (2026-09-30). Nothing else was run |
| Every changed requirement read again | Done; findings 1 and 2 of the analyze report are what the reading left |
