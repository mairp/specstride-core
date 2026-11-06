/**
 * The runner hook of CT-123-110: `node --test` discovers `*.test.*` files,
 * so this file only imports the module that registers the tests of the
 * conformance test of EP-19 (`stage-kind.ts`, T071 of feature 123).
 */
import "./stage-kind.ts";
