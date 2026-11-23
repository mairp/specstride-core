# Snapshot classes and ranks on resume

| Class | Keys | Rank on resume |
|---|---|---|
| `pinned` | Harness and model of each role, choice of the critic, spec format, feature, verification mode, plan and commands, containment level, audience. A key without a class | Below flags, above the environment |
| `tunable` | Timeouts, caps, budgets, poll intervals, telemetry endpoints | Below the environment, above project configuration |

A flag on `resume` beats both (F102-FR-027, F102-FR-029). The pin of the launch contract (rank 1 of annex X §X.2, children of the runtime root only) stays above every flag and both classes. A launch that continues a run gives the snapshot the same rank (annex X §X.2, CQ-075). `acceptedChanges` is written by the CLI at `resume --accept-source-change`, before the engine starts (F102-FR-019). A key whose value differs from the snapshot is recorded with old value, new value and rank. The class of each key is a column of the key table of the config envelope (annex X §X.2 of feature 100; row 76 of annex X §X.6). The snapshot keeps the value of the launch. Secrets are references.
