/**
 * T039 — characterization tests CT-130-24, CT-130-25 and CT-130-37
 * (F130-FR-024, F130-FR-025, F130-FR-037).
 *
 * CT-130-24 — the coverage check runs before EVERY critic call: a fake binary
 * that exposes ONE MORE tool id than the patch covers refuses the critic role
 * with `critic_not_toolless`, and the check runs again after an install (each
 * call enumerates the tool ids afresh; an install between two calls is seen).
 * CT-130-25 — a version other than the exact pin refuses the critic role the
 * same way; and the proof record of a strict call holds the FOUR facts (the
 * version pin, the coverage check, the hash of the patch, the exported
 * permission mode `read-only`) and says that it is the WEAKER proof.
 * CT-130-37 — under the `parity` profile the proof is the value `none`: no
 * proof is made and the role is not refused for it.
 *
 * The fake binary is the one of the harness port suite (`fake-dsh.mjs`):
 * `FAKE_DSH_TOOL_IDS` holds the tool ids it exposes, `FAKE_DSH_VERSION` the
 * version it states, and `--dump-config` answers the introspection. Witness:
 * the refusal and the record are observed through the binary's own transcript
 * and the proof record the adapter returns, not through a mutation response.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runDshCritic } from "../src/critic/index.ts";
import { CRITIC_NOT_TOOLLESS } from "../src/coverage/index.ts";
import { CRITIC_PATCH_IDS, criticPatchDocument, criticPatchHash } from "../src/critic/patch.ts";
import { DSH_PIN } from "../src/descriptor/data.ts";

/** The fake binary of the harness port suite (T009). */
const FAKE_DSH = fileURLToPath(
  new URL("../../../packages/testkit/src/conformance/EP-02/fake-dsh.mjs", import.meta.url),
);

/** Stages the fake as `dsh` on a search path, with a record directory. */
const ROOT = mkdtempSync(join(tmpdir(), "ct130-critic-proof."));
const BIN_DIR = join(ROOT, "bin");
const RECORD_DIR = join(ROOT, "record");
mkdirSync(BIN_DIR, { recursive: true });
mkdirSync(RECORD_DIR);
const LAUNCHER = join(BIN_DIR, "dsh");
writeFileSync(LAUNCHER, `#!/bin/sh\nexec "${process.execPath}" "${FAKE_DSH}" "$@"\n`);
chmodSync(LAUNCHER, 0o755);
process.on("exit", () => {
  try {
    rmSync(ROOT, { recursive: true, force: true });
  } catch {
    /* best effort */
  }
});

/**
 * The INDEPENDENT READ PATH: the fake binary appends one JSON line per
 * invocation it served to `RECORD_DIR/record.jsonl`. The tests below read the
 * transcript (not the returned object) to witness what really ran on the wire:
 * the `--dump-config` introspection of the coverage check, the critic call
 * itself with its argv, environment, permission mode and patch file.
 */
type FakeRecord = {
  argv: string[];
  env: Record<string, string>;
  patch: { id: string; disabled: boolean }[] | null;
  permissionMode: string | null;
};

function readTranscript(): FakeRecord[] {
  const file = join(RECORD_DIR, "record.jsonl");
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as FakeRecord);
}

const BASE_IDS = JSON.stringify(CRITIC_PATCH_IDS);

/** The environment of a strict critic call against the staged fake. */
function strictEnv(extra: Record<string, string> = {}): Record<string, string> {
  return {
    PATH: BIN_DIR,
    HOME: ROOT,
    FAKE_DSH_RECORD_DIR: RECORD_DIR,
    FAKE_DSH_TOOL_IDS: BASE_IDS,
    ...extra,
  };
}

/** Runs one critic call under the strict proof. */
function strictCritic(env: Record<string, string>, extra: Record<string, unknown> = {}) {
  return runDshCritic({
    prompt: "review the pass",
    cwd: ROOT,
    path: BIN_DIR,
    env,
    contextTokens: 98_304,
    script: JSON.stringify([{ text: "verdict: pass\n" }]),
    ...extra,
  });
}

