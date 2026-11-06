/**
 * T013 — the network guard and the credential guard (F141-FR-038).
 *
 * No test and no build job of the oracle calls a paid or external model API.
 * The oracle replaces every model with a scripted stub, so there is nothing to
 * call; this module is what makes that checkable rather than claimed.
 *
 * The network guard patches the one place every outgoing connection of a Node
 * process goes through, `Socket.prototype.connect` of `node:net`, and the two
 * module-level entry points `net.connect` and `net.createConnection`. An
 * address that is not loopback fails the run: by default the guard writes the
 * refusal to standard error and ends the process with
 * `NETWORK_GUARD_EXIT_CODE`, so a stub or a side under test that tries to
 * reach a provider cannot carry on. `node:http`, `node:https` and `node:tls`
 * open their sockets through `node:net`, so they are covered by the same patch.
 *
 * A host that is not a loopback literal is refused, a name included: the
 * oracle reaches the critic stub at `127.0.0.1`, so no run has a reason to
 * resolve a name, and a name that resolved to a loopback address would be a
 * way around the guard.
 *
 * The credential guard refuses an environment that carries a credential of the
 * machine. The names are those a provider of models or a harness uses; a name
 * is on the list because a stub must be reached instead, never because the
 * value is secret. The two names the critic stub needs may carry exactly one
 * value, `DUMMY_CREDENTIAL`, which the oracle sets itself. No value is ever
 * printed: a refusal names the variable only.
 */
import net from "node:net";
import process from "node:process";

/** The fixed exit code of a run that tried to reach an address beyond loopback. */
export const NETWORK_GUARD_EXIT_CODE = 96 as const;

/** The fixed exit code of a run that a credential of the machine reached. */
export const CREDENTIAL_GUARD_EXIT_CODE = 95 as const;

/** The loopback hosts a run may reach. */
export const LOOPBACK_HOSTS: readonly string[] = [
  "127.0.0.1",
  "::1",
  "localhost",
  "0:0:0:0:0:0:0:1",
];

/**
 * The value the two variables of the critic stub may carry. It is not a
 * credential: the stub never looks at it, and the name says so.
 */
export const DUMMY_CREDENTIAL = "oracle-stub-dummy-not-a-credential" as const;

/**
 * The variables a run of the oracle must never see with a value of the
 * machine. The first group is the key of a provider of models; the second is
 * what a harness uses to find an account or a session. The build jobs of
 * `.github/workflows/oracle.yml` empty the same list before any step runs
 * (`.github/workflows/scripts/no-credentials.mjs`, T004).
 */
export const CREDENTIAL_VARIABLE_NAMES: readonly string[] = [
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_AUTH_TOKEN",
  "ANTHROPIC_BASE_URL",
  "CLAUDE_CODE_OAUTH_TOKEN",
  "OPENAI_API_KEY",
  "OPENAI_BASE_URL",
  "OPENROUTER_API_KEY",
  "GEMINI_API_KEY",
  "GOOGLE_API_KEY",
  "Z_AI_API_KEY",
  "ZAI_API_KEY",
  "DEEPSEEK_API_KEY",
  "AWS_BEARER_TOKEN_BEDROCK",
  "GH_TOKEN",
  "GITHUB_TOKEN",
  "NPM_TOKEN",
];

/**
 * The names the oracle sets itself, to the stub's address or to the dummy key.
 * They are on the list above because a value of the machine in them would
 * reach a provider; the oracle's own value is allowed.
 */
export const OWN_VALUES: Readonly<Record<string, readonly string[]>> = Object.freeze({
  ANTHROPIC_API_KEY: [DUMMY_CREDENTIAL],
  OPENAI_API_KEY: [DUMMY_CREDENTIAL],
});

/** A connection a run tried to open beyond loopback. */
export class NetworkGuardError extends Error {
  readonly host: string;
  constructor(host: string, port?: number) {
    super(
      `the oracle refuses a connection to ${host}${port === undefined ? "" : `:${String(port)}`}: ` +
        `a run reaches no address other than loopback (${LOOPBACK_HOSTS.join(", ")}). ` +
        `No test and no build job of the oracle calls a paid or external model API (F141-FR-038)`,
    );
    this.name = "NetworkGuardError";
    this.host = host;
  }
}

/** A credential of the machine that reached, or would reach, a run. */
export class CredentialGuardError extends Error {
  readonly variables: readonly string[];
  constructor(variables: readonly string[]) {
    super(
      `the oracle refuses a run that a credential of the machine reaches: ` +
        `${variables.join(", ")}. Every model of a run is a scripted stub, so none of these is ` +
        `needed; the value is not printed (F141-FR-038)`,
    );
    this.name = "CredentialGuardError";
    this.variables = Object.freeze([...variables]);
  }
}

/**
 * Whether a host is the local machine. An empty host is the local machine,
 * which is what `net.connect({ port })` means. Every address in `127.0.0.0/8`
 * is loopback; a name other than `localhost` is not, because the oracle never
 * needs one.
 */
export function isLoopbackHost(host: string | undefined): boolean {
  if (host === undefined || host === "") return true;
  const bare = host.replace(/^\[/, "").replace(/\]$/, "").toLowerCase();
  if (LOOPBACK_HOSTS.includes(bare)) return true;
  if (/^127(\.\d{1,3}){3}$/.test(bare)) return true;
  if (bare === "::ffff:127.0.0.1") return true;
  return false;
}

/** Refuse a host that is not loopback. */
export function assertLoopback(host: string | undefined, port?: number): void {
  if (!isLoopbackHost(host)) throw new NetworkGuardError(host ?? "", port);
}

