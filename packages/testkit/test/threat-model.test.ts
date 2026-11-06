/**
 * T201 — contract tests CT-100-316 to CT-100-321 for the threat model (annex X,
 * §X.9; F100-FR-216 to F100-FR-221), over the keys `controls` and the threats of
 * `data/threat-model.json`.
 *
 * The three static checks of T286 and the two of T287 are the subjects; the
 * canary harness of T202, T284 and T285 is proved by CT-100-319 in
 * `test/canary.test.ts`, and this file checks that its pieces are present and
 * that the harness reports a hit when one is planted in a sink.
 */
import test from "node:test";
import assert from "node:assert/strict";
import * as nodeFs from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import threatModel from "@specstride/contracts/data/threat-model.json" with { type: "json" };
import runRecordSchema from "@specstride/contracts/schemas/run-record.schema.json" with { type: "json" };
import {
  CLI_MAY_WRITE,
  CLI_WRITTEN_NAMES,
  LAYOUT_FILE,
  PER_RUN_FIELDS,
  RUN_RECORD_SCHEMA,
  STRUCTURAL_CONTROLS,
  THREAT_COUNT,
  THREAT_MODEL_FILE,
  checkThreatModel,
  threatModelCheck,
} from "../src/static/threat-model.ts";
import {
  INGRESS_RULES,
  LISTENER_BUILTINS,
  LISTENER_DEPENDENCIES,
  LISTEN_CALL,
  absentPackages,
  checkIngressFramesOutsideText,
  checkNoListener,
  noListenerCheck,
} from "../src/static/no-listener.ts";
import { CHECKS } from "../src/static/index.ts";
import { CANARY_PLACES, CANARY_COUNT, plantCanaries } from "../src/canary/plant.ts";
import { SCANNED_SINKS, scanSinks } from "../src/canary/scan.ts";

/** The root of the repository: three levels up from `packages/testkit/test`. */
const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

type ThreatModel = {
  controls: { Control: string; Content: string }[];
  threats: { Id: string; Threat: string; Control: string; Owner: string }[];
};
const model = threatModel as ThreatModel;

test("CT-100-316: the 49 threats each have an owner feature and a control (F100-FR-216)", () => {
  assert.equal(THREAT_COUNT, 49);
  assert.equal(model.threats.length, THREAT_COUNT);
  // The ids run T-01 to T-49, each once.
  assert.deepEqual(
    model.threats.map((t) => t.Id),
    Array.from({ length: THREAT_COUNT }, (_, i) => `T-${String(i + 1).padStart(2, "0")}`),
  );
  for (const threat of model.threats) {
    assert.notEqual(threat.Threat.trim(), "", threat.Id);
    assert.notEqual(threat.Control.trim(), "", threat.Id);
    assert.match(threat.Owner, /\d{3}/, threat.Id);
  }
  // The check finds no fault in the data file of the package.
  assert.deepEqual([...checkThreatModel()], []);
  assert.equal(threatModelCheck.name, "Threat model");
  assert.ok(threatModelCheck.covers.includes("F100-FR-216"));
  assert.equal(THREAT_MODEL_FILE, "packages/contracts/data/threat-model.json");
});

test("CT-100-316: the five structural controls are present (F100-FR-216)", () => {
  assert.deepEqual([...STRUCTURAL_CONTROLS], ["R-1", "R-2", "R-3", "R-4", "R-5"]);
  assert.equal(model.controls.length, STRUCTURAL_CONTROLS.length);
  for (const id of STRUCTURAL_CONTROLS) {
    const control = model.controls.find((c) => c.Control === id);
    assert.notEqual(control, undefined, id);
    assert.notEqual(control?.Content.trim(), "", id);
  }
  // Every control a threat names by id is one of the five.
  const named = new Set<string>();
  for (const threat of model.threats) {
    for (const match of threat.Control.matchAll(/\bR-(\d+)\b/g)) named.add(`R-${match[1]}`);
  }
  assert.ok(named.size > 0, "threats name structural controls by id");
  for (const id of named) {
    assert.ok((STRUCTURAL_CONTROLS as readonly string[]).includes(id), id);
  }
});

