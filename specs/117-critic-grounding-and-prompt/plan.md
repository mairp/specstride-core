# Implementation Plan: Critic grounding and prompt (feature 117)

**Branch**: `117-critic-grounding-and-prompt` (a label; the directory is `specs/117-critic-grounding-and-prompt`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/117-critic-grounding-and-prompt/spec.md`

## Summary

Feature 117 builds what a critic-class call is given. It is a set of modules of the package
`@specstride/core` with no process, no network and no model call of their own.

| Deliverable | What it is | Requirements |
|---|---|---|
| Citation extractor | Candidates, filters, locators, brace shorthand, the extraction cap | F117-FR-003, F117-FR-004 |
| Resolver | Search directories, package-workspace members, build exports, placeholders, the escape rule, absolute citations | F117-FR-005, F117-FR-006 |
| Refusal guard | Real-path test against the seven refused roots | F117-FR-018 |
| Snapshot builder | Presence lines, the cap, wildcards, excerpts and budgets, directory expansion, carried paths, the gap list | F117-FR-007 to F117-FR-014, F117-FR-020 |
| Probes | The ignore probe through the process port, the secret scan | F117-FR-017 |
| Fingerprint bracket | Fingerprints before and after the grounding pass | F117-FR-019 |
| Prompt assembler | Block set, as-is text, order, the diagnostician's history, the two block sets | F117-FR-021, F117-FR-022, F117-FR-026, F117-FR-029 |
| Window fitter | Budget, order of shrinking, markers, the over-window switch, the known-window rule | F117-FR-023, F117-FR-024, F117-FR-025 |
| Verdict pins | Criterion ids, backing hash, load, update, removal, the record | F117-FR-030, F117-FR-031, F117-FR-032 |
| Fact-block slot | Placement, reduction, escaping, refusal of an unknown field, kinds and fixed sentences | F117-FR-033, F117-FR-034, F117-FR-037 |
| Data framing | Boundaries with a token of the call, escaping of the pattern, marker removal, the one ingress as the point of redaction, the vocabulary rule | F117-FR-035, F117-FR-036, F117-FR-038, F117-FR-043, F117-FR-044 |
| Exclusion guard | A static and a run-time test that no excluded field reaches a critic-class input | F117-FR-027 |
| Hiding and withheld paths | The move out and back, recovery at engine start, the precondition of the call, the two records. The core holds the order of the steps and the records; every call of the file system is behind the file-moving port | F117-FR-039 to F117-FR-042 |
| Events and debug | `prompt.built`, the grounding events, the feedback section, the debug switch | F117-FR-015, F117-FR-016, F117-FR-028 |
| Switches | Seven config keys, rows 52 to 58 of annex X §X.7, confirmed in the key list of feature 110 | F117-FR-001, F117-FR-002, F117-FR-024, F117-FR-029 |
| Lisa characterization | The extracted grounding source brought to the baseline, then `CT-117-1` | F117-FR-009 |

Approach: the as-is text of every line and heading is data (`contracts/as-is-literals.json`), so
that parity is a comparison of data and not of code. The snapshot builder and the assembler are
pure functions over inputs that a file-reading port, a file-moving port and the process port
supply; this keeps them inside the import rule of the core, which forbids `node:fs` and
`node:fs/promises` (F100-FR-012; `assumption: CQ-185`).

## Technical Context

**Language/Version**: TypeScript 5.x, `strict`, ECMAScript modules, on Node.js 22 or later

**Primary Dependencies**: `@specstride/contracts` (logical names, schemas `specstride.fact-block/1`, `specstride.withheld-paths/1`, `specstride.prompt-block/1`, closed sets, the `parity` profile); `@specstride/kernel` (atomic write, the canonical hasher of feature 104, the redactor of feature 111 behind the one ingress of F100-FR-009, the process primitive of feature 122). No dependency from npm of its own. Source extracted from Lisa's grounding (ruling 12) is brought to the baseline first (F117-FR-009)

**Storage**: files, named by logical name (feature 100, annex B §B.5): `attempt:<N>:<k>:<n>:critic-prompt`, `phase:<N>:verdict-pins`, `attempt:<N>:<k>:<n>:withheld-paths`, `attempt:<N>:<k>:<n>:hidden-files` (record `specstride.hidden-files/1`, annex B §B.20) and, read only, `gate:<N>:proofs`. All are rows of annex B §B.5. Records are written with the atomic write of the kernel; files are read and moved through the ports

**Testing**: the test runner that Node ships (`node:test`); parity tests on the fixture families FX-25, FX-02, FX-05 and FX-08 of the oracle; characterization tests with temporary trees, symbolic links and a stub critic of the second form. No test calls a model

**Target Platform**: Linux and macOS. Every macOS statement is `unverified` (ruling 67): the local-time form of the modification time, real-path resolution through links, and the move of files across file systems

**Project Type**: modules of the package `@specstride/core` in the npm workspace (owner list of `package-graph.json`: 101, 149, 103, 117, 118, 102)

**Performance Goals**: starting values with low confidence. A snapshot of 80 presence lines with the full byte budget: under 2 s on a local disk. Assembly and fitting of one prompt: under 200 ms. Hiding and return of the three files: under 100 ms each way

**Constraints**: the import rule of the core (no `node:child_process`, no network module, no provider SDK, no `node:fs` and no `node:fs/promises`; `assumption: CQ-185`): files are read through the file-reading port and moved through the file-moving port, both handed in by the composition root; the ignore probe runs through the process primitive of the kernel, handed in by the composition root. No command of the project is ever executed. No paid call in tests. No path, account or name of the owner's machines

**Scale/Scope**: 44 functional requirements, 7 success criteria; 102 behaviour items in 8 clusters and 1 as-is requirement carried; 4 fixture families cited; 7 rows of the `parity` profile owned (52 to 58); 8 closed sets owned (rows 115 to 122 of annex X §X.6); 1 schema file (`specstride.hidden-files/1`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v3.0.1. Checked against v3.0.0 before research and again after the design; the answers are the same.

*Constitution v3.0.1 (2026-09-30) differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182). The row of Principle IX below was read again against that sentence at the analyze run of 2026-09-30, and the answer is the same: the sentence is about the proof of the tool-less form, which belongs to feature 109 and the harness adapters (`spec.md`, "Out of scope"). This feature builds what the call is given and proves no form.*

**The gate and the loop (I–V)**

- [x] I. ✅ The snapshot is built after the pass has exited, from files. The pin record and the record of the withheld paths are written by a temporary name and a rename (F117-FR-032, F117-FR-042). Nothing here watches or serves
- [x] II. ✅ The feature produces no verdict. It hands the nonce into the prompt and writes it nowhere before the call has returned: the kept prompt and the debug line with the nonce come after the call (F117-FR-016, F117-FR-017), and no event holds it (F117-FR-043). No repair history reaches a critic-class input (F117-FR-027). Pins never approve: they are a block of the prompt
- [x] III. ✅ This feature is the grounding half of the principle: snapshot before judgment, globs expanded, fixed-argument probes, no shell (F117-FR-010, F117-FR-017); outside text is data (F117-FR-035); the critic with read-only tools still gets the snapshot (F117-FR-039)
- [x] IV. ✅ The phase section, the criterion ids of the section and the design context come from the canonical spec model (EP-03). The pattern of a criterion id in a critic reply (F117-FR-031) reads a reply, not a spec
- [x] V. ✅ A failed event, a failed pin write and a failed debug write never fail the call (F117-FR-030, F117-FR-032)

**The product and its edges (VI–XII)**

- [x] VI. ✅ Strict TypeScript; the fact block, the withheld-paths record and the hidden-files record are validated against their schemas; modules of the core with no provider, host or UI dependency and no import of the file-system module; no native module; extension points consumed: EP-02, EP-03, EP-04, EP-15, EP-18, with versions in `spec.md`
- [x] VII. ✅ No requirement names a harness. The window comes from the capability of the harness port for whatever harness the registry resolved (F117-FR-025)
- [x] VIII. N/A The feature starts no proposer pass. It moves the proposer's files and returns them unchanged (F117-FR-040), which keeps the workspace as the pass left it
- [x] IX. ✅ Known context window or no call (F117-FR-025); the budget comes from the window in force; the exception for read-only tools is specified with hiding, withheld paths and the confirmation (F117-FR-039 to F117-FR-042)
- [x] X. N/A Version pins belong to the harness adapters
- [x] XI. ✅ The two as-is grounding events are rendered by the compatibility projection (F117-FR-015); events hold no content (F117-FR-028, F117-FR-043); outside text reaches a sink only through the one ingress (F117-FR-044)
- [x] XII. ✅ Tests use stubs and temporary trees; the secret scan names a variable and never a value (F117-FR-017); no model id in a rule

**The host skill (XIII–XVII)**

- [x] XIII. ✅ The snapshot and the fact block are facts written by deterministic code; judgment is the critic's
- [x] XIV. ✅ The feature declares and runs verification commands: the nine commands of quickstart.md (eight scenarios; scenario 8 carries two) — the unit tests, the parity run of feature 117, the CT-117 characterization set, and `python3 docs/ecosystem/check-traceability.py --require-all` — as ordered by T091
- [x] XV. N/A No launch and no consent
- [x] XVI. N/A No supervision
- [x] XVII. ✅ A test that needs a file system with symbolic links, or a macOS host, is a skip with its reason where the prerequisite is missing
- [x] XX. N/A The feature runs nothing in parallel. It keeps the critic free of any word about groups or workers (F117-FR-038) and refuses the worker root and the tree store (F117-FR-018)

**The rewrite (XVIII–XIX)**

- [x] XVIII. ✅ Every carried behaviour has origin, disposition and test (F117-SC-007); every intended difference cites a row of the divergence register: the rows in the `divergence:` fields of `spec.md` (DV-006, DV-007, DV-019, DV-027, DV-032, DV-066, DV-076, DV-081, DV-086, DV-089, DV-095, DV-099, DV-100), all of which exist in `consolidation.md` section 6. Micro-loops and continuation are off under the oracle (rows 1 and 10 of annex X §X.7)
- [x] XIX. ✅ The feature prints nothing to a host by default. The as-is lines on standard error appear in compatibility output and under the debug switch only

**Gate**: passed, before research and after the design. Every check passes. Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/117-critic-grounding-and-prompt/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── README.md
│   ├── as-is-literals.json        # headings, lines and markers compared byte for byte
│   ├── budgets.json               # the numeric constants of the as-is budgets
│   ├── closed-sets.json           # the eight closed sets of spec.md
│   ├── parity-rows.json           # rows 52 to 58 of the profile
│   ├── schemas/
│   │   └── hidden-files.schema.json   # specstride.hidden-files/1 (annex B §B.20)
│   ├── critic-block-set.json      # blocks, order, protection, shrink order
│   └── excluded-vocabulary.json   # the excluded fields and the word list
├── checklists/requirements.md
├── tasks.md
└── analyze-report.md
```

### Source Code (repository root)

```text
packages/core/
├── src/critic-input/
│   ├── grounding/
│   │   ├── extract.ts             # citation candidates and filters
│   │   ├── path-list.ts           # order of sources, priority, carried paths
│   │   ├── resolve.ts             # search directories, members, exports, placeholders
│   │   ├── refuse.ts              # real-path test against the refused roots
│   │   ├── snapshot.ts            # presence lines, cap, wildcard, directory expansion
│   │   ├── excerpt.ts             # whole, anchored, head-tail, budgets
│   │   ├── gap.ts                 # the grounding gap
│   │   ├── probes.ts              # ignore probe (through the process port), secret scan
│   │   ├── bracket.ts             # fingerprints before and after
│   │   └── LISA-ALIGNMENT.md      # differences of Lisa's grounding from the baseline (T001)
│   ├── prompt/
│   │   ├── assemble.ts            # block set, order, as-is text
│   │   ├── fit.ts                 # window fitting and the over-window switch
│   │   ├── history.ts             # rejection history of the diagnostician
│   │   ├── fact-slot.ts           # slot, reduction, escaping, kinds
│   │   ├── frame.ts               # data boundaries, marker removal
│   │   ├── exclude.ts             # the exclusion guard and the vocabulary test
│   │   └── debug.ts               # the kept prompt and the debug lines, after the call has returned
│   ├── pins/
│   │   ├── ids.ts  hash.ts  store.ts  block.ts
│   ├── hide/
│   │   ├── hide.ts                # the order of the steps: record, move out, move back, recovery; through the file-moving port
│   │   ├── precondition.ts        # no live pass; one sweep of the worker root
│   │   └── withheld.ts            # the record specstride.withheld-paths/1
│   ├── ports.ts                   # types of the file-reading port and of the file-moving port; no import of node:fs
│   ├── switches.ts                # the seven switches, rows 52 to 58 of the profile
│   ├── events.ts                  # prompt.built and the grounding events
│   └── data/                      # copies of the files of contracts/
└── test/critic-input/             # unit tests
packages/runtime/src/ports/critic-input-files.ts   # the two file ports on node:fs, in the composition root (owner 122; see Structure Decision)
packages/testkit/src/samples/EP-02/critic-form-two/   # a stub critic of the second form
packages/testkit/src/samples/EP-02/critic-input-files-memory.ts   # the two file ports in memory, for unit tests of the core
tests/
├── parity/117/                    # PT-117-*
└── characterization/117/          # CT-117-*
```

**Structure Decision**: modules of `@specstride/core`, as `package-graph.json` of feature 100
assigns. The core may not start a process, so the ignore probe receives the process
primitive of the kernel from the composition root. The sweep of the worker root (F117-FR-041) is
the operation `sweep` of the tree-store service of feature 100 annex D §D.2 (F100-FR-121, content
owner 143), handed in by the composition root; this feature removes no tree itself. The core may not import `node:fs` or
`node:fs/promises` (F100-FR-012, F100-FR-234; `assumption: CQ-185`), so no module of
`packages/core/src/critic-input/` touches the file system:

| Need | Port | Operations | Used by |
|---|---|---|---|
| Read what grounding and the pins read | File-reading port | stat without following a link, read with a byte limit, real path, list a directory, match a pattern below a root | `grounding/`, `pins/hash.ts` |
| Hide and return the proposer's files | File-moving port | move a file with its bytes, mode and modification time (across file systems as copy, verify, remove); set a file aside; test for existence; list the worker root | `hide/hide.ts`, `hide/precondition.ts` |
| Write a record or a kept prompt | The atomic write of the kernel | temporary name and rename | `pins/store.ts`, `hide/withheld.ts`, `hide/hide.ts`, `prompt/debug.ts` |

The types of the two ports are declared in `ports.ts` of the core, without an import. The
implementation on `node:fs` is handed in by the composition root. This plan places it in
`packages/runtime/src/ports/critic-input-files.ts`, because `package-graph.json` names no edge
package for it and this feature invents none; F100-FR-234 names three edge interfaces in Wave 1
(116, 143, 148) and none for grounding or hiding. The place is reported to the orchestrator: if
feature 100 moves the interface into the `contracts` package or names an edge package, the path
changes and nothing else does.

## Physical paths behind the logical names

| Logical name | Path below its root |
|---|---|
| `attempt:<N>:<k>:<n>:critic-prompt` | As `layout.json` of feature 100 gives it |
| `phase:<N>:verdict-pins` | As `layout.json` of feature 100 gives it |
| `attempt:<N>:<k>:<n>:withheld-paths` | As `layout.json` of feature 100 gives it |
| `attempt:<N>:<k>:<n>:hidden-files` | As `layout.json` of feature 100 gives it: the kept files and the record `specstride.hidden-files/1` |
| `gate:<N>:proofs` | As `layout.json` of feature 100 gives it |

## Order of construction

1. The Lisa extraction and its alignment (first task; F117-FR-009).
2. Data files and literals; the two file ports and their two implementations (the snapshot of step 3 reads through the file-reading port); extractor, resolver, refusal guard.
3. Snapshot, excerpts, probes; parity on FX-25.
4. Assembler with the block set `as-is`, fitter, pins; parity on FX-25, FX-02, FX-05.
5. Block set `current`: fact-block slot, framing, marker removal, exclusion guard.
6. Hiding, precondition, withheld paths, with the stub critic of the second form, through the file-moving port of step 2.

## Complexity Tracking

Empty. No gate is violated. The register rows DV-099 and DV-100 exist
(`docs/ecosystem/consolidation.md` section 6), so the note of 2026-09-29 under Principle XVIII no
longer holds and was removed.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
