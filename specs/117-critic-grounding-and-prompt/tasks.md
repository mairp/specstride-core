---
description: "Task list of feature 117-critic-grounding-and-prompt"
---

# Tasks: Critic grounding and prompt (feature 117)

**Input**: Design documents from `specs/117-critic-grounding-and-prompt/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required. Parity tests and characterization tests are required tasks (`STAGE-B-RULES.md` section 3). A test task is written before the task it tests and must fail before that task is done.

**Organization**: Tasks are grouped by the user stories of `spec.md`, in the order of construction of `plan.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (another file, no dependency on an unfinished task)
- **[Story]**: the user story of `spec.md` (US1 to US5)
- A test task carries `proves:`; a parity test also `fixture:` and `surfaces:` (feature 141, §O.6)
- An implementation task carries `covers:` with the requirements it serves

## What feature 117 inherits

| Inherited work | Task |
|---|---|
| Lisa's grounding brought to the baseline before its characterization test (C-17) | T001, the first task |
| The capture that shows whether a sandbox denies reads of the withheld paths | A task of feature 131. Feature 117 consumes its result in T071; it runs no capture and no paid probe |
| The import rule of the core: no `node:fs` (F100-FR-012; `assumption: CQ-185`) | T009, T092 to T095: files are read and moved through ports |

Feature 117 has no spike, no live probe and no paid call.

## Path Conventions

Modules of `@specstride/core` under `packages/core/src/critic-input/`, none of which imports
`node:fs` or `node:fs/promises`; parity tests under
`tests/parity/117/`; characterization tests under `tests/characterization/117/`. "Data files" are
the files of `specs/117-critic-grounding-and-prompt/contracts/`.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: the Lisa alignment, the directories and the data

- [x] T001 Extract Lisa's grounding source at `363e6a3` into packages/core/src/critic-input/grounding/ (read from the Lisa baseline at `363e6a3`), list in packages/core/src/critic-input/grounding/LISA-ALIGNMENT.md every difference from F117-FR-003 to F117-FR-012 (cap 80, NOT-SHOWN line, wildcard expansion at snapshot time), and bring the source to the baseline; where alignment costs more than new code, write new and record it. No characterization test is written before this task is done
  - covers: F117-FR-009
- [x] T002 Create the directories of `plan.md` under packages/core/src/critic-input/ (`grounding/`, `prompt/`, `pins/`, `hide/`, `data/`) and the test directories tests/parity/117/ and tests/characterization/117/
  - covers: F117-FR-026
- [x] T003 [P] Copy the data files of specs/117-critic-grounding-and-prompt/contracts/ into packages/core/src/critic-input/data/ and add a build check that the copies equal the sources
  - covers: F117-FR-007; F117-FR-011; F117-FR-023
- [x] T004 Complete the as-is literals with the long as-is texts (the rules of the prompt, the lines under the heading of the snapshot, the gap section, the NEEDS-GROUNDING line, the NOT-SHOWN line, the design-context frame, the pin block), taken from the Specstride baseline at `9cab15d`, files `lib/critic.py` and `lib/verdict_pins.py`: first in the source specs/117-critic-grounding-and-prompt/contracts/as-is-literals.json, then in its copy packages/core/src/critic-input/data/as-is-literals.json, so that the build check of T003 holds; after T003
  - covers: F117-FR-007; F117-FR-008; F117-FR-014; F117-FR-021; F117-FR-031

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: what every story needs: switches, ports, the refusal guard

**⚠️ CRITICAL**: no story can start before this phase is done

- [x] T005 [P] Parity test PT-117-C-060-grounding-switch in tests/parity/117/PT-117-C-060-grounding-switch.test.ts: the as-is values that switch grounding on and off
  - proves: B-0801
  - fixture: FX-25
  - surfaces: exit, transcript
  - covers: F117-FR-001
- [x] T006 [P] Parity test PT-117-C-061-grounding-switch in tests/parity/117/PT-117-C-061-grounding-switch.test.ts: the as-is variable as alias of the switch
  - proves: B-0847
  - fixture: FX-25
  - surfaces: exit, transcript
  - covers: F117-FR-001
- [x] T007 [P] Parity test PT-117-C-061-caps in tests/parity/117/PT-117-C-061-caps.test.ts: the cap of presence lines, the anchor ceiling, the override of the context window, the non-integer cases (the cap of presence lines and the anchor ceiling fail the call; the context window is ignored with a warning)
  - proves: B-0808; B-0809; B-0810
  - fixture: FX-25/file-cap, FX-25/window-per-harness
  - surfaces: exit, stderr, transcript
  - covers: F117-FR-002
- [x] T008 Register the seven switches of `contracts/parity-rows.json` (rows 52 to 58 of annex X §X.7) with their defaults, their as-is aliases and their values under `parity` in packages/core/src/critic-input/switches.ts, through the config interface of feature 100 annex X §X.2; the keys are confirmed in the key list of feature 110
  - covers: F117-FR-001; F117-FR-002; F117-FR-024; F117-FR-029
