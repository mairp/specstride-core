/**
 * The required entry of the criterion at `packages/testkit/src/conformance/EP-02/`.
 * The implementation lives at `packages/testkit/conformance/EP-02/fake-endpoint.ts`
 * (F100-FR-220 keeps every listener out of a Wave-1 package's source tree); this
 * entry re-exports it in place.
 */
export * from "../../../conformance/EP-02/fake-endpoint.ts";
