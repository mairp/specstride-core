/**
 * The registry of a host's skill sources: the set a host offers, the lookup
 * by logical id, the artifacts `renderSkill` makes of the set, and the build
 * step that writes them into a plugin directory. Moved once out of
 * `packages/host-claude-code/src/skills.ts` (the split of the monorepo, U-1
 * and U-2 of `specs/120-host-dsh`), which keeps the old path and binds the
 * registry to its own three sources.
 *
 * A HOST SUPPLIES ITS SET; THE KIT RUNS IT. Which skills a host offers, in
 * which order, under which descriptions and at which spellings are facts of
 * ONE host, so they are one required `SkillSetHost` input of every function
 * here, with no default anywhere, as in `describe`, `render`, `skill-common`,
 * `skill-budgets`, `skill-doctor`, `skill-run` and `skill-reverse`: a call
 * that forgot its host cannot compile into a second host by accident. The
 * kit fixes neither the size of the set nor its order — a host may offer a
 * subset of the row's ids and file them in its own order — and it spells no
 * host, no requirement of one and no spelling of an id: the logical ids a
 * set names must be row 144's own (`HOST_SKILL_AND_ENTRY_IDS` of the
 * contracts, read and never spelled here), which `renderSkill` enforces by
 * failing the build for an id outside the row, and the spelling of each is
 * the host's render profile (`./render.ts`).
 *
 * Like the other modules of the kit, this one runs in the BUILD of a host
 * package. These names clash with none of the contract values the root index
 * re-exports, so the module is reached through the package root.
 */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { HostArtifact, SkillSource } from "@specstride/contracts/ep/host";
import { renderSkill, type SkillRenderProfile } from "./render.ts";

/**
 * The skill set of a host: its sources, in the order the host writes them;
 * the one-line description of each skill, by logical id; and its render
 * profile, which spells every logical id and carries the budgets. All three
 * are required — the kit holds no table of its own.
 */
export type SkillSetHost = {
  /** The skill sources of the host, in the order the host writes them. */
  readonly sources: readonly SkillSource[];
  /** The one-line description of each skill, by logical id. */
  readonly descriptions: Readonly<Record<string, string>>;
  /** The host's render profile: the spellings, the layout and the budgets. */
  readonly profile: SkillRenderProfile;
};

/**
 * The logical ids of a host's set, in the order the host writes them. This is
 * the host's own order, not the row's: a host that offers a subset of row 144
 * in its own order gets exactly that back.
 */
export function skillSetIdsOf(host: SkillSetHost): readonly string[] {
  return Object.freeze(host.sources.map((source) => source.logicalId));
}

/** The source of one logical id of a host's set, or `undefined`. */
export function skillSetSourceOf(host: SkillSetHost, logicalId: string): SkillSource | undefined {
  return host.sources.find((source) => source.logicalId === logicalId);
}

/**
 * The happy path of every skill of a host's set needs NO reference file, so
 * no source of the set carries one.
 */
export function skillSetHasAHappyPathWithoutAReference(host: SkillSetHost): boolean {
  return host.sources.every((source) => source.references.length === 0);
}

/**
 * The artifacts of a host's set: one rendered skill per source, in the
 * order the host writes its sources, each checked against the byte budget
 * its render profile fixes by `renderSkill` (`./render.ts`).
 */
export function renderSkillSetOf(host: SkillSetHost): readonly HostArtifact[] {
  return Object.freeze(
    host.sources.map((source) =>
      renderSkill(source, host.profile, { description: host.descriptions[source.logicalId] }),
    ),
  );
}

/**
 * The artifact of one logical id of a host's set. An id outside the host's
 * set is refused with the row's own words, which `renderSkill` would refuse
 * with anyway for an id outside row 144: the build fails.
 */
export function renderOneSkillOf(host: SkillSetHost, logicalId: string): HostArtifact {
  const source = skillSetSourceOf(host, logicalId);
  if (source === undefined) {
    throw new Error(`row 144 of annex X §X.6 holds no skill \`${logicalId}\``);
  }
  return renderSkill(source, host.profile, { description: host.descriptions[logicalId] });
}

/** The content hash of a rendered skill, which a test reads back from disk. */
export function skillContentHash(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

/** One skill as the build wrote it into the plugin directory. */
export type WrittenSkill = {
  /** The logical id of row 144 the file came from. */
  readonly logicalId: string;
  /** The path inside the plugin directory, with `/` as the separator. */
  readonly path: string;
  /** The bytes the file measures. */
  readonly bytes: number;
  /** The SHA-256 of its content, in lower-case hexadecimal. */
  readonly sha256: string;
};

/**
 * The build step of a host's set: it writes the rendered skills into a
 * plugin directory and returns what it wrote, each with its content hash.
 * The plugin directory is a BUILD OUTPUT and lies inside the published
 * package, so the build writes it and the repository of the host does not
 * carry it.
 */
export function writeSkillSetOf(
  pluginDirectory: string,
  host: SkillSetHost,
): readonly WrittenSkill[] {
  const ids = skillSetIdsOf(host);
  const written = renderSkillSetOf(host).map((artifact, index) => {
    const file = join(pluginDirectory, artifact.path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, artifact.content, "utf8");
    return Object.freeze({
      logicalId: ids[index] ?? "",
      path: artifact.path,
      bytes: artifact.bytes,
      sha256: skillContentHash(artifact.content),
    });
  });
  return Object.freeze(written);
}
