/**
 * T030 — the behaviour cases of EP-10, which belong to feature 110:
 * CT-110-128, CT-110-129 and CT-110-130 (F110-FR-033, F110-FR-034,
 * F110-FR-035).
 *
 * They sit beside `contract.test.ts` — the frame of feature 100 and its case
 * CT-100-207 — and beside the minimal sample of the scheme `test:` in
 * `packages/testkit/src/samples/EP-10/`, exactly as §A.4 places a content
 * owner's cases ("the behaviour of EP-10 belongs to feature 110; its behaviour
 * cases go in this folder beside this file").
 *
 * CT-110-128 (F110-FR-033): the bound host — the host of the endpoint of the
 *   same entry for an endpoint kind, `null` for a harness of kind `cli`, a
 *   plain endpoint refused except on the loopback address, and the endpoint
 *   from the user file, the environment or a flag only.
 * CT-110-129 (F110-FR-034): a missing secret of a role in use refuses the
 *   launch before the first pass, naming the reference and the key; in a run it
 *   leads to `blocked-on-human`; the doctor checks a reference with `exists`
 *   alone.
 * CT-110-130 (F110-FR-035): the registry is open — the sample resolver of the
 *   scheme `test:` is REGISTERED into it from the test tree, a scheme no
 *   resolver handles is a configuration error, and the conformance suite of
 *   EP-10 passes on the sample and on the three resolvers of Wave 1 without a
 *   change to a core file.
 *
 * The three resolvers run against real things: a real file of mode 0600 in a
 * throw-away directory, and a real fake keychain tool through the real
 * `node:child_process` seam.
 */
import assert from "node:assert/strict";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";

import {
  POINT_ID,
  STATE_WHEN_MISSING_IN_A_RUN,
  unknownValueOutcome,
} from "@specstride/contracts/ep/secret-resolver";
import {
  BOUND_HOST_OF_A_CLI_HARNESS,
  CLI_BINDING,
  CLI_KIND,
  ENDPOINT_LAYERS,
  EXISTENCE_RESULTS,
  MISSING_IN_A_RUN_LEADS_TO,
  REFUSED_BEFORE,
  REGISTRY_IS_OPEN,
  SecretError,
  SecretHostRefusedError,
  WAVE_1_REGISTERED_SCHEMES,
  boundHostOfDeclaration,
  createEnvResolver,
  createFileResolver,
  createKeychainResolver,
  createSecretBindings,
  createSecretRegistry,
  createWave1Registry,
  doctorSecretCheck,
  endpointLayerIsAllowed,
  isLoopback,
  nodeToolRunner,
  refuseLaunchOnMissingSecrets,
  resolveAtUse,
  secretReferencesInUse,
  type ConfigSecretResolver,
  type SecretDeclaration,
} from "@specstride/config";

import { ROOT } from "../frame.ts";
import type { Implementation } from "../frame.ts";
import {
  SCHEME as TEST_SCHEME,
  VALUES as TEST_VALUES,
  BOUND_HOST as TEST_BOUND_HOST,
  implementation as sampleImplementation,
  operations as sampleOperations,
} from "../../samples/EP-10/index.ts";
import { standardCases } from "../common.ts";
import { casesAsTests, type ConformanceCase } from "../run.ts";

const EP = "EP-10" as const;

/* ------------------------------------------------------------------ *
 * The fixture: real places, a real file, a real fake tool.
 * ------------------------------------------------------------------ */

const FIXTURE_ROOT = realpathSync(mkdtempSync(join(tmpdir(), "specstride-110-ep10-")));
const WORKSPACE_ROOT = join(FIXTURE_ROOT, "workspace");
const CONTROL_ROOT = join(FIXTURE_ROOT, "control");
const HOME = join(FIXTURE_ROOT, "home");
const OUTSIDE = join(FIXTURE_ROOT, "outside");
for (const dir of [WORKSPACE_ROOT, CONTROL_ROOT, HOME, OUTSIDE])
  mkdirSync(dir, { recursive: true });

const FILE_SECRET = "ep10-file-secret-value";
const KEYCHAIN_SECRET = "ep10-keychain-secret-value";
const ENV_SECRET = "ep10-env-secret-value";

