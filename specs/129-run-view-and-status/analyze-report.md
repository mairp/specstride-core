# Analyze report: 129-run-view-and-status

Date: 2026-09-29. Read-only analysis across spec.md, plan.md, tasks.md, with contracts/, data-model.md and research.md. Runs: 2 (one repair after the first run).

## Coverage

| Check | Result |
|---|---|
| Requirement ids unique, in the form of `STAGE-B-RULES.md` section 4 | 36 requirements (F129-FR-001 to F129-FR-036) and 9 success criteria (F129-SC-001 to F129-SC-009); no duplicate; every one has a `test:` |
| Every id referenced in plan, tasks, data-model, research and contracts is defined in the spec | Yes |
| Every requirement has an implementation task (`covers:`) | Yes (36 of 36) |
| Every requirement and success criterion is named in the `proves:` of a test task | Yes (45 of 45) |
| Every test named in the spec (CT-129-1 to CT-129-45) has a task, and every test task is named in the spec | Yes (45 of 45) |
| As-is rows | The one row of the traceability files, 002 FR-017, is `superseded-by DV-042`; it is in the table "As-is behaviour not carried" and its rule is carried by F129-FR-012. No behaviour item and no kept requirement is assigned to this feature |
| `check-traceability.py`, lines for this feature | None. No line names feature 129 or an F129 id |
| Options and switches | Six options; each has its value under `parity`; one new profile row is requested (`status.precompute`) |
| Closed sets that this feature owns | Eight, each with every member and the rule for an unknown value; rows requested for annex X §X.6 |
| Terms, harnesses, machine-specific names, `[NEEDS CLARIFICATION]` | None found. "Gate", "attempt", "hook", "contract" appear only in their qualified forms or in the names of documents |
| Constitution Check | 20 gates answered; no violation |
| Inherited work (spikes, captures, probes) | The brief names none. Tasks T001 to T004 are the first tasks: a measurement of the read cost, a capture on a live host (a paid probe if it needs a model call; not run), and two confirmations |

## Findings

| # | Severity | Finding | Action |
|---|---|---|---|
| 1 | Medium | Annex G §G.6 names three state files and a lease probe as the inputs. The rules of annex B and E need four more values: the newest launch record (`launch-abandoned`, a refused resume), the supervision record (`next=`), the search of the process table (R29v PU-90), and the handshake limit. The brief names the run record, the lease and the pause record | Spec proceeds on the narrowest reading: annex G's three files and the lease probe, and four observations supplied by the caller (F129-FR-001, CQ-161). Reported |
| 2 | Medium | The cursor of annex G §G.6 is file, offset and last `seq`. A change of a state file or of the clock moves none of them, so `wait` could not see it | The token carries a short hash of the change signature (F129-FR-029, F129-FR-030, CQ-164). Reported |
| 3 | Medium | F100-FR-161 says the precomputed line carries `validUntil`. A resting run has no lease | The value `none` for a resting state (F129-FR-028, CQ-163). Feature 113's shim must read it. Reported |
| 4 | Medium | Annex B §B.7 gives `refusal` of the launch record as text. The read model needs the blocked reason and the file | Assumed as separate values (F129-FR-018, CQ-166). Reported |
| 5 | Medium | The closed inputs of the read model hold no source for the per-phase table (titles), the evidence and feedback marks, and the telemetry lines of the baseline's `status`, and no configuration | The facts are taken from events (F129-FR-011, CQ-167); the line that says whether telemetry is configured stays with feature 119. Reported |
| 6 | Low | `@specstride/view` may import only `@specstride/contracts` (package graph). The table evaluator, the redaction function and the hasher live in the kernel | They are injected as functions by the caller (plan.md). Reported |
| 7 | Low | Feature 100's `contracts/schemas/` holds no schema of the view | Task T006 adds it to `@specstride/contracts`; requested in the report |
| 8 | Low | F100-FR-176 forbids a line without an as-is equivalent under `parity`; `status --json` is a record printed on request | The spec applies the rule to `--line`, `--json` and `wait` alike (F129-FR-027, CQ-169). Reported |
| 9 | Low | Annex E and annex G use `stale` in two senses | One field with two reasons (F129-FR-013, CQ-162) |
| 10 | Low | Rows are needed in annex X §X.6 (eight closed sets) and in annex X §X.7 (`status.precompute`) | Reported |

## Repairs made

