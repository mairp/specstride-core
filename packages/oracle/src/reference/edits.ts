/**
 * T131 — the as-is edits a fixture applies to a PRIVATE WRITABLE COPY of the
 * reference tree (F141-FR-002, F141-FR-012, F141-FR-014).
 *
 * Why this exists. Two behaviours of the Specstride baseline are reachable only
 * through its backend REGISTRY, and the registry is a hard-coded tuple in
 * `lib/backends.py`:
 *
 * - **the declared overlay of the configuration home** (FX-39). `lib/backend_overlay.py`
 *   derives its declaration table from the registry (`DECLARATIONS = {b.name: b.overlay
 *   for b in backends.REGISTRY if b.overlay is not None}`) and says so itself: "In
 *   the shipped tree no registry entry sets `overlay`, so the table is empty and
 *   every backend runs exactly as before." Without a declaration the scopes
 *   `pass` and `attempt`, population and removal cannot be reached at all.
 * - **a routed stream format** (the three fallbacks of FX-26). `STREAM_FORMAT`
 *   comes from `stream=` of a registry entry (`proposer.sh:332`), and no shipped
 *   entry sets it, so the block that writes the three fallback reasons never runs.
 *
 * The baseline's own end-to-end test does exactly this: `lib/test_stream_route_e2e.py`
 * copies the tracked tree and applies "the quickstart's three edits (SC-001)" — an
 * adapter module, one import plus one row inside the marked seam block of
 * `lib/agent_stream.py`, and a `stream=` value on a registry entry — and
 * `test_degrade_tap_missing` additionally DELETES `lib/agent_stream.py` from the
 * copy. So the edits below are not an invention of the oracle: they are the way
 * the baseline itself reaches these behaviours, written as data of the fixture.
 *
 * The pinned tree is NEVER written. The copy lives under the run root, which is
 * thrown away with the run, so `checkTreeUnchanged` still passes after every run
 * (F141-FR-002). Every edit must match EXACTLY ONCE: an edit that matches nothing
 * would silently capture the unedited behaviour, and an edit that matches twice
 * would depend on which occurrence came first.
 *
 * The edits are of the REFERENCE side only. The port carries its own registry and
 * reaches the same behaviour through ordinary configuration (feature 109); the
 * oracle never writes into the port's tree and never invents an entry for it.
 */
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";

/** A fixture asked for an edit the reference tree cannot take. */
export class ReferenceEditError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReferenceEditError";
  }
}

/** The four edits a fixture may declare, each named by its verb. */
export const REFERENCE_EDIT_VERBS = Object.freeze([
  "insert-before",
  "replace",
  "copy-asset",
  "remove",
] as const);
export type ReferenceEditVerb = (typeof REFERENCE_EDIT_VERBS)[number];

/** One edit of the copy of the reference tree, as the fixture declares it. */
export type ReferenceEdit = {
  readonly edit: ReferenceEditVerb;
  /** The file of the reference tree the edit acts on, relative to its root. */
  readonly file: string;
  /** `insert-before`: the text the insertion stands before. */
  readonly marker?: string;
  /** `replace`: the text that is replaced. */
  readonly find?: string;
  /** `insert-before` and `replace`: what is put there. */
  readonly text?: string;
  /** `copy-asset`: the imported as-is asset, relative to `fixtures/assets/`. */
  readonly asset?: string;
  /** Why the scenario needs the edit, for the reader of the fixture. */
  readonly why?: string;
};

/** The edits a declaration carries, or none. */
export function referenceEditsOf(
  fixture: Readonly<Record<string, unknown>>,
): readonly ReferenceEdit[] {
  const declared = fixture["referenceEdits"];
  if (declared === undefined) return Object.freeze([]);
  if (!Array.isArray(declared) || declared.length === 0) {
    throw new ReferenceEditError(
      `referenceEdits is declared and is no non-empty list; a scenario that needs no edit of ` +
        `the reference tree names the field not at all`,
    );
  }
  return Object.freeze(declared as ReferenceEdit[]);
}

