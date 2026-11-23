# Specification Analysis Report: Verification (feature 105)

Date: 2026-09-29, after the split. Artifacts: `spec.md`, `plan.md`, `tasks.md`, with
`research.md`, `data-model.md`, `quickstart.md` and `contracts/`. Constitution v3.0.0. This
report replaces the report of before the split. Two runs: the first found the rows marked
"repaired".

## Findings

| ID | Category | Severity | Location(s) | Summary | State |
|----|----------|----------|-------------|---------|-------|
| U1 | Underspecification | MEDIUM | spec.md F105-FR-016, F105-FR-020 | The manifest takes declared steps, reads, writes and resources from the sources, but the fields of a declaration did not name them | Repaired: F105-FR-016 names them |
| F1 | Inconsistency | MEDIUM | spec.md F105-FR-032; plan.md gate III | After the split no requirement said what the verification gate does with a condition on a result; the plan said a condition fails the gate, which ruling 41 does not allow | Repaired: the gate decides on exit results and carries the condition; reading CQ-179 |
| U2 | Underspecification | MEDIUM | spec.md F105-FR-020 | When a manifest is written with the loop strategy `classic` outside the `parity` profile rests on a reading (CQ-153) | Open: in the queue |
| U3 | Underspecification | LOW | spec.md F105-FR-039 | The spelling of the sub-commands rests on a reading (CQ-155) | Open: in the queue |
| G1 | Ids | LOW | spec.md | The sequence of requirement ids has gaps (026 to 031, 038, 040, 041, 044, 046 to 052) and of success criteria (003, 007, 008) | Intended: the table "Requirements moved to 148-check-runner" explains them |
| F2 | Terminology | LOW | spec.md F105-FR-006, F105-FR-037 | The word "evidence" appears inside as-is literals; the prose uses "result record of the verification gate" | Accepted: literals are bound by parity |
| C1 | Coverage | LOW | tasks.md T006 | The characterization test of the extracted Lisa parts names a requirement and no as-is id | Accepted |
| T1 | Traceability | LOW | `check-traceability.py` | Until the rows are moved, the check reports 4 kept items of C-080 as missing from this feature | Expected (`STAGE-B-SPLIT-PROMPT.md` step 7) |

No finding is CRITICAL or HIGH. No requirement conflicts with a principle of the constitution.
No file of this feature cites a requirement of `148-check-runner` outside the table of moved ids;
what left is reached through feature 100, annex C §C.8.

## Coverage Summary

| Requirement keys | Has task? | Notes |
|---|---|---|
| The 35 requirements F105-FR-001 to F105-FR-045 that stayed | Yes, each | One implementation task each, and one test task per test name |
| F105-FR-053 | Yes | The conformance suite of EP-07, the sample source, CT-105-305 |
| F105-SC-001, F105-SC-002 | Yes | CT-105-301 |
| F105-SC-004, F105-SC-005 | Yes | PT-105-028FR020-suite |
| F105-SC-006 | Yes | CT-105-302 |
| F105-SC-009 | Yes | CT-105-305 |
| F105-SC-010 | Yes | CT-105-304 |

As-is coverage: 159 behaviour items and 2 kept as-is requirements are each named by the origin
of exactly one requirement and by a `proves:`. Over both parts of the split: 165 as-is ids, each
in exactly one part, 0 problems.

## Constitution Alignment Issues

None. The twenty gates of `plan.md` pass; gate XX is not applicable after the split.

## Unmapped Tasks

Setup, foundational and measurement tasks map to the plan and to no single requirement.

## Metrics

| Metric | Value |
|---|---|
| Functional requirements | 36 |
| Success criteria | 7 |
| Tasks | 144 |
| Requirements with at least one task | 100 % |
| Ambiguity count | 0 |
| Duplication count | 0 |
| Critical issues | 0 |
| Open readings | 3 (CQ-153, CQ-155, CQ-179) |

## Next Actions

| # | Action | Who |
|---|---|---|
| 1 | Move the rows of B-1120, B-1121, B-1122 and B-1124 to `148-check-runner` | Orchestrator |
| 2 | Add the six requested rows of the `parity` profile and the seven new closed sets to feature 100 | Orchestrator; feature 100; feature 110 for the spelling |
| 3 | Answer CQ-153, CQ-155 and CQ-179 | Owner, in the clarification round |

