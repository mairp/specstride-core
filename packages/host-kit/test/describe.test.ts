/**
 * T005 — the capability-description shape, as the host kit holds it: the six
 * capabilities a host declares with their values and their declared fallbacks,
 * and the `describe` that composes them into the `HostDescription` of the port
 * (`specstride.host/1`, annex H §H.1). The shape moved here from
 * `packages/host-claude-code/src/describe/index.ts` in the split of the
 * monorepo (U-1 and U-2 of `specs/120-host-dsh`); the tests that hold the
 * Claude Code host's OWN declarations — its four hook events, its pin, its
 * 1,536-character cap — stayed there, because they are facts of that host.
 *
 * What is proved here is proved for ANY host: every function takes the host's
 * declarations and rendering as its input, and the kit holds none of its own.
 * The host of these tests is a SAMPLE ("plain-shell", a second spelling of a
 * host in the sense of the phase gate), not the Claude Code plugin:
 *
 *  1. The factory reads the `Values` column and the declared fallback of a
 *     capability from `@specstride/contracts/ep/host` — never spelled out by a
 *     caller — and carries the host's own facts as given.
 *  2. An absent capability uses its DECLARED fallback of the annex, and the
 *     fallback of a present one is refused.
 *  3. An unknown capability is IGNORED, never an error.
 *  4. `describeOf` composes the port's shape from the declarations, with the
 *     rendering data the host passes.
 *  5. A second host's declarations change only the data that host passes —
 *     the same kit code shapes both — and the output of either names no fact
 *     of the other.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CAPABILITIES,
  DOCTOR_SKILL_ID,
  HOST_SKILL_IDS,
  capabilityRows,
  fallbackOf,
} from "@specstride/contracts/ep/host";
import {
  SKILL_IDS,
  absentCapabilities,
  capabilityDeclaration,
  capabilitiesAreUnverified,
  declarationOf,
  describeCapabilities,
  describeOf,
  fallbackInUse,
  fallbacksInUse,
  ignoredCapabilities,
  isKnownCapability,
  presentCapabilities,
  valuesColumnOf,
} from "../src/describe.ts";

/** The directory this file lies in, so the source of the kit is found by path. */
const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * The sample host "plain-shell": no hook events at all, a background primitive
 * of its own, no model, a writable control root — in every column a DIFFERENT
 * host from the Claude Code plugin the shape moved out of.
 */
const PLAIN_SHELL_FACT = "capabilities-of-the-plain-shell-host";
const PLAIN_SHELL_PIN = "plain-shell@0.1.0";
const PLAIN_SHELL_RENDERING = {
  skillNamingRule:
    "one file per skill in a flat `skills/` directory, named after the skill; no prefix",
  descriptionCap: 500,
  packagingForm: "a directory of shell scripts",
} as const;

function plainShellDeclarations() {
  return Object.freeze([
    capabilityDeclaration({
      capability: "hooks",
      present: false,
      value: null,
      absentBecause: "the host runs a command to completion and injects nothing while it runs",
      requirement: "SAMPLE-PLAIN-SHELL-FR-1",
      hostFact: PLAIN_SHELL_FACT,
      pin: PLAIN_SHELL_PIN,
    }),
    capabilityDeclaration({
      capability: "statusSurface",
      present: false,
      value: null,
      absentBecause: "the host prints nothing between the lines of the CLI",
      requirement: "SAMPLE-PLAIN-SHELL-FR-1",
      hostFact: PLAIN_SHELL_FACT,
      pin: PLAIN_SHELL_PIN,
    }),
    capabilityDeclaration({
      capability: "background",
      present: true,
      value: "the host runs a command to completion",
      absentBecause: null,
      requirement: "SAMPLE-PLAIN-SHELL-FR-2",
      hostFact: PLAIN_SHELL_FACT,
      pin: PLAIN_SHELL_PIN,
    }),
    capabilityDeclaration({
      capability: "evals",
      present: false,
      value: null,
      absentBecause: "the host ships no suite runner of its own",
      requirement: "SAMPLE-PLAIN-SHELL-FR-3",
      hostFact: PLAIN_SHELL_FACT,
      pin: PLAIN_SHELL_PIN,
    }),
    capabilityDeclaration({
      capability: "model",
      present: false,
      value: null,
      absentBecause: "the host runs a plain shell and offers no model",
      requirement: "SAMPLE-PLAIN-SHELL-FR-4",
      hostFact: PLAIN_SHELL_FACT,
      pin: PLAIN_SHELL_PIN,
    }),
    capabilityDeclaration({
      capability: "stateRootWritable",
      present: true,
      value: "yes",
      absentBecause: null,
      requirement: "SAMPLE-PLAIN-SHELL-FR-5",
      hostFact: PLAIN_SHELL_FACT,
      pin: PLAIN_SHELL_PIN,
    }),
  ]);
}

