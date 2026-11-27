/**
 * F154-FR-030, proof 1 of 3 — the fake-binary proof of `concurrentSessions`
 * (F154-SC-014): N concurrent sessions of the FAKE binary on ONE
 * configuration home leave every file of that home byte-identical.
 *
 * This is the proof a configuration home is never MUTATED by concurrent
 * passes (Principle VIII, T-c): four passes are prepared exactly as the pass
 * loop prepares its own (one preparation, no drift) and started at once
 * through `startPass`, every one of them under the same `DSH_HOME`, with a
 * model reference named so the adapter builds its throwaway overlay home —
 * the path that could be tempted to write the real home. The real home is
 * hashed file by file before the first pass starts and after the last one
 * ends; the two hashes must be equal.
 *
 * Nothing here touches a model: the binary is the fake binary of the
 * conformance suite (XII), the same one every other pin of this adapter
 * plays. Proof 2 is the recorded live check CT-130-46
 * (`test/concurrent-sessions.test.ts`); proof 3 is the pin
 * (`data.ts` `DSH_PIN`, `DSH_VERIFIED_ON`).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dshStartPass, type DshStartPassInput } from "../src/start-pass/index.ts";

const FAKE_DSH = fileURLToPath(
  new URL("../../testkit/conformance/EP-02/fake-dsh.mjs", import.meta.url),
);

/** How many sessions run at once (F154-SC-014: N = 4). */
export const FAKE_BINARY_SESSIONS = 4 as const;

/** Every file of a tree, sorted, with the hash of its bytes; a symlink names itself. */
function hashTree(root: string, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const entry of readdirSync(root, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    const at = join(root, entry.name);
    const path = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isSymbolicLink()) {
      out.set(path, `symlink -> ${readFileSync(at, { encoding: "utf8" })}`);
    } else if (entry.isDirectory()) {
      for (const [p, h] of hashTree(at, path)) out.set(p, h);
    } else {
      out.set(path, createHash("sha256").update(readFileSync(at)).digest("hex"));
    }
  }
  return out;
}

/**
 * The fixture: ONE configuration home with files of its own (a settings
 * file, a skill, a session store), the fake binary on its own search path,
 * one worker tree and one output directory per session.
 */
function stage() {
  const root = mkdtempSync(join(tmpdir(), "dsh-concurrent-fake."));
  const home = join(root, "home");
  const binDir = join(root, "bin");
  const record = join(root, "record");
  mkdirSync(join(home, "sessions"), { recursive: true });
  mkdirSync(join(home, "skills", "review"), { recursive: true });
  mkdirSync(binDir, { recursive: true });
  mkdirSync(record);
  writeFileSync(
    join(home, "settings.yaml"),
    "# the one configuration home of the proof\nprofile: headless\ntelemetry: off\n",
  );
  writeFileSync(join(home, "skills", "review", "SKILL.md"), "the review skill\n");
  writeFileSync(join(home, "sessions", "kept.json"), '{"id":"kept"}\n');
  writeFileSync(join(binDir, "dsh"), `#!/bin/sh\nexec "${process.execPath}" "${FAKE_DSH}" "$@"\n`);
  chmodSync(join(binDir, "dsh"), 0o755);
  const trees: string[] = [];
  const outs: string[] = [];
  for (let i = 1; i <= FAKE_BINARY_SESSIONS; i += 1) {
    const tree = join(root, `tree-${i}`);
    mkdirSync(tree);
    trees.push(tree);
    const out = join(root, `out-${i}`);
    mkdirSync(out);
    outs.push(out);
  }
  return {
    root,
    home,
    record,
    trees,
    outs,
    env: { PATH: binDir, HOME: root, DSH_HOME: home, FAKE_DSH_RECORD_DIR: record },
    /** The configuration source: the home, and a model reference for the overlay. */
    config: {
      get: (key: string) => (key === "roles.proposer.model" ? "zai/glm-5.3-flash" : undefined),
    },
    dispose: () => rmSync(root, { recursive: true, force: true }),
  };
}

/** One startPass input for session i over the staged fixture. */
function inputOf(
  fixture: ReturnType<typeof stage>,
  i: number,
  over: Partial<DshStartPassInput> = {},
) {
  return {
    promptReference: `do the task of worker ${i}`,
    workingDirectory: fixture.trees[i - 1] as string,
    session: { kind: "fresh" as const, sessionId: `worker-${i}` },
    model: "",
    modelTierOrEffort: "base",
    containment: "C1" as const,
    writeRoot: fixture.trees[i - 1] as string,
    timeLimitMs: 0,
    transport: "subprocess" as const,
    path: undefined,
    env: fixture.env,
    config: fixture.config,
    outputDirectory: fixture.outs[i - 1] as string,
    ...over,
  } as DshStartPassInput;
}

test("F154-FR-030 proof 1: four concurrent sessions leave the configuration home byte-identical (F154-SC-014)", async () => {
  const fixture = stage();
  try {
    const before = hashTree(fixture.home);

    // All four are STARTED before any is awaited: the sessions overlap on
    // the one home, each in a process group of its own.
    const started = await Promise.all(
      fixture.trees.map((_, i) =>
        dshStartPass(
          inputOf(fixture, i + 1, {
            script: JSON.stringify([{ text: `worker ${i + 1} done\n` }]),
          }),
        ),
      ),
    );
    for (const [i, result] of started.entries()) {
      assert.ok(result.ok, `session ${i + 1} did not start: ${JSON.stringify(result)}`);
    }
    if (started.some((r) => !r.ok)) return;
    const handles = started.flatMap((r) => (r.ok ? [r.handle] : []));
    assert.equal(handles.length, FAKE_BINARY_SESSIONS, "four handles");
    assert.equal(new Set(handles.map((h) => h.pid)).size, FAKE_BINARY_SESSIONS, "four processes");

    const ends = await Promise.all(handles.map((h) => h.ended));
    for (const [i, end] of ends.entries()) {
      assert.deepEqual(
        { exitCode: end.exitCode, signal: end.signal },
        { exitCode: 0, signal: null },
        `session ${i + 1} did not end cleanly`,
      );
    }
    for (const [i, h] of handles.entries()) {
      assert.equal(await h.reply(), `worker ${i + 1} done\n`, `the reply of session ${i + 1}`);
    }

    const after = hashTree(fixture.home);
    const beforeKeys = [...before.keys()];
    const afterKeys = [...after.keys()];
    assert.deepEqual(afterKeys, beforeKeys, "the same set of files before and after");
    const differing = beforeKeys.filter((p) => before.get(p) !== after.get(p));
    assert.deepEqual(differing, [], "every file of the home byte-identical");
  } finally {
    fixture.dispose();
  }
});

test("F154-FR-030 proof 1: the overlay of a named model is a throwaway home, not the configuration home", async () => {
  const fixture = stage();
  try {
    const started = await dshStartPass(
      inputOf(fixture, 1, { script: JSON.stringify([{ text: "ok\n" }]) }),
    );
    assert.ok(started.ok, JSON.stringify(started));
    if (!started.ok) return;
    const handle = started.handle;
    try {
      // The model reference builds an overlay; the overlay is its own home
      // under a temporary directory, never the home the env named.
      assert.notEqual(handle.overlay, null);
      assert.notEqual(handle.overlay, fixture.home);
      assert.ok(handle.overlay !== null && statSync(handle.overlay).isDirectory());
      await handle.ended;
    } finally {
      rmSync(handle.overlay ?? "", { recursive: true, force: true });
    }
  } finally {
    fixture.dispose();
  }
});
