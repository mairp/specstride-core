# Quickstart: validating feature 100

Phase 1 of the plan. How to show that the feature works. Commands are run from the root of the
repository. No command here calls a model or a paid service.

## Prerequisites

| Need | Check |
|---|---|
| Node 22 or later, npm | `node --version`, `npm --version` |
| git | `git --version` |
| Python 3 only to re-run the retired generator of the specification beside the ported one (the byte-identical proof of T293 skips with its reason without it); it is no requirement of development since T207 | `python3 --version` |
| For the parity tests: the oracle of feature 141 with its reference trees | Its own quickstart |

Set-up: `npm install` at the root. It must succeed with install scripts ignored
(`npm install --ignore-scripts`) and must compile nothing (F100-FR-027).

## Tiers

| Tier | What runs | Needs |
|---|---|---|
| Hermetic | Everything in scenarios 1 to 7 | Node only |
| Parity | Scenario 8 | The oracle of feature 141 |
| Live | Scenario 9 | A live host and harness; run at release |

A test whose prerequisite is missing reports a skip with its reason, never a pass.

## Scenario 1: the contract files equal the annexes

```
npm run contracts:check
```

Expected: `checked 82 files, 0 differ`, exit 0. Change a cell of any table of an annex and run it
again: the file that mirrors the table is named and the exit code is 1.

Since T207 the generator is the workspace tool `tools/contracts-gen/`. The Python script of the
specification, `specs/100-specstride/contracts/tools/generate.py`, is retired: it stays in the tree
as the oracle of the port and is no longer a step of the build. Its own `--check` prints the same
line.

## Scenario 2: every record validates, and a different major is refused

```
npm test --workspace @specstride/contracts
```

Expected: for each of the 30 schemas of `contracts/schemas/`, a valid sample record passes; the
same record with `schema` set to the next major is refused with a message that names the logical
name and both majors (F100-FR-049); the same record with an unknown field passes; a closed
schema refuses an unknown top-level key and accepts a key under `x-`.

## Scenario 3: the static tests

```
npm run test:static --workspace @specstride/testkit
```

Expected, each as a test that fails when the condition is broken (F100-FR-225,
F100-FR-209, F100-FR-211):

| Test | Passes when |
|---|---|
| Closed sets | Every closed set of the `contracts` package has a row in `closed-sets.json` and the reverse |
| Schema field | Every logical name of the control plane whose content is a record has a schema with a required `schema` property |
| Profile | Every switch that a package registers has a row in `parity-profile.json` with a value under `parity` |
| Logical names | Every logical name has a path, a root, one writer |
| Physical paths | No specification under `specs/1*` names a path of `layout.json` outside `plan.md` and `contracts/` |
| Vocabulary | No specification under `specs/1*` names an exit code, stop reason, run state or logical name that the data files do not hold |
| No closed list | No requirement under `specs/1*` enumerates harness names |

## Scenario 4: table-level tests of codes, reasons and transitions

```
npm run test:tables --workspace @specstride/testkit
```

Expected: one test per row of `exit-codes.json`, of `stop-reasons.json` (15 rows) and of the
transitions of `run-state-machine.json` (18 rows); 100 per cent of the rows covered (F100-SC-009).

## Scenario 5: a sample outside the core passes, and the core does not change

```
npm run conformance --workspace @specstride/testkit          # all nineteen points
npm run conformance --workspace @specstride/testkit -- EP-08  # one point
npm run check:imports
```

Expected: nineteen suites pass on their samples. `check:imports` passes. Then add, in a scratch
copy, the name of a sample to a file of a core package: `check:imports` fails and names the file
(F100-FR-012). Remove every sample: the build of the core packages is byte-identical
(F100-SC-001).

## Scenario 6: the table evaluator

```
npm test --workspace @specstride/kernel -- table
```

Expected: for a table with a default row, exactly one row fires for every vector of signals; a
table without a default row for a decision point fails at load; every decision record holds the
rule id and the version of the table (F100-FR-204).

## Scenario 7: the canary test

```
npm run test:canary --workspace @specstride/testkit
```

Expected: with content capture on, canary secrets planted in the prompt, the reply, tool
arguments, tool output, phase evidence, the output of a check and the comment appear in no sink.
In feature 100 the harness runs against the sample sink and a stub redactor that replaces exact
values; feature 111 runs the same harness against the real redactor, and that run is the release
condition (F100-FR-219).

## Scenario 8: parity, table level

```
npm run test:parity -- --feature 100
```

Expected, under the `parity` profile, result `equal` or `waived` with its register row for:

| Test | Proves | Fixture families |
|---|---|---|
| `PT-100-028SC003-*` | 028 SC-003: every halt cause of the engine has one code | FX-03, FX-04, FX-05, FX-07, FX-11, FX-12, FX-17 |
| `PT-100-011SC004-*` | 011 SC-004: the classes of failure of the launcher map to 20 to 24 | FX-33, FX-35 |
| `PT-100-011SC007-*` | 011 SC-007: seven supervision outcomes | FX-36 |
| `PT-100-C-008-*`, `PT-100-C-011-*`, `PT-100-C-012-*`, `PT-100-C-013-*` | The kept items of the four clusters | FX-01 |

And the two characterization tests of the Lisa side of the exit vocabulary:

```
npm run test:characterization -- --feature 100      # CT-100-1, CT-100-2
```

## Scenario 9: integration acceptance (at release)

On the release build: the nineteen conformance suites pass; the oracle reports no `different`
under the `parity` profile; the second suite passes; on a reference project a run started through
the host package for Claude Code reaches every phase gate approved, and the time from launch to
the last approved phase gate is reported per stage beside the measured baseline
(F100-FR-222, F100-FR-223, F100-FR-224). On a macOS runner the same,
before the release (F100-FR-025).

## Where the details are

| Subject | File |
|---|---|
| Fields of every record | `contracts/schemas/`, and the annex section named in `contracts/README.md` |
| Entities, writers, transitions | `data-model.md` |
| Decisions and their reasons | `research.md` |
| Paths | `plan.md`, "Physical paths behind the logical names"; `contracts/data/layout.json` |