/** Every credential variable of the machine in an environment. */
export function credentialVariablesOf(env: Readonly<Record<string, string | undefined>>): string[] {
  const found: string[] = [];
  for (const name of CREDENTIAL_VARIABLE_NAMES) {
    const value = env[name];
    if (value === undefined || value === "") continue;
    const own = OWN_VALUES[name] ?? [];
    if (own.includes(value)) continue;
    // The address of the critic stub is the oracle's own value too.
    if (name.endsWith("_BASE_URL")) {
      const host = /^[a-z]+:\/\/([^/:]+)/.exec(value)?.[1];
      if (host !== undefined && isLoopbackHost(host)) continue;
    }
    found.push(name);
  }
  return found;
}

/** Refuse an environment that carries a credential of the machine. */
export function assertNoCredentialOfTheMachine(
  env: Readonly<Record<string, string | undefined>> = process.env,
): void {
  const found = credentialVariablesOf(env);
  if (found.length > 0) throw new CredentialGuardError(found);
}

export type NetworkGuardOptions = {
  /**
   * `exit` writes the refusal to standard error and ends the process with
   * `NETWORK_GUARD_EXIT_CODE`, which is how a run fails. `throw` throws
   * `NetworkGuardError` instead, which is what a caller that handles it uses.
   */
  readonly onRefusal?: "exit" | "throw";
};

type ConnectArgs = unknown[];

/**
 * The host a call of `connect` names, in any of the forms `node:net` takes:
 * `(options)`, `(port[, host])`, `(path)`, and the normalized form
 * `([options, callback])` that `net.connect` hands to `Socket.prototype.connect`.
 */
function hostOf(args: ConnectArgs): { host: string | undefined; port: number | undefined } {
  const first = Array.isArray(args[0]) ? (args[0] as ConnectArgs)[0] : args[0];
  if (typeof first === "object" && first !== null) {
    const options = first as { host?: string; port?: number; path?: string };
    // A unix socket has a path and no host: it reaches no address at all.
    if (typeof options.path === "string") return { host: "127.0.0.1", port: undefined };
    return { host: options.host, port: options.port };
  }
  if (typeof first === "string") {
    // `connect(path[, callback])`: a unix socket.
    return { host: "127.0.0.1", port: undefined };
  }
  if (typeof first === "number") {
    const second = args[1];
    return { host: typeof second === "string" ? second : undefined, port: first };
  }
  return { host: undefined, port: undefined };
}

/**
 * Install the network guard in this process, and give back the function that
 * takes it off again. Every outgoing connection of the process goes through
 * `Socket.prototype.connect`, so a patch there covers `node:net`,
 * `node:http`, `node:https` and `node:tls` at once.
 */
export function installNetworkGuard(options: NetworkGuardOptions = {}): () => void {
  const onRefusal = options.onRefusal ?? "exit";

  const refuse = (host: string | undefined, port: number | undefined): never => {
    const error = new NetworkGuardError(host ?? "", port);
    if (onRefusal === "throw") throw error;
    process.stderr.write(`${error.message}\n`);
    process.exit(NETWORK_GUARD_EXIT_CODE);
  };

  /**
   * The patch. `node:net` gives `connect` four overloads and the guard has to
   * stand in front of all of them, so the wrapper is written against the raw
   * argument list and put back through `Unknown`: the only thing it does with
   * the arguments is read the host out of them and hand them on unchanged.
   */
  type Unknown = (...args: ConnectArgs) => unknown;
  const guard = (original: Unknown): Unknown =>
    function patched(this: unknown, ...args: ConnectArgs): unknown {
      const { host, port } = hostOf(args);
      if (!isLoopbackHost(host)) refuse(host, port);
      return original.apply(this, args);
    };

  const socketConnect = net.Socket.prototype.connect;
  const moduleConnect = net.connect;
  const moduleCreate = net.createConnection;

  net.Socket.prototype.connect = guard(socketConnect as Unknown) as typeof socketConnect;
  (net as { connect: typeof net.connect }).connect = guard(
    moduleConnect as Unknown,
  ) as typeof moduleConnect;
  (net as { createConnection: typeof net.createConnection }).createConnection = guard(
    moduleCreate as Unknown,
  ) as typeof moduleCreate;

  return () => {
    net.Socket.prototype.connect = socketConnect;
    (net as { connect: typeof net.connect }).connect = moduleConnect;
    (net as { createConnection: typeof net.createConnection }).createConnection = moduleCreate;
  };
}

/**
 * Install the credential guard in this process: a credential of the machine in
 * the environment ends the run with `CREDENTIAL_GUARD_EXIT_CODE` before it can
 * do anything else. The value is never printed.
 */
export function installCredentialGuard(
  env: Readonly<Record<string, string | undefined>> = process.env,
  options: NetworkGuardOptions = {},
): void {
  const found = credentialVariablesOf(env);
  if (found.length === 0) return;
  const error = new CredentialGuardError(found);
  if (options.onRefusal === "throw") throw error;
  process.stderr.write(`${error.message}\n`);
  process.exit(CREDENTIAL_GUARD_EXIT_CODE);
}

/**
 * Both guards, in the order a run needs them: the credential guard first,
 * because a run that a credential reached must not start at all, and then the
 * network guard for everything the run goes on to do. Every stub calls this
 * before it reads its script (`stubs/lib/main.ts`).
 */
export function installGuards(options: NetworkGuardOptions = {}): () => void {
  installCredentialGuard(process.env, options);
  return installNetworkGuard(options);
}
