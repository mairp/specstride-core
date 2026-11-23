# Orchestrator report: feature 103 (Proposer pass)

**Date**: 2026-10-03 · **Task**: T005 (with one row from T002) · **Kind**: a report, not an edit.

What feature 103 sends the orchestrator at the end of its Setup phase. Nothing here is an edit of
another feature's files: this feature owns `specs/103-proposer-pass/`, the module groups
`packages/core/src/{pass-loop,layers,prompt,carry}/`, `tests/parity/103/`,
`tests/characterization/103/` and the conformance suites and samples of EP-04 and EP-15, and it
writes nowhere else. The two subjects below belong to feature 141 and to feature 100 and are
asked for, not made.

Every claim and every line number below was CHECKED against the data in this workdir —
`docs/ecosystem/traceability-items.tsv`, `docs/ecosystem/traceability-frs.tsv`,
`docs/ecosystem/research/R18-behaviour-inventory.tsv`, `packages/contracts/data/closed-sets.json`
and the Specstride baseline at `9cab15d` — and the check is re-run by
`tests/characterization/103/setup-103.test.ts`, so this report cannot drift from the data it
reports on.

## 1 — The claim check of the exercise map (F141-FR-032): deferred, with 107 claims open

T005 asks this feature to run the claim check of the exercise map for the 106 behaviour items and
028 FR-018 **once the oracle holds the families**, and to give every item that no fixture executes
to the orchestrator as a correction.

**The oracle holds no family.** `packages/oracle/src/index.ts` is the skeleton of the campaign
scaffolding (`// @specstride/oracle: skeleton; the owning features (141) fill it.`). No fixture of
FX-17, FX-18, FX-19, FX-20 or FX-24 has run on the reference, and the capture job of F141-FR-031
has written no exercise map. The precondition of T005 is therefore unmet, and the claim check
cannot confirm a single claim.

**All 107 claims of this feature are open.** Not because a fixture failed to execute them, but
because no fixture has run. This is the correction: it is a request for the exercise map, not a
list of items to be reassigned. No item of this feature is proposed for a change of disposition,
and none is proposed for a characterization test or a register row in place of a fixture
(F141-FR-033): that judgement needs the map.

| What | Count |
|---|---|
| Behaviour items assigned to feature 103 with a kept disposition | 106 |
| As-is requirements assigned to it with a kept disposition | 1 (028 FR-018) |
| Claims the check confirms today | 0 |
| Claims open, pending the exercise map | **107** |

The 20 clusters, which are the unit of a claim of a cluster under F141-FR-032:

| Cluster | Items of this feature | Range |
|---|---|---|
| C-006 | 2 | B-0016 to B-0031 |
| C-007 | 3 | B-0040 to B-0076 |
| C-008 | 3 | B-0091 to B-0095 |
| C-009 | 4 | B-0129 to B-0134 |
| C-010 | 4 | B-0145 to B-0150 |
| C-011 | 1 | B-0178 |
| C-012 | 6 | B-0207 to B-0221 |
| C-013 | 10 | B-0295 to B-0318 |
| C-041 | 1 | B-0444 |
| C-042 | 1 | B-0445 |
| C-043 | 5 | B-0446 to B-0450 |
| C-050 | 1 | B-0462 |
| C-051 | 9 | B-0463 to B-0485 |
| C-052 | 6 | B-0487 to B-0539 |
| C-053 | 5 | B-0549 to B-0562 |
| C-054 | 10 | B-0564 to B-0597 |
| C-055 | 5 | B-0612 to B-2785 |
| C-056 | 2 | B-0617 to B-0637 |
| C-057 | 9 | B-0639 to B-0667 |
| C-058 | 19 | B-0668 to B-0792 |

Three evidence lines carry two claims each, so the check can never confirm one of a pair without
the other: `proposer.sh:207` (B-0463 and B-0670), `proposer.sh:1784` (B-0755 and B-0756) and
`proposer.sh:2365` (B-0597 and **028 FR-018**). The 107 claims lie on 104 distinct lines.

### 1.1 What is asked

