# Implementation Plan: Specstride (umbrella, feature 100)

**Branch**: `100-specstride` (a label; the directory is `specs/100-specstride`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md), with the annexes in [annexes/](annexes/)

**Input**: Feature specification from `specs/100-specstride/spec.md`

## Summary

Feature 100 is the single source of every interface that two or more features share: 237
requirements in nine annexes (226 at first, 235 after the amendments, 236 after the repairs of the
cross-feature review, 237 after the upstream fixes of 2026-09-30). It builds no behaviour of a run. What it delivers as code is small
and is what makes the interfaces checkable:

| Deliverable | What it is | Requirements |
|---|---|---|
| The `contracts` package | Schemas, closed sets, logical names, exit codes, stop reasons, the run-state machine, the event and config envelopes, the interface types of the 19 extension points, the `parity` profile and the normalization tables as data | All annexes |
| The test kit, frame and static tests | The frame in which every content owner places the conformance suite and the sample of its extension point; the static tests; the table-level tests; the canary harness | F100-FR-017, F100-FR-018, F100-FR-222 to F100-FR-226 |
| Four modules of the kernel package | The table evaluator, the atomic write, the notebook sweep and the stable read, which feature 100 owns | F100-FR-036, F100-FR-204, F100-FR-057, F100-FR-228 |
| The import-boundary check | A check over the package graph | F100-FR-001, F100-FR-012 |
| The build and release pieces | The build workflow and the publishing workflow in `.github/workflows/`; the sync and type scripts in `packages/contracts/scripts/`; the release checks in `tests/release/100/` | F100-FR-223, F100-FR-224, F100-FR-236 |

Approach: the JSON Schema and data files are the source; types are generated from them; the
annexes stay the authority and a generator proves in the build that the files equal the annexes
(`npm run contracts:check`, the workspace tool `tools/contracts-gen/` since task T207 ported the
Python script of the specification with byte-identical files; see row VI of the Constitution Check
and Complexity Tracking). The behaviour behind each interface belongs to the content
owner named in the annex and is planned there.

## Technical Context

**Language/Version**: TypeScript 5.x, `strict`, ECMAScript modules, on Node.js 22 or later (22.23.2 on the machine of this plan)

**Primary Dependencies**: one JSON Schema validator for draft 2020-12, pure JavaScript, MIT (Ajv is the choice, see `research.md` D-2); the TypeScript compiler as a development dependency. No other runtime dependency in `contracts` or in the kernel pieces

**Storage**: none of its own. It defines the files of the three roots and the worker root by logical name (annex B §B.5) and their physical paths (`contracts/data/layout.json`)

**Testing**: the test runner that Node ships (`node:test`), with its assertion module; stub agents, fake executables and recorded fixtures; the parity oracle of feature 141 for the three parity families this feature carries. No hermetic test and no job of the build calls a model or a paid service; the one live test, CT-100-324, is run at release on request and never in the build

**Target Platform**: Linux and macOS. Every macOS statement is `unverified` until a macOS runner has passed the oracle (ruling 67)

**Project Type**: packages of one npm workspace: `@specstride/contracts`, `@specstride/testkit`, four modules of `@specstride/kernel`, and a build tool

**Performance Goals**: loading the `contracts` package adds under 30 ms to the start of a command (schemas are compiled lazily, per schema); the table evaluator decides in under 1 ms for a table of 100 rows; the import-boundary check runs in under 10 s on the whole workspace. Low confidence: starting values, measured in the build

**Constraints**: plain `npm install`; no install script; no native module; nothing compiled at install; MIT-compatible dependencies only; the Language Ledger is empty (no component of the product is written in another language; the build ran one Python tool of the specification until T207 ported it, see row VI); no `node:` import in `contracts`; no path, account or name of the owner's machines; tests without paid calls

**Scale/Scope**: 237 functional requirements, 9 success criteria, 19 extension points, 30 record schemas, 285 closed sets, 133 rows of the `parity` profile, 29 normalization rules, 127 logical names, 199 rows on the old side of the layout table, 49 threats. As-is carried: 5 requirements and success criteria and 8 behaviour items in 4 clusters; fixture families FX-01, FX-03, FX-04, FX-05, FX-07, FX-11, FX-12, FX-17, FX-33, FX-35, FX-36

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v3.0.1. Feature 100 states interfaces; where a principle binds behaviour that another
feature builds, the check is answered for the interface and the owner is named.

