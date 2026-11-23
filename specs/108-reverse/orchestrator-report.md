# Orchestrator report: feature 108 (Reverse specification)

**Date**: 2026-10-02 · **Task**: T029 (and the request of T028) · **Kind**: a report, not an edit.

What feature 108 sends the orchestrator. Nothing here is an edit of another
feature's files: this feature owns `specs/108-reverse/`, `packages/reverse/`,
`tests/parity/108/` and `tests/characterization/108/`, and it writes nowhere
else. Every row below was CHECKED against the data feature 100 ships —
`packages/contracts/data/parity-profile.json` (annex X §X.7) and
`packages/contracts/data/closed-sets.json` (annex X §X.6) — and the check is
re-run by `tests/characterization/108/records.test.ts`, so this report cannot
drift from the data it reports on.

## Part A — the rows of `spec.md` this feature owns

### A.1 Rows of the `parity` profile (annex X §X.7, F100-FR-212)

The section "Rows of the `parity` profile" of `specs/108-reverse/spec.md` holds
four rows. Three are switches of this feature and carry a row number; the
fourth is a key of another feature that a reverse run sets.

| Row of §X.7 | Switch | Key or flag | Default | Under `parity` | Register row | State in feature 100's data |
|---|---|---|---|---|---|---|
| 66 | Detached reverse run (F108-FR-009) | — (the flag `--detach` of `reverse`) | off; the host skill passes it | off | none needed | **present and in agreement** |
| 67 | Comment of a reverse run (F108-FR-010) | — (the flag `--comment` of `reverse`) | absent | not used | none needed | **present and in agreement** |
| 68 | Tasks mode of a reverse run (F108-FR-011) | `reverse.tasks` | `done` | `done` | DV-027 | **present and in agreement** |
| none | Commit switch of a reverse run (F108-FR-008) | `loop.gitCommits`, set off by the run | `auto` (the key's default) | off in a reverse run, as at the baseline | DV-027 | **no row of §X.7, as this feature's spec says there should be none**; the alias `SPECSTRIDE_GIT_COMMITS` is in §X.8 |

Nothing is asked for in A.1: the three rows this feature owns are already in
feature 100's data, cell for cell, and the fourth correctly has no row.

### A.2 Closed sets (annex X §X.6, F100-FR-208)

| Row of §X.6 | Closed set | Members | Owner | Closed by | Unknown value | State in feature 100's data |
|---|---|---|---|---|---|---|
| 150 | Tasks modes of a reverse run | `done`, `open` | 108 | Design | Exit 3 | **present and in agreement** |
| 156 | Kinds of problem of the reverse guard | `deleted`, `added`, `changed`, `fingerprint differs`, `git HEAD moved`, `git status` | 108 | Design | Not applicable: the guard writes them | **present and in agreement** |

The closed sets of the inventory and of the lint (finding codes, severities,
levels, evidence kinds and validations, walk modes, skip reasons, roles,
entry-point kinds, languages, and the schema id `specstride.reverse-inventory/1`)
are **not** this feature's: group G-B moved them to
`140-reverse-inventory-and-lint`, and they are that feature's to report.

Nothing is asked for in A.2.

## Part B — the requests

| # | Ask | Owner | Citation | Raised in |
|---|---|---|---|---|
| R-108-01 | **Add one scenario to family FX-30 that reaches exit 2.** F108-SC-004 names three classes — a success at exit 0, a usage error at **exit 2**, and findings or invalid input at exit 3 — and asks for 100 per cent of the fixtures of FX-30. The first set of FX-30 (`plan`, `lint-<code>` ×38, `guard-refuses`, `refused-flag`) has no scenario of the usage class, so one third of the criterion has no fixture to be measured on. The port has the behaviour in three forms: a missing source without `--lint` (F108-FR-004), a missing `--baseline` of the guard (F108-FR-027) and a second positional argument (F108-FR-004); each exits 2 today, measured in `tests/characterization/108/fx30-exits.test.ts`. A scenario named `usage-error` with the surfaces FX-30 already declares (`exit`, `stdout`, `stderr`, `tree`, `state`) would close it. Rule 4 of §O.1 (F141-FR-030) lets this feature add a scenario inside the scope of the family; the fixture and the golden capture are feature 141's to build, which is why this is an ask and not an edit. | 141 | `specs/141-parity-oracle/contracts/fixture-catalogue.json` (family FX-30); `specs/108-reverse/spec.md` (F108-SC-004); `tests/characterization/108/fx30-exits.test.ts` | phase 7, T028 |
| R-108-02 | **Record that a reverse run sets `loop.gitCommits` off at the rank of a flag.** The key catalogue of feature 110 gives `loop.gitCommits` the default `auto` and the value `as default` under `parity` (`config-keys.tsv` line 89, owner 101, no profile row). A reverse run sets it **off**, at the rank of a flag and under every profile, which is the baseline's behaviour (F108-FR-008; the dry run prints the prefix `SPECSTRIDE_GIT_COMMITS=off`). The key's own row is right for a normal run, so this is not a correction of it but a missing note: the catalogue should say that the reverse capability overrides the key, so that a reader of the catalogue is not surprised by a reverse run whose commits are off under `parity`. | 110 (the catalogue), 101 (the key) | `specs/110-config-and-terms/contracts/config-keys.tsv` line 89; `specs/108-reverse/spec.md` ("Rows of the `parity` profile", the row of `loop.gitCommits`); `packages/reverse/src/wrapper/dry-run.ts` (`COMMIT_SWITCH_PREFIX`) | phase 7, T029 |

## Part C — what this report does NOT ask for

- No row of annex X §X.6 or §X.7 is added, removed or changed by this feature.
  All five rows it owns are already in feature 100's data and agree with
  `spec.md`; the report exists so that the orchestrator can see that the check
  was made, and by what.
- The gaps this feature reported in feature 100 earlier are settled and are
  recorded in `specs/108-reverse/research.md`, "Gaps in feature 100, reported
  and settled". They are not re-raised here.