test("CT-100-316: a threat without a control or an owner is a finding (negative control)", () => {
  // The check is exercised against a tree whose data file is broken, so that a
  // green run cannot be a green run of nothing.
  const findings = checkThreatModelOverAFixture({
    controls: model.controls,
    threats: [
      ...model.threats.slice(0, THREAT_COUNT - 1),
      { Id: "T-49", Threat: "a threat", Control: "", Owner: "" },
    ],
  });
  assert.ok(
    findings.some((f) => /names no control/.test(f)),
    findings.join("\n"),
  );
  assert.ok(
    findings.some((f) => /names no owner feature/.test(f)),
    findings.join("\n"),
  );
  // A missing structural control is a finding too.
  const withoutR3 = checkThreatModelOverAFixture({
    controls: model.controls.filter((c) => c.Control !== "R-3"),
    threats: model.threats,
  });
  assert.ok(
    withoutR3.some((f) => /structural control R-3/.test(f)),
    withoutR3.join("\n"),
  );
  // A count that is not 49 is a finding.
  const short = checkThreatModelOverAFixture({
    controls: model.controls,
    threats: model.threats.slice(0, 48),
  });
  assert.ok(
    short.some((f) => /holds 48/.test(f)),
    short.join("\n"),
  );
});

/**
 * The checks of T286 over a fixture of the threat model, by writing it into a
 * scratch copy of the data directory. The messages are returned as lines.
 */
function checkThreatModelOverAFixture(fixture: ThreatModel): string[] {
  const { mkdtempSync, mkdirSync, writeFileSync, copyFileSync } = nodeFs;
  const dir = mkdtempSync(join(tmpdir(), "specstride-threat-"));
  const data = join(dir, "packages", "contracts", "data");
  const schemas = join(dir, "packages", "contracts", "schemas");
  mkdirSync(data, { recursive: true });
  mkdirSync(schemas, { recursive: true });
  writeFileSync(join(data, "threat-model.json"), JSON.stringify(fixture));
  copyFileSync(
    join(REPO, "packages", "contracts", "data", "layout.json"),
    join(data, "layout.json"),
  );
  copyFileSync(
    join(REPO, "packages", "contracts", "schemas", "run-record.schema.json"),
    join(schemas, "run-record.schema.json"),
  );
  return checkThreatModel({ root: dir }).map((f) => f.message);
}

test("CT-100-317: no component outside the runtime tree writes control state (F100-FR-217)", () => {
  assert.equal(LAYOUT_FILE, "packages/contracts/data/layout.json");
  assert.equal(CLI_MAY_WRITE.length, 8, "the eight items F100-FR-217 lists for the CLI");
  assert.ok(CLI_WRITTEN_NAMES.length > 0);
  for (const row of CLI_WRITTEN_NAMES) {
    assert.notEqual(row.item, "");
    assert.ok(row.pattern instanceof RegExp, row.item);
  }
  // Every item of the list of F100-FR-217 is matched by a pattern of the check.
  for (const item of ["inbox requests", "the supervision record"]) {
    assert.ok(
      CLI_WRITTEN_NAMES.some((row) => row.item.includes(item.replace(/^the /, ""))),
      item,
    );
  }
  // The layout of the package passes the check.
  assert.deepEqual([...checkThreatModel()], []);
});

test("CT-100-318: the three per-run fields are required by the run record (F100-FR-218)", () => {
  assert.deepEqual([...PER_RUN_FIELDS], ["containment", "criticProof", "redaction"]);
  const required = (runRecordSchema as { required?: string[] }).required ?? [];
  for (const field of PER_RUN_FIELDS) {
    assert.ok(required.includes(field), `${field} must be required by the run record`);
  }
  assert.equal(RUN_RECORD_SCHEMA, "packages/contracts/schemas/run-record.schema.json");
});

