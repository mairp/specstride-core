# T032 — the FX-30 scenarios of the first set under the profile `parity`

**Task**: T032 · **Requirement**: F140-FR-001 · **Date**: 2026-10-03 ·
**Part two is addressed to feature 141**.

## What "the first set" is, and where this report reads it

The first set of family FX-30 is feature 141's own, declared in
`specs/141-parity-oracle/spec.md` (the table "Scenarios", row FX-30) and shipped
as data in `specs/141-parity-oracle/contracts/fixture-catalogue.json`: `plan`;
`lint-<code>` for each finding code; `guard-refuses`; `refused-flag`. With the
pattern resolved that is **41 scenarios**. This report and the check behind it
read the set from feature 141's file, never from a list restated here.

The check is `tests/parity/140/fx30-parity-profile.test.ts`. It runs on every
pass and holds this report to account: every result it measures is in the table
below, and the table names no scenario the first set does not hold.

## What "the profile `parity`" is here

Row 69 of annex X §X.7 is the row the three limits of F140-FR-016 share. Its
cell under `parity` reads **"The same"** — every value under `parity` is the
default — so selecting the profile sets `reverse.maxFileBytes` to 1048576,
`reverse.maxTotalBytes` to 20971520 and `reverse.contextBudget` to 24000, which
is what the port does with an unset environment. The check asserts that against
`specs/100-specstride/contracts/data/parity-profile.json` and against
`packages/reverse/src/inventory/limits.ts`, so "run with the profile `parity`" is
a measured claim and not an assumption. Row 19 of §X.7 ("no line without an as-is
equivalent is printed") is checked too: every line the lint printed matches the
as-is grammar of F140-FR-003, and nothing else was printed.

## No scenario of the first set is `equal`

**No scenario of the first set is `equal`, and none is a pass.** The comparison
cannot run at all: feature 141's oracle is a skeleton — `packages/oracle/` holds
`package.json`, `tsconfig.json` and a one-file `src/index.ts`, and the
directories its plan names (`packages/oracle/fixtures/`,
`packages/oracle/golden/`) do not exist. There is no comparator, no fixture
declaration and no golden capture.

So every result below is **`skip`, with its reason** — never a pass (the
constitution, principle XVII; feature 141's own F141-FR-037, "a fixture whose
prerequisite is missing MUST be reported as a skip with its reason and never as
a pass"; and this feature's tasks say the same). It is deliberately **not** recorded as `different`, even
though F141-FR-021 will give `different` for a capture that is missing or
unreadable: that result is the comparator's to produce, and the comparator does
not exist. Recording `different` here would be inventing a result.

What *did* run is the **port half**, for each of the 39 scenarios whose verb this
feature owns, under the profile `parity`. Its output is in the table, so the day
feature 141 lands the captures the comparison has something to be held against.

`guard-refuses` and `refused-flag` exercise the reverse guard and the refused
flag, which `spec.md` ("Out of scope") assigns to feature 108. They are in the
first set of FX-30 because features 108 and 140 share the family.

## The 41 results

| Scenario | Owner | The port half, under `parity` | Result | Reason |
|---|---|---|---|---|
| `FX-30/plan` | 140 | exit 0, fingerprint `b64bc26fad165ed1…`, 49 files, 4 skipped, walk `walk` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-template-mandatory` | 140 | exit 3, 152 bytes on stdout, code `template.mandatory` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-template-family` | 140 | exit 3, 172 bytes on stdout, code `template.family` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-template-expected` | 140 | exit 0, 146 bytes on stdout, code `template.expected` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-placeholder` | 140 | exit 3, 110 bytes on stdout, code `placeholder` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-structure-extra` | 140 | exit 3, 98 bytes on stdout, code `structure.extra` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-structure-contracts` | 140 | exit 3, 97 bytes on stdout, code `structure.contracts` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-structure-required` | 140 | exit 3, 99 bytes on stdout, code `structure.required` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-evidence-format` | 140 | exit 3, 169 bytes on stdout, code `evidence.format` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-evidence-kind` | 140 | exit 3, 103 bytes on stdout, code `evidence.kind` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-evidence-confidence` | 140 | exit 3, 122 bytes on stdout, code `evidence.confidence` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-evidence-validation` | 140 | exit 3, 135 bytes on stdout, code `evidence.validation` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-evidence-disproved` | 140 | exit 3, 113 bytes on stdout, code `evidence.disproved` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-evidence-citation` | 140 | exit 3, 109 bytes on stdout, code `evidence.citation` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-evidence-contradicts` | 140 | exit 3, 112 bytes on stdout, code `evidence.contradicts` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-evidence-missing` | 140 | exit 3, 129 bytes on stdout, code `evidence.missing` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-evidence-skipped` | 140 | exit 0, 98 bytes on stdout, code `evidence.skipped` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-unknowns-placement` | 140 | exit 0, 156 bytes on stdout, code `unknowns.placement` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-spec-fr-format` | 140 | exit 3, 116 bytes on stdout, code `spec.fr-format` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-spec-sc-format` | 140 | exit 3, 116 bytes on stdout, code `spec.sc-format` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-spec-fr-unique` | 140 | exit 3, 85 bytes on stdout, code `spec.fr-unique` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-spec-sc-unique` | 140 | exit 3, 85 bytes on stdout, code `spec.sc-unique` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-spec-story-format` | 140 | exit 3, 137 bytes on stdout, code `spec.story-format` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-spec-story-numbers` | 140 | exit 3, 112 bytes on stdout, code `spec.story-numbers` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-spec-story-parts` | 140 | exit 3, 100 bytes on stdout, code `spec.story-parts` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-spec-clarifications` | 140 | exit 3, 119 bytes on stdout, code `spec.clarifications` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-research-decisions` | 140 | exit 3, 126 bytes on stdout, code `research.decisions` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-data-model-entities` | 140 | exit 0, 93 bytes on stdout, code `data-model.entities` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-checklist-items` | 140 | exit 3, 127 bytes on stdout, code `checklist.items` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-tasks-grammar` | 140 | exit 3, 110 bytes on stdout, code `tasks.grammar` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-tasks-line-format` | 140 | exit 3, 113 bytes on stdout, code `tasks.line-format` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-tasks-ids` | 140 | exit 3, 74 bytes on stdout, code `tasks.ids` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-tasks-phase-order` | 140 | exit 3, 136 bytes on stdout, code `tasks.phase-order` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-tasks-story-labels` | 140 | exit 3, 97 bytes on stdout, code `tasks.story-labels` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-tasks-story-exists` | 140 | exit 3, 106 bytes on stdout, code `tasks.story-exists` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-tasks-parallel-files` | 140 | exit 3, 125 bytes on stdout, code `tasks.parallel-files` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-tasks-mode` | 140 | exit 3, 289 bytes on stdout, code `tasks.mode` `tasks.mode` `tasks.mode` `tasks.mode` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-coverage-fr` | 140 | exit 3, 88 bytes on stdout, code `coverage.fr` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/lint-claims-missing` | 140 | exit 3, 151 bytes on stdout, code `claims.missing` | `skip` | the oracle of feature 141 is a skeleton: no comparator, no fixture declaration, no golden capture |
| `FX-30/guard-refuses` | 108 | — | `skip` | out of scope of feature 140 (the guard and the refused flag are feature 108's); and the oracle of feature 141 is a skeleton |
| `FX-30/refused-flag` | 108 | — | `skip` | out of scope of feature 140 (the guard and the refused flag are feature 108's); and the oracle of feature 141 is a skeleton |

Counts: 41 scenarios, **0 `equal`**, 0 `waived`, 0 `different`, **41 `skip`**,
each with its reason. 39 port halves ran (38 lint runs and one inventory run);
2 were not run here because they belong to feature 108.

Read with the table: each `lint-<code>` scenario raised **exactly its own code**
and nothing else, and its exit is 3 for an error code and 0 for a warning code —
the four warning codes of the closed family are `template.expected`,
`evidence.skipped`, `unknowns.placement` and `data-model.entities`.
`lint-tasks-mode` raises `tasks.mode` four times because its patch puts four
task lines in the wrong mode; that is one code, four findings.

## Part two, addressed to feature 141: the scenarios this feature needs

Each row is a scenario the first set does **not** hold that a requirement of
this feature needs in order to be proven against the reference rather than
against an extracted baseline. The route this feature took meanwhile is named,
so feature 141 can see what a capture would replace.

| # | Scenario asked for | Why feature 140 needs it | Surfaces | What this feature does meanwhile |
|---|---|---|---|---|
| R-140-01 | `inventory-non-ascii` | F140-FR-021: the fingerprint escapes a non-ASCII path and sorts by code point, where UTF-16 order disagrees. `plan` alone does not fix which tree is walked, and the one surface that matters is the fingerprint | `exit`, `stdout`, `tree` | `tests/parity/140/inventory-walk.test.ts` against the baseline extracted at `9cab15d` and the golden `packages/reverse/test/140/data/baseline-reference.json` |
| R-140-02 | `inventory-skips` | F140-FR-020: a binary file, an oversize file and an escaping link, each skipped with its reason and still fingerprinted. Quickstart scenario 3 asks for exactly this and has no scenario of its own | `exit`, `tree` | the same reference tree and golden record |
| R-140-03 | `inventory-subdirectory` | F140-FR-017: a subdirectory of a git work tree gives walk mode `walk`, not `git`. Quickstart scenario 4. The rule is a branch of the walk chooser and no capture fixes it | `exit`, `tree` | the golden case `subdirectory` of the same record |
| R-140-04 | `inventory-git` | F140-FR-017: the git listing, `git_head` and `git_status`, whose output forms are the facts `research.md` lists as `unverified` on macOS | `exit`, `tree`, `state` | a live `git init` in a temporary tree, skipped with its reason where `git` is absent |
| R-140-05 | `inventory-limit-invalid` | F140-FR-016: a limit that is not a positive integer gives exit 3 and `<NAME> must be a positive integer (got '<v>')`, and the run writes nothing. An exit-and-stderr scenario, which FX-30 has for the lint but not for the inventory | `exit`, `stderr`, `tree` | `tests/parity/140/inventory.test.ts` against the extracted baseline |
| R-140-06 | `lint-clean` | F140-SC-002 and quickstart scenario 5 both need the NEGATIVE case: a clean directory raises nothing and exits 0. The 38 members of the pattern are all positive | `exit`, `stdout` | `tests/parity/140/lint-levels.test.ts`, the clean trees of `fixtures.ts` |
| R-140-07 | `lint-level-invalid` | F140-FR-002: `--upto 6` gives exit 3 and the message of the levels. Quickstart scenario 6 | `exit`, `stderr` | `tests/parity/140/lint-levels.test.ts` |
| R-140-08 | `lint-json` | F140-FR-003: the `--json` form is a second output surface — one object, sorted keys, one-space indent, the field named `rule` at the baseline — and no scenario of the first set selects it | `exit`, `stdout` | `tests/parity/140/lint-levels.test.ts` |

A ninth item, not a scenario: the inventory of FX-30 must be compared **after
the key `schema` is removed** (register row DV-116, rule N-29 of annex X §X.8).
F141-FR-012 already confirms that handling; this feature's tests and its
`quickstart.md` assume it, and `packages/reverse/src/inventory/document.ts`
exposes `withoutTheSchemaKey` so the oracle has one place to call.

## One item of the repair report is closed

`specs/140-reverse-inventory-and-lint/repair-report.md` reported to feature 141
(point 2 of "What another feature or the orchestrator must do") that in
`contracts/fixture-catalogue.json` the pattern `lint-<code>` of FX-30 carried
`members: ["lint-claims-missing"]` while a second list nearby held all 38 names.
**That is fixed in the catalogue as it stands**: the FX-30 pattern has one
`members` key and it holds **38 names**, in the order of row 146 of annex X §X.6.
The check asserts it, so a regression would be caught. Nothing further is asked
on that point.
