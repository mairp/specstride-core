# Data model: Proposer pass (feature 103)

Entities of the feature and their relations. Names in words; field types are in `contracts/`. Records of feature 100 (ledger, snapshot, terminal record) are cited, not redefined.

| Entity | What it is | Written by | Read by | Defined in |
|---|---|---|---|---|
| Pass loop request | One call of the pass loop for one phase attempt: working directory, path of the phase evidence, standing prompt, harness, role, pass limit, pause, feature slug, phase, phase attempt, base of the invocation ids, time limit of a pass, place for yield artifacts, debug switch, `help` | The engine | The pass loop | F103-FR-001, F103-FR-002; `contracts/pass-loop-request.schema.json` |
| Pass loop result | `exit_code` of the table of annex E §E.4; optional `blocked` (reason, file); the pass number reached | The pass loop | The engine | F103-FR-001, F103-FR-019, F103-FR-021; `contracts/pass-loop-result.schema.json` |
| Pass | One start of a harness with a prompt: pass id, pass number, invocation id, session directive with its reason, start stamp, outcome | The pass loop | The pass loop, the ledger record after the pass | F103-FR-003, F103-FR-009, F103-FR-042 |
| Pass outcome | Ended with phase evidence; ended with an error; killed with a kill reason and class; yielded; clean without evidence; failed with a quota class; stopped by `betweenPasses` | The pass loop, from the harness port and the stream | The accounting | F103-FR-005, F103-FR-010, F103-FR-012, F103-FR-020 |
| Counters | Pass index, yield index, error count, cap count, no-progress count, short-pass count, and the outer-loop counts the engine adds | The engine, through the ledger | The pass loop, on resume | F103-FR-040; annex B §B.13 |
| Ledger record, namespace `core` | The envelope of annex B §B.13 with a kind of the closed set and the counters | The engine | The engine, the doctor, layers (read only) | F103-FR-039; `contracts/core-ledger-kinds.json` |
| Handoff | A file of at most 6 KB regenerated at the start of every pass | The engine | The proposer (through its prompt) | F103-FR-041 |
| Index of verification obligations | For each verification obligation: id, cut title, path of the full text | The engine, as a pure function of the verification plan | The proposer's prompt | F103-FR-037 |
| Prompt block | id, bytes, hash, writer, `protected`, `stable` or `volatile` | A provider | The assembler | F103-FR-030 |
| `prompt.built` | The blocks of a pass, what was dropped or left out and why, the hash of the stable start | The assembler | Sinks, the projection, tests | F103-FR-034 |
| Session directive | `fresh` with a minted id, or `continue` with an id, and its reason | The core | The harness port | F103-FR-042, F103-FR-043; `contracts/fresh-session-reasons.json` |
| Layer registration | The layer's id, its directives, its services, its ledger namespace | The layer, at registration | The engine | F103-FR-024, F103-FR-025 |
| Directive | One of the eleven | A layer | The engine | F103-FR-026 |

## Relations

- One phase attempt has one request, one result, and passes numbered from 1 to the pass limit.
- One pass has one prompt (stored under `pass:<passId>:prompt`), one invocation id, one session directive and at most one result of an invocation (`pass:<passId>:result`).
- After each pass the accounting reads the outcome and the counters and returns the new counters and one decision: continue, or end with a result.
- The ledger holds one record when a phase attempt opens, one when it closes, one after each pass while `carry.ledger_handoff` is on, and one for each reset of the counts.
- A layer has a namespace of its own in the ledger and reads the rest of it read only.

## State of one pass

```text
decided ──► source check ──► prompt built ──► session directive ──► harness started
   │              │                                                         │
   │        stop: blocked                                             pass ended
   │        (no pass starts)                                                 │
   └── stop: pass limit ◄── accounting ◄── layer ◄── yield check ◄── kill check ◄── betweenPasses
```

`decided` is the moment the loop decides to start a pass. F103-SC-004 measures from there to the start of the harness process.

## Counters and where they live

| Counter | Reset by | Continues across a resume |
|---|---|---|
| Error count | A clean pass; a kill of class budget resets nothing of it | Yes, with `carry.ledger_handoff` on after every pass, and at the boundaries of a phase attempt otherwise |
| Cap count | An erroring pass and a clean pass | Yes |
| No-progress count | A pass with progress | Yes |
| Short-pass count | Owned by feature 118; its place in the order is F103-FR-022 | Yes |
| Pass index, yield index | A new phase attempt | Yes |
| All | `--reset-counts`, recorded as `counts-reset` | — |
