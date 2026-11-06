/**
 * The reusable `host.*` doctor check set (`src/doctor.ts`): the six checks a
 * host registers into the doctor registry of EP-14. The sample hosts here are
 * deliberately NOT the host the module moved out of, and neither of them is
 * the other: one ships two hook events and rejects its background job mode
 * with its own exec form and evidence, the other ships five hook events and
 * names another package — the point of the move is that the kit fixes the
 * checks and takes every host fact as the one required `DoctorHost` input,
 * and that the kit source names no host and no requirement of one.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CLI_PROTOCOL_VERSION,
  DOCTOR_SKILL_ID,
  HOST_SKILL_IDS,
} from "@specstride/contracts/ep/host";
import type { DoctorCheck, DoctorFinding, DoctorRegistry } from "@specstride/contracts/ep/doctor";
import { MESSAGE_TEMPLATE_CAP_BYTES } from "@specstride/contracts/ep/doctor";
import {
  BACKGROUND_ISOLATION_WARNING,
  BACKGROUND_JOB_MODE_REJECTED,
  HOST_CHECK_IDS,
  HOST_CHECK_PREFIX,
  LAUNCH_CHECK_IDS,
  SEVERITY_WHEN_NOT_OBSERVED,
  SKILLS_OF_THE_PORT,
  type DoctorHost,
  A_BACKGROUND_JOB_ADDS_A_SECOND_RUNTIME,
  BACKGROUND_ISOLATION_FACT,
  backgroundIsolationCheck,
  backgroundJobModeRejectedBecauseOf,
  cliFoundCheck,
  hostDoctorChecksOf,
  hostHooksLoadedCheckOf,
  hostLaunchChecksOf,
  isolationWarns,
  isHostCheck,
  pluginVersionCheckOf,
  protocolSupportedCheck,
  registerHostChecksOf,
  stateRootWritableCheck,
} from "../src/doctor.ts";

/** A registry of EP-14's shape, recording what it is given. */
function aRegistry(): DoctorRegistry & { registered(): readonly DoctorCheck[] } {
  const registered: DoctorCheck[] = [];
  return {
    register(check: DoctorCheck): void {
      registered.push(check);
    },
    registered(): readonly DoctorCheck[] {
      return [...registered];
    },
    async run(): Promise<readonly DoctorFinding[]> {
      return [];
    },
  };
}

/** Sample host A: two hook events, its own exec form, its own evidence. */
const HOST_A: DoctorHost = {
  packageName: "@sample/host-a",
  pluginVersion: () => "3.1.4",
  hookEventCount: 2,
  hooksLoadedFixHint: "run the sample validation of host A and reinstall it",
  backgroundExecForm: "`bg`",
  backgroundEvidence: "SR-7",
};

/** Sample host B: five hook events, another package, another version. */
const HOST_B: DoctorHost = {
  packageName: "@sample/host-b",
  pluginVersion: () => "0.9.0",
  hookEventCount: 5,
  hooksLoadedFixHint: "reload the configuration of host B",
  backgroundExecForm: "`detach`",
  backgroundEvidence: "B-12",
};

/** The checks of host A, built once for the tests that read them directly. */
const CLI_FOUND_CHECK = cliFoundCheck();
const PROTOCOL_SUPPORTED_CHECK = protocolSupportedCheck();
const STATE_ROOT_WRITABLE_CHECK = stateRootWritableCheck();
const BACKGROUND_ISOLATION_CHECK = backgroundIsolationCheck();

test("the six checks of a host are registered with the prefix host.", () => {
  const registry = aRegistry();
  const registered = registerHostChecksOf(HOST_A, registry);
  assert.equal(registry.registered().length, 6);
  assert.deepEqual(
    registered.map((c) => c.id),
    [...HOST_CHECK_IDS],
  );
  for (const id of HOST_CHECK_IDS) assert.ok(id.startsWith(HOST_CHECK_PREFIX));
});

test("only a missing CLI is a launch check", () => {
  for (const host of [HOST_A, HOST_B]) {
    const checks = hostDoctorChecksOf(host);
    assert.deepEqual(
      checks.filter((c) => c.lb).map((c) => c.id),
      [...LAUNCH_CHECK_IDS],
    );
    assert.deepEqual(
      hostLaunchChecksOf(host).map((c) => c.id),
      ["host.cli-found"],
    );
    for (const check of checks) {
      assert.equal(typeof check.fixHint, "string");
      assert.ok(check.fixHint.length > 0);
    }
  }
});

test("the message templates stay under the cap of annex G §G.7", () => {
  for (const host of [HOST_A, HOST_B]) {
    for (const check of hostDoctorChecksOf(host)) {
      assert.ok(
        Buffer.byteLength(check.messageTemplate, "utf8") <= MESSAGE_TEMPLATE_CAP_BYTES,
        `${check.id} is over the message cap`,
      );
    }
  }
});

test("host.cli-found fails when the CLI is missing and passes when it is found", async () => {
  assert.equal(CLI_FOUND_CHECK.severityRule(true), "ok");
  assert.equal(CLI_FOUND_CHECK.severityRule(false), "fail");
  assert.equal(CLI_FOUND_CHECK.severityRule(undefined), SEVERITY_WHEN_NOT_OBSERVED);
  // The probe is asynchronous (the shape of annex G §G.7), so it is awaited.
  assert.equal(await CLI_FOUND_CHECK.probe({ "cli-found": false }), false);
  assert.equal(await CLI_FOUND_CHECK.probe({ "cli-found": true }), true);
  // Every builder hands out its own frozen check; the builder never recycles.
  assert.equal(Object.isFrozen(cliFoundCheck()), true);
  assert.notEqual(cliFoundCheck(), cliFoundCheck());
});

