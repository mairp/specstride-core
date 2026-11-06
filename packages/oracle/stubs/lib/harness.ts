/**
 * T044, T120 — the entry point of every stub executable of `stubs/bin/`.
 *
 * The implementation and the calling conventions live in `harness/`, one module
 * per harness (`harness/claude.ts`, `harness/dsh.ts`, `harness/codex.ts`,
 * `harness/prime.ts`, `harness/pi.ts`, `harness/generic.ts`, and
 * `harness/dsh-installer.ts` for the installer's argument list), on the data of
 * `packages/oracle/data/stub-vocabulary.json`. This file stays where the
 * executables of `stubs/bin/` import from, so a bin file is one line of its own
 * and nothing more (`bin-files.ts`), and re-exports what the oracle's own tests
 * and tools read.
 */
export {
  CONVENTION_MODULES,
  HARNESS_ENVIRONMENT,
  HARNESS_ROLES,
  HarnessConventionError,
  HarnessStubError,
  INSTALLER_SUBCOMMAND,
  INSTALLER_VERB,
  PI_HAS_NO_REFERENCE,
  VERIFICATION_SUBCOMMAND,
  claudeConvention,
  codexConvention,
  conventionFromEntry,
  conventionOf,
  conventionOfKnownHarness,
  conventions,
  dshConvention,
  genericConvention,
  harnessMain,
  harnessStubEntries,
  harnessStubEntry,
  installerCallOf,
  isInstallerCall,
  modeOfPrimeCall,
  piConvention,
  positionalArguments,
  primeConvention,
  promptChannelOfEntry,
  promptChannelOfHarness,
  promptFromTheCall,
  promptOfDshCall,
  promptOfHarnessCall,
  recordsOfDshCall,
  recordsOfInstallerCall,
  roleOfInvocation,
  runHarnessStub,
  scriptOfRole,
  variantOfPrimeCall,
  type HarnessCall,
  type HarnessConvention,
  type HarnessRole,
  type HarnessStubEntry,
  type PromptOfCall,
} from "./harness/index.ts";