## After the cross-feature review

Date: 2026-09-30. Source: `docs/ecosystem/reviews/REPAIR-WORKLIST.md`, section "Feature 105", and
the table "What the other features must follow" of `specs/100-specstride/repair-report.md`. The
sections above are the record of 2026-09-29 and were not rewritten. Details: `repair-report.md`.

### What changed

| Subject | Change | Files |
|---|---|---|
| F105-FR-010 (W-105-01) | The verification mode is read from the run snapshot, key `verification.mode`. Nothing is written to the run record | `spec.md`, `plan.md`, `tasks.md` (T034, T050), `data-model.md`, `quickstart.md`, `research.md` D-19 |
| Detached staged commands (W-105-02) | Started by the process primitive of the kernel; `node:child_process` left the plan | `spec.md` F105-FR-035, `plan.md`, `tasks.md` T129, `research.md` D-17 |
| Reads and writes (W-105-03, CQ-190) | Never from the verification-commands document; undeclared means serial | `spec.md` F105-FR-016, F105-FR-020, `plan.md` rows III and XX, `tasks.md` T068, T145, T148, `data-model.md`, `research.md` D-18 |
| Ingress (W-X-23) | New requirement F105-FR-054, test CT-105-154 | `spec.md`, `plan.md`, `tasks.md` T146, T147, `data-model.md` |
| Owners, rows, terms | Owner 116; rows 123, 124, 126 of §X.7; rows 228 to 234 of §X.6; `ep:` lines for EP-05 and EP-08; table "Threats"; "verification gate" in full; folders `EP-07` | `spec.md`, `plan.md`, `tasks.md`, `contracts/closed-sets.json`, `contracts/parity-rows.json`, `contracts/README.md` |

### Consistency pass over the places touched

| Check | Result |
|---|---|
| Requirement without a task | None. F105-FR-054 has T146 (test) and T147; the new test CT-105-116 of F105-FR-016 has T145; F105-FR-010 keeps T034 and T050 |
| Task without a requirement | None among T145 to T148 |
| Test names of `spec.md` and `tasks.md` | CT-105-116 and CT-105-154 are in both |
| Counts | 37 functional requirements and 7 success criteria in `spec.md` and `plan.md`; 148 tasks |
| Terms and values | `verification.mode`, `run:<runId>:snapshot`, `configuration.scopes` and the row numbers are the same in `spec.md`, `plan.md`, `tasks.md`, `data-model.md` and `contracts/` |
| Constitution Check | Every row passes against the text. No NON-NEGOTIABLE principle is marked as passed against it. Complexity Tracking stays empty |
| Records left as written | The findings U1 and the "Next Actions" above, and the note on 53 requirements in `checklists/requirements.md`, are records of 2026-09-29 (W-X-34: no change) |

### Metrics

| Metric | Value |
|---|---|
| Functional requirements | 37 |
| Success criteria | 7 |
| Tasks | 148 |
| Open readings | 4 (CQ-153, CQ-155, CQ-179, CQ-190) |

## Second analyze run

Dated 2026-09-30, after the cross-feature review, the constitution patch v3.0.1 and the closure of the clarification round. Artifacts read: `spec.md`, `plan.md`, `tasks.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/`, `repair-report.md`, the constitution v3.0.1, the annexes A, B, C, D, E, G and X of feature 100 with their data files (closed sets, parity profile, threat model, layout, package graph, normalization), the fixture families of feature 141, the queue `docs/ecosystem/CLARIFY-QUEUE.md`, the divergence register, the behaviour inventory R18, and the baseline code at `9cab15d` (`lib/verification_plan.py`, `lib/verification_failure_digest.py`, `orchestrator.sh`, `specstride-lib.sh`), read with `git -C /root/specstride show`. Coverage before the run: 37 FR, 7 SC, 148 tasks, 100 per cent; every test name of the spec had a task (88 of 88); 159 of 159 behaviour items and both kept as-is requirements placed and proved. No CRITICAL finding; three HIGH. 25 of the 27 findings were repaired on the same day at the owner's instruction ("propose and resolve any issue automatically with the best suggestion"); two are recorded and not changed. The repair record of the spec is the section "Repairs after the analyze run of 2026-09-30".

