# Implementation Plan: Gate and verdict (feature 101)

**Branch**: `101-gate-and-verdict` (a label; the directory is `specs/101-gate-and-verdict`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/101-gate-and-verdict/spec.md`

## Summary

Feature 101 is the engine's loop over the phases and phase attempts of a run, and the phase gate
inside it: verification gate, then critic, then the signed approval record. It is the content
owner of the approval record and of the terminal record of feature 100. The seams of EP-18, the
model-tier bump and the invariants of the phase gate against loop layers left with the split of
2026-09-29; this feature calls the seams through feature 100 annex E §E.1.

| Deliverable | Requirements |
|---|---|
| Phase loop, start position, order at the phase gate | F101-FR-001 to F101-FR-005 |
| Nonce, verdict grammar, critic call and its outcomes, feedback, verdict record | F101-FR-006 to F101-FR-013 |
| Reject limit, MALFORMED limit, oscillation halt, order after a rejection, end of the run | F101-FR-014 to F101-FR-018 |
| Recovery cycle: signature, diagnostician, hint, accelerator, acceleration note | F101-FR-019 to F101-FR-026 |
| Archive of a phase attempt; atomic writes | F101-FR-027, F101-FR-028 |
| Approval record, approval key, verification, refusal for ticked phases | F101-FR-029 to F101-FR-032 |
| Steps after an approval: order, ticking, approval commit | F101-FR-033 to F101-FR-035 |
| Terminal record, halts, events, lines, lease, blocked paths | F101-FR-036 to F101-FR-041 |
| Text of a critic-class call through the one ingress | F101-FR-052 |

Approach: the loop is written new, as a port of the engine script of the Specstride baseline
(`orchestrator.sh` at `9cab15d`, the functions around lines 900 to 2280) and of the verdict flow of
`lib/critic.py`. From Lisa (`363e6a3`) two pieces are extracted as source: the nonce verdict parser
and the gate store; the store is rewritten for the approval record. Lisa's phase loop is not
taken. The proof is the parity oracle on FX-01 to FX-08, FX-13, FX-15, FX-21, FX-23 and FX-27,
characterization tests CT-101-1 to CT-101-12 for the Lisa side, and own tests CT-101-13 to
CT-101-18 and CT-101-29 to CT-101-33.

Repaired on 2026-09-30 after the cross-feature review; the section "Repairs after the
cross-feature review" of the spec lists what changed.

## Technical Context

**Language/Version**: TypeScript 5.x, `strict`, ES modules, Node.js 22 or later

**Primary Dependencies**: `@specstride/contracts` (schemas, closed sets, exit codes, stop reasons, interface types of the extension points); `@specstride/kernel` (table evaluator, atomic write, redactor and ingress). No other runtime dependency. Node built-ins for secure random bytes, hashing and signing (`node:crypto`). The package is `@specstride/core`, as `specs/100-specstride/contracts/data/package-graph.json` gives it for feature 101; it imports neither `node:fs` nor `node:fs/promises` (F100-FR-012, `assumption: CQ-185`): every file of this feature is read and written through the kernel and through the ports of the edge packages, the hiding of the proposer's files for a diagnostician with read-only tools included. The engine imports interfaces of the ports and never an implementation (LR-1)

**Storage**: files of the control plane, named by logical name (feature 100 annex B §B.5): `gate:<N>:approved`, `feature:<slug>:approval-key`, `attempt:<N>:<k>:<n>:*`, `phase:<N>:recovery-markers`, `phase:<N>:approved-archive`, `run:<runId>:terminal`. Counts live in the ledger of feature 103

**Testing**: the Node test runner; the parity oracle of feature 141 with its stubs; characterization tests of the extracted Lisa code; a property and fuzz test for the verdict parser (CT-101-32, task T108); a static test over the package graph. Parity tests live in `tests/parity/101/`, characterization tests in `tests/characterization/101/`, own tests in `packages/core/test/101/`, as the rule of feature 100 places them. No test calls a paid API

**Target Platform**: Linux and macOS (macOS `unverified` until a runner passes the oracle)

**Project Type**: part of the package `@specstride/core` of the npm workspace (layer L4, the engine). The foreground command `run` is wired in the CLI package by its owner, calling the engine entry this feature provides

**Performance Goals**: starting values, low confidence, to be pinned after the first run of the oracle (T107): the time the phase gate adds beside the verification gate and the critic call is under 200 ms per phase attempt; verification of an approval record under 20 ms

**Constraints**: no native module; no shell; the engine starts no process and opens no connection itself (it goes through ports); no paid call in tests; as-is bytes in compatibility output and in the compatibility projection; no harness name in control flow

**Scale/Scope**: 42 functional requirements (F101-FR-001 to F101-FR-041 and F101-FR-052), 6 success criteria; 27 as-is requirements and success criteria; 157 behaviour items in 17 clusters, all kept; 13 fixture families cited; 3 new closed sets

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Checked against the constitution v3.0.1 (`.specify/memory/constitution.md`).

**The gate and the loop (I-V)**

- [x] I. ✅ Every record of the phase gate is a file written by temporary name and rename (F101-FR-028); the start position is derived from verified records, no counter (F101-FR-002); no watcher and no service
- [x] II. ✅ This feature is the principle: a nonce per call, the verdict from the reply only, MALFORMED as the safe failure (F101-FR-006 to F101-FR-008); a fresh critic session, which the critic strategy of feature 100 annex E §E.1 guarantees; the approval is a signed record in the control plane, verified wherever it is read (F101-FR-029 to F101-FR-031)
- [x] III. ✅ The verification gate runs before the critic and no earlier result stands in for it (F101-FR-005); phase evidence is read as a claim (F101-FR-013); outside text in the prompts of the diagnostician and the accelerator is data outside the `parity` profile (F101-FR-022, F101-FR-025); text of a critic-class call passes the one ingress before it is written (F101-FR-052)
- [x] IV. ✅ No grammar of specifications here: phases, tasks and `tick` come from the canonical spec model (EP-03). The verdict grammar and the task-id form of a signature are grammars of replies and feedback, not of specifications
- [x] V. ✅ Events and lines are emitted through the event writer and the presenter; a failed write of a verdict record or of feedback only warns (F101-FR-012); a failed step of the end of the run does not stop the others (F101-FR-036)

**The product and its edges (VI-XII)**

- [x] VI. ✅ Strict TypeScript; records validated against the schemas of feature 100; the engine imports no harness adapter and no sink adapter; EP-02, EP-03, EP-05, EP-12, EP-13, EP-15 and EP-18 consumed, with versions in the spec
- [x] VII. ✅ The critic, the diagnostician and the accelerator come from the role plan of the resolved registry; no list of harnesses and no test of a harness name
- [x] VIII. ✅ The feature starts passes only through the pass loop; an accelerated phase attempt starts a fresh session, as every phase attempt does; nothing waits for a person: a halt ends the run
- [x] IX. ✅ Every critic-class call, the call of the diagnostician included, runs in one of the two forms of the `completion` level and records the proof of its form (F101-FR-020, F101-FR-029); a failed proof of the critic is a configuration error that halts (F101-FR-010), and a failed proof of the diagnostician makes no call; the form with read-only tools is the exception that the principle states, with the proposer's files moved out (F101-FR-020); a missing credential is named in the message of the halt (F101-FR-010). The context window is the concern of 117 and 124. This feature makes no proof itself: which proofs the harness port admits, the weaker proof included, is a deviation that feature 100 records in its own plan (CQ-182)
- [x] X. N/A. No harness adapter in this feature
- [x] XI. ✅ Events in the one envelope; the compatibility projection renders the as-is events of the phase gate (F101-FR-038); no nonce, prompt or reply in an event
- [x] XII. ✅ Tests use the stubs of the oracle; model ids come from configuration and the ladder of the registry; the approval key is not a secret of a provider and is never exported

**The host skill (XIII-XVII)**

- [x] XIII. ✅ Signature, gist and the rules of the recovery cycle are deterministic code; the engine hands facts to the attempt planner and takes its kind
- [x] XIV. N/A. The feature runs no verification command of its own; it reads the result record
- [x] XV. N/A. No launch and no mode of a host skill
- [x] XVI. ✅ Counts continue across a resume and a relaunch (F101-FR-014 to F101-FR-016); a quota class of a failed critic call spends no count (F101-FR-010); the terminal record says whether a stop is retryable (F101-FR-036)
- [x] XVII. ✅ A test whose prerequisite is missing (the reference tree, the oracle, a macOS runner, a harness with containment C2 or above) reports a skip with its reason and never a pass; task T114 runs the tests on the macOS runner and records the result, and until then every statement about macOS stays `unverified`
- [x] XX. N/A. No parallel work; the verification gate runs at the phase gate on every phase attempt (F101-FR-005)

**The rewrite (XVIII-XIX)**

- [x] XVIII. ✅ Every carried behaviour has origin, disposition and test; differences cite DV-006, DV-007, DV-011, DV-027, DV-028, DV-029, DV-040, DV-044, DV-066, DV-067, DV-072, DV-081, DV-082, DV-094, DV-095, DV-100, DV-117; what is new is off under the `parity` profile. A missing credential of the critic follows the code of the baseline under the profile (F101-FR-010, `assumption: CQ-187`); the behaviour outside the profile is register row DV-117, row 133 of annex X §X.7
- [x] XIX. ✅ The feature prints to the engine log, not to a host. The one host-facing surface is the exit of `run`; under the `parity` profile no new line is printed (F101-FR-039). Share of the token budget of a host skill: 0

Re-check after Phase 1 design: no gate changed. No violation; Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/101-gate-and-verdict/
├── spec.md
├── plan.md                  # this file
├── research.md              # Phase 0
├── data-model.md            # Phase 1
├── quickstart.md            # Phase 1
├── contracts/               # Phase 1
│   ├── README.md
│   ├── verdict-grammar.md   #   the grammar, the details, the as-is texts
│   ├── gate-halts.json      #   the table "Halts of the phase gate" as data
│   └── as-is-literals.md    #   as-is events, lines and file texts with their items
├── checklists/requirements.md
├── tasks.md                 # speckit-tasks
└── analyze-report.md        # speckit-analyze
```

### Source Code (repository root)

```text
packages/core/                          # @specstride/core (layer L4); this feature owns the directories below
├── src/
│   ├── engine/
│   │   ├── index.ts                    #   the engine entry that the command `run` calls
│   │   ├── run-loop.ts                 #   phases from the start phase on; end of the run
│   │   ├── start-position.ts           #   first phase without a verified approval record; start phase
│   │   ├── phase.ts                    #   phase entry, leftover phase evidence, phase attempts
│   │   ├── boundaries.ts               #   lease and stop request at every boundary
│   │   └── terminal.ts                 #   terminal record; work of the end of the run
│   ├── gate/
│   │   ├── index.ts
│   │   ├── phase-gate.ts               #   the order: verification gate, critic, approval record
│   │   ├── nonce.ts                    #   64 bits, never stored before the return
│   │   ├── verdict-parser.ts           #   extracted from Lisa, brought to the baseline's grammar
│   │   ├── critic-call.ts              #   inputs, result record, outcomes, preflight, blocked paths
│   │   ├── feedback.ts                 #   feedback, reason, gist, signature
│   │   ├── verdict-record.ts
│   │   ├── limits.ts                   #   reject limit, MALFORMED streak, order after a rejection
│   │   ├── oscillation.ts
│   │   ├── archive.ts                  #   archive of a phase attempt; suffix rule
│   │   ├── halts.ts                    #   the table of halts; halt banner
│   │   ├── events.ts                   #   emitters of the events of the phase gate; rows of the projection
│   │   ├── lines.ts                    #   as-is lines for compatibility output
│   │   └── writers.ts                  #   the only module that writes records of the phase gate
│   ├── approval/
│   │   ├── index.ts
│   │   ├── record.ts                   #   the gate store of Lisa, rewritten
│   │   ├── key.ts                      #   approval key of a feature
│   │   ├── verify.ts                   #   every binding; what failed
│   │   └── ticked-without-record.ts
│   ├── recovery/
│   │   ├── index.ts
│   │   ├── diagnostician.ts            #   call, prompt, hint, case
│   │   ├── accelerator.ts              #   due rule, prompt blocks, snapshots, note
│   │   └── markers.ts
│   └── post-approval/
│       ├── index.ts
│       ├── order.ts
│       ├── tick.ts
│       └── commit.ts
└── test/101/                           # own tests: CT-101-13 to CT-101-18, CT-101-29 to CT-101-33

packages/contracts/                     # @specstride/contracts (feature 100); this feature adds the files below
├── schemas/                            #   schemas of the records of data-model.md
├── src/records/                        #   their generated types
├── src/enums/gate.ts                   #   the closed sets of this feature
├── data/gate-halts.json                #   the table of halts as data
└── test/                               #   gate-data.test.ts; the rows of this feature in profile.test.ts

tools/import-boundary/rules/gate-writers.json   # the rule for the writers of the phase gate

tests/
├── parity/101/                         # PT-101-*
└── characterization/101/               # CT-101-1 to CT-101-12
```

**Structure Decision**: this feature adds the directories `engine`, `gate`, `approval`,
`recovery` and `post-approval` to the package `@specstride/core` of the workspace that
feature 100 creates, each with an index file. It also adds, to the package `@specstride/contracts`
of feature 100, the schemas and types of its records, its closed sets, the table of halts as
data and two tests, and one rule to the import-boundary rules; it changes nothing else there.
The pass loop, the ledger and the prompt assembler live in the same package and belong to their
owners. The import-boundary check of feature 100 proves that only `gate/writers.ts` and
`approval/record.ts` write records of the phase gate and that no package of a loop layer imports
them.

## Technology choices below the specification

| Subject | Choice | Reason |
|---|---|---|
| Signature of an approval record | HMAC-SHA-256 over the canonical record hash of feature 100 annex X §X.5, with a key of 32 random bytes | Node ships it; writer and verifier are the same runtime, so a shared key is enough; no native module |
| Approval key | One file per feature in the control plane, readable by the owner only, with a key id that is the hash of the key | F101-FR-030; permissions of F100-FR-043 |
| Nonce | 8 bytes of the secure random source of the platform, as 16 lower-case hexadecimal characters | Ruling P16; equal to the baseline |
| Verdict grammar | One regular expression, multi-line and case-insensitive, built from the escaped nonce | Equal to the baseline (B-0975) |
| Hash of a signature of text | SHA-256 through the canonical hasher | Must equal the baseline on the same input |
| State of the tree around an accelerated phase attempt | The version-control tool of the project, called through the check runner port (EP-05) with a fixed argument list | The engine starts no process itself; the spec's table of extension points names this use of EP-05 |
| Approval commit | The same tool through the same port, with a fixed argument list per step (stage, commit); the scan of F100-FR-206 runs before it | As above; a failed call is ignored as F101-FR-035 asks |

## Physical paths behind the logical names

This feature names state by logical name only. The physical paths are those of the layout table
of feature 100 (`specs/100-specstride/contracts/data/`); this plan adds none.

## Complexity Tracking

No violation of the constitution by this feature. The table is empty. The deviation from
Principle IX that the weaker proof of a tool-less critic makes is recorded in the plan of
feature 100 (CQ-182); this feature consumes the result of the proof and makes none.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
