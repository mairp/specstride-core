
## reconcile-2026-11-01
- a) test coverage: uncovered:CT-123-145,PT-123-011FR023-lines-and-digest,PT-123-011SC005-poll-cadence,PT-123-C-215-retryable-reasons,PT-123-C-226-colour-and-env,PT-123-C-230-lines-and-digest,PT-123-C-247-poll-cadence,PT-123-C-248-exit-map,PT-123-C-249-stop-line,PT-123-C-251-refusal-line,PT-123-C-254-supervisor-lines
- b) unresolved markers: ok
- c) dangling refs: ok
- d) headers: ok
- e) analyze-report: ok

## reconcile-2026-11-01 coverage adjudication
- [CT-123-145] found-unlabeled: tests/characterization/123/doctor-terminal-tool.test.ts:58 — "CT-123-144: the check registers with the id pipeline.terminal-tool, order 7, never launch-blocking" (the T088 implementation self-labels CT-123-144, the id already used by T087's no-terminal-tool.test.ts, which self-labels CT-123-141 — an id drift, but the doctor-terminal-tool behaviour of CT-123-145 is implemented)
- [PT-123-011FR023-lines-and-digest] found-unlabeled: tests/parity/123/lines.test.ts:67 — "PT-123-011FR023-supervisor-lines (fixture level): the line-bearing scenarios exist in both variants under the parity profile" (title uses the supervisor-lines suffix, not lines-and-digest)
- [PT-123-011SC005-poll-cadence] found-unlabeled: tests/parity/123/cadence.test.ts:99 — "PT-123-011FR024-cadence (differential): the port's constants and the 1.5× growth read as the baseline's" (titles say FR024-cadence; poll-cadence meaning is covered)
- [PT-123-C-215-retryable-reasons] found-unlabeled: tests/parity/123/retryable-reasons.test.ts:45 — "PT-123-011FR018-retryable-reasons (fixture level): both pinned scenarios exist in both variants under the parity profile"
- [PT-123-C-226-colour-and-env] found-unlabeled: tests/parity/123/colour-env.test.ts:58 — "PT-123-C-226-colour-env (fixture level): both scenarios exist in both variants under the parity profile" (short code present, full id absent)
- [PT-123-C-230-lines-and-digest] found-unlabeled: tests/parity/123/lines.test.ts:145 — comment "`observe-completed`: the state line and the terminal digest." (line and digest coverage in the supervisor-lines suite)
- [PT-123-C-247-poll-cadence] found-unlabeled: tests/parity/123/cadence.test.ts:99 — "PT-123-011FR024-cadence (differential): the port's constants and the 1.5× growth read as the baseline's"
- [PT-123-C-248-exit-map] found-unlabeled: tests/parity/123/supervise-verbs.test.ts:439 — "PT-123-C-246-supervise-verbs (exit map): stopped 2, failed 22, lock-conflict 24, unknown-terminal 3"
- [PT-123-C-249-stop-line] found-unlabeled: tests/parity/123/lines.test.ts:214 — stopLine assertion ("The stop line and the digest line carry their own labels.", exercising the [SPECSTRIDE-SUPERVISE] stop line)
- [PT-123-C-251-refusal-line] found-unlabeled: tests/parity/123/supervise-verbs.test.ts:392 — "PT-123-C-246-supervise-verbs (differential, mode on a refusal): the [MOL-MODE] refusal line (C-251), the next action, exit 0"
- [PT-123-C-254-supervisor-lines] found-unlabeled: tests/parity/123/lines.test.ts:266 — "PT-123-011FR023-supervisor-lines (rest of the writers): hold, relaunch, refuse, anomaly, launcher, state, gate check"

## reconcile-2026-11-01
- a) test coverage: ok
- b) unresolved markers: ok
- c) dangling refs: ok
- d) headers: ok
- e) analyze-report: ok
