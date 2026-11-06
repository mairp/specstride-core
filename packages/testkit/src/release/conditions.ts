/**
 * T225 — the three release conditions of the publishing workflow, as executable
 * code (F100-FR-223, F100-FR-224, F100-FR-236; F100-SC-008, F100-FR-219).
 *
 * Before `.github/workflows/release.yml` publishes anything, three conditions
 * must hold on the same build. The workflow fails, and publishes nothing, unless
 * all three do. The rule of each lives here, once, executable, rather than in a
 * shell line of the workflow that nothing can test:
 *
 *  1. the parity release check of feature 141 (CT-141-126) and T204 of this
 *     feature pass: under the `parity` profile the oracle reports no result
 *     `different` on any fixture family and any surface, the second suite passes
 *     with equal counters, and every parity test of every feature passes, those
 *     of dsh, Codex and prime included. **A skipped parity test counts as a
 *     failure** (F100-FR-223) — which is the clause that keeps a release from
 *     passing on a tree where the oracle is not installed;
 *  2. the canary run of T203 with the **real** redactor of feature 111 passes:
 *     with content capture on, 0 of the canary secrets planted at the seven
 *     places appear in any sink (F100-SC-008, F100-FR-219). The stub redactor of
 *     the test kit does not satisfy the condition;
 *  3. `specs/100-specstride/verified.md` holds an entry of the logged live run
 *     T205 for this build, with every phase gate approved (F100-FR-224). The
 *     workflow **reads** that entry; it never makes the live run, and no job of
 *     it calls a model or a paid service.
 *
 * Every function returns the list of refusals, one per fault, and never throws,
 * so that the workflow reports every reason it will not publish.
 *
 * The rule ships in the staged host surface of `@specstride/testkit` (the split
 * of the monorepo, phase 3): a host holds its own row of the live-run entry
 * against the same functions (`ENTRY_LABELS`, `liveRunRefusals`) that judge the
 * workflow's condition 3, so the rule is one code, here, wherever it is read
 * from. The workflow's script entry stays
 * `tests/release/100/release-conditions.ts`: that file re-exports every name of
 * this module and keeps the one-sub-command-per-condition dispatch the
 * workflow's steps call; every other reader imports this module.
 */
import { readFileSync } from "node:fs";

/** The three conditions, in the order T225 states them. */
export const RELEASE_CONDITIONS = Object.freeze([
  Object.freeze({
    number: 1,
    requirement: "F100-FR-223",
    what: "the parity release check of feature 141 (CT-141-126) and T204 pass; a skipped parity test counts as a failure",
  }),
  Object.freeze({
    number: 2,
    requirement: "F100-SC-008",
    what: "the canary run of T203 with the real redactor of feature 111 passes: 0 of the seven planted secrets in any sink",
  }),
  Object.freeze({
    number: 3,
    requirement: "F100-FR-224",
    what: "verified.md holds the entry of the logged live run T205 for this build, every phase gate approved",
  }),
]);

/** T225 — the workflow reads the entry of the live run and never makes the run. */
export const NEVER_MAKES_THE_LIVE_RUN = true as const;

/** The seven places at which the canary harness plants a secret (annex X §X.9). */
export const CANARY_PLACES = 7 as const;

/** The redactor the release condition needs: the real one, of feature 111. */
export const REAL_REDACTOR_OWNER = "111" as const;

/** The counts a parity run reports. */
export interface ParityCounts {
  /** Fixture families and surfaces the oracle reported as `different`. */
  different: number;
  /** True when the second suite passed with counters equal to the first. */
  secondSuiteCountersEqual: boolean;
  /** Parity tests that failed. */
  failed: number;
  /** Parity tests that were skipped; a skip counts as a failure (F100-FR-223). */
  skipped: number;
  /** Parity tests that passed. */
  passed: number;
}

/** Condition 1 — the refusals of a parity run (F100-FR-223). */
export function parityRefusals(counts: ParityCounts): string[] {
  const refusals: string[] = [];
  if (counts.different !== 0) {
    refusals.push(
      `condition 1: the oracle reported ${counts.different} result(s) \`different\`; under the ` +
        `\`parity\` profile it must report none on any fixture family and any surface (F100-FR-223)`,
    );
  }
  if (!counts.secondSuiteCountersEqual) {
    refusals.push("condition 1: the second suite did not pass with equal counters (F100-FR-223)");
  }
  if (counts.failed !== 0) {
    refusals.push(`condition 1: ${counts.failed} parity test(s) failed (F100-FR-223)`);
  }
  if (counts.skipped !== 0) {
    refusals.push(
      `condition 1: ${counts.skipped} parity test(s) were skipped; a skipped parity test counts ` +
        `as a failure before a release (F100-FR-223)`,
    );
  }
  if (counts.passed <= 0) {
    refusals.push(
      "condition 1: no parity test passed; every parity test of every feature must pass, those of " +
        "dsh, Codex and prime included (F100-FR-223)",
    );
  }
  return refusals;
}

