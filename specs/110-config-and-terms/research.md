# Research: Configuration and terms

The research lives in `docs/ecosystem/research/`; this file summarizes what the plan rests on. Decisions in the form Decision, Rationale, Alternatives.

| # | Decision | Rationale | Alternatives | Source |
|---|---|---|---|---|
| 1 | The schema is a table of exact key spellings, validated strictly; unknown keys refuse the launch with a suggestion | A typo in a budget key must not silently run a costly job | Lenient loader with warnings (rejected: T-13 class) | R16 F6; F100-FR-203 |
| 2 | Eight ranks; the declared per-phase value is the default of the per-phase key; the learned value follows the baseline order per knob | Reproduces `resolve_proposer_timeout` and `resolve_yield_poll` inside the ranks of feature 100 | A ninth rank for the document (rejected: changes annex X) | Baseline `orchestrator.sh` at `9cab15d`; R16 F5.6 |
| 3 | Widening keys from user, environment, flag only; narrowing keys accepted from the project only if stricter | A cloned repository must not run code or pick a critic | Per-repository trust prompt (rejected: conflicts with unattended launch) | R11 T-13, R-4; DP-009 |
| 4 | Secrets are references of three schemes; inline values are errors, detected by type and by the redactor | T-35 | A scan by key name only (rejected: misses values under other keys) | R11 T-35; EP-10 |
| 5 | `parity` supplies the switch defaults at rank 8 | Fixtures can still name roles; the second suite sets one row | Profile above flags (rejected: fixtures could not name roles) | F100-FR-210, F100-FR-211 |
| 6 | Key spelling mixes camelCase and underscores as fixed by annex X and other features | Avoids editing 7 specifications | Normalise (offered to the owner) | annex X §X.7 |
| 7 | One YAML parser, the npm package `yaml`, pinned to the exact version 2.9.1, licence ISC, called in a mode that constructs no code (YAML 1.2 core schema, no custom tag, no merge key, duplicate keys refused) | Decision D-8 of feature 100 names the package and leaves the version and the licence to this feature's first task that uses it; a configuration file is attacker-reachable text in a cloned repository, so the parser must build data and nothing else | A range instead of an exact version (rejected: F100-FR-027); `js-yaml` (rejected: D-8 names one parser for the product); the default options of the parser (rejected: YAML 1.1 merge keys and registered tags) | `specs/100-specstride/research.md` D-8; F100-FR-027, F100-FR-029; plan.md "Primary Dependencies"; §T044 below |

## Facts that are `unverified`

This table is the verification record of this feature. A fact is `verified` only with the
date and the evidence that carries it; a fact that is `unverified` names why.

| Fact | Check | Status | Evidence / reason |
|---|---|---|---|
| Keychain existence query that prints nothing, **Linux** | Task T001 | `verified` 2026-10-01 | §T001 below; `packages/config/tools/keychain-probe.sh`; transcript `.specstride/features/110-config-and-terms/gates/proofs/T001-keychain-probe-linux.txt` |
| Keychain existence query that prints nothing, **macOS** | Task T001 | `unverified` | **Out of band.** No macOS runner exists in this repository's CI or in the campaign's environment, and the owner's ruling of 2026-09-30 forbids running or faking a person-run or macOS step here. Re-opened by task T041 when a runner exists |
| The configuration path on macOS | Loader run on a macOS runner | `unverified` | Same reason: no macOS runner (owner ruling of 2026-09-30) |
| Default values of the baseline that R16 read from code | Task T002 compares with the text at `9cab15d` | `verified` 2026-10-01 | §T002 below; `tests/characterization/110/baseline-defaults.test.ts`; report `specs/110-config-and-terms/baseline-defaults-report.md` |
| Alias parity (PT-110-alias-env), profile parity (CT-110-107, CT-110-112) and defaults parity (PT-110-defaults-baseline), **Linux** | Task T041, hermetic part | `verified` 2026-10-01 | §T041 below; `packages/config/tests/parity/alias.test.ts`, `packages/config/tests/unit/profile.test.ts`, `packages/config/tests/parity/defaults.test.ts`; transcript `.specstride/features/110-config-and-terms/gates/proofs/T041-parity-linux.txt` |
| Alias parity (PT-110-alias-env), **macOS** | Task T041, the same suite on a macOS runner | `unverified` | **Out of band.** No macOS runner exists in this repository's CI or in the campaign's environment, and the owner's ruling of 2026-09-30 forbids running or faking a macOS step here. The suite is not skipped on macOS and needs no change: it is run as it stands when a runner exists |
| Profile parity (the 178 switches against annex X §X.7), **macOS** | Task T041, the same suite on a macOS runner | `unverified` | Same reason: no macOS runner (owner ruling of 2026-09-30). §T041 below names what a run would add: the profile data is platform-independent, so only a platform-dependent default (`state.dir`, the user configuration directory) could differ |
| Defaults parity (the 45 `same` rows of T002), **macOS** | Task T041, the same suite on a macOS runner | `unverified` | Same reason: no macOS runner (owner ruling of 2026-09-30) |
| Licence and version of the YAML parser (`yaml` 2.9.1, ISC) and its no-code-construction mode | Task T044 | `verified` 2026-10-01 | §T044 below; `packages/config/tests/unit/yaml-parser.test.ts`; `packages/config/src/load/files.ts` (`YAML_PARSER_PIN`, `YAML_PARSE_OPTIONS`); `packages/config/DEPENDENCIES.md` |

