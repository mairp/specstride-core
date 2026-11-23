# Analyze report: 126-stream-seam-and-invocation

Run 1 of 2 allowed. Read-only cross-check of spec.md, plan.md, tasks.md.

| Check | Result |
|---|---|
| Requirements | 38 (F126-FR-001 to F126-FR-038); success criteria 7 |
| Kept behaviour items placed | 209 of 209 in an `origin:`; script over `traceability-items.tsv` finds 0 missing |
| Superseded items | 3 (B-0599, B-0673, B-2427, DV-065), listed under "As-is behaviour not carried" |
| Every requirement with an origin has a disposition and a test | yes |
| Every test name of the spec appears in tasks.md | yes after one repair (four names added to T008, T018, T032) |
| Every kept cluster is named by a `proves:` | yes; `check-traceability.py` prints no `[h` line for this feature |
| Paid probes are tasks and say so | T001 (capture of a live stream), T024 (experiment X0) |
| Constitution Check | 20 gates answered; no violation |
| Placeholders, NEEDS CLARIFICATION | none |
| Split | not needed: 38 is under about 45 |

Findings left open, none blocking:

| # | Finding | Where |
|---|---|---|
| 1 | Feature 100 gives no schema id for the invocation artifacts, no logical name for a breaker state file, and no rows in annex X §X.7 for the seven options of the profile table | spec.md, "Rows of the `parity` profile" |
| 2 | Three register rows are needed (DV-101 to DV-103) | F126-FR-017, F126-FR-018, F126-FR-029 |
| 3 | Live shapes of the Claude stream and the per-call usage are `unverified` until T001 | F126-FR-003, F126-FR-022, F126-FR-023 |

## After the cross-feature review (2026-09-30)

Source: section "Feature 126" of `docs/ecosystem/reviews/REPAIR-WORKLIST.md` (four own items, eight pointers). The lines above are the record of 2026-09-29 and were not rewritten; its open findings 1 and 2 are overtaken (annex B §B.20 gives the schema ids, annex X §X.7 has the rows 79 to 85, the register has DV-101 to DV-103).

### What changed

| File | Change |
|---|---|
| `spec.md` | F126-FR-008, -011, -012, -016, -018, -020, -028, -031 changed in place; F126-FR-039 added; edge cases, contracts used, profile table, closed sets, assumptions; the section "Repairs after the cross-feature review" |
| `plan.md` | Package `@specstride/harness`; the Constitution Check in the form of the template with a mark, a reason and a requirement on every row; row VIII and row V name the replacement tap; row XVIII is a stated deviation with a row in Complexity Tracking; source tree |
| `tasks.md` | T002 creates no package; test paths; T001 moved out of the first place and marked as a precondition of nothing; T024 holds the live part of X0 only; T037 to T041 added |
| `contracts/` | Four schema files in `contracts/schemas/`, each with `schema` required; `README.md` cites annex B §B.20 |
| `data-model.md`, `quickstart.md`, `research.md`, `checklists/requirements.md` | Carry the same changes |

### Consistency pass over the places touched

| Check | Result |
|---|---|
| Requirements | 39 (F126-FR-001 to F126-FR-039); success criteria 7. Under 45; no split |
| Tasks | 41 (T001 to T041); no id renumbered; T001 keeps its id and stands in Phase 8 |
| Every new or added test name has a task with `proves:` | CT-126-9: T037; CT-126-10: T038; CT-126-11: T039 |
| Every test name of the spec is in `tasks.md`, and the reverse | yes (script over both files: 0 missing) |
| Requirement without a task | none. F126-FR-039: T037, T040. F126-FR-011: T032, T035, T038, T041. F126-FR-016: T018, T020, T039, T041. F126-FR-020: T029, T035, T039, T041 |
| Task without a requirement | none among T037 to T041 |
| Terms | "registry-routed" and "terminal-tracked" are defined once, in F126-FR-039, and used with that meaning in F126-FR-008, -012, -031, `data-model.md` and T037 |
| Position of an event | `seq` in what a sink receives (F126-FR-020); `sequence` only in the as-is form of the compatibility projection (F126-FR-020, F126-FR-021) |
| Package name | `@specstride/harness` in `plan.md` and `tasks.md`; the names `stream-seam` and `invocation` appear only in the sentence that withdraws them |
| Profile rows | 79 to 85, 16, 17, 18, 19, 45, as in annex X §X.7; keys as in the key list of feature 110 (`config-keys.tsv` lines 215 to 222) |
| Placeholders | no `CQ-pending-*`; one `DV-115` (F126-FR-016), reported |
| Harness names in a condition | none. prime, dsh and Codex appear as examples under the `parity` profile, as owners in "Out of scope", and in the owner's constraint |

