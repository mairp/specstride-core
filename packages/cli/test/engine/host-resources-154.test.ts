/**
 * T098 (feature 154, US4) — THE `resources/<name>` BOUND THROUGH THE
 * ENGINE (F154-FR-041). A named host resource of one account — a shared
 * cache, a device — is held by at most `capacity` holders at once:
 * - one seam take under `SPECSTRIDE_HOST_RESOURCES_KEYS=1` holds, the next
 *   waits and proceeds when the holder releases;
 * - a different resource name is a different bound and does not wait;
 * - an engine run with the bound set records `host.slot.admission` events
 *   for the rule `resources/keys`.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import test from "node:test";

import { fixture154 } from "../../../../tests/inertness/154/helpers.ts";

const CLI = join(dirname(fileURLToPath(import.meta.url)), "../../bin/specstride");

type Event = { type: string; at?: string; data: Record<string, unknown> };

/** Every event of every run under the fixture home, in file order. */
function eventsUnderHome(home: string): Event[] {
  const all: Event[] = [];
  const walk = (dir: string): void => {
    let entries: string[] = [];
    try {
      entries = readdirSync(dir).sort();
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry);
      if (entry === "events.jsonl") {
        for (const line of readFileSync(full, "utf8").split("\n")) {
          if (line.trim() !== "") all.push(JSON.parse(line) as Event);
        }
      } else {
        walk(full);
      }
    }
  };
  walk(home);
  return all;
}

test("one resource holder blocks the next and frees it on release", async () => {
  const { makeRunHostSlots } = await import("../../src/engine/host-slots.ts");
  const admissions: string[] = [];
  const slotsHome = mkdtempSync(join(tmpdir(), "specstride-resources-seam-"));
  const slots = makeRunHostSlots({
    home: slotsHome,
    workdir: process.cwd(),
    env: { SPECSTRIDE_HOST_RESOURCES_KEYS: "1", SPECSTRIDE_HOST_RESOURCES_OTHER: "1" },
    limitsOn: true,
  });
  try {
    const first = await slots.take("resources/keys", (admission) =>
      admissions.push(admission.verdict),
    );
    assert.ok(first !== null, "the first resource take did not acquire");
    let secondAcquired = false;
    const second = slots.take("resources/keys", (admission) => admissions.push(admission.verdict));
    const probe = await Promise.race([
      second.then((release) => {
        secondAcquired = release !== null;
        return "acquired";
      }),
      new Promise((resolve) => setTimeout(() => resolve("timeout"), 300)),
    ]);
    assert.equal(probe, "timeout", "the second take acquired while the resource was held");
    assert.equal(secondAcquired, false);
    // A DIFFERENT resource name is a different bound: it never waits.
    const other = await slots.take("resources/other", (admission) =>
      admissions.push(admission.verdict),
    );
    assert.ok(other !== null, "a different resource name waited on the held one");
    await first?.();
    const release = await Promise.race([
      second,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
    ]);
    assert.ok(release !== null, "the second take never acquired after the release");
    assert.ok(admissions.includes("take"), "no `take` admission was recorded");
    assert.ok(admissions.includes("wait"), "no `wait` admission while the resource was held");
    await release;
    await other?.();
  } finally {
    rmSync(slotsHome, { recursive: true, force: true });
  }
});

test("a resource declared in configuration becomes a slot bound of that width", async () => {
  const { hostBoundRuleOf, hostBoundsOfASource } =
    await import("../../../../packages/layer-parallel/src/register.ts");
  assert.equal(hostBoundRuleOf("host.resources.keys.capacity"), "resources/keys");
  const { bounds, refusals } = hostBoundsOfASource({ "host.resources.keys.capacity": 1 }, "user");
  assert.deepEqual(refusals, [], "the declared capacity was refused");
  assert.equal(bounds["resources/keys"], 1, "the capacity did not become a bound of width 1");
});

test("an engine run with a resource bound records admissions for the resource rule", async () => {
  const fixture = fixture154();
  const home = process.env.HOME ?? join(tmpdir(), "specstride-host-resources-home");
  try {
    const exit = await new Promise<number>((done) => {
      const child = spawn(process.execPath, [CLI, "run"], {
        cwd: fixture.work,
        env: {
          ...process.env,
          SPECSTRIDE_HOST_LIMITS: "on",
          SPECSTRIDE_HOST_RESOURCES_KEYS: "1",
        },
        stdio: ["ignore", "ignore", "pipe"],
      });
      child.on("close", (code) => done((code ?? 1) as number));
    });
    assert.equal(exit, 0, `the run ended ${String(exit)}`);
    const events = eventsUnderHome(home);
    assert.ok(
      events.some(
        (event) => event.type === "host.slot.admission" && event.data.rule === "resources/keys",
      ),
      "no `host.slot.admission` event for the rule `resources/keys` was recorded",
    );
  } finally {
    fixture.restore();
  }
});
