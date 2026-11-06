/**
 * T052 — rule N-08, temporary names (F141-FR-020).
 *
 * "Generated suffixes and names of temporary files become a placeholder."
 *
 * The two baselines make temporary files with `mktemp`, which appends six random
 * characters, and with their own `<name>.<n>.tmp` forms. Both sides generate such
 * a name per call, so the NAME is no behaviour; that a temporary file existed, and
 * what was in it, is.
 *
 * The rule runs after N-01, which has already turned the directory the file lay in
 * into `<temp>` or `<workdir>`; what is left is the generated part of the name.
 */
import { collect, replaceInSurfaces } from "./walk.ts";
import type { MutableCapture, Rule } from "./types.ts";

/** The forms of a generated name the two baselines make. */
export const TEMPORARY_NAME_PATTERNS: readonly RegExp[] = Object.freeze([
  // mktemp: a stem, a dot or dash, and six or more generated characters.
  /(specstride-[a-z-]*|mol-[a-z-]*|tmp)[.-][A-Za-z0-9]{6,}/g,
  // A generated suffix before a known extension.
  /\.[A-Za-z0-9]{6,}\.tmp\b/g,
  // The generated launch bundle of mixture-of-loops: the directory under
  // `generated/` and the feature is named by a digest of the contract, and the contract
  // holds the absolute root of the launch directory, so the name is different in
  // every run of the same scenario. The feature stays; the generated name goes.
  /(generated\/[a-z0-9][a-z0-9-]*\/)[0-9a-f]{12,}/g,
]);

/**
 * The generated bundle name where it stands ALONE, outside the path it was taken
 * from: `cmdline_markers` of the launch record of mixture-of-loops is
 * `[str(bundle.launcher), bundle.bundle.name]` (`supervisor_lib.py:620` at the pinned
 * commit), so the second marker is the bare name of the content-addressed bundle
 * directory. It is a prefix of the digest of the contract, and the contract holds the
 * absolute root of the launch directory, so it differs in every run of one scenario
 * just as the directory does.
 *
 * It is replaced only where the SAME name was seen as a generated bundle DIRECTORY in
 * the same capture: a bare run of hexadecimal is otherwise a hash, which N-09 to N-11
 * own, and this rule must not reach one.
 */
export const GENERATED_BUNDLE_DIRECTORY = /generated\/[a-z0-9][a-z0-9-]*\/([0-9a-f]{12,})/g;

/** The placeholder a generated name becomes. */
export const TEMPORARY_NAME_PLACEHOLDER = "<generated>" as const;

/** N-08. */
export const N08: Rule = {
  id: "N-08",
  subject: "Temporary names",
  surfaces: [],
  apply(capture: MutableCapture): number {
    const bundleNames = new Set(
      collect(capture.surfaces, (node) => (typeof node === "string" ? node : undefined)).flatMap(
        (text) =>
          [...text.matchAll(new RegExp(GENERATED_BUNDLE_DIRECTORY.source, "g"))].map(
            (match) => match[1] as string,
          ),
      ),
    );
    return replaceInSurfaces(capture.surfaces, [], (value) => {
      let text = value;
      text = text.replace(
        new RegExp((TEMPORARY_NAME_PATTERNS[0] as RegExp).source, "g"),
        (_whole, stem: string) => `${stem}${TEMPORARY_NAME_PLACEHOLDER}`,
      );
      text = text.replace(
        new RegExp((TEMPORARY_NAME_PATTERNS[1] as RegExp).source, "g"),
        `${TEMPORARY_NAME_PLACEHOLDER}.tmp`,
      );
      text = text.replace(
        new RegExp((TEMPORARY_NAME_PATTERNS[2] as RegExp).source, "g"),
        (_whole, before: string) => `${before}${TEMPORARY_NAME_PLACEHOLDER}`,
      );
      for (const name of bundleNames) {
        // A WHOLE token only: the digest the name is a prefix of also stands in the
        // capture, and cutting its first twenty characters would hide it from N-09 to
        // N-11, whose subject it is.
        text = text.replace(
          new RegExp(`(?<![0-9a-f])${name}(?![0-9a-f])`, "g"),
          TEMPORARY_NAME_PLACEHOLDER,
        );
      }
      return text;
    });
  },
};
