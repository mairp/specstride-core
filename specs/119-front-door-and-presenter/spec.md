# Feature Specification: Front door

**Feature Branch**: `119-front-door-and-presenter` (a label: Spec Kit creates no branch in this repository; the directory is `specs/119-front-door-and-presenter`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 119-front-door-and-presenter, tier 2: the front door of the one `specstride` CLI (verb set and routing, usage and help, unknown verbs and flags, exit with the called command's code and 70 on an uncaught error); the inspection commands `tail`, `events`, `verdicts`, `feedback`, `phases` and the compatibility output of `status`; the public verbs `spec` and `verify` as routed commands; the two output modes as they apply to the front door; and the routing of the internal presenter calls. The presenter, banner and theme moved to `145-presenter`."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority), `architecture.md`, `consolidation.md`, `feature-briefs.md` (brief 119), `STAGE-B-RULES.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182) (principles V, XIII, XVIII, XIX), feature 100 (`specs/100-specstride/`), feature 141 (`specs/141-parity-oracle/`), the research reports R17, R11, R13, R15v, R19, and the Specstride baseline at `9cab15d` (the front-door script and the engine script).

## What this feature is

The front door is the one place where a person, a script or a host meets the `specstride` command. It reads the first argument, sends the call to the command that owns it, reports what went wrong in a form that costs little context, and ends with the code of the command it ran. It also holds the commands that only look at a run: `tail`, `events`, `verdicts`, `feedback`, `phases`, `watch`, and the old-style output of `status`. Behind those commands stands the presenter of feature `145-presenter`, which turns the event stream into lines for a terminal. This feature was split: the presenter, the banner, the theme, the start-up record and the live rules moved there (see "Requirements moved to 145-presenter").

Two output modes apply. **Compatibility output** reproduces the lines of the Specstride baseline byte for byte, so that the parity oracle can compare the port with it. **Default output** is terse: one line for a success, the failing items with their fix for a failure, no free text from outside the runtime, and a byte limit per command. A host reads default output and never opens a state file.

**In scope**: verb routing; usage and help; unknown verbs and unknown flags; the exit with the called command's code and 70 on an uncaught error; the inspection commands and the compatibility output of `status`; the routing of the public verbs `spec` and `verify`; the two output modes as they apply to the front door.

**Out of scope**:

| Out of scope | Owner |
|---|---|
| What `stop` and `resume` do | 102 |
| `status` data and default output, `wait` | 129 |
| `learn` | 106 |
| `reverse` | 108 |
| `doctor` | 112 |
| Launch-contract commands, `launch`, `supervise`, digest lines | 107, 123 |
| The terminal follower `watch` as a later product and the web viewer | 121, Wave 2 |
| The line grammar | 100 |
| The compatibility projection that the presenter reads | 111 |
| The behaviour of `spec` and `verify` themselves | 104, 105 |
| The presenter, the banner, the theme, the start-up record, the halt banners and the live rules | 145 |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A host asks about a run and pays little context (Priority: P1)

A host skill, or a script, asks what happened in a run: the phases and their states, the latest events, the verdicts, the critic's feedback for a phase. It gets one line for a success, the failing items with a fix for a failure, and a reference to any text instead of the text. It never opens a file of the product.

**Why this priority**: Principle XIX. Every byte a command prints is host context, and text from outside the runtime is an injection route (R11 T-12).

**Independent Test**: On the fixtures of family FX-28 in default output, run every inspection command on a success case and on a failure case. The output stays within 1,120 bytes and 2,240 bytes; no absolute path and no text from outside the runtime appears; the files of the workspace and the control plane are byte-identical before and after.

**Acceptance Scenarios**:

1. **Given** a finished run, **When** the host calls `phases`, **Then** it gets one product line with counts and ranges of phase numbers, and exit 0 (F119-FR-030).
2. **Given** a phase with critic feedback, **When** the host calls `feedback 3` in default output, **Then** it gets one line that names the feedback by logical name with its size, and no feedback text (F119-FR-032).
3. **Given** the same call with `--verbose`, **Then** the text is redacted, cut to a cap and framed as data (F119-FR-032).
4. **Given** a workspace with no state, **When** the host calls `events`, **Then** it gets one error line with a reason and a fix, and exit 1 (F119-FR-010, F119-FR-030).

---

### User Story 2 - The port prints what the baseline printed (Priority: P1)

An owner of the parity oracle runs the baseline and the port on the same fixture with compatibility output selected. Every inspection command and the compatibility form of `status` print the same bytes, apart from what the normalization rules replace.

**Why this priority**: Parity binds every release (Principle XVIII, ruling 32).

**Independent Test**: The parity tests on FX-28 compare `exit`, `stdout` and `stderr` for each `<command>-<case>` scenario.

**Acceptance Scenarios**:

1. **Given** a run that a stop request ended, **When** `status` runs in compatibility output, **Then** the state line reads `  state: STOPPED at phase <p> — resume with: specstride resume` (F119-FR-023).
2. **Given** `status --all` on a workspace with three features, **Then** the table has the columns `FEATURE`, `PHASES`, `STATE` with the widths of the baseline (F119-FR-027).
3. **Given** an unknown verb, **Then** the call prints `specstride: unknown subcommand '<SUB>'` and the usage on standard error and exits 1 (F119-FR-003).
4. **Given** the profile `parity`, **When** any command runs, **Then** it prints no line that has no as-is equivalent (F119-FR-029).

---

### User Story 3 - A caller relies on the exit code (Priority: P1)

A script calls `specstride` and reads the exit code. Every command keeps its as-is code; an uncaught error is 70.

**Why this priority**: Other programs match these codes; a changed number breaks them without an error.

**Independent Test**: For every row of annex G §G.4 that belongs to this feature, a fixture ends the command in that way and the code equals the row.

**Acceptance Scenarios**:

1. **Given** an argument that the engine call does not know, **Then** exit 3 with the usage on standard error (F119-FR-005).
2. **Given** `feedback` without a phase number, **Then** exit 1 with `usage: specstride feedback <N> [-w DIR]` (F119-FR-010).
3. **Given** an error that nothing catches, **Then** exit 70 (F119-FR-011).

---

### Edge Cases

- A first argument that begins with `-` and is not `-h`, `--help`, `--reverse` or `--protocol` starts a run; `--reverse` goes to `reverse`, `--protocol` prints the protocol integer (F119-FR-002).
- A value-taking flag without a value ends the call before any state is touched, with the baseline's non-zero status and not with the documented 3 (F119-FR-005).
- `--feature` holds characters outside `A-Za-z0-9._-`: each becomes `-` and leading and trailing `-` are trimmed (F119-FR-008).
- `feedback` and `phases` run with no state directory; the other inspection verbs refuse (F119-FR-009).
- The output of a command exceeds its byte limit: the output is cut and one line says how much was left out (F119-FR-031).
- A free-text field holds text that looks like a secret: the redactor replaces it before printing (F119-FR-032).

## Requirements *(mandatory)*

### Functional Requirements

Requirements are grouped as the brief groups them: G1 routing and exit codes (F119-FR-001 to F119-FR-015), G2 inspection commands and output modes (F119-FR-016 to F119-FR-033), and the bundle of the published package (F119-FR-056, added by the repairs after the cross-feature review); group G3 (presenter, banner, theme, start-up and live rules) moved to `145-presenter`. Every requirement follows `STAGE-B-RULES.md` section 4. "Compatibility output" and "default output" are the two modes of feature 100 annex G §G.2. A line quoted between backticks is the literal line of the baseline; a leading space in a literal line is part of it.

#### G1 - Verb routing, usage, unknown verbs and flags, exit codes

- **F119-FR-001**: The front door MUST offer the twelve verbs of the Specstride baseline: `run`, `status`, `watch`, `tail`, `events`, `verdicts`, `feedback`, `phases`, `stop`, `resume`, `learn` and `reverse`, and `start` as an alias of `run`. Every verb other than `stop`, `resume`, `learn` and the writes of `reverse` MUST be read-only. This requirement covers the routing of `stop`, `resume`, `learn` and `reverse`; what they do is the contract of annex G §G.4. The verbs that Lisa recognizes and does not implement (the inspection verbs of 002 FR-004, among them `watch` and `tail`) MUST exist and be implemented (Lisa's exit 1 with `verb_not_implemented` is not carried). The routing of `reverse` MUST refuse a `--mode` other than `source-aware` on standard error with `specstride reverse: <Label> reverse engineering requires an explicit permission and side-effect policy. Specstride will not infer those permissions; only --mode source-aware is supported.` (`<Label>` is `Black-box` for `black-box` and `Runtime-assisted` otherwise) and exit 3.
  - origin: 028 FR-023; B-1518
  - disposition: merged-with 002 FR-003
  - test: PT-119-028FR023-*
  - divergence: DV-042; DV-062

- **F119-FR-002**: `run`, `start`, and any first argument that begins with `-` other than `-h`, `--help`, `--reverse` and `--protocol` MUST start a run: the front door MUST pass every remaining argument, including that flag, to the engine unchanged, MUST run the engine in the foreground in the start mode `standalone`, and MUST end with the engine's exit code, with the engine's output unchanged. `--reverse` MUST route as the verb `reverse`. `--protocol` MUST route to the handler of feature 100 (annex G §G.1, F100-FR-170), which prints the protocol integer and exits 0.
  - origin: 002 FR-003; B-1428; B-1429; B-1430
  - disposition: merged-with 028 FR-023
  - test: CT-119-3; PT-119-C-108-*
  - ep: EP-01 `specstride.host/1` (consumes)

- **F119-FR-003**: A first argument that is not a verb, not a help token and not a leading flag is an unknown first argument (verb) in the sense of annex G §G.4. It MUST print `specstride: unknown subcommand '<SUB>'` and then the usage text on standard error, and MUST exit 1. Lisa's wording `unknown subcommand: <verb>` MUST NOT be used. This exit 1 belongs to the first argument only: an unknown sub-verb of a routed command ends with the code of the row of that command in annex G §G.4 (for `spec`: 2), which the front door passes on unchanged (F119-FR-011).
  - origin: 002 FR-001; B-1443; B-1499
  - disposition: merged-with 028 FR-023
  - test: CT-119-1; PT-119-C-108-*; PT-119-C-111-*

- **F119-FR-004**: The call with no argument, and the first argument `-h`, `--help` or `help`, MUST print the usage of the front door on standard output and exit 0. `-h` or `--help` anywhere after an inspection verb MUST print the usage and exit 0 without running the verb. In compatibility output the usage is the baseline's text, which is the header of the front-door script with the leading `# ` removed; where that text names an implementation file it names the logical component of annex X §X.8 instead. In default output the usage lists every command of the table of annex G §G.1 on one line each, is at most 2,240 bytes, and names no harness.
  - origin: 002 FR-002; B-1442; B-1463; B-1517
  - disposition: merged-with 028 FR-023
  - test: CT-119-2; PT-119-C-108-*; PT-119-C-109-*; PT-119-C-114-*
  - divergence: DV-066
  - assumption: CQ-095

- **F119-FR-005**: The engine call MUST handle its arguments as follows. `-h` and `--help` MUST print the engine usage on standard output and exit 0 before any state is touched; that usage MUST say that each agent invocation records a capability mode (structured, raw-text or degraded) and that setting the variable `SPECSTRIDE_AGENT_STREAM` to `false` forces the raw-text fallback. An unknown argument, a stray positional argument included, MUST print `engine: unknown arg: <arg>` and the usage on standard error and exit 3. A flag that takes a value and is given none MUST end the call before any state is touched with the non-zero status that the baseline's shell gives, which is not the documented 3.
  - origin: 002 FR-007; B-0034; B-0108; B-0187; B-0235
  - disposition: merged-with 028 FR-023
  - test: CT-119-5; PT-119-C-006-*; PT-119-C-009-*; PT-119-C-012-*; PT-119-C-013-*
  - divergence: DV-066
  - status: verified-on 2026-09-29 (a value-less flag read through a parameter check of a non-interactive shell exits 127; pin: GNU bash 5.2.37 on the machine of this specification; the capture on the reference is the scenario `flag-without-value` of FX-28)
  - assumption: CQ-098

- **F119-FR-006**: The engine call MUST take the working directory from `-w DIR` or `--workdir DIR`, default the current directory, MUST enter it and use its physical path. A directory that does not exist MUST print `workdir not found: <dir>` on standard error and exit 3. A directory that exists and cannot be entered MUST exit 1.
  - origin: B-0009; B-0110; B-0111
  - disposition: ported
  - test: PT-119-C-006-*; PT-119-C-009-*

- **F119-FR-007**: Every inspection verb MUST accept `-w DIR` and `--workdir DIR` (default the current directory); `-s SPEC` and `--specs SPEC`, which mark the spec as explicit; `--feature SLUG`; `--all` (used by `status`, which also skips the check of the feature); `-f` and `--follow` and `--json` (used by `events`); and `-h` and `--help`. A value-taking flag without a value MUST end as in F119-FR-005. Every other argument MUST be collected, in order, as a pass-through extra; the first extra is the positional argument `N` or the mode. The front door MUST NOT reject an unknown flag of an inspection verb.
  - origin: B-1456; B-1457; B-1458; B-1459; B-1460; B-1461; B-1558
  - disposition: ported
  - test: PT-119-C-109-*; PT-119-C-115-*

- **F119-FR-008**: For the inspection verbs the front door MUST resolve its arguments as follows. A relative `-s` path is resolved against the directory from which the command was launched and not against the working directory. The working directory is made physical; if that fails the raw value is kept and the later check of the state reports it. Without `-s` the spec is `SPECS.md` in the working directory; if that does not exist and `-s` was not given, the spec is the one named in the settings that the feature's newest run recorded, when that file exists. A `--feature` value is sanitized: every character outside `A-Za-z0-9._-` becomes `-`, and leading and trailing `-` are trimmed. The feature is chosen in this order: `--feature`, the feature of the last run recorded for the workspace, `default`.
  - origin: B-1559; B-1560; B-1561; B-1562; B-1563; B-1564
  - disposition: ported
  - test: PT-119-C-115-*
  - ep: EP-03 `specstride.spec-format/1` (consumes)

- **F119-FR-009**: The verbs `status`, `tail`, `events`, `verdicts`, `watch`, `stop`, `resume` and `learn` MUST exit 1 when the workspace has no state, and MUST exit 1 when the chosen feature has none, unless `--all` is given. The first case MUST print on standard error `no <state> state dir in <workdir>`, where `<state>` names the location of the control plane of the workspace; the second MUST print `no feature '<slug>' in <workdir> (<state>/features/<slug> missing).`, then `known features:` and one line `  - <name>` for each feature that has state, all on standard error. `feedback` and `phases` MUST NOT need the state check first. For `resume` this state check MUST be the first check: on a workspace without state `resume` exits 1 before any other refusal of its row in annex G §G.4 (5 for a held lock, 3 when there is nothing to resume) is tried. Where the baseline's message names `.specstride/`, the port's message names the location of its own control plane, which normalization rule N-02 maps to the same logical name.
  - origin: B-1482; B-1483; B-1523; B-1524
  - disposition: ported
  - test: PT-119-C-111-*; PT-119-C-114-*; CT-119-18
  - divergence: DV-006
  - assumption: CQ-184

- **F119-FR-010**: The inspection verbs MUST exit 1 with these messages on standard error when their input is missing. `tail`: `no run.log yet for feature '<slug>' in <state>`. `events`: `no events.jsonl yet in <state>`. `verdicts`: `no verdicts recorded yet (<dir>)`; `verdicts N`: `no verdicts for phase <N>` when no transcript matches. `feedback` without `N`: `usage: specstride feedback <N> [-w DIR]`; `feedback N` with no feedback: `no feedback for phase <N> (<path>)`. `phases`: `no SPECS.md in <workdir>` when the spec does not exist; and exit 3 after printing `SPEC INVALID:` and the validator's message on standard output when the spec does not validate. `status` MUST exit 0 after printing.
  - origin: B-1484; B-1485; B-1486; B-1487; B-1488; B-1489; B-1490; B-1491; B-1492
  - disposition: ported
  - test: PT-119-C-111-*
  - ep: EP-03 `specstride.spec-format/1` (consumes)

- **F119-FR-011**: The front door MUST exit with the code of the command it ran: the engine's code for `run`, and for every other command the code of its row in annex G §G.4. An error that nothing catches, in any command, MUST exit 70, and in default output MUST print one product line with the reason `internal` and no stack trace unless `--verbose` is given. Exit 70 is not a code of the baseline; it is Lisa's rule, which the baseline is silent on.
  - origin: 002 FR-005
  - disposition: ported
  - test: CT-119-4
  - divergence: DV-066

- **F119-FR-012**: A section of the output of an inspection verb that cannot be produced MUST be left out, and the command MUST print its other sections and end with its as-is code. The front door MUST NOT end a command on the first failing step of a helper.
  - origin: B-1555
  - disposition: ported
  - test: PT-119-C-115-*

- **F119-FR-013**: The front door MUST route every command of the table of annex G §G.1 to the feature that owns it and MUST implement none of their behaviour beyond the checks of the front door that this specification states (the `reverse --mode` refusal of F119-FR-001, the state check of F119-FR-009). `spec` and `verify` MUST be public verbs with the exit codes of their rows in annex G §G.4 (`spec`: 0, 1, 2, 3; `verify`: 0, 3, 10, 11), together with `learn`. The pass loop, the critic, the banner, the presenter and the theme MUST NOT be public commands; their as-is exit codes are fields of result records.
  - divergence: DV-042; DV-066
  - test: CT-119-6
  - ep: EP-01 `specstride.host/1` (consumes)

- **F119-FR-014**: Nothing in the front door MAY enumerate harnesses other than by reading the resolved registry of annex C §C.6, discovered and declared entries included. No usage text, message or list of the front door MUST hold a harness name, and the front door MUST NOT test a harness name in control flow.
  - test: CT-119-7
  - ep: EP-02 `specstride.harness/1` (consumes)

- **F119-FR-015**: A read command MUST answer at or below 150 ms at the 90th percentile on the reference machine, measured over 30 cold starts of `status`, `phases` and `events` (without following) on a fixture, and the build MUST fail on a breach.
  - test: CT-119-8
  - status: unverified (check: the startup check of R17 on the reference machine and on a macOS runner; verified-on: —; pin: Node 22)

#### G2 - Inspection commands, compatibility output of `status`, output modes

- **F119-FR-016**: An inspection verb (`status`, `tail`, `events`, `verdicts`, `feedback`, `phases`, `watch`) MUST change no file of the workspace, of the control plane or of user-level state, MUST take no lock, MUST write no event and no inbox request. `phases` MUST write no fixed temporary file: the validator's message is held in memory. The state of the two trees before and after any inspection call MUST be equal.
  - divergence: DV-062
  - test: CT-119-9

- **F119-FR-017**: Inspection MUST reach state only by the logical names of annex B §B.5, and MUST NOT name a legacy state directory. The state of a feature is under its slug: the events and engine log of the newest engine start (`workspace:current:events` and `workspace:current:engine-log`, which annex B §B.5, F100-FR-055, resolves to the newest engine start of the workspace; or `run:<runId>:events` and `run:<runId>:engine-log` of the run to which the newest engine start of a feature belongs), the phase records (`gate:<N>:evidence`, `gate:<N>:approved`, `attempt:<N>:<k>:<n>:feedback`, `attempt:<N>:<k>:<n>:verdict`), and the settings that the run recorded (`run:<runId>:snapshot`). The feature of the newest engine start is read from the workspace record. Only the layout of feature 100 is read; no state of the three as-is systems and no state directory named `.wiggum` is read.
  - origin: B-1506; B-1507; B-1508; B-1512
  - disposition: translated
  - test: PT-119-C-113-*
  - divergence: DV-006; DV-036

- **F119-FR-018**: `tail` MUST show the engine log of the selected engine start and keep following it. `events` MUST render the event stream of the selected engine start through the presenter in plain mode; `--follow` adds following; in compatibility output `--json` MUST print one JSON object per line, which is the presenter's `--quiet` output, and in default output it prints the record of F119-FR-033. Selection: with `--feature`, the newest event file or log of that feature by modification time; without it, the current one of the workspace, which is that of the newest engine start of any feature; `events --feature S` with no engine start of that feature MUST fall back to the current event file. `tail` in compatibility output follows as `tail -f` does.
  - origin: B-1433; B-1434; B-1464; B-1465; B-1567; B-1568; B-1575
  - disposition: ported
  - test: PT-119-C-108-*; PT-119-C-109-*; PT-119-C-115-*

- **F119-FR-019**: `verdicts` MUST print every transcript of the feature's verdict records, or only those of phase `N` when `N` is given. Each transcript is framed by a rule line of 64 characters `═`, the line `# <path>`, the rule again, the content, and a blank line. With no `N` and no transcript it MUST print nothing and exit 0. `feedback N` MUST print the feedback of phase `N` of the newest phase attempt to standard output.
  - origin: B-1435; B-1436; B-1546; B-1576
  - disposition: ported
  - test: PT-119-C-108-*; PT-119-C-114-*; PT-119-C-115-*

- **F119-FR-020**: `phases` MUST print `<spec path> — <count> phase(s):` and then one line per phase, `  Phase <n>` with `n` padded to 3, one space, the title cut or padded to 40 columns, one space, and `[<state>]`. The state of a phase MUST be one of `pending`, `evidence-written`, `rejected(has-feedback)`, `APPROVED`; the later of them in that order wins over the earlier when the phase has the corresponding record. Phase numbers, titles and the count MUST come from the canonical spec model; `phases` needs the spec and the phase records and no run state. The spec path MUST be printed as the baseline prints it.
  - origin: B-1438; B-1547; B-1577
  - disposition: ported
  - test: PT-119-C-108-*; PT-119-C-114-*; PT-119-C-115-*
  - ep: EP-03 `specstride.spec-format/1` (consumes)
  - assumption: CQ-097

- **F119-FR-021**: `watch` MUST show the live status card of the workspace's current run, as the presenter's card mode renders it, reached through the presenter interface of annex G §G.10 (F100-FR-233); the card's lines are specified by `145-presenter`. It MUST ignore `--feature` and always follow the current event file of the workspace, MUST need the state check of F119-FR-009, and MUST end normally on Ctrl-C. A later terminal follower may replace it without changing this requirement.
  - origin: B-1437
  - disposition: ported
  - test: PT-119-C-108-*
  - assumption: CQ-100

- **F119-FR-022**: In compatibility output `status` MUST print first `specstride status — <workdir>  (feature: <slug>)`, with two spaces before the bracket, and then one state line. The state line is `  state: RUNNING (<owner>)` while a run is alive, where `<owner>` is the first line, at most 200 bytes, of the owner text of the lock: the as-is run id (annex B, F100-FR-046) and the time at which the lock was taken; `  state: not running (no clean end recorded — crashed or never finished a run)` when the newest events hold no terminal event; `  state: DONE — <outcome>` from the last `run_end`; the text of F119-FR-023 from the last `run_stop`; and `  state: no run recorded yet` when there is no events file and no live run. The terminal event is the last `run_stop` or `run_end` of the file; lines that do not parse are skipped.
  - origin: B-1431; B-1532; B-1533; B-1534; B-1535; B-1536; B-1537; B-1571
  - disposition: ported
  - test: PT-119-C-108-*; PT-119-C-114-*; PT-119-C-115-*
  - ep: EP-09 `specstride.view/1` (consumes)

- **F119-FR-023**: In compatibility output the state line of a `run_stop` MUST read as this table, where `<p>` is the `phase` field of the event or `?` when absent.

  | `reason` | State line |
  |---|---|
  | `stop_flag` | `  state: STOPPED at phase <p> — resume with: specstride resume` |
  | `max_rejects` | `  state: HALTED at phase <p> — needs human (max-rejects exceeded)` |
  | `proposer_yield_budget`, `proposer_yield_timeout` | `  state: HALTED at phase <p> — a declared yield's wait ran out (deadline, wall budget, or too many yields in one attempt). The job was left running, not killed: read its log under <location of the job logs>` |
  | `proposer_cap_exhausted` | `  state: HALTED at phase <p> — the phase's work does not fit one pass (consecutive hard_cap kills). Make the long step outlive the pass (--long-job-cmd) or split the phase; raising the cap is the last resort` |
  | any other, or absent (`?`) | `  state: HALTED at phase <p> — <reason>` |

  `<location of the job logs>` names where `job:<jobId>:log` lives, in place of the baseline's yield-jobs directory; normalization rule N-02 maps both to the same logical name.
  - origin: B-1500; B-1501; B-1502; B-1503; B-1504
  - disposition: ported
  - test: PT-119-C-112-*
  - divergence: DV-006

- **F119-FR-024**: In compatibility output `status` MUST print, when the spec exists, a blank line, the header `  PHASE  TITLE                        EVIDENCE APPROVED FEEDBACK` (columns of width 6, 28, 8, 8, 8 separated by one space), a rule row of dashes of the same widths, one row per phase with the title cut to 28 characters and the marks `✓` or `✗` for the existence of its phase evidence, its approval record and its feedback, a blank line, and `  current phase: <n>` for the first phase in spec order with no approval, or `  current phase: <all approved>`. When the spec does not exist it MUST print `  (no SPECS.md found)`. The mark for an approval MUST be the one of the phase's approval record as the engine accepts it.
  - origin: B-1538; B-1539; B-1540; B-1572
  - disposition: ported
  - test: PT-119-C-114-*; PT-119-C-115-*
  - ep: EP-03 `specstride.spec-format/1` (consumes)
  - assumption: CQ-041 (raised by feature 104: the recommended reading is that a phase is approved when its record verifies)

- **F119-FR-025**: In compatibility output `status` MUST print a telemetry section only when the settings that the feature's newest run recorded (the workspace's newest run when the feature has none) hold `TELEMETRY` or `OTEL` as `true`: a blank line, `  telemetry:`, and one line `    <state of the sink>` for each enabled sink, the Loki sink first and then the OTLP sink. The saved address of a sink is `http://localhost:3100` for the first and `http://localhost:4318` for the second when the saved value is empty. The state of a sink MUST be what the sink reports as its delivery status through its interface (annex C §C.10), which distinguishes configured, reachable, request-accepted and query-verified and is never a collapsed `true`.
  - origin: B-1511; B-1541; B-1573
  - disposition: translated
  - test: PT-119-C-113-*; PT-119-C-114-*; PT-119-C-115-*
  - divergence: DV-027
  - ep: EP-08 `specstride.event-sink/1` (consumes)

- **F119-FR-026**: In compatibility output `status` MUST print `  observability: <mode>` followed by ` — <reason>` when a reason exists, from the last `agent_observability` event among the last 400 lines of the events; `  latest tool: <tool>` followed by ` (<summary or status>)` when either exists, from the last `agent_tool` event among the same 400 lines; and `  last events:` followed by up to the last 5 events of the last 200 lines that are neither `agent_*` nor `iter_*`. Each of those lines is `    <last 8 characters of the time>  <event>  <k=v ...>`, with the keys `time`, `ts`, `event`, `task`, `backend` and `run_id` left out. The events are those of the compatibility projection.
  - origin: B-1542; B-1543; B-1544; B-1545; B-1574
  - disposition: ported
  - test: PT-119-C-114-*; PT-119-C-115-*
  - divergence: DV-007

- **F119-FR-027**: In compatibility output `status --all` MUST print `specstride status --all — <workdir>`; when the workspace has no feature list it MUST print `  (no features yet)`; otherwise a table with the header `  FEATURE                          PHASES     STATE` (columns of 32 and 10), a rule row, and one row per feature. In a row, `PHASES` is `<approved>/<total>`: the number of approval records of the feature over the number of phases of the spec that the feature's recorded settings name, validated with format detection, or `?` when the settings or the spec are missing or invalid. `STATE` is `—` when the feature has no events file, `running/crashed` when its newest events hold no `run_stop` and no `run_end`, `DONE:<outcome>` after a `run_end`, and `HALTED:<reason>@<phase>` after a `run_stop`. It MUST exit 0.
  - origin: B-1432; B-1525; B-1526; B-1527; B-1528; B-1529; B-1530; B-1531; B-1569; B-1570
  - disposition: ported
  - test: PT-119-C-108-*; PT-119-C-114-*; PT-119-C-115-*
  - ep: EP-03 `specstride.spec-format/1` (consumes)

- **F119-FR-028**: The state line of `status` in compatibility output MUST be derived from the read model (`project` of annex G §G.6), with the terminal record of the run, and the sections of F119-FR-024 to F119-FR-026 from the spec, the phase records and the compatibility projection of the events. The state is read by a probe of the lease and the front door MUST NOT take the lock to find out. The mapping is:

  | State of the run (annex E §E.2) | Line |
  |---|---|
  | `starting`, `running`, `paused-quota`, `relaunching`, `stopping` | `RUNNING (<owner>)` |
  | `finished` | `DONE — all_approved` |
  | `stopped` | the `stop_flag` row of F119-FR-023 |
  | `failed`, `blocked-on-human` | the row of F119-FR-023 for the stop reason of the terminal record |
  | `dead` (derived) | `not running (no clean end recorded — crashed or never finished a run)` |
  | `created` with no events, or no run | `no run recorded yet` |
  | an unknown state | as `dead` (the default output of `status` belongs to feature 129) |

  - divergence: DV-042; DV-007
  - test: CT-119-10
  - ep: EP-09 `specstride.view/1` (consumes)

- **F119-FR-029**: The front door MUST print in exactly the two output modes of annex G §G.2. Compatibility output is selected by the key `output.compat` and always under the profile `parity`; in it every line of an inspection verb, of the usage, of the failures of F119-FR-003 to F119-FR-012 and of the start-up lines of the engine's foreground call is the baseline's byte for byte, quirks and language artefacts included, and no other line is printed. Default output is used otherwise. Under `parity` the front door MUST print no line that has no as-is equivalent, on any stream.
  - divergence: DV-033; DV-034
  - parity: compatibility output (row 18 of annex X §X.7); no new line (row 19)
  - test: CT-119-11

- **F119-FR-030**: In default output an inspection verb MUST print one product line for a success, and for a failure the failing item with its fix, and nothing more. Product lines follow the grammar of annex G §G.3 (label starts with `SPECSTRIDE-`, pairs `key=value`, a text value quoted as in JSON). The lines are:

  | Verb | Success | Failure |
  |---|---|---|
  | `phases` | `[SPECSTRIDE-PHASES] spec=<relative path> phases=<n> approved=<n> current=<n or done>`, then for each state that occurs, `<state>=<phase numbers as ranges>` on the same line | as below |
  | `feedback N` | `[SPECSTRIDE-FEEDBACK] phase=<N> name=<logical name> bytes=<n> lines=<n>` | as below |
  | `verdicts [N]` | one `[SPECSTRIDE-VERDICT] name=<logical name> bytes=<n> result=<verdict>` per transcript | as below |
  | `events` | one `[SPECSTRIDE-EVENT] seq=<n> type=<type> phase=<n> attempt=<n>` per milestone event of the newest events that fit the limit; only closed fields | as below |
  | `tail` | `[SPECSTRIDE-TAIL] name=<logical name> bytes=<n> lines=<n>` | as below |
  | any | the line of its verb on every call: the front door keeps no memory of earlier calls (F119-FR-016); a host that wants nothing for an unchanged state calls `wait --until-change` of feature 129 | `[SPECSTRIDE-ERROR] cmd=<verb> reason=<reason> fix="<fix>"` |

  The reasons are a closed set: `no-state`, `no-feature`, `no-log`, `no-events`, `no-verdicts`, `no-verdict-for-phase`, `no-feedback`, `no-spec`, `spec-invalid`, `usage`, `unknown-subcommand`, `internal`; each has one fixed fix text. A path MUST be printed relative to the root of the repository and only once per call. The exit codes are those of F119-FR-009 to F119-FR-011.
  - test: CT-119-12
  - assumption: CQ-094

- **F119-FR-031**: In default output the bytes of one call of an inspection verb that ends by itself, standard output and standard error together, MUST be at most 1,120 on a success and at most 2,240 on a failure. Output that would exceed the limit MUST be cut and MUST end with `[SPECSTRIDE-TRUNCATED] left=<n> more=--verbose`. `--verbose` MUST lift the cap on a success. A following form (`tail`, `events --follow`, `watch`) MUST keep to the limit for what it prints before it starts to follow and MUST then print only what is new. An absolute path in default output is a failure of the build. Compatibility output has no limit.
  - test: CT-119-13
  - ep: EP-01 `specstride.host/1` (consumes)
  - assumption: CQ-095

- **F119-FR-032**: Text that comes from outside the runtime (the critic's feedback, the verdict transcripts, the text and targets of an agent, messages of a harness, free-text fields of an event, titles from a spec, names of tests) MUST NOT be printed in default output; the line MUST refer to it by logical name, byte count and the first eight characters of its hash. With `--verbose` the text MAY be printed after `redact` of annex X §X.4 with a size cap of 16,384 bytes per framed text (the cap that the front door hands to `redact`; the begin line's `bytes=<n>` gives the size before the cut), and MUST be framed as data by `[SPECSTRIDE-DATA] part=begin name=<logical name> bytes=<n> token=<token>` and `[SPECSTRIDE-DATA] part=end token=<token>`, where the token is fresh for each call and 64 bits long, so that the text cannot end the frame. In compatibility output the text is printed as the baseline prints it, after the redactor.
  - divergence: DV-033
  - test: CT-119-14
  - ep: EP-01 `specstride.host/1` (consumes)
  - assumption: CQ-096

- **F119-FR-033**: Every inspection verb MUST offer `--json` in default output: one record with a `schema` field, keys in a stable order, no colour escape, no secret value, and the same facts as the default lines, with text only under `--verbose`. In compatibility output `events --json` MUST stay one JSON object per line as the baseline prints it. The value of `schema` is `specstride.inspect.<verb>/1`, the schema id that annex B §B.20 gives to this feature as owner (F100-FR-227); `<verb>` is one of `phases`, `feedback`, `verdicts`, `events`, `tail`. The record is output and has no logical name. `status --json` is the record of the read model (`specstride.view/1`, annex G §G.6) and is not a record of this feature; `watch` has no record of its own and with `--json` prints the record of `events`. The fields are these; the schema files are in `contracts/schemas/` of this feature, are delivered to the `contracts` package, and carry `$id` in the form `urn:specstride:schema:specstride.inspect.<verb>/1`.

  | Record | Fields, in this order | Required |
  |---|---|---|
  | every record | `schema`; `cmd` (the verb); `ok` (truth value); `feature` (the slug) | `schema`, `cmd`, `ok` |
  | a failure, of any verb | `reason` (a member of the closed set of F119-FR-030); `fix` (the fixed fix text of the reason) | both, when `ok` is false |
  | `specstride.inspect.phases/1` | `spec` (relative path); `phases`; `approved`; `current` (a phase number or `done`); `states` (for each state of a phase that occurs, the list of phase numbers) | all, when `ok` is true |
  | `specstride.inspect.feedback/1` | `phase`; `name` (logical name); `bytes`; `lines`; `hash` (first eight characters); `text` (only with `--verbose`, after the redactor) | all but `text`, when `ok` is true |
  | `specstride.inspect.verdicts/1` | `verdicts`: a list of `name`, `bytes`, `hash`, `result`, and `text` only with `--verbose`; `left` (entries left out by the byte limit) | `verdicts`, when `ok` is true |
  | `specstride.inspect.events/1` | `events`: a list of `seq`, `type`, `phase`, `attempt`, where a value that is not known is `null`; `left` | `events`, when `ok` is true |
  | `specstride.inspect.tail/1` | `name` (logical name); `bytes`; `lines` | all, when `ok` is true |

  - divergence: DV-033
  - test: CT-119-15
  - assumption: CQ-099 (answer applied on 2026-09-30 in annex B §B.20; the verbs `status` and `watch` are a reading of this specification)

- **F119-FR-056**: The published package `specstride` MUST hold the CLI as one bundled file of ECMAScript modules, built by the build and never at install. Installing the packed package in an empty directory with install scripts ignored MUST succeed on Linux and on macOS with no compiler, MUST run no install script, MUST download no native module, and the installed `specstride --protocol` MUST exit 0. The bundler and every other tool of the build MUST be development dependencies: the manifest of the packed package MUST name none of them, and MUST hold no install script. Where a platform has no runner, the test MUST report a skip with its reason and never a pass.
  - test: CT-119-19
  - status: unverified (check: CT-119-19 on the Linux runner and on a macOS runner; verified-on: —; pin: Node 22, npm as shipped with it)

#### Requirements moved to `145-presenter`

The presenter, the banner, the theme, the start-up record, the halt banners and the live rules (group G3 of the brief) moved to feature `145-presenter`. The ids F119-FR-034 to F119-FR-055 and F119-SC-007 are never reused; the sequence has a gap. The other requirements keep their numbers.

| Old id | New id |
|---|---|
| F119-FR-034 | F145-FR-001 |
| F119-FR-035 | F145-FR-002 |
| F119-FR-036 | F145-FR-003 |
| F119-FR-037 | F145-FR-004 |
| F119-FR-038 | F145-FR-005 |
| F119-FR-039 | F145-FR-006 |
| F119-FR-040 | F145-FR-007 |
| F119-FR-041 | F145-FR-008 |
| F119-FR-042 | F145-FR-009 |
| F119-FR-043 | F145-FR-010 |
| F119-FR-044 | F145-FR-011 |
| F119-FR-045 | F145-FR-012 |
| F119-FR-046 | F145-FR-013 |
| F119-FR-047 | F145-FR-014 |
| F119-FR-048 | F145-FR-015 |
| F119-FR-049 | F145-FR-016 |
| F119-FR-050 | F145-FR-017 |
| F119-FR-051 | F145-FR-018 |
| F119-FR-052 | F145-FR-019 |
| F119-FR-053 | F145-FR-020 |
| F119-FR-054 | F145-FR-021 |
| F119-FR-055 | F145-FR-022 |
| F119-SC-007 | F145-SC-001 |
| CT-119-16 | CT-145-1 |
| CT-119-17 | CT-145-2 |
| PT-119-C-081-* to PT-119-C-086-*, PT-119-C-096-* to PT-119-C-107-* | PT-145-C-nnn-* of the same cluster |
| PT-119-C-006-*, PT-119-C-007-*, PT-119-C-012-*, PT-119-C-013-* (moved items only) | PT-145-C-006-*, PT-145-C-007-*, PT-145-C-012-*, PT-145-C-013-* |

The moved as-is ids: clusters C-081 to C-086 and C-096 to C-107; items B-0029, B-0030, B-0045, B-0069, B-0195 to B-0198, B-0200, B-0201, B-0229, B-0230, B-0261, B-0262, B-0264 to B-0266, B-0335.

### Key Entities

| Entity | What it is | Annex |
|---|---|---|
| Verb | A first argument the front door routes, from the table of protocol 1 | annex G §G.1 |
| Output mode | Default output or compatibility output | annex G §G.2 |
| Product line | A line whose label starts with `SPECSTRIDE-` | annex G §G.3 |
| Inspection verb | `status`, `tail`, `events`, `verdicts`, `feedback`, `phases`, `watch`; read-only | annex G §G.1 |
| Logical name | The name by which every message names state | annex B §B.5 |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F119-SC-001**: Terse by default. Every inspection command prints at most 1,120 bytes on a success and 2,240 bytes on a failure in default output, on the success fixture and the failure fixture of each command; 0 breaches, 0 absolute paths.
- **F119-SC-002**: Read-only. Inspection commands change 0 files, in the workspace and in the control plane, over every fixture of FX-28: the two trees are byte-identical before and after.
- **F119-SC-003**: Cold start. The 90th percentile of the cold start of `status`, `phases` and `events` over 30 runs is at or below 150 ms on the reference machine.
- **F119-SC-004**: Parity. In compatibility output the oracle reports 0 results `different` for every scenario of FX-28.
- **F119-SC-005**: Exit codes. 100 per cent of the rows of annex G §G.4 that belong to this feature (front door, inspection, `phases`, `spec`, `verify` as routed, unknown subcommand, 70) are ended by a fixture with the code of the row.
- **F119-SC-006**: Data, not instruction. With canary secrets and instruction-like text planted in feedback, transcripts and event fields, 0 of them appear in the default output of any inspection command, and 0 secret canaries appear in any output with `--verbose`.
- F119-SC-007 (colour rules) moved to `145-presenter` as F145-SC-001; the id is not reused.
- **F119-SC-008**: No closed list. 0 lines of the front door's usage, messages and help hold a harness name.
- **F119-SC-009**: Plain install. The packed package installs in an empty directory with install scripts ignored in 100 per cent of the runs on Linux and on the macOS runner, with 0 install scripts, 0 native modules and 0 tools of the build named in its manifest; a platform without a runner is a skip with its reason.

## Constraints

Set by the owner. They are not implementation detail to be removed.

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated. Every statement about macOS is `unverified` | Decision 12; ruling 67 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. The dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| Apache-2.0 licence (owner ruling 2026-10-01, reverses decision 19); no path, account or name specific to the owner's machines | Decision 19 |
| The CLI is one binary named `specstride` | Decision 19; R3 |

What belongs in the plan and not here: libraries and their versions, the package and file layout, the physical paths behind the logical names, the test runner, bundling, and the spelling of internal functions.

## Extension points

This feature implements no extension point. It consumes five.

| EP | Id and version | Relation | What for |
|---|---|---|---|
| EP-01 | `specstride.host/1` | consumes | The CLI protocol half: the commands and the byte-capped output that a host reads (F119-FR-002, F119-FR-013, F119-FR-031, F119-FR-032) |
| EP-02 | `specstride.harness/1` | consumes | The resolved registry is the only source of any harness name (F119-FR-014) |
| EP-03 | `specstride.spec-format/1` | consumes | Phase numbers, titles and counts come from the canonical spec model (F119-FR-008, F119-FR-010, F119-FR-020, F119-FR-024, F119-FR-027) |
| EP-08 | `specstride.event-sink/1` | consumes | A sink reports its delivery status, which `status` prints (F119-FR-025) |
| EP-09 | `specstride.view/1` | consumes | The run state of the compatibility `status` (F119-FR-022, F119-FR-028) |

## Contracts of feature 100 used

| Interface contract | Version | Annex and section |
|---|---|---|
| CLI protocol, commands of protocol 1 | protocol 1 | annex G §G.1, F119 cites F100-FR-170, F100-FR-171 |
| Output modes; line grammar | protocol 1 | annex G §G.2, §G.3, F100-FR-172, F100-FR-175 to F100-FR-178, F100-FR-181 |
| Exit codes per command | as listed | annex G §G.4, F100-FR-182, F100-FR-183 |
| UI read model | `specstride.view/1` | annex G §G.6, F100-FR-188 |
| Presenter interface | `specstride.presenter/1` | annex G §G.10, F100-FR-233 |
| Redactor | `specstride.redaction/1` | annex X §X.4, F100-FR-205 |
| State layout, logical names | `specstride.layout/1` | annex B §B.5, F100-FR-038, F100-FR-053, F100-FR-055 |
| As-is run id form | — | annex B §B.3, F100-FR-046 |
| Run states, stop reasons, engine exit codes | `specstride.run-state/1`, `specstride.stop-reason/1` | annex E §E.2, §E.3, §E.4, F100-FR-148, F100-FR-149 |
| Spec-format port and canonical spec model | `specstride.spec-format/1` | annex C §C.7, F100-FR-095 |
| Event sink and compatibility projection | `specstride.event-sink/1` | annex C §C.10, F100-FR-105 |
| The `parity` profile, closed sets, normalization rules N-02, N-15, N-18 | `specstride.profile/1` | annex X §X.6, §X.7, §X.8 |
| The one published package; no install script, nothing compiled at install | — | annex A, F100-FR-027, F100-FR-029 |
| Further schema ids: the inspection records | `specstride.inspect.<verb>/1` | annex B §B.20, F100-FR-227; common rules of §B.4 |
| Layering rules: hosts read no file; a boundary that is not observed is a call | — | annex A §A.2, F100-FR-002, F100-FR-006, F100-FR-009 |

Fixture family of feature 141 cited: FX-28 (front-door inspection commands). The presenter's families moved with it.

## Rows of the `parity` profile

This feature adds no switch that changes behaviour under the profile. It reads row 18 (`output.compat`) and row 19. The one option below has row 72 of annex X §X.7; feature 110 owns the spelling of every key. The presenter's options are rows 70, 71 and 73 to 78 of `145-presenter`.

| # | Switch | Key | Default | Under `parity` | Owner | Register row |
|---|---|---|---|---|---|---|
| 72 | Verbose output | `output.verbose` | off | not used (compatibility output has no cap) | 119 | DV-033 |

## Closed sets

Stated as F100-FR-208 asks. Owner of each: 119. All are closed by design.

| Closed set | Members | Unknown value |
|---|---|---|
| Verbs of the front door | The commands of annex G §G.1 | Exit 1 with the unknown-subcommand message |
| Reasons of a default-output failure | `no-state`, `no-feature`, `no-log`, `no-events`, `no-verdicts`, `no-verdict-for-phase`, `no-feedback`, `no-spec`, `spec-invalid`, `usage`, `unknown-subcommand`, `internal` | `internal` |
| States of a phase in `phases` | `pending`, `evidence-written`, `rejected(has-feedback)`, `APPROVED` | Not applicable: derived |

The closed sets of the presenter (modes, detail levels, colour depths, colour arguments, backgrounds, colour roles, banner tiers, rail states, live settings) moved to `145-presenter`.

## As-is behaviour not carried

Rows of the traceability files assigned to this feature with the disposition `superseded-by`. The owner approved each (ruling K8).

| As-is id | Behaviour (short) | Register row |
|---|---|---|
| 002 FR-004 | Verbs that Lisa recognizes and does not implement exit 1 with `verb_not_implemented` | DV-042 |
| B-0376 (C-023) | The `wiggum` command alias | DV-036 |
| B-0377 (C-024) | The deprecation line the alias prints | DV-036 |
| B-0378 (C-025) | The forwarding functions of the alias library | DV-036 |
| B-1513 (C-113) | `phases` writes the validator's message to a fixed temporary file | DV-062 |

The eight items of the digest script (B-0338 to B-0345) are assigned to no feature and are `dropped` (DV-061); the digest and `status` replace it.

As-is ids carried, and where:

| As-is id | Disposition | Requirement | Test |
|---|---|---|---|
| 028 FR-023 | merged-with 002 FR-003 | F119-FR-001 | PT-119-028FR023-* |
| 002 FR-001 | merged-with 028 FR-023 | F119-FR-003 | CT-119-1 |
| 002 FR-002 | merged-with 028 FR-023 | F119-FR-004 | CT-119-2 |
| 002 FR-003 | merged-with 028 FR-023 | F119-FR-002 | CT-119-3 |
| 002 FR-005 | ported | F119-FR-011 | CT-119-4 |
| 002 FR-007 | merged-with 028 FR-023 | F119-FR-005 | CT-119-5 |
| The clusters C-009, C-108, C-109, C-111 to C-115 and the items of C-006, C-012, C-013 that stayed (B-0009, B-0034, B-0187, B-0235) | as in the traceability files | F119-FR-002 to F119-FR-033 | PT-119-C-nnn-* |

## Clarifications

### Session 2026-09-29

Questions of `speckit-specify` and `speckit-clarify`, answered from the sources. No question was put to a person.

- Q: Who owns the compatibility form of `status`, given that feature 129 owns its data and default output? → A: This feature owns the compatibility output; the state is derived from the read model of annex G §G.6. (Source: R15v E-3; brief 119 heading 1; `feature-briefs.md` D.3)
- Q: Does the port implement the verbs that Lisa recognizes and does not implement? → A: Yes; 028's front door wins and `002 FR-004` is superseded. (Source: DV-042; ruling K8)
- Q: Which exit code does an unknown argument of the engine call give? → A: 3 with the usage on standard error; each inspection verb collects an unknown argument as an extra. (Source: brief 119 heading 3; B-0108; B-1558)
- Q: Does exit 70 belong to every command? → A: Yes, to every command on an uncaught error; the baseline is silent, Lisa's rule stands. (Source: F100-FR-182; `consolidation.md` section 3.12)
- Q: Are the presenter, the banner and the theme public commands? → A: No. Only `spec`, `verify` and `learn` are public; the others are internal calls with the as-is flags, and their exit codes are result-record fields. (Source: ruling 26; F100-FR-171; LR-6)
- Q: Does `phases` still write a fixed temporary file? → A: No; the message is held in memory. (Source: DV-062; R19 D-24)
- Q: What does default output print for text from outside the runtime? → A: A reference by logical name, size and hash; text only under `--verbose`, redacted and framed as data. (Source: R11 T-12, T-33; F100-FR-177)
- Q: What are the byte limits? → A: 1,120 bytes on a success and 2,240 on a failure, from 400 and 800 tokens at 2.8 bytes per token. (Source: R17 part 2)
- Q: Is the old command alias carried? → A: No. (Source: DV-036)
- Q: Which questions could the sources not answer? → A: Seven, listed under "Assumptions" as CQ-094 to CQ-099 and CQ-100; CQ-184 was added by the cross-feature review; CQ-041 of feature 104 bears on F119-FR-024.

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary.
- The divergence register is `consolidation.md` section 6; this specification cites rows of it and states no count of them.
- Where the architecture file, the brief and a ruling differ, the ruling stands.
- The compatibility projection (feature 111) exists when the fixtures that compare `status` run.

Readings that the sources do not settle. Each is marked in its requirement and reported to the orchestrator.

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-094 | What lines does default output print for the inspection verbs? The sources give the rules (one line, relative paths, no free text) and no line | The lines and the closed failure reasons of F119-FR-030 | F119-FR-030 |
| CQ-095 | Does the byte limit apply to a following form, to the usage, and what lifts it? | It applies to what is printed before following; the usage is at most 2,240 bytes; `--verbose` lifts it on a success | F119-FR-004, F119-FR-031 |
| CQ-096 | What does "framed as data" mean? | A begin line and an end line with a fresh 64-bit token | F119-FR-032 |
| CQ-097 | Is the spec path in `phases` printed as at the baseline in compatibility output? | Yes, as the baseline prints it; relative only in default output | F119-FR-020 |
| CQ-098 | Which status does a value-less flag give in a port with no shell? | The baseline's, 127 on the reference shell; F100 annex G has no row | F119-FR-005 |
| CQ-099 | Schema ids of the `--json` records of the inspection verbs | One record with `schema` set to `specstride.inspect.<verb>/1`, owned here. The answer is applied in annex B §B.20 (2026-09-30); it is not ruled by the owner | F119-FR-033 |
| CQ-184 | Which check of `resume` comes first on a workspace without state? | The state check of F119-FR-009, which exits 1, as at the baseline (B-1482 before B-1494); annex G §G.4 says so | F119-FR-009 |
| CQ-100 | What does `watch` print in default output, and is it this feature's in Wave 1 given that 121 is Wave 2? | The card of the presenter, with default-output milestones; Wave 1 until a follower replaces it | F119-FR-021 |

## Repairs after the cross-feature review

Dated 2026-09-30. From the section of feature 119 of `docs/ecosystem/reviews/REPAIR-WORKLIST.md`. No id was renumbered or reused; F119-FR-056, F119-SC-009, CT-119-18 and CT-119-19 are appended after the ids that moved to `145-presenter`.

| Item | Requirement | Changed in place or added | What changed |
|---|---|---|---|
| W-119-01 | F119-FR-056, F119-SC-009 | added | The bundle of the published package and the plain install on Linux and macOS, test CT-119-19; the plan names the bundler as a development dependency, the tasks build the bundle and test the plain install (T064, T065) |
| W-100-24 (CQ-184) | F119-FR-009 | changed in place | The state check is the first check of `resume` and exits 1; test CT-119-18; `assumption: CQ-184` |
| Row 29 of the table of feature 100 (annex G §G.4 as repaired) | F119-FR-003 | changed in place | Exit 1 is for an unknown first argument (verb); an unknown sub-verb of a routed command keeps the code of its row |
| W-X-06 | F119-FR-017, F119-FR-018 | changed in place | "engine start" where one start of the engine is meant; `workspace:current:events` and `workspace:current:engine-log` resolve as F100-FR-055 says |
| W-X-26 (CQ-099) | F119-FR-033 | changed in place | The schema id is cited from annex B §B.20; the fields are listed; the schema files are delivered in `contracts/schemas/` |
| W-X-31 | F119-FR-015 | changed in place | "startup check" in place of "startup gate" |
| W-X-05 | Assumptions | changed in place | The register is named without a count |
| W-X-08 | — | plan, row XVIII | The list of divergence rows replaced by "the rows in the `divergence:` fields of `spec.md`" |
| W-X-09 | F119-FR-015, F119-FR-056 | plan, row XVII; tasks T066 | Row XVII answered as a pass with its reason; the macOS result or the skip with its reason is a task |
| W-X-14 | — | plan, the GATE line; tasks T001 | The Constitution Check carries the gate line of the plan template; T001 no longer creates `present/`, which moved to `145-presenter` |
| W-X-20 | F119-FR-004, F119-FR-005 | tasks T059 to T062 | The parity families PT-119-C-109, PT-119-C-009, PT-119-C-012 and PT-119-C-013 of the `test:` lines have their test tasks; CT-119-18 has T063 |
| B-8.7 | F119-FR-014, F119-FR-015, F119-FR-031, F119-FR-032 | tasks T002, T017, T026 | CT-119-7, CT-119-13 and CT-119-14 had no task that named them, and T017 gave CT-119-8 (the startup check of F119-FR-015) a wrong subject: T002 is now CT-119-8, T017 is CT-119-6 and CT-119-7 (and proves F119-SC-008), T026 names CT-119-12 to CT-119-15 one by one |
| B-8.7 | F119-FR-015, F119-FR-056 | plan, row XVII and tree; tasks T065, T066 | The own tests, CT-119-8 and CT-119-19 included, are in `tests/characterization/119/`, the directory of feature 100; T066 runs the tests of the feature on the macOS runner of the build workflow when it exists and records each result or skip with its reason in one named file |
| B-8.7 | F119-FR-033 | `contracts/schemas/` | The five schema files encode the fields that the table requires when `ok` is true, and `reason` and `fix` when it is false; `attempt` of an event is an integer, as the default line `attempt=<n>` gives it |
