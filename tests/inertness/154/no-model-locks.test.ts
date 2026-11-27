/**
 * T165 — NO MODEL TAKES OR RELEASES A LOCK, A SLOT OR A HOLD, MERGES
 * CONTENT, OR JUDGES INDEPENDENCE (F154-FR-005).
 *
 * A GUARD test: over every fixture of the feature, with every spec-154
 * switch (eight) ON (the worst case — the most parallel paths the engine can
 * walk), nothing in the model's channel may carry a decision that F154-FR-005
 * reserves for the engine, and every recorded decision of that kind must
 * carry the rule id of its pure table (F154-FR-003), never a session or a
 * model attribution:
 *
 * - the PROMPT channel (the only channel into a model, recorded by the stub
 *   in `prompts.jsonl`): no prompt asks a model to take or release a lock, a
 *   slot or a hold, to merge content, to resolve a conflict, or to judge
 *   whether two units are independent;
 * - the EVENT channel: every `host.slot.admission` and every
 *   `parallel.admission` event carries its table's rule id (`SL-…` slot
 *   bound, `PG-…` independence) and no field naming a session, a model or a
 *   harness role;
 * - the RECORD channel: every slot and hold record under the user state
 *   names a runtime-root owner (host, pid, boot id), never a session id.
 *
 * The invariant also holds with the switches off (the baseline
 * `switches-off.test.ts` covers the whole plane); here it is measured where
 * the feature could disturb it. Run:
 *     node --experimental-strip-types --test tests/inertness/154/no-model-locks.test.ts
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

import { INDEPENDENCE_RULE_IDS } from "../../../packages/layer-parallel/src/independence.ts";
import { fixture154 } from "./helpers.ts";

/** The catalogue's environment names of the spec-154 switches, set to `on`. */
const SWITCHES_ON: readonly string[] = Object.freeze([
  "SPECSTRIDE_LOOP_PHASES_PARALLEL",
  "SPECSTRIDE_LOOP_SPECULATE",
  "SPECSTRIDE_LOOP_PARALLEL_GROUP_UNITS",
  "SPECSTRIDE_LOOP_PARALLEL_GROUP_CHECK",
  "SPECSTRIDE_LOOP_PARALLEL_NO_REPEAT",
  "SPECSTRIDE_LOOP_PARALLEL_MERGE_BASELINE",
  "SPECSTRIDE_HOST_LIMITS",
  "SPECSTRIDE_PIPELINE_STAGE_GROUPS",
]);

/** The fixture directories Phase 1 (T011) wrote under `tests/fixtures/154/`. */
const FIXTURE_DIRS = [
  "plan",
  "groups",
  "slots",
  "stages",
  "phases",
  "spec",
] as const;

/**
 * What no prompt may ask a model to do (F154-FR-005). Each row is a
 * delegation the principle forbids; a hit fails the guard.
 */
const FORBIDDEN_DELEGATIONS: readonly { readonly name: string; readonly re: RegExp }[] =
  Object.freeze([
    { name: "take a lock", re: /\b(take|acquire|grab|hold)\b[^.\n]{0,40}\b(lock|slot)\b/i },
    { name: "release a lock", re: /\b(release|free|give up|let go of)\b[^.\n]{0,40}\b(lock|slot|hold)\b/i },
    { name: "wait on a hold", re: /\b(wait (for|until)\b[^.\n]{0,40}\b(hold|reset|quota window)\b)/i },
    { name: "merge content", re: /\b(merge|rebase|fast-forward)\b[^.\n]{0,60}\b(branch|content|work|tree|change)\b/i },
    { name: "resolve a conflict", re: /\bresolve\b[^.\n]{0,40}\bconflict/i },
    { name: "judge independence", re: /\b(independent|independence)\b[^.\n]{0,80}\?/i },
    { name: "decide a wait", re: /\bshould (we|the run|it)\b[^.\n]{0,40}\b(wait|proceed)\b/i },
  ]);

/** The data fields no admission event may carry (a model is never a decider). */
const FORBIDDEN_EVENT_FIELDS = ["session", "sessionId", "model", "harnessRole", "role"] as const;

/** The data fields no slot or hold owner record may carry. */
const FORBIDDEN_OWNER_FIELDS = ["session", "sessionId", "model", "role"] as const;

/** The owner fields the lock's owner record names (§B.9, F154-FR-044). */
const REQUIRED_OWNER_FIELDS = ["hostName", "pid", "bootId"] as const;

