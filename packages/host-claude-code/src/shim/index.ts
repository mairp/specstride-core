/**
 * T007 of `specs/113-host-claude-code/tasks.md` — the executable shim of the
 * plugin. The MODULE moved to `@specstride/host-kit` (`src/shim.ts` there) in
 * the split of the monorepo, and this file re-exports it from the old path so
 * the imports of this package keep working; the module itself lives in one
 * place (the rule of the split: a module moves once, an old path re-exports).
 *
 * What the kit does not fix — the HOST-NAMING wording of the shipped script —
 * this file passes in: the provenance comment that names this plugin and the
 * sentence about the `<package>/plugin/bin/` layout the shim lies in. The CODE
 * of the shipped script is the kit's, unchanged. The re-export imports only
 * `@specstride/host-kit` — never `@specstride/contracts` directly, which the
 * rule file `tools/import-boundary/rules/113-host-claude-code-build-time-only.json`
 * (RF-113-01) forbids for this directory, because the rendered file is copied
 * into `plugin/bin/` as a standalone script and the plugin layer carries no
 * runtime dependency (F113-FR-030, F113-FR-031, threat T-44).
 */
import {
  EXECUTABLE_VARIABLE,
  EXECUTABLE_NAME,
  PROTOCOL_FLAG,
  supportedRange,
  shimScript as kitShimScript,
  type ShimScriptOptions,
} from "@specstride/host-kit/shim";

export {
  /** annex H §H.1 and annex G §G.1 and §G.4, inlined in the kit. */
  EXECUTABLE_VARIABLE,
  CLI_PROTOCOL_VERSION,
  SUPPORTED_PROTOCOL_MIN,
  SUPPORTED_PROTOCOL_MAX,
  PROTOCOL_MISMATCH_LINE,
  PROTOCOL_MISMATCH_EXIT_CODE,
  CLI_NOT_FOUND_EXIT_CODE,
  PROTOCOL_FLAG,
  EXECUTABLE_NAME,
  PUBLISHED_PACKAGE,
  PLUGIN_VERSION,
  INSTALL_COMMAND,
  DOCTOR_COMMAND,
  CLI_FOUND_CHECK,
  PROTOCOL_CHECK,
  INSTALLS_OR_UPDATES,
  RESOLUTION_ORDER,
  publishedPackageRoot,
  searchPathEntries,
  resolveExecutable,
  readProtocol,
  protocolIsSupported,
  supportedRange,
  refusalLine,
  missingCliLine,
  refusesForVersionDifference,
  decide,
  SHIM_FILE_NAME,
} from "@specstride/host-kit/shim";

export type {
  ResolutionSource,
  ShimProbe,
  ResolutionStep,
  Resolution,
  ShimDecision,
  ShimScriptOptions,
} from "@specstride/host-kit/shim";

/**
 * The provenance comment of the shipped script: this plugin, its feature, and
 * the resolution order of F113-FR-018. The values are interpolated from the
 * kit's constants, so the words and the inlined constants cannot drift. The
 * wording is the one the plugin has always shipped (rule 1 of the split: the
 * built plugin does not change).
 */
const PLUGIN_HEADER_LINES: readonly string[] = Object.freeze([
  "// The executable shim of the Specstride plugin for Claude Code (T007 of",
  "// specs/113-host-claude-code/tasks.md; F113-FR-018, F113-FR-019).",
  "//",
  "// GENERATED from packages/host-claude-code/src/shim/index.ts, which inlines",
  "// every constant of annex H section H.1 and annex G sections G.1 and G.4. Do",
  "// not edit this file: edit that module. A test holds the two against each",
  "// other byte for byte.",
  "//",
  "// It finds the CLI in the order of F113-FR-018 — the explicit variable",
  `// ${EXECUTABLE_VARIABLE} of the consumer, the search path, the package the plugin was`,
  `// published with — calls ${EXECUTABLE_NAME} ${PROTOCOL_FLAG}, compares the integer with the`,
  `// range it supports (${supportedRange()}), and refuses a mismatch with ONE line that names`,
  "// the doctor. It FETCHES, INSTALLS AND UPDATES NOTHING.",
]);

/**
 * The comment above the published-package lookup: the layout of THIS plugin,
 * `<package>/plugin/bin/`, is what fixes the root two directories above.
 */
const PLUGIN_PUBLISHED_COMMENT_LINES: readonly string[] = Object.freeze([
  "// The third step of F113-FR-018: the package the plugin was published with.",
  "// The shim lies at <package>/plugin/bin/specstride, so the root is two",
  "// directories above its own.",
]);

/**
 * The executable shim of THIS plugin, as it ships in `plugin/bin/specstride.mjs`:
 * the kit's script with this host's wording. A test holds the file on disk
 * against this text byte for byte and then RUNS it against stub CLIs.
 */
export function shimScript(options: ShimScriptOptions = {}): string {
  return kitShimScript({
    headerLines: PLUGIN_HEADER_LINES,
    publishedCommentLines: PLUGIN_PUBLISHED_COMMENT_LINES,
    ...options,
  });
}
