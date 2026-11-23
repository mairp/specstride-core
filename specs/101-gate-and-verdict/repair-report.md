# Repair report — 101-gate-and-verdict

Written by the repair agent of feature 101 on 2026-09-30, from its section of
`docs/ecosystem/reviews/REPAIR-WORKLIST.md`, the table "What the other features must follow" of
`specs/100-specstride/repair-report.md`, and the follow-up report of feature 141
(`specs/141-parity-oracle/followup-report.md`). Paths are relative to
`specs/101-gate-and-verdict/` unless they start with `specs/` or `docs/`. Line numbers are those
of the files after the repair.

Every item was checked against the file before it was changed. No id was renumbered or reused.
Only files of this feature were written. No model was called and no credential was read.

| Item | Class | Severity | State (`done`, `not applied`, `open`) | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-101-01 | repair | medium | done | `contracts/gate-halts.json:4`; `spec.md:451`; `quickstart.md` section 4 | Verified: the row of exit 0 held `null` and "—". F100-FR-148 asks for false where the exit has no stop reason |
| W-101-02 | repair | medium | done | `spec.md:303` (F101-FR-020); `plan.md:77` (row IX); `tasks.md:317` (T113), `:328` (T084); `data-model.md` (record of the call of the diagnostician) | Verified: the text said "no tools". One difference from the worklist: the hiding of the proposer's files cites F100-FR-088 and not F117-FR-040, because a tier 2 feature cites feature 100 only (`STAGE-B-RULES.md` section 5). Added beyond the item: a proof that fails makes no call and only warns, since a failure of the diagnostician never halts. New test CT-101-31 |
| W-101-03 | repair | medium | done | `tasks.md:71` (T108); `spec.md` `test:` lines of F101-FR-007 and F101-FR-008; `plan.md` "Testing" | Verified: no task held a property or fuzz test of the parser. New test CT-101-32. Place: `packages/core/test/101/`, see W-X-28 below |
| W-X-09 | repair | medium | done | `tasks.md:351` (T114); `plan.md:88` (row XVII) | Verified: no task recorded the macOS result or a skip |
| W-X-14 | repair | medium | done | `plan.md:62` | Verified: the version was not named. The check has twenty rows, the gate line, the re-check and Complexity Tracking already |
| W-X-17 | repair | medium | done | `spec.md:303` (F101-FR-020), `parity:` line; `tasks.md:317` (T113) | The rule and the warning of F100-FR-024, with the identity from `capabilities`; the results `same-model` and `unverified` of row 183 raise the warning. Under `parity` the line is not printed (row 92) |
| W-X-18 | repair | medium | done | `spec.md:229` (F101-FR-009, critic strategy), `:284` (F101-FR-017, attempt planner) | Verified: no requirement had an `ep:` line for EP-18. Both rows of "Extension points" stay |
| W-X-21 | repair | medium | done | `tasks.md:343` (T102) | `proves: F101-FR-014; F101-FR-021; F101-FR-024`, the requirements that F101-SC-008 measures |
| W-X-22 | repair | medium | done | `spec.md:665` (section "Threats") | The worklist names T-22. Annex X §X.9 names feature 101 as an owner of six threats (T-01, T-02, T-05, T-06, T-08, T-22); the table holds all six, each with requirements and tests |
| W-X-23 | repair | medium | done | `spec.md:442` (F101-FR-052, new); `tasks.md:238` (T110), `:253` (T112); "Contracts of feature 100 used" | The requirement cites the ingress of F100-FR-009 and F100-FR-205, not F111-FR-023 (tier 2 rule). It covers lines, the halt banner, fields of events and spans. The verdict record and the feedback keep the reply as it was: they are as-is records that the oracle compares, and they are not sinks in the sense of F100-FR-205. New test CT-101-33 |
| W-X-28 (through the note of W-101-03) | repair | low | done | `tasks.md` (T001, T035, T062, T063, T064, T070, T071, T072, T082, T101, T102, T106, and the new tasks); `plan.md` "Testing" and the source tree | Feature 101 is not in the list of W-X-28, but it had the same fault as feature 149: own tests in `tests/own/101/`. The rule of feature 100 (`specs/100-specstride/plan.md:161` to `:165`) puts tests that are neither parity nor characterization tests in the `test/` directory of the package: `packages/core/test/101/` |
| W-X-30 | repair | low | done | `tasks.md:56` (T006) | "the Lisa baseline at `363e6a3`" |
| CQ-187 (feature 141, follow-up, first row for 101) | queue | high (parity: six scenarios of FX-07 would compare `different`) | done | `spec.md:236` (F101-FR-010), `:627` (row of the profile), `:799` (assumption), user story 2 scenario 5, edge cases; `tasks.md:234` (T109), `:252` (T111), `:348` (T104); `quickstart.md:33`; `data-model.md`; `research.md` (risks); `plan.md` row XVIII | Verified against the follow-up report: the baseline scores a missing key MALFORMED (`lib/critic.py:1883`, `:1904`, `:2738`) and exits 3 only for the five checks before the call. Under `parity`: a failed call. Outside: exit 3, found before the call by `preflight`. `assumption: CQ-187`. New test CT-101-30 |
| Feature 141, follow-up, second row for 101 | repair | medium | done | `contracts/gate-halts.json:5`, `:6`; `contracts/README.md`; `spec.md` (independent test of user story 2, F101-SC-003); `tasks.md:196` (T053) | `critic-config` names `FX-07/phase-not-found`; `malformed-limit` names the six scenarios of an error inside the call. The five scenarios `FX-07/critic-*` drive the critic alone and are no halt of the engine |
| Table of feature 100, row 13 (no `node:fs` in a core package, CQ-185) | repair | medium | done | `plan.md` "Primary Dependencies" | The plan named no import of `node:fs`; it now says so in words |
| Table of feature 100, row 30 (F100-FR-143 wording) | repair | low | done | With W-101-02 | — |
| Table of feature 100, rows 23 and 24 (names of the warning and of the counted unit) | repair | low | not applied | — | Nothing to change: `grep -i "same-model\|iteration limit\|pass cap"` finds nothing in this feature. "iteration" stands once, in `contracts/as-is-literals.md:47`, as the name of an as-is variable |
| W-X-03 (same fault, found while repairing) | repair | low | done | `spec.md:381` (F101-FR-032, `parity:` line), `:798` (CQ-172) | The line said "a new row of the profile is needed". Row 129 of annex X §X.7 exists and is the row |
| Found while repairing | repair | low | done | `spec.md`, "Closed sets" | The three sets of this feature were marked "New"; annex X §X.6 holds them as rows 251, 252 and 255 |
| `CQ-pending-*` placeholders | — | — | not applied | — | The feature holds none |

