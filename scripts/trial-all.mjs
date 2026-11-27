#!/usr/bin/env node
/**
 * T169 — the trial of EVERY new switch of feature 154, one run of
 * `scripts/trial.mjs` per switch (F154-FR-001, -018; CQ-154-15 A).
 *
 *   node scripts/trial-all.mjs
 *
 * The eight new switches are the rows of the parity-register proposal,
 * row 8 of `specs/154-concurrency-and-parallelism/contracts/
 * closed-set-deltas.md`, minus `loop.parallel.units` — that one is feature
 * 142's own switch, which this feature's behaviours ride, and it was never a
 * new switch of 154. Each run passes trial.mjs exactly its two arguments:
 * the switch name and the fixture file. Every run writes its record to
 * `specs/154-concurrency-and-parallelism/trials/<switch>.json`, the name
 * trial.mjs itself chooses, and the record is read by the owner before any
 * register row turns the switch on — no run of this script turns anything on
 * (F154-FR-008: no saving is stated anywhere).
 *
 * One failing switch does not stop the others: the script reports every
 * exit code and exits non-zero if any trial failed, so the owner sees the
 * full picture in one pass.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const TRIAL = join(REPO, "scripts", "trial.mjs");
const FIXTURES = join(REPO, "specs/154-concurrency-and-parallelism/contracts/fixtures-154.json");
const TRIALS_DIR = join(REPO, "specs/154-concurrency-and-parallelism/trials");

/**
 * The eight new switches of feature 154, in the order row 8 of
 * `closed-set-deltas.md` names them (`loop.parallel.units` is 142's own and
 * is not a switch of this feature). The list is the catalogue's rows for
 * 154; no name here is guessed.
 */
export const SWITCHES_154 = Object.freeze([
  "loop.parallel.noRepeat",
  "loop.parallel.mergeBaseline",
  "loop.parallel.groupUnits",
  "loop.parallel.groupCheck",
  "host.limits",
  "pipeline.stageGroups",
  "loop.phases.parallel",
  "loop.speculate",
]);

let failed = 0;
for (const name of SWITCHES_154) {
  process.stdout.write(`trial-all: switch ${name}\n`);
  const run = spawnSync(process.execPath, [TRIAL, "--switch", name, "--fixtures", FIXTURES], {
    cwd: REPO,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (run.stdout) process.stdout.write(run.stdout);
  if (run.stderr) process.stderr.write(run.stderr);
  const record = join(TRIALS_DIR, `${name}.json`);
  const wrote = existsSync(record) ? JSON.parse(readFileSync(record, "utf8")) : null;
  const pass = run.status === 0 && wrote?.pass === true && wrote?.switch === name;
  process.stdout.write(
    `trial-all: ${name} -> exit ${run.status}, record ${
      wrote === null ? "MISSING" : `pass=${wrote.pass}`
    }\n`,
  );
  if (!pass) failed += 1;
}
process.stdout.write(
  `trial-all: ${SWITCHES_154.length - failed} of ${SWITCHES_154.length} trials passed\n`,
);
process.exitCode = failed === 0 ? 0 : 1;
