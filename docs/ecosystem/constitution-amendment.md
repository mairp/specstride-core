# Constitution amendment proposal: 2.0.3 → 3.0.0

Status: **approved by the owner on 2026-09-29** (`APPROVAL.md`, ruling K9), with three edits that the
owner's rulings require. Not yet in force: it is applied with `speckit-constitution` as the first act
of Stage B. Until then `.specify/memory/constitution.md`
(v2.0.3) stands.

Bump: **MAJOR**. Principles VI, VII and XII are redefined, VIII and IX are reworded in substance, five
principles are merged in from the recovered mixture-of-loops constitution, and three are added
(XVIII, XIX and XX). v3.0.0 has twenty principles.

Inputs: Specstride's constitution v2.0.3, the recovered mixture-of-loops constitution (five principles),
Lisa's constitution v2.0.0 (ten principles), owner decisions 1–23, and the research reports cited per
principle. Entries marked **DP-nnn** depend on a pending decision; the text shown follows the default
that `DECISIONS-PENDING.md` records, and changes if the owner rules otherwise.

## 1. Why a new major version

| Cause | Effect on the constitution |
|---|---|
| Decision 1: full-parity rewrite in TypeScript | Every rationale that cites a Python or Bash file loses its anchor. Principles I–VI were descriptive ("the code enforces this"); there is no TypeScript code yet, so they become prescriptive, with the Python baseline as the behavioural precedent |
| Decision 2 and 19: TypeScript first, npm distribution | VI (stdlib-only, clone-and-run) cannot hold |
| Decision 17: harness discovery | VII (a closed list of five backends in `lib/backends.py`) cannot hold |
| Decision 6: tiered auth | VIII (throwaway config home), IX (direct HTTP first) and XII (no subscriptions) are strained or broken |
| Decisions 5, 21, 22, 23 | I, II, III and VIII need wording for the detached runtime, micro-loops, session continuation and surviving counts |
| Decision 18 | The mixture-of-loops principle "Silence Is Never Consent to Execute" is reversed in its default |
| `speckit-analyze` treats a conflict with the constitution as critical | No TypeScript plan can pass analysis while v2.0.3 is in force |

## 2. Fate of every existing principle

### Specstride v2.0.3

| # | Principle | Fate | New number |
|---|---|---|---|
| I | File-Based Coordination, No Watcher | Kept, non-negotiable. Reworded for the detached runtime, read-only viewers and the closing check | I |
| II | Adversarial, Non-Self-Approving Gate | Kept, non-negotiable. Extended: inner checks never approve; approval is a verified record | II |
| III | Grounded, Read-Only, Injection-Proof Verification | Kept, non-negotiable. Extended to inner checks and to untrusted text from the repository, the consumer's comment and descriptors | III |
| IV | Single Source of Truth for Spec Grammar | Kept, reworded for TypeScript | IV |
| V | Best-Effort Observability That Never Breaks the Loop | Kept, reworded for TypeScript | V |
| VI | Stdlib-Only, Clone-and-Run | **Replaced** by "Typed Core, Replaceable Edges, Installable With npm" | VI |
| VII | One Backend Registry | **Replaced** by "One Open Harness Registry" | VII |
| VIII | Unattended, Hermetic Proposer Passes | Kept, non-negotiable, **reworded in substance** (config home, session continuation, containment) | VIII |
| IX | The Critic Has No Tools and a Known Budget | Kept, non-negotiable, **reworded in substance** (the property is "no tools", the route is a means) | IX |
| X | Recorded Harness Versions | Kept, strengthened from SHOULD to MUST for tested adapters | X |
| XI | Truthful Stream Telemetry | Kept. "Byte-identical" is scoped to the compatibility projection on oracle fixtures | XI |
| XII | Build With What We Have | **Replaced** by "Verifiable Here, Lawful Everywhere" | XII |

### Recovered mixture-of-loops constitution

