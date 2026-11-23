# Implementation Plan: Harness roles and the critic order (feature 124, after the split)

**Branch**: `124-harness-discovery-and-roles` (a label; the directory is `specs/124-harness-discovery-and-roles`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/124-harness-discovery-and-roles/spec.md`

## Summary

Feature 124 decides, at launch, which harness plays which role. It reads the list of harnesses
that the resolved registry holds (feature 100, annex C §C.6, field `harnesses`) and writes one
record, the resolved registry with its role plan, which the engine walks and which a resume
replays. Harness discovery left with the split (feature 146).

| Deliverable | What it is | Requirements |
|---|---|---|
| Registry writer and replay | The record at `run:<runId>:registry`; replay on resume and relaunch | F124-FR-021, F124-FR-022 |
| Role resolver | The plan per phase and role; names, models, fallbacks, terms decisions, preflight; refusals | F124-FR-020, F124-FR-023 to F124-FR-036 |
| Critic order | Qualification, the ranking table, the pick, the pass-over, the switch | F124-FR-037 to F124-FR-044, F124-FR-048 |
| Critic-diversity rule | The critic-diversity warning at launch and as a rule the engine applies before a call | F124-FR-045 to F124-FR-047 |
| Reading for the doctor | The same ranking without a write | F124-FR-049 |
| Switches | Rows 90, 91 and 92 of the `parity` profile (annex X §X.7) | F124-FR-028, F124-FR-042, F124-FR-045 |

Approach: role resolution is a pure function. The one act on the machine is the write of the
record. Ranking and qualification are data (`contracts/ranking-table.json`,
`contracts/qualification.json`) evaluated by the table evaluator of feature 100.

## Technical Context

**Language/Version**: TypeScript 5.x, `strict`, ECMAScript modules, on Node.js 22 or later

**Primary Dependencies**: `@specstride/contracts` (schemas, closed sets, logical names, the registry schema), `@specstride/kernel` (table evaluator, atomic write). No dependency from npm of its own. The terms gate and the resolved configuration are handed in by the composition root as interfaces of `@specstride/contracts`, because the package graph lets `@specstride/harness` import neither `@specstride/config` nor `@specstride/policy`

**Storage**: files, by logical name (feature 100, annex B §B.5). Written: `run:<runId>:registry`. Read: `user:config` and `project:config` through the resolved configuration. Shipped data: the ranking table and the conditions of qualification

**Testing**: the test runner that Node ships (`node:test`); fake executables and a fake endpoint on loopback from `@specstride/testkit`; lists of harnesses as fixture data; parity tests through the oracle of feature 141. No test calls a model, a paid service or a host other than loopback

**Target Platform**: Linux and macOS. Every macOS statement is `unverified` until a macOS runner has passed (ruling 67)

**Project Type**: part of one package of the npm workspace, `@specstride/harness` (layer L1), which the features of the harness layer share. This feature owns the directory `roles/` in it

**Performance Goals**: starting values with low confidence. Role resolution on a registry of 50 harnesses and 20 phases: under 50 ms. Launch output of this feature: at most 3 lines and 600 bytes

**Constraints**: no write but the one record; no network request; no native module; no paid call in a test; no path, account or name of the owner's machines, the locally registered backend included; no harness name in control flow

**Scale/Scope**: 30 functional requirements (F124-FR-020 to F124-FR-049), 5 success criteria; 7 behaviour items carried in 7 clusters, 6 superseded; 4 closed sets; rows 90, 91 and 92 of the `parity` profile; fixture families cited: FX-01, FX-07, FX-18; 41 tasks

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v3.0.0. The brief names VII, II, IX, XII, XIII and X as the principles that bind
this feature; every gate is answered.

*Constitution v3.0.1 (2026-09-30) differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182). The row of Principle IX below was re-read against that sentence at the analyze run of 2026-09-30: the weaker proof is a proof route of a tested harness adapter; this feature consumes it (F124-FR-048) and makes no proof itself.*

**The gate and the loop (I–V)**

- [x] I. ✅ The one record is written by a temporary name and a rename. A resume reads the record and never a value held in memory (F124-FR-022)
- [x] II. ✅ This feature produces no verdict. It keeps the critic apart from the proposer: the order prefers another provider or model (F124-FR-037, condition Q5), and a same-model setup raises the critic-diversity warning and never blocks (F124-FR-045, F124-FR-046)
- [x] III. ✅ A selection of the critic in project configuration is ignored (F124-FR-026); a claim of a harness is believed only as far as the call record proves (F124-FR-048)
- [x] IV. N/A. This feature reads no specification. It takes the list of phases from the canonical model through its caller
- [x] V. ✅ Events of this feature go through the one writer; no sink is called here. The warning never fails a launch (F124-FR-045)

**The product and its edges (VI–XII)**

- [x] VI. ✅ Strict TypeScript; every record and data file has a schema; no provider SDK, no host API; no dependency from npm; extension points: EP-02 `specstride.harness/1` (implements role resolution, consumes `preflight`), EP-11 `specstride.terms/1`, EP-14 `specstride.doctor/1`, EP-18 `specstride.critic-strategy/1` (consumes)
- [x] VII. ✅ Roles are resolved on the one open registry. No list of harnesses is written by hand (F124-FR-031); nothing but the consumer or the shipped default sets the proposer, and a configured critic is never overridden (F124-FR-024, F124-FR-037); a test scans the sources of this feature for harness names in control flow
- [x] VIII. ✅ An absent credential is found before the first pass (F124-FR-034). This feature starts no pass
- [x] IX. ✅ Only a form that the runtime proves qualifies (conditions Q2, Q10; F124-FR-039, F124-FR-048). A harness without a known window never qualifies (condition Q4). A candidate with read-only tools qualifies only through a tested harness adapter and is passed over when the read denial is not confirmed (F124-FR-041). Re-read against v3.0.1: where a tested harness adapter's stream carries no initial record, the adapter MAY prove the tool-less form by the weaker proof (version pin, flag set, preflight; CQ-182); this feature believes that proof as F124-FR-048 says, recorded as the weaker proof, and the proof itself is made only by the harness adapters (features 125, 130, 131, 134, 138)
- [x] X. ✅ The resolved registry records the version of every harness and the hash of its harness descriptor (F124-FR-021); a changed version gives a warning on resume (F124-FR-022)
- [x] XI. ✅ Unknown values stay null in the record; the model of a role is null where the consumer named none (F124-FR-027). This feature reads no stream
- [x] XII. ✅ No test calls a paid API; the terms gate is asked for every entry (F124-FR-032); unknown terms mean auth tier 1 or 2, only when named (F124-FR-036); no model id is in a rule: the ranking table compares classes and sizes

**The host skill (XIII–XVII)**

- [x] XIII. ✅ Ranking is a pure table, and every decision is recorded with its rule id and the version of the table (F124-FR-040). No model takes part
- [x] XIV. N/A. This feature declares and runs no verification command
- [x] XV. ✅ No flag, comment or mode bypasses the terms gate or the spending cap: a metered candidate without a cap does not qualify (F124-FR-042), and a refused entry never enters the plan (F124-FR-032)
- [x] XVI. ✅ A resume and a relaunch read the stored plan (F124-FR-022). This feature relaunches nothing and spends no budget
- [x] XVII. ✅ A test whose prerequisite is absent (a macOS runner) is a skip with its reason
- [x] XX. N/A. This feature runs no work in parallel units. It reads one fact of parallel units: whether the worker root is empty (F124-FR-041)

**The rewrite (XVIII–XIX)**

- [x] XVIII. ✅ Seven carried items cite origin, disposition and test (F124-FR-026, F124-FR-027, F124-FR-029 to F124-FR-031). Six superseded items are listed with DV-004. Intended differences cite DV-004, DV-048, DV-049, DV-064, DV-066, DV-081 and DV-104. Under the `parity` profile the automatic pick is not reached
- [x] XIX. ✅ Launch output of this feature is at most 3 lines and 600 bytes (about 215 tokens at 2.8 bytes per token), a share of the 8,000 tokens of `specstride-run`; the build measures it. Under `parity` it prints nothing new

**Result**: no violation. Re-checked after Phase 1 and after the split; the result stands.

## Project Structure

### Documentation (this feature)

```text
specs/124-harness-discovery-and-roles/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── README.md
│   ├── closed-sets.json
│   ├── qualification.json
│   ├── ranking-table.json
│   ├── parity-rows.json
│   ├── config-keys.json
│   ├── output-lines.json
│   ├── requirements.json
│   └── schemas/
│       └── critic-pick.schema.json
├── checklists/requirements.md
├── analyze-report.md
├── repair-report.md
└── tasks.md
```

### Source Code (repository root)

```text
packages/harness/
├── src/
│   └── roles/
│       ├── resolve.ts             # the role plan; pure
│       ├── names.ts               # as-is spelling of a role name; the rendered list
│       ├── proposer.ts            # the guarantee and the refusal
│       ├── critic-order.ts        # the four steps
│       ├── qualify.ts             # conditions Q1 to Q10, from data
│       ├── rank.ts                # the ranking table through the table evaluator
│       ├── diversity.ts           # identity of provider and model; the warning rule
│       ├── announce.ts            # the lines of this feature
│       ├── registry-writer.ts     # the record, atomic
│       ├── types.ts               # candidate, plan entry, critic pick
│       ├── replay.ts              # resume and relaunch
│       └── dry-pick.ts            # the reading for the doctor
├── data/
│   ├── ranking-table.json
│   └── qualification.json
└── tests/
    ├── roles/                     # CT-124-20 to CT-124-49
    ├── conformance/               # the extended descriptor-only fixture
    └── static/
tests/
├── parity/124/                    # PT-124-C-012, C-051, C-054, C-057, C-060, C-061, C-066; the waiver test of FX-01
└── characterization/124/          # CT-124-50, the usage list of the pass loop (B-0640)
```

The place of the parity tests and of `CT-124-50` is the rule of the plan of feature 100: at the
root of the repository, never inside a package. `CT-124-20` to `CT-124-49` test new behaviour and
stay in the package.

**Structure Decision**: one directory inside `packages/harness`. It takes the list of harnesses
as an argument, in the form of the field `harnesses` of feature 100, annex C §C.6, and imports
no harness adapter, no configuration loader and no policy package; the composition root in
`@specstride/cli` hands those in.

## Complexity Tracking

No violation of the constitution. Nothing to justify.
