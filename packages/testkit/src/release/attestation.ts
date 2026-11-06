/**
 * T224 — the release check CT-100-336 of F100-FR-236, as executable code.
 * **The rule lives here, in `@specstride/testkit/release/attestation`** (the
 * split of the monorepo, phase 4): a host judges its own published versions
 * against the same rule the core build is judged by, from the installed
 * package. The workflow's script entry and the repository's old import path
 * stay `tests/release/100/publish-attestation.ts`, which re-exports this
 * module and keeps the CLI of the publishing job.
 *
 * F100-FR-236: a version of a published package is published only by the build,
 * from a protected branch of the repository of the product, and carries an
 * attestation that binds the package to the commit and to the build that made
 * it. A version is never published from a working copy or by hand. The release
 * check fails for a version that lacks the attestation or whose attestation
 * names another repository, branch or commit. This is the control of threat
 * T-43.
 *
 * The check is hermetic. It opens no connection and reads no registry: it is
 * given the facts of the build (`BuildFacts`) and the attestation of each
 * version as the publishing step recorded it, and it judges the two against
 * each other. In the build the publishing job writes the attestation of every
 * version it published and hands the directory to the entry (the CLI at the
 * foot of `tests/release/100/publish-attestation.ts`); in the test of
 * CT-100-336 the attestations are the recorded ones of
 * `tests/release/100/attestations/`, so the check runs on every build without
 * a release and without a network.
 *
 * `validatePublishAttestation` returns the list of refusals, one per fault, so
 * that a caller reports every fault of a version at once. An empty list means
 * the version passes the check.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** The one branch from which a version may be published (F100-FR-236). */
export const PROTECTED_BRANCH = "main" as const;

/** The protected branch as a git ref, the form the build reports. */
export const PROTECTED_REF = `refs/heads/${PROTECTED_BRANCH}` as const;

/**
 * Who published a version. Only the build may: a version published from a
 * working copy or by hand is refused whatever else its attestation says.
 */
export const PUBLISHED_BY_THE_BUILD = "build" as const;

/** The facts of the build that published, as the workflow reports them. */
export interface BuildFacts {
  /** The repository of the product, `owner/name`. */
  repository: string;
  /** The ref the build ran on; it must be the protected branch. */
  ref: string;
  /** The commit the build published from. */
  commit: string;
  /** The run of the build that made the version. */
  runId: string;
  /** The workflow that published. */
  workflow: string;
}

/** The attestation of one published version, as the registry holds it. */
export interface PublishAttestation {
  /** The package and version the attestation binds, with its digest. */
  subject?: { name?: string; version?: string; digest?: string };
  repository?: string;
  ref?: string;
  commit?: string;
  runId?: string;
  workflow?: string;
  /** `build`, and nothing else, for a version the build published. */
  publishedBy?: string;
}

/** One published version of one package, with its attestation where it has one. */
export interface PublishedVersion {
  name: string;
  version: string;
  attestation?: PublishAttestation | null;
}

/** The four packages the build publishes (`published` of `data/package-graph.json`). */
export const PUBLISHED_PACKAGE_COUNT = 4 as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Judge one published version against the facts of the build that published it.
 * Returns one refusal per fault; an empty list means the version passes.
 */
