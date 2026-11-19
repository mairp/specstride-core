/**
 * The verification plan of the run AT LAUNCH (feature 153, phase 16,
 * F153-FR-010): the launch derives and persists the plan with the code of
 * feature 105 — `derivePlan`, `persistPlan`, `deriveEveryManifest` — and the
 * commands of the check manifests come from the plan, pinned at launch by the
 * ONE check runner. A blocker of the plan sources, a derivation the mode
 * `required` refuses, and a command the runner refuses at `pin` all REFUSE
 * the launch before any attempt runs.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import test from "node:test";

import { loadPlan } from "@specstride/verification";

import { runFeature } from "../../src/engine/run-feature.ts";

/** The stub of `claude`, exactly the micro-wiring one: pass 1 keeps a unit, the next pass writes evidence. */
const STUB = (passScript: string): string => `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path");
const argv = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
const session = argv[argv.indexOf("--session-id") + 1];
const critic = argv.includes("--max-turns");
console.log(JSON.stringify({ type: "system", subtype: "init", tools: critic ? [] : ["Read"], session_id: session }));
if (critic) {
  fs.writeFileSync("seen-by-critic.txt", prompt);
  const nonce = /VERDICT ([0-9a-f]+): APPROVED/.exec(prompt)[1];
  console.log(JSON.stringify({ type: "result", result: "T001 judged.\\nVERDICT " + nonce + ": APPROVED" }));
} else {
  fs.appendFileSync("prompt-log.txt", prompt + "\\n---PASS---\\n");
  const passes = Number(fs.existsSync("pass-count.txt") ? fs.readFileSync("pass-count.txt", "utf8") : "0") + 1;
  fs.writeFileSync("pass-count.txt", String(passes));
  ${passScript}
}
`;

const CHECKPOINT = (unitId: string, taskId: string): string =>
  `const outbox = ".specstride/features/001-speed/outbox";` +
  `  fs.mkdirSync(outbox, { recursive: true });` +
  `  fs.writeFileSync(path.join(outbox, "${unitId}.checkpoint.json"),` +
  `    JSON.stringify({ schema: "specstride.checkpoint/1", tasks: ["${taskId}"] }));`;

const WRITE_EVIDENCE = `const evidence = /write (\\.specstride\\S+?):/.exec(prompt)[1];
  fs.mkdirSync(path.dirname(evidence), { recursive: true });
  fs.writeFileSync(evidence, "T001 done\\n");
  const tasks = "specs/001-speed/tasks.md";
  fs.writeFileSync(tasks, fs.readFileSync(tasks, "utf8").replace(/\\[ \\]/g, "[x]"));
  console.log(JSON.stringify({ type: "result", result: "ok" }));`;

const PASS_ONE = `if (passes === 1) {
    ${CHECKPOINT("u1", "T001")}
    fs.writeFileSync("made-1.txt", "one\\n");
    console.log(JSON.stringify({ type: "result", result: "unit one" }));
  } else {
    ${WRITE_EVIDENCE}
  }`;

/** The tasks list of the fixture: two phases, one task each, no literal commands unless said. */
const TASKS = (phaseOneTask: string, phaseTwoTask: string): string =>
  [
    "# Tasks",
    "",
    "## Phase 1: One",
    "",
    `- [ ] T001 ${phaseOneTask}`,
    "",
    "## Phase 2: Two",
    "",
    `- [ ] T002 ${phaseTwoTask}`,
    "",
  ].join("\n");

/** The command the fixture declares and the inner check runs: it counts and passes. */
const COUNTER = `import { writeFileSync } from "node:fs";
const [file] = process.argv.slice(2);
writeFileSync(file, "counted\\\\n");
`;

type FixtureOptions = {
  /** The text of the T001 task line, where a literal declaration is wanted. */
  readonly phaseOneTask?: string;
  readonly phaseTwoTask?: string;
  /** The declared-commands document, written into the CONTROL ROOT when given. */
  readonly document?: {
    readonly discovery?: string;
    readonly commands: readonly Record<string, unknown>[];
  };
  /** Whether the workspace holds a package.json at all. */
  readonly packageJson?: boolean;
  readonly testJs?: string;
  /** Build the workspace FROM the fixture folder of T208
   * (`fixtures/loop-speed/declared-commands/`): its spec folder, its
   * `package.json` whose `npm test` exits 1, its counter script, and its
   * declared-commands document, copied into the control plane. */
  readonly fromFixture?: boolean;
};