const SECRET_FILE = join(OUTSIDE, "credential");
writeFileSync(SECRET_FILE, `${FILE_SECRET}\n`);
chmodSync(SECRET_FILE, 0o600);

const KEYCHAIN_TOOL = join(OUTSIDE, "fake-secret-tool");
writeFileSync(
  KEYCHAIN_TOOL,
  [
    "#!/bin/sh",
    'case " $* " in',
    '  *" ep10-service "*) ;;',
    "  *) exit 1 ;;",
    "esac",
    `printf '%s\\n' ${JSON.stringify(KEYCHAIN_SECRET)}`,
    "",
  ].join("\n"),
);
chmodSync(KEYCHAIN_TOOL, 0o700);

const REFERENCE = Object.freeze({
  env: "env:EP10_CREDENTIAL",
  file: `file:${SECRET_FILE}`,
  keychain: "keychain:ep10-service/ep10-account",
  unset: "env:EP10_CREDENTIAL_THAT_IS_NOT_SET",
});

const ENVIRONMENT = Object.freeze({ EP10_CREDENTIAL: ENV_SECRET });

const HOST = "api.example.invalid" as const;
const ENDPOINT = `https://${HOST}/v1` as const;

/** A redactor over the interface of §X.4, with exact-match removal only. */
function redactorOf(): {
  register(secret: string): void;
  redact(
    text: string,
    sizeCap: number,
  ): { text: string; replacements: number; patternSetVersion: string };
  registered(): readonly string[];
} {
  const secrets: string[] = [];
  return {
    register(secret: string): void {
      if (secret !== "" && !secrets.includes(secret)) secrets.push(secret);
    },
    redact(text: string, sizeCap: number) {
      let out = text;
      let replacements = 0;
      for (const secret of [...secrets].sort((a, b) => b.length - a.length)) {
        if (secret === "" || !out.includes(secret)) continue;
        replacements += out.split(secret).length - 1;
        out = out.split(secret).join("[redacted]");
      }
      return {
        text: sizeCap >= 0 && out.length > sizeCap ? out.slice(0, sizeCap) : out,
        replacements,
        patternSetVersion: "ep10",
      };
    },
    registered(): readonly string[] {
      return Object.freeze([...secrets]);
    },
  };
}

/** A declaration of a reference, with the defaults of the fixture. */
function declaration(over: Partial<SecretDeclaration> = {}): SecretDeclaration {
  return {
    key: "roles.proposer.credential",
    reference: REFERENCE.env,
    harnessId: "codex",
    kind: "openai-chat",
    endpoint: ENDPOINT,
    endpointLayer: "U",
    ...over,
  };
}

/* ------------------------------------------------------------------ *
 * CT-110-128 — F110-FR-033
 * ------------------------------------------------------------------ */

