# Feature briefs

Stage A synthesis artifact. Status: **approved by the owner on 2026-09-29** (`APPROVAL.md`), with the
rulings applied. Where this file and `APPROVAL.md` differ, `APPROVAL.md` stands.

This file holds the final feature decomposition and one brief per Wave 1 feature. In Stage B each
feature is specified by a separate agent that receives **its brief from this file**, the contracts of
feature 100, the glossary (`consolidation.md` section 1) and its rows of `traceability.md`. Each brief
is therefore written to be read alone.

## 0. Conventions and sources

| Subject | Rule |
|---|---|
| Decomposition | `architecture.md` section 14 is the authority: **31 Wave 1 features and the umbrella**. Feature numbers and names are used exactly as written there |
| Origin of an as-is id | Always written: `028 FR-012` (Specstride at `9cab15d`), `011 SC-003` (mixture-of-loops at `9c88f86`), `002 FR-040` (Lisa, `363e6a3` for 18 packages and `76adfdc` for the dashboard). `B-nnnn` is a behaviour item and `C-nnn` a cluster of `research/R18-behaviour-inventory.tsv` |
| Terms | The glossary of `consolidation.md` section 1. A term marked "never bare" is written in its qualified form: phase gate, launch check, verification gate, phase attempt, stage attempt, launch contract, launch bundle, spec bundle, engine hook, host hook, harness adapter, auth tier, model tier |
| Owner rulings | "Ruling n" refers to `APPROVAL.md`: rulings 1 to 70 on the 90 entries of `DECISIONS-PENDING.md`, D1 to D3, K1 to K9, P1 and P2. `DP-nnn` refers to an entry of `DECISIONS-PENDING.md`; **all 90 are closed**. Under heading 6 of a brief every `DP-nnn` carries the number of the ruling that closed it. Where the owner ruled differently from the default the work had proceeded on, the brief says what the ruling says |
| Open questions | `CQ-nnn` refers to `CLARIFY-QUEUE.md` (CQ-001 to CQ-012). Each has a recommended answer and the brief proceeds on it. A brief that raises a new question names it "candidate for `CLARIFY-QUEUE.md`", with its recommended answer; section D.8 lists them |
| Divergences | `DV-nnn` refers to the divergence register, `consolidation.md` section 6, which is the single copy: 117 rows, DV-001 to DV-117. A brief that needs a row the register does not hold says "row to be written" |
| Rules for several workers | `PU-nn` refers to `research/R29-parallel-units-design.md` (PU-01 to PU-78) and to `research/R29v-parallel-units-red-team.md` (PU-79 to PU-104). Where R29v amends a rule of R29, R29v stands |
| Harnesses | No brief holds a closed list of harnesses (decision 17). Where a brief names a harness, it is a tested adapter of Wave 1 (Claude, dsh, Codex, pi, prime) or a literal of an as-is behaviour. Anything that enumerates harnesses reads the registry |
| Machine-specific names | One registry entry of the Specstride baseline is specific to the owner's machines. It is written "a locally registered backend". The same holds for launchers, variants, models and gateways of the owner's machines: none is named |
| macOS | Every statement about macOS is `unverified` (ruling 67) |
| Estimates | The estimated number of requirements per feature has **low confidence**. It comes from R15 A-9 (inventory items divided by 6.7, plus the new requirements named), adjusted for the changes of R15v and for the owner's rulings |

**Where the assignment of as-is requirements comes from.** `traceability.md`, `traceability-frs.tsv`
and `traceability-items.tsv` are the authority for which as-is requirement and which behaviour item
goes where. They were updated for the owner's rulings, and this file was aligned to them: sections
D.1, D.2 and D.6 are generated from the two data files, and a script checks that every row under
heading 2 of a brief agrees with `traceability-frs.tsv` in disposition and destination, and that the
item counts under heading 2 equal those of `traceability-items.tsv`. The result of the check is in
section D.8.

**What is `unverified` in this file.** The estimates; every macOS statement; whether a process started
from the host's shell tool survives the end of the session (the spike of feature 122); the Claude
critic's flag combination (no live call was made, R5); the quota signals on the Claude CLI stream
(R14 open question 5); and, for the features the owner added: what approval mode `ask` does in a
headless dsh run and whether its permission mode is enforced by the operating system; the structured
quota event of Codex and whether its read-only sandbox can deny reads of named paths; pi's exit code
on a provider error and whether its stream states the tool list; whether several headless processes
of one harness may run under one configuration home and one login; whether a harness's sandbox
confines its own file tools to a write root other than the workspace. Each is captured by the feature
named in its brief before that specification freezes.

---

## A. The final decomposition

### A.1 Wave 1: 40 features and the umbrella

"Est." is the estimated number of requirements. "Receives from" names the as-is systems (028, 011,
002) and "research" where the content has no as-is behaviour.

| Feature | Scope in one line | Receives from | Wave | Est. | Change against the prompt's suggestion | Justification |
|---|---|---|---|---|---|---|
| 100-specstride (umbrella) | Vision, glossary, layering rules, every cross-feature contract and every extension-point interface, the `parity` profile with a switch for every option, the list of closed sets, threat model, integration acceptance | 028, 011, 002, research | 1 | 194 | **Extended.** One feature, specified as annexes by layer | 31 features cite it; after R15v E-2 it also owns the ledger, approval record, terminal record, inbox request types, process registry, table evaluator, redactor and the `parity` profile. The owner's rulings add the contents of EP-04 for a stacked layer, the tree-store service, the two forms of the critic and the dialect table. One source to cite (ruling 16) |
| 141-parity-oracle | Reference trees, hermetic environment, stubs, 37 fixture families, the scenarios of dsh, Codex and prime, normalizer, comparator, waivers, exercise map, the second suite, the coverage script | 011, research | 1 | 40 | **New** | Decision 4 makes the oracle the release gate and no suggested feature had it in scope (R15v E-1). The release gate is "every parity test" (ruling 32). Specified right after 100 |
| 101-gate-and-verdict | The gated phase loop, nonce verdict, MALFORMED limit, oscillation halt, recovery cycle, attempt archive, the signed approval record, post-approval steps, the critic-strategy and attempt-planner seams, the tier bump as an option | 028, 002, research | 1 | 43 | **Narrowed**, then extended by the owner. Grounding, critic prompt and critic transports leave; the tier bump enters (ruling 48) | The suggested 101 would receive about 440 behaviour items, about 65 requirements (R15 A-9.1) |
| 117-critic-grounding-and-prompt | Grounding snapshot with caps and refusals, critic prompt assembly and window fitting, verdict pins, the slot and escaping of the fact block, data framing of untrusted text, what a critic with read-only tools is given and what is hidden from it | 028, 002, research | 1 | 33 | **New, split from 101** | `lib/critic.py` alone has 225 items, 205 of them with no requirement. Rulings 57a and D1 add the hiding of the proposer's files |
| 102-run-control | Stop, resume with its refusals and codes, the source hashes at launch and at resume, the run snapshot with pinned and tunable keys, counts that survive a resume and the reset flag, the operations of the run-state machine | 028, 002 | 1 | 33 | **Narrowed.** The front door leaves; lock and lease go to 122. Owns stop | The suggested 102 would receive about 370 items, about 55 requirements. Rulings K2 and K3 add the codes and two check points |
| 119-front-door-and-presenter | Front-door verbs, inspection commands, compatibility output, presenter, banner and theme | 028, 002 | 1 | 30 | **New, split from 102** | 294 items in four modules, nearly all without a requirement |
| 103-proposer-pass | The pass loop ported for parity, breakers, no-progress, pass budget, the source hashes at every pass start, the start-up of a pass (fixed), the hook points of the loop-layer interface with stacking and the group directives, the prompt assembler, carry-over (ledger, handoff, obligations index, cache-stable prompt start) | 028, research | 1 | 42 | **Narrowed.** Supervision and yield leave | The suggested 103 would receive about 330 items, about 50 requirements. Rulings K3, K7 and 56 add to it |
| 118-pass-supervision-and-jobs | Idle, progress and repeat watchdogs, the hard cap and kills, the polite stop, the yield artifact and its predicates, detached jobs, fail-fast | 028, research | 1 | 36 | **New, split from 103; takes fail-fast from 115** | Fail-fast has its own switch and its own ablation, nothing may ride on the layer's switch (IR-52), and it acts on a yield, which is specified here |
| 104-spec-input | Spec formats and detection order, resolution, the canonical spec model with structured tasks, one grammar owner, one hashing scheme, the staleness verdict for spec, plan and task list | 028, 011, 002 | 1 | 24 | Unchanged. Bundle import is deferred | About 130 items, about 22 requirements; ruling K3 adds the verdict for three files |
| 105-verification | Verification modes and what each does to a verdict, plans and plan sources, manifest derivation, the check runner, the step runner, concurrent verification commands with declared reads and writes, release verification, the integrity rules that hold with the layer off | 028, 011, 002, research | 1 | 41 | **Extended** with two extension points (EP-05, EP-07), the step runner, and concurrent commands (ruling D2) | Single owner of the step runner (R15v E-3). The second parallelism option of ruling D2 uses this feature's runner |
| 106-learning | Learning knobs and modes, the binding between launch contract and applied learning, the retrospective; the across-runs layer | 028, 011 | 1 | 29 | Unchanged | About 185 items; R12 keeps it as the only across-runs layer |
| 107-launch-contract | Inventory, derivation in bounded batches, validation, promotion, rendering, the launch bundle, the `dry-run` mode, the consumer's comment | 011, research | 1 | 26 | **Narrowed** to the launch contract | The suggested 107 would receive about 300 items plus the detached runtime |
| 123-pipeline-runtime-and-supervisor | The pipeline stage executor, in-stage retry, launch checks, both relaunch classifier tables, `supervise` verbs, digest and `[MOL-*]` lines, the run request of kind `engine` | 011, research | 1 | 35 | **New, split from 107** | It is the parity port of the pipeline runtime and the supervisor; it owns EP-19 |
| 122-detached-runtime | Detach strategies, lock and liveness, lease and heartbeat, process registry, processes that outlive the engine, inbox, re-attachment, state export, import and adopt, the spike | 028, 011, research | 1 | 30 | **New** | Decision 5 says the mechanism "is ours to design"; two features would otherwise each own half of it |
| 108-reverse | The wrapper and its refusals, plan, driver spec, reverse guard, source inventory, reverse lint, the `engine` run request of `specstride-reverse` | 028 | 1 | 52 | Unchanged as **one feature with two requirement groups** | R15 proposed two features; R15v E-6 found the cut artificial (one module pair). Split only if `speckit-specify` yields more than about 45 |
| 109-harness-seam | The open harness registry, the harness port with two capability levels and the two forms of the `completion` level, transports, harness descriptor schema, the generic descriptor-driven adapter, containment levels and ceilings, config-home overlay, environment allow-list | 028, 002, research | 1 | 35 | **Narrowed** | The suggested 109 would receive about 320 items plus discovery and the first adapter. Rulings 57 and 20 add the second critic form and transports |
| 124-harness-discovery-and-roles | The seven discovery sources, the probe ladder, the four states and promotion, role resolution, the critic order with the place of both critic forms, auto-pick with its announcement | research | 1 | 32 | **New, split from 109** | No as-is behaviour; its own threat rows (R11 T-13 to T-16) |
| 125-adapter-claude | The Claude harness adapter as proposer and tool-less critic, on two transports: the CLI subprocess, and the Agent SDK as an optional Tier 2 transport with API keys only; continuation, isolation, permission mode, quota signals, version pin | 028, 002 (Lisa source), research | 1 | 31 | **New, split from 109**; the SDK transport added by the owner (rulings 20, 70) | The first adapter is specified against the seam exactly as the four others are, which tests the seam |
| 130-adapter-dsh | The dsh adapter: proposer and critic, text stream, no session continuation, a critic made tool-less by a deny list of tool ids, exact version pin, the plugin request protocol | 028, research | 1 | 33 | **Moved from Wave 3 by the owner** (rulings 32, 32a, 32b) | Every parity test passes before any release, and 66 behaviour items belong to this harness |
| 131-adapter-codex | The Codex adapter: proposer; critic under a read-only sandbox in the working tree with the proposer's files hidden, and critic by direct API | 028, research | 1 | 27 | **Moved from Wave 3 by the owner** (rulings 32b, 57, 57a, D1) | 8 behaviour items belong to this harness; it is the first harness of the second critic form |
| 134-adapter-pi | The pi adapter: proposer and tool-less critic by flags, one row of the dialect table of the JSONL reader it shares with prime, the refusal of its Tier 3 path | research | 1 | 22 | **Moved from Wave 3 by the owner** (rulings 32a, 32b) | The owner named it. No as-is behaviour; it proves that the reader of 138 serves a second harness by data |
| 138-adapter-prime | The prime adapter: proposer and critic, the JSONL reader for stream schema v3 and its dialect table, the terminal record decides, the harness's telemetry off | 028, research | 1 | 34 | **Moved from Wave 3 by the owner** (rulings 32, 32b) | 62 behaviour items belong to this harness, 41 of them to its stream reader |
| 126-stream-seam-and-invocation | Stream readers and the tap, the data stream mapping, invocation identity, envelope, reconciliation and retention | 028 | 1 | 30 | **New, split from 109** | 173 items of which 171 have no requirement |
| 110-config-and-terms | Config schema content with the keys of every option, precedence and trust classes, environment aliases, secret references and resolvers, auth tiers, audience (default `distributed`), the terms gate and its data | 028, 011, 002, research | 1 | 47 | **Narrowed.** Above the split mark; the terms gate leaves first if it splits | The suggested 110 would hold about 79 requirements |
| 127-quota-budgets-and-pause | Quota classifier, quota pause and resume, the wait ceiling, fallback, budgets, the ledger of spend, alerts and their delivery | 002, research | 1 | 36 | **New, split from 110** | Decision 8 has no as-is behaviour in 028 or 011 |
| 111-event-schema-and-projection | Event schema content, the primary writer, EV-01 to EV-34, the redaction ingress with the widened patterns and their canary test, the compatibility projection and the event-sink contract | 028, 011, 002, research | 1 | 47 | **Narrowed.** Above the split mark; the projection leaves first if it splits | The suggested 111 would hold about 94 requirements. Ruling 43 makes the redaction point carry the risk |
| 128-telemetry-export | The OTLP exporter, the Loki sink, metrics, dialects, content capture whenever traces are on, the shipped telemetry stack as optional assets | 028, 002 | 1 | 33 | **New, split from 111** | About 170 telemetry items |
| 129-run-view-and-status | `RunView`, reducer, lanes, attention items, budget levels, cursor; `status`, `wait`, `status.line` | 002, research | 1 | 23 | **New, split from 111** | It is the UI data contract and the supervision cycle's only input. Owns `status` data and default output |
| 112-doctor | The check registry, the catalogue of 44 checks, entry points, output and exit codes | 002, research | 1 | 30 | Unchanged, as a registry (EP-14) | — |
| 113-host-claude-code | The Claude Code plugin: host skills, host hooks, packaging, skill-trigger evals, token budgets and context-cost CI | 011, research | 1 | 36 | Unchanged, against the host port (EP-01) | — |
| 115-micro-loop-layer | Units of work and checkpoints, inner checks, keep, repair and unresolved, caps, the closing check, the router table and escalation, the protected set and fingerprints, the fact block, the tripwire, the experiments | research | 1 | 66 | As suggested, **without fail-fast**. One feature with two requirement groups | R15 proposed 115 and 116; R15v E-6 found the cut artificial (one threat model; every requirement of 115 cites the protected set). Split only above about 45 |
| 142-parallel-units | Parallel `[P]` units: the loop layer `parallel` above `micro`, the plan and its admission checks, the group executor, the tree store, worker trees, integration with its audits, the merge check before the critic; off by default | 002, research | 1 | 58 | **New, added by the owner** (rulings 56, D2, D3, P1, P2) | The research recommended no agent parallelism in Wave 1 (R26); the owner ruled it in as an option. Designed by R29 and red-teamed by R29v. One feature with three requirement groups |

Sum of the estimates: **about 1,308**, of which about 194 in feature 100 and about 174 in the
five features the owner added (130: 33, 131: 27, 134: 22, 138: 34, 142: 58). The largest after feature 100
are 115 (66), 142 (58) and 108 (52). These three have requirement groups written for a split and are estimated
above the split threshold; the split rule of section B.3 is expected to apply to them. Features 110
and 111 are estimated at 47, just above the threshold, and each names the group that leaves first.

### A.1a The splits Stage B made (2026-09-29)

Nine features went above the split mark at `speckit-specify` and were split along the groups their
briefs name. Wave 1 is now **41 specifications**. The parent keeps its number and the group's first
requirements; the split feature takes the reserved or next free number. No as-is id changed feature
except those D.1 marks.

| Split feature | From | What left | FR, SC |
|---|---|---|---|
| 116-check-integrity-and-unit-evidence | 115 | Group G-B: the fact block, the protected set and fingerprints, the integrity rules with the layer off, EP-16, profile row 32, threats T-20 and T-24 | 21, 3 |
| 140-reverse-inventory-and-lint | 108 | Group G-B: the source inventory, the reverse lint, 028 FR-027, 245 behaviour items | 26, 3 |
| 143-parallel-engine-services | 143 was free | Group G-B of 142: the tree store, worker trees, integration services, closed set rows 62 and 64, the ledger namespace `parallel` | 28, 3 |
| 144-compatibility-projection | 111 | Group G5: the projection sink, writer classes and row shapes, profile row 17 | 11, 2 |
| 145-presenter | 119 | Group G3: the presenter, banner, theme, start-up and live rules, 139 behaviour items | 22, 3 |
| 146-harness-discovery | 124 | Groups G1, G2: the discovery sources, the probe ladder, closed set row 34, profile rows 87 to 89 | 19, 3 |
| 147-terms-gate | 110 | Group G4: auth tiers, audience, provider terms, EP-11, closed set rows 40 to 42 | 14, 3 |
| 148-check-runner | 105 | The check runner: EP-05, closed set rows 53 and 54, profile rows 6, 7 and 31, four behaviour items of C-080 | 18, 7 |
| 149-attempt-planner-and-seams | 101 | Group G4: the seams of EP-18, the tier bump, the invariants, the criterion "the critic never approves its own session" (F149-SC-001) | 10, 4 |

### A.2 What changed against the prompt's suggestion, and why

The prompt suggested 14 features. Three causes changed that.

| Cause | Change | Source |
|---|---|---|
| The inventory | 2,785 behaviour items stand against 57 requirements in 028 and 011. At today's grain nine of the suggested features would exceed 40 requirements, three of them 60. Nine features were split along seams, which gave 27 | R15 F-08, A-9 |
| The red team of the architecture | Two cuts were artificial and were merged back (116 into 115, 140 into 108); one feature was missing and was added (141-parity-oracle); 122-detached-runtime was confirmed. That gave 26 and the umbrella, which the owner approved | R15v E-1 to E-6; ruling 15 |
| **The owner's rulings of 2026-09-29** | Five features were added, which gives 31 and the umbrella, and nineteen briefs changed | Table below |

| Ruling | What the owner ruled | Against the proposal | Briefs changed |
|---|---|---|---|
| 32, 32a, 32b | Every parity test passes before any release; the dsh, Codex, pi and prime adapters are Wave 1 features; pi and prime share one JSONL reader | The proposal deferred the behaviour of later-wave harnesses per cluster and had one adapter in Wave 1 | **New: 130, 131, 134, 138.** Changed: 141, 109, 126, 100, 110, 127, 112 |
| 56, D2, D3, P1, P2 | Parallel `[P]` units and concurrent verification commands are Wave 1 options, off by default; the design is researched and red-teamed first; store commits and two writes to the workspace are allowed under conditions; containment C2 is required | The proposal had no agent parallelism in Wave 1 | **New: 142.** Changed: 105, 103, 100, 115, 117, 122, 110, 127, 129, 107, 123 |
| 57, 57a, D1 | A read-only sandbox counts as a critic; it runs in the working tree; the proposer's files are hidden from it | The proposal allowed the Codex critic by direct API only | 131, 109, 117, 124, 100 |
| 20, 70 | Lisa's Agent SDK harness is extracted as an optional Tier 2 transport, with API keys only, never bundled | The proposal did not extract it in Wave 1 | 125, 109, 110 |
| 48 | The tier bump after K critic rejections is a Wave 1 option, off by default | The proposal had it as a roadmap experiment | 101, 115, 110 |
| 43 | Content is captured whenever traces are on | The proposal had capture off, as an opt-in | 111, 128, 126, 100 |
| K3 | The hashes of spec, plan and tasks are checked at launch, at resume and at every pass start | New, from R28 | 104, 102, 103, 105, 101, 123, 129 |
| K2 | `resume` exits 5 and 3, and 3 on a changed hash | As proposed | 102, 100 |
| K7 | The proposer start-up that burns about 9 minutes of CPU is fixed; so is the lock fallback that is never released | Two defects found after the proposal | 103, 122 |
| 33 | The approval record is signed | As proposed; the brief now says "signed" | 101, 102, 100 |
| 14, 2 | The copyright line is "Copyright (c) 2026 mairp"; the package ships with the audience `distributed` | The name was open; the audience as proposed | 100, 110, 113 |

Every other ruling equals the default the briefs had proceeded on. For those the briefs changed only
in wording: what was written as a default to proceed on now carries the number of the ruling.

### A.3 Not specified, and unused numbers

| Number | Status | Why |
|---|---|---|
| 114-memory | **Not specified** | R12: current coding-agent benchmarks show self-built memory failing to beat memory-off, and Lisa's memory package is never called in a run. The cold-start cost is a prompt-construction problem, answered by the obligations index in feature 103. What a memory feature would need from the engine exists as the prompt block provider (EP-15). Ruling 17; the lessons store is a roadmap entry |
| 116 | **In use since Stage B** | The split of 115 that R15 had proposed and R15v E-6 had merged back was made after all: `116-check-integrity-and-unit-evidence` (section A.1a) |
| 140 | **In use since Stage B** | The split of 108 that R15 had proposed and R15v E-6 had merged back was made after all: `140-reverse-inventory-and-lint` (section A.1a) |
| 143 | **In use since Stage B** | The reserved number was used for the split of 142: `143-parallel-engine-services` (section A.1a) |
| 132, 133, 135, 136, 137, 139 | Reserved | One harness adapter per feature, Wave 3 and later (`roadmap.md`) |

### A.4 Wave 2 and later

Not specified in this effort. `roadmap.md` is the single copy; this table is a reference to it.

| Feature or group | Wave | Where |
|---|---|---|
| 120-host-dsh | 2 | `roadmap.md`, "Wave 2" |
| 121-kanban-ui | 2 | `roadmap.md`, "Wave 2". Receives `deferred 2`: 002 FR-051, 002 SC-007 |
| 132-adapter-gemini-cli, 133-adapter-copilot, 135-adapter-opencode, 136-adapter-openrouter, 137-adapter-zai, 139-adapter-specstride: one harness adapter per feature, each a harness descriptor, optional code hooks and recorded fixtures against feature 109 | 3 and later | `roadmap.md`, "Wave 3 and later". No behaviour item of the baseline belongs to one of them |
| Run acceleration after Wave 1, with `[P]` units as a **default** | later | `roadmap.md`, "Run acceleration after Wave 1" |
| Memory (lessons store) | later | `roadmap.md`, "Memory" |
| Platform features from Lisa: human approvals, scheduler queue and cron, feature parallelism in separate workspaces, server mode and index, spec bundle import, engine hooks, critic ensemble, event delivery dispatcher | later | `roadmap.md`, "Platform features from Lisa". Receives 23 `deferred 3+` requirements and 2 success criteria of 002 (section D.2) |
| Packaging and platforms: a service detach strategy, third-party code extensions, a native kernel lock, Windows and WSL | later | `roadmap.md`, "Packaging and platforms" |

---

## B. Stage B order and mechanics

### B.1 Two tiers

| Tier | Features | How |
|---|---|---|
| 1 | **100-specstride**, then **141-parity-oracle** | Each alone and completely, in this order. Every cross-feature contract is in feature 100, and 141 defines the fixtures and surfaces that every parity test of tier 2 cites |
| 2 | The other 39 features | In parallel, one agent each. A tier 2 feature cites only contracts of feature 100, fixture families of feature 141 and the divergence register. It never cites another tier 2 feature's requirement as a precondition of its own text; where it consumes another feature's behaviour it names the contract of feature 100 through which it does so |

Before tier 1: the approved constitution amendment (v3.0.0, twenty principles) is applied with
`speckit-constitution`, and the Constitution Check in `.specify/templates/plan-template.md` is
rewritten to match (prompt section 6, first steps).

The five features the owner added are tier 2 features like the others. Each adapter cites the harness
port, the dialect table and the forms of the critic as contracts of feature 100, and never the
specification of 109 or of another adapter. Feature 142 cites the loop-layer interface and the
tree-store service as contracts of feature 100, and never the specification of 103 or 115.

### B.2 Feature directories

Every Spec Kit script call is prefixed with `SPECIFY_FEATURE_DIRECTORY=<value>`. The directory is
**never created by hand** before its `speckit-specify` run; afterwards the agent confirms that the
directory has exactly the planned name.

| Order | `SPECIFY_FEATURE_DIRECTORY` | Tier |
|---|---|---|
| 1 | `specs/100-specstride` | 1 |
| 2 | `specs/141-parity-oracle` | 1 |
| 3 | `specs/101-gate-and-verdict` | 2 |
| 4 | `specs/102-run-control` | 2 |
| 5 | `specs/103-proposer-pass` | 2 |
| 6 | `specs/104-spec-input` | 2 |
| 7 | `specs/105-verification` | 2 |
| 8 | `specs/106-learning` | 2 |
| 9 | `specs/107-launch-contract` | 2 |
| 10 | `specs/108-reverse` | 2 |
| 11 | `specs/109-harness-seam` | 2 |
| 12 | `specs/110-config-and-terms` | 2 |
| 13 | `specs/111-event-schema-and-projection` | 2 |
| 14 | `specs/112-doctor` | 2 |
| 15 | `specs/113-host-claude-code` | 2 |
| 16 | `specs/115-micro-loop-layer` | 2 |
| 17 | `specs/117-critic-grounding-and-prompt` | 2 |
| 18 | `specs/118-pass-supervision-and-jobs` | 2 |
| 19 | `specs/119-front-door-and-presenter` | 2 |
| 20 | `specs/122-detached-runtime` | 2 |
| 21 | `specs/123-pipeline-runtime-and-supervisor` | 2 |
| 22 | `specs/124-harness-discovery-and-roles` | 2 |
| 23 | `specs/125-adapter-claude` | 2 |
| 24 | `specs/126-stream-seam-and-invocation` | 2 |
| 25 | `specs/127-quota-budgets-and-pause` | 2 |
| 26 | `specs/128-telemetry-export` | 2 |
| 27 | `specs/129-run-view-and-status` | 2 |
| 28 | `specs/130-adapter-dsh` | 2 |
| 29 | `specs/131-adapter-codex` | 2 |
| 30 | `specs/134-adapter-pi` | 2 |
| 31 | `specs/138-adapter-prime` | 2 |
| 32 | `specs/142-parallel-units` | 2 |

Within tier 2 the order has no meaning. Requirement ids are globally unique and carry the feature
number: `F101-FR-012`, `F101-SC-003`.

Per feature the steps are `speckit-specify`, `speckit-clarify`, `speckit-plan`, `speckit-tasks`,
`speckit-analyze`, with the analyze report saved next to the feature. Questions that the sources
cannot answer go to `CLARIFY-QUEUE.md` with a recommended answer, and the feature proceeds on it.
Tests are requested for every feature: parity tests and characterization tests are required tasks.

### B.3 The split rule

| Rule | Content |
|---|---|
| When | A feature is split **only if `speckit-specify` yields more than about 45 requirements**. An estimate in this file never triggers a split |
| Where | Along the requirement groups named under heading 7 of its brief, and nowhere else. Each group is written so that it cites the other only through a contract of feature 100 |
| Naming | The first part keeps the feature's number and name. The second part takes a free number: `116` for a split of 115, `140` for a split of 108, `143` for a split of 142. **142 is now a feature**, so any other split takes the next free number from 143: 143 if 142 was not split, otherwise 144 and upward. The numbers 114, 120, 121 and 130 to 139 are never taken for a split |
| Expected splits | 115 into `specs/116-check-integrity-and-unit-evidence` (its group G-B); 108 into `specs/140-reverse-inventory-and-lint` (its group G-B); 142 into `specs/143-parallel-engine-services` (its group G-B). Features 110 and 111 are estimated just above the threshold; each names the group that leaves first (the terms gate; the compatibility projection) |
| What moves | Requirements, their as-is origins and their tests move together. `traceability.md` and section D of this file are updated in the same change, so that every as-is id still has exactly one destination |
| Feature 100 | Is not split. It is specified as one feature with annexes by layer (ruling 16); its size is accepted |
| Who decides | The agent that specifies the feature proposes the split in its analyze report; the orchestrator creates the second directory with its own `speckit-specify` run |

### B.4 What every tier 2 agent receives

| Input | From |
|---|---|
| Its brief | Section C of this file |
| The contracts of feature 100 it depends on | `specs/100-specstride/`, the annexes named under heading 5 of the brief |
| The glossary | `consolidation.md` section 1 |
| Its traceability rows | `traceability.md`, filtered by destination feature |
| The fixture families it must cite | `specs/141-parity-oracle/` |
| The register rows named under heading 6 | `consolidation.md` section 6 |
| The rulings named under heading 6 | `APPROVAL.md`, which is the authority |
| The open questions named under heading 6 | `CLARIFY-QUEUE.md`, with the recommended answer to proceed on |
| For an adapter feature, the research on its harness | R9 for 130, 134 and 138; R6 for 131; R5 and R1 for 125; R8v for the terms rows; R11 for containment; R14 for quota signals |
| For 142, and for the concurrent commands of 105 | `research/R29-parallel-units-design.md` and `research/R29v-parallel-units-red-team.md` |

---

## C. Briefs

Every brief has the same eleven headings. Under heading 2 the columns are: the as-is id with its
origin, the behaviour in short, the disposition, and the proof. The dispositions were approved by the
owner (ruling K8 for every `superseded-by` and `dropped` row). "Parity" means a parity test of
the oracle; "characterization" means a characterization test of a kept Lisa behaviour; "through
mapping" means a parity test through the documented mapping (layout table, compatibility projection,
alias table). Test names follow `traceability.md` section 1.5: `PT-<feature>-<origin>-*` for the parity
test of a requirement, `PT-<feature>-<cluster>-*` for the parity test of a cluster of behaviour items,
`CT-<feature>-<n>` for a characterization test.

Under heading 6 the first column names a register row, a closed entry of `DECISIONS-PENDING.md` with
the ruling that closed it, a ruling, or an open question of `CLARIFY-QUEUE.md`. The second column says
what the brief proceeds on.

The merge rule in every brief is the rule of the prompt: **028 and 011 win where systems overlap,
because parity binds them; Lisa wins where 028 and 011 are silent and its behaviour is sound.**

---

### 100-specstride (umbrella)

Directory: `specs/100-specstride`. Tier 1, specified first and alone. Estimated requirements: 194, in
annexes.

#### 1. Scope

**In scope.** The vision and the aims; the glossary as the specification's vocabulary; the layering
rules LR-1 to LR-11; the interface of every extension point EP-01 to EP-19 with its id, version, common
rules, errors, guarantees and proving test; every contract that two or more features use; the state
layout as a table from logical names to locations; the identifiers; the run-state machine; the
per-process exit-code tables; the closed stop-reason enumeration; the list of every closed set with its
owner and its rule for an unknown value; the `parity` profile, with a switch for every option of the product; the interfaces that the
features of the owner's rulings add (the contents of EP-04 for a stacked layer, the tree-store
service, the two forms of the `completion` level, the dialect table of the JSONL reader); the
oracle's normalization rules and alias tables as a contract; the CLI protocol and the grammar of output lines; the threat model; the
integration acceptance of the whole product.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| The behaviour behind each interface (what the engine, an adapter or a sink does) | The feature named as content owner in the tables under heading 5 |
| The content of the event schema (event names, fields) and of the config schema (keys, defaults) | 111 and 110. Feature 100 owns envelope and versioning rules only (R15v E-3) |
| The oracle itself: stubs, fixtures, normalizer code, comparator | 141 |
| Each output line | The feature that prints it. Feature 100 owns the line grammar |
| The traceability matrix, the divergence register and the roadmap | `docs/ecosystem/`, as the single copies. Feature 100 links to them |
| Wave 2 and later features | `roadmap.md` |

#### 2. As-is requirements received

| As-is id | Behaviour (short) | Disposition | Proof |
|---|---|---|---|
| 028 FR-030 | pytest suite and CI workflow | superseded-by DV-057 | Register row DV-057 |
| 028 SC-003 | Each halt cause maps to one exit code 0 to 6 | merged-with 002 SC-004 | Parity (028 side), over the engine table |
| 028 SC-008 | CI succeeds only when lint and test jobs succeed | superseded-by DV-057 | Register row DV-057 |
| 011 SC-001 | CI matrix on Python 3.10 to 3.13 | superseded-by DV-057 | Register row DV-057 |
| 011 SC-004 | Launcher failure classes map to 20 to 24 | ported | Parity, over the pipeline table (FX-35) |
| 011 SC-007 | Seven supervision outcomes mapped to exit codes | ported | Parity, over the supervisor table (FX-36) |
| 002 FR-015 | Exit vocabulary 0 to 6 | merged-with 028 SC-003 | Characterization (Lisa side) |
| 002 SC-004 | Every termination maps to 0 to 6 | merged-with 028 SC-003 | Characterization (Lisa side) |

Behaviour inventory received, as assigned in `traceability-items.tsv` (the authority): **19 items in 8
clusters**.

| Source module | Clusters | Items | ported | translated | superseded-by |
|---|---|---|---|---|---|
| `orchestrator.sh` | C-008 to C-009, C-011 to C-013 | 16 | 3 | 5 | 8 |
| `specstride-lib.sh` | C-018, C-021 to C-022 | 3 | 0 | 0 | 3 |
| **Total** | | **19** | **3** | **5** | **11** |

Across all modules the inventory holds 172 items of kind `exit-code`, 216 of kind `stop-reason` and 199 of kind
`file`. They are the source of the per-process tables and the closed families of `consolidation.md` sections 3
and 4, and of the old side of the layout table (R18 N-02).

These kinds are received as **contract content**. The behaviour that produces each code, reason or file
stays with the feature that owns the module.

#### 3. Merge rule

| Case | Ruling |
|---|---|
| Exit codes 0 to 6 of the engine | 028 and 002 agree; 028 is the parity side |
| Exit 70 on an uncaught error | Lisa wins: 028 and 011 are silent (002 FR-005, owned by 119); it enters the table here |
| "Stopped" codes | Kept per process: engine 6, supervisor 2, pipeline 128+N, and pipeline 22 with state `stopped` on child exit 6 (C-16) |
| Usage errors | The as-is code per command is kept (C-32) |
| Stop reasons | 028's 14 literals win; Lisa's two extra reasons are not admitted (C-08) |
| Atomic writes of runtime-written files | Lisa wins where 028 is silent; the rule is SL-2 here, and 002 FR-013 is owned by 101 |
| State root | One root per workspace; the pipeline id keys a subdirectory (C-15) |

#### 4. New requirements from research and owner decisions

| Subject | Source |
|---|---|
| Layering rules LR-1 to LR-11, with the import-boundary check over the package graph | `architecture.md` section 2; R15 A-2; R15v P-1, P-7, P-11, P-12, P-15 |
| Common rules of every extension point: identity and version, three classes of implementation (data, first-party code, third-party code designed and not enabled), trust, registration, conformance, a sample outside the core, failure of an extension | R15 A-3; decisions 17, 19; DP-075, DP-009 |
| Three state roots, the logical-name table, rules SL-1 to SL-7 | `architecture.md` section 7; decision 3; R11 R-1; DP-071, DP-084 |
| Five logical names for the compared logs and records; `supervision.json`; one state file per writer; attempt names with the engine-start ordinal; a learning writer domain | R15v P-8 |
| A `schema` field in every control-plane file; product version in the run record; refusal on a different major | R15v P-12 |
| Identifiers and the meaning of "run" as the logical run; "engine start" for one process | R15 A-5.2; DP-074; decision 23 |
| Run-state machine with `paused-quota`, `blocked-on-human` as a resting state and the derived `dead` | `architecture.md` section 8; DP-028, DP-068, DP-076 |
| Stop reason 15, `paused_quota_ceiling` | C-23; DP-068 |
| Micro-loops add no state, exit code or stop reason | Decision 21; IR-07 |
| The `parity` profile: a named profile that sets every switch the oracle needs; the product has no oracle mode | LR-10; R15v B-5, P-1; R27 D1.1 |
| The list of closed sets with owner and unknown-value rule | LR-11; R15v A-16, P-15 |
| The CLI protocol v1 and `specstride --protocol`; two output modes (terse default, compatibility) and the rule that a line with no as-is equivalent is never written to a compared stream | R3; R17; C-31; DP-060, DP-067 |
| Module entry points that become public verbs: `spec`, `verify`, `learn`; the pass loop and the critic do not | DP-082 |
| Threat model: 47 threats, structural controls R-1 to R-5, the six requirement sentences R11 proposes for this feature | R11 |
| Observed process boundaries stay process boundaries; every other one is a function call with a result record carrying the same code number | LR-6; R15v C-1 |
| Engine start modes `standalone` and `child`; the engine executable pinned at launch | R15v P-9 |
| `relaunch.owner` as configuration with values `root` and `supervise` | R15v P-1; DP-072, DP-080 |
| Integration acceptance: the conformance suite of every extension point runs on its sample; the oracle passes under the `parity` profile; the second suite passes | R15 A-3; decision 4; decision 21 |
| **EP-04 contents for a stacked layer**: layer stacking, ordered, of depth at most 2 in Wave 1, the outer layer called first and the inner one when the outer returns `none`; the directives `requestPass`, `requestPassGroup` and `integrateGroup`, executed and accounted by the engine; capability negotiation, by which a layer declares the directives and services it uses and the engine refuses at registration what it does not offer; `workerId` and `groupId` in the attempt view; a ledger namespace per layer | R29 PU-05; R15v A-1; ruling 56 |
| **The tree-store service** as an interface: a closed set of operations (`snapshot`, `materialize`, `changed`, `compose`, `apply`, `release`, `sweep`), with no restore, no reset and no checkout of the workspace. Ruling 31 reserved it; feature 142 builds the subset that parallel units need, and nothing is built for `autoresearch` | R29 PU-19; R29v PU-80; rulings 31, 56, P1; CQ-003 |
| The schema of the parallel plan; the logical names `worker-root` and `tree-store`; a fourth location, the worker root, outside the workspace and outside the control plane | R29 PU-15, PU-22 |
| Two optional fields of the event envelope, `workerId` and `wseq`, absent on the main line | R29 PU-57 |
| EP-02: the level `completion` has **two forms**, tool-less and read-only tools in an operating-system sandbox; the capabilities `concurrentSessions` and process-level spending limit; a transport as a property of an adapter; the list of withheld paths for a critic with read tools | Rulings 20, 57, 57a, D1; R29 PU-40; R29v PU-88 |
| The dialect table of the JSONL reader that the pi and prime adapters share | Ruling 32b; R9 |
| **The `parity` profile sets a switch for every new option**: parallel units off; verification parallelism 1; the tier bump off; the staleness check at critic start only; content capture off; session continuation off; the critic of each harness in its as-is transport and mode; the Agent SDK transport not used; the permission and containment settings of each harness as today | LR-10; rulings 20, 43, 48, 56, 57, D2, K3 |
| **The list of closed sets** gains, each with its owner and its rule for an unknown value: the fallback reasons of the layer `parallel` (142); the admission checks and the outcomes of a worker (142); the refusal reasons of a delta (142); the integrity kinds that reach the critic (115, with the two neutral kinds of 142); the forms of the `completion` level (109); the transports of an adapter (109); the dialects of the JSONL reader (138); the files of the staleness verdict (104); the `resume` refusals (102); the result conditions of a check, with the reason `changed-during-check` (105); the `parallel.*` event types (111) | LR-11; R29 PU-08; rulings 56, 57, K2, K3 |
| The source hashes of a run (spec, plan, task list) as pinned values of the run snapshot; the three check points and the `parity` setting | Ruling K3; DV-082 |
| The exit codes of `resume` in the per-command table: 5 when the lock is held, 3 when there is nothing to resume, 3 when a source hash changed since launch | Ruling K2; DV-021 |
| The approval record is signed; the schema holds the signature and what it binds | Ruling 33 |
| Rule IR-60 names the two writes to the workspace that the runtime may make inside a phase attempt with parallel units on | Ruling P1; DV-085 |
| Threat model: two threats added, a critic that reads the project by itself and several workers on one phase; content in telemetry makes the redaction point carry the risk, and planted canaries are a release condition | `architecture.md` section 17; rulings 43, 56, 57a |
| The package ships with the audience `distributed` | Ruling 2 |
| The LICENSE file is MIT with the line "Copyright (c) 2026 mairp" | Ruling 14 |

#### 5. Contracts

Feature 100 depends on no other feature. It **owns the normative text of every interface below**. For
each, one other feature is the **content owner**: it specifies the core side, the registry, the
conformance suite, the sample and the Wave 1 implementations, and cites the annex.

**Annexes, by layer.**

| Annex | Layer | Content |
|---|---|---|
| A | all | Vision, aims, glossary use, layering rules LR-1 to LR-11, common rules of extension points, the import rule for the core |
| B | L0 state | Three roots and the worker root; logical-name table, with `worker-root` and `tree-store`; SL-1 to SL-7; identifiers; `schema` field rule; layout version; atomic write; the schemas of the ledger, the signed approval record, the terminal record, the launch record, the lease, the process registry, the inbox request types, the run snapshot with the source hashes, the pause record, `supervision.json` |
| C | L1 and L2, ports and edges | EP-02 harness port and harness descriptor v1, with the two forms of the `completion` level, the withheld paths of a critic with read tools and the dialect table of the JSONL reader; EP-03 spec-format adapter and the canonical spec model; EP-05 check runner; EP-07 verification-plan source; EP-08 event sink; EP-10 secret resolver; EP-11 terms-gate data; EP-12 quota classifier; EP-16 toolchain profile; containment levels C0 to C3 |
| D | L3 pass loop | EP-04 loop-layer interface, with stacking, the group directives and capability negotiation; the tree-store service; the parallel plan schema; EP-06 router rule table; EP-15 prompt block provider; the yield artifact schema; the fact block schema |
| E | L4 engine | EP-18 critic strategy and attempt planner; the run-state machine; the stop-reason enumeration; the engine's exit codes and result records |
| F | L5 runtime root | EP-13 lock and liveness; EP-17 detach strategy; EP-19 stage kind and precondition check; the process model; run requests of kind `pipeline` and `engine`; handshake outcomes; `relaunch.owner` |
| G | L6 CLI | CLI protocol v1; line grammar; per-command exit-code tables; EP-09 `RunView`; EP-14 doctor check registry; the launch-contract schema |
| H | L7 hosts | EP-01 host port: the host package contract and host capabilities |
| X | cross-layer | Event envelope and versioning; config envelope, precedence ranks and trust classes; the table evaluator; the redactor; the canonical hasher interface; the list of closed sets; the `parity` profile; normalization rules N-01 to N-28, the layout tables, the environment alias table and the component-name table; the threat model; integration acceptance |

**Extension points.**

| EP | Id and version | Annex | Content owner |
|---|---|---|---|
| EP-01 | `specstride.host/1` | H (package contract), G (CLI protocol) | 113 |
| EP-02 | `specstride.harness/1`, `descriptorVersion: 1` | C | 109 (sub-point stream readers: 126; role resolution: 124). Implemented by the adapters 125, 130, 131, 134, 138 |
| EP-03 | `specstride.spec-format/1` | C | 104 |
| EP-04 | `specstride.loop-layer/1` | D | 103 (implementation `micro`: 115; implementation `parallel`: 142; the engine services behind the directives: 143) |
| EP-05 | `specstride.check-runner/1` | C | 148 |
| EP-06 | `specstride.router-rules/1` | D | 115 |
| EP-07 | `specstride.verification-source/1` | C | 105 |
| EP-08 | `specstride.event-sink/1` | C | 111 (implementations OTLP and Loki: 128) |
| EP-09 | `specstride.view/1` | G | 129 |
| EP-10 | `specstride.secret-resolver/1` | C | 110 |
| EP-11 | `specstride.terms/1` | C | 147 |
| EP-12 | `specstride.quota-classifier/1` | C | 127 (the classifier entries of a harness: its adapter, 125, 130, 131, 134, 138) |
| EP-13 | `specstride.lock/1` | F | 122 |
| EP-14 | `specstride.doctor/1` | G | 112 |
| EP-15 | `specstride.prompt-block/1` | D | 103 (the critic's own assembler: 117) |
| EP-16 | `specstride.toolchain/1` | C | 116 |
| EP-17 | `specstride.detach/1` | F | 122 |
| EP-18 | internal seams, versioned, no promise outside the repository | E | 149 (two attempt planners: the recovery cycle, and the tier bump as an option) |
| EP-19 | `specstride.stage-kind/1` | F | 123 |

**Cross-feature contracts.**

| Contract | Schema id (proposed) | Annex | Content owner | Used by |
|---|---|---|---|---|
| State layout and logical names | `specstride.layout/1` | B | 100 | all |
| Identifiers | — | B | 100 | all |
| Atomic write | — | B | 100 | all |
| Run-state machine | `specstride.run-state/1` | E | 100 (operations: 102; transitions of the root: 122, 123) | 101, 102, 122, 123, 127, 129 |
| Exit codes per process | — | E, G | 100 | all |
| Stop-reason enumeration, with `retryable` | `specstride.stop-reason/1` | E | 100 | 101, 103, 118, 123, 127, 129, 106 |
| List of closed sets | — | X | 100 | all |
| CLI protocol and line grammar | protocol integer 1 | G | 100 | 113, 119, 123, 129, 112, 115 |
| Event envelope and versioning | `specstride.event/1` | X | 100 (content: 111) | all |
| Config envelope, ranks and trust classes | `specstride.config/1` | X | 100 (content: 110) | all |
| **Ledger** (R15v E-2) | `specstride.ledger/1` | B | 103 | 101, 102, 103, 115, 142 |
| **Approval record** (R15v E-2), signed (ruling 33) | `specstride.approval/1` | B | 101 | 101, 102, 122 |
| **Terminal record** (R15v E-2) | `specstride.terminal/1` | B | 101 | 101, 123, 129 |
| **Inbox request types** (R15v E-2): `stop`, `hold-relaunch`, host events | `specstride.inbox/1` | B | 122 (the stop request: 102; `hold-relaunch`: 123) | 102, 113, 122, 123, 127 |
| **Process registry** (R15v E-2), classes `owned` and `adoptable` | `specstride.procs/1` | B | 122 | 102, 118, 122, 142 |
| **Table evaluator** (R15v E-2) | `specstride.table/1` | X | 100 | 110, 115, 123, 127, 129 |
| **Redactor** (R15v E-2), with the versioned pattern set | `specstride.redaction/1` | X | 111 | 110, 111, 117, 128, 129, 138 |
| **The `parity` profile** (R15v B-5) | `specstride.profile/1` | X | 100 | 141, every feature with a switch |
| **The list of closed sets** (R15v A-16) | — | X | 100 | all |
| Normalization rules, layout tables, alias and component tables | `specstride.oracle-normalization/1` | X | 100 (implementation: 141) | 141, 110, 111 |
| Launch record and lease | `specstride.launch/1`, `specstride.lease/1` | B | 122 | 122, 123, 129 |
| Run snapshot, with the source hashes of the run | `specstride.snapshot/1` | B | 102 (the hashing and the staleness verdict: 104) | 102, 103, 104, 105, 110, 123 |
| Pause record | `specstride.pause/1` | B | 127 | 127, 129, 142 |
| `supervision.json` | `specstride.supervision/1` | B | 123 | 123, 129 |
| Launch-contract schema | `specstride.launch-contract/1` | G | 107 | 107, 123, 106 |
| Harness descriptor schema | `descriptorVersion: 1` | C | 109 | 109, 124, 125, 130, 131, 134, 138, 112 |
| Forms of the `completion` level: tool-less; read-only tools in an operating-system sandbox | part of `specstride.harness/1` | C | 109 | 109, 117, 124, 125, 130, 131, 134, 138 |
| Withheld paths for a critic with read tools | `specstride.withheld-paths/1` | C | 117 | 117, 109, 131, 142 |
| Dialect table of the JSONL reader | `specstride.stream-dialect/1` | C | 138 (one row: 134) | 138, 134, 126 |
| Resolved registry and role plan | `specstride.registry/1` | C | 124 | 124, 101, 103, 127, 112 |
| Canonical spec model | part of EP-03 | C | 104 | 101, 105, 107, 115, 117, 142 |
| Canonical hasher | — | X | 104 | 104, 107, 105, 108, 102, 103, 142 |
| Containment levels C0 to C3 | — | C | 109 | 109, 125, 130, 131, 134, 138, 105, 115, 142, 112 |
| Yield artifact schema | `specstride-pass-yield/v1` (as-is name kept) | D | 118 | 118, 103, 105 |
| Overlay schema | `specstride-overlay/v1` (as-is name kept) | C | 109 | 109, 125, 130 |
| Check manifest, with the declared reads and writes of a command | `specstride.manifest/1` | D | 105 | 105, 115, 117, 142 |
| Fact block (unit evidence) | `specstride.fact-block/1` | D | 115 (its slot and escaping in the critic prompt: 117) | 115, 117, 105, 118, 142 |
| Tree-store service | `specstride.tree-store/1` | D | 142 | 142, 103 |
| Parallel plan | `specstride.parallel-plan/1` | D | 142 | 142, 112, 123 |
| Doctor findings | `specstride.doctor/1` | G | 112 | 112, 113 |
| Tripwire record | `specstride.tripwire/1` | B | 115 | 115, 112 |
| Threat model | — | X | 100 | all |

#### 6. Divergence register rows and pending decisions

| Id | What the brief proceeds on |
|---|---|
| DV-006 | One layout per workspace with a control plane outside the proposer's write scope; compared through N-01 and N-02 |
| DV-034, DP-067 (ruling 68) | Under the `parity` profile the product prints no line that has no as-is equivalent; new lines are printed only when their feature is on |
| DV-035 | Old state trees are not read |
| DV-057 | The Python test suites and CI are replaced by TypeScript tests, the oracle and CI on Linux and macOS |
| DV-065, DV-066 | Interpreter behaviour does not exist in the product; implementation file names in messages become logical component names (N-15, N-16, N-18, N-25) |
| DV-072 | Every file the runtime writes is written to a temporary name and renamed |
| DP-070 (ruling 21) | The engine is a child of the runtime root |
| DP-071 (ruling 22), DP-084 (ruling 22) | The control plane is outside the working tree, with state export, import and adopt and the advisory marker |
| DP-074 (ruling 24) | "Run" is the logical run |
| DP-075 (ruling 30), DP-090 (ruling 30) | Consumers extend by data only in Wave 1; the contracts and test-kit packages are published |
| DP-082 (ruling 26) | `spec`, `verify` and `learn` are public verbs |
| DP-087 (ruling 16) | Annexes by layer, one feature |
| DP-068 (ruling 28) | Stop reason 15 is admitted |
| DP-006 (ruling 67) | macOS is designed from documentation and marked `unverified` |
| DP-015 (ruling 14) | MIT; the copyright line is "Copyright (c) 2026 mairp" |
| DP-057 (ruling 2) | The package ships with the audience `distributed` |
| DV-079, DV-080, DV-082, DV-084, DV-085 | The options of the owner's rulings, each off under the `parity` profile, which this feature owns |
| DV-081, DV-083 | The critic with read-only tools is not observable in the oracle; content capture needs no oracle rule. The profile still sets both to the as-is behaviour |
| DP-089 (ruling 31), CQ-003 | The tree-store service is an interface here; 142 builds the subset it needs |
| CQ-008 | Ruling 39 concerns what the gate and grounding run on; it does not bar the store's snapshots |

#### 7. Requirement groups and estimate

| Group | Content | Est. |
|---|---|---|
| G1 | Annex A: vision, layering rules, common extension-point rules | 20 |
| G2 | Annex B: state layout, identifiers, record schemas | 30 |
| G3 | Annex C: nine ports, containment levels, the forms of the `completion` level, the dialect table | 42 |
| G4 | Annex D: three pass-loop interfaces with the contents of EP-04 for a stacked layer, the tree-store service, three schemas | 24 |
| G5 | Annex E: state machine, stop reasons, engine codes, EP-18 | 16 |
| G6 | Annex F: three runtime-root interfaces and the process model | 16 |
| G7 | Annex G and H: CLI protocol, line grammar, exit tables, EP-09, EP-14, EP-01 | 22 |
| G8 | Annex X: envelopes, evaluator, redactor, closed sets, `parity` profile, normalization contract, threat model, integration acceptance | 24 |

Total: about 194. Feature 100 is not split (section B.3).

#### 8. Tests required

| Kind | Content |
|---|---|
| Parity | The exit-code tables and the stop-reason enumeration are asserted over every fixture family FX-01 to FX-36 by the features that own the behaviour; feature 100 carries the table-level assertions: every halt cause has one code (028 SC-003), FX-35 for 20 to 24 (011 SC-004), FX-36 for the supervision outcomes (011 SC-007) |
| Characterization | Lisa side of the exit vocabulary (002 FR-015, 002 SC-004) |
| Conformance | One suite per extension point, run on a sample implementation outside the core; the import-boundary check fails if a core file names a sample |
| Static | Every closed set is listed with its unknown-value rule; every control-plane file carries `schema`; a different major is refused |
| Security | The canary test: secrets planted in the prompt, the model's reply, tool arguments, tool output, phase evidence, check output and the comment are absent from every sink, with content capture on. Passing is a release condition (ruling 43) |
| Profile | For every switch of the product the `parity` profile holds a value; a switch without one fails the suite |

Success criteria this feature carries:

| Criterion | Measure |
|---|---|
| Evolvability | For every extension point a sample outside the core passes its conformance suite with no core file changed |
| Integration | On a reference project a run reaches all phase gates approved through the Claude Code host, with the oracle and the second suite passing on the same build |
| One vocabulary | The consistency review finds no exit code, stop reason, state name, event name or config key in any feature that disagrees with the annexes |
| No closed list | No requirement in any feature enumerates harnesses other than by reading the registry |

#### 9. Constitution principles that bind it

Constitution v3.0.0, approved by ruling K9. All twenty, since the annexes are where they become interfaces. The ones that constrain its text
directly: I (durable state, three roots, the inbox), II and III (the approval record, grounding
refusals), IV (one grammar owner), V (sinks never break the loop), VI (typed core, replaceable edges,
samples outside the core), VII (one open harness registry), XIII (decisions by pure tables, recorded
with the rule id), XVIII (parity before capability), XIX (context is budgeted), XX (deterministic
parallelism: the contents of EP-04 and the tree-store service).

#### 10. Research that supports it

R15, R15v, R18, R19, R11, R14, R16, R13, R20, R23, R23v, R27, R2v, R3, R17, R29, R29v, R28, R9, R6.

#### 11. Constraints

Owner-set constraints, for the spec's `## Constraints` section:

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| One published package holds the CLI, the runtime entry and the Claude Code plugin directory; the contracts and test-kit packages are also published | Decision 19; DP-090 |
| The two host skills are named `specstride-run` and `specstride-reverse` | Prompt section 0 |
| The copyright line of the MIT LICENSE file is "Copyright (c) 2026 mairp" | Ruling 14 |
| The package as shipped has the audience `distributed`; the owner sets `personal` once in user configuration | Ruling 2 |
| Every parity test passes before any release | Ruling 32 |

**What belongs in `plan.md` instead:** libraries and their versions, the package and file layout, physical paths behind logical names, the test runner, bundling, and the spelling of internal functions. `spec.md` describes behaviour and names none of them. For this feature also: the physical paths behind the logical names, the schema library, the
package graph of R15 A-4.

---

### 141-parity-oracle

Directory: `specs/141-parity-oracle`. Tier 1, specified second and alone. Estimated requirements: 40.

#### 1. Scope

**In scope.** The differential oracle of decision 4 as a development-time product: reference trees at
the pinned baseline commits; the hermetic environment; scripted stub agents and their transcripts; the
37 fixture families; the captured surfaces; the normalizer that applies the rules of feature 100; the
comparator and its three results; waivers keyed to register rows; the exercise map; per-OS
expectations; the second suite (layer on, stubs that never declare a unit of work); the coverage
script of the cross-feature review; committed golden captures for pull requests and the live
differential run as the release gate.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| The text of the normalization rules, the layout tables, the alias and component-name tables | 100 (annex X). This feature implements them |
| The `parity` profile | 100 |
| The compatibility projection that the oracle compares | 111 |
| Compatibility output lines | 119, 123 |
| Conformance suites of extension points | 100 for the rule; each content owner for its suite |
| The micro-loop layer's own tests and experiment X12 | 115 |
| The own tests of parallel units and experiment E6 | 142 |
| Recorded streams of a harness, replayed in an adapter's conformance suite | The adapter: 125, 130, 131, 134, 138. They are not oracle fixtures |
| Characterization tests of kept Lisa behaviours | The feature that keeps the behaviour |

#### 2. As-is requirements received

| As-is id | Behaviour (short) | Disposition | Proof |
|---|---|---|---|
| 011 SC-008 | Fixture expectations `greeting-blocked` and `greeting-ready` | translated | Parity through mapping: the fixtures become oracle fixtures of family FX-32 |

Behaviour inventory received, as assigned in `traceability-items.tsv`: **none**. No behaviour item is
assigned to this feature.

The oracle **consumes** the whole inventory: 2,783 items in 255 clusters, of which the exercise map decides
which a fixture can reach. The baseline's fixture files land here as non-code assets (R15 A-4).

#### 3. Merge rule

The reference is the code of 028 and 011 at the baseline commits; where a spec and the code disagree
the code is right. Lisa has no reference run in the oracle: kept Lisa behaviours are proven by
characterization tests in their own features. Defects are preserved by default; a fixed defect has a
register row and a waiver, never a bug-compatible switch in the product.

#### 4. New requirements from research and owner decisions

| Subject | Source |
|---|---|
| Reference trees obtained by archive into scratch, verified by tree hash, made read-only; no git command that writes to a source repository | R18 O-1; BRIEF-COMMON safety rules |
| Hermetic environment: empty environment with an allow-list; stubs win on `PATH` | R18 O-2 |
| Stubs: proposer, critic over HTTP and as a CLI, diagnostician, engine, verification commands. No clock, no randomness, no model call, no credential. **Stub transcripts are a compared surface** | R18 O-3 |
| Stub executables are named after as-is commands, plus one generic name for a descriptor-driven harness | R18 O-3; DV-064 |
| 37 fixture families FX-01 to FX-37; FX-35 and FX-36 run twice (engine stub, real engine with agent stubs); FX-37 retired with a waiver | R18 O-4; DV-056 |
| Captured surfaces: exit code, stdout and stderr apart, file tree, events, transcripts, processes left behind | R18 O-5 |
| Normalizer for N-01 to N-28. A rule is added only with a register row; a rule that replaces nothing fails the suite | R18 O-6; defect policy rule 6 |
| Comparator result `equal`, `waived (<register row>)`, `different`; a waiver that matches no difference fails the suite; a release is blocked on any `different` | R18 O-7 |
| Exercise map from line tracing: a test may claim a behaviour item only if its fixture executed that item's evidence line | R18 O-8 |
| Per-OS expectations; the port on macOS is compared with the Linux capture | R18 O-9; DV-071; DP-006 |
| Second suite: every fixture with the layer on; identical apart from the named layer fields; counters asserted equal; a difference outside the allowlist is reported as a possible breach of gate integrity | R18 O-10; decision 21; IR-52, IR-28 |
| Treatment of decisions 18, 21, 22, 23 and the known tensions: off, mapped, or one waiver each | R18 O-11 |
| A rule for output lines that exist only in the new product | DV-034; DP-067 |
| **The release gate is "every parity test"**: every parity test passes before any release. No behaviour item is deferred: the 136 items of dsh (66), Codex (8) and prime (62) are `ported` or `translated` in the adapter features 130, 131 and 138 | Ruling 32; DP-083; R15v C-12 |
| **Fixtures for dsh, Codex and prime are on the path to the first release.** The reference side needs only stub executables named after the as-is commands. Families are assigned by subject: FX-26 for streams and proposer invocations, FX-01 and FX-06 for critic calls, FX-07 for critic configuration errors, FX-18 for a pass that fails before the harness starts, FX-25 for context windows. The exercise map confirms or corrects each assignment | Ruling 32; `traceability.md` section 5, items 12 and 18; DV-064 |
| **The dsh plugin request protocol has no fixture family** (27 items). Scenarios with a request file and a stub installer are added inside FX-17 and FX-18, where the traceability rows place them; a new family is opened only if the exercise map shows that they cannot live there | `traceability.md` section 5, item 17 |
| A fixture with a declared config-home overlay is added, for the overlay items of 109 and the settings overlay of 130; today no family declares one | `traceability.md` section 5, item 2 |
| **Two inventory rows are added** for the write sites of `run_stop` on the structured path (`proposer.sh:2253` and `:2259`), before the fixtures of FX-18 and FX-20 are written. The inventory has no row for them; the nearest is B-0612 | `traceability.md` section 5, item 10; `consolidation.md` section 4.1 |
| The stub critic serves both forms of a critic (tool-less and read-only tools) and both transports; the transcript is compared in transport-neutral form | DV-001, DV-081; R18 O-3 |
| pi has no reference and no parity fixture | `traceability.md` section 4.2 |
| Facts of the three harnesses that fixtures depend on and that research left `unverified` (the approval behaviour of dsh in headless mode, the structured quota event of Codex) are captured by the adapter features before their specifications freeze; an oracle fixture never depends on a live harness | R9; R6; `architecture.md` section 18, risk 9 |
| The coverage script kept in `docs/ecosystem/`: every traceability row resolves, every `origin:` points at a real id | Prompt section 6, cross-feature review; R18 O-8 |
| Order of construction | R18 O-12 |

#### 5. Contracts

| Depends on (feature 100) | Version |
|---|---|
| Normalization rules, layout tables, alias and component tables (annex X) | `specstride.oracle-normalization/1` |
| The `parity` profile (annex X) | `specstride.profile/1` |
| State layout and logical names (annex B) | `specstride.layout/1` |
| Exit codes per process, stop reasons (annexes E, G) | as listed |
| CLI protocol and line grammar, compatibility output mode (annex G) | protocol 1 |
| Event envelope (annex X) | `specstride.event/1` |
| EP-08 event sink (the projection is compared) | `specstride.event-sink/1` |

**Owns:** the fixture format (`fixture.json` with `proves`, `fixture`, `surfaces`), the stub scenario
vocabulary, the waiver file format, the exercise map, the golden captures. These are development
contracts, not product interfaces. No extension point.

#### 6. Divergence register rows and pending decisions

| Id | What the brief proceeds on |
|---|---|
| Every DV row | Its "oracle handling" column is implemented here: N-xx, off, mapped, waiver, not observable |
| DV-034, DP-067 (ruling 68) | No new-only line on a compared stream; the second suite compares default output |
| DV-056 | FX-37 (onboarding) is retired with a waiver |
| DV-057, DV-065 | No differential test for the Python test suites and interpreter behaviour |
| DV-071, DP-006 (ruling 67) | macOS expectations are `inferred`; a macOS runner passes the oracle before a release |
| DP-007 (ruling 11), DV-019 | The reference expands globs; no waiver |
| DP-059 (ruling 19) | `traceability.md` has one row per as-is id and one per cluster; items stay in the inventory file |
| DP-083 (rulings 32, 32a, 32b) | Every parity test passes before any release; the items of dsh, Codex and prime are inside the gate |
| DV-079, DV-080, DV-082, DV-084, DV-085 | Off under the `parity` profile; each has its own tests in its feature |
| DV-081 | Not observable: the stub critic serves both forms |
| DV-083 | No rule needed; the profile switches content capture off |
| DP-060 (ruling 68), DV-070 | Language artefacts in output lines are compared as written (N-19) |

#### 7. Requirement groups and estimate

| Group | Content | Est. |
|---|---|---|
| G1 | Reference, environment, stubs, transcripts | 10 |
| G2 | Fixtures, the scenarios and inventory rows of the three harnesses, captured surfaces, normalizer, comparator, waivers | 16 |
| G3 | Exercise map, coverage script, per-OS expectations | 7 |
| G4 | Second suite and treatment of decisions 18, 21, 22, 23 | 7 |

Total: about 40.

#### 8. Tests required

| Kind | Content |
|---|---|
| Parity | FX-32 for 011 SC-008. The oracle's own acceptance: the reference compared with itself is `equal` on every family; a seeded difference is `different` |
| Self-test | A normalization rule that replaces nothing fails; a waiver that matches nothing fails; an allowlist entry of the second suite that matches nothing fails |
| Feasibility | The probe of R18 repeated: the baseline engine runs against stub agents, exit 0, the same tree twice |

Success criteria this feature carries:

| Criterion | Measure |
|---|---|
| Release gate | A release candidate is blocked while any fixture surface reads `different`, the fixtures of dsh, Codex and prime included |
| Claims are checked | Every parity test's `proves` list passes the exercise map |
| Inertness | The second suite shows no difference outside the named layer fields, and equal counters, on every fixture |

#### 9. Constitution principles that bind it

XVIII (parity before capability), XVII (a missing prerequisite is a skip, never a pass), XI (truthful
stream telemetry: transcripts and projections are compared as written), XII (verifiable here).

#### 10. Research that supports it

R18 (O-1 to O-12, Appendix A to C), R19, R15v (E-1, C-12), R23v (V-19), R27 (D1.1, X12), R21v, R9, R6.

#### 11. Constraints

Owner-set constraints, for the spec's `## Constraints` section:

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| The reference is Python at `9cab15d` and `9c88f86`; the source repositories are never written | Decision 4; prompt section 1 |
| The oracle and the test kit are never shipped inside the product package; the test kit is published separately | R15 A-4; DP-090 |
| The product contains no oracle-only code path | LR-10 |

**What belongs in `plan.md` instead:** libraries and their versions, the package and file layout, physical paths behind logical names, the test runner, bundling, and the spelling of internal functions. `spec.md` describes behaviour and names none of them. For this feature also: how traces are collected, where golden captures are stored, the CI jobs.

---

### 101-gate-and-verdict

Directory: `specs/101-gate-and-verdict`. Tier 2. Estimated requirements: 43.

#### 1. Scope

**In scope.** The engine's loop over a run, its phases and phase attempts; the order verification gate,
then critic, then approval record; the per-call nonce and the verdict grammar; APPROVED, REJECTED and
MALFORMED; the MALFORMED limit; the reject limit; the oscillation halt; the recovery cycle
(diagnostician on a new unmet-criteria signature, accelerator when due); the archive of a rejected
phase attempt; the signed approval record and its verification on resume; post-approval steps (ticking
tasks, the approval commit); the terminal record; the two internal seams of EP-18; the tier bump
after K critic rejections, as an option of the attempt planner that is off by default; the invariants
IR-01 to IR-07 seen from the gate.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| Grounding snapshot, critic prompt, verdict pins, the fact block's slot | 117 |
| The transport of a critic call and the form of the critic | 109 (port); the adapters 125, 130, 131, 134, 138 |
| When the hashes of spec, plan and task list are checked | 102 (launch, resume), 103 (every pass start), 105 (critic start, under the `parity` profile only); the hashing is 104's |
| What the verification gate runs and returns; release verification | 105 |
| The pass loop inside a phase attempt | 103 |
| Stop, resume, counts that survive | 102 |
| Which harness and model play the critic | 124 |
| The critic ensemble | Roadmap; the seam exists here |

#### 2. As-is requirements received

| As-is id | Behaviour (short) | Disposition | Proof |
|---|---|---|---|
| 028 FR-003 | Start at the first phase without approval; all approved runs release verification, then exit 0 | merged-with 002 FR-008 | Parity (028 side), FX-01, FX-15 |
| 028 FR-005 | Per-call nonce; exactly one verdict line; otherwise MALFORMED | merged-with 002 FR-019 | Parity (028 side), FX-05 |
| 028 FR-006 | APPROVED writes the approval marker; REJECTED and MALFORMED write feedback | merged-with 002 FR-012 | Parity (028 side) through mapping (DV-029), FX-01, FX-02 |
| 028 FR-007 | Archive a rejected phase attempt with feedback, hint, acceleration note, transcript; suffix on collision | merged-with 002 FR-014 | Parity (028 side), FX-02 |
| 028 FR-008 | Retry until the reject limit (3); exit 2 | merged-with 002 FR-010 | Parity (028 side), FX-03 |
| 028 FR-009 | An oscillating criterion halts with exit 2 after archiving | ported | Parity, FX-04 |
| 028 FR-010 | MALFORMED limit (3; 0 disables); exit 1 `critic_unavailable` | merged-with 002 FR-011 | Parity (028 side), FX-05, FX-06 |
| 028 FR-011 | Diagnostician on a new unmet-criteria signature | translated | Parity through mapping, FX-08 |
| 028 FR-012 | Accelerator due conditions | ported | Parity, FX-08 |
| 028 FR-013 | Tick task checkboxes after approval; a failure does not undo the approval | ported | Parity, FX-01 |
| 028 FR-014 | Approval commit when commits are on; never init, never push | ported | Parity, FX-27 |
| 028 SC-001 | All approved ends with exit 0 and `run_end outcome=all_approved` | translated | Parity through the compatibility projection, FX-01 |
| 028 SC-002 | No approval from a verdict line in phase evidence | merged-with 002 SC-001 | Parity (028 side), FX-05 |
| 028 SC-004 | At most the reject limit of critic-judged phase attempts | ported | Parity, FX-03 |
| 028 SC-005 | One diagnostician pass per signature; one accelerated phase attempt per diagnosed signature | ported | Parity, FX-08 |
| 002 FR-008 | Resume at the first unapproved phase | merged-with 028 FR-003 | Characterization (Lisa side) |
| 002 FR-010 | Halt `max_rejects`, or archive and retry | merged-with 028 FR-008 | Characterization (Lisa side) |
| 002 FR-011 | A transport error is MALFORMED; a configuration error halts | merged-with 028 FR-010 | Characterization (Lisa side), FX-06, FX-07 |
| 002 FR-012 | On approval: marker, archive leftover feedback, events, optional commit | merged-with 028 FR-006 | Characterization (Lisa side) |
| 002 FR-013 | Atomic write of runtime-written gate files | ported | Characterization |
| 002 FR-014 | Archive a rejected phase attempt | merged-with 028 FR-007 | Characterization (Lisa side) |
| 002 FR-018 | Fresh 16-hex nonce per review | merged-with 028 FR-005 | Characterization (Lisa side) |
| 002 FR-019 | Exactly one verdict line with the exact nonce | merged-with 028 FR-005 | Characterization (Lisa side) |
| 002 FR-020 | MALFORMED feedback states a fail-safe rejection | merged-with 028 FR-006 | Characterization (Lisa side) |
| 002 SC-001 | Replies without exactly one nonce line are non-approvals | merged-with 028 SC-002 | Characterization (Lisa side) |
| 002 SC-002 | Resume starts at the first unapproved phase, no counter | merged-with 028 FR-003 | Characterization (Lisa side) |
| 002 SC-003 | No reader sees a partial gate file | ported | Characterization |

Behaviour inventory received, as assigned in `traceability-items.tsv` (the authority): **157 items in 17
clusters**.

| Source module | Clusters | Items | ported | translated | superseded-by |
|---|---|---|---|---|---|
| `orchestrator.sh` | C-005 to C-013 | 108 | 73 | 35 | 0 |
| `critic.py` | C-059 to C-066 | 49 | 19 | 30 | 0 |
| **Total** | | **157** | **92** | **65** | **0** |

#### 3. Merge rule

| Case | Ruling |
|---|---|
| Every phase already approved | 028 wins: release verification runs first and can exit 2; Lisa ends at once (C-10) |
| Order of verification and critic | 028 wins: the verification gate runs before the critic, and on failure the engine writes the feedback itself and does not call the critic (C-01) |
| Critic configuration error against transport error | Both systems agree: a configuration error halts with exit 3, a transport error is scored MALFORMED (C-09) |
| Archive content | 028's file set wins; Lisa's is a subset |
| Approval | Neither marker survives: the approval record replaces both (C-26). Existence is compared through the logical name |
| Atomic writes | Lisa wins: 028 is silent on runtime-written files (002 FR-013) |
| Nonce grammar | Identical in both (16 hex) |
| Stop reasons | 028's; Lisa's `proposer_context_invalid` and `critic_protocol` are not admitted (C-08) |
| Lisa's phase loop | Not reused; its verdict parser and gate store are extracted as source, with the store rewritten for the approval record (DP-014) |

#### 4. New requirements from research and owner decisions

| Subject | Source |
|---|---|
| The **signed approval record**: written and signed by the runtime, kept in the control plane, bound to the verdict, the phase evidence hash, the verification result and the tree fingerprint; `resume` verifies the signature and every binding; a launch is refused when the spec shows ticked phases without a record. It replaces the bare approval marker | Ruling 33; DP-010; R11 T-02; IR-02; R15v P-14 |
| The key that signs approval records is not the ledger's key | IR-57 |
| The critic never approves its own session; the phase gate is the only source of a verdict; the full verification gate always runs before it | Decisions 7, 21; Principle II |
| Invariants: the layer holds no writer of approval, verdict, feedback, hint or recovery markers (IR-01); inner results are never parsed as verdicts (IR-04); inner events change no outer counter (IR-06); no new exit code or stop reason (IR-07) | R23, R23v |
| The terminal record written before the engine exits: exit code, stop reason, `retryable`, ids | `architecture.md` section 8; C-05, C-08 |
| The oscillation window keyed by phase attempt sequence | Decision 23; DP-037 |
| Phase entry compares the tree with the fingerprint bound in the previous approval record; a difference is a fact for the critic and does not block | IR-33 |
| `blocked` with a reason: which stop reason a blocked run ends with on every path of the gate | C-12; DV-067 (with 103) |
| The lease is verified at every boundary; the engine ends cleanly when the owner is lost | R15v P-3 |
| EP-18 seams: critic strategy with one critic; attempt planner with two implementations, today's recovery cycle and the tier bump | R15 A-3; C-11; rulings K5, 48 |
| **The tier bump after K critic rejections**, an option that is off by default and off under the `parity` profile: after K rejections of one phase by the critic, the next phase attempt runs on the next model tier of the same harness. K and the tier ladder come from configuration | Ruling 48; DV-079; R25 F-8 |
| What counts: only a REJECTED verdict of the critic. A failed verification gate, a MALFORMED reply and a phase attempt without a verdict do not count. The bump changes the model tier of the proposer for the later phase attempts of that phase only. The reject count, the reject limit, the oscillation halt and the recovery cycle stay as they are | R25 F-8, option C; decision 21 |
| The bump never targets the critic's model and never another harness; an exhausted quota on the target tier means skip, which is recorded; the phase attempt after a bump starts a fresh session; every bump and every skip is an event with the rule id; the critic is not told of it | IR-47; rulings 46, 47, 55; decision 21 |
| The bump is a row of a pure table, evaluated by the one evaluator. It is separate from the escalation of the micro-loop layer, which acts inside a phase attempt on a failed inner check | LR-7; ruling 46 |
| The option has its own ablation arm in the experiments, and its own tests | Ruling 48 |
| Events of the gate: `critic.call`, `critic.grounding_gap`, `verdict.adjudicated`, `attempt.ended` with work products | EV-07, EV-08, EV-20, EV-23 |

#### 5. Contracts

| Depends on (feature 100) | Version |
|---|---|
| Approval record, terminal record, ledger (annex B) | `specstride.approval/1`, `specstride.terminal/1`, `specstride.ledger/1` |
| Run-state machine, stop reasons, engine exit codes (annex E) | `specstride.run-state/1`, `specstride.stop-reason/1` |
| EP-02 harness port, level `completion` in both forms; the tier ladder of a harness | `specstride.harness/1` |
| Table evaluator (the bump rule) | `specstride.table/1` |
| EP-03 canonical spec model (`tick`) | `specstride.spec-format/1` |
| EP-05 and the verification gate's result record | `specstride.check-runner/1` |
| EP-04 loop-layer interface (`onEvidence`, `contributeCriticInput`) | `specstride.loop-layer/1` |
| EP-13 lease verification | `specstride.lock/1` |
| Event envelope | `specstride.event/1` |
| Resolved registry and role plan | `specstride.registry/1` |

**Owns (content):** EP-18, critic strategy and attempt planner; the approval record; the terminal
record.

#### 6. Divergence register rows and pending decisions

| Id | What the brief proceeds on |
|---|---|
| DV-029, DP-010 (ruling 33) | Approval record; existence mapped by logical name, content waived by surface |
| DV-044, DP-037 (ruling 9) | Oscillation window keyed by attempt sequence; off under the `parity` profile through the reset flag |
| DV-040 | 028's gate order |
| DV-028 | The pipeline runtime reads the terminal record |
| DV-067 | `blocked` event; the stop is as-is where a breaker fires |
| DV-072 | Atomic writes; not observable |
| DV-077 | IR-33 at phase entry adds a fact row to the critic prompt when it fires; off under the `parity` profile |
| DV-082 | A changed source stops the run with the blocked-on-human signal; the check points are owned by 102, 103 and 105 |
| DV-079, DP-033 (ruling 48) | The tier bump after K critic rejections is a Wave 1 option: off by default, off under the `parity` profile, with a register row, its own tests and an ablation arm |
| DP-048 (ruling 41), DP-049 (ruling 41) | The gate runs when the protected set differs; an integrity event does not halt |
| Open (R11, R15 A-4) | Raising the nonce to 128 bits needs a register row; the brief proceeds on 16 hex |

#### 7. Requirement groups and estimate

| Group | Content | Est. |
|---|---|---|
| G1 | Phase loop, gate order, verdict grammar, limits, oscillation | 16 |
| G2 | Recovery cycle and attempt archive | 9 |
| G3 | Approval record, post-approval steps, terminal record | 10 |
| G4 | EP-18 seams, the tier bump option, the invariants | 8 |

Total: about 43.

#### 8. Tests required

| Kind | Content |
|---|---|
| Parity | FX-01 to FX-08, FX-15, FX-27 |
| Characterization | Lisa's verdict parser and gate store as extracted; atomic gate writes; surviving counts as they reach the reject limit |
| Own tests | Approval record forged, with a wrong signature, missing or bound to another evidence hash is refused on resume; a planted marker approves nothing; fuzz of the verdict parser with every ledger record and fact-block row. Tier bump: K − 1 rejections bump nothing; K rejections bump once; a failed gate and a MALFORMED reply do not count; a target equal to the critic's model and a target with exhausted quota are skipped; with the option off no output differs |
| Conformance | EP-18: a sample critic strategy and a sample planner registered from the test tree; both shipped planners pass the planner's suite |

Success criteria this feature carries:

| Criterion | Measure |
|---|---|
| The critic never approves its own session | Every critic call record shows a fresh session, no tools, and a session id that no pass of the phase attempt used |
| No approval without a nonce-matched reply after the full verification gate ran | Asserted on every run's event log |
| Every halt of the gate has one exit code and one stop reason | Table test over FX-03 to FX-07 |

#### 9. Constitution principles that bind it

I, II, III, V, XIII, XVIII.

#### 10. Research that supports it

R19, R18, R11 (T-01 to T-06, T-08, T-22), R23, R23v, R1, R1v, R15, R15v, R14, R25 (F-8), R28.

#### 11. Constraints

Owner-set constraints, for the spec's `## Constraints` section:

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| Lisa's phase loop is not the base; selected Lisa source is extracted | DP-014 |
| The engine is one engine; the classic loop is the engine with the layer off | Decision 21 |

**What belongs in `plan.md` instead:** libraries and their versions, the package and file layout, physical paths behind logical names, the test runner, bundling, and the spelling of internal functions. `spec.md` describes behaviour and names none of them.

---

### 117-critic-grounding-and-prompt

Directory: `specs/117-critic-grounding-and-prompt`. Tier 2. Estimated requirements: 33.

#### 1. Scope

**In scope.** What the critic is given: the grounding snapshot (existence, size, bounded excerpts,
globs expanded, caps, placeholder and missing lines, refusals by real path); the critic's own prompt
assembly and its fitting to a known context window; verdict pins; the slot in which the fact block is
placed and the escaping of every string in it; framing of untrusted text as data; removal of marker
lines from what the critic sees; for a critic with read-only tools: what it is given, the hiding of
the proposer's notebook, handoff and outbox before the call and their return after it, and the list
of withheld paths.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| The verdict grammar and what a verdict does | 101 |
| The content of the fact block | 115 |
| The proposer's prompt assembler | 103 |
| The critic call itself, the form of the critic and its proof | 109; the adapters 125, 130, 131, 134, 138 |
| Whether a harness can deny reads of the withheld paths | Its adapter; 131 for the first harness of this form |
| The place of a critic with read-only tools in the critic order | 124 |
| The critic's budget in money and quota | 127 |

#### 2. As-is requirements received

| As-is id | Behaviour (short) | Disposition | Proof |
|---|---|---|---|
| 002 FR-021 | Grounding presence lines up to a cap; beyond the cap NOT-SHOWN | merged-with 028 FR-006 | Characterization (Lisa side); the 028 side is code only and is proven by parity on FX-25 |

Behaviour inventory received, as assigned in `traceability-items.tsv` (the authority): **102 items in 8
clusters**.

| Source module | Clusters | Items | ported | translated | superseded-by |
|---|---|---|---|---|---|
| `critic.py` | C-060 to C-062, C-064 to C-066 | 93 | 83 | 10 | 0 |
| `verdict_pins.py` | C-067 to C-068 | 9 | 7 | 2 | 0 |
| **Total** | | **102** | **90** | **12** | **0** |

Nearly all of it has no as-is requirement; the origin of each requirement is a behaviour item.

#### 3. Merge rule

| Case | Ruling |
|---|---|
| Grounding cap and presence lines | 028's code wins (cap 80 files); Lisa agrees in shape |
| Glob expansion | The baseline expands wildcards; Lisa's grounding does not. If Lisa's source is extracted, expansion and the caps are brought to the baseline **before** the characterization test is written (C-17) |
| Two limits of the baseline | Ported as they are: globs are not expanded when citations are extracted, and a wildcard match adds a presence line and no file content |

#### 4. New requirements from research and owner decisions

| Subject | Source |
|---|---|
| Grounding refuses, by real path, the control plane, the outbox, the carry-over files, the event stream and everything under `.git`; with the layer on or off | IR-19, IR-45, IR-59; C-28; SL-3 |
| Fingerprint before and after the grounding pass | IR-31 |
| The fact block is part of the critic's budget; when it does not fit it is reduced by a fixed rule, stated in the block, never dropped silently | IR-22 |
| Escaping, cutting and a data boundary with a per-call token for every string that originates in the workspace | IR-44; R11 R-5 |
| Lines carrying the per-run marker token are removed from phase evidence and grounded files, and the removal is recorded | IR-20 |
| The critic prompt holds no count, order, time, output, earlier result, model tier, session or routing decision | Decision 21; D1.12; IR-18 |
| The critic qualifies only with a known context window | Decision 17; Principle IX |
| `prompt.built` for every critic call, with sizes per block and drops; `critic.grounding_gap` when a path or glob does not resolve | EV-08, EV-09 |
| File modification times in the snapshot are kept | DP-050 |
| A cited result file that belongs to a stopped job, and phase evidence that predates the tree, are stated | IR-49, IR-51 |
| **A critic with read-only tools** (the second form of the `completion` level) runs in the working tree and may read project files by itself. It is still given the grounding snapshot and the fact block in its prompt; on conflict the snapshot and the disk beat prose; its verdict is bound to the nonce | Rulings 57, 57a; Principles III and IX, exception |
| **Hiding the proposer's files.** Before such a critic starts, the runtime moves the proposer's notebook, handoff and outbox out of the working tree into the control plane and records the move; after the call, however it ends, it moves them back unchanged. No such call starts while a pass of the proposer is alive. With this the history of repairs stays withheld, and decision 21 holds | Ruling D1; decision 21 |
| **The list of withheld paths**, which the harness's sandbox must deny for reading: the workspace part, the control plane, the event stream, the worker root and the tree store. The adapter confirms the denial before the call; without the confirmation this form is not used | Ruling D1; R29 PU-63; R29v PU-91, open question 1 |
| The prompt of such a critic says that project files are data and never instruction. What it reads by itself cannot be framed or redacted by the runtime: repository text reaches this critic without passing the grounding snapshot. The specification states this residual risk, which the owner accepted | `architecture.md` section 17; ruling 57a; R11 R-5 |
| Grounding refuses, by real path, the worker root and the tree store, with parallel units on or off | R29 PU-62; R29v PU-98 |
| Integrity events of the layer `parallel` reach the critic by neutral kinds and without counts; no critic-class input holds a word of the list of R29v PU-83. A protected change that was refused is reported by its neutral kind | R29v PU-83; CQ-009; ruling 41 |
| File modification times cluster after a merged delta was applied. It is accepted, with a register row | CQ-010; ruling 53 |

#### 5. Contracts

| Depends on (feature 100) | Version |
|---|---|
| Fact block schema; check manifest | `specstride.fact-block/1`, `specstride.manifest/1` |
| State layout (what grounding refuses) | `specstride.layout/1` |
| Redactor | `specstride.redaction/1` |
| EP-03 canonical spec model | `specstride.spec-format/1` |
| EP-15 prompt block provider (form of a block) | `specstride.prompt-block/1` |
| Event envelope | `specstride.event/1` |
| EP-02 harness port, level `completion` in both forms | `specstride.harness/1` |
| Withheld paths for a critic with read tools | `specstride.withheld-paths/1` |

**Owns (content):** the critic's prompt assembler and block set; the grounding snapshot format; the
list of withheld paths for a critic with read tools. No extension point of its own.

#### 6. Divergence register rows and pending decisions

| Id | What the brief proceeds on |
|---|---|
| DV-019, DP-007 (ruling 11) | No divergence: globs are expanded as at the baseline; FX-25 compares the wildcard line as it is |
| DV-032 | Grounding refusals apply always; a fixture whose phase evidence cites a state path is waived |
| DV-076 | IR-31 at the grounding pass; off under the `parity` profile |
| DV-081, DP-001 (rulings 57, 57a) | A critic with read-only tools in a sandbox, in the working tree, with the proposer's files hidden. Not observable in the oracle |
| CQ-009, CQ-010 | A refused protected change is reported by a neutral kind; clustered modification times are accepted |
| Row to be written | The refusal of the worker root and the tree store, against the oracle, as DV-032 has it for state paths (see brief 142) |
| DP-044 (ruling 39) | No immutable snapshot of the tree; detection |
| DP-050 (ruling 53) | Modification times are kept |
| DP-051 (ruling 53) | The unit id stays in the fact block; fingerprint values do not |

#### 7. Requirement groups and estimate

| Group | Content | Est. |
|---|---|---|
| G1 | Grounding snapshot: extraction, caps, globs, refusals | 12 |
| G2 | Critic prompt assembly, window fitting, verdict pins | 10 |
| G3 | Fact-block slot, escaping, data framing, marker removal | 6 |
| G4 | The critic with read-only tools: what it is given, hiding and return of the proposer's files, withheld paths | 5 |

Total: about 33.

#### 8. Tests required

| Kind | Content |
|---|---|
| Parity | FX-25 (critic prompt in the stub transcript, compared in full, N-24); FX-02 and FX-05 for the prompt around a rejection |
| Characterization | Lisa's grounding after it is brought to the baseline |
| Own tests | A citation of each refused root, absolute, relative and through a link; a workspace file named like the fact block does not reach the prompt; two runs with the same final state reached in 1 and in 9 cycles give a byte-identical critic prompt. For a critic with read-only tools: the notebook, the handoff and the outbox exist before the call, are absent from the working tree during it and are back byte-identical after it, also when the call is killed; a call without a confirmed read denial is not made |

Success criteria this feature carries:

| Criterion | Measure |
|---|---|
| No false "missing" from a wildcard | On FX-25 every cited glob that matches files yields a presence line |
| The critic prompt fits | No critic call exceeds the declared window; every reduction is stated in the prompt |
| No repair history reaches the critic | The excluded fields of D1.12 appear in no critic-class input, on every run; during a call of a critic with read-only tools none of the withheld paths is readable |

#### 9. Constitution principles that bind it

II, III, IX, V, XVIII.

#### 10. Research that supports it

R18 (F-07), R19 (C-17), R21v, R11 (T-03, T-04, T-23), R23, R23v (V-10, V-11, V-12), R27 (D1.12), R1, R6, R29, R29v (V-01, V-02, open question 1).

#### 11. Constraints

Owner-set constraints, for the spec's `## Constraints` section:

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| The critic is a fresh session with no tools and a known budget on every call. The one exception is a critic with read-only tools in an operating-system sandbox, and it is limited to reading project files | Decision 7; Principle IX; rulings 57, 57a, D1 |

**What belongs in `plan.md` instead:** libraries and their versions, the package and file layout, physical paths behind logical names, the test runner, bundling, and the spelling of internal functions. `spec.md` describes behaviour and names none of them.

---

### 102-run-control

Directory: `specs/102-run-control`. Tier 2. Estimated requirements: 33.

#### 1. Scope

**In scope.** `stop` and `stop --now` as the consumer sees them and as the engine honours them at its
boundaries and during a pass; `resume`, its refusals and their exit codes; the comparison of the
source hashes (spec, plan, task list) at launch and at resume; the run snapshot with pinned and tunable keys
and its replay on resume; counts and phase attempt numbers that survive a resume or relaunch, and the
reset flag; when a launch continues an unfinished run and when it starts a new one; the operations of
the run-state machine that a consumer can ask for.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| The lock, the lease, lock reclaim, the process registry, the inbox as a mechanism | 122 |
| The relaunch classifier and `supervise stop` | 123 |
| The front-door spelling of the verbs and their compatibility output | 119 |
| `status` | 129 (data and default output), 119 (compatibility output) |
| The ledger in which the counts live | 103 (content), 100 (schema) |
| Precedence ranks of the snapshot among config layers | 110 |
| Quota pause and its resume | 127 |
| The hashing and the staleness verdict | 104 |
| The comparison of the source hashes at every pass start | 103 |
| The check at critic start, which stays under the `parity` profile | 105 |

#### 2. As-is requirements received

| As-is id | Behaviour (short) | Disposition | Proof |
|---|---|---|---|
| 028 FR-015 | Stop flag honoured at boundaries and during a pass; exit 6; `--now` ends the pass's process tree | merged-with 002 FR-046 | Parity (028 side) through mapping, FX-12 |
| 028 FR-016 | Resume refuses while locked; replays the saved settings, extra arguments last-wins | merged-with 002 FR-016 | Parity (028 side) through the exit-code map of DV-021, FX-13 |
| 002 FR-016 | Resume refusals: nothing to resume, already running, spec hash changed | merged-with 028 FR-016 | Characterization (Lisa side) |
| 002 FR-046 | Stop flag written atomically; empty means a clean stop | merged-with 028 FR-015 | Characterization (Lisa side) |

Behaviour inventory received, as assigned in `traceability-items.tsv` (the authority): **56 items in 14
clusters**.

| Source module | Clusters | Items | ported | translated | superseded-by |
|---|---|---|---|---|---|
| `specstride` | C-108 to C-111, C-113 to C-115 | 38 | 28 | 9 | 1 |
| `orchestrator.sh` | C-009 to C-013 | 14 | 7 | 6 | 1 |
| `proposer.sh` | C-054, C-057 | 4 | 0 | 4 | 0 |
| **Total** | | **56** | **35** | **19** | **2** |

#### 3. Merge rule

| Case | Ruling |
|---|---|
| Resume refusals | New codes 5 (lock held) and 3 (nothing to resume), and Lisa's spec-hash refusal with 3, adopted because 028 is silent on it. 028's exit 1 is compared through the exit-code map (C-03; owner ruling K2) |
| Stop flag | 028's behaviour wins; Lisa's atomic write and "empty means clean" are kept, both agree |
| A stop request with no active run | Preserved: the next run stops at once (D-28); the engine removes the request when it honours it (D-29) |
| Settings replay | 028's replay wins in substance for pinned keys; R16's run snapshot replaces the file form (C-25) |
| Counts across resume | Decision 23 replaces the restart that 028 and Lisa share (C-14); mixture-of-loops' persisted relaunch budget stays with 123 |

#### 4. New requirements from research and owner decisions

| Subject | Source |
|---|---|
| Reject counts, phase attempt numbers, the MALFORMED streak, pass index, yield index and the consecutive breakers continue across a resume or relaunch | Decision 23; DP-053; IR-26, IR-50 b |
| The reset flag (`--reset-counts` proposed) is accepted from the command line only, never replayed, and emits `counters.reset` | C-14; IR-50 c; EV-26 |
| The suffix rule for an existing archive directory stays | C-14 |
| A launch continues an unfinished run of the same feature and its counts; `--new-run` starts a new one | DP-081 |
| The run snapshot: every resolved key with its source; pinned and tunable classes; a failed write is a launch error; an unknown schema version is refused | C-25; DP-058; DV-024, DV-039 |
| `resume` verifies the signed approval records and continues at the first phase without a valid one | Ruling 33; DP-010; R15 A-7.3 |
| **`resume` refusals and their codes**: exit **5** when the lock is held; exit **3** when there is nothing to resume; exit **3** when a source hash changed since launch. This feature owns the three refusals. The oracle maps the old code 1 to 5 and to 3; the hash refusal has no reference and has its own test | Ruling K2; DV-021 |
| **The source hashes at launch and at resume.** At launch the hashes of spec, plan and task list are recorded in the run snapshot as pinned values. At the launch that continues an unfinished run, and at `resume`, they are compared by the hasher of 104. A change refuses the command with exit 3, names the file, emits `blocked` with that reason, and leaves the run in `blocked-on-human` | Rulings K2, K3, 29; DV-082 |
| For the task list the hash compared is the one that ignores checkboxes: a tick never refuses a resume | 011 FR-007; R28 |
| Under the `parity` profile neither check point is active; the plan is checked at critic start as today | Ruling K3; DV-082 |
| How the consumer accepts a change that was intended: by an explicit flag on `resume` (or a launch with `--new-run`), which derives plan and manifest again, records the new hashes, keeps counts and delivered phase evidence, and is an event that every critic of the run receives as a fact. Without the flag nothing continues | Rulings 29, K3; IR-54; section 6, point 1 |
| `resume` refuses with the survivors named when the owner is dead and a recorded process group is alive | R2v; EP-13 |
| `stop --now` ends `owned` processes only after pid, start time and run token match; ending an `adoptable` detached job is a separate, explicit request | R15v P-2; R11 T-26 |
| `blocked-on-human` is a resting state left by `resume` | DP-076 |
| The host writes no transition; the CLI writes only the transitions into and out of `created` | `architecture.md` section 8; LR-3, LR-4 |
| Events `run.launched{countsCarried, countsReset}`, `run.ended{cause, causedBy}` for a stop | EV-15, EV-26 |

#### 5. Contracts

| Depends on (feature 100) | Version |
|---|---|
| Run-state machine | `specstride.run-state/1` |
| Inbox request types (the stop request) | `specstride.inbox/1` |
| Process registry | `specstride.procs/1` |
| Ledger; approval record | `specstride.ledger/1`, `specstride.approval/1` |
| Run snapshot | `specstride.snapshot/1` |
| EP-13 lock and liveness (`probe`, `reclaim`) | `specstride.lock/1` |
| Config envelope and ranks | `specstride.config/1` |
| Exit codes of `run`, `resume`, `stop` | annex G |

**Owns (content):** the run snapshot; the stop request among the inbox request types; the operations
of the run-state machine that the consumer triggers. **Single owner of stop** (R15v E-3).

#### 6. Divergence register rows and pending decisions

| Id | What the brief proceeds on |
|---|---|
| DV-011, DP-053 (ruling 9) | Counts continue; off under the `parity` profile by passing the reset flag |
| DV-021, ruling K2 | `resume` exits 5 and 3, and 3 when a source hash changed; mapped |
| DV-082, ruling K3 | Source hashes compared at launch and at resume; off under the `parity` profile |
| DV-029, DP-010 (ruling 33) | `resume` verifies the signed approval record |
| **Point 1, candidate for `CLARIFY-QUEUE.md`** | No ruling says how a consumer continues after an intended change of a source. Recommended answer: the explicit flag of section 4. If ruled otherwise a changed source always needs a new run, and the counts and the delivered phase evidence of the old run are lost |
| **Point 2, for the orchestrator** | Rulings K2 and K3 bear on the same moment. K2 gives the refusal of `resume` its exit code; K3 gives the run its resting state and signal. The brief reads them together: exit 3 for the command, `blocked-on-human` for the run |
| DV-024, DP-058 (ruling 10) | Run snapshot with a pinned and tunable split; pinned keys compared, three waivers |
| DV-037, DV-039 | Layout migrations and old saved settings are not carried |
| DP-081 (ruling 8) | A launch continues an unfinished run |
| DP-076 (ruling 29) | `blocked-on-human` rests |
| D-35 | Fixed by the tunable class: an exported pass timeout wins on resume |

#### 7. Requirement groups and estimate

| Group | Content | Est. |
|---|---|---|
| G1 | Stop and `stop --now` | 8 |
| G2 | Resume, refusals and codes, the source hashes at launch and at resume, verification of approval records | 12 |
| G3 | Run snapshot and replay | 7 |
| G4 | Surviving counts, the reset flag, new run or continued run | 6 |

Total: about 33.

#### 8. Tests required

| Kind | Content |
|---|---|
| Parity | FX-12 (stop at each check point, `--now`), FX-13 (resume and settings replay, with the reset flag), FX-11 for the refusal while locked |
| Characterization | Lisa's resume refusals and stop-flag write; surviving counts: a reject limit of 3 reached across two resumes |
| Own tests | The spec, the plan and the text of the task list each changed between launch and resume: exit 3, the file named, the run in `blocked-on-human`; only checkboxes changed: no refusal; an approval record with a wrong signature; snapshot write fails; a tunable key set in the environment on resume |

Success criteria this feature carries:

| Criterion | Measure |
|---|---|
| A limit means what it says | With the reject limit at 3, a run stopped and resumed after two rejections halts at the next one |
| A stop never signals a foreign process | In a fixture with a reused pid the signal is not sent |

#### 9. Constitution principles that bind it

I, XVI, V, XVIII.

#### 10. Research that supports it

R19 (C-03, C-14, C-25), R16 (F5, F7), R15, R15v (E-3, P-2, O-2), R23v (V-16), R24, R11 (T-26, T-28), R2v, R28.

#### 11. Constraints

Owner-set constraints, for the spec's `## Constraints` section:

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

**What belongs in `plan.md` instead:** libraries and their versions, the package and file layout, physical paths behind logical names, the test runner, bundling, and the spelling of internal functions. `spec.md` describes behaviour and names none of them.

---

### 119-front-door-and-presenter

Directory: `specs/119-front-door-and-presenter`. Tier 2. Estimated requirements: 30.

#### 1. Scope

**In scope.** The front door of the one CLI: the verb set and routing, usage and help, unknown verbs
and unknown flags, the exit with the called command's code and 70 on an uncaught error; the inspection
commands (`tail`, `events`, `verdicts`, `feedback`, `phases`) and the compatibility output of `status`;
the public verbs `spec`, `verify`; the two output modes (terse default, compatibility) as they apply
to the front door; the presenter, banner and theme with their colour rules.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| What `stop` and `resume` do | 102 |
| `status` data and default output, `wait` | 129 |
| `learn` | 106 |
| `reverse` | 108 |
| `doctor` | 112 |
| Launch contract commands, `launch`, `supervise`, digest lines | 107, 123 |
| The terminal follower `watch` and the web viewer | 121, Wave 2 |
| The line grammar | 100 |

#### 2. As-is requirements received

| As-is id | Behaviour (short) | Disposition | Proof |
|---|---|---|---|
| 028 FR-023 | Front-door verbs; read-only except `stop`, `resume`, `learn` and what `reverse` writes | merged-with 002 FR-003 | Parity (028 side), FX-28 |
| 002 FR-001 | Unknown verb: exit 1 | merged-with 028 FR-023 | Characterization (Lisa side) |
| 002 FR-002 | Usage and exit 0 on empty arguments or help | merged-with 028 FR-023 | Characterization (Lisa side) |
| 002 FR-003 | `run`, `start` or a leading flag launches | merged-with 028 FR-023 | Characterization (Lisa side) |
| 002 FR-004 | Recognised but unimplemented verbs exit 1 | superseded-by DV-042 | Register row DV-042: 028 FR-023 wins, the product implements the verbs |
| 002 FR-005 | Exit with the router's code; 70 on an uncaught error | ported | Characterization |
| 002 FR-007 | Strict flag parser rejects unknown flags | merged-with 028 FR-023 | Characterization (Lisa side) |

Behaviour inventory received, as assigned in `traceability-items.tsv` (the authority): **240 items in 33
clusters**.

| Source module | Clusters | Items | ported | translated | superseded-by |
|---|---|---|---|---|---|
| `specstride` | C-108 to C-109, C-111 to C-115 | 91 | 85 | 5 | 1 |
| `present.py` | C-096 to C-103 | 79 | 39 | 40 | 0 |
| `orchestrator.sh` | C-006 to C-007, C-009, C-012 to C-013 | 25 | 23 | 2 | 0 |
| `banner.py` | C-081 to C-086 | 23 | 8 | 15 | 0 |
| `theme.py` | C-104 to C-107 | 19 | 6 | 13 | 0 |
| `wiggum` | C-023 to C-024 | 2 | 0 | 0 | 2 |
| `wiggum-lib.sh` | C-025 | 1 | 0 | 0 | 1 |
| **Total** | | **240** | **161** | **75** | **4** |

The 8 items of the digest script are `dropped` and have no destination (DV-061).

#### 3. Merge rule

| Case | Ruling |
|---|---|
| Verb set | 028's twelve verbs win; Lisa's unimplemented verbs are superseded because the product implements them |
| Unknown subcommand | Both exit 1 |
| Unknown argument | 028's code wins: usage and exit 3 for the engine; each command keeps its as-is usage code (C-32) |
| Exit 70 | Lisa wins: 028 and 011 are silent |
| Presenter | The baseline's `present.py` is the oracle; Lisa's presenter ports an older version and is extracted only as a starting point |
| `phases` | Its write of a fixed temporary file is fixed (D-24) |

#### 4. New requirements from research and owner decisions

| Subject | Source |
|---|---|
| Two output modes: compatibility output reproduces the old lines byte for byte; default output is terse; verbose is opt-in | Decision 16; C-31; DP-060 |
| Default output uses repository-relative paths, printed once; per-command byte limits on success and failure | R17 part 2 |
| Inspection reads through a CLI verb with a byte cap; the host reads no state file | LR-2; R15v B-2 |
| Every verb that enumerates harnesses reads the registry | Decision 17 |
| Free-text fields printed to a terminal or a host pass the redactor and are framed as data | R11 T-12, T-33; LR-9 |
| `spec` and `verify` are public verbs with the as-is codes of their modules | DP-082 |
| Cold start of a read command at or below 150 ms p90 on the reference machine | R17 part 1 |

#### 5. Contracts

| Depends on (feature 100) | Version |
|---|---|
| CLI protocol and line grammar; output modes | protocol 1 |
| Exit codes per command (front door, inspection) | annex G |
| EP-09 `RunView` (for the compatibility output of `status`) | `specstride.view/1` |
| Redactor | `specstride.redaction/1` |
| State layout (logical names the inspection commands read) | `specstride.layout/1` |
| Event envelope | `specstride.event/1` |

**Owns (content):** the front-door lines and the compatibility output of the inspection commands. No
extension point.

#### 6. Divergence register rows and pending decisions

| Id | What the brief proceeds on |
|---|---|
| DV-033 | Two output modes; the oracle runs the port in compatibility output (N-20) |
| DV-036 | The old command alias is not carried |
| DV-042 | The verbs exist; Lisa's behaviour has no characterization test |
| DV-061 | The digest script is dropped; the digest and `status` replace it |
| DV-062 | `phases` writes no fixed temporary file |
| DP-082 (ruling 26) | `spec`, `verify`, `learn` are public verbs |
| DP-060 (ruling 68) | Language artefacts are reproduced in compatibility output |

#### 7. Requirement groups and estimate

| Group | Content | Est. |
|---|---|---|
| G1 | Verb routing, usage, unknown verbs and flags, exit codes | 9 |
| G2 | Inspection commands and their compatibility output | 11 |
| G3 | Presenter, banner, theme, colour and live rules | 10 |

Total: about 30.

#### 8. Tests required

| Kind | Content |
|---|---|
| Parity | FX-28 (inspection commands, output lines, exit codes); the presenter's lines on FX-01 and FX-02; N-21 for colour |
| Characterization | Lisa's routing rules and exit 70 |
| Budget | The golden output gate of R17: each command's default output on a success and a failure fixture stays within its byte limit; an absolute path in default output fails |

Success criteria this feature carries:

| Criterion | Measure |
|---|---|
| Terse by default | Every inspection command prints at most 1,120 bytes on success and 2,240 on failure in default mode |
| Read-only | Inspection commands change no file, in the workspace or the control plane |

#### 9. Constitution principles that bind it

XIX, V, XVIII, XIII.

#### 10. Research that supports it

R18 (Appendix A, B), R19, R17, R13, R1, R15v (E-3, O-3).

#### 11. Constraints

Owner-set constraints, for the spec's `## Constraints` section:

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| The CLI is one binary named `specstride` | Decision 19; R3 |

**What belongs in `plan.md` instead:** libraries and their versions, the package and file layout, physical paths behind logical names, the test runner, bundling, and the spelling of internal functions. `spec.md` describes behaviour and names none of them.

---

### 103-proposer-pass

Directory: `specs/103-proposer-pass`. Tier 2. Estimated requirements: 42.

#### 1. Scope

**In scope.** The pass loop inside one phase attempt, ported for parity: iteration accounting, the
iteration limit, the consecutive-error breaker, the no-progress breaker, the pass-ceiling breaker, the
short-pass nudge, the exit of the loop the instant phase evidence exists; the mapping of the loop's result to the engine's exit; the hook points of the
loop-layer interface and the built-in layer `none`; the proposer's prompt assembler and its blocks;
carry-over: the ledger, the handoff, the obligations index, the cache-stable prompt start; the error
breaker; the comparison of the source hashes at the start of every pass; the start-up of a pass, in
time that is linear in the size of the prompt; the core side of the loop-layer interface for a
stacked layer.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| Watchdogs, kills, the polite stop, yield and detached jobs, fail-fast | 118 |
| The micro-loop layer and the router table | 115 |
| The layer `parallel`, the group executor, the tree store and integration | 142 |
| The hashing and the staleness verdict; the comparison at launch and at resume | 104; 102 |
| Starting a harness, its arguments, session directives | 109; the adapters 125, 130, 131, 134, 138 |
| Reading the stream of a pass | 126 |
| The critic's prompt | 117 |
| Surviving counts as a consumer-visible rule and the reset flag | 102 |
| Quota classification of a failed pass; the whole-run wall-clock budget | 127 |

#### 2. As-is requirements received

| As-is id | Behaviour (short) | Disposition | Proof |
|---|---|---|---|
| 028 FR-018 | Error and hard-cap breakers; engine exit 4 on pass-loop results 4, 7, 8, 9, 10 | ported | Parity, FX-17 to FX-20 |

Behaviour inventory received, as assigned in `traceability-items.tsv` (the authority): **105 items in 20
clusters**.

| Source module | Clusters | Items | ported | translated | superseded-by |
|---|---|---|---|---|---|
| `proposer.sh` | C-050 to C-058 | 65 | 24 | 41 | 0 |
| `orchestrator.sh` | C-006 to C-013 | 33 | 26 | 7 | 0 |
| `error_breaker.py` | C-041 to C-043 | 7 | 6 | 1 | 0 |
| **Total** | | **105** | **56** | **49** | **0** |

The no-progress exit 8 and most of the loop have no as-is requirement; the origin of each requirement
is a behaviour item.

#### 3. Merge rule

Only 028 contributes behaviour. Lisa's proposer-context budgeting is extracted as the first
implementation behind the prompt block provider; with the legacy block set selected the prompt equals
the baseline's byte for byte. Lisa's no-progress threshold of 2 is not taken; 028's breaker wins.
Preserved defects: the no-progress breaker is never evaluated on the structured path (D-44); the
loop's exit 4 at the iteration limit writes no `run_stop` line (D-45); a crashed pass reads as clean
for a harness that emits no terminal record (D-48).

**One defect is fixed and not ported** (owner ruling K7): the start-up of a pass. See section 4.

#### 4. New requirements from research and owner decisions

| Subject | Source |
|---|---|
| Loop-layer hook points in a fixed order after a pass: kill check, yield check, layer, classic accounting; `contributePrompt`, `afterPass`, `betweenPasses`, `nextPassBlock`, `onEvidence`, `contributeCriticInput`, `resume`, `report`, `requestPass`; capability negotiation of directives; the tree-store service reserved, of which 142 builds the subset that parallel units need | EP-04; R15v P-10; DP-089; CQ-003 |
| **EP-04 for a stacked layer**: layers are stacked in order, to a depth of at most 2 in Wave 1; for each hook the outer layer is called first and the inner one when the outer returns `none`. The directives `requestPass`, `requestPassGroup` and `integrateGroup` are executed and accounted by the engine. A layer declares the directives and services it uses, and the engine refuses at registration what it does not offer. The attempt view holds `workerId` and `groupId`; each layer has a ledger namespace | R29 PU-05; R15v A-1; ruling 56 |
| **The source hashes at every pass start.** Before a pass starts, the hashes of spec, plan and task list are compared with those recorded at launch, by the hasher of 104. A change stops the run with the blocked-on-human signal: the `blocked` event with the file named, an existing stop reason, the resting state `blocked-on-human`. The pass is not started. Phase evidence that was delivered is kept. For the task list the hash that ignores checkboxes is compared. Off under the `parity` profile | Ruling K3; DV-082; R28; ruling 29 |
| **The start-up of a pass is fixed, not ported.** The baseline tests whether the prompt is empty by an expansion whose cost is quadratic in the size of the prompt in a UTF-8 locale (`proposer.sh:1807`): 2 s at 20 kB, 33 s at 80 kB, 548 s observed at 319 kB, which is about 9 minutes of one core before every proposer start. The product tests it in linear time. The time from the decision to start a pass to the start of the harness process does not grow faster than the size of the prompt. What is observable stays: an empty prompt is refused as today, so no fixture differs | Ruling K7; R28 |
| One more drop rule of continuation: the first main-line pass after a group of parallel units was applied is a fresh session, since another writer changed the tree | R29 PU-33 |
| For a harness that cannot continue a session the session directive is always fresh, and files carry the context | Ruling 58 |
| The general part of two items that the traceability files assign to 130 is specified here: the `iter_done` event and the order of the prompt blocks (B-0563, B-0764). Brief 130 holds their dsh variant | `traceability.md` section 5, item 20 |
| With the layer `none`, or a layer that never engages, output is identical apart from the named fields | Decision 21; IR-52 |
| One assembler budgets the whole prompt; stable blocks first; the start is byte-stable within a phase attempt; a protected block is never dropped; `prompt.built` for every pass | EP-15; R27 D1.10, D1.11; EV-09 |
| The obligations index: id, a title cut to a fixed length, the path of the full text; a pure function of the verification plan; the proposer's prompt only | R27 D1.11; R12; DP-019 |
| The ledger: one, in the control plane, append-only, chained, signed; with the layer off one record per phase attempt; validated on resume | R27 D1.10; IR-25, IR-57 |
| The handoff: at most 6 KB, written by the runtime at every pass start, never appended, never read back by the runtime, carrying the tree fingerprint and the line that the tree wins | R27 D1.10; R24 |
| The proposer's notebook is no longer the required first read | R24 |
| Session directive per pass: fresh for a new phase attempt, a relaunch, a watchdog kill, a second repair, an escalation, a configuration change; otherwise continued under the drop rules, at most 3 continued passes and the context-fill rule | Decision 22; R24; DP-035, DP-036; D-14 |
| The no-progress test excludes the outbox and the control plane | IR-24 |
| `blocked`: a proposer's declared block ends the run under an existing stop reason on every path, the structured path included | C-12; DV-067; EV-06 |
| Quota classes no longer count as consecutive errors | DV-005; decision 8 |
| Each switch of carry-over is its own switch: `carry.ledger_handoff`, `carry.index`, `carry.continuation` | R27 D1.1 |

#### 5. Contracts

| Depends on (feature 100) | Version |
|---|---|
| EP-04 loop-layer interface | `specstride.loop-layer/1` |
| EP-15 prompt block provider | `specstride.prompt-block/1` |
| EP-02 harness port, level `proposer` (`startPass`, `betweenPasses`) | `specstride.harness/1` |
| EP-06 router (call sites only) | `specstride.router-rules/1` |
| EP-12 quota classifier (the class of a failed pass) | `specstride.quota-classifier/1` |
| Ledger | `specstride.ledger/1` |
| Stop reasons; result record of the pass loop | `specstride.stop-reason/1` |
| Yield artifact schema (the yield check) | `specstride-pass-yield/v1` |
| Event envelope | `specstride.event/1` |

**Owns (content):** EP-04 (the hook points and the layer `none`), EP-15 (the proposer's assembler and
the shipped blocks), the ledger.

#### 6. Divergence register rows and pending decisions

| Id | What the brief proceeds on |
|---|---|
| DV-045, DP-019 (ruling 54) | Obligations index on by default, off under the `parity` profile; N-24 then compares the prompt in full |
| DV-010, DP-035 (ruling 7), DP-036 (ruling 55) | Continuation within a phase attempt under the drop rules; off under the `parity` profile |
| DV-011, DP-053 (ruling 9) | The pass index and the breakers continue across a resume |
| DV-013, DV-014 | The short-pass counter and the iteration count are left as a yield leaves them when a pass ends at a valid checkpoint; the hook is here, the rule in 115 |
| DV-020, DP-039 (ruling 44) | The checkpoint contract block is a named layer field |
| DV-067 | `blocked` and its stop reason |
| DV-005 | Quota classes are carved out of exit 7 |
| DP-089 (ruling 31), CQ-003 | The tree store is reserved in the interface; 142 builds the subset that parallel units need |
| DV-082, ruling K3 | Source hashes compared at every pass start; off under the `parity` profile |
| Ruling K7, **row to be written** | The start-up defect is fixed. Ruling K7 asks for a register row for every fix; the register holds none for this one. Not observable in the oracle: only the time differs |
| DV-080 | The contents of EP-04 for a stacked layer exist for 142; with parallel units off no directive of a group is ever issued |

#### 7. Requirement groups and estimate

| Group | Content | Est. |
|---|---|---|
| G1 | The classic pass loop: accounting, limits, breakers, result mapping, the source hashes at pass start, the start-up of a pass | 16 |
| G2 | Loop-layer hook points, the layer `none`, stacking, the group directives, capability negotiation | 11 |
| G3 | Prompt assembler and blocks, obligations index, cache-stable start | 8 |
| G4 | Ledger, handoff, session directive | 7 |

Total: about 42.

#### 8. Tests required

| Kind | Content |
|---|---|
| Parity | FX-17 (iteration limit), FX-18 (consecutive errors), FX-19 (no progress, both paths), FX-20 (hard-cap kills), FX-24 (short-pass nudge); golden prompts (N-24) |
| Conformance | EP-04: the inertness suite and a sample layer `noop` that passes the whole oracle; a sample layer stacked above `noop` that requests a group of two stub passes and integrates them, with the whole oracle passing when it is unregistered; a layer that declares a directive the engine does not offer is refused at registration; static check that a layer's module graph imports no gate writer. EP-15: a sample provider adds a block that shows in `prompt.built` |
| Own tests | The index regenerated from the plan equals the stored one; an invalid ledger switches the layer off and stops nothing; a continued session is dropped at each of the drop rules; the text of the task list edited between two passes stops the run before the next pass, with the file named, and a tick does not; start-up measured with prompts from 20 kB to 320 kB grows no faster than the prompt |
| Experiments | X3 (how much prompt the index removes), X4 (cache misses), X9 and X11 (ablations) are run by 115's experiment plan on this feature's switches |

Success criteria this feature carries:

| Criterion | Measure |
|---|---|
| Smaller cold start | First-turn tokens per pass at least 40 % lower at the median than the baseline of 107.8k, and no phase over the prompt budget (X3) |
| Work survives a killed pass | After a watchdog kill the next handoff names the unit of work in progress and the tree is unchanged by the runtime |
| No prompt block is dropped silently | Every drop is in `prompt.built` |
| A pass starts at once | With a prompt of 320 kB the start-up of a pass takes under 1 s of processor time on the reference machine, against 548 s at the baseline. The figure has low confidence |
| A changed source costs at most one pass | After an edit of spec, plan or the text of the task list, no pass starts and no critic is called on the old plan |

#### 9. Constitution principles that bind it

I, VIII, XI, V, VI, XVIII.

#### 10. Research that supports it

R18, R24, R12, R27 (D1.1, D1.10, D1.11), R23, R23v, R22, R15 (EP-04, EP-15), R15v (A-1, P-10), R21, R21v, R28, R29 (PU-05, PU-33).

#### 11. Constraints

Owner-set constraints, for the spec's `## Constraints` section:

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| A new phase attempt and every critic call start a fresh session | Decision 22 |
| The core imports no harness adapter, sink or config loader | `architecture.md` section 6 |

**What belongs in `plan.md` instead:** libraries and their versions, the package and file layout, physical paths behind logical names, the test runner, bundling, and the spelling of internal functions. `spec.md` describes behaviour and names none of them.

---

### 118-pass-supervision-and-jobs

Directory: `specs/118-pass-supervision-and-jobs`. Tier 2. Estimated requirements: 36.

#### 1. Scope

**In scope.** Supervision of one pass: the idle, disk-progress and repetition watchdogs with their kill
reasons and classes; the hard cap per pass and per phase; how a pass is ended (polite stop, then
terminate, then kill) and what a killed pass leaves (the kill note); the yield artifact, its
predicates, the poll, the limit per phase attempt, the deadline and the refusals; detached jobs of a
yield and their adoption by the next engine start; long jobs; the failure ledger of the baseline;
fail-fast through the first-failure predicate.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| The breakers that count kills and errors across passes | 103 |
| The step runner | 105 (single owner, R15v E-3) |
| The process registry as a record, and `stop --now` | 122, 102 |
| Exemption of inner check commands from the repetition counter | 115 (rule); the counter is here |
| The harness's own `stop` operation | 109 |
| Stream events the watchdogs read | 126 |

#### 2. As-is requirements received

| As-is id | Behaviour (short) | Disposition | Proof |
|---|---|---|---|
| 028 FR-017 | Watchdogs: idle 900 s, disk progress 1,800 s, repetition 12 | ported | Parity, FX-21 |
| 028 FR-019 | Yield artifact `specstride-pass-yield/v1`; poll 30 s; at most 4 per phase attempt; command predicate off | ported | Parity through mapping, FX-22 |

Behaviour inventory received, as assigned in `traceability-items.tsv` (the authority): **180 items in 27
clusters**.

| Source module | Clusters | Items | ported | translated | superseded-by |
|---|---|---|---|---|---|
| `proposer.sh` | C-051 to C-058 | 131 | 73 | 58 | 0 |
| `orchestrator.sh` | C-006 to C-013 | 26 | 17 | 9 | 0 |
| `specstride-lib.sh` | C-018 to C-022 | 12 | 7 | 5 | 0 |
| `failure_ledger.py` | C-044 to C-049 | 11 | 7 | 4 | 0 |
| **Total** | | **180** | **104** | **76** | **0** |

#### 3. Merge rule

Only 028 contributes. The repetition limit is 12, as in the code; the README's 5 is wrong (D-02).
mixture-of-loops' stage timeout belongs to 123. Lisa contributes its stop primitives as source, with a
process walk for macOS added; a signal is sent only when pid, start time and run token match.

#### 4. New requirements from research and owner decisions

| Subject | Source |
|---|---|
| First-failure predicate: a yield may declare `resume_when` of kind `first_failure` with a path and a pattern, and `on_first_failure` as `stop` or `continue-and-notify`; it reads only whole lines appended to the same file after the job started and must match on two successive polls | R27 D1.8; IR-51 |
| The runtime stops a job only if it launched the job and the yield declared `stop`; never a job in `adopt` mode; by signal to the process group with a grace period; the stop is an event | IR-51; DP-054 |
| What a job's result file says is a claim and never a check result; the critic is told, without counts, that a cited result file belongs to a stopped job | IR-29; DP-054 |
| Polite stop: interrupt before terminate, with a grace period | R27 D1.10; R24 |
| Detached jobs are `adoptable`: they survive a stop and are adopted by the next engine start | R15v P-2, C-6 |
| A pass that ends at a valid checkpoint is treated by the watchdog counters as a yield is | DV-013; IR-48 |
| Events `job.started`, `job.step`, `job.first_failure`, `job.ended{msAfterFirstFailure}`, `resource.wait` | EV-05, EV-10 |
| `verification.failfast` is its own switch, on by default, off under the `parity` profile; nothing rides on the layer's switch | R27 D1.1; IR-52 |
| A yield written in the same pass as a checkpoint refuses the checkpoint | R27 D1.2 |
| Jobs declare a shared `resource`; the doctor names resources it cannot check | R26; R15 A-8 |

#### 5. Contracts

| Depends on (feature 100) | Version |
|---|---|
| Yield artifact schema | `specstride-pass-yield/v1` |
| Process registry | `specstride.procs/1` |
| EP-02 harness port (`stop` with `polite`, `terminate`, `kill`) | `specstride.harness/1` |
| EP-04 loop-layer interface (directives that exempt a pass) | `specstride.loop-layer/1` |
| Closed family of kill reasons and classes | list of closed sets |
| Stop reasons | `specstride.stop-reason/1` |
| Event envelope | `specstride.event/1` |
| Fact block (the stopped-job fact) | `specstride.fact-block/1` |

**Owns (content):** the yield artifact schema; the first-failure predicate. No extension point.

#### 6. Divergence register rows and pending decisions

| Id | What the brief proceeds on |
|---|---|
| DV-051, DP-054 (ruling 52) | First-failure predicate on; stops only jobs the runtime launched and that declare it; off under the `parity` profile |
| DV-015 | The exact argument lists of the inner check set are exempt from the process-level repetition counter |
| DV-013 | The short-pass counter is left as it was by a checkpoint pass |
| D-30 | Fixed by the predicate |
| D-02 | Repetition limit 12 preserved |
| R15v open question 2 | Whether today's tree kill reaches a job in its own session is `unverified`; the brief proceeds on the intended behaviour: the job survives |

#### 7. Requirement groups and estimate

| Group | Content | Est. |
|---|---|---|
| G1 | Watchdogs, kill reasons, hard cap, kill note, polite stop | 13 |
| G2 | Yield artifact, predicates, poll, limit, deadline, refusals | 12 |
| G3 | Detached jobs, adoption, long jobs | 5 |
| G4 | Fail-fast: the first-failure predicate | 6 |

Total: about 36.

#### 8. Tests required

| Kind | Content |
|---|---|
| Parity | FX-20 (hard-cap kills, kill notes), FX-21 (three watchdogs, kill classes), FX-22 (each predicate, limit, deadline, refusal), FX-16 for the wait on detached verification commands |
| Own tests | The predicate on a stale failed line, a skipped row and a negative test that fails by design; a job in `adopt` mode is never stopped; a job in its own session survives the pass |
| Experiment | X2: fail-fast on the replay and the synthetic fixture |

Success criteria this feature carries:

| Criterion | Measure |
|---|---|
| Fail fast | On the replay fixture at least 50 % of the baseline's 29.3 h between first failure and end of wait are recovered, and no wait ends on a stale line, a skipped row or an expected failure (X2) |
| A killed pass is polite first | Every kill record shows the interrupt, the grace period and the signal that ended the pass |

#### 9. Constitution principles that bind it

I, VIII, XI, V, XVIII.

#### 10. Research that supports it

R18, R21, R21v, R23, R23v (V-17), R27 (D1.8), R24, R26, R2v, R15v (C-6).

#### 11. Constraints

Owner-set constraints, for the spec's `## Constraints` section:

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

**What belongs in `plan.md` instead:** libraries and their versions, the package and file layout, physical paths behind logical names, the test runner, bundling, and the spelling of internal functions. `spec.md` describes behaviour and names none of them.

---

### 104-spec-input

Directory: `specs/104-spec-input`. Tier 2. Estimated requirements: 24.

#### 1. Scope

**In scope.** Resolution of the spec when none is named; the spec formats of Wave 1 (`native`,
`speckit-tasks`, `openspec-change` with the alias `openspec`) and their detection order; the one
grammar owner; the canonical spec model, including structured tasks; validation; ticking of task
checkboxes as an operation of the model; the one hashing scheme (content hash and the
checkbox-insensitive hash) and the staleness verdict it yields for the spec, the plan and the task
list, naming the file that changed; the public verb `spec`.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| Spec bundle import, artifact selection, the bundle store | Roadmap (`deferred`) |
| The `chat` format | Roadmap |
| When ticking happens | 101 |
| What a stale source does to a launch contract, a render or a launch | 107, 123 |
| When the source hashes are compared during a run, and what a change does to the run | 102 (at launch and at resume), 103 (at every pass start), 105 (at critic start, under the `parity` profile only) |
| Reverse inventory fingerprints | 108 (it uses the canonical hasher) |
| Resume position | 101 (derived from approval records, never by an adapter) |

#### 2. As-is requirements received

| As-is id | Behaviour (short) | Disposition | Proof |
|---|---|---|---|
| 028 FR-001 | Spec resolution order without a named spec; list candidates and exit 3 | ported | Parity, FX-09 |
| 028 FR-002 | Format detection: override, filename, content; an unknown explicit format is an error | merged-with 002 FR-029 | Parity (028 side), FX-10 |
| 028 FR-029 | One module owns the spec grammar | translated | Parity through mapping, FX-10 |
| 011 FR-007 | Stale sources exit 23, except changes of checkboxes only | ported | Parity, FX-33 |
| 002 FR-028 | Five format adapters registered | merged-with 028 FR-029 | Characterization (Lisa side) for the three that are kept |
| 002 FR-029 | Detection order with environment steps | merged-with 028 FR-002 | Characterization (Lisa side) |

Behaviour inventory received, as assigned in `traceability-items.tsv` (the authority): **117 items in 20
clusters**.

| Source module | Clusters | Items | ported | translated | superseded-by |
|---|---|---|---|---|---|
| `specstride_spec.py` | C-138 to C-145 | 80 | 56 | 23 | 1 |
| `orchestrator.sh` | C-006 to C-007, C-009, C-012 to C-013 | 22 | 19 | 3 | 0 |
| `critic.py` | C-060 to C-061, C-063 | 8 | 0 | 8 | 0 |
| `bootstrap_contract.py` | C-213 | 3 | 1 | 2 | 0 |
| `specstride-lib.sh` | C-022 | 2 | 2 | 0 | 0 |
| `contract_lib.py` | C-218 | 1 | 1 | 0 | 0 |
| `validate_contract.py` | C-234 | 1 | 1 | 0 | 0 |
| **Total** | | **117** | **80** | **36** | **1** |

#### 3. Merge rule

| Case | Ruling |
|---|---|
| Format names and detection order | 028's names and order win; `openspec` is accepted as an alias (C-07) |
| Lisa's environment step in detection | Becomes the config keys `spec.format` and `spec.feature`, owned by 110 |
| Lisa's five adapters | Three are kept; the legacy adapter falls under decision 3; `chat` goes to the roadmap |
| Lisa's resolver rejects an explicit `openspec` although the adapter is registered | Fixed by the alias; a characterization test is written before the rename (D-53) |
| mixture-of-loops' own `tasks.md` parser | Replaced by the one grammar owner; the inventory output is the oracle (D-32) |
| Hashing | 011's scheme wins (content hash and checkbox-insensitive hash); Lisa's bundle hash is deferred with spec bundles; Lisa's two canonicalizers are deferred with them (D-16) |
| Usage error of the spec verb | Exit 2 kept where the module documents 3 (D-38) |

#### 4. New requirements from research and owner decisions

| Subject | Source |
|---|---|
| The canonical model holds phases with number, title, section and criteria, **plus** structured tasks: id, markers, text. The four-field view the oracle pins is a projection of it | EP-03; R15 A-3 |
| Operations `detect`, `parse`, `validate`, `tick`, `inputs`; a `priority` for detection order | EP-03; R15v P-10 |
| The task list of a phase, its order and ids as read at launch are stored with their hash; a difference at the phase gate is a fact | IR-56 (consumed by 115) |
| A sample format registered from the test tree is detected, parsed and run with no core change | EP-03 proving test |
| Every consumer of the grammar (engine, critic, contract derivation, CLI, doctor, run view) reads the canonical model | Principle IV |
| **The hashes of spec, plan and task list** are computed by the one hasher, and this feature owns the **staleness verdict**: which of the three files changed, named by its logical name and its repository-relative path, and whether the change is more than checkboxes. This feature does not decide when the comparison is made | Ruling K3; DV-082; R28 |
| For the task list the hash that ignores checkboxes is the one compared, so that a tick by the proposer, by the engine after approval, or by the runtime for an integrated group of parallel units never makes a run stale | 011 FR-007; R28; ruling P1; R29v PU-94 |

#### 5. Contracts

| Depends on (feature 100) | Version |
|---|---|
| EP-03 spec-format adapter and canonical spec model | `specstride.spec-format/1` |
| Canonical hasher interface | annex X |
| Exit codes of the spec verb | annex G |
| Config envelope (keys `spec.format`, `spec.feature`) | `specstride.config/1` |

**Owns (content):** EP-03; the canonical spec model; the canonical hasher.

#### 6. Divergence register rows and pending decisions

| Id | What the brief proceeds on |
|---|---|
| DV-073, DP-069 (ruling 69) | `openspec` accepted as an alias; one fixture waived |
| DV-060 | One grammar owner; a `tasks.md` the old parser could not read is waived |
| DP-082 (ruling 26) | `spec` is a public verb |
| DV-082, ruling K3 | The hashing and the verdict are here; the three check points are in 102 and 103; the check at critic start stays in 105 under the `parity` profile |

#### 7. Requirement groups and estimate

| Group | Content | Est. |
|---|---|---|
| G1 | Resolution and detection | 6 |
| G2 | Grammar, canonical model, validation, ticking | 10 |
| G3 | Hashing and the staleness verdict for spec, plan and task list | 8 |

Total: about 24.

#### 8. Tests required

| Kind | Content |
|---|---|
| Parity | FX-09, FX-10, FX-32 (inventory output through the one grammar), FX-33 (staleness) |
| Characterization | Lisa's three adapters, validator and resolver as extracted |
| Own tests | The verdict for each of the three files; a task list with ticks only is not stale; a task list whose text changed is stale and is named |
| Conformance | EP-03: golden models, round trip of `tick`, hash stability, a sample format from the test tree |

Success criteria this feature carries:

| Criterion | Measure |
|---|---|
| One grammar | No second parser of phase headings or task lines exists in any package |
| Checkbox-only changes never make a source stale | FX-33 |

#### 9. Constitution principles that bind it

IV, VI, XIV, XVIII.

#### 10. Research that supports it

R19 (C-07, D-32), R18, R1, R1v (V3), R15 (EP-03), R23v (V-23), R28.

#### 11. Constraints

Owner-set constraints, for the spec's `## Constraints` section:

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| The input is Spec Kit features that already exist; the product does not author specs | Prompt section 0 |

**What belongs in `plan.md` instead:** libraries and their versions, the package and file layout, physical paths behind logical names, the test runner, bundling, and the spelling of internal functions. `spec.md` describes behaviour and names none of them.

---

### 105-verification

Directory: `specs/105-verification`. Tier 2. Estimated requirements: 41.

#### 1. Scope

**In scope.** The verification modes `off`, `plan` and `required` and what each does to a verdict; the
verification plan and its obligations; the plan sources; the frozen per-phase check manifest and its
derivation; the verification gate: it runs every command, never stops at a failure, and writes the
feedback itself on failure; release verification; pre-staged and detached verification commands and
their reuse rules; the failure summary; the check runner; the step runner as an option; concurrent
verification commands as an option, with declared reads and writes; the integrity rules that hold
with the layer off; the staleness of the plan at critic start, which stays under the `parity`
profile only; the public verb `verify`.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| Fingerprints, the protected set, toolchain profiles | 115; this feature consumes them (R15v E-3) |
| Inner checks and the closing check as decisions of the layer | 115 (they use this feature's runner) |
| The wait on a detached job, the first-failure predicate | 118 |
| Verification plans bound to a spec bundle | Roadmap (`deferred`) |
| Which verification mode contract derivation sets | 107 |
| The obligations index in the proposer prompt | 103 |
| The comparison of the source hashes at launch, at resume and at every pass start | 102, 103; the hashing and the verdict are 104's |
| Parallel units and their merge check, which uses this feature's runner | 142 |

#### 2. As-is requirements received

| As-is id | Behaviour (short) | Disposition | Proof |
|---|---|---|---|
| 028 FR-020 | `--verification off`, `plan`, `required`; default `required`; other values exit 3 | ported | Parity, FX-14 |
| 002 FR-009 | Approval advances only when verification passes after an APPROVED | superseded-by DV-040 | Register row DV-040: 028's order wins, the verification gate runs before the critic |
| 002 FR-038 | The rendered test plan starts with a content-hash comment and provenance | merged-with 028 FR-020 | Characterization (Lisa side) |

Behaviour inventory received, as assigned in `traceability-items.tsv` (the authority): **163 items in 26
clusters**.

| Source module | Clusters | Items | ported | translated | superseded-by |
|---|---|---|---|---|---|
| `verification_plan.py` | C-074 to C-080 | 99 | 65 | 34 | 0 |
| `orchestrator.sh` | C-006 to C-013 | 48 | 27 | 21 | 0 |
| `verification_failure_digest.py` | C-069 to C-073 | 10 | 5 | 5 | 0 |
| `specstride-lib.sh` | C-019, C-021 to C-022 | 3 | 2 | 1 | 0 |
| `critic.py` | C-060 to C-061, C-063 | 3 | 0 | 3 | 0 |
| **Total** | | **163** | **99** | **64** | **0** |

All 99 items of the plan module have no as-is requirement. What `required` does to a verdict is taken
from the code.

#### 3. Merge rule

| Case | Ruling |
|---|---|
| Default mode | 028 wins: `required`; Lisa's `off` is superseded (C-01; DV-043) |
| Order | 028 wins: gate before critic (C-01; DV-040) |
| Plan | 028 wins in Wave 1: the plan is derived per run; Lisa's immutable store per spec bundle is deferred |
| Test plan header | Both render the same marker and provenance |
| mixture-of-loops | It inventories the verification-commands document; that inventory becomes one of the plan sources |
| Does the gate stop at its first failed command? | No. It runs every command; stopping early exists only in the step runner inside a yield (R23v V-18) |
| Lisa's verification package | Parts are extracted; the planner is rewritten to take the canonical spec model |

#### 4. New requirements from research and owner decisions

| Subject | Source |
|---|---|
| Plan sources behind one interface: the verification-commands document; commands declared literally in plan or tasks; toolchain discovery of build, type check, lint and test entry points; the launch-contract inventory. A command that cannot be written as a fixed argument list, or two declarations that disagree, is a blocker, never a guess | EP-07; Principle XIV |
| The plan is bound to the hashes of its sources, frozen at launch and stored in the control plane; the per-phase manifest is derived from it and from nothing else; a phase without commands stays explicitly empty | EP-07; IR-08 |
| A relaunch that derives a different manifest announces it, records it, and gives it to every critic of the run as a fact | IR-54 |
| The check runner: `prepare` resolves the executable to an absolute path with size and hash; `run` with a fixed argument list, no shell, own process group, an environment allow-list with no provider credentials, a time limit and an output cap; `cancel`; handle-based with `pin` | EP-05; IR-10; IR-36; R15v P-10 |
| Result conditions in separate fields: `tainted`, `cached`, `flaky`, `interrupted`, `unchecked` with its reason | EP-05; IR-40 |
| The gate and the inner checks use the same runner; a result means the same in both | EP-05 |
| Fingerprint before and after every gate command; checks run at the proposer's containment level or stricter | IR-31; IR-10 as amended |
| The gate reuses nothing but today's pre-stage rule; no inner result is accepted in place of an execution | IR-03 as amended |
| The step runner, off by default: steps as fixed argument lists, stop at the first failed required step, resume from it; a resumed run is `partial` and never evidence | R27 D1.8; IR-30 |
| **Concurrent verification commands**, an option: `verification.parallelism` defaults to 1, has the ceiling 4, and is 1 under the `parity` profile. It applies to the gate and to inner checks alike, since both use one runner | Ruling D2; DV-080; R29 PU-73; R26 |
| A command runs beside another only if the frozen manifest declares for both **what they write and what they read** (or `sideEffects: none` together with `reads: tree`), and no command of the batch reads what another writes. Declared reads and writes include ignored paths. **Undeclared means serial.** A command with declared writes never shares a batch with a command that follows it in manifest order, unless that command's reads are declared disjoint from those writes | R29 PU-74 as amended by R29v PU-101; R29v V-04; CQ-012 |
| The declarations are read at launch from the sources the verification gate uses, and are part of the frozen manifest. Batches are formed in manifest order, greedily. Two scopes are compared by normalised path prefixes with a path boundary. A cache that a toolchain profile marks exclusive keeps its commands apart | R29 PU-74, PU-11 |
| Isolation in a batch: the same tree; for each command its own process group, its own temporary directory, its own captured output with its own cap, its own time limit, and the environment allow-list | R29 PU-75 |
| One fingerprint pair brackets a batch. If a path changed outside the union of the declared writes, every command of the batch is `tainted` with the reason `changed-during-check`, and the parallelism is 1 for the rest of the run, with an event | R29 PU-76 |
| Every command of a batch runs to its end; none is cancelled because another failed. The steps of the step runner are never concurrent. Results, the failure signature and the fact block are ordered by manifest position, never by completion | R29 PU-77; ruling 51 |
| A command that fails in a batch of more than one is run once more alone, and both results are stated | R29v PU-101; IR-14, IR-40 |
| One `check.started` and one `check.ended` per command, with the batch, the slot, the duration and the result. A duration measured in a batch of more than one command is flagged `concurrent` and is never used for the `slow` exclusion or as a learned duration | R29 PU-78 |
| **The staleness check moved.** At the baseline the plan is refused as stale when the critic starts, with exit 3, which can end a phase attempt of many hours without a verdict. Outside the `parity` profile the hashes of spec, plan and task list are compared at launch, at resume and at every pass start (102, 103, with the hasher of 104), and this feature makes no check at critic start. Under the `parity` profile the check at critic start stays as it is (B-0803, B-0864, B-1114). The plan stays bound to the hashes of its sources in both cases | Ruling K3; DV-082; R28 |
| Events `check.started`, `check.ended` for every check, whoever runs it | EV-19 |
| In a run whose gate does not execute (mode `plan` or `off`) the fact is recorded for the layer's fallback | IR-34; DP-045, DP-064 |

#### 5. Contracts

| Depends on (feature 100) | Version |
|---|---|
| EP-05 check runner | `specstride.check-runner/1` |
| EP-07 verification-plan source | `specstride.verification-source/1` |
| EP-16 toolchain profile (consumed) | `specstride.toolchain/1` |
| Check manifest; fact block (facts the gate contributes) | `specstride.manifest/1`, `specstride.fact-block/1` |
| EP-03 canonical spec model | `specstride.spec-format/1` |
| Containment levels | annex C |
| Exit codes of the plan and gate (0, 3, 10, 11) and of the failure summary | annex G |
| Event envelope | `specstride.event/1` |

**Owns (content):** EP-05, EP-07, the check manifest, the step runner.

#### 6. Divergence register rows and pending decisions

| Id | What the brief proceeds on |
|---|---|
| DV-040, DV-043 | 028's order and default |
| DV-076, DV-078 | IR-31 around every gate command; IR-54 on a relaunch. Each adds a fact row to the critic prompt when it fires and is off under the `parity` profile |
| DV-082, ruling K3 | The check at critic start stays under the `parity` profile only |
| DV-080, DP-034 (ruling 56), ruling D2 | Concurrent verification commands are a Wave 1 option beside parallel units: default 1, 1 under the `parity` profile |
| CQ-012 | Commands declare reads as well as writes; a command runs beside another only when neither reads what the other writes; undeclared means serial |
| DP-047 (ruling 53) | No test counts in Wave 1 |
| DP-048 (ruling 41) | The gate runs when the protected set differs; the result carries the condition |
| DP-065 (ruling 51) | Every command runs |
| DP-082 (ruling 26) | `verify` is a public verb |
| DP-009 (ruling 35), C-24 | A verification command in project configuration is within the narrowing rule; the files the derivation reads are class A |

#### 7. Requirement groups and estimate

| Group | Content | Est. |
|---|---|---|
| G1 | Modes, gate order, what each mode does to a verdict, release verification | 9 |
| G2 | Plan, obligations, plan sources, manifest derivation | 11 |
| G3 | Check runner, result conditions, pre-stage and reuse rules, failure summary | 10 |
| G4 | The step runner; integrity rules with the layer off; staleness at critic start under the `parity` profile | 5 |
| G5 | Concurrent verification commands: declarations, batches, isolation, taint, ordering, events | 6 |

Total: about 41.

#### 8. Tests required

| Kind | Content |
|---|---|
| Parity | FX-14 (three modes, gate before critic, synthetic feedback), FX-15 (release verification failure), FX-16 (pre-staged and detached commands) |
| Characterization | Lisa's executor, store, hash, render and discovery as extracted; the test plan header |
| Own tests | Concurrent commands: a build that writes a directory and a test that reads it are never in one batch; a command without a declaration never shares a batch; a command declared free of side effects that writes a file taints the batch and sets the parallelism to 1; a batch whose first command fails at once lets the second run to its end; two fixtures with opposite completion orders give equal failure signatures; two commands that print 10 MB each give two capped files. Staleness: outside the `parity` profile no critic call is refused for a stale plan |
| Conformance | EP-05: scripted commands that pass, fail at step n, run slow, never end, print very large output; a sample runner. EP-07: fixtures with declared commands, with conflicts and with none; a sample source |

Success criteria this feature carries:

| Criterion | Measure |
|---|---|
| Declared verification is never invented | A phase without declared commands has an empty manifest and an `unchecked` result, never a generated command |
| Every gate executes in full | On every phase attempt in mode `required` the number of commands run equals the number in the manifest |
| A result never depends on the interleaving | With parallelism above 1 every result, signature and fact block equals that of the same manifest run with parallelism 1, on every fixture |

#### 9. Constitution principles that bind it

III, XIV, II, XVII, V, XVIII, XX (for concurrent commands: a declaration is a claim, undeclared is
serial, every admission to a batch is recorded).

#### 10. Research that supports it

R19 (C-01), R18, R23, R23v (V-01, V-04, V-18, V-21), R27 (D1.4, D1.8), R26, R11 (T-19, T-21), R1, R1v, R29 (PU-73 to PU-78), R29v (V-04, PU-101), R28.

#### 11. Constraints

Owner-set constraints, for the spec's `## Constraints` section:

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| Checks are deterministic commands only; no model acts as a reviewer | Decision 21 |
| A check is run by the runtime, never by the proposer's harness | Decision 21 |

**What belongs in `plan.md` instead:** libraries and their versions, the package and file layout, physical paths behind logical names, the test runner, bundling, and the spelling of internal functions. `spec.md` describes behaviour and names none of them.

---

### 106-learning

Directory: `specs/106-learning`. Tier 2. Estimated requirements: 29.

#### 1. Scope

**In scope.** Learning as the across-runs layer: metrics from events, the allowlisted knobs and their
bounds, the modes `off`, `suggest` and `apply`, the decision log with its byte format, sample floors
and quarantine, `show`, `advise`, `apply`, `revert`, `evaluate`; the binding of the decision log into
the launch contract; the rule that a supervised run receives the learning mode from the launch
contract and not from the shell; selection of the learning mode from the request; the retrospective
per launch contract hash.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| Memory as context carried forward (feature 114) | Not specified; the lessons store is on the roadmap |
| Validation of the launch contract that holds the binding | 107 |
| Stripping the variable from a child's environment as an act of the stage executor | 123 executes; the rule is here |
| The rank of a learned value among config layers | 110 |
| Harness-native memory | 125, 109 |

#### 2. As-is requirements received

| As-is id | Behaviour (short) | Disposition | Proof |
|---|---|---|---|
| 028 FR-024 | Learning adjusts only allowlisted knobs within bounds | ported | Parity, FX-29 |
| 011 FR-003 | Bind the decision log into the launch contract's learning configuration | translated | Parity through mapping (path in the new layout), FX-33 |
| 011 FR-016 | Strip the inherited learning variable; force `off` unless the stage declares it | ported | Parity, FX-35 |
| 011 FR-018 | Learning-mode selection from the request | ported | Parity, FX-36 |
| 011 FR-024 | Retrospective per launch contract hash; suggestions are not run | translated | Parity through mapping, FX-36 |

Behaviour inventory received, as assigned in `traceability-items.tsv` (the authority): **197 items in 29
clusters**.

| Source module | Clusters | Items | ported | translated | superseded-by |
|---|---|---|---|---|---|
| `learn.py` | C-087 to C-095 | 153 | 84 | 69 | 0 |
| `specstride` | C-108 to C-111, C-115 | 13 | 11 | 2 | 0 |
| `orchestrator.sh` | C-007 to C-008, C-011 to C-013 | 10 | 5 | 5 | 0 |
| `contract_lib.py` | C-214, C-218 | 6 | 3 | 2 | 1 |
| `supervisor_lib.py` | C-253 to C-255 | 6 | 3 | 3 | 0 |
| `supervise.py` | C-246, C-249 | 5 | 0 | 5 | 0 |
| `bootstrap_contract.py` | C-210, C-213 | 3 | 1 | 2 | 0 |
| `runtime.py` | C-226 | 1 | 0 | 1 | 0 |
| **Total** | | **197** | **107** | **89** | **1** |

#### 3. Merge rule

| Case | Ruling |
|---|---|
| 028 and 011 | They complement each other: 028 owns the knobs and decisions, 011 owns the binding and the retrospective. Both are kept |
| Lisa | It has a memory package with no requirement and no caller in a run; nothing is taken. "Learning" and "memory" are never mixed (glossary 28) |
| The launch contract beats the shell for the learning mode | Kept as the one named exception to decision 9 |
| Byte format of the decision log | Kept, because the hash binding depends on it |

#### 4. New requirements from research and owner decisions

| Subject | Source |
|---|---|
| Learning has its own writer domain and its own file, so that the event file keeps one writer | LR-5; R15v C-7 |
| The allowlist stays at two knobs; the invariants of the self-improving loop plan are carried in as requirements | R12 part 3 |
| Four stop reasons are read as arbitration signals: `max_rejects`, `gate_oscillation`, `critic_config`, `proposer_no_progress` | `consolidation.md` section 4.2 |
| Inner events of the micro-loop layer change no learning observation | IR-06 |
| The consumer's comment cannot widen the learning mode | Decision 18 |
| Provenance `learned` is recorded per applied value | R16 F5.6 |

#### 5. Contracts

| Depends on (feature 100) | Version |
|---|---|
| Launch-contract schema (the learning block) | `specstride.launch-contract/1` |
| Config envelope and ranks (contract pin, learned value) | `specstride.config/1` |
| Event envelope (the input of the metrics) | `specstride.event/1` |
| Stop reasons | `specstride.stop-reason/1` |
| State layout (learning writer domain) | `specstride.layout/1` |
| Exit codes of `learn` (0 to 4) | annex G |

**Owns (content):** the decision log format and the learning writer domain. No extension point.

#### 6. Divergence register rows and pending decisions

| Id | What the brief proceeds on |
|---|---|
| DV-025 | A learned pass ceiling beats the global pass timeout and loses to a per-phase setting; kept |
| DV-026, DP-058 (ruling 10) | The contract pin for the learning mode, kept; the legacy variable's stripping falls under decision 3 (DV-038) |
| DP-018 (ruling 17) | No memory feature; this feature is the across-runs layer |
| DP-082 (ruling 26) | `learn` is a public verb |

#### 7. Requirement groups and estimate

| Group | Content | Est. |
|---|---|---|
| G1 | Knobs, bounds, modes, decisions, quarantine | 13 |
| G2 | Commands and their exit codes | 7 |
| G3 | Binding with the launch contract, mode selection, contract pin | 5 |
| G4 | Retrospective | 4 |

Total: about 29.

#### 8. Tests required

| Kind | Content |
|---|---|
| Parity | FX-29 (show, apply, revert, off, evaluate; allowlist, sample floors, quarantine), FX-33 (binding), FX-35 (the variable is stripped), FX-36 (mode selection, retrospective) |
| Own tests | A test that locks the read sites of learned values; a run with the layer on leaves the observations equal |

Success criteria this feature carries:

| Criterion | Measure |
|---|---|
| Bounded | No applied decision lies outside the allowlist or its bounds, over every fixture |
| The launch contract says what runs | An exported learning mode never reaches a supervised run; the doctor reports the shadowed value |

#### 9. Constitution principles that bind it

XIII, I, V, XVIII.

#### 10. Research that supports it

R12, R18, R19, R16 (F5.6, F5.8), R15v (C-7).

#### 11. Constraints

Owner-set constraints, for the spec's `## Constraints` section:

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

**What belongs in `plan.md` instead:** libraries and their versions, the package and file layout, physical paths behind logical names, the test runner, bundling, and the spelling of internal functions. `spec.md` describes behaviour and names none of them.

---

### 107-launch-contract

Directory: `specs/107-launch-contract`. Tier 2. Estimated requirements: 26.

#### 1. Scope

**In scope.** The launch contract from Spec Kit features that already exist: the deterministic
inventory of sources; the draft with its open blockers; derivation of what the inventory cannot
settle, judged by the host in bounded batches; validation; promotion and its stamp; rendering of the
launcher and the content-addressed launch bundle; refusal of an edited launcher; the `dry-run` mode;
the consumer's comment: how it is stored, what it may steer and what it may never do; which
verification mode derivation sets.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| Running the pipeline, launch checks, relaunch, `supervise`, digest lines, the dry-run plan that the pipeline entry prints | 123 |
| Starting the detached runtime | 122 |
| The hashing scheme and the staleness verdict | 104 |
| The learning block's meaning | 106 |
| The host skill's text and its token budget | 113 |
| Stage kinds | 123 (EP-19); the schema lists what is registered |

#### 2. As-is requirements received

| As-is id | Behaviour (short) | Disposition | Proof |
|---|---|---|---|
| 011 FR-001 | Inventory of sources with content hash, line count and the checkbox-insensitive hash for `tasks.md` | ported | Parity, FX-32 |
| 011 FR-002 | The bootstrap emits a draft with the open blocker `semantic-derivation-required` | ported | Parity, FX-32 |
| 011 FR-004 | Strict validation rules | ported | Parity, FX-33 |
| 011 FR-005 | Open blockers and unresolved coverage are rejected | ported | Parity, FX-33 |
| 011 FR-006 | `--promote` writes `validated` and a stamp; failure sets `draft`, prints `next:` hints, exits 20 | translated | Parity through mapping, FX-33 |
| 011 FR-008 | The renderer validates again, requires the stamp, refuses an edited launcher unless told to replace it | ported | Parity, FX-34 |
| 011 FR-009 | Content-addressed launch bundle | translated | Parity through mapping (N-10, N-11), FX-34 |
| 011 FR-010 | Generated launcher with a marker and a hash of its own content | translated | Parity through mapping (N-17), FX-34 |
| 011 FR-027 | Legacy spellings normalized with a warning | superseded-by DV-038 | Register row DV-038 (decision 3); not compared (N-28) |

One requirement of 011 whose behaviour sat in this area has no destination and is listed in section
D.2: 011 FR-026 (dropped).

Behaviour inventory received, as assigned in `traceability-items.tsv` (the authority): **79 items in 18
clusters**.

| Source module | Clusters | Items | ported | translated | superseded-by |
|---|---|---|---|---|---|
| `contract_lib.py` | C-216, C-218 | 37 | 33 | 3 | 1 |
| `bootstrap_contract.py` | C-209 to C-213 | 18 | 13 | 5 | 0 |
| `render_launcher.py` | C-219 to C-224 | 12 | 2 | 10 | 0 |
| `validate_contract.py` | C-232 to C-236 | 12 | 6 | 5 | 1 |
| **Total** | | **79** | **54** | **23** | **2** |

Non-code assets received: the launch-contract schema file (it becomes the one schema that is also the
validator's input); the skill's reference texts on the contract and on derivation, whose rules become
behaviour here and whose prose goes to 113.

#### 3. Merge rule

Only 011 contributes. Lisa's artifact selection overlaps the inventory and is deferred with spec
bundles; 011's inventory wins. Preserved defects: `--promote` rewrites the launch contract without
sorting keys while the bootstrap sorts them (D-43). Fixed: one schema in place of a schema that is
looser than the validator, with the validator's behaviour as the oracle (D-13). Dropped: five
configuration keys that are written and never read (D-12).

#### 4. New requirements from research and owner decisions

| Subject | Source |
|---|---|
| `specstride-run` launches by default. Modes `run` and `dry-run`: `dry-run` derives and validates, reports what would be launched, and stops. `generate` maps to `dry-run`; `run` and `auto` map to `run` | Decision 18; DV-009 |
| The CLI inventories deterministically and pages the items the host must judge, in batches of at most 3,000 tokens; the number of remaining batches is printed; the total printed does not grow with source size | DP-023; R17 |
| Only validation promotes; facts and judgment are kept apart, with provenance for each judged item | Principle XIII |
| The comment is stored verbatim with its hash **before** any repository text is printed, redacted, recorded in events and digest together with what it changed; it can narrow or steer and cannot bypass a launch check, the terms gate or a budget, because no flag for that exists | Decision 18; R11 T-09, T-10 |
| Derivation states which verification mode it sets and why, and prefers `required` where commands are declared | DP-064 |
| A host without a model may delegate derivation judgment to a harness, by user-scope configuration, recorded in the digest | DP-086 |
| The schema keeps `depends_on` and accepts optional `stages[].writes[]`, validated and unused | R15 A-8; R26 |
| The launcher is a file the operator can see and run; the bundle hash and the launcher's hash are verified at launch and at every relaunch | DP-043; R11 T-47 |
| The key `configuration.auto` is renamed `configuration.relaunch`; the old name is compared through the key map | D-31; DV-055 |
| Derived supervision values lie within ceilings of user configuration, or validation fails | R16 F5.7 |
| Coverage obligations, never bare "obligations" | Glossary 27 |
| The promoted launch contract may carry the consumer's declarations of write scopes for tasks marked `[P]`, keyed by task id, and declared reads and writes of verification commands. They are validated as any content of the contract and are used by 142 and 105 only. With parallel units on, `dry-run` prints the parallel plan; with them off it prints no line about it | R29 PU-12, PU-15; R29v PU-98, PU-101; ruling 56 |

#### 5. Contracts

| Depends on (feature 100) | Version |
|---|---|
| Launch-contract schema | `specstride.launch-contract/1` |
| EP-03 canonical spec model (the inventory reads it) | `specstride.spec-format/1` |
| Canonical hasher | annex X |
| EP-07 verification-plan source (the launch-contract inventory is one) | `specstride.verification-source/1` |
| EP-19 stage kinds (registered kinds) | `specstride.stage-kind/1` |
| CLI protocol, line grammar, exit codes 0, 2, 20, 23 | protocol 1 |
| Redactor | `specstride.redaction/1` |
| State layout (contract, bundle) | `specstride.layout/1` |

**Owns (content):** the launch-contract schema; the launch bundle format. No extension point.

#### 6. Divergence register rows and pending decisions

| Id | What the brief proceeds on |
|---|---|
| DV-009 | Launch by default; mapped through the mode map; one waiver |
| DV-008 | The launch bundle holds TypeScript artifacts; self-consistency of hashes is asserted |
| DV-054, DP-043 (ruling 18) | A launcher with a Node shebang; compared as a logical record |
| DV-055 | Key renamed, mapped |
| DV-059 | One schema |
| DV-060 | One grammar owner for the inventory |
| DV-061 | Five unread keys are dropped |
| DV-038 | Legacy spellings are not normalized |
| DP-023 (ruling 64) | Inventory by the CLI, judgment by the host in batches |
| DP-064 (ruling 40) | Derivation prefers `required` |
| DP-086 (ruling 64) | Delegation of judgment by a model-less host |

#### 7. Requirement groups and estimate

| Group | Content | Est. |
|---|---|---|
| G1 | Inventory, draft, derivation in batches | 8 |
| G2 | Validation and promotion | 7 |
| G3 | Rendering, launcher, launch bundle | 5 |
| G4 | Modes, the comment, declared scopes | 6 |

Total: about 26.

#### 8. Tests required

| Kind | Content |
|---|---|
| Parity | FX-32 (bootstrap: ready, blocked, ambiguity), FX-33 (validate and promote: each error class, stale, learning binding), FX-34 (render: stamp, edited launcher, bundle reuse) |
| Own tests | The comment: a comment that asks to skip a check changes no check; a comment laundered from repository text is stored as what the consumer typed and nothing else. The judgment payload gate on a synthetic feature of at least 200 tasks |

Success criteria this feature carries:

| Criterion | Measure |
|---|---|
| Derivation fits the host | Every judgment batch is at most 3,000 tokens and the total printed does not grow with the size of the sources |
| The comment is recorded | Every run launched with a comment shows the comment and what it changed in events and digest |
| `dry-run` launches nothing | No process is started and no run state is written |

#### 9. Constitution principles that bind it

XIII, XIV, XV, XIX, XVIII.

#### 10. Research that supports it

R19 (`auto` versus `run`), R18, R17, R11 (T-09 to T-12, T-47), R2v, R15, R16.

#### 11. Constraints

Owner-set constraints, for the spec's `## Constraints` section:

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| The product takes Spec Kit features that already exist and does not author specs | Prompt section 0 |
| The launcher is TypeScript run through Node; no Bash launcher | Decision 2; DP-043 |

**What belongs in `plan.md` instead:** libraries and their versions, the package and file layout, physical paths behind logical names, the test runner, bundling, and the spelling of internal functions. `spec.md` describes behaviour and names none of them.

---

### 123-pipeline-runtime-and-supervisor

Directory: `specs/123-pipeline-runtime-and-supervisor`. Tier 2. Estimated requirements: 35.

#### 1. Scope

**In scope.** The pipeline stage executor inside the runtime root: start-up refusals, the dry-run plan,
preflight, stages in order, skipping of completed stages and reset on a changed launch contract hash,
in-stage retry by exit code and stop reason, stage timeout, signals, pipeline state; stage kinds and
precondition checks as an extension point; the launch checks; the `launch` verb of supervision and the record it
leaves, started through the detach strategy of 122; both relaunch classifier tables and the relaunch
budget; the `supervise` verbs with their exit codes and poll backoff; the digest and the
`[MOL-*]` lines in compatibility output and their terse equivalents; the run request of kind `engine`.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| Deriving, validating, promoting and rendering the launch contract | 107 |
| Detach strategies, the lock, the lease, the handshake, the inbox as a mechanism | 122. This feature owns the observable launch of 011 FR-020 and calls 122 for the start |
| The `stop` command | 102; `supervise stop` is its compatibility spelling here |
| `status` and `wait` | 129 |
| Quota pause | 127. A pause is a state, so the classifier has nothing to classify |
| The engine | 101, 103 |

#### 2. As-is requirements received

| As-is id | Behaviour (short) | Disposition | Proof |
|---|---|---|---|
| 011 FR-011 | The pipeline runtime exits 23 or 20 with `[DIGEST] state=failed`; the dry-run plan and `[DIGEST] state=dry-run exit=0` | ported | Parity, FX-35 |
| 011 FR-012 | Pipeline run state under `runs/<id>/`; exclusive lock; exit 24 | translated | Parity through mapping, FX-35 |
| 011 FR-013 | Preflight; exit 21 `preflight` | ported | Parity, FX-35 |
| 011 FR-014 | Stages in order; skip completed; reset on a hash change; recorded in the state file | ported | Parity, FX-35 |
| 011 FR-015 | In-stage retry by exit code and stop reason; exit 22 or 128+N; child exit 6 means stopped | ported | Parity, FX-35 |
| 011 FR-019 | Six ordered launch checks; the first failure refuses; a held lock yields `attach` | translated | Parity through mapping, FX-36 |
| 011 FR-020 | Detached launch: stdin closed, new process session, logs, the launch record file | translated | Parity through mapping (DV-006), FX-36 |
| 011 FR-021 | Relaunch classifier conditions; every refusal named | ported | Parity, FX-36 |
| 011 FR-022 | Relaunch budget: default 2, declared 0 to 5 | translated | Parity through mapping (the key map of DV-055), FX-36 |
| 011 FR-023 | `[MOL-*]` labelled lines and the fields of the final digest | translated | Parity through mapping (N-19, N-20), FX-35, FX-36 |
| 011 SC-003 | The dry run exits 0, takes no action, prints one `[DIGEST] state=dry-run` | ported | Parity, FX-35 |
| 011 SC-005 | Poll at least 60 s, factor 1.5, cap 600 s | ported | Parity, FX-36 |
| 011 SC-006 | At most 5 relaunches, 2 by default | ported | Parity, FX-36 |

Behaviour inventory received, as assigned in `traceability-items.tsv` (the authority): **178 items in 19
clusters**.

| Source module | Clusters | Items | ported | translated | superseded-by |
|---|---|---|---|---|---|
| `supervisor_lib.py` | C-250 to C-255 | 81 | 57 | 23 | 1 |
| `runtime.py` | C-225 to C-231 | 72 | 60 | 12 | 0 |
| `supervise.py` | C-246 to C-249 | 20 | 4 | 16 | 0 |
| `contract_lib.py` | C-215, C-218 | 5 | 4 | 1 | 0 |
| **Total** | | **178** | **125** | **52** | **1** |

#### 3. Merge rule

Only 011 contributes. Preserved defects: a stage stopped by child exit 6 ends the pipeline with 22 and
state `stopped` (D-09); stale and invalid digest lines go to stderr with `evidence=none` (D-10);
`recovery-exhausted` is unreachable and accepted (D-08); exit 4 for the launch decision `attach` as
well as for `refuse` (D-37); exit 2 for a stopped run and for a usage error (D-46); `child-exit=None`
and the Python `repr` in `[MOL-RELAUNCH]` (D-36); `[MOL-HOLD]` on every unchanged poll, in
compatibility output only (D-50). The reader that takes the newest line with any `reason` field is
preserved in the compatibility projection; new code reads the typed terminal record (D-11).

#### 4. New requirements from research and owner decisions

| Subject | Source |
|---|---|
| `relaunch.owner` with values `root` (default) and `supervise`. With `root` the runtime root stays alive after a failed stage and consults a **second classifier table**, which has a row for a crashed engine. With `supervise` the root exits with the pipeline code and `supervise observe` classifies as today. `supervise` is the setting of the `parity` profile | `architecture.md` section 4; R15v B-1, P-1; DP-072, DP-080 |
| The inbox request `hold-relaunch`, so that the host can still steer | R15v P-1 |
| The classifier is a pure table: versioned data, one evaluator, the rule id recorded with every decision | LR-7; Principle XIII |
| The pipeline runtime reads exit code, stop reason and `retryable` from the engine's terminal record; when it is missing it falls back to the exit code and classifies the end as a crash | C-05, C-08; DV-028 |
| Stage kinds and precondition checks are an open registry: `setup`, `decision`, `command`, `specstride`, `smoke` in Wave 1 | EP-19; R15v A-5 |
| The launch checks are doctor checks with the launch-blocking flag and a fixed order; a launch check reports a held workspace lock before launch | EP-14; C-05; R16 F2 |
| Quota pause removes one relaunch cause; `paused_quota_ceiling` and `proposer_consecutive_errors` for non-quota classes are classified by their `retryable` attribute | DV-005; C-23; DP-068 |
| Run request of kind `engine`: one engine invocation with the same lock, lease, classifier and digest, for `specstride-reverse` and `run --detach` | DP-077 |
| The digest is produced by the runtime from events, never composed by the host model | R11 T-11 |
| Supervisor events in the one stream: `supervisor.*`, `stage.started`, `stage.ended` per launch | EV-01, EV-18 |
| `supervision.json` as one state file per writer | R15v P-8 |
| Terse lines use the prefix `[SPECSTRIDE-*]`; one supervision cycle costs at most 150 tokens and a terminal digest at most 250 | C-06; R17; DP-024 |
| The stage graph is serial; the resume predicate is defined over groups of stages, with groups of one | R15 A-8 |
| A run that stopped because a source changed (spec, plan or task list) rests in `blocked-on-human`. Its stop is not retryable, and neither classifier table relaunches it. The refusal itself is owned by 102 and 103 | Rulings K3, 29; DV-082 |
| With parallel units on, the `dry-run` plan of the pipeline entry includes the parallel plan of 142; with them off, and under the `parity` profile, it prints no line about it | R29 PU-15; R29v PU-98; ruling 68 |

#### 5. Contracts

| Depends on (feature 100) | Version |
|---|---|
| EP-19 stage kind and precondition check | `specstride.stage-kind/1` |
| Terminal record; `supervision.json`; launch record and lease | `specstride.terminal/1`, `specstride.supervision/1`, `specstride.launch/1` |
| Inbox request types (`hold-relaunch`) | `specstride.inbox/1` |
| Table evaluator | `specstride.table/1` |
| Launch-contract schema | `specstride.launch-contract/1` |
| Run-state machine (`relaunching`, `failed`, `finished`) | `specstride.run-state/1` |
| Stop reasons with `retryable`; closed families of stage reasons, launch decisions and relaunch refusals | `specstride.stop-reason/1`; list of closed sets |
| EP-14 doctor check registry (launch-blocking subset) | `specstride.doctor/1` |
| EP-13 lock (exit 24 on conflict) | `specstride.lock/1` |
| CLI protocol, line grammar, exit codes of the pipeline entry and of `supervise` | protocol 1 |
| Event envelope | `specstride.event/1` |

**Owns (content):** EP-19; both relaunch classifier tables; `supervision.json`; the inbox request
`hold-relaunch`; the digest and `[MOL-*]` lines. **Single owner of the relaunch classifier** (R15v E-3).

#### 6. Divergence register rows and pending decisions

| Id | What the brief proceeds on |
|---|---|
| DV-028 | Terminal record in place of the child's exit code and the newest reason line; same values, compared |
| DV-033 | Two output modes; `[MOL-HOLD]` only in compatibility output |
| DV-070, DP-060 (ruling 68) | Language artefacts reproduced byte for byte |
| DV-055 | The mode field stays in the projection with the mapped value; the budget key is renamed |
| DV-005 | Quota failures no longer reach the classifier |
| DV-026 | The launch contract pins the learning mode for stage children |
| DV-074 | Relaunch by the runtime root with its second table; under the `parity` profile `relaunch.owner` is `supervise` |
| DV-082, ruling K3 | A stop on a changed source is never relaunched |
| DP-072 (ruling 6), DP-080 (ruling 6) | `root` by default |
| DV-075, DP-073 (ruling 21) | A second pipeline on a held workspace ends with 24 at launch, where today it ends with 22 and child exit 5: a waiver for that fixture |
| DP-077 (ruling 25) | Run request of kind `engine` |
| DP-085 (ruling 28) | Nothing relaunches after a crash of the root or a reboot |

#### 7. Requirement groups and estimate

| Group | Content | Est. |
|---|---|---|
| G1 | Stage executor: start-up, dry-run plan, preflight, stages, retry, signals, state; EP-19 | 13 |
| G2 | Launch checks | 5 |
| G3 | Relaunch: both tables, budget, `relaunch.owner`, `hold-relaunch`, what is never relaunched | 9 |
| G4 | `supervise` verbs, poll backoff, digest and labelled lines | 8 |

Total: about 35.

#### 8. Tests required

| Kind | Content |
|---|---|
| Parity | FX-35 (dry run, preflight, stages, recovery, resume, signals, lock) and FX-36 (launch checks, launch, observe, relaunch classifier, stop, retrospective), each run twice: against the engine stub and against the real engine with agent stubs |
| Own tests | The second classifier table: golden decisions per row and the property that exactly one row fires for every input; a crashed engine is relaunched within budget with counts carried; `hold-relaunch` holds it |
| Conformance | EP-19: a sample stage kind registered from the test tree runs as a stage with no core change |

Success criteria this feature carries:

| Criterion | Measure |
|---|---|
| Runs look after themselves | With no host session open, a run whose engine ends on a transient stop reason is relaunched by the runtime root within its budget |
| Supervision is cheap | All supervision output of a run, whatever its duration, stays within 3,000 tokens in default output |
| Every refusal is named | Each launch refusal and relaunch refusal prints its literal from the closed family |

#### 9. Constitution principles that bind it

XVI, XIII, XV, XVII, I, XIX, XVIII.

#### 10. Research that supports it

R19, R18, R15 (F-01, F-03, A-7), R15v (B-1, B-2, A-5, C-1, C-2), R14, R17, R21, R21v, R16.

#### 11. Constraints

Owner-set constraints, for the spec's `## Constraints` section:

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| The host observes and asks; it never edits run state | Decision 5; Principle XVI |

**What belongs in `plan.md` instead:** libraries and their versions, the package and file layout, physical paths behind logical names, the test runner, bundling, and the spelling of internal functions. `spec.md` describes behaviour and names none of them.

---

### 122-detached-runtime

Directory: `specs/122-detached-runtime`. Tier 2. Estimated requirements: 30.

#### 1. Scope

**In scope.** The mechanism of decision 5: the runtime root as the leader of a detached process tree;
detach strategies; the launch record with its nonce and the handshake; the workspace lock and
liveness; the lease, its heartbeat, its hand-down to the engine and its verification; lock reclaim;
the process registry with the classes `owned` and `adoptable`; the inbox as the only place a process
outside the runtime tree writes after launch; re-attachment as reading; what happens to the lock when
the engine or the root dies; state `export`, `import` and `adopt`; the advisory marker in the
workspace part; the spike that comes before the specification freezes.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| What is relaunched and when | 123 |
| `stop`, `resume` as commands | 102 |
| The stages the root executes | 123 |
| `status` and the `SessionStart` line | 129, 113 |
| Quota pause as a state of the engine | 127 |
| A service strategy that survives a reboot | Roadmap |
| A native kernel lock | Roadmap, on demand, as a Language Ledger entry (ruling 23) |
| The worker root and the tree store of parallel units | 142. This feature's registry records the worker processes |

#### 2. As-is requirements received

| As-is id | Behaviour (short) | Disposition | Proof |
|---|---|---|---|
| 028 FR-004 | One run per workdir; kernel lock or lock directory; exit 5 | translated | Parity through mapping: exit 5 on a second run, FX-11; the lock's file form is mapped per OS |

Behaviour inventory received, as assigned in `traceability-items.tsv` (the authority): **16 items in 9
clusters**.

| Source module | Clusters | Items | ported | translated | superseded-by |
|---|---|---|---|---|---|
| `orchestrator.sh` | C-007, C-009, C-011 to C-013 | 9 | 2 | 4 | 3 |
| `specstride` | C-113, C-115 | 3 | 1 | 2 | 0 |
| `supervisor_lib.py` | C-255 | 3 | 2 | 1 | 0 |
| `runtime.py` | C-229 | 1 | 0 | 1 | 0 |
| **Total** | | **16** | **5** | **8** | **3** |

#### 3. Merge rule

| Case | Ruling |
|---|---|
| Lock mechanism | None of the three is taken as it is. One directory lock on every platform, with the owner record renamed into place, reclaim by rename, liveness backed by the kernel through something the runtime platform ships, and the process group tracked (C-04, C-22). The observable codes of 028 (5) and 011 (24) are kept |
| Lisa's lock | Not reused: its reclaim let several contenders win in 297 of 300 rounds (D-51) |
| Two locks or one | One lock per workspace, taken by the root and handed down as a lease (DP-073) |
| The lock-directory fallback that is never released | Fixed (D-06; owner ruling K7; DV-022) |
| Detached launch | 011 FR-020 is owned by 123, which keeps its observable behaviour; this feature supplies the detach strategy, the launch record and the handshake it uses |
| Lisa's stop primitives | Extracted as source; signals only on a matching pid, start time and token |

#### 4. New requirements from research and owner decisions

| Subject | Source |
|---|---|
| Lock and liveness provider: `acquire`, `heartbeat`, `release`, `probe` with six results, `reclaim`, `handDown`, `verify`; the owner record; a foreign owner is never reclaimed; `unknown` counts as held; the provider is recorded per workspace | EP-13; R15v P-10 |
| Exactly one winner among 8 contenders over 300 rounds | EP-13 proving test; R2v |
| The engine verifies the lease at every boundary and ends cleanly when the owner is lost | R15v P-3, D-1 |
| Detach strategies `spawn-detached` and `foreground`; readiness is confirmed by the lease carrying the launch nonce; the strategy in use is in the run record and the doctor | EP-17 |
| Handshake outcomes `started`, `attached`, `refused`; an unanswered launch is closed as `launch-abandoned` | R15v P-13 |
| Process registry: `owned` processes are ended by a stop; `adoptable` detached jobs survive a stop and are adopted by the next engine start | R15v P-2 |
| `owner-dead-group-alive` refuses to start and names the survivors | R2v risk 3 |
| The inbox: request types, read at boundaries; a stop request is honoured as today, including when no run is active | SL-5; LR-3 |
| Crash of the root or a reboot: nothing relaunches by itself; the run reads as `dead`; the next launch writes the closing event `run.ended{synthesized}` | `architecture.md` section 4; EV-15; DP-085 |
| Liveness is never an event | EV-29 |
| State `export`, `import` and `adopt` for a moved, renamed or cloned working tree; a launch is refused when the spec shows ticked phases that have no approval record, with the command to adopt named | R15v P-14; DP-084 |
| The advisory marker in the workspace part, checked at launch; advisory because the proposer can write there | R15v P-13 |
| The workspace identity is derived from the real path and never read from a file inside the workspace | R15 A-5.1 |
| Host capability `stateRootWritable`; fallback to a control root inside the tree with a deny rule per harness | R15v P-6; DP-071 |
| Directories of the control plane are private to the user | R11 T-29 |
| **The spike**, on Linux and macOS: start the root from the host's shell tool in an interactive session and under headless mode, with the shell sandbox off and on; end the session; confirm the root lives and that the host's shell tool and the root can write the control root | `architecture.md` section 4; R3 risk 1; R15v P-6 |
| A paused run recomputes from the recorded resume time on wake, not from a timer | R14 risk 10 |
| Every process the engine starts carries the run token in its environment. **When the engine exits for any cause, the root ends every `owned` process after the identity check, before it relaunches or rests.** Engine start and `resume` search the process table for holders of the run token and end them; `status` and the doctor report them. The rule holds with parallel units on or off; with them on it covers every worker | R29v PU-90, V-12; R11 T-26 |
| An entry of the process registry for a worker of parallel units holds the worker id beside pid, start time and run token | R29 PU-32 |

#### 5. Contracts

| Depends on (feature 100) | Version |
|---|---|
| EP-13 lock and liveness; EP-17 detach strategy | `specstride.lock/1`, `specstride.detach/1` |
| Launch record and lease; process registry; inbox request types | `specstride.launch/1`, `specstride.lease/1`, `specstride.procs/1`, `specstride.inbox/1` |
| State layout, identifiers, the `schema` field rule | `specstride.layout/1` |
| Approval record (checked by `adopt` and at launch) | `specstride.approval/1` |
| Run-state machine (`created`, `starting`, `dead`) | `specstride.run-state/1` |
| EP-01 host capabilities (`stateRootWritable`, `background`) | `specstride.host/1` |
| Event envelope | `specstride.event/1` |

**Owns (content):** EP-13, EP-17, the launch record and lease, the process registry, the inbox.
**Single owner of lock reclaim** (R15v E-3).

#### 6. Divergence register rows and pending decisions

| Id | What the brief proceeds on |
|---|---|
| DV-022, DP-005 (ruling 23) | Directory lock with kernel-backed liveness; exit 5 and 24 compared; stale-lock and orphaned-child fixtures waived |
| DV-071, DP-006 (ruling 67) | macOS compared with the Linux capture; every expectation `inferred` |
| DP-070 (ruling 21) | The engine is a child of the root |
| DP-071 (ruling 22), DP-084 (ruling 22) | Control plane outside the tree, with export, import, adopt and the marker |
| DP-073 (ruling 21) | One workspace lock; one waiver |
| DP-085 (ruling 28) | A pause holds while the runtime lives |
| DP-043 (ruling 18) | The launcher has a Node shebang |
| R15v open question 5 | Path length limits of the liveness endpoint are not measured; a short path is required |

#### 7. Requirement groups and estimate

| Group | Content | Est. |
|---|---|---|
| G1 | Detach strategies, launch record, handshake, re-attachment | 8 |
| G2 | Lock, liveness, lease, reclaim | 9 |
| G3 | Process registry, processes that outlive the engine, inbox | 7 |
| G4 | Export, import, adopt, the marker, the spike's acceptance | 6 |

Total: about 30.

#### 8. Tests required

| Kind | Content |
|---|---|
| Parity | FX-11 (lock held, exit 5), FX-35 (exit 24), FX-36 (launch record and detached start) |
| Characterization | Lisa's stop primitives as extracted |
| Own tests | The engine killed by signal while a harness process lives: the root ends the process before it relaunches; the same with the root gone: `resume` finds the holder of the run token and ends it, and `status` reports it before that |
| Conformance | EP-13: one winner per round; owner killed; owner dead with a live child; a reused pid after a changed boot identity; a foreign host name; a sample provider. EP-17: start, end the parent, confirm the child lives and the lease is valid; the same with the parent killed by signal; a sample strategy |
| Spike | The detach-survival case on a live host; reported as a skip with its reason where no live host is available |

Success criteria this feature carries:

| Criterion | Measure |
|---|---|
| **A run survives closing the host session and status re-attaches** | After the host session ends the runtime root lives and its log fills; a new session's `status` shows the run. Proven by the spike on Linux; macOS `unverified` until a runner exists |
| One run per workspace | In the contention test every round has exactly one winner |
| A moved working tree is not silently restarted | A launch on a tree with ticked phases and no approval records is refused and names `adopt` |

#### 9. Constitution principles that bind it

I, XVI, XVII, VI, XII.

#### 10. Research that supports it

R15 (F-01, F-04, F-05, A-5, A-7), R15v (A-7, D-1 to D-8, P-2, P-3, P-6, P-13, P-14), R2, R2v, R3, R3v, R4, R11 (T-26, T-27, T-29), R14, R16 (F8), R29v (V-12).

#### 11. Constraints

Owner-set constraints, for the spec's `## Constraints` section:

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| No native module; nothing compiles at install | Decision 19; DP-005 |
| Host and runtime coordinate only through files; no pipe or socket that the host must keep | Decision 5; Principle I |

**What belongs in `plan.md` instead:** libraries and their versions, the package and file layout, physical paths behind logical names, the test runner, bundling, and the spelling of internal functions. `spec.md` describes behaviour and names none of them. For this feature also: what gives kernel-backed liveness.

---

### 108-reverse

Directory: `specs/108-reverse`. Tier 2. Estimated requirements: 52, in two groups; a split is expected
(section B.3).

#### 1. Scope

**In scope.** `specstride-reverse` as a capability of the CLI: the wrapper and its refusals, output
naming, the plan, the driver spec that the gated loop runs, the dry run; the source inventory with its
fingerprint and manifests; the reverse guard against the baseline inventory; the reverse lint with its
finding codes per level; the Spec Kit templates that reverse ships; the run request of kind `engine`
through which reverse runs detached.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| The gated loop that runs the driver spec | 101, 103 |
| The host skill text and its token budget | 113 |
| The detached start | 122; the run request kind is owned by 123 |
| The hashing primitive | 104 |
| Spec-format parsing of the produced feature | 104 |

#### 2. As-is requirements received

| As-is id | Behaviour (short) | Disposition | Proof |
|---|---|---|---|
| 028 FR-025 | Reverse output naming and refusals | ported | Parity, FX-30 |
| 028 FR-026 | Reverse guard against the baseline inventory | ported | Parity, FX-30 |
| 028 FR-027 | Reverse lint per level | ported | Parity, FX-30 |
| 028 SC-006 | A reverse run changes nothing outside its output and its state | ported | Parity, FX-30 |

Behaviour inventory received, as assigned in `traceability-items.tsv` (the authority): **405 items in 28
clusters**.

| Source module | Clusters | Items | ported | translated | superseded-by |
|---|---|---|---|---|---|
| `reverse.py` | C-116 to C-123 | 264 | 229 | 34 | 1 |
| `reverse_inventory.py` | C-124 to C-131 | 104 | 65 | 38 | 1 |
| `specstride` | C-108 to C-111, C-114 to C-115 | 26 | 25 | 1 | 0 |
| `Spec Kit templates` | C-133 to C-137 | 10 | 10 | 0 | 0 |
| `README.md` | C-132 | 1 | 1 | 0 | 0 |
| **Total** | | **405** | **330** | **73** | **2** |

#### 3. Merge rule

Only 028 contributes. Lisa has a bundle profile only, which is deferred with spec bundles. The refusal
to write into the state directory maps to the new state roots. Reverse exits 3 for findings and for
invalid input alike; preserved.

#### 4. New requirements from research and owner decisions

| Subject | Source |
|---|---|
| `specstride-reverse` runs detached through a run request of kind `engine`, with the same lock, lease, relaunch and digest as a pipeline run | DP-077 |
| The skill accepts the optional comment, under the same rules as `specstride-run` | Decision 18 |
| Invocation to launch costs at most 7,000 tokens; command output is terse by default | Decision 16; DP-024 |
| The guard reads the working tree as a claim, as regular files without following links | SL-1; R11 T-30 |
| Stub counters and the control plane never count as a change of the source | R18 O-3 rule 1 |
| The micro-loop layer applies to a reverse run under the same rule as any run: only where the verification gate executes | IR-34; DP-064 |

#### 5. Contracts

| Depends on (feature 100) | Version |
|---|---|
| Run request of kind `engine` (annex F) | process model |
| EP-03 canonical spec model (the produced feature must parse) | `specstride.spec-format/1` |
| Canonical hasher | annex X |
| State layout | `specstride.layout/1` |
| CLI protocol, line grammar, exit codes 0, 2, 3 | protocol 1 |
| Closed family of lint finding codes | list of closed sets |

**Owns (content):** the reverse inventory format; the lint finding codes. No extension point.

#### 6. Divergence register rows and pending decisions

| Id | What the brief proceeds on |
|---|---|
| DV-006 | The state refusal is compared through the layout table |
| DP-077 (ruling 25) | Reverse uses the runtime root without a launch contract |
| DP-088 (ruling 15) | One feature with two requirement groups |

#### 7. Requirement groups and estimate

| Group | Content | Est. |
|---|---|---|
| **G-A, reverse run** | The wrapper and its refusals, output naming, plan, driver spec, dry run, reverse guard, the `engine` run request, the templates | 24 |
| **G-B, inventory and lint** | Source inventory, fingerprint, manifests; the lint with its finding codes per level | 28 |

Total: about 52. **If `speckit-specify` yields more than about 45, the feature is split along G-A and
G-B**: G-A stays `108-reverse`; G-B becomes `140-reverse-inventory-and-lint`. The guard stays with
G-A and cites the inventory format through the contract of feature 100.

#### 8. Tests required

| Kind | Content |
|---|---|
| Parity | FX-30 (plan, lint finding codes, guard; exit 3) |
| Own tests | A reverse run through the `engine` run request survives the end of the host session; the source tree is byte-identical before and after |
| Evals | The skill-trigger suite of `specstride-reverse` is owned by 113 |

Success criteria this feature carries:

| Criterion | Measure |
|---|---|
| The source is untouched | The fingerprint of the source tree is equal before and after every reverse fixture |
| Every finding has a code | No lint output line lacks a finding code from the closed family |

#### 9. Constitution principles that bind it

I, II, IV, XIII, XVIII, XIX.

#### 10. Research that supports it

R18 (Appendix A), R19, R15 (A-9), R15v (E-6), R2v (non-code assets), R17.

#### 11. Constraints

Owner-set constraints, for the spec's `## Constraints` section:

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| The skill is named `specstride-reverse` | Prompt section 0 |
| The shipped Spec Kit templates carry their MIT notice | R1; DP-015 |

**What belongs in `plan.md` instead:** libraries and their versions, the package and file layout, physical paths behind logical names, the test runner, bundling, and the spelling of internal functions. `spec.md` describes behaviour and names none of them.

---

### 109-harness-seam

Directory: `specs/109-harness-seam`. Tier 2. Estimated requirements: 35.

#### 1. Scope

**In scope.** The one open harness registry; the harness port with its two capability levels,
`proposer` and `completion`, the second in two forms (tool-less; read-only tools in an
operating-system sandbox); transports as a property of an adapter; the harness descriptor schema; the generic descriptor-driven harness
adapter for the kinds `cli`, `openai-chat` and `anthropic-messages`; the closed vocabulary of typed
failures; containment levels C0 to C3 as a capability; the config-home overlay and its scope; the
environment allow-list of every call; the proof of the critic's form for every critic call; recorded versions per
adapter; the conformance suite that every tested adapter and every descriptor passes.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| Finding harnesses, probing them, choosing proposer and critic | 124 |
| The tested adapters of Wave 1 | 125 (Claude), 130 (dsh), 131 (Codex), 134 (pi), 138 (prime). Each is specified against this seam in the same way |
| Stream readers, invocation identity and retention | 126 |
| Quota classification and what a quota class does | 127 |
| The terms gate and auth tiers as policy | 110 |
| Adapters for harnesses of later waves | Roadmap: 132, 133, 135, 136, 137, 139 |
| The Agent SDK transport of the Claude adapter | 125 |
| Hiding the proposer's files from a critic with read tools; the list of withheld paths | 117 |
| The place of each critic form in the critic order | 124 |

#### 2. As-is requirements received

| As-is id | Behaviour (short) | Disposition | Proof |
|---|---|---|---|
| 028 FR-021 | One backend registry; defaults for proposer and critic | translated | Parity through mapping: the registry with stub executables named after as-is commands, FX-26, FX-01 |
| 028 FR-028 | Config-home overlay declared in the registry entry; scope variable | translated | Parity through mapping; stubs run with overlay scope `none` on both sides |
| 028 SC-007 | No shipped registry entry declares an overlay; runs use the operator's real environment | superseded-by DV-002 | Register row DV-002: the overlay policy under tiered auth replaces it |

Behaviour inventory received, as assigned in `traceability-items.tsv` (the authority): **94 items in 21
clusters**.

| Source module | Clusters | Items | ported | translated | superseded-by |
|---|---|---|---|---|---|
| `backend_overlay.py` | C-026 to C-031 | 32 | 19 | 13 | 0 |
| `proposer.sh` | C-052, C-054, C-056 to C-058 | 25 | 8 | 13 | 4 |
| `critic.py` | C-060 to C-061, C-066 | 21 | 5 | 3 | 13 |
| `backends.py` | C-032 to C-035 | 12 | 1 | 9 | 2 |
| `orchestrator.sh` | C-007, C-009 | 3 | 1 | 2 | 0 |
| `specstride-lib.sh` | C-021 | 1 | 1 | 0 | 0 |
| **Total** | | **94** | **35** | **40** | **19** |

One registry entry of the baseline is a locally registered backend. Its behaviour is `superseded-by DV-064`: a
consumer declares such a harness in the open registry, and its name appears nowhere. The items that belong
to dsh, Codex and prime are in the adapter features 130 (66), 131 (8) and 138 (62) and are not in the table:
136 items in all, `ported` or `translated` in Wave 1 (owner ruling 32).

#### 3. Merge rule

| Case | Ruling |
|---|---|
| Registry | Decision 17 replaces 028's closed list, mixture-of-loops' onboarding list and Lisa's provider chains. 028's behaviour per registered entry is the parity side |
| Capability levels | Taken from Lisa's provider seam, which is sound and has no counterpart in 028; version pin, auth tier, quota signal, continuation and discovery are added |
| Completion clients | Lisa's two endpoint clients are extracted, with machine-specific names removed |
| Lisa's Agent SDK harness | Extracted in Wave 1 by 125, as an optional Tier 2 transport behind this port (owner ruling 20). The port sees one more transport of a tested adapter |
| Control flow that tests a harness name | Removed: the core sees only the port (DV-064) |
| Overlay | 028's overlay plumbing is kept; what it means under Tier 1 is DV-002 |

#### 4. New requirements from research and owner decisions

| Subject | Source |
|---|---|
| Operations `detect`, `capabilities`, `preflight`, `startPass`, `complete`, `stop`, `classify`, `betweenPasses`; every capability value carries its provenance (`declared`, `probed`, `adapter`, `catalogue`) or is `null` | EP-02; R20; R15v P-10 |
| Capability levels: `proposer` P1 to P6 and `completion` C1 to C6 | R20; EP-02 |
| Harness descriptor v1: how to detect, invoke headless, read the stream, authenticate, which roles; `kind` and `stream.format` are open sets; stream mapping as data, so that a new stream format needs no code; roles are an open registry | Decision 17; R20; R15v P-10 |
| A tested adapter is a descriptor plus optional code hooks, with a version range and a `verified-on` date | Decision 10; R20 |
| An unverified harness has no version pin, its capabilities are declared or probed, and it runs at Tier 1 or Tier 2 only; Tier 3 is not a valid value | Decisions 6, 17; DP-020 |
| **The level `completion` has two forms.** First form, tool-less: no tools by any route. Second form, **read-only tools**: a harness whose critic mode is a read-only operating-system sandbox; the critic runs in the working tree and may read project files by itself; it cannot write, cannot run a command that writes and cannot reach the network. The second form is open to a tested adapter only. It is a stated exception to Principles III and IX, limited to reading project files | Rulings 57, 57a, D1; DV-081 |
| **Proof per form.** First form: the critic is refused unless the initial record shows an empty tool list and the minted session id. For a harness whose stream has no initial record the proof is by pinned configuration: an exact version pin together with the adapter's preflight, open to a tested adapter only, and stated as the weaker proof. Second form: the call record shows the read-only sandbox mode, the network off, and the adapter's confirmation that the withheld paths cannot be read. Anything else is `critic_not_toolless`, a critic configuration error that halts the run | EP-02; Principle IX; R5; R9 F11, F12; R6 |
| A transport is a property of an adapter. One adapter may offer several (a subprocess, an SDK in process, a direct call), each with its own auth tier and terms row. A transport whose optional dependency is absent is unavailable, with a doctor line; the adapter's other transports are unaffected | Rulings 20, 70 |
| Capabilities `concurrentSessions` (several processes at once under one configuration home and one login, with separate session stores) and process-level spending limit. Each is declared by a tested adapter with its provenance and is `null` otherwise | R29 PU-40; R29v PU-88 |
| **Containment levels.** C0: none, the harness runs with all tools as the consumer. C1: a restriction at tool level that the harness enforces. C2: an operating-system sandbox for commands, the network off or allow-listed, the control plane and credential paths denied. C3: the whole run inside a container or a virtual machine, supplied by the consumer and detected | R11 R-2 |
| Each adapter declares the highest level it can enforce, its **ceiling**, with provenance; a ceiling that no run has shown is `unverified`. The strongest level available is the default; C0 only by opt-in in user configuration, and a proposer whose ceiling is C0 is refused at launch without that opt-in; the runtime never asserts a sandbox by itself; every run records its level, and `protection=detect` at C0 and C1. The ceilings of the Wave 1 adapters are in their briefs | R11 R-2; rulings 34, 38; DP-008; C-27 |
| The harness's own telemetry is switched off for every launched process where the descriptor names the switch | R9 F17; R14 rule 7 |
| The environment of every call is an allow-list; a harness does not inherit the consumer's other provider keys | R11 T-34; R20 |
| A harness binary inside the workspace or shadowing a known one on the search path is refused | R11 T-15 |
| An endpoint is bound to its secret's host; redirects are refused | R11 T-16; EP-10 |
| Harness-native memory: the descriptor declares whether the harness has it and how to switch it off; a harness that cannot switch it off does not qualify as a critic | R12; DP-017 |
| Optional `tiers` and `session.*` fields in the descriptor | R27; R26 |
| A widening entry (harness declaration, endpoint, secret reference) is accepted from user scope, environment or flags only | DP-009; C-24 |
| A small set of bundled descriptors ships as data | R20 |

#### 5. Contracts

| Depends on (feature 100) | Version |
|---|---|
| EP-02 harness port and harness descriptor | `specstride.harness/1`, `descriptorVersion: 1` |
| EP-10 secret resolver; EP-11 terms-gate data | `specstride.secret-resolver/1`, `specstride.terms/1` |
| EP-12 quota classifier (the `failures` map of a descriptor) | `specstride.quota-classifier/1` |
| Containment levels; overlay schema | annex C; `specstride-overlay/v1` |
| Config envelope and trust classes | `specstride.config/1` |
| Event envelope | `specstride.event/1` |
| EP-14 doctor check registry (an adapter registers its `bin`, `auth`, `version` checks) | `specstride.doctor/1` |

**Owns (content):** EP-02 (registry, port, generic adapter, conformance suite), the harness descriptor
schema, the two forms of the `completion` level, containment levels, the overlay schema.

#### 6. Divergence register rows and pending decisions

| Id | What the brief proceeds on |
|---|---|
| DV-064 | One open registry; fixtures use stub executables named after as-is commands and one generic name |
| DV-002, DP-012 (ruling 36) | Tier 1 uses the consumer's real config home with customisations off, never written by the run; Tier 2 uses a throwaway home |
| DV-030, DP-008 (ruling 34) | Containment default C2 where offered, else C1; set to today's behaviour under the `parity` profile |
| DV-047, DP-017 (ruling 37) | Native memory off for the critic always, off by default for the proposer, recorded |
| DV-081, DP-001 (rulings 57, 57a) | A read-only operating-system sandbox is accepted as the second form of the `completion` level. The exception to Principles III and IX is limited to reading project files |
| DP-009 (ruling 35) | Project configuration never widens |
| DP-079 (ruling 20), DP-021 (ruling 70) | The Agent SDK harness is extracted by 125 as an optional Tier 2 transport, with API keys only; an optional dependency, never bundled |
| DP-083 (rulings 32, 32a, 32b) | The items of dsh, Codex and prime are Wave 1 parity items, in 130, 131 and 138 |
| **Point for the orchestrator** | The proof by pinned configuration is new in this brief. It exists because a harness with a text stream emits no initial record (brief 130) |
| DP-016 (ruling 58) | A harness that cannot continue a session carries context through files |

#### 7. Requirement groups and estimate

| Group | Content | Est. |
|---|---|---|
| G1 | Registry, port operations, capability levels, transports, typed failures | 12 |
| G2 | Harness descriptor and the generic adapter, three kinds | 9 |
| G3 | Containment levels and ceilings, overlay, environment allow-list, the two forms of the critic and their proofs | 11 |
| G4 | Recorded versions and the conformance suite | 3 |

Total: about 35.

#### 8. Tests required

| Kind | Content |
|---|---|
| Parity | FX-26 (invocation through the seam), FX-01 and FX-02 transcripts (argument lists and environment variable names the stubs saw) |
| Characterization | Lisa's provider seam and completion clients as extracted |
| Conformance | The adapter conformance suite: a fake binary and a fake endpoint assert argument list, stdin, environment and clean-up. **Descriptor-only fixture**: a descriptor for a fake CLI and one for a fake endpoint, both in the test tree, complete a run as proposer and as critic with no product file changed. **Second form**: a fake binary that declares a read-only sandbox passes with the confirmation of the read denial and is refused without it; a write attempt and a network attempt are recorded as refused |

Success criteria this feature carries:

| Criterion | Measure |
|---|---|
| **A harness the product has no tested adapter for completes a run as critic from a descriptor alone** | The descriptor-only fixture passes with no product file changed. Discovery of that harness is measured in 124 and its display as unverified in 112 |
| The core names no harness | The import-boundary check and a text search find no harness name in the core |
| No critic can act | Every critic call record shows an empty tool list, or the read-only sandbox with the network off and the read denial confirmed |

#### 9. Constitution principles that bind it

VII, VI, VIII, IX, X, XII.

#### 10. Research that supports it

R20, R5, R1, R1v, R11 (T-07, T-13 to T-17, T-34, R-2), R8, R8v, R6, R7, R9, R10, R15 (EP-02), R15v (A-3, A-4, B-3), R29 (PU-40), R29v (PU-88, open questions 1 and 2).

#### 11. Constraints

Owner-set constraints, for the spec's `## Constraints` section:

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| The seam is designed for every harness; the named harnesses are a starting point and not a boundary | Decisions 13, 17 |
| The product never installs, vendors or downloads a harness | Constitution, additional constraints |

**What belongs in `plan.md` instead:** libraries and their versions, the package and file layout, physical paths behind logical names, the test runner, bundling, and the spelling of internal functions. `spec.md` describes behaviour and names none of them.

---

### 124-harness-discovery-and-roles

Directory: `specs/124-harness-discovery-and-roles`. Tier 2. Estimated requirements: 32.

#### 1. Scope

**In scope.** Harness discovery from its sources; what discovery may execute, read and send; the probe
ladder; the states of a discovered harness and promotion by `harness verify`; the resolved registry
written at launch with provenance; role resolution into a plan per phase and role with the fallbacks
the consumer opted into; the critic order; qualification and ranking of critic candidates; the
automatic pick of a diverse critic, its announcement and its switch; the same-model warning; the
guarantee about the proposer.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| The registry, the port, the descriptor schema, the generic adapter, the two forms of the `completion` level | 109 |
| What a critic with read-only tools is given and what is hidden from it | 117 |
| Whether a harness offers a critic form, and its proof | Its adapter: 125, 130, 131, 134, 138 |
| Evaluation of the terms gate | 110; role resolution calls it |
| What happens when a fallback is used during a run | 127 |
| Display of the registry and of the pick by the doctor | 112 |
| Model-tier escalation inside a phase attempt | 115 (it never changes a role) |

#### 2. As-is requirements received

None. Discovery and role resolution have no as-is behaviour. The baseline's default roles
(028 FR-021, owned by 109) and Lisa's launch defaults (002 FR-006, owned by 110) are the behaviour
this feature replaces.

Behaviour inventory received, as assigned in `traceability-items.tsv` (the authority): **13 items in 10
clusters**.

| Source module | Clusters | Items | ported | translated | superseded-by |
|---|---|---|---|---|---|
| `orchestrator.sh` | C-006 to C-007, C-012 | 5 | 1 | 0 | 4 |
| `proposer.sh` | C-051 to C-052, C-054, C-057 | 5 | 1 | 2 | 2 |
| `critic.py` | C-060 to C-061, C-066 | 3 | 0 | 3 | 0 |
| **Total** | | **13** | **2** | **5** | **6** |

These are the items on the default roles, which this feature replaces (DV-004), and on how the harness of a
role is named.

#### 3. Merge rule

Not applicable: no system contributes. Decision 13 rules the default roles (C-02): Claude as proposer
and as critic, on different model tiers.

#### 4. New requirements from research and owner decisions

| Subject | Source |
|---|---|
| Seven sources: tested adapters that detect their own harness; binaries named by a descriptor; known config homes by existence only; host-registered agents and servers by name, informational; endpoints by the presence of a credential variable; gateways; consumer-declared entries | R20 S1 to S7; decision 17 |
| Discovery executes only what a descriptor names, reads presence and never values, makes GET requests only, never opens a credential store, and changes nothing | R20; decision 17 |
| A credential may be sent to a free models endpoint with a GET, redirects refused | DP-026 |
| Bounded probes: stdin closed, a time limit, capped output, in parallel | R20; R16 F2 |
| States of a discovered harness: `tested`, and `unverified` with the sub-states detected, declared and locally verified; promotion to locally verified by an opt-in, budget-capped `harness verify`; to `tested` only through a shipped adapter | R20 |
| One resolved registry per launch, stored with the provenance of each value and replayed on resume | R20; EP-02 |
| **Guarantee:** the proposer comes from flag, environment, configuration or the shipped default only; discovery never changes it; an absent proposer refuses the launch and names the discovered candidates | Decision 17; R15v B-3 |
| Discovery never overrides a critic the consumer configured | Decision 17 |
| Critic order: the configured critic; then a second model through the host gateway; then a qualifying discovered harness, tested before unverified; then Claude on a different model tier | Decisions 7, 17 |
| Qualification: a known context window; one of the two forms of the `completion` level (tool-less, or read-only tools in an operating-system sandbox); a different provider or model from the proposer. An unverified `cli` harness is never picked automatically; an unverified endpoint may be | Decision 17; R20; DP-025; ruling 57 |
| **The critic with read-only tools in the critic order.** A tested adapter whose critic is the second form qualifies as a critic, also on a subscription, and stands in the third step of the order (a qualifying discovered harness, tested before unverified). Inside that step a tool-less candidate ranks before a candidate with read-only tools. An unverified harness never qualifies through the second form | Rulings 57, 57a; decision 17; section 6, point 1 |
| A candidate of the second form is passed over, and the next of the order is used, announced and recorded, when its adapter cannot confirm the read denial of the withheld paths, or when the worker root of parallel units is not empty after one sweep | Ruling D1; R29v PU-91 |
| A harness whose terms are unknown is never picked automatically, as a critic or as a fallback | R8 F-P4; ruling 60; section 6, point 2 |
| The pick is announced at launch, recorded in events (`critic.selected`) and in the digest, shown by the doctor, and can be turned off | Decision 17; EV-28 |
| An automatically picked metered critic has a mandatory hard cap on its spend, announced at launch | DP-025 |
| Same-model setups raise a warning that never blocks a run | Decision 7 |
| The resolved model of every critic-class call is compared, at launch and before each call, with the models that produced passes in the phase attempt | IR-47 |
| Role resolution runs at launch and produces a plan per phase and role; each fallback is gated again by the terms gate when used; no loop and no router calls role resolution | LR-8; R15v P-11; decision 20 |
| A provider with no terms row is unknown terms: Tier 1 and Tier 2 only, with a doctor warning | Decision 17 |
| A harness that claims to be a tool-less critic on another provider is believed only as far as the initial record of its first call proves | R11 T-14 |

#### 5. Contracts

| Depends on (feature 100) | Version |
|---|---|
| EP-02 harness port (`detect`, `capabilities`, `preflight`) and harness descriptor | `specstride.harness/1`, `descriptorVersion: 1` |
| Resolved registry and role plan | `specstride.registry/1` |
| EP-11 terms-gate data | `specstride.terms/1` |
| EP-10 secret resolver (`exists`) | `specstride.secret-resolver/1` |
| Config envelope and trust classes | `specstride.config/1` |
| Table evaluator (ranking as a table) | `specstride.table/1` |
| Event envelope | `specstride.event/1` |
| CLI protocol (the launch announcement and the digest field) | protocol 1 |

**Owns (content):** the resolved registry and role plan; role resolution, which is the sub-point of
EP-02 named in feature 100.

#### 6. Divergence register rows and pending decisions

| Id | What the brief proceeds on |
|---|---|
| DV-049, DP-025 (ruling 60) | Automatic pick with a mandatory spend cap; not observable in the oracle, since every fixture names the critic |
| DV-004 | Wave 1 default roles; one fixture waived |
| DV-048 | The terms gate applies to every resolved role |
| DP-026 (ruling 61) | Credential sent to a free models endpoint, GET only |
| DP-027 (ruling 61) | The worked example is read as any agent or endpoint without a tested adapter |
| DV-081, DP-001 (rulings 57, 57a) | A harness whose critic mode is a read-only operating-system sandbox qualifies, with the proposer's files hidden from it. Any other critic mode with tools does not |
| **Point 1, candidate for `CLARIFY-QUEUE.md`** | Ruling 57 says that such a critic "enters the critic order of decision 17" and not where. Recommended answer: the third step, after tool-less candidates of that step. If ruled otherwise only the ranking table changes |
| **Point 2, candidate for `CLARIFY-QUEUE.md`** | Whether a harness with unknown terms may be picked automatically. Recommended answer: never. It is the question of briefs 130 and 138 seen from the critic order |
| DP-052 (ruling 49) | A higher effort on the critic's model is not a collision; it warns |
| DP-009 (ruling 35) | Entries from project scope are ignored |

#### 7. Requirement groups and estimate

| Group | Content | Est. |
|---|---|---|
| G1 | Sources and the safety rules of discovery | 9 |
| G2 | Probe ladder, states, promotion | 6 |
| G3 | Role resolution, the plan, fallbacks, the proposer guarantee | 7 |
| G4 | Critic order, the place of both critic forms, qualification, automatic pick, announcement, warnings | 10 |

Total: about 32.

#### 8. Tests required

| Kind | Content |
|---|---|
| Parity | None; one waived fixture for the default roles |
| Own tests | Table tests of the critic order and ranking, with candidates of both forms and with a candidate whose read denial is not confirmed; discovery with planted credential files asserts that none was opened; a redirect from a models endpoint is refused; a project-scope harness entry is ignored with a message |
| Conformance | The descriptor-only fixture of 109, extended: the fake endpoint is discovered and picked as the diverse critic when none is configured |

Success criteria this feature carries:

| Criterion | Measure |
|---|---|
| **With no critic configured, a qualifying discovered harness is picked as the diverse critic and the pick appears in the digest** | The extended descriptor-only fixture: the announcement line at launch, the `critic.selected` event and the digest field name the picked harness |
| A harness without a tested adapter is discovered | The fixture's fake harness appears in the resolved registry as `unverified` |
| Discovery reads nothing secret and changes nothing | File-access tracing on the discovery fixture shows no read of a credential store and no write |
| The critic-diversity rule and its warning | In a same-model setup the warning is raised, recorded, and the launch proceeds |

#### 9. Constitution principles that bind it

VII, II, IX, XII, XIII, X.

#### 10. Research that supports it

R20, R5, R6, R8, R8v, R11 (T-13 to T-16), R16, R14, R25 (role choice is not routing), R23v (V-13), R15v (B-3, B-4), R29v (PU-91).

#### 11. Constraints

Owner-set constraints, for the spec's `## Constraints` section:

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| Choosing the proposer and the critic is not a routing question | Decision 20 |
| The Wave 1 default is Claude as proposer and as critic; the other tested adapters of Wave 1 are chosen by the consumer or by the critic order | Decision 13; rulings 32b, 57 |

**What belongs in `plan.md` instead:** libraries and their versions, the package and file layout, physical paths behind logical names, the test runner, bundling, and the spelling of internal functions. `spec.md` describes behaviour and names none of them.

---

### 125-adapter-claude

Directory: `specs/125-adapter-claude`. Tier 2. Estimated requirements: 31.

#### 1. Scope

**In scope.** The Claude harness adapter, specified against the seam of 109 exactly as the adapters
130, 131, 134 and 138 are: a descriptor, optional code hooks and recorded fixtures. Two transports:
the installed CLI as a subprocess, which is the default, and **the Agent SDK as a second, optional
transport for Tier 2, with API keys only**, extracted from Lisa. Detection and version; the proposer invocation, headless, with a streamed output and the
prompt on stdin; the session directive (a minted session per phase attempt, continuation by id for
later passes); isolation of a Tier 1 pass in the consumer's real config home with customisations off;
the permission mode; the tool-less critic at Tier 1 (the installed CLI) and at Tier 2 (a direct call
with an API key), with a different model tier, a fresh session and a budget; the proof read from the
initial record; Claude's quota signals and usage figures; the model tier ladder; the version range
with its `verified-on` date; the adapter's doctor checks.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| The port and the generic adapter | 109 |
| The stream reader for Claude's stream format | 126 |
| A critic through the host model gateway | 124 (discovery entry), 109 (generic endpoint client) |
| What a quota class does to the run | 127 |
| Claude Code as a **host** | 113. This feature is about Claude as a **harness** |

#### 2. As-is requirements received

None as a requirement. 028 states nothing about a single harness's invocation.

Behaviour inventory received, as assigned in `traceability-items.tsv` (the authority): **16 items in 5
clusters**.

| Source module | Clusters | Items | ported | translated | superseded-by |
|---|---|---|---|---|---|
| `proposer.sh` | C-052, C-056, C-058 | 9 | 2 | 7 | 0 |
| `critic.py` | C-061, C-066 | 7 | 1 | 6 | 0 |
| **Total** | | **16** | **3** | **13** | **0** |

The Agent SDK transport has no as-is origin in the traceability files: 002 has no requirement and no
success criterion for Lisa's `agents` package (`traceability.md` section 5, item 15). What is kept of
Lisa's harness gets characterization tests `CT-125-n`, written from Lisa's code at `363e6a3`.

#### 3. Merge rule

| Case | Ruling |
|---|---|
| 028 | Its Claude invocation is the parity side, compared through the argument-list table of the stub transcripts |
| Lisa | Its Agent SDK harness (`agents/claude-agent-sdk/harness.ts`) and its stream tap (`tap.ts`) are **extracted as source** from local `main` (`363e6a3`) and become the second transport (owner ruling 20). Kept as they are: usage from the provider's own accounting; failure kinds with structured codes before text; the mapping of harness events by the tap, whose failure never breaks the loop. Brought to the behaviour of the seam **before** the characterization tests are written: the permission mode (Lisa bypasses prompts by default), the session directive (Lisa's request has no session field), the end of a pass (Lisa polls for the phase evidence file), the retry (Lisa allows one transient retry) |
| Critic transport | 028 reaches the critic by direct HTTP; at Tier 1 the default becomes the installed CLI with no tools (DV-001) |

#### 4. New requirements from research and owner decisions

| Subject | Source |
|---|---|
| One adapter with two transports. The default is the installed CLI as a subprocess, with the prompt on stdin. The second is the Agent SDK in process, optional | R5; rulings 20, 70 |
| **The SDK transport is Tier 2 only and authenticates with API keys only**, from a secret reference. It never uses a subscription login, a login token of the CLI or a credential of the consumer's config home. Subscription use is possible only through the `claude` subprocess. Selecting the SDK transport under Tier 1 is a configuration error | Ruling 70; DP-021; R8v; R5 F4 |
| **The SDK is an optional dependency, never bundled.** It is proprietary. It is not in the published package, not vendored and not installed by the product. The adapter loads it from the consumer's installation at run time. When it is absent the transport is unavailable, the doctor says so, and the subprocess transport is unaffected | Rulings 20, 70; R1 F8, O3; decision 19 |
| The terms row of the SDK applies, and the terms gate evaluates it for the transport in use | Ruling 20; EP-11 |
| The transport is chosen by the consumer in user scope. It is never chosen automatically, and it is not used under the `parity` profile | Rulings 20, 35; LR-10 |
| Both transports give the same normalized records, the same call record, the same session directive, the same permission mode, the same isolation and the same proof of the critic's form. The adapter conformance suite runs on both | EP-02; R5 Q1 (the SDK runs the same engine) |
| The SDK has its own version range and `verified-on` date, fixed when the specification is written. Research read two versions of it, and a session interface of it was removed inside the 0.3 line | Decision 10; R1 F8; R5 F3, F37 |
| The capability `concurrentSessions` is declared only after a capture has shown that several headless processes may run under one configuration home and one login. Until then it is `unverified` and parallel units are off for this harness at Tier 1 | R29 PU-40, open question 12; ruling P2 |
| Containment ceiling: C2 where the platform offers the sandbox for shell commands, C1 otherwise. Whether the sandbox confines the harness's own file tools to a write root other than the workspace is `unverified` and is captured before the specification freezes | R11 R-2; R29v open question 2; ruling P2 |
| The adapter states its mode on every call and never relies on a default | R5 |
| Proposer: a session id per phase attempt; continuation by id for later passes, never "continue the latest"; a relaunch, a watchdog kill, a second repair and an escalation start fresh | Decision 22; R5; R24; DP-036 |
| Isolation at Tier 1: the consumer's config home, with plugins, host hooks, skills, servers and auto memory off, never written by the run; session state lives per phase attempt and is removed with it | DP-012, DP-038; R5 |
| Managed policy settings still apply in the isolated mode; the adapter's assertions on the initial record are the backstop | R3v C5 |
| Permission mode: accept edits with an allow list and no prompts; bypass only where the doctor detects a sandbox and a user other than root | DP-011; R5 |
| Critic: tool-less, budget-capped, on a different model tier, fresh every time; refused unless the initial record shows an empty tool list and the minted session id | Decision 7; R5 Q2; Principle IX |
| A Tier 1 child must not load the host plugin's own hooks | R3 |
| Quota signals: the structured limit event, the transient retry error, the credit error; overload is not quota; `resetsAt` where given | R14; EP-12 |
| Usage per model call as increments; the reported dollar figure under a subscription is notional | EV-03, EV-17, EV-24; DP-030 |
| Tier ladder and effort levels declared for escalation | R25; DP-031 |
| Version range and `verified-on`; the doctor warns outside the range | Decision 10 |
| Cache-stable prompt start; whether the harness's git snapshot stays in context waits for X4 | R27 D1.10 |
| One probe per role confirms the flag combination before release, and is logged | `architecture.md` section 18, risk 8 |

#### 5. Contracts

| Depends on (feature 100) | Version |
|---|---|
| EP-02 harness port and harness descriptor | `specstride.harness/1`, `descriptorVersion: 1` |
| EP-12 quota classifier | `specstride.quota-classifier/1` |
| EP-10 secret resolver; EP-11 terms-gate data | `specstride.secret-resolver/1`, `specstride.terms/1` |
| EP-14 doctor check registry | `specstride.doctor/1` |
| Containment levels; overlay schema | annex C |
| Event envelope (usage, quota signal) | `specstride.event/1` |

**Owns (content):** the Claude descriptor, its code hooks, its classifier and its recorded fixtures. No
extension point; it is the first implementation of EP-02 and of EP-12.

#### 6. Divergence register rows and pending decisions

| Id | What the brief proceeds on |
|---|---|
| DV-001 | Tier 1 critic through the CLI; not observable, the transcript is compared in a transport-neutral form |
| DV-031, DP-011 (ruling 34) | Accept-edits mode; the argument list is mapped through a per-harness table, or off with DV-030 |
| DV-002, DP-012 (ruling 36), DP-038 (ruling 36) | Real config home, customisations off, session state per phase attempt |
| DV-010, DP-035 (ruling 7) | Continuation off under the `parity` profile; the comparator asserts that no invocation carried a continuation argument |
| DV-047, DP-017 (ruling 37) | Native memory off |
| DP-021 (ruling 70), DP-042 (ruling 1) | Subscription use only through the CLI the consumer installed and logged in; for the audience `distributed` Tier 2 is the default |
| DP-030 (ruling 66) | Notional cost |
| DP-079 (ruling 20), DP-021 (ruling 70) | The Agent SDK harness is extracted as an optional Tier 2 transport, with API keys only; an optional dependency, never bundled. No register row: no as-is requirement describes it |
| DP-083 (rulings 32, 32a, 32b) | The adapters of dsh, Codex, pi and prime are specified against the seam in the same way |

#### 7. Requirement groups and estimate

| Group | Content | Est. |
|---|---|---|
| G1 | Detection, version, descriptor, doctor checks | 5 |
| G2 | Proposer: invocation, session, isolation, permission mode | 9 |
| G3 | Critic: both tiers, tool-less proof, budget | 6 |
| G4 | Quota signals, usage, tier ladder | 5 |
| G5 | The Agent SDK transport: choice, auth, the optional dependency, equality with the subprocess transport | 6 |

Total: about 31.

#### 8. Tests required

| Kind | Content |
|---|---|
| Parity | Every fixture that names this harness, through the stub executable: argument list, stdin and environment names in the transcript (FX-01, FX-02, FX-26) |
| Characterization | Lisa's Agent SDK harness and stream tap as extracted: `CT-125-n` |
| Conformance | The adapter conformance suite of 109, on both transports; recorded streams replayed; classifier fixtures with a captured limit event |
| Own tests | With the SDK absent the transport is unavailable, the doctor names it and a run on the subprocess transport is unchanged; the SDK transport chosen under Tier 1 is refused; the SDK transport with a subscription credential in the environment does not use it; the published package holds no file of the SDK |
| Fixture captures before the specification freezes | Concurrent sessions under one configuration home; the write root of the harness's own file tools under the sandbox; the limit event on the CLI stream |
| Live | One logged probe per role; no other paid call |

Success criteria this feature carries:

| Criterion | Measure |
|---|---|
| The critic never shares the proposer's session | No critic call record carries a session id that a pass used |
| Provider and host facts are dated | Every fact about the harness in the specification carries a `verified-on` date and a version pin |
| The consumer's configuration is never written | The config home is byte-identical before and after a run |
| The SDK is never bundled | The published package, and everything it installs, holds no file of the SDK; checked in CI |
| No subscription through the SDK | No call of the SDK transport carries a credential other than the API key of its secret reference |

#### 9. Constitution principles that bind it

VIII, IX, X, XII, XI, VII.

#### 10. Research that supports it

R5, R3, R3v, R8, R8v, R14, R24, R25, R12, R11 (T-07, T-34), R1 (the `agents` package, F8, O3), R1v.

#### 11. Constraints

Owner-set constraints, for the spec's `## Constraints` section:

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| Claude is the default proposer and critic of Wave 1 | Decision 13 |
| The Agent SDK is an optional dependency, never bundled, and authenticates with API keys only | Rulings 20, 70 |
| Tier 1, the installed CLI under the user's own login, is the default for the audience `personal` | Decision 6; DP-042 |

**What belongs in `plan.md` instead:** libraries and their versions, the package and file layout, physical paths behind logical names, the test runner, bundling, and the spelling of internal functions. `spec.md` describes behaviour and names none of them. For this feature also: the exact flags of the harness, with their version pin; how the optional dependency is declared and loaded.

---

### 130-adapter-dsh

Directory: `specs/130-adapter-dsh`. Tier 2. Estimated requirements: 33.

#### 1. Scope

**In scope.** The dsh harness adapter, specified against the seam of 109 exactly as 125-adapter-claude
is: a harness descriptor, optional code hooks and recorded fixtures. Detection and version, with an
exact version pin; the proposer invocation, headless, with the prompt as one argument and a text
reply; model selection through a throwaway settings overlay of the harness's home; the permission
mode; the fact that a pass can never continue a session, so that context is carried by files; the
critic, made tool-less by a deny list of tool ids in a patch file together with the read-only
permission mode; the proof of that critic mode, which for a text stream cannot come from an initial
record; the dsh plugin request protocol of the baseline; quota and error signals on stderr and stdout;
usage, which the harness does not report; the harness's own telemetry, switched off; the tier and
terms row; the containment ceiling; the adapter's doctor checks; the facts that need a fixture capture
before the specification freezes.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| The port, the descriptor schema, the generic adapter, the overlay schema, containment levels | 109 |
| The registry of stream readers and the synthesis of `init` and `terminal` for a text stream | 126. This feature supplies the dsh mapping and its fixtures |
| What a quota class does to the run | 127 |
| The pass loop, its breakers and the order of prompt blocks in general | 103. This feature owns only the dsh variant of each (section 2, last note) |
| The terms gate as policy, the audience, config keys and the alias table | 110. This feature supplies its rows and key names |
| Discovery and the critic order | 124 |
| dsh as a **host** | 120, Wave 2. This feature is about dsh as a **harness** |
| Span export of the harness's own trace plugin | Not shipped. The adapter exports the trace parent to the process and nothing more |

#### 2. As-is requirements received

None as a requirement. 028 FR-021 (owned by 109) states the registry; the entry of this harness is
item B-0426 here.

Behaviour inventory received, as assigned in `traceability-items.tsv` (the authority): **66 items in 14
clusters**. All 66 are parity items (owner ruling 32).

| Source module | Clusters | Items | ported | translated | superseded-by |
|---|---|---|---|---|---|
| `proposer.sh` | C-052 to C-054, C-056 to C-058 | 36 | 12 | 24 | 0 |
| `critic.py` | C-061, C-066 | 18 | 8 | 10 | 0 |
| `dsh_plugin_requests.py` | C-036 to C-040 | 11 | 7 | 4 | 0 |
| `backends.py` | C-035 | 1 | 1 | 0 | 0 |
| **Total** | | **66** | **28** | **38** | **0** |

What the items say, by subject, so that the brief can be read alone:

| Subject | Items | As-is behaviour (short) | Proof |
|---|---|---|---|
| Registry entry | B-0426 | Serves proposer and critic, each with an optional qualifier `provider/model`; no stream format and no overlay declared | Parity, FX-26; `PT-130-C-035-*` |
| Proposer invocation | B-0688, B-0513, B-0514, B-0516 | `<bin> --profile <profile> <prompt>`: the whole prompt is one positional argument; no allow-all flag; the permission mode is an environment variable, default `workspace-write`; profile default `headless` | Parity, FX-01, FX-26; `PT-130-C-058-*`, `PT-130-C-052-*` |
| Model selection | B-0508, B-0515, B-0676 to B-0679, B-0686, B-0687 | Precedence: `--model`, then the model variable, then the qualifier; with none, the profile's own settings decide and no overlay is built; a bare model id needs a provider; conflicting providers, an unresolvable provider and an invalid reference fail the pass; qualifier and `--model` together are refused | Parity, FX-18, FX-26 |
| Settings overlay | B-0509, B-0510, B-0621, B-0624, B-0642 | With a model override a throwaway home is built per pass: every entry of the real home is linked in except the settings file, which is written new with the chosen model and the optional reasoning effort; removed after the pass; a failure to build it fails the pass with one stderr line | Parity through mapping (DV-006, DV-066), FX-18, FX-26. No fixture family declares an overlay today (section 8) |
| Executable not found | B-0571 | The pass returns 127 | Parity through the result record (LR-6), FX-18 |
| Critic invocation | B-0988, B-0987, B-0826, B-0820, B-0821, B-0990 | `<bin> --profile <profile> --patch <file> -- <task arguments>`, working directory set, stdout is the reply; the patch disables 18 model-facing tools by id; the permission mode `read-only` is exported to every critic call; a non-zero exit or an empty reply is an error carrying the first 300 characters of stderr, or of stdout when stderr is empty | Parity, FX-01, FX-06, FX-07; `PT-130-C-066-*`, `PT-130-C-061-*` |
| Critic prompt as arguments | B-0983 | The prompt is split only at spaces into chunks of at most 120 KiB; no chunk may start with `-`; a single token over the limit is an error | Parity, FX-06, FX-07 |
| Critic model and overlay | B-0817 to B-0819, B-0822 to B-0825, B-0985, B-0986 | The critic has its own model, provider and reasoning-effort settings with the proposer's as fallbacks, the same reference rules and the same throwaway overlay | Parity through the alias table (DV-027), FX-01, FX-06, FX-07 |
| Critic context window | B-0912 | Looked up by the part of the model reference after the last `/`; the bare harness name looks up an empty model and gets the default of 98,304 tokens | Parity, FX-25 |
| Bare model ids | B-0677, B-0984 | A table maps some bare model ids to a provider | Parity, FX-01, FX-06, FX-26. One target of the table is specific to the owner's machines: the specification decides whether the table ships or becomes user configuration, and names no such target |
| Plugin request protocol, the processor | B-0433 to B-0443 | Flags and their variables; exit 2 on any request error and 0 with a JSON result; with no request file the result is `{"plugins": [], "status": "none"}`; the request is a regular file, no link, at most 16,384 bytes; exactly the keys `contract`, `plugins`, `reason`; 1 to 8 unique exact `package@semver` entries; a reason of at most 2,048 bytes; every entry must be in the allowlist literally; the installer runs as a fixed argument list with a time limit; installs are serialised by an exclusive lock; a receipt is written | Parity, FX-17, FX-18; `PT-130-C-036-*` to `PT-130-C-040-*`. No fixture family exercises a request today (section 8) |
| Plugin request protocol, in the pass loop | B-0536, B-0542, B-0551 to B-0553, B-0585 to B-0587, B-0618, B-0619, B-0650, B-0653, B-0654, B-0757, B-0768, B-0769 | Enabled only by a non-empty allowlist and only for the bare harness name, never with a qualifier; the prompt gains a protocol section; a request is handled **before** the evidence check; after an install the pass is restarted with a fresh profile; such a pass is exempt from every breaker and from the short-pass counter; exit 7 when a request exists and the allowlist is empty, or the request is invalid, denied, timed out or the installer fails; exit 4 when the install happened on the final pass; three events; request and receipts are archived | Parity, FX-17, FX-18; through the result record for the codes (LR-6), through the projection for the events (DV-007) |
| General behaviour with a dsh variant | B-0563, B-0764 | The `iter_done` event has a plugin variant; the order of prompt blocks places the protocol section after the standing prompt | Parity, FX-16, FX-19, FX-20, FX-22, FX-24. The general part is specified by 103; the variant here |

Four items are not specific to this harness (B-0563, B-0764, B-0677, B-0984). They stay here so that
the feature carries the 66 items the traceability files assign (`traceability.md` section 5, item 20).

#### 3. Merge rule

| Case | Ruling |
|---|---|
| 028 | Its dsh invocation for both roles is the parity side, compared through the argument-list table of the stub transcripts. The stub executable is named after the as-is command (DV-064) |
| 011 | Contributes nothing: it names harnesses only in its onboarding list, which is superseded |
| Lisa | Contributes nothing: it has no adapter for this harness |
| Settings overlay | 028's throwaway home is kept. It agrees with ruling 36: the real home is read and never written |
| Context window default | 028's default of 98,304 tokens is ported for parity (FX-25). Outside the `parity` profile a critic qualifies only with a known window (Principle IX): declared in the descriptor or in user configuration, and the smaller of the declared and the effective value |
| Control flow that tests the harness name | Removed from the core (DV-064); the two places that compare with the bare name (B-0650, B-0757) become a capability of the descriptor: `pluginRequests`, available only without a qualifier |

#### 4. New requirements from research and owner decisions

| Subject | Source |
|---|---|
| The adapter is a descriptor of kind `cli` with a text stream, plus code hooks for the settings overlay, the critic patch file and the plugin request protocol | Decision 17; R9; R20 |
| **Exact version pin** `==0.1.0-rc.8`, `verified-on` 2026-09-29. Any other version: the doctor warns for the proposer role and **fails** for the critic role, which is launch-blocking when this harness is the critic | Decision 10; R9 open question 2; ruling 32b |
| The critic is tool-less by a deny list, which goes stale when the harness gains a tool. The adapter therefore enumerates, at preflight and before every critic call, the tool ids the installed harness and its profile expose, and refuses the critic role with `critic_not_toolless` when one is not covered by the patch | Principle IX; R9 F12; R11 F-28 |
| Proof of the critic mode: the stream has no initial record, so the proof is the pinned version, the coverage check above, the hash of the patch file and the exported `read-only` mode, all in the call record. The specification states that this proof is weaker than an initial record | EP-02; R9 F11; section 6, point 1 |
| The harness is never picked automatically as a critic while its terms are unknown | Ruling 60; R8 F-P4 |
| No session continuation: every pass is a fresh session and context is carried by the handoff and the ledger. The descriptor declares `session.continuation: none`; the continuation switch has no effect on this harness, and the micro-loop layer runs at level L1 without it | Ruling 58; R9 F10; decision 22 |
| Permission mode: `workspace-write` for the proposer, `read-only` for the critic, never `danger-full-access` unless the consumer opted into containment C0 in user configuration. The mode is always stated | Rulings 34, 38; R9 F12 |
| Containment ceiling: **declared C1, `unverified`**. Whether the permission mode is enforced by the operating system is not established. Until a fixture shows it, the run record says `protection=detect` and parallel units stay off for this harness (ruling P2) | R11 F-28, R-2; ruling P2 |
| What approval mode `ask` does in a headless run with no human is `unverified`. Until the capture exists the adapter treats a pass that ends without a reply as an `agent_failure` and never waits on a prompt: stdin is closed and the watchdogs of 118 apply | R9 F12, open question 4 |
| Quota classifier entries: `QUOTA` gives `quota_window` with confidence `status`, or `quota_credit` when the message says so; `RATE_LIMIT` gives `rate_limit_transient`; `CONTEXT_WINDOW_EXCEEDED` gives `context_window`; `INVALID_CREDENTIAL` gives `auth`. Both stderr and stdout are scanned for the form `dsh: <CODE>: <message>`. The reset time is parsed from the message or is `null`. `CONTEXT_WINDOW_EXCEEDED` is never scored MALFORMED | EP-12; R9 F13, F18; R14 B13 |
| Usage: the harness reports none on stdout. Every pass emits `usage.unavailable` with the reason `harness-does-not-report`; the descriptor declares `usageSource: none`. A cost figure exists only as the consumer's declared estimate, kept apart from reported cost | EV-16; R14 B13, B16 |
| The harness's own telemetry is switched off for every launched process. The trace parent of the open pass span is exported. The doctor warns when the harness's trace plugin captures content while the product's capture is off | R9 F17; R14 C6, rule 7 |
| The environment of every call is an allow-list. The home variable, the permission mode and the telemetry mode are the only harness variables set | R11 T-34; 109 |
| Tier and terms row: Tier 1 and Tier 2, **fleet only, unknown terms** (status `SILENT`; licence and upstream terms not established). Under the audience `distributed` the harness is never a default and never picked automatically; a launch that names it states "unknown terms" and the doctor warns | R8 F-P4; R8v; decision 17; rulings 2, 59 |
| The plugin request protocol stays an opt-in by a non-empty allowlist, which is accepted from user scope, environment or flags only. The request is read as a claim, after the pass has exited, as a regular file without following links. Request and receipts are kept in the control plane | Ruling 35; SL-1; R11 T-13 |
| After a plugin install the coverage check of the critic's deny list runs again before the next critic call | Principle IX; inferred from B-0987 and B-0443 |
| A declared context window may be larger than the effective one of a gateway. The descriptor has an override and the doctor a check | R9 F18 |

#### 5. Contracts

| Depends on (feature 100) | Version |
|---|---|
| EP-02 harness port and harness descriptor, levels `proposer` and `completion` (first form, tool-less) | `specstride.harness/1`, `descriptorVersion: 1` |
| EP-02 sub-point stream readers (text stream, synthesized `init` and `terminal`) | `specstride.harness/1` |
| EP-12 quota classifier | `specstride.quota-classifier/1` |
| EP-10 secret resolver; EP-11 terms-gate data | `specstride.secret-resolver/1`, `specstride.terms/1` |
| EP-14 doctor check registry | `specstride.doctor/1` |
| EP-15 prompt block provider (the plugin protocol section) | `specstride.prompt-block/1` |
| Containment levels; overlay schema | annex C; `specstride-overlay/v1` |
| State layout (request artifact, archive of receipts) | `specstride.layout/1` |
| Stop reasons; result record of the pass loop (codes 7, 4 and 127) | `specstride.stop-reason/1`; annex E |
| Event envelope (usage, quota signal, the three plugin events) | `specstride.event/1` |
| Environment alias table of the normalization contract | `specstride.oracle-normalization/1` |

**Owns (content):** the dsh descriptor, its code hooks, its classifier entries, its recorded fixtures,
and the two as-is schemas `specstride-dsh-plugin-request/v1` and `specstride-dsh-plugin-install/v1`
(names kept). No extension point: it implements EP-02 and EP-12.

#### 6. Divergence register rows and pending decisions

| Id | What the brief proceeds on |
|---|---|
| Ruling 32, 32a, 32b (DP-083) | The adapter is a Wave 1 feature; its 66 items are release-blocking parity items |
| Ruling 58 (DP-016) | Fresh session per pass; files carry context |
| DV-064 | The open registry; the stub executable is named after the as-is command |
| DV-030, DV-031, ruling 34 (DP-008, DP-011) | The permission mode as today under the `parity` profile; the strongest available otherwise. The argument list is mapped through the per-harness table of this adapter |
| DV-027 | The `SPECSTRIDE_DSH_*` variables stay as aliases of `harnesses.dsh.*` and `roles.<role>.*` keys |
| DV-006, DV-066 | Logical names for the request, the receipts and the overlay; logical component names in the stderr lines |
| DV-007 | The three plugin events and the `iter_done` variant are rows of the compatibility projection |
| DV-010 | Continuation is off under the `parity` profile; for this harness it is off always |
| DV-020 | The protocol section is a block of the prompt assembler; its place is that of B-0764 |
| DV-002, ruling 36 (DP-012, DP-038) | The real home is never written by a pass |
| Ruling 60 (DP-025) | Never picked automatically as a critic |
| Ruling 67 (DP-006) | macOS is `unverified` |
| **Point 1, for the orchestrator** | The proof of a tool-less critic without an initial record is a form the port of 109 has to admit. Recommended: admit it for a harness with an exact version pin only |
| **Point 2, candidate for `CLARIFY-QUEUE.md`** | A plugin install writes the profile in the consumer's real home, which ruling 36 says a run never writes. Recommended answer: the allowlist in user configuration is the consumer's consent to exactly that write; it is recorded in the run record and in the receipt; under the audience `distributed` the protocol is off unless the allowlist is set. If ruled otherwise the protocol exists under the `parity` profile only, and needs a register row |
| **Point 3, candidate for `CLARIFY-QUEUE.md`** | What "fleet only" makes the terms gate do. Recommended answer: as in section 4. If ruled otherwise the terms gate refuses the harness under `distributed`, and the adapter's tests run under `personal` only |

#### 7. Requirement groups and estimate

| Group | Content | Est. |
|---|---|---|
| G1 | Detection, exact version pin, descriptor, tier and terms row, doctor checks | 5 |
| G2 | Proposer: invocation, model resolution, settings overlay, permission mode, no continuation | 9 |
| G3 | Critic: patch and deny list, coverage check, proof, prompt as arguments, context window | 7 |
| G4 | The plugin request protocol | 8 |
| G5 | Quota and error signals, usage, the harness's telemetry | 4 |

Total: about 33. If `speckit-specify` yields more than about 45, G4 leaves first.

#### 8. Tests required

| Kind | Content |
|---|---|
| Parity | Every fixture that names this harness, through the stub executable: FX-26 and FX-01 (argument list, environment names, stdin closed), FX-06 and FX-07 (critic transport and configuration errors), FX-17 and FX-18 (iteration limit and consecutive errors, which the plugin codes 4 and 7 join), FX-25 (context window), FX-16, FX-19, FX-20, FX-22, FX-24 for the two general items |
| Parity, fixtures still to be built by 141 | Scenarios with a request file and a stub installer, inside FX-17 and FX-18 or as a new family (`traceability.md` section 5, item 17); a fixture with a declared overlay (item 2). Until they exist the rows concerned are proven by characterization tests |
| Conformance | The adapter conformance suite of 109 with a fake binary; recorded stdout and stderr replayed through the text reader; classifier fixtures for each of the four codes on each of the two streams |
| Own tests | A tool id that the patch does not cover refuses the critic; a version other than the pin refuses the critic; a request that is a link, too large, has a fourth key, names a range or is not in the allowlist is denied; an install on the final pass; the real home is byte-identical before and after a pass without the protocol |
| Fixture captures before the specification freezes | (1) what approval mode `ask` does in a headless run; (2) whether the permission mode is enforced by the operating system; (3) the list of tool ids of the pinned version. Each is a scripted capture or one small call, allowed only as an explicitly authorized probe, and is logged |

Success criteria this feature carries:

| Criterion | Measure |
|---|---|
| The critic has no tools | On the pinned version the coverage check finds every exposed tool id in the patch; on a fixture with one more tool the critic role is refused |
| Parity of both roles | Every parity test of the 66 items passes, or is `waived` by a register row |
| A pass never waits on a human | No fixture pass outlives its watchdogs waiting for an approval |
| Provider and harness facts are dated | Every fact about the harness carries a `verified-on` date and the version pin |

#### 9. Constitution principles that bind it

VII, VIII, IX, X, XI, XII, XVIII.

#### 10. Research that supports it

R9 (F1, F2, F4, F10 to F13, F16 to F18), R11 (F-28, R-2, T-34), R14 (B13, B14, B16, C6), R8 (F-D1 to
F-D4, F-P4), R8v, R18, R20, R4 (the harness as a host, for the boundary).

#### 11. Constraints

Owner-set constraints, for the spec's `## Constraints` section:

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| The adapter is specified against the harness seam exactly as the Claude adapter is: descriptor, optional code hooks, recorded fixtures | `architecture.md` section 14; roadmap |
| Every parity test of this harness passes before any release | Ruling 32 |
| The product never installs, vendors or downloads the harness; it installs a plugin of the harness only on a request that the consumer's allowlist admits | Constitution, additional constraints; B-0442 |
| No name of a model, provider or launcher that is specific to the owner's machines appears in the specification | BRIEF-COMMON, naming rule |

**What belongs in `plan.md` instead:** libraries and their versions, the package and file layout, physical paths behind logical names, the test runner, bundling, and the spelling of internal functions. `spec.md` describes behaviour and names none of them. For this feature also: the exact flags and variables of the harness with their version pin, and the list of tool ids in the patch.

---

### 131-adapter-codex

Directory: `specs/131-adapter-codex`. Tier 2. Estimated requirements: 27.

#### 1. Scope

**In scope.** The Codex harness adapter, specified against the seam of 109 exactly as
125-adapter-claude is: a harness descriptor, optional code hooks and recorded fixtures. Detection and
version; the login check that reads no credential; the proposer invocation, headless, with a JSONL
stream and the operating-system sandbox of the harness; continuation by session id; the critic in two
forms: (a) the harness started under its **read-only sandbox in the working tree**, with the
proposer's notebook, handoff and outbox moved out and the workspace part denied, and (b) a direct call
to the provider's API with a key; the proof of each form; quota signals and usage; the tier and terms
rows per audience; the containment ceiling; the adapter's doctor checks; the facts that need a fixture
capture before the specification freezes.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| The port, the second form of the `completion` level as a contract, the generic endpoint client, containment levels | 109 |
| Moving the proposer's files out before a critic with read tools starts, and the list of withheld paths | 117. This feature states what its sandbox can deny and proves it |
| The place of such a critic in the critic order | 124 |
| The registry of stream readers; the normalized record set | 126. This feature supplies the mapping of the harness's JSONL events as data, and its fixtures |
| What a quota class does to the run | 127 |
| The terms gate as policy and the audience | 110 |
| The vendor's TypeScript SDK as a transport | Not in Wave 1 (R6, recommendation 1) |
| Other endpoints that speak the same chat format | The generic descriptor of 109; adapters 136 and 137 on the roadmap |

#### 2. As-is requirements received

None as a requirement. 028 FR-021 (owned by 109) states the registry; the entry of this harness is
item B-0428 here.

Behaviour inventory received, as assigned in `traceability-items.tsv` (the authority): **8 items in 4
clusters**. All 8 are parity items (owner ruling 32).

| Source module | Clusters | Items | ported | translated | superseded-by |
|---|---|---|---|---|---|
| `critic.py` | C-061, C-066 | 5 | 1 | 4 | 0 |
| `proposer.sh` | C-058 | 2 | 2 | 0 | 0 |
| `backends.py` | C-035 | 1 | 1 | 0 | 0 |
| **Total** | | **8** | **4** | **4** | **0** |

| Item | As-is behaviour (short) | Disposition | Proof |
|---|---|---|---|
| B-0428 | Registry entry: proposer and critic, no qualifier, no stream format, no overlay | ported | Parity, FX-26; `PT-131-C-035-*` |
| B-0690 | The harness has its own allow-all flag, which removes sandbox and approvals together; the flags shared with other harnesses are not passed | ported | Parity, FX-01, FX-26; `PT-131-C-058-*` (DV-030, DV-064) |
| B-0691 | Invoked as `codex exec <allow-all flag> [--model M] <prompt>`: the prompt is a positional argument and the output is raw text | ported | Parity, FX-01, FX-26 |
| B-0831 | The critic's model setting, default `gpt-5`, is also the key of the context-window lookup | translated | Parity through the alias table (DV-027), FX-25; cites DV-081 |
| B-0832 | The critic's base address setting and its default | translated | Parity through the alias table, FX-01, FX-06; cites DV-081 |
| B-0833 | The critic needs an API key; an empty one raises a named error | translated | Parity through the alias table, FX-06, FX-07; cites DV-081 |
| B-0910 | Context windows by model: three listed values, and 128,000 for a model that is not listed | ported | Parity, FX-25; `PT-131-C-066-*` |
| B-0981 | The critic is a direct HTTP call: one user message, a bearer key, no output limit sent; an empty choice list raises | translated | Parity through the transport-neutral transcript (DV-001, DV-081), FX-06, FX-07 |

#### 3. Merge rule

| Case | Ruling |
|---|---|
| 028 | Its invocation is the parity side for both roles. The code marks the proposer path "unverified on this host"; it is ported as written |
| Critic transport | 028 reaches this critic by direct HTTP only. The owner ruled that the harness under a read-only sandbox counts as a critic as well, in the working tree (rulings 57, 57a). Both forms exist; the stub critic serves both and the transcript is compared in transport-neutral form, so the difference is not observable (DV-081) |
| Context window | 028's table is ported for parity (FX-25). Outside the `parity` profile the window is declared in configuration or read from a models endpoint; a model with no known window does not qualify (Principle IX; decision 17). The fallback of 128,000 is parity behaviour only |
| Lisa | Its endpoint client for this chat format is the one 109 extracts; form (b) uses it. Lisa has no adapter for the harness itself |
| 011 | Contributes nothing |

#### 4. New requirements from research and owner decisions

| Subject | Source |
|---|---|
| The adapter is a descriptor of kind `cli` with a JSONL stream, plus code hooks for the critic's sandbox form; the stream mapping is data | Decision 17; R6; R20 |
| Version pin `>=0.153.4 <0.154`, `verified-on` 2026-09-29. The flags were checked by `--help` only; no run exists. The doctor warns outside the range | Decision 10; R6 finding 1 |
| Detection by the version command and by the login status command. The adapter never reads the harness's credential file or key store | R6 finding 3; BRIEF-COMMON safety rules |
| Proposer: `exec` with the JSONL option, the sandbox mode `workspace-write`, approvals `never`, the working directory stated, the prompt on stdin. The allow-all flag is used only where the consumer opted into containment C0 in user configuration, and under the `parity` profile | Rulings 34, 38; R6 recommendation 1; R11 F-23 |
| Continuation by the session id the first pass returned, never "the latest". A new phase attempt, a relaunch, a watchdog kill, a second repair, an escalation and every critic call start fresh | Decision 22; ruling 7; R6; R24 |
| **Critic, form (a), read-only tools.** The harness is started with the sandbox mode `read-only`, as an ephemeral session, with user configuration and project rules ignored, the network off, in the working tree, the prompt on stdin. It may read project files by itself. It cannot write, cannot run a command that writes and cannot reach the network | Rulings 57, 57a; Principle IX, exception; R6 finding 4 |
| Before form (a) starts, the proposer's notebook, handoff and outbox are out of the working tree and the sandbox denies reads of the workspace part. The critic is still given the grounding snapshot and the fact block in its prompt, and its verdict is bound to the nonce. On conflict the snapshot and the disk beat prose | Ruling D1; Principle III; `architecture.md` section 5 |
| Proof of form (a): the call record shows the sandbox mode, the network setting, the ephemeral flag and the session id of the stream's first record; any other result is `critic_not_toolless` and halts the run. What the stream's first record shows of the sandbox mode is `unverified` | EP-02; R6; section 8 |
| Read denial. Whether the harness's sandbox can deny **reads** of named paths is `unverified`. Where the adapter cannot confirm the denial, form (a) is not used and the critic order moves to the next candidate, announced. The control plane, the worker root and the tree store are among the paths to deny | R29v open question 1, PU-63, PU-91; ruling D1 |
| **Critic, form (b), direct API.** One call through the generic endpoint client, with a key from a secret reference, a known context window and a spending cap. Tool-less by construction. It stays the form for consumers with an API key | R6; DV-001; rulings 57, 60 |
| Which form is used: form (a) under Tier 1, where the consumer's login is the credential; form (b) under Tier 2. The form in use is announced at launch and recorded per call | Rulings 1, 57; R8v |
| Residual risk of form (a), stated in the specification: repository text reaches this critic without passing the grounding snapshot. The owner accepted it | `architecture.md` section 17; ruling 57a |
| Containment ceiling: **C2** for the proposer (operating-system sandbox, network off by default, the repository's own metadata directories read-only). Parallel units are therefore possible on this harness once the adapter declares `concurrentSessions`, which is `unverified` | R11 F-23, R-2; ruling P2; R29 PU-40 |
| Quota classifier entries. With a login: the limit of the 5-hour and the weekly window is known as message text only ("Try again in …"); it is classified `quota_window` with confidence `text`, so the run pauses only after the confirming probe. With an API key: status 429 gives `rate_limit_transient`, the body code for exhausted credit gives `quota_credit`. **A structured quota event is `unverified`** | EP-12; R6 finding 6; R14 B6 |
| Usage per turn from the `turn.completed` record: input, cached input and output tokens, as increments. A cost figure under a login is notional | EV-03, EV-17; ruling 66; R14 rule 7 |
| Session state per phase attempt. Whether the harness can keep its session files outside its home while the login stays in the home is `unverified`; if it cannot, continuation is off for Tier 1 on this harness and files carry context | Ruling 36; R6; section 8 |
| Tier and terms rows. Audience `personal`: Tier 1 **with conditions** (the account holder's own trusted machine, no public or untrusted environment) and Tier 2. Audience `distributed`: Tier 2 is the default; Tier 1 is an opt-in that is off by default and marked "personal use only". Tier 3 is refused | R8v D2, D3; rulings 1, 2, 59 |
| Harness-native memory and project instruction files: off for the critic always, off by default for the proposer, recorded per run | Ruling 37 |

#### 5. Contracts

| Depends on (feature 100) | Version |
|---|---|
| EP-02 harness port and harness descriptor; level `proposer`; level `completion` in both forms | `specstride.harness/1`, `descriptorVersion: 1` |
| Withheld paths for a critic with read tools | annex C |
| EP-02 sub-point stream readers (mapping as data) | `specstride.harness/1` |
| EP-12 quota classifier | `specstride.quota-classifier/1` |
| EP-10 secret resolver; EP-11 terms-gate data | `specstride.secret-resolver/1`, `specstride.terms/1` |
| EP-14 doctor check registry | `specstride.doctor/1` |
| Containment levels; overlay schema | annex C |
| Event envelope (usage, quota signal) | `specstride.event/1` |
| Environment alias table of the normalization contract | `specstride.oracle-normalization/1` |

**Owns (content):** the Codex descriptor, its code hooks, its classifier entries, its stream mapping
and its recorded fixtures. No extension point. It is the first implementation of the second form of
the `completion` level.

#### 6. Divergence register rows and pending decisions

| Id | What the brief proceeds on |
|---|---|
| Ruling 32, 32b (DP-083) | The adapter is a Wave 1 feature; its 8 items are release-blocking parity items |
| DV-081, rulings 57, 57a, D1 (DP-001) | A critic with read-only tools in a sandbox, in the working tree, with the proposer's files hidden. Not observable in the oracle |
| DV-001 | The direct call stays; the transcript is compared in transport-neutral form |
| DV-030, DV-031, ruling 34 (DP-008, DP-011) | The allow-all flag as today under the `parity` profile; the sandbox mode otherwise. The argument list is mapped through the per-harness table of this adapter |
| DV-064 | The open registry; the stub executable is named after the as-is command |
| DV-027 | The as-is variables stay as aliases |
| DV-010, ruling 7 (DP-035) | Continuation off under the `parity` profile |
| DV-048, rulings 1, 2 (DP-042, DP-057) | Tier 2 by default for the audience `distributed` |
| Ruling 60 (DP-025) | Picked automatically only with a mandatory spending cap, and form (a) only as a tested adapter |
| Ruling 66 (DP-030) | Notional cost |
| Ruling 67 (DP-006) | macOS is `unverified`, the sandbox mechanism included |

#### 7. Requirement groups and estimate

| Group | Content | Est. |
|---|---|---|
| G1 | Detection, version pin, login check, descriptor, tier and terms rows, doctor checks | 5 |
| G2 | Proposer: invocation, sandbox mode, continuation, session state | 6 |
| G3 | Critic, form (a): the read-only sandbox, read denial, proof, fallback | 8 |
| G4 | Critic, form (b): the direct call, context window, cap | 4 |
| G5 | Quota signals and usage | 4 |

Total: about 27.

#### 8. Tests required

| Kind | Content |
|---|---|
| Parity | Every fixture that names this harness, through the stub executable and the stub endpoint: FX-01 and FX-26 (proposer argument list), FX-06 and FX-07 (critic transport and configuration errors), FX-25 (context windows) |
| Conformance | The adapter conformance suite of 109 with a fake binary and a fake endpoint; recorded JSONL streams replayed through the data mapping; classifier fixtures for the limit text and for the two API cases |
| Own tests | Form (a): a fixture tree in which the notebook, the handoff and the outbox exist before the call, are absent during it and are back after it; a write attempt and a network attempt by the stub are refused by the mode; an unconfirmed read denial moves the critic order on, with the announcement. Form (b): an empty key refuses; an unknown window refuses |
| Fixture captures before the specification freezes | (1) the record the stream emits when a login limit is reached, and the exit code; (2) what the first record of the stream shows of sandbox mode and session; (3) whether the read-only sandbox can deny reads of named paths; (4) whether session files can live outside the home; (5) whether several headless processes may run under one home. Each is a scripted capture or one small call, allowed only as an explicitly authorized probe, and is logged |
| Live | One logged probe per role and critic form; no other paid call |

Success criteria this feature carries:

| Criterion | Measure |
|---|---|
| The critic cannot write and cannot reach the network | In form (a) every call record shows the read-only mode and the network off, and the seeded write and network attempts fail |
| The history of repairs stays withheld | During a form (a) call none of the withheld paths is readable from the working tree |
| The critic never shares the proposer's session | No critic call record carries a session id that a pass used |
| Parity of both roles | Every parity test of the 8 items passes, or is `waived` by a register row |
| Provider and harness facts are dated | Every fact carries a `verified-on` date and the version pin |

#### 9. Constitution principles that bind it

II, III and IX (with the exception for a critic with read-only tools), VII, VIII, X, XI, XII, XVIII.

#### 10. Research that supports it

R6, R8, R8v (rows 7 and 9; D2, D3), R11 (F-23, R-2), R14 (B6), R20, R24, R29v (open question 1), R18.

#### 11. Constraints

Owner-set constraints, for the spec's `## Constraints` section:

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| The adapter is specified against the harness seam exactly as the Claude adapter is: descriptor, optional code hooks, recorded fixtures | `architecture.md` section 14; roadmap |
| Every parity test of this harness passes before any release | Ruling 32 |
| The exception to Principles III and IX is limited to reading project files | Ruling D1 |
| Subscription use only through the CLI the consumer installed and logged in; the adapter handles no login token | Decision 6; R8v |

**What belongs in `plan.md` instead:** libraries and their versions, the package and file layout, physical paths behind logical names, the test runner, bundling, and the spelling of internal functions. `spec.md` describes behaviour and names none of them. For this feature also: the exact flags of the harness, with their version pin.

---

### 134-adapter-pi

Directory: `specs/134-adapter-pi`. Tier 2. Estimated requirements: 22.

#### 1. Scope

**In scope.** The pi harness adapter, specified against the seam of 109 exactly as 125-adapter-claude
is: a harness descriptor, optional code hooks and recorded fixtures. Detection and version; the
proposer invocation, headless, with a JSONL stream and the prompt on stdin; continuation by a session
id the runtime mints; the tool-less critic by flags; the proof of that mode; pi's row in the dialect
table of the JSONL reader it shares with prime; quota and error signals inside the stream; usage per
message; the harness's own telemetry, switched off; project-local resources of the harness, left
untrusted; the tier and terms rows, gated by the back end in use, with the refusal of its Claude OAuth
path; the containment ceiling; the adapter's doctor checks; the facts that need a fixture capture
before the specification freezes.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| The port, the descriptor schema, the generic adapter, containment levels | 109 |
| The JSONL reader for stream schema v3 and the schema of its dialect table | 138 (content owner), 100 (contract). This feature adds one row of data and the fixtures that prove it |
| The registry of stream readers; the normalized record set | 126 |
| What a quota class does to the run | 127 |
| The terms gate as policy; the rows of the back ends | 110 |
| Discovery and the critic order | 124 |
| The harness's RPC mode and its SDK | Not in Wave 1 |

#### 2. As-is requirements received

None. **No as-is item**: pi has no adapter in Specstride, in mixture-of-loops or in Lisa, and no
registry entry at the baseline (`traceability.md` section 4.2). `traceability-items.tsv` assigns no
behaviour item to this feature.

The feature is in Wave 1 by the owner's ruling (32a, 32b), not because of parity. Its requirements
come from research. No parity test cites it; the release gate "every parity test" is met by it
trivially.

#### 3. Merge rule

Not applicable: no system contributes behaviour. Two facts of the baseline bind it indirectly:

| Case | Ruling |
|---|---|
| The stream reader | The harness belongs to the same family as prime and its session header declares version 3. The reader of 138, which is the parity port of the baseline's reader, is used with a dialect row. Where the two harnesses differ, the difference is a row of the table and never a branch in the reader |
| The registry | The baseline states that no entry named `pi` exists (B-0425, owned by 109 and superseded by DV-064). The adapter is a new entry of the open registry |

#### 4. New requirements from research and owner decisions

| Subject | Source |
|---|---|
| The adapter is a descriptor of kind `cli` whose stream format is the JSONL schema v3 of the shared reader, with the dialect `pi`. Code hooks only where the descriptor cannot express a rule | Ruling 32b; R9 option B; decision 17 |
| Version pin `>=0.80.6 <0.81`, `verified-on` 2026-09-29. **Provisional**: flags and stream were read from the installed package's help and documentation; the harness has never been run by the product. The pin is confirmed by the first fixture capture | Decision 10; R9 |
| Proposer: print mode with the JSON output mode, the prompt on stdin, the working directory stated. Tools are selected by an allow-list, never by a deny list | R9 F7, F8, recommendation 1 |
| Continuation by the exact session id the runtime minted for the phase attempt, never "the most recent". A pass that cannot continue, a new phase attempt, a relaunch, a watchdog kill, a second repair, an escalation and every critic call run without a session. The session directory is per phase attempt | Decision 22; rulings 7, 36; R9 F10 |
| Containment ceiling: **C0**. The harness has no sandbox, no permission mode and no permission prompt: it runs with the consumer's permissions. As a proposer it therefore runs only where the consumer opted into C0 in user configuration; without the opt-in the launch is refused with the reason and the doctor line. The run record says `protection=detect`. Parallel units stay off for this harness unless `loop.parallel.allow_detect` is set | Rulings 34, 38, P2; R9 F8; R11 F-27, R-2 |
| Critic: tool-less **by flags**: no tools, no skills, no context files, no extensions, no prompt templates, no session, print mode, the prompt on stdin. `unverified` by run | Principle IX; R9 F8, recommendation 1 |
| Proof of the critic mode: the adapter accepts the call only if the initial record of the stream shows the session it minted and, where the stream states it, an empty tool list. Whether the stream states the tool list is `unverified`; if it does not, the proof is the flag set in the call record together with the version pin, stated as the weaker proof | EP-02; R9; section 8 |
| Project-local resources of the harness are not trusted: the adapter never passes the approval flag and never sets project trust. In print mode the harness ignores them by default | R9 F9; Principle III |
| Auth is by provider API key, handed to the process by environment from a secret reference, never by argument. The adapter reads no auth file of the harness | Decision 6; R9 F16; R11 T-35 |
| Tier and terms rows: the software is `ALLOWED-DOCUMENTED` with API-key back ends; the decision is that of **the back end's row**, which the terms gate evaluates for the provider and model in use | R8v rows 37, 38; EP-11 |
| The harness's OAuth login for a Claude subscription is a **Tier 3** path and is refused for both audiences, with the explanation. The same holds for every login of the harness that reuses a subscription token of a provider whose row says so. The adapter never starts a login | R8v rows 39, 40; ruling 59; R9 F17 |
| Quota classifier entries: a provider error arrives as an assistant message whose stop reason is `error`, with a message text, after the retry records. The class comes from the text; a reset time in the text ("reset after 5h") is parsed. A server-requested delay above the harness's cap fails at once, which makes a limit visible without a stall | EP-12; R9 F14; R14 B12 |
| The terminal record decides the outcome of a call, as for prime. Whether the process exits non-zero on a provider error is `unverified`; the adapter does not depend on it | R9 F14, open question 3; ruling 32b, "To apply" |
| Usage per message from the stream, as increments; cost `null` where the stream gives none | EV-03, EV-17 |
| The harness's own telemetry and its update check are switched off for every launched process | R9 F17; R14 rule 7 |
| Context window: read from the harness's model list or declared; the smaller of the declared and the effective value; no default for an unknown model | Principle IX; R9 F18 |

#### 5. Contracts

| Depends on (feature 100) | Version |
|---|---|
| EP-02 harness port and harness descriptor, levels `proposer` and `completion` (first form, tool-less) | `specstride.harness/1`, `descriptorVersion: 1` |
| EP-02 sub-point stream readers; the dialect table of the JSONL reader | `specstride.harness/1`; `specstride.stream-dialect/1` |
| EP-12 quota classifier | `specstride.quota-classifier/1` |
| EP-10 secret resolver; EP-11 terms-gate data | `specstride.secret-resolver/1`, `specstride.terms/1` |
| EP-14 doctor check registry | `specstride.doctor/1` |
| Containment levels | annex C |
| Event envelope (usage, quota signal) | `specstride.event/1` |

**Owns (content):** the pi descriptor, its row of the dialect table, its classifier entries and its
recorded fixtures. No extension point.

#### 6. Divergence register rows and pending decisions

| Id | What the brief proceeds on |
|---|---|
| Rulings 32a, 32b (DP-083) | The adapter is a Wave 1 feature. It shares one JSONL reader and a dialect table with prime |
| DV-064 | A new entry of the open registry; no as-is behaviour to compare |
| Ruling 34 (DP-008, DP-011) | C0 only by opt-in in user configuration |
| Ruling 59 (DP-020, DP-022) | Tier 3 ships refused; the OAuth path of a Claude subscription is refused |
| Ruling 60 (DP-025) | Picked automatically as a critic only as a tested adapter and only with the back end's row allowing it |
| Ruling 7 (DP-035) | Continuation under the drop rules |
| Ruling 37 (DP-017) | Context files and native memory off for the critic always |
| Ruling 67 (DP-006) | macOS is `unverified` |
| No register row | The feature changes no as-is behaviour |

#### 7. Requirement groups and estimate

| Group | Content | Est. |
|---|---|---|
| G1 | Detection, version pin, descriptor, tier and terms rows, the Tier 3 refusal, doctor checks | 6 |
| G2 | Proposer: invocation, tool allow-list, continuation, containment | 6 |
| G3 | Critic: the flag set, the proof, untrusted project resources | 4 |
| G4 | The dialect row, quota signals, the terminal record, usage, telemetry off | 6 |

Total: about 22.

#### 8. Tests required

| Kind | Content |
|---|---|
| Parity | None: no reference exists |
| Conformance | The adapter conformance suite of 109 with a fake binary; the conformance suite of the shared reader (owned by 138) run with the dialect `pi` on recorded streams; classifier fixtures for an error message with and without a reset time |
| Own tests | A launch with this harness as proposer and no C0 opt-in is refused; a configuration that names the OAuth path of a Claude subscription is refused by the terms gate with the Tier 3 explanation; a stream whose session header declares a version other than 3 ends in the reader's terminal for an unsupported schema |
| Fixture captures before the specification freezes | (1) the exit code on a provider error; (2) one recorded stream of a proposer pass and one of a critic call, to confirm that the shared reader accepts them; (3) whether the initial record states the tool list; (4) whether the exact-session-id flag works in print mode with JSON output. Each is a scripted capture or one small call, allowed only as an explicitly authorized probe, and is logged |
| Live | One logged probe per role; no other paid call |

Success criteria this feature carries:

| Criterion | Measure |
|---|---|
| One reader, two harnesses | The recorded streams of pi and of prime pass the same reader; the only difference between the two configurations is the dialect row |
| Tier 3 is refused | No configuration makes the adapter run on a subscription token of a provider whose row refuses it |
| The critic never shares the proposer's session | No critic call record carries a session id that a pass used |
| Provider and harness facts are dated | Every fact carries a `verified-on` date and the version pin |

#### 9. Constitution principles that bind it

VII, VIII, IX, X, XI, XII.

#### 10. Research that supports it

R9 (F6 to F10, F14 to F18), R8v (rows 37 to 40), R11 (F-27, R-2), R14 (B12), R20, R24.

#### 11. Constraints

Owner-set constraints, for the spec's `## Constraints` section:

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| The adapter is specified against the harness seam exactly as the Claude adapter is: descriptor, optional code hooks, recorded fixtures | `architecture.md` section 14; roadmap |
| pi and prime share one JSONL reader with a dialect table | Ruling 32b |
| The product never installs, vendors or downloads the harness, and never logs in to it | Constitution, additional constraints; BRIEF-COMMON safety rules |

**What belongs in `plan.md` instead:** libraries and their versions, the package and file layout, physical paths behind logical names, the test runner, bundling, and the spelling of internal functions. `spec.md` describes behaviour and names none of them. For this feature also: the exact flags and variables of the harness, with their version pin.

---

### 138-adapter-prime

Directory: `specs/138-adapter-prime`. Tier 2. Estimated requirements: 34.

#### 1. Scope

**In scope.** The prime harness adapter, specified against the seam of 109 exactly as
125-adapter-claude is: a harness descriptor, optional code hooks and recorded fixtures. Detection and
version of the agent executable; the proposer invocation, headless, in text or JSON mode, with the
prompt on stdin; the optional qualifier `variant` and the consumer's launcher behind it; the tool-less
critic by flags; **the JSONL reader for stream schema v3**, with the dialect table that pi shares;
the rule that **the terminal record decides**, because the process exits 0 on a provider error; error
and auth classes; usage; the announcement of the observability mode; the harness's own telemetry,
switched off; the tier and terms row; the containment ceiling; the adapter's doctor checks; the facts
that need a fixture capture before the specification freezes.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| The port, the descriptor schema, the generic adapter, containment levels | 109 |
| The registry of stream readers, the normalized record set, the tap, invocation records | 126. The reader specified here registers in that registry |
| pi's row of the dialect table | 134 |
| What a quota class does to the run | 127 |
| The terms gate as policy, config keys and the alias table | 110 |
| The events as a schema and the compatibility projection | 111. This feature emits them |
| Discovery and the critic order | 124 |
| The consumer's launcher and its variants | The consumer. The contract targets the agent executable; the launcher is a path in user configuration |

#### 2. As-is requirements received

None as a requirement. 028 FR-021 (owned by 109) states the registry; the entry of this harness is
item B-0430 here.

Behaviour inventory received, as assigned in `traceability-items.tsv` (the authority): **62 items in 13
clusters**. All 62 are parity items (owner ruling 32).

| Source module | Clusters | Items | ported | translated | superseded-by |
|---|---|---|---|---|---|
| `prime_stream.py` | C-168 to C-171 | 41 | 24 | 17 | 0 |
| `proposer.sh` | C-052 to C-054, C-058 | 11 | 6 | 5 | 0 |
| `critic.py` | C-061 to C-062, C-066 | 8 | 3 | 5 | 0 |
| `backends.py` | C-035 | 1 | 1 | 0 | 0 |
| `agent_stream.py` | C-154 | 1 | 1 | 0 | 0 |
| **Total** | | **62** | **35** | **27** | **0** |

What the items say, by subject, so that the brief can be read alone:

| Subject | Items | As-is behaviour (short) | Proof |
|---|---|---|---|
| Registry entry | B-0430 | Serves proposer and critic, each with an optional qualifier `variant`; no stream format and no overlay declared | Parity, FX-26; `PT-138-C-035-*` |
| Proposer invocation | B-0692, B-0693, B-0517 | `<agent executable> -p --mode text|json --no-session --cwd <workdir> [--model M]`, the prompt on stdin, no allow-all flag; JSON mode when the stream tap is on, text mode otherwise | Parity, FX-01, FX-26; `PT-138-C-058-*` |
| The qualifier | B-0694 to B-0696, B-0518 | With a variant the consumer's launcher is called with the variant as first argument; an empty variant fails the pass; `--model` together with a variant is refused | Parity, FX-01, FX-18, FX-26 |
| Executable not found | B-0572, B-0573 | The pass returns 127, for the agent executable and for the launcher | Parity through the result record (LR-6), FX-18 |
| Observability mode | B-0547, B-0839, B-0856, B-0747, B-2120 | An `agent_observability` event says `structured` or `raw-text`, with its reason and the provider format literal `prime-v3`; the format row announces its capability reason and five signals | Parity through the projection (DV-007), FX-01, FX-26 |
| Critic invocation | B-0991, B-0827 to B-0829, B-0995 | `<launcher> [<variant>] -p --mode text --no-session --no-tools --no-skills --no-context-files [--cwd <workdir>]`, the prompt on stdin; an empty variant raises | Parity, FX-01, FX-06, FX-07; `PT-138-C-066-*`, `PT-138-C-061-*` |
| A preserved oddity | B-0994 | A critic function for JSON mode exists and is never called: the verdict path always uses text mode, although the event may announce `structured` | Parity, FX-01, FX-26 |
| Reader: schema | B-2225, B-2229, B-2230, B-2241, B-2250 | A record before any session record, a session without a version and a version other than 3 each give a diagnostic; an unsupported version gives the terminal `unsupported_schema` and later records are ignored; the set of known record types is closed | Parity, FX-26; `PT-138-C-168-*`, `PT-138-C-169-*`, `PT-138-C-171-*` |
| Reader: malformed input | B-2224, B-2227, B-2228 | A line that is not JSON, a value that is not an object and an unknown record type each give a diagnostic, and reading goes on | Parity, FX-26 |
| Reader: session and model | B-2231, B-2232, B-2252 | `agent_init` from the session record; an update when a message names another model or provider; messages of a role other than assistant are ignored | Parity through the projection, FX-26 |
| Reader: text | B-2233, B-2253, B-2254, B-2245 | Text deltas are accumulated per message and content index and emitted at the end of the message; a content snapshot replaces them only when it starts with them; the text is printed redacted, up to 4,096 bytes | Parity, FX-26 |
| Reader: tools | B-2234 to B-2237, B-2239, B-2256 to B-2258, B-2246, B-2247, B-2249 | Start, progress and end of a tool with caps of 2,048, 1,024 and 4,096 bytes; a generated id where the record has none; what counts as a tool error; an abandoned tool is a diagnostic; evidence writing is detected lexically from the tool's arguments | Parity, FX-26 |
| Reader: errors and the terminal | B-2238, B-2242, B-2243, B-2251, B-2255, B-2259, B-2260 | A provider error is classed `provider_auth` by five words in its message, otherwise `provider_error`; an error seen before the end of the agent becomes the terminal only if the end delivered none; the end of the agent is an error terminal or a success terminal by its status words | Parity, FX-26 |
| Reader: retry | B-2226 | The start of an internal retry is a diagnostic with attempt and delay | Parity through the projection, FX-26 |
| Reader: usage | B-2261 to B-2264 | Usage names in two spellings; usage of turns is summed and the end's usage merged as the maximum; total tokens derived when absent; the turn count reported under two names; cost under the key `cost`, so that the old cost metrics get no value from this harness | Parity, FX-26. The last point is a preserved defect of the projection; the new schema carries typed usage |
| Reader: output lines | B-2240, B-2244, B-2248 | The init line, the diagnostic line and the common fields of a diagnostic | Parity, FX-26; `PT-138-C-170-*` |

#### 3. Merge rule

| Case | Ruling |
|---|---|
| 028 | Its invocation for both roles and its reader are the parity side. The stub executables are named after the as-is commands (DV-064) |
| Lisa | Its package for this harness is not extracted: the baseline's reader is the reference, and Lisa's is a port of an older state of it (R1: "defer to its own adapter feature"). It may be read as reference for the mapping |
| 011 | Contributes nothing |
| Exit code against the terminal record | 028 wins and is kept as a rule of the adapter: the process exits 0 on a provider error, so success is decided by the terminal record and never by the exit code |
| Context window default | 028's default of 98,304 tokens for a model it cannot see is ported for parity (FX-25, owned by 117). Outside the `parity` profile a critic qualifies only with a known window (Principle IX) |
| The launcher and its variants | The qualifier and its two refusals are ported. Which launcher is called is user configuration; the specification names none |

#### 4. New requirements from research and owner decisions

| Subject | Source |
|---|---|
| The adapter is a descriptor of kind `cli` whose stream format is the JSONL schema v3, plus the reader as a code hook that registers in the reader registry of 126 | Ruling 32b; R9 option B; decision 17 |
| Version pin `>=0.7.3 <0.8`, stream schema 3, `verified-on` 2026-09-29. The pin is on the agent executable; the consumer's launcher has no version flag. The doctor warns outside the range | Decision 10; R9 Q1 |
| **One reader, a dialect table.** The reader is written once for the family. What differs per harness is data in a dialect table: the dialect's name, the provider format literal, the variables and flags that switch telemetry and sessions, extra record types, and the usage names. A third harness of the family is a row, not code | Ruling 32b; R9 F6, F7; EP-02 sub-point |
| The terminal record decides, for the proposer and for the critic. A stream that ends without one yields `stream.missing_terminal` | R9 F5; Principle XI; EV-31 |
| Outside the `parity` profile the critic runs in JSON mode, so that a provider error is seen in the terminal record and not guessed from text. Under the `parity` profile it runs in text mode as today. **This needs a divergence register row** (section 6, point 1) | R9 F5, open question 3; B-0994 |
| Continuation within a phase attempt by the harness's resume flag inside a session directory per phase attempt; never "the latest" without that directory. Everything else starts without a session | Decision 22; rulings 7, 36; R9 F10 |
| Containment ceiling: **C0**. The harness states itself that it is not a sandbox: it runs model-generated code with the consumer's permissions and has no permission mode. As a proposer it therefore runs only where the consumer opted into C0 in user configuration; the run record says `protection=detect`; parallel units stay off unless `loop.parallel.allow_detect` is set | Rulings 34, 38, P2; R9 F19; R11 R-2 |
| Tools of the proposer are selected by an allow-list | R9 recommendation 1 |
| Critic: tool-less by flags, as today, with the flags for extensions and prompt templates added where the pinned version has them; fresh every time; a known context window | Principle IX; R9 F4, recommendation 1 |
| Proof of the critic mode: the flag set in the call record, the session the adapter minted in the initial record, and no tool record anywhere in the stream of the call. A tool record in a critic stream is `critic_not_toolless` and halts the run | EP-02; R9 |
| Quota classifier entries: the error classes of the reader are mapped to the classes of EP-12. `provider_auth` gives `auth`. For `provider_error` the class comes from the message text: a limit with a reset time gives `quota_window` with confidence `text`, which pauses only after the confirming probe. The harness has no code of its own for quota | EP-12; R9 F14; R14 B12 |
| Usage per message as increments in the new schema; a killed pass keeps its partial usage | EV-03, EV-17; R14 rule 6 |
| **The harness's own telemetry is switched off** for every launched process, by its variable and by the do-not-track variable. The consumer did not opt in | R9 F17; R14 rule 7 |
| Auth is by provider API key, handed to the process by environment from a secret reference, never by argument. The adapter reads no auth file of the harness | Decision 6; R9 F16; R11 T-35 |
| Tier and terms row: Tier 1 and Tier 2, **fleet only, unknown terms** (status `SILENT`). Under the audience `distributed` the harness is never a default and never picked automatically; a launch that names it states "unknown terms" and the doctor warns. A login of the harness that reuses a subscription token is Tier 3 and refused | R8 F-P4; R8v; decision 17; rulings 2, 59, 60 |
| A model configuration that makes a gateway reject the call surfaces as a misleading model error. The doctor cannot check it; the specification lists it as a known failure, `unverified` | R9 F20 |
| Context window: declared or read from the harness's model list; the smaller of the declared and the effective value | Principle IX; R9 F18 |

#### 5. Contracts

| Depends on (feature 100) | Version |
|---|---|
| EP-02 harness port and harness descriptor, levels `proposer` and `completion` (first form, tool-less) | `specstride.harness/1`, `descriptorVersion: 1` |
| EP-02 sub-point stream readers; the dialect table of the JSONL reader | `specstride.harness/1`; `specstride.stream-dialect/1` |
| EP-12 quota classifier | `specstride.quota-classifier/1` |
| EP-10 secret resolver; EP-11 terms-gate data | `specstride.secret-resolver/1`, `specstride.terms/1` |
| EP-14 doctor check registry | `specstride.doctor/1` |
| EP-08 event sink (the compatibility projection of the reader's events) | `specstride.event-sink/1` |
| Redactor (text and tool summaries pass it) | `specstride.redaction/1` |
| Containment levels | annex C |
| Stop reasons; result record of the pass loop (code 127) | `specstride.stop-reason/1`; annex E |
| Event envelope | `specstride.event/1` |
| Environment alias table of the normalization contract | `specstride.oracle-normalization/1` |

**Owns (content):** the prime descriptor, its classifier entries, its recorded fixtures; **the JSONL
reader for stream schema v3 and the dialect table** (`specstride.stream-dialect/1`), of which 134 owns
one row. No extension point.

#### 6. Divergence register rows and pending decisions

| Id | What the brief proceeds on |
|---|---|
| Ruling 32, 32b (DP-083) | The adapter is a Wave 1 feature; its 62 items are release-blocking parity items |
| DV-064 | The open registry; stub executables named after the as-is commands |
| DV-007 | The reader's events are rows of the compatibility projection; the projection is compared, not the primary stream |
| DV-010, ruling 7 (DP-035) | The as-is flag that switches sessions off stays under the `parity` profile; the comparator asserts that no invocation carried a continuation argument |
| DV-027 | The as-is variables stay as aliases |
| DV-030, ruling 34 (DP-008) | No containment as today under the `parity` profile; C0 by opt-in otherwise |
| Ruling 60 (DP-025) | Never picked automatically as a critic while its terms are unknown |
| Ruling 66 (DP-030) | Notional cost under a subscription |
| Ruling 67 (DP-006) | macOS is `unverified` |
| **Point 1, row to be written** | The critic in JSON mode outside the `parity` profile changes the argument list of a critic call. It is not observable in the oracle, which runs the `parity` profile. The register's owner assigns the number |
| **Point 2, candidate for `CLARIFY-QUEUE.md`** | What "fleet only" makes the terms gate do. Recommended answer: as in section 4. It is the same question as point 3 of brief 130 |

#### 7. Requirement groups and estimate

| Group | Content | Est. |
|---|---|---|
| G1 | Detection, version pin, descriptor, tier and terms row, doctor checks | 4 |
| G2 | Proposer: invocation, the qualifier, modes, continuation, containment | 7 |
| G3 | Critic: the flag set, the proof, JSON mode outside the `parity` profile | 5 |
| **G4** | **The JSONL reader for schema v3 and the dialect table** | 12 |
| G5 | The terminal record decides; error classes, quota entries, usage, telemetry off | 6 |

Total: about 34. If `speckit-specify` yields more than about 45, G4 leaves first, as the reader of
the family.

#### 8. Tests required

| Kind | Content |
|---|---|
| Parity | Every fixture that names this harness, through the stub executables: FX-26 (the stream through the seam: events, fallbacks, output lines, terminals), FX-01 (argument list, stdin, environment names), FX-06 and FX-07 (critic transport and configuration errors), FX-18 (a pass that fails before the harness starts) |
| Conformance | The adapter conformance suite of 109 with a fake binary; the reader's own suite: recorded streams replayed, each with the expected normalized records; the same suite run with the dialect `pi` (the fixtures come from 134) |
| Own tests | A stream with exit 0 and an error terminal is a failed call; a stream with exit 0 and no terminal is `stream.missing_terminal`; a tool record in a critic stream halts the run; a launch with this harness as proposer and no C0 opt-in is refused; the environment of a launched process holds the telemetry switches |
| Fixture captures before the specification freezes | (1) one recorded stream of a proposer pass and one of a critic call on the pinned version, to confirm the record set of B-2250; (2) the record and the exit code when a provider limit is reached; (3) whether the initial record states the tool list; (4) the resume flag inside a session directory in print mode. Each is a scripted capture or one small call, allowed only as an explicitly authorized probe, and is logged |
| Live | One logged probe per role; no other paid call |

Success criteria this feature carries:

| Criterion | Measure |
|---|---|
| The terminal record decides | No fixture in which the process exits 0 after a provider error ends as a success |
| Parity of both roles and of the reader | Every parity test of the 62 items passes, or is `waived` by a register row |
| One reader, two harnesses | The recorded streams of prime and of pi pass the same reader; the only difference is the dialect row |
| The harness reports nothing about the consumer | The environment of every launched process holds the telemetry switches, in every fixture |
| Provider and harness facts are dated | Every fact carries a `verified-on` date and the version pin |

#### 9. Constitution principles that bind it

VII, VIII, IX, X, XI, XII, V, XVIII.

#### 10. Research that supports it

R9 (F1, F3 to F7, F10, F14 to F20), R18 (the reader's items, Appendix A), R14 (B12, B16, rules 6 and
7), R8 (F-D2 to F-D4, F-P4), R8v, R11 (R-2, T-17, T-34), R1 (the package that is not taken), R20.

#### 11. Constraints

Owner-set constraints, for the spec's `## Constraints` section:

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| The adapter is specified against the harness seam exactly as the Claude adapter is: descriptor, optional code hooks, recorded fixtures | `architecture.md` section 14; roadmap |
| Every parity test of this harness passes before any release | Ruling 32 |
| pi and prime share one JSONL reader with a dialect table | Ruling 32b |
| No name of a launcher, variant, model or gateway that is specific to the owner's machines appears in the specification | BRIEF-COMMON, naming rule; R9 open question 7 |

**What belongs in `plan.md` instead:** libraries and their versions, the package and file layout, physical paths behind logical names, the test runner, bundling, and the spelling of internal functions. `spec.md` describes behaviour and names none of them. For this feature also: the exact flags and variables of the harness, with their version pin.

---

### 126-stream-seam-and-invocation

Directory: `specs/126-stream-seam-and-invocation`. Tier 2. Estimated requirements: 30.

#### 1. Scope

**In scope.** Reading what a harness emits: the registry of stream readers by format; the normalized
records (`init`, `text`, `tool`, `usage`, `error`, `terminal`); synthesis of `init` and `terminal` for
a text stream; the data stream mapping; the tap and its pass-through mode; fallbacks when a stream is
missing or malformed; invocation identity, the invocation envelope and result, reconciliation of a
finished invocation, finalization, and retention of streams and transcripts.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| Starting and stopping the harness | 109; the adapters 125, 130, 131, 134, 138 |
| The events written from stream records | 111 (schema); this feature emits them |
| Shipping to a collector | 128 |
| Watchdogs that read stream activity | 118 |
| The JSONL reader for stream schema v3 and its dialect table | 138; the row of pi is 134's. The reader registers in this feature's registry |
| The stream mappings of dsh (a text stream) and of Codex (JSONL events), as data | 130, 131 |
| Stream readers for harnesses of later waves | Roadmap |

#### 2. As-is requirements received

None as a requirement: of 173 items two are stated by an as-is requirement, both as part of
028 FR-022 (owned by 128).

Behaviour inventory received, as assigned in `traceability-items.tsv` (the authority): **212 items in 32
clusters**.

| Source module | Clusters | Items | ported | translated | superseded-by |
|---|---|---|---|---|---|
| `agent_stream.py` | C-146 to C-154 | 84 | 47 | 37 | 0 |
| `proposer.sh` | C-051 to C-053, C-055 to C-056, C-058 | 40 | 19 | 18 | 3 |
| `invocation_result.py` | C-163 to C-166 | 38 | 32 | 6 | 0 |
| `stream_seam.py` | C-191 to C-194 | 29 | 25 | 4 | 0 |
| `finalize_invocation.py` | C-155 to C-162 | 20 | 9 | 11 | 0 |
| `specstride-lib.sh` | C-022 | 1 | 1 | 0 | 0 |
| **Total** | | **212** | **133** | **76** | **3** |

The reader of prime's stream (41 items of `prime_stream.py`) is in 138 and is not in the table. No item is
deferred (owner ruling 32).

#### 3. Merge rule

Only 028 contributes behaviour. Lisa's stream tap is reference for the mapping. Preserved defects:
pass-through mode strips whitespace and drops blank lines (D-54); for a harness that emits no terminal
record a crashed pass reads as clean (D-48) in compatibility behaviour, while the new event
`stream.missing_terminal` makes it visible.

#### 4. New requirements from research and owner decisions

| Subject | Source |
|---|---|
| A registry from stream format to reader; `stream.format` is an open set; a mapping given as data is enough for a new format | EP-02 sub-point; R15v P-10 |
| Truthful stream: `stream.missing_terminal` when a stream ends without a terminal record; a pass that exits 0 having done nothing is flagged; unknown values are `null` | EV-31; Principle XI |
| Hostile streams: only the harness's own framing is parsed; tool output never becomes a stream record; size and rate caps per line; a violation emits `stream.diagnostic` | EV-33; R11 T-17 |
| Every record inside a pass carries the session id; subagent activity carries the parent session id; `pass.ended` records a transcript reference by path and hash, never content | EV-02 |
| `usage.reported` per model call as it completes; a killed pass ends with `usageComplete=false`; a harness that reports none emits `usage.unavailable` | EV-03, EV-16, EV-17 |
| `tool.call` with category and duration; the time breakdown of a pass; the first productive edit | EV-04 |
| Text from a stream enters through the one ingress, redacted and size-capped | LR-9; EV-32 |
| The stream and its projection stay byte-identical to the baseline on the oracle's fixtures after normalization | Principle XI; N-12, N-14 |
| Retention of streams and transcripts is bounded and recorded | R18 (invocation modules) |
| With parallel units on, several streams are read at once inside the engine process. Every record of a worker carries `workerId` and `wseq`; the order of records is 142's rule and the fields are 111's | R29 PU-57 |
| For a harness whose process exits 0 on a provider error, the terminal record decides the outcome of the call | R9 F5 |

#### 5. Contracts

| Depends on (feature 100) | Version |
|---|---|
| EP-02 harness port, sub-point stream readers | `specstride.harness/1` |
| Event envelope | `specstride.event/1` |
| Redactor | `specstride.redaction/1` |
| State layout (pass directory, stream, invocation record) | `specstride.layout/1` |
| EP-08 event sink (the compatibility projection of stream events) | `specstride.event-sink/1` |

**Owns (content):** the stream-reader registry and the normalized record set, as the sub-point of
EP-02; the invocation record.

#### 6. Divergence register rows and pending decisions

| Id | What the brief proceeds on |
|---|---|
| DV-007 | The projection of stream events is compared, not the primary stream (N-12, N-13, N-14) |
| DV-083, DP-029 (ruling 43) | Events hold references and no content. Content for telemetry is captured whenever traces are on and passes the redaction point (111, 128) |
| DP-083 (rulings 32, 32a, 32b) | The readers and mappings of dsh, Codex, pi and prime are Wave 1, in 130, 131, 134 and 138 |

#### 7. Requirement groups and estimate

| Group | Content | Est. |
|---|---|---|
| G1 | Reader registry, normalized records, data mapping | 9 |
| G2 | Tap, pass-through, fallbacks, truthfulness | 9 |
| G3 | Invocation identity, envelope, reconciliation, finalization, retention | 12 |

Total: about 30.

#### 8. Tests required

| Kind | Content |
|---|---|
| Parity | FX-26 (stream formats through the seam: event vocabulary, fallbacks); stream events of FX-01, FX-18, FX-20 |
| Conformance | Recorded streams replayed through each reader; a sample reader given as data only, from the test tree |
| Own tests | A stream that imitates a terminal record inside tool output; a line over the size cap; a pass killed mid-stream keeps its partial usage |

Success criteria this feature carries:

| Criterion | Measure |
|---|---|
| Every pass is accounted for | 100 % of passes carry complete usage or an explicit `usage.unavailable` (experiment X0) |
| A new stream format needs no code | The data-only sample reader passes the conformance suite |

#### 9. Constitution principles that bind it

XI, V, VII, VI, XVIII.

#### 10. Research that supports it

R18 (F-11, Appendix A), R14 (EV-02 to EV-04, EV-16, EV-17, EV-31, EV-33), R5, R20, R11 (T-17), R21, R21v, R1.

#### 11. Constraints

Owner-set constraints, for the spec's `## Constraints` section:

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

**What belongs in `plan.md` instead:** libraries and their versions, the package and file layout, physical paths behind logical names, the test runner, bundling, and the spelling of internal functions. `spec.md` describes behaviour and names none of them.

---

### 110-config-and-terms

Directory: `specs/110-config-and-terms`. Tier 2. Estimated requirements: 47, above the split mark; if it
splits, the terms gate leaves first.

#### 1. Scope

**In scope.** The content of the config schema: every key, its type, default, the layers that may set
it and its trust class; the precedence order with its extended ranks; per-phase overrides for proposer
and critic; the narrow-only rule for project configuration; environment aliases of the as-is variable
names; the generic `--set`; provenance of every effective value and `config show`; secret references
and the three resolvers; auth tiers; the audience; the terms gate and its data; launch defaults.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| The config envelope, the ranks as a contract, the trust classes as a contract | 100 |
| The run snapshot and its replay on resume | 102 |
| Budgets, quota, pause, fallback | 127 |
| Role resolution and the harness descriptor | 124, 109 |
| Doctor checks on configuration | 112 |
| The learning mode's meaning | 106 |

#### 2. As-is requirements received

| As-is id | Behaviour (short) | Disposition | Proof |
|---|---|---|---|
| 002 FR-006 | Launch defaults: one model for proposer and critic, verification `off` | superseded-by DV-043 | Register rows DV-043 (028 FR-020 wins for verification) and DV-004 (decision 13 for the roles) |

Behaviour inventory received, as assigned in `traceability-items.tsv` (the authority): **25 items in 14
clusters**.

| Source module | Clusters | Items | ported | translated | superseded-by |
|---|---|---|---|---|---|
| `.env.example` | C-001 to C-002 | 10 | 0 | 0 | 10 |
| `specstride_env.py` | C-003 to C-004 | 4 | 0 | 0 | 4 |
| `orchestrator.sh` | C-011, C-013 | 3 | 0 | 0 | 3 |
| `specstride-lib.sh` | C-018, C-021 | 2 | 0 | 0 | 2 |
| `critic.py` | C-061 | 1 | 0 | 0 | 1 |
| `learn.py` | C-095 | 1 | 0 | 0 | 1 |
| `present.py` | C-103 | 1 | 0 | 0 | 1 |
| `specstride` | C-113 | 1 | 0 | 0 | 1 |
| `specstride_spec.py` | C-140 | 1 | 0 | 0 | 1 |
| `agent_stream.py` | C-154 | 1 | 0 | 0 | 1 |
| **Total** | | **25** | **0** | **0** | **25** |

An `env` or flag item goes to the feature that owns the behaviour the setting controls (`traceability.md`
section 1.3). This feature owns the key name, the alias table and the precedence, and receives only the items
about configuration loading itself. Across all modules the inventory holds 226 items of kind `env` and 228 of
kind `cli-flag`; their names are the old side of the alias table (DV-027).

#### 3. Merge rule

| Case | Ruling |
|---|---|
| Layers | Decision 9's order holds between the layers it names. R16's extended order adds three ranks: contract pin > flag > run snapshot (on resume only) > environment > project > user > learned > default (C-25) |
| The install-root `.env` of 028 | Not read; user configuration takes its place; an inline secret is a configuration error (DV-023) |
| The launch contract's configuration of 011 | Derived artifacts, validated; the contract pin is the one rank above flags, for the keys marked as pinnable |
| Lisa's environment-only configuration | Dropped as a layer; its provider chain becomes the per-role fallback (127) and its budgets become budget keys (127) |
| Launch defaults | 028's verification default and decision 13's roles win over Lisa's |
| Per-harness variable names of 028 | Survive as aliases only |
| Which keys project configuration may set | The stricter list of R11 T-13 (C-24) |

#### 4. New requirements from research and owner decisions

| Subject | Source |
|---|---|
| Precedence: flag > environment > project `specstride.yaml` > user configuration > detected default, with per-phase overrides | Decision 9 |
| The schema of R16 F6, strict: an unknown key is an error with a suggestion | R16 |
| Project configuration may narrow a run and never widen it; a widening key is ignored with a launch message and a doctor warning | DP-009; C-24; R11 R-4 |
| Secrets only as `env:`, `file:` or keychain references; resolved at the moment of use; passed by environment or stdin and never by argument list; written to no state, event, log or launch contract; sent only to the bound host | Decision 6; EP-10; R11 T-16, T-35 |
| Resolver operations `handles`, `exists`, `resolve`, `boundHost`; errors `missing`, `inline-secret`, `unsafe-file`; on Linux the keychain existence check reads `unprobed` until a query that prints nothing is found | EP-10; R16 |
| Auth tiers: Tier 1 the installed harness CLI under the user's own login; Tier 2 an official SDK or API key; Tier 3 refused for every provider at release, with the explanation | Decision 6; DP-020 |
| Two audiences, `personal` and `distributed`. **The package ships with `distributed` as its default**; the owner sets `personal` once in user configuration. No project key and no comment changes the audience | Rulings 1, 2; DP-042, DP-057; C-33 |
| For `distributed`, Tier 2 is the default for the three providers R8v downgraded, and Tier 1 for them is an opt-in marked "personal use only" | R8v; decision 19 |
| Terms-gate data: rows of provider, auth tier, audience, status, source, access date, quoted sentence, `verified-on`; one evaluation function that returns the decision and the row; a newer data file in user-level state replaces the shipped one | EP-11; R8 |
| The gate is evaluated at launch, at role resolution and at every fallback switch; no comment, flag, mode or project key bypasses it; a front harness is gated by its back end's row | EP-11; decision 18; R8 |
| No row means unknown terms: Tier 1 and Tier 2 with a warning; data older than 30 days is a doctor warning | Decision 17; DP-020 |
| Every switch of the product is ordinary configuration; the `parity` profile sets them | LR-10 |
| Telemetry endpoints, content capture, containment level, critic selection and budget increases are user-scope keys | R11 T-13, T-36 |
| `state.dir` becomes a user-scope key for the control root | DP-071 |
| **Keys of the options the owner added**, each ordinary configuration with a default and a value under the `parity` profile: `loop.parallel.units` (off; off), `loop.parallel.workers` (2, ceiling 4), `loop.parallel.quota_headroom` (70 %), `loop.parallel.allow_detect` (off), `verification.parallelism` (1, ceiling 4; 1), the tier bump with its K and its ladder (off; off), the check points of staleness (launch, resume and pass start; critic start), content capture (follows traces; off), the transport of an adapter (subprocess; subprocess) | Rulings 20, 43, 48, 56, D2, P2, K3; LR-10 |
| Widening keys, accepted from user scope, environment or flags only: `loop.parallel.allow_detect`, the opt-in to containment C0, the plugin allowlist of a harness, the launcher path of a harness, the transport of an adapter, a declared write scope of a task. Project configuration may remove a task from eligibility and narrow a scope | Rulings 35, P2; R29 PU-12 |
| **Terms rows of the Wave 1 adapters.** Claude and Codex: Tier 1 for the audience `personal` (Codex with conditions), Tier 2 for both; for `distributed` Tier 2 is the default and Tier 1 an opt-in marked "personal use only". The Agent SDK: Tier 2 with API keys. pi: gated by the row of the back end in use; its OAuth path of a Claude subscription is Tier 3 and refused. dsh and prime: status `SILENT`, fleet only, unknown terms | R8v; rulings 1, 20, 59, 70 |

#### 5. Contracts

| Depends on (feature 100) | Version |
|---|---|
| Config envelope, ranks, trust classes | `specstride.config/1` |
| EP-10 secret resolver; EP-11 terms-gate data | `specstride.secret-resolver/1`, `specstride.terms/1` |
| Table evaluator (the terms gate is a pure table) | `specstride.table/1` |
| Redactor (a resolved secret registers with it) | `specstride.redaction/1` |
| Environment alias table of the normalization contract | `specstride.oracle-normalization/1` |
| The `parity` profile | `specstride.profile/1` |
| Run snapshot | `specstride.snapshot/1` |

**Owns (content):** the content of the config schema; EP-10; EP-11.

#### 6. Divergence register rows and pending decisions

| Id | What the brief proceeds on |
|---|---|
| DV-023 | The install-root `.env` is not read |
| DV-025, DV-026 | The learned value's place and the contract pin are kept and named |
| DV-027 | Config keys with the as-is variable names as aliases; mapped |
| DV-068, DP-009 (ruling 35) | Narrow-only project configuration |
| DV-048, DP-042 (ruling 1), DP-057 (ruling 2) | Terms gate per audience; fixtures declare `personal` |
| DV-003, DP-020 (ruling 59) | Tier 3 ships refused |
| DV-004, DV-043 | Default roles and default verification mode |
| DP-058 (ruling 10) | Three ranks beyond decision 9 |
| DP-022 (ruling 59) | A harness with no Tier 1 is Tier 2 only |

#### 7. Requirement groups and estimate

| Group | Content | Est. |
|---|---|---|
| G1 | Schema content and defaults, the keys of the options and their `parity` values | 14 |
| G2 | Precedence, per-phase overrides, trust classes, aliases, provenance | 10 |
| G3 | Secret references and resolvers | 8 |
| **G4** | **Auth tiers, audience, the terms gate and its data, the rows of the Wave 1 adapters** | 15 |

Total: about 47. **If it splits, G4 leaves first** (R15 A-9.2), into a feature for the terms gate.

#### 8. Tests required

| Kind | Content |
|---|---|
| Parity | Every fixture drives both implementations with the same variables through the alias table; FX-13 for replayed keys; FX-29 for the learned value's place |
| Characterization | None for Lisa: its layer is dropped |
| Conformance | EP-10: the canary test and a sample resolver for a test scheme. EP-11: table tests generated from R8v's corrected matrix; a row for a fictional provider in a test overlay changes the decision with no code change |
| Own tests | A project file that declares a harness, a critic, an endpoint or a telemetry address is ignored with a message; an inline secret refuses the launch |

Success criteria this feature carries:

| Criterion | Measure |
|---|---|
| Every effective value has a source | `config show` names the layer of each key, and the run record holds the same |
| No secret at rest | The canary test finds no secret value in any state file, event, log, launch contract or argument list |
| The terms gate cannot be bypassed | No comment, flag, mode or project key changes a refused decision |

#### 9. Constitution principles that bind it

XII, VI, VII, XIII, VIII, XV.

#### 10. Research that supports it

R16 (F5, F6, F7), R8, R8v, R11 (T-10, T-13, T-16, T-18, T-35, R-4), R19 (C-25), R20, R6, R7, R9, R29.

#### 11. Constraints

Owner-set constraints, for the spec's `## Constraints` section:

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| The project file is `specstride.yaml`; the user file is `~/.config/specstride/config.yaml` | Decision 9 |
| Provider terms are judged for personal use and for a distributed product; anything allowed for personal use only is off by default | Decision 19 |

**What belongs in `plan.md` instead:** libraries and their versions, the package and file layout, physical paths behind logical names, the test runner, bundling, and the spelling of internal functions. `spec.md` describes behaviour and names none of them.

---

### 127-quota-budgets-and-pause

Directory: `specs/127-quota-budgets-and-pause`. Tier 2. Estimated requirements: 36.

#### 1. Scope

**In scope.** The quota classifier and its classes; the confirming probe; the quota pause as a state
of a live run, its record, its resume at the window reset and its ceiling; the opt-in fallback order
per role and what a switch does; budgets per role and per run, with the whole-run wall-clock budget of
the baseline among them; how spend is counted the same way across providers; the spend ledger; hard caps with API keys and observation-based alerts with
subscriptions; alerts, their levels and their delivery; notional cost.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| A harness's own classifier entries | Its adapter: 125, 130, 131, 134, 138. The `failures` map of a descriptor is 109 |
| The pause of a group of parallel units and the headroom check before a group | 142. It uses this feature's pause record, classes and caps |
| The terms gate that gates a fallback again | 110 |
| Usage events as a schema | 111 |
| Display of budget levels | 129 |
| Host hooks that show an alert | 113 |
| Lisa's scheduler, in which its budgets sat | Roadmap |

#### 2. As-is requirements received

| As-is id | Behaviour (short) | Disposition | Proof |
|---|---|---|---|
| 002 FR-041 | Budget evaluation over four ceilings; 0 is off | translated | Characterization through mapping: the ceilings become budgets per role |
| 002 FR-042 | Budget ledger persisted atomically; an unreadable ledger loads as zero usage | translated | Characterization through mapping; the unreadable case is fixed (DV-063) |

Behaviour inventory received, as assigned in `traceability-items.tsv` (the authority): **6 items in 5
clusters**.

| Source module | Clusters | Items | ported | translated | superseded-by |
|---|---|---|---|---|---|
| `orchestrator.sh` | C-007, C-009 to C-010, C-012 to C-013 | 6 | 4 | 2 | 0 |
| **Total** | | **6** | **4** | **2** | **0** |

The baseline has no quota handling: a quota failure counts as a provider error (B-0594, B-0131, B-0147). The
items assigned here are the whole-run wall-clock budget of the baseline.

#### 3. Merge rule

| Case | Ruling |
|---|---|
| Budgets | Lisa wins: 028 and 011 have time and count budgets and no cost budget. Lisa's budgets get a new input type, since theirs is the scheduler job that is not taken |
| An unreadable ledger | Lisa's behaviour is unsafe for a hard cap and is fixed: it never resets spend (D-33) |
| A quota failure | Decision 8 replaces today's path of consecutive errors, exit 4 and a relaunch (C-23) |
| Relaunch budget of 011 | Untouched by a pause; owned by 123 |
| Whole-run wall-clock budget of 028 | Ported as it is: 0 means unlimited, exit 4 with `wall_budget`. It is the one budget the baseline has at run level, so `traceability-items.tsv` assigns it here |

#### 4. New requirements from research and owner decisions

| Subject | Source |
|---|---|
| Classes: `quota_window`, `quota_credit`, `rate_limit_transient`, `overload`, `auth`, `context_window`, `agent_failure`, `provider_other`, `budget_cap`; each classification carries a confidence (`structured`, `status`, `text`, `stall`), a reset time or `null`, and `retryable` | EP-12; R14 |
| Operations `classify` and `observe`; a source `host` for limits that the host sees | EP-12; R15v P-10 |
| The engine acts on the class only; a `text` or `stall` classification pauses only after a confirming probe | EP-12 |
| A quota pause is a state, never a stop: it spends no reject, iteration, MALFORMED, error, wall-clock or relaunch budget; the attempt is not counted as a rejection | Decision 8; DP-028; C-23 |
| The pause has a ceiling, default 24 h and configurable; at the ceiling the run rests with the stop reason `paused_quota_ceiling` | DP-068 |
| A pause holds while the runtime lives; after a wake the resume time is recomputed from the record | DP-085; R14 risk 10 |
| A quota pause on the critic is the same state | R15 A-6.2 |
| Fallback: opt-in, per role, from user scope; each switch is gated by the terms gate, recorded, and announced; the loudest alert is a switch from subscription to API key | Decision 8; R14; LR-8 |
| With an API key, budgets are hard caps enforced at safe boundaries, with alerts before they are reached; with a subscription the budget is an alert on what the product can observe, and the provider's limit signal is the trigger to pause | Decision 8; R14 |
| Cost is reported only where the harness reports it, `null` otherwise; increments, not cumulatives; a billing mode on every record; the figure under a subscription is labelled notional and kept apart from real spend | DP-030; R14 |
| Spend of a harness that reports no cost cannot be measured; a wall-clock cap applies and the doctor says so | R11 T-18 |
| The engine is the only source of alerts; host hooks, the digest, `status` and the doctor are readers | R14; `architecture.md` section 12 |
| `credit`, failed authentication and a hard cap lead to `blocked-on-human` | R15 A-6.2 |
| An exhausted quota on an escalation target means skip, not pause | DP-032 |
| Events `quota.signal`, `run.paused` with the resume time, `run.resumed`, `alert`, `budget.exceeded`, `fallback.switched`, `fallback.restored` | EV-11, EV-25, EV-30 |
| The digest says "observed by Specstride only" for a subscription shared with interactive use | R14 risk 11 |
| One pause record and one pause event cover a run, whatever the number of live harness processes. With several live, a hard cap is evaluated on their sum at every usage record | R29 PU-38; R29v PU-88 |

#### 5. Contracts

| Depends on (feature 100) | Version |
|---|---|
| EP-12 quota classifier | `specstride.quota-classifier/1` |
| Pause record | `specstride.pause/1` |
| Run-state machine (`paused-quota`, `blocked-on-human`) | `specstride.run-state/1` |
| Stop reasons (member 15) | `specstride.stop-reason/1` |
| Table evaluator | `specstride.table/1` |
| Resolved registry and role plan (fallbacks) | `specstride.registry/1` |
| EP-11 terms-gate data | `specstride.terms/1` |
| Inbox request types (host events) | `specstride.inbox/1` |
| Event envelope | `specstride.event/1` |

**Owns (content):** EP-12 (the class set, the default text classifier, the rules); the pause record;
the spend ledger.

#### 6. Divergence register rows and pending decisions

| Id | What the brief proceeds on |
|---|---|
| DV-005, DP-028 (ruling 27) | Quota pause as a run state; not observable in the parity suite, since stubs emit no quota signal; own tests |
| DV-063 | An unreadable ledger never resets spend |
| DP-068 (ruling 28) | Ceiling 24 h and a fifteenth stop reason |
| DP-030 (ruling 66) | Notional cost |
| DP-032 (ruling 47) | Skip the escalation |
| DP-025 (ruling 60) | A mandatory cap for an automatically picked metered critic |
| DP-085 (ruling 28) | A pause does not outlive a reboot |
| DP-003 (ruling 62) | On a host without host hooks, alerts reach the consumer through `status`, the digest and the doctor |
| R14 open questions 4, 5 | Quota signals of harnesses other than Claude, and Claude's limit event on the CLI stream, are `unverified`. For dsh, Codex, pi and prime the adapter features capture them before their specifications freeze; until then a classification by text pauses only after the confirming probe |

#### 7. Requirement groups and estimate

| Group | Content | Est. |
|---|---|---|
| G1 | Classifier: classes, confidence, probe | 8 |
| G2 | Pause, resume, ceiling | 8 |
| G3 | Fallback | 6 |
| G4 | Budgets, spend ledger, caps over several live processes, alerts, notional cost | 14 |

Total: about 36.

#### 8. Tests required

| Kind | Content |
|---|---|
| Parity | FX-23 (the whole-run wall-clock budget: exit 4, `wall_budget`). No fixture triggers a pause; FX-18 proves that consecutive errors of other classes still take the old path |
| Characterization | Lisa's budget evaluation and ledger as extracted, with the fixed unreadable case |
| Conformance | EP-12: classifier fixtures per tested harness; a declared map for a fake harness pauses a fixture run |
| Own tests | A pause that reaches the ceiling; a fallback from subscription to API key raises the loudest alert and is gated by the terms gate; a hard cap stops at a safe boundary |

Success criteria this feature carries:

| Criterion | Measure |
|---|---|
| **A quota exhaustion pauses the run without adding to the reject count** | In the conformance fixture the run enters `paused-quota`, resumes at the reset, and reject count, iteration count, MALFORMED streak, error count, wall-clock budget and relaunch budget are unchanged |
| Alerts are loudest with an API key | Every switch from subscription to API key produces an alert of the highest level before the first call on the key |
| A hard cap holds | Recorded real spend never exceeds the cap by more than one model call |

#### 9. Constitution principles that bind it

XII, XIII, V, I, VIII.

#### 10. Research that supports it

R14, R8v, R1, R1v, R19 (C-23), R25, R11 (T-18), R3 (host hooks as a mechanism), R15 (A-6).

#### 11. Constraints

Owner-set constraints, for the spec's `## Constraints` section:

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| Subscription quota is the main budget; Tier 1 is the default for the audience `personal` | Decision 6 |
| A pause resumes when the window resets and is never counted as a rejection | Decision 8 |

**What belongs in `plan.md` instead:** libraries and their versions, the package and file layout, physical paths behind logical names, the test runner, bundling, and the spelling of internal functions. `spec.md` describes behaviour and names none of them.

---

### 111-event-schema-and-projection

Directory: `specs/111-event-schema-and-projection`. Tier 2. Estimated requirements: 47, above the split
mark; if it splits, the compatibility projection leaves first.

#### 1. Scope

**In scope.** The content of the one event schema: event types, their fields, lifecycle pairs, ids;
the primary file writer, which is core and not replaceable; the requirements EV-01 to EV-34; the
redaction ingress for every text that enters from outside the runtime, with the widened redaction
patterns and their canary test; the observability policy of the
baseline (what is recorded, and at which level); the event-sink contract; the compatibility projection: a table-driven sink that renders the old vocabularies into a separate file.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| The envelope and the versioning rules | 100 |
| The OTLP exporter, the Loki sink, metrics, the switch of content capture | 128. The redaction of what is captured is here |
| `RunView` and `status` | 129 |
| Compatibility **output lines** on stdout and stderr | 119, 123 |
| Emission of each event | The feature that owns the behaviour; this feature owns the definition |
| The event delivery dispatcher | Roadmap (`deferred`) |

#### 2. As-is requirements received

| As-is id | Behaviour (short) | Disposition | Proof |
|---|---|---|---|
| 002 FR-023 | Best-effort emission: a v2 journal record plus a v1 line | translated | Characterization through mapping: the pattern becomes the compatibility projection |

Behaviour inventory received, as assigned in `traceability-items.tsv` (the authority): **38 items in 9
clusters**.

| Source module | Clusters | Items | ported | translated | superseded-by |
|---|---|---|---|---|---|
| `observability_policy.py` | C-167 | 21 | 21 | 0 | 0 |
| `orchestrator.sh` | C-007, C-011, C-013 | 7 | 3 | 4 | 0 |
| `specstride-lib.sh` | C-020, C-022 | 6 | 5 | 1 | 0 |
| `critic.py` | C-061, C-066 | 3 | 2 | 1 | 0 |
| `proposer.sh` | C-052 | 1 | 0 | 1 | 0 |
| **Total** | | **38** | **31** | **7** | **0** |

An `event` item stays with the feature that owns the behaviour that emits it. Across all modules the inventory
holds 174 items of kind `event`, with 62 event names; each is a row of the projection table that this feature
owns (DV-007).

#### 3. Merge rule

| Case | Ruling |
|---|---|
| Vocabulary | One new schema is primary; 028's v1 lines and 011's labelled lines are reproduced by the projection; Lisa's mixed file is not kept (C-06) |
| Lisa's journal | Its "one emit, two encodings" idea becomes the projection sink, written to a separate file |
| String-typed values, duplicate keys, two `run_stop` lines for one stop | Preserved in the projection; typed in the new schema (D-25, D-26, D-39) |
| The event field `task` of 028 | Becomes `project` in the new schema; `task` is kept in the projection |
| Lisa's claim of CloudEvents compatibility | Dropped (D-17) |
| Best-effort emission | All three agree; kept as Principle V |

#### 4. New requirements from research and owner decisions

| Subject | Source |
|---|---|
| One versioned schema for the whole product | Decision 11 |
| EV-01 to EV-34 as acceptance criteria, which cover the 20 telemetry gaps of the time-use baseline and what the run view needs | R14; R21; R13 |
| `seq` monotonic per run and gapless, assigned by the single writer under the run's append lock; at any moment one process writes a run's event file | EV-21; LR-5 |
| Stable ids on every record that has them; every `*.started` has its `*.ended` | EV-22, EV-23 |
| No content in events: prompts, replies, tool arguments and command output are referenced by path, hash and size; free-text fields pass the redactor and are size-capped | EV-32; R11 R-3 |
| One ingress for text from outside the runtime: stream reader, check output capture, critic reply capture, comment capture | LR-9 |
| The redaction point fails closed | R11 R-3 |
| **Content for telemetry.** Prompt and response content is captured whenever traces are on, and the consumer can switch it off. The primary event file still holds references and no content. Content reaches a sink only through the single redaction point; a text that the point cannot treat is not delivered, and its reference is delivered in its place | Ruling 43; DV-083; Principle XI |
| **The redaction patterns are widened.** Those of the baseline are narrow. The pattern set is versioned data, its version is in the run record, and a resolved secret registers with the redactor at the moment of use | Ruling 43; R11 T-32, T-33, R-3; EP-10 |
| **Planted canaries before release.** Canaries of every pattern class are planted in the prompt, the model's reply, tool arguments, tool output, check output, phase evidence and the comment, with content capture on. None may appear in any sink. Passing is a release condition | Ruling 43; `architecture.md` sections 12, 17 and 18 (risk 10) |
| The event types `parallel.*` of parallel units are defined here and project to nothing; the envelope's optional fields `workerId` and `wseq` are absent on the main line | R29 PU-57, PU-58 |
| Events of the owner's rulings: `blocked` names the changed source; a tier bump and its skip; the form of the critic in `critic.call` | Rulings K3, 48, 57 |
| Sinks receive events after the primary writer has written them, already redacted; a slow, failing or dead sink never stalls or fails a run | EP-08; Principle V |
| Third-party event types carry the prefix `x.`; readers ignore unknown fields and types | EP-08 |
| The projection is always on under the `parity` profile and under `compat.legacyEvents`, off otherwise; byte-identical to the baseline on the oracle's fixtures after normalization, with no promise elsewhere | C-06; R14; `architecture.md` section 12 |
| New events with no as-is equivalent project to nothing | N-12; DV-016 |
| Events the layer needs: `microloop.unit`, `check.started`, `check.ended`, `job.*`, `route.decided`, the `strategy` envelope field | R27 D1.13; EV-19, EV-27 |
| The event log is in the control plane, append-only by convention; tampering is detected, not prevented | R11 T-31 |
| The nonce is never written to an event before the critic call returns | R11 T-05 |

#### 5. Contracts

| Depends on (feature 100) | Version |
|---|---|
| Event envelope and versioning | `specstride.event/1` |
| EP-08 event sink | `specstride.event-sink/1` |
| Redactor | `specstride.redaction/1` |
| Identifiers | annex B |
| State layout (events file, projection file) | `specstride.layout/1` |
| Normalization contract (the old vocabulary the projection must match) | `specstride.oracle-normalization/1` |
| Stop reasons (the projection writes `run_stop.reason`) | `specstride.stop-reason/1` |

**Owns (content):** the content of the event schema; EP-08 (the sink contract and the compatibility
projection sink); the redactor.

#### 6. Divergence register rows and pending decisions

| Id | What the brief proceeds on |
|---|---|
| DV-007 | One typed schema; the projection is compared (N-12, N-13, N-14, N-20) |
| DV-016 | Layer events project to nothing in the parity suite |
| DV-067 | The `blocked` event projects to nothing |
| DV-083, DV-069, DP-029 (ruling 43) | Content is captured whenever traces are on and always passes the redaction point. The baseline captures none, so the oracle compares nothing here; the `parity` profile switches capture off |
| DP-074 (ruling 24) | The legacy `run_id` is the engine start id |
| R14 open question 12 | The projection rows must be reconciled with the inventory's event items before this feature is specified |

#### 7. Requirement groups and estimate

| Group | Content | Est. |
|---|---|---|
| G1 | Schema content: types, ids, lifecycle, typed values | 14 |
| G2 | The primary writer, ordering, best effort | 6 |
| G3 | Redaction ingress, the widened patterns, the canary test | 11 |
| G4 | The sink contract | 5 |
| **G5** | **The compatibility projection** | 11 |

Total: about 47. **If it splits, G5 leaves first** (R15 A-9.2).

#### 8. Tests required

| Kind | Content |
|---|---|
| Parity | The projection file on every fixture family FX-01 to FX-36, compared through N-12, N-13 and N-14 |
| Characterization | Lisa's journal pattern as it becomes the projection |
| Conformance | EP-08: a slow sink, a throwing sink and a dead collector leave the outcome and the event file of a fixture run unchanged; a sample sink that keeps events in memory |
| Security | The canary test across every sink, with content capture on and canaries of every pattern class planted in every place text enters |
| Own tests | One test per EV requirement; a torn last line is tolerated by readers |

Success criteria this feature carries:

| Criterion | Measure |
|---|---|
| The 20 telemetry gaps are closed | Each gap of the time-use baseline has an event that a fixture produces |
| Every run ends on record | 100 % of runs have a terminal event, written by the run or synthesized by the next launch |
| A sink never breaks the loop | The conformance fixtures end with the same exit code and event file with and without the failing sink |
| No planted canary reaches a sink | The canary test passes on the release candidate, with content capture on |

#### 9. Constitution principles that bind it

V, XI, I, XVIII, III.

#### 10. Research that supports it

R14, R18 (F-20, Appendix A, C), R19 (C-06), R13, R21, R21v, R11 (T-05, T-31 to T-33), R1.

#### 11. Constraints

Owner-set constraints, for the spec's `## Constraints` section:

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| One event schema and one exporter for the whole product | Decision 11 |

**What belongs in `plan.md` instead:** libraries and their versions, the package and file layout, physical paths behind logical names, the test runner, bundling, and the spelling of internal functions. `spec.md` describes behaviour and names none of them.

---

### 128-telemetry-export

Directory: `specs/128-telemetry-export`. Tier 2. Estimated requirements: 33.

#### 1. Scope

**In scope.** The one OTLP exporter as an event sink; the Loki sink; spans built from lifecycle pairs
at emit time; metrics and their names; optional attribute dialects; delivery status; content capture,
which is on whenever traces are on, can be switched off, and always passes the redaction point; the shipped telemetry stack (dashboard, compose file, collector configuration) as optional assets;
the opt-in for the old metric names.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| The event schema, the primary writer, the redactor with its patterns and their canary test, the sink contract | 111 |
| Usage and cost as events | 111 (definition), 126 (emission) |
| Budgets and alerts | 127 |
| Stream telemetry of a pass | 126 |

#### 2. As-is requirements received

| As-is id | Behaviour (short) | Disposition | Proof |
|---|---|---|---|
| 028 FR-022 | Loki and OTel shipping off by default; default endpoints | translated | Parity through mapping: payloads compared at the stub sink (N-26), FX-31 |

Behaviour inventory received, as assigned in `traceability-items.tsv` (the authority): **191 items in 45
clusters**.

| Source module | Clusters | Items | ported | translated | superseded-by |
|---|---|---|---|---|---|
| `ralph_otel_spans.py` | C-187 to C-190 | 40 | 0 | 40 | 0 |
| `ralph_otel_ship.py` | C-180 to C-186 | 36 | 0 | 36 | 0 |
| `ralph_loki_ship.py` | C-172 to C-179 | 35 | 0 | 35 | 0 |
| `telemetry/ assets` | C-201 to C-208 | 29 | 0 | 29 | 0 |
| `telemetry_delivery.py` | C-195 to C-200 | 20 | 0 | 20 | 0 |
| `orchestrator.sh` | C-006 to C-007, C-012 to C-013 | 12 | 6 | 6 | 0 |
| `proposer.sh` | C-051 to C-052, C-054, C-058 | 9 | 2 | 5 | 2 |
| `critic.py` | C-061, C-066 | 6 | 2 | 4 | 0 |
| `specstride-lib.sh` | C-021 to C-022 | 4 | 4 | 0 | 0 |
| **Total** | | **191** | **14** | **175** | **2** |

#### 3. Merge rule

| Case | Ruling |
|---|---|
| Exporters | Decision 11: one exporter. 028's two shippers are the parity side at the stub sink; Lisa's exporter package is extracted whole, since it separates cleanly, and is the starting point |
| Metric and attribute names | New names `specstride.*`; the old names are an opt-in |
| The default Loki address of 028 | Preserved, although the bundled stack listens elsewhere (D-41) |
| Delivery status | Fixed: OTLP delivery shows as delivered (D-40) |
| Lisa's exporter | It is never called in a Lisa run, so it needs an end-to-end test against a real collector |

#### 4. New requirements from research and owner decisions

| Subject | Source |
|---|---|
| The exporter is a sink: it receives events after the primary writer, already redacted; its failure never stalls a run | EP-08; Principle V |
| Spans are built at emit time from `*.started` and `*.ended`, not reconstructed at ship time | EV-23 |
| **Prompt and response content is captured whenever traces are on.** The consumer can switch it off, from user scope. Traces themselves stay off by default, so a run with default configuration sends nothing | Ruling 43; DV-083; Principle XI |
| The exporter attaches content only after it has passed the redaction point of 111. Content that the point refuses is replaced by its reference (path, hash, size), and the refusal is a delivery record | Ruling 43; R11 R-3, T-32 |
| A release is blocked until the widened redaction patterns pass the canary test on both sinks with capture on | Ruling 43; `architecture.md` section 18, risk 10 |
| The `parity` profile switches content capture off, since the baseline captures none and FX-31 compares payloads | LR-10; DV-083 |
| Telemetry endpoints are user-scope keys; project configuration cannot set them | R11 T-36 |
| Optional dialects for generative-model conventions | R14 |
| A `telemetry.delivery` record for every delivery outcome | EP-08 |
| The doctor shows the endpoint, the content-capture setting and the version of the redaction pattern set | R16 check `telemetry.endpoint`; ruling 43 |
| A context-budget report as an observability artifact | R17 |

#### 5. Contracts

| Depends on (feature 100) | Version |
|---|---|
| EP-08 event sink | `specstride.event-sink/1` |
| Event envelope | `specstride.event/1` |
| Redactor | `specstride.redaction/1` |
| Config envelope and trust classes | `specstride.config/1` |
| EP-10 secret resolver (collector credentials) | `specstride.secret-resolver/1` |

**Owns (content):** the OTLP and Loki implementations of EP-08; the metric names. No extension point
of its own.

#### 6. Divergence register rows and pending decisions

| Id | What the brief proceeds on |
|---|---|
| DV-058 | One exporter, new names, off by default; metric renames and the delivery status are waived on FX-31 |
| DV-083, DV-069, DP-029 (ruling 43) | Content follows traces and passes the redaction point. No oracle rule is needed; the `parity` profile switches capture off |
| D-41 | Default address preserved |
| R14 open question 8 | Attribute names of the generative-model conventions are `unverified`; the dialect is optional |

#### 7. Requirement groups and estimate

| Group | Content | Est. |
|---|---|---|
| G1 | OTLP exporter: spans, attributes, delivery | 12 |
| G2 | Loki sink | 6 |
| G3 | Metrics, dialects, old names as an opt-in | 6 |
| G4 | Content capture, policy, the shipped stack | 9 |

Total: about 33.

#### 8. Tests required

| Kind | Content |
|---|---|
| Parity | FX-31 (shippers against a local sink, payload shapes) |
| Characterization | Lisa's exporter as extracted |
| Conformance | The sink conformance suite of EP-08 on both sinks |
| Own tests | An end-to-end delivery to a real collector; traces on with nothing else set: content is on the spans; capture switched off: no content on any span; capture on: no planted canary on any span or log line |

Success criteria this feature carries:

| Criterion | Measure |
|---|---|
| Off by default | A run with default configuration opens no network connection for telemetry |
| Delivery is visible | Every delivery attempt has a record whose sink label matches what the status surfaces query |

#### 9. Constitution principles that bind it

V, XI, XII, VI.

#### 10. Research that supports it

R14, R18 (F-12), R1, R1v, R11 (T-32, T-36, T-37), R2v (non-code assets).

#### 11. Constraints

Owner-set constraints, for the spec's `## Constraints` section:

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| One OTel exporter for the whole product | Decision 11 |

**What belongs in `plan.md` instead:** libraries and their versions, the package and file layout, physical paths behind logical names, the test runner, bundling, and the spelling of internal functions. `spec.md` describes behaviour and names none of them.

---

### 129-run-view-and-status

Directory: `specs/129-run-view-and-status`. Tier 2. Estimated requirements: 23.

#### 1. Scope

**In scope.** The UI read model `RunView`: the pure projection of events and three named state files,
the reducer, the cursor held by the caller, the canonical serialization; lanes, attention items and
budget levels derived in the contract; the derived states `dead` and `stale`; `specstride status`
with text, `--json` and `--line`; `wait --until-change`; the precomputed status line with its
`validUntil`.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| Every renderer: the terminal follower, the web viewer, the static export | 121, Wave 2 |
| The compatibility output of `status` | 119 |
| The host hook shim that prints the status line | 113 |
| The events and state files it reads | 111, 122, 127 |
| Lisa's server and dashboard | Roadmap |

#### 2. As-is requirements received

| As-is id | Behaviour (short) | Disposition | Proof |
|---|---|---|---|
| 002 FR-017 | `status` reports RUNNING whenever the lock directory exists | superseded-by DV-042 | Register row DV-042: 028's `status` wins, it probes the lock |

Behaviour inventory received, as assigned in `traceability-items.tsv`: **none**. No behaviour item is
assigned to this feature.

The items of `status` are assigned to 119 with the other inspection commands, whose output lines they are.
This feature specifies what `status` reads and derives.

#### 3. Merge rule

| Case | Ruling |
|---|---|
| `status` | 028's behaviour wins: it probes the lock. Lisa's stale-lock RUNNING is dropped (D-07) |
| View model | Lisa's pure builders for lanes and budget burn-down are the design input; none of its code is required |
| Lisa's trajectory paging | Deferred to 121 (002 FR-051, 002 SC-007) |

#### 4. New requirements from research and owner decisions

| Subject | Source |
|---|---|
| `RunView`, schema `specstride.view/1`: `project(events, state files, now)` and `reduce(view, event)`; batch projection equals folding event by event | EP-09; R13 |
| Inputs are the event stream and three named state files: the run record, the lease, the pause record. Nothing else | EP-09 |
| Lanes, attention items and budget levels are derived in the contract, never in a renderer; a renderer never opens the event file | EP-09; decision 11 |
| Lane derivation is a pure table | LR-7 |
| A torn last line is tolerated; an event major outside the accepted range yields a view marked `stale` with the reason | EP-09 |
| Readers derive `dead` and `stale`; they never write them | LR-4 |
| `wait --until-change` prints nothing while nothing changes | R17; EP-01 |
| A status line of at most 170 bytes, precomputed by the runtime, carrying `validUntil` so that a stale line is recognisable | R17; R15v P-13 |
| `attention[]` holds blocked-on-human, a dead run, a quota pause with its resume time, a budget alert | EV-06; R13 |
| A cached snapshot is disposable | EV-34 |
| Fields are additive inside a major | EP-09 |
| Free text in the view passes the redactor | R11 T-33 |
| An attention item for blocked-on-human names what the run needs; for a changed source it names the file | Rulings 29, K3 |
| `status` reports processes that hold the run token of a run whose engine is gone. It reports and never ends them | R29v PU-90 |
| With parallel units on the view gives wall hours and agent hours; with them off it holds no field of the layer | R29 PU-72, PU-04 |

#### 5. Contracts

| Depends on (feature 100) | Version |
|---|---|
| EP-09 `RunView` | `specstride.view/1` |
| Event envelope | `specstride.event/1` |
| Launch record and lease; pause record; terminal record; `supervision.json` | `specstride.lease/1`, `specstride.pause/1`, `specstride.terminal/1`, `specstride.supervision/1` |
| EP-13 lock and liveness (`probe`) | `specstride.lock/1` |
| Run-state machine | `specstride.run-state/1` |
| Table evaluator | `specstride.table/1` |
| CLI protocol and line grammar | protocol 1 |
| Redactor | `specstride.redaction/1` |

**Owns (content):** EP-09. **Single owner of `status` data and default output** (R15v E-3).

#### 6. Divergence register rows and pending decisions

| Id | What the brief proceeds on |
|---|---|
| DV-042 | 028's probe; Lisa's behaviour has no characterization test |
| DV-018 | The strategy in the status line is a layer field |
| DP-004 (ruling 63) | A process that only reads state is not coordination |
| DP-024 (ruling 65) | Status line 60 tokens; one supervision cycle 150 |
| DP-013 (ruling 13) | The dashboard's trajectory material comes from the older Lisa tree, in Wave 2 |

#### 7. Requirement groups and estimate

| Group | Content | Est. |
|---|---|---|
| G1 | `RunView`: projection, reducer, cursor, serialization | 9 |
| G2 | Lanes, attention items, budget levels, derived states | 7 |
| G3 | `status`, `wait`, the status line | 7 |

Total: about 23.

#### 8. Tests required

| Kind | Content |
|---|---|
| Parity | The data behind `status` on FX-28 (its compatibility lines are compared in 119) |
| Conformance | EP-09: golden views from fixture event logs, the oracle's included, and one with a torn line; the prefix property; a sample renderer that takes the view as JSON and is given no file handle |
| Budget | The supervision cycle gate: an unchanged state produces zero bytes, a changed state at most one line within the limit |

Success criteria this feature carries:

| Criterion | Measure |
|---|---|
| Status re-attaches | In a new session, with no knowledge of the run, `status` shows the run's state, phase and attention items from files alone. It is the reading half of the criterion carried by 122 |
| Silence when nothing changes | `wait --until-change` prints zero bytes on an unchanged state |
| One read model | The doctor, `status`, the host hook shim and every later renderer read `RunView` and nothing else |

#### 9. Constitution principles that bind it

I, V, XIX, XIII.

#### 10. Research that supports it

R13, R14 (EV-21 to EV-34), R17, R1, R15 (EP-09), R15v (E-3, E-7, P-13).

#### 11. Constraints

Owner-set constraints, for the spec's `## Constraints` section:

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| Wave 1 specifies the read model and `status`; renderers and the kanban are Wave 2 | Decision 13 |

**What belongs in `plan.md` instead:** libraries and their versions, the package and file layout, physical paths behind logical names, the test runner, bundling, and the spelling of internal functions. `spec.md` describes behaviour and names none of them.

---

### 112-doctor

Directory: `specs/112-doctor`. Tier 2. Estimated requirements: 30.

#### 1. Scope

**In scope.** The doctor as a check registry: the form of a check, severities, the launch-blocking
flag, order, injected probes, message and fix hint; the ground rules (read-only, no paid call, no
secret read, bounded, advisory); the catalogue of 44 checks; the launch preflight as exactly the
launch-blocking subset; output in text and `--json`; flags; exit codes; the entry points on the CLI
and on every host; the invariants of gate integrity checked on a run's event log.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| The checks that a package registers for itself: a harness adapter's `bin`, `auth` and `version` checks, a host's `host.*` checks, the layer's toolchain check | 109 and the adapters 125, 130, 131, 134, 138; 113; 115; 142. They register through this feature's registry |
| Running the launch checks at launch | 123 |
| The host skill that exposes the doctor in Claude Code | 113 |
| `--fix` | Not in Wave 1; the doctor writes nothing |
| The check on the web viewer's endpoint | It is in the catalogue and reports "not running" until 121 exists |

#### 2. As-is requirements received

None. Lisa's doctor has no requirement in 002; mixture-of-loops' nearest behaviour is the `--check` of
its onboarding script, which is superseded with 011 FR-025 (owned by 113); Specstride has no doctor.

Behaviour inventory received, as assigned in `traceability-items.tsv`: **none**. No behaviour item is
assigned to this feature.

What the `--check` of mixture-of-loops' onboarding script checked becomes plugin-installation checks in
`host.*`; its items are `superseded` with the script and are assigned to 113.

#### 3. Merge rule

| Case | Ruling |
|---|---|
| Finding model | Lisa wins as prior art: 028 and 011 are silent. Only the model is extracted |
| Exit codes | Lisa's are replaced: 0 no `fail` finding, 1 the doctor could not run, 2 at least one `fail`, 3 usage error; `--strict` makes warnings exit 2 (C-21). Lisa's documented exit 3 that does not exist is dropped (D-18) |
| Lisa's `--fix` | Deferred; the Wave 1 doctor is read-only |
| mixture-of-loops' `--check` codes 5 and 6 | Not carried |

#### 4. New requirements from research and owner decisions

| Subject | Source |
|---|---|
| The doctor is in scope for every host and on the CLI: one engine function, three exposures | Decision 14 |
| Ground rules: reads and never writes; no model is invoked; presence of a secret reference only, never its value; credential stores are never opened; each subprocess has stdin closed, a time limit and capped output; `--quick` skips subprocess and network checks | R16 F2 |
| The doctor never blocks a run by being unhealthy; the launch preflight is exactly the launch-blocking subset, so the doctor and the launch cannot disagree | R16 F2; EP-14 |
| The catalogue of 44 checks with stable dotted ids in the groups `env`, `cli`, `host`, `bin`, `harness`, `auth`, `model`, `critic`, `terms`, `quota`, `budget`, `config`, `secret`, `run`, `sandbox`, `ui`, `telemetry`, `events`, `memory` | R16 F3 |
| Launch-blocking: `bin.<id>`, `auth.<id>.<role>`, `model.reach.<role>`, `critic.independence`, `terms.gate`, `budget.caps` (for an automatically picked metered critic only), `config.schema`, `secret.inline`, `secret.file`, `sandbox.critic` | R16 F3 |
| `critic.diversity` warns about same-model setups and is never launch-blocking | Decision 7 |
| `harness.version.<id>` warns when the installed version is outside the tested range, and informs when `verified-on` is old | Decision 10 |
| `harness.discovered`, `harness.state.<id>` show tested and unverified harnesses; `critic.autopick` shows the pick that would be made and why each other candidate lost | Decision 17; R20 |
| Checks that per-harness entries produce read the registry; no check enumerates harnesses by name | Decision 17 |
| Healthy output is one line of about 100 bytes; with `fail` findings at most 7 finding lines of at most 200 bytes; the whole doctor skill stays within 1,500 tokens | R16 F4; DP-024 |
| `--json` with schema `specstride.doctor/1`, never a secret value or an account identifier | R16 F4 |
| The doctor names the toolchains a run detected and which of them have pattern sets; it says `protection=detect` where a process of the pass cannot be guaranteed gone | R23v; IR-32, IR-36 |
| The invariants of gate integrity are checked on every run's event log | R27 |
| Platform dependencies outside npm (`git`, process listing tools, the keychain tool) are each probed | `architecture.md` section 6 |
| A probe that times out yields a warning; a check that throws yields exit 1 for the doctor and nothing for a run | EP-14 |
| Checks that the features of the owner's rulings register, each through the registry and none in the core catalogue: the coverage of a critic's deny list (130); the read denial of a critic with read tools (131); the presence of an optional transport's dependency (125); the parallel plan, the containment reason and `worker-caches` (142); the version of the redaction pattern set (111); processes that hold a run token (122) | Rulings 20, 32b, 43, 56, 57, P2; R29v PU-90, PU-97 |

#### 5. Contracts

| Depends on (feature 100) | Version |
|---|---|
| EP-14 doctor check registry; doctor findings | `specstride.doctor/1` |
| EP-09 `RunView` (the run section) | `specstride.view/1` |
| Resolved registry and role plan | `specstride.registry/1` |
| EP-11 terms-gate data; EP-10 secret resolver (`exists`) | `specstride.terms/1`, `specstride.secret-resolver/1` |
| EP-13 lock and liveness (`probe`) | `specstride.lock/1` |
| Config envelope (provenance) | `specstride.config/1` |
| Tripwire record | `specstride.tripwire/1` |
| CLI protocol, exit codes of the doctor | protocol 1 |
| Redactor | `specstride.redaction/1` |

**Owns (content):** EP-14; the core catalogue; the findings schema.

#### 6. Divergence register rows and pending decisions

| Id | What the brief proceeds on |
|---|---|
| DV-041 | Exit codes 0, 1, 2, 3 with a warning exiting 0; no reference in 028 or 011 |
| DP-024 (ruling 65) | Doctor budget 1,500 tokens |
| DP-026 (ruling 61) | A free GET on a models endpoint is allowed |
| DP-057 (ruling 2) | The audience in force is shown |
| DP-006 (ruling 67) | macOS checks are `unverified` |
| R16 open question 1 | The worst case is 10 tokens over the budget; the skill body is trimmed |
| R16 open question 5 | Keychain existence on Linux reads `unprobed` |

#### 7. Requirement groups and estimate

| Group | Content | Est. |
|---|---|---|
| G1 | Registry, check form, ground rules | 8 |
| G2 | The catalogue, by group | 12 |
| G3 | Output, flags, exit codes, entry points | 7 |
| G4 | The launch-blocking subset and the integrity invariants | 3 |

Total: about 30.

#### 8. Tests required

| Kind | Content |
|---|---|
| Parity | None: no reference exists |
| Characterization | The new exit codes; Lisa's finding model as extracted |
| Conformance | EP-14: a sample check registered from the test tree appears in `--json` output, and with the launch-blocking flag it refuses a launch, with no core file changed |
| Own tests | File-access tracing shows no write and no read of a credential store; every check has a fixture for each severity it can return |
| Budget | The golden output gate on the healthy case and the worst case |

Success criteria this feature carries:

| Criterion | Measure |
|---|---|
| **A harness without a tested adapter is shown by the doctor as unverified** | On the descriptor-only fixture the doctor's output names the harness with state `unverified` |
| The doctor and the launch agree | For every fixture, the launch refuses exactly when the doctor reports a launch-blocking `fail` |
| The same-model warning never blocks | A Claude-only setup gets the warning and exit 0 |
| The doctor changes nothing | The state of workspace, control plane and user level is byte-identical before and after |

#### 9. Constitution principles that bind it

XVII, X, XII, VII, XIX, V.

#### 10. Research that supports it

R16, R20, R11 (T-07, T-13 to T-15, T-27, T-29, T-35, T-46), R8v, R14, R3v (C5), R23v, R1.

#### 11. Constraints

Owner-set constraints, for the spec's `## Constraints` section:

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| Entry points: `/specstride:doctor` in Claude Code, the dsh equivalent in Wave 2, `specstride doctor` on the CLI | Decision 14 |

**What belongs in `plan.md` instead:** libraries and their versions, the package and file layout, physical paths behind logical names, the test runner, bundling, and the spelling of internal functions. `spec.md` describes behaviour and names none of them.

---

### 113-host-claude-code

Directory: `specs/113-host-claude-code`. Tier 2. Estimated requirements: 36.

#### 1. Scope

**In scope.** The Claude Code plugin as a thin layer over the published package: the two host skills
`specstride-run` and `specstride-reverse` and the doctor skill; what each skill tells the host model to
do and in which order; modes and the optional comment as the skill takes them; host hooks; the
executable shim that finds the CLI and checks the protocol; packaging and the marketplace entry;
skill-trigger evals; token budgets and the context-cost CI; the host package contract as implemented
for this host.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| Every command the skills call | 107, 123, 129, 102, 108, 112 |
| The CLI protocol | 100 |
| The detached start and whether it survives the session | 122 |
| Claude as a harness | 125 |
| The dsh plugin | 120, Wave 2 |
| Renderers | 121, Wave 2 |

#### 2. As-is requirements received

| As-is id | Behaviour (short) | Disposition | Proof |
|---|---|---|---|
| 011 FR-017 | Mode selection defaults to `generate` | superseded-by DV-009 | Register row DV-009 (decision 18); the mode map is compared on FX-36, with one waiver |
| 011 FR-025 | The onboarding script links the skill into named hosts, with its exit codes | superseded-by DV-056 | Register row DV-056: plugin packaging replaces it |

Behaviour inventory received, as assigned in `traceability-items.tsv` (the authority): **27 items in 9
clusters**.

| Source module | Clusters | Items | ported | translated | superseded-by |
|---|---|---|---|---|---|
| `onboard-skill` | C-237 to C-243 | 19 | 0 | 0 | 19 |
| `SKILL.md` | C-244 to C-245 | 8 | 0 | 7 | 1 |
| **Total** | | **27** | **0** | **7** | **20** |

Non-code assets received: the skill text and its two reference texts, cut to the budgets; the agent
manifest and the onboarding script are superseded by plugin packaging.

#### 3. Merge rule

Only 011 contributes. Its five constitution principles for the host skill are merged into the
constitution as XIII to XVII. Its skill text spends about 20,000 tokens, all mandatory; what it states
as rules becomes behaviour of the commands, and the skill keeps the order of steps and the judgment.
"Silence is never consent to execute" is reworded: invoking the skill is the consent, and `dry-run`
withholds it.

#### 4. New requirements from research and owner decisions

| Subject | Source |
|---|---|
| `specstride-run` derives and validates the launch contract, launches, supervises and reports the digest; the plugin does not author specs | Prompt section 0; decision 18 |
| Two modes, `run` by default and `dry-run`; the optional free-text comment, passed verbatim | Decision 18 |
| The host reaches the product only through the CLI protocol; it reads no product source, state file, event file, launch contract or log | LR-2; decision 16 |
| Token budgets: `specstride-run` 8,000 from invocation to launch; `specstride-reverse` 7,000; doctor 1,500; one supervision cycle 150; a whole run's supervision 3,000; the gate is on bytes at 2.8 bytes per token | Decision 16; DP-024; R17 |
| The seven CI gates: static size, reference closure, golden output, supervision cycle, judgment payload, host cross-check, startup | R17 |
| Skill-trigger evals: each skill triggers on the right requests and stays quiet on unrelated ones; a free-grader suite per pull request with pinned models and no ablation; interrupted runs are not score failures | Decision 15; R3; R3v C3, C7 |
| Host hooks: the session-start line for re-attachment; a delta line on prompt submission; a guardrail before a shell command that launches a run; host-observed limit events written to the inbox; no injection on stop or after tool use | R3; R14 |
| Hooks never start the runtime platform: they are thin shims that print a file the runtime precomputed | R17; decision 2 |
| A push alert through a re-waking hook is subject to the hook's time limit; it needs an explicit long limit, a re-arming scheme, or the monitor as the primary way | R3v C2 |
| The shim resolves the CLI, calls `specstride --protocol`, and refuses with one doctor line on a mismatch; it never installs or updates the CLI without the consumer noticing | R3; R11 T-46 |
| Packaging: one published package holding the plugin directory; an explicit plugin version; no install script | Decision 19; R3; R11 T-43 to T-45 |
| Host capabilities declared: `hooks`, `statusSurface`, `background`, `evals`, `stateRootWritable`, each with a fallback | EP-01; R15v P-6 |
| The host's own background job mode is recorded as considered and rejected as the runtime | R3v C1 |
| Output printed into the host context is framed as data | R11 T-12 |
| A Tier 1 child of the run must not load this plugin's hooks | R3 |
| No server of the model context protocol in Wave 1 | R17 |
| The plugin ships with the audience `distributed`, as the package does: with Claude as harness the default auth tier is then Tier 2. The skill tells the consumer once how to set `personal` in user configuration and never sets it itself | Rulings 1, 2 |

#### 5. Contracts

| Depends on (feature 100) | Version |
|---|---|
| EP-01 host port: host package contract, CLI protocol | `specstride.host/1`, protocol 1 |
| CLI protocol and line grammar; exit codes of every command the skills call | annex G |
| EP-09 `RunView` (the status line) | `specstride.view/1` |
| Inbox request types (host events) | `specstride.inbox/1` |
| EP-14 doctor check registry (it registers `host.*` checks) | `specstride.doctor/1` |
| Launch-contract schema (judgment batches, by reference only) | `specstride.launch-contract/1` |

**Owns (content):** EP-01, as the host package contract's first implementation and its conformance
suite; the skill sources; the eval suites.

#### 6. Divergence register rows and pending decisions

| Id | What the brief proceeds on |
|---|---|
| DV-009 | Launch by default; mode map |
| DV-056 | Plugin installation in place of onboarding; FX-37 retired |
| DV-061 | The reminder that steers a model toward the scripts is dropped |
| DV-033 | The skill reads terse default output |
| DP-023 (ruling 64) | The CLI inventories, the host judges batches |
| DP-024 (ruling 65) | The budgets and their unit |
| DP-080 (ruling 6) | With relaunch in the runtime root the supervision budget of 3,000 tokens holds |
| DP-086 (ruling 64) | A host without a model may delegate derivation judgment |
| DP-002 (ruling 62), DP-003 (ruling 62) | The dsh equivalents are Wave 2 |
| R3 risk 1 | Detach survival inside a host session is `unverified`; the spike is in 122 |

#### 7. Requirement groups and estimate

| Group | Content | Est. |
|---|---|---|
| G1 | The three skills: steps, modes, comment, judgment, the audience notice | 12 |
| G2 | Host hooks and the shim | 8 |
| G3 | Packaging and the host package contract | 6 |
| G4 | Evals, token budgets, context-cost CI | 10 |

Total: about 36.

#### 8. Tests required

| Kind | Content |
|---|---|
| Parity | FX-36 for mode and learning selection through the mode map. FX-37 is retired with a waiver |
| Characterization | The skill's documentation rules, each as a test of the command that now enforces it |
| Conformance | The host conformance suite of EP-01, run against the plain shell host and against this plugin: both skills' command sequences on oracle fixtures with stub agents, bytes measured against the budgets, the reference closure, the artifact tree validated |
| Evals | The trigger suite for `specstride-run`, `specstride-reverse` and the doctor skill |

Success criteria this feature carries:

| Criterion | Measure |
|---|---|
| **Each host skill stays within its token budget, enforced in CI** | The seven gates pass; `specstride-run` at most 8,000 tokens and `specstride-reverse` at most 7,000 from invocation to launch |
| Skills trigger correctly | On the trigger suite each skill fires on its positive cases and stays quiet on the negative ones, at the pinned model |
| The model never reads product source | The reference closure gate finds no path from the skills into product source, state or logs |

#### 9. Constitution principles that bind it

XIX, XV, XIII, XVI, XVII, I, VI.

#### 10. Research that supports it

R3, R3v, R17, R5, R13, R14, R11 (T-09 to T-12, T-43 to T-46), R15 (EP-01), R15v (A-7, B-2), R2v (non-code assets), R4 (for the contract shared with dsh).

#### 11. Constraints

Owner-set constraints, for the spec's `## Constraints` section:

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| Claude Code is the first host; the plugin exposes `specstride-run` and `specstride-reverse` | Prompt section 0; decision 13 |
| Hook shims may be thin shell shims; nothing else is | Decision 2 |
| Every host fact carries a `verified-on` date and a version pin | Prompt section 6 |

**What belongs in `plan.md` instead:** libraries and their versions, the package and file layout, physical paths behind logical names, the test runner, bundling, and the spelling of internal functions. `spec.md` describes behaviour and names none of them.

---

### 115-micro-loop-layer

Directory: `specs/115-micro-loop-layer`. Tier 2. Estimated requirements: 66, in two groups; a split is
expected (section B.3).

#### 1. Scope

**In scope.** The micro-loop layer as an implementation of the loop-layer interface: the unit of work
and the checkpoint; micro level L1; inner checks on the per-phase check manifest; keep, repair and
unresolved; the caps; the closing check; the resume states; the router rule table and its three
decision points; model-tier escalation as the second repair; the fallback to the classic loop and its
announcement; the `[LOOP]` line; the protected set, fingerprints and the result conditions; toolchain
profiles; the fact block the critic receives; the integrity rules of the layer; the tripwire and the
three-level revert; the experiments that keep or revert the default.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| The hook points the layer plugs into, the ledger, the handoff, session directives | 103 |
| The check runner and the manifest's derivation | 105 |
| Fail-fast and the first-failure predicate | 118 |
| The step runner | 105 |
| The slot and escaping of the fact block in the critic prompt; grounding refusals | 117 |
| The phase gate, the verdict, the approval record | 101 |
| Parallel units | 142, a layer stacked above this one, off by default |
| The tier bump after K critic rejections | 101 |
| Micro levels L2 and L3 beyond continuation, check selection per unit, a model as inner reviewer | Roadmap |

#### 2. As-is requirements received

None. The layer has no as-is behaviour (decision 21). The README's old use of "micro-loop" is renamed
recovery cycle and belongs to 101.

Behaviour inventory received, as assigned in `traceability-items.tsv`: **none**. No behaviour item is
assigned to this feature.

Three existing mechanisms are touched by exemption: the short-pass nudge (B-0540, B-0541, B-0558), the
iteration limit (B-0040, B-0775) and the repeat-stall watchdog (B-0491, B-0492, B-0602). Their items stay with
103 and 118.

#### 3. Merge rule

Not applicable. The fixed points of decision 21 bind: one engine; the layer never approves; inner
checks are run by the runtime and are deterministic commands only; the critic sees final results and
no repair history; inner cycles count against their own caps only; it works on every harness; it can
be turned off and every run records its strategy; it stays the default only if it earns it.

#### 4. New requirements from research and owner decisions

| Subject | Source |
|---|---|
| Switches: `loop.strategy`, `loop.micro.closing_check`, `loop.escalation`, each its own; all off under the `parity` profile | R27 D1.1 |
| The unit of work: declared in a checkpoint that names task ids of the current phase; one task per unit, sized at 5 to 15 minutes; validated against the task list as read at launch | R27 D1.2; IR-56 |
| The checkpoint is a claim: a regular file in the outbox, newer than the pass, read after the pass exited, opened without following links, moved into the control plane when read; refused if the pass was killed, an id is foreign, or a yield was written in the same pass | IR-09, IR-55 |
| L1 on every harness, tested or discovered; continuation where a tested adapter declares it | R27 D1.3; decision 21 |
| The inner set is the manifest; every command runs in every check; before a check the runtime ends every process of the pass it can identify | R27 D1.4; IR-03, IR-32; DP-065 |
| Caps: repairs 2 per task id; escalations 1 per task id and 2 per phase attempt, inside the repairs; 20 min per proposal; 30 min per unit; 5 min per check command; inner check time 15 % of the phase attempt; cycles per phase attempt; the layer off after 2 unresolved units; one re-run for a flaky check | R27 D1.5 |
| Until the layer is engaged in a phase attempt, no pass timeout and no runtime command differs from the classic loop | IR-58 |
| Keep, repair, unresolved; the runtime never commits, reverts, resets or cleans the tree inside a phase attempt | R27 D1.6; IR-60; DP-056 |
| Inner cycles never use up iterations, rejects or the MALFORMED limit; a checkpoint pass leaves the consecutive breakers as they were | Decision 21; IR-06, IR-48 |
| When the caps run out, or on a check that cannot start, or on an integrity event other than taint, the layer switches off for the phase attempt; no exit code, no stop reason | Decision 21; IR-07 |
| The closing check runs only in a phase attempt where a unit was declared; from the moment phase evidence exists no limit or breaker stops the run | R27 D1.7; IR-05, IR-49; DP-041 |
| Inertness: with no unit declared the layer executes nothing and adds nothing to any prompt but the checkpoint contract block | IR-52; DP-039, DP-055 |
| In a run whose verification gate does not execute, the classic loop runs, announced with the reason `gate-not-executing` | IR-34; DP-045, DP-064 |
| The router: one pure function at the decision points `tools`, `loop` and `escalation`; it orders and excludes among manifest entries, adds none, builds no argument list; it can switch the layer off for a phase attempt and never on; every decision is an event | EP-06; IR-53; decision 20 |
| The failure signature is the ordered list of failed command ids with exit codes; no output is parsed | IR-53 |
| Escalation moves to the next model tier of the same harness, in a fresh session, never to the critic's model and never to another harness; an exhausted quota on the target means skip | DP-031, DP-032; IR-47 |
| The protected set in two classes, fingerprinted at launch and at phase entry; class A as path patterns; fingerprint before and after every check; a check run against a changed set is `tainted`, never `pass`; prevented where the harness offers a sandbox, detected everywhere | IR-11, IR-31, IR-33, IR-35, IR-38; DP-040 |
| Executables pinned at launch; known caches disabled or protected; `cached` is not `pass` | IR-36, IR-37 |
| Authorisation to change a protected file comes only from the launch-time task text | IR-12, IR-41 |
| Suppression markers added and removed are counted per file | IR-39 |
| Toolchain profiles as data; a toolchain without a profile has the basic protection and the doctor and the `[LOOP]` line say so | EP-16 |
| The fact block: built by the runtime from the control plane, present only when a unit was declared; results per command and tree with conditions in separate columns; tasks as the proposer's declaration; protected-set facts; integrity events by kind without counts | R27 D1.12; IR-17, IR-40, IR-42, IR-43, IR-46 |
| Not in the fact block: counts, order, times, output, earlier results, fingerprint values per row, tiers, sessions, routing decisions | Decision 21; R27 D1.12 |
| Every failure block given to the proposer carries a per-run marker token | IR-20 |
| The `[LOOP]` line before the digest, printed only when the layer is on, with `escalations=`, `failfast-stops=`, `protection=` and the fallback reason | R27 D1.13; DP-067 |
| The tripwire: on a breach of gate integrity the layer goes off for the run, the approval concerned is void, a user-level record makes every later launch default to classic until the operator clears it, and the breach blocks the release | Decision 21; DP-066; IR-28 |
| The experiments X0 to X12, the paired-run design, the fixtures, the evaluation window of 48 valid paired phases or 6 weeks | R27 |
| The targets of decision 21 apply to the default configuration against the parity configuration (X5); the layer earns its place in its own ablation (X6) | DP-061, DP-062, DP-063 |
| With the layer `parallel` stacked above this one: an integrated group is one kept unit, produced by integration and not by a checkpoint of the main line; a failed merge check enters the repair path as a failed check of that unit; the router's `loop` point may switch the layer `parallel` off for a phase attempt and never on. Nothing else of this layer changes, and with parallel units off nothing changes at all | R29, "Beside the micro-loop layer"; PU-49, PU-50 |
| Escalation and the tier bump are separate. Escalation acts inside a phase attempt, on a failed inner check. The tier bump of 101 acts between phase attempts, on critic rejections. Both keep away from the critic's model | Rulings 46, 48; IR-47 |
| The experiment plan gains an ablation arm for the tier bump. Experiment E6 for parallel units is owned by 142 | Rulings 48, 56 |
| Rule IR-60 is amended to name the two writes of ruling P1 (the application of an integrated delta, the ticks of integrated tasks). For this layer alone it holds in its old words | Ruling P1; DV-085 |

#### 5. Contracts

| Depends on (feature 100) | Version |
|---|---|
| EP-04 loop-layer interface | `specstride.loop-layer/1` |
| EP-06 router rule table; EP-16 toolchain profile | `specstride.router-rules/1`, `specstride.toolchain/1` |
| EP-05 check runner | `specstride.check-runner/1` |
| Check manifest; fact block; ledger (the layer's namespace); tripwire record | `specstride.manifest/1`, `specstride.fact-block/1`, `specstride.ledger/1`, `specstride.tripwire/1` |
| Table evaluator | `specstride.table/1` |
| EP-03 canonical spec model (task ids) | `specstride.spec-format/1` |
| EP-02 harness port (tier ladder, continuation capability, containment level) | `specstride.harness/1` |
| EP-15 prompt block provider (the checkpoint contract block) | `specstride.prompt-block/1` |
| CLI protocol and line grammar (`[LOOP]`) | protocol 1 |
| Event envelope | `specstride.event/1` |

**Owns (content):** EP-06, EP-16, the fact block, the tripwire record; the implementation `micro` of
EP-04. **Single owner of fingerprints and the protected set** (R15v E-3).

#### 6. Divergence register rows and pending decisions

| Id | What the brief proceeds on |
|---|---|
| DV-012 | The layer is on by default; off for the parity suite; the second suite runs it with stubs that never declare a unit |
| DV-013, DV-014, DV-015 | Three exemptions, as yields are exempt today |
| DV-016, DV-017, DV-018, DV-020, DV-052 | The named layer fields: two events, the run record fields, the `[LOOP]` line and the status line, the checkpoint contract block, the files that exist only with the layer on |
| DV-046, DP-041 (ruling 45) | The closing check |
| DV-050, DP-031 (ruling 46) | Escalation, on and capped |
| DV-053, DP-045 (ruling 40) | The fallback in a run whose gate does not execute |
| DP-039 (ruling 44), DP-055 (ruling 44) | The protocol block is a named field; inertness in the sense of IR-52 |
| DP-040 (ruling 38), DP-046 (ruling 38) | Detect and void everywhere; prevent where a sandbox exists |
| DP-044 (ruling 39), DP-047 (ruling 53), DP-056 (ruling 50) | No immutable snapshot; no test counts; no commit and no revert |
| DP-048 (ruling 41), DP-049 (ruling 41), DP-051 (ruling 53) | The gate runs on a differing protected set; an integrity event does not halt; the unit id stays |
| DP-061 (ruling 3), DP-062 (ruling 4), DP-063 (ruling 5), DP-066 (ruling 42) | What the targets are measured on; the 50:50 mix; what a killed pass is; the tripwire |
| DV-079, DV-080, DP-033 (ruling 48), DP-034 (ruling 56) | The tier bump is an option of 101 and parallel units an option of 142, both off by default. With both off this layer is as proposed |

#### 7. Requirement groups and estimate

| Group | Content | Est. |
|---|---|---|
| **G-A, the layer** | Units and checkpoints, keep, repair and unresolved, caps, the closing check, resume states, the router table with escalation, fallback, the `[LOOP]` line, inertness, the tripwire, the experiments, the layer beneath a stacked layer | 36 |
| **G-B, check integrity and unit evidence** | The protected set, fingerprints, taint and the other conditions, toolchain profiles, the fact block, the integrity rules of the layer | 30 |

Total: about 66. **If `speckit-specify` yields more than about 45, the feature is split along G-A and
G-B**: G-A stays `115-micro-loop-layer`; G-B becomes `116-check-integrity-and-unit-evidence`. G-A
cites the protected set and the fact block through the contracts of feature 100.

#### 8. Tests required

| Kind | Content |
|---|---|
| Parity | None of its own: there is no old behaviour. The second suite of 141 proves inertness on every fixture family |
| Own tests | One test per integrity rule IR-01 to IR-60 that the layer owns; resume in every state of the unit's life; each cap; each fallback reason |
| Conformance | EP-06: golden decisions per row and the property that exactly one row fires for every signal vector. EP-16: a profile for a fictional toolchain in a test overlay changes the protected set of a fixture |
| Experiments | X0 (cost accounting, a precondition), X1, X5, X6, X7, X8, X9, X10, X11, X12 |

Success criteria this feature carries:

| Criterion | Measure |
|---|---|
| **Time from launch to all phase gates approved on a reference project, reported per stage against the measured baseline, with the targets of decision 21** | X5 on the fixed 50:50 mix, default configuration against parity configuration: alive hours per approved phase at least 25 % lower (baseline 1.22 h median); passes ended by a time limit or watchdog and runs stopped by the iteration limit at least 50 % lower (baseline 37 of 515 passes); first-attempt approval within 5 points; cost per approved phase no higher |
| The layer earns its place | X6: killed passes at least 50 % lower, and time, quality and cost no worse than the same configuration without the layer |
| The layer never approves | No approval exists without a nonce-matched critic reply after the full verification gate executed; asserted on every run |
| Gate integrity | X12 (i) and (ii): no output difference beyond the named fields; every seeded tampering is recorded as its condition and never as `pass` |
| It works on every harness | The layer at L1 completes the descriptor-only fixture on an unverified harness |

#### 9. Constitution principles that bind it

II, III, I, VIII, XIII, XVIII, XIV.

#### 10. Research that supports it

R27, R23, R23v, R22, R25, R24, R26, R21, R21v, R11 (T-19 to T-25), R12, R15 (EP-04, EP-06, EP-16), R15v (A-1, A-2, E-6), R29.

#### 11. Constraints

Owner-set constraints, for the spec's `## Constraints` section:

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| Micro-loops are on by default in Wave 1 and can be turned off in configuration | Decision 21 |
| In Wave 1 inner checks are deterministic commands only; no model acts as inner reviewer | Decision 21 |
| This layer works units one after the other. Agent parallelism is an option of 142, off by default | Ruling 56 |
| Every numeric default has low confidence and is a starting value for the experiments | R27 |

**What belongs in `plan.md` instead:** libraries and their versions, the package and file layout, physical paths behind logical names, the test runner, bundling, and the spelling of internal functions. `spec.md` describes behaviour and names none of them.

---

### 142-parallel-units

Directory: `specs/142-parallel-units`. Tier 2. Estimated requirements: 58, in three groups; a split is
expected (section B.3).

The owner ruled that tasks marked `[P]` may run in parallel worktrees with a merge check before the
critic, as a Wave 1 option that is **off by default** (ruling 56), that the design is researched and
red-teamed first (ruling D3), and how rulings 50 and 34 read for it (rulings P1, P2). The design is
`research/R29-parallel-units-design.md` (rules PU-01 to PU-78) as amended by its red team
`research/R29v-parallel-units-red-team.md` (rules PU-79 to PU-104). **Where the two differ, R29v
stands.** The owner has not approved the design itself; open points are in `CLARIFY-QUEUE.md`
(CQ-003 to CQ-011) and the feature proceeds on the recommended answers.

Terms used here. **Main line**: the ordinary serial pass loop of a phase attempt in the workspace.
**Worker**: one harness process working one assigned task in a tree of its own. **Group**: the workers
started together and integrated together. **Worker tree**: the directory a worker works in. **Worker
root**: the place of all worker trees, outside the workspace and outside the control plane. **Tree
store**: a repository the runtime owns, outside the project's repository. **Delta**: the difference
between a group's base snapshot and a worker's final snapshot. **Integration**: audits, composition,
application to the workspace. **Merge check**: the inner check set run on the integrated tree.

#### 1. Scope

**In scope.** The loop layer `parallel`, stacked above `micro` behind the loop-layer interface; its
switch, preconditions and fallback reasons; inertness; the parallel plan: candidates, write scopes,
the admission checks, the reservation of tasks; the group executor; the tree store and the worker
root; worker trees, seed paths, temporary directories and clean-up; worker sessions and their limits;
the group pause; the barrier; the scope audit, the protected-set audit and the path-leak audit;
composition of the integrated tree; the two writes to the workspace that ruling P1 allows (the
application of the integrated delta, and the ticks of the integrated tasks); the merge check and its
outcome; the fingerprints of a group and the frozen workspace; the ledger records and the resume
states of a group; stop with a group live; workers that outlive the engine; accounting; the events
and the `[LOOP]` fields of the layer; what the critic and the proposer are told; the breach
conditions; experiment E6 as a safety experiment.

**Out of scope.**

| Out of scope | Owner |
|---|---|
| The loop-layer interface itself: stacking, the directives `requestPass`, `requestPassGroup` and `integrateGroup`, capability negotiation, the interface of the tree-store service | 100 (contract), 103 (hook points and the core side) |
| The micro-loop layer, the protected set, fingerprints, toolchain profiles, the fact block's content, the tripwire | 115 |
| The check runner, the manifest, and **concurrent verification commands** (PU-73 to PU-78, PU-101), the second option of ruling D2 | 105 |
| Watchdogs, kills, the polite stop, yields and detached jobs | 118 |
| The process registry, the lease, and what the runtime root does when the engine exits | 122 |
| The quota classifier, the pause record, budgets and hard caps as rules | 127 |
| The event envelope (`workerId`, `wseq`), the names of the `parallel.*` events, the redactor | 111 |
| The capabilities `concurrentSessions` and process-level spending limit of the harness port; their values per harness | 109; 125, 130, 131, 134, 138 |
| Grounding refusals of the worker root and the tree store; the slot and the vocabulary of the fact block; the withheld paths of a critic with read tools | 117 |
| The session directive and the drop rules of continuation, to which this feature adds one | 103 |
| Feature parallelism across workspaces, a phase graph, selection among N candidates, repairs or checks inside a worker, integration of a killed worker's work, a model that merges, Lisa's queue, cron and safety predicate (002 FR-039, 002 FR-040, 002 FR-043 to 002 FR-045, 002 FR-047) | Roadmap |

#### 2. As-is requirements received

| As-is id | Behaviour (short) | Disposition | Proof |
|---|---|---|---|
| 002 FR-048 | Worktree creation rules: refuse a workspace that is not a git repository; remove a stale worktree of the same identity; create the worktree from a base reference | translated | Characterization, `CT-142-1`, of the two clauses that are kept (DV-080) |

How each clause is kept:

| Clause of 002 FR-048 | In this feature |
|---|---|
| Refuse a workspace that is not a git repository | **Kept** as a fallback, not an error: the option is off for the run, announced with the reason `not-git` (PU-18) |
| Remove a stale worktree of the same job and task | **Kept**, keyed by run, group and worker (PU-27), and including the entry in the store (PU-93) |
| Create with a branch from a base reference that defaults to `HEAD`, in the project's repository | **Translated**: the worker tree is made from the snapshot of the phase attempt's current tree, in the runtime's own tree store; no branch and no reference in the project's repository (DV-080, DV-084). The form of the worker tree is CQ-007 |

Behaviour inventory received, as assigned in `traceability-items.tsv`: **none**. No behaviour item of
028 or 011 is assigned to this feature: neither has parallel work inside a phase. Lisa's integration
code has no requirement in 002 and its policy (demote the group, then a model as "system-level
critic") is not carried.

#### 3. Merge rule

| Case | Ruling |
|---|---|
| 028 and 011 | Silent. Units of a phase are worked one after the other (DV-080). The option is off under the `parity` profile, so parity is untouched |
| Lisa's worktree rules | Two clauses kept, one translated, as above. The code is not extracted as it is: it works in the project's repository, from `HEAD`, on a branch, all of which ruling 50 and rule IR-60 exclude |
| Lisa's integration | Not taken: its merge writes the project's working tree, index and history; its failure policy needs a revert; a model judges between merge and phase critic. Decision 21 allows deterministic checks only, and the phase critic is the only critic |
| Lisa's scope comparison | Its defect is not carried: two tasks with empty scope **lists** are reported disjoint there. Here an empty or absent scope is the whole tree (PU-12) |
| Lisa's admission function | Its shape is reused (greedy, in order, capped, every check recorded); its code is not, because its inputs are Lisa's plan types |
| Lisa's principle "Deterministic Parallelism" | Returns as Principle XX, with its last sentence replaced: the phase critic is the only critic |

#### 4. New requirements from research and owner decisions

Every row cites the rules it rests on. A rule of R29 that R29v amended is cited with its amendment.
Numeric defaults have **low confidence** and are starting values.

**The layer and its plan**

| Subject | Source |
|---|---|
| The layer `parallel` is registered only when `loop.parallel.units` is `on`. The default is `off`; the `parity` profile sets `off` | PU-01; ruling 56 |
| It runs only stacked above `micro`. It is off for the run, announced with its reason, when a precondition fails: `classic`, `gate-not-executing`, `not-git`, `submodules`, `git-version`, `harness`, `containment`, `no-group`. With composition in place of merge, the git floor is what the snapshot needs | PU-02; PU-80; ruling P2 |
| **Containment C2 or above is required.** On a harness that cannot enforce it the option stays off, reason `containment`, unless the consumer sets `loop.parallel.allow_detect` in user configuration; then the run record and the `[LOOP]` line say `protection=detect` | Ruling P2; PU-26; R29v O-3 |
| The layer adds no exit code, no stop reason and no run state. Every failure inside a group ends in one of: the task returns to the main line; the layer is off for the phase attempt; the layer is off for the run | PU-03; decision 21 |
| Inertness. With the option off no service is called and no file of the layer exists. With the option on and no group started in a phase attempt, prompts, time limits, runtime commands, events and files equal those of the option off, apart from fields the divergence register names, `parallel.admission` among them | PU-04; PU-98 |
| What is withheld from the layer by construction: every gate writer, every outer counter, a harness handle, the event writer and the ledger writer, raw git, any writable path. The engine owns the group executor, the tree store and integration; the layer decides | PU-06, PU-07 |
| A task is a candidate only if the launch-time reading of the task list carries `[P]` on it. The marker is necessary and never sufficient | PU-09; Principle XX |
| A group is a run of consecutive **admitted** tasks in launch-time order inside one phase, with no heading between them. A candidate that admission makes serial ends the run at its position. A group holds at most `workers` tasks; a longer run gives successive groups, each with its own base snapshot, barrier and merge check. Fewer than 2 tasks are no group | PU-10, PU-14; PU-86, PU-102 |
| A write scope is a list of normalised path prefixes, compared with a path boundary; on a file system that ignores case, after case folding and Unicode normalisation. An empty or absent list is the whole tree and overlaps everything | PU-11, PU-12; PU-99 |
| A scope comes from the consumer's declaration, in user configuration or in the promoted launch contract, or else from the paths the task's own launch-time text names. Project configuration may remove eligibility and narrow a scope, never add or widen. Nothing the proposer writes is a source | PU-12; ruling 35 |
| Admission is a pure function, greedy in task order with the worker cap. Its checks, each recorded with verdict and detail: `marker`, `scope`, `protected`, `resource`, `headroom`, `check`, `links`, `jobs`. A task that fails a check is serial; it is never dropped | PU-13; PU-79, PU-84, PU-92 |
| Check `check`: a group is admitted only if the inner set of the phase, after every exclusion in force, holds at least one command | PU-79; R29v V-03 |
| Check `links`: a task whose scope contains or lies behind a symbolic link that is absolute or leaves the tree is serial; at C0 and C1 such a phase has no group | PU-84 |
| Check `jobs`: no group starts while an adoptable job of the run is alive | PU-92 |
| Check `resource`: a phase in which a manifest command, a declared job or the launch contract names an exclusive resource has no group, unless user configuration gives the resource a capacity of at least the worker count | PU-37 |
| Check `headroom`: quota utilisation below `loop.parallel.quota_headroom` (70 %); under a hard cap, enough remaining budget; enough free disk for the worker trees; with no quota observation in the run a group has 2 workers whatever is configured | PU-30, PU-39; PU-88 |
| The plan of every phase is computed at launch, stored in the control plane with its hash, never recomputed inside a run; a relaunch that derives another plan announces it and uses the recorded one. The plan is printed by `launch --dry-run` and by the doctor only with the option on | PU-15; PU-98 |
| A group starts only at a pass boundary of the main line, with no session open, no yield wait open and no phase evidence present, and only when every task before it is named by a kept unit. Until then the main line is asked to end its pass before the reserved tasks; a task the main line works anyway leaves its group | PU-16, PU-17, PU-40 |
| `loop.parallel.workers` defaults to **2** and has the ceiling **4**; a higher value is a configuration error at launch. Two transient rate limits in one group halve the worker count for the rest of the phase attempt | PU-31, PU-39; CQ-006 |
| The option needs a tested adapter that declares `concurrentSessions`. A discovered or unverified harness never runs a group; the fallback is announced. No requirement names a harness | PU-40; decisions 17, 21 |
| Accounting: a worker pass takes no iteration, no reject, nothing of the MALFORMED limit and leaves the breakers as they were. One cycle of the micro-loop layer is charged per admitted worker task, at its first start. Time caps count wall time once. Integration and merge-check time count inside the 15 % inner-check budget, and group overhead never excludes a command | PU-67, PU-69, PU-70; PU-79, PU-87 |
| A worker pass ended by a time limit or watchdog counts as killed for decision 21's target. Reports and the `[LOOP]` line give wall hours and agent hours, and the fields `parallel=`, `workers=`, `groups=`, `group-failures=`, `refused=`, `worker-caches=` | PU-71, PU-72; PU-97; ruling 5 |
| A group in which a worker was refused or killed, or whose merge check failed, counts as failed; after 2 in a phase attempt the layer is off for it. A worker pass that ends with a harness error closes the group and switches the layer off for the phase attempt, so that the breakers of the main line count as always | PU-52; PU-89 |

**The engine services**

| Subject | Source |
|---|---|
| The tree store is a service of the engine with a closed set of operations: `snapshot`, `materialize`, `changed`, `compose`, `apply`, `release`, `sweep`. It has no restore, no reset and no checkout of the workspace. The subset that parallel units need is built here, behind the interface feature 100 reserves; nothing is built for `autoresearch` | PU-19; PU-80; ruling 31; CQ-003 |
| The store is a repository of the runtime, per run, in the control plane. No operation writes a file under the project's `.git`, creates a reference there or changes the project's index | PU-20; ruling P1 |
| **Store commits** are allowed under four conditions: outside the project's repository; fixed author, date and message; never a parent of a project commit and never pushed; removed with the run | Ruling P1 (1); DV-084; R29v O-1 |
| Ruling 39 ("no snapshot in Wave 1") concerns what the gate and grounding run on. They still run on the working tree | CQ-008 |
| A snapshot covers exactly the fingerprint scope, less the workspace part. It copies into the store every object that no reference of the project reaches, and the store verifies the objects of a tree before `materialize` and before the application. A final snapshot uses the ignore rules of the base snapshot | PU-21; PU-100 |
| Every git process of the runtime runs without the system and the global configuration, with the store's configuration compared with its recorded hash, with hooks and the file-system monitor off, and with no filter, text conversion, external diff or merge driver. A snapshot stores the bytes on disk; the application writes the bytes of the blob | PU-81; R29v V-05 |
| Worker trees live in the worker root. The path of a worker tree holds one opaque random component and no run, group or worker ordinal. Feature 100's table of logical names gains `worker-root` and `tree-store` | PU-22; PU-82 |
| A worker tree is a repository of its own: its git directory lies inside the tree and borrows the store's objects read-only, so that no worker can write the store. The runtime's snapshot excludes it. A worker's own commits, references or stashes have no effect | PU-23; CQ-007; R29v O-4 |
| Ignored paths are absent from a worker tree. Seed paths named by a toolchain profile or user configuration are **copied** in, never linked, never part of a delta | PU-24 |
| Each worker tree receives a workspace part of its own: an empty outbox and a handoff that names the assigned task, the scope and the base fingerprint. The phase evidence, the notebook and the main line's outbox are not copied. The task list is in every snapshot and is dropped from every delta | PU-25; PU-94 |
| The environment of a worker holds one opaque token, a temporary directory beside its tree, and no index or count. A toolchain profile may move a cache that is unsafe for several writers; without one the run says `worker-caches=shared`. The runtime promises no port | PU-28; PU-82, PU-85, PU-97 |
| One harness process per worker, in its own process group, registered as `owned` with pid, start time, run token and worker id; at most `workers` at a time | PU-32 |
| Every worker pass is a fresh session with a minted id, on the base model tier, and makes **one proposal**: one pass that ends at a checkpoint naming its assigned task. No repair, no check, no escalation and no yield take place in a worker. After a group has been applied the next main-line pass is a fresh session | PU-33 to PU-36; ruling 55 |
| A worker is restarted once, in its tree, only after an interruption it did not cause | PU-35 |
| The work of a worker that is killed is discarded from integration; its task returns to the main line. Its snapshot stays in the store until the phase attempt ends | PU-27, PU-35; CQ-005 |
| **A pause pauses the group.** A quota signal from any worker starts no further worker, sends the polite stop to every live worker, keeps their trees, writes the one pause record and emits one pause event. The pause spends nothing. On resume each unfinished worker gets a new pass | PU-38; rulings 27, 28 |
| Under a hard cap each worker pass starts with a process-level spending limit where the adapter declares that capability; otherwise the headroom factor is doubled. The cap is evaluated on the sum over live workers at every usage record | PU-88 |
| **Barrier.** The final snapshot of a worker is taken when that worker's processes have been ended. Integration starts when every worker pass of the group has ended. At the barrier every worker tree is fingerprinted again; a tree that differs from its final snapshot refuses that worker | PU-41, PU-42; PU-96 |
| Every worker process carries the run token. Engine start and `resume` end the holders they find; a tree is swept only after its processes are ended; a pass whose stream was lost is recorded with unknown usage, and every cost report that includes it says so | PU-90; R29v V-12 |
| **Composition replaces merge.** The integrated tree is the base in which each path of an accepted delta holds the blob of that worker's final snapshot. The path sets of accepted deltas must be pairwise disjoint; a delta that shares a path with an earlier one in task order is refused, reason `overlap`. No content is merged, no rename is detected, no model takes part | PU-47; PU-80 |
| **The application** is one of the two writes to the workspace that the runtime makes inside a phase attempt, only when the option is on: forward only; only paths of audited deltas; only onto a workspace whose fingerprint equals the base snapshot; bytes that a proposer wrote; no index, no reference, nothing under `.git`; recorded write-ahead; never undone | Ruling P1 (2); PU-47, PU-54; DV-085 |
| **The ticks** are the other: after `applied` and before the merge check the runtime ticks the integrated tasks through the spec-format adapter, under a ledger record that lists the task ids; they are idempotent | Ruling P1 (2); PU-46; PU-94 |
| The staleness check of ruling K3 for a worker pass reads the workspace's files. The hash it compares for the task list is the one that ignores checkboxes, so that a tick never makes the run stale | PU-94; ruling K3; 011 FR-007 |
| One ledger and one writer. Group and worker records join the run's ledger, written ahead: `group_planned`, `group_started`, `worker_started`, `worker_ended`, `group_barrier`, `audit_done`, `merge_done`, `apply_started`, `applied`, `ticks_applied`, `merge_check_started`, `merge_check_finished`, `group_closed`. While a group is open the engine is the only writer of the event file and the ledger; workers write no control-plane file | PU-55, PU-56; PU-94, PU-98; LR-4, LR-5 |
| Records of N stream readers pass one queue inside the engine; `seq` is assigned at the append, without gaps; within one worker records keep the order of its stream. A pass ordinal is the triple of group ordinal, task position and restart index | PU-57, PU-59; PU-98 |
| Resume and relaunch in the middle of a group: the last ledger record decides, in the states of PU-65, with the state "`applied` without `ticks_applied`: write the ticks" added. State 5 also verifies the workspace outside the delta. A path that holds neither the base nor the integrated content stops all writing: the layer is off for the run and the micro-loop layer carries on from the tree as it is | PU-65; PU-94, PU-95 |
| `stop` with a group live: no further worker starts, live workers finish their pass, integration and the merge check run to `group_closed`, then the stop takes effect. `stop --now`, a budget stop and a run time cap end the workers and leave the group to the resume states | PU-93 |
| Clean-up: a stale tree is removed before a tree is created; every tree of a group is removed at group close, with its entry in the store; a sweep at engine start; the store is removed when the run ends | PU-27; PU-93 |
| Counters of the layer are in the ledger, continue after a resume or relaunch, and are reset by the reset flag with the others | PU-64; rulings 8, 9 |

**Integrity of integration**

| Subject | Source |
|---|---|
| **Scope audit.** Every path of a delta (added, changed, deleted, mode changed) lies inside the worker's scope; a symbolic link whose target leaves the tree is a violation; one violation refuses the worker. The audit reads the store and nothing in a worker's directory | PU-43 |
| **Protected-set audit.** A delta that changes a path of the protected set without authorisation from the launch-time text of the worker's **assigned** task is refused, which is stricter than `tainted` | PU-44; IR-11, IR-12, IR-38, IR-41 |
| **Path-leak audit.** Every added or changed blob is searched for the real path of the worker root, of the store and of the control plane, and for the worker's token; a hit refuses the delta, reason `path-leak`. The rule narrows the leak and does not close it | PU-82; R29v V-02, open question 3 |
| Single-writer files are never part of a delta: the task list, the phase evidence, the notebook, the handoff, anything under the workspace part | PU-45 |
| **The merge check.** After application and ticks the engine runs the inner check set of the phase on the workspace: every command, none skipped at a failure, with fingerprints before and after, through the check runner, once per group. It runs where the application put the work, and a failure goes to serial repair on the main line; nothing is reverted | PU-48; ruling 51; CQ-004 |
| If the inner set is empty when the merge check is due, the unit is `unchecked`, is not kept, and the layer is off for the phase attempt. No group is ever kept without a merge check having run | PU-79; ruling 56; Principle XX |
| Outcome: a pass without condition makes the integrated tasks **one kept unit**, bound to the workspace fingerprint. A failure or a condition sends the same unit to the repair path of the micro-loop layer, and charges one repair to every task of the unit. A refused worker charges nothing | PU-49, PU-50 |
| No result from a worker tree and no merge check replaces an execution at the verification gate. The gate runs in full on the workspace, and the critic is called after it | PU-51; decision 21 |
| Fingerprints of a group, all in the ledger: the workspace at group start; each worker tree after creation and at its end; the workspace at the barrier, after application and around the merge check. The equality after application holds apart from the single-writer files | PU-53; PU-94 |
| **The workspace is frozen during a group.** If it differs at the barrier from the group's start, nothing is applied, every worker is refused and the group counts as failed | PU-54 |
| **What the critic sees.** An integrated group appears as one unit, with the merge check's results. The fact block holds no worker, no group, no count, no outcome of a worker, no order, and no word that tells a group from a serial unit that named the same tasks. Two runs that end in the same tree and the same kept units, one serial and one through a group, give byte-identical critic prompts | PU-60; decision 21 |
| Integrity kinds that reach the critic are neutral and carry no count: `tree-changed-outside-pass`, and `protected-change-not-applied` for a protected change that was refused. A vocabulary test over every critic-class input finds none of: group, worker, parallel, merge, integrat-, refus-, snapshot, the opaque tokens | PU-61; PU-83; CQ-009; ruling 41 |
| A delta refused for scope alone, an overlap, a killed worker and a failed merge check are scheduling and repair history and are withheld from the critic | PU-61; decision 21 |
| File modification times cluster after an application. It is accepted, with a register row that names it; the application sets no times | CQ-010; ruling 53 |
| What the runtime tells a proposer is minimal and neutral: a worker's prompt names its task and scope and no sibling, count, index or group; the main line is told up to which task to work and not why; after a group the handoff lists the integrated tasks as kept units in the words used for a serial unit. A proposer can still describe its work in the phase evidence; that channel is narrowed, not closed | PU-103; R29v V-21 |
| No worker tree exists when a critic-class call starts. The engine ends processes and sweeps **once**; the call is never delayed beyond that. If the worker root is still not empty, a critic without tools is called and the neutral kind is raised; a critic with read tools is called only if its adapter confirmed the read denial, otherwise the next critic of the order is used, announced | PU-63; PU-91; rulings 57a, D1 |
| A breach of gate integrity, for the tripwire and the revert rule, is also: a delta applied that did not pass the audits; a workspace after application that differs from the integrated tree; an integrated tree that holds a path or a blob of no audited delta; a kept unit for a merge check that ran while a worker process was known to live; a critic-class input that holds a withheld field. A detected and refused attempt is an event and not a breach | PU-66; PU-80; ruling 42 |
| Experiment **E6 is a safety experiment**: no breach; the failure classes (`scope`, `protected`, `overlap`, `path-leak`, kill, failed merge check), cost and killed passes are measured and reported. The fixtures FX-PAR-S (stubs) and FX-PAR-L (live) are those of R29 as amended by PU-104. A default cannot be shown at this size: the option stays off until a corpus with phase ceilings of 1.28 or more and at least 71 pairs exists | CQ-011; PU-104; R29v V-27 |
| The expected saving is stated honestly: a ceiling of about 3 to 4 % of alive time at 2 workers before any cost, against one cold start per worker. The option is worth switching on for single phases, not for a run | R29 F-2, F-8; R29v V-27 |

#### 5. Contracts

| Depends on (feature 100) | Version |
|---|---|
| EP-04 loop-layer interface, with stacking, `requestPass`, `requestPassGroup`, `integrateGroup`, capability negotiation, `workerId` and `groupId` in the attempt view, and a ledger namespace per layer | `specstride.loop-layer/1` |
| The tree-store service (interface) | `specstride.tree-store/1` |
| EP-05 check runner | `specstride.check-runner/1` |
| EP-02 harness port: `concurrentSessions`, containment level, polite stop, process-level spending limit | `specstride.harness/1` |
| EP-03 canonical spec model: task ids, markers, `tick`; the canonical hasher (the hash that ignores checkboxes) | `specstride.spec-format/1` |
| EP-12 quota classifier; the pause record | `specstride.quota-classifier/1`, `specstride.pause/1` |
| EP-15 prompt block provider (the reserved-tasks block, the worker block) | `specstride.prompt-block/1` |
| EP-16 toolchain profile (seed paths, caches) | `specstride.toolchain/1` |
| Check manifest; fact block; ledger; process registry | `specstride.manifest/1`, `specstride.fact-block/1`, `specstride.ledger/1`, `specstride.procs/1` |
| State layout (logical names `worker-root`, `tree-store`) | `specstride.layout/1` |
| Containment levels | annex C |
| Event envelope (`workerId`, `wseq`) | `specstride.event/1` |
| CLI protocol and line grammar (`[LOOP]`) | protocol 1 |
| The `parity` profile (`loop.parallel.units: off`) | `specstride.profile/1` |

**Owns (content):** the implementation `parallel` of EP-04; the parallel plan
(`specstride.parallel-plan/1`); the implementation of the tree-store service, of the group executor
and of integration; the content behind the logical names `worker-root` and `tree-store`. No extension
point of its own.

#### 6. Divergence register rows and pending decisions

| Id | What the brief proceeds on |
|---|---|
| DV-080, rulings 56, D2, D3 (DP-034) | Parallel `[P]` units as an option, off by default, off under the `parity` profile. Not observable in the oracle |
| DV-084, ruling P1 (1) | Snapshot commits in the runtime's own store, under the four conditions |
| DV-085, ruling P1 (2) | The application of the integrated delta and the ticks. Rule IR-60 is amended to name both acts. Ruling 50 stands for everything else: no commit to, revert, reset, clean or checkout of the workspace inside a phase attempt |
| Ruling P2 | Containment C2 required, unless `loop.parallel.allow_detect` |
| DV-016 to DV-018, DV-020 | The layer's named fields follow the same rule: listed by name |
| DV-010 | The eleventh drop rule (fresh after an applied group) is not observable: continuation is off under the `parity` profile |
| DV-032 | Grounding refuses the worker root and the tree store by real path, with the option on or off |
| **Rows to be written** | (1) the named fields of this layer: the run record fields `loop.parallel.*`, the plan file and its hash event, the reserved-tasks block, `parallel.admission`, the `parallel=` fields of the `[LOOP]` line, the envelope fields `workerId` and `wseq`; (2) the refusal of the worker root and the store against the oracle, as the row for IR-45 has it (PU-98); (3) modification times after an application (CQ-010). The register's owner assigns the numbers |
| CQ-003 | Build the subset of the tree store that parallel units need; `autoresearch` stays unbuilt |
| CQ-004 | The merge check runs on the workspace after the application; a failure goes to serial repair |
| CQ-005 | The partial work of a killed worker is discarded |
| CQ-006 | 2 workers, ceiling 4, both in configuration |
| CQ-007 | A worker tree is a repository of its own |
| CQ-008 | Ruling 39 does not bar the store's snapshots |
| CQ-009 | A refused protected change is reported to the critic by a neutral kind, without a count |
| CQ-010 | Clustered modification times are accepted, with a register row |
| CQ-011 | E6 is a safety experiment |
| Ruling 67 (DP-006) | macOS is `unverified`: copy-on-write copies, process groups, the worker root's place, a file system that ignores case |

CQ-001 and CQ-002 are closed by ruling P1. CQ-012 belongs to 105.

#### 7. Requirement groups and estimate

Each group cites the others only through a contract of feature 100, so that a split follows a seam.

| Group | Content | Rules | Est. |
|---|---|---|---|
| **G-A, the layer and its plan** | Switch, preconditions and fallback reasons, the containment rule, inertness, candidates, scopes, admission and its eight checks, the plan, the reservation, limits, headroom, accounting, reporting, group failures | PU-01 to PU-04, PU-08 to PU-17, PU-31, PU-37, PU-39, PU-40, PU-52, PU-67 to PU-72, PU-79 (admission), PU-84, PU-86 to PU-89, PU-92, PU-98 (fields), PU-99, PU-102 | 20 |
| **G-B, the engine services** | The group executor, the tree store and its hardening, the worker root, worker trees, seed paths, the environment of a worker, sessions, the group pause, the barrier, composition, the application and the ticks, the ledger records, the single writer, resume states, stop, clean-up, workers that outlive the engine | PU-05 to PU-07, PU-18 to PU-30, PU-32 to PU-36, PU-38, PU-41, PU-42, PU-46, PU-47, PU-55 to PU-59, PU-64, PU-65, PU-80, PU-81, PU-85, PU-90, PU-93 to PU-97, PU-100 | 24 |
| **G-C, integrity of integration** | The three audits, single-writer files, the merge check and its outcome, fingerprints of a group, the frozen workspace, what the critic and the proposer are told, the sweep before a critic call, breach conditions, experiment E6 | PU-43 to PU-45, PU-48 to PU-51, PU-53, PU-54, PU-60 to PU-63, PU-66, PU-79 (the empty set), PU-82, PU-83, PU-91, PU-103, PU-104 | 14 |

Total: about 58. R29 estimated 41 from its 72 rules; R29v added 26 rules and expects the feature
above the split mark. **If `speckit-specify` yields more than about 45, G-B leaves**: G-A and G-C
stay `142-parallel-units`; G-B becomes `143-parallel-engine-services`. G-A and G-C reach the engine
services through the directives of EP-04 and the tree-store interface, both contracts of feature 100.

PU-73 to PU-78 and PU-101 are not in the table: they belong to 105.

#### 8. Tests required

| Kind | Content |
|---|---|
| Parity | None of its own. The parity suite and the second suite run with the option off |
| Inertness | Every micro-loop fixture three ways: option off; option on with a task list without `[P]`; option on with stubs that tick every `[P]` task serially. Outputs equal after the named fields are removed |
| Characterization | 002 FR-048, `CT-142-1`: the fallback on a workspace that is not a git repository; the removal of a stale worker tree |
| Own tests | One per rule PU-01 to PU-72 and PU-79 to PU-104 that this feature owns. Among them: the project's `.git` hashed before a group and after it, and `git status` compared; the engine killed after each of the thirteen ledger records, each run ending in the same tree and the same kept units as the uninterrupted run, or in the stopped state with its event; the contention property test of the queue (4 streams of 10,000 records); a worker tree whose attributes file names a filter, with no process started and bytes equal; a delta that carries the worker root's path; a group with an empty inner set; a link that leaves the tree; a job of an earlier yield alive at group start |
| Conformance | EP-04: the sample layer of 103 stacked above `noop`, which requests a group of two stub passes and integrates them, with the whole oracle passing when it is unregistered. The tree-store service with scripted trees: the interface has no operation that writes a workspace path outside `apply` |
| Vocabulary | Every critic-class input of every parallel fixture, against the list of PU-83 |
| Platform | Linux. macOS is `unverified` and must pass before release |
| Experiment | E6, as a safety experiment: FX-PAR-S once per release candidate, at no cost; FX-PAR-L live, with arms serial, 2 workers and 4 workers, reported and carrying no pass mark for a default |
| Facts to establish before the specification freezes | Whether the sandbox of a tested adapter confines the harness's own file tools to a write root other than the workspace; whether several headless processes may run under one configuration home and one login; whether a sandbox can deny reads of paths outside the working tree. All three are `unverified` and are captured by the adapter features |

Success criteria this feature carries:

| Criterion | Measure |
|---|---|
| Off means absent | With the option off no file, event or prompt block of the layer exists, on every fixture |
| The project's repository is never written inside a phase attempt | The hashes of every file under the project's `.git` are equal before and after every group fixture |
| No model merges | No model call lies between `group_barrier` and `merge_check_finished` in any run's events |
| No group is kept unchecked | Every kept unit of a group has a merge check with at least one executed command |
| The critic cannot tell | The byte-identity test of PU-60 and the vocabulary test of PU-83 pass |
| A run survives a crash in any state of a group | The kill test over the ledger records passes |
| A quota pause holds every worker | One pause event; every counter equals its value before the pause |
| No breach | E6 ends with zero breaches of gate integrity |

#### 9. Constitution principles that bind it

**XX (Deterministic Parallelism)** is the principle this feature implements: a marker is a claim;
every admission is recorded; each worker has a tree of its own; no model merges; deterministic
verification runs on the integrated tree before any critic-class call; one writer; parallelism
decides nothing. Also I, II, III, VIII, XI, XIII, XIV, XVII, XVIII. The plan template's Constitution
Check has the line for XX.

#### 10. Research that supports it

R29, R29v, R26, R27, R23, R23v, R15 (A-3, A-5, A-8), R15v (A-1, A-2, C-7, C-8, P-10), R11 (R-1, R-2,
T-19 to T-29), R14, R24, R21, R21v.

#### 11. Constraints

Owner-set constraints, for the spec's `## Constraints` section:

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| Parallel units are an option that is off by default and off under the `parity` profile | Ruling 56 |
| Inside a phase attempt the runtime never commits to, reverts, resets, cleans or checks out the workspace. Two writes are allowed, only with the option on: the application of the integrated delta and the ticks of the integrated tasks | Rulings 50, P1 |
| Store commits only under the four conditions of ruling P1 | Ruling P1 |
| Containment C2 or above, unless the consumer sets `loop.parallel.allow_detect` in user configuration | Ruling P2 |
| 2 workers by default, at most 4 | CQ-006; R29 |
| Integration is deterministic; no model takes part; the phase critic is the only critic | Decision 21; Principle XX |
| The rest of Lisa's scheduler stays deferred: 002 FR-039, 002 FR-040, 002 FR-043 to 002 FR-045 and 002 FR-047. (002 FR-041, 002 FR-042 and 002 FR-046 are budgets and stop, in 127 and 102) | Ruling D2; `traceability.md` section 4.6 |
| Every numeric default has low confidence | R29 |

**What belongs in `plan.md` instead:** libraries and their versions, the package and file layout, physical paths behind logical names, the test runner, bundling, and the spelling of internal functions. `spec.md` describes behaviour and names none of them. For this feature also: the git commands behind each operation of the tree store, the physical place of the worker root, and how a copy-on-write copy is made.

---

## D. Coverage self-check

Sections D.1, D.2 and D.6 are generated from `traceability-frs.tsv` and `traceability-items.tsv`, as
updated for the owner's rulings, and from the 32 briefs. The check of section D.8 fails if an as-is id
is missing, appears twice or is unknown, or if a brief disagrees with the traceability files in
disposition or destination.

### D.1 Every as-is requirement and success criterion has one destination

"R19 draft" is the destination in the appendix of `research/R19-consolidation-map.md`, which uses the
older feature list. "Re-mapped" says whether the final decomposition moved a requirement that has a
Wave 1 feature. For a `deferred` requirement R19 named the feature that would host it later; it has no
Wave 1 feature and is not counted as moved.

| As-is id | Disposition | Destination | R19 draft | Re-mapped |
|---|---|---|---|---|
| 028 FR-001 | ported | 104-spec-input | 104 | no |
| 028 FR-002 | merged-with 002 FR-029 | 104-spec-input | 104 | no |
| 028 FR-003 | merged-with 002 FR-008 | 101-gate-and-verdict | 101 | no |
| 028 FR-004 | translated | 122-detached-runtime | 102 | yes, from 102 |
| 028 FR-005 | merged-with 002 FR-019 | 101-gate-and-verdict | 101 | no |
| 028 FR-006 | merged-with 002 FR-012 | 101-gate-and-verdict | 101 | no |
| 028 FR-007 | merged-with 002 FR-014 | 101-gate-and-verdict | 101 | no |
| 028 FR-008 | merged-with 002 FR-010 | 101-gate-and-verdict | 101 | no |
| 028 FR-009 | ported | 101-gate-and-verdict | 101 | no |
| 028 FR-010 | merged-with 002 FR-011 | 101-gate-and-verdict | 101 | no |
| 028 FR-011 | translated | 101-gate-and-verdict | 101 | no |
| 028 FR-012 | ported | 101-gate-and-verdict | 101 | no |
| 028 FR-013 | ported | 101-gate-and-verdict | 101 | no |
| 028 FR-014 | ported | 101-gate-and-verdict | 101 | no |
| 028 FR-015 | merged-with 002 FR-046 | 102-run-control | 102 | no |
| 028 FR-016 | merged-with 002 FR-016 | 102-run-control | 102 | no |
| 028 FR-017 | ported | 118-pass-supervision-and-jobs | 103 | yes, from 103 |
| 028 FR-018 | ported | 103-proposer-pass | 103 | no |
| 028 FR-019 | ported | 118-pass-supervision-and-jobs | 103 | yes, from 103 |
| 028 FR-020 | ported | 105-verification | 105 | no |
| 028 FR-021 | translated | 109-harness-seam | 109 | no |
| 028 FR-022 | translated | 128-telemetry-export | 111 | yes, from 111 |
| 028 FR-023 | merged-with 002 FR-003 | 119-front-door-and-presenter | 102 | yes, from 102 |
| 028 FR-024 | ported | 106-learning | 106 | no |
| 028 FR-025 | ported | 108-reverse | 108 | no |
| 028 FR-026 | ported | 108-reverse | 108 | no |
| 028 FR-027 | ported | 140-reverse-inventory-and-lint | 108 | yes, from 108 (Stage B split) |
| 028 FR-028 | translated | 109-harness-seam | 109 | no |
| 028 FR-029 | translated | 104-spec-input | 104 | no |
| 028 FR-030 | superseded-by DV-057 | 100-specstride | 100 | no |
| 028 SC-001 | translated | 101-gate-and-verdict | 101 | no |
| 028 SC-002 | merged-with 002 SC-001 | 101-gate-and-verdict | 101 | no |
| 028 SC-003 | merged-with 002 SC-004 | 100-specstride | 100 | no |
| 028 SC-004 | ported | 101-gate-and-verdict | 101 | no |
| 028 SC-005 | ported | 101-gate-and-verdict | 101 | no |
| 028 SC-006 | ported | 108-reverse | 108 | no |
| 028 SC-007 | superseded-by DV-002 | 109-harness-seam | 109 | no |
| 028 SC-008 | superseded-by DV-057 | 100-specstride | 100 | no |
| 011 FR-001 | ported | 107-launch-contract | 107 | no |
| 011 FR-002 | ported | 107-launch-contract | 107 | no |
| 011 FR-003 | translated | 106-learning | 106 | no |
| 011 FR-004 | ported | 107-launch-contract | 107 | no |
| 011 FR-005 | ported | 107-launch-contract | 107 | no |
| 011 FR-006 | translated | 107-launch-contract | 107 | no |
| 011 FR-007 | ported | 104-spec-input | 104 | no |
| 011 FR-008 | ported | 107-launch-contract | 107 | no |
| 011 FR-009 | translated | 107-launch-contract | 107 | no |
| 011 FR-010 | translated | 107-launch-contract | 107 | no |
| 011 FR-011 | ported | 123-pipeline-runtime-and-supervisor | 107 | yes, from 107 |
| 011 FR-012 | translated | 123-pipeline-runtime-and-supervisor | 107 | yes, from 107 |
| 011 FR-013 | ported | 123-pipeline-runtime-and-supervisor | 107 | yes, from 107 |
| 011 FR-014 | ported | 123-pipeline-runtime-and-supervisor | 107 | yes, from 107 |
| 011 FR-015 | ported | 123-pipeline-runtime-and-supervisor | 107 | yes, from 107 |
| 011 FR-016 | ported | 106-learning | 106 | no |
| 011 FR-017 | superseded-by DV-009 | 113-host-claude-code | 113 | no |
| 011 FR-018 | ported | 106-learning | 106 | no |
| 011 FR-019 | translated | 123-pipeline-runtime-and-supervisor | 107 | yes, from 107 |
| 011 FR-020 | translated | 123-pipeline-runtime-and-supervisor | 107 | yes, from 107 |
| 011 FR-021 | ported | 123-pipeline-runtime-and-supervisor | 107 | yes, from 107 |
| 011 FR-022 | translated | 123-pipeline-runtime-and-supervisor | 107 | yes, from 107 |
| 011 FR-023 | translated | 123-pipeline-runtime-and-supervisor | 111 | yes, from 111 |
| 011 FR-024 | translated | 106-learning | 106 | no |
| 011 FR-025 | superseded-by DV-056 | 113-host-claude-code | 113 | no |
| 011 FR-026 | dropped | none | none | — |
| 011 FR-027 | superseded-by DV-038 | 107-launch-contract | none | yes, from none |
| 011 SC-001 | superseded-by DV-057 | 100-specstride | 100 | no |
| 011 SC-002 | dropped | none | none | — |
| 011 SC-003 | ported | 123-pipeline-runtime-and-supervisor | 107 | yes, from 107 |
| 011 SC-004 | ported | 100-specstride | 100 | no |
| 011 SC-005 | ported | 123-pipeline-runtime-and-supervisor | 107 | yes, from 107 |
| 011 SC-006 | ported | 123-pipeline-runtime-and-supervisor | 107 | yes, from 107 |
| 011 SC-007 | ported | 100-specstride | 100 | no |
| 011 SC-008 | translated | 141-parity-oracle | 107 | yes, from 107 |
| 002 FR-001 | merged-with 028 FR-023 | 119-front-door-and-presenter | 102 | yes, from 102 |
| 002 FR-002 | merged-with 028 FR-023 | 119-front-door-and-presenter | 102 | yes, from 102 |
| 002 FR-003 | merged-with 028 FR-023 | 119-front-door-and-presenter | 102 | yes, from 102 |
| 002 FR-004 | superseded-by DV-042 | 119-front-door-and-presenter | 102 | yes, from 102 |
| 002 FR-005 | ported | 119-front-door-and-presenter | 102 | yes, from 102 |
| 002 FR-006 | superseded-by DV-043 | 110-config-and-terms | 110 | no |
| 002 FR-007 | merged-with 028 FR-023 | 119-front-door-and-presenter | 102 | yes, from 102 |
| 002 FR-008 | merged-with 028 FR-003 | 101-gate-and-verdict | 101 | no |
| 002 FR-009 | superseded-by DV-040 | 105-verification | 105 | no |
| 002 FR-010 | merged-with 028 FR-008 | 101-gate-and-verdict | 101 | no |
| 002 FR-011 | merged-with 028 FR-010 | 101-gate-and-verdict | 101 | no |
| 002 FR-012 | merged-with 028 FR-006 | 101-gate-and-verdict | 101 | no |
| 002 FR-013 | ported | 101-gate-and-verdict | 101 | no |
| 002 FR-014 | merged-with 028 FR-007 | 101-gate-and-verdict | 101 | no |
| 002 FR-015 | merged-with 028 SC-003 | 100-specstride | 100 | no |
| 002 FR-016 | merged-with 028 FR-016 | 102-run-control | 102 | no |
| 002 FR-017 | superseded-by DV-042 | 129-run-view-and-status | 102 | yes, from 102 |
| 002 FR-018 | merged-with 028 FR-005 | 101-gate-and-verdict | 101 | no |
| 002 FR-019 | merged-with 028 FR-005 | 101-gate-and-verdict | 101 | no |
| 002 FR-020 | merged-with 028 FR-006 | 101-gate-and-verdict | 101 | no |
| 002 FR-021 | merged-with 028 FR-006 | 117-critic-grounding-and-prompt | 101 | yes, from 101 |
| 002 FR-022 | deferred 3+ | roadmap: Critic ensemble | roadmap | — |
| 002 FR-023 | translated | 144-compatibility-projection | 111 | yes, from 111 (Stage B split) |
| 002 FR-024 | deferred 3+ | roadmap: Event delivery dispatcher | roadmap | — |
| 002 FR-025 | deferred 3+ | roadmap: Human approvals of plan revisions | roadmap | — |
| 002 FR-026 | deferred 3+ | roadmap: Human approvals of plan revisions | roadmap | — |
| 002 FR-027 | deferred 3+ | roadmap: Human approvals of plan revisions | roadmap | — |
| 002 FR-028 | merged-with 028 FR-029 | 104-spec-input | 104 | no |
| 002 FR-029 | merged-with 028 FR-002 | 104-spec-input | 104 | no |
| 002 FR-030 | deferred 3+ | roadmap: Spec bundle import and verification plans bound to a spec bundle | roadmap | — |
| 002 FR-031 | deferred 3+ | roadmap: Spec bundle import and verification plans bound to a spec bundle | roadmap | — |
| 002 FR-032 | deferred 3+ | roadmap: Spec bundle import and verification plans bound to a spec bundle | roadmap | — |
| 002 FR-033 | deferred 3+ | roadmap: Spec bundle import and verification plans bound to a spec bundle | roadmap | — |
| 002 FR-034 | deferred 3+ | roadmap: Spec bundle import and verification plans bound to a spec bundle | roadmap | — |
| 002 FR-035 | deferred 3+ | roadmap: Spec bundle import and verification plans bound to a spec bundle | roadmap | — |
| 002 FR-036 | deferred 3+ | roadmap: Spec bundle import and verification plans bound to a spec bundle | roadmap | — |
| 002 FR-037 | deferred 3+ | roadmap: Spec bundle import and verification plans bound to a spec bundle | roadmap | — |
| 002 FR-038 | merged-with 028 FR-020 | 105-verification | 105 | no |
| 002 FR-039 | deferred 3+ | roadmap: Feature parallelism in separate workspaces | roadmap | — |
| 002 FR-040 | deferred 3+ | roadmap: Feature parallelism in separate workspaces | roadmap | — |
| 002 FR-041 | translated | 127-quota-budgets-and-pause | 110 | yes, from 110 |
| 002 FR-042 | translated | 127-quota-budgets-and-pause | 110 | yes, from 110 |
| 002 FR-043 | deferred 3+ | roadmap: Scheduler queue and cron | roadmap | — |
| 002 FR-044 | deferred 3+ | roadmap: Scheduler queue and cron | roadmap | — |
| 002 FR-045 | deferred 3+ | roadmap: Scheduler queue and cron | roadmap | — |
| 002 FR-046 | merged-with 028 FR-015 | 102-run-control | 102 | no |
| 002 FR-047 | deferred 3+ | roadmap: Scheduler queue and cron | roadmap | — |
| 002 FR-048 | translated | 142-parallel-units | roadmap | yes, from roadmap |
| 002 FR-049 | deferred 3+ | roadmap: Server mode and the index database | roadmap | — |
| 002 FR-050 | deferred 3+ | roadmap: Human approvals of plan revisions | roadmap | — |
| 002 FR-051 | deferred 2 | 121-kanban-ui | 121-kanban-ui | — |
| 002 FR-052 | deferred 3+ | roadmap: Engine hooks | roadmap | — |
| 002 FR-053 | deferred 3+ | roadmap: Server mode and the index database | roadmap | — |
| 002 SC-001 | merged-with 028 SC-002 | 101-gate-and-verdict | 101 | no |
| 002 SC-002 | merged-with 028 FR-003 | 101-gate-and-verdict | 101 | no |
| 002 SC-003 | ported | 101-gate-and-verdict | 101 | no |
| 002 SC-004 | merged-with 028 SC-003 | 100-specstride | 100 | no |
| 002 SC-005 | deferred 3+ | roadmap: Spec bundle import and verification plans bound to a spec bundle | roadmap | — |
| 002 SC-006 | deferred 3+ | roadmap: Human approvals of plan revisions | roadmap | — |
| 002 SC-007 | deferred 2 | 121-kanban-ui | 121-kanban-ui | — |

Counts by disposition. 31 of the 133 destinations were re-mapped against R19's draft; the one the
owner's rulings added is 002 FR-048, which left the roadmap for 142-parallel-units (ruling 56).

| System | ported | merged-with | translated | superseded-by | deferred | dropped | Total |
|---|---|---|---|---|---|---|---|
| 028 | 16 | 12 | 7 | 3 | 0 | 0 | 38 |
| 011 | 18 | 0 | 11 | 4 | 0 | 2 | 35 |
| 002 | 3 | 22 | 4 | 4 | 27 | 0 | 60 |
| Total | 37 | 34 | 22 | 11 | 27 | 2 | 133 |

Per feature:

| Feature | As-is requirements | As-is success criteria | Ids |
|---|---|---|---|
| 100-specstride | 2 | 6 | 028 FR-030, 028 SC-003, 028 SC-008, 011 SC-001, 011 SC-004, 011 SC-007, 002 FR-015, 002 SC-004 |
| 141-parity-oracle | 0 | 1 | 011 SC-008 |
| 101-gate-and-verdict | 20 | 7 | 028 FR-003, 028 FR-005, 028 FR-006, 028 FR-007, 028 FR-008, 028 FR-009, 028 FR-010, 028 FR-011, 028 FR-012, 028 FR-013, 028 FR-014, 028 SC-001, 028 SC-002, 028 SC-004, 028 SC-005, 002 FR-008, 002 FR-010, 002 FR-011, 002 FR-012, 002 FR-013, 002 FR-014, 002 FR-018, 002 FR-019, 002 FR-020, 002 SC-001, 002 SC-002, 002 SC-003 |
| 117-critic-grounding-and-prompt | 1 | 0 | 002 FR-021 |
| 102-run-control | 4 | 0 | 028 FR-015, 028 FR-016, 002 FR-016, 002 FR-046 |
| 119-front-door-and-presenter | 7 | 0 | 028 FR-023, 002 FR-001, 002 FR-002, 002 FR-003, 002 FR-004, 002 FR-005, 002 FR-007 |
| 103-proposer-pass | 1 | 0 | 028 FR-018 |
| 118-pass-supervision-and-jobs | 2 | 0 | 028 FR-017, 028 FR-019 |
| 104-spec-input | 6 | 0 | 028 FR-001, 028 FR-002, 028 FR-029, 011 FR-007, 002 FR-028, 002 FR-029 |
| 105-verification | 3 | 0 | 028 FR-020, 002 FR-009, 002 FR-038 |
| 106-learning | 5 | 0 | 028 FR-024, 011 FR-003, 011 FR-016, 011 FR-018, 011 FR-024 |
| 107-launch-contract | 9 | 0 | 011 FR-001, 011 FR-002, 011 FR-004, 011 FR-005, 011 FR-006, 011 FR-008, 011 FR-009, 011 FR-010, 011 FR-027 |
| 123-pipeline-runtime-and-supervisor | 10 | 3 | 011 FR-011, 011 FR-012, 011 FR-013, 011 FR-014, 011 FR-015, 011 FR-019, 011 FR-020, 011 FR-021, 011 FR-022, 011 FR-023, 011 SC-003, 011 SC-005, 011 SC-006 |
| 122-detached-runtime | 1 | 0 | 028 FR-004 |
| 108-reverse | 3 | 1 | 028 FR-025, 028 FR-026, 028 FR-027, 028 SC-006 |
| 109-harness-seam | 2 | 1 | 028 FR-021, 028 FR-028, 028 SC-007 |
| 124-harness-discovery-and-roles | 0 | 0 | none |
| 125-adapter-claude | 0 | 0 | none |
| 130-adapter-dsh | 0 | 0 | none |
| 131-adapter-codex | 0 | 0 | none |
| 134-adapter-pi | 0 | 0 | none |
| 138-adapter-prime | 0 | 0 | none |
| 126-stream-seam-and-invocation | 0 | 0 | none |
| 110-config-and-terms | 1 | 0 | 002 FR-006 |
| 127-quota-budgets-and-pause | 2 | 0 | 002 FR-041, 002 FR-042 |
| 111-event-schema-and-projection | 1 | 0 | 002 FR-023 |
| 128-telemetry-export | 1 | 0 | 028 FR-022 |
| 129-run-view-and-status | 1 | 0 | 002 FR-017 |
| 112-doctor | 0 | 0 | none |
| 113-host-claude-code | 2 | 0 | 011 FR-017, 011 FR-025 |
| 115-micro-loop-layer | 0 | 0 | none |
| 142-parallel-units | 1 | 0 | 002 FR-048 |
| No Wave 1 feature (section D.2) | 25 | 4 | see D.2 |
| **Total** | **110** | **23** | |

Result: each of the 110 requirements and 23 success criteria appears in exactly one brief, under
heading 2, or is deferred or dropped in section D.2. None appears in two briefs.

### D.2 Deferred or dropped, with no Wave 1 feature

| As-is id | Behaviour (short) | Disposition | Destination | Roadmap entry or register row |
|---|---|---|---|---|
| 011 FR-026 | Reminder on stderr when the caller is not the shell | dropped | none | DV-061 |
| 011 SC-002 | Merge automation with a label and a green CI | dropped | none | DV-057 |
| 002 FR-022 | Critic ensemble, second-judge concurrence | deferred 3+ | roadmap | roadmap: Critic ensemble |
| 002 FR-024 | Delivery dispatcher keyed by adapter id and idempotency key | deferred 3+ | roadmap | roadmap: Event delivery dispatcher |
| 002 FR-025 | Approval decision refusal rules | deferred 3+ | roadmap | roadmap: Human approvals of plan revisions |
| 002 FR-026 | Approval store idempotency and atomic rewrite | deferred 3+ | roadmap | roadmap: Human approvals of plan revisions |
| 002 FR-027 | Approvals CLI refusal, exit 2 | deferred 3+ | roadmap | roadmap: Human approvals of plan revisions |
| 002 FR-030 | `spec import-project` refusals | deferred 3+ | roadmap | roadmap: Spec bundle import and verification plans bound to a spec bundle |
| 002 FR-031 | Artifact selection by role | deferred 3+ | roadmap | roadmap: Spec bundle import and verification plans bound to a spec bundle |
| 002 FR-032 | Exactly one spec and one tasks artifact | deferred 3+ | roadmap | roadmap: Spec bundle import and verification plans bound to a spec bundle |
| 002 FR-033 | `--require-traceability` failures | deferred 3+ | roadmap | roadmap: Spec bundle import and verification plans bound to a spec bundle |
| 002 FR-034 | Import summary fields | deferred 3+ | roadmap | roadmap: Spec bundle import and verification plans bound to a spec bundle |
| 002 FR-035 | Snapshot artifacts and recompute the semantic hash | deferred 3+ | roadmap | roadmap: Spec bundle import and verification plans bound to a spec bundle |
| 002 FR-036 | Bundle store hash refusals | deferred 3+ | roadmap | roadmap: Spec bundle import and verification plans bound to a spec bundle |
| 002 FR-037 | Verification plan bound to a spec bundle; immutable store | deferred 3+ | roadmap | roadmap: Spec bundle import and verification plans bound to a spec bundle |
| 002 FR-039 | Scheduler safety predicate, five checks | deferred 3+ | roadmap | roadmap: Feature parallelism in separate workspaces |
| 002 FR-040 | Greedy batch admission up to a parallel limit | deferred 3+ | roadmap | roadmap: Feature parallelism in separate workspaces |
| 002 FR-043 | Queue selection by priority, then first in first out | deferred 3+ | roadmap | roadmap: Scheduler queue and cron |
| 002 FR-044 | Idempotent start of a job attempt | deferred 3+ | roadmap | roadmap: Scheduler queue and cron |
| 002 FR-045 | Queue crash recovery | deferred 3+ | roadmap | roadmap: Scheduler queue and cron |
| 002 FR-047 | Cron evaluation and misfire policy | deferred 3+ | roadmap | roadmap: Scheduler queue and cron |
| 002 FR-049 | API server authentication, health endpoint, remote calls | deferred 3+ | roadmap | roadmap: Server mode and the index database |
| 002 FR-050 | Approvals webhook response routing | deferred 3+ | roadmap | roadmap: Human approvals of plan revisions |
| 002 FR-051 | Trajectory paging clamp and cursor | deferred 2 | 121-kanban-ui | roadmap: 121-kanban-ui |
| 002 FR-052 | Engine hooks fail closed at blockable points | deferred 3+ | roadmap | roadmap: Engine hooks |
| 002 FR-053 | Index database, rebuildable | deferred 3+ | roadmap | roadmap: Server mode and the index database |
| 002 SC-005 | Spec bundles with disagreeing hashes are refused on read | deferred 3+ | roadmap | roadmap: Spec bundle import and verification plans bound to a spec bundle |
| 002 SC-006 | Approval decisions on a stale hash are refused | deferred 3+ | roadmap | roadmap: Human approvals of plan revisions |
| 002 SC-007 | A trajectory page holds at most 500 records | deferred 2 | 121-kanban-ui | roadmap: 121-kanban-ui |

25 requirements and 4 success criteria have no Wave 1 feature: 2 are `dropped`, the others `deferred`,
all of them from 002. By ruling D2 the rest of Lisa's scheduler stays deferred; 002 FR-048 alone
moved to Wave 1.

Every `superseded-by` requirement has a Wave 1 feature and is in that feature's brief, because the feature
specifies what replaces it: 028 FR-030 (100); 028 SC-007 (109); 028 SC-008 (100); 011 FR-017 (113); 011 FR-025 (113); 011 FR-027 (107); 011 SC-001 (100); 002 FR-004 (119); 002 FR-006 (110); 002 FR-009 (105); 002 FR-017 (129).

The two `dropped` rows and the eleven `superseded-by` rows were approved by the owner (ruling K8).
011 FR-026: the reminder exists to steer a model toward the scripts, and one CLI with terse output
removes the cause (decision 16; DV-061). 011 SC-002: repository merge automation is not product behaviour.

### D.3 Every extension point has one owning feature

The normative interface text of every extension point is an annex of feature 100, so that every
feature cites one place. The **owning feature** is the content owner: it specifies the core side, the
registry, the conformance suite, the sample outside the core and the Wave 1 implementations. Other
features that implement or consume the point are listed and own nothing of it.

| EP | Name | Interface text | Owning feature | Also implements (owns nothing of the point) |
|---|---|---|---|---|
| EP-01 | Host port | 100, annexes G and H | 113-host-claude-code | 120 in Wave 2 |
| EP-02 | Harness port, harness descriptor, stream readers, role resolution | 100, annex C | 109-harness-seam | The adapters 125, 130, 131, 134, 138; 126 (stream readers, a sub-point); 124 (role resolution, a sub-point); 117 (the withheld paths of a critic with read tools) |
| EP-03 | Spec-format adapter | 100, annex C | 104-spec-input | — |
| EP-04 | Loop-layer interface, with stacking and the group directives | 100, annex D | 103-proposer-pass | 115 (the layer `micro`), 142 (the layer `parallel`), 143 (the engine services behind the directives) |
| EP-05 | Check runner | 100, annex C | 148-check-runner | 105 consumes (the manifest), 116 (the fingerprints around it), 115 and 142 use it |
| EP-06 | Router rule table | 100, annex D | 115-micro-loop-layer | — |
| EP-07 | Verification-plan source | 100, annex C | 105-verification | 107 (the launch-contract inventory as a source) |
| EP-08 | Event sink | 100, annex C | 111-event-schema-and-projection | 128 (OTLP and Loki sinks) |
| EP-09 | UI read model `RunView` | 100, annex G | 129-run-view-and-status | 121 in Wave 2 |
| EP-10 | Secret resolver | 100, annex C | 110-config-and-terms | — |
| EP-11 | Terms-gate data | 100, annex C | 147-terms-gate | 110 spells its keys; the adapters supply the facts of their rows |
| EP-12 | Quota classifier | 100, annex C | 127-quota-budgets-and-pause | The adapters 125, 130, 131, 134, 138 (their classifier entries); 109 (the `failures` map of a descriptor) |
| EP-13 | Lock and liveness provider | 100, annex F | 122-detached-runtime | — |
| EP-14 | Doctor check registry | 100, annex G | 112-doctor | Every feature that registers checks |
| EP-15 | Prompt block provider | 100, annex D | 103-proposer-pass | 115 (the checkpoint contract block), 118 (the yield contract block), 117 (the critic's own assembler uses the block form), 130 (the plugin protocol section), 142 (the reserved-tasks block and the worker block) |
| EP-16 | Toolchain profile | 100, annex C | 116-check-integrity-and-unit-evidence | 148, 143 and 105 consume |
| EP-17 | Detach strategy | 100, annex F | 122-detached-runtime | — |
| EP-18 | Critic strategy and attempt planner (internal seams) | 100, annex E | 149-attempt-planner-and-seams | 101 keeps the verdict grammar and the guarantees the seams promise |
| EP-19 | Stage kind and precondition check | 100, annex F | 123-pipeline-runtime-and-supervisor | — |

Result: 19 of 19 extension points have exactly one owning feature. Owning features and their counts:
103 (2), 122 (2), and one each for 104, 105, 109, 110, 111, 112, 113, 115, 116, 123, 127, 129,
147, 148, 149. None of the five features the owner added owns an extension point: each implements one.

### D.4 Every cross-feature contract has one owning feature

As in D.3: the schema and its id are in an annex of feature 100; the owning feature is the content
owner, which writes the record or defines its content. Contracts marked **E-2** are the ones that
R15v E-2 found without an owner. Contracts marked **new** come from the owner's rulings.

| Contract | Owning feature | Marked |
|---|---|---|
| State layout and logical names; identifiers; atomic write | 100 | |
| Run-state machine | 100 | |
| Exit codes per process | 100 | |
| Stop-reason enumeration | 100 | |
| CLI protocol and line grammar | 100 (each line: the feature that prints it) | |
| Event envelope and versioning, with `workerId` and `wseq` | 100 | |
| Event schema content | 111 | |
| Config envelope, ranks and trust classes | 100 | |
| Config schema content | 110 | |
| Ledger | 103 | E-2 |
| Approval record, signed | 101 | E-2 |
| Terminal record | 101 | E-2 |
| Inbox request types | 122 (the stop request: 102; `hold-relaunch`: 123; host events: written by 113, read by 127) | E-2 |
| Process registry | 122 | E-2 |
| Table evaluator | 100 | E-2 |
| Redactor, with the pattern set | 111 | E-2 |
| The `parity` profile | 100 | E-2 (B-5) |
| The list of closed sets | 100 | A-16 |
| Normalization rules, layout tables, alias and component tables | 100 (implemented by 141) | |
| Launch record and lease | 122 | |
| Run snapshot, with the source hashes of the run | 102 | |
| Staleness verdict | 104 | new (K3) |
| Pause record | 127 | |
| `supervision.json` | 123 | |
| Relaunch classifier tables | 123 | |
| Launch-contract schema | 107 | |
| Harness descriptor schema | 109 | |
| Forms of the `completion` level | 109 | new (57) |
| Withheld paths for a critic with read tools | 117 | new (D1) |
| Dialect table of the JSONL reader | 138 | new (32b) |
| Resolved registry and role plan | 124 | |
| Canonical spec model; canonical hasher | 104 | |
| Containment levels; overlay schema | 109 | |
| Yield artifact schema | 118 | |
| Check manifest, with declared reads and writes | 105 | |
| Fingerprints and the protected set | 116 | moved in the Stage B split |
| Fact block | 116 (its slot and escaping: 117) | moved in the Stage B split |
| Tree-store service | 143 | new (56, P1); moved in the Stage B split |
| Parallel plan | 142 | new (56) |
| Doctor findings | 112 | |
| Tripwire record | 115 | stayed through the Stage B split |
| Threat model | 100 | |
| Fixture, waiver and exercise-map formats (development contracts) | 141 | |

Result: every contract has exactly one owning feature. Two schemas are owned by an adapter and used
by no other feature, so they are not cross-feature contracts: the plugin request and the install
receipt of 130.

Single owners ruled by R15v E-3, as applied in the briefs, with the owners the rulings added:

| Behaviour | Single owner | Others, and what they keep |
|---|---|---|
| `status` | 129: data and default output | 119: compatibility output |
| What happens after the engine or the root dies | 123: the classifier | 102: the `resume` command; 122: lock reclaim, and the end of processes that outlive the engine |
| Stop | 102 | 122: the inbox as a mechanism; 123: the compatibility spelling `supervise stop`; 142: what a stop does to a live group |
| Fingerprints and the protected set | 116 | 105, 148 and 142 consume |
| The step runner | 148 | 118 names it as out of scope |
| The digest and output lines | 100: the line grammar | Each feature its lines: 123 the digest and `[MOL-*]`, 119 the front door, 145 the presenter and banner, 115 `[LOOP]`, 142 the `parallel=` fields of `[LOOP]` |
| Staleness of spec, plan and task list | 104: the hashing and the verdict | 102: the comparison at launch and at resume; 103: at every pass start; 105: at critic start, under the `parity` profile only |
| `resume` refusals and their codes | 102 | 100: the codes in the per-command table |
| The critic with read-only tools | 109: the form and its proof as a contract | 117: what it is given and what is hidden; 124: its place in the critic order; 131: the first harness |
| The JSONL reader for stream schema v3 | 138 | 134: one row of the dialect table; 126: the registry it registers in |
| Concurrent verification commands | 148 | 142 names them as out of scope |
| The tier bump | 149 | 115: the ablation arm; 110: the keys |
| Redaction patterns and the canary test | 111 | 128: the switch of content capture; 100: the release condition |

### D.5 The measurable success criteria of the prompt, each with one owner

| Example in the prompt, section 6 "Rules for every spec" | Owning feature | Contributing features |
|---|---|---|
| A run survives closing the host session and status re-attaches | 122 | 129 (the reading half), 113 (the session-start line) |
| A quota exhaustion pauses the run without adding to the reject count | 127 | The adapters (the signal), 103 (the carve-out from consecutive errors), 142 (the pause of a group) |
| Time from launch to all gates approved on a reference project, reported per stage against the measured baseline, with the micro-loop targets of decision 21 | 115 | 118 (fail-fast, X2), 103 (index and carry-over, X3), 100 (integration acceptance) |
| A harness the product has no tested adapter for is discovered, shown by the doctor as unverified, and completes a run as critic from a descriptor alone | 109 | 124 (discovered), 112 (shown as unverified). Each carries its part as a criterion of its own |
| With no critic configured, a qualifying discovered harness is picked as the diverse critic and the pick appears in the digest | 124 | 123 (the digest line), 112 (`critic.autopick`) |
| Each host skill stays within its token budget, enforced in CI | 113 | 119, 123, 129, 112 (the byte limits of their commands) |
| The critic never approves its own session; the critic-diversity rule and its warning are specified | 149 (never its own session, F149-SC-001, moved from 101 in the split); 124 (the rule and the warning) | 112 (`critic.diversity`), the adapters (the proof in the call record) |

### D.6 Every behaviour item has a destination

From `traceability-items.tsv`: 2,785 items, each with one destination. The two over 2,783 (B-2784,
B-2785, the `run_stop` write sites of `proposer.sh:2253` and `:2259`) were added by feature 141.
No item is deferred: the 136 items of dsh, Codex and prime are Wave 1 parity items (ruling 32). The
tables under heading 2 of the briefs count the 2 `merged-with` items of 104 among its translated
items. Updated for the nine splits of section A.1a.

| Destination | Items | Clusters touched | ported | translated | merged-with | superseded-by | deferred | dropped |
|---|---|---|---|---|---|---|---|---|
| 100-specstride | 19 | 8 | 3 | 5 | 0 | 11 | 0 | 0 |
| 141-parity-oracle | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 101-gate-and-verdict | 157 | 17 | 92 | 65 | 0 | 0 | 0 | 0 |
| 149-attempt-planner-and-seams | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 117-critic-grounding-and-prompt | 102 | 8 | 90 | 12 | 0 | 0 | 0 | 0 |
| 102-run-control | 56 | 14 | 35 | 19 | 0 | 2 | 0 | 0 |
| 119-front-door-and-presenter | 101 | 14 | 92 | 5 | 0 | 4 | 0 | 0 |
| 145-presenter | 139 | 22 | 69 | 70 | 0 | 0 | 0 | 0 |
| 103-proposer-pass | 106 | 20 | 57 | 49 | 0 | 0 | 0 | 0 |
| 118-pass-supervision-and-jobs | 181 | 27 | 105 | 76 | 0 | 0 | 0 | 0 |
| 104-spec-input | 117 | 20 | 80 | 34 | 2 | 1 | 0 | 0 |
| 105-verification | 159 | 26 | 95 | 64 | 0 | 0 | 0 | 0 |
| 148-check-runner | 4 | 1 | 4 | 0 | 0 | 0 | 0 | 0 |
| 106-learning | 197 | 29 | 107 | 89 | 0 | 1 | 0 | 0 |
| 107-launch-contract | 79 | 18 | 54 | 23 | 0 | 2 | 0 | 0 |
| 123-pipeline-runtime-and-supervisor | 178 | 19 | 125 | 52 | 0 | 1 | 0 | 0 |
| 122-detached-runtime | 16 | 9 | 5 | 8 | 0 | 3 | 0 | 0 |
| 108-reverse | 159 | 14 | 132 | 26 | 0 | 1 | 0 | 0 |
| 140-reverse-inventory-and-lint | 246 | 20 | 198 | 47 | 0 | 1 | 0 | 0 |
| 109-harness-seam | 94 | 21 | 35 | 40 | 0 | 19 | 0 | 0 |
| 124-harness-discovery-and-roles | 13 | 10 | 2 | 5 | 0 | 6 | 0 | 0 |
| 146-harness-discovery | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 125-adapter-claude | 16 | 5 | 3 | 13 | 0 | 0 | 0 | 0 |
| 130-adapter-dsh | 66 | 14 | 28 | 38 | 0 | 0 | 0 | 0 |
| 131-adapter-codex | 8 | 4 | 4 | 4 | 0 | 0 | 0 | 0 |
| 134-adapter-pi | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 138-adapter-prime | 62 | 13 | 35 | 27 | 0 | 0 | 0 | 0 |
| 126-stream-seam-and-invocation | 212 | 32 | 133 | 76 | 0 | 3 | 0 | 0 |
| 110-config-and-terms | 25 | 14 | 0 | 0 | 0 | 25 | 0 | 0 |
| 147-terms-gate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 127-quota-budgets-and-pause | 6 | 5 | 4 | 2 | 0 | 0 | 0 | 0 |
| 111-event-schema-and-projection | 22 | 2 | 21 | 1 | 0 | 0 | 0 | 0 |
| 144-compatibility-projection | 16 | 7 | 10 | 6 | 0 | 0 | 0 | 0 |
| 128-telemetry-export | 191 | 45 | 14 | 175 | 0 | 2 | 0 | 0 |
| 129-run-view-and-status | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 112-doctor | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 113-host-claude-code | 27 | 9 | 0 | 7 | 0 | 20 | 0 | 0 |
| 115-micro-loop-layer | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 116-check-integrity-and-unit-evidence | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 142-parallel-units | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 143-parallel-engine-services | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| none (dropped) | 11 | 7 | 0 | 0 | 0 | 0 | 0 | 11 |
| **Total** | **2785** | | **1632** | **1038** | **2** | **102** | **0** | **11** |

By source module (57 modules in R18 Appendix A; the telemetry assets and the Spec Kit templates are
grouped here). A destination is written by its feature number; the table predates the nine splits of
section A.1a, so the items that moved to 140, 144, 145 and 148 are still counted under 108, 111, 119
and 105 here. The first table above is the one that agrees with `traceability-items.tsv` per
destination.

| System | Source module | Items | Destinations, with items |
|---|---|---|---|
| 028 | `.env.example` | 10 | 110 (10) |
| 028 | `specstride_env.py` | 4 | 110 (4) |
| 028 | `orchestrator.sh` | 347 | 101 (108), 105 (48), 103 (33), 118 (26), 119 (25), 104 (22), 100 (16), 102 (14), 128 (12), 106 (10), 122 (9), 111 (7), 127 (6), 124 (5), 109 (3), 110 (3) |
| 028 | `specstride-digest.sh` | 8 | none (8) |
| 028 | `specstride-lib.sh` | 34 | 118 (12), 111 (6), 128 (4), 100 (3), 105 (3), 110 (2), 104 (2), 109 (1), 126 (1) |
| 028 | `wiggum` | 2 | 119 (2) |
| 028 | `wiggum-lib.sh` | 1 | 119 (1) |
| 028 | `backend_overlay.py` | 32 | 109 (32) |
| 028 | `backends.py` | 15 | 109 (12), 130 (1), 131 (1), 138 (1) |
| 028 | `dsh_plugin_requests.py` | 11 | 130 (11) |
| 028 | `error_breaker.py` | 7 | 103 (7) |
| 028 | `failure_ledger.py` | 11 | 118 (11) |
| 028 | `proposer.sh` | 338 | 118 (131), 103 (65), 126 (40), 130 (36), 109 (25), 138 (11), 128 (9), 125 (9), 124 (5), 102 (4), 131 (2), 111 (1) |
| 028 | `critic.py` | 225 | 117 (93), 101 (49), 109 (21), 130 (18), 104 (8), 138 (8), 125 (7), 128 (6), 131 (5), 124 (3), 105 (3), 111 (3), 110 (1) |
| 028 | `verdict_pins.py` | 9 | 117 (9) |
| 028 | `verification_failure_digest.py` | 10 | 105 (10) |
| 028 | `verification_plan.py` | 99 | 105 (99) |
| 028 | `banner.py` | 23 | 119 (23) |
| 028 | `learn.py` | 154 | 106 (153), 110 (1) |
| 028 | `present.py` | 80 | 119 (79), 110 (1) |
| 028 | `theme.py` | 19 | 119 (19) |
| 028 | `specstride` | 172 | 119 (91), 102 (38), 108 (26), 106 (13), 122 (3), 110 (1) |
| 028 | `reverse.py` | 264 | 108 (264) |
| 028 | `reverse_inventory.py` | 104 | 108 (104) |
| 028 | `README.md` | 1 | 108 (1) |
| 028 | `Spec Kit templates` | 10 | 108 (10) |
| 028 | `specstride_spec.py` | 81 | 104 (80), 110 (1) |
| 028 | `agent_stream.py` | 86 | 126 (84), 110 (1), 138 (1) |
| 028 | `finalize_invocation.py` | 20 | 126 (20) |
| 028 | `invocation_result.py` | 38 | 126 (38) |
| 028 | `observability_policy.py` | 21 | 111 (21) |
| 028 | `prime_stream.py` | 41 | 138 (41) |
| 028 | `ralph_loki_ship.py` | 35 | 128 (35) |
| 028 | `ralph_otel_ship.py` | 36 | 128 (36) |
| 028 | `ralph_otel_spans.py` | 40 | 128 (40) |
| 028 | `stream_seam.py` | 29 | 126 (29) |
| 028 | `telemetry_delivery.py` | 20 | 128 (20) |
| 028 | `telemetry/ assets` | 29 | 128 (29) |
| 011 | `bootstrap_contract.py` | 25 | 107 (18), 106 (3), 104 (3), none (1) |
| 011 | `contract_lib.py` | 51 | 107 (37), 106 (6), 123 (5), none (2), 104 (1) |
| 011 | `render_launcher.py` | 12 | 107 (12) |
| 011 | `runtime.py` | 74 | 123 (72), 106 (1), 122 (1) |
| 011 | `validate_contract.py` | 13 | 107 (12), 104 (1) |
| 011 | `onboard-skill` | 19 | 113 (19) |
| 011 | `SKILL.md` | 8 | 113 (8) |
| 011 | `supervise.py` | 25 | 123 (20), 106 (5) |
| 011 | `supervisor_lib.py` | 90 | 123 (81), 106 (6), 122 (3) |

### D.7 Requirements as written (formerly estimates)

The estimates below were replaced by the counts of the written specifications on 2026-09-30, after
the fan-out, the amendments to feature 100 and the nine splits of section A.1a.

| Feature | FR + SC written | Behaviour items | As-is requirements and criteria |
|---|---|---|---|
| 100-specstride | 235 + 9 SC = 244 | 19 | 8 |
| 141-parity-oracle | 45 + 10 SC = 55 | 0 | 1 |
| 101-gate-and-verdict | 41 + 6 SC = 47 | 157 | 27 |
| 149-attempt-planner-and-seams | 10 + 4 SC = 14 | 0 | 0 |
| 117-critic-grounding-and-prompt | 43 + 7 SC = 50 | 102 | 1 |
| 102-run-control | 37 + 8 SC = 45 | 56 | 4 |
| 119-front-door-and-presenter | 33 + 7 SC = 40 | 101 | 7 |
| 145-presenter | 22 + 3 SC = 25 | 139 | 0 |
| 103-proposer-pass | 43 + 9 SC = 52 | 106 | 1 |
| 118-pass-supervision-and-jobs | 43 + 6 SC = 49 | 181 | 2 |
| 104-spec-input | 27 + 8 SC = 35 | 117 | 6 |
| 105-verification | 36 + 7 SC = 43 | 159 | 3 |
| 148-check-runner | 18 + 7 SC = 25 | 4 | 0 |
| 106-learning | 39 + 10 SC = 49 | 197 | 5 |
| 107-launch-contract | 39 + 9 SC = 48 | 79 | 9 |
| 123-pipeline-runtime-and-supervisor | 41 + 10 SC = 51 | 178 | 13 |
| 122-detached-runtime | 42 + 7 SC = 49 | 16 | 1 |
| 108-reverse | 34 + 3 SC = 37 | 159 | 3 |
| 140-reverse-inventory-and-lint | 26 + 3 SC = 29 | 246 | 1 |
| 109-harness-seam | 44 + 7 SC = 51 | 94 | 3 |
| 124-harness-discovery-and-roles | 30 + 5 SC = 35 | 13 | 0 |
| 146-harness-discovery | 19 + 3 SC = 22 | 0 | 0 |
| 125-adapter-claude | 41 + 10 SC = 51 | 16 | 0 |
| 130-adapter-dsh | 42 + 9 SC = 51 | 66 | 0 |
| 131-adapter-codex | 39 + 8 SC = 47 | 8 | 0 |
| 134-adapter-pi | 29 + 7 SC = 36 | 0 | 0 |
| 138-adapter-prime | 43 + 9 SC = 52 | 62 | 0 |
| 126-stream-seam-and-invocation | 38 + 7 SC = 45 | 212 | 0 |
| 110-config-and-terms | 35 + 6 SC = 41 | 25 | 1 |
| 147-terms-gate | 14 + 3 SC = 17 | 0 | 0 |
| 127-quota-budgets-and-pause | 41 + 11 SC = 52 | 6 | 2 |
| 111-event-schema-and-projection | 38 + 7 SC = 45 | 22 | 0 |
| 144-compatibility-projection | 11 + 2 SC = 13 | 16 | 1 |
| 128-telemetry-export | 45 + 10 SC = 55 | 191 | 1 |
| 129-run-view-and-status | 36 + 9 SC = 45 | 0 | 1 |
| 112-doctor | 32 + 9 SC = 41 | 0 | 0 |
| 113-host-claude-code | 40 + 5 SC = 45 | 27 | 2 |
| 115-micro-loop-layer | 45 + 8 SC = 53 | 0 | 0 |
| 116-check-integrity-and-unit-evidence | 21 + 3 SC = 24 | 0 | 0 |
| 142-parallel-units | 46 + 7 SC = 53 | 0 | 1 |
| 143-parallel-engine-services | 28 + 3 SC = 31 | 0 | 0 |
| **Total** | **1,611 FR + 281 SC = 1,892** | **2,774** (+11 dropped) | **104** |

Against the estimates: 1,308 estimated against 1,892 written, mostly through feature 100 (194
estimated, 244 written after the amendments) and the splits carrying their groups whole. Features
that receive no behaviour item: 141, 134, 129, 112, 115, 116, 142, 143, 146, 147 and 149. Features
with fewer than 20: 100, 122, 124, 125, 131, 127, 148. Their requirements come from research.

### D.8 Points for the orchestrator's review

**Reconciliation with the traceability files.** Before the approval, the assignment in this file was
derived independently and then aligned to `traceability-frs.tsv`; the seven rows that differed are
history and are in the traceability files' notes. After the approval the traceability files were
updated for the rulings, and this file follows them: 002 FR-048 to 142, and the 136 items of dsh,
Codex and prime to 130, 131 and 138. The nine splits of section A.1a moved two as-is rows in D.1
(028 FR-027 to 140; 002 FR-023 to 144) and the behaviour items counted in D.6.

**Result of the check.** A script compared this file with the two data files and with the feature
list: 32 briefs; eleven headings in each; every as-is id with a Wave 1 destination under heading 2 of
the brief of that destination, with the same disposition; item counts under heading 2 equal to the
data file; the groups under heading 7 sum to the estimate; no feature number that does not exist; no
machine-specific name. It passed.

**Rows the divergence register did not hold when this file was updated.** They were added afterwards: row 1 is DV-087, row 2 DV-088, row 3 DV-089, row 4 DV-086, row 5 DV-090. Row 6 is not needed: the owner kept the nonce at 64 bits (ruling P16). The candidates for the clarify queue below are CQ-013 to CQ-016, and the owner settled all four (rulings P12 to P15).

| # | Row | Brief |
|---|---|---|
| 1 | The start-up of a pass is fixed (ruling K7 asks for a row for every fix) | 103 |
| 2 | The named fields of the layer `parallel`, and the envelope fields `workerId` and `wseq` | 142 |
| 3 | Grounding refuses the worker root and the tree store, against the oracle | 142, 117 |
| 4 | File modification times after an application (CQ-010) | 142, 117 |
| 5 | The prime critic runs in JSON mode outside the `parity` profile | 138 |
| 6 | A nonce of 128 bits, if the owner wants it | 101 |

**Candidates for `CLARIFY-QUEUE.md`**, each with the recommended answer its brief proceeds on.

| # | Question | Recommended answer | Brief |
|---|---|---|---|
| 1 | How does a consumer continue after an intended change of spec, plan or task list? | By an explicit flag on `resume`, which derives plan and manifest again, records the new hashes, and keeps counts and delivered phase evidence | 102 |
| 2 | Where in the critic order does a critic with read-only tools stand? | In the third step, after the tool-less candidates of that step | 124 |
| 3 | What does "fleet only, unknown terms" make the terms gate do for dsh and prime? | Usable where named by the consumer, with the warning; never a default and never picked automatically | 130, 138, 124 |
| 4 | A dsh plugin install writes the profile in the consumer's real home, which ruling 36 says a run never writes | The allowlist in user configuration is the consent to exactly that write; recorded | 130 |

**Where rulings meet.** None of these makes a ruling impossible to apply; each brief says how it reads them.

| # | Rulings | Point | How the briefs read it |
|---|---|---|---|
| 1 | K2 and K3 | Both bear on a changed hash at `resume`: K2 gives an exit code, K3 a stop with the blocked-on-human signal. K2 names the spec only, K3 spec, plan and tasks | Exit 3 for the command, `blocked-on-human` for the run, for all three files (102) |
| 2 | K3 and P1 | The runtime ticks tasks inside a phase attempt, which changes the task list that K3 watches | The hash that ignores checkboxes is the one compared (104, 142) |
| 3 | 39 and P1 | "No snapshot in Wave 1" against snapshot commits in the store | CQ-008: ruling 39 concerns what the gate and grounding run on |
| 4 | 31 and 56 | "Reserve the tree store, build nothing" against a feature that needs it | CQ-003: 142 builds the subset it needs |
| 5 | 56 as worded and the design | Ruling 56 names "a merge check before the critic"; R26 meant the full gate with demotion, R29 means the inner set with serial repair | CQ-004 |
| 6 | D2 as worded and the traceability files | D2 says 002 FR-039 to 002 FR-047 stay deferred; 002 FR-041, 002 FR-042 and 002 FR-046 are in Wave 1 (127, 102) and always were | The traceability files stand (142) |
| 7 | 34, P2 and 32b | pi and prime have no sandbox (ceiling C0) and the ceiling of dsh is `unverified`: as proposers they need the C0 opt-in, and parallel units are off for them unless `loop.parallel.allow_detect` is set | Stated in 134, 138, 130 |
| 8 | 36 and 58 | dsh selects a model through a throwaway home that links to the real one | The real home is read and never written; agrees with ruling 36 (130) |
| 9 | 46 and 48 | Escalation and the tier bump both move the proposer up the tier ladder | Separate rules with separate counts; both keep away from the critic's model (101, 115) |
| 10 | 43 and EV-32 | Content on spans against "no content in events" | The event file holds references; content reaches a sink through the redaction point only (111, 128) |

**Found in other artifacts**: row DV-069 and the threat table of `architecture.md` section 17 said that
content capture is off by default. Both are corrected; DV-083 now states that capture is off under the
`parity` profile, because the baseline captures none.

**Decided here, before the approval, and approved with it.**

| # | Point | What was decided |
|---|---|---|
| 1 | Ownership of extension points | Feature 100 holds the interface text; one content owner per point specifies the core side, the conformance suite and the sample (D.3) |
| 2 | 011 FR-011 and 011 SC-003, the dry-run plan of the pipeline entry | 123, because the pipeline entry prints it. 107 owns the `dry-run` mode of decision 18 that calls it |
| 3 | 011 FR-007, staleness | 104, with the hashing scheme; 107 and 123 print exit 23 on its verdict |
| 4 | 011 FR-016 and 011 FR-003 | 106 owns the rule; 123 executes the stripping; 107 validates the binding |
| 5 | 028 FR-018, breakers | 103; the kill at the pass ceiling itself is performed by 118 |
| 6 | Shared JSONL reader | 138 owns the reader and the dialect table, because the 41 items of the baseline's reader are its parity items; 134 owns one row |
| 7 | `roadmap.md` names several deferred requirements of 002 by group and not by id | Section D.2 names the roadmap entry for each id |