/** What a canary run reports. */
export interface CanaryResult {
  /** True when content capture was on for the run. */
  contentCapture: boolean;
  /** The feature that owns the redactor the run used. */
  redactorOwner: string;
  /** The places at which a canary secret was planted. */
  places: number;
  /** The planted values found in any sink. */
  hits: number;
}

/** Condition 2 — the refusals of a canary run (F100-SC-008, F100-FR-219). */
export function canaryRefusals(result: CanaryResult): string[] {
  const refusals: string[] = [];
  if (!result.contentCapture) {
    refusals.push("condition 2: the canary run must be made with content capture on (F100-FR-219)");
  }
  if (result.redactorOwner !== REAL_REDACTOR_OWNER) {
    refusals.push(
      `condition 2: the canary run used the redactor of feature ${result.redactorOwner}; the ` +
        `release condition is the run with the real redactor of feature ${REAL_REDACTOR_OWNER} ` +
        `(F100-SC-008)`,
    );
  }
  if (result.places !== CANARY_PLACES) {
    refusals.push(
      `condition 2: ${result.places} place(s) were planted; the canary harness plants at ` +
        `${CANARY_PLACES} (annex X §X.9)`,
    );
  }
  if (result.hits !== 0) {
    refusals.push(
      `condition 2: ${result.hits} planted secret(s) appeared in a sink; 0 is the pass ` +
        `(F100-SC-008, F100-FR-219)`,
    );
  }
  return refusals;
}

/** The eight fields of the entry of the live run, as verified.md writes them. */
export const ENTRY_LABELS = Object.freeze([
  "Date",
  "Build",
  "Host",
  "Harness versions",
  "Reference project",
  "Result per phase gate",
  "Time per stage, beside the baseline",
  "Oracle on the same build",
]);

/** The heading of the section of T205 in verified.md. */
export const T205_SECTION = "## T205 —" as const;

/** The heading under which the entry stands once the run has been made. */
export const ENTRY_HEADING = "### The entry, when the run has been made" as const;

