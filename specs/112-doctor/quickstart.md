# Quickstart: checking feature 112

1. Read `spec.md`: requirements F112-FR-001 to F112-FR-033.
2. Check the data: `contracts/check-catalogue.tsv` has 45 rows; ten carry `lb` (the tenth, `budget.caps`, only for an automatically picked metered critic); every id appears in the table of `spec.md`.
3. Run `python3 docs/ecosystem/check-traceability.py --require-all` and look at the lines that start with `[h` and name feature 112 or its ids.
4. When the feature is built: run the doctor on a healthy fixture and on the worst-case fixture and compare with the golden output; run the file-access trace over all fixtures; register the sample check of `packages/testkit/src/samples/EP-14/` and run `--json`; check that `packages/doctor/` holds no file of a check that another feature registers.
