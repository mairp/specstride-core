/**
 * The reusable `host.*` doctor check set of a host (`src/doctor.ts`): the six
 * checks a host registers into the doctor registry of EP-14 (annex G §G.7),
 * the severity rules of the port, and the registration itself. A HOST SUPPLIES
 * ITS FACTS; THE KIT DECLARES THE CHECKS — the package the installed plugin
 * version is held against, the version itself, the count of the host hook
 * events the shipped configuration covers, the host's own fix for a
 * hooks-loaded failure, and the host's exec form with the evidence that
 * rejects its background job mode, are the one required `DoctorHost` input of
 * the `*Of` builders, with no default anywhere. The module moved once out of
 * `packages/host-claude-code/src/doctor.ts` (the split of the monorepo, U-1),
 * which keeps the old path and binds the set to its own host facts; the
 * requirement ids of that host left with it, so no text here names a host or
 * a requirement of one.
 *
 * The checks are the `DoctorCheck` shape of `@specstride/contracts/ep/doctor`
 * (annex G §G.7): every one reads and never writes, makes no paid call, reads
 * no secret value, and takes its observation from the INJECTED probes — a
 * host never probes its consumer's machine from inside a run. NONE of the six
 * is a launch check except a missing CLI — so `host.cli-found` alone carries
 * `lb`, and the launch checks are exactly the `lb` subset.
 */
import {
  CLI_PROTOCOL_VERSION,
  HOST_SKILL_IDS,
  DOCTOR_SKILL_ID,
} from "@specstride/contracts/ep/host";
import type { DoctorCheck, DoctorRegistry, Severity } from "@specstride/contracts/ep/doctor";

/** The prefix every host check carries. */
export const HOST_CHECK_PREFIX = "host." as const;

/** The six check ids of the host doctor, in the order the port names them. */
export const HOST_CHECK_IDS: readonly string[] = Object.freeze([
  "host.cli-found",
  "host.protocol-supported",
  "host.plugin-version",
  "host.host-hooks-loaded",
  "host.state-root-writable",
  "host.background-isolation",
]);

/** The one launch check: a missing CLI. Every other check never blocks a launch. */
export const LAUNCH_CHECK_IDS: readonly string[] = Object.freeze(["host.cli-found"]);

/** The severity of a check nobody observed yet: a warning, never a failure. */
export const SEVERITY_WHEN_NOT_OBSERVED: Severity = "warn";

/**
 * The skill ids the `host.host-hooks-loaded` check reads the configuration
 * against: the host skills of the port and the doctor skill, the row-144 ids
 * READ from the contracts so they cannot drift from the row.
 */
export const SKILLS_OF_THE_PORT: readonly string[] = Object.freeze([
  ...HOST_SKILL_IDS,
  DOCTOR_SKILL_ID,
]);

/* -------------------------------------------------------------------------
 * The background job mode of a host and the isolation warning
 * ---------------------------------------------------------------------- */

/** A host's background job mode is rejected as the runtime. */
export const BACKGROUND_JOB_MODE_REJECTED = true as const;

/** Why it is rejected: a background job would add a second runtime the product does not control. */
export const A_BACKGROUND_JOB_ADDS_A_SECOND_RUNTIME =
  "a background job would add a second runtime the product does not control" as const;

/** The fact of the verification record the rejection rests on until a capture runs. */
export const BACKGROUND_ISOLATION_FACT = "background-session-isolation" as const;

/** The warning the doctor prints when the host isolates the working tree. */
export const BACKGROUND_ISOLATION_WARNING =
  "the host isolates the working tree of a background session: state written inside the " +
  "isolation does not reach the workspace, and Specstride does not use the host's background " +
  "job mode as its runtime";

/** True when an isolation observation must warn: always. */
export function isolationWarns(isolated: boolean): boolean {
  return isolated;
}

/* -------------------------------------------------------------------------
 * The one input that is a host's
 * ---------------------------------------------------------------------- */

/**
 * The facts of ONE host the check set is built over. Every field is a fact of
 * the host and cannot be the kit's: the package name and the version getter
 * are the host's packaging, the event count is the host's own hook
 * configuration, and the two free-text fields are the host's own words.
 */
export type DoctorHost = {
  /** The package the installed plugin version is held against. */
  readonly packageName: string;
  /** The installed plugin version, read when the severity is decided. */
  readonly pluginVersion: () => string;
  /** The host hook events the shipped configuration covers. */
  readonly hookEventCount: number;
  /** The host's own fix for a hooks-loaded failure, in the host's words. */
  readonly hooksLoadedFixHint: string;
  /** The host's exec form that runs the CLI directly, spelled as the host spells it. */
  readonly backgroundExecForm: string;
  /** The evidence the background rejection rests on, in the host's words. */
  readonly backgroundEvidence: string;
};

/**
 * Why a host rejects its background job mode, in that host's own words: its
 * exec form runs the CLI directly, and a background job would add a second
 * runtime the product does not control, with the host's evidence named.
 */
export function backgroundJobModeRejectedBecauseOf(host: DoctorHost): string {
  return (
    `the host's ${host.backgroundExecForm} form runs the CLI directly, so ` +
    `${A_BACKGROUND_JOB_ADDS_A_SECOND_RUNTIME} (${host.backgroundEvidence})`
  );
}

/* -------------------------------------------------------------------------
 * The six checks
 * ---------------------------------------------------------------------- */

/** A severity rule that fails on `false` and passes on `true`. */
function booleanSeverity(observed: unknown): Severity {
  if (observed === undefined || observed === null) return SEVERITY_WHEN_NOT_OBSERVED;
  return observed === true ? "ok" : "fail";
}

