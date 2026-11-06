/**
 * CT-141-110 — the harness stubs (T115, T120, T121; F141-FR-010, F141-FR-006,
 * F141-FR-011).
 *
 * What the test proves, and how:
 *
 * - **the calling convention of each harness.** Read off the baseline at
 *   `9cab15d` and asserted per harness: the prompt of Claude and of pi arrives on
 *   standard input; the prompt of a dsh pass is one positional argument and the
 *   prompt of a dsh critic call is the chunked task after `--`, rejoined with one
 *   ASCII space; the prompt of Codex is the last positional argument and never
 *   its subcommand; the prompt of prime arrives on standard input in both the
 *   agent and the launcher form. Four of the six are driven as REAL child
 *   processes through the executables of `stubs/bin/`, and the record the call
 *   left in the transcript is what is asserted.
 * - **the records of each harness.** The dsh stub records the settings file of
 *   the given home, the patch file and the permission mode (§O.3); the prime stub
 *   records the mode it was called in and the variant; the installer call records
 *   the request the controller resolved. Each is asserted from the record of a
 *   real call.
 * - **the pi stub on the port side only.** The data says so, no fixture of the
 *   oracle names the executable of pi, and the module of its convention says why.
 * - **a further harness stub is added by data.** A new entry of `harnessStubs`
 *   that no module of the oracle names gives a working convention — a name, a
 *   calling convention and a stream format — and no file of the comparator or of
 *   the normalizer holds the name of any harness, so neither has to change.
 *
 * Nothing here calls a model, opens a socket or needs a credential (F141-FR-038).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { readTranscript, type TranscriptRecord } from "../../stubs/lib/index.ts";
import {
  CONVENTION_MODULES,
  HARNESS_ENVIRONMENT,
  INSTALLER_SUBCOMMAND,
  INSTALLER_VERB,
  PI_HAS_NO_REFERENCE,
  conventionFromEntry,
  conventionOf,
  conventions,
  harnessStubEntries,
  harnessStubEntry,
  installerCallOf,
  isInstallerCall,
  roleOfInvocation,
  type HarnessStubEntry,
} from "../../stubs/lib/harness.ts";
import {
  harnessOfExecutable,
  harnessStubExecutables,
  sidesOfHarnessStub,
} from "../../stubs/lib/names.ts";
import { stubVocabulary } from "../../src/catalogue/data.ts";

const PACKAGE = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const BIN = join(PACKAGE, "stubs", "bin");

const made: string[] = [];
function temp(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), `oracle-harness-${prefix}-`));
  made.push(dir);
  return dir;
}
process.on("exit", () => {
  for (const dir of made) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // nothing to do
    }
  }
});

/** A bench for one real call of a harness stub executable of `stubs/bin/`. */
type Bench = {
  readonly root: string;
  readonly workdir: string;
  readonly transcript: string;
  readonly env: Record<string, string>;
};

function bench(scripts: Readonly<Record<string, unknown>>): Bench {
  const root = temp("bench");
  const workdir = join(root, "work");
  const scriptDir = join(root, "stub-scripts");
  const stateDir = join(root, "stub-state");
  const fixtureDir = join(root, "fixture");
  for (const dir of [workdir, scriptDir, stateDir, fixtureDir]) mkdirSync(dir);
  for (const [name, script] of Object.entries(scripts)) {
    writeFileSync(join(scriptDir, name), `${JSON.stringify(script, null, 1)}\n`, "utf8");
  }
  const transcript = join(root, "transcript.jsonl");
  return {
    root,
    workdir,
    transcript,
    env: {
      PATH: `${BIN}:/usr/bin:/bin`,
      HOME: root,
      TZ: "UTC",
      LANG: "C.UTF-8",
      NO_COLOR: "1",
      [HARNESS_ENVIRONMENT.scriptDir]: scriptDir,
      [HARNESS_ENVIRONMENT.stateDir]: stateDir,
      [HARNESS_ENVIRONMENT.fixtureDir]: fixtureDir,
      [HARNESS_ENVIRONMENT.transcript]: transcript,
    },
  };
}

