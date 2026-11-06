/**
 * T004 [US6] — characterization test CT-122-40 for the results of the detach
 * spike (F122-FR-040; quickstart scenario 1).
 *
 * What it holds:
 *
 *   1. every case of `specs/122-detached-runtime/contracts/spike-cases.json`
 *      has a result file, and the cases are the cross product of the four
 *      dimensions of the contract, which the contract says is sixteen;
 *   2. every result validates against the result form of the contract: the
 *      declared fields, a `result` from the closed set
 *      `survived | ended | skipped`, and the four named observations, each
 *      `true`, `false` or `null`;
 *   3. a skip has a reason, and so does an `ended` — the contract asks for a
 *      reason with both;
 *   4. no result without a host version and a date. A case that cannot run is
 *      a skip and never a pass (F122-FR-040).
 *
 * The test does not wait for T002 or T003. Those cases are paid, an unattended
 * run never starts them, and the driver of T001 writes them out as `skipped`
 * with the reason "not run"; this test passes on exactly that. It is therefore
 * a test of the recording, not of the outcome — which is what F122-FR-041
 * asks for when it says no requirement of the product depends on the outcome
 * of the spike.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..", "..", "..", "..");
const CONTRACT = join(REPO, "specs", "122-detached-runtime", "contracts", "spike-cases.json");
const RESULTS = join(REPO, "spikes", "122-detach", "results");

type Contract = {
  requirement: string;
  dimensions: Record<string, string[]>;
  cases?: number;
  observations: string[];
  result: { fields: Record<string, string> };
};

type Observations = Record<string, boolean | null>;

type Result = {
  caseId: string;
  result: string;
  reason?: string;
  observations: Observations;
  host: { id: string; version: string };
  os: { name: string; version: string };
  verifiedOn: string;
  strategy: string;
};

const RESULT_VALUES = ["survived", "ended", "skipped"] as const;

const readContract = (): Contract => JSON.parse(readFileSync(CONTRACT, "utf8")) as Contract;

/**
 * The cases of the contract: the cross product of its dimensions, joined in
 * the order the dimensions are declared, which is the order of the `caseId`
 * the contract gives as its example (`linux-interactive-off-exit`).
 */
const enumerateCases = (contract: Contract): string[] => {
  const names = Object.keys(contract.dimensions);
  let rows: string[][] = [[]];
  for (const name of names) {
    const next: string[][] = [];
    for (const row of rows)
      for (const value of contract.dimensions[name]!) next.push([...row, value]);
    rows = next;
  }
  return rows.map((row) => row.join("-"));
};

const nonEmpty = (value: unknown): boolean => typeof value === "string" && value.trim() !== "";

test("CT-122-40: the cases of the contract are the sixteen of its dimensions", () => {
  const contract = readContract();
  const cases = enumerateCases(contract);
  assert.equal(contract.requirement, "F122-FR-040");
  assert.equal(cases.length, 16, `the dimensions give ${cases.length} cases`);
  if (contract.cases !== undefined) {
    assert.equal(cases.length, contract.cases, "the dimensions and the declared count disagree");
  }
  assert.equal(new Set(cases).size, cases.length, "two cases share a caseId");
  assert.ok(
    cases.includes("linux-interactive-off-exit"),
    "the example caseId of the contract is not among the cases",
  );
});

test("CT-122-40: every case of the contract has a result file", () => {
  const contract = readContract();
  const missing = enumerateCases(contract).filter(
    (caseId) => !existsSync(join(RESULTS, `${caseId}.json`)),
  );
  assert.deepEqual(missing, [], `cases without a result file: ${missing.join(", ")}`);
});

