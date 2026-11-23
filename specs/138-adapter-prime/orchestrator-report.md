# What feature 138 sends the orchestrator

**Task**: T062 of `tasks.md` (phase 9). **Date**: 2026-10-27.
**Held to account by**: `tests/characterization/138/facts.test.ts`, which re-reads the four
deliverables below against the code of `packages/adapter-prime` on every build, so this report
cannot go stale in silence.

This is a report and never a repair: this feature edits no file of another feature and no file of
the orchestrator. The wording below is what the named rows and keys NEED; applying it is the
receiver's act.

## 1. The wording register row `DV-112` needs

Register row `DV-112` (telemetry off; owner ruling 37; the telemetry rule from R14 rule 7 and
R9 F17; named by F138-FR-041), column **Oracle handling**:

> **Waiver** on the surface `transcript` for the two variable names, in the scenarios of FX-01,
> FX-06 and FX-26 in which the prime stub is started

(replacing the current text, which also lists FX-18).

**Reason**: in the four prime scenarios of FX-18 (`harness-missing-prime`,
`harness-missing-prime-launcher`, `prime-variant-with-model`, `prime-empty-variant`) the pass fails
before the harness starts, so the stub records no environment and a waiver would match nothing —
which fails the suite (F141-FR-022: a waiver that matches no difference fails it). Feature 141
writes no waiver for FX-18 already (`specs/141-parity-oracle/contracts/register-map.json`, note of
DV-112); the scenario table of §O.2 marks no FX-18 scenario with the DV-112 waiver. The as-is state
is recorded in this feature's own test of the two missing-harness scenarios,
`tests/parity/138/c054-not-found.test.ts`: no scenario of FX-18 starts the prime stub.

## 2. The launcher variables of prime, and their order (F138-FR-003)

Two as-is variables reach the key `harnesses.prime.launcher`, IN THIS ORDER (B-0518; the one
exception of F138-FR-003 to the rule of F110-FR-020 that refuses two variables over one key):

| Order | Variable | Read when |
|---|---|---|
| 1 | `SPECSTRIDE_PRIME_FLEET_BIN` | first: it wins whenever it is set, empty or not (the pass loop reads it with the shell default expansion of the baseline, `proposer.sh:609`) |
| 2 | `SPECSTRIDE_PRIME_BIN` | only when the first is UNSET — the legacy alias (`.env.example:100`-`101`) |

The agent executable is a different name: the key `harnesses.prime.bin`, the alias
`SPECSTRIDE_PRIME_AGENT_BIN`, the as-is default name `prime-agent` (B-0517). The launcher is never
probed for a version (F138-FR-002). The order is data in the adapter:
`PRIME_LAUNCHER_ALIAS_ORDER` in `packages/adapter-prime/src/proposer/names.ts`.

## 3. The ids of the doctor checks (F138-FR-006, F138-FR-007)

The adapter registers seven checks, each with the id form `harness.prime.<check>`:

| Id | Severity rule | `lb` |
|---|---|---|
| `harness.prime.executable-present` | fail when absent | yes |
| `harness.prime.version-in-range` | warn outside the range | yes |
| `harness.prime.launcher-present` | its finding only applies when a variant is in use; no severity of its own | no |
| `harness.prime.credential-of-role` | fail when the role's credential is absent (per role in use) | yes |
| `harness.prime.terms-unknown` | warning, always (the terms row is unknown) | no |
| `harness.prime.containment-opt-in` | fail when prime is the proposer and no C0 opt-in | yes |
| `harness.prime.critic-window-known` | a finding of its probe; no severity rule of its own | no |

A check that times out is a WARNING and never raises the code above that of a warning. The known
failure the adapter cannot detect (F138-FR-007) is classified by its words like any other error and
is NOT guessed: no check here claims it. The ids are data in
`packages/adapter-prime/src/doctor/index.ts` (`primeDoctorCheckIds()`).

## 4. The package of the reader (F138-FR-023 to F138-FR-037)

The JSONL reader for stream schema version 3, with the dialect table that pi (feature 134) shares,
ships in **`@specstride/adapter-prime`** (`packages/adapter-prime`, source under
`packages/adapter-prime/src/reader/`, the dialect table under
`packages/adapter-prime/data/dialects/`). It registers in the registry of stream readers under the
format `jsonl`, selected by the dialect name (`registerPrimeReader`,
`packages/adapter-prime/src/reader/register.ts`). Earlier documents that name `@specstride/stream`
for this reader (the plans of 134 and of this feature, "Project Type") are superseded by the
decision D-1 of `research.md` — one family reader, in the package of the tested adapter — and by
the repair report's row on feature 134. No other package exports it.
