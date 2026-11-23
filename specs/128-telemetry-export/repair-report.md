# Repair report — 128-telemetry-export

Written by the repair agent of feature 128 on 2026-09-30, from the section "Feature 128" of section 2 of
`docs/ecosystem/reviews/REPAIR-WORKLIST.md`. All paths are relative to `specs/128-telemetry-export/`
unless they start with `specs/` or `docs/`. Line numbers are those of the files after the repair.
Every item was checked against the file before it was changed. No id was renumbered or reused.

| Item | Class | Severity | State (`done`, `not applied`, `open`) | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-128-01 | repair | medium | done | `contracts/span-state.schema.json` (`$id`, `schema`, `v` removed); `spec.md` F128-FR-018; `data-model.md:62`; `tasks.md` T058 | Verified: the schema held `schema` = `specstride.span-state` and `v` = 1. Now `schema` is the constant `specstride.span-state/1` (annex B §B.20, F100-FR-048) and there is no `v` |
| W-128-02 | repair | low | done | `spec.md` F128-FR-023 (`divergence:`, `parity:`, `assumption: CQ-128`), table "Parts of carried items that are not carried" (B-2297), clarification on the content accessor, sources line; `tasks.md` T083; `plan.md` row XVIII; `research.md` | Verified: no file of the feature cited DV-107. The row exists (`docs/ecosystem/consolidation.md:1006`) |
| W-128-03 | repair | low | done | `spec.md` F128-FR-026 (text and `test:`), row B-2422 of the table of parts not carried; `tasks.md` T086 (new), T035 (the label is no longer claimed by the parity test); `plan.md` Testing and structure; `research.md` D5 | New test CT-128-23. Baseline evidence: `git -C /root/specstride show 9cab15d:lib/ralph_otel_ship.py`, line 328, `"sink": "otlp"` |
| W-128-04 | repair | low | done | `spec.md` F128-FR-009, F128-FR-014, tables "Forms of a payload" and "Scopes of a span"; `contracts/as-is-openers-closers.tsv:8`; `contracts/span-scopes.tsv:8`; `contracts/payload-forms.tsv:2`; `tasks.md` T009, T052 | `api_request` is made from `stream.result`, `tool_use` from `tool.call`, `gate` stands for `verdict.recorded`. One difference from the worklist: no caller of the baseline ships an event named `gate` (the OTLP shipper only recognises it, `lib/ralph_otel_ship.py:211`), so the spec says that a run ships no event of that name and that the name feeds the old metric only. The as-is opener of `yield` is `yield_wait`, as `lib/ralph_otel_spans.py:51` |
| W-110-03 (pointer) | repair | high | done here; open at feature 110 | `spec.md` F128-FR-002, F128-FR-004, F128-FR-010, row "Alias table" of "Contracts of feature 100 used"; `plan.md` row VIII; `tasks.md` T004, T011, T020 | All seven names are read by the baseline (evidence below), so none was removed. They are cited through §K.8 of feature 110, which does not hold them yet |
| W-110-04 (pointer) | repair | high | done | `spec.md`, table "Rows of the `parity` profile", row "Form of a payload"; table "Out of scope" | The owner of `compat.legacyEvents` is 144 (row 17 of annex X §X.7) |
| W-126-02 (pointer) | repair | high | not applied | — | No change is asked: `contracts/payload-forms.tsv:8` takes the time from "ts of the event" |
| W-X-01 (pointer) | repair | high | done | `plan.md` Primary Dependencies, Project Type, Source Code, Structure Decision; `tasks.md` T002 and 47 lines with paths; `quickstart.md:12` | The package is `@specstride/observability` (L1, owners 111, 128, 144); the exporter lives in `packages/observability/src/export/`; `@specstride/kernel` added to the dependencies |
| W-X-04 (pointer) | repair | high | done | `contracts/config-keys.tsv:3`, `:7` to `:11` | Five keys renamed to the spelling of feature 110; the default of `telemetry.content` is `auto`. `spec.md` F128-FR-036 states the values `auto` and `off` |
| W-X-05 (pointer) | repair | medium | done | `spec.md`, "Assumptions" | 113 register rows (DV-001 to DV-113); the queue runs to CQ-194 |
| W-X-07 (pointer) | repair | medium | done | `plan.md` row X; `research.md`, last entry of "Facts that stay `unverified`" | The image versions are pinned in `research.md`; the versions of the two attribute conventions are not pinned, task T072 records them |
| W-X-10 (pointer) | repair | medium | done | `spec.md` F128-FR-034 (`assumption:`), row CQ-123 of "Assumptions", "Contracts of feature 100 used"; `plan.md` re-check; `research.md` | Cites annex B §B.5 for `package:context-budget` |
| W-X-11 (pointer) | repair | medium | done | `spec.md` F128-FR-008, F128-FR-010, F128-FR-040 (`parity:`), the sentence on row 46; `contracts/config-keys.tsv` (column `annex_x7_row` by number, new column `status` = `confirmed`); `contracts/README.md` | Rows 46 and 97 to 106 exist in annex X §X.7 |
| W-X-20 (pointer) | repair | medium | done | `tasks.md` T011, T022, T026, T031, T033, T035, T037, T043, T077, T078, T080 | Verified by script: 16 names of `test:` lines were in no task. Now 0 |
| W-X-21 (pointer) | repair | medium | done | `tasks.md`: the 14 tasks named, and T013, T050, T077, T078, which held a test name beside origins | Each `proves:` holds the requirement id whose `test:` line names the test |
| W-100-16 (pointer) | repair | low | done | `contracts/span-state.schema.json:3` | `urn:specstride:schema:specstride.span-state/1`. It is the only schema file of the feature |
| W-X-31 (pointer) | repair | low | done | `spec.md`, last clarification | "the startup check" |
| W-X-33 (pointer) | repair | low | done | `spec.md` F128-FR-039 | One difference from the rule of the worklist: the rule gives "annex X §X.10 for the redaction patterns", but §X.10 of feature 100 is "Integration acceptance". The redactor is annex X §X.4 (F100-FR-205) and the canary test is annex X §X.9 (F100-FR-219); these are cited |
| W-X-35 (pointer) | accept | low | not applied | — | No change asked: `research.md:12`, `:35` keep the old spellings as history |