const boundHostCase: ConformanceCase = {
  id: "CT-110-128",
  title:
    "a secret is sent only to the host it is bound to: the host of the endpoint of the same " +
    "entry for an endpoint kind, `null` for a harness of kind `cli`, a plain endpoint refused " +
    "except on the loopback address, and the endpoint from user file, environment or flag only " +
    "(F110-FR-033)",
  level: "behaviour",
  proves: ["F110-FR-033"],
  async run() {
    // The binding is made WHERE THE REFERENCE IS DECLARED.
    const endpointKind = boundHostOfDeclaration(declaration());
    assert.equal(endpointKind.refused, false);
    assert.equal(endpointKind.host, HOST);

    // For a harness of kind `cli`: the process of that harness only (CQ-159).
    const cli = boundHostOfDeclaration(
      declaration({ kind: CLI_KIND, endpoint: undefined, endpointLayer: undefined }),
    );
    assert.equal(cli.refused, false);
    assert.equal(cli.host, null);
    assert.equal(BOUND_HOST_OF_A_CLI_HARNESS, null);
    assert.equal(CLI_BINDING, "the process of that harness only");

    // An endpoint that is not encrypted is refused, except on the loopback address.
    const plain = boundHostOfDeclaration(declaration({ endpoint: `http://${HOST}/v1` }));
    assert.equal(plain.refused, true);
    assert.equal(plain.reason, "endpoint-not-encrypted");
    assert.match(plain.message ?? "", /plain and unencrypted/);
    for (const loopback of ["http://localhost:8080/v1", "http://127.0.0.1:8080/v1"]) {
      const allowed = boundHostOfDeclaration(declaration({ endpoint: loopback }));
      assert.equal(allowed.refused, false, loopback);
      assert.equal(isLoopback(new URL(loopback).hostname), true);
    }

    // The endpoint comes from the user file, the environment or a flag only.
    assert.deepEqual([...ENDPOINT_LAYERS], ["F", "E", "U"]);
    for (const layer of ["F", "E", "U"] as const) {
      assert.equal(endpointLayerIsAllowed(layer), true);
      assert.equal(boundHostOfDeclaration(declaration({ endpointLayer: layer })).refused, false);
    }
    for (const layer of ["P", "C"] as const) {
      assert.equal(endpointLayerIsAllowed(layer), false);
      const refused = boundHostOfDeclaration(declaration({ endpointLayer: layer }));
      assert.equal(refused.refused, true);
      assert.equal(refused.reason, "endpoint-layer-not-allowed");
    }
    // An endpoint kind with no endpoint of the same entry is bound to nothing.
    const none = boundHostOfDeclaration(declaration({ endpoint: undefined }));
    assert.equal(none.refused, true);
    assert.equal(none.reason, "no-endpoint");

    // `boundHost` of each resolver of Wave 1 answers from the declaration.
    const redactor = redactorOf();
    const bindings = createSecretBindings([
      declaration(),
      declaration({ key: "roles.critic.credential", reference: REFERENCE.file }),
      declaration({
        key: "harnesses.codex.auth.credential",
        reference: REFERENCE.keychain,
        kind: CLI_KIND,
        endpoint: undefined,
        endpointLayer: undefined,
      }),
    ]);
    const registry = createWave1Registry({
      redactor,
      environment: ENVIRONMENT,
      workspaceRoot: WORKSPACE_ROOT,
      controlRoot: CONTROL_ROOT,
      home: HOME,
      bindings,
      platform: "linux",
      keychainCommand: KEYCHAIN_TOOL,
      keychainRun: nodeToolRunner,
    });
    assert.equal(registry.boundHost(REFERENCE.env), HOST);
    assert.equal(registry.boundHost(REFERENCE.file), HOST);
    // The `cli` declaration: bound to a process, so to no host at all.
    assert.equal(registry.boundHost(REFERENCE.keychain), null);
    assert.equal(bindings.mayBeSentTo(REFERENCE.env, HOST), true);
    assert.equal(bindings.mayBeSentTo(REFERENCE.env, "evil.example.invalid"), false);
    assert.equal(bindings.mayBeSentTo(REFERENCE.keychain, HOST), false);

    // A use at the bound host resolves; a use anywhere else is refused BEFORE
    // the value is fetched, which is why nothing was registered.
    const value = await resolveAtUse({
      registry,
      bindings,
      use: { key: "roles.proposer.credential", reference: REFERENCE.env, host: HOST },
    });
    assert.equal(value.value, ENV_SECRET);
    const second = redactorOf();
    const other = createWave1Registry({
      redactor: second,
      environment: ENVIRONMENT,
      workspaceRoot: WORKSPACE_ROOT,
      controlRoot: CONTROL_ROOT,
      home: HOME,
      bindings,
      platform: "linux",
      keychainCommand: KEYCHAIN_TOOL,
      keychainRun: nodeToolRunner,
    });
    await assert.rejects(
      () =>
        resolveAtUse({
          registry: other,
          bindings,
          use: {
            key: "roles.proposer.credential",
            reference: REFERENCE.env,
            host: "evil.example.invalid",
          },
        }),
      (error: unknown) => {
        assert.ok(error instanceof SecretHostRefusedError);
        assert.equal(error.boundHost, HOST);
        assert.equal(error.host, "evil.example.invalid");
        assert.equal(error.message.includes(ENV_SECRET), false);
        return true;
      },
    );
    assert.deepEqual(other.resolved(), []);
    assert.deepEqual(second.registered(), []);

    // The sample of the test tree names its own host, as a resolver must.
    assert.equal(sampleOperations.boundHost(`${TEST_SCHEME}present`), TEST_BOUND_HOST);
    assert.equal(sampleOperations.boundHost("other:x"), null);
  },
};

