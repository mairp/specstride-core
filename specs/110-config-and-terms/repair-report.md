# Repair report — 110-config-and-terms

Written by the repair agent of feature 110 on 2026-09-30, in steps. The previous agent had left
`contracts/config-keys.tsv` rewritten and `spec.md` in work; this agent verified every worklist
item against the files, finished `spec.md`, and completed the other artifacts.

| Item | Class | Severity | State | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-110-01 | repair | high | done (previous agent; verified) | `contracts/config-keys.tsv` (14 parity values), `spec.md` §K.5, §K.6, §K.6b owner columns with "Row n; value" | Verified against annex X §X.7: rows 8, 9, 11, 31-33 off; 35 not reached; 57 `send`; 58 `as-is`; 87, 88 off; 92 not printed; 48 unset; 104 `0` |
| W-110-02 | repair | high | done (keys: previous agent; §K.8 variables: this agent) | `spec.md` §K.8 (six variables added), `contracts/alias-table.tsv` | The six `loop.yield.*` keys were in the catalogue; the six `SPECSTRIDE_*` variables were not in §K.8 |
| W-110-03 | repair | high | done | `spec.md` §K.8; `contracts/alias-table.tsv` (complete rewrite) | `SPECSTRIDE_AGENT_STREAM`/`_TAP` to `stream.tap`/`stream.tapExecutable`; `SPECSTRIDE_OTEL_TRACES`; four `RALPH_*` pairs (seconds converted to milliseconds); `SPECSTRIDE_PRIME_FLEET_BIN` first, `SPECSTRIDE_PRIME_BIN` when unset, named as the one exception to F110-FR-020 |
| W-110-04 | repair | high | done (previous agent; verified) | `contracts/config-keys.tsv` owners; `spec.md` §K.5, §K.6, §K.6b | Verified owner 147 (`distribution.audience`), 149, 148, 116, 146, 144, 145, 140, 143, 127, 122 |
| W-110-05 | repair | high | done already; not re-applied | `spec.md` §K.6 (`sandbox.level` row), F110-FR-019 | Both already carried the U-only reading; F110-FR-019 lists the key; `assumption: CQ-183` on the row |
| W-110-06 | repair | high | done already; not re-applied | `contracts/config-keys.tsv` rows of §K.6b | carry.* values 6144, set by plan, 3, 150000, 50, 300; reverse "as shown"; critic.catalogueWindowMargin 20, not used; verified against the item |
| W-110-07 | repair | high | done (previous agent; verified) | `contracts/config-keys.tsv` rewritten, 263 lines | One key per line, one type and one default; new columns `layers`, `profile_row`; 259 key rows, 3 withdrawn rows kept at the end |
| W-110-08 | repair | medium | done | `spec.md` F110-FR-017 | Parity exception of row 19 added; the doctor warning stays |
| W-110-09 | repair | medium | done already; not re-applied | `contracts/config-keys.tsv` (`toolchains.<id>` widening, owner 116; `harnesses.<id>.proposerCustomisations` widening, owner 131) | Verified: F116-FR-014 names `toolchains.<id>` and cites W-110-09; feature 100's report names `proposerCustomisations` for 131 and 134 |
| W-110-10 | repair | high | done | `spec.md` F110-FR-006 and the paragraph near line 110; `tasks.md` T002 | The reference is `orchestrator.sh` at `9cab15d`; `.env.example` only where it repeats a built-in default |
| W-110-11 | queue | medium | done (rename: previous agent; `Days`: this agent) | `spec.md` §K.2 rule 1 | `Sec, Ms, Min, Days, Bytes, Percent`; carried with `assumption: CQ-160` |
| W-110-12 | repair | medium | done | `spec.md` (clarification CQ-156 answer, ladder question) | The two bare "tier bump" occurrences now read "model-tier bump"; the rest already did |
| W-110-13 | repair | medium | done | `spec.md` constraints table | Logical names `project:config` and `user:config`; the paths stay with the plan |
| W-X-02 | pointer | high | done | `plan.md` Testing and Project Structure; `tasks.md` T030 | Suite `packages/testkit/src/conformance/EP-10/`, sample `packages/testkit/src/samples/EP-10/`; feature 100 builds the frame, 110 adds cases |
| W-X-04 | pointer | high | done | `spec.md` "Rows of the parity profile" | `supervise.wallClockSec` (the old `wallClockSeconds` stood there) |
| W-100-05 | pointer | medium | done already; not re-applied | `spec.md` §K.6 rows 124 and 108, F110-FR-007 | `verification.testPlan` `testautomation/<slug>/`, `verification.generateTests` off; verified |
| W-100-06 | pointer | medium | done already; not re-applied | `contracts/config-keys.tsv` row `loop.parallel.workersMax`; `spec.md` F110-FR-007 | Key of row 130, widening, `not used` under `parity`, owner 142; verified |
| W-100-23 | pointer | medium | done already; not re-applied | `spec.md` §K.6 `sandbox.level`, F110-FR-019 | U-only reading with `assumption: CQ-183`; verified |
| W-X-05 | pointer | low | done | `plan.md` Scale/Scope | 259 catalogue rows, 131 profile rows, counts tied to W-ORC-01 to W-ORC-03; the stale clause "row 34 names the profile" was already gone from `spec.md` |
| W-X-07 | pointer | low | done | `plan.md` Project Type | `@specstride/config`, layer L1, imports `contracts` and `kernel` only (package graph) |
| W-X-11 | pointer | low | done | `spec.md` "Rows of the parity profile" rewritten | Rows 44 to 131 of §X.7 exist and are cited; `attempt.tier_bump_after` named as row 128; no "needed"/"proposed" wording left |
| W-X-12 | pointer | low | done | `spec.md` "Closed sets" | Row numbers 44, 45, 237, 238, 239, 240, 241, 242 (added by feature 100); key classes point at rows 75 and 76 |
| W-X-14 | pointer | low | done | `plan.md` Constitution Check | The gate names the constitution v3.0.0 |
| W-X-22 | pointer | low | done | `spec.md` new section "Threats" | T-33: F110-FR-032 with F110-FR-027; T-34: the key `harnesses.<id>.envAllow` (F110-FR-009), behaviour 109 and 138 |
| W-X-27 | pointer | low | done | `plan.md` Primary Dependencies; `research.md` last section; `tasks.md` T044 (new) | Validator: Ajv (feature 100 D-2). YAML parser: the npm package `yaml` (feature 100 D-8); T044 pins the version and records the licence |
| W-123-04 | pointer | low | done | `spec.md` §K.8 last row | `NO_COLOR`, `FORCE_COLOR`, `TERM`, `COLORTERM` reach no key; the reading of `NO_COLOR` is the baseline's (B-1411, B-1412) |
| W-X-30 | pointer | low | done | `tasks.md` T002 | "the Specstride baseline at `9cab15d`" without a machine path |
| W-X-36 | pointer | low | not applied (accept) | — | The literal `harnesses.<id>.tiers` keeps the retired word by the ruling; verified it stands unchanged |

