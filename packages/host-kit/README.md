# @specstride/host-kit

The host-neutral kit of the host port EP-01 (`specstride.host/1`, annex H
§H.1). It exists so that a host package composes its plugin from one kit
instead of copying engine source: the dependency rule of the split is that a
plugin depends on core's packed packages at one exact version and on nothing
else of core.

## Layer

**L1.** The kit holds implementations that serve a port and are called by
higher layers through it, as the harness adapters are — the skill sources,
the render and its byte-budget check, the capability-description shape, the
self-contained shim core, the reusable doctor host-check set. It is
deliberately **not** L7: a host package of L7 may import any lower layer, so
every host may import the kit, while core never imports a host. The entry
stands in `packages/contracts/data/package-graph.json` (owner "120 (U-1,
U-2); the host-neutral parts that the split moves out of 113",
`mayImport: ["@specstride/contracts"]`).

## Contents

Landed so far:

- `src/index.ts` — the re-export of the host-port contract
  (`@specstride/contracts/ep/host`) and of the row-144 ids of the
  context-cost table (`@specstride/contracts/ep/context-cost`), so a plugin
  needs only host-kit and contracts to bind itself to the port.
- `src/shim.ts` — the shim core (moved once out of
  `packages/host-claude-code/src/shim/index.ts`), imported at the subpath
  `@specstride/host-kit/shim`. The module imports nothing at all — rule
  RF-120-01 — and renders the standalone `specstride.mjs` script: the
  resolution order of F113-FR-018, the `--protocol` check of F113-FR-019 and
  the one refusal line of each, in code any host ships unchanged.
- `src/describe.ts` — the capability-description shape (moved once out of
  `packages/host-claude-code/src/describe/index.ts`): the
  `CapabilityDeclaration` and `HostHookEvent` types, the factory that reads a
  capability's `Values` column and declared fallback from
  `@specstride/contracts/ep/host`, and the reading, fallback and `describeOf`
  functions over a host's declarations. A HOST DECLARES; THE KIT SHAPES —
  none of the host's data is a constant here, and the names clash with none
  of the contract values the root index re-exports, so this module is reached
  through the package root (unlike the shim, which needs its subpath).
- `src/render.ts` — the generic render and its byte-budget check (moved once
  out of `packages/host-claude-code/src/render/index.ts`): `renderEntry`,
  `renderSkill`, `skillText`, `descriptionFor`, `checkSkillBudget`,
  `byteBudgetOf`, the `budget-exceeded` and `UnknownLogicalIdError` errors,
  and `assertBudgetTables`, the load-time check that holds the byte numbers a
  host's requirement prints against the product of its token budgets and its
  rate. A HOST SUPPLIES ITS RENDERING TABLES; THE KIT RENDERS — the host's
  tables travel in one `SkillRenderProfile` (below), and the front matter,
  the references section and the unknown-value rule are the kit's, so they
  cannot drift from the annex. Reached through the package root, like
  `describe`.

- `src/skill-common.ts` — what the skill sources of a host share (moved once
  out of `packages/host-claude-code/src/skill-common.ts`): the steps
  machinery (`steps`, `stepIds`, `stepLines`), the six prohibition texts,
  the digest line, the supervision commands, the audience row 34 and the
  marker mechanics, the data framing, and the judgment exchange, each read
  from the contracts where a contract holds it. A HOST SUPPLIES ITS FIGURES;
  THE KIT WRITES THE SHARED SECTIONS — the texts bind no host; every figure
  of one host is a required input of an `*Of` function or stays in the host
  package (the table below). Reached through the package root, like
  `describe` and `render`.

- `src/skill-budgets.ts` — the byte limit of the BODY of each of a host's
  skills (moved once out of
  `packages/host-claude-code/src/skill-budgets.ts`): the byte limits
  COMPUTED from the token figures of the host's design point at the rate of
  its render profile (`bytesForTokens` of `./render.ts`), the printed byte
  numbers held against that product when the tables are built, the UTF-8
  measure, and the `budget-exceeded` refusal for a body over its limit. A
  HOST SUPPLIES ITS BODY TABLES; THE KIT MEASURES AND HOLDS THE DRIFT — the
  figures travel in one required `BodyBudgetTables` input of
  `bodyBudgetsOf`, and the design point a refusal names is the host's own
  words. Reached through the package root, like `describe`, `render` and
  `skill-common`.

