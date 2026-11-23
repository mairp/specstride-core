// T005 — the eight scripted commands of feature 148 by absolute path, so a
// test names a command once and the paths cannot drift from the files. See
// README.md for what each one does.
//
// Every component of the product is TypeScript (F100-FR-030), so a scripted
// command is a .ts file too; Node runs it directly.
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** The directory of the scripted commands. */
export const COMMANDS_DIR = dirname(fileURLToPath(import.meta.url));

/** The absolute path of one scripted command, by the name of the task. */
export const COMMANDS = Object.freeze({
  pass: join(COMMANDS_DIR, "pass.ts"),
  failAtStep: join(COMMANDS_DIR, "fail-at-step.ts"),
  slow: join(COMMANDS_DIR, "slow.ts"),
  neverEnding: join(COMMANDS_DIR, "never-ending.ts"),
  largeOutput: join(COMMANDS_DIR, "large-output.ts"),
  printEnvironment: join(COMMANDS_DIR, "print-environment.ts"),
  writeUndeclaredFile: join(COMMANDS_DIR, "write-undeclared-file.ts"),
  changeProtectedFile: join(COMMANDS_DIR, "change-protected-file.ts"),
});