test("T005: the kit factory declares the six capabilities, in the order of the annex", () => {
  const declarations = plainShellDeclarations();
  assert.equal(declarations.length, 6, "annex H §H.1 has six capabilities");
  assert.deepEqual(
    declarations.map((d) => d.capability),
    [...CAPABILITIES],
  );
  // Every declaration carries the `Values` column of the annex, verbatim, and
  // the declared fallback — both read from the contracts, never spelled out by
  // the caller, which passed neither.
  for (const declaration of declarations) {
    const row = capabilityRows.find((r) => r.capability === declaration.capability);
    assert.notEqual(row, undefined);
    assert.equal(declaration.values, row?.values);
    assert.equal(declaration.fallback, fallbackOf(declaration.capability));
    // What the host passed is carried as given: its own requirement id, its
    // own verification-record row, its own pin.
    assert.equal(declaration.hostFact, PLAIN_SHELL_FACT);
    assert.equal(declaration.pin, PLAIN_SHELL_PIN);
    assert.match(declaration.requirement, /^SAMPLE-PLAIN-SHELL-FR-/);
    // A present one names a value and no reason; an absent one the reverse.
    if (declaration.present) {
      assert.notEqual(declaration.value, null);
      assert.equal(declaration.absentBecause, null);
    } else {
      assert.equal(declaration.value, null);
      assert.ok(declaration.absentBecause && declaration.absentBecause.length > 0);
    }
  }
  // The kit's own logical ids of the skills of the product (F100-FR-194).
  assert.deepEqual(SKILL_IDS, [...HOST_SKILL_IDS, DOCTOR_SKILL_ID]);
});

test("T005: each absent capability of the sample uses its DECLARED fallback of annex H §H.1", () => {
  const declarations = plainShellDeclarations();
  assert.deepEqual(absentCapabilities(declarations), ["hooks", "statusSurface", "evals", "model"]);
  assert.deepEqual(presentCapabilities(declarations), ["background", "stateRootWritable"]);
  for (const capability of absentCapabilities(declarations)) {
    assert.equal(
      fallbackInUse(declarations, capability, "plain-shell"),
      fallbackOf(capability),
      "the fallback in use is the one of the annex and of nothing else",
    );
  }
  assert.deepEqual(fallbacksInUse(declarations), {
    hooks: fallbackOf("hooks"),
    statusSurface: fallbackOf("statusSurface"),
    evals: fallbackOf("evals"),
    model: fallbackOf("model"),
  });
  // Asking for the fallback of a capability the host OFFERS is an error, and
  // the error says WHICH host declared it — the name is an input.
  assert.throws(
    () => fallbackInUse(declarations, "background", "plain-shell"),
    /declared by plain-shell.*no fallback is in use/,
  );
  assert.throws(() => valuesColumnOf("nonsense" as never), /holds no capability/);
});

test("T005: an unknown capability is IGNORED — never an error, never carried into the output", () => {
  const declarations = plainShellDeclarations();
  assert.equal(isKnownCapability("hooks"), true);
  assert.equal(isKnownCapability("telepathy"), false);
  assert.deepEqual(ignoredCapabilities(["hooks", "telepathy", "background", "mcp"]), [
    "telepathy",
    "mcp",
  ]);
  const asked = describeCapabilities(declarations, ["telepathy", "background", "hooks"]);
  assert.deepEqual(
    asked.declared.map((d) => d.capability),
    ["background", "hooks"],
    "an unknown name is dropped; an absent capability is still DECLARED, which is what makes the product use its fallback",
  );
  assert.deepEqual(asked.ignored, ["telepathy"]);
  assert.equal(declarationOf(declarations, "telepathy"), undefined);
  const described = describeOf(declarations, PLAIN_SHELL_RENDERING);
  assert.equal(Object.hasOwn(described, "telepathy"), false);
});

