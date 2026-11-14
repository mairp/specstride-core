/**
 * The environment an engine test that launches `runFeature` must pin, so an
 * outer Specstride run (which leaks `SPECSTRIDE_*` variables and `STUB_DIR`)
 * cannot steer the inner run away from the fixture's stub or its bounds.
 *
 * `pinEngineEnv` saves what it changes and returns a `restore` that puts
 * every variable back and removes its scratch directory. Callers that also
 * pin `HOME`/`PATH` keep doing that themselves; call `restore` inside their
 * own restore (or a `finally`).
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type EngineEnvPins = {
  /** The feature directory name under `specs/`; omit to leave it unset. */
  readonly feature?: string;
};

export function pinEngineEnv(pins: EngineEnvPins = {}): () => void {
  const before = {
    FEATURE: process.env.SPECSTRIDE_FEATURE,
    PROPOSER: process.env.SPECSTRIDE_PROPOSER,
    CRITIC: process.env.SPECSTRIDE_CRITIC,
    PAUSE: process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC,
    LIMITS: process.env.SPECSTRIDE_LIMITS,
    STUB_DIR: process.env.STUB_DIR,
  };
  // The stub `claude` on the fixture's `PATH` is both the proposer and the
  // critic: the harness env of an outer run (which names a dsh model for
  // both) must not leak in, or a real model runs instead of the stub.
  process.env.SPECSTRIDE_PROPOSER = "claude";
  process.env.SPECSTRIDE_CRITIC = "claude";
  process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC = "0";
  // The bounds of the run are the engine's defaults (the reject limit of 3
  // in particular): an outer run may run with `SPECSTRIDE_LIMITS=off`, which
  // would leave a rejecting critic looping for ever.
  delete process.env.SPECSTRIDE_LIMITS;
  if (pins.feature !== undefined) process.env.SPECSTRIDE_FEATURE = pins.feature;
  else delete process.env.SPECSTRIDE_FEATURE;
  // Stubs write the prompts they saw to a scratch directory outside the work
  // tree, so no later critic prompt quotes them as part of the diff.
  const scratch = mkdtempSync(join(tmpdir(), "specstride-engine-test-"));
  process.env.STUB_DIR = scratch;
  return () => {
    const put = (name: string, value: string | undefined): void => {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    };
    put("SPECSTRIDE_FEATURE", before.FEATURE);
    put("SPECSTRIDE_PROPOSER", before.PROPOSER);
    put("SPECSTRIDE_CRITIC", before.CRITIC);
    put("SPECSTRIDE_PROPOSER_PAUSE_SEC", before.PAUSE);
    put("SPECSTRIDE_LIMITS", before.LIMITS);
    put("STUB_DIR", before.STUB_DIR);
    rmSync(scratch, { recursive: true, force: true });
  };
}
