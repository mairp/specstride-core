# Follow-up report: feature 141 after the fan-out

Date: 2026-09-29. Feature 141 was specified before the other features. This report says what was
changed in `specs/141-parity-oracle/` to bring it up to date with them, and why. Paths are
relative to `specs/141-parity-oracle/` unless they begin with `docs/` or `specs/`.

Nothing outside `specs/141-parity-oracle/` was written. No requirement and no task was
renumbered. The number of functional requirements is 45, as before.

## How the baseline was checked

The expectations were checked in two ways.

| Way | What was done |
|---|---|
| Reading | `git -C /root/specstride show 9cab15d:<path>` for the critic module, the engine script, the pass-loop script, the front-door script, the plugin request processor, the presenter, the banner and the theme; `git -C /root/mixture-of-loops show 9c88f86:<path>` for the supervisor library, the pipeline runtime and the contract library |
| Running | The Specstride baseline was unpacked with `git archive 9cab15d` into the scratch directory of this feature, made read-only, and run under an empty environment (`env -i`) with stub agents first on the search path and a stub critic on the loopback address. 37 cases were run, some more than once. No model was called, no credential was read, no source repository was written. The control run (two phases, both approved) ended with exit 0 |

Every line number below was checked against the baseline file after it was written down.

## 1. Part 1: scenarios that disagreed with the baseline code

### 1.1 What the baseline does

| Finding | Evidence |
|---|---|
| The critic module catches every error that is raised inside the critic call and scores it MALFORMED. The critic then exits 10 | `lib/critic.py:2729` (the call), `:2730` (transport errors), `:2738` (every other error), `:2846` (exit 10) |
| The engine counts MALFORMED verdicts. At the limit (default 3) it records `critic_unavailable` and exits 1 | `orchestrator.sh:2163`, `:2180`, `:2182` |
| The engine exits 3 with `critic_config` only when the critic exits 3 | `orchestrator.sh:2133` to `:2136` |
| The critic exits 3 in five places, all before its call | `lib/critic.py:2533` (spec missing), `:2542` (format), `:2545` (phase not found), `:2554` (verification plan), `:2562` (phase evidence missing) |
| The engine does not check the name of the critic before the run | `orchestrator.sh:203`, `:240`, `:2032`: the name is only handed on |
| On the plain-output path of the pass loop, a pass counts as an error only when the last `agent_result` event says so or when a watchdog ended the pass. A pass that fails before the harness starts writes no such event | `proposer.sh:2273` to `:2335` |
| Three passes without a change end the loop with pass-loop exit 8 | `proposer.sh:2343` to `:2350` |
| On the structured path the finalizer gives the failed pass a reason (`launch_failed`, `producer_nonzero`, `missing_terminal`), and two such passes end the loop with pass-loop exit 7 | `proposer.sh:2245` to `:2261` |
| The engine maps the pass-loop exits 4, 7, 8, 9 and 10 to engine exit 4 | `orchestrator.sh:1888` to `:1966` |

### 1.2 Expectations corrected

Three scenarios were reported (CQ-116, CQ-141). The check found that **all six** first scenarios
of FX-07 were wrong, and four scenarios of FX-18.

