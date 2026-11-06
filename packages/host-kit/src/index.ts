/**
 * `@specstride/host-kit` — the host-neutral kit of the host port EP-01.
 *
 * The package is layer L1 of the package graph, not L7: it holds
 * implementations that serve a port and are called by higher layers through
 * it, as the harness adapters are. Its consumers are the host packages (the
 * Claude Code plugin here, the dsh host later), and core never imports a
 * host, so nothing of the engine imports this package.
 *
 * The module move out of `packages/host-claude-code/src` lands in later
 * commits of the split; this index starts the package with the one part the
 * split pins first: the re-export of the host-port contract, so a plugin
 * needs only host-kit and `@specstride/contracts` to bind itself to the port
 * (`specstride.host/1`, annex H §H.1) and to name the host skills and
 * entries of row 144.
 */
export {
  /** The port and its annex. */
  POINT_ID,
  EP,
  ANNEX_SECTION,
  /** The CLI protocol integer the shim inlines and checks. */
  CLI_PROTOCOL_VERSION,
  /** The five operations of F100-FR-193, one optional. */
  OPERATIONS,
  OPTIONAL_OPERATIONS,
  type HostOperation,
  /** The errors and the refusal line of §H.1. */
  ERRORS,
  type HostError,
  PROTOCOL_MISMATCH_LINE,
  PROTOCOL_MISMATCH_EXIT_CODE,
  EXECUTABLE_VARIABLE,
  /** The six capabilities and their fallbacks (F100-FR-193). */
  CAPABILITIES,
  type HostCapability,
  type CapabilityRow,
  capabilityRows,
  fallbackOf,
  /** The shapes a host fills and hands back. */
  type HostDescription,
  type SkillSource,
  type HostArtifact,
  type TriggerCase,
  type TriggerResult,
  /** The logical ids of the host skills and the doctor skill. */
  HOST_SKILL_IDS,
  DOCTOR_SKILL_ID,
  /** The port an implementation of the kit serves. */
  type HostPort,
  /** The guarantees of §H.1, as data. */
  CORE_GUARANTEES,
  IMPLEMENTATION_GUARANTEES,
  FAILURE_PATH,
  FAILURE_PATHS,
  /** The unknown-value rules of §H.1. */
  unknownCapabilityIsIgnored,
  unknownLogicalIdMessage,
  /** Consent and the refusal to install (F100-FR-196, F100-FR-197). */
  INVOCATION_IS_CONSENT,
  THE_COMMENT_CANNOT_BYPASS,
  INSTALLS_OR_UPDATES_THE_CLI,
} from "@specstride/contracts/ep/host";

/**
 * The logical ids of the host skills and entries: row 144 of the
 * context-cost table (owner 113), which a host names when it declares what
 * its artifacts cost.
 */
export {
  HOST_SKILL_AND_ENTRY_IDS,
  type HostSkillOrEntryId,
} from "@specstride/contracts/ep/context-cost";

/**
 * The capability-description shape (`src/describe.ts`): a host declares its
 * six capabilities, their values and their verification record, and the kit
 * shapes them into the `HostDescription` of the port, reading the `Values`
 * column and the declared fallback of each capability from the contracts so
 * neither can drift from annex H §H.1. Unlike the shim below, these names
 * clash with none of the contract values re-exported here, so the shape is
 * reached through the package root; `declarationOf`, `describeOf`,
 * `fallbackInUse`, `describeCapabilities` and `capabilitiesAreUnverified`
 * take the host's declarations as their input.
 */
export {
  type CapabilityDeclaration,
  type CapabilityHostFactStatus,
  type CapabilityRendering,
  type HostHookEvent,
  SKILL_IDS,
  ignoredCapabilities,
  isKnownCapability,
  valuesColumnOf,
  capabilityDeclaration,
  declarationOf,
  presentCapabilities,
  absentCapabilities,
  fallbackInUse,
  fallbacksInUse,
  describeCapabilities,
  describeOf,
  capabilitiesAreUnverified,
} from "./describe.ts";