- [x] T009 [P] Define the ports of the feature in packages/core/src/critic-input/ports.ts: a file-reading port (stat, read with a byte limit, real path, list a directory, match a pattern below a root, no following of links for claims), a file-moving port (move a file with bytes, mode and modification time; set a file aside; test for existence; list the worker root) and the process port for one fixed-argument probe; types only, no import of a process, network or file-system module
  - covers: F117-FR-017; F117-FR-018
- [x] T010 [P] Characterization test CT-117-18 in tests/characterization/117/CT-117-18.test.ts: each of the seven refused roots cited absolute, relative and through a symbolic link (21 cases), plus a wildcard match, a placeholder match and an expanded directory that reach a refused root: none is grounded, no root is named, none is a gap, each refusal is recorded; with the loop strategy `classic` and `micro` and with parallel units on and off
  - proves: F117-FR-018
  - covers: F117-FR-018
- [x] T011 Implement the refusal guard in packages/core/src/critic-input/grounding/refuse.ts: resolve the real path, test it against the seven roots resolved from the logical roots of feature 100, record the refusal
  - covers: F117-FR-018

**Checkpoint**: switches, ports and the refusal guard exist

---

## Phase 3: User Story 1 - The critic judges from what is on disk (Priority: P1) 🎯 MVP

**Goal**: the grounding snapshot, equal to the baseline's

**Independent Test**: the scenarios of FX-25 give `equal` on the grounding block of the critic prompt in the stub transcript; the prompt is compared in full once phase 4 is done

### Tests for User Story 1

- [x] T012 [P] [US1] Parity test PT-117-C-066-citation-extraction in tests/parity/117/PT-117-C-066-citation-extraction.test.ts: candidates, locators, brace shorthand, dropped candidates, the extraction cap
  - proves: B-0924; B-0925; B-0926; B-0927; B-0928; B-0929; B-0930; B-0931; B-0932; B-0933; B-0934; B-0935
  - fixture: FX-25
  - surfaces: transcript
  - covers: F117-FR-003
- [x] T013 [P] [US1] Parity test PT-117-C-066-path-list in tests/parity/117/PT-117-C-066-path-list.test.ts: order of sources, truncation of the phase evidence, priority paths, the proofs directory first, the inherited-obligations block left out of extraction
  - proves: B-0951; B-0952; B-1001; B-1002; B-1004; B-1005; B-1006
  - fixture: FX-25
  - surfaces: transcript
  - covers: F117-FR-004
- [x] T014 [P] [US1] Parity test PT-117-C-066-resolution in tests/parity/117/PT-117-C-066-resolution.test.ts: the resolution order, members, build exports, placeholder, the escape rule
  - proves: B-0936; B-0937; B-0938; B-0939; B-0941; B-0942; B-1007
  - fixture: FX-25/placeholder, FX-25/missing-file
  - surfaces: transcript
  - covers: F117-FR-005
- [x] T015 [P] [US1] Parity test PT-117-C-066-absolute-citation in tests/parity/117/PT-117-C-066-absolute-citation.test.ts: an absolute citation outside the workspace is honoured
  - proves: B-0940
  - fixture: FX-25
  - surfaces: transcript
  - covers: F117-FR-006
- [x] T016 [P] [US1] Parity test PT-117-C-065-presence-lines in tests/parity/117/PT-117-C-065-presence-lines.test.ts: heading and the lines for a file, a directory, a missing path, a build export, no cited path
  - proves: B-0887; B-0888; B-0889; B-0890; B-0891; B-0895
  - fixture: FX-25/missing-file, FX-25/file-cap
  - surfaces: transcript
  - covers: F117-FR-007
- [x] T017 [P] [US1] Parity test PT-117-C-066-presence-lines in tests/parity/117/PT-117-C-066-presence-lines.test.ts: an unreadable file and a binary file
  - proves: B-0956; B-0957
  - fixture: FX-25
  - surfaces: transcript
  - covers: F117-FR-007
- [x] T018 [P] [US1] Parity test PT-117-C-066-file-cap in tests/parity/117/PT-117-C-066-file-cap.test.ts: the cap ends the loop; the NOT-SHOWN line
  - proves: B-0953
  - fixture: FX-25/file-cap
  - surfaces: transcript
  - covers: F117-FR-008
- [x] T019 [P] [US1] Parity test PT-117-C-066-wildcard in tests/parity/117/PT-117-C-066-wildcard.test.ts: no expansion at extraction; one presence line with at most 20 names; no content
  - proves: B-0954; B-0955
  - fixture: FX-25/wildcard-match
  - surfaces: transcript
  - covers: F117-FR-010
- [x] T020 [P] [US1] Parity test PT-117-C-065-byte-budget in tests/parity/117/PT-117-C-065-byte-budget.test.ts: the line of an omitted excerpt
  - proves: B-0892
  - fixture: FX-25/byte-budget
  - surfaces: transcript
  - covers: F117-FR-011
