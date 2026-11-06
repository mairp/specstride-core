/**
 * The frame of the owner claims of EP-14: the place of a registered check
 * (CT-112-133, F112-FR-033) and the import boundary of the sample check
 * (CT-112-207 (4), F112-FR-033). The claims are about the doctor of this
 * repository — it holds no file of a check another feature registers, it
 * imports no package of an owner, and a check that arrives from outside
 * renders by the rules of a core check.
 *
 * A host package runs the claims against ITSELF by calling
 * `registerOwnerPlaceClaims` and `registerSampleCheckBoundaryClaims` at the
 * top level of its own test file, with its rows (`HostOwnerRows` of
 * `./owner-rows.ts`). The frame holds no host's rows: no package marker and
 * no check id of a host is a constant here. The doctor tree the claims read
 * is the doctor of this repository, resolved from the frame's own location,
 * so the claims read the same tree wherever they are registered from.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { SCHEMA_ID, type Severity } from "@specstride/contracts/ep/doctor";
import { registeredDoctorChecks } from "@specstride/kernel";
import {
  HARNESS_CUSTOMISATION_CHECK,
  TERMINAL_TOOL_CHECK,
  registerOwnerStubs,
} from "./owner-stubs.ts";
import {
  forbiddenImportsOfSampleCheck,
  ownerCheckIdsOf,
  ownerPackageMarkersOf,
  type HostOwnerRows,
} from "./owner-rows.ts";
import { createDoctorRegistry } from "../../../../doctor/src/registry/registry.ts";
import { runDoctorChecks, makeProbeBag } from "../../../../doctor/src/runner/run.ts";
import { renderText } from "../../../../doctor/src/render/text.ts";
import { renderJson } from "../../../../doctor/src/render/json.ts";

const REPO_ROOT = join(import.meta.dirname, "..", "..", "..", "..", "..");
const DOCTOR_PACKAGE = join(REPO_ROOT, "packages", "doctor");
const DOCTOR_SRC = join(DOCTOR_PACKAGE, "src");

/** What a registration of the place-of-a-check claims produced. */
export type RegisteredOwnerClaims = {
  /** The claims registered: always 4. */
  readonly claimCount: number;
  /** The ids the claims held the doctor against (core owners', then the host's). */
  readonly ownerCheckIdCount: number;
  /** The markers of the owner packages the doctor must not import. */
  readonly ownerPackageMarkerCount: number;
};

/** What a registration of the sample check's boundary claim produced. */
export type RegisteredBoundaryClaim = {
  /** The claims registered: always 1. */
  readonly claimCount: number;
  /** The forbidden imports the claim held the doctor against. */
  readonly forbiddenImportCount: number;
};

/** The input of both registrations: the rows of one host. */
export type OwnerClaimInput = {
  /** The rows of the host that registers the claims (`./owner-rows.ts`). */
  readonly host: HostOwnerRows;
};

/** Refuse rows that name no marker or no check: a claim without its rows proves nothing. */
function hostOf(input: OwnerClaimInput): HostOwnerRows {
  const { host } = input;
  if (host.packageMarker.length === 0) {
    throw new Error("the rows of a host name the marker of its own package");
  }
  if (host.doctorCheckIds.length === 0) {
    throw new Error("the rows of a host name the ids of the doctor checks it registers");
  }
  for (const id of host.doctorCheckIds) {
    if (id.length === 0) {
      throw new Error("the rows of a host hold no empty check id");
    }
  }
  return host;
}

/** Every file under a directory, recursively, as absolute paths. */
function filesOf(root: string): readonly string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir).sort()) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      out.push(full);
    }
  };
  walk(root);
  return out;
}

/** Every TypeScript file under a directory, as absolute paths. */
function tsFilesOf(root: string): readonly string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir).sort()) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (full.endsWith(".ts")) out.push(full);
    }
  };
  walk(root);
  return out;
}

/**
 * Register the place-of-a-check claims of CT-112-133 as `node:test` cases.
 * Call at the top level of a test file. The generated tests are, in order:
 * the doctor holds no file of a check another feature registers; the doctor
 * imports no owner package and the kernel path needs no import of the
 * doctor; the outside checks render in text and `--json` by the rules of a
 * core check; the same stubs in their healthy state print nothing but the
 * healthy line.
 */