/* ------------------------------------------------------------------ *
 * CT-110-129 — F110-FR-034
 * ------------------------------------------------------------------ */

const missingSecretCase: ConformanceCase = {
  id: "CT-110-129",
  title:
    "a secret reference of a role in use that resolves to `missing` refuses the launch before " +
    "the first pass and names the reference and the key; in a run it leads to " +
    "`blocked-on-human`; the doctor checks a reference with `exists` alone (F110-FR-034)",
  level: "behaviour",
  proves: ["F110-FR-034"],
  async run() {
    const redactor = redactorOf();
    const registry = createWave1Registry({
      redactor,
      environment: ENVIRONMENT,
      workspaceRoot: WORKSPACE_ROOT,
      controlRoot: CONTROL_ROOT,
      home: HOME,
      platform: "linux",
      keychainCommand: KEYCHAIN_TOOL,
      keychainRun: nodeToolRunner,
    });

    // The references of the roles in use, and no others.
    const values = new Map<string, { value: unknown }>([
      ["roles.proposer.credential", { value: REFERENCE.unset }],
      ["roles.critic.credential", { value: REFERENCE.file }],
      ["roles.diagnostician.model", { value: "a-model" }],
    ]);
    const inUse = secretReferencesInUse({ values, rolesInUse: ["proposer", "critic"] });
    assert.deepEqual(inUse.map((use) => use.key).sort(), [
      "roles.critic.credential",
      "roles.proposer.credential",
    ]);
    assert.deepEqual(
      secretReferencesInUse({ values, rolesInUse: ["critic"] }).map((use) => use.key),
      ["roles.critic.credential"],
    );

    // The launch is refused, before the first pass, naming the reference and the key.
    const outcome = await refuseLaunchOnMissingSecrets({ registry, inUse });
    assert.equal(outcome.refuses, true);
    assert.equal(outcome.before, REFUSED_BEFORE);
    assert.equal(outcome.before, "the first pass");
    assert.equal(outcome.refusals.length, 1);
    const refusal = outcome.refusals[0];
    assert.ok(refusal !== undefined);
    assert.equal(refusal.key, "roles.proposer.credential");
    assert.equal(refusal.reference, REFERENCE.unset);
    assert.match(refusal.message, /roles\.proposer\.credential/);
    assert.match(refusal.message, new RegExp(REFERENCE.unset.replace(":", ":")));
    assert.equal(refusal.message.includes(ENV_SECRET), false);
    assert.equal(refusal.message.includes(FILE_SECRET), false);

    // In a run the same condition leads to `blocked-on-human`.
    assert.equal(outcome.stateInARun, "blocked-on-human");
    assert.equal(MISSING_IN_A_RUN_LEADS_TO, STATE_WHEN_MISSING_IN_A_RUN);
    assert.match(refusal.message, /blocked-on-human/);

    // Every reference present: no refusal.
    const present = await refuseLaunchOnMissingSecrets({
      registry,
      inUse: [
        { key: "roles.proposer.credential", reference: REFERENCE.env },
        { key: "roles.critic.credential", reference: REFERENCE.file },
      ],
    });
    assert.equal(present.refuses, false);
    assert.deepEqual([...present.refusals], []);

    // `unprobed` is NOT a refusal: the platform could not answer, and turning
    // an unknown into a no would refuse a launch that can run.
    const unprobed = await refuseLaunchOnMissingSecrets({
      registry,
      inUse: [{ key: "harnesses.codex.auth.credential", reference: REFERENCE.keychain }],
    });
    assert.equal(await registry.exists(REFERENCE.keychain), "unprobed");
    assert.equal(unprobed.refuses, false);

    // Nothing was resolved: a check of existence is not a use (F110-FR-032).
    assert.deepEqual(registry.resolved(), []);
    assert.deepEqual(redactor.registered(), []);

    // The doctor checks with `exists` ALONE. The function is handed a value
    // whose `resolve` throws, so a call of it would fail the case.
    let resolveCalls = 0;
    const existenceOnly = {
      exists: (reference: string) => registry.exists(reference),
      resolve: (): never => {
        resolveCalls += 1;
        throw new Error("the doctor must not resolve a secret (F110-FR-034)");
      },
    };
    const findings = await doctorSecretCheck({
      registry: existenceOnly,
      references: [
        { key: "roles.proposer.credential", reference: REFERENCE.env },
        { key: "roles.critic.credential", reference: REFERENCE.unset },
        { key: "harnesses.codex.auth.credential", reference: REFERENCE.keychain },
      ],
    });
    assert.equal(resolveCalls, 0);
    assert.deepEqual(
      findings.map((finding) => finding.existence),
      ["yes", "no", "unprobed"],
    );
    for (const finding of findings) {
      assert.ok(
        EXISTENCE_RESULTS.includes(finding.existence as never) || finding.existence === "error",
      );
      assert.equal(finding.message.includes(ENV_SECRET), false);
      assert.equal(finding.message.includes(FILE_SECRET), false);
    }
    // A reference the registry cannot even parse is reported, not thrown.
    const broken = await doctorSecretCheck({
      registry: existenceOnly,
      references: [{ key: "roles.critic.credential", reference: "vault:team/key" }],
    });
    assert.equal(broken[0]?.existence, "error");
  },
};

