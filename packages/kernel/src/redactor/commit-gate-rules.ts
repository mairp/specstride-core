/**
 * Phase 2, T014–T026 — the rule data of the commit gate (F152-FR-016,
 * F152-FR-019, F152-FR-020; data-model.md E7).
 *
 * The rules that decide whether a hit of the pre-commit scan holds the approval
 * commit back are versioned data. The ENGINE rules ship in
 * `data/commit-gate/engine-v1.json`; a PROJECT may add rules of its own, but a
 * project rule may never name a fail-closed match (`unreadable`,
 * `unmatched`), may never exempt, and may never carry an id of the `cg-`
 * namespace: failing closed and carving out are the engine's alone.
 *
 * The decision (`blockingRuleOf`) reads only WHICH rule matched a hit, never
 * the hit's text, and never matches `unmatched` against a hit: the fallback is
 * reached only when NO other rule matched a hit of kind `pattern`, so a pattern
 * the rule data does not name yet holds the commit back.
 */
import { validate } from "@specstride/contracts/records/compile";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalRecordHash } from "../hasher/index.ts";
import { loadWidenedPatternSet } from "./patterns.ts";
import { redactText } from "./rules.ts";
import type { MatchKind } from "./scan.ts";

/** Where a rules document came from. */
export type CommitGateRulesOrigin = "engine" | "project";

/** What one rule matches. One member only, as the schema holds it. */
export type CommitGateRuleMatch =
  | { readonly pattern: string }
  | { readonly registeredSecret: true }
  | { readonly unreadable: true }
  | { readonly unmatched: true };

/** One rule of the commit gate (data-model.md E7). */
export type CommitGateRule = {
  /** The id, `cg-<name>` for the engine, the project's own namespace for it. */
  readonly rule: string;
  /** The feature that owns the rule. */
  readonly owner: string;
  /** The requirement the rule carries out. */
  readonly requirement: string;
  /**
   * WHY the rule decides as it does. Content-bearing by construction: it is
   * refused when the redactor would change it (T018).
   */
  readonly reason: string;
  /** Hold the commit back, or let it through. */
  readonly effect: "block" | "exempt";
  /** What the rule matches. */
  readonly match: CommitGateRuleMatch;
};

/** A whole rules document (data-model.md E7). */
export type CommitGateRules = {
  /** The schema id, `specstride.commit-gate-rules/1`. */
  readonly schema: string;
  /** The version of the document. */
  readonly version: string;
  /** The rules, in the order they are matched. */
  readonly rules: readonly CommitGateRule[];
};

/** The schema id the rules validate against. */
export const COMMIT_GATE_RULES_SCHEMA_ID = "specstride.commit-gate-rules/1" as const;

/** The error a rules document is refused with. `path` names the first fault. */
export class CommitGateRulesError extends Error {
  readonly origin: CommitGateRulesOrigin;
  readonly path: string;

  constructor(origin: CommitGateRulesOrigin, path: string, message: string) {
    super(`the ${origin} commit-gate rules are refused at \`${path}\`: ${message}`);
    this.name = "CommitGateRulesError";
    this.origin = origin;
    this.path = path;
  }
}

/** `/rules/3/match/pattern` of a validator report, as a task names it. */
function dottedPath(instancePath: string): string {
  const parts = instancePath.split("/").filter((part) => part !== "");
  if (parts.length === 0) return "(record)";
  const [first, ...rest] = parts;
  return first + rest.map((part) => (/^\d+$/.test(part) ? `[${part}]` : `.${part}`)).join("");
}

/**
 * Parse and validate a rules document (T015, T018, T020). A document that does
 * not parse, that fails the schema, that carries a reason the redactor would
 * change, or — for the engine's set of value patterns — a pattern no widened
 * entry names, is refused with `CommitGateRulesError` naming the first fault.
 * A PROJECT document may never name `unreadable` or `unmatched` and may never
 * exempt: failing closed is the engine's alone.
 */
