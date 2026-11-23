# Data model: Spec input (feature 104)

| Entity | Fields | Rules |
|---|---|---|
| Model | `format`, `feature`, `sources[]`, `phases[]` | Pure function of the files; `format` is never `openspec` |
| Source | `kind` (spec, plan, tasks, other), `name`, `path` (repository-relative), `contentHash`, `checkboxInsensitiveHash` (tasks only) | Only recorded sources can be stale |
| Phase | `number`, `title`, `section`, `criteria[]`, `tasks[]` | Numbers ascend by 1; the first is free |
| Task | `id`, `markers[]`, `text`, `ticked`, `line`, `file` | Ticks and lines never enter a task-list reading hash |
| ContextDocument | `name`, `path` | Order per format |
| TaskListReading | `phase`, `tasks[] (id, markers, text)`, `hash` | The content of `run:<runId>:task-list` (annex B §B.5); written by the engine at launch, never by this feature |
| SourceVerdict | `name`, `path`, `state` (unchanged, ticks-only, changed, unreadable), `moreThanTicks` | |
| Verdict | `fresh` or `stale`, `sources[]`, `changed[]` | Stale if any source is changed or unreadable. The classification is the pure operation of the hasher of the kernel (annex X §X.5; CQ-214) |

Hashes are made by the canonical hasher, a module of `@specstride/kernel` that this feature builds (annex X §X.5).

State transitions: none. A tick rewrites boxes only; the verdict function has no state.