- [x] T021 [P] [US1] Parity test PT-117-C-066-byte-budget in tests/parity/117/PT-117-C-066-byte-budget.test.ts: budgets and scaling, whole file, anchored excerpt, head and tail, the split between priority and other files
  - proves: B-0902; B-0903; B-0904; B-0913; B-0914; B-0949; B-0950; B-0958; B-0959; B-0960; B-0961
  - fixture: FX-25/byte-budget, FX-25/window-per-harness
  - surfaces: transcript
  - covers: F117-FR-011
- [x] T022 [P] [US1] Parity test PT-117-C-066-directory-expansion in tests/parity/117/PT-117-C-066-directory-expansion.test.ts: the limits 40 and 45 and the skipped names
  - proves: B-0915; B-0916
  - fixture: FX-25
  - surfaces: transcript
  - covers: F117-FR-012
- [x] T023 [P] [US1] Parity test PT-117-C-066-needs-grounding-carried in tests/parity/117/PT-117-C-066-needs-grounding-carried.test.ts: up to 12 carried paths join the priority set
  - proves: B-0943; B-0944
  - fixture: FX-25, FX-02
  - surfaces: transcript
  - covers: F117-FR-013
- [x] T024 [P] [US1] Parity test PT-117-C-065-grounding-gap in tests/parity/117/PT-117-C-065-grounding-gap.test.ts: the gap section of the prompt
  - proves: B-0896
  - fixture: FX-25
  - surfaces: transcript
  - covers: F117-FR-014
- [x] T025 [P] [US1] Parity test PT-117-C-066-grounding-gap in tests/parity/117/PT-117-C-066-grounding-gap.test.ts: what counts as a gap; a directory never does
  - proves: B-0945
  - fixture: FX-25
  - surfaces: transcript
  - covers: F117-FR-014
- [x] T026 [P] [US1] Parity test PT-117-C-062-grounding-events in tests/parity/117/PT-117-C-062-grounding-events.test.ts: the as-is events `grounding_carried` and `grounding_gap` in the compatibility projection
  - proves: B-0854; B-0857
  - fixture: FX-25
  - surfaces: events
  - covers: F117-FR-015
- [x] T027 [P] [US1] Parity test PT-117-C-064-transparency in tests/parity/117/PT-117-C-064-transparency.test.ts: the transparency section at the end of the feedback
  - proves: B-0882
  - fixture: FX-25, FX-02
  - surfaces: state
  - covers: F117-FR-016
- [x] T028 [P] [US1] Parity test PT-117-C-065-probes in tests/parity/117/PT-117-C-065-probes.test.ts: the lines of the ignore probe, of the secret scan and the debug lines
  - proves: B-0884; B-0885; B-0886; B-0898; B-0899
  - fixture: FX-25
  - surfaces: transcript, stderr
  - covers: F117-FR-017
- [x] T029 [P] [US1] Parity test PT-117-C-066-probes in tests/parity/117/PT-117-C-066-probes.test.ts: when each probe runs, its limits, and that no command of the project runs
  - proves: B-0923; B-0946; B-0947; B-0948
  - fixture: FX-25
  - surfaces: transcript
  - covers: F117-FR-017
- [x] T030 [P] [US1] Characterization test CT-117-1 in tests/characterization/117/CT-117-1.test.ts: the grounding taken from Lisa, after T001: every cited path up to the cap has a presence line, a path beyond the cap is reported as not shown and never as missing, a wildcard is expanded
  - proves: 002 FR-021
  - covers: F117-FR-009
- [x] T031 [P] [US1] Characterization test CT-117-15 in tests/characterization/117/CT-117-15.test.ts: `critic.citation_unresolved` is emitted when a cited path or wildcard does not resolve, with `phase`, `attempt` and at most 20 `paths`, holds no content, projects to nothing and is never typed `critic.grounding_gap`; an absolute citation outside the workspace appears as `outside:<hash>` (F117-FR-043)
  - proves: F117-FR-015
  - covers: F117-FR-015
- [x] T032 [P] [US1] Characterization test CT-117-19 in tests/characterization/117/CT-117-19.test.ts: a file changed during the grounding pass gives two different fingerprints and a fact for the critic; the run does not halt; with the switch off nothing is fingerprinted and no output changes
  - proves: F117-FR-019
  - covers: F117-FR-019
- [x] T033 [P] [US1] Characterization test CT-117-20 in tests/characterization/117/CT-117-20.test.ts: modification times appear as the file system gives them; files written at one instant show that instant
  - proves: F117-FR-020
  - covers: F117-FR-020

### Implementation for User Story 1

- [x] T034 [P] [US1] Implement the citation extractor in packages/core/src/critic-input/grounding/extract.ts
  - covers: F117-FR-003
- [x] T035 [P] [US1] Implement the path list in packages/core/src/critic-input/grounding/path-list.ts: sources in order, truncation of the phase evidence, directories of the section, priority, carried paths
  - covers: F117-FR-004; F117-FR-013