| Scenario | The catalogue said | The reference gives | Evidence | Known by |
|---|---|---|---|---|
| `FX-07/missing-key` | engine exit 3, `critic_config` | engine exit 1, `critic_unavailable`, after three MALFORMED verdicts | `lib/critic.py:1883`, `:2738` | run |
| `FX-07/unknown-harness-name` | engine exit 3, `critic_config` | engine exit 1, `critic_unavailable` | `lib/critic.py:2395`, `:2738` | run |
| `FX-07/dsh-conflicting-providers` (CQ-141) | engine exit 3, `critic_config` | engine exit 1, `critic_unavailable` | `lib/critic.py:1963`, `:2738` | run |
| `FX-07/dsh-invalid-model-ref` (CQ-141) | engine exit 3, `critic_config` | engine exit 1, `critic_unavailable` | `lib/critic.py:1978`, `:2738` | run |
| `FX-07/prime-empty-variant` | engine exit 3, `critic_config` | engine exit 1, `critic_unavailable` | `lib/critic.py:2370`, `:2738` | run |
| `FX-07/codex-missing-key` (CQ-116) | engine exit 3, `critic_config` | engine exit 1, `critic_unavailable` | `lib/critic.py:1904`, `:2738` | run |
| `FX-18/harness-missing-dsh` | pass-loop exit 7 | pass-loop exit 8, engine exit 4, `proposer_no_progress` | `proposer.sh:549`, `:2349` | run |
| `FX-18/dsh-model-and-qualifier` | pass-loop exit 7 | pass-loop exit 8, `proposer_no_progress` | `proposer.sh:544`, `:2349` | run |
| `FX-18/dsh-no-provider` | pass-loop exit 7 | pass-loop exit 8, engine exit 4, `proposer_no_progress` | `proposer.sh:381`, `:2349` | run |
| `FX-18/dsh-overlay-cannot-build` | pass-loop exit 7 | pass-loop exit 8, by the code. Not reproduced: see 1.5 | `proposer.sh:557`, `:2349` | read |
| `FX-18/consecutive-errors-legacy` | pass-loop exit 7, by a failing pass | pass-loop exit 7, but only by two passes that a watchdog ended. A stub that exits 1 gives pass-loop exit 8 | `proposer.sh:2300` to `:2335` | run |

The scenarios of 124 (items B-0575, B-0996): `FX-07/unknown-harness-name` is in the table above;
`FX-18/unknown-harness-name` did not exist and was added (2.2). On the reference an unknown
proposer name makes every pass return 127, the loop ends with pass-loop exit 8 and the engine
exits 4 with `proposer_no_progress` (`proposer.sh:640`; run). Feature 124 and register row DV-104
say the same.

### 1.3 What else was wrong in the family

No scenario of the first set reached engine exit 3. The traceability rows B-0135
(`orchestrator.sh:2136`), B-0151 (`:2135`) and B-0226 (`:2134`) and the requirement 028 FR-010
name FX-07 for exactly those lines, so they would have had no proof. Six scenarios were added:

| Scenario | Entry point | End on the reference | Known by |
|---|---|---|---|
| `FX-07/phase-not-found` | `front-door` `run`; the proposer stub rewrites the spec without the phase (verb `write`) and writes the phase evidence | critic exit 3, engine exit 3, `critic_config` | run |
| `FX-07/critic-spec-missing` | `critic` | critic exit 3 | run |
| `FX-07/critic-format-invalid` | `critic` | critic exit 3 | run |
| `FX-07/critic-phase-not-found` | `critic` | critic exit 3 | run |
| `FX-07/critic-plan-invalid` | `critic` | critic exit 3 | run |
| `FX-07/critic-evidence-missing` | `critic` | critic exit 3 | run |

### 1.4 The other critic and harness families

| Family | Result of the check |
|---|---|
| FX-05 | Agrees with the code: every malformed reply is MALFORMED, the limit gives engine exit 1 (`lib/critic.py:1847` to `:1866`; read) |
| FX-06 | Agrees. `http-error` was run: engine exit 1, `critic_unavailable`. The five others were read. The ends are now stated |
| FX-17 | Agrees. `iteration-limit` was run: pass-loop exit 4, engine exit 4, `proposer_max_iter` |
| FX-18 | Four ends corrected and one script corrected (1.2). `consecutive-errors-structured`, `harness-missing-prime`, `harness-missing-prime-launcher` and `prime-variant-with-model` agree: pass-loop exit 7 (run). The family did not state the engine exit; it is 4 |
| FX-19 | Agrees. `no-progress-legacy` was run. `no-progress-structured-not-evaluated` was read: the structured path goes to the next pass at `proposer.sh:2270`, before the breaker |
| FX-20 | Agrees by reading: pass-loop exit 10, engine exit 4. Not run |
| FX-25, FX-26 | No end was stated and none is wrong. Two members of `fallback-<reason>` may not be reachable (1.5) |
| FX-38 | Agrees by reading (`proposer.sh:2047` to `:2074`). The member `allowlist-entry` of the closed set had no scenario; `invalid-allowlist-entry` was added |
| FX-39 | Agrees by reading. Not run: a declared overlay needs a registry entry with a declaration |

### 1.5 What could not be reproduced

