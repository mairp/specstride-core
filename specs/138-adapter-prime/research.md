# Research: Prime harness adapter (feature 138)

Phase 0 of `plan.md`. Research and architecture stay in `docs/ecosystem/`; this file summarizes what
the plan takes from them and links to the source. No `NEEDS CLARIFICATION` remains. The facts that wait
for the five captures (F138-FR-042) stay `unverified`.

## Decisions

### D-1 One family reader with a dialect table

- **Decision**: the JSONL reader for stream schema version 3 is written once. What differs per harness is a row of the dialect table. Wave 1 has two rows, `prime` (this feature) and `pi` (feature 134).
- **Rationale**: prime-agent depends on the same package family as pi; its JSON mode uses the same record names, and pi's session header is also version 3. The reader of the baseline already rejects any version other than 3.
- **Alternatives considered**: two readers (duplicated stream and quota logic, drift); a reader driven only by a data mapping (`stream.mapping`), which cannot express the accumulation of text by message and index, the lexical detection of evidence writing, or the usage rules of 41 items.
- **Source**: `docs/ecosystem/research/R9-pi-dsh-prime.md` (F6, F7, options B); `APPROVAL.md` ruling 32b; `specs/100-specstride/annexes/C-ports-and-edges.md` §C.5.

### D-2 The reader is a port of the baseline, record by record

- **Decision**: the reader keeps the state machine of the baseline: schema gate first, then message, tool, retry and end records, with the same diagnostics, the same caps, the same display lines. Where the baseline is odd (two diagnostics for one error, `tool*` types that are silently handled, cost under `cost`) the oddity is kept under `parity` and named in the requirement.
- **Rationale**: 41 items; parity binds (Constitution XVIII). Where an as-is spec and the code differ, the code is the reference.
- **Alternatives considered**: a cleaner reader (would fail FX-26).
- **Source**: the reader of the baseline at Specstride `9cab15d` (`lib/prime_stream.py`); `docs/ecosystem/research/R18-behaviour-inventory.tsv` (B-2224 to B-2264).

### D-3 The terminal record decides

- **Decision**: success needs a success terminal and exit code 0. An error terminal with exit 0 is a failed call. No terminal is `stream.missing_terminal`. Text mode has no terminal, so the exit code and output decide there.
- **Rationale**: prime exits 0 on a provider error (recorded stream `stock-auth-error` at the baseline ends with `fixtureProcessExitCode` 0). The baseline already reconciles the producer status with the tap's terminal on the structured path; the port keeps that and extends it to the critic outside `parity`.
- **Alternatives considered**: trusting the exit code (wrong); guessing from text (the reason for JSON mode in the critic).
- **Source**: R9 F5; R14 EV-31; the invocation-result module of the baseline; `DV-090`.

### D-4 The critic runs in JSON mode outside `parity`

- **Decision**: JSON mode, with the same restriction flags and, where the pinned version has them, the flags for extensions and prompt templates. The reply is the visible text of the text records. The reader is the same.
- **Rationale**: the JSON critic function exists at the baseline and is never called; it already reconstructs the visible text and takes the terminal as the outcome. Under `parity` text mode stays (row 28).
- **Alternatives considered**: text mode everywhere (a provider error cannot be told from an empty verdict).
- **Source**: R9 F5, recommendation 1; `DV-090`; B-0994.

### D-5 Continuation by session id inside a session directory of the phase attempt

- **Decision**: resume by the id the earlier pass's initial record stated, with a session directory that belongs to the phase attempt. Never "the latest". Everything else starts with the no-session flag.
- **Rationale**: prime has no flag to choose an id (pi has one). Decision 22; rulings 7, 36.
- **Alternatives considered**: `-c` (continue the latest: unsafe without a directory).
- **Source**: R9 F10; `APPROVAL.md` rulings 7, 36. Unverified until capture (4).

### D-6 Containment ceiling C0

- **Decision**: C0. As a proposer only on the consumer's opt-in. `protection=detect`. Parallel units off unless `loop.parallel.allow_detect`.
- **Rationale**: the harness states "NOT A SANDBOX" and has no permission mode.
- **Source**: R9 F19; R11 R-2, T-07; rulings 34, 38, P2.

### D-7 Terms: unknown, fleet only

