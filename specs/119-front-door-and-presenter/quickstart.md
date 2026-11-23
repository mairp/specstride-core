# Quickstart: validating Front door

Prerequisites: the oracle of feature 141 with fixture family FX-28, stub agents, Node 22.

1. Build the CLI bundle. Run the parity tests of `tests/parity/119/` with `output.compat` on: every scenario of FX-28 reports `equal`.
2. Run the golden output gate in default output on the success and failure fixture of each inspection command: at most 1,120 and 2,240 bytes; no absolute path; no planted canary.
3. Snapshot the workspace and the control plane, run every inspection verb, compare: identical (F119-SC-002).
4. Run the startup check: 30 cold starts of `status`, `phases`, `events`; p90 at or below 150 ms.
5. Run the characterization tests `CT-119-1` to `CT-119-5` (Lisa routing, exit 70).
6. `specstride nonsense` exits 1; `specstride run --bogus` exits 3; a forced internal error exits 70.
7. Pack the package and run CT-119-19: install it in an empty directory with install scripts ignored; `specstride --protocol` exits 0. On a platform without a runner, record the skip with its reason (F119-FR-056).
