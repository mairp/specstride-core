/**
 * T084 — the claim check for items and clusters (F141-FR-032).
 *
 * > "A test MUST be allowed to claim a behaviour item only if a fixture it names
 * > executed the evidence line of that item. A claim of a cluster MUST hold when
 * > every item of the cluster that the traceability files assign to the feature
 * > of the test with a kept disposition was executed by a fixture of a test of
 * > that feature that claims the cluster. The claim check MUST fail and name the
 * > test and the item otherwise."
 *
 * A claim is a `proves:` of a declaration of §O.6 and the `fixture:` beside it.
 * `proves:` names an as-is requirement (`028 FR-001`), a cluster (`C-055`) or an
 * item (`B-2784`); only the last two have an evidence line in the reference, so
 * only the last two are checked here. The two rules differ:
 *
 * - **An item.** One of the scenarios the test's `fixture:` names must have
 *   executed `evidence` of that item. The scenario is the unit, not the family:
 *   a `fixture:` that names only the family (`FX-20`) stands for every scenario
 *   of that family, which is what §O.6 says a declaration without a scenario
 *   means.
 * - **A cluster.** Take every item of that cluster that the traceability files
 *   assign, with a kept disposition, to the FEATURE of the test. Each of them
 *   must have been executed by a fixture of SOME test of that feature that
 *   claims the cluster. So the tests of a feature carry a cluster together, and
 *   one test of five scenarios need not reach all of it alone.
 *
 * The check is only as wide as the map. A claim whose scenario the map does not
 * hold is `unmapped`, never a pass and never a failure: the exercise map grows
 * with the fixtures, and F141-FR-034 asks the coverage script for the claims
 * "where an exercise map exists". `failures` is what fails; `unmapped` is what
 * the report says is not yet decided.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Declaration } from "../catalogue/declarations.ts";
import { featureOfName } from "../catalogue/declarations.ts";
import { citationsOf, provesIdsOf } from "../catalogue/declarations.ts";

import { type ExerciseMap, didExecute, familyOfScenario, hasScenario } from "./map.ts";

/** A fault of the claim check. */
export class ClaimError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClaimError";
  }
}

/** One row of the traceability files, as the claim check needs it. */
export type ItemRow = {
  /** `B-0001` … */
  readonly item: string;
  readonly cluster: string;
  /** The destination feature, `103-proposer-pass`. */
  readonly feature: string;
  /** The disposition as written, `ported`, `deferred 2`, … */
  readonly disposition: string;
  /** The evidence line of the behaviour inventory, `proposer.sh:2253`. */
  readonly evidence: string;
};

/** The dispositions F141-FR-032 and F141-FR-033 call kept. */
export const KEPT_DISPOSITIONS = ["ported", "translated", "merged-with"] as const;

/** Whether a disposition is kept. */
export function isKept(disposition: string): boolean {
  const first = disposition.trim().split(" ")[0] ?? "";
  return (KEPT_DISPOSITIONS as readonly string[]).includes(first);
}

/** The number of a feature, `103` of `103-proposer-pass`. */
export function featureNumber(feature: string): string {
  return feature.split("-")[0] ?? feature;
}

/** One claim a test makes: a `proves:` id and the scenarios the test names. */
export type Claim = {
  readonly test: string;
  /** The three-digit number of the feature the test's name carries. */
  readonly feature: string;
  readonly file: string;
  readonly line: number;
  /** The id of `proves:`: an item, a cluster or an as-is requirement. */
  readonly id: string;
  /** What `fixture:` names, as written: families and scenarios. */
  readonly citations: readonly string[];
};

/** What one claim came to. */
export type ClaimVerdict = {
  readonly claim: Claim;
  readonly result: "pass" | "fail" | "unmapped" | "not-an-item";
  /** For an item: the scenario that executed it, where one did. */
  readonly executedBy?: string;
  /** For a cluster: the items of the feature that no fixture of it executed. */
  readonly missing?: readonly string[];
  readonly message: string;
};

/** Read the claims out of the declarations of the sweep. */
export function claimsOf(declarations: readonly Declaration[]): readonly Claim[] {
  const out: Claim[] = [];
  for (const declaration of declarations) {
    if (declaration.proves === undefined) continue;
    const feature = featureOfName(declaration.name);
    if (feature === undefined) continue;
    const citations = declaration.fixture === undefined ? [] : citationsOf(declaration.fixture);
    for (const id of provesIdsOf(declaration.proves)) {
      out.push({
        test: declaration.name,
        feature,
        file: declaration.file,
        line: declaration.line,
        id,
        citations: Object.freeze([...citations]),
      });
    }
  }
  return Object.freeze(out);
}

/**
 * The scenarios of the map that one `fixture:` citation stands for. A citation
 * of a family alone stands for every scenario of that family the map holds; a
 * citation of a scenario stands for that scenario, and for its variants.
 */