export function registerOwnerPlaceClaims(input: OwnerClaimInput): RegisteredOwnerClaims {
  const host = hostOf(input);
  const ownerCheckIds = ownerCheckIdsOf(host);
  const ownerPackageMarkers = ownerPackageMarkersOf(host);

  test("CT-112-133 (1): packages/doctor/ holds no file of a check another feature registers", () => {
    // The code of the doctor: the sources. (The data rows of the catalogue name
    // the ids of owner-supplied checks — that data is the feature's own, which
    // F112-FR-033 keeps in the doctor.)
    for (const file of filesOf(join(DOCTOR_PACKAGE, "src"))) {
      if (!file.endsWith(".ts")) continue;
      const text = readFileSync(file, "utf8");
      for (const id of ownerCheckIds) {
        assert.ok(
          !text.includes(id),
          `${file} names the id ${id} of a check another feature registers (F112-FR-033)`,
        );
      }
    }
  });

  test("CT-112-133 (2): the doctor imports no owner package; the kernel path needs no import of the doctor", () => {
    // (a) The stubs register through the kernel call, and the fixture that
    // holds them imports contracts and kernel — never the doctor.
    registerOwnerStubs();
    const kernelIds = registeredDoctorChecks().map((c) => c.id);
    assert.ok(kernelIds.includes(HARNESS_CUSTOMISATION_CHECK.id));
    assert.ok(kernelIds.includes(TERMINAL_TOOL_CHECK.id));
    const stubSource = readFileSync(join(import.meta.dirname, "owner-stubs.ts"), "utf8");
    for (const match of stubSource.matchAll(/(?:from|import)\s+"([^"]+)"/g)) {
      const specifier = match[1] ?? "";
      // An owner imports package names only — never a relative path (into the
      // doctor's tree or anywhere of another package's source) and never a
      // module under packages/doctor.
      const crossesDoctor =
        specifier.includes("packages/doctor") ||
        specifier.startsWith("./") ||
        specifier.startsWith("../");
      assert.ok(
        !crossesDoctor,
        `the owner fixture imports "${specifier}" — an owner needs no import of the doctor`,
      );
    }
    assert.match(stubSource, /@specstride\/kernel/, "the stub registers through the kernel call");

    // (b) The doctor never imports the package of an owner.
    for (const file of filesOf(join(DOCTOR_PACKAGE, "src"))) {
      if (!file.endsWith(".ts")) continue;
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(/(?:from|import)\s+"([^"]+)"/g)) {
        const specifier = match[1] ?? "";
        for (const bad of ownerPackageMarkers) {
          assert.ok(
            !specifier.includes(bad),
            `${file} imports ${specifier}, which crosses the import boundary (${bad})`,
          );
        }
      }
    }

    // (c) The manifest of the doctor names no owner package either.
    const manifest = JSON.parse(readFileSync(join(DOCTOR_PACKAGE, "package.json"), "utf8")) as {
      dependencies: Record<string, string>;
    };
    assert.deepEqual(Object.keys(manifest.dependencies).sort(), [
      "@specstride/config",
      "@specstride/contracts",
      "@specstride/kernel",
      "@specstride/view",
    ]);
  });

  test("CT-112-133 (3): the outside checks render in text and --json by the rules of a core check", async () => {
    registerOwnerStubs();
    // Both stubs observed in their finding state: the customisation on, the
    // terminal tool missing. The registry is the doctor's own; the checks came
    // from outside, through the kernel registration call.
    const registry = createDoctorRegistry();
    const asChecks = registeredDoctorChecks().filter((c) =>
      [HARNESS_CUSTOMISATION_CHECK.id, TERMINAL_TOOL_CHECK.id].includes(c.id),
    );
    assert.equal(asChecks.length, 2);
    for (const check of asChecks) {
      registry.register(check as never);
    }

    const bag = makeProbeBag({
      files: { stat: () => undefined },
    });
    const run = await runDoctorChecks({
      checks: asChecks.map((c) => ({
        ...c,
        group: (c as unknown as { readonly group: "harness" | "run" }).group,
        probe: () =>
          Promise.resolve(
            c.id === HARNESS_CUSTOMISATION_CHECK.id
              ? { customisationOn: true, name: "offline-mode" }
              : { terminalToolPresent: false, tool: "script" },
          ),
      })),
      bag,
    });

    // By the rules of a core check: severity then id; fail before warn.
    assert.deepEqual(
      run.findings.map((f) => [f.id, f.severity]),
      [
        [TERMINAL_TOOL_CHECK.id, "fail"],
        [HARNESS_CUSTOMISATION_CHECK.id, "warn"],
      ],
    );

    // Text: header, one line per finding in that order, footer — the failing
    // form of the text renderer, with the message from the template and the
    // fix as remedy, every line within 200 bytes.
    const text = renderText(
      run.findings,
      { host: "cli", audience: "personal", proposer: "p", critic: "c" },
      run.exit,
    );
    const lines = text.split("\n");
    assert.match(lines[0]!, /^specstride doctor: cli audience=personal/);
    assert.match(
      lines[1]!,
      /^!! pipeline\.terminal\.tool\.script: terminal tool script is missing/,
    );
    assert.match(lines[2]!, /^ ! harness\.customisation\.example: customisation offline-mode/);
    assert.match(lines[lines.length - 1]!, /^exit /);
    for (const line of lines) {
      assert.ok(Buffer.byteLength(line, "utf8") <= 200, `line over the 200-byte cap: ${line}`);
    }

    // `--json`: schema `specstride.doctor/1`, both findings, messages from the
    // templates, redacted evidence, no `ok` record (neither stub is ok here).
    const json = JSON.parse(
      renderJson({
        at: "2026-10-01T00:00:00.000Z",
        host: "cli",
        audience: "personal",
        exit: run.exit,
        findings: run.findings,
      }),
    ) as {
      schema: string;
      findings: readonly { id: string; severity: Severity; message: string; evidence: string }[];
    };
    assert.equal(json.schema, SCHEMA_ID);
    assert.deepEqual(
      json.findings.map((f) => f.id),
      [TERMINAL_TOOL_CHECK.id, HARNESS_CUSTOMISATION_CHECK.id],
    );
    assert.equal(
      json.findings.find((f) => f.id === TERMINAL_TOOL_CHECK.id)?.message,
      "terminal tool script is missing; the stage that needs it cannot run",
    );
    assert.equal(
      json.findings.find((f) => f.id === HARNESS_CUSTOMISATION_CHECK.id)?.message,
      "customisation offline-mode of the harness cannot be switched off",
    );
    for (const finding of json.findings) {
      assert.equal(typeof finding.evidence, "string");
    }
  });

  test("CT-112-133 (4): the same stubs in their healthy state print nothing but the healthy line", async () => {
    registerOwnerStubs();
    const registry = createDoctorRegistry();
    const asChecks = registeredDoctorChecks().filter((c) =>
      [HARNESS_CUSTOMISATION_CHECK.id, TERMINAL_TOOL_CHECK.id].includes(c.id),
    );
    for (const check of asChecks) registry.register(check as never);
    const run = await runDoctorChecks({
      checks: asChecks.map((c) => ({
        ...c,
        group: (c as unknown as { readonly group: "harness" | "run" }).group,
        probe: () =>
          Promise.resolve(
            c.id === HARNESS_CUSTOMISATION_CHECK.id
              ? { customisationOn: false, name: "offline-mode" }
              : { terminalToolPresent: true, tool: "script" },
          ),
      })),
      bag: makeProbeBag(),
    });
    assert.deepEqual(
      run.findings.map((f) => [f.id, f.severity]),
      [
        [HARNESS_CUSTOMISATION_CHECK.id, "ok"],
        [TERMINAL_TOOL_CHECK.id, "ok"],
      ],
    );
    const text = renderText(
      run.findings,
      { host: "cli", audience: "personal", proposer: "p", critic: "c" },
      run.exit,
    );
    // `ok` is never printed: the one healthy line only (F112-FR-023).
    assert.equal(text.split("\n").length, 1);
    assert.match(text, /^specstride doctor: host=cli/);
    assert.ok(!text.includes(HARNESS_CUSTOMISATION_CHECK.id));
    assert.ok(!text.includes(TERMINAL_TOOL_CHECK.id));
  });

  return Object.freeze({
    claimCount: 4,
    ownerCheckIdCount: ownerCheckIds.length,
    ownerPackageMarkerCount: ownerPackageMarkers.length,
  });
}

