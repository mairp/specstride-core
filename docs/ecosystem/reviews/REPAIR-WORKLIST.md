# REPAIR-WORKLIST — act 8.6a of Stage B

Compiled on 2026-09-29 by an independent agent from the thirteen review reports `B-8.2a` to `B-8.4c` in
`docs/ecosystem/reviews/` (180 findings: B-8.2a 17, B-8.2b 12, B-8.2c 15, B-8.2d 21, B-8.2e 21, B-8.2f 17, B-8.3a 17, B-8.3b 14, B-8.3c 13, B-8.3d 12, B-8.4a 4, B-8.4b 9, B-8.4c 8).
All paths are relative to `/root/specstride-claude`. Paths, lines and ids are copied from the reports.
The findings were not verified again against the specs, except where two reports disagree (section 5).

## How to read this file

| Subject | Rule |
|---|---|
| Item | One item per distinct fault. It lists every finding it merges. A finding that holds several faults is cited by several items, each with the mark "(part)" |
| Id | `W-<feature>-<nn>` for an item that one feature owns; `W-X-<nn>` for an item of section 3, "Across features"; `W-ORC-<nn>` for an item of the orchestrator (section 4) |
| Severity | The highest severity among the merged findings. One exception by order of the orchestrator: the fault of ruling P14 is `critical` (B-8.2e-001), although B-8.4c-001 rates it `medium` |
| Owner | The feature whose text is wrong or that must decide. Where a finding says feature 100 is the stale side, the item belongs to feature 100 |
| Pointer | An item that also changes files of another feature appears in that feature's section under "Items owned elsewhere that change files of this feature", with the places of that feature and the rule. A repair agent works from its own section: its own items first, then the pointers |
| Order | Section 1 (feature 100) is in the order of work. Every other section is ordered critical, high, medium, low |
| `depends on:` | Names the item that must be done first. Where no item is named, the item can start at once |
| Class `queue` | The specs proceed on the recommended answer. "Recommended answer (B-8.x)" means that report recommends it; "(compiler of this worklist)" means no report recommends an answer and the narrowest reading that lets the work continue is given |

## Front matter

### Items by class and severity

| Class | critical | high | medium | low | Total |
|---|---|---|---|---|---|
| `repair` | 5 | 24 | 72 | 30 | 131 |
| `queue` | 3 | 0 | 9 | 1 | 13 |
| `close-queue` | 0 | 0 | 10 | 0 | 10 |
| `register` | 1 | 2 | 0 | 0 | 3 |
| `orchestrator` | 0 | 1 | 5 | 4 | 10 |
| `accept` | 0 | 0 | 0 | 3 | 3 |
| **Total** | 9 | 27 | 96 | 38 | **170** |

170 items carry the 180 findings. 36 of the items are in section 3 ("Across features").

### Features by number of items

| Feature | Own items | critical | high | medium | low | Pointers to items owned elsewhere | Total to work through |
|---|---|---|---|---|---|---|---|
| 100-specstride | 26 | 2 | 3 | 16 | 5 | 12 | 38 |
| 101-gate-and-verdict | 3 | 0 | 0 | 3 | 0 | 8 | 11 |
| 102-run-control | 0 | 0 | 0 | 0 | 0 | 11 | 11 |
| 103-proposer-pass | 1 | 0 | 0 | 1 | 0 | 10 | 11 |
| 104-spec-input | 1 | 0 | 1 | 0 | 0 | 10 | 11 |
| 105-verification | 3 | 0 | 1 | 2 | 0 | 13 | 16 |
| 106-learning | 3 | 0 | 1 | 0 | 2 | 12 | 15 |
| 107-launch-contract | 0 | 0 | 0 | 0 | 0 | 12 | 12 |
| 108-reverse | 1 | 0 | 0 | 1 | 0 | 9 | 10 |
| 109-harness-seam | 0 | 0 | 0 | 0 | 0 | 17 | 17 |
| 110-config-and-terms | 13 | 0 | 4 | 6 | 3 | 15 | 28 |
| 111-event-schema-and-projection | 9 | 0 | 3 | 4 | 2 | 10 | 19 |
| 112-doctor | 2 | 0 | 0 | 0 | 2 | 8 | 10 |
| 113-host-claude-code | 3 | 1 | 0 | 1 | 1 | 9 | 12 |
| 115-micro-loop-layer | 3 | 0 | 0 | 2 | 1 | 17 | 20 |
| 116-check-integrity-and-unit-evidence | 1 | 0 | 0 | 1 | 0 | 10 | 11 |
| 117-critic-grounding-and-prompt | 0 | 0 | 0 | 0 | 0 | 10 | 10 |
| 118-pass-supervision-and-jobs | 1 | 0 | 0 | 1 | 0 | 10 | 11 |
| 119-front-door-and-presenter | 1 | 0 | 0 | 1 | 0 | 10 | 11 |
| 122-detached-runtime | 2 | 0 | 0 | 2 | 0 | 10 | 12 |
| 123-pipeline-runtime-and-supervisor | 4 | 1 | 1 | 1 | 1 | 11 | 15 |
| 124-harness-discovery-and-roles | 0 | 0 | 0 | 0 | 0 | 5 | 5 |
| 125-adapter-claude | 4 | 0 | 1 | 3 | 0 | 9 | 13 |
| 126-stream-seam-and-invocation | 4 | 0 | 2 | 1 | 1 | 8 | 12 |
| 127-quota-budgets-and-pause | 2 | 0 | 0 | 2 | 0 | 11 | 13 |
| 128-telemetry-export | 4 | 0 | 0 | 1 | 3 | 15 | 19 |
| 129-run-view-and-status | 1 | 0 | 0 | 1 | 0 | 5 | 6 |
| 130-adapter-dsh | 2 | 2 | 0 | 0 | 0 | 15 | 17 |
| 131-adapter-codex | 2 | 0 | 0 | 1 | 1 | 9 | 11 |
| 134-adapter-pi | 1 | 0 | 0 | 1 | 0 | 11 | 12 |
| 138-adapter-prime | 3 | 2 | 0 | 1 | 0 | 12 | 15 |
| 140-reverse-inventory-and-lint | 1 | 0 | 1 | 0 | 0 | 8 | 9 |
| 141-parity-oracle | 3 | 0 | 0 | 2 | 1 | 7 | 10 |
| 142-parallel-units | 1 | 0 | 0 | 0 | 1 | 10 | 11 |
| 143-parallel-engine-services | 1 | 0 | 0 | 1 | 0 | 5 | 6 |
| 144-compatibility-projection | 3 | 0 | 1 | 1 | 1 | 8 | 11 |
| 145-presenter | 0 | 0 | 0 | 0 | 0 | 8 | 8 |
| 146-harness-discovery | 1 | 0 | 1 | 0 | 0 | 5 | 6 |
| 147-terms-gate | 0 | 0 | 0 | 0 | 0 | 7 | 7 |
| 148-check-runner | 1 | 0 | 0 | 1 | 0 | 7 | 8 |
| 149-attempt-planner-and-seams | 0 | 0 | 0 | 0 | 0 | 3 | 3 |
| Across features (section 3) | 36 | | | | | | |
| Orchestrator (section 4) | 23 | | | | | | |

### Proposed new queue questions

Each was checked against `docs/ecosystem/CLARIFY-QUEUE.md` (CQ-001 to CQ-181). None is covered by an open question;
where a related question exists, the item names it. The orchestrator gives each a `CQ` number.

| # | Item | Severity | Question | Recommended answer | Recommended by |
|---|---|---|---|---|---|
| Q-01 | W-100-20 | critical | Principle IX says that the adapter verifies from the harness's own initial record that the tool list is empty and the session is the one it minted, and that any other result halts the run. May a tested harness adapter whose stream has no initial record prove the tool-less form by its exact version pin and its preflight ("the weaker proof")? | Yes, for a tested harness adapter only, recorded for every call as the weaker proof; Principle IX gets a PATCH that names it | B-8.3a |
| Q-02 | W-113-01 | critical | The brief of feature 113 asks for a skill-trigger suite with three runs at a pinned model on every pull request, and for a nightly and a weekly paid run (`docs/ecosystem/feature-briefs.md:5309`). Principle XII (NON-NEGOTIABLE) says no test and no CI job calls a paid or external model API, and model ids are configuration. Both were approved. Which holds? | Principle XII holds: the trigger suite, the nightly smoke and the weekly report leave CI and become tasks run by a person, paid and logged, as feature 115 does for its experiments (`specs/115-micro-loop-layer/tasks.md:22`); F113-FR-038 changes from "MUST gate each pull request" to a release check; the model comes from configuration | compiler of this worklist; B-8.3b offers this and the deviation as equal options and says the orchestrator has to choose |
| Q-03 | W-130-02 | critical | Ruling 36 says plugins, hooks, skills and MCP servers are off at auth tier 1, and Principle VIII says they are not loaded into a pass unless the consumer opts in. The dsh harness offers no switch that the adapter uses, and F130-FR-014 links every entry of the real home into the throwaway home. Ruling P15 is the one exception to ruling 36 and covers plugin installs only. May dsh be used as proposer with its profile loaded? | Yes, when the consumer names dsh (ruling P14): each customisation that cannot be switched off is reported as null in `capabilities`, warned by the doctor and recorded per run, and the plan records the deviation. The critic role is refused where a native memory exists and cannot be switched off | compiler of this worklist; B-8.3c asks for the question to be queued and proposes the reporting as the repair |
| Q-04 | W-100-23 | medium | Ruling 34 says no containment "only by opt-in in user config", and ruling P2 says `loop.parallel.allow_detect` is set "in user config". Does "user config" stand for the user configuration only, or for every consumer-controlled source of ruling 35 (user configuration, environment, flag)? | The user configuration only, as both rulings are worded | B-8.4a for ruling 34 ("until it is answered read (a)"); compiler of this worklist for ruling P2 |
| Q-05 | W-100-24 | medium | F119-FR-009 lets `resume` exit 1 when the workspace has no state; F102-FR-012 lets it exit 3 when no run snapshot exists, and makes that check the first. For a workspace without state both apply. Which check comes first? | As at the baseline (B-1482 before B-1494): the state check of F119-FR-009 comes first and exits 1; then F102-FR-012 exits 3 | B-8.2b |
| Q-06 | W-100-25 | medium | F100-FR-012 forbids a core package to start a process or open a connection and does not name the file system; the package graph forbids write calls of `node:fs` to `@specstride/layer-parallel` only. Four plans read the rule in three ways. May a core package import `node:fs`? | No: a core package reads and writes files through the kernel and through the ports of the edge packages; annex A says so in F100-FR-012 | compiler of this worklist; B-8.3b asks the orchestrator to decide and recommends no answer |
| Q-07 | W-100-26 | medium | Principle VI and ruling 18 keep the Language Ledger empty. The build runs `contracts/tools/generate.py --check` (features 100 and 141), a `sitecustomize` file for line tracing (141) and `docs/ecosystem/check-traceability.py` (109, 110, 117, 118, 141). None is shipped. Is a tool of the build a component in the sense of the Language Ledger? | No, where the file is outside every published package and the build states Python 3 as a requirement of development; otherwise the three pieces are ported to TypeScript | B-8.3d |
| Q-08 | W-105-03 | medium | Ruling P11 lets two verification commands run side by side on the strength of their declared reads and writes. F105-FR-016 accepts `reads`, `writes`, `sideEffects` and `resource` from the verification-commands document, a file of the project; F107-FR-037 lets them enter derivation only from user configuration, the environment or a flag, and never from repository text. Which source is allowed? | Not from repository text: F107-FR-037 stands, and a declaration that lacks that provenance counts as undeclared, which by ruling P11 means serial | compiler of this worklist; B-8.4c leaves the choice to the orchestrator and recommends no answer |
| Q-09 | W-115-02 | medium | Ruling 46 says escalation never lands on the critic's model. Ruling 49 says a higher effort on the critic's model is not a collision and is allowed with the same-model warning. The escalation rule skips a rung on the critic's model whatever the effort. Does ruling 49 allow an escalation rung that is the critic's model at a higher effort? | Yes, with the same-model warning | B-8.4b |
| Q-10 | W-127-01 | medium | F127-FR-025 makes `wallClock`, `phaseAttempts` and `calls` hard ceilings, and F127-FR-034 sends every reached hard ceiling to `blocked-on-human` with `budget-cap`, `wall_budget`, `retryable: false`. F127-FR-027 ends a tripped wall-clock budget "as the baseline". Annex E §E.3 gives `wall_budget` `retryable: true` except for `budget-cap`, which it defines as a cap of spend. Is the wall-clock ceiling of a run (`loop.maxWallMin`) a hard ceiling in the sense of F127-FR-034? | No: a tripped wall-clock budget ends as at the baseline, with `retryable: true` and no blocked reason; `budget-cap` is for caps of spend | B-8.2b (its first repair) |
| Q-11 | W-141-01 | medium | May a fixture of FX-18 or FX-26 change the reference tree, or shadow the interpreter, to reach a line that runs only when a file of the reference is missing or cannot be written? | No. The reference tree is read-only and a stub takes only the names of §O.3. An item that no fixture reaches goes to the correction list | feature 141, in its own table of readings; no review report |
| Q-12 | W-141-02 | medium | Which are the error classes of the validation of a launch contract? No closed set of feature 100 holds them. | The ten validators of the baseline, as the table of pattern members names them; feature 107 states them as a closed set | feature 141, in its own table of readings; no review report |

Items of class `queue` that an open question already covers: W-110-11 (CQ-160).

### Questions of the queue to close

| Item | Question | Evidence |
|---|---|---|
| W-ORC-10 | CQ-033 | `specs/100-specstride/annexes/B-state.md:245` (`run:<runId>:events-legacy:<k>`, the file of the engine start with the ordinal `<k>`) and F100-FR-229 (`:291`): one file per engine start, as the question recommends |
| W-ORC-11 | CQ-038 | `specs/100-specstride/annexes/B-state.md:246` (`launch:<launchId>:comment`) and F100-FR-229 (`:291`), as the question recommends |
| W-ORC-12 | CQ-044 | `specs/100-specstride/annexes/B-state.md:254` (`run:<runId>:task-list`, written by the engine at launch, read by the engine and the loop layers) |
| W-ORC-13 | CQ-065 | `specs/100-specstride/annexes/B-state.md:250` (`package:harness:<id>`, place `package`), as the question recommends |
| W-ORC-14 | CQ-093 | `specs/100-specstride/annexes/B-state.md:255` to `:257` (`reverse:<slug>:claims:<unit-key>`, `reverse:<slug>:test-plan`, `reverse:<slug>:scaffolds`, all in the workspace part), as the question recommends |
| W-ORC-15 | CQ-123 | `specs/100-specstride/annexes/B-state.md:252` (`package:context-budget`), as the question recommends |
| W-ORC-16 | CQ-181 | `specs/100-specstride/annexes/B-state.md:254` (`run:<runId>:task-list`) |
| W-ORC-17 | CQ-099 | `specs/100-specstride/annexes/B-state.md:678` (`specstride.inspect.<verb>/1`, owner 119), as the question recommends |
| W-ORC-18 | CQ-105 | `specs/100-specstride/annexes/B-state.md:669` to `:672` (`specstride.invocation/1`, `specstride.producer-status/1`, `specstride.provider-terminal/1`, `specstride.invocation-result/1`, owner 126), as the question recommends |
| W-ORC-19 | CQ-114 | `specs/100-specstride/annexes/B-state.md:674` (`specstride.retrospective/1`, owner 106), as the question recommends |

### Generated contract files of feature 100 that change

No generated file is edited by hand. The annexes and `specs/100-specstride/contracts/sources/package-graph.json` change, the tool
`specs/100-specstride/contracts/tools/generate.py` is corrected first, and one run of the generator writes the files again
(`python3 specs/100-specstride/contracts/tools/generate.py`, then `--check`).

| Generated file (under `specs/100-specstride/contracts/`) | Changed by the items on |
|---|---|
| `data/parity-profile.json` | the field `keys` of the generator; rows 30 and 34; row 124; the key of the ceiling of workers (row 21); the unit suffixes of row 65 (CQ-160); a row for the opt-ins of the adapters, if one is added |
| `data/package-graph.json` | the owners after the splits 115 → 116 and 142 → 143; the last rule of the graph; the list of modules a core package may not import, if the question on `node:fs` is answered as recommended |
| `data/closed-sets.json` | the owner of rows 142 and 143; "Closed by" of row 64; three new rows of feature 111 |
| `data/further-schema-ids.json` | the owner of `specstride.protected-set/1` and `specstride.check-result/1`; the new id `specstride.span-state/1` |
| `data/exit-codes.json`, `data/cli-protocol.json` | the row "unknown first argument" of annex G §G.4; the row `resume` (question on the exit code without state); the exit table of annex E ("pass" for "iteration") |
| `data/loop-layer-tables.json` | the signal `targetIsCriticModel` (question on rulings 46 and 49) |
| `extension-points/EP-16.toolchain.json` | the content owner 116 and the consumers; the place of the schema file |
| `extension-points/EP-04.loop-layer.json` | the owner of the engine services, 143 |
| `requirements.json` | every requirement whose text changes or is added: F100-FR-012, F100-FR-119, F100-FR-127, F100-FR-130, F100-FR-143, F100-FR-146, and the new requirement for threat T-43 |
| `annex-tables/A-foundations.json` to `X-cross-layer.json` | every annex that an item changes: A, B, C, D, E, F, G and X |

Not changed: `data/layout.json`, `data/layout-old-side.json`, `data/identifiers.json`, `data/stop-reasons.json`,
`data/run-state-machine.json`, `data/threat-model.json` (the rows of §X.9 stay; only the requirement for T-43 is
added), the 30 files of `schemas/`.

## 1. Feature 100 — 100-specstride

Feature 100 is repaired first and alone, because every other feature cites it. The items are in the order of
work, not in the order of severity.

| Steps | What | How |
|---|---|---|
| The items of class `repair` from the first to the one on threat T-43 | The generator, the annexes, `spec.md`, the README of the contracts and `contracts/sources/package-graph.json` | One agent, in the order given. After the last of them: one run of the generator and one run with `--check`. The files that change are listed in the front matter |
| The item on the closed sets of feature 111 | Annex X §X.6 | It waits for feature 111. It is the only contract step of feature 100 that waits for another feature |
| The three items on the plan (rows IX, VI and XII) | `plan.md`, `research.md`, `tasks.md`, `quickstart.md` | Independent of the contract steps; they change no contract |
| The items of class `queue` | The orchestrator queues the question at once | The specs proceed on the recommended answer. Where the item says that a change waits for the orchestrator, the repair agent of feature 100 makes it only after the question has its number |

Where an item of another feature names an item of this section under `depends on:`, the repair agent of that
feature starts the item only after the generator has run.

Places of feature 100 that items of section 3 change are listed at the end of this section as pointers.

| Step | Item | Class | Severity | Subject |
|---|---|---|---|---|
| 1 | W-100-01 | `repair` | high | The generator writes a field `keys` of the profile rows that is not a list of keys |
| 2 | W-100-02 | `repair` | high | Owners that were not moved with the split 115 → 116 (EP-16, the fact block, two schema ids, closed sets 142 and 143, the package `@specstride/integrity`) |
| 3 | W-100-03 | `repair` | high | Owners that were not moved with the split 142 → 143 (engine services of EP-04, the tree store, the ledger kinds of `parallel`) |
| 4 | W-100-04 | `repair` | medium | Annex X §X.7: owner of row 34 and the key of row 30 |
| 5 | W-100-05 | `repair` | medium | Defaults of `verification.testPlan` and `verification.generateTests` (row 124 of §X.7) |
| 6 | W-100-06 | `repair` | medium | Ruling P5: the ceiling of four workers is a constant, the ruling says "both configurable" |
| 7 | W-100-07 | `repair` | medium | Closed set 64 (operations of the tree store) is marked "Owner decision" |
| 8 | W-100-08 | `repair` | medium | Annex X §X.8: six rows stand twice, and two keys are still marked "(proposed)" |
| 9 | W-100-09 | `repair` | medium | Annex B §B.20: the schema id of the span state is missing; the owner of the inspection records after the split 119/145 |
| 10 | W-100-10 | `repair` | low | Feature 100 does not say where the schema file of an extension point lives (EP-16, `specstride.toolchain/1`) |
| 11 | W-100-11 | `repair` | low | Annex G §G.4: the row "unknown subcommand" does not say that it is about the first argument |
| 12 | W-100-12 | `repair` | low | F100-FR-143 names the proof "that the critic holds no tools"; F100-FR-218 names both forms |
| 13 | W-100-13 | `repair` | medium | `spec.md` names a sub-point "discovery: 146" of EP-02 that annex C, the contract and the briefs do not have |
| 14 | W-100-14 | `repair` | medium | "Iteration" as a counted unit, and four names for one limit |
| 15 | W-100-15 | `repair` | low | One warning under two names: "critic-diversity warning" and "same-model warning" |
| 16 | W-100-16 | `repair` | low | The form of `$id` of a schema file is stated nowhere; the features use four other forms |
| 17 | W-100-17 | `repair` | medium | The control of threat T-43 is in no spec and no annex; feature 100 names none of its own threats |
| 18 | W-100-18 | `repair` | medium | Three sets of event causes are in no row of §X.6, and `run.ended.cause` has two sets (rows 5 and 96) |
| 19 | W-100-19 | `repair` | critical | The weaker proof of a tool-less critic departs from the text of Principle IX and is recorded in no Complexity Tracking |
| 20 | W-100-20 | `queue` | critical | Is the weaker proof of a tool-less critic allowed under Principle IX? |
| 21 | W-100-21 | `repair` | medium | The build of the product runs a Python generator; the plan says the Language Ledger stays empty and nothing orders the port before a release |
| 22 | W-100-22 | `repair` | medium | Row XII says no test of feature 100 calls a model; CT-100-324 is a live run |
| 23 | W-100-23 | `queue` | medium | Does "user config" in rulings 34 and P2 mean the user configuration only? |
| 24 | W-100-24 | `queue` | medium | `resume` on a workspace without state: exit 1 or exit 3? |
| 25 | W-100-25 | `queue` | medium | May a core package import `node:fs`? |
| 26 | W-100-26 | `queue` | medium | Are tools of the build that are never shipped outside the Language Ledger? |

### W-100-01 · `repair` · high — The generator writes a field `keys` of the profile rows that is not a list of keys

- Findings merged: B-8.2e-004
- Files and lines:
  - Feature 100: `specs/100-specstride/contracts/tools/generate.py`; result seen in `specs/100-specstride/contracts/data/parity-profile.json:1299` and in the field `keys` of rows 13, 37, 44, 45, 60, 61, 63, 65, 66, 67, 108 and of the other rows with several keys (row 86 holds `stream.capture`; rows 13, 37, 63, 66, 67 hold a flag or a verb; row 108 holds `.tokens` and `.calls` twice)
- Change: In `generate.py`: expand a short form (`.tokens`) against the last full key; take only names inside the first pair of backticks that are keys; leave `keys` empty for a row whose cell starts with "—". Do this first, so that the one run of the generator at the end of the contract steps writes the corrected field.
- Side that changes: feature 100 (the tool; no annex text changes)
- Generated contract files that change: `contracts/data/parity-profile.json`
- depends on: none

### W-100-02 · `repair` · high — Owners that were not moved with the split 115 → 116 (EP-16, the fact block, two schema ids, closed sets 142 and 143, the package `@specstride/integrity`)

- Findings merged: B-8.2f-001, B-8.2c-007, B-8.2d-004, B-8.2f-017 (part)
- Files and lines:
  - Feature 100: `specs/100-specstride/spec.md:367` (row of EP-16: write 116); `specs/100-specstride/spec.md:732` (delete the row "Owners of 116 and 143 ... stand until they report"); `specs/100-specstride/annexes/C-ports-and-edges.md:857` (write "116. Consumed by 105, 148, 143 and 112"); `specs/100-specstride/annexes/D-pass-loop.md:396` (fact block: 116); `specs/100-specstride/annexes/B-state.md:667-668` (owner of `specstride.protected-set/1` and `specstride.check-result/1`: 116); `specs/100-specstride/annexes/X-cross-layer.md:313`, `:314` (rows 142 and 143 of §X.6: owner 116); `specs/100-specstride/contracts/sources/package-graph.json` (`@specstride/integrity`: owner 116; delete the last rule "Owners of the two splits that still run ... are not yet applied", line 324 of the generated file)
  - Feature 105: `specs/105-verification/spec.md:36` — write 116 for the owner of fingerprints, the protected set and toolchain profiles
  - Feature 116: `specs/116-check-integrity-and-unit-evidence/contracts/README.md:22-23` — replace "new schema ids, reported" by the citation of annex B §B.20; `:15-16` stay
  - Feature 148: `specs/148-check-runner/spec.md:37` — write 116 for the same owner
- Change: Feature 100 is the stale side: annex X already gives rows 27, 65, 66, profile row 32 and threats T-20, T-24 to 116, and the briefs (D.3) and feature 116 name 116. Write 116 in the places listed and generate the contracts again.
- Side that changes: feature 100; features 105, 148 and 116 change one sentence each
- Generated contract files that change: `contracts/extension-points/EP-16.toolchain.json`, `contracts/data/package-graph.json`, `contracts/data/closed-sets.json`, `contracts/data/further-schema-ids.json`, `contracts/annex-tables/B-state.json`, `C-ports-and-edges.json`, `D-pass-loop.json`, `X-cross-layer.json`
- Note: B-8.3b (section "Checked", feature 116) did not report this, because the graph's rule 5 and `docs/ecosystem/STAGE-B-F100-AMENDMENTS.md:223` record that the owners are not applied. Both splits are complete, so the record is stale and the owners are applied now (section 5, point 3).
- depends on: none

### W-100-03 · `repair` · high — Owners that were not moved with the split 142 → 143 (engine services of EP-04, the tree store, the ledger kinds of `parallel`)

- Findings merged: B-8.2f-002, B-8.3d-004 (part), B-8.2f-017 (part)
- Files and lines:
  - Feature 100: `specs/100-specstride/annexes/D-pass-loop.md:94-95` (write "The implementation `parallel`: 142. The engine services behind the group directives: 143"); `:147` (content owner of the tree-store service: 143); `specs/100-specstride/spec.md:355` (write "103 (`micro`: 115; `parallel`: 142; engine services: 143)"); `specs/100-specstride/annexes/B-state.md:491` (name 143 for the record kinds of the namespace `parallel` that the briefs, A.1a, moved); `specs/100-specstride/contracts/sources/package-graph.json` (`@specstride/tree-store`: owner 143; generated file lines 115 to 135)
- Change: Feature 100 is the stale side: annex X gives rows 62, 64 and profile row 95 to 143, the briefs name 143, and feature 143 implements the services. Write 143 in the places listed and generate again.
- Side that changes: feature 100
- Generated contract files that change: `contracts/extension-points/EP-04.loop-layer.json`, `contracts/data/package-graph.json`, `contracts/annex-tables/B-state.json`, `D-pass-loop.json`
- depends on: none

### W-100-04 · `repair` · medium — Annex X §X.7: owner of row 34 and the key of row 30

- Findings merged: B-8.2e-008 (part), B-8.2e-021 (part)
- Files and lines:
  - Feature 100: `specs/100-specstride/annexes/X-cross-layer.md:498` (row 34, `distribution.audience`: owner "147" in place of "110; read by 147"); `specs/100-specstride/annexes/X-cross-layer.md:494` (row 30: name the key `harnesses.<id>.overlay` in the key column)
  - Feature 108: `specs/108-reverse/spec.md:501` — in the column of the row for `loop.gitCommits` write "none; not a switch"
- Change: Row 34: feature 147 owns the audience (`specs/147-terms-gate/spec.md:17`), so feature 100 is the stale side. Row 30: feature 110 confirms the key with the value `none` under `parity` (`specs/110-config-and-terms/spec.md:183`, `:330`).
- Side that changes: feature 100; feature 108 one table cell
- Generated contract files that change: `contracts/data/parity-profile.json`, `contracts/annex-tables/X-cross-layer.json`
- depends on: none

### W-100-05 · `repair` · medium — Defaults of `verification.testPlan` and `verification.generateTests` (row 124 of §X.7)

- Findings merged: B-8.2e-009 (part)
- Files and lines:
  - Feature 100: `specs/100-specstride/annexes/X-cross-layer.md`, §X.7 row 124 (the report gives no line)
  - Feature 105: `specs/105-verification/spec.md:188` (F105-FR-002), `:520`, `:522`; `specs/105-verification/contracts/parity-rows.json` (entries of the two keys) — no change; they are the reference
  - Feature 110: `specs/110-config-and-terms/spec.md:157` — the same two defaults
- Change: Write the defaults of feature 105, which owns the meaning: `testautomation/<slug>/TEST_PLAN.md` and `testautomation/<slug>/generated`, "unless the mode is `off`", in place of "none".
- Side that changes: feature 100 and feature 110 (B-8.2e names 105 as the owner of the meaning)
- Generated contract files that change: `contracts/data/parity-profile.json`, `contracts/annex-tables/X-cross-layer.json`
- depends on: none

### W-100-06 · `repair` · medium — Ruling P5: the ceiling of four workers is a constant, the ruling says "both configurable"

- Findings merged: B-8.4c-002
- Files and lines:
  - Feature 100: `specs/100-specstride/annexes/D-pass-loop.md:214` (F100-FR-127); `specs/100-specstride/annexes/X-cross-layer.md:485` (row 21 of §X.7, in the rows 20 to 23 at `:484` to `:487`)
  - Feature 110: `specs/110-config-and-terms/spec.md:146`; `specs/110-config-and-terms/contracts/config-keys.tsv` (one new line, owner 142, widening)
  - Feature 142: `specs/142-parallel-units/spec.md:272` (F142-FR-019); `specs/142-parallel-units/tasks.md:78` (T022)
- Change: Add a key for the ceiling (B-8.4c gives `loop.parallel.workersMax` as an example), default 4, widening, and let a value of `loop.parallel.workers` above the ceiling be the configuration error. State it in F100-FR-127, F142-FR-019, row 21 and the key table of 110.
- Side that changes: feature 100 first, then 142 and 110. Authority: ruling P5 ("two workers by default, at most four, both configurable") and CQ-006 ("both in config")
- Generated contract files that change: `contracts/data/parity-profile.json`, `contracts/requirements.json`, `contracts/annex-tables/D-pass-loop.json`, `X-cross-layer.json`
- Note: B-8.4c leaves the choice to the orchestrator. If the orchestrator reads "both configurable" as "the count is configurable between 1 and 4", no key is added, the reading is recorded in the clarifications of 142, and the question goes to the queue.
- depends on: none

### W-100-07 · `repair` · medium — Closed set 64 (operations of the tree store) is marked "Owner decision"

- Findings merged: B-8.4c-004
- Files and lines:
  - Feature 100: `specs/100-specstride/annexes/X-cross-layer.md:235` (row 64 of §X.6)
  - Feature 143: `specs/143-parallel-engine-services/spec.md:389` (table of closed sets)
- Change: Write "Design" in the column "Closed by". The owner ruled only that the needed subset may be built (P3); the seven operations come from R29, and `APPROVAL.md` lists the parallel-units design under "Not approved, because not asked".
- Side that changes: feature 100 and feature 143
- Generated contract files that change: `contracts/data/closed-sets.json`, `contracts/annex-tables/X-cross-layer.json`
- depends on: none

### W-100-08 · `repair` · medium — Annex X §X.8: six rows stand twice, and two keys are still marked "(proposed)"

- Findings merged: B-8.2e-016 (part)
- Files and lines:
  - Feature 100: `specs/100-specstride/annexes/X-cross-layer.md:697`, `:698`, `:701`, `:704`, `:709`, `:705` (the earlier row of the pairs 697 and 714, 698 and 713, 701 and 716, 704 and 717, 709 and 715, 705 and 729); `:723`, `:728` (the mark "(proposed)")
- Change: Drop the six earlier rows and the two marks; `config-keys.tsv` of feature 110 holds both keys.
- Side that changes: feature 100
- Generated contract files that change: `contracts/annex-tables/X-cross-layer.json`
- Note: Line 701 is the row that maps "the other `SPECSTRIDE_YIELD_*`" to `loop.yield.*`; its later form at `:716` must keep that mapping, because W-110 (keys of feature 118) rests on it.
- depends on: none

### W-100-09 · `repair` · medium — Annex B §B.20: the schema id of the span state is missing; the owner of the inspection records after the split 119/145

- Findings merged: B-8.2c-009 (part), B-8.2c-011 (part)
- Files and lines:
  - Feature 100: `specs/100-specstride/annexes/B-state.md`, table of §B.20 (`:665` to `:680`): add `specstride.span-state/1`, logical name `run:<runId>:span-state` (`:230`), owner 128; `:678` (`specstride.inspect.<verb>/1`, owner 119): confirm 119 and not 145, no change of text
- Change: Add the row for the span state. State in the amendments table of `specs/100-specstride/spec.md` that 119 keeps the inspection records after the split.
- Side that changes: feature 100
- Generated contract files that change: `contracts/data/further-schema-ids.json`, `contracts/annex-tables/B-state.json`
- depends on: none

### W-100-10 · `repair` · low — Feature 100 does not say where the schema file of an extension point lives (EP-16, `specstride.toolchain/1`)

- Findings merged: B-8.2c-013
- Files and lines:
  - Feature 100: `specs/100-specstride/annexes/C-ports-and-edges.md`, §C.14
  - Feature 116: `specs/116-check-integrity-and-unit-evidence/contracts/schemas/toolchain-profile.schema.json:3` — no change; it is the file that feature 100 names
- Change: Name feature 116 as the place of the schema file of `specstride.toolchain/1` in §C.14.
- Side that changes: feature 100
- Generated contract files that change: `contracts/extension-points/EP-16.toolchain.json`
- depends on: W-100-02 (Owners that were not moved with the split 115 → 116 (EP-16, the fact block, two schema ids, closed sets 142 and 143, the package `@specstride/integrity`))

### W-100-11 · `repair` · low — Annex G §G.4: the row "unknown subcommand" does not say that it is about the first argument

- Findings merged: B-8.2b-012
- Files and lines:
  - Feature 100: `specs/100-specstride/annexes/G-cli.md`, §G.4, row "Any command, unknown subcommand"
  - Feature 104: `specs/104-spec-input/spec.md:115`, `:273` (F104-FR-020) — no change; exit 2 for an unknown sub-verb of `spec` is the baseline's code (ruling K6)
- Change: Write "Any command, unknown first argument (verb): 1".
- Side that changes: feature 100
- Generated contract files that change: `contracts/data/exit-codes.json`, `contracts/data/cli-protocol.json`, `contracts/annex-tables/G-cli.json`
- depends on: none

### W-100-12 · `repair` · low — F100-FR-143 names the proof "that the critic holds no tools"; F100-FR-218 names both forms

- Findings merged: B-8.4b-008
- Files and lines:
  - Feature 100: `specs/100-specstride/annexes/E-engine.md:190` (F100-FR-143) against `specs/100-specstride/annexes/X-cross-layer.md:847` (F100-FR-218)
- Change: In F100-FR-143 use the wording of F100-FR-218: "no tools or only read-only tools" (rulings 57, 57a).
- Side that changes: feature 100
- Generated contract files that change: `contracts/requirements.json`, `contracts/annex-tables/E-engine.json`
- depends on: none

### W-100-13 · `repair` · medium — `spec.md` names a sub-point "discovery: 146" of EP-02 that annex C, the contract and the briefs do not have

- Findings merged: B-8.2f-013
- Files and lines:
  - Feature 100: `specs/100-specstride/spec.md:353`; against `specs/100-specstride/annexes/C-ports-and-edges.md:93-94`
  - Feature 146: `specs/146-harness-discovery/spec.md:255` — no change: all 11 `ep:` lines say `consumes`
- Change: Delete "discovery: 146" from `spec.md:353`. The annex stands over the table of `spec.md`, and feature 146 itself claims no implementation.
- Side that changes: feature 100 (`spec.md`)
- Note: The other repair that B-8.2f offers: add "Discovery: 146" to annex C `:93-94` and to `docs/ecosystem/feature-briefs.md:6162`, and let 146 write `implements`. It changes three documents and a contract, so the deletion is the narrower one.
- depends on: none

### W-100-14 · `repair` · medium — "Iteration" as a counted unit, and four names for one limit

- Findings merged: B-8.2a-006
- Files and lines:
  - Feature 100: `specs/100-specstride/annexes/D-pass-loop.md:127` (F100-FR-119); `specs/100-specstride/annexes/E-engine.md:205` (F100-FR-146), `:289` (exit table); the glossary of `specs/100-specstride/spec.md` (one sentence on the literal `giveIterationBack`)
  - Feature 102: `specs/102-run-control/spec.md:300`; "iteration limit" (lines not given in the report)
  - Feature 103: `specs/103-proposer-pass/spec.md:592` — "pass limit", 8 uses: already the chosen name, no change
  - Feature 106: "pass cap" (lines not given in the report)
  - Feature 115: `specs/115-micro-loop-layer/spec.md:75`, `:334`; "iteration limit" (lines not given in the report)
  - Feature 118: `specs/118-pass-supervision-and-jobs/spec.md:285`
  - Feature 124: "limit of passes" (lines not given in the report)
  - Feature 127: `specs/127-quota-budgets-and-pause/spec.md:267`, `:383`
  - Feature 141: "iteration limit" (lines not given in the report)
  - Feature 142: `specs/142-parallel-units/spec.md:281`
- Change: Feature 100 decides one name: "pass limit" and "pass count" ("gives the pass back", "spends no pass"). Change F100-FR-119, F100-FR-146 and the exit table, then the places of the features.
- Side that changes: feature 100 first, then the features. Authority: glossary row 7 of `consolidation.md`
- Generated contract files that change: `contracts/requirements.json`, `contracts/data/exit-codes.json`, `contracts/annex-tables/D-pass-loop.json`, `E-engine.json`
- depends on: none

### W-100-15 · `repair` · low — One warning under two names: "critic-diversity warning" and "same-model warning"

- Findings merged: B-8.2a-013
- Files and lines:
  - Feature 100: "critic-diversity warning": `specs/100-specstride/annexes/A-foundations.md:146`; "same-model warning": `specs/100-specstride/annexes/E-engine.md:48`, `specs/100-specstride/annexes/X-cross-layer.md:556`
  - Feature 123: `specs/123-pipeline-runtime-and-supervisor/spec.md:522`
  - Feature 124: `specs/124-harness-discovery-and-roles/spec.md:279`
- Change: Keep "critic-diversity warning" as the name and say in feature 100 that it is raised for the results `same-model` and `unverified` of the diversity test (F124-FR-047). Replace "same-model warning" in the specs: 17 uses in 8 specs, which the report counts and does not list; find them with `grep -rn 'same-model warning' specs/1*`.
- Side that changes: feature 100 first, then the features
- Generated contract files that change: `contracts/annex-tables/E-engine.json`, `X-cross-layer.json`
- Note: Ruling 49 says "the same-model warning of decision 7". The repair changes the name in the specs, not the ruling; the sentence added to feature 100 names the ruling's word as the narrower name.
- depends on: none

### W-100-16 · `repair` · low — The form of `$id` of a schema file is stated nowhere; the features use four other forms

- Findings merged: B-8.2c-012
- Files and lines:
  - Feature 100: `specs/100-specstride/contracts/README.md` (state the form once: `urn:specstride:schema:<schema id>`)
  - Feature 103: `specs/103-proposer-pass/contracts/pass-loop-*.schema.json:3`
  - Feature 108: `specs/108-reverse/contracts/*.schema.json`
  - Feature 109: `specs/109-harness-seam/contracts/overlay-marker.schema.json:3`
  - Feature 115: `specs/115-micro-loop-layer/contracts/schemas/checkpoint.schema.json:3`
  - Feature 116: `specs/116-check-integrity-and-unit-evidence/contracts/schemas/*.schema.json:3`
  - Feature 122: `specs/122-detached-runtime/contracts/state-archive.schema.json`
  - Feature 127: `specs/127-quota-budgets-and-pause/contracts/spend-ledger.schema.json`
  - Feature 128: schema files under `specs/128-telemetry-export/contracts/` (the report names the feature, not the file)
  - Feature 130: schema files under `specs/130-adapter-dsh/contracts/` (the report names the feature, not the file)
  - Feature 140: `specs/140-reverse-inventory-and-lint/contracts/inventory.schema.json`
  - Feature 141: schema files under `specs/141-parity-oracle/contracts/` (the report names the feature, not the file)
- Change: State the form in the README of the contracts of feature 100; each feature then writes `$id` in that form. The forms in use today: the bare schema id, `urn:specstride:plan:109:...`, `specstride.internal/...`, and no `$id` with the id in `title`.
- Side that changes: feature 100 states the rule; the features follow
- depends on: none

### W-100-17 · `repair` · medium — The control of threat T-43 is in no spec and no annex; feature 100 names none of its own threats

- Findings merged: B-8.2d-012 (part)
- Files and lines:
  - Feature 100: `specs/100-specstride/annexes/X-cross-layer.md:805` (F100-FR-216), `:833`-`:835` (rows T-43 to T-45 of §X.9); `specs/100-specstride/spec.md` (a table "Threats" with T-43 and T-44 and the requirement that is the control)
- Change: Add one requirement for the control of T-43 (publishing from a protected branch, with attestation) and name T-43 and T-44 with their controls in `spec.md`. Feature 113, the second owner, cites it (see the item on the threat tables in section 3).
- Side that changes: feature 100. B-8.2d leaves open whether the requirement goes to 100 or to 113; feature 100 is chosen because every feature may cite it
- Generated contract files that change: `contracts/requirements.json`, `contracts/annex-tables/X-cross-layer.json`
- depends on: none

### W-100-18 · `repair` · medium — Three sets of event causes are in no row of §X.6, and `run.ended.cause` has two sets (rows 5 and 96)

- Findings merged: B-8.2d-013 (part)
- Files and lines:
  - Feature 100: `specs/100-specstride/annexes/X-cross-layer.md:36` (envelope field `cause`), row 5 (`normal`, `crash`, `owner-lost`, owner 101), row 96 (`crash`, `host_exit`, `operator_stop`, owner 111) of §X.6; three new rows, owner 111
- Change: Add the three closed sets that feature 111 lists (cause of `pass.ended`, cause of `attempt.ended`, outcome of `phase.ended`) and state how row 96 relates to row 5.
- Side that changes: feature 100, after feature 111 has listed the members
- Generated contract files that change: `contracts/data/closed-sets.json`, `contracts/annex-tables/X-cross-layer.json`
- Note: The only contract step of feature 100 that waits for another feature. If the members are not ready when the generator runs, run it a second time for this item alone.
- depends on: W-111-05 (The causes of `pass.ended` and `attempt.ended` and the outcome of `phase.ended` are no closed sets; the `data` field `cause` has the name of an envelope field)

### W-100-19 · `repair` · critical — The weaker proof of a tool-less critic departs from the text of Principle IX and is recorded in no Complexity Tracking

- Findings merged: B-8.3a-001, B-8.3c-009
- Files and lines:
  - Feature 100: `specs/100-specstride/plan.md:65` (row IX), `:220-222` (Complexity Tracking); the text that is recorded: `specs/100-specstride/annexes/C-ports-and-edges.md:205`, `:218` (F100-FR-230)
  - Feature 109: `specs/109-harness-seam/plan.md:73` (row IX), `:204-208` (Complexity Tracking); `specs/109-harness-seam/spec.md:393` (F109-FR-038)
  - Feature 130: `specs/130-adapter-dsh/plan.md:71-72`, `:91-93`, `:194-197` — remove the row of Principle VIII from Complexity Tracking and say in row VIII that the bounded-argument rule of the principle applies (F130-FR-011); mark row IX as a recorded deviation
- Change: Change row IX of plans 100 and 109 from "passed" to a stated deviation and add a Complexity Tracking row: "Proof by pinned configuration for a tested harness adapter whose stream has no initial record; needed because a text stream emits none (brief 130); alternative rejected: refuse such a harness as critic". In plan 130 mark row IX in the same way.
- Side that changes: the plans. Authority: the Governance section of the constitution v3.0.0 (a deviation from a NON-NEGOTIABLE principle is recorded)
- Note: The record is due whatever the owner answers to the question of the next item; if the owner rules for the weaker proof, a PATCH of Principle IX names it and the rows are removed.
- depends on: none

### W-100-20 · `queue` · critical — Is the weaker proof of a tool-less critic allowed under Principle IX? (proposed question Q-01)

- Findings merged: B-8.3a-001 (part), B-8.3c-009 (part)
- Files and lines:
  - Feature 100: `specs/100-specstride/annexes/C-ports-and-edges.md:205` (§C.3), `:218` (F100-FR-230); row 128 of annex X §X.6 (`pinned-configuration`, marked "Owner decision")
  - Feature 109: `specs/109-harness-seam/spec.md:393` (F109-FR-038)
  - Feature 130: `specs/130-adapter-dsh/plan.md:194-197`
- Question: Principle IX says that the adapter verifies from the harness's own initial record that the tool list is empty and the session is the one it minted, and that any other result halts the run. May a tested harness adapter whose stream has no initial record prove the tool-less form by its exact version pin and its preflight ("the weaker proof")?
- Sources: Constitution v3.0.0, Principle IX and Governance; `APPROVAL.md` (no ruling names the weaker proof; rulings 57, 57a and D1 cover the read-only-tools form only); `docs/ecosystem/feature-briefs.md:2997` ("is new in this brief"); F100-FR-230; register rows DV-081 and DV-110; CQ-110
- Recommended answer (B-8.3a): Yes, for a tested harness adapter only, recorded for every call as the weaker proof; Principle IX gets a PATCH that names it
- If answered otherwise: A harness whose stream has no initial record is refused as critic: dsh cannot be a critic outside the `parity` profile, and the third way of F100-FR-230 and the second sentence of F109-FR-038 are removed
- Note: Related open question: CQ-110, raised by feature 134. Its question is the session identity of the pi critic, and its recommended answer uses the weaker proof; it does not ask whether the proof is allowed (section 5, point 1). The orchestrator may widen CQ-110 in place of a new number.
- depends on: W-100-19 (The weaker proof of a tool-less critic departs from the text of Principle IX and is recorded in no Complexity Tracking)

### W-100-21 · `repair` · medium — The build of the product runs a Python generator; the plan says the Language Ledger stays empty and nothing orders the port before a release

- Findings merged: B-8.3a-005 (part)
- Files and lines:
  - Feature 100: `specs/100-specstride/plan.md:20-23`, `:41`, `:62` (row VI), `:86-88`; `specs/100-specstride/research.md:58-62` (D-5); `specs/100-specstride/tasks.md:52` (T006), `:595` (T207); `specs/100-specstride/quickstart.md:12`
  - Feature 109: `specs/109-harness-seam/tasks.md:379` (T102, test CT-109-107) — the test reads the result of the traceability check and does not start `python3`
- Change: Plan 100, row VI: state the fact ("the build runs a Python generator of the specification until T207"); Complexity Tracking: one row with the justification of D-5 and the end condition. Tasks of 100: T207 loses `[P]` and moves before T204 (release acceptance); T006 names the TypeScript tool once T207 is done. Tasks of 109: T102 as written in the place.
- Side that changes: plans and tasks of 100 and 109. Authority: Principle VI and ruling 18
- depends on: none

### W-100-22 · `repair` · medium — Row XII says no test of feature 100 calls a model; CT-100-324 is a live run

- Findings merged: B-8.3a-009
- Files and lines:
  - Feature 100: `specs/100-specstride/plan.md:68` (row XII), `:33`; `specs/100-specstride/tasks.md:589` (T205); `specs/100-specstride/annexes/X-cross-layer.md:866-868` (F100-FR-224, no change)
- Change: Row XII: "no hermetic test and no job of the build calls a model; CT-100-324 is of the live tier, run at release on request under the owner's login, logged, and never in the build". T205: name the tier and the log.
- Side that changes: plan and tasks of feature 100. Authority: Principles XII and XVII
- depends on: none

### W-100-23 · `queue` · medium — Does "user config" in rulings 34 and P2 mean the user configuration only? (proposed question Q-04)

- Findings merged: B-8.4a-001 (part)
- Files and lines:
  - Feature 100: `specs/100-specstride/annexes/C-ports-and-edges.md:877` (F100-FR-111: user configuration); `:883` (F100-FR-112: "user configuration, the environment or a flag")
  - Feature 110: `specs/110-config-and-terms/spec.md:519` (F110-FR-019), `:188` (layers `F E U` of `sandbox.level`)
  - Feature 130: `specs/130-adapter-dsh/spec.md:305` (F130-FR-018)
  - Feature 134: `specs/134-adapter-pi/spec.md:221` (F134-FR-009)
  - Feature 138: `specs/138-adapter-prime/spec.md:293` (F138-FR-015)
  - Feature 142: `specs/142-parallel-units/spec.md:206` (F142-FR-003)
- Question: Ruling 34 says no containment "only by opt-in in user config", and ruling P2 says `loop.parallel.allow_detect` is set "in user config". Does "user config" stand for the user configuration only, or for every consumer-controlled source of ruling 35 (user configuration, environment, flag)?
- Sources: `APPROVAL.md` rulings 34, 35 and P2; F100-FR-111; F100-FR-112; F110-FR-019; CQ-149 (asks only what C0 means under `parity`)
- Recommended answer (B-8.4a for ruling 34 ("until it is answered read (a)"); compiler of this worklist for ruling P2): The user configuration only, as both rulings are worded
- If answered otherwise: Every consumer-controlled source counts: the repair of ruling 34 in features 109, 110, 131 and 134 is undone and F100-FR-111 gains "the environment or a flag"; F100-FR-112 stays as it is
- Change on the recommended answer: Ruling 34 is repaired now in features 109, 110, 131 and 134 (item of feature 110). For ruling P2, remove "the environment or a flag" from F100-FR-112 and from the places of 110, 130, 134, 138 and 142 only when the orchestrator has queued the question with this answer.
- Note: B-8.4a and B-8.4c read ruling P2 differently (section 5, point 2).
- depends on: none

### W-100-24 · `queue` · medium — `resume` on a workspace without state: exit 1 or exit 3? (proposed question Q-05)

- Findings merged: B-8.2b-006
- Files and lines:
  - Feature 100: `specs/100-specstride/annexes/G-cli.md:176` (§G.4, row `resume`)
  - Feature 102: `specs/102-run-control/spec.md:213` (F102-FR-012)
  - Feature 119: `specs/119-front-door-and-presenter/spec.md:154` (F119-FR-009)
- Question: F119-FR-009 lets `resume` exit 1 when the workspace has no state; F102-FR-012 lets it exit 3 when no run snapshot exists, and makes that check the first. For a workspace without state both apply. Which check comes first?
- Sources: Ruling K2 (3 when there is nothing to resume; the oracle maps the old code 1); ruling K6 (each process keeps today's codes); register row DV-021 (cites B-1494 to B-1496 only); baseline items B-1482 and B-1494; annex G §G.4
- Recommended answer (B-8.2b): As at the baseline (B-1482 before B-1494): the state check of F119-FR-009 comes first and exits 1; then F102-FR-012 exits 3
- If answered otherwise: `resume` leaves the list of F119-FR-009 and exits 3 for a workspace without state; the oracle maps 1 to 3 for that fixture as well, and DV-021 names B-1482
- Change on the recommended answer: Annex G §G.4, row `resume`: add "1 without state". F102-FR-012: add "after the state check of F119-FR-009, which exits 1".
- Generated contract files that change: `contracts/data/exit-codes.json`, `contracts/annex-tables/G-cli.json`
- depends on: none

### W-100-25 · `queue` · medium — May a core package import `node:fs`? (proposed question Q-06)

- Findings merged: B-8.3b-007
- Files and lines:
  - Feature 100: `specs/100-specstride/annexes/A-foundations.md:71` (F100-FR-012), `:74` (F100-FR-234)
  - Feature 111: `specs/111-event-schema-and-projection/plan.md:24`
  - Feature 115: `specs/115-micro-loop-layer/plan.md:164-166`
  - Feature 117: `specs/117-critic-grounding-and-prompt/plan.md:154-157` — under the recommended answer the hiding (`packages/core/src/critic-input/hide/`) moves behind a port
  - Feature 118: `specs/118-pass-supervision-and-jobs/plan.md:27`
- Question: F100-FR-012 forbids a core package to start a process or open a connection and does not name the file system; the package graph forbids write calls of `node:fs` to `@specstride/layer-parallel` only. Four plans read the rule in three ways. May a core package import `node:fs`?
- Sources: F100-FR-012; F100-FR-234 (the kernel offers "the atomic write" among "what the core may not import", and an edge package "MAY touch the file system ... on behalf of a core package"); `specs/100-specstride/contracts/data/package-graph.json`; `architecture.md` LR-1
- Recommended answer (compiler of this worklist; B-8.3b asks the orchestrator to decide and recommends no answer): No: a core package reads and writes files through the kernel and through the ports of the edge packages; annex A says so in F100-FR-012
- If answered otherwise: A core package may import `node:fs`: the plans of 115 (`plan.md:164-166`) and 111 (`plan.md:24`) are corrected, the edge package `@specstride/layer-micro-io` has no reason, and 117 stays as planned
- Change on the recommended answer: One sentence in F100-FR-012; plan 117 moves the hiding behind a port; plan 118 names `node:fs` among the modules it does not import.
- Generated contract files that change: `contracts/requirements.json`, `contracts/data/package-graph.json` (the list of forbidden modules of the core packages)
- depends on: none

### W-100-26 · `queue` · medium — Are tools of the build that are never shipped outside the Language Ledger? (proposed question Q-07)

- Findings merged: B-8.3a-005 (part), B-8.3d-008
- Files and lines:
  - Feature 100: `specs/100-specstride/plan.md:62` (row VI); `specs/100-specstride/research.md:58-62` (D-5)
  - Feature 141: `specs/141-parity-oracle/plan.md:36`, `:71` (state the answer here), `:95-98`, `:160`, `:181`; `specs/141-parity-oracle/tasks.md:48` (T003), `:288` (T082), `:296` (T086)
- Question: Principle VI and ruling 18 keep the Language Ledger empty. The build runs `contracts/tools/generate.py --check` (features 100 and 141), a `sitecustomize` file for line tracing (141) and `docs/ecosystem/check-traceability.py` (109, 110, 117, 118, 141). None is shipped. Is a tool of the build a component in the sense of the Language Ledger?
- Sources: Constitution v3.0.0, Principle VI and Additional Constraints; ruling 18; `specs/100-specstride/research.md` D-5 (the plan's own reading); B-8.3b, section "Not checked"
- Recommended answer (B-8.3d): No, where the file is outside every published package and the build states Python 3 as a requirement of development; otherwise the three pieces are ported to TypeScript
- If answered otherwise: The tools are components: T207 of feature 100 (the port of the generator) becomes a precondition of the first build, and T003, T082 and T086 of feature 141 are written in TypeScript
- Change on the recommended answer: State the answer in row VI of plan 100 and in `specs/141-parity-oracle/plan.md:71`.
- depends on: W-100-21 (The build of the product runs a Python generator; the plan says the Language Ledger stays empty and nothing orders the port before a release)

### Items owned elsewhere that change files of feature 100

- **W-X-02** · `repair` · high — Conformance suites and samples of extension points are placed outside the published test kit, or twice
  - Places in this feature: `specs/100-specstride/plan.md:214` — state that feature 100 builds the contract-level suite and a minimal sample, and that the content owner adds behaviour cases in the same folder; the place is given at `specs/100-specstride/plan.md:142-144`; tasks T098, T101, T105, T108 (`specs/100-specstride/tasks.md:302`, `:310`, `:320`, `:328`) stay
  - Rule: Suite in `packages/testkit/src/conformance/EP-nn/`, sample in `packages/testkit/src/samples/EP-nn/`.
- **W-110-09** · `repair` · medium — Three options in user configuration have no key
  - Places in this feature: annex X §X.7 — a row for the two opt-ins of the adapters, or the statement that row 29 (`memory.native.proposer`) covers them
  - Rule: Name the key and report it to feature 110.
- **W-115-02** · `queue` · medium — Does ruling 49 allow an escalation rung that is the critic's model at a higher effort?
  - Places in this feature: `specs/100-specstride/annexes/D-pass-loop.md:282` (F100-FR-130)
  - Rule: proceed on the recommended answer: `targetIsCriticModel` means equal in model and in effort; a rung that shares the model raises the warning
- **W-119-01** · `repair` · medium — No plan names the bundler, and no task builds the bundle or tests a plain install of the published package
  - Places in this feature: `specs/100-specstride/plan.md:218` — no change
  - Rule: Cite the bundling task of feature 119.
  - depends on: W-X-09
- **W-127-01** · `queue` · medium — Is a tripped wall-clock budget relaunched, or does it rest blocked on a human?
  - Places in this feature: `specs/100-specstride/annexes/E-engine.md:226`, `:150` — no change under the recommended answer
  - Rule: proceed on the recommended answer: a tripped wall-clock budget is `retryable: true` and carries no blocked reason
- **W-X-05** · `repair` · medium — Stale counts in the specs: features, register rows, requirements, profile rows, keys
  - Places in this feature: `specs/100-specstride/spec.md:172` ("The 31 specifications are written in parallel": 39); `:311` (F100-SC-003, "all 32 features": "all Wave 1 features (41 after the splits)", or no number); `:461` ("the other 31 features": 40); `:423`, `:435` (91 rows, DV-001 to DV-091); `specs/100-specstride/plan.md:81` (DV-001 to DV-094); `specs/100-specstride/plan.md:9-10`, `:97` (226 requirements: 235, as `:43` says); `specs/100-specstride/spec.md:716` ("The key list of 110 gives the default `off`" for `roles.refuseUnknown`: "settled: the list of 110 gives `on`", `specs/110-config-and-terms/contracts/config-keys.tsv:197`)
  - Rule: Write the count that holds today, or name the register without a count.
  - depends on: W-ORC-03, W-ORC-01, W-ORC-02
- **W-X-06** · `repair` · medium — "Run" and "engine invocation" written for one engine start
  - Places in this feature: `specs/100-specstride/annexes/F-runtime-root.md:46` (§F.1); `specs/100-specstride/annexes/B-state.md:334` — "one engine invocation" becomes "engine start"
  - Rule: Write "engine start" where one start of the engine is meant (ruling 24).
- **W-X-27** · `repair` · medium — One schema validator and one YAML parser: plans leave the choice open or name the validator as their own dependency
  - Places in this feature: `specs/100-specstride/research.md` — one decision that names the YAML parser, as D-2 does for the validator (`specs/100-specstride/plan.md:29`)
  - Rule: Refer to the validator that feature 100 chose and to the YAML parser that feature 110 names.
- **W-110-11** · `queue` · low — The rule of unit suffixes is applied unevenly (`Minutes`, `Days`, `Percent`)
  - Places in this feature: `specs/100-specstride/annexes/X-cross-layer.md:453` (the sentence on suffixes: four, without `Percent`), `:529` (row 65)
  - Rule: proceed on the recommended answer: rename the three keys to `proposalMin`, `unitMin`, `checkMin`
- **W-110-12** · `repair` · low — One rule under two names: "tier bump" and "model-tier bump"
  - Places in this feature: bare "tier bump" (the report names the feature, not the line)
  - Rule: Write "model-tier bump".
- **W-X-28** · `repair` · low — Parity and characterization tests are placed in different directories
  - Places in this feature: `specs/100-specstride/plan.md` — state one rule for the place: `tests/parity/<feature>/` and `tests/characterization/<feature>/`
  - Rule: Use the two directories of feature 100 in plan and task paths.
- **W-X-36** · `accept` · low — Literals of a contract or of the baseline that keep a retired word
  - Places in this feature: the directive `giveIterationBack`; the literals `MAX_ITER` and `iter_*` of the compatibility projection; the key `harnesses.<id>.tiers`
  - Rule: No change to the literal.

## 2. Features 101 to 149

### Feature 101 — 101-gate-and-verdict

#### W-101-01 · `repair` · medium — `retryable` is null for exit 0; feature 100 requires false

- Findings merged: B-8.2b-009
- Files and lines:
  - Feature 101: `specs/101-gate-and-verdict/contracts/gate-halts.json:4` (`"retryable": null`); `specs/101-gate-and-verdict/spec.md:437` ("—")
- Change: Write `"retryable": false` in the contract and `false` in the table.
- Side that changes: feature 101. Authority: F100-FR-148 (`specs/100-specstride/annexes/E-engine.md:245`): on an exit without a member the stop reason is null and `retryable` MUST be false
- depends on: none

#### W-101-02 · `repair` · medium — F101-FR-020: the diagnostician holds "no tools" and is "the critic of the role plan", which may be of the form `read-only-tools`

- Findings merged: B-8.4b-003
- Files and lines:
  - Feature 101: `specs/101-gate-and-verdict/spec.md:295` (F101-FR-020)
- Change: Replace "no tools" by "in the form of the `completion` level of its entry of the role plan (annex C §C.3), with the proof recorded", and add that the hiding of the proposer's files (F117-FR-040) applies to a diagnostician of the second form. F149-FR-001 (`specs/149-attempt-planner-and-seams/spec.md:162`) has the wording of the ruling.
- Side that changes: feature 101. Authority: rulings 57, 57a, D1; F100-FR-087 (`specs/100-specstride/annexes/C-ports-and-edges.md:208`)
- depends on: none

#### W-101-03 · `repair` · medium — The plan promises property and fuzz tests of the verdict parser; no task holds one

- Findings merged: B-8.3a-012
- Files and lines:
  - Feature 101: `specs/101-gate-and-verdict/plan.md:42`; `specs/101-gate-and-verdict/tasks.md:56`, `:65`, `:140` (characterization and parity tests of the parser, and T035, a property test of the event log)
- Change: Add a test task that feeds generated replies (wrong nonce, duplicated lines, partial lines, other case, other line ends) to the parser and asserts that only one whole line with the exact nonce gives a verdict; `proves:` F101-FR-007 and F101-FR-008.
- Side that changes: feature 101 (task list). Authority: Principle II
- Note: B-8.3a proposes the directory `tests/own/101/`; B-8.3d-012 reports `tests/own/149/` as a directory that differs from feature 100's. Use the directory that the rule of feature 100 gives (item on test directories in section 3).
- depends on: W-X-28 (Parity and characterization tests are placed in different directories)

#### Items owned elsewhere that change files of feature 101

- **W-X-09** · `repair` · medium — Principle XVII: no task records the macOS result or a skip with its reason; the row is marked N/A or gives a reason that is not about tests
  - Places in this feature: `specs/101-gate-and-verdict/plan.md:82`; `specs/101-gate-and-verdict/tasks.md` (add the task in the last phase)
  - Rule: Add the macOS and skip task to `tasks.md`; answer row XVII as a pass with its reason.
- **W-X-14** · `repair` · medium — The Constitution Check is not in the form of the plan template, or a row gives a reason that does not bear on its principle
  - Places in this feature: `specs/101-gate-and-verdict/plan.md` — name the version of the constitution (v3.0.0)
  - Rule: Bring the Constitution Check to the form of the plan template, as written in the place.
- **W-X-17** · `repair` · medium — Features that touch the critic do not state the critic-diversity rule, its warning, or the identity the test needs
  - Places in this feature: `specs/101-gate-and-verdict/spec.md:295` (F101-FR-020) — add the last sentence of F130-FR-030 (the warning) for the diagnostician
  - Rule: State the rule and the warning of F100-FR-024 in the form of F130-FR-030.
  - depends on: W-100-15
- **W-X-18** · `repair` · medium — The section "Extension points" says `consumes`, and no requirement has an `ep:` line for the point
  - Places in this feature: `specs/101-gate-and-verdict/spec.md:562-563` (EP-18; feature 100 says "Feature 101 consumes both seams")
  - Rule: Add the line `- ep: EP-nn <id> (consumes)` to the requirement that the row names, or delete the row where no requirement uses the point.
- **W-X-21** · `repair` · medium — `proves:` holds a test name, a phrase or nothing in place of an origin or a requirement id
  - Places in this feature: `specs/101-gate-and-verdict/tasks.md:324` ("the success criterion below": write the id of the criterion)
  - Rule: Write in each the requirement id whose `test:` line names the test.
- **W-X-22** · `repair` · medium — Owners do not name their threats of annex X §X.9 with the control (F100-FR-216)
  - Places in this feature: T-22
  - Rule: Add a table "Threats" to `spec.md`: threat id and the requirement that is its control.
  - depends on: W-100-17
- **W-X-23** · `repair` · medium — Text from outside the runtime is written to a sink, and the one redaction point is named nowhere
  - Places in this feature: `specs/101-gate-and-verdict/spec.md:417` — the lines of a critic-class call in the engine log
  - Rule: Add the requirement that the text enters through the one ingress before it is written.
- **W-X-30** · `repair` · low — Absolute paths of the owner's machine in task text and research
  - Places in this feature: `specs/101-gate-and-verdict/tasks.md:52`
  - Rule: Write "the Specstride baseline at `9cab15d`" and "the Lisa baseline at `363e6a3`" without a path.

### Feature 102 — 102-run-control

No item of its own.

#### Items owned elsewhere that change files of feature 102

- **W-111-02** · `repair` · high — Requirements demand events for which the catalogue has no type; the writer drops an event without one
  - Places in this feature: `specs/102-run-control/spec.md:262` — an accepted change of a source: name the type
  - Rule: Name in the requirement the catalogue type that carries the event.
- **W-123-02** · `repair` · high — Feature 123 prints `[SPECSTRIDE-LAUNCH]`, `[SPECSTRIDE-STOP]`, `[SPECSTRIDE-DIGEST]` and `[SPECSTRIDE-STATE]` with other keys than their owners
  - Places in this feature: `specs/102-run-control/spec.md:198` — no change; `[SPECSTRIDE-STOP]` with the keys of annex G
  - Rule: Rename the lines of `supervise` (B-8.2b gives as examples `[SPECSTRIDE-SUPERVISE-LAUNCH]`, `[SPECSTRIDE-SUPERVISE-STOP]`, `[SPECSTRIDE-SUPERVISE-DIGEST]`; the observation line of `:278` gets a `supervise` label as well), and specify `[SPECSTRIDE-DIGEST]` with the keys of annex G (`run`, `comment`, `changed`, `delegated`, `critic`, `fallback`, `alerts`), which names 123 as its printer.
- **W-X-03** · `repair` · high — Rows of the `parity` profile are cited by a wrong number
  - Places in this feature: `specs/102-run-control/spec.md:192`, `:339`, `:437`, `:438`, `:440` — rows 44 and 45 become 62 (`--new-run`) and 63 (`stop --jobs`), with "row granted"
  - Rule: Write the row number of annex X §X.7 for the key.
- **W-100-14** · `repair` · medium — "Iteration" as a counted unit, and four names for one limit
  - Places in this feature: `specs/102-run-control/spec.md:300`; "iteration limit" (lines not given in the report)
  - Rule: Write "pass limit" and "pass count"; "iteration" survives only in the literals `MAX_ITER`, `iter_*` and `giveIterationBack`.
- **W-100-24** · `queue` · medium — `resume` on a workspace without state: exit 1 or exit 3?
  - Places in this feature: `specs/102-run-control/spec.md:213` (F102-FR-012)
  - Rule: proceed on the recommended answer: the state check of F119-FR-009 comes first and exits 1; F102-FR-012 says so
- **W-X-06** · `repair` · medium — "Run" and "engine invocation" written for one engine start
  - Places in this feature: `specs/102-run-control/spec.md:57`, `:130`, `:156` (F102-FR-002) — "the next engine start"
  - Rule: Write "engine start" where one start of the engine is meant (ruling 24).
- **W-X-09** · `repair` · medium — Principle XVII: no task records the macOS result or a skip with its reason; the row is marked N/A or gives a reason that is not about tests
  - Places in this feature: `specs/102-run-control/plan.md:72` (row XVII: ✅ with the reason of plan 101, not N/A); `specs/102-run-control/tasks.md`
  - Rule: Add the macOS and skip task to `tasks.md`; answer row XVII as a pass with its reason.
- **W-X-18** · `repair` · medium — The section "Extension points" says `consumes`, and no requirement has an `ep:` line for the point
  - Places in this feature: `specs/102-run-control/spec.md:402` (EP-04)
  - Rule: Add the line `- ep: EP-nn <id> (consumes)` to the requirement that the row names, or delete the row where no requirement uses the point.
- **W-X-22** · `repair` · medium — Owners do not name their threats of annex X §X.9 with the control (F100-FR-216)
  - Places in this feature: T-02
  - Rule: Add a table "Threats" to `spec.md`: threat id and the requirement that is its control.
  - depends on: W-100-17
- **W-X-24** · `repair` · medium — Catalogue types that no feature says it emits
  - Places in this feature: `unblocked` (read by 129)
  - Rule: Name the event type in the requirement that emits it.
- **W-X-33** · `repair` · low — A requirement line names another tier 2 feature in prose and no contract of feature 100
  - Places in this feature: `specs/102-run-control/spec.md:290` (names 110), `:346` (names 111)
  - Rule: In each line name the contract of feature 100 through which the behaviour is consumed (for example annex X §X.2 for the event catalogue, annex X §X.10 for the redaction patterns, annex G §G.7 for the doctor registry).

### Feature 103 — 103-proposer-pass

#### W-103-01 · `repair` · medium — F103-FR-018 marks every firing of the no-progress breaker on the structured path as `declared-block`

- Findings merged: B-8.2b-008
- Files and lines:
  - Feature 103: `specs/103-proposer-pass/spec.md:244` (F103-FR-018); `specs/103-proposer-pass/contracts/result-map.json:14` (the entry with `declared-block`; B-8.2b cites line 112, but the file has 17 lines)
- Change: Mark the result 8 as `declared-block` only when a declaration of the proposer or a question of the harness was seen in the counted passes; else the stop is `proposer_no_progress`, `retryable: false`, state `failed`.
- Side that changes: feature 103. Authority: annex E (`specs/100-specstride/annexes/E-engine.md:147`): `declared-block` holds when the proposer declared that it needs a human, or a harness asked a question, and the breaker fired
- depends on: none

#### Items owned elsewhere that change files of feature 103

- **W-X-02** · `repair` · high — Conformance suites and samples of extension points are placed outside the published test kit, or twice
  - Places in this feature: `specs/103-proposer-pass/plan.md:149` (`tests/conformance/`) and the matching task paths
  - Rule: Suite in `packages/testkit/src/conformance/EP-nn/`, sample in `packages/testkit/src/samples/EP-nn/`.
- **W-X-03** · `repair` · high — Rows of the `parity` profile are cited by a wrong number
  - Places in this feature: `specs/103-proposer-pass/spec.md:249` (parity line of F103-FR-018), `:509`, `:575`; `specs/103-proposer-pass/tasks.md:35` (T004); `specs/103-proposer-pass/research.md:58` — row 44 becomes 59 (`loop.noProgressStructured`), row 45 becomes 60 (parameters of carry-over); "is needed" is dropped, and task T004 is closed for this switch. The table of `specs/103-proposer-pass/spec.md:486`-`:487` is right
  - Rule: Write the row number of annex X §X.7 for the key.
- **W-100-14** · `repair` · medium — "Iteration" as a counted unit, and four names for one limit
  - Places in this feature: `specs/103-proposer-pass/spec.md:592` — "pass limit", 8 uses: already the chosen name, no change
  - Rule: Write "pass limit" and "pass count"; "iteration" survives only in the literals `MAX_ITER`, `iter_*` and `giveIterationBack`.
- **W-X-05** · `repair` · medium — Stale counts in the specs: features, register rows, requirements, profile rows, keys
  - Places in this feature: `specs/103-proposer-pass/spec.md:593` (94 rows)
  - Rule: Write the count that holds today, or name the register without a count.
  - depends on: W-ORC-03, W-ORC-01, W-ORC-02
- **W-X-07** · `repair` · medium — Plans hold statements that the repository has overtaken (owners and layers of the graph, register rows "to be added", names "to be added" to annex B)
  - Places in this feature: `specs/103-proposer-pass/plan.md:37`, `:145` — owners of `@specstride/core`: 101, 102, 103, 117, 118 and 149
  - Rule: State the present state of the package graph, the register and annex B.
- **W-X-09** · `repair` · medium — Principle XVII: no task records the macOS result or a skip with its reason; the row is marked N/A or gives a reason that is not about tests
  - Places in this feature: `specs/103-proposer-pass/plan.md:75` (row XVII: ✅, not N/A); `specs/103-proposer-pass/tasks.md` (T082 is a measurement only)
  - Rule: Add the macOS and skip task to `tasks.md`; answer row XVII as a pass with its reason.
- **W-X-20** · `repair` · medium — 218 test names of `test:` lines appear in no task; three tests have no task at all
  - Places in this feature: `specs/103-proposer-pass/spec.md:347` (`CT-103-134`: no task at all)
  - Rule: Make the test names of `spec.md` and `tasks.md` equal; add a task for a test that has none.
- **W-X-22** · `repair` · medium — Owners do not name their threats of annex X §X.9 with the control (F100-FR-216)
  - Places in this feature: T-08, T-31
  - Rule: Add a table "Threats" to `spec.md`: threat id and the requirement that is its control.
  - depends on: W-100-17
- **W-X-24** · `repair` · medium — Catalogue types that no feature says it emits
  - Places in this feature: `progress.swept`, `task.planned`, `task.ticked`
  - Rule: Name the event type in the requirement that emits it.
- **W-100-16** · `repair` · low — The form of `$id` of a schema file is stated nowhere; the features use four other forms
  - Places in this feature: `specs/103-proposer-pass/contracts/pass-loop-*.schema.json:3`
  - Rule: Write `$id` as `urn:specstride:schema:<schema id>`.

### Feature 104 — 104-spec-input

#### W-104-01 · `repair` · high — The canonical hasher is built in `@specstride/spec-formats`; the graph and four plans take it from `@specstride/kernel`

- Findings merged: B-8.3a-002
- Files and lines:
  - Feature 104: `specs/104-spec-input/plan.md:118` (`packages/spec-formats/src/hash.ts`); `specs/104-spec-input/tasks.md:29` (T007)
  - Feature 105: `specs/105-verification/plan.md:38` — "the canonical hasher of feature 104 in `@specstride/kernel`" in place of "through its interface in `contracts`"
  - Feature 106: `specs/106-learning/plan.md:39` — the same sentence in place of "the canonical hasher of feature 100"
- Change: Plan 104: add `@specstride/kernel` to Primary Dependencies and move `hash.ts` to `packages/kernel/src/hasher/` (owner 104); T007: the same path. Plans 102 (`specs/102-run-control/plan.md:26`), 103 (`specs/103-proposer-pass/plan.md:29`), 107 (`specs/107-launch-contract/plan.md:15`) and 108 (`specs/108-reverse/plan.md:26`) already import it from the kernel.
- Side that changes: feature 104, and one sentence in 105 and 106. Authority: the package graph (`@specstride/kernel`, owner "104 (hasher)"); `@specstride/core` may import `contracts` and `kernel` only
- depends on: none

#### Items owned elsewhere that change files of feature 104

- **W-X-02** · `repair` · high — Conformance suites and samples of extension points are placed outside the published test kit, or twice
  - Places in this feature: `specs/104-spec-input/tasks.md:135-137` (T040, T041: `packages/spec-formats/test/conformance/`) and the plan
  - Rule: Suite in `packages/testkit/src/conformance/EP-nn/`, sample in `packages/testkit/src/samples/EP-nn/`.
- **W-115-01** · `repair` · medium — One piece of state under two names: `phase:<N>:tasks-at-launch` and `run:<runId>:task-list`
  - Places in this feature: `specs/104-spec-input/spec.md` (F104-FR-026) — name `run:<runId>:task-list`
  - Rule: Name `run:<runId>:task-list` (annex B §B.5).
- **W-X-09** · `repair` · medium — Principle XVII: no task records the macOS result or a skip with its reason; the row is marked N/A or gives a reason that is not about tests
  - Places in this feature: `specs/104-spec-input/plan.md:76` (the reason of row XVII is about the staleness verdict, not about tests); `specs/104-spec-input/tasks.md`
  - Rule: Add the macOS and skip task to `tasks.md`; answer row XVII as a pass with its reason.
- **W-X-10** · `repair` · medium — Sentences that say annex B has no logical name, or call a name "proposed" or "to be added"
  - Places in this feature: `specs/104-spec-input/spec.md:316`, `:459` — `run:<runId>:task-list`
  - Rule: Cite "annex B §B.5" for the name.
- **W-X-14** · `repair` · medium — The Constitution Check is not in the form of the plan template, or a row gives a reason that does not bear on its principle
  - Places in this feature: `specs/104-spec-input/plan.md` — name v3.0.0
  - Rule: Bring the Constitution Check to the form of the plan template, as written in the place.
- **W-X-20** · `repair` · medium — 218 test names of `test:` lines appear in no task; three tests have no task at all
  - Places in this feature: first place `specs/104-spec-input/spec.md:156` (52 names)
  - Rule: Make the test names of `spec.md` and `tasks.md` equal; add a task for a test that has none.
- **W-X-27** · `repair` · medium — One schema validator and one YAML parser: plans leave the choice open or name the validator as their own dependency
  - Places in this feature: `specs/104-spec-input/plan.md:32` — "validation through the validators of `@specstride/contracts`"
  - Rule: Refer to the validator that feature 100 chose and to the YAML parser that feature 110 names.
- **W-100-11** · `repair` · low — Annex G §G.4: the row "unknown subcommand" does not say that it is about the first argument
  - Places in this feature: `specs/104-spec-input/spec.md:115`, `:273` (F104-FR-020) — no change; exit 2 for an unknown sub-verb of `spec` is the baseline's code (ruling K6)
  - Rule: Write "Any command, unknown first argument (verb): 1".
- **W-X-28** · `repair` · low — Parity and characterization tests are placed in different directories
  - Places in this feature: `specs/104-spec-input/plan.md:121-125` (inside the package)
  - Rule: Use the two directories of feature 100 in plan and task paths.
- **W-X-29** · `repair` · low — Row XIX states no share of the token budget, or no task measures it
  - Places in this feature: `specs/104-spec-input/plan.md:82` — a byte figure for the default output of `spec`; one task that measures it
  - Rule: State the figure in bytes and add a task that measures it with the helper of T194 of feature 100 (`specs/100-specstride/tasks.md:555`).

### Feature 105 — 105-verification

#### W-105-01 · `repair` · high — F105-FR-010 has the engine write a fact into the run record, which the runtime root writes and whose schema has no field for it

- Findings merged: B-8.2c-002
- Files and lines:
  - Feature 105: `specs/105-verification/spec.md:237` (F105-FR-010)
- Change: Replace the sentence by: "the verification mode in force MUST be in the run snapshot (`run:<runId>:snapshot`, key `verification.mode`), from which the loop layer takes its fallback with the reason `gate-not-executing`".
- Side that changes: feature 105. Authority: F100-FR-143 (one writer), F100-FR-051, annex E §E.2 (`specs/100-specstride/annexes/E-engine.md:72`, `:78-94`), F100-FR-118
- Note: If a field of the run record is wanted, it is an amendment of annex E §E.2 and the runtime root writes it; no report asks for it.
- depends on: none

#### W-105-02 · `repair` · medium — The plan uses `node:child_process` for staged commands; `@specstride/verification` is not a package that may start a process

- Findings merged: B-8.3a-007
- Files and lines:
  - Feature 105: `specs/105-verification/plan.md:38` against `:50`; `specs/105-verification/tasks.md:462` (T129); `specs/105-verification/spec.md:353` (F105-FR-035)
- Change: Remove `node:child_process` from `plan.md:38`. Detached staged commands start through the check runner (EP-05) or the process primitive of `@specstride/kernel`; T129 says which.
- Side that changes: feature 105 (plan and task list). Authority: F100-FR-234 (`specs/100-specstride/annexes/A-foundations.md:74`)
- Note: If neither can start a process that is never killed at its deadline, feature 105 reports a question for feature 148 to the orchestrator.
- depends on: none

#### W-105-03 · `queue` · medium — May repository text declare the reads and writes of a verification command? (proposed question Q-08)

- Findings merged: B-8.4c-005
- Files and lines:
  - Feature 105: `specs/105-verification/spec.md:271` (F105-FR-016); F105-FR-045
  - Feature 107: `specs/107-launch-contract/spec.md:191` (F107-FR-008), `:358` (F107-FR-037)
- Question: Ruling P11 lets two verification commands run side by side on the strength of their declared reads and writes. F105-FR-016 accepts `reads`, `writes`, `sideEffects` and `resource` from the verification-commands document, a file of the project; F107-FR-037 lets them enter derivation only from user configuration, the environment or a flag, and never from repository text. Which source is allowed?
- Sources: Ruling P11; ruling 35 (project configuration may narrow a run and never widen it); F105-FR-016; F105-FR-045 ("a plan source and is not configuration"); F107-FR-008; F107-FR-037; F100-FR-099; F148-FR-011
- Recommended answer (compiler of this worklist; B-8.4c leaves the choice to the orchestrator and recommends no answer): Not from repository text: F107-FR-037 stands, and a declaration that lacks that provenance counts as undeclared, which by ruling P11 means serial
- If answered otherwise: Repository text may declare them: F107-FR-037 is limited to the write scopes of tasks, and a declaration from the verification-commands document is frozen in the check manifest at launch
- Change on the recommended answer: Remove `reads`, `writes` and `sideEffects` from the optional fields of F105-FR-016 and from the last clause of F107-FR-008.
- depends on: none

#### Items owned elsewhere that change files of feature 105

- **W-100-02** · `repair` · high — Owners that were not moved with the split 115 → 116 (EP-16, the fact block, two schema ids, closed sets 142 and 143, the package `@specstride/integrity`)
  - Places in this feature: `specs/105-verification/spec.md:36` — write 116 for the owner of fingerprints, the protected set and toolchain profiles
  - Rule: Write 116 for the owner; feature 100 is corrected first.
- **W-104-01** · `repair` · high — The canonical hasher is built in `@specstride/spec-formats`; the graph and four plans take it from `@specstride/kernel`
  - Places in this feature: `specs/105-verification/plan.md:38` — "the canonical hasher of feature 104 in `@specstride/kernel`" in place of "through its interface in `contracts`"
  - Rule: Name the hasher as "the canonical hasher of feature 104 in `@specstride/kernel`".
- **W-X-02** · `repair` · high — Conformance suites and samples of extension points are placed outside the published test kit, or twice
  - Places in this feature: `specs/105-verification/plan.md:139-142` (`packages/testkit/src/conformance/ep-07/`: write `EP-07`)
  - Rule: Suite in `packages/testkit/src/conformance/EP-nn/`, sample in `packages/testkit/src/samples/EP-nn/`.
- **W-100-05** · `repair` · medium — Defaults of `verification.testPlan` and `verification.generateTests` (row 124 of §X.7)
  - Places in this feature: `specs/105-verification/spec.md:188` (F105-FR-002), `:520`, `:522`; `specs/105-verification/contracts/parity-rows.json` (entries of the two keys) — no change; they are the reference
  - Rule: The defaults are `testautomation/<slug>/TEST_PLAN.md` and `testautomation/<slug>/generated`, unless the mode is `off`.
- **W-X-05** · `repair` · medium — Stale counts in the specs: features, register rows, requirements, profile rows, keys
  - Places in this feature: `specs/105-verification/spec.md:635` (97 rows)
  - Rule: Write the count that holds today, or name the register without a count.
  - depends on: W-ORC-03, W-ORC-01, W-ORC-02
- **W-X-11** · `repair` · medium — Sentences and contract files that say a profile row is "needed", "requested", "proposed" or "to be added", or name it by a label P-n
  - Places in this feature: `specs/105-verification/spec.md:186`, `:193`, `:370`; entries without a row in `specs/105-verification/contracts/parity-rows.json`
  - Rule: Write "row n of annex X §X.7" with the number; in contract files set `row` and the status "confirmed".
  - depends on: W-X-03
- **W-X-12** · `repair` · medium — Tables of closed sets and sentences written before the amendments to annex X §X.6
  - Places in this feature: `specs/105-verification/spec.md:537` — "new" becomes the row number
  - Rule: Write the row number of annex X §X.6 in place of "new" or "none yet".
  - depends on: W-100-02
- **W-X-18** · `repair` · medium — The section "Extension points" says `consumes`, and no requirement has an `ep:` line for the point
  - Places in this feature: `specs/105-verification/spec.md:461` (EP-05; feature 100 says "Feature 105 consumes the runner"), `:465` (EP-08)
  - Rule: Add the line `- ep: EP-nn <id> (consumes)` to the requirement that the row names, or delete the row where no requirement uses the point.
- **W-X-22** · `repair` · medium — Owners do not name their threats of annex X §X.9 with the control (F100-FR-216)
  - Places in this feature: T-03, T-19, T-21, T-25
  - Rule: Add a table "Threats" to `spec.md`: threat id and the requirement that is its control.
  - depends on: W-100-17
- **W-X-23** · `repair` · medium — Text from outside the runtime is written to a sink, and the one redaction point is named nowhere
  - Places in this feature: `specs/105-verification/spec.md:347` — `summary` of the prestage record and event
  - Rule: Add the requirement that the text enters through the one ingress before it is written.
- **W-X-27** · `repair` · medium — One schema validator and one YAML parser: plans leave the choice open or name the validator as their own dependency
  - Places in this feature: `specs/105-verification/plan.md:38` — the same
  - Rule: Refer to the validator that feature 100 chose and to the YAML parser that feature 110 names.
- **W-X-31** · `repair` · low — "Gate" written for a check of the build, and bare "gate" for the verification gate
  - Places in this feature: `specs/105-verification/spec.md:283`, `:195`, `:219`, `:322` — "verification gate" in the requirement lines
  - Rule: Write "check" for a check of the build; write "verification gate" in full.
- **W-X-34** · `accept` · low — Analyze reports cite old ids of the splits in sentences about the split
  - Places in this feature: `specs/105-verification/analyze-report.md:29`
  - Rule: No change.

### Feature 106 — 106-learning

#### W-106-01 · `repair` · high — The plan places `@specstride/learning` at layer L3; the graph places it at L1

- Findings merged: B-8.3a-004
- Files and lines:
  - Feature 106: `specs/106-learning/plan.md:47`, `:141`; `specs/106-learning/research.md:17`; `specs/106-learning/tasks.md:282` (T079)
- Change: Write "layer L1; imports `@specstride/contracts` and `@specstride/kernel` only" in the four places, and add `@specstride/kernel` (atomic write, hasher) to Primary Dependencies. The test of T079 then refuses what the import-boundary check of feature 100 refuses.
- Side that changes: feature 106. Authority: the package graph of feature 100
- depends on: none

#### W-106-02 · `repair` · low — F106-FR-021 names the learning events by their as-is names, and speaks of five types where the catalogue has four

- Findings merged: B-8.2d-019, B-8.2d-017 (part)
- Files and lines:
  - Feature 106: `specs/106-learning/spec.md:299` (F106-FR-021); `:304`, `:591` ("the five learning event types")
- Change: Name the catalogue types (`learning.observed`, `learning.knob_adjusted`, `learning.knob_auto_reverted`, `learning.knob_evaluated`) and give the as-is names as the projection. Settle four against five: if the baseline has a fifth type, report it to the orchestrator for the catalogue of feature 111; else write four.
- Side that changes: feature 106
- depends on: W-X-13 (`CQ-pending-<n>` placeholders remain, and one row carries the number of another question)

#### W-106-03 · `repair` · low — The launch contract beating the shell is called an exception to the order of configuration; it is rank 1 of the order

- Findings merged: B-8.4a-004
- Files and lines:
  - Feature 106: `specs/106-learning/spec.md:474`
- Change: Reword: "The launch contract beats the shell for the learning mode: rank 1 of the order of configuration (the pin), which applies to children of the runtime root only".
- Side that changes: feature 106. Authority: ruling 10 (`specs/100-specstride/annexes/X-cross-layer.md:61`)
- depends on: none

#### Items owned elsewhere that change files of feature 106

- **W-104-01** · `repair` · high — The canonical hasher is built in `@specstride/spec-formats`; the graph and four plans take it from `@specstride/kernel`
  - Places in this feature: `specs/106-learning/plan.md:39` — the same sentence in place of "the canonical hasher of feature 100"
  - Rule: Name the hasher as "the canonical hasher of feature 104 in `@specstride/kernel`".
- **W-100-14** · `repair` · medium — "Iteration" as a counted unit, and four names for one limit
  - Places in this feature: "pass cap" (lines not given in the report)
  - Rule: Write "pass limit" and "pass count"; "iteration" survives only in the literals `MAX_ITER`, `iter_*` and `giveIterationBack`.
- **W-X-07** · `repair` · medium — Plans hold statements that the repository has overtaken (owners and layers of the graph, register rows "to be added", names "to be added" to annex B)
  - Places in this feature: `specs/106-learning/plan.md:88` — "the intended difference has DV-105" (`specs/106-learning/spec.md:232` cites it)
  - Rule: State the present state of the package graph, the register and annex B.
- **W-X-09** · `repair` · medium — Principle XVII: no task records the macOS result or a skip with its reason; the row is marked N/A or gives a reason that is not about tests
  - Places in this feature: `specs/106-learning/plan.md:83`; `specs/106-learning/tasks.md`
  - Rule: Add the macOS and skip task to `tasks.md`; answer row XVII as a pass with its reason.
- **W-X-13** · `repair` · medium — `CQ-pending-<n>` placeholders remain, and one row carries the number of another question
  - Places in this feature: `specs/106-learning/spec.md:304`, `:591`; `specs/106-learning/research.md:28` — `CQ-pending-4` (names of the learning event types): cite the catalogue of feature 111 through annex X; no question stays open. The catalogue has four types (`learning.observed` and three `learning.knob_*`), the row speaks of five: settle it in F106-FR-021 (item of feature 106)
  - Rule: Replace the placeholder as written in the place.
  - depends on: W-141-01, W-141-02
- **W-X-14** · `repair` · medium — The Constitution Check is not in the form of the plan template, or a row gives a reason that does not bear on its principle
  - Places in this feature: `specs/106-learning/plan.md` — name v3.0.0
  - Rule: Bring the Constitution Check to the form of the plan template, as written in the place.
- **W-X-23** · `repair` · medium — Text from outside the runtime is written to a sink, and the one redaction point is named nowhere
  - Places in this feature: `specs/106-learning/spec.md:299` — the learning stream, which F111-FR-022 puts under the same ingress
  - Rule: Add the requirement that the text enters through the one ingress before it is written.
- **W-X-25** · `repair` · medium — Logical names of annex B §B.5 that no feature cites
  - Places in this feature: `specs/106-learning/spec.md:147` — `feature:<slug>:learning:lock`
  - Rule: Name the logical name of annex B §B.5 in the requirement that writes or reads the state.
- **W-X-26** · `repair` · medium — The owner of a record of annex B §B.20 delivers no schema file and still calls the id "proposed"
  - Places in this feature: `specs/106-learning/data-model.md:49` — `specstride.retrospective/1` (`specs/100-specstride/annexes/B-state.md:674`)
  - Rule: Add the schema file with `schema` required; cite annex B §B.20.
  - depends on: W-100-16, W-100-09
- **W-X-27** · `repair` · medium — One schema validator and one YAML parser: plans leave the choice open or name the validator as their own dependency
  - Places in this feature: `specs/106-learning/plan.md:39` — the same
  - Rule: Refer to the validator that feature 100 chose and to the YAML parser that feature 110 names.
- **W-X-28** · `repair` · low — Parity and characterization tests are placed in different directories
  - Places in this feature: `specs/106-learning/plan.md:133-138` (inside the package)
  - Rule: Use the two directories of feature 100 in plan and task paths.
- **W-X-29** · `repair` · low — Row XIX states no share of the token budget, or no task measures it
  - Places in this feature: `specs/106-learning/plan.md:89` — a byte figure for the default output of `learn`; one task that measures it
  - Rule: State the figure in bytes and add a task that measures it with the helper of T194 of feature 100 (`specs/100-specstride/tasks.md:555`).

### Feature 107 — 107-launch-contract

No item of its own.

#### Items owned elsewhere that change files of feature 107

- **W-X-01** · `repair` · high — Plans and task lists name packages that the package graph of feature 100 does not hold
  - Places in this feature: `specs/107-launch-contract/plan.md:23`, `:90`; `specs/107-launch-contract/tasks.md:13` (T002) and 53 further task paths — replace `packages/launch-contract` by `packages/pipeline`, with a directory per subject (for example `packages/pipeline/src/contract/`); state layer L5 and the imports the graph allows. The graph names `@specstride/pipeline` for 107 and 123, and plan 123 builds there (`specs/123-pipeline-runtime-and-supervisor/plan.md:35`, `:110`)
  - Rule: Use the package that the package graph of feature 100 names; change plan and task paths.
  - depends on: W-100-25
- **W-105-03** · `queue` · medium — May repository text declare the reads and writes of a verification command?
  - Places in this feature: `specs/107-launch-contract/spec.md:191` (F107-FR-008), `:358` (F107-FR-037)
  - Rule: proceed on the recommended answer: a declaration of reads and writes never comes from repository text; without the provenance of F107-FR-037 the command is serial
- **W-110-06** · `repair` · medium — Defaults of one key stated differently, and defaults of the catalogue given by reference
  - Places in this feature: `specs/107-launch-contract/spec.md:440` — `supervise.maxRelaunches`, `supervise.wallClockSec`: "2; derived" in place of "unset (no ceiling beyond the bound of the stages)" (row 48 of §X.7; `specs/110-config-and-terms/spec.md:215`)
  - Rule: Write the default of annex X §X.7.
  - depends on: W-100-05
- **W-141-02** · `queue` · medium — Which are the error classes of the validation of a launch contract?
  - Places in this feature: state the ten validators as a closed set, and report it to the orchestrator for annex X §X.6
  - Rule: proceed on the recommended answer: state the ten validators of the baseline as a closed set
- **W-X-07** · `repair` · medium — Plans hold statements that the repository has overtaken (owners and layers of the graph, register rows "to be added", names "to be added" to annex B)
  - Places in this feature: `specs/107-launch-contract/plan.md:64` — drop "to be added" for DV-096 and DV-097 (`docs/ecosystem/consolidation.md:995`, `:996`); `specs/107-launch-contract/tasks.md:142` (T061) — drop the two register rows from the request
  - Rule: State the present state of the package graph, the register and annex B.
- **W-X-10** · `repair` · medium — Sentences that say annex B has no logical name, or call a name "proposed" or "to be added"
  - Places in this feature: `specs/107-launch-contract/spec.md:347`, `:507` — `launch:<launchId>:comment`
  - Rule: Cite "annex B §B.5" for the name.
- **W-X-14** · `repair` · medium — The Constitution Check is not in the form of the plan template, or a row gives a reason that does not bear on its principle
  - Places in this feature: `specs/107-launch-contract/plan.md:37-65` — mark the rows with ✅, ❌ or N/A; name v3.0.0
  - Rule: Bring the Constitution Check to the form of the plan template, as written in the place.
- **W-X-20** · `repair` · medium — 218 test names of `test:` lines appear in no task; three tests have no task at all
  - Places in this feature: first place `specs/107-launch-contract/spec.md:160` (16 names)
  - Rule: Make the test names of `spec.md` and `tasks.md` equal; add a task for a test that has none.
- **W-X-27** · `repair` · medium — One schema validator and one YAML parser: plans leave the choice open or name the validator as their own dependency
  - Places in this feature: `specs/107-launch-contract/plan.md:15` — the same
  - Rule: Refer to the validator that feature 100 chose and to the YAML parser that feature 110 names.
- **W-X-28** · `repair` · low — Parity and characterization tests are placed in different directories
  - Places in this feature: `specs/107-launch-contract/plan.md:100-103` (inside the package)
  - Rule: Use the two directories of feature 100 in plan and task paths.
- **W-X-31** · `repair` · low — "Gate" written for a check of the build, and bare "gate" for the verification gate
  - Places in this feature: `specs/107-launch-contract/spec.md:484` — "payload check" for "judgment payload gate"
  - Rule: Write "check" for a check of the build; write "verification gate" in full.
- **W-X-32** · `repair` · low — A runtime is named in a requirement outside `## Constraints`
  - Places in this feature: `specs/107-launch-contract/spec.md:320` (F107-FR-030, "a Node interpreter line") — "the interpreter line of the product's runtime"; the constraint is already at `specs/107-launch-contract/spec.md:46`
  - Rule: Leave the name of the runtime in `## Constraints`.

### Feature 108 — 108-reverse

#### W-108-01 · `repair` · medium — A detached reverse run on a held lock ends `refused` (exit 4); feature 122 and annex F give `attached` (4) and refusals with 24

- Findings merged: B-8.2b-005
- Files and lines:
  - Feature 108: `specs/108-reverse/spec.md:154` (F108-FR-009), `:516` (the answer in the clarifications)
- Change: Write: "with the handshake outcome of feature 122: `attached` (exit 4) when a live run holds the lock; `refused` with 24 for `lock-conflict` and `lock-unknown`".
- Side that changes: feature 108. Authority: annex F §F.3 (`specs/100-specstride/annexes/F-runtime-root.md:66`); `specs/122-detached-runtime/spec.md:241`; `specs/122-detached-runtime/contracts/cli-state-commands.md:20` to `:30`
- depends on: none

#### Items owned elsewhere that change files of feature 108

- **W-100-04** · `repair` · medium — Annex X §X.7: owner of row 34 and the key of row 30
  - Places in this feature: `specs/108-reverse/spec.md:501` — in the column of the row for `loop.gitCommits` write "none; not a switch"
  - Rule: Write what the place says; feature 100 is corrected first.
- **W-X-06** · `repair` · medium — "Run" and "engine invocation" written for one engine start
  - Places in this feature: `specs/108-reverse/spec.md:141`, `:147`, `:154` — "engine start" for "one engine invocation"
  - Rule: Write "engine start" where one start of the engine is meant (ruling 24).
- **W-X-10** · `repair` · medium — Sentences that say annex B has no logical name, or call a name "proposed" or "to be added"
  - Places in this feature: `specs/108-reverse/spec.md:198`, `:472-473` — `reverse:<slug>:claims:<unit-key>`, `reverse:<slug>:test-plan`, `reverse:<slug>:scaffolds`
  - Rule: Cite "annex B §B.5" for the name.
- **W-X-20** · `repair` · medium — 218 test names of `test:` lines appear in no task; three tests have no task at all
  - Places in this feature: first place `specs/108-reverse/spec.md:118` (43 names); example: the spec names `PT-108-C-109-passthrough`, the task `PT-108-C-108-entry` proves C-108 to C-115 (`specs/108-reverse/tasks.md:56-57`)
  - Rule: Make the test names of `spec.md` and `tasks.md` equal; add a task for a test that has none.
- **W-X-25** · `repair` · medium — Logical names of annex B §B.5 that no feature cites
  - Places in this feature: `specs/108-reverse/spec.md:44` — `reverse:<slug>:output`
  - Rule: Name the logical name of annex B §B.5 in the requirement that writes or reads the state.
- **W-100-16** · `repair` · low — The form of `$id` of a schema file is stated nowhere; the features use four other forms
  - Places in this feature: `specs/108-reverse/contracts/*.schema.json`
  - Rule: Write `$id` as `urn:specstride:schema:<schema id>`.
- **W-X-30** · `repair` · low — Absolute paths of the owner's machine in task text and research
  - Places in this feature: `specs/108-reverse/research.md:11`
  - Rule: Write "the Specstride baseline at `9cab15d`" and "the Lisa baseline at `363e6a3`" without a path.
- **W-X-33** · `repair` · low — A requirement line names another tier 2 feature in prose and no contract of feature 100
  - Places in this feature: `specs/108-reverse/spec.md:409` (names 113)
  - Rule: In each line name the contract of feature 100 through which the behaviour is consumed (for example annex X §X.2 for the event catalogue, annex X §X.10 for the redaction patterns, annex G §G.7 for the doctor registry).
- **W-X-34** · `accept` · low — Analyze reports cite old ids of the splits in sentences about the split
  - Places in this feature: `specs/108-reverse/analyze-report.md:3`, `:9`
  - Rule: No change.

### Feature 109 — 109-harness-seam

No item of its own.

#### Items owned elsewhere that change files of feature 109

- **W-100-19** · `repair` · critical — The weaker proof of a tool-less critic departs from the text of Principle IX and is recorded in no Complexity Tracking
  - Places in this feature: `specs/109-harness-seam/plan.md:73` (row IX), `:204-208` (Complexity Tracking); `specs/109-harness-seam/spec.md:393` (F109-FR-038)
  - Rule: Record the weaker proof as a deviation from Principle IX in row IX and in Complexity Tracking.
- **W-100-20** · `queue` · critical — Is the weaker proof of a tool-less critic allowed under Principle IX?
  - Places in this feature: `specs/109-harness-seam/spec.md:393` (F109-FR-038)
  - Rule: proceed on the recommended answer: Yes, for a tested harness adapter only, recorded for every call as the weaker proof; Principle IX gets a PATCH that names it
  - depends on: W-100-19
- **W-146-01** · `repair` · high — The writer (109) and the reader (146) of the result of `harness verify` name four of its five fields differently
  - Places in this feature: `specs/109-harness-seam/data-model.md:84-91` — cite the field list of 146 and drop "proposed"
  - Rule: Cite the field list of feature 146 for `user:harness-verify:<id>`.
  - depends on: W-100-16
- **W-X-02** · `repair` · high — Conformance suites and samples of extension points are placed outside the published test kit, or twice
  - Places in this feature: `specs/109-harness-seam/plan.md:149-153` (`packages/testkit/src/harness-conformance/`, sample in `tests/conformance/harness/sample/`)
  - Rule: Suite in `packages/testkit/src/conformance/EP-nn/`, sample in `packages/testkit/src/samples/EP-nn/`.
- **W-100-21** · `repair` · medium — The build of the product runs a Python generator; the plan says the Language Ledger stays empty and nothing orders the port before a release
  - Places in this feature: `specs/109-harness-seam/tasks.md:379` (T102, test CT-109-107) — the test reads the result of the traceability check and does not start `python3`
  - Rule: A test of the product reads the result of the traceability check and does not start `python3`.
- **W-110-05** · `repair` · medium — Ruling 34: the opt-in to no containment (C0) is accepted from the environment or a flag
  - Places in this feature: `specs/109-harness-seam/spec.md:672` — correct the clarification; it disagrees with F109-FR-026 (`specs/109-harness-seam/spec.md:317`), which says user configuration
  - Rule: The opt-in to C0 comes from user configuration only.
- **W-X-05** · `repair` · medium — Stale counts in the specs: features, register rows, requirements, profile rows, keys
  - Places in this feature: `specs/109-harness-seam/spec.md:678` (97 rows)
  - Rule: Write the count that holds today, or name the register without a count.
  - depends on: W-ORC-03, W-ORC-01, W-ORC-02
- **W-X-06** · `repair` · medium — "Run" and "engine invocation" written for one engine start
  - Places in this feature: `specs/109-harness-seam/spec.md:131` — "the next engine start"
  - Rule: Write "engine start" where one start of the engine is meant (ruling 24).
- **W-X-07** · `repair` · medium — Plans hold statements that the repository has overtaken (owners and layers of the graph, register rows "to be added", names "to be added" to annex B)
  - Places in this feature: `specs/109-harness-seam/plan.md:48`, `:124`, `:160` — owners of `@specstride/harness`: 109, 124, 126 and 146
  - Rule: State the present state of the package graph, the register and annex B.
- **W-X-10** · `repair` · medium — Sentences that say annex B has no logical name, or call a name "proposed" or "to be added"
  - Places in this feature: `specs/109-harness-seam/spec.md:304`, `:696` — `package:harness:<id>`
  - Rule: Cite "annex B §B.5" for the name.
- **W-X-14** · `repair` · medium — The Constitution Check is not in the form of the plan template, or a row gives a reason that does not bear on its principle
  - Places in this feature: `specs/109-harness-seam/plan.md:63-76` — add the heading "The product and its edges (VI–XII)"
  - Rule: Bring the Constitution Check to the form of the plan template, as written in the place.
- **W-X-16** · `repair` · medium — The terms gate, its file and the audience are said to belong to feature 110; since the split they belong to 147
  - Places in this feature: `specs/109-harness-seam/spec.md:685`
  - Rule: Replace 110 by 147 where the terms gate, the terms file or the audience is meant (`specs/147-terms-gate/spec.md:17`); keep 110 for the secret resolvers.
- **W-X-19** · `repair` · medium — Registering an entry in a registry of another feature is `implements` in some specs and `consumes` in others (EP-14, EP-01)
  - Places in this feature: `specs/109-harness-seam/spec.md:503` (EP-14, `consumes`)
  - Rule: Write `implements (an entry)` for the registration of doctor checks; for EP-01 in 129 write `consumes`.
  - depends on: W-ORC-06
- **W-X-22** · `repair` · medium — Owners do not name their threats of annex X §X.9 with the control (F100-FR-216)
  - Places in this feature: T-14
  - Rule: Add a table "Threats" to `spec.md`: threat id and the requirement that is its control.
  - depends on: W-100-17
- **W-X-27** · `repair` · medium — One schema validator and one YAML parser: plans leave the choice open or name the validator as their own dependency
  - Places in this feature: `specs/109-harness-seam/plan.md:40` — the same, and add "the YAML parser that feature 110 chose (one parser in the workspace, MIT, pure JavaScript)"; descriptors are YAML files by the layout table (`user:harness:<id>`), and T061 (`specs/109-harness-seam/tasks.md:222`) writes them
  - Rule: Refer to the validator that feature 100 chose and to the YAML parser that feature 110 names.
- **W-100-16** · `repair` · low — The form of `$id` of a schema file is stated nowhere; the features use four other forms
  - Places in this feature: `specs/109-harness-seam/contracts/overlay-marker.schema.json:3`
  - Rule: Write `$id` as `urn:specstride:schema:<schema id>`.
- **W-X-29** · `repair` · low — Row XIX states no share of the token budget, or no task measures it
  - Places in this feature: `specs/109-harness-seam/plan.md:90` — the figures are stated (200 bytes per doctor finding, one line per result of `harness verify`); `specs/109-harness-seam/tasks.md`: one task that measures them
  - Rule: State the figure in bytes and add a task that measures it with the helper of T194 of feature 100 (`specs/100-specstride/tasks.md:555`).

### Feature 110 — 110-config-and-terms

#### W-110-01 · `repair` · high — `config-keys.tsv` gives "as default" as the value under `parity` for 14 keys whose row of §X.7 gives another value

- Findings merged: B-8.2e-002
- Files and lines:
  - Feature 110: `specs/110-config-and-terms/contracts/config-keys.tsv:36`, `:38`, `:107`, `:108`, `:109`, `:119`, `:120`, `:122`, `:123`, `:124`, `:137`, `:138`, `:178`, `:248` (column `value_under_parity`); `specs/110-config-and-terms/spec.md:100`, `:102`, `:170`, `:171`, `:191`, `:216`, `:279` (owner column: add "Row n; value")
- Change: Set the column to the value of §X.7: rows 8, 9, 11 (`carry.ledger_handoff`, `carry.index`, `carry.polite_stop`) off; rows 31 to 33 (`integrity.*`) off; row 35 (`critic.autoPick`) not reached (§K.9 of 110 says "false"); row 57 (`prompt.critic.overWindow`) `send`; row 58 (`prompt.critic.block_set`) `as-is`; rows 87, 88 (`discovery.enabled`, `discovery.online`) off; row 92 (`critic.warnSameModel`) not printed; row 48 (`supervise.wallClockSec`) unset; row 104 (`telemetry.flush.intervalMs`) 0.
- Side that changes: feature 110. Authority: annex X §X.7
- depends on: none

#### W-110-02 · `repair` · high — Feature 118 reads six keys under `loop.yield.*` and six environment variables that no list holds; an unknown key refuses the launch (F100-FR-203)

- Findings merged: B-8.2e-003
- Files and lines:
  - Feature 110: `specs/110-config-and-terms/spec.md` §K.5 and `specs/110-config-and-terms/contracts/config-keys.tsv` — add `loop.yield.waitEvery`, `.logHead`, `.logTail`, `.failureLedger`, `.failureLedgerMax`, `.failurePattern` (defaults 10, 40, 80, true, 150 and the pattern of 118; owner 118, neutral, snap `t`, as default under `parity`); §K.8 — add by name `SPECSTRIDE_FAILURE_LEDGER`, `SPECSTRIDE_FAILURE_LEDGER_MAX`, `SPECSTRIDE_FAILURE_PATTERN`, `SPECSTRIDE_YIELD_WAIT_EVERY`, `SPECSTRIDE_YIELD_LOG_HEAD`, `SPECSTRIDE_YIELD_LOG_TAIL`
  - Feature 118: `specs/118-pass-supervision-and-jobs/spec.md:447` (drop "proposals" and cite the key table of 110), `:291`, `:367` (cite §K.8 of 110 for the three variables)
- Change: Add the keys and the variables to feature 110; feature 118 cites them. Annex X §X.8 already maps "the other `SPECSTRIDE_YIELD_*`" to `loop.yield.*` (`specs/100-specstride/annexes/X-cross-layer.md:701`), so feature 100 expects the keys.
- Side that changes: feature 110 adds; feature 118 cites
- depends on: W-100-08 (Annex X §X.8: six rows stand twice, and two keys are still marked "(proposed)")

#### W-110-03 · `repair` · high — Environment aliases that the alias tables do not hold, and alias tables that are out of step

- Findings merged: B-8.2e-007, B-8.2e-016 (part)
- Files and lines:
  - Feature 110: `specs/110-config-and-terms/spec.md:307`, `:311` (§K.8: `SPECSTRIDE_AGENT_STREAM` is left "to feature 126"; annex X §X.8 line 720 maps it to `stream.tap`); `specs/110-config-and-terms/contracts/alias-table.tsv` (6 rows; §K.8 has 12 and §X.8 has 39; task T005 completes it); §K.8: add `SPECSTRIDE_OTEL_TRACES`, `RALPH_LOKI_URL`, `RALPH_OTEL_URL`, `RALPH_LOKI_TIMEOUT`, `RALPH_OTEL_TIMEOUT`, `RALPH_LOKI_MAX_BATCH_BYTES`, `RALPH_OTEL_MAX_BATCH_BYTES`, `SPECSTRIDE_PRIME_FLEET_BIN`, with the conversion from seconds to milliseconds for the two time limits
  - Feature 128: `specs/128-telemetry-export/spec.md:163`, `:176`, `:218` — cite §K.8 of feature 110 in place of "the alias table of annex X §X.8" for the seven names
  - Feature 130: `specs/130-adapter-dsh/spec.md:611` to `:613`, `:619` — replace "not in the table" by "annex X §X.8" (lines 721, 723, 728 of `specs/100-specstride/annexes/X-cross-layer.md` hold the home, the provider, the plugin time limit and the launcher)
  - Feature 131: `specs/131-adapter-codex/spec.md:550`, `:551` — `OPENAI_BASE_URL` and `OPENAI_API_KEY` are in annex X §X.8 (line 724)
  - Feature 138: `specs/138-adapter-prime/spec.md:214` (F138-FR-003), `:590` — `SPECSTRIDE_PRIME_FLEET_BIN` comes first and `SPECSTRIDE_PRIME_BIN` is read when it is unset, as at the baseline; cite §K.8 for the order
- Change: Feature 110 adds the eight names to §K.8 and completes `alias-table.tsv`. For prime, §K.8 states the order of the two names as the as-is behaviour and as the one exception to F110-FR-020 (`specs/110-config-and-terms/spec.md:523`), which otherwise refuses a launch when two names reach one key and differ. B-8.2e leaves open whether the names go to §X.8 or to §K.8, and whether prime gets the exception or the refusal; §K.8 and the exception are chosen because they change no contract of feature 100 and keep the baseline's behaviour (Principle XVIII).
- Side that changes: feature 110 adds; features 128, 130, 131 and 138 cite
- depends on: W-100-08 (Annex X §X.8: six rows stand twice, and two keys are still marked "(proposed)")

#### W-110-04 · `repair` · high — The owner of a key in feature 110 is the owner before the nine splits

- Findings merged: B-8.2e-008 (part), B-8.2d-009, B-8.4b-004
- Files and lines:
  - Feature 110: `specs/110-config-and-terms/spec.md:153`, `:154`, `:160`, `:161`, `:173`, `:191`, `:203`, `:205`, `:213`, `:227`, `:230` to `:234`, `:240`; `specs/110-config-and-terms/contracts/config-keys.tsv:93`, `:94`, `:102`, `:103`, `:122`, `:123`, `:137`, `:138`, `:162`, `:164` to `:166`, `:173`, `:174`, `:181`, `:186` to `:191`, `:91`, `:70`, `:6`, `:4`
  - Feature 128: `specs/128-telemetry-export/spec.md:595` — the owner of `compat.legacyEvents` is 144
- Change: Set the owner to the owner of annex X §X.7: `attempt.tier_bump`, `attempt.tier_bump_after`: 149 (rows 24, 128). `verification.step_runner`, `verification.parallelism`, `verification.envAllowlist`: 148 (rows 6, 7, 125). `integrity.gate_fingerprint`: 148, 117; `integrity.phase_entry`: 116. `discovery.*`, `critic.catalogueWindowMargin`: 146 (rows 87 to 89). `compat.legacyEvents`: 144 (row 17). `output.live`, `.liveDetail`, `.color`, `.banner`, `.liveRail`, `.motion`, `.bannerBg`, `.ascii`: 145 (rows 70, 71, 73 to 78). `reverse.maxFileBytes`, `.maxTotalBytes`: 140 (row 69). `loop.parallel.seedPaths`: 143 (row 95). `loop.maxWallMin`: 127 (row 107). `state.dir`: 122 (row 116). `distribution.audience` stays 147; there feature 100 is the stale side.
- Side that changes: feature 110 and one line of 128. Authority: annex X §X.7
- depends on: W-100-04 (Annex X §X.7: owner of row 34 and the key of row 30)

#### W-110-05 · `repair` · medium — Ruling 34: the opt-in to no containment (C0) is accepted from the environment or a flag

- Findings merged: B-8.4a-001
- Files and lines:
  - Feature 109: `specs/109-harness-seam/spec.md:672` — correct the clarification; it disagrees with F109-FR-026 (`specs/109-harness-seam/spec.md:317`), which says user configuration
  - Feature 110: `specs/110-config-and-terms/spec.md:519` (F110-FR-019), `:188` (layers `F E U` of `sandbox.level`) — give the value `C0` of `sandbox.level` the layer `U` only and say so in F110-FR-019
  - Feature 131: `specs/131-adapter-codex/spec.md:241` (F131-FR-010) — "in user configuration" in place of "in user configuration, the environment or a flag"
  - Feature 134: `specs/134-adapter-pi/spec.md:215` (F134-FR-008) — the same
- Change: Keep the ruling's words: the opt-in to C0 comes from user configuration only. F100-FR-111 (`specs/100-specstride/annexes/C-ports-and-edges.md:877`), F109-FR-026, F130-FR-010 (`specs/130-adapter-dsh/spec.md:255`) and F138-FR-015 (`specs/138-adapter-prime/spec.md:293`) already say so.
- Side that changes: features 110, 109, 131, 134. Authority: ruling 34 ("none only by opt-in in user config") and F100-FR-111
- Note: The question whether "user config" stands for every consumer-controlled source is queued by the item of feature 100; this repair is its recommended answer.
- depends on: none

#### W-110-06 · `repair` · medium — Defaults of one key stated differently, and defaults of the catalogue given by reference

- Findings merged: B-8.2e-009 (part)
- Files and lines:
  - Feature 107: `specs/107-launch-contract/spec.md:440` — `supervise.maxRelaunches`, `supervise.wallClockSec`: "2; derived" in place of "unset (no ceiling beyond the bound of the stages)" (row 48 of §X.7; `specs/110-config-and-terms/spec.md:215`)
  - Feature 110: `specs/110-config-and-terms/contracts/config-keys.tsv:112` to `:117` (the six `carry.*` parameters: "as 103's row 45"; the row is 60 and its values are 6144; set by the plan; 3; 150000; 50; 300); `:173` to `:175` (`reverse.maxFileBytes`, `.maxTotalBytes`, `.tasks`: "as shown", with the values in the type column); `:198` (`critic.catalogueWindowMargin`: "as 124"; 20 per cent, owner 146)
  - Feature 127: `specs/127-quota-budgets-and-pause/spec.md:505` — `budget.*`: "none" in place of "0 (off)", and add `budget.run.phaseAttempts` (row 108 of §X.7)
- Change: Write the values themselves in the file of 110; write the values of §X.7 in 107 and 127.
- Side that changes: features 110, 107 and 127. Authority: annex X §X.7 rows 48, 60, 108
- depends on: W-100-05 (Defaults of `verification.testPlan` and `verification.generateTests` (row 124 of §X.7))

#### W-110-07 · `repair` · medium — 29 lines of `config-keys.tsv` carry the type and the default of a whole group of keys

- Findings merged: B-8.2e-010
- Files and lines:
  - Feature 110: `specs/110-config-and-terms/contracts/config-keys.tsv:80`, `:81`, `:137`, `:138`, `:159` to `:161`, `:173` to `:175`, `:179`, `:180`, `:184`, `:185`, `:194`, `:195`, `:228`, `:229`, `:231`, `:232`, `:236` to `:241`, `:248`, `:249`
- Change: Split the cells: one type and one default per line (for example "1800; 20" stands for `status.staleEventSec` and again for `status.timelineRows`).
- Side that changes: feature 110
- depends on: W-110-01 (`config-keys.tsv` gives "as default" as the value under `parity` for 14 keys whose row of §X.7 gives another value), W-110-04 (The owner of a key in feature 110 is the owner before the nine splits), W-110-06 (Defaults of one key stated differently, and defaults of the catalogue given by reference)

#### W-110-08 · `repair` · medium — The message for an ignored widening key is shown "whatever the output mode"; under `parity` no new line is printed

- Findings merged: B-8.2e-013
- Files and lines:
  - Feature 110: `specs/110-config-and-terms/spec.md:511` (F110-FR-017); against `specs/146-harness-discovery/spec.md:166` (F146-FR-010)
- Change: Add to F110-FR-017: "except under the `parity` profile, where no line without an as-is equivalent is printed (row 19); the doctor warning stays".
- Side that changes: feature 110. Authority: ruling 68; row 19 of annex X §X.7
- depends on: none

#### W-110-09 · `repair` · medium — Three options in user configuration have no key

- Findings merged: B-8.2e-014
- Files and lines:
  - Feature 100: annex X §X.7 — a row for the two opt-ins of the adapters, or the statement that row 29 (`memory.native.proposer`) covers them
  - Feature 110: `specs/110-config-and-terms/spec.md` §K.5 and `specs/110-config-and-terms/contracts/config-keys.tsv` — three new widening keys, named by their owners
  - Feature 116: `specs/116-check-integrity-and-unit-evidence/spec.md:192` — toolchain profiles of the consumer "from user configuration only": name the key
  - Feature 131: `specs/131-adapter-codex/spec.md:268` — the opt-in for project instruction files: name the key
  - Feature 134: `specs/134-adapter-pi/spec.md:269` — the opt-in for the auto-loaded context of pi (extensions, skills, context files, prompt templates): name the key
- Change: Each owner names its key and reports it to feature 110, which adds it as a widening key. Feature 100 states in §X.7 whether row 29 covers the two opt-ins of the adapters; if not, one new row.
- Side that changes: features 116, 131 and 134 name; feature 110 adds; feature 100 states the row
- Generated contract files that change: `contracts/data/parity-profile.json` (only if a row is added)
- depends on: none

#### W-110-10 · `repair` · medium — F110-FR-006 makes `.env.example` a reference for defaults, although defect D-42 is dropped

- Findings merged: B-8.4c-003
- Files and lines:
  - Feature 110: `specs/110-config-and-terms/spec.md:462` (F110-FR-006), `:106`; `specs/110-config-and-terms/tasks.md:28` (T002)
- Change: Name `orchestrator.sh` (the built-in defaults) as the reference, and say that `.env.example` is read only for keys whose built-in default it repeats; change T002 accordingly. The two sources disagree at the baseline for the critic (B-0001) and the Loki address (B-0002, where D-41 preserves port 3100 and F128-FR-002 says 3100).
- Side that changes: feature 110. Authority: ruling K7 (defect D-42 is `drop`, `consolidation.md` section 5.3)
- depends on: none

#### W-110-11 · `queue` · low — The rule of unit suffixes is applied unevenly (`Minutes`, `Days`, `Percent`)

- Findings merged: B-8.2e-018
- Files and lines:
  - Feature 100: `specs/100-specstride/annexes/X-cross-layer.md:453` (the sentence on suffixes: four, without `Percent`), `:529` (row 65)
  - Feature 110: `specs/110-config-and-terms/spec.md:56`, `:126`, `:353` (§K.2 lists `Sec`, `Ms`, `Min`, `Bytes`, `Percent`)
  - Feature 115: `specs/115-micro-loop-layer/spec.md:705` to `:707` (`loop.micro.caps.proposalMinutes`, `.unitMinutes`, `.checkMinutes`)
- Covered by the open question: **CQ-160**. No new question is proposed.
- Question: Are config keys spelled in one style, and which unit suffixes exist? (CQ-160, as it stands in the queue)
- Sources: CQ-160; annex X §X.7; §K.2 of feature 110
- Recommended answer (CQ-160; the rename is the first of the two repairs that B-8.2e offers): The recommended answer of CQ-160: every key outside the 43 original rows is lowerCamelCase with the suffixes `Sec`, `Ms`, `Min` and `Bytes`. Row 65 is outside the 43, so the three keys become `proposalMin`, `unitMin`, `checkMin`
- If answered otherwise: `Minutes` and `Days` are added to the list of §K.2, and the three keys stay
- Change on the recommended answer: Rename the three keys in 110, 115 and row 65. Add `Percent` to the sentence of §X.7, and `Days` (`doctor.staleAfterDays`, `observability.retention.rawDays`) to the list of §K.2 and to the text of CQ-160.
- Generated contract files that change: `contracts/data/parity-profile.json`
- depends on: none

#### W-110-12 · `repair` · low — One rule under two names: "tier bump" and "model-tier bump"

- Findings merged: B-8.2a-012
- Files and lines:
  - Feature 100: bare "tier bump" (the report names the feature, not the line)
  - Feature 110: `specs/110-config-and-terms/spec.md:717`, `:732`, and 3 further bare uses against 22 uses of "model-tier bump"
  - Feature 111: bare "tier bump" (the report names the feature, not the line)
  - Feature 115: bare "tier bump" (the report names the feature, not the line)
  - Feature 127: bare "tier bump" (the report names the feature, not the line)
- Change: Write "model-tier bump" everywhere; find the places with `grep -n 'tier bump' specs/1*/spec.md | grep -v model-tier`. The key `harnesses.<id>.tiers` and the key names `attempt.tier_bump*` stay.
- Side that changes: the features. Authority: glossary row 42 ("tier" is never bare)
- depends on: none

#### W-110-13 · `repair` · low — The list of assumptions names physical paths

- Findings merged: B-8.2c-015
- Files and lines:
  - Feature 110: `specs/110-config-and-terms/spec.md:630` (`specstride.yaml`, `~/.config/specstride/config.yaml`)
- Change: Name the logical names `project:config` and `user:config`, and leave the paths to the plan.
- Side that changes: feature 110
- depends on: none

#### Items owned elsewhere that change files of feature 110

- **W-X-02** · `repair` · high — Conformance suites and samples of extension points are placed outside the published test kit, or twice
  - Places in this feature: `specs/110-config-and-terms/plan.md:104`; `specs/110-config-and-terms/tasks.md:101`, `:103` (`packages/config/tests/conformance/`, EP-10)
  - Rule: Suite in `packages/testkit/src/conformance/EP-nn/`, sample in `packages/testkit/src/samples/EP-nn/`.
- **W-X-04** · `repair` · high — Old spellings of config keys survive in contract files of the features
  - Places in this feature: `specs/110-config-and-terms/spec.md:665` — `supervise.wallClockSeconds` becomes `supervise.wallClockSec`
  - Rule: Write the spelling of `config-keys.tsv` of feature 110.
- **W-100-05** · `repair` · medium — Defaults of `verification.testPlan` and `verification.generateTests` (row 124 of §X.7)
  - Places in this feature: `specs/110-config-and-terms/spec.md:157` — the same two defaults
  - Rule: The defaults are `testautomation/<slug>/TEST_PLAN.md` and `testautomation/<slug>/generated`, unless the mode is `off`.
- **W-100-06** · `repair` · medium — Ruling P5: the ceiling of four workers is a constant, the ruling says "both configurable"
  - Places in this feature: `specs/110-config-and-terms/spec.md:146`; `specs/110-config-and-terms/contracts/config-keys.tsv` (one new line, owner 142, widening)
  - Rule: State the key of the ceiling of workers (default 4) that feature 100 adds; a value of `loop.parallel.workers` above it is the configuration error.
- **W-100-23** · `queue` · medium — Does "user config" in rulings 34 and P2 mean the user configuration only?
  - Places in this feature: `specs/110-config-and-terms/spec.md:519` (F110-FR-019), `:188` (layers `F E U` of `sandbox.level`)
  - Rule: proceed on the recommended answer: for ruling P2, the key `loop.parallel.allow_detect` is accepted from user configuration only; change the place only when the orchestrator has queued the question
- **W-X-05** · `repair` · medium — Stale counts in the specs: features, register rows, requirements, profile rows, keys
  - Places in this feature: `specs/110-config-and-terms/plan.md:37` ("43 profile rows" and "about 200 keys": 129 and 253); `specs/110-config-and-terms/spec.md:67` (drop the clause "row 34 of §X.7 names the profile": row 34 is the audience)
  - Rule: Write the count that holds today, or name the register without a count.
  - depends on: W-ORC-03, W-ORC-01, W-ORC-02
- **W-X-07** · `repair` · medium — Plans hold statements that the repository has overtaken (owners and layers of the graph, register rows "to be added", names "to be added" to annex B)
  - Places in this feature: `specs/110-config-and-terms/plan.md:31` — `@specstride/config` is "L1", not "L6-adjacent"
  - Rule: State the present state of the package graph, the register and annex B.
- **W-X-11** · `repair` · medium — Sentences and contract files that say a profile row is "needed", "requested", "proposed" or "to be added", or name it by a label P-n
  - Places in this feature: `specs/110-config-and-terms/spec.md:142`, `:164`, `:167`, `:168`, `:199`, `:201`, `:202`, `:214`, `:215`, `:227`, `:239`, `:246` to `:248`, `:254`, `:257`, `:259` to `:261`, `:271`, `:660`, `:665`, `:667` (`:667` says `attempt.tier_bump_after` needs no row: it is row 128)
  - Rule: Write "row n of annex X §X.7" with the number; in contract files set `row` and the status "confirmed".
  - depends on: W-X-03
- **W-X-12** · `repair` · medium — Tables of closed sets and sentences written before the amendments to annex X §X.6
  - Places in this feature: `specs/110-config-and-terms/spec.md:677`, `:681`-`:683`
  - Rule: Write the row number of annex X §X.6 in place of "new" or "none yet".
  - depends on: W-100-02
- **W-X-14** · `repair` · medium — The Constitution Check is not in the form of the plan template, or a row gives a reason that does not bear on its principle
  - Places in this feature: `specs/110-config-and-terms/plan.md:41` — name v3.0.0
  - Rule: Bring the Constitution Check to the form of the plan template, as written in the place.
- **W-X-22** · `repair` · medium — Owners do not name their threats of annex X §X.9 with the control (F100-FR-216)
  - Places in this feature: T-33, T-34
  - Rule: Add a table "Threats" to `spec.md`: threat id and the requirement that is its control.
  - depends on: W-100-17
- **W-X-27** · `repair` · medium — One schema validator and one YAML parser: plans leave the choice open or name the validator as their own dependency
  - Places in this feature: `specs/110-config-and-terms/plan.md:23`; `specs/110-config-and-terms/research.md:24` — "the JSON Schema validator that feature 100 chose; one YAML parser, named here, pure JavaScript, MIT-compatible, used in a mode that constructs no code"; one task that pins it and records the licence, as T005 of feature 100 does
  - Rule: Refer to the validator that feature 100 chose and to the YAML parser that feature 110 names.
- **W-123-04** · `repair` · low — `NO_COLOR` is read in two ways, and four variables of the platform are in no alias table
  - Places in this feature: `specs/110-config-and-terms/spec.md` §K.8 — list `NO_COLOR`, `FORCE_COLOR`, `TERM`, `COLORTERM` as variables of the platform that reach no key
  - Rule: State that the reading of `NO_COLOR` is the baseline's, with the behaviour item.
- **W-X-30** · `repair` · low — Absolute paths of the owner's machine in task text and research
  - Places in this feature: `specs/110-config-and-terms/tasks.md:28`
  - Rule: Write "the Specstride baseline at `9cab15d`" and "the Lisa baseline at `363e6a3`" without a path.
- **W-X-36** · `accept` · low — Literals of a contract or of the baseline that keep a retired word
  - Places in this feature: `specs/110-config-and-terms/spec.md:155` — the key `harnesses.<id>.tiers`
  - Rule: No change to the literal.

### Feature 111 — 111-event-schema-and-projection

#### W-111-01 · `repair` · high — The result values of `microloop.unit` are not the members of closed set 136

- Findings merged: B-8.2d-001
- Files and lines:
  - Feature 111: `specs/111-event-schema-and-projection/spec.md:144` (F111-FR-008: `keep`, `repair`, `escalate`)
- Change: Write "the result (`kept`, `repair`, `unresolved`, row 136 of annex X §X.6)". `keep` is a directive of row 57, and `escalate` is in no set.
- Side that changes: feature 111. Authority: row 136 (`specs/100-specstride/annexes/X-cross-layer.md:307`, owner 115; `specs/115-micro-loop-layer/spec.md:726`)
- depends on: none

#### W-111-02 · `repair` · high — Requirements demand events for which the catalogue has no type; the writer drops an event without one

- Findings merged: B-8.2d-006
- Files and lines:
  - Feature 102: `specs/102-run-control/spec.md:262` — an accepted change of a source: name the type
  - Feature 111: `specs/111-event-schema-and-projection/spec.md` (F111-FR-001, F111-FR-020), `specs/111-event-schema-and-projection/data-model.md`, `specs/111-event-schema-and-projection/contracts/event-catalogue.tsv` — add the types
  - Feature 115: `specs/115-micro-loop-layer/spec.md:263`, `:268`, `:391`, `:410` — a checkpoint accepted, refused or removed; an exclusion of a command; the tripwire raised and cleared; the strategy selected with manifest hashes and fallback reason: name the types
  - Feature 127: `specs/127-quota-budgets-and-pause/spec.md:313` — a fallback entry skipped: name the type
  - Feature 144: `specs/144-compatibility-projection/contracts/projection-table.tsv` — one row per new type that projects to nothing
  - Feature 147: `specs/147-terms-gate/spec.md:133` — a fallback entry skipped by the terms gate; a use of `distribution.termsOverride`: name the types
  - Feature 148: `specs/148-check-runner/spec.md:253` — the lowering of parallelism: name the type
- Change: Add the types to the catalogue (B-8.2d gives as examples `checkpoint.accepted`, `checkpoint.refused`, `checkpoint.removed`, `check.excluded`, `tripwire.raised`, `tripwire.cleared`, `strategy.selected`, `source.change_accepted`, `fallback.skipped`, `terms.override_used`, `check.parallelism_lowered`), each with a row in the projection table of 144 that projects to nothing; or state in each requirement which existing type and `kind` carries the fact.
- Side that changes: feature 111 adds; feature 144 adds the rows; the features that demand the event name the type
- depends on: none

#### W-111-03 · `repair` · high — `parallel.admission` and `parallel.integration` lack the fields that F142-FR-025 requires

- Findings merged: B-8.2d-007
- Files and lines:
  - Feature 111: `specs/111-event-schema-and-projection/contracts/event-catalogue.tsv:105`, `:110`; `specs/111-event-schema-and-projection/data-model.md`
  - Feature 142: `specs/142-parallel-units/spec.md:295` (F142-FR-025) — no change; it is the requirement that the fields serve
- Change: Add `taskId` to `parallel.admission`, and `step`, `pathCount` to `parallel.integration`.
- Side that changes: feature 111
- depends on: none

#### W-111-04 · `repair` · medium — The projection renders fields of `tool.call` and `pass.halted` that the catalogue types do not have

- Findings merged: B-8.2d-008
- Files and lines:
  - Feature 111: `specs/111-event-schema-and-projection/contracts/event-catalogue.tsv:56` (`tool.call`), `:45` (`pass.halted`)
  - Feature 144: `specs/144-compatibility-projection/contracts/projection-table.tsv:64`, `:53` — settle `yield` against `yields` in the row of `pass.halted`
- Change: Add `argsRef`, `resultRef`, `redacted`, `truncated`, `originalBytes`, `retainedBytes` to `tool.call` (as `stream.text` has `textRef` and the four marks); use one field name, `yields`, in the type and in the row of `pass.halted`.
- Side that changes: feature 111 adds the fields; feature 144 changes one row
- depends on: none

#### W-111-05 · `repair` · medium — The causes of `pass.ended` and `attempt.ended` and the outcome of `phase.ended` are no closed sets; the `data` field `cause` has the name of an envelope field

- Findings merged: B-8.2d-013
- Files and lines:
  - Feature 111: `specs/111-event-schema-and-projection/spec.md:141` (F111-FR-007), `:135` (F111-FR-005), `:408`
  - Feature 127: `specs/127-quota-budgets-and-pause/spec.md:261` — writes `quota_pause`, a member of the new set
  - Feature 144: `specs/144-compatibility-projection/contracts/projection-table.tsv` — the rows select by `hard_cap` and `no_progress`; use the renamed field
- Change: List the three sets as closed sets in 111 and report them to the orchestrator for §X.6; rename the `data` field (B-8.2d gives `endCause` as an example); state in F111-FR-005 how row 96 (`crash`, `host_exit`, `operator_stop`, owner 111) relates to row 5 (`normal`, `crash`, `owner-lost`, owner 101).
- Side that changes: feature 111; then feature 100 adds the rows
- depends on: none

#### W-111-06 · `repair` · medium — F111-FR-016 lists five free-text fields; the catalogue holds more

- Findings merged: B-8.2d-018
- Files and lines:
  - Feature 111: `specs/111-event-schema-and-projection/spec.md:174` (F111-FR-016: `message`, `evidence`, `target`, `question`, `detail`); `specs/111-event-schema-and-projection/data-model.md`
- Change: Mark every free-text field in `data-model.md` (also `reason`, `title`, `error`, `summary`, `cmd`, `argv`, `why`, `needs`, `options`) and let F111-FR-016 refer to the mark.
- Side that changes: feature 111
- depends on: none

#### W-111-07 · `repair` · medium — Text of the compatibility projection remained in the plan after the split to feature 144

- Findings merged: B-8.3b-006, B-8.2f-012
- Files and lines:
  - Feature 111: `specs/111-event-schema-and-projection/plan.md:58` (row VIII cites F111-FR-044, which moved to F144-FR-006), `:75` (row XVIII: "the projection is compared through N-12 to N-14"), `:108-109` (two lines of the projection package with no parent); `specs/111-event-schema-and-projection/analyze-report.md:10` says this was repaired
- Change: Row VIII: write "(annex C §C.10; the compatibility projection)", the contract of feature 100, in place of F111-FR-044. Row XVIII: drop the clause on the projection. Remove `plan.md:108-109`.
- Side that changes: feature 111 (plan)
- depends on: none

#### W-111-08 · `repair` · low — F111-FR-028 ("raw capture disabled by default") stands five lines from F111-FR-032 with the opposite default and no sentence that tells them apart

- Findings merged: B-8.4b-009
- Files and lines:
  - Feature 111: `specs/111-event-schema-and-projection/spec.md:227` (F111-FR-028) against `:243` (F111-FR-032)
- Change: Add one sentence to F111-FR-028: the policy governs raw content retained in the control plane and is independent of `telemetry.content`.
- Side that changes: feature 111. Ruling 43 is not contradicted
- depends on: none

#### W-111-09 · `repair` · low — `workerId` "in `data` only" against `workerId` and `wseq` on "every event of a worker"

- Findings merged: B-8.2d-021
- Files and lines:
  - Feature 111: `specs/111-event-schema-and-projection/spec.md:170` (F111-FR-015)
  - Feature 142: `specs/142-parallel-units/spec.md:295` (F142-FR-025) — no change
- Change: Add to F111-FR-015: the seven `parallel.*` events are events of the main line about a worker.
- Side that changes: feature 111
- depends on: none

#### Items owned elsewhere that change files of feature 111

- **W-X-01** · `repair` · high — Plans and task lists name packages that the package graph of feature 100 does not hold
  - Places in this feature: `specs/111-event-schema-and-projection/plan.md:24`, `:32`, `:104`, `:114`; `specs/111-event-schema-and-projection/tasks.md:21` and every path `packages/events/` (43 paths) — the redactor in `packages/kernel/src/redactor/` (the graph: `@specstride/kernel`, owner "111 (redactor)"); catalogue, writer, ingress and dispatcher in `packages/observability/` (L1, owners 111, 128, 144). At `plan.md:114` drop "the writer and the redactor are core". Plans 117 (`specs/117-critic-grounding-and-prompt/plan.md:40`) and 119 (`specs/119-front-door-and-presenter/plan.md:15`) already import the redactor from the kernel and do not change
  - Rule: Use the package that the package graph of feature 100 names; change plan and task paths.
  - depends on: W-100-25
- **W-X-02** · `repair` · high — Conformance suites and samples of extension points are placed outside the published test kit, or twice
  - Places in this feature: `specs/111-event-schema-and-projection/plan.md:111` (against its own `:28`); `specs/111-event-schema-and-projection/tasks.md:95`, `:100` (`tests/conformance/eventsink/`, EP-08)
  - Rule: Suite in `packages/testkit/src/conformance/EP-nn/`, sample in `packages/testkit/src/samples/EP-nn/`.
- **W-100-25** · `queue` · medium — May a core package import `node:fs`?
  - Places in this feature: `specs/111-event-schema-and-projection/plan.md:24`
  - Rule: proceed on the recommended answer: a core package does not import `node:fs`; it uses the kernel and the ports of the edge packages
- **W-X-05** · `repair` · medium — Stale counts in the specs: features, register rows, requirements, profile rows, keys
  - Places in this feature: `specs/111-event-schema-and-projection/spec.md:431` (94 rows)
  - Rule: Write the count that holds today, or name the register without a count.
  - depends on: W-ORC-03, W-ORC-01, W-ORC-02
- **W-X-08** · `repair` · medium — Row XVIII of the Constitution Check lists fewer register rows than the `divergence:` fields of the spec
  - Places in this feature: `specs/111-event-schema-and-projection/plan.md:75` — missing: DV-006, DV-050, DV-069, DV-079, DV-082, DV-088
  - Rule: In each row XVIII replace the list by "the rows in the `divergence:` fields of `spec.md`", or complete the list.
- **W-X-09** · `repair` · medium — Principle XVII: no task records the macOS result or a skip with its reason; the row is marked N/A or gives a reason that is not about tests
  - Places in this feature: `specs/111-event-schema-and-projection/plan.md:30`, `:70`; `specs/111-event-schema-and-projection/tasks.md`
  - Rule: Add the macOS and skip task to `tasks.md`; answer row XVII as a pass with its reason.
- **W-X-11** · `repair` · medium — Sentences and contract files that say a profile row is "needed", "requested", "proposed" or "to be added", or name it by a label P-n
  - Places in this feature: `specs/111-event-schema-and-projection/spec.md:224`, `:260`, `:439`
  - Rule: Write "row n of annex X §X.7" with the number; in contract files set `row` and the status "confirmed".
  - depends on: W-X-03
- **W-X-21** · `repair` · medium — `proves:` holds a test name, a phrase or nothing in place of an origin or a requirement id
  - Places in this feature: `specs/111-event-schema-and-projection/tasks.md:86` (empty: write `proves: F111-SC-001`)
  - Rule: Write in each the requirement id whose `test:` line names the test.
- **W-110-12** · `repair` · low — One rule under two names: "tier bump" and "model-tier bump"
  - Places in this feature: bare "tier bump" (the report names the feature, not the line)
  - Rule: Write "model-tier bump".
- **W-X-34** · `accept` · low — Analyze reports cite old ids of the splits in sentences about the split
  - Places in this feature: `specs/111-event-schema-and-projection/analyze-report.md:10`
  - Rule: No change.

### Feature 112 — 112-doctor

#### W-112-01 · `repair` · low — The body of the doctor skill is 800 tokens in the plan of 113 and "about 700 tokens" in 112

- Findings merged: B-8.4b-007
- Files and lines:
  - Feature 112: `specs/112-doctor/spec.md:395`; F112-FR-024 (`:257`) stays
  - Feature 113: `specs/113-host-claude-code/plan.md:115` — no change: 800 tokens (2,240 bytes)
- Change: Write the number of the plan of 113 in `specs/112-doctor/spec.md:395`; feature 113 owns the skill body. Both numbers keep the doctor inside 1,500 tokens (ruling 65).
- Side that changes: feature 112
- depends on: none

#### W-112-02 · `repair` · low — The table of profile rows has six columns in its heading and five in the separator

- Findings merged: B-8.2e-019
- Files and lines:
  - Feature 112: `specs/112-doctor/spec.md:312` to `:318`
- Change: Six columns in the separator; "61" in line 317 (`doctor.probeOutputBytes`); "—" in the row column of line 318, which holds the register row.
- Side that changes: feature 112
- depends on: none

#### Items owned elsewhere that change files of feature 112

- **W-125-01** · `repair` · high — Three features give three triggers for the one warning, and F125-FR-026 opens with a MUST that the rest of the requirement denies
  - Places in this feature: `specs/112-doctor/spec.md:226` (F112-FR-015) — cite F100-FR-024 for the trigger; drop "when the model tier is shared"
  - Rule: The warning is raised when both roles resolve to the same model (F100-FR-024); cite it, state no other trigger.
- **W-X-02** · `repair` · high — Conformance suites and samples of extension points are placed outside the published test kit, or twice
  - Places in this feature: `specs/112-doctor/plan.md:108` (against its own `:28`); `specs/112-doctor/tasks.md:127`, `:129` (`tests/conformance/doctor/`, EP-14)
  - Rule: Suite in `packages/testkit/src/conformance/EP-nn/`, sample in `packages/testkit/src/samples/EP-nn/`.
- **W-X-05** · `repair` · medium — Stale counts in the specs: features, register rows, requirements, profile rows, keys
  - Places in this feature: `specs/112-doctor/spec.md:426` (97 rows)
  - Rule: Write the count that holds today, or name the register without a count.
  - depends on: W-ORC-03, W-ORC-01, W-ORC-02
- **W-X-11** · `repair` · medium — Sentences and contract files that say a profile row is "needed", "requested", "proposed" or "to be added", or name it by a label P-n
  - Places in this feature: `specs/112-doctor/spec.md:433` (the doctor's keys are row 61)
  - Rule: Write "row n of annex X §X.7" with the number; in contract files set `row` and the status "confirmed".
  - depends on: W-X-03
- **W-X-13** · `repair` · medium — `CQ-pending-<n>` placeholders remain, and one row carries the number of another question
  - Places in this feature: `specs/112-doctor/spec.md:432` — the row is labelled CQ-071, which is another question; write "annex X §X.6 row 134" (`specs/100-specstride/annexes/X-cross-layer.md:305`). `:433` — `CQ-pending-3` becomes "annex X §X.7 row 61" (`specs/100-specstride/annexes/X-cross-layer.md:525`). `:434` — `CQ-pending-4` becomes CQ-071. `:435` — `CQ-pending-5` becomes "CQ-108, CQ-150"
  - Rule: Replace the placeholder as written in the place.
  - depends on: W-141-01, W-141-02
- **W-X-22** · `repair` · medium — Owners do not name their threats of annex X §X.9 with the control (F100-FR-216)
  - Places in this feature: T-14
  - Rule: Add a table "Threats" to `spec.md`: threat id and the requirement that is its control.
  - depends on: W-100-17
- **W-X-27** · `repair` · medium — One schema validator and one YAML parser: plans leave the choice open or name the validator as their own dependency
  - Places in this feature: `specs/112-doctor/plan.md:24` — "the YAML parser that feature 110 chose"
  - Rule: Refer to the validator that feature 100 chose and to the YAML parser that feature 110 names.
- **W-X-31** · `repair` · low — "Gate" written for a check of the build, and bare "gate" for the verification gate
  - Places in this feature: `specs/112-doctor/spec.md:411`, `:421` — "golden output check"
  - Rule: Write "check" for a check of the build; write "verification gate" in full.

### Feature 113 — 113-host-claude-code

#### W-113-01 · `queue` · critical — The trigger suite gates every pull request and calls a model; Principle XII forbids a CI job that calls a paid or external model API (proposed question Q-02)

- Findings merged: B-8.3b-001
- Files and lines:
  - Feature 113: `specs/113-host-claude-code/plan.md:19`, `:51` (row XII), `:121`; `specs/113-host-claude-code/spec.md:314`, `:322` (F113-FR-038), `:340` (F113-FR-040); `specs/113-host-claude-code/tasks.md:74`, `:77`, `:83` (T027, T029, T031)
- Question: The brief of feature 113 asks for a skill-trigger suite with three runs at a pinned model on every pull request, and for a nightly and a weekly paid run (`docs/ecosystem/feature-briefs.md:5309`). Principle XII (NON-NEGOTIABLE) says no test and no CI job calls a paid or external model API, and model ids are configuration. Both were approved. Which holds?
- Sources: Constitution v3.0.0, Principle XII and Governance; `docs/ecosystem/feature-briefs.md:5309`; `docs/ecosystem/research/R3v-host-facts-verification.md:114` (each run of `claude plugin eval` is a full child of the host on the consumer's credential); `APPROVAL.md`, "Approved without a separate question" and "Not approved: any paid probe"
- Recommended answer (compiler of this worklist; B-8.3b offers this and the deviation as equal options and says the orchestrator has to choose): Principle XII holds: the trigger suite, the nightly smoke and the weekly report leave CI and become tasks run by a person, paid and logged, as feature 115 does for its experiments (`specs/115-micro-loop-layer/tasks.md:22`); F113-FR-038 changes from "MUST gate each pull request" to a release check; the model comes from configuration
- If answered otherwise: The suite stays in CI: `plan.md` gains a Complexity Tracking table with the deviation from XII and its justification, row XII is marked as a deviation, T027, T029 and T031 are marked as paid, and the model comes from configuration
- Change on the recommended answer: F113-FR-038 and F113-FR-040 as in the recommended answer; row XII of the plan states what runs where; T027, T029 and T031 are marked as paid and leave the CI phase.
- depends on: W-X-14 (The Constitution Check is not in the form of the plan template, or a row gives a reason that does not bear on its principle)

#### W-113-02 · `repair` · medium — Two markers are kept in the host's plugin data directory, which is none of the three roots and has no logical name

- Findings merged: B-8.3b-011
- Files and lines:
  - Feature 113: `specs/113-host-claude-code/plan.md:17`, `:118`; `specs/113-host-claude-code/spec.md:218`; `specs/113-host-claude-code/data-model.md:9`
- Change: State in row I of `plan.md` that the two markers (last injected state, notice shown once) are state of the host, that no run and no command of the product reads them, and that a missing or damaged marker only causes one more line to be printed.
- Side that changes: feature 113 (plan)
- Note: The other repair that B-8.3b offers is a logical name for host-scoped markers in annex B §B.5, asked for by a row in `docs/ecosystem/STAGE-B-F100-AMENDMENTS.md`. The statement is the narrower one: it changes no contract.
- depends on: none

#### W-113-03 · `repair` · low — "Hook" is written bare

- Findings merged: B-8.2a-014
- Files and lines:
  - Feature 113: `specs/113-host-claude-code/spec.md:76`, `:127`, `:131`, `:242`, `:247`, `:251`, `:259` and 14 more (21 bare uses, 5 qualified)
- Change: Replace by "host hook". No change of meaning: in feature 113 every use means a host hook.
- Side that changes: feature 113. Authority: glossary row 32
- depends on: none

#### Items owned elsewhere that change files of feature 113

- **W-X-02** · `repair` · high — Conformance suites and samples of extension points are placed outside the published test kit, or twice
  - Places in this feature: `specs/113-host-claude-code/plan.md:105` (the host suite in its own package)
  - Rule: Suite in `packages/testkit/src/conformance/EP-nn/`, sample in `packages/testkit/src/samples/EP-nn/`.
- **W-119-01** · `repair` · medium — No plan names the bundler, and no task builds the bundle or tests a plain install of the published package
  - Places in this feature: the second feature to which `specs/100-specstride/plan.md:218` assigns the bundling; cite the task of 119
  - Rule: Cite the bundling task of feature 119.
  - depends on: W-X-09
- **W-X-14** · `repair` · medium — The Constitution Check is not in the form of the plan template, or a row gives a reason that does not bear on its principle
  - Places in this feature: `specs/113-host-claude-code/plan.md:67` — add the section Complexity Tracking; `:33` — name v3.0.0
  - Rule: Bring the Constitution Check to the form of the plan template, as written in the place.
- **W-X-16** · `repair` · medium — The terms gate, its file and the audience are said to belong to feature 110; since the split they belong to 147
  - Places in this feature: `specs/113-host-claude-code/spec.md:371`
  - Rule: Replace 110 by 147 where the terms gate, the terms file or the audience is meant (`specs/147-terms-gate/spec.md:17`); keep 110 for the secret resolvers.
- **W-X-22** · `repair` · medium — Owners do not name their threats of annex X §X.9 with the control (F100-FR-216)
  - Places in this feature: T-11, T-43, T-44, T-45; today T-09, T-12, T-43 and T-46 are named only in `specs/113-host-claude-code/research.md:17`
  - Rule: Add a table "Threats" to `spec.md`: threat id and the requirement that is its control.
  - depends on: W-100-17
- **W-X-25** · `repair` · medium — Logical names of annex B §B.5 that no feature cites
  - Places in this feature: `specs/113-host-claude-code/spec.md:242` — `workspace:current:status-line` (reader: the shell shim of the host hook)
  - Rule: Name the logical name of annex B §B.5 in the requirement that writes or reads the state.
- **W-112-01** · `repair` · low — The body of the doctor skill is 800 tokens in the plan of 113 and "about 700 tokens" in 112
  - Places in this feature: `specs/113-host-claude-code/plan.md:115` — no change: 800 tokens (2,240 bytes)
  - Rule: No change in this feature.
- **W-X-31** · `repair` · low — "Gate" written for a check of the build, and bare "gate" for the verification gate
  - Places in this feature: `specs/113-host-claude-code/spec.md:310`, `:339`, `:341`, `:379` — "seven CI checks", "the static size check", "the reference closure check"
  - Rule: Write "check" for a check of the build; write "verification gate" in full.
- **W-X-32** · `repair` · low — A runtime is named in a requirement outside `## Constraints`
  - Places in this feature: `specs/113-host-claude-code/spec.md:238` (F113-FR-020, "a Node start") — "a start of the runtime platform"
  - Rule: Leave the name of the runtime in `## Constraints`.

### Feature 115 — 115-micro-loop-layer

#### W-115-01 · `repair` · medium — One piece of state under two names: `phase:<N>:tasks-at-launch` and `run:<runId>:task-list`

- Findings merged: B-8.2c-005
- Files and lines:
  - Feature 104: `specs/104-spec-input/spec.md` (F104-FR-026) — name `run:<runId>:task-list`
  - Feature 115: `specs/115-micro-loop-layer/spec.md:276` (F115-FR-012), `:679`, `:827`, `:861`; `specs/115-micro-loop-layer/plan.md:42`, `:149` (rename the file)
- Change: Name `run:<runId>:task-list` (one per run, written by the engine at launch, read by the engine and the loop layers) and state that the layer reads it; drop the request for `phase:<N>:tasks-at-launch`.
- Side that changes: features 115 and 104. Authority: annex B §B.5 (`specs/100-specstride/annexes/B-state.md:254`)
- Note: CQ-181 is closed by an item of section 4.
- depends on: none

#### W-115-02 · `queue` · medium — Does ruling 49 allow an escalation rung that is the critic's model at a higher effort? (proposed question Q-09)

- Findings merged: B-8.4b-001
- Files and lines:
  - Feature 100: `specs/100-specstride/annexes/D-pass-loop.md:282` (F100-FR-130)
  - Feature 115: `specs/115-micro-loop-layer/spec.md:374` (F115-FR-034), `:454` and `:491` (signal `targetIsCriticModel`, row `esc.critic-collision`)
  - Feature 124: `specs/124-harness-discovery-and-roles/spec.md:279` (F124-FR-045) — no change; it carries ruling 49 for the choice of the critic
  - Feature 125: `specs/125-adapter-claude/spec.md:341` (F125-FR-026) — no change from this item
- Question: Ruling 46 says escalation never lands on the critic's model. Ruling 49 says a higher effort on the critic's model is not a collision and is allowed with the same-model warning. The escalation rule skips a rung on the critic's model whatever the effort. Does ruling 49 allow an escalation rung that is the critic's model at a higher effort?
- Sources: Rulings 46 and 49; DP-052 (R25 open question 4; R23v V-13, O-9), whose stated consequence of the other answer is "Escalation is skipped in most Claude-only runs"; F100-FR-130; F115-FR-034; F124-FR-045; the table "Where rulings meet" of `feature-briefs.md` D.8, which does not hold the point
- Recommended answer (B-8.4b): Yes, with the same-model warning
- If answered otherwise: One sentence in F115-FR-034 and in F100-FR-130 says that a rung on the critic's model is skipped whatever the effort, citing rulings 46 and 49
- Change on the recommended answer: In F115-FR-034 and in the signal table define `targetIsCriticModel` as equal in model and in effort; add the warning to the choice `next-tier` for a rung that shares the model; add the same sentence to F100-FR-130.
- Generated contract files that change: `contracts/requirements.json`, `contracts/data/loop-layer-tables.json`, `contracts/annex-tables/D-pass-loop.json`
- depends on: none

#### W-115-03 · `repair` · low — The coverage summary of the analyze report lists three requirements that moved to 116

- Findings merged: B-8.2f-015 (part)
- Files and lines:
  - Feature 115: `specs/115-micro-loop-layer/analyze-report.md:61`, `:62`, `:63` (`F115-FR-061`, `F115-FR-049`, `F115-FR-047`; they are `F116-FR-019`, `F116-FR-007`, `F116-FR-005`)
- Change: Rerun `speckit-analyze` on 115 after the other repairs of the feature, or replace the three rows.
- Side that changes: feature 115
- depends on: none

#### Items owned elsewhere that change files of feature 115

- **W-111-02** · `repair` · high — Requirements demand events for which the catalogue has no type; the writer drops an event without one
  - Places in this feature: `specs/115-micro-loop-layer/spec.md:263`, `:268`, `:391`, `:410` — a checkpoint accepted, refused or removed; an exclusion of a command; the tripwire raised and cleared; the strategy selected with manifest hashes and fallback reason: name the types
  - Rule: Name in the requirement the catalogue type that carries the event.
- **W-X-01** · `repair` · high — Plans and task lists name packages that the package graph of feature 100 does not hold
  - Places in this feature: `specs/115-micro-loop-layer/plan.md:48`, `:146`, `:166` (`@specstride/layer-micro-io`) — use the atomic write of `@specstride/kernel` and the ports of `@specstride/integrity`, which feature 116 plans (`specs/116-check-integrity-and-unit-evidence/plan.md:38`); F100-FR-234 names three edge packages in Wave 1 and no fourth
  - Rule: Use the package that the package graph of feature 100 names; change plan and task paths.
  - depends on: W-100-25
- **W-X-02** · `repair` · high — Conformance suites and samples of extension points are placed outside the published test kit, or twice
  - Places in this feature: `specs/115-micro-loop-layer/plan.md:153` (`packages/testkit/conformance/`, without `src/`)
  - Rule: Suite in `packages/testkit/src/conformance/EP-nn/`, sample in `packages/testkit/src/samples/EP-nn/`.
- **W-X-04** · `repair` · high — Old spellings of config keys survive in contract files of the features
  - Places in this feature: `specs/115-micro-loop-layer/contracts/parity-rows.json:52`, `:60`, `:68`, `:76`, `:84`, `:92`, `:100`, `:108`, `:116` — the nine `loop.micro.caps.*` names with underscores become the lowerCamelCase names of `config-keys.tsv` (`escalationsPerTask` and so on)
  - Rule: Write the spelling of `config-keys.tsv` of feature 110.
- **W-100-14** · `repair` · medium — "Iteration" as a counted unit, and four names for one limit
  - Places in this feature: `specs/115-micro-loop-layer/spec.md:75`, `:334`; "iteration limit" (lines not given in the report)
  - Rule: Write "pass limit" and "pass count"; "iteration" survives only in the literals `MAX_ITER`, `iter_*` and `giveIterationBack`.
- **W-100-25** · `queue` · medium — May a core package import `node:fs`?
  - Places in this feature: `specs/115-micro-loop-layer/plan.md:164-166`
  - Rule: proceed on the recommended answer: a core package does not import `node:fs`; it uses the kernel and the ports of the edge packages
- **W-X-06** · `repair` · medium — "Run" and "engine invocation" written for one engine start
  - Places in this feature: `specs/115-micro-loop-layer/spec.md:410` (F115-FR-041) — "recorded as an event in the next engine start"
  - Rule: Write "engine start" where one start of the engine is meant (ruling 24).
- **W-X-08** · `repair` · medium — Row XVIII of the Constitution Check lists fewer register rows than the `divergence:` fields of the spec
  - Places in this feature: `specs/115-micro-loop-layer/plan.md:92` — missing: DV-011, DV-079, DV-080, DV-085
  - Rule: In each row XVIII replace the list by "the rows in the `divergence:` fields of `spec.md`", or complete the list.
- **W-X-11** · `repair` · medium — Sentences and contract files that say a profile row is "needed", "requested", "proposed" or "to be added", or name it by a label P-n
  - Places in this feature: `specs/115-micro-loop-layer/spec.md:317`, `:321`, `:370`; entries without a row in `specs/115-micro-loop-layer/contracts/parity-rows.json`
  - Rule: Write "row n of annex X §X.7" with the number; in contract files set `row` and the status "confirmed".
  - depends on: W-X-03
- **W-X-12** · `repair` · medium — Tables of closed sets and sentences written before the amendments to annex X §X.6
  - Places in this feature: `specs/115-micro-loop-layer/spec.md:726`-`:731` (rows 136, 137, 138, 140, 141)
  - Rule: Write the row number of annex X §X.6 in place of "new" or "none yet".
  - depends on: W-100-02
- **W-X-14** · `repair` · medium — The Constitution Check is not in the form of the plan template, or a row gives a reason that does not bear on its principle
  - Places in this feature: `specs/115-micro-loop-layer/plan.md:77` — row X: "N/A: no harness adapter; the pins of executables are Principle III"
  - Rule: Bring the Constitution Check to the form of the plan template, as written in the place.
- **W-X-18** · `repair` · medium — The section "Extension points" says `consumes`, and no requirement has an `ep:` line for the point
  - Places in this feature: `specs/115-micro-loop-layer/spec.md:643` (EP-14)
  - Rule: Add the line `- ep: EP-nn <id> (consumes)` to the requirement that the row names, or delete the row where no requirement uses the point.
- **W-X-24** · `repair` · medium — Catalogue types that no feature says it emits
  - Places in this feature: `integrity.noted`, with 116
  - Rule: Name the event type in the requirement that emits it.
- **W-100-16** · `repair` · low — The form of `$id` of a schema file is stated nowhere; the features use four other forms
  - Places in this feature: `specs/115-micro-loop-layer/contracts/schemas/checkpoint.schema.json:3`
  - Rule: Write `$id` as `urn:specstride:schema:<schema id>`.
- **W-110-11** · `queue` · low — The rule of unit suffixes is applied unevenly (`Minutes`, `Days`, `Percent`)
  - Places in this feature: `specs/115-micro-loop-layer/spec.md:705` to `:707` (`loop.micro.caps.proposalMinutes`, `.unitMinutes`, `.checkMinutes`)
  - Rule: proceed on the recommended answer: rename the three keys to `proposalMin`, `unitMin`, `checkMin`
- **W-110-12** · `repair` · low — One rule under two names: "tier bump" and "model-tier bump"
  - Places in this feature: bare "tier bump" (the report names the feature, not the line)
  - Rule: Write "model-tier bump".
- **W-X-34** · `accept` · low — Analyze reports cite old ids of the splits in sentences about the split
  - Places in this feature: `specs/115-micro-loop-layer/analyze-report.md:20`
  - Rule: No change.

### Feature 116 — 116-check-integrity-and-unit-evidence

#### W-116-01 · `repair` · medium — The plan says protected files are always hashed by content, and that class A of ignored paths is hashed over names, sizes and modification times

- Findings merged: B-8.3b-010
- Files and lines:
  - Feature 116: `specs/116-check-integrity-and-unit-evidence/plan.md:40`, `:147`, `:148`; `specs/116-check-integrity-and-unit-evidence/research.md:28-30`; `specs/116-check-integrity-and-unit-evidence/spec.md:145`
- Change: `plan.md:40` and `:147`: state the exception. `plan.md:148`: hash the content of the files that the pinned executables load, where the profile names them; or record the residual risk in the row of Principle III and in the threat row that owns it (a change of content in an ignored directory from which a check executes, with size and time kept, is not detected).
- Side that changes: feature 116 (plan). Authority: Principle III
- depends on: none

#### Items owned elsewhere that change files of feature 116

- **W-100-02** · `repair` · high — Owners that were not moved with the split 115 → 116 (EP-16, the fact block, two schema ids, closed sets 142 and 143, the package `@specstride/integrity`)
  - Places in this feature: `specs/116-check-integrity-and-unit-evidence/contracts/README.md:22-23` — replace "new schema ids, reported" by the citation of annex B §B.20; `:15-16` stay
  - Rule: Write 116 for the owner; feature 100 is corrected first.
- **W-X-02** · `repair` · high — Conformance suites and samples of extension points are placed outside the published test kit, or twice
  - Places in this feature: `specs/116-check-integrity-and-unit-evidence/plan.md:132` (the same path without `src/`)
  - Rule: Suite in `packages/testkit/src/conformance/EP-nn/`, sample in `packages/testkit/src/samples/EP-nn/`.
- **W-110-09** · `repair` · medium — Three options in user configuration have no key
  - Places in this feature: `specs/116-check-integrity-and-unit-evidence/spec.md:192` — toolchain profiles of the consumer "from user configuration only": name the key
  - Rule: Name the key and report it to feature 110.
- **W-148-01** · `repair` · medium — Two field lists for what is stored at `unit:<unitId>:check:<i>`
  - Places in this feature: `specs/116-check-integrity-and-unit-evidence/data-model.md:36-42` — no change; the stored record of the owner
  - Rule: State that the result of 148 is a returned value and that the stored record has the fields of `specstride.check-result/1` of feature 116; name the mapping `commandId` to `id` and `exitCode` to `exit`, or take one spelling in both.
  - depends on: W-100-02
- **W-X-12** · `repair` · medium — Tables of closed sets and sentences written before the amendments to annex X §X.6
  - Places in this feature: `specs/116-check-integrity-and-unit-evidence/spec.md:368` — remove the sentence that annex X "still names 115" for rows 27, 65, 66; `:375`, `:376` — rows 142 and 143
  - Rule: Write the row number of annex X §X.6 in place of "new" or "none yet".
  - depends on: W-100-02
- **W-X-14** · `repair` · medium — The Constitution Check is not in the form of the plan template, or a row gives a reason that does not bear on its principle
  - Places in this feature: `specs/116-check-integrity-and-unit-evidence/plan.md:67` — row X as in 115; `:50` — "The brief of feature 115, from which this feature was split, names"
  - Rule: Bring the Constitution Check to the form of the plan template, as written in the place.
- **W-X-18** · `repair` · medium — The section "Extension points" says `consumes`, and no requirement has an `ep:` line for the point
  - Places in this feature: `specs/116-check-integrity-and-unit-evidence/spec.md:318` (EP-03)
  - Rule: Add the line `- ep: EP-nn <id> (consumes)` to the requirement that the row names, or delete the row where no requirement uses the point.
- **W-X-24** · `repair` · medium — Catalogue types that no feature says it emits
  - Places in this feature: `integrity.noted` (read by 116), with 115
  - Rule: Name the event type in the requirement that emits it.
- **W-100-10** · `repair` · low — Feature 100 does not say where the schema file of an extension point lives (EP-16, `specstride.toolchain/1`)
  - Places in this feature: `specs/116-check-integrity-and-unit-evidence/contracts/schemas/toolchain-profile.schema.json:3` — no change; it is the file that feature 100 names
  - Rule: Name feature 116 as the place of the schema file of `specstride.toolchain/1` in §C.14.
  - depends on: W-100-02
- **W-100-16** · `repair` · low — The form of `$id` of a schema file is stated nowhere; the features use four other forms
  - Places in this feature: `specs/116-check-integrity-and-unit-evidence/contracts/schemas/*.schema.json:3`
  - Rule: Write `$id` as `urn:specstride:schema:<schema id>`.

### Feature 117 — 117-critic-grounding-and-prompt

No item of its own.

#### Items owned elsewhere that change files of feature 117

- **W-100-25** · `queue` · medium — May a core package import `node:fs`?
  - Places in this feature: `specs/117-critic-grounding-and-prompt/plan.md:154-157` — under the recommended answer the hiding (`packages/core/src/critic-input/hide/`) moves behind a port
  - Rule: proceed on the recommended answer: a core package does not import `node:fs`; it uses the kernel and the ports of the edge packages
- **W-X-05** · `repair` · medium — Stale counts in the specs: features, register rows, requirements, profile rows, keys
  - Places in this feature: `specs/117-critic-grounding-and-prompt/spec.md:571` (97 rows, DV-001 to DV-097)
  - Rule: Write the count that holds today, or name the register without a count.
  - depends on: W-ORC-03, W-ORC-01, W-ORC-02
- **W-X-07** · `repair` · medium — Plans hold statements that the repository has overtaken (owners and layers of the graph, register rows "to be added", names "to be added" to annex B)
  - Places in this feature: `specs/117-critic-grounding-and-prompt/plan.md:91`, `:180-185` — remove the warning and the table under Principle XVIII; write "Every check passes. Complexity Tracking is empty."; bring `specs/117-critic-grounding-and-prompt/research.md` D-6 and D-7 in line. DV-099 and DV-100 exist (`docs/ecosystem/consolidation.md:998`, `:999`), and Principle XVIII cannot be justified away
  - Rule: State the present state of the package graph, the register and annex B.
- **W-X-08** · `repair` · medium — Row XVIII of the Constitution Check lists fewer register rows than the `divergence:` fields of the spec
  - Places in this feature: `specs/117-critic-grounding-and-prompt/plan.md:91` — missing: DV-006, DV-007, DV-019, DV-027, DV-066, DV-095
  - Rule: In each row XVIII replace the list by "the rows in the `divergence:` fields of `spec.md`", or complete the list.
- **W-X-11** · `repair` · medium — Sentences and contract files that say a profile row is "needed", "requested", "proposed" or "to be added", or name it by a label P-n
  - Places in this feature: `specs/117-critic-grounding-and-prompt/spec.md:176`, `:183`, `:258`, `:302`, `:323` (labels P-1 to P-7: the rows are 52 to 58); entries without a row in `specs/117-critic-grounding-and-prompt/contracts/parity-rows.json`
  - Rule: Write "row n of annex X §X.7" with the number; in contract files set `row` and the status "confirmed".
  - depends on: W-X-03
- **W-X-14** · `repair` · medium — The Constitution Check is not in the form of the plan template, or a row gives a reason that does not bear on its principle
  - Places in this feature: `specs/117-critic-grounding-and-prompt/plan.md:91` — add the closing statement of the check
  - Rule: Bring the Constitution Check to the form of the plan template, as written in the place.
- **W-X-18** · `repair` · medium — The section "Extension points" says `consumes`, and no requirement has an `ep:` line for the point
  - Places in this feature: `specs/117-critic-grounding-and-prompt/spec.md:454-456` (EP-03, EP-04, EP-18)
  - Rule: Add the line `- ep: EP-nn <id> (consumes)` to the requirement that the row names, or delete the row where no requirement uses the point.
- **W-X-25** · `repair` · medium — Logical names of annex B §B.5 that no feature cites
  - Places in this feature: `specs/117-critic-grounding-and-prompt/spec.md:376`, `:383` — `attempt:<N>:<k>:<n>:withheld-paths`, `attempt:<N>:<k>:<n>:hidden-files`; `gate:<N>:proofs` (reader: grounding; B-8.2c found no requirement that reads or writes it by name)
  - Rule: Name the logical name of annex B §B.5 in the requirement that writes or reads the state.
- **W-X-26** · `repair` · medium — The owner of a record of annex B §B.20 delivers no schema file and still calls the id "proposed"
  - Places in this feature: `specs/117-critic-grounding-and-prompt/data-model.md:77` — `specstride.hidden-files/1` (`specs/100-specstride/annexes/B-state.md:665`)
  - Rule: Add the schema file with `schema` required; cite annex B §B.20.
  - depends on: W-100-16, W-100-09
- **W-X-30** · `repair` · low — Absolute paths of the owner's machine in task text and research
  - Places in this feature: `specs/117-critic-grounding-and-prompt/tasks.md:41`, `:47`
  - Rule: Write "the Specstride baseline at `9cab15d`" and "the Lisa baseline at `363e6a3`" without a path.

### Feature 118 — 118-pass-supervision-and-jobs

#### W-118-01 · `repair` · medium — F118-FR-006 resolves the pass ceiling in another order than F110-FR-015 and annex X §X.2

- Findings merged: B-8.2e-012
- Files and lines:
  - Feature 118: `specs/118-pass-supervision-and-jobs/spec.md:174` (F118-FR-006)
- Change: Replace the order by a reference to F110-FR-015 (`specs/110-config-and-terms/spec.md:501`): an explicit per-phase setting, the learned value, the value declared by the verification-commands document, the role key. Say "an explicit per-phase setting" for the first step and name the declared value as 110 names it.
- Side that changes: feature 118. Authority: annex X §X.2 (`specs/100-specstride/annexes/X-cross-layer.md:68` to `:73`); F106-FR-010
- Note: CQ-158 asks where a declared and a learned value stand in the precedence; the repair follows its recommended answer.
- depends on: none

#### Items owned elsewhere that change files of feature 118

- **W-110-02** · `repair` · high — Feature 118 reads six keys under `loop.yield.*` and six environment variables that no list holds; an unknown key refuses the launch (F100-FR-203)
  - Places in this feature: `specs/118-pass-supervision-and-jobs/spec.md:447` (drop "proposals" and cite the key table of 110), `:291`, `:367` (cite §K.8 of 110 for the three variables)
  - Rule: Cite the key table and §K.8 of feature 110; drop "proposals".
  - depends on: W-100-08
- **W-X-03** · `repair` · high — Rows of the `parity` profile are cited by a wrong number
  - Places in this feature: `specs/118-pass-supervision-and-jobs/tasks.md:43`, `:216` — rows 44 and 45 become 50 and 51 (the two grace periods), as `specs/118-pass-supervision-and-jobs/spec.md:440`, `:441` say
  - Rule: Write the row number of annex X §X.7 for the key.
- **W-100-14** · `repair` · medium — "Iteration" as a counted unit, and four names for one limit
  - Places in this feature: `specs/118-pass-supervision-and-jobs/spec.md:285`
  - Rule: Write "pass limit" and "pass count"; "iteration" survives only in the literals `MAX_ITER`, `iter_*` and `giveIterationBack`.
- **W-100-25** · `queue` · medium — May a core package import `node:fs`?
  - Places in this feature: `specs/118-pass-supervision-and-jobs/plan.md:27`
  - Rule: proceed on the recommended answer: a core package does not import `node:fs`; it uses the kernel and the ports of the edge packages
- **W-X-08** · `repair` · medium — Row XVIII of the Constitution Check lists fewer register rows than the `divergence:` fields of the spec
  - Places in this feature: `specs/118-pass-supervision-and-jobs/plan.md:64` — missing: DV-006, DV-007, DV-011, DV-012, DV-022, DV-025, DV-027, DV-066
  - Rule: In each row XVIII replace the list by "the rows in the `divergence:` fields of `spec.md`", or complete the list.
- **W-X-14** · `repair` · medium — The Constitution Check is not in the form of the plan template, or a row gives a reason that does not bear on its principle
  - Places in this feature: `specs/118-pass-supervision-and-jobs/plan.md:33` — name v3.0.0; `:115` — remove the row "None" from the table; `:59` — row XVII: cite the macOS spike of T001 and the skip, not the refusal `first-failure-off`
  - Rule: Bring the Constitution Check to the form of the plan template, as written in the place.
- **W-X-20** · `repair` · medium — 218 test names of `test:` lines appear in no task; three tests have no task at all
  - Places in this feature: first place `specs/118-pass-supervision-and-jobs/spec.md:177` (13 names); `PT-118-FX16-long-job` at `:343` has no task at all
  - Rule: Make the test names of `spec.md` and `tasks.md` equal; add a task for a test that has none.
- **W-X-21** · `repair` · medium — `proves:` holds a test name, a phrase or nothing in place of an origin or a requirement id
  - Places in this feature: `specs/118-pass-supervision-and-jobs/tasks.md:173` (mixes a test name and an id)
  - Rule: Write in each the requirement id whose `test:` line names the test.
- **W-X-22** · `repair` · medium — Owners do not name their threats of annex X §X.9 with the control (F100-FR-216)
  - Places in this feature: T-25
  - Rule: Add a table "Threats" to `spec.md`: threat id and the requirement that is its control.
  - depends on: W-100-17
- **W-X-23** · `repair` · medium — Text from outside the runtime is written to a sink, and the one redaction point is named nowhere
  - Places in this feature: `specs/118-pass-supervision-and-jobs/spec.md:199`, `:305`, `:360` — the kill note and its line on standard error with "What it caught", `pass.killed.detail`, `job.started.cmd` and `argv`
  - Rule: Add the requirement that the text enters through the one ingress before it is written.

### Feature 119 — 119-front-door-and-presenter

#### W-119-01 · `repair` · medium — No plan names the bundler, and no task builds the bundle or tests a plain install of the published package

- Findings merged: B-8.3b-008
- Files and lines:
  - Feature 100: `specs/100-specstride/plan.md:218` — no change
  - Feature 113: the second feature to which `specs/100-specstride/plan.md:218` assigns the bundling; cite the task of 119
  - Feature 119: `specs/119-front-door-and-presenter/plan.md:27` ("one bundled ESM file"); `specs/119-front-door-and-presenter/tasks.md` (no task)
- Change: Plan 119: name the bundler as a development dependency, with its licence and whether it has a native part. Tasks of 119: one task that builds the bundle, and one test that installs the packed package in an empty directory with scripts ignored, on Linux and on the macOS runner.
- Side that changes: feature 119. Authority: Principle VI (the installation succeeds with no compiler)
- depends on: W-X-09 (Principle XVII: no task records the macOS result or a skip with its reason; the row is marked N/A or gives a reason that is not about tests)

#### Items owned elsewhere that change files of feature 119

- **W-100-24** · `queue` · medium — `resume` on a workspace without state: exit 1 or exit 3?
  - Places in this feature: `specs/119-front-door-and-presenter/spec.md:154` (F119-FR-009)
  - Rule: proceed on the recommended answer: the state check of F119-FR-009 comes first and exits 1; F102-FR-012 says so
- **W-X-05** · `repair` · medium — Stale counts in the specs: features, register rows, requirements, profile rows, keys
  - Places in this feature: `specs/119-front-door-and-presenter/spec.md:499` (97 rows)
  - Rule: Write the count that holds today, or name the register without a count.
  - depends on: W-ORC-03, W-ORC-01, W-ORC-02
- **W-X-06** · `repair` · medium — "Run" and "engine invocation" written for one engine start
  - Places in this feature: `specs/119-front-door-and-presenter/spec.md:196` (F119-FR-017) — "the events and engine log of the newest engine start"; `:202` — "the newest engine start of any feature". Annex B (`specs/100-specstride/annexes/B-state.md:270`) resolves `workspace:current:events` and `workspace:current:engine-log` to the newest engine start
  - Rule: Write "engine start" where one start of the engine is meant (ruling 24).
- **W-X-08** · `repair` · medium — Row XVIII of the Constitution Check lists fewer register rows than the `divergence:` fields of the spec
  - Places in this feature: `specs/119-front-door-and-presenter/plan.md:64` — missing: DV-006, DV-007, DV-027, DV-034, DV-066
  - Rule: In each row XVIII replace the list by "the rows in the `divergence:` fields of `spec.md`", or complete the list.
- **W-X-09** · `repair` · medium — Principle XVII: no task records the macOS result or a skip with its reason; the row is marked N/A or gives a reason that is not about tests
  - Places in this feature: `specs/119-front-door-and-presenter/plan.md:21`, `:59` (answer XVII in place of N/A: the feature has a startup check of 150 ms and states macOS as `unverified`); `specs/119-front-door-and-presenter/tasks.md`
  - Rule: Add the macOS and skip task to `tasks.md`; answer row XVII as a pass with its reason.
- **W-X-14** · `repair` · medium — The Constitution Check is not in the form of the plan template, or a row gives a reason that does not bear on its principle
  - Places in this feature: `specs/119-front-door-and-presenter/plan.md:33` — add the gate line; `specs/119-front-door-and-presenter/tasks.md:28` (T001) — remove the directory `present/`, which moved to feature 145
  - Rule: Bring the Constitution Check to the form of the plan template, as written in the place.
- **W-X-20** · `repair` · medium — 218 test names of `test:` lines appear in no task; three tests have no task at all
  - Places in this feature: `specs/119-front-door-and-presenter/spec.md:126`, `:133` (4 names)
  - Rule: Make the test names of `spec.md` and `tasks.md` equal; add a task for a test that has none.
- **W-X-26** · `repair` · medium — The owner of a record of annex B §B.20 delivers no schema file and still calls the id "proposed"
  - Places in this feature: `specs/119-front-door-and-presenter/contracts/front-door.md:23` — `specstride.inspect.<verb>/1` (`specs/100-specstride/annexes/B-state.md:678`)
  - Rule: Add the schema file with `schema` required; cite annex B §B.20.
  - depends on: W-100-16, W-100-09
- **W-X-31** · `repair` · low — "Gate" written for a check of the build, and bare "gate" for the verification gate
  - Places in this feature: `specs/119-front-door-and-presenter/spec.md:188`
  - Rule: Write "check" for a check of the build; write "verification gate" in full.
- **W-X-34** · `accept` · low — Analyze reports cite old ids of the splits in sentences about the split
  - Places in this feature: `specs/119-front-door-and-presenter/analyze-report.md:9`
  - Rule: No change.

### Feature 122 — 122-detached-runtime

#### W-122-01 · `repair` · medium — A refusal of the state commands is printed under `[SPECSTRIDE-STATE]`; the label of the line of `launch` is never named

- Findings merged: B-8.2b-004
- Files and lines:
  - Feature 122: `specs/122-detached-runtime/contracts/cli-state-commands.md:13`; `specs/122-detached-runtime/spec.md:235` (F122-FR-005, "print one line")
- Change: `cli-state-commands.md:13`: `[SPECSTRIDE-REFUSE] action=<action> reason=<reason> next=<command>`. F122-FR-005: name `[SPECSTRIDE-LAUNCH]` with the keys `run`, `state`.
- Side that changes: feature 122. Authority: annex G §G.3 (`specs/100-specstride/annexes/G-cli.md:139` to `:143`)
- depends on: none

#### W-122-02 · `repair` · medium — Row XII says the spike makes no model call; the tasks say it is paid

- Findings merged: B-8.3c-007
- Files and lines:
  - Feature 122: `specs/122-detached-runtime/plan.md:74` (row XII); `specs/122-detached-runtime/tasks.md:30`, `:32` (T002, T003)
- Change: Row XII: "The spike runs on a live host and is a paid, logged task (T002, T003); it is no test and no CI job, and no test waits for it".
- Side that changes: feature 122 (plan)
- depends on: none

#### Items owned elsewhere that change files of feature 122

- **W-123-02** · `repair` · high — Feature 123 prints `[SPECSTRIDE-LAUNCH]`, `[SPECSTRIDE-STOP]`, `[SPECSTRIDE-DIGEST]` and `[SPECSTRIDE-STATE]` with other keys than their owners
  - Places in this feature: `specs/122-detached-runtime/contracts/cli-state-commands.md:9` to `:13` — no change from this item; `[SPECSTRIDE-STATE]` stays the line of `state export`, `import` and `adopt`
  - Rule: Rename the lines of `supervise` (B-8.2b gives as examples `[SPECSTRIDE-SUPERVISE-LAUNCH]`, `[SPECSTRIDE-SUPERVISE-STOP]`, `[SPECSTRIDE-SUPERVISE-DIGEST]`; the observation line of `:278` gets a `supervise` label as well), and specify `[SPECSTRIDE-DIGEST]` with the keys of annex G (`run`, `comment`, `changed`, `delegated`, `critic`, `fallback`, `alerts`), which names 123 as its printer.
- **W-X-04** · `repair` · high — Old spellings of config keys survive in contract files of the features
  - Places in this feature: `specs/122-detached-runtime/contracts/parity-rows.json:11` — `state.controlRoot` becomes `state.dir`
  - Rule: Write the spelling of `config-keys.tsv` of feature 110.
- **W-X-05** · `repair` · medium — Stale counts in the specs: features, register rows, requirements, profile rows, keys
  - Places in this feature: `specs/122-detached-runtime/spec.md:583` (97 rows)
  - Rule: Write the count that holds today, or name the register without a count.
  - depends on: W-ORC-03, W-ORC-01, W-ORC-02
- **W-X-06** · `repair` · medium — "Run" and "engine invocation" written for one engine start
  - Places in this feature: `specs/122-detached-runtime/spec.md:352` (F122-FR-030) — "when the next engine start begins"
  - Rule: Write "engine start" where one start of the engine is meant (ruling 24).
- **W-X-07** · `repair` · medium — Plans hold statements that the repository has overtaken (owners and layers of the graph, register rows "to be added", names "to be added" to annex B)
  - Places in this feature: `specs/122-detached-runtime/plan.md:43` — `@specstride/runtime` is "L5, L4"
  - Rule: State the present state of the package graph, the register and annex B.
- **W-X-11** · `repair` · medium — Sentences and contract files that say a profile row is "needed", "requested", "proposed" or "to be added", or name it by a label P-n
  - Places in this feature: `specs/122-detached-runtime/contracts/parity-rows.json:6` to `:11` (`"row": null`)
  - Rule: Write "row n of annex X §X.7" with the number; in contract files set `row` and the status "confirmed".
  - depends on: W-X-03
- **W-X-19** · `repair` · medium — Registering an entry in a registry of another feature is `implements` in some specs and `consumes` in others (EP-14, EP-01)
  - Places in this feature: `specs/122-detached-runtime/spec.md:466` (EP-14, `consumes`)
  - Rule: Write `implements (an entry)` for the registration of doctor checks; for EP-01 in 129 write `consumes`.
  - depends on: W-ORC-06
- **W-X-25** · `repair` · medium — Logical names of annex B §B.5 that no feature cites
  - Places in this feature: a new requirement: the runtime writes `workspace:layout-version` at the first launch (F100-FR-041); no file of the 40 features holds "layout version"
  - Rule: Name the logical name of annex B §B.5 in the requirement that writes or reads the state.
- **W-100-16** · `repair` · low — The form of `$id` of a schema file is stated nowhere; the features use four other forms
  - Places in this feature: `specs/122-detached-runtime/contracts/state-archive.schema.json`
  - Rule: Write `$id` as `urn:specstride:schema:<schema id>`.
- **W-X-35** · `accept` · low — Old key spellings in `research.md`, written as history
  - Places in this feature: `specs/122-detached-runtime/research.md:90`
  - Rule: No change.

### Feature 123 — 123-pipeline-runtime-and-supervisor

#### W-123-01 · `repair` · critical — Table 1 (`relaunch-observe`) has no signal for `retryable` or for a blocked reason, so it relaunches a run that rests blocked on a human

- Findings merged: B-8.2b-001
- Files and lines:
  - Feature 123: `specs/123-pipeline-runtime-and-supervisor/spec.md:157`, `:187`, `:188`, `:576` (F123-FR-030), `:802`; `specs/123-pipeline-runtime-and-supervisor/contracts/relaunch-observe.table.json` (rows O-01 to O-32)
  - Feature 127: `specs/127-quota-budgets-and-pause/spec.md:297` — no change; it is the source of the blocked states `auth`, `quota-credit` and `budget-cap` that reach the table
- Change: In §R.6 and in `relaunch-observe.table.json` add the signals `blocked` and `retryable`, read from the terminal record, and two refusing rows before O-25 (`blocked-on-human`, `stop-not-retryable`), active outside the `parity` profile. Correct the sentence at `:802` ("table 1, which cannot see the field"). Cite the new register row in F123-FR-030.
- Side that changes: feature 123. Authority: F100-FR-163 (`specs/100-specstride/annexes/F-runtime-root.md:89`) and F123-FR-030: neither table relaunches a run whose terminal record says `retryable: false` or that rests in `blocked-on-human`; ruling 29
- Note: The other repair that B-8.2b offers is to exempt table 1 in F123-FR-030 and in F100-FR-163 and say why. It changes a contract of feature 100 and leaves the relaunch of a blocked run in place for consumers who set `relaunch.owner: supervise` outside `parity` (annex F §F.4), so it is not taken. CQ-053 covers the literals of table 2 only.
- depends on: W-ORC-01 (Register row: table 1 refuses a run that rests blocked or whose stop is not retryable)

#### W-123-02 · `repair` · high — Feature 123 prints `[SPECSTRIDE-LAUNCH]`, `[SPECSTRIDE-STOP]`, `[SPECSTRIDE-DIGEST]` and `[SPECSTRIDE-STATE]` with other keys than their owners

- Findings merged: B-8.2b-002, B-8.2b-003
- Files and lines:
  - Feature 102: `specs/102-run-control/spec.md:198` — no change; `[SPECSTRIDE-STOP]` with the keys of annex G
  - Feature 122: `specs/122-detached-runtime/contracts/cli-state-commands.md:9` to `:13` — no change from this item; `[SPECSTRIDE-STATE]` stays the line of `state export`, `import` and `adopt`
  - Feature 123: `specs/123-pipeline-runtime-and-supervisor/spec.md:277`, `:278`, `:282`, `:284` (§R.8); `specs/123-pipeline-runtime-and-supervisor/contracts/supervise-verbs.json:67`, `:72`, `:92`, `:102`
- Change: Rename the lines of `supervise` (B-8.2b gives as examples `[SPECSTRIDE-SUPERVISE-LAUNCH]`, `[SPECSTRIDE-SUPERVISE-STOP]`, `[SPECSTRIDE-SUPERVISE-DIGEST]`; the observation line of `:278` gets a `supervise` label as well), and specify `[SPECSTRIDE-DIGEST]` with the keys of annex G (`run`, `comment`, `changed`, `delegated`, `critic`, `fallback`, `alerts`), which names 123 as its printer.
- Side that changes: feature 123. Authority: annex G §G.3 (`specs/100-specstride/annexes/G-cli.md:139` to `:141`)
- Note: CQ-050 covers the choice of labels, not the collision; the orchestrator adds the outcome to CQ-050 (section 4).
- depends on: none

#### W-123-03 · `repair` · medium — A stage child runs under the system tool `script(1)`; no requirement, doctor check or task names the tool or its absence

- Findings merged: B-8.3c-008
- Files and lines:
  - Feature 123: `specs/123-pipeline-runtime-and-supervisor/plan.md:59`, `:139`; `specs/123-pipeline-runtime-and-supervisor/research.md:57-60`; `specs/123-pipeline-runtime-and-supervisor/spec.md:458` (F123-FR-011); `specs/123-pipeline-runtime-and-supervisor/tasks.md`
- Change: F123-FR-011: where no terminal can be given, the child runs through the pipe and the run goes on. Plan, Technical Context: name the tool as a platform tool outside npm, probed by a doctor check. Tasks: one test for the absent tool and one doctor check. Model: `specs/122-detached-runtime/plan.md:35` for `ps` and `sysctl`.
- Side that changes: feature 123. Authority: Principle VI (no undocumented system requirement) and the Development Workflow (every code path degrades)
- depends on: none

#### W-123-04 · `repair` · low — `NO_COLOR` is read in two ways, and four variables of the platform are in no alias table

- Findings merged: B-8.2e-020
- Files and lines:
  - Feature 110: `specs/110-config-and-terms/spec.md` §K.8 — list `NO_COLOR`, `FORCE_COLOR`, `TERM`, `COLORTERM` as variables of the platform that reach no key
  - Feature 123: `specs/123-pipeline-runtime-and-supervisor/spec.md:399` ("the presence of the variable `NO_COLOR` with any value")
  - Feature 145: `specs/145-presenter/spec.md:182` (`NO_COLOR` "set and non-empty"; also `FORCE_COLOR`, `TERM`, `COLORTERM`)
- Change: State in both requirements that the difference is the baseline's, with the behaviour item. Feature 110 lists the four names.
- Side that changes: features 123, 145 and 110
- depends on: none

#### Items owned elsewhere that change files of feature 123

- **W-127-01** · `queue` · medium — Is a tripped wall-clock budget relaunched, or does it rest blocked on a human?
  - Places in this feature: `specs/123-pipeline-runtime-and-supervisor/spec.md:300` — no change under the recommended answer: a `wall_budget` stop with `retryable: true` is relaunched
  - Rule: proceed on the recommended answer: a tripped wall-clock budget is `retryable: true` and carries no blocked reason
- **W-X-05** · `repair` · medium — Stale counts in the specs: features, register rows, requirements, profile rows, keys
  - Places in this feature: `specs/123-pipeline-runtime-and-supervisor/spec.md:827` (97 rows)
  - Rule: Write the count that holds today, or name the register without a count.
  - depends on: W-ORC-03, W-ORC-01, W-ORC-02
- **W-X-06** · `repair` · medium — "Run" and "engine invocation" written for one engine start
  - Places in this feature: `specs/123-pipeline-runtime-and-supervisor/spec.md:508` — "engine start"
  - Rule: Write "engine start" where one start of the engine is meant (ruling 24).
- **W-X-07** · `repair` · medium — Plans hold statements that the repository has overtaken (owners and layers of the graph, register rows "to be added", names "to be added" to annex B)
  - Places in this feature: `specs/123-pipeline-runtime-and-supervisor/plan.md:131` — "uses the registration call in `kernel` (feature 100)"
  - Rule: State the present state of the package graph, the register and annex B.
- **W-X-13** · `repair` · medium — `CQ-pending-<n>` placeholders remain, and one row carries the number of another question
  - Places in this feature: `specs/123-pipeline-runtime-and-supervisor/research.md:79` — "The eight CQ-pending questions" become the numbers of the queue that `specs/123-pipeline-runtime-and-supervisor/spec.md` cites under "Assumptions" (CQ-046 to CQ-053)
  - Rule: Replace the placeholder as written in the place.
  - depends on: W-141-01, W-141-02
- **W-X-19** · `repair` · medium — Registering an entry in a registry of another feature is `implements` in some specs and `consumes` in others (EP-14, EP-01)
  - Places in this feature: `specs/123-pipeline-runtime-and-supervisor/spec.md:694` (EP-14, `consumes`)
  - Rule: Write `implements (an entry)` for the registration of doctor checks; for EP-01 in 129 write `consumes`.
  - depends on: W-ORC-06
- **W-X-20** · `repair` · medium — 218 test names of `test:` lines appear in no task; three tests have no task at all
  - Places in this feature: first place `specs/123-pipeline-runtime-and-supervisor/spec.md:396` (14 names)
  - Rule: Make the test names of `spec.md` and `tasks.md` equal; add a task for a test that has none.
- **W-X-22** · `repair` · medium — Owners do not name their threats of annex X §X.9 with the control (F100-FR-216)
  - Places in this feature: T-11, T-47
  - Rule: Add a table "Threats" to `spec.md`: threat id and the requirement that is its control.
  - depends on: W-100-17
- **W-X-24** · `repair` · medium — Catalogue types that no feature says it emits
  - Places in this feature: `specs/123-pipeline-runtime-and-supervisor/spec.md:500` (F123-FR-018 names only `stage.*` and `supervisor.*`) — `pipeline.started`, `pipeline.ended`, `launch.checked`, `digest.written`
  - Rule: Name the event type in the requirement that emits it.
- **W-100-15** · `repair` · low — One warning under two names: "critic-diversity warning" and "same-model warning"
  - Places in this feature: `specs/123-pipeline-runtime-and-supervisor/spec.md:522`
  - Rule: Write "critic-diversity warning"; `same-model` stays as a result of the diversity test.
- **W-X-33** · `repair` · low — A requirement line names another tier 2 feature in prose and no contract of feature 100
  - Places in this feature: `specs/123-pipeline-runtime-and-supervisor/spec.md:580` (names 107)
  - Rule: In each line name the contract of feature 100 through which the behaviour is consumed (for example annex X §X.2 for the event catalogue, annex X §X.10 for the redaction patterns, annex G §G.7 for the doctor registry).

### Feature 124 — 124-harness-discovery-and-roles

No item of its own.

#### Items owned elsewhere that change files of feature 124

- **W-125-01** · `repair` · high — Three features give three triggers for the one warning, and F125-FR-026 opens with a MUST that the rest of the requirement denies
  - Places in this feature: `specs/124-harness-discovery-and-roles/spec.md:279` (F124-FR-045) — the one place that states the trigger: both roles resolve to the same model; `:239` (F124-FR-037) stays
  - Rule: The warning is raised when both roles resolve to the same model (F100-FR-024); cite it, state no other trigger.
- **W-100-14** · `repair` · medium — "Iteration" as a counted unit, and four names for one limit
  - Places in this feature: "limit of passes" (lines not given in the report)
  - Rule: Write "pass limit" and "pass count"; "iteration" survives only in the literals `MAX_ITER`, `iter_*` and `giveIterationBack`.
- **W-115-02** · `queue` · medium — Does ruling 49 allow an escalation rung that is the critic's model at a higher effort?
  - Places in this feature: `specs/124-harness-discovery-and-roles/spec.md:279` (F124-FR-045) — no change; it carries ruling 49 for the choice of the critic
  - Rule: proceed on the recommended answer: `targetIsCriticModel` means equal in model and in effort; a rung that shares the model raises the warning
- **W-X-11** · `repair` · medium — Sentences and contract files that say a profile row is "needed", "requested", "proposed" or "to be added", or name it by a label P-n
  - Places in this feature: `specs/124-harness-discovery-and-roles/spec.md:193`; `specs/124-harness-discovery-and-roles/contracts/config-keys.json:38` to `:52`; entries without a row in `specs/124-harness-discovery-and-roles/contracts/parity-rows.json`
  - Rule: Write "row n of annex X §X.7" with the number; in contract files set `row` and the status "confirmed".
  - depends on: W-X-03
- **W-100-15** · `repair` · low — One warning under two names: "critic-diversity warning" and "same-model warning"
  - Places in this feature: `specs/124-harness-discovery-and-roles/spec.md:279`
  - Rule: Write "critic-diversity warning"; `same-model` stays as a result of the diversity test.

### Feature 125 — 125-adapter-claude

#### W-125-01 · `repair` · high — Three features give three triggers for the one warning, and F125-FR-026 opens with a MUST that the rest of the requirement denies

- Findings merged: B-8.2a-001
- Files and lines:
  - Feature 112: `specs/112-doctor/spec.md:226` (F112-FR-015) — cite F100-FR-024 for the trigger; drop "when the model tier is shared"
  - Feature 124: `specs/124-harness-discovery-and-roles/spec.md:279` (F124-FR-045) — the one place that states the trigger: both roles resolve to the same model; `:239` (F124-FR-037) stays
  - Feature 125: `specs/125-adapter-claude/spec.md:341` (F125-FR-026)
- Change: In F125-FR-026 replace the first sentence by "By default the critic's model tier differs from the proposer's (F124-FR-025)", and replace "is the proposer's, or on the same model tier" by "is the proposer's". State the trigger once, in F124-FR-045; features 125 and 112 cite F100-FR-024. One field, `criticPick`, records the warning.
- Side that changes: features 125 and 112. Authority: F100-FR-024 (`specs/100-specstride/annexes/A-foundations.md:146`): the warning never blocks; ruling 49
- depends on: none

#### W-125-02 · `repair` · medium — F125-FR-012 lets the bypass mode "be chosen" where a sandbox is detected, without saying who chooses

- Findings merged: B-8.4a-002
- Files and lines:
  - Feature 125: `specs/125-adapter-claude/spec.md:254` (F125-FR-012); `:477`, `:566`; `specs/125-adapter-claude/contracts/argument-table.md:103`; `specs/125-adapter-claude/tasks.md:98` (T030)
- Change: Replace the sentence by: "The bypass mode MUST be used only when the consumer set it in `sandbox.permissionMode` (user configuration, environment or flag), and then only where the doctor detects a sandbox and a user other than root; the harness adapter MUST never select it by itself." Align the four other places.
- Side that changes: feature 125. Authority: ruling 34 ("the Claude proposer in accept-edits mode with an allow list")
- depends on: none

#### W-125-03 · `repair` · medium — Rows VIII and IX are marked as a pass while the spec proceeds on answers that depart from the letter of the principles

- Findings merged: B-8.3c-004
- Files and lines:
  - Feature 125: `specs/125-adapter-claude/plan.md:49`, `:69-70` (rows VIII, IX), `:164-166` (Complexity Tracking, "Empty"); `specs/125-adapter-claude/spec.md:274` (F125-FR-015), `:345` (F125-FR-027)
- Change: Mark rows VIII and IX as deviations pending CQ-143 and CQ-145 and add two rows to Complexity Tracking with the justification and the alternative that the queue names; remove them when the owner has ruled.
- Side that changes: feature 125 (plan). Authority: Governance of the constitution
- Note: The substance is queued (CQ-143: the removal of session state in the real home at auth tier 1; CQ-145: the window fallback of 200,000) and is no finding. Feature 131 chose the other answer to both (`specs/131-adapter-codex/spec.md:261`), so the two adapters differ until the owner answers.
- depends on: none

#### W-125-04 · `repair` · medium — "Tier" is written bare where the feature has auth tiers and model tiers

- Findings merged: B-8.2a-008
- Files and lines:
  - Feature 125: `specs/125-adapter-claude/spec.md:34`, `:324` ("The critic: both tiers"), `:305` (F125-FR-020), `:372` ("tier ladder")
- Change: Write "both auth tiers" at lines 34 and 324, "the auth tier in use" at 305, "model-tier ladder" at 372.
- Side that changes: feature 125. Authority: glossary row 42
- depends on: none

#### Items owned elsewhere that change files of feature 125

- **W-115-02** · `queue` · medium — Does ruling 49 allow an escalation rung that is the critic's model at a higher effort?
  - Places in this feature: `specs/125-adapter-claude/spec.md:341` (F125-FR-026) — no change from this item
  - Rule: proceed on the recommended answer: `targetIsCriticModel` means equal in model and in effort; a rung that shares the model raises the warning
- **W-127-02** · `repair` · medium — The output `retryable` of `classify` has no value per class, and the adapters differ
  - Places in this feature: `specs/125-adapter-claude/contracts/classifier-table.md:12` — add the column
  - Rule: Take `retryable` per class from §Q.1 of feature 127.
- **W-X-05** · `repair` · medium — Stale counts in the specs: features, register rows, requirements, profile rows, keys
  - Places in this feature: `specs/125-adapter-claude/spec.md:588` (97 rows)
  - Rule: Write the count that holds today, or name the register without a count.
  - depends on: W-ORC-03, W-ORC-01, W-ORC-02
- **W-X-11** · `repair` · medium — Sentences and contract files that say a profile row is "needed", "requested", "proposed" or "to be added", or name it by a label P-n
  - Places in this feature: `specs/125-adapter-claude/spec.md:425` ("no row exists for the switch" of `harnesses.claude.disableSubagents`: it is row 122)
  - Rule: Write "row n of annex X §X.7" with the number; in contract files set `row` and the status "confirmed".
  - depends on: W-X-03
- **W-X-14** · `repair` · medium — The Constitution Check is not in the form of the plan template, or a row gives a reason that does not bear on its principle
  - Places in this feature: `specs/125-adapter-claude/plan.md:55-57` — name v3.0.0
  - Rule: Bring the Constitution Check to the form of the plan template, as written in the place.
- **W-X-15** · `repair` · medium — A paid capture is a precondition of unpaid work
  - Places in this feature: `specs/125-adapter-claude/tasks.md:15` ("T001 to T004 first (captures)"), `:179` ("US4 needs T003"), `:248`; T055 (test CT-125-22 includes "the captured limit event of T003"): state the skip
  - Rule: No task waits for a paid capture; a test without its fixture is a skip with its reason.
- **W-X-16** · `repair` · medium — The terms gate, its file and the audience are said to belong to feature 110; since the split they belong to 147
  - Places in this feature: `specs/125-adapter-claude/contracts/terms-rows.md:3`; `specs/125-adapter-claude/tasks.md:236`
  - Rule: Replace 110 by 147 where the terms gate, the terms file or the audience is meant (`specs/147-terms-gate/spec.md:17`); keep 110 for the secret resolvers.
- **W-X-19** · `repair` · medium — Registering an entry in a registry of another feature is `implements` in some specs and `consumes` in others (EP-14, EP-01)
  - Places in this feature: `specs/125-adapter-claude/spec.md:200`, `:487` (EP-14, `implements`)
  - Rule: Write `implements (an entry)` for the registration of doctor checks; for EP-01 in 129 write `consumes`.
  - depends on: W-ORC-06
- **W-X-33** · `repair` · low — A requirement line names another tier 2 feature in prose and no contract of feature 100
  - Places in this feature: `specs/125-adapter-claude/spec.md:215` (names 112), `:411` (names 109)
  - Rule: In each line name the contract of feature 100 through which the behaviour is consumed (for example annex X §X.2 for the event catalogue, annex X §X.10 for the redaction patterns, annex G §G.7 for the doctor registry).

### Feature 126 — 126-stream-seam-and-invocation

#### W-126-01 · `repair` · high — F126-FR-016 ships an event to the other sinks although the local append failed

- Findings merged: B-8.2d-002
- Files and lines:
  - Feature 126: `specs/126-stream-seam-and-invocation/spec.md:225` (F126-FR-016, disposition `ported`)
- Change: Replace the sentence by "A failed append is handled by the event writer (F111-FR-019): the event is dropped, counted in `event.dropped`, and reaches no sink"; change the disposition and cite the register row.
- Side that changes: feature 126. Authority: annex X §X.1; F111-FR-017, F111-FR-019, F111-FR-034 (`specs/111-event-schema-and-projection/spec.md:179`, `:189`, `:255`): a sink is called only after the primary write
- depends on: W-ORC-02 (Register row: an event whose local append failed reaches no sink)

#### W-126-02 · `repair` · high — F126-FR-020 strips `ts`, `time` and `event` from what a sink receives

- Findings merged: B-8.2d-003
- Files and lines:
  - Feature 126: `specs/126-stream-seam-and-invocation/spec.md:249` (F126-FR-020)
  - Feature 128: `specs/128-telemetry-export/contracts/payload-forms.tsv:8` — no change; the new form takes the time of an entry from "ts of the event"
- Change: Limit the sentence to the as-is form of the compatibility projection, and state that a sink receives the event of annex X §X.1 whole (with `ts`, `type` and the position `seq`).
- Side that changes: feature 126. Authority: annex X §X.1 (`specs/100-specstride/annexes/X-cross-layer.md:22`); F111-FR-034
- depends on: W-X-13 (`CQ-pending-<n>` placeholders remain, and one row carries the number of another question)

#### W-126-03 · `repair` · medium — Feature 126, which is no adapter, branches on the harness names prime, dsh and Codex

- Findings merged: B-8.2a-003
- Files and lines:
  - Feature 126: `specs/126-stream-seam-and-invocation/spec.md:313` (F126-FR-031), `:202` (F126-FR-012), `:176` (F126-FR-008); its own user story at `:43`
- Change: State each condition on a field of the format row or of the descriptor: "a pass whose format row sets `trackTerminal`" for F126-FR-031 and F126-FR-012; "a pass whose harness has no registry stream format" for F126-FR-008. Name the harnesses only as examples under the `parity` profile.
- Side that changes: feature 126. Authority: F100-FR-023 (`specs/100-specstride/annexes/A-foundations.md:141`): the core MUST NOT test a harness name in control flow; Principle VII
- depends on: none

#### W-126-04 · `repair` · low — Row VIII is N/A ("no process is started here"), but a tap executable of the consumer may replace the built-in tap

- Findings merged: B-8.3c-013
- Files and lines:
  - Feature 126: `specs/126-stream-seam-and-invocation/plan.md:45` (row VIII), `:27`; `specs/126-stream-seam-and-invocation/spec.md:195` (F126-FR-011)
- Change: Row VIII: the replacement tap is started from an argument list with no shell, with standard input from the stream only, and never waits for a human. Row V: a replacement tap that fails or hangs never fails the pass, with the requirement id.
- Side that changes: feature 126 (plan)
- depends on: W-X-14 (The Constitution Check is not in the form of the plan template, or a row gives a reason that does not bear on its principle)

#### Items owned elsewhere that change files of feature 126

- **W-X-01** · `repair` · high — Plans and task lists name packages that the package graph of feature 100 does not hold
  - Places in this feature: `specs/126-stream-seam-and-invocation/plan.md:23`, `:80-93`, `:96`; `specs/126-stream-seam-and-invocation/tasks.md:10` (T002) — registry, readers and tap in `packages/harness/src/stream/`; the invocation artifacts in a directory of `@specstride/harness`; state that the engine reaches reconciliation through an interface of `contracts`. Features 130 and 131 already take the registry from `@specstride/harness` (`specs/130-adapter-dsh/plan.md:39`)
  - Rule: Use the package that the package graph of feature 100 names; change plan and task paths.
  - depends on: W-100-25
- **W-X-05** · `repair` · medium — Stale counts in the specs: features, register rows, requirements, profile rows, keys
  - Places in this feature: `specs/126-stream-seam-and-invocation/spec.md:479` (97 rows)
  - Rule: Write the count that holds today, or name the register without a count.
  - depends on: W-ORC-03, W-ORC-01, W-ORC-02
- **W-X-07** · `repair` · medium — Plans hold statements that the repository has overtaken (owners and layers of the graph, register rows "to be added", names "to be added" to annex B)
  - Places in this feature: `specs/126-stream-seam-and-invocation/plan.md:57` — row XVIII names DV-101, DV-102, DV-103 (`docs/ecosystem/consolidation.md:1000-1002`)
  - Rule: State the present state of the package graph, the register and annex B.
- **W-X-11** · `repair` · medium — Sentences and contract files that say a profile row is "needed", "requested", "proposed" or "to be added", or name it by a label P-n
  - Places in this feature: `specs/126-stream-seam-and-invocation/spec.md:200`, `:239`
  - Rule: Write "row n of annex X §X.7" with the number; in contract files set `row` and the status "confirmed".
  - depends on: W-X-03
- **W-X-13** · `repair` · medium — `CQ-pending-<n>` placeholders remain, and one row carries the number of another question
  - Places in this feature: `specs/126-stream-seam-and-invocation/spec.md:255`, `:487` — `CQ-pending-5` becomes "CQ-032, CQ-119"
  - Rule: Replace the placeholder as written in the place.
  - depends on: W-141-01, W-141-02
- **W-X-14** · `repair` · medium — The Constitution Check is not in the form of the plan template, or a row gives a reason that does not bear on its principle
  - Places in this feature: `specs/126-stream-seam-and-invocation/plan.md:31-58` — add the gate line, a mark on every row, the re-check after Phase 1, one line per principle for XIII to XVII and XX, and the requirement that supports each row (for example F126-FR-032 for I, F126-FR-018 for III, F126-FR-001 and F126-FR-007 for VII)
  - Rule: Bring the Constitution Check to the form of the plan template, as written in the place.
- **W-X-15** · `repair` · medium — A paid capture is a precondition of unpaid work
  - Places in this feature: `specs/126-stream-seam-and-invocation/tasks.md:9` ("T001 first (paid, logged)"), `:104`
  - Rule: No task waits for a paid capture; a test without its fixture is a skip with its reason.
- **W-X-26** · `repair` · medium — The owner of a record of annex B §B.20 delivers no schema file and still calls the id "proposed"
  - Places in this feature: `specs/126-stream-seam-and-invocation/contracts/README.md:9-12` — `specstride.invocation/1`, `specstride.producer-status/1`, `specstride.provider-terminal/1`, `specstride.invocation-result/1` (`specs/100-specstride/annexes/B-state.md:669-672`)
  - Rule: Add the schema file with `schema` required; cite annex B §B.20.
  - depends on: W-100-16, W-100-09

### Feature 127 — 127-quota-budgets-and-pause

#### W-127-01 · `queue` · medium — Is a tripped wall-clock budget relaunched, or does it rest blocked on a human? (proposed question Q-10)

- Findings merged: B-8.2b-007
- Files and lines:
  - Feature 100: `specs/100-specstride/annexes/E-engine.md:226`, `:150` — no change under the recommended answer
  - Feature 123: `specs/123-pipeline-runtime-and-supervisor/spec.md:300` — no change under the recommended answer: a `wall_budget` stop with `retryable: true` is relaunched
  - Feature 127: `specs/127-quota-budgets-and-pause/spec.md:338` (F127-FR-025), `:350` (F127-FR-027), `:297`, `:383` (F127-FR-034)
- Question: F127-FR-025 makes `wallClock`, `phaseAttempts` and `calls` hard ceilings, and F127-FR-034 sends every reached hard ceiling to `blocked-on-human` with `budget-cap`, `wall_budget`, `retryable: false`. F127-FR-027 ends a tripped wall-clock budget "as the baseline". Annex E §E.3 gives `wall_budget` `retryable: true` except for `budget-cap`, which it defines as a cap of spend. Is the wall-clock ceiling of a run (`loop.maxWallMin`) a hard ceiling in the sense of F127-FR-034?
- Sources: Annex E §E.2 and §E.3; F127-FR-025, -027, -034; F123-FR-030; CQ-020 ("a hard budget cap gives `wall_budget` and exit 4", `retryable: false`); CQ-134 (the wall-clock budget is measured per engine start, as at the baseline)
- Recommended answer (B-8.2b (its first repair)): No: a tripped wall-clock budget ends as at the baseline, with `retryable: true` and no blocked reason; `budget-cap` is for caps of spend
- If answered otherwise: The wall-clock ceiling rests blocked: annex E §E.3 widens `budget-cap` beyond spend, and the classifier tables of feature 123 refuse the stop
- Change on the recommended answer: F127-FR-027: state "`retryable: true`, no blocked reason". F127-FR-025 and F127-FR-034: exempt `wallClock` (run scope, `loop.maxWallMin`) from the blocked path, and say which of `phaseAttempts` and `calls` end with `budget-cap`.
- depends on: none

#### W-127-02 · `repair` · medium — The output `retryable` of `classify` has no value per class, and the adapters differ

- Findings merged: B-8.2b-010
- Files and lines:
  - Feature 125: `specs/125-adapter-claude/contracts/classifier-table.md:12` — add the column
  - Feature 127: `specs/127-quota-budgets-and-pause/spec.md:44` (§Q.1)
  - Feature 131: `specs/131-adapter-codex/contracts/classifier-entries.json:6` — `provider_other` has no value
  - Feature 134: `specs/134-adapter-pi/contracts/classifier-entries.pi.json:51` — values only for `context_window` and `overload`
  - Feature 138: `specs/138-adapter-prime/contracts/classifier-entries.json:7` — `provider_other` `retryable: false` becomes `true`
- Change: Add a column `retryable` per class to §Q.1 (B-8.2b proposes: true for `quota_window`, `rate_limit_transient`, `overload`, `agent_failure`, `provider_other`; false for `quota_credit`, `auth`, `context_window`, `budget_cap`), then align the four adapter tables.
- Side that changes: feature 127 states the values; the adapters follow. Authority: annex E §E.3 (`specs/100-specstride/annexes/E-engine.md:229`): a stop by `provider_other` errors is `retryable: true`
- depends on: none

#### Items owned elsewhere that change files of feature 127

- **W-123-01** · `repair` · critical — Table 1 (`relaunch-observe`) has no signal for `retryable` or for a blocked reason, so it relaunches a run that rests blocked on a human
  - Places in this feature: `specs/127-quota-budgets-and-pause/spec.md:297` — no change; it is the source of the blocked states `auth`, `quota-credit` and `budget-cap` that reach the table
  - Rule: No change in this feature.
  - depends on: W-ORC-01
- **W-111-02** · `repair` · high — Requirements demand events for which the catalogue has no type; the writer drops an event without one
  - Places in this feature: `specs/127-quota-budgets-and-pause/spec.md:313` — a fallback entry skipped: name the type
  - Rule: Name in the requirement the catalogue type that carries the event.
- **W-X-03** · `repair` · high — Rows of the `parity` profile are cited by a wrong number
  - Places in this feature: `specs/127-quota-budgets-and-pause/spec.md:500`, `:501` — "39 (shared)" becomes 111; `:503` — "40 (shared)" becomes 112, as `:509` of the same file says
  - Rule: Write the row number of annex X §X.7 for the key.
- **W-100-14** · `repair` · medium — "Iteration" as a counted unit, and four names for one limit
  - Places in this feature: `specs/127-quota-budgets-and-pause/spec.md:267`, `:383`
  - Rule: Write "pass limit" and "pass count"; "iteration" survives only in the literals `MAX_ITER`, `iter_*` and `giveIterationBack`.
- **W-110-06** · `repair` · medium — Defaults of one key stated differently, and defaults of the catalogue given by reference
  - Places in this feature: `specs/127-quota-budgets-and-pause/spec.md:505` — `budget.*`: "none" in place of "0 (off)", and add `budget.run.phaseAttempts` (row 108 of §X.7)
  - Rule: Write the default of annex X §X.7.
  - depends on: W-100-05
- **W-111-05** · `repair` · medium — The causes of `pass.ended` and `attempt.ended` and the outcome of `phase.ended` are no closed sets; the `data` field `cause` has the name of an envelope field
  - Places in this feature: `specs/127-quota-budgets-and-pause/spec.md:261` — writes `quota_pause`, a member of the new set
  - Rule: Use the members and the field name that feature 111 states.
- **W-X-05** · `repair` · medium — Stale counts in the specs: features, register rows, requirements, profile rows, keys
  - Places in this feature: `specs/127-quota-budgets-and-pause/spec.md:577` (97 rows)
  - Rule: Write the count that holds today, or name the register without a count.
  - depends on: W-ORC-03, W-ORC-01, W-ORC-02
- **W-X-07** · `repair` · medium — Plans hold statements that the repository has overtaken (owners and layers of the graph, register rows "to be added", names "to be added" to annex B)
  - Places in this feature: `specs/127-quota-budgets-and-pause/plan.md:28`, `:34` — "`run:<runId>:spend` (annex B §B.5)"; owners of `@specstride/policy`: 110, 127, 147
  - Rule: State the present state of the package graph, the register and annex B.
- **W-X-10** · `repair` · medium — Sentences that say annex B has no logical name, or call a name "proposed" or "to be added"
  - Places in this feature: `specs/127-quota-budgets-and-pause/spec.md:567`; `specs/127-quota-budgets-and-pause/data-model.md:10`; `specs/127-quota-budgets-and-pause/contracts/spend-ledger.schema.json` (title) — `run:<runId>:spend`. At `spec.md:567` take the readers of annex B (engine, RunView, doctor), or report the CLI as a reader to the orchestrator for feature 100
  - Rule: Cite "annex B §B.5" for the name.
- **W-100-16** · `repair` · low — The form of `$id` of a schema file is stated nowhere; the features use four other forms
  - Places in this feature: `specs/127-quota-budgets-and-pause/contracts/spend-ledger.schema.json`
  - Rule: Write `$id` as `urn:specstride:schema:<schema id>`.
- **W-110-12** · `repair` · low — One rule under two names: "tier bump" and "model-tier bump"
  - Places in this feature: bare "tier bump" (the report names the feature, not the line)
  - Rule: Write "model-tier bump".

### Feature 128 — 128-telemetry-export

#### W-128-01 · `repair` · medium — The schema of the span state carries `schema` without the major and a separate field `v`

- Findings merged: B-8.2c-009
- Files and lines:
  - Feature 128: `specs/128-telemetry-export/contracts/span-state.schema.json`; `specs/128-telemetry-export/data-model.md:62`; `specs/128-telemetry-export/spec.md:273`
- Change: Set `schema` to the constant `specstride.span-state/1` and remove `v`; cite annex B §B.20.
- Side that changes: feature 128. Authority: F100-FR-048 (the value is the schema id with its major); `specs/100-specstride/annexes/B-state.md:107`, `:230`
- depends on: W-100-09 (Annex B §B.20: the schema id of the span state is missing; the owner of the inspection records after the split 119/145)

#### W-128-02 · `repair` · low — No spec cites register row DV-107

- Findings merged: B-8.4b-006
- Files and lines:
  - Feature 128: `specs/128-telemetry-export/spec.md:306` to `:311` (F128-FR-023, cites DV-083); `:629`, `:643` ("needs a waiver")
- Change: Add `DV-107` to `divergence:` of F128-FR-023, and name DV-107 at lines 629 and 643 (`docs/ecosystem/consolidation.md:1006`).
- Side that changes: feature 128
- Note: The question itself is CQ-128 and is no finding.
- depends on: none

#### W-128-03 · `repair` · low — The fix of defect D-40 has parity tests only; a comparison with the reference cannot prove a fix

- Findings merged: B-8.4c-006
- Files and lines:
  - Feature 128: `specs/128-telemetry-export/spec.md:328` (F128-FR-026), `:331` (its `test:` line); `specs/128-telemetry-export/tasks.md:126` (T035)
- Change: Add a characterization test (`CT-128-<n>`) for the label `otel` of the delivery record to the `test:` line, and a task for it.
- Side that changes: feature 128. Authority: `consolidation.md` section 5.1 rule 5; ruling K7
- depends on: none

#### W-128-04 · `repair` · low — F128-FR-009 speaks of "the event schema of feature 100" and reads three as-is names from a table that has no row for them

- Findings merged: B-8.2d-020
- Files and lines:
  - Feature 128: `specs/128-telemetry-export/spec.md:211` (F128-FR-009); `specs/128-telemetry-export/contracts/as-is-openers-closers.tsv:8`; `specs/128-telemetry-export/contracts/span-scopes.tsv:8`
- Change: State the catalogue type behind each of the three names `api_request`, `tool_use`, `gate` (the projection has no row for them, `specs/144-compatibility-projection/spec.md:200`); say that the as-is opener of the scope `yield` (`yield_wait`, which is `yield.waiting`) follows the baseline, while the scope opens at `yield.started`.
- Side that changes: feature 128
- depends on: none

#### Items owned elsewhere that change files of feature 128

- **W-110-03** · `repair` · high — Environment aliases that the alias tables do not hold, and alias tables that are out of step
  - Places in this feature: `specs/128-telemetry-export/spec.md:163`, `:176`, `:218` — cite §K.8 of feature 110 in place of "the alias table of annex X §X.8" for the seven names
  - Rule: Cite §K.8 of feature 110 or annex X §X.8 for the variable, as written in the place.
  - depends on: W-100-08
- **W-110-04** · `repair` · high — The owner of a key in feature 110 is the owner before the nine splits
  - Places in this feature: `specs/128-telemetry-export/spec.md:595` — the owner of `compat.legacyEvents` is 144
  - Rule: Write the owner that annex X §X.7 names.
  - depends on: W-100-04
- **W-126-02** · `repair` · high — F126-FR-020 strips `ts`, `time` and `event` from what a sink receives
  - Places in this feature: `specs/128-telemetry-export/contracts/payload-forms.tsv:8` — no change; the new form takes the time of an entry from "ts of the event"
  - Rule: Limit the sentence to the as-is form of the compatibility projection, and state that a sink receives the event of annex X §X.1 whole (with `ts`, `type` and the position `seq`).
  - depends on: W-X-13
- **W-X-01** · `repair` · high — Plans and task lists name packages that the package graph of feature 100 does not hold
  - Places in this feature: `specs/128-telemetry-export/plan.md:34`, `:112`; `specs/128-telemetry-export/tasks.md:24` and every task path under `packages/telemetry/` (47 lines) — a directory of `packages/observability/` (for example `packages/observability/src/export/`); add `@specstride/kernel` to the dependency line, because the exporter uses the redaction point
  - Rule: Use the package that the package graph of feature 100 names; change plan and task paths.
  - depends on: W-100-25
- **W-X-04** · `repair` · high — Old spellings of config keys survive in contract files of the features
  - Places in this feature: `specs/128-telemetry-export/contracts/config-keys.tsv:3`, `:8`, `:9`, `:10`, `:11` — `telemetry.lokiUrl` becomes `telemetry.loki.url`; `telemetry.content.maxPromptBytes` and `telemetry.content.maxReplyBytes` become `telemetry.contentMaxPromptBytes` and `telemetry.contentMaxReplyBytes`; `otel.legacyMetricNames` and `otel.dialects` become `telemetry.otel.legacyMetricNames` and `telemetry.otel.dialects`; `:7` — the default of `telemetry.content` is `auto`, not "follows traces"
  - Rule: Write the spelling of `config-keys.tsv` of feature 110.
- **W-X-05** · `repair` · medium — Stale counts in the specs: features, register rows, requirements, profile rows, keys
  - Places in this feature: `specs/128-telemetry-export/spec.md:663` (98 rows)
  - Rule: Write the count that holds today, or name the register without a count.
  - depends on: W-ORC-03, W-ORC-01, W-ORC-02
- **W-X-07** · `repair` · medium — Plans hold statements that the repository has overtaken (owners and layers of the graph, register rows "to be added", names "to be added" to annex B)
  - Places in this feature: `specs/128-telemetry-export/plan.md:62` — row X: the versions are "pinned in `research.md`" (`specs/128-telemetry-export/research.md:62`)
  - Rule: State the present state of the package graph, the register and annex B.
- **W-X-10** · `repair` · medium — Sentences that say annex B has no logical name, or call a name "proposed" or "to be added"
  - Places in this feature: `specs/128-telemetry-export/spec.md:384`, `:674` — `package:context-budget`
  - Rule: Cite "annex B §B.5" for the name.
- **W-X-11** · `repair` · medium — Sentences and contract files that say a profile row is "needed", "requested", "proposed" or "to be added", or name it by a label P-n
  - Places in this feature: `specs/128-telemetry-export/spec.md:209`, `:223`, `:417`, `:597`; `specs/128-telemetry-export/contracts/config-keys.tsv:2` to `:19` (column `annex_x7_row` says "needed")
  - Rule: Write "row n of annex X §X.7" with the number; in contract files set `row` and the status "confirmed".
  - depends on: W-X-03
- **W-X-20** · `repair` · medium — 218 test names of `test:` lines appear in no task; three tests have no task at all
  - Places in this feature: first place `specs/128-telemetry-export/spec.md:166` (16 names)
  - Rule: Make the test names of `spec.md` and `tasks.md` equal; add a task for a test that has none.
- **W-X-21** · `repair` · medium — `proves:` holds a test name, a phrase or nothing in place of an origin or a requirement id
  - Places in this feature: `specs/128-telemetry-export/tasks.md:34`, `:45`, `:68`, `:143`, `:206`, `:213`, `:217`, `:221`, `:226`, `:233`, `:242`, `:246`, `:256`, `:258` (14 tasks)
  - Rule: Write in each the requirement id whose `test:` line names the test.
- **W-100-16** · `repair` · low — The form of `$id` of a schema file is stated nowhere; the features use four other forms
  - Places in this feature: schema files under `specs/128-telemetry-export/contracts/` (the report names the feature, not the file)
  - Rule: Write `$id` as `urn:specstride:schema:<schema id>`.
- **W-X-31** · `repair` · low — "Gate" written for a check of the build, and bare "gate" for the verification gate
  - Places in this feature: `specs/128-telemetry-export/spec.md:658` — "startup check"
  - Rule: Write "check" for a check of the build; write "verification gate" in full.
- **W-X-33** · `repair` · low — A requirement line names another tier 2 feature in prose and no contract of feature 100
  - Places in this feature: `specs/128-telemetry-export/spec.md:410` (names 111)
  - Rule: In each line name the contract of feature 100 through which the behaviour is consumed (for example annex X §X.2 for the event catalogue, annex X §X.10 for the redaction patterns, annex G §G.7 for the doctor registry).
- **W-X-35** · `accept` · low — Old key spellings in `research.md`, written as history
  - Places in this feature: `specs/128-telemetry-export/research.md:12`, `:35`
  - Rule: No change.

### Feature 129 — 129-run-view-and-status

#### W-129-01 · `repair` · medium — The signal table opens and closes the critic call with `critic.call`; 64 catalogue types have neither a row nor the mark `ignored`

- Findings merged: B-8.2d-014
- Files and lines:
  - Feature 129: `specs/129-run-view-and-status/contracts/signal-table.md:22`; `specs/129-run-view-and-status/tasks.md:31` (T003)
- Change: Add `critic.started` as the opener of the row; add the rows or the mark `ignored` for the other types, on which the test of the table fails; rewrite T003, which names as missing what the catalogue holds (`phase.ended.outcome`, the pairs of a critic call and of a check, `telemetry.delivery`).
- Side that changes: feature 129
- depends on: W-111-02 (Requirements demand events for which the catalogue has no type; the writer drops an event without one)

#### Items owned elsewhere that change files of feature 129

- **W-X-11** · `repair` · medium — Sentences and contract files that say a profile row is "needed", "requested", "proposed" or "to be added", or name it by a label P-n
  - Places in this feature: `specs/129-run-view-and-status/spec.md:205`, `:332`, `:446`
  - Rule: Write "row n of annex X §X.7" with the number; in contract files set `row` and the status "confirmed".
  - depends on: W-X-03
- **W-X-14** · `repair` · medium — The Constitution Check is not in the form of the plan template, or a row gives a reason that does not bear on its principle
  - Places in this feature: `specs/129-run-view-and-status/plan.md:35-65` — add the ✅ marks
  - Rule: Bring the Constitution Check to the form of the plan template, as written in the place.
- **W-X-19** · `repair` · medium — Registering an entry in a registry of another feature is `implements` in some specs and `consumes` in others (EP-14, EP-01)
  - Places in this feature: `specs/129-run-view-and-status/spec.md:310`, `:455` — EP-01: write `consumes`; feature 100 sanctions a second implementer of EP-01 for 107 only (F100-FR-192), and 119 and 102 claim nothing (`specs/102-run-control/spec.md:404`)
  - Rule: Write `implements (an entry)` for the registration of doctor checks; for EP-01 in 129 write `consumes`.
  - depends on: W-ORC-06
- **W-X-25** · `repair` · medium — Logical names of annex B §B.5 that no feature cites
  - Places in this feature: `workspace:current:status-line` (writer: the runtime; F100-FR-229)
  - Rule: Name the logical name of annex B §B.5 in the requirement that writes or reads the state.
- **W-X-33** · `repair` · low — A requirement line names another tier 2 feature in prose and no contract of feature 100
  - Places in this feature: `specs/129-run-view-and-status/spec.md:312` (names 119)
  - Rule: In each line name the contract of feature 100 through which the behaviour is consumed (for example annex X §X.2 for the event catalogue, annex X §X.10 for the redaction patterns, annex G §G.7 for the doctor registry).

### Feature 130 — 130-adapter-dsh

#### W-130-01 · `repair` · critical — The dsh adapter switches no auto-loaded context off for a pass and says nothing of native memory; the plan marks Principle VIII as a pass

- Findings merged: B-8.3c-001, B-8.4b-002 (part)
- Files and lines:
  - Feature 130: `specs/130-adapter-dsh/spec.md:211` (F130-FR-003), `:280` (F130-FR-014), `:591`; `specs/130-adapter-dsh/data-model.md:27`; `specs/130-adapter-dsh/plan.md:71` (row VIII), `:194-197` (Complexity Tracking)
- Change: Add to F130-FR-003, or as a new requirement: what of the profile is loaded into a proposer pass; that the adapter reports each customisation it cannot switch off as null in `capabilities`, with a doctor warning, as F131-FR-014 does; that the state is recorded per run; whether the harness has a native memory (with `status:`), declared in the descriptor as F109-FR-022 asks; and that the critic role is refused when a memory exists and cannot be switched off (F100-FR-082). In `plan.md` mark row VIII as a deviation and add a Complexity Tracking row for the loaded customisations.
- Side that changes: feature 130. Authority: Principle VIII (NON-NEGOTIABLE); rulings 36 and 37; F100-FR-082 (`specs/100-specstride/annexes/C-ports-and-edges.md:131`), F100-FR-113 (`:909`)
- Note: Two rows of Principle VIII are in play. The row that Complexity Tracking holds today is about the prompt in an argument; it is no violation and is removed (item of feature 100 on the weaker proof). The row added here is about loaded customisations. Whether the owner accepts the deviation is the question of the next item.
- depends on: W-100-19 (The weaker proof of a tool-less critic departs from the text of Principle IX and is recorded in no Complexity Tracking)

#### W-130-02 · `queue` · critical — May a dsh pass run with customisations that the adapter cannot switch off? (proposed question Q-03)

- Findings merged: B-8.3c-001 (part)
- Files and lines:
  - Feature 130: `specs/130-adapter-dsh/spec.md:211`, `:280`; `specs/130-adapter-dsh/plan.md:71`
- Question: Ruling 36 says plugins, hooks, skills and MCP servers are off at auth tier 1, and Principle VIII says they are not loaded into a pass unless the consumer opts in. The dsh harness offers no switch that the adapter uses, and F130-FR-014 links every entry of the real home into the throwaway home. Ruling P15 is the one exception to ruling 36 and covers plugin installs only. May dsh be used as proposer with its profile loaded?
- Sources: Constitution v3.0.0, Principle VIII; rulings 36, 37, P14, P15; F100-FR-082; F100-FR-113; F130-FR-003, F130-FR-014; CQ-141 and CQ-142 (other subjects)
- Recommended answer (compiler of this worklist; B-8.3c asks for the question to be queued and proposes the reporting as the repair): Yes, when the consumer names dsh (ruling P14): each customisation that cannot be switched off is reported as null in `capabilities`, warned by the doctor and recorded per run, and the plan records the deviation. The critic role is refused where a native memory exists and cannot be switched off
- If answered otherwise: dsh is refused as proposer outside the `parity` profile until a switch exists, and the requirements on the throwaway home of F130-FR-014 change
- depends on: W-130-01 (The dsh adapter switches no auto-loaded context off for a pass and says nothing of native memory; the plan marks Principle VIII as a pass)

#### Items owned elsewhere that change files of feature 130

- **W-100-19** · `repair` · critical — The weaker proof of a tool-less critic departs from the text of Principle IX and is recorded in no Complexity Tracking
  - Places in this feature: `specs/130-adapter-dsh/plan.md:71-72`, `:91-93`, `:194-197` — remove the row of Principle VIII from Complexity Tracking and say in row VIII that the bounded-argument rule of the principle applies (F130-FR-011); mark row IX as a recorded deviation
  - Rule: Record the weaker proof as a deviation from Principle IX in row IX and in Complexity Tracking.
- **W-100-20** · `queue` · critical — Is the weaker proof of a tool-less critic allowed under Principle IX?
  - Places in this feature: `specs/130-adapter-dsh/plan.md:194-197`
  - Rule: proceed on the recommended answer: Yes, for a tested harness adapter only, recorded for every call as the weaker proof; Principle IX gets a PATCH that names it
  - depends on: W-100-19
- **W-138-02** · `repair` · critical — Ruling P14 is narrowed to the audience `distributed`
  - Places in this feature: `specs/130-adapter-dsh/spec.md:216` (F130-FR-004); F130-FR-030 (`:394`) already bars the automatic pick as critic without a condition
  - Rule: The bar holds under every audience.
- **W-110-03** · `repair` · high — Environment aliases that the alias tables do not hold, and alias tables that are out of step
  - Places in this feature: `specs/130-adapter-dsh/spec.md:611` to `:613`, `:619` — replace "not in the table" by "annex X §X.8" (lines 721, 723, 728 of `specs/100-specstride/annexes/X-cross-layer.md` hold the home, the provider, the plugin time limit and the launcher)
  - Rule: Cite §K.8 of feature 110 or annex X §X.8 for the variable, as written in the place.
  - depends on: W-100-08
- **W-100-23** · `queue` · medium — Does "user config" in rulings 34 and P2 mean the user configuration only?
  - Places in this feature: `specs/130-adapter-dsh/spec.md:305` (F130-FR-018)
  - Rule: proceed on the recommended answer: for ruling P2, the key `loop.parallel.allow_detect` is accepted from user configuration only; change the place only when the orchestrator has queued the question
- **W-X-05** · `repair` · medium — Stale counts in the specs: features, register rows, requirements, profile rows, keys
  - Places in this feature: `specs/130-adapter-dsh/spec.md:720` (DV-001 to DV-103)
  - Rule: Write the count that holds today, or name the register without a count.
  - depends on: W-ORC-03, W-ORC-01, W-ORC-02
- **W-X-07** · `repair` · medium — Plans hold statements that the repository has overtaken (owners and layers of the graph, register rows "to be added", names "to be added" to annex B)
  - Places in this feature: `specs/130-adapter-dsh/plan.md:88` — row XVIII names DV-108 to DV-111 as rows that exist (`docs/ecosystem/consolidation.md:1007-1010`)
  - Rule: State the present state of the package graph, the register and annex B.
- **W-X-11** · `repair` · medium — Sentences and contract files that say a profile row is "needed", "requested", "proposed" or "to be added", or name it by a label P-n
  - Places in this feature: `specs/130-adapter-dsh/spec.md:577` to `:580`, `:597` (annex X "does not hold" its two rows: they are rows 117 and 118); entries without a row in `specs/130-adapter-dsh/contracts/parity-rows.json`
  - Rule: Write "row n of annex X §X.7" with the number; in contract files set `row` and the status "confirmed".
  - depends on: W-X-03
- **W-X-14** · `repair` · medium — The Constitution Check is not in the form of the plan template, or a row gives a reason that does not bear on its principle
  - Places in this feature: `specs/130-adapter-dsh/plan.md:68-69` — add the heading "The product and its edges (VI–XII)"
  - Rule: Bring the Constitution Check to the form of the plan template, as written in the place.
- **W-X-18** · `repair` · medium — The section "Extension points" says `consumes`, and no requirement has an `ep:` line for the point
  - Places in this feature: `specs/130-adapter-dsh/spec.md:536` (EP-10)
  - Rule: Add the line `- ep: EP-nn <id> (consumes)` to the requirement that the row names, or delete the row where no requirement uses the point.
- **W-X-19** · `repair` · medium — Registering an entry in a registry of another feature is `implements` in some specs and `consumes` in others (EP-14, EP-01)
  - Places in this feature: `specs/130-adapter-dsh/spec.md:225`, `:539` (EP-14, `implements`)
  - Rule: Write `implements (an entry)` for the registration of doctor checks; for EP-01 in 129 write `consumes`.
  - depends on: W-ORC-06
- **W-X-20** · `repair` · medium — 218 test names of `test:` lines appear in no task; three tests have no task at all
  - Places in this feature: `specs/130-adapter-dsh/spec.md:395` (`CT-130-30`: no task at all)
  - Rule: Make the test names of `spec.md` and `tasks.md` equal; add a task for a test that has none.
- **W-X-25** · `repair` · medium — Logical names of annex B §B.5 that no feature cites
  - Places in this feature: `specs/130-adapter-dsh/spec.md:33` — `pass:<passId>:critic-patch`
  - Rule: Name the logical name of annex B §B.5 in the requirement that writes or reads the state.
- **W-100-16** · `repair` · low — The form of `$id` of a schema file is stated nowhere; the features use four other forms
  - Places in this feature: schema files under `specs/130-adapter-dsh/contracts/` (the report names the feature, not the file)
  - Rule: Write `$id` as `urn:specstride:schema:<schema id>`.
- **W-X-33** · `repair` · low — A requirement line names another tier 2 feature in prose and no contract of feature 100
  - Places in this feature: `specs/130-adapter-dsh/spec.md:198` (names 126)
  - Rule: In each line name the contract of feature 100 through which the behaviour is consumed (for example annex X §X.2 for the event catalogue, annex X §X.10 for the redaction patterns, annex G §G.7 for the doctor registry).

### Feature 131 — 131-adapter-codex

#### W-131-01 · `repair` · medium — The five capture tasks are not marked paid, and F131-FR-038 says there is no other paid call than the three probes

- Findings merged: B-8.3c-006
- Files and lines:
  - Feature 131: `specs/131-adapter-codex/tasks.md:29-37` (T001 to T005), `:21`; `specs/131-adapter-codex/contracts/captures.json`; `specs/131-adapter-codex/spec.md:415` (F131-FR-037), `:420` (F131-FR-038)
- Change: Mark each capture "paid" or "not paid", as feature 130 does (`specs/130-adapter-dsh/tasks.md:30-36`); captures 1 and 2 need a run of `exec` against the provider. F131-FR-038: "no other paid call than the three probes and the captures marked paid".
- Side that changes: feature 131. Authority: Principle XII; `APPROVAL.md`, "Not approved: any paid probe"
- depends on: W-X-15 (A paid capture is a precondition of unpaid work)

#### W-131-02 · `repair` · low — Under `parity` the prompt is a positional argument with no bound; row VIII says only "outside `parity`"

- Findings merged: B-8.3c-011
- Files and lines:
  - Feature 131: `specs/131-adapter-codex/plan.md:70` (row VIII), `:192`; `specs/131-adapter-codex/spec.md:226` (F131-FR-008)
- Change: Row VIII: add "under `parity` the prompt is an argument, as at the baseline (DV-031); Principle XVIII binds".
- Side that changes: feature 131 (plan)
- depends on: none

#### Items owned elsewhere that change files of feature 131

- **W-110-03** · `repair` · high — Environment aliases that the alias tables do not hold, and alias tables that are out of step
  - Places in this feature: `specs/131-adapter-codex/spec.md:550`, `:551` — `OPENAI_BASE_URL` and `OPENAI_API_KEY` are in annex X §X.8 (line 724)
  - Rule: Cite §K.8 of feature 110 or annex X §X.8 for the variable, as written in the place.
  - depends on: W-100-08
- **W-110-05** · `repair` · medium — Ruling 34: the opt-in to no containment (C0) is accepted from the environment or a flag
  - Places in this feature: `specs/131-adapter-codex/spec.md:241` (F131-FR-010) — "in user configuration" in place of "in user configuration, the environment or a flag"
  - Rule: The opt-in to C0 comes from user configuration only.
- **W-110-09** · `repair` · medium — Three options in user configuration have no key
  - Places in this feature: `specs/131-adapter-codex/spec.md:268` — the opt-in for project instruction files: name the key
  - Rule: Name the key and report it to feature 110.
- **W-127-02** · `repair` · medium — The output `retryable` of `classify` has no value per class, and the adapters differ
  - Places in this feature: `specs/131-adapter-codex/contracts/classifier-entries.json:6` — `provider_other` has no value
  - Rule: Take `retryable` per class from §Q.1 of feature 127.
- **W-X-05** · `repair` · medium — Stale counts in the specs: features, register rows, requirements, profile rows, keys
  - Places in this feature: `specs/131-adapter-codex/spec.md:635` (DV-001 to DV-100)
  - Rule: Write the count that holds today, or name the register without a count.
  - depends on: W-ORC-03, W-ORC-01, W-ORC-02
- **W-X-15** · `repair` · medium — A paid capture is a precondition of unpaid work
  - Places in this feature: `specs/131-adapter-codex/tasks.md:167` ("T043 needs T003"), `:180`; T057 (test CT-131-37): state the skip
  - Rule: No task waits for a paid capture; a test without its fixture is a skip with its reason.
- **W-X-16** · `repair` · medium — The terms gate, its file and the audience are said to belong to feature 110; since the split they belong to 147
  - Places in this feature: `specs/131-adapter-codex/spec.md:647`
  - Rule: Replace 110 by 147 where the terms gate, the terms file or the audience is meant (`specs/147-terms-gate/spec.md:17`); keep 110 for the secret resolvers.
- **W-X-17** · `repair` · medium — Features that touch the critic do not state the critic-diversity rule, its warning, or the identity the test needs
  - Places in this feature: `specs/131-adapter-codex/spec.md:312` (F131-FR-021) — add the last sentence of F130-FR-030; the own-session rule and the identity are stated
  - Rule: State the rule and the warning of F100-FR-024 in the form of F130-FR-030.
  - depends on: W-100-15
- **W-X-19** · `repair` · medium — Registering an entry in a registry of another feature is `implements` in some specs and `consumes` in others (EP-14, EP-01)
  - Places in this feature: `specs/131-adapter-codex/spec.md:219`, `:487` (EP-14, `implements`)
  - Rule: Write `implements (an entry)` for the registration of doctor checks; for EP-01 in 129 write `consumes`.
  - depends on: W-ORC-06

### Feature 134 — 134-adapter-pi

#### W-134-01 · `repair` · medium — "Back end" is written for the provider

- Findings merged: B-8.2a-007
- Files and lines:
  - Feature 134: `specs/134-adapter-pi/spec.md:201`, `:300`, `:491` (14 uses)
  - Feature 147: `specs/147-terms-gate/spec.md:84`, `:123` (F147-FR-007, which uses both names in one requirement), `:144` (F147-FR-011)
- Change: Replace "back end" by "provider", for example "the row of the provider in use".
- Side that changes: features 134 and 147. Authority: glossary rows 37 and 39
- depends on: none

#### Items owned elsewhere that change files of feature 134

- **W-X-01** · `repair` · high — Plans and task lists name packages that the package graph of feature 100 does not hold
  - Places in this feature: `specs/134-adapter-pi/plan.md:35`, `:43`, `:140`, `:147`; `specs/134-adapter-pi/tasks.md:17`, `:42`, `:93` (2 paths under `packages/stream/`) — the adapter in `packages/adapter-pi/` (package `@specstride/adapter-pi`), the dependency `@specstride/adapter-prime` in place of `@specstride/stream`, the dialect row at `packages/adapter-pi/data/dialects/pi.json` (proposal of B-8.3d), registered with the reader of 138
  - Rule: Use the package that the package graph of feature 100 names; change plan and task paths.
  - depends on: W-100-25
- **W-100-23** · `queue` · medium — Does "user config" in rulings 34 and P2 mean the user configuration only?
  - Places in this feature: `specs/134-adapter-pi/spec.md:221` (F134-FR-009)
  - Rule: proceed on the recommended answer: for ruling P2, the key `loop.parallel.allow_detect` is accepted from user configuration only; change the place only when the orchestrator has queued the question
- **W-110-05** · `repair` · medium — Ruling 34: the opt-in to no containment (C0) is accepted from the environment or a flag
  - Places in this feature: `specs/134-adapter-pi/spec.md:215` (F134-FR-008) — the same
  - Rule: The opt-in to C0 comes from user configuration only.
- **W-110-09** · `repair` · medium — Three options in user configuration have no key
  - Places in this feature: `specs/134-adapter-pi/spec.md:269` — the opt-in for the auto-loaded context of pi (extensions, skills, context files, prompt templates): name the key
  - Rule: Name the key and report it to feature 110.
- **W-127-02** · `repair` · medium — The output `retryable` of `classify` has no value per class, and the adapters differ
  - Places in this feature: `specs/134-adapter-pi/contracts/classifier-entries.pi.json:51` — values only for `context_window` and `overload`
  - Rule: Take `retryable` per class from §Q.1 of feature 127.
- **W-X-05** · `repair` · medium — Stale counts in the specs: features, register rows, requirements, profile rows, keys
  - Places in this feature: `specs/134-adapter-pi/spec.md:503` (DV-001 to DV-100)
  - Rule: Write the count that holds today, or name the register without a count.
  - depends on: W-ORC-03, W-ORC-01, W-ORC-02
- **W-X-10** · `repair` · medium — Sentences that say annex B has no logical name, or call a name "proposed" or "to be added"
  - Places in this feature: `specs/134-adapter-pi/spec.md:501`
  - Rule: Cite "annex B §B.5" for the name.
- **W-X-16** · `repair` · medium — The terms gate, its file and the audience are said to belong to feature 110; since the split they belong to 147
  - Places in this feature: `specs/134-adapter-pi/spec.md:510`
  - Rule: Replace 110 by 147 where the terms gate, the terms file or the audience is meant (`specs/147-terms-gate/spec.md:17`); keep 110 for the secret resolvers.
- **W-X-17** · `repair` · medium — Features that touch the critic do not state the critic-diversity rule, its warning, or the identity the test needs
  - Places in this feature: `specs/134-adapter-pi/spec.md:283`, `:296`, `:300` (F134-FR-018, -020, -021) — add one requirement in the form of F130-FR-030
  - Rule: State the rule and the warning of F100-FR-024 in the form of F130-FR-030.
  - depends on: W-100-15
- **W-X-19** · `repair` · medium — Registering an entry in a registry of another feature is `implements` in some specs and `consumes` in others (EP-14, EP-01)
  - Places in this feature: `specs/134-adapter-pi/spec.md:230`, `:399` (EP-14, `consumes`)
  - Rule: Write `implements (an entry)` for the registration of doctor checks; for EP-01 in 129 write `consumes`.
  - depends on: W-ORC-06
- **W-X-28** · `repair` · low — Parity and characterization tests are placed in different directories
  - Places in this feature: `specs/134-adapter-pi/plan.md:148` (`tests/harness/adapters/pi/`)
  - Rule: Use the two directories of feature 100 in plan and task paths.

### Feature 138 — 138-adapter-prime

#### W-138-01 · `repair` · critical — The prime adapter switches no auto-loaded context off for the proposer, uses the real home at auth tier 2 and says nothing of native memory; the plan marks Principle VIII as passed

- Findings merged: B-8.3d-001, B-8.4b-002 (part)
- Files and lines:
  - Feature 138: `specs/138-adapter-prime/plan.md:69` (row VIII), `:164`; `specs/138-adapter-prime/spec.md:228`, `:309` (F138-FR-017); `specs/138-adapter-prime/contracts/argument-table.json:11`, `:16`; `specs/138-adapter-prime/contracts/descriptor-prime.json:20`; `specs/138-adapter-prime/tasks.md`
- Change: Add to `spec.md` two requirements in the form of F134-FR-029 and F134-FR-015: customisations and native memory off for every critic-class call and off by default for the proposer outside `parity`, with a recorded opt-in of the trust class widening (`memory.native.proposer`), recorded per run, no flag under `parity` (row 29); the real home read-only at auth tier 1, a throwaway home from an overlay at auth tier 2, removed after the call. In `contracts/argument-table.json` add the four switches (skills, extensions, context files, prompt templates) to `proposer.bare.default` and `proposer.variant.default`, marked unverified. In `plan.md:69` cite the new requirements. Add the two characterization tests to `tasks.md`.
- Side that changes: feature 138. Authority: Principle VIII (NON-NEGOTIABLE); rulings 36 and 37; F100-FR-082, F100-FR-113
- depends on: none

#### W-138-02 · `repair` · critical — Ruling P14 is narrowed to the audience `distributed`

- Findings merged: B-8.2e-001, B-8.4c-001
- Files and lines:
  - Feature 130: `specs/130-adapter-dsh/spec.md:216` (F130-FR-004); F130-FR-030 (`:394`) already bars the automatic pick as critic without a condition
  - Feature 138: `specs/138-adapter-prime/spec.md:221` (F138-FR-004), `:148` (scenario), `:671` (clarification: "they are barred under `distributed`")
- Change: In F138-FR-004 and F130-FR-004 replace "For the audience `distributed`, … MUST never be a default and MUST never be picked automatically" by "Under every audience … MUST never be a default and MUST never be picked automatically as critic". Correct the scenario at 138:148, and at 138:671 write "the default and the automatic pick are barred under every audience".
- Side that changes: features 138 and 130. Authority: ruling P14 ("never a default; never picked automatically as critic", with no condition); F100-FR-093 (`specs/100-specstride/annexes/C-ports-and-edges.md:323`), F124-FR-036 (`specs/124-harness-discovery-and-roles/spec.md:232`), F147-FR-008 (`specs/147-terms-gate/spec.md:128`)
- Note: Severity by order of the orchestrator: a contradicted ruling is critical (B-8.2e-001); B-8.4c-001 rates the same fault medium. B-8.2e words the repair "Under both audiences", B-8.4c "Under every audience ... as critic"; the second keeps the words of the ruling and holds if a third audience is added.
- depends on: none

#### W-138-03 · `repair` · medium — A tier 2 feature cites a requirement of another tier 2 feature for a value of its own text

- Findings merged: B-8.2f-011
- Files and lines:
  - Feature 138: `specs/138-adapter-prime/spec.md:345` ("row 28 of annex X §X.7, as F117-FR-025 states")
- Change: Delete ", as F117-FR-025 states"; the contract of feature 100 is named in the same line and suffices.
- Side that changes: feature 138
- depends on: none

#### Items owned elsewhere that change files of feature 138

- **W-110-03** · `repair` · high — Environment aliases that the alias tables do not hold, and alias tables that are out of step
  - Places in this feature: `specs/138-adapter-prime/spec.md:214` (F138-FR-003), `:590` — `SPECSTRIDE_PRIME_FLEET_BIN` comes first and `SPECSTRIDE_PRIME_BIN` is read when it is unset, as at the baseline; cite §K.8 for the order
  - Rule: Cite §K.8 of feature 110 or annex X §X.8 for the variable, as written in the place.
  - depends on: W-100-08
- **W-X-01** · `repair` · high — Plans and task lists name packages that the package graph of feature 100 does not hold
  - Places in this feature: `specs/138-adapter-prime/plan.md:45`, `:123-135`, `:150-154` — the placement stands; add how a dialect row of another package is registered with the reader
  - Rule: Use the package that the package graph of feature 100 names; change plan and task paths.
  - depends on: W-100-25
- **W-X-04** · `repair` · high — Old spellings of config keys survive in contract files of the features
  - Places in this feature: `specs/138-adapter-prime/contracts/parity-rows.json:11` — `stream.capture` becomes `stream.tap`
  - Rule: Write the spelling of `config-keys.tsv` of feature 110.
- **W-100-23** · `queue` · medium — Does "user config" in rulings 34 and P2 mean the user configuration only?
  - Places in this feature: `specs/138-adapter-prime/spec.md:293` (F138-FR-015)
  - Rule: proceed on the recommended answer: for ruling P2, the key `loop.parallel.allow_detect` is accepted from user configuration only; change the place only when the orchestrator has queued the question
- **W-127-02** · `repair` · medium — The output `retryable` of `classify` has no value per class, and the adapters differ
  - Places in this feature: `specs/138-adapter-prime/contracts/classifier-entries.json:7` — `provider_other` `retryable: false` becomes `true`
  - Rule: Take `retryable` per class from §Q.1 of feature 127.
- **W-X-05** · `repair` · medium — Stale counts in the specs: features, register rows, requirements, profile rows, keys
  - Places in this feature: `specs/138-adapter-prime/spec.md:668` (DV-001 to DV-100)
  - Rule: Write the count that holds today, or name the register without a count.
  - depends on: W-ORC-03, W-ORC-01, W-ORC-02
- **W-X-09** · `repair` · medium — Principle XVII: no task records the macOS result or a skip with its reason; the row is marked N/A or gives a reason that is not about tests
  - Places in this feature: `specs/138-adapter-prime/plan.md:43`; `specs/138-adapter-prime/tasks.md`
  - Rule: Add the macOS and skip task to `tasks.md`; answer row XVII as a pass with its reason.
- **W-X-16** · `repair` · medium — The terms gate, its file and the audience are said to belong to feature 110; since the split they belong to 147
  - Places in this feature: `specs/138-adapter-prime/spec.md:678`
  - Rule: Replace 110 by 147 where the terms gate, the terms file or the audience is meant (`specs/147-terms-gate/spec.md:17`); keep 110 for the secret resolvers.
- **W-X-17** · `repair` · medium — Features that touch the critic do not state the critic-diversity rule, its warning, or the identity the test needs
  - Places in this feature: `specs/138-adapter-prime/spec.md:309`, `:343` (F138-FR-017, -022) — add one requirement in the form of F130-FR-030; for `prime:<variant>` the model is not visible (F138-FR-022), so the result is `unverified` and the warning is due
  - Rule: State the rule and the warning of F100-FR-024 in the form of F130-FR-030.
  - depends on: W-100-15
- **W-X-19** · `repair` · medium — Registering an entry in a registry of another feature is `implements` in some specs and `consumes` in others (EP-14, EP-01)
  - Places in this feature: `specs/138-adapter-prime/spec.md:235`, `:531` (EP-14, `implements`)
  - Rule: Write `implements (an entry)` for the registration of doctor checks; for EP-01 in 129 write `consumes`.
  - depends on: W-ORC-06
- **W-X-21** · `repair` · medium — `proves:` holds a test name, a phrase or nothing in place of an origin or a requirement id
  - Places in this feature: `specs/138-adapter-prime/tasks.md:65`, `:74`, `:114`, `:117`, `:164`, `:167`, `:202`, `:205`, `:238`, `:263`, `:266`, `:285`, `:298`, `:301` (14 tasks)
  - Rule: Write in each the requirement id whose `test:` line names the test.
- **W-X-33** · `repair` · low — A requirement line names another tier 2 feature in prose and no contract of feature 100
  - Places in this feature: `specs/138-adapter-prime/spec.md:468` (names 134)
  - Rule: In each line name the contract of feature 100 through which the behaviour is consumed (for example annex X §X.2 for the event catalogue, annex X §X.10 for the redaction patterns, annex G §G.7 for the doctor registry).

### Feature 140 — 140-reverse-inventory-and-lint

#### W-140-01 · `repair` · high — The source inventory carries `schema_version` and no field `schema`

- Findings merged: B-8.2c-003
- Files and lines:
  - Feature 140: `specs/140-reverse-inventory-and-lint/spec.md:207` (F140-FR-021), `:327`; `specs/140-reverse-inventory-and-lint/data-model.md:9`; `specs/140-reverse-inventory-and-lint/contracts/inventory.schema.json`
- Change: In F140-FR-021 add the field `schema` with the value `specstride.reverse-inventory/1`, and keep `schema_version` 1 as the as-is field in the compatibility form; add `schema` to `required` in `inventory.schema.json`; cite the id in the table at `:327`. A reader that follows F100-FR-049 refuses a record without the field.
- Side that changes: feature 140. Authority: F100-FR-227 and F100-FR-048; annex B §B.20 (`specs/100-specstride/annexes/B-state.md:676`, `:680`)
- Note: If the byte format must stay as at the baseline, feature 100 states the exception in §B.20; no report asks for it. No requirement of 108 cites the id either; feature 108 needs no change.
- depends on: W-ORC-03 (Register row: the source inventory gains the field `schema`), W-100-16 (The form of `$id` of a schema file is stated nowhere; the features use four other forms)

#### Items owned elsewhere that change files of feature 140

- **W-X-07** · `repair` · medium — Plans hold statements that the repository has overtaken (owners and layers of the graph, register rows "to be added", names "to be added" to annex B)
  - Places in this feature: `specs/140-reverse-inventory-and-lint/plan.md:32` — remove the sentence that the graph lacks 140 as owner of `@specstride/reverse`
  - Rule: State the present state of the package graph, the register and annex B.
- **W-X-09** · `repair` · medium — Principle XVII: no task records the macOS result or a skip with its reason; the row is marked N/A or gives a reason that is not about tests
  - Places in this feature: `specs/140-reverse-inventory-and-lint/plan.md:30`, `:70`; `specs/140-reverse-inventory-and-lint/tasks.md`
  - Rule: Add the macOS and skip task to `tasks.md`; answer row XVII as a pass with its reason.
- **W-X-11** · `repair` · medium — Sentences and contract files that say a profile row is "needed", "requested", "proposed" or "to be added", or name it by a label P-n
  - Places in this feature: `specs/140-reverse-inventory-and-lint/spec.md:182`
  - Rule: Write "row n of annex X §X.7" with the number; in contract files set `row` and the status "confirmed".
  - depends on: W-X-03
- **W-X-20** · `repair` · medium — 218 test names of `test:` lines appear in no task; three tests have no task at all
  - Places in this feature: first place `specs/140-reverse-inventory-and-lint/spec.md:99` (44 names)
  - Rule: Make the test names of `spec.md` and `tasks.md` equal; add a task for a test that has none.
- **W-100-16** · `repair` · low — The form of `$id` of a schema file is stated nowhere; the features use four other forms
  - Places in this feature: `specs/140-reverse-inventory-and-lint/contracts/inventory.schema.json`
  - Rule: Write `$id` as `urn:specstride:schema:<schema id>`.
- **W-X-29** · `repair` · low — Row XIX states no share of the token budget, or no task measures it
  - Places in this feature: `specs/140-reverse-inventory-and-lint/plan.md:76` — state the share in bytes
  - Rule: State the figure in bytes and add a task that measures it with the helper of T194 of feature 100 (`specs/100-specstride/tasks.md:555`).
- **W-X-30** · `repair` · low — Absolute paths of the owner's machine in task text and research
  - Places in this feature: `specs/140-reverse-inventory-and-lint/research.md:11`
  - Rule: Write "the Specstride baseline at `9cab15d`" and "the Lisa baseline at `363e6a3`" without a path.
- **W-X-34** · `accept` · low — Analyze reports cite old ids of the splits in sentences about the split
  - Places in this feature: `specs/140-reverse-inventory-and-lint/analyze-report.md:9`
  - Rule: No change.

### Feature 141 — 141-parity-oracle

#### W-141-01 · `queue` · medium — May a fixture change the reference tree or shadow the interpreter to reach a line? (proposed question Q-11)

- Findings merged: none (the placeholder `CQ-pending-141-1` was found when the places of the item on placeholders were compiled; no report lists it)
- Files and lines:
  - Feature 141: `specs/141-parity-oracle/spec.md:1013` (`CQ-pending-141-1`); F141-FR-002, F141-FR-033
- Question: May a fixture of FX-18 or FX-26 change the reference tree, or shadow the interpreter, to reach a line that runs only when a file of the reference is missing or cannot be written?
- Sources: `specs/141-parity-oracle/spec.md:1013`; the fixture catalogue of feature 141, §O.3
- Recommended answer (feature 141, in its own table of readings; no review report): No. The reference tree is read-only and a stub takes only the names of §O.3. An item that no fixture reaches goes to the correction list
- If answered otherwise: Fixtures may change the reference tree, and the rule that the baselines run unchanged from a read-only tree gets an exception
- depends on: none

#### W-141-02 · `queue` · medium — Which are the error classes of the validation of a launch contract? (proposed question Q-12)

- Findings merged: none (the placeholder `CQ-pending-141-2` was found when the places of the item on placeholders were compiled; no report lists it)
- Files and lines:
  - Feature 107: state the ten validators as a closed set, and report it to the orchestrator for annex X §X.6
  - Feature 141: `specs/141-parity-oracle/spec.md:764` (assumption of F141-FR-030), `:1014` (`CQ-pending-141-2`), `:207` (FX-33)
- Question: Which are the error classes of the validation of a launch contract? No closed set of feature 100 holds them.
- Sources: `specs/141-parity-oracle/spec.md:1014`; fixture family FX-33 (`specs/141-parity-oracle/spec.md:207`); annex X §X.6
- Recommended answer (feature 141, in its own table of readings; no review report): The ten validators of the baseline, as the table of pattern members names them; feature 107 states them as a closed set
- If answered otherwise: The classes of FX-33 stay a list of the oracle, and no closed set is added
- depends on: none

#### W-141-03 · `repair` · low — A logical name is written with the parameter `<phase>`

- Findings merged: B-8.2c-014
- Files and lines:
  - Feature 141: `specs/141-parity-oracle/contracts/register-map.json:337` (`gate:<phase>:approved`)
- Change: Write `gate:<N>:approved`, as annex B does.
- Side that changes: feature 141
- depends on: none

#### Items owned elsewhere that change files of feature 141

- **W-100-14** · `repair` · medium — "Iteration" as a counted unit, and four names for one limit
  - Places in this feature: "iteration limit" (lines not given in the report)
  - Rule: Write "pass limit" and "pass count"; "iteration" survives only in the literals `MAX_ITER`, `iter_*` and `giveIterationBack`.
- **W-100-26** · `queue` · medium — Are tools of the build that are never shipped outside the Language Ledger?
  - Places in this feature: `specs/141-parity-oracle/plan.md:36`, `:71` (state the answer here), `:95-98`, `:160`, `:181`; `specs/141-parity-oracle/tasks.md:48` (T003), `:288` (T082), `:296` (T086)
  - Rule: proceed on the recommended answer: state in the plan that Python 3 is a requirement of development and that no Python file is in a published package
  - depends on: W-100-21
- **W-X-05** · `repair` · medium — Stale counts in the specs: features, register rows, requirements, profile rows, keys
  - Places in this feature: `specs/141-parity-oracle/spec.md:597`, `:826` (DV-001 to DV-094); `specs/141-parity-oracle/plan.md:52` (2,783 behaviour items: 2,785, `docs/ecosystem/PROGRESS.md:462`); `specs/141-parity-oracle/spec.md:776` ("reads rows 1 to 43": "rows 1 to 129")
  - Rule: Write the count that holds today, or name the register without a count.
  - depends on: W-ORC-03, W-ORC-01, W-ORC-02
- **W-X-06** · `repair` · medium — "Run" and "engine invocation" written for one engine start
  - Places in this feature: `specs/141-parity-oracle/spec.md:101` — "a second engine start while the lock is held"
  - Rule: Write "engine start" where one start of the engine is meant (ruling 24).
- **W-X-13** · `repair` · medium — `CQ-pending-<n>` placeholders remain, and one row carries the number of another question
  - Places in this feature: `specs/141-parity-oracle/spec.md:764`, `:1013`, `:1014` — `CQ-pending-141-1` and `CQ-pending-141-2` become the numbers that the orchestrator gives to the two questions of feature 141 (items of feature 141)
  - Rule: Replace the placeholder as written in the place.
  - depends on: W-141-01, W-141-02
- **W-X-18** · `repair` · medium — The section "Extension points" says `consumes`, and no requirement has an `ep:` line for the point
  - Places in this feature: `specs/141-parity-oracle/spec.md:757-759` (EP-08, EP-02, EP-04)
  - Rule: Add the line `- ep: EP-nn <id> (consumes)` to the requirement that the row names, or delete the row where no requirement uses the point.
- **W-100-16** · `repair` · low — The form of `$id` of a schema file is stated nowhere; the features use four other forms
  - Places in this feature: schema files under `specs/141-parity-oracle/contracts/` (the report names the feature, not the file)
  - Rule: Write `$id` as `urn:specstride:schema:<schema id>`.

### Feature 142 — 142-parallel-units

#### W-142-01 · `repair` · low — F142-FR-022 lists six keys of the `[LOOP]` line and names wall hours and agent hours in prose only

- Findings merged: B-8.2b-011
- Files and lines:
  - Feature 142: `specs/142-parallel-units/spec.md:284` (F142-FR-022)
- Change: Add `wall-hours=` and `agent-hours=` to the list of keys.
- Side that changes: feature 142. Authority: annex G §G.3, row "Loop line" (keys `worker-caches`, `wall-hours`, `agent-hours`)
- depends on: none

#### Items owned elsewhere that change files of feature 142

- **W-111-03** · `repair` · high — `parallel.admission` and `parallel.integration` lack the fields that F142-FR-025 requires
  - Places in this feature: `specs/142-parallel-units/spec.md:295` (F142-FR-025) — no change; it is the requirement that the fields serve
  - Rule: Add `taskId` to `parallel.admission`, and `step`, `pathCount` to `parallel.integration`.
- **W-100-06** · `repair` · medium — Ruling P5: the ceiling of four workers is a constant, the ruling says "both configurable"
  - Places in this feature: `specs/142-parallel-units/spec.md:272` (F142-FR-019); `specs/142-parallel-units/tasks.md:78` (T022)
  - Rule: State the key of the ceiling of workers (default 4) that feature 100 adds; a value of `loop.parallel.workers` above it is the configuration error.
- **W-100-14** · `repair` · medium — "Iteration" as a counted unit, and four names for one limit
  - Places in this feature: `specs/142-parallel-units/spec.md:281`
  - Rule: Write "pass limit" and "pass count"; "iteration" survives only in the literals `MAX_ITER`, `iter_*` and `giveIterationBack`.
- **W-100-23** · `queue` · medium — Does "user config" in rulings 34 and P2 mean the user configuration only?
  - Places in this feature: `specs/142-parallel-units/spec.md:206` (F142-FR-003)
  - Rule: proceed on the recommended answer: for ruling P2, the key `loop.parallel.allow_detect` is accepted from user configuration only; change the place only when the orchestrator has queued the question
- **W-143-01** · `repair` · medium — Task T068 of 143 writes a file of the package of 142, which may not call a write of the file system
  - Places in this feature: `specs/142-parallel-units/plan.md:124` — no change, unless the task moves to 142
  - Rule: Move T068 to `packages/core/src/parallel/` in the task list of 143, or move the task to 142.
- **W-X-11** · `repair` · medium — Sentences and contract files that say a profile row is "needed", "requested", "proposed" or "to be added", or name it by a label P-n
  - Places in this feature: `specs/142-parallel-units/spec.md:236`, `:253`
  - Rule: Write "row n of annex X §X.7" with the number; in contract files set `row` and the status "confirmed".
  - depends on: W-X-03
- **W-X-12** · `repair` · medium — Tables of closed sets and sentences written before the amendments to annex X §X.6
  - Places in this feature: `specs/142-parallel-units/spec.md:526` — row 65 belongs to 116
  - Rule: Write the row number of annex X §X.6 in place of "new" or "none yet".
  - depends on: W-100-02
- **W-X-18** · `repair` · medium — The section "Extension points" says `consumes`, and no requirement has an `ep:` line for the point
  - Places in this feature: `specs/142-parallel-units/spec.md:452` (EP-16)
  - Rule: Add the line `- ep: EP-nn <id> (consumes)` to the requirement that the row names, or delete the row where no requirement uses the point.
- **W-111-09** · `repair` · low — `workerId` "in `data` only" against `workerId` and `wseq` on "every event of a worker"
  - Places in this feature: `specs/142-parallel-units/spec.md:295` (F142-FR-025) — no change
  - Rule: Add to F111-FR-015: the seven `parallel.*` events are events of the main line about a worker.
- **W-X-34** · `accept` · low — Analyze reports cite old ids of the splits in sentences about the split
  - Places in this feature: `specs/142-parallel-units/analyze-report.md:13`
  - Rule: No change.

### Feature 143 — 143-parallel-engine-services

#### W-143-01 · `repair` · medium — Task T068 of 143 writes a file of the package of 142, which may not call a write of the file system

- Findings merged: B-8.3d-010
- Files and lines:
  - Feature 142: `specs/142-parallel-units/plan.md:124` — no change, unless the task moves to 142
  - Feature 143: `specs/143-parallel-engine-services/tasks.md:192` (T068: `packages/layer-parallel/src/decide.ts`); `specs/143-parallel-engine-services/plan.md:112-126`
- Change: Move T068 to `packages/core/src/parallel/` in the task list of 143, or move the task to 142.
- Side that changes: feature 143 (task list)
- depends on: none

#### Items owned elsewhere that change files of feature 143

- **W-100-07** · `repair` · medium — Closed set 64 (operations of the tree store) is marked "Owner decision"
  - Places in this feature: `specs/143-parallel-engine-services/spec.md:389` (table of closed sets)
  - Rule: Write "Design" in the column "Closed by" of the set.
- **W-X-07** · `repair` · medium — Plans hold statements that the repository has overtaken (owners and layers of the graph, register rows "to be added", names "to be added" to annex B)
  - Places in this feature: `specs/143-parallel-engine-services/plan.md:86-87` — remove the sentence that the graph has no package for the tree store
  - Rule: State the present state of the package graph, the register and annex B.
- **W-X-11** · `repair` · medium — Sentences and contract files that say a profile row is "needed", "requested", "proposed" or "to be added", or name it by a label P-n
  - Places in this feature: `specs/143-parallel-engine-services/spec.md:185`
  - Rule: Write "row n of annex X §X.7" with the number; in contract files set `row` and the status "confirmed".
  - depends on: W-X-03
- **W-X-12** · `repair` · medium — Tables of closed sets and sentences written before the amendments to annex X §X.6
  - Places in this feature: `specs/143-parallel-engine-services/spec.md:390`, `:392` — remove the sentence that annex X names 142 for rows 62 and 64; the ledger record kinds are row 184, not "none yet"
  - Rule: Write the row number of annex X §X.6 in place of "new" or "none yet".
  - depends on: W-100-02
- **W-X-28** · `repair` · low — Parity and characterization tests are placed in different directories
  - Places in this feature: `specs/143-parallel-engine-services/plan.md:127-129` (`tests/parallel/143/`)
  - Rule: Use the two directories of feature 100 in plan and task paths.

### Feature 144 — 144-compatibility-projection

#### W-144-01 · `repair` · high — The projection selects rows of `yield.ended` by outcomes that are not members of closed set 112

- Findings merged: B-8.2d-005
- Files and lines:
  - Feature 144: `specs/144-compatibility-projection/contracts/projection-table.tsv:91`-`:93`; `specs/144-compatibility-projection/data-model.md`
- Change: Use `satisfied`, `timeout`, `stop` in place of `resumed`, `timeout`, `stopped`, and add a row for `wall_budget` that projects to nothing.
- Side that changes: feature 144. Authority: row 112 of annex X §X.6 (`specs/100-specstride/annexes/X-cross-layer.md:283`, owner 118; `specs/118-pass-supervision-and-jobs/spec.md:467`)
- depends on: none

#### W-144-02 · `repair` · medium — The as-is event file of one engine start is named without `<k>`

- Findings merged: B-8.2c-006
- Files and lines:
  - Feature 144: `specs/144-compatibility-projection/spec.md:105` (F144-FR-008), `:175`; `specs/144-compatibility-projection/data-model.md:9`; `specs/144-compatibility-projection/plan.md:20`
- Change: Write `run:<runId>:events-legacy:<k>` and cite F100-FR-229; the name without `<k>` resolves to the file of the newest engine start.
- Side that changes: feature 144. Authority: annex B §B.5 (`specs/100-specstride/annexes/B-state.md:180`, `:245`, `:291`)
- Note: CQ-033 is closed by an item of section 4.
- depends on: none

#### W-144-03 · `repair` · low — Row V says "the sink is skipped when slow"; no requirement says so

- Findings merged: B-8.3d-011 (part)
- Files and lines:
  - Feature 144: `specs/144-compatibility-projection/plan.md:34`
- Change: Remove the clause, or add the requirement to `spec.md` (F100-FR-104 does not hold it).
- Side that changes: feature 144 (plan)
- depends on: W-X-14 (The Constitution Check is not in the form of the plan template, or a row gives a reason that does not bear on its principle)

#### Items owned elsewhere that change files of feature 144

- **W-111-02** · `repair` · high — Requirements demand events for which the catalogue has no type; the writer drops an event without one
  - Places in this feature: `specs/144-compatibility-projection/contracts/projection-table.tsv` — one row per new type that projects to nothing
  - Rule: Name in the requirement the catalogue type that carries the event.
- **W-X-01** · `repair` · high — Plans and task lists name packages that the package graph of feature 100 does not hold
  - Places in this feature: `specs/144-compatibility-projection/plan.md:23`, `:61`; `specs/144-compatibility-projection/tasks.md:13` (11 paths) — a directory of `packages/observability/` in place of `sink-projection`
  - Rule: Use the package that the package graph of feature 100 names; change plan and task paths.
  - depends on: W-100-25
- **W-111-04** · `repair` · medium — The projection renders fields of `tool.call` and `pass.halted` that the catalogue types do not have
  - Places in this feature: `specs/144-compatibility-projection/contracts/projection-table.tsv:64`, `:53` — settle `yield` against `yields` in the row of `pass.halted`
  - Rule: Use the field names of the catalogue type.
- **W-111-05** · `repair` · medium — The causes of `pass.ended` and `attempt.ended` and the outcome of `phase.ended` are no closed sets; the `data` field `cause` has the name of an envelope field
  - Places in this feature: `specs/144-compatibility-projection/contracts/projection-table.tsv` — the rows select by `hard_cap` and `no_progress`; use the renamed field
  - Rule: Use the members and the field name that feature 111 states.
- **W-X-09** · `repair` · medium — Principle XVII: no task records the macOS result or a skip with its reason; the row is marked N/A or gives a reason that is not about tests
  - Places in this feature: `specs/144-compatibility-projection/plan.md:22`, `:46`; `specs/144-compatibility-projection/tasks.md`
  - Rule: Add the macOS and skip task to `tasks.md`; answer row XVII as a pass with its reason.
- **W-X-10** · `repair` · medium — Sentences that say annex B has no logical name, or call a name "proposed" or "to be added"
  - Places in this feature: `specs/144-compatibility-projection/spec.md:245` — `run:<runId>:events-legacy:<k>`
  - Rule: Cite "annex B §B.5" for the name.
- **W-X-14** · `repair` · medium — The Constitution Check is not in the form of the plan template, or a row gives a reason that does not bear on its principle
  - Places in this feature: `specs/144-compatibility-projection/plan.md:28-51` — add the gate line, the group headings, the `Input` line and the section Complexity Tracking; cite the requirement behind each pass
  - Rule: Bring the Constitution Check to the form of the plan template, as written in the place.
- **W-X-30** · `repair` · low — Absolute paths of the owner's machine in task text and research
  - Places in this feature: `specs/144-compatibility-projection/research.md:9`
  - Rule: Write "the Specstride baseline at `9cab15d`" and "the Lisa baseline at `363e6a3`" without a path.

### Feature 145 — 145-presenter

No item of its own.

#### Items owned elsewhere that change files of feature 145

- **W-X-06** · `repair` · medium — "Run" and "engine invocation" written for one engine start
  - Places in this feature: `specs/145-presenter/spec.md:84`, `:150` (F145-FR-006) — "retargeted to the file of a new engine start"; the as-is literal `────── new run ──────` stays
  - Rule: Write "engine start" where one start of the engine is meant (ruling 24).
- **W-X-09** · `repair` · medium — Principle XVII: no task records the macOS result or a skip with its reason; the row is marked N/A or gives a reason that is not about tests
  - Places in this feature: `specs/145-presenter/plan.md:53`, `:19`, `:21` (answer XVII as a pass with its reason: the feature has tests on a pseudo-terminal); `specs/145-presenter/tasks.md`
  - Rule: Add the macOS and skip task to `tasks.md`; answer row XVII as a pass with its reason.
- **W-X-11** · `repair` · medium — Sentences and contract files that say a profile row is "needed", "requested", "proposed" or "to be added", or name it by a label P-n
  - Places in this feature: `specs/145-presenter/spec.md:109`
  - Rule: Write "row n of annex X §X.7" with the number; in contract files set `row` and the status "confirmed".
  - depends on: W-X-03
- **W-X-14** · `repair` · medium — The Constitution Check is not in the form of the plan template, or a row gives a reason that does not bear on its principle
  - Places in this feature: `specs/145-presenter/plan.md:31-60` — one row per principle (XIII, XIV, XV, XVI, XVII, XX stand in one row), a reason for each of the eight answers "N/A", the requirement behind each pass
  - Rule: Bring the Constitution Check to the form of the plan template, as written in the place.
- **W-X-20** · `repair` · medium — 218 test names of `test:` lines appear in no task; three tests have no task at all
  - Places in this feature: first place `specs/145-presenter/spec.md:101` (14 names)
  - Rule: Make the test names of `spec.md` and `tasks.md` equal; add a task for a test that has none.
- **W-123-04** · `repair` · low — `NO_COLOR` is read in two ways, and four variables of the platform are in no alias table
  - Places in this feature: `specs/145-presenter/spec.md:182` (`NO_COLOR` "set and non-empty"; also `FORCE_COLOR`, `TERM`, `COLORTERM`)
  - Rule: State that the reading of `NO_COLOR` is the baseline's, with the behaviour item.
- **W-X-34** · `accept` · low — Analyze reports cite old ids of the splits in sentences about the split
  - Places in this feature: `specs/145-presenter/analyze-report.md:17`
  - Rule: No change.
- **W-X-36** · `accept` · low — Literals of a contract or of the baseline that keep a retired word
  - Places in this feature: the as-is literal `────── new run ──────`
  - Rule: No change to the literal.

### Feature 146 — 146-harness-discovery

#### W-146-01 · `repair` · high — The writer (109) and the reader (146) of the result of `harness verify` name four of its five fields differently

- Findings merged: B-8.2c-001
- Files and lines:
  - Feature 109: `specs/109-harness-seam/data-model.md:84-91` — cite the field list of 146 and drop "proposed"
  - Feature 146: `specs/146-harness-discovery/data-model.md:30-40`; `specs/146-harness-discovery/contracts/schemas/harness-verify-result.schema.json`; `specs/146-harness-discovery/spec.md:376`
- Change: Fix one field list in feature 146, the owner that annex B §B.20 names: `schema`, `harness`, `version`, `descriptorHash`, `at`, `outcome`, `cases`, `budget`, with `schema` required in the schema file. Both data models drop the sentence that feature 100 gives no schema.
- Side that changes: features 146 and 109. Authority: annex B §B.5 (`specs/100-specstride/annexes/B-state.md:140`: "harness, version, hash of the descriptor, date, outcome") and §B.20 (`:673`, owner 146)
- depends on: W-100-16 (The form of `$id` of a schema file is stated nowhere; the features use four other forms)

#### Items owned elsewhere that change files of feature 146

- **W-100-13** · `repair` · medium — `spec.md` names a sub-point "discovery: 146" of EP-02 that annex C, the contract and the briefs do not have
  - Places in this feature: `specs/146-harness-discovery/spec.md:255` — no change: all 11 `ep:` lines say `consumes`
  - Rule: No change in this feature.
- **W-X-07** · `repair` · medium — Plans hold statements that the repository has overtaken (owners and layers of the graph, register rows "to be added", names "to be added" to annex B)
  - Places in this feature: `specs/146-harness-discovery/plan.md:143-144` — remove the sentence that the graph lacks owner 146 of `@specstride/harness`
  - Rule: State the present state of the package graph, the register and annex B.
- **W-X-11** · `repair` · medium — Sentences and contract files that say a profile row is "needed", "requested", "proposed" or "to be added", or name it by a label P-n
  - Places in this feature: `specs/146-harness-discovery/contracts/config-keys.json:8` to `:22`; entries without a row in `specs/146-harness-discovery/contracts/parity-rows.json`
  - Rule: Write "row n of annex X §X.7" with the number; in contract files set `row` and the status "confirmed".
  - depends on: W-X-03
- **W-X-18** · `repair` · medium — The section "Extension points" says `consumes`, and no requirement has an `ep:` line for the point
  - Places in this feature: `specs/146-harness-discovery/spec.md:257` (EP-14)
  - Rule: Add the line `- ep: EP-nn <id> (consumes)` to the requirement that the row names, or delete the row where no requirement uses the point.
- **W-X-25** · `repair` · medium — Logical names of annex B §B.5 that no feature cites
  - Places in this feature: `package:catalogue` (readers: harness layer, doctor; B-8.2c found no requirement that reads it by name)
  - Rule: Name the logical name of annex B §B.5 in the requirement that writes or reads the state.

### Feature 147 — 147-terms-gate

No item of its own.

#### Items owned elsewhere that change files of feature 147

- **W-111-02** · `repair` · high — Requirements demand events for which the catalogue has no type; the writer drops an event without one
  - Places in this feature: `specs/147-terms-gate/spec.md:133` — a fallback entry skipped by the terms gate; a use of `distribution.termsOverride`: name the types
  - Rule: Name in the requirement the catalogue type that carries the event.
- **W-X-01** · `repair` · high — Plans and task lists name packages that the package graph of feature 100 does not hold
  - Places in this feature: `specs/147-terms-gate/plan.md:30`, `:88`, `:94`; `specs/147-terms-gate/tasks.md:22` — the code in `packages/policy/src/terms/` (package `@specstride/policy`, owners 110, 127, 147); role resolution and the doctor receive `evaluate` from the composition root through the interface of EP-11 in `contracts`, as plan 124 says (`specs/124-harness-discovery-and-roles/plan.md:31`). `@specstride/harness` and `@specstride/doctor` may not import a package `terms` (rule LR-1)
  - Rule: Use the package that the package graph of feature 100 names; change plan and task paths.
  - depends on: W-100-25
- **W-134-01** · `repair` · medium — "Back end" is written for the provider
  - Places in this feature: `specs/147-terms-gate/spec.md:84`, `:123` (F147-FR-007, which uses both names in one requirement), `:144` (F147-FR-011)
  - Rule: Write "provider" for "back end".
- **W-X-09** · `repair` · medium — Principle XVII: no task records the macOS result or a skip with its reason; the row is marked N/A or gives a reason that is not about tests
  - Places in this feature: `specs/147-terms-gate/plan.md:28`; `specs/147-terms-gate/tasks.md`
  - Rule: Add the macOS and skip task to `tasks.md`; answer row XVII as a pass with its reason.
- **W-X-14** · `repair` · medium — The Constitution Check is not in the form of the plan template, or a row gives a reason that does not bear on its principle
  - Places in this feature: `specs/147-terms-gate/plan.md:38-72` — a reason for IV, XIV, XVI and XX; name v3.0.0; add the section Complexity Tracking; cite the requirement behind each pass
  - Rule: Bring the Constitution Check to the form of the plan template, as written in the place.
- **W-X-18** · `repair` · medium — The section "Extension points" says `consumes`, and no requirement has an `ep:` line for the point
  - Places in this feature: `specs/147-terms-gate/spec.md:207` (EP-02)
  - Rule: Add the line `- ep: EP-nn <id> (consumes)` to the requirement that the row names, or delete the row where no requirement uses the point.
- **W-X-27** · `repair` · medium — One schema validator and one YAML parser: plans leave the choice open or name the validator as their own dependency
  - Places in this feature: `specs/147-terms-gate/plan.md:22`; the last line of `specs/147-terms-gate/research.md` — "`@specstride/contracts` (schema types), `@specstride/kernel` (the table evaluator), the JSON Schema validator that feature 100 chose"
  - Rule: Refer to the validator that feature 100 chose and to the YAML parser that feature 110 names.

### Feature 148 — 148-check-runner

#### W-148-01 · `repair` · medium — Two field lists for what is stored at `unit:<unitId>:check:<i>`

- Findings merged: B-8.2c-008
- Files and lines:
  - Feature 116: `specs/116-check-integrity-and-unit-evidence/data-model.md:36-42` — no change; the stored record of the owner
  - Feature 148: `specs/148-check-runner/data-model.md:10`
- Change: State that the result of 148 is a returned value and that the stored record has the fields of `specstride.check-result/1` of feature 116; name the mapping `commandId` to `id` and `exitCode` to `exit`, or take one spelling in both.
- Side that changes: feature 148. Authority: annex B §B.5 (`specs/100-specstride/annexes/B-state.md:209`)
- depends on: W-100-02 (Owners that were not moved with the split 115 → 116 (EP-16, the fact block, two schema ids, closed sets 142 and 143, the package `@specstride/integrity`))

#### Items owned elsewhere that change files of feature 148

- **W-100-02** · `repair` · high — Owners that were not moved with the split 115 → 116 (EP-16, the fact block, two schema ids, closed sets 142 and 143, the package `@specstride/integrity`)
  - Places in this feature: `specs/148-check-runner/spec.md:37` — write 116 for the same owner
  - Rule: Write 116 for the owner; feature 100 is corrected first.
- **W-111-02** · `repair` · high — Requirements demand events for which the catalogue has no type; the writer drops an event without one
  - Places in this feature: `specs/148-check-runner/spec.md:253` — the lowering of parallelism: name the type
  - Rule: Name in the requirement the catalogue type that carries the event.
- **W-X-04** · `repair` · high — Old spellings of config keys survive in contract files of the features
  - Places in this feature: `specs/148-check-runner/contracts/parity-rows.json:55` — `verification.env_allowlist` becomes `verification.envAllowlist`
  - Rule: Write the spelling of `config-keys.tsv` of feature 110.
- **W-X-06** · `repair` · medium — "Run" and "engine invocation" written for one engine start
  - Places in this feature: `specs/148-check-runner/spec.md:127`, `:132` — "a later execution of the command may resume from that step", "a resumed execution"
  - Rule: Write "engine start" where one start of the engine is meant (ruling 24).
- **W-X-07** · `repair` · medium — Plans hold statements that the repository has overtaken (owners and layers of the graph, register rows "to be added", names "to be added" to annex B)
  - Places in this feature: `specs/148-check-runner/plan.md:43`, `:140-142` — remove the sentence that the graph lacks `@specstride/check-runner`
  - Rule: State the present state of the package graph, the register and annex B.
- **W-X-11** · `repair` · medium — Sentences and contract files that say a profile row is "needed", "requested", "proposed" or "to be added", or name it by a label P-n
  - Places in this feature: `specs/148-check-runner/spec.md:176`; entries without a row in `specs/148-check-runner/contracts/parity-rows.json`
  - Rule: Write "row n of annex X §X.7" with the number; in contract files set `row` and the status "confirmed".
  - depends on: W-X-03
- **W-X-12** · `repair` · medium — Tables of closed sets and sentences written before the amendments to annex X §X.6
  - Places in this feature: `specs/148-check-runner/spec.md:394`, `:395`
  - Rule: Write the row number of annex X §X.6 in place of "new" or "none yet".
  - depends on: W-100-02

### Feature 149 — 149-attempt-planner-and-seams

No item of its own.

#### Items owned elsewhere that change files of feature 149

- **W-X-09** · `repair` · medium — Principle XVII: no task records the macOS result or a skip with its reason; the row is marked N/A or gives a reason that is not about tests
  - Places in this feature: `specs/149-attempt-planner-and-seams/plan.md:78`; `specs/149-attempt-planner-and-seams/tasks.md`
  - Rule: Add the macOS and skip task to `tasks.md`; answer row XVII as a pass with its reason.
- **W-X-18** · `repair` · medium — The section "Extension points" says `consumes`, and no requirement has an `ep:` line for the point
  - Places in this feature: `specs/149-attempt-planner-and-seams/spec.md:271` (EP-05)
  - Rule: Add the line `- ep: EP-nn <id> (consumes)` to the requirement that the row names, or delete the row where no requirement uses the point.
- **W-X-28** · `repair` · low — Parity and characterization tests are placed in different directories
  - Places in this feature: `specs/149-attempt-planner-and-seams/plan.md:128` (`tests/own/149/`)
  - Rule: Use the two directories of feature 100 in plan and task paths.

## 3. Across features

Each item needs the same edit in many features. The full list of places is here; each feature's section
repeats its own places as a pointer.

### W-X-01 · `repair` · high — Plans and task lists name packages that the package graph of feature 100 does not hold

- Findings merged: B-8.2f-003, B-8.2f-004, B-8.2f-005, B-8.3a-003, B-8.3b-002, B-8.3c-002, B-8.3c-003, B-8.3d-002, B-8.3d-003
- Files and lines:
  - Feature 107: `specs/107-launch-contract/plan.md:23`, `:90`; `specs/107-launch-contract/tasks.md:13` (T002) and 53 further task paths — replace `packages/launch-contract` by `packages/pipeline`, with a directory per subject (for example `packages/pipeline/src/contract/`); state layer L5 and the imports the graph allows. The graph names `@specstride/pipeline` for 107 and 123, and plan 123 builds there (`specs/123-pipeline-runtime-and-supervisor/plan.md:35`, `:110`)
  - Feature 111: `specs/111-event-schema-and-projection/plan.md:24`, `:32`, `:104`, `:114`; `specs/111-event-schema-and-projection/tasks.md:21` and every path `packages/events/` (43 paths) — the redactor in `packages/kernel/src/redactor/` (the graph: `@specstride/kernel`, owner "111 (redactor)"); catalogue, writer, ingress and dispatcher in `packages/observability/` (L1, owners 111, 128, 144). At `plan.md:114` drop "the writer and the redactor are core". Plans 117 (`specs/117-critic-grounding-and-prompt/plan.md:40`) and 119 (`specs/119-front-door-and-presenter/plan.md:15`) already import the redactor from the kernel and do not change
  - Feature 115: `specs/115-micro-loop-layer/plan.md:48`, `:146`, `:166` (`@specstride/layer-micro-io`) — use the atomic write of `@specstride/kernel` and the ports of `@specstride/integrity`, which feature 116 plans (`specs/116-check-integrity-and-unit-evidence/plan.md:38`); F100-FR-234 names three edge packages in Wave 1 and no fourth
  - Feature 126: `specs/126-stream-seam-and-invocation/plan.md:23`, `:80-93`, `:96`; `specs/126-stream-seam-and-invocation/tasks.md:10` (T002) — registry, readers and tap in `packages/harness/src/stream/`; the invocation artifacts in a directory of `@specstride/harness`; state that the engine reaches reconciliation through an interface of `contracts`. Features 130 and 131 already take the registry from `@specstride/harness` (`specs/130-adapter-dsh/plan.md:39`)
  - Feature 128: `specs/128-telemetry-export/plan.md:34`, `:112`; `specs/128-telemetry-export/tasks.md:24` and every task path under `packages/telemetry/` (47 lines) — a directory of `packages/observability/` (for example `packages/observability/src/export/`); add `@specstride/kernel` to the dependency line, because the exporter uses the redaction point
  - Feature 134: `specs/134-adapter-pi/plan.md:35`, `:43`, `:140`, `:147`; `specs/134-adapter-pi/tasks.md:17`, `:42`, `:93` (2 paths under `packages/stream/`) — the adapter in `packages/adapter-pi/` (package `@specstride/adapter-pi`), the dependency `@specstride/adapter-prime` in place of `@specstride/stream`, the dialect row at `packages/adapter-pi/data/dialects/pi.json` (proposal of B-8.3d), registered with the reader of 138
  - Feature 138: `specs/138-adapter-prime/plan.md:45`, `:123-135`, `:150-154` — the placement stands; add how a dialect row of another package is registered with the reader
  - Feature 144: `specs/144-compatibility-projection/plan.md:23`, `:61`; `specs/144-compatibility-projection/tasks.md:13` (11 paths) — a directory of `packages/observability/` in place of `sink-projection`
  - Feature 147: `specs/147-terms-gate/plan.md:30`, `:88`, `:94`; `specs/147-terms-gate/tasks.md:22` — the code in `packages/policy/src/terms/` (package `@specstride/policy`, owners 110, 127, 147); role resolution and the doctor receive `evaluate` from the composition root through the interface of EP-11 in `contracts`, as plan 124 says (`specs/124-harness-discovery-and-roles/plan.md:31`). `@specstride/harness` and `@specstride/doctor` may not import a package `terms` (rule LR-1)
- Change: The plan and the task paths change to the package that `specs/100-specstride/contracts/data/package-graph.json` names for the feature. Where a plan marks its name as a proposal (107, 115, 126), the proposal is withdrawn. A feature that still needs a package of its own reports it to the orchestrator as an amendment of annex A §A.1 (a row in `docs/ecosystem/STAGE-B-F100-AMENDMENTS.md`, with layer, owner and `mayImport`); no report supports such a request.
- Side that changes: the features (plans and task lists). Authority: feature 100's package graph; the import-boundary check of feature 100 reads it
- depends on: W-100-25 (May a core package import `node:fs`?)

### W-X-02 · `repair` · high — Conformance suites and samples of extension points are placed outside the published test kit, or twice

- Findings merged: B-8.3a-008, B-8.3b-003
- Files and lines:
  - Feature 100: `specs/100-specstride/plan.md:214` — state that feature 100 builds the contract-level suite and a minimal sample, and that the content owner adds behaviour cases in the same folder; the place is given at `specs/100-specstride/plan.md:142-144`; tasks T098, T101, T105, T108 (`specs/100-specstride/tasks.md:302`, `:310`, `:320`, `:328`) stay
  - Feature 103: `specs/103-proposer-pass/plan.md:149` (`tests/conformance/`) and the matching task paths
  - Feature 104: `specs/104-spec-input/tasks.md:135-137` (T040, T041: `packages/spec-formats/test/conformance/`) and the plan
  - Feature 105: `specs/105-verification/plan.md:139-142` (`packages/testkit/src/conformance/ep-07/`: write `EP-07`)
  - Feature 109: `specs/109-harness-seam/plan.md:149-153` (`packages/testkit/src/harness-conformance/`, sample in `tests/conformance/harness/sample/`)
  - Feature 110: `specs/110-config-and-terms/plan.md:104`; `specs/110-config-and-terms/tasks.md:101`, `:103` (`packages/config/tests/conformance/`, EP-10)
  - Feature 111: `specs/111-event-schema-and-projection/plan.md:111` (against its own `:28`); `specs/111-event-schema-and-projection/tasks.md:95`, `:100` (`tests/conformance/eventsink/`, EP-08)
  - Feature 112: `specs/112-doctor/plan.md:108` (against its own `:28`); `specs/112-doctor/tasks.md:127`, `:129` (`tests/conformance/doctor/`, EP-14)
  - Feature 113: `specs/113-host-claude-code/plan.md:105` (the host suite in its own package)
  - Feature 115: `specs/115-micro-loop-layer/plan.md:153` (`packages/testkit/conformance/`, without `src/`)
  - Feature 116: `specs/116-check-integrity-and-unit-evidence/plan.md:132` (the same path without `src/`)
- Change: Suites in `packages/testkit/src/conformance/EP-nn/`, samples in `packages/testkit/src/samples/EP-nn/`, in every plan and task list.
- Side that changes: the features; feature 100 adds one sentence to its plan. Authority: F100-FR-017 (`specs/100-specstride/annexes/A-foundations.md:118`)
- depends on: none

### W-X-03 · `repair` · high — Rows of the `parity` profile are cited by a wrong number

- Findings merged: B-8.2e-005, B-8.4c-007
- Files and lines:
  - Feature 102: `specs/102-run-control/spec.md:192`, `:339`, `:437`, `:438`, `:440` — rows 44 and 45 become 62 (`--new-run`) and 63 (`stop --jobs`), with "row granted"
  - Feature 103: `specs/103-proposer-pass/spec.md:249` (parity line of F103-FR-018), `:509`, `:575`; `specs/103-proposer-pass/tasks.md:35` (T004); `specs/103-proposer-pass/research.md:58` — row 44 becomes 59 (`loop.noProgressStructured`), row 45 becomes 60 (parameters of carry-over); "is needed" is dropped, and task T004 is closed for this switch. The table of `specs/103-proposer-pass/spec.md:486`-`:487` is right
  - Feature 118: `specs/118-pass-supervision-and-jobs/tasks.md:43`, `:216` — rows 44 and 45 become 50 and 51 (the two grace periods), as `specs/118-pass-supervision-and-jobs/spec.md:440`, `:441` say
  - Feature 127: `specs/127-quota-budgets-and-pause/spec.md:500`, `:501` — "39 (shared)" becomes 111; `:503` — "40 (shared)" becomes 112, as `:509` of the same file says
- Change: Write the number of annex X §X.7 (`specs/100-specstride/annexes/X-cross-layer.md:514`, `:515`, `:523`, `:524`, `:526`, `:527`, `:575`, `:576`). Rows 44 and 45 are the observability limits and the retention of feature 111, so a test written against them passes for the wrong rows.
- Side that changes: the features
- Note: The checklists hold the same stale numbers (for example `specs/103-proposer-pass/checklists/requirements.md:36`); B-8.2e did not check them.
- depends on: none

### W-X-04 · `repair` · high — Old spellings of config keys survive in contract files of the features

- Findings merged: B-8.2e-006 (part), B-8.4b-005
- Files and lines:
  - Feature 110: `specs/110-config-and-terms/spec.md:665` — `supervise.wallClockSeconds` becomes `supervise.wallClockSec`
  - Feature 115: `specs/115-micro-loop-layer/contracts/parity-rows.json:52`, `:60`, `:68`, `:76`, `:84`, `:92`, `:100`, `:108`, `:116` — the nine `loop.micro.caps.*` names with underscores become the lowerCamelCase names of `config-keys.tsv` (`escalationsPerTask` and so on)
  - Feature 122: `specs/122-detached-runtime/contracts/parity-rows.json:11` — `state.controlRoot` becomes `state.dir`
  - Feature 128: `specs/128-telemetry-export/contracts/config-keys.tsv:3`, `:8`, `:9`, `:10`, `:11` — `telemetry.lokiUrl` becomes `telemetry.loki.url`; `telemetry.content.maxPromptBytes` and `telemetry.content.maxReplyBytes` become `telemetry.contentMaxPromptBytes` and `telemetry.contentMaxReplyBytes`; `otel.legacyMetricNames` and `otel.dialects` become `telemetry.otel.legacyMetricNames` and `telemetry.otel.dialects`; `:7` — the default of `telemetry.content` is `auto`, not "follows traces"
  - Feature 138: `specs/138-adapter-prime/contracts/parity-rows.json:11` — `stream.capture` becomes `stream.tap`
  - Feature 148: `specs/148-check-runner/contracts/parity-rows.json:55` — `verification.env_allowlist` becomes `verification.envAllowlist`
- Change: Replace each by the spelling of `specs/110-config-and-terms/contracts/config-keys.tsv`. The rename of commit `993cdac` did not touch the files under `contracts/`, except in 129 and 130.
- Side that changes: the features
- depends on: none

### W-X-05 · `repair` · medium — Stale counts in the specs: features, register rows, requirements, profile rows, keys

- Findings merged: B-8.2f-017 (part), B-8.4a-003, B-8.4c-008, B-8.3a-011 (part), B-8.3a-017 (part), B-8.2e-017
- Files and lines:
  - Feature 100: `specs/100-specstride/spec.md:172` ("The 31 specifications are written in parallel": 39); `:311` (F100-SC-003, "all 32 features": "all Wave 1 features (41 after the splits)", or no number); `:461` ("the other 31 features": 40); `:423`, `:435` (91 rows, DV-001 to DV-091); `specs/100-specstride/plan.md:81` (DV-001 to DV-094); `specs/100-specstride/plan.md:9-10`, `:97` (226 requirements: 235, as `:43` says); `specs/100-specstride/spec.md:716` ("The key list of 110 gives the default `off`" for `roles.refuseUnknown`: "settled: the list of 110 gives `on`", `specs/110-config-and-terms/contracts/config-keys.tsv:197`)
  - Feature 103: `specs/103-proposer-pass/spec.md:593` (94 rows)
  - Feature 105: `specs/105-verification/spec.md:635` (97 rows)
  - Feature 109: `specs/109-harness-seam/spec.md:678` (97 rows)
  - Feature 110: `specs/110-config-and-terms/plan.md:37` ("43 profile rows" and "about 200 keys": 129 and 253); `specs/110-config-and-terms/spec.md:67` (drop the clause "row 34 of §X.7 names the profile": row 34 is the audience)
  - Feature 111: `specs/111-event-schema-and-projection/spec.md:431` (94 rows)
  - Feature 112: `specs/112-doctor/spec.md:426` (97 rows)
  - Feature 117: `specs/117-critic-grounding-and-prompt/spec.md:571` (97 rows, DV-001 to DV-097)
  - Feature 119: `specs/119-front-door-and-presenter/spec.md:499` (97 rows)
  - Feature 122: `specs/122-detached-runtime/spec.md:583` (97 rows)
  - Feature 123: `specs/123-pipeline-runtime-and-supervisor/spec.md:827` (97 rows)
  - Feature 125: `specs/125-adapter-claude/spec.md:588` (97 rows)
  - Feature 126: `specs/126-stream-seam-and-invocation/spec.md:479` (97 rows)
  - Feature 127: `specs/127-quota-budgets-and-pause/spec.md:577` (97 rows)
  - Feature 128: `specs/128-telemetry-export/spec.md:663` (98 rows)
  - Feature 130: `specs/130-adapter-dsh/spec.md:720` (DV-001 to DV-103)
  - Feature 131: `specs/131-adapter-codex/spec.md:635` (DV-001 to DV-100)
  - Feature 134: `specs/134-adapter-pi/spec.md:503` (DV-001 to DV-100)
  - Feature 138: `specs/138-adapter-prime/spec.md:668` (DV-001 to DV-100)
  - Feature 141: `specs/141-parity-oracle/spec.md:597`, `:826` (DV-001 to DV-094); `specs/141-parity-oracle/plan.md:52` (2,783 behaviour items: 2,785, `docs/ecosystem/PROGRESS.md:462`); `specs/141-parity-oracle/spec.md:776` ("reads rows 1 to 43": "rows 1 to 129")
- Change: Write the count that holds: 41 specifications (40 features and the umbrella), 235 functional requirements of feature 100, 129 rows of the profile, 253 keys, 2,785 behaviour items. For the divergence register write "the divergence register (`consolidation.md` section 6)" without a count, or the count after the rows of this worklist are added: 113 today (`docs/ecosystem/consolidation.md:1037`), more once the orchestrator adds the rows of class `register`.
- Side that changes: the features and feature 100
- Note: The same counts in `docs/ecosystem/*.md` are an item of the orchestrator (section 4).
- depends on: W-ORC-03 (Register row: the source inventory gains the field `schema`), W-ORC-01 (Register row: table 1 refuses a run that rests blocked or whose stop is not retryable), W-ORC-02 (Register row: an event whose local append failed reaches no sink)

### W-X-06 · `repair` · medium — "Run" and "engine invocation" written for one engine start

- Findings merged: B-8.2a-004, B-8.2a-005, B-8.2a-009, B-8.2a-010 (part)
- Files and lines:
  - Feature 100: `specs/100-specstride/annexes/F-runtime-root.md:46` (§F.1); `specs/100-specstride/annexes/B-state.md:334` — "one engine invocation" becomes "engine start"
  - Feature 102: `specs/102-run-control/spec.md:57`, `:130`, `:156` (F102-FR-002) — "the next engine start"
  - Feature 108: `specs/108-reverse/spec.md:141`, `:147`, `:154` — "engine start" for "one engine invocation"
  - Feature 109: `specs/109-harness-seam/spec.md:131` — "the next engine start"
  - Feature 115: `specs/115-micro-loop-layer/spec.md:410` (F115-FR-041) — "recorded as an event in the next engine start"
  - Feature 119: `specs/119-front-door-and-presenter/spec.md:196` (F119-FR-017) — "the events and engine log of the newest engine start"; `:202` — "the newest engine start of any feature". Annex B (`specs/100-specstride/annexes/B-state.md:270`) resolves `workspace:current:events` and `workspace:current:engine-log` to the newest engine start
  - Feature 122: `specs/122-detached-runtime/spec.md:352` (F122-FR-030) — "when the next engine start begins"
  - Feature 123: `specs/123-pipeline-runtime-and-supervisor/spec.md:508` — "engine start"
  - Feature 141: `specs/141-parity-oracle/spec.md:101` — "a second engine start while the lock is held"
  - Feature 145: `specs/145-presenter/spec.md:84`, `:150` (F145-FR-006) — "retargeted to the file of a new engine start"; the as-is literal `────── new run ──────` stays
  - Feature 148: `specs/148-check-runner/spec.md:127`, `:132` — "a later execution of the command may resume from that step", "a resumed execution"
- Change: Ruling 24: a run is the logical run and survives resume and relaunch; one start of the engine is an engine start. Replace in the places listed.
- Side that changes: the features and feature 100. Authority: ruling 24; `specs/100-specstride/spec.md:295`, `:297`
- Generated contract files that change: `contracts/annex-tables/B-state.json`, `F-runtime-root.json` (feature 100 part)
- Note: The event names `run.started` and `run.ended` are CQ-176 and do not change.
- depends on: none

### W-X-07 · `repair` · medium — Plans hold statements that the repository has overtaken (owners and layers of the graph, register rows "to be added", names "to be added" to annex B)

- Findings merged: B-8.3a-011 (part), B-8.3a-015, B-8.3b-005, B-8.3c-010, B-8.3d-004 (part), B-8.2f-017 (part), B-8.2f-005 (part), B-8.3b-014 (part)
- Files and lines:
  - Feature 103: `specs/103-proposer-pass/plan.md:37`, `:145` — owners of `@specstride/core`: 101, 102, 103, 117, 118 and 149
  - Feature 106: `specs/106-learning/plan.md:88` — "the intended difference has DV-105" (`specs/106-learning/spec.md:232` cites it)
  - Feature 107: `specs/107-launch-contract/plan.md:64` — drop "to be added" for DV-096 and DV-097 (`docs/ecosystem/consolidation.md:995`, `:996`); `specs/107-launch-contract/tasks.md:142` (T061) — drop the two register rows from the request
  - Feature 109: `specs/109-harness-seam/plan.md:48`, `:124`, `:160` — owners of `@specstride/harness`: 109, 124, 126 and 146
  - Feature 110: `specs/110-config-and-terms/plan.md:31` — `@specstride/config` is "L1", not "L6-adjacent"
  - Feature 117: `specs/117-critic-grounding-and-prompt/plan.md:91`, `:180-185` — remove the warning and the table under Principle XVIII; write "Every check passes. Complexity Tracking is empty."; bring `specs/117-critic-grounding-and-prompt/research.md` D-6 and D-7 in line. DV-099 and DV-100 exist (`docs/ecosystem/consolidation.md:998`, `:999`), and Principle XVIII cannot be justified away
  - Feature 122: `specs/122-detached-runtime/plan.md:43` — `@specstride/runtime` is "L5, L4"
  - Feature 123: `specs/123-pipeline-runtime-and-supervisor/plan.md:131` — "uses the registration call in `kernel` (feature 100)"
  - Feature 126: `specs/126-stream-seam-and-invocation/plan.md:57` — row XVIII names DV-101, DV-102, DV-103 (`docs/ecosystem/consolidation.md:1000-1002`)
  - Feature 127: `specs/127-quota-budgets-and-pause/plan.md:28`, `:34` — "`run:<runId>:spend` (annex B §B.5)"; owners of `@specstride/policy`: 110, 127, 147
  - Feature 128: `specs/128-telemetry-export/plan.md:62` — row X: the versions are "pinned in `research.md`" (`specs/128-telemetry-export/research.md:62`)
  - Feature 130: `specs/130-adapter-dsh/plan.md:88` — row XVIII names DV-108 to DV-111 as rows that exist (`docs/ecosystem/consolidation.md:1007-1010`)
  - Feature 140: `specs/140-reverse-inventory-and-lint/plan.md:32` — remove the sentence that the graph lacks 140 as owner of `@specstride/reverse`
  - Feature 143: `specs/143-parallel-engine-services/plan.md:86-87` — remove the sentence that the graph has no package for the tree store
  - Feature 146: `specs/146-harness-discovery/plan.md:143-144` — remove the sentence that the graph lacks owner 146 of `@specstride/harness`
  - Feature 148: `specs/148-check-runner/plan.md:43`, `:140-142` — remove the sentence that the graph lacks `@specstride/check-runner`
- Change: Change each sentence to the present state, as written in the place.
- Side that changes: the features (plans)
- depends on: none

### W-X-08 · `repair` · medium — Row XVIII of the Constitution Check lists fewer register rows than the `divergence:` fields of the spec

- Findings merged: B-8.3b-009
- Files and lines:
  - Feature 111: `specs/111-event-schema-and-projection/plan.md:75` — missing: DV-006, DV-050, DV-069, DV-079, DV-082, DV-088
  - Feature 115: `specs/115-micro-loop-layer/plan.md:92` — missing: DV-011, DV-079, DV-080, DV-085
  - Feature 117: `specs/117-critic-grounding-and-prompt/plan.md:91` — missing: DV-006, DV-007, DV-019, DV-027, DV-066, DV-095
  - Feature 118: `specs/118-pass-supervision-and-jobs/plan.md:64` — missing: DV-006, DV-007, DV-011, DV-012, DV-022, DV-025, DV-027, DV-066
  - Feature 119: `specs/119-front-door-and-presenter/plan.md:64` — missing: DV-006, DV-007, DV-027, DV-034, DV-066
- Change: In each row XVIII replace the list by "the rows in the `divergence:` fields of `spec.md`", or complete the list.
- Side that changes: the features (plans)
- depends on: none

### W-X-09 · `repair` · medium — Principle XVII: no task records the macOS result or a skip with its reason; the row is marked N/A or gives a reason that is not about tests

- Findings merged: B-8.3a-010, B-8.3b-012, B-8.3d-007
- Files and lines:
  - Feature 101: `specs/101-gate-and-verdict/plan.md:82`; `specs/101-gate-and-verdict/tasks.md` (add the task in the last phase)
  - Feature 102: `specs/102-run-control/plan.md:72` (row XVII: ✅ with the reason of plan 101, not N/A); `specs/102-run-control/tasks.md`
  - Feature 103: `specs/103-proposer-pass/plan.md:75` (row XVII: ✅, not N/A); `specs/103-proposer-pass/tasks.md` (T082 is a measurement only)
  - Feature 104: `specs/104-spec-input/plan.md:76` (the reason of row XVII is about the staleness verdict, not about tests); `specs/104-spec-input/tasks.md`
  - Feature 106: `specs/106-learning/plan.md:83`; `specs/106-learning/tasks.md`
  - Feature 111: `specs/111-event-schema-and-projection/plan.md:30`, `:70`; `specs/111-event-schema-and-projection/tasks.md`
  - Feature 119: `specs/119-front-door-and-presenter/plan.md:21`, `:59` (answer XVII in place of N/A: the feature has a startup check of 150 ms and states macOS as `unverified`); `specs/119-front-door-and-presenter/tasks.md`
  - Feature 138: `specs/138-adapter-prime/plan.md:43`; `specs/138-adapter-prime/tasks.md`
  - Feature 140: `specs/140-reverse-inventory-and-lint/plan.md:30`, `:70`; `specs/140-reverse-inventory-and-lint/tasks.md`
  - Feature 144: `specs/144-compatibility-projection/plan.md:22`, `:46`; `specs/144-compatibility-projection/tasks.md`
  - Feature 145: `specs/145-presenter/plan.md:53`, `:19`, `:21` (answer XVII as a pass with its reason: the feature has tests on a pseudo-terminal); `specs/145-presenter/tasks.md`
  - Feature 147: `specs/147-terms-gate/plan.md:28`; `specs/147-terms-gate/tasks.md`
  - Feature 149: `specs/149-attempt-planner-and-seams/plan.md:78`; `specs/149-attempt-planner-and-seams/tasks.md`
- Change: Add one task to the last phase of each task list: "Run the tests of the feature on the macOS runner when it exists; until then every macOS statement stays `unverified`; a test whose prerequisite is missing (the reference tree, the oracle, a macOS runner) reports a skip with its reason". Models: `specs/109-harness-seam/tasks.md:383` (T104), `specs/110-config-and-terms/tasks.md:115`, `specs/117-critic-grounding-and-prompt/tasks.md:431`, `specs/143-parallel-engine-services/tasks.md:199` (T070).
- Side that changes: the features. Authority: Principle XVII and ruling 67
- depends on: none

### W-X-10 · `repair` · medium — Sentences that say annex B has no logical name, or call a name "proposed" or "to be added"

- Findings merged: B-8.2c-004
- Files and lines:
  - Feature 104: `specs/104-spec-input/spec.md:316`, `:459` — `run:<runId>:task-list`
  - Feature 107: `specs/107-launch-contract/spec.md:347`, `:507` — `launch:<launchId>:comment`
  - Feature 108: `specs/108-reverse/spec.md:198`, `:472-473` — `reverse:<slug>:claims:<unit-key>`, `reverse:<slug>:test-plan`, `reverse:<slug>:scaffolds`
  - Feature 109: `specs/109-harness-seam/spec.md:304`, `:696` — `package:harness:<id>`
  - Feature 127: `specs/127-quota-budgets-and-pause/spec.md:567`; `specs/127-quota-budgets-and-pause/data-model.md:10`; `specs/127-quota-budgets-and-pause/contracts/spend-ledger.schema.json` (title) — `run:<runId>:spend`. At `spec.md:567` take the readers of annex B (engine, RunView, doctor), or report the CLI as a reader to the orchestrator for feature 100
  - Feature 128: `specs/128-telemetry-export/spec.md:384`, `:674` — `package:context-budget`
  - Feature 134: `specs/134-adapter-pi/spec.md:501`
  - Feature 144: `specs/144-compatibility-projection/spec.md:245` — `run:<runId>:events-legacy:<k>`
- Change: Replace "annex B has none" and "proposed" by the citation "annex B §B.5". Annex B at layout version 1.1 holds every one of the names (`specs/100-specstride/annexes/B-state.md:245`, `:246`, `:250`, `:252` to `:257`).
- Side that changes: the features
- Note: The questions CQ-033, CQ-038, CQ-044, CQ-065, CQ-093 and CQ-123 are closed by items of section 4.
- depends on: none

### W-X-11 · `repair` · medium — Sentences and contract files that say a profile row is "needed", "requested", "proposed" or "to be added", or name it by a label P-n

- Findings merged: B-8.2e-011
- Files and lines:
  - Feature 105: `specs/105-verification/spec.md:186`, `:193`, `:370`; entries without a row in `specs/105-verification/contracts/parity-rows.json`
  - Feature 110: `specs/110-config-and-terms/spec.md:142`, `:164`, `:167`, `:168`, `:199`, `:201`, `:202`, `:214`, `:215`, `:227`, `:239`, `:246` to `:248`, `:254`, `:257`, `:259` to `:261`, `:271`, `:660`, `:665`, `:667` (`:667` says `attempt.tier_bump_after` needs no row: it is row 128)
  - Feature 111: `specs/111-event-schema-and-projection/spec.md:224`, `:260`, `:439`
  - Feature 112: `specs/112-doctor/spec.md:433` (the doctor's keys are row 61)
  - Feature 115: `specs/115-micro-loop-layer/spec.md:317`, `:321`, `:370`; entries without a row in `specs/115-micro-loop-layer/contracts/parity-rows.json`
  - Feature 117: `specs/117-critic-grounding-and-prompt/spec.md:176`, `:183`, `:258`, `:302`, `:323` (labels P-1 to P-7: the rows are 52 to 58); entries without a row in `specs/117-critic-grounding-and-prompt/contracts/parity-rows.json`
  - Feature 122: `specs/122-detached-runtime/contracts/parity-rows.json:6` to `:11` (`"row": null`)
  - Feature 124: `specs/124-harness-discovery-and-roles/spec.md:193`; `specs/124-harness-discovery-and-roles/contracts/config-keys.json:38` to `:52`; entries without a row in `specs/124-harness-discovery-and-roles/contracts/parity-rows.json`
  - Feature 125: `specs/125-adapter-claude/spec.md:425` ("no row exists for the switch" of `harnesses.claude.disableSubagents`: it is row 122)
  - Feature 126: `specs/126-stream-seam-and-invocation/spec.md:200`, `:239`
  - Feature 128: `specs/128-telemetry-export/spec.md:209`, `:223`, `:417`, `:597`; `specs/128-telemetry-export/contracts/config-keys.tsv:2` to `:19` (column `annex_x7_row` says "needed")
  - Feature 129: `specs/129-run-view-and-status/spec.md:205`, `:332`, `:446`
  - Feature 130: `specs/130-adapter-dsh/spec.md:577` to `:580`, `:597` (annex X "does not hold" its two rows: they are rows 117 and 118); entries without a row in `specs/130-adapter-dsh/contracts/parity-rows.json`
  - Feature 140: `specs/140-reverse-inventory-and-lint/spec.md:182`
  - Feature 142: `specs/142-parallel-units/spec.md:236`, `:253`
  - Feature 143: `specs/143-parallel-engine-services/spec.md:185`
  - Feature 145: `specs/145-presenter/spec.md:109`
  - Feature 146: `specs/146-harness-discovery/contracts/config-keys.json:8` to `:22`; entries without a row in `specs/146-harness-discovery/contracts/parity-rows.json`
  - Feature 148: `specs/148-check-runner/spec.md:176`; entries without a row in `specs/148-check-runner/contracts/parity-rows.json`
- Change: Replace each phrase by "row n of annex X §X.7" with the number of §X.7 (129 rows; the table "Rows of the `parity` profile" of the same feature has the number). In the contract files set `row` to the number and the status to "confirmed". B-8.2e names features 103 and 138 in the finding and gives no place for them.
- Side that changes: the features
- depends on: W-X-03 (Rows of the `parity` profile are cited by a wrong number)

### W-X-12 · `repair` · medium — Tables of closed sets and sentences written before the amendments to annex X §X.6

- Findings merged: B-8.2d-010, B-8.2d-011
- Files and lines:
  - Feature 105: `specs/105-verification/spec.md:537` — "new" becomes the row number
  - Feature 110: `specs/110-config-and-terms/spec.md:677`, `:681`-`:683`
  - Feature 115: `specs/115-micro-loop-layer/spec.md:726`-`:731` (rows 136, 137, 138, 140, 141)
  - Feature 116: `specs/116-check-integrity-and-unit-evidence/spec.md:368` — remove the sentence that annex X "still names 115" for rows 27, 65, 66; `:375`, `:376` — rows 142 and 143
  - Feature 142: `specs/142-parallel-units/spec.md:526` — row 65 belongs to 116
  - Feature 143: `specs/143-parallel-engine-services/spec.md:390`, `:392` — remove the sentence that annex X names 142 for rows 62 and 64; the ledger record kinds are row 184, not "none yet"
  - Feature 148: `specs/148-check-runner/spec.md:394`, `:395`
- Change: Replace "new" and "none yet" by the row number of §X.6 in each table "Closed sets". The rows that exist since the amendments: 136, 137, 138, 140, 141, 142, 143, 231, 233, 235, 237, 240, 241, 242. 35 table lines in all features carry "new"; B-8.2d lists the places above and leaves the others to its script `members.py`; find them with `grep -n '| new |' specs/1*/spec.md`.
- Side that changes: the features
- depends on: W-100-02 (Owners that were not moved with the split 115 → 116 (EP-16, the fact block, two schema ids, closed sets 142 and 143, the package `@specstride/integrity`))

### W-X-13 · `repair` · medium — `CQ-pending-<n>` placeholders remain, and one row carries the number of another question

- Findings merged: B-8.2f-008, B-8.2d-017
- Files and lines:
  - Feature 106: `specs/106-learning/spec.md:304`, `:591`; `specs/106-learning/research.md:28` — `CQ-pending-4` (names of the learning event types): cite the catalogue of feature 111 through annex X; no question stays open. The catalogue has four types (`learning.observed` and three `learning.knob_*`), the row speaks of five: settle it in F106-FR-021 (item of feature 106)
  - Feature 112: `specs/112-doctor/spec.md:432` — the row is labelled CQ-071, which is another question; write "annex X §X.6 row 134" (`specs/100-specstride/annexes/X-cross-layer.md:305`). `:433` — `CQ-pending-3` becomes "annex X §X.7 row 61" (`specs/100-specstride/annexes/X-cross-layer.md:525`). `:434` — `CQ-pending-4` becomes CQ-071. `:435` — `CQ-pending-5` becomes "CQ-108, CQ-150"
  - Feature 123: `specs/123-pipeline-runtime-and-supervisor/research.md:79` — "The eight CQ-pending questions" become the numbers of the queue that `specs/123-pipeline-runtime-and-supervisor/spec.md` cites under "Assumptions" (CQ-046 to CQ-053)
  - Feature 126: `specs/126-stream-seam-and-invocation/spec.md:255`, `:487` — `CQ-pending-5` becomes "CQ-032, CQ-119"
  - Feature 141: `specs/141-parity-oracle/spec.md:764`, `:1013`, `:1014` — `CQ-pending-141-1` and `CQ-pending-141-2` become the numbers that the orchestrator gives to the two questions of feature 141 (items of feature 141)
- Change: Replace each placeholder by the number of the queue or by the citation of the row that answers it.
- Side that changes: the features
- Note: The places of feature 141 are in no report; they were found when this list was compiled (`grep -rn CQ-pending specs/1*`). B-8.2f asks for two new questions for `specs/112-doctor/spec.md:432` and `:433`; both are answered by rows that exist (section 5, point 4).
- depends on: W-141-01 (May a fixture change the reference tree or shadow the interpreter to reach a line?), W-141-02 (Which are the error classes of the validation of a launch contract?)

### W-X-14 · `repair` · medium — The Constitution Check is not in the form of the plan template, or a row gives a reason that does not bear on its principle

- Findings merged: B-8.3a-014, B-8.3b-013, B-8.3b-014 (part), B-8.3c-012, B-8.3d-006
- Files and lines:
  - Feature 101: `specs/101-gate-and-verdict/plan.md` — name the version of the constitution (v3.0.0)
  - Feature 104: `specs/104-spec-input/plan.md` — name v3.0.0
  - Feature 106: `specs/106-learning/plan.md` — name v3.0.0
  - Feature 107: `specs/107-launch-contract/plan.md:37-65` — mark the rows with ✅, ❌ or N/A; name v3.0.0
  - Feature 109: `specs/109-harness-seam/plan.md:63-76` — add the heading "The product and its edges (VI–XII)"
  - Feature 110: `specs/110-config-and-terms/plan.md:41` — name v3.0.0
  - Feature 113: `specs/113-host-claude-code/plan.md:67` — add the section Complexity Tracking; `:33` — name v3.0.0
  - Feature 115: `specs/115-micro-loop-layer/plan.md:77` — row X: "N/A: no harness adapter; the pins of executables are Principle III"
  - Feature 116: `specs/116-check-integrity-and-unit-evidence/plan.md:67` — row X as in 115; `:50` — "The brief of feature 115, from which this feature was split, names"
  - Feature 117: `specs/117-critic-grounding-and-prompt/plan.md:91` — add the closing statement of the check
  - Feature 118: `specs/118-pass-supervision-and-jobs/plan.md:33` — name v3.0.0; `:115` — remove the row "None" from the table; `:59` — row XVII: cite the macOS spike of T001 and the skip, not the refusal `first-failure-off`
  - Feature 119: `specs/119-front-door-and-presenter/plan.md:33` — add the gate line; `specs/119-front-door-and-presenter/tasks.md:28` (T001) — remove the directory `present/`, which moved to feature 145
  - Feature 125: `specs/125-adapter-claude/plan.md:55-57` — name v3.0.0
  - Feature 126: `specs/126-stream-seam-and-invocation/plan.md:31-58` — add the gate line, a mark on every row, the re-check after Phase 1, one line per principle for XIII to XVII and XX, and the requirement that supports each row (for example F126-FR-032 for I, F126-FR-018 for III, F126-FR-001 and F126-FR-007 for VII)
  - Feature 129: `specs/129-run-view-and-status/plan.md:35-65` — add the ✅ marks
  - Feature 130: `specs/130-adapter-dsh/plan.md:68-69` — add the heading "The product and its edges (VI–XII)"
  - Feature 144: `specs/144-compatibility-projection/plan.md:28-51` — add the gate line, the group headings, the `Input` line and the section Complexity Tracking; cite the requirement behind each pass
  - Feature 145: `specs/145-presenter/plan.md:31-60` — one row per principle (XIII, XIV, XV, XVI, XVII, XX stand in one row), a reason for each of the eight answers "N/A", the requirement behind each pass
  - Feature 147: `specs/147-terms-gate/plan.md:38-72` — a reason for IV, XIV, XVI and XX; name v3.0.0; add the section Complexity Tracking; cite the requirement behind each pass
- Change: Bring each section to the form of `.specify/templates/plan-template.md`: twenty rows, one per principle, each with ✅, ❌ or N/A and a one-line reason; the requirement that supports each pass; the gate line; the version of the constitution; the section Complexity Tracking.
- Side that changes: the features (plans)
- depends on: none

### W-X-15 · `repair` · medium — A paid capture is a precondition of unpaid work

- Findings merged: B-8.3c-005
- Files and lines:
  - Feature 125: `specs/125-adapter-claude/tasks.md:15` ("T001 to T004 first (captures)"), `:179` ("US4 needs T003"), `:248`; T055 (test CT-125-22 includes "the captured limit event of T003"): state the skip
  - Feature 126: `specs/126-stream-seam-and-invocation/tasks.md:9` ("T001 first (paid, logged)"), `:104`
  - Feature 131: `specs/131-adapter-codex/tasks.md:167` ("T043 needs T003"), `:180`; T057 (test CT-131-37): state the skip
- Change: In the section Dependencies of each task list say that a capture blocks only the freeze of the status of its requirement, that no test task and no implementation task waits for it, and that a test which would use a captured fixture is a skip with its reason until the fixture exists. Models: `specs/122-detached-runtime/tasks.md:244` ("it does not block the code"), `specs/129-run-view-and-status/tasks.md:209`.
- Side that changes: the features (task lists). Authority: Principles XII and XVII
- depends on: none

### W-X-16 · `repair` · medium — The terms gate, its file and the audience are said to belong to feature 110; since the split they belong to 147

- Findings merged: B-8.2e-015
- Files and lines:
  - Feature 109: `specs/109-harness-seam/spec.md:685`
  - Feature 113: `specs/113-host-claude-code/spec.md:371`
  - Feature 125: `specs/125-adapter-claude/contracts/terms-rows.md:3`; `specs/125-adapter-claude/tasks.md:236`
  - Feature 131: `specs/131-adapter-codex/spec.md:647`
  - Feature 134: `specs/134-adapter-pi/spec.md:510`
  - Feature 138: `specs/138-adapter-prime/spec.md:678`
- Change: Replace 110 by 147 where the terms gate, the terms file or the audience is meant (`specs/147-terms-gate/spec.md:17`); keep 110 for the secret resolvers.
- Side that changes: the features
- depends on: none

### W-X-17 · `repair` · medium — Features that touch the critic do not state the critic-diversity rule, its warning, or the identity the test needs

- Findings merged: B-8.2a-002
- Files and lines:
  - Feature 101: `specs/101-gate-and-verdict/spec.md:295` (F101-FR-020) — add the last sentence of F130-FR-030 (the warning) for the diagnostician
  - Feature 131: `specs/131-adapter-codex/spec.md:312` (F131-FR-021) — add the last sentence of F130-FR-030; the own-session rule and the identity are stated
  - Feature 134: `specs/134-adapter-pi/spec.md:283`, `:296`, `:300` (F134-FR-018, -020, -021) — add one requirement in the form of F130-FR-030
  - Feature 138: `specs/138-adapter-prime/spec.md:309`, `:343` (F138-FR-017, -022) — add one requirement in the form of F130-FR-030; for `prime:<variant>` the model is not visible (F138-FR-022), so the result is `unverified` and the warning is due
- Change: The requirement to add, in the form of F130-FR-030 (`specs/130-adapter-dsh/spec.md:394`): the operation `capabilities` reports the identity of provider and model in use, or null; the rule and the warning are those of F100-FR-024; an unknown model gives `unverified` with the warning.
- Side that changes: the features. Authority: `docs/ecosystem/STAGE-B-RULES.md` section 5; F100-FR-024
- depends on: W-100-15 (One warning under two names: "critic-diversity warning" and "same-model warning")

### W-X-18 · `repair` · medium — The section "Extension points" says `consumes`, and no requirement has an `ep:` line for the point

- Findings merged: B-8.2f-009
- Files and lines:
  - Feature 101: `specs/101-gate-and-verdict/spec.md:562-563` (EP-18; feature 100 says "Feature 101 consumes both seams")
  - Feature 102: `specs/102-run-control/spec.md:402` (EP-04)
  - Feature 105: `specs/105-verification/spec.md:461` (EP-05; feature 100 says "Feature 105 consumes the runner"), `:465` (EP-08)
  - Feature 115: `specs/115-micro-loop-layer/spec.md:643` (EP-14)
  - Feature 116: `specs/116-check-integrity-and-unit-evidence/spec.md:318` (EP-03)
  - Feature 117: `specs/117-critic-grounding-and-prompt/spec.md:454-456` (EP-03, EP-04, EP-18)
  - Feature 130: `specs/130-adapter-dsh/spec.md:536` (EP-10)
  - Feature 141: `specs/141-parity-oracle/spec.md:757-759` (EP-08, EP-02, EP-04)
  - Feature 142: `specs/142-parallel-units/spec.md:452` (EP-16)
  - Feature 146: `specs/146-harness-discovery/spec.md:257` (EP-14)
  - Feature 147: `specs/147-terms-gate/spec.md:207` (EP-02)
  - Feature 149: `specs/149-attempt-planner-and-seams/spec.md:271` (EP-05)
- Change: Add `- ep: EP-nn <id> (consumes)` to the requirement that the row of the section names, or delete the row where no requirement uses the point.
- Side that changes: the features
- depends on: none

### W-X-19 · `repair` · medium — Registering an entry in a registry of another feature is `implements` in some specs and `consumes` in others (EP-14, EP-01)

- Findings merged: B-8.2f-010 (part)
- Files and lines:
  - Feature 109: `specs/109-harness-seam/spec.md:503` (EP-14, `consumes`)
  - Feature 122: `specs/122-detached-runtime/spec.md:466` (EP-14, `consumes`)
  - Feature 123: `specs/123-pipeline-runtime-and-supervisor/spec.md:694` (EP-14, `consumes`)
  - Feature 125: `specs/125-adapter-claude/spec.md:200`, `:487` (EP-14, `implements`)
  - Feature 129: `specs/129-run-view-and-status/spec.md:310`, `:455` — EP-01: write `consumes`; feature 100 sanctions a second implementer of EP-01 for 107 only (F100-FR-192), and 119 and 102 claim nothing (`specs/102-run-control/spec.md:404`)
  - Feature 130: `specs/130-adapter-dsh/spec.md:225`, `:539` (EP-14, `implements`)
  - Feature 131: `specs/131-adapter-codex/spec.md:219`, `:487` (EP-14, `implements`)
  - Feature 134: `specs/134-adapter-pi/spec.md:230`, `:399` (EP-14, `consumes`)
  - Feature 138: `specs/138-adapter-prime/spec.md:235`, `:531` (EP-14, `implements`)
- Change: One word in all: a feature that registers an entry in a registry owned by another feature writes `implements (an entry)`. The owner of EP-14 is 112.
- Side that changes: the features, after the orchestrator has stated the rule
- depends on: W-ORC-06 (`STAGE-B-RULES.md` has no rule for the word of a registration, and names a stale range of the register)

### W-X-20 · `repair` · medium — 218 test names of `test:` lines appear in no task; three tests have no task at all

- Findings merged: B-8.2f-006
- Files and lines:
  - Feature 103: `specs/103-proposer-pass/spec.md:347` (`CT-103-134`: no task at all)
  - Feature 104: first place `specs/104-spec-input/spec.md:156` (52 names)
  - Feature 107: first place `specs/107-launch-contract/spec.md:160` (16 names)
  - Feature 108: first place `specs/108-reverse/spec.md:118` (43 names); example: the spec names `PT-108-C-109-passthrough`, the task `PT-108-C-108-entry` proves C-108 to C-115 (`specs/108-reverse/tasks.md:56-57`)
  - Feature 118: first place `specs/118-pass-supervision-and-jobs/spec.md:177` (13 names); `PT-118-FX16-long-job` at `:343` has no task at all
  - Feature 119: `specs/119-front-door-and-presenter/spec.md:126`, `:133` (4 names)
  - Feature 123: first place `specs/123-pipeline-runtime-and-supervisor/spec.md:396` (14 names)
  - Feature 128: first place `specs/128-telemetry-export/spec.md:166` (16 names)
  - Feature 130: `specs/130-adapter-dsh/spec.md:395` (`CT-130-30`: no task at all)
  - Feature 140: first place `specs/140-reverse-inventory-and-lint/spec.md:99` (44 names)
  - Feature 145: first place `specs/145-presenter/spec.md:101` (14 names)
- Change: In each `tasks.md` name the tests as the spec does (one task may hold several named tests of one file), or change the `test:` lines to the names of the tasks. Add a test task for `CT-103-134`, `CT-130-30` and `PT-118-FX16-long-job`. The list per feature is the output of the script `tests.py` of B-8.2f; rebuild it by comparing the names after `test:` in `spec.md` with the names in `tasks.md`.
- Side that changes: the features
- depends on: none

### W-X-21 · `repair` · medium — `proves:` holds a test name, a phrase or nothing in place of an origin or a requirement id

- Findings merged: B-8.2f-007
- Files and lines:
  - Feature 101: `specs/101-gate-and-verdict/tasks.md:324` ("the success criterion below": write the id of the criterion)
  - Feature 111: `specs/111-event-schema-and-projection/tasks.md:86` (empty: write `proves: F111-SC-001`)
  - Feature 118: `specs/118-pass-supervision-and-jobs/tasks.md:173` (mixes a test name and an id)
  - Feature 128: `specs/128-telemetry-export/tasks.md:34`, `:45`, `:68`, `:143`, `:206`, `:213`, `:217`, `:221`, `:226`, `:233`, `:242`, `:246`, `:256`, `:258` (14 tasks)
  - Feature 138: `specs/138-adapter-prime/tasks.md:65`, `:74`, `:114`, `:117`, `:164`, `:167`, `:202`, `:205`, `:238`, `:263`, `:266`, `:285`, `:298`, `:301` (14 tasks)
- Change: Write in each the requirement id whose `test:` line names the test.
- Side that changes: the features. Authority: `docs/ecosystem/STAGE-B-RULES.md` section 4
- depends on: none

### W-X-22 · `repair` · medium — Owners do not name their threats of annex X §X.9 with the control (F100-FR-216)

- Findings merged: B-8.2d-012 (part)
- Files and lines:
  - Feature 101: T-22
  - Feature 102: T-02
  - Feature 103: T-08, T-31
  - Feature 105: T-03, T-19, T-21, T-25
  - Feature 109: T-14
  - Feature 110: T-33, T-34
  - Feature 112: T-14
  - Feature 113: T-11, T-43, T-44, T-45; today T-09, T-12, T-43 and T-46 are named only in `specs/113-host-claude-code/research.md:17`
  - Feature 118: T-25
  - Feature 123: T-11, T-47
- Change: Add a table "Threats" to `spec.md` of each feature listed, with the threat id and the requirement that is the control. Feature 113 cites the requirement that feature 100 adds for T-43. Source rows: `specs/100-specstride/annexes/X-cross-layer.md:805`, `:833`-`:835`.
- Side that changes: the features
- depends on: W-100-17 (The control of threat T-43 is in no spec and no annex; feature 100 names none of its own threats)

### W-X-23 · `repair` · medium — Text from outside the runtime is written to a sink, and the one redaction point is named nowhere

- Findings merged: B-8.2d-015
- Files and lines:
  - Feature 101: `specs/101-gate-and-verdict/spec.md:417` — the lines of a critic-class call in the engine log
  - Feature 105: `specs/105-verification/spec.md:347` — `summary` of the prestage record and event
  - Feature 106: `specs/106-learning/spec.md:299` — the learning stream, which F111-FR-022 puts under the same ingress
  - Feature 118: `specs/118-pass-supervision-and-jobs/spec.md:199`, `:305`, `:360` — the kill note and its line on standard error with "What it caught", `pass.killed.detail`, `job.started.cmd` and `argv`
- Change: Add to each feature one requirement: "Text of <source> MUST enter through the ingress of F111-FR-023 before it is written to <sink>", and add the ingress to "Contracts of feature 100 used". B-8.2d names features 103 and 122 as well and gives no place for them. It is a missing statement, not a proven bypass.
- Side that changes: the features
- depends on: none

### W-X-24 · `repair` · medium — Catalogue types that no feature says it emits

- Findings merged: B-8.2d-016
- Files and lines:
  - Feature 102: `unblocked` (read by 129)
  - Feature 103: `progress.swept`, `task.planned`, `task.ticked`
  - Feature 115: `integrity.noted`, with 116
  - Feature 116: `integrity.noted` (read by 116), with 115
  - Feature 123: `specs/123-pipeline-runtime-and-supervisor/spec.md:500` (F123-FR-018 names only `stage.*` and `supervisor.*`) — `pipeline.started`, `pipeline.ended`, `launch.checked`, `digest.written`
- Change: Name the emitter in the requirement of the feature listed. Catalogue lines: `specs/111-event-schema-and-projection/contracts/event-catalogue.tsv:15`, `:17`, `:18`, `:22`, `:26`, `:51`, `:83`, `:84`, `:96`.
- Side that changes: the features
- depends on: none

### W-X-25 · `repair` · medium — Logical names of annex B §B.5 that no feature cites

- Findings merged: B-8.2c-010
- Files and lines:
  - Feature 106: `specs/106-learning/spec.md:147` — `feature:<slug>:learning:lock`
  - Feature 108: `specs/108-reverse/spec.md:44` — `reverse:<slug>:output`
  - Feature 113: `specs/113-host-claude-code/spec.md:242` — `workspace:current:status-line` (reader: the shell shim of the host hook)
  - Feature 117: `specs/117-critic-grounding-and-prompt/spec.md:376`, `:383` — `attempt:<N>:<k>:<n>:withheld-paths`, `attempt:<N>:<k>:<n>:hidden-files`; `gate:<N>:proofs` (reader: grounding; B-8.2c found no requirement that reads or writes it by name)
  - Feature 122: a new requirement: the runtime writes `workspace:layout-version` at the first launch (F100-FR-041); no file of the 40 features holds "layout version"
  - Feature 129: `workspace:current:status-line` (writer: the runtime; F100-FR-229)
  - Feature 130: `specs/130-adapter-dsh/spec.md:33` — `pass:<passId>:critic-patch`
  - Feature 146: `package:catalogue` (readers: harness layer, doctor; B-8.2c found no requirement that reads it by name)
- Change: Each owner names the logical name in the requirement that writes or reads the state (F100-FR-038). Rows of annex B: `specs/100-specstride/annexes/B-state.md:149`, `:238`, `:247-249`, `:251`, `:258-260`. The assignment of `gate:<N>:proofs` to 117 and of `package:catalogue` to 146 follows the readers that annex B names; B-8.2c lists features 129 and 146 in the finding and gives no place.
- Side that changes: the features
- Note: The two other names that no feature cites, `run:<runId>:task-list` and `run:<runId>:events-legacy:<k>`, are items of features 115 and 144.
- depends on: none

### W-X-26 · `repair` · medium — The owner of a record of annex B §B.20 delivers no schema file and still calls the id "proposed"

- Findings merged: B-8.2c-011 (part)
- Files and lines:
  - Feature 106: `specs/106-learning/data-model.md:49` — `specstride.retrospective/1` (`specs/100-specstride/annexes/B-state.md:674`)
  - Feature 117: `specs/117-critic-grounding-and-prompt/data-model.md:77` — `specstride.hidden-files/1` (`specs/100-specstride/annexes/B-state.md:665`)
  - Feature 119: `specs/119-front-door-and-presenter/contracts/front-door.md:23` — `specstride.inspect.<verb>/1` (`specs/100-specstride/annexes/B-state.md:678`)
  - Feature 126: `specs/126-stream-seam-and-invocation/contracts/README.md:9-12` — `specstride.invocation/1`, `specstride.producer-status/1`, `specstride.provider-terminal/1`, `specstride.invocation-result/1` (`specs/100-specstride/annexes/B-state.md:669-672`)
- Change: Each owner adds the schema file to its `contracts/`, with `schema` required, and cites annex B §B.20 in place of "proposed" or "not in feature 100" (F100-FR-227).
- Side that changes: the features
- depends on: W-100-16 (The form of `$id` of a schema file is stated nowhere; the features use four other forms), W-100-09 (Annex B §B.20: the schema id of the span state is missing; the owner of the inspection records after the split 119/145)

### W-X-27 · `repair` · medium — One schema validator and one YAML parser: plans leave the choice open or name the validator as their own dependency

- Findings merged: B-8.3a-006, B-8.3a-016, B-8.3b-004, B-8.3d-005
- Files and lines:
  - Feature 100: `specs/100-specstride/research.md` — one decision that names the YAML parser, as D-2 does for the validator (`specs/100-specstride/plan.md:29`)
  - Feature 104: `specs/104-spec-input/plan.md:32` — "validation through the validators of `@specstride/contracts`"
  - Feature 105: `specs/105-verification/plan.md:38` — the same
  - Feature 106: `specs/106-learning/plan.md:39` — the same
  - Feature 107: `specs/107-launch-contract/plan.md:15` — the same
  - Feature 109: `specs/109-harness-seam/plan.md:40` — the same, and add "the YAML parser that feature 110 chose (one parser in the workspace, MIT, pure JavaScript)"; descriptors are YAML files by the layout table (`user:harness:<id>`), and T061 (`specs/109-harness-seam/tasks.md:222`) writes them
  - Feature 110: `specs/110-config-and-terms/plan.md:23`; `specs/110-config-and-terms/research.md:24` — "the JSON Schema validator that feature 100 chose; one YAML parser, named here, pure JavaScript, MIT-compatible, used in a mode that constructs no code"; one task that pins it and records the licence, as T005 of feature 100 does
  - Feature 112: `specs/112-doctor/plan.md:24` — "the YAML parser that feature 110 chose"
  - Feature 147: `specs/147-terms-gate/plan.md:22`; the last line of `specs/147-terms-gate/research.md` — "`@specstride/contracts` (schema types), `@specstride/kernel` (the table evaluator), the JSON Schema validator that feature 100 chose"
- Change: Feature 110 names the one YAML parser; feature 100 records the choice; every other plan refers to it. No plan chooses a validator: feature 100 chose Ajv (`specs/100-specstride/research.md` D-2).
- Side that changes: the features; feature 100 records the parser. Authority: Principle VI
- depends on: none

### W-X-28 · `repair` · low — Parity and characterization tests are placed in different directories

- Findings merged: B-8.3a-017 (part), B-8.3d-012
- Files and lines:
  - Feature 100: `specs/100-specstride/plan.md` — state one rule for the place: `tests/parity/<feature>/` and `tests/characterization/<feature>/`
  - Feature 104: `specs/104-spec-input/plan.md:121-125` (inside the package)
  - Feature 106: `specs/106-learning/plan.md:133-138` (inside the package)
  - Feature 107: `specs/107-launch-contract/plan.md:100-103` (inside the package)
  - Feature 134: `specs/134-adapter-pi/plan.md:148` (`tests/harness/adapters/pi/`)
  - Feature 143: `specs/143-parallel-engine-services/plan.md:127-129` (`tests/parallel/143/`)
  - Feature 149: `specs/149-attempt-planner-and-seams/plan.md:128` (`tests/own/149/`)
- Change: Use the two directories of feature 100 in plan and task paths.
- Side that changes: the features; feature 100 states the rule
- depends on: none

### W-X-29 · `repair` · low — Row XIX states no share of the token budget, or no task measures it

- Findings merged: B-8.3a-013, B-8.3d-011 (part)
- Files and lines:
  - Feature 104: `specs/104-spec-input/plan.md:82` — a byte figure for the default output of `spec`; one task that measures it
  - Feature 106: `specs/106-learning/plan.md:89` — a byte figure for the default output of `learn`; one task that measures it
  - Feature 109: `specs/109-harness-seam/plan.md:90` — the figures are stated (200 bytes per doctor finding, one line per result of `harness verify`); `specs/109-harness-seam/tasks.md`: one task that measures them
  - Feature 140: `specs/140-reverse-inventory-and-lint/plan.md:76` — state the share in bytes
- Change: State the figure in bytes and add a task that measures it with the helper of T194 of feature 100 (`specs/100-specstride/tasks.md:555`).
- Side that changes: the features (plans and task lists)
- depends on: none

### W-X-30 · `repair` · low — Absolute paths of the owner's machine in task text and research

- Findings merged: B-8.2a-016
- Files and lines:
  - Feature 101: `specs/101-gate-and-verdict/tasks.md:52`
  - Feature 108: `specs/108-reverse/research.md:11`
  - Feature 110: `specs/110-config-and-terms/tasks.md:28`
  - Feature 117: `specs/117-critic-grounding-and-prompt/tasks.md:41`, `:47`
  - Feature 140: `specs/140-reverse-inventory-and-lint/research.md:11`
  - Feature 144: `specs/144-compatibility-projection/research.md:9`
- Change: Write "the Specstride baseline at `9cab15d`" and "the Lisa baseline at `363e6a3`" without a path.
- Side that changes: the features. Authority: `docs/ecosystem/STAGE-B-RULES.md` section 2; F100-FR-029
- depends on: none

### W-X-31 · `repair` · low — "Gate" written for a check of the build, and bare "gate" for the verification gate

- Findings merged: B-8.2a-011, B-8.2a-015
- Files and lines:
  - Feature 105: `specs/105-verification/spec.md:283`, `:195`, `:219`, `:322` — "verification gate" in the requirement lines
  - Feature 107: `specs/107-launch-contract/spec.md:484` — "payload check" for "judgment payload gate"
  - Feature 112: `specs/112-doctor/spec.md:411`, `:421` — "golden output check"
  - Feature 113: `specs/113-host-claude-code/spec.md:310`, `:339`, `:341`, `:379` — "seven CI checks", "the static size check", "the reference closure check"
  - Feature 119: `specs/119-front-door-and-presenter/spec.md:188`
  - Feature 128: `specs/128-telemetry-export/spec.md:658` — "startup check"
- Change: Glossary rows 1 and 23: "gate" is the phase gate, and a check is never a gate.
- Side that changes: the features
- depends on: none

### W-X-32 · `repair` · low — A runtime is named in a requirement outside `## Constraints`

- Findings merged: B-8.2a-017
- Files and lines:
  - Feature 107: `specs/107-launch-contract/spec.md:320` (F107-FR-030, "a Node interpreter line") — "the interpreter line of the product's runtime"; the constraint is already at `specs/107-launch-contract/spec.md:46`
  - Feature 113: `specs/113-host-claude-code/spec.md:238` (F113-FR-020, "a Node start") — "a start of the runtime platform"
- Change: Leave the name of the runtime in `## Constraints`.
- Side that changes: the features
- depends on: none

### W-X-33 · `repair` · low — A requirement line names another tier 2 feature in prose and no contract of feature 100

- Findings merged: B-8.2f-014
- Files and lines:
  - Feature 102: `specs/102-run-control/spec.md:290` (names 110), `:346` (names 111)
  - Feature 108: `specs/108-reverse/spec.md:409` (names 113)
  - Feature 123: `specs/123-pipeline-runtime-and-supervisor/spec.md:580` (names 107)
  - Feature 125: `specs/125-adapter-claude/spec.md:215` (names 112), `:411` (names 109)
  - Feature 128: `specs/128-telemetry-export/spec.md:410` (names 111)
  - Feature 129: `specs/129-run-view-and-status/spec.md:312` (names 119)
  - Feature 130: `specs/130-adapter-dsh/spec.md:198` (names 126)
  - Feature 138: `specs/138-adapter-prime/spec.md:468` (names 134)
- Change: In each line name the contract of feature 100 through which the behaviour is consumed (for example annex X §X.2 for the event catalogue, annex X §X.10 for the redaction patterns, annex G §G.7 for the doctor registry).
- Side that changes: the features
- depends on: none

### W-X-34 · `accept` · low — Analyze reports cite old ids of the splits in sentences about the split

- Findings merged: B-8.2f-015 (part)
- Files and lines:
  - Feature 105: `specs/105-verification/analyze-report.md:29`
  - Feature 108: `specs/108-reverse/analyze-report.md:3`, `:9`
  - Feature 111: `specs/111-event-schema-and-projection/analyze-report.md:10`
  - Feature 115: `specs/115-micro-loop-layer/analyze-report.md:20`
  - Feature 119: `specs/119-front-door-and-presenter/analyze-report.md:9`
  - Feature 140: `specs/140-reverse-inventory-and-lint/analyze-report.md:9`
  - Feature 142: `specs/142-parallel-units/analyze-report.md:13`
  - Feature 145: `specs/145-presenter/analyze-report.md:17`
- Reason that no change is needed: The sentences are the history of the split, and every old id is in the old-to-new tables. An analyze report is a record of a run, not a contract. The three rows of `specs/115-micro-loop-layer/analyze-report.md:61-63` are the exception and are an item of feature 115.
- depends on: none

### W-X-35 · `accept` · low — Old key spellings in `research.md`, written as history

- Findings merged: B-8.2e-006 (part)
- Files and lines:
  - Feature 122: `specs/122-detached-runtime/research.md:90`
  - Feature 128: `specs/128-telemetry-export/research.md:12`, `:35`
- Reason that no change is needed: B-8.2e itself marks these places "as history": they record what the key was called when the decision was taken. A reader finds the present name in `config-keys.tsv` of feature 110.
- depends on: none

### W-X-36 · `accept` · low — Literals of a contract or of the baseline that keep a retired word

- Findings merged: B-8.2a-004 (part), B-8.2a-006 (part), B-8.2a-012 (part)
- Files and lines:
  - Feature 100: the directive `giveIterationBack`; the literals `MAX_ITER` and `iter_*` of the compatibility projection; the key `harnesses.<id>.tiers`
  - Feature 110: `specs/110-config-and-terms/spec.md:155` — the key `harnesses.<id>.tiers`
  - Feature 145: the as-is literal `────── new run ──────`
- Reason that no change is needed: Each is a literal of a contract or of the baseline, which the reports themselves except. The key `harnesses.<id>.tiers` holds model tiers; B-8.2a offers a rename to `modelTiers` only "if keys are still open", and the keys were confirmed with commit `993cdac`. The glossary of feature 100 says once that the literals stay.
- depends on: none

## 4. Orchestrator

Changes to `docs/ecosystem/*.md`, the traceability files, the queue and the ledger. No repair agent of a
feature makes them.

### W-ORC-01 · `register` · critical — Register row: table 1 refuses a run that rests blocked or whose stop is not retryable

- Findings merged: B-8.2b-001 (part)
- Files and lines:
  - `docs/ecosystem`: `docs/ecosystem/consolidation.md`, section 6 (after row DV-113, `:1012`); the count at `:1037`
- Change: Add the row and raise the count. The id is the next free one: DV-114 if no other row was added since the reviews (act B-8.5 on feature 141 was running and may add rows).
- Text of the row:

  | Id | As-is | New | Source | Oracle handling | Owner's ruling |
  |---|---|---|---|---|---|
  | DV-114 | With `relaunch.owner: supervise`, `supervise observe` classifies a stop from the observation of the terminated launcher and from the exit codes and reasons that the stage lists. It cannot see `retryable` or a blocked reason, so a run that rests blocked on a human is relaunched where the stage lists exit 4 and allows the reason (the as-is classifier of DV-074) | Outside the `parity` profile table 1 reads `retryable` and the blocked reason from the terminal record and refuses with `blocked-on-human` or `stop-not-retryable` before the rows O-25 and O-26 | F100-FR-163; F123-FR-030; owner rulings 6 and 29; review finding B-8.2b-001 | **Off** under the `parity` profile: the two rows are inactive, so FX-35 and FX-36 compare as they are. Own tests for the two rows | Row proposed by the repair worklist of act 8.6a; put to the owner in the clarification round |

- depends on: none

### W-ORC-02 · `register` · high — Register row: an event whose local append failed reaches no sink

- Findings merged: B-8.2d-002 (part)
- Files and lines:
  - `docs/ecosystem`: `docs/ecosystem/consolidation.md`, section 6; the count at `:1037`
- Change: Add the row (next free id; DV-115 if the row above is DV-114). B-8.2d proposes to record the difference "under DV-006"; DV-006 is the row of the state layout and does not describe it, so a row of its own is given here. The orchestrator chooses.
- Text of the row:

  | Id | As-is | New | Source | Oracle handling | Owner's ruling |
  |---|---|---|---|---|---|
  | DV-115 | A failure to append an event to the local file is swallowed, and the event is still shipped to the other sinks (the as-is behaviour that F126-FR-016 ported) | The event writer drops the event, counts it in `event.dropped` and calls no sink: a sink receives only events that have a `seq` and are in the primary file | Annex X §X.1; F111-FR-017, F111-FR-019, F111-FR-034; review finding B-8.2d-002 | To be confirmed by feature 141. Proposed: **not observable**, since no fixture makes the local append fail; own tests | Row proposed by the repair worklist of act 8.6a; put to the owner in the clarification round |

- depends on: none

### W-ORC-03 · `register` · high — Register row: the source inventory gains the field `schema`

- Findings merged: B-8.2c-003 (part)
- Files and lines:
  - `docs/ecosystem`: `docs/ecosystem/consolidation.md`, section 6; the count at `:1037`
- Change: Add the row (next free id; DV-116 if the rows above are DV-114 and DV-115). It is needed only if the inventory is a surface that the oracle compares on FX-30; feature 141 confirms.
- Text of the row:

  | Id | As-is | New | Source | Oracle handling | Owner's ruling |
  |---|---|---|---|---|---|
  | DV-116 | The source inventory of a reverse run carries `schema_version` 1 and no field `schema` (Specstride at `9cab15d`) | The inventory carries `schema` with the value `specstride.reverse-inventory/1`; `schema_version` 1 stays as the as-is field | F100-FR-048; F100-FR-227; annex B §B.20; review finding B-8.2c-003 | To be confirmed by feature 141. Proposed: a normalization rule that removes the key `schema` before the inventory is compared on FX-30 | Row proposed by the repair worklist of act 8.6a; put to the owner in the clarification round |

- depends on: none

### W-ORC-04 · `orchestrator` · high — CQ-050 does not record that the labels of `supervise` must differ from the labels of annex G

- Findings merged: B-8.2b-002 (part)
- Files and lines:
  - `docs/ecosystem`: `docs/ecosystem/CLARIFY-QUEUE.md:59` (CQ-050)
- Change: Add to the recommended answer of CQ-050: the lines of `supervise` carry labels of their own (`[SPECSTRIDE-SUPERVISE-*]`), because `[SPECSTRIDE-LAUNCH]`, `[SPECSTRIDE-STOP]`, `[SPECSTRIDE-DIGEST]` and `[SPECSTRIDE-STATE]` have other owners and other keys.
- depends on: W-123-02 (Feature 123 prints `[SPECSTRIDE-LAUNCH]`, `[SPECSTRIDE-STOP]`, `[SPECSTRIDE-DIGEST]` and `[SPECSTRIDE-STATE]` with other keys than their owners)

### W-ORC-05 · `orchestrator` · medium — Add the proposed questions to the queue

- Findings merged: none (follows from the items of class `queue`)
- Files and lines:
  - `docs/ecosystem`: `docs/ecosystem/CLARIFY-QUEUE.md` (after CQ-181, `:190`)
- Change: Give each question of the table "Proposed new queue questions" of the front matter a number from CQ-182, with its sources, its recommended answer and what changes otherwise, as the items state them. Then tell each owning feature the number, so that its requirements carry `assumption: CQ-nnn`. The three critical questions (the weaker proof, the customisations of dsh, the trigger suite in CI) touch NON-NEGOTIABLE principles and go to the owner first.
- depends on: none

### W-ORC-06 · `orchestrator` · medium — `STAGE-B-RULES.md` has no rule for the word of a registration, and names a stale range of the register

- Findings merged: B-8.2f-010 (part), B-8.2f-017 (part)
- Files and lines:
  - `docs/ecosystem`: `docs/ecosystem/STAGE-B-RULES.md`, section 4 (the field `ep:` and the field `divergence:`)
- Change: Add the rule: a feature that registers an entry in a registry owned by another feature writes `implements (an entry)`. For EP-01, either feature 129 writes `consumes`, or annex H §H.1 names 129, 119 and 102 in the owner text; the worklist takes the first. In the field `divergence:` write DV-001 to the last row of the register in place of DV-001 to DV-094.
- depends on: none

### W-ORC-07 · `orchestrator` · medium — The briefs name the wrong consumers of EP-16

- Findings merged: B-8.2f-001 (part)
- Files and lines:
  - `docs/ecosystem`: `docs/ecosystem/feature-briefs.md:6176`
- Change: Write "148, 143 and 105 consume".
- depends on: W-100-02 (Owners that were not moved with the split 115 → 116 (EP-16, the fact block, two schema ids, closed sets 142 and 143, the package `@specstride/integrity`))

### W-ORC-08 · `orchestrator` · medium — The ledger holds a stale task count for 142 and no count for eight features

- Findings merged: B-8.3d-009
- Files and lines:
  - `docs/ecosystem`: `docs/ecosystem/PROGRESS.md:328`, `:333`, `:338`, `:343`, `:348`, `:353`, `:358`, `:363`, `:368`
- Change: Write the counts: 140: 33; 142: 109 (the ledger says 173); 143: 72; 144: 20; 145: 24; 146: 30; 147: 10; 148: 63; 149: 33. Count again after the repairs, since several items add tasks (`grep -cE '^\s*- \[[ xX]\] T[0-9]+' tasks.md`).
- depends on: none

### W-ORC-09 · `orchestrator` · medium — The list of amendments to feature 100 still marks the owners of the two splits as not applied

- Findings merged: none (follows from the items on the owners after the splits; B-8.3b names `STAGE-B-F100-AMENDMENTS.md:223` in its section "Checked")
- Files and lines:
  - `docs/ecosystem`: `docs/ecosystem/STAGE-B-F100-AMENDMENTS.md:215` to `:223` (rows of 143 and 116, column "applied": "no")
- Change: Mark the rows as applied once the items of feature 100 on the owners are done, and add a row for every amendment that this worklist asks of feature 100: the schema id of the span state, the three closed sets of feature 111, the key of the ceiling of workers, the requirement for T-43, the keys of `loop.yield.*`.
- depends on: W-100-02 (Owners that were not moved with the split 115 → 116 (EP-16, the fact block, two schema ids, closed sets 142 and 143, the package `@specstride/integrity`)), W-100-03 (Owners that were not moved with the split 142 → 143 (engine services of EP-04, the tree store, the ledger kinds of `parallel`))

### W-ORC-10 · `close-queue` · medium — Close CQ-033

- Findings merged: B-8.2c-004 (part), B-8.2c-006 (part)
- Files and lines:
  - `docs/ecosystem`: `docs/ecosystem/CLARIFY-QUEUE.md` (row CQ-033, column "Status")
- Question to close: **CQ-033**
- Evidence: `specs/100-specstride/annexes/B-state.md:245` (`run:<runId>:events-legacy:<k>`, the file of the engine start with the ordinal `<k>`) and F100-FR-229 (`:291`): one file per engine start, as the question recommends
- Change: Write "closed by the amendment of feature 100" with the evidence.
- depends on: none

### W-ORC-11 · `close-queue` · medium — Close CQ-038

- Findings merged: B-8.2c-004 (part)
- Files and lines:
  - `docs/ecosystem`: `docs/ecosystem/CLARIFY-QUEUE.md` (row CQ-038, column "Status")
- Question to close: **CQ-038**
- Evidence: `specs/100-specstride/annexes/B-state.md:246` (`launch:<launchId>:comment`) and F100-FR-229 (`:291`), as the question recommends
- Change: Write "closed by the amendment of feature 100" with the evidence.
- depends on: none

### W-ORC-12 · `close-queue` · medium — Close CQ-044

- Findings merged: B-8.2c-004 (part), B-8.2c-005 (part)
- Files and lines:
  - `docs/ecosystem`: `docs/ecosystem/CLARIFY-QUEUE.md` (row CQ-044, column "Status")
- Question to close: **CQ-044**
- Evidence: `specs/100-specstride/annexes/B-state.md:254` (`run:<runId>:task-list`, written by the engine at launch, read by the engine and the loop layers)
- Change: Write "closed by the amendment of feature 100" with the evidence. The answer is the other one of the question: a logical name from feature 100, not storage by the consumer.
- depends on: none

### W-ORC-13 · `close-queue` · medium — Close CQ-065

- Findings merged: B-8.2c-004 (part)
- Files and lines:
  - `docs/ecosystem`: `docs/ecosystem/CLARIFY-QUEUE.md` (row CQ-065, column "Status")
- Question to close: **CQ-065**
- Evidence: `specs/100-specstride/annexes/B-state.md:250` (`package:harness:<id>`, place `package`), as the question recommends
- Change: Write "closed by the amendment of feature 100" with the evidence.
- depends on: none

### W-ORC-14 · `close-queue` · medium — Close CQ-093

- Findings merged: B-8.2c-004 (part)
- Files and lines:
  - `docs/ecosystem`: `docs/ecosystem/CLARIFY-QUEUE.md` (row CQ-093, column "Status")
- Question to close: **CQ-093**
- Evidence: `specs/100-specstride/annexes/B-state.md:255` to `:257` (`reverse:<slug>:claims:<unit-key>`, `reverse:<slug>:test-plan`, `reverse:<slug>:scaffolds`, all in the workspace part), as the question recommends
- Change: Write "closed by the amendment of feature 100" with the evidence.
- depends on: none

### W-ORC-15 · `close-queue` · medium — Close CQ-123

- Findings merged: B-8.2c-004 (part)
- Files and lines:
  - `docs/ecosystem`: `docs/ecosystem/CLARIFY-QUEUE.md` (row CQ-123, column "Status")
- Question to close: **CQ-123**
- Evidence: `specs/100-specstride/annexes/B-state.md:252` (`package:context-budget`), as the question recommends
- Change: Write "closed by the amendment of feature 100" with the evidence.
- depends on: none

### W-ORC-16 · `close-queue` · medium — Close CQ-181

- Findings merged: B-8.2c-005 (part)
- Files and lines:
  - `docs/ecosystem`: `docs/ecosystem/CLARIFY-QUEUE.md` (row CQ-181, column "Status")
- Question to close: **CQ-181**
- Evidence: `specs/100-specstride/annexes/B-state.md:254` (`run:<runId>:task-list`)
- Change: Write "closed by the amendment of feature 100" with the evidence. The name differs from the form the question recommends (`phase:<N>:tasks-at-launch`): it is one per run, not per phase.
- depends on: none

### W-ORC-17 · `close-queue` · medium — Close CQ-099

- Findings merged: B-8.2c-011 (part)
- Files and lines:
  - `docs/ecosystem`: `docs/ecosystem/CLARIFY-QUEUE.md` (row CQ-099, column "Status")
- Question to close: **CQ-099**
- Evidence: `specs/100-specstride/annexes/B-state.md:678` (`specstride.inspect.<verb>/1`, owner 119), as the question recommends
- Change: Write "closed by the amendment of feature 100" with the evidence.
- depends on: none

### W-ORC-18 · `close-queue` · medium — Close CQ-105

- Findings merged: B-8.2c-011 (part)
- Files and lines:
  - `docs/ecosystem`: `docs/ecosystem/CLARIFY-QUEUE.md` (row CQ-105, column "Status")
- Question to close: **CQ-105**
- Evidence: `specs/100-specstride/annexes/B-state.md:669` to `:672` (`specstride.invocation/1`, `specstride.producer-status/1`, `specstride.provider-terminal/1`, `specstride.invocation-result/1`, owner 126), as the question recommends
- Change: Write "closed by the amendment of feature 100" with the evidence.
- depends on: none

### W-ORC-19 · `close-queue` · medium — Close CQ-114

- Findings merged: B-8.2c-011 (part)
- Files and lines:
  - `docs/ecosystem`: `docs/ecosystem/CLARIFY-QUEUE.md` (row CQ-114, column "Status")
- Question to close: **CQ-114**
- Evidence: `specs/100-specstride/annexes/B-state.md:674` (`specstride.retrospective/1`, owner 106), as the question recommends
- Change: Write "closed by the amendment of feature 100" with the evidence.
- depends on: none

### W-ORC-20 · `orchestrator` · low — Stale counts and stale owner sentences in the documents of `docs/ecosystem`

- Findings merged: B-8.2f-017 (part)
- Files and lines:
  - `docs/ecosystem`: `docs/ecosystem/architecture.md:422`, `docs/ecosystem/feature-briefs.md:121`, `docs/ecosystem/DECISIONS-PENDING.md:153`, `docs/ecosystem/decision-log.md:88` (2,783 behaviour items: 2,785); `architecture.md:427` ("Wave 1 has 31 features and the umbrella": 40 and the umbrella, 41 specifications); `architecture.md:474` ("Numbers 116 and 140 stay unused": both are in use); `architecture.md:478` ("fingerprints and the protected set to 115, which 105 consumes; the step runner to 105": 116 and 148); `architecture.md:205` ("EP-01 to EP-18": EP-19); `feature-briefs.md:50` ("Wave 1: 31 features and the umbrella": 40); `feature-briefs.md:175` ("The other 30 features": 39); `feature-briefs.md:6180-6182` (owners of extension points: 103 (2), 122 (2), and one each for 104, 105, 109, 110, 111, 112, 113, 115, 116, 123, 127, 129, 147, 148, 149); `feature-briefs.md:20`, `docs/ecosystem/traceability.md:16` (85 rows, DV-001 to DV-083: the count of the register)
- Change: Write the counts that hold. These documents are Stage A artifacts that the owner approved; the change is a count or an owner after a split that ruling 15 allows, not a change of a decision.
- depends on: none

### W-ORC-21 · `orchestrator` · low — The column "feature" of nine queue rows names the feature before the split

- Findings merged: B-8.2f-016
- Files and lines:
  - `docs/ecosystem`: `docs/ecosystem/CLARIFY-QUEUE.md`: CQ-084, CQ-085 (115: write 116); CQ-032, CQ-033 (111: write 144); CQ-100, CQ-101 (119: write 145); CQ-153, CQ-154 (105: write 148); CQ-175 (101: write 149). Cited at `specs/116-check-integrity-and-unit-evidence/spec.md:474-475`, `specs/144-compatibility-projection/spec.md:244-245`, `specs/145-presenter/spec.md:415-416`, `specs/148-check-runner/spec.md:495-496`, `specs/149-attempt-planner-and-seams/spec.md:416`
- Change: Write the new number in the column.
- depends on: none

### W-ORC-22 · `orchestrator` · low — Glossary row 10 still defines a run as "one engine invocation over one feature"

- Findings merged: B-8.2a-010 (part)
- Files and lines:
  - `docs/ecosystem`: `docs/ecosystem/consolidation.md`, section 1, row 10
- Change: Bring the row in line with ruling 24: the run is the logical run of one feature, whose id survives resume and relaunch; one engine process is an engine start.
- depends on: none

### W-ORC-23 · `orchestrator` · low — Register row DV-034 still reads "No rule exists. Proposed: ..."

- Findings merged: none (B-8.4b, section "Not checked", seen in passing)
- Files and lines:
  - `docs/ecosystem`: `docs/ecosystem/consolidation.md:955` (DV-034)
- Change: Write the rule that ruling 68 settled and F100-FR-176 carries: under the `parity` profile no line without an as-is equivalent is printed. What the second suite compares stays CQ-028.
- depends on: none

## 5. Where reports disagree, and which one is right

For each point the place was read in the file. Nothing else was verified again.

| # | Subject | Report and what it says | Report and what it says | What the file says | Which is right |
|---|---|---|---|---|---|
| 1 | Is the weaker proof of a tool-less critic already a queued question? | B-8.3d, below its table of findings: "the weaker proof of a tool-less critic for pi and prime is CQ-110", so not a finding | B-8.3a-001 and B-8.3c-009: CQ-110 covers the session identity of the pi critic only; no ruling and no question covers the proof as such | `docs/ecosystem/CLARIFY-QUEUE.md:119` (CQ-110, raised by 134): the question is that the pi critic runs with no session; the recommended answer uses the weaker proof. `specs/100-specstride/annexes/C-ports-and-edges.md:205` and `:218` (F100-FR-230) and `specs/109-harness-seam/spec.md:393` (F109-FR-038) allow the weaker proof for every harness whose stream has no initial record, dsh among them | B-8.3a and B-8.3c. CQ-110 rests on the weaker proof and does not ask whether Principle IX allows it. A question is proposed, and the plans record the deviation. B-8.3d is right in so far as the orchestrator may widen CQ-110 in place of a new number |
| 2 | Ruling P2 and the source of `loop.parallel.allow_detect` | B-8.4c, row P2: `reflected`; "the specs apply the rule for widening keys of ruling 35" | B-8.4a, section "Not checked": F100-FR-112 accepts the key from the environment or a flag where P2 says user config; "the same question of source as finding B-8.4a-001" | `specs/100-specstride/annexes/C-ports-and-edges.md:883` (F100-FR-112): "in user configuration, the environment or a flag". `APPROVAL.md`, ruling P2: "in user config". `specs/100-specstride/annexes/C-ports-and-edges.md:877` (F100-FR-111, ruling 34): "in user configuration" | B-8.4a on the text: F100-FR-112 is wider than the words of the ruling, and feature 100 reads rulings 34 and P2 in two ways. Whether the wider reading is meant is for the owner: one question covers both rulings. No text of ruling P2 changes before the question is queued |
| 3 | The owner 115 of `@specstride/integrity` in the package graph | B-8.3b, section "Checked", feature 116: "no finding", because rule 5 of the graph and `STAGE-B-F100-AMENDMENTS.md:223` record that the owners of the split are not applied | B-8.2f-001, B-8.2c-007, B-8.2d-004: feature 100 is stale and disagrees with itself | `specs/100-specstride/contracts/data/package-graph.json:324`: "Owners of the two splits that still run (115 to 116, 142 to 143) are not yet applied"; `specs/100-specstride/spec.md:732`: "Still running". Both splits are complete: `specs/116-*` and `specs/143-*` exist with spec, plan and tasks, and annex X already names 116 and 143 | B-8.2f, B-8.2c and B-8.2d. The record that B-8.3b relies on is itself stale |
| 4 | Do the first two rows of the table at `specs/112-doctor/spec.md:432`, `:433` need new questions? | B-8.2f-008: "the rows of `:432` and `:433` get two new ids that the orchestrator adds to the queue" | B-8.2e-011: `specs/112-doctor/spec.md:433` is a stale "row needed"; the row exists | `specs/100-specstride/annexes/X-cross-layer.md:305`: row 134 of §X.6, "Groups of a doctor check", owner 112. `:525`: row 61 of §X.7, "Options of the doctor", with the four keys | B-8.2e. Both rows were answered by the amendments to feature 100; the two lines cite the rows, and no question is added. B-8.2f is right that the label CQ-071 at `:432` names another question |
| 5 | Severity of the narrowed ruling P14 | B-8.2e-001: critical | B-8.4c-001: medium (verdict `partly`) | `specs/138-adapter-prime/spec.md:221`, `:671` and `specs/130-adapter-dsh/spec.md:216` limit the bars to the audience `distributed`; `APPROVAL.md`, ruling P14, has no condition | Critical, by order of the orchestrator: `STAGE-B-REVIEW-PROMPT.md` section 4 rates a contradicted ruling critical. The wording of the repair is taken from B-8.4c ("Under every audience ... as critic") |
| 6 | The placeholder `CQ-pending-4` of feature 106 (names of the learning event types) | B-8.2f-008: "a new queue id" | B-8.2d-017 and B-8.2d-019: the catalogue of feature 111 holds the types (`learning.observed` and three `learning.knob_*`), four and not five | `specs/106-learning/spec.md:591`: "The five as-is types are given rows by feature 111's catalogue; this feature needs them named" | B-8.2d. The catalogue names the types, so no question stays open; feature 106 cites the catalogue and settles four against five |
| 7 | The placeholder `CQ-pending-5` of feature 126 (what the context of `open` holds) | B-8.2d-003 and B-8.2d-017: not in the queue; give it a number | B-8.2f-008: it is CQ-032 and CQ-119 | `specs/100-specstride/spec.md:529`: the amendment of annex C §C.10 lists the content of the context and names CQ-032 and CQ-119 | B-8.2f. The placeholder becomes "CQ-032, CQ-119" |
| 8 | The directory of a new test | B-8.3a-012 proposes `tests/own/101/` | B-8.3d-012 reports `tests/own/149/` as a directory that differs from those of feature 100 | Not read: a proposal stands against a finding, no file decides | Neither is wrong on a fact. The new test of feature 101 goes where the rule of feature 100 puts it (item on test directories) |
| 9 | The number of config keys | B-8.2e, method table: "250 valid ... spellings of `config-keys.tsv`" | B-8.2e-017 and the section "Checked" of the same report: 253 keys | `specs/110-config-and-terms/contracts/config-keys.tsv` has 254 lines, one of them the heading; CQ-160 says "all 253 keys" | 253. The figure 250 is what the report's script matched |

## 6. Index: finding to item

| Finding | Severity in the report | Item or items |
|---|---|---|
| B-8.2a-001 | high | W-125-01 |
| B-8.2a-002 | medium | W-X-17 |
| B-8.2a-003 | medium | W-126-03 |
| B-8.2a-004 | medium | W-X-06, W-X-36 |
| B-8.2a-005 | medium | W-X-06 |
| B-8.2a-006 | medium | W-100-14, W-X-36 |
| B-8.2a-007 | medium | W-134-01 |
| B-8.2a-008 | medium | W-125-04 |
| B-8.2a-009 | medium | W-X-06 |
| B-8.2a-010 | low | W-ORC-22, W-X-06 |
| B-8.2a-011 | low | W-X-31 |
| B-8.2a-012 | low | W-110-12, W-X-36 |
| B-8.2a-013 | low | W-100-15 |
| B-8.2a-014 | low | W-113-03 |
| B-8.2a-015 | low | W-X-31 |
| B-8.2a-016 | low | W-X-30 |
| B-8.2a-017 | low | W-X-32 |
| B-8.2b-001 | critical | W-123-01, W-ORC-01 |
| B-8.2b-002 | high | W-123-02, W-ORC-04 |
| B-8.2b-003 | high | W-123-02 |
| B-8.2b-004 | medium | W-122-01 |
| B-8.2b-005 | medium | W-108-01 |
| B-8.2b-006 | medium | W-100-24 |
| B-8.2b-007 | medium | W-127-01 |
| B-8.2b-008 | medium | W-103-01 |
| B-8.2b-009 | medium | W-101-01 |
| B-8.2b-010 | medium | W-127-02 |
| B-8.2b-011 | low | W-142-01 |
| B-8.2b-012 | low | W-100-11 |
| B-8.2c-001 | high | W-146-01 |
| B-8.2c-002 | high | W-105-01 |
| B-8.2c-003 | high | W-140-01, W-ORC-03 |
| B-8.2c-004 | medium | W-ORC-10, W-ORC-11, W-ORC-12, W-ORC-13, W-ORC-14, W-ORC-15, W-X-10 |
| B-8.2c-005 | medium | W-115-01, W-ORC-12, W-ORC-16 |
| B-8.2c-006 | medium | W-144-02, W-ORC-10 |
| B-8.2c-007 | medium | W-100-02 |
| B-8.2c-008 | medium | W-148-01 |
| B-8.2c-009 | medium | W-100-09, W-128-01 |
| B-8.2c-010 | medium | W-X-25 |
| B-8.2c-011 | medium | W-100-09, W-ORC-17, W-ORC-18, W-ORC-19, W-X-26 |
| B-8.2c-012 | low | W-100-16 |
| B-8.2c-013 | low | W-100-10 |
| B-8.2c-014 | low | W-141-03 |
| B-8.2c-015 | low | W-110-13 |
| B-8.2d-001 | high | W-111-01 |
| B-8.2d-002 | high | W-126-01, W-ORC-02 |
| B-8.2d-003 | high | W-126-02 |
| B-8.2d-004 | high | W-100-02 |
| B-8.2d-005 | high | W-144-01 |
| B-8.2d-006 | high | W-111-02 |
| B-8.2d-007 | high | W-111-03 |
| B-8.2d-008 | medium | W-111-04 |
| B-8.2d-009 | medium | W-110-04 |
| B-8.2d-010 | medium | W-X-12 |
| B-8.2d-011 | medium | W-X-12 |
| B-8.2d-012 | medium | W-100-17, W-X-22 |
| B-8.2d-013 | medium | W-100-18, W-111-05 |
| B-8.2d-014 | medium | W-129-01 |
| B-8.2d-015 | medium | W-X-23 |
| B-8.2d-016 | medium | W-X-24 |
| B-8.2d-017 | medium | W-106-02, W-X-13 |
| B-8.2d-018 | medium | W-111-06 |
| B-8.2d-019 | low | W-106-02 |
| B-8.2d-020 | low | W-128-04 |
| B-8.2d-021 | low | W-111-09 |
| B-8.2e-001 | critical | W-138-02 |
| B-8.2e-002 | high | W-110-01 |
| B-8.2e-003 | high | W-110-02 |
| B-8.2e-004 | high | W-100-01 |
| B-8.2e-005 | high | W-X-03 |
| B-8.2e-006 | high | W-X-04, W-X-35 |
| B-8.2e-007 | high | W-110-03 |
| B-8.2e-008 | high | W-100-04, W-110-04 |
| B-8.2e-009 | medium | W-100-05, W-110-06 |
| B-8.2e-010 | medium | W-110-07 |
| B-8.2e-011 | medium | W-X-11 |
| B-8.2e-012 | medium | W-118-01 |
| B-8.2e-013 | medium | W-110-08 |
| B-8.2e-014 | medium | W-110-09 |
| B-8.2e-015 | medium | W-X-16 |
| B-8.2e-016 | medium | W-100-08, W-110-03 |
| B-8.2e-017 | medium | W-X-05 |
| B-8.2e-018 | low | W-110-11 |
| B-8.2e-019 | low | W-112-02 |
| B-8.2e-020 | low | W-123-04 |
| B-8.2e-021 | low | W-100-04 |
| B-8.2f-001 | high | W-100-02, W-ORC-07 |
| B-8.2f-002 | high | W-100-03 |
| B-8.2f-003 | high | W-X-01 |
| B-8.2f-004 | high | W-X-01 |
| B-8.2f-005 | medium | W-X-01, W-X-07 |
| B-8.2f-006 | medium | W-X-20 |
| B-8.2f-007 | medium | W-X-21 |
| B-8.2f-008 | medium | W-X-13 |
| B-8.2f-009 | medium | W-X-18 |
| B-8.2f-010 | medium | W-ORC-06, W-X-19 |
| B-8.2f-011 | medium | W-138-03 |
| B-8.2f-012 | medium | W-111-07 |
| B-8.2f-013 | medium | W-100-13 |
| B-8.2f-014 | low | W-X-33 |
| B-8.2f-015 | low | W-115-03, W-X-34 |
| B-8.2f-016 | low | W-ORC-21 |
| B-8.2f-017 | low | W-100-02, W-100-03, W-ORC-06, W-ORC-20, W-X-05, W-X-07 |
| B-8.3a-001 | critical | W-100-19, W-100-20 |
| B-8.3a-002 | high | W-104-01 |
| B-8.3a-003 | high | W-X-01 |
| B-8.3a-004 | high | W-106-01 |
| B-8.3a-005 | medium | W-100-21, W-100-26 |
| B-8.3a-006 | medium | W-X-27 |
| B-8.3a-007 | medium | W-105-02 |
| B-8.3a-008 | medium | W-X-02 |
| B-8.3a-009 | medium | W-100-22 |
| B-8.3a-010 | medium | W-X-09 |
| B-8.3a-011 | medium | W-X-05, W-X-07 |
| B-8.3a-012 | medium | W-101-03 |
| B-8.3a-013 | low | W-X-29 |
| B-8.3a-014 | low | W-X-14 |
| B-8.3a-015 | low | W-X-07 |
| B-8.3a-016 | low | W-X-27 |
| B-8.3a-017 | low | W-X-05, W-X-28 |
| B-8.3b-001 | critical | W-113-01 |
| B-8.3b-002 | high | W-X-01 |
| B-8.3b-003 | high | W-X-02 |
| B-8.3b-004 | medium | W-X-27 |
| B-8.3b-005 | medium | W-X-07 |
| B-8.3b-006 | medium | W-111-07 |
| B-8.3b-007 | medium | W-100-25 |
| B-8.3b-008 | medium | W-119-01 |
| B-8.3b-009 | medium | W-X-08 |
| B-8.3b-010 | medium | W-116-01 |
| B-8.3b-011 | medium | W-113-02 |
| B-8.3b-012 | medium | W-X-09 |
| B-8.3b-013 | low | W-X-14 |
| B-8.3b-014 | low | W-X-07, W-X-14 |
| B-8.3c-001 | critical | W-130-01, W-130-02 |
| B-8.3c-002 | high | W-X-01 |
| B-8.3c-003 | high | W-X-01 |
| B-8.3c-004 | medium | W-125-03 |
| B-8.3c-005 | medium | W-X-15 |
| B-8.3c-006 | medium | W-131-01 |
| B-8.3c-007 | medium | W-122-02 |
| B-8.3c-008 | medium | W-123-03 |
| B-8.3c-009 | medium | W-100-19, W-100-20 |
| B-8.3c-010 | medium | W-X-07 |
| B-8.3c-011 | low | W-131-02 |
| B-8.3c-012 | low | W-X-14 |
| B-8.3c-013 | low | W-126-04 |
| B-8.3d-001 | critical | W-138-01 |
| B-8.3d-002 | high | W-X-01 |
| B-8.3d-003 | high | W-X-01 |
| B-8.3d-004 | medium | W-100-03, W-X-07 |
| B-8.3d-005 | medium | W-X-27 |
| B-8.3d-006 | medium | W-X-14 |
| B-8.3d-007 | medium | W-X-09 |
| B-8.3d-008 | medium | W-100-26 |
| B-8.3d-009 | medium | W-ORC-08 |
| B-8.3d-010 | medium | W-143-01 |
| B-8.3d-011 | low | W-144-03, W-X-29 |
| B-8.3d-012 | low | W-X-28 |
| B-8.4a-001 | medium | W-100-23, W-110-05 |
| B-8.4a-002 | medium | W-125-02 |
| B-8.4a-003 | medium | W-X-05 |
| B-8.4a-004 | low | W-106-03 |
| B-8.4b-001 | medium | W-115-02 |
| B-8.4b-002 | medium | W-130-01, W-138-01 |
| B-8.4b-003 | medium | W-101-02 |
| B-8.4b-004 | medium | W-110-04 |
| B-8.4b-005 | medium | W-X-04 |
| B-8.4b-006 | low | W-128-02 |
| B-8.4b-007 | low | W-112-01 |
| B-8.4b-008 | low | W-100-12 |
| B-8.4b-009 | low | W-111-08 |
| B-8.4c-001 | medium | W-138-02 |
| B-8.4c-002 | medium | W-100-06 |
| B-8.4c-003 | medium | W-110-10 |
| B-8.4c-004 | medium | W-100-07 |
| B-8.4c-005 | medium | W-105-03 |
| B-8.4c-006 | low | W-128-03 |
| B-8.4c-007 | low | W-X-03 |
| B-8.4c-008 | low | W-X-05 |

