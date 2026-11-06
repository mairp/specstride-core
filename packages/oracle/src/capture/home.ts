/**
 * T048 — the surface `home` (S-13, F141-FR-019).
 *
 * "The hermetic home and the temporary directory after the run: path, type, link
 * target, content." Not the mode: a home is made fresh per run by the oracle
 * itself, so its own bits are no behaviour of either side; what a run WROTE into
 * it is. The rules of §O.4 for this surface are N-01 and N-08 — the paths become
 * placeholders and generated names are replaced — and they are applied by the
 * normalizer, not here.
 *
 * The surface exists because a run that writes a profile, a settings file or a
 * cache into the home of the user is doing something the other side may not do:
 * the plugin installer stub writes the profile entry of the fixture here, and the
 * dsh overlay of FX-39 is read here.
 */
import { assertTheRunHasEnded, type CaptureContext, type SurfaceCapture } from "./types.ts";
import { walkTree, type TreeEntry } from "./tree.ts";

/** The value of the surface `home`. */
export type HomeCapture = {
  readonly home: readonly TreeEntry[];
  readonly temporaryDirectory: readonly TreeEntry[];
};

/** One entry of a home or temporary directory: no mode, as §O.4 states the fields. */
function withoutMode(entry: TreeEntry): TreeEntry {
  const { mode: _mode, ...rest } = entry;
  return rest as TreeEntry;
}

/** Capture the surface `home`: the hermetic home and the temporary directory. */
export function captureHome(
  context: CaptureContext,
): SurfaceCapture & { readonly value: HomeCapture } {
  assertTheRunHasEnded(context, "home");
  return {
    surface: "home",
    id: "S-13",
    value: {
      home: Object.freeze(walkTree(context.home).map(withoutMode)),
      temporaryDirectory: Object.freeze(walkTree(context.temporaryDirectory).map(withoutMode)),
    },
  };
}
