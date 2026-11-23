# As-is literals of the phase gate

What compatibility output and the compatibility projection reproduce. The authority for every
literal is the baseline at `9cab15d`; the evidence line of each item is in
`docs/ecosystem/research/R18-behaviour-inventory.tsv`. The tasks take the exact bytes from the
golden captures of feature 141, not from this file.

## Events

The table "As-is events of the phase gate" of the spec, with these notes:

| Note | Content |
|---|---|
| Typing | Events that the engine script wrote carry every value as text; events that the critic module wrote carry typed values (D-25). The projection keeps both |
| `reject` | Written for REJECTED, MALFORMED and a failed verification gate alike (B-0105) |
| `verdict` | Not written after a failed verification gate (B-0328) |
| `git_checkpoint` | Written only when the commit worked (B-0088) |
| `run_end` | Without `phases` where every phase was approved before (B-0141) |
| `criteria` of `accelerator_start` | The signature without its last comma (B-0094) |

## Lines

The table "As-is lines of the phase gate" of the spec.

## Texts of files

| Record | As-is text | Item |
|---|---|---|
| Feedback, heading | `# Phase <N> — critic feedback (<REJECTED or MALFORMED>)` | B-0879 |
| Feedback, MALFORMED | A quote block: the reply was malformed (`<detail>`) and is treated as REJECTED, the safe failure | B-0880 |
| Feedback, lead | `The following must be addressed before re-writing GATE<N>-EVIDENCE.md:` | B-0881 |
| Feedback, empty reply | `(no critic output)` | B-0881 |
| Verdict record, header | `# Specstride critic transcript`, then `phase:`, `attempt:`, `provider:`, `nonce:`, `verdict:`, `parse:`, then the sections of the prompt and of the reply; `(empty)` for an empty reply | B-0876 |
| Hint, heading | `# Phase <N> — diagnostician hint (attempt <M>)` | B-0869 |
| Hint, empty reply | `(empty diagnostician reply)` | B-0869 |
| Acceleration note, heading | `# Phase <N> — accelerator pass (attempt <M>)` | B-0174 |
| Acceleration note, own notes | `## The accelerator's own notes` | B-0175 |
| Commit message | `specstride: phase <N> approved — <title>`, or `phase <N>` in place of the title | B-0278 |
| Label of leftover phase evidence | `resume-<as-is run id>` | B-0307 |
| Suffix on a collision | `-<as-is run id>` | B-0292 |

## Mapping of as-is names

| As-is | New |
|---|---|
| The flags of the critic module (`--workdir`, `--attempt`, `--max-rejects`, `--diagnose`) | Inputs of `judge` and of the call of the diagnostician (C-060) |
| The variables of a critic call (role, iteration, invocation id and directory) | Fields of the invocation record of the critic call; given to the harness port for the environment of the call (B-0071, B-0081, B-0082) |
| The exit codes of the critic module | `exit_code` of the result record (C-063) |
| The markers of a diagnosis and of an acceleration | `phase:<N>:recovery-markers` (B-0173, B-0179) |
| The directory of an approved phase | `phase:<N>:approved-archive` (B-0184) |
