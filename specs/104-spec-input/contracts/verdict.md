# Records of the staleness verdict (F104-FR-023 to F104-FR-026)

Source record: `kind`, `name`, `path`, `contentHash`, and for `tasks` also `checkboxInsensitiveHash`.

Verdict: `result` (`fresh` or `stale`); `sources[]` with `name`, `path`, `state`
(`unchanged`, `ticks-only`, `changed`, `unreadable`) and for `tasks` `moreThanTicks`; `changed[]`, the
names of the sources that are `changed` or `unreadable`, in the order spec, plan, tasks.

Lines for a launch contract: `sources[<i>] hash changed: <path>`; `sources[<i>] cannot be read: <path>: <error>`. Every source of the contract is compared, of any kind of annex X §X.6 row 256, by index; the name rule of the run (`spec`, `plan`, `tasks`) does not apply to a contract (F104-FR-024).

Task-list reading: per phase `tasks[]` (`id`, `markers`, `text`) in order and `hash` (canonical record hash).
It is the content of the record `run:<runId>:task-list` of annex B §B.5, which the engine writes at launch; the record is validated against a schema of `@specstride/contracts` whose id feature 100 gives (`specstride.task-list/1`, annex B §B.20).
Comparison: `added[]`, `removed[]`, `reordered`, `textChanged[]`.
