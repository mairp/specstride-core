# Verification record of feature 149

What was verified, where, and what stays `unverified`. One row per obligation of
[`tasks.md`](tasks.md) whose answer is not simply "its test passes"; everything else is in the
tests themselves and in the records they write.

Written on 2026-10-01, on Linux `x64` with Node `v22.23.2`.

## T034 — the tests of this feature on the macOS runner

**`unverified`.** No macOS runner has run the tests of this feature.

**Reason**: this working tree has no git remote and has never been pushed, so
`.github/workflows/build.yml` cannot be dispatched on a macOS runner; and the record that a macOS
runner has passed, `tests/release/100/macos-verified.json`, is absent. The owner's policy of
2026-09-30 puts a macOS task out of band: it is never run and never faked by an automated pass.

**What was done instead**: the hermetic half, on Linux. The suite of this feature, the conformance
suite of EP-18 and the static review were run and recorded in
[`tests/characterization/149/README.md`](../../tests/characterization/149/README.md). The macOS
half, what it would prove, who runs it and the commands it runs are written in
[`tests/release/149/macos.md`](../../tests/release/149/macos.md).

**Until a macOS runner has passed**: every statement of this feature about macOS stays
`unverified` (the Constraints of [`spec.md`](spec.md), row "Linux and macOS are both first-class";
ruling 67). On 2026-10-01 this feature makes no statement of its own about macOS: its sources name
no operating system and none of them decides anything by one.

## T033 — the quickstart, section 3

**Partly skipped, with its reason.** The two commands of CLI protocol 1 that section 3 names
cannot be run: `packages/cli` is the skeleton of the campaign scaffolding and carries no command,
and the command line belongs to features 119 and 145 and to the owner of each command. A missing
prerequisite is a skip with its reason and never a pass.

**What was done instead**: what the two steps would show was run through the modules the command
line drives, and passed. Recorded in
[`tests/characterization/149/README.md`](../../tests/characterization/149/README.md), section 3,
and asserted in `tests/characterization/149/quickstart-section-3.test.ts`. When `packages/cli`
carries a command, the skipped test runs the two commands itself and the skip disappears on its
own.

## The ablation arm of the model-tier bump (T027)

**Not run: PAID.** Arm X13 is defined in
[`contracts/ablation-tier-bump.md`](contracts/ablation-tier-bump.md) and is run by the owner, by
hand, with its cost logged before it starts. Nothing in this repository starts it.

## What needs no verification record

This feature has no parity test and needs no reference tree and no oracle
([`plan.md`](plan.md), "Summary"; [`quickstart.md`](quickstart.md), "Prerequisites"), so the two
other prerequisites T034 names are not missing here — they are not needed.