Counts: 17 done, 2 not applied (no change asked), 0 open in this feature.

## Requirements added or changed in place

None added. 45 functional requirements, 10 success criteria, 86 tasks (T086 is new).

Changed in place (listed in `spec.md`, section "Repairs after the cross-feature review"): F128-FR-002,
F128-FR-004, F128-FR-008, F128-FR-009, F128-FR-010, F128-FR-014, F128-FR-018, F128-FR-023,
F128-FR-026, F128-FR-034, F128-FR-036, F128-FR-039, F128-FR-040.

New test name: CT-128-23 (characterization test of the sink label `otel`), task T086,
`proves: F128-FR-026; B-2422`.

Also corrected, because the repository has overtaken the text: the section "Closed sets" of `spec.md`
said that annex X §X.6 holds no row of this feature; it holds rows 197 to 204, owner 128.

## What another feature or the orchestrator must do

| # | Who | What | Evidence |
|---|---|---|---|
| 1 | 110 (and 100, if the names go to annex X §X.8) | Add seven as-is environment names to the alias table. All seven are read by the baseline, so this feature keeps them | `git -C /root/specstride show 9cab15d:<path>`: `lib/ralph_otel_spans.py:77` reads `SPECSTRIDE_OTEL_TRACES` (default `true`; `false`, `0`, `no`, `off` switch off) → `telemetry.otel.traces`. `lib/ralph_loki_ship.py:31` `RALPH_LOKI_TIMEOUT` (decimal seconds, default 2.5) → `telemetry.loki.timeoutMs`; `:32` `RALPH_LOKI_MAX_BATCH_BYTES` → `telemetry.loki.maxBatchBytes`; `:292` `RALPH_LOKI_URL` → `telemetry.loki.url`. `lib/ralph_otel_ship.py:39` `RALPH_OTEL_TIMEOUT` → `telemetry.otel.timeoutMs`; `:40` `RALPH_OTEL_MAX_BATCH_BYTES` → `telemetry.otel.maxBatchBytes`; `:462` `RALPH_OTEL_URL` → `telemetry.otel.url`. The two time limits are converted from seconds to milliseconds |
| 2 | 110 | `specs/110-config-and-terms/contracts/config-keys.tsv` holds every key of this feature, so no spelling was invented. Four cells look wrong: line 147 and 148 give both addresses as the default of each URL key; lines 240 and 241 give `262144; 16384` for each of the two content limits; lines 248 and 249 give `2000; 10000` for each of `telemetry.flush.intervalMs` and `telemetry.queueMaxEvents`, and the type "milliseconds" for the buffer, which is a count of events; line 248 says "as default" under `parity`, while row 104 of annex X §X.7 says 0 | The lines named |
| 3 | 110 | Owner of `compat.legacyEvents` in line 162 of the key list is 111; annex X §X.7 row 17 says 144 (W-110-04) | `specs/100-specstride/annexes/X-cross-layer.md:482` |
| 4 | 110, 111 | Trust class of `telemetry.sinkTimeoutMs`: the key list of 110 says widening (`W`), `contracts/config-keys.tsv` of this feature says narrowing. The owner is 111; this feature did not change its value and follows what 110 and 111 decide. The two content limits were set to narrowing here, as the key list of 110 has them (before: neutral) | `specs/110-config-and-terms/contracts/config-keys.tsv:150`, `:240`, `:241` |
| 5 | Orchestrator | The rule of W-X-33 names annex X §X.10 for the redaction patterns; that section is "Integration acceptance". The redactor is §X.4 | `specs/100-specstride/annexes/X-cross-layer.md:128`, `:862` |
| 6 | 126 | `check-traceability.py --require-all` fails on one line of feature 126: `[h2] F126-FR-016: still cites a register row to be written (DV-new-1)` | Output of the check on 2026-09-30 |
| 7 | 141 | The waiver of DV-107 for the absent field `result_preview` on FX-31 is assumed to be in force (task T083) | `docs/ecosystem/consolidation.md:1006` |
| 8 | 144 | This feature holds the three shipper names `api_request`, `tool_use`, `gate` itself, because the projection has no row for them (`specs/144-compatibility-projection/spec.md:200`). If 144 adds rows for them, F128-FR-009 reads them from the table | — |

