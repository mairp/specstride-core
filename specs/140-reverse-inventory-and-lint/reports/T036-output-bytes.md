# T036 — the bytes of what `reverse inventory` and `reverse lint` print

**Task**: T036 · **Requirements**: F140-FR-001, F140-FR-003, F140-FR-015 ·
**Date**: 2026-10-03.

The measure is the byte helper of T194 of feature 100,
`packages/testkit/src/static/budget.ts`: **bytes of UTF-8, at 2.8 bytes per
token** (F100-FR-187, annex G §G.5, the row "Measure in the build"). The two
caps are *derived* from the helper rather than written out —
`bytesOf(400)` = **1,120** and `bytesOf(800)` = **2,240** — and cross-checked
against feature 108's own constants in
`packages/reverse/src/wrapper/default-output.ts`, which own the cap
(F108-FR-034). Neither side can drift alone.

The measuring test is `packages/reverse/test/output-bytes.test.ts`. It runs in
the package tier (`npm test --workspace @specstride/reverse`) and so inside the
gate's root `npm run test`, and its last suite compares every number below with
what it measured, cell for cell.

**On the paths.** Both verbs can print an absolute path — the inventory prints
the document's path, and the fixture `lint-claims-missing` names a claims file
that was never written — and the length of a temporary path is a property of the
host, not of the output. So the column "Bytes" pins the output with the
temporary root written `<TMP>`, which is deterministic on any host, and the CAP
is measured by the test against the **real** bytes. The column "Real bytes on
this run" is this Linux run's measurement, for the reader.

## 1. `reverse inventory`: default output, within 1,120 bytes (2,240 on a failure)

| Case | Exit | Bytes | Cap | Real bytes on this run | Share of the cap |
|---|---|---|---|---|---|
| success | 0 | 21 | 1120 | 47 | 4.2 % |
| usage: no --out | 2 | 163 | 2240 | 163 | 7.3 % |
| usage: unknown flag | 2 | 150 | 2240 | 150 | 6.7 % |
| invalid: a limit that is not a positive integer | 3 | 95 | 2240 | 95 | 4.2 % |
| invalid: the source is not a directory | 3 | 60 | 2240 | 86 | 3.8 % |

Every case is **well inside** its cap: the largest is 7.3 per cent of it. The
reason is structural and the test measures it rather than arguing it: on success
the verb prints the absolute path of the document and nothing else
(F140-FR-015), so its output is bounded by the path and not by the tree — a
tree of 200 files prints the same bytes as an empty one, which the test asserts
by running both and comparing the two outputs with their paths taken out. On a
failure it prints the usage line, or `reverse-inventory: <message>`
(F140-FR-001), which are fixed texts plus at most one path.

## 2. `reverse lint`: the size per scenario of FX-30, recorded and not capped

This feature adds **no cap to the lint**. F140-FR-003 fixes one as-is line per
finding plus the summary line, and a cap would elide as-is output under the
profile `parity` — which is why `repair-report.md` reports the point to the
orchestrator (its item 3) instead of capping here. What follows is therefore a
**record**, which is what T036 asks for.

"Findings" is the number of findings the scenario raised; "Text" is the bytes of
the default form, "JSON" the bytes of the `--json` form.

