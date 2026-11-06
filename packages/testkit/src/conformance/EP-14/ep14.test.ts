/**
 * T044 (feature 112) — CT-112-207, the sample check of EP-14 proves User
 * Story 3: a package adds a check without touching the core (F112-SC-007;
 * F112-FR-002; F112-FR-022). Four cases over the sample of
 * `src/samples/EP-14/`:
 *
 *  1. the sample appears in the `--json` output, through the real renderer
 *     of the doctor (`renderJson`, schema `specstride.doctor/1`);
 *  2. with the flag `lb` set, a `fail` of the sample refuses a launch —
 *     through the real `runDoctorChecks` and `evaluateLaunchChecks`;
 *  3. registering, running and removing the sample changes 0 core files of
 *     the doctor package (a hash manifest of `packages/doctor/src` and
 *     `packages/doctor/data` is byte-identical across the whole cycle);
 *  4. the import-boundary check passes: no file of the doctor package
 *     imports the sample or the package of any owner of a registered check
 *     (the doctor imports ports, never the owner of a check, F112-FR-033).
 *
 * The fourth case is the frame of the testkit
 * (`registerSampleCheckBoundaryClaims` of `./owner-claims.ts`), registered
 * with the kit's SAMPLE host rows (`./owner-rows.ts`) — the rows of a host
 * are input, and no host of this repository is named here.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { SCHEMA_ID, type DoctorCheck, type Severity } from "@specstride/contracts/ep/doctor";
import { operations, SAMPLE_CHECK } from "../../samples/EP-14/index.ts";
import { createDoctorRegistry } from "../../../../doctor/src/registry/registry.ts";
import { runDoctorChecks, makeProbeBag } from "../../../../doctor/src/runner/run.ts";
import {
  evaluateLaunchChecks,
  launchRefusal,
} from "../../../../doctor/src/registry/launch-subset.ts";
import { renderJson } from "../../../../doctor/src/render/json.ts";
import { registerSampleCheckBoundaryClaims } from "./owner-claims.ts";
import { SAMPLE_HOST_OWNER_ROWS } from "./owner-rows.ts";

const REPO_ROOT = join(import.meta.dirname, "..", "..", "..", "..", "..");
const DOCTOR_SRC = join(REPO_ROOT, "packages", "doctor", "src");
const DOCTOR_DATA = join(REPO_ROOT, "packages", "doctor", "data");

/** The sample as the doctor registry takes it: with one group of the 19. */
const SAMPLE_AS_CORE_TAKES_IT: DoctorCheck & { group: "env" } = Object.freeze({
  ...SAMPLE_CHECK,
  group: "env" as const,
});

/** The sample's own probe, driven with an injected context. */
function sampleProbeResult(context: Readonly<Record<string, unknown>>): Promise<unknown> {
  return SAMPLE_CHECK.probe(context);
}

/** A recursive hash manifest of every file under a directory. */
function manifestOf(root: string): Readonly<Record<string, string>> {
  const out: Record<string, string> = {};
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir).sort()) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      out[full.slice(root.length + 1)] = createHash("sha256")
        .update(readFileSync(full))
        .digest("hex");
    }
  };
  walk(root);
  return Object.freeze(out);
}

/** Every TypeScript file under a directory, as absolute paths. */
function tsFilesOf(root: string): readonly string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir).sort()) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (full.endsWith(".ts")) out.push(full);
    }
  };
  walk(root);
  return out;
}

test("CT-112-207 (1): the sample check appears in the --json output of the doctor", async () => {
  // Register the sample exactly as a package does: through the operations
  // the sample exports; the registry the sample holds is process memory.
  if (!operations.registered().some((c) => c.id === SAMPLE_CHECK.id)) {
    operations.register(SAMPLE_CHECK);
  }
  const findings = await operations.run({ context: { present: true }, flags: {} });
  const sample = findings.find((f) => f.id === SAMPLE_CHECK.id);
  assert.ok(sample !== undefined, "the sample's finding is in the doctor run");
  assert.equal(sample.severity, "ok");
  assert.equal(sample.lb, true, "the sample carries the launch-blocking flag");

  // The real `--json` renderer of the doctor renders the finding, inside the
  // schema `specstride.doctor/1`, and validates it before it leaves.
  const jsonText = renderJson({
    at: "2026-10-01T00:00:00.000Z",
    host: "cli",
    audience: "personal",
    exit: 0,
    findings: findings.map((f) => ({
      id: f.id,
      severity: f.severity as Severity,
      lb: f.lb,
      message: f.message,
      evidence: { observed: "(redacted)" },
      remedy: f.fix,
    })),
  });
  const record = JSON.parse(jsonText) as {
    schema: string;
    findings: readonly { id: string }[];
  };
  assert.equal(record.schema, SCHEMA_ID);
  assert.ok(
    record.findings.some((f) => f.id === SAMPLE_CHECK.id),
    "the sample check appears in the --json output (F112-FR-002 registration, F112-SC-007)",
  );
});

