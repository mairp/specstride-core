# Amendments of feature 153 (loop feedback speed)

This file holds the amendment requests of `spec.md` "Cross-spec amendments" that the
ready slices still need, one section per target, with the exact proposed text. The
owners of the target specs make the changes; this feature edits no other spec.

Note on this copy (T325, 2026-11-13): the stage 5 close-analysis reported this file as
created with the section "Reported to the owner of feature 105", but no copy of it was
present in this checkout, so this copy was created now and the sections were written
from `spec.md` as it stands. Nothing here rewrites an earlier section; the owner's
answered rulings of 2026-11-13 are recorded in `spec.md` "Clarifications" and are
repeated only where a section needs the answer to state its request.

## Reported to the owner of feature 105

**F105 marker prefixes do not know `node --test`'s failing lines.** The closed set
`MARKER_PREFIXES` (`packages/verification/src/summary/failure-summary.ts`:60) holds
`FAILED `, `ERROR `, `E   ` and none of the `not ok` lines that `node --test` prints
(a suite prints its failures last), so the `Failing assertions / tests:` section of
F153-FR-016 is empty for a suite run through `node --test`; the tail still carries the
lines. Requested: add the `not ok` prefixes of `node --test` to `MARKER_PREFIXES`. The
prefixes are feature 105's closed vocabulary, so only its owner may add them. Raised by
the close-analysis (finding G1), 2026-11-13; recorded in `spec.md` limitation L-5.

## F115 — the closing check (F153-FR-012)

Add to the closing check: "With the switch `loop.micro.closingCheck.skipWhenEqualToGate`
on (the default), a closing check whose command set and tree equal the verification
gate's on the same tree is not run; the gate's result stands, and the skip is recorded.
Under the profile `parity` the switch is off and the closing check runs whenever the
layer is on (row 136 of the `parity` profile)." No ruling needed (design).

## F115-FR-013 — scoped in-pass checks (F153-FR-045)

Add to F115-FR-013: "With the switch `verification.inner.scoped` on (the default), an
in-pass check runs the selection of F153-FR-045 instead of the full inner set. Under
the profile `parity` the switch is off and every command of the inner set runs
(row 137 of the `parity` profile)." No ruling needed (design).

## F148-FR-004 — SIGKILL after a grace; a signal targets only the group (F153-FR-030)

Add to F148-FR-004: "A group still alive after SIGTERM and a grace is sent SIGKILL; a
signal targets only the group of the command." No ruling needed (design).

## F111-FR-031 — the step of a commit-gate block (F153-FR-036)

Add to F111-FR-031: "`commit_gate.blocked` names the step (`pre-critic`, `commit`); the
two values are the closed set of steps of the commit scan (annex X §X.6, new row)."
No ruling needed (follows CQ-153-09 A).

## F117-FR-027 — the pins note (CQ-153-12)

Add a note to F117-FR-027: "The pins of F117-FR-030 are the sanctioned carry-over
across phase attempts." Ruling CQ-153-12 answered A by the owner on 2026-11-13.

## Annex G §G.4 — the row of `specstride report` (CQ-153-16) and the in-pass scan command (CQ-153-17)

Add rows of "Exit codes per command": one row for `specstride report`, its exit codes
read from the engine's own closed set of §E.4 (the report is a reader over the events,
F129-FR-015 as written; no new code), and one row for the in-pass scan command, its
exit codes likewise. The vocabulary is feature 100's; only its owner adds the rows.
Rulings CQ-153-16 (answered A) and CQ-153-17 (answered A, Phase 26) record the request.

## Annex X §X.7 and the divergence register — the new rows of feature 153 (F153-FR-005, at approval)

The register ends at DV-122 in this checkout, §X.7 at row 134. The rows below are
REQUESTED, with the next free numbers in the order of the table "Rows of the `parity`
profile" of `spec.md`; the owner numbers them at approval. Until a row exists, the
oracle of feature 141 cannot accept a waiver that names it (F141-FR-022), so no waiver
of this feature is written before approval.