/**
 * Register the import-boundary claim of the sample check (CT-112-207 (4)) as
 * a `node:test` case. Call at the top level of a test file, after the sample
 * check's own cases: no file of the doctor imports the sample or the package
 * of any owner of a registered check, and the manifest of the doctor holds no
 * owner package.
 */
export function registerSampleCheckBoundaryClaims(input: OwnerClaimInput): RegisteredBoundaryClaim {
  const host = hostOf(input);
  const forbidden = forbiddenImportsOfSampleCheck(host);

  test("CT-112-207 (4): the import-boundary check passes — the doctor imports no owner of a check", () => {
    // A check registered by another package lives whole in that package
    // (F112-FR-022, F112-FR-033); the doctor only renders what is registered.
    for (const file of tsFilesOf(DOCTOR_SRC)) {
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(/(?:from|import)\s+"([^"]+)"/g)) {
        const specifier = match[1] ?? "";
        for (const bad of forbidden) {
          assert.ok(
            !specifier.includes(bad),
            `${file} imports ${specifier}, which crosses the import boundary (${bad})`,
          );
        }
      }
    }
    // And the package manifest of the doctor holds no owner package.
    const manifest = JSON.parse(
      readFileSync(join(REPO_ROOT, "packages", "doctor", "package.json"), "utf8"),
    ) as { dependencies: Record<string, string> };
    const allowed = Object.keys(manifest.dependencies).sort();
    assert.deepEqual(allowed, [
      "@specstride/config",
      "@specstride/contracts",
      "@specstride/kernel",
      "@specstride/view",
    ]);
  });

  return Object.freeze({ claimCount: 1, forbiddenImportCount: forbidden.length });
}
