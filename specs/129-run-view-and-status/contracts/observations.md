# The observations the caller supplies

The corrected list of the observations of F129-FR-001, confirmed with feature 122 and feature 123
on 2026-10-01 (task T003 of this feature's `tasks.md` covers the signal table; this file is the
output of task T004). `project` reads no file and makes no system call (F129-FR-001), so everything
below is read by the caller and handed in as a value. Where a field name is given, it is the field
of the record that feature 100 owns, and feature 100's annex stands over this file.

The test of this list is `tests/characterization/129/t004-observations.test.ts`, which reads the
annex tables and the contract files of features 122 and 123 named in the last column.

## The five observations, and the time

| # | Observation | Read from | Schema and owner | What the view does with it | Confirmed by |
|---|---|---|---|---|---|
| 1 | The result of a probe of the lease, with the lease's own fields | `run:<runId>:lease`, probed through the lock provider (EP-13) | `specstride.lease/1`, annex B §B.8, content owner 122 | `liveness` and the condition `dead` (F129-FR-012); `stale` with the reason `heartbeat-and-events-old` (F129-FR-013); the `validUntil` of the precomputed line (F129-FR-028); the launch nonce, to tell `launch-abandoned` from a live launch (F129-FR-014) | F122-FR-008, F122-FR-014; annex B §B.8 names RunView among the readers |
| 2 | The newest launch record | `launch:<launchId>:record` | `specstride.launch/1`, annex B §B.7, content owner 122 | `launch` (launch id, reason, outcome, engine start ordinal); the condition `launch-abandoned` (F129-FR-014); the attention item `source-changed` for a refused launch (F129-FR-018) | F122-FR-004, F122-FR-007; annex B §B.7 names RunView among the readers |
| 3 | The supervision record | `launch:<launchId>:supervision` | `specstride.supervision/1`, annex B §B.16, content owner 123 | The `next=` seconds of the status line and the supervision group of the view (F129-FR-027); the unchanged count; the relaunch budget, with the correction in the note below | F123-FR-040, F100-FR-072; annex B §B.16 names RunView among the readers |
| 4 | The result of a search of the process table for holders of the run token | The operating system, matched against `run:<runId>:procs` | `specstride.procs/1`, annex B §B.10, content owner 122 | The processes group of the view and the attention item `orphan-processes` (F129-FR-021); the survivor count of the item `dead-run` | F100-FR-063, F100-FR-064; annex B §B.10 names the CLI command `status` among the readers |
| 5 | The limit of the handshake | Ordinary configuration, `runtime.handshake.timeoutSec` | Configuration, owner 122 | The condition `launch-abandoned` (F129-FR-014); the rule that a run in `starting` with no lease yet is not `dead` before the limit has passed (F129-FR-012) | F122-FR-005; CQ-138 of feature 122 gives the default of 30 seconds |
| — | The time now | The caller's clock | — | The only wall-clock field of the view, `now` (F129-FR-006); every age the view computes | F129-FR-001 |

The list is the one F129-FR-001 states, and nothing was added or removed. The three named state
files (the run record, the terminal record and the pause record) are not observations; they are
inputs of their own, as annex G §G.6 has them.

## The two corrections

**C-1. The relaunch budget is not always in the supervision record.** F123-FR-040: with
`relaunch.owner: root` the supervision record holds the cadence state and the stop request only,
and the relaunch budget and the list of relaunches are read from the events `supervisor.relaunch`
of the root, which carry the attempt, the maximum and the remaining count. The view must therefore
take the relaunch budget from observation 3 where the owner of the relaunch is `supervise`, and
from the event row of `supervisor.relaunch` in `signal-table.md` where it is `root`. The signal
table already has that row; `contracts/run-view.md` says "relaunch budget where the supervise owner
keeps one", which is correct and is now cited to its source.

**C-2. The lease probe is a result and not a reading of the lease file.** F122-FR-014 forbids
liveness to rest on a process id alone or on the age of a file, and F122-FR-013 gives the seven
rows of the probe decision table (`contracts/probe-decision-table.json` of feature 122): `free`,
`unknown`, `held-foreign`, `held-live`, `owner-dead-group-alive`, `stale-owner-dead`. The caller
hands in both the result and the lease's own fields (`heartbeatAt`, `heartbeatEverySeconds`,
`validUntil`, `launchNonce`, `owner`, `lockProvider`, `leaseTokenHash`), because the view needs the
`validUntil` for the precomputed line and the nonce for `launch-abandoned`, neither of which the
result carries. A result the view does not know is read as `unknown` (F129-FR-012).

## CQ-166 — the form of the `refusal` of a launch record

**Granted upstream, and no longer an assumption of this feature.** The assumption of F129-FR-018
was that annex B §B.7 gives `refusal` as free text while the read model needs the blocked reason
and the file as separate values. Feature 100 amended the annex. The table of annex B §B.7 now
reads:

| Field | Meaning | Required |
|---|---|---|
| `refusal` | Reason of a refusal, from the closed sets of the refusals of a launch and of `resume` | No |
| `refusalFile` | The file that changed, when the refusal is `source-changed` | No |

So the two values are separate, and the first is a member of a closed set and not free text. The
amendment is recorded in feature 100's `spec.md`, in the table of amendments: the row "Annex B
§B.7, launch record", "as is: `refusal` as free text", "amended: `refusalFile` and four flags
added", with CQ-166 among the clarifications it answers.

What the read model may rely on:

| Question | Answer | Source |
|---|---|---|
| Which closed sets does `refusal` draw from? | Row 212 of annex X §X.6, the refusals of a launch written by the detached runtime and by `launch` (owner 122, the last two members 107); row 13, the launch-check refusals (owner 123); and row 51, the refusals of `resume` (owner 102), which holds `source-changed` | Annex B §B.7; annex X §X.6 rows 13, 51, 212 |
| Is `launch-abandoned` a member? | Yes, of row 212. F122-FR-007 has the next launch close an abandoned record by writing the outcome `refused` with the refusal `launch-abandoned`, and the view must not read that as a refusal the consumer caused | F122-FR-007; row 212 |
| What are the values of `refusalFile`? | `spec`, `plan` or `tasks`, the files of row 50 of annex X §X.6, which is the set F129-FR-018 and the item `source-changed` of `lane-and-attention.md` already use | Row 50; F102-FR-016, F102-FR-020 |
| What does the view do with a member it does not know? | It shows it as text and keeps the run shown as blocked, which is what rows 13 and 212 prescribe for an unknown member ("shown as text; the launch stays refused") and what F129-FR-018 already requires | F129-FR-018; rows 13, 212 |
| Is a run record written for such a refusal? | No. F102-FR-016 has the CLI write neither run state nor an event, so the launch record is the only source, and the view must derive `blocked-on-human` with the item `source-changed` from observation 2 alone | F102-FR-016; F129-FR-018 |
