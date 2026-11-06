/**
 * T022 — the validation of `fixture.json` and the import of as-is assets with
 * their licence notice (F141-FR-012).
 *
 * F141-FR-012 asks four things of a fixture, and this module is each of them:
 *
 * 1. **A declaration and its files.** `validateFixture` refuses a declaration
 *    that lacks a field, names a verb that is no verb of its stub, or names a
 *    surface outside §O.4 or outside the surfaces of its family. The field list
 *    is `data/schemas/fixture.schema.json`; the verbs are
 *    `data/stub-vocabulary.json`; the surfaces are `data/surfaces.json` and the
 *    family's own row of `data/fixture-catalogue.json`. `src/catalogue/data.ts`
 *    holds the first two refusals already (`validateFixtureDeclaration`); this
 *    module builds on them and adds the rest.
 * 2. **Files of state in the template, by logical name.** A template may hold
 *    files of state. The oracle lays each of them out per side: at the as-is
 *    path on the reference, which is the row of the compared table of
 *    `layout-old-side.json` of feature 100, and on the port at the path the
 *    layout table of feature 100 gives that logical name. The template
 *    therefore names a file of state by its LOGICAL name and never by a path.
 * 3. **No physical path of the port's state.** A declaration that holds one is
 *    refused: the port's layout is new, and a fixture that wrote it down would
 *    freeze it.
 * 4. **As-is assets, unchanged, with the licence notice of their baseline.**
 *    `fixtures/assets/NOTICE` is that notice. Every asset of a declaration
 *    names its baseline and its licence, and both must be the ones the notice
 *    records. The assets of the locally registered backend of the baseline are
 *    not imported (§O.7); the refusal takes the name at run time and this
 *    module holds it nowhere (F141-FR-029).
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";

import {
  holdsLogicalName,
  resolve as resolveLogicalName,
} from "@specstride/contracts/ids/logical-names";
import { comparedRows } from "@specstride/contracts/profile/layout-old-side";
import {
  controlRoot,
  userCacheRoot,
  userConfigRoot,
  userStateRoot,
  workerRoot,
  workspacePart,
  type RootEnvironment,
} from "@specstride/contracts/ids/roots";

import { OracleDataError, oracleData, validateFixtureDeclaration } from "./data.ts";
import { pins } from "../reference/pins.ts";

/** The root of the package, `packages/oracle/`. */
const ORACLE_ROOT = resolvePath(dirname(dirname(dirname(fileURLToPath(import.meta.url)))));

/** Raised when a fixture, a template or an asset does not hold up. */
export class FixtureError extends Error {
  /** What the error is about: a citation, a scenario, a fixture or an asset. */
  readonly subject: string;
  constructor(subject: string, message: string) {
    super(`${subject}: ${message}`);
    this.name = "FixtureError";
    this.subject = subject;
  }
}

// ---------------------------------------------------------------------------
// The declaration
// ---------------------------------------------------------------------------

/** The fields `fixture.schema.json` requires. A declaration that lacks one is refused. */
export const REQUIRED_FIXTURE_FIELDS: readonly string[] = Object.freeze(
  ((oracleData.schemas["fixture.schema.json"] as { required?: string[] }).required ?? []).slice(),
);

/** The declaration of one scenario, as far as this module reads it. */
export type FixtureDeclaration = {
  readonly schema: string;
  readonly id: string;
  readonly variant?: string;
  readonly system: string;
  readonly entryPoint: { readonly reference: string; readonly port: string };
  readonly command: { readonly reference: readonly string[]; readonly port: readonly string[] };
  readonly environment: Readonly<Record<string, string>>;
  readonly stubs: Readonly<Record<string, readonly { readonly verbs: readonly string[] }[]>>;
  readonly workdirTemplate: string;
  readonly assets?: readonly AsIsAsset[];
  readonly expectedExit: number;
  readonly surfaces: readonly string[];
  readonly proves: readonly string[];
  readonly os: readonly string[];
  readonly waivers?: readonly string[];
  readonly prerequisites?: readonly string[];
  readonly addedBy?: string;
};

/** One as-is file of a baseline that a scenario uses, imported unchanged. */
export type AsIsAsset = {
  readonly path: string;
  readonly baseline: string;
  readonly licence: string;
};

