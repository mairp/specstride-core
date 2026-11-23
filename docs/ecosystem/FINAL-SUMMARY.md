# FINAL SUMMARY — Stage B of the Specstride consolidation

Written by the orchestrator on 2026-09-30, at the end of Stage B (`prompts/specstride-stage-b.md` §7).
Every count is taken from the files by `docs/ecosystem/reviews/FINAL-SUMMARY-FACTS.md`, which states
the command behind each one. All paths are relative to `/root/specstride-claude`.

## 1. What exists now

| Artifact | State |
|---|---|
| Constitution | v3.0.0, twenty principles, applied; the plan template's Constitution Check matches it |
| Specifications | 41: the umbrella `100-specstride` (spec plus annexes A to H and X, and generated contracts), `141-parity-oracle`, 30 Wave 1 features and 9 split parts (116, 140, 143, 144, 145, 146, 147, 148, 149) |
| Requirements | 1,643 functional requirements and 284 success criteria, globally unique ids `F<nnn>-FR-<nnn>` |
| Tasks | 2,983, with parity and characterization tests as required tasks; 37 tasks marked paid, none run |
| Contracts of feature 100 | 82 generated files (schemas, extension points EP-01 to EP-19, closed sets, the `parity` profile, the package graph, the threat model); `generate.py --check` passes |
| Traceability | 110 as-is requirements, 23 success criteria and 2,785 behaviour items each resolve to a requirement, a register row or a roadmap entry; `check-traceability.py --require-all` passes checks a to h |
| Divergence register | 120 rows, DV-001 to DV-120 (DV-118 to DV-120 added after Stage B, on 2026-09-30, by the analyze runs of features 104 and 107); every row cited by at least one spec (DV-120 by feature 107, F107-FR-005 and F107-FR-012, with the map entry of annex X §X.8 of feature 100, F100-FR-214, applied on 2026-09-30) |
| Clarify queue | 238 entries, all closed (section 5) |
| Reviews | 13 cross-feature review reports, a repair worklist of 170 items, 6 re-check reports; every feature repaired and re-checked; every analyze report ends with no critical or high finding open |

Numbers are hard to hold in the head at this scale, so the reader should trust the checks rather than
the prose: the coverage check and both generators pass on commit `9c564c3` and later.

## 2. The decisions

The rulings of `APPROVAL.md` stand unchanged and are reflected in the specs: of 101 rulings the reviews
found 89 reflected, 6 partly (repaired since), 6 needing no requirement, none contradicted. The
decisions Stage B itself had to take, with their authority:

| Decision | Where | Authority |
|---|---|---|
| Feature 100 is one feature with annexes by layer, 236 requirements; never split | `specs/100-specstride/` | Ruling 16 |
| Nine features were split along the groups their briefs name, after `speckit-specify` yielded more than 45 requirements; the second part took the reserved or next free number | Ledger, "Splits" | Prompt §4 |
| Feature 138 (47) and 142 (46) are one and two above the mark after the repairs and are not split again | Ledger | Orchestrator; the split rule is applied once, after specify |
| dsh and prime are usable when named, never a default, never picked, under every audience, for both roles | F130-FR-004, F138-FR-004, F124-FR-036, F147-FR-008 | Ruling P14 |
| A tool-less critic on a harness without an initial stream record is proven by version pin and preflight ("the weaker proof"), recorded per call; Principle IX gets a PATCH naming it | F100-FR-230, F109-FR-038, plans of 100, 109, 130, 134 | Owner, CQ-182 |
| dsh runs as proposer with its profile loaded when named; each customisation that cannot be switched off is reported, warned and recorded; refused as critic where native memory cannot be switched off | F130-FR-043 to 045 | Owner, CQ-189 |
| The skill-trigger suite of the Claude Code host leaves CI: paid runs are logged tasks a person runs; the release check reads the log; the model comes from the run's configuration | F113-FR-038 to 041 | Owner, CQ-188, CQ-220, CQ-221 (Principle XII over the brief) |
| Build tools outside every published package (three Python pieces) are no component of the Language Ledger; Python 3 is a development requirement | Plans of 100, 141 | Owner, CQ-186 |
| A metadata listing covers an ignored path from which a check executes, with content hashes for pinned executables and class A matches; a stated deviation from Principle III for Wave 1 | F116-FR-003 | Owner, CQ-197 |
| A run blocked on a human is never relaunched, under every profile (row O-33); a stop that is not retryable is refused outside `parity` only (O-34) | F100-FR-163, F123-FR-030, F123-FR-042, DV-114 | Owner, CQ-238 |
| An unlisted critic model is refused outside `parity`; the as-is fallback holds under `parity` | F100-FR-231, F125-FR-027, F131-FR-030 | Owner, CQ-145, CQ-202 |
| "User config" in rulings 34 and P2 means the user configuration only | F100-FR-111, F100-FR-112 and the adapters | CQ-183, on the recommendation |
| Config precedence has the eight ranks of ruling 10; the worker ceiling is a key (`loop.parallel.workersMax`, default 4) | Annex X §X.2, §X.7 | Rulings 10, P5 |
| Content capture is on whenever traces are on, always through the one redaction point; off under `parity` | F100-FR-009, DV-083, DV-107 | Ruling 43 |
| No subagent of this effort runs on the top model: `sonnet` or `opus` only, few at a time | Ledger, memory | Owner, 2026-09-30 |