test("CT-122-40: every result validates against the result form of the contract", () => {
  const contract = readContract();
  const fields = Object.keys(contract.result.fields);
  for (const caseId of enumerateCases(contract)) {
    const path = join(RESULTS, `${caseId}.json`);
    const result = JSON.parse(readFileSync(path, "utf8")) as Result;
    const where = `${caseId}.json`;

    // The declared fields are present, bar `reason`, which the contract makes
    // conditional on the outcome and which the next test checks.
    for (const field of fields) {
      if (field === "reason") continue;
      assert.ok(field in result, `${where}: the contract field ${field} is missing`);
    }

    assert.equal(result.caseId, caseId, `${where}: caseId does not match its file name`);
    assert.ok(
      (RESULT_VALUES as readonly string[]).includes(result.result),
      `${where}: result=${result.result} is outside the closed set ${RESULT_VALUES.join(" | ")}`,
    );
    assert.ok(nonEmpty(result.strategy), `${where}: strategy is empty`);

    // The four observations the contract names, each true, false or null.
    assert.deepEqual(
      Object.keys(result.observations).sort(),
      [...contract.observations].sort(),
      `${where}: the observations are not the four the contract names`,
    );
    for (const [name, value] of Object.entries(result.observations)) {
      assert.ok(
        value === true || value === false || value === null,
        `${where}: observation ${name} is ${JSON.stringify(value)}, not true, false or null`,
      );
    }
  }
});

test("CT-122-40: a skip has a reason, and so does an `ended`", () => {
  const contract = readContract();
  for (const caseId of enumerateCases(contract)) {
    const result = JSON.parse(readFileSync(join(RESULTS, `${caseId}.json`), "utf8")) as Result;
    if (result.result === "skipped" || result.result === "ended") {
      assert.ok(
        nonEmpty(result.reason),
        `${caseId}.json: result=${result.result} without a reason; the contract requires one`,
      );
    }
    // A case that cannot run is a skip and never a pass (F122-FR-040): a skip
    // claims no observation of its own.
    if (result.result === "skipped") {
      assert.ok(
        Object.values(result.observations).every((value) => value === null),
        `${caseId}.json: a skip claims an observation`,
      );
    }
  }
});

test("CT-122-40: no result without a host version and a date", () => {
  const contract = readContract();
  for (const caseId of enumerateCases(contract)) {
    const where = `${caseId}.json`;
    const result = JSON.parse(readFileSync(join(RESULTS, where), "utf8")) as Result;
    assert.ok(nonEmpty(result.host?.id), `${where}: no host id`);
    assert.ok(nonEmpty(result.host?.version), `${where}: no host version`);
    assert.ok(nonEmpty(result.os?.name), `${where}: no os name`);
    assert.ok(nonEmpty(result.os?.version), `${where}: no os version`);
    assert.ok(nonEmpty(result.verifiedOn), `${where}: no date`);
    assert.match(
      result.verifiedOn,
      /^\d{4}-\d{2}-\d{2}$/,
      `${where}: verifiedOn=${result.verifiedOn} is not a date`,
    );
  }
});

test("CT-122-40: the results directory holds no result for a case the contract does not have", () => {
  const contract = readContract();
  const known = new Set(enumerateCases(contract));
  const strays = readdirSync(RESULTS)
    .filter((name) => name.endsWith(".json") && name !== "SELF-CHECK.json")
    .map((name) => name.slice(0, -".json".length))
    .filter((caseId) => !known.has(caseId));
  assert.deepEqual(
    strays,
    [],
    `results for cases the contract does not have: ${strays.join(", ")}`,
  );
});

/* ------------------------------------------------------------------------ *
 * T005 [US6] — the facts of the spike (F122-FR-041).
 *
 * `packages/runtime/src/doctor/spike-facts.json` is what binds the product to
 * the spike: it is read by the doctor, and by the launch when it has to name a
 * strategy in a refusal. These tests hold it against the results it claims to
 * be generated from, so that the facts cannot drift away from them — in
 * particular so that no fact can claim to be verified while its cases are
 * skips.
 * ------------------------------------------------------------------------ */

const FACTS = join(REPO, "packages", "runtime", "src", "doctor", "spike-facts.json");

type Fact = {
  id: string;
  statement: string;
  status: string;
  "verified-on": string | null;
  pin: Record<string, unknown>;
  reason?: string;
  cases?: { survived: number; ended: number; skipped: number };
};

