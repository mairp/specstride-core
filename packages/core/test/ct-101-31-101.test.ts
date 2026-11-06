/**
 * CT-101-31 (T113 of feature 101) — the discovery hook of the own test.
 *
 * T113 mandates the path `packages/core/test/101/ct-101-31-diagnostician-form.test.ts`,
 * and that is where the test lives. The own runner `tests/own.ts` discovers a
 * package test of feature 101 by the NAME `*-101.test.ts`, which that mandated
 * path does not match, so this file carries the matching name and imports it.
 * The shared runner is deliberately not edited: its discovery rule belongs to
 * every feature.
 */
import "./101/ct-101-31-diagnostician-form.test.ts";