/* ------------------------------------------------------------------ *
 * CT-110-130 — F110-FR-035
 * ------------------------------------------------------------------ */

/** The sample of the test tree, as a resolver of the open registry of 110. */
function sampleAsResolver(): ConfigSecretResolver {
  return Object.freeze({
    id: sampleImplementation.id,
    scheme: TEST_SCHEME,
    makesANetworkCall: false as const,
    handles: sampleOperations.handles,
    exists: sampleOperations.exists,
    resolve: sampleOperations.resolve,
    boundHost: sampleOperations.boundHost,
  });
}

const openRegistryCase: ConformanceCase = {
  id: "CT-110-130",
  title:
    "the registry of schemes is open: the sample resolver of the scheme `test:` is registered " +
    "into it from the test tree, a reference whose scheme no resolver handles is a " +
    "configuration error, and no core file names a resolver or a sample (F110-FR-035)",
  level: "behaviour",
  proves: ["F110-FR-035"],
  async run() {
    assert.equal(REGISTRY_IS_OPEN, true);

    // An empty registry knows no scheme: nothing is built in.
    const registry = createSecretRegistry();
    assert.deepEqual([...registry.schemes], []);
    assert.equal(registry.handles(`${TEST_SCHEME}present`), false);

    // The sample of `packages/testkit/src/samples/EP-10/` is REGISTERED from
    // the test tree, through the same call the three resolvers of Wave 1 use.
    registry.register(sampleAsResolver());
    assert.deepEqual([...registry.schemes], [TEST_SCHEME]);
    assert.equal(registry.handles(`${TEST_SCHEME}present`), true);
    const resolved = await registry.resolve(`${TEST_SCHEME}present`);
    assert.equal(resolved.value, TEST_VALUES["present"]);
    assert.equal(resolved.registeredWithTheRedactor, true);
    assert.equal(await registry.exists(`${TEST_SCHEME}present`), "yes");
    assert.equal(await registry.exists(`${TEST_SCHEME}absent`), "no");
    assert.equal(await registry.exists(`${TEST_SCHEME}unprobed`), "unprobed");
    assert.equal(registry.boundHost(`${TEST_SCHEME}present`), TEST_BOUND_HOST);
    await assert.rejects(() => registry.resolve(`${TEST_SCHEME}absent`), /missing/);

    // The three of Wave 1 join the same registry: four schemes, one registry.
    const redactor = redactorOf();
    const wave1 = createWave1Registry({
      redactor,
      environment: ENVIRONMENT,
      workspaceRoot: WORKSPACE_ROOT,
      controlRoot: CONTROL_ROOT,
      home: HOME,
      platform: "linux",
      keychainCommand: KEYCHAIN_TOOL,
      keychainRun: nodeToolRunner,
    });
    assert.deepEqual([...wave1.schemes], [...WAVE_1_REGISTERED_SCHEMES]);
    wave1.register(sampleAsResolver());
    assert.deepEqual([...wave1.schemes], ["env:", "file:", "keychain:", TEST_SCHEME]);
    assert.equal((await wave1.resolve(REFERENCE.env)).value, ENV_SECRET);
    assert.equal((await wave1.resolve(`${TEST_SCHEME}present`)).value, TEST_VALUES["present"]);

    // A scheme no resolver handles is a CONFIGURATION ERROR, and the error is
    // the one the unknown-value rule of §C.11 names.
    for (const reference of ["vault:team/key", "aws-sm:prod/key"]) {
      await assert.rejects(
        () => wave1.resolve(reference),
        (error: unknown) => {
          assert.ok(error instanceof SecretError);
          assert.equal(error.isConfigurationError, true);
          assert.equal(error.reason, unknownValueOutcome(reference, [...wave1.schemes]));
          assert.match(error.message, /no resolver handles/);
          return true;
        },
        reference,
      );
    }
    // A value with no scheme at all is `inline-secret`.
    await assert.rejects(
      () => wave1.resolve("a-literal-value"),
      (error: unknown) => {
        assert.ok(error instanceof SecretError);
        assert.equal(error.reason, "inline-secret");
        return true;
      },
    );

    // A scheme cannot be registered twice: the registry is open, not overridable.
    assert.throws(() => wave1.register(sampleAsResolver()), /already handled by the resolver/);

    // "Without a change to a core file": no file of a core package of the graph,
    // and no file of the two packages a core package may import, names a
    // resolver of this feature, its registry or the sample of the test tree.
    const graph = JSON.parse(
      readFileSync(join(ROOT, "packages/contracts/data/package-graph.json"), "utf8"),
    ) as { packages: { name: string; core?: boolean }[] };
    const corePackages = graph.packages.filter((entry) => entry.core === true);
    assert.deepEqual(
      corePackages.map((entry) => entry.name),
      ["@specstride/core", "@specstride/layer-micro", "@specstride/layer-parallel"],
    );
    // The two packages `CORE_ALLOWED_PACKAGES` of the import boundary names are
    // scanned with them: a resolver spelled there would reach the core too.
    const scanned = [
      ...corePackages.map((entry) => entry.name),
      "@specstride/contracts",
      "@specstride/kernel",
    ];
    const forbidden = [
      "secrets/registry",
      "secrets/env.ts",
      "secrets/file.ts",
      "secrets/keychain.ts",
      "createWave1Registry",
      "createEnvResolver",
      "createFileResolver",
      "createKeychainResolver",
      "samples/EP-10",
      "sample-secret-resolver-test-scheme",
      "config-secret-resolver-",
    ];
    const files: string[] = [];
    for (const name of scanned) {
      files.push(...sourceFilesOf(join(ROOT, "packages", name.replace("@specstride/", ""), "src")));
    }
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      for (const name of forbidden) {
        assert.equal(
          text.includes(name),
          false,
          `the file ${relative(ROOT, file)} names \`${name}\`, so the resolvers of ` +
            `Wave 1 are not outside the core (F110-FR-035)`,
        );
      }
    }
    // The count is asserted so the scan can never pass by reading nothing. The
    // three core packages are still skeletons (one `index.ts` each), so the
    // weight of the check is in `contracts` and `kernel`; it is a standing
    // guard that fails the moment a core file names a resolver of this feature.
    assert.equal(files.length > 3, true, `${files.length} files scanned`);
    assert.equal(
      corePackages.every(
        (entry) =>
          sourceFilesOf(join(ROOT, "packages", entry.name.replace("@specstride/", ""), "src"))
            .length >= 1,
      ),
      true,
      "every core package of the graph has at least one source file to scan",
    );
  },
};