| # | Principle | Fate | New number |
|---|---|---|---|
| I | Facts and Judgment Are Separated | Merged in | XIII |
| II | Declared Verification Is Preserved, Never Invented | Merged in | XIV |
| III | Silence Is Never Consent to Execute | Merged in, **reworded**: invoking the skill is the consent | XV |
| IV | The Supervisor Only Reads, and Relaunches Only Classified Transients | Merged in | XVI |
| V | Missing Prerequisites Are Skips, Never Passes | Merged in | XVII |
| — | Constraint: standard library only | Superseded by new VI | — |
| — | Constraint: one canonical skill directory | Kept as a constraint: one skill source, thin host layers | constraints |
| — | Constraint: exit codes 20–24 are part of the interface | Kept: the per-process exit-code table in `consolidation.md` | constraints |

### Lisa v2.0.0

| # | Principle | Fate |
|---|---|---|
| I–V | Carried from the same ancestor as Specstride's I–V | Already covered by new I–V. Lisa's addition "the database is an index over disk state, never the source of truth" is kept in I |
| VI | Typed Core, Replaceable Edges | Adopted as the basis of new VI |
| VII | Immutable Inputs, Versioned Derivations | Adopted in part, inside XIII: sources are hashed and never modified; a validated launch contract is frozen. Human approval of plan revisions is `deferred` with the approvals feature |
| VIII | Deterministic Parallelism | Adopted as new XX, since the owner ruled that parallel units enter Wave 1 as an option (ruling 56) |
| IX | Evidence and Provenance Everywhere | Adopted inside XIII for reverse-engineered claims and contract entries |
| X | Compatibility Before Capability | Adopted as new XVIII, with the differential oracle as its mechanism |

---

## 3. Proposed text

### Part A — The gate and the loop

#### I. Durable State on Disk, No Watcher in the Control Path (NON-NEGOTIABLE)

All progress of a run is coordinated through durable files on disk. No inotify watcher, message queue
or service that a run depends on may carry control flow.

- Evidence and state are written atomically (temporary file, then rename). A reader never sees a
  half-written file.
- A gate is handed an evidence path only after the pass that produced it has exited.
- Resume position is derived from verified records on disk, never from a counter held in memory.
  A database, where one exists, is an index over this state and never the source of truth.
- The host skill and the detached runtime coordinate **only** through files. A run has one detached
  process tree, rooted at one runtime process that ends when the run ends. The engine is its child.
  The tree serves no other process; an endpoint that carries no data and exists only so that the
  kernel shows whether its owner lives is not a service. (**DP-070**, **DP-005**)
- State that the runtime relies on to decide something is kept outside the working tree. Processes
  outside the runtime tree write requests to an inbox and nothing else. (**DP-071**)
- A process that only reads state, that no run depends on, and that the consumer started, is not
  coordination: a status command, a terminal follower, a read-only local viewer. It may poll files.
  It must never be required for a run to proceed. (**DP-004**)
- When evidence appears, the runtime may run the fixed inner check set once more before the gate
  (the closing check), bounded by the inner caps. It is off when the micro-loop layer is off.
  (**DP-041**)

*Precedent and evidence.* Specstride `orchestrator.sh:13-15`, `proposer.sh:9-12` at `9cab15d`.
Decision 5. R3 (Claude Code has no detach API, so the mechanism is ours). R13 (viewer). R23 (closing
check).

#### II. Adversarial, Non-Self-Approving Gate (NON-NEGOTIABLE)

The author of evidence can never approve its own work.

- The critic binds each verdict to a nonce generated per call. A verdict is accepted only from a reply
  line carrying that nonce. Missing, duplicated, wrong-nonce or malformed verdicts fail safe: they
  count as rejected.
- The phase gate with the independent critic is the **only** source of a verdict. An inner check, a
  micro-loop result, a routing decision or a host model's judgment never approves anything, and the
  full verification gate always runs again before the critic.
- The critic never runs in the proposer's session and never approves its own session. It starts a
  fresh session every time.
- The critic sees the final check result for each unit of work. It does not see the history of
  repairs, retries and escalations.
- The critic prefers a different provider or model from the proposer. A same-model setup produces a
  warning and never blocks a run.
- An approval is a record written by the runtime, bound to the verdict that produced it, and kept
  where the proposer cannot write. Resume verifies the record; the presence of a file alone approves
  nothing. (**DP-010**)
- No model output may change workflow state directly. Models propose; the engine disposes.

