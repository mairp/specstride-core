/**
 * T101 (feature 154, US4) — THE HOST LIMITS A PROJECT MAY CARRY
 * (F154-FR-046, principle III): a project configuration may only LOWER a
 * host bound the user configuration set; it may never RAISE one, never add
 * a bound of a rule the user did not bound, and never turn `host.limits`
 * off. The `parity` profile turns the limits off whatever any source held.
 * Bad values are refused with their reason, never an error.
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  hostLimitsInForce,
  hostBoundRuleOf,
  HOST_BOUND_KEYS,
} from "../../../layer-parallel/src/register.ts";

test("the declared bound keys map to their slot rules", () => {
  assert.equal(hostBoundRuleOf("host.checks.concurrent"), "checks");
  assert.equal(hostBoundRuleOf("host.sessions.acme"), "sessions/acme");
  assert.equal(hostBoundRuleOf("host.resources.cache.capacity"), "resources/cache");
  assert.equal(hostBoundRuleOf("host.resources.cache"), null);
  assert.equal(hostBoundRuleOf("host.limits"), null);
  assert.equal(HOST_BOUND_KEYS.length, 3);
});

test("a project that lowers a bound is accepted", () => {
  const inForce = hostLimitsInForce({
    userConfiguration: { limits: "on", bounds: { "host.checks.concurrent": 4, "host.resources.cache.capacity": 2 } },
    projectConfiguration: { bounds: { "host.checks.concurrent": 2, "host.resources.cache.capacity": 1 } },
  });
  assert.deepEqual(inForce.on, true);
  assert.deepEqual(inForce.bounds, { checks: 2, "resources/cache": 1 });
  assert.deepEqual(inForce.refusals, []);
});

test("a project that raises a bound is refused with its reason", () => {
  const inForce = hostLimitsInForce({
    userConfiguration: { limits: "on", bounds: { "host.checks.concurrent": 2 } },
    projectConfiguration: { bounds: { "host.checks.concurrent": 8 } },
  });
  assert.deepEqual(inForce.bounds, { checks: 2 }, "the raise must not stand");
  assert.equal(inForce.refusals.length, 1);
  assert.match(inForce.refusals[0]!, /may not RISE/);
});

test("a project bound of a rule the user did not bound is refused", () => {
  const inForce = hostLimitsInForce({
    userConfiguration: { limits: "on", bounds: { "host.checks.concurrent": 2 } },
    projectConfiguration: { bounds: { "host.resources.cache.capacity": 1 } },
  });
  assert.deepEqual(inForce.bounds, { checks: 2 });
  assert.equal(inForce.refusals.length, 1);
  assert.match(inForce.refusals[0]!, /may only lower/);
});

test("a project cannot turn host.limits off", () => {
  const inForce = hostLimitsInForce({
    userConfiguration: { limits: "on" },
    projectConfiguration: { limits: "off" },
  });
  assert.equal(inForce.on, true, "the project switch of off must not stand");
  assert.equal(inForce.refusals.length, 1);
  assert.match(inForce.refusals[0]!, /may never turn the host limits off/);
});

test("the parity profile turns the limits off whatever the sources held", () => {
  const inForce = hostLimitsInForce({
    userConfiguration: { limits: "on", bounds: { "host.checks.concurrent": 2 } },
    projectConfiguration: { bounds: { "host.checks.concurrent": 1 } },
    profile: "parity",
  });
  assert.equal(inForce.on, false);
  assert.deepEqual(inForce.bounds, {});
});

test("bad values are refused, never an error", () => {
  const inForce = hostLimitsInForce({
    userConfiguration: {
      limits: "on",
      bounds: { "host.checks.concurrent": 0, "host.sessions.acme": 1.5, "host.bogus": 3 },
    },
  });
  // Zero is no width, 1.5 is no integer, `host.bogus` names no bound: all
  // three refused with their reasons, none of them in the bounds in force.
  assert.deepEqual(inForce.bounds, {});
  assert.equal(inForce.refusals.length, 3);
});
