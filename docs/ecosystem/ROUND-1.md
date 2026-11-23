# ROUND-1 — the clarification round of Stage B

Prepared by the orchestrator on 2026-09-30 from `CLARIFY-QUEUE.md`. The owner answers one question at a time; each answer is recorded in the queue with the date. Where the answer differs from the recommendation, the spec is updated and the affected steps are re-run for that feature.

| Group | Entries |
|---|---|
| 1. Touch a NON-NEGOTIABLE principle | 17 |
| 2. Touch a ruling of `APPROVAL.md` | 85 |
| 3. The rest, by feature | 107 |
| 4. Answers already applied by the amendments or a corrected catalogue, to confirm as one group | 12 |
| Closed before the round | 17 |
| Total rows | 238 |

An option is labelled as a report's recommendation only where the queue row says that report recommends it; "the orchestrator's reading" means no report recommends an answer.

## Group 1 — entries that touch a NON-NEGOTIABLE principle

### CQ-110 · feature 134

**Question.** The proof that a critic has no tools asks for "the session it minted", but the pi critic runs with no session

**Sources.** F100 annex C §C.3; Principle IX; R9

**Recommended answer, on which the specs proceed.** Compare the identity where the initial record carries one; otherwise use the weaker proof, the flag set and the version pin, and record that it was used. The captures decide which case holds

**If answered otherwise.** The critic keeps a throwaway session under the minted id

### CQ-117 · feature 131

**Question.** The harness port speaks of a session id minted by the runtime; Codex accepts no session id that the caller chooses

**Sources.** F100 annex C §C.1; Principle IX; R6

**Recommended answer, on which the specs proceed.** The proof records the id of the first stream record and checks that no pass of the run used it

**If answered otherwise.** A minted id cannot be provided by this adapter

### CQ-135 · feature 127

**Question.** What happens when the spend ledger cannot be read and cannot be rebuilt?

**Sources.** R14; Principle XII

**Recommended answer, on which the specs proceed.** Hard ceilings read as reached

**If answered otherwise.** The run continues from zero, and a cap can be passed

### CQ-142 · feature 130

**Question.** How does the adapter list the tool ids of the composed dsh profile, free of charge and without a model call, for the coverage check of the tool-less critic?

**Sources.** R9; Principle IX

**Recommended answer, on which the specs proceed.** A capture settles it; if no way exists, the critic role on dsh is refused under the value `strict`

**If answered otherwise.** dsh cannot be a critic outside the `parity` profile

### CQ-143 · feature 125

**Question.** Ruling 36 says a run never writes the real configuration home, and the success criterion says the home is byte-identical after a run. At Tier 1 the harness itself writes session state and its own bookkeeping there

**Sources.** Owner ruling 36; R5; Principle VIII

**Recommended answer, on which the specs proceed.** The adapter writes nothing and removes only the session state of sessions it minted. The files the harness writes by itself are listed by a capture and left out of the comparison

**If answered otherwise.** Session continuation stays off at Tier 1 until a capture shows that the state can be redirected

### CQ-145 · feature 125

**Question.** The ported item B-0911 falls back to a window of 200,000 tokens for a critic model that is not listed; Principle IX says there is no default window for an unknown model

**Sources.** B-0911; Principle IX; DV-106, DV-111

**Recommended answer, on which the specs proceed.** The fallback is kept as the smallest window of the table, and a window the consumer declares always wins

**If answered otherwise.** Unlisted models are refused, with a register row, as the Codex and dsh adapters do

### CQ-182 · feature 100, 109, 130

**Question.** Principle IX says that the adapter verifies from the harness's own initial record that the tool list is empty and the session is the one it minted, and that any other result halts the run. May a tested harness adapter whose stream has no initial record prove the tool-less form by its exact version pin and its preflight ("the weaker proof")?

**Sources.** Constitution v3.0.0, Principle IX and Governance; `APPROVAL.md` (no ruling names the weaker proof; rulings 57, 57a and D1 cover the read-only-tools form only); `docs/ecosystem/feature-briefs.md:2997` ("is new in this brief"); F100-FR-230; register rows DV-081 and DV-110; CQ-110; review item W-100-20 (critical)

**Recommended answer, on which the specs proceed.** Yes, for a tested harness adapter only, recorded for every call as the weaker proof; Principle IX gets a PATCH that names it (source of the answer: B-8.3a)

**If answered otherwise.** A harness whose stream has no initial record is refused as critic: dsh cannot be a critic outside the `parity` profile, and the third way of F100-FR-230 and the second sentence of F109-FR-038 are removed

### CQ-186 · feature 100, 141, 109

**Question.** Principle VI and ruling 18 keep the Language Ledger empty. The build runs `contracts/tools/generate.py --check` (features 100 and 141), a `sitecustomize` file for line tracing (141) and `docs/ecosystem/check-traceability.py` (109, 110, 117, 118, 141). None is shipped. Is a tool of the build a component in the sense of the Language Ledger?

