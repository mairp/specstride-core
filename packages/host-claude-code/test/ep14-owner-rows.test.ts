/**
 * The owner claims of EP-14 (CT-112-133, CT-112-207 (4); F112-FR-033) run
 * against THIS HOST's rows: the claims are the testkit's frame
 * (`registerOwnerPlaceClaims` and `registerSampleCheckBoundaryClaims` of
 * `@specstride/testkit/conformance/EP-14/owner-claims`), and the rows are
 * `HOST_OWNER_ROWS` of `./ep14-rows.ts` — the marker of this package and the
 * ids of the doctor checks this host registers.
 *
 * The doctor tree the claims read is the doctor of the repository both
 * packages live in; the frame resolves it from its own location, so the same
 * registration runs wherever the host's test tree sits.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { registerOwnerPlaceClaims } from "@specstride/testkit/conformance/EP-14/owner-claims";
import { registerSampleCheckBoundaryClaims } from "@specstride/testkit/conformance/EP-14/owner-claims";
import { ROOT } from "@specstride/testkit/conformance/frame";
import { HOST_OWNER_ROWS } from "./ep14-rows.ts";

const place = registerOwnerPlaceClaims({ host: HOST_OWNER_ROWS });
const boundary = registerSampleCheckBoundaryClaims({ host: HOST_OWNER_ROWS });

test("the rows this host supplies are the rows of group host of the doctor catalogue, and its own package", () => {
  // The registrations ran the four place-of-a-check claims and the boundary
  // claim of the sample check over the doctor tree, with these rows folded in.
  assert.deepEqual(place, {
    claimCount: 4,
    ownerCheckIdCount: 7,
    ownerPackageMarkerCount: 10,
  });
  assert.deepEqual(boundary, { claimCount: 1, forbiddenImportCount: 9 });

  // The marker names THIS package: the manifest name of the plugin carries it.
  const manifest = JSON.parse(
    readFileSync(join(ROOT, "packages", "host-claude-code", "package.json"), "utf8"),
  ) as { name: string };
  assert.equal(manifest.name, "@specstride/host-claude-code");
  assert.ok(manifest.name.includes(HOST_OWNER_ROWS.packageMarker));

  // The ids are the rows of group `host` of the doctor's catalogue — the
  // doctor's own data, which CT-112-112 of the doctor's suite holds against
  // the supplier `host package`. This host registers no check id that the
  // catalogue does not name, and the catalogue names none that this host
  // does not supply.
  const catalogue = readFileSync(
    join(ROOT, "packages", "doctor", "data", "check-catalogue.tsv"),
    "utf8",
  );
  const hostGroupIds = catalogue
    .split("\n")
    .filter((line) => line.includes("\t") && !line.startsWith("n\t"))
    .map((line) => line.split("\t"))
    .filter((columns) => columns[2] === "host")
    .map((columns) => columns[1]);
  assert.deepEqual(hostGroupIds, [...HOST_OWNER_ROWS.doctorCheckIds]);
});
