# Data model: Detached runtime (feature 122)

Phase 1 of the plan. The schemas of the records are owned by feature 100 and are not repeated
here; this file says what this feature does with each record, and defines the entities that are
its own. State is named by logical name (feature 100, annex B §B.5).

## Entities

| Entity | Schema | Logical name | Writer in this feature | Rules from the spec |
|---|---|---|---|---|
| Launch record | `specstride.launch/1` (annex B §B.7) | `launch:<launchId>:record` | CLI | Written before the detach strategy is called; outcome written once; closed as `launch-abandoned` by the next launch (F122-FR-004, F122-FR-005, F122-FR-007) |
| Lock | EP-13 | `workspace:lock` | Lock provider | Never without its owner record; held from `acquire` to `release` (F122-FR-014) |
| Owner record | annex B §B.9 | part of the lock, the lease and the marker | Lock provider, runtime root | All eight fields; a missing field reads as `unknown` (F122-FR-013) |
| Lease | `specstride.lease/1` (annex B §B.8) | `run:<runId>:lease` | Runtime root; engine in start mode `standalone` | Carries the launch nonce; heartbeat at the interval; `validUntil` = heartbeat + grace; holds the hash of the token handed down (F122-FR-005, F122-FR-014, F122-FR-018) |
| Workspace record | `specstride.layout/1` (annex B §B.6) | `workspace:record` | Runtime root | `lockProvider` written at the first acquire; `workspaceId` derived from the real path (F122-FR-019) |
| Process registry entry | `specstride.procs/1` (annex B §B.10) | `run:<runId>:procs` | The process that started the child | Written before the child works; closed with `endedAt` and `endCause` (F122-FR-023) |
| Inbox request | `specstride.inbox/1` (annex B §B.11) | `inbox:stop`, `inbox:hold-relaunch`, `inbox:host-events:<launchId>` | CLI | Atomic write; validated before use (F122-FR-029) |
| Advisory marker | owner record | `workspace:active` | Runtime root | Present while the run lives; rewritten when missing (F122-FR-038) |
| Layout version file | the layout version, major and minor, as text | `workspace:layout-version` | Runtime root; engine in start mode `standalone` | Written at the first launch, after the lock and before the marker; equal to `layoutVersion` of the workspace record; read at every later launch; another major refuses the launch (F122-FR-043) |
| Runtime log | text | `launch:<launchId>:runtime-log` | Runtime root | Standard output and standard error of the root (F122-FR-001) |

Entities of this feature alone:

| Entity | Fields | Rules |
|---|---|---|
| Run token | 32 random bytes; never on disk; `runTokenHash` in records | Minted at every launch; in the environment of every process of the launch (F122-FR-024) |
| Lease token | random bytes; `leaseTokenHash` in the lease | Handed to the engine by `handDown`; presented to `verify` (F122-FR-018) |
| Liveness endpoint | path (in the owner record of the provider's own data), owner-only | Carries no data; short path (F122-FR-021) |
| Survivor | pid, start time, hash of the token found, and from the registry entry, where one exists: `procId`, kind, class | Result of the search of the process table (F122-FR-027) |
| State archive | see `contracts/state-archive.schema.json` | Signed; owner-only; never inside the working tree (F122-FR-033) |
| Spike result | see `contracts/spike-cases.json` | One per case; `survived`, `ended` or `skipped` with a reason (F122-FR-040) |
| Detach strategy description | `id`, `survives` (subset of `parent-end`, `session-end`, `reboot`) | From `describe` (F122-FR-003) |

## Relations

```text
workspace 1 ── 1 lock ── 1 owner record
workspace 1 ── 1 workspace record (lockProvider)
workspace 1 ── 0..1 advisory marker ── owner record
workspace 1 ── 1 layout version file (equal to layoutVersion of the workspace record)
run 1 ── n launch ── 1 launch record (launchNonce)
run 1 ── 1 lease (current launch: launchNonce, owner record, leaseTokenHash)
launch 1 ── 1 run token ── n process registry entries (runTokenHash)
engine start 1 ── n process registry entries (owned | adoptable)
feature 1 ── 0..n state archives
```

## Life cycles

### A launch

| Step | State of the run (annex E §E.2) | Record written | By |
|---|---|---|---|
| Launch checks pass | `created` (T1) | Launch record, no outcome | CLI |
| Detach strategy called | `starting` (T2) | — | CLI |
| Lock taken, lease written | `running` (T4) | Lock, workspace record (first time), layout version file (first time, or when missing), lease, marker, event of the launch | Runtime root |
| Lease with the nonce seen | — | Launch record: `outcome: started` | CLI |
| Another lease of a live run seen | — | Launch record: `outcome: attached` | CLI |
| Limit passed, strategy failed, or a refusal of this feature | — | Launch record: `outcome: refused`, `refusal` | CLI |
| CLI died before an outcome | derived `launch-abandoned` | Next launch writes `outcome: refused`, `refusal: launch-abandoned` | CLI of the next launch |

### The lock

| From | Event | To |
|---|---|---|
| `free` | `acquire` wins | `held-live` |
| `held-live` | `release` | `free` |
| `held-live` | owner dies, an `owned` process lives | `owner-dead-group-alive` |
| `held-live` | owner dies, no `owned` process lives | `stale-owner-dead` |
| `owner-dead-group-alive` | the last `owned` process ends | `stale-owner-dead` |
| `stale-owner-dead` | `reclaim` wins | `held-live` (new owner) |
| any held | probed from another host or pid namespace | reads as `held-foreign` |
| any | owner record unreadable, provider failed | reads as `unknown` |

### A process registry entry

| From | Event | To |
|---|---|---|
| — | the child is started | open (`startedAt`) |
| open, `owned` | the child exits | closed: `exited` or `signalled` |
| open, `owned` | a stop ends it | closed: `ended-by-stop` |
| open, `owned` | the engine ended and the root ends it | closed: `ended-by-root` |
| open, `owned` | found as a survivor at an engine start or `resume` | closed: `ended-as-survivor` |
| open | identity check fails | closed: `identity-mismatch`, no signal |
| open, `adoptable` | next engine start, process lives | open, adopted |
| open, `adoptable` | next engine start, process gone | closed: `gone` |

## Validation rules

| Rule | Source |
|---|---|
| Every record read is validated against its schema; a different major is refused | Feature 100 F100-FR-049 |
| A signal needs pid, start time and run token to match | F122-FR-025 |
| A request in the inbox of an unknown type is ignored and reported | F122-FR-029 |
| A control root that another user can write is refused | F122-FR-022 |
| An archive location inside the working tree is refused | F122-FR-033, F122-FR-034 |
| A layout version file of another major refuses the launch; a workspace part without the file is not read as state | F122-FR-043 |