### §T001 Result of the keychain probe (F110-FR-031)

Run on 2026-10-01 on Linux 7.0.14-15-pve by `packages/config/tools/keychain-probe.sh`. The
probe is hermetic: it opens its own D-Bus session (`dbus-run-session`) and its own throw-away
keyring store (`XDG_DATA_HOME` under `mktemp -d`), so it never touches the operator's keyring
and never reads a real credential. It creates one entry, queries its existence with the output
discarded, and removes it.

| Platform | Tool | Create | Existence query | Remove |
|---|---|---|---|---|
| Linux | `secret-tool` (libsecret), `/usr/bin/secret-tool` | `printf '%s' VALUE \| secret-tool store --label=L service S account A` | `secret-tool lookup service S account A >/dev/null 2>&1` | `secret-tool clear service S account A` |
| macOS | `security` | `security add-generic-password -s S -a A -w VALUE` | `security find-generic-password -s S -a A >/dev/null 2>&1` (no `-w`, so no value is written out) | `security delete-generic-password -s S -a A` | 

Findings on Linux:

1. **The exit status is the answer, not the output.** `secret-tool lookup` exits `1` when the
   entry is absent and `0` when it is present. The port reads only the exit status, so
   `exists` yields `yes` / `no` without any value crossing a pipe.
2. **The redirection is load-bearing.** `secret-tool lookup` writes the secret to stdout when
   the entry exists — the probe captured 25 bytes holding the probe value when it did *not*
   discard stdout. So the resolver MUST run the existence query with stdout and stderr
   discarded (`>/dev/null 2>&1`). This is the one behaviour that F110-FR-031 rests on, and it
   is now `verified` rather than assumed.
3. **The effect is durable and independently readable.** The keyring file on disk
   (`$XDG_DATA_HOME/keyrings/login.keyring`) went 105 bytes → 395 bytes → 105 bytes across
   create / probe / remove, with three different SHA-256 digests
   (`cd28c82c019eccdf…` → `0f583183b659a895…` → `df824b9552632efb…`). The probe therefore
   witnesses the entry's lifecycle through a read path that is not the tool's own response.
4. **The store is encrypted at rest.** Neither the service name nor the probe value appears in
   cleartext in the keyring file, so a probe leaves no readable value behind.
5. The probe printed no secret value at any step.

**What task T031 implemented from this probe (added 2026-10-01, phase 5).** Finding 2 above
records what the redirection does; F110-FR-031 then decides what the resolver may rely on. Its
third sentence reads "Where no such query is known on a platform, as on Linux until one is found,
`exists` MUST return `unprobed` and MUST NOT fall back to a query that prints the value." Because
`secret-tool lookup` **does** print the value — which is exactly what finding 2 measured — running
it with the output discarded is a fall-back to a query that prints the value, and the requirement
forbids it. `packages/config/src/secrets/keychain.ts` therefore carries
`silentExistenceArgv: null` for Linux, runs **nothing at all** for `exists` on that platform, and
returns `unprobed`, which is also what `KEYCHAIN_EXISTENCE_ON_LINUX` of
`@specstride/contracts/ep/secret-resolver` states. `resolve` still runs `secret-tool lookup` where
the tool is present, as the edge case of `spec.md` says. CT-110-126 observes "nothing was run" from
the invocation log that a fake tool writes itself, not from the resolver's answer. The macOS row
carries a silent query (`security find-generic-password` without `-w`) and stays `unverified`.

The macOS column of that table is **`unverified`**: it is the documented form of the `security`
command, not a probe result. It stays `unverified` until a macOS runner exists (task T041).

### §T002 Result of the baseline defaults check (F110-FR-006)

Run on 2026-10-01 against the Specstride baseline at `9cab15d`. The full report, with the
difference list for the orchestrator, is `specs/110-config-and-terms/baseline-defaults-report.md`;
the data is `specs/110-config-and-terms/contracts/baseline-defaults.tsv` and the check is
`tests/characterization/110/baseline-defaults.test.ts`.

The baseline gives a built-in default to 105 as-is variables. Of the keys they reach, 45 carry
the baseline value character for character, 36 carry it in the spelling of §K.2 (an empty
baseline value written as `unset`, `none` or `off`; `true` written as the switch value `on`;
`2.5` seconds written as 2500 milliseconds; `3 * 1024 * 1024` written as 3145728), 6 differ, and
18 reach no key of this feature (14 run-context variables and 4 of the locally registered
backend, DV-064). The six differences are each a decision another register row or feature
already made — the default proposer (`superseded-by DV-004`), the critic order of feature 124,
and the three launch facts of a harness that belong to its descriptor and not to the catalogue —
and they are reported to the orchestrator, not repaired here.

