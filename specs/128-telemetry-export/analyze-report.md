# Analyze report: Telemetry export (feature 128)

Date: 2026-09-29. Read-only analysis of `spec.md`, `plan.md`, `tasks.md`, `data-model.md`, `research.md`, `contracts/`, against the constitution v3.0.0, feature 100, feature 141 and the traceability files. Two passes were made. The first found the four problems in the table "Repaired"; the second found none.

## Result

| Check | Result |
|---|---|
| Requirements | 45 (`F128-FR-001` to `F128-FR-045`); every one has a `test:` |
| Success criteria | 10 (`F128-SC-001` to `F128-SC-010`); every one is measured by a task (table below) |
| Requirements with a task that `covers:` them | 45 of 45 |
| Task references to requirement ids that do not exist | 0 |
| Named tests of the spec (`CT-128-1` to `CT-128-22`, `PT-128-*`) that no task holds | 0 |
| Traceability: kept rows of feature 128 with an `origin:` | 189 of 189 items in 44 clusters, and the 1 as-is requirement 028 FR-022; `check-traceability.py` shows no line `h1`, `h2`, `h3` or `h4` for feature 128 |
| Superseded rows in the table "As-is behaviour not carried" | 2 of 2 (B-0568, B-0569, DV-065) |
| `[NEEDS CLARIFICATION]` markers | 0 |
| Constitution Check | 20 gates answered; all pass or are N/A with a reason |
| Terms | "backend" appears only as a literal label of the as-is form; "attempt", "gate" and "bundle" are qualified or literal |
| Names of the owner's machines, a locally registered backend | none |

## Repaired

| # | Finding | Repair |
|---|---|---|
| 1 | The spec cited a register row (DV-018) that the requirement did not need | Removed from F128-FR-024 |
| 2 | Cross-references in the user stories used earlier requirement numbers | Renumbered to F128-FR-036 to F128-FR-041 where they belong |
| 3 | `tasks.md` said the canary test was T052 | Corrected to T066 |
| 4 | The word "bundled" (the shipped stack) sat near the never-bare term "bundle" | Written "shipped" |

## Coverage of the success criteria

| Criterion | Tasks |
|---|---|
| F128-SC-001 off by default | T015, T016 |
| F128-SC-002 delivery is visible | T028, T035 |
| F128-SC-003 a sink never breaks the loop | T013, T040 |
| F128-SC-004 no canary reaches a collector | T066, T081 |
| F128-SC-005 content follows traces | T060 |
| F128-SC-006 the payloads equal the baseline | T041, T043, T047, T083 |
| F128-SC-007 spans are built at emit time | T052, T054 |
| F128-SC-008 a real collector receives the run | T081 |
| F128-SC-009 every kept item has a proof | T085 |
| F128-SC-010 the doctor facts are complete | T070 |

## Findings that are not repaired here (for the orchestrator)

