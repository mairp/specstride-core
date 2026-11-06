/**
 * T008, T009 and T010 of `specs/113-host-claude-code/tasks.md` — the binding
 * of the kit's skill-set registry to THIS host.
 *
 * The registry of `src/skills.ts` moved into `@specstride/host-kit`
 * (`src/skills.ts` of the kit, the split of the monorepo, U-1). The sibling
 * `skills.test.ts` keeps the old cases over the old path unchanged; this file
 * holds the binding half: the module here hands the kit's registry exactly
 * this host's three sources, their descriptions and the render profile of
 * F113-FR-036, and the kit namespace exports no table of its own — a second
 * host cannot inherit this host's set through the kit.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as kit from "@specstride/host-kit";
import { HOST_SKILL_AND_ENTRY_IDS } from "@specstride/contracts/ep/context-cost";
import { RENDER_PROFILE } from "../src/render/index.ts";
import { RUN_SKILL_DESCRIPTION, runSkillSource } from "../src/skill-run.ts";
import { REVERSE_SKILL_DESCRIPTION, reverseSkillSource } from "../src/skill-reverse.ts";
import { DOCTOR_SKILL_DESCRIPTION, doctorSkillSource } from "../src/skill-doctor.ts";
import {
  SKILL_LOGICAL_IDS,
  SKILL_DESCRIPTIONS,
  renderPluginSkills,
  skillSources,
  skillContentHash,
  writePluginSkills,
} from "../src/skills.ts";

/** The set of this host, rebuilt here from the binding's own public inputs. */
const THIS_SET: kit.SkillSetHost = {
  sources: skillSources(),
  descriptions: SKILL_DESCRIPTIONS,
  profile: RENDER_PROFILE,
};

test("T008-T010: the registry is the kit's, over exactly this host's set", () => {
  // The row of logical ids is the contracts' own value, read and never spelled.
  assert.equal(SKILL_LOGICAL_IDS, HOST_SKILL_AND_ENTRY_IDS);
  // The artifacts are the kit's, built over exactly this host's set.
  assert.deepEqual(renderPluginSkills(), kit.renderSkillSetOf(THIS_SET));
  // The written skills are the kit's writer's, over the same set.
  const pluginA = join(mkdtempSync(join(tmpdir(), "specstride-113-bind-")), "a");
  const pluginB = join(mkdtempSync(join(tmpdir(), "specstride-113-bind-")), "b");
  assert.deepEqual(
    [...writePluginSkills(pluginA).map((w) => [w.logicalId, w.path, w.bytes, w.sha256])],
    [
      ...kit
        .writeSkillSetOf(pluginB, THIS_SET)
        .map((w) => [w.logicalId, w.path, w.bytes, w.sha256]),
    ],
  );
  // The hash is the kit's one function, not a second implementation.
  assert.equal(skillContentHash("x"), kit.skillContentHash("x"));
});

test("T008-T010: the descriptions are the three bound sources' own", () => {
  assert.equal(SKILL_DESCRIPTIONS[SKILL_LOGICAL_IDS[0]], RUN_SKILL_DESCRIPTION);
  assert.equal(SKILL_DESCRIPTIONS[SKILL_LOGICAL_IDS[1]], REVERSE_SKILL_DESCRIPTION);
  assert.equal(SKILL_DESCRIPTIONS[SKILL_LOGICAL_IDS[2]], DOCTOR_SKILL_DESCRIPTION);
  // The set is the three bound sources, in the order of row 144.
  assert.deepEqual([...skillSources().map((source) => source.logicalId)], [...SKILL_LOGICAL_IDS]);
  // Each entry is the bound source's own builder's value (a fresh object per
  // call, so by value and not by reference).
  assert.deepEqual(skillSources()[0], runSkillSource());
  assert.deepEqual(skillSources()[1], reverseSkillSource());
  assert.deepEqual(skillSources()[2], doctorSkillSource());
});

test("T008-T010: the kit namespace exports no table of this host's set", () => {
  for (const foreign of [
    "SKILL_LOGICAL_IDS",
    "SKILL_DESCRIPTIONS",
    "skillSources",
    "skillSourceOf",
    "renderPluginSkills",
    "renderPluginSkill",
    "writePluginSkills",
    "everySkillHasAHappyPathWithoutAReference",
  ]) {
    assert.equal(foreign in kit, false, `the kit must not export ${foreign}`);
  }
});
