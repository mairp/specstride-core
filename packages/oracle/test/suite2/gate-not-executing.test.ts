/**
 * CT-141-142 — a fixture whose verification gate does not execute (T139, T144;
 * F141-FR-042, DV-053).
 *
 * "For a fixture whose verification gate does not execute (verification mode
 * `plan` or `off`), the second suite MUST expect the classic loop with the
 * announced reason `gate-not-executing`, and the announcement MUST be the only
 * difference."
 *
 * What the test proves:
 *
 * - the mode is read off the fixture's own declaration, from the as-is
 *   variable `SPECSTRIDE_VERIFICATION`, and the two modes `plan` and `off` are
 *   the ones the register row names;
 * - the expectation is the event `strategy.selected` of the catalogue of
 *   feature 111 with `fallbackReason` `gate-not-executing`;
 * - on such a fixture the announcement is the ONLY difference: every
 *   difference the comparison found must be the announcement, and it must be
 *   present at all; any other difference fails, and so does a comparison that
 *   found nothing;
 * - on a fixture whose gate DOES execute (`prompt`), the second suite expects
 *   no announcement, and a difference that was allowed anyway fails.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { layerAllowlist } from "../../src/catalogue/data.ts";
import {
  ANNOUNCEMENT_EVENT,
  GATE_NOT_EXECUTING_MODES,
  GATE_NOT_EXECUTING_REASON,
  VERIFICATION_VARIABLE,
  announcementDifference,
  gateDoesNotExecute,
  gateNotExecutingExpectation,
  onlyDifferenceIsTheAnnouncement,
} from "../../src/suite2/classic-fallback.ts";
import {
  compareWithAllowlist,
  eventTypeOf,
  failuresOfVerdict,
} from "../../src/suite2/allowlist.ts";
import type { NormalizedCapture } from "../../src/normalize/index.ts";

function captureWith(surfaces: Record<string, unknown>): NormalizedCapture {
  return { surfaces } as unknown as NormalizedCapture;
}

const PLAN_FIXTURE = {
  id: "FX-11/plan-mode",
  environment: { [VERIFICATION_VARIABLE]: "plan" },
} as const;

test("the mode is read off the fixture, and two modes make the gate skip", () => {
  assert.equal(VERIFICATION_VARIABLE, "SPECSTRIDE_VERIFICATION");
  assert.deepEqual([...GATE_NOT_EXECUTING_MODES], ["plan", "off"]);
  assert.equal(GATE_NOT_EXECUTING_REASON, "gate-not-executing");
  assert.equal(ANNOUNCEMENT_EVENT, "strategy.selected");
  assert.equal(gateDoesNotExecute(PLAN_FIXTURE), true);
  assert.equal(gateDoesNotExecute({ environment: { [VERIFICATION_VARIABLE]: "off" } }), true);
  assert.equal(gateDoesNotExecute({ environment: { [VERIFICATION_VARIABLE]: "prompt" } }), false);
  assert.equal(gateDoesNotExecute({ environment: {} }), false);
  const expectation = gateNotExecutingExpectation(PLAN_FIXTURE);
  assert.notEqual(expectation, undefined);
  assert.equal(expectation?.announcement.type, "strategy.selected");
  assert.equal(expectation?.announcement.fallbackReason, "gate-not-executing");
  assert.equal(
    gateNotExecutingExpectation({ environment: { [VERIFICATION_VARIABLE]: "run" } }),
    undefined,
  );
});

test("the announcement is the only difference on such a fixture", () => {
  const file = layerAllowlist();
  const expectation = gateNotExecutingExpectation(PLAN_FIXTURE) as NonNullable<
    ReturnType<typeof gateNotExecutingExpectation>
  >;
  // Capture A holds nothing of the layer; capture B holds ONLY the
  // announcement of the classic loop.
  const a = captureWith({
    "events-primary": { records: [] },
    "control-records": { entries: [] },
  });
  const b = captureWith({
    "events-primary": {
      records: [
        {
          pairs: [
            { key: "type", value: "strategy.selected" },
            { key: "strategy", value: "classic" },
            { key: "fallbackReason", value: "gate-not-executing" },
          ],
        },
      ],
    },
    "control-records": { entries: [] },
  });
  const verdict = compareWithAllowlist("FX-11/plan-mode", a, b, file, {
    verificationMode: "plan",
  });
  // The comparison removed the announcement with the allowlist, and nothing
  // else differed.
  assert.equal(verdict.breaches.length, 0);
  assert.deepEqual(failuresOfVerdict(verdict), []);
  assert.deepEqual(onlyDifferenceIsTheAnnouncement(verdict, expectation, file), []);
  // The difference the comparison removed IS the announcement, by its type and
  // its reason.
  assert.equal(verdict.allowed.length, 1);
  assert.equal(verdict.allowed[0]?.difference.where, ANNOUNCEMENT_EVENT);
  const announcement = announcementDifference(expectation);
  assert.equal(announcement.surface, "events-primary");
  assert.ok(announcement.b.includes(GATE_NOT_EXECUTING_REASON));
});

test("any other difference is not the announcement, and fails", () => {
  const file = layerAllowlist();
  const expectation = gateNotExecutingExpectation(PLAN_FIXTURE) as NonNullable<
    ReturnType<typeof gateNotExecutingExpectation>
  >;
  // The layer also wrote a field of the run record: that difference is outside
  // the allowlist, so the comparison breached — and the announcement-only check
  // reports it.
  const a = captureWith({
    "events-primary": { records: [] },
    "control-records": { entries: [{ name: "workspace:record", value: { loop: "off" } }] },
  });
  const b = captureWith({
    "events-primary": {
      records: [
        {
          pairs: [
            { key: "type", value: "strategy.selected" },
            { key: "fallbackReason", value: "gate-not-executing" },
          ],
        },
      ],
    },
    "control-records": {
      entries: [{ name: "workspace:record", value: { loop: "off", extraLayerField: 1 } }],
    },
  });
  const verdict = compareWithAllowlist("FX-11/plan-mode", a, b, file, {
    verificationMode: "plan",
  });
  assert.equal(verdict.breaches.length, 1);
  const failures = onlyDifferenceIsTheAnnouncement(verdict, expectation, file);
  assert.equal(failures.length, 1);
  assert.match(failures[0] as string, /control-records\/workspace:record/);
  assert.match(failures[0] as string, /the announcement is the only difference/);
});

test("a comparison that found no announcement fails, and the event type is the catalogue's", () => {
  const file = layerAllowlist();
  const expectation = gateNotExecutingExpectation(PLAN_FIXTURE) as NonNullable<
    ReturnType<typeof gateNotExecutingExpectation>
  >;
  const empty = captureWith({
    "events-primary": { records: [] },
    "control-records": { entries: [] },
  });
  const verdict = compareWithAllowlist("FX-11/plan-mode", empty, empty, file, {
    verificationMode: "plan",
  });
  assert.equal(verdict.breaches.length, 0);
  const failures = onlyDifferenceIsTheAnnouncement(verdict, expectation, file);
  assert.match(failures[0] as string, /found no announcement/);
  // And the type the expectation names is the catalogue's name, read the way
  // the capture reads it.
  assert.equal(
    eventTypeOf({
      pairs: [
        { key: "type", value: ANNOUNCEMENT_EVENT },
        { key: "fallbackReason", value: GATE_NOT_EXECUTING_REASON },
      ],
    }),
    ANNOUNCEMENT_EVENT,
  );
});

test("a fixture whose gate executes expects no announcement", () => {
  const file = layerAllowlist();
  const verdict = compareWithAllowlist(
    "FX-01/defaults",
    captureWith({ "events-primary": { records: [] }, "control-records": { entries: [] } }),
    captureWith({
      "events-primary": { records: [] },
      "control-records": { entries: [{ name: "workspace:record", value: { loop: "micro" } }] },
    }),
    file,
    { verificationMode: "prompt" },
  );
  assert.equal(verdict.breaches.length, 1);
  const failures = onlyDifferenceIsTheAnnouncement(verdict, undefined, file);
  assert.equal(failures.length, 1);
  assert.match(failures[0] as string, /the verification gate executes/);
});