| ID | Category | Severity | Location(s) | Summary | State |
|----|----------|----------|-------------|---------|-------|
| I1 | Inconsistency (Principle XVIII) | HIGH | F105-FR-011, F105-FR-012 vs annex X §X.5 | `contentHash` was "the canonical record hash", which annex X §X.5 defines with a final line end. The baseline hashes the text without one (`lib/verification_plan.py:79-88`, `:1050`; B-1108, B-1095). The plan hash, the source hash and the fingerprint would all differ from the baseline, and the oracle compares hashes over fixture content unchanged: a difference found as a test failure | **Repaired**: the text form of the baseline is stated, hashed with "content hash of a text" of the hasher; the canonical record hash stays for the manifest. The projection `tasks-v2` is named and built from the canonical spec model |
| I2 | Inconsistency | HIGH | F105-FR-003, user story 1 scenario 3 vs F105-FR-034 | The mode `plan` "executes no command" (B-1150), yet the commands staged before "MUST run once before each phase attempt" in the modes `plan` and `required` (B-0375). The baseline runs the step in both modes (`specstride-lib.sh:571`) | **Repaired**: in the mode `plan` the verification gate executes no command; the staged commands still run, for information |
| I3 | Inconsistency (Principle II) | HIGH | F105-FR-033 vs F100-FR-232 | Feature 100 says "with a loop layer engaged, the verification gate MUST reuse nothing". No feature stated it: the owner of the check runner names the reuse rules as this feature's, and F105-FR-033 held the as-is rules only. The default loop strategy is `micro` | **Repaired**: F105-FR-033 forbids the take-over in a phase attempt with a declared unit of work; the engine hands the fact in; new test CT-105-133 and task T149 |
| U1 | Underspecification | MEDIUM | F105-FR-016, F105-FR-033, F105-FR-034 | The stage `pre` was a member of the closed set and had no meaning: staged commands are `prestage` or `both`, reuse is for `prestage`. At the baseline `pre` is a spelling of `prestage` (`lib/verification_plan.py:51-57`) | **Repaired**: stored as `prestage`; closed set, data model and contract file say so |
| U2 | Underspecification | MEDIUM | F105-FR-020 vs annex D §D.8, F115-FR-013 | The manifest needs `entries[].inner` (required) and the loop layer reads it; no feature said who sets it. Which commands are the entries of a manifest was not said either, while the verification gate is cumulative | **Repaired**: every entry is inner (brief 115: "the inner set is the manifest"); the entries are the commands of the phase itself, so an empty phase stays empty (Principle XIV, F105-SC-001); the cumulative verification gate reads the manifests of the phases it covers; `pin`, `searchPath` and the hash are named |
| U3 | Underspecification | MEDIUM | F105-FR-005, F105-FR-008 | Nothing said what the engine does when the verification gate cannot run (a plan refused at load, code 3). The baseline treats every exit other than 0 as the same rejection and puts the code into the event (`orchestrator.sh:1988-1991`, `:979`; B-0320) | **Repaired** |
| U4 | Underspecification | MEDIUM | F105-FR-039, F105-FR-025 | `prestage-report` printed "the block for a prompt"; no requirement said what the block holds or that the phase context ends with it (baseline: `lib/verification_plan.py:1235-1242`, `:2032-2119`; B-1039, B-1043) | **Repaired**: block described; phase context ends with it where a record exists; three literals added |
| U5 | Underspecification | MEDIUM | F105-FR-010 vs F105-FR-002; T050 | The snapshot must hold "the mode in force", but the silent change `off` → `plan` was not placed before the write of the snapshot. T050 implemented "the reading for the fallback of a loop layer", which is the loop layer's | **Repaired**: the change is applied when the mode is resolved, before the snapshot is written; T050 and T034 reworded |
| U6 | Underspecification | MEDIUM | F105-FR-015 vs F105-FR-019 | A "blocker" of a plan source and an "ambiguity" of the plan were not tied together, and the effect of a blocker in the mode `plan` was not said; user story 2 scenario 2 cites both | **Repaired**: a blocker is an entry of `ambiguities`, its command does not enter the plan |
| U7 | Underspecification | MEDIUM | F105-FR-042, edge cases, quickstart row 7 | Under the `parity` profile only the check at critic start was stated. The baseline hands the spec to every call that loads the plan, so in the mode `required` a stale plan is met at the verification gate and rejects the phase attempt before any critic call; the phase context and the staged step fail silently. Outside the profile a check at the gate would reject every phase attempt of a changed spec, against ruling K3 | **Repaired**: both sides stated; CT-105-142 and T102 extended |
| I4 | Inconsistency | MEDIUM | F105-FR-054 vs F105-FR-035 | The log of a detached command was to be written only after the ingress, but the process may outlive the engine that would stand between it and its log (B-1127). F105-FR-054 cited no register row for the redaction of command output and no ingress class | **Repaired**: the process writes its raw log through the streams the engine gave it, in the control plane; what is read from it passes the ingress; DV-095, class `check-output`, fail-closed rule |
| I5 | Inconsistency | MEDIUM | `assumption:` lines; Assumptions; repair-report items 1 to 3 | CQ-153, CQ-155, CQ-179 and CQ-190 were closed in the queue on 2026-09-30; N-105-1 and N-105-2 became CQ-215 and CQ-216 and were closed; feature 100 and feature 107 made the three changes the repair report asked (annex C §C.9, F100-FR-234, F107-FR-008). The spec still called the readings open | **Repaired**: the table records each closure |
| I6 | Inconsistency | MEDIUM | F105-FR-020 vs "Rows of the `parity` profile", `contracts/parity-rows.json`, plan, T009 | F105-FR-020 reads the switches of rows 6, 7 and 31; the tables said those rows "went" and listed three rows read; T009 did not register row 1 | **Repaired**: six rows read, three of them read only |
| I7 | Inconsistency (tasks) | MEDIUM | T012/T015, T013/T016 | Two tasks marked [P] wrote the same file, twice; "every test task marked [P] writes a file of its own" was false | **Repaired**: T015 and T016 are not marked and add to the files of T012 and T013 |
| I8 | Inconsistency (tasks) | MEDIUM | T145 to T148 | They stood in phase 8 with a note that they belong to phases 3 and 4; a run that works phase by phase would write the tests after the code they must fail against | **Repaired**: moved into their phases, ids kept |
| K1 | Constitution | LOW | plan, Constitution Check | Answered against v3.0.0 with a note on v3.0.1 | **Repaired**: read again against v3.0.1; rows I, II, IV, XI and XVIII carry the new reasons; result unchanged |
| L1 | Underspecification | LOW | F105-FR-037, F105-FR-042 | "The as-is variables" were not named; annex X §X.8 has no alias row for them | **Repaired** in the spec; the rows are feature 100's (item 2 below) |
| L2 | Coverage | LOW | `contracts/as-is-literals.json`, `contracts/README.md` | The spec refers to literals the file did not hold (the message for a link, the inherited heading, the note of two lines, the second ambiguity, the body of the feedback); the list of requirements in the README was out of date | **Repaired**: 16 literals added from the baseline; the file says it is not every line and names the reference |
| L3 | Underspecification | LOW | F105-FR-009 | The record had no place for `reused`, `reusedFrom` and the conditions that F105-FR-032 and F105-FR-033 put into it | **Repaired** |
| L4 | Underspecification | LOW | F105-FR-033 | With one record per phase attempt, where the verification gate looks for a result under `per-phase` and `per-run` was not said | **Repaired** |
| L5 | Ambiguity | LOW | F105-FR-053 vs F105-FR-015 | A failing source "never produces an exit code", yet it can lead to a refused launch | **Repaired**: "of its own" (F100-FR-019); the refusal is the launch check of the mode |
| L6 | Inconsistency | LOW | F105-FR-015 vs F105-FR-017 | "Build, type check, lint and test" against the as-is scripts `test`, `build`, `lint`, `format:check` | **Repaired**: F105-FR-017 is the list of Wave 1; a further entry point is a row of the data |
| L7 | Coverage (tasks) | LOW | T004, T141, T007; Notes of the spec | T004 and T141 compare with the `specs/` tree, which left the git index on 2026-09-30; T141 proved F105-FR-053 for a test of F105-SC-010; T007 named one of three extracted parts; six test names of tasks were not explained in the spec | **Repaired**: a skip with its reason where the tree is absent; `proves:` lines; a note in the spec |
| L8 | Inconsistency | LOW | quickstart; plan row XVIII; plan documentation tree | Rows numbered 6, 8, 9, 7; seven of fifteen cited register rows listed; `repair-report.md` missing from the tree | **Repaired**; two quickstart rows added for the new rules |
| L9 | Ambiguity | LOW | F105-FR-045 | "A verification command in project configuration": the key that names the document is a widening key for the owner of the keys | **Repaired** |
| D1 | Duplication | LOW | F105-FR-043 vs F105-FR-012 | Both say the plan stays bound to the hashes of its sources | Not changed: F105-FR-043 is the scope statement for both sides of the profile and carries its own test |
| L10 | Tooling | LOW | `docs/ecosystem/check-traceability.py` | The check fails with 2 errors: the register holds DV-118 and DV-119, beyond the 117 rows it expects. Neither is of this feature (159 of 159 items) | Not changed: outside this directory; item 7 below |