/** Every `.ts` file under a directory, recursively; an absent directory is empty. */
function sourceFilesOf(dir: string): readonly string[] {
  let entries: readonly string[];
  try {
    if (!statSync(dir).isDirectory()) return [];
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const name of entries) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...sourceFilesOf(path));
    else if (name.endsWith(".ts")) out.push(path);
  }
  return Object.freeze(out);
}

/* ------------------------------------------------------------------ *
 * The suite: the standard cases of §A.4 on each resolver of Wave 1,
 * then the three behaviour cases of this feature.
 * ------------------------------------------------------------------ */

/** The three resolvers of Wave 1, each as an `Implementation` of EP-10. */
function wave1Implementations(): readonly {
  readonly implementation: Implementation;
  readonly calls: readonly (readonly unknown[])[];
}[] {
  const redactor = redactorOf();
  const bindings = createSecretBindings([
    declaration(),
    declaration({ key: "roles.critic.credential", reference: REFERENCE.file }),
    declaration({ key: "harnesses.codex.auth.credential", reference: REFERENCE.keychain }),
  ]);
  const resolvers: readonly {
    readonly resolver: ConfigSecretResolver;
    readonly calls: readonly (readonly unknown[])[];
  }[] = Object.freeze([
    Object.freeze({
      resolver: createEnvResolver({ environment: ENVIRONMENT, redactor, bindings }),
      calls: Object.freeze([[REFERENCE.env], [REFERENCE.unset], ["other:x"]]),
    }),
    Object.freeze({
      resolver: createFileResolver({
        workspaceRoot: WORKSPACE_ROOT,
        controlRoot: CONTROL_ROOT,
        home: HOME,
        redactor,
        bindings,
      }),
      calls: Object.freeze([[REFERENCE.file], [`file:${join(OUTSIDE, "absent")}`], ["other:x"]]),
    }),
    Object.freeze({
      resolver: createKeychainResolver({
        redactor,
        platform: "linux",
        command: KEYCHAIN_TOOL,
        run: nodeToolRunner,
        bindings,
      }),
      calls: Object.freeze([[REFERENCE.keychain], ["keychain:ep10-service/absent"], ["other:x"]]),
    }),
  ]);
  return Object.freeze(
    resolvers.map((entry) =>
      Object.freeze({
        implementation: Object.freeze({
          ep: EP,
          pointId: POINT_ID,
          id: entry.resolver.id,
          implementationClass: "first-party" as const,
          majors: Object.freeze([1]),
          provenance: "default" as const,
          operations: Object.freeze({
            handles: entry.resolver.handles,
            exists: entry.resolver.exists,
            resolve: entry.resolver.resolve,
            boundHost: entry.resolver.boundHost,
          }),
        }) as Implementation,
        calls: entry.calls,
      }),
    ),
  );
}