- [x] T036 [US1] Implement the resolver in packages/core/src/critic-input/grounding/resolve.ts: search directories, members, preferred member, build exports, placeholder, escape rule, absolute citations; every result passes the refusal guard
  - covers: F117-FR-005; F117-FR-006; F117-FR-018
- [x] T037 [P] [US1] Implement excerpts and budgets in packages/core/src/critic-input/grounding/excerpt.ts from `budgets.json`: scaling, whole, anchored, head-tail, omitted, anchors of the section
  - covers: F117-FR-011
- [x] T038 [US1] Implement the snapshot builder in packages/core/src/critic-input/grounding/snapshot.ts: presence lines of every kind, the cap and the NOT-SHOWN line, wildcards at snapshot time, directory expansion, modification times as given
  - covers: F117-FR-007; F117-FR-008; F117-FR-010; F117-FR-012; F117-FR-020
- [x] T039 [P] [US1] Implement the grounding gap and its prompt section in packages/core/src/critic-input/grounding/gap.ts, and the transparency section that is handed to the writer of the feedback
  - covers: F117-FR-014; F117-FR-016
- [x] T040 [P] [US1] Implement the probes in packages/core/src/critic-input/grounding/probes.ts: the ignore probe through the process port with a fixed argument list and a limit of 10 seconds, its fallback, the secret scan
  - covers: F117-FR-017
- [x] T041 [P] [US1] Implement the fingerprint bracket in packages/core/src/critic-input/grounding/bracket.ts, using the fingerprint service of the content owner through feature 100 annex C §C.8, and hand a difference to the fact block
  - covers: F117-FR-019
- [x] T042 [US1] Emit the grounding events in packages/core/src/critic-input/events.ts: `critic.grounding_carried` and `critic.grounding_gap`, which the projection table of feature 144 renders as `grounding_carried` and `grounding_gap` (this task adds no row), and `critic.citation_unresolved` for a citation that does not resolve (its catalogue row is P1 of `analyze-report.md`); a path outside the workspace in `critic.citation_unresolved`, `prompt.built` or a refusal record is written as `outside:` and 16 hexadecimal characters of its canonical hash
  - covers: F117-FR-015

**Checkpoint**: the snapshot is equal to the baseline's on FX-25

---

## Phase 4: User Story 2 - The critic prompt fits the window and says what was cut (Priority: P1)

**Goal**: the assembler with the block set `as-is`, the fitter, the known-window rule

**Independent Test**: prompts for windows of several sizes stay inside the budget; every cut carries its marker

### Tests for User Story 2

- [x] T043 [P] [US2] Parity test PT-117-C-066-prompt-blocks in tests/parity/117/PT-117-C-066-prompt-blocks.test.ts: role line, rules, block order, the design-context frame
  - proves: B-0968; B-0969; B-0970; B-0971; B-0972; B-0974
  - fixture: FX-25, FX-02, FX-05
  - surfaces: transcript
  - covers: F117-FR-021
- [x] T044 [P] [US2] Parity test PT-117-C-066-prompt-parity in tests/parity/117/PT-117-C-066-prompt-parity.test.ts: the whole critic prompt with the block set `as-is`, compared in full (N-24)
  - proves: C-066
  - fixture: FX-25, FX-02, FX-05
  - surfaces: transcript
  - covers: F117-FR-029
- [x] T045 [P] [US2] Parity test PT-117-C-066-rejection-history in tests/parity/117/PT-117-C-066-rejection-history.test.ts: the rejection history in the prompt of the diagnostician, its order and its cap; none in the prompt of the critic
  - proves: B-0919; B-0964
  - fixture: FX-08, FX-02
  - surfaces: transcript
  - covers: F117-FR-022
- [x] T046 [P] [US2] Parity test PT-117-C-065-window-fit in tests/parity/117/PT-117-C-065-window-fit.test.ts: the line on standard error when a block was shrunk
  - proves: B-0897
  - fixture: FX-25/window-per-harness
  - surfaces: stderr
  - covers: F117-FR-023
- [x] T047 [P] [US2] Parity test PT-117-C-066-window-fit in tests/parity/117/PT-117-C-066-window-fit.test.ts: budget, reply reserve, order of shrinking, floor of 4096 bytes, the elision marker, criteria untouched
  - proves: B-0918; B-0920; B-0921; B-1011
  - fixture: FX-25/window-per-harness, FX-25/byte-budget
  - surfaces: transcript, stderr
  - covers: F117-FR-023
- [x] T048 [P] [US2] Parity test PT-117-C-066-still-over in tests/parity/117/PT-117-C-066-still-over.test.ts: with the value `send` the note is printed and the prompt is sent as it is
  - proves: B-0922
  - fixture: FX-25/window-per-harness
  - surfaces: transcript, stderr
  - covers: F117-FR-024
- [x] T049 [P] [US2] Parity test PT-117-C-060-debug in tests/parity/117/PT-117-C-060-debug.test.ts: the debug switch
  - proves: B-0804
  - fixture: FX-25
  - surfaces: stderr, state
  - covers: F117-FR-016
