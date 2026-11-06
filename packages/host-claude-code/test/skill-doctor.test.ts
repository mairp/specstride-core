/**
 * T010 of `specs/113-host-claude-code/tasks.md` — the binding of the kit's
 * doctor skill source to THIS host.
 *
 * The module of `src/skill-doctor.ts` moved into `@specstride/host-kit`
 * (`src/skill-doctor.ts` of the kit, the split of the monorepo, U-1). This
 * file holds the binding half: the module here is one binding of the kit's
 * `doctorSkillSourceOf`, over the budgets of F113-FR-036 (the whole rendered
 * skill) and of the design point "Skill body size" of plan.md (the body), and
 * every consumer of the old path reads the same values, the same body and the
 * same rendered bytes as before the move.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DOCTOR_EXITS as KIT_DOCTOR_EXITS,
  DOCTOR_SKILL_DESCRIPTION as KIT_DESCRIPTION,
  DOCTOR_SKILL_LOGICAL_ID as KIT_LOGICAL_ID,
  doctorSkillBody as kitDoctorSkillBody,
  doctorSkillSourceOf,
} from "@specstride/host-kit";
import { DESCRIPTION_CAP } from "../src/describe/index.ts";
import {
  BODY_BYTE_LIMITS,
  BYTE_BUDGETS,
  assertBodyFitsItsLimit,
  bodyBytes,
} from "../src/skill-budgets.ts";
import {
  DOCTOR_BODY_BYTE_LIMIT,
  DOCTOR_EXIT_CODES,
  DOCTOR_EXITS,
  DOCTOR_SKILL_DESCRIPTION,
  DOCTOR_SKILL_LOGICAL_ID,
  FINDING_SEVERITIES,
  INSTALLS_OR_UPDATES,
  MISMATCH_EXIT_CODE,
  MISMATCH_LINE,
  MISSING_CLI_COMMAND,
  doctorSkillBody,
  doctorSkillSource,
  meaningOfExit,
} from "../src/skill-doctor.ts";

test("T010: the doctor declarations are the kit's own values, re-exported", () => {
  // The frozen values are the kit module's own objects, not copies.
  assert.equal(DOCTOR_SKILL_LOGICAL_ID, KIT_LOGICAL_ID);
  assert.equal(DOCTOR_SKILL_LOGICAL_ID, "doctor");
  assert.equal(DOCTOR_SKILL_DESCRIPTION, KIT_DESCRIPTION);
  assert.equal(doctorSkillBody(), kitDoctorSkillBody());
  assert.equal(DOCTOR_EXITS, KIT_DOCTOR_EXITS);
  assert.deepEqual([...DOCTOR_EXIT_CODES], [0, 1, 2, 3]);
  assert.equal(meaningOfExit(2), "at least one `fail` finding");
  assert.equal(meaningOfExit(9), undefined);
  assert.equal(INSTALLS_OR_UPDATES, false);
  assert.ok(MISSING_CLI_COMMAND.length > 0, "the missing-CLI command is the shim's");
  assert.ok(MISMATCH_LINE.length > 0, "the refusal line is the shim's");
  assert.equal(typeof MISMATCH_EXIT_CODE, "number");
  assert.deepEqual([...FINDING_SEVERITIES], ["ok", "info", "warn", "fail"]);
});

test("T010: the source is the kit's, built under this host's budgets", () => {
  const source = doctorSkillSource();
  // The same source the kit builds over exactly the budgets this host binds.
  assert.deepEqual(
    source,
    doctorSkillSourceOf({ totalBytes: BYTE_BUDGETS.doctor, assertBodyFitsItsLimit }),
  );
  assert.equal(source.logicalId, DOCTOR_SKILL_LOGICAL_ID);
  assert.equal(source.budget, BYTE_BUDGETS.doctor);
  assert.deepEqual([...source.references], []);
  // The body passes THIS host's body-limit check, at the design point's limit.
  assert.doesNotThrow(() => assertBodyFitsItsLimit(DOCTOR_SKILL_LOGICAL_ID, source.body));
  assert.ok(bodyBytes(source.body) <= (BODY_BYTE_LIMITS[DOCTOR_SKILL_LOGICAL_ID] ?? 0));
  // The byte limit of the body of this skill is the design point's row.
  assert.equal(DOCTOR_BODY_BYTE_LIMIT, BODY_BYTE_LIMITS[DOCTOR_SKILL_LOGICAL_ID]);
  assert.equal(DOCTOR_BODY_BYTE_LIMIT, 2_240);
  // The description is inside the cap of this host.
  assert.ok(DOCTOR_SKILL_DESCRIPTION.length <= DESCRIPTION_CAP);
});
