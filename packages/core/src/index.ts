// @specstride/core: skeleton; the owning features (101, 149, 103, 117, 118, 102; module groups of 142 and 143 under src/parallel/) fill it.
// T144 — the rows of the report (feature 153, F153-FR-040) are reachable
// from the package barrel, in the way src/gate/index.ts is exported.
export * as report from "./report/index.ts";
// T279 — the scoped in-pass selection of the inner check set (feature 153,
// F153-FR-045 to F153-FR-047) is reachable from the package barrel, in the
// way src/gate/index.ts is exported.
export * as checks from "./checks/index.ts";