### Coverage after the repairs

| Requirement keys | Has task? | Task ids | Notes |
|---|---|---|---|
| F105-FR-001 to F105-FR-010 | Yes, each | T011 to T034, T042 to T050, T106 to T112 | One implementation task each; one test task per test name |
| F105-FR-011 to F105-FR-025 | Yes, each | T055 to T079, T087 to T101, T105, T145, T148 | F105-FR-016 and F105-FR-020 have two implementation tasks each |
| F105-FR-032 to F105-FR-037 | Yes, each | T035 to T041, T051, T052, T113 to T130, T149 | CT-105-133 is new (T149) |
| F105-FR-039 | Yes | T131 to T136 | — |
| F105-FR-042, F105-FR-043, F105-FR-045 | Yes, each | T080 to T086, T102 to T104 | — |
| F105-FR-053, F105-FR-054 | Yes, each | T053, T054, T140; T146, T147 | The conformance suite and the sample are the delivery of F105-FR-053 |
| F105-SC-001, F105-SC-002 | Yes | T137 | CT-105-301 |
| F105-SC-004, F105-SC-005 | Yes | T139 | PT-105-028FR020-suite |
| F105-SC-006 | Yes | T138 | CT-105-302 |
| F105-SC-009 | Yes | T140 | CT-105-305 |
| F105-SC-010 | Yes | T141 | CT-105-304 |

