#!/usr/bin/env node
// T005 — "slow": runs for FIXTURE_SLEEP_MS (default 3000) and then exits 0.
// It finishes on its own, so a time limit ABOVE it gives a pass and a time
// limit BELOW it gives the time-limit result: the same command proves both
// sides (F148-FR-004; quickstart.md scenario 1).
//
// It prints a line before and after the wait, so a caller sees how far it got
// when the runner ended it.
import process from "node:process";

const value = Number(process.env["FIXTURE_SLEEP_MS"]);
const ms = Number.isFinite(value) && value >= 0 ? value : 3000;
process.stdout.write(`fixture:slow waiting ${ms}ms\n`);
setTimeout(() => {
  process.stdout.write("fixture:slow done\n");
  process.exit(0);
}, ms);