export function validatePublishAttestation(build: BuildFacts, published: unknown): string[] {
  const refusals: string[] = [];
  if (!isObject(published)) return ["the published version must be a JSON object"];
  const name = published["name"];
  const version = published["version"];
  if (typeof name !== "string" || name.trim() === "") refusals.push("name must be a package name");
  if (typeof version !== "string" || version.trim() === "") {
    refusals.push("version must be a version");
  }
  const where = `${String(name)}@${String(version)}`;

  const attestation = published["attestation"];
  if (attestation === undefined || attestation === null) {
    refusals.push(
      `${where} carries no attestation: a version is published only by the build, with an ` +
        `attestation that binds it to the commit and to the build (F100-FR-236, threat T-43)`,
    );
    return refusals;
  }
  if (!isObject(attestation)) {
    refusals.push(`${where}: the attestation must be a JSON object`);
    return refusals;
  }

  // The repository of the product, and no other.
  if (attestation["repository"] !== build.repository) {
    refusals.push(
      `${where}: the attestation names another repository ` +
        `(${JSON.stringify(attestation["repository"])}, not "${build.repository}") (F100-FR-236)`,
    );
  }
  // The protected branch, and no other.
  if (attestation["ref"] !== build.ref) {
    refusals.push(
      `${where}: the attestation names another branch ` +
        `(${JSON.stringify(attestation["ref"])}, not "${build.ref}") (F100-FR-236)`,
    );
  }
  if (attestation["ref"] !== PROTECTED_REF) {
    refusals.push(
      `${where}: the attestation names ${JSON.stringify(attestation["ref"])}, which is not the ` +
        `protected branch ${PROTECTED_REF} (F100-FR-236)`,
    );
  }
  // The commit of the build, and no other.
  if (attestation["commit"] !== build.commit) {
    refusals.push(
      `${where}: the attestation names another commit ` +
        `(${JSON.stringify(attestation["commit"])}, not "${build.commit}") (F100-FR-236)`,
    );
  }
  // The build that made it: the run and the workflow, and `publishedBy: build`.
  if (attestation["runId"] !== build.runId || attestation["workflow"] !== build.workflow) {
    refusals.push(
      `${where}: the attestation does not bind the version to the build that made it ` +
        `(run ${JSON.stringify(attestation["runId"])}, workflow ` +
        `${JSON.stringify(attestation["workflow"])}) (F100-FR-236)`,
    );
  }
  if (attestation["publishedBy"] !== PUBLISHED_BY_THE_BUILD) {
    refusals.push(
      `${where}: publishedBy is ${JSON.stringify(attestation["publishedBy"])}; a version is ` +
        `never published from a working copy or by hand (F100-FR-236)`,
    );
  }
  // The attestation binds this package and this version, with a digest.
  const subject = attestation["subject"];
  if (!isObject(subject)) {
    refusals.push(`${where}: the attestation names no subject, so it binds no package`);
  } else {
    if (subject["name"] !== name || subject["version"] !== version) {
      refusals.push(
        `${where}: the attestation binds ${String(subject["name"])}@${String(subject["version"])}, ` +
          `another package or version (F100-FR-236)`,
      );
    }
    if (typeof subject["digest"] !== "string" || (subject["digest"] as string).trim() === "") {
      refusals.push(`${where}: the subject of the attestation carries no digest`);
    }
  }
  return refusals;
}

/** The refusals of every published version, by `name@version`. */
export function checkPublishedVersions(
  build: BuildFacts,
  versions: readonly unknown[],
): Map<string, string[]> {
  const out = new Map<string, string[]>();
  versions.forEach((published, index) => {
    const key = isObject(published)
      ? `${String(published["name"])}@${String(published["version"])}`
      : `version ${index}`;
    out.set(key, validatePublishAttestation(build, published));
  });
  return out;
}

/** True when no version of the release was refused. */
export function releasePasses(refusals: Map<string, string[]>): boolean {
  return [...refusals.values()].every((list) => list.length === 0);
}

/** Read the build facts from the environment of the publishing job. */
export function buildFactsOfEnvironment(env: NodeJS.ProcessEnv): BuildFacts {
  return {
    repository: env["GITHUB_REPOSITORY"] ?? "",
    ref: env["GITHUB_REF"] ?? "",
    commit: env["GITHUB_SHA"] ?? "",
    runId: env["GITHUB_RUN_ID"] ?? "",
    workflow: env["GITHUB_WORKFLOW"] ?? "",
  };
}

/** Read every `*.json` of a directory of published versions, sorted by name. */
export function readPublishedVersions(dir: string): unknown[] {
  return readdirSync(dir)
    .filter((entry) => entry.endsWith(".json"))
    .sort()
    .map((entry) => JSON.parse(readFileSync(join(dir, entry), "utf8")) as unknown);
}