- [x] T050 [P] [US2] Parity test PT-117-C-064-debug-prompt in tests/parity/117/PT-117-C-064-debug-prompt.test.ts: the kept prompt under its logical name
  - proves: B-0873
  - fixture: FX-25
  - surfaces: state
  - covers: F117-FR-016
- [x] T051 [P] [US2] Characterization test CT-117-24 in tests/characterization/117/CT-117-24.test.ts: with the value `refuse` a prompt still over the budget is not sent: the outcome is `context_window_exceeded`, scored as a failed critic call, with an event that gives the sizes per block
  - proves: F117-FR-024
  - covers: F117-FR-024
- [x] T052 [P] [US2] Characterization test CT-117-25 in tests/characterization/117/CT-117-25.test.ts: no prompt is assembled for a critic without a known window; the smaller of a declared and an effective window is used; window and source are recorded
  - proves: F117-FR-025
  - covers: F117-FR-025
- [x] T053 [P] [US2] Characterization test CT-117-26 in tests/characterization/117/CT-117-26.test.ts: every block of the critic has the form of annex D §D.5; no block of the proposer reaches a critic-class call; rules, criteria and fact block are protected
  - proves: F117-FR-026
  - covers: F117-FR-026
- [x] T054 [P] [US2] Characterization test CT-117-28 in tests/characterization/117/CT-117-28.test.ts: `prompt.built` for every critic-class call, with bytes and token estimate per block, every reduction with its reason, the total, and no content
  - proves: F117-FR-028
  - covers: F117-FR-028
- [x] T055 [P] [US2] Characterization test CT-117-29 in tests/characterization/117/CT-117-29.test.ts: the switch of the block set: `as-is` gives no boundary, no fact block and no new sentence; `current` gives them
  - proves: F117-FR-029
  - covers: F117-FR-029
- [x] T056 [P] [US2] Characterization test CT-117-43 in tests/characterization/117/CT-117-43.test.ts: text from outside the runtime passes the one ingress, where it is redacted, before a kept prompt; a planted secret is in no event and no kept prompt; the nonce is in no event; an absolute citation outside the workspace appears in `prompt.built`, `critic.citation_unresolved` and a refusal record only as `outside:<hash>`, and in `grounding_gap` as at the baseline
  - proves: F117-FR-043
  - covers: F117-FR-043

### Implementation for User Story 2

- [x] T057 [US2] Implement the assembler in packages/core/src/critic-input/prompt/assemble.ts: blocks in the form of annex D §D.5, the as-is text from the data files, the two block sets of `critic-block-set.json`
  - covers: F117-FR-021; F117-FR-026; F117-FR-029
- [x] T058 [P] [US2] Implement the rejection history of the diagnostician in packages/core/src/critic-input/prompt/history.ts
  - covers: F117-FR-022
- [x] T059 [US2] Implement the window fitter in packages/core/src/critic-input/prompt/fit.ts: budget, order, floor, marker, the line on standard error, the over-window switch, the known-window rule
  - covers: F117-FR-023; F117-FR-024; F117-FR-025
- [x] T060 [US2] Emit `prompt.built` and keep the prompt under `attempt:<N>:<k>:<n>:critic-prompt` with the debug lines, in packages/core/src/critic-input/events.ts and packages/core/src/critic-input/prompt/debug.ts; the prompt is kept and the line with the nonce is printed only after the call has returned; kept text comes from the one ingress of F100-FR-009 (T097)
  - covers: F117-FR-016; F117-FR-028; F117-FR-043

**Checkpoint**: FX-25, FX-02 and FX-05 are `equal` on the critic prompt, apart from the pin block of a later phase attempt, which phase 7 adds

---

## Phase 5: User Story 3 - No repair history and no instruction from the workspace reaches the critic (Priority: P1)

**Goal**: the block set `current`: fact-block slot, framing, marker removal, the exclusion guard

**Independent Test**: two runs with the same final state in 1 and in 9 cycles give byte-identical prompts

### Tests for User Story 3

- [x] T061 [P] [US3] Characterization test CT-117-27 in tests/characterization/117/CT-117-27.test.ts: two runs with the same final state reached in 1 and in 9 cycles give byte-identical critic prompts apart from the two tokens of the call and the modification times of the presence lines, which the test sets equal (the named exception of F117-FR-027); a scan of every critic-class input finds none of the excluded fields of `excluded-vocabulary.json`
  - proves: F117-FR-027
  - covers: F117-FR-027
- [x] T062 [P] [US3] Characterization test CT-117-33 in tests/characterization/117/CT-117-33.test.ts: the slot of the fact block; a phase with 41 tasks under a small window shows every row that is not `pass` and one count line; the reduction is stated; the criteria are unchanged
  - proves: F117-FR-033
  - covers: F117-FR-033