/**
 * The generic render and its byte-budget check (`src/render.ts`): a host
 * supplies its rendering tables in one `SkillRenderProfile` — the rate, the
 * token budgets with the printed byte numbers, the caps, the file and
 * directory a skill lies in, and the spellings of the logical ids — and the
 * kit renders through them, holding the printed bytes against the arithmetic
 * at load (`assertBudgetTables`) and failing the build with
 * `budget-exceeded` or `UnknownLogicalIdError` as the annex asks. Like the
 * describe shape, these names clash with none of the contract values
 * re-exported here, so the module is reached through the package root.
 */
export {
  type SkillRenderProfile,
  STATIC_SIZE_CHECK,
  type CheckResult,
  BudgetExceededError,
  UnknownLogicalIdError,
  bytesForTokens,
  byteBudgetsOf,
  assertBudgetTables,
  isLogicalId,
  renderEntry,
  byteBudgetOf,
  skillPath,
  descriptionFor,
  skillText,
  checkSkillBudget,
  renderSkill,
  renderSkillDirectory,
} from "./render.ts";

/**
 * What the skill sources of a host share (`src/skill-common.ts`): the steps
 * machinery, the prohibition texts every skill carries, the digest line, the
 * supervision cycle, the audience notice and its host-scoped marker, the data
 * framing and the judgment exchange. A HOST SUPPLIES ITS FIGURES; THE KIT
 * WRITES THE SHARED SECTIONS — the texts bind no host, and every figure that
 * is a fact of ONE host (the supervision budgets, the background primitive,
 * the harness clause and auth tier of the notice, the judgment delegation,
 * the traceability of the prohibitions) is a required input of an `*Of`
 * function or stays in the host package. Like `describe` and `render`, these
 * names clash with none of the contract values re-exported here, so the
 * module is reached through the package root.
 */
export {
  type SkillStep,
  steps,
  stepIds,
  stepLines,
  type Prohibition,
  type ProhibitionText,
  type ProhibitionTrace,
  PROHIBITION_TEXTS,
  prohibitionsOf,
  prohibitionIds,
  prohibitionOfIn,
  prohibitionSectionOf,
  DIGEST_LINE_LABEL,
  DIGEST_IS_PRINTED_VERBATIM,
  DIGEST_IS_THE_FINAL_LINE,
  DIGEST_STEP_TEXT,
  SUPERVISION_COMMAND,
  SUPERVISION_CHANGE_OPTION,
  SUPERVISION_CURSOR_OPTION,
  UNCHANGED_CYCLE_PRINTS_NOTHING,
  UNCHANGED_CYCLE_TOKENS,
  BUDGET_IS_PROMISED_FOR,
  RELAUNCH_OWNER_CONFIGURATION_KEY,
  RELAUNCH_OWNERS_OF_ANNEX_F,
  supervisionBudgetTokensOf,
  waitRunsInTheBackgroundOf,
  type SupervisionFigures,
  supervisionSectionOf,
  AUDIENCE_ROW,
  AUDIENCE_KEY,
  AUDIENCE_THAT_TRIGGERS_THE_NOTICE,
  AUDIENCE_THE_NOTICE_NAMES,
  NOTICE_TRIGGERS,
  THE_SKILL_SETS_THE_AUDIENCE,
  NOTICE_MARKER_FILE,
  MARKER_DIRECTORY,
  MARKER_IS_STATE_OF_THE_HOST,
  MARKER_HAS_A_LOGICAL_NAME,
  NO_COMMAND_OF_THE_PRODUCT_READS_THE_MARKER,
  MARKER_STATES,
  type MarkerState,
  noticePrints,
  markerFailureChangesAnythingElse,
  type AudienceAuthFacts,
  audienceNoticeTextOf,
  audienceNoticeSectionOf,
  DATA_FRAMING_KINDS,
  DATA_FRAMING_RULE,
  INJECTED_LINE_FOLLOWS,
  INJECTED_LINE_HOLDS_REPOSITORY_TEXT,
  PRODUCT_LABEL_PATTERN,
  dataFramingSection,
  JUDGMENT_BATCH_TOKEN_CAP,
  JUDGMENT_OPENS_THE_LAUNCH_CONTRACT,
  JUDGMENT_OPENS_THE_SOURCES,
  ANSWER_IS_FREE_TEXT,
  type JudgmentDelegation,
  judgmentSectionOf,
} from "./skill-common.ts";