*Precedent and evidence.* Specstride `lib/critic.py:11-15` at `9cab15d`. Decisions 7 and 21. R11 T-02
(`lib/specstride_spec.py:948-957`: resume trusts an empty marker file the proposer can write). R23.

#### III. Grounded, Read-Only, Injection-Proof Verification (NON-NEGOTIABLE)

The critic never trusts the prose of evidence and never executes anything the evidence contains.

- Before any model judgment the runtime builds a grounding snapshot of cited artifacts (existence,
  size, bounded excerpts, with globs expanded) and runs fixed-argv probes it controls. On conflict,
  disk beats prose. The model is never given a shell.
- Inner checks are deterministic commands, fixed before work starts, and run by the runtime, never by
  the proposer's own harness. Where the harness offers a sandbox, the proposer is prevented from
  changing a check or the tests it relies on; everywhere, a change is detected, and a check run
  against a changed set is recorded as tainted and never as passed. (**DP-040**)
- Text that originates outside the runtime is data, never instruction: repository content, evidence,
  the consumer's free-text comment, a harness descriptor, a project configuration file. A comment can
  narrow or steer a run; it cannot bypass a launch check, the terms gate or a budget.
- Project configuration may narrow a run but never widen it. (**DP-009**)
- A critic with read-only tools (Principle IX, exception) reads project files by itself. It is still
  given the grounding snapshot, and on conflict the snapshot and the disk beat prose.

*Precedent and evidence.* Specstride `lib/critic.py` grounding snapshot and harness probes; glob
expansion at `lib/critic.py:1390-1404` (R19). Decisions 18 and 21. R11 T-03, T-13. R23 IR-01 to IR-30.

#### IV. Single Source of Truth for Spec Grammar

All spec grammar lives behind one canonical model and one adapter registry: phase headings, acceptance
criteria, slicing, validation, resume derivation, format detection and hashing. A new spec format is a
new adapter, never a second parser. Every consumer reads the canonical model: engine, critic, contract
derivation, CLI, doctor and UI.

*Precedent and evidence.* Specstride `lib/specstride_spec.py` at `9cab15d`. R1v: Lisa's dashboard
keeps a second phase-heading parser (`packages/dashboard/src/run-tasks.ts:146-148`), which this
principle forbids in the new product.

#### V. Best-Effort Observability That Never Breaks the Loop

Everything that observes a run is best-effort: event forwarding, exporters, presenters, status views
and dashboards. A bad line, a full disk, a dead collector or a missing component must never stall or
fail a run. Missing components degrade to a plainer path. The local event file is written first and is
authoritative; remote delivery is isolated from it. Telemetry describes a run; it is never the
workflow's event bus.

*Precedent and evidence.* Specstride `lib/telemetry_delivery.py:31` at `9cab15d`. Lisa V. R14.

### Part B — The product and its edges

#### VI. Typed Core, Replaceable Edges, Installable With npm (NON-NEGOTIABLE)

*Replaces "Stdlib-Only, Clone-and-Run". The intent survives: a trustworthy, reproducible runtime with
no accidental dependency surface.*

- The product is strict TypeScript. Data is validated against a schema at every process, file,
  network and provider boundary.
- The core depends on no provider SDK, no UI framework and no host API. Hosts, harnesses, spec
  formats, loop strategies and UIs are replaceable adapters behind versioned interfaces. A new one
  must not require a change to the core. Every extension point has a version, a conformance suite
  and a sample implementation outside the core, and CI proves with them that the core does not name
  its implementations.
- Consumers install with npm. `npm install` on Linux and macOS must succeed with no compiler, no
  undocumented system requirement, and no path or account specific to the owner's machines.
- A component in another language, and any native module, needs an approved entry in the Language
  Ledger: the component, the language, the gain over TypeScript, the cost in portability and
  installation, and its interface to the TypeScript side. It ships prebuilt for Linux and macOS.
  Bash is allowed for thin shims only.
- Every dependency, and any code reused from Lisa, is compatible with MIT distribution. A
  proprietary SDK may be an optional dependency; it is never bundled.
- The CLI is fully functional without any host plugin.