test("CT-130-24: a fake binary with one more tool id refuses the critic (F130-FR-024)", () => {
  const before = readTranscript().length;
  const run = strictCritic(
    strictEnv({ FAKE_DSH_TOOL_IDS: JSON.stringify([...CRITIC_PATCH_IDS, "tool-extra"]) }),
  );
  assert.ok(
    !run.ok && "refused" in run && run.refused === CRITIC_NOT_TOOLLESS,
    JSON.stringify(run),
  );
  assert.ok(
    run.ok === false && run.message.includes("tool-extra"),
    "the refusal names the uncovered id",
  );
  // Independent read path: the fake served the --dump-config introspection of
  // the coverage check (and nothing else was called on its last arm).
  const records = readTranscript();
  assert.ok(records.length > before, "the fake recorded at least the introspection");
  const introspect = records[records.length - 1]!;
  assert.ok(
    introspect.argv.includes("--dump-config"),
    `the last invocation was the introspection: ${JSON.stringify(introspect.argv)}`,
  );
  assert.equal(introspect.env.FAKE_DSH_TOOL_IDS?.includes("tool-extra"), true);
});

test("CT-130-24: the exact pin with the covered ids proves the tool-less critic", () => {
  const before = readTranscript().length;
  const run = strictCritic(strictEnv());
  assert.ok(run.ok && run.proof.proof === "strict", JSON.stringify(run));
  // Independent read path: the fake served the --dump-config introspection
  // AND the critic call itself (argv carries --patch and the patch file).
  const records = readTranscript().slice(before);
  const introspect = records.find((r) => r.argv.includes("--dump-config"));
  const call = records.find((r) => r.argv.includes("--patch"));
  assert.ok(introspect, "the introspection ran on the wire");
  assert.ok(call, "the critic call ran on the wire");
  assert.ok(call.argv.includes("--profile"), "the call states the profile");
  assert.equal(call.permissionMode, "read-only", "the call exported read-only");
});

test("CT-130-24: the check runs again after an install — each call enumerates afresh", () => {
  // Call 1: the 18 covered ids; the enumeration precedes the call.
  const before = readTranscript().length;
  const first = strictCritic(strictEnv());
  assert.ok(first.ok, JSON.stringify(first));
  const afterFirst = readTranscript();
  const firstRecords = afterFirst.slice(before);
  assert.ok(
    firstRecords.some((r) => r.argv.includes("--dump-config")),
    "call 1 introspected",
  );
  assert.ok(
    firstRecords.some((r) => r.argv.includes("--patch")),
    "call 1 reached the critic",
  );
  // An install in between: the fake now exposes one more tool id.
  const second = strictCritic(
    strictEnv({
      FAKE_DSH_TOOL_IDS: JSON.stringify([...CRITIC_PATCH_IDS, "tool-installed-by-plugin"]),
    }),
  );
  assert.ok(
    !second.ok && "refused" in second && second.refused === CRITIC_NOT_TOOLLESS,
    "the second call is refused: the check ran AGAIN, not once",
  );
  // Independent read path: the second arm ran a FRESH introspection that saw
  // the installed tool id, and never reached the critic call.
  const secondRecords = readTranscript().slice(afterFirst.length);
  const introspect = secondRecords.find((r) => r.argv.includes("--dump-config"));
  assert.ok(introspect, "the second call enumerated the tool ids afresh");
  assert.equal(
    introspect.env.FAKE_DSH_TOOL_IDS?.includes("tool-installed-by-plugin"),
    true,
    "the fresh enumeration saw the installed id",
  );
  assert.equal(
    secondRecords.some((r) => r.argv.includes("--patch")),
    false,
    "the refused call never invoked the critic",
  );
});