The full list of decisions taken on a recommendation without the owner's own answer is section 5.

## 3. Top risks

Ordered by what would hurt most if wrong.

| # | Risk | Where it is carried | What would settle it |
|---|---|---|---|
| 1 | **Detach survival inside a host session is unverified**, and so is writability of the control root under a shell sandbox and all macOS behaviour | 122 (the spike, tasks T001 to T005, two marked paid); EP-17; 206 requirements carry `status: unverified` | The spike, on Linux and macOS, sandbox off and on |
| 2 | **The parity oracle has never run against the port.** 248 scenario names, 40 fixture families; 34 scenarios have an end recorded on the reference, 9 of them read from the code only; three scenarios could not be reproduced on a read-only reference | 141 | The first execution of the suite; the release condition "every parity test passes" (ruling 32) |
| 3 | **Two adapters carry recorded deviations from NON-NEGOTIABLE principles**: dsh (Principle VIII, CQ-189; Principle IX, the weaker proof) and prime (Principle VIII until capture 5, CQ-234). pi and Codex carry the weaker proof too | Plans of 130, 138, 134, 131, 109, 100 | The captures named in each plan; a PATCH of Principle IX |
| 4 | **Provider facts rest on documentation**: the Claude critic flag combination (one live call per role, T076 of 125), Codex's quota event and sandbox under `exec resume`, pi's exit code on a provider error, dsh's approval behaviour headless, the tool ids of a composed dsh profile | 125, 131, 134, 130; 37 paid tasks | The paid probes, each logged in `PROGRESS.md` when run |
| 5 | **No inner check has ever run**, so check duration and the 15 % budget of the micro-loop layer are unknown; the 25 % time saving of decision 21 depends on fail-fast for long jobs (R22, R27) | 115, 116, 148; experiments X0 to X12 | Experiment X0 (cost counted for every pass) first, then X5 |
| 6 | **Twenty-seven of the local model's repairs and the second pass were re-checked by a stronger model, and every one needed fixes** (89 fixes). The re-check read the changed places, not every line; a wrong sentence may remain in a place no review item named | Re-check reports B-8.7-A to F | The first implementation slice reads its own specs whole before it starts |
| 7 | **Feature 100 is 236 requirements**, above any comfortable size; the other features cite it and a change there ripples | Annexes by layer; the generator; the coverage check | Change annexes first and regenerate; never edit a generated file |
| 8 | **Package placement drifted in nine plans** during Stage B (invented packages in 104, 106, 107, 111, 126, 128, 134, 144, 147, all repaired). The package graph of feature 100 is the rule and is now enforced only by reading | `contracts/data/package-graph.json` | A lint in the build that reads the graph (a task of feature 100) |
| 9 | **The token budgets of the host skills** do not add up for the doctor skill with an 800-token body (CQ-219: the resident listing counts, so the body is at most 742 tokens) | 112, 113 | The CI check of F113-FR-041 |
| 10 | **A machine-specific backend name** must appear nowhere; the reviews found zero hits, but every future edit is a chance to reintroduce it | The naming rule | A grep in the build |

## 4. Recommended first implementation slice

The smallest slice that exercises the architecture end to end and retires risks 1 and 2 early:

1. **Kernel and contracts** (feature 100, packages `contracts` and `kernel`): the schemas, the canonical hasher, the atomic write, the table evaluator, the redactor, the process primitive. Everything else imports these.
2. **Detached runtime and run control** (122, 102): the spike first (T001 to T005 of 122), then the runtime root, the workspace record, lease, launch record and the `resume` rules. This retires risk 1 or stops the plan.
3. **Event schema and the compatibility projection** (111, 144): the one event writer and the projection to the as-is event names, because the parity oracle compares them.
4. **The parity oracle** (141) with the stub agents and the first fixture families FX-01 to FX-11, run against steps 1 to 3 as they land. This retires risk 2 progressively rather than at the end.
5. **Spec input, gate and verdict, proposer pass, critic** (104, 101, 149, 103, 117) with the Claude adapter (125) at auth tier 1 and the stream seam (126): the first end-to-end run of one phase.
6. **Verification and the check runner** (105, 148), then the pipeline runtime and supervisor (123) and the Claude Code host (113).

Left for a second slice: the micro-loop layer and its integrity edge (115, 116), parallel units (142, 143), the other four adapters (130, 131, 134, 138), discovery and roles beyond the default pick (124, 146), telemetry export (128), learning (106), reverse (108, 140), the terms gate (147), the presenter and the run view (119, 145, 129), the doctor (112) beyond the checks the first slice needs, quota and budgets (127), the launch contract (107). Each is specified and can start when the first slice's contracts are stable.