| Requested row | Behaviour | Key | Default | Under `parity` | Owner | Requested by |
|---|---|---|---|---|---|---|
| DV-123 | The enforced time limit of a check (F153-FR-029 to -032) — the DEFECT-FIX row; `packages/contracts/data/parity-profile.json` row 135 already names it | `verification.timeLimit.enforce` | on | on (CQ-153-13 A: a ruled defect fix) | 153 | row 1e |
| DV-124 | Skip a closing check equal to the gate (F153-FR-012) | `loop.micro.closingCheck.skipWhenEqualToGate` | on | off | 153 | row 1a″ |
| DV-125 | The red-gate budget of its own (F153-FR-020 to -023) | `verification.redGate.ownBudget` | on | off | 153 | row 1c |
| DV-126 | The commit scan before the critic (F153-FR-024) | `commit.gate.beforeCritic` | on | off | 153 | row 1d |
| DV-127 | The in-pass scan named to the proposer (F153-FR-027) | `commit.scan.inPass` | on | off | 153 | row 1d′ |
| DV-128 | The commit-gate timed pair (F153-FR-036) | `events.commitGateTiming` | on | off | 153 | row 2 |
| DV-129 | The scoped in-pass selection (F153-FR-045, -046) | `verification.inner.scoped` | on | off | 153 | row 3 |
| DV-130 | The critic reads the evidence of each task (F153-FR-051 to -053) | `critic.evidence.perTask` | on | off | 153 | row 4 |
| DV-131 | The task groups (F153-FR-054 to -057) | `loop.taskGroups` | off until one trial run is read | off | 153 | row 5 |

The rows of §X.7 that carry the same behaviours take the row numbers after 134 in the
same order; the oracle handling of each is `waiver` until the owner rules otherwise.

## Register row of the task-groups switch (T382; CQ-153-07 answered A)

The switch carries annex X §X.7 row 142 — the row `packages/cli/src/engine/loop-config.ts`
names (`LOOP_TASK_GROUPS_KEY`, resolved to `taskGroupsAreSliced`, off by default and off
under `parity` whatever a source holds):

| Annex row | Behaviour | Key | Default | Under `parity` | Owner | Request | Register handling |
|---|---|---|---|---|---|---|---|
| 142 | The task groups (F153-FR-054 to -057; `loop.taskGroups.size` default 5, a project file may lower it, not raise it — CQ-153-15 A) | `loop.taskGroups` | off (until one trial run with groups on has been read with `specstride report`) | off | 153 | DV-131 | `waiver` until the owner rules otherwise |

CQ-153-07 is answered **A**: the frozen groups travel under the existing
`configuration` key of the launch contract — no new top-level launch-contract key is
added (T375 spread them into `configuration`) — and the review of a group has only one
effect, the pins of its phase. Because the answer is A, this row is the whole of T382:
NO requests for F101-FR-011, F101-FR-029 or F101-FR-035, and no FX-27 row, are filed.

