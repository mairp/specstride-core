#!/usr/bin/env node
// T005 — "changes a protected file": appends one line to a file of the
// protected set WHILE the check runs, then exits 0. The command of quickstart.md
// scenario 4: the two fingerprint readings around it differ, so the result is
// `tainted` with the reason `changed-during-check` and is not a pass
// (F148-FR-006).
//
// The file is FIXTURE_PROTECTED_PATH; without it the command refuses to run
// rather than guess which file is protected, because a fixture that changed
// the wrong file would make a taint that proves nothing. It appends, so the
// file keeps its earlier content and the difference is the appended line.
import process from "node:process";
import { appendFileSync, existsSync } from "node:fs";

const path = process.env["FIXTURE_PROTECTED_PATH"];
if (path === undefined || path === "") {
  process.stderr.write("fixture:change-protected-file needs FIXTURE_PROTECTED_PATH\n");
  process.exit(64);
}
if (!existsSync(path)) {
  process.stderr.write(`fixture:change-protected-file: ${path} does not exist\n`);
  process.exit(65);
}
appendFileSync(path, "changed by fixture:change-protected-file\n", "utf8");
process.stdout.write(`fixture:change-protected-file changed ${path}\n`);
process.exit(0);
