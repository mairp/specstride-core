# Implementation Plan: Prime harness adapter (feature 138)

**Branch**: `138-adapter-prime` (a label; the directory is `specs/138-adapter-prime`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/138-adapter-prime/spec.md`

## Summary

Feature 138 builds the tested harness adapter for prime: a harness descriptor of kind `cli`, a small
set of code hooks, recorded fixtures, and the JSONL reader for stream schema version 3 with the
dialect table that pi shares. It carries the 62 as-is behaviour items of prime (35 ported, 27
translated), all parity items, and adds what the owner's rulings ask: the terminal record decides,
containment ceiling C0 with an opt-in, unknown terms, telemetry off, a critic in JSON mode outside
the `parity` profile, and, since the repair of 2026-09-30, auto-loaded context and native memory off
by default, the home per auth tier, and the identity for the critic-diversity test.

| Deliverable | What it is | Requirements |
|---|---|---|
| Descriptor and registry entry | The `prime` descriptor, qualifier form, roles, ceiling, tier and terms row | F138-FR-001, F138-FR-004, F138-FR-015 |
| Detection, names, doctor | Version of the agent executable, pin, names of the executable and launcher, checks | F138-FR-002, F138-FR-003, F138-FR-006, F138-FR-007 |
| Auth and environment | Provider key by environment, allow-list | F138-FR-005 |
| Proposer call | Argument table, modes, qualifier, 127, announcements, continuation, allow-list | F138-FR-008 to F138-FR-014, F138-FR-016 |
| Critic call | Text mode under `parity`, JSON mode outside, announcement, proof, window | F138-FR-017 to F138-FR-022 |
| Reader and dialect table | One reader, the row `prime`, schema gate, records, errors, terminal, usage, lines | F138-FR-023 to F138-FR-037 |
| Terminal, quota, usage, telemetry | Outcome rule, classifier entries, increments, switches | F138-FR-038 to F138-FR-041 |
| Captures and tests | Five captures, conformance suite, replay suite with the dialect `pi` | F138-FR-042, F138-FR-043 |
| Context, home, memory | The four switches for the proposer, the throwaway home at auth tier 2, native memory recorded per run | F138-FR-044, F138-FR-045, F138-FR-046 |
| Critic diversity | Never picked automatically, the identity for the diversity test, the warning | F138-FR-047 |

Approach: R9 option B. One JSONL reader for the family with a dialect table, and the prime adapter
as a descriptor plus hooks over the generic harness adapter of feature 109. The reader is a port of
the baseline's reader, record by record, because 41 of the 62 items describe it. The reader
registers in the registry of stream readers of feature 126 under the format `jsonl`, selected by the
dialect name. Lisa's older package for this harness is not taken (R1).

## Technical Context

**Language/Version**: TypeScript 5.x, `strict`, ECMAScript modules, on Node.js 22 or later. The Language Ledger stays empty

**Primary Dependencies**: `@specstride/contracts` (descriptor schema, stream-dialect schema, closed sets, the `parity` profile, the alias and component tables), `@specstride/kernel` (atomic write, table evaluator, redactor), `@specstride/harness` (the port, the generic harness adapter, the registry of readers). The JSON Schema validator that feature 100 chose. No provider SDK, no native module

**Storage**: files only, by logical name (feature 100, annex B §B.5): `attempt:<N>:<k>:<n>:session` (session state, removed when the phase attempt ends), `pass:<passId>:stream`, `pass:<passId>:provider-terminal`, `pass:<passId>:invocation` and `attempt:<N>:<k>:<n>:critic-invocation` (written by the engine and the stream adapter, the writers named in §B.5). The adapter is not a writer of any of them, apart from the session location, which the harness writes. Recorded fixtures are files of the test tree

**Testing**: the test runner that Node ships. Parity tests live in `tests/parity/138/` and characterization tests in `tests/characterization/138/`, at the root of the repository, as the plan of feature 100 rules; the run of the conformance suite and the replay suite of the reader stay in the package. A fake binary named after the as-is command (feature 141 stub `prime`), recorded streams, the parity oracle (FX-01, FX-06, FX-07, FX-18, FX-26). No test calls a model or a paid service

**Target Platform**: Linux and macOS. Every macOS statement is `unverified` until a macOS runner has passed the oracle (ruling 67): the process group, the session directory, the search path, the home variable. Task T072 records the macOS result, or a skip with its reason

**Project Type**: one package of the npm workspace, `@specstride/adapter-prime` (layer L1). The pi adapter (`@specstride/adapter-pi`, feature 134) imports the reader from it, as the package graph already allows; the graph needs no change. A dialect row of another package is registered with the reader by that package: the reader exports the function that adds a row to the dialect table, the pi adapter keeps its row as data of its own package and hands it to that function when it loads, and the table validates the row against the schema of feature 100 and refuses a second row of the same name. `@specstride/adapter-prime` imports nothing of the pi adapter. Interfaces and schemas are in `@specstride/contracts`

**Performance Goals**: starting values with low confidence, measured in the build. Reader throughput: 10,000 records per second on one core. The overhead of the adapter on the start of a pass: under 20 ms. The doctor checks: each under 2 s

**Constraints**: no native module; no paid call in tests; plain `npm install`; MIT-compatible dependencies; no name, path, model, launcher or gateway of the owner's machines in any file; the prompt never in an argument list; secrets never in an argument list

**Scale/Scope**: 47 functional requirements, 11 success criteria (above the split threshold of about 45 since the repair of 2026-09-30; no split is made, the count is reported); 62 kept behaviour items in 13 clusters carried, none not carried; 4 extension points implemented or content-owned and 3 consumed, plus the redactor; 1 closed set of annex X §X.6 owned (row 39), 6 introduced; 14 rows of the `parity` profile cited; 5 fixture families cited; 5 captures to be made before the freeze

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v3.0.1. Brief 138 names Principles VII, VIII, IX, X, XI, XII, V and XVIII as binding;
all twenty are answered.

*Constitution v3.0.1 (2026-09-30) differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182); the row of Principle IX was re-read against that sentence at the analyze run of 2026-09-30.*

**The gate and the loop (I–V)**

- [x] I. ✅ The adapter keeps no state between calls beyond the descriptor. Session state is a file at a logical name and is removed with the phase attempt (F138-FR-014). Nothing watches
- [x] II. ✅ The adapter produces no verdict. A failed critic call is reported and the phase gate scores it (F138-FR-017). The critic is a fresh session that never resumes (F138-FR-021)
- [x] III. ✅ The critic gets no tool. A tool record in a critic stream halts the run (F138-FR-021). The reader treats tool output as data and never as a record (F138-FR-023). The descriptor is data; argument lists are lists
- [x] IV. N/A The adapter reads no spec grammar
- [x] V. ✅ Announcements, the projection of events and the doctor checks are best-effort. The one thing that is not observability is the outcome rule of F138-FR-038, which is control and not telemetry
- [x] VI. ✅ Strict TypeScript; the descriptor and the dialect row are validated against the schemas of feature 100; the core imports only the port; no provider SDK; extension points named with versions in `spec.md`
- [x] VII. ✅ The adapter is an entry of the one registry and tests no harness name in shared control flow. The reader is family code with a dialect table, so a third harness is a row (F138-FR-023). It is unverified nowhere: it is a tested harness adapter with a pin
- [x] VIII. ✅ Passed since the analyze run of 2026-09-30, by the fail-closed rule of F138-FR-045. Met by the specification: prompt on standard input (F138-FR-008); no permission prompt exists to wait for; a missing credential fails the launch before the first pass (F138-FR-005); auto-loaded context off for the critic always and for the proposer by default, by the four switches of the harness (F138-FR-017, F138-FR-020, F138-FR-044); native memory off and recorded per run (F138-FR-046); a fresh session per attempt (F138-FR-014); containment: prime has none, so C0 needs the consumer's opt-in in user configuration and is announced (F138-FR-015). The throwaway home of auth tier 2 (F138-FR-045): the harness offers no switch for its configuration directory, so the home is redirected by the home variable, and whether the agent executable follows it is `unverified` until capture (5). Until then, and for good if the capture fails, auth tier 2 on prime is refused before a process starts, so no pass ever runs at auth tier 2 without a throwaway home (question CQ-234; Complexity Tracking)
- [x] IX. ⚠ Passes outside the `parity` profile; deviation under `parity` inherited from feature 100. Tool-less critic by flags, proof in the call record, `critic_not_toolless` on any tool record (F138-FR-021); in JSON mode the proof is the empty tool list and the session id of the initial record (F100-FR-230, case 2), and an initial record without them is a missing proof; under `parity` no proof is made, as at the baseline (F100-FR-230), the deviation that feature 100 records for every harness (Complexity Tracking); a known window and no default outside `parity` (F138-FR-022); an authentication failure is named (F138-FR-032, F138-FR-039)
- [x] X. ✅ Pin `>=0.7.3 <0.8` with `verified-on` 2026-09-29; the version is recorded per pass; the doctor warns outside the range (F138-FR-002)
- [x] XI. ✅ One reader behind the seam; the projection is byte-identical on the oracle fixtures (F138-FR-037); `stream.missing_terminal` (F138-FR-038); unknowns are `null` (F138-FR-040); text and tool summaries pass the redactor
- [x] XII. ✅ Fake binary and recorded streams only; the five captures and two live probes are authorized outside this feature and logged (F138-FR-042); the terms gate is respected under every audience, and prime is never a default and never picked automatically (F138-FR-004, F138-FR-047); the key is a secret reference (F138-FR-005); no model id in code

**The host skill (XIII–XVII, XX)**

- [x] XIII. N/A The adapter records facts of a stream and judges nothing
- [x] XIV. N/A The adapter declares no verification command
- [x] XV. ✅ A launch that names prime states "unknown terms" and needs the C0 opt-in; nothing bypasses the terms gate or a launch check
- [x] XVI. ✅ The quota entries hand a class to the classifier and never pause or relaunch (F138-FR-039); the adapter spends no counter
- [x] XVII. ✅ A test whose prerequisite is missing (the reference tree, the oracle, a macOS runner, a capture) reports a skip with its reason and never a pass; task T072 runs the tests on the macOS runner and records the result or the skip; a capture that cannot be made leaves the fact `unverified` (F138-FR-042)
- [x] XX. N/A The adapter runs nothing in parallel. Parallel units stay off on it unless `loop.parallel.allow_detect` is set (F138-FR-015)

**The rewrite (XVIII–XIX)**

- [x] XVIII. ✅ Every carried item cites its origin, disposition and proving test; divergences DV-007, DV-010, DV-027, DV-030, DV-031, DV-048, DV-064, DV-066, DV-081, DV-090 are named; DV-001, DV-002, DV-004, DV-005, DV-034, DV-047, DV-049, DV-065 and DV-112 (telemetry switches) as well; the 14 rows 10, 25, 26, 28, 29, 30, 34, 35, 36, 39, 79, 86, 92, 131 of the `parity` profile set the as-is behaviour
- [x] XIX. N/A The adapter prints to a host only through doctor findings of at most 200 bytes and the as-is display lines under `parity`

**Re-check after Phase 1 design**: unchanged, except row VIII. "Contained by default" is met by
the rule that a harness whose ceiling is C0 runs only on the consumer's opt-in (F100-FR-111), which
is the owner's ruling 34.

**Re-check after the cross-feature review (2026-09-30)**: row VIII was marked as passed although the
proposer call switched no auto-loaded context off and handed the real home to the process at auth
tier 2 (review item W-138-01). F138-FR-044 to F138-FR-046 repair the text. Row VIII stays open for one
point, the throwaway home, which rests on a fact that no capture has shown. The analyze run of 2026-09-30 closed it: F138-FR-045 refuses auth tier 2 on prime until capture (5)
has shown that fact.

## Project Structure

### Documentation (this feature)

```text
specs/138-adapter-prime/
├── spec.md
├── plan.md                  # this file
├── research.md              # Phase 0
├── data-model.md            # Phase 1
├── quickstart.md            # Phase 1
├── contracts/               # Phase 1
│   ├── README.md
│   ├── argument-table.json  # exact flags and variables at the pin, per role and mode
│   ├── dialect-row-prime.json
│   ├── descriptor-prime.json
│   ├── reader-records.json  # record type -> normalized record, event, display line
│   ├── diagnostics.json     # codes, severities, messages, extras
│   ├── classifier-entries.json
│   ├── parity-rows.json
│   ├── capture-plan.json
│   └── traceability.json
├── checklists/requirements.md
├── tasks.md                 # speckit-tasks
└── analyze-report.md        # speckit-analyze
```

### Source Code (repository root)

```text
packages/adapter-prime/                # @specstride/adapter-prime (L1; owner 138)
├── data/
│   ├── descriptor.prime.json          # the harness descriptor, as data
│   └── dialects/prime.json            # the row `prime` of the dialect table
├── src/
│   ├── descriptor/                    # loads the descriptor, states capabilities with provenance
│   ├── detect/                        # presence and version of the agent executable
│   ├── proposer/                      # argument table -> argument list; modes; qualifier; 127; continuation
│   ├── critic/                        # text mode and JSON mode; proof; window
│   ├── environment/                   # allow-list, telemetry switches, the home per auth tier
│   ├── classifier/                    # entries for EP-12
│   ├── doctor/                        # the checks
│   └── reader/                        # the JSONL reader; exported for the pi adapter
│       ├── reader.ts                  # state machine per stream
│       ├── dialect.ts                 # the dialect table and its validation
│       ├── records.ts                 # the six normalized records
│       ├── summarize.ts               # tool arguments, targets, evidence detection
│       ├── usage.ts                   # names, sums, maximum, increments
│       └── display.ts                 # the display lines
└── tests/
    ├── conformance/                   # the run of the suite of feature 109 with a fake binary
    ├── reader/                        # replay suite; recorded streams with expected records
    └── fixtures/streams/              # the ten as-is streams, the captures, the streams of the dialect pi

tests/parity/138/                      # PT-138-*, at the root of the repository
tests/characterization/138/            # CT-138-*, at the root of the repository
```

**Structure Decision**: the reader sits in the package of the prime adapter and the pi adapter
imports it. The package graph of feature 100 allows it (`adapter-pi` may import `adapter-prime`) and
says that feature 138 decides. The alternative, a home in `@specstride/harness`, would put
family code in the seam, which the seam must not hold. The reader imports nothing of prime: it takes
a dialect row, so it can move without a change of behaviour.

## Argument table

Data of the adapter (`contracts/argument-table.json`). Facts about the pinned version: verified on
2026-09-29 from the installed help of `prime-agent` 0.7.3 (R9 F3, F8, F10, F17); nothing was run
end to end, so flags marked "unverified" wait for the captures of F138-FR-042.

| Role and case | Under `parity` (as at the baseline) | Outside `parity` |
|---|---|---|
| Proposer, bare | `<agent> -p --mode <text\|json> --no-session --cwd <workdir> [--model <M>]`, prompt on standard input | The same, with `--no-skills --no-extensions --no-context-files --no-prompt-templates` unless `harnesses.prime.proposerCustomisations` is on (the flags exist in the help of 0.7.3; their effect is unverified), and with `--tools <allow-list>` (unverified); a pass that continues: `--session-dir <attempt session directory> -r <session id>` instead of `--no-session` (unverified) |
| Proposer, variant | `<launcher> <variant> -p --mode <text\|json> --no-session --cwd <workdir>`, prompt on standard input | The same additions |
| Critic, bare | `<agent> -p --mode text --no-session --no-tools --no-skills --no-context-files [--cwd <workdir>]`, prompt on standard input | `--mode json`, and `--no-extensions --no-prompt-templates` added (in the help of 0.7.3); no key removes a switch |
| Critic, variant | `<launcher> <variant>` followed by the same flags | The same additions |
| Version | `<agent> -v` | The same |
| Environment | The allow-list of F138-FR-005, and the telemetry switches | The same |
| Home | The home of the oracle's hermetic environment; overlay scope `none` | Auth tier 1: the real home, never written. Auth tier 2: a throwaway home; the overlay redirects `HOME` and `PRIME_AGENT_SESSION_DIR`, seeds no credential, and is removed after the call (unverified) |
| Never seeded | `--goal` | `--goal` |

Variables: telemetry `PRIME_AGENT_TELEMETRY=0` and `DO_NOT_TRACK=1` (verified-local, R9 F17); sessions
directory `PRIME_AGENT_SESSION_DIR` and the flag `--session-dir`. The harness has no variable for its
configuration directory (R9 F16). The name of the mode flag and its
values are those of the baseline. Never passed: a flag that allows all tools.

## Phases of work

| Phase | Content | Depends on |
|---|---|---|
| 0 | Captures (1) to (5), authorized and logged; each becomes a fixture. The specification freezes after them | The owner's authorization of the probes |
| 1 | Reader: state machine, schema gate, malformed input, session and model, text | Phase 0 (1) for the record set; the ten as-is streams do not wait |
| 2 | Reader: tools, evidence, errors, terminal, retry, usage, display lines, normalized records | Phase 1 |
| 3 | Descriptor, detection, names, environment, tier and terms row | The descriptor schema of feature 100 |
| 4 | Proposer and critic calls, announcements, qualifier, 127, containment refusal | Phase 3 |
| 5 | Terminal rule, classifier entries, increments, telemetry switches | Phases 2 and 4; capture (2) |
| 6 | Doctor checks, continuation, allow-list, critic in JSON mode and its proof | Phases 4 and 5; captures (3), (4) |
| 6a | The four switches of the proposer, the home per auth tier, native memory and its record, the identity for the diversity test | Phases 3 and 4; capture (5) opens auth tier 2 (until then it is refused) |
| 7 | Conformance suite, replay suite with the dialect `pi`, parity tests | All |

## Complexity Tracking

One stated deviation, under the `parity` profile only, inherited from feature 100 (second row). The first row records the one that the review found; the analyze run of 2026-09-30 closed it by the fail-closed rule of F138-FR-045.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Principle VIII, the throwaway home at auth tier 2 (F138-FR-045): the harness offers no switch for its configuration directory, so the home is made by redirecting the home variable, and no capture has shown that the agent executable follows it. For the four kinds of auto-loaded context the harness offers a switch each, so there is no deviation there | Prime is a Wave 1 harness by ruling 32, and auth tier 2 is its usual tier | Handing the real home to the process at auth tier 2 is what the review found and contradicts ruling 36. Refusing auth tier 2 for prime until the capture has passed is the fallback of question CQ-234, and F138-FR-045 now states it: auth tier 2 on prime opens when capture (5) has passed |
| Principle IX, under the `parity` profile only: no proof of the critic's form is made or checked (F138-FR-021), as F100-FR-230 and rows 28 and 117 of annex X §X.7 rule for every harness; the plan of feature 100 records the deviation | The baseline makes no proof, and the stub of feature 141 carries no pinned version, so a preflight would fail every parity fixture | Recording the weaker proof under `parity` contradicts F100-FR-230 and adds a record that the baseline does not write. Outside `parity` the full proof of F138-FR-021 holds |
