# Specstride core

**The engine behind Specstride: loop engineering and governance for coding agents.**

An agent that grades its own work says "done" when it isn't. Specstride takes a Spec Kit feature to
done phase by phase, unattended. For each phase it implements, verifies, has an independent reviewer
judge the work, records the approval and commits. A phase moves on only when a separate critic
approves it. Every approval is a record the engine verifies again on resume, and every approved phase
is its own commit.

This repository is the **core**: the engine, its contracts, the loop layers, the runtime, the
adapters and the kits a host is built from. Hosts sit on top of it:

| Repository                                                        | What it is                                                     |
| ----------------------------------------------------------------- | -------------------------------------------------------------- |
| **specstride-core** (this one)                                    | The engine and the four published packages                     |
| [specstride-plugin](https://github.com/mairp/specstride-plugin)   | The Claude Code plugin, a thin host over a pinned core release |
| [specstride-example](https://github.com/mairp/specstride-example) | A ready-made Spec Kit feature to try a run on                  |

Provider-agnostic. Open source (Apache-2.0). Runs on your machine. Your models, your keys.

## Why loop engineering

A single agent session is one loop with no brakes. Specstride treats the loop itself as the thing
to engineer: which loops exist, what ends each of them, what is allowed to cross between them,
and what happens when one gets stuck.

The loops, from the outside in:

```
pipeline stages ─▶ phases of a run ─▶ phase attempts ─▶ passes ─▶ micro-loop cycles
```

- **Every loop has an end.** Attempts per phase are capped, passes have watchdogs and breakers,
  and every way a run can stop is a named stop reason with a fixed exit code (closed sets in
  `@specstride/contracts`). Nothing ends with "it went quiet".
- **Deterministic checks before any opinion.** Each phase has a frozen check manifest. The
  verification gate runs those commands (a fixed argument list, no shell) before the critic sees
  anything. A phase whose tests fail never reaches review.
- **Stuck phases get unstuck, not retried blindly.** When a rejection names a new set of unmet
  tasks, a diagnostician session analyses it first. The next attempt is narrowed to those tasks,
  with the diagnosis as its first instruction. The critic still judges it like any other attempt.
- **A router with no I/O.** Decisions such as check order, which loop layer to use, and escalation
  to the next model tier of the same harness come from a pure function over versioned rule tables.
  Every decision records its rule id and table version, so a run can be explained after the fact.
- **Loop layers you can stack.** `none` (the classic loop), `micro` (inner checks with
  keep/repair/unresolved at a checkpoint), and `parallel`. The parallel layer is opt-in: tasks with
  disjoint files run at once, each in its own worker tree, behind eight admission checks. Their
  deltas are audited and merged, and the full gate runs on the merged tree before the critic sees
  the phase. Overlapping tasks are refused with the reason printed and run in order.
- **Detached and resumable.** One runtime root per run, detached from the shell that started it,
  with a workspace lock and lease, a process registry and an inbox for requests. You can SIGKILL
  the engine in the middle of a phase: no engine process survives, and the next start resumes
  where it stopped. `stop` ends the run at the next safe boundary with the record closed whole.
- **Yields instead of dead waits.** Long jobs run detached while the pass yields. A wait that can
  no longer complete ends early instead of burning its timer.
- **It learns, with guardrails.** The learning layer reads the run's own telemetry, suggests
  per-phase settings, evaluates each change against a baseline and reverts any that make things
  worse. Learning has its own writer and its own file, and it is off unless you turn it on.

## Why governance

Autonomy is only useful when you can trust what it reports. The core is built around controls
that an agent cannot talk its way past:

- **Separation of roles.** The implementer (proposer) and the reviewer (critic) are separate
  sessions, chosen independently, on any provider. A phase is never approved without a critic.
- **Verdicts that can't be forged.** The critic's verdict is bound to a per-attempt nonce, so a
  proposer that prints "APPROVED" achieves nothing.
- **Approval is a record, not a file you can touch.** Approvals are records outside the proposer's
  write scope, verified again on resume. A forged or missing approval stops the run instead of
  being trusted.
- **Approved means committed.** Every approved phase becomes its own commit. If the commit is
  blocked, the run does not report success: it exits non-zero and says why.
- **What the critic sees is grounded and framed.** The critic gets a grounding snapshot and a
  fact block. The proposer's notebook and repair history are withheld from it. All text from
  outside the runtime enters through one ingress, where it is size-capped and framed as data.
- **Secrets held back.** That one ingress also redacts, and it fails closed. Credentials are
  removed from what the critic and the traces see, and a credential found in a change blocks the
  commit.
- **Integrity tripwires.** Fingerprints before and after every check, protected paths, pinned
  toolchains and checkpoint reading catch a proposer that edits what it must not touch. A tripwire
  stops the run until a human clears it.
- **Configuration narrows, never widens.** Project configuration can only restrict a run.
  Anything that widens capability (containment level, detection-only parallel mode) is accepted
  from user scope, environment or flags only.
- **Containment by default.** Adapters declare containment levels C0 to C3. The strongest one
  available is the default, and C0 is an explicit opt-in.
- **Everything observable.** One primary event writer per run, a `RunView` read model for status,
  and sinks for files, OTLP traces and Loki. Every decision carries its rule id, so an audit can
  follow a run from launch to the last commit.
- **Layering enforced in CI.** A layer imports only from layers below it and from the contracts
  package. The engine imports interfaces, never implementations. An import-boundary check over the
  package graph fails the build otherwise.

## Benefits at a glance

| You get                                | Because                                                                                                                                                           |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Done" that means done                 | Tests run before review, an independent critic approves, the commit happens or the run fails                                                                      |
| Unattended runs you can walk away from | Detached runtime, capped loops, clean stop, resume after a crash or kill                                                                                          |
| Fewer wasted attempts                  | Diagnosis narrows each retry to the unmet tasks; the router escalates tiers by rule                                                                               |
| Your models, your keys                 | Proposer and critic resolved independently across Claude, dsh, Codex, pi and prime adapters, or a generic descriptor (`cli`, `openai-chat`, `anthropic-messages`) |
| An audit trail                         | Approval records, one commit per phase, rule ids on every decision, OTLP/Loki telemetry                                                                           |
| Safe parallelism                       | Fenced worker trees, audited deltas, the full gate on the merged tree                                                                                             |
| Extensible without forks               | 19 versioned extension points (`specstride.<name>/<major>`), each with a conformance suite in `@specstride/testkit`                                               |
| Nothing leaves your machine            | No service of its own: nothing is sent to its authors                                                                                                             |

## Architecture

```
L7 HOSTS      Claude Code plugin · dsh · plain shell             (host port EP-01, host-kit)
     │  CLI protocol v1: argv in, exit code and terse lines out, --json on request
L6 CLI        derive · validate · launch · status · wait · stop · resume · doctor · learn · supervise
L5 RUNTIME    detached runtime root · lock and lease · run-state owner · terminal digest
L4 ENGINE     run → phase → attempt · verification gate → critic → approval record
L3 PASS LOOP  passes · watchdogs · breakers · yields · loop layers (none | micro | parallel) · router
L2 PORTS      harness · spec format · check runner · event sink · secret resolver · …
L1 EDGES      adapters · stream readers · sinks (file, OTLP, Loki) · resolvers (env, file, keychain)
L0 STATE      user state · per-workspace control plane
               across all layers: @specstride/contracts
```

### Packages

| Package                                       | Role                                                                                          |
| --------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `contracts`                                   | Every shared interface: schemas, closed sets, exit codes, stop reasons, the run-state machine |
| `kernel`                                      | Table evaluator, atomic write, stable read, redactor, canonical hasher                        |
| `core`                                        | The engine: gate, approval, recovery cycle, attempt planner                                   |
| `layer-micro`, `layer-parallel`, `tree-store` | Loop layers and the parallel engine's tree store                                              |
| `runtime`                                     | Detached runtime root, lock and lease, process registry, inbox                                |
| `pipeline`                                    | Stage kinds and preconditions                                                                 |
| `harness`, `adapter-*`                        | Harness port, role resolution, and the Claude, dsh, Codex, pi and prime adapters              |
| `verification`, `check-runner`                | Verification plan, check manifest, the command runner                                         |
| `integrity`, `policy`                         | Fingerprints, tripwires, protected paths, pins; policy and terms gate                         |
| `observability`, `view`                       | Event schema, primary writer, redaction ingress, exporters; the `RunView` read model          |
| `config`, `doctor`                            | Configuration ranks and provenance; the doctor check registry                                 |
| `spec-formats`                                | Spec grammar: `native`, `speckit-tasks`, `openspec-change`                                    |
| `learning`, `reverse`                         | Telemetry-driven tuning with revert; reverse runs                                             |
| `cli`                                         | The `specstride` command                                                                      |
| `host-kit`, `testkit`                         | What a host is built from, and the conformance suites it must pass                            |
| `oracle`                                      | The differential parity oracle (development only)                                             |

## Published packages

Release **0.1.0**, one version for all four:

| Package                 | Holds                                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| `specstride`            | The CLI bundle: one ESM file, zero runtime dependencies, `bin` `specstride`                          |
| `@specstride/contracts` | Built contracts layer with its runtime data files                                                    |
| `@specstride/host-kit`  | Host-neutral host port: skill sources and registry, render, shim core, doctor checks, eval utilities |
| `@specstride/testkit`   | The EP-01 conformance suite, its fixtures, the plain-shell sample and the release-condition rule     |

Hosts take a core release by pinning the tarballs and their sha256 (see
[`docs/PUBLISHING.md`](docs/PUBLISHING.md)).

## Build and test

Requires Node.js 22 or newer and git.

```bash
npm ci
npm run typecheck:src     # type-check the package sources
npm run lint
npm run format:check
npm run check:imports     # the layering rule, over the package graph
npm test                  # every workspace's tests
node scripts/pack-release.mjs   # pack the four release tarballs into .build/release/
```

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md). Pull requests merge once
lint and tests are green.

## License

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