- [x] T063 [P] [US3] Characterization test CT-117-34 in tests/characterization/117/CT-117-34.test.ts: a path with a line break, with control characters and with 1000 characters is escaped, stripped and cut to 256 bytes inside a boundary; a fact block with an unknown field is left out with a statement
  - proves: F117-FR-034
  - covers: F117-FR-034
- [x] T064 [P] [US3] Characterization test CT-117-35 in tests/characterization/117/CT-117-35.test.ts: a file of the workspace named like the fact block, and phase evidence that imitates a boundary and a heading of the runtime: the text stands inside a boundary, the pattern is escaped, the blocks of the runtime stand first; holds for the critic, the diagnostician and release verification; with the debug switch on, neither the nonce nor the boundary token is on disk before the call has returned (the kept prompt is written after it, F117-FR-016)
  - proves: F117-FR-035
  - covers: F117-FR-035
- [x] T065 [P] [US3] Characterization test CT-117-36 in tests/characterization/117/CT-117-36.test.ts: phase evidence and a grounded file with lines that carry the marker token reach the prompt without them; the removal is recorded without content; a paraphrase is not detected, which the test states
  - proves: F117-FR-036
  - covers: F117-FR-036
- [x] T066 [P] [US3] Characterization test CT-117-37 in tests/characterization/117/CT-117-37.test.ts: integrity events appear by kind and without counts; a refused protected change by its neutral kind; the two fixed sentences; an unknown kind is not shown
  - proves: F117-FR-037
  - covers: F117-FR-037
- [x] T067 [P] [US3] Characterization test CT-117-38 in tests/characterization/117/CT-117-38.test.ts: the vocabulary test over every critic-class input of a run with parallel units on finds no word of the list, apart from the word `snapshot` in the exempt as-is literals of F117-FR-038
  - proves: F117-FR-038
  - covers: F117-FR-038

### Implementation for User Story 3

- [x] T068 [US3] Implement the slot, the reduction and the escaping of the fact block in packages/core/src/critic-input/prompt/fact-slot.ts, with validation against `specstride.fact-block/1` and the closed sets of annex X §X.6 rows 65 and 66
  - covers: F117-FR-033; F117-FR-034; F117-FR-037
- [x] T069 [P] [US3] Implement data boundaries and marker removal in packages/core/src/critic-input/prompt/frame.ts: a token of 64 bits per call, escaping of the pattern, the data sentence, removal of marker lines with a record
  - covers: F117-FR-035; F117-FR-036
- [x] T070 [P] [US3] Implement the exclusion guard in packages/core/src/critic-input/prompt/exclude.ts: the type of the assembler's input holds no excluded field, and a run-time scan refuses a block that holds a word of the list in text of the runtime; the exemption is `exemptWord` in the literals of `exemptIn` of `excluded-vocabulary.json`, nothing else
  - covers: F117-FR-027; F117-FR-038

**Checkpoint**: the default configuration frames outside text and keeps history away

---

## Phase 6: User Story 4 - A critic with read-only tools sees the project and not the proposer's files (Priority: P2)

**Goal**: hiding and return, the precondition, the list of withheld paths

**Independent Test**: the three files are absent during the call and byte-identical after it, for every way the call ends

### Tests for User Story 4

- [x] T071 [P] [US4] Add the sample stub critic of the second form in packages/testkit/src/samples/EP-02/critic-form-two/: it lists and reads the working tree, tries to read each withheld path, and reports what it could read
  - covers: F117-FR-039; F117-FR-042
- [x] T072 [P] [US4] Characterization test CT-117-39 in tests/characterization/117/CT-117-39.test.ts: the prompt of the second form equals the prompt of the first form plus the two sentences; the record of the call states the residual risk
  - proves: F117-FR-039
  - covers: F117-FR-039
- [x] T073 [P] [US4] Characterization test CT-117-40 in tests/characterization/117/CT-117-40.test.ts: notebook, handoff and outbox exist before the call, are absent during it and are byte-identical after it (bytes, mode, modification time) for a reply, a failure, a time limit, a kill and a stop; an engine killed during the call returns them at its next start; the record is written before the first move; a file absent before is absent after; a file found at the place is set aside and the kind `tree-changed-outside-pass` is raised
  - proves: F117-FR-040
  - covers: F117-FR-040
- [x] T074 [P] [US4] Characterization test CT-117-41 in tests/characterization/117/CT-117-41.test.ts: no call of the second form starts while a pass is alive or a detached job of the pass writes into the working tree; a worker root that is not empty is swept once; after one sweep a tool-less critic is called with the kind `tree-changed-outside-pass`; the call is not delayed further
  - proves: F117-FR-041
  - covers: F117-FR-041
- [x] T075 [P] [US4] Characterization test CT-117-42 in tests/characterization/117/CT-117-42.test.ts: the record holds the five denied locations as real paths, the three moved files and the confirmation; without the confirmation the form is not used
  - proves: F117-FR-042
  - covers: F117-FR-042

### Implementation for User Story 4

