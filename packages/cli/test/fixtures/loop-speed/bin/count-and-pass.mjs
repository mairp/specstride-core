#!/usr/bin/env node
// Fake passing check for the loop-speed fixtures (spec 153, task T006).
// Appends one line to the file named by the first argument and exits 0.
// The tests count executions by the lines of that file.
import { appendFileSync } from "node:fs";

if (process.argv[2]) appendFileSync(process.argv[2], `${new Date().toISOString()}\n`);
process.exit(0);
