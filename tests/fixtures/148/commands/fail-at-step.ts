#!/usr/bin/env node
// T005 — "fail at step n": a command of STEPS steps (default 40) whose step
// FAIL_AT (default 35) fails. Every step prints `step <i> ok` or
// `step <i> failed`; the command stops at the first failed step and exits with
// its number, so a caller can tell WHICH step failed from the exit result
// alone (quickstart.md scenario 7; F148-FR-008, F148-FR-009).
//
// `--from <n>` starts at step n instead of step 1: the resumed run, which is
// `partial` because it did not start at the first step (F148-FR-009).
import process from "node:process";

const number = (name: string, fallback: number): number => {
  const value = process.env[name];
  const parsed = value === undefined ? NaN : Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const steps = number("FIXTURE_STEPS", 40);
const failAt = number("FIXTURE_FAIL_AT", 35);
const flag = process.argv.indexOf("--from");
const fromArg = flag >= 0 ? Number(process.argv[flag + 1]) : NaN;
const from = Number.isInteger(fromArg) && fromArg > 0 ? fromArg : 1;

process.stdout.write(`steps ${steps} from ${from}\n`);
for (let i = from; i <= steps; i++) {
  if (i === failAt) {
    process.stdout.write(`step ${i} failed\n`);
    process.stderr.write(`fixture:fail-at-step required step ${i} failed\n`);
    process.exit(i);
  }
  process.stdout.write(`step ${i} ok\n`);
}
process.exit(0);
