# Implementation Plan: Harness discovery (feature 146)

**Branch**: `146-harness-discovery` (a label; the directory is `specs/146-harness-discovery`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/146-harness-discovery/spec.md`

## Summary

Feature 146 finds the harnesses a consumer has, without reading a secret and without changing
anything. Its result is the list of harnesses that enters the field `harnesses` of the resolved
registry (feature 100, annex C §C.6).

| Deliverable | What it is | Requirements |
|---|---|---|
| Guarded reader | Presence of variables, existence of directories, look-up on the search path; a deny-list; no operation that opens a file below a configuration home | F146-FR-004 |
| Source readers | Seven readers, one per source of discovery | F146-FR-002, F146-FR-003, F146-FR-005 to F146-FR-007, F146-FR-010 |
| The two passes and the switches | The passive pass, the metadata pass, the precedence of sources | F146-FR-001, F146-FR-009, F146-FR-011, F146-FR-012 |
| Metadata client | GET only, redirects refused, the credential bound to its host | F146-FR-008 |
| Probe runner and ladder | Five steps; bounded, parallel probes; the check of flags against the help text | F146-FR-013 to F146-FR-015 |
| Window rule and catalogue | Precedence of sources, the smaller of two, the margin, no default | F146-FR-016 |
| State resolver | The four states; the reading of a result of harness verification | F146-FR-017 to F146-FR-019 |

Approach: discovery is pure in its core. Everything that touches the machine goes through three
narrow ports that a test replaces and traces: the guarded reader, the probe runner and the
metadata client.

## Technical Context

**Language/Version**: TypeScript 5.x, `strict`, ECMAScript modules, on Node.js 22 or later

**Primary Dependencies**: `@specstride/contracts` (schemas, closed sets, logical names), `@specstride/kernel` (hasher, process primitive). No dependency from npm of its own: requests use the `fetch` that Node ships, with `redirect: "manual"`. The secret resolver and the resolved configuration are handed in by the composition root as interfaces of `@specstride/contracts`, because the package graph lets `@specstride/harness` import neither `@specstride/config` nor `@specstride/policy`

**Storage**: none written. Read, by logical name (feature 100, annex B §B.5): `user:harness:<id>`, `user:harness-verify:<id>`, `user:catalogue`, `user:config` through the resolved configuration. Shipped data: bundled harness descriptors and the bundled catalogue snapshot, at the logical names `package:harness:<id>` and `package:catalogue` of annex B §B.5, whose physical paths are `<package>/harnesses/<id>.yaml` and `<package>/catalogue/` (feature 100, `contracts/sources/physical-paths.json`). In the workspace they live in `packages/harness/data/descriptors/<id>.yaml` and `packages/harness/data/catalogue/`, and the published package carries them at those two physical paths (proposed upstream fix U-1 of `analyze-report.md`). Code reads them only through the logical names, never by a workspace path

**Testing**: the test runner that Node ships (`node:test`); fake executables and a fake endpoint on loopback from `@specstride/testkit`; file-access tracing through the guarded reader plus an operating-system trace on Linux (`strace`, skipped with its reason where absent). No parity test: discovery has no reference. No test calls a model, a paid service or a host other than loopback

**Target Platform**: Linux and macOS. Every macOS statement is `unverified` until a macOS runner has passed (ruling 67)

**Project Type**: part of one package of the npm workspace, `@specstride/harness` (layer L1). This feature owns the directory `discovery/` in it

**Performance Goals**: starting values with low confidence. Passive pass with 20 harness descriptors: under 1 s without a hanging probe, and no later than the probe limit plus 1 s with one (F146-SC-003). Probe limit 5 s per process, 3 s per request, output cap 64 KiB, at most 8 probes at once; with this cap the bound of F146-SC-003 holds while fewer than 8 probes hang at once, and more hanging probes add one probe limit per 8. Launch output of this feature: at most 1 line and 200 bytes, only when an entry of project configuration is ignored

**Constraints**: no credential store is opened; no file is written; GET only; no native module; no paid call in a test; no path, account or name of the owner's machines, the locally registered backend included; no harness name in control flow

**Scale/Scope**: 19 functional requirements, 3 success criteria; no behaviour item carried; 3 closed sets; rows 87, 88 and 89 of the `parity` profile (annex X §X.7); no fixture family of the oracle

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v3.0.1. Every gate is answered.

*Constitution v3.0.1 (2026-09-30) differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182). The row of Principle IX was re-read against that sentence at the analyze run of 2026-09-30 and stands: the weaker proof belongs to a tested harness adapter that proves a tool-less critic, and discovery proves no tool-less form (that a CLI stays without tools stays declared or null, F146-FR-013).*

**The gate and the loop (I–V)**

- [x] I. ✅ Discovery writes no file and holds no state between two commands. It is no watcher and no service; it runs inside a command and ends
- [x] II. N/A. This feature produces no verdict and chooses no critic
- [x] III. ✅ A harness descriptor and project configuration are data: only declared argument lists are run (F146-FR-003), and project entries that widen are ignored (F146-FR-010)
- [x] IV. N/A. This feature reads no specification
- [x] V. ✅ A failed probe yields null and a finding and never fails a launch, unless the harness plays a role (F146-FR-014)

**The product and its edges (VI–XII)**

- [x] VI. ✅ Strict TypeScript; every data file has a schema (the catalogue snapshot and `verified-facts.json` included: T023, T003); no provider SDK, no host API; no dependency from npm; extension points consumed: EP-02 `specstride.harness/1`, EP-10 `specstride.secret-resolver/1`, EP-14 `specstride.doctor/1`
- [x] VII. ✅ Discovery fills the one open registry from seven sources. A harness without a tested harness adapter is unverified (F146-FR-017, F146-FR-019). Discovery reads nothing secret and changes nothing (F146-FR-004, F146-FR-009). A test scans the sources of this feature for harness names in control flow
- [x] VIII. ✅ Discovery never waits for a person: standard input of every probe is closed (F146-FR-014). The consumer's configuration homes are never written and no file in them is opened (F146-FR-004)
- [x] IX. ✅ The context window is known with its source or is null; there is no default window (F146-FR-016). What no free probe can show about a critic stays declared or null (F146-FR-013)
- [x] X. ✅ The version of every harness and the hash of its harness descriptor are recorded with the candidate; a changed version ends a local verification (F146-FR-018); `tested` needs a shipped version range with `verified-on` (F146-FR-019); nothing is downloaded (F146-FR-009)
- [x] XI. ✅ Unknown values are null and carry no guess; every value has its provenance (F146-FR-013). This feature reads no stream
- [x] XII. ✅ No test calls a paid API; discovery makes no paid call (F146-FR-001); secrets are references, presence is read and never a value (F146-FR-004); the one use of a credential is the GET that ruling 61 allows (F146-FR-008); no model id is in a rule

**The host skill (XIII–XVII)**

- [x] XIII. ✅ Discovery records facts with provenance and makes no judgment. No model takes part
- [x] XIV. N/A. This feature declares and runs no verification command
- [x] XV. N/A. This feature launches nothing and bypasses nothing; it has no flag that widens
- [x] XVI. N/A. This feature relaunches nothing and spends no budget
- [x] XVII. ✅ Tests whose prerequisite is absent (the operating-system trace, a macOS runner) are skips with their reason; the two live probes are tasks that are logged and not run in the build
- [x] XX. N/A. This feature runs no work in parallel units. Probes run in parallel and write nothing

**The rewrite (XVIII–XIX)**

- [x] XVIII. ✅ No as-is behaviour is carried, so no origin is cited. Intended differences cite DV-064, DV-068 and DV-106. Under the `parity` profile discovery is off
- [x] XIX. ✅ Launch output of this feature is at most 1 line and 200 bytes (about 72 tokens at 2.8 bytes per token); the build measures it. Under `parity` it prints nothing

**Result**: no violation. Re-checked after Phase 1: the design added data files and no new
dependency; the result stands.

## Project Structure

### Documentation (this feature)

```text
specs/146-harness-discovery/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── README.md
│   ├── closed-sets.json
│   ├── parity-rows.json
│   ├── config-keys.json
│   ├── output-lines.json
│   ├── probe-limits.json
│   ├── requirements.json
│   └── schemas/
│       ├── candidate.schema.json
│       └── harness-verify-result.schema.json
├── checklists/requirements.md
├── analyze-report.md
└── tasks.md
```

### Source Code (repository root)

```text
packages/harness/
├── src/
│   └── discovery/
│       ├── discover.ts            # the two passes; candidates out, nothing else
│       ├── guarded-reader.ts      # presence, existence, the deny-list
│       ├── sources/               # harness-adapter, binary, config-home, host, endpoint, gateway, declared
│       ├── probes/                # ladder steps, the bounded probe runner
│       ├── metadata-client.ts     # GET only, redirects refused, host binding
│       ├── catalogue.ts           # the dated snapshot, offline
│       ├── window.ts              # precedence of the context window, the margin
│       ├── state.ts               # the four states; results of harness verification
│       ├── types.ts               # the type of a candidate
│       └── precedence.ts          # two sources, one harness id
├── data/
│   ├── probe-limits.json
│   ├── catalogue/                 # shipped under the root package (package:catalogue)
│   │   └── catalogue.snapshot.json
│   ├── catalogue.schema.json
│   ├── verified-facts.json        # results of the live probes and the macOS run
│   ├── verified-facts.schema.json
│   └── descriptors/               # bundled harness descriptors, <id>.yaml; shipped at <package>/harnesses/ (package:harness:<id>)
└── tests/
    ├── discovery/                 # CT-146-1 to CT-146-19
    ├── conformance/               # the fake harness appears as unverified
    ├── canary/                    # planted credential files, the redirect
    └── static/                    # no harness name in control flow
```

**Structure Decision**: one directory inside `packages/harness`, the package that the package
graph of feature 100 gives to the features of the harness layer. It imports no harness adapter,
no configuration loader and no policy package; the composition root in `@specstride/cli` hands
those in. The package graph names the owners "109, 124, 126, 146" of `@specstride/harness`
(`specs/100-specstride/contracts/data/package-graph.json`).

## Complexity Tracking

No violation of the constitution. Nothing to justify.