28 items: 27 done, 1 not applied (W-X-36, an `accept` item: no change is the change), 0 open.

## Requirements added or changed in place

No requirement id was added, removed, renumbered or reused; the feature keeps F110-FR-001 to
F110-FR-035 and the same test names. Changed in place, listed here under "Repairs after the
cross-feature review" (dated 2026-09-30) of `spec.md`:

| Requirement | Item | What changed |
|---|---|---|
| F110-FR-006 | W-110-10 | `orchestrator.sh` is the reference for the defaults; `.env.example` only where it repeats a built-in default |
| F110-FR-017 | W-110-08 | Under `parity`, no launch line without an as-is equivalent (row 19); the doctor warning stays |
| F110-FR-020 | W-110-03 | The stated exception: `SPECSTRIDE_PRIME_FLEET_BIN` before `SPECSTRIDE_PRIME_BIN`, first set wins, no conflict refusal |
| §K.8 (data of F110-FR-020, F110-FR-009) | W-110-02, W-110-03, W-123-04 | New alias rows; platform variables that reach no key |
| §K.2 rule 1 (data of F110-FR-001) | W-110-11 | Unit suffix `Days` added |

## What another feature or the orchestrator must do

- Feature 118: its table row "Yield settings, read by the baseline and not yet listed"
  (`specs/118-pass-supervision-and-jobs/spec.md:455`) can now cite the keys as listed: the six
  `loop.yield.*` keys are in §K.5 of 110 and the six variables in its §K.8 and
  `contracts/alias-table.tsv`. Words to drop there: "not yet listed" and "the alias table has no
  row for `SPECSTRIDE_FAILURE_*`".
- Feature 126: nothing to do; `stream.tap` and `stream.tapExecutable` were already in the
  catalogue and §X.8 maps the two variables to them.
- Feature 145: `NO_COLOR`, `FORCE_COLOR`, `TERM` and `COLORTERM` are declared variables of the
  platform in §K.8 of 110; the reading of `NO_COLOR` is the baseline's (B-1411, B-1412).
