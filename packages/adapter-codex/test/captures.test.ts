/**
 * T057 — test CT-131-37 (F131-FR-037, F131-SC-008).
 *
 * Every capture of `specs/131-adapter-codex/contracts/captures.json` is
 * marked paid or not paid. A capture that WAS made has a logged record and a
 * fixture that carries the harness version. A capture that was NOT made is a
 * skip, with the reason "capture <n> not made" — never a pass — and the
 * status of every requirement that waits for it stays `unverified` in
 * `spec.md` (F131-FR-037).
 */
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import test from "node:test";

const REPO = fileURLToPath(new URL("../../..", import.meta.url));
const CONTRACT = `${REPO}/specs/131-adapter-codex/contracts/captures.json`;
const SPEC = `${REPO}/specs/131-adapter-codex/spec.md`;

type Capture = {
  n: number;
  paid: boolean;
  task: string;
  what: string;
  waits: readonly string[];
  status: string;
  made: boolean;
  record?: string;
};

const CONTRACT_DATA = JSON.parse(readFileSync(CONTRACT, "utf8")) as {
  captures: Capture[];
  probes: readonly { role: string; paid: boolean; task: string; status: string }[];
};
const CAPTURES = CONTRACT_DATA.captures;
const SPEC_TEXT = readFileSync(SPEC, "utf8");

/** The `status:` token a requirement of spec.md carries, or null where none. */
function requirementStatus(id: string): string | null {
  const start = SPEC_TEXT.indexOf(`- **${id}**:`);
  assert.ok(start >= 0, `${id} is in spec.md`);
  const rest = SPEC_TEXT.slice(start);
  const next = rest.indexOf("\n- **F131-", 1);
  const block = next === -1 ? rest : rest.slice(0, next);
  const line = block.split("\n").find((entry) => entry.trim().startsWith("- status:"));
  if (!line) return null;
  return line.trim().slice("- status:".length).trim().split(/\s+/)[0];
}

test("CT-131-37: every capture of captures.json is marked paid or not paid", () => {
  assert.equal(CAPTURES.length, 5, "the feature holds five captures, 1 to 5");
  assert.deepEqual(
    CAPTURES.map((capture) => capture.n),
    [1, 2, 3, 4, 5],
  );
  for (const capture of CAPTURES) {
    assert.equal(typeof capture.paid, "boolean", `capture ${capture.n} carries a paid mark`);
    assert.ok(capture.task, `capture ${capture.n} names its task`);
    assert.ok(capture.what, `capture ${capture.n} says what it records`);
    assert.ok(capture.waits.length >= 1, `capture ${capture.n} names what waits for it`);
  }
  // The paid marks follow the research decision: 1, 2, 4 and 5 are paid
  // (a run of `exec` calls a model); capture 3 is not (the harness's own
  // sandbox command on planted files — no model call).
  assert.deepEqual(
    CAPTURES.filter((capture) => capture.paid).map((capture) => capture.n),
    [1, 2, 4, 5],
  );
  assert.equal(CAPTURES.find((capture) => capture.n === 3)!.paid, false);
});

test("CT-131-37: a capture that was made has a logged record and a fixture with the version", () => {
  for (const capture of CAPTURES.filter((entry) => entry.made)) {
    // The logged record: the contract carries it, with a date.
    assert.match(
      capture.record ?? "",
      /\d{4}-\d{2}-\d{2}/,
      `capture ${capture.n} is logged with a date`,
    );
    // The fixture: its folder exists and carries the harness version.
    const dir = `${REPO}/packages/adapter-codex/fixtures/capture-${capture.n}`;
    assert.ok(existsSync(dir), `capture ${capture.n} has a fixture folder`);
    const meta = JSON.parse(readFileSync(`${dir}/capture.json`, "utf8")) as {
      harnessVersion?: string;
      made?: boolean;
      status?: string;
    };
    assert.match(
      meta.harnessVersion ?? "",
      /^codex-cli \d/,
      `capture ${capture.n} stores the harness version`,
    );
    assert.equal(fixtureSaysMade(meta), true, `capture ${capture.n} is marked made`);
    assert.equal(meta.status, "verified");
  }
});

/** What the fixture's capture.json says about whether the capture was made. */
function fixtureSaysMade(meta: { made?: boolean; result?: string }): boolean {
  return meta.made === true || meta.result === "made";
}

test("CT-131-37: a capture that was not made is a skip with its reason, never a pass", async (t) => {
  const notMade = CAPTURES.filter((entry) => !entry.made);
  assert.ok(notMade.length >= 1, "the owner ruling leaves the paid captures unmade");
  for (const capture of notMade) {
    await t.test(`capture ${capture.n} (task ${capture.task}, paid: ${capture.paid})`, (inner) => {
      // The skip with the reason "capture <n> not made" — a skipped case is
      // never counted as a pass (F131-FR-037). The assertions below hold only
      // where the capture WAS made.
      if (!capture.made) return inner.skip(`capture ${capture.n} not made`);
      assert.equal(capture.made, true, "unreachable while the capture is not made");
    });
  }
});

test("CT-131-37: a capture that was not made leaves its requirements `unverified` in spec.md", () => {
  for (const capture of CAPTURES.filter((entry) => !entry.made)) {
    assert.equal(capture.status, "unverified", `capture ${capture.n} stays unverified`);
    for (const id of capture.waits) {
      assert.equal(
        requirementStatus(id),
        "unverified",
        `${id} waits for capture ${capture.n} and stays unverified while it is not made`,
      );
    }
  }
});

test("CT-131-37: the fixture of a capture that was not made holds the procedure, not a result", () => {
  for (const capture of CAPTURES.filter((entry) => !entry.made)) {
    const dir = `${REPO}/packages/adapter-codex/fixtures/capture-${capture.n}`;
    const meta = JSON.parse(readFileSync(`${dir}/capture.json`, "utf8")) as {
      made?: boolean;
      result?: string;
      status?: string;
      fixtureFiles?: readonly string[];
    };
    assert.equal(fixtureSaysMade(meta), false, `capture ${capture.n} says it was not made`);
    assert.equal(meta.status, "unverified");
    assert.match(meta.result ?? "", /not made/);
    assert.ok(
      (meta.fixtureFiles ?? []).length >= 1,
      `capture ${capture.n} carries its scripted procedure for the authorized person`,
    );
  }
});
