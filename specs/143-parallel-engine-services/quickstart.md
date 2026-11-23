# Quickstart: validating the parallel engine services (feature 143)

How to show that the feature works. Commands are those of the plan's test tree; none calls a
model. Details are in [contracts/](contracts/README.md) and [data-model.md](data-model.md).

## Prerequisites

- Node.js 22 or later; `npm install` at the repository root.
- git at the floor of `research.md` D-3 or later.
- Linux. On macOS every result is `unverified` until the macOS runner has passed.

## 1. The project's repository is untouched

```text
npm test -- tests/characterization/143 --test-name-pattern "CT-143-(102|132)"
```

Expected: the hashes of every file under the project's repository directory, and the reported
status of the working tree, are equal before and after a group of three stub workers.

## 2. The tree-store service

```text
npm test -- packages/testkit/src/conformance/EP-04 --test-name-pattern "CT-143-129"
```

Expected: seven operations; no operation writes a workspace path outside `apply`; a tree with an
attributes file that names a filter starts no process.

## 3. A group end to end

```text
npm test -- tests/characterization/143 --test-name-pattern "CT-143-1(19|20|21)"
```

Expected: two stub workers with disjoint deltas; the workspace holds both; both tasks are
ticked; the ledger holds the record kinds in order.

## 4. Crash in every state

```text
npm test -- tests/characterization/143 --test-name-pattern "CT-143-130"
```

Expected: the engine is killed after each of the thirteen ledger records; every relaunched run
ends in the tree and the kept units of work of the uninterrupted run, or rests with the loop
layer off for the run and its event.

## 5. Pause and stop

```text
npm test -- tests/characterization/143 --test-name-pattern "CT-143-1(15|26)"
```

Expected: one pause event and equal counters; a `stop` takes effect after `group_closed`.

## 6. The queue

```text
npm test -- tests/characterization/143 --test-name-pattern "CT-143-131"
```

Expected: 40,000 lines, `seq` 1 to 40,000, no torn line, `wseq` rising per worker.

## Results of the run of 2026-10-05 (task T072, on Linux)

Prerequisites held: Node v22.23.2; `npm install --ignore-scripts` exit 0; git 2.47.3, above the
floor of `research.md` D-3; Linux.

Every section **passed**. Two facts about the commands, recorded so the results are read
honestly:

1. The `npm test -- <path> --test-name-pattern <p>` form of the commands runs the WHOLE suite
   and the filter selects nothing on this repository (the root `test` script is an `&&` chain,
   and the pattern is not forwarded to it). Each such command was run and exited 0 as a whole
   suite; the per-section results below come from the equivalent filtered runs: the test file
   of the section run directly under `node tests/isolate.ts node --test <file>`.
2. `node --test` on this Node (v22.23.2) does not apply `--test-name-pattern` at all (verified:
   a no-match pattern still ran the file), so the per-file form is the only filtered form
   available here.

| Section | Command run | Result |
|---|---|---|
| 1. The project's repository is untouched | `node tests/isolate.ts node --test tests/characterization/143/ct-143-102-project-repository-untouched.test.ts` and `… ct-143-132-probe.test.ts` | pass — 6/6 and 8/8; hashes and status equal before and after; also `npm test -- tests/characterization/143 --test-name-pattern "CT-143-(102|132)"` exit 0 |
| 2. The tree-store service | `node tests/isolate.ts node --test packages/testkit/src/conformance/EP-04/ct-143-129-tree-store.test.ts` | pass — 17/17; also `npm test -- packages/testkit/src/conformance/EP-04 --test-name-pattern "CT-143-129"` exit 0 |
| 3. A group end to end | `node tests/isolate.ts node --test` on `ct-143-119-composition.test.ts`, `ct-143-120-application.test.ts`, `ct-143-121-ticks.test.ts` | pass — 5/5, 7/7, 6/6; `npm test -- tests/characterization/143 --test-name-pattern "CT-143-1(19|20|21)"` exit 0 |
| 4. Crash in every state | `node tests/isolate.ts node --test tests/characterization/143/ct-143-130-kill-matrix.test.ts` | pass — 2/2; `npm test -- tests/characterization/143 --test-name-pattern "CT-143-130"` exit 0 |
| 5. Pause and stop | `node tests/isolate.ts node --test` on `ct-143-115-group-pause.test.ts` and `ct-143-126-stop-with-a-group-live.test.ts` | pass — 2/2 and 4/4; `npm test -- tests/characterization/143 --test-name-pattern "CT-143-1(15|26)"` exit 0 |
| 6. The queue | `node tests/isolate.ts node --test tests/characterization/143/ct-143-131-queue.property.test.ts` | pass — 2/2; 40,000 lines, `seq` 1 to 40,000, no torn line, `wseq` rising per worker |

Whole suite behind the `npm test` forms: 2228 tests, 2201 pass, 0 fail, 27 skipped (the 27 are
the pre-existing feature-111/144 prerequisite skips). On macOS every result is `unverified`
until the macOS runner has passed (`research.md` D-7, task T070).