- [x] T076 [US4] Implement hiding, return and recovery in packages/core/src/critic-input/hide/hide.ts through the file-moving port of T009 (no import of `node:fs`), with the record `specstride.hidden-files/1` of `contracts/schemas/hidden-files.schema.json`, written under `attempt:<N>:<k>:<n>:hidden-files` with the atomic write of the kernel before the first move; depends on T093
  - covers: F117-FR-040
- [x] T077 [P] [US4] Implement the precondition in packages/core/src/critic-input/hide/precondition.ts: no live pass, no writing job of the pass (liveness through the process primitive of the kernel); the test whether the worker root is empty through the file-moving port, and one sweep through the operation `sweep` of the tree-store service (feature 100 annex D §D.2, F100-FR-121), handed in by the composition root; this module removes no tree itself
  - covers: F117-FR-041
- [x] T078 [P] [US4] Implement the record of the withheld paths in packages/core/src/critic-input/hide/withheld.ts against `specstride.withheld-paths/1`, written under `attempt:<N>:<k>:<n>:withheld-paths` with the atomic write of the kernel, and take the confirmation of the harness adapter (the capture is a task of feature 131)
  - covers: F117-FR-042
- [x] T079 [US4] Add the two sentences of the second form to the assembler in packages/core/src/critic-input/prompt/assemble.ts and state the residual risk in the record of the call
  - covers: F117-FR-039

**Checkpoint**: the second form can be used with a harness adapter that confirms the denial

---

## Phase 7: User Story 5 - A criterion confirmed earlier is not judged again for thin proof (Priority: P3)

**Goal**: verdict pins, equal to the baseline's

**Independent Test**: FX-02 with unchanged backing files shows the pin block in the second phase attempt

### Tests for User Story 5

- [x] T080 [P] [US5] Parity test PT-117-C-066-pins-lifecycle in tests/parity/117/PT-117-C-066-pins-lifecycle.test.ts: load before the call, the warning on failure, removal on APPROVED, update on REJECTED only, never on MALFORMED
  - proves: B-1008; B-1009; B-1015; B-1016
  - fixture: FX-02, FX-25, FX-05
  - surfaces: transcript, state, stderr
  - covers: F117-FR-030
- [x] T081 [P] [US5] Parity test PT-117-C-068-pins in tests/parity/117/PT-117-C-068-pins.test.ts: criterion ids, the unmet set, literal paths, the backing hash, validity, the confirmed set, the pin block
  - proves: B-1020; B-1021; B-1022; B-1023; B-1024; B-1025; B-1026
  - fixture: FX-02, FX-25
  - surfaces: transcript, state
  - covers: F117-FR-031
- [x] T082 [P] [US5] Parity test PT-117-C-067-pin-record in tests/parity/117/PT-117-C-067-pin-record.test.ts: the record under `phase:<N>:verdict-pins`, its content and its atomic write
  - proves: B-1018; B-1019
  - fixture: FX-02
  - surfaces: state
  - covers: F117-FR-032

### Implementation for User Story 5

- [x] T083 [P] [US5] Implement criterion ids and the backing hash in packages/core/src/critic-input/pins/ids.ts and packages/core/src/critic-input/pins/hash.ts, with the canonical hasher
  - covers: F117-FR-031
- [x] T084 [P] [US5] Implement the pin record in packages/core/src/critic-input/pins/store.ts with the atomic write of the kernel; an error of the write is swallowed
  - covers: F117-FR-032
- [x] T085 [US5] Implement load, update, removal and the pin block in packages/core/src/critic-input/pins/block.ts and join the block to the grounding block of the assembler
  - covers: F117-FR-030; F117-FR-031

---

## Phase 8: Polish & Cross-Cutting Concerns

- [x] T086 [P] Check the eight closed sets of `contracts/closed-sets.json` against rows 115 to 122 of annex X §X.6 in the `contracts` package, members and unknown-value rules; the annex stands where they differ
  - covers: F117-FR-018; F117-FR-024; F117-FR-029
- [x] T087 [P] Assert in packages/core/test/critic-input/logical-names.test.ts that packages/core/src/critic-input/ names state only by the logical names of annex B §B.5 (`attempt:<N>:<k>:<n>:withheld-paths`, `attempt:<N>:<k>:<n>:hidden-files`, `gate:<N>:proofs`, `attempt:<N>:<k>:<n>:critic-prompt`, `phase:<N>:verdict-pins`) and holds no physical path
  - covers: F117-FR-005; F117-FR-040; F117-FR-042
- [x] T088 Check that `contracts/parity-rows.json` equals rows 52 to 58 of `parity-profile.json` of feature 100 in key, default and value under `parity`, and that the register rows DV-099 and DV-100 it names exist; a build check in packages/core/test/critic-input/parity-rows.test.ts
  - covers: F117-FR-024; F117-FR-029; F117-FR-035
- [x] T089 [P] Measure the performance goals of `plan.md` in packages/core/test/critic-input/perf.test.ts and report them; they are starting values and block nothing
  - covers: F117-FR-011; F117-FR-023
