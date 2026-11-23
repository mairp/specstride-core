# Implementation Plan: Check integrity and unit evidence (feature 116)

**Branch**: `116-check-integrity-and-unit-evidence` (a label; the directory is `specs/116-check-integrity-and-unit-evidence`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/116-check-integrity-and-unit-evidence/spec.md`

## Summary

Feature 116 builds the protected set with its fingerprints, the content of one extension point
that is data (the toolchain profiles), and the builder of the fact block. It was split from
feature 115 and meets that feature only through contracts of feature 100.

| Deliverable | What it is | Requirements |
|---|---|---|
| Protected set and fingerprints | Classes, patterns, scope, fingerprints at launch, at phase entry and around a check, `tainted`, `protection`, freshness of a result | F116-FR-001 to F116-FR-008 |
| Executables, caches, authorisation, markers | Verification of pins, search path, effective configuration, caches; authorisation from the task text; suppression markers; the comparison at phase entry | F116-FR-009 to F116-FR-012 |
| Toolchain profiles | Schema, shipped profiles, conformance suite and sample, the basic protection | F116-FR-013 to F116-FR-015 |
| Fact block | The builder, its fields, what it never holds, determinism | F116-FR-016 to F116-FR-021 |
| Events and records | The event type `integrity.noted`; the fields of the two records of annex B §B.20 and their schema files | F116-FR-022, F116-FR-023 |
| Tamper fixtures | The seeded tamperings that experiment X12 part (ii) uses | F116-SC-001 |

Approach: everything that touches the file system is in one edge package. The builder of the
fact block is a pure function of records of the control plane and lives in the same package, in
a directory that imports nothing but `contracts` and `kernel`. The engine offers both to a loop
layer as services (annex D §D.1, "Inputs").

## Technical Context

**Language/Version**: TypeScript 5.x, `strict`, ECMAScript modules, on Node.js 22 or later. The Language Ledger stays empty

**Primary Dependencies**: `@specstride/contracts` (schemas, closed sets, the `parity` profile) and `@specstride/kernel` (canonical hasher, atomic write, process primitive). No dependency from npm of its own beyond the JSON Schema validator that feature 100 chose. `git` is used through the process primitive of the kernel to list tracked and untracked files

**Storage**: consumer profiles under the key `toolchains.<id>` of user configuration; files of the control plane, named by logical name (feature 100, annex B §B.5): `phase:<N>:protected-set`, `unit:<unitId>:check:<i>`, `attempt:<N>:<k>:<n>:fact-block`; read: `phase:<N>:manifest`, `run:<runId>:ledger`, `gate:<N>:approved`; `user:toolchain:<id>` in user-level state

**Testing**: the test runner that Node ships (`node:test`); fixtures of trees with seeded tamperings; verification command stubs of feature 141; golden fact blocks. No test calls a model or a paid service

**Target Platform**: Linux and macOS. Every macOS statement is `unverified` until a macOS runner has passed the oracle (ruling 67)

**Project Type**: one package of the npm workspace (`@specstride/integrity`, edge, L1, owner 116 in the package graph of feature 100), data files of `@specstride/contracts`, and the conformance suite of EP-16 in `@specstride/testkit`

**Performance Goals**: starting values with low confidence, measured in the build. Two fingerprints of a tree of 10,000 files: under 2 s together, by reading metadata first and content only for files whose metadata changed. Files of the protected set inside the scope of the tree fingerprint are always hashed by content. The one exception is an ignored path from which a command of the check manifest executes: it is covered by the hash of its listing, and content is hashed there only for pinned executables and for files that a class A pattern of a profile matches (F116-FR-003). Building a fact block of 50 units: under 50 ms

**Constraints**: no native module; MIT-compatible dependencies; no paid call in any test or build job; no path, account or name of the owner's machines; a profile is data; the builder of the fact block reads no file of the workspace

**Scale/Scope**: 23 functional requirements, 3 success criteria; 18 integrity rules owned; 5 closed sets stated; 1 row of the `parity` profile owned; 1 extension point owned as content (EP-16); 7 seeded tamperings; no as-is item carried; no parity test of its own

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v3.0.1. The brief of feature 115, from which this feature was split, names
Principles II, III, I, VIII, XIII, XVIII and XIV as binding; every gate is answered.

*Constitution v3.0.1 (2026-09-30) differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182). The row of Principle IX below was re-read against that sentence at the analyze run of 2026-09-30: the sentence binds a tested harness adapter that starts a critic-class call, and this feature builds no adapter and starts no critic call, so the row stands unchanged.*

**The gate and the loop (I–V)**

- [x] I. ✅ Fingerprints, the protected set and the fact block are files of the control plane, written by a temporary name and a rename. Nothing here is a watcher or a service
- [x] II. ✅ This feature produces no verdict and no approval. It gives the critic final results and no history (F116-FR-019, F116-FR-020)
- [x] III. ✅ Principle III v3.0.2 names the Wave 1 detection inside an ignored path from which a check executes (a metadata listing; owner, CQ-197), which F116-FR-003 implements. A check that ran against a changed set is `tainted` and never a pass; prevented where a sandbox exists (F116-FR-005 to F116-FR-007); profiles from project configuration are ignored (F116-FR-014). Was a stated deviation until the amendment of 2026-09-30 (proposal P-2 of the analyze run)
- [x] IV. ✅ Task ids and task text come from the canonical spec model through EP-03 (F116-FR-010, F116-FR-018). This feature parses no spec
- [x] V. ✅ A failure to take a fingerprint is recorded as a condition of the result and never stops a run; a refused profile is treated as absent (F116-FR-013)

**The product and its edges (VI–XII)**

- [x] VI. ✅ Strict TypeScript; profiles, the protected set and the check result are validated against schemas (F116-FR-013, F116-FR-023); no native module; the extension points are named with versions (`spec.md`, "Extension points")
- [x] VII. ✅ `protection` is read from the containment level and the confirmation of the harness adapter, for any harness of the registry; no harness name is tested (F116-FR-007)
- [x] VIII. ✅ This feature starts no pass. It writes nothing to the operator's configuration; user-level toolchain profiles are read only
- [x] IX. ✅ The critic gets a block of facts and no tool; nothing in the block names a model tier or a session (F116-FR-019)
- [x] X. N/A: no harness adapter; the pins of executables are Principle III
- [x] XI. ✅ This feature emits one event type of the catalogue, `integrity.noted`, and names none of its own (F116-FR-022). Integrity events carry a kind of the closed set; unknown values are absent or null
- [x] XII. ✅ No test calls a paid API. No secret is read. No model id appears

**The host skill (XIII–XVII)**

- [x] XIII. ✅ The fact block holds facts recorded by deterministic code and marks the proposer's declaration as a declaration (F116-FR-018)
- [x] XIV. ✅ A profile names no verification command; the protected set is built from the declared manifest. A task that no command can exercise is `unchecked` (F116-FR-018)
- [x] XV. N/A. This feature takes no part in launch consent and bypasses nothing
- [x] XVI. N/A. This feature relaunches nothing. The fingerprint of phase entry is kept across resumes and relaunches (F116-FR-004)
- [x] XVII. ✅ A toolchain without a profile is reported and gets the basic protection; a profile without a way to read the effective configuration leaves that comparison out and the doctor says so (F116-FR-015, F116-FR-009)
- [x] XX. N/A. This feature runs no work in parallel. With parallel units on, the fact block holds nothing about groups or workers (F116-FR-019)

**The rewrite (XVIII–XIX)**

- [x] XVIII. ✅ No as-is behaviour is carried, so no requirement has an origin. Every intended difference cites its register row (DV-052, DV-077). The one switch is off under the `parity` profile; everything else follows row 1
- [x] XIX. ✅ This feature prints nothing into a host session. The fact block is part of the critic's prompt and inside the critic's budget, which the owner of its slot keeps

Sixteen gates pass and four are not applicable (X, XV, XVI, XX). Complexity Tracking holds no row
since constitution v3.0.2 (2026-09-30).

**Re-check after Phase 1 design**: unchanged. The design adds one edge package, which the
package graph of feature 100 holds with owner 116, and no dependency from npm.

**Re-check after the cross-feature review (2026-09-30)**: row III became a stated deviation
(review item W-116-01), row X became N/A (W-X-14), row XI names the event type (W-X-24).

## Project Structure

### Documentation (this feature)

```text
specs/116-check-integrity-and-unit-evidence/
├── spec.md
├── checklists/requirements.md
├── plan.md                  # this file
├── research.md              # Phase 0
├── data-model.md            # Phase 1
├── quickstart.md            # Phase 1
├── contracts/               # Phase 1
│   ├── README.md
│   ├── closed-sets.json
│   ├── parity-rows.json
│   ├── integrity-rules.json
│   ├── tamperings.json              # the seeded tamperings and the condition each must give
│   ├── fact-block-content.md        # what is in the block and what never is
│   └── schemas/
│       ├── toolchain-profile.schema.json
│       ├── protected-set.schema.json
│       └── check-result.schema.json
├── tasks.md                 # Phase 2 (speckit-tasks)
└── analyze-report.md        # speckit-analyze
```

### Source Code (repository root)

```text
packages/integrity/                  # @specstride/integrity (edge, L1; owner 116)
├── src/
│   ├── fingerprint/                 # tree fingerprint, scope, exclusions, metadata cache
│   ├── protected/                   # classes A and B, patterns, entry, compare, protection,
│   │                                # authorisation, markers, phase-entry comparison
│   ├── toolchain/                   # loading, validating and detecting profiles; basic protection
│   ├── pins/                        # verification of pins, search path, effective configuration, caches
│   ├── result/                      # binding to the tree, freshness, conditions
│   └── factblock/                   # the builder: pure, imports contracts and kernel only
├── profiles/                        # shipped toolchain profiles, as data
└── test/                            # CT-116-*
packages/contracts/data/             # closed sets and profile rows of this feature
packages/testkit/src/conformance/EP-16/   # the cases of this feature, beside the contract-level suite of feature 100
packages/testkit/src/samples/EP-16/       # the sample profile of the fictional toolchain
packages/integrity/src/toolchain/doctor-check.ts   # the toolchain check, registered through the kernel (F112-FR-033; F100-FR-234)
tests/integrity/116/                 # tamper fixtures; fixtures of two histories
```

**Structure Decision**: one edge package, `@specstride/integrity`. The package graph of feature
100 (`specs/100-specstride/contracts/data/package-graph.json`) names it with owner 116, layer L1,
and lets it import `@specstride/contracts` and `@specstride/kernel`. The builder of the fact
block is kept free of file access, so that it can move into a core package without a change if
the orchestrator decides so.

## Physical choices behind the specification

| Subject | Choice |
|---|---|
| Tree fingerprint | SHA-256 by the canonical hasher over the sorted list of path, mode and content hash of every tracked file and every untracked file that is not ignored. The file list comes from `git ls-files` with the options for cached and untracked files and standard exclusions, NUL-separated. A cache keyed by path, size and modification time avoids reading unchanged content; files of class A and class B inside this file list are always hashed by content, whatever the cache says. The exception is the next row |
| Class A of ignored paths | An ignored path from which a command of the check manifest executes is not in the file list above. It is covered by a hash over its listing: per entry the name, the kind, the size, the mode, the modification time and the time of the last change of status (`ctime`), walked recursively and sorted by path. Content is hashed there for the pinned executables (F116-FR-009) and for every file that a class A pattern of a profile matches; the patterns are matched against the listing as well. A modification time alone is no basis, since a proposer can set it (research D-2); the time of the last change of status is set by the system on every write and on every change of metadata (`unverified` until the check of F116-FR-003 has run on both platforms). Residual risk: a file there that is neither pinned nor matched, changed with every value of the listing kept, is not detected. Hashing the content of whole dependency directories around every check was rejected for its cost (research D-6) |
| Patterns | Glob patterns relative to the workspace root, matched against the file list of the fingerprint |
| Suppression markers | Patterns of the profile applied to the lines added and removed between the tree at phase entry and the current tree |
| Effective configuration | The fixed argument list of the profile, run through the check runner with the environment of a check; the output is hashed and never stored as text |
| Fact block | Built as a record of `specstride.fact-block/1`; key order and row order fixed; serialised by the canonical record hash rules of the kernel, so that equal states give equal bytes |

## What is planned elsewhere

| Subject | Where |
|---|---|
| Units, checkpoints, outcomes, caps, the router, the `[LOOP]` line, the tripwire, the experiments | 115 |
| The check runner, the pins at launch | 148 |
| The derivation of the check manifest | 105 |
| The key list, to which `toolchains.<id>` is reported | 110 |
| The slot and the escaping of the fact block | 117 |
| The approval record | 101 |
| The names of events | 111 |
| The doctor's registry | 112 |
| The second suite | 141 |

## Complexity Tracking

No violation. The one row this plan held (Principle III, the metadata listing inside an ignored
path) was removed when constitution v3.0.2 wrote the owner's CQ-197 ruling into Principle III
(2026-09-30).
