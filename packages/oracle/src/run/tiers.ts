/**
 * T071 — the three test tiers, the skip with its reason, and the disposable
 * environment of the reference tier (F141-FR-037).
 *
 * > "The tests of the oracle MUST be in three test tiers that run apart:
 * > hermetic (the port against golden captures), reference (the live
 * > differential run) and platform (the macOS runner). A fixture whose
 * > prerequisite is missing MUST be reported as a skip with its reason and never
 * > as a pass. At the release check a skip MUST block. The release run MUST
 * > therefore meet every prerequisite that a scenario of the catalogue declares;
 * > for `FX-26/root-sandbox-assertion` it MUST capture the reference and run the
 * > port with the effective user id 0, in a disposable environment of the
 * > reference tier that holds no credential and reaches no address other than
 * > loopback (F141-FR-038)."
 *
 * "Run apart" is a property of the build, not of this module alone: the four jobs
 * of `.github/workflows/oracle.yml` are one per tier plus the capture job, each on
 * its own runner, and `TIERS` is what the test holds the workflow to.
 *
 * The one thing this module may never do is turn a missing prerequisite into a
 * pass. Every path out of `planTier` is `run` or `skip`, a skip always carries its
 * reason, and `assertTheReleaseRunMeetsEveryDeclaredPrerequisite` is the reading of
 * "at the release check a skip blocks".
 */
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { scenarioEntriesOf } from "../catalogue/catalogue.ts";
import {
  CREDENTIAL_VARIABLE_NAMES,
  assertLoopback,
  assertNoCredentialOfTheMachine,
  isLoopbackHost,
} from "../env/guard.ts";
import { implementationFilesOf, sideIsAvailable, stepsOf } from "./driver.ts";
import type { FixtureDeclaration } from "../catalogue/fixture.ts";

/** A fault of the tier runner. */
export class TierError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TierError";
  }
}

// ---------------------------------------------------------------------------
// The three tiers
// ---------------------------------------------------------------------------

/** The three test tiers of F141-FR-037, in the order the requirement names them. */
export const TIERS = ["hermetic", "reference", "platform"] as const;
export type Tier = (typeof TIERS)[number];

/** What one tier is: what it proves, what it needs, and where it runs. */
export type TierDefinition = {
  readonly tier: Tier;
  readonly proves: string;
  /** The side each comparison of the tier drives; the other side is a committed capture. */
  readonly drives: readonly ("reference" | "port")[];
  /** The system the tier runs on, as `oracle.yml` sets it. */
  readonly runsOn: "linux" | "macos";
  /** The prerequisites of the tier, in prose, as `quickstart.md` states them. */
  readonly prerequisites: readonly string[];
};

/** The three tiers as `quickstart.md`, "Test tiers", states them. */
export const TIER_DEFINITIONS: readonly TierDefinition[] = Object.freeze([
  Object.freeze({
    tier: "hermetic" as const,
    proves: "the oracle's own tests; the port against the golden captures",
    drives: Object.freeze(["port" as const]),
    runsOn: "linux" as const,
    prerequisites: Object.freeze(["Node 22 or later", "npm install in the workspace"]),
  }),
  Object.freeze({
    tier: "reference" as const,
    proves: "the live differential run, both suites, the exercise map",
    drives: Object.freeze(["reference" as const, "port" as const]),
    runsOn: "linux" as const,
    prerequisites: Object.freeze([
      "Node 22 or later",
      "Linux; bash 4 or later, flock, setsid, GNU stat and date",
      "Python 3.10 to 3.13",
      "local clones of the two baselines, named by ORACLE_REF_SPECSTRIDE and ORACLE_REF_MOL",
    ]),
  }),
  Object.freeze({
    tier: "platform" as const,
    proves: "the port on macOS against the Linux captures and the per-OS expectations",
    drives: Object.freeze(["port" as const]),
    runsOn: "macos" as const,
    prerequisites: Object.freeze(["Node 22 or later", "a macOS runner"]),
  }),
]);

/** One tier by name. */
export function tier(name: string): TierDefinition {
  const found = TIER_DEFINITIONS.find((definition) => definition.tier === name);
  if (found === undefined) {
    throw new TierError(
      `\`${name}\` is no test tier of the oracle; the three tiers of F141-FR-037 are ` +
        `${TIERS.join(", ")}`,
    );
  }
  return found;
}

/** The tier that drives the reference live: the one the release condition needs. */
export const TIER_OF_THE_LIVE_RUN: Tier = "reference";

