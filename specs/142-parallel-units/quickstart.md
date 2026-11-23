# Quickstart: validating parallel units (feature 142)

How to show that the feature works. Commands are those of the plan's test tree; none calls a
model. Details are in [contracts/](contracts/README.md) and [data-model.md](data-model.md).

## Prerequisites

- Node.js 22 or later; `npm install` at the repository root.
- git, as the engine services need it.
- Linux. On macOS every result is `unverified` until the macOS runner has passed.

## 1. Off means absent

```text
npm test -- tests/inertness/142
```

Expected: every micro-loop fixture runs three ways (option off; on with no `[P]`; on with stubs
that tick every `[P]` task serially). Outputs are equal after the named fields of DV-088 are
removed. With the option off no plan file, no store and no worker root exist.

## 2. A group end to end

```text
npm test -- tests/parallel/142 --test-name-pattern "CT-142-1(59|61)"
```

Expected: two stub workers with disjoint scopes; the workspace holds both deltas; both tasks are
ticked; one merge check ran every command; one kept unit of work names both tasks.

## 3. Fallbacks and refusals

```text
npm test -- tests/characterization/142
npm test -- tests/parallel/142 --test-name-pattern "fallback|admission|refusal"
```

Expected: one fixture per fallback reason, per admission check and per refusal reason; each
prints its reason; each run completes as the run with the option off.

## 4. The critic cannot tell

```text
npm test -- tests/parallel/142 --test-name-pattern "CT-142-16(5|6)"
```

Expected: byte-identical critic prompts for the serial run and the run through a group; no word
of `contracts/vocabulary.json` in any input of a critic-class call.

## 5. Conformance

```text
npm test -- tests/conformance/142
```

Expected: the sample layer stacked above `noop` requests a group of two stub passes and
integrates them; the whole oracle passes with the sample unregistered.

## 6. Experiment E6

```text
npm run experiment:e6 -- --set FX-PAR-S
```

Expected: zero breaches; counts per failure class. FX-PAR-L is paid and is run by a person, with
the log of cost that the task in `tasks.md` asks for.

---

## Results of a run of sections 1 to 6 (T109)

Run on **2026-10-02**, on **Linux** (`Linux 7.0.14-15-pve x86_64`, Node v22.23.2), at the root of
the repository after `npm install --ignore-scripts` (exit 0). Every command below is the command
of the section above, verbatim. The full transcripts, with the exit code, the wall time and the
count of `^not ok` lines of each, are in
`.specstride/features/142-parallel-units/gates/proofs/gate-commands-phase8.txt`. That file holds
two runs of the whole list: a first one, and a second after the mutation run of this phase closed
one hole in a test. **The figures below are the second run's**, which is the state of the tree as
it stands; both runs exited 0 on every command with no `^not ok` line.

The root `test` script is a chain, so each command runs the whole suite and then the subset the
argument names. "Whole run" below is the chain; "the subset" is what the section is about.

| § | Command | Exit | Subset | Whole run | Result |
|---|---|---|---|---|---|
| 1 | `npm test -- tests/inertness/142` | 0 | 8 of 8 passed | 1414 tests, 1403 passed, 0 failed, 11 skipped | **pass** |
| 2 | `npm test -- tests/parallel/142 --test-name-pattern "CT-142-1(59\|61)"` | 0 | 63 of 63 passed | 1469 tests, 1458 passed, 0 failed, 11 skipped | **pass** |
| 3a | `npm test -- tests/characterization/142` | 0 | 6 of 6 passed | 1412 tests, 1401 passed, 0 failed, 11 skipped | **pass** |
| 3b | `npm test -- tests/parallel/142 --test-name-pattern "fallback\|admission\|refusal"` | 0 | 63 of 63 passed | 1469 tests, 1458 passed, 0 failed, 11 skipped | **pass** |
| 4 | `npm test -- tests/parallel/142 --test-name-pattern "CT-142-16(5\|6)"` | 0 | 60 of 60 passed | 1466 tests, 1455 passed, 0 failed, 11 skipped | **pass** |
| 5 | `npm test -- tests/conformance/142` | 0 | 9 of 9 passed | 1415 tests, 1404 passed, 0 failed, 11 skipped | **pass** |
| 6 | `npm run experiment:e6 -- --set FX-PAR-S` | 0 | — | — | **pass** |

No command printed a single line matching `^not ok`. The 11 skipped cases are the same 11 in
every run and are not of this feature: `tests/parity/100/supervision-outcomes.test.ts` skips
"while feature 141 is not built".

What each section expected, and what it got:

1. **Off means absent.** Every micro-loop fixture ran three ways — the option off; on with a task
   list that carries no `[P]`; on with stubs that tick every `[P]` task serially — and the outputs
   were equal after the named fields of DV-088 were removed. With the option off no plan file, no
   store and no worker root existed. 8 of 8.
2. **A group end to end.** Two stub workers with disjoint scopes; the workspace held both deltas;
   both tasks were ticked; one merge check ran every command; one kept unit of work named both
   tasks. 63 of 63 matched the pattern (the two CT files hold more cases than the two headline
   assertions).
3. **Fallbacks and refusals.** One fixture per fallback reason, per admission check and per
   refusal reason; each printed its reason; each run completed as the run with the option off.
   6 of 6 characterization cases and 63 of 63 matching the pattern.
4. **The critic cannot tell.** Byte-identical critic prompts for the serial run and the run
   through a group, and no word of `contracts/vocabulary.json` in any input of a critic-class
   call. 60 of 60.
5. **Conformance.** The sample layer stacked above `noop` requested a group of two stub passes and
   integrated them, and the whole oracle passed with the sample unregistered. 9 of 9.
6. **Experiment E6.** `FX-PAR-S`: 19 fixtures, 15 of them whole groups; **0 breaches** with all
   **5 of 5** breach conditions exercised (F142-SC-008); 97 of 97 tests of a rule passed; the pass
   mark of F142-FR-072 met; failure classes and killed passes reported per class. No mark for a
   default is given (ruling P10). **FX-PAR-L is paid and person-run: it was not run and no figure
   was invented** — see `tests/experiment/E6/LOG.md` and
   `.specstride/features/142-parallel-units/VERIFICATION-RECORD.md`.

**Platform.** This record is the **Linux** run. Per the prerequisites above, every macOS statement
stays `unverified` until the macOS runner of the release has passed `tests/parallel/142`,
`tests/inertness/142` and `tests/conformance/142`; that run is recorded as not run, with its
reason, in `research.md` D-10 and in the verification record.
