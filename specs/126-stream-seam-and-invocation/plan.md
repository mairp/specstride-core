# Implementation Plan: Stream seam and invocation

**Branch**: `126-stream-seam-and-invocation` (label) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/126-stream-seam-and-invocation/spec.md`

## Summary

A registry of stream readers by format, six normalized records, a tap with a pass-through mode, and the invocation artifacts (record, producer status, provider terminal, result) with reconciliation, finalization and retention. Approach: a small pure core (registry, records, reconciliation as functions with no I/O), and thin edges (line reader, tap, file writer). Formats are data first: a mapping table is interpreted by one generic reader; code readers exist only for `claude`, for plain text (lines to `text` records), for the server-sent-event framing under the data rows `sse-openai` and `sse-anthropic` (F126-FR-040), and for the JSONL family, whose reader is feature 138's. Every baseline behaviour carried is proven by a parity test on FX-26 (and the stream events of FX-01, FX-18, FX-20) through the compatibility projection.

## Technical Context

**Language/Version**: TypeScript (strict) on Node.js 22 or later

**Primary Dependencies**: `@specstride/contracts` (schemas, closed sets, logical names, the interfaces of the ports) and `@specstride/kernel`, the two packages that `@specstride/harness` may import; the one event writer, the redactor and the layout resolver through their ports, handed in by a composition root; a schema validator chosen in the plan of feature 100. No provider SDK

**Storage**: files in the control plane, by logical name (feature 100 annex B §B.5): `pass:<passId>:stream`, `:invocation`, `:producer-status`, `:provider-terminal`, `:result`, `:response`, `:prompt`, `run:<runId>:current-pass`, `attempt:<N>:<k>:<n>:critic-invocation`

**Testing**: Node.js test runner; recorded streams replayed through each reader; stub agents of feature 141; the parity oracle (FX-26); own tests for hostile streams, size caps and killed passes

**Target Platform**: Linux and macOS (macOS `unverified` until a runner passes the oracle)

**Project Type**: two directories of the package `@specstride/harness` (layer L1; owners 109, 124, 126, 146), as `specs/100-specstride/contracts/data/package-graph.json` gives it: `packages/harness/src/stream/` (registry, readers, tap) and `packages/harness/src/invocation/` (record, result, reconciliation, finalization, retention). This feature has no package of its own; the names `stream-seam` and `invocation` of the first plan are withdrawn. The engine reaches reconciliation, finalization and the retention sweep through a plain function interface declared in `@specstride/contracts` (proposed upstream as F100-FR-237, the pattern of F100-FR-235; `analyze-report.md`, "Proposed upstream fixes", P1), which this feature implements (T045); a composition root (`@specstride/runtime`, `@specstride/cli`) hands in the implementation

**Performance Goals**: the tap handles a line as it arrives and flushes its output after each processed record (F126-FR-011), so the summary is live; it holds one line at a time, bounded by `stream.limits.lineBytes` where the cap is on (F126-FR-018), and never the whole stream in memory

**Constraints**: no native module; no shell in the tap; a replacement tap executable is started from an argument list with no shell, with the stream as its only standard input (F126-FR-011); parsing never executes stream content; the tap never fails a pass; no harness name is tested in control flow (F126-FR-039)

**Scale/Scope**: 40 requirements, 209 behaviour items carried in 32 clusters, fixture family FX-26

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Each gate is answered ✅, ❌ or N/A with a one-line reason and the requirement that supports it. Every ❌ has a row in *Complexity Tracking*. Constitution: `.specify/memory/constitution.md` (v3.0.0).

*Constitution v3.0.1 (2026-09-30) differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182); the row of Principle IX below is N/A, because the proof of the tool-less form, the weaker proof included, is made by the harness adapters and not here; nothing changes.*

**The gate and the loop (I–V)**

| Principle | Mark | Reason | Supported by |
|---|---|---|---|
| I. Files only, atomic writes | ✅ | The four artifacts are files under logical names, written to a temporary name and renamed; the record is created exclusively; no watcher and no service | F126-FR-028, F126-FR-030, F126-FR-031, F126-FR-032 |
| II. Only the phase gate gives a verdict | N/A | This feature produces no verdict. The result of an invocation and the decision `continue`, `halt` or `cap_halt` feed the breakers and approve nothing | F126-FR-034 |
| III. Outside text is data | ✅ | Only the harness's own framing is parsed; tool output never becomes a record; nothing from a stream is executed | F126-FR-018, F126-FR-005 |
| IV. One grammar module | N/A | No spec grammar is read or written | — |
| V. Observability cannot break a run | ✅ | The tap never fails the pass and exits 0; a failed local append drops the event and the pass goes on; a replacement tap that cannot start, fails or does not end never fails the pass | F126-FR-016, F126-FR-011, F126-FR-014 |

**The product and its edges (VI–XII)**

| Principle | Mark | Reason | Supported by |
|---|---|---|---|
| VI. TypeScript, validated boundaries, extension points named | ✅ | Strict TypeScript in `@specstride/harness`; records validated against the schema files of `contracts/schemas/`; no native module; EP-02 sub-point implemented, EP-08 and EP-04 consumed, with versions | Spec, "Extension points"; F126-FR-028 |
| VII. One open registry, no harness-name test | ✅ | Formats are an open registry and a format is data; every difference between harnesses is read from the format row, the descriptor or the dialect row; a static test and a renamed harness prove it | F126-FR-001, F126-FR-007, F126-FR-039 |
| VIII. Unattended, hermetic passes | ✅ | The built-in tap starts no process. A replacement tap executable is started from an argument list with no shell, reads the stream only on standard input, never waits for a human, is an `owned` process and ends with the pass. The prompt and the harness process are the adapters' | F126-FR-011 |
| IX. Tool-less critic | N/A | The proof is not made here. The reader reads the initial record and hands it on as `init`; the adapters and the gate use it | F126-FR-002 |
| X. Version pins | ✅ | Every stream shape that rests on documentation is `unverified`, with the check that verifies it and the pin of the capture | F126-FR-003, F126-FR-010, F126-FR-022, F126-FR-023, F126-FR-040 |
| XI. One event schema, truthful, redacted | ✅ | Records go through the one event writer; a sink receives the envelope whole, with `ts`, `type` and `seq`; `stream.missing_terminal`; unknown values null; text through the ingress; the projection is compared on FX-26 | F126-FR-017, F126-FR-019, F126-FR-020, F126-FR-021 |
| XII. No paid API in tests | ✅ | Tests use recorded streams and stub agents only. T001 and T024 are paid probes, logged, not run by the specifier, and no unpaid task or test waits for them | tasks.md, "Dependencies" |

**The host skill (XIII–XVII, XX)**

| Principle | Mark | Reason | Supported by |
|---|---|---|---|
| XIII. Facts by code, judgment by the model | N/A | No model judgment is taken; reconciliation is a fixed precedence | F126-FR-033 |
| XIV. Verification commands are declared | N/A | No verification command is run or named | — |
| XV. Invocation is consent | N/A | No launch check, terms gate or budget is touched | — |
| XVI. The supervisor only reads | N/A | The supervisor is not touched; the breaker counters are written by the engine through finalization | F126-FR-034 |
| XVII. A missing prerequisite is a skip | ✅ | A test whose fixture or capture is absent is a skip with its reason; no test fails or waits for a paid capture | tasks.md, "Dependencies" |
| XX. Parallel work | N/A | This feature decides nothing about parallel work. With parallel units on it reads the stream of each worker with a reader state of its own | F126-FR-025 |

**The rewrite (XVIII–XIX)**

| Principle | Mark | Reason | Supported by |
|---|---|---|---|
| XVIII. Origin, disposition, test, register row | ✅ | Every carried item cites origin, disposition and test. The register holds every row the spec cites: DV-006, DV-007, DV-027, DV-065, DV-066, DV-083, DV-101, DV-102, DV-103 and DV-115 | F126-FR-016, F126-FR-017, F126-FR-018, F126-FR-029; spec, "As-is behaviour not carried" |
| XIX. Terse host-facing output | N/A | No host-facing output. The summary lines of the tap are the as-is lines, printed under compatibility output | F126-FR-013 |

**Re-check after Phase 1 design (2026-09-29)**: no mark changed.

**Re-check after the cross-feature review (2026-09-30)**: row VIII was "N/A: no process is started here", which was wrong, because a replacement tap executable is a process; it is now ✅ with F126-FR-011. Row V names the replacement tap. Row VII rests on the new F126-FR-039. Row XVIII is ❌ until the register row of F126-FR-016 is written.

**Re-check after the analyze run (2026-09-30)**: row XVIII is ✅. The register holds DV-115 (`docs/ecosystem/consolidation.md`, section 6), which F126-FR-016 cites, so the deviation has ended and its row of Complexity Tracking is withdrawn. No other mark changed.

## Project Structure

### Documentation (this feature)

```text
specs/126-stream-seam-and-invocation/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
├── checklists/requirements.md
├── tasks.md
├── analyze-report.md
└── repair-report.md
```

### Source Code

```text
packages/harness/                     # @specstride/harness, layer L1 (owners 109, 124, 126, 146)
├── src/stream/
│   ├── registry/                     # format rows, names, aliases, validation
│   ├── records/                      # the six normalized records
│   ├── readers/                      # claude, mapping (data-driven), text, SSE framing with the rows sse-openai and sse-anthropic as data; the JSONL reader registers from feature 138
│   └── tap/                          # line loop, pass-through, faults, summary lines, replacement executable
├── src/invocation/
│   ├── identity/                     # ids, path-safe components
│   ├── artifacts/                    # record, producer status, provider terminal, result (atomic, exclusive)
│   ├── reconcile/                    # the precedence table, decisions
│   ├── finalize/
│   └── retention/
└── test/                             # own tests CT-126-n
packages/testkit/src/conformance/EP-02/   # the cases of this feature for the stream readers
packages/testkit/src/samples/EP-02/       # the sample reader given as data only
tests/parity/126/                     # parity tests PT-126-*
tests/characterization/126/           # none in this feature: every carried item is a Specstride item with a parity test
```

**Structure Decision**: no package of its own. Both directories are part of `@specstride/harness`, which may import `@specstride/contracts` and `@specstride/kernel` only. The pure parts (registry, records, reconcile) import contracts only; the tap and the artifact writers are edges that reach the event writer, the redactor and the layout resolver through ports. The engine reaches reconciliation, finalization and the sweep through the function interface of `@specstride/contracts` of F100-FR-237 (proposed), which `src/invocation/` implements. The schema files of `contracts/schemas/` are delivered to the `contracts` package. Conformance cases and the sample are in the published test kit, and parity and characterization tests at the root of the repository, as the plan of feature 100 rules. Feature 100 annex A §A.3 governs imports.

## Phase 0 and Phase 1 outputs

Research: [research.md](research.md). Entities: [data-model.md](data-model.md). Contracts: [contracts/README.md](contracts/README.md). Validation guide: [quickstart.md](quickstart.md).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None. Row 1 (Principle XVIII: the register row of the intended difference of F126-FR-016) is withdrawn on 2026-09-30: the register holds DV-115 | — | — |