/**
 * The three tiers run APART (F141-FR-037): no tier is a step of another, and each
 * runs on its own runner. The two readings this holds:
 *
 *  - the reference tier is the only one that drives the reference, so a change
 *    under review needs no clone, no bash 4 and no Python;
 *  - the platform tier runs on macOS, where the Specstride reference does not run
 *    at all, so it drives the port alone.
 */
export function tiersRunApart(): boolean {
  const drivesTheReference = TIER_DEFINITIONS.filter((d) => d.drives.includes("reference"));
  return (
    drivesTheReference.length === 1 &&
    (drivesTheReference[0] as TierDefinition).tier === TIER_OF_THE_LIVE_RUN &&
    TIER_DEFINITIONS.filter((d) => d.runsOn === "macos").length === 1 &&
    new Set(TIER_DEFINITIONS.map((d) => d.tier)).size === TIERS.length
  );
}

// ---------------------------------------------------------------------------
// A missing prerequisite is a skip with its reason, never a pass
// ---------------------------------------------------------------------------

/** What a tier decided about one scenario. */
export type TierStep =
  | { readonly fixture: string; readonly tier: Tier; readonly action: "run" }
  | {
      readonly fixture: string;
      readonly tier: Tier;
      readonly action: "skip";
      readonly reason: string;
    };

/** True where a step is a skip; it then carries its reason. */
export function isSkip(step: TierStep): step is {
  readonly fixture: string;
  readonly tier: Tier;
  readonly action: "skip";
  readonly reason: string;
} {
  return step.action === "skip";
}

/** What the tier runner is told about the machine it runs on. */
export type Machine = {
  /** `linux` or `macos`, as the tier definitions name them. */
  readonly platform: "linux" | "macos";
  /** The effective user id of the run; `FX-26/root-sandbox-assertion` needs 0. */
  readonly effectiveUserId: number;
  /** The root of each reference tree in scratch, by system; absent where there is none. */
  readonly referenceRoots: Readonly<Record<string, string>>;
  /** The root of the product, for the port side. */
  readonly productRoot: string;
};

/** The scenario whose prerequisite is the effective user id 0 (F141-FR-037). */
export const ROOT_SANDBOX_SCENARIO = "FX-26/root-sandbox-assertion" as const;

/** The effective user id that scenario needs. */
export const ROOT_SANDBOX_EFFECTIVE_USER_ID = 0 as const;

/** The prerequisite of `FX-26/root-sandbox-assertion`, as the catalogue words it. */
export const ROOT_SANDBOX_PREREQUISITE = "the run has the effective user id 0" as const;

/**
 * The scenarios whose prerequisite is the effective user id 0, read from the
 * catalogue and not listed here: the note of the entry is what states it
 * (`contracts/fixture-catalogue.json`, FX-26 `root-sandbox-assertion`).
 */
export function scenariosThatNeedTheEffectiveUserIdZero(): readonly string[] {
  const found: string[] = [];
  for (const family of ["FX-26"]) {
    for (const entry of scenarioEntriesOf(family)) {
      const note = String((entry as { note?: unknown }).note ?? "");
      if (/effective user id 0/.test(note)) found.push(`${family}/${entry.name}`);
    }
  }
  return Object.freeze(found);
}

/** Why `FX-26/root-sandbox-assertion` cannot run here, where it cannot. */
export function reasonTheEffectiveUserIdIsMissing(machine: Machine): string {
  return (
    `prerequisite missing: ${ROOT_SANDBOX_PREREQUISITE}, and this run has the effective user id ` +
    `${machine.effectiveUserId}. The scenario asserts what the baseline does when it is run as ` +
    `root, which cannot be observed from an unprivileged run. This is a SKIP with its reason and ` +
    `never a pass (F141-FR-037); at the release check a skip blocks (F141-FR-026)`
  );
}

/** Why a tier cannot run on this machine, where it cannot. */
export function reasonTheTierCannotRunHere(definition: TierDefinition, machine: Machine): string {
  return (
    `prerequisite missing: the ${definition.tier} test tier runs on ${definition.runsOn} and this ` +
    `machine is ${machine.platform}. This is a SKIP with its reason and never a pass ` +
    `(F141-FR-037); at the release check a skip blocks (F141-FR-026)`
  );
}

/** What `planTier` is given per scenario. */
export type ScenarioToPlan = {
  readonly fixture: string;
  readonly fixtureDir: string;
  readonly declaration: FixtureDeclaration & Readonly<Record<string, unknown>>;
  /** True where the store holds a committed golden capture of the reference. */
  readonly hasGoldenCapture: boolean;
};