Counts: 17 done, 2 not applied (nothing to change), 0 open.

## Requirements added or changed in place

| Requirement | Kind | Item | What |
|---|---|---|---|
| F101-FR-007, F101-FR-008 | `test:` line | W-101-03 | CT-101-32 added |
| F101-FR-009 | `ep:` line | W-X-18 | EP-18 `specstride.critic-strategy/1` (consumes) |
| F101-FR-010 | changed in place | CQ-187 | The configuration errors are those found before the call. A missing credential: failed call under `parity`, configuration error outside it. `assumption: CQ-187`; test CT-101-30 |
| F101-FR-017 | `ep:` line | W-X-18 | EP-18 `specstride.attempt-planner/1` (consumes) |
| F101-FR-020 | changed in place | W-101-02, W-X-17 | Form of the `completion` level with the proof; hiding of the proposer's files; critic-diversity rule and warning; `divergence:` gains DV-081; `parity:` line; test CT-101-31 |
| F101-FR-032 | `parity:` line | W-X-03 | Row 129 |
| F101-FR-052 | new | W-X-23 | Text of a critic-class call passes the one ingress; test CT-101-33 |

The feature has 42 functional requirements, 6 success criteria and 96 tasks. It is below 45.

## What another feature or the orchestrator must do

| Who | What | Why |
|---|---|---|
| Orchestrator | Add the register row and the row of the `parity` profile below; then F101-FR-010 gets `divergence: DV-<n>` and the number of the row in its `parity:` line | CQ-187. `DV-117` is not written in a `divergence:` line, because check h2 refuses it; it stands in the `assumption:` line and in the table of the profile |
| Feature 100 | Annex E §E.1, errors of `judge` ("a configuration error of the critic (engine exit 3, `critic_config`); a transport error, which is scored as MALFORMED"): say that a missing credential is a failed call under the `parity` profile | CQ-187 |
| Feature 100 | Annex C §C.3 names the move of the proposer's files "before a critic of the second form starts" (F100-FR-088). Say that it holds for every critic-class call, the diagnostician included | F101-FR-020 reads it so |
| Feature 110 | Name a key for the switch of F101-FR-010 if the owner wants one; the spec proposes none (as row 129 has none) | CQ-187 |
| Features 124, 130, 131, 138 | Their errors of the critic configuration that the baseline raises inside the call (`FX-07/unknown-harness-name`, `dsh-conflicting-providers`, `dsh-invalid-model-ref`, `prime-empty-variant`, `codex-missing-key`) end in the row `malformed-limit` under `parity`. F101-FR-010 scores every error raised inside the call as MALFORMED in every profile; a feature that wants exit 3 outside `parity` must find the error before the call and needs its own register row | Follow-up of feature 141, section 1.2 |
| Feature 149 | Its own tests are in `tests/own/149/` (W-X-28); this feature now uses `packages/core/test/101/`. F149-FR-001 still writes "same-model warning" | One place for the tests of the package `@specstride/core`; row 23 of the table of feature 100 |
| Feature 126 | `python3 docs/ecosystem/check-traceability.py --require-all` fails on F126-FR-016, which cites `DV-117` in a `divergence:` line | See "Checks" |
| Worklist | W-X-22 names T-22 only for feature 101, W-X-28 does not name feature 101 | Both were wider in the files |

