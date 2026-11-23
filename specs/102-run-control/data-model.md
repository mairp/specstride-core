# Data model: Run control (feature 102)

Records are defined by feature 100 (annex B). This feature owns the content of the stop request and the run snapshot, and the use of the others.

| Entity | Logical name | Schema | Writer | Fields used by this feature |
|---|---|---|---|---|
| Stop request | `inbox:stop` | `specstride.inbox/1`, type `stop` | CLI | `at`, `runTokenHash` (when a run was active), `now`, `jobs`. Empty means clean |
| Run snapshot | `run:<runId>:snapshot` | `specstride.snapshot/1` | CLI, at launch and at `resume --accept-source-change` (before the engine starts); the engine reads it and never writes it | `keys` (value, source, class, learned decision), `sourceHashes`, `profile`, `acceptedChanges` |
| Launch record | `launch:<launchId>:record` | `specstride.launch/1` | CLI | `reason` (`resume`), `outcome`, `refusal`, `engineExecutable`, and the truth values `resetCounts`, `acceptSourceChange` and `newRun` of annex B §B.7 (CQ-072) |
| Ledger | `run:<runId>:ledger` | `specstride.ledger/1` | Engine | `counters` in the namespace `core`; a reset record |
| Approval record | `gate:<N>:approved` | `specstride.approval/1` | Engine | verified on `resume` |
| Process registry | `run:<runId>:procs` | `specstride.procs/1` | Runtime root, engine | `class`, `pid`, `startTime`, `runTokenHash` for `stop --now` |
| Terminal record | `run:<runId>:terminal` | `specstride.terminal/1` | Engine | `exitCode` 6, `stopReason` `stop_flag`, `causedBy` `operator` |
| Run record | `run:<runId>:record` | `specstride.run-state/1` | Runtime root | state read by `resume`; never written by this feature |

## Snapshot keys

| Field of a key | Meaning |
|---|---|
| `value` | The resolved value; a secret as its reference |
| `source` | Rank of annex X §X.2 |
| `class` | `pinned` or `tunable`; none is read as `pinned` |
| `decision` | For a learned value, the id of the decision |

## Transitions this feature triggers

| Transition | Trigger | Written by | By this feature |
|---|---|---|---|
| T1 | `resume` or `launch` passes the checks | CLI | The launch record |
| T3 | A source hash differs | CLI | The launch record with outcome `refused` and the file named |
| T13 | A stop request is seen | Engine at boundaries; root for `--now` | Only the request |
| T17 | `resume` from `blocked-on-human`, `stopped`, `failed`, `dead` | CLI | A new launch record |

## Events this feature asks for

Types are those of the event catalogue (annex X §X.1). The CLI writes no event; the writer is the process that holds the event file.

| Type | Kind | When | Fields of `data` used |
|---|---|---|---|
| `run.launched` | instant | Every launch | `reason`, `countsCarried`, `countsReset` |
| `counters.reset` | instant | `--reset-counts` | `which`, `by` |
| `run.ended` | close | A stop is honoured | `stopReason` `stop_flag`, `exitCode` 6, `cause`, `causedBy`, `phase`, `foundAt` (`attempt-top`, `pass-loop`; asked of the catalogue and of annex X §X.6) |
| `run.ended` | close | `resume` continues a `dead` run: the dead launch is closed at T4, by the process that takes the lock | `cause` `crash`, `synthesized` true, no `causedBy` |
| `integrity.noted` | instant | An approval record fails its signature or a binding, or a bare marker is found, on `resume` | phase, the logical name of the record or marker, what failed |
| `blocked` | open | A refused `resume` for a changed source; synthesized | `reason` `source-changed`, `changedSource`, `changedRef`, `synthesized` |
| `unblocked` | close | `resume` leaves `blocked-on-human` (T17) | `by` (`operator`), `latencyMs` |
| `source.change_accepted` | instant | `resume --accept-source-change` with a changed source; one for each file | `file` (`spec`, `plan`, `tasks`), `changedRef` (logical name), `oldHash`, `newHash`, `acceptedAt`. Asked of the catalogue (W-111-02) |

## Refusals of `resume`

Before every refusal comes the state check of annex G §G.4: a workspace without state exits 1 (CQ-184). It is no member of the set.

| Refusal | Exit | Order |
|---|---|---|
| `nothing-to-resume` | 3 | 1 |
| `unsupported-record` | 3 | 2 |
| `lock-held` | 5 | 3 |
| `owner-survivors` | 5 | 3 |
| `source-changed` | 3 | 4 |
| `settings-invalid` | 3 | 5 |
