# T033 — the eight scenarios of `quickstart.md`, run

**Task**: T033 · **Requirements**: F140-FR-001 to F140-FR-026 · **Date**: 2026-10-03.

The eight scenarios of `specs/140-reverse-inventory-and-lint/quickstart.md`
("Scenarios of validation") were run through the verbs' own entry points. The
runner is `tests/characterization/140/quickstart.test.ts`; it reads the eight
rows from `quickstart.md` itself, so a scenario that is added, removed or
renumbered there fails the run rather than going unnoticed. It runs with
`npm run test:characterization` and so inside the gate's root `npm run test`.

## The run

| System | Value |
|---|---|
| Kernel | Linux 7.0.14-15-pve, x86_64 |
| Node.js | v22.23.2 |
| Platform | `linux` (`process.platform`) |
| `git` | version 2.47.3, on the path |
| Test runner | the one Node ships (`node --test`), through `tests/isolate.ts` |
| Model calls, network, engine | none |

Prerequisites of the table "Prerequisites" of `quickstart.md`: Node 22 or later
— met; `git` on the path — met (scenario 4 needs it, and a missing `git` would
be a skip with its reason and **never a pass**); the oracle of feature 141 with
the golden captures of FX-30 — **not met**, see the paragraph after the table; a
macOS runner — **not met**, so every macOS statement stays `unverified`
(`tests/parity/140/README.md`).

## The results

| # | Do | Expect | Requirement | Result | What was measured |
|---|---|---|---|---|---|
| 1 | `reverse inventory <fixture> --out <file>` twice | Two byte-identical files; the fingerprint equals the baseline's | F140-SC-003 | `pass` | The two files compare equal byte for byte, and the fingerprint is `b64bc26fad165ed1f356cc10d146628f603716249fca303e157a31c16b35e2fc`, which is the value `lib/reverse_inventory.py` of the Specstride baseline at `9cab15d` produced over the same tree (`packages/reverse/test/140/data/baseline-reference.json`, case `default`) |
| 2 | The same on a tree with a non-ASCII path | Order and fingerprint equal the reference's | F140-FR-021 | `pass` | The tree carries `naïve/ünïcode-😀.md` and the pair `order/pair-😀.md` / `order/pair-﷐.md`. The file list is in code-point order, and the test also asserts that UTF-16 order would give ANOTHER order — which is what makes the rule measurable rather than incidental. The fingerprint equals the baseline's |
| 3 | The same on a tree with a binary file, an oversize file and an escaping link | Each skipped with its reason and still fingerprinted | F140-FR-020 | `pass` | Three skipped entries of reasons `binary`, `oversize` and `symlink-escape`; the `oversize` entry carries its `limit`; every skipped entry carries a 64-hex `sha256`. "Still fingerprinted" is measured, not asserted: changing the bytes of the binary file changes the fingerprint |
| 4 | The same on a subdirectory of a git work tree | Walk mode `walk` | F140-FR-017 | `pass` | The tree was made a git work tree with one commit, hermetically (`GIT_CONFIG_GLOBAL=/dev/null`). Its top level gives walk mode `git`; the subdirectory `src/` of the same work tree gives `walk`. Both halves are asserted, so the scenario cannot pass by the walk mode never being `git` at all |
| 5 | `reverse lint <feature dir> --json` on one fixture per finding code | The code appears; exit 3; on a clean directory exit 0 | F140-SC-001, F140-SC-002 | `pass` | All 38 fixtures run with `--json`. Each raises **exactly its own code** and nothing else (the code under the key `rule`, the compatibility name F140-FR-003 keeps from the baseline). The clean directory gives `{"errors": [], "warnings": []}` and exit 0. On the exit: see the note below |
| 6 | `reverse lint <dir> --upto 6` | Exit 3 with the message of the levels | F140-FR-002 | `pass` | Exit 3, nothing on standard output, and on standard error exactly `reverse: --upto must be one of 0, 1, 2, 3, 4, 5` |
| 7 | `reverse lint <dir>` without `--src` | The warning `evidence.skipped` | F140-FR-003 | `pass` | The warning is raised with its as-is message `no --src: evidence citations were not checked`, and the exit is 0 (a warning alone never fails the lint). The same run WITH `--src` does not raise it, so the warning is of the missing flag and not of the fixture |
| 8 | Read the file of scenario 1; then `reverse lint <dir> --baseline <file>` with the key `schema` removed | The file carries `schema` `specstride.reverse-inventory/1` and `schema_version` 1; without the key the lint exits 3 with `not an inventory: <path>` | F140-FR-021 | `pass` | The written file carries `schema` `specstride.reverse-inventory/1` and `schema_version` `1`. With the key, `--baseline` accepts it and the lint exits 0. With the key removed, exit 3 and `reverse: not an inventory: <path>` on standard error. The inventory is taken over the lint's own `--src` tree, so the run measures the field and not a citation that could not resolve |

Counts: **8 scenarios, 8 `pass`, 0 fail, 0 skip.**

## One place where the quickstart's wording is looser than the requirement

Scenario 5's "Expect" cell says "exit 3". The rule is F140-FR-001: the lint
exits 3 "when at least one finding has the severity error and 0 otherwise;
**warnings alone never fail it**". Four of the 38 codes are warnings —
`template.expected`, `evidence.skipped`, `unknowns.placement` and
`data-model.entities` — so their fixtures raise their code and exit **0**. The
run measured 34 fixtures at exit 3 and 4 at exit 0, and the test asserts the
split by severity rather than a flat "exit 3".

This is the as-is behaviour and not a departure: nothing is changed, and the
scenario's real content — "the code appears" and "on a clean directory exit 0" —
holds for all 38. It is recorded here because a reader of the quickstart cell
alone would expect exit 3 thirty-eight times. A later editor of `quickstart.md`
may want to write "exit 3 for an error code, 0 for a warning code"; that is an
edit of feature 140's own file and outside the paths of this phase.

## The prerequisite that is not met, and what it costs

The oracle of feature 141 with the golden captures of FX-30 does not exist
(`packages/oracle/` is a skeleton). The last paragraph of `quickstart.md` says
the expected results of the parity scenarios ARE those captures. So scenarios 1
to 4 were measured against the **extracted Specstride baseline at `9cab15d`**
instead — the Python module was run over the same trees and its bytes kept as
`packages/reverse/test/140/data/baseline-reference.json`. That is a real
reference and not a self-comparison, but it is this feature's own capture rather
than the oracle's, and it compares the document and the fingerprint rather than
all five surfaces of FX-30. The gap, and the scenarios it would need, are the
subject of `T032-fx30-parity-profile.md`.