/**
 * F141-FR-012 — validate one `fixture.json`.
 *
 * The schema check and the two refusals of the catalogue come from
 * `validateFixtureDeclaration`; this function adds the asset notice, the state
 * files of the template and the refusal of a physical path of the port's state.
 * `templateRoot` is where the templates of the fixtures live; it is read only
 * where the declaration names a template that exists, so a declaration can be
 * validated on its own.
 */
export function validateFixture(
  value: unknown,
  options: { readonly templateRoot?: string; readonly portEnvironment?: RootEnvironment } = {},
): {
  readonly id: string;
  readonly family: string;
  readonly scenario: string;
  readonly stateFiles: readonly string[];
} {
  const resolved = validateFixtureDeclaration(value);
  const declaration = value as FixtureDeclaration;

  assertAssetsCarryTheirNotice(declaration);
  assertNoPhysicalPortStatePath(declaration, options.portEnvironment);

  const templateRoot = options.templateRoot ?? join(ORACLE_ROOT, "fixtures");
  const template = join(templateRoot, declaration.workdirTemplate);
  const stateFiles = existsSync(template) ? stateFilesOfTemplate(template) : [];

  return { ...resolved, stateFiles };
}

// ---------------------------------------------------------------------------
// Files of state in a template, laid out by logical name on each side
// ---------------------------------------------------------------------------

/**
 * The directory of a template that holds its files of state. Each entry is
 * named by its LOGICAL name (`feature:<slug>:notebook`), never by a path: the
 * oracle resolves the path per side.
 */
export const TEMPLATE_STATE_DIRECTORY = "state" as const;

/**
 * One entry of the state directory of a template: the logical name, and the
 * INSTANCE it stands at.
 *
 * A logical name of the layout table of feature 100 is a template of its own:
 * `run:<runId>:events-legacy` names the legacy event stream of ANY run, and a
 * scenario may need several — the sample floor of the learning engine is a
 * cross-run count, so a working directory with one run proves nothing about it.
 * An entry may therefore carry the parameters of its instance after a `#`:
 *
 *     run:<runId>:events-legacy#runId=20260101-000001-000001
 *     gate:<N>:approved#N=2
 *
 * The part before the `#` is the logical name and is held to the layout table;
 * the parameters are given to the as-is path of the reference and to the layout
 * table of the port, so one entry names the same thing on both sides. The whole
 * entry is the key of the state surface, so two instances of one name are two
 * entries of the comparison and never one.
 */
export type TemplateStateEntry = {
  readonly entry: string;
  readonly logicalName: string;
  readonly parameters: Readonly<Record<string, string>>;
};

/** Split an entry of the state directory of a template into name and instance. */
export function splitTemplateStateName(entry: string): TemplateStateEntry {
  const hash = entry.indexOf("#");
  if (hash < 0) return { entry, logicalName: entry, parameters: Object.freeze({}) };
  const logicalName = entry.slice(0, hash);
  const parameters: Record<string, string> = {};
  for (const pair of entry.slice(hash + 1).split(",")) {
    if (pair === "") continue;
    const equals = pair.indexOf("=");
    if (equals < 0) {
      throw new FixtureError(entry, `holds "${pair}" after its \`#\`, which is no <name>=<value>`);
    }
    parameters[pair.slice(0, equals)] = pair.slice(equals + 1);
  }
  return { entry, logicalName, parameters: Object.freeze(parameters) };
}

/**
 * The entries of the state directory of a template, as they are named there.
 * Throws `FixtureError` for an entry whose logical name is not of the layout
 * table of feature 100 — a template cannot invent a name, and cannot hold a path.
 */
export function stateFilesOfTemplate(templateDirectory: string): readonly string[] {
  const directory = join(templateDirectory, TEMPLATE_STATE_DIRECTORY);
  if (!existsSync(directory)) return [];
  const names: string[] = [];
  for (const entry of readdirSync(directory)) {
    if (!holdsLogicalName(splitTemplateStateName(entry).logicalName)) {
      throw new FixtureError(
        `${templateDirectory}/${TEMPLATE_STATE_DIRECTORY}/${entry}`,
        "is no logical name of the layout table of feature 100: a file of state in a template " +
          "is named by its logical name, so that the oracle can lay it out per side (F141-FR-012)",
      );
    }
    names.push(entry);
  }
  return names;
}

