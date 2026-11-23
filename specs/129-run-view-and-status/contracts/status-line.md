# The status line and the cursor token

## Grammar

A line of pairs `key=value` separated by one space, without a label (annex G §G.3, family "Status line"). It begins with `run=` and `st=`. A key whose value is null is left out.

| Order | Key | Value | Dropped when the line is too long |
|---|---|---|---|
| 1 | `run` | The run id | Never |
| 2 | `st` | The state, or `dead`, `stale`, `launch-abandoned`, `unknown`; where more than one holds, the first of `dead`, `launch-abandoned`, `stale`, `unknown` (F129-FR-027) | Never |
| 3 | `ph` | `<current>/<total>` | 8th |
| 4 | `unit` | `<done>/<declared>` | 4th |
| 5 | `rej` | The reject count | 7th |
| 6 | `el` | `<h>h<mm>m`, or `<m>m` below one hour | 6th |
| 7 | `next` | `<seconds>s`, from the supervision record | 2nd |
| 8 | `strategy` | `classic` or `micro` | 5th |
| 9 | `attn` | The number of attention items | 3rd |
| 10 | `cur` | The cursor token (only `wait`) | 1st |
| 11 | `validUntil` | A UTC timestamp, or `none` (only the precomputed line) | Never |

The line has at most 170 bytes. Keys are dropped in the order of the last column until it fits. Example, 60 bytes: `run=r-20260929-1 st=running ph=3/7 unit=12/40 rej=1 el=5h12m next=600s`.

## The cursor token

`cur=<offset>.<seq>.<sig>`: the byte offset after the last complete line read, the last `seq`, and the first 8 hexadecimal characters of the canonical record hash of the change signature. A token that does not fit the file or the run makes the projection start again; `wait` then prints the current line.

## The change signature

Fields, and no others: `runId`, `state`, `liveness`, `conditions` with reasons, `phase`, `approved` (count), `rejects`, `attention` (kinds and keys), `budgetLevels`, `strategy`. Not part of it: the pass, the units, the elapsed time, the timeline, `next`.

## The precomputed line

Written by the runtime at `run:<runId>:status-line` whenever the change signature changes and at every heartbeat, so that it is rewritten before `validUntil` passes, while the lease lives. The runtime also keeps the pointer `workspace:current:status-line` of annex B §B.5, which names the line of the current run so that a shell shim finds it without starting the product (F100-FR-229). A value such as `unit=` may therefore lag by up to one heartbeat interval. A live state carries the `validUntil` of the lease. A resting state carries `validUntil=none` and does not expire. A reader that finds a `validUntil` in the past prints that the state is unknown and names `status` (F100-FR-161).

## Default output of `status`

Line 1: the status line. Then one line per attention item: `[SPECSTRIDE-ATTENTION] kind=<kind> need="<text>" next="<command>"`, the values of `need` and `next` quoted as in JSON (F129-FR-025), at most 120 bytes each, text cut with `...` inside the quotes. The whole output at most 420 bytes. Items that do not fit: `[SPECSTRIDE-ATTENTION] more=<n>`.