| # | Asked of | Request |
|---|---|---|
| 1 | 141 | Write the exercise map of F141-FR-031 for the families FX-17 to FX-20 and FX-24, and say where it is kept. Feature 103's check reads `packages/oracle/data/exercise-map.json`, or the path in `SPECSTRIDE_EXERCISE_MAP`; a different path is fine, and this feature changes its one constant |
| 2 | 141 | Confirm the form the check expects: one record per fixture, `{ fixture, feature, executed: [ { file, line } ] }`, with `file` relative to the root of the reference tree and `line` the line of the baseline at `9cab15d`. The form is stated in `specs/103-proposer-pass/contracts/claim-check.json`, key `exerciseMap.form` |
| 3 | the orchestrator | Nothing to correct in the traceability files yet. The 107 rows stay as they stand; the re-run of the check is what decides whether any of them needs the treatment of F141-FR-033 |

### 1.2 What this feature has done instead

The check itself is written and proved, so that running it is a matter of pointing it at a map:
`tests/characterization/103/setup-103.test.ts` holds `claimCheck()` over
`specs/103-proposer-pass/contracts/claim-check.json` and proves it against exercise maps of its
own making — a complete map confirms all 107, a map with holes names exactly the claims in the
holes, a map of another feature's fixtures confirms nothing, and a neighbouring line or the wrong
file confirms nothing. The authoritative run is one test that skips today with its reason and
fails the moment a map exists and leaves a claim of this feature unexecuted.

## 2 — The nine scenarios `103-<name>` to register in the catalogue of §O.2

The catalogue of `specs/141-parity-oracle/spec.md` §O.2, in the table "Scenarios added after the
first set", holds the row

> `families FX-17, FX-18, FX-19, FX-20, FX-24 | 103-<name> | 103 | 103 | the verbs of §O.3 | the
> surfaces of each family | Names that feature 103 reserves for the usage failures of the pass
> loop and the empty prompt. Not yet named; feature 103 registers each name here when it writes
> it`

The names are now written. The catalogue is the register of scenario names (F141-FR-030) and
belongs to feature 141, which this feature does not edit, so the nine rows are asked for here.
The register from this feature's side is `specs/103-proposer-pass/contracts/scenarios.json`, and
`tests/characterization/103/setup-103.test.ts` checks every one of them against §O.2, §O.3 and
§O.4 as feature 141's own specification states them: the family is in the catalogue and is not
retired, the name carries the prefix `103-`, every verb is a verb of §O.3, every surface is a
surface of §O.4 and of the family, and no two scenarios of one family share a name.

| Family | Scenario | Scenario of | Test of | Stubs and verbs | Surfaces | Note |
|---|---|---|---|---|---|---|
| family FX-17 | `103-usage-workdir-missing` | 103 | 103 | none is called: the loop ends before any pass | `exit`, `stdout`, `stderr`, `tree`, `state`, `transcript` | The usage failure of the working directory, empty or not a directory. Baseline: the pass-loop script, line 240 |
| family FX-17 | `103-usage-workdir-unenterable` | 103 | 103 | none is called | `exit`, `stdout`, `stderr`, `tree`, `state`, `transcript` | The loop cannot enter the working directory: exit 1 with no line of its own. Baseline: line 244. Prerequisite: the run does not have the effective user id 0; otherwise a skip with its reason |
| family FX-17 | `103-usage-evidence-missing` | 103 | 103 | none is called | `exit`, `stdout`, `stderr`, `tree`, `state`, `transcript` | `--evidence FILE required`. Baseline: line 241 |
| family FX-17 | `103-usage-prompt-missing` | 103 | 103 | none is called | `exit`, `stdout`, `stderr`, `tree`, `state`, `transcript` | `--prompt-file FILE required (got '<value>')`. Baseline: line 242 |
| family FX-17 | `103-usage-flag-without-value` | 103 | 103 | none is called | `exit`, `stdout`, `stderr`, `transcript` | A field present without a value: a parameter error and exit 1, and the usage text is NOT printed. Baseline: lines 207 to 227 |
| family FX-18 | `103-usage-unknown-arg` | 103 | 103 | none is called | `exit`, `stdout`, `stderr`, `transcript` | `unknown arg: <name>` with the usage text, exit 1. Baseline: line 230 |
| family FX-18 | `103-usage-text` | 103 | 103, 124 | none is called | `exit`, `stdout`, `stderr`, `transcript` | A request with `help` set: exit 0 and the usage text, which lists 0, 1, 4, 6, 7, 8, 9 and 10 and not 3. **The entry point of PT-124-C-057-usage-list of feature 124 (SECOND-PASS-LIST D27).** Baseline: lines 23 and 229, the EXIT section at lines 116 to 132 |
| family FX-19 | `103-empty-prompt` | 103 | 103 | none is called | `exit`, `stdout`, `stderr`, `tree`, `state`, `transcript` | A prompt of white space only: exit 1 and `proposer.sh: prompt is empty`. Baseline: line 1785 |
| family FX-19 | `103-evidence-present` | 103 | 103 | none is called; the phase evidence is a file of the template (F141-FR-012) | `exit`, `stdout`, `stderr`, `tree`, `state`, `events`, `transcript` | The start-up check before the empty-prompt test: exit 0, the event `evidence_present` with `iters` 0, and the line on standard error. Baseline: lines 1778 to 1782 |

