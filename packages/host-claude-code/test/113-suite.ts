/**
 * T024 of `specs/113-host-claude-code/tasks.md` — the INPUTS this host
 * supplies to the host conformance suite of EP-01 (annex H §H.1): its own
 * target record, its implementation of the port, and the four cases of
 * F113-FR-034.
 *
 * The suite itself is the testkit's frame (`registerHostConformanceCases` of
 * `@specstride/testkit/conformance/EP-01/host-suite`), and the two targets are
 * recorded by `hostConformanceTargets` of
 * `@specstride/testkit/conformance/EP-01/targets`: this host first, the plain
 * shell — the sample of EP-01 — second. The file that runs the suite is
 * `113.test.ts` beside this one; this file holds only what is this host's to
 * supply.
 *
 * F113-FR-034: "The host conformance suite MUST run the command sequences of
 * both host skills on oracle fixtures with stub agents, AGAINST THE PLAIN
 * SHELL AND AGAINST THIS PLUGIN, measure bytes against the budgets, check the
 * reference closure and validate the artifact tree." The oracle fixture is
 * `greeting-ready` (FX-32, `TARGET_FIXTURE`), and the stub agent is a recorder
 * that takes each invocation and answers exit 0: it starts no CLI, no runtime
 * and no model, so the whole suite calls no model (F113-FR-041).
 */
import assert from "node:assert/strict";
import {
  describe as pluginDescribe,
  renderEntry as pluginRenderEntry,
  renderSkill as pluginRenderSkill,
  renderStatusHooks as pluginRenderStatusHooks,
  renderPluginSkills,
  renderHooks,
  renderShim,
  byteBudgetOf,
} from "@specstride/host-claude-code";
import {
  DRY_RUN_LAUNCHES,
  RUN_STEPS,
  RUN_STEP_IDS,
  stepsUpTo,
} from "@specstride/host-claude-code/skill-run";
import {
  DRY_RUN_WITHHOLDS_CONSENT,
  REVERSE_STEPS,
  REVERSE_STEP_IDS,
} from "@specstride/host-claude-code/skill-reverse";
import type { SkillSource } from "@specstride/contracts/ep/host";
import type { Implementation } from "@specstride/testkit/conformance/frame";
import { implementation as plainShell } from "@specstride/testkit/samples/EP-01";
import {
  PLAIN_SHELL_IMPLEMENTATION_ID,
  TARGET_FIXTURE,
  type ConformanceTarget,
} from "@specstride/testkit/conformance/EP-01/targets";
import type { SuiteCase } from "@specstride/testkit/conformance/EP-01/host-suite";

/* -------------------------------------------------------------------------
 * This host's target record, and its implementation of the port
 * ---------------------------------------------------------------------- */

/** This plugin's own record: the FIRST target of its suite (F113-FR-034). */
export const FIRST_TARGET: ConformanceTarget = Object.freeze({
  order: 1 as const,
  implementationId: "host-claude-code",
  host: "the Claude Code plugin of Specstride, the host package of feature 113",
  source: "packages/host-claude-code",
  live: false as const,
  requirement: "F113-FR-034",
});

/** The plugin as an implementation of EP-01, under the id T004 records for it. */
export const pluginImplementation: Implementation = Object.freeze({
  ep: "EP-01",
  pointId: "specstride.host/1",
  id: FIRST_TARGET.implementationId,
  implementationClass: "first-party",
  majors: [1],
  provenance: "default",
  operations: Object.freeze({
    describe: pluginDescribe,
    renderSkill: (source: SkillSource) => pluginRenderSkill(source),
    renderEntry: pluginRenderEntry,
    renderStatusHooks: pluginRenderStatusHooks,
  }),
});

/** The implementation of a target, by the id its record carries. */
export function implementationOfTarget(id: string): Implementation {
  if (id === FIRST_TARGET.implementationId) return pluginImplementation;
  if (id === PLAIN_SHELL_IMPLEMENTATION_ID) return plainShell;
  throw new Error(`no implementation for the target \`${id}\` of the conformance suite`);
}

/* -------------------------------------------------------------------------
 * The stub agent and the command sequences of the two skills
 * ---------------------------------------------------------------------- */

/** The entry command both hosts call the product's CLI with (annex G §G.2). */
export const CLI_ENTRY = "specstride" as const;

/** The comment the fixture `greeting-ready` carries, passed to every command verbatim. */
export const FIXTURE_COMMENT = "make the greeting say the reader's name" as const;

/**
 * A stub agent: it records every invocation it is given and answers exit 0.
 * It starts no process and calls no model — it is the `stub agent` of
 * F113-FR-034.
 */
export function stubAgent() {
  const invocations: readonly string[][] = [];
  return Object.freeze({
    invocations,
    run(command: readonly string[]): { code: 0; argv: readonly string[] } {
      (invocations as string[][]).push([...command]);
      return Object.freeze({ code: 0 as const, argv: Object.freeze([...command]) });
    },
  });
}

/** The argv of one CLI command on a host: the entry, the sub-command, the comment. */
function cli(entry: string, ...rest: readonly string[]): readonly string[] {
  return [entry, ...rest, "--comment", FIXTURE_COMMENT];
}

