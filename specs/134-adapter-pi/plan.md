# Implementation Plan: Adapter for pi (feature 134)

**Branch**: `134-adapter-pi` (a label; the directory is `specs/134-adapter-pi`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/134-adapter-pi/spec.md`

## Summary

Feature 134 delivers the tested harness adapter for pi: one harness descriptor of kind `cli`, a
small set of code hooks, one row of the dialect table of the JSONL reader that pi and prime
share, the classifier entries of pi, the doctor checks of the adapter, and the recorded fixtures.
It owns no extension point. It is data first: every rule that the descriptor of feature 100
(annex C §C.2) can express is expressed there, and code exists only for the parts listed below.

| Deliverable | What it is | Requirements |
|---|---|---|
| Descriptor of pi | Data of kind `cli`: detection, version range, auth, roles, invocation, continuation, failures, telemetry, isolation, containment, cost | F134-FR-001 to F134-FR-004, F134-FR-008, F134-FR-011 to F134-FR-013, F134-FR-018, F134-FR-021, F134-FR-022, F134-FR-026 |
| Code hooks | Proof of the critic mode; refusal without the opt-in; refusal of a subscription login path | F134-FR-006, F134-FR-008, F134-FR-019 |
| Dialect row `pi` | One file of data beside the row of prime | F134-FR-023 |
| Classifier entries | A pure table from message text to class, with the reset parser | F134-FR-024 |
| Terms facts | The facts of R8v rows 37 to 40, as data for the terms file of feature 147 | F134-FR-005, F134-FR-006 |
| Doctor checks | Five checks registered through EP-14 | F134-FR-010 |
| Fixtures and captures | Four captures; recorded streams; classifier fixtures; the pi stub of feature 141 | F134-FR-027, F134-FR-028 |

Approach: R9 option B. One JSONL adapter family covers pi and prime through a dialect table, and
pi is one row. The four unverified facts of R9 (exit code on a provider error, the stream against
the schema-v3 reader, the tool list in the initial record, the exact-session-id option in print
mode with JSON output) are closed by four small captures before the specification freezes. Until
then every dependent requirement carries `status: unverified`.

## Technical Context

**Language/Version**: TypeScript 5.x, `strict`, ECMAScript modules, on Node.js 22 or later. The Language Ledger stays empty

**Primary Dependencies**: `@specstride/contracts` (descriptor schema, dialect schema, closed sets), `@specstride/harness` (the seam of feature 109: the port, the loader, the conformance suite), `@specstride/adapter-prime` (the JSONL reader of feature 138, in which the dialect table lives, imported from the package of the prime adapter as the package graph of feature 100 allows), `@specstride/kernel` (atomic write, table evaluator, process primitive). No new third-party dependency

**Storage**: files only, by logical name (feature 100, annex B §B.5): `pass:<passId>:invocation`, `attempt:<N>:<k>:<n>:session`, `attempt:<N>:<k>:<n>:critic-invocation`, `overlay:<id>:tree`, `pass:<passId>:provider-terminal`. The bundled descriptor is data of the package, under the logical name `package:harness:<id>` of annex B §B.5. This feature writes no state of its own

**Testing**: the test runner that Node ships. A fake executable (Node-shebang file) for the conformance suite of the port; the pi stub of feature 141 §O.3, port side only; recorded streams and error messages as fixtures. No parity test exists (feature 141 §O.7). No test calls a model or a paid service

**Target Platform**: Linux and macOS. Every macOS statement is `unverified` (ruling 67): the executable path, the overlay modes, the absence of a sandbox of pi

**Project Type**: data and code in the npm workspace package `@specstride/adapter-pi` (owner 134, layer L1, of the package graph of feature 100), which imports the JSONL reader from `@specstride/adapter-prime` (owner 138); the row of the dialect is data of `@specstride/adapter-pi` (`packages/adapter-pi/data/dialects/pi.json`), registered with the reader of feature 138; the fixtures in the test tree

**Performance Goals**: starting values, low confidence, measured in the build. Detection without a probe under 20 ms; the classifier over one message under 1 ms; the reset parser has no backtracking on a text of 64 KiB

**Constraints**: no native module; no paid call in tests; plain `npm install`; MIT-compatible; the core imports nothing of this adapter; no path, account or name of the owner's machines in any file; the product never installs, vendors, downloads or logs in to pi

**Scale/Scope**: 30 functional requirements, 7 success criteria; no as-is item carried; 5 extension points (EP-02 and EP-12 implemented, EP-14 implemented as an entry, EP-10 and EP-11 consumed); no closed set owned; no switch introduced

### Facts of pi that this plan fixes (all with the pin `>=0.80.6 <0.81`, read on 2026-09-29 from the installed package's help and documentation; the harness was not run)

The exact flags and variables live here and in `contracts/descriptor.pi.json`, and nowhere in `spec.md`.

| Subject | Value | State |
|---|---|---|
| Executable and version | `pi`; `pi --version` prints `0.80.6` | verified-local (2026-09-29) |
| Headless | `-p` (print mode), `--mode json`; the prompt on standard input | flags verified-local; stdin behaviour unverified |
| Tools | Proposer: `--tools <allow-list>`; critic: `--no-tools`; never `--exclude-tools` | verified-local (help) |
| Customisations off | `--no-extensions`, `--no-skills`, `--no-context-files`, `--no-prompt-templates` | verified-local (help) |
| Project trust | Never `--approve`; `--no-approve` passed | `--no-approve` verified-local (help, R11 F-27); print-mode default from documentation only: unverified |
| Session | `--session-id <id>` (exact id, created if missing); `--session-dir <dir>`; `--no-session` | help verified-local; combination with `-p --mode json` unverified (capture 4) |
| Home | `PI_CODING_AGENT_DIR` (agent directory), `PI_CODING_AGENT_SESSION_DIR` (sessions) | documentation only: unverified |
| Telemetry | `PI_TELEMETRY=0` (install and update ping) | documentation only: unverified |
| Offline switch | `PI_OFFLINE` is not set: whether it also stops provider calls is unknown | unverified; a capture decides |
| Credential | The provider's key variable, for example the ones the documentation lists for the OpenAI-format, DeepSeek, OpenRouter and z.ai providers; never `--api-key` | documentation only: unverified |
| Stream | JSONL; first record `{"type":"session","version":3,…}`; then agent, turn, message, tool-execution, retry and compaction records | documentation only: unverified against the reader (capture 2) |
| Provider error | An assistant message with stop reason `error` and an error message text, after `auto_retry_*`; a delay above `retry.provider.maxRetryDelayMs` (default 60 000) fails at once with the provider's text | documentation only: unverified (capture 1 and the classifier fixtures) |
| Exit code on provider error | Unknown | unverified (capture 1) |
| Sandbox | None; no permission mode; no permission prompt | help and documentation: unverified by run |
| Context window | A `context` column in `pi --list-models` | verified-local on one machine |

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v3.0.0. Brief 134 names Principles VII, VIII, IX, X, XI and XII as binding. All
twenty are answered.

*Constitution v3.0.1 (2026-09-30) differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182); the row of Principle IX below already records it.*

**The gate and the loop (I–V)**

- [x] I. Coordination through files: the adapter writes no state of its own; the session directory and the overlay are files by logical name, atomic; no watcher
- [x] II. Only the phase gate produces a verdict: the adapter returns a reply, a proof and typed failures; a failed proof yields `critic_not_toolless` and never a verdict
- [x] III. The critic is grounded and read-only: the critic on pi receives the grounding snapshot and the nonce; project-local resources are untrusted (F134-FR-017); the second form (read tools) is never offered (F134-FR-021); the critic-diversity rule and its warning are stated (F134-FR-030)
- [x] IV. No spec grammar: the adapter reads no specification
- [x] V. Observability is best-effort: the adapter emits facts only through the seam; a failed switch of telemetry does not break a call (F134-FR-016)

**The product and its edges (VI–XII)**

- [x] VI. Strict TypeScript; schema-validated descriptor and dialect row; core free of provider dependencies; plain `npm install`; no native module; extension points named with versions (spec section "Extension points")
- [x] VII. pi is an entry of the one open registry; no closed list; the core names no harness; the reader has no branch for pi (F134-FR-001, F134-FR-023)
- [x] VIII. Prompt on stdin; no wait for a human (no permission prompt exists); operator configuration never mutated (real home read-only, throwaway home removed); auto-loaded context off (F134-FR-029); fresh session per attempt (F134-FR-013, F134-FR-014); contained by default: pi's ceiling is C0, so the run is refused without the opt-in (F134-FR-008). This is the stated consequence of a harness with no sandbox, and it is not a violation
- [ ] IX. ⚠ Deviation, recorded in Complexity Tracking. What passes: the critic has no tools by flags (F134-FR-018); the proof is taken from the initial record where it states the tool list and the minted identity (F134-FR-019); no default window for an unknown model (F134-FR-022); an auth error is named. The deviation: where the initial record of pi states no tool list or no identity that can be compared, the proof is the weaker one of annex C §C.3 and F109-FR-038 (the exact version pin, a passed preflight and the flag set of the call), recorded as such for every call (F134-FR-019). CQ-182 is closed (owner, 2026-09-30) and Principle IX v3.0.1 names the weaker proof, but for a stream that carries no initial record; pi's stream has one, which may be silent on the tool list or the identity. That remaining case is the deviation. Captures 3 and 4 (T004, T005) decide whether it arises for pi
- [x] X. Version range `>=0.80.6 <0.81` with `verified-on` 2026-09-29, provisional until the first capture; each pass records the version (F134-FR-003)
- [x] XI. One reader, one row; the terminal record decides; `missing_terminal`; unknowns are null; cost null where the stream gives none (F134-FR-023, F134-FR-025, F134-FR-026)
- [x] XII. No test calls a paid API; tiers and the terms gate respected; Tier 3 refused; secrets by reference; model ids are configuration (F134-FR-004 to F134-FR-006)

**The host skill (XIII–XVII, XX)**

- [x] XIII. N/A: the adapter records facts (the proof, the version); judgment is elsewhere
- [x] XIV. N/A: no verification command is declared or invented
- [x] XV. Nothing bypasses the terms gate: a call of pi is refused unless the gate allows it (F134-FR-005, F134-FR-006)
- [x] XVI. A provider limit is classified so that a quota pause spends no budget (F134-FR-024); the adapter supervises nothing
- [x] XVII. N/A: no prerequisite is handled here; a missing credential fails before the first pass (F134-FR-004)
- [x] XX. Parallel units stay off for pi unless `loop.parallel.allow_detect` is set (F134-FR-009)

**The rewrite (XVIII–XIX)**

- [x] XVIII. No as-is behaviour is carried, so no origin or parity test exists; every requirement has a characterization test; the options it uses take their `parity` values under the oracle (rows 10, 20, 23, 25, 26, 28, 29, 30, 39, 131; spec section "Rows of the `parity` profile")
- [x] XIX. Host-facing output: the adapter prints nothing; its doctor lines are within the doctor's share of the budget

Every other check passes. Row IX does not pass against the text of Principle IX and is not marked as passed; it is recorded in Complexity Tracking with its queued question.

Re-check after design (2026-09-30, re-check B-8.7): row IX changed to a recorded deviation; no other gate changed.

## Project Structure

### Documentation (this feature)

```text
specs/134-adapter-pi/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── README.md
│   ├── descriptor.pi.json
│   ├── dialect-row.pi.json
│   ├── classifier-entries.pi.json
│   ├── conformance-cases.json
│   ├── captures.json
│   └── traceability.json
├── checklists/requirements.md
├── tasks.md
└── analyze-report.md
```

### Source Code (repository root)

```text
packages/adapter-pi/
├── src/
│   ├── descriptor.json            # the harness descriptor of pi, descriptorVersion 1
│   ├── hooks.ts                   # code hooks: critic proof, opt-in refusal, subscription-login refusal
│   ├── classifier.ts              # pure table from message text to class; reset parser
│   ├── doctor.ts                  # five registered checks
│   ├── terms-facts.json           # facts for R8v rows 37 to 40, handed to the terms file of feature 147
│   └── index.ts                   # registration call of the adapter
└── data/dialects/pi.json          # the one row of the dialect table (the table is feature 138's), registered with the reader
tests/characterization/134/        # the test tree of feature 100; this feature has no parity test (feature 141 §O.7), so tests/parity/134/ stays unused
├── conformance.test.ts            # adapter suite of feature 109 with a fake executable
├── reader-dialect.test.ts         # reader suite of feature 138 with the dialect pi
├── classifier.test.ts             # fixtures with and without a reset time
├── characterization.test.ts       # CT-134-<n>
└── fixtures/                      # recorded streams, error messages, captured exit code, each with pin and date
```

**Structure Decision**: data first. `hooks.ts` holds only what the descriptor cannot say: the
comparison of the initial record with the minted identity (and the weaker proof), and two refusals.
The reset-time parse lives in `classifier.ts` with the classifier entries.
Any rule that another harness of the family also needs goes into the dialect table, not here.

## Design decisions

| # | Decision | Why | Requirement |
|---|---|---|---|
| D1 | The descriptor states `provider.id` from the configured provider at role resolution, not as a fixed value | pi is a front harness; the terms gate and the diversity test need the provider behind it | F134-FR-005 |
| D2 | The credential variable is chosen by the provider in use, from a table in the descriptor's environment record | One table, no branch in code | F134-FR-004, F134-FR-011 |
| D3 | A no-session pass and a session pass differ by one argument pair only | Keeps the invocation table small and testable | F134-FR-013, F134-FR-014 |
| D4 | The proof of the critic mode is a pure function of the initial record and the call record | Testable on recorded streams; no I/O | F134-FR-019 |
| D5 | The reset time is parsed from a duration in the message text (`5h`, `1h30m`, `45m`, `30s`) and added to the time of the message | The text is the only carrier | F134-FR-024 |
| D6 | The classifier confidence is always `text` | Nothing structured exists in the stream | F134-FR-024 |
| D7 | The four captures are the first tasks; requirements that depend on them stay `unverified` until each has logged | Rule of the prompt: a capture is the first task of its feature | F134-FR-027 |
| D8 | The adapter offers only the form `tool-less` | The read-only tool selection of pi is not a sandbox | F134-FR-021 |

## Complexity Tracking

| Violation | Why needed | Simpler alternative rejected because |
|---|---|---|
| Principle IX (NON-NEGOTIABLE): the weaker proof of the tool-less critic (exact version pin, passed preflight and flag set) where the initial record of pi states no tool list or no comparable identity (F134-FR-019) | pi's stream may not state the tool list or the minted identity in its session header (R9 open questions; captures 3 and 4 decide it), and the critic form offered is `tool-less` by flags only | Refusing pi as critic whenever the initial record is silent would remove a harness the owner placed in Wave 1 (rulings 32a, 32b) before the captures have shown whether the case arises. CQ-182 is closed (owner, 2026-09-30: the weaker proof is allowed for a tested harness adapter, recorded on every call) and Principle IX v3.0.1 names it, with feature 134 among the features cited; its text covers a stream with no initial record, so this row stays until the captures show whether pi's initial record is silent. If it is not, the row is removed |