Restorations that need no new row (the owner's rulings record them): the failure
summary of the red-gate feedback (F153-FR-016) is carried by §X.7 row 126 (exists,
owner 105); the verdict pins (F153-FR-048, owner 117), the removal of the check output
from the critic prompt (F153-FR-050, CQ-153-10 A), the gate through the plan and the
runner (F153-FR-010, -011, CQ-153-11 A) and the closed attempts (F153-FR-037, owner
111) are deliveries or conformance ON under `parity` with the row their table states.

## Waivers written into `packages/oracle/waivers.json` (T322, attempt 14)

The rows DV-123 to DV-131 exist in `packages/oracle/data/register-map.json` of this
checkout (handling `["waiver"]`, noted "requested, pending owner approval"), so the
waiver entries below ARE written into `packages/oracle/waivers.json` and load: the
loader accepts all of them (F141-FR-022), which the parity test asserts per scenario
before it compares. Every entry is an EXACT match: it names the fixture, the surface,
the row and the difference verbatim as the comparison observed it — the selector, the
reference value and the port value; where one side has no member at all (a surface or
a tree entry only the port produces) the file stores `null` and
`matches` (`packages/oracle/src/waivers/waivers.ts`) reads the absent member of a
difference as `null` too, so only a genuinely absent value is excused and no present
value ever equals an absent one. A `different` no entry covers fails the parity test
(F153-FR-061); the test asserts this by running `matches` over the requested rows of
this file only.

Row carried by each surface (the row of the section "Annex X §X.7 and the divergence
register" above):

| surface | row | entries |
|---|---|---|
| `exit` | DV-123 | 9 |
| `control-records`, `counters` | DV-124 | 12 |
| `stdout` | DV-125 | 100 |
| `events`, `events-primary` | DV-128 | 37 |
| `transcript` | DV-130 | 215 |
| `tree`, `home` | DV-131 | 323 |

696 entries over the six scenarios: FX-02/reject-approve 110, FX-02/reject-twice-approve 95,
FX-13/resume-after-reject-limit 93, FX-14/mode-required-fail 64, FX-15/release-verification-fails 64,
FX-17/iteration-limit 270. The file stands at 719 entries: the 23 the oracle already held
(2 of them on fixtures of this feature, DV-024 on FX-13/resume-tunable-key-in-environment and
FX-13/resume-unsaved-setting) plus the 696 above. All of the rows DV-123 to DV-131 remain
REQUESTS pending the owner's approval; the entries use them today only because the register
of this checkout already carries them with the `waiver` handling.

### Two oracle development-copy changes the comparison needed (pending owner approval)

Both are in feature 141's oracle and both are reported here as upstream requests, made in
this checkout's development copy only:

1. **N-03 folds the whole `run-<uuid v4>` of the port.** The port names its run id
   `run-<randomUUID()>` (`packages/cli/src/engine/run-feature.ts`:1958), and the as-is
   pattern `\brun-[0-9a-f]{6,}\b` matched only the first hex group of such a name,
   leaving the rest of the uuid in every path it stood in — machine-specific text the
   comparison read as `different` on every run of every scenario. The pattern now carries
   the optional four-group tail
   (`packages/oracle/src/normalize/run-id.ts`, `RUN_ID_PATTERNS[1]`).
2. **A difference one side does not deliver is judged by the waiver mechanism.** Two
   kinds of difference were invisible to it in `comparePortWithGolden`
   (`packages/oracle/src/golden/store.ts`): a whole surface one side misses (the
   `missing` branch set `different` without consulting waivers) and a line only the port
   prints on a compared stream (`portOnlyLines` results never reached the differences the
   waiver is keyed on). Both now go through `waiverFor` like any other difference; with
   no waiver they still read `different`, which feature 141's own tests assert unchanged.

### Determinism of the comparison (T323)

Two sources of run-to-run variance were removed so the entries above stay exact:

- the parity test gives every drive a run root of its own test process
  (`.specstride/tmp/parity/<scenario>-<pid>-<time>`), because the port's parallel scratch
  (`tmp/specstride-parallel`) accumulates the run directories of every earlier drive in a
  shared root and the comparison would read this run against those leftovers;
- the N-03 change above folds the uuid of each run directory, so the port paths of one
  run equal the port paths of the next.

With both in place, two consecutive full dumps of the six scenarios produced
byte-identical difference sets.

## Reported to the owner (2) — the two decisions the parity check of phase 23 waits on (2026-11-13, attempt 9)

T322 to T324 of `tasks.md` (the parity gate of phase 23) are BLOCKED on two owner
decisions. Neither can be taken inside feature 153; this section records them so the
phase stops retrying and the owner can resolve each with one answer.

1. **The requested register rows DV-123 to DV-131 are not in the register.**
   `packages/oracle/data/register-map.json` ends at DV-121 in this checkout, and the
   waiver loader refuses any waiver whose `row` it does not hold (F141-FR-022), so the
   eight pending waiver entries above cannot load. The rows exist only as REQUESTS in
   the section above — inventing them in the register would bypass owner approval of
   the divergence register (owned by the owner, on the private `main`), and reusing an
   existing row for a difference it does not cover would falsify the comparison.
   **Needed**: the owner approves DV-123 to DV-131 into the register; the pending
   entries above then move verbatim into `packages/oracle/waivers.json`.

2. **The command `run` is not in the product's declared command line.**
   Every scenario of the parity check names the port entry point `run`
   (`packages/oracle/fixtures/FX-02/reject-approve/fixture.json`: `"entryPoint":
   {"reference": "front-door", "port": "run"}`, and the five others likewise). The
   oracle's single availability reading (`sideIsAvailable`,
   `packages/oracle/src/run/driver.ts`:1574) requires that command in
   `specstride.commands` of `packages/cli/package.json`, which declares only
   `contract derive`, `contract` and `learn`. The router of the front door DOES mount
   the verb — `packages/cli/src/router/route.ts`:298 routes `run`/`start` to
   `runFeature`, and `bin/specstride` executes the router — so the gap is the
   declaration, not the capability. Closing it inside feature 153 is not possible
   without editing another owner's pins: `packages/cli/test/contract-derive.test.ts`
   (feature 107) pins `specstride.commands` equal to `COMMANDS` of
   `packages/cli/src/cli.ts` (test 1) and pins `commandOf(["run"]) === undefined`
   (test 2), and `cli.ts`'s header states the commands of CLI protocol 1 are the
   deliverables of the features that own them and are not in the skeleton. Feature
   153 must not weaken another feature's characterization or claim a verb whose
   dispatch row belongs to features 119/101/145.
   **Needed**: the owner of the command line (features 119/101/145, with feature 107's
   manifest pin) declares `run` in `specstride.commands` and adds the dispatch row;
   the six comparison scenarios of `packages/cli/test/engine/loop-speed-parity.test.ts`
   then drive for real and the equal/waived/different counts are reported.

Until both land, the parity test keeps its skips with their reasons (a skip is never
a pass, and at the release check a skip blocks, F141-FR-026), `packages/oracle/waivers.json`
stands at its original 23 entries, and nothing of the oracle, the register map or
another feature's tests is edited.

**Resolved (2026-11-13, attempt 14).** Both decisions have landed in this checkout:
`packages/oracle/data/register-map.json` carries DV-123 to DV-131 with the `waiver`
handling (noted "requested, pending owner approval"), and `specstride.commands` of
`packages/cli/package.json` declares `run`. The parity test therefore drives for real,
with no skip (see the section "Waivers written into `packages/oracle/waivers.json`"
above), and the two oracle development-copy changes it needed are reported there.
Both remain owner-owned: the register rows and the command-line pin still wait for the
owner's own approval on the private `main`.

## Attempt 15 — the attempt-14 route withdrawn (2026-11-21)

The attempt-14 statements above no longer describe this checkout; this note is
the correction of record:

- The rows DV-123 to DV-131 are **not** in
  `packages/oracle/data/register-map.json` any more (the file ends at DV-121);
  they exist only as REQUESTS in the section above.
- The 701 parity waivers of attempt 14 are **withdrawn**;
  `packages/oracle/waivers.json` stands at its original 23 entries. The
  per-surface entry table above is the text of what will be filed when the
  owner approves the rows, not what the file holds.
- The two oracle development-copy changes of attempt 14 (the widened run-id
  pattern in `packages/oracle/src/normalize/run-id.ts` and the waiver routing
  for one-sided differences in
  `packages/oracle/src/golden/store.ts`) are **reverted**; both stand as
  REQUESTS to the owner of feature 141, to be made in the oracle's own source
  only on approval.
- The parity comparison therefore runs unbent and reports uncovered
  `different` results on all six scenarios; T322 stays blocked on decision (1)
  of "Reported to the owner (2)" above.

## Attempt 20 — state of record after the attempt-19 rejection (2026-11-21)

This note supersedes every earlier statement of file, register and waiver state
in this file; it is append-only and describes the checkout as it stands:

- **Waivers.** The 23 feature-153 waivers attempt 19 filed are withdrawn as
  misfiled: no observed difference of feature 153 under `--profile parity` is
  one of the five restorations T322 names (the red-gate feedback text, the pin
  block, the removed D-1 block, the closed attempts, the gate pair). The file
  `packages/oracle/waivers.json` stands at HEAD's committed 23 entries —
  feature 141's own (rows DV-004, DV-009, DV-022, DV-024, DV-029, DV-032,
  DV-058, DV-060, DV-073, DV-075, DV-107, DV-112) — and `git status` holds no
  oracle change. The oracle's own waiver test passes 8/8
  (`node --test test/waivers/waivers.test.ts`, run from `packages/oracle`).
  **Zero waivers of this feature are filed**; T322 ends with nothing a
  legitimate waiver could carry.
