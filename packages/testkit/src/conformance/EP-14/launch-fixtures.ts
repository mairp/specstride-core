/**
 * The test set of launch fixtures of feature 112 (CT-112-130, CT-112-202):
 * the fixtures over which the launch and the doctor must agree — a launch is
 * refused exactly when the doctor reports a `fail` finding of a check with the
 * flag `lb` (F112-FR-030, F112-SC-002).
 *
 * Each fixture holds the registered checks of the scenario (the core checks of
 * the doctor, plus representative instances of the three `lb` forms whose
 * probe another package supplies — `bin.<id>`, `auth.<id>.<role>` and
 * `model.reach.<role>`; per F112-FR-033 the id, the severity rule, the flag,
 * the message and the fix are this feature's data), the probe-bag
 * configuration entries of the scenario, the launch context (only the
 * conditional tenth, `budget.caps`, reads it) and the expected refusal.
 */
import type { Check, ProbeBag } from "../../../../doctor/src/registry/types.ts";
import type { LaunchContext } from "../../../../doctor/src/registry/launch-subset.ts";
import { budgetCapsCheck, quotaStateCheck } from "../../../../doctor/src/checks/budget.ts";
import {
  configSchemaCheck,
  secretInlineCheck,
  secretFileCheck,
} from "../../../../doctor/src/checks/config.ts";
import { sandboxCriticCheck } from "../../../../doctor/src/checks/run.ts";
import { termsGateCheck } from "../../../../doctor/src/checks/terms.ts";
import {
  criticAutopickCheck,
  criticDiversityCheck,
  criticIndependenceCheck,
} from "../../../../doctor/src/checks/critic.ts";

/** One representative instance of an `lb` form whose probe another owner supplies. */
function lbProbeCheck(id: string, group: Check["group"], order: number, key: string): Check {
  return {
    id,
    group,
    lb: true,
    order,
    messageTemplate: `${id}: {state}`,
    fixHint: "fix the set-up of the role",
    severityRule: (o: unknown) => (o as { severity: "ok" | "info" | "fail" }).severity,
    probe: async (bag) =>
      (bag as ProbeBag).config.values.get(key) ?? { severity: "ok" as const, state: "ok" },
  };
}

/** `bin.<id>` (row 11, lb) — the probe is the harness adapter's or the core's. */
export function binCheck(id: string, needed: boolean, present: boolean): Check {
  const check = lbProbeCheck(`bin.${id}`, "bin", 11, `bin.${id}`);
  return {
    ...check,
    probe: async (bag) => {
      const found =
        (bag as ProbeBag).config.values.get(`bin.${id}`) !== undefined
          ? // configured, so the probe resolved it from the registry
            (bag as ProbeBag).config.values.get(`bin.${id}`)
          : { severity: needed && !present ? ("fail" as const) : ("info" as const) };
      return found;
    },
  };
}

/** `auth.<id>.<role>` (row 18, lb) — the probe is the harness adapter's. */
export function authCheck(id: string, role: string, present: boolean): Check {
  const check = lbProbeCheck(`auth.${id}.${role}`, "auth", 18, `auth.${id}.${role}`);
  return {
    ...check,
    probe: async (bag) => {
      const value = (bag as ProbeBag).config.values.get(`auth.${id}.${role}`);
      return value ?? { severity: present ? ("ok" as const) : ("fail" as const) };
    },
  };
}

/** `model.reach.<role>` (row 20, lb) — the probe is the core's, over the bag. */
export function modelReachCheck(role: string, served: boolean): Check {
  const check = lbProbeCheck(`model.reach.${role}`, "model", 20, `model.reach.${role}`);
  return {
    ...check,
    probe: async (bag) => {
      const value = (bag as ProbeBag).config.values.get(`model.reach.${role}`);
      return value ?? { severity: served ? ("ok" as const) : ("fail" as const) };
    },
  };
}

/** One fixture of the test set of launch fixtures. */
export type LaunchFixture = {
  readonly id: string;
  readonly title: string;
  /** The checks registered for the scenario, in the running order. */
  readonly checks: readonly Check[];
  /** The launch context; only the conditional tenth reads it. */
  readonly context?: LaunchContext;
  /** The resolved-configuration entries the probes read. */
  readonly entries: readonly [string, unknown][];
  /** Whether a launch on this fixture is refused (F112-FR-030). */
  readonly expectRefused: boolean;
  /** The `lb` checks whose `fail` refuses the launch (empty when not refused). */
  readonly expectLbFailIds: readonly string[];
};

const OK = Object.freeze({ severity: "ok" as const, state: "ok" });

/** The ten checks of F112-FR-030, on a healthy fixture. */
export function healthyLaunchChecks(): readonly Check[] {
  return Object.freeze([
    binCheck("codex", true, true),
    authCheck("codex", "critic", true),
    modelReachCheck("critic", true),
    criticDiversityCheck,
    criticIndependenceCheck,
    criticAutopickCheck,
    termsGateCheck,
    budgetCapsCheck,
    configSchemaCheck,
    secretInlineCheck,
    secretFileCheck,
    sandboxCriticCheck,
  ]);
}

