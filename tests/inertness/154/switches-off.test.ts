/**
 * T014 — the switches-off inertness run over `tests/fixtures/154/groups/`
 * (F154-SC-012): the stub engine runs with every switch of spec 154 off, and
 * no event or file of the feature exists — no `parallel.admission`, no
 * `host.slot.*`, no `pipeline.landing.*`, no `loop.speculation.*`, and no
 * slot or hold file under the temporary user-state root.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { fixture154, forbiddenTypes, slotAndHoldFiles } from "./helpers.ts";

test("T014 with every switch off, no event or file of spec 154 exists", async () => {
  const f = fixture154();
  try {
    const exit = await f.run();
    assert.equal(exit, 0, "the run completes as with the feature absent");
    const types = f.eventTypes();
    assert.ok(types.length > 0, "the run wrote events");
    assert.deepEqual(
      forbiddenTypes(types),
      [],
      `no event of the feature: saw ${JSON.stringify(forbiddenTypes(types))}`,
    );
    assert.deepEqual(
      slotAndHoldFiles(f.home),
      [],
      "no slot or hold file under the user-state root",
    );
  } finally {
    f.restore();
  }
});
