/**
 * T002 — the 11 schemas of spec 154 (F154-FR-007, F154-FR-002):
 * every schema of `packages/contracts/schemas/154/` (the byte-for-byte copy
 * of `specs/154-concurrency-and-parallelism/contracts/schemas/`, T001)
 * parses, declares draft 2020-12, carries a `$id` of the form
 * `specstride.<name>/1`, sets `additionalProperties: false` on the record,
 * and names no exit code, stop reason, run state or attempt kind of the
 * engine's closed vocabularies (annex E; closed-sets.json set 9).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const SCHEMA_DIR = join(import.meta.dirname, "../schemas/154");
const DATA_DIR = join(import.meta.dirname, "../data");

const FILENAMES = [
  "host-hold.schema.json",
  "host-slot.schema.json",
  "landing.schema.json",
  "merge-baseline.schema.json",
  "phase-queue.schema.json",
  "plan-lines.schema.json",
  "report-rows-154.schema.json",
  "set-aside.schema.json",
  "stage-workspace.schema.json",
  "trial.schema.json",
  "worker-check.schema.json",
];

/** Two domain vocabularies of the feature itself share a word with annex E's
 * run states; each is its own closed set, proposed under CQ-154-09, and is
 * required by its spec row. They are not the engine's run state. */
const DOCUMENTED_EXCEPTIONS: Record<string, string[]> = {
  // F154-FR-049: the state of a stage workspace is `running`, `landed`, `parked`.
  "stage-workspace.schema.json": ["running"],
  // F154-FR-035: the outcome of a worker check is `passed`, `failed`,
  // `tainted`, `unchecked`.
  "worker-check.schema.json": ["failed"],
};

function schemasOf(): Map<string, any> {
  const map = new Map<string, any>();
  for (const name of FILENAMES) {
    map.set(name, JSON.parse(readFileSync(join(SCHEMA_DIR, name), "utf8")));
  }
  return map;
}

/** Every string enum and const value declared anywhere in a schema. */
function enumAndConstValues(schema: any, acc: Set<string> = new Set()): Set<string> {
  if (Array.isArray(schema)) {
    for (const item of schema) enumAndConstValues(item, acc);
  } else if (schema !== null && typeof schema === "object") {
    if (Array.isArray(schema["enum"])) {
      for (const value of schema["enum"]) {
        if (typeof value === "string") acc.add(value);
      }
    }
    if (typeof schema["const"] === "string") acc.add(schema["const"]);
    for (const value of Object.values(schema)) enumAndConstValues(value, acc);
  }
  return acc;
}

/** Every property name declared anywhere in a schema. */
function propertyNames(schema: any, acc: Set<string> = new Set()): Set<string> {
  if (Array.isArray(schema)) {
    for (const item of schema) propertyNames(item, acc);
  } else if (schema !== null && typeof schema === "object") {
    if (schema["properties"] !== null && typeof schema["properties"] === "object") {
      for (const name of Object.keys(schema["properties"])) acc.add(name);
    }
    for (const value of Object.values(schema)) propertyNames(value, acc);
  }
  return acc;
}

function stopReasonLiterals(): string[] {
  const data = JSON.parse(readFileSync(join(DATA_DIR, "stop-reasons.json"), "utf8")) as {
    stopReasons: Array<{ literal: string }>;
  };
  return data.stopReasons.map((row) => row.literal);
}