test("T165 over every fixture, every switch on: no prompt, event or record gives a model a lock, a merge or an independence decision", async () => {
  for (const dir of FIXTURE_DIRS) {
    const tasksFile = join(import.meta.dirname, "../../fixtures/154", dir, "tasks.md");
    assert.ok(existsSync(tasksFile), `the fixture ${dir} holds its tasks.md`);
    const f = fixture154();
    const names = [...SWITCHES_ON];
    const before = names.map((n) => process.env[n]);
    try {
      writeFileSync(join(f.work, "specs", "001-one", "tasks.md"), readFileSync(tasksFile, "utf8"));
      for (const name of names) process.env[name] = "on";
      const exit = await f.run();
      assert.equal(exit, 0, `the engine run over ${dir} (switches on) exits 0`);

      // — THE PROMPT CHANNEL: no model is ever asked to do what F154-FR-005
      //   reserves for the engine.
      const calls = f.prompts();
      assert.ok(calls.length >= 1, `${dir}: the run spoke to the stub model at least once`);
      for (const call of calls) {
        for (const delegation of FORBIDDEN_DELEGATIONS) {
          assert.ok(
            !delegation.re.test(call.prompt),
            `${dir}: the ${call.role} prompt was asked to ${delegation.name} — ` +
              `F154-FR-005 forbids it (prompt begins: ${JSON.stringify(call.prompt.slice(0, 80))})`,
          );
        }
      }

      // — THE EVENT CHANNEL: every slot and parallel admission decision is a
      //   rule id of its pure table, never a model verdict.
      const events = f.events();
      for (const event of events) {
        if (event.type === "host.slot.admission") {
          assert.ok(
            typeof event.data["rule"] === "string" && (event.data["rule"] as string).length > 0,
            `${dir}: the host.slot.admission event carries its rule`,
          );
          for (const field of FORBIDDEN_EVENT_FIELDS) {
            assert.ok(
              !(field in event.data),
              `${dir}: the host.slot.admission event carries no ${field} field — ` +
                `the slot is decided by the table, not by a model`,
            );
          }
        }
        if (event.type === "parallel.admission") {
          const verdicts = event.data["verdicts"];
          const checks = Array.isArray(verdicts)
            ? (verdicts as { check?: unknown }[]).map((v) => String(v.check ?? ""))
            : [];
          if (checks.includes("dependency") || event.data["ruleId"] !== undefined) {
            assert.ok(
              INDEPENDENCE_RULE_IDS.includes(event.data["ruleId"] as never),
              `${dir}: the parallel.admission event's ruleId ${String(event.data["ruleId"])} ` +
                `is a rule of the independence table (one of ${INDEPENDENCE_RULE_IDS.join(", ")})`,
            );
          }
          for (const field of FORBIDDEN_EVENT_FIELDS) {
            assert.ok(
              !(field in event.data),
              `${dir}: the parallel.admission event carries no ${field} field — ` +
                `independence is judged by the table, not by a model`,
            );
          }
        }
      }

      // — THE RECORD CHANNEL: every slot and hold record names a runtime-root
      //   owner (host, pid, boot id), never a session. The bound is `host.limits`
      //   ON, so the directories may exist; where a record exists it must be clean.
      for (const kind of ["slots", "holds"]) {
        const root = join(f.home, kind);
        if (!existsSync(root)) continue;
        for (const entry of readdirSync(root)) {
          const files = readdirSync(join(root, entry)).filter((name) => name.endsWith(".json"));
          for (const file of files) {
            const record = JSON.parse(readFileSync(join(root, entry, file), "utf8")) as {
              owner?: Record<string, unknown>;
            };
            const owner = record.owner;
            assert.ok(owner !== undefined, `${dir}: ${kind}/${entry}/${file} names an owner`);
            for (const field of REQUIRED_OWNER_FIELDS) {
              assert.ok(
                field in owner,
                `${dir}: ${kind}/${entry}/${file}'s owner names its ${field}`,
              );
            }
            for (const field of FORBIDDEN_OWNER_FIELDS) {
              assert.ok(
                !(field in owner),
                `${dir}: ${kind}/${entry}/${file}'s owner carries no ${field} — ` +
                  `the holder is a runtime root, never a model session (F154-FR-005)`,
              );
            }
          }
        }
      }
    } finally {
      for (const [index, name] of names.entries()) {
        const old = before[index];
        if (old === undefined) delete process.env[name];
        else process.env[name] = old;
      }
      f.restore();
    }
  }
});