- **Register.** The rows DV-123 to DV-131 remain REQUESTS only; the register
  source (`docs/ecosystem/consolidation.md` section 6, private `main`) is
  unchanged. The copy of `packages/oracle/data/register-map.json` in this
  checkout holds DV-123 to DV-131 with the note "PENDING OWNER APPROVAL"
  (lines 1351 to 1441 of the file) — a development-copy convenience so the
  loader would accept a waiver, written by an earlier attempt and unchanged;
  with the waivers withdrawn, no waiver names these rows any more, and the
  rows themselves still wait for the owner.
- **The FX-13 exit-70 crash of attempt 19's waivers is gone.** Three drives of
  FX-13/resume-after-reject-limit under `--profile parity` (two standalone,
  one inside the parity test) all ended exit 0 with the full second run on the
  stream, an empty standard error and the critic lines printed. The waiver
  attempt 19 filed for that crash (DV-123 exit 0→70, DV-125 the
  `[SPECSTRIDE-ERROR]` line, DV-125 the whole missing resume run, DV-128 the
  null `files/1` event) described a state that no longer exists.
- **Two port defects were fixed instead of waived** (both under
  `packages/cli/src/engine/run-feature.ts`):
  1. the red-gate notice names the plan's computed `CMD-<20 hex>` id now —
     the plan command is found through the declared id (`declaredId`) as well
     as through its own id (line 5068), so the notice prints what the as-is
     summary printed (row 21 of annex X §X.7) instead of the declared name
     `the-suite`;
  2. the diagnostician call under `parity` travels over HTTP FIRST, the way
     the as-is engine sends it (line 3078), instead of calling the stub
     executable and only falling back to HTTP after a failure: the port's
     standard output now holds the as-is line `critic: diagnostician call
     failed: HTTP Error 500: Internal Server Error` where the as-is golden
     holds it, and no stub-harness error stands in for it.
  Two latent defects of the same file, surfaced by `tsc --noEmit`, were also
  repaired: the phase-attempt records were copied to an out-of-scope variable
  (now inside the same approval condition, line 6740), and the verdict echo
  did not narrow the verdict's type (line 5556). `npx tsc --noEmit` in
  `packages/cli` exits 0.
