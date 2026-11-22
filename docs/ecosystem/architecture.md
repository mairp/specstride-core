# Specstride architecture

Status: **approved by the owner on 2026-09-29** (`APPROVAL.md`), with the rulings applied. It adopts the draft in
`research/R15-ecosystem-architecture.md` (R15) and amends it with the findings of its red team
(`research/R15v-architecture-red-team.md`, R15v). Where this file and R15 differ, this file stands.
Detail that is unchanged is referenced by section (for example "R15 A-3") and not repeated.

Entries marked **DP-nnn** name the entry of `DECISIONS-PENDING.md` that the owner ruled on; all 90 are
closed. Where the owner ruled differently from the research's default, the text says "owner ruling" and
gives the ruling's number in `APPROVAL.md`.
Statements about macOS are `unverified` throughout: no macOS host was available (DP-006).

Terms follow the glossary in `consolidation.md`. "Run" means the logical run of one feature, which
survives a resume and a relaunch; one start of the engine process is an "engine start" (DP-074).

## 1. The decisions in one table

| Question | Decision | Confidence | Source |
|---|---|---|---|
| Loop or router | Both, not as peers. Loops are the control structure at every level. The router is one pure rule table consulted at three decision points in the pass-loop layer | High | R15 Q1, R25, R27; held under R15v |
| Process model | A detached process tree per run: a runtime root and the engine as its child | Medium-high | R15 Q2; held under R15v |
| Who relaunches | The runtime root by default, with its own classifier table. `relaunch.owner: supervise` keeps today's host-side behaviour and is the parity setting | Medium | R15v B-1; DP-072, DP-080 |
| Control state | Three roots. The control plane is outside the working tree | Medium | R15 A-5; R11 R-1; R15v A-7, D-7, D-8; DP-071 |
| Extension points | 19 public points and 1 internal seam, each versioned, with a conformance suite and a sample outside the core | Medium-high | R15 A-3 as amended by R15v P-10 |
| Lisa | Selective extraction of source, including the Agent SDK harness as an optional Tier 2 transport (owner ruling 20). Lisa is neither the base nor a dependency | High | R1, R1v; DP-014, DP-079 |
| Languages | TypeScript everywhere. The Language Ledger is empty at the start of Wave 1 | High | R2, R2v, R17; DP-043 |
| Micro-loops | On by default at level L1, only where the verification gate executes; every other technique on its own switch | Medium-high on structure, low on numbers | R27; DP-061 |
| Memory | No memory feature in Wave 1. Learning is ported as the across-runs layer | High | R12; DP-018 |
| UI | Wave 1 specifies the read model and `specstride status`. Renderers are Wave 2 | High | R13 |
| Decomposition | 31 Wave 1 features and the umbrella: the 26 proposed, four harness adapters (dsh, Codex, pi, prime) and parallel units (owner rulings 15, 32b, 56) | Medium; estimates are low confidence | R15 A-9, R15v E-1 to E-6; DP-078, DP-083, DP-034 |
| Parity and release | Every parity test passes before any release, including the behaviour of dsh, prime and Codex (owner ruling 32) | — | DP-083 |
| Staleness | The hashes of spec, plan and tasks are checked at launch, at resume and at every pass start (owner ruling K3) | High | R28 |

## 2. Layers

```
                          consumer
                             │ invokes a skill, optional comment
┌────────────────────────────▼───────────────────────────────────────────────────────┐
│ L7 HOSTS     Claude Code plugin │ dsh plugin (Wave 2) │ plain shell                 │
│              skills · hook shims · bin shim · eval suites                   [EP-01] │
└────────────────────────────┬───────────────────────────────────────────────────────┘
       CLI protocol v1: argv in, exit code and terse lines out, --json on request
┌────────────────────────────▼───────────────────────────────────────────────────────┐
│ L6 CLI (short-lived)  derive · validate · promote · launch · status · wait · stop · │
│              resume · doctor · reverse · learn · inspection verbs · supervise       │
│              readers: RunView [EP-09] · doctor checks [EP-14]                       │
└───────┬───────────────────────────────┬─────────────────────▲──────────────────────┘
  spawn │ once, detached [EP-17]        │ requests            │ reads events
        │                               ▼ (inbox files)       │ and state files
┌───────▼─────────────────────────────────────────────────────┴──────────────────────┐
│ L5 RUNTIME ROOT (detached, one per run)                                             │
│              pipeline stage executor [EP-19] · lock and lease [EP-13] ·             │
│              relaunch classifier · run-state owner · terminal digest                │
└───────┬─────────────────────────────────────────────────────────────────────────────┘
  spawn │ per `specstride` stage; back: exit code and a terminal record file
┌───────▼─────────────────────────────────────────────────────────────────────────────┐
│ L4 ENGINE (child)  run → phase → phase attempt                                      │
│              verification gate → critic [EP-18] → approval record ·                 │
│              recovery cycle · attempt planner [EP-18]                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ L3 PASS LOOP  pass loop · watchdogs · breakers · yield and detached jobs            │
│              loop layer [EP-04]: none (classic) │ micro │ later kinds               │
│              router [EP-06]: decision points tools · loop · escalation              │
│              prompt assembler [EP-15] · carry-over (ledger, handoff, index)         │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ L2 PORTS     interfaces owned by the core; no implementation inside it              │
│              harness [EP-02] · spec format [EP-03] · check runner [EP-05] ·         │
│              verification-plan source [EP-07] · event sink [EP-08] ·                │
│              secret resolver [EP-10] · terms-gate data [EP-11] ·                    │
│              quota classifier [EP-12] · toolchain profile [EP-16]                   │
└───────┬─────────────────────────────────────────────────────────────────────────────┘
┌───────▼─────────────────────────────────────────────────────────────────────────────┐
│ L1 EDGES     Claude adapter · generic descriptor adapter · stream readers ·         │
│              file sink · legacy projection sink · OTLP exporter ·                   │
│              command check runner · env/file/keychain resolvers · detach strategies │
└───────┬─────────────────────────────────────────────────────────────────────────────┘
  spawn │ or HTTP
        ▼   harness processes · check commands · detached jobs · provider endpoints
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ L0 STATE     user-level state │ control plane per workspace │ workspace part        │
└─────────────────────────────────────────────────────────────────────────────────────┘
 across all layers: the contracts package (schemas, enums, logical state names)
```

