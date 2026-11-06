/**
 * The entry point of the fixture directory of EP-02 (`fake-binary.mjs`,
 * `fake-endpoint.ts`), which the harness tests import by relative path.
 *
 * The gate command `npm test --workspace @specstride/testkit --
 * conformance/EP-02 samples/EP-02` hands this directory to `node --test` as a
 * positional argument; the runner then starts the directory as an entry, which
 * resolves through this index (ESM, via the package's `type: "module"`). It
 * exports the fixture surface so the started entry exits 0 and the directory
 * counts as a passing test.
 */
export const EP02_FIXTURES = Object.freeze({
  fakeBinary: "./fake-binary.mjs",
  fakeEndpoint: "./fake-endpoint.ts",
});