test("T005: `describeOf` composes the port's `HostDescription` from the host's input", () => {
  const described = describeOf(plainShellDeclarations(), PLAIN_SHELL_RENDERING);
  // The sample host declares NO hook events, so `hooks` is null even though
  // the port types it — the value comes from the declaration, not from the kit.
  assert.equal(described.hooks, null);
  assert.equal(described.background, "the host runs a command to completion");
  assert.equal(described.statusSurface, null);
  assert.equal(described.evals, null);
  assert.equal(described.model, false);
  assert.equal(described.stateRootWritable, true);
  // The rendering is the host's, exactly as passed: cap 500, no prefix, and a
  // packaging form that is not a plugin directory.
  assert.deepEqual(described.skillNaming, {
    rule: PLAIN_SHELL_RENDERING.skillNamingRule,
    descriptionCap: 500,
  });
  assert.equal(described.packagingForm, "a directory of shell scripts");
});

test("T005: a second host changes only the data it passes — the same code shapes both", () => {
  const second = Object.freeze([
    capabilityDeclaration({
      capability: "hooks",
      present: true,
      value: ["on-start", "on-command"],
      absentBecause: null,
      requirement: "SAMPLE-SECOND-FR-1",
      hostFact: "capabilities-of-the-second-sample-host",
      pin: "second-sample@9.9.9",
    }),
    ...["statusSurface", "background", "evals", "model", "stateRootWritable"].map((capability) =>
      capabilityDeclaration({
        capability: capability as never,
        present: false,
        value: null,
        absentBecause: `the second sample host declares \`${capability}\` absent`,
        requirement: "SAMPLE-SECOND-FR-1",
        hostFact: "capabilities-of-the-second-sample-host",
        pin: "second-sample@9.9.9",
      }),
    ),
  ]);
  const secondRendering = {
    skillNamingRule: "lower-case with hyphens, one directory per skill, prefix `acme-`",
    descriptionCap: 200,
    packagingForm: "a single archive",
  } as const;
  const described = describeOf(second, secondRendering);
  const plainShell = describeOf(plainShellDeclarations(), PLAIN_SHELL_RENDERING);
  // The hook list is an INPUT: the second host names two events of its own,
  // the sample names none, and neither sees the other's.
  assert.deepEqual(described.hooks, ["on-start", "on-command"]);
  assert.deepEqual(plainShell.hooks, null);
  assert.equal(described.model, false);
  assert.equal(described.stateRootWritable, false);
  assert.deepEqual(described.skillNaming, {
    rule: secondRendering.skillNamingRule,
    descriptionCap: 200,
  });
  assert.equal(described.packagingForm, "a single archive");
  assert.equal(
    fallbackInUse(second, "statusSurface", "second-sample"),
    fallbackOf("statusSurface"),
  );
  assert.throws(
    () => fallbackInUse(second, "hooks", "second-sample"),
    /declared by second-sample, so no fallback is in use/,
  );
  // Neither description names a fact of the OTHER host here or of the plugin
  // the shape moved out of; each names only the data its own host passed (the
  // second's naming rule names its own prefix, and that is its own data).
  const both = JSON.stringify([described, plainShell]);
  for (const foreign of [
    "claude",
    "Claude",
    "SessionStart",
    "PreToolUse",
    "plain-shell",
    "second-sample",
    "specstride-",
  ]) {
    assert.equal(both.includes(foreign), false, `the output must not name ${foreign}`);
  }
});

test("T005: the kit source names no host, and an unverified fact row reads as unverified", () => {
  // The facts of the host the shape moved out of stay in that host's package.
  // (The provenance sentence may NAME the module it moved from, as the shim
  // module does; what it must not carry is a fact of that host.)
  const source = readFileSync(join(HERE, "../src/describe.ts"), "utf8");
  for (const foreign of [
    "CLAUDE",
    "Claude Code",
    "SessionStart",
    "UserPromptSubmit",
    "PreToolUse",
    "plain-shell",
    "specstride-",
  ]) {
    assert.equal(source.includes(foreign), false, `src/describe.ts must not name ${foreign}`);
  }
  // The verification-record row is the host's: only a row that says
  // `unverified` reads as unverified, and no row at all does not — the
  // semantics of the module the shape moved out of, unchanged.
  assert.equal(capabilitiesAreUnverified(undefined), false);
  assert.equal(capabilitiesAreUnverified({}), false);
  assert.equal(capabilitiesAreUnverified({ status: "unverified" }), true);
  assert.equal(capabilitiesAreUnverified({ status: "verified" }), false);
});
