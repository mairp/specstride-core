/**
 * T058 — test CT-131-38 (F131-FR-038).
 *
 * Every task that calls a model — the three probes and the four paid
 * captures — is marked paid, and no other task is. A probe that was made is
 * logged; one that was not is a skip, with its reason. No test and no CI job
 * makes a paid call; no test that is not paid names a paid task as its
 * precondition.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import test from "node:test";

const REPO = fileURLToPath(new URL("../../..", import.meta.url));
const CONTRACT = `${REPO}/specs/131-adapter-codex/contracts/captures.json`;
const TASKS = `${REPO}/specs/131-adapter-codex/tasks.md`;

const DATA = JSON.parse(readFileSync(CONTRACT, "utf8")) as {
  captures: readonly { n: number; paid: boolean; task: string }[];
  probes: readonly { role: string; paid: boolean; task: string; status: string }[];
  rule: string;
};
const PROBES = DATA.probes;
const CAPTURES = DATA.captures;

/** The fixture folder of one probe, and the log a made probe stores. */
const PROBE_FIXTURES: Readonly<Record<string, { task: string; dir: string }>> = Object.freeze({
  proposer: { task: "T060", dir: `${REPO}/packages/adapter-codex/fixtures/probe-proposer` },
  "critic form (a)": {
    task: "T044",
    dir: `${REPO}/packages/adapter-codex/fixtures/probe-critic-readonly`,
  },
  "critic form (b)": {
    task: "T050",
    dir: `${REPO}/packages/adapter-codex/fixtures/probe-critic-direct`,
  },
});

test("CT-131-38: exactly three probes exist and every one of them is paid", () => {
  assert.equal(PROBES.length, 3, "the feature holds exactly three live probes");
  for (const probe of PROBES) {
    assert.equal(probe.paid, true, `the probe of ${probe.role} is marked paid`);
    assert.ok(PROBE_FIXTURES[probe.role], `the probe of ${probe.role} has a fixture folder`);
    assert.equal(PROBE_FIXTURES[probe.role]!.task, probe.task);
  }
});

test("CT-131-38: exactly four captures are paid and they are the ones that call a model", () => {
  assert.deepEqual(
    CAPTURES.filter((capture) => capture.paid).map((capture) => capture.n),
    [1, 2, 4, 5],
  );
  assert.equal(CAPTURES.length, 5, "capture 3 alone is not paid (no model call)");
});

test("CT-131-38: the model-calling tasks are the three probes and the four paid captures, and no others exist", () => {
  const tasksText = readFileSync(TASKS, "utf8");
  // The paid table of tasks.md: every row marked **Paid** names its task.
  const paidRows = [...tasksText.matchAll(/^\| (T\d+) \|.*\*\*Paid\*\*/gm)].map(
    (match) => match[1]!,
  );
  const modelCallingTasks = [
    ...CAPTURES.filter((capture) => capture.paid).map((capture) => capture.task),
    ...PROBES.map((probe) => probe.task),
  ].sort();
  assert.deepEqual(paidRows.slice().sort(), modelCallingTasks);
  assert.equal(paidRows.length, 7, "seven tasks call a model: 4 captures + 3 probes");
  // The rule sentence of the contract states the same bound.
  assert.match(DATA.rule, /no other paid call than the three probes and the captures marked paid/);
});

test("CT-131-38: a probe that was made is logged; one that was not is a skip with its reason", async (t) => {
  for (const probe of PROBES) {
    await t.test(`probe ${probe.role} (task ${probe.task})`, (inner) => {
      const fixture = PROBE_FIXTURES[probe.role]!;
      const logged = existsSync(`${fixture.dir}/log.json`);
      if (!logged) {
        inner.skip(`probe ${probe.role} not made (paid, owner ruling of 2026-09-30)`);
        return;
      }
      const log = JSON.parse(readFileSync(`${fixture.dir}/log.json`, "utf8")) as {
        date?: string;
        harnessVersion?: string;
        command?: string;
      };
      assert.match(log.date ?? "", /\d{4}-\d{2}-\d{2}/, "the probe is logged with a date");
      assert.match(log.harnessVersion ?? "", /^codex-cli \d/, "the probe logs the version");
      assert.ok(log.command, "the probe logs the command that was run");
    });
  }
});

/** Every test file and CI workflow of the repository that could make a call. */
function paidCallSites(): readonly { file: string; text: string }[] {
  const files: { file: string; text: string }[] = [];
  const walk = (dir: string, prefix: string): void => {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir)) {
      const path = `${dir}/${name}`;
      if (statSync(path).isDirectory()) walk(path, `${prefix}${name}/`);
      else if (/\.(test\.ts|test\.tsx|yml|yaml)$/.test(name))
        files.push({ file: `${prefix}${name}`, text: readFileSync(path, "utf8") });
    }
  };
  walk(`${REPO}/packages/adapter-codex/test`, "packages/adapter-codex/test/");
  walk(`${REPO}/tests/parity/131`, "tests/parity/131/");
  walk(`${REPO}/tests/conformance/codex`, "tests/conformance/codex/");
  walk(`${REPO}/.github/workflows`, ".github/workflows/");
  return files;
}

test("CT-131-38: no test or CI job makes a paid call", () => {
  for (const { file, text } of paidCallSites()) {
    // The real harness is never spawned by its own name: every invocation
    // goes through the fake binary (a spawn names it as a path, not as
    // `codex`).
    assert.doesNotMatch(
      text,
      /spawn(?:Sync)?\(\s*["'`]codex["'`]/,
      `${file} spawns the real codex binary`,
    );
    // A paid headless run of the harness appears only inside the out-of-band
    // procedures (fixtures), never in a test or a CI job. (The marker is
    // assembled from pieces so this scan does not carry the literal it
    // forbids.)
    assert.doesNotMatch(text, new RegExp(`codex\\s+exec`), `${file} runs a paid exec`);
    // No test or CI job fetches anything but the loopback: the only network
    // step of the whole suite is the refused loopback reach.
    for (const match of text.matchAll(/fetch\(\s*["'`]https?:\/\/([^/"'`\s]+)/g)) {
      assert.match(
        match[1]!,
        /^(127\.0\.0\.1|localhost|\[::1\]|::1)(:\d+)?$/,
        `${file} fetches ${match[1]} — an off-loopback call from a test or CI`,
      );
    }
    // No CI job handles the provider key at all.
    if (file.startsWith(".github/workflows/")) {
      assert.doesNotMatch(text, /OPENAI_API_KEY/, `${file} handles the provider key`);
    }
  }
});

test("CT-131-38: no unpaid test names a paid task as its precondition", () => {
  const PAID_TASK_IDS = ["T001", "T002", "T004", "T005", "T044", "T050", "T060"];
  for (const { file, text } of paidCallSites().filter((site) => /\.test\.ts$/.test(site.file))) {
    for (const id of PAID_TASK_IDS) {
      if (!text.includes(id)) continue;
      // A test that names a paid task handles its absence as a skip or an
      // `unverified` mark — it never waits for the task's output to pass.
      assert.match(
        text,
        /not made|unverified|skip|Skip/,
        `${file} names the paid task ${id} but never says how it is handled without it`,
      );
    }
  }
});
