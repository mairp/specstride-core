# Events of pass supervision

As-is events (translated, projected byte for byte in the compatibility projection; fields in F118-FR-027 and F118-FR-035): `proposer_cap`, `pass_killed`, `yield_invalid`, `yield_job_start`, `yield_wait`, `pass_yield`, `yield_resume`, `yield_timeout`, `iter_short_pass`, `iter_cap`, `pass_cost_unknown`, `long_job_start`, `long_job_ended`.

New events (F118-FR-042; primary stream only; they project to nothing): `job.started`, `job.step`, `job.first_failure`, `job.ended` (field `msAfterFirstFailure`), `resource.wait` (`resource`, `holder`, `ms`). The stop of a job and the steps of the end of a pass are recorded as events; their type names belong to the catalogue of feature 111 and are requested from it, not invented here.

Free-text fields (`pass_killed.detail`, `pass_yield.reason`, `yield_job_start.argv`, `long_job_start.cmd`, the command and the argument list of `job.started`, the step of `job.first_failure`) hold text from outside the runtime. They are written after the one ingress and its redactor, cut to the size cap (F118-FR-044; F100-FR-200).

The ending of a wait on a yield has the members `satisfied`, `timeout`, `stop`, `wall_budget` (closed set row 112 of annex X §X.6, owner 118). A consumer of these events uses these four spellings.
