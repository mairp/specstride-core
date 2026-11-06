/**
 * T001, T002, T003 — `@specstride/oracle`: the differential parity oracle of
 * feature 141 (plan.md, "Source Code"; F141-FR-045).
 *
 * This module is the entry point of the package and holds nothing but the
 * layout of the package: the directories that plan.md names, the directory of
 * the copied data files, and the one waiver file. The behaviour of the oracle —
 * the reference fetch, the hermetic runner, the stubs, the normalizer, the
 * comparator — is built by the later phases into the subdirectories of `src/`
 * that `ORACLE_SOURCE_DIRECTORIES` names.
 *
 * The package is at layer `dev` and is never shipped
 * (`specs/100-specstride/contracts/data/package-graph.json`, F141-FR-045): it
 * is `private` in its manifest, so npm refuses to publish it, and no package of
 * the product imports it.
 */
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** The root of the package, `packages/oracle/`. */
export const ORACLE_ROOT = resolve(dirname(dirname(fileURLToPath(import.meta.url))));

/**
 * The directories of the package, as plan.md, "Source Code", names them
 * (T002). Every one of them exists in the repository; `test/oracle-setup.test.ts`
 * reads them back from disk.
 */
export const ORACLE_DIRECTORIES = [
  "src",
  "stubs",
  "fixtures",
  "golden",
  "exercise-map",
  "reference",
  "test",
] as const;

export type OracleDirectory = (typeof ORACLE_DIRECTORIES)[number];

/** The absolute path of one directory of the package. */
export function oracleDirectory(name: OracleDirectory): string {
  return join(ORACLE_ROOT, name);
}

/**
 * The subdirectories of `src/` that the later phases fill, in the order of
 * construction of plan.md (F141-FR-045). Phase 1 creates none of them: the
 * list is here so that a reader of this module sees where the behaviour goes.
 */
export const ORACLE_SOURCE_DIRECTORIES = [
  "reference",
  "env",
  "run",
  "capture",
  "normalize",
  "compare",
  "waivers",
  "register",
  "catalogue",
  "trace",
  "suite2",
  "golden",
  "release",
] as const;

/**
 * The directory of the copied data files and schemas (T003). The copy is
 * byte-identical to `specs/141-parity-oracle/contracts/`, which is the
 * machine-readable form of `spec.md` and stays outside the repository (the
 * specification tree is local, owner's decision of 2026-09-30). The copy is
 * therefore the only form of the data the build can read, and
 * `python3 specs/141-parity-oracle/contracts/tools/generate.py --check` is what
 * holds the two in agreement wherever the specification tree is present.
 */
export const ORACLE_DATA_DIR = join(ORACLE_ROOT, "data");

/** The data files of `ORACLE_DATA_DIR`, relative to it (T003). */
export const ORACLE_DATA_FILES = [
  "fixture-catalogue.json",
  "stub-vocabulary.json",
  "surfaces.json",
  "register-map.json",
  "layer-allowlist.json",
  "per-os-expectations.json",
  "inventory-supplement.tsv",
] as const;

/** The schemas of `ORACLE_DATA_DIR/schemas`, relative to that directory (T003). */
export const ORACLE_DATA_SCHEMAS = [
  "fixture.schema.json",
  "waivers.schema.json",
  "test-declaration.schema.json",
  "transcript.schema.json",
  "result.schema.json",
  "exercise-map.schema.json",
] as const;

/** The absolute path of one data file or schema under `data/`. */
export function oracleDataFile(relative: string): string {
  return join(ORACLE_DATA_DIR, relative);
}

/**
 * The one waiver file of the oracle (T002, F141-FR-022). There is exactly one:
 * every waiver of every fixture lives in it, keyed by fixture, surface and
 * register row. Phase 1 writes it empty; the phases that find a difference a
 * register row accepts add the entries.
 */
export const ORACLE_WAIVERS_FILE = join(ORACLE_ROOT, "waivers.json");

/** The schema id of the waiver file (`data/schemas/waivers.schema.json`). */
export const ORACLE_WAIVERS_SCHEMA_ID = "urn:specstride:schema:internal:141:oracle-waivers/1";

