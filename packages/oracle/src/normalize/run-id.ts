/**
 * T052 — rule N-03, the run id (F141-FR-020).
 *
 * "The as-is run id becomes a numbered placeholder, numbered by first appearance."
 *
 * Numbered and not named: a scenario of two commands (run, then resume) has two
 * run ids, and which id is the first and which the second IS a behaviour both
 * sides are compared on. Numbering by first appearance keeps that and drops the
 * value.
 *
 * The form of the as-is run id is read off the reference: the Specstride baseline
 * writes `<date>-<time>-<pid>` (`20261001-193117-3472195`), and
 * mixture-of-loops a `run-<n>` under its artifact directory. Both forms are
 * matched; a value that is no run id is left alone, so the count of this rule is
 * the number of run ids replaced and nothing else.
 */
import { numberer, replaceInSurfaces } from "./walk.ts";
import type { MutableCapture, Rule } from "./types.ts";

/** The forms of an as-is run id. */
export const RUN_ID_PATTERNS: readonly RegExp[] = Object.freeze([
  // The Specstride baseline: <YYYYMMDD>-<HHMMSS>-<pid>.
  /\b\d{8}-\d{6}-\d{1,9}\b/g,
  // mixture-of-loops: the run directory of the launcher, named by its own id.
  /\brun-[0-9a-f]{6,}\b/g,
  // The learning engine of the Specstride baseline names the run of one decision
  // `learn-<12 hex>` (`lib/learn.py`, `_new_run_id`). It is the identity of the
  // decision in the append-only log and in the `knob_adjusted` event, it is made
  // fresh on every call, and the port will make its own: a run id, by N-03.
  /\blearn-[0-9a-f]{12}\b/g,
  // The invocation id of the Specstride baseline, in the form it takes when NO
  // base was handed in: `inv-<iteration:06d>-<secrets.token_hex(4)>`
  // (`proposer.sh:1650` and `lib/invocation_result.py:107` at `9cab15d`). The
  // front-door script of the baseline always hands a base in (its line 1839,
  // `--invocation-id <run-id>-<role>-phase-<n>-attempt-<a>`),
  // so this form is reached only by a scenario that drives the pass loop
  // directly — and there it is made with `secrets.token_hex`, fresh on every
  // call, which the port will also make its own way: a run id, by N-03, as
  // `learn-<12 hex>` above is. The iteration it carries is NOT lost with it: the
  // invocation directory is `…/iter-<iter>/<invocation id>`, so the iteration is
  // still a compared segment of the same path.
  /\binv-\d{6}-[0-9a-f]{8}\b/g,
]);

/** N-03. */
export const N03: Rule = {
  id: "N-03",
  subject: "Run id",
  surfaces: [],
  apply(capture: MutableCapture): number {
    const number = numberer("run-id");
    return replaceInSurfaces(capture.surfaces, [], (value) => {
      let text = value;
      for (const pattern of RUN_ID_PATTERNS) {
        text = text.replace(new RegExp(pattern.source, "g"), (found) => number(found));
      }
      return text;
    });
  },
};