/**
 * What one tier will do with each scenario: run it, or skip it with its reason.
 *
 * Every reason a scenario cannot run is a skip and never a failure and never a
 * silent pass: the tier does not run on this system; the scenario does not declare
 * this system; the effective user id the scenario needs is not the one of this run;
 * the side the tier drives cannot be driven (no reference tree, or a command the
 * build does not have); the tier compares against a capture the store does not
 * hold.
 */
export function planTier(
  name: Tier,
  scenarios: readonly ScenarioToPlan[],
  machine: Machine,
): readonly TierStep[] {
  const definition = tier(name);
  return Object.freeze(
    scenarios.map((scenario): TierStep => {
      if (definition.runsOn !== machine.platform) {
        return {
          fixture: scenario.fixture,
          tier: name,
          action: "skip",
          reason: reasonTheTierCannotRunHere(definition, machine),
        };
      }
      const declaredSystems = (scenario.declaration["os"] as string[] | undefined) ?? [
        "linux",
        "macos",
      ];
      if (!declaredSystems.includes(machine.platform)) {
        return {
          fixture: scenario.fixture,
          tier: name,
          action: "skip",
          reason:
            `prerequisite missing: the scenario declares the systems ` +
            `${declaredSystems.join(", ")} and this machine is ${machine.platform}. This is a ` +
            `SKIP with its reason and never a pass (F141-FR-037); at the release check a skip ` +
            `blocks (F141-FR-026)`,
        };
      }
      if (
        scenariosThatNeedTheEffectiveUserIdZero().includes(scenario.fixture) &&
        machine.effectiveUserId !== ROOT_SANDBOX_EFFECTIVE_USER_ID
      ) {
        return {
          fixture: scenario.fixture,
          tier: name,
          action: "skip",
          reason: reasonTheEffectiveUserIdIsMissing(machine),
        };
      }
      const system = String(scenario.declaration["system"] ?? "specstride");
      for (const side of definition.drives) {
        const root = side === "reference" ? machine.referenceRoots[system] : machine.productRoot;
        if (root === undefined) {
          return {
            fixture: scenario.fixture,
            tier: name,
            action: "skip",
            reason:
              `prerequisite missing: no clone of the ${system} baseline was found, so its ` +
              `reference tree is not in scratch. This is a SKIP with its reason and never a pass ` +
              `(F141-FR-037); at the release check a skip blocks (F141-FR-026)`,
          };
        }
        const entryPoint = String(
          (scenario.declaration["entryPoint"] as Record<string, string> | undefined)?.[side] ?? "",
        );
        const steps = stepsOf({
          scenario: scenario.fixture,
          side,
          fixtureDir: scenario.fixtureDir,
          runRoot: join(tmpdir(), "oracle-plan"),
          fixture: scenario.declaration,
          implementationRoot: root,
          criticStubAddress: "http://127.0.0.1:1",
        });
        const unavailable = sideIsAvailable(
          side,
          root,
          entryPoint,
          side === "reference" ? implementationFilesOf(steps, system) : [],
        );
        if (unavailable !== undefined) {
          return {
            fixture: scenario.fixture,
            tier: name,
            action: "skip",
            reason: `prerequisite missing: ${unavailable.reason}`,
          };
        }
      }
      if (!definition.drives.includes("reference") && !scenario.hasGoldenCapture) {
        return {
          fixture: scenario.fixture,
          tier: name,
          action: "skip",
          reason:
            `prerequisite missing: the ${name} tier compares the port with a committed golden ` +
            `capture of the reference and the store holds none for this scenario. This is a SKIP ` +
            `with its reason and never a pass (F141-FR-037); at the release check a skip blocks ` +
            `(F141-FR-026)`,
        };
      }
      return { fixture: scenario.fixture, tier: name, action: "run" };
    }),
  );
}

/** The skips of a plan, with their reasons. */
export function skipsOf(plan: readonly TierStep[]): readonly TierStep[] {
  return Object.freeze(plan.filter(isSkip));
}

/**
 * F141-FR-037 — "The release run MUST therefore meet every prerequisite that a
 * scenario of the catalogue declares". A plan with one skip in it is not a release
 * run, and this is where it is said so: the release check reads the same fact
 * through `releaseCheck`, and this refuses the run itself.
 */
