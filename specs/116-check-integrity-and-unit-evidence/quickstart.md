# Quickstart: validating check integrity and unit evidence (feature 116)

How to see that the feature works. Commands are given as the plan names them; the package does
not exist before implementation. Data and schemas: `contracts/`. Entities: `data-model.md`.

## Prerequisites

| For | Needed |
|---|---|
| Every test | Node 22 or later; `npm install` in the workspace; `git` |
| Tests of conditions | The verification command stubs of feature 141 and the tamper fixtures of this feature |
| Never in a test or a build job | A model call, a login, a network connection beyond loopback |

## Scenarios of validation

| # | Do | Expect | Requirement |
|---|---|---|---|
| 1 | `npm test -w @specstride/integrity` | Every `CT-116-*` passes | F116-SC-003 |
| 2 | `npm run conformance -- EP-16` | The profile of a fictional toolchain in a test overlay changes the protected set of the fixture; no file of the product changed | F116-FR-014 |
| 3 | Run the tamper fixture once per seeded tampering of `contracts/tamperings.json` | The expected condition each time; never a pass | F116-SC-001 |
| 4 | Change a file during a check, by a stub command that waits | `tainted` with the reason `changed-during-check`; the exit result is kept | F116-FR-005 |
| 5 | Change a protected path that a task of the phase names in its text at launch | No taint; the path is listed as authorised | F116-FR-010 |
| 6 | Build the fact block of the fixture "two histories" for both histories | Byte-identical blocks | F116-FR-020; F116-SC-002 |
| 7 | Plant a file with the name of the fact block in the workspace, then build the block | The block is unchanged | F116-FR-016 |
| 8 | Search the fact block of every fixture for each excluded field of `contracts/fact-block-content.md` | 0 hits | F116-FR-019 |
| 9 | Edit a file between the approval of phase 1 and the entry of phase 2 | The integrity kind `phase-entry-mismatch`; the path in the fact block of phase 2; the run goes on | F116-FR-012 |
| 10 | The same under the `parity` profile | No fingerprint, no event, no file of this feature | F116-FR-012 |
| 11 | Put a profile into project configuration; put the same profile under `toolchains.<id>` of user configuration | The first is ignored, with a launch message and a doctor warning; the second is used | F116-FR-014 |
| 12 | Run a fixture of a toolchain without a profile, then `specstride doctor` | The doctor names the toolchain; the protected set records `basic` | F116-FR-015 |
| 14 | In an ignored directory from which a check executes, change a file that a class A pattern matches, and restore its size and modification time | `tainted`; the record of the protected set names the file under `contentHashed` | F116-FR-003 |
| 15 | Read the event file after scenario 4 and after scenario 9 | One event `integrity.noted` each, with `kind` and `detail`; no content of a file in `detail` | F116-FR-022 |
| 16 | Validate the records at `phase:<N>:protected-set` and `unit:<unitId>:check:<i>` of a fixture against `contracts/schemas/` | Both validate; an entry of `commands` has `id` and `exit` | F116-FR-023 |
| 13 | `python3 docs/ecosystem/check-traceability.py` | No line that starts with `[h` names feature 116 | — |

## What "done" looks like

| Measure | Value |
|---|---|
| Integrity rules owned here with a passing test | 18 of 18 |
| Seeded tamperings recorded as a pass | 0 |
| Pairs of equal final states with differing fact blocks | 0 |
| Excluded fields found in any fact block | 0 |
| Files of this feature that exist under the `parity` profile | 0 |
