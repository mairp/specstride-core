/**
 * T053 — rules N-09, N-10 and N-11: the three classes of hash, with their
 * recomputation (F141-FR-020, F141-FR-021).
 *
 * | Rule | Class | What the rule does |
 * |---|---|---|
 * | N-09 | same class | "Hashes over fixture content must be equal and are not normalized" |
 * | N-10 | path class | "A hash whose input holds an absolute path is computed again from the side's own input, asserted, replaced by a placeholder, and the normalized inputs are compared" |
 * | N-11 | implementation class | "A hash over bytes of the implementation: self-consistency is asserted, the value becomes a placeholder, the content is not compared" |
 *
 * The three differ in what the hash was taken OVER, which is why a rule cannot
 * guess the class: the capture says it. A hash of the path class comes with the
 * input it was taken over — the launcher carries the bundle it was rendered from,
 * a plan hash carries the document it bound — and the rule RECOMPUTES the hash
 * from that input on this side. That recomputation is the assertion of
 * F141-FR-021, "that a hash of the path class is right for its own input": a hash
 * that does not match its own input is a defect of the side, not a difference
 * between the sides, and it is reported before anything is replaced.
 *
 * N-09 replaces nothing: it counts the hashes it was applied to, and the
 * comparator compares them as they are. A hash over fixture content that differs
 * between the sides IS a difference, which is the whole value of the class.
 */
import { createHash } from "node:crypto";

import { collect, numberer, replaceInSurfaces } from "./walk.ts";
import type { MutableCapture, NormalizeContext, Rule } from "./types.ts";

/** The three classes of hash of annex X §X.8. */
export const HASH_CLASSES = ["same", "path", "implementation"] as const;
export type HashClass = (typeof HASH_CLASSES)[number];

/** The form of a hash the two baselines write: sha-256, sixty-four hexadecimal characters. */
export const HASH_PATTERN = /\b[0-9a-f]{64}\b/g;

/**
 * A hash of the PATH class that the reference writes TRUNCATED, so `HASH_PATTERN` cannot
 * see it. The verification planner of the Specstride baseline derives an identifier with
 * `stable_id(prefix, seed)` — a prefix and the first twenty characters of a sha-256 — and
 * with `deterministic_ulid(seed)`, a Crockford base-32 mapping of the same digest. At the
 * pinned commit there are exactly four call sites, three prefixes and one ULID, and EVERY
 * seed holds an absolute path: the working directory and the realpath of the executable
 * for `CMD`, the path of the specification through `bundleId` for `VO` and `verification`.
 *
 * They are therefore hashes of the path class and N-10 is their rule: the value becomes a
 * placeholder and the normalized inputs beside it — the command's `executable`, `cwd` and
 * `args`, which N-01 has already placeheld — are what is compared. The oracle cannot
 * recompute the digest, because the seed is not in the capture; what it asserts instead is
 * that the same value gets the same placeholder, so the identity relation between a
 * command and the obligation that names it is kept and still compared.
 *
 * Without this a capture of ANY scenario that plans verification differs between two runs
 * of one side, because the working directory of a run is fresh: found live on
 * `FX-15/release-verification-passes` (four values, surfaces `tree` and `transcript`).
 */
export const TRUNCATED_PATH_CLASS_HASHES: readonly RegExp[] = [
  /\b(CMD-|VO-|verification-)([0-9a-f]{20})\b/g,
  /("bundleId"\s*:\s*")([0-9A-HJKMNP-TV-Z]{26})(?=")/g,
  /(Source bundle ID: `)([0-9A-HJKMNP-TV-Z]{26})(?=`)/g,
];