/** The cells of the entry of the live run, by label; empty when there is none. */
export function readLiveRunEntry(verifiedText: string): Map<string, string> {
  const out = new Map<string, string>();
  const start = verifiedText.indexOf(T205_SECTION);
  if (start < 0) return out;
  const section = verifiedText.slice(start).split(/\n## /)[0] ?? "";
  const at = section.indexOf(ENTRY_HEADING);
  if (at < 0) return out;
  const after = section.slice(at + ENTRY_HEADING.length);
  for (const line of after.split("\n")) {
    if (!line.startsWith("|")) {
      if (out.size > 0 && line.trim() === "") break;
      continue;
    }
    const cells = line.split("|").map((cell) => cell.trim());
    const [, label, value] = cells;
    if (label === undefined || value === undefined) continue;
    if (label === "Field" || /^-+$/.test(label)) continue;
    out.set(label, value);
  }
  return out;
}

/**
 * Condition 3 — the refusals of the entry of the live run of T205 for this
 * build, with every phase gate approved (F100-FR-224). `build` is the commit the
 * publishing build runs on; the entry must name it.
 */
export function liveRunRefusals(verifiedText: string, build: string): string[] {
  const refusals: string[] = [];
  const entry = readLiveRunEntry(verifiedText);
  if (entry.size === 0) {
    return [
      "condition 3: specs/100-specstride/verified.md holds no entry of the live run T205 " +
        "(F100-FR-224); the workflow reads that entry and never makes the run",
    ];
  }
  for (const label of ENTRY_LABELS) {
    const value = entry.get(label);
    if (value === undefined) {
      refusals.push(`condition 3: the entry of T205 has no field "${label}" (F100-FR-224)`);
      continue;
    }
    if (value === "" || value === "—" || value === "-") {
      refusals.push(`condition 3: the field "${label}" of the entry of T205 is empty`);
    }
  }
  const named = entry.get("Build") ?? "";
  if (build.trim() === "") {
    refusals.push("condition 3: the build to compare the entry against is not named");
  } else if (!named.includes(build)) {
    refusals.push(
      `condition 3: the entry of T205 names the build "${named}", not the build of this release ` +
        `("${build}"): the run must be on the same build (F100-FR-224)`,
    );
  }
  const gates = entry.get("Result per phase gate") ?? "";
  if (gates !== "" && gates !== "—") {
    if (!/approved/i.test(gates)) {
      refusals.push(
        `condition 3: the field "Result per phase gate" does not report approved gates ` +
          `("${gates}") (F100-FR-224, F100-SC-002)`,
      );
    }
    if (/\b(rejected|not approved|failed|blocked)\b/i.test(gates)) {
      refusals.push(
        `condition 3: the field "Result per phase gate" reports a gate that was not approved ` +
          `("${gates}"): every phase gate must be approved (F100-SC-002)`,
      );
    }
  }
  return refusals;
}

/** Condition 3 over the file, for the step of the workflow. */
export function liveRunRefusalsOfFile(file: string, build: string): string[] {
  let text = "";
  try {
    text = readFileSync(file, "utf8");
  } catch (err) {
    return [`condition 3: cannot read ${file}: ${String(err)}`];
  }
  return liveRunRefusals(text, build);
}

/* ------------------------------------------------------------------ *
 * Reading the reports the two first conditions are judged on.
 * ------------------------------------------------------------------ */

/** The counters of a run of `node --test`, as its TAP output reports them. */
export function tapCounters(text: string): { passed: number; failed: number; skipped: number } {
  const count = (label: string): number => {
    let total = 0;
    for (const line of text.split("\n")) {
      const match = line.match(new RegExp(`^#\\s*${label}\\s+(\\d+)\\s*$`));
      if (match?.[1] !== undefined) total += Number.parseInt(match[1], 10);
    }
    return total;
  };
  return { passed: count("pass"), failed: count("fail"), skipped: count("skipped") };
}

/**
 * Condition 1 over the TAP output of the parity run and the report of the
 * parity release check of feature 141 (CT-141-126). The report is a JSON object
 * with `different` and `secondSuiteCountersEqual`; without it the condition is
 * refused, because nothing has said that the oracle reported no result
 * `different` (F100-FR-223).
 */
export function parityRefusalsOfReports(tapText: string, oracleReport: unknown): string[] {
  const counters = tapCounters(tapText);
  if (!(typeof oracleReport === "object" && oracleReport !== null)) {
    return [
      "condition 1: the parity release check of feature 141 (CT-141-126) reported nothing, so no " +
        "result of the oracle and no counter of the second suite is known (F100-FR-223)",
      ...parityRefusals({ ...counters, different: 0, secondSuiteCountersEqual: false }),
    ];
  }
  const report = oracleReport as Record<string, unknown>;
  const different = typeof report["different"] === "number" ? (report["different"] as number) : NaN;
  if (!Number.isFinite(different)) {
    return [
      "condition 1: the report of CT-141-126 names no count of results `different` (F100-FR-223)",
    ];
  }
  return parityRefusals({
    ...counters,
    different,
    secondSuiteCountersEqual: report["secondSuiteCountersEqual"] === true,
  });
}

/**
 * Condition 2 over the TAP output of the canary run and the owner of the
 * redactor the run used. The test kit's own canary run uses the **stub**
 * redactor, which this condition refuses: the release condition is the run with
 * the real redactor of feature 111.
 */
export function canaryRefusalsOfReports(
  tapText: string,
  redactorOwner: string,
  contentCapture: boolean,
): string[] {
  const counters = tapCounters(tapText);
  const refusals = canaryRefusals({
    contentCapture,
    redactorOwner,
    places: CANARY_PLACES,
    hits: 0,
  });
  if (counters.failed !== 0) {
    refusals.push(`condition 2: ${counters.failed} canary test(s) failed (F100-SC-008)`);
  }
  if (counters.skipped !== 0) {
    refusals.push(
      `condition 2: ${counters.skipped} canary test(s) were skipped; the run must be made ` +
        `(F100-SC-008)`,
    );
  }
  if (counters.passed <= 0) {
    refusals.push("condition 2: no canary test passed, so no sink was scanned (F100-SC-008)");
  }
  return refusals;
}
