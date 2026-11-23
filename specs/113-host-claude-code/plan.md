# Implementation Plan: Host plugin for Claude Code

**Branch**: `113-host-claude-code` (a label; no branch is created) | **Date**: 2026-09-29, repaired 2026-09-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/113-host-claude-code/spec.md`

## Summary

The feature builds the host package for Claude Code inside the one published package: three skill sources, a small host hook configuration with thin shell shims, one Node-shebang shim that finds the CLI and checks the protocol, a manifest and a marketplace entry, the EP-01 build operations (`describe`, `renderSkill`, `renderEntry`, `renderStatusHooks`, `evalDriver.run`), the trigger eval suites, and the context-cost CI with its seven checks. It holds no product logic. Parity is proven through FX-36 (mode map, one waiver); FX-37 is retired.

The per-change build calls no model. The trigger suite, the behaviour smoke and the with-and-without report are paid tasks that a person starts, logged (`assumption: CQ-188`).

## Technical Context

**Language/Version**: TypeScript 5.x (strict) on Node.js 22 or later; host hook shims in POSIX shell (thin shims, allowed by decision 2); skill bodies in Markdown

**Primary Dependencies**: `@specstride/contracts`, at build time only (closed sets, logical names, schema of the doctor and of the judgment exchange); no runtime dependency in the plugin layer; the host CLI `claude` for `plugin validate` and `plugin details` in the build, which make no model call (the second is `unverified`: inferred, R17). `claude plugin eval` is never started by the build: only by a person, in a paid task

**Storage**: none of the product's. Two markers of the host (last injected state, notice shown once) lie in the host's plugin data directory. They are state of the host and have no logical name in annex B §B.5 (reported). The status line is found through the logical name `workspace:current:status-line`, which points to `run:<runId>:status-line` (F100-FR-229)

**Testing**: the Node.js test runner; the host conformance suite against the plain shell host and this plugin; the seven checks of the context-cost CI, measured in bytes; the static check of the suite files and the eval driver on a stub of the host's suite runner (F113-FR-041). No test and no job of the build calls a model. `claude plugin eval` for triggers runs only in the paid tasks T029 and T037

**Target Platform**: Linux and macOS (macOS `unverified`); Claude Code, pinned to 2.1.284 for host facts

**Project Type**: one package of the npm workspace, `@specstride/host-claude-code` in `packages/host-claude-code` (layer L7, owner 113, as `specs/100-specstride/contracts/data/package-graph.json` gives it; it may import `@specstride/contracts` at build time only). Its build output is the plugin directory inside the published package. The bundling into the one published package is the bundling task of feature 119, T064 of `specs/119-front-door-and-presenter/tasks.md` (review item W-119-01)

**Performance Goals**: `status` at most 150 ms p90; host hook shims start no Node process; skill budgets per F113-FR-036

**Constraints**: no install script; nothing compiled at install; no MCP server; the host reads no product file except the one precomputed status line through its host hook shim; published only by the build, from a protected branch, with the attestation (F113-FR-042, F100-FR-236)

**Scale/Scope**: 42 functional requirements, 5 success criteria; 7 kept behaviour items in 2 clusters received (B-2661 to B-2664, B-2666 to B-2668; B-2665 not carried); 20 superseded rows listed

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v3.0.0 (`.specify/memory/constitution.md`). Each row is answered ✅, ❌ or N/A with a one-line reason and the requirement that supports it. Every ❌ needs a row in Complexity Tracking.

*Constitution v3.0.1 (2026-09-30) differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182); Principle IX is N/A for this feature, so no answer changes.*

**The gate and the loop (I–V)**

- [x] I. ✅ The plugin and the runtime meet in files only; a host hook reads one precomputed file, found through `workspace:current:status-line`; no watcher carries control; a push alert is never relied on (F113-FR-020, F113-FR-021, F113-FR-026). The two markers in the host's plugin data directory (last injected state, notice shown once) are state of the host: no run and no command of the product reads them, and a missing or damaged marker only causes one more line to be printed (F113-FR-016, F113-FR-021)
- [x] II. N/A: the plugin produces no verdict and approves nothing; the skill prints the digest verbatim (F113-FR-012)
- [x] III. N/A: no critic and no inner check here. The part that binds: outside text is data (F113-FR-017)
- [x] IV. N/A: the plugin parses no spec and holds no spec grammar (F113-FR-001)
- [x] V. ✅ Host hooks are best effort and print nothing on failure; no run depends on a host hook (F113-FR-020, F113-FR-026)

**The product and its edges (VI–XII)**

- [x] VI. ✅ TypeScript build code; shell only for thin host hook shims (decision 2); plain npm install; no install script, nothing compiled at install; EP-01 named with version and conformance suite, EP-09 and EP-14 consumed (F113-FR-030, F113-FR-031, F113-FR-034)
- [x] VII. ✅ No harness is enumerated and no harness name is tested; delegation of judgment is not used on this host, which has a model (F113-FR-008)
- [x] VIII. N/A: the plugin runs no proposer pass. The part that binds: a Tier 1 child does not load the host hooks (F113-FR-027)
- [x] IX. N/A: the plugin makes no critic-class call
- [x] X. ✅ Host facts carry `verified-on` and a pin, or `unverified` with the check (F113-FR-035)
- [x] XI. ✅ Host events go to the inbox through the CLI, redacted; the plugin writes no event (F113-FR-024)
- [x] XII. ✅ On the recommended answer of CQ-188. What runs where:

  | What | Where | Calls a model |
  |---|---|---|
  | The seven checks of the context-cost CI, the token budget of each host skill, the static check of the suite files, the eval driver on a stub runner, the conformance suite with stub agents, all parity and characterization tests | The per-change build | No (F113-FR-036, F113-FR-037, F113-FR-041) |
  | The release check of the trigger suite | The release, in the build | No: it reads the log (F113-FR-038) |
  | The trigger suite (T037) | A person, paid, logged | Yes |
  | The behaviour smoke and the with-and-without report (T029) | A person, paid, logged; no schedule | Yes |
  | The live captures (T001) | A person, paid, logged | Yes |

  No model id is in a suite file, test, check or rule; the model comes from the configuration of the run (F113-FR-039). Secrets: none handled. The terms gate and the auth tiers are not touched; the audience notice only tells (F113-FR-016). No paid task is a precondition of an unpaid test

**The host skill (XIII–XVII)**

- [x] XIII. ✅ The host answers only the choices of an item and never opens sources or the launch contract; it writes no status (F113-FR-008, F113-FR-011)
- [x] XIV. ✅ The skill writes no verification file and invents no command; the CLI reads the declared commands (F113-FR-010)
- [x] XV. ✅ `run` by default, `dry-run` withholds; the comment cannot bypass a launch check, the terms gate or a budget (F113-FR-004, F113-FR-005)
- [x] XVI. ✅ Supervision only reads; the skill relaunches nothing (F113-FR-012, F113-FR-013)
- [x] XVII. ✅ A missing capability, a missing host CLI or a missing live host is a skip with its reason, never a pass (F113-FR-028, F113-FR-034, F113-FR-037; T032 records the macOS result)
- [x] XX. N/A: the plugin plans and runs no parallel work

**The rewrite (XVIII–XIX)**

- [x] XVIII. ✅ Kept items are in `origin:` with tests; differences carry DV-006, DV-009, DV-033, DV-056 (F113-FR-004, F113-FR-009 to F113-FR-012)
- [x] XIX. ✅ The budgets and the seven checks are requirements, enforced in the per-change build (F113-FR-036, F113-FR-037)

No row is ❌. Row XII passes on the recommended answer of CQ-188; if the owner answers otherwise (the suite stays in the build), row XII becomes a deviation with a row in Complexity Tracking.

**Re-check after Phase 1 design**: unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/113-host-claude-code/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── host-package.md
├── checklists/requirements.md
├── tasks.md
├── analyze-report.md
└── repair-report.md
```

