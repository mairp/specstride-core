# Repair report of feature 100 after the cross-feature review

Written by the repair agent of feature 100 on 2026-09-29 and 2026-09-30, from section 1 of
`docs/ecosystem/reviews/REPAIR-WORKLIST.md`. All paths are relative to `specs/100-specstride/`
unless they start with `specs/` or `docs/`. Line numbers are those of the files after the repair.

Every item was checked against the file before it was changed. Nothing was renumbered. No
generated file was edited by hand.

## Result of the checks

| Check | Result |
|---|---|
| `python3 specs/100-specstride/contracts/tools/generate.py` | wrote 82 files |
| `python3 specs/100-specstride/contracts/tools/generate.py --check` | checked 82 files, 0 differ |
| `python3 docs/ecosystem/check-traceability.py --require-all` | PASSED: checks a to h |

## Counts

| State | Items |
|---|---|
| done | 35: W-100-01 to W-100-07, W-100-09 to W-100-17, W-100-19, W-100-21, W-100-22; the queue items W-100-20 (CQ-182), W-100-23 (CQ-183), W-100-24 (CQ-184), W-100-25 (CQ-185), W-100-26 (CQ-186); the pointers W-X-02, W-110-09, W-115-02 (CQ-191), W-X-05, W-X-06, W-X-27, W-110-11 (CQ-160), W-X-28 |
| done in part | 1: W-100-08 |
| not applied | 1: W-110-12 (nothing to change) |
| no change asked | 3: W-119-01, W-127-01 (CQ-192), W-X-36 |
| open | 0: W-100-18, open at the first pass (it waited for feature 111), is closed: the second pass applied it (A1, 2026-09-30; rows 271 to 273 of annex X §X.6) |

## What the other features must follow