/** The healthy entries every fixture starts from; broken ones override a key. */
function entries(...extra: readonly [string, unknown][]): readonly [string, unknown][] {
  return Object.freeze([
    ["bin.codex", OK],
    ["auth.codex.critic", OK],
    ["model.reach.critic", OK],
    ["critic.independence", { canCallTools: false, allowsAllTools: false }],
    ["terms.row", { result: "allowed", audience: "personal", tier: "t1" }],
    [
      "budget.caps.roles",
      [{ role: "proposer", cap: 25, costClass: "subscription", spendMeasurable: true }],
    ],
    ["budget.caps.autopickCritic", { picked: false, metered: false, cap: null }],
    ["config.layers", [{ path: "user config", valid: true }]],
    ["config.secrets.inline", []],
    ["config.secretFiles", []],
    ["sandbox.critic", { allowsAllTools: false, outsideForms: [] }],
    ...extra,
  ]);
}

/** The test set of launch fixtures (F112-SC-002: 0 disagreements over it). */
export const launchFixtures: readonly LaunchFixture[] = Object.freeze([
  {
    id: "LF-01-healthy",
    title: "every launch check is ok: no refusal",
    checks: healthyLaunchChecks(),
    entries: entries(),
    expectRefused: false,
    expectLbFailIds: [],
  },
  {
    id: "LF-02-inline-secret",
    title: "an inline secret in user configuration fails secret.inline: refused",
    checks: healthyLaunchChecks(),
    entries: entries([
      "config.secrets.inline",
      [{ where: "user config", key: "critic key", value: "s3cr" }],
    ]),
    expectRefused: true,
    expectLbFailIds: ["secret.inline"],
  },
  {
    id: "LF-03-fail-not-lb",
    title: "the only fail finding belongs to a check without lb: not refused",
    checks: [...healthyLaunchChecks(), quotaStateCheck("proposer")],
    entries: entries(["quota.states", [{ role: "proposer", state: "blocked-on-credit" }]]),
    expectRefused: false,
    expectLbFailIds: [],
  },
  {
    id: "LF-04-same-model-diversity",
    title: "the critic-diversity warning (same-model) never refuses a launch",
    checks: healthyLaunchChecks(),
    entries: entries(["critic.diversity.result", "same-model"]),
    expectRefused: false,
    expectLbFailIds: [],
  },
  {
    id: "LF-05-autopick-metered-no-cap",
    title: "an automatically picked metered critic without a cap fails budget.caps: refused",
    checks: healthyLaunchChecks(),
    context: { autopickMeteredCritic: true },
    entries: entries(["budget.caps.autopickCritic", { picked: true, metered: true, cap: null }]),
    expectRefused: true,
    expectLbFailIds: ["budget.caps"],
  },
  {
    id: "LF-06-autopick-metered-capped",
    title: "an automatically picked metered critic with a cap: budget.caps does not refuse",
    checks: healthyLaunchChecks(),
    context: { autopickMeteredCritic: true },
    entries: entries(["budget.caps.autopickCritic", { picked: true, metered: true, cap: 2 }]),
    expectRefused: false,
    expectLbFailIds: [],
  },
  {
    id: "LF-07-no-autopick-caps-unconditional",
    title: "without an automatically picked metered critic budget.caps is out of the subset",
    checks: healthyLaunchChecks(),
    entries: entries([
      "budget.caps.roles",
      [{ role: "proposer", cap: null, costClass: null, spendMeasurable: false }],
    ]),
    expectRefused: false,
    expectLbFailIds: [],
  },
  {
    id: "LF-08-allow-all-critic",
    title:
      "a critic path that allows all tools fails critic.independence and sandbox.critic: refused",
    checks: healthyLaunchChecks(),
    entries: entries(
      ["critic.independence", { canCallTools: true, allowsAllTools: true }],
      ["sandbox.critic", { allowsAllTools: true, outsideForms: [] }],
    ),
    expectRefused: true,
    expectLbFailIds: ["critic.independence", "sandbox.critic"],
  },
  {
    id: "LF-09-unknown-terms",
    title: "terms unknown is a warning of an lb check: not refused",
    checks: healthyLaunchChecks(),
    entries: entries(["terms.row", { result: "unknown", audience: "personal" }]),
    expectRefused: false,
    expectLbFailIds: [],
  },
  {
    id: "LF-10-model-not-served",
    title: "the configured model of a role in use is not served: refused",
    checks: healthyLaunchChecks(),
    entries: entries(["model.reach.critic", { severity: "fail", state: "not served" }]),
    expectRefused: true,
    expectLbFailIds: ["model.reach.critic"],
  },
]);
