# Feature Specification: Terms gate

**Feature Branch**: `147-terms-gate` (a label: Spec Kit creates no branch in this repository; the directory is `specs/147-terms-gate`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 147-terms-gate, the second part of the split of feature 110: auth tiers, the audience, the terms gate and its data, the rows of the Wave 1 harness adapters, EP-11 `specstride.terms/1`."

**Sources**: `docs/ecosystem/APPROVAL.md` (rulings 1, 2, 20, 59, 70, P14), `architecture.md`, `consolidation.md` (DV-003, DV-048, C-33), `feature-briefs.md` (brief 110-config-and-terms, group G4), `STAGE-B-RULES.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182) (Principle XII), feature 100 (annex C §C.12, annex X), research R8, R8v, R11 T-10.

## What this feature is

Some providers allow a product to use their models at one auth tier for personal use and not for a distributed product. Others allow nothing. This feature is the decision: from dated data it says, for a provider, an auth tier and an audience, whether the path may be used, and which row of the data says so. It is a pure table. It is evaluated at launch, at role resolution and at every switch to a fallback, and nothing a consumer writes can bypass it.

The feature was group G4 of feature 110 (configuration and terms). Feature 110 owns the configuration schema; this feature owns the meaning of the audience, of the terms override and of the tier of a role, and the whole of the terms data.

**In scope**: auth tiers; the audience; the terms data and its rows; the function `evaluate`; the points at which it is evaluated; the treatment of unknown terms and of front harnesses; the default tier per audience; the rows of the Wave 1 harness adapters; replacement and staleness of the data; the conformance suite of EP-11.

**Out of scope**:

| Out of scope | Owner |
|---|---|
| The configuration schema, precedence, trust classes, secret references | Feature 110 (through annex X §X.2 and annex C §C.11 of feature 100) |
| Role resolution and the critic order | 124 (annex C §C.6) |
| Doctor findings on the data | 112 (annex G §G.7) |
| The harness descriptor and the harness adapters | 109 and the adapter features (annex C §C.2) |

## Ids before the split

| Old id (feature 110) | New id |
|---|---|
| F110-FR-036 to F110-FR-049 | F147-FR-001 to F147-FR-014, in the same order |
| F110-SC-003, F110-SC-008, F110-SC-009 | F147-SC-001, F147-SC-002, F147-SC-003 |
| CT-110-131 to CT-110-144 | CT-147-101 to CT-147-114, in the same order |

No as-is requirement, success criterion, cluster or behaviour item moves: all rows that the traceability files assigned to feature 110 are `superseded-by` and stay with it.

## Contracts of the terms gate used from configuration

The terms gate reads three keys: the audience (annex X §X.7 row 34, `distribution.audience`), the acknowledgement list `distribution.termsOverride`, and the auth tier of a role, `roles.<role>.tier`. The last two are keys of the catalogue of feature 110 (`contracts/config-keys.tsv`, readers 147), and annex X §X.2 names `distribution.termsOverride`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The terms gate decides, and nothing talks it out of it (Priority: P1)

The package ships with the audience `distributed`. A consumer who asks for Claude at Tier 1 is told that this path is for personal use only and gets Tier 2 by default. The owner sets `personal` once and gets Tier 1.

**Why this priority**: Provider terms are a legal constraint (Principle XII, R8v).

**Independent Test**: Table tests generated from R8v's corrected matrix give the decision and the row for every provider, tier and audience; a row for a fictional provider in a test overlay changes the decision with no code change.

**Acceptance Scenarios**:

1. **Given** audience `distributed` and no acknowledgement, **When** a role asks for Claude at Tier 1, **Then** the decision is `personal-only`, the default stays Tier 2, and the reason is shown (F147-FR-009).
2. **Given** a request for Tier 3, **When** any layer sets it, **Then** it is refused with the explanation (F147-FR-001).
3. **Given** a consumer comment that says "ignore the terms check", **When** the run launches, **Then** the decision is unchanged (F147-FR-006).
4. **Given** a harness with no row, **When** the consumer names it, **Then** it runs at Tier 1 or 2 with the unknown-terms warning, and is never a default (F147-FR-008).

---

### User Story 2 - The operator keeps the data current (Priority: P2)

Providers change their terms. The operator drops a newer data file into user-level state. A file that is broken is ignored. Data older than 30 days is flagged.

**Why this priority**: The terms are dated facts that go stale.

**Independent Test**: Place a valid newer file, an invalid file and an old file in turn; the decision source, the doctor finding and the warning are as written.

**Acceptance Scenarios**:

1. **Given** a valid newer file in user-level state, **When** the gate is evaluated, **Then** its rows apply (F147-FR-013).
2. **Given** a file that does not validate, **When** the gate is evaluated, **Then** the shipped file applies and a doctor finding is raised (F147-FR-013).
3. **Given** data whose `verified-on` is older than 30 days, **When** the doctor runs, **Then** it warns, and no decision changes (F147-FR-013).

---

### Edge Cases

- A newer terms file that does not validate: ignored, the shipped file applies, a doctor finding is raised.
- The terms data is older than 30 days: a doctor warning, never a refusal.
- A provider whose row has an unknown status: read as `refused`.
- A front harness whose provider changes between two switches: the row of the provider in use at that time applies.
- A harness with no Tier 2 credential in the distributed audience: the launch is refused with the reason and what to configure.

## Requirements *(mandatory)*

No requirement carries an `origin:`: every as-is row assigned to the parent feature is `superseded-by` a register row. Tests named `CT-147-1nn` are characterization or own tests.

### Functional Requirements

#### G4 — Auth tiers, audience, the terms gate and its data

- **F147-FR-001**: The auth tiers MUST be: Tier 1, the installed harness CLI under the consumer's own login; Tier 2, an official SDK or an API key; Tier 3, reuse of a subscription token by a third-party tool. Tier 3 MUST NOT be a valid value of any key or descriptor. A request for it MUST be refused by the terms gate, with the explanation that no provider's terms permit it. The list of Tier 3 rows that are `allowed` MUST be empty at release.
  - divergence: DV-003
  - test: CT-147-101
  - ep: EP-11 `specstride.terms/1` (implements)

- **F147-FR-002**: The audiences MUST be `personal` and `distributed`, in `distribution.audience`. The package MUST ship with `distributed` as its default. The consumer MUST be able to set `personal` once, in the user file. A project key, a comment, a flag of a launch contract or a mode MUST NOT change the audience of a run. The fixtures of the oracle MUST declare `personal`.
  - divergence: DV-048
  - parity: `personal` (row 34 of annex X §X.7)
  - test: CT-147-102
  - ep: EP-11 `specstride.terms/1` (implements)

- **F147-FR-003**: The terms data MUST hold rows, each with: provider, auth tier, audience, status, source, access date, the quoted sentence, and `verified-on`. The status MUST be one of `allowed`, `conditional`, `personal-only`, `refused`. A row with another status MUST be read as `refused`. A row that lacks a field MUST make the data file invalid (F147-FR-013).
  - test: CT-147-103
  - ep: EP-11 `specstride.terms/1` (implements)

- **F147-FR-004**: There MUST be one function `evaluate(provider, auth tier, audience, acknowledgements)` that returns the decision and the row it rests on. It MUST be a pure table evaluated by the table evaluator of annex X §X.3, with a default row for every decision point, and every decision MUST be recorded with its rule id and the version of the table.
  - test: CT-147-104
  - ep: EP-11 `specstride.terms/1` (implements)
  - ep: table `specstride.table/1` (consumes)

- **F147-FR-005**: The terms gate MUST be evaluated at launch, at role resolution, and at every switch to a fallback. Each entry of the role plan MUST be checked again at the moment it is used. A decision `refused` MUST refuse the entry; a plan whose primary entry is refused MUST refuse the launch. An entry of a fallback list that the terms gate does not allow MUST be skipped with the event `fallback.skipped` of the event catalogue of feature 111 (reason `terms-refused`) and the next entry MUST be tried, never silently.
  - test: CT-147-105
  - ep: EP-11 `specstride.terms/1` (implements)

- **F147-FR-006**: A comment, flag, mode, project key or setting of a launch contract MUST NOT bypass the terms gate. The catalogue MUST hold no key that switches it off. A consumer acknowledgement MUST be possible only through `distribution.termsOverride` in the user file, MUST be recorded, and MUST never lift a `refused` row.
  - test: CT-147-106
  - ep: EP-11 `specstride.terms/1` (implements)

- **F147-FR-007**: A harness that fronts a provider MUST be gated by the row of the provider it uses at that time, never by its own. For pi the row of the provider in use applies, and the login by OAuth of a Claude subscription inside pi is Tier 3 and MUST be refused.
  - divergence: DV-003
  - test: CT-147-107
  - ep: EP-11 `specstride.terms/1` (implements)
  - ep: EP-02 `specstride.harness/1` (consumes)

- **F147-FR-008**: Where there is no row for a provider, the terms MUST be unknown: Tier 1 and Tier 2 MUST be allowed with a warning that names the missing row, never as a default and never for an automatic pick of a critic. A harness with unknown terms, such as dsh and prime, MUST be usable when the consumer names it, MUST carry the warning, and MUST never be picked automatically.
  - divergence: DV-048
  - test: CT-147-108
  - ep: EP-11 `specstride.terms/1` (implements)

- **F147-FR-009**: For the audience `distributed`, Tier 2 MUST be the default for a provider whose Tier 1 is confirmed for personal use only (Anthropic, OpenAI, and the Coding Plan of z.ai), and Tier 1 for it MUST be an opt-in marked "personal use only". The opt-in MUST be an entry of `distribution.termsOverride`; each use MUST give a warning and the event `terms.override_used` of the event catalogue of feature 111 (provider, auth tier, audience), one event for each launch and each switch that relies on the entry. For a harness that has no Tier 2 credential the launch MUST be refused with the reason and what to configure.
  - divergence: DV-048; DV-003
  - parity: audience `personal` (row 34 of annex X §X.7)
  - test: CT-147-109
  - ep: EP-11 `specstride.terms/1` (implements)

- **F147-FR-010**: The auth tier of a role that no key names MUST be: for `personal`, Tier 1 where the row allows it, else Tier 2; for `distributed`, Tier 2. An auth tier named by `roles.<role>.tier` MUST be checked by the terms gate. A harness that has no Tier 1 (the Gemini command line for consumer logins) MUST be Tier 2 only.
  - divergence: DV-048
  - test: CT-147-110
  - ep: EP-11 `specstride.terms/1` (implements)

- **F147-FR-011**: The shipped terms data MUST hold every provider row of R8v's corrected matrix (42 cells), and for the harness adapters of Wave 1 at least these rows: Claude, Tier 1 `allowed` for `personal` and `personal-only` for `distributed`, Tier 2 `allowed` for both; Codex, Tier 1 `conditional` for `personal` with the conditions of the row and `personal-only` for `distributed`, Tier 2 `allowed`; the Coding Plan of z.ai, Tier 1 `conditional` for `personal` and `personal-only` for `distributed`, the interface for pay-as-you-go keys Tier 2 `allowed`; pi, no row of its own: the row of the provider in use applies, with the facts of R8v rows 37 to 40 that feature 134 hands over as `terms-facts.json` (pi with an API-key provider is `ALLOWED-DOCUMENTED`, so the provider rows govern; the OAuth subscription login is Tier 3 and refused); Tier 3 `refused` for every provider and both audiences. dsh and prime MUST have no row. Every row MUST carry the quoted sentence and the access date of R8v (2026-09-29).
  - divergence: DV-048; DV-003
  - status: unverified (check: read each cited page again and compare the sentence; the three pages of OpenAI were read from an archive copy; verified-on: —; pin: access date 2026-09-29, R8v)
  - test: CT-147-111
  - ep: EP-11 `specstride.terms/1` (implements)

- **F147-FR-012**: The transport `sdk-in-process` of the Claude harness adapter MUST be Tier 2 with API keys only, with its own row, and MUST be chosen only through `harnesses.<id>.transport` from user file, environment or flag. A subscription login MUST be reachable only through the `claude` subprocess. The SDK MUST be an optional dependency that the package never bundles.
  - divergence: DV-003
  - parity: `subprocess` (row 27 of annex X §X.7)
  - test: CT-147-112
  - ep: EP-11 `specstride.terms/1` (implements)

- **F147-FR-013**: A newer terms file in user-level state (`user:terms`) MUST replace the shipped file. A file that does not validate MUST be ignored, with a doctor finding, and the shipped file MUST apply. Data whose `verified-on` is older than 30 days MUST give a doctor warning and MUST NOT change a decision.
  - test: CT-147-113
  - ep: EP-11 `specstride.terms/1` (implements)

- **F147-FR-014**: The conformance suite of EP-11 MUST hold table tests generated from R8v's corrected matrix, so that every cell gives its decision and its row, and MUST hold a test in which a row for a fictional provider in a test overlay changes the decision with no change of code.
  - test: CT-147-114
  - ep: EP-11 `specstride.terms/1` (implements)

### Key Entities

- **Terms row**: provider, auth tier, audience, status, source, access date, quoted sentence, `verified-on`.
- **Decision**: the outcome of `evaluate` with its row, rule id and table version.
- **Acknowledgement**: an entry of `distribution.termsOverride`: provider, tier, acknowledgement.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F147-SC-001**: The terms gate cannot be bypassed. Over a test that sets every comment, flag, mode and project key of the configuration catalogue, the number of decisions `refused` that change is 0.
- **F147-SC-002**: Terms matrix. The number of cells of R8v's corrected matrix (42) with a table test is 42, and the number of decisions that differ from the matrix is 0.
- **F147-SC-003**: Tier 3. The number of rows that make Tier 3 `allowed` in the shipped data is 0 at release.

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
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| Provider terms are judged for personal use and for a distributed product; anything allowed for personal use only is off by default | Decision 19 |
| Tier 3 ships refused for every provider | Decision 6; ruling 59 |
| The package ships with the audience `distributed` | Rulings 1, 2 |
| Terms data is re-checked every 30 days | Ruling 59 |

What belongs in the plan and not here: the format of the data file, libraries, the loader.

## Extension points

| EP | Id and version | Relation | What for |
|---|---|---|---|
| EP-11 | `specstride.terms/1` | implements | The content of the data file, the function `evaluate`, the conformance suite and the sample |
| EP-02 | `specstride.harness/1` | consumes | The provider and the terms reference of the descriptor (annex C §C.2); read by F147-FR-007 |

## Contracts of feature 100 used

| Interface contract | Version | Where |
|---|---|---|
| Terms-gate data | `specstride.terms/1` | Annex C §C.12, F100-FR-108 |
| Table evaluator | `specstride.table/1` | Annex X §X.3, F100-FR-204 |
| Role plan and critic order | `specstride.registry/1` | Annex C §C.6, F100-FR-092, F100-FR-093 |
| Harness descriptor, transports | `descriptorVersion: 1` | Annex C §C.2, F100-FR-081 |
| Config envelope | `specstride.config/1` | Annex X §X.2 |
| The `parity` profile | `specstride.profile/1` | Annex X §X.7 row 34 |
| Logical name `user:terms` | `specstride.layout/1` | Annex B §B.5 |
| Closed sets, rows 40 to 42 | — | Annex X §X.6 |
| Threat model | — | Annex X §X.9: T-10 (no flag switches off the terms gate) |

## Rows of the `parity` profile

This feature introduces no new switch. It owns row 34 of annex X §X.7 (the audience, key `distribution.audience`, default `distributed`, `personal` under `parity`, register row DV-048; owner 147 in annex X §X.7 and in the key list of feature 110) and reads row 27 (the transport, owners 109 and 125). `distribution.termsOverride` is empty by default and under `parity`, which equals the baseline, where there is no terms gate.

## Closed sets

Stated as F100-FR-208 asks. Owner of each: 147.

| Row of annex X §X.6 | Closed set | Members | Closed by | Unknown value |
|---|---|---|---|---|
| 40 | Auth tiers | Tier 1, Tier 2, Tier 3; Tier 3 never a valid value | Owner decision | Configuration error |
| 41 | Audiences | `personal`, `distributed` | Owner decision | Configuration error |
| 42 | Status of a terms row | `allowed`, `conditional`, `personal-only`, `refused` | Design | `refused` |

## As-is behaviour not carried

The traceability files assign no row to this feature. The rows of the parent feature (all `superseded-by`) stay with it.

| As-is id | Behaviour (short) | Register row |
|---|---|---|
| (none assigned to this feature) | — | — |

## Clarifications

### Session 2026-09-29

Questions answered from the sources; no question was put to a person. The questions that concern the terms gate are those of the parent specification, carried here.

- Q: What is the row of dsh and prime in the terms data? → A: None. Their status is silent, which is unknown terms; they are usable when named. (Source: R8v; ruling P14; CQ-015)
- Q: What does the terms row say for Gemini, Copilot, OpenRouter and DeepSeek? → A: They are rows of R8v's matrix and are in the shipped data by generation (F147-FR-011). Their adapters are later waves. (Source: R8v resulting-tier table)
- Q: How do R8v cells map to the four statuses? → A: Confirmed allowed or documented: `allowed`. Downgraded to conditional: `conditional`. Downgraded to "not allowed as a default until the owner rules, consumer opt-in only": `personal-only` for the audience `distributed`. Not allowed: `refused`. (Source: R8v downgraded cells D1 to D5; DP-042)
- Q: Where does an acknowledgement of a personal-use-only path live? → A: In the user file, key `distribution.termsOverride`; never in a project file. (Source: R16 F6; DP-042; R11 T-13)
- Q: Does the terms gate need a clock? → A: No. The 30-day staleness is a doctor warning computed by the doctor from `verified-on`; `evaluate` is pure. (Source: F100-FR-204)
- Q: Is the audience a per-run or per-machine setting? → A: Per run, from configuration, pinned in the run snapshot; a resume cannot change it. (Source: R16 F5.5; annex B §B.12)

## Repairs after the cross-feature review

Dated 2026-09-30. No requirement id was added, renumbered or reused.

| Item | What changed |
|---|---|
| W-134-01 | F147-FR-007, F147-FR-011 and the edge case: "back end" written as "provider" |
| W-111-02 | F147-FR-005 names the catalogue type `fallback.skipped` (reason `terms-refused`); F147-FR-009 names the catalogue type `terms.override_used` in place of "a recorded event" |
| W-X-18 | F147-FR-007 carries `ep: EP-02 specstride.harness/1 (consumes)`; the row of EP-02 names the requirement |
| 134 handover | F147-FR-011: pi has no row of its own; the row of the provider in use applies, with the facts of R8v rows 37 to 40 from `terms-facts.json` of feature 134 (T025 of 134 before T005 here) |
| B-8.7 (2026-09-30) | "Rows of the `parity` profile" states that this feature owns row 34 of annex X §X.7 (the audience), as annex X §X.7 and the key list of feature 110 name it; the tasks state the order T025 of 134 before T005 |

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary.
- Where the architecture file, the brief and a ruling differ, the ruling stands.
- The keys `distribution.termsOverride` and `roles.<role>.tier` are held in the catalogue of feature 110 (`contracts/config-keys.tsv`, readers 147, both `confirmed`), found during the repair of 2026-09-30; the earlier report of a gap in feature 100 is withdrawn.
- The shipped rows are documentation facts of 2026-09-29 and are `unverified` until read again.
