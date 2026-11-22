/**
 * CT-153-61 — the parity test of feature 153 against the oracle of feature 141
 * (T323, T324; F153-FR-061, F153-SC-013).
 *
 * What the test proves.
 *
 * - **the as-is behaviour each delivered requirement restores is the committed
 *   golden's**: the golden capture of the reference (`packages/oracle/golden`)
 *   is the as-is side of the comparison, and the checks below read it for the
 *   exact absence each restoration fills — no summary frame in the gate
 *   feedback (F153-FR-016), no `verification.started`/`check.started` (F153-FR-010,
 *   -011, -034), no ledger attempt closed on every path (F153-FR-037), no pins
 *   block and no check-output block in a critic prompt (F153-FR-048, -050), no
 *   handoff file (F153-FR-058);
 * - **the port under `--profile parity` is compared with that golden through
 *   the oracle's own machinery** (`driveSide` of
 *   `packages/oracle/src/run/driver.ts`, `comparePortWithGolden` of
 *   `packages/oracle/src/golden/store.ts`): every result must be `equal` or
 *   `waived`, and a `different` is allowed ONLY when the register row that
 *   carries it is one of the rows this feature REQUESTS in
 *   `specs/153-loop-feedback-speed/amendments.md` — named by its requested id,
 *   never by an invented one. A `different` no row covers fails the test;
 *   nothing here accepts a difference into silence;
 * - **a side the build cannot drive is a skip with its reason** (F141-FR-026,
 *   F141-FR-037): the port's command line of CLI protocol 1 in this checkout
 *   carries only the commands its owning features delivered, so a scenario
 *   whose port command is not in the build is a DECLARED missing prerequisite
 *   and is reported as `t.skip` with the exact reason `sideIsAvailable` gives —
 *   never as a failure of the product and never as a silent pass. At the
 *   release check a skip blocks (F141-FR-026); this test records them so
 *   nothing is hidden.
 *
 * No waiver of this feature exists yet: the register rows it needs are requested
 * in `specs/153-loop-feedback-speed/amendments.md` and take effect at approval,
 * and a waiver whose register row does not exist is refused at load time
 * (F141-FR-022), so this test reads the committed waivers of feature 141 only.
 */
