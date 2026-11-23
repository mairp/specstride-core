# EP-18: critic strategy and attempt planner

Internal seams (feature 100 annex E §E.1). Versioned and tested as every extension point; no
promise outside the repository of the product in Wave 1.

## `specstride.critic-strategy/1`

| Subject | Content |
|---|---|
| Operation | `judge` |
| Caller and time | The engine, once per phase gate, after the verification gate |
| Input | Phase, phase attempt (id, ordinal), reference to the phase evidence, grounding snapshot, result record of the verification gate, fact block or none, the entry of the role plan for the critic, the time limit, a function that makes one critic call |
| Output | One verdict record with a verdict of the closed set of feature 100 annex X §X.6 row 8 |
| The call function | Given by the engine. It mints the nonce and the session id, hands the demand for the verdict to the assembler of the critic prompt, calls `complete` of the harness port, checks the proof of the form, parses the reply and returns the outcome of the call. A strategy cannot make a call in any other way and never sees a nonce |
| Errors | A configuration error of the critic, passed through to the engine (exit 3, `critic_config`) |
| Guarantees of a strategy | Exactly one verdict record; never APPROVED when any call was MALFORMED; no state outside its input |
| Failure | MALFORMED, counted by the MALFORMED limit |
| Unknown value | An unknown verdict is MALFORMED |
| Wave 1 | `single`: one call |

## `specstride.attempt-planner/1`

| Subject | Content |
|---|---|
| Operation | `next` |
| Caller and time | The engine, after every rejection, before the next phase attempt |
| Input | The history of the phase attempts of the phase: per phase attempt its kind, outcome, verdict, signature; the counts of the ledger; the recovery markers; whether hint and feedback exist; whether a diagnosis was made and whether an accelerated phase attempt is due, as facts; configuration; the model-tier ladder and the models and efforts of the critic-class calls; the state of the quota of the target, as the run recorded it |
| Output | The kind of the next phase attempt, the model tier, and the decision record of a table where one was evaluated |
| Guarantees of a planner | A pure function: no I/O, no clock, no model; it changes no count |
| Failure | `plain` on the base model tier |
| Unknown value | An unknown kind is `plain` |
| Wave 1 | `recovery` (always on); `tier-bump` (option, off by default). Called in this order; the second may change the model tier and may turn `plain` into `bumped` |

## Conformance suite

| Case | Asserts |
|---|---|
| Strategy returns one record | Exactly one verdict record per `judge` |
| Strategy with two calls | Two nonces, two fresh sessions, neither equal to a session of a pass |
| One call MALFORMED, one APPROVED | The verdict is not APPROVED |
| Strategy throws | MALFORMED; the MALFORMED streak rises by one |
| Strategy returns an unknown verdict | MALFORMED |
| Planner is pure | The same history gives the same result; no write is observed |
| Planner throws or returns an unknown kind | `plain` |
| Both planners of Wave 1 | Pass every planner case |
| Samples outside the core | No core file names a sample; the build with and without the samples differs in no core file |