- `src/skill-doctor.ts` — the doctor skill source (moved once out of
  `packages/host-claude-code/src/skill-doctor.ts`): the severities of a
  finding (EP-14), the exit codes and their meanings READ out of the
  per-command table of annex G §G.4 (`@specstride/contracts/codes/commands`),
  the install command, the published package and the protocol refusal from
  the kit's own shim (`./shim.ts`), the logical id of row 144 read from the
  contracts, the description and the body. A HOST SUPPLIES ITS BUDGETS; THE
  KIT DECLARES THE SKILL — the total byte budget of the whole rendered skill
  and the body-limit check are one required `DoctorSkillBudgets` input of
  `doctorSkillSourceOf`, and the body names no host and no spelling. Reached
  through the package root, like `describe`, `render`, `skill-common` and
  `skill-budgets`.

- `src/skill-run.ts` — the run skill source (moved once out of
  `packages/host-claude-code/src/skill-run.ts`): the ten steps of the run
  with their ids and the `stepsUpTo`/`stepsOfMode` machinery, the launch
  outcomes and their actions READ from the handshake contract (annex F
  §F.3), the refusal exit code, the modes and the mode decision
  (`decideMode`), the comment rules and patterns with the
  `--comment-selects` flags of row 283 of annex X §X.6 (`callArguments`), the
  description and the body. A HOST SUPPLIES ITS SECTIONS, ITS PARAGRAPH AND
  ITS BUDGETS; THE KIT DECLARES THE SKILL — the five shared sections the host
  builds from `./skill-common.ts`, the one Modes bullet about the mode names
  of its PREVIOUS skill, and the budgets are one required `RunSkillHost`
  input of `runSkillBodyOf` / `runSkillSourceOf`. The consent and the
  cannot-bypass list are read from the port contract
  (`@specstride/contracts/ep/host`), never written here; the module's alias
  for the first is `INVOCATION_OF_THE_SKILL_IS_CONSENT`, because the root
  index already re-exports the contract's own name. Reached through the
  package root, like the other modules.

- `src/skill-reverse.ts` — the reverse skill source (moved once out of
  `packages/host-claude-code/src/skill-reverse.ts`): the eight steps of the
  reverse run with their ids, the reverse command and its verbs (annex G
  §G.2), the consent READ from the port contract, the dry-run flag, the modes
  shared with `./skill-run.ts` (`REVERSE_MODES` is that module's own
  `MODES`), the sources-are-read-only line, the description and the body. A
  HOST SUPPLIES ITS SECTIONS AND ITS BUDGETS; THE KIT DECLARES THE SKILL —
  the five shared sections and the budgets are one required `ReverseSkillHost`
  input of `reverseSkillBodyOf` / `reverseSkillSourceOf`, with no default
  anywhere. One name is NOT taken from the module because the contract
  already exports it at the root index: the module's alias for the consent is
  `REVERSE_INVOCATION_IS_CONSENT`, read from
  `@specstride/contracts/ep/host`. Reached through the package root, like the
  other modules.

- `src/skills.ts` — the registry of a host's skill sources (moved once out of
  `packages/host-claude-code/src/skills.ts`): the lookup of one source by its
  logical id (`skillSetSourceOf`), the happy-path check over the set, the
  artifacts the set renders into (`renderSkillSetOf` /
  `renderOneSkillOf`), the content hash of a rendered skill, and the build
  step that writes the rendered skills into a plugin directory with a hash
  each (`writeSkillSetOf`). A HOST SUPPLIES ITS SET; THE KIT RUNS IT — the
  sources, their descriptions and the host's render profile are one required
  `SkillSetHost` input of every function here, and the kit fixes neither the
  size of the set nor its order: a host may offer a subset of the row's ids
  and file them in its own order. The kit holds no table of sources, no table
  of descriptions and no render profile of its own; the refusal for a logical
  id outside the host's set is the row's own words, which is what
  `renderSkill` refuses with for an id outside row 144. Reached through the
  package root, like the other modules.

- `src/doctor.ts` — the reusable `host.*` doctor check set (moved once out of
  `packages/host-claude-code/src/doctor.ts`): the six checks a host registers
  into the doctor registry of EP-14 (annex G §G.7), the severity rules of the
  port, the registration into a registry (`registerHostChecksOf`), the
  background isolation warning, and the rejection of a host's background job
  mode as the runtime. A HOST SUPPLIES ITS FACTS; THE KIT DECLARES THE CHECKS
  — the package the installed plugin version is held against, the version
  itself, the count of the host hook events the shipped configuration covers,
  the host's own fix for a hooks-loaded failure, and the host's exec form with
  the evidence that rejects its background job mode, are the one required
  `DoctorHost` input of the `*Of` builders, with no default anywhere. NONE of
  the six is a launch check except a missing CLI — so `host.cli-found` alone
  carries `lb`. Reached through the package root, like the other modules.

