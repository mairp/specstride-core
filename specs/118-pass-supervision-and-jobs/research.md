# Research: Pass supervision and detached jobs

Summarizes and links to `docs/ecosystem/research/`. Nothing new was measured in this step.

| # | Decision | Reason | Source |
|---|---|---|---|
| 1 | Reproduce the baseline's watchdogs exactly: tick 15 s, order idle, process repetition, tool repetition, progress (every 4th tick), hard cap; kill by termination, 3 s, kill | Parity binds; the oracle compares kill reasons, classes and notes | R18 (B-0704 to B-0712); 028 FR-017 |
| 2 | Repetition limit 12 | The code is what parity means; the README's 5 is wrong | D-02 |
| 3 | An unknown kill reason is classed `futility` | B-0606 is the behaviour; annex X §X.6 row 10 says `futility` as well since the repair of feature 100 | R18; annex X §X.6 |
| 4 | Polite stop: interrupt, grace, terminate, 3 s, kill, each recorded; off under `parity`; proposer passes only | An interrupt ends a Claude turn cleanly and records the session; a termination does not. The grace length is not in the sources | R24 F-7; R27 D1.10; DV-093 |
| 5 | The yield artifact keeps `specstride-pass-yield/v1`; `first_failure` is a seventh kind, added to the same schema major (the schema is a claim, and feature 100 already lists the kind) | Annex D §D.6 | R27 D1.8 |
| 6 | The first-failure predicate reads whole lines appended after the job's start, in the same file identity, and needs two successive polls | Removes stale-line, torn-line and single-glitch stops | R23v V-17, IR-51 |
| 7 | Stop a job only if the runtime launched it and the yield declared `stop`; process group; grace; event | A job in `adopt` mode may be the operator's; a stop in the middle of a lab job can leave the lab in a state that trips the next run | R23v V-17 E, O-11; ruling 52 |
| 8 | Adoption: `adoptable` registry class; survive stop; adopted by the next engine start with the remaining deadline | A relaunch is a new engine start and must not lose a multi-hour job | R15v C-6, P-2; F100-FR-064 |
| 9 | The core cannot import `node:child_process`, and cannot import `node:fs` or `node:fs/promises`; job launch and signals go through the kernel's process primitive, files through the kernel and the ports of the edge packages | Package graph of feature 100; F100-FR-012 | `contracts/data/package-graph.json`; CQ-185 |
| 10 | The failure ledger of the baseline stays as an internal component that never breaks a prompt | 011/028 behaviour; Principle V | R18 (C-044 to C-049) |
| 11 | A yield written beside a checkpoint refuses the checkpoint | A yield says "nothing to do until"; a checkpoint says "unit done" | R27 D1.2 |
| 12 | Counters: a checkpoint pass leaves short-pass, error and cap counters as they were | Without it the cap breaker never fires and attempts run to the pass limit | R23v V-14, IR-48; DV-013 |
| 13 | The pass ceiling is resolved in the order of annex X §X.2: an explicit per-phase setting, the learned value, the value declared by the verification-commands document, the role key | One order in features 100, 110 and 118; it is the order of the baseline | Annex X §X.2; CQ-158 |
| 14 | Text from outside the runtime enters through the one ingress before this feature writes it | One point of redaction, which fails closed | F100-FR-009; F100-FR-205 |
| 15 | The six settings `SPECSTRIDE_YIELD_WAIT_EVERY`, `_LOG_HEAD`, `_LOG_TAIL`, `SPECSTRIDE_FAILURE_LEDGER`, `_LEDGER_MAX`, `SPECSTRIDE_FAILURE_PATTERN` are kept, as keys under `loop.yield.*` | The baseline at `9cab15d` reads all six (`proposer.sh`, `lib/failure_ledger.py`) | Alias table of annex X §X.8 |

## What the numbers say

R21v measured that 29.3 of 42.9 hours of acceptance-job time ran after the first failed step (68 per cent). R27 puts the central estimate of fail-fast at 50 to 80 per cent of that ceiling. Experiment X2 measures it; the pass mark is 50 per cent of the 29.3 hours, and no wait may end on a stale line, a skipped row or an expected failure.

## Unverified

| Fact | Check |
|---|---|
| An interrupt ends a harness turn cleanly and the session is resumable | One paid probe per tested harness adapter, logged (tasks) |
| A job in its own process session survives the kill of a pass and a stop, on Linux and macOS, inside a host session | Spike of feature 122; a macOS runner |
| The process walk and the CPU-time reading of a process tree on macOS | A macOS runner that passes the oracle |
| Whether today's tree kill reaches a job in its own session (R15v open question 2) | Characterization on the baseline; the specification fixes the intended behaviour |
