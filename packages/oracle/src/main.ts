/**
 * T023, T024 — the command of the oracle that this phase delivers:
 * `npm run oracle -- <command>`.
 *
 * This is NOT the tier runner. `npm run oracle -- --tier hermetic`, `fetch`,
 * `run`, `probe` and the release check are `src/cli.ts`, which a later phase
 * builds; `package.json` holds the scaffolding marker `skeleton` until that file
 * exists, because that is what another feature reads to mean "the oracle cannot
 * run a comparison yet" (`tests/parity/100/oracle.ts`,
 * `packages/testkit/src/static/no-listener.ts`,
 * `tests/characterization/149/README.md`), and that is still true: there is no
 * reference tree, no fixture and no comparator. What IS true after this phase is
 * that a feature can CITE the oracle and have its declarations checked, and
 * these three commands are that:
 *
 * | Command | What it does | Exit |
 * |---|---|---|
 * | `check-declarations` | The sweep of F141-FR-027 and F141-FR-028 over the `tasks.md` of every feature and the tests under `tests/parity/` | 1 on a refusal in a path the oracle owns; with `--strict` also on an external finding |
 * | `check-citing` | Compares `CITING.md` with what `data/` gives now | 1 when they differ |
 * | `write-citing` | Writes `CITING.md` from `data/` | 0 |
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { CITING_PAGE, renderCiting } from "./catalogue/citing.ts";
import { checkDeclarations, exitCodeOf, reportLines } from "./catalogue/declarations.ts";

/** The root of the package, `packages/oracle/`. */
const PACKAGE_ROOT = resolve(dirname(dirname(fileURLToPath(import.meta.url))));
/** The root of the repository, two levels above the package. */
const REPOSITORY_ROOT = resolve(dirname(dirname(PACKAGE_ROOT)));

/** The file the citing page lies in. */
export const CITING_FILE = join(PACKAGE_ROOT, CITING_PAGE);

/** The commands this phase delivers. */
export const COMMANDS = ["check-declarations", "check-citing", "write-citing"] as const;
export type Command = (typeof COMMANDS)[number];

/** What one command did, for a caller that wants it without a process exit. */
export type Outcome = { readonly code: number; readonly lines: readonly string[] };

/** F141-FR-027, F141-FR-028 — the declaration check. */
export function runCheckDeclarations(root: string, strict: boolean): Outcome {
  const report = checkDeclarations({ root });
  return { code: exitCodeOf(report, strict), lines: reportLines(report, strict) };
}

/** T024 — `CITING.md` against the data files. */
export function runCheckCiting(file: string = CITING_FILE): Outcome {
  const wanted = renderCiting();
  let onDisk: string;
  try {
    onDisk = readFileSync(file, "utf8");
  } catch {
    return {
      code: 1,
      lines: [`citing page: ${file} is missing; run \`npm run oracle -- write-citing\``],
    };
  }
  if (onDisk === wanted) {
    return { code: 0, lines: [`citing page: ${file} agrees with packages/oracle/data/`] };
  }
  const wantedLines = wanted.split("\n");
  const diskLines = onDisk.split("\n");
  const first = wantedLines.findIndex((line, index) => diskLines[index] !== line);
  return {
    code: 1,
    lines: [
      `citing page: ${file} and packages/oracle/data/ differ`,
      `  first difference at line ${first + 1}`,
      `  on disk:   ${diskLines[first] ?? "(end of file)"}`,
      `  from data: ${wantedLines[first] ?? "(end of file)"}`,
      "  run `npm run oracle -- write-citing`",
    ],
  };
}

/** T024 — write the page from the data files. */
export function runWriteCiting(file: string = CITING_FILE): Outcome {
  const page = renderCiting();
  writeFileSync(file, page);
  return { code: 0, lines: [`citing page: wrote ${file} (${page.split("\n").length} lines)`] };
}

/** Run one command. Gives the exit code and the lines to print. */
export function run(argv: readonly string[], root: string = REPOSITORY_ROOT): Outcome {
  const strict = argv.includes("--strict");
  const command = argv.find((a) => !a.startsWith("-"));
  switch (command) {
    case "check-declarations":
      return runCheckDeclarations(root, strict);
    case "check-citing":
      return runCheckCiting();
    case "write-citing":
      return runWriteCiting();
    default:
      return {
        code: 2,
        lines: [
          command === undefined
            ? "oracle: no command given"
            : `oracle: \`${command}\` is no command of this phase`,
          `  commands: ${COMMANDS.join(", ")}`,
          "  the tier runner (`--tier hermetic`, `fetch`, `run`, `probe`) is built by a later phase",
        ],
      };
  }
}

// Run only when this file is the entry point, so a test can import it.
if (
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))
) {
  const outcome = run(process.argv.slice(2));
  for (const line of outcome.lines) process.stdout.write(`${line}\n`);
  process.exit(outcome.code);
}
