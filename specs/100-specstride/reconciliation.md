
## reconcile-2026-11-01
- a) test coverage: uncovered:CT-100-101,CT-100-102,CT-100-103,CT-100-104,CT-100-105,CT-100-106,CT-100-107,CT-100-108,CT-100-109,CT-100-110,CT-100-111,CT-100-112,CT-100-334,CT-100-335
- b) unresolved markers: ok
- c) dangling refs: ok
- d) headers: ok
- e) analyze-report: ok

## reconcile-2026-11-01 coverage adjudication
<!-- Scope note: the premise searched only tests/ and packages/. All 14 ids in fact exist, fully labeled, in tools/import-boundary/test/ — a directory outside that scope. Adjudicated per-id below; "found-unlabeled" is used loosely: the implementing test exists but does not live in tests/ or packages/. -->
- [CT-100-101] found-unlabeled: tools/import-boundary/test/layering.test.ts:33 — "CT-100-101: the graph refuses an import from a lower to a higher layer (LR-1)" (also :53, :69; lives in tools/, not tests/ or packages/)
- [CT-100-102] found-unlabeled: tools/import-boundary/test/layering.test.ts:84 — "CT-100-102: a host package may import nothing of the product but the CLI protocol (LR-2)" (lives in tools/)
- [CT-100-103] found-unlabeled: tools/import-boundary/test/layering.test.ts:112 — "CT-100-103: the packages of L6 and L5 share no import (LR-3)" (lives in tools/)
- [CT-100-104] found-unlabeled: tools/import-boundary/test/layering.test.ts:164 — "CT-100-104: the writers of the control plane are packages of the runtime tree only (LR-4)" (lives in tools/)
- [CT-100-105] found-unlabeled: tools/import-boundary/test/layering-5-8.test.ts:36 — "CT-100-105: the event file of a run has one writer per liveness state (LR-5)" (also :57 for the learning writer domain; lives in tools/)
- [CT-100-106] found-unlabeled: tools/import-boundary/test/layering-5-8.test.ts:89 — "CT-100-106: process boundaries of E §E.4 and G §G.4 stay processes; the other boundaries are calls with result records (LR-6)" (lives in tools/)
- [CT-100-107] found-unlabeled: tools/import-boundary/test/layering-5-8.test.ts:144 — "CT-100-107: the five pure tables name the table evaluator of the kernel as their only evaluator in the graph (LR-7)" (lives in tools/)
- [CT-100-108] found-unlabeled: tools/import-boundary/test/layering-5-8.test.ts:196 — "CT-100-108: role resolution lives in the harness layer and no loop-layer or router package imports it (LR-8)" (lives in tools/)
- [CT-100-109] found-unlabeled: tools/import-boundary/test/layering-9-11.test.ts:50 — "CT-100-109: one ingress package names the redactor and a size cap (LR-9)" (also :83, :104; lives in tools/)
- [CT-100-110] found-unlabeled: tools/import-boundary/test/layering-9-11.test.ts:165 — "CT-100-110: no package of the graph is an oracle mode (LR-10)" (lives in tools/)
- [CT-100-111] found-unlabeled: tools/import-boundary/test/layering-9-11.test.ts:218 — "CT-100-111: every closed set has an owner and an unknown-value rule (LR-11)" (also :235, :292 for the schema property and the major-version validator refusal; lives in tools/)
- [CT-100-112] found-unlabeled: tools/import-boundary/test/core-rule.test.ts:47 — "CT-100-112: the graph marks the core packages (the engine and every loop layer)" (also :68, :95, :122, :136, :165, :282, :295, :311, :331; lives in tools/)
- [CT-100-334] found-unlabeled: tools/import-boundary/test/kernel-services.test.ts:85 — "CT-100-334: the kernel offers the core the four services it may not import (F100-FR-234)" (also :137, :177, :227, :258, :284, :301; lives in tools/)
- [CT-100-335] found-unlabeled: tools/import-boundary/test/kernel-services.test.ts:318 — "CT-100-335: the calls into learning are a plain function interface of the `contracts` package at L2 (F100-FR-235)" (also :346, :374; lives in tools/)

Evidence of search: grep -rn "CT-100-10x/11x/33x" tests packages --include="*.test.ts" returned no match for any of the 14 ids (only CT-100-336 in tests/release/100/publish-attestation.test.ts). Keyword sweeps (LR-1, mayImport, role resolution, closed set, oracle mode, layout.json) found only unrelated feature tests (106, 142, 148, testkit EP-04, etc.), none implementing these annex-A §A.2–§A.4 layering rules. Counts: 14 found (all implemented and id-labeled, but under tools/import-boundary/test/, outside the declared tests/ + packages/ scope), 0 missing.

## reconcile-2026-11-01
- a) test coverage: ok
- b) unresolved markers: ok
- c) dangling refs: ok
- d) headers: ok
- e) analyze-report: ok
