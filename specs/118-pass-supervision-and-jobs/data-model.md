# Data model: Pass supervision and detached jobs

Fields are described in words. The schemas of the records that feature 100 owns are cited, not restated.

## Records this feature owns the content of

### Yield artifact (`specstride-pass-yield/v1`, annex D §D.6)

Written by the proposer as a claim. Read by the engine after the pass has exited. Fields: `contract`, `reason`, `job.mode` (`launch` or `adopt`), `job.argv` or `job.pid`, `job.cwd`, `job.log`, `resume_when.kind` (seven kinds), `resume_when.path`, `resume_when.pattern`, `resume_when.stable_sec`, `resume_when.pid`, `resume_when.argv`, `on_first_failure` (`stop` or `continue-and-notify`), `deadline_sec`, `on_resume`. Proposed optional field of a later minor: `job.resource` (CQ-057). `reason`, `on_resume` and `job.argv` are text from outside the runtime and enter through the ingress before they are written to an event, a line or a prompt (F118-FR-044).

### Kill note (`pass:<passId>:kill-note`)

Markdown. Run, phase, attempt, pass, kill reason and class, elapsed time, optional detail, the last 25 tool calls, the last 5 text blocks (600 characters each). The detail, the tool calls and the text blocks are written after the ingress (F118-FR-044). With the polite stop on, a section of the steps taken (step, time, grace applied, whether the pass had ended).

### Kill record

The kill note and the event `pass_killed`, which carries the same reason, class, elapsed time, detail and the path of the note.

### Job record (`job:<jobId>:record`)

Identity of the job (process id, group, session, start time, run-token hash), mode, predicate, deadline and start of the wait, yield index, whether the runtime launched it, and step times. Written by the engine. Read at the next engine start for adoption.

### Failure ledger of the baseline (`feature:<slug>:failure-ledger`)

Append-only JSON lines: `{kind: job, job, ts, log, failures}` and `{kind: failure, job, sig}`. Signatures and example lines are taken from the job log after the ingress (F118-FR-044).

## Records this feature reads

| Record | Owner | Used for |
|---|---|---|
| Process registry `specstride.procs/1` | 100 (content 122) | Identity check before a signal; adoption |
| Ledger `specstride.ledger/1` | 100 | Yield index, counters that survive a resume |
| Inbox `specstride.inbox/1` | 100 | The stop request during a wait; `stop --jobs` |
| Run record | 100 | Start time of the run for the wall-clock budget |
| Normalized stream records | 126 | Tool records for the repetition check |

## State of a wait

`waiting` (predicate not yet satisfied) leads to exactly one of `satisfied`, `timeout`, `stop`, `wall_budget` (closed set row 112 of annex X §X.6). A job stopped by the first-failure predicate ends the wait as `satisfied` with the mark `stopped-by-runtime` in its record. Adoption re-enters `waiting` with the remaining deadline.

## State of the end of a pass

`running` leads to `ended` (by itself) or to `stopping`, whose steps are `polite` (optional), `terminate`, `kill`; each step is recorded, and the pass is `ended` when its process is gone.
