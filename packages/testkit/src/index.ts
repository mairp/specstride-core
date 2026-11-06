// @specstride/testkit — the conformance frame, the samples, the static tests,
// the table-level tests and the canary harness. Feature 100 builds the frame;
// every content owner fills in the suite and the sample of its extension point.
//
// The public surface an author of a later implementation needs, documented in
// README.md (T294, F100-FR-017): the registry of a point, the run of a suite
// and its report, the degradation of a failing implementation, and the
// registration of the samples from the test tree.

// The frame: one registry per point, read-only after launch (T096, T279).
export {
  CLASSES_ROW,
  CLASSES_ROW_UNKNOWN_VALUE,
  CURRENT_MAJOR,
  EXTENSION_POINTS_DIR,
  EXTENSION_POINTS_INDEX,
  EXTENSION_POINT_COUNT,
  EXTENSION_POINT_ID_FORM,
  IMPLEMENTATION_CLASSES,
  REGISTRATION_REFUSALS,
  RESOLVE_AGAIN_FLAG,
  UnknownExtensionPointError,
  isLaunched,
  loadExtensionPointContract,
  loadExtensionPointIndex,
  majorIsSupported,
  markLaunched,
  registryOf,
  replayResolved,
  resetFrame,
  resolvedOfTheRun,
  sectionOf,
  supportedMajors,
  type ExtensionPointContract,
  type ExtensionPointEntry,
  type Implementation,
  type ImplementationClass,
  type Registry,
  type RegistrationOutcome,
  type RegistrationRefusal,
  type ReplayOutcome,
  type ResolvedRecord,
} from "./conformance/frame.ts";

// The run of a suite and its report (T277).
export {
  CASE_LEVELS,
  ImplementationNotRegisteredError,
  REPORT_MODE_VARIABLE,
  casesAsTests,
  inReportMode,
  lineOf,
  runEverySuite,
  runSuite,
  type CaseLevel,
  type CaseReport,
  type ConformanceCase,
  type PointSuite,
  type RunReport,
  type SuiteReport,
} from "./conformance/run.ts";

// The degradation of a failing implementation (T278).
export {
  DEFAULT_UNKNOWN_VALUE_RULE,
  DEGRADATION_CAUSES,
  DEGRADATION_EVENT_TYPE,
  FAILURE_SUB_HEADING,
  TimeLimitExceeded,
  UNKNOWN_VALUE_SUB_HEADING,
  applyDefaultUnknownValueRule,
  guardedCall,
  holdsNoVerdictExitCodeOrStopReason,
  plainerPathOf,
  unknownValueRuleInForce,
  type Degradation,
  type DegradationCause,
  type GuardOptions,
  type GuardedOutcome,
} from "./conformance/degrade.ts";

// The registration of the samples from the test tree (T279).
export {
  SAMPLES_DIR,
  SAMPLE_CLASS,
  SAMPLE_PROVENANCE,
  SampleMissingError,
  coreFilesNamingASample,
  registerSamples,
  sampleDirectories,
  type CoreNaming,
  type SampleModule,
} from "./conformance/register-samples.ts";