- `src/evals/` — the eval utilities of a host (moved once out of
  `packages/host-claude-code/src/evals/`), reached through the subpath
  `@specstride/host-kit/evals`, as the shim is: the names of the evals' shapes
  are not the port's (a suite file's `TriggerCase` has a `kind` and may expect
  no skill; the port's, re-exported at the root index, has neither), and the
  evals are the one part of the kit whose subject is a host's PAID lane, which
  a consumer that only renders skills and hooks has no call to load. Landed so
  far:
  - `src/evals/log.ts` — the log record of a paid task and the reader of the
    log: the record of the row "Log record of a paid task" field for field,
    the guard (`isPaidRunRecord`), the writer and the reader
    (`appendRunRecord`, `readRunLog`), the classification of how a run ended
    (`howARunEnded`, exit 130 and 143, the usage-limit marker), the hash of
    the skill texts (`skillTextsHashOf`), and the refusal of a run whose
    configuration names no model (`modelIdsFromConfiguration`,
    `RunRefusedError`) before any call.
  - `src/evals/release-check.ts` — the release check of a host's trigger
    suite (`releaseCheckOf`): reads the log through the record guard, matches
    the hash of the skill texts, holds every skill against the host's
    threshold over the host's number of runs, refuses a run made with an
    ablation, and calls no model.
  - `src/evals/suite-file.ts` — the types of the suite files a host reads
    back from disk (`TriggerCase`, `TriggerSuiteFile`, `FreeGrader`,
    `ToolRestriction`, `FreeGraderFile`). The files themselves are the host's
    own data; the check takes the parsed values.
  - `src/evals/static-check.ts` — the static check of the suite files and of
    the build configuration: the walk that finds a model id behind one of the
    generic `MODEL_ID_KEYS` (`containsModelId`), the findings shape, the
    reading of a graders file, the aggregation (`checkSuiteFiles`,
    `staticCheckPasses`), and the build-configuration half that fails the
    build when a job would start the host's suite runner
    (`SuiteRunnerInBuildError`). The whole check calls no model, starts no
    process and opens no connection.
  - `src/evals/eval-driver.ts` — the driver, as the build runs it
    (`evalDriverRun`): one result per case, in the order of the suite, with a
    recorded interrupted run and a usage-limit run reported as NOT SCORED and
    graded by nothing. The suite and the runner are its inputs; it holds no
    fact of any host.
  - `src/evals/stub-runner.ts` — the replay of a host's recorded results
    (`stubSuiteRunner`): a table look-up that refuses a case the record does
    not hold. It holds no model id and makes no call of any kind.

NOT planned to move: `paid-tasks.ts` of `host-claude-code` — it is the host's
own verification record of its paid tasks, against the runners of its own
package. With this slice the evals of the kit are the whole of the eval
utilities the split lists, minus that one file and the two paid runners.

## What becomes a parameter

When the modules above move, every Claude-only sentence a moved source holds
becomes a parameter that `host-claude-code` passes; the list of them lands in
this section.

### `shimScript(options?)`

Every parameter has a neutral default, so the kit's own `shimScript()`
renders a script that names no host; `host-claude-code` passes the wording
of its plugin.

| parameter               | default                                                                                         | what it holds                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `headerLines`           | the kit's neutral provenance (`shim.ts`, `specstride.host/1`)                                   | the provenance lines at the top of the shipped file; a host names itself here                     |
| `publishedCommentLines` | `defaultPublishedCommentLines(steps)` — how many directories up the package root lies, in words | the comment that explains the `<package>/plugin/bin/` layout the published-package step relies on |
| `packageRootSegments`   | `["..", ".."]` — two directories above the shim's own                                           | the layout of the published package, as `publishedPackageRoot(directory, steps)` takes it         |
| `bundledCliSegments`    | `["..", "cli", "bin"]` — core's packed CLI beside the plugin                                    | the bundled-CLI step of the resolution order; an empty array removes the step                     |

The inlined constants (`PLUGIN_VERSION`, `INSTALL_COMMAND`, the refusal
lines) are module exports, not parameters: the kit fixes their shape, the
host passes its version where its build inlines it.

