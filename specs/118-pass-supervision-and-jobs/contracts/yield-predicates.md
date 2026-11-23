# Predicates of a yield

Owner: feature 118 (annex X §X.6 row 69). Result of an evaluation (row 114): 0 satisfied, 1 not yet, 2 unsatisfiable (read as `timeout`). Outcomes of the wait (row 112): `satisfied`, `timeout`, `stop`, `wall_budget`.

| Kind | Reads | Satisfied when | Unsatisfiable when | Required fields |
|---|---|---|---|---|
| `pid` | Liveness of a process | The target (`resume_when.pid`, else the job) is no longer alive | Never | none |
| `exit_code_file` | A path | The path (default: the job's exit-code file) exists | Never | none |
| `file_exists` | A path | The path exists | Never | `resume_when.path` |
| `file_stable` | Modification time | The file is at least `stable_sec` old (default 60); a missing file is not yet stable | Never | `resume_when.path` |
| `grep` | The last 4 MiB of a file | The pattern matches; a missing file is not yet satisfied | Invalid pattern | `path`, `pattern` |
| `command` | Runs a fixed argument list, no shell, 120 s limit | Exit 0 | The command cannot be run; refused unless allowed | `argv` |
| `first_failure` | Whole lines appended to the same file after the job started | A matching line is present at two successive polls | Invalid pattern | `path`, `pattern`, `on_first_failure` |

Actions on a first failure: `stop` (default; only a job the runtime launched), `continue-and-notify`.