function runStateLiterals(): string[] {
  const data = JSON.parse(readFileSync(join(DATA_DIR, "run-state-machine.json"), "utf8")) as {
    states: Array<Record<string, string>>;
  };
  const literals: string[] = [];
  for (const state of data.states) {
    for (const value of Object.values(state)) {
      if (typeof value === "string" && value.startsWith("`")) {
        literals.push(value.replace(/`/g, "").split(" ")[0]);
      }
    }
  }
  return literals;
}

function attemptKindLiterals(): string[] {
  const data = JSON.parse(readFileSync(join(DATA_DIR, "closed-sets.json"), "utf8")) as {
    closedSets: Array<{ name?: string; literals?: string[] }>;
  };
  const row = data.closedSets.find((set) => set.name === "Kinds of phase attempt");
  assert.ok(row, "closed-sets.json holds the set `Kinds of phase attempt`");
  return row.literals ?? [];
}

function exitCodes(): number[] {
  const data = JSON.parse(readFileSync(join(DATA_DIR, "exit-codes.json"), "utf8")) as {
    engine: Array<{ rows: Array<{ Code: string }> }>;
  };
  const codes: number[] = [];
  for (const process of data.engine) {
    for (const row of process.rows) codes.push(Number(row.Code));
  }
  return codes;
}

test("T001: the directory holds exactly the 11 schemas of the contract (F154-FR-007)", () => {
  const files = readdirSync(SCHEMA_DIR).filter((name) => name.endsWith(".json")).sort();
  assert.deepEqual(files, [...FILENAMES].sort());
});

test("every schema declares draft 2020-12 (F154-FR-007)", () => {
  for (const [name, schema] of schemasOf()) {
    assert.equal(
      schema["$schema"],
      "https://json-schema.org/draft/2020-12/schema",
      `${name}: $schema is not draft 2020-12`,
    );
  }
});

test("every schema carries a $id of the form specstride.<name>/1 (F154-FR-007)", () => {
  for (const [name, schema] of schemasOf()) {
    const id = schema["$id"] as string | undefined;
    assert.match(id ?? "", /^specstride\.[a-z0-9-]+\/1$/, `${name}: bad $id`);
    const expected = `specstride.${name.replace(/\.schema\.json$/, "")}/1`;
    assert.equal(id, expected, `${name}: the $id does not match the file name`);
  }
});

test("every schema sets additionalProperties: false on the record (F154-FR-007)", () => {
  for (const [name, schema] of schemasOf()) {
    assert.equal(schema["type"], "object", `${name}: the record is not an object`);
    assert.equal(
      schema["additionalProperties"],
      false,
      `${name}: additionalProperties is not false`,
    );
  }
});

test("no schema names an exit code, stop reason, run state or attempt kind (F154-FR-002)", () => {
  const stop = new Set(stopReasonLiterals());
  const runStates = new Set(runStateLiterals());
  const attemptKinds = new Set(attemptKindLiterals());
  const codes = new Set(exitCodes());
  const forbiddenPropertyNames = new Set([
    // The engine's interface exit code, stop reason, run state and attempt
    // kind are closed vocabularies (annex E; F154-FR-002). A property that
    // carries one of those *names* would add a member or a state.
    // `exitCode` as the process exit status of a check *command* is not a
    // member of annex E's interface exit codes (it is what a check result
    // already records, F115), so it is not forbidden here; only an
    // enum/const drawn from annex E's codes is (checked below).
    "engineExit",
    "stopReason",
    "stop_reason",
    "runState",
    "run_state",
    "attemptKind",
    "attempt_kind",
  ]);
  for (const [name, schema] of schemasOf()) {
    const exceptions = DOCUMENTED_EXCEPTIONS[name] ?? [];
    for (const value of enumAndConstValues(schema)) {
      assert.ok(
        !stop.has(value),
        `${name}: the enum/const value ${value} is a stop reason of annex E`,
      );
      if (!exceptions.includes(value)) {
        assert.ok(
          !runStates.has(value),
          `${name}: the enum/const value ${value} is a run state of annex E`,
        );
      }
      assert.ok(
        !attemptKinds.has(value),
        `${name}: the enum/const value ${value} is a kind of phase attempt of closed set 9`,
      );
    }
    for (const propertyName of propertyNames(schema)) {
      assert.ok(
        !forbiddenPropertyNames.has(propertyName),
        `${name}: the property ${propertyName} names a closed vocabulary of annex E`,
      );
    }
    for (const value of enumAndConstValues(schema)) {
      if (/^\d+$/.test(value)) {
        assert.ok(!codes.has(Number(value)), `${name}: the value ${value} is an exit code`);
      }
    }
  }
});
