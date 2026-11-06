/**
 * The frame of the owner claims of EP-14 (`./owner-claims.ts`), held without
 * running its claims: it refuses the rows of a host that name no marker or no
 * check id, and neither the frame nor the rows of a host name any host of
 * this repository.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { registerOwnerPlaceClaims, registerSampleCheckBoundaryClaims } from "./owner-claims.ts";

test("the frame refuses the rows of a host that name no marker or no check id", () => {
  assert.throws(
    () => registerOwnerPlaceClaims({ host: { packageMarker: "", doctorCheckIds: ["sample.x"] } }),
    /marker/,
  );
  assert.throws(
    () =>
      registerOwnerPlaceClaims({ host: { packageMarker: "a-sample-host", doctorCheckIds: [] } }),
    /ids/,
  );
  assert.throws(
    () =>
      registerSampleCheckBoundaryClaims({
        host: { packageMarker: "a-sample-host", doctorCheckIds: [""] },
      }),
    /empty check id/,
  );
});

test("the frame and the rows of a host name no host of this repository", () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const sources = [join(here, "owner-claims.ts"), join(here, "owner-rows.ts")].map((p) =>
    readFileSync(p, "utf8"),
  );
  for (const source of sources) {
    for (const pattern of [/host-claude-code/, /claude/i, /\.claude-plugin/, /\/specstride:/]) {
      assert.equal(
        pattern.test(source),
        false,
        `${String(pattern)} appears in the owner rows or the claims frame of EP-14`,
      );
    }
  }
});