Build-order facts the specs record: 134's T025 writes `terms-facts.json` before 147's T005; the port of feature 100's generator (T207) comes before release; T064 of 119 builds the bundle that 113 ships.

## 5. What was assumed without the owner's explicit confirmation

The owner answered 25 questions in the round in person (CQ-017, 020, 021, 023, 024, 032, 035, 041, 110, 117, 135, 142, 143, 145, 182, 186, 188, 189, 197, 199, 202, 220, 221, 234, 238), every answer equal to the recommendation. The owner then instructed: "any other question: go with your recommendation". On that instruction **196 entries were closed on their recommended answer** (187 by the instruction, 9 the same way after a filter had missed them), among them the 12 whose answer the amendments to feature 100 had already applied. Each row of `CLARIFY-QUEUE.md` names how it was closed and who recommended the answer; where no report recommends one, the row says it is the orchestrator's or the feature's own reading.

The entries most worth a second look, because their answer is nobody's recommendation but the orchestrator's or a feature's, and they touch behaviour a consumer will notice:

| Entry | Assumption |
|---|---|
| CQ-183 | "User config" in rulings 34 and P2 is the user configuration only, not the environment or a flag |
| CQ-190 | Declared reads and writes of a verification command never come from repository text; undeclared means serial |
| CQ-191, CQ-204 | An escalation or model-tier-bump rung on the critic's model at a higher effort is allowed, with the critic-diversity warning |
| CQ-192 | A tripped wall-clock budget is relaunchable and does not rest blocked |
| CQ-185 | No core package imports `node:fs`; files go through the kernel and the edge ports |
| CQ-214 | The staleness-verdict classification is a pure function of the kernel's hasher |
| CQ-215, CQ-216 | A detached staged command is started by the kernel primitive with the check runner's environment; the verification-commands document may still declare `resource` and `steps` |
| CQ-231 to CQ-233 | dsh: the critic is refused while native memory is "not established"; a critic-class call refuses a non-tool customisation that cannot be switched off; ruling P15's "user config" is the user configuration only outside `parity` |
| CQ-222, CQ-223 | `launch.checked` is emitted by the runtime root only for the checks it verifies itself; `[SPECSTRIDE-DIGEST]` leaves out keys without a fact |
| CQ-219 | The 1,500-token budget of the doctor skill counts the resident listing |
| CQ-160 | Key spelling: the 43 original rows of the `parity` profile keep their spelling, every other key is lowerCamelCase; unit suffixes `Sec`, `Ms`, `Min`, `Days`, `Bytes`, `Percent` |

Also assumed: every value the reviews' repairs chose where two features disagreed (the report of each repair names the side taken), and the readings recorded as deviations in the plans of 100, 109, 116, 123, 130, 131, 134, 138 under Complexity Tracking.

## 6. What did not pass, and what is open

| Item | State |
|---|---|
| `speckit-analyze` | Every feature: no critical or high finding open after at most two repairs. Medium and low findings left by design are listed in each `analyze-report.md` |
| Coverage check, both generators | Pass |
| Paid probes | None run in Stage A or B; 37 paid tasks stand, none checked |
| Feature sizes | 100 (236, accepted), 138 (47) and 142 (46) above the mark; not split again |
| Roadmap | Every Wave 2 and later item has a wave; `139-adapter-specstride` has no research report and no tier (it is the baseline as an adapter, for parity work only); the Windows and WSL row cites no research |
| Principle IX PATCH | Ruled (CQ-182), not yet written into `.specify/memory/constitution.md`; a task of the constitution owner before the first release |
| The DV-112 waiver | Reworded to name only the scenarios in which the prime stub starts; feature 141's map follows |
| Times of day in `PROGRESS.md` | Several notes of this session carry estimated times that are wrong; the commit times in git are the record |

## 7. What Stage B cost

292 commits since the baseline `b5d7bc7`; 40 commits touching `specs/` on the last day. Two usage
limits were hit on 2026-09-30 while 14 review agents and then 20 repair agents ran on the top model at
once, which the owner then forbade; the remaining work ran on `sonnet` and `opus`, at most four agents
at a time. Another session repaired fifteen features on a local 27B model in between; all of that work
was re-checked and repaired on `opus` before it counted (section 3, risk 6).

## 8. Where to start reading

| Want | Read |
|---|---|
| The rulings | `docs/ecosystem/APPROVAL.md` |
| The architecture | `docs/ecosystem/architecture.md`, then `specs/100-specstride/spec.md` and its annexes |
| One feature | `specs/<dir>/spec.md`, then `plan.md`, `tasks.md`, `repair-report.md` |
| Why a value is what it is | `docs/ecosystem/CLARIFY-QUEUE.md` (search the CQ id the requirement's `assumption:` line cites) and `consolidation.md` section 6 (the DV id its `divergence:` line cites) |
| What changed after the reviews | `docs/ecosystem/reviews/REPAIR-WORKLIST.md`, then the `B-8.7-*` re-check reports |
| The ledger | `docs/ecosystem/PROGRESS.md` |
