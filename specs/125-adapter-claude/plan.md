# Implementation Plan: Claude harness adapter (feature 125)

**Branch**: `125-adapter-claude` (a label; the directory is `specs/125-adapter-claude`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/125-adapter-claude/spec.md`

## Summary

Feature 125 is the first implementation of the harness port (EP-02) and of the quota classifier
(EP-12), and the first adapter that registers doctor checks (EP-14). It is a harness descriptor, code
hooks the descriptor cannot express, the classifier entries of Claude, and recorded fixtures. It has
two transports: the installed CLI as a subprocess (the default) and, optionally, the Agent SDK in
process at auth tier 2 with API keys only, extracted from Lisa's harness and tap. The critic has two
forms: the CLI with no tools at auth tier 1, and a direct call at auth tier 2.

| Deliverable | Requirements |
|---|---|
| Detection, version range, descriptor, terms facts, doctor checks | F125-FR-001 to F125-FR-006 |
| Proposer: prompt, argument list, skills switch, label, permission mode | F125-FR-007 to F125-FR-012 |
| Proposer: session directive, continuation, isolation, auth tier 2, memory, containment, environment, stop, prompt stability | F125-FR-013 to F125-FR-022 |
| Critic: auth tier 1 command, proof, session independence, model tier, budget, direct call, key and model, failure | F125-FR-023 to F125-FR-030 |
| Quota classifier entries, usage, model-tier ladder | F125-FR-031 to F125-FR-033 |
| SDK transport: choice, auth, optional dependency, terms and range, equality, Lisa's kept behaviour, brought to the seam | F125-FR-034 to F125-FR-041 |

Approach: the parity side is a port of the `claude` arm of `proposer.sh`, of `lib/critic.py`
(`call_claude`, the context table, `critic_call`) and of the Claude entries of `lib/agent_stream.py`
at `9cab15d`, through an argument table. The default side follows R5 (options A and C of its
comparison) with the sandbox and permission choices of R11. The SDK transport is Lisa's
`claude-agent-sdk/harness.ts` and `tap.ts` at `363e6a3`, brought to the seam first and pinned with
characterization tests. The fixture captures and the one probe per role are paid, logged tasks: a capture blocks only the
freeze of the status of its requirement, and no test and no implementation task waits for one.

## Technical Context

**Language/Version**: TypeScript 5.x, `strict`, ES modules, Node.js 22 or later

**Primary Dependencies**: `@specstride/contracts`, `@specstride/kernel` (atomic write, redactor, process primitive) and `@specstride/harness` (the port and its conformance suite). Node built-ins for the subprocess, `fetch` for the direct call, hashing and files. The Agent SDK is an optional peer dependency, loaded at run time, never bundled (contracts/transport-and-sdk.md). No other runtime dependency

**Storage**: none of its own. Logical names of feature 100: `pass:<passId>:prompt-transfer` and `overlay:<id>:tree` (temporary directory), `attempt:<N>:<k>:<n>:session` (session state; at auth tier 2 in the throwaway home and removed with it; at auth tier 1 none is persisted, F125-FR-014), `harness:<id>:...` not used by this adapter

**Testing**: the Node test runner; the harness conformance suite of harness adapters of `@specstride/testkit` on both transports; the parity oracle (FX-01, FX-02, FX-05, FX-06, FX-26, FX-39) through the stub executable `claude`; characterization tests CT-125-n of Lisa's extracted code; recorded streams replayed; classifier fixtures written from documented shapes. No test calls a paid API and none waits for a paid capture

**Target Platform**: Linux and macOS (macOS `unverified` until a runner passes the oracle)

**Project Type**: package `@specstride/adapter-claude` of the npm workspace (layer L1; may import contracts, kernel and harness; optional external: the SDK)

**Performance Goals**: starting values, low confidence: building a call under 20 ms; the classifier under 1 ms per record; no added latency on the stream path beyond the reader of feature 126

**Constraints**: no native module; no install script; the SDK never in the package; prompt never in an argument; the critic never receives an allow-all flag; no write to and no removal in the consumer's real configuration home (F125-FR-015); the bypass mode never chosen by the harness adapter; the environment is an allow-list

**Scale/Scope**: 41 functional requirements, 10 success criteria; 16 behaviour items in 5 clusters (3 ported, 13 translated); 45 named tests (34 CT-125-n, 11 PT-125); 6 fixture families cited; 5 captures (A to E) and 1 paid probe per role

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Each gate is answered ✅, ❌ or N/A with a one-line reason and the requirement that supports it. Every
❌ has a row in *Complexity Tracking*. Constitution: `.specify/memory/constitution.md` (v3.0.1).

*Constitution v3.0.1 (2026-09-30) differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182); the row of Principle IX below was re-read against that sentence at the analyze run of 2026-09-30: the sentence changes nothing for this adapter, whose critic proves the tool-less form from the initial record on both transports and refuses a stream with none (F125-FR-024, F125-FR-038).*

**The gate and the loop (I–V)**

- [x] I. ✅ Files and the process boundary only. The harness adapter starts a process and reads its output; the prompt file and the overlay are written atomically and removed (F125-FR-008, F125-FR-017); no watcher or service. Lisa's poll for the evidence file is not carried (F125-FR-041)
- [x] II. ✅ The harness adapter produces no verdict. It proves the critic's form and never lets a critic call share or resume the proposer's session (F125-FR-024, F125-FR-025); the nonce and the approval record belong to 101
- [x] III. ✅ The critic is tool-less (F125-FR-023); the form with read-only tools is another harness adapter's exception and is not offered by this one. Outside text is data: the harness adapter never interprets the reply (F125-FR-030)
- [x] IV. N/A. No spec grammar
- [x] V. ✅ The tap is best-effort and a failure never breaks the loop (F125-FR-040); classification is pure (F125-FR-031)

**The product and its edges (VI–XII)**

- [x] VI. ✅ Strict TypeScript; the descriptor is validated against its schema (F125-FR-002); the core has no provider dependency (the package is of layer L1); no native module; the SDK is optional and never bundled (F125-FR-036); EP-02 and EP-12 (implements), EP-14 (implements (an entry)), EP-10 and EP-11 (consumes) are named with versions in `spec.md`, "Extension points"
- [x] VII. ✅ Claude is one entry of the open registry (F125-FR-001, F125-FR-002); no closed list; shared control flow never tests the name `claude`. The doctor checks are entries of the registry (F125-FR-006)
- [ ] VIII. ❌ Deviation, recorded in Complexity Tracking (CQ-143). What passes: the prompt on standard input (F125-FR-004, F125-FR-007); nothing waits for a human (F125-FR-012); the harness adapter writes nothing and removes nothing in the real configuration home at auth tier 1, and a throwaway home is removed at auth tier 2 (F125-FR-015, F125-FR-017); auto-loaded context is off (F125-FR-015, F125-FR-018); a fresh session per phase attempt, and at auth tier 1 no session state is persisted (F125-FR-013, F125-FR-014); contained by default, and the bypass mode only by the consumer's choice in user configuration (F125-FR-012, F125-FR-019). The deviation: the harness writes files of its own in the real home during a pass, so the home is not byte-identical after a run, where the principle says the operator's configuration is never mutated. Under the `parity` profile the argument list is the baseline's, bypass flag included (F125-FR-009, DV-031; Principle XVIII binds)
- [ ] IX. ❌ Deviation, recorded in Complexity Tracking (CQ-145). What passes: the critic has no tools by any route, proved from the initial record (F125-FR-023, F125-FR-024); outside the `parity` profile a model without a known window does not qualify and gets no default window, and the consumer's window always wins (F125-FR-027); an authentication failure is named (class `auth`, F125-FR-031). The deviation: under the `parity` profile an unlisted model gets the as-is window of 200,000 tokens (B-0911), where the principle says there is no default window for an unknown model. Re-read against v3.0.1 (the weaker proof, CQ-182): this adapter does not use the weaker proof, since the critic's stream carries an initial record on both transports and a stream with none is refused (F125-FR-024, F125-FR-038); the deviation is unchanged
- [x] X. ✅ Range 2.1.259 to 2.1.284, `verified-on` 2026-09-29; each pass records the version; the doctor warns outside the range (F125-FR-003)
- [x] XI. ✅ Usage as increments and null when unknown; notional cost labelled (F125-FR-032); a stream without a terminal record is the `missing_terminal` of the reader; the tap holds no content (F125-FR-040)
- [x] XII. ✅ Tests use the stub executable, recorded streams written from documented shapes and a fake SDK; no test waits for a paid capture or for the paid probe, which are logged tasks (F125-SC-010); auth tiers and terms rows supplied (F125-FR-005); secrets by reference (F125-FR-017, F125-FR-035); model ids are data of the harness adapter (F125-FR-033)

**The host skill (XIII–XVII, for features that touch a host skill, the contract or supervision)**

- [x] XIII. N/A. No judgment
- [x] XIV. N/A. No verification commands
- [x] XV. ✅ The terms gate is evaluated for the transport in use; nothing here bypasses it (F125-FR-030)
- [x] XVI. ✅ Quota classes lead to a pause that spends no budget (F125-FR-031); the harness adapter itself never relaunches or retries (F125-FR-041)
- [x] XVII. ✅ A missing SDK is reported as an unavailable transport with its reason (F125-FR-036); an absent capture is `unverified`, and a test whose captured fixture is absent is a skip with its reason (tasks, "Dependencies")
- [x] XX. N/A. No parallel work; `concurrentSessions` stays unverified and parallel units stay off at auth tier 1 for this harness (F125-FR-019)

**The rewrite (XVIII–XIX)**

- [x] XVIII. ✅ Every kept row has an origin, a disposition and a test; DV-001, DV-002, DV-003, DV-005, DV-006, DV-010, DV-027, DV-030, DV-031, DV-047, DV-048, DV-080, DV-093, DV-094 and DV-106 are cited; continuation and the SDK transport are off under `parity` (F125-FR-013, F125-FR-034)
- [x] XIX. ✅ The harness adapter prints no host-facing text; its doctor lines are one short line each (F125-FR-006)

Rows VIII and IX are deviations from the text of a NON-NEGOTIABLE principle and are recorded in
Complexity Tracking with their queued questions. Every other check passes.

**Re-check after Phase 1 design**: unchanged. Re-checked on 2026-09-30 after the cross-feature review:
rows VIII and IX changed from a pass to a recorded deviation; the spec now takes the reading nearest to
the letter of both principles (CQ-143, CQ-145). Re-read against constitution v3.0.1 at the analyze run
of 2026-09-30: the added sentence of Principle IX (the weaker proof, CQ-182) changes no row; the
recorded deviation of row IX stands.

## Project Structure

### Documentation (this feature)

```text
specs/125-adapter-claude/
├── spec.md
├── checklists/requirements.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── README.md
│   ├── argument-table.md     # exact flags with the version pin, per role and profile
│   ├── classifier-table.md   # Claude's signals to classes, and the usage fields
│   ├── terms-rows.md         # the facts of the terms rows of Claude and its SDK transport
│   └── transport-and-sdk.md  # transports, the optional dependency, the version pins
├── tasks.md
├── analyze-report.md
└── repair-report.md
```

### Source Code (repository root)

```text
packages/adapter-claude/
├── package.json              # optional peer dependency: the SDK; no install script
├── data/
│   ├── descriptor.json       # the harness descriptor, descriptorVersion 1
│   ├── argument-table.json   # per profile and role
│   ├── classifier.json       # the failures map and the text patterns
│   ├── terms-rows.json       # the facts of the rows of Claude (supplied to the terms gate, feature 147)
│   └── models.json           # ladder, context windows, default critic model: data, never rules
├── src/
│   ├── index.ts              # registers the harness adapter, the classifier entries and the checks
│   ├── detect.ts             # executable, version, home
│   ├── invoke-proposer.ts    # argument list, prompt file, environment, process group
│   ├── session.ts            # minted ids, directive, no persistence at auth tier 1
│   ├── isolation.ts          # customisations off, overlay, memory, initial-record assertions
│   ├── critic-cli.ts         # auth tier 1 critic and its proof
│   ├── critic-direct.ts      # auth tier 2 direct call and key, base, model resolution
│   ├── classify.ts           # pure classifier
│   ├── usage.ts              # increments, notional cost
│   ├── stop.ts               # polite stop, terminate, kill
│   ├── checks.ts             # the doctor checks
│   └── sdk/
│       ├── load.ts           # dynamic import from the consumer's installation
│       ├── harness.ts        # extracted from Lisa, brought to the seam
│       └── tap.ts            # extracted from Lisa
└── test/
    ├── conformance/          # the suite of 109 on both transports; the SDK fake
    ├── characterization/     # CT-125-*
    ├── parity/               # PT-125-*
    ├── fixtures/             # recorded streams, the captured limit event
    └── stubs/                # the stub executable `claude` comes from feature 141
```

**Structure Decision**: one package. The SDK code lives under `src/sdk/` and imports the SDK only inside `load.ts`; the build treats it as external and a static test fails on any other import of it.

## Captures, probes and open points

Each capture and the probe is paid and logged, and is never run by the specification. The column
"Before" names what the capture blocks: the freeze of the status of its requirement, or a default. No
test and no implementation task waits for one; a test whose captured fixture is absent is a skip with
its reason.

| # | What | Before | Requirements |
|---|---|---|---|
| A | The write root of the harness's own file tools under the sandbox | The specification freezes | F125-FR-019 |
| B | Several headless processes under one configuration home and one login | The specification freezes | F125-FR-019 |
| C | A real limit event on the CLI stream | The specification freezes | F125-FR-031 |
| D | What the initial record lists about plugins, hooks and servers | The specification freezes | F125-FR-016 |
| E | Where session state is kept, whether it can be kept outside the real configuration home, and which files the harness writes in the home by itself | Continuation is on at auth tier 1 | F125-FR-014, F125-FR-015 |
| P | One logged paid call per role with the flag combination; also confirms the echo of the session id with no persistence and the budget cap under a subscription | Release | F125-FR-023 |
| X4 | Cache behaviour with and without the harness's git snapshot | The switch is set | F125-FR-022 |

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Principle VIII (NON-NEGOTIABLE), "the operator's configuration is never mutated", and ruling 36: at auth tier 1 the harness writes files of its own in the real configuration home during a pass (F125-FR-015, F125-SC-003). The harness adapter itself writes nothing and removes nothing there, and at auth tier 1 a pass persists no session state (F125-FR-014) | The subscription login exists only in the real home, which the principle itself names as the home of an auth tier 1 pass. The harness adapter has no switch that stops every write of the harness; capture E lists the files, and the byte comparison of F125-SC-003 leaves them out | A throwaway home at auth tier 1: it has no login, and copying credentials is forbidden by the same principle. Removing session state by minted id (the reading of 2026-09-29): the removal is a write to the home. Question: CQ-143. If the owner states the exclusion of the harness's own files in the ruling, this row is removed; if the owner allows the removal, continuation may be on at auth tier 1 |
| Principle IX (NON-NEGOTIABLE), "there is no default window for an unknown model": under the `parity` profile an unlisted Claude model gets a window of 200,000 tokens (F125-FR-027, B-0911) | Principle XVIII: the oracle compares against the baseline, which has this fallback (`lib/critic.py` at `9cab15d`); the `parity` profile runs on stubs and fixtures only. Outside the profile there is no default window | Refusing an unlisted model under `parity` as well: the scenarios of FX-01 and FX-06 that name such a model would differ from the reference. Question: CQ-145. If the owner rules that the refusal holds under `parity` too, the fallback is removed and the scenarios are waived by a register row |