/** Which side a file of state is laid out for. */
export type Side = "reference" | "port";

/**
 * F141-FR-012 — where a file of state of a template goes on one side.
 *
 * On the **reference** it goes to the as-is path, which is the row of the
 * compared table of `layout-old-side.json` of feature 100 for that logical
 * name. On the **port** it goes to the path the layout table of feature 100
 * gives the name, resolved with the roots and parameters of the run.
 */
export function layOutStateFile(
  logicalName: string,
  side: Side,
  options: {
    readonly parameters?: Readonly<Record<string, string | number>>;
    readonly roots?: Readonly<Record<string, string>>;
  } = {},
): string {
  if (!holdsLogicalName(logicalName)) {
    throw new FixtureError(logicalName, "is no logical name of the layout table of feature 100");
  }
  if (side === "port") {
    return resolveLogicalName(logicalName, options.parameters ?? {}, options.roots ?? {});
  }
  const asIs = asIsPathOf(logicalName);
  if (asIs === undefined) {
    throw new FixtureError(
      logicalName,
      "has no as-is path in the compared table of `layout-old-side.json`: state that the " +
        "reference does not read in the as-is form comes from steps of the scenario, not from " +
        "the template (F141-FR-012)",
    );
  }
  return asIs;
}

/**
 * The as-is path of a logical name, from the compared table of feature 100
 * (`layout-old-side.json`, `comparedRows`). The table is read and never copied.
 * A row may name several as-is paths and may qualify the logical name; the
 * first as-is path of the first row whose logical name matches is the path.
 */
export function asIsPathOf(logicalName: string): string | undefined {
  const bare = (cell: string): string[] =>
    cell
      .split(",")
      .map((part) => part.trim().replace(/^`|`$/g, "").trim())
      .filter((part) => part !== "");
  for (const row of comparedRows) {
    const names = bare(row.logicalName).map((n) => n.replace(/\s*\(.*\)$/, "").trim());
    if (names.includes(logicalName)) {
      const paths = bare(row.asIsPath);
      if (paths[0] !== undefined) return paths[0];
    }
  }
  return undefined;
}

/** Every logical name the compared table of feature 100 gives an as-is path. */
export function logicalNamesWithAnAsIsPath(): readonly string[] {
  const names = new Set<string>();
  for (const row of comparedRows) {
    for (const cell of row.logicalName.split(",")) {
      const name = cell
        .trim()
        .replace(/^`|`$/g, "")
        .replace(/\s*\(.*\)$/, "")
        .replace(/`/g, "")
        .trim();
      if (name !== "" && holdsLogicalName(name)) names.add(name);
    }
  }
  return [...names];
}

// ---------------------------------------------------------------------------
// No physical path of the port's state
// ---------------------------------------------------------------------------

/**
 * The hermetic root environment a fixture is checked against. It is only used
 * to compute where the port's state would lie; no run happens here.
 */
export const CHECKED_PORT_ENVIRONMENT: RootEnvironment = Object.freeze({
  home: "<HOME>",
  workspaceRealPath: "<WORK>",
  workspaceId: "<WORKSPACE-ID>",
});

/**
 * The paths at which the port keeps state, for the environment given. Computed
 * from the roots of feature 100 (`@specstride/contracts/ids/roots`) and never
 * written down here: a fixture is refused for naming one of them, so a copy in
 * this file would be the very thing the rule forbids.
 */
export function portStateRoots(env: RootEnvironment = CHECKED_PORT_ENVIRONMENT): readonly string[] {
  return [
    userConfigRoot(env),
    userStateRoot(env),
    userCacheRoot(env),
    controlRoot(env).path,
    workerRoot(env),
    workspacePart(env),
  ];
}

/**
 * The path fragments that mark a physical path of the port's state, whatever
 * the home and the workspace are: the tails of the roots of feature 100 that
 * are the part a fixture would have to write down.
 *
 * A fragment of ONE segment is left out, and so is the bare name `.specstride`.
 * `.specstride` is also the as-is name of the legacy state directory of the
 * Specstride baseline (the items B-0870 and B-1506 of `layout-old-side.json`,
 * DV-036), so a marker of that name would refuse the reference's own path. The
 * workspace part of the port is caught through `portStateRoots`, which gives it
 * as an absolute path for the environment of the run.
 */
export function portStateMarkers(): readonly string[] {
  const markers = new Set<string>();
  for (const root of portStateRoots()) {
    const parts = root.split("/").filter((p) => p !== "" && !p.startsWith("<"));
    for (let i = 0; i < parts.length; i += 1) {
      const fragment = parts.slice(i).join("/");
      if (fragment.includes("specstride") && fragment.includes("/")) markers.add(fragment);
    }
  }
  return [...markers];
}

/**
 * F141-FR-012 — "a fixture MUST hold no physical path of the port's state".
 *
 * Every string of the declaration — the command lines of both sides, the
 * declared variables, the template, the asset paths, the prerequisites — is
 * read, and a string that holds a path of the port's state refuses the fixture.
 * State of the port is reached by logical name only.
 */
export function assertNoPhysicalPortStatePath(
  declaration: FixtureDeclaration,
  env: RootEnvironment = CHECKED_PORT_ENVIRONMENT,
): void {
  const markers = new Set([
    ...portStateMarkers(),
    // The roots of the run itself, where they are real paths and not the
    // placeholders of `CHECKED_PORT_ENVIRONMENT`.
    ...portStateRoots(env).filter((root) => !root.includes("<")),
  ]);
  for (const [where, text] of stringsOfDeclaration(declaration)) {
    for (const marker of markers) {
      if (!text.includes(marker)) continue;
      throw new FixtureError(
        `${declaration.id} (${where})`,
        `holds the physical path of the port's state \`${marker}\`; a fixture reaches state ` +
          "of the port by its logical name only (F141-FR-012)",
      );
    }
  }
}