| # | What | Kind | Before | Now | Who follows |
|---|---|---|---|---|---|
| 1 | EP-16 `specstride.toolchain/1` | Content owner | 115 | 116; consumed by 105, 148, 142, 143 and 112 | 105, 148, 116, 112, 142, 143 |
| 2 | Schema file of `specstride.toolchain/1` | Place | not stated | Written by 116 (`specs/116-check-integrity-and-unit-evidence/contracts/schemas/toolchain-profile.schema.json`) and delivered to the `contracts` package | 116 |
| 3 | Fact block `specstride.fact-block/1` | Content owner | 115 | 116 (slot and escaping: 117) | 115, 116, 117 |
| 4 | `specstride.protected-set/1`, `specstride.check-result/1` (annex B §B.20) | Owner | 115 | 116 | 116 (cite §B.20 in place of "new schema ids, reported"), 105, 148 |
| 5 | `specstride.span-state/1`, logical name `run:<runId>:span-state` (annex B §B.20) | New schema id | none | Owner 128 | 128 (W-128-01: the field `schema` is the constant `specstride.span-state/1`) |
| 6 | `specstride.inspect.<verb>/1` | Owner | 119 | 119, confirmed after the split 119/145 | 119, 145 |
| 7 | Closed set row 142 (classes of the protected set), row 143 (freshness of a result) | Owner | 115 | 116 | 115, 116 |
| 8 | Closed set row 64 (operations of the tree store) | Closed by | Owner decision | Design | 143 (its table of closed sets, `spec.md:389`) |
| 9 | Package `@specstride/integrity` | Owner | 115 | 116 | 115, 116 |
| 10 | Package `@specstride/tree-store` | Owner | 142 | 143 | 142, 143 |
| 11 | EP-04, the engine services behind the group directives; the tree-store service `specstride.tree-store/1` | Content owner | 142 | 143 (`parallel` itself stays 142; `micro` 115; the interface 103) | 142, 143, 103 |
| 12 | Ledger record kinds of the namespace `parallel` (annex B §B.13) | Owner | 142 | 143 | 142, 143 |
| 13 | Core packages (`@specstride/core`, `@specstride/layer-micro`, `@specstride/layer-parallel`) | Forbidden modules | `node:fs` write calls, to `layer-parallel` only | `node:fs` and `node:fs/promises` to all three; files are read and written through the kernel and the ports of the edge packages. F100-FR-012, `assumption: CQ-185` | 111, 115, 117 (the hiding moves behind a port), 118, 142, 101, 102, 103, 149 |
| 14 | `loop.parallel.workersMax` | New key and new profile row 130 | the ceiling 4 was a constant | Whole number of 1 or more, default 4, trust class widening, under `parity` "not used", owner 142, register row DV-080. A value of `loop.parallel.workers` above the ceiling in force is a configuration error at launch (F100-FR-127) | 110 (key list: one new line, owner 142, widening), 142 (F142-FR-019, T022) |
| 15 | Profile row 21, `loop.parallel.workers` | Default | "2 (ceiling 4)" | "2; the ceiling is the key of row 130" | 142, 110 |
| 16 | `harnesses.<id>.proposerCustomisations` | New key and new profile row 131 | none; row 29 covers harness-native memory only | off, on; default off; never loaded into a critic-class call; trust class widening; under `parity` `as-is` (no flag about customisations is passed); owners 131, 134; register rows DV-047, DV-002. It is the opt-in for project instruction files (131) and for the auto-loaded context of pi (134) | 110 (key list), 131 (F131-FR-014), 134 (F134-FR-029). The key name is a proposal of feature 100; 110 owns the spelling |
| 17 | Profile row 30 | Key | none ("follows the auth tier") | `harnesses.<id>.overlay`; under `parity` `none` | 109, 110 |
| 18 | Profile row 34, `distribution.audience` | Owner | "110; read by 147" | 147 | 110, 147 |
| 19 | Profile row 65 | Three key names | `loop.micro.caps.proposalMinutes`, `.unitMinutes`, `.checkMinutes` | `loop.micro.caps.proposalMin`, `.unitMin`, `.checkMin` (`assumption: CQ-160`) | 110 (key list and §K.2), 115 (`spec.md:705` to `:707`) |
| 20 | Unit suffixes of keys (annex X §X.7, introduction) | Rule | `Sec`, `Ms`, `Min`, `Bytes` | `Sec`, `Ms`, `Min`, `Days`, `Bytes`, `Percent` | 110 (§K.2) |
| 21 | Profile row 124 | Defaults | none | `verification.testPlan`: `testautomation/<slug>/TEST_PLAN.md`; `verification.commands`: none; `verification.generateTests`: `testautomation/<slug>/generated`; unless the mode is `off` | 110 (`spec.md:157`, key list lines 97 and 98) |
| 22 | Profile row 92 | Name of the switch | "Line of the same-model warning" | "Line of the critic-diversity warning"; the key `critic.warnSameModel` is unchanged | 124 |
| 23 | The warning | Name | "same-model warning" and "critic-diversity warning" | "critic-diversity warning" only; raised for the results `same-model` and `unverified` of the diversity test | every feature that writes "same-model warning" (17 uses in 8 specs) |
| 24 | The counted unit of the pass loop | Name | "iteration", "iteration limit", "pass cap", "limit of passes" | "pass", "pass limit", "pass count"; "is given back", "spends no pass". Literals keep the old word: `giveIterationBack`, `loop.maxIter`, `loop.yield.countsAsIter`, `MAX_ITER`, `iter_*` | 102, 106, 115, 118, 124, 127, 141, 142 |
| 25 | `loop.parallel.allow_detect` (F100-FR-112) | Source | user configuration, the environment or a flag | user configuration only (`assumption: CQ-183`) | 110, 130, 134, 138, 142 |
| 26 | Opt-in for containment C0 (F100-FR-111) | Source | user configuration | user configuration only, said in so many words: not the environment, not a flag, not project configuration (`assumption: CQ-183`) | 109, 110 (layers of `sandbox.level`), 131, 134 |
| 27 | Escalation (F100-FR-130), signal `targetIsCriticModel` | Meaning | any rung on a model of a critic-class call is skipped | true only when the rung equals a critic-class call in model and in effort; a rung that shares the model alone is allowed and raises the critic-diversity warning (`assumption: CQ-191`) | 115 (signal table and rule `esc.critic-collision`) |
| 28 | `resume` on a workspace without state (annex G §G.4) | Exit code | not in the row | 1, the first check; then 5 and 3 as before (`assumption: CQ-184`) | 102 (F102-FR-012: "after the state check of F119-FR-009, which exits 1"), 119 |
| 29 | Annex G §G.4, row of exit 1 | Wording | "Any command, unknown subcommand" | "Any command, unknown first argument (verb)" | 104 (no change: exit 2 for an unknown sub-verb of `spec` stands), 119 |
| 30 | F100-FR-143 | Wording | proof "that the critic holds no tools" | "no tools or only read-only tools" | 101, 102 |
| 31 | F100-FR-236 | New requirement, test CT-100-336 | none | Publishing by the build only, from a protected branch, with an attestation; the control of threat T-43 | 113 (cites it for the host package) |
| 32 | `$id` of a schema file (`contracts/README.md`) | Rule | not stated | `urn:specstride:schema:<schema id>`, with the version; a part after a colon; a schema that is no contract: `urn:specstride:schema:internal:<feature number>:<name>/<major>` | 103, 108, 109, 115, 116, 122, 127, 128, 130, 140, 141 |
| 33 | Alias table of annex X §X.8 | Rows | 39 rows, six variables groups named twice, two keys "(proposed)" | 35 rows; `roles.critic.provider` and `harnesses.prime.launcher` without the mark; the other `SPECSTRIDE_YIELD_*` still map to `loop.yield.*`; `SPECSTRIDE_WATCHDOG_TICK` maps to `loop.watchdogTickSec` | 110, 118, 141 |
| 34 | Field `keys` and `key` of `contracts/data/parity-profile.json` | Content | every name in backticks of the key cell | configuration keys only, short forms in full; `keys` empty and `key` null for rows 13, 19, 37, 38, 62, 63, 66, 67, 129 | every feature that reads the file; 110 |
| 35 | Place of conformance suites and samples | Rule | the frame only | `packages/testkit/src/conformance/EP-nn/` and `packages/testkit/src/samples/EP-nn/`; feature 100 builds the contract-level suite and a minimal sample, the content owner adds its cases in the same folder | 103, 104, 105, 109, 110, 111, 112, 113, 115, 116 |
| 36 | Place of parity and characterization tests | Rule | not stated | `tests/parity/<feature number>/` and `tests/characterization/<feature number>/`, at the root of the repository | 104, 106, 107, 134, 143, 149 |
| 37 | The YAML parser (research D-8) | Decision | none | the npm package `yaml`, a dependency of the configuration loader of 110 only; version and licence `unverified` until pinned | 110, and every plan that reads YAML |
| 38 | "engine invocation" | Term | annex F §F.2, annex B §B.7 | "engine start" | 108, 122 |
| 39 | Requirements of feature 100 | Count | 235 | 236 | every spec that writes the count |
| 40 | Rows of the `parity` profile | Count | 129 | 131 | every spec that writes the count |