### Open

| # | Finding | Where |
|---|---|---|
| 1 | The register row of F126-FR-016 is not written (item W-ORC-02). `check-traceability.py --require-all` fails with one line, `[h2] F126-FR-016: still cites a register row to be written (DV-115)`, until the row exists and the citation carries its number | `spec.md`, F126-FR-016; `plan.md`, row XVIII |
| 2 | `traceability-items.tsv` gives B-2112 as `ported` with no register row; the requirement is now `translated` | `docs/ecosystem/traceability-items.tsv` |
| 3 | Feature 100 names no schema id for the format row and for the normalized records | `contracts/README.md` |
| 4 | The format row `prime-v3`, which feature 138 registers, must set `trackTerminal` | F126-FR-012, F126-FR-031 |

## Third analyze run (2026-09-30)

22 findings. 18 repaired in place and 2 accepted, in the first round. The 2 first marked deferred (E3, C4) are settled by the owner's follow-up: the part inside this folder is applied, and the part outside is proposed below. The record of what changed is in `spec.md`, "Analyze run (2026-09-30)".

## Proposed upstream fixes

Ready to apply. No other feature was edited. Feature 126 is already written to be correct once each proposal is applied.

### P1 (finding C4): the interface through which the engine calls finalization

- **Target**: `specs/100-specstride/annexes/A-foundations.md`, §A.4 "Common rules of every extension point", directly after F100-FR-235. Regenerate `contracts/` with `contracts/tools/generate.py`.
- **Add**:

  > - **F100-FR-237**: The calls of the engine into the invocation code of feature 126 (`reconcile` the observations of one invocation into a result, `finalize` one invocation into the result, its event and a decision of the closed set of row 175 of annex X §X.6, `sweepRetention` of the invocations of a run) MUST be a plain function interface of the `contracts` package at layer L2, which the composition root hands to the engine. It is no extension point in Wave 1. `finalize` takes the invocation identity, the breaker state, the limit, an optional kill reason and an optional cap limit, and returns the decision, the reason code, `is_error`, the count of consecutive errors, the kill class and the cap count (F126-FR-034). The implementation is in `@specstride/harness` (feature 126); the caller is the pass loop (feature 103, F103-FR-013).
  >   - test: CT-100-337

- **Why**: `package-graph.json` lets `@specstride/core` (the pass loop of 103) import only `contracts` and `kernel`, while finalization lives in `@specstride/harness`. F103-FR-013 needs the decision, but no annex names the interface. F100-FR-053 and the rule of the contracts package say a shared interface is feature 100's to declare. F100-FR-235 is the same case for learning and sets the pattern.
- **This feature under P1**: `plan.md` (Project Type, Structure Decision), `contracts/README.md` ("What this feature offers to the engine"), assumption N-126-3, and task T045. T045 is blocked until the type exists, and is never replaced by an import of the harness package from the core.

### P2 (finding E3): the owner of the stream formats `sse-openai` and `sse-anthropic`

- **Target**: `specs/100-specstride/annexes/X-cross-layer.md`, §X.6, row 31, column of the owner. Regenerate `data/closed-sets.json`.
- **Change**: `109; 126` → `109 (the kinds); 126 (the registry; the rows `claude`, `text`, `sse-openai`, `sse-anthropic`); 138 (the rows `jsonl`, `prime-v3`)`
- **Why**: row 31 names six Wave 1 formats, but no feature said who reads the two SSE formats, so a descriptor with `stream.format: sse-openai` would be refused by F109-FR-019 for lack of a reader. The readers of the stream seam are 126's (EP-02 sub-point), so 126 now owns them (F126-FR-040). The JSONL rows are 138's (F100-FR-091). Feature 109 needs no change: F109-FR-019 already hands the raw stream to the reader registered for `stream.format`.
- **This feature under P2**: F126-FR-040 (SSE framing in code, two data mappings, `unverified` until a capture, test CT-126-13, tasks T043 and T044). F126-FR-001 and F126-FR-013 gain the row option `listedAsIs`, so the listing under the `parity` profile stays `claude`, `prime-v3`. F126-FR-007 states who registers each row.