type Facts = {
  requirement: string;
  facts: Fact[];
  doctor: { sessionEndSurvival: string; launchRefusalNamesStrategy: string; survives: string[] };
  orchestratorReport: { endedCases: string[] };
};

const readFacts = (): Facts => JSON.parse(readFileSync(FACTS, "utf8")) as Facts;

const tally = (contract: Contract): Record<string, number> => {
  const counts: Record<string, number> = { survived: 0, ended: 0, skipped: 0 };
  for (const caseId of enumerateCases(contract)) {
    const result = JSON.parse(readFileSync(join(RESULTS, `${caseId}.json`), "utf8")) as Result;
    counts[result.result] = (counts[result.result] ?? 0) + 1;
  }
  return counts;
};

test("CT-122-40: every fact of the spike carries a verified-on and a version pin", () => {
  const facts = readFacts();
  assert.equal(facts.requirement, "F122-FR-040");
  assert.ok(facts.facts.length > 0, "spike-facts.json states no fact");
  for (const fact of facts.facts) {
    const where = `spike-facts.json ${fact.id}`;
    assert.ok(nonEmpty(fact.statement), `${where}: no statement`);
    assert.ok(
      ["verified-local", "verified-ci", "unverified"].includes(fact.status),
      `${where}: status=${fact.status}`,
    );
    assert.ok("verified-on" in fact, `${where}: no verified-on field`);
    assert.ok(
      fact.pin !== undefined && Object.keys(fact.pin).length > 0,
      `${where}: no version pin`,
    );

    if (fact.status === "unverified") {
      // An unverified fact names no date and must say why.
      assert.equal(fact["verified-on"], null, `${where}: unverified but carries a date`);
      assert.ok(nonEmpty(fact.reason), `${where}: unverified without a reason`);
    } else {
      assert.match(
        String(fact["verified-on"]),
        /^\d{4}-\d{2}-\d{2}$/,
        `${where}: verified without a date`,
      );
    }
  }
});

test("CT-122-40: no fact claims to be verified while its cases are skips", () => {
  const contract = readContract();
  const counts = tally(contract);
  for (const fact of readFacts().facts) {
    if (fact.cases === undefined) continue;
    assert.deepEqual(
      fact.cases,
      { survived: counts.survived, ended: counts.ended, skipped: counts.skipped },
      `spike-facts.json ${fact.id}: its case tally disagrees with the results`,
    );
    if (fact.cases.survived === 0) {
      assert.equal(
        fact.status,
        "unverified",
        `spike-facts.json ${fact.id}: status=${fact.status} with no case that survived`,
      );
    }
  }
});

test("CT-122-40: with a skip among the cases the doctor says unverified and the refusal names foreground", () => {
  const contract = readContract();
  const counts = tally(contract);
  const facts = readFacts();
  if (counts.skipped > 0 || counts.ended > 0) {
    // F122-FR-041: where a case is a skip, or the default strategy did not
    // survive, the doctor says survival of the end of a session is unverified
    // and a refused launch names `foreground`.
    assert.equal(
      facts.doctor.sessionEndSurvival,
      "unverified",
      "the doctor does not say unverified",
    );
    assert.equal(
      facts.doctor.launchRefusalNamesStrategy,
      "foreground",
      "the refusal does not name foreground",
    );
  }
  // No Wave 1 strategy claims `reboot` (F122-FR-003).
  assert.ok(
    !facts.doctor.survives.includes("reboot"),
    "a fact claims the strategy survives a reboot",
  );
});

test("CT-122-40: the report to the orchestrator names every case that ended", () => {
  const contract = readContract();
  const ended = enumerateCases(contract).filter((caseId) => {
    const result = JSON.parse(readFileSync(join(RESULTS, `${caseId}.json`), "utf8")) as Result;
    return result.result === "ended";
  });
  assert.deepEqual(
    [...readFacts().orchestratorReport.endedCases].sort(),
    ended.sort(),
    "spike-facts.json does not report exactly the cases that ended; spec.md must be confirmed or amended on those",
  );
});
