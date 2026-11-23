# T031 — the rows of `spec.md` against the data of feature 100

**Task**: T031 · **Requirement**: F140-FR-016 · **Kind**: a report, not an edit ·
**Date**: 2026-10-03 · **Addressed to**: the orchestrator.

## What was checked, and against what

| The table of `spec.md` | The data of feature 100 it restates |
|---|---|
| "Rows of the `parity` profile" | row 69 of annex X §X.7 — `specs/100-specstride/contracts/data/parity-profile.json`, and the row of `specs/100-specstride/annexes/X-cross-layer.md` |
| "Closed sets" | rows 146 to 149 and 151 to 155 of annex X §X.6 — `specs/100-specstride/contracts/data/closed-sets.json`, and the rows of `specs/100-specstride/annexes/X-cross-layer.md` |

Row 150 of §X.6 ("Tasks modes of a reverse run") is feature 108's, which is why
T031 names two ranges rather than one. The check confirmed it: `owner` of row
150 is `108`, and of each of the nine others `140`.

The check is automated and runs on every pass:
`packages/reverse/test/140/rows-against-100-140.test.ts`. It reads feature
100's own files, never a list restated here, and it reads BOTH the shipped data
and the annex markdown, because the generator's note in `closed-sets.json` says
"the annex stands where the two differ" — a check of the data alone could agree
with a stale annex. The two agree, row for row, on all ten rows.

**No row of feature 100 was changed** (F100-FR-212: a feature must not change a
row of another feature; the row is added under the next free number and stated
in the feature's own two tables). Nothing in this report is an edit of feature
100; every item is for the orchestrator to rule on.

## Result: equal in substance, seven differences of wording or of detail

**There is no difference of substance.** On every one of the ten rows the
member set, its order, the owner, the "closed by" cell, the defaults and the
values under `parity` are equal. The seven differences below are all of the
same two kinds: `spec.md` says MORE than the annex in the same cell, or it says
the same thing in fewer words.

| # | Row | What `spec.md` says | What the annex says | Reading | For the orchestrator |
|---|---|---|---|---|---|
| D-140-01 | §X.6 row 147, Members | "`error`, `warning`. Warnings: `template.expected`, `unknowns.placement`, `data-model.entities`, `evidence.skipped`; all others errors" | "`error`, `warning`" | The member set is equal; `spec.md` adds the ASSIGNMENT of a severity to each code, which the annex does not carry and does not need to. The addition was checked against the shipped family `packages/reverse/data/finding-codes.json`: exactly those four codes carry `warning`, the other 34 `error` | Nothing. The annex row is about the closed set; the assignment belongs to the owner's specification |
| D-140-02 | §X.6 row 149, Members | "… `verified`, `unverified`, `disproved` (`desired` is refused)" | "… `verified`, `unverified`, `disproved`" | `desired` is NOT a member on either side. It is the as-is value the lint must refuse, and `spec.md` names it so a reader of F140-FR-009 knows why. Row 149's own "Unknown value" cell, "An error finding", already covers it | Nothing |
| D-140-03 | §X.6 row 146, Unknown value | "The lint never writes one; a reader treats a code outside the set as an error finding of unknown kind" | "Read as an error finding of unknown kind" | The same rule; `spec.md` adds who never writes one | Nothing |
| D-140-04 | §X.6 row 148, Unknown value | "Exit 3 with `--upto must be one of 0, 1, 2, 3, 4, 5`" | "Exit 3" | The same exit; `spec.md` adds the message, which parity requires it to fix | Nothing |
| D-140-05 | §X.6 row 151, Unknown value | "Baseline refused" | "The inventory is refused" | The only cell a reader could read two ways. Both say that an unknown walk mode is refused; `spec.md`'s two words can be read as "the baseline refused it" (a statement about the past) rather than "the inventory is refused" (the rule). The implementation follows the annex: `packages/reverse/src/inventory/walk.ts` refuses it | **The one item worth a ruling.** Recommended: at the next re-check of `spec.md`, replace "Baseline refused" with the annex's wording. It is an edit of feature 140's own file, so it needs no change to feature 100 — but it is outside the paths of this phase, so this pass does not make it |
| D-140-06 | §X.6 rows 146, 148, 151, 152, 153, 155, the label | Short labels: "Lint finding codes", "Lint levels", "Walk modes", "Skip reasons", "Roles of a file", "Languages" | Long names: "Finding codes of the reverse lint", "Levels of the reverse lint", "Walk modes of the source inventory", "Skip reasons of the source inventory", "Roles of a file in the source inventory", "Languages of the source inventory" | Every word of the short label is in the annex's name, so the rows pair unambiguously. The annex's names are longer because §X.6 holds 283 rows of 40 features and must disambiguate across all of them; `spec.md` holds nine | Nothing. Recorded so a later reader does not read a renamed set into the difference |
| D-140-07 | §X.7 row 69, Under `parity` | Each of the three rows repeats its default (1048576; 20971520; 24000) | One cell, "The same" | Equal in effect, and it is what F100-FR-212 asks for: the feature states the value under `parity` per switch | Nothing |

## Also checked, and in agreement

| Claim of `spec.md` | Checked against | Result |
|---|---|---|
| The three limits share row 69 of §X.7 | `parity-profile.json` row 69, `keys` | Equal, and in the same order: `reverse.maxFileBytes`, `reverse.maxTotalBytes`, `reverse.contextBudget` |
| The register row of each is DV-027 | `parity-profile.json` row 69, `registerRows` | Equal |
| The defaults are 1048576, 20971520 and 24000 | `parity-profile.json` row 69, `default` | Equal, and equal to `packages/reverse/src/inventory/limits.ts` |
| `SPECSTRIDE_CONTEXT_BUDGET` is in the alias table of §X.8, one variable for `spec.contextBudget` and `reverse.contextBudget` | the alias table of annex X §X.8 | Present, with exactly that wording; `SPECSTRIDE_REVERSE_*` → `reverse.*` is there too |
| Under `parity` no line without an as-is equivalent is printed, row 19 of §X.7 | `parity-profile.json` row 19, `parity` | "never printed" — equal |
| The last line of "Closed sets" (the schema of the inventory) has no row of §X.6 | `closed-sets.json`, every row of owner 140 | Confirmed: the nine rows are 146 to 149 and 151 to 155, and none of them is the schema id. It lives in annex B §B.20 |
| The 38 finding codes of row 146 | `packages/reverse/data/finding-codes.json` | Equal, set and order |

## One point of vocabulary, not a difference

"Rows of the `parity` profile" opens with "Feature 110 owns the spelling of
every key", while the Owner cell of row 69 of §X.7 reads `140`. The two are
different senses of ownership and neither is wrong: feature 110
(`specs/110-config-and-terms`) owns the configuration vocabulary — how a key is
spelled, and the catalogue it lives in — while the Owner column of §X.7 names
the feature that owns the SWITCH, which for row 69 is feature 140. No ruling is
needed; it is recorded because the two words sit three lines apart.

## Nothing is asked of feature 100

The orchestrator is asked to rule on **D-140-05 only**, and that ruling concerns
a cell of feature 140's own `spec.md`, not feature 100's data. The other six
differences are recorded for the record and need no action.
