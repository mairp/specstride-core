# Implementation Plan: Presenter

**Branch**: `145-presenter` (a label) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/145-presenter/spec.md`

## Summary

Build the presenter, the banner and the theme as one module. Every literal line, glyph and colour code of the baseline is data in a table; the code evaluates the tables. The presenter is a pure consumer of one run's events, ended by the engine's exit, and never on the path of control.

## Technical Context

**Language/Version**: TypeScript 5.x (strict) on Node.js 22 or later

**Primary Dependencies**: `@specstride/contracts`; no terminal library

**Storage**: none written; reads the events by logical name (annex B §B.5)

**Testing**: the Node.js test runner; parity tests on FX-01, FX-02, FX-28, FX-40; characterization tests CT-145-1, CT-145-2; a pseudo-terminal harness; the colour table test

**Target Platform**: Linux and macOS (macOS `unverified`)

**Project Type**: a module of the package `@specstride/cli`, loaded lazily so that a read command does not pay for it

**Performance Goals**: none of its own; loaded only by the commands that render

**Constraints**: no native module; no install script; escape sequences from tables

**Scale/Scope**: 22 requirements, 3 success criteria, clusters C-081 to C-086, C-096 to C-107 and 18 items of C-006, C-007, C-012, C-013

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Answered against `.specify/memory/constitution.md` (v3.0.0). One line per principle; every ❌ needs a row in *Complexity Tracking*.

*Constitution v3.0.1 (2026-09-30) differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182); Principle IX is N/A for this feature, so no answer changes.*

**The gate and the loop (I–V)**

- [x] I. The presenter is a reader only: it writes no state, nothing waits for it, and a failed, missing or killed presenter changes no run (F145-FR-001, F145-SC-003)
- [x] II. N/A: no gate, verdict or approval lives here — the presenter renders the verdict records of the phase gate (feature 100) as text
- [x] III. Text in events is data: rendered as text, never interpreted (F145-FR-003, F145-FR-004); the presenter runs no check and calls no model
- [x] IV. N/A: no spec grammar — the rail and the timeline take phase counts and titles from the events
- [x] V. Best-effort: the presenter swallows its own failures and a closed pipe and ends 0 (F145-FR-001, F145-SC-003)

**The product and its edges (VI–XII)**

- [x] VI. Strict TypeScript, no native module, `npm install`; consumes EP-08 `specstride.event-sink/1` with a version and implements none (F145-FR-022)
- [x] VII. N/A: no harness name in control flow — backend and provider names arrive as event data and are only rendered (F145-FR-003)
- [x] VIII. N/A: no proposer pass, no prompt, no session
- [x] IX. N/A: no critic call; the presenter renders verdict events only
- [x] X. N/A: no harness adapter — model and schema versions arrive inside `agent_*` events (F145-FR-004)
- [x] XI. Reads the compatibility projection for the as-is lines and never re-derives them (F145-FR-022); free text was redacted at ingress (annex X §X.4)
- [x] XII. No paid call in any test: the colour table test and the pseudo-terminal fixtures are hermetic; macOS behaviour is `unverified` (F145-FR-013 `status:`)

**The host skill (XIII–XVII)**

- [x] XIII. N/A: no model output is judged here — facts and judgment arrive as events with provenance, and the presenter records nothing
- [x] XIV. N/A: no verification command is invented — verification lines are rendered from events (F145-FR-003)
- [x] XV. N/A: rendering is not invocation — consent and dry-run stay with the front door (feature 119)
- [x] XVI. N/A: no supervision — a stop request is only displayed (F145-FR-008)
- [x] XVII. A missing prerequisite is a skip with its reason: T025 runs the feature's tests on the macOS runner when it exists and reports every skip with its reason; every macOS statement stays `unverified` (F145-FR-013; the feature's tests run on a pseudo-terminal)
- [x] XX. N/A: this feature declares no parallel work and merges no tree

**The rewrite (XVIII–XIX)**

- [x] XVIII. Every carried item cites origin, disposition and test; the intended differences are DV-006, DV-007, DV-027 and DV-066, the rows in the `divergence:` fields of `spec.md`
- [x] XIX. The presenter prints to a person, not to a host; host-facing output and the line budget of the context stay with the front door (F145-FR-020)

No violation; Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/145-presenter/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/presenter.md
├── checklists/requirements.md
├── tasks.md
└── analyze-report.md
```

### Source Code (repository root)

```text
packages/cli/src/present/
├── theme.ts        # colour depth, background, glyph tables
├── banner.ts       # splash, rail, tiers, animation
├── presenter.ts    # modes, options, event source
├── tables.ts       # glyphs, ASCII substitutions, colour codes, tool glyphs, timeline lines per event (data)
├── rail.ts         # rail, totals, heartbeat, helpers
├── card.ts         # card mode
├── follow.ts       # following reader
└── startup.ts      # start-up record, halt banners, live mode
tests/
├── parity/145/
└── characterization/145/
```

**Structure Decision**: a module of `@specstride/cli`, the composition root for commands; no other package renders these lines.

## Complexity Tracking

No violation.