### Source Code (repository root)

```text
packages/host-claude-code/        # @specstride/host-claude-code, layer L7
├── src/
│   ├── describe/       # capabilities and fallbacks (EP-01)
│   ├── render/         # renderSkill, renderEntry, renderStatusHooks; budget check
│   ├── shim/           # bin shim: resolve CLI, protocol check
│   └── evals/          # eval driver over the host's suite runner; static check of suite files
├── plugin/             # built into the published package
│   ├── .claude-plugin/ # manifest, marketplace entry
│   ├── skills/         # specstride-run, specstride-reverse, doctor (SKILL.md + references)
│   ├── hooks/          # host hook configuration and thin shell shims
│   └── bin/            # the shim
├── evals/              # trigger cases and graders (not shipped); no model id
└── tests/
    └── ci-checks/      # the seven checks; static check of the suite files

packages/testkit/src/conformance/EP-01/   # the host conformance suite: the cases of this feature
packages/testkit/src/samples/EP-01/       # the sample of EP-01
tests/parity/113/                         # PT-113-* on FX-36
tests/characterization/113/               # CT-113-*
evals-log/113/                            # the log of the paid tasks (place proposed; not shipped)
```

**Structure Decision**: one package with a build step that writes the plugin directory; skill sources are logical, and the spelling is rendered per host. The conformance suite and the sample of EP-01 lie in the published test kit and nowhere else (`specs/100-specstride/plan.md`, "What is planned elsewhere"). Parity and characterization tests lie at the root of the repository under the feature number.

## Design points

| Point | Decision |
|---|---|
| Skill body size | Body at most 2,500 tokens (7,000 bytes) for run, 2,000 (5,600) for reverse, 800 (2,240) for the doctor; listing 150 tokens (420 bytes); references at most 2,000 tokens each and none on the happy path (R17 allocation). Feature 100 (annex G §G.5) and the brief give only the totals (8,000; 7,000; 1,500); the body figures are upper limits from R17 inside those totals; no skill body exceeds 500 lines (F113-FR-036) |
| Comment first | The skill takes the comment from its argument before any command reads the repository |
| Supervision | `wait` with cursor in a background command; the skill prints only when it returns with a line |
| Host hooks | Shell shims read the precomputed status line through `workspace:current:status-line` and compare a marker held in the host's plugin data directory; no Node start. The marker is state of the host, read by nothing of the product; when it is missing or damaged the shim prints the line once more |
| Push alert | The monitor is the primary way until the live capture (T001, paid) has been run; then decided from its result: long-limit re-arming host hook or monitor primary |
| Shim | Node-shebang file; order: explicit variable, search path, sibling package; `--protocol`; one refusal line |
| Evals | In the per-change build: the static check of the suite files and the eval driver on a stub runner. The trigger suite is a paid task of a person and a release check that reads the log; the smoke and the report are paid tasks of a person, without schedule. The model comes from the configuration of the run (`assumption: CQ-188`) |
| Log of paid tasks | One record per run: date, task, model ids, number of calls, cost, hash of the skill texts, result per skill, runs not scored |
| Publishing | By the build only, from a protected branch, with the attestation of F100-FR-236; the marketplace entry names the exact package and version (F113-FR-042) |

## Complexity Tracking

No violation. The table is empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