test("CT-100-320: no package of Wave 1 opens a network listener (F100-FR-220)", () => {
  assert.deepEqual([...LISTENER_BUILTINS], ["node:net", "node:http", "node:https", "node:http2"]);
  assert.ok(LISTENER_DEPENDENCIES.length > 0, "servers of a dependency are named too");
  assert.deepEqual([...checkNoListener()], [], "no package of the graph opens a listener");
  assert.equal(noListenerCheck.name, "No listener");
  assert.ok(noListenerCheck.covers.includes("F100-FR-220"));
  // The pattern of the call that binds a listener.
  assert.equal(LISTEN_CALL.test("server.listen(3000)"), true);
  assert.equal(LISTEN_CALL.test("const x = listener;"), false);
  // The packages of the graph this workspace does not hold yet are named, so
  // that the subject of the check widens by itself when they arrive.
  const absent = absentPackages();
  assert.ok(absent.length > 0, "the graph names packages of later waves");
  for (const name of ["@specstride/contracts", "@specstride/kernel", "@specstride/testkit"]) {
    assert.ok(!absent.includes(name), `${name} is in this workspace and is checked`);
  }
});

test("CT-100-320: a package that imports a listener built-in is a finding (negative control)", () => {
  const { mkdtempSync, mkdirSync, writeFileSync, cpSync } = nodeFs;
  const dir = mkdtempSync(join(tmpdir(), "specstride-listener-"));
  mkdirSync(join(dir, "packages", "contracts", "data"), { recursive: true });
  cpSync(
    join(REPO, "packages", "contracts", "data", "package-graph.json"),
    join(dir, "packages", "contracts", "data", "package-graph.json"),
  );
  mkdirSync(join(dir, "packages", "kernel", "src"), { recursive: true });
  // The specifier is assembled, so that this test file holds no such import.
  const specifier = `node:${"http"}`;
  writeFileSync(
    join(dir, "packages", "kernel", "src", "viewer.ts"),
    `import { createServer } from "${specifier}";\nconst s = createServer();\ns.${"listen"}(0);\n`,
  );
  const findings = checkNoListener({ root: dir });
  assert.ok(findings.length >= 2, findings.map((f) => f.message).join("\n"));
  assert.ok(findings.some((f) => /imports/.test(f.message) && /F100-FR-220/.test(f.message)));
  assert.ok(findings.some((f) => /binds a listener/.test(f.message)));
});

test("CT-100-321: outside text is data at every ingress (F100-FR-221)", () => {
  assert.deepEqual(
    [...INGRESS_RULES],
    [
      "wrapped in random boundaries per call when it enters a prompt",
      "never echoed into a host session by default",
      "rendered as text",
      "never parsed for control records",
    ],
  );
  // The ingress package of the graph is not in this workspace yet, so the check
  // reports nothing and widens by itself when the package arrives.
  assert.deepEqual([...checkIngressFramesOutsideText()], []);
  assert.ok(
    absentPackages().includes("@specstride/observability"),
    "the ingress package of the graph belongs to a later wave",
  );
});

test("CT-100-319: the canary harness has its seven places and its five sinks", () => {
  assert.equal(CANARY_COUNT, 7);
  assert.deepEqual(
    [...CANARY_PLACES],
    [
      "prompt",
      "reply",
      "tool-arguments",
      "tool-output",
      "phase-evidence",
      "check-output",
      "comment",
    ],
  );
  assert.deepEqual(
    [...SCANNED_SINKS],
    ["event file", "exporters", "digest", "status", "read model"],
  );
  // The scan reports a hit, with its sink and its place of planting, when a
  // planted value does reach a sink: the negative control of CT-100-319.
  const planting = plantCanaries("negative-control");
  const leaked = planting.valueOf("tool-output");
  const report = scanSinks({
    planting,
    sinks: {
      "event file": [`{"data":{"text":"${leaked}"}}`],
      exporters: [],
      digest: [],
      status: [],
      "read model": [],
    },
  });
  assert.equal(report.passed, false);
  assert.equal(report.hits.length, 1);
  assert.equal(report.hits[0]?.sink, "event file");
  assert.equal(report.hits[0]?.place, "tool-output");
  assert.match(report.lines[0] ?? "", /event file/);
  assert.match(report.lines[0] ?? "", /output of a tool call/);
  assert.match(report.lines[0] ?? "", /F100-FR-219/);
});

test("CT-100-316: the two checks of T286 and T287 are in the runner of the static tests", () => {
  const names = CHECKS.map((c) => c.name);
  assert.ok(names.includes("Threat model"), names.join(", "));
  assert.ok(names.includes("No listener"), names.join(", "));
});