test("host.protocol-supported holds the observed protocol against the CLI protocol of the annex", () => {
  assert.equal(PROTOCOL_SUPPORTED_CHECK.severityRule(CLI_PROTOCOL_VERSION), "ok");
  assert.equal(PROTOCOL_SUPPORTED_CHECK.severityRule(99), "fail");
  assert.equal(PROTOCOL_SUPPORTED_CHECK.severityRule(undefined), SEVERITY_WHEN_NOT_OBSERVED);
});

test("host.plugin-version holds the observed version against the version the HOST names", () => {
  const ofA = pluginVersionCheckOf(HOST_A);
  const ofB = pluginVersionCheckOf(HOST_B);
  assert.equal(ofA.severityRule("3.1.4"), "ok");
  assert.equal(ofA.severityRule("9.9.9"), "fail");
  assert.equal(ofB.severityRule("0.9.0"), "ok");
  assert.equal(ofB.severityRule("3.1.4"), "fail", "host B does not accept host A's version");
  assert.match(ofA.messageTemplate, /@sample\/host-a/);
  assert.match(ofB.fixHint, /@sample\/host-b/);
});

test("host.host-hooks-loaded reads the event count and the fix the HOST ships", () => {
  const ofA = hostHooksLoadedCheckOf(HOST_A);
  const ofB = hostHooksLoadedCheckOf(HOST_B);
  assert.equal(ofA.severityRule(true), "ok");
  assert.equal(ofA.severityRule(false), "fail");
  assert.equal(ofA.severityRule(undefined), SEVERITY_WHEN_NOT_OBSERVED);
  assert.match(ofA.messageTemplate, /for 2 events is \{state\}/);
  assert.match(ofB.messageTemplate, /for 5 events is \{state\}/);
  assert.equal(ofA.fixHint, HOST_A.hooksLoadedFixHint);
  assert.equal(ofB.fixHint, HOST_B.hooksLoadedFixHint);
});

test("host.state-root-writable warns on an unverified observation", () => {
  assert.equal(STATE_ROOT_WRITABLE_CHECK.severityRule("unverified"), "warn");
  assert.equal(STATE_ROOT_WRITABLE_CHECK.severityRule(true), "ok");
  assert.equal(STATE_ROOT_WRITABLE_CHECK.severityRule(false), "fail");
});

test("host.background-isolation WARNS when the host isolates the working tree", () => {
  assert.equal(BACKGROUND_ISOLATION_CHECK.severityRule(true), "warn");
  assert.equal(BACKGROUND_ISOLATION_CHECK.severityRule(false), "ok");
  assert.equal(BACKGROUND_ISOLATION_CHECK.lb, false, "the isolation warning never blocks a launch");
  assert.equal(BACKGROUND_ISOLATION_CHECK.messageTemplate, BACKGROUND_ISOLATION_WARNING);
  assert.equal(isolationWarns(true), true);
});

test("a host's background job mode is rejected as the runtime, in that host's own words", () => {
  assert.equal(BACKGROUND_JOB_MODE_REJECTED, true);
  assert.equal(
    backgroundJobModeRejectedBecauseOf(HOST_A),
    "the host's `bg` form runs the CLI directly, so " +
      "a background job would add a second runtime the product does not control (SR-7)",
  );
  assert.match(backgroundJobModeRejectedBecauseOf(HOST_B), /`detach`/);
  assert.match(backgroundJobModeRejectedBecauseOf(HOST_B), /B-12/);
  assert.ok(
    backgroundJobModeRejectedBecauseOf(HOST_A).includes(A_BACKGROUND_JOB_ADDS_A_SECOND_RUNTIME),
  );
  assert.equal(BACKGROUND_ISOLATION_FACT, "background-session-isolation");
});

test("the skills the hooks-loaded check reads against are the port's own, read from the contracts", () => {
  assert.equal(SKILLS_OF_THE_PORT.length, HOST_SKILL_IDS.length + 1);
  assert.deepEqual([...SKILLS_OF_THE_PORT], [...HOST_SKILL_IDS, DOCTOR_SKILL_ID]);
});

test("isHostCheck accepts the six ids of the set and refuses the rest", () => {
  for (const id of HOST_CHECK_IDS) assert.equal(isHostCheck(id), true);
  assert.equal(isHostCheck("host.unknown-check"), false);
  assert.equal(isHostCheck("cli-found"), false);
  assert.equal(isHostCheck("kernel.pipeline-built"), false);
});

/* ------------------------------------------------------------- neutrality */

test("the kit source names no host and no requirement of one", () => {
  const src = readFileSync(new URL("../src/doctor.ts", import.meta.url), "utf8");
  for (const foreign of [
    "CLAUDE",
    "Claude",
    "claude plugin",
    ".claude-plugin",
    "/specstride:",
    "specstride-",
    "F113-FR",
    "R3v",
    "--exec",
    "T022",
    "2.1.284",
  ]) {
    assert.equal(src.includes(foreign), false, `src/doctor.ts must not hold ${foreign}`);
  }
});