| Run | Repair |
|---|---|
| 1 | F129-FR-024 said `status` exits 1 when there is no event file. The baseline prints that no run is recorded yet and exits 0 (B-1484), and the edge cases said so. F129-FR-024 now gives exit 1 only for a workspace or a feature without state |
| 1 | F129-FR-028 said the runtime rewrites the line whenever its content changes. Progress fields would then cause a write for every unit of work. The rule is now: whenever the change signature changes and at every heartbeat |
| 1 | The requirement for the liveness table put a requirement sentence after its table. The sentence moved into the paragraph, and the fields follow the table |
| 2 | No new finding |

## Remaining after analysis

Nothing that blocks. The ten `CQ-pending-<n>` marks are open questions with a recommended answer; they are listed in the final message. The requirements are 36, under the limit of about 45: no split is proposed.

## After the cross-feature review

Dated 2026-09-30. Written by the repair agent, from `docs/ecosystem/reviews/REPAIR-WORKLIST.md`, section "Feature 129", and its pointers.

### What changed

- W-129-01: `contracts/signal-table.md` was rebuilt against the event catalogue (row 73 of annex X §X.6): every one of the 124 types as read on 2026-09-30 has a row (54 types in 29 rows) or the mark `ignored` (70), and the critic-call pair opens with `critic.started` and closes with `critic.call`. T003 of `tasks.md` was rewritten: it no longer names as missing the types that the catalogue holds (`phase.ended` with `outcome`, the open pairs of a critic call and of a check, `telemetry.delivery`). No requirement changed.
- W-X-11: the profile row of `status.precompute` is cited as row 127 of annex X §X.7 wherever the text said "to be added" or "new row requested" (F129-FR-008, F129-FR-028, F129-FR-034, the table "Contracts of feature 100 used"); the closed-set rows are cited as rows 243 to 250 of annex X §X.6 (F129-FR-017, F129-FR-035, the section "Closed sets", the same table). Tasks T007, T076 and T083 no longer ask for the granted rows.
- W-X-14: not applied. The Constitution Check of `plan.md` is already in the form of the plan template (group headings, a `[x]` mark and a one-line reason per gate, *Complexity Tracking* at `plan.md:122`); the file is unchanged since its first commit (`fbf1024`).
- W-X-19: `ep: EP-01 specstride.host/1` reads `consumes` in F129-FR-024 and F129-FR-029, and the row of EP-01 in "Extension points" says `consumes` (per the `ep:` row of `STAGE-B-RULES.md` as updated on 2026-09-30). The feature registers no doctor check, so `implements (an entry)` appears nowhere.
- W-X-25: F129-FR-028 names the pointer `workspace:current:status-line` of annex B §B.5 (F100-FR-229); the row "Logical names" lists it.
- W-X-33: F129-FR-025 cites annex G §G.2 and the presenter interface of annex G §G.10 of feature 100 in place of "the lines of feature 119".

A section "Repairs after the cross-feature review" (dated 2026-09-30) was added to `spec.md`; no requirement id, task id or test name was renumbered.

### Consistency pass over the places touched

- Requirement without a task: none new. F129-FR-028's new sentence is covered by T066 to T068 and CT-129-28; the `workspace:current:status-line` pointer is written by the runtime, whose writer task T068 names the line writer call.
- Task without a requirement: none new. The rewritten T003 keeps `proves: F129-FR-011`; T007, T076 and T083 keep their `covers:` and `proves:` lines.
- Terms and values that differ: the row numbers now agree between spec.md (requirements, closed sets, contracts table), tasks.md and `contracts/signal-table.md` (row 127; rows 243 to 250; 124 catalogue types). The count "36 requirements, 9 success criteria" is unchanged. The rows "requested" in the table above are superseded by this section: they were granted as rows 243 to 250 and 127.

## Re-check B-8.7

Dated 2026-09-30. After the second pass of feature 111 the catalogue holds 122 types: the proposed types `critic.passed_over` and `critic.diversity` were retired (F111-FR-052). They left the list "Types marked `ignored`" of `contracts/signal-table.md`, which now has 54 types with a row and 68 marked `ignored`, 0 missing and 0 not in the catalogue. The Constitution Check of `plan.md` now carries the ✅ marks, the version v3.0.0 and the closing statement (W-X-14, which the repair had marked "already done").

## Proposed upstream fixes

Dated 2026-09-30. From the analyze run of this date (finding B3). Ready to apply by the owner of the target; this feature is already written under the proposal.

