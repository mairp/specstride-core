/**
 * The registry of a host's skill sources (`src/skills.ts`): the set a host
 * offers, the lookup by logical id, the rendered artifacts and the build step
 * that writes them. The sample hosts here are deliberately NOT the host the
 * module moved out of, and neither of them is the other: one offers all three
 * logical ids of row 144 under its own unprefixed spellings, the other offers
 * a SUBSET of the row in its own order — the point of the move is that the
 * kit fixes neither the size of a set nor its order, and that the kit source
 * names no host and no requirement of one.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DOCTOR_SKILL_ID, HOST_SKILL_IDS } from "@specstride/contracts/ep/host";
import { HOST_SKILL_AND_ENTRY_IDS } from "@specstride/contracts/ep/context-cost";
import type { SkillSource } from "@specstride/contracts/ep/host";
import type { SkillRenderProfile } from "../src/render.ts";
import { renderEntry } from "../src/render.ts";
import {
  type SkillSetHost,
  renderOneSkillOf,
  renderSkillSetOf,
  skillContentHash,
  skillSetHasAHappyPathWithoutAReference,
  skillSetIdsOf,
  skillSetSourceOf,
  writeSkillSetOf,
} from "../src/skills.ts";

const HERE = dirname(fileURLToPath(import.meta.url));

/** A small source of a sample host: a logical id of the row, a short body. */
function sourceOf(logicalId: string, title: string, references: SkillSource["references"] = []) {
  return Object.freeze({
    logicalId,
    body: `# ${title}\n\nA thin layer over the CLI.\n\n## Order\n\n1. Plan.\n2. Run.\n`,
    references: Object.freeze(references),
    budget: 3_920,
  });
}

/** The task host: all three logical ids of row 144, in its own order. */
const TASK_HOST: SkillSetHost = {
  sources: [
    sourceOf(HOST_SKILL_IDS[0], "Task with Specstride"),
    sourceOf(HOST_SKILL_IDS[1], "Reverse with Specstride"),
    sourceOf(HOST_SKILL_AND_ENTRY_IDS[2], "Check Specstride"),
  ],
  descriptions: Object.freeze({
    // The doctor skill has deliberately NO entry: its description comes from
    // its own first line, the kit's fallback.
    [HOST_SKILL_IDS[0]]: "Plan and run one feature of the repository through the CLI.",
    [HOST_SKILL_IDS[1]]: "Read the sources back into a specification.",
  }),
  profile: {
    bytesPerToken: 2.8,
    maxBodyLines: 200,
    descriptionCap: 500,
    skillFile: "SKILL.md",
    skillsDirectory: "skills",
    spellings: {
      [HOST_SKILL_IDS[0]]: "task",
      [HOST_SKILL_IDS[1]]: "reverse",
      [HOST_SKILL_AND_ENTRY_IDS[2]]: DOCTOR_SKILL_ID,
    },
    tokenBudgets: { [HOST_SKILL_IDS[0]]: 1_400, [HOST_SKILL_IDS[1]]: 1_400, doctor: 1_000 },
    printedByteBudgets: {
      [HOST_SKILL_IDS[0]]: 3_920,
      [HOST_SKILL_IDS[1]]: 3_920,
      doctor: 2_800,
    },
    budgetRequirement: "the task host's budget requirement",
  } satisfies SkillRenderProfile,
};

/** A second host: a SUBSET of the row, in ITS OWN order (the check skill first). */
const CHECK_HOST: SkillSetHost = {
  sources: [
    sourceOf(HOST_SKILL_AND_ENTRY_IDS[2], "Check Specstride"),
    sourceOf(HOST_SKILL_IDS[0], "Task with Specstride"),
  ],
  descriptions: Object.freeze({}),
  profile: {
    ...TASK_HOST.profile,
    spellings: { [HOST_SKILL_AND_ENTRY_IDS[2]]: "check", [HOST_SKILL_IDS[0]]: "task" },
    tokenBudgets: { doctor: 1_000, [HOST_SKILL_IDS[0]]: 1_400 },
    printedByteBudgets: { doctor: 2_800, [HOST_SKILL_IDS[0]]: 3_920 },
  },
};

/* ------------------------------------------------------- the set is a host's */

test("the set is a host's: the kit fixes neither its size nor its order", () => {
  assert.deepEqual([...skillSetIdsOf(TASK_HOST)], [...HOST_SKILL_AND_ENTRY_IDS]);
  // The second host offers a subset, in its own order.
  assert.deepEqual(
    [...skillSetIdsOf(CHECK_HOST)],
    [HOST_SKILL_AND_ENTRY_IDS[2], HOST_SKILL_IDS[0]],
  );
  // A source is found by its logical id, and an unknown one is not.
  assert.equal(skillSetSourceOf(TASK_HOST, HOST_SKILL_IDS[0]), TASK_HOST.sources[0]);
  assert.equal(skillSetSourceOf(TASK_HOST, "onboard-skill"), undefined);
});