**Sources.** Constitution v3.0.0, Principle VI and Additional Constraints; ruling 18; `specs/100-specstride/research.md` D-5 (the plan's own reading); B-8.3b, section "Not checked"; review item W-100-26 (medium)

**Recommended answer, on which the specs proceed.** No, where the file is outside every published package and the build states Python 3 as a requirement of development; otherwise the three pieces are ported to TypeScript (source of the answer: B-8.3d)

**If answered otherwise.** The tools are components: T207 of feature 100 (the port of the generator) becomes a precondition of the first build, and T003, T082 and T086 of feature 141 are written in TypeScript

### CQ-188 · feature 113

**Question.** The brief of feature 113 asks for a skill-trigger suite with three runs at a pinned model on every pull request, and for a nightly and a weekly paid run (`docs/ecosystem/feature-briefs.md:5309`). Principle XII (NON-NEGOTIABLE) says no test and no CI job calls a paid or external model API, and model ids are configuration. Both were approved. Which holds?

**Sources.** Constitution v3.0.0, Principle XII and Governance; `docs/ecosystem/feature-briefs.md:5309`; `docs/ecosystem/research/R3v-host-facts-verification.md:114` (each run of `claude plugin eval` is a full child of the host on the consumer's credential); `APPROVAL.md`, "Approved without a separate question" and "Not approved: any paid probe"; review item W-113-01 (critical)

**Recommended answer, on which the specs proceed.** Principle XII holds: the trigger suite, the nightly smoke and the weekly report leave CI and become tasks run by a person, paid and logged, as feature 115 does for its experiments (`specs/115-micro-loop-layer/tasks.md:22`); F113-FR-038 changes from "MUST gate each pull request" to a release check; the model comes from configuration (source of the answer: the orchestrator's reading, no report recommends an answer; B-8.3b offers this and the deviation as equal options and says the orchestrator has to choose)

**If answered otherwise.** The suite stays in CI: `plan.md` gains a Complexity Tracking table with the deviation from XII and its justification, row XII is marked as a deviation, T027, T029 and T031 are marked as paid, and the model comes from configuration

### CQ-189 · feature 130

**Question.** Ruling 36 says plugins, hooks, skills and MCP servers are off at auth tier 1, and Principle VIII says they are not loaded into a pass unless the consumer opts in. The dsh harness offers no switch that the adapter uses, and F130-FR-014 links every entry of the real home into the throwaway home. Ruling P15 is the one exception to ruling 36 and covers plugin installs only. May dsh be used as proposer with its profile loaded?

**Sources.** Constitution v3.0.0, Principle VIII; rulings 36, 37, P14, P15; F100-FR-082; F100-FR-113; F130-FR-003, F130-FR-014; CQ-141 and CQ-142 (other subjects); review item W-130-02 (critical)

**Recommended answer, on which the specs proceed.** Yes, when the consumer names dsh (ruling P14): each customisation that cannot be switched off is reported as null in `capabilities`, warned by the doctor and recorded per run, and the plan records the deviation. The critic role is refused where a native memory exists and cannot be switched off (source of the answer: the orchestrator's reading, no report recommends an answer; B-8.3c asks for the question to be queued and proposes the reporting as the repair)

**If answered otherwise.** dsh is refused as proposer outside the `parity` profile until a switch exists, and the requirements on the throwaway home of F130-FR-014 change

### CQ-197 · feature 116

**Question.** Rule IR-35 covers an ignored path from which a check executes (the directory of the runner, the executables of a virtual environment) by a hash of its metadata listing. Principle III (NON-NEGOTIABLE) says that a change is detected everywhere. Is the listing enough for the files of such a path that are neither pinned executables nor matched by a class A pattern of a toolchain profile?

**Sources.** Constitution v3.0.0, Principle III; R23v V-04 item 3, IR-35, IR-36, IR-38; R27 D1.4; rulings 38 and 39; F116-FR-003; review finding B-8.3b-010; the repair report of feature 116 (N-1)

**Recommended answer, on which the specs proceed.** Yes for Wave 1, as a stated deviation: the listing with name, kind, size, mode, modification time and time of the last change of status; content hashes for pinned executables and for files matched by a class A pattern (source of the answer: the repair report of feature 116; the narrowest reading of the repair; no research report recommends more)

**If answered otherwise.** The content of every file of such a path is hashed around every check: F116-FR-003 and the performance goal of the plan change, and the cost of a check grows with the dependency directory. Or the owner amends Principle III to name the limit

### CQ-199 · feature 100

**Question.** Is `harnesses.<id>.proposerCustomisations` one key for every customisation that a harness loads by itself, or one key per kind (instruction files, extensions, skills, context files, prompt templates)?

**Sources.** F131-FR-014; F134-FR-029; ruling 36; Principle VIII; profile rows 29 and 119

**Recommended answer, on which the specs proceed.** One key per harness, off or on; a harness adapter maps it to its own switches and reports a customisation it cannot switch as null in `capabilities` (source of the answer: the second pass of feature 100, N-2)

**If answered otherwise.** One key per kind: row 131 becomes several rows, named by features 131 and 134

### CQ-220 · feature 113

**Question.** From where does a run of the trigger suite take its model: a key of the product configuration, or the configuration of the run?

**Sources.** Principle XII ("Model ids are configuration"); annex X §X.7 (no row for evals); `specs/110-config-and-terms/contracts/config-keys.tsv` (no key for evals); CQ-188; raised in `specs/113-host-claude-code/repair-report.md`, question 1

**Recommended answer, on which the specs proceed.** The configuration of the run, given by the person who starts it, recorded in the log. No product key: the suite is a tool of development and is never shipped. (Who: "This feature's own reading; no report recommends an answer".)

**If answered otherwise.** Feature 110 adds a key, annex X §X.7 a row with its value under `parity`, and F113-FR-039 names the key

### CQ-221 · feature 113

**Question.** Is a logged paid run of the trigger suite a precondition of a release (F113-FR-038), or is the suite only advice?

**Sources.** CQ-188 (recommended answer: "a release check"); Principle XII ("No gate or workflow requires another person's review, account or action"); raised in `specs/113-host-claude-code/repair-report.md`, question 2

**Recommended answer, on which the specs proceed.** A precondition, read from the log. The person is the maintainer who makes the release, under the own login, so no third party is in the loop. (Who: "Reading of this feature from the text of CQ-188".)

**If answered otherwise.** The release check of T035 is removed, and F113-FR-038 keeps only the paid task and its log

### CQ-223 · feature 123

**Question.** Is `[SPECSTRIDE-DIGEST]` printed when the run holds none of the six facts, and are keys without a fact printed?

**Sources.** Annex G §G.3 (the paragraph before the table of product lines); Principle XIX; raised in `specs/123-pipeline-runtime-and-supervisor/repair-report.md`, CQ-pending-123-2

**Recommended answer, on which the specs proceed.** A key without a fact is left out; a line that would hold `run` only is not printed. (Who: the repair report of 123, no source named.)

**If answered otherwise.** Always printed with seven keys: F123-FR-043 and CT-123-143 change, and the line costs bytes on every run

### CQ-234 · feature 138

**Question.** The harness has no variable for its configuration directory. Is a home made by redirecting the home variable the throwaway home of ruling 36 and Principle VIII, and what holds if a capture shows that the agent executable does not follow the home variable?

**Sources.** Ruling 36; Principle VIII; F100-FR-113; annex C §C.16; R9 F16; the help of the agent executable 0.7.3; raised in `specs/138-adapter-prime/repair-report.md`, CQ-pending-138-1

**Recommended answer, on which the specs proceed.** Yes. Until capture (5) has passed the fact is `unverified` and row VIII of the plan is open. If the capture fails, prime is refused at auth tier 2. (Who: "the reading of this feature; no report recommends an answer".)

**If answered otherwise.** If auth tier 2 may use the real home with the customisations off, F138-FR-045 loses the overlay and the deviation becomes permanent, with a register row

### CQ-238 · feature 100, 123

**Question.** May row O-33 of table 1 of feature 123 (refuse a run that rests blocked on a human) be active under the `parity` profile too, so that Principle VIII holds under every profile?

**Sources.** E9 of `SECOND-PASS-LIST.md`; register row DV-114; F100-FR-163; the fixture catalogue of 141; raised in `docs/ecosystem/reviews/B-8.7-D.md`, N-100-1

**Recommended answer, on which the specs proceed.** Yes for O-33, no for O-34. No scenario of FX-35 or FX-36 ends blocked (their member lists in `specs/141-parity-oracle/contracts/fixture-catalogue.json` hold no blocked, `auth`, `quota-credit` or `budget-cap` scenario), so O-33 changes no compared output; O-34 would change the rule id of FX-36 scenarios that end not retryable (`relaunch-child-exit-not-retryable`, `relaunch-stop-reason-not-allowed`). DV-114 is narrowed to O-34, the Complexity Tracking rows of 100 and 123 are removed. Until answered, the specs follow DV-114 as written. (Who: the re-check B-8.7-D, no source named beyond E9.)

**If answered otherwise.** DV-114 stands for both rows, and the deviation from Principle VIII under `parity` stays recorded in the plans of 100 and 123

## Group 2 — entries that touch a ruling

### CQ-017 · feature 102, 100

**Question.** Ruling P12 left the name of the `resume` flag that accepts an intended change of spec, plan or task list open

**Sources.** Owner ruling P12; F100-FR-173

**Recommended answer, on which the specs proceed.** `--accept-source-change`

**If answered otherwise.** One literal in feature 100 annex G and in feature 102

### CQ-020 · feature 100, 123, 129

**Question.** With which stop reason and engine exit code does a run end that rests blocked on a human? The closed enumeration has no reason for it except `paused_quota_ceiling`

**Sources.** Owner rulings 28, 29, K3, K4; `consolidation.md` section 4

**Recommended answer, on which the specs proceed.** Reuse existing reasons, all with `retryable: false`: a changed source gives `critic_config` and exit 3; credit or auth gives `proposer_consecutive_errors` and exit 4; a hard budget cap gives `wall_budget` and exit 4; a declared block gives `proposer_no_progress` and exit 4; the quota wait ceiling gives `paused_quota_ceiling` and exit 4. The blocked reason itself is a separate field of the terminal record

**If answered otherwise.** If new stop reasons are wanted instead: the enumeration grows, each new reason needs a register row, and the compatibility projection must map them

### CQ-021 · feature 100, 102

**Question.** Who records the state and the event when `resume` is refused because a source changed? The CLI writes no run state (LR-3, LR-4)

**Sources.** `architecture.md` LR-3, LR-4; owner rulings K2, K3

**Recommended answer, on which the specs proceed.** The CLI records the refusal in the launch record; readers derive `blocked-on-human`; the next event writer writes a synthesized `blocked` event

**If answered otherwise.** Otherwise the CLI becomes a writer of run state, against LR-3 and LR-4

### CQ-023 · feature 100; 129, 122, 124, 110, 115

**Question.** Exit codes of commands that have no as-is equivalent (`wait`, `state export`, `import` and `adopt`, `harness verify`, `config` verbs, `tripwire clear`)

**Sources.** Owner ruling K6; `consolidation.md` section 3

**Recommended answer, on which the specs proceed.** 0 success; 1 missing state or a failed act; 3 usage or invalid input; 5 where a live run forbids the act

**If answered otherwise.** The per-command table of feature 100 annex G §G.4

### CQ-024 · feature 100, 107, 113

**Question.** Is the exchange in which the host judges derivation batches a named part of the CLI protocol?

**Sources.** R15v finding A-6 proposes it; `architecture.md` names only the delegation (ruling 64)

**Recommended answer, on which the specs proceed.** Yes, as `specstride.judgment/1` (R15v's proposal)

**If answered otherwise.** Features 107 and 113 would each define the exchange themselves

### CQ-032 · feature 144

**Question.** Feature 100 annex C §C.10 says content reaches a sink only while capture is on. The compatibility projection must still write the old `agent_text` and `agent_tool` snippets under the `parity` profile, where capture is off

**Sources.** F100 annex C §C.10; owner ruling 43; DV-083

**Recommended answer, on which the specs proceed.** The projection reads only its own snippets, redacted, through the content accessor; every other sink follows the switch

**If answered otherwise.** Byte-identity fails on FX-26 and the other families with stream events

### CQ-035 · feature 107

**Question.** Which kinds of judgment item exist in derivation, and what choices does each offer?

**Sources.** Brief 107; R17; owner ruling 64

**Recommended answer, on which the specs proceed.** Four kinds: classify an obligation, settle a prerequisite, map a declared command, resolve a blocker. Each offers the members of its closed set and "keep an open blocker"

**If answered otherwise.** The closed set changes, and so do the item fields feature 113 reads

### CQ-041 · feature 104

**Question.** What do `--gates-dir` and "approved" mean for `first-unapproved`, now that a bare marker is no approval?

**Sources.** Owner ruling 33; 028 FR-016

**Recommended answer, on which the specs proceed.** A directory of approval records; a phase is approved when its record verifies

**If answered otherwise.** The inspection verb changes

### CQ-042 · feature 104

**Question.** Feature 100 annex G gives the `spec` verb the exit codes 0, 2 and 3; the baseline exits 1 on a phase number that is not a number

**Sources.** F100 annex G §G.4; baseline `lib/specstride_spec.py`; owner ruling K6

**Recommended answer, on which the specs proceed.** Keep exit 1, as the baseline

**If answered otherwise.** Exit 2, with a register row

### CQ-043 · feature 104

**Question.** Which files of an OpenSpec change stand for `spec` and `plan` in the staleness verdict, and what are the sources of a native spec?

**Sources.** Owner ruling K3; 002 FR-029

**Recommended answer, on which the specs proceed.** `proposal.md` as `spec` and `design.md` as `plan`; the one file of a native spec as `spec`

**If answered otherwise.** The files of the verdict change

### CQ-047 · feature 123

**Question.** When do launch-blocking checks beyond the six launch checks run and print?

**Sources.** 011 FR-019; owner ruling 68

**Recommended answer, on which the specs proceed.** After the six; they print a line only outside the `parity` profile

**If answered otherwise.** Another print rule

### CQ-048 · feature 123

**Question.** What is the "relaunch window" of F100 annex E §E.2 T12, and how does the host write `hold-relaunch`?

**Sources.** F100 annex E §E.2; owner ruling 6

**Recommended answer, on which the specs proceed.** The window is the wall-clock deadline of the relaunch budget. The host writes the request through two new verbs, `supervise hold` and `supervise release` (exit 0 written, 4 refused)

**If answered otherwise.** A separate hold time is a new switch and a new profile row

### CQ-050 · feature 123

**Question.** Which labels do the terse default output lines of the pipeline carry?

**Sources.** F100 annex G §G.3; owner ruling 68

**Recommended answer, on which the specs proceed.** `[SPECSTRIDE-*]` labels and keys as proposed in the spec of feature 123; the lines of `supervise` carry labels of their own, `[SPECSTRIDE-SUPERVISE-LAUNCH]`, `[SPECSTRIDE-SUPERVISE-STATE]`, `[SPECSTRIDE-SUPERVISE-STOP]` and `[SPECSTRIDE-SUPERVISE-DIGEST]`, because `[SPECSTRIDE-LAUNCH]`, `[SPECSTRIDE-STOP]`, `[SPECSTRIDE-DIGEST]` and `[SPECSTRIDE-STATE]` have other owners and other keys (annex G §G.3); `[SPECSTRIDE-DIGEST]` is printed by 123 with the keys of annex G §G.3 (F123-FR-043; applied in the repair of feature 123, W-123-02, 2026-09-30)

**If answered otherwise.** Other labels

### CQ-051 · feature 123

**Question.** With `relaunch.owner: root`, do `supervise watch`, `observe` and `auto` still relaunch?

**Sources.** Owner ruling 6

**Recommended answer, on which the specs proceed.** No: they only read and print

**If answered otherwise.** The verbs relaunch as well, and two owners can act on one stop

### CQ-053 · feature 123

**Question.** Which literals does the second classifier table add?

**Sources.** Owner ruling 6; DV-074

**Recommended answer, on which the specs proceed.** Four refusals, `blocked-on-human`, `lease-lost`, `stop-not-retryable`, `relaunch-held`, and one approval, `classified-crash`

**If answered otherwise.** Fewer new literals

### CQ-058 · feature 118

**Question.** How long is the grace period when the first-failure predicate stops a job?

**Sources.** Owner ruling 52; R27

**Recommended answer, on which the specs proceed.** 10 s, with its own key

**If answered otherwise.** Another default

### CQ-066 · feature 103

**Question.** Does switching the ledger and handoff off (profile row 8) stop the whole ledger?

**Sources.** F100 annex X §X.7 row 8; F100-FR-069; owner ruling 9

**Recommended answer, on which the specs proceed.** No: only the records per pass and the handoff stop. The records at the start and the end of each phase attempt stay, because counts must survive a resume

**If answered otherwise.** Counts would not survive a resume under the `parity` profile

### CQ-067 · feature 103

**Question.** With which result of the pass loop is a stop before a pass reported, when a source changed? F100 annex E §E.4 has no row for it

**Sources.** F100 annex E §E.4; owner ruling K3

**Recommended answer, on which the specs proceed.** `exit_code` 3 with a field `blocked` set to `source-changed`

**If answered otherwise.** Annex E needs a new code of the pass loop

### CQ-069 · feature 103

**Question.** Where does the path in the index of verification obligations point?

**Sources.** Owner ruling 54; F100 annex B §B.5

**Recommended answer, on which the specs proceed.** To the logical name `feature:<slug>:verification:test-plan`

**If answered otherwise.** Only the logical name changes

### CQ-072 · feature 102

**Question.** How does `resume` continue a run that was launched through the runtime root? The launch record has no field for `--reset-counts` or for the flag of ruling P12

**Sources.** F100 annex B §B.7; owner rulings 8, P12

**Recommended answer, on which the specs proceed.** The route of the last launch is taken again; the launch record gains two truth values, `resetCounts` and `acceptSourceChange`

**If answered otherwise.** Another route or other field names

### CQ-073 · feature 102

**Question.** What does `resume` do on a run that is `finished`? The baseline runs the release verification again; the run-state machine has no transition out of `finished`

**Sources.** F100 annex E §E.2; baseline `orchestrator.sh`; owner ruling K2

**Recommended answer, on which the specs proceed.** Exit 3, nothing to resume

**If answered otherwise.** A transition out of `finished` in feature 100, and a register row if the as-is rerun is not kept

### CQ-074 · feature 102

**Question.** Which exit code has a failed write of the run snapshot?

**Sources.** F100 annex G §G.4; owner ruling K6

**Recommended answer, on which the specs proceed.** 1 in the foreground; the outcome `refused` for `launch`

**If answered otherwise.** Another code

### CQ-075 · feature 102

**Question.** Which rank has the run snapshot at a launch that continues a run? The precedence of ruling 10 says "on resume only"

**Sources.** Owner rulings 8, 10; F100 annex X §X.2

**Recommended answer, on which the specs proceed.** The same as at `resume`; `--new-run` is the way to new pinned values

**If answered otherwise.** The launch resolves configuration afresh, so a continued run can change its pinned values

### CQ-076 · feature 102

**Question.** Does the foreground `run` continue an unfinished run, and accept `--new-run` and `--reset-counts`?

**Sources.** Owner rulings 8, 9; F100 annex G §G.1

**Recommended answer, on which the specs proceed.** Yes

**If answered otherwise.** A foreground rerun after a stop restarts the counts, against ruling 9

### CQ-077 · feature 102

**Question.** Which exit code has the refusal of `resume` when the lock's owner is dead and a process group of it survives?

**Sources.** Owner ruling K2; F100 annex G §G.4

**Recommended answer, on which the specs proceed.** 5

**If answered otherwise.** 3

### CQ-079 · feature 102

**Question.** Which class has a key of the run snapshot that has none, pinned or tunable?

**Sources.** Owner ruling 10; F100 annex X §X.6 row 76

**Recommended answer, on which the specs proceed.** `pinned`

**If answered otherwise.** Row 76 says "widening", which is a rule for trust classes

### CQ-080 · feature 115

**Question.** Which fallback reason does a run announce while the tripwire record exists? The closed set has none that fits

**Sources.** F100 annex X §X.6 row 59; owner ruling 42

**Recommended answer, on which the specs proceed.** A sixth member, `tripwire`

**If answered otherwise.** Another member, or `config` with a detail

### CQ-081 · feature 115

**Question.** When are the fallback reasons `single-unit` and `no-check` decided?

**Sources.** R27; owner ruling 44

**Recommended answer, on which the specs proceed.** At engagement and after a unit, never before the first accepted checkpoint

**If answered otherwise.** If decided at launch, the announcement differs in the second suite and needs a register row

### CQ-082 · feature 115

**Question.** How does the `[LOOP]` line say that only basic protection holds?

**Sources.** F100 annex G §G.3; owner ruling 38

**Recommended answer, on which the specs proceed.** As a suffix of the value: `protection=detect,basic`

**If answered otherwise.** A new key in the line grammar

### CQ-088 · feature 113

**Question.** How does a host hook know that it runs inside a child process of a run, where it must stay silent?

**Sources.** Owner ruling 36; R3, R5

**Recommended answer, on which the specs proceed.** The harness adapter switches customizations off, and the hook prints nothing as a second guard

**If answered otherwise.** A marker in the environment, which feature 100 would define

### CQ-090 · feature 108

**Question.** Does `reverse` detach by default?

**Sources.** Owner ruling 25; baseline wrapper

**Recommended answer, on which the specs proceed.** No. A flag `--detach` makes the run request of kind `engine`, and the host skill passes it. The baseline is kept without a register row

**If answered otherwise.** If detached is the default: a register row and a waiver on FX-30

### CQ-094 · feature 119

**Question.** Which lines does default output print for the inspection verbs?

**Sources.** F100 annex G §G.3; owner ruling 68

**Recommended answer, on which the specs proceed.** `[SPECSTRIDE-…]` lines and a closed set of failure reasons, as the spec of feature 119 lists them

**If answered otherwise.** The line table and the failure reasons change

### CQ-095 · feature 119

**Question.** Does the byte limit of host-facing output apply to the follow forms and to the usage text, and what lifts it?

**Sources.** Owner ruling 65; R17

**Recommended answer, on which the specs proceed.** The cap applies to what is printed before following; the usage text is at most 2,240 bytes; `--verbose` lifts the cap on a success

**If answered otherwise.** Other rules for the follow forms

### CQ-097 · feature 119

**Question.** Is the spec path in `phases` printed in compatibility output as the baseline prints it?

**Sources.** Owner ruling 68

**Recommended answer, on which the specs proceed.** Yes; a relative path only in default output

**If answered otherwise.** Only compatibility output changes

### CQ-098 · feature 119

**Question.** Which exit status has a flag given without its value? The baseline exits 127 on the reference shell; F100 annex G has no row for it

**Sources.** Baseline `specstride`; owner ruling K6

**Recommended answer, on which the specs proceed.** The baseline's 127

**If answered otherwise.** Exit 3, with a register row

### CQ-109 · feature 134

**Question.** The brief says a fresh pass of pi runs without a session, but session continuation needs a session minted per phase attempt

**Sources.** Brief 134; owner rulings 7, 58; R9

**Recommended answer, on which the specs proceed.** A fresh pass keeps no session unless a later pass of its phase attempt can continue it; the first pass of such an attempt keeps its session under the minted id

**If answered otherwise.** Every pass keeps a session, or none does

### CQ-124 · feature 128

**Question.** How is the nonce of a critic call kept out of exported content?

**Sources.** R11 T-05; owner rulings 43, P16

**Recommended answer, on which the specs proceed.** Critic content is exported after the call has returned, with the nonce replaced by its hash

**If answered otherwise.** The nonce reaches a telemetry back end while the call is open, which weakens the verdict binding

### CQ-127 · feature 128

**Question.** Does the shipped collector gain a traces pipeline, now that content goes on spans?

**Sources.** Owner ruling 43; baseline telemetry stack

**Recommended answer, on which the specs proceed.** No, as the baseline; the stack is an optional asset

**If answered otherwise.** The shipped stack differs from the baseline, with a register row

### CQ-129 · feature 127

**Question.** Does the ceiling of 24 hours of ruling 28 run per pause or per episode?

**Sources.** Owner ruling 28

**Recommended answer, on which the specs proceed.** Per episode: it runs until the next successful call of the role

**If answered otherwise.** A role that is limited again after each resume never reaches the ceiling

### CQ-130 · feature 127

**Question.** Does `--reset-counts` on `resume` reset the spend ledger?

**Sources.** Owner rulings 8, 9; DP-030

**Recommended answer, on which the specs proceed.** No; only a new run starts a new ledger

**If answered otherwise.** A hard spending cap can be reset by a flag

### CQ-132 · feature 127

**Question.** Does a critic on a metered endpoint that is picked automatically get a default spending cap?

**Sources.** Owner ruling 60

**Recommended answer, on which the specs proceed.** No: without a cap that the consumer declared it is not picked, with the reason `no-cap`

**If answered otherwise.** A default cap value has to be chosen

### CQ-133 · feature 127

**Question.** Do spend records with the billing mode `unknown` count against a hard ceiling?

**Sources.** Owner ruling 66; R14

**Recommended answer, on which the specs proceed.** No; they count towards observation only

**If answered otherwise.** A run under a subscription on a harness with unknown billing can be blocked wrongly

### CQ-134 · feature 127

**Question.** Does the wall-clock budget survive a relaunch?

**Sources.** Baseline `orchestrator.sh`; owner ruling 9

**Recommended answer, on which the specs proceed.** No; it is measured per engine start, as at the baseline

**If answered otherwise.** Another clock rule, with a register row

### CQ-136 · feature 127

**Question.** How does the router learn that the target of an escalation is limited?

**Sources.** Owner ruling 47; F100 annex D §D.4

**Recommended answer, on which the specs proceed.** By a query of the state of the limit window

**If answered otherwise.** A new router signal in feature 100

### CQ-139 · feature 122

**Question.** What signs the archive of `state export`, and does the approval key travel with it?

**Sources.** Owner rulings 22, 33

**Recommended answer, on which the specs proceed.** The archive holds the approval key and the ledger key and is signed with the approval key; it is readable by its owner only; export and import refuse a location inside the working tree

**If answered otherwise.** Without the keys, approvals cannot be verified on another machine, and import would have to sign again

### CQ-140 · feature 122

**Question.** How does a consumer free a lock that stays `held-foreign` or `unknown`?

**Sources.** R2v; owner ruling 23; F100 annex G §G.1

**Recommended answer, on which the specs proceed.** No command in Wave 1; the refusal and the doctor finding name the holder. A command `state unlock` is proposed to feature 100

**If answered otherwise.** One more command and one more requirement

### CQ-144 · feature 125

**Question.** What happens when the initial record of a pass shows a loaded plugin, host hook or tool server, although customizations are switched off?

**Sources.** Owner ruling 36; R3v (managed settings still apply)

**Recommended answer, on which the specs proceed.** For a proposer: a warning, and the pass goes on. For a critic: the call is refused

**If answered otherwise.** A halt for both, which stops runs on machines with settings managed by an administrator

### CQ-146 · feature 125

**Question.** Which default has the spending cap per call of the Tier 1 critic?

**Sources.** Owner ruling 60; R5

**Recommended answer, on which the specs proceed.** None until the paid probe fixes it; the doctor warns; one turn and the budget of the prompt size bound the call

**If answered otherwise.** A default value chosen without a measurement

### CQ-147 · feature 125

**Question.** Are instruction files of the project loaded into a proposer pass?

**Sources.** Owner rulings 36, 37

**Recommended answer, on which the specs proceed.** No; customizations off drops them, and the standing prompt is complete without them

**If answered otherwise.** They are loaded, and repository text steers the proposer outside the prompt assembler

### CQ-148 · feature 125

**Question.** Which version range has the Agent SDK transport?

**Sources.** Owner rulings 20, 70; R1

**Recommended answer, on which the specs proceed.** The 0.3 line from 0.3.284, with a warning outside it

**If answered otherwise.** Another range

### CQ-149 · feature 138

**Question.** Under the `parity` profile, does the containment value C0 of the profile stand for the consumer's opt-in to no containment, which a proposer without a sandbox needs?

**Sources.** F100-FR-111; owner rulings 34, P2; profile row 25

**Recommended answer, on which the specs proceed.** Yes

**If answered otherwise.** The oracle's fixtures with prime as proposer are refused at launch

### CQ-152 · feature 138

**Question.** Feature 109 has one generic message for an executable that is not found; the as-is messages of prime also name the variable that sets the executable

**Sources.** Baseline; F109 seam; owner ruling 68

**Recommended answer, on which the specs proceed.** The adapter supplies its as-is messages

**If answered otherwise.** The as-is messages need waivers

### CQ-155 · feature 105

**Question.** How are the sub-commands of the public verb `verify` spelled?

**Sources.** Owner ruling 26; F100 annex G §G.1

**Recommended answer, on which the specs proceed.** The seven names of the baseline: `create`, `validate`, `slice`, `scaffold`, `run`, `prestage`, `prestage-report`

**If answered otherwise.** A mapping table for the parity tests

### CQ-156 · feature 110

**Question.** Which default has K, the number of critic rejections after which the model tier is bumped?

**Sources.** Owner ruling 48; R25 F-8, which names K without a value

**Recommended answer, on which the specs proceed.** 2, below the reject limit of 3

**If answered otherwise.** Another default

### CQ-157 · feature 110

**Question.** At which rank of the precedence do the values of the `parity` profile stand?

**Sources.** Owner ruling 10; LR-10

**Recommended answer, on which the specs proceed.** At the lowest rank, as the default of each switch, so that a fixture can still name roles and the second suite can set row 1

**If answered otherwise.** At a higher rank a fixture cannot override a profile value

### CQ-158 · feature 110

**Question.** Where in the precedence do a per-phase timeout declared in the verification-commands document, and a learned value, stand?

**Sources.** Owner ruling 10; baseline `resolve_proposer_timeout`, `resolve_yield_poll`

**Recommended answer, on which the specs proceed.** The declared value is the default of the per-phase key; a learned value follows the baseline's order per knob: the learned pass ceiling beats a global flag, and the learned yield poll loses to an explicit setting

**If answered otherwise.** One rank for all learned values, which differs from the baseline for one of the two knobs

### CQ-159 · feature 110

**Question.** How is a credential of a harness of kind `cli` bound to a host?

**Sources.** Owner ruling 61; R11

**Recommended answer, on which the specs proceed.** To the process of that harness only; the bound host is null

**If answered otherwise.** Another binding

### CQ-163 · feature 129

**Question.** The precomputed status line carries `validUntil`, but a run that rests has no lease

**Sources.** F100-FR-161; owner ruling 29

**Recommended answer, on which the specs proceed.** The value `none`, with no expiry

**If answered otherwise.** The shim of the host needs another rule

### CQ-164 · feature 129

**Question.** The cursor of `wait` (file, offset, last sequence number) does not move when only a state file or the clock changes

**Sources.** F100 annex G §G.6; owner ruling 65

**Recommended answer, on which the specs proceed.** The printed token also carries 8 hex characters of a hash of the change signature

**If answered otherwise.** Changes in state files or in time are missed by `wait`

### CQ-165 · feature 129

**Question.** How long may the default output of `status` be?

**Sources.** Owner ruling 65

**Recommended answer, on which the specs proceed.** 420 bytes in total (150 tokens at 2.8 bytes per token) and 120 bytes per attention line

**If answered otherwise.** Other caps

### CQ-166 · feature 129

**Question.** The launch record gives `refusal` as free text; the read model needs the reason and the file separately

**Sources.** F100 annex B §B.7; owner ruling K3

**Recommended answer, on which the specs proceed.** Two separate values

**If answered otherwise.** The attention item for a changed source cannot name the file

### CQ-169 · feature 129

**Question.** Does the rule that a line with no as-is equivalent is never printed under the `parity` profile cover `--json` output?

**Sources.** F100-FR-176; owner ruling 68

**Recommended answer, on which the specs proceed.** Yes: `status --line`, `status --json` and `wait` print nothing under the `parity` profile

**If answered otherwise.** Those outputs appear under `parity`, outside every compared stream

### CQ-171 · feature 101

**Question.** What does the approval commit hold of the state? The baseline commits the state directory unless the project ignores it (B-0277); the control plane is now outside the tree

**Sources.** B-0276 to B-0278; DV-006; owner rulings 22, 50

**Recommended answer, on which the specs proceed.** Every change of the working tree is staged, as at the baseline: the workspace part is in the commit, the control plane is not. The oracle compares the commit without state paths

**If answered otherwise.** A register row, and a normalization rule or a waiver on the surface `repository`

### CQ-172 · feature 101

**Question.** Is the refusal of a launch for ticked phases that have no approval record active under the `parity` profile? The baseline starts such a run

**Sources.** F100-FR-059; DV-029; B-0271; owner ruling 22

**Recommended answer, on which the specs proceed.** Off under the `parity` profile, with a new profile row

**If answered otherwise.** Fixtures with tasks ticked beforehand read `different`

### CQ-173 · feature 101

**Question.** May the verdict record and the feedback file hold the nonce in clear after the call has returned? The baseline writes it into both, and the oracle compares them

**Sources.** F100-FR-139; B-0876, B-0881; owner ruling P16; CQ-124

**Recommended answer, on which the specs proceed.** Yes, in these two records only; events, spans, the ledger and the approval record hold the hash

**If answered otherwise.** Hash only: a switch, a register row and a waiver on the surface `state`

### CQ-174 · feature 101

**Question.** Which stop reason does the terminal record carry on an exit that has no member in the enumeration: 1 internal, 3 invalid input, 5, 70?

**Sources.** F100-FR-148; F100 annex E §E.4; owner ruling K4; CQ-020

**Recommended answer, on which the specs proceed.** None: the field is empty, `retryable` is false, and no as-is stop line is written

**If answered otherwise.** New stop reasons, each with a register row and a mapping in the compatibility projection

### CQ-175 · feature 149

**Question.** Which default has K for the tier bump? (The same question as CQ-156, raised by feature 110)

**Sources.** Owner ruling 48; R25 F-8

**Recommended answer, on which the specs proceed.** 2; no research report recommends a value

**If answered otherwise.** Another default

### CQ-179 · feature 105

**Question.** Does a condition such as `tainted` on the result of a command fail the verification gate?

**Sources.** Owner ruling 41; F100 annex C §C.8; F100-FR-136

**Recommended answer, on which the specs proceed.** No: the gate decides on exit results; the condition is carried to the critic and is never stated as a pass

**If answered otherwise.** A tainted command rejects the phase attempt without a critic call, which ruling 41 (approval stays possible) does not allow

### CQ-183 · feature 100, 110, 130, 134, 138, 142

**Question.** Ruling 34 says no containment "only by opt-in in user config", and ruling P2 says `loop.parallel.allow_detect` is set "in user config". Does "user config" stand for the user configuration only, or for every consumer-controlled source of ruling 35 (user configuration, environment, flag)?

**Sources.** `APPROVAL.md` rulings 34, 35 and P2; F100-FR-111; F100-FR-112; F110-FR-019; CQ-149 (asks only what C0 means under `parity`); review item W-100-23 (medium)

**Recommended answer, on which the specs proceed.** The user configuration only, as both rulings are worded (source of the answer: B-8.4a for ruling 34 ("until it is answered read (a)"); the orchestrator's reading, no report recommends an answer for ruling P2)

**If answered otherwise.** Every consumer-controlled source counts: the repair of ruling 34 in features 109, 110, 131 and 134 is undone and F100-FR-111 gains "the environment or a flag"; F100-FR-112 stays as it is

### CQ-184 · feature 100, 102, 119

**Question.** F119-FR-009 lets `resume` exit 1 when the workspace has no state; F102-FR-012 lets it exit 3 when no run snapshot exists, and makes that check the first. For a workspace without state both apply. Which check comes first?

**Sources.** Ruling K2 (3 when there is nothing to resume; the oracle maps the old code 1); ruling K6 (each process keeps today's codes); register row DV-021 (cites B-1494 to B-1496 only); baseline items B-1482 and B-1494; annex G §G.4; review item W-100-24 (medium)

**Recommended answer, on which the specs proceed.** As at the baseline (B-1482 before B-1494): the state check of F119-FR-009 comes first and exits 1; then F102-FR-012 exits 3 (source of the answer: B-8.2b)

**If answered otherwise.** `resume` leaves the list of F119-FR-009 and exits 3 for a workspace without state; the oracle maps 1 to 3 for that fixture as well, and DV-021 names B-1482

### CQ-190 · feature 105

**Question.** Ruling P11 lets two verification commands run side by side on the strength of their declared reads and writes. F105-FR-016 accepts `reads`, `writes`, `sideEffects` and `resource` from the verification-commands document, a file of the project; F107-FR-037 lets them enter derivation only from user configuration, the environment or a flag, and never from repository text. Which source is allowed?

**Sources.** Ruling P11; ruling 35 (project configuration may narrow a run and never widen it); F105-FR-016; F105-FR-045 ("a plan source and is not configuration"); F107-FR-008; F107-FR-037; F100-FR-099; F148-FR-011; review item W-105-03 (medium)

**Recommended answer, on which the specs proceed.** Not from repository text: F107-FR-037 stands, and a declaration that lacks that provenance counts as undeclared, which by ruling P11 means serial (source of the answer: the orchestrator's reading, no report recommends an answer; B-8.4c leaves the choice to the orchestrator and recommends no answer)

**If answered otherwise.** Repository text may declare them: F107-FR-037 is limited to the write scopes of tasks, and a declaration from the verification-commands document is frozen in the check manifest at launch

### CQ-191 · feature 115

**Question.** Ruling 46 says escalation never lands on the critic's model. Ruling 49 says a higher effort on the critic's model is not a collision and is allowed with the same-model warning. The escalation rule skips a rung on the critic's model whatever the effort. Does ruling 49 allow an escalation rung that is the critic's model at a higher effort?

**Sources.** Rulings 46 and 49; DP-052 (R25 open question 4; R23v V-13, O-9), whose stated consequence of the other answer is "Escalation is skipped in most Claude-only runs"; F100-FR-130; F115-FR-034; F124-FR-045; the table "Where rulings meet" of `feature-briefs.md` D.8, which does not hold the point; review item W-115-02 (medium)

**Recommended answer, on which the specs proceed.** Yes, with the same-model warning (source of the answer: B-8.4b)

**If answered otherwise.** One sentence in F115-FR-034 and in F100-FR-130 says that a rung on the critic's model is skipped whatever the effort, citing rulings 46 and 49

### CQ-198 · feature 100

**Question.** Ruling P5 says the ceiling of the workers is configurable. Has the ceiling itself an upper bound?

**Sources.** `APPROVAL.md` ruling P5; CQ-006; F100-FR-127

**Recommended answer, on which the specs proceed.** No bound in the product: `loop.parallel.workersMax` is a whole number of 1 or more, a widening key, so only the consumer can raise it (source of the answer: the second pass of feature 100, N-1)

**If answered otherwise.** A bound (for example 8) is added to F100-FR-127, F142-FR-019 and the key list

### CQ-201 · feature 100

**Question.** Does "unknown subcommand" in F100-FR-182 mean the first argument only?

**Sources.** Annex G §G.4; ruling K6; F104-FR-020

**Recommended answer, on which the specs proceed.** Yes (source of the answer: the second pass of feature 100, N-4; finding 1 of the first pass)

**If answered otherwise.** F104-FR-020 changes to exit 1 for an unknown sub-verb of `spec`, against the baseline

### CQ-204 · feature 100

**Question.** F100-FR-140 skips a target on the critic's model whatever the effort, where CQ-191 asks whether a higher effort on that model is allowed

**Sources.** F100-FR-140; CQ-191; ruling 49; F100-FR-130 (already repaired)

**Recommended answer, on which the specs proceed.** F100-FR-140 takes the same reading as F100-FR-130: a rung that shares only the model is allowed, with the warning; only a rung equal in model and effort is skipped (source of the answer: the second pass of feature 100, N-7)

**If answered otherwise.** F100-FR-140 stands, and the two requirements disagree

### CQ-205 · feature 100

**Question.** F100-FR-028 lets the audience change by environment or flag, where ruling 2 says user configuration

**Sources.** F100-FR-028; ruling 2

**Recommended answer, on which the specs proceed.** Ruling 2 stands for every switch: the words "the environment or a flag" leave F100-FR-028 (source of the answer: the second pass of feature 100, N-8)

**If answered otherwise.** The audience keeps its wider sources, and ruling 2 names the exception

### CQ-212 · feature 101

**Question.** Does the move of the proposer's notebook, handoff and outbox out of the working tree hold for a diagnostician with read-only tools, and does a failed proof of the diagnostician halt the run?

**Sources.** F100-FR-087; F100-FR-088; rulings 57, 57a, D1; B-0283 (a failure of the diagnostician only warns); raised in `specs/101-gate-and-verdict/repair-report.md`, N-1

**Recommended answer, on which the specs proceed.** The move holds for every critic-class call. A failed proof of the diagnostician makes no call, warns and writes no hint; it does not halt, because the critic call of the same phase gate has already proven, or will prove, the same entry of the role plan. (Who: the repair report of 101 gives the answer without naming a source or "my reading".)

**If answered otherwise.** If it halts: F101-FR-020 gains exit 3 with `critic_config`, and the table of halts names the diagnostician

### CQ-216 · feature 105

**Question.** May the verification-commands document declare `resource` and `steps`? CQ-190 names reads, writes and side effects only. An exclusive resource can only make a run more serial; steps change what runs (Note: near CQ-190, which asks which source is allowed.)

**Sources.** F105-FR-016; annex D §D.8; ruling 35; raised in `specs/105-verification/repair-report.md`, N-105-2

**Recommended answer, on which the specs proceed.** Yes for both: `resource` narrows, and `steps` are commands declared like any other. (Who: the repair report of 105, no source named.)

**If answered otherwise.** They leave F105-FR-016 as the three fields did

### CQ-219 · feature 112

**Question.** Does the budget of 1,500 tokens of the doctor skill count the resident listing of the skill?

**Sources.** Ruling 65; annex G §G.5; F113-FR-036; R16 F4 and open question 1; `specs/113-host-claude-code/plan.md:135`; raised in `specs/112-doctor/repair-report.md`, question 1

**Recommended answer, on which the specs proceed.** Yes, as R16 counts it; the body is then at most 2,080 bytes (742 tokens) beside a listing of 420 bytes. Source of the answer: R16 open question 1, which recommends the trimmed body. (Who: research report R16, per the repair report of 112.)

**If answered otherwise.** If the listing is outside, a body of 800 tokens fits (2,240 + 1,700 = 3,940 bytes) and the plan of 113 stands

### CQ-225 · feature 125

**Question.** The consumer set the bypass mode in user configuration and the precondition fails (no sandbox detected, or the user is root). Is the launch refused, or does the pass run in the accept-edits mode with a warning?

**Sources.** Ruling 34; CQ-183; F100-FR-111 (a proposer whose ceiling is C0 is refused at launch without the opt-in); R5 open question 1; raised in `specs/125-adapter-claude/repair-report.md`, N-1

**Recommended answer, on which the specs proceed.** Refused as a configuration error that names the missing part; no silent change of a mode the consumer chose. The spec proceeds on this (F125-FR-012). (Who: the repair report of 125, no source named.)

**If answered otherwise.** One sentence of F125-FR-012 and the test CT-125-33 change to a warning and the accept-edits mode

### CQ-226 · feature 125

**Question.** Does `harnesses.claude.transport` fall under the reading of CQ-183 (user configuration only)? F125-FR-034 allows user configuration, the environment or a flag (Note: CQ-183 is the same kind of question for other rulings.)

**Sources.** Rulings 20, 70; CQ-183 names rulings 34 and P2 only; raised in `specs/125-adapter-claude/repair-report.md`, N-2

**Recommended answer, on which the specs proceed.** No: the choice of a transport is no opt-out of containment. F125-FR-034 was left. (Who: the repair report of 125, no source named.)

**If answered otherwise.** F125-FR-034, T061 and `contracts/transport-and-sdk.md` lose "the environment or a flag"

### CQ-232 · feature 130

**Question.** May a critic-class call on dsh run with a customisation of the profile that gives the model no tool and cannot be switched off (a host hook, for example)? Row 131 of annex X §X.7 says customisations are never loaded into a critic-class call

**Sources.** Row 131; Principles VIII and IX; ruling 36; F130-FR-024; raised in `specs/130-adapter-dsh/repair-report.md`, N-2

**Recommended answer, on which the specs proceed.** No: refuse the role as for native memory, once capture 6 shows that such a customisation exists. Until then F130-FR-045 records and warns. (Who: "this repair's reading".)

**If answered otherwise.** F130-FR-045 stays

### CQ-233 · feature 130

**Question.** Does "user config" in ruling P15 mean the user configuration only? F130-FR-034 accepts the allowlist from user configuration, the environment or flags; the baseline sets it by a variable, and fixtures of FX-38 do (Note: CQ-183 is the same kind of question for rulings 34 and P2.)

**Sources.** Ruling P15; ruling 35; CQ-183; annex X §X.8 line 720; raised in `specs/130-adapter-dsh/repair-report.md`, N-3

**Recommended answer, on which the specs proceed.** Outside the `parity` profile the user configuration only; under the profile the as-is variable stays. (Who: "this repair's reading, by analogy with CQ-183".)

**If answered otherwise.** F130-FR-034 stays

### CQ-236 · feature 138

**Question.** What holds if the pinned version has a native memory that no switch turns off?

**Sources.** Ruling 37; F100-FR-082; CQ-189; raised in `specs/138-adapter-prime/repair-report.md`, CQ-pending-138-3

**Recommended answer, on which the specs proceed.** As the recommended answer of CQ-189 for dsh: reported as null, warned by the doctor, recorded per run; prime is refused as critic. (Who: "the orchestrator's answer to CQ-189, applied to a like case".)

**If answered otherwise.** If such a memory bars the proposer as well, F138-FR-046 refuses the launch

### CQ-237 · feature 143

**Question.** Does "with its entry in the store" in F143-FR-027 still have a meaning after ruling P6?

**Sources.** R29v PU-93; ruling P6; annex D §D.2 (`release` writes the worker root); raised in `specs/143-parallel-engine-services/repair-report.md`, N-143-1

**Recommended answer, on which the specs proceed.** No. The words are dropped from F143-FR-027 in a later repair; `release` removes the tree and its temporary directory, and snapshots leave the store with `sweep`. (Who: the repair report of 143, no source named.)

**If answered otherwise.** `release` writes the store as well, and the table of annex D §D.2 changes

## Group 3 — the rest, by feature

### CQ-200 · feature 100

**Question.** Which YAML parser does the product use? No plan names one; feature 100 proceeds on the package `yaml` (research D-8), unverified

**Sources.** `specs/110-config-and-terms/plan.md:23`; W-X-27

**Recommended answer, on which the specs proceed.** The package `yaml`, pinned by feature 110 (source of the answer: the second pass of feature 100, N-3)

**If answered otherwise.** Feature 110 names another parser; D-8 of feature 100 follows

### CQ-202 · feature 100

**Question.** F100-FR-231 keeps the as-is fallback under `parity` (CQ-145). The adapters 125 and 131 refuse a critic whose window is unknown in every profile. Which stands for the adapters?

**Sources.** F100-FR-231; CQ-145; the reports of features 125 and 131

**Recommended answer, on which the specs proceed.** Feature 100 stands as the compromise of CQ-145: under `parity` every harness uses its as-is fallback; outside `parity` an adapter may refuse where the baseline refused. The adapters need no change and no register row (source of the answer: the second pass of feature 100, N-5)

**If answered otherwise.** The adapters take the fallback too: their refusal sentences get `divergence:` rows of their own

### CQ-203 · feature 100

**Question.** In which file is the result of the traceability check recorded, so that a test of the product (T102 of 109) can read it?

**Sources.** Item 3 of the report of 109; W-100-21

**Recommended answer, on which the specs proceed.** `docs/ecosystem/traceability-check-result.json`, written by `docs/ecosystem/check-traceability.py` through a `--result <path>` flag; until the file exists the test skips as today. The script is the orchestrator's file (source of the answer: the second pass of feature 100, N-6)

**If answered otherwise.** The result stays on standard output only, and the skip keeps blocking a release

### CQ-206 · feature 100

**Question.** The "exact versions" part of the control of T-44 has no requirement

**Sources.** The worklist; T-44

**Recommended answer, on which the specs proceed.** One sentence in annex A §A.3: a tool the control of T-44 names runs at the version the control pins. No requirement id is spent on it (source of the answer: the second pass of feature 100, N-9)

**If answered otherwise.** The control stays without a requirement, and the check has no anchor in the spec

### CQ-207 · feature 100

**Question.** Where do the two file ports of grounding and hiding live?

**Sources.** Item 1 of the report of 117; F100-FR-234

**Recommended answer, on which the specs proceed.** 117's plan stands: the types in the core, the implementation in `packages/runtime/src/ports/critic-input-files.ts`, composed by 122; F100-FR-234 keeps its three Wave 1 edge interfaces and names no fourth (source of the answer: the second pass of feature 100, N-10)

**If answered otherwise.** The interface moves into the `contracts` package and the implementation into an edge package; F100-FR-234 gains a fourth Wave 1 interface

### CQ-208 · feature 100

**Question.** Does the state that a host package keeps in the data directory of the host (the two markers of 113) get a logical name and a place, for example `host-data`?

**Sources.** Item 2 of the report of 113; annex B §B.5

**Recommended answer, on which the specs proceed.** Not in Wave 1: no feature reads that state across a boundary; the two markers stay local to 113. If a second host needs it, annex B §B.5 gains the place `host-data` and the names then (source of the answer: the second pass of feature 100, N-11)

**If answered otherwise.** Annex B §B.5 gains `host-data` now, with two names that nothing reads

### CQ-209 · feature 100

**Question.** What does the entry of the resolved registry name for a harness whose baseline pass is unpiped (dsh, Codex) or takes the legacy path (Claude), under `parity`?

**Sources.** Item 4 of the report of 126; CQ-151; `specs/130-adapter-dsh/contracts/descriptor-dsh.json:16`

**Recommended answer, on which the specs proceed.** The entry names no stream format for the route: the tap takes the `claude` format by default, as at the baseline. No field is added to the registry schema of §C.6; the field of the descriptor of 130 is that feature's own data (source of the answer: the second pass of feature 100, N-12)

**If answered otherwise.** The registry schema gains an optional field for the parity stream format, and §C.6 and the descriptor agree on its spelling

### CQ-210 · feature 100

**Question.** What is the status of `--no-critic-autopick`, which is in no annex of feature 100, and of `--resolve-roles`?

**Sources.** Report of 124; `contracts/config-keys.json`; annex G §G.1; CQ-106

**Recommended answer, on which the specs proceed.** `--no-critic-autopick` stays "proposed (R20, R16)" until a feature claims it; it enters an annex of feature 100 only when the owner answers. `--resolve-roles` waits on CQ-106, which is still open on the spelling (source of the answer: the second pass of feature 100, N-13)

**If answered otherwise.** The flag is dropped from the key list, and 124's scenario loses its anchor

### CQ-185 · feature 100, 111, 115, 117, 118

**Question.** F100-FR-012 forbids a core package to start a process or open a connection and does not name the file system; the package graph forbids write calls of `node:fs` to `@specstride/layer-parallel` only. Four plans read the rule in three ways. May a core package import `node:fs`?

**Sources.** F100-FR-012; F100-FR-234 (the kernel offers "the atomic write" among "what the core may not import", and an edge package "MAY touch the file system ... on behalf of a core package"); `specs/100-specstride/contracts/data/package-graph.json`; `architecture.md` LR-1; review item W-100-25 (medium)

**Recommended answer, on which the specs proceed.** No: a core package reads and writes files through the kernel and through the ports of the edge packages; annex A says so in F100-FR-012 (source of the answer: the orchestrator's reading, no report recommends an answer; B-8.3b asks the orchestrator to decide and recommends no answer)

**If answered otherwise.** A core package may import `node:fs`: the plans of 115 (`plan.md:164-166`) and 111 (`plan.md:24`) are corrected, the edge package `@specstride/layer-micro-io` has no reason, and 117 stays as planned

### CQ-022 · feature 100, 123

**Question.** The sources give EP-19 (stage kind and precondition check) as two registries and no operations

**Sources.** `architecture.md` section 5; R15v A-5

**Recommended answer, on which the specs proceed.** Three operations: `validate`, `run`, `evaluate`

**If answered otherwise.** The conformance suite of feature 123

### CQ-026 · feature 100, 141

**Question.** How much of the old side of the layout table, and which logical component names, belong in the specification?

**Sources.** R18 N-02, N-15 to N-18

**Recommended answer, on which the specs proceed.** The names of feature 100 annex X §X.8; the spec holds the rows that two or more features compare (28), and the full old side (the 199 `file` items) is plan data that feature 141 completes

**If answered otherwise.** If the full table must be normative text: annex X grows by about 170 rows

### CQ-018 · feature 100, all

**Question.** The sources name five logical names for state; the contracts need about 75

**Sources.** `architecture.md` SL-4; R15 A-5.3; R15v P-8

**Recommended answer, on which the specs proceed.** The table of feature 100 annex B §B.5 as written

**If answered otherwise.** Every feature cites these names; a rename is cheap only before the other features are specified

### CQ-019 · feature 100; 101, 102, 103, 122, 123, 127, 129

**Question.** The sources describe the record schemas (ledger, approval record, terminal record, launch record, lease, process registry, inbox, run snapshot, pause record, `supervision.json`, run record) without fixing field names

**Sources.** R15 A-5, R15v E-2, P-8

**Recommended answer, on which the specs proceed.** The field lists of feature 100 annex B §B.6 to §B.18 and annex E §E.2 as written

**If answered otherwise.** Schema files in the plan and the readers in seven features

### CQ-025 · feature 100; 115, 123, 127, 110

**Question.** Which operators may a predicate of a rule table use, and in which order are rows evaluated?

**Sources.** `architecture.md` LR-7; R25, R27

**Recommended answer, on which the specs proceed.** Nine operators as listed in feature 100 annex X; the first matching row fires; a default row is required

**If answered otherwise.** The rule tables of four features

### CQ-213 · feature 101

**Question.** Are the verdict record and the feedback sinks in the sense of F100-FR-205, so that the reply in them is redacted and cut? (Note: near CQ-173, which asks about the nonce in the same two records.)

**Sources.** F100-FR-009; F100-FR-205; F101-FR-012; CQ-173; register row DV-095; raised in `specs/101-gate-and-verdict/repair-report.md`, N-2

**Recommended answer, on which the specs proceed.** No for both under the `parity` profile, where they hold the reply as it was and the oracle compares them. Outside the profile the orchestrator decides; the spec proceeds on "as it was", because the next prompt reads the feedback through the assembler, which frames it as data. (Who: the repair report of 101, no source named.)

**If answered otherwise.** If yes: F101-FR-012 and F101-FR-052 change, and the row of DV-095 names the two records

### CQ-187 · feature 101, 141, 130, 131

**Question.** Is a missing critic credential a critic configuration error (engine exit 3) or a failed critic call? F101-FR-010 says configuration error; the baseline scores it as a failed call (MALFORMED, engine exit 1 after the limit)

**Sources.** Baseline `lib/critic.py` at `9cab15d`, run read-only by feature 141 on 2026-09-29; `specs/141-parity-oracle/followup-report.md`; CQ-116, CQ-141

**Recommended answer, on which the specs proceed.** A failed call under the `parity` profile, as the code does; outside it feature 101 may keep exit 3 with a register row and a switch (source of the answer: feature 141, in its follow-up report)

**If answered otherwise.** Exit 3 everywhere: a register row and a waiver on every FX-07 scenario with a missing or invalid credential

### CQ-078 · feature 102

**Question.** The stop request has no field that says who asked

**Sources.** F100 annex B §B.11

**Recommended answer, on which the specs proceed.** `causedBy: operator` for every request

**If answered otherwise.** A field in the inbox request

### CQ-068 · feature 103

**Question.** Where is the cache lifetime of a session declared?

**Sources.** R24 (`session.ttl_seconds`); F100 annex C §C.2

**Recommended answer, on which the specs proceed.** A field of the descriptor's continuation record, with 300 s where none is declared

**If answered otherwise.** Another place or default

### CQ-039 · feature 104

**Question.** How is the resolved spec format handed to later readers of a run?

**Sources.** F100 annex B §B.12

**Recommended answer, on which the specs proceed.** Through the run snapshot, as a pinned value `spec.format`

**If answered otherwise.** Annex B needs a field for it

### CQ-040 · feature 104

**Question.** Where does an added spec format stand in the detection order against the fallback `native`?

**Sources.** F100 annex C §C.7; 028 FR-002

**Recommended answer, on which the specs proceed.** After the built-in path and content rules, before the fallback

**If answered otherwise.** The detection order changes

### CQ-045 · feature 104

**Question.** Two differences that no fixture reaches: the hash that ignores checkboxes also covers OpenSpec task lines with a dotted id; and a lower-case `## phase 1:` heading, which mixture-of-loops read, is not read by the port. Do they get register rows?

**Sources.** Baselines; DV-073

**Recommended answer, on which the specs proceed.** Yes, two rows, oracle handling "not observable"

**If answered otherwise.** They stay notes in the spec of feature 104

### CQ-214 · feature 104

**Question.** The staleness verdict (F104-FR-024, F104-FR-027: "one function") is in `@specstride/spec-formats`. `@specstride/core` may import `contracts` and `kernel` only, and feature 103 compares the hashes itself through the hasher (`specs/103-proposer-pass/plan.md:162`). How does a core package reach the one verdict function?

**Sources.** Package graph of feature 100; annex C §C.7 (EP-03 has five operations and no verdict); F104-FR-027; plan 103; raised in `specs/104-spec-input/repair-report.md`, question 1

**Recommended answer, on which the specs proceed.** The classification of the verdict (recorded hashes and hashes now give `unchanged`, `ticks-only`, `changed`, `unreadable`) moves into the hasher module of the kernel as a pure function, owner 104; the package `spec-formats` keeps the reading of files and the lines. No operation is added to EP-03. (Who: the repair report of 104, no source named. The report adds: "Not applied by me: it needs feature 100 or the orchestrator to decide. The feature proceeds on its text as it is.")

**If answered otherwise.** With a sixth operation of EP-03, annex C changes and the version of the extension point is touched. With the comparison left to each consumer, F104-FR-027 is not true for features 102 and 103

### CQ-215 · feature 105 (also cited in B-8.7-B)

**Question.** Which component starts a detached command staged before, and with which environment? It must never be ended at its deadline, which the check runner cannot promise; started by the kernel primitive it passes by the environment allow-list and the containment of the check runner (threat T-21)

**Sources.** F105-FR-035; F100-FR-234; annex C §C.8; profile row 125; B-1127; raised in `specs/105-verification/repair-report.md`, N-105-1; `docs/ecosystem/reviews/B-8.7-B.md`, N-105-1 (cited, not new)

**Recommended answer, on which the specs proceed.** The process primitive of the kernel, in a session of its own with standard input closed, with the environment the check runner would give. Feature 100 states the session and the closed input in F100-FR-234. (Who: the repair report of 105, no source named. B-8.7-B cites it "as feature 105 recommends: the kernel's process primitive, started by 105, with the environment of the check runner, which F148-FR-019 now supplies through EP-05".)

**If answered otherwise.** EP-05 gains a start option for a detached command without an end at the time limit, owned by 148; F105-FR-035 and T129 then name the check runner

### CQ-113 · feature 106

**Question.** What does an unknown value of the learning mode do?

**Sources.** F100 annex X §X.6 row 77; baseline `learn.py`

**Recommended answer, on which the specs proceed.** It is read as `off`, as feature 100 says

**If answered otherwise.** The baseline's behaviour is kept, or the value is a configuration error at load

### CQ-115 · feature 106

**Question.** Which feature owns the tamper bracket: the check, before and after, of the leading bytes of the event stream, the decision log and the observation file?

**Sources.** F100 annexes B and E; baseline

**Recommended answer, on which the specs proceed.** The engine executes it; the rule is a requirement of feature 106

**If answered otherwise.** The rule moves to the feature of the engine

### CQ-036 · feature 107

**Question.** May derivation settle the producer and disposition of an unchecked task by fact alone, without a judgment item?

**Sources.** The derivation guide of the mixture-of-loops baseline

**Recommended answer, on which the specs proceed.** Yes: the producer of an unchecked task is the stage that implements it

**If answered otherwise.** Judgment items grow with the number of tasks, and the printed total can no longer be independent of the size of the sources

### CQ-037 · feature 107

**Question.** Does `dry-run` write a launch record with mode `dry-run`? Feature 100 annex B §B.7 allows it; the success criterion says no run state is written

**Sources.** F100 annex B §B.7; decision 18

**Recommended answer, on which the specs proceed.** No record is written

**If answered otherwise.** If a record is wanted, the success criterion must exempt it

### CQ-091 · feature 108

**Question.** How are the comment argument and the verbs of `reverse` spelled?

**Sources.** F100 annex G §G.1

**Recommended answer, on which the specs proceed.** `--comment`; `reverse plan`, `reverse lint`, `reverse guard`, `reverse inventory`

**If answered otherwise.** Other spellings

### CQ-092 · feature 108

**Question.** At `reverse plan` the CLI writes two files of the control plane (the inventory and the verification commands). F100 annex B §B.5 names the CLI as their writer; F100-FR-003, F100-FR-004 and F100-FR-217 allow the CLI only inbox requests, launch records and the supervision record

**Sources.** F100 annex B §B.5; LR-3, LR-4

**Recommended answer, on which the specs proceed.** The rows of §B.5 stand and the exceptions of F100-FR-003 are widened by these two files

**If answered otherwise.** The runtime root writes both files at launch

### CQ-063 · feature 109

**Question.** In what unit is the budget of `harness verify` given, and how is it spelled?

**Sources.** R20 Q5; F100 annex G §G.1, §G.4

**Recommended answer, on which the specs proceed.** An argument of the command: a number of model calls and a time limit, and a spending cap for the cost class `metered`. Without it, exit 3

**If answered otherwise.** If it becomes a config key, it needs a row in the `parity` profile

### CQ-064 · feature 109

**Question.** The overlay marker of the baseline holds the owner's process id, the owner's start time, the creation time, and the scope word `critic`; feature 100's overlay schema has none of them

**Sources.** Baseline overlay tool at `9cab15d`; F100 annex C §C.16

**Recommended answer, on which the specs proceed.** The marker holds the fields of §C.16 and those three; `critic` is a value of the marker only, not of the configured scope

**If answered otherwise.** Without the owner fields, sweep and liveness (B-0411, B-0416, B-0417) cannot be ported

### CQ-217 · feature 109

**Question.** Descriptors are YAML files. Research D-8 of feature 100 makes the YAML parser a dependency of the configuration loader of feature 110 only, and `@specstride/harness` may import `contracts` and `kernel` only. How does the harness layer read `user:harness:<id>` and `package:harness:<id>`?

**Sources.** `specs/100-specstride/research.md` D-8; `specs/100-specstride/contracts/data/package-graph.json`; W-X-27; raised in `specs/109-harness-seam/repair-report.md`, N-1

**Recommended answer, on which the specs proceed.** Through a port: the CLI hands the parsed value to the descriptor loader at process start; the harness package names no parser. The plan proceeds on this. (Who: the repair report of 109, no source named.)

**If answered otherwise.** If the harness package may import the loader of 110, the package graph gains one permitted import

### CQ-218 · feature 109

**Question.** May a test with the prerequisite "effective user id 0" run in the hermetic tier of the build, or only at the release check?

**Sources.** F141-FR-037; `specs/141-parity-oracle/spec.md:314`; raised in `specs/109-harness-seam/repair-report.md`, N-2

**Recommended answer, on which the specs proceed.** Only where the runner is root: a skip in the build of a developer, a required run at the release check. (Who: the repair report of 109, no source named.)

**If answered otherwise.** If the build must never skip it, the build needs a container that runs as root

### CQ-160 · feature 110

**Question.** Are config keys spelled in one style? The proposals mix camelCase and underscores

**Sources.** F100 annex X §X.7; R16

**Recommended answer, on which the specs proceed.** The 43 rows of the `parity` profile keep the spelling they have; every other key is lowerCamelCase, with the suffixes `Sec`, `Ms`, `Min` and `Bytes`. (Feature 110 first proceeded on keeping the mix and changed this when it confirmed all 253 keys.)

**If answered otherwise.** One style for all keys changes 15 rows of the `parity` profile and the specs of features 103, 115 and 118; keeping the mix everywhere leaves 33 keys as they were proposed

### CQ-196 · feature 110

**Question.** The two sides of the baseline read the first variable of the pair `SPECSTRIDE_PRIME_FLEET_BIN`/`SPECSTRIDE_PRIME_BIN` differently for an empty value: the pass loop (`proposer.sh:609`) reads an empty first variable as unset and falls to the second, the critic (`lib/critic.py:2196`) reads only an absent variable as unset. Which reading does the port take?

**Sources.** baseline `9cab15d`: `proposer.sh:609`-`610`, `lib/critic.py:2196`-`2197`, `:2257`-`2258`, `.env.example:100`-`101`; the repair report of feature 138 (items 1 to 3); the second pass of feature 110 (B8)

**Recommended answer, on which the specs proceed.** An empty first variable is read as unset, the reading of the pass loop; the narrowest reading, and F110-FR-020 stands on it (source of the answer: the second pass of feature 110, verified at the baseline)

**If answered otherwise.** The alias-table row, F110-FR-020, §K.8 and its acceptance scenario 4 change: an empty first variable shadows the second on the critic side

### CQ-034 · feature 111

**Question.** R11 T-31 asks for a hash of the previous record in every event; the event envelope has none

**Sources.** R11 T-31; F100 annex X §X.1

**Recommended answer, on which the specs proceed.** Detect tampering by the sequence number only

**If answered otherwise.** The envelope gains a `prev` field, which every writer and reader must carry

### CQ-176 · feature 111

**Question.** The event types `run.started` and `run.ended` say "run" but bracket an engine start

**Sources.** F100 annex X §X.1; glossary

**Recommended answer, on which the specs proceed.** The spelling that feature 100 already uses is kept

**If answered otherwise.** A rename in feature 100 and in every reader

### CQ-177 · feature 111

**Question.** The limits, the retention and the time limit of a sink have no row in the `parity` profile

**Sources.** F100 annex X §X.7

**Recommended answer, on which the specs proceed.** Three rows, each with its default as the value under `parity`

**If answered otherwise.** No rows; the values are constants

### CQ-211 · feature 111

**Question.** Which of the four critic-pick event types stand in the catalogue: `critic.selected` alone, or also `roles.resolved`, `critic.passed-over` and `critic.diversity` (the proposals of 124)?

**Sources.** The catalogue of 111; `specs/124-harness-discovery-and-roles/contracts/output-lines.json`; F124-FR-046; the second pass of feature 111 (C8)

**Recommended answer, on which the specs proceed.** `critic.selected` alone, with the per-call warning on `critic.call` (the fields `diversity` and `sameModelWarning`); the three proposals wait for the owner, and a restoration is additive (source of the answer: the second pass of feature 111, C8)

**If answered otherwise.** The three types are appended to the catalogue, F111-FR-052 is re-added under a new id, and 124's `output-lines.json` cites the catalogue types

### CQ-070 · feature 112

**Question.** The brief says 44 doctor checks, but it also asks for a check of the gate-integrity invariants and for probes of `ps`, `pgrep` and the keychain tool

**Sources.** Brief 112; R16; `architecture.md` section 6

**Recommended answer, on which the specs proceed.** A 45th check, `events.gateIntegrity`; the three platform tools are evidence of the check `env.os`, not checks of their own

**If answered otherwise.** One id for each tool: 48 checks

### CQ-071 · feature 112

**Question.** How does a host name itself to the doctor?

**Sources.** F100 annex H; annex G §G.7

**Recommended answer, on which the specs proceed.** By a flag, `--host <id>`

**If answered otherwise.** Another spelling

### CQ-087 · feature 113

**Question.** Is there a command that evaluates the launch checks without launching, which the guardrail hook of the host can call?

**Sources.** F100 annex G §G.1; R3

**Recommended answer, on which the specs proceed.** Yes; it is the launch-blocking subset of the doctor

**If answered otherwise.** The guardrail hook is dropped

### CQ-089 · feature 113

**Question.** Which variable names the executable for the shim of the host plugin?

**Sources.** R3; F100 annex H

**Recommended answer, on which the specs proceed.** `SPECSTRIDE_BIN`

**If answered otherwise.** Another spelling, which feature 110 owns

### CQ-083 · feature 115

**Question.** From which set does `kind` of the tripwire record draw?

**Sources.** F100 annex B §B.18

**Recommended answer, on which the specs proceed.** The breach kinds of feature 115

**If answered otherwise.** The breach kinds join the integrity kinds that reach the critic

### CQ-086 · feature 115

**Question.** How large may a checkpoint and its note be?

**Sources.** R27

**Recommended answer, on which the specs proceed.** 16 kilobytes; 512 bytes of the note are kept; fixed values

**If answered otherwise.** Other numbers, or config keys

### CQ-084 · feature 116

**Question.** Does register row DV-052 cover every file of the control plane that only the layer writes: the protected-set fingerprints, the pins, the task list as read at launch?

**Sources.** DV-052; `architecture.md` section 16

**Recommended answer, on which the specs proceed.** Yes; DV-052 is worded wider, with matching entries in the layer allowlist of feature 141

**If answered otherwise.** A new register row; the second suite fails until it exists

### CQ-085 · feature 116

**Question.** May a toolchain profile name how the effective configuration of a toolchain is read? F100 annex C §C.14 says a profile names no command to run; rule IR-36 needs the comparison

**Sources.** F100 annex C §C.14; R23v IR-36

**Recommended answer, on which the specs proceed.** Yes: one fixed argument list of a pinned executable

**If answered otherwise.** The comparison of IR-36 is left out in Wave 1

### CQ-059 · feature 117

**Question.** The baseline sends a critic prompt that is still over the window; the brief's success criterion says no critic call exceeds the declared window

**Sources.** Brief 117 heading 8; baseline `lib/critic.py` (B-0922)

**Recommended answer, on which the specs proceed.** A switch: `refuse` by default, `send` under the `parity` profile

**If answered otherwise.** If always sent, the success criterion cannot hold

### CQ-060 · feature 117

**Question.** Data boundaries change the critic prompt, which FX-25 compares in full; no profile row covers the critic's block set

**Sources.** R11 R-5; F100-FR-221; F100 annex X §X.7 row 12

**Recommended answer, on which the specs proceed.** A switch for the critic's block set: `current` by default, `as-is` under the `parity` profile

**If answered otherwise.** If framing is always on, every scenario of FX-25, FX-02 and FX-05 needs a waiver

### CQ-061 · feature 117

**Question.** R29v PU-83 forbids the word "snapshot" in what a critic-class call receives; the as-is heading of the grounding snapshot holds it

**Sources.** R29v PU-83; B-0887

**Recommended answer, on which the specs proceed.** The as-is heading is exempt

**If answered otherwise.** The heading is renamed outside the `parity` profile, with a register row

### CQ-062 · feature 117

**Question.** R23v IR-44 cuts strings of the fact block "to a fixed length" and gives no number

**Sources.** R23v IR-44; R27 D1.12

**Recommended answer, on which the specs proceed.** 256 bytes, with a mark

**If answered otherwise.** Another number

### CQ-054 · feature 118

**Question.** How long is the first grace period of the polite stop?

**Sources.** R24, R27 ("a grace period"); baseline wait between terminate and kill

**Recommended answer, on which the specs proceed.** 10 s, then the baseline's 3 s between terminate and kill

**If answered otherwise.** Another default

### CQ-055 · feature 118

**Question.** Which class of the process registry has a long verification job?

**Sources.** F100 annex B §B.10

**Recommended answer, on which the specs proceed.** `adoptable`, like the job of a yield, so that a stop leaves it alive as at the baseline

**If answered otherwise.** `owned`: a stop ends the job, which differs from the baseline

### CQ-056 · feature 118

**Question.** The yield artifact schema has no way to exclude expected failures or skipped rows from the first-failure predicate

**Sources.** F100 annex D §D.6; R27

**Recommended answer, on which the specs proceed.** The declared pattern alone

**If answered otherwise.** An exclusion field in the schema

### CQ-057 · feature 118

**Question.** Does a job of a yield declare the resource it uses?

**Sources.** F100 annex D §D.6; R29

**Recommended answer, on which the specs proceed.** Not in version 1; an optional `job.resource` in a later minor of the schema

**If answered otherwise.** The field enters now

### CQ-096 · feature 119

**Question.** What does "framed as data" mean for untrusted text in output?

**Sources.** R11 R-5; F100-FR-221

**Recommended answer, on which the specs proceed.** A begin line and an end line that carry a fresh 64-bit token

**If answered otherwise.** Only the framing lines change

### CQ-138 · feature 122

**Question.** Which defaults have the time limit of the handshake, the interval of the heartbeat and the grace of the lease?

**Sources.** R15, R15v; `architecture.md` section 4

**Recommended answer, on which the specs proceed.** 30 s, 10 s, 30 s, all configurable

**If answered otherwise.** Other defaults

### CQ-046 · feature 123

**Question.** On what does the stage state of a pipeline reset?

**Sources.** Baseline `runtime.py`; F100 canonical hasher

**Recommended answer, on which the specs proceed.** On the baseline's hash of the launch contract, which ignores checkboxes, taken through the canonical hasher

**If answered otherwise.** The reset rule follows the hashing scheme of feature 104

### CQ-049 · feature 123

**Question.** Which backoff applies before a relaunch by the runtime root?

**Sources.** F100 annex E §E.2 T11

**Recommended answer, on which the specs proceed.** The declared backoff of the failed stage, or 0

**If answered otherwise.** Another backoff rule

### CQ-052 · feature 123

**Question.** How many relaunch refusals does the closed set hold? F100 annex X §X.6 row 14 says 21; the baseline code has 30 spellings

**Sources.** Baseline `supervisor_lib.py`; F100 annex X §X.6

**Recommended answer, on which the specs proceed.** The list from the code (29 literals and the pattern `launcher-exit-<n>`); the five refusals of `resolve` form a set of their own

**If answered otherwise.** Row 14 keeps 21

### CQ-222 · feature 123

**Question.** Which process emits `launch.checked`? The CLI evaluates the launch checks and does not write the event file; the launch record (annex B §B.7) holds the outcome and the refusal, not each check.

**Sources.** Annex X §X.6 row 73; annex B §B.7; the catalogue of feature 111; F144-FR-010; raised in `specs/123-pipeline-runtime-and-supervisor/repair-report.md`, CQ-pending-123-1

**Recommended answer, on which the specs proceed.** The runtime root, once for each check it verifies itself at its start and before every relaunch (launcher, launch contract, workspace lock). (Who: the repair report of 123, no source named; the spec text adds "Source: feature 100, annex X §X.6 row 73; annex B §B.7; item W-X-24".)

**If answered otherwise.** If the CLI's checks must be events: the launch record gains a list of check results (feature 122), and the root writes them as events marked synthesized

### CQ-106 · feature 124

**Question.** Which flag asks for a new resolution of roles on `resume` or on a relaunch?

**Sources.** F100-FR-016, F100-FR-092; F100 annex G §G.1

**Recommended answer, on which the specs proceed.** `--resolve-roles`, on `resume` and on `launch`

**If answered otherwise.** Another spelling

### CQ-107 · feature 124

**Question.** Which exit code has a foreground `run` that role resolution refuses?

**Sources.** F100 annex G §G.4; annex E §E.4

**Recommended answer, on which the specs proceed.** 3; `launch` exits 4 with the outcome `refused`

**If answered otherwise.** Another code

### CQ-224 · feature 124

**Question.** Where no model is named for a role, the plan records null (F124-FR-027) and the harness uses the model of its own configuration. Is the result of the diversity test then `unverified`, with the warning, also in the default setup of F124-FR-025?

**Sources.** F124-FR-027, F124-FR-047; F125-FR-026 and its clarification; F100-FR-077 (unknown values are null); raised in `specs/124-harness-discovery-and-roles/repair-report.md`, N-1

**Recommended answer, on which the specs proceed.** Yes where the harness adapter cannot report the model it resolved; no where it reports it, in which case the reported model is compared. The default setup names its two model tiers, so its models are known. (Who: the repair report of 124, no source named.)

**If answered otherwise.** If null never gives `unverified`, a run on one model of the harness's own configuration runs without the warning

### CQ-102 · feature 126

**Question.** What does the retention of transcripts cover, given that a transcript belongs to the harness?

**Sources.** Brief 126; R14

**Recommended answer, on which the specs proceed.** Only what the product wrote or copied; the reference to the harness's transcript is kept

**If answered otherwise.** Retention would delete files of the harness

### CQ-103 · feature 126

**Question.** Which passes get an invocation record?

**Sources.** Baseline (B-0781); experiment X0

**Recommended answer, on which the specs proceed.** Every pass outside the `parity` profile; under it only structured passes, as at the baseline

**If answered otherwise.** Parity tests on FX-26 differ

### CQ-104 · feature 126

**Question.** Which values have the caps on the size of a stream line and on the rate of lines?

**Sources.** R11

**Recommended answer, on which the specs proceed.** 1,048,576 bytes and 5,000 lines a second; off under the `parity` profile

**If answered otherwise.** Other defaults

### CQ-227 · feature 126

**Question.** Which data field says that a pass is correlated and gets a provider terminal: `trackTerminal` of the format row, which has another use at the baseline, or a field of its own? (Note: the second pass of feature 100, item A31, "done", confirms `trackTerminal` on the dialect row and no field of its own; it was not queued.)

**Sources.** Worklist W-126-03; baseline `lib/stream_seam.py:206`, `proposer.sh:1705`; F100-FR-023; raised in `specs/126-stream-seam-and-invocation/repair-report.md`, N-1

**Recommended answer, on which the specs proceed.** `trackTerminal`, as the worklist says; the specs proceed on it. (Who: the worklist, W-126-03, per the repair report of 126.)

**If answered otherwise.** A new option of the format row; F126-FR-001, -012, -031, -039 and `data-model.md` change the name

### CQ-228 · feature 126

**Question.** F126-FR-035 sends the `agent_result` of the finalization "to the local event destination only, not to a remote sink by this process" (as-is, B-2149 and others). Under annex C §C.10 the one event writer calls every open sink after the primary write. Does the result event of the finalization reach the sinks?

**Sources.** F126-FR-035; annex C §C.10; F111-FR-034; raised in `specs/126-stream-seam-and-invocation/repair-report.md`, N-2

**Recommended answer, on which the specs proceed.** Yes outside the compatibility projection: the event is written by the one writer, which calls the sinks. The as-is rule holds for the as-is form only. Not changed now, because no item names it. (Who: the repair report of 126, no source named.)

**If answered otherwise.** F126-FR-035 stays, and feature 111 needs a way to write an event that no sink receives

### CQ-131 · feature 127

**Question.** Which values have the retries at pass level, the margin and the jitter of a pause?

**Sources.** R14

**Recommended answer, on which the specs proceed.** 60 s and 3 retries; margin 60 s; jitter 30 s; starting values, as configuration

**If answered otherwise.** Other values

### CQ-137 · feature 127

**Question.** How many probes confirm a weak classification of a limit? R14 says "one" and also "downgraded after 2"

**Sources.** R14

**Recommended answer, on which the specs proceed.** One

**If answered otherwise.** Two probes and a longer wait

### CQ-192 · feature 127

**Question.** F127-FR-025 makes `wallClock`, `phaseAttempts` and `calls` hard ceilings, and F127-FR-034 sends every reached hard ceiling to `blocked-on-human` with `budget-cap`, `wall_budget`, `retryable: false`. F127-FR-027 ends a tripped wall-clock budget "as the baseline". Annex E §E.3 gives `wall_budget` `retryable: true` except for `budget-cap`, which it defines as a cap of spend. Is the wall-clock ceiling of a run (`loop.maxWallMin`) a hard ceiling in the sense of F127-FR-034?

**Sources.** Annex E §E.2 and §E.3; F127-FR-025, -027, -034; F123-FR-030; CQ-020 ("a hard budget cap gives `wall_budget` and exit 4", `retryable: false`); CQ-134 (the wall-clock budget is measured per engine start, as at the baseline); review item W-127-01 (medium)

**Recommended answer, on which the specs proceed.** No: a tripped wall-clock budget ends as at the baseline, with `retryable: true` and no blocked reason; `budget-cap` is for caps of spend (source of the answer: B-8.2b (its first repair))

**If answered otherwise.** The wall-clock ceiling rests blocked: annex E §E.3 widens `budget-cap` beyond spend, and the classifier tables of feature 123 refuse the stop

### CQ-229 · feature 127 (also 129, 100)

**Question.** Who reads `run:<runId>:spend`? Annex B §B.5 says engine, RunView and doctor; feature 127 also feeds the digest from it, and feature 129's RunView never reads it (its inputs are closed by F129-FR-001)

**Sources.** `specs/100-specstride/annexes/B-state.md:253`; `specs/127-quota-budgets-and-pause/spec.md` §Q.5, F127-FR-029, plan row XIX; `specs/129-run-view-and-status/spec.md` F129-FR-001, F129-FR-020; raised in `docs/ecosystem/reviews/B-8.7-B.md`, N-127-1

**Recommended answer, on which the specs proceed.** Readers: engine, doctor and the digest. RunView takes spend from `usage.reported` and alerts from `alert`, as F129-FR-020 says, and is dropped from the list. Feature 100 corrects annex B §B.5 and regenerates. (Who: the re-check B-8.7-B, no source named.)

**If answered otherwise.** RunView stays a reader: F129-FR-001 gains the ledger as an input and CT-129-5 and the golden views follow

### CQ-119 · feature 128

**Question.** How does an event sink learn the as-is name of an event, which the as-is payload form needs?

**Sources.** F100 annex C §C.10; CQ-032

**Recommended answer, on which the specs proceed.** The context of `open` gives a sink read access to the table of the compatibility projection; the payload form follows `compat.legacyEvents`

**If answered otherwise.** A new profile row for the payload form

### CQ-120 · feature 128

**Question.** The alias table maps `SPECSTRIDE_OTEL_STATE_DIR` to a telemetry key, but feature 100 fixes where span state lies

**Sources.** F100 annex X §X.8; annex B §B.5

**Recommended answer, on which the specs proceed.** The variable is accepted, has no effect, and a message at launch says so

**If answered otherwise.** The variable moves span state, against the layout

### CQ-121 · feature 128

**Question.** Which component prints the four summary lines of the stream (B-2285)?

**Sources.** F100 single owners; features 119, 126

**Recommended answer, on which the specs proceed.** The presenter, in compatibility output

**If answered otherwise.** Another owner

### CQ-122 · feature 128

**Question.** Which label family carries the telemetry line printed at start-up?

**Sources.** F100 annex G §G.3

**Recommended answer, on which the specs proceed.** The as-is text; the feature that prints it owns the label

**If answered otherwise.** A new label

### CQ-125 · feature 128

**Question.** Does the rule of https outside loopback (threat T-16), written for harness endpoints, cover telemetry endpoints?

**Sources.** R11 T-16

**Recommended answer, on which the specs proceed.** Yes

**If answered otherwise.** Content can leave the machine in clear text when traces are on

### CQ-126 · feature 128

**Question.** Who registers the doctor check `telemetry.endpoint`?

**Sources.** Brief 112; F100 annex G §G.7

**Recommended answer, on which the specs proceed.** Feature 112 registers it; feature 128 supplies the facts

**If answered otherwise.** Feature 128 registers it

### CQ-128 · feature 128

**Question.** Register row DV-083 says the baseline captures no content, but the baseline ships `result_preview` unredacted

**Sources.** DV-083; baseline shippers

**Recommended answer, on which the specs proceed.** DV-083 is reworded to name the exception, and DV-107 carries the waiver

**If answered otherwise.** The `parity` profile switches the preview on, unredacted, as the baseline does

### CQ-230 · feature 128

**Question.** No caller of the baseline ships an event named `gate`; the OTLP shipper only recognises it as the input of the metric `ralph.gate`. Does the port ship an event of that name?

**Sources.** `lib/ralph_otel_ship.py:34`, `:211` at `9cab15d`; B-2313, B-2328; raised in `specs/128-telemetry-export/repair-report.md`, N-1

**Recommended answer, on which the specs proceed.** No. The verdict is shipped as `verdict`; with the old metric names on, `verdict.recorded` feeds `ralph.gate`. (Who: the repair report of 128, no source named.)

**If answered otherwise.** A second shipped event per verdict, which the payloads of the baseline do not hold; a register row and a waiver on FX-31

### CQ-161 · feature 129

**Question.** The read model is given three state files and a probe of the lease; the rules of feature 100 also need the newest launch record, the supervision record, a search of the process table for the run token, and the limit of the handshake

**Sources.** F100 annex G §G.6; annexes B, E

**Recommended answer, on which the specs proceed.** They are values the caller supplies to the pure function

**If answered otherwise.** The condition `launch-abandoned`, the field `next=` and the report of orphan processes leave the view

### CQ-162 · feature 129

**Question.** `stale` is used in two senses: heartbeat and events both old, and an event major out of range. What counts as an old event?

**Sources.** F100 annex G §G.6; R13

**Recommended answer, on which the specs proceed.** One field with a reason; the default age is 1800 s

**If answered otherwise.** Another default, or two fields

### CQ-167 · feature 129

**Question.** From where does the as-is `status` take its table per phase, its telemetry lines and the latest tool?

**Sources.** Baseline `specstride status`; F100 annex G §G.6

**Recommended answer, on which the specs proceed.** From events; the line "telemetry configured" stays with feature 119

**If answered otherwise.** Feature 119 needs another read path

### CQ-168 · feature 129

**Question.** How are wall hours and agent hours defined?

**Sources.** R29 PU-72; R29v PU-97

**Recommended answer, on which the specs proceed.** Wall hours are the elapsed time of the run; agent hours are the sum of the durations of all passes, worker passes included

**If answered otherwise.** Other definitions

### CQ-170 · feature 129

**Question.** Which lanes does the read model have?

**Sources.** R13; `architecture.md` section 11

**Recommended answer, on which the specs proceed.** R13's eight lanes; `dead`, `stopped` and blocked-on-human all go to the lane `blocked`

**If answered otherwise.** Another lane table

### CQ-231 · feature 130

**Question.** Is the critic role on dsh refused while it is not established whether the harness keeps a native memory? (Note: near CQ-189, which refuses the critic where a memory exists and cannot be switched off.)

**Sources.** F100-FR-082; F109-FR-022; row 182 of annex X §X.6; CQ-189; raised in `specs/130-adapter-dsh/repair-report.md`, N-1

**Recommended answer, on which the specs proceed.** Yes: a state that is not established is read as not off. (Who: "this repair's reading; no report recommends it".)

**If answered otherwise.** The role is admitted until a capture shows a memory; F130-FR-045 changes

### CQ-118 · feature 131

**Question.** Is the window fallback of 128,000 under the `parity` profile part of the as-is critic mode (profile row 28), or a switch of its own?

**Sources.** F100 annex X §X.7 row 28; B-0910

**Recommended answer, on which the specs proceed.** Part of row 28; no new row

**If answered otherwise.** A new row, for example `roles.critic.windowFallback` (none; 128000 under `parity`)

### CQ-108 · feature 134

**Question.** Who fixes the ids of the doctor checks that a harness adapter registers?

**Sources.** F100 annex G §G.7; brief 112

**Recommended answer, on which the specs proceed.** Feature 112 confirms the ids each adapter proposes; for pi: `harness.pi.executable`, `.version`, `.credential`, `.containment`, `.project-trust`

**If answered otherwise.** The ids are renamed

### CQ-150 · feature 138

**Question.** Which ids have the doctor checks of the prime adapter, and which of them block a launch?

**Sources.** F100 annex G §G.7; CQ-108

**Recommended answer, on which the specs proceed.** `harness.prime.<check>`; the checks of the executable, the credential and the containment of a proposer block a launch

**If answered otherwise.** Only the names change

### CQ-151 · feature 138

**Question.** The registry entry of the baseline names no stream format for prime, although its pass loop reads prime through the reader. Does the registry query report a format under the `parity` profile?

**Sources.** Baseline `lib/backends.py`; FX-26

**Recommended answer, on which the specs proceed.** No, it reports empty; the adapter routes by its dialect row

**If answered otherwise.** The registry query differs from the baseline on FX-26

### CQ-235 · feature 138

**Question.** Two as-is variables reach `harnesses.prime.launcher` in an order. Does the refusal of F110-FR-020 apply to them?

**Sources.** Baseline lines above; F110-FR-020; review item W-110-03; raised in `specs/138-adapter-prime/repair-report.md`, CQ-pending-138-2

**Recommended answer, on which the specs proceed.** No: the order of the baseline is the one exception. (Who: "the worklist, item W-110-03, which chooses the exception".)

**If answered otherwise.** With the refusal, a launch with both variables set and different is refused; a register row and a waiver are needed where a fixture sets both

### CQ-030 · feature 141

**Question.** May fixture files of the baselines, which are under Apache-2.0, be kept in the MIT repository?

**Sources.** R18 open question 9; brief 141 heading 2; R15 A-4

**Recommended answer, on which the specs proceed.** Yes, as oracle assets, unchanged, with the baseline's licence notice, and never in the published package

**If answered otherwise.** If not, assets are read from the reference tree at run time and the hermetic job needs the clones

### CQ-031 · feature 141

**Question.** Register row DV-056 says fixture family FX-37 (onboarding) is "retired with a waiver", but a waiver that matches no difference fails the suite

**Sources.** DV-056; R18 O-7

**Recommended answer, on which the specs proceed.** The retirement is recorded in the fixture catalogue and no waiver entry is written; the wording of DV-056 is corrected to say so

**If answered otherwise.** If a waiver entry is wanted, the rule for a waiver that matches nothing needs an exception

### CQ-193 · feature 141

**Question.** May a fixture of FX-18 or FX-26 change the reference tree, or shadow the interpreter, to reach a line that runs only when a file of the reference is missing or cannot be written?

**Sources.** `specs/141-parity-oracle/spec.md:1013`; the fixture catalogue of feature 141, §O.3; review item W-141-01 (medium)

**Recommended answer, on which the specs proceed.** No. The reference tree is read-only and a stub takes only the names of §O.3. An item that no fixture reaches goes to the correction list (source of the answer: feature 141, in its own table of readings; no review report)

**If answered otherwise.** Fixtures may change the reference tree, and the rule that the baselines run unchanged from a read-only tree gets an exception

### CQ-194 · feature 141

**Question.** Which are the error classes of the validation of a launch contract? No closed set of feature 100 holds them.

**Sources.** `specs/141-parity-oracle/spec.md:1014`; fixture family FX-33 (`specs/141-parity-oracle/spec.md:207`); annex X §X.6; review item W-141-02 (medium)

**Recommended answer, on which the specs proceed.** The ten validators of the baseline, as the table of pattern members names them; feature 107 states them as a closed set (source of the answer: feature 141, in its own table of readings; no review report)

**If answered otherwise.** The classes of FX-33 stay a list of the oracle, and no closed set is added

### CQ-028 · feature 141, 100

**Question.** Does the second suite compare compatibility output or default output? F100-FR-211 and register row DV-034 read differently

**Sources.** F100-FR-211; R27 D1.1; DV-034, DV-018

**Recommended answer, on which the specs proceed.** Compatibility output: only row 1 of the `parity` profile changes. The `[LOOP]` line and the status line are then not reachable in the suite and are proven by the tests of their own features

**If answered otherwise.** With default output, DV-018 becomes an allowlist entry and the suite changes two rows of the profile

### CQ-029 · feature 141, 100

**Question.** How is a reference output compared that lists registry entries, one of which the port does not carry?

**Sources.** DV-064; N-15; the component-name table

**Recommended answer, on which the specs proceed.** N-15 applies: the entry is found at run time and taken out before storage and comparison, so no golden capture holds its name

**If answered otherwise.** Without a rule those fixtures need waivers or are dropped

### CQ-027 · feature 141, all

**Question.** Who writes a scenario that a parity test needs and the first set of feature 141 lacks?

**Sources.** Brief 141 headings 1 and 5; R18 O-12

**Recommended answer, on which the specs proceed.** Feature 141 delivers the first set; a feature may add a scenario inside the scope of a fixture family, using only the stub verbs and the surfaces of feature 141

**If answered otherwise.** If feature 141 writes every scenario, it carries the test design of 30 features

### CQ-111 · feature 142

**Question.** Under which admission check is the condition on remaining cycles recorded? R29v PU-87 makes it a condition of admission and names no check

**Sources.** R29 PU-13, PU-68; R29v PU-87; F100 annex X §X.6 row 61

**Recommended answer, on which the specs proceed.** Under `headroom`, with the detail `cycles`

**If answered otherwise.** A ninth admission check, which changes the closed set in feature 100

### CQ-112 · feature 142

**Question.** R29v PU-79 names the serial reason `no-check`, which is already a fallback reason of the layer `micro`

**Sources.** R29v PU-79; F100 annex X §X.6 row 59

**Recommended answer, on which the specs proceed.** The layer `parallel` uses the name of the failed admission check, `check`

**If answered otherwise.** The same literal means two things in two closed sets

### CQ-178 · feature 144

**Question.** The brief says 62 event names are carried; the inventory has 70 and the projection table covers 65

**Sources.** Brief 111; R18 inventory

**Recommended answer, on which the specs proceed.** 65 carried names, each the target of a row; 62 is the run stream alone

**If answered otherwise.** —

### CQ-100 · feature 145

**Question.** What does `watch` print in default output, and is it a verb of feature 119 in Wave 1, given that the terminal follower is Wave 2?

**Sources.** `architecture.md` section 11; 028 FR-029

**Recommended answer, on which the specs proceed.** The presenter card, with milestone lines that carry no free text; feature 119 owns it until a Wave 2 follower replaces it

**If answered otherwise.** The requirements on `watch` and the card change

### CQ-101 · feature 145

**Question.** Which stream does the presenter read?

**Sources.** F100 annex X §X.1; DV-007

**Recommended answer, on which the specs proceed.** The compatibility projection in compatibility output, the primary event stream in default output

**If answered otherwise.** The presenter requirements change

### CQ-153 · feature 148

**Question.** Is a check manifest written when the loop strategy is `classic` outside the `parity` profile?

**Sources.** F100-FR-137; DV-052, DV-076, DV-078; profile rows 1, 7, 31, 33

**Recommended answer, on which the specs proceed.** It is written when the strategy is not `classic`, or when one of the switches of rows 6, 7, 31 or 33 is on; never under the `parity` profile

**If answered otherwise.** If only with the layer on, the integrity rules and concurrent commands cannot work with the layer off

### CQ-154 · feature 148

**Question.** Which reasons may the conditions `tainted` and `unchecked` of a check result carry? Feature 100 names `changed-during-check` among the reasons of `unchecked`; R29 PU-76 and R23v IR-31 make it a reason of `tainted`

**Sources.** F100 annex X §X.6 row 53; annex C §C.8; R23, R23v, R27, R29

**Recommended answer, on which the specs proceed.** `tainted`: `changed-during-check`, `protected-set-changed`, `pin-mismatch`. `unchecked`: `no-command`, `slow`, `budget`, `flaky-excluded`, `gate-not-executing`, `partial`, `unknown-condition`

**If answered otherwise.** The closed set and the readers in features 115 and 142 change

### CQ-180 · feature 148

**Question.** Where is the lowered parallelism of a run kept, so that a later engine start reads it?

**Sources.** F100 annex E §E.2; R29 PU-76

**Recommended answer, on which the specs proceed.** A field of the run record; until it exists, it is derived from the event of the lowering

**If answered otherwise.** A new logical name in feature 100

## Group 4 — answers already applied, to confirm as one group

The amendments to feature 100 (annex B) or the corrected catalogue of feature 141 carry the recommended answer of each. The owner confirms the group, or names the entries to reopen.

| Id | Feature | Question | Answer applied |
|---|---|---|---|
| CQ-033 | 144 | Feature 100 annex B names one legacy event file per logical run; the baseline writes one file per engine start | One file per engine start, told apart by the engine-start ordinal |
| CQ-038 | 107 | Where is the consumer's comment stored verbatim? | Beside the launch record, under a logical name `launch:<launchId>:comment` |
| CQ-044 | 104 | Where is the launch-time reading of the task lists stored (IR-56)? | By its consumer, in the control plane |
| CQ-065 | 109 | Which logical name has a harness descriptor that ships with the package? | `package:harness:<id>`, in the place `package` |
| CQ-093 | 108 | Where do the scratch claims file, the plan of tests and the scaffolds of a reverse run lie? The existing names lie in the working tree outside the workspace par | Three logical names in the workspace part: `reverse:<slug>:claims:<unit-key>`, `reverse:<slug>:test-plan`, `reverse:<slug>:scaffolds` |
| CQ-099 | 119 | Which schema ids have the `--json` records of the inspection verbs? | `specstride.inspect.<verb>/1`, owned by feature 119 |
| CQ-105 | 126 | Which schema ids have the invocation record, the producer status, the provider terminal and the result? | `specstride.invocation/1` and three siblings, given by feature 100 |
| CQ-114 | 106 | Which schema id has the retrospective? | `specstride.retrospective/1` |
| CQ-116 | 131 | Fixture family FX-07 lists the scenario `codex-missing-key` as a critic configuration error with engine exit 3; the baseline code scores an empty key as a faile | Follow the code; the catalogue of feature 141 is corrected |
| CQ-123 | 128 | Which logical name has the context-budget report? | `package:context-budget` |
| CQ-141 | 130 | Fixture family FX-07 lists `dsh-conflicting-providers` and `dsh-invalid-model-ref` as critic configuration errors with engine exit 3; the baseline code scores t | Follow the code; the catalogue of feature 141 is corrected |
| CQ-181 | 115 | Under which logical name is the task list as read at launch stored? | A name of the form `phase:<N>:tasks-at-launch`, added by feature 100 |
