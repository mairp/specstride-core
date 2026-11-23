# Contract: the mode selector

Command: the verb `learning` of `supervise`, with `--request <text>` (default: empty) and `--token <token>` (repeatable). Input: the request text and zero or more tokens. Output: `mode`, `source`, `evidence`. Order of decision, first match wins:

| Step | Rule | Mode | Source |
|---|---|---|---|
| 1 | A token `--learning-off`, `--learning-suggest` or `--learning-apply`, given, or found as a flag in the request (a word that starts with two hyphens, at the start of the text or after white space). The given tokens are tried first; the first word that is one of the three wins | The token's | `token` |
| 2 | A refusal phrase | `off` | `refusal` |
| 3 | An apply phrase | `apply` | `prose` |
| 4 | A suggest phrase | `suggest` | `prose` |
| 5 | None | `off` | `default` |

Phrases are data (`packages/learning/data/mode-phrases.json`), matched in lower case:

| Group | Members (the meaning; the exact patterns are copied from the baseline in task T065) |
|---|---|
| Refusal | no, without, disable, turn off or skip the learning, self-improvement or self-tuning; learning off |
| Apply | learning apply; apply the learned values; use the learned or applied values, settings, decisions, timeouts or knobs; with the applied or learned decisions, values or settings |
| Suggest | learning suggest; enable, turn on or with the learning; self-improving; self-tuning; learn from the runs; record the observations |

Line: `[MOL-LEARNING] mode=<mode> source=<source> evidence=<json text>`. For `apply` a `[MOL-NEXT]` line follows. Exit 0.

The consumer's comment can only select among what these rules and validation accept (F106-FR-033). Where `apply` is selected and the derivation can bind no decision, the launch contract carries `suggest` and the derivation says why.
