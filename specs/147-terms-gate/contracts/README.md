# Contracts of feature 147

`terms-rows.tsv` holds the first rows of the shipped terms data (moved from feature 110). Task T005 completes it from R8v's corrected matrix (42 cells). Statuses: `allowed`, `conditional`, `personal-only`, `refused`. The audience `both` in a row stands for two rows with the same content.

pi: the shipped data holds no row for pi itself. The row of the provider in use applies; the facts of R8v rows 37 to 40 (pi with an API-key provider `ALLOWED-DOCUMENTED`, the OAuth subscription login Tier 3 `NOT-ALLOWED`, access date 2026-09-29) are handed over by feature 134 as `terms-facts.json`, and task T005 carries them into the generated data.