/** Every string of a declaration, with where it stands, for the path check. */
function stringsOfDeclaration(
  declaration: FixtureDeclaration,
): readonly (readonly [string, string])[] {
  const strings: (readonly [string, string])[] = [];
  const push = (where: string, value: unknown): void => {
    if (typeof value === "string") strings.push([where, value] as const);
  };
  push("workdirTemplate", declaration.workdirTemplate);
  push("entryPoint.reference", declaration.entryPoint?.reference);
  push("entryPoint.port", declaration.entryPoint?.port);
  for (const side of ["reference", "port"] as const) {
    for (const argument of declaration.command?.[side] ?? []) push(`command.${side}`, argument);
  }
  for (const [name, value] of Object.entries(declaration.environment ?? {})) {
    push(`environment.${name}`, value);
  }
  for (const asset of declaration.assets ?? []) push("assets", asset.path);
  for (const prerequisite of declaration.prerequisites ?? []) push("prerequisites", prerequisite);
  for (const [stub, steps] of Object.entries(declaration.stubs ?? {})) {
    for (const [index, step] of steps.entries()) {
      for (const [key, value] of Object.entries(
        (step as { args?: Record<string, unknown> }).args ?? {},
      )) {
        push(`stubs.${stub}[${index}].args.${key}`, value);
      }
    }
  }
  return strings;
}

// ---------------------------------------------------------------------------
// Imported as-is assets and their licence notice
// ---------------------------------------------------------------------------

/** Where the imported as-is assets of the baselines live. */
export const ASSETS_DIRECTORY = join(ORACLE_ROOT, "fixtures", "assets");

/** The licence notice of the imported assets (F141-FR-012, CQ-030). */
export const ASSET_NOTICE_FILE = join(ASSETS_DIRECTORY, "NOTICE");

/**
 * The baselines an asset may come from, as the schema of `fixture.json` names
 * them: the system and the short form of its pinned commit. Built from
 * `reference/pins.json`, so the oracle has one source for the commits.
 */
export function assetBaselines(): readonly string[] {
  return pins.map((p) => `${p.system}@${p.commit.slice(0, 7)}`);
}

/** One entry of the licence notice: a baseline, its licence and what was imported. */
export type NoticeEntry = {
  readonly baseline: string;
  readonly licence: string;
  readonly holder: string;
};

/**
 * The licence notice, read from `fixtures/assets/NOTICE`. The notice is the
 * record of the import: one entry per baseline, with the licence the baseline
 * carries. It is parsed, not merely present, so that an asset can be held to it.
 */
