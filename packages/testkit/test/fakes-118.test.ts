/**
 * T006 of feature 118 — the fake clock and the fake process list work as the
 * fakes the tests of `tests/parity/118` and `tests/characterization/118` need: a clock that advances by hand, a
 * process tree that reports pid, group, session, start time, command line and
 * CPU time, with no real process anywhere.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { FakeClock, FakeProcessList } from "../src/samples/118/index.ts";

test("FakeClock starts, advances and is read through the Clock port", () => {
  const clock = new FakeClock(1_000_000);
  assert.equal(clock.nowMs(), 1_000_000);
  clock.advance(15_000);
  assert.equal(clock.nowMs(), 1_015_000);
  clock.set(2_000_000);
  assert.equal(clock.nowMs(), 2_000_000);
});

test("FakeClock defaults to 0", () => {
  assert.equal(new FakeClock().nowMs(), 0);
});

test("FakeProcessList reports the tree with pid, group, session, start, command line and CPU time", () => {
  const list = new FakeProcessList();
  list.add({
    pid: 100,
    parentPid: 0,
    groupId: 100,
    sessionId: 7,
    startedAtMs: 1_000,
    commandLine: "node proposer.js --phase 2",
    cpuTimeMs: 500,
  });
  list.add({
    pid: 101,
    parentPid: 100,
    groupId: 100,
    sessionId: 7,
    startedAtMs: 1_100,
    commandLine: "git status",
    cpuTimeMs: 40,
  });

  const tree = list.tree(100);
  assert.equal(tree.length, 2);
  const job = tree.find((p) => p.pid === 101);
  assert.ok(job);
  assert.equal(job.groupId, 100);
  assert.equal(job.sessionId, 7);
  assert.equal(job.startedAtMs, 1_100);
  assert.equal(job.commandLine, "git status");
  assert.equal(job.cpuTimeMs, 40);
});

test("FakeProcessList sums CPU time and drops dead processes from the tree", () => {
  const list = new FakeProcessList();
  const pass = list.add({
    pid: 200,
    parentPid: 0,
    groupId: 200,
    sessionId: 9,
    startedAtMs: 0,
    commandLine: "proposer",
  });
  list.add({
    pid: 201,
    parentPid: 200,
    groupId: 200,
    sessionId: 9,
    startedAtMs: 0,
    commandLine: "long-job",
  });
  assert.equal(list.cpuTimeOfTree(200), 0);

  list.burnCpu(200, 1_000);
  list.burnCpu(201, 100);
  assert.equal(list.cpuTimeOfTree(200), 1_100);

  // CPU burned on a dead process is not summed (F118-FR-003: the tree sum).
  list.end(201);
  list.burnCpu(201, 999);
  assert.equal(list.cpuTimeOfTree(200), 1_000);
  assert.equal(
    list.tree(200).some((p) => p.pid === 201),
    false,
  );

  // The root gone: an empty tree — the pass has ended.
  list.end(pass.pid);
  assert.deepEqual(list.tree(pass.pid), []);
});

test("FakeProcessList ignores a cycle and a foreign root", () => {
  const list = new FakeProcessList();
  list.add({
    pid: 300,
    parentPid: 301,
    groupId: 300,
    sessionId: 1,
    startedAtMs: 0,
    commandLine: "a",
  });
  list.add({
    pid: 301,
    parentPid: 300,
    groupId: 300,
    sessionId: 1,
    startedAtMs: 0,
    commandLine: "b",
  });
  list.add({
    pid: 302,
    parentPid: 0,
    groupId: 302,
    sessionId: 2,
    startedAtMs: 0,
    commandLine: "other",
  });
  // A cycle terminates; a foreign root is not reported.
  assert.equal(list.tree(300).length, 2);
  assert.equal(list.tree(302).length, 1);
  assert.equal(list.tree(999).length, 0);
});