/**
 * The body budgets of the skill sources (`src/skill-budgets.ts`): the byte
 * limit of the BODY of each of a host's skills, computed from the token
 * figures of the host's design point at the rate of its render profile, with
 * the printed byte numbers held against that product at load and the
 * `budget-exceeded` refusal for a body over its limit. A HOST SUPPLIES ITS
 * BODY TABLES; THE KIT MEASURES AND HOLDS THE DRIFT — the figures are one
 * required `BodyBudgetTables` input (`bodyBudgetsOf`), and the design point
 * a refusal names is the host's own words. Like `describe`, `render` and
 * `skill-common`, these names clash with none of the contract values
 * re-exported here, so the module is reached through the package root.
 */
export {
  type BodyBudgetTables,
  type BodyBudgets,
  bodyBytes,
  bodyBudgetsOf,
} from "./skill-budgets.ts";

/**
 * The doctor skill source (`src/skill-doctor.ts`): the one skill of the port
 * that every host offers, declared once here — the severities of a finding
 * from EP-14, the exit codes and their meanings READ out of the per-command
 * table of annex G §G.4, the install command, the published package and the
 * refusal line from `./shim.ts` — and built under the one input that is a
 * host's: its budgets (`doctorSkillSourceOf`). A HOST SUPPLIES ITS BUDGETS;
 * THE KIT DECLARES THE SKILL. The body names no host and no spelling; the
 * logical id it is declared under is row 144's own, read from the contracts.
 * Like `describe`, `render`, `skill-common` and `skill-budgets`, these names
 * clash with none of the contract values re-exported here, so the module is
 * reached through the package root.
 */
export {
  type DoctorExit,
  type DoctorSkillBudgets,
  DOCTOR_SKILL_LOGICAL_ID,
  DOCTOR_COMMAND,
  FINDING_SEVERITIES,
  DOCTOR_EXITS,
  DOCTOR_EXIT_CODES,
  meaningOfExit,
  INSTALLS_OR_UPDATES,
  MISSING_CLI_COMMAND,
  MISSING_CLI_PACKAGE,
  MISMATCH_LINE,
  MISMATCH_EXIT_CODE,
  SUPPORTED_PROTOCOL_RANGE,
  DOCTOR_SKILL_DESCRIPTION,
  doctorSkillBody,
  doctorSkillSourceOf,
} from "./skill-doctor.ts";

/**
 * The run skill source (`src/skill-run.ts`): the order of the steps, the
 * outcome lines of `launch` (READ from the handshake contract), the modes,
 * the comment and its flags, and the body built from them. A HOST SUPPLIES
 * ITS SECTIONS, ITS PARAGRAPH AND ITS BUDGETS; THE KIT DECLARES THE SKILL —
 * the five shared sections a host builds from `src/skill-common.ts` over its
 * own figures, the one Modes bullet about the mode names of its previous
 * skill, and its budgets are the required inputs of `runSkillBodyOf` /
 * `runSkillSourceOf` (`RunSkillHost`), with no default anywhere. Two names
 * here are NOT taken from the module because the contracts already export
 * them above: `INVOCATION_IS_CONSENT` and `THE_COMMENT_CANNOT_BYPASS` are
 * read from `@specstride/contracts/ep/host`, and the module's alias for the
 * first is `INVOCATION_OF_THE_SKILL_IS_CONSENT`. The mode names of a host's
 * previous skill, their map and that map's parity waiver are facts of the
 * host that had the predecessor and stay in the host package. Like
 * `describe`, `render`, `skill-common`, `skill-budgets` and `skill-doctor`,
 * these names clash with none of the contract values re-exported here, so
 * the module is reached through the package root.
 */
