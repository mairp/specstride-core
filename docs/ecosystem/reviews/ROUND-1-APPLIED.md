# ROUND-1-APPLIED — the owner's answers of the clarification round that need a spec change

Dated 2026-09-30. Rules: `docs/ecosystem/STAGE-B-RECHECK-PROMPT.md` section 2 (no git command that
changes the repository, no subagents, verified against the files, nothing renumbered). Written only in
`specs/100-specstride/`, `specs/104-spec-input/`, `specs/123-pipeline-runtime-and-supervisor/`,
`specs/126-stream-seam-and-invocation/`, `specs/143-parallel-engine-services/` and this report.
`consolidation.md` was not edited: the orchestrator narrows register row DV-114 to O-34.

## Answers applied

| Answer | Feature | Done | Files and lines (after the change) |
|---|---|---|---|
| CQ-238 | 123 | yes | `spec.md:159` (table 1 intro), `:187` (O-33 predicate is `blocked` only), `:206` (`parityProfile` switches O-34 only), `:208`, `:319` (US1 scenario 3), `:593`, `:596` (F123-FR-030), `:664`, `:666`, `:668` (F123-FR-042), `:867`-`:868` (repairs), `:876`, `:902` (Clarifications), `:929` (Assumptions); `plan.md:62` (VIII passes), `:73` (XVI passes), `:82`, `:88`-`:89`, `:188`-`:190` (Complexity Tracking row removed; now empty); `tasks.md:260` (T082), `:262` (T083: matrix under the default profile and `parity`); `research.md:26`; `contracts/tools/generate.py:52`-`:55` (O-33 = `blocked`); `contracts/relaunch-observe.table.json` regenerated. `divergence: DV-114` kept on F123-FR-030 and F123-FR-042 for O-34 only |
| CQ-238 | 100 | yes | `annexes/F-runtime-root.md:89`, `:91`, `:93` (F100-FR-163: no `parity` exception for a blocked run, kept for O-34); `annexes/X-cross-layer.md:610` (§X.7 row 132: O-33 not switched by the profile); `plan.md:66` (VIII passes), `:77` (XVI), `:86`-`:89`, Complexity Tracking row on Principle VIII removed (was `:236`); `spec.md:475` (Assumptions, CQ-238 closed), `:934`ff (repairs); `contracts/data/parity-profile.json`, `contracts/requirements.json` regenerated |
| CQ-145, CQ-202 | 100 | yes | `annexes/C-ports-and-edges.md:225` (F100-FR-231: refused outside `parity`, as-is fallback under `parity`, DV-106, DV-111; declared window always wins), `:230` (assumption line); `spec.md:732` ("different readings" row), `:477` (CQ-202 listed), repairs subsection; `contracts/requirements.json` regenerated |
| CQ-214 | 100 | yes | `annexes/X-cross-layer.md:161` (§X.5: operation "Classification of the staleness verdict", rules 104), `:163`-`:165` (F100-FR-207 and `assumption: CQ-214`); `spec.md:478` (CQ-214 listed), repairs subsection; `contracts/data/kernel-operations.json`, `contracts/annex-tables/X-cross-layer.json`, `contracts/requirements.json` regenerated. The hasher is specified in annex X §X.5 / F100-FR-207, not in annex A / F100-FR-234 |
| CQ-214 | 104 | yes | `spec.md:301`, `:307` (F104-FR-024: classification is the kernel hasher's pure operation; `spec-formats` reads files and lines; no EP-03 operation), `:319`, `:323` (F104-FR-027: 102 and 103 reach it through `@specstride/kernel`), `:463` (Assumptions), `:478`-`:479` (repairs); `plan.md:119`-`:120`, `:129`-`:130` (source tree), `:149`-`:153` (Structure Decision); `tasks.md:123` (T036: `packages/kernel/src/hasher/staleness.ts` + `spec-formats/src/verdict.ts`), `:167` (T051 static check); `data-model.md:12` |
| CQ-228 | 126 | yes | `spec.md:342` (F126-FR-035: outside the compatibility projection the one event writer writes `agent_result` and calls every open sink; "local destination only" for the as-is form only), `:345` (test CT-126-12 added), `:347` (`assumption: CQ-228`), `:505` (Assumptions), `:535`-`:543` (repairs subsection); `tasks.md:87` (T030), `:113`-`:114` (new T042, CT-126-12, proves F126-FR-035), `:121` (dependency). PT-126-C-157-result-event (T027) keeps the as-is form |
| CQ-237 | 143 | yes | `spec.md:265` (F143-FR-027: the words dropped twice; `release` removes tree and temporary directory, writes the worker root only, annex D §D.2; snapshots leave the store with `sweep`), `:268` (`assumption: CQ-237`), `:410`-`:411` (operation table rows `release`, `sweep`), `:497` (repairs), `:524`-`:528` (Assumptions, CQ-237 at `:528`); `data-model.md:11`-`:12` (Worker, Snapshot); `tasks.md:180` (T058) |

## Requirements changed in place

| Requirement | Answer | Listed in the spec's repairs section |
|---|---|---|
| F100-FR-163 | CQ-238 | `specs/100-specstride/spec.md`, "Answers of the owner, round 1 (2026-09-30)" |
| F100-FR-231 | CQ-145, CQ-202 | same |
| F100-FR-207 | CQ-214 | same |
| F123-FR-030 | CQ-238 | `specs/123-pipeline-runtime-and-supervisor/spec.md`, "Repairs after the cross-feature review" |
| F123-FR-042 | CQ-238 | same |
| F104-FR-024 | CQ-214 | `specs/104-spec-input/spec.md`, "Repairs after the cross-feature review" |
| F104-FR-027 | CQ-214 | same |
| F126-FR-035 | CQ-228 | `specs/126-stream-seam-and-invocation/spec.md`, "Answers of the owner, round 1 (2026-09-30)" |
| F143-FR-027 | CQ-237 | `specs/143-parallel-engine-services/spec.md`, "Repairs after the cross-feature review" |

New ids (appended, none reused): test CT-126-12 and task T042 of feature 126.

## Left to others

- Register row DV-114 (`consolidation.md`): narrow to O-34 (orchestrator).
- Feature 103 (`plan.md:162` compares hashes itself) and feature 102 should call the kernel's
  classification (F104-FR-027 as changed); not in the files this pass may write.

## Checks

| Command | Result |
|---|---|
| `python3 specs/100-specstride/contracts/tools/generate.py --check` | checked 82 files, 0 differ |
| `python3 specs/123-pipeline-runtime-and-supervisor/contracts/tools/generate.py --check` | contracts of feature 123: ok |
| `python3 docs/ecosystem/check-traceability.py --require-all` | PASSED: checks a to h |