### Layering rules

| # | Rule |
|---|---|
| LR-1 | A layer imports only from layers below it and from the contracts package. The engine and the pass loop import interfaces and never an implementation. CI enforces it with an import-boundary check over the package graph |
| LR-2 | A host reaches the product only through the CLI protocol. It reads no state file, event file, launch contract or log. Diagnosis reads through a CLI verb with a byte cap (R15v B-2) |
| LR-3 | Between the CLI and the runtime root there are only files, one `spawn` at launch, and signals for `stop --now`. The CLI writes requests to the inbox; it never writes run state |
| LR-4 | Only the runtime tree writes the control plane. Readers derive `dead` and `stale`; they never write them |
| LR-5 | At any moment one process is the writer of a run's event file. Learning has its own writer domain and its own file (R15v C-7) |
| LR-6 | Every process boundary that the parity oracle **observes** today stays a process boundary. Every other one is a function call with a result record that carries the same code number. The per-process table in `consolidation.md` §3 is the authority (R15v C-1, P-7) |
| LR-7 | The router, the quota classifier, the relaunch classifier, lane derivation and the terms gate are pure tables: versioned data, one evaluator, and the rule id recorded with every decision |
| LR-8 | Role resolution belongs to the harness layer. It runs at launch and produces a plan per phase and role, with the fallbacks the consumer opted into, each re-gated by the terms gate when used (R15v B-4, P-11). No loop and no router calls it |
| LR-9 | Text from outside the runtime enters through one ingress, where it is redacted and size-capped |
| LR-10 | Every switch is ordinary product configuration. The parity configuration is a **named profile**, `parity`, owned by feature 100, that sets every switch the oracle needs. The product has no oracle mode (R15v B-5, P-1) |
| LR-11 | Every closed set (enumeration) is listed in feature 100 with its owner and its rule for an unknown value. Every control-plane file carries a `schema` field, and a different major is refused (R15v A-15, A-16, P-12, P-15) |

## 3. Loop and router

Loops: pipeline stages, the phases of a run, phase attempts, passes, and the cycles of the micro-loop
layer. The router runs nothing. It is a function `route(point, signals, config, ladder)` with no I/O,
no clock and no model, returning a choice, the rule id and the table version.

| Decision point | Chooses | Never |
|---|---|---|
| `tools` | The order of, and exclusions among, entries of the frozen per-phase check manifest | Adds a command or builds an argument list |
| `loop` | A registered loop layer, or off for this attempt | Switches a layer on; replaces the gated loop |
| `escalation` | The next rung of the pinned tier ladder of the same harness, or skip | Moves to another harness; targets the critic's model |

Choosing the proposer and the critic is role resolution, not routing (decision 20). The router
prototype's table form is kept; its two ungated modes are rejected because Principle II forbids a
phase without a critic. `autoresearch` is a later implementation of the loop-layer interface. The
interface reserves the service it would need (a tree store), and nothing is built for it in Wave 1
(DP-089).

## 4. Process model and the detached runtime

```
specstride launch            (CLI, exits after the handshake)
   └─ runtime root           (session leader; pipeline stage executor)
        ├─ stage child       (kinds setup, command, smoke: any declared argument list)
        └─ engine            (kind specstride; one at a time)
             ├─ harness process, one per pass or critic call, own process group   [owned]
             ├─ check command, own process group                                  [owned]
             └─ detached job of a yield, own session                              [adoptable]
```

| Subject | Design |
|---|---|
| Why a child | Crash isolation is what makes relaunch possible without a host session; stage timeout, environment stripping and signal handling in 011 are process semantics; the oracle substitutes an engine stub by `PATH` |
| Engine start modes | `standalone` (a foreground `specstride run`) and `child` (started by the root). The engine executable is pinned at launch (R15v P-9) |
| Lock | One lock per workspace, taken by the root and handed down as a lease. The engine verifies the lease at every boundary and ends cleanly when the owner is lost, so an orphaned engine cannot run on (R15v D-1, P-3). Mechanism per DP-005 |
| Process registry | Two classes. `owned` processes are ended by a stop. `adoptable` processes are the detached jobs of a yield: they survive a stop and are adopted by the next engine start, as today (R15v C-6, P-2). `stop --now` ends owned processes; ending an adoptable job is a separate, explicit request |
| Run requests | Two kinds. `pipeline`: a promoted launch contract, from `specstride-run`. `engine`: one engine invocation, from `specstride-reverse` and `specstride run --detach` (DP-077) |
| Start and handshake | `launch` writes a launch record with a nonce and calls the detach strategy. The root takes the lock and writes the lease with the nonce. Handshake outcomes are `started`, `attached` (a live run exists) and `refused`; an unanswered launch is closed as `launch-abandoned` (R15v P-13) |
| A new logical run | A launch continues an unfinished run of the same feature and its counts. `--new-run` starts a new one (DP-081) |
| Re-attachment | Reading only. The `SessionStart` shim prints a precomputed status line, which carries `validUntil` so that a stale line is recognisable |
| Crash of the engine | With `relaunch.owner: root` the root classifies and relaunches within budget. Counts and attempt ids come from the ledger |
| Crash of the root, or a reboot | Nothing relaunches by itself in Wave 1. The run reads as `dead`; `resume` reclaims the lock and continues. A quota pause therefore holds "while the runtime lives" (DP-085). A service strategy that survives a reboot is on the roadmap |
| Launcher | A Node-shebang file the operator can see and run (DP-043). The bundle hash and the launcher's digest are verified at launch and relaunch |

