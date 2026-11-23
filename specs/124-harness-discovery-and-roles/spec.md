# Feature Specification: Harness roles and the critic order

**Feature Branch**: `124-harness-discovery-and-roles` (a label: Spec Kit creates no branch in this repository; the directory is `specs/124-harness-discovery-and-roles`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 124-harness-discovery-and-roles of Specstride, after the split: the resolved registry written at launch with provenance; role resolution into a plan per phase and role with the fallbacks the consumer opted into; how a role is named; the guarantee about the proposer; the critic order; qualification and ranking of critic candidates; the automatic pick of a diverse critic, its announcement and its switch; the same-model warning." The directory keeps its name. Harness discovery left with the split and is feature 146-harness-discovery.

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority), `architecture.md`, `consolidation.md`, `feature-briefs.md` (brief 124-harness-discovery-and-roles), `STAGE-B-RULES.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182), feature 100 (annexes A, B, C, E, G, X), feature 141 (§O.1 to §O.7), and the research reports R20, R16, R11, R14, R15v, R23v and R29v.

## What this feature is

At launch the product knows which harnesses the consumer has: the resolved registry lists them
(feature 100, annex C §C.6, field `harnesses`). This feature decides which harness plays which
role in every phase. It turns the list, the configuration and the decisions of the terms gate
into a role plan, picks a diverse critic when the consumer configured none, and writes the
resolved registry.

**In scope**: the resolved registry and its replay; role resolution and the role plan; how a role
is named; the proposer guarantee; the default roles; the critic order; qualification and ranking;
the automatic pick, its announcement and its switch; the critic-diversity rule and the
critic-diversity warning.

**Out of scope**:

| Out of scope | Owner |
|---|---|
| Harness discovery: sources, probes, the context window, the states of a harness | 146 |
| The registry, the harness port, the schema of the harness descriptor, the generic harness adapter, the two forms of the `completion` level | 109 |
| What a critic with read-only tools is given and what is hidden from it | 117 |
| Whether a harness offers a critic form, and its proof | Its harness adapter: 125, 130, 131, 134, 138 |
| Evaluation of the terms gate, and the spelling of every configuration key | 110 |
| What happens when a fallback is used during a run; the value and the enforcement of a spending cap | 127 |
| Display of the registry and of the pick by the doctor | 112 |
| The digest line | 123 |
| The catalogue of event types | 111 |
| Model-tier escalation inside a phase attempt | 115 (it never changes a role) |

## User Scenarios & Testing *(mandatory)*

User stories 2 and 6 left with the split. The numbers of the others are kept.

### User Story 1 - A run gets a diverse critic without configuration (Priority: P1)

A consumer launches a run and has configured no critic. They have a model endpoint of another
provider on their machine. The product picks it as the critic, says so at launch, and the pick is
in the digest.

**Why this priority**: The phase gate is only as good as the independence of the critic. Most
consumers configure nothing, so the default path decides the quality of most runs. It is the
success criterion this feature owns (`feature-briefs.md` section D.5).

**Independent Test**: The descriptor-only fixture of the harness port, extended: a harness
descriptor for a fake endpoint in user configuration, no critic configured. One launch shows the
announcement line, the `critic.selected` event and the digest field, all naming the fake endpoint.

**Acceptance Scenarios**:

1. **Given** no configured critic and one qualifying discovered endpoint, **When** the run launches, **Then** the endpoint is the critic of every phase, the launch prints one line that names harness, model, step 3, state and the source of the window, and the event `critic.selected` and the digest name the same harness (F124-FR-037, F124-FR-043).
2. **Given** a configured critic and a qualifying discovered endpoint, **When** the run launches, **Then** the configured critic is used and the record shows step 1 (F124-FR-037).
3. **Given** candidates of both forms of the `completion` level in step 3, **When** they are ranked, **Then** every tool-less candidate stands before every candidate with read-only tools (F124-FR-040).
4. **Given** a candidate with read-only tools whose harness adapter cannot confirm the read denial of the withheld paths, **When** it would be used, **Then** it is passed over, the next candidate of the order is used, and both facts are announced and recorded (F124-FR-041).
5. **Given** a metered candidate and no spending cap for an automatic pick, **When** candidates are qualified, **Then** the candidate does not qualify and the record says why (F124-FR-042).
6. **Given** the automatic pick switched off, **When** the run launches without a configured critic, **Then** steps 2 and 3 are skipped and step 4 applies (F124-FR-044).

---

### User Story 3 - The proposer is what the consumer said (Priority: P1)

A consumer names the proposer, or relies on the shipped default. Whatever discovery finds, the
proposer stays the one the consumer chose. When the proposer is not there, the launch is refused
and the consumer sees what is there.

**Why this priority**: The proposer writes to the working tree. A proposer chosen by discovery
would hand the working tree to a harness the consumer never chose (R15v B-3).

**Independent Test**: A fixture in which the default proposer is absent and a discovered harness
is present: the launch is refused and the refusal names the discovered harness.

**Acceptance Scenarios**:

1. **Given** any set of discovered harnesses, **When** roles are resolved, **Then** the proposer of every phase comes from a flag, the environment, configuration or the shipped default, and the record names which (F124-FR-024).
2. **Given** an absent proposer, **When** the run launches, **Then** the launch is refused and the refusal names the discovered candidates (F124-FR-024).
3. **Given** no role named, **When** the run launches, **Then** the default harness plays both roles on different model tiers (F124-FR-025).
4. **Given** a name that the resolved registry does not hold, **When** the run launches with the default settings, **Then** the launch is refused with the list of the registry; **Given** the `parity` profile, **Then** the as-is behaviour is reproduced (F124-FR-028, F124-FR-029, F124-FR-030).

---

### User Story 4 - A run resumes with the same roles (Priority: P2)

A run is resumed or relaunched. It uses the roles that were resolved at launch.

**Why this priority**: A critic that changes between two phase attempts of one phase makes
verdicts incomparable.

**Independent Test**: Launch, stop, add a better candidate to the machine, resume: the role plan
is unchanged. Resume with the flag that asks for a new resolution: the plan is resolved again.

**Acceptance Scenarios**:

1. **Given** a stored resolved registry, **When** the run is resumed, **Then** the record is read and nothing is ranked again (F124-FR-022).
2. **Given** a stored pick whose harness no longer exists, **When** the run is resumed, **Then** roles are resolved again, announced and recorded (F124-FR-022).
3. **Given** a harness whose version or descriptor hash changed since launch, **When** the run is resumed, **Then** a warning is raised and the pick stays (F124-FR-022).

---

### User Story 5 - A same-model setup warns and runs (Priority: P2)

A consumer has one provider only. Proposer and critic resolve to the same model. The run
proceeds, and the consumer is told.

**Why this priority**: The constitution asks for the warning and forbids the block (Principle II).

**Independent Test**: A fixture in which both roles resolve to one model: the warning is printed
and recorded, and the launch proceeds.

**Acceptance Scenarios**:

1. **Given** critic and proposer on the same model, **When** the run launches, **Then** the critic-diversity warning is raised, recorded in the resolved registry and in an event, and the launch proceeds (F124-FR-045).
2. **Given** the same model with a higher effort for the critic, **When** the run launches, **Then** it is not a collision and the warning is raised (F124-FR-045).
3. **Given** a pass in a phase attempt that ran on the model of the critic, **When** the critic-class call is about to start, **Then** the warning is raised and recorded and the call proceeds (F124-FR-046).
4. **Given** critic and proposer on different models of one provider, or on different models of one model tier, **When** the run launches, **Then** the warning is not raised (F124-FR-045).

---

### Edge Cases

- A gateway alias whose real model is unknown: eligible, recorded as diversity unverified, with the warning (F124-FR-047).
- A harness descriptor claims another provider than the host of its endpoint shows: the identity of the endpoint host is used (F124-FR-047).
- A harness with unknown terms is the only other harness on the machine: it is not picked; step 4 applies (F124-FR-039).
- The default harness has one model tier only: step 4 uses the same model, with the warning (F124-FR-037).
- No harness can play the critic: the launch is refused, with the reason per candidate (F124-FR-037).
- Every candidate of steps 2 and 3 fails qualification: step 4 applies, and the record holds the reason per candidate (F124-FR-038).
- The first call of an automatically picked critic does not prove its form: the candidate is passed over for the next of the order (F124-FR-048).
- The worker root of parallel units is not empty after one sweep before a critic-class call of a critic with read-only tools: the next candidate of the order is used (F124-FR-041).
- A harness of the list has no known context window: it never qualifies as a critic (condition Q4).
- macOS: every statement of this specification about macOS is `unverified` (F124-FR-049).

## Requirements *(mandatory)*

### Functional Requirements

Requirements with no as-is origin name a characterization test `CT-124-<n>`, where n is the
number of the requirement. One name is outside this pattern: `CT-124-50` is the characterization
test of item B-0640 (F124-FR-031) and belongs to no requirement 50. The groups are G3 and G4 of heading 7 of the brief. Groups G1 and G2,
F124-FR-001 to F124-FR-019, left with the split; the table "Requirements moved to
146-harness-discovery" names their new ids. The numbers are not reused.

#### G3 — Role resolution, the plan, fallbacks, the proposer guarantee

- **F124-FR-020**: Role resolution MUST be a function of the resolved registry, the resolved configuration and the decisions of the terms gate, and of nothing else. The same inputs MUST give the same role plan. It MUST run at launch. No loop layer, no router and no model-tier escalation MUST call it or change a role.
  - test: CT-124-20
  - ep: EP-02 `specstride.harness/1` (implements)

- **F124-FR-021**: At launch the product MUST write one resolved registry with its role plan at `run:<runId>:registry`, with the fields of feature 100, annex C §C.6. Every harness MUST carry its state, its origin, its version, the hash of its harness descriptor, its resolved path and its capabilities with provenance.
  - test: CT-124-21
  - ep: EP-02 `specstride.harness/1` (implements)

- **F124-FR-022**: A resume and a relaunch MUST read the stored record and MUST NOT discover or rank again. Roles MUST be resolved again only when the consumer asks by flag or when a harness of the stored plan no longer exists; the new resolution MUST be announced and recorded. A changed harness version or descriptor hash MUST give a warning and MUST NOT change the pick.
  - test: CT-124-22
  - ep: EP-02 `specstride.harness/1` (implements)
  - assumption: CQ-106 (the name of the flag; feature 100 names none)

- **F124-FR-023**: Role resolution MUST resolve every role of the role registry for every phase, with the per-phase settings of the consumer applied. Each entry of the plan MUST hold harness, model, model tier, auth tier, transport, form of the `completion` level, containment level, and the decision of the terms gate with the row it rests on. A role that makes critic-class calls MUST be resolved under the rules of the critic, and a role that makes passes under the rules of the proposer.
  - test: CT-124-23
  - ep: EP-02 `specstride.harness/1` (implements)

- **F124-FR-024**: The proposer MUST come from one of four sources: a flag, the environment, configuration, the shipped default. The resolved registry MUST record which. Discovery MUST never set or change the proposer. When the proposer is absent the launch MUST be refused, and the refusal MUST name the discovered harnesses that support the role.
  - test: CT-124-24
  - ep: EP-02 `specstride.harness/1` (implements)
  - divergence: DV-004
  - parity: every fixture names the proposer and the critic (row 36 of annex X §X.7)

- **F124-FR-025**: With no role named, the default harness of Wave 1, Claude, MUST play the proposer and the critic, on different model tiers. Every other harness MUST play a role only when the consumer names it or when the critic order picks it.
  - test: CT-124-25
  - divergence: DV-004
  - parity: every fixture names both roles; the one fixture of the defaults, `FX-01/defaults-no-role-named`, is waived (row 36 of annex X §X.7)

- **F124-FR-026**: The harness of the critic MUST be named by the key of row 36 of the `parity` profile, by its as-is variable as an alias of that key, or by a flag. The as-is spelling of a name, a bare name or a name with a qualifier after a colon, MUST be accepted. A name MUST NOT be refused when arguments are parsed. A selection of the critic in project configuration MUST be ignored, with a launch message that names the key and with a doctor warning.
  - origin: C-060; B-0799; C-061; B-0845
  - disposition: translated
  - test: PT-124-C-060-*; PT-124-C-061-*
  - divergence: DV-066; DV-027

- **F124-FR-027**: The model of a role MUST have no default in the product. Where the consumer names none, the plan MUST record null, the harness MUST use the model of its own configuration, and no model argument MUST be passed.
  - origin: C-051; B-0467
  - disposition: translated
  - test: PT-124-C-051-*
  - divergence: DV-066

- **F124-FR-028**: Role resolution MUST refuse a launch that names, for any role, a harness that the resolved registry does not hold. The refusal MUST list the harnesses of the registry that support the role. This check MUST be a switch that is on by default.
  - test: CT-124-28
  - divergence: DV-104
  - parity: off: a name that the registry does not hold is carried into the run, as at the baseline (row 90 of annex X §X.7)

- **F124-FR-029**: With the check of F124-FR-028 off, a proposer name that the registry does not hold MUST make every pass end with the result 127 and the message `unknown backend '<name>' (<list>)` after the logical component name of the pass loop, where the list is that of F124-FR-031. The pass loop MUST go on until a breaker or the pass limit ends it.
  - origin: C-054; B-0575
  - disposition: translated
  - test: PT-124-C-054-*
  - divergence: DV-064

- **F124-FR-030**: With the check of F124-FR-028 off, a critic name that the registry does not hold MUST make the critic-class call fail with the message `unknown SPECSTRIDE_CRITIC provider: <name> (<list>)`. The failure MUST be scored as MALFORMED with the result 10, and never as a configuration error with the result 3.
  - origin: C-066; B-0996
  - disposition: translated
  - test: PT-124-C-066-*
  - divergence: DV-064

- **F124-FR-031**: Wherever the product prints the list of the harnesses of a role (usage text, a refusal, an error message), it MUST render the list from the registry at that moment, in the order of the registry, each entry in its as-is spelling (`name`, `name[:label]` or `name:label`), joined by ` | `. No such list MUST be written by hand.
  - origin: C-012; B-0188; C-057; B-0640
  - disposition: ported
  - test: PT-124-C-012-*; PT-124-C-057-*; CT-124-50
  - divergence: DV-064

- **F124-FR-032**: Role resolution MUST ask the terms gate for every entry of the plan, the fallbacks included, and MUST record each decision with its row. An entry that the terms gate refuses MUST NOT enter the plan; a refused primary of a role MUST refuse the launch. Every fallback MUST be recorded as to be gated again when it is used.
  - test: CT-124-32
  - ep: EP-11 `specstride.terms/1` (consumes)
  - divergence: DV-048
  - parity: audience `personal` (row 34 of annex X §X.7)

- **F124-FR-033**: The plan of a role MUST hold, after the primary, only the fallbacks the consumer opted into, in the consumer's order, accepted from user configuration, the environment and flags only. Without an opt-in the list MUST be empty. Role resolution MUST never add a fallback by itself.
  - test: CT-124-33
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: off: no fallback is configured (row 40 of annex X §X.7)

- **F124-FR-034**: For every harness that plays a role, role resolution MUST call `preflight` of the harness port for that role. A failed preflight of a primary MUST refuse the launch and MUST name what is missing. A failed preflight of a candidate of the critic order MUST disqualify the candidate.
  - test: CT-124-34
  - ep: EP-02 `specstride.harness/1` (consumes)

- **F124-FR-035**: A refusal of role resolution MUST end `launch` with the handshake outcome `refused` and exit 4, and a foreground `run` with exit 3. It MUST write no run state.
  - test: CT-124-35
  - assumption: CQ-107 (the exit code of a foreground `run` that role resolution refuses; annex G §G.4 gives 3 for invalid input)

- **F124-FR-036**: A harness that the consumer names and whose terms are unknown MUST be usable at auth tier 1 or 2, with the unknown-terms warning at launch and in the doctor. A harness whose terms are unknown MUST never be a default, MUST never be picked automatically as critic, and MUST never be added as a fallback by the product.
  - test: CT-124-36
  - ep: EP-11 `specstride.terms/1` (consumes)
  - divergence: DV-048

#### G4 — Critic order, qualification, automatic pick, announcement, warnings

- **F124-FR-037**: The critic MUST be chosen by the four steps of feature 100, annex C §C.6, in order: the critic the consumer configured; a second model through the gateway of the host; a qualifying discovered harness; the default harness on a different model tier, in a fresh session, without tools, with a set budget. Discovery and the automatic pick MUST never override a configured critic. The automatic pick MUST be made once per launch and MUST hold for every phase for which the consumer configured no critic. Where step 4 finds no other model tier, the default harness MUST be the critic on the same model, with the critic-diversity warning of F124-FR-045. Where no harness can play the critic at all, the launch MUST be refused as in F124-FR-035, and the refusal MUST name the candidates with the reason each one failed.
  - test: CT-124-37
  - ep: EP-02 `specstride.harness/1` (implements)
  - divergence: DV-049
  - parity: not reached: every fixture names the critic (row 35 of annex X §X.7)

- **F124-FR-038**: A candidate of step 2 or step 3 MUST qualify only when all conditions of the table "Conditions of qualification" under "Closed sets" hold. For every candidate that does not qualify, the resolved registry MUST record the first condition that failed.
  - test: CT-124-38
  - divergence: DV-049

- **F124-FR-039**: An unverified harness of kind `cli` MUST never be picked automatically. An unverified endpoint MAY be. A candidate of the form `read-only-tools` MUST qualify only through a tested harness adapter, also on a subscription. A harness that cannot switch its native memory off MUST never qualify.
  - test: CT-124-39
  - divergence: DV-081
  - parity: not reached: every fixture names the critic (rows 28, 35 of annex X §X.7)

- **F124-FR-040**: The candidates of step 3 MUST be ranked by a table that the table evaluator evaluates, compared in this order, stopping at the first difference: form of the `completion` level (tool-less first); state (`tested`, `locally-verified`, `declared`, `detected`); cost class (`local` and `subscription`, then `metered` by rising price of output, then `unknown`); quota (no limit signal seen before one seen); context window (larger first); harness id and then model id, in byte order. The decision MUST be recorded with its rule id and the version of the table.
  - test: CT-124-40
  - ep: EP-02 `specstride.harness/1` (implements)

- **F124-FR-041**: A candidate of the form `read-only-tools` MUST be passed over, and the next candidate of the order MUST be used, when its harness adapter cannot confirm the read denial of the withheld paths, or when the worker root of parallel units is not empty after one sweep before the call. The role plan MUST therefore hold, for an automatically picked critic, the ranked runners-up and step 4 after them. Every pass-over MUST be announced and recorded with its reason. A configured critic is never passed over: it is refused as feature 100, annex C §C.4 says.
  - test: CT-124-41
  - ep: EP-02 `specstride.harness/1` (consumes)
  - divergence: DV-081
  - status: unverified (check: the read-only sandbox of the first harness of this form denies reads of the withheld paths; verified-on: —; pin: version of that harness at the capture)

- **F124-FR-042**: A candidate of cost class `metered` MUST qualify for an automatic pick only while a hard spending cap for the automatically picked critic is set. The cap MUST be in the launch announcement. Without it the candidate MUST NOT qualify, with the reason `no-spend-cap`.
  - test: CT-124-42
  - divergence: DV-049
  - parity: not used (row 91 of annex X §X.7)

- **F124-FR-043**: The choice of the critic MUST be announced at launch in one line that names harness, model, step, state, form, source of the window and, for a metered pick, the cap. It MUST be recorded in the field `criticPick` of the resolved registry with the ranked runners-up, and in the event `critic.selected`. The digest MUST name the picked harness. The lines of this feature at one launch MUST stay within three lines and 600 bytes. Under the `parity` profile none of these lines MUST be printed.
  - test: CT-124-43
  - divergence: DV-049; DV-034
  - parity: no new line (row 19 of annex X §X.7)

- **F124-FR-044**: The automatic pick MUST be a switch that is on by default and that the consumer can turn off by configuration, environment or flag. With it off, steps 2 and 3 MUST be skipped and step 4 MUST apply.
  - test: CT-124-44
  - divergence: DV-049
  - parity: not reached: every fixture names the critic (row 35 of annex X §X.7)

- **F124-FR-045**: The critic-diversity rule is: the critic-diversity warning MUST be raised when, and only when, the critic and the proposer of a phase resolve to the same model (F100-FR-024), which is the result `same-model` of the diversity test of F124-FR-047, or that test gives the result `unverified`. A shared provider alone (the result `same-provider`) and a shared model tier alone MUST NOT raise it. A higher effort on the same model MUST NOT count as a different model: it is allowed, and the warning MUST be raised. The warning has one name, "critic-diversity warning"; `same-model` is a result of the diversity test and not a name of the warning. The warning MUST be raised at launch, recorded in the field `criticPick` of the resolved registry and in an event, and shown by the doctor. It MUST never block a launch or a run and MUST never be a launch check. The consumer MAY silence the line; the record and the event MUST stay.
  - test: CT-124-45
  - parity: not printed (rows 19 and 92 of annex X §X.7)

- **F124-FR-046**: The critic-diversity rule of F124-FR-045 MUST also be applied before every critic-class call: the resolved model of the call is compared with the models that produced passes in the phase attempt. A match MUST raise and record the warning, and the call MUST proceed. This feature supplies the rule and the record; the engine applies it through feature 100, annex E §E.1.
  - test: CT-124-46
  - ep: EP-18 `specstride.critic-strategy/1` (consumes)

- **F124-FR-047**: Diversity MUST be decided on the identity of the provider and on the model id that is sent, never on the wire format. For an endpoint the identity of the provider MUST come from the host of the endpoint, not from a label of the harness descriptor. A candidate whose real model is not known MUST be eligible, recorded with the diversity result `unverified`, with the critic-diversity warning.
  - test: CT-124-47

- **F124-FR-048**: A claim of a harness that it is a critic without tools on another provider MUST be believed only as far as the proof of its first call proves: the initial record of the harness's stream or, where a tested harness adapter's stream carries no initial record, the weaker proof of Principle IX (constitution v3.0.1, CQ-182: exact version pin, flag set and preflight), recorded on every call as the weaker proof. When the proof of the first call of an automatically picked critic fails, the candidate MUST be passed over as in F124-FR-041, and the failed call MUST produce no verdict.
  - test: CT-124-48
  - ep: EP-02 `specstride.harness/1` (consumes)

- **F124-FR-049**: The ranking and the pick MUST be offered as a reading that writes nothing, so that the doctor can show the pick the product would make and why every other candidate lost. Every statement of this specification about macOS is `unverified`.
  - test: CT-124-49
  - ep: EP-14 `specstride.doctor/1` (consumes)
  - status: unverified (check: role resolution gives the same records on a macOS runner as on Linux for the same fixture; verified-on: —; pin: macOS version of the runner)

### Key Entities

| Entity | What it is |
|---|---|
| Harness entry | One entry of the field `harnesses` of the resolved registry, as feature 100, annex C §C.6 describes it. A candidate for the critic is such an entry |
| Resolved registry | The record of one launch: every harness, the roles, the role plan, the choice of the critic, the announced lines (`specstride.registry/1`) |
| Role plan | Per phase and role the ordered entries to use: the primary, then the fallbacks the consumer opted into; for an automatically picked critic the ranked runners-up |
| Critic pick | How the critic was chosen: step, state, form, window with its source, reason, runners-up, diversity result |
| Ranking table | The versioned data of the ranking, evaluated by the table evaluator |

## Success Criteria *(mandatory)*

### Measurable Outcomes

F124-SC-002, F124-SC-003 and F124-SC-007 left with the split.

- **F124-SC-001**: With no critic configured, a qualifying discovered harness is picked as the diverse critic and the pick appears in the digest. Measure: on the extended descriptor-only fixture the announcement line at launch, the event `critic.selected` and the digest field name the picked harness, in 100 per cent of runs.
- **F124-SC-004**: The critic-diversity rule and its warning. Measure: in a same-model setup the warning is raised and recorded and the launch proceeds, in 100 per cent of the cases of the fixture; the warning blocks 0 launches.
- **F124-SC-005**: The proposer is never chosen by discovery. Measure: over all fixtures of this feature, the proposer of the role plan equals the value of the flag, the environment, the configuration or the shipped default in 100 per cent of launches.
- **F124-SC-006**: The pick is reproducible. Measure: the same registry and configuration give the same role plan and the same ranked runners-up in 100 per cent of 100 repeated resolutions, and a resume changes 0 entries of the plan.
- **F124-SC-008**: No closed list. Measure: 0 requirements, messages and tests of this feature enumerate harnesses other than by reading the registry.

## Constraints

Set by the owner. They are not implementation detail to be removed.

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime harness adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| Choosing the proposer and the critic is not a routing question | Decision 20 |
| The Wave 1 default is Claude as proposer and as critic; the other tested harness adapters of Wave 1 are chosen by the consumer or by the critic order | Decision 13; rulings 32b, 57 |

What belongs in the plan and not here: libraries and their versions, the package and file layout,
physical paths behind logical names, the test runner, bundling, and the spelling of internal
functions.

## Extension points

| EP | Id and version | Relation | What for |
|---|---|---|---|
| EP-02 | `specstride.harness/1`, `descriptorVersion: 1` | implements the sub-point role resolution; consumes `preflight` and the fields `roles`, `cost`, `memory` and `provider` of the harness descriptor | Role resolution writes the resolved registry and the role plan |
| EP-11 | `specstride.terms/1` | consumes | The decision of the terms gate for every entry of the plan |
| EP-14 | `specstride.doctor/1` | consumes | The fields `registry` and `pick` of the doctor's findings are filled from this feature's reading |
| EP-18 | `specstride.critic-strategy/1` (internal seam) | consumes | The engine applies the critic-diversity rule before every critic-class call |

## Contracts of feature 100 used

| Interface contract | Version | Annex and section |
|---|---|---|
| Harness port: `preflight`; the proposer guarantee | `specstride.harness/1` | Annex C §C.1, F100-FR-076 to F100-FR-080 |
| Harness descriptor; states of a harness; rules for secrets and redirects | `descriptorVersion: 1` | Annex C §C.2, F100-FR-084 to F100-FR-086 |
| Forms of the `completion` level; withheld paths | part of `specstride.harness/1`; `specstride.withheld-paths/1` | Annex C §C.3, §C.4, F100-FR-087, F100-FR-089 |
| Resolved registry and role plan, with the field `harnesses` as the list that is ranked; critic order; roles as an open registry | `specstride.registry/1` | Annex C §C.6, F100-FR-092 to F100-FR-094 |
| Terms-gate data | `specstride.terms/1` | Annex C §C.12, F100-FR-108 |
| Layering rule on role resolution; registries replayed on resume; no closed list; the critic-diversity warning | — | Annex A §A.2, §A.4, §A.5: F100-FR-008, F100-FR-016, F100-FR-023, F100-FR-024 |
| Logical names `run:<runId>:registry`, `user:config`, `project:config` | `specstride.layout/1` | Annex B §B.5, F100-FR-053 |
| Critic strategy seam: the guarantee that the critic-diversity warning is raised and recorded | internal seam | Annex E §E.1 |
| CLI protocol, output modes, line grammar, exit codes of `launch`, `run` and `harness verify` | protocol 1 | Annex G §G.1 to §G.4, F100-FR-176, F100-FR-178, F100-FR-186 |
| Doctor findings, fields `registry` and `pick` | `specstride.doctor/1` | Annex G §G.7 |
| Event envelope | `specstride.event/1` | Annex X §X.1 |
| Config envelope, ranks and trust classes | `specstride.config/1` | Annex X §X.2, F100-FR-201, F100-FR-202 |
| Table evaluator | `specstride.table/1` | Annex X §X.3, F100-FR-204 |
| Closed sets, rows 33, 34, 43 and 72 | — | Annex X §X.6 |
| The `parity` profile, rows 19, 28, 34, 35, 36, 40, 90, 91, 92 | `specstride.profile/1` | Annex X §X.7, F100-FR-212 |
| Environment alias table; component-name table; rule N-15 | `specstride.oracle-normalization/1` | Annex X §X.8 |
| Threats T-03, T-14, T-48 | — | Annex X §X.9 |

Fixture families of feature 141 used: FX-01 (§O.2), with the scenarios `harness-generic` and
`defaults-no-role-named`; the scenario `FX-07/unknown-harness-name`, which proves item B-0996;
the scenario `FX-18/unknown-harness-name`, which proves item B-0575. Both are scenarios of
feature 141. No scenario reaches item B-0640, the usage text of the pass loop: its proof is the
characterization test `CT-124-50`. Behaviour with no reference is tested as §O.7 says.

## Rows of the `parity` profile

Rows of feature 100, annex X §X.7, that this feature owns or shares:

| Row | Switch | Key | Default | Under `parity` | Register row |
|---|---|---|---|---|---|
| 35 | Automatic pick of the critic | `critic.autoPick` | on | not reached: every fixture names the critic | DV-049 |
| 36 | Default proposer and critic | `roles.proposer.harness`, `roles.critic.harness` | The default harness for both, on different model tiers | Every fixture names both | DV-004 |
| 28 | Transport and mode of the critic of each harness (shared) | `roles.critic.transport` | As the row says | The as-is transport and mode | DV-001; DV-081; DV-090 |
| 90 | Refusal at launch of a role name that the registry does not hold | `roles.refuseUnknown` | on | off | DV-104 |
| 91 | Hard spending cap of an automatically picked metered critic | `critic.autoPickMaxUsd` | not set; a metered candidate then does not qualify | not used | DV-049 |
| 92 | Line of the critic-diversity warning | `critic.warnSameModel` | true | not printed | DV-034 |

Rows 90, 91 and 92 are rows of annex X §X.7, owned by this feature. The keys are confirmed in
the key list of feature 110, which owns the spelling. The key of row 92 keeps its name; the
warning it silences is the critic-diversity warning. Earlier texts of this feature called the
three rows P-3, P-4 and P-6; the labels P-1 to P-6 are not used any more and are not reused.

## Closed sets

Stated as F100-FR-208 asks. The states of a harness (row 34 of annex X §X.6), the sources of
discovery and the steps of the probe ladder left with the split.

| Closed set | Members | Owner | Closed by | Unknown value |
|---|---|---|---|---|
| Steps of the critic order | `configured`, `gateway`, `discovered`, `default-model-tier` | 124 | Owner decision (decision 17; ruling P13) | The record is refused |
| Sources of the proposer | `flag`, `environment`, `configuration`, `default` | 124 | Owner decision (decision 17) | The record is refused |
| Reasons why a candidate does not qualify or is passed over | `role-unsupported`, `form-unproven`, `unverified-cli`, `memory-not-off`, `window-unknown`, `window-too-small`, `not-diverse`, `credential-absent`, `preflight-failed`, `terms-refused`, `terms-unknown`, `quota-exhausted`, `no-budget`, `no-spend-cap`, `read-denial-unconfirmed`, `worker-root-not-empty`, `first-call-unproven` | 124 | Design | Shown as text; the candidate does not qualify |
| Results of the diversity test | `diverse`, `same-provider`, `same-model`, `unverified` | 124 | Design | `unverified`, with the critic-diversity warning |

Conditions of qualification. All must hold for a candidate of step 2 or step 3.

| # | Condition | Reason when it fails |
|---|---|---|
| Q1 | The harness supports the critic role: one prompt in, one reply out, a fresh session per call, typed failures for at least authentication, quota and context overflow | `role-unsupported` |
| Q2 | The form is `tool-less` by construction, or the harness has a tested harness adapter; an unverified harness of kind `cli` never qualifies | `form-unproven`, `unverified-cli` |
| Q3 | Harness-native memory is off or absent | `memory-not-off` |
| Q4 | The context window is known, with its source, and is large enough for the smallest grounding budget of the critic | `window-unknown`, `window-too-small` |
| Q5 | The provider or the model differs from the proposer's | `not-diverse` |
| Q6 | The credential is present and the free preflight gave no auth failure | `credential-absent`, `preflight-failed` |
| Q7 | The terms gate allows the provider at auth tier 1 or 2 for the audience, on a row: unknown terms never qualify | `terms-refused`, `terms-unknown` |
| Q8 | The harness is not known to be out of quota at launch | `quota-exhausted` |
| Q9 | The critic role has a budget in force; for the cost class `metered` the hard cap of F124-FR-042 is set | `no-budget`, `no-spend-cap` |
| Q10 | For the form `read-only-tools`: the harness adapter confirms the read denial of the withheld paths | `read-denial-unconfirmed` |

Open sets this feature reads: the role registry (row 72 of annex X §X.6, shared with 111), the
kinds of harness descriptor, the harnesses of the registry.

## As-is behaviour not carried

Rows of the traceability files assigned to this feature with the disposition `superseded-by`.
The owner approved each (ruling K8).

| As-is id | Behaviour (short) | Register row |
|---|---|---|
| B-0013 (C-006) | The flag for the proposer of the engine, with its default harness | DV-004 |
| B-0014 (C-006) | The flag for the critic of the engine, with its default harness | DV-004 |
| B-0037 (C-007) | The variable for the proposer, with its built-in default | DV-004 |
| B-0038 (C-007) | The variable for the critic, with its built-in default | DV-004 |
| B-0466 (C-051) | The flag for the harness of the pass loop, with its default | DV-004 |
| B-0486 (C-052) | The variable as the default of that flag | DV-004 |

What is superseded is the default, which is now Claude for both roles. The names of the
variables stay as aliases (feature 100, annex X §X.8).

As-is ids carried, and where:

| As-is id | Disposition | Requirement | Test |
|---|---|---|---|
| C-012: B-0188 | ported | F124-FR-031 | PT-124-C-012-* |
| C-057: B-0640 | ported | F124-FR-031 | CT-124-50; PT-124-C-057-* has no entry point until a scenario prints the usage text of the pass loop |
| C-051: B-0467 | translated | F124-FR-027 | PT-124-C-051-* |
| C-054: B-0575 | translated | F124-FR-029 | PT-124-C-054-* on `FX-18/unknown-harness-name` |
| C-060: B-0799 | translated | F124-FR-026 | PT-124-C-060-* |
| C-061: B-0845 | translated | F124-FR-026 | PT-124-C-061-* |
| C-066: B-0996 | translated | F124-FR-030 | PT-124-C-066-* on `FX-07/unknown-harness-name` |

No as-is requirement and no as-is success criterion is assigned to this feature.

## Requirements moved to 146-harness-discovery

The old ids are never reused.

| Old id | New id |
|---|---|
| F124-FR-001 to F124-FR-019 | F146-FR-001 to F146-FR-019, each with the same number |
| F124-SC-002 | F146-SC-001 |
| F124-SC-003 | F146-SC-002 |
| F124-SC-007 | F146-SC-003 |
| CT-124-1 to CT-124-19 | CT-146-1 to CT-146-19, each with the same number |

No parity test and no as-is origin moved.

## Repairs after the cross-feature review

Dated 2026-09-30. Requirements changed in place; no id was renumbered or reused.

| Item | Requirement | What changed |
|---|---|---|
| W-125-01 | F124-FR-045 | The trigger of the critic-diversity warning is stated once and exactly: the result `same-model` (both roles resolve to the same model, F100-FR-024) or the result `unverified`; a shared provider or a shared model tier alone does not raise it |
| W-100-15 | F124-FR-045, F124-FR-046, F124-FR-047, F124-FR-037 | One name, "critic-diversity warning"; `same-model` stays as a result of the diversity test |
| W-100-14 | F124-FR-029 | "limit of passes" is now "pass limit" |
| W-X-11 | F124-FR-028, F124-FR-042, F124-FR-045 | The `parity:` lines name rows 90, 91 and 92 of annex X §X.7 in place of the labels P-3, P-4 and P-6 |
| W-115-02 (CQ-191) | F124-FR-045 | No change of behaviour: a higher effort on the same model is allowed and raises the warning, as before |
| Follow-up of feature 141 | F124-FR-031 | The `test:` line names `CT-124-50`, the proof of item B-0640; B-0575 is proved on `FX-18/unknown-harness-name` and B-0996 on `FX-07/unknown-harness-name` |
| Re-check B-8.7, pass-on (2026-09-30) | none ("Assumptions"; `contracts/output-lines.json`; `contracts/README.md`) | The retired types `critic.passed_over` and `critic.diversity` and the proposal `roles.resolved` are no longer cited as events of the feature; the catalogue types `critic.selected` and `critic.call` (fields `diversity`, `sameModelWarning`) are cited; CQ-211. No requirement text changed |

## Inherited work

| Work | Kind | Where |
|---|---|---|
| The descriptor-only fixture of the harness port, extended: the fake endpoint is discovered and picked as the diverse critic | Conformance fixture | F124-SC-001; first task of `tasks.md` |

This feature has no paid probe.

## Clarifications

### Session 2026-09-29

Questions of `speckit-specify` and `speckit-clarify`, answered from the sources. No question was
put to a person.

- Q: Where in the critic order does a critic with read-only tools stand? → A: In step 3, behind every tool-less candidate of that step. Integrated in F124-FR-040. (Source: `APPROVAL.md` ruling P13; CQ-014, closed)
- Q: May a harness with unknown terms be picked automatically? → A: Never, as critic or as fallback; usable when the consumer names it, with the warning. Integrated in F124-FR-036 and in condition Q7. (Source: `APPROVAL.md` ruling P14; CQ-015, closed; feature 100 annex C §C.12)
- Q: R20 lets a candidate with unknown terms qualify with a doctor warning (its condition Q6). Which holds? → A: The ruling. R20 was written before ruling P14. (Source: `STAGE-B-RULES.md` section 1)
- Q: What is the cap of an automatically picked metered critic when the consumer set none? → A: There is none, and the candidate does not qualify. The key is required for a metered pick. Integrated in F124-FR-042. (Source: R16, configuration table, `critic.autoPickMaxUsd` "required when metered"; `APPROVAL.md` ruling 60)
- Q: What does a role name do that the registry does not hold? → A: By default the launch is refused. At the baseline the name is carried into the run: every pass ends with 127, and the critic call is scored MALFORMED. The baseline behaviour is kept behind a switch that is off under `parity`. Integrated in F124-FR-028 to F124-FR-030. (Source: the pass-loop script and the critic module of the Specstride baseline at `9cab15d`; `consolidation.md` section 3, row "127 (pass status)")
- Q: Does the role plan hold the runners-up of an automatic pick, given that annex C §C.6 names only "the fallbacks the consumer opted into"? → A: Yes, for the pass-over of F124-FR-041, which ruling D1 and feature 100 F100-FR-089 require. They are not fallbacks of the consumer and are used only for a pass-over. (Source: `APPROVAL.md` ruling D1; R29v PU-91; F100-FR-089)
- Q: Does a hard failure of an automatically picked critic in the middle of a run move the run to the next candidate? → A: Not specified here. R20 proposes it with medium confidence and no data of a run; the brief does not list it; what happens when another entry is used during a run belongs to feature 127. (Source: R20 "Failure of the picked critic mid-run"; brief 124 heading 1)
- Q: How many rows does the divergence register have? → A: 113, DV-001 to DV-113. The brief's figure is out of date. (Source: `consolidation.md` section 6)
- Q: Is the automatic pick made per run or per phase? → A: Once per launch, for every phase for which the consumer configured no critic; a per-phase critic of the consumer is step 1 for that phase. Integrated in F124-FR-037 and F124-FR-023. (Source: R20 "Stability across resume": the pick is a launch decision; R16, keys `phases.<N>.critic.*`)
- Q: What does step 4 do when the default harness has one model tier only, and what when no harness can be the critic? → A: One model tier only: the same model is used and the warning is raised, since a same-model setup never blocks. No critic at all: the launch is refused, because no phase runs without a critic. Integrated in F124-FR-037 and under "Edge Cases". (Source: constitution Principle II; feature 100 F100-FR-024; `architecture.md` section 3)
- Q: Through what is a second model of the host's gateway called, and must it qualify? → A: Through the generic harness adapter as an endpoint, never through the CLI of the host; it passes the same conditions as a candidate of step 3. Integrated in F124-FR-038. (Source: brief 125 heading 1, row "A critic through the host model gateway"; R20 F15, F16 and "Qualification for rungs 2 and 3")
- Q: What does the split change in this specification? → A: Groups G1 and G2 left: F124-FR-001 to F124-FR-019, three success criteria, user stories 2 and 6, three closed sets and three rows of the `parity` profile. No as-is origin left. This part reads the list of harnesses through feature 100, annex C §C.6, and names no requirement of the other part. (Source: `STAGE-B-SPLIT-PROMPT.md`)
- Q: A selection of the critic in project configuration was ignored by a requirement that left. Where is the rule now? → A: In F124-FR-026, for the selection of the critic. (Source: `APPROVAL.md` ruling 35; feature 100 F100-FR-202)
- Q: Which questions could the sources not answer? → A: Two, listed under "Assumptions".

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary.
- Where the architecture file, the brief and a ruling differ, the ruling stands.
- The events of this feature are the catalogue types of feature 111: `critic.selected` (EV-28) records the pick at launch with the fields `diversity` and `sameModelWarning`, and `critic.call` carries the same two fields for the rule applied before each critic-class call. "An event" in F124-FR-045 is one of these two. The proposals `roles.resolved`, `critic.passed-over` and `critic.diversity` are not catalogue types (feature 111 retired the last two, F111-FR-052; assumption: CQ-211).
- The digest line belongs to feature 123 and the doctor's display to feature 112. This feature supplies the values.
- The spelling of every key is feature 110's. Every key of this feature is in its key list with the status confirmed.

Readings that the sources do not settle:

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-106 | The name of the flag by which the consumer asks for a new resolution of roles on `resume` or a relaunch. F100-FR-092 and F100-FR-016 require the flag and name none | `--resolve-roles`, accepted by `resume` and `launch` | F124-FR-022 |
| CQ-107 | The exit code of a foreground `run` that role resolution refuses | 3, the code of invalid input of the engine table; `launch` exits 4 with the outcome `refused` | F124-FR-035 |
