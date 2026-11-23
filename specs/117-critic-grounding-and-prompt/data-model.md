# Data model: Critic grounding and prompt (feature 117)

Types are given in words. Records of feature 100 are cited, not repeated.

## Citation

| Field | Meaning | Rule |
|---|---|---|
| `token` | The text as cited, after locators and trailing characters were stripped | F117-FR-003 |
| `source` | `evidence`, `section`, `carried`, `directory` | F117-FR-004, F117-FR-013 |
| `priority` | Truth value | F117-FR-004 |
| `form` | `relative`, `absolute`, `wildcard`, `placeholder` | F117-FR-005, F117-FR-006, F117-FR-010 |

## Resolved path

| Field | Meaning | Rule |
|---|---|---|
| `citation` | The citation | — |
| `realPath` | The real path, or none | Resolved before the refusal test |
| `label` | The path relative to the workspace root that the line shows | F117-FR-007 |
| `refusedRoot` | A member of the closed set of refused roots, or none. Never printed | F117-FR-018 |
| `how` | `exact`, `member`, `search-dir`, `basename`, `placeholder`, `wildcard`, `absolute` | F117-FR-005 |

## Presence line

| Field | Meaning |
|---|---|
| `kind` | `file`, `directory`, `missing`, `needs-grounding`, `wildcard`, `binary`, `unreadable`, `refused`, `not-shown` |
| `bytes`, `mtime` | For `file`, `binary`, `unreadable` |
| `entries` | For `directory` |
| `matches`, `names` | For `wildcard`; at most 20 names |
| `excerpt` | Kind (`whole`, `anchored`, `head-tail`, `omitted`, `none`) and text |

## Grounding snapshot

| Field | Meaning |
|---|---|
| `lines` | Presence lines, in order, at most the cap |
| `notShown` | Number of paths beyond the cap |
| `gap` | Tokens of the grounding gap |
| `probes` | Lines of the ignore probe and of the secret scan |
| `bytesUsed`, `budget` | Running total and scaled budget |
| `fingerprintBefore`, `fingerprintAfter` | Present when the switch of row 31 is on; never in the prompt as values |
| `refusals`, `markerLinesRemoved` | Records for events; no content |

## Block of the critic's prompt

The form of annex D §D.5: `id`, `bytes`, `hash`, `writer`, `protected`, `stable`.

| Block id | Writer | Protected | Shrinkable | Block set |
|---|---|---|---|---|
| `rules` | Runtime | Yes | No | both |
| `fact-block` | Runtime (content: 116) | Yes | Reduced by its own rule | `current` |
| `criteria` | Spec, through the canonical spec model | Yes | No | both |
| `evidence` | Proposer | No | Third | both |
| `grounding` (with gap list, probes) | Runtime, with outside text | No | Second | both |
| `pins` | Runtime | No | With `grounding` | both |
| `context` | Spec documents | No | First | both |
| `history` | Runtime, from feedback | No | Own cap | diagnostician only |
| `end` | Runtime | Yes | No | both |

## Verdict pins (`phase:<N>:verdict-pins`)

| Field | Meaning |
|---|---|
| `phase` | Phase number |
| `hash` | Backing hash of the priority files |
| `confirmed` | Sorted criterion ids |

States: none → stored (on REJECTED) → honoured or dropped (hash equal or not) → removed (on APPROVED).
The field `schema` is added by the rule of F100-FR-048; the as-is keys are compared through the layout table.

## Hidden-files record (`attempt:<N>:<k>:<n>:hidden-files`)

The record `specstride.hidden-files/1` of annex B §B.20, owner 117. The schema file is
`contracts/schemas/hidden-files.schema.json`; the field `schema` is required.

| Field | Meaning |
|---|---|
| `schema` | The constant `specstride.hidden-files/1`; required |
| `attemptId`, `callId` | The call |
| `files` | Per file: logical name, where it was, where it is kept, size, hash, mode, modification time, `existed` |
| `state` | `planned`, `hidden`, `returned` |

Transitions: `planned` (record written) → `hidden` (files moved) → `returned` (files back, hashes
equal). An engine start that finds `planned` or `hidden` returns the files first. The record is
written with the atomic write of the kernel; the files are moved through the file-moving port.

## List of withheld paths

The record `specstride.withheld-paths/1` of feature 100, annex C §C.4, kept under
`attempt:<N>:<k>:<n>:withheld-paths`: `deny`, `moved`, `confirmed`.
`moved` is filled from the hidden-files record.

## Validation rules

| Rule | Requirement |
|---|---|
| A refused root is never printed and never a gap | F117-FR-018 |
| The criteria block is never shrunk | F117-FR-023, F117-FR-033 |
| No block holds an excluded field | F117-FR-027 |
| A fact block with an unknown field or member is left out, with a statement | F117-FR-034 |
| A window without a source is no window | F117-FR-025 |
| Outside text reaches a sink only through the one ingress of F100-FR-009 | F117-FR-043, F117-FR-044 |