| Scenario | Exit | Findings | Text | JSON |
|---|---|---|---|---|
| `FX-30/lint-template-mandatory` | 3 | 1 | 152 | 225 |
| `FX-30/lint-template-family` | 3 | 1 | 172 | 245 |
| `FX-30/lint-template-expected` | 0 | 1 | 146 | 219 |
| `FX-30/lint-placeholder` | 3 | 1 | 110 | 178 |
| `FX-30/lint-structure-extra` | 3 | 1 | 98 | 171 |
| `FX-30/lint-structure-contracts` | 3 | 1 | 97 | 170 |
| `FX-30/lint-structure-required` | 3 | 1 | 99 | 172 |
| `FX-30/lint-evidence-format` | 3 | 1 | 169 | 237 |
| `FX-30/lint-evidence-kind` | 3 | 1 | 103 | 171 |
| `FX-30/lint-evidence-confidence` | 3 | 1 | 122 | 190 |
| `FX-30/lint-evidence-validation` | 3 | 1 | 135 | 203 |
| `FX-30/lint-evidence-disproved` | 3 | 1 | 113 | 181 |
| `FX-30/lint-evidence-citation` | 3 | 1 | 109 | 177 |
| `FX-30/lint-evidence-contradicts` | 3 | 1 | 112 | 180 |
| `FX-30/lint-evidence-missing` | 3 | 1 | 129 | 197 |
| `FX-30/lint-evidence-skipped` | 0 | 1 | 98 | 172 |
| `FX-30/lint-unknowns-placement` | 0 | 1 | 156 | 224 |
| `FX-30/lint-spec-fr-format` | 3 | 1 | 116 | 187 |
| `FX-30/lint-spec-sc-format` | 3 | 1 | 116 | 187 |
| `FX-30/lint-spec-fr-unique` | 3 | 1 | 85 | 153 |
| `FX-30/lint-spec-sc-unique` | 3 | 1 | 85 | 153 |
| `FX-30/lint-spec-story-format` | 3 | 1 | 137 | 205 |
| `FX-30/lint-spec-story-numbers` | 3 | 1 | 112 | 180 |
| `FX-30/lint-spec-story-parts` | 3 | 1 | 100 | 168 |
| `FX-30/lint-spec-clarifications` | 3 | 1 | 119 | 192 |
| `FX-30/lint-research-decisions` | 3 | 1 | 126 | 199 |
| `FX-30/lint-data-model-entities` | 0 | 1 | 93 | 166 |
| `FX-30/lint-checklist-items` | 3 | 1 | 127 | 195 |
| `FX-30/lint-tasks-grammar` | 3 | 1 | 110 | 183 |
| `FX-30/lint-tasks-line-format` | 3 | 1 | 113 | 181 |
| `FX-30/lint-tasks-ids` | 3 | 1 | 74 | 142 |
| `FX-30/lint-tasks-phase-order` | 3 | 1 | 136 | 204 |
| `FX-30/lint-tasks-story-labels` | 3 | 1 | 97 | 165 |
| `FX-30/lint-tasks-story-exists` | 3 | 1 | 106 | 174 |
| `FX-30/lint-tasks-parallel-files` | 3 | 1 | 125 | 193 |
| `FX-30/lint-tasks-mode` | 3 | 4 | 289 | 528 |
| `FX-30/lint-coverage-fr` | 3 | 1 | 88 | 161 |
| `FX-30/lint-claims-missing` | 3 | 1 | 105 | 178 |

### What the record shows

| Fact | Value |
|---|---|
| Scenarios measured | 38, one per finding code of the closed family |
| Smallest text output | `FX-30/lint-tasks-ids`, 74 bytes |
| Largest text output | `FX-30/lint-tasks-mode`, 289 bytes — the one scenario that raises its code four times |
| Largest JSON output | `FX-30/lint-tasks-mode`, 528 bytes |
| Largest share of the 1,120-byte cap | 25.8 per cent (`lint-tasks-mode`, text form) |
| Exit 0 scenarios | 4 — the warning codes `template.expected`, `evidence.skipped`, `unknowns.placement` and `data-model.entities`; a warning alone never fails the lint (F140-FR-001) |

**No scenario of FX-30 breaches the cap**, in either form. The mechanism is in
the table: the bytes follow the number of findings, and a scenario of FX-30
raises one finding (four in one case). The test asserts that too — the
multi-finding scenario is larger than the median single-finding one — so the
record is read correctly: FX-30 is not the risk. A real feature directory with
dozens of findings would be, and that is exactly the open point feature 108 and
the orchestrator hold, not something this feature can settle by capping as-is
output.