### Who relaunches

Decision 5 gives supervision to the host skill. A classifier that runs in the host can act only while a
host session is open: the reference run had no automatic relaunch, and the machine shows 135 to 143
manual restarts (R21, R21v). Aim 3 asks for runs that relaunch themselves.

R15 proposed to move the classifier into the root "unchanged". R15v showed that this is not possible:
its input is an observation of a terminated launcher, and inside a living root five of its refusals
cannot occur and the pipeline's exit 22 is never emitted.

| `relaunch.owner` | Behaviour | Used |
|---|---|---|
| `root` (default) | The root stays alive after a failed stage and consults a **second classifier table**, which has a row for a crashed engine. New behaviour, with a divergence register row. The inbox accepts `hold-relaunch`, so the host can still steer | Normal runs |
| `supervise` | The root exits with the pipeline code at a failed stage. `specstride supervise observe` classifies and relaunches as today, with every named refusal, and prints `[MOL-RELAUNCH]` | The `parity` profile; consumers who want the literal reading of decision 5 |

This choice is coupled to the token budget: the supervision budget of 3,000 tokens for a whole run
holds only if the host does not have to watch for the whole run (R15v B-2; DP-024).

### The spike that comes first

Whether a process started from the host's shell tool survives the end of the session is `unverified`
on both hosts. Feature 122 starts with a spike on Linux and macOS: start the root from the host's shell
tool in an interactive session and under headless mode, with the shell sandbox off and on; end the
session; confirm the root lives. The same spike tests whether the host's shell tool and the detached
root can write the control root (R15v A-7, P-6). The architecture does not depend on the outcome:
the detach strategy is an extension point with `foreground` as the fallback.

## 5. Extension points

Common rules (R15 A-3): each point has an id `specstride.<name>/<major>`; changes inside a major are
additive; implementations are data (D), first-party code (F) or third-party code (T). Wave 1 accepts D
from consumers and F from the product; T is designed and not enabled (DP-075). An implementation that
widens capability is accepted from user scope, environment or flags only (DP-009). For every point the
test tree holds a sample implementation outside the core; CI runs the conformance suite on it and fails
if a core file names it. An extension that fails degrades to the documented plainer path and never
produces a verdict, an exit code or a stop reason.

| EP | Name | Implemented in Wave 1 by | Amendment from R15v |
|---|---|---|---|
| 01 | Host port: the CLI protocol and the host package contract | Claude Code plugin; plain shell (also the test host) | Capability `stateRootWritable`. A host without a model may delegate derivation judgment to a harness, by user-scope configuration, recorded in the digest (DP-086) |
| 02 | Harness port, levels `proposer` and `completion`; descriptor v1; stream readers; role resolution | Claude adapter (the `claude` subprocess, and the Agent SDK as an optional transport with API keys only); dsh, Codex, pi and prime adapters; the generic descriptor-driven adapter for kinds `cli`, `openai-chat`, `anthropic-messages` | A `betweenPasses` operation; stream mapping as data, so a new stream format needs no code; roles are an open registry. **Guarantee:** the proposer comes from flag, environment, configuration or the shipped default only; an absent proposer refuses the launch and names the discovered candidates (R15v B-3) |
| 03 | Spec-format adapter, with one canonical model that includes structured tasks | `native`, `speckit-tasks`, `openspec-change` with alias `openspec` | A `priority` for detection order |
| 04 | Loop-layer interface | `none` (classic), `micro`, and parallel units as an option that is off by default (design in R29) | `requestPass`; capability negotiation of directives; the tree-store service reserved |
| 05 | Check runner | `command` (fixed argument list, no shell); `steps` as an option | Handle-based, with `pin`, so a remote runner can be added |
| 06 | Router rule table | The shipped table | — |
| 07 | Verification-plan source | The verification-commands document; commands declared in plan or tasks; toolchain discovery; the launch-contract inventory | — |
| 08 | Event sink | Legacy projection sink; OTLP exporter; Loki sink | The primary file writer is core and not replaceable |
| 09 | UI read model `RunView` | `status` text and `--line`; the hook status shim | Cursor held by the caller |
| 10 | Secret resolver | `env:`, `file:`, `keychain:` | — |
| 11 | Terms-gate data | The shipped data file; a newer file in user-level state replaces it | — |
| 12 | Quota classifier | Code in the Claude adapter; the `failures` map of a descriptor; a default text classifier | `observe`, and a source `host` for limits the host sees |
| 13 | Lock and liveness provider | The default of DP-005 | The provider is recorded per workspace |
| 14 | Doctor check registry | The 44 checks of R16; every package registers its own | — |
| 15 | Prompt block provider | Spec context, obligations index, handoff, feedback, hint, yield contract, the layer's protocol block | — |
| 16 | Toolchain profile (data) | Shipped profiles | — |
| 17 | Detach strategy | `spawn-detached`, `foreground` | — |
| 18 | Critic strategy and attempt planner (internal seams) | One critic; the recovery cycle as today; a tier bump after K critic rejections as an option that is off by default (owner ruling 48) | — |
| 19 | Stage kind and precondition check | `setup`, `decision`, `command`, `specstride`, `smoke` | **New** (R15v A-5): stage kinds were a closed enumeration in the contract schema |

Interfaces in words, inputs, outputs, errors, guarantees and proving tests for EP-01 to EP-19 are in
R15 A-3 and become the contracts of feature 100, with the amendments above.

