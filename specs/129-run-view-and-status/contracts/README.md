# Contracts offered by feature 129

Feature 129 owns the content of EP-09 (`specstride.view/1`): the view record, the signal table that maps events to what the view holds, the lane table, the attention items and the status line. The interface text is feature 100's (annex G §G.6). The machine-readable form of the view schema is `schemas/run-view.schema.json`, written here by task T006 and delivered into `@specstride/contracts` by `deliver.json`; feature 100's `contracts/schemas/` holds no schema of the view. Where a file here and annex G differ, annex G stands.

| File | Content |
|---|---|
| `run-view.md` | The fields of the view, with type in words and source |
| `signal-table.md` | Which event type makes the view hold what; the ignored types |
| `lane-and-attention.md` | The lane table L-01 to L-08; the nine kinds of attention item, their keys, order and fixed next commands |
| `status-line.md` | The grammar of the line and of the cursor token; the drop order; the expiry rule |
| `observations.md` | The five observations the caller supplies, their records and owners; the two corrections; the answer to CQ-166 on the form of the `refusal` of a launch record |
| `schemas/run-view.schema.json` | The schema of `specstride.view/1`: every field of `run-view.md`, the bounds of the collections and the eight closed sets of the section "Closed sets" of `spec.md` (task T006) |
| `deliver.json` | The one file this feature delivers into `@specstride/contracts`, through the sync script of feature 100 (T299) |

## Requests to feature 100

The full table, with the state of each request, is in
[`../analyze-report.md`](../analyze-report.md), section "Requests to feature 100 (task T007,
2026-10-01)". In short, and as task T007 asks:

| # | Request | State |
|---|---|---|
| R-129-01 | The closed-set rows **243 to 250** of annex X §X.6 | **Granted on 2026-09-30.** They are in `packages/contracts/data/closed-sets.json` with `"owner": "129"`. **Cited, not requested again** |
| R-129-02 | The profile row **127** of annex X §X.7, the switch `status.precompute` | **Granted on 2026-09-30.** It is switch 127 of `packages/contracts/data/parity-profile.json`, owner `129`, default `on`, `off` under `parity`. **Cited, not requested again** |
| R-129-03 | The **schema of the view** in feature 100's `contracts/schemas/` | **The one request that stays OPEN.** Until it is taken, the schema is owned here (`schemas/run-view.schema.json`) and delivered by `deliver.json`. Nothing waits on it |
| R-129-04 | Add `@specstride/view` to the `mayImport` of `@specstride/cli` in annex A §A.2 | **New and open since 2026-10-01**, found while task T024 was built. The same-layer rule of the import-boundary check needs the target named, and the entry of `@specstride/cli` carries the prose `"every package above"`. No file of feature 100 was edited; `packages/cli/src/status/` works around it and says so |

The test of this table is `tests/characterization/129/t007-requests.test.ts`.

## Requests to feature 111 (task T083)

None stays open. The fields of a launch record (the separate blocked reason and file,
CQ-166) and the fields of the cursor (the signature hash in the token, CQ-164) were reported to
feature 111 with its second pass of 2026-09-30 and were settled there; the full table is in
[`../analyze-report.md`](../analyze-report.md), section "Requests to feature 111 (task T083,
2026-10-01)". The closed-set rows 243 to 250 of annex X §X.6 and the profile row 127 of annex X
§X.7 were granted on 2026-09-30 and need no request.
