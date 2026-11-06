# Report to the orchestrator: the exercise map (T149)

Status of the exercise map of feature 141 at the end of phase 9, the correction
list built from it, the two supplementary rows, and the families FX-38 to FX-40
for the proof column of the traceability files.

## 1. The correction list

**File:
`.specstride/features/141-parity-oracle/gates/proofs/phase9-corrections.tsv`**
(2,593 corrections + header, columns `kind, b_item, cluster, feature, evidence,
families_named, executed_by, proposal, why`). Written by `writeCorrectionList`
(`src/trace/corrections.ts`), whose default destination is
`packages/oracle/exercise-map/corrections.tsv` and which refuses to write any
file of `docs/ecosystem/` — the oracle never writes a traceability file
(F141-FR-033). The list is kept with the phase evidence rather than under
`packages/oracle/` for one stated reason: every row quotes the evidence line of
the baseline verbatim (`proposer.sh:2259`, `lib/other.py:9999`, and lines of
the front-door shell script the product no longer names by its legacy name),
and the product-wide packaging rule F100-FR-026 refuses legacy names of the
baseline inside any file of `packages/`. The evidence is the point of the
list, so the file lives where those names are allowed.

**Basis, stated plainly.** The full exercise map does not exist yet: no
`exercise-map.json` is committed, because the capture job that traces all 234
scenarios on both baselines has not run. The list in this directory is built
over the **probe map** — the three scenarios the build has traced live
(FX-01/three-phases on `specstride` at pin `9cab15d2…`, FX-32/greeting-ready
and FX-35/dry-run@engine-stub on `mixture-of-loops` at pin `9c88f86e…`),
joined with `readTraceability` over the real traceability files plus the
supplement. That is why the summary line reads:

    correction list: 2265 item(s) no fixture executed,
    328 item(s) executed by another family than the one named

The 2,265 unreached items are the honest backlog of the oracle at this point of
the build, not a defect: an item whose evidence line no traced scenario executed
lands on the list with the family the traceability files name for it (from the
`proof` column) and a proposal — `a new scenario` where a family is named,
`a register row` where none is. The 328 wrong-family items say which family
actually executed the evidence line when it was not the named one. When the
capture job writes the full map, the same two calls
(`buildCorrectionList` + `writeCorrectionList`) regenerate this file; nothing
in the pipeline changes. The probe that produced the current file is
`.specstride/features/141-parity-oracle/gates/proofs/phase9-tools/corrections.ts`,
its record `gates/proofs/phase9-corrections.json`.

## 2. The two supplementary rows

`packages/oracle/exercise-map/supplement.tsv` holds the two rows the oracle
proposed for items the R18 inventory missed (F141-FR-017). Both are stop-reason
rows of cluster C-055, disposition `ported`, read through
`supplementEvidence()` like any inventory row — they are items of the exercise
map like any other:

| b_item | system | feature | evidence | must_contain |
| --- | --- | --- | --- | --- |
| B-2784 | SS | 118-pass-supervision-and-jobs | `proposer.sh:2253` | `specstride_emit run_stop reason proposer_cap_exhausted` — written on the structured path of the pass loop with fields `iter`, `kill_reason`, `consec`, followed by exit 10 |
| B-2785 | SS | 103-proposer-pass | `proposer.sh:2259` | `specstride_emit run_stop reason proposer_consecutive_errors` — written on the structured path of the pass loop with fields `iter`, `subtype`, `kill_reason`, `kill_class`, followed by exit 7 |

On the current correction list both appear as `unreached` with the family the
traceability files name and the proposal `a new scenario`: B-2784 names FX-20,
B-2785 names FX-18 (`proofs/phase9-corrections.json`, `theTwoSupplementRows`).

## 3. The families FX-38 to FX-40 for the proof column

The proof column of `docs/ecosystem/traceability-items.tsv` names these three
families for 184 items. All three are active in
`packages/oracle/data/fixture-catalogue.json`, all their scenarios have
fixtures and golden captures, and FX-38 has live differential evidence from
this build (quickstart scenario 7).

| Family | Name (catalogue) | Items in the proof column | Scenarios (fixtures + golden captures) |
| --- | --- | --- | --- |
| FX-38 | dsh plugin request protocol | 27 — B-0433…B-0443, B-0536, B-0542, B-0551, B-0552, B-0553, B-0585, B-0586, B-0587, B-0618, B-0619, B-0650, B-0653, B-0654, B-0757, B-0768, B-0769 | 19: allowlist-empty, denied-not-in-allowlist, installed-on-final-pass, installed-then-restart, installer-fails, installer-times-out, invalid-request-contract, invalid-request-duplicate, invalid-request-json, invalid-request-keys, invalid-request-link, invalid-request-not-regular, invalid-request-plugins, invalid-request-plugin-spec, invalid-request-reason, invalid-request-too-large, no-request-file, qualified-harness-never-processed, request-and-evidence-in-one-pass |
| FX-39 | Declared overlay of the configuration home | 58 — B-0059, B-0115, B-0386…B-0417, B-0509…B-0512, B-0570, B-0579…B-0583, B-0621…B-0624, B-0641, B-0681…B-0684, B-0687, B-0758, B-0759, B-0767, B-0992 | 7: dsh-reasoning-effort, dsh-settings-overlay, invalid-declaration, populate-fails, scope-attempt, scope-attempt-signal, scope-pass |
| FX-40 | Rendering on a terminal | 96 — B-1151, B-1155…B-1172, B-1329…B-1365, B-1367, B-1370…B-1377, B-1380, B-1382, B-1384…B-1388, B-1392, B-1394…B-1426 | 4: banner, colour-detected, colour-never, timeline-live |

These are the entries the proof column needs when the traceability check asks
which family proves the items: the catalogue names what each family exercises
(FX-38 the request file, its validation, the allowlist, the installer call, the
receipt, the restart pass, the breaker exemption and the three ends; FX-39 the
declared overlay — scopes `pass` and `attempt`, population, the
phase-attempt signals, removal, the throwaway home of dsh; FX-40 the presenter,
banner and theme on a pseudo-terminal — colour depth, background, glyphs,
width tiers, the live timeline, the card, escape sequences as written, and the
timeline with no terminal), and the fixture and golden directories hold one
scenario per name above.