**The critic with read-only tools** (owner rulings 57, 57a, D1). The `completion` level has a second
form for a harness whose critic mode is a read-only operating-system sandbox, Codex being the first.
Such a critic runs in the working tree and may read project files by itself. Before it starts, the
runtime moves the proposer's notebook, handoff and outbox out of the working tree, and the sandbox
denies reads of `.specstride/`, so the history of repairs stays withheld (decision 21). The critic
still receives the grounding snapshot and the fact block in its prompt, and its verdict is still bound
to the nonce. This is a stated exception to Principles III and IX, limited to reading project files.
It cannot write, run commands that write, or reach the network.

**What evolvability costs.** Nineteen conformance suites, nineteen samples, and a compatibility
promise per major. Feature 100 becomes the largest specification of the set (section 14).

## 6. Packages

One npm workspace, bundled into **one published package, `specstride`**, which holds the CLI, the
runtime entry and the Claude Code plugin directory. `@specstride/contracts` and `@specstride/testkit`
are also published, so that descriptor authors and later adapter authors can validate against them
(DP-090). The table of packages, their layers and permitted imports is R15 A-4.

The rule that matters: `@specstride/core` and `@specstride/layer-micro` import `contracts` and `kernel`
and nothing else from the workspace. They import no adapter, sink, config loader, host, UI or provider
SDK, and neither `node:child_process` nor a network module directly.

Platform dependencies outside npm: `git`; `ps` and `pgrep`; the platform keychain tool. Each is probed
by a doctor check. None is required for a run to start except `git` where commits are on.

## 7. State layout

| Root | Default location | Who writes |
|---|---|---|
| User-level state | Config in `~/.config/specstride/`; state in `$XDG_STATE_HOME/specstride/user/` | The consumer; the CLI on request; the runtime for the tripwire only |
| Control plane, one per workspace | `$XDG_STATE_HOME/specstride/workspaces/<workspace-id>/` | The runtime tree. The CLI writes into the inbox and the launch records only |
| Workspace part | `<workspace>/.specstride/` | The proposer; the runtime for the handoff |

The tree is R15 A-5.3, with these amendments from R15v P-8: five logical names for the logs and
records the oracle compares; a `supervision.json`; one state file per writer; attempt directory names
that carry the engine-start ordinal; a learning writer domain.

| Rule | Content |
|---|---|
| SL-1 | Nothing in the workspace part decides anything. The runtime reads the outbox and the evidence as claims, after the pass has exited, as regular files without following links |
| SL-2 | Files are written to a temporary name and renamed. State files hold current state; history is the event stream |
| SL-3 | Grounding refuses every path of the control plane and of the event stream |
| SL-4 | Feature 100 owns a table from logical names to paths. Specs, the oracle and the doctor use logical names, so a later change of layout changes one table and a layout version |
| SL-5 | The inbox is the only place a process outside the runtime tree writes after launch |
| SL-6 | At containment C0 and C1 the control plane is protected by location and by detection, not by the operating system. The run record and the `[LOOP]` line say `protection=detect` (DP-040) |
| SL-7 | Old `.specstride/`, `.lisa/` and `.mixture-of-loops/` trees are not read (decision 3) |

### What the control plane outside the tree costs

It buys protection without a rule per harness sandbox, and grounding cannot reach it by citation. R15v
found three costs, which the design answers as follows (DP-071, DP-084):

| Cost | Answer |
|---|---|
| A moved, renamed or cloned working tree has a new identity, loses its approvals and would restart at phase 1 | `state export`, `import` and `adopt`, designed in feature 122. A launch is refused when the spec shows ticked phases that have no approval record, with the command to adopt named |
| A second user or a container can start a second run on the same tree | An advisory marker `.specstride/active` in the workspace part, checked at launch. Advisory, because the proposer can write there |
| A sandboxed host shell may be unable to write the control root | Tested by the spike; host capability `stateRootWritable`; fallback is a control root inside the tree with a deny rule per harness |

## 8. Run-state machine

States: `created`, `starting`, `running`, `paused-quota`, `relaunching`, `stopping`,
`blocked-on-human`, `finished`, `stopped`, `failed`, and the derived `dead`. Transitions and their
owning process are R15 A-6.2.

| Rule | Content |
|---|---|
| The host writes no transition | The CLI writes only the transitions into and out of `created` |
| A quota pause is a state, never a stop | It spends no reject, iteration, MALFORMED, error, wall-clock or relaunch budget (DP-028). It has a ceiling, default 24 h, after which the run rests with the stop reason `paused_quota_ceiling` (DP-068) |
| `blocked-on-human` is a resting state | No process, lock released, `resume` by the consumer (DP-076) |
| Terminal record | The engine writes exit code, stop reason from the closed enumeration, `retryable`, and its ids before it exits. The projection keeps writing `run_stop.reason`, so string matching holds under the oracle |
| Micro-loops | Add no state, no exit code and no stop reason |
| Staleness | The hashes of spec, plan and tasks are checked at launch, at resume and at the start of every pass. A change stops the run with the blocked-on-human signal and names the file. Under the `parity` profile the check happens where it does today, when the critic starts (owner ruling K3; R28: an edit of `tasks.md` made the critic refuse a 44 h attempt 22 h later) |
| `resume` refusals | Exit 5 when the lock is held, 3 when there is nothing to resume, 3 when the spec's hash changed since launch (owner ruling K2) |

Exit codes per process and the 14 stop reasons (15 with the quota ceiling) are in `consolidation.md`
§3 and §4.

## 9. Run acceleration

The plan is R27's reconciled design, which adopted every rule of the gate red team (IR-31 to IR-57).
All numeric defaults have low confidence and are starting values for the experiments.

### Wave 1, on by default (all off under the `parity` profile)