| Scenario | Why |
|---|---|
| `FX-18/dsh-overlay-cannot-build` | The throwaway home fails to build only when a link or the settings file cannot be written (`proposer.sh:407` to `:433`). A missing real home does not make it fail: the run built the home and passed. No fixture made it fail |
| `FX-26/fallback-tap-unavailable` | The reason is given when the stream tap or the interpreter is missing (`proposer.sh:339`). The reference tree is read-only and complete |
| `FX-26/fallback-no-adapter` | The reason is given when the registry names a stream format that has no adapter (`proposer.sh:341`). No shipped entry does |

They stay in the catalogue. If the exercise map shows that no fixture executes their evidence
lines, the items go to the correction list for a characterization test (F141-FR-033). This is
question CQ-pending-141-1 (section 6).

### 1.6 Where the changes are

| What | Where |
|---|---|
| Scope of FX-07, FX-18 | `spec.md:99`, `spec.md:110` |
| Scenario lists of FX-07, FX-18 | `spec.md:160`, `spec.md:171` |
| Table "Ends on the reference", 34 rows | `spec.md:215` |
| F141-FR-013: the catalogue states the end on the reference, and a capture that differs fails the capture job | `spec.md:700` |
| F141-FR-015: "the errors of their critic configuration, each with the end that the code of the baseline gives it" | `spec.md:707` |
| Clarifications of the follow-up | `spec.md:986` |
| Assumptions: CQ-116 and CQ-141 | `spec.md:1014` |
| Data model: the catalogue entry of a scenario, with `endOnReference` | `data-model.md:14` |
| Catalogue: `endOnReference` per scenario | `contracts/fixture-catalogue.json` (generated) |
| Generator: reads the table of ends | `contracts/tools/generate.py:91` |
| Tasks T125, T126, T127: the ends stated | `tasks.md:446`, `tasks.md:450`, `tasks.md:454` |
| Test CT-141-113 extended; new test CT-141-146 | `tasks.md:98`, `tasks.md:556` (T150) |
| New tasks T153, T154, T161 | `tasks.md:567`, `tasks.md:571`, `tasks.md:593` |
| Facts and decisions | `research.md:117` |

## 2. Part 2: scenarios the features asked for

### 2.1 Rule used

A scenario that a feature asked this feature for is delivered here ("scenario of 141"). A
scenario that a feature adds as data of its own tests is a scenario of that feature under CQ-027
and is registered in the catalogue under the name the feature gave it. F141-FR-030 said that an
added scenario carries the number of the feature in its name; the features 109, 123, 124 and 131
did not do that. The requirement now makes the catalogue the register of names, so no feature
has to rename (`spec.md:763`). The declaration check accepts a registered scenario and a pattern
name (`spec.md:495`).

### 2.2 Every request and what became of it

