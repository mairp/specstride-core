/**
 * THE TEMPORARY ROOT OF ONE RUN (F154-FR-043, T023): the one directory a
 * run makes for its own temporary files, under the system temporary area,
 * and its removal. The removal NEVER throws — a root that is already gone
 * (a stop removed it, a previous attempt removed it, the path is dead) is
 * the removal's success, not its error, because a run that ends, FOR ANY
 * CAUSE, must not fail while it tidies (F154-FR-043; F154-FR-004's
 * degrade-don't-fail reading of the same rule).
 */

import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** The prefix every run's temporary root carries, so a leftover names its maker. */
export const TEMP_ROOT_PREFIX = "specstride-run-";

/**
 * Make the temporary root of one run: a fresh `mkdtemp` directory under the
 * system temporary area, prefixed `specstride-run-`. Two calls never return
 * the same path (the kernel's `mkdtemp` guarantees the suffix), which is
 * what lets two runs of the same workspace work side by side (F154-FR-043;
 * fixture `tests/fixtures/154/groups`, two runs, two roots).
 */
export function makeTempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), TEMP_ROOT_PREFIX));
  // mkdtemp made the directory; the mkdir is the reading that proves it
  // stands, so a caller that hands the path to a child sees no surprise.
  mkdirSync(root, { recursive: true });
  return root;
}

/**
 * Remove a temporary root. Never throws (F154-FR-043): a path that does not
 * exist, or that cannot be removed where the run stands, is ignored — the
 * run ends all the same, and the leftover is a host's to sweep.
 */
export function removeTempRoot(path: string): void {
  try {
    rmSync(path, { recursive: true, force: true });
  } catch {
    // Never throws: a dead path, or one another holder still keeps, is
    // ignored. F154-FR-043 — the root is removed where the run ends for
    // any cause, and the removal must not turn an ending into an error.
  }
}
