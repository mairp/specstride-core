/**
 * T095 — the contract tests CT-100-113, CT-100-114, CT-100-115 and CT-100-116
 * for the registry of an extension point (annex A, §A.4; F100-FR-013 to
 * F100-FR-016).
 *
 * The subject is the frame of T096, `src/conformance/frame.ts`: the id form
 * and the range of majors; the three classes of row 83 of annex X §X.6; the
 * widening rule for project configuration; one registry per point, read-only
 * after launch, with the resolved values replayed on resume.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CLASSES_ACCEPTED_IN_WAVE_1,
  CURRENT_MAJOR,
  EXTENSION_POINT_ID_FORM,
  IMPLEMENTATION_CLASSES,
  majorIsSupported,
  majorOutOfRangeMessage,
  parseExtensionPointId,
  supportedMajors,
} from "@specstride/contracts/ep/extension-point";
import { classesOfImplementationOfAnExtensionPoint } from "@specstride/contracts/enums/all-sets";
import {
  CLASSES_ROW,
  EXTENSION_POINTS_INDEX,
  EXTENSION_POINT_COUNT,
  RESOLVE_AGAIN_FLAG,
  UnknownExtensionPointError,
  isLaunched,
  loadExtensionPointIndex,
  markLaunched,
  registryOf,
  replayResolved,
  resetFrame,
  resolvedOfTheRun,
  ROOT,
  type Implementation,
} from "../src/conformance/frame.ts";
import { SCHEMA_ID as TOOLCHAIN_SCHEMA_ID } from "@specstride/contracts/ep/toolchain";
import { PROFILE } from "../src/samples/EP-16/index.ts";

const index = loadExtensionPointIndex();

function firstParty(
  ep: string,
  pointId: string,
  more: Partial<Implementation> = {},
): Implementation {
  return Object.freeze({
    ep,
    pointId,
    id: `impl-of-${ep}`,
    implementationClass: "first-party" as const,
    majors: [1],
    provenance: "default" as const,
    operations: Object.freeze({}),
    ...more,
  });
}

test("CT-100-113: every point has an id of the form `specstride.<name>/<major>`, and the registry refuses and reports an implementation outside the range of majors the core supports (F100-FR-013)", () => {
  resetFrame();
  assert.equal(index.length, EXTENSION_POINT_COUNT);
  // The id form holds for every id of every point of the index.
  for (const entry of index) {
    for (const id of entry.ids) {
      assert.match(id, EXTENSION_POINT_ID_FORM, `${entry.ep}: ${id}`);
      const parsed = parseExtensionPointId(id);
      assert.ok(parsed !== undefined);
      assert.equal(parsed.major, CURRENT_MAJOR);
    }
  }
  assert.equal(EXTENSION_POINT_ID_FORM.test("specstride.harness"), false);
  assert.equal(EXTENSION_POINT_ID_FORM.test("harness/1"), false);
  assert.equal(EXTENSION_POINT_ID_FORM.test("specstride.Harness/1"), false);

  // The core supports the current major and the one before it.
  assert.deepEqual([...supportedMajors(1)], [1]);
  assert.deepEqual([...supportedMajors(2)], [1, 2]);
  assert.deepEqual([...supportedMajors(3)], [2, 3]);
  assert.equal(majorIsSupported(1), true);
  assert.equal(majorIsSupported(2), false);
  assert.equal(majorIsSupported(0), false);

  const registry = registryOf("EP-08");
  const outside = registry.register(
    firstParty("EP-08", "specstride.event-sink/1", { id: "too-new", majors: [2] }),
  );
  assert.equal(outside.accepted, false);
  if (!outside.accepted) {
    assert.equal(outside.reason, "major-out-of-range");
    assert.equal(outside.message, majorOutOfRangeMessage("specstride.event-sink/1", [2]));
    // The doctor reports it.
    assert.match(outside.doctorWarning ?? "", /outside the range the core supports/);
  }
  const older = registry.register(
    firstParty("EP-08", "specstride.event-sink/1", { id: "too-old", majors: [0] }),
  );
  assert.equal(older.accepted, false);
  // An implementation that declares the current major is accepted.
  const good = registry.register(
    firstParty("EP-08", "specstride.event-sink/1", { majors: [1, 2] }),
  );
  assert.equal(good.accepted, true);
  if (good.accepted) assert.equal(good.record.major, 1);
  // An id that is no id of the point is refused.
  const wrongId = registry.register(firstParty("EP-08", "specstride.harness/1", { id: "wrong" }));
  assert.equal(wrongId.accepted, false);
  if (!wrongId.accepted) assert.equal(wrongId.reason, "unknown-point");
  resetFrame();
});

test("CT-100-114: the three classes of row 83 — data is validated against its schema, first-party code is accepted, and third-party code is refused in Wave 1 with a message that names the class (F100-FR-014)", () => {
  resetFrame();
  assert.deepEqual([...IMPLEMENTATION_CLASSES], ["data", "first-party", "third-party"]);
  // Row 83 of annex X §X.6 registers by reference to the same list.
  assert.equal(classesOfImplementationOfAnExtensionPoint.number, CLASSES_ROW);
  assert.deepEqual(
    [...classesOfImplementationOfAnExtensionPoint.members],
    [...IMPLEMENTATION_CLASSES],
  );
  assert.deepEqual([...CLASSES_ACCEPTED_IN_WAVE_1], ["data", "first-party"]);

  // first-party: accepted.
  const sinks = registryOf("EP-08");
  assert.equal(sinks.register(firstParty("EP-08", "specstride.event-sink/1")).accepted, true);

  // data: validated against its schema.
  const toolchains = registryOf("EP-16");
  const valid = toolchains.register(
    firstParty("EP-16", "specstride.toolchain/1", {
      id: "valid-profile",
      implementationClass: "data",
      schemaId: TOOLCHAIN_SCHEMA_ID,
      value: PROFILE,
    }),
  );
  assert.equal(valid.accepted, true, valid.accepted ? "" : valid.message);
  const invalid = toolchains.register(
    firstParty("EP-16", "specstride.toolchain/1", {
      id: "invalid-profile",
      implementationClass: "data",
      schemaId: TOOLCHAIN_SCHEMA_ID,
      value: { schema: TOOLCHAIN_SCHEMA_ID },
    }),
  );
  assert.equal(invalid.accepted, false);
  if (!invalid.accepted) {
    assert.equal(invalid.reason, "data-invalid");
    assert.match(invalid.message, /does not validate against/);
  }
  const noSchema = toolchains.register(
    firstParty("EP-16", "specstride.toolchain/1", {
      id: "no-schema",
      implementationClass: "data",
      value: PROFILE,
    }),
  );
  assert.equal(noSchema.accepted, false);
  if (!noSchema.accepted) assert.equal(noSchema.reason, "data-invalid");

  // third-party: refused in Wave 1, with a message that names the class.
  const thirdParty = sinks.register(
    firstParty("EP-08", "specstride.event-sink/1", {
      id: "a-third-party-sink",
      implementationClass: "third-party",
    }),
  );
  assert.equal(thirdParty.accepted, false);
  if (!thirdParty.accepted) {
    assert.equal(thirdParty.reason, "third-party-class");
    assert.match(thirdParty.message, /`third-party`/);
    assert.match(thirdParty.message, /not enabled in Wave 1/);
  }

  // A class the closed set does not hold is refused at registration.
  const unknownClass = sinks.register(
    firstParty("EP-08", "specstride.event-sink/1", {
      id: "odd-class",
      implementationClass: "fourth-party" as never,
    }),
  );
  assert.equal(unknownClass.accepted, false);
  if (!unknownClass.accepted) {
    assert.equal(unknownClass.reason, "unknown-class");
    assert.match(unknownClass.message, new RegExp(`row ${CLASSES_ROW} of annex X`));
  }
  resetFrame();
});

test("CT-100-115: a widening implementation from project configuration is ignored, with the launch message and the doctor warning (F100-FR-015)", () => {
  resetFrame();
  const registry = registryOf("EP-02");
  const widening = firstParty("EP-02", "specstride.harness/1", {
    id: "a-widening-harness",
    widensCapability: true,
    provenance: "project-configuration",
  });
  const outcome = registry.register(widening);
  assert.equal(outcome.accepted, false);
  if (!outcome.accepted) {
    assert.equal(outcome.reason, "widening-from-project-configuration");
    // Ignored, not refused: the launch goes on.
    assert.equal(outcome.ignored, true);
    assert.match(outcome.message, /project configuration cannot widen a run/);
    assert.match(outcome.message, /extensionPoints\.EP-02\.implementation/);
    assert.match(outcome.doctorWarning ?? "", /widening key/);
  }
  assert.equal(registry.entries().length, 0);
  assert.equal(registry.resolved().length, 0);

  // The same widening implementation from user configuration, the environment
  // or a flag is accepted.
  for (const provenance of ["user-configuration", "environment", "flag"] as const) {
    const accepted = registry.register({
      ...widening,
      id: `widening-from-${provenance}`,
      provenance,
    });
    assert.equal(accepted.accepted, true, accepted.accepted ? "" : accepted.message);
  }
  assert.equal(registry.entries().length, 3);
  resetFrame();
});

test("CT-100-116: one registry per point, read-only after launch, and the resolved values replayed on resume (F100-FR-016)", () => {
  resetFrame();
  // One registry per point of `contracts/extension-points/index.json`.
  const raw = JSON.parse(readFileSync(join(ROOT, EXTENSION_POINTS_INDEX), "utf8")) as {
    extensionPoints: { ep: string; ids: string[] }[];
  };
  assert.equal(raw.extensionPoints.length, EXTENSION_POINT_COUNT);
  for (const entry of raw.extensionPoints) {
    const byEp = registryOf(entry.ep);
    // Every id of the point reaches the same registry.
    for (const id of entry.ids) {
      assert.equal(registryOf(id).ep, byEp.ep);
    }
    assert.deepEqual([...byEp.pointIds], entry.ids);
  }
  assert.throws(() => registryOf("EP-99"), UnknownExtensionPointError);
  assert.throws(() => registryOf("specstride.nothing/1"), UnknownExtensionPointError);

  // A registration goes only to the registry of its own point.
  const sinks = registryOf("EP-08");
  const harnesses = registryOf("EP-02");
  assert.equal(sinks.register(firstParty("EP-08", "specstride.event-sink/1")).accepted, true);
  assert.equal(harnesses.register(firstParty("EP-02", "specstride.harness/1")).accepted, true);
  assert.equal(sinks.entries().length, 1);
  assert.equal(harnesses.entries().length, 1);
  assert.equal(registryOf("specstride.event-sink/1").entries().length, 1);

  // `resolved()` gives the records the run writes.
  const stored = resolvedOfTheRun();
  assert.equal(stored.length, 2);
  assert.deepEqual(stored.map((r) => r.ep).sort(), ["EP-02", "EP-08"]);
  for (const record of stored) {
    assert.equal(record.major, 1);
    assert.equal(record.implementationClass, "first-party");
    assert.equal(record.provenance, "default");
    assert.equal(record.standing, record.ep === "EP-18" ? "internal-seam" : "public-contract");
  }

  // Read-only after launch.
  assert.equal(isLaunched(), false);
  markLaunched();
  assert.equal(isLaunched(), true);
  const afterLaunch = sinks.register(
    firstParty("EP-08", "specstride.event-sink/1", { id: "late" }),
  );
  assert.equal(afterLaunch.accepted, false);
  if (!afterLaunch.accepted) {
    assert.equal(afterLaunch.reason, "frozen");
    assert.match(afterLaunch.message, /read-only after launch/);
  }
  assert.equal(sinks.entries().length, 1);

  // A resume replays the resolved values and does not resolve again.
  const replayed = replayResolved(stored);
  assert.equal(replayed.resolvedAgain, false);
  assert.deepEqual([...replayed.records], [...stored]);
  assert.equal(isLaunched(), true, "a resume that replays keeps the registries frozen");
  assert.deepEqual([...registryOf("EP-08").resolved()], [stored.find((r) => r.ep === "EP-08")]);
  // The replayed registry holds the record without the implementation being
  // registered again.
  assert.equal(registryOf("EP-08").entries().length, 0);

  // Unless the consumer asks for it by flag.
  const again = replayResolved(stored, { resolveAgain: true });
  assert.equal(again.resolvedAgain, true);
  assert.equal(again.records.length, 0);
  assert.equal(RESOLVE_AGAIN_FLAG, "--resolve-registries");
  resetFrame();
});
