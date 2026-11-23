# Data model: Parity oracle (feature 141)

Phase 1 of the plan. Entities of the oracle, their fields, their relations and the states of a
scenario run. Schemas are in `contracts/schemas/`; lists are in `contracts/*.json`.

## Entities

| Entity | Fields | Identity | Validation | Schema or data |
|---|---|---|---|---|
| Pin | `system`, `commit` (40 hex), `tree` (40 hex) | `system` | Two systems; the unpacked tree equals `tree` | `packages/oracle/reference/pins.json` |
| Reference tree | `system`, `root`, `readOnly`, `hashAfterRun` | `system` and scratch root | Unchanged after every run (F141-FR-002) | — |
| Fixture family | `id`, `name`, `status`, `exercises`, `reference`, `system`, `stubs`, `surfaces`, `features`, `variants`, `answersReservation`, `scenarios` | `id`, `FX-nn`, never reused | Active families have at least one scenario; a retired one has none | `contracts/fixture-catalogue.json` |
| Scenario | The fields of `fixture.json`: `id`, `variant`, `system`, `entryPoint`, `command` or `steps`, `environment`, `stubs`, `workdirTemplate`, `assets`, `expectedExit`, `surfaces`, `proves`, `os`, `durationsUnderTest`, `pseudoTerminal`, `waivers`, `prerequisites`, `addedBy` | `FX-nn/<name>`, with the variant for FX-35 and FX-36 | Every field present; verbs and surfaces known; surfaces inside those of the family (F141-FR-012, F141-FR-030) | `schemas/fixture.schema.json` |
| Catalogue entry of a scenario | `name`, `pattern`, `waiver`, `scenarioOf` (the feature that writes and keeps the scenario), `testOf`, `stubsAndVerbs`, `surfacesCompared`, `note`; for a pattern `members` and `source`; for a scenario of a critic family or a harness family `endOnReference` (`entryPoint`, `end`, `stopReason`, `evidence`, `knownBy`: `run` or `read`) | Family and `name` | A name is used once in a family, members included; a member matches its pattern; a pattern of this feature has members; `endOnReference` equals the capture of the reference (F141-FR-013, F141-FR-030) | `contracts/fixture-catalogue.json` |
| Reserved names; request that is no scenario | `families`, `names`, `reservedBy`; `families`, `asked`, `askedBy`, `why` | The names; what was asked | — | `contracts/fixture-catalogue.json`, `reservedNames` and `notScenarios` |
| Stub | `kind`, `executable` or address, `verbs` | `kind`, and the harness for a harness stub | The five rules of §O.3 | `contracts/stub-vocabulary.json` |
| Script | Per stub: steps, each with `verbs` and `args` | The scenario and the stub | One step per invocation index; a call beyond the last step fails with the overrun code | part of `fixture.json` |
| Transcript record | `role`, `harness`, `call`, `argv`, `envNames`, `prompt`, `promptChannel`, `given`, `step`, `overrun` | Scenario, side, role, `call` | No value of a variable; written outside the working directory | `schemas/transcript.schema.json` |
| Capture | `scenario`, `side` (`reference`, `port`), `suite`, `layer` (`off`, `on`), surfaces S-01 to S-16 | Scenario, side, suite, layer | Taken after the run ended | — |
| Normalized capture | The capture after N-01 to N-29; `replacements` per rule | As the capture | A rule with 0 replacements over all fixtures fails the suite | part of `schemas/result.schema.json` |
| Golden capture | A normalized capture of the reference, with `meta` (pins, versions, operating system) | Scenario and variant | No path, account or name of a machine; equals a fresh capture | `packages/oracle/golden/` |
| Result | Per surface: `result`, `row`, `assertions`, `differences` | Scenario, suite, surface | Exactly one of three | `schemas/result.schema.json` |
| Waiver | `fixture`, `surface`, `row`, `difference` (`selector`, `reference`, `port`), `os` | `fixture`, `surface`, `selector` | The row exists and its handling says waiver; it matches a difference | `schemas/waivers.schema.json` |
| Register map entry | `row`, `handling`, `rules`, `families`, `note`, `registerText` | `row` | One entry per row of the register, 113 on 2026-09-29; agrees with the register | `contracts/register-map.json` |
| Test declaration | `name`, `proves`, `fixture`, `surfaces` | `name` | §O.6 | `schemas/test-declaration.schema.json` |
| Exercise map | Per scenario and file of the reference: executed line ranges; `unreached` | The pins | Tracing changes no surface | `schemas/exercise-map.schema.json` |
| Change of the proof column | `file`, `id`, `old_family`, `new_family`, `reason` | `file` and `id` | The id exists in the file; the old family is the one the file names | `followup/proof-column-changes.tsv`, `followup/proof-column-corrections-other.tsv` |
| Inventory supplement row | The fields of an inventory row, and the proposed cluster, disposition, feature and proof | `b_item` (proposed) | Two rows | `contracts/inventory-supplement.tsv` |
| Layer allowlist entry | `row`, `surface`, `match`, `values`, `onlyFixtures` | `row`, `surface`, `match` | Matches at least once over all fixtures | `contracts/layer-allowlist.json` |
| Per-OS expectation | `subject`, `linux`, `macos`, `status` | `subject` | `inferred` until a macOS runner confirmed it | `contracts/per-os-expectations.json` |

## Relations

```text
Pin 1 ── 1 Reference tree
Fixture family 1 ── n Scenario ── n Script ── 1 Stub
Scenario 1 ── n Capture (side × suite × layer) ── 1 Normalized capture
Normalized capture (reference) 1 ── 0..1 Golden capture
Scenario × surface 1 ── 1 Result ── 0..n Waiver ── 1 Register map entry ── 1 register row
Test declaration n ── n Scenario;  Test declaration n ── n behaviour item
Scenario 1 ── 1 Exercise map part;  behaviour item 1 ── 1 evidence line
Layer allowlist entry n ── 1 register row
```

## States of a scenario run

| State | Entered when | Next |
|---|---|---|
| `declared` | The declaration was read and is valid | `skipped`, `prepared`; `refused` when it is not valid |
| `refused` | A field is missing, or a verb, a surface or a family is unknown | end |
| `skipped` | A prerequisite of the side is missing; the reason is recorded | end. At the release check a skip blocks |
| `prepared` | Scratch root, home, temporary directory and stub directory exist; the reference tree is verified | `running` |
| `running` | The driven command runs in the empty environment | `ended` |
| `ended` | The command exited; the processes left behind were listed and then ended | `captured` |
| `captured` | The surfaces were read | `normalized` |
| `normalized` | The assertions ran and the rules were applied | `compared` |
| `compared` | Every surface has a result | end |

A failure of the oracle itself in any state gives `different` on every surface of the scenario
(F141-FR-021).

## Results of a suite

| Condition | Outcome of the suite |
|---|---|
| Every surface of every scenario is `equal` or `waived` | passes, if the four conditions below hold |
| A surface is `different` | fails |
| A normalization rule replaced nothing over all fixtures | fails |
| A waiver matched no difference | fails |
| A register row has no entry in the register map, or the entry disagrees | fails |
| Second suite: an allowlist entry matched nothing; a difference outside the allowlist; unequal counters | fails |
