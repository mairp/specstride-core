# Implementation Plan: Verification (feature 105)

**Branch**: `105-verification` (a label; the directory is `specs/105-verification`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/105-verification/spec.md`

## Summary

Feature 105 finds the verification commands a project declares, freezes them at launch as a
verification plan and one check manifest per phase, and runs them: as the verification gate
before the critic, as release verification, and as commands staged before a phase attempt. It
owns the content of one extension point, the verification-plan source (EP-07), and the public
command `verify`. It runs every command through the check runner of feature 100, annex C §C.8,
whose content left this feature on 2026-09-29 (`spec.md`, "Requirements moved to 148-check-runner").

| Deliverable | What it is | Requirements |
|---|---|---|
| Modes and settings | The three modes, the four settings, their errors | F105-FR-001 to F105-FR-004 |
| Verification gate and release verification | Order, rejection without a critic call, feedback, events, log lines, result records; the verification mode in the run snapshot, read by the loop layer | F105-FR-005 to F105-FR-010, F105-FR-032 |
| Planner | Plan record, hashes, validation, verification obligations, suites and gates | F105-FR-011 to F105-FR-014, F105-FR-018, F105-FR-019 |
| Plan sources | The interface and three sources; the conformance suite and the sample of EP-07 | F105-FR-015 to F105-FR-017, F105-FR-053 |
| Check manifest | Derivation, comparison on a relaunch | F105-FR-020, F105-FR-021 |
| Outputs for people and prompts | Plan for people, safe writes, scaffolds, phase context | F105-FR-022 to F105-FR-025 |
| Staged commands | Reuse rules, the step before a phase attempt, detached commands, build artifacts | F105-FR-033 to F105-FR-036 |
| Failure summary | The text for the feedback | F105-FR-037 |
| Command `verify` | Seven sub-commands, exit codes 0, 3, 10, 11 | F105-FR-039 |
| Staleness | The check at critic start under the `parity` profile only | F105-FR-042, F105-FR-043 |
| Narrowing | Verification in project configuration | F105-FR-045 |
| Ingress | Output of a command enters through the one ingress before it is written | F105-FR-054 |

Approach: the planner is written new on the canonical spec model; the hash, the renderer and
discovery of Lisa's verification package are extracted as source where they fit and
brought to the behaviour of the Specstride baseline first (`research.md` D-1).

## Technical Context

**Language/Version**: TypeScript 5.x, `strict`, ECMAScript modules, on Node.js 22 or later

**Primary Dependencies**: `@specstride/contracts` (schema of the check manifest, closed sets, exit codes, the `parity` profile, logical names, the interface types of EP-05 (as a caller), EP-07, EP-16); `@specstride/kernel` (atomic write; the canonical hasher of feature 104 in `@specstride/kernel`, of which the plan, its ids and the projection use the content hash of a text over the text form of the baseline, and the manifest the canonical record hash (F105-FR-011, F105-FR-020); the process primitive of F100-FR-234, used for the detached commands staged before and for nothing else). Node built-ins: `node:fs`, `node:path`, `node:crypto`. This package does not import `node:child_process`: every other command starts through the check runner (EP-05). No dependency from npm of its own: records are validated by the schema validator that feature 100 chose (Ajv, `specs/100-specstride/research.md` D-2), and the verification-commands document, where it is YAML, is read by the YAML parser that feature 100 records for feature 110 (the package `yaml`, research D-8 of feature 100, `unverified` until pinned)

**Storage**: files in the control plane, by logical name (feature 100, annex B §B.5): `run:<runId>:verification:plan`, `run:<runId>:verification:release`, `phase:<N>:manifest`, `attempt:<N>:<k>:<n>:verification`, `attempt:<N>:<k>:<n>:prestage`. Two outputs in the working tree: `feature:<slug>:verification:test-plan` and `feature:<slug>:verification:scaffolds`

**Testing**: the test runner that Node ships (`node:test`); scripted commands as fake binaries; the parity oracle of feature 141 (FX-14, FX-15, FX-16, and FX-03, FX-11, FX-20, FX-22 for single items); the conformance frames of `@specstride/testkit`. No test calls a model or a paid service

**Target Platform**: Linux and macOS. Process sessions on macOS are `unverified` until a macOS runner has passed the oracle (ruling 67)

**Project Type**: one package of the npm workspace, `@specstride/verification`, layer L1, owner 105 (`package-graph.json` of feature 100); plus the sub-command module of `verify` that the CLI package mounts, and the tests

**Performance Goals**: starting values with low confidence, measured in the build. Derivation of a plan with 50 phases and 100 commands: under 2 s. Rendering of the failure summary of a result record of 1 MB: under 200 ms

**Constraints**: every command runs through the check runner, apart from a detached command staged before, which the process primitive of the kernel starts (F105-FR-035); this package starts no process by itself; no native module; no write outside the control plane and the two declared outputs; MIT-compatible dependencies only; no path, account or name of the owner's machines

**Scale/Scope**: 37 functional requirements, 7 success criteria; 159 behaviour items in 26 clusters and 2 kept as-is requirements carried; 1 as-is requirement not carried (002 FR-009); 7 fixture families cited; 1 conformance suite and 1 sample; 6 rows of the `parity` profile read (1, 15, 33, and 6, 7, 31 for the rule on when a manifest is written) and 3 owned (123, 124, 126, with 6 keys); 8 closed sets of annex X §X.6 owned (rows 52, 228 to 232, 234, and the member `DEADLINE` of row 233)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v3.0.1. Written against v3.0.0 on 2026-09-29 and read again against v3.0.1 on 2026-09-30 (second analyze run). v3.0.1 differs by one sentence of Principle IX, the weaker proof (CQ-182); Principle IX is N/A for this feature. Rows I, II, IV, XI and XVIII carry the reasons that the second analyze run added; no answer changes.

**The gate and the loop (I–V)**

- [x] I. ✅ The plan, the manifests and every result are files, written by a temporary name and a rename (F105-FR-023, F105-FR-009). The verification gate is handed phase evidence only after the pass has exited (F105-FR-005). No watcher and no service. A detached command staged before leaves the process tree of the run, as at the baseline; it is entered in the process registry as `adoptable`, the class that feature 100 gives such a process (annex B §B.10), and no run depends on it: past its deadline it is reported, and the verification gate executes the command itself (F105-FR-033, F105-FR-035)
- [x] II. ✅ No check produces a verdict. A failed verification gate is a rejection made by the engine, never an approval; a passed one only lets the critic be called (F105-FR-005). No result of an inner check stands in for an execution at the gate, and with a loop layer engaged the verification gate takes over no staged result either, so the full verification gate runs again before the critic (F105-FR-033; F100-FR-232)
- [x] III. ✅ Commands are deterministic and fixed at launch (F105-FR-020), and run by the runtime through the check runner (feature 100, annex C §C.8). A condition on a result is carried to the critic and is never stated as a pass (F105-FR-032). Project configuration narrows only (F105-FR-045). Repository text declares no reads and writes of a command (F105-FR-016, `assumption: CQ-190`)
- [x] IV. ✅ The planner reads the canonical spec model through EP-03 and parses no spec itself (F105-FR-015). The projection `tasks-v2` of the spec is a record built from the canonical spec model and hashed by the canonical hasher (content hash of a text); the package reads no spec text and holds no grammar (F105-FR-012)
- [x] V. ✅ Events of a check are best-effort; a failed emission never changes a result. The failure summary degrades to a fixed sentence (F105-FR-006)

**The product and its edges (VI–XII)**

- [x] VI. ✅ Strict TypeScript; every record is validated against a schema at the file boundary; the package imports `contracts` and `kernel` only; plain `npm install`; no native module; the Language Ledger stays empty. Extension points: implements EP-07 `specstride.verification-source/1`; consumes EP-05, EP-03, EP-04, EP-08, EP-15, EP-16, EP-18 (`spec.md`, "Extension points")
- [x] VII. ✅ The feature names no harness and tests no harness name. It reads no containment level
- [x] VIII. N/A for the pass. ✅ for what this feature touches: a detached command staged before has its standard input closed (F105-FR-035), and the configuration of the operator is not written
- [x] IX. N/A. The feature calls no critic. Under the `parity` profile it answers the plan check at critic start with result code 3 (F105-FR-042)
- [x] X. N/A. No harness adapter. An executable is resolved to an absolute path when the plan is derived (F105-FR-016)
- [x] XI. ✅ Events use the one envelope; the as-is verification events come from the compatibility projection (F105-FR-007); no output of a command is in an event, and what is written of it to a record has passed the one ingress, which fails closed (F105-FR-054); the raw log of a detached command stays in the control plane and reaches no sink and no prompt unread by the ingress
- [x] XII. ✅ Tests use scripted commands and stub agents; no paid call; no model id anywhere in the feature

**The host skill (XIII–XVII)**

- [x] XIII. ✅ Plan sources record what is literally declared, with file and line (F105-FR-015)
- [x] XIV. ✅ The principle is the core of this feature: commands come from declarations only, a conflict is a blocker, a phase without commands stays explicitly empty, and no check means `unchecked` (F105-FR-015, F105-FR-020; F105-SC-001)
- [x] XV. ✅ No flag or setting of this feature bypasses a launch check. The mode `required` with an ambiguity refuses (F105-FR-019)
- [x] XVI. ✅ A relaunch uses the stored manifest and reports a difference (F105-FR-021). The feature spends no count of its own; a rejection by the gate counts as the baseline counts it (F105-FR-005)
- [x] XVII. ✅ A manager or interpreter that is missing is an ambiguity and not a pass (F105-FR-017); a test whose prerequisite is missing is a skip with its reason; macOS statements are `unverified`
- [x] XX. N/A. This feature runs nothing in parallel. It puts declared reads and writes into the manifest only from the launch contract, with the provenance user configuration, the environment or a flag; a declaration without it is undeclared, which means serial (F105-FR-020, `assumption: CQ-190`). What is done with them belongs to the check runner

**The rewrite (XVIII–XIX)**

- [x] XVIII. ✅ Every carried behaviour has origin, disposition and test; 159 items and 2 requirements are placed (`spec.md`, "As-is ids carried"). Intended differences cite DV-006, DV-007, DV-012, DV-027, DV-040, DV-043, DV-052, DV-053, DV-066, DV-068, DV-072, DV-078, DV-082, DV-091, DV-095. All options are off or as-is under the `parity` profile. The hashes of the plan keep the text form of the baseline, so that a hash the fixtures compare is never found different in a test (F105-FR-011)
- [x] XIX. ✅ In default output `verify` and the gate print one line per result and name state by logical name. The share of the token budget is the gate summary line: at most 200 bytes per phase attempt; measured in the build

Every check passes. Complexity Tracking is empty.

**Re-check after the cross-feature review (2026-09-30)**: every row still passes. Row VI: the
package no longer imports `node:child_process` (W-105-02). Row I and F100-FR-051: this feature
writes no fact into the run record (W-105-01). Row XX: see the row.

**Re-check after the second analyze run (2026-09-30)**: every row still passes, against v3.0.1. Three
findings touched a non-negotiable principle and are repaired in the specification, not justified
here: the text form of the hashes (XVIII), the reuse of a staged result with a loop layer engaged
(II), and the mode `plan` beside the commands staged before (XVIII, the baseline). Complexity
Tracking stays empty.

**Re-check after Phase 1 design**: unchanged. The design adds no dependency and no process that
outlives a run, apart from detached commands staged before, which the baseline has and which are
entered in the process registry as `adoptable`.

## Project Structure

### Documentation (this feature)

```text
specs/105-verification/
├── spec.md
├── checklists/requirements.md
├── plan.md                  # this file
├── research.md              # Phase 0: decisions, with links to docs/ecosystem/
├── data-model.md            # Phase 1: entities and relations
├── quickstart.md            # Phase 1: how to validate the feature
├── contracts/               # Phase 1
│   ├── README.md
│   ├── closed-sets.json         # the sets of spec.md "Closed sets"
│   ├── parity-rows.json         # rows read and rows owned
│   ├── verify-cli.json          # sub-commands, arguments, exit codes
│   └── as-is-literals.json      # messages, headings and lines that parity binds
├── tasks.md                 # Phase 2 (speckit-tasks)
├── analyze-report.md        # speckit-analyze: the runs of 2026-09-29 and 2026-09-30
└── repair-report.md         # the repairs after the cross-feature review
```

### Source Code (repository root)

```text
packages/verification/               # @specstride/verification (L1, owner 105)
├── data/
│   ├── discovery.json               # toolchains of discovery: files, scripts, time limits
│   └── word-lists.json              # verbs of change; build words
├── src/
│   ├── mode/                        # modes, settings, their errors
│   ├── plan/                        # record, ids, hashes, validation, obligations, suites, gates
│   ├── sources/                     # EP-07 registry; commands-document, literal, discovery
│   ├── manifest/                    # derivation, hash, comparison on a relaunch
│   ├── render/                      # plan for people, phase context, scaffolds, safe writes
│   ├── gate/                        # verification gate, release verification, feedback
│   ├── prestage/                    # staged commands, detached ones, reuse rules
│   ├── summary/                     # the failure summary
│   ├── staleness/                   # the check at critic start (parity profile)
│   └── cli/                         # the sub-commands of verify
└── test/                            # unit tests beside the modules they test
packages/testkit/src/conformance/
└── EP-07/                           # conformance suite of the plan source: the cases of this feature,
                                     # beside the contract-level suite of feature 100
packages/testkit/src/samples/
└── EP-07/                           # the sample plan source
tests/
├── parity/105/                      # PT-105-*
├── characterization/105/            # CT-105-*
└── fixtures/105/                    # scripted commands, manifests, documents
```

**Structure Decision**: one package of the npm workspace, as `package-graph.json` of feature 100
names it. The conformance suite and the sample go into the folders that feature 100 made for
content owners in `@specstride/testkit`. The engine calls the gate through the interface types
of `contracts`; this package imports no engine code.

## Physical paths behind the logical names

Feature 100 owns the table (`contracts/data/layout.json` of feature 100). This feature adds no
name. The two outputs in the working tree keep their as-is default places (F105-FR-002).

## Complexity Tracking

No violation.