Constitution alignment: no issue left. The three findings that touched a non-negotiable principle (I1 and I2: XVIII; I3: II) are repaired in the specification; none is justified in Complexity Tracking, which stays empty. All twenty principles are answered against v3.0.1.

Unmapped tasks: T001 to T006, T008 to T010 (setup and foundation), T142 to T144 (macOS run, measurement, quickstart). They map to the plan and to no single requirement.

### Metrics after the repairs

| Metric | Value |
|---|---|
| Functional requirements | 37 (none added, none renumbered) |
| Success criteria | 7 |
| Tasks | 149 (T149 added; T145 to T148 moved; 23 changed in place) |
| Test names of the spec, each with a task | 89 of 89 (CT-105-133 added) |
| Requirements with at least one task | 100 % |
| Behaviour items and kept as-is requirements placed and proved | 159 of 159; 2 of 2 |
| Ambiguity count | 2 (L5, L9), repaired |
| Duplication count | 1 (D1), kept |
| Critical issues | 0 |
| Open readings | 0 (six closed on 2026-09-30) |

### Readings this run chose

Each is a decision of `research.md` (D-20 to D-25) and has another answer that the owner may prefer.

| # | Reading | Other answer |
|---|---|---|
| 1 | The entries of a manifest are the commands of the phase itself, and every entry is inner (D-23) | The cumulative commands of the verification gate; or a field that declares which commands are inner |
| 2 | The raw log of a detached command is written by the process, and the ingress stands where the log is read (D-24) | The owner of the check runner gains a start without an end at the time limit, and captures the output through the ingress |
| 3 | Outside the `parity` profile the verification gate makes no staleness check (F105-FR-042) | The verification gate checks it and rejects, as the baseline does |
| 4 | A blocker of a plan source is recorded among the ambiguities and its command stays out of the plan (F105-FR-015) | A blocker refuses the launch in every mode |

