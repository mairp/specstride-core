/**
 * T010 of `specs/113-host-claude-code/tasks.md` — the doctor skill source of
 * THIS host (F113-FR-015).
 *
 * The MODULE moved to `@specstride/host-kit` (`src/skill-doctor.ts` there) in
 * the split of the monorepo (U-1, U-2 of `specs/120-host-dsh`), and this file
 * re-exports it from the old path so the imports of this package keep working;
 * the module itself lives in one place (the rule of the split: a module moves
 * once, an old path re-exports).
 *
 * What the kit does not fix — the budgets of THIS host — this file passes in:
 *
 *  - the total byte budget of the whole rendered doctor skill, 1,500 tokens,
 *    read as `BYTE_BUDGETS.doctor` from the render profile of F113-FR-036
 *    (`./render/index.ts`, reached through `./skill-budgets.ts`);
 *  - the body-limit check the body must pass, 800 tokens (2,240 bytes) of the
 *    design point "Skill body size" of plan.md, from `bodyBudgetsOf`
 *    (`./skill-budgets.ts`), keyed by the logical id of row 144.
 *
 * Everything else is the kit's: the severities of a finding (EP-14), the exit
 * codes and their meanings (read out of the per-command table of annex G
 * §G.4, never written anywhere), the install command, the published package
 * and the protocol refusal (`./shim/index.ts`, the one place that knows them,
 * re-exported from the kit's shim), the logical id of row 144, and the body
 * and description themselves. The binding keeps every import path of this
 * module and every rendered byte identical to the module it moved out of.
 */
import type { SkillSource } from "@specstride/contracts/ep/host";
import { DOCTOR_SKILL_LOGICAL_ID, doctorSkillSourceOf } from "@specstride/host-kit";
import { BYTE_BUDGETS, BODY_BYTE_LIMITS, assertBodyFitsItsLimit } from "./skill-budgets.ts";

export {
  /** The logical id of the doctor skill, row 144 of annex X §X.6, from the contracts. */
  DOCTOR_SKILL_LOGICAL_ID,
  /** The command of the CLI the skill is a thin layer over. */
  DOCTOR_COMMAND,
  /** The severities of a finding, from EP-14 (annex G §G.7). */
  FINDING_SEVERITIES,
  /** The exit codes of `doctor` and the meaning of each, from annex G §G.4. */
  type DoctorExit,
  DOCTOR_EXITS,
  DOCTOR_EXIT_CODES,
  meaningOfExit,
  /** The skill installs and updates nothing. */
  INSTALLS_OR_UPDATES,
  /** What the skill PRINTS for a missing CLI, from the shim. */
  MISSING_CLI_COMMAND,
  MISSING_CLI_PACKAGE,
  /** The refusal line of a protocol mismatch, and its exit code, from the shim. */
  MISMATCH_LINE,
  MISMATCH_EXIT_CODE,
  SUPPORTED_PROTOCOL_RANGE,
  /** The one-line description of the skill. */
  DOCTOR_SKILL_DESCRIPTION,
  /** The Markdown body of the doctor skill. */
  doctorSkillBody,
} from "@specstride/host-kit";

/**
 * The doctor skill source of THIS host, as `renderSkill` takes it: the kit's
 * source built under this host's budgets — the total of F113-FR-036 for the
 * whole rendered skill, and the design point's limit for the body.
 */
export function doctorSkillSource(): SkillSource {
  return doctorSkillSourceOf({
    totalBytes: BYTE_BUDGETS.doctor,
    assertBodyFitsItsLimit,
  });
}

/** The byte limit of the BODY of this skill, from the design point of plan.md. */
export const DOCTOR_BODY_BYTE_LIMIT = BODY_BYTE_LIMITS[DOCTOR_SKILL_LOGICAL_ID];