| # | Finding | Where | What was done |
|---|---|---|---|
| A1 | Row 42 of annex X §X.7 says `otel.legacyMetricNames` is off under `parity`, while F100-FR-212 asks for the value that reproduces the baseline. The baseline sends the old names | Feature 100 | Row 42 read as written; the scenario `metric-names` of FX-31 is waived by DV-058 |
| A2 | Annex C §C.10 says content reaches a sink only while capture is on, and gives the context of `open` no content accessor and no way to learn the as-is name of an event | Feature 100 | Proceeded on the accessor of feature 111 (CQ-032) and on read access to the table of the compatibility projection (CQ-119) |
| A3 | The baseline ships the first 300 characters of the model's final text as `result_preview` on every `api_request`, so DV-083 ("the baseline captures no content") is not exact | DV-083, FX-31 | Treated as content: absent under `parity`; a waiver keyed to DV-083 is needed on the scenarios that feed a result record. No new register row is needed; if the orchestrator prefers one, it reads "the shipped `api_request` carries `result_preview` unredacted; the port sends it only while capture is on, redacted; waiver on FX-31" |
| A4 | Annex X §X.8 maps `SPECSTRIDE_OTEL_STATE_DIR` to `telemetry.*` while annex B §B.5 fixes the place of span state | Feature 100 | Accepted and without effect, with a launch message (CQ-120) |
| A5 | Annex B §B.5 has no logical name for the context-budget report | Feature 100 | `package:context-budget` (CQ-123) |
| A6 | Annex G lists no flags `--telemetry`, `--loki-url`, `--otel`, `--otel-url` for the engine and no flags `-j`, `--loki-url`, `--otel-url` for the pass-loop entry | Feature 100 annex G | Specified in F128-FR-003 and F128-FR-005 as ported flags |
| A7 | Annex X §X.7 has no rows for the options of this feature (listed in the spec's table "Rows of the `parity` profile") | Feature 100 | Rows needed; spelling proposed to feature 110 in `contracts/config-keys.tsv` |
| A8 | The shipped collector has no traces pipeline, while content goes on spans | Baseline B-2458 | Kept as the baseline (CQ-127) |
| A9 | The doctor catalogue (R16 check 42) and "every package registers its own check" (annex G §G.7) leave open who registers `telemetry.endpoint` | Feature 112 | The facts are given here (CQ-126) |

## The split

The specification has 45 requirements, at the limit of about 45. No split is proposed. If the orchestrator wants one, group G4 leaves: F128-FR-042 to F128-FR-045 (the shipped stack), with the origins C-201 to C-208 and the tests CT-128-1 to CT-128-8 and T077 to T080 of `tasks.md`.

## What did not pass

Nothing failed after two passes. The lines `h2` of other features in the output of `check-traceability.py` are not this feature's.

## After the cross-feature review

Date: 2026-09-30. Repairs from section 2 of `docs/ecosystem/reviews/REPAIR-WORKLIST.md` (feature 128: 4 own items, 15 pointers). Every item was checked against the file before it was changed. The items are listed in `repair-report.md`.

### What changed

| File | Change |
|---|---|
| `spec.md` | 13 requirements changed in place (table "Repairs after the cross-feature review" of the spec); the tables "Forms of a payload", "Scopes of a span", "Contracts of feature 100 used", "Rows of the `parity` profile", "Closed sets", "As-is behaviour not carried" and the assumptions follow. No requirement was added or removed |
| `plan.md` | The package is `@specstride/observability`, directory `src/export/`; `@specstride/kernel` is a dependency; row X of the Constitution Check says where the versions are pinned; CT-128-23 |
| `tasks.md` | 47 lines with a path of `packages/telemetry/` now name `packages/observability/`; 18 `proves:` lines name requirement ids in place of test names; 16 test names of the spec that no task held are named by their tasks; task T086 appended for CT-128-23 |
| `contracts/config-keys.tsv` | Five keys in the spelling of feature 110; the default of `telemetry.content` is `auto`; the rows of annex X §X.7 by number; new column `status` |
| `contracts/span-state.schema.json` | `schema` is the constant `specstride.span-state/1`; `v` removed; `$id` in the form `urn:specstride:schema:<schema id>` |
| `contracts/as-is-openers-closers.tsv`, `span-scopes.tsv`, `payload-forms.tsv`, `README.md` | The as-is opener of `yield`; the catalogue types behind `api_request`, `tool_use`, `gate` |
| `data-model.md`, `research.md`, `quickstart.md` | The span state without `v`; CQ-128 and CT-128-23; the value `auto` |

### Consistency pass over the places touched

| Check | Result |
|---|---|
| Requirements | 45, unchanged; every one has a `test:` and a task that `covers:` it |
| Tasks | 86 (T001 to T086); requirement ids in a task that do not exist: 0 |
| Test names of `spec.md` that no task holds | 0 (before: 16, and after the change of the `proves:` lines 4 more, which T077 and T078 now spell out) |
| Test names of `tasks.md` that no `test:` line holds | 0 |
| `proves:` lines that hold a test name | 0 |
| New test CT-128-23 | In the `test:` line of F128-FR-026 and in task T086 (`proves: F128-FR-026; B-2422`) |
| Key spellings | `spec.md`, `contracts/config-keys.tsv`, `plan.md`, `tasks.md`, `data-model.md` and `quickstart.md` hold the spellings of feature 110. `research.md:12` and `:35` keep old spellings as history (W-X-35, accepted) |
| Package name | `packages/telemetry` appears in no file of the feature |
| Span state | `spec.md`, `data-model.md`, the schema file and task T058 agree: `schema` is `specstride.span-state/1`, no `v` |
| `python3 docs/ecosystem/check-traceability.py --require-all` | No line names feature 128. The run fails with one line of another feature: `[h2] F126-FR-016: still cites a register row to be written (DV-new-1)` |

### What stays open

| # | Point |
|---|---|
| 1 | Seven as-is environment names that the baseline reads are cited through §K.8 of feature 110, which does not hold them yet (W-110-03) |
| 2 | Trust classes of two keys differ between this feature and the key list of feature 110 (see `repair-report.md`) |
| 3 | The old entries A5 and A7 of this report are overtaken: annex B §B.5 holds `package:context-budget`, and annex X §X.7 holds rows 97 to 106. They stay above as a record |


## Second analyze run

Date: 2026-09-30. Full `/speckit-analyze` pass over `spec.md`, `plan.md`, `tasks.md` against constitution v3.0.1, with every finding repaired afterwards. Totals: 45 requirements, 10 success criteria, 86 tasks, 100 % coverage; 191 as-is items (175 translated, 14 ported, 2 superseded), each proved through its cluster's test name; 0 CRITICAL.

| ID | Severity | Finding | State |
|---|---|---|---|
| C1 | HIGH | F128-FR-035 kept Lisa's random ids, which conflicts with the derived trace id of F128-FR-017 | Repaired (F128-FR-035) |
| C2 | MEDIUM | T038 and T046 made the exporter print lines, against F128-FR-024 and "Out of scope" | Repaired (the tasks build the text; the printer prints) |
| C3 | MEDIUM | F128-SC-004 "at a real collector" had no task | Repaired (T081 plants the canaries) |
| C4 | MEDIUM | The reply's reference had no attribute names (F128-FR-038) | Repaired (`specstride.reply.*` in `spec.md`, `contracts/attribute-names.tsv`, `data-model.md`, T064) |
| C5 | MEDIUM | P1 stories came after a P2 story with no dependency note | Repaired ("Order" note in `tasks.md`) |
| C6 | MEDIUM | The engine and pass-loop flags were to be implemented in a package the core never imports; feature 110 has no rows mapping the short flags to keys | Proposed upstream (U1, U2); this feature is corrected under the proposal (F128-FR-003, F128-FR-005, T019, T023, `contracts/config-keys.tsv`) |
| C7 to C13 | LOW | Drift: `run.state` attribute, the as-is Loki label `role`, a scenario's citation, cluster C-183 in `origin:`, the split sentence, stale register and queue counts, `repair-report.md` in the plan tree | Repaired |
| C14 | MEDIUM | F128-FR-016 (prefix `specstride.` on every introduced name) conflicted with `input.value` and `output.value` of F128-FR-038 | Repaired (F128-FR-016 names the exception) |

## Proposed upstream fixes

Ready to apply by the owners of the target files. This feature already reads correctly under them. Until they are applied, T019 and T023 record the gap in `packages/observability/data/export/README.md`, and nothing else in this feature waits on them.

### U1 — Feature 110: the short flags of telemetry and their combination rule (finding C6)

**Target:** `specs/110-config-and-terms/spec.md`. Add a new subsection `### §K.10 Short flags of the baseline` after §K.9, or add the rows to an existing short-flag table if T005 of feature 110 has made one by then.

**Text to add:**

> Short flags exist only where the baseline has one (§K.2 rule 4). Each sets its key at rank 2 (flag), as `--set` would, and is taken by the command `run` of annex G §G.1 of feature 100. Owner of the meaning: the feature named.
>
> | Flag | Key and value | Items | Owner |
> |---|---|---|---|
> | `--telemetry` | `telemetry.enabled` = true | C-006 | 128 |
> | `--loki-url URL` | `telemetry.loki.url` = URL | C-006 | 128 |
> | `--otel` | `telemetry.otel.enabled` = true | C-006 | 128 |
> | `--otel-url URL` | `telemetry.otel.url` = URL | C-006 | 128 |
> | `-j`, `--stream-json` | `telemetry.enabled` = true, unless a URL flag is given (rule below) | C-051, C-052, C-058 | 128 |
>
> Rule of the telemetry flags (F128-FR-005). When `--loki-url` or `--otel-url` is given with `-j`, `telemetry.enabled` is set to whether `--loki-url` was given and `telemetry.otel.enabled` to whether `--otel-url` was given, both at rank 2. `--otel` never sets `telemetry.enabled`, and `--telemetry` never sets `telemetry.otel.enabled`.

**Why:** §K.2 rule 4 allows these flags but no table maps them to keys. The combination rule is about which flags were given, and only the flag layer knows that; once flags are resolved to keys the information is gone. `@specstride/observability` is L1 and the core never imports it, so an argument parser there could never be called by the engine. With the table in feature 110, the engine parses flags in one place and the exporter reads resolved keys, as it already does for the environment aliases of §K.8.

### U2 — Feature 100 annex G: pointer from the `run` command to the flag table (finding C6)

**Target:** `specs/100-specstride/annexes/G-cli.md`, §G.1, the `run` row of the command table, column "What it does" (and the same cell in `contracts/annex-tables/G-cli.json` and `contracts/data/cli-protocol.json`, which the generator of feature 100 writes).

**Change:** after "It takes the ported flags of the baseline, among them `--telemetry`, `--loki-url`, `--otel`, `--otel-url` and `-j`", add: "; their keys and the rule that combines them are §K.10 of feature 110".

**Why:** the row names the flags but not where their meaning as keys is fixed. The pointer closes the old item A6 of this report without moving ownership: meaning stays with 128, spelling and rank with 110, and the command with 101.