| # | Technique | Feature |
|---|---|---|
| 1 | Micro-loop layer at level L1, only in runs whose verification gate executes | 115 |
| 2 | Closing check, only in an attempt where a unit was declared | 115 |
| 3 | Fail-fast: the first-failure predicate on a yield | 118 |
| 4 | Runtime ledger, counts that survive a resume, a handoff regenerated at every pass start | 103 |
| 5 | Obligations index and a whole-prompt budget | 103 |
| 6 | Cache-stable prompt start | 103, 125 |
| 7 | Session continuation within an attempt, under the drop rules | 125, 115 |
| 8 | Polite stop (SIGINT before SIGTERM) | 118 |
| 9 | Model-tier escalation as the second repair, capped | 115 |
| 10 | The deterministic router | 115 |
| 11 | Usage counted per model call for every pass. Not an acceleration; the precondition for judging one | 111 |
| 12 | The integrity rules that are independent of the layer | 105, 117 |

Options, off by default:

| Option | Feature | Source |
|---|---|---|
| The step runner | 105 | R27 |
| Concurrent independent verification commands, with declared write scopes | 105 | R26; owner ruling D2 |
| `continue-and-notify` as the default of the first-failure predicate | 118 | R23v |
| Parallel `[P]` units, with a merge check before the critic. A loop layer `parallel` above `micro`; 2 workers by default, ceiling 4; only at containment C2 or above unless the consumer sets `loop.parallel.allow_detect` (owner ruling P2); expected saving 1–3 % of alive time (inferred), so it does not become a default on present evidence | 142 | Owner rulings 56, P1, P2; R29 (PU-01 to PU-78), R29v (PU-79 to PU-104) |
| A tier bump after K critic rejections | 101 | Owner ruling 48; R25 |

### The micro-loop layer

| Subject | Design | Default |
|---|---|---|
| Unit of work | Declared by the proposer in a checkpoint that names task ids of the current phase; validated by the runtime against the task list as read at launch | One task per unit, sized at 5–15 minutes |
| Level | L1: the pass ends at the checkpoint. Works on every harness, tested or discovered | L1 |
| Check set | One manifest per phase, derived at launch from the sources the verification gate uses, stored in the control plane with its hash. Deterministic commands only. Every command runs in every check (DP-065) | — |
| Protection | Fingerprint of the protected set before and after every check. A check run against a changed set is `tainted`, never `pass`. Prevented where the harness offers a sandbox, detected everywhere (DP-040) | detect |
| Outcomes | Keep, repair, unresolved. The runtime never commits, reverts or resets the tree inside an attempt (owner ruling 50). Two exceptions exist, only with parallel units on (owner ruling P1): snapshot commits in the runtime's own store, and the application of a merged delta with its task ticks | — |
| Caps | Repairs 2 per task id; escalations 1 per task id and 2 per attempt, inside the repairs; 20 min per proposal; 30 min per unit; 5 min per check command; inner check time 15 % of the attempt; layer off after 2 unresolved units | as listed |
| When the caps run out | The layer switches off for the attempt and the classic loop carries on. No exit code, no stop reason | — |
| What the critic sees | A fact block built by the runtime: results per command and tree with their conditions, the tasks each unit named as the proposer's declaration, protected-set facts, integrity events by kind. Not included: counts, order, times, output, earlier results, tiers, sessions, routing decisions | — |
| Layer off by rule | In a run whose gate does not execute (verification mode `plan` or `off`), the classic loop runs, announced. Such runs still get fail-fast and carry-over (DP-064) | — |
| Reporting | A `[LOOP]` line before the digest, printed only when the layer is on (DP-067) | — |

### What it is expected to save

Against R21's baseline as confirmed by R21v. Central estimates are inferred, not measured.

| Fixture mix | Central estimate | Ceiling | Carried by |
|---|---|---|---|
| Long verification jobs, gate executing | 10–23 % | 32 % | Fail-fast |
| Ordinary phases | 1–15 % | 20 % | Rework caught early, fewer kills, less check overhead |
| 50:50 | 6–19 % | 26 % | Both |

The layer alone against the classic loop with every other switch on: 0–12 % on ordinary phases.
**The 25 % target of decision 21 cannot be met by the layer alone** (DP-061). This architecture
proceeds on the reading that the targets apply to the default configuration against the parity
configuration, and that the layer must separately earn its place in its own ablation.

### The experiments

| # | Question | Cost |
|---|---|---|
| X0 | Is cost counted for every pass? A precondition: recorded cost misses about half of the reference run's spend | Stubs, then 20 live passes |
| X1 | What share of past rejections would a deterministic command have caught? | None (retrospective) |
| X2 | What does fail-fast save? Baseline 29.3 h of 42.9 h | None (replay) |
| X3 | How much prompt does the index remove? Baseline median 107.8k first-turn tokens | None (offline) |
| X5 | Does the default configuration meet decision 21's targets? | About 100 h alive and about $1,342 notional per arm |
| X6 | Does the layer itself earn its place? | As X5 |
| X9, X10, X11 | Ablations: continuation off, escalation off, index off | As X5, smaller |
| X12 | Gate integrity and gaming | Stubs; live critic calls for one part |

Evaluation window: 48 valid paired phases or 6 weeks, whichever comes first. If it closes with the
targets not shown, the default returns to `classic`. On a breach of gate integrity the revert is
immediate at three levels: the run, the machine (a tripwire in user-level state, DP-066) and the next
release.

Roadmap items are in `roadmap.md`. The research recommended no agent parallelism in Wave 1 (R26); the
owner ruled that parallel `[P]` units enter Wave 1 as an option that is off by default (ruling 56).
Its measured ceiling is 1.18 to 1.30 times, before coordination costs, so it stays an option until its
experiment shows more. Feature parallelism across workspaces, a phase graph and selection among N
candidates stay on the roadmap, and the six constraints of R15 A-8 keep them possible.

## 10. Memory

