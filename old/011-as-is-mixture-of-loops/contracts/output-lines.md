# Contract: labeled output lines (events, as-is)

The product has no event bus, webhook or message queue. Its event surface is line-oriented text on stdout/stderr, which the harness relays and the supervisor parses back. Two families exist.

## Runtime lines — `[LABEL] message`

Printed by the bundled `runtime.py` (the generated launcher) and appended, uncolored, to `runs/<id>/launcher.log`. With color on, only the `[LABEL]` is wrapped in ANSI codes; `--no-color`, `--color never` or `NO_COLOR` turn it off.
<!-- evidence: skills/mixture-of-loops/scripts/runtime.py:61-81 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

| Label | When |
|---|---|
| `WARN` | a validation warning (stderr) |
| `STALE` / `INVALID` | contract refused before running (stderr; exits 23 / 20) |
| `DRY-RUN`, `PREFLIGHT`, `SKIP`, `CHECK`, `PLAN` | `--dry-run` report |
| `BLOCKED` | preflight failure, setup required, stage precondition failure, or lock held |
| `READY` | a setup stage already satisfies its postconditions |
| `RUN` | a stage attempt starts (`<id> attempt n/m: <redacted argv>`) |
| `PASS` | a stage completed |
| `ERROR` | a postcondition failed after exit 0 |
| `RECOVER` | a retry is scheduled (`exit N[, reason=R]; retry in Ds`) |
| `FAIL` | a stage failed (`exit N (outcome)`) |
| `SKIP` | a smoke stage disabled |
| `RESUME` | a completed stage is skipped, or rerun because its postconditions changed |
| `DIGEST` | the final line of every run |
<!-- evidence: skills/mixture-of-loops/scripts/runtime.py:427-515 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

The digest grammar, as the supervisor parses it:

```text
[DIGEST] state=<state> exit=<int> last-stage=<id|none>[ child-exit=<code>] evidence=<run dir|none>
```
<!-- evidence: skills/mixture-of-loops/scripts/supervisor_lib.py:96-100 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

`state` is `completed`, `failed`, `stopped` or `dry-run`; `child-exit` appears only on a stage failure or stop.

## Supervisor lines — `[MOL-<KIND>] key=value …`

Printed by `supervise.py`. When a run directory is known they are also appended to `runs/<id>/harness-report.log` (`skills/mixture-of-loops/scripts/supervisor_lib.py:1060-1080`). String values are JSON-quoted.

| Line | Keys |
|---|---|
| `[MOL-MODE]` | `mode`, `source`, `evidence`, `flags` |
| `[MOL-LEARNING]` | `mode`, `source`, `evidence` |
| `[MOL-LAUNCHER]` | `launcher`, `source` |
| `[MOL-GATE] check=…` | `check`, `status` (`pass`/`fail`/`not-evaluated`), optional `reason`, `detail` |
| `[MOL-GATE] decision=…` | `decision` (`launch`/`refuse`/`attach`), optional `reason`, `detail`, `next` |
| `[MOL-LAUNCH]` | `pipeline`, `mode`, `launcher`, `run-dir`, `stages`, `flags`, `relaunch-budget`, `wall-clock-ceiling`, `pid`, `stop` |
| `[MOL-STATE]` | `pipeline`, `stage` (i/n), `id`, `state`, `stage-elapsed`, `total-elapsed`, optional `detail` |
| `[MOL-HOLD]` | `pipeline`, `unchanged`, `stage`, `id`, `state`, `total-elapsed` |
| `[MOL-RELAUNCH]` | `pipeline`, `attempt`, `reason`, `exit`, `child-exit`, `stage`, `stop-reason`, `budget-remaining`, `detail` |
| `[MOL-DIGEST]` | `pipeline`, `state`, `exit`, `child-exit`, `last-stage`, `evidence`, `state-path`, `next` |
| `[MOL-REFUSE]` | `action`, `reason`, `detail`, optional `next` |
| `[MOL-ANOMALY]` | `pipeline`, `detail` or `launch-log` |
| `[MOL-NEXT]` | `next` hint or `poll-in=<seconds>` |
| `[MOL-STOP]` | `pipeline`, `sent`, … |
| `[MOL-RETRO]` | `pipeline`, `stage`, `status`, `reason` |
<!-- evidence: skills/mixture-of-loops/scripts/supervisor_lib.py:1087-1172 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

`[MOL-MODE]`, `[MOL-LEARNING]`, `[MOL-LAUNCHER]` and `[MOL-GATE]` are formatted by the dataclasses at `skills/mixture-of-loops/scripts/supervisor_lib.py:156-422`; `[MOL-NEXT]`, `[MOL-STOP]` and `[MOL-RETRO]` by `skills/mixture-of-loops/scripts/supervise.py:65-190`.
<!-- evidence: skills/mixture-of-loops/scripts/supervise.py:65-190 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->