*Evidence.* Decisions 1, 2, 12, 19. R2 and R17 (no non-TypeScript component proposed beyond a
launcher shim; `node-pty` and `fs-ext` would break plain installation). R1 (the Claude Agent SDK is
proprietary).

#### VII. One Open Harness Registry (NON-NEGOTIABLE)

*Replaces "One Backend Registry".*

- There is exactly one harness registry. It holds tested adapters, harnesses discovered through the
  generic descriptor-driven adapter, and entries the consumer declared. Help text, error messages,
  the doctor and documentation read the registry; a hand-copied list of harnesses is a violation.
- The registry is open. No requirement, check or control path may assume a closed list of harnesses.
- A harness without a tested adapter is marked unverified: it has no version pin, its capabilities
  are probed or declared, it runs at Tier 1 or Tier 2 only, and the doctor says so.
- Discovery reads nothing secret and changes nothing. It never changes the proposer and never
  overrides a critic the consumer configured.
- Differences between harnesses live in adapters and descriptors. Shared control flow never tests a
  harness name.

*Precedent and evidence.* Specstride `lib/backends.py` and `lib/test_backend_registry.py` at
`9cab15d`. Decision 17. R20.

#### VIII. Unattended, Hermetic Proposer Passes (NON-NEGOTIABLE)

A proposer pass runs with nobody watching and leaves the operator's environment as it found it.

- **Prompt on stdin, never argv**, wherever the harness accepts stdin. An adapter that can only take
  the prompt as an argument bounds the prompt size.
- **Never wait for a human.** No pass blocks on a permission prompt or an interactive login. A
  missing credential fails fast, before the first pass, naming what is missing. A run that is
  blocked on a human decision says so with a distinct signal; it does not loop.
- **The operator's configuration is never mutated.** At Tier 1 a pass uses the harness's own
  logged-in configuration, read-only, because a throwaway home has no login. At Tier 2 a pass uses a
  throwaway configuration home that is removed afterwards, even when the pass is killed. Credentials
  are never copied between homes. (**DP-012**)
- **Auto-loaded context is off by default**: plugins, hooks, skills, MCP servers and harness-native
  memory are not loaded into a pass unless the consumer opts in, and the setting is recorded per run.
  (**DP-017**)
- **Fresh session per attempt.** A new attempt always starts a fresh session, and so does every
  relaunch. Passes inside one attempt may continue the same session where the harness supports it;
  where it does not, context is carried through files. Session state lives no longer than its
  attempt. (**DP-036**, **DP-038**)
- **Contained by default.** A pass runs at the strongest containment level its harness offers. No
  containment is an explicit opt-in by the consumer. (**DP-008**, **DP-011**)

*Precedent and evidence.* Specstride `proposer.sh:366, 435, 456, 461, 1437` at `9cab15d`. Decisions 6
and 22. R5, R7 (a throwaway home loses the login on Claude, Gemini CLI and Copilot). R11 T-07. R24.

#### IX. The Critic Has No Tools and a Known Budget (NON-NEGOTIABLE)

- **No tools, by any route.** A critic path that can call tools is not shipped. The route is a means:
  a direct HTTP call to a provider or gateway, or a harness CLI started in a tool-less mode with the
  prompt on stdin. With a CLI, the adapter verifies from the harness's own initial record that the
  tool list is empty and the session is the one it minted, and treats any other result as a critic
  configuration error that halts the run.
- **A budgetable model.** The critic never runs on a model whose context window is not known up
  front. There is no default window for an unknown model.
- **Known budget.** The grounding budget comes from the window of the model actually used; an
  explicit setting by the consumer always wins.
- **Auth failures are named.** An auth error is reported as an auth error and names what to fix.
- **Exception: a critic with read-only tools.** Where a harness offers its critic mode as a
  read-only operating-system sandbox, the critic may hold read tools and run in the working tree.
  It cannot write, cannot run a command that writes, and cannot reach the network. Before it starts,
  the runtime moves the proposer's notebook, handoff and outbox out of the working tree and the
  sandbox denies reads of the workspace part, so the history of repairs stays withheld. The verdict
  is bound to the nonce as for any critic. (**DP-001**, owner rulings 57, 57a, D1)

