# The option `parallel units`

**Feature 142.** The loop layer `parallel`, stacked above `micro` behind the loop-layer interface
(EP-04). It is **off by default** and **off under the `parity` profile**.

With the option on, tasks that the task list marks `[P]`, and whose write scopes are declared and
disjoint, are worked at the same time by several workers, each in a tree of its own. When the
workers have ended the engine audits what each one changed, composes the audited changes, writes
them to the workspace, ticks the tasks, and runs the inner check set of the phase once on the
result. The verification gate and the critic then judge the phase exactly as they always do: this
option **adds no gate, replaces no gate and loosens none**.

Sources for everything below: `specs/142-parallel-units/spec.md`,
`docs/ecosystem/research/R29-parallel-units-design.md` (F-2, F-8),
`docs/ecosystem/research/R29v-parallel-units-red-team.md` (V-27) and owner ruling P10.

---

## 1. Switching it on

| Key | Where it may be set | Default |
|---|---|---|
| `loop.parallel.units` | any rank of annex X §X.2; the `parity` profile forces `off` | `off` |
| `loop.parallel.workers` | the worker count asked for | 2 |
| `loop.parallel.workersMax` | the ceiling of the worker count | 4 |
| `loop.parallel.allow_detect` | **user configuration only** | unset |
| `loop.parallel.quota_headroom` | per cent of quota utilisation still free | 70 |
| `loop.parallel.resources.<name>.capacity` | user configuration | 1 |
| `loop.parallel.scopes.<taskId>` | user configuration or the promoted launch contract | — |
| `loop.parallel.exclude` | project configuration may *remove* a task | — |

A worker count above `loop.parallel.workersMax` is a **configuration error at launch**, not a
silent clamp. Project configuration may narrow a scope or exclude a task; it may never add or
widen one, and such a declaration is refused with a doctor line.

Before you switch it on, run `specstride doctor`. It prints the plan the option would produce
(groups per phase, the tasks left serial **with the reason**, the ceiling of the speed-up under
equal task cost) and names the exclusive resources it cannot check. With the option off the doctor
prints no plan at all.

## 2. When it is worth switching on

**Switch it on for single phases. Do not switch it on for a run.**

The gain is per phase, and only a minority of phases can take it. R29v V-27 counted 85 of 399
phases of the corpus (21 %) reaching a ceiling of 1.15 at two workers; the rest hold no admissible
group at all. Every group, meanwhile, pays one cold start per worker. Over a whole run the cost is
paid on every group and the gain is diluted by every phase that has no group — which is why the
figures below are stated as a ceiling and the option carries no recommended default.

A phase is a good candidate when **all** of these hold:

- it has at least two consecutive tasks marked `[P]`;
- each of those tasks has a write scope that is declared or plainly named in its text, and the
  scopes are disjoint at path boundaries (`src/a` does not overlap `src/ab`);
- no scope touches a single-writer file — the task list, the phase evidence, the notebook, the
  handoff, or anything under the workspace part;
- the phase has a non-empty inner check set, so there is a merge check to run;
- the tasks are long enough that a cold start per worker is not most of their cost.

It is **not** worth switching on when:

- the phase's tasks are short, or there are only one or two of them;
- the tasks share files, or their scopes are unknown — they will be made serial anyway, and all
  you will have bought is the planning;
- the phase names an exclusive resource (a port, a database, a lab bench) whose capacity you
  cannot raise to the worker count;
- your quota is tight: a group spends the quota of `workers` passes at once;
- you are reproducing a run under the `parity` profile, where the option is forced off.

The layer is **off for the run**, as a fallback and never an error, when a precondition fails. The
eight reasons are `classic`, `gate-not-executing`, `not-git`, `submodules`, `git-version`,
`harness`, `containment`, `no-group`. The run then completes exactly as the same run with the
option off.

## 3. The expected saving

Stated as it is, and not as anyone would like it to be:

> **A ceiling of about 3 to 4 per cent of alive time at 2 workers, before any cost**,
> against one cold start per worker.
> Worth switching on for single phases, and not for a run.
> **No target is set and no saving is promised.**

The numbers behind that sentence:

| Figure | Value | Source |
|---|---|---|
| Ceiling of a phase at 2 workers | 1.063 pooled, 1.038 median, 1.190 p90 | R29 F-2, reproduced by R29v V-27 |
| Ceiling of a phase at 4 workers | 1.094 pooled, 1.052 median, 1.314 p90 | R29 F-2 |
| Ceiling with no worker cap at all | 1.104 | R29 F-2 |
| End to end, as alive time | 3.0 % (Claude baseline), 4.1 % (ORD), 2.0 % (LONG) | R29 F-2 with the proposer shares of R27 F-1 |
| Cost: one cold start per worker | 130 000 to 216 000 tokens beyond the serial path at 2 workers | R29 F-8 |
| Phases of the corpus that reach 1.15 at 2 workers | 85 of 399 (21 %) | R29v V-27 |
| Target | **none** | ruling P10, `research.md` D-9 |

Read it carefully:

- it is a **ceiling**, not an expectation. It assumes equal task cost and perfect overlap;
- it is stated **before any cost**. Each worker works in a directory of its own, so its first turn
  is a cache *write* and not a read — that is the cold start, and it is paid per worker, per group;