/** The fixture folder of T208, as the task names it. */
const DECLARED_COMMANDS_FIXTURE = join(
  import.meta.dirname,
  "..",
  "fixtures",
  "loop-speed",
  "declared-commands",
);

function fixture(options: FixtureOptions): {
  readonly dir: string;
  readonly control: string;
  readonly restore: () => void;
} {
  const dir = mkdtempSync(join(tmpdir(), "specstride-loopspeed-"));
  const bin = join(dir, "bin");
  const work = join(dir, "work");
  mkdirSync(bin);
  mkdirSync(join(work, "specs", "001-speed"), { recursive: true });
  writeFileSync(join(bin, "claude"), STUB(PASS_ONE));
  chmodSync(join(bin, "claude"), 0o755);
  if (options.fromFixture === true) {
    // The workspace comes FROM the fixture folder: its spec folder, its
    // package.json whose `npm test` exits 1, and its counter script one
    // directory beside the workspace, where the declared `../bin/` path
    // resolves.
    cpSync(join(DECLARED_COMMANDS_FIXTURE, "specs"), join(work, "specs"), { recursive: true });
    cpSync(join(DECLARED_COMMANDS_FIXTURE, "package.json"), join(work, "package.json"));
    cpSync(
      join(DECLARED_COMMANDS_FIXTURE, "bin", "count-and-pass.ts"),
      join(bin, "count-and-pass.ts"),
    );
    chmodSync(join(bin, "count-and-pass.ts"), 0o755);
  } else {
    writeFileSync(join(bin, "count-and-pass.ts"), COUNTER);
    chmodSync(join(bin, "count-and-pass.ts"), 0o755);
    writeFileSync(
      join(work, "specs", "001-speed", "tasks.md"),
      TASKS(options.phaseOneTask ?? "Do the first thing", options.phaseTwoTask ?? "Do the second thing"),
    );
  }
  if (options.fromFixture !== true && options.packageJson !== false) {
    writeFileSync(
      join(work, "package.json"),
      JSON.stringify({ scripts: { test: "node test.js" } }),
    );
    writeFileSync(join(work, "test.js"), options.testJs ?? "process.exit(0);\n");
  }
  for (const argv of [
    ["init", "-q"],
    ["config", "user.email", "t@t"],
    ["config", "user.name", "t"],
    ["add", "-A"],
    ["commit", "-qm", "init"],
  ]) {
    spawnSync("git", ["-C", work, ...argv]);
  }
  const before = {
    HOME: process.env.HOME,
    PATH: process.env.PATH,
    FEATURE: process.env.SPECSTRIDE_FEATURE,
    LIMITS: process.env.SPECSTRIDE_LIMITS,
  };
  process.env.HOME = dir;
  process.env.PATH = `${bin}:${before.PATH ?? ""}`;
  // The engine of THIS session names ITS feature; the fixture names its own
  // single spec folder, so the variable must not leak into the launch.
  delete process.env.SPECSTRIDE_FEATURE;
  // The same for the limits switch: the launch of the fixture must not
  // inherit `SPECSTRIDE_LIMITS=off` (or any value) from this session —
  // the fixture's assertions hold under every limits setting.
  delete process.env.SPECSTRIDE_LIMITS;
  const control = join(
    dir,
    ".specstride",
    "workspaces",
    createHash("sha256").update(work).digest("hex").slice(0, 16),
  );
  // The launch contract writes the verification-commands document into the
  // control plane BEFORE the run: the engine reads it there (F153-FR-010).
  if (options.fromFixture === true) {
    // The document of the fixture, with its WORKDIR placeholders made real —
    // the declared commands themselves stay exactly as the fixture writes
    // them: `node ../bin/count-and-pass.ts counter-a.txt` and `… -b.txt`.
    const raw = readFileSync(
      join(DECLARED_COMMANDS_FIXTURE, "verification", "verification-commands.json"),
      "utf8",
    );
    mkdirSync(join(control, "features", "001-speed", "verification"), { recursive: true });
    writeFileSync(
      join(control, "features", "001-speed", "verification", "verification-commands.json"),
      raw.split("WORKDIR").join(work),
    );
  } else if (options.document !== undefined) {
    mkdirSync(join(control, "features", "001-speed", "verification"), { recursive: true });
    writeFileSync(
      join(control, "features", "001-speed", "verification", "verification-commands.json"),
      JSON.stringify({
        schema_version: "specstride.verification-commands/1",
        ...(options.document.discovery !== undefined
          ? { discovery: options.document.discovery }
          : {}),
        commands: options.document.commands,
      }),
    );
  }
  return {
    dir: work,
    control,
    restore: () => {
      process.env.HOME = before.HOME;
      process.env.PATH = before.PATH;
      if (before.FEATURE !== undefined) process.env.SPECSTRIDE_FEATURE = before.FEATURE;
      else delete process.env.SPECSTRIDE_FEATURE;
      if (before.LIMITS !== undefined) process.env.SPECSTRIDE_LIMITS = before.LIMITS;
      else delete process.env.SPECSTRIDE_LIMITS;
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

const eventsOf = (control: string): { type: string; data: Record<string, unknown> }[] => {
  const runs = join(control, "runs");
  const all: { type: string; data: Record<string, unknown> }[] = [];
  for (const name of existsSync(runs) ? readdirSync(runs).sort() : []) {
    for (const line of readFileSync(join(runs, name, "events.jsonl"), "utf8").split("\n")) {
      if (line.trim() === "") continue;
      all.push(JSON.parse(line) as { type: string; data: Record<string, unknown> });
    }
  }
  return all;
};

const capture = async (workdir: string): Promise<{ lines: string[]; exit: number }> => {
  const lines: string[] = [];
  const held = process.stdout.write.bind(process.stdout);
  (process.stdout as unknown as { write: (chunk: string) => boolean }).write = (chunk: string) => {
    lines.push(chunk);
    return held(chunk);
  };
  let exit: number;
  try {
    exit = await runFeature({ argv: [], workdir });
  } finally {
    (process.stdout as unknown as { write: (chunk: string) => boolean }).write = held;
  }
  return { lines: lines.join("").split("\n"), exit };
};

/**
 * The place of the plan record, at the logical name
 * `run:<runId>:verification:plan` the layout table resolves:
 * `<control>/features/<slug>/runs/<runId>/verification/`.
 */
const planRecordOf = (control: string): string => {
  const runs = join(control, "features", "001-speed", "runs");
  const names = existsSync(runs) ? readdirSync(runs).sort() : [];
  assert.equal(names.length, 1, "the fixture made exactly one run");
  return join(runs, names[0] ?? "", "verification", "verification-plan.json");
};

/** The absolute `node` the launch resolves, as the plan and the pins carry it. */
const nodeExecutable = (): string => {
  const found = spawnSync("sh", ["-c", "command -v node"], { encoding: "utf8" });
  return (found.stdout ?? "").trim();
};

/** A declared command of the fixture, pointing at the counter script of `bin`. */
const declared = (
  id: string,
  phase: number,
  counter: string,
  workdir: string,
  bin: string,
): Record<string, unknown> => ({
  id,
  phase,
  executable: "node",
  args: [join(bin, "count-and-pass.ts"), counter],
  cwd: workdir,
  timeoutSec: 30,
});

test("CT-153-10 the plan of the run is persisted", async () => {
  const f = fixture({ fromFixture: true });
  try {
    const { exit, lines } = await capture(f.dir);
    // The fixture's `npm test` EXITS 1, and the gate still runs today's
    // declared check (phase 17's work), so the phases are rejected on their
    // gate — while the plan and the manifests of the launch stand.
    assert.equal(exit, 2, `the run ends rejected on the failing check: ${lines.join("\n")}`);
    // THE PLAN AT THE PLACE OF ITS LOGICAL NAME `run:<runId>:verification:plan`.
    const planPath = planRecordOf(f.control);
    assert.ok(existsSync(planPath), `the canonical plan record exists at ${planPath}`);
    assert.ok(
      existsSync(planPath.replace(/\.json$/, ".md")),
      "the plan for people was persisted beside the record",
    );
    // The record loads and validates as a plan of feature 105.
    const plan = loadPlan({ path: planPath, read: (path) => readFileSync(path, "utf8") });
    const gateOne = plan.gates.find((gate) => gate.id === "GATE-phase-1");
    const gateTwo = plan.gates.find((gate) => gate.id === "GATE-phase-2");
    assert.ok(gateOne !== undefined && gateTwo !== undefined, "both phase gates exist");
    assert.equal(gateOne.required, true, "the gate is required where commands exist");
    // Both gates hold the command the fixture declares for their phase.
    const suiteOne = plan.suites.find((suite) => suite.id === gateOne?.suiteRefs[0]);
    const declaredOne = plan.commands.find((one) => one.declaredId === "verify-one");
    const declaredTwo = plan.commands.find((one) => one.declaredId === "verify-two");
    assert.ok(declaredOne !== undefined, "the plan holds the declared command of phase 1");
    assert.ok(declaredTwo !== undefined, "the plan holds the declared command of phase 2");
    assert.ok(suiteOne?.commandRefs.includes(declaredOne.id), "gate 1 holds the declared command");
    // The gate of phase 2 is cumulative: its declared command sits in one of
    // ITS OWN suites, beside the suite it carries over from phase 1.
    assert.ok(
      plan.suites
        .filter((suite) => gateTwo?.suiteRefs.includes(suite.id))
        .some((suite) => suite.commandRefs.includes(declaredTwo.id)),
      "gate 2 holds the declared command of its phase",
    );
    assert.equal(suiteOne?.commandRefs.length, 2, "the discovered test command joins the suite");
    // The launch said what it derived.
    assert.ok(
      lines.some((line) => line.includes("verification plan")),
      `the launch said the plan: ${lines.join("\n")}`,
    );
  } finally {
    f.restore();
  }
});

test("CT-153-10 the manifests come from the plan", async () => {
  const f = fixture({ fromFixture: true });
  try {
    const { exit, lines } = await capture(f.dir);
    // The failing `npm test` rejects the phases on the gate (phase 17's
    // work to change); the manifests of the launch stand all the same.
    assert.equal(exit, 2, `the run ends rejected on the failing check: ${lines.join("\n")}`);
    const manifestOne = JSON.parse(
      readFileSync(join(f.control, "features", "001-speed", "manifests", "phase1.json"), "utf8"),
    ) as { commands: { id: string; argv: string[]; cwd: string; timeoutSec: number }[] };
    assert.equal(manifestOne.commands.length, 2, "the discovered test and the declared command");
    const command = manifestOne.commands.find((one) => one.id === "verify-one");
    assert.ok(command !== undefined, "the manifest holds the declared command of the plan");
    assert.deepEqual(
      command.argv,
      [nodeExecutable(), "../bin/count-and-pass.ts", "counter-a.txt"],
      "the argv is the pinned executable with the declared relative arguments",
    );
    assert.equal(command.cwd, f.dir, "the command runs in the declared working directory");
    assert.equal(command.timeoutSec, 30, "the declared time limit is carried, not a default");
    // The manifest of the OTHER phase holds ITS command, not phase 1's.
    const manifestTwo = JSON.parse(
      readFileSync(join(f.control, "features", "001-speed", "manifests", "phase2.json"), "utf8"),
    ) as { commands: { id: string }[] };
    assert.ok(manifestTwo.commands.some((one) => one.id === "verify-two"));
    assert.ok(!manifestTwo.commands.some((one) => one.id === "verify-one"));
    // The literal `npm test` string is gone: the argv of the declared command
    // is the one the document declares, never the checkCommandOf literal.
    const everyArgv = JSON.stringify(manifestOne.commands) + JSON.stringify(manifestTwo.commands);
    assert.ok(!everyArgv.includes('"npm test"'), "no literal npm test argv in the manifests");
  } finally {
    f.restore();
  }
});

test("discovery gives today's command (CQ-153-11)", async () => {
  const f = fixture({});
  try {
    const { exit } = await capture(f.dir);
    assert.equal(exit, 0);
    const planPath = planRecordOf(f.control);
    const plan = loadPlan({ path: planPath, read: (path) => readFileSync(path, "utf8") });
    const gateOne = plan.gates.find((gate) => gate.id === "GATE-phase-1");
    assert.ok(gateOne !== undefined);
    const suiteOne = plan.suites.find((suite) => suite.id === gateOne?.suiteRefs[0]);
    assert.ok(
      suiteOne !== undefined && suiteOne.commandRefs.length === 1,
      "the gate holds the one discovered test command",
    );
    const manifestOne = JSON.parse(
      readFileSync(join(f.control, "features", "001-speed", "manifests", "phase1.json"), "utf8"),
    ) as { commands: { id: string; argv: string[] }[] };
    assert.equal(manifestOne.commands.length, 1);
    const argv = manifestOne.commands[0]?.argv ?? [];
    assert.equal(argv[argv.length - 2], "run", "the discovered command is npm's");
    assert.equal(argv[argv.length - 1], "test", "the discovered `npm run test` is the manifest command");
  } finally {
    f.restore();
  }
});

test("a declared command that is not a fixed argument list refuses the launch (F105-FR-015)", async () => {
  const f = fixture({
    phaseOneTask: "Check it: `cat counter-a.txt | grep one`",
  });
  try {
    const { exit, lines } = await capture(f.dir);
    assert.equal(exit, 3, `the launch is refused with the exit of a refused run: ${lines.join("\n")}`);
    assert.ok(
      lines.some((line) =>
        line.includes("cannot be written as a fixed argument list and is never guessed"),
      ),
      `the notAFixedArgumentList blocker is said: ${lines.join("\n")}`,
    );
    // No attempt ran: no proposer pass, and no plan record exists.
    assert.ok(!existsSync(join(f.dir, "prompt-log.txt")), "no proposer pass started");
    const featureRuns = join(f.control, "features", "001-speed", "runs");
    const runIds = existsSync(featureRuns) ? readdirSync(featureRuns) : [];
    assert.ok(
      !runIds.some((id) => existsSync(join(featureRuns, id, "verification"))),
      "no plan record was persisted",
    );
  } finally {
    f.restore();
  }
});

test("two declarations that disagree on one id refuse the launch (F105-FR-015)", async () => {
  const f = fixture({
    phaseOneTask: "Run it: `node two.js --once`",
    document: {
      commands: [
        {
          id: "T001",
          phase: 1,
          executable: "node",
          args: ["one.js"],
          cwd: "CWD",
          timeoutSec: 30,
        },
        declared("verify-two", 2, "counter-b.txt", "", "BIN"),
      ],
    },
  });
  const documentPath = join(
    f.control,
    "features",
    "001-speed",
    "verification",
    "verification-commands.json",
  );
  const document = JSON.parse(readFileSync(documentPath, "utf8")) as {
    commands: Record<string, unknown>[];
  };
  for (const command of document.commands) {
    if (command.cwd === "CWD" || command.cwd === "") command.cwd = f.dir;
    const args = command.args as string[] | undefined;
    if (args?.[0] !== undefined && String(args[0]).includes("BIN")) {
      command.args = [join(f.dir, "..", "bin", "count-and-pass.ts"), args[1]];
    }
  }
  writeFileSync(documentPath, JSON.stringify({ ...document }));
  try {
    const { exit, lines } = await capture(f.dir);
    assert.equal(exit, 3, `the launch is refused: ${lines.join("\n")}`);
    assert.ok(
      lines.some((line) => line.includes("two declarations of `T001` disagree")),
      `the declarationsDisagree blocker is said: ${lines.join("\n")}`,
    );
    assert.ok(!existsSync(join(f.dir, "prompt-log.txt")), "no attempt ran");
  } finally {
    f.restore();
  }
});

test("guard: no declared check at all — the gate is off and the manifests hold no command", async () => {
  const f = fixture({ packageJson: false });
  try {
    const { exit, lines } = await capture(f.dir);
    assert.equal(exit, 0, `the run ends as it does today: ${lines.join("\n")}`);
    assert.ok(
      lines.some((line) => line.includes("gate-not-executing")),
      "the launch says the gate is not executing",
    );
    const manifestOne = JSON.parse(
      readFileSync(join(f.control, "features", "001-speed", "manifests", "phase1.json"), "utf8"),
    ) as { commands: unknown[] };
    assert.deepEqual(manifestOne.commands, [], "the manifest carries no command");
    // The plan is still derived and persisted — delivery under every profile.
    const planPath = planRecordOf(f.control);
    const plan = loadPlan({ path: planPath, read: (path) => readFileSync(path, "utf8") });
    assert.ok(plan.gates.length >= 2, "the plan covers both phases");
    assert.equal(plan.gates[0]?.required, false, "the gate is not required without commands");
  } finally {
    f.restore();
  }
});
