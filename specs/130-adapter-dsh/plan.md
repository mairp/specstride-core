# Implementation Plan: dsh harness adapter (feature 130)

**Branch**: `130-adapter-dsh` (a label; the directory is `specs/130-adapter-dsh`) | **Date**: 2026-09-29, repaired 2026-09-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/130-adapter-dsh/spec.md`

## Summary

Feature 130 builds the tested harness adapter for dsh: a harness descriptor of kind `cli` with a
text stream, and three code hooks. The hooks build the throwaway settings overlay, write and
check the critic's patch file, and run the plugin request protocol. It carries the 66 as-is
behaviour items of dsh (28 ported, 38 translated), all parity items, and adds what the owner's
rulings ask: an exact version pin, a critic that is refused when a tool id is not covered, no
session continuation, a permission mode that is always stated, containment ceiling C1 declared
`unverified`, unknown terms, no usage, and the harness's own telemetry switched off. After the
cross-feature review it also states what the adapter cannot do: it cannot switch the
customisations of the profile or a native memory off, so it reports, warns and records, and it
refuses the critic role unless native memory is shown to be off or absent.

| Deliverable | What it is | Requirements |
|---|---|---|
| Descriptor and registry entry | The `dsh` descriptor, qualifier form, roles, ceiling, tier and terms row | F130-FR-001, F130-FR-003, F130-FR-004 |
| Detection, pin, doctor | Version, exact pin, checks, dated facts | F130-FR-002, F130-FR-005, F130-FR-006 |
| Proposer call | Argument list, settings, 127, permission mode, prompt bound, model resolution, table of bare ids | F130-FR-007 to F130-FR-013 |
| Overlay and home | Throwaway home, real home never written, no continuation, approval, containment, `iter_done`, block order | F130-FR-014 to F130-FR-020 |
| Critic call | Invocation, settings, patch, coverage check, proof, errors, arguments, model, window, never auto-picked | F130-FR-021 to F130-FR-030 |
| Plugin request protocol | Processor, validation, artifacts, consent, prompt section, ends, coverage again | F130-FR-031 to F130-FR-037 |
| Signals, usage, telemetry, environment | Classifier entries, usage `none`, telemetry off, allow-list | F130-FR-038 to F130-FR-041 |
| Customisations and native memory | The record per run, the null switches, the doctor warnings, the refusal of the critic role | F130-FR-043 to F130-FR-045 |
| Captures and tests | Six captures, conformance suite, replay suite, parity tests | F130-FR-042 |

Approach: R9 option B, as decided. The dsh adapter is a text adapter over the generic harness
adapter of the harness seam: data for what data can say, and small code hooks for the rest. It writes
no reader: the text reader and the synthesis of `init` and `terminal` belong to feature 126, and
this feature supplies the dsh mapping and its recorded fixtures. The plugin request processor is
a port of `dsh_plugin_requests.py` at `9cab15d`, function by function, because 11 items describe
it and parity binds.

## Technical Context

**Language/Version**: TypeScript 5.x, `strict`, ECMAScript modules, on Node.js 22 or later. The Language Ledger stays empty

**Primary Dependencies**: `@specstride/contracts` (descriptor schema, closed sets, the `parity` profile, the alias and component tables), `@specstride/kernel` (atomic write, table evaluator, redactor), `@specstride/harness` (the port, the generic harness adapter, the overlay tool, the registry of readers). The JSON Schema validator that feature 100 chose. No provider SDK, no native module, no YAML library: the settings file of the harness is carried over line by line, as the baseline does, and the new block is written as text

**Storage**: files only, by logical name (feature 100, annex B §B.5): `harness:dsh:plugin-request` (workspace part; the proposer writes it, the adapter reads it as a claim), `harness:dsh:plugin-installs` (control plane; archived requests and receipts), `harness:dsh:install-lock` (harness home), `overlay:dsh:tree` (temporary directory), `pass:<passId>:critic-patch` (temporary directory of the call), `harness-home` (read). The adapter is a writer of the archive, the receipt, the overlay and the patch file only

**Testing**: the test runner that Node ships. A fake binary named after the as-is command (feature 141 stub `dsh`), a stub plugin installer (stub `I`), recorded stdout and stderr replayed through the text reader, the adapter conformance suite of feature 109, the parity oracle (FX-01, FX-06, FX-07, FX-16 to FX-20, FX-22, FX-24, FX-25, FX-26, FX-38, FX-39). No test calls a model or a paid service

**Target Platform**: Linux and macOS. Every macOS statement is `unverified` until a macOS runner has passed the oracle (ruling 67): the process group, links in the temporary directory, the exclusive lock

**Project Type**: one package of the npm workspace, `@specstride/adapter-dsh` (layer L1), which may import `contracts`, `kernel` and `harness` only, as the package graph says. Interfaces and schemas are in `@specstride/contracts`

**Performance Goals**: starting values with low confidence, measured in the build. Overhead of the adapter on the start of a pass without overlay: under 20 ms. Building an overlay of 50 entries: under 50 ms. The coverage check: bounded by the time limit of the introspection call, 10 s. The doctor checks: each under 2 s

**Constraints**: no native module; no paid call in tests; plain `npm install`; MIT-compatible dependencies; no name, path, model, launcher or gateway of the owner's machines in any file; a secret never in an argument list; the real home of the harness never written except by the installs the consumer listed

**Scale/Scope**: 45 functional requirements, 9 success criteria; 66 kept behaviour items in 14 clusters carried, none not carried; 6 extension points implemented or consumed with versions (EP-02, EP-10, EP-11, EP-12, EP-14, EP-15); closed sets 215, 216, 217, 275 and 276 of annex X §X.6 owned, the last two introduced by the repair; 17 rows of the `parity` profile given a value, rows 117 and 118 owned; 14 fixture families cited; 6 captures to be made before the freeze

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v3.0.0. Brief 130 names Principles VII, VIII, IX, X, XI, XII and XVIII as binding;
all twenty are answered.

*Constitution v3.0.1 (2026-09-30) differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182); the row of Principle IX below already records it.*

**The gate and the loop (I–V)**

- [x] I. ✅ The adapter keeps no state between calls beyond the descriptor. Request, archive and receipts are files at logical names, written atomically; nothing watches. The lock serialises installs and is not control flow of a run (F130-FR-031)
- [x] II. ✅ The adapter produces no verdict. A failed critic call is reported and the phase gate scores it (F130-FR-026). The critic is a fresh session every time (F130-FR-016)
- [x] III. ✅ The critic gets no tool: a patch, a coverage check and an empty working directory outside the profile (F130-FR-021, F130-FR-023, F130-FR-024). The request of the proposer is read as a claim and never evaluated (F130-FR-032). Argument lists are lists, never shell text
- [x] IV. N/A The adapter reads no spec grammar
- [x] V. ✅ Announcements, events and the doctor checks are best-effort. What is control is the outcome of `betweenPasses` (7 or 4) and the refusal of the critic role, and those are not telemetry
**The product and its edges (VI–XII)**

- [x] VI. ✅ Strict TypeScript; descriptor and receipt validated against schemas at the boundary; the core imports only the port; no provider SDK; extension points named with versions in `spec.md`
- [x] VII. ✅ An entry of the one registry, with no harness-name test in shared control flow: the two places of the baseline that compare with the bare name become the capability `pluginRequests` (F130-FR-035). Tested adapter with a pin
- [ ] VIII. ⚠ Deviation, recorded in Complexity Tracking. What passes: never waits for a human (standard input closed, watchdogs, `agent_failure`, F130-FR-017); the real home is never written by a pass (F130-FR-015); fresh session per pass (F130-FR-016); contained by default (the mode `workspace-write`, ceiling C1 `unverified`, `protection=detect`, F130-FR-010, F130-FR-018; the opt-in to C0 from user configuration only); the prompt travels as arguments because the harness takes no standard input, and the bounded-argument rule of the principle applies and is met (F130-FR-011), so that point is no violation. The deviation: the principle says that plugins, hooks, skills, MCP servers and harness-native memory are not loaded into a pass unless the consumer opts in. The adapter has no switch for any of them, and the throwaway home links every entry of the real home (F130-FR-014). The adapter reports each switch as null, the doctor warns, the state is recorded per run, and the harness is a proposer only where the consumer names it (F130-FR-003, F130-FR-043, F130-FR-044). The owner closed CQ-189 on 2026-09-30 on this reading
- [ ] IX. ⚠ Deviation, recorded in Complexity Tracking. What passes: tool-less critic by patch plus coverage check plus the read-only mode; `critic_not_toolless` on a gap (F130-FR-024); a known window and no default outside `parity` (F130-FR-029); an authentication failure is named (F130-FR-038); the critic role is refused unless native memory is shown to be off or absent (F130-FR-045). The deviation: the principle asks that the adapter verifies from the harness's own initial record that the tool list is empty and the session is the one it minted. A text stream has no initial record, so the proof is the weaker one of annex C §C.3 and of the third way of F100-FR-230, recorded as such for every call (F130-FR-025). The critic prompt also travels as arguments, not on standard input as the principle's route names, because the harness takes no standard input: it is split at spaces within 120 KiB per chunk (F130-FR-027) and bounded by the known window (F130-FR-029); this is part of the recorded deviation. The owner closed CQ-182 on 2026-09-30 and v3.0.1 names the weaker proof; the row stays unticked until the first implementation slice removes it, as the Sync Impact Report of v3.0.1 says
- [x] X. ✅ Exact pin `0.1.0-rc.8` with `verified-on` 2026-09-29; the version is recorded per pass; the doctor warns for the proposer and fails for the critic on any other version (F130-FR-002)
- [x] XI. ✅ A text stream goes through the seam with synthesized `init` and `terminal`; usage is `null` with a reason, never invented (F130-FR-039); the three plugin events are rows of the projection (F130-FR-036)
- [x] XII. ✅ Fake binary, stub installer and recorded streams only; the six captures are authorized outside this feature and logged (F130-FR-042); the terms gate is respected, and the harness is never a default and never picked automatically under any audience (F130-FR-004, F130-FR-030); no secret is handled; model ids are configuration (F130-FR-013)

**The host skill (XIII–XVII, XX)**

- [x] XIII. N/A The adapter records facts and judges nothing
- [x] XIV. N/A The adapter declares no verification command
- [x] XV. ✅ A launch that names dsh states "unknown terms"; nothing bypasses the terms gate; the allowlist of plugins is the consent to the one write (F130-FR-034)
- [x] XVI. ✅ The classifier entries hand a class to the classifier and never pause or relaunch; the adapter spends no counter (F130-FR-038)
- [x] XVII. ✅ A capture that cannot be made is a skip with its reason and leaves the fact `unverified` (F130-FR-042)
- [x] XX. N/A The adapter runs nothing in parallel. Parallel units stay off on it unless `loop.parallel.allow_detect` is set in user configuration (F130-FR-018)

**The rewrite (XVIII–XIX)**

- [x] XVIII. ✅ Every carried item cites its origin, disposition and proving test; divergences DV-002, DV-005, DV-006, DV-007, DV-010, DV-020, DV-027, DV-030, DV-031, DV-048, DV-049, DV-064, DV-066, DV-081, DV-083, DV-091 and the four rows written for this feature, DV-108 to DV-111, are named and exist in the register (113 rows); rows 117 and 118 of the `parity` profile are those of this feature; under the profile no flag about memory or customisations is passed, no check of them is made and no new line is printed; the profile makes continuation off, and the layer is off
- [x] XIX. N/A The adapter prints to a host only through doctor findings of at most 200 bytes and the as-is lines under `parity`

Rows VIII and IX are deviations from the text of a NON-NEGOTIABLE principle and are recorded in
Complexity Tracking, each with its queued question. Every other check passes.

**Re-check after Phase 1 design** (2026-09-30, after the cross-feature review): rows VIII and IX
do not pass against the text and are not marked as passed. The prompt as an argument is no
violation: the principle itself gives the rule for an adapter that can only take the prompt as an
argument, and F130-FR-011 meets it.

## Project Structure

### Documentation (this feature)

```text
specs/130-adapter-dsh/
├── spec.md
├── plan.md                    # this file
├── research.md                # Phase 0
├── data-model.md              # Phase 1
├── quickstart.md              # Phase 1
├── contracts/                 # Phase 1
│   ├── README.md
│   ├── argument-table.json    # exact flags and variables at the pin, per role
│   ├── descriptor-dsh.json
│   ├── critic-patch.json      # the 18 tool ids and the groups
│   ├── classifier-entries.json
│   ├── plugin-request.schema.json
│   ├── plugin-receipt.schema.json
│   ├── parity-rows.json
│   ├── capture-plan.json
│   └── traceability.json
├── checklists/requirements.md
├── tasks.md                   # speckit-tasks
└── analyze-report.md          # speckit-analyze
```

### Source Code (repository root)

```text
packages/adapter-dsh/                  # @specstride/adapter-dsh (L1; owner 130)
├── data/
│   ├── descriptor.dsh.json            # the harness descriptor, as data
│   └── critic-patch.dsh.json          # the tool ids of the deny list, dated and pinned
├── src/
│   ├── descriptor/                    # loads the descriptor, states capabilities with provenance
│   ├── detect/                        # presence, version, pin, home
│   ├── proposer/                      # argument table -> argument list; prompt bound and split; 127; permission mode
│   ├── model/                         # reference rules, precedence, table of bare ids, conflict and invalid errors
│   ├── overlay/                       # throwaway home: links, new settings block, removal
│   ├── critic/                        # invocation, patch file, chunks, errors, window
│   ├── coverage/                      # enumerate tool ids, compare with the patch, proof record
│   ├── customisations/                # kinds and states, the record per run and per call, the refusal of the critic role
│   ├── plugins/
│   │   ├── request.ts                 # read as a claim, validate
│   │   ├── install.ts                 # lock, argument list, time limit, receipt, archive
│   │   ├── between-passes.ts          # results 7 and 4, events, lines
│   │   ├── consent.ts                 # the consent record; the allowlist from user configuration only (CQ-233)
│   │   └── prompt-block.ts            # the section of the protocol (EP-15)
│   ├── environment/                   # allow-list, telemetry mode, trace parent
│   ├── classifier/                    # entries for EP-12
│   └── doctor/                        # the checks
└── test/                              # CT-130-*
packages/testkit/src/conformance/EP-02/     # the suite of the harness port (feature 100, plan); this feature adds its fake binary script
tests/
├── parity/130/                        # PT-130-*
├── conformance/adapter-dsh/           # conformance suite, classifier fixtures, replay of recorded streams
└── fixtures/adapter-dsh/              # the six captures, when they exist; the stub installer scenarios
```

**Structure Decision**: the package `@specstride/adapter-dsh` of
`specs/100-specstride/contracts/data/package-graph.json`, layer L1. It imports the port and the
overlay tool of `@specstride/harness` and imports nothing from another adapter. The descriptor is
data; code exists only where the spec names a hook. Nothing else of the product names the
harness.

## Argument table

The exact flags and variables of the harness at the pin belong here and not in the spec. They
are in `contracts/argument-table.json`. In short, at `0.1.0-rc.8`, `verified-on` 2026-09-29 for
what the baseline passes and what the installed help shows:

| Use | Argument list or variable | Status |
|---|---|---|
| Version | `<bin> --version` | verified-on 2026-09-29 |
| Proposer, parity and default | `<bin> --profile <profile> <prompt>`; chunks above 120 KiB outside `parity` | Baseline verified; chunking `unverified` (capture 4) |
| Critic | `<bin> --profile <profile> --patch <file> -- <chunks...>` | Baseline verified |
| Plugin install | `<bin> plugin --profile <profile> add --save-exact <plugins...>` | Baseline verified |
| Home | `DSH_HOME` (default `$HOME/.dsh`) | verified-on 2026-09-29 |
| Permission mode | `DSH_PERMISSION_MODE`: `read-only`, `workspace-write`, `danger-full-access` | verified-on 2026-09-29 (read from the composed configuration of the installed package); enforcement `unverified` (capture 2) |
| Telemetry mode | `DSH_TELEMETRY_MODE` set to its off value | Name from R9 F16; value and effect `unverified` (capture 5) |
| Trace parent | the standard `TRACEPARENT` variable | Read by the trace plugin (R14 C6); effect `unverified` (capture 5) |
| Tool-id introspection, and the list of what the profile loads | to be named after captures 3 and 6. The launcher has the flags `--dump-config` ("print the composed profile tree and exit") and `--dump-default-config` | The two flags: verified-on 2026-09-30, from `--help` of the installed command. What they print, and whether it lists tool ids and customisations: `unverified` |
| Switch for customisations and for native memory | none known | `unverified` (capture 6) |
| Patch | 18 tool ids, listed in `contracts/critic-patch.json` | verified-on 2026-09-29 as the baseline's list; coverage of the pinned version `unverified` (capture 3) |

## Phases of work

| Phase | Work | Requirements |
|---|---|---|
| 0 | The six captures as scripted probes, logged; the first tasks of the feature. A capture that needs a paid call says so | F130-FR-042 |
| 1 | Descriptor, data files, registry entry, capabilities with provenance, terms row | F130-FR-001, F130-FR-003, F130-FR-004, F130-FR-006 |
| 2 | Detection, pin, doctor checks | F130-FR-002, F130-FR-005 |
| 3 | Proposer: argument table, settings, model rules, table of bare ids, prompt bound, permission mode | F130-FR-007 to F130-FR-013 |
| 4 | Overlay, real home untouched, no continuation, approval and containment statements, the two general variants | F130-FR-014 to F130-FR-020 |
| 5 | Critic: invocation, patch, coverage, proof, errors, chunks, model, window | F130-FR-021 to F130-FR-030 |
| 6 | Plugin protocol: processor, validation, lock, receipt, consent, prompt block, ends, events | F130-FR-031 to F130-FR-037 |
| 7 | Classifier entries, usage, telemetry, environment | F130-FR-038 to F130-FR-041 |
| 7a | Customisations and native memory: kinds, states, the record, the launch line, the refusal of the critic role | F130-FR-043 to F130-FR-045 |
| 8 | Parity tests, conformance and replay suites, characterization tests, own tests | all |

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Principle VIII (NON-NEGOTIABLE), "auto-loaded context is off by default", with ruling 36 and F100-FR-113: a pass on dsh loads the plugins, host hooks, skills, tool servers and any native memory of the profile (F130-FR-014, F130-FR-043, F130-FR-044) | The harness composes its profile from its home, and no switch is known at the pin that takes a customisation out of a proposer pass. Parity binds the argument list and the throwaway home that links every entry. The adapter therefore reports each switch as null in `capabilities`, the doctor warns, the state is recorded per run and per call, and the harness is a proposer only where the consumer names it (ruling P14) | Refusing dsh as proposer outside the `parity` profile until a switch exists: it would remove the as-is default proposer that Wave 1 carries (rulings 32, 32b). Building a throwaway home without the customisations: the login and the profile live in the same home, and which entries are customisations is not established (capture 6). The owner closed CQ-189 on 2026-09-30 on this reading; the row stays while no switch is shown. This is no second exception to ruling 36: ruling P15 stays the only one |
| Principle IX (NON-NEGOTIABLE), "verified from the harness's own initial record": a text stream has no initial record (F130-FR-025); and the route names the prompt on standard input, while the critic prompt of dsh travels as arguments (F130-FR-027) | The harness prints only the final text and takes no standard input; the argument chunks are bounded by 120 KiB each and by the known window (F130-FR-029). Feature 100 admits the weaker proof for a tested harness adapter with an exact pin (annex C §C.3, first form; F100-FR-230, third way). The proof is four recorded facts and is recorded as the weaker proof for every call | Refusing dsh as critic: it could then be a critic only under the `parity` profile. The owner closed CQ-182 on 2026-09-30 for the weaker proof and v3.0.1 of the constitution names it; this row is removed by the first implementation slice, as the Sync Impact Report of v3.0.1 says. The prompt as arguments stays recorded here: Principle IX has no bounded-argument rule as Principle VIII has |