## Items, in the order of the worklist

### The repair items

| Item | State | What was done | Files and lines |
|---|---|---|---|
| W-100-01 | done | Verified: the field `keys` held flags, verbs and short forms. New function `profile_keys`: a cell that starts with a dash gives no key; text in parentheses is a remark; a short form takes the place of the last segment of the last full key; a name that is no key is left out. `key` is the first of `keys`, or null | `contracts/tools/generate.py:179` to `:203`, `:412`, `:413`; `contracts/README.md:110` |
| W-100-02 | done | Verified against `specs/116-…/spec.md:189`, `:315`, `:468` and `specs/115-…/spec.md:801`. Owner 116 written in every place named. One difference from the worklist: the consumers of EP-16 are "105, 148, 142, 143 and 112", because feature 142 consumes EP-16 as well (`specs/142-parallel-units/spec.md:452`) | `spec.md:367`; the row "Owners of 116 and 143" of "Points not applied" deleted; `annexes/C-ports-and-edges.md:857`; `annexes/D-pass-loop.md:397`; `annexes/B-state.md:667`, `:668`; `annexes/X-cross-layer.md:313`, `:314`; `contracts/sources/package-graph.json:109`, `:114`, and the last rule deleted |
| W-100-03 | done | Verified against `specs/143-…/spec.md:156`, `:253`, `:330`. Owner 143 written | `annexes/D-pass-loop.md:94`, `:95`, `:147`; `spec.md:355`, `:437` (clarification on rulings 31 and 39); `annexes/B-state.md:491`; `contracts/sources/package-graph.json:119`, `:124` |
| W-100-04 | done | Verified against `specs/147-terms-gate/spec.md:17` and `specs/110-…/contracts/config-keys.tsv:4`, `:129` | `annexes/X-cross-layer.md:495` (row 30), `:499` (row 34) |
| W-100-05 | done | Verified against F105-FR-002 (`specs/105-verification/spec.md:188`, `:520`, `:522`) | `annexes/X-cross-layer.md:589` (row 124) |
| W-100-06 | done | Ruling P5 and CQ-006 verified. Key `loop.parallel.workersMax`, row 130 appended, row 21 points to it, F100-FR-127 changed in place, the field `workers` of the parallel plan follows | `annexes/D-pass-loop.md:202`, `:214`, `:215`; `annexes/X-cross-layer.md:486`, `:595` |
| W-100-07 | done | Verified against ruling P3 and "Not approved, because not asked" of `APPROVAL.md` | `annexes/X-cross-layer.md:235` |
| W-100-08 | done in part | Four earlier rows dropped (proposer watchdogs, critic, yield, watchdog tick). Two earlier rows were **not** dropped, because they name variables that no later row names: the row of the verification variables keeps `SPECSTRIDE_VERIFICATION`, `SPECSTRIDE_TEST_PLAN`, `SPECSTRIDE_VERIFICATION_COMMANDS`, `SPECSTRIDE_GENERATE_TESTS` and loses the two `LONG_JOB` variables; the row of the telemetry variables loses `SPECSTRIDE_OTEL_STATE_DIR` only. Both now give their keys in full. The later yield row keeps the mapping of the other `SPECSTRIDE_YIELD_*`. Both marks "(proposed)" removed (both keys are in `config-keys.tsv:199`, `:213`) | `annexes/X-cross-layer.md:704`, `:705`, `:715`, `:722`, `:727`, `:728`; introduction of §X.7 `:453` to `:455` |
| W-100-09 | done | Row appended to §B.20; verified against F128-FR-018. Owner 119 of the inspection records confirmed (`specs/119-…/spec.md:512`) and stated in `spec.md` | `annexes/B-state.md:679`; `spec.md`, "Records kept" |
| W-100-10 | done | §C.14, "Content owner", names feature 116 as the place of the schema file | `annexes/C-ports-and-edges.md:857` to `:861` |
| W-100-11 | done | Row renamed. See "Found while repairing", point 1, for F100-FR-182 | `annexes/G-cli.md:171` |
| W-100-12 | done | Wording of F100-FR-218 taken | `annexes/E-engine.md:193` |
| W-100-13 | done | Verified: annex C names no sub-point "discovery". "discovery: 146" deleted | `spec.md:353` |
| W-100-14 | done | "pass limit", "pass count", "is given back", "spends no pass". F100-FR-149 keeps "the as-is iteration field", which is a literal of the baseline (W-X-36) | `annexes/D-pass-loop.md:52`, `:127`; `annexes/E-engine.md:208`, `:292`; `annexes/G-cli.md:206`; `annexes/C-ports-and-edges.md:781`; `spec.md:447` |
| W-100-15 | done | One name; the sentence on the two results and on the word of ruling 49 is in annex E §E.1 | `annexes/E-engine.md:48` to `:51`; `annexes/X-cross-layer.md:557`; `annexes/C-ports-and-edges.md:306`; `spec.md`, row of P-6 in the table of proposed numbers |
| W-100-16 | done | The form is stated once. One addition that the item does not ask: the form of a schema that is no contract, because three features have such files | `contracts/README.md`, section "The `$id` of a schema file" |
| W-100-17 | done | F100-FR-236 added at the end of §X.9, test CT-100-336, tasks T224 and T225. Table "Threats" in `spec.md` with T-02, T-30, T-43 and T-44 | `annexes/X-cross-layer.md:843` to `:845`; `spec.md:372`; `tasks.md:721` to `:724` |
| W-100-18 | closed by the second pass (A1, 2026-09-30) | At the first pass: waits for W-111-05. No member was invented. Rows 5 and 96 of §X.6 are unchanged. When feature 111 has listed the members: three rows are appended from number 271, the relation of row 96 to row 5 is stated, and the generator runs again |  — |
| W-100-19 | done | Row IX is unticked and marked as a deviation; one row in Complexity Tracking with the wording of the worklist. The contract (annex C §C.3, F100-FR-230) is unchanged | `plan.md:67`, `:86`, `:230` to `:235` |
| W-100-21 | done | Row VI states the fact; one row in Complexity Tracking with the justification of D-5 and the end condition; T207 lost `[P]` and stands before T204; T006 names the TypeScript tool once T207 is done | `plan.md:20` to `:24`, `:43`, `:64`, `:89` to `:92`, `:235`; `research.md:58` to `:62`; `tasks.md:52`, `:586`; `quickstart.md:12` |
| W-100-22 | done | Row XII and "Testing" reworded; T205 names the tier and the log. F100-FR-224 unchanged | `plan.md:35`, `:70`; `tasks.md:591` |