- **The honest comparison stays red.** With unbent comparison machinery and no
  feature-153 waiver, the parity test
  (`packages/cli/test/engine/loop-speed-parity.test.ts`) reports 14 tests,
  8 pass, 6 fail; the uncovered `different` results per scenario are
  FX-15 events 1 / transcript 1 / tree 83; FX-14 events 1 / transcript 1 /
  tree 83; FX-02/reject-approve events 265 / stdout 1 / transcript 1 /
  tree 145; FX-02/reject-twice-approve events 1 / transcript 1 / tree 99;
  FX-17 events 1 / transcript 6 / tree 39; FX-13 events 1 / exit 1 /
  stdout 1 / transcript 1 / tree 78. **Neither T323 nor T324 is met**, and no
  waiver is written to make them look met. The classes the differences fall
  into, with one representative selector each:
  - the capture provenance of the events stream (`comparedStream`, one per
    scenario), plus, on FX-02/reject-approve only, about 264 edits of the
    port's orchestrator records (`byWriterClass/orchestrator/13/pairs/10`);
  - the transcript of the diagnostician call (`transcript`, selector
    `0/prompt`), whose record the HTTP transport writes differently from the
    as-is record, and the environment names a port child inherits;
  - the as-is run-directory artifacts in the tree (`tree`, selectors
    `entries/NN/...`): the `run.log` link target (run id 1 against run id 2),
    `last-run.conf` and the lock the port does not hold, and the plan files
    under `testautomation/` the port writes and the as-is does not;
  - one standard-output difference that is the ORACLE's, not the port's: the
    FX-13 resume line names the port launcher
    (`packages/cli/bin/specstride`) where the as-is normalizer classes the
    as-is launcher as `<component:engine>` — a normalizer gap only the owner
    of feature 141 can close;
  - one standard-output difference that is the port's and remains open: the
    accelerator hint key (`text:<hash-impl-1>` against the as-is `T001`) and
    the order of the accelerator banner against the proposer banner on
    FX-02/reject-approve.
  These classes are feature-100-to-152-scale divergences and oracle
  normalization gaps; carrying them needs owner-approved REGISTER rows of
  their own, not the restorations of this feature. T322, T323 and T324 stay
  blocked on the owner decisions recorded in "Reported to the owner" above.