/** One real call of a stub executable, as the baseline would make it. */
function call(
  b: Bench,
  executable: string,
  argv: readonly string[],
  input = "",
): { readonly status: number | null; readonly stdout: string; readonly stderr: string } {
  const result = spawnSync(executable, [...argv], {
    cwd: b.workdir,
    encoding: "utf8",
    env: b.env,
    input,
    shell: false,
  });
  return { status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

function lastRecord(b: Bench): TranscriptRecord {
  const records = readTranscript(b.transcript);
  assert.ok(records.length > 0, "the call left a record in the transcript");
  return records[records.length - 1] as TranscriptRecord;
}

/** A one-step proposer script that writes a file, so a call is observable. */
const A_PASS = {
  steps: [{ verbs: ["write"], args: { path: "written.txt", content: "a pass of the stub\n" } }],
} as const;

// ---------------------------------------------------------------------------
// The six harnesses of §O.3, and their executables
// ---------------------------------------------------------------------------

test("CT-141-110: the oracle offers the harness stubs of §O.3 and no other", () => {
  const harnesses = harnessStubEntries().map((entry) => entry.harness);
  assert.deepEqual([...harnesses].sort(), ["claude", "codex", "dsh", "generic", "pi", "prime"]);
  // Every executable the data names is in `stubs/bin/` and is executable.
  for (const name of harnessStubExecutables()) {
    const file = join(BIN, name);
    assert.ok(statSync(file).isFile(), `${name} is an executable of stubs/bin/`);
    assert.equal(
      (statSync(file).mode & 0o111) !== 0,
      true,
      `${name} carries the execute bit, so the search path of a run reaches it`,
    );
    assert.ok(
      readFileSync(file, "utf8").includes(`harnessMain("${name}")`),
      `${name} is one line of its own: the name it was called by`,
    );
  }
  // prime has two executables, the agent and the fleet launcher (T120).
  assert.deepEqual(harnessStubEntry("prime")?.executables, ["prime-agent", "prime"]);
  assert.equal(harnessOfExecutable("prime-agent"), "prime");
  assert.equal(harnessOfExecutable("prime"), "prime");
  // Every convention of the data has a module or is built from the data alone.
  assert.equal(conventions().length, harnessStubEntries().length);
  for (const convention of conventions()) {
    assert.ok(convention.executables.length > 0, `${convention.harness} names an executable`);
    assert.ok(["stdin", "argument"].includes(convention.promptChannel));
  }
});

// ---------------------------------------------------------------------------
// Claude: the prompt on standard input
// ---------------------------------------------------------------------------

test("CT-141-110: the Claude stub takes its prompt on standard input", () => {
  const b = bench({ "proposer.json": A_PASS });
  const outcome = call(b, "claude", ["-p"], "the prompt of the pass\n");
  assert.equal(outcome.status, 0);
  const record = lastRecord(b);
  assert.equal(record.harness, "claude");
  assert.equal(record.role, "proposer");
  assert.equal(record.promptChannel, "stdin");
  assert.equal(record.prompt, "the prompt of the pass\n");
  assert.deepEqual(record.argv, ["-p"]);
  assert.equal(record.given, undefined, "Claude records nothing beyond the call");
  assert.equal(
    readFileSync(join(b.workdir, "written.txt"), "utf8"),
    "a pass of the stub\n",
    "the step of the script ran",
  );
});

// ---------------------------------------------------------------------------
// dsh: a pass, a critic call in chunks, and the three records of §O.3
// ---------------------------------------------------------------------------

test("CT-141-110: the dsh stub takes a pass prompt as one positional argument", () => {
  const b = bench({ "proposer.json": A_PASS });
  const outcome = call(b, "dsh", ["--profile", "headless", "the prompt of the pass"]);
  assert.equal(outcome.status, 0);
  const record = lastRecord(b);
  assert.equal(record.harness, "dsh");
  assert.equal(record.role, "proposer");
  assert.equal(record.promptChannel, "argument");
  assert.equal(
    record.prompt,
    "the prompt of the pass",
    "the value of --profile is no part of the prompt",
  );
});

test("CT-141-110: the dsh stub rejoins the chunked critic task with one ASCII space", () => {
  const b = bench({ "critic-cli.json": { steps: [{ verbs: ["approve"] }] } });
  const patch = join(b.root, "patch.yml");
  writeFileSync(patch, "- id: tool-bash\n  disabled: true\n", "utf8");
  const home = join(b.root, "dsh-home");
  mkdirSync(home);
  writeFileSync(join(home, "settings.yaml"), "agent-default-model:\n  provider: p\n", "utf8");
  const nonce = "0123456789abcdef";
  // `_dsh_task_args` splits the prompt at ASCII spaces and packs the tokens into
  // arguments; DSH headless rejoins them with one space. The chunks below are one
  // prompt split at two places.
  const chunks = [
    "You are the CRITIC of phase 1.",
    "The evidence is below.",
    `Answer and end with the single line \`VERDICT ${nonce}: APPROVED|REJECTED\`.`,
  ];
  const outcome = call(
    { ...b, env: { ...b.env, DSH_HOME: home, DSH_PERMISSION_MODE: "read-only" } },
    "dsh",
    ["--profile", "headless", "--patch", patch, "--", ...chunks],
  );
  assert.equal(outcome.status, 0);
  const record = lastRecord(b);
  assert.equal(record.role, "critic", "the verdict contract in the prompt names the critic");
  assert.equal(record.prompt, chunks.join(" "), "the chunks are rejoined with one ASCII space");
  assert.ok(record.prompt.includes("CRITIC of phase 1. The evidence"), "no boundary lost a space");
  assert.ok(
    outcome.stdout.includes(nonce),
    "the critic answered the nonce it was given, which is in the prompt and not in the script",
  );
  // The three records of the table of §O.3, and the content of each file rather
  // than its temporary path.
  const given = record.given as Record<string, string>;
  assert.equal(given["settings"], "agent-default-model:\n  provider: p\n");
  assert.equal(given["patch"], "- id: tool-bash\n  disabled: true\n");
  assert.equal(given["permissionMode"], "read-only");
  assert.ok(
    !JSON.stringify(record.given).includes(patch) && !JSON.stringify(record.given).includes(home),
    "what is RECORDED is the content of the two files and not their temporary paths",
  );
  assert.ok(
    record.argv.includes(patch),
    "the path stays in the argument list, which is what the baseline built; the temporary name " +
      "is what N-08 normalizes",
  );
});

test("CT-141-110: the installer is the dsh stub called with the installer's arguments", () => {
  // The controller builds this argument list itself and never a shell
  // (`lib/dsh_plugin_requests.py`, `process_request`).
  const argv = [
    INSTALLER_SUBCOMMAND,
    "--profile",
    "headless",
    INSTALLER_VERB,
    "--save-exact",
    "@scope/plugin-one@1.2.3",
    "plugin-two@0.4.5",
  ];
  assert.equal(isInstallerCall(argv), true);
  assert.equal(roleOfInvocation({ executable: "dsh", argv, prompt: "" }), "installer");
  assert.deepEqual(installerCallOf(argv), {
    profile: "headless",
    plugins: ["@scope/plugin-one@1.2.3", "plugin-two@0.4.5"],
    saveExact: true,
  });
  // A pass is no installer call, so the reading cannot swallow one.
  assert.equal(isInstallerCall(["--profile", "headless", "a prompt about a plugin"]), false);

  const b = bench({
    "plugin-installer.json": {
      steps: [{ verbs: ["install"], args: { into: ".dsh/profile.json" } }],
    },
  });
  const outcome = call(b, "dsh", argv);
  assert.equal(outcome.status, 0);
  const record = lastRecord(b);
  assert.equal(record.role, "installer");
  assert.equal(record.prompt, "", "an installer call carries no prompt");
  const installer = (record.given as Record<string, Record<string, unknown>>)["installer"];
  assert.deepEqual(installer, {
    subcommand: INSTALLER_SUBCOMMAND,
    verb: INSTALLER_VERB,
    profile: "headless",
    plugins: ["@scope/plugin-one@1.2.3", "plugin-two@0.4.5"],
    saveExact: true,
  });
  assert.equal(
    readFileSync(join(b.root, ".dsh", "profile.json"), "utf8").includes("installed"),
    true,
    "the installer stub wrote the profile entry of the fixture into the hermetic home",
  );
});

// ---------------------------------------------------------------------------
// Codex: the last positional argument, never the subcommand
// ---------------------------------------------------------------------------

test("CT-141-110: the Codex stub takes the prompt as the last positional argument", () => {
  const b = bench({ "proposer.json": A_PASS });
  const outcome = call(b, "codex", [
    "exec",
    "--dangerously-bypass-approvals-and-sandbox",
    "--model",
    "a-model",
    "the prompt of the pass",
  ]);
  assert.equal(outcome.status, 0);
  const record = lastRecord(b);
  assert.equal(record.harness, "codex");
  assert.equal(record.promptChannel, "argument");
  assert.equal(
    record.prompt,
    "the prompt of the pass",
    "neither the subcommand nor the value of --model is part of the prompt",
  );
  assert.ok(record.argv.includes("--model"), "the model selection stays visible in the argv");
});

// ---------------------------------------------------------------------------
// prime: the agent and the launcher, the prompt on standard input
// ---------------------------------------------------------------------------

test("CT-141-110: the prime stub reads standard input and records mode and variant", () => {
  const agent = bench({ "proposer.json": A_PASS });
  let outcome = call(
    agent,
    "prime-agent",
    ["-p", "--mode", "json", "--no-session", "--cwd", agent.workdir],
    "the prompt of the pass",
  );
  assert.equal(outcome.status, 0);
  let record = lastRecord(agent);
  assert.equal(record.harness, "prime");
  assert.equal(record.promptChannel, "stdin");
  assert.equal(record.prompt, "the prompt of the pass");
  assert.deepEqual(record.given, { mode: "json" }, "the agent form takes no variant");

  const launcher = bench({ "proposer.json": A_PASS });
  outcome = call(
    launcher,
    "prime",
    ["a-variant", "-p", "--mode", "text", "--no-session", "--cwd", launcher.workdir],
    "the prompt through the launcher",
  );
  assert.equal(outcome.status, 0);
  record = lastRecord(launcher);
  assert.equal(record.harness, "prime");
  assert.equal(record.prompt, "the prompt through the launcher");
  assert.deepEqual(
    record.given,
    { mode: "text", variant: "a-variant" },
    "the variant of the launcher form is recorded and is no prompt",
  );
});

// ---------------------------------------------------------------------------
// The generic stub: as the descriptor of the fixture declares
// ---------------------------------------------------------------------------

test("CT-141-110: the generic stub takes its prompt as the call carries it", () => {
  const b = bench({ "proposer.json": A_PASS });
  // On standard input, as a descriptor that says so declares.
  let outcome = call(b, "stub-harness", ["--one-shot"], "the prompt on standard input");
  assert.equal(outcome.status, 0);
  let record = lastRecord(b);
  assert.equal(record.harness, "generic");
  assert.equal(record.promptChannel, "stdin");
  assert.equal(record.prompt, "the prompt on standard input");

  // And as an argument, where the descriptor declares that.
  const second = bench({
    "proposer.json": {
      steps: [{ verbs: ["text"], args: { text: "answered\n" } }],
    },
  });
  outcome = call(
    { ...second, env: { ...second.env, ORACLE_HARNESS_DESCRIPTOR: "prompt=argument" } },
    "stub-harness",
    ["--one-shot", "the prompt as an argument"],
  );
  assert.equal(outcome.status, 0);
  record = lastRecord(second);
  assert.equal(record.promptChannel, "argument");
  assert.equal(record.prompt, "the prompt as an argument");
  assert.deepEqual(record.given, { descriptor: "prompt=argument" });
});

// ---------------------------------------------------------------------------
// pi: the port side only
// ---------------------------------------------------------------------------

test("CT-141-110: the pi stub is used on the port side only", () => {
  const sides = sidesOfHarnessStub("pi");
  assert.match(sides, /^port only/, "the data of the entry says the port side only");
  assert.ok(sides.includes("no fixture family names it"));
  for (const harness of ["claude", "dsh", "codex", "prime", "generic"]) {
    assert.equal(sidesOfHarnessStub(harness), "both", `${harness} serves both sides`);
  }
  // The convention is OFFERED — §O.7 asks the oracle to offer a stub for a
  // behaviour with no reference — and it says why there is no reference.
  const pi = conventionOf("pi");
  assert.equal(pi.promptChannel, "stdin", "print mode with the prompt on standard input");
  assert.match(PI_HAS_NO_REFERENCE, /no as-is behaviour/);
  // No fixture of the oracle names the executable of pi.
  const fixtures = join(PACKAGE, "fixtures");
  const named: string[] = [];
  const walk = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(path);
        continue;
      }
      if (entry.name !== "fixture.json") continue;
      const declaration = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
      const text = JSON.stringify([declaration["stubs"], declaration["command"]]);
      if (/"pi"|\bpi\b/.test(text)) named.push(path);
    }
  };
  walk(fixtures);
  assert.deepEqual(named, [], "no fixture names the pi stub (F141-FR-010, §O.7)");
});

