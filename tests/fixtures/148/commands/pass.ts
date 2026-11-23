#!/usr/bin/env node
// T005 — "pass": writes one line to each stream and exits 0. The command a
// result of `passed: true` is read from (quickstart.md scenario 1).
import process from "node:process";
process.stdout.write("fixture:pass stdout\n");
process.stderr.write("fixture:pass stderr\n");
process.exit(0);