/** The command that holds `data/` and `spec.md` in agreement (T003). */
export const ORACLE_DATA_CHECK_COMMAND =
  "python3 specs/141-parity-oracle/contracts/tools/generate.py --check";

/** The four build jobs of `.github/workflows/oracle.yml` (T004, F141-FR-037). */
export const ORACLE_BUILD_JOBS = ["hermetic", "capture", "reference", "platform"] as const;

/**
 * The two job variables that name the local clones of the baselines (T004,
 * F141-FR-038). The `capture` and the `reference` job read the pinned commits
 * out of them and never write to them (quickstart.md, "Prerequisites").
 */
export const ORACLE_BASELINE_CLONE_VARIABLES = ["ORACLE_REF_SPECSTRIDE", "ORACLE_REF_MOL"] as const;

// ---------------------------------------------------------------------------
// Phase 2 — the foundations every story needs (T005 to T015)
// ---------------------------------------------------------------------------

/**
 * The data of the oracle, loaded and validated at start, with typed readers
 * (T005). Importing this module therefore validates `data/`: a data file or a
 * schema that does not hold up stops the oracle before a fixture runs.
 */
export {
  ACTIVE_FAMILY_COUNT,
  DATA_FILE_SCHEMA_IDS,
  FAMILY_COUNT,
  ORACLE_DATA_DIR as ORACLE_DATA_DIRECTORY,
  OracleDataError,
  RETIRED_FAMILIES,
  SCHEMA_FILE_IDS,
  activeFamilies,
  assertFamilyMayBeCited,
  family,
  fixtureCatalogue,
  inventorySupplement,
  knownSurfaceNames,
  layerAllowlist,
  loadOracleData,
  oracleData,
  perOsExpectations,
  registerMap,
  schemaOf,
  stubVocabulary,
  surfaces,
  validateFixtureDeclaration,
  type FixtureFamily,
  type OracleData,
} from "./catalogue/data.ts";

/** The pins of the two reference systems and their reader (T007, F141-FR-001). */
export {
  LISA,
  PINNED_SYSTEMS,
  PINS_FILE,
  PinError,
  SYSTEMS_WITHOUT_A_PIN,
  hasPin,
  pin,
  pins,
  pinsForExerciseMap,
  readPins,
  requirePin,
  type Pin,
} from "./reference/pins.ts";

/** The reference trees: fetch, verification, read-only, the check after a run (T009). */
export {
  FORBIDDEN_GIT_VERBS,
  INSTALL_ROOT_FILE,
  NO_BYTECODE_VARIABLE,
  ReferenceTreeError,
  assertNoInterpreterCache,
  assertReadOnlyGitArgv,
  checkTreeUnchanged,
  copyTreeWithInstallRoot,
  fetchReferenceTree,
  isTreeReadOnly,
  scratchTreeRoot,
  treeFingerprint,
  type ReferenceTree,
} from "./reference/fetch.ts";

/** The empty environment and its allow-list (T011, F141-FR-003). */
export {
  CRITIC_STUB_DUMMY_KEY,
  ENVIRONMENT_ALLOW_LIST,
  HermeticEnvironmentError,
  STUB_BIN,
  SYSTEM_PATH_DIRECTORIES,
  TICK_VARIABLES,
  aliasOfAsIsVariable,
  hermeticEnvironment,
  portEnvironment,
  type HermeticEnvironment,
  type PortEnvironment,
} from "./env/hermetic.ts";

/** The network guard and the credential guard (T013, F141-FR-038). */
export {
  CREDENTIAL_GUARD_EXIT_CODE,
  CREDENTIAL_VARIABLE_NAMES,
  CredentialGuardError,
  DUMMY_CREDENTIAL,
  NETWORK_GUARD_EXIT_CODE,
  NetworkGuardError,
  assertLoopback,
  assertNoCredentialOfTheMachine,
  credentialVariablesOf,
  installCredentialGuard,
  installGuards,
  installNetworkGuard,
  isLoopbackHost,
} from "./env/guard.ts";

