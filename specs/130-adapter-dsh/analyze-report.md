# Analysis report: feature 130-adapter-dsh

Date: 2026-09-29. Read-only analysis of `spec.md`, `plan.md`, `tasks.md`, `research.md`,
`data-model.md`, `quickstart.md` and `contracts/`. One run; no repair was needed, so the two
allowed repairs were not used.

## Counts

| Item | Count |
|---|---|
| Functional requirements | 42 (`F130-FR-001` to `F130-FR-042`) |
| Success criteria | 9 (`F130-SC-001` to `F130-SC-009`) |
| Behaviour items assigned by the traceability files | 66 in 14 clusters, all kept (28 ported, 38 translated) |
| Items that are the origin of a requirement | 66 of 66 |
| Items proven by a test task (`proves:` names the item or its cluster) | 66 of 66 |
| Tasks | 67, of which 5 captures first |
| Requirements without a test name | 0 |
| Requirements not served by a task | 0 |
| References to a requirement that does not exist | 0 |
| `[NEEDS CLARIFICATION]` markers | 0 |

## Findings

| # | Severity | Finding | Where | State |
|---|---|---|---|---|
| 1 | Info | Four register rows are cited as `DV-108` to `DV-111`. The coverage check reports them as `[h2] still cites a register row to be written`, which is the form that `STAGE-B-RULES.md` section 4 asks for. The orchestrator adds the rows | F130-FR-011, -013, -021, -024, -025, -029 | Reported |
| 2 | Info | Two rows of annex X §X.7 are needed: the proof of the critic mode of dsh and the plugin allowlist | "Rows of the `parity` profile" | Reported |
| 3 | Info | Nine keys have no alias in the alias table of annex X §X.8 (home, provider of proposer and critic, two reasoning efforts, the plugin allowlist and time limit, bare-id table, window table) | "Rows of the `parity` profile" | Reported |
| 4 | Info | Annex B §B.5 has no logical name for the temporary patch file of the critic | F130-FR-023 | Reported |
| 5 | Low | The description of FX-07 reads two dsh reference errors as critic configuration errors; the code of the baseline scores them as a failed critic call. The spec follows the code | F130-FR-028; CQ-141 | Reported |
| 6 | Low | The coverage check assumes a free way to list tool ids of the composed profile | F130-FR-024; CQ-142 | Waits for capture 3 |
| 7 | Info | Plan: two deviations from the letter of Principles VIII and IX are in Complexity Tracking with the rule that bounds each | `plan.md` | Justified |
| 8 | Info | Facts that stay `unverified`: approval mode `ask`, enforcement by the operating system, tool ids of the pinned version, rejoining of arguments, message forms of a limit, telemetry variable, every macOS statement, the terms of the harness | `spec.md` status fields | Listed |

## Cross-artifact checks

- Every requirement of `spec.md` appears in the phases of `plan.md` and in at least one `covers:` or `proves:` line of `tasks.md`.
- Every closed set in `spec.md` "Closed sets" has an owner, a "closed by" and a rule for an unknown value.
- Every option or switch has a value under the `parity` profile: the two new switches, `harnesses.dsh.critic.proof` (`none`) and `harnesses.dsh.pluginAllowlist` (as the fixture sets it), and the rows 10, 12, 25 to 30, 34, 35 and 39.
- No name of a model, provider, launcher or gateway specific to the owner's machines appears in any file. The backend registered locally is not named.
- Feature 100 and feature 141 are cited only. No requirement of another tier 2 feature is cited.
- The plan keeps flags, variables, tool ids and file layout, and the spec keeps behaviour.

## Split

Not needed: 42 requirements, under the limit of about 45. If a split were wanted, group G4 (the
plugin request protocol, F130-FR-031 to F130-FR-037, with origins B-0433 to B-0443, B-0536,
B-0542, B-0551 to B-0553, B-0585 to B-0587, B-0618, B-0619, B-0650, B-0653, B-0654, B-0757,
B-0768, B-0769 and tests PT-130-C-036-* to PT-130-C-040-*, PT-130-C-053-*, PT-130-C-054-*,
PT-130-C-056-*, PT-130-C-057-*) would leave first.

## What did not pass

Nothing, after zero repairs.

## After the cross-feature review

Date: 2026-09-30. The sections above are the record of 2026-09-29 and were not rewritten; their
counts and findings 1 to 5 and 7 are overtaken by what follows.