| Asked by | What | Outcome |
|---|---|---|
| 124 | `FX-18/unknown-harness-name` | **Added**, scenario of 141, test of 124 |
| 124 | `FX-07/unknown-harness-name` | Existed; its end was **corrected** (1.2) |
| 124 | B-0640, the usage text of the pass loop | No scenario of the first set prints it. In the list of other corrections with `none`; feature 103 reserves names for the usage failures |
| 123 | `FX-35/stale-sources`, `invalid-launch-contract`, `colour-always`, `colour-never`, `setup-without-implement`, `precondition-fails` | **Added**, scenarios of 141, tests of 123 |
| 123 | `FX-36/observe-cadence` | **Added**, scenario of 141, test of 123 |
| 123 | `FX-36/relaunch-budget-<n>` | **Assigned to 123.** `<n>` is a number of its own test. The two refusals are members of `relaunch-<decision>` here |
| 123 | `FX-36/gate-<refusal>` "for each of the 11 refusals" | **Resolved**: 10 members; the eleventh, `already-running`, is `gate-attach` |
| 109 | `FX-06/cli-timeout`; `FX-26/registry-queries`, `root-sandbox-assertion`; `FX-39/invalid-scope-value`, `scope-without-declaration`, `stale-overlay-swept`, `removal-fails`, `critic-overlay`, `executable-missing` | **Assigned to 109** (9 names). Each is inside the scope of its family and uses verbs and surfaces of §O.3 and §O.4 |
| 109 | `FX-26/help-list-unavailable` | **Refused.** Outside the scope of FX-26, and it needs a reference whose registry module cannot run |
| 131 | `FX-01/codex-model-named`; `FX-25/codex-model-listed`, `codex-model-unlisted` | **Assigned to 131** (3 names) |
| 131 | `FX-06/codex-empty-choices` | **Assigned to 131.** No verb made the critic stub reply with an empty list of choices; the verb `empty` got the argument `choices: none` (`spec.md:378`, `contracts/stub-vocabulary.json:43`, T159). No verb was added |
| 119 | `flag-without-value` of FX-28, cited in F119-FR-005 | **Added**, scenario of 141, test of 119 |
| 138 | The empty variant of the proposer (F138-FR-010) | **Added** as `FX-18/prime-empty-variant`; run: pass-loop exit 7 |
| 130 | The scenarios of its User Story 4 in FX-38; `dsh-settings-overlay` and `dsh-reasoning-effort` in FX-39 | Existed. `FX-38/invalid-allowlist-entry` **added** for the one member of its closed set that had no scenario |
| 125 | Confirmation that its scenarios of FX-01, FX-02, FX-05, FX-06, FX-26 exist | They exist |
| 103 | Names `103-<name>` in FX-17 to FX-20 and FX-24, for usage failures and the empty prompt | **Reserved** for 103 in the catalogue; not yet named |
| 127 | That the generic stub can declare a limit signal; scenarios in FX-23 and FX-18 | **Refused** as a scenario of a family: no stub emits a quota signal in a fixture (F141-FR-043). In a characterization test the stub prints what its script gives it. `FX-23/wall-budget` and FX-18 exist |
| 140, 108 | "Report any needed scenario" | None was named. See 2.3 for `lint-<code>` |
| 145, 119 | FX-40 for the items that need a terminal | The first set of FX-40 had four scenarios and could not execute the 96 items that Part 3 moves to it. **Added**: 24 scenarios, and the presenter, the banner and the theme tool as entry points (`spec.md:132`, `spec.md:704`, T152, T157, T158) |
| 117 | FX-02, FX-05 and FX-08 for the critic prompt and the diagnostician prompt, where the catalogue lists 117 under FX-25 only | **Confirmed.** Every critic call builds the prompt; the diagnostician prompt is built only in FX-08 (`lib/critic.py:1643`). The column "Features covered" follows the traceability files and limits nothing (`spec.md:86`) |
| 122 | FX-36 beside FX-11; FX-16 and FX-35 | See 2.4 |

### 2.3 The pattern names

The first analyze report said 21 pattern names. The scenario table holds **13**; the figure 21
cannot be reproduced. All 13 are resolved, with 175 members (`spec.md:194`).

| Pattern | Members | Resolved against | Owner after the splits |
|---|---|---|---|
| `FX-22/predicate-<kind>` | 6 | Annex X §X.6 row 69; `proposer.sh:1250`. The seventh kind, `first_failure`, is new and has no reference | 118 (the set did not move to 148) |
| `FX-26/claude-<name>` | 18 | The as-is assets. One further as-is stream belongs to the locally registered backend and is not imported | none; tests of 125, 126, 144 |
| `FX-26/prime-v3-<name>` | 10 | The as-is assets | none; tests of 138, 126 |
| `FX-26/fallback-<reason>` | 3 | Row 171 | 126 |
| `FX-28/<command>-<case>` | 20 | Row 158 for the cases; the front-door script | 119 (not 145) |
| `FX-30/lint-<code>` | 38 | Row 146. The dot of a code is written as a hyphen | 140 (moved from 108) |
| `FX-33/invalid-<class>` | 10 | No closed set exists; the validators of the baseline | 107; CQ-pending-141-2 |
| `FX-35/signal-<name>` | 3 | `runtime.py:588` of mixture-of-loops | 123 |
| `FX-36/mode-<case>` | 9 | Row 107 | 123 |
| `FX-36/gate-<refusal>` | 10 | Row 13 | 123 |
| `FX-36/observe-<status>` | 7 | Row 106 | 123 |
| `FX-36/relaunch-<decision>` | 31 | Row 14, the table `relaunch-observe`. The five members that `relaunch-root` adds are new and have no reference | 123 |
| `FX-38/invalid-request-<case>` | 10 | Row 217; `lib/dsh_plugin_requests.py:45` to `:69` | 130 |