**The gate and the loop (I–V)**

- [x] I. ✅ Files only: three roots and the inbox (annex B §B.1, F100-FR-032, F100-FR-039); atomic write (F100-FR-036); liveness from the lease, never an event (F100-FR-061); no listener (F100-FR-220)
- [x] II. ✅ The verdict comes from the phase gate only; the nonce has 64 bits (F100-FR-139); loop layers hold no writer of the phase gate (F100-FR-117); approval is a signed record outside the proposer's write scope (F100-FR-070)
- [x] III. ✅ Grounding refuses state paths (F100-FR-037); checks are fixed at launch and run by the runtime (annex C §C.8, annex D §D.8); outside text is data (F100-FR-221); project configuration narrows only (F100-FR-202). The critic with read-only tools is the stated exception (annex C §C.3)
- [x] IV. ✅ One canonical spec model, no second parser (F100-FR-095)
- [x] V. ✅ A sink never breaks a run (F100-FR-104); a failing implementation degrades (F100-FR-019)

**The product and its edges (VI–XII)**

- [x] VI. ✅ Passes; the owner answered CQ-186 on 2026-09-30, recorded in Complexity Tracking until T207. Strict TypeScript; every record has a schema and is validated at the boundary; `contracts` imports no provider, host or UI code and no `node:` module; plain `npm install`; one MIT validator; no native module; the 19 extension points are named with versions in `spec.md`, "Extension points". The Language Ledger stays empty: no component of the product is written in another language. The fact beside it: the build ran a Python generator of the specification (`contracts/tools/generate.py --check`) until T207 ported it to `tools/contracts-gen/` on 2026-10-01 with byte-identical files (T293); the build now runs the TypeScript tool and states no Python requirement. The answer of CQ-186: a tool of the build is no component in the sense of the Language Ledger where its file is outside every published package and the build states Python 3 as a requirement of development; so the generator passes the principle, and T207 ports it before the release acceptance
- [x] VII. ✅ One open registry, no closed list, no harness name in control flow (F100-FR-023); an unverified harness runs at Tier 1 or Tier 2 only (F100-FR-085)
- [x] VIII. ✅ Selecting the `parity` profile is the consumer's explicit opt-in: `profile` is a widening key, selected at flag, environment or user rank and never by a project file (F110-FR-013; annex X §X.2), and selecting it sets the switches of §X.7 and does nothing else (F100-FR-210). A run that rests blocked on a human is never relaunched, under every profile, the `parity` profile included (F100-FR-163; question CQ-238, answered by the owner on 2026-09-30: row O-33 of table 1 of feature 123 is active under every profile). As interface: prompt by standard input (annex C §C.1), blocked-on-human as a state (annex E §E.2), the real configuration home never written (F100-FR-113), memory off (F100-FR-082), fresh session per phase attempt (F100-FR-083), contained by default (F100-FR-111). Behaviour: 109 and the harness adapters
- [x] IX. ⚠ Passes outside the `parity` profile; deviation under `parity` recorded in Complexity Tracking. Two forms of the `completion` level with their proofs (F100-FR-087); withheld paths (F100-FR-089); known context window, and a configured critic on an unlisted model with no declared window refused (F100-FR-231); typed auth failure (annex C §C.1). The weaker proof of a tested harness adapter whose stream has no initial record (annex C §C.3, first form; the third way of F100-FR-230) passes: Principle IX of v3.0.1 names it (CQ-182, closed by the owner on 2026-09-30). The deviation under `parity`: no proof is made for any harness (F100-FR-230; annex X §X.7 rows 28 and 117), and the as-is fallback window and the as-is sending of a prompt over the window apply (F100-FR-231; rows 28, 55, 57), as the parity oracle compares them (CQ-145, CQ-182)
- [x] X. ✅ The descriptor of a tested harness adapter holds `versionRange` and `verifiedOn` (annex C §C.2); the resolved registry records the version (annex C §C.6)
- [x] XI. ✅ One envelope (F100-FR-198); the compatibility projection is byte-identical on the fixtures of the oracle (F100-FR-105); a stream without a terminal record is reported (F100-FR-090); unknown is null; content passes the redaction point (F100-FR-106, F100-FR-205)
- [x] XII. ✅ No hermetic test and no job of the build calls a model; CT-100-324 is of the live tier, run at release on request under the owner's login, logged, and never in the build (F100-FR-224, task T205); auth tiers and the terms gate for both audiences (F100-FR-108); secrets by reference (F100-FR-107); no model id in any file of this feature

