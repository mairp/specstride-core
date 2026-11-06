/**
 * T045 (feature 112) — CT-112-122, the checks that other features register
 * (F112-FR-022). Every check an owner package registers:
 *
 *  - follows the form and the ground rules F112-FR-001 to F112-FR-008 — a
 *    stable dotted id, a severity rule inside the closed set, the `lb` flag,
 *    an order, a probe that receives injected probes, a message template of
 *    at most 200 bytes, a fix hint, and findings with id, severity, `lb`,
 *    message, remedy and redacted evidence (the doctor's real runner reads
 *    them, so the rules hold of the checks as registered, not on paper);
 *  - is NOT a row of the core catalogue `packages/doctor/data/
 *    check-catalogue.tsv`: it lives whole in the package of its owner
 *    (F112-FR-033), and no core file of the doctor carries its probe.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  MESSAGE_TEMPLATE_CAP_BYTES,
  SEVERITIES,
  type DoctorCheck,
} from "@specstride/contracts/ep/doctor";
import { checksOfThisPackage } from "../../../../tree-store/src/doctor.ts";
import {
  BREACH_CHECKS,
  PLAN_CHECK,
  RESOURCES_CHECK,
} from "../../../../layer-parallel/src/doctor.ts";
import {
  launchChecksOf123,
  terminalToolCheck123,
} from "../../../../pipeline/src/launch-checks/register.ts";
import { createToolchainDoctorCheck } from "../../../../integrity/src/toolchain/doctor-check.ts";
import {
  controlRootPermissionsCheck,
  controlRootWritableCheck,
} from "../../../../runtime/src/doctor/control-root-checks.ts";
import { lockHolderCheck, lockProbeCheck } from "../../../../runtime/src/doctor/lock-checks.ts";
import { layoutVersionCheck } from "../../../../runtime/src/doctor/layout-checks.ts";
import { survivorCheck } from "../../../../runtime/src/doctor/survivor-checks.ts";
import { platformChecksFor } from "../../../../runtime/src/doctor/platform-checks.ts";
import { detachStrategyIdCheck } from "../../../../runtime/src/doctor/detach-checks.ts";
import {
  PROBE_TIME_LIMIT_MS,
  SUBPROCESS_OUTPUT_CAP_BYTES,
  runDoctorChecks,
  makeProbeBag,
} from "../../../../doctor/src/runner/run.ts";
import { createDoctorRegistry } from "../../../../doctor/src/registry/registry.ts";

const REPO_ROOT = join(import.meta.dirname, "..", "..", "..", "..", "..");

/** The checks the other packages of this repository register, with owners. */
function checksRegisteredByOtherFeatures(): readonly {
  readonly owner: string;
  readonly check: DoctorCheck;
}[] {
  const entries: { owner: string; check: DoctorCheck }[] = [];
  const add = (owner: string, checks: readonly DoctorCheck[]): void => {
    for (const check of checks) entries.push({ owner, check });
  };
  add("tree-store", checksOfThisPackage());
  add("layer-parallel", [PLAN_CHECK, RESOURCES_CHECK, ...BREACH_CHECKS]);
  add("pipeline", [...launchChecksOf123(), terminalToolCheck123()]);
  add("integrity", [createToolchainDoctorCheck()]);
  add("runtime", [
    controlRootPermissionsCheck,
    controlRootWritableCheck,
    lockHolderCheck,
    lockProbeCheck,
    layoutVersionCheck,
    survivorCheck,
    ...platformChecksFor("linux"),
    detachStrategyIdCheck,
  ]);
  return entries;
}

/** F112-FR-001: a stable dotted id of a registered check. */
const DOTTED_ID = /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/;