- Feature 138: `SPECSTRIDE_PRIME_FLEET_BIN` is read before `SPECSTRIDE_PRIME_BIN` (the exception
  to F110-FR-020); its spec should say the same order where it names the two variables.
- The orchestrator: nothing to apply in files of other features from this feature; the register
  rows cited by the counts of `plan.md` (W-ORC-01 to W-ORC-03) are the orchestrator's.

## New questions (each with a recommended answer and its source)

None. Every question this feature needed is already in the queue and applied as an assumption:
CQ-183 (W-110-05, user configuration only), CQ-160 (W-110-11, the new suffixes), CQ-156 to
CQ-159 (already on the spec). One defect to report, not a question: `specs/100-specstride/research.md`
numbers two different decisions "D-8" (the YAML parser and the conformance suites); feature 100
should renumber the second.

## Register rows needed (with the text)

None. The keys this feature added that carry a register row cite the rows the owning features
already hold (DV-080, DV-047, DV-002, DV-064, DV-027, DV-036); no new row is needed for the
repairs of this pass.

## Checks

| Check | Result |
|---|---|
| Generator or check of the feature in `contracts/tools/` | None exists; the generator is a task of the implementation (T004), so there was nothing to run |
| `python3 docs/ecosystem/check-traceability.py --require-all` | PASSED (checks a to h); feature 110: 25 `[h` lines, 0 faults; no `[h` line names feature 110 |
| `analyze-report.md` | Dated section "After the cross-feature review" appended, with the consistency pass |
| Ids | No requirement id, task id or test name reused; T044 appended; the sequence stays F110-FR-001 to F110-FR-035 |
| Size | 35 functional requirements, 6 success criteria, 37 tasks (T033 to T039 stay with feature 147); below 45 |

---

# Second pass after the cross-feature review (2026-09-30)

Sources for the items: section B of `docs/ecosystem/reviews/SECOND-PASS-LIST.md`; the first-pass
repair reports of features 116, 128, 130, 131, 134, 138, 142, 115; annex X §X.7 and §X.8 of
feature 100; baseline `9cab15d`. Every line number of the list was re-checked; several had moved
after the first pass rewrote the files.