### What another feature or the orchestrator must do (after this run)

1. Feature 100, annex X §X.5, and feature 104: the "canonical record hash" ends its text with a line end; the verification plan of the Specstride baseline hashes its text without one. This feature now uses "content hash of a text" over the text form of the baseline (I1). The annex should say which hashes keep that form, and every other feature that ports a hash of the Specstride baseline over a record should be checked for the same difference.
2. Feature 100, annex X §X.8 (alias table), and feature 110 (key table): rows for `SPECSTRIDE_VERIFY_TAIL_LINES` and `SPECSTRIDE_VERIFY_TAIL_ERR_LINES` (keys `verification.summary.tailLines`, `verification.summary.tailErrLines`), and a place for `SPECSTRIDE_VERIFICATION_PLAN`, the default of the plan argument of a critic call (L1).
3. Feature 100, annex C §C.8: the owner of the check runner promises that the environment of a command can be obtained through the interface of EP-05 without a start; the annex names `pin`, `start`, `poll`, `result` and `cancel` only. F105-FR-035 takes the environment from there.
4. Feature 100, F100-FR-234: the process primitive must start a process with given files as its two output streams, and something must write the status record of a detached command when the engine that started it has ended. The baseline starts a wrapper in the same session (`_DETACHED_SHIM`). The primitive says neither (`research.md`, "What is `unverified`").
5. Feature 100, the interface types of the call of the verification gate: the engine hands in whether a loop layer is engaged in the phase attempt (F105-FR-033; F100-FR-232, F100-FR-118).
6. Feature 100, annex D §D.8: the row `entries[].inner` should name who sets it (this feature: true for every entry) and the row `entries` that the commands are those of the phase itself (U2).
7. Orchestrator: `docs/ecosystem/check-traceability.py` expects 117 register rows; the register has 119 since DV-118 and DV-119 of feature 104. The check fails on that count alone (L10).
8. The items 1 to 3 of `repair-report.md`, "What another feature or the orchestrator must do", are done: annex C §C.9 carries the sentence on CQ-190, F107-FR-008 lost its clause, and F100-FR-234 names the session and the closed input.

### Verification of the repairs

| Check | Result |
|---|---|
| Counts | 37 FR and 7 SC in `spec.md` and `plan.md`; 149 tasks, no id twice |
| Test names | 89 in the spec, each with a task; the six names of tasks outside requirements are explained in the Notes of the spec |
| As-is coverage | 161 origin ids, each in exactly one requirement and in a `proves:` |
| Fixture families of tasks against `traceability-items.tsv` | Equal for every parity test |
| Tasks marked [P] that share a file | None |
| The four JSON files of `contracts/` | Parse |
| `python3 docs/ecosystem/check-traceability.py --require-all` | Feature 105: 159 of 159, no row named. The two errors are the count of L10 |
| Terms | No bare "gate" in the text this run added; no requirement of another tier 2 feature is cited |

## Proposed upstream fixes (second round, 2026-09-30)

Written at the owner's ruling of 2026-09-30 (late evening): the items of "What another feature or the orchestrator must do (after this run)" go into feature 100, and into the other features named, before the run of feature 100 resumes. Each proposal names the target, the text to paste, and why. Every text was checked against the target as it stands tonight. Feature 105 is correct with and without these proposals: its requirements already say what the proposals make feature 100 say. No proposal adds a closed-set row, a logical name or a register row.

Items already settled, not proposed again:

- Item 3, an operation of EP-05 that returns the environment of a command without a start: settled, the operation `environment` was accepted from feature 148.
- The register row for `schema` and `schema_version` of the verification-commands document: settled, committed as DV-120.
- Item 7, the size of the register in `docs/ecosystem/check-traceability.py`: settled, fixed.
- Item 8, the items 1 to 3 of `repair-report.md`: done before this round (annex C §C.9, F107-FR-008, F100-FR-234); nothing to propose.

### P-1. The text form of a record hash (item 1)

**Target 1**: `specs/100-specstride/annexes/X-cross-layer.md`, §X.5 "Canonical hasher", the table of operations.

Replace the row

