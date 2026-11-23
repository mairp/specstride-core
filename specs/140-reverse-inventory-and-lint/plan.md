# Implementation Plan: Reverse inventory and lint (feature 140)

**Branch**: `140-reverse-inventory-and-lint` (a label; the directory is `specs/140-reverse-inventory-and-lint`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/140-reverse-inventory-and-lint/spec.md`

## Summary

Feature 140 is group G-B of the split of `108-reverse`. It builds the source inventory (walk, entries, manifests, units, fingerprint, summary), the reverse lint with its 38 finding codes and six levels, and the five shipped Spec Kit templates. It builds no wrapper, plan, driver, guard or run request.

| Deliverable | Requirements |
|---|---|
| Exit codes, lint arguments, output, levels | F140-FR-001 to F140-FR-004 |
| Lint rules: templates, placeholders, structure, evidence, citations, spec, design, tasks, coverage, claims | F140-FR-005 to F140-FR-014 |
| Inventory: verb, limits, walks, classification, entries, document, fingerprint, manifests, entry points, units, Spec Kit facts, summary | F140-FR-015 to F140-FR-025 |
| Shipped templates | F140-FR-026 |

Approach: a port of the lint part of `lib/reverse.py` and of `lib/reverse_inventory.py` at `9cab15d`, with paths of state replaced by logical names of feature 100. Serializations that the fingerprint or a compared file depends on are reproduced byte for byte.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), ECMAScript modules, on Node.js 22 or later.

**Primary Dependencies**: `@specstride/contracts`, `@specstride/kernel` (atomic write and the canonical hasher of feature 104), `@specstride/spec-formats` (the `speckit-tasks` validation, EP-03). Git is called as a process. No TOML reader is bundled (F140-FR-022).

**Storage**: files, by logical name: `reverse:<slug>:inventory` (control plane), `reverse:<slug>:inventory-summary` (workspace part), `package:templates:<name>` (package).

**Testing**: the test runner that Node ships; fake `git`; fixtures of family FX-30; no model call, no network.

**Target Platform**: Linux and macOS; every macOS statement `unverified` until a runner passes the oracle (task T035 runs the tests there and records the result).

**Project Type**: directories `src/inventory/`, `src/lint/` and `templates/` of the package `@specstride/reverse` of `package-graph.json`, layer L6. The package graph names features 108 and 140 as owners of this package; it may import `@specstride/contracts`, `@specstride/kernel` and `@specstride/spec-formats`.

**Performance Goals**: starting values, low confidence: an inventory of 10,000 files under 5 s; hashing in 64 KiB chunks.

**Constraints**: no native module; no path, account or name of the owner's machines; sorting by code point; the source is never written.

**Scale/Scope**: 26 functional requirements, 3 success criteria, 36 tasks, 245 behaviour items in 14 whole clusters and 6 divided clusters, one as-is requirement (028 FR-027), fixture family FX-30, 38 finding codes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v3.0.0.

*Constitution v3.0.1 (2026-09-30) differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182); Principle IX is N/A for this feature, so no answer changes.*

**The gate and the loop (I–V)**

- [x] I. ✅ Every file the inventory writes is written atomically (F140-FR-025); nothing is a watcher or a service.
- [x] II. ✅ The lint and the inventory produce no verdict and approve nothing.
- [x] III. ✅ The lint is deterministic and fixed; source text is evidence and never instruction; citations into generated artifacts are rejected (F140-FR-010).
- [x] IV. ✅ Task grammar is read through the spec-format adapter (F140-FR-013); there is no second parser of `tasks.md`.
- [x] V. ✅ Nothing here observes a run.

**The product and its edges (VI–XII)**

- [x] VI. ✅ Strict TypeScript; the inventory and the finding codes are validated against schemas in `contracts/`; EP-03 consumed, no extension point implemented.
- [x] VII. ✅ No harness is named or enumerated.
- [x] VIII. N/A: no proposer pass runs here.
- [x] IX. N/A: the critic is not touched.
- [x] X. N/A: no harness adapter.
- [x] XI. N/A: no event or telemetry is written by this feature.
- [x] XII. ✅ Tests use fixtures; no paid call; no secret is read.

**The host skill (XIII–XVII)**

- [x] XIII. ✅ The inventory records facts with hashes; claims carry kind, confidence, evidence, contradiction and validation, which the lint checks (F140-FR-008).
- [x] XIV. N/A: no verification command is derived here.
- [x] XV. N/A: no launch.
- [x] XVI. N/A: no supervision.
- [x] XVII. ✅ A test whose prerequisite is missing (`git`, the reference tree, the oracle of feature 141, a macOS runner, a case-insensitive file system) reports a skip with its reason and never a pass; task T035 runs the tests on the macOS runner and records the result, and until then every macOS statement stays `unverified`.
- [x] XX. N/A: no parallel work.

**The rewrite (XVIII–XIX)**

- [x] XVIII. ✅ Every kept as-is item has an `origin:`, a disposition and a `PT-140-*` test; B-1914 is listed with DV-036; DV-006, DV-027, DV-036, DV-066 and DV-116 (the field `schema` of the inventory) are cited; the strategy is not touched.
- [x] XIX. ✅ Share of the budget of the host skill `specstride-reverse` (7,000 tokens, 19,600 bytes at 2.8 bytes per token, annex G §G.5): `reverse inventory` prints one line, the path of the file, within 1,120 bytes, and within 2,240 bytes on a failure. The lint runs as a verification command inside the engine, so its share of a host session is 0 bytes there; called by hand it prints one as-is line per finding and a summary line, which no requirement caps. Task T036 measures both with the helper of T194 of feature 100 and records the size of the lint's output per scenario of FX-30. The inventory summary (24,000 characters) goes to the proposer and not to a host.

Result: every gate passes; Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/140-reverse-inventory-and-lint/
├── spec.md   checklists/requirements.md   plan.md   research.md   data-model.md   quickstart.md
├── contracts/     # finding-codes.json, inventory.schema.json
├── tasks.md
├── analyze-report.md
└── repair-report.md
```

### Source Code (repository root)

```text
packages/reverse/                      # the package of the reverse capability, layer L6
├── src/inventory/   # serialize, walk, entries, project, document, limits, summary, units, cli
├── src/lint/        # lint, findings, templates, evidence, spec, tasks, shipped
├── src/codes.ts     # the closed family of finding codes, from contracts/finding-codes.json
├── data/            # copies of finding-codes.json and inventory.schema.json (T003)
├── templates/       # the five Spec Kit templates with the MIT notice and the recorded commit
└── test/            # CT-140-*
tests/parity/140/    # PT-140-* on FX-30
```

**Structure Decision**: directories of the one package of the reverse capability, as `package-graph.json` names it.

## Physical choices behind the specification

| Subject | Choice |
|---|---|
| Ordering | A comparator by Unicode code point; the default `Array.sort()` is UTF-16 order and differs above U+FFFF |
| JSON | One serializer for documents (sorted keys, one space, non-ASCII kept); one for the fingerprint input (compact, non-ASCII escaped with surrogate pairs) |
| Schema id of the inventory | The key `schema` with `specstride.reverse-inventory/1` sorts between `project` and `schema_version`; it is no input of the fingerprint. The oracle compares the inventory after removing the key (DV-116; rule N-29 of annex X §X.8, confirmed by F141-FR-012) |
| File reads | `lstat` first; regular files opened without following links |
| Git | `git ls-files -co --exclude-standard -z`, `git status --porcelain=v1 -z --untracked-files=all`, `git rev-parse --verify -q HEAD`, with the as-is time limits |
| Regular expressions of the lint | Ported one to one; FX-30 is the proof |
| Templates | Copied unchanged with the notice; the recorded commit in a small text file |
| Config keys | `reverse.maxFileBytes`, `reverse.maxTotalBytes`, `reverse.contextBudget`; feature 110 fixes the spelling |

## What is planned elsewhere

| Subject | Where |
|---|---|
| The wrapper, the plan, the driver spec, the guard | 108 |
| The hasher | 104 |
| The skill text | 113 |

## Complexity Tracking

Every check passes. Nothing to justify.