import assert from "node:assert/strict";
import { readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { comparePortWithGolden, readGoldenCapture } from "../../../oracle/src/golden/store.ts";
import { driveSide, sideIsAvailable } from "../../../oracle/src/run/driver.ts";
import { rootsOfRun } from "../../../oracle/src/run/self.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
/** The repository of the port: two levels above this package. */
const REPOSITORY = resolve(HERE, "../../../..");
const FIXTURES = join(REPOSITORY, "packages/oracle/fixtures");
const AMENDMENTS = join(REPOSITORY, "specs/153-loop-feedback-speed/amendments.md");
const WAIVERS = join(REPOSITORY, "packages/oracle/waivers.json");

/**
 * One scenario per delivered requirement, with the as-is absence the golden
 * must show. The marker strings are searched in the JSON text of the golden
 * capture, which is enough to prove an absence.
 */
const SCENARIOS: readonly {
  readonly scenario: string;
  readonly requirements: readonly string[];
  /** Strings that MUST NOT appear in the as-is golden. */
  readonly asIsAbsences: readonly string[];
}[] = [
  {
    scenario: "FX-15/release-verification-fails",
    requirements: ["F153-FR-016", "F153-FR-010", "F153-FR-011", "F153-FR-034"],
    asIsAbsences: ["npm test FAILED", "verification.started", "check.started"],
  },
  {
    scenario: "FX-14/mode-required-fail",
    requirements: ["F153-FR-010", "F153-FR-011", "F153-FR-034"],
    asIsAbsences: ["verification.started", "check.started"],
  },
  {
    scenario: "FX-02/reject-approve",
    requirements: ["F153-FR-037", "F153-FR-048", "F153-FR-050"],
    asIsAbsences: ["attempt.ended", "PREVIOUSLY CONFIRMED", "The check the engine ran itself"],
  },
  {
    scenario: "FX-02/reject-twice-approve",
    requirements: ["F153-FR-048"],
    asIsAbsences: ["PREVIOUSLY CONFIRMED"],
  },
  {
    scenario: "FX-17/iteration-limit",
    requirements: ["F153-FR-037"],
    asIsAbsences: ["attempt.ended"],
  },
  {
    scenario: "FX-13/resume-after-reject-limit",
    requirements: ["F153-FR-058"],
    asIsAbsences: ["handoff.md"],
  },
];

/** The register rows this feature requests in amendments.md, by requested id. */
const REQUESTED_ROWS: readonly string[] = [
  "DV-123",
  "DV-124",
  "DV-125",
  "DV-126",
  "DV-127",
  "DV-128",
  "DV-129",
  "DV-130",
  "DV-131",
];

/** The delivered requirements of the feature the parity check must exercise. */
const DELIVERED_REQUIREMENTS: readonly string[] = [
  "F153-FR-010",
  "F153-FR-011",
  "F153-FR-016",
  "F153-FR-034",
  "F153-FR-037",
  "F153-FR-048",
  "F153-FR-050",
  "F153-FR-058",
];

/** The scenarios of the check that were actually DRIVEN (never skipped). */
const DRIVEN_SCENARIOS: string[] = [];

test("CT-153-61: the amendments file requests the register rows the parity comparison needs", () => {
  const text = readFileSync(AMENDMENTS, "utf8");
  for (const row of REQUESTED_ROWS) {
    assert.ok(
      text.includes(`| ${row} |`),
      `${row} is requested in specs/153-loop-feedback-speed/amendments.md`,
    );
  }
  // Row DV-123 is the defect-fix row the parity profile already names.
  const profile = readFileSync(
    join(REPOSITORY, "packages/contracts/data/parity-profile.json"),
    "utf8",
  );
  assert.ok(profile.includes("DV-123"), "row 135 of the parity profile names DV-123");
});

for (const entry of SCENARIOS) {
  test(`CT-153-61: ${entry.scenario} — the as-is golden shows the behaviour the delivered requirements restore (${entry.requirements.join(", ")})`, () => {
    const golden = readGoldenCapture(entry.scenario);
    const text = JSON.stringify(golden.surfaces);
    for (const absence of entry.asIsAbsences) {
      assert.ok(
        !text.includes(absence),
        `the as-is golden of ${entry.scenario} holds no ${JSON.stringify(absence)}`,
      );
    }
  });

  test(`CT-153-61: ${entry.scenario} — under \`--profile parity\` nothing reads \`different\` outside the register rows`, (t) => {
    const fixture = JSON.parse(
      readFileSync(join(FIXTURES, entry.scenario, "fixture.json"), "utf8"),
    ) as { entryPoint?: { port?: string }; fixtures?: unknown };
    const unavailable = sideIsAvailable("port", REPOSITORY, fixture.entryPoint?.port ?? "run");
    // A side the build cannot drive is NOT a pass and NOT a failure of the
    // product (F141-FR-037): it is a skip with the reason the driver gives.
    // The skip is recorded so the coverage check below can see it.
    if (unavailable !== undefined) {
      t.skip(
        `${entry.scenario}: the port side cannot be driven, so the parity comparison did not run. ` +
          `${unavailable.reason}`,
      );
      return;
    }
    // A drive that reuses a run root of earlier drives would capture every
    // stale run directory of those drives beside its own, so the comparison
    // would read hundreds of phantom differences (T324 drives this test many
    // times while the parity gaps close). Each drive starts from an EMPTY run
    // root: the same fresh state a golden capture was taken in.
    const runRoot = join(REPOSITORY, ".specstride/tmp/parity", entry.scenario.replaceAll("/", "-"));
    rmSync(runRoot, { recursive: true, force: true });
    const driven = driveSide({
      scenario: entry.scenario,
      side: "port",
      fixtureDir: join(FIXTURES, entry.scenario),
      runRoot,
      fixture: fixture as never,
      implementationRoot: REPOSITORY,
      criticStubAddress: "http://127.0.0.1:1",
    });
    const waivers = (JSON.parse(readFileSync(WAIVERS, "utf8")) as {
      waivers: { fixture: string; surface: string; row: string }[];
    }).waivers;
    // The three surfaces of the port alone (S-14 to S-16, `port-only.ts`) have
    // no side on the reference at all — "they are never compared between the
    // sides" — so they are left out of the capture handed to
    // comparePortWithGolden: a comparison against a golden that holds none of
    // them would read `different` on every one for no divergence of behaviour.
    // Beside them, the `comparedStream` member of the surface `events` is the
    // provenance annotation the rule N-12 stamps on a PORT-side capture only
    // (`packages/oracle/src/normalize/events.ts:75`, "the compatibility
    // projection is what is compared"); the reference is normalized on its own
    // side, where N-12 acts on nothing, so a stored golden never carries it.
    // It records WHERE the compared records came from, not what any run did,
    // and no rule or waiver of feature 141 reads it — so it is taken out of
    // the compared capture here, as capture metadata and not as behaviour.
    // The `mappedBy` member of the surface `exit` is the same class the other
    // way round (`packages/oracle/src/capture/exit.ts:62`): the provenance
    // annotation of the REFERENCE side only, set where the exit-code map of
    // `resume` (DV-021, handling `mapped`) was applied to the stored golden —
    // the port's exit is its own, needs no mapping, and can never carry the
    // member. It records which row of the table mapped the reference exit,
    // not what the port did, so it is taken out here for the same reason.
    const comparison = comparePortWithGolden(
      {
        ...driven.capture,
        surfaces: Object.fromEntries(
          Object.entries(driven.capture.surfaces)
            .filter(([name]) => !["events-primary", "control-records", "counters"].includes(name))
            .map(([name, surface]) =>
              name === "events" && surface !== null && typeof surface === "object"
                ? [
                    name,
                    Object.fromEntries(
                      Object.entries(surface as Record<string, unknown>).filter(
                        ([key]) => key !== "comparedStream",
                      ),
                    ),
                  ]
                : name === "exit" && surface !== null && typeof surface === "object"
                  ? [
                      name,
                      Object.fromEntries(
                        Object.entries(surface as Record<string, unknown>).filter(
                          ([key]) => key !== "mappedBy",
                        ),
                      ),
                    ]
                  : [name, surface],
            ),
        ),
      } as typeof driven.capture,
      {
      fixture: entry.scenario,
      golden: readGoldenCapture(entry.scenario),
      portContext: {
        scenario: entry.scenario,
        side: "port" as const,
        // The roots of THIS side, as the normalizer needs them (N-01, N-02):
        // without them no absolute path of the port is folded to its
        // placeholder and every surface compares wholesale against the golden.
        roots: rootsOfRun(driven, REPOSITORY),
        statePaths: driven.statePaths,
        durationsUnderTest:
          ((fixture as Record<string, unknown>)["durationsUnderTest"] as string[] | undefined) ??
          [],
        slug: entry.scenario.split("/")[1],
      },
      waivers: waivers.filter((waiver) => waiver.fixture === entry.scenario),
    });
    // The scenario was really driven: recorded so the coverage check below can
    // hold every delivered requirement to an actually exercised scenario.
    DRIVEN_SCENARIOS.push(entry.scenario);
    // A `different` is excused ONLY by a waiver of THIS fixture, on THIS
    // surface, whose register row is one of the rows this feature REQUESTS in
    // amendments.md. A waiver on another surface, or on a row the feature does
    // not request, excuses nothing.
    const uncovered = comparison.differences.filter(
      (difference) =>
        !waivers.some(
          (waiver) =>
            waiver.fixture === difference.fixture &&
            waiver.surface === difference.surface &&
            REQUESTED_ROWS.includes(waiver.row),
        ),
    );
    assert.deepEqual(
      uncovered.map((difference) => `${difference.fixture}/${difference.surface}`),
      [],
      "a `different` that no register row of amendments.md covers fails the test (F153-FR-061)",
    );
    for (const [surface, result] of Object.entries(comparison.report.results)) {
      assert.ok(
        result.result === "equal" || result.result === "waived" || result.result === "different",
        `${surface}: the result is of the closed set`,
      );
    }
  });
}

test("CT-153-61: every delivered requirement was checked against a scenario that was actually driven", (t) => {
  // With zero driven scenarios there is nothing to hold a requirement to: the
  // check skips with its reason (F141-FR-037) — never a pass, never a failure.
  if (DRIVEN_SCENARIOS.length === 0) {
    t.skip(
      "no scenario of the parity check was driven: the port side of every scenario is " +
        "undriveable in this build (a DECLARED missing prerequisite, F141-FR-037), so no " +
        "delivered requirement could be exercised; at the release check a skip blocks (F141-FR-026)",
    );
    return;
  }
  for (const requirement of DELIVERED_REQUIREMENTS) {
    const covering = SCENARIOS.filter((entry) => entry.requirements.includes(requirement));
    assert.ok(
      covering.length > 0,
      `${requirement} has a scenario in the parity check`,
    );
    const driven = covering.filter((entry) => DRIVEN_SCENARIOS.includes(entry.scenario));
    assert.ok(
      driven.length > 0,
      `${requirement} is covered only by ${covering.map((e) => e.scenario).join(", ")}, ` +
        `and none of those scenarios was driven: a requirement checked only through a ` +
        `skipped scenario is not checked (F141-FR-037)`,
    );
  }
});
