/**
 * T012 — the guard over the fallback reasons of F154-FR-004
 * (`src/preconditions.ts`):
 *
 *  - `dependency-unreadable` stands beside `harness` as the constant
 *    `PROPOSED_FALLBACK_REASONS_154` — a PROPOSAL of CQ-154-09, not yet a
 *    member of row 60;
 *  - the closed set of row 60 is unchanged by spec 154 (the proposal becomes
 *    a member only when the owner copies it into the annex);
 *  - the unreadable slot store is NOT a reason of this layer at all: it is
 *    SL-5 of the host-limits table of `@specstride/core` (`host.limits`),
 *    so no string of this layer names it;
 *  - every precondition still returns, and only returns, a member of row 60.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { FALLBACK_REASONS, isFallbackReason } from "../src/types.ts";
import {
  PROPOSED_FALLBACK_REASONS_154,
  fallbackOfThePreconditions,
  reasonsWithoutAPrecondition,
} from "../src/preconditions.ts";
import { SLOT_ADMISSION_TABLE } from "../../../packages/core/src/host-limits/tables.ts";

const HERE = dirname(fileURLToPath(import.meta.url));

test("T012 the proposed reason stands beside `harness`, outside the closed set", () => {
  assert.deepEqual([...PROPOSED_FALLBACK_REASONS_154], ["dependency-unreadable"]);
  for (const reason of PROPOSED_FALLBACK_REASONS_154) {
    assert.equal(
      isFallbackReason(reason),
      false,
      `${reason} is a proposal of CQ-154-09 and must not be a member of row 60 yet`,
    );
  }
  assert.ok([...FALLBACK_REASONS].includes("harness"), "row 60 keeps `harness`");
});

test("T012 the unreadable slot store is not a reason of this layer (it is SL-5)", () => {
  const layerStrings = readFileSync(join(HERE, "../src/preconditions.ts"), "utf8");
  assert.ok(
    !layerStrings.includes("slot-unreadable"),
    "no layer fallback names the slot store",
  );
  const rows = Object.values(
    (SLOT_ADMISSION_TABLE as any).rows as Record<string, any[]>,
  ).flat();
  const sl5 = rows.find((row) => row.ruleId === "SL-5");
  assert.ok(sl5 !== undefined, "SL-5 exists in the host-limits table");
  assert.deepEqual(sl5, {
    ruleId: "SL-5",
    when: { op: "equal", signal: "storeReadable", value: false },
    choice: "unbounded",
  });
});

test("T012 every precondition reason is a member of row 60, and row 60 is whole", () => {
  assert.equal(reasonsWithoutAPrecondition().length, 0);
  // With no precondition failing, the fallback is null (the layer may run).
  assert.equal(fallbackOfThePreconditions({}), null);
});