### The queue items

| Item | Queue | State | What was done | Files and lines |
|---|---|---|---|---|
| W-100-20 | CQ-182 | done | No change to the contract. The deviation is recorded by W-100-19, and the row names CQ-182 | `plan.md:67`, `:234` |
| W-100-23 | CQ-183 | done | F100-FR-112: "the environment or a flag" removed. F100-FR-111: the opt-in cannot come from the environment, a flag or project configuration. Both carry `assumption: CQ-183` | `annexes/C-ports-and-edges.md:881` to `:886`, `:888` to `:892` |
| W-100-24 | CQ-184 | done | Row `resume` of §G.4: "1 without state, which is the first check" | `annexes/G-cli.md:176` |
| W-100-25 | CQ-185 | done | One sentence in F100-FR-012 with `assumption: CQ-185`; the graph forbids `node:fs` and `node:fs/promises` to the three core packages and has one new rule | `annexes/A-foundations.md:71`, `:73`; `contracts/sources/package-graph.json:48`, `:49`, `:66`, `:67`, `:84`, `:85`, `:324` |
| W-100-26 | CQ-186 | done | The answer is stated in row VI, in "Constraints", in the re-check and in D-5 | `plan.md:43`, `:64`, `:89` to `:92`; `research.md:61` |

### The pointers