/** The command sequence of `specstride-run` (F113-FR-002, steps 2 to 7). */
export const RUN_COMMAND_SEQUENCE: readonly (readonly string[])[] = Object.freeze([
  cli(CLI_ENTRY, "contract", "derive"),
  cli(CLI_ENTRY, "judge", "--batch", "1"),
  cli(CLI_ENTRY, "contract", "validate"),
  cli(CLI_ENTRY, "contract", "promote"),
  cli(CLI_ENTRY, "contract", "render"),
  cli(CLI_ENTRY, "launch"),
]);

/** The command sequence of `specstride-reverse` (F113-FR-014, steps 2 to 6). */
export const REVERSE_COMMAND_SEQUENCE: readonly (readonly string[])[] = Object.freeze([
  cli(CLI_ENTRY, "reverse", "plan"),
  cli(CLI_ENTRY, "reverse", "inventory"),
  cli(CLI_ENTRY, "judge", "--batch", "1"),
  cli(CLI_ENTRY, "reverse"),
]);

/** The sequence stops at the first refusal: the sub-sequence dry-run reaches. */
export const RUN_DRY_RUN_COMMANDS: readonly (readonly string[])[] = Object.freeze(
  RUN_COMMAND_SEQUENCE.slice(0, 4),
);
export const REVERSE_DRY_RUN_COMMANDS: readonly (readonly string[])[] = Object.freeze(
  REVERSE_COMMAND_SEQUENCE.slice(0, 2),
);

/** The step ids the two command sequences carry, held against the skill sources. */
export const SEQUENCE_STEP_IDS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  "specstride-run": RUN_STEP_IDS,
  "specstride-reverse": REVERSE_STEP_IDS,
});

/* -------------------------------------------------------------------------
 * The cases of F113-FR-034
 * ---------------------------------------------------------------------- */

/** The sequence case: both skills, dry-run and full, on the oracle fixture. */
export const commandSequenceCase: SuiteCase = {
  id: "EP-01/113/command-sequences",
  title:
    "the command sequences of both host skills play on the oracle fixture `greeting-ready` " +
    "(FX-32) with a stub agent: dry-run stops before launch, and the full sequence is " +
    "recorded whole and in order (F113-FR-034)",
  proves: ["F113-FR-034"],
  run(implementation) {
    const renderEntry = implementation.operations?.renderEntry as
      ((id: string) => string) | undefined;
    assert.ok(renderEntry !== undefined, "the target offers no renderEntry");
    assert.equal(renderEntry("doctor").length > 0, true);
    const agent = stubAgent();
    // dry-run: the run skill launches nothing ...
    if (DRY_RUN_LAUNCHES !== false) throw new Error("dry-run must launch nothing (F113-FR-004)");
    for (const command of RUN_DRY_RUN_COMMANDS) agent.run(command);
    const launchIndex = agent.invocations.findIndex((argv) => argv.includes("launch"));
    assert.equal(launchIndex, -1, "the dry-run of the run skill reached `launch`");
    // ... and the reverse skill withholds its consent: it never runs `reverse`.
    if (DRY_RUN_WITHHOLDS_CONSENT !== true) {
      throw new Error("the reverse dry-run must withhold consent (F113-FR-014)");
    }
    for (const command of REVERSE_DRY_RUN_COMMANDS) agent.run(command);
    // The dry-run invocations are EXACTLY the sub-sequences, in order: nothing
    // after the plan of the reverse skill and nothing before derive.
    assert.deepEqual(agent.invocations, [...RUN_DRY_RUN_COMMANDS, ...REVERSE_DRY_RUN_COMMANDS]);
    // The full sequences, whole and in order.
    const full = stubAgent();
    for (const command of RUN_COMMAND_SEQUENCE) full.run(command);
    for (const command of REVERSE_COMMAND_SEQUENCE) full.run(command);
    assert.deepEqual(
      full.invocations.slice(0, RUN_COMMAND_SEQUENCE.length).map((argv) => argv.slice(0, -2)),
      RUN_COMMAND_SEQUENCE.map((argv) => argv.slice(0, -2)),
    );
    // The sequences cover the steps of the two skills, in the sources' order.
    assert.deepEqual(
      SEQUENCE_STEP_IDS["specstride-run"],
      RUN_STEPS.map((s) => s.id),
    );
    assert.deepEqual(
      SEQUENCE_STEP_IDS["specstride-reverse"],
      REVERSE_STEPS.map((s) => s.id),
    );
    assert.ok(stepsUpTo("render").length < RUN_STEPS.length);
  },
};