**The host skill (XIII–XVII)**

- [x] XIII. ✅ Pure tables with the rule id recorded (F100-FR-007, F100-FR-204); only validation promotes (F100-FR-190); the judgment exchange records provenance (F100-FR-192)
- [x] XIV. ✅ Declared commands only; a conflict is a blocker; no check means `unchecked` (annex C §C.8, §C.9)
- [x] XV. ✅ Invocation is consent; `dry-run` withholds it; nothing bypasses a launch check, the terms gate or a budget (F100-FR-174, F100-FR-196)
- [x] XVI. ✅ The host reads only (F100-FR-002); relaunch for classified transients within budget (F100-FR-162, F100-FR-163; a blocked run is refused under every profile; under the `parity` profile table 1 classifies a stop that is not blocked as the baseline, DV-114); a quota pause spends nothing (F100-FR-146); counts survive (F100-FR-069)
- [x] XVII. ✅ Every `unverified` fact names its check; a test whose prerequisite is missing is a skip with its reason (quickstart, "Tiers")
- [x] XX. ✅ As interface: declared, disjoint write scopes (annex D §D.3); decisions recorded in the parallel plan; composition and never a merge of content (F100-FR-122); the merge check and the full verification gate on the workspace before the critic (F100-FR-125). Behaviour: 142

**The rewrite (XVIII–XIX)**

- [x] XVIII. ✅ Every carried as-is id is in an `origin:` with disposition and test (`spec.md`, "As-is behaviour not carried", second table); intended differences cite rows of the divergence register (117 rows today); the `parity` profile switches the layer and continuation off (annex X §X.7 rows 1 and 10)
- [x] XIX. ✅ This feature prints one line (`--protocol`, under 10 bytes). It states the budgets of all host-facing output (annex G §G.5) and the rule that the build measures them (F100-FR-187)

Rows VI and IX are recorded in Complexity Tracking. Row VI passes on the owner's answer of CQ-186;
its row names the end condition, T207, which was met on 2026-10-01. Row IX passes outside the `parity` profile: the weaker proof
is named by Principle IX since v3.0.1 (CQ-182), and its row is kept; under the `parity` profile row
IX is a deviation with a row of its own. One rule ends the rows: a deviation row stays until the
first implementation slice removes it (Sync Impact Report of constitution v3.0.1). Row VIII,
recorded as a deviation under the `parity` profile by the re-check B-8.7, passes since the owner's
answer on CQ-238 (2026-09-30), and its Complexity Tracking row is removed. Every other check passes.

**Re-check after Phase 1 design**: unchanged. The design adds one validator dependency (MIT, pure
JavaScript) and a generator script that uses the standard library of its language only and is a
tool of the specification, not a component of the product (CQ-186, answered by the owner on 2026-09-30). It was ported to
TypeScript by T207 on 2026-10-01, before the release acceptance.

## Project Structure

### Documentation (this feature)