```markdown
| Content hash | The bytes of a file | A SHA-256 hash |
```

with

```markdown
| Content hash | The bytes of a file, or a text taken as UTF-8 | A SHA-256 hash |
| Canonical record text | A record | The record as text with sorted keys, compact separators, non-ASCII characters kept, and no final line end. It is the input of the canonical record hash, and the form in which the Specstride baseline hashes the records of its verification plan |
```

and replace the row

```markdown
| Canonical record hash | A record | A SHA-256 hash over the record with sorted keys, compact separators and a final line end |
```

with

```markdown
| Canonical record hash | A record | The content hash of the canonical record text with one line end added |
```

**Target 2**: the same file, F100-FR-207. After the sentence "Hashes over fixture content MUST equal the baseline's." insert:

```markdown
A feature that ports a hash that a baseline takes over a record MUST state which form the baseline hashes: the canonical record text as it is (the content hash of the canonical record text; for example the verification plan, its source projection, its ids and the project fingerprint of the Specstride baseline, F105-FR-011, F105-FR-012), or the text with a final line end (the canonical record hash; for example the launch contract, F107-FR-019). No feature MUST build a record text of its own.
```

**Target 3**: `specs/104-spec-input/spec.md`, F104-FR-021. Replace "the content hash of the bytes of a file, and of a text; the task-list hash that ignores checkboxes (F104-FR-022); the canonical record hash;" with:

```markdown
the content hash of the bytes of a file, and of a text; the task-list hash that ignores checkboxes (F104-FR-022); the canonical record text (sorted keys, compact separators, non-ASCII characters kept, no final line end) and the canonical record hash, which is the content hash of that text with one line end added;
```

Why: the baseline hashes its verification plan without a final line end (`lib/verification_plan.py:79-88`, `:1050` at `9cab15d`), so the only record hash of annex X would make every plan hash differ on the fixtures (I1); one named text form lets 105 and every later port use the hasher without a text of its own.

### P-2. The as-is variables of the failure summary and of the plan argument (item 2)

**Target 1**: `specs/100-specstride/annexes/X-cross-layer.md`, §X.8, "Environment alias table". After the row that begins `` | `SPECSTRIDE_VERIFICATION`, `SPECSTRIDE_TEST_PLAN` `` insert:

```markdown
| `SPECSTRIDE_VERIFY_TAIL_LINES`, `SPECSTRIDE_VERIFY_TAIL_ERR_LINES` | `verification.summary.tailLines`, `verification.summary.tailErrLines` |
| `SPECSTRIDE_VERIFICATION_PLAN` | No key: the as-is default of the plan argument of a critic call. The engine hands the critic call the verification plan of the run by logical name (`run:<runId>:verification:plan`); under the `parity` profile a set variable names the plan as at the baseline, and an empty value means no plan (F105-FR-042) |
```

**Target 2**: `specs/110-config-and-terms/spec.md`, §K.8 "Environment aliases". After the row `` | `SPECSTRIDE_FAILURE_LEDGER`, … `` insert:

```markdown
| `SPECSTRIDE_VERIFY_TAIL_LINES`, `SPECSTRIDE_VERIFY_TAIL_ERR_LINES` | `verification.summary.tailLines`, `verification.summary.tailErrLines` (B-1028, B-1029; row 126 of annex X §X.7) |
```

and in §K.6b replace the two rows

```markdown
| `verification.summary.tailLines` | whole number of lines | 80 | F E P U | - | t | 105. Row 126; `80` |
| `verification.summary.tailErrLines` | whole number of lines | 40 | F E P U | - | t | 105. Row 126; `40` |
```

with

```markdown
| `verification.summary.tailLines` | whole number of lines | 80 | F E P U | - | t | 105. Row 126; `80`. Alias `SPECSTRIDE_VERIFY_TAIL_LINES` |
| `verification.summary.tailErrLines` | whole number of lines | 40 | F E P U | - | t | 105. Row 126; `40`. Alias `SPECSTRIDE_VERIFY_TAIL_ERR_LINES` |
```

Why: F105-FR-037 and F105-FR-042 read these variables as aliases (B-1028, B-1029, B-0849), and the oracle drives both sides with the same variables only through the alias table (F100-FR-214, F100-FR-215).

