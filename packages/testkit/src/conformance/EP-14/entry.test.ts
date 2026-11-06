/**
 * T058 (feature 112) — CT-112-128, the doctor on every host
 * (F112-FR-028; spec.md scenario 2 of the Success criteria). Three cases:
 *
 *  1. ONE engine function: every exposure goes through `doctorEntry`, which
 *     calls the same `renderText` over the same findings and lets the
 *     findings table decide the exit code; two exposures differ ONLY in the
 *     host they name, never in the engine or the body of the output.
 *  2. A host reaches the doctor through its rendering of the command
 *     `doctor` (EP-01 `renderEntry`) and the CLI protocol only: the host
 *     sample of `src/samples/EP-01/` renders `doctor` to
 *     `specstride doctor`, the spelling that runs the engine.
 *  3. The calling host is NAMED in the output (`host=<id>`), for the CLI
 *     default `cli` and for a host that names itself.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { operations } from "../../samples/EP-01/index.ts";
import {
  doctorEntry,
  DOCTOR_COMMAND_ID,
  DOCTOR_EXPOSURES,
  EXPOSURE_REACHES_ENGINE_VIA,
  DEFAULT_DOCTOR_HOST,
} from "../../../../doctor/src/render/entry.ts";
import { renderText } from "../../../../doctor/src/render/text.ts";
import type { Finding } from "../../../../doctor/src/registry/types.ts";

/** One `warn` finding, enough to see a rendered line beyond the first. */
function warnFinding(id: string): Finding {
  return {
    id,
    severity: "warn",
    lb: false,
    message: "the configuration names an unknown key",
    evidence: Object.freeze({}),
    remedy: "remove the unknown key from the project configuration",
  };
}

test("CT-112-128: one engine function behind the three exposures", () => {
  assert.deepEqual([...DOCTOR_EXPOSURES], ["cli", "claude-code", "dsh"]);
  assert.equal(DOCTOR_COMMAND_ID, "doctor");
  // Each exposure reaches the engine through the CLI protocol, in words.
  assert.deepEqual([...Object.keys(EXPOSURE_REACHES_ENGINE_VIA)], ["cli", "claude-code", "dsh"]);
  for (const exposure of DOCTOR_EXPOSURES) {
    assert.match(
      EXPOSURE_REACHES_ENGINE_VIA[exposure],
      /CLI|command `specstride doctor`/,
      `${exposure} reaches the engine through the CLI protocol`,
    );
  }
  // The same findings through two exposures: identical engine, identical
  // body; only the host named in the output differs.
  const findings = [warnFinding("config.unknownKey")];
  const viaCli = doctorEntry({ host: "cli", findings, audience: "local" });
  const viaHost = doctorEntry({ host: "claude-code", findings, audience: "local" });
  assert.equal(viaCli.text.replace("host=cli", ""), viaHost.text.replace("host=claude-code", ""));
  // The entry renders through the same text renderer a direct call uses.
  assert.equal(
    viaCli.text,
    renderText(
      findings,
      { host: "cli", audience: "local", proposer: "unpicked", critic: "unpicked" },
      0,
    ),
  );
  // The findings table decides the exit code when the caller gives none.
  assert.equal(viaCli.exit, 0, "a warning alone exits 0 (D-2)");
  const failing = doctorEntry({
    findings: [{ ...warnFinding("run.lock"), severity: "fail", lb: true }],
  });
  assert.equal(failing.exit, 2, "a `fail` exits 2 through the entry too");
});

test("CT-112-128: a host reaches the doctor through renderEntry of `doctor`", () => {
  // The host's rendering of the logical command id `doctor` is the CLI
  // spelling that runs the engine (EP-01, annex H §H.1).
  const renderEntry = operations.renderEntry as (logicalId: string) => string;
  assert.equal(renderEntry("doctor"), "specstride doctor");
});

test("CT-112-128: the calling host is named in the output", () => {
  const plain = doctorEntry({ findings: [] });
  assert.equal(plain.host, DEFAULT_DOCTOR_HOST);
  assert.match(plain.text, /^specstride doctor: host=cli /, "the direct CLI call names host=cli");
  const named = doctorEntry({ findings: [], host: "dsh" });
  assert.match(named.text, /host=dsh/, "a host that names itself is named in the output");
  // The host is named in the worst case as well: the header line carries it.
  const worst = doctorEntry({
    findings: [{ ...warnFinding("run.lock"), severity: "fail", lb: true }],
    host: "dsh",
  });
  const header = worst.text.split("\n")[0] as string;
  assert.ok(header.includes("dsh"), `the failing-path header names the calling host: ${header}`);
});