### `describe` and its shape (`src/describe.ts`)

There are no defaults here on purpose: every host fact is a REQUIRED input,
so a kit call that forgot its host cannot compile into a second host by
accident. `host-claude-code` binds them once in `src/describe/index.ts`;
`capabilityDeclaration(input)` takes the host's requirement id, its
verification-record row and its pin as given and reads only the `Values`
column and the fallback from the contracts.

| input (of `describeOf` / `fallbackInUse`)                    | bound by `host-claude-code` to                                                                                                                                                                 |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `declarations` — the six `CapabilityDeclaration` entries     | `CAPABILITY_DECLARATIONS`: which of the six are present, each value, each `absentBecause`, the F113 requirement of each, the row `six-capabilities-of-the-host`, the pin `claude-code@2.1.284` |
| `rendering.skillNamingRule`                                  | the `specstride-` prefix rule of `contracts/host-package.md` as this host spells it                                                                                                            |
| `rendering.descriptionCap`                                   | `1536` characters                                                                                                                                                                              |
| `rendering.packagingForm`                                    | `"plugin directory"`                                                                                                                                                                           |
| hook events (`HostHookEvent[]`, the value of `hooks`)        | the four events of F113-FR-021 to F113-FR-024 with the host's own spellings, and the two events of F113-FR-025 never registered                                                                |
| `fallbackInUse(... , hostName)`                              | `"Claude Code"` — the name an error names when a present capability is asked for a fallback                                                                                                    |
| the verification-record row (of `capabilitiesAreUnverified`) | `factOf("six-capabilities-of-the-host")` of `host-facts.ts` — the kit reads no record of its own                                                                                               |

### The render and its tables (`src/render.ts`, one `SkillRenderProfile`)

Like `describe`, the render takes no default of any host figure: the tables
travel in one required `SkillRenderProfile` that every function of the module
takes, and `host-claude-code` binds it once as `RENDER_PROFILE` in
`src/render/index.ts`. What stays a host constant at the old path: the five
token budgets and their printed byte numbers, the rate, the two caps, the
layout, the spellings, and the requirement id below.

