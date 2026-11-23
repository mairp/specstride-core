# Quickstart: checking feature 111

1. Read `spec.md`: requirements F111-FR-001 to F111-FR-038, F111-FR-050 and F111-FR-051.
2. Check the data: every partner of a pair in `contracts/event-catalogue.tsv` is a type, every type is written in `spec.md`, every field of the column `free_text_fields` is a field of its type, and no type has a `data` field named `cause`.
3. Run `python3 docs/ecosystem/check-traceability.py --require-all` and look at the lines that start with `[h` and name feature 111.
4. When the feature is built: run the three sink fixtures; run the canary test with capture on and off.