export {
  type HandshakeOutcome,
  type Mode,
  type ModeDecision,
  type ModeSource,
  type RunSkillBudgets,
  type RunSkillHost,
  type RunSkillSections,
  RUN_SKILL_LOGICAL_ID,
  RUN_STEPS,
  RUN_STEP_IDS,
  RUN_SKILL_DESCRIPTION,
  STOPS_AT_THE_FIRST_REFUSAL,
  PRINTS_THE_LINE_THAT_NAMES_THE_FIX,
  NO_FINISHED_FEATURE_LINE,
  LAUNCH_OUTCOMES,
  LAUNCH_OUTCOME_ACTIONS,
  PRINTS_A_STATE_IT_DID_NOT_READ,
  REFUSAL_EXIT_CODE,
  supervisesAfter,
  retriesAfter,
  outcomeNote,
  MODES,
  DEFAULT_MODE,
  INVOCATION_OF_THE_SKILL_IS_CONSENT,
  A_REQUEST_THAT_DOES_NOT_INVOKE_LAUNCHES,
  DRY_RUN_LAST_STEP,
  DRY_RUN_PRINTS,
  DRY_RUN_LAUNCHES,
  FAILED_LAUNCH_CHECK_IS,
  FAILED_LAUNCH_CHECK_IS_A_FAILURE_OF_DERIVATION,
  COMMENT_FLAG,
  COMMENT_IS_PASSED_TO,
  COMMENT_IS_CAPTURED_FIRST,
  COMMENT_IS_REWRITTEN,
  COMMENT_SELECTS_FLAG,
  COMMENT_SELECTABLE_OPTIONS,
  OPTION_IS_SELECTED_ON,
  BYPASS_REFUSAL_LINE,
  MODE_IS_INFERRED_FROM_THE_REQUEST,
  MODE_INPUTS,
  COMMENT_REFUSAL_PATTERNS,
  COMMENT_INVITATION_PATTERNS,
  COMMENT_BYPASS_PATTERNS,
  commentRefusesToRun,
  commentInvitesALaunch,
  commentAsksToBypassACheck,
  MODE_SOURCES,
  decideMode,
  callArguments,
  RELAYS_AN_OPTION_REFUSAL_VERBATIM,
  stepsUpTo,
  stepsOfMode,
  runSkillBodyOf,
  runSkillSourceOf,
} from "./skill-run.ts";

/**
 * The reverse skill source (`src/skill-reverse.ts`): the reverse-specify
 * skill of a host, declared once here — the eight steps, the reverse command
 * and its verbs from the CLI protocol of annex G §G.2, the modes and the
 * comment flag shared with `./skill-run.ts`, the consent READ from the port
 * contract, and the body built from them. A HOST SUPPLIES ITS SECTIONS AND
 * ITS BUDGETS; THE KIT DECLARES THE SKILL — the five shared sections a host
 * builds from `src/skill-common.ts` over its own figures, and its budgets,
 * are the required inputs of `reverseSkillBodyOf` / `reverseSkillSourceOf`
 * (`ReverseSkillHost`), with no default anywhere. One name here is NOT taken
 * from the module because the contract already exports it above:
 * `INVOCATION_IS_CONSENT` is read from `@specstride/contracts/ep/host`, and
 * the module's alias for it is `REVERSE_INVOCATION_IS_CONSENT`. The module
 * spells no host, no requirement of one and no spelling; like `describe`,
 * `render`, `skill-common`, `skill-budgets`, `skill-doctor` and `skill-run`,
 * these names clash with none of the contract values re-exported here, so
 * the module is reached through the package root.
 */
export {
  type ReverseSkillBudgets,
  type ReverseSkillHost,
  type ReverseSkillSections,
  REVERSE_SKILL_LOGICAL_ID,
  REVERSE_COMMAND,
  REVERSE_VERBS,
  REVERSE_STEPS,
  REVERSE_STEP_IDS,
  REVERSE_INVOCATION_IS_CONSENT,
  DRY_RUN_WITHHOLDS_CONSENT,
  REVERSE_MODES,
  REVERSE_DEFAULT_MODE,
  DRY_RUN_FLAG,
  MODIFIES_THE_SOURCES,
  SOURCES_ARE_READ_ONLY_LINE,
  REVERSE_SKILL_DESCRIPTION,
  reverseSkillBodyOf,
  reverseSkillSourceOf,
} from "./skill-reverse.ts";

