# Refusals of `resume`

Before every refusal of this table comes the state check of annex G §G.4 of feature 100: `resume` on a workspace without state exits 1 (CQ-184). That exit is no member of the closed set (row 51 of annex X §X.6), and the oracle does not map it.

| Order | Refusal | Exit | Named in the message |
|---|---|---|---|
| 1 | `nothing-to-resume` | 3 | The logical name that is missing, or the finished run |
| 2 | `unsupported-record` | 3 | The logical name, the major found, the major supported |
| 3 | `lock-held` | 5 | The holder |
| 3 | `owner-survivors` | 5 | The surviving process groups |
| 4 | `source-changed` | 3 | Every changed file: `spec`, `plan`, `tasks` |
| 5 | `settings-invalid` | 3 | The key |

The oracle maps the as-is exit 1 to 5 and to 3. The refusal `source-changed` has no reference and its own tests. It is recorded in the launch record (outcome `refused`) and never as run state; readers derive `blocked-on-human`. Under the `parity` profile `source-changed` is not raised.

Ways out of `source-changed`: revert the change, `resume --accept-source-change`, or `launch --new-run`.
