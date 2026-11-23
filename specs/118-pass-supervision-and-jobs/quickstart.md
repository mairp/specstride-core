# Quickstart: run each behaviour on the stubs

Every command below is a test task of `tasks.md` and runs with the stubs of feature 141. No paid call.

| Behaviour | How to see it |
|---|---|
| Idle kill | Fixture FX-21, scenario `idle-timeout`, profile `parity` |
| Repeat stall | FX-21, `repeat-stall`; then the same with `SPECSTRIDE_PROPOSER_REPEAT_IGNORE` set empty |
| Progress stall | FX-21, `progress-stall` |
| Hard cap, three in a row | FX-20, `cap-exhausted-legacy` and `cap-exhausted-structured`; result 10, stop reason `proposer_cap_exhausted` |
| Kill note carried | FX-20, `kill-note-carried` |
| Each predicate | FX-22, `predicate-<kind>` for the seven kinds |
| Yield limit, deadline, refusal | FX-22, `yield-limit`, `yield-deadline`, `yield-refused`, `yield-timeout` |
| Wall budget in a wait | FX-23, `wall-budget` |
| Long job | FX-16, `long-job-running`, `long-job-finished` |
| Polite stop | Own test CT-118-1 with three stub proposers (ends on interrupt, on termination, on kill only), `carry.polite_stop` on |
| Adoption | Own test CT-118-3: start a stub job, stop, start the engine again |
| Long job, the named test | Parity test PT-118-FX16-long-job on FX-16 |
| No secret in a sink | Own test CT-118-10: a planted canary in a command line, a yield and a job log; then the redactor made unavailable |
| First failure | Own tests CT-118-4 and CT-118-5 on the synthetic fixture; experiment X2 on the replay fixture, switch on and off |
