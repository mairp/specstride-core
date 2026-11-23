# Contract: the decision log

Logical name `feature:<slug>:learning:decisions`. Writer: learning, under its own lock. Readers: learning; validation of the launch contract (the prefix hash, through the binding function of this feature).

## Byte format

| Rule | Content |
|---|---|
| Unit | One entry per line; an entry is one JSON object |
| Members | In the order of `../data-model.md` (an `evaluate` entry: the members of the result first, then `action_taken`, `schema`, `action`, `run_id`, `evaluated_at`); a comma and one space between members; a colon and one space after a name |
| Text | Every character outside ASCII is written as a six-character escape with four lower-case hexadecimal digits; a character outside the basic plane as its two surrogate escapes |
| Numbers | As the baseline writes them: a whole-valued number that the baseline writes with a fraction keeps it |
| End | One line feed; no byte-order mark; no trailing space |
| Append | Opened for append; the directory is created on demand; a line is never rewritten |
| Read | Blank lines, lines that are not JSON and values that are not objects are skipped; entries of `specstride.learn.applied/1` are read and never match a shape |

## Replay

The replayed value for a knob, a phase and a shape is the value of the last entry that is a decision (`apply`, `revert`, or an entry with no `action`) for that key. `advise` and `apply` read it as the current value. At run time a learned value is in force only while that last entry is not a `revert`; after a revert a run uses the default handed in, whatever value the revert recorded (F106-FR-010, F106-FR-011). An `evaluate` entry, and any other action, moves nothing. A decision under another shape, or under none, does not match. With a bound `through` run id, applies after that entry are ignored and reverts after it count; an id that is in no entry keeps reverts only.

## Prefix hash

The bytes of the log up to and including the first line whose `run_id` equals the bound id, its line end included, hashed with the content hash of the canonical hasher (annex X §X.5): SHA-256 over the bytes as they are, written as 64 hexadecimal digits in lower case. It is not the canonical record hash, which sorts keys and adds a line end. Appends never change it; a log that holds no line with the bound id has no prefix, and validation refuses it with exit 23.

## Proving tests

`PT-106-C-093-log-bytes`, `PT-106-C-093-lenient-read`, `PT-106-C-218-prefix-hash`, `CT-106-2`.