```text
specs/100-specstride/
├── spec.md                  # vision, scenarios, index, success criteria, constraints
├── annexes/                 # nine annexes, normative: the 237 requirements
├── checklists/requirements.md
├── plan.md                  # this file
├── research.md              # Phase 0: decisions, with links to docs/ecosystem/
├── data-model.md            # Phase 1: entities, relations, state transitions
├── quickstart.md            # Phase 1: how to validate the feature
├── contracts/               # Phase 1: the machine-readable form of the annexes
│   ├── README.md            #   every file with the annex section it mirrors
│   ├── schemas/             #   30 record schemas (JSON Schema 2020-12)
│   ├── extension-points/    #   19 extension points and an index
│   ├── data/                #   22 data files: closed sets, profile, layout, codes, ...
│   ├── annex-tables/        #   every table of every annex
│   ├── requirements.json    #   every requirement with its fields
│   ├── sources/             #   hand-written: physical paths, old side, package graph
│   └── tools/generate.py    #   generator and check
├── tasks.md                 # Phase 2 (speckit-tasks)
└── analyze-report.md        # speckit-analyze
```

### Source Code (repository root)

```text
packages/
├── contracts/                       # @specstride/contracts (published)
│   ├── schemas/                     #   JSON Schema files, one per schema id
│   ├── data/                        #   closed sets, parity profile, normalization tables,
│   │                                #   layout (logical names and paths), exit codes,
│   │                                #   stop reasons, run-state machine, line grammar
│   ├── src/
│   │   ├── ids/                     #   identifiers, logical names and their resolver
│   │   ├── records/                 #   generated types and validators of the records
│   │   ├── enums/                   #   closed sets with their unknown-value rule
│   │   ├── codes/                   #   exit codes per process and per command
│   │   ├── state/                   #   run-state machine: states, transitions, owners
│   │   ├── envelope/                #   event envelope, config envelope, ranks, trust classes
│   │   ├── ep/                      #   interface types of EP-01 to EP-19
│   │   ├── grammar/                 #   line grammar
│   │   └── profile/                 #   the parity profile
│   ├── scripts/                     #   sync.mjs, types.mjs: copy the specification files, deliver the files
│   │                                #   of other features' contracts/deliver.json, generate types
│   ├── test/
│   ├── README.md                    #   for authors of descriptors and later implementations (T208)
│   └── DEPENDENCIES.md              #   the pinned schema validator: licence, no install script, no native part (T005)
├── kernel/                          # @specstride/kernel; feature 100 builds four modules
│   ├── src/
│   │   ├── table/                   #   the table evaluator (specstride.table/1)
│   │   ├── atomic-write/            #   temporary name, then rename
│   │   ├── notebook-sweep/          #   the notebook sweep at the start of a phase (annex B §B.5)
│   │   └── stable-read/             #   leading bytes compared before and after a reading (annex B §B.2)
│   └── test/                        #   table.test.ts (T014), layout-rules.test.ts (T022), stable-read.test.ts (T213), …
└── testkit/                         # @specstride/testkit (published)
    ├── src/
    │   ├── conformance/             #   the frame: registration, run, report; one folder per
    │   │                            #   extension point, filled by its content owner
    │   ├── samples/                 #   sample implementations outside the core, one per point
    │   ├── static/                  #   closed sets, schema field, major refusal, profile,
    │   │                            #   physical paths in specifications, vocabulary review
    │   ├── tables/                  #   table-level tests of exit codes and stop reasons
    │   └── canary/                  #   the canary harness: planting and the sink scan
    ├── test/
    └── README.md                    #   how to run a conformance suite on an implementation (T208)
tools/
├── import-boundary/                 # the check over the package graph
│   └── rules/                       #   rule files of other features, one JSON file per rule:
│                                    #   { rule, owner, requirement, from, forbid, reason }, read by
│                                    #   src/rule-files.ts; a rule on files where mayImport per package
│                                    #   cannot separate modules of one package (F149-FR-007)
└── contracts-gen/                   # the port of the generator (T207)
tests/
├── parity/100/                      # PT-100-*: table-level assertions on oracle fixtures
├── characterization/100/            # CT-100-1, CT-100-2: the Lisa side of the exit vocabulary
└── release/100/                     # CT-100-324 (the logged live run), CT-100-336 (attestation)
.github/workflows/                   # build.yml (T006), release.yml (T225)
```

**Place of parity and characterization tests**: one rule for every feature. A parity test
(`PT-<feature>-…`) lives in `tests/parity/<feature number>/`, a characterization test
(`CT-<feature>-<n>` that pins as-is behaviour against the reference) in
`tests/characterization/<feature number>/`, both at the root of the repository and never inside a
package. Unit and contract tests of a package stay in the `test/` directory of the package.

