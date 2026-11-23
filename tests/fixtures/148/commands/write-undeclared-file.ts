#!/usr/bin/env node
// T005 — "writes an undeclared file": creates a file inside its working
// directory that the check manifest does not declare as a write, then exits 0.
// A command whose declared writes do not cover what it wrote is what the
// fingerprint bracket is for: the second reading differs outside the declared
// writes, which gives `tainted` (F148-FR-006, F148-FR-014; quickstart.md
// scenario 6).
//
// The path is FIXTURE_UNDECLARED_PATH, relative to the working directory, and
// defaults to `undeclared.txt`. It is printed, so the caller knows what to
// look for without agreeing on the default.
import process from "node:process";
import { writeFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";

const relative = process.env["FIXTURE_UNDECLARED_PATH"] ?? "undeclared.txt";
if (isAbsolute(relative)) {
  process.stderr.write("fixture:write-undeclared-file refuses an absolute path\n");
  process.exit(64);
}
const path = join(process.cwd(), relative);
writeFileSync(path, "written by fixture:write-undeclared-file\n", "utf8");
process.stdout.write(`fixture:write-undeclared-file wrote ${relative}\n`);
process.exit(0);