| field of `SkillRenderProfile` | bound by `host-claude-code` to                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| `bytesPerToken`               | `2.8` (its budget requirement's rate)                                                                   |
| `maxBodyLines`                | `500` — the cap on the lines of a body                                                                  |
| `descriptionCap`              | `DESCRIPTION_CAP` of `describe` — `1536` characters                                                     |
| `skillFile`                   | `"SKILL.md"` — the file of a skill in its own directory                                                 |
| `skillsDirectory`             | `"skills"` — the directory of the plugin the skills lie in                                              |
| `spellings`                   | `HOST_SPELLINGS`: the two host skills keep their prefixed ids, `doctor` is spelled `DOCTOR_SKILL_ID`    |
| `tokenBudgets`                | `TOKEN_BUDGETS`: 8,000; 7,000; 1,500; 150; 3,000 tokens                                                 |
| `printedByteBudgets`          | `PRINTED_BYTE_BUDGETS`: 22,400; 19,600; 4,200; 420; 8,400 bytes, held against the arithmetic at load    |
| `budgetRequirement`           | `"F113-FR-036"` — the id the `budget-exceeded` message names; the kit spells no requirement of any host |

What the kit fixes, and no host passes: the front matter of a rendered skill,
the `## References` section, the two errors and their closed names, the check
name "static size" read from the contracts, and the rounding of the budget
arithmetic. `renderStatusHooks` and `renderShim` did not move: they read the
hook artifacts and the shim wording of this host, which stay in
`host-claude-code`.

### The shared sections of the skill sources (`src/skill-common.ts`)

No defaults, like `describe` and `render`: the host figures below are
REQUIRED inputs of the `*Of` functions, and `host-claude-code` binds them
once in `src/skill-common.ts`. What the kit holds without an input: the
prohibition texts (they name the product, never a host), the digest facts of
annex G §G.3, the supervision commands of annex G §G.2, the audience key and
values of row 34 of annex X §X.7, the marker mechanics, the data framing,
the judgment caps and the repository-root commands of annex G §G.9.

| input (of the `*Of` function)                             | bound by `host-claude-code` to                                                                                    |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `prohibitionsOf` — traceability per prohibition id        | the F113-FR-009 to F113-FR-012 requirement ids and the behaviour rows B-2661…B-2668 each text was translated from |
| `supervisionSectionOf` — `cycleTokenBudget`               | `150`, read from `TOKEN_BUDGETS["supervision-cycle"]` of the render profile (F113-FR-036)                         |
| `supervisionSectionOf` — `runSupervisionTokenBudget`      | `3,000`, read from `TOKEN_BUDGETS["run-supervision"]` (F113-FR-036)                                               |
| `supervisionSectionOf` — `backgroundPresent`              | `declarationOf("background")?.present === true` — ABSENT for this host, so the wait runs in the foreground        |
| `supervisionBudgetTokensOf` — `runSupervisionTokenBudget` | the same `3,000`, promised for the annex F §F.4 default owner only                                                |
| `audienceNoticeTextOf` — `harnessClause`                  | `"with Claude as harness"` — the clause names the harness, not the host, and this host's requirement words it so  |
| `audienceNoticeTextOf` — `authTier`                       | `"Tier 2"` — the default auth tier while the harness is that one                                                  |
| `judgmentSectionOf` — `delegatesToAHarness`               | `false` (`DELEGATION_TO_A_HARNESS_IS_USED`) — this host has a model, so the delegation to a harness is not used   |
| `waitRunsInTheBackgroundOf` — `declarations`              | `CAPABILITY_DECLARATIONS` of `describe`                                                                           |

What stayed a host constant at the old path, and is not a kit input: the
prohibition traceability above, `AUTH_TIER_WITH_CLAUDE_AS_HARNESS`,
`HARNESS_AUTH_CLAUSE`, `DELEGATION_TO_A_HARNESS_IS_USED`, and the two
supervision budgets — the last read from the budget table of F113-FR-036, so
the table and the sentences cannot drift apart. The kit holds no requirement
id of any host and names no harness; the delegation bullet a NON-delegating
host carries ("This host has a model, …") is the moved wording, kept
verbatim; a delegating host gets its own neutral bullet.

### The body budgets (`src/skill-budgets.ts`, one `BodyBudgetTables`)

No defaults, like the modules above: the host's figures are a REQUIRED input
of `bodyBudgetsOf`, and `host-claude-code` binds them once in
`src/skill-budgets.ts`. What the kit holds without an input: the
computation of the byte limits from the token figures (at the rate of
`./render.ts`, never a second one), the load-time check that holds the
printed byte numbers against that product, the UTF-8 measure, and the
`budget-exceeded` refusal.

| field of `BodyBudgetTables` | bound by `host-claude-code` to                                                                                          |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `bodyTokenLimits`           | 2,500; 2,000; 800 tokens — the design point's own figures, per logical id of row 144                                    |
| `printedBodyByteLimits`     | 7,000; 5,600; 2,240 bytes, held against the arithmetic at load                                                          |
| `bytesPerToken`             | `BYTES_PER_TOKEN` of `./render/index.ts` — `2.8`, so bodies and whole rendered skills are measured at one rate          |
| `designPoint`               | `"Skill body size"` — this host's own words; the `budget-exceeded` message names it, and the kit spells no design point |

What stayed a host constant at the old path, and is not a kit input: the two
tables and the design point above, and the re-export of
`BYTES_PER_TOKEN`, `BYTE_BUDGETS` and `bytesForTokens` from the render
binding — the budget table of F113-FR-036 stays where its requirement is.

### The doctor skill source (`src/skill-doctor.ts`, one `DoctorSkillBudgets`)

No defaults, like the modules above: the host figures are one REQUIRED input
of `doctorSkillSourceOf`, and `host-claude-code` binds them once in
`src/skill-doctor.ts`. Everything else is the kit's, read and never written:
the severities (EP-14), the exit codes with their meanings (annex G §G.4),
the install command, the published package and the refusal line
(`./shim.ts`), the logical id (row 144), the description and the body. The
body carries no host name and no spelling — a host files it at the spelling
its render profile gives the logical id `doctor`.

| field of `DoctorSkillBudgets` | bound by `host-claude-code` to                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ |
| `totalBytes`                  | `BYTE_BUDGETS.doctor` — 1,500 tokens (4,200 bytes) for the whole rendered skill, of F113-FR-036        |
| `assertBodyFitsItsLimit`      | the check of `bodyBudgetsOf` in `src/skill-budgets.ts` — 800 tokens (2,240 bytes) of "Skill body size" |

What stayed a host constant at the old path, and is not a kit input: the two
budget figures above, `DOCTOR_BODY_BYTE_LIMIT` (the design point's row for
`doctor`), and nothing else — the old module held no sentence of this host,
so the binding is two re-export blocks and one call.

### The run skill source (`src/skill-run.ts`, one `RunSkillHost`)

No defaults, like the modules above: the host figures are one REQUIRED input
of `runSkillBodyOf` / `runSkillSourceOf`, and `host-claude-code` binds them
once in `src/skill-run.ts`. Everything else is the kit's, read and never
written: the ten steps (the workflow of the CLI through the shim), the
launch outcomes and the refusal exit code (annex F §F.3, from the handshake
contract), the consent and the cannot-bypass list (the port contract), the
selectable options of row 283 of annex X §X.6, the description and the
body. The body names no host and no spelling.

| field of `RunSkillHost`          | bound by `host-claude-code` to                                                                                                   |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `sections.judgment`              | `judgmentSection()` of `src/skill-common.ts` — the exchange over `DELEGATION_TO_A_HARNESS_IS_USED` (`false`, F113-FR-008)        |
| `sections.supervision`           | `supervisionSection()` — the cycle over the budgets of F113-FR-036 (150 / 3,000 tokens) and the absent `background` capability   |
| `sections.audienceNotice`        | `audienceNoticeSection()` — the notice over `"with Claude as harness"` and Tier 2 (F113-FR-016)                                  |
| `sections.dataFraming`           | `dataFramingSection()` — the kit's framing, rebound per host for provenance                                                      |
| `sections.prohibitions`          | `prohibitionSection()` — the kit's texts over the traceability of F113-FR-009 to F113-FR-012 (rows B-2661…B-2668)                |
| `oldModeNamesLine`               | the Modes bullet of DV-009 — `` `generate` → `dry-run`; `run` → `run`; `auto` → `run` `` — built from `OLD_MODES` and `MODE_MAP` |
| `budgets.totalBytes`             | `BYTE_BUDGETS["specstride-run"]` — 8,000 tokens (22,400 bytes) for the whole rendered skill, of F113-FR-036                      |
| `budgets.assertBodyFitsItsLimit` | the check of `bodyBudgetsOf` in `src/skill-budgets.ts` — 2,500 tokens (7,000 bytes) of "Skill body size"                         |

What stayed a host constant at the old path, and is not a kit input: the
mode names of the OLD skill of this host (`OLD_MODES`), their map
(`MODE_MAP`, `mappedMode`), the one waiver of the oracle (`MODE_MAP_WAIVER`,
`isTheWaivedScenario` — fixture FX-36, register DV-009, Decision 18), and
`RUN_BODY_BYTE_LIMIT` (the design point's row for `specstride-run`). A
predecessor and its parity campaign are facts of the host that had them; a
host without one names its own mode rule in the bullet instead. One decision
of the move: the `budget-exceeded`-style error of `decideMode` for an
unknown explicit mode dropped its `(F113-FR-004)` tail — the requirement ids
of a host stay in the host package, and no test held the tail.

### The reverse skill source (`src/skill-reverse.ts`, one `ReverseSkillHost`)

No defaults, like the run module: the host figures are one REQUIRED input of
`reverseSkillBodyOf` / `reverseSkillSourceOf`, and `host-claude-code` binds
them once in `src/skill-reverse.ts`. Everything else is the kit's, read and
never written: the eight steps (capture the comment, check the CLI, plan,
inventory, judge, run, supervise, print the digest), the reverse command and
its verbs (annex G §G.2), the consent (the port contract's own value, the
module's alias `REVERSE_INVOCATION_IS_CONSENT`), the dry-run flag, the modes
(`REVERSE_MODES` is `./skill-run.ts`'s own `MODES` — the skill shares them
and never re-declares them), the sources-are-read-only line, the description
and the body. The body names no host and no spelling. The old path keeps the
port's own name for the consent (`INVOCATION_IS_CONSENT`) by re-exporting the
alias under it, so the import paths and the values of every consumer are
unchanged.

| field of `ReverseSkillHost`      | bound by `host-claude-code` to                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `sections.judgment`              | `judgmentSection()` of `src/skill-common.ts` — the exchange over `DELEGATION_TO_A_HARNESS_IS_USED` (`false`)        |
| `sections.supervision`           | `supervisionSection()` — the cycle over the budgets of F113-FR-036 (150 / 3,000 tokens) and the absent `background` |
| `sections.audienceNotice`        | `audienceNoticeSection()` — the notice over `"with Claude as harness"` and Tier 2 (F113-FR-016)                     |
| `sections.dataFraming`           | `dataFramingSection()` — the kit's framing, rebound per host for provenance                                         |
| `sections.prohibitions`          | `prohibitionSection()` — the kit's texts over the traceability of F113-FR-009 to F113-FR-012 (rows B-2661…B-2668)   |
| `budgets.totalBytes`             | `BYTE_BUDGETS["specstride-reverse"]` — 1,500 tokens (4,200 bytes) for the whole rendered skill, of F113-FR-036      |
| `budgets.assertBodyFitsItsLimit` | the check of `bodyBudgetsOf` in `src/skill-budgets.ts` — 2,000 tokens (5,600 bytes) of "Skill body size"            |

What stayed a host constant at the old path, and is not a kit input:
`REVERSE_BODY_BYTE_LIMIT` (the design point's row for `specstride-reverse`,
5,600 bytes) and the total budget it is built under. No sentence of this
module named its host: the only Claude-only traces it held were the
requirement ids in the comments, which stay at the old path, and the
requirement id in the traceability of the prohibitions, which was already a
parameter of `skill-common`.

### The registry of the skill sources (`src/skills.ts`, one `SkillSetHost`)

No defaults, like the modules above: the host facts are one REQUIRED input of
every function of the registry, and `host-claude-code` binds them once in
`src/skills.ts`. Everything else is the kit's: the lookup by logical id, the
happy-path check, the rendering of the set, the content hash and the writer.
The kit holds no set of its own — no table of sources, no table of
descriptions, no render profile.

| field of `SkillSetHost` | bound by `host-claude-code` to                                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `sources`               | `skillSources()`: the three bound sources of `./skill-run.ts`, `./skill-reverse.ts` and `./skill-doctor.ts`, in row-144 order |
| `descriptions`          | `SKILL_DESCRIPTIONS`: the three descriptions those bound sources declare, by logical id                                       |
| `profile`               | `RENDER_PROFILE` of `./render/index.ts` — the spellings, the layout and the budgets of F113-FR-036                            |

What stayed a host constant at the old path, and is not a kit input:
`SKILL_LOGICAL_IDS` (the alias of the contracts' own row-144 ids) and the
three sources themselves — which skills a host offers is its own decision,
and the kit's sample tests deliberately use a host that offers a subset of
the row in its own order to prove the kit fixes neither the size of a set nor
its order. The old path keeps every export name of the moved module
(`renderPluginSkills`, `renderPluginSkill`, `writePluginSkills`,
`skillContentHash`, `WrittenSkill`, …), so the readers — `packaging.ts`,
`index.ts`, the evals and the ci-checks — are unchanged.

### The doctor check set (`src/doctor.ts`, one `DoctorHost`)

No defaults, like the modules above: the host facts are one REQUIRED input of
every host-dependent builder, and `host-claude-code` binds them once in
`src/doctor.ts`. The four host-independent builders (`cliFoundCheck`,
`protocolSupportedCheck`, `stateRootWritableCheck`, `backgroundIsolationCheck`)
take nothing; the ids, the prefix, the severity rules, the generic message
templates and the registration are the kit's.

| field of `DoctorHost` | bound by `host-claude-code` to                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `packageName`         | `PLUGIN_PACKAGE_NAME` of `./packaging.ts` — the message and the fix of `host.plugin-version` name it                     |
| `pluginVersion`       | `pluginVersion()` of `./packaging.ts`, read when the severity of `host.plugin-version` is decided                        |
| `hookEventCount`      | `HOOK_EVENT_IDS.length` of `./hooks.ts` — the events the shipped configuration covers, named by `host.host-hooks-loaded` |
| `hooksLoadedFixHint`  | the host's own fix: `claude plugin validate` on the plugin directory, or a reinstall                                     |
| `backgroundExecForm`  | `` `--exec` `` — the host's exec form that runs the CLI directly                                                         |
| `backgroundEvidence`  | `R3v C1; F113-FR-032` — the evidence the rejection of the background job mode rests on                                   |

What stayed host data at the old path, and is not a kit input:
`CHECKED_PLUGIN_DIRECTORY` (the directory of the plugin the checks describe).
Two fix hints lost their `(F113-FR-0…)` tail at the kit — requirement ids of a
host stay in the host package, and no test held a tail; every other string a
reader of the old path sees is unchanged. The old path keeps every export name
of the moved module (`hostDoctorChecks`, `registerHostChecks`, `hostLaunchChecks`,
`isHostCheck`, the six check constants, `SKILLS_THE_PLUGIN_SHIPS`, …), so the
readers — the witness tests and CT-113-132/133 — are unchanged.

### The eval log and release check (`src/evals/`, one `paidTaskNames` and one `ReleaseCheckRules`)

Reached at `@specstride/host-kit/evals`. No defaults, like the modules above:
the host facts are REQUIRED inputs, and `host-claude-code` binds them once in
`src/evals/log.ts` and `src/evals/release-check.ts`. What the kit fixes is the
record, the reading, the hash match, the per-skill holding and the refusal of
an ablation; the run mechanics (`INTERRUPTED_EXIT_CODES` 130 and 143, the
usage-limit marker) are the kit's — the interruptions a POSIX runner reports,
not a figure of one host.

| input                                                | bound by `host-claude-code` to                                                         |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `paidTaskNames` (of `isPaidRunRecord`, `readRunLog`) | `PAID_TASK_NAMES`: the trigger suite, the behaviour smoke, the with-and-without report |
| `task` (of `ReleaseCheckRules`)                      | `"trigger-suite"` — the paid task whose log a release reads                            |
| `threshold` (of `ReleaseCheckRules`)                 | `RELEASE_THRESHOLD` = `0.8`                                                            |
| `requiredRuns` (of `ReleaseCheckRules`)              | `REQUIRED_RUNS` = `3`                                                                  |
| `requirementId` (of `ReleaseCheckRules`)             | `"F113-FR-038"` — the id the failing reasons name, exactly as before the move          |

One prose phrase is the kit's, not a parameter: "the log holds no run of the
**trigger suite**" names the port's own concept — the suite a release reads —
not the host's task id, which the rules carry as data. `RunRefusedError` lost
its `(F113-FR-039)` tail at the kit, on the doctor precedent (requirement ids
of a host stay in the host package; no test held a tail); the binding test
holds the message's first words, `refused before any call`, byte for byte.
What stayed host data at the old path: `PAID_TASK_NAMES` and `PaidTaskName`
(the record's `task` is re-narrowed to them) and the whole `paid-tasks.ts`;
the check, the driver and the stub are bound in their own modules below. The
old paths keep every export name of the moved modules,
so the readers — `evals-publishing.test.ts`, CT-113-138/139 and the
paid-smoke witness CT-113-140 — are unchanged.

### The static check, the driver and the stub (`src/evals/`, one `StaticCheckRules` and one record)

Same rule, no defaults: a HOST SUPPLIES ITS RULES AND ITS RECORD; THE KIT RUNS
THE CHECK AND REPLAYS THE RECORD. `host-claude-code` binds them once in
`src/evals/static-check.ts` and `src/evals/stub-runner.ts`.

| input                                                              | bound by `host-claude-code` to                                                                      |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `positiveCasesPerSkill` / `negativeCasesPerSkill`                  | `MIN_POSITIVE_CASES_PER_SKILL` / `MIN_NEGATIVE_CASES_PER_SKILL` = `6` / `6`                         |
| `confusablePair`                                                   | `CONFUSABLE_PAIR` = `"run-reverse"`                                                                 |
| `suiteRunnerMarkers`                                               | `SUITE_RUNNER_MARKERS`: this host's CLI with its eval command, and this host's person-run runner    |
| `requirementIds.suiteCases` / `.noModelId` / `.buildNoSuiteRunner` | `"F113-FR-038"` / `"F113-FR-039"` / `"F113-FR-041"` — the ids the failing reasons name, as before   |
| `results` (of `stubSuiteRunner`)                                   | `RECORDED_STUB_RESULTS`: the 36 recorded results keyed by this host's case ids                      |
| the two figures of the record                                      | `RECORDED_INTERRUPTED_EXIT_CODE` = `130`, `RECORDED_USAGE_LIMIT_MARKER` = the kit's `"usage-limit"` |

`containsModelId` and `MODEL_ID_KEYS` are the kit's (the keys a model id would
hide behind are generic); `evalDriverRun` is the kit's untouched — the suite
and the runner are its inputs, so it takes no host fact at all. What stayed
host data at the old path: the record table with the skill names this host
invokes, the case minimums, the pair, the markers and the requirement ids,
all still exported from `src/evals/{static-check,stub-runner}.ts`, so
CT-113-141 and `evals-publishing.test.ts` are unchanged; the findings and the
build-failure message are byte-identical under the binding.
