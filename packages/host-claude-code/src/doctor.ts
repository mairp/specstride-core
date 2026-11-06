/**
 * T022 — the `host.*` doctor checks of this plugin, registered in the doctor
 * registry of EP-14 (F113-FR-033), and the background isolation warning
 * (F113-FR-032).
 *
 * F113-FR-033: the plugin MUST register its host checks in the doctor registry
 * with the prefix `host.`, at least: CLI found, protocol supported, plugin
 * version equals package version, host hooks loaded, state root writable,
 * background isolation. NONE is a launch check except a missing CLI — so
 * `host.cli-found` alone carries `lb`.
 *
 * F113-FR-032: the host's own background job mode is considered and rejected
 * as the runtime, and the doctor MUST warn when it isolates the working tree —
 * which `host.background-isolation` does, always as a `warn`, never as a
 * launch refusal.
 *
 * The REUSABLE CHECK SET moved to `@specstride/host-kit` (`src/doctor.ts`
 * there, the split of the monorepo, U-1): the ids, the prefix, the severity
 * rules, the generic message templates and the registration are the kit's,
 * built over the one required `DoctorHost` input. THIS module holds what is a
 * fact of the host and cannot be the kit's:
 *
 *  - the package the plugin version is held against and the version itself
 *    (`./packaging.ts`);
 *  - the host hook events the shipped configuration covers (`./hooks.ts`);
 *  - the host's own fix for a hooks-loaded failure (`claude plugin validate`);
 *  - the host's exec form (`--exec`) and the evidence (R3v C1; F113-FR-032)
 *    that rejects its background job mode;
 *  - the plugin directory the checks describe;
 * and the binding of the kit builders to that data, so every import path of
 * this module keeps its shape and every consumer reads the same values as
 * before the move. Two fix hints lose their `(F113-FR-0…)` tail at the kit:
 * requirement ids of a host stay in the host package, and no test held a tail.
 */
import type { DoctorCheck, DoctorRegistry } from "@specstride/contracts/ep/doctor";
import { HOOK_EVENT_IDS } from "./hooks.ts";
import { PLUGIN_PACKAGE_NAME, pluginVersion, PLUGIN_DIRECTORY } from "./packaging.ts";
import {
  type DoctorHost,
  BACKGROUND_ISOLATION_FACT,
  BACKGROUND_ISOLATION_WARNING,
  BACKGROUND_JOB_MODE_REJECTED,
  HOST_CHECK_IDS,
  HOST_CHECK_PREFIX,
  LAUNCH_CHECK_IDS,
  SEVERITY_WHEN_NOT_OBSERVED,
  SKILLS_OF_THE_PORT,
  backgroundIsolationCheck,
  backgroundJobModeRejectedBecauseOf,
  cliFoundCheck,
  hostDoctorChecksOf,
  hostHooksLoadedCheckOf,
  hostLaunchChecksOf,
  isolationWarns,
  isHostCheck,
  pluginVersionCheckOf,
  protocolSupportedCheck,
  registerHostChecksOf,
  stateRootWritableCheck,
} from "@specstride/host-kit";

export {
  /** The prefix every host check carries (F113-FR-033). */
  HOST_CHECK_PREFIX,
  /** The six check ids of F113-FR-033, in the order the kit holds them. */
  HOST_CHECK_IDS,
  /** The one launch check: a missing CLI. */
  LAUNCH_CHECK_IDS,
  /** The severity of a check nobody observed yet: a warning, never a failure. */
  SEVERITY_WHEN_NOT_OBSERVED,
  /** F113-FR-032 — the background job mode is rejected as the runtime. */
  BACKGROUND_JOB_MODE_REJECTED,
  /** The fact of the verification record the rejection rests on. */
  BACKGROUND_ISOLATION_FACT,
  /** The warning the doctor prints when the host isolates the working tree. */
  BACKGROUND_ISOLATION_WARNING,
  /** True when an isolation observation must warn: always (F113-FR-032). */
  isolationWarns,
  /** True when an id is one of this plugin's checks. */
  isHostCheck,
};

/** The skill ids the `host.host-hooks-loaded` check reads the configuration against. */
export const SKILLS_THE_PLUGIN_SHIPS = SKILLS_OF_THE_PORT;

/** The facts of THIS host the kit's check set is built over. */
const HOST: DoctorHost = {
  packageName: PLUGIN_PACKAGE_NAME,
  pluginVersion,
  hookEventCount: HOOK_EVENT_IDS.length,
  hooksLoadedFixHint:
    "run `claude plugin validate` on the plugin directory, or reinstall the plugin so the " +
    "hooks of the plugin directory are read again",
  backgroundExecForm: "`--exec`",
  backgroundEvidence: "R3v C1; F113-FR-032",
};

/**
 * F113-FR-032 — why THIS host rejects its background job mode: its `--exec`
 * form runs the CLI directly, and the evidence is R3v C1 with F113-FR-032.
 */
export const BACKGROUND_JOB_MODE_REJECTED_BECAUSE = backgroundJobModeRejectedBecauseOf(HOST);

/**
 * The six checks of F113-FR-033, in the order of `HOST_CHECK_IDS`, each the
 * kit's own check built over `HOST`. The checks are the `DoctorCheck` shape of
 * `@specstride/contracts/ep/doctor` (annex G §G.7): every one reads and never
 * writes, makes no paid call, reads no secret value, and takes its observation
 * from the INJECTED probes — the plugin itself never probes the consumer's
 * machine from inside a run.
 */
export const CLI_FOUND_CHECK = cliFoundCheck();
export const PROTOCOL_SUPPORTED_CHECK = protocolSupportedCheck();
export const PLUGIN_VERSION_CHECK = pluginVersionCheckOf(HOST);
export const HOST_HOOKS_LOADED_CHECK = hostHooksLoadedCheckOf(HOST);
export const STATE_ROOT_WRITABLE_CHECK = stateRootWritableCheck();
export const BACKGROUND_ISOLATION_CHECK = backgroundIsolationCheck();

/**
 * The registration of F113-FR-033: every check of `hostDoctorChecks()` goes
 * into the given registry. The registry itself belongs to EP-14 (feature 112);
 * this module only registers into it, and nothing here approves a check —
 * approval is a verified record of the gate, never an inner check.
 */
export function registerHostChecks(registry: DoctorRegistry): readonly DoctorCheck[] {
  return registerHostChecksOf(HOST, registry);
}

/** The six checks of F113-FR-033, in the order of `HOST_CHECK_IDS`. */
export function hostDoctorChecks(): readonly DoctorCheck[] {
  return hostDoctorChecksOf(HOST);
}

/** The checks of this module that are launch checks: exactly `LAUNCH_CHECK_IDS`. */
export function hostLaunchChecks(): readonly DoctorCheck[] {
  return hostLaunchChecksOf(HOST);
}

/** The directory of the plugin the checks describe, restated for the messages. */
export const CHECKED_PLUGIN_DIRECTORY: string = PLUGIN_DIRECTORY;