Every literal of rows 13, 14 (`relaunch-observe`), 106 and 107 was found in the code of
mixture-of-loops at `9c88f86`. None of the five literals of `relaunch-root` was.

### 2.4 The exercise map for the families feature 122 cites

Confirmed or corrected by reading the evidence lines. The exercise map itself has not run; it is a
task of implementation.

| Item | Evidence | Traceability names | Feature 122 cites | Result |
|---|---|---|---|---|
| B-2588 | `runtime.py:582` of mixture-of-loops | FX-11 | FX-11, `FX-35/lock-held@engine-stub` | **FX-35 is right.** FX-11 runs the Specstride reference and cannot execute a line of mixture-of-loops |
| B-2760 | `supervisor_lib.py:435` | FX-11 | FX-11, `FX-35/lock-held@engine-stub` | **Neither.** The line is the launch check of the supervisor: `FX-36/gate-attach` or `FX-36/launch` |
| B-2764 | `supervisor_lib.py:604` | FX-11 | `FX-36/launch@engine-stub`, FX-11 | **FX-36 is right** |
| B-2769 | `supervisor_lib.py:718` | FX-11 | `FX-36/observe-<status>@engine-stub`, FX-11 | **FX-36 is right** |
| B-0061 | `orchestrator.sh:531` | FX-11 | FX-11, `FX-16/long-job-running` | **Both.** Every run executes the line; FX-16 shows its effect |
| F122-FR-029, F122-FR-030 | new | — | `FX-12/stop-with-no-run` | A characterization test; the scenario exists |

### 2.5 Counts

| Outcome | Count |
|---|---|
| Expectations corrected | 11 scenarios (6 of FX-07, 5 of FX-18) |
| Scenarios added to the catalogue as scenarios of 141 | 41 named scenarios, and 175 members of 13 pattern names |
| Scenarios assigned to the asking feature under CQ-027 | 14 names (9 of 109, 4 of 131, 1 of 123), and the reserved names of 103 |
| Requests refused | 2 (109, 127) |

### 2.6 Where the changes are

| What | Where |
|---|---|
| Column "Features covered", 14 families, after the splits | `spec.md:86`, `spec.md:93` to `spec.md:132` |
| Scenario lists | `spec.md:154` to `spec.md:192` |
| Members of the pattern names | `spec.md:194` |
| Scenarios added after the first set, with stubs, verbs, surfaces and owners | `spec.md:260` |
| Requests that are not scenarios | `spec.md:324` |
| F141-FR-030 | `spec.md:763` |
| Catalogue, generated | `contracts/fixture-catalogue.json`; `reservedNames` at `:3393`, `notScenarios` at `:3407` |
| Generator | `contracts/tools/generate.py:70` to `:138` |
| Tasks: patterns with their member counts | `tasks.md:362`, `:378`, `:386`, `:394`, `:462`, `:466`, `:481`, `:485` |
| Tasks: T151, T155, T156, T158, T160 | `tasks.md:560`, `:575`, `:578`, `:585`, `:591` |

## 3. Part 3: the proof column for FX-38 to FX-40

`followup/proof-column-changes.tsv`: **185 rows**, columns `file`, `id`, `old_family`,
`new_family`, `reason`.

| New family | Rows | Which |
|---|---|---|
| FX-38 | 27 | The 11 items of C-036 to C-040 and the 16 plugin items of C-052, C-053, C-054, C-056, C-057, C-058, all of 130. B-0563 and B-0764 mention the protocol and are general items of the pass loop; they stay |
| FX-39 | 58 | The 32 items of C-026 to C-031; 21 overlay items of the pass loop, the engine and the critic in 109; 5 items of the dsh settings overlay in 130 |
| FX-01, FX-39 | 3 | B-0817, B-0818, B-0986: the throwaway home of the dsh critic. FX-06 is dropped |
| FX-40 | 96 | Items of 145 in C-081 to C-086 and C-096 to C-107 that need a terminal, colour, a width, or the timeline or card mode |
| FX-26, FX-39 | 1 | `traceability-frs.tsv`, 028 FR-028 |

