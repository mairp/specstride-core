/**
 * Row 256 of annex X §X.6, `kindsOfSourceOfALaunchContract`, lives in two
 * places that must say the same thing: the constant of `@specstride/contracts`
 * and `source.schema.json`, which the composed validator of the launch
 * contract reads. On 2026-11-25 they drifted: feature 152's T144 made the
 * inventory add `commit-gate-rules` to every contract's sources, the
 * constant kept the ten older members, and every `contract validate` on
 * `main` failed with "sources/0/kind: must be equal to one of the allowed
 * values". This test refuses the drift in either direction.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { kindsOfSourceOfALaunchContract } from "@specstride/contracts/enums/all-sets";
import sourceItemSchema from "../src/contract/schemas/source.schema.json" with { type: "json" };

test("the schema of a source and the constant of row 256 name the same kinds", () => {
  const ofTheSchema = [...sourceItemSchema.properties.kind.enum].sort();
  const ofTheConstant = [...kindsOfSourceOfALaunchContract.members].sort();
  assert.deepEqual(ofTheSchema, ofTheConstant);
});

test("the kind the inventory of feature 152 adds is a member of both", () => {
  assert.ok(kindsOfSourceOfALaunchContract.members.includes("commit-gate-rules"));
  assert.ok(sourceItemSchema.properties.kind.enum.includes("commit-gate-rules"));
});