## New questions (each with a recommended answer and its source)

| # | Question | Sources | Recommended answer | If answered otherwise |
|---|---|---|---|---|
| N-1 | No caller of the baseline ships an event named `gate`; the OTLP shipper only recognises it as the input of the metric `ralph.gate`. Does the port ship an event of that name? | `lib/ralph_otel_ship.py:34`, `:211` at `9cab15d`; B-2313, B-2328 | No. The verdict is shipped as `verdict`; with the old metric names on, `verdict.recorded` feeds `ralph.gate` | A second shipped event per verdict, which the payloads of the baseline do not hold; a register row and a waiver on FX-31 |

No `CQ-pending-*` placeholder stood in the feature. CQ-128 is now named by F128-FR-023.

## Register rows needed (with the text)

None. DV-107 exists and is now cited.

## Checks

| Check | Result |
|---|---|
| Generator or check in `contracts/tools/` | The feature has none |
| `python3 docs/ecosystem/check-traceability.py --require-all` | FAILED with 1 error, of feature 126 (row 6 above). No line names feature 128 |
| Test names of `spec.md` against `tasks.md` (script of the repair agent) | 0 names without a task; 0 names of tasks without a `test:` line; 0 `proves:` lines with a test name |
| Requirement ids in `tasks.md` | 45 of 45 covered; 0 unknown ids |
| `contracts/span-state.schema.json` | Parses as JSON |
| The five `.tsv` files | Every line has the number of columns of its header |
| Requirements | 45, at the limit; no split is proposed |