No memory feature is specified (R12, DP-018). Current benchmarks show self-built memory failing to beat
memory-off for coding agents, and Lisa's memory package is never called in a run. The cold-start cost
is a prompt-construction problem: one generated block is 69–70 % of the proposer prompt. It is answered
by the obligations index (technique 5). The learning feature is ported unchanged as the across-runs
layer (106). Harness-native memory is off for the critic always and off by default for the proposer,
recorded per run (DP-017). A later lessons store plugs in as a prompt block provider (EP-15).

## 11. UI data contract

| Subject | Design |
|---|---|
| Read model | `RunView`, schema `specstride.view/1`: a pure projection `project(events, state files, now)` and a reducer. Inputs are the event stream and three named state files |
| Derived in the contract | Lanes (kanban columns), attention items and budget levels. A renderer never opens the event file |
| Wave 1 consumer | `specstride status` with text, `--json` and `--line`; `wait --until-change`, which prints nothing while nothing changes; the hook status shim |
| Wave 2 renderers | A terminal follower, a read-only loopback web viewer (DP-004), an opt-in static export |
| Rejected | MCP UI resources (dropped by Claude Code today); IDE webviews (no plugin API); dsh client bundles |
| From Lisa | The pure builders `kanbanColumns` and `budgetBurndown` and the design tokens; not the server, which is a daemon in the control path |

## 12. Observability contract

| Subject | Design |
|---|---|
| Schema | One versioned schema, `specstride.event` v1, with requirements EV-01 to EV-34 (R14), which cover the 20 telemetry gaps R21 listed and what `RunView` needs |
| Writer | One primary file writer, local first and authoritative. Sinks receive events after it has written them, already redacted |
| Compatibility projection | A table-driven sink that renders the old vocabularies. Byte-identical to the baseline on the oracle's fixtures after normalization; no promise elsewhere |
| Exporter | One OTLP exporter, as a sink. Prompt and response content is captured whenever traces are on, and can be switched off (owner ruling 43); it is off under the `parity` profile, because the baseline captures none. It always passes the single redaction point. The redaction patterns of today are narrow (R11), so they are widened and tested with planted canaries before release |
| Cost | Reported only, `null` where a harness reports none. Cost under a subscription is labelled notional (DP-030) |
| Quota | Adapters classify each failure. Today's baseline has no quota handling at all: a quota failure exits 4 and burns the relaunch budget |
| Alerts | The engine is the only source. Host hooks, the digest and the doctor read from it. Hard caps with API keys; observation-based alerts with subscriptions; loudest when a fallback moves a run from subscription to API key |

## 13. Lisa reuse

Selective extraction of about 11k of 48k lines, as source (R1, confirmed by R1v: 36 of 57 gap cells
sampled, 1 failed). The phase loop, the CLI and config, and the generic adapter are written new,
because Lisa's loop has no seam for the MALFORMED limit, the recovery cycle, yield, the oscillation
halt or the layer. The tree is local `main` `363e6a3` for 18 packages and `76adfdc` for the dashboard
(DP-013).

