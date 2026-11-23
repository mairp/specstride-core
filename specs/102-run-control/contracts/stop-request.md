# Stop request

Schema `specstride.inbox/1`, type `stop`. Logical name `inbox:stop`. One per workspace.

| Field | Meaning | Default |
|---|---|---|
| `schema`, `type`, `at` | As the envelope of annex B §B.11 | Absent in the empty request |
| `runTokenHash` | Hash of the run token, when a run was active | Absent |
| `now` | End owned processes at once | false |
| `jobs` | Also end adoptable jobs | false |

Rules: written by a temporary name and a rename (F102-FR-001). Empty or unreadable means a clean stop with the defaults; it never carries `now` or `jobs`. The engine removes it when it honours it. Honoured at: top of a phase attempt, before a pass, after a pass without phase evidence, during a yield wait, during a quota pause, during the backoff of a relaunch (F102-FR-003, F102-FR-009). Result: exit 6, `stop_flag`, `retryable: false`, `causedBy: operator`; the event `run.ended` carries `foundAt` (`attempt-top` at the top of a phase attempt, `pass-loop` elsewhere), from which the compatibility projection renders the as-is line (F102-FR-004, F102-FR-010). During the backoff and the pause the process that waits honours the request (features 123 and 127).
