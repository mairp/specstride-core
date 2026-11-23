# Implementation Plan: Codex harness adapter (feature 131)

**Branch**: `131-adapter-codex` (a label; the directory is `specs/131-adapter-codex`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/131-adapter-codex/spec.md`

## Summary

Feature 131 builds the tested harness adapter for Codex: a harness descriptor of kind `cli`, code
hooks for the critic under the read-only sandbox (form (a)), classifier entries, a stream mapping
as data, terms rows, doctor checks and recorded fixtures. Form (b), the direct call, is driven by
the generic `openai-chat` endpoint client of the harness seam, so this feature adds descriptor
data and a few checks for it, not a client.

| Deliverable | What it is | Requirements |
|---|---|---|
| Descriptor and entry | Kind `cli`, provider `openai`, transports, roles, the as-is entry under `parity` | F131-FR-001, F131-FR-004 |
| Detection, version, login check | Version command, login status command, no credential read | F131-FR-002, F131-FR-003 |
| Terms rows, doctor checks, dated facts | Rows per audience and auth tier; six checks | F131-FR-005 to F131-FR-007 |
| Proposer | Parity argument list; default sandboxed invocation; allow-all policy; ceiling C2 | F131-FR-008 to F131-FR-011 |
| Continuation and state | Resume by id; session state per phase attempt; memory and customisations; environment | F131-FR-012 to F131-FR-015 |
| Critic form (a) | Invocation, refusals, withheld paths, read-denial probe, proof, session freshness, prompt, exception, form choice | F131-FR-016 to F131-FR-024 |
| Critic form (b) | Direct call, address, key, model, window (parity and default), cap | F131-FR-025 to F131-FR-031 |
| Quota and usage | Login text, API cases, structured event unknown, usage per turn | F131-FR-032 to F131-FR-035 |
| Stream mapping, captures, probes, conformance | Data mapping; five captures (four paid, one not paid); three paid probes; suite | F131-FR-036 to F131-FR-039 |
| Critic diversity | The identity for the diversity test; the critic-diversity warning on a critic-class call | F131-FR-040 |

Approach: the descriptor carries everything that is data. The code hooks of the descriptor are
three: the argument builder for the three invocation shapes, the read-denial probe and proof of
form (a), and the login-text parser of the classifier. The rest of the code is thin modules over the
data: detection, preflight, doctor checks, environment, session and memory switches, and the
identity for the diversity test. The five captures come first in the list because the
status of several requirements waits for them. They block no code and no test: a test that would
use a captured fixture is a skip with its reason until the fixture exists (F131-FR-037).

## Technical Context

**Language/Version**: TypeScript 5.x, `strict`, ES modules, Node.js 22 or later. The Language Ledger stays empty

**Primary Dependencies**: `@specstride/contracts`, `@specstride/kernel`, `@specstride/harness` (the port, the generic endpoint client, the overlay). No provider SDK; the vendor's TypeScript SDK is not used (R6 recommendation 1)

**Storage**: files only, by logical name (feature 100, annex B §B.5): call record `attempt:<N>:<k>:<n>:critic-invocation`, `pass:<passId>:invocation`, `pass:<passId>:usage`, session state `attempt:<N>:<k>:<n>:session`. The adapter writes none of them itself; the engine is their writer. Bundled data (descriptor, terms rows, classifier entries, stream mapping, window table) are files of the package

**Testing**: the Node test runner; a fake `codex` executable (Node-shebang file) and a fake endpoint on loopback; recorded JSONL streams; the parity oracle of feature 141 (FX-01, FX-06, FX-07, FX-25, FX-26). No test calls a model

**Target Platform**: Linux and macOS. Every macOS statement is `unverified` (ruling 67), the sandbox mechanism included

**Project Type**: one package of the npm workspace, `@specstride/adapter-codex` (layer L1), which may import `contracts`, `kernel` and `harness` only

**Performance Goals**: starting values, low confidence. Building an argument list: under 5 ms. The read-denial probe: under 2 s for five locations, with no model call

**Constraints**: no native module; no paid call in tests; plain `npm install`; MIT-compatible; no path, account, model or gateway of the owner's machines in any file; the harness is never installed, vendored or downloaded; secrets never in an argument list

**Scale/Scope**: 40 functional requirements, 8 success criteria; 8 behaviour items in 4 clusters carried; 5 extension points (2 implemented, 3 consumed or supplied); 10 rows of the `parity` profile set (row 131 since the repair of 2026-09-30); 5 fixture families cited; 5 captures (4 paid, 1 not paid); 3 paid probes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v3.0.1. Brief 131 names Principles II, III, IX (with the exception), VII, VIII, X, XI, XII and XVIII as binding; all twenty are answered.

*Constitution v3.0.1 (2026-09-30) differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182). Re-read at the analyze run of 2026-09-30: the sentence does not change the row of Principle IX. The weaker proof is for the tool-less form of a harness whose stream has no initial record (F100-FR-230, case 3); form (b) is tool-less by construction, and form (a) is the exception with read-only tools, whose session proof is case 2 of F100-FR-230 and whose missing session id refuses the call (F131-FR-020).*

**The gate and the loop (I–V)**

- [x] I. ✅ The adapter keeps no state between calls. The call record, usage and session state are files written by the engine or the harness layer. Nothing watches
- [x] II. ✅ The adapter produces no verdict. A failed critic-class call is reported and the phase gate scores it (F131-FR-022, F131-FR-025). Every critic-class call is a fresh session and never shares a session id with a pass (F131-FR-021). The critic-diversity warning is raised for the same model and for an unknown one, and never blocks (F131-FR-040)
- [x] III. ✅ With the one stated exception. Form (a) reads project files inside a read-only sandbox with the proposer's files moved out and the withheld paths denied and confirmed (F131-FR-016 to F131-FR-020); the snapshot and the nonce are kept (F131-FR-022). Argument lists are lists, never shell text
- [x] IV. N/A The adapter reads no spec
- [x] V. ✅ Doctor checks and recording are best-effort. The proof of form (a) blocks the call and is not observability

**The product and its edges (VI–XII)**

- [x] VI. ✅ Strict TypeScript; the descriptor, the mapping and the terms rows are validated against schemas; no provider SDK; the core imports nothing of this package; extension points named with versions
- [x] VII. ✅ The entry is one row of the open registry; no control flow of the core tests the harness's name (F131-FR-001)
- [ ] VIII. ❌ Deviation, recorded in Complexity Tracking (CQ-143; DV-030, DV-031, DV-047). What passes: the prompt on standard input outside `parity` (F131-FR-009, F131-FR-016); no permission prompt; the harness adapter writes nothing and removes nothing in the real configuration home, at auth tier 1 no session state is persisted and continuation is off until capture 4, and a throwaway home is used at auth tier 2 (F131-FR-013); memory and customisations off, with the opt-ins `memory.native.proposer` and `harnesses.codex.proposerCustomisations` (F131-FR-014); fresh session per attempt (F131-FR-012); strongest containment C2, and no containment only by an opt-in in user configuration (F131-FR-010, F131-FR-011; CQ-183). The deviations: (1) at auth tier 1 the harness may write files of its own in the real home during a pass, where the principle says the operator's configuration is never mutated; (2) under `parity` the prompt is an argument, as at the baseline (DV-031), and the adapter sets no bound on its size; Principle XVIII binds; (3) under `parity` the allow-all flag is passed and no flag about memory or customisations is passed, as at the baseline (DV-030, DV-047)
- [ ] IX. ❌ Deviation, recorded in Complexity Tracking (CQ-145, CQ-187; both closed by the owner on 2026-09-30 on the reading taken here). What passes: form (b) is tool-less by construction; form (a) is the constitution's exception with the sandbox, the moved files, the confirmed denial and the proof (F131-FR-016 to F131-FR-020); outside the `parity` profile a model without a known window does not qualify and gets no default window, and the consumer's window always wins (F131-FR-030); an authentication failure is named (class `auth`, F131-FR-033); the session of a call of form (a) is proven by case 2 of F100-FR-230: the harness gives the id, and the proof records the id of the first stream record and checks that no pass used it (F131-FR-020, F131-FR-021; CQ-117, closed by the owner on 2026-09-30). The deviations: (1) under `parity` a model that is not listed gets the as-is window of 128,000 tokens (F131-FR-029, B-0910, DV-106; F100-FR-231); (2) under `parity` a missing key is a failed critic call and not a named halt (F131-FR-027, DV-117)
- [x] X. ✅ Version range `>=0.153.4 <0.154`, `verified-on` 2026-09-29, version recorded per pass (F131-FR-002)
- [x] XI. ✅ The stream mapping is data behind the stream seam; `missing_terminal`; unknown values are null; cost under a login is notional (F131-FR-035, F131-FR-036)
- [x] XII. ✅ Fake binary and fake endpoint only; the three probes and the four paid captures are logged tasks, each marked paid, that this feature does not run and that no unpaid test waits for (F131-FR-037, F131-FR-038); terms rows for both audiences, Tier 3 refused (F131-FR-005); secrets by reference; model ids are data

**The host skill (XIII–XVII, XX)**

- [x] XIII. ✅ The classification of a failure is a table of entries (F131-FR-032 to F131-FR-034)
- [x] XIV. N/A No verification command is declared
- [x] XV. ✅ Nothing here bypasses the terms gate or a launch check
- [x] XVI. ✅ A limit signal is a stop, never circumvented (F131-FR-005); a quota class spends no budget, which is the classifier's contract
- [x] XVII. ✅ A conformance test that needs a sandbox or macOS is a skip with its reason, never a pass
- [x] XX. N/A The adapter runs nothing in parallel; `concurrentSessions` is null until capture 5 (F131-FR-004)

**The rewrite (XVIII–XIX)**

- [x] XVIII. ✅ 7 requirements carry an origin, a disposition and a test for the 8 items; divergences DV-001, DV-002, DV-003, DV-005, DV-010, DV-027, DV-030, DV-031, DV-047, DV-048, DV-064, DV-081, DV-106 and DV-117 are named; rows 10, 25 to 30, 34, 39 and 131 of the profile set the as-is behaviour. Under `parity` the prompt travels as one positional argument, as the baseline passes it (F131-FR-008)
- [x] XIX. ✅ The adapter prints nothing to a host except doctor findings of at most 200 bytes

**Re-check after Phase 1 design**: unchanged. The one exception (III, IX) is the owner's and is stated in the constitution.

**Re-check after the cross-feature review (2026-09-30)**: rows VIII and IX are stated deviations and no longer marked as passed. The specification keeps the reading nearest to the letter of both principles (CQ-143, CQ-145); what remains is in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/131-adapter-codex/
├── spec.md
├── plan.md                  # this file
├── research.md              # Phase 0
├── data-model.md            # Phase 1
├── quickstart.md            # Phase 1
├── contracts/               # Phase 1
│   ├── README.md
│   ├── argument-table.json
│   ├── stream-mapping.json
│   ├── classifier-entries.json
│   ├── terms-rows.json
│   ├── window-table.json
│   ├── captures.json
│   ├── parity-rows.json
│   └── traceability.json
├── checklists/requirements.md
├── tasks.md
└── analyze-report.md
```

### Source Code (repository root)

```text
packages/adapter-codex/                 # @specstride/adapter-codex (L1; owner 131)
├── data/
│   ├── descriptor.json                 # kind cli, roles, transports, tiers of auth, containment, memory
│   ├── stream-mapping.json
│   ├── argument-table.json             # copied from contracts/argument-table.json
│   ├── classifier.json
│   ├── terms-rows.json
│   └── window-table.json
├── src/
│   ├── arguments.ts                    # the three invocation shapes and resume
│   ├── critic-readonly.ts              # form (a): checks, denial probe, proof
│   ├── login-text.ts                   # limit-text parser of the classifier
│   ├── detect.ts                       # detection and version range
│   ├── preflight.ts                    # login status or key reference, no credential read
│   ├── doctor.ts                       # the six checks
│   ├── environment.ts                  # the environment allow-list
│   ├── session.ts                      # resume, session state, memory switches
│   ├── identity.ts                     # identity for the diversity test
│   └── index.ts
├── fixtures/                           # recorded streams and capture results, each with the version
└── test/                               # CT-131-*
tests/
├── parity/131/                         # PT-131-*
└── conformance/codex/                  # fake binary and fake endpoint scripts
```

**Structure Decision**: one small package as in `specs/100-specstride/contracts/data/package-graph.json`. Form (b) has no code here; it is `data/descriptor.json` for the `openai-chat` client of `@specstride/harness`.

## Physical choices behind the specification

Flags of version 0.153.4, read from `--help` on 2026-09-29 (`verified-on` 2026-09-29, pin codex-cli 0.153.4). No run exists.

| Shape | Argument list | Note |
|---|---|---|
| Proposer under `parity` | `exec --dangerously-bypass-approvals-and-sandbox [--model M] <prompt>` | As at the baseline. The prompt travels as one positional argument of the argument list (a list element, never shell text), not on standard input, and the adapter sets no bound on its size: the limit is that of the operating system for one argument, and a prompt above it fails the start of the process as it does at the baseline (DV-031). This shape is used under `parity` only |
| Proposer, default | `exec --json -s workspace-write -C <workdir> [-m M] --ignore-user-config --ignore-rules [--ephemeral] -` and a configuration override for approvals `never` | `-` reads the prompt from standard input. The help of `exec` shows no approval option: the override is `unverified` (capture 2). `--ephemeral` only where continuation is not used. `--skip-git-repo-check` only when the working tree is not a git repository (behaviour `unverified`) |
| Proposer, continued | `exec resume <SESSION_ID> --json --ignore-user-config --ignore-rules -` and configuration overrides for the sandbox mode | The help of `exec resume` has no `-s` and no `-C`; the working directory is the process's. Never `--last` |
| Critic form (a) | `exec --json -s read-only --ephemeral --ignore-user-config --ignore-rules -C <workdir> -m <model> -` | Network setting is the mode's own; the adapter records it as its own fact until capture 2 shows the first record |
| Login check | `login status` | Exit code and first line; `unverified` |
| Version | `--version` | Prints `codex-cli 0.153.4` |
| Read-denial probe | A fixed read under the harness's own sandbox command, with the same sandbox settings, on a planted file | No model call; whether it reflects `exec`'s policy is `unverified` (capture 3) |

| Subject | Choice |
|---|---|
| Sandbox modes | `read-only`, `workspace-write`; never `danger-full-access` |
| Session id | The thread id of the first stream record |
| Final message | The last completed agent-message item of the stream |
| Doctor check ids | `harness.codex.executable`, `.version`, `.login`, `.sandbox`, `.read-denial`, `.unverified` |
| Time limit of a critic call | `roles.critic.timeoutSec`, default 300 |
| Memory and hook switches | Feature names from the harness's own feature list at capture time; the mapping is data |
| Opt-in keys | `sandbox.level: C0` (user configuration only), `memory.native.proposer`, `harnesses.codex.proposerCustomisations` (`off`, `on`; default `off`; widening) |
| `retryable` of a classification | By class, in `data/classifier.json`: true for `quota_window`, `rate_limit_transient`, `overload`, `agent_failure`, `provider_other`; false for `quota_credit`, `auth`, `context_window`, `budget_cap` |
| Identity for the diversity test | Provider `openai` and the model id that is sent; for form (b) the provider comes from the host of the base address; null where unknown |

## What is planned elsewhere

| Subject | Where |
|---|---|
| Moving the proposer's files, the withheld-paths record | 117 |
| Critic order and auto-pick | 124 |
| Stream reader | 126 |
| Pause and budgets | 127 |
| Key spelling, secret resolvers | 110 |
| Terms gate, terms data, audience | 147 |
| The generic `openai-chat` client, the overlay, the conformance suite | 109 |

## Order of construction

| Step | Content | Needs |
|---|---|---|
| 1 | The five captures, logged; fixtures stored. Captures 1, 2, 4 and 5 are paid; capture 3 is not. No later step waits for them | An authorized person; the installed harness |
| 2 | Fake binary and fake endpoint scripts for the adapter | The frame of the conformance suite |
| 3 | Descriptor, terms rows, window table, doctor checks | `harness`, `contracts` |
| 4 | Argument builder: parity, default, resume | Step 3 |
| 5 | Classifier entries and stream mapping | Hand-written streams of step 2; the fixtures of step 1 replace them when they exist |
| 6 | Form (a): checks, denial probe, proof, identity for the diversity test | Steps 3, 4. Capture 3 closes the status only |
| 7 | Form (b) data and cap | The endpoint client of 109 |
| 8 | Parity tests; the three probes | The oracle, the engine |

## Complexity Tracking

Form (a) is the exception that the constitution states in Principle IX, by rulings 57, 57a and D1, and is no deviation. The rows below are the deviations from the letter of Principles VIII and IX that remain after the repair of 2026-09-30.

| Violation | Why needed | Simpler alternative rejected because |
|---|---|---|
| Principle VIII (NON-NEGOTIABLE), "the operator's configuration is never mutated", and ruling 36: at auth tier 1 the harness may write files of its own in the real configuration home during a pass (F131-FR-013). The harness adapter itself writes nothing and removes nothing there, persists no session state at auth tier 1, and keeps continuation off until capture 4 | The login of the consumer exists only in the real home, which the principle itself names as the home of an auth tier 1 pass. No switch is known that stops every write of the harness; capture 4 lists what it writes | A throwaway home at auth tier 1: it has no login, and copying credentials is forbidden by the same principle. Removing session state from the real home after the phase attempt: the removal is a write. Question: CQ-143, closed by the owner on 2026-09-30 on this reading: what the harness writes by itself is captured and left out of the comparison; the row stays as the record of the deviation |
| Principle VIII, "an adapter that can only take the prompt as an argument bounds the prompt size": under the `parity` profile the prompt is one positional argument with no bound of the adapter (F131-FR-008) | Principle XVIII: the oracle compares the argument list with the baseline's, which passes the prompt as an argument without a bound (B-0690, B-0691). The profile runs on stubs only. Outside the profile the prompt is on standard input | A bound under `parity`: a prompt above it would end otherwise than on the reference. Register row DV-031; item W-131-02 |
| Principle VIII, "contained by default" and "auto-loaded context is off by default": under the `parity` profile the allow-all flag is passed and no flag about memory or customisations is passed (F131-FR-008, F131-FR-010, F131-FR-014) | Principle XVIII and ruling 32: parity of this harness is binding, and the baseline starts the pass so. The profile is chosen by the oracle and runs on stubs | Containing the pass under `parity`: the transcript differs from the reference. Register rows DV-030, DV-031, DV-047; rows 25, 26, 29 and 131 of the profile |
| Principle IX (NON-NEGOTIABLE), "there is no default window for an unknown model": under the `parity` profile a model that is not listed gets a window of 128,000 tokens (F131-FR-029, B-0910) | Principle XVIII: the baseline has this fallback. Outside the profile there is no default window (F131-FR-030) | Refusing an unlisted model under `parity` as well: the scenario `FX-25/codex-model-unlisted` would differ from the reference. Register row DV-106. Question: CQ-145, closed by the owner on 2026-09-30 on this reading; F100-FR-231 states the fallback under `parity` only |
| Principle IX, "auth failures are named", with "any other result is a critic configuration error that halts the run": under the `parity` profile an empty key is raised inside the call and scored as a failed critic call (F131-FR-027). The error text names the variable | Principle XVIII: the code of the baseline does so, and `FX-07/codex-missing-key` ends with engine exit 1 and `critic_unavailable` | Engine exit 3 under `parity`: a waiver on the scenario. Register row DV-117. Question: CQ-187, closed by the owner on 2026-09-30 on this reading |
