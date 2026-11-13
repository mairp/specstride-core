#!/usr/bin/env node
// Fake output planter for the loop-speed fixtures (spec 153, task T005).
// Prints the text of the file named by the first argument to standard output
// AND to standard error, then exits 1. The tests plant secrets and
// instruction lines in that file and assert they are redacted or fenced.
import { readFileSync } from "node:fs";

const text = readFileSync(process.argv[2], "utf8");
process.stdout.write(text);
process.stderr.write(text);
process.exit(1);