export function parseCommitGateRules(text: string, origin: CommitGateRulesOrigin): CommitGateRules {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new CommitGateRulesError(
      origin,
      "json",
      error instanceof Error ? error.message : "the text is no JSON document",
    );
  }

  const result = validate<CommitGateRules>(COMMIT_GATE_RULES_SCHEMA_ID, data);
  if (!result.ok) {
    const first = result.errors[0];
    throw new CommitGateRulesError(
      origin,
      first === undefined ? "(record)" : dottedPath(first.path),
      first?.message ?? "the document fails the schema",
    );
  }
  const rules = result.record;
  if (rules.schema !== COMMIT_GATE_RULES_SCHEMA_ID) {
    throw new CommitGateRulesError(
      origin,
      "schema",
      `the document names "${String(rules.schema)}", not "${COMMIT_GATE_RULES_SCHEMA_ID}"`,
    );
  }

  // T020 — a pattern a rule names must be a value pattern of the widened set.
  const widened = loadWidenedPatternSet();
  const names = new Set((widened.ok ? widened.loaded.values : []).map((entry) => entry.name));

  for (const [index, rule] of rules.rules.entries()) {
    const at = `rules[${String(index)}]`;

    // T018 — a reason the redactor would change is content, and rule data
    // never carries content.
    const reason = redactText(rule.reason);
    if (reason.redacted) {
      throw new CommitGateRulesError(
        origin,
        `${at}.reason`,
        "the reason carries a secret the redactor would replace",
      );
    }

    // T020 — the fail-closed matches and the carve-out are the engine's alone.
    if (origin === "project" && ("unreadable" in rule.match || "unmatched" in rule.match)) {
      throw new CommitGateRulesError(
        origin,
        `${at}.match`,
        "a project rule may not match an unreadable file or an unmatched hit",
      );
    }

    // T137 (F152-FR-018) — a project rule may only ADD a block. An exempt
    // rule of the project would weaken or remove a decision of the engine,
    // and an id of the `cg-` namespace would shadow one of the engine's.
    if (origin === "project" && rule.effect === "exempt") {
      throw new CommitGateRulesError(
        origin,
        `${at}.effect`,
        "a project rule may only add a block; exempting is the engine's alone",
      );
    }
    if (origin === "project" && rule.rule.startsWith("cg-")) {
      throw new CommitGateRulesError(
        origin,
        `${at}.rule`,
        `the id "${rule.rule}" is in the engine's \`cg-\` namespace, which a project rule may not shadow`,
      );
    }

    if ("pattern" in rule.match && !names.has(rule.match.pattern)) {
      throw new CommitGateRulesError(
        origin,
        `${at}.match.pattern`,
        `"${rule.match.pattern}" is no value pattern of the widened set in force`,
      );
    }
  }

  return rules;
}

/**
 * True when the redactor in force would replace any part of the text (a value
 * of a real credential). The one question a caller outside the redactor's own
 * folder may ask of it — F111-FR-023 keeps every other redaction primitive
 * behind the ingress, so the ask travels here rather than the caller naming
 * `redactText` itself.
 */
export function theRedactorWouldReplace(text: string): boolean {
  return redactText(text).redacted;
}

/** The engine rules, read once and frozen (T021). */
let engineRules: CommitGateRules | undefined;

/** The package root: three levels up from `src/redactor/`. */
const PACKAGE_ROOT = resolve3();
function resolve3(): string {
  // `import.meta.url` → …/packages/kernel/src/redactor/commit-gate-rules.ts
  return join(dirname(dirname(dirname(fileURLToPath(import.meta.url)))));
}

/** The engine rule data the ship carries. */
export const ENGINE_COMMIT_GATE_RULES_FILE = join(
  PACKAGE_ROOT,
  "data",
  "commit-gate",
  "engine-v1.json",
);

/**
 * The engine rules of the commit gate, from
 * `packages/kernel/data/commit-gate/engine-v1.json`, parsed once and returned
 * deeply frozen.
 */
export function loadEngineCommitGateRules(
  file: string = ENGINE_COMMIT_GATE_RULES_FILE,
): CommitGateRules {
  if (engineRules === undefined) {
    const parsed = parseCommitGateRules(readFileSync(file, "utf8"), "engine");
    engineRules = Object.freeze({
      ...parsed,
      rules: Object.freeze(parsed.rules.map((rule) => Object.freeze(rule))),
    }) as CommitGateRules;
  }
  return engineRules;
}