/** The hash of some bytes, as both sides compute it. */
export function sha256(bytes: Uint8Array | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/** One hash of a capture, with what the capture says it was taken over. */
export type HashSubject = {
  readonly hash: string;
  /** The class, where the capture says it. */
  readonly hashClass?: HashClass;
  /** The input the hash was taken over, where the capture carries it. */
  readonly input?: string;
  /** Where in the capture it was found. */
  readonly at: string;
};

/**
 * The hashes of a capture, with the class and the input where the capture carries
 * them. A record that carries `hashClass` and `input` beside a hash is a hash of a
 * known class; a bare sixty-four-character value is of the implementation class,
 * because nothing says what it was taken over.
 */
export function hashSubjectsOf(
  surfaces: Readonly<Record<string, unknown>>,
): readonly HashSubject[] {
  const found: HashSubject[] = [];
  for (const [name, value] of Object.entries(surfaces)) {
    // A record that names its own hash class.
    for (const record of collect(value, (node) =>
      node !== null &&
      typeof node === "object" &&
      !Array.isArray(node) &&
      typeof (node as Record<string, unknown>)["hash"] === "string"
        ? (node as Record<string, unknown>)
        : undefined,
    )) {
      const hashClass = record["hashClass"];
      found.push({
        hash: record["hash"] as string,
        ...(typeof hashClass === "string" && (HASH_CLASSES as readonly string[]).includes(hashClass)
          ? { hashClass: hashClass as HashClass }
          : {}),
        ...(typeof record["input"] === "string" ? { input: record["input"] } : {}),
        at: name,
      });
    }
    // Every bare hash in the text of the surface.
    for (const text of collect(value, (node) => (typeof node === "string" ? node : undefined))) {
      for (const match of text.matchAll(new RegExp(HASH_PATTERN.source, "g"))) {
        found.push({ hash: match[0], at: name });
      }
    }
  }
  return Object.freeze(found);
}

/** One hash whose value is not the hash of its own input. */
export type HashMismatch = {
  readonly at: string;
  readonly hash: string;
  readonly recomputed: string;
};

/**
 * Recompute every hash of the PATH class from the side's own input and report the
 * ones that do not match (F141-FR-021: "that a hash of the path class is right for
 * its own input"). Called by `src/compare/assertions.ts` before normalization.
 */
export function pathClassMismatches(
  surfaces: Readonly<Record<string, unknown>>,
): readonly HashMismatch[] {
  const bad: HashMismatch[] = [];
  for (const subject of hashSubjectsOf(surfaces)) {
    if (subject.hashClass !== "path" || subject.input === undefined) continue;
    const recomputed = sha256(subject.input);
    if (recomputed !== subject.hash) {
      bad.push({ at: subject.at, hash: subject.hash, recomputed });
    }
  }
  return Object.freeze(bad);
}

/**
 * The hashes of the IMPLEMENTATION class that are not self-consistent: the same
 * bytes of the implementation hashed twice in one capture must give one value
 * (F141-FR-021, "that a hash of the implementation class is consistent with what
 * it covers").
 */
export function implementationClassInconsistencies(
  surfaces: Readonly<Record<string, unknown>>,
): readonly { readonly covers: string; readonly hashes: readonly string[] }[] {
  const byCover = new Map<string, Set<string>>();
  for (const [, value] of Object.entries(surfaces)) {
    for (const record of collect(value, (node) =>
      node !== null &&
      typeof node === "object" &&
      !Array.isArray(node) &&
      typeof (node as Record<string, unknown>)["hash"] === "string" &&
      (node as Record<string, unknown>)["hashClass"] === "implementation"
        ? (node as Record<string, unknown>)
        : undefined,
    )) {
      const covers = String(record["covers"] ?? "");
      if (covers === "") continue;
      const set = byCover.get(covers) ?? new Set<string>();
      set.add(record["hash"] as string);
      byCover.set(covers, set);
    }
  }
  return Object.freeze(
    [...byCover.entries()]
      .filter(([, hashes]) => hashes.size > 1)
      .map(([covers, hashes]) => ({ covers, hashes: Object.freeze([...hashes]) })),
  );
}

/** N-09: hashes over fixture content are compared as they are, and counted. */
export const N09: Rule = {
  id: "N-09",
  subject: "Hash, same class",
  surfaces: [],
  apply(capture: MutableCapture): number {
    // Replaces nothing by its own text: the count is the number of values the
    // rule was applied to (F141-FR-020).
    return hashSubjectsOf(capture.surfaces).filter(
      (s) => s.hashClass === "same" || s.hashClass === undefined,
    ).length;
  },
};

/** N-10: a hash whose input holds an absolute path. */
export const N10: Rule = {
  id: "N-10",
  subject: "Hash, path class",
  surfaces: [],
  apply(capture: MutableCapture, context: NormalizeContext): number {
    const number = numberer("hash-path");
    let changed = 0;
    for (const [name, value] of Object.entries(capture.surfaces)) {
      // The value of a hash of the path class becomes a placeholder, and the
      // normalized INPUT stays and is compared — which is what N-01 and N-02 have
      // already turned into placeholders by the time this rule runs.
      capture.surfaces[name] = mapHashesOfClass(value, "path", (hash) => {
        changed += 1;
        return number(hash);
      });
    }
    // The truncated forms of the same class: the prefix says what the identifier is and
    // stays, the digest becomes the placeholder.
    changed += replaceInSurfaces(capture.surfaces, [], (text) =>
      TRUNCATED_PATH_CLASS_HASHES.reduce(
        (sofar, pattern) =>
          sofar.replace(
            new RegExp(pattern.source, pattern.flags),
            (_found, prefix: string, digest: string) => `${prefix}${number(digest)}`,
          ),
        text,
      ),
    );
    void context;
    return changed;
  },
};

/** N-11: a hash over bytes of the implementation; the content is not compared. */
export const N11: Rule = {
  id: "N-11",
  subject: "Hash, implementation class",
  surfaces: [],
  apply(capture: MutableCapture): number {
    const number = numberer("hash-impl");
    let changed = 0;
    for (const [name, value] of Object.entries(capture.surfaces)) {
      capture.surfaces[name] = mapHashesOfClass(value, "implementation", (hash) => {
        changed += 1;
        return number(hash);
      });
    }
    // A bare hash that nothing says the class of is of the implementation class:
    // nothing says what it covers, so its content cannot be compared.
    changed += replaceInSurfaces(capture.surfaces, [], (text) =>
      text.replace(new RegExp(HASH_PATTERN.source, "g"), (found) => number(found)),
    );
    return changed;
  },
};

/**
 * Replace the `hash` of every record of one class, and drop the `content` of a
 * record of the implementation class — "the content is not compared".
 */
function mapHashesOfClass(
  value: unknown,
  hashClass: HashClass,
  replace: (hash: string) => string,
): unknown {
  const walk = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(walk);
    if (node !== null && typeof node === "object") {
      const record = node as Record<string, unknown>;
      if (typeof record["hash"] === "string" && record["hashClass"] === hashClass) {
        const next: Record<string, unknown> = { ...record, hash: replace(record["hash"]) };
        if (hashClass === "implementation") {
          delete next["content"];
          next["contentNotCompared"] = true;
        }
        return next;
      }
      const out: Record<string, unknown> = {};
      for (const [key, entry] of Object.entries(record)) out[key] = walk(entry);
      return out;
    }
    return node;
  };
  return walk(value);
}