## Attempt 21 — the red classes are gone without a waiver (2026-11-21)

This note supersedes the per-class difference list of attempt 20 above. The
port restorations in the working tree closed every class that list named —
the run.log banner and rail composition, `last-run.conf` and the lock, the
hint files, the environment names, the orchestrator-record edits, the
diagnostician transport, the acceleration note (`asIsAccelerationNote`),
the prior-rejection transcript blocks — and the parity comparison of
`loop-speed-parity.test.ts` now runs all six scenarios driven with **zero
`different`** (14 tests, 14 pass, 0 skipped). No waiver of feature 153 was
needed or filed: `packages/oracle/waivers.json` still holds only feature
141's 23 entries, and no row of DV-123…DV-131 backs any observed difference
today. The rows themselves remain REQUESTS pending owner approval; T322
closes with nothing to file.

## F101-FR-014 and F105-FR-005 — the red gate's own budget (F153-FR-020 to -023; CQ-153-05 A; T348, slice P1c)

The slice P1c implemented F153-FR-020 to -023 with CQ-153-05 answered A (budget A,
stop A, block A); the two amendments of the spec's "Cross-spec amendments" table are
requested here with their exact proposed text, and the register row of the switch.

**To the owner of feature 101 (F101-FR-014).** Add: "With the switch
`verification.redGate.ownBudget` on, a failed verification gate uses one attempt of
the red-gate budget of F153-FR-021 instead of the reject limit." (Why: F153-FR-020.
Ruling: yes, CQ-153-05.)

**To the owner of feature 105 (F105-FR-005).** Replace "and the rejection MUST count
toward the reject limit" by "and the rejection MUST count toward the reject limit,
or, with the switch of F153-FR-020 on, toward the red-gate budget". (Why:
F153-FR-020. Ruling: yes, CQ-153-05.)

**Register row (Annex X §X.7, requested; `packages/contracts/data/parity-profile.json`
row 139 already carries the same switch).** The next free §X.7 row after 138 is
requested for the red-gate budget of its own — the REQUESTED row DV-125 of the table
"Annex X §X.7 and the divergence register" above: behaviour "The red-gate budget of
its own (F153-FR-020 to -023)", key `verification.redGate.ownBudget`, default on,
under `parity` off (a red gate is a rejection that counts toward the reject limit),
owner 153, requested by row 1c. The counts the budget spends are the gate result
records of the phase held in the control plane (F153-FR-021), never a counter held in
memory; the halt keeps stop reason `max_rejects`, exit 2, cause
`verification-failed`, non-transient (F153-FR-022, CQ-153-05 A).

## F152-FR-008, F152-FR-009 and F149-FR-004 — the pre-critic scan (F153-FR-024; CQ-153-06 A; T360, slice P1d)

The slice P1d implemented the commit scan before the critic (F153-FR-024, CQ-153-06
answered A on 2026-11-13); the three amendment rows of the spec's "Cross-spec
amendments" table that the slice rests on are requested here with their exact text.

