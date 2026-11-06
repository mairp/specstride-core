/**
 * T008, T009 and T010 — the three skill sources of this host together, and the
 * artifacts `renderSkill` makes of them (F113-FR-001: the plugin offers three
 * skills with the logical ids `specstride-run`, `specstride-reverse` and a
 * doctor skill).
 *
 * The REGISTRY moved to `@specstride/host-kit` (`src/skills.ts` there) in the
 * split of the monorepo (U-1, U-2 of `specs/120-host-dsh`), and this file
 * keeps the old path and binds the kit's registry to what is a fact of THIS
 * host:
 *
 *  - the three sources of the plugin, in the order of row 144 — the bound
 *    sources of `./skill-run.ts`, `./skill-reverse.ts` and `./skill-doctor.ts`,
 *    each already the kit's builder over this host's own sections and budgets;
 *  - the one-line description of each of the three skills, which are the
 *    descriptions those bound sources declare;
 *  - the render profile of F113-FR-036 (`./render/index.ts`), which spells
 *    every logical id, carries the budgets and fixes the layout.
 *
 * Everything else is the kit's: the lookup by logical id, the happy-path
 * check, the rendered artifacts, the content hash and the build step that
 * writes the files into the plugin directory. The logical ids of the row are
 * READ from `@specstride/contracts` and not written here; a source whose
 * logical id is outside the row fails the BUILD (F113-FR-029), which the
 * kit's `renderSkill` enforces. The binding keeps every import path of this
 * module, every export name and every rendered byte identical to the module
 * it moved out of.
 *
 * The modules of `src/` outside `src/shim/` run in the BUILD, so they may
 * import `@specstride/contracts` and `@specstride/host-kit` (the rule files
 * RF-113-01 and RF-120-02 of the import-boundary check).
 */
import { HOST_SKILL_AND_ENTRY_IDS } from "@specstride/contracts/ep/context-cost";
import type { HostArtifact, SkillSource } from "@specstride/contracts/ep/host";
import type { SkillSetHost, WrittenSkill } from "@specstride/host-kit";
import {
  skillContentHash,
  skillSetHasAHappyPathWithoutAReference,
  skillSetSourceOf,
  renderOneSkillOf,
  renderSkillSetOf,
  writeSkillSetOf,
} from "@specstride/host-kit";
import { RENDER_PROFILE } from "./render/index.ts";
import { DOCTOR_SKILL_DESCRIPTION, doctorSkillSource } from "./skill-doctor.ts";
import { REVERSE_SKILL_DESCRIPTION, reverseSkillSource } from "./skill-reverse.ts";
import { RUN_SKILL_DESCRIPTION, runSkillSource } from "./skill-run.ts";

/** The logical ids of the three skills, row 144 of annex X §X.6. */
export const SKILL_LOGICAL_IDS = HOST_SKILL_AND_ENTRY_IDS;

/** The one-line description of each skill, by logical id. */
export const SKILL_DESCRIPTIONS: Readonly<Record<string, string>> = Object.freeze({
  [HOST_SKILL_AND_ENTRY_IDS[0]]: RUN_SKILL_DESCRIPTION,
  [HOST_SKILL_AND_ENTRY_IDS[1]]: REVERSE_SKILL_DESCRIPTION,
  [HOST_SKILL_AND_ENTRY_IDS[2]]: DOCTOR_SKILL_DESCRIPTION,
});

/** The three skill sources, in the order of row 144. */
export function skillSources(): readonly SkillSource[] {
  return Object.freeze([runSkillSource(), reverseSkillSource(), doctorSkillSource()]);
}

/**
 * The skill set of THIS host, as the kit's registry takes it: the three
 * sources in the order of row 144, their descriptions, and the render
 * profile of F113-FR-036. Built once; every function below hands it over.
 */
const SKILL_SET: SkillSetHost = {
  sources: skillSources(),
  descriptions: SKILL_DESCRIPTIONS,
  profile: RENDER_PROFILE,
};

/**
 * F113-FR-001 — the happy path of every skill needs NO reference file, so no
 * source carries one.
 */
export function everySkillHasAHappyPathWithoutAReference(): boolean {
  return skillSetHasAHappyPathWithoutAReference(SKILL_SET);
}

/** The source of one logical id, or `undefined`. */
export function skillSourceOf(logicalId: string): SkillSource | undefined {
  return skillSetSourceOf(SKILL_SET, logicalId);
}

/**
 * The artifacts of the three skills: one `skills/<the host's spelling>/SKILL.md`
 * each, checked against the byte budget of F113-FR-036 by the kit's
 * `renderSkill` over this host's profile.
 */
export function renderPluginSkills(): readonly HostArtifact[] {
  return renderSkillSetOf(SKILL_SET);
}

/** The artifact of one logical id. */
export function renderPluginSkill(logicalId: string): HostArtifact {
  return renderOneSkillOf(SKILL_SET, logicalId);
}

/* -------------------------------------------------------------------------
 * The build step: the sources become files of the plugin directory
 * ---------------------------------------------------------------------- */

/**
 * The content hash of a rendered skill, which a test reads back from disk.
 * The kit's own (`@specstride/host-kit`), re-exported from the old path.
 */
export { skillContentHash };

/**
 * One skill as the build wrote it into the plugin directory — the kit's own
 * type (`@specstride/host-kit`), re-exported from the old path.
 */
export type { WrittenSkill };

/**
 * The build step of T008 to T010: it writes the three rendered skills into a
 * plugin directory and returns what it wrote, each with its content hash. The
 * plugin directory is a BUILD OUTPUT and lies inside the published package
 * (plan.md, "Structure Decision"), so the build writes it and the repository
 * does not carry it.
 */
export function writePluginSkills(pluginDirectory: string): readonly WrittenSkill[] {
  return writeSkillSetOf(pluginDirectory, SKILL_SET);
}