// ---------------------------------------------------------------------------
// A further harness stub is added by data
// ---------------------------------------------------------------------------

test("CT-141-110: a further harness stub is added by data", () => {
  const added: HarnessStubEntry = {
    harness: "added-by-data",
    executables: ["added-harness"],
    roles: { proposer: "proposer", critic: "critic-cli" },
    prompt: "positional argument",
    streamFormat: "a-new-format",
    sides: "both",
  };
  const entries = [...harnessStubEntries(), added];
  // No module of the oracle names it, so the convention comes from the data alone.
  assert.equal(CONVENTION_MODULES["added-by-data"], undefined);
  const convention = conventionOf("added-by-data", entries);
  assert.equal(convention.promptChannel, "argument", "the calling convention is the data's");
  assert.equal(convention.streamFormat, "a-new-format", "the stream format is the data's");
  assert.deepEqual(convention.executables, ["added-harness"]);
  assert.deepEqual(
    convention.prompt({
      executable: "added-harness",
      argv: ["--one-shot", "the prompt of the pass"],
      stdin: "",
      env: {},
    }),
    { prompt: "the prompt of the pass", promptChannel: "argument" },
  );
  // A harness the data does not hold has no convention at all.
  assert.throws(() => conventionOf("never-declared"), /no entry of harnessStubs/);
  // And the same entry read with the data-driven reader gives the same thing, so
  // the fallback is not a special case of the registry.
  assert.equal(conventionFromEntry(added).streamFormat, convention.streamFormat);

  // "with no change to the comparator or the normalizer": no file of either names
  // a harness of the data.
  const harnesses = harnessStubEntries().map((entry) => entry.harness);
  const forbidden = harnesses.filter((name) => name !== "generic" && name !== "pi");
  for (const area of ["src/compare", "src/normalize"]) {
    for (const file of readdirSync(join(PACKAGE, area))) {
      if (!file.endsWith(".ts")) continue;
      const code = readFileSync(join(PACKAGE, area, file), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      for (const name of forbidden) {
        assert.ok(
          !new RegExp(`["'\`]${name}["'\`]`).test(code),
          `${area}/${file} does not name the harness ${name}: a harness is added by data ` +
            `(F141-FR-010)`,
        );
      }
    }
  }
  // The stream formats of the data are the formats the oracle knows; a new one
  // needs no rule of its own.
  assert.deepEqual(
    stubVocabulary()
      .harnessStubs.map((entry) => entry.streamFormat)
      .filter((format) => format !== undefined).length,
    harnessStubEntries().length,
  );
});