/**
 * T139 (F152-FR-016, F152-FR-018) — the project's rules, from
 * `<root>/specstride.commit-gate.json`, or `null` where the project added
 * none. Every refusal names the project file.
 */
export const PROJECT_COMMIT_GATE_RULES_FILE_NAME = "specstride.commit-gate.json" as const;

export function loadProjectCommitGateRules(
  root: string,
  readFile: (path: string) => string | undefined = (path) => {
    try {
      return readFileSync(path, "utf8");
    } catch {
      return undefined;
    }
  },
): CommitGateRules | null {
  const file = join(root, PROJECT_COMMIT_GATE_RULES_FILE_NAME);
  const text = readFile(file);
  if (text === undefined) return null;
  try {
    return parseCommitGateRules(text, "project");
  } catch (error) {
    if (error instanceof CommitGateRulesError) {
      // The refusal names the project FILE, not a path inside the document.
      throw new CommitGateRulesError(
        "project",
        file,
        error.message.split(": ").slice(1).join(": "),
      );
    }
    throw error;
  }
}

/**
 * T138 (F152-FR-018) — the rules in force: the engine's, then the project's.
 * A project file that repeats an id of the engine is refused (it would
 * shadow it); the merged document is frozen.
 */
export function mergeCommitGateRules(
  engine: CommitGateRules,
  project: CommitGateRules | null,
): CommitGateRules {
  if (project !== null) {
    const engineIds = new Set(engine.rules.map((rule) => rule.rule));
    for (const rule of project.rules) {
      if (engineIds.has(rule.rule)) {
        throw new CommitGateRulesError(
          "project",
          PROJECT_COMMIT_GATE_RULES_FILE_NAME,
          `the id "${rule.rule}" repeats an id of the engine's rules, which a project rule may not shadow`,
        );
      }
    }
  }
  return Object.freeze({
    schema: engine.schema,
    version: engine.version,
    rules: Object.freeze([...engine.rules, ...(project === null ? [] : project.rules)]),
  }) as CommitGateRules;
}

/**
 * T022 — the canonical hash of the rule data in force: the engine's document
 * and, where the project added one, the project's, in one record.
 */
export function hashOfCommitGateRules(
  engine: CommitGateRules,
  project: CommitGateRules | null,
): string {
  return canonicalRecordHash({ engine, project });
}

/** What `blockingRuleOf` reads off a hit: the kind, and the pattern where one matched. */
export type CommitGateHit = {
  readonly matched: MatchKind;
  readonly pattern?: string;
};

/** The id of the rule that matches a hit no rule names (T024, fail closed). */
export const UNMATCHED_HIT_RULE = "cg-unmatched-hit" as const;

/**
 * T024 — the rule that holds the commit back, or `null` where an exempt rule
 * of the engine matched first. A rule matches by the hit's KIND only — a
 * pattern rule by the pattern's NAME, never by the text — and `unmatched` is
 * never matched against a hit: it is reached only as the fallback for a hit of
 * kind `pattern` that no other rule matched, so the commit fails closed when
 * the rule data does not name a pattern yet.
 */
export function blockingRuleOf(hit: CommitGateHit, rules: CommitGateRules): string | null {
  const matches = (rule: CommitGateRule): boolean => {
    const match = rule.match;
    return hit.matched === "pattern"
      ? "pattern" in match && match.pattern === hit.pattern
      : hit.matched === "registered-secret"
        ? "registeredSecret" in match
        : hit.matched === "unreadable"
          ? "unreadable" in match
          : false;
  };
  // The carve-out outranks the block rule of the same pattern (data-model.md
  // E7): where an exempt rule matches, no rule holds the commit back.
  if (rules.rules.some((rule) => rule.effect === "exempt" && matches(rule))) return null;
  const blocking = rules.rules.find((rule) => rule.effect === "block" && matches(rule));
  if (blocking !== undefined) return blocking.rule;
  return hit.matched === "pattern" ? UNMATCHED_HIT_RULE : null;
}