test("the happy-path check reads the host's sources", () => {
  assert.equal(skillSetHasAHappyPathWithoutAReference(TASK_HOST), true);
  const withReference: SkillSetHost = {
    ...TASK_HOST,
    sources: [
      TASK_HOST.sources[0]!,
      sourceOf(HOST_SKILL_IDS[1], "Reverse with Specstride", [
        { path: "references/format.md", readWhen: "the digest is written" },
      ]),
      TASK_HOST.sources[2]!,
    ],
  };
  assert.equal(skillSetHasAHappyPathWithoutAReference(withReference), false);
});

/* ---------------------------------------------------------------- rendering */

test("the set renders in the host's order through its spellings", () => {
  const artifacts = renderSkillSetOf(TASK_HOST);
  assert.equal(artifacts.length, 3);
  assert.deepEqual(
    [...artifacts.map((a) => a.path)],
    ["skills/task/SKILL.md", "skills/reverse/SKILL.md", `skills/${DOCTOR_SKILL_ID}/SKILL.md`],
  );
  // The order is the host's, not the row's, and the subset host renders fewer.
  const check = renderSkillSetOf(CHECK_HOST);
  assert.deepEqual(
    [...check.map((a) => a.path)],
    [`skills/check/SKILL.md`, `skills/task/SKILL.md`],
  );
  // The descriptions are the host table's; the spellings are the profile's.
  assert.ok(artifacts[0]!.content.includes(TASK_HOST.descriptions[HOST_SKILL_IDS[0]]!));
  assert.ok(artifacts[1]!.content.includes(TASK_HOST.descriptions[HOST_SKILL_IDS[1]]!));
  assert.equal(renderEntry(HOST_SKILL_IDS[0], TASK_HOST.profile), "task");
});

test("one skill renders by its logical id, with the row's refusal outside the set", () => {
  const one = renderOneSkillOf(TASK_HOST, HOST_SKILL_IDS[1]);
  const set = renderSkillSetOf(TASK_HOST);
  assert.equal(one.path, set[1]?.path);
  assert.equal(one.content, set[1]?.content);
  assert.equal(one.bytes, set[1]?.bytes);
  // A logical id outside the HOST'S SET fails the build, even one the row
  // holds that this host does not offer; so does an id outside the row.
  assert.throws(() => renderOneSkillOf(CHECK_HOST, HOST_SKILL_IDS[1]), /row 144/);
  assert.throws(() => renderOneSkillOf(TASK_HOST, "onboard-skill"), /row 144/);
});

test("a skill with no entry in the host's description table takes its first line", () => {
  // The doctor skill of the task host carries no description entry.
  const doctor = renderOneSkillOf(TASK_HOST, HOST_SKILL_AND_ENTRY_IDS[2]);
  assert.match(doctor.content, /description: "Check Specstride"/);
});

/* ------------------------------------------------------------------ writing */

test("the writer writes the files, and the DISK is the witness", () => {
  const plugin = join(mkdtempSync(join(tmpdir(), "specstride-host-kit-skills-")), "plugin");
  // Nothing is there before the build runs.
  for (const id of skillSetIdsOf(TASK_HOST)) {
    const entry = renderEntry(id, TASK_HOST.profile);
    assert.equal(existsSync(join(plugin, "skills", entry, "SKILL.md")), false);
  }

  const written = writeSkillSetOf(plugin, TASK_HOST);
  assert.deepEqual([...written.map((w) => w.logicalId)], [...skillSetIdsOf(TASK_HOST)]);
  for (const skill of written) {
    const file = join(plugin, skill.path);
    assert.equal(existsSync(file), true, `${skill.path} is missing`);
    const onDisk = readFileSync(file, "utf8");
    const hash = createHash("sha256").update(onDisk, "utf8").digest("hex");
    assert.equal(hash, skill.sha256, `${skill.path}: the disk is not what was written`);
    assert.equal(Buffer.byteLength(onDisk, "utf8"), skill.bytes);
    assert.match(skill.sha256, /^[0-9a-f]{64}$/);
    assert.notEqual(hash, skillContentHash(""));
  }
  // Writing again gives the same hashes: the build is deterministic.
  const second = writeSkillSetOf(plugin, TASK_HOST);
  assert.deepEqual(
    [...second.map((w) => [w.logicalId, w.sha256])],
    [...written.map((w) => [w.logicalId, w.sha256])],
  );
  rmSync(plugin, { recursive: true, force: true });
});

/* ------------------------------------------------------------- neutrality */

test("the kit source names no host and no requirement of one", () => {
  const src = readFileSync(join(HERE, "../src/skills.ts"), "utf8");
  for (const foreign of [
    "CLAUDE",
    "Claude",
    "claude plugin",
    ".claude-plugin",
    "/specstride:",
    "specstride-",
    "F113-FR",
    "T008",
    "DV-0",
    "FX-3",
    "Tier 2",
    "22,400",
    "2.8",
    "500 lines",
    "the old skill",
  ]) {
    assert.equal(src.includes(foreign), false, `src/skills.ts must not hold ${foreign}`);
  }
  // The provenance PATH of the move is allowed.
  assert.ok(src.includes("packages/host-claude-code/src/skills.ts"));
});
