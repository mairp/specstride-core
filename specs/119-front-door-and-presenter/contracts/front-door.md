# Contract: the front door (feature 119)

Command schema for the verbs of this feature. Exit codes are those of annex G §G.4 of feature 100.

| Verb | Flags | Success | Exit codes |
|---|---|---|---|
| `tail` | `-w`, `--feature` | one `[SPECSTRIDE-TAIL]` line | 0; 1 |
| `events` | `-w`, `--feature`, `-f`, `--json` | `[SPECSTRIDE-EVENT]` lines | 0; 1 |
| `verdicts [N]` | `-w`, `--feature` | `[SPECSTRIDE-VERDICT]` lines | 0; 1 |
| `feedback N` | `-w`, `--feature` | one `[SPECSTRIDE-FEEDBACK]` line | 0; 1 |
| `phases` | `-w`, `-s`, `--feature` | one `[SPECSTRIDE-PHASES]` line | 0; 1; 3 |
| `watch` | `-w` | card | 0; 1 |
| `status` (compatibility output) | `-w`, `-s`, `--feature`, `--all` | as F119-FR-022 to F119-FR-027 | 0; 1 |
| Unknown verb | — | — | 1 |
| Uncaught error | — | — | 70 |

Every verb: `--json`, `--verbose`, `-h`.

Lines: `[SPECSTRIDE-ERROR] cmd=<verb> reason=<reason> fix="<fix>"`; `[SPECSTRIDE-TRUNCATED] left=<n> more=--verbose`; `[SPECSTRIDE-DATA] part=begin|end ...`.

Reasons: `no-state`, `no-feature`, `no-log`, `no-events`, `no-verdicts`, `no-verdict-for-phase`, `no-feedback`, `no-spec`, `spec-invalid`, `usage`, `unknown-subcommand`, `internal`.

`--json` records: schema id `specstride.inspect.<verb>/1`, owned by this feature (annex B §B.20 of feature 100, row of `specstride.inspect.<verb>/1`; F100-FR-227; answer applied 2026-09-30, CQ-099). The fields are listed in F119-FR-033 of `spec.md`. One schema file per verb lives in `contracts/schemas/` and is delivered to the `contracts` package, with `schema` required and `$id` `urn:specstride:schema:specstride.inspect.<verb>/1` (the rule of `specs/100-specstride/contracts/README.md`). `status --json` is `specstride.view/1` (annex G §G.6), not a record of this feature; `watch --json` prints the record of `events`.