*Precedent and evidence.* Specstride `lib/critic.py:129-209` at `9cab15d`. Decisions 6, 7, 17. R5
(the tool-less flag set), R3v (flags confirmed against the installed CLI), R20.

The v2 rule "direct HTTP first" is superseded: under Tier 1 the default critic path is a CLI
subprocess. This is a divergence register row.

#### X. Recorded Harness Versions

Every tested adapter pins a version range with a `verified-on` date. Each pass records the harness
version it ran. The doctor warns when the installed version is outside the range, and a version change
between passes of one run is surfaced as a warning. Nothing is downloaded to achieve a pin.

*Evidence.* Decision 10. R3v, R5 (a documented future change of the `-p` default would silently turn
Tier 1 into Tier 2, so the adapter always states its mode).

#### XI. Truthful Stream Telemetry

- Each harness stream is translated by one adapter behind a single seam into one versioned event
  schema.
- A compatibility projection renders the new events in the old vocabularies. On the parity oracle's
  fixtures the projection's output is byte-identical to the baseline's, after the oracle's documented
  normalization. Outside those fixtures no byte-identity is promised.
- A stream that ends without a terminal record yields `missing_terminal`; a pass that exits
  successfully having done nothing is flagged.
- Unknown values are `null`, never invented: no cost for a harness that reports none, no model name
  beyond what the invocation specified. Cost reported under a subscription is labelled notional.
  (**DP-030**)
- Prompt and response content is captured whenever traces are on, and the consumer can switch it
  off. It always passes the single redaction point, which fails closed. (**DP-029**, owner ruling 43)

*Precedent and evidence.* Specstride `lib/agent_stream.py`, `lib/stream_seam.py`,
`lib/test_telemetry_parity.py` at `9cab15d`. Decision 11. R14 (EV-01 to EV-34). R11 T-32, T-33.

#### XII. Verifiable Here, Lawful Everywhere (NON-NEGOTIABLE)

*Replaces "Build With What We Have".*

- **Local verification.** Tests use fake binaries, stub agents and recorded fixtures. No test and no
  CI job calls a paid or external model API.
- **No third party in the loop.** No gate or workflow requires another person's review, account or
  action.
- **Tiers.** Tier 1 runs the consumer's installed harness under the consumer's own login. Tier 2
  uses an official SDK or API key. Tier 3, reuse of a subscription token, is refused unless the
  provider's terms explicitly permit it and the terms data lists it; the list is empty at release.
- **The terms gate.** Terms data is versioned, dated, and kept for two audiences, personal use and a
  distributed product. Anything allowed for personal use only is off by default and marked as such.
  A provider with no terms row is treated as unknown terms: Tiers 1 and 2 only, with a doctor
  warning. (**DP-020**, **DP-042**)
- **Secrets by reference.** Secrets are stored only as `env:`, `file:` or keychain references and
  never appear in prompts, events, evidence, the digest or a UI.
- **Model ids are configuration**, never baked into a rule, test or gate.
- **Unavailable means deferred.** A capability that needs something that cannot be verified is
  recorded as deferred or unverified with the missing prerequisite named.

*Evidence.* Decisions 6, 8, 17, 19. R8 and R8v (no provider permits Tier 3; Tier 1 does not carry
over to a distributed product for three providers).

### Part C — The host skill (merged from mixture-of-loops)

#### XIII. Facts and Judgment Are Separated

Deterministic code records what is literally in the sources: files with their hashes, tasks, phases,
declared commands, prerequisites. The host model adds judgment, and every entry it adds carries
provenance. The model never writes a status: only validation promotes a launch contract, and a
launcher is rendered only from a promoted one. Sources are never modified; a validated launch contract
is frozen and content-hashed. Reverse-engineered claims carry kind, confidence, evidence,
contradictions and validation status, and as-is and to-be specifications are never conflated. A
routing or classification decision is made by a pure table and recorded with its rule id.

*Precedent and evidence.* mixture-of-loops `bootstrap_contract.py:343-377`, `contract_lib.py:969-977`
at `9c88f86`. Lisa VII and IX. R17 (the CLI inventories, the host judges bounded batches, **DP-023**).

#### XIV. Declared Verification Is Preserved, Never Invented