export function scenariosOfCitation(map: ExerciseMap, citation: string): readonly string[] {
  const all = Object.keys(map.scenarios);
  if (!citation.includes("/")) return all.filter((s) => familyOfScenario(s) === citation).sort();
  if (hasScenario(map, citation)) return [citation];
  // A scenario of FX-35 and FX-36 runs as `@engine-stub` and as `@full-stack`.
  return all.filter((s) => s === citation || s.startsWith(`${citation}@`)).sort();
}

/** Every scenario a test names, through its `fixture:`. */
export function scenariosOfClaim(map: ExerciseMap, claim: Claim): readonly string[] {
  const out = new Set<string>();
  for (const citation of claim.citations) {
    for (const scenario of scenariosOfCitation(map, citation)) out.add(scenario);
  }
  return [...out].sort();
}

/** The rule for one item (F141-FR-032, first sentence). */
export function checkItemClaim(
  map: ExerciseMap,
  claim: Claim,
  rows: ReadonlyMap<string, ItemRow>,
): ClaimVerdict {
  const row = rows.get(claim.id);
  if (row === undefined) {
    return {
      claim,
      result: "fail",
      message: `${claim.test} claims ${claim.id}, which is no item of the traceability files`,
    };
  }
  const scenarios = scenariosOfClaim(map, claim);
  if (scenarios.length === 0) {
    return {
      claim,
      result: "unmapped",
      message:
        `${claim.test} claims the item ${claim.id} and the exercise map holds no scenario of its ` +
        `\`fixture:\` (${claim.citations.join(", ") || "none"}) yet`,
    };
  }
  for (const scenario of scenarios) {
    if (didExecute(map, scenario, row.evidence)) {
      return {
        claim,
        result: "pass",
        executedBy: scenario,
        message: `${claim.test} may claim ${claim.id}: ${scenario} executed ${row.evidence}`,
      };
    }
  }
  return {
    claim,
    result: "fail",
    message:
      `${claim.test} claims the item ${claim.id}, and no fixture it names executed the evidence ` +
      `line ${row.evidence} of that item (named: ${scenarios.join(", ")}) (F141-FR-032)`,
  };
}

/**
 * The rule for one cluster (F141-FR-032, second sentence). The claim holds when
 * every item of the cluster that the traceability files assign to the feature of
 * the test with a kept disposition was executed by a fixture of a test of that
 * feature that claims the cluster.
 */
export function checkClusterClaim(
  map: ExerciseMap,
  claim: Claim,
  rows: readonly ItemRow[],
  everyClaim: readonly Claim[],
): ClaimVerdict {
  const mine = rows.filter(
    (row) =>
      row.cluster === claim.id &&
      isKept(row.disposition) &&
      featureNumber(row.feature) === claim.feature,
  );
  if (mine.length === 0) {
    return {
      claim,
      result: "fail",
      message:
        `${claim.test} claims the cluster ${claim.id}, which the traceability files assign no ` +
        `kept item of to feature ${claim.feature}`,
    };
  }
  // Every test of the same feature that claims this cluster carries it together.
  const scenarios = new Set<string>();
  for (const other of everyClaim) {
    if (other.id !== claim.id || other.feature !== claim.feature) continue;
    for (const scenario of scenariosOfClaim(map, other)) scenarios.add(scenario);
  }
  if (scenarios.size === 0) {
    return {
      claim,
      result: "unmapped",
      message:
        `${claim.test} claims the cluster ${claim.id} and the exercise map holds no scenario of ` +
        `the \`fixture:\` of any test of feature ${claim.feature} that claims it`,
    };
  }
  const missing = mine
    .filter((row) => ![...scenarios].some((scenario) => didExecute(map, scenario, row.evidence)))
    .map((row) => `${row.item} (${row.evidence})`);
  if (missing.length > 0) {
    return {
      claim,
      result: "fail",
      missing: Object.freeze(missing),
      message:
        `${claim.test} claims the cluster ${claim.id}, and ${missing.length} kept item(s) of ` +
        `feature ${claim.feature} in it were executed by no fixture of a test of that feature ` +
        `that claims the cluster: ${missing.slice(0, 8).join(", ")}` +
        `${missing.length > 8 ? ", …" : ""} (F141-FR-032)`,
    };
  }
  return {
    claim,
    result: "pass",
    message:
      `${claim.test} may claim the cluster ${claim.id}: every one of its ${mine.length} kept ` +
      `item(s) of feature ${claim.feature} was executed`,
  };
}

/** The report of the claim check. */
export type ClaimReport = {
  readonly verdicts: readonly ClaimVerdict[];
  readonly failures: readonly ClaimVerdict[];
  readonly unmapped: readonly ClaimVerdict[];
  readonly passed: readonly ClaimVerdict[];
};