export function readAssetNotice(file: string = ASSET_NOTICE_FILE): readonly NoticeEntry[] {
  if (!existsSync(file)) {
    throw new FixtureError(file, "is missing: imported as-is assets carry their licence notice");
  }
  const entries: NoticeEntry[] = [];
  for (const line of readFileSync(file, "utf8").split("\n")) {
    // `| baseline | licence | holder |` — the table of the notice.
    const match = /^\|\s*`([^`]+)`\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/.exec(line);
    if (match === null) continue;
    const [, baseline, licence, holder] = match as unknown as [string, string, string, string];
    entries.push({ baseline, licence, holder });
  }
  if (entries.length === 0) {
    throw new FixtureError(file, "holds no entry: the notice names a licence per baseline");
  }
  return entries;
}

/** The licence the notice records for a baseline, or `undefined` for a baseline it has not got. */
export function licenceOfBaseline(
  baseline: string,
  file: string = ASSET_NOTICE_FILE,
): string | undefined {
  return readAssetNotice(file).find((entry) => entry.baseline === baseline)?.licence;
}

/**
 * F141-FR-012 — every imported as-is asset carries the licence notice of its
 * baseline. An asset whose baseline is not in the notice, or whose `licence`
 * differs from the one the notice records, refuses the fixture.
 */
export function assertAssetsCarryTheirNotice(
  declaration: FixtureDeclaration,
  file: string = ASSET_NOTICE_FILE,
): void {
  const assets = declaration.assets ?? [];
  if (assets.length === 0) return;
  const notice = readAssetNotice(file);
  const baselines = new Set(assetBaselines());
  for (const asset of assets) {
    if (!baselines.has(asset.baseline)) {
      throw new FixtureError(
        `${declaration.id} (assets)`,
        `${asset.path} names the baseline ${asset.baseline}, which is no pinned baseline of the oracle`,
      );
    }
    const entry = notice.find((e) => e.baseline === asset.baseline);
    if (entry === undefined) {
      throw new FixtureError(
        `${declaration.id} (assets)`,
        `${asset.path} comes from ${asset.baseline}, which the licence notice does not record ` +
          `(${ASSET_NOTICE_FILE})`,
      );
    }
    if (entry.licence !== asset.licence) {
      throw new FixtureError(
        `${declaration.id} (assets)`,
        `${asset.path} declares the licence ${asset.licence}, and the notice records ` +
          `${entry.licence} for ${asset.baseline}`,
      );
    }
  }
}

/**
 * §O.7, F141-FR-029 — the as-is assets of the locally registered backend of the
 * baseline are not imported. The name of that entry is found at run time, as
 * the entries of the reference registry minus the entries with as-is behaviour
 * that the product carries, and this module holds it nowhere: the caller passes
 * it in, and the refusal names the asset and not the entry.
 */
export function assertAssetIsNotOfTheEntryNotCarried(
  asset: AsIsAsset,
  entryFoundAtRunTime: string,
): void {
  if (entryFoundAtRunTime === "") return;
  const needle = entryFoundAtRunTime.toLowerCase();
  if (asset.path.toLowerCase().includes(needle)) {
    throw new FixtureError(
      asset.path,
      "belongs to the registry entry of the baseline that the product does not carry; its " +
        "as-is assets are not imported (§O.7, F141-FR-029)",
    );
  }
}

/**
 * F141-FR-012 — an asset is imported UNCHANGED. Given the bytes of the as-is
 * file and the bytes of the imported asset, this is what says so.
 */
export function assetIsUnchanged(asIs: Uint8Array, imported: Uint8Array): boolean {
  if (asIs.length !== imported.length) return false;
  for (let i = 0; i < asIs.length; i += 1) if (asIs[i] !== imported[i]) return false;
  return true;
}

/**
 * Read an imported asset back off disk, by the path a declaration gives it. The
 * assets lie under `fixtures/assets/<baseline>/<path>`, so that the baseline an
 * asset came from is part of where it lies and cannot be lost.
 */
export function importedAssetPath(asset: AsIsAsset): string {
  return join(ASSETS_DIRECTORY, asset.baseline, asset.path);
}

/** True when the asset the declaration names has been imported. */
export function assetIsImported(asset: AsIsAsset): boolean {
  const path = importedAssetPath(asset);
  return existsSync(path) && statSync(path).isFile();
}

/** Re-exported so one import gives a caller the declaration check and its error. */
export { OracleDataError, validateFixtureDeclaration };
