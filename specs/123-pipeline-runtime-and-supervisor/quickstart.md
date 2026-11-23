# Quickstart: validating feature 123

For a reader who wants to check that the specification is complete before implementation.

1. Read `spec.md`: the reference sections §R.1 to §R.9, then the 44 requirements.
2. Run `python3 contracts/tools/generate.py --check`. It fails when a data file differs from the spec.
3. Run `python3 docs/ecosystem/check-traceability.py` from the repository root and look at the
   lines that start with `[h` and name `123-pipeline-runtime-and-supervisor` or `F123`. There should be none.
4. Pick a refusal, for example `launcher-edited`, and follow it: §R.5 (the launch check), F123-FR-021,
   `contracts/launch-checks.json`, `contracts/closed-sets.json`, the task in `tasks.md` that proves it.
5. Pick a relaunch case, for example a crashed engine: §R.6 table 2, row R-23, F123-FR-029, the golden
   decision in `tasks.md`. Then a blocked run: rows O-33 and R-03, F123-FR-042, tasks T082 and T083.

Implementation checks, once code exists (not run in Stage B):

| Check | Expected |
|---|---|
| FX-35 and FX-36 under the `parity` profile, both variants | 0 results `different`; waivers DV-075 and DV-009 only |
| A dry run of any fixture launch contract | Exit 0, no file created, one `[DIGEST] state=dry-run` line |
| A 24-hour run on a fake clock in default output | At most 8,400 bytes; a cycle at most 420 bytes |
| An engine stub that ends with `wall_budget` twice and then succeeds, `relaunch.owner: root`, no host process | Exit 0 after two relaunches |
| The sample stage kind from the test tree | Validated, planned, run; no core file differs |
| A run blocked for `auth`, `quota-credit` or `budget-cap`, on a stage that lists exit 4 and allows the reason, with `relaunch.owner: root` and then `supervise` | 0 relaunches; the refusal `blocked-on-human` (rows R-03 and O-33) |
| A stage of kind `specstride` on a machine without `script` | The run goes on through the pipe; one `[WARN]` line; the doctor warns |