Verification commands come only from an existing verification declaration or from commands literally
declared in the plan or tasks. A conflict, or a command that cannot be expressed as fixed argv, becomes
a blocker and never a guess. A phase with no declared commands stays explicitly empty, and a unit of
work with no resolvable check is recorded as unchecked, never as rejected and never as passed.

*Precedent and evidence.* mixture-of-loops `bootstrap_contract.py:294-299` at `9c88f86`. R23, R25.

#### XV. Invocation Is Consent; Dry-Run Withholds It

*Rewords "Silence Is Never Consent to Execute".*

Invoking `specstride-run` is the consent to run: the skill derives and validates the launch contract
and launches. `dry-run` is the way to withhold consent: it derives and validates, reports what would
be launched, and stops. A request that does not invoke the skill launches nothing. An explicit mode
beats prose in the consumer's comment, and a refusal in the comment beats an invitation. No comment,
mode or setting bypasses a launch check, the terms gate or a budget.

*Precedent and evidence.* mixture-of-loops `supervisor_lib.py:114-208` at `9c88f86`. Decision 18.
This is an intended change with a divergence register row.

#### XVI. The Supervisor Only Reads, and Relaunches Only Classified Transients

Progress comes from run state, process liveness and logs, never from a model's narration.
Supervision in the host only reads. A relaunch happens only for a stop that the run's own records
classify as transient, within the declared budget; it is done by the runtime root, or by the
supervise command where the consumer configured that. Nothing removes a lock whose owner lives, and
nothing deletes a run directory. (**DP-072**, **DP-080**)
A pause for quota is not a stop and spends no budget of any kind. (**DP-028**) Counts and attempt
numbers survive a resume or relaunch unless the consumer resets them on purpose.

*Precedent and evidence.* mixture-of-loops `supervisor_lib.py:829-845, 962-1055` at `9c88f86`.
Decisions 8 and 23. R14. R21 (137 restarts, none automatic).

#### XVII. Missing Prerequisites Are Skips, Never Passes

Tests are tiered: hermetic, discovery and execution, live. Each tier runs on its own. A missing
prerequisite is reported as a skip with its reason, never as a pass. macOS behaviour that has not been
observed on macOS is marked unverified until a macOS runner has passed the oracle. (**DP-006**)

*Precedent and evidence.* mixture-of-loops `README.md:329-332`, `.github/workflows/ci.yml:56-63` at
`9c88f86`.

#### XX. Deterministic Parallelism

*Returns from Lisa's constitution (its Principle VIII), because parallel units enter Wave 1 as an
option (owner ruling 56).*

Work runs in parallel only after deterministic checks of dependency and of write scopes. A claim that
two units can run together is a claim: without declared, disjoint write scopes the units run one after
the other. Every decision to run in parallel is recorded with its reason. After every parallel group
an integration step and a deterministic merge check run on the merged tree, and the full verification
gate runs on it before the critic sees anything. No model merges conflicting work silently. Parallel
work never produces a verdict, never spends an outer counter, and adds no exit code and no stop
reason. The rules for several workers come from R29 and its red team.

### Part D — The rewrite

#### XVIII. Parity Before Capability (NON-NEGOTIABLE)

The Python implementations at their baseline commits are the reference for behaviour. The differential
oracle runs them and the TypeScript product on the same fixtures with scripted stub agents and compares
normalized artifacts, events, verdicts, exit codes and output lines. A release is blocked until every
parity test passes.

- Every as-is requirement and behaviour item has exactly one disposition.
- An intended difference is a row in the divergence register with the owner's ruling. It is never
  discovered as a test failure.
- Documented defects and accidental behaviours are preserved unless a register row fixes them.
- The oracle runs with the micro-loop layer off, session continuation off, and counts mapped. A
  second suite runs every fixture with the layer on and stub agents that never complete a unit of
  work; its output is identical apart from fields the register names.
- The source repositories are never modified.
- Lisa behaviours that are kept get characterization tests.

*Evidence.* Decisions 3, 4, 21, 22, 23. Lisa X. R18, R19.

#### XIX. Context Is Budgeted

Every host skill has a token budget that covers its instructions, references loaded on demand,
resident tool schemas, the output of every command it invokes, and one full supervision cycle. CI
measures the budgets without paid calls. Command output is terse by default; verbose output is opt-in.
The host model never needs to read product source to operate Specstride.

