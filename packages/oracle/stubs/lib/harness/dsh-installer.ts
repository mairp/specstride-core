/**
 * T121 — the plugin installer stub as the dsh stub called with the installer's
 * arguments (F141-FR-009, §O.3).
 *
 * §O.3 states it in one line: "Plugin installer stub (I). The dsh stub called
 * with the installer's arguments." So the installer is not a second executable
 * and not a switch of the fixture: it is the one dsh stub, and the ARGUMENT LIST
 * decides. The controller builds that list itself — never a shell — at the
 * pinned commit:
 *
 *     dsh plugin --profile <profile> add --save-exact <spec>…
 *
 * (`lib/dsh_plugin_requests.py`, `process_request`: `command = [dsh_bin,
 * "plugin", "--profile", profile, "add", "--save-exact", *request["plugins"]]`).
 *
 * `isInstallerCall` is therefore the one place that tells an installer call from
 * a pass or a critic call, and it reads the two words the controller puts there:
 * the subcommand `plugin` and the verb `add`. The earlier reading looked for the
 * word `install`, which the as-is argument list does not hold at all — a call of
 * the installer was read as a proposer pass and the scenario's script of the
 * installer was never reached.
 *
 * What the stub records of such a call is the request as the controller resolved
 * it: the profile, the package specs and whether the exact-save option was given.
 * The specs are the only content of the call; there is no prompt, so the record
 * of an installer call carries the empty prompt and the installer's own fields.
 */

/** The subcommand and the verb the controller's argument list holds. */
export const INSTALLER_SUBCOMMAND = "plugin" as const;
export const INSTALLER_VERB = "add" as const;

/** The option with which the controller pins every version exactly. */
export const INSTALLER_EXACT_OPTION = "--save-exact" as const;

/** The option that names the profile the plugin is installed into. */
export const INSTALLER_PROFILE_OPTION = "--profile" as const;

/** What the installer was asked to install. */
export type InstallerCall = {
  readonly profile?: string;
  /** The exact `package@semver` specs, in the order the request held them. */
  readonly plugins: readonly string[];
  readonly saveExact: boolean;
};

/**
 * Is this call of the dsh stub the installer call? It is exactly when the
 * argument list carries the subcommand and the verb the controller builds.
 */
export function isInstallerCall(argv: readonly string[]): boolean {
  return argv.includes(INSTALLER_SUBCOMMAND) && argv.includes(INSTALLER_VERB);
}

/**
 * The installer call as the controller built it. Everything after the verb that
 * is no option is a package spec; `--profile` names the profile.
 */
export function installerCallOf(argv: readonly string[]): InstallerCall {
  const verbIndex = argv.indexOf(INSTALLER_VERB);
  const after = verbIndex < 0 ? [] : argv.slice(verbIndex + 1);
  const profileIndex = argv.indexOf(INSTALLER_PROFILE_OPTION);
  const profile = profileIndex >= 0 ? argv[profileIndex + 1] : undefined;
  return Object.freeze({
    ...(profile === undefined ? {} : { profile }),
    plugins: Object.freeze(after.filter((argument) => !argument.startsWith("-"))),
    saveExact: argv.includes(INSTALLER_EXACT_OPTION),
  });
}

/** What the transcript records of an installer call (`given` of the record). */
export function recordsOfInstallerCall(argv: readonly string[]): Readonly<Record<string, unknown>> {
  const call = installerCallOf(argv);
  return Object.freeze({
    installer: Object.freeze({
      subcommand: INSTALLER_SUBCOMMAND,
      verb: INSTALLER_VERB,
      ...(call.profile === undefined ? {} : { profile: call.profile }),
      plugins: call.plugins,
      saveExact: call.saveExact,
    }),
  });
}