### 2.1 Why each is inside the scope of its family

| Scenario | Why in scope |
|---|---|
| the five of FX-17 | FX-17 drives the entry point `pass-loop`. A usage failure is the entry point of the same script, before the pass numbering the family exercises, and the catalogue reserves the name for exactly this |
| the two of FX-18 | FX-18 is the family of a pass that fails before the harness starts, and the one of the five whose covered features hold 124 — the feature that reads the list of exit codes out of the usage text |
| the two of FX-19 | FX-19 is the family of the plain-output path of the start-up, where the loop decides before any pass whether it runs at all. F103-FR-006 states the two decisions together: the phase evidence already there, and then the empty prompt |

### 2.2 What is asked

| # | Asked of | Request |
|---|---|---|
| 4 | 141 | Add the nine rows of section 2 to the table "Scenarios added after the first set" of §O.2, and replace the reservation row with them. No verb and no surface is added: all nine call no stub, and every surface they cite is in the Run set of their family |
| 5 | 141 | Note that `103-usage-workdir-unenterable` needs the same prerequisite that `FX-26/root-sandbox-assertion` carries, in the other direction: the effective user id must NOT be 0, since root can enter a directory whose execute bit is clear. A skip with its reason is the expected outcome under a root runner |
| 6 | 124 | `PT-124-C-057-usage-list` has its entry point: `FX-18/103-usage-text`. The list of codes is read from the usage text of the pass loop and from nowhere else |

## 3 — One member missing from annex X §X.6 row 133 (from T002)

Row 133 of annex X §X.6, "Reasons for a fresh session", is owned by feature 103 and holds twelve
members in `packages/contracts/data/closed-sets.json`. The section "Closed sets" of
`specs/103-proposer-pass/spec.md` holds thirteen: clarification U5 of this feature added
`layer-requested`, for a `fresh` that a layer names in `requestPass` — the second repair of a unit
of work, and an escalation (F103-FR-042, F103-FR-043).

| Row | Set | In feature 100's data | In this feature's spec |
|---|---|---|---|
| 133 | Reasons for a fresh session | 12 members; `layer-requested` absent | 13 members; `layer-requested` present |

The annex stands for the row, so nothing was changed in feature 100's data. The module
`packages/contracts/src/enums/pass-loop.ts` exports the twelve of the row as
`FRESH_SESSION_REASONS_OF_ROW_133` and the thirteen of the specification as
`FRESH_SESSION_REASONS`, and the delivered data file
`packages/contracts/data/closed-sets-103.json` records the addition with the clarification that
made it, so the difference is visible in the package and cannot be lost.

### 3.1 What is asked

| # | Asked of | Request |
|---|---|---|
| 7 | 100 | Add `layer-requested` to row 133 of annex X §X.6 and regenerate `data/closed-sets.json`. Once the row holds thirteen, `FRESH_SESSION_REASONS_OF_ROW_133` and `FRESH_SESSION_REASONS` become the same list and the split in `src/enums/pass-loop.ts` can go |

## 4 — The five other closed sets, and the rest of the Setup phase: nothing asked

| Row of §X.6 | Closed set | State in feature 100's data |
|---|---|---|
| 57 | Directives of a loop layer | **present and in agreement** (the eleven by reference to annex D §D.1) |
| 58 | Returns of `afterPass` | **present and in agreement** |
| 121 | Block sets of a prompt (proposer and critic) | **present and in agreement** |
| 126 | Session directives | **present and in agreement** (owned by 109; this feature writes the value) |
| 132 | Kinds of record of the ledger namespace `core` | **present and in agreement** |

Rows 59 and 60 of annex X §X.7 were confirmed present on 2026-09-30 (`loop.noProgressStructured`
and the carry-over parameters); T004 of `tasks.md` records it and asks nothing.

The handoff schema and the data file of the closed sets are delivered into
`@specstride/contracts` by `specs/103-proposer-pass/contracts/deliver.json`, through the mechanism
feature 100 built for it (T299). Nothing of feature 100 was edited for it.