| Item | State | What was done | Files and lines |
|---|---|---|---|
| W-X-02 | done | The plan says what feature 100 builds and where the content owner adds its cases. Tasks T098, T101, T105, T108 stay | `plan.md:224` |
| W-110-09 | done | Row 29 does not cover the two opt-ins: it is about harness-native memory. Row 131 appended, key `harnesses.<id>.proposerCustomisations` | `annexes/X-cross-layer.md:596` |
| W-115-02 | done (CQ-191) | F100-FR-130 and the row `escalation` of §D.4 | `annexes/D-pass-loop.md:237`, `:282` to `:287` |
| W-119-01 | no change asked | — | — |
| W-127-01 | no change asked (CQ-192) | Annex E §E.3 stands under the recommended answer | — |
| W-X-05 | done | 40 other features, 41 Wave 1 features, 113 register rows, 236 requirements, 131 profile rows; `roles.refuseUnknown` settled | `spec.md:168`, `:172`, `:173`, `:311`, `:435`, `:448`, `:474`, `:729`; `plan.md:9` to `:11`, `:45`, `:83`, `:101`; `tasks.md:653`, `:686`; `research.md:61`, `:62`; `data-model.md:137`; `contracts/README.md:96`, `:120` |
| W-X-06 | done | "engine start" | `annexes/F-runtime-root.md:46`; `annexes/B-state.md:334` |
| W-X-27 | done | Decision D-8 names the parser. Feature 110 names none today ("candidates chosen at implementation", `specs/110-…/plan.md:23`), so feature 100 decides and 110 follows | `research.md:64` to `:72` |
| W-110-11 | done (CQ-160) | Three keys renamed in row 65; the sentence on suffixes names six | `annexes/X-cross-layer.md:453`, `:454`, `:530` |
| W-110-12 | not applied | Nothing to change: `grep -n -i 'tier bump'` over the annexes, `spec.md`, the plan and the tasks finds "model-tier bump" only (annex E `:83`, annex X rows 24 and 128, `spec.md` row of 101) | — |
| W-X-28 | done | One rule for the place | `plan.md:161` to `:165` |
| W-X-36 | no change asked | The literals are named in `spec.md:447` as the places where the old word survives | — |

## Ruling P5: the key for feature 110

`loop.parallel.workersMax`: whole number of 1 or more; default 4; value under `parity` "not used";
trust class widening (project configuration may lower it and never raise it); owner 142; row 130
of the `parity` profile; register row DV-080. `loop.parallel.workers` keeps the default 2; a value
above the ceiling in force is a configuration error at launch.

## Found while repairing, not changed

| # | Finding | Evidence | Recommended |
|---|---|---|---|
| 1 | F100-FR-182 still says "An unknown subcommand MUST exit 1", while the row of §G.4 now says "unknown first argument (verb)" and `spec` exits 2 for an unknown sub-verb. W-100-11 names the row only, so the requirement was not changed in place | `annexes/G-cli.md:212`; `specs/104-spec-input/spec.md:273` | Change the last sentence of F100-FR-182 to "An unknown first argument (verb) MUST exit 1; an unknown sub-verb of a command exits with the code of the row of that command" |
| 2 | F100-FR-140 (model-tier bump) skips "a target equal to a model of a critic-class call" whatever the effort. CQ-191 is asked about escalation only, so F100-FR-140 was not changed | `annexes/E-engine.md:83` | Read ruling 49 in the same way for the model-tier bump once CQ-191 is answered |
| 3 | F100-FR-028 lets the audience change "through user configuration, the environment or a flag"; ruling 2 says the owner sets `personal` "once in user config". CQ-183 names rulings 34 and P2 only | `annexes/A-foundations.md:161` | Widen CQ-183 to ruling 2, or leave F100-FR-028 |
| 4 | The control of T-44 names "exact versions". No requirement of feature 100 states the exact pin of a dependency; only task T005 does | `annexes/X-cross-layer.md:832`; `tasks.md:50` | One sentence in F100-FR-027 or a new requirement, by order of the orchestrator |
| 5 | `amendments-worklist.md` and `analyze-report.md` of this feature are records of earlier steps and were not rewritten; they still hold the old counts and owners | — | Leave as records |
| 6 | The earlier tables of `spec.md`, "Amendments after the fan-out" (rows of F100-FR-227 and F100-FR-234, the row on profile rows 32 and 34, the row on the package graph), name 115 and 142 as the features that raised a point. They are a record of who raised it and were left | `spec.md:492`, `:499`, `:521`, `:575` | Leave as records |

## New questions for the clarify queue

| # | Question | Sources | Recommended answer | If answered otherwise |
|---|---|---|---|---|
| N-1 | Ruling P5 says the ceiling of workers is configurable. Has the ceiling itself an upper bound? | `APPROVAL.md` ruling P5; CQ-006; F100-FR-127 | No bound in the product: `loop.parallel.workersMax` is a whole number of 1 or more, a widening key, so only the consumer can raise it | A bound (for example 8) is added to F100-FR-127, F142-FR-019 and the key list |
| N-2 | Is `harnesses.<id>.proposerCustomisations` one key for every customisation that a harness loads by itself, or one key per kind (instruction files, extensions, skills, context files, prompt templates)? | F131-FR-014; F134-FR-029; ruling 36; Principle VIII; profile rows 29 and 119 | One key per harness, off or on; a harness adapter maps it to its own switches and reports a customisation it cannot switch as null in `capabilities` | One key per kind: row 131 becomes several rows, named by features 131 and 134 |
| N-3 | Which YAML parser does the product use? No plan names one; feature 100 proceeds on the package `yaml` (research D-8), unverified | `specs/110-config-and-terms/plan.md:23`; W-X-27 | The package `yaml`, pinned by feature 110 | Feature 110 names another parser; D-8 of feature 100 follows |
| N-4 | Does "unknown subcommand" in F100-FR-182 mean the first argument only? | Annex G §G.4; ruling K6; F104-FR-020 | Yes; see finding 1 | F104-FR-020 changes to exit 1 for an unknown sub-verb of `spec`, against the baseline |