/**
 * The registry of a host's skill sources (`src/skills.ts`): the set a host
 * offers, the lookup of one source by its logical id, the artifacts the set
 * renders into, and the build step that writes them into a plugin directory
 * with a content hash each. A HOST SUPPLIES ITS SET; THE KIT RUNS IT — the
 * sources, their descriptions and the host's render profile are one required
 * `SkillSetHost` input of every function here, and the kit fixes neither the
 * size of the set nor its order: a host may offer a subset of the row's ids
 * and file them in its own order. Like the other modules, these names clash
 * with none of the contract values re-exported here, so the module is
 * reached through the package root.
 */
export {
  type SkillSetHost,
  type WrittenSkill,
  skillSetIdsOf,
  skillSetSourceOf,
  skillSetHasAHappyPathWithoutAReference,
  renderSkillSetOf,
  renderOneSkillOf,
  skillContentHash,
  writeSkillSetOf,
} from "./skills.ts";

/**
 * The reusable `host.*` doctor check set (`src/doctor.ts`): the six checks a
 * host registers into the doctor registry of EP-14 (annex G §G.7), the
 * severity rules of the port, and the registration itself. A HOST SUPPLIES ITS
 * FACTS; THE KIT DECLARES THE CHECKS — the package the installed plugin
 * version is held against, the version itself, the count of the host hook
 * events the shipped configuration covers, the host's own fix for a
 * hooks-loaded failure, and the host's exec form with the evidence that
 * rejects its background job mode, are the one required `DoctorHost` input of
 * the `*Of` builders, with no default anywhere. NONE of the six is a launch
 * check except a missing CLI — so `host.cli-found` alone carries `lb`. The
 * texts here name no host and no requirement of one; like the modules above,
 * these names clash with none of the contract values re-exported here, so the
 * module is reached through the package root.
 */
export {
  type DoctorHost,
  HOST_CHECK_PREFIX,
  HOST_CHECK_IDS,
  LAUNCH_CHECK_IDS,
  SEVERITY_WHEN_NOT_OBSERVED,
  SKILLS_OF_THE_PORT,
  BACKGROUND_JOB_MODE_REJECTED,
  A_BACKGROUND_JOB_ADDS_A_SECOND_RUNTIME,
  BACKGROUND_ISOLATION_FACT,
  BACKGROUND_ISOLATION_WARNING,
  isolationWarns,
  backgroundJobModeRejectedBecauseOf,
  cliFoundCheck,
  protocolSupportedCheck,
  pluginVersionCheckOf,
  hostHooksLoadedCheckOf,
  stateRootWritableCheck,
  backgroundIsolationCheck,
  hostDoctorChecksOf,
  registerHostChecksOf,
  hostLaunchChecksOf,
  isHostCheck,
} from "./doctor.ts";

/**
 * The shim core is NOT re-exported here: it is the one part of the kit that
 * imports nothing, and several of its inlined constants share the names of the
 * contract values above (they are held equal by a test, not merged). Its
 * module is the subpath `@specstride/host-kit/shim` (`src/shim.ts`), which a
 * host renders into its plugin as a standalone file at build time; the wording
 * of the shipped script that names the host is options of `shimScript()`.
 */

/**
 * The eval utilities are NOT re-exported here either: like the shim, they are
 * reached through their own subpath, `@specstride/host-kit/evals`
 * (`src/evals/index.ts`). Two reasons hold them out of the root index. First,
 * the names of the evals' shapes are not the port's: the `TriggerCase` of a
 * suite file has a `kind` and may expect no skill, while the `TriggerCase` of
 * annex H §H.1 — re-exported above — has neither, and one index cannot carry
 * both. Second, the evals are the one part of the kit whose subject is a
 * host's PAID lane (a person starts a paid task, the build never does), so a
 * consumer that only renders skills and hooks has no call to load them. A HOST
 * SUPPLIES ITS PAID TASKS AND ITS RELEASE RULES; THE KIT HOLDS THE RECORD AND
 * RUNS THE CHECK — the names of the paid tasks, the task whose log a release
 * reads, the threshold, the number of runs and the requirement id the reasons
 * name are required inputs of `isPaidRunRecord`, `readRunLog` and
 * `releaseCheckOf`, with no default anywhere; the kit spells no requirement of
 * any host and holds no threshold of one.
 */