export const cases: readonly ConformanceCase[] = Object.freeze([
  boundHostCase,
  missingSecretCase,
  openRegistryCase,
]);

// The conformance suite of EP-10 on each of the three resolvers of Wave 1: the
// five standard checks of §A.4, with the closed result set of `exists`
// (F110-FR-035, "the conformance suite of EP-10 MUST pass … on the three
// resolvers of Wave 1").
for (const entry of wave1Implementations()) {
  await casesAsTests(
    POINT_ID,
    entry.implementation,
    standardCases(
      EP,
      [
        `EP-10/operations-exist [${entry.implementation.id}]`,
        `EP-10/closed-result-sets [${entry.implementation.id}]`,
        `EP-10/degradation [${entry.implementation.id}]`,
        `EP-10/unknown-value-rule [${entry.implementation.id}]`,
        `EP-10/behaviour-cases [${entry.implementation.id}]`,
      ],
      {
        resultSets: [{ operation: "exists", members: [...EXISTENCE_RESULTS], calls: entry.calls }],
        throwingOperation: "resolve",
      },
    ),
  );
}

// The three behaviour cases of feature 110, run against the sample of the point
// as the frame expects of a suite of EP-10.
await casesAsTests(POINT_ID, sampleImplementation, cases);

// The fixture is a throw-away directory; every case has run by the time the
// module is evaluated, so it is removed here.
rmSync(FIXTURE_ROOT, { recursive: true, force: true });