export function assertTheReleaseRunMeetsEveryDeclaredPrerequisite(plan: readonly TierStep[]): void {
  const skipped = skipsOf(plan);
  if (skipped.length === 0) return;
  throw new TierError(
    `the release run does not meet every declared prerequisite: ${skipped.length} scenario(s) ` +
      `are a skip, and at the release check a skip blocks (F141-FR-026, F141-FR-037). ` +
      skipped
        .slice(0, 5)
        .map((step) => `${step.fixture}: ${isSkip(step) ? step.reason : ""}`)
        .join(" | "),
  );
}

/**
 * At the release run `FX-26/root-sandbox-assertion` runs on BOTH sides with the
 * effective user id 0 (F141-FR-037). The reference half is a capture of the
 * reference, the port half is a run of the port, and both are in the disposable
 * environment of the reference tier.
 */
export function theRootSandboxScenarioAtTheReleaseRun(machine: Machine): {
  readonly fixture: string;
  readonly sides: readonly ["reference", "port"];
  readonly effectiveUserId: number;
  readonly mayRun: boolean;
  readonly reason?: string;
} {
  const mayRun = machine.effectiveUserId === ROOT_SANDBOX_EFFECTIVE_USER_ID;
  return Object.freeze({
    fixture: ROOT_SANDBOX_SCENARIO,
    sides: Object.freeze(["reference", "port"] as const),
    effectiveUserId: ROOT_SANDBOX_EFFECTIVE_USER_ID,
    mayRun,
    ...(mayRun ? {} : { reason: reasonTheEffectiveUserIdIsMissing(machine) }),
  });
}

// ---------------------------------------------------------------------------
// The disposable environment of the reference tier
// ---------------------------------------------------------------------------

/**
 * The disposable environment the reference tier runs a privileged scenario in
 * (F141-FR-037, F141-FR-038): a directory of its own outside every source
 * repository, which is removed afterwards, and which holds no credential of the
 * machine and reaches no address other than loopback.
 *
 * "Disposable" is the point: `FX-26/root-sandbox-assertion` runs as root on both
 * sides, so whatever it writes must be somewhere that is thrown away, and nothing
 * of the machine may be reachable from it.
 */
export type DisposableEnvironment = {
  readonly root: string;
  readonly effectiveUserId: number;
  /** The addresses the run may reach: loopback, and nothing else. */
  readonly reachable: readonly string[];
  /** Remove the environment. Safe to call twice. */
  readonly dispose: () => void;
};

/** The addresses a run of the reference tier may reach (F141-FR-038). */
export const REACHABLE_ADDRESSES: readonly string[] = Object.freeze([
  "127.0.0.1",
  "::1",
  "localhost",
]);

/**
 * Make the disposable environment. The environment it is handed is checked before
 * the directory is made: a credential of the machine in it, or an address beyond
 * loopback, is a refusal and not a warning.
 */
export function disposableEnvironmentOfTheReferenceTier(options: {
  readonly environment: Readonly<Record<string, string | undefined>>;
  readonly effectiveUserId: number;
  readonly scratchRoot?: string;
}): DisposableEnvironment {
  assertNoCredentialOfTheMachine(options.environment);
  for (const [name, value] of Object.entries(options.environment)) {
    if (value === undefined) continue;
    const match = /^https?:\/\/([^/:]+)/.exec(value);
    if (match === null) continue;
    if (!isLoopbackHost(match[1] as string)) {
      throw new TierError(
        `the disposable environment of the reference tier may reach no address other than ` +
          `loopback (F141-FR-038), and ${name} names ${match[1] as string}`,
      );
    }
  }
  const root = mkdtempSync(join(options.scratchRoot ?? tmpdir(), "oracle-disposable-"));
  let gone = false;
  return Object.freeze({
    root,
    effectiveUserId: options.effectiveUserId,
    reachable: REACHABLE_ADDRESSES,
    dispose: (): void => {
      if (gone) return;
      gone = true;
      rmSync(root, { recursive: true, force: true });
    },
  });
}

/** Run something in the disposable environment and remove it afterwards, always. */
export function inTheDisposableEnvironment<T>(
  options: Parameters<typeof disposableEnvironmentOfTheReferenceTier>[0],
  body: (environment: DisposableEnvironment) => T,
): T {
  const environment = disposableEnvironmentOfTheReferenceTier(options);
  try {
    return body(environment);
  } finally {
    environment.dispose();
  }
}

/** True where the environment of a disposable run is gone from disk. */
export function isDisposed(environment: DisposableEnvironment): boolean {
  return !existsSync(resolve(environment.root));
}

/** The address a stub of the disposable environment may listen on. */
export function assertTheAddressIsReachable(address: string): void {
  assertLoopback(address);
}

export { CREDENTIAL_VARIABLE_NAMES };
