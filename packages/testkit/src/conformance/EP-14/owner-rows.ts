/**
 * The rows of ONE host that the owner claims of EP-14 take as their input:
 * the marker of the host's own package — one substring that must not appear
 * in an import of the doctor — and the ids of the doctor checks the host
 * registers (the rows of group `host` of the doctor's catalogue, CT-112-112
 * of the doctor's own suite).
 *
 * The claims of `./owner-claims.ts` are claims about the doctor of this
 * repository (F112-FR-033): the doctor holds no file of a check another
 * feature registers, and it imports no package of an owner. Which checks and
 * which packages count as owners is half the doctor's own data (the core
 * owners below, built in) and half the host's — and the host's half is INPUT,
 * never a constant of this kit, exactly as the target of the host conformance
 * suite of EP-01 is input (`./../EP-01/targets.ts`). The kit ships a sample
 * (`SAMPLE_HOST_OWNER_ROWS`) for its own tests; a host package passes its own
 * rows from its own test tree.
 */
import { HARNESS_CUSTOMISATION_CHECK, TERMINAL_TOOL_CHECK } from "./owner-stubs.ts";

/** The rows of one host: the marker of its package, and the checks it registers. */
export type HostOwnerRows = {
  /** A substring of the host's package that no import of the doctor may match. */
  readonly packageMarker: string;
  /** The ids of the doctor checks the host registers, in the order it registers them. */
  readonly doctorCheckIds: readonly string[];
};

/**
 * A sample host for this kit's own tests: no host of this repository is
 * named. The claims run against the doctor with these rows in the kit's own
 * suite, and a host package runs them again with its own rows.
 */
export const SAMPLE_HOST_OWNER_ROWS: HostOwnerRows = Object.freeze({
  packageMarker: "sample-host-plain-shell",
  doctorCheckIds: Object.freeze(["sample.host-check"]),
});

/**
 * The ids of the checks other CORE features register (their code lives in
 * their owners here): the two stubs of the test tree (`./owner-stubs.ts`) and
 * the toolchain pattern check of the pipeline feature.
 */
export const CORE_OWNER_CHECK_IDS: readonly string[] = Object.freeze([
  HARNESS_CUSTOMISATION_CHECK.id,
  TERMINAL_TOOL_CHECK.id,
  "toolchain.patterns",
]);

/** The markers of the packages of core owners, which the doctor never imports. */
export const CORE_OWNER_PACKAGE_MARKERS: readonly string[] = Object.freeze([
  "testkit",
  "tree-store",
  "layer-parallel",
  "pipeline/src",
  "integrity/src",
  "runtime/src",
  "adapter-",
  "packages/harness/",
  "owner-stubs",
]);

/**
 * The built-in forbidden imports of the boundary claim of the sample check
 * (CT-112-207 (4)): the packages and trees the doctor never imports when a
 * check of another feature is registered. The host's own marker joins these
 * at the end.
 */
export const SAMPLE_CHECK_FORBIDDEN_IMPORTS: readonly string[] = Object.freeze([
  "samples/EP-14",
  "testkit",
  "layer-parallel",
  "tree-store",
  "runtime/src",
  "pipeline/src",
  "integrity/src",
  "adapter-",
]);

/**
 * The ids the place-of-a-check claims hold the doctor against: the core
 * owners' ids first, then the host's, in the order the host gave them.
 */
export function ownerCheckIdsOf(host: HostOwnerRows): readonly string[] {
  return Object.freeze([...CORE_OWNER_CHECK_IDS, ...host.doctorCheckIds]);
}

/**
 * The markers of the owner packages the doctor never imports: the core
 * owners' markers first, then the host's own package marker.
 */
export function ownerPackageMarkersOf(host: HostOwnerRows): readonly string[] {
  return Object.freeze([...CORE_OWNER_PACKAGE_MARKERS, host.packageMarker]);
}

/**
 * The forbidden imports of the sample check's boundary claim: the built-in
 * ones first, then the host's own package marker.
 */
export function forbiddenImportsOfSampleCheck(host: HostOwnerRows): readonly string[] {
  return Object.freeze([...SAMPLE_CHECK_FORBIDDEN_IMPORTS, host.packageMarker]);
}