### What changed

| Subject | Change |
|---|---|
| Ruling P14 | F130-FR-004 and F130-FR-030: never a default and never picked automatically, for both roles, under every audience |
| Principle VIII | F130-FR-003, F130-FR-005, F130-FR-014, F130-FR-015 changed in place; F130-FR-043 and F130-FR-044 added. The plan marks row VIII as a deviation, with a Complexity Tracking row and CQ-189. The earlier row on the prompt as an argument is removed: it is no violation |
| Critic role | F130-FR-045 added: refused outside `parity` unless native memory is `off` or `absent`. Ruling 37 has its requirement in F130-FR-044 |
| Principle IX | Row IX of the plan is a deviation (CQ-182); F130-FR-025 says so |
| User configuration only | F130-FR-010 and F130-FR-018 (CQ-183) |
| Follow-up of feature 141 | F130-FR-028 states the end on the reference; the note on CQ-141 is removed. F130-FR-026 carries CQ-187 |
| Rows and names | Rows 117, 118 and 131 of annex X §X.7, rows 215 to 217 of §X.6, the aliases of §X.8, `pass:<passId>:critic-patch`, DV-108 to DV-111 are cited as existing |
| Test without a task | CT-130-30 has task T068 |
| Captures | Six; capture 6 is new and not paid |

### Counts

| Item | Count |
|---|---|
| Functional requirements | 45 (`F130-FR-001` to `F130-FR-045`); not above 45 |
| Success criteria | 9 |
| Tasks | 76 (`T001` to `T076`) |
| Requirements without a test name | 0 |
| Requirements named in no task | 0 |
| Test names of `spec.md` that no task names | 0 |
| Requirement ids in the plan or the tasks that do not exist | 0 |
| `CQ-pending-*` placeholders | 0 |

### Consistency pass over the places touched

| Check | Result |
|---|---|
| Every new requirement has a test and a test task with `proves:` | F130-FR-043: CT-130-43, T069. F130-FR-044: CT-130-44, T070. F130-FR-045: CT-130-45, T071 |
| Every new requirement has an implementation task | T073, T074, T075 |
| Number of captures | "six" in `spec.md`, `plan.md`, `tasks.md`, `research.md`, `contracts/README.md`; six entries in `contracts/capture-plan.json` |
| States and kinds of a customisation | The same five states and four kinds in `spec.md`, `data-model.md`, `tasks.md` and `contracts/descriptor-dsh.json` |
| Source of `loop.parallel.allow_detect` and of the opt-in to C0 | User configuration only in `spec.md`, `plan.md` and `tasks.md` |
| Paid probes | No paid probe is a precondition of an unpaid test; capture 6 is not paid, and the live check of a switch is named as a separate paid probe |

### What remains

| # | Severity | Finding |
|---|---|---|
| 1 | Medium | F130-FR-034 accepts the allowlist from user configuration, the environment or flags, and ruling P15 says "in user config". CQ-183 names rulings 34 and P2 only, so the requirement was not changed. Reported as a new question |
| 2 | Medium | Row 131 of annex X §X.7 says customisations are never loaded into a critic-class call. F130-FR-045 refuses the critic role on native memory only; a customisation that gives no tool and has no switch is recorded and warned. Reported as a new question |
| 3 | Low | Two closed sets of this feature needed a row in annex X §X.6 (rows 275 and 276 now hold them, cited since the re-check B-8.7 of 2026-09-30); the two plugin schema ids have no row in annex B §B.20 |
| 4 | Info | Outside the `parity` profile dsh cannot be a critic until capture 6 exists, because the state of native memory is not established |

## Analyze run of 2026-09-30 (after the owner closed CQ-182, CQ-189, CQ-232 and CQ-233)

18 findings, all repaired inside this folder. Items 1 to 3 of "What remains" above are overtaken:
item 1 by CQ-233 (F130-FR-034: the allowlist from user configuration only outside `parity`),
item 2 by CQ-232 (F130-FR-045: a customisation shown to be loaded into a critic-class call refuses
the role), item 3 by annex B §B.20, whose rows the spec (F130-FR-031, F130-FR-032) and the `$id` of
`contracts/plugin-request.schema.json` and `contracts/plugin-receipt.schema.json` now use; the
as-is ids stay as the `contract` constants.

### Proposed upstream fixes

None. Every finding of this run had its fix inside `specs/130-adapter-dsh/`.