/** One `host.*` check, built once and frozen. */
function hostCheck(check: DoctorCheck): DoctorCheck {
  return Object.freeze(check);
}

/**
 * `host.cli-found` — the ONLY launch check of the six: a missing CLI refuses
 * the launch, because every command of the product is a line of the CLI.
 */
export function cliFoundCheck(): DoctorCheck {
  return hostCheck({
    id: "host.cli-found",
    severityRule: booleanSeverity,
    lb: true,
    order: 1,
    probe: (injected) => Promise.resolve(injected["cli-found"]),
    messageTemplate: "the Specstride CLI is {state} on this machine",
    fixHint:
      "install the CLI with `npm install -g @specstride/cli`, or run the doctor skill, which " +
      "prints the command and never runs it",
  });
}

/** `host.protocol-supported` — the CLI speaks the protocol the plugin was built for. */
export function protocolSupportedCheck(): DoctorCheck {
  return hostCheck({
    id: "host.protocol-supported",
    severityRule: (observed) => {
      if (observed === undefined || observed === null) return SEVERITY_WHEN_NOT_OBSERVED;
      return observed === CLI_PROTOCOL_VERSION ? "ok" : "fail";
    },
    lb: false,
    order: 2,
    probe: (injected) => Promise.resolve(injected["protocol"]),
    messageTemplate: "the CLI answered with protocol {state}",
    fixHint:
      "the shim prints the one refusal line with both protocol numbers and names the doctor; " +
      "run the doctor skill",
  });
}

/** `host.plugin-version` — the plugin version equals the package version. */
export function pluginVersionCheckOf(host: DoctorHost): DoctorCheck {
  return hostCheck({
    id: "host.plugin-version",
    severityRule: (observed) => {
      if (observed === undefined || observed === null) return SEVERITY_WHEN_NOT_OBSERVED;
      return observed === host.pluginVersion() ? "ok" : "fail";
    },
    lb: false,
    order: 3,
    probe: (injected) => Promise.resolve(injected["plugin-version"]),
    messageTemplate: `the installed plugin of ${host.packageName} reports version {state}`,
    fixHint: `reinstall ${host.packageName} so the plugin version matches the package version`,
  });
}

/** `host.host-hooks-loaded` — the host loaded the configuration the plugin ships. */
export function hostHooksLoadedCheckOf(host: DoctorHost): DoctorCheck {
  return hostCheck({
    id: "host.host-hooks-loaded",
    severityRule: booleanSeverity,
    lb: false,
    order: 4,
    probe: (injected) => Promise.resolve(injected["host-hooks-loaded"]),
    messageTemplate: `the host hook configuration for ${host.hookEventCount} events is {state}`,
    fixHint: host.hooksLoadedFixHint,
  });
}

/** `host.state-root-writable` — the state root is writable (`unverified` until it is measured). */
export function stateRootWritableCheck(): DoctorCheck {
  return hostCheck({
    id: "host.state-root-writable",
    severityRule: (observed) => {
      if (observed === undefined || observed === null) return SEVERITY_WHEN_NOT_OBSERVED;
      if (observed === "unverified") return "warn";
      return observed === true ? "ok" : "fail";
    },
    lb: false,
    order: 5,
    probe: (injected) => Promise.resolve(injected["state-root-writable"]),
    messageTemplate: "the state root of the host is {state}",
    fixHint:
      "the product runs without a writable state root: the declared fallback applies until " +
      "the spike of feature 122 reports",
  });
}

/** `host.background-isolation` — the isolation warning. Never a launch refusal. */
export function backgroundIsolationCheck(): DoctorCheck {
  return hostCheck({
    id: "host.background-isolation",
    severityRule: (observed) => {
      if (observed === undefined || observed === null) return SEVERITY_WHEN_NOT_OBSERVED;
      return observed === true ? "warn" : "ok";
    },
    lb: false,
    order: 6,
    probe: (injected) => Promise.resolve(injected["background-isolation"]),
    messageTemplate: BACKGROUND_ISOLATION_WARNING,
    fixHint:
      "run Specstride in the foreground session; the host's background job mode is not the " +
      "runtime of the product",
  });
}

/** The six checks of a host, in the order of `HOST_CHECK_IDS`. */
export function hostDoctorChecksOf(host: DoctorHost): readonly DoctorCheck[] {
  return Object.freeze([
    cliFoundCheck(),
    protocolSupportedCheck(),
    pluginVersionCheckOf(host),
    hostHooksLoadedCheckOf(host),
    stateRootWritableCheck(),
    backgroundIsolationCheck(),
  ]);
}

/**
 * The registration into a registry: every check of `hostDoctorChecksOf(host)`
 * goes into the given registry. The registry itself belongs to EP-14; this
 * module only registers into it, and nothing here approves a check —
 * approval is a verified record of the gate, never an inner check.
 */
export function registerHostChecksOf(
  host: DoctorHost,
  registry: DoctorRegistry,
): readonly DoctorCheck[] {
  const checks = hostDoctorChecksOf(host);
  for (const check of checks) registry.register(check);
  return checks;
}

/** The checks of a host that are launch checks: exactly `LAUNCH_CHECK_IDS`. */
export function hostLaunchChecksOf(host: DoctorHost): readonly DoctorCheck[] {
  return hostDoctorChecksOf(host).filter((check) => check.lb);
}

/** True when an id is one of a host's checks. */
export function isHostCheck(id: string): boolean {
  return id.startsWith(HOST_CHECK_PREFIX) && HOST_CHECK_IDS.includes(id);
}