test("CT-112-207 (2): with lb set, a fail of the sample refuses a launch", async () => {
  // The real registry takes the sample; registration is process memory.
  const registry = createDoctorRegistry();
  registry.register(SAMPLE_AS_CORE_TAKES_IT);
  assert.ok(registry.registered().some((c) => c.id === SAMPLE_CHECK.id));

  // The sample's own probe, observed failing. The wrapper carries the
  // observed value as data (`{ state }`, the form the injected record of a
  // probe carries), and the severity rule reads the same value back.
  const observedAs = (value: unknown): unknown => ({ state: value });
  const readState = (observed: unknown): unknown =>
    observed !== null && typeof observed === "object" && "state" in observed
      ? (observed as { state: unknown }).state
      : observed;
  const failing: DoctorCheck = {
    ...SAMPLE_CHECK,
    probe: async () => observedAs(await sampleProbeResult({ present: false })),
    severityRule: (observed) => SAMPLE_CHECK.severityRule(readState(observed)),
  };
  const bag = makeProbeBag();
  const failed = await runDoctorChecks({
    checks: [{ ...failing, group: "env" }],
    bag,
  });
  const finding = failed.findings.find((f) => f.id === SAMPLE_CHECK.id);
  assert.ok(finding !== undefined);
  assert.equal(finding.severity, "fail");
  assert.equal(finding.lb, true);
  assert.equal(launchRefusal(failed.findings).refused, true);
  const launch = await evaluateLaunchChecks({
    checks: [{ ...failing, group: "env" }],
    bag,
  });
  assert.equal(launch.refused, true, "with lb the sample refuses a launch (F112-SC-007)");
  assert.deepEqual(launch.refusalIds, [SAMPLE_CHECK.id]);

  // The same probe, observed present: no refusal.
  const healthy: DoctorCheck = {
    ...SAMPLE_CHECK,
    probe: async () => observedAs(await sampleProbeResult({ present: true })),
    severityRule: (observed) => SAMPLE_CHECK.severityRule(readState(observed)),
  };
  const passed = await runDoctorChecks({ checks: [{ ...healthy, group: "env" }], bag });
  assert.equal(launchRefusal(passed.findings).refused, false);
});

test("CT-112-207 (3): registering, running and removing the sample changes 0 core files", async () => {
  const before = manifestOf(DOCTOR_SRC);
  const dataBefore = manifestOf(DOCTOR_DATA);
  const wasRegistered = operations.registered().some((c) => c.id === SAMPLE_CHECK.id);
  if (!wasRegistered) operations.register(SAMPLE_CHECK);
  await operations.run({ context: { present: true }, flags: {} });
  assert.equal(operations.remove(SAMPLE_CHECK.id), true, "the sample is removed");
  assert.equal(
    operations.registered().some((c) => c.id === SAMPLE_CHECK.id),
    false,
    "the sample is no longer registered",
  );
  assert.deepEqual(manifestOf(DOCTOR_SRC), before, "no file under packages/doctor/src changed");
  assert.deepEqual(manifestOf(DOCTOR_DATA), dataBefore, "no data file changed");

  // The sample is not a row of the core catalogue, and no core file names it.
  const catalogue = readFileSync(
    join(REPO_ROOT, "packages", "doctor", "data", "check-catalogue.tsv"),
    "utf8",
  );
  assert.ok(
    !catalogue.includes(SAMPLE_CHECK.id),
    "the sample check is not in the core catalogue (F112-FR-022)",
  );
  for (const file of tsFilesOf(DOCTOR_SRC)) {
    const text = readFileSync(file, "utf8");
    assert.ok(
      !text.includes(SAMPLE_CHECK.id),
      `no core file of the doctor names the sample: ${file}`,
    );
  }
});

// The fourth case of CT-112-207, from the frame of the testkit: the forbidden
// imports are the built-in ones of `./owner-rows.ts` plus the host's own
// package marker, here the marker of the kit's SAMPLE host.
registerSampleCheckBoundaryClaims({ host: SAMPLE_HOST_OWNER_ROWS });