| Extracted | Not taken |
|---|---|
| Nonce verdict parser; grounding (brought to the baseline's behaviour first); exit codes; proposer-context budgeting; the journal pattern; spec adapters; parts of `verification` plus `core/domain/verification-plan.ts`; the provider seam and the two completion clients; the Agent SDK harness and its stream tap, as an optional Tier 2 transport (owner ruling 20); `otel`; stop primitives; budgets; the TUI presenter; the doctor's finding model; the worktree creation rules (002 FR-048) for parallel units | The phase loop; the lock (R2v: multiple winners in 297 of 300 rounds); the server; the scheduler queue; `memory`, `plugins`, `hooks`; the 14-state job lifecycle |

Kept Lisa behaviours get characterization tests. Every dependency is checked for MIT compatibility.
The Agent SDK is proprietary: it is an optional dependency, never bundled, and authenticates with API
keys only (owner rulings 20 and 70). The copyright line is "Copyright (c) 2026 mairp" (owner ruling 14).

## 14. Feature decomposition

The suggested decomposition cannot stand: the inventory has 2,785 behaviour items against 57
requirements in 028 and 011, and at today's grain nine of the suggested features would exceed 40
requirements, three of them 60 (R15 F-08). R15 proposed 27 features. R15v found two of its cuts
artificial and one feature missing, which gave 26. The owner approved those 26 (ruling 15) and added
five: four harness adapters, because every parity test must pass before any release (rulings 32, 32b),
and parallel units (ruling 56). **Wave 1 has 40 features and the umbrella, 41 specifications.**

| Feature | Scope | Change against the suggestion |
|---|---|---|
| 100-specstride | Umbrella: vision, glossary, architecture, all cross-feature contracts, the `parity` profile, the list of closed sets, threat model, integration acceptance | Extended. Specified as one feature with **annexes by layer** (DP-087) |
| 141-parity-oracle | Reference trees, stubs, fixtures, normalizer, comparator, exercise map, the second suite, the coverage script | **New** (R15v E-1). Specified right after 100 |
| 101-gate-and-verdict | The gated phase loop, nonce verdict, MALFORMED limit, oscillation, recovery cycle, approval record, post-approval steps | Narrowed |
| 117-critic-grounding-and-prompt | Grounding snapshot, critic prompt assembly, verdict pins, data framing of untrusted text | New, split from 101 |
| 102-run-control | Stop, resume and its refusals, the run snapshot, counts that survive and the reset flag | Narrowed. Owns stop |
| 119-front-door-and-presenter | Front-door verbs, inspection commands, compatibility output, presenter | New, split from 102 |
| 103-proposer-pass | The pass loop for parity, breakers, the loop-layer hook points, the prompt assembler, carry-over | Narrowed |
| 118-pass-supervision-and-jobs | Watchdogs, kills, the yield artifact, detached jobs, fail-fast | New, split from 103; takes fail-fast from 115 |
| 104-spec-input | Spec formats, the canonical model, one hashing scheme | Unchanged |
| 105-verification | Modes and plans, plan sources, manifest derivation, the check runner, the step runner | Extended |
| 106-learning | As suggested | Unchanged |
| 107-launch-contract | Inventory, derivation in bounded batches, validation, promotion, rendering, the `dry-run` mode of decision 18, the comment | Narrowed |
| 123-pipeline-runtime-and-supervisor | The stage executor, the dry-run plan that the pipeline entry prints, launch checks, both relaunch classifier tables, `supervise` verbs, digest lines | New, split from 107 |
| 122-detached-runtime | Detach strategies, lock and liveness, lease, process registry, inbox, state export and adopt, the spike | New |
| 108-reverse | Wrapper, plan, driver spec, guard, inventory, lint | Unchanged as one feature with two requirement groups; split only if `speckit-specify` yields more than about 45 |
| 109-harness-seam | Registry, the harness port, descriptor schema, generic adapter, containment levels | Narrowed |
| 124-harness-discovery-and-roles | Discovery sources, probing, role resolution, the critic order and auto-pick | New, split from 109 |
| 125-adapter-claude | The Claude adapter as proposer and tool-less critic | New, split from 109 |
| 126-stream-seam-and-invocation | Stream readers, invocation identity and retention | New, split from 109 |
| 110-config-and-terms | Schema, precedence, secrets, tiers, the terms gate | Narrowed |
| 127-quota-budgets-and-pause | Quota classifier, pause, fallback, budgets, alerts | New, split from 110 |
| 111-event-schema-and-projection | The event schema and writer, redaction, the legacy projection | Narrowed |
| 128-telemetry-export | OTLP, Loki, metrics, content capture | New, split from 111 |
| 129-run-view-and-status | `RunView`, `status`, `wait` | New, split from 111 |
| 112-doctor | The check registry and entry points | Unchanged |
| 113-host-claude-code | Plugin, skills, hooks, packaging, evals, token budgets | Unchanged |
| 115-micro-loop-layer | Units, checks, caps, closing check, router table, escalation, the protected set, fingerprints, the fact block, the experiments | As suggested, without fail-fast. One feature with two requirement groups; split only above about 45 |
| 130-adapter-dsh | The dsh adapter: proposer and critic, text stream, no session continuation, exact version pin | **Moved from Wave 3** (owner ruling 32b). Carries 66 behaviour items |
| 131-adapter-codex | The Codex adapter: proposer, and critic under a read-only sandbox in the working tree with the proposer's files hidden | **Moved from Wave 3** (owner rulings 32b, 57, 57a, D1). Carries 8 behaviour items |
| 134-adapter-pi | The pi adapter, sharing one JSONL reader and a dialect table with prime | **Moved from Wave 3** (owner ruling 32b). No as-is behaviour |
| 138-adapter-prime | The prime adapter: proposer and critic, stream schema v3 | **Moved from Wave 3** (owner ruling 32b). Carries 62 behaviour items |
| 142-parallel-units | Parallel `[P]` units in worktrees with a merge check before the critic; off by default | **New** (owner rulings 56, D2, D3). Specified from R29 and R29v |
| 144-compatibility-projection | The compatibility projection: the table-driven sink that renders the new events in the old vocabularies, its row shapes and writer classes, the legacy event file | **Split of 111-event-schema-and-projection in Stage B** (split rule, 2026-09-29) |
| 140-reverse-inventory-and-lint | The source inventory with its walk rules and fingerprint, the reverse lint with its finding codes and levels, the shipped templates | **Split of 108-reverse in Stage B** (split rule, 2026-09-29) |
| 145-presenter | The presenter with its card and plain forms, the banner, the theme, the start-up and live rules of terminal output | **Split of 119-front-door-and-presenter in Stage B** (split rule, 2026-09-29) |
| 147-terms-gate | Auth tiers, audiences, the terms gate and its data (EP-11) | **Split of 110-config-and-terms in Stage B** (split rule, 2026-09-29) |
| 149-attempt-planner-and-seams | The critic-strategy and attempt-planner seams (EP-18), the recovery planner, the tier bump after K critic rejections as an option, the invariants of the seams | **Split of 101-gate-and-verdict in Stage B** (split rule, 2026-09-29) |
| 148-check-runner | The check runner (EP-05): a command as a fixed argument list, its environment, time limit and result conditions; the step runner; concurrent verification commands with declared reads and writes; the integrity rules around a check | **Split of 105-verification in Stage B** (split rule, 2026-09-29) |
| 146-harness-discovery | The seven discovery sources, the probe ladder, the four states of a harness and promotion | **Split of 124-harness-discovery-and-roles in Stage B** (split rule, 2026-09-29) |
| 143-parallel-engine-services | The engine services of parallel units: the group executor, the tree store with its snapshots, worker trees as repositories of their own, the application of a merged delta | **Split of 142-parallel-units in Stage B** (split rule, 2026-09-29) |
| 116-check-integrity-and-unit-evidence | The protected set and its fingerprints, the toolchain profile (EP-16), the result of a check and its freshness, the fact block (unit evidence), the integrity rules of a check | **Split of 115-micro-loop-layer in Stage B** (split rule, 2026-09-29) |
| 114-memory | — | Not specified (owner ruling 17) |

Number 114 stays unused. Wave 2 and later features are in `roadmap.md`.

**Single owners** (R15v E-3): `status` data and default output belong to 129 and its compatibility
output to 119; the relaunch classifier to 123, `resume` to 102, lock reclaim to 122; stop to 102;
fingerprints and the protected set to 116, which 105 consumes; the step runner to 148; the line grammar
to 100 and each line to its feature.

**Order for Stage B** (R15v E-4): two tiers. Feature 100 and then 141 are specified first and alone.
Every cross-feature contract is in feature 100, so all other features are specified in parallel.

**Parity before any release** (owner ruling 32): every parity test passes before any release. The
behaviour items of dsh, prime and Codex (136) are therefore `ported` or `translated` in Wave 1, in the
adapter features 130, 138 and 131. Decision 13 is changed for dsh, Codex, pi and prime; the other
named harnesses stay in later waves.

## 15. Language Ledger (draft)

| Component | Language | Gain over TypeScript | Portability cost | Interface | Status |
|---|---|---|---|---|---|
| — | — | — | — | — | **Empty** |

Considered and rejected: Go for the runtime, CLI and doctor (3 ms startup against 62–83 ms and about
2 MB against about 34 MB idle, immaterial for hours-long, I/O-bound runs; language has no effect on
context); Rust or Go for hashing (Node measured within 16 % of `sha256sum`); Python for learning;
native addons for locks and PTY (`fs-ext` compiles at install, `node-pty` ships no Linux prebuild); a
Bash launcher shim (a Node-shebang file works, DP-043). Places where an entry could come later, each
behind an interface: EP-13 (a native kernel lock) and EP-17 (a service installer).

Port size: 20,932 code lines today in 42 files, confirmed by recount, become an estimated 16,300 to
25,850 TypeScript lines, with 21,900 as a conservative centre. Tests add 19,121 lines today.

## 16. Parity oracle

The design is R18 O-1 to O-12. Summary:

| Subject | Design |
|---|---|
| Reference | The Python trees at `9cab15d` and `9c88f86`, obtained by `git archive` into scratch, made read-only. Committed golden captures for pull requests; a live differential run as the release gate |
| Environment | Every run starts from an empty environment with an allow-list; stubs win on `PATH` |
| Stubs | Proposer, critic (HTTP and CLI), diagnostician, engine, verification commands. No clock, no randomness, no model call. **Stub transcripts are a compared surface**: they show what each agent was asked |
| Fixtures | 37 families, FX-01 to FX-37 |
| Normalization | 28 named rules, N-01 to N-28. A rule is added only with a register row. A rule that replaces nothing fails the suite |
| Result | `equal`, `waived (<register row>)` or `different`. A waiver that matches no difference fails the suite. A release is blocked on any `different` |
| Coverage | An exercise map from line tracing: a test may claim a behaviour item only if its fixture executed that item's evidence line |
| Second suite | Every fixture with the layer on and stubs that never declare a unit; identical apart from the named layer fields; counters asserted equal |
| Owner decisions | 21 and 22 switched off; 23 by the reset flag; 18 mapped with one waiver |
| Feasibility | A probe ran the baseline engine against stub agents on Linux: exit 0, the same tree twice, 10 s |

## 17. Threat model summary

R11's model has 47 threats and rests on five structural controls.

| Control | Content |
|---|---|
| R-1 | The control plane is outside the proposer's write scope. Approval is a signed record, verified on resume |
| R-2 | Containment levels C0 to C3 as an adapter capability. The strongest available is the default; C0 is an opt-in in user config |
| R-3 | One fail-closed redaction point. Content is captured whenever traces are on (owner ruling 43), so this point carries the risk and its patterns are widened and tested before release |
| R-4 | Project configuration may narrow a run, never widen it |
| R-5 | Text from outside the runtime is framed as data everywhere |

| Top threat | Today | Answer |
|---|---|---|
| Approval-marker forgery | The marker is an empty file the proposer can write; resume trusts its presence | Approval record (DP-010) |
| Uncontained proposer | The baseline passes bypass flags and asserts a sandbox itself when run as root | Containment default (DP-008, DP-011) |
| Repository configuration as code | — | Narrow-only project configuration (DP-009) |
| Critic persuasion | The nonce stops forged verdict lines, not an injected critic | Deterministic verification before the critic; data framing |
| Secret leakage | Prompts ride on spans when traces are on | The redaction ingress, which fails closed. Content is captured whenever traces are on (owner ruling 43), so the patterns are widened and tested with planted canaries before release |
| Race on the fingerprint | — | Fingerprint before and after every check; end the pass's processes first |
| A critic that reads the project by itself (owner ruling 57a) | — | Read-only sandbox, network off; the proposer's notebook, handoff and outbox moved out and `.specstride/` denied before the critic starts; the grounding snapshot and the nonce as before. Repository text can still reach this critic without passing the snapshot: a residual risk the owner accepted |
| Several workers on one phase (owner ruling 56) | — | Rules PU-01 to PU-104: a sandbox required by default, a repository of its own per worker, the store unwritable by workers, composition of audited disjoint deltas, the merge check and the full gate on the merged tree, neutral integrity kinds so that the critic learns nothing about groups or workers |

## 18. Open risks

| # | Risk | Carried by |
|---|---|---|
| 1 | Detach survival inside a host session is unproven | The spike in feature 122; EP-17 |
| 2 | Feature 100 is far above 40 requirements | Annexes by layer (DP-087) |
| 3 | Gate quality on a harness without a sandbox is detection, not prevention | DP-040; experiment X12 |
| 4 | Check duration is unknown: no inner check has ever run | The 15 % budget; experiment X5 |
| 5 | The decomposition rests on a coarse keyword count | Split rule after `speckit-specify` |
| 6 | macOS is unverified throughout | DP-006; a macOS runner before release |
| 7 | The reference run executed a live working tree, not a fixed version, so its figures mix engine versions | The baseline is quoted in two tiers |
| 8 | The Claude critic's flag combination has had no live call | One probe per role, to be logged |
| 9 | Four adapters enter Wave 1 on facts that are partly unverified: pi's exit code on a provider error, Codex's structured quota event, dsh's approval behaviour in headless mode | Fixture captures before their specs freeze |
| 10 | Content in telemetry by default | Redaction canaries as a release condition |
| 11 | Wave 1 grew from 14 suggested features to 31 | Stage B in two tiers; the split rule |
