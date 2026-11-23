# Data model: dsh harness adapter (feature 130)

Entities of `spec.md` with their fields, rules and states. Names of files are logical names of
feature 100, annex B §B.5. Nothing here is a schema of feature 100; those are cited.

## Harness descriptor of dsh (`descriptorVersion: 1`)

| Field | Value | Note |
|---|---|---|
| `id` | `dsh` | |
| `kind` | `cli` | |
| `provider` | `id: dsh`, `termsRef: null` | Unknown terms |
| `origin` | `adapter` | Set by the loader |
| `detect` | executable `{harnesses.dsh.bin}`; version `--version`; home `{harnesses.dsh.home}` | Free of charge |
| `auth` | tiers 1 and 2; credential null (the harness owns its login) | |
| `models` | default null; window from configuration; select by overlay | |
| `roles.proposer` | supported; qualifier optional, label `provider/model` | |
| `roles.critic` | supported; qualifier optional; `toolless: config`; `readOnlyTools: false`; `freshSession: true` | |
| `invoke` | `contracts/argument-table.json` | |
| `stream` | `format: text` outside `parity`; none under `parity` | |
| `continuation` | `supported: false` | `session.continuation: none` |
| `failures` | `contracts/classifier-entries.json` | |
| `cost` | class `unknown` | |
| `isolation.envAllow` | search path, locale, home, permission mode, telemetry mode | |
| `isolation.configHome` | variable `DSH_HOME`; seeds none; the settings overlay is a hook | |
| `containment.ceiling` | C1, provenance `adapter`, mark `unverified` | |
| `memory` | existence unknown; switch null; both `unverified` until capture 6 | F130-FR-044. The critic role is refused while the state is neither `off` nor `absent` (F130-FR-045) |
| `capabilities.customisations` | per kind (`plugins`, `host-hooks`, `skills`, `tool-servers`): switch null | F130-FR-003, F130-FR-043 |
| `telemetry.off` | the telemetry-mode variable, off value | `unverified` until capture 5 |
| `concurrentSessions` | null | |
| `capabilities.pluginRequests` | true, only without a qualifier | |
| `versionRange`, `verifiedOn` | exactly `0.1.0-rc.8`; 2026-09-29 | |

## Settings overlay

| Field | Rule |
|---|---|
| Home | A directory in the temporary directory, name prefix `specstride-dsh-home.`; logical name `overlay:dsh:tree` |
| Entries | One link per entry of the real home except the settings file, hidden entries included |
| Settings file | New block `agent-default-model` with `provider`, `model`, optional `reasoningEffort`; then the real settings file with its own block of that name removed |
| Life | Created per pass or per critic call when a model override exists; removed after, also when killed |
| Failure | Line `could not build DSH_HOME overlay for <provider/model>`, result 1, nothing left behind |

## Critic patch and proof

| Field | Rule |
|---|---|
| Patch | A temporary file at the logical name `pass:<passId>:critic-patch`: 18 entries, each `id` and `disabled: true`; hash recorded |
| Coverage | Set of tool ids exposed by the installed version and profile, minus the ids of the patch, must be empty |
| Proof record | `version-pin`, `tool-coverage`, `patch-hash`, `permission-mode`, and the statement "weaker proof"; written to `attempt:<N>:<k>:<n>:critic-invocation` by the engine from what the adapter returns |
| States | `strict` proved; `refused` (`critic_not_toolless`); `none` (under `parity`, no proof made) |
| Deviation | The proof is the weaker one and departs from the text of Principle IX (CQ-182) |

## Customisation record

Written per run and repeated in the record of every pass and of every critic-class call
(F130-FR-043, F130-FR-044, F130-FR-045).

| Field | Rule |
|---|---|
| `kind` | `plugins`, `host-hooks`, `skills`, `tool-servers`, or native memory |
| `role` | proposer, or critic-class call |
| `asked` | The value of `harnesses.dsh.proposerCustomisations` or of `memory.native.proposer`; for a critic-class call always `off` |
| `state` | `off`, `absent`, `opted-in`, `not-switchable`, `as-is`. `off` and `absent` only with a recorded capture. `as-is` only under `parity`. `opted-in` never for a critic-class call |
| Effect | Proposer: `not-switchable` warns and the pass runs. Critic: native memory other than `off` or `absent` refuses the role with `memory-not-off` |

## Plugin request (`specstride-dsh-plugin-request/v1`)

| Field | Rule |
|---|---|
| `contract` | The schema id |
| `plugins` | 1 to 8 unique exact `package@semver` strings |
| `reason` | Non-empty text, at most 2,048 bytes |
| File | Regular, not a link, at most 16,384 bytes; exactly these three keys |

## Install receipt (`specstride-dsh-plugin-install/v1`)

`status` (`installed`), `profile`, `plugins`, `reason`, `requested_at`, `completed_at`,
`request_archive`. Written atomically beside the archived request. The port adds the run
record entry with the admitting allowlist entry of each plugin (F130-FR-034).

## State of a request

| State | Enter | Leave |
|---|---|---|
| absent | No file | A pass writes a request |
| claimed | The pass has exited; the file exists | Validated |
| refused | Any cause of the closed set | Ends the run with result 7 |
| installed | Installer exited 0; receipt written; request archived | Next pass fresh, or result 4 on the final pass |

## Classifier entry

`code` (`QUOTA`, `RATE_LIMIT`, `CONTEXT_WINDOW_EXCEEDED`, `INVALID_CREDENTIAL`), `class`,
`confidence`, `resetsAt` (parsed or null), `retryable`, and the streams scanned (both).
