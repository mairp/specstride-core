/**
 * T006 of feature 118 — the fake process list of the pass-supervision tests
 * (`packages/testkit`, sample tree). No real process is started, listed or
 * signalled by a test that uses this fake: the tests of `tests/parity/118` and `tests/characterization/118` build
 * the tree by hand and ask the fake what the watchdogs would see.
 */
import type { PassProcess, ProcessList } from "../../../../core/src/pass-supervision/index.ts";

/** A mutable process of the fake tree. */
export type FakeProcess = {
  readonly pid: number;
  groupId: number;
  sessionId: number;
  startedAtMs: number;
  commandLine: string;
  cpuTimeMs: number;
  /** False once the test ends the process; the fake then stops listing it. */
  alive: boolean;
};

/**
 * A process list the test fills by hand. `tree(rootPid)` returns the root and
 * every live process whose `parentPid` chain reaches the root — a dead
 * intermediate makes its subtree invisible, as the kernel walk would report
 * it once the parent is reaped.
 */
export class FakeProcessList implements ProcessList {
  private readonly byPid = new Map<number, FakeProcess & { parentPid: number }>();

  /** Add one process to the fake tree and return the mutable record. */
  add(process: {
    pid: number;
    parentPid: number;
    groupId: number;
    sessionId: number;
    startedAtMs: number;
    commandLine: string;
    cpuTimeMs?: number | undefined;
  }): FakeProcess {
    const record: FakeProcess & { parentPid: number } = {
      pid: process.pid,
      parentPid: process.parentPid,
      groupId: process.groupId,
      sessionId: process.sessionId,
      startedAtMs: process.startedAtMs,
      commandLine: process.commandLine,
      cpuTimeMs: process.cpuTimeMs ?? 0,
      alive: true,
    };
    this.byPid.set(record.pid, record);
    return record;
  }

  /** Mark a process dead: it leaves every tree and every CPU sum. */
  end(pid: number): void {
    const record = this.byPid.get(pid);
    if (record !== undefined) record.alive = false;
  }

  /** Add CPU time to one live process (the idle watchdog reads the sum). */
  burnCpu(pid: number, ms: number): void {
    const record = this.byPid.get(pid);
    if (record !== undefined && record.alive) record.cpuTimeMs += ms;
  }

  tree(rootPid: number): readonly PassProcess[] {
    const live = [...this.byPid.values()].filter((p) => p.alive);
    const inTree: PassProcess[] = [];
    const collect = (pid: number, visited: Set<number>): void => {
      if (visited.has(pid)) return;
      visited.add(pid);
      for (const process of live) {
        if (process.parentPid !== pid || visited.has(process.pid)) continue;
        inTree.push({
          pid: process.pid,
          groupId: process.groupId,
          sessionId: process.sessionId,
          startedAtMs: process.startedAtMs,
          commandLine: process.commandLine,
          cpuTimeMs: process.cpuTimeMs,
        });
        collect(process.pid, visited);
      }
    };
    const root = live.find((p) => p.pid === rootPid);
    if (root !== undefined) {
      inTree.push({
        pid: root.pid,
        groupId: root.groupId,
        sessionId: root.sessionId,
        startedAtMs: root.startedAtMs,
        commandLine: root.commandLine,
        cpuTimeMs: root.cpuTimeMs,
      });
      collect(root.pid, new Set<number>());
    }
    return inTree;
  }

  /** The sum of the CPU time of the tree of `rootPid` (F118-FR-003). */
  cpuTimeOfTree(rootPid: number): number {
    return this.tree(rootPid).reduce((sum, p) => sum + p.cpuTimeMs, 0);
  }
}