- R29's own central estimate of "1 to 3 %" was **refused** by R29v V-27 as having no method and a
  lower bound that can fall below zero once the cold start is paid. There is therefore no central
  estimate here, only a ceiling and a cost;
- experiment E6 is a **safety** experiment (ruling P10). It shows the option does not break gate
  integrity; it cannot show a default at its size, and it reports no pass mark for one.

The same statement is printed with the plan by the doctor and by `launch --dry-run`
(`expectedSavingStatement()` of `packages/layer-parallel/src/plan.ts`), so the operator reading the
plan and the operator reading this page are told the same thing.

## 4. Two channels this option narrows and does not close

Most of what parallel work could leak is **closed**: a worker's prompt names its task and its
scope and no sibling, count, index or group; the handoff names the integrated tasks in the words
used for a serial unit; refusals, kills and failed merge checks never reach a critic-class call;
no worker tree exists when a critic-class call starts. Two channels are **narrowed and not
closed**, and you should know about both before you switch the option on.

### 4.1 The path-leak audit is a text search (F142-FR-056)

Before integration, every added or changed object of a delta is searched for the real path of the
worker root, of the tree store and of the control plane, and for the opaque token of the worker. A
hit refuses the whole delta with the reason `path-leak`.

**The search is by text.** It therefore catches a path that was *copied* into a file, and it does
not catch:

- a path that was encoded, split across lines, abbreviated, or written with a different separator;
- a path the proposer *described* instead of quoting ("the directory two levels above the
  workspace");
- an inference drawn from something other than a path — a timestamp, an inode number, a tool's
  error text that the proposer paraphrased.

**That channel is narrowed and not closed.** The audit keeps the worker root out of the committed
work in the ordinary case, and it is **not** a containment boundary. The boundary is the sandbox of the harness
adapter (containment C2), which confines the harness's own file tools to a write root other than
the workspace. If you run at C0 or C1 with `loop.parallel.allow_detect`, the run says
`protection=detect`, and `detect` is what you get: the leak is detected after the fact and the
delta refused, not prevented.

### 4.2 A proposer can still describe its work in the phase evidence (F142-FR-069)

What the *runtime* tells a proposer about parallel work is minimal and neutral, and a critic cannot
tell a group from a serial pass by the runtime's words: the critic prompts are byte-identical. But
the phase evidence is written by the **proposer**, in its own words, and nothing redacts it.

So a worker that was told "work task T017, scope `src/writer/`" may still write "I did only the
writer; something else must be handling the reader" into the evidence, and a critic reading that
evidence may infer that the phase was worked by more than one pass.

**That channel is narrowed and not closed.** It is narrowed because the worker is never told the
count, the index, the siblings or the group, so it has nothing concrete to report; it is not
closed because a proposer can reason about the shape of its own task. If a critic inferring
parallel work is unacceptable for your run, do not switch the option on.

## 5. What it costs you besides tokens

- **Disk.** Each worker tree is a full tree. Admission refuses a group unless the free space of
  the file system of the worker root is at least twice the size of the base snapshot plus the seed
  paths, times the worker count.
- **Quota.** A group spends the quota of `workers` passes at once; admission refuses one when the
  last observed utilisation of any quota window is above `loop.parallel.quota_headroom` (70 % by
  default). After two transient rate limits the worker count is halved; at 1 no group starts.
- **Cycles.** One cycle of the micro-loop layer is charged per admitted worker task, at its first
  start.
- **Inner check time.** Snapshots, fingerprints, audits, composition, application and the merge
  check all count inside the budget of inner check time of the phase attempt. When group overhead
  breaks that budget, no further group is admitted in that phase attempt — and group overhead never
  excludes a command from the inner check set.

## 6. What it does not change

- No exit code, no stop reason and no run state is added. Over every fixture the sets of all three
  are subsets of the sets over the same fixture with the option off.
- The verification gate is not replaced and no result of a group is offered for reuse at it.
- With the option off — the default — the layer is not registered, calls no service, writes no
  file, and no plan, no tree store and no worker root exist.

## 7. Where to look when something goes wrong

| Symptom | Where it is recorded |
|---|---|
| The option did not run at all | the launch message and the `[LOOP]` line: the fallback reason |
| A task you expected in a group ran serially | the printed plan: `serial <id>: reason=<check>`, one of `marker`, `scope`, `protected`, `resource`, `headroom`, `check`, `links`, `jobs` |
| A worker's work was thrown away | the ledger and the worker's event: one refusal reason of `scope`, `protected`, `overlap`, `path-leak`, `checkpoint`, `yield`, `tree-changed-after-end`, `workspace-changed` |
| The layer switched itself off mid-run | the `[LOOP]` line and the `parallel.*` events: two failed groups, a harness error, an empty inner check set, `apply-incomplete`, `plan-hash` |
| What a group cost | the `[LOOP]` line: `parallel`, `workers`, `groups`, `group-failures`, `refused`, `worker-caches`, `wall-hours`, `agent-hours` |
| Gate integrity | `specstride doctor`: the five breach invariants of F142-FR-071, one check each |