- **Decision**: no terms row (`termsRef` null). Usable when named, with the warning. Never a default, never an automatic critic, under every audience and for both roles. A subscription-token login is Tier 3 and refused.
- **Source**: R8 F-D2 to F-D4, F-P4; R8v; rulings 2, 59, 60, P14.

### D-8 Telemetry off for every launched process

- **Decision**: the harness's telemetry variable and the do-not-track variable, in every process, in every fixture. A register row `DV-112` is needed, because the baseline sets none and the oracle compares the names of the variables a stub saw.
- **Source**: R9 F17; R14 rule 7; feature 141 F141-FR-011.

### D-9 Quota entries by text

- **Decision**: `provider_auth` gives `auth`; a limit with a reset time in the message gives `quota_window`, confidence `text`; the rest `provider_other`.
- **Rationale**: prime has no structured quota code. A provider delay above the harness's retry cap fails fast with the provider's text, which can carry the reset (R9 F14).
- **Source**: R9 F13 to F15; R14 B12; `specs/100-specstride/annexes/C-ports-and-edges.md` §C.13.

### D-10 The context window

- **Decision**: declared by the consumer or read from the model list; the smaller of the two; no default outside `parity`. Under `parity`, 98,304 for an unseen model, as the baseline.
- **Rationale**: a declared window that overshot a gateway's real one made a call fail and burn an attempt (R9 F18); Principle IX.
- **Source**: R9 F18; the critic module of the baseline; row 28 of feature 100, annex X §X.7.

### D-11 Auto-loaded context, the home and native memory (added 2026-09-30)

- **Decision**: outside `parity` the proposer call carries the four switches for skills, extensions, context files and prompt templates unless the consumer opts in, in user configuration. At auth tier 1 the real home is used and never written; at auth tier 2 a throwaway home is built by an overlay that redirects the home variable and the session directory variable. Native memory is off for the critic always and for the proposer by default, and the setting is recorded per run.
- **Rationale**: Principle VIII and rulings 36 and 37. The review found that the first version switched nothing off for the proposer and handed the real home to the process.
- **Alternatives considered**: a variable of the harness for its configuration directory (none exists; R9 F16); refusing auth tier 2 (kept as the fallback if capture (5) fails).
- **Source**: the help of the agent executable, version 0.7.3, read on 2026-09-30; R9 F8, F16; feature 100 annex C §C.16, F100-FR-082, F100-FR-113; review item W-138-01.

### D-12 Critic diversity (added 2026-09-30)

- **Decision**: the adapter gives the identity of each role or null; a variant gives null; null gives the result `unverified`; the warning never blocks.
- **Source**: F100-FR-024; feature 100 annex E §E.1; ruling 49; review item W-X-17.

## Facts and their status

| Fact | Status | Basis |
|---|---|---|
| The agent executable prints its version with a version flag; the launcher has none | verified-on 2026-09-29, prime-agent 0.7.3 | R9 Q1 (installed CLI) |
| Prime exits 0 on a provider error | verified-on 2026-09-29 from the code and recorded streams of the baseline; not from a live call | R9 F5 |
| Prime states it is not a sandbox | verified-on 2026-09-29 (help text) | R9 F19 |
| Telemetry switches exist | verified-on 2026-09-29 (shipped docs) | R9 F17 |
| The record set of the stream at the pin | unverified; the baseline's fixtures are hand-authored from Prime 0.7.1 | capture (1) |
| The record and exit code at a provider limit | unverified | capture (2) |
| Whether the initial record states the tool list | unverified | capture (3) |
| The resume flag inside a session directory in print mode | unverified | capture (4) |
| Flags for skills, extensions, context files and prompt templates, and the tool allow-list flag, at the pin | exist in the help, verified-on 2026-09-30, prime-agent 0.7.3; their effect is unverified | the help of the agent executable; captures (1), (5) |
| The agent executable takes its configuration directory from the home variable | unverified; the harness has no variable for that directory | R9 F16; capture (5) |
| Native memory of the pinned version beyond saved sessions, the goal of a session and context files | unverified | capture (5) |
| Misleading model error behind a gateway | unverified; fleet note only | R9 F20 |
| All behaviour on macOS | unverified | ruling 67 |
