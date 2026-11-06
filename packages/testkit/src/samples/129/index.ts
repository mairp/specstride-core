/**
 * T009 of feature 129 — the samples of this feature, registered FROM THE TEST
 * TREE (F129-FR-036; annex A §A.4, F100-FR-018).
 *
 * The directory is `129` and not `EP-09`: `src/samples/EP-09/` holds feature
 * 100's sample of the point, which its own frame registers. This directory
 * holds the SECOND implementation of the read model, the sample renderer and
 * the fake clock, which feature 129's conformance suite registers and runs
 * beside the product implementation.
 */
import { registryOf, type RegistrationOutcome } from "../../conformance/frame.ts";
import { implementation as secondReadModel } from "./second-read-model.ts";

export { fakeClock, EPOCH, type FakeClock } from "./fake-clock.ts";
export {
  FAILURE_LINE,
  FORBIDDEN_IMPORTS_OF_A_RENDERER,
  renderViewJson,
  type RenderOutcome,
} from "./sample-renderer.ts";
export {
  IMPLEMENTATION_ID,
  comparable,
  implementation as secondReadModel,
  operations as secondReadModelOperations,
  type SecondView,
} from "./second-read-model.ts";

/** The point the samples of this feature belong to. */
export const POINT_ID = "specstride.view/1" as const;

/**
 * Register the second implementation of the read model with the registry of
 * EP-09, from the test tree. No core file names it.
 */
export function registerSecondReadModel(root?: string): RegistrationOutcome {
  return registryOf(POINT_ID, root).register(secondReadModel);
}
