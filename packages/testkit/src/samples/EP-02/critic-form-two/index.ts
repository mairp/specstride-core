// T071 — the sample stub critic of the SECOND form (`read-only-tools`),
// beside the sample harness of EP-02. It is what a harness adapter of this
// form hands its critic: the stub lists and reads the working tree ITSELF,
// through its own tools, and tries to read each withheld path.
//
// The point the characterization tests of feature 117 hold: the stub sees the
// project and NOT the proposer's files — the notebook, the handoff and the
// outbox are out of the working tree while the call runs (F117-FR-040) — and
// each of the five withheld locations refuses it (F117-FR-042). What it
// reads by itself does not pass the grounding snapshot; that residual risk
// is stated in the record of the call (F117-FR-039).
//
// The stub starts no process, makes no model call and keeps no state. No
// file of a core package names it (F100-FR-012).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** The bounded read of one file, as the stub's tools give it. */
export const STUB_READ_LIMIT = 4096 as const;

/** One file the stub could read from the working tree. */
export type StubRead = {
  /** The path, relative to the working tree root. */
  readonly path: string;
  /** How many bytes the stub read of it (at most `STUB_READ_LIMIT`). */
  readonly bytes: number;
};

/** One attempt to read a withheld path. */
export type StubWithheldAttempt = {
  /** The withheld path, as the record of withheld paths named it. */
  readonly path: string;
  /** True where the stub's read succeeded — it MUST be false for every withheld path. */
  readonly readable: boolean;
};

/** What the stub reports after one call. */
export type StubCriticFormTwoReport = {
  /** The files of the working tree it listed. */
  readonly listed: readonly string[];
  /** What it could read of them. */
  readonly read: readonly StubRead[];
  /** Its attempts on the withheld paths, one per path. */
  readonly withheld: readonly StubWithheldAttempt[];
  /** The paths it was told were withheld. */
  readonly withheldPaths: readonly string[];
};

/** List the working tree below `root`, depth first, sorted. */
function listTree(root: string, prefix: string, out: string[], depth: number): void {
  if (depth > 8 || out.length >= 512) return;
  let names: readonly string[];
  try {
    names = readdirSync(join(root, prefix));
  } catch {
    return;
  }
  for (const name of [...names].sort()) {
    const relative = prefix === "" ? name : `${prefix}/${name}`;
    let isDirectory = false;
    try {
      isDirectory = statSync(join(root, relative)).isDirectory();
    } catch {
      continue;
    }
    if (isDirectory) {
      listTree(root, relative, out, depth + 1);
    } else {
      out.push(relative);
    }
  }
}

/**
 * Run the stub critic of the second form over the working tree at `root`
 * with the withheld paths the record of the call named. It reports what it
 * could read; a withheld path that still answers a read is a FAILURE of the
 * hiding, and the tests read that straight out of the report.
 */
export function stubCriticFormTwo(input: {
  readonly root: string;
  readonly withheldPaths: readonly string[];
}): StubCriticFormTwoReport {
  const listed: string[] = [];
  listTree(input.root, "", listed, 0);
  const read: StubRead[] = [];
  for (const path of listed) {
    try {
      const bytes = readFileSync(join(input.root, path));
      read.push({ path, bytes: Math.min(bytes.byteLength, STUB_READ_LIMIT) });
    } catch {
      /* the read failed: the stub reports only what it could read */
    }
  }
  const withheld: StubWithheldAttempt[] = input.withheldPaths.map((path) => {
    try {
      readFileSync(path);
      return { path, readable: true };
    } catch {
      return { path, readable: false };
    }
  });
  return { listed, read, withheld, withheldPaths: [...input.withheldPaths] };
}