- [x] T090 Run the tests of the feature on the macOS runner when it exists; until then every macOS statement stays `unverified`; a test whose prerequisite is missing (the reference tree, the oracle, a macOS runner, symbolic links) reports a skip with its reason
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F117-FR-007; F117-FR-018; F117-FR-040
- [x] T091 Run the scenarios of specs/117-critic-grounding-and-prompt/quickstart.md and `python3 docs/ecosystem/check-traceability.py --require-all`
  - covers: F117-FR-009

### Added after the cross-feature review (2026-09-30)

Ids are appended; no id above was renumbered. In the order of construction T092 to T095 belong to
phase 2, after T009 and in the order T092, T094, T093, T095: the snapshot of phase 3 reads through
the file-reading port, and T076 needs the file-moving port. T096 and T097 belong to phase 4 (T096
before T060).

- [x] T092 [P] Characterization test CT-117-40 (port part) in tests/characterization/117/CT-117-40-port.test.ts: the conformance cases of the file-moving port, run against the implementation in memory and against the implementation on the file system: a move keeps bytes, mode and modification time, also across file systems; a failed move leaves the file at its old place; a file set aside is kept in the control plane
  - proves: F117-FR-040
  - covers: F117-FR-040
- [x] T093 Implement the file-reading port and the file-moving port on the file system in packages/runtime/src/ports/critic-input-files.ts and hand them to the modules of packages/core/src/critic-input/ at the composition root (`assumption: CQ-185`; the place is reported to the orchestrator, see `plan.md`, Structure Decision)
  - covers: F117-FR-005; F117-FR-007; F117-FR-018; F117-FR-040; F117-FR-041
- [x] T094 [P] Implement the two file ports in memory in packages/testkit/src/samples/EP-02/critic-input-files-memory.ts, for the unit tests of the core
  - covers: F117-FR-040
- [x] T095 [P] Add packages/core/src/critic-input/ to the import-boundary check of feature 100 (F100-FR-012) and assert in packages/core/test/critic-input/imports.test.ts that no file of it imports `node:fs`, `node:fs/promises`, `node:child_process` or a network module
  - covers: F117-FR-017; F117-FR-040
- [x] T096 [P] [US2] Characterization test CT-117-44 in tests/characterization/117/CT-117-44.test.ts: a secret planted in a cited path, in a gap token, in the detail of a critic reply and in phase evidence is redacted in the grounding events, in the lines on standard error, in the transparency section of the feedback, in the kept prompt and in the record of a refusal; the redactor is called at the one ingress and at no second place; with a redactor that cannot run the text is dropped, the record says so and the call does not fail
  - proves: F117-FR-044
  - covers: F117-FR-044
- [x] T097 [US2] Take every outside text that packages/core/src/critic-input/events.ts, packages/core/src/critic-input/prompt/debug.ts and packages/core/src/critic-input/grounding/gap.ts write to a sink from the one ingress of F100-FR-009, handed in by the composition root; remove every direct call of the redactor
  - covers: F117-FR-043; F117-FR-044

---

## Dependencies & Execution Order

| Phase | Depends on | Note |
|---|---|---|
| 1 Setup | — | T001 is first |
| 2 Foundational | 1 | Blocks every story |
| 3 US1 | 2 | MVP |
| 4 US2 | 3 | The assembler takes the snapshot |
| 5 US3 | 4 | The block set `current` extends the assembler; the fact block comes from its content owner through feature 100 annex D §D.7 |
| 6 US4 | 4 | Independent of US3 |
| 7 US5 | 4 | Independent of US3 and US4 |
| 8 Polish | All | — |

Outside the feature: the oracle of feature 141 for the parity tests; the contracts package of
feature 100; the canonical hasher, the redactor behind the one ingress, the atomic write and the
process primitive of the kernel; the two file ports, handed in by the composition root.

### Parallel Opportunities

- All test tasks of one story are marked [P]: one file each.
- In US1 the extractor, the path list, excerpts, the gap and the probes are separate files.
- US3, US4 and US5 can be worked at the same time once US2 is done.

## Parallel Example: User Story 1

```text
Task: "Parity test PT-117-C-066-citation-extraction in tests/parity/117/"
Task: "Parity test PT-117-C-066-wildcard in tests/parity/117/"
Task: "Implement the citation extractor in packages/core/src/critic-input/grounding/extract.ts"
Task: "Implement excerpts and budgets in packages/core/src/critic-input/grounding/excerpt.ts"
```

## Implementation Strategy

| Step | Content | Proof |
|---|---|---|
| MVP | Phases 1 to 3 | FX-25 `equal` on the snapshot; F117-SC-001, F117-SC-005 |
| Parity complete | Phases 4 and 7 | FX-25, FX-02, FX-05 and FX-08 `equal`; F117-SC-004 |
| Default configuration | Phase 5 | F117-SC-002; the first two measures of F117-SC-003 |
| Second form of the critic | Phase 6 | F117-SC-006; the third measure of F117-SC-003, with the capture of feature 131 |
| Coverage | Phase 8 (T091) | F117-SC-007 |

