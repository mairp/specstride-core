# Implementation Plan: Parity oracle (feature 141)

**Branch**: `141-parity-oracle` (a label; the directory is `specs/141-parity-oracle`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/141-parity-oracle/spec.md`

## Summary

Feature 141 builds the differential oracle: the tool that runs the two Python baselines and the
TypeScript product on the same fixtures with scripted stub agents and compares what each side
leaves behind. It is the release condition of the product (ruling 32) and it is cited by the
parity tests of the other features of Wave 1 (thirty when this plan was written, forty after the splits).

| Deliverable | What it is | Requirements |
|---|---|---|
| Reference fetch | Pins, archive into scratch, verification, read-only tree, check after every run | F141-FR-001, F141-FR-002 |
| Hermetic runner | The empty environment with its allow-list; the driver of one side; the capture of the surfaces | F141-FR-003, F141-FR-004, F141-FR-019, F141-FR-038 |
| Stub kit | Proposer, critic (HTTP and CLI), diagnostician, engine, verification commands, plugin installer, telemetry sink; harness stubs; transcripts | F141-FR-005 to F141-FR-011 |
| Fixture catalogue | 40 family ids, 39 active; the first set of scenarios, the members of the pattern names, the ends on the reference and the register of the scenarios of other features; the imported as-is assets | F141-FR-012 to F141-FR-018, F141-FR-030 |
| Normalizer | N-01 to N-29, driven by the data of feature 100, with counts per rule | F141-FR-020 |
| Comparator, waivers, register map | Three results; assertions before normalization; one waiver file; one entry per register row | F141-FR-021 to F141-FR-024 |
| Golden captures and the live run | Committed normalized captures; the capture job; the release check | F141-FR-025, F141-FR-026, F141-FR-037 |
| Declaration check | Names and declarations of tests; refusals | F141-FR-027 to F141-FR-029 |
| Exercise map and coverage script | Line tracing of the reference; the claim check; the correction list; the second half of the coverage check | F141-FR-031 to F141-FR-034 |
| Per-OS expectations and the macOS runner | The expectations as data; the platform test tier | F141-FR-035, F141-FR-036 |
| Second suite and owner decisions | Layer on, allowlist from the register, counter assertion; the treatment of decisions 18, 21, 22 and 23 | F141-FR-039 to F141-FR-043 |
| Self-proof and packaging | Reference against itself, seeded differences, determinism, the feasibility probe; nothing of the oracle in the product package; the order of construction | F141-FR-044, F141-FR-045 |

Approach: a logical-model comparator (R18, option B) and a hybrid reference (R18, option C).
Every table the normalizer uses is data of feature 100; every list the oracle owns (families,
verbs, surfaces, register map, allowlist) is data in `contracts/` and is checked against
`spec.md` in the build.

## Technical Context

**Language/Version**: TypeScript 5.x, `strict`, ECMAScript modules, on Node.js 22 or later. The stubs are Node-shebang files. The reference systems run in their own languages (Python 3.10 to 3.13, bash 4 or later); they are the reference and no component of the product, so the Language Ledger stays empty. Python 3 is a requirement of development only: the generator and check script of this feature (`contracts/tools/generate.py`) and the tracing of the Python parts of the reference run under `python3`, and no Python file is in a published package — the only package of this feature, `@specstride/oracle`, is never shipped, and it holds no Python file (CQ-186)

**Primary Dependencies**: `@specstride/contracts` (the normalization tables, the layout tables, the `parity` profile, exit codes, stop reasons, line grammar); `@specstride/testkit` (the frame of tests and the canary harness); `node-pty` is **not** used: the pseudo-terminal of FX-40 comes from `script(1)`, which both target systems ship (see `research.md` D-9). No runtime dependency from npm beyond the JSON Schema validator that feature 100 chose

**Storage**: files only. Golden captures under `packages/oracle/golden/<family>/<scenario>/` as normalized JSON and text; the exercise map under `packages/oracle/exercise-map/`; scratch under the temporary directory of the run. The oracle names state by logical name (feature 100, annex B §B.5) and resolves it through `layout.json` and `layout-old-side.json`

**Testing**: the test runner that Node ships (`node:test`); the oracle tests itself with the reference on both sides and with seeded differences. No test calls a model or a paid service; a network guard fails a run that connects beyond loopback

**Target Platform**: Linux and macOS. The Specstride reference runs on Linux only. Every macOS statement is `unverified` until a macOS runner has passed the oracle (ruling 67)

**Project Type**: one package of the npm workspace, `@specstride/oracle`, layer `dev`, never shipped; plus the parity tests of this feature and the second half of the coverage script in `docs/ecosystem/`

**Performance Goals**: starting values with low confidence, measured in the build. One three-phase scenario: under 15 s on the reference with the tick at 1 (R18 measured 10 s), under 5 s on the port. The hermetic test tier (port against golden captures, all families): under 15 minutes on four workers. The reference test tier (live differential, both suites, with tracing): under 60 minutes. Normalization and comparison of one capture: under 1 s

**Constraints**: the source repositories are never written; no reference tree in the repository; no paid or external call; no native module; MIT-compatible dependencies only; no path, account or name of the owner's machines, the locally registered backend included; the product package holds no file of the oracle; scenarios run in parallel only in separate scratch roots

**Scale/Scope**: 45 functional requirements, 10 success criteria; 40 family ids (39 active, FX-37 retired, FX-38 to FX-40 new); 234 scenario names in the set that this feature delivers, 13 of them patterns with 175 members, and 21 names that other features own (14 after the follow-up of 2026-09-29, and 7 of the features 106 and 107 registered on 2026-09-30; 193 names before the follow-up); 8 kinds of stub and 6 harness stubs; 16 surfaces; 29 normalization rules implemented; 119 register rows mapped; 2,785 behaviour items and 2 supplementary rows in the exercise map; 1 as-is success criterion carried (011 SC-008, FX-32)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v3.0.1. The oracle is a development tool that calls the product from outside. Where
a principle binds the product, the check says what the oracle observes of it.

*Written against v3.0.0 on 2026-09-29. Constitution v3.0.1 (2026-09-30) differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182); the row of Principle IX below was re-read against that sentence at the analyze run of 2026-09-30 and stands.*

**The gate and the loop (I–V)**

- [x] I. ✅ The oracle reaches both sides through commands, files and signals only. It reads state after a run has ended (F141-FR-019). It writes captures and reports by a temporary name and a rename. It is no watcher and no service; the two stub servers live only for one scenario and bind to loopback
- [x] II. ✅ The oracle produces no verdict. The critic stub answers with what the script says and takes the nonce from the prompt (F141-FR-008); the comparator asserts the form of every nonce and that no two calls share one (F141-FR-021). A result of the oracle is a test result and never an approval
- [x] III. ✅ The grounding snapshot and the critic prompt are observed as written, in the transcript (F141-FR-011, FX-25). Scenarios are data (F141-FR-005). The oracle runs the port with the configuration the profile and the fixture name, and widens nothing (F141-FR-004)
- [x] IV. ✅ The oracle parses no spec. The format fixtures FX-09, FX-10 and FX-32 compare what the two sides print
- [x] V. ✅ The telemetry sink stub can refuse and be down (FX-31), which proves that a sink never breaks a run. Line tracing changes no compared surface (F141-FR-031)

**The product and its edges (VI–XII)**

- [x] VI. ✅ Strict TypeScript; every file the oracle reads or writes has a schema in `contracts/schemas/`; the package is in the layer `dev` and is imported by no product package (F141-FR-045); plain `npm install`; no native module; the Language Ledger stays empty, because the reference is not a component and the Python tools of the build (the generator `contracts/tools/generate.py`, the `sitecustomize` file of line tracing, the coverage script `docs/ecosystem/check-traceability.py`) are requirements of development outside every published package (CQ-186, closed by the owner on 2026-09-30 with this answer); extension points consumed: EP-08 `specstride.event-sink/1`, EP-02 `specstride.harness/1`, EP-04 `specstride.loop-layer/1` (`spec.md`, "Extension points")
- [x] VII. ✅ Names of stub executables are data and are not a list of supported harnesses (F141-FR-006). A harness stub is added by data (F141-FR-010). A fixture that enumerates harnesses reads the registry. The generic stub proves a harness that is only declared (§O.7)
- [x] VIII. ✅ The oracle observes these in the transcript: how the prompt arrived, that no invocation continued a session (F141-FR-011), and that the home of the operator was not written (surface `home`, fresh per run, F141-FR-003). Under the `parity` profile containment and the argument list are as at the baseline (DV-030, DV-031)
- [x] IX. ✅ The critic stub serves both forms of the `completion` level (F141-FR-008); the dsh stub records the patch file that makes the critic tool-less and the permission mode (§O.3); context windows per harness are compared in FX-25. Re-read against v3.0.1 (2026-09-30): the weaker proof of the tool-less form is a duty of a tested harness adapter, recorded on every call in a record of the port (features 109, 130 and 134; CQ-182); the oracle makes and accepts no proof, no surface of the first suite holds that record (the surface `events` compares the compatibility projection), and the transcript of the dsh stub shows the argument list of every critic call, so the flag set that the proof names is compared
- [x] X. ✅ The oracle pins the two baselines by commit and tree hash (F141-FR-001). It records the versions of the interpreter and of the shell of a capture. Version ranges of harnesses belong to the harness adapters
- [x] XI. ✅ The compatibility projection is the compared event surface, byte for byte after the rules N-12 to N-14 (surface `events`); a stream without a terminal record is a scenario of FX-26; nothing is invented, since both sides are observed
- [x] XII. ✅ No test and no job calls a paid or external model API (F141-FR-038); stubs hold no credential (F141-FR-005); the key in the environment is a dummy; model ids appear only as as-is literals of a scenario; no third party is needed for any check

**The host skill (XIII–XVII)**

- [x] XIII. ✅ Every result of the oracle is a fact of deterministic code with the rule or waiver that produced it (counts per rule, F141-FR-020). FX-32 to FX-34 compare derivation, validation and promotion
- [x] XIV. ✅ The verification command stubs are declared by the fixture; the oracle invents no command (§O.3)
- [x] XV. ✅ The oracle drives commands and never a host skill (F141-FR-043); modes compare through the mode map. No flag of the oracle bypasses a launch check, the terms gate or a budget: the fixtures declare the audience `personal` as the profile says
- [x] XVI. ✅ FX-36 compares the supervisor as a reader and the relaunch classifier; the profile sets `relaunch.owner: supervise`; no stub emits a quota signal (F141-FR-043)
- [x] XVII. ✅ Three test tiers that run apart; a missing prerequisite is a skip with its reason and never a pass; at the release check a skip blocks (F141-FR-037); macOS is `unverified` until a runner has passed (F141-FR-036)
- [x] XX. N/A. The oracle runs no work of a run in parallel. Parallel units are off under the `parity` profile (row 20). Scenarios of the suite run side by side only in separate scratch roots, which is a matter of the test runner

**The rewrite (XVIII–XIX)**

- [x] XVIII. ✅ This feature is the oracle of the principle. 011 SC-008 has its origin, disposition and test (F141-FR-018). Every register row has an entry in the register map (F141-FR-023). The first suite runs with the layer and continuation off; the second suite is F141-FR-039 to F141-FR-042. The source repositories are never modified (F141-FR-002)
- [x] XIX. ✅ The oracle prints nothing into a host session. Its own report is one line per fixture and surface that is not `equal`, and one summary line; the budget of host-facing output is 0 bytes

Every check passes. Complexity Tracking is empty.

**Re-check after Phase 1 design**: unchanged. The design adds no dependency from npm. It adds a
generator script in the standard library of its language, which is a tool of the specification:
a Python 3 file under `contracts/tools/`, a requirement of development and never shipped
(CQ-186). Line tracing of the Python parts uses the `trace` module that the reference interpreter
ships; it runs inside the reference and adds nothing to the product.

## Project Structure

### Documentation (this feature)

```text
specs/141-parity-oracle/
├── spec.md                  # the specification; "How a feature cites the oracle" §O.1 to §O.7
├── checklists/requirements.md
├── plan.md                  # this file
├── research.md              # Phase 0: decisions, with links to docs/ecosystem/
├── data-model.md            # Phase 1: entities, relations, state of a scenario run
├── quickstart.md            # Phase 1: how to validate the feature
├── contracts/               # Phase 1: the development interfaces
│   ├── README.md
│   ├── fixture-catalogue.json   stub-vocabulary.json   surfaces.json
│   ├── register-map.json        layer-allowlist.json   per-os-expectations.json
│   ├── inventory-supplement.tsv
│   ├── schemas/                 # fixture, waivers, test declaration, transcript, result, exercise map
│   └── tools/generate.py        # generator and check
├── tasks.md                 # Phase 2 (speckit-tasks)
├── analyze-report.md        # speckit-analyze, with the follow-up after the fan-out
├── repair-report.md         # the repairs after the cross-feature review of 2026-09-30
├── followup-report.md       # what the follow-up of 2026-09-29 changed, and why
└── followup/                # the changes of the proof column, for the orchestrator
```

### Source Code (repository root)

```text
packages/oracle/                     # @specstride/oracle (dev layer, never shipped)
├── data/                            # the files of specs/141-parity-oracle/contracts, as data
├── reference/
│   └── pins.json                    # commit and tree hash per system
├── src/
│   ├── reference/                   # fetch, verify, read-only, check after a run
│   ├── env/                         # the empty environment and its allow-list; network guard
│   ├── run/                         # driver of one side; steps; pseudo-terminal; process list
│   ├── capture/                     # one module per surface S-01 to S-16
│   ├── normalize/                   # N-01 to N-08 one module per rule; hashes.ts, events.ts, text.ts, rest.ts for N-09 to N-29; counts per rule
│   ├── compare/                     # assertions, comparator, results, report
│   ├── waivers/                     # the waiver file and its matching
│   ├── register/                    # the register map and its check against the register
│   ├── catalogue/                   # families, scenarios, declaration check
│   ├── trace/                       # line tracing of the reference; exercise map; claim check
│   ├── suite2/                      # the second suite: allowlist, counters, subsets
│   ├── golden/                      # store and compare golden captures; capture job
│   └── release/                     # the release check
├── stubs/
│   ├── bin/                         # executables: the as-is command names and stub-harness
│   ├── lib/                         # script reader, counter, transcript writer
│   ├── critic-http/                 # the local server, two request shapes
│   └── sink/                        # the telemetry sink
├── fixtures/
│   ├── FX-01/ … FX-40/              # per scenario: fixture.json, workdir template, scripts
│   └── assets/                      # imported as-is files, with the licence notice
├── golden/                          # committed normalized captures of the reference
├── exercise-map/                    # the map, the supplement, the correction list
├── waivers.json
└── test/                            # CT-141-*: the oracle's own tests
tests/
├── parity/141/                      # PT-141-011SC008-*
└── release/141/                     # the release check and the macOS run
docs/ecosystem/
└── check-traceability.py            # the coverage script; this feature adds checks to it
.github/workflows/                   # jobs: hermetic, capture, reference, platform (macOS)
```

**Structure Decision**: one package of the npm workspace, `packages/oracle`, as
`specs/100-specstride/contracts/data/package-graph.json` names it (`@specstride/oracle`, layer
`dev`, owner 141, shipped never). Stubs, fixtures and golden captures live inside the package, so
that the product package cannot pick them up. Parity tests of other features live in
`tests/parity/<feature>/` and import the oracle. The coverage script stays in `docs/ecosystem/`,
where the prompt of the cross-feature review asks for it; the orchestrator owns that directory in
Stage B, so the change to the script is a task of implementation and not of this stage.

## Physical choices behind the specification

| Subject | Choice |
|---|---|
| Reference fetch | `git archive <full sha>` from a local clone named by a variable of the job, piped into `tar -x` in scratch; or a release archive with a pinned SHA-256. Verification: `git rev-parse <sha>^{tree}` against the pin, and a hash over the unpacked tree. Then `chmod -R a-w` |
| Empty environment | The child is spawned with an environment object built from the allow-list alone, which equals `env -i` |
| Tick variables | `SPECSTRIDE_WATCHDOG_TICK=1`, `SPECSTRIDE_YIELD_POLL=1` |
| Reference interpreter | `PYTHONDONTWRITEBYTECODE=1` |
| Line tracing, shell | `SHELLOPTS=xtrace`, `BASH_XTRACEFD`, and `BASH_ENV` to set `PS4` (R18 F-22) |
| Line tracing, Python | The `trace` module of the standard library, started through a `sitecustomize` file that the capture job writes into the scratch root of the run and that no package holds (CQ-186). `unverified` until run (R18 O-8 item 3) |
| Network guard | The two stub servers bind to `127.0.0.1` on a free port; on Linux the reference tier runs each side in a network namespace with loopback only (`unshare -n`), where the runner allows it; elsewhere the proxy variables point at a closed port and the stubs record any unexpected peer |
| Pseudo-terminal | `script(1)`; the size is data of the fixture (FX-40 names widths of 80, 60, 30 and under 40 columns), 80 by 24 where the fixture names none |
| Processes left behind | The process group of the driven command, listed after it ended; then ended by the oracle |
| Golden captures | One directory per scenario: `capture.json` (every surface in normalized form), `replacements.json` (counts per rule), `meta.json` (pins, versions of interpreter and shell, the operating system) |
| Build jobs | `hermetic` on every change (Linux and macOS); `capture` on a change of stubs, fixtures or pins (Linux, needs the clones); `reference` before a release (Linux, live differential and both suites); `platform` before a release (macOS) |

## What is planned elsewhere

| Subject | Where |
|---|---|
| The normalization tables, the layout tables, the alias and component tables, the maps | 100, as data of `@specstride/contracts` |
| The `parity` profile | 100 |
| The compatibility projection | 111 |
| Compatibility output | 119, 123 |
| The argument table of each harness adapter | 125, 130, 131, 134, 138 |
| Recorded streams for the conformance suites of harness adapters | 125, 130, 131, 134, 138 |
| The parity tests of every other feature | That feature, in `tests/parity/<feature>/` |
| The inventory, the traceability files, the register | The orchestrator, on the reports of this feature |

## Order of construction

From R18 O-12 and F141-FR-045.

| Step | Content | Needs |
|---|---|---|
| 1 | Reference fetch, empty environment, stubs, transcripts; FX-01, FX-02 and the dry run of FX-35, with the reference on both sides | Nothing of the product |
| 2 | N-01 to N-08 and the layout tables; the comparator; the first golden captures | The data of feature 100 |
| 3 | The exercise map; then the remaining families in the order of clusters not yet covered; the scenarios of dsh, Codex and prime; FX-38 to FX-40 | The inventory supplement |
| 4 | The port side of every family | The features that own the behaviour |
| 5 | The second suite | The micro-loop layer (115) |
| 6 | The release check and the macOS runner | Everything above |

## Complexity Tracking

Every check of the Constitution Check passes. Nothing to justify.
