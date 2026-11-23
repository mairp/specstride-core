#!/usr/bin/env node
// Fake hung check for the loop-speed fixtures (spec 153, task T004).
// Forks a grandchild that ignores SIGTERM and keeps both output pipes open,
// writes this process's pid and the grandchild's pid (two lines) to the file
// named by the first argument, then never exits. The time-limit tests kill
// the process group and assert both pids are gone.
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const pidFile = process.argv[2];
const grandchild = spawn(
  process.execPath,
  [
    "-e",
    `
process.on("SIGTERM", () => {});
setInterval(() => { process.stdout.write("."); process.stderr.write("."); }, 250);
`,
  ],
  { stdio: ["ignore", "inherit", "inherit"] },
);
grandchild.unref();
if (pidFile) writeFileSync(pidFile, `${process.pid}\n${grandchild.pid}\n`);
setInterval(() => {}, 60_000);