**Structure Decision**: packages of one npm workspace, as in the approved architecture (section
6) and R15 A-4. Feature 100 creates `packages/contracts`, `packages/testkit`, the four kernel
modules, `tools/import-boundary`, `tests/release/100/` and the two workflows. Every other package of `contracts/data/package-graph.json`
belongs to its owner feature. The workspace root (the root `package.json`, the TypeScript base
configuration, the build workflow) is created by the first tasks of this feature, because every
other feature needs it.

**Files of other features in the `contracts` package**: the sync script (T008) clean-copies
`data/` and `schemas/` of this feature's `contracts/` into the package, and after the two clean
copies delivers the files that every other feature lists in `specs/<feature>/contracts/deliver.json`
(keys `data` and `schemas`, each a map from the target name in the package to a path relative to
that feature's `contracts/`), failing when a target name already exists or two features name the
same target, and verifying each delivered file byte for byte. The sync stays the one writer of the
package directories, and the annex files stay generated.

**Path Conventions** (for the tasks of this feature): a file that another feature delivers through
its `contracts/deliver.json` is a data file of the package too; its target name carries the number
of that feature (`closed-sets-116.json`).

## Physical paths behind the logical names

The full table is `contracts/data/layout.json` (127 names, layout version 1.2). The roots:

| Root | Location |
|---|---|
| User configuration | `$XDG_CONFIG_HOME/specstride`, default `~/.config/specstride` |
| User-level state | `$XDG_STATE_HOME/specstride/user`, default `~/.local/state/specstride/user` |
| Control plane | `$XDG_STATE_HOME/specstride/workspaces/<workspaceId>`, or the control root the consumer set. Directories 0700, files 0600 |
| Workspace part | `<workspace>/.specstride` |
| Worker root | `$XDG_CACHE_HOME/specstride/workers/<workspaceId>/<opaque>` |
| Liveness endpoint | A short path in the per-user runtime directory; the lock directory refers to it |
| Package | The installed package, read only |

Workspace source of the `package` root: the build of the published package copies each workspace
package's `data/` tree into it, so that `packages/harness/data/descriptors/<id>.yaml` feeds
`package:harness:<id>` (`<package>/harnesses/<id>.yaml`) and `packages/harness/data/catalogue/`
feeds `package:catalogue` (`<package>/catalogue/`). Code reads these files only through their
logical names.

Inside the control plane, from R15 A-5.3 with the amendments of R15v P-8:

```text
<control>/
  workspace.json  current.json  lock/
  inbox/            stop.request  hold-relaunch.request  host-events/<launchId>.jsonl
  launches/<launchId>/   launch.json  supervision.json  runtime.log
  pipelines/<pipelineId>/
    contract/  bundle/<hash>/  state.json  retrospective/
    compat/     launcher.log  harness-report.log  harness-launch.log  harness-run.json
  reverse/<slug>/
  features/<slug>/
    approvals/phase-<N>.json   keys/approval.key
    compat/      learning-events.jsonl
    learning/    applied.json  events.jsonl  phase-<N>.json  summary.json
    failure-ledger.jsonl   verification/   plugin-installs/
    runs/<runId>/
      run.json  engine.terminal.json  pause.record  lease.json      # one file per writer
      config.resolved.json  registry.resolved.json  parallel-plan.json
      events.jsonl  ledger.jsonl  keys/ledger.key  procs/<writer>.jsonl
      view.json  status.line  current-pass.json  telemetry/  tree-store/
      compat/    events.legacy.e<k>.jsonl  run.e<k>.log
      verification/
      phases/<N>/
        manifest.json  protected-set.json  recovery-markers.json  verdict-pins.json  approved/
        attempts/e<k>-a<n>/                                         # k: engine-start ordinal
          attempt.json  feedback.md  hint.md  acceleration.md  session/  accelerator/
          gate/  critic/
          passes/<passId>/  units/<unitId>/  jobs/<jobId>/
```

The old side of the layout table is `contracts/data/layout-old-side.json`: one row per `file` item
of the behaviour inventory, 199 rows, each with its logical names or the rule that applies.

## What is planned elsewhere

| Subject | Where |
|---|---|
| The conformance suite, the sample and the Wave 1 implementations of each extension point | Feature 100 builds the frame, the registration of samples, and for each of the 19 points the suite at contract level and a minimal sample. The content owner of the point adds its behaviour cases and its full sample in the same folders: the suite in `packages/testkit/src/conformance/EP-nn/`, the sample in `packages/testkit/src/samples/EP-nn/`, with `EP-nn` in capitals. No suite and no sample lives outside the published test kit, and none exists twice. The Wave 1 implementations belong to the content owner |
| The content of the event schema and of the config schema | 111 and 110 |
| The redactor and its pattern set; the canonical hasher | 111; 104. Feature 100 builds the canary harness that tests the first |
| The oracle: fixtures, stub agents, normalizer, comparator | 141. Feature 100 delivers the normalization tables as data |
| Bundling into the one published package; the host package | 119, 113 |

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Principle IX (NON-NEGOTIABLE): proof by pinned configuration for a tested harness adapter whose stream has no initial record (annex C §C.3, first form; F100-FR-230, third way; annex X §X.6 row 128) | A text stream emits no initial record (brief 130), so the adapter cannot verify the empty tool list and the minted session from the harness's own record. The proof is the exact version pin together with the preflight and the flag set of the call, open to a tested harness adapter only, and recorded for every call as the weaker proof | Refusing such a harness as critic: dsh could then be a critic only under the `parity` profile, against the as-is behaviour that Wave 1 carries (rulings 32, 32b). The owner ruled for the weaker proof (CQ-182, 2026-09-30), and constitution v3.0.1 names it in Principle IX, so the proof passes. End condition: the row stays until the first implementation slice removes it (Sync Impact Report of v3.0.1) |
| Principle IX (NON-NEGOTIABLE) under the `parity` profile only: two relaxations. (1) No proof of the critic mode is made, for any harness (F100-FR-230; annex X §X.7 rows 28 and 117). (2) For a critic on a model that is not listed and has no declared window, the as-is fallback window of each harness applies, and a critic prompt still over the window is sent (F100-FR-231; rows 28, 55, 57) | Parity with the baseline is the release condition of Principle XVIII: under `parity` the oracle compares the as-is behaviour, which made no proof and used a fallback window (DV-081, DV-106, DV-110, DV-111). The deviation cannot be reached by accident: `profile` is a widening key that the consumer selects at flag, environment or user rank, and project configuration cannot select it (F110-FR-013; annex X §X.2; F100-FR-210). Outside `parity` the principle holds in full | Removing the parity clauses of F100-FR-230 and F100-FR-231: the fixtures of FX-07 and FX-25 would then fail under the oracle, and the release condition of Principle XVIII could not be met. Rulings: CQ-145 and CQ-182, answered by the owner in person on 2026-09-30. End condition: the row stays until the first implementation slice removes it (Sync Impact Report of v3.0.1) |
| Principle VI and ruling 18 (the Language Ledger is empty): the build ran a Python generator of the specification, `contracts/tools/generate.py --check`, until T207. **Closed on 2026-10-01**: T207 ported it to `tools/contracts-gen/`, T293 proved the 82 files byte-identical, T006 names the TypeScript tool, and Python 3 left the requirements of development | The 40 other features read the generated files as the machine-readable form of the annexes, so a difference between a file and its annex must be impossible (research D-5). The generator had to exist while the specifications were written, before a workspace existed. It uses the standard library only, is outside every published package and is never shipped; the build states Python 3 as a requirement of development | Writing the generator in TypeScript at once: no workspace existed when the specification was written. Writing the files by hand: a review does not hold over 236 requirements and about 900 table rows. End condition: T207 ports the generator to `tools/contracts-gen/` with byte-identical files, before the release acceptance (T204); T006 then names the TypeScript tool and the Python script leaves the build. Reading of the principle: CQ-186, answered by the owner on 2026-09-30 as the reading above |