/** Run the claim check over every claim (F141-FR-032). */
export function checkClaims(options: {
  readonly map: ExerciseMap;
  readonly rows: readonly ItemRow[];
  readonly claims: readonly Claim[];
}): ClaimReport {
  const byItem = new Map(options.rows.map((row) => [row.item, row]));
  const clusters = new Set(options.rows.map((row) => row.cluster));
  const verdicts: ClaimVerdict[] = [];
  for (const claim of options.claims) {
    if (byItem.has(claim.id)) {
      verdicts.push(checkItemClaim(options.map, claim, byItem));
    } else if (clusters.has(claim.id)) {
      verdicts.push(checkClusterClaim(options.map, claim, options.rows, options.claims));
    } else {
      // An as-is requirement (`028 FR-001`) has no evidence line of its own:
      // F141-FR-032 is about behaviour items and clusters.
      verdicts.push({
        claim,
        result: "not-an-item",
        message: `${claim.test} claims ${claim.id}, which is no item and no cluster`,
      });
    }
  }
  return Object.freeze({
    verdicts: Object.freeze(verdicts),
    failures: Object.freeze(verdicts.filter((v) => v.result === "fail")),
    unmapped: Object.freeze(verdicts.filter((v) => v.result === "unmapped")),
    passed: Object.freeze(verdicts.filter((v) => v.result === "pass")),
  });
}

/** The lines of the report, for the coverage script and the release check. */
export function claimReportLines(report: ClaimReport): readonly string[] {
  return [
    `claim check: ${report.passed.length} pass, ${report.failures.length} fail, ` +
      `${report.unmapped.length} not yet in the exercise map`,
    ...report.failures.map((v) => `  FAIL ${v.claim.file}:${v.claim.line}: ${v.message}`),
  ];
}

// ---------------------------------------------------------------------------
// The traceability files, read and never written
// ---------------------------------------------------------------------------

/** Where the traceability files and the behaviour inventory stand. */
export const ECOSYSTEM_DIRECTORY = join("docs", "ecosystem") as string;

/** The columns of `traceability-items.tsv`. */
export const ITEM_COLUMNS = [
  "b_id",
  "cluster",
  "system",
  "disposition",
  "feature",
  "proof",
  "dv_or_roadmap",
] as const;

/** The columns of `R18-behaviour-inventory.tsv` the claim check reads. */
export const INVENTORY_COLUMNS = ["b_item", "system", "kind", "item", "evidence"] as const;

/** Read one tab-separated file into rows keyed by its header. */
export function readTsv(text: string): readonly Readonly<Record<string, string>>[] {
  const lines = text.split("\n").filter((line) => line !== "");
  const header = (lines[0] ?? "").split("\t");
  const out: Record<string, string>[] = [];
  for (const line of lines.slice(1)) {
    const fields = line.split("\t");
    const row: Record<string, string> = {};
    for (const [index, name] of header.entries()) row[name] = fields[index] ?? "";
    out.push(row);
  }
  return out;
}

/** What `readTraceability` gives back. */
export type Traceability = {
  readonly rows: readonly ItemRow[];
  /** The `proof` column per item, which names the families (F141-FR-033). */
  readonly proofs: Readonly<Record<string, string>>;
};

/**
 * Read `traceability-items.tsv` and the evidence column of
 * `R18-behaviour-inventory.tsv`, and join them by item. An item of the
 * traceability files that the inventory does not hold is an error: the claim
 * check has no evidence line for it and would silently pass.
 *
 * The supplement of F141-FR-017 is read through `extraEvidence`, so the two rows
 * the oracle proposed are items of the exercise map like any other
 * (`packages/oracle/exercise-map/supplement.tsv`, T080).
 */
export function readTraceability(options: {
  /** The root of the repository. */
  readonly root: string;
  /** Evidence lines to add or to override, by item id. */
  readonly extraEvidence?: Readonly<Record<string, string>>;
}): Traceability {
  const dir = join(options.root, ECOSYSTEM_DIRECTORY);
  const items = readTsv(readFileSync(join(dir, "traceability-items.tsv"), "utf8"));
  const inventory = readTsv(
    readFileSync(join(dir, "research", "R18-behaviour-inventory.tsv"), "utf8"),
  );
  const evidence = new Map<string, string>();
  for (const row of inventory) evidence.set(row["b_item"] ?? "", row["evidence"] ?? "");
  for (const [item, line] of Object.entries(options.extraEvidence ?? {})) evidence.set(item, line);

  const rows: ItemRow[] = [];
  const proofs: Record<string, string> = {};
  const missing: string[] = [];
  for (const row of items) {
    const item = row["b_id"] ?? "";
    const line = evidence.get(item);
    if (line === undefined || line === "") {
      if (isKept(row["disposition"] ?? "")) missing.push(item);
      continue;
    }
    rows.push({
      item,
      cluster: row["cluster"] ?? "",
      feature: row["feature"] ?? "",
      disposition: row["disposition"] ?? "",
      evidence: line,
    });
    proofs[item] = row["proof"] ?? "";
  }
  if (missing.length > 0) {
    throw new ClaimError(
      `${missing.length} kept item(s) of traceability-items.tsv have no evidence line in the ` +
        `behaviour inventory, so no claim of them could be checked: ${missing.slice(0, 10).join(", ")}`,
    );
  }
  return Object.freeze({ rows: Object.freeze(rows), proofs: Object.freeze(proofs) });
}
