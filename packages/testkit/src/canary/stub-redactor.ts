/**
 * T284 — the stub redactor of the test kit and the interface type of the
 * pre-commit scan (annex X, §X.4; F100-FR-205, F100-FR-206).
 *
 * The stub redactor is deliberately the WEAKEST redactor the interface of T200
 * allows: it replaces the EXACT values that were registered, everywhere they
 * occur, and NOTHING else. It holds no pattern of its own, so a canary run
 * against it proves that the runtime registers what it resolves and routes
 * every sink through the one point of redaction — not that the pattern set of
 * feature 111 is wide enough. Feature 111 runs the same harness against the
 * real redactor; that run is the release condition (F100-SC-008).
 */
import type {
  PreCommitHit,
  PreCommitScan,
  PreCommitScanResult,
  RedactResult,
  Redactor,
} from "@specstride/contracts/ep/redactor";
import {
  PRE_COMMIT_EVENT_TYPE,
  SUBJECT as PATTERN_SET_SUBJECT,
} from "@specstride/contracts/ep/redactor";

/** The section of annex X the stub answers to. */
export const ANNEX_SECTION = "annex X, §X.4" as const;

/** The version the stub reports as the version of its pattern set. */
export const STUB_PATTERN_SET_VERSION = "stub-0" as const;

/** The text the stub puts in place of a registered secret. */
export const REPLACEMENT = "[redacted]" as const;

/** The stub holds no pattern of its own: exact values only (T284). */
export const PATTERNS: readonly string[] = Object.freeze([]);

/** A stub redactor, with the registry it keeps. */
export type StubRedactor = Redactor & {
  /** The values registered so far, in the order they were registered. */
  registered(): readonly string[];
  /** Forget every registered value; the fixture of a test starts clean. */
  reset(): void;
  /** How many replacements the stub made since it was built. */
  replacements(): number;
  /** Make the next call of `redact` fail, so that failing closed is testable. */
  breakTheRedactor(reason: string): void;
};

/**
 * Build a stub redactor (T284). `register` takes the exact value the runtime
 * resolved; `redact` replaces every occurrence of every registered value and
 * cuts the text to the size cap.
 */
export function createStubRedactor(): StubRedactor {
  const secrets: string[] = [];
  let made = 0;
  let broken: string | undefined;

  const redact = (text: string, sizeCap: number): RedactResult => {
    if (broken !== undefined) {
      // F100-FR-205 — the redactor fails closed: the content is dropped and
      // the record says so.
      const reason = broken;
      return Object.freeze({
        text: "",
        replacements: 0,
        patternSetVersion: STUB_PATTERN_SET_VERSION,
        dropped: true as const,
        reason,
      });
    }
    let out = text;
    let replacements = 0;
    // The longest value first, so that a value that holds another is replaced
    // as a whole.
    for (const secret of [...secrets].sort((a, b) => b.length - a.length)) {
      if (secret === "") continue;
      let at = out.indexOf(secret);
      while (at >= 0) {
        out = `${out.slice(0, at)}${REPLACEMENT}${out.slice(at + secret.length)}`;
        replacements += 1;
        at = out.indexOf(secret, at + REPLACEMENT.length);
      }
    }
    made += replacements;
    return Object.freeze({
      text: sizeCap >= 0 && out.length > sizeCap ? out.slice(0, sizeCap) : out,
      replacements,
      patternSetVersion: STUB_PATTERN_SET_VERSION,
    });
  };

  return Object.freeze({
    register(secret: string): void {
      if (secret !== "" && !secrets.includes(secret)) secrets.push(secret);
    },
    redact,
    registered(): readonly string[] {
      return Object.freeze([...secrets]);
    },
    reset(): void {
      secrets.length = 0;
      made = 0;
      broken = undefined;
    },
    replacements(): number {
      return made;
    },
    breakTheRedactor(reason: string): void {
      broken = reason;
    },
  });
}

/** The subject the refusal of the pattern set names (T200). */
export { PATTERN_SET_SUBJECT };

/* ------------------------------------------------------------------ *
 * F100-FR-206 — the stub of the pre-commit scan.
 * ------------------------------------------------------------------ */

/** One file of a commit, as the scan is handed it: the path and its text. */
export type CommitFile = { readonly path: string; readonly text: string };

/**
 * Build a stub of the pre-commit scan against the interface of T200: the files
 * the RUNTIME wrote are searched for registered secrets and for the patterns;
 * a hit blocks the commit and raises an event (F100-FR-206).
 *
 * The caller hands the files as text, so the stub opens nothing.
 */
export function createStubPreCommitScan(input: {
  readonly redactor: StubRedactor;
  readonly files: readonly CommitFile[];
  readonly patterns?: readonly { readonly name: string; readonly pattern: RegExp }[] | undefined;
}): PreCommitScan {
  const patterns = input.patterns ?? [];
  const byPath = new Map(input.files.map((f) => [f.path, f.text]));

  return Object.freeze({
    scan(files: readonly string[]): PreCommitScanResult {
      const hits: PreCommitHit[] = [];
      for (const path of files) {
        const text = byPath.get(path);
        if (text === undefined) continue;
        const lines = text.split("\n");
        for (const [index, line] of lines.entries()) {
          for (const secret of input.redactor.registered()) {
            if (secret !== "" && line.includes(secret)) {
              hits.push(
                Object.freeze({
                  file: path,
                  line: index + 1,
                  matched: "registered-secret" as const,
                }),
              );
            }
          }
          for (const rule of patterns) {
            if (rule.pattern.test(line)) {
              hits.push(
                Object.freeze({
                  file: path,
                  line: index + 1,
                  matched: "pattern" as const,
                  pattern: rule.name,
                }),
              );
            }
          }
        }
      }
      const blocked = hits.length > 0;
      return Object.freeze({
        hits: Object.freeze(hits),
        blocked,
        ...(blocked
          ? {
              event: Object.freeze({
                type: PRE_COMMIT_EVENT_TYPE,
                fileCount: new Set(hits.map((h) => h.file)).size,
              }),
            }
          : {}),
      });
    },
  });
}

export type { PreCommitScan, PreCommitScanResult, PreCommitHit, RedactResult, Redactor };
