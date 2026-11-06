/**
 * T052 — rule N-06, the nonce (F141-FR-020, F141-FR-021).
 *
 * "The 16 hexadecimal characters of each critic call become a numbered
 * placeholder. First the comparator asserts the form and that no two calls share a
 * nonce."
 *
 * The assertion comes FIRST and lives in `src/compare/assertions.ts`: once every
 * nonce is `<nonce-1>` neither its form nor its uniqueness can be seen. This
 * module exports `noncesOf` so that the assertion is made on the same values the
 * replacement will act on, and nothing is asserted about a value the rule would
 * not have replaced.
 */
import { collect, numberer, replaceInSurfaces } from "./walk.ts";
import type { MutableCapture, Rule } from "./types.ts";

/** The form of a nonce: sixteen hexadecimal characters (`secrets.token_hex(8)`). */
export const NONCE_PATTERN = /\b[0-9a-f]{16}\b/g;

/** Every nonce a capture holds, in the order it holds them. */
export function noncesOf(value: unknown): readonly string[] {
  const found: string[] = [];
  for (const text of collect(value, (node) => (typeof node === "string" ? node : undefined))) {
    for (const match of text.matchAll(new RegExp(NONCE_PATTERN.source, "g"))) found.push(match[0]);
  }
  return Object.freeze(found);
}

/** Every nonce that a verdict line bound to itself, which is one per critic call. */
export function boundNoncesOf(value: unknown): readonly string[] {
  const found: string[] = [];
  for (const text of collect(value, (node) => (typeof node === "string" ? node : undefined))) {
    for (const match of text.matchAll(/VERDICT\s+([0-9a-f]{16})/g)) found.push(match[1] as string);
  }
  return Object.freeze(found);
}

/** N-06. */
export const N06: Rule = {
  id: "N-06",
  subject: "Nonce",
  surfaces: [],
  apply(capture: MutableCapture): number {
    const number = numberer("nonce");
    return replaceInSurfaces(capture.surfaces, [], (value) =>
      value.replace(new RegExp(NONCE_PATTERN.source, "g"), (found) => number(found)),
    );
  },
};