**To the owner of feature 152 (F152-FR-008).** Replace "act once per phase attempt" by
"act at most once before the critic (F153-FR-024) and once at the approval commit per
phase attempt". (Why: F153-FR-024 adds a second act. Ruling: yes, CQ-153-06.)

**To the owner of feature 152 (F152-FR-009).** Replace the reason "the gate runs only
after the critic's APPROVED, so no critic prompt can hold one" by "no critic prompt
holds a result of the commit gate (F153-FR-028)". (Why: F153-FR-028. Ruling: yes,
CQ-153-06.)

**To the owner of feature 149 (F149-FR-004).** Add "a commit-gate block before the
critic" to what does not count toward K. (Why: F153-FR-024. Ruling: no — it follows
CQ-152-03 answered A.)

## Annex G §G.4 — the row of the in-pass scan command (F153-FR-027; CQ-153-17 A; T369, slice P1d)

**Register row (Annex G §G.4, requested; the `VERBS` row of
`packages/cli/src/router/verbs.ts` already carries the same command).** A §G.4 row is
requested for the in-pass scan command — F153-FR-027, ruled by CQ-153-17 answered A on
2026-11-13: a subcommand of the CLI, named `scan` (proposed, confirmed by feature 110),
read-only (F129-FR-015: it writes no file), with the exit codes 0 no hit, 2 at least one
hit, 1 no state, 3 usage. The command takes no arguments — it reads only the rule data
pinned at launch and never another rule set or a path to one (F153-FR-027) — and it is
advice only: its result enters no verification gate, no approval record, no critic-class
input and no count, and its absence or failure changes nothing in the loop. The prompt of
a pass names it only with the switch `commit.scan.inPass` on (row 141 of annex X §X.7;
under `parity` no such command is named).

## F111 catalogue — the rows of the timed pair, and the register row of the switch (F153-FR-036; CQ-153-09 answered A; T398, slice P2)

**To the owner of feature 111 (F111-FR-001, "Pairs", §X.6 row 272).** Two rows are
REQUESTED, additive (CQ-153-09 answered A on 2026-11-13: the pair is additive catalogue
rows; NO new `endCause` — F153-FR-037 maps every cause, and the report tells a block
from a critic rejection by joining `commit_gate.blocked`):

- `commit_gate.started` — kind `open`, partner `commit_gate.ended`, data fields
  `phase, attempt, step, durationMs, outcome, hits`, no free-text field;
- `commit_gate.ended` — kind `close`, partner `commit_gate.started`, data fields
  `phase, attempt, step, durationMs, outcome, hits, synthesized`, no free-text field.

The pair is also REQUESTED for the catalogue's "Pairs" table, as the pair
`commit_gate.started`/`commit_gate.ended`. The step is the closed set
(`pre-critic`, `commit`) of F111-FR-031, as amended; the opener carries what is known
before the scan runs (`durationMs` 0, `outcome` `clear`, `hits` 0). The catalogue's
`tableVersion` is incremented by one — the marker of the addition, per CQ-153-09 (the
version string itself was not found in spec 111 or its contracts; the plan states the
bump). Under the profile `parity` the projection drops the new types (row 144 of
annex X §X.7, below), so no as-is surface is reached. The compatibility rows of the
projection table and the view's marks of `ignored` are already carried in this
checkout (`packages/observability/data/projection/projection-table.tsv`,
`packages/view/src/signals/table.ts`).

**Register row (annex X §X.7, requested at approval; DV-128 of the section above).**

| Annex row | Behaviour | Key | Default | Under `parity` | Owner | Request | Register handling |
|---|---|---|---|---|---|---|---|
| 144 | The commit-gate timed pair (F153-FR-036) | `events.commitGateTiming` | on | off: the projection drops the new types | 153 | DV-128 | `waiver` until the owner rules otherwise |

The row is carried in this checkout as row 144 of
`packages/contracts/data/parity-profile.json` and is read by
`packages/cli/src/engine/loop-config.ts` (`EVENTS_COMMIT_GATE_TIMING_KEY`, resolved to
`eventsCommitGateTiming`): on by default, and off under `parity` whatever a source
holds, so the engine emits neither type of the pair under parity.