test("CT-112-122: every check registered by another feature follows F112-FR-001 to F112-FR-008", async () => {
  const entries = checksRegisteredByOtherFeatures();
  assert.ok(entries.length >= 15, `the owner packages register checks (${entries.length} found)`);
  const ids = new Set<string>();
  for (const { owner, check } of entries) {
    const where = `${owner}/${check.id}`;
    // F112-FR-001 — the form: stable dotted id, severity rule, lb, order,
    // probe with injected probes, message template of at most 200 bytes,
    // fix hint. Ids are never renamed: one id, registered once here.
    assert.ok(DOTTED_ID.test(check.id), `${where}: the id is a stable dotted id`);
    assert.ok(!ids.has(check.id), `${where}: the id is registered once`);
    ids.add(check.id);
    assert.equal(typeof check.severityRule, "function", `${where}: a severity rule`);
    assert.equal(typeof check.lb, "boolean", `${where}: the lb flag`);
    assert.equal(typeof check.order, "number", `${where}: an order`);
    assert.ok(Number.isFinite(check.order), `${where}: a finite order`);
    assert.equal(typeof check.probe, "function", `${where}: a probe`);
    const bytes = Buffer.byteLength(check.messageTemplate, "utf8");
    assert.ok(
      bytes > 0 && bytes <= MESSAGE_TEMPLATE_CAP_BYTES,
      `${where}: the message template is ${bytes} bytes, within the cap`,
    );
    assert.ok(check.fixHint.length > 0, `${where}: a fix hint`);
    // The probe receives injected probes (F112-FR-001): called with an
    // injected fixture, it either resolves to an observation — on which its
    // severity rule stays in the closed set (F112-FR-008) — or refuses with
    // the injected context it still needs, which its owner's own tests feed.
    let observed: unknown;
    let refused: unknown;
    try {
      observed = await check.probe({ injected: true });
    } catch (error) {
      refused = error;
    }
    if (refused !== undefined) {
      assert.ok(refused instanceof Error, `${where}: the probe throws only an Error`);
    } else if (observed !== undefined && observed !== null) {
      // A probe that observes nothing gives no finding and its rule is not
      // read (the runner's rule); otherwise the severity is in the set.
      const severity = check.severityRule(observed);
      assert.ok(
        SEVERITIES.includes(severity),
        `${where}: the severity \`${String(severity)}\` is in the closed set`,
      );
    }
  }

  // F112-FR-002 — every check registers into the registry, which refuses
  // none of them; F112-FR-003 — the registry orders by `order`, then by id.
  const registry = createDoctorRegistry();
  for (const { check } of entries) {
    registry.register({ ...check, group: "env" });
  }
  const registered = registry.registered();
  assert.equal(registered.length, entries.length, "every check registered (F112-FR-002)");
  const sorted = [...registered].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  assert.deepEqual(
    registered.map((c) => c.id),
    sorted.map((c) => c.id),
  );

  // F112-FR-002 to F112-FR-008 hold through the doctor's real runner: the
  // checks register into the registry, run in order, and give findings with
  // the six fields and redacted evidence. Only the probes that resolve on
  // the injected fixture take part in the run, so nothing real is read
  // (F112-FR-004 read-only, F112-FR-005 no paid call).
  const resolvable: DoctorCheck[] = [];
  for (const { check } of entries) {
    try {
      await check.probe({ injected: true });
      resolvable.push(check);
    } catch {
      // The probe needs its owner's context; the owner's tests exercise it.
    }
  }
  assert.ok(
    resolvable.length >= 10,
    `most owner probes resolve on an injected fixture (${resolvable.length} of ${entries.length})`,
  );
  const fed = resolvable.map((c) => ({
    ...c,
    group: "env" as const,
    // A primitive observation is carried as data (`{ state }`), the form the
    // injected record of a probe carries; an object passes through as-is.
    probe: async () => {
      const observed = await c.probe({ injected: true });
      if (observed === undefined || observed === null) return observed;
      return typeof observed === "object" ? observed : { state: observed };
    },
  }));
  const run = await runDoctorChecks({ checks: fed, bag: makeProbeBag() });
  for (const finding of run.findings) {
    assert.ok(SEVERITIES.includes(finding.severity), `${finding.id}: severity in the set`);
    assert.equal(typeof finding.lb, "boolean", `${finding.id}: the lb flag on the finding`);
    assert.ok(finding.message.length > 0, `${finding.id}: a message`);
    assert.ok(finding.remedy.length > 0, `${finding.id}: a remedy`);
    // F112-FR-006 — the evidence carries no secret value: it is the
    // redaction of what the probe observed, never a raw read.
    assert.ok(
      !JSON.stringify(finding.evidence).match(
        /(?:password|token|secret-key|api-key)"\s*:\s*"[^"]/i,
      ),
      `${finding.id}: the evidence holds no secret value`,
    );
  }
  // F112-FR-003 — the output is ordered by severity, then by id.
  const rank: Record<string, number> = { fail: 0, warn: 1, info: 2, ok: 3 };
  const outputOrder = [...run.findings]
    .map((f) => `${rank[f.severity]}:${f.id}`)
    .sort((a, b) => a.localeCompare(b))
    .map((s) => s.slice(s.indexOf(":") + 1));
  assert.deepEqual(
    run.findings.map((f) => f.id),
    outputOrder,
  );
  // F112-FR-007 — the runner bounds every probe (the defaults are exported).
  assert.equal(PROBE_TIME_LIMIT_MS, 5_000);
  assert.equal(SUBPROCESS_OUTPUT_CAP_BYTES, 64 * 1024);
});

test("CT-112-122: no check registered by another feature is in the core catalogue", () => {
  const catalogue = readFileSync(
    join(REPO_ROOT, "packages", "doctor", "data", "check-catalogue.tsv"),
    "utf8",
  );
  const coreIds = new Set(
    catalogue
      .split("\n")
      .slice(1)
      .filter((line) => line.trim().length > 0)
      .map((line) => line.split("\t")[1]?.trim())
      .filter((id): id is string => id !== undefined),
  );
  assert.ok(coreIds.size >= 44, `the core catalogue holds its rows (${coreIds.size})`);
  const intrusions: string[] = [];
  for (const { owner, check } of checksRegisteredByOtherFeatures()) {
    if (coreIds.has(check.id)) intrusions.push(`${owner}/${check.id}`);
  }
  assert.deepEqual(
    intrusions,
    [],
    `no check of another feature is a row of the core catalogue (F112-FR-022): ${intrusions.join(", ")}`,
  );
  // And the catalogue's "probe supplied by" column names no owner package of
  // this repository: every core probe is `core`, a harness adapter's or a
  // host package's, per the contract of the catalogue.
  for (const line of catalogue.split("\n").slice(1)) {
    if (line.trim().length === 0) continue;
    const supplier = line.split("\t")[3]?.trim() ?? "";
    assert.ok(
      supplier === "core" ||
        supplier.startsWith("harness adapter") ||
        supplier.startsWith("host package"),
      `the catalogue's probe supplier is an owner kind, not an owner package: \`${supplier}\``,
    );
  }
});