// ---------------------------------------------------------------------------
// Phase 3 — the catalogue, the fixture declaration, the declaration check and
// the citing page (T021 to T024, user story 1)
// ---------------------------------------------------------------------------

/** The catalogue of families and scenarios: status, variants, added scenarios (T021). */
export {
  CatalogueError,
  FAMILIES_WITH_AN_END_ON_THE_REFERENCE,
  OWNING_FEATURE,
  activeFamilyIds,
  answersReservation,
  assertAddedScenarioIsAccepted,
  catalogueRegister,
  citationHoldsUp,
  duplicateScenarioNames,
  endOnReferenceOf,
  families,
  familyIds,
  familyStatus,
  membersOf,
  resolveCitation,
  retiredFamilyIds,
  scenarioEntriesOf,
  scenarioNamesOf,
  scenarioOf,
  scenarioOwnerOf,
  scenariosAddedBy,
  scenariosAddedByOtherFeatures,
  scopeOf,
  stubNames,
  stubsOf,
  surfacesOf,
  testOwnerOf,
  variantsOf,
  verbsOfStub,
  waiverOf,
  type AddedScenario,
  type Citation,
  type Scenario,
} from "./catalogue/catalogue.ts";

/** The validation of `fixture.json` and the import of as-is assets (T022, F141-FR-012). */
export {
  ASSETS_DIRECTORY,
  ASSET_NOTICE_FILE,
  CHECKED_PORT_ENVIRONMENT,
  FixtureError,
  REQUIRED_FIXTURE_FIELDS,
  TEMPLATE_STATE_DIRECTORY,
  asIsPathOf,
  assertAssetIsNotOfTheEntryNotCarried,
  assertAssetsCarryTheirNotice,
  assertNoPhysicalPortStatePath,
  assetBaselines,
  assetIsImported,
  assetIsUnchanged,
  importedAssetPath,
  layOutStateFile,
  licenceOfBaseline,
  logicalNamesWithAnAsIsPath,
  portStateMarkers,
  portStateRoots,
  readAssetNotice,
  stateFilesOfTemplate,
  validateFixture,
  type AsIsAsset,
  type FixtureDeclaration,
  type NoticeEntry,
  type Side,
} from "./catalogue/fixture.ts";

/** The declaration check of parity and characterization tests (T023, F141-FR-027, F141-FR-028). */
export {
  CHARACTERIZATION_TEST_NAME,
  DeclarationError,
  OWNED_PATHS,
  PARITY_TEST_NAME,
  PROVES_ID,
  REGISTRY_SCENARIOS,
  SWEEP,
  SYSTEMS_WITH_NO_REFERENCE,
  assertDeclarationMayRun,
  assertNotAParityTestOfABehaviourWithNoReference,
  behaviourWithNoReference,
  checkDeclarations,
  citationsOf,
  declarationsOfTasksFile,
  declarationsOfTestFile,
  exitCodeOf,
  externalFindingsOf,
  featureOfName,
  genericStubName,
  harnessesWithATestedAdapter,
  harnessesWithNoReference,
  headerEndOf,
  isOwnedByTheOracle,
  kindOfName,
  nameIsMalformed,
  namesOfLine,
  piStubName,
  provesIdsOf,
  refusalsOf,
  reportLines,
  surfaceNamesOf,
  violationsOfDeclaration,
  type Declaration,
  type Finding,
  type OfferedInstead,
  type Report,
  type TestKind,
} from "./catalogue/declarations.ts";

/** The citing page `CITING.md`, generated from the data files (T024). */
export {
  CITING_PAGE,
  CITING_SECTIONS,
  DECLARATION_FIELDS,
  RESULTS,
  RESULT_RULES,
  RULES_IN_SHORT,
  TEST_NAMES,
  renderCiting,
} from "./catalogue/citing.ts";

/** The command `npm run oracle -- <command>` of this phase (T023, T024). */
export {
  CITING_FILE,
  COMMANDS,
  run as runOracleCommand,
  runCheckCiting,
  runCheckDeclarations,
  runWriteCiting,
  type Command,
  type Outcome,
} from "./main.ts";
