/**
 * T367 — the handler of `scan`, the in-pass commit scan command (feature
 * 153, F153-FR-027; CQ-153-17 answered A on 2026-11-13: the name is `scan`,
 * the codes are 0 no hit, 2 at least one hit, 1 no state, 3 usage).
 *
 * The command reads ONLY the rule data pinned at launch — the engine's
 * commit-gate rules (`loadEngineCommitGateRules`, the same data whose hash
 * the engine records at launch, T077) — and never accepts another rule set
 * or a path to one: every argument is a usage error (F153-FR-027).
 *
 * The scan itself is `commitScanOf` of core (F153-FR-026): ONE typed unit,
 * the same unit the engine's pre-critic step and commit-time step read,
 * over the candidate change of the tree the call runs in (the same change
 * set the approval branch names: `git diff --name-only -z HEAD` plus
 * `ls-files --others --exclude-standard -z`). Each hit is rendered as the
 * rule id, the rule's reason, the file through `quotedPath` (escaped,
 * capped at 160 characters, `[REDACTED-PATH]` where the redactor would
 * change it — F152-FR-010, -011) and the line, and carries no matched text
 * and no file content.
 *
 * The result is ADVICE (F153-FR-027): the command writes nothing, enters no
 * verification gate, no approval record, no critic-class input and no
 * count; its absence or failure changes nothing in the loop.
 */

import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import type { RoutedCall } from "../router/route.ts";
import { commitScanOf } from "../../../core/src/commit-scan/scan.ts";
import { quotedPath } from "../../../core/src/gate/feedback.ts";
import {
  blockingRuleOf,
  hashOfCommitGateRules,
  loadEngineCommitGateRules,
  type CommitGateRules,
} from "../../../kernel/src/redactor/commit-gate-rules.ts";
import { createIngress } from "../../../observability/src/ingress/ingress.ts";
import { addedLinesAgainstHead, isAddedLine } from "../engine/commit-lines.ts";

/** The exit of a call with no state to scan from (CQ-153-17 A). */
export const SCAN_NO_STATE_EXIT = 1 as const;

/** The exit of at least one hit (CQ-153-17 A). */
export const SCAN_HIT_EXIT = 2 as const;

/** The exit of a usage error — any argument at all (CQ-153-17 A, F153-FR-027). */
export const SCAN_USAGE_EXIT = 3 as const;

/** One git call of the command, output captured, nothing written. */
function git(workdir: string, argv: readonly string[]): { ok: boolean; out: string } {
  const result = spawnSync("git", ["-C", workdir, ...argv], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return { ok: (result.status ?? 1) === 0, out: result.stdout ?? "" };
}

/** The candidate change of the tree, named exactly as the approval branch names it. */
export function candidateChangeOf(workdir: string): { ok: boolean; files: readonly string[] } {
  const inside = git(workdir, ["rev-parse", "--is-inside-work-tree"]);
  if (!inside.ok) return { ok: false, files: [] };
  const files = [
    ...git(workdir, ["diff", "--name-only", "-z", "HEAD"]).out.split("\0"),
    ...git(workdir, ["ls-files", "--others", "--exclude-standard", "-z"]).out.split("\0"),
  ].filter((name) => name !== "");
  return { ok: true, files };
}

/** The reason a rule of the pinned data gives, or the empty string. */
function reasonOfTheRule(rules: CommitGateRules, rule: string): string {
  return rules.rules.find((candidate) => candidate.rule === rule)?.reason ?? "";
}

/**
 * T367 — the handler of `scan`. Returns the code of T363 and writes no
 * file (F129-FR-015, F153-FR-027).
 */
export async function commitScanHandler(call: RoutedCall): Promise<number> {
  // F153-FR-027 — no other rule set, no path to one, no argument at all.
  if (call.extras.length > 0) {
    call.io.err(
      `specstride scan: takes no arguments; it reads only the rule data pinned at launch ` +
        `(F153-FR-027)\n`,
    );
    return SCAN_USAGE_EXIT;
  }
  const rules = loadEngineCommitGateRules();
  const change = candidateChangeOf(call.workdir);
  if (!change.ok) {
    call.io.err(
      `specstride scan: no state to scan from — the working directory is not inside a git ` +
        `work tree\n`,
    );
    return SCAN_NO_STATE_EXIT;
  }
  // The pinned rule data, named by the hash the launch records (T077).
  const ruleDataHash = hashOfCommitGateRules(rules, null);
  const scan = commitScanOf(
    { files: change.files },
    {
      exists: (file) => existsSync(join(call.workdir, file)),
      scan: (present) => createIngress().scanCommit(present, call.workdir),
      addedLines: (present) => addedLinesAgainstHead(call.workdir, present),
      lineIsAdded: isAddedLine,
    },
  );
  call.io.out(`rules ${ruleDataHash} (pinned at launch)\n`);
  if (change.files.length === 0) {
    call.io.out("no candidate change\n");
    return 0;
  }
  // Each hit names the rule (a NAME of versioned data, never its text) —
  // the same mapping the engine performs (T024, fail closed), the kind read
  // off the fields the scan port sets, exactly as `kindOf` of the gate reads
  // it (packages/core/src/post-approval/commit-gate.ts).
  for (const hit of scan.hits) {
    const matched =
      hit.unreadable === true || hit.line === 0
        ? ("unreadable" as const)
        : hit.registeredSecret === true
          ? ("registered-secret" as const)
          : ("pattern" as const);
    const rule = blockingRuleOf(
      matched === "pattern" ? { matched, pattern: hit.pattern ?? "" } : { matched },
      rules,
    );
    const line = hit.line <= 0 ? "line unknown" : `line ${String(hit.line)}`;
    call.io.out(
      `${rule ?? "cg-unmatched-hit"} (${reasonOfTheRule(rules, rule ?? "cg-unmatched-hit")}) ` +
        `${quotedPath(hit.file)} ${line}\n`,
    );
  }
  return scan.hits.length > 0 ? SCAN_HIT_EXIT : 0;
}
