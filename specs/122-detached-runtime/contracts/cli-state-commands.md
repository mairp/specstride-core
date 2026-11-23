# The state commands and the refusals of `launch` (feature 122)

Commands of CLI protocol 1 (feature 100, annex G §G.1). Exit codes are those of annex G §G.4.
Lines follow the grammar of annex G §G.3, family "Product lines"; they are printed in default
output only and never under the `parity` profile.

| Command | Arguments | Line on success | Exit |
|---|---|---|---|
| `state export` | `--feature <slug>`, `--out <file>`; `--json` | `[SPECSTRIDE-STATE] action=export feature=<slug> approvals=<n> out=<file>` | 0; 1 no state; 3 usage, or `--out` inside the working tree; 5 a run of the feature is alive |
| `state import` | `--feature <slug>`, `--from <file>`; `--json` | `[SPECSTRIDE-STATE] action=import feature=<slug> approvals=<n>` | 0; 1 verification failed, or the target holds approval records; 3 usage, or `--from` inside the working tree; 5 alive |
| `state adopt` | `--feature <slug>`, `--from <old path>`; `--json` | `[SPECSTRIDE-STATE] action=adopt feature=<slug> approvals=<n> from=<old path>` | 0; 1 no control plane for the old path, a record fails verification, or a working tree exists at the old path; 3 usage; 5 alive |

A refusal prints `[SPECSTRIDE-REFUSE] action=<action> reason=<reason> next=<command>` and nothing else,
where `<action>` is `state-export`, `state-import` or `state-adopt`. A refusal is never printed under
`[SPECSTRIDE-STATE]` (feature 100, annex G §G.3; F122-FR-036). `[SPECSTRIDE-STATE]` is the label of
these three commands; no other feature prints it.

The line of `launch` (F122-FR-005):

| Outcome | Line | Exit |
|---|---|---|
| `started` | `[SPECSTRIDE-LAUNCH] run=<runId> state=<state of the run>` | 0 |
| `attached` | `[SPECSTRIDE-LAUNCH] run=<runId of the run that lives> state=<state of the run>` | 4 |
| `refused` | `[SPECSTRIDE-REFUSE] action=launch reason=<refusal> next=<command>` | 4, or 24 as the table below says |

Refusals of `launch` that this feature writes into the launch record (`refusal`), with the exit
code of `launch`:

| Refusal | When | Exit |
|---|---|---|
| `lock-conflict` | The runtime root lost the lock after the launch checks | 24 |
| `foreign-owner` | The probe says `held-foreign`, or the marker names an owner that cannot be probed | 4 |
| `owner-dead-group-alive` | The probe says so; the survivors are named | 4 |
| `lock-unknown` | The probe says `unknown` | 24 |
| `provider-mismatch` | The configured lock provider differs from the recorded one | 4 |
| `detach-unavailable`, `detach-not-ready` | The detach strategy failed, or no lease appeared inside the handshake limit | 4 |
| `control-root-not-writable` | The CLI or the runtime root cannot write the control root | 4 |
| `unadopted-approvals` | Ticked phases without approval records | 4 |
| `control-root-unsafe` | The control root can be written by another user (F122-FR-022). A state command refuses with the same reason and exit 3 | 4 |
| `launch-abandoned` | Written by the next launch into an abandoned record | — (the abandoned launch has no process) |

A live run found by a probe (`held-live`) gives the outcome `attached`, exit 4, and is no refusal.