| Item | State | Files and lines changed | Note |
|---|---|---|---|
| B1 | done already; verified | — | `config-keys.tsv:132` `toolchains.<id>`: profile of `specstride.toolchain/1`, no default, W (snap p), not used under `parity`, owner 116, proposed by 116; `spec.md` §K.5 line 210 agrees. Feature 116 proceeds without a row of annex X §X.7; nothing to do here |
| B2 | done already; verified | — | `config-keys.tsv:130` `integrity.phase_entry` owner is 116 (proposed_by 115), as annex X §X.7 row 32; `spec.md` line 208 agrees |
| B3 | done already; verified | — | All four cells stand: `config-keys.tsv:156`/`:157` give each URL key its own address (rows 97, 98); `:249`/`:250` give `262144` and `16384` (row 101); `:257` `telemetry.flush.intervalMs` default `2000`, under `parity` `0` (row 104) and `:258` `telemetry.queueMaxEvents` typed "whole number of events", `10000` (row 105); `spec.md` lines 341 to 350 agree |
| B4 | done already; verified | — | `config-keys.tsv:171` `compat.legacyEvents` owner 144, proposed_by 111 (row 17); `spec.md` line 254 agrees |
| B5 | done already; verified | — | `telemetry.sinkTimeoutMs` is narrowing (`N lo (snap t)`) in `config-keys.tsv:159` and in the copy of 128 (`specs/128-telemetry-export/contracts/config-keys.tsv:20`); `spec.md` line 242 notes why (a time limit). Row 46 gives the default 2000 and "not used" |
| B6 | done already; verified | — | The seven names stand in `alias-table.tsv:98` to `:104` and in `spec.md` §K.8 lines 382 to 385; the two time limits say "as-is seconds, decimal, converted to milliseconds (B-2275, B-2310)" where the table says conversions |
| B7 | done (note added) | `contracts/config-keys.tsv:138` | The key stands from the first pass (`off`, `on`; default `off`; widening; owners 131, 134; row 131). This pass recorded the further users 130 and 138 in the `confirmed_or_corrected` cell; the §K.6 row of `spec.md` (line 221) already said "Also read by 130 and 138" |
| B8 | done (empty-value reading added) | `spec.md` F110-FR-020 and §K.8 line 386, acceptance scenario 4, "Second pass" section; `contracts/alias-table.tsv:97` | The pair and the first-wins order stood from the first pass. Verified the baseline at `9cab15d`: `proposer.sh:609` reads the first else the second with `${…:-…}` (an empty value is unset); `lib/critic.py:2196`-`2197` and `:2257`-`2258` read with `os.environ.get` (an empty value is set); `.env.example:100`-`101` calls the second the legacy override. The sources do not settle the empty value, so the port takes the narrowest reading — an empty first variable is read as unset, as the pass loop reads it — and F110-FR-020 carries `assumption: CQ-196` |
| B9 | done already; verified | — | `config-keys.tsv:92` gives `loop.parallel.workers` the range "1 to the value of loop.parallel.workersMax"; `spec.md` line 170 adds that a value above the ceiling is a configuration error; `:93` holds the ceiling (row 130) |
| B10 | done already; verified | — | `config-keys.tsv:59` to `:61` hold `proposalMin`, `unitMin`, `checkMin` with the old spellings recorded as corrected; `spec.md` line 137 agrees; feature 100 row 65 confirmed |
| B11 | not applied (not this feature's file) | — | `specs/100-specstride/research.md` numbers two decisions "D-8". Not edited; the feature 100 agent of this batch handles it |

11 items: 9 done already and verified, 2 done in this pass (B7 note, B8 empty-value reading),
0 not applied except B11, which is outside this feature's directory, 0 reported as questions of
fact (one queued question, CQ-196, is reported below).

## Requirements added or changed in place

| Requirement | Item | What changed |
|---|---|---|
| F110-FR-020 | B8 | The narrowest reading of the prime launcher pair stated in the requirement: an empty `SPECSTRIDE_PRIME_FLEET_BIN` is read as unset, so the second variable is read; `assumption: CQ-196` |

Listed in the dated section "Second pass after the cross-feature review (2026-09-30)" of
`spec.md`, with the acceptance scenario that exercises it (`PT-110-alias-*`, tasks T005, T021,
T026 cover it; no new task was needed).

## What another feature or the orchestrator must do

- Feature 100: annex X §X.8 (its alias table) holds `SPECSTRIDE_PRIME_BIN` and
  `SPECSTRIDE_PRIME_AGENT_BIN` but not `SPECSTRIDE_PRIME_FLEET_BIN`
  (`specs/100-specstride/annexes/X-cross-layer.md:727`), and it holds none of the seven as-is
  environment names of B6. Add the fleet variable there with the first-wins order and the seven
  names; the key list of this feature cites §X.8 as the fixed table.
- Feature 100 (defect, item B11): `specs/100-specstride/research.md` numbers two different
  decisions "D-8"; renumber the second. Not edited from this feature.
- The orchestrator: queue CQ-196 (below). No other feature's files change from this pass.

## New questions (each with a recommended answer and its source)

- CQ-196 (feature 110): when `SPECSTRIDE_PRIME_FLEET_BIN` is set but empty, is it unset?
  The two sides of the baseline differ: the pass loop reads an empty first variable as unset
  (`proposer.sh:609` at `9cab15d`, `${…:-…}`); the critic reads only an absent variable as unset
  (`lib/critic.py:2196`, `os.environ.get`), so it would take an empty launcher; the fixtures of
  the baseline set both to the empty string for bare prime. Recommended answer: an empty first
  variable is read as unset — the narrowest reading, the one the pass loop takes, and the only one
  under which the second variable stays reachable (source of the answer: this feature's reading of
  the two baseline sides; no report recommends an answer). If answered otherwise, F110-FR-020,
  §K.8, acceptance scenario 4 and `alias-table.tsv:97` change, and an empty fleet variable with a
  variant gives an empty launcher under `parity`.

## Register rows needed (with the text)

None. No divergence register row is needed for this pass.

## Checks

| Check | Result |
|---|---|
| Generator or check of the feature in `contracts/tools/` | None exists; nothing to run |
| `python3 docs/ecosystem/check-traceability.py --require-all` | PASSED (checks a to h) after the changes; feature 110: 25 `[h` lines, 0 faults; no `[h` line names feature 110 |
| `analyze-report.md` | Dated section "Second pass after the cross-feature review (2026-09-30)" appended, with the consistency pass |
| Ids | No requirement id, task id or test name reused; the sequence stays F110-FR-001 to F110-FR-035, tasks T001 to T044 |
| Size | 35 functional requirements, 6 success criteria, 37 tasks (T033 to T039 stay with feature 147); below 45 |