## Second pass after the cross-feature review (2026-09-30)

From section A of `docs/ecosystem/reviews/SECOND-PASS-LIST.md`: items A1 to A37 and A2a, plus one
extra defect found while reading (`research.md` held two headings numbered D-8). The changes to
the requirements are listed in `spec.md`, "Second pass after the cross-feature review (2026-09-30)".
Nothing was renumbered; rows were appended. 82 files generated, `--check`: 0 differ. The
traceability check passes checks a to h over all features.

| Item | State | Files and lines changed | Note |
|---|---|---|---|
| A1 | done | `annexes/X-cross-layer.md` §X.6 rows 271 to 273 and the relation sentence after the table | Closed by A1 (W-100-18): rows 5 and 96 stand; `crash` means the same in both |
| A2 | done | `annexes/X-cross-layer.md` §X.6 row 274; `annexes/G-cli.md` §G.8 | Unknown class fails the build; `assumption: CQ-194` |
| A2a | done | `annexes/X-cross-layer.md` §X.8 N-29; F100-FR-213; §X.6 row 85 | Per DV-116 |
| A3 | done | `annexes/X-cross-layer.md` §X.6 rows 275, 276 | Owner 130 |
| A4 | not applied | — | Already satisfied: §X.6 row 218 holds the set with the exact members and owner 131 |
| A5 | done | `annexes/X-cross-layer.md` §X.6 row 277 | Open registry, owner 122. Feature 122 can now fill `"row": null` in its `contracts/closed-sets.json` with row 277 |
| A6 | done | `annexes/X-cross-layer.md` §X.6 row 14; §X.7 row 132 | DV-114; owner 123 |
| A7 | done (decision) | `annexes/B-state.md` §B.5 `workspace:layout-version` | The writer is the runtime root (the engine at start, mode `standalone`), matching F122-FR-043; feature 122 changes nothing |
| A8 | done | `annexes/G-cli.md` §G.3, table of product lines | `[SPECSTRIDE-STATE]`: keys `action`, `feature`, `approvals`, and where the command has one, `out` or `from`; printed by the three state commands of 122 |
| A9 | done | `annexes/G-cli.md` §G.7 "Wave 1 implementations" | `pipeline.terminalTool` (123, warn, not launch-blocking); adapter-check ids stay open under CQ-108 and CQ-150 |
| A10 | done | `annexes/B-state.md` §B.5 `attempt:<N>:<k>:<n>:session` | At auth tier 1 no session state is kept in the configuration home; where the harness cannot keep it elsewhere, continuation is off |
| A11 | question | — | See N-5 below |
| A12 | done | `annexes/C-ports-and-edges.md` §C.9 "Outputs" | Under the recommended answer of CQ-190 a source that reads repository text reports no declared reads or writes |
| A13 | done | `annexes/A-foundations.md` F100-FR-234 | Per F105-FR-035 (B-1127) |
| A14 | done | `annexes/E-engine.md` §E.1 "Errors" of `judge` | A missing credential is a failed call under `parity` (row 133; DV-117; CQ-187) |
| A15 | done | `annexes/C-ports-and-edges.md` F100-FR-088 | The move holds for every critic-class call, the diagnostician included |
| A16 | done | `annexes/X-cross-layer.md` §X.7 row 133 | DV-117; owner 101; no key (110 may name one). F101-FR-010 can now take `divergence: DV-117` and "row 133" in its `parity:` line; `F126-FR-016` cites DV-117 too |
| A17 | done | `contracts/sources/package-graph.json` | `@specstride/integrity` owner "116; 115 (checkpoint reading, tripwire record)", note names the directories |
| A18 | done (decision) | `contracts/sources/package-graph.json` | The owner field of `@specstride/core` names the module groups of 142 and 143 under `src/parallel/`, with a note that a module group of the core may belong to a feature that is no owner of the package. The plans of 142 and 143 stand; no code moves |
| A19 | done | `annexes/D-pass-loop.md` §D.1 | `integrateGroup` carries, per worker, `accepted` or the refusal reason; the four engine reports (missing object, changed ledger, application not completed, adapter without a spending limit) are named |
| A20 | done (decision) | `annexes/D-pass-loop.md` F100-FR-127 | The reading is stated: project configuration may lower `loop.parallel.workersMax` and never raise it; a higher value in project configuration is ignored, with a message at launch. Feature 142 states neither reading and can now cite F100-FR-127 as it stands |
| A21 | question | — | See N-6 below |
| A22 | done | `annexes/G-cli.md` §G.4 row `spec` | A missing phase number of `tick`, `title`, `shape` or `slice` is a cause of exit 3 (F104-FR-020) |
| A23 | done in part | `annexes/G-cli.md` F100-FR-182 | Finding 1 applied (A23.1). Findings 2 to 4 are questions N-7 to N-9 below; nothing else changed |
| A24 | question | — | The four first-pass questions N-1 to N-4 stand as written in the previous section, each with its recommendation; they are still not queued |
| A25 | done | `annexes/A-foundations.md` F100-FR-009 | Under `parity` the cap is not below the as-is sizes that reach the critic prompt |
| A26 | question | — | See N-10 below |
| A27 | done | `annexes/H-hosts.md` §H.1 "Caller and time" | The wording proposed by feature 113, taken as written |
| A28 | question | — | See N-11 below |
| A29 | done | `annexes/A-foundations.md` F100-FR-024 | "or where the diversity test gives `unverified`" added |
| A30 | done | `annexes/X-cross-layer.md` §X.8 alias table | The seven as-is telemetry variables of 128; the as-is timeouts are seconds, the keys milliseconds, and the alias multiplies by 1000. The four wrong cells of the key list are 110's (its own item B2) |
| A31 | done | `annexes/C-ports-and-edges.md` §C.5 | The condition is confirmed: the dialect row carries `trackTerminal`; `prime-v3` sets it; a second terminal is dropped as `duplicate_terminal`. No field of its own |
| A32 | question | — | See N-12 below |
| A33 | question | — | See N-13 below |
| A34 | done | `annexes/B-state.md` §B.20 | The two internal records of 130, `urn:specstride:schema:internal:130:<name>/1`; no logical name, no contract of the `contracts` package |
| A35 | question (nothing changes) | — | Feature 100 keeps only `targetIsCriticModel` and the sentence on the warning. The signal `targetSharesCriticModel` is 115's own; if the orchestrator wants one signal only, it leaves 115 and nothing in 100 changes |
| A36 | not applied (outside feature) | — | `docs/ecosystem/STAGE-B-F100-AMENDMENTS.md:82` names the closed set "Checks of the context-cost CI"; the amendments file is not written by a feature. The set of feature 148 in §X.6 keeps its own name |
| A37 | not applied (outside feature) | — | Brief 113 of `feature-briefs.md`, heading 4, "a free-grader suite per pull request". Read with the repaired annexes this names the free tier of the grader, which runs on a stub; no conflict with annex H as amended. Not written by a feature |
| Extra defect: `research.md` | done | `research.md` | The second heading numbered D-8 (conformance suites) is now D-10. No cross-reference inside `specs/100-specstride/` named it: every "D-8" elsewhere in the feature names the YAML-parser decision, which keeps its number. The heading now stands before D-9; the order of the text was not moved, because ids are append-only |