The reservation of `traceability.md` counted 51 items of 109 for the overlay; the list has 53,
because four items name FX-11, FX-21 or FX-05 and not FX-26 (B-0115, B-0622, B-0683, B-0992).
B-0424 and B-0680 stay on FX-26: they state what holds with no overlay. B-0642 stays on FX-18.

Of the 121 kept items of the presenter clusters, 96 go to FX-40 and 15 stay on FX-28 (the
presenter in plain and quiet mode, which `events` reaches). The other 10 belong to neither: they
are the plain banner, the plain rail and the colour decision without a terminal, which every run
executes and writes into the engine log. A run of the reference showed the banner and the rail
in the log, and the front-door script never calls the banner.

`followup/proof-column-corrections-other.tsv`: **17 rows** of the same form, for assignments that
the reading of the baselines corrected and that are outside FX-38 to FX-40: the 10 items just
named (FX-28 to FX-01), B-0575 (FX-01 to FX-18), B-0996 (FX-01 to FX-07), B-0640 (FX-01 to
`none`), B-2588 (FX-11 to FX-35), B-2760, B-2764, B-2769 (FX-11 to FX-36). They are kept apart
because the assignment did not ask for them.

Every id of both lists exists in its file, and `old_family` is what the file holds now.

## 4. Changes outside the three parts

They were needed to keep the feature consistent, and the generator check failed without the first.

| Change | Why | Where |
|---|---|---|
| Register map: 19 entries, DV-095 to DV-113 | The register has 113 rows. `generate.py --check` failed with "register-map.json does not hold exactly the rows of the register" before the follow-up | `contracts/register-map.json:1056`; F141-FR-023 at `spec.md:738`; `data-model.md:24`; `tasks.md:150` |
| Waivers of DV-107 and DV-112 | The two rows say "waiver". DV-107 on `loki-payload` and `otlp-payload`; DV-112 on the scenarios in which the prime stub is called | `spec.md:154`, `:159`, `:179`, `:184`; F141-FR-022 at `spec.md:735`; `tasks.md:405` |
| "Thirty other features" | Forty after the splits | `spec.md:25` |
| Counts of the plan | 234 names, 113 rows | `plan.md:19`, `plan.md:52` |

## 5. What must change in other features

This feature changed none of them.

| Feature | What | Why |
|---|---|---|
| 101 | F101-FR-010 lists "a missing credential" among the configuration errors that give engine exit 3. At the baseline a missing key is scored MALFORMED. Under the `parity` profile the requirement must follow the code, or a register row and a switch are needed | 1.1; `lib/critic.py:1883`, `:1904` |
| 101 | `contracts/gate-halts.json`: the row `critic-config` names FX-07 as its fixture. Only `FX-07/phase-not-found` reaches it; the six first scenarios of FX-07 belong to the row `malformed-limit`. The table test of F101-SC-003 over FX-03 to FX-07 must map each scenario by the table "Ends on the reference" | 1.2, 1.3 |
| 130 | F130-FR-028: the line `status: unverified` about FX-07 can be removed; CQ-141 is closed by the correction | 1.2 |
| 131 | F131-FR-027: the line `assumption: CQ-116` can be removed. `FX-06/codex-empty-choices` uses the verb `empty` with the argument `choices: none` | 1.2, 2.2 |
| 138 | It cites `FX-07/prime-empty-variant` and follows the code already. Its proposer side is now `FX-18/prime-empty-variant`. Register row DV-112 names FX-18 for a waiver, and no scenario of FX-18 starts the prime stub | 2.2, 4 |
| 124 | The parity test of B-0640 needs a characterization test or a scenario of feature 103. T013 and T014 can stay as they are | 2.2 |
| 122 | T025 proves B-2760 on `FX-35/lock-held@engine-stub`; the line is executed by `FX-36/gate-attach` | 2.4 |
| 123 | T004 says "each of the 11 refusals" of `gate-<refusal>`: 10 members and `gate-attach`. T068 is answered: its scenarios are in the catalogue | 2.2 |
| 140 | T008, T009, T010 cite `FX-30/lint-template.mandatory`, `lint-evidence.*`, `lint-spec.*`, `lint-tasks.*`, `lint-coverage.fr`, `lint-claims.missing`. A scenario name holds no dot: the names are `lint-template-mandatory` and so on; a group is cited by its members | 2.3 |
| 109 | T006: `FX-26/help-list-unavailable` is no scenario of FX-26; F109-FR-006 needs a characterization test. `FX-26/root-sandbox-assertion` has a prerequisite (effective user id 0); without it the scenario is a skip, and a skip blocks a release | 2.2 |
| 127 | T004 is answered: no limit signal in a fixture of a family | 2.2 |
| 107 | It is asked to state the error classes of validation as a closed set (CQ-pending-141-2) | 2.3 |
| 145, 119 | The items of the presenter clusters are proven on three families: FX-40 (96), FX-28 (15) and FX-01 (10) | 3 |
| 100 | Annex X §X.8, component-name table: no row for the presenter, the banner and the theme tool. Annex X §X.6 has no row for the error classes of validation | 2.3, FF2 |