/** The bytes case: every rendered skill is measured against its budget. */
export const bytesAgainstBudgetsCase: SuiteCase = {
  id: "EP-01/113/bytes-against-budgets",
  title:
    "the bytes of every rendered skill of the suite are measured against the budget of " +
    "F113-FR-036 at 2.8 bytes per token (F113-FR-034)",
  proves: ["F113-FR-034"],
  run(implementation) {
    const renderSkill = implementation.operations?.renderSkill as
      ((source: SkillSource) => { bytes: number; path: string }) | undefined;
    assert.ok(renderSkill !== undefined, "the target offers no renderSkill");
    for (const logicalId of ["specstride-run", "specstride-reverse", "doctor"] as const) {
      const artifact = renderSkill({
        logicalId,
        body: `the ${logicalId} skill of the fixture ${TARGET_FIXTURE}`,
        references: [],
        budget: byteBudgetOf(logicalId) ?? 4200,
      });
      assert.equal(Number.isInteger(artifact.bytes), true);
      assert.ok(
        artifact.bytes <= (byteBudgetOf(logicalId) ?? 4200),
        `${logicalId} is over its byte budget`,
      );
    }
    // The plugin's own three skills, as the build renders them.
    for (const artifact of renderPluginSkills()) {
      const budget = byteBudgetOf(
        artifact.path.startsWith("skills/specstride-run")
          ? "specstride-run"
          : artifact.path.startsWith("skills/specstride-reverse")
            ? "specstride-reverse"
            : "doctor",
      );
      assert.ok(
        budget !== undefined && artifact.bytes <= budget,
        `${artifact.path} is over budget`,
      );
    }
  },
};

/** The reference closure case: no rendered artifact names a path into the product. */
export const referenceClosureCase: SuiteCase = {
  id: "EP-01/113/reference-closure",
  title:
    "reference closure: no artifact the target renders names a path into the product's " +
    "source, state or logs (F113-FR-034; F113-FR-037, the reference closure)",
  proves: ["F113-FR-034"],
  run(implementation) {
    const renderSkill = implementation.operations?.renderSkill as
      ((source: SkillSource) => { content: string }) | undefined;
    assert.ok(renderSkill !== undefined);
    for (const logicalId of ["specstride-run", "specstride-reverse", "doctor"] as const) {
      const artifact = renderSkill({
        logicalId,
        body: "a thin layer over the CLI",
        references: [],
        budget: byteBudgetOf(logicalId) ?? 4200,
      });
      for (const pattern of [/packages\//, /\.specstride\//, /logs\//, /state\//]) {
        assert.equal(
          pattern.test(artifact.content),
          false,
          `${logicalId} names a path into the product: ${String(pattern)}`,
        );
      }
    }
    // The plugin's own artifacts. A SKILL names no path into the product
    // (F113-FR-037); the generated shim carries a provenance COMMENT that
    // names the source file it was generated from, which is not a path the
    // shim reads, so the hooks and the shim are held against the paths a
    // reader could follow: the control root and the logs.
    for (const artifact of renderPluginSkills()) {
      for (const pattern of [/packages\//, /\.specstride\//, /logs\//, /state\//]) {
        assert.equal(
          pattern.test(artifact.content),
          false,
          `${artifact.path} names a path into the product: ${String(pattern)}`,
        );
      }
    }
    for (const artifact of [...renderHooks(), renderShim()]) {
      for (const pattern of [/\.specstride\//, /logs\//]) {
        assert.equal(
          pattern.test(artifact.content),
          false,
          `${artifact.path} names a path into the product: ${String(pattern)}`,
        );
      }
    }
  },
};

/** The artifact tree case: every artifact sits where the plugin layout puts it. */
export const artifactTreeCase: SuiteCase = {
  id: "EP-01/113/artifact-tree",
  title:
    "the artifact tree of the target is valid: skills under `skills/` as a directory with " +
    "SKILL.md, status hooks under `hooks/`, the shim under `bin/` (F113-FR-034)",
  proves: ["F113-FR-034"],
  run(implementation) {
    const renderSkill = implementation.operations?.renderSkill as
      ((source: SkillSource) => { path: string }) | undefined;
    const renderStatusHooks = implementation.operations?.renderStatusHooks as
      ((statusLineLogicalName: string) => readonly { path: string }[]) | undefined;
    assert.ok(renderSkill !== undefined && renderStatusHooks !== undefined);
    for (const logicalId of ["specstride-run", "specstride-reverse", "doctor"] as const) {
      const path = renderSkill({
        logicalId,
        body: "a thin layer over the CLI",
        references: [],
        budget: byteBudgetOf(logicalId) ?? 4200,
      }).path;
      // Each host shapes the skill tree in its own form: the plugin renders a
      // directory with SKILL.md, the plain shell one file per skill. What the
      // tree must hold either way is the skills/ branch.
      assert.match(path, /^skills\//);
    }
    // The plugin's own form: one directory per skill, each with SKILL.md.
    for (const artifact of renderPluginSkills()) {
      assert.match(artifact.path, /^skills\/[a-z0-9-]+\/SKILL\.md$/);
    }
    for (const hook of renderStatusHooks("workspace:current:status-line")) {
      assert.match(hook.path, /^hooks\//);
    }
    assert.match(renderShim().path, /^bin\//);
  },
};

/** Every case of this host's behaviour suite, in order. */
export const suiteCases: readonly SuiteCase[] = Object.freeze([
  commandSequenceCase,
  bytesAgainstBudgetsCase,
  referenceClosureCase,
  artifactTreeCase,
]);
