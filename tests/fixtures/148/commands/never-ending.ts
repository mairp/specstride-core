#!/usr/bin/env node
// T005 — "never ending": never exits by itself. It prints one line, then holds
// an unresolved timer that is rearmed forever, so only the time limit of the
// runner or `cancel` ends it (F148-FR-004, F148-FR-003 `interrupted`;
// quickstart.md scenario 1).
//
// It ignores no signal: a signal to the process group ends it, which is what
// the runner's `cancel` sends (`research.md` D-10). A test that starts it MUST
// end it.
import process from "node:process";
process.stdout.write("fixture:never-ending started\n");
const hold = () => setTimeout(hold, 3_600_000);
hold();
