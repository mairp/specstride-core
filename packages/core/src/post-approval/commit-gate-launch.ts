/**
 * The rule data of the commit gate at a launch (F152-FR-016, F152-FR-017,
 * F152-FR-018; plan, "Rule data").
 *
 * The engine's rules and — where the project added one — the project's
 * `specstride.commit-gate.json` are loaded, merged and hashed ONCE, before
 * any work starts. A malformed file, a project rule that exempts or shadows
 * an engine id, refuses the launch with exit 3 and names the file. The hash
 * pins the data in the run (`commitGateRulesHash`) and is watched at every
 * pass start: a change mid-run halts as a changed source (`source-changed`,
 * exit 3, CQ-152-06 A).
 */
import { join } from "node:path";
import {
  CommitGateRulesError,
  ENGINE_COMMIT_GATE_RULES_FILE,
  PROJECT_COMMIT_GATE_RULES_FILE_NAME,
  hashOfCommitGateRules,
  loadEngineCommitGateRules,
  loadProjectCommitGateRules,
  mergeCommitGateRules,
  parseCommitGateRules,
  type CommitGateRules,
} from "@specstride/kernel/redactor/commit-gate-rules";

/** The requirement this module carries out. */
export const REQUIREMENT = "F152-FR-016" as const;

/** A refused launch exits 3 (CQ-152-06 A; the refusal of annex E §E.2). */
export const REFUSAL_EXIT_CODE = 3 as const;

/** What the launch loads, or the refusal of the launch. */
export type CommitGateRulesAtLaunch =
  | {
      readonly ok: true;
      /** The engine's rules, as shipped. */
      readonly engine: CommitGateRules;
      /** The project's rules, or `null` where it added none. */
      readonly project: CommitGateRules | null;
      /** The merged rules in force: the engine's, then the project's. */
      readonly rules: CommitGateRules;
      /** The canonical hash that pins the data in the run (F152-FR-017). */
      readonly hash: string;
    }
  | {
      readonly ok: false;
      readonly exitCode: typeof REFUSAL_EXIT_CODE;
      /** The file the refusal names. */
      readonly file: string;
      /** The refusal, as the run says it. */
      readonly message: string;
    };

/** The reads the loader makes; a read that fails answers `undefined`. */
export type LaunchReadFile = (path: string) => string | undefined;

/**
 * The rule data of the commit gate for one launch. `readFile` is the file
 * read the caller supplies — this core package imports no `node:fs`
 * (F100-FR-012, the import boundary); the edge packages read over it.
 * `engineFile` is a seam for the tests: a copy of the shipped data pointed
 * at by the caller (T135).
 */
export function commitGateRulesForTheLaunch(
  root: string,
  readFile: LaunchReadFile,
  engineFile: string = ENGINE_COMMIT_GATE_RULES_FILE,
): CommitGateRulesAtLaunch {
  try {
    const engineText = readFile(engineFile);
    if (engineText === undefined) {
      throw new CommitGateRulesError("engine", engineFile, "the engine rule data cannot be read");
    }
    const engine =
      engineFile === ENGINE_COMMIT_GATE_RULES_FILE
        ? loadEngineCommitGateRules(engineFile)
        : parseCommitGateRules(engineText, "engine");
    const project = loadProjectCommitGateRules(root, readFile);
    const rules = mergeCommitGateRules(engine, project);
    return {
      ok: true,
      engine,
      project,
      rules,
      hash: hashOfCommitGateRules(engine, project),
    };
  } catch (error) {
    if (error instanceof CommitGateRulesError) {
      return {
        ok: false,
        exitCode: REFUSAL_EXIT_CODE,
        file: error.path,
        message: error.message,
      };
    }
    throw error;
  }
}

/**
 * F152-FR-017 — the hash of the rule data NOW, re-read from the files at
 * every call: the watched-source comparison of a pass start reads no cache.
 * The same engine file, the same project root and the same `readFile` the
 * launch used.
 */
export function commitGateRulesHashNow(
  root: string,
  readFile: LaunchReadFile,
  engineFile: string = ENGINE_COMMIT_GATE_RULES_FILE,
): string | undefined {
  try {
    const engineText = readFile(engineFile);
    if (engineText === undefined) return undefined;
    const engine = parseCommitGateRules(engineText, "engine");
    const projectText = readFile(projectFileOf(root));
    const project = projectText === undefined ? null : parseCommitGateRules(projectText, "project");
    return hashOfCommitGateRules(engine, project);
  } catch {
    // A file that stops parsing mid-run is a change like any other: the
    // unreadable source halts the run (F103-FR-021's `unreadable` state).
    return undefined;
  }
}

/** The project rule file of a root, as the loader names it. */
export function projectFileOf(root: string): string {
  return join(root, PROJECT_COMMIT_GATE_RULES_FILE_NAME);
}