Counts: 27 done (A1, A2, A2a, A3, A5 to A10, A12 to A20, A22, A23, A25, A27, A29 to A31, A34, and
the research defect; A7, A18, A20 are decisions taken), 1 not applied for cause (A4, already
satisfied; A36 and A37 are outside the feature), 9 questions (A11, A21, A24, A26, A28, A32, A33,
A35, and the four first-pass questions of A24 counted once).

### What another feature or the orchestrator must do

| # | Who | What |
|---|---|---|
| 1 | 101 | F101-FR-010 can now take `divergence: DV-117` and "row 133" in its `parity:` line (its own item B7) |
| 2 | 122 | `contracts/closed-sets.json` `"row": null` of the lock and liveness providers can be filled with row 277; the writer of `workspace:layout-version` is its runtime root (F122-FR-043), as its spec says; it owns the implementation of the two file ports of grounding and hiding if N-10 is answered as recommended |
| 3 | 142, 143 | The package graph now names their module groups in `@specstride/core`; nothing moves. F142-FR-019 can cite F100-FR-127: project configuration may lower `loop.parallel.workersMax` and never raise it |
| 4 | 111 | Rows 271 to 273 close W-100-18; W-111-05 can be marked applied on the 100 side |
| 5 | 110 | The seven telemetry variables are now in the alias table; its four wrong key-list cells (A30) and the key for the switch of F101-FR-010 (CQ-187) are still its own items |
| 6 | 112 | The `harness.<id>.<check>` ids of 130, 131, 134 and 138 wait for confirmation (CQ-108, CQ-150); `pipeline.terminalTool` is registered by 123 |
| 7 | 126 | `trackTerminal` on the dialect row is confirmed; no field of its own |
| 8 | 107 | Row 274 closes the set behind CQ-194 on the 100 side; 107 owns the members |
| 9 | 130 | Rows 275 and 276; the two internal schema ids are named in annex B §B.20 |
| 10 | 117, 122 | See N-10 |
| 11 | Orchestrator | The four first-pass questions N-1 to N-4 and the new questions N-5 to N-13 below are still not queued; the queue ends at CQ-195 |

### New questions (each with a recommended answer and its source)

