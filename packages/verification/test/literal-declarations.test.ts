/**
 * The literal source of the plan (F105-FR-015) — the declarations a task
 * line carries.
 *
 * A span of one token in back-ticks is an identifier of the prose (a
 * function, an event, a file), never a command line: reading it as a
 * command made one task's own prose disagree with itself, and the plan of
 * the run refused at launch (F153-FR-010) on the feature's own task list.
 * The regression holds that shape; the real forms — a back-ticked command
 * line, a `Command:` line, a fenced block — still declare.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readLiteralSource } from "../src/sources/literal.ts";

function modelOf(
  tasks: readonly { id: string; text: string; line: number }[],
): Parameters<typeof readLiteralSource>[0]["model"] {
  return {
    format: "speckit-tasks",
    feature: "sample",
    phases: [{ number: 1, section: "## Phase 1: Setup", tasks }],
    sources: [{ kind: "tasks", path: "specs/sample/tasks.md", contentHash: "" }],
  } as unknown as Parameters<typeof readLiteralSource>[0]["model"];
}

test("one token in back-ticks is an identifier of the prose, never a command", () => {
  const source = readLiteralSource({
    model: modelOf([
      {
        id: "T397",
        line: 1202,
        text:
          "In run-feature.ts, emit the pair around the scan of `scanBeforeTheCommit` " +
          "(step `commit`), only when the switch is on. Then T395 and T396 pass",
      },
    ]),
    repositoryRoot: "/repo",
  });
  assert.equal(source.blockers.length, 0);
  assert.equal(source.commands.length, 0);
});

test("two identifier spans of one task disagree with nothing", () => {
  const source = readLiteralSource({
    model: modelOf([
      {
        id: "T396",
        line: 1199,
        text:
          "the failing case: each run of the scan has `commit_gate.started` and " +
          "`commit_gate.ended` with its step, duration, outcome and number of hits",
      },
    ]),
    repositoryRoot: "/repo",
  });
  assert.equal(source.blockers.length, 0);
  assert.equal(source.commands.length, 0);
});

test("a back-ticked COMMAND line of one task declares exactly that command", () => {
  const source = readLiteralSource({
    model: modelOf([
      {
        id: "T001",
        line: 10,
        text: "run the suite with `npm test` and keep the counter green",
      },
    ]),
    repositoryRoot: "/repo",
  });
  assert.equal(source.blockers.length, 0);
  assert.equal(source.commands.length, 1);
  assert.equal(source.commands[0]?.declaredId, "T001");
  assert.deepEqual([...(source.commands[0]?.args ?? [])], ["test"]);
});

test("an identifier span beside a real command keeps only the command", () => {
  const source = readLiteralSource({
    model: modelOf([
      {
        id: "T002",
        line: 12,
        text: "count the lines of `counter-a.txt` after `node ../bin/count-and-pass.ts counter-a.txt`",
      },
    ]),
    repositoryRoot: "/repo",
  });
  assert.equal(source.blockers.length, 0);
  assert.equal(source.commands.length, 1);
  assert.equal(source.commands[0]?.executable, "node");
});

test("a task whose prose carries two command lines declares neither (never a guess)", () => {
  const source = readLiteralSource({
    model: modelOf([
      {
        id: "T004",
        line: 16,
        text: "either `npm test -- one` or `npm test -- two`",
      },
    ]),
    repositoryRoot: "/repo",
  });
  assert.equal(source.blockers.length, 0);
  assert.equal(source.commands.length, 0);
  assert.equal(source.ambiguities.length, 1);
});

test("a task line that declares a constant of code is prose, not a command", () => {
  const source = readLiteralSource({
    model: modelOf([
      {
        id: "T393",
        line: 1192,
        text:
          'add the constants `COMMIT_GATE_STARTED_EVENT_TYPE = "commit_gate.started"` ' +
          'and `COMMIT_GATE_ENDED_EVENT_TYPE = "commit_gate.ended"` beside the blocked one',
      },
    ]),
    repositoryRoot: "/repo",
  });
  assert.equal(source.blockers.length, 0);
  assert.equal(source.commands.length, 0);
});

test("a known-tool span no fixed argument list can hold blocks, never guesses (F105-FR-015)", () => {
  const source = readLiteralSource({
    model: modelOf([
      {
        id: "T006",
        line: 20,
        text: "check it: `cat counter-a.txt | grep one`",
      },
    ]),
    repositoryRoot: "/repo",
  });
  assert.equal(source.commands.length, 0);
  assert.equal(source.blockers.length, 1);
  assert.ok(source.blockers[0]?.message.includes("cannot be written as a fixed argument list"));
});

test("a template of commands is never a declaration (F105-FR-015)", () => {
  const source = readLiteralSource({
    model: modelOf([
      {
        id: "T280",
        line: 22,
        text: "run the helper for each workspace: `node ../../bin/count-and-pass.ts counter-<x>.txt`",
      },
    ]),
    repositoryRoot: "/repo",
  });
  assert.equal(source.commands.length, 0);
  assert.equal(source.blockers.length, 0);
  assert.equal(source.ambiguities.length, 0);
});

test("a Command: line and a fenced block keep their rule", () => {
  const source = readLiteralSource({
    model: modelOf([
      {
        id: "T003",
        line: 14,
        text: "Command: npm run build\n\n```bash\nnpm test -- --name lint\n```",
      },
    ]),
    repositoryRoot: "/repo",
  });
  assert.equal(source.blockers.length, 0);
  assert.equal(source.commands.length, 2);
});

test("a fenced block that parses stays a command beside prose identifiers", () => {
  const source = readLiteralSource({
    model: modelOf([
      {
        id: "T005",
        line: 18,
        text: "verify the counter (`counter-a.txt`):\n\n```bash\nnpm test -- --name one\n```",
      },
    ]),
    repositoryRoot: "/repo",
  });
  assert.equal(source.blockers.length, 0);
  assert.equal(source.commands.length, 1);
  assert.equal(source.commands[0]?.executable, "npm");
});
