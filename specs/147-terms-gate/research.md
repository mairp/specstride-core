# Research: Terms gate

The research lives in `docs/ecosystem/research/` (R8, R8v). Decisions in the form Decision, Rationale, Alternatives.

| # | Decision | Rationale | Alternatives | Source |
|---|---|---|---|---|
| 1 | The gate is a pure table over a dated data file; an unknown status reads `refused` | Auditable; changes with data, not code | Code rules per provider (rejected: EP-11) | R8, R8v; EP-11 |
| 2 | Shipped audience `distributed`; Tier 1 for Claude, Codex and the Coding Plan of z.ai is an opt-in marked personal-only | R8v downgraded five cells | Default Tier 1 for both audiences (rejected by rulings 1, 2) | R8v; APPROVAL 1, 2 |
| 3 | Front harnesses are gated by the row of the provider in use | R8 rule 6 | Gating by the front's own row (rejected) | R8 |
| 4 | Staleness of data is a doctor warning, not a gate input | `evaluate` has no clock | Refusing old data (rejected: ruling 59 asks for a re-check, not a stop) | ruling 59 |

## Facts that are `unverified`

| Fact | Check |
|---|---|
| Provider terms sentences (documentation only; OpenAI pages from an archive copy) | Task T006: read the pages again |

Libraries: the schema validator is the one validator that feature 100 chose (Ajv, draft 2020-12, pure JavaScript, MIT; `specs/100-specstride/research.md` D-2); the dependencies are `@specstride/contracts` (schema types, the interface of EP-11) and `@specstride/kernel` (the table evaluator). The terms data is JSON, so this feature uses no YAML parser; a file that reads YAML would read it through the loader of feature 110, whose one parser is the npm package `yaml` (`specs/100-specstride/research.md` D-8).