### P-3. A detached process with its output files and a status record (item 4)

**Target**: `specs/100-specstride/annexes/A-foundations.md`, F100-FR-234. Replace "a process primitive with the operations start a process in a group and a session of its own, with standard input closed," with:

```markdown
a process primitive with the operations start a process in a group and a session of its own, with standard input closed and, where the caller names them, two files as its standard output and standard error; start such a process detached with a status record, in which the kernel starts a waiter of its own in the new session, with no shell, and the waiter starts the command, waits for its end and writes its exit code or signal, its duration and its times of start and end atomically to a file the caller names, so that the record exists when the process that started it has ended (the baseline does the same with a wrapper, B-1127, B-1070);
```

Why: a detached command staged before must outlive the engine that started it, write its own log, and leave an exit code that a later engine reads (F105-FR-035, D-24 of `research.md`); the primitive offered neither the output files nor the record, and feature 105 may start no process of its own.

### P-4. The call of the verification gate from the engine (item 5)

**Target 1**: `specs/100-specstride/annexes/C-ports-and-edges.md`, F100-FR-232. Replace the whole requirement text with:

```markdown
- **F100-FR-232**: A command that is staged before the verification gate MAY be reused by the verification gate only under the reuse policy that its declaration names (`per-attempt`, `per-phase`, `per-run`) and only while the tree is provably the tree of the staged run: the same revision, and a clean working tree in the record of the staged run and at the verification gate, as at the baseline (B-1128). The result of a staged command MUST be kept under `attempt:<N>:<k>:<n>:prestage`. With a loop layer engaged in the phase attempt, that is, with a unit of work declared in it (annex D, F100-FR-118), the verification gate MUST reuse nothing. The engine MUST hand this fact to the verification gate as an input of its call; the verification gate reads no record of a loop layer. The rules are stated by the owner of the verification gate (F105-FR-033).
```

**Target 2**: `specs/100-specstride/annexes/E-engine.md`, §E.4, table "Verification gate (result record inside the engine; a process as the public command `verify`)". After the sentence "The failure summary of verification: 0, and 2 on wrong usage." add:

```markdown
Inside the engine every `exit_code` of the verification gate other than 0 is a failed verification gate: the phase attempt is a rejection with the result code 10 of the critic's table, the critic is not called, and the rejection counts toward the reject limit; the event of the failure carries the code of the verification gate itself, 3 or 10 (F105-FR-005, as at the baseline, B-0320). The code 11 is never a result of the verification gate of a phase attempt; it belongs to the step of commands staged before, for information.
```

Why: F100-FR-232 named "the fingerprint of the tree" where the baseline compares the revision and a clean tree, and did not say how the verification gate learns that a layer is engaged; §E.4 did not say what a code 3 at the verification gate does to the phase attempt (I3, U3 of this report).

### P-5. Who sets the entries of a check manifest and their flag `inner` (item 6)

**Target**: `specs/100-specstride/annexes/D-pass-loop.md`, §D.8 "Check manifest", the table of fields. Replace the rows

```markdown
| `entries` | The commands of the phase | List of records | Yes (may be empty) |
```

and

```markdown
| `entries[].inner` | Whether the command belongs to the inner check set | Truth value | Yes |
```

with

```markdown
| `entries` | The commands of the phase itself, in the order of the verification plan; the commands of earlier phases are in their own manifests, and the cumulative verification gate takes its commands from the manifests of the phases it covers (F105-FR-020) | List of records | Yes (may be empty) |
```

and

```markdown
| `entries[].inner` | Whether the command belongs to the inner check set. The writer sets it true for every entry: the inner check set is the manifest, and only the runtime takes a command out of it during a phase attempt, with a reason (F105-FR-020; F115-FR-013) | Truth value | Yes |
```

Why: the field is required and the loop layer reads it (F115-FR-013), but no feature set it; and an empty phase must keep an empty manifest (Principle XIV, F105-SC-001), which a cumulative list of entries would break (U2).

### Readings of this report that the proposals settle

| Reading of "Readings this run chose" | Settled by |
|---|---|
| 1, the entries of a manifest | P-5 |
| 2, the log of a detached command | P-3 |
| 3 and 4 | Inside feature 105 only; no upstream text needed |