/** A path of the edit, resolved under a root and refused when it would leave it. */
function inside(root: string, relative: string, what: string): string {
  if (relative === "" || isAbsolute(relative) || relative.split("/").includes("..")) {
    throw new ReferenceEditError(
      `${what}: '${relative}' is no relative path inside the tree; an edit never names an ` +
        `absolute path and never leaves the tree`,
    );
  }
  const path = resolve(join(root, relative));
  if (!path.startsWith(`${resolve(root)}/`)) {
    throw new ReferenceEditError(`${what}: '${relative}' would leave ${root}`);
  }
  return path;
}

/** Apply one edit to the copy. */
function applyOne(root: string, assetsDirectory: string, edit: ReferenceEdit): string {
  const what = `${edit.edit} ${edit.file}`;
  if (!REFERENCE_EDIT_VERBS.includes(edit.edit)) {
    throw new ReferenceEditError(
      `'${String(edit.edit)}' is no edit of the reference tree; the verbs are ` +
        `${REFERENCE_EDIT_VERBS.join(", ")}`,
    );
  }
  const path = inside(root, edit.file, what);

  if (edit.edit === "copy-asset") {
    if (edit.asset === undefined) {
      throw new ReferenceEditError(`${what}: copy-asset names no asset`);
    }
    const asset = inside(assetsDirectory, edit.asset, what);
    if (!existsSync(asset)) {
      throw new ReferenceEditError(
        `${what}: the imported asset ${edit.asset} is not under fixtures/assets/ ` +
          `(F141-FR-012: an as-is file of a baseline is an imported asset with its licence notice)`,
      );
    }
    mkdirSync(dirname(path), { recursive: true });
    cpSync(asset, path);
    return `${what} from assets/${edit.asset}`;
  }

  if (edit.edit === "remove") {
    if (!existsSync(path)) {
      throw new ReferenceEditError(
        `${what}: the file is not in the reference tree, so removing it would change nothing`,
      );
    }
    rmSync(path, { recursive: true, force: true });
    return what;
  }

  if (!existsSync(path) || !statSync(path).isFile()) {
    throw new ReferenceEditError(`${what}: the file is no regular file of the reference tree`);
  }
  const before = readFileSync(path, "utf8");
  const needle = edit.edit === "replace" ? edit.find : edit.marker;
  if (needle === undefined || needle === "") {
    throw new ReferenceEditError(
      `${what}: the edit names no ${edit.edit === "replace" ? "find" : "marker"} text`,
    );
  }
  const occurrences = before.split(needle).length - 1;
  if (occurrences !== 1) {
    throw new ReferenceEditError(
      `${what}: the text it names occurs ${String(occurrences)} times and must occur exactly ` +
        `once; an edit that matches nothing would capture the UNEDITED behaviour and an edit ` +
        `that matches twice would depend on which occurrence came first`,
    );
  }
  const text = String(edit.text ?? "");
  const after =
    edit.edit === "replace" ? before.replace(needle, text) : before.replace(needle, text + needle);
  writeFileSync(path, after, "utf8");
  return what;
}

/**
 * A private writable copy of the reference tree with the fixture's edits applied,
 * under `destination`. The source tree is only READ.
 */
export function editedReferenceTree(options: {
  readonly referenceRoot: string;
  readonly destination: string;
  readonly edits: readonly ReferenceEdit[];
  readonly assetsDirectory: string;
}): { readonly root: string; readonly applied: readonly string[] } {
  const source = resolve(options.referenceRoot);
  const destination = resolve(options.destination);
  if (destination === source || destination.startsWith(`${source}/`)) {
    throw new ReferenceEditError(
      `the copy ${destination} would lie inside the reference tree ${source}; a fixture never ` +
        `changes the reference tree (F141-FR-002)`,
    );
  }
  if (existsSync(destination)) {
    throw new ReferenceEditError(`the copy ${destination} already exists`);
  }
  mkdirSync(destination, { recursive: true });
  cpSync(source, destination, { recursive: true, dereference: false });
  // The pinned tree is read-only; the copy is the fixture's own.
  execFileSync("chmod", ["-R", "u+w", destination]);

  const applied: string[] = [];
  for (const edit of options.edits) {
    applied.push(applyOne(destination, resolve(options.assetsDirectory), edit));
  }
  return { root: destination, applied: Object.freeze(applied) };
}
