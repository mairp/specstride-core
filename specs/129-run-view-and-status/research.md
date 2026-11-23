# Research: Run view and status

Summarizes and links to `docs/ecosystem/research/`. Nothing new was measured in this step.

| # | Decision | Reason | Source |
|---|---|---|---|
| 1 | One pure read model, `project(events, state files, observations, now)` and `reduce(view, event)`; everything else is injected | Batch equals fold is only provable for a function with no input or output; it is what makes the doctor, `status` and the renderers agree by construction | R13 "The UI data contract"; R15 EP-09; F100 annex G §G.6 |
| 2 | Inputs: three named state files (run record, terminal record, pause record), and observations for the lease probe, the newest launch record, the supervision record, the process search, the handshake limit | Annex G names three state files and a lease probe; rules of annex B and E need four more values (`launch-abandoned`, a refused resume, the `next=` seconds, orphan processes). Annex G stands; the rest are values the caller reads | F100 annex G §G.6, annex B §B.7, §B.16; R29v PU-90 (CQ-161) |
| 3 | The cursor is held by the caller; the token printed by `wait` carries a short hash of the change signature | Two hosts on one run must not consume each other's changes; a change of a state file or of time moves neither offset nor `seq` | R15v D-4 (CQ-164) |
| 4 | A change is a change of a small signature, not of any event | 98 per cent of the 801 polls of the reference run found nothing new; a wake for every pass would bring the cost back | R17 F14 |
| 5 | The status line has at most 170 bytes; keys are dropped in a fixed order; `run`, `st` and `validUntil` are never dropped | 60 tokens against 119 bytes today; the shim must be able to compare the expiry | R17 F13; ruling 65; R15v D-6 |
| 6 | The precomputed line carries `validUntil` of the lease; a resting run carries `none` | A dead root cannot rewrite its own line; the expiry makes a stale `running` recognisable. A resting run has no lease and cannot go stale | R15v D-6; F100-FR-161 (CQ-163) |
| 7 | `dead` and `stale` are derived by readers from the lease probe and the age of the heartbeat and of the newest event; readers write nothing | LR-4; a `dead` written by a process would need a live writer | `architecture.md` LR-4; F100 annex B §B.8 |
| 8 | `stale` is one field with two reasons | Annex E §E.2 and annex G §G.6 both use the word | F100 annex E, annex G (CQ-162) |
| 9 | Lanes come from a pure table with eight rows; `dead`, `stopped` and `blocked-on-human` go to `blocked` | R13 gives the lane order and the rule that renderers never derive; the rows for `stopped` and `dead` are the proposal here | R13 "Lane derivation"; LR-7 (CQ-170) |
| 10 | The read model raises no alert; the level of a budget row is the engine's alert level, and `over` from the fraction | The engine is the only source of alerts | `architecture.md` section 12; R14 |
| 11 | Free text is redacted again with the recorded pattern version, stripped of control characters and cut | R11 T-33, T-40: a viewer must be able to render every text as text; the view is what an export would carry (T-41) | R11 T-33, T-40, T-41; F100-FR-205 |
| 12 | Processes that hold the run token of a run without an engine are reported and never ended | `stop --now`, `resume` and the next engine start end them; a reader that ended one would write | R29v PU-90; F100-FR-064 |
| 13 | With parallel units off the view holds no field of the layer | Inertness of the option | R29 PU-04, PU-72; R29v PU-98 |
| 14 | Under `parity` the new lines are not printed and the runtime writes neither the cached view nor the line | New lines and new files have no reference | F100-FR-176; ruling 68 |
| 15 | The view lives in `@specstride/view`, which may import only `@specstride/contracts`; the evaluator, redaction function and hasher are injected | Package graph of feature 100 | `contracts/data/package-graph.json` |
| 16 | `status --all` is one view per feature, its text belongs to feature 119 | One read model, no second one | Brief 129 heading 1 |

## Unverified

| Fact | Check |
|---|---|
| A host hook shim can print the precomputed line at the start of a session without starting the product, and a line past `validUntil` is printed as unknown | A capture on a live host (task) |
| The lock probe and the search of the process table for the run token behave the same on macOS | A macOS runner that passes the oracle |
| Golden views are byte-identical on macOS | The same runner |
| `status` on 100,000 events finishes within 2 seconds | A measurement on the reference machine of CI (task; the figure is a target) |