## New questions (each with a recommended answer and its source)

| # | Question | Sources | Recommended answer | If answered otherwise |
|---|---|---|---|---|
| N-1 | Does the move of the proposer's notebook, handoff and outbox out of the working tree hold for a diagnostician with read-only tools, and does a failed proof of the diagnostician halt the run? | F100-FR-087; F100-FR-088; rulings 57, 57a, D1; B-0283 (a failure of the diagnostician only warns) | The move holds for every critic-class call. A failed proof of the diagnostician makes no call, warns and writes no hint; it does not halt, because the critic call of the same phase gate has already proven, or will prove, the same entry of the role plan | If it halts: F101-FR-020 gains exit 3 with `critic_config`, and the table of halts names the diagnostician |
| N-2 | Are the verdict record and the feedback sinks in the sense of F100-FR-205, so that the reply in them is redacted and cut? | F100-FR-009; F100-FR-205; F101-FR-012; CQ-173; register row DV-095 | No for both under the `parity` profile, where they hold the reply as it was and the oracle compares them. Outside the profile the orchestrator decides; the spec proceeds on "as it was", because the next prompt reads the feedback through the assembler, which frames it as data | If yes: F101-FR-012 and F101-FR-052 change, and the row of DV-095 names the two records |

## Register rows needed (with the text)

| Id | As-is behaviour | New behaviour | Source | Rule for the oracle |
|---|---|---|---|---|
| DV-117 | A missing credential of the critic is raised inside the critic call, scored as a failed call (MALFORMED) on every phase attempt, and the run ends at the MALFORMED limit with engine exit 1 and `critic_unavailable` (the critic module of the Specstride baseline at `9cab15d`, lines 1883, 1904, 2738; the engine script, lines 2163 to 2182) | The missing credential is found before the call by `preflight` and refused with engine exit 3 and `critic_config`; no count changes; the message names the credential and holds no value | Principle IX ("Auth failures are named"); 028 FR-010; CQ-187; follow-up report of feature 141 | **Off** under the `parity` profile; own test CT-101-30 |

Row of the `parity` profile needed (annex X §X.7, a new row): switch "A missing credential of the
critic is a configuration error, found before the call"; key: none, or one that feature 110
names; default on; under `parity` off; owner 101; register row DV-117.

This row is needed only if the behaviour outside the `parity` profile stays exit 3. If the owner
answers CQ-187 with "a failed call everywhere", no row is needed: the sentence on the switch
leaves F101-FR-010, and T111 and the second half of CT-101-30 go.

## Checks

| Check | Result |
|---|---|
| Generator or check of this feature in `contracts/tools/` | None exists |
| `contracts/gate-halts.json` | Parses as JSON |
| `python3 docs/ecosystem/check-traceability.py --require-all` | FAILED with 1 error, on another feature: `[h2] F126-FR-016: still cites a register row to be written (DV-117)`. No error names feature 101; its row shows 157 of 157 behaviour items |
| Requirements counted | 42 lines `- **F101-FR-` in `spec.md` |
| Tasks counted | 96; 55 with `proves:` |
| `analyze-report.md` | Section "After the cross-feature review" appended |
