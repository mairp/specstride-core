// F154-FR-043 (T024) — the temporary root of the run, extracted from
// `run-feature.ts` so the change stays small and reviewable. The behaviour
// is exactly the engine's: with `host.limits` on (and outside the `parity`
// profile) the run makes ONE temporary root — a `mkdtemp` directory under
// the system temporary area, prefix `specstride-run-` — exports it as
// `TMPDIR` (the variable the gate's checks read at :1273) and as
// `SPECSTRIDE_WORKER_TMPDIR` (the variable the parallel workers read), and
// removes it where the run ends, for any cause. Any failure to make the
// root is a fallback, never an error (F154-FR-004): the run carries on with
// a `null` root. Internal to the CLI; nothing is exported publicly.
import { realpathSync } from "node:fs";
import { loadConfigFiles, resolveConfiguration } from "@specstride/config";
import { makeTempRoot, removeTempRoot } from "../../../runtime/src/limits/temp-root.ts";

/** The environment of the process, narrowed to the keys the helper reads. */
export type RunTempRootEnv = {
  readonly TMPDIR?: string;
  readonly SPECSTRIDE_WORKER_TMPDIR?: string;
  readonly XDG_CONFIG_HOME?: string;
};

/**
 * Make the run's temporary root: non-null only outside the `parity` profile
 * and only when the resolved `host.limits` key is on. Every failure falls
 * back to `null` — never an error.
 */
export function makeRunTempRoot(input: {
  home: string;
  workdir: string;
  parityProfile: boolean;
  env: RunTempRootEnv;
}): string | null {
  if (input.parityProfile) return null;
  try {
    const files = loadConfigFiles({
      home: input.home,
      ...(input.env.XDG_CONFIG_HOME === undefined
        ? {}
        : { xdgConfigHome: input.env.XDG_CONFIG_HOME }),
      workspaceRealPath: realpathSync(input.workdir),
      startDir: input.workdir,
    });
    const resolved = resolveConfiguration({
      ...(files.user === undefined ? {} : { user: files.user }),
      ...(files.project === undefined ? {} : { project: files.project }),
      environment: process.env,
    });
    const hostLimits = resolved.values.get("host.limits");
    const on = hostLimits === undefined ? false : hostLimits.value !== false;
    return on ? makeTempRoot() : null;
  } catch {
    return null;
  }
}

/** Export the root to the gate's checks and to the parallel workers, and say it. */
export function exportRunTempRoot(
  root: string,
  env: Record<string, string | undefined>,
  say: (line: string) => void,
  slug: string,
): void {
  env.TMPDIR = root;
  env.SPECSTRIDE_WORKER_TMPDIR = root;
  say(`[${slug}] temporary root of the run: ${root}`);
}

/**
 * F154-FR-039 (T095) — whether the resolved `host.limits` switch is IN FORCE
 * for this start: on outside the `parity` profile and on in the resolved
 * values. Every failure of the configuration read is off — never an error.
 */
export function hostLimitsInForceOfTheStart(input: {
  home: string;
  workdir: string;
  parityProfile: boolean;
  env: RunTempRootEnv;
}): boolean {
  if (input.parityProfile) return false;
  try {
    const files = loadConfigFiles({
      home: input.home,
      ...(input.env.XDG_CONFIG_HOME === undefined
        ? {}
        : { xdgConfigHome: input.env.XDG_CONFIG_HOME }),
      workspaceRealPath: realpathSync(input.workdir),
      startDir: input.workdir,
    });
    const resolved = resolveConfiguration({
      ...(files.user === undefined ? {} : { user: files.user }),
      ...(files.project === undefined ? {} : { project: files.project }),
      environment: process.env,
    });
    const hostLimits = resolved.values.get("host.limits");
    return hostLimits === undefined ? false : hostLimits.value !== false;
  } catch {
    return false;
  }
}

/** Remove the root where the run ends, for any cause, and unset the exports. */
export function cleanupRunTempRoot(
  root: string | null,
  env: Record<string, string | undefined>,
): void {
  if (root === null) return;
  removeTempRoot(root);
  delete env.SPECSTRIDE_WORKER_TMPDIR;
  if (env.TMPDIR === root) delete env.TMPDIR;
}