| # | Target | Change | Why |
|---|---|---|---|
| U-129-01 | `specs/100-specstride/annexes/G-cli.md` §G.3, table "Line grammar", row "Product lines", column "Body" | Replace "Pairs `key=value` separated by one space" with "Pairs `key=value` separated by one space. A text value is quoted as in JSON" | The line `[SPECSTRIDE-ATTENTION]` of F129-FR-025 carries free text (`need`) and a command with a flag (`next=resume --accept-source-change`); without quoting, a space inside a value cannot be told from the separator of two pairs. The supervisor lines of the same table already quote a text value as in JSON, so the rule is reused, not invented. F100-FR-178 keeps the grammar with feature 100, so the row is changed there |

Made correct here under U-129-01: F129-FR-025 (the quoting rule and an assumption line that cites this section), `contracts/status-line.md` (section "Default output of `status`"), T033 of `tasks.md` (the test checks the quoting).

## Requests to feature 100 (task T007, 2026-10-01)

The state of every request this feature ever made of feature 100. Two were **granted on 2026-09-30**
and are from now on CITED and never requested again; one stays **open**; one is **new**, found while
phase 2 was built.

| # | Request | State | Where it is granted or where it stands |
|---|---|---|---|
| R-129-01 | The eight closed sets this feature owns: rows **243 to 250** of annex X §X.6 | **Granted 2026-09-30** | `packages/contracts/data/closed-sets.json` holds rows 243 (lanes of the read model), 244 (kinds of attention item), 245 (budget levels), 246 (liveness values of the read model), 247 (reasons of `stale`), 248 (keys of the status line), 249 (quota states of a budget row) and 250 (rows of the lane table), each with `"owner": "129"`, its members and its rule for an unknown value. The section "Closed sets" of `spec.md` states the same eight rows. Cited, not requested again |
| R-129-02 | The profile switch `status.precompute`: **row 127** of annex X §X.7 | **Granted 2026-09-30** | `packages/contracts/data/parity-profile.json`, switch 127: key `status.precompute`, default `on`, under `parity` `off`, owner `129`, register row `DV-034`. Feature 110's `contracts/config-keys.tsv` row 244 carries the same row number. Cited, not requested again |
| R-129-03 | The machine-readable **schema of the view** in `contracts/schemas/` | **OPEN** | Feature 100's `contracts/schemas/` holds no schema of the view, and annex G §G.6 gives the interface in words only. Until feature 100 takes it, the schema is written and owned here (`contracts/schemas/run-view.schema.json`, task T006) and delivered into `@specstride/contracts` by `contracts/deliver.json`, the mechanism T299 of feature 100 offers another feature. Nothing of this feature waits on the request |
| R-129-04 | Add `@specstride/view` to the `mayImport` of `@specstride/cli` in annex A §A.2 | **NEW, open (2026-10-01)** | The import-boundary check refuses an import between two packages of layer L6 unless the importing entry NAMES the target: `packages/contracts/data/package-graph.json` gives `@specstride/doctor` the explicit entry `@specstride/view`, and gives `@specstride/cli` the prose `"every package above"`, which the same-layer rule of `tools/import-boundary/src/rules.ts` does not accept. F129-FR-032 requires every command to read `RunView`, so `@specstride/cli` must be able to import `@specstride/view`. **Nothing of feature 100 was edited.** Until it is granted, `packages/cli/src/status/` takes the pure rules of the read model as a FUNCTION from its caller and declares the one record it shares (`SeqGap`) itself; both places say so in a comment that names this row |

No other request of feature 100 is open. The contracts of feature 100 this feature uses are listed
in `spec.md`, "Contracts of feature 100 used"; every one of them exists.

## Requests to feature 111 (task T083, 2026-10-01)

The two requests of the table "Findings" that name material feature 111 owns were REPORTED to
feature 111 with its second pass (2026-09-30) and were settled there; none stays open:

- **The fields of a launch record** (finding 4): annex B §B.7 gave `refusal` of the launch
  record as one text. The read model needs the blocked reason and the file as separate values
  (F129-FR-018, CQ-166). Feature 111's second pass kept the launch-record events in the
  catalogue with their fields as asked (`specs/111-event-schema-and-projection/repair-report.md`,
  repair 3); this feature reads the two values from the named state files of annex B, and nothing
  waits on feature 111.
- **The fields of the cursor** (finding 2): annex G §G.6 gave the cursor as file, offset and last
  `seq`, which no change of a state file or of the clock moves. The token carries a short hash of
  the change signature (F129-FR-029, F129-FR-030, CQ-164); reported with the second pass, and the
  catalogue that pass produced is the one `contracts/signal-table.md` freezes (task T003).

The closed-set rows 243 to 250 of annex X §X.6 and the profile row 127 of annex X §X.7 were
granted on 2026-09-30 and need no request (R-129-01, R-129-02). No other request to feature 111
is open.