| # | Question | Sources | Recommended answer | If answered otherwise |
|---|---|---|---|---|
| N-5 (A11) | F100-FR-231 keeps the as-is fallback under `parity` (CQ-145). The adapters 125 and 131 refuse a critic whose window is unknown in every profile. Which stands for the adapters? | F100-FR-231; F125-FR-*; F131-FR-*; CQ-145 | Feature 100 stands as the compromise of CQ-145: under `parity` every harness uses its as-is fallback; outside `parity` an adapter may refuse where the baseline refused. The adapters need no change and no register row; the difference is stated in their own specs | The adapters take the fallback too: their refusal sentences get `divergence:` rows of their own |
| N-6 (A21) | In which file is the result of the traceability check recorded, so that a test of the product (T102 of 109) can read it? | Item 3 of the report of 109; W-100-21 | `docs/ecosystem/traceability-check-result.json`, written by `docs/ecosystem/check-traceability.py` through a `--result <path>` flag; until the file exists the test skips as today. The script is the orchestrator's file | The result stays on standard output only, and the skip keeps blocking a release |
| N-7 (A23.2) | F100-FR-140 skips a target on the critic's model whatever the effort, where CQ-191 asks whether a higher effort on that model is allowed | F100-FR-140; CQ-191; ruling 49; F100-FR-130 (already repaired) | F100-FR-140 takes the same reading as F100-FR-130: a rung that shares only the model is allowed, with the warning; only a rung equal in model and effort is skipped | F100-FR-140 stands, and the two requirements disagree |
| N-8 (A23.3) | F100-FR-028 lets the audience change by environment or flag, where ruling 2 says user configuration | F100-FR-028; ruling 2 | Ruling 2 stands for every switch: the words "the environment or a flag" leave F100-FR-028 | The audience keeps its wider sources, and ruling 2 names the exception |
| N-9 (A23.4) | The "exact versions" part of the control of T-44 has no requirement | The worklist; T-44 | One sentence in annex A §A.3: a tool the control of T-44 names runs at the version the control pins. No requirement id is spent on it | The control stays without a requirement, and the check has no anchor in the spec |
| N-10 (A26) | Where do the two file ports of grounding and hiding live? | Item 1 of the report of 117; F100-FR-234 | 117's plan stands: the types in the core, the implementation in `packages/runtime/src/ports/critic-input-files.ts`, composed by 122. Feature 122 must know of the file; F100-FR-234 keeps its three Wave 1 edge interfaces and names no fourth | The interface moves into the `contracts` package and the implementation into an edge package; F100-FR-234 gains a fourth Wave 1 interface |
| N-11 (A28) | Does the state that a host package keeps in the data directory of the host (the two markers of 113) get a logical name and a place, for example `host-data`? | Item 2 of the report of 113; annex B §B.5 | Not in Wave 1: no feature reads that state across a boundary; the two markers stay local to 113. If a second host needs it, annex B §B.5 gains the place `host-data` and the names then | Annex B §B.5 gains `host-data` now, with two names that nothing reads |
| N-12 (A32) | What does the entry of the resolved registry name for a harness whose baseline pass is unpiped (dsh, Codex) or takes the legacy path (Claude), under `parity`? | Item 4 of the report of 126; CQ-151; `specs/130-adapter-dsh/contracts/descriptor-dsh.json:16` | The entry names no stream format for the route: the tap takes the `claude` format by default, as at the baseline. No field is added to the registry schema of §C.6; the field `parityFor…` of the descriptor of 130 is that feature's own data | The registry schema gains an optional field `parityStreamFormat`, and §C.6 and the descriptor agree on its spelling |
| N-13 (A33) | What is the status of `--no-critic-autopick`, which is in no annex of feature 100, and of `--resolve-roles`? | Report of 124; `contracts/config-keys.json`; annex G §G.1; CQ-106 | `--no-critic-autopick` stays "proposed (R20, R16)" until a feature claims it; it enters an annex of feature 100 only when the owner answers. `--resolve-roles` waits on CQ-106, which is still open on the spelling | The flag is dropped from the key list, and 124's scenario loses its anchor |

### Register rows needed (with the text)

None. DV-114, DV-116 and DV-117 were written in Stage B after the cross-feature review and stood
before this pass (`docs/ecosystem/consolidation.md`, rows 114, 116 and 117 of 117); this feature
added only their annex rows (§X.6 row 14, §X.7 rows 132 and 133, N-29).

### Checks

- `python3 contracts/tools/generate.py`: 82 files written; `--check`: 0 differ.
- `python3 docs/ecosystem/check-traceability.py --require-all`: PASSED, checks a to h, over all
  features. The check that F126-FR-016 cites DV-117 in a `divergence:` line no longer fails: the
  register and annex rows stand.
- Counts now: 236 requirements (unchanged), 277 closed-set rows (§X.6), 133 profile rows (§X.7),
  29 normalization rules (§X.8), 17 rows in annex B §B.20, 117 register rows (unchanged).
