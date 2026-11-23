# Contract: the learning binding

Block `configuration.learning` of `specstride.launch-contract/1` (annex G §G.8). Feature 107 writes and validates the launch contract; this file states what the block holds and the rules validation applies for learning.

| Key | Rule |
|---|---|
| `mode` | `off`, `suggest` or `apply` |
| `decisions_through` | The run id of the last log line that has a text `run_id`, whatever its action; a non-empty text |
| `decisions_sha256` | Prefix hash of `decision-log.md`: 64 hexadecimal digits in lower case |
| `effective` | A map from the knob to a map from the phase number, as text, to the value, for the applies still active at the end of the bound prefix; not clamped |
| `source_path` | The logical name of the log, `feature:<slug>:learning:decisions` with the slug filled in; never an absolute path; compared through the layout table under `parity` |

Rules of validation: the block holds exactly these five keys, each in the form of the table; the recomputed prefix hash equals `decisions_sha256`, else exit 23 (`LearningDecisionsChanged`), and the same refusal when the log cannot be read or holds no line with the bound id; every stage of kind `specstride` declares in `action` and in the action on resume the same mode and the same bound; without the block no stage declares a bound or the mode `apply`; a declared bound is a literal non-empty run id; a declared mode is a literal member of the closed set, never taken from the environment. A violation of a rule of structure is an error of the class `learning` and ends validation with exit 20; the two refusals with exit 23 are checked only when no structural error exists and where validation compares sources with their hashes.

Rule of the runtime: the mode and the bound are stripped from every child environment and from every command-success check; a `specstride` stage without a declaration gets `off` (F106-FR-030, F100-FR-167). The baseline strips the mode and the legacy variable only; under the `parity` profile the two as-is pins are the learning mode and live output, and an inherited bound is left as it is.

Derivation options: `--learning-mode off|suggest|apply` (default `off`), `--applied-file` (default: the log of the feature when exactly one is in scope). Asked for `apply` with nothing to bind, the derivation writes `suggest` and says why (F106-FR-033).