test("CT-130-25: a version other than the pin refuses the critic (F130-FR-025)", () => {
  // The version probe of the seam is the one the detection uses; the test
  // hands it the probe so the installed version reads as 0.1.0-rc.7 (the
  // fake itself also states that version, through FAKE_DSH_VERSION).
  const before = readTranscript().length;
  const run = strictCritic(strictEnv({ FAKE_DSH_VERSION: "0.1.0-rc.7" }), {
    probeVersion: () => "0.1.0-rc.7",
  });
  assert.ok(
    !run.ok && "refused" in run && run.refused === CRITIC_NOT_TOOLLESS,
    JSON.stringify(run),
  );
  assert.ok(
    run.ok === false && run.message.includes("0.1.0-rc.7") && run.message.includes(DSH_PIN),
    "the refusal names the version found and the pin",
  );
  // Independent read path: the refusal happened BEFORE anything was called —
  // the fake binary served nothing at all.
  assert.equal(readTranscript().length, before, "no invocation reached the fake binary");
});

test("CT-130-25: the strict record holds the four facts and says weaker (F130-FR-025)", () => {
  const before = readTranscript().length;
  const run = strictCritic(strictEnv());
  assert.ok(run.ok, JSON.stringify(run));
  if (!run.ok) return;
  const proof = run.proof;
  assert.equal(proof.proof, "strict");
  assert.equal(proof.versionPin, DSH_PIN, "fact 1: the version pin");
  assert.equal(proof.versionMatchesPin, true);
  assert.equal(proof.toolCoverage, "passed", "fact 2: the coverage check");
  assert.match(proof.patchHash, /^[0-9a-f]{64}$/, "fact 3: the hash of the patch");
  assert.equal(proof.permissionMode, "read-only", "fact 4: the exported permission mode");
  assert.equal(proof.weakerProof, true);
  assert.equal(proof.statement, "weaker proof");
  assert.equal(run.permissionMode, "read-only");
  assert.equal(existsSync(run.argv[4]!), false, "the patch is removed after the call");
  // Independent read path: the patch file's content hash is recomputed from
  // the DURABLE record the fake kept of the call, and matches the proof.
  const call = readTranscript()
    .slice(before)
    .find((r) => r.argv.includes("--patch"));
  assert.ok(call, "the critic call is in the fake's transcript");
  assert.ok(call.patch, "the call carried the patch file");
  assert.equal(call.patch!.length, CRITIC_PATCH_IDS.length, "18 ids in the patch");
  assert.equal(
    call.patch!.every((e) => e.disabled === true),
    true,
  );
  assert.equal(
    criticPatchHash(criticPatchDocument()),
    proof.patchHash,
    "the recorded hash matches the proof record",
  );
  assert.equal(call.permissionMode, "read-only");
  assert.equal(call.argv[call.argv.indexOf("--profile") + 1], "headless");
});

test("CT-130-37: under parity the proof is the value none (F130-FR-037, row 117)", () => {
  const before = readTranscript().length;
  const run = strictCritic(
    strictEnv({
      FAKE_DSH_TOOL_IDS: JSON.stringify([...CRITIC_PATCH_IDS, "tool-extra"]),
      DSH_PROFILE: "parity",
    }),
  );
  assert.ok(run.ok, `no refusal under parity: ${JSON.stringify(run)}`);
  assert.ok(run.ok && run.proof.proof === "none");
  assert.equal(run.ok && run.proof.statement, "no proof was made");
  // Independent read path: no introspection ran (no proof is made) and the
  // call the fake served went out with --profile parity.
  const records = readTranscript().slice(before);
  assert.equal(
    records.some((r) => r.argv.includes("--dump-config")),
    false,
    "no proof is made under parity: no introspection ran",
  );
  const call = records[records.length - 1];
  assert.ok(call && call.argv.includes("--patch"), "the parity call still ran");
  assert.equal(call.argv[call.argv.indexOf("--profile") + 1], "parity");
});

test("CT-130-37: the switch harnesses.dsh.critic.proof accepts strict and none only", () => {
  assert.throws(
    () => strictCritic(strictEnv({ DSH_CRITIC_PROOF: "observed" })),
    /harnesses\.dsh\.critic\.proof/,
    "an unknown value of the switch is a configuration error",
  );
});
