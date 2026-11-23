# Amendments of feature 152 (commit backpressure)

Every change that feature 152 needs in a file it does not own, as **final text**, ready to be
pasted in. The owner answered CQ-152-01 to CQ-152-06 with A on 2026-11-09 (spec, "Clarifications"),
so each text below is approved; none is still a proposal. Tasks T155 and T156 of `tasks.md`.

Row numbers were checked on 2026-11-09 against the files named: the divergence register ends at
DV-120, §X.6 ends at row 285, and §X.7 ends at row 133.

## 1. Divergence register (`docs/ecosystem/consolidation.md`, section 6.6 "Other intended differences")

The register is kept on the private `main` only (not on `public-main`). Two rows, in the columns of
the section. **Not applied by this feature** (owner's choice, 2026-11-09): paste them on the private
`main` (Id | As-is behaviour (origin) | New behaviour | Decision behind it | Oracle handling |
Owner's ruling):

```markdown
| DV-121 | A commit that the secret scan blocks changes nothing in the loop: the phase stays approved, the run goes on, and the work of the phase stays uncommitted (F111-FR-031; B-0278 for other commit failures) | With `commit.backpressure` on, a blocked approval commit is not an approval: no approval record is written, the attempt ends `commit-blocked` and counts as a rejection, and the next attempt gets an engine-written corrective block; the same signature twice halts blocked on a human (blocked reason `commit-gate`) | F152-FR-001 to F152-FR-024; Principles I, II, III, XII; CQ-152-01 to CQ-152-04 | **Off** under the `parity` profile (§X.7 row 134); own tests CT-152-1 to CT-152-24 | Owner ruling 2026-11-09 (CQ-152-04 A): default on, `parity` off |
| DV-122 | A run whose commits the secret gate blocked ends with exit 0, and the digest says `commits_blocked=N` (the baseline) | The run exits 1 instead of 0 when the work of a phase stays uncommitted after a block, and prints that the work stays uncommitted; a run that halted keeps its own non-zero code. With `commit.backpressure` on, a block that the next attempt fixed does not count (F152-FR-022) | Owner ruling 2026-11-04 (commit-gate false positive), part A item 2; commits `621cd1ff`, `087a6101`; CQ-152-05 | **Waiver** on the blocked-commit fixtures of feature 152 (FX-27 holds no blocked commit): the exit 1 and the warning line are in force under every profile, `parity` included, so the oracle reads them as this row and not as `different`; one waiver per fixture and surface where it shows (task T148) | Owner ruling 2026-11-04; register row added by CQ-152-05 A (2026-11-09) |
```

Change the count line at the end of section 6 from "Count: 119 rows, DV-001 to DV-119 (…" to
"Count: 122 rows, DV-001 to DV-122 (… DV-120 after the analyze run of feature 107; DV-121 and
DV-122 for feature 152, owner rulings of 2026-11-09 …". (The line already lagged by one: DV-120
exists.)

## 2. Register map of the oracle (feature 141, `packages/oracle/data/register-map.json`)

One entry per register row (the file says so in its `note`). Append to `rows`:

```json
{
  "row": "DV-121",
  "handling": ["off"],
  "rules": [],
  "families": ["FX-27"],
  "note": "The switch commit.backpressure (§X.7 row 134) is off under parity, so the as-is path runs and FX-27 is compared as at the baseline. Feature 152; owner ruling 2026-11-09.",
  "registerText": "**Off** under the `parity` profile (§X.7 row 134); own tests CT-152-1 to CT-152-24"
},
{
  "row": "DV-122",
  "handling": ["waiver"],
  "rules": [],
  "families": [],
  "note": "The exit 1 after blocked commits (owner ruling 2026-11-04) is in force under every profile; on the blocked-commit fixtures the exit and the warning line are read as this row. Feature 152, CQ-152-05 A (2026-11-09).",
  "registerText": "**Waiver** on the blocked-commit fixtures of feature 152 (FX-27 holds no blocked commit): the exit 1 and the warning line are in force under every profile, `parity` included, so the oracle reads them as this row and not as `different`; one waiver per fixture and surface where it shows (task T148)"
}
```

The waivers themselves (`packages/oracle/waivers.json`, keyed by fixture, surface and row) are
written with the parity test T148, for each blocked-commit fixture and surface where the exit 1
shows; a waiver that matches nothing fails the suite, so none is written before its fixture exists.

The handling words are members of `HANDLINGS` (`packages/oracle/src/register/register-map.ts:63`),
and each `registerText` equals the "Oracle handling" cell of its register row, as
`checkRegisterMap` compares them.

## 3. Feature 100, annex E §E.2 "Blocked reasons" (`specs/100-specstride/annexes/E-engine.md`)

Add after the row `source-changed`:

```markdown
| `commit-gate` | Two consecutive blocked approval commits of one phase with the same signature (F152-FR-006), or a voided approval whose task list a human changed beyond its ticks, so the pre-tick bytes cannot be restored (F152-FR-014) | `commit_gate` | 2 | No |
```

The machine table that `packages/contracts/src/state/blocked-reasons.ts` reads gets the same row
(task T095). §E.3 and §E.4 do not change (CQ-152-01 A).

## 4. Feature 100, annex X §X.6 "Closed sets" (`specs/100-specstride/annexes/X-cross-layer.md`)

Row 4, column "Members": "The six of annex E §E.2" → "The seven of annex E §E.2".

Row 255, column "Members": append `voided`:

```markdown
| 255 | What failed in an approval record | `schema`, `signature`, `key-unknown`, `verdict`, `evidence-hash`, `verification-hash`, `missing`, `marker-only`, `voided` | 101 | Design | The record counts as not approved |
```

New row after 285:

```markdown
| 286 | Effects of a commit-gate rule | `block`, `exempt` | 152 | Design | The rule data is refused at load and the launch is refused with exit 3, naming the file (F152-FR-016) |
```

## 5. Feature 100, annex X §X.7 "The `parity` profile" (same file)

New row after 133:

```markdown
| 134 | A blocked approval commit becomes the next phase attempt with a corrective block, and a repeated block halts blocked on a human | `commit.backpressure` | on | off: the block is reported, the run goes on, and the run exits 1 at its end (DV-122) | 152 | DV-121 |
```

## 6. Feature 101 (`specs/101-gate-and-verdict/spec.md`)

**F101-FR-031** (line 377): after "…MUST each count as not approved and MUST raise an integrity
event that names the phase and what failed." insert:

> With the switch `commit.backpressure` of F152-FR-021 on, a record whose `verdictId` has a void
> marker of the commit gate (`commit-gate/phase<N>.void.json`) MUST also count as not approved,
> with the failure `voided` (annex X §X.6 row 255) (F152-FR-014).

**F101-FR-033** (line 388): append at the end of the requirement:

> With the switch of F152-FR-021 on, the commit gate runs before the approval record is written,
> so an attempt whose commit would be blocked writes no approval record and none of these steps
> runs for it; where the engine ended after an approval and before its commit, the next start runs
> the commit gate over the pending work before it honours the approval, and a block voids it
> (F152-FR-001, F152-FR-014).

**F101-FR-035** (line 401): after "A commit that fails MUST be ignored without a log line and
without an event." insert:

> With the switch of F152-FR-021 on, a commit that the secret scan blocks is not a failed commit
> of this kind: it ends the phase attempt as F152-FR-002 states. A commit that fails for any other
> reason is still ignored.

## 7. Feature 111 (`specs/111-event-schema-and-projection/spec.md`)

**F111-FR-031** (line 244): append:

> With the switch of F152-FR-021 on, the engine also raises `commit_gate.blocked`, which names the
> phase, the attempt ordinal, the rule ids of the block's signature, the number of files and the
> hash of the signature, and never a file name or a match (F152-FR-020).

The event catalogue (`packages/observability/data/event-catalogue.tsv`) gets the row of task T045.

## 8. Feature 149 (`specs/149-attempt-planner-and-seams/spec.md`)

**F149-FR-004** (line 178): "A failed verification gate, a MALFORMED verdict and a phase attempt
that ended without a verdict MUST NOT count." →

> A failed verification gate, a MALFORMED verdict, a phase attempt that ended without a verdict,
> and a phase attempt whose approval commit the commit gate blocked (F152-FR-007) MUST NOT count.

No code change follows: a blocked attempt's verdict is APPROVED, so `rejectionCountsTowardsK`
already leaves it out (task T104).

## 9. What does not change

- Annex E §E.1 (`next`), §E.3 and §E.4: unchanged (CQ-152-01 A, CQ-152-02 A).
- Feature 123 §R.6: row O-33 already refuses to relaunch a run blocked on a human.
- Feature 115: no change.
- `CORE_COUNTERS` of feature 100: no change (research D9).
