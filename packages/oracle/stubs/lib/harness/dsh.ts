/**
 * T120 — the calling convention of the dsh stub (F141-FR-010, F141-FR-015).
 *
 * Read off the baseline at `9cab15d`, which is the whole of what the stub has to
 * follow:
 *
 * | Role | Argument list the baseline builds | Prompt |
 * |---|---|---|
 * | proposer | `dsh --profile <profile> <prompt>` (`proposer.sh`, the dsh arm of `run_agent`) | one positional argument |
 * | critic | `dsh --profile <profile> --patch <patch> -- <chunk>…` (`lib/critic.py`, `call_dsh_shell`) | after `--`, in chunks |
 * | installer | `dsh plugin --profile <profile> add --save-exact <spec>…` (`lib/dsh_plugin_requests.py`) | none |
 *
 * Two things of that table the generic reading of a positional argument gets
 * wrong, and both change the prompt the transcript records:
 *
 * 1. **The critic prompt arrives in chunks.** `_dsh_task_args` splits the prompt
 *    at ASCII spaces and packs the tokens into arguments under the 128 KiB
 *    ceiling, "because DSH headless joins its variadic task arguments with one
 *    ASCII space". The chunks are therefore joined by ONE SPACE, not by nothing:
 *    a prompt long enough to be split would otherwise be recorded with the space
 *    at every chunk boundary missing, and the nonce of the verdict contract could
 *    fall across a boundary.
 * 2. **The value of `--patch` is a positional-looking argument.** It is the path
 *    of the temporary patch file, not a word of the prompt. The prompt of a
 *    critic call is what stands after `--`, and nothing else.
 *
 * What the dsh stub records, as the table of §O.3 states it: the settings file of
 * the given home, the patch file and the permission mode. The CONTENT of each
 * file is recorded and never its path: both paths are temporary names made per
 * call (`specstride-dsh-home.XXXXXX`, a named temporary file ending in `.yml`),
 * so a path would differ between two runs of one side while the content is what
 * the scenario decided — the model selection of `dsh_make_home_overlay` and the
 * tool-disabling patch of `call_dsh_shell`.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import {
  conventionOfKnownHarness,
  promptFromTheCall,
  type HarnessCall,
  type HarnessConvention,
  type PromptOfCall,
} from "./conventions.ts";
import { isInstallerCall, recordsOfInstallerCall } from "./dsh-installer.ts";

/** The separator after which the chunked task of a critic call stands. */
export const TASK_SEPARATOR = "--" as const;

/** How DSH headless rejoins its variadic task arguments: with one ASCII space. */
export const TASK_CHUNK_JOIN = " " as const;

/** The option whose value is the path of the tool-disabling patch. */
export const PATCH_OPTION = "--patch" as const;

/** The variable that names the configuration home a call was given. */
export const HOME_VARIABLE = "DSH_HOME" as const;

/** The variable that carries the permission mode of a call. */
export const PERMISSION_MODE_VARIABLE = "DSH_PERMISSION_MODE" as const;

/** The file of the configuration home in which the model selection is written. */
export const SETTINGS_FILE = "settings.yaml" as const;

/** The prompt of one call of the dsh stub. */
export function promptOfDshCall(call: HarnessCall): PromptOfCall {
  const separator = call.argv.indexOf(TASK_SEPARATOR);
  if (separator >= 0) {
    // The critic form: the chunked task, rejoined exactly as DSH rejoins it.
    return Object.freeze({
      prompt: call.argv.slice(separator + 1).join(TASK_CHUNK_JOIN),
      promptChannel: "argument" as const,
    });
  }
  if (isInstallerCall(call.argv)) {
    // The installer form has no prompt at all: the request is the argument list.
    return Object.freeze({ prompt: "", promptChannel: "argument" as const });
  }
  // The proposer form: one positional argument, after `--profile <profile>`.
  const words = call.argv.filter(
    (argument, index) =>
      !argument.startsWith("-") && !(index > 0 && call.argv[index - 1] === "--profile"),
  );
  if (words.length > 0) {
    return Object.freeze({
      prompt: words[words.length - 1] as string,
      promptChannel: "argument" as const,
    });
  }
  return promptFromTheCall(call, "argument");
}

/** The content of a file the call was handed, or why it is not there. */
function contentOf(path: string | undefined): string | undefined {
  if (path === undefined || path === "") return undefined;
  try {
    if (!existsSync(path) || !statSync(path).isFile()) return undefined;
    return readFileSync(path, "utf8");
  } catch {
    return undefined;
  }
}

/**
 * What the dsh stub records of one call: the settings file of the given home, the
 * patch file and the permission mode (§O.3), and for an installer call the
 * request the controller resolved.
 */
export function recordsOfDshCall(call: HarnessCall): Readonly<Record<string, unknown>> | undefined {
  const given: Record<string, unknown> = {};
  const home = call.env[HOME_VARIABLE];
  const settings = contentOf(home === undefined ? undefined : join(home, SETTINGS_FILE));
  if (settings !== undefined) given["settings"] = settings;
  const patchIndex = call.argv.indexOf(PATCH_OPTION);
  const patch = contentOf(patchIndex < 0 ? undefined : call.argv[patchIndex + 1]);
  if (patch !== undefined) given["patch"] = patch;
  // The permission mode is the mode the CALL carries: the baseline sets it on the
  // command itself (`DSH_PERMISSION_MODE=… run_with_idle_watchdog …`, and
  // `read-only` for every critic call), from the fixture's own declared value or
  // from its own default. It is the mode of the call and not a value of the
  // machine: the hermetic environment is built from the allow-list, so no value of
  // this host can reach it (F141-FR-003).
  const mode = call.env[PERMISSION_MODE_VARIABLE];
  if (mode !== undefined && mode !== "") given["permissionMode"] = mode;
  if (isInstallerCall(call.argv)) Object.assign(given, recordsOfInstallerCall(call.argv));
  return Object.keys(given).length === 0 ? undefined : Object.freeze(given);
}

/** The convention of dsh: the data of its entry, with the two readings above. */
export function dshConvention(): HarnessConvention {
  return conventionOfKnownHarness("dsh", { prompt: promptOfDshCall, records: recordsOfDshCall });
}