The two disagreements of `.env.example` that F110-FR-006 names were both confirmed in the text:
the critic (`dsh` in the template against the built-in `claude`, defect D-42, dropped) and the
Loki address (`:3110` in the template against the built-in `:3100`, defect D-41, port 3100
stands). So the entry "Default values of the baseline that R16 read from code" of the table
above is `verified`.

### §T041 The parity suites on Linux, and what stays `unverified` on macOS

Task T041 asks for the alias, profile and defaults parity tests on a macOS runner. The owner's
ruling of 2026-09-30 (OPERATOR SLOT) leaves a macOS step out of band: it is never run and never
faked in this campaign, the hermetic part is run on Linux, and the macOS part is recorded as
`unverified` with its reason — which is the four rows above.

Run on 2026-10-01 on Linux 7.0.14-15-pve (`uname -sr`), Node.js 22.23.2, by
`node --test` on the three suites. Transcript:
`.specstride/features/110-config-and-terms/gates/proofs/T041-parity-linux.txt`.

| Suite | File | Case ids | Result on Linux |
|---|---|---|---|
| Alias parity | `packages/config/tests/parity/alias.test.ts` | PT-110-alias-env | 28 tests, 27 pass, 0 fail, 1 skip (the reference half: the as-is system is not in this workdir) |
| Profile parity | `packages/config/tests/unit/profile.test.ts` | CT-110-107, CT-110-112 | 19 tests, 19 pass, 0 fail |
| Defaults parity | `packages/config/tests/parity/defaults.test.ts` | PT-110-defaults-baseline | 13 tests, 12 pass, 0 fail, 1 skip (the reference half) |

What a macOS run would add, and why nothing here is platform-blind:

- The alias table and the profile data are platform-independent text, and the three suites read
  them through the same code paths on either platform. A difference could only come from a
  default that the platform decides, and the catalogue has two: `state.dir` (the user's state
  directory) and the directory of `user:config`. Both are already `unverified` for macOS in the
  row "The configuration path on macOS" above.
- No suite is skipped on macOS and none has a platform branch, so the runner needs no new test:
  the same three commands are run and the four rows above are then closed with a date.

### §T044 The pin of the YAML parser (F110-FR-003)

Decision D-8 of feature 100 names the npm package `yaml` as the one YAML parser of the whole
product and leaves the exact version and the licence to the first task of this feature that uses
it. The pin, read on 2026-10-01 from the files, not from prose:

| What | Value | Where it is read from |
|---|---|---|
| Package | `yaml` | `packages/config/package.json`, `dependencies` |
| Exact version | `2.9.1` (no range, F100-FR-027) | `packages/config/package.json`; `package-lock.json` entry `node_modules/yaml` with its `sha512-` integrity hash; the installed `node_modules/yaml/package.json` |
| Licence | **ISC** | the installed `node_modules/yaml/package.json` (`"license": "ISC"`), its `LICENSE` file (the ISC text, "Copyright Eemeli Aro"), and the `license` field of the lock entry |
| Install script | none (`preinstall`, `install`, `postinstall`, `prepare` all absent) | the installed `package.json` |
| Native part | none (no `gypfile`, no `binding.gyp`, no `.node` file) | the installed tree |
| Transitive dependencies | none | the installed `package.json` |

ISC is permissive and compatible with MIT, which is what F100-FR-029 asks for; `plan.md` wrote
"MIT" for this dependency, and the package is ISC. The difference is recorded here and in
`packages/config/DEPENDENCIES.md`; no specification was edited for it.

The mode that constructs no code is `YAML_PARSE_OPTIONS` of
`packages/config/src/load/files.ts`, and `parseConfigText` is the only call of the parser in the
package:

| Option | Value | What it rules out |
|---|---|---|
| `version` | `"1.2"` | the YAML 1.1 schema; the core schema builds strings, numbers, booleans, null, sequences and mappings and nothing else |
| `customTags` | `[]` | every registered tag, so no tag of a document can name a constructor |
| `merge` | `false` | the `<<` merge key of YAML 1.1, which grafts one mapping onto another |
| `uniqueKeys` | `true` | a duplicate key winning silently; it is refused instead |

`packages/config/tests/unit/yaml-parser.test.ts` is the check. It asserts the pin in all four
places, the licence in the installed package and in this file, and then observes the mode through
`parseConfigText` on real text: every leaf of a parsed document is a string, a number, a boolean
or null; a document that names a constructor (`!!js/function`, `js/eval`, a Ruby class tag)
builds no function and no object of a class; the merge key stays a key of its own; a duplicate
key is refused; and `__proto__` in a document does not reach `Object.prototype`.

## Dependencies that feature 100 decided for this feature

The JSON Schema validator is Ajv, draft 2020-12, pure JavaScript, MIT: the one validator of feature 100 (`specs/100-specstride/research.md` D-2), which validates the parsed value against the schemas of `contracts`. The YAML parser is the npm package `yaml`: feature 100 names it the one parser of the whole product, a dependency of the package that loads configuration (this feature) and of no other (`specs/100-specstride/research.md` D-8); its exact version is pinned and its licence checked by task T044. Only the keychain tools stay `unverified` at the baseline (task T001).
