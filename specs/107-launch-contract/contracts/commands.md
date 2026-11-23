# Commands of the launch contract (proposal; the spelling is this feature's)

An argument that names the launch contract, the launcher or the launch bundle takes a path or a logical name (`pipeline:<pipelineId>:contract`); a host passes logical names only (F107-FR-039).

| Command | Flags | Output | Exit |
|---|---|---|---|
| `contract derive` | `--repo DIR` (required), `--feature PATH` (repeatable), `--output PATH` or `-`, `--learning-mode off\|suggest\|apply` (default `off`) and `--applied-file PATH` (rules of feature 106), `--comment TEXT`, `--comment-selects features\|relaunch\|learning` (repeatable; only with `--comment`) | Compatibility output: the draft on standard output, sorted keys, indent 2. Default output: the draft under its logical name and the line `[SPECSTRIDE-DERIVE]` | 0; 2 any error |
| `contract derive --next-batch` | the draft | One batch as a record of `specstride.judgment/1`: id, items, remaining count, boundary | 0; 2 |
| `contract derive --answer` | the draft, the batch id, and for each item `<item id>=<choice id>` | The line `[SPECSTRIDE-JUDGMENT]`: recorded count, remaining count, and `complete` when the draft was completed | 0; 2 a refused answer included |
| `contract validate` | the launch contract, `--allow-draft`, `--no-source-check`, `--promote` | `valid <status> launch contract: <id>` or errors | 0; 2 promote with allow-draft; 20 invalid; 23 stale |
| `contract render` | `--contract`, `--output`, `--replace-edited` | `rendered <output>`, `bundle <bundle>` | 0; 2 usage; 20 cannot render; 23 stale |
| `launch` | `--mode run\|dry-run` (default run), `--dry-run`, `--comment TEXT`, `--comment-selects mode`, `--new-run`, `--json` | Mode `run`: the lines of the owner of the handshake (122). Mode `dry-run`: the line `[SPECSTRIDE-DRY-RUN]`, the launch checks, and the plan of the pipeline entry (123) | `run`: 0; 4; 20, 21, 23, 24 (annex G §G.4). `dry-run`: 0; 4 a refusal of this feature; 20 no promoted launch contract; 23 stale |

Every command offers `--json` with a `schema` field. In the `--json` form of `contract validate` and `contract render` every error names its error class, one of the ten of the spec (F107-FR-040). Exit codes are those of annex G §G.4; codes 0, 2, 20, 23 are the as-is codes.

## Product lines of this feature

Lines with no as-is equivalent, in the grammar of annex G §G.3 (pairs `key=value`). None is printed under the `parity` profile (F100-FR-176). State is named by logical name; no value holds text of the repository.

| Line | Keys | Printed by |
|---|---|---|
| `[SPECSTRIDE-DERIVE]` | `contract` (logical name), `sources`, `tasks`, `declarations`, `commands`, `mappings` (the three counts of F107-FR-008), `verification`, `reason` (`declared` or `configured`), `learning` (only when `apply` was asked and `suggest` was written, F106-FR-033) | `contract derive` |
| `[SPECSTRIDE-JUDGMENT]` | `batch`, `recorded`, `remaining`, `state` (`open` or `complete`), and with a delegation `delegated` (the harness id) | `contract derive --answer`; `--next-batch` of a host without a model |
| `[SPECSTRIDE-DRY-RUN]` | `pipeline`, `features`, `stages`, `limits` (the time limit of each stage), `verification`, `reason`, `comment` (redacted and cut, or `none`), `changed` (the options the comment selected, or `none`) | `launch` in the mode `dry-run` |
| `[SPECSTRIDE-REFUSE]` (annex G §G.3) | `action=launch`, `reason` (`unknown-mode`, `comment-changed`), `next` | `launch` |

## The batch record

`specstride.judgment/1`. Fields: `schema`, `contract` (logical name of the draft), `batch` (id), `remaining`, `boundary` (the random boundary of this call), `items`. An item: `id`, `kind`, `anchor` (`path`, `line`, `anchor`), `excerpt` (between two lines that carry the boundary; `cut: true` when it was cut), `choices` (each `id` and a fixed text of the product). At most 8,400 bytes for the whole record.
