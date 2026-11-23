# `specstride spec` (F104-FR-019, F104-FR-020)

| Subcommand | Prints | Exit |
|---|---|---|
| `feature-slug` | the slug; answered before the spec is read | 0 |
| `detect` | the format name | 0; 3 unknown format |
| `context` | `name<TAB>path` per document; nothing for native | 0 |
| `render-context` | the budgeted block, no added newline | 0 |
| `validate` | the phase count; or each finding on its own error line | 0; 3 |
| `tick <n>` | the count of changed lines | 0; 3 |
| `numbers` | each phase number per line | 0 |
| `title <n>` | the title, or an empty line | 0 |
| `shape <n>` | 16 hexadecimal characters, or an empty line | 0 |
| `slice <n>` | the raw section and one newline | 0 |
| `first-unapproved` | the first phase without a verified approval record; the verification is the engine's (F101-FR-031), handed to the verb as a port by the CLI | 0 |

Flags: `--specs FILE` (required), `--format`, `--workdir` (default `.`), `--gates-dir`, `--json` (opt-in).
Exit: 2 usage, which includes an unknown subcommand of `spec`; 3 invalid spec, unknown format, unreadable file, missing phase number; 1 non-numeric phase number (a chosen exit, not the uncaught error 70; CQ-042).
These are the codes of the row `spec` of annex G §G.4 of feature 100. The row "unknown first argument (verb): 1" of that annex is about the first argument of the product, not about a subcommand of `spec`.
