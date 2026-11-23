# Contracts of feature 112

| File | Content |
|---|---|
| `check-catalogue.tsv` | One row per core check: id, group, who supplies the probe, severity rule, `lb`, message template, fix hint |

Checks: every id is written in the table of `spec.md`; the rows with `lb` are exactly the ten of F112-FR-030; every group is one of the 19; every message is at most 200 bytes.

The column "probe supplied by" says where the code of a probe lives: `core` is the package of the doctor; every other value is the package of that owner, which registers through the registration call of the kernel package (F112-FR-033). Checks that are not rows of this file (F112-FR-021, F112-FR-022, F112-FR-033) live whole in the package of their owner. The rule of `critic.diversity` follows F112-FR-015: the results of the diversity test are row 183 of annex X §X.6 of feature 100.

The findings schema is `specstride.doctor/1`, `specs/100-specstride/contracts/schemas/doctor-findings.schema.json`. It is not copied here.
