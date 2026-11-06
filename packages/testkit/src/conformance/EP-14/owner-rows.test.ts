/**
 * The rows of a host (`./owner-rows.ts`), held against a sample host of this
 * test: the builders put the core owners' entries first and the host's rows
 * at the end, in the order the host gave, and freeze what they return
 * without touching the rows they were given. No host of this repository is
 * named here.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CORE_OWNER_CHECK_IDS,
  CORE_OWNER_PACKAGE_MARKERS,
  SAMPLE_CHECK_FORBIDDEN_IMPORTS,
  SAMPLE_HOST_OWNER_ROWS,
  forbiddenImportsOfSampleCheck,
  ownerCheckIdsOf,
  ownerPackageMarkersOf,
} from "./owner-rows.ts";

test("the owner ids of a host are the core owners' ids, then the host's, in order, frozen", () => {
  const host = Object.freeze({
    packageMarker: "a-sample-host-of-this-test",
    doctorCheckIds: Object.freeze(["sample.host-one", "sample.host-two"]),
  });
  const ids = ownerCheckIdsOf(host);
  assert.deepEqual(ids, [...CORE_OWNER_CHECK_IDS, "sample.host-one", "sample.host-two"]);
  assert.equal(Object.isFrozen(ids), true);
  // The rows the host gave are not the merged list: nothing mutated them.
  assert.deepEqual(host.doctorCheckIds, ["sample.host-one", "sample.host-two"]);
});

test("the owner markers of a host are the core owners' markers, then the host's own marker", () => {
  const host = Object.freeze({
    packageMarker: "a-sample-host-of-this-test",
    doctorCheckIds: Object.freeze(["sample.host-one"]),
  });
  const markers = ownerPackageMarkersOf(host);
  assert.deepEqual(markers, [...CORE_OWNER_PACKAGE_MARKERS, "a-sample-host-of-this-test"]);
  assert.equal(Object.isFrozen(markers), true);
  const forbidden = forbiddenImportsOfSampleCheck(host);
  assert.deepEqual(forbidden, [...SAMPLE_CHECK_FORBIDDEN_IMPORTS, "a-sample-host-of-this-test"]);
  assert.equal(Object.isFrozen(forbidden), true);
});

test("the kit's sample host rows are shape-valid and name no host of this repository", () => {
  assert.equal(SAMPLE_HOST_OWNER_ROWS.packageMarker.length > 0, true);
  assert.deepEqual([...SAMPLE_HOST_OWNER_ROWS.doctorCheckIds], ["sample.host-check"]);
});
