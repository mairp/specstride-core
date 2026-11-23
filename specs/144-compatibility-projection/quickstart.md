# Quickstart: checking feature 144

1. Read `spec.md`: requirements F144-FR-001 to F144-FR-012.
2. Check the data: every type of the event catalogue has a row of `contracts/projection-table.tsv`, and 65 old names are targets.
3. When built: run a fixture with the profile `parity`; compare `run:<runId>:events-legacy:<k>` with the reference through N-12 to N-14.
