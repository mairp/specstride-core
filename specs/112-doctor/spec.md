# Feature Specification: Doctor

**Feature Branch**: `112-doctor` (a label: Spec Kit creates no branch in this repository; the directory is `specs/112-doctor`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 112-doctor of Specstride: the doctor as a registry of checks (EP-14). The form of a check, severities, the launch-blocking flag, order, injected probes, message and fix hint; the ground rules (read-only, no paid call, no secret read, bounded, advisory); the catalogue of checks; the launch checks as exactly the launch-blocking subset; output in text and `--json`; flags; exit codes; the entry points on the CLI and on every host; the invariants of gate integrity checked on a run's event log."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority), `architecture.md` (sections 5, 6, 9, 17), `feature-briefs.md` (brief 112-doctor), `STAGE-B-RULES.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182), `research/R16-doctor-config.md`, `R20`, `R11`, `R8v`, `R14`, `R3v`, `R23v`, `R27`, and feature 100 (`specs/100-specstride/`, annex G §G.7 first).

## What this feature is

The doctor tells a consumer, before or after a run, whether the set-up is sound. It is one function that runs registered checks, and it has three exposures: the command `specstride doctor`, the host skill in Claude Code, and the equivalent skill of the dsh host in Wave 2. It reads and never writes. It calls no model. It never blocks a run by being unhealthy. A launch runs exactly the subset of its checks that carry the launch-blocking flag, so the doctor and a launch cannot disagree.

Feature 112 owns extension point EP-14, the core catalogue of checks, and the schema of the findings. Other packages register their own checks through the same registry.

**In scope**: the registry and the form of a check; severities; the launch-blocking flag; order; injected probes; message and fix hint; the ground rules; the core catalogue; the launch preflight as the launch-blocking subset; text and `--json` output; flags; exit codes; the entry points; the invariants of gate integrity checked on the event log of a run.

**Out of scope**:

| Out of scope | Owner |
|---|---|
| The checks that a package registers for itself: a harness adapter's executable, login and version probes; a host's `host.*` probes; the toolchain check of the content owner of EP-16 | The harness seam and the harness adapters; the host package; the package for the integrity of checks; parallel units; the pipeline runtime. They register through this feature's registry, and the code of each check lives in the package of its owner (F112-FR-033) |
| Running the launch checks at launch | The pipeline runtime and supervisor (contract: annex F §F.3) |
| The host skill that exposes the doctor in Claude Code | The host package for Claude Code (contract: annex H §H.1) |
| `--fix` | Not in Wave 1. The doctor writes nothing |
| The web viewer's endpoint | The check `ui.endpoint` is in the catalogue and reports "not running" until a viewer exists |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A consumer asks whether Specstride is set up (Priority: P1)

A consumer runs `specstride doctor` before a first run, or after a failed launch. A healthy set-up prints one short line. An unhealthy one prints the failing items only, each with what to do, and exits with a code a script can read.

**Why this priority**: It is the first thing a new consumer runs, and the output goes into a host session where every byte costs context.

**Independent Test**: Run the doctor on a healthy fixture and on a fixture with several `fail` findings. Count bytes and lines, and read the exit code.

**Acceptance Scenarios**:

1. **Given** a healthy set-up, **When** the doctor runs, **Then** it prints one line and exits 0 (F112-FR-023, F112-FR-027).
2. **Given** ten `fail` findings, **When** the doctor runs, **Then** it prints a header, at most 7 finding lines of at most 200 bytes each, a footer that says how many more exist, and exits 2 (F112-FR-024, F112-FR-027).
3. **Given** an unknown flag, **When** the doctor runs, **Then** it exits 3 and prints one usage line (F112-FR-026).
4. **Given** a Claude-only set-up, **When** the doctor runs, **Then** the critic-diversity warning is shown and the exit code is 0 (F112-FR-031).

---

### User Story 2 - The doctor and the launch agree (Priority: P1)

A consumer sees a launch refused and runs the doctor. The doctor names the same cause. A consumer sees the doctor pass and the launch is never refused for a doctor-visible cause.

**Why this priority**: Two code paths that judge the same set-up drift apart, and a consumer then trusts neither.

**Independent Test**: For each fixture of the test set, run the doctor and a launch with stub agents. The launch refuses exactly when the doctor reports a `fail` finding of a launch-blocking check.

**Acceptance Scenarios**:

1. **Given** a fixture with an inline secret in user configuration, **When** the doctor and the launch run, **Then** both name `secret.inline`, and the launch is refused (F112-FR-030).
2. **Given** a fixture whose only `fail` finding is not launch-blocking, **When** a launch runs, **Then** it is not refused (F112-FR-030).
3. **Given** a check registered from the test tree with the launch-blocking flag, **When** it returns `fail`, **Then** the launch is refused and no core file has changed (F112-FR-001, F112-FR-002).

---

### User Story 3 - A package adds a check without touching the core (Priority: P1)

The author of a harness adapter, a host package or a loop layer registers a check. It appears in the text and in `--json` output with its id, severity and fix.

**Why this priority**: The owner wants evolvability, and a sample outside the core is its proof (F100-FR-018).

**Independent Test**: Register a sample check from the test tree, run the doctor with `--json`, remove the sample, and compare the core files: none differs.

**Acceptance Scenarios**:

1. **Given** a sample check, **When** the doctor runs with `--json`, **Then** the finding is in the output (F112-FR-002).
2. **Given** a check that throws, **When** the doctor runs, **Then** the doctor exits 1 and no run is affected (F112-FR-008).
3. **Given** a check whose probe does not end in its time limit, **When** the doctor runs, **Then** its finding is a warning `probe timed out` (F112-FR-007).

---

### User Story 4 - A harness without a tested harness adapter is shown as unverified (Priority: P2)

A consumer declares a harness by descriptor. The doctor lists it with the state `unverified` and says what would verify it.

**Why this priority**: The product has no closed list of harnesses; the doctor is where a consumer sees the difference between tested and declared.

**Independent Test**: On the descriptor-only fixture (a descriptor for a fake CLI and one for a fake endpoint), the output names each harness with state `unverified`.

**Acceptance Scenarios**:

1. **Given** the descriptor-only fixture, **When** the doctor runs, **Then** each harness is named with the state `unverified` (F112-FR-013).
2. **Given** an unverified harness selected for a role, **When** the doctor runs, **Then** `harness.state.<id>` is a warning (F112-FR-013).
3. **Given** a discovered harness that no requirement names, **When** the doctor lists harnesses, **Then** the list comes from the resolved registry (F112-FR-009).

---

### User Story 5 - The doctor is safe to run anywhere (Priority: P2)

A consumer runs the doctor in a repository they just cloned, on a machine with credentials. The doctor changes nothing, reads no secret and calls no model.

**Why this priority**: A diagnostic that changes state or leaks a secret is worse than none.

**Independent Test**: Trace file access during a run over all fixtures. Compare workspace, control plane and user-level state byte for byte before and after.

**Acceptance Scenarios**:

1. **Given** any fixture, **When** the doctor runs, **Then** state is byte-identical afterwards and no credential store was opened (F112-FR-004, F112-FR-006).
2. **Given** a project configuration file that is hostile, **When** the doctor reads it, **Then** nothing in it is executed (F112-FR-010).
3. **Given** a planted canary secret, **When** the doctor runs in text and `--json`, **Then** the canary appears nowhere (F112-FR-025).

---

### User Story 6 - The doctor is reachable on every host (Priority: P3)

A consumer in Claude Code invokes the doctor skill and receives the relayed result within the skill's token budget.

**Why this priority**: Decision 14 puts the doctor on every host; the budget is a constitutional rule (Principle XIX).

**Independent Test**: Measure the bytes of the worst-case and healthy outputs against the budget of the doctor skill.

**Acceptance Scenarios**:

1. **Given** the worst case, **When** output and skill body are measured, **Then** together they stay inside 1,500 tokens at 2.8 bytes per token (F112-FR-024).
2. **Given** a host, **When** it calls `renderEntry` for `doctor`, **Then** the same engine function runs (F112-FR-028).

---

### Edge Cases

- A check id in a filter that no check has: usage error, exit 3 (F112-FR-026).
- A severity from a newer doctor that a reader does not know: read as `warn` (F112-FR-008).
- A keychain reference on Linux: the existence result is `unprobed`, never a guess (F112-FR-006).
- A probe that hangs, or prints more than the cap: the finding is a warning, the process is ended (F112-FR-007).
- A run with no event of a kind that an invariant needs: `info`, never `fail` (F112-FR-032).
- A working directory that does not exist: the doctor could not run, exit 1 (F112-FR-027).
- A check registered with a group outside the closed set: refused at registration (F112-FR-002).
- Windows or WSL: reported as unvalidated, as a warning, never a failure (F112-FR-011).

## Requirements *(mandatory)*

### Functional Requirements

Test names `CT-112-<100 + n>` are new; `CT-112-1` and `CT-112-2` are the two characterization tests of the brief. No requirement of this feature has an as-is origin: Specstride has no doctor, mixture-of-loops has none, and Lisa's has no requirement in its specification.

#### G1 Registry, check form, ground rules

- **F112-FR-001**: The doctor MUST be a registry of checks. A check MUST have a stable dotted id, a severity rule, the flag `lb` (launch-blocking), an order, a probe that receives injected probes, a message template of at most 200 bytes, and a fix hint. A check MUST return findings with id, severity, `lb`, message, fix and redacted evidence. Probes (the clock, the file system, subprocesses, the network, the resolved registry, the resolved configuration, the records of a run) MUST be injected, so that the same check runs on a fixture without the real machine.
  - test: CT-112-1
  - ep: EP-14 `specstride.doctor/1` (implements)
  - status: unverified (check: the finding model is extracted from the doctor of Lisa at its baseline and characterized by CT-112-1; verified-on: —; pin: Lisa `363e6a3`)
- **F112-FR-002**: Every package MUST register its checks through the registry, at process start, and the registry MUST be read-only after launch. A check MUST belong to one of 19 groups: `env`, `cli`, `host`, `bin`, `harness`, `auth`, `model`, `critic`, `terms`, `quota`, `budget`, `config`, `secret`, `run`, `sandbox`, `ui`, `telemetry`, `events`, `memory`. A check with another group, or with an id already registered, MUST be refused at registration. Ids MUST never be renamed. Registering or removing a check MUST change no core file.
  - test: CT-112-102
  - ep: EP-14 `specstride.doctor/1` (implements)
- **F112-FR-003**: Checks MUST run in their declared order; the checks with the flag `lb` MUST have a fixed order. Findings in output MUST be ordered by severity (`fail`, `warn`, `info`, `ok`) and then by id, so that two runs on one state print the same text.
  - test: CT-112-103
  - ep: EP-14 `specstride.doctor/1` (implements)
- **F112-FR-004**: The doctor MUST read and MUST NOT write. It MUST write no state, no configuration and no file, and it MUST have no `--fix` in Wave 1. Every finding that has a remedy MUST print the fix as text and MUST NOT carry it out. A fix that installs software MUST be printed and never run.
  - test: CT-112-104
  - ep: EP-14 `specstride.doctor/1` (implements)
- **F112-FR-005**: The doctor MUST make no paid call and MUST invoke no model. A check MAY run only: a search for an executable, the harness's own version command, the harness's own status command that changes nothing, a probe argument list that a descriptor declares, reading a file's metadata, and a free GET request to a model-list endpoint. A GET MUST refuse redirects, MUST go only to the host the credential was declared for, MUST never store or log the credential. A health path that makes real model calls MUST never be requested.
  - test: CT-112-105
  - divergence: DV-041
  - ep: EP-14 `specstride.doctor/1` (implements)
  - status: unverified (check: the status commands of the tested harness adapters change nothing and make no paid call; captured by each adapter's conformance run; verified-on: —; pin: harness versions of the capture)
- **F112-FR-006**: The doctor MUST NOT read a secret value. The existence of an `env:` reference is the presence of the variable; of a `file:` reference, its metadata only (existence, mode, owner, location); of a `keychain:` reference, the existence result of the secret resolver where its query prints nothing, and `unprobed` otherwise. Credential stores of harnesses MUST never be opened. On Linux the existence of a keychain reference MUST read `unprobed`.
  - test: CT-112-106
  - ep: EP-10 `specstride.secret-resolver/1` (consumes)
  - status: unverified (check: a keychain existence query that prints no value, on Linux and on macOS; verified-on: —; pin: —)
- **F112-FR-007**: Every subprocess of a check MUST have standard input closed, a time limit (default 5 seconds), and output capped (default 64 KiB); probes MUST run in parallel. A probe that exceeds its limit MUST give a warning with the message `probe timed out` and MUST never raise the exit code above that of a warning. `--quick` MUST skip every check that needs a subprocess or the network. A model-list request MUST have its own limit (default 3 seconds).
  - test: CT-112-107
  - parity: not used (row 61 of annex X §X.7: `doctor.probeTimeoutSec`, `doctor.probeOutputBytes`)
  - ep: EP-14 `specstride.doctor/1` (implements)
- **F112-FR-008**: The doctor MUST be advisory and MUST never block a run by being unhealthy. A check that throws MUST make the doctor exit 1 and MUST do nothing to a run. Severities MUST be the closed set `ok`, `info`, `warn`, `fail`; a severity that a reader does not know MUST be read as `warn`.
  - test: CT-112-108
  - ep: EP-14 `specstride.doctor/1` (implements)
- **F112-FR-009**: No check MUST enumerate harnesses by name. Every per-harness entry (`bin.<id>`, `harness.state.<id>`, `harness.version.<id>`, `harness.caps.<id>`, `auth.<id>.<role>`) MUST be produced from the resolved registry, which holds tested harness adapters, discovered harnesses and harnesses the consumer declared.
  - test: CT-112-109
  - ep: EP-02 `specstride.harness/1` (consumes)
- **F112-FR-010**: Project configuration and any other file of the working tree that a check reads MUST be treated as untrusted input: it MUST be parsed by a loader that runs no code, resolves no custom tags and has a size cap, and nothing in it MUST be executed. The doctor MUST read project configuration for diagnosis without a trust prompt.
  - test: CT-112-110
  - ep: EP-14 `specstride.doctor/1` (implements)

#### G2 The catalogue

The core catalogue is in `contracts/check-catalogue.tsv` (id, group, who supplies the probe, severity rule, `lb`, message template, fix hint). It holds the 44 checks of the research and one more for the invariants of gate integrity (F112-FR-032), 45 rows. The table gives the id, the severities a check can return, and the flag. A check whose probe needs knowledge of one harness adapter or one host has its probe supplied by that package, through the registry; the id, the severity rule, the flag, the message and the fix stay with this feature.

| Group | Checks (id: severities) |
|---|---|
| `env` | `env.node`: fail, warn, ok. `env.os`: warn, info, ok. `env.git`: warn, ok. `env.stateDirPerms`: warn, ok. `env.tmpWritable`: fail, warn, ok |
| `cli` | `cli.version`: fail, warn, ok |
| `host` | `host.plugin`: info. `host.claudeFloor`: warn, ok. `host.managedSettings`: info, warn. `host.bgIsolation`: warn, ok |
| `bin` | `bin.<id>` (`lb`): fail, info, ok |
| `harness` | `harness.discovered`: info. `harness.state.<id>`: warn, info. `harness.version.<id>`: warn, info. `harness.caps.<id>`: warn, ok. `harness.denylist.<id>`: warn, ok |
| `auth` | `auth.<id>.<role>` (`lb`): fail, info, ok. `auth.tier.<role>`: warn, info |
| `model` | `model.reach.<role>` (`lb`): fail, info, ok. `model.window.<role>`: warn, ok |
| `critic` | `critic.diversity`: warn, info, ok. `critic.independence` (`lb`): fail, warn, ok. `critic.autopick`: info |
| `terms` | `terms.gate` (`lb`): fail, warn, info. `terms.stale`: warn, ok. `terms.audience`: info |
| `quota` | `quota.state.<role>`: fail, warn, info. `quota.shared`: info |
| `budget` | `budget.caps` (`lb` only for an automatically picked metered critic): fail, warn, info |
| `config` | `config.schema` (`lb`): fail, ok. `config.precedence`: warn, info. `config.projectWiden`: warn, ok. `config.legacy`: info |
| `secret` | `secret.inline` (`lb`): fail, ok. `secret.file` (`lb`): fail, warn, ok. `secret.envLeak`: info |
| `run` | `run.lock`: fail, warn, info. `run.stale`: warn, ok |
| `sandbox` | `sandbox.level`: fail, warn, ok. `sandbox.critic` (`lb`): fail, ok |
| `ui` | `ui.endpoint`: fail, warn, info |
| `telemetry` | `telemetry.endpoint`: warn, info |
| `events` | `events.schema`: warn, ok. `events.gateIntegrity`: fail, info, ok |
| `memory` | `memory.native`: warn, info |

- **F112-FR-011**: The checks of groups `env` and `cli` MUST report: the runtime version against the floor; the platform (Linux and macOS as supported, Windows and WSL as unvalidated, a warning); the presence of the platform tools outside the package registry (git, the process listing tools, the keychain tool), each probed, none required for a run to start except git where commits are on; the permissions of state directories and files (owner only); whether the control root is writable and has free space; and the protocol integer of the CLI against the range the calling host package supports. `cli.version` MUST also warn when the engine starts of a run carry different product versions. Every statement about macOS MUST be marked unverified.
  - test: CT-112-111
  - divergence: DV-071
  - status: unverified (check: the platform probes on a macOS runner; verified-on: —; pin: macOS version of the runner)
- **F112-FR-012**: The checks of group `host` MUST identify the calling host and the host package, compare the host's version with the floor of the features used, and report managed settings of the host and background isolation by the existence of files and by non-secret settings only, never their contents. The probes are supplied by the host package; the ids, severities, messages and fixes are the catalogue's.
  - test: CT-112-112
  - status: unverified (check: the locations of managed settings and the host floors are taken from documentation and captured on a live host; macOS and Windows locations are recalled; verified-on: —; pin: host version of the capture)
- **F112-FR-013**: `harness.discovered` MUST list the resolved registry. `harness.state.<id>` MUST show the state of each harness (`tested`, `locally-verified`, `declared`, `detected`) and MUST call every harness that is not `tested` `unverified`, with what would verify it; it MUST be a warning when an unverified harness is selected for a role. `harness.version.<id>` MUST warn when the installed version is outside the tested range and MUST inform when it is inside, and when the date `verified-on` is older than the configured number of days. `harness.caps.<id>` MUST warn when a declared and a probed capability differ.
  - test: CT-112-113
  - ep: EP-02 `specstride.harness/1` (consumes)
  - parity: not used; the configuration key `doctor.staleAfterDays` has the default 90 (row 61 of annex X §X.7)
  - status: unverified (check: the version range and `verified-on` of each tested harness adapter, from its own conformance run; verified-on: —; pin: harness versions of the capture)
- **F112-FR-014**: `auth.<id>.<role>` MUST report whether the credential of a role in use is present, with the status command of the harness at auth tier 1 and the presence of the secret reference at auth tier 2, and `unprobed` where no way exists; it MUST fail when a role in use has no credential. `auth.tier.<role>` MUST show the auth tier and the billing mode in effect, and MUST warn loudly when an API key is in effect. `model.reach.<role>` MUST fail when the configured model is not served, using a free model list where the harness has one and reporting `unprobed` otherwise. `model.window.<role>` MUST warn when the context window is unknown and the harness could be a critic candidate. An account identifier MUST never be printed.
  - test: CT-112-114
  - ep: EP-10 `specstride.secret-resolver/1` (consumes)
  - status: unverified (check: the status commands and the model lists of the tested harness adapters; verified-on: —; pin: harness versions of the capture)
- **F112-FR-015**: `critic.diversity` MUST show the critic-diversity warning of F100-FR-024 and MUST state no trigger of its own: it reads the result of the diversity test (row 183 of annex X §X.6) and the field `criticPick` of the resolved registry. It MUST warn for the results `same-model` (the critic and the proposer resolve to the same model) and `unverified`, MUST inform for the result `same-provider`, and MUST be `ok` for the result `diverse`. A shared model tier MUST give no finding of its own: two different models of one model tier are `diverse`, or `same-provider` where the provider is shared. A result that the doctor does not know MUST be read as `unverified`, with the warning. The check MUST never be `fail` and never `lb`. `critic.independence` MUST warn when the critic can call tools and MUST fail when a critic path carries a flag that allows all tools. `critic.autopick` MUST show the pick that would be made and why each other candidate lost, by reading the resolved role plan.
  - test: CT-112-115
  - ep: EP-02 `specstride.harness/1` (consumes)
  - parity: the check is not run by the oracle; the line of the warning is not printed under `parity` (rows 19 and 92 of annex X §X.7, not this feature's)
- **F112-FR-016**: `terms.gate` MUST evaluate the provider, auth tier and audience against the terms data through the terms gate, and MUST fail when the row is `refused`, warn when it is `conditional`, `personal-only` in the audience `distributed`, or unknown (no row), and inform when it is `allowed`. `terms.stale` MUST warn when the terms data is older than 30 days. `terms.audience` MUST show the audience in force and where it was set. A harness with unknown terms that the consumer named MUST show the unknown-terms warning.
  - test: CT-112-116
  - divergence: DV-048
  - ep: EP-11 `specstride.terms/1` (consumes)
- **F112-FR-017**: `quota.state.<role>` MUST show the last observed quota or pause state from the records of the run, without a probe: a warning near a threshold or in a pause, a failure when the run is blocked on credit. `quota.shared` MUST say when a detached run and the host session share one auth tier 1 window. `budget.caps` MUST show the caps in force per role and per run and the billing mode, MUST warn when an API key has no cap, and MUST fail when an automatically picked critic on a metered endpoint has no hard cap. Where a harness's spend cannot be measured the finding MUST say so.
  - test: CT-112-117
  - ep: EP-09 `specstride.view/1` (consumes)
- **F112-FR-018**: The checks of groups `config` and `secret` MUST validate every configuration layer against the schema of the config envelope (an unknown key and an inline secret are `fail`); MUST show which layer supplied each effective key where it matters (a shadowed value, a pin of the launch contract); MUST warn for each widening key set in project configuration (the key is ignored); MUST report input of the three as-is systems that is not read; MUST fail when a `file:` reference lies inside the workspace and warn when it is readable by others; and MUST show that children receive only the variables their harness declares. A finding MUST show the path and the key name of an inline secret and at most four characters of its value.
  - test: CT-112-118
  - divergence: DV-068
  - ep: EP-14 `specstride.doctor/1` (implements)
- **F112-FR-019**: `run.lock` MUST show the lock through the probe of the lock provider (`free`, `held-live`, `held-foreign`, `stale-owner-dead`, `owner-dead-group-alive`, `unknown`) and MUST warn for a lock without a live holder. `run.stale` MUST warn for a run that reads as running without a live owner, and for an approval record that does not verify. `sandbox.level` MUST show the containment level per role and why, MUST warn at C0 or C1 by the consumer's choice, and MUST say `protection=detect` where a process of a pass cannot be guaranteed gone. `sandbox.critic` MUST fail when the critic path allows all tools or holds tools outside the two forms of the `completion` level.
  - test: CT-112-119
  - ep: EP-13 `specstride.lock/1` (consumes)
  - status: unverified (check: the lock probe and the process start-time reading on macOS; verified-on: —; pin: —)
- **F112-FR-020**: `ui.endpoint` MUST report "not running" while no viewer exists and MUST fail if a listener that the product opened is bound outside the loopback address. `telemetry.endpoint` MUST show the collector and whether content capture is on, MUST never be `fail`, and MUST warn when content capture is on. `events.schema` MUST warn when a reader or a record of the control plane meets a major outside its range. `memory.native` MUST warn when harness-native memory is on for the critic and inform for the proposer.
  - test: CT-112-120
- **F112-FR-021**: The doctor MUST show the toolchains that a run detected and which of them have a pattern set, and MUST say that a toolchain without a profile has the basic protection only. The check is registered by the content owner of EP-16 (the package for the integrity of checks), and its code lives in that package, not in the package of the doctor (F112-FR-033); this feature fixes that its finding appears in text and in `--json`.
  - test: CT-112-121
  - ep: EP-16 `specstride.toolchain/1` (consumes)
- **F112-FR-022**: The checks that the rulings register MUST each be registered by their owning feature through the registry and MUST NOT be in the core catalogue: the coverage of a critic's deny list; the read denial of a critic with read-only tools; the presence of the optional dependency of an optional transport; the parallel plan, the containment reason and `worker-caches`; the version of the pattern set of the redactor; processes that hold a run token. A registered check MUST follow F112-FR-001 to F112-FR-008.
  - test: CT-112-122
  - ep: EP-14 `specstride.doctor/1` (implements)
- **F112-FR-033**: The code of a check MUST live in the package of the feature that registers it. The package of the doctor MUST hold the registry, the runner, the renderers and the checks whose probe the catalogue marks `core`, and MUST hold no file of a check that another feature registers. An owner MUST register through the registration call of the kernel package (F100-FR-234; annex G §G.7), so that it does not import the doctor, and the doctor MUST NOT import the package of an owner. For a row of the core catalogue whose probe another package supplies, the id, the severity rule, the flag, the message and the fix MUST stay data of this feature, and the probe MUST live in the package that supplies it. The doctor MUST render every registered check in text and in `--json` by the same rules as a core check, and MUST decide nothing about what such a check tests. This holds among others for: the toolchain check (the content owner of EP-16); a check for each customisation of a harness that cannot be switched off, and for a native memory that cannot be switched off (the harness adapter that has the customisation); and a check for the presence of the terminal tool `script` where a stage of a pipeline needs it (the pipeline runtime). This feature specifies none of these checks; it renders what is registered.
  - test: CT-112-133
  - ep: EP-14 `specstride.doctor/1` (implements)
  - assumption: CQ-189 (that a harness may be a proposer with customisations that cannot be switched off, warned by the doctor; the check is the adapter's)

#### G3 Output, flags, exit codes, entry points

- **F112-FR-023**: A healthy doctor MUST print exactly one line of at most 200 bytes (about 100 bytes as designed) that names the host, the audience, the proposer, the critic and the counts. Warnings MUST print as further lines after that line. Findings of severity `ok` MUST NOT be printed.
  - test: CT-112-123
- **F112-FR-024**: With `fail` findings the doctor MUST print a header line, at most 7 finding lines ordered by severity and id, each of at most 200 bytes (`<mark> <id>: <message> -> <fix>`), and a footer that gives the number of further findings and the exit code. The worst case MUST stay at 1,700 bytes or fewer. The output and the body of the doctor skill together MUST stay inside 1,500 tokens, measured in bytes at 2.8 bytes per token; the skill body MUST be trimmed to fit (the worst case of the research is 10 tokens over). The build MUST fail on a breach. Text from outside the runtime MUST never be echoed; state MUST be named by logical name.
  - test: CT-112-124
  - ep: EP-01 `specstride.host/1` (consumes)
- **F112-FR-025**: `--json` MUST print one record with schema `specstride.doctor/1`, a stable order of keys and no escape sequences, with the fields of annex G §G.7. It MUST never hold a secret value, an account identifier or a token; evidence MUST pass the redactor. `--json` MUST be opt-in and MUST NOT be limited by the token budget. `registry`, `pick` and `sources` MUST be present when the checks that produce them ran.
  - test: CT-112-125
  - ep: EP-14 `specstride.doctor/1` (implements)
  - ep: EP-02 `specstride.harness/1` (consumes)
- **F112-FR-026**: The doctor MUST accept the flags `--json`, `--verbose`, `--quick`, `--offline`, `--online`, `--role <role>`, `--harness <id>`, `--check <id>`, `--launch-checks`, `--strict` and `--workdir`. `--offline` MUST forbid the network and allow subprocesses; `--online` MUST run the free model-list requests for roles in use, and the default MUST follow the configuration key `doctor.online` (default true, and on when a credential reference exists for a role in use). `--role` and `--harness` MUST name a registered role or harness. `--check <id>` MUST be the filter that a check id names (annex G §G.7, unknown-value rule): it MAY be given more than once, and only the named checks run. `--launch-checks` MUST run exactly the checks whose flag `lb` is set, in their fixed order, through the same functions as a launch, and MUST evaluate them without launching (annex G §G.4; F113-FR-023); it is the form of the doctor that a host hook calls, and its exit code follows F112-FR-027. An unknown flag, an unknown role or harness, and an unknown check id in a filter MUST be a usage error and exit 3.
  - test: CT-112-126
  - parity: not used; `doctor.online` has default true (row 61 of annex X §X.7)
  - ep: EP-14 `specstride.doctor/1` (implements)
- **F112-FR-027**: The doctor MUST exit 0 when no finding is `fail`, 1 when it could not run (a bad working directory, a check that throws), 2 when at least one finding is `fail`, and 3 on a usage error. With `--strict` a warning MUST exit 2. Lisa's exit 2 on any finding and Lisa's documented exit 3 that never existed MUST NOT be carried.
  - test: CT-112-2
  - divergence: DV-041
  - ep: EP-14 `specstride.doctor/1` (implements)
- **F112-FR-028**: The doctor MUST be one engine function with three exposures: `specstride doctor` on the CLI; the doctor skill of Claude Code, which runs the CLI and relays its output; and the doctor skill of the dsh host in Wave 2. A host MUST reach the doctor through its rendering of the command `doctor` and through the CLI protocol only. A host skill MUST be user-invoked where the host allows it. The calling host MUST be named in the output.
  - test: CT-112-128
  - ep: EP-01 `specstride.host/1` (consumes)
- **F112-FR-029**: The doctor MUST show the audience in force in the summary and in `--json`. It MUST show a run section when a run exists: the state of the run, open alerts, the caps in force, the billing mode, the fallback in force and the critic-diversity warning, read through the read model.
  - test: CT-112-129
  - ep: EP-09 `specstride.view/1` (consumes)

#### G4 The launch-blocking subset and the integrity invariants

- **F112-FR-030**: The launch checks of `launch` MUST be exactly the checks whose flag `lb` is set, and they MUST be the same functions that the doctor runs. The flag MUST be set on `bin.<id>`, `auth.<id>.<role>`, `model.reach.<role>`, `critic.independence`, `terms.gate`, `budget.caps` (for an automatically picked metered critic only), `config.schema`, `secret.inline`, `secret.file` and `sandbox.critic`, and on the launch checks that the pipeline runtime registers, in their fixed order. A launch MUST be refused when a check with `lb` returns `fail`, and MUST NOT be refused for any other finding. No flag, mode, comment or project key MUST switch a check with `lb` off. The doctor MUST expose the same subset for evaluation without launching through `--launch-checks` (F112-FR-026; annex G §G.4), so that a host hook and a launch judge by the same functions.
  - test: CT-112-130
  - ep: EP-14 `specstride.doctor/1` (implements)
  - ep: EP-19 `specstride.stage-kind/1` (consumes)
- **F112-FR-031**: `critic.diversity` MUST NOT have the flag `lb`. A set-up in which the critic and the proposer resolve to the same model, or in which the diversity test gives `unverified`, MUST give the critic-diversity warning and exit 0, and MUST NOT block a launch (F100-FR-024). With `--strict` the warning exits 2 as every warning does (F112-FR-027); it still blocks no launch.
  - test: CT-112-131
- **F112-FR-032**: The check `events.gateIntegrity` MUST test the following invariants on the event log of every run and MUST be `fail` when one does not hold: (1) every approval follows a verdict of the critic with the matching nonce, made after the proposer loop ended and after the verification gate ran in the same phase attempt; (2) no inner event changed a counter that limits a run (reject count, ordinal of the phase attempt, MALFORMED streak, oscillation input, diagnostician signature, verdict pins, learning observations); (3) no critic-class input held a field that the fact block excludes; (4) no check is recorded as `pass` that did not run, ran tainted, or whose fingerprints differed before and after; (5) `seq` has no gap, and every event that opens something has a closing event or a synthesized one. When the log holds none of the events an invariant needs, that invariant MUST be `info`. A detected and refused attempt MUST NOT be a breach. The names of the events belong to the event catalogue.
  - test: CT-112-132
  - status: unverified (check: fixtures with a planted breach for each invariant, run on the event log; verified-on: —; pin: —)

### Key Entities *(include if feature involves data)*

- **Check**: a registered probe with id, group, severity rule, `lb`, order, message template, fix hint.
- **Finding**: the result of one check: id, severity, `lb`, message, fix, redacted evidence.
- **Doctor run**: the findings, their counts, the exit code, the host, the audience, and the optional summaries of the registry, the pick and the configuration sources.
- **Injected probe**: the seam through which a check reaches the machine.

## Closed sets

| Set | Members | Owner | Closed by | Unknown value |
|---|---|---|---|---|
| Severities of a doctor finding (row 71 of annex X §X.6) | `ok`, `info`, `warn`, `fail` | 112 | Design | `warn` |
| Groups of a check | The 19 groups of F112-FR-002 | 112 | Design | The check is refused at registration |
| Exit codes of the doctor (row 7 of annex X §X.6) | 0, 1, 2, 3 | 100 | Owner decision | Not applicable: the doctor writes them |

The groups of a check are row 134 of annex X §X.6. Rows 13, 14, 53, 60, 63, 65 of annex X §X.6 are not this feature's. The results of the diversity test (`diverse`, `same-provider`, `same-model`, `unverified`) are row 183 of annex X §X.6; this feature reads them and does not own them.

## Rows of the `parity` profile

The doctor is not run by the oracle: no baseline has one, and no fixture compares it (brief 112, heading 8). The options below share row 61 of annex X §X.7. The value under `parity` is "not used".

| Option | Key (feature 110 owns the spelling) | Default | Under `parity` | Row | Register row |
|---|---|---|---|---|---|
| Days after which `verified-on` is old | `doctor.staleAfterDays` | 90 | not used | 61 | — |
| Network requests of the doctor | `doctor.online` | true | not used | 61 | — |
| Time limit of a probe | `doctor.probeTimeoutSec` | 5 | not used | 61 | — |
| Output cap of a probe | `doctor.probeOutputBytes` | 65536 | not used | 61 | — |
| Flags `--strict`, `--quick`, `--offline`, `--online` | flags, no key | off | not used | — | DV-041 for `--strict` |

## Constraints

Set by the owner. They are not implementation detail to be removed.

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. The dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |
| Entry points: `/specstride:doctor` in Claude Code, the dsh equivalent in Wave 2, `specstride doctor` on the CLI | Decision 14 |

## Extension points

| EP | Id and version | Relation |
|---|---|---|
| EP-14 | `specstride.doctor/1` | Implements: the registry, the core catalogue, the findings schema |
| EP-01 | `specstride.host/1` | Consumes: `renderEntry` for `doctor`; the budget |
| EP-02 | `specstride.harness/1` | Consumes: the resolved registry and role plan |
| EP-09 | `specstride.view/1` | Consumes: the run section |
| EP-10 | `specstride.secret-resolver/1` | Consumes: `exists` |
| EP-11 | `specstride.terms/1` | Consumes: `evaluate` |
| EP-13 | `specstride.lock/1` | Consumes: `probe` |
| EP-16 | `specstride.toolchain/1` | Consumes: the toolchains a run detected |
| EP-19 | `specstride.stage-kind/1` | Consumes: the launch checks the pipeline runtime registers |

## Contracts of feature 100 used

| Contract | Annex and section |
|---|---|
| EP-14 doctor check registry; doctor findings, `specstride.doctor/1` | annex G §G.7 (F100-FR-189) |
| Exit codes of the doctor; CLI protocol 1 | annex G §G.4 (F100-FR-185), §G.1 |
| Token budgets | annex G §G.5 (F100-FR-187) |
| Output modes and line grammar | annex G §G.2, §G.3 |
| Resolved registry and role plan; critic order | annex C §C.6 |
| Secret resolver `exists` | annex C §C.11 |
| Terms-gate data | annex C §C.12 |
| Lock probe | annex F §F.5 |
| Handshake and launch checks | annex F §F.3 |
| Config envelope, ranks, trust classes | annex X §X.2 |
| Tripwire record | annex B §B.18 |
| Redactor | annex X §X.4 |
| Closed sets; the `parity` profile | annex X §X.6, §X.7 |
| Host port and capabilities | annex H §H.1 |
| Logical names | annex B §B.5 |
| Threats T-07, T-13 to T-15, T-27, T-29, T-32, T-35, T-46 | annex X §X.9 |

## Threats

Feature 100 names this feature as an owner of nine threats of annex X §X.9 (F100-FR-216). For each, the doctor's part of the control is a check that reports; the control that prevents belongs to the other owners named in §X.9.

| Threat | The doctor's part of the control | Requirement | Test |
|---|---|---|---|
| T-07 A proposer with all tools acts on injected instructions | The containment level per role is shown with its reason; the doctor never asserts a sandbox; children receive only the variables their harness declares | F112-FR-019, F112-FR-018 | CT-112-119, CT-112-118 |
| T-13 Project configuration declares a harness, a critic, a command or an endpoint | Project files are read as untrusted data and nothing in them is executed; a widening key in project configuration is a warning and is ignored | F112-FR-010, F112-FR-018 | CT-112-110, CT-112-118 |
| T-14 A discovered harness claims falsely that it qualifies as critic | The state of every harness is shown and an unverified harness in a role is a warning; a declared capability that differs from the probed one is a warning; the pick and the reason each candidate lost are shown; the critic-diversity warning is shown for `same-model` and `unverified` | F112-FR-013, F112-FR-015 | CT-112-113, CT-112-115 |
| T-15 An executable shadows a harness on the search path | `bin.<id>` reports the resolved path from the resolved registry and is launch-blocking | F112-FR-009, F112-FR-030 | CT-112-109, CT-112-130 |
| T-27 A stale or planted lock blocks every run | `run.lock` warns for a lock without a live holder; the doctor removes nothing | F112-FR-019, F112-FR-004 | CT-112-119, CT-112-104 |
| T-29 Other users of the machine read the state | `env.stateDirPerms` warns when state is readable by others; `secret.file` warns for a file reference readable by others | F112-FR-011, F112-FR-018 | CT-112-111, CT-112-118 |
| T-32 Content leaves the machine on spans | `telemetry.endpoint` shows the collector and warns when content capture is on | F112-FR-020 | CT-112-120 |
| T-35 A secret is written inline or on a command line | `secret.inline` fails and is launch-blocking; at most four characters are shown; no output holds a secret | F112-FR-018, F112-FR-025, F112-FR-030 | CT-112-118, CT-112-125, CT-112-130 |
| T-46 The host package installs the CLI silently | A fix that installs software is printed and never run; the doctor writes nothing | F112-FR-004 | CT-112-104 |

## As-is behaviour not carried

The traceability files assign no as-is requirement, success criterion or behaviour item to this feature. What the sources say about neighbouring behaviour:

| As-is behaviour | Disposition | Register row |
|---|---|---|
| Lisa's doctor exits 2 on any finding, warnings included | Not carried; a warning exits 0 | DV-041 |
| Lisa's README documents a doctor exit 3 that the code never returns | Dropped; exit 3 is the usage error | DV-041 |
| Lisa's `--fix` (stale lock, orphaned worktree) | Deferred; the doctor is read-only | — (no register row; deferred by the brief) |
| The `--check` of the onboarding script of mixture-of-loops (codes 5 and 6) | Superseded with 011 FR-025; its checks become `host.*`; owned by the host package | DV-056 |

## Clarifications

### Session 2026-09-29

Questions answered from the sources. No question was put to a person.

- Q: Does a warning exit 0 or 2? → A: 0, with `--strict` making it 2. (Source: F100-FR-185; DV-041; ruling K6)
- Q: Are the messages and fix hints part of the spec? → A: Yes, as data in `contracts/check-catalogue.tsv`; the spec fixes the ids, severities and flags. (Source: brief 112 heading 1; R16 F3)
- Q: The brief says 44 checks, but requires a check of the gate integrity invariants and probes of the process tools and the keychain tool. Are they separate checks? → A: The invariants are a 45th check, `events.gateIntegrity`; the three tool probes are evidence of `env.os`, not separate ids. (Source: brief 112 heading 4; `architecture.md` section 6; R27 D1.9) Reported.
- Q: Who owns the ids of `host.*`, `bin.<id>`, `auth.<id>.<role>` and `harness.version.<id>`, given that the packages register them? → A: This feature fixes the id, severities, flag, message and fix; the package supplies the probe. (Source: brief 112 heading 1)
- Q: Are the six launch checks of the as-is supervisor in the catalogue? → A: No. The pipeline runtime registers them with the flag and a fixed order; the ten checks of this catalogue that carry the flag are the others. (Source: F100 annex G §G.7 "Wave 1 implementations"; brief 112 heading 1)
- Q: Is `--online` the default? → A: The default follows `doctor.online` (true); a model-list request goes out only for a role in use with a credential reference, GET only. (Source: ruling 61; R16 F4)
- Q: What does the Linux keychain check report? → A: `unprobed`. (Source: brief 112 heading 6; R16 open question 5)
- Q: How does the doctor stay inside 1,500 tokens? → A: The 7-line cap of 200 bytes each and a skill body trimmed to fit. The brief gives one figure only, the total of the whole doctor skill: 1,500 tokens (4,200 bytes at 2.8 bytes per token), and says that the skill body is trimmed. This feature takes that figure and fixes no figure for the body; the host package owns the body. The worst-case output is 1,700 bytes, so 2,500 bytes remain for what the skill itself puts into the context. (Source: brief 112 headings 4 and 6; ruling 65; annex G §G.5; R16 open question 1)
- Q: Is a closed set of groups needed? → A: Yes, 19, closed by design; it is row 134 of annex X §X.6. (Source: brief 112 heading 4; F100-FR-208)
- Q: Which event log invariants are checked? → A: The four breach conditions of R23 IR-28 with IR-02 and IR-06, plus `seq` and open/close pairing of F100-FR-200. (Source: R27 "Immediate revert"; R23 IR-28; R23v)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F112-SC-001**: On the descriptor-only fixture, the output of the doctor names each declared harness with the state `unverified` in 100 per cent of runs, in text and in `--json`.
  - test: CT-112-201
- **F112-SC-002**: For every fixture of the test set, a launch is refused exactly when the doctor reports a `fail` finding of a check with the flag `lb`: 0 disagreements.
  - test: CT-112-202
- **F112-SC-003**: A set-up in which the critic and the proposer are the same model gets the critic-diversity warning and exit 0 in 100 per cent of runs.
  - test: CT-112-203
- **F112-SC-004**: The state of the workspace, the control plane and user-level state is byte-identical before and after the doctor on every fixture, and the file-access trace shows 0 writes and 0 reads of a credential store.
  - test: CT-112-204
- **F112-SC-005**: Healthy output is one line of at most 200 bytes. Worst-case output is at most 7 finding lines and 1,700 bytes. Output and skill body stay inside 1,500 tokens at 2.8 bytes per token. The golden output check covers the healthy case and the worst case.
  - test: CT-112-205
- **F112-SC-006**: Every check has a fixture for each severity it can return: 100 per cent of the 45 checks.
  - test: CT-112-206
- **F112-SC-007**: A sample check registered from the test tree appears in `--json` output, and with the flag `lb` it refuses a launch, with 0 core files changed.
  - test: CT-112-207
- **F112-SC-008**: With 0 canary secrets planted in configuration, environment and files, 0 appear in text or `--json` output; no account identifier appears.
  - test: CT-112-208
- **F112-SC-009**: `doctor --quick` has a median run time of at most 300 ms over 30 runs.
  - test: CT-112-209
  - status: unverified (check: the startup check of the research on Linux and macOS; verified-on: —; pin: Node version of the runner)

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary.
- The divergence register is `docs/ecosystem/consolidation.md`; this feature cites its rows DV-041, DV-048, DV-056, DV-068 and DV-071 and states no count of it.
- Readings that the sources do not settle, each proceeded on and reported. Two rows are settled by feature 100 and are no question any more; they cite the row:

| Id | Question | Reading | Requirements |
|---|---|---|---|
| CQ-070 | The brief says 44 checks; the invariants of gate integrity need a check id | `events.gateIntegrity` is a 45th check; the platform tools are evidence of `env.os` | F112-FR-011, F112-FR-032 |
| annex X §X.6 row 134 (settled) | Closed set "groups of a doctor check" | The row exists: owner 112, closed by design, refused at registration | F112-FR-002 |
| annex X §X.7 row 61 (settled) | The configuration keys of the doctor | The row exists: `doctor.staleAfterDays`, `doctor.online`, `doctor.probeTimeoutSec`, `doctor.probeOutputBytes`; not used under `parity` | F112-FR-007, F112-FR-013, F112-FR-026 |
| CQ-071 | The spelling of the option by which a host names itself | `--host <id>`, a proposal | F112-FR-028 |
| CQ-108, CQ-150 | The ids of the checks that another feature registers: who fixes them. The names and the order of the six launch checks of the as-is supervisor are settled by annex G §G.7, "Wave 1 implementations" | A harness adapter proposes ids of the form `harness.<id>.<check>` and this feature confirms them (annex G §G.7); the six launch checks are registered by the pipeline runtime with the flag, in the order of annex G §G.7 | F112-FR-022, F112-FR-030 |
| CQ-189 | May a harness be a proposer with customisations that cannot be switched off? | Yes on the recommended answer; the warning is a check of the harness adapter, which this feature renders | F112-FR-033 |

## Repairs after the cross-feature review

Dated 2026-09-30. Requirements changed in place keep their ids and their tests.

| Item | Requirement or place | What changed |
|---|---|---|
| W-125-01 | F112-FR-015 | The trigger is cited from F100-FR-024 and the diversity test (row 183 of annex X §X.6): warn for `same-model` and `unverified`, inform for `same-provider`, `ok` for `diverse`; "or model tier" dropped, a shared model tier gives no finding of its own |
| W-125-01 | F112-FR-031 | The warning is named "critic-diversity warning" and covers the result `unverified` as well; the effect of `--strict` is stated |
| W-125-01; row 23 of the table of feature 100 | F112-FR-029, F112-SC-003, acceptance scenario 4 of User Story 1 | "same-model warning" becomes "critic-diversity warning" |
| Row 1 of the table of feature 100 (EP-16) | F112-FR-021, table "Out of scope" | The toolchain check is registered by the content owner of EP-16, not by the micro-loop layer |
| Order of the orchestrator; report of feature 116; CQ-189 | F112-FR-033 (new, test CT-112-133) | The code of a registered check lives in the package of its owner; the doctor renders what is registered |
| W-112-01 | Clarification on the 1,500 tokens | The figure of the brief (the total, 1,500 tokens) is taken; "about 700 tokens" removed; no figure of the body is fixed here. F112-FR-024 is unchanged |
| W-112-02 | Table "Rows of the `parity` profile" | Six columns in the separator; row 61 for `doctor.probeOutputBytes`; "—" in the row column of the flags |
| W-X-05 | Assumptions | The count of the register is removed |
| W-X-11, W-X-13 | Assumptions; "Closed sets"; one clarification | Row 134 of annex X §X.6 and row 61 of annex X §X.7 are cited in place of a question; the label CQ-071 now stands at the question of the queue (how a host names itself); the last placeholder is replaced by CQ-108 and CQ-150 |
| W-X-22 | Section "Threats" (new) | The nine threats of annex X §X.9 that name this feature, each with requirement and test |
| W-X-31 | F112-SC-005, F112-SC-009 | "golden output check", "startup check" |

## Repairs after the analyze run of 2026-09-30

Dated 2026-09-30, second analyze run. Requirements changed in place keep their ids and their tests. Both readings settle a surface that annex G of feature 100 mandates and whose content this feature owns, so no question goes to the queue.

| Item | Requirement or place | What changed |
|---|---|---|
| A-K1 | `plan.md`, Constitution Check | The version line says v3.0.1 and the row of Principle IX records the re-read against the weaker-proof sentence (CQ-182): the Pass stands, the weaker proof is an adapter duty, and no requirement of this feature changes |
| A-F1 | F112-FR-026; `data-model.md`; T018 | The filter that a check id names is the flag `--check <id>`, so the clause "an unknown check id in a filter" (annex G §G.7, unknown-value rule; the edge case of this spec) names its surface |
| A-C1 | F112-FR-026, F112-FR-030; T018, T038, T039 | The evaluation of the launch checks without launching, for a host hook (annex G §G.4; F113-FR-023), is the flag `--launch-checks`: the `lb` subset, in its fixed order, through the same functions as a launch |