For the orchestrator:

| What | Why |
|---|---|
| Apply `followup/proof-column-changes.tsv`; decide on `followup/proof-column-corrections-other.tsv` | Part 3 |
| Register row DV-112: drop FX-18, or have a feature add a scenario of FX-18 in which the prime stub runs | A waiver that matches nothing fails the suite (F141-FR-022) |
| Close CQ-116 and CQ-141 | Answered by the code, as recommended |
| CQ-084 (115, 116) asks for more logical names in the layer allowlist. The allowlist is generated from the register, so row DV-052 changes first. Not done here | Out of the three parts |

## 6. New questions for the clarify queue

| Id | Question | Sources | Recommended answer | What changes if answered otherwise |
|---|---|---|---|---|
| CQ-pending-141-1 | May a fixture change the reference tree, or put a stub under the name of the interpreter, to reach a line of the reference that runs only when a file of the reference is missing or cannot be written? It concerns `FX-18/dsh-overlay-cannot-build`, `FX-26/fallback-tap-unavailable`, `FX-26/fallback-no-adapter` and the scenario `help-list-unavailable` that 109 asked for | F141-FR-002; §O.3, names of stub executables; `proposer.sh:339`, `:341`, `:557`; `specstride-lib.sh:181` | No. The reference tree is read-only and a stub takes only the names of §O.3. An item that no fixture reaches gets a characterization test, by a correction of the traceability files | If yes: F141-FR-002 gets an exception for a changed copy of the tree, as it has for the install-root `.env`, and the four scenarios become parity tests |
| CQ-pending-141-2 | Which are the error classes of the validation of a launch contract (`FX-33/invalid-<class>`)? | Annex X §X.6 (no row); `contract_lib.py` of mixture-of-loops at `9c88f86`, lines 111 to 117, 196, 248, 293, 483, 536, 932, 935, 969; feature 107, T001 | The ten validators of the baseline, as `spec.md:207` names them; feature 107 states them as a closed set and feature 100 adds the row | With another cut of the classes the members of the pattern change; the family and the pattern name stay |
| CQ-pending-141-3 | Is an error that the critic raises for a missing credential a configuration error (engine exit 3) or a failed call (MALFORMED)? F101-FR-010 says the first, the baseline does the second | F101-FR-010; `lib/critic.py:1883`, `:1904`, `:2738`; CQ-116 | A failed call under the `parity` profile, as the code does. Outside the profile feature 101 may keep exit 3, with a register row and a switch that is off under `parity` | If exit 3 holds everywhere: `FX-07/missing-key` and `FX-07/codex-missing-key` need a waiver and a register row |

## 7. Register rows needed

None is needed by this feature. One may be needed by feature 101, depending on
CQ-pending-141-3: "A missing credential of the critic is scored as a failed critic call and ends
at the MALFORMED limit (baseline) | refused before the call with `critic_config` | off under the
`parity` profile".

## 8. Checks at the end

| Check | Result |
|---|---|
| `python3 specs/141-parity-oracle/contracts/tools/generate.py --check` | Passes. It failed before the follow-up |
| `speckit-analyze`, run again | Three runs, two repairs. No CRITICAL finding, no open HIGH finding. Appended to `analyze-report.md:107` |
| `python3 docs/ecosystem/check-traceability.py --require-all` | `PASSED: checks a to h`, 41 of 41 |
| `.specify/feature.json` | Rewritten by the prerequisite script of Spec Kit, which `STAGE-B-RULES.md` allows |