*Evidence.* Decision 16. R17 (today's skill carries about 20k tokens of mandatory instructions; 801
polls in the reference run, 98 % unchanged; budgets and the byte-based gate, **DP-024**).

---

## 4. Additional constraints

| Constraint | v2.0.3 | v3.0.0 |
|---|---|---|
| Language and runtime | Bash and Python 3 standard library, no build step | TypeScript (strict) on Node.js LTS. Other languages only through the Language Ledger |
| Platforms | Linux (implicit) | Linux and macOS are first-class. Windows and WSL are recorded as unvalidated |
| External harness binaries | Located through `SPECSTRIDE_<BACKEND>_BIN` | Located by the adapter or descriptor. Specstride never installs, vendors or downloads a harness |
| State | `.specstride/features/<slug>/`, with a legacy fallback | One layout with three roots, defined by feature 100: user-level state, a control plane per workspace outside the working tree, and a workspace part. Old `.specstride/`, `.lisa/` and `.mixture-of-loops/` state is not read (decision 3). Legacy fallbacks are superseded |
| Exit codes | One table: 0, 1, 2, 3, 4, 5, 6 | A per-process table, in `consolidation.md`. Codes are part of the interface. Micro-loops add no exit code and no stop reason |
| Stop reasons | Matched by string in mixture-of-loops | A closed, versioned enumeration, part of the interface |
| Single run per workspace | Kernel lock with a directory fallback | One run per workspace, through the lock and liveness interface: exactly one winner among contenders, a lock never exists without an owner record, a dead owner is reclaimable and a foreign owner is not. The mechanism belongs to the feature (**DP-005**) |
| Config precedence | Several layers | Flag > env > project `specstride.yaml` > user config > detected default, with per-phase overrides (decision 9). Project configuration narrows only |
| Licence | Apache-2.0 | MIT (decision 19, **DP-015**) |
| Skill source | One canonical skill directory | One skill source per skill; host plugins are thin layers over the npm package |

## 5. Development workflow and quality gates

- Every code path degrades instead of failing: a failing proposer pass must not kill the run.
- Tests are required for every feature. Parity tests and characterization tests are required tasks.
- Every harness adapter has a test that runs it against a fake binary and asserts argv, stdin,
  environment and clean-up; stream adapters are tested by replaying a recorded fixture.
- A fact about a provider or host carries a `verified-on` date and a version pin.
- Code outranks prose **within the baseline**: where an as-is spec and the baseline code disagree,
  the code is what parity means. For new capability, this constitution and the specs are
  authoritative.

## 6. Governance

All principles in v3.0.0 are **prescriptive**. v2.0.3 was mixed, with I–VI descriptive; there is no
TypeScript code for them to describe, so they bind the implementation, and the baseline code is cited
as precedent.

- A feature plan's Constitution Check is evaluated against every principle.
- A deviation from a non-negotiable principle is recorded in the plan's Complexity Tracking table
  with its justification, or the plan is rejected. Principles II, III and XVIII cannot be justified
  away.
- Once code enforces a principle, its rationale is rewritten to cite that code.
- Amendments are made by the owner. No outside sign-off is required.
- Versioning: MAJOR for removing or redefining a principle; MINOR for adding a principle or section;
  PATCH for wording and citations.

## 7. The plan template's Constitution Check

`.specify/templates/plan-template.md` is rewritten with the amendment. Proposed text:

```markdown
## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Answer each gate ✅ / ❌ / N/A with a one-line reason. Every ❌ needs a row in
*Complexity Tracking*. See `.specify/memory/constitution.md` (v3.0.0).

**The gate and the loop (I–V)**

- [ ] I. Coordination is through files only; writes are atomic; nothing a run depends on is a
      watcher or service; host and detached runtime share files only
- [ ] II. Only the phase gate produces a verdict, nonce-bound, fail-safe; no inner check, router or
      host judgment approves; approval is a verified record outside the proposer's write scope
- [ ] III. The critic is grounded and read-only; inner checks are deterministic, fixed up front and
      run by the runtime; outside text is data; project config narrows only
- [ ] IV. No spec grammar outside the single grammar module
- [ ] V. Observability code is best-effort and cannot break a run

**The product and its edges (VI–XII)**

- [ ] VI. Strict TypeScript; schema-validated boundaries; core free of provider, host and UI
      dependencies; plain `npm install` on Linux and macOS; no native module or other language
      without a Language Ledger entry; MIT-compatible dependencies; the feature names the extension
      points it implements or consumes, with versions
- [ ] VII. Harnesses come from the one open registry; no closed list; no harness-name test in shared
      control flow; unverified harnesses at Tier 1–2 only
- [ ] VIII. Prompt on stdin · never waits for a human · operator config never mutated ·
      auto-loaded context off · fresh session per attempt · contained by default
- [ ] IX. Critic has no tools by any route, verified from the harness's initial record, or read-only
      tools in a sandbox with the proposer's files hidden · known context window · named auth errors
- [ ] X. Tested adapters pin a version range with `verified-on`; passes record the version
- [ ] XI. One event schema behind one seam · compatibility projection byte-identical on oracle
      fixtures · `missing_terminal` · unknowns are `null` · content passes the redaction point
- [ ] XII. Tests call no paid API · tiers and the terms gate respected for both audiences ·
      secrets by reference only · model ids are configuration

**The host skill (XIII–XVII, for features that touch a host skill, the contract or supervision)**

- [ ] XIII. Deterministic code records facts; the model adds judgment with provenance; only
      validation promotes
- [ ] XIV. Verification commands are declared, never invented; no check means unchecked
- [ ] XV. Invocation is consent; `dry-run` withholds it; nothing bypasses a launch check, the terms
      gate or a budget
- [ ] XVI. The supervisor only reads; relaunch only for classified transients within budget; a
      quota pause spends no budget; counts survive a resume
- [ ] XVII. A missing prerequisite is a skip with its reason
- [ ] XX. (features that run work in parallel) Parallel only with declared, disjoint write scopes;
      decisions recorded; a deterministic merge check and the full gate on the merged tree before the
      critic

**The rewrite (XVIII–XIX)**

- [ ] XVIII. Every carried behaviour cites its origin, disposition and proving test; intended
      differences have a divergence register row; micro-loops and continuation are off under the
      oracle
- [ ] XIX. Host-facing output is terse; the feature's share of the token budget is stated and
      measured in CI
```

The template's Technical Context examples are also changed from Python to TypeScript on Node.js LTS.

## 8. Open points that change this text

| Pending decision | Principle affected | If ruled against the default |
|---|---|---|
| DP-004 read-only viewer | I | The viewer sentence is removed and Wave 2 has no local web viewer |
| DP-041 closing check | I | The closing-check sentence is removed |
| DP-010 approval record | II | The approval-record bullet is removed; the forgery path is recorded as accepted risk |
| DP-040 detect versus prevent | III | "Prevented" becomes mandatory and the micro-loop default is limited to sandboxed harnesses |
| DP-009 project config narrows only | III | A per-repository trust step is added to XV |
| DP-012, DP-017, DP-036, DP-038 | VIII | The matching bullet changes |
| DP-008, DP-011 containment | VIII | "Contained by default" becomes "containment is opt-in" |
| DP-029, DP-030 | XI | The matching bullet changes |
| DP-020, DP-042 tiers and audiences | XII | The terms-gate bullet changes |
| DP-028 quota pause | XVI | A pause becomes a stop with its own reason |
| DP-005 lock | constraints | A native lock module enters the Language Ledger |
| DP-070 engine as a child process | I | "One detached process tree" becomes "one detached process" |
| DP-071 control plane outside the working tree | I, constraints | The sentence is removed; protection of control files then depends on a rule per harness sandbox |
| DP-072, DP-080 who relaunches | XVI | If relaunch stays in the host only, the principle returns to the recovered wording and automatic relaunch holds only while a host session supervises |

Revised on 2026-09-29 after R15, R15v, R16, R18, R23v and R27: Principles I, VI, XIII and XVI, two
constraints and the plan template's gate VI changed as R15 A-10 proposed, with XVI adjusted for the
red team's finding that the relaunch classifier cannot move into the runtime root unchanged.
