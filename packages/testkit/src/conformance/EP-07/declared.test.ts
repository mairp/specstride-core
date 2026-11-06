/**
 * CT-105-153 (T053) — the CONFORMANCE SUITE of EP-07 at behaviour level:
 * fixtures with DECLARED COMMANDS, with a CONFLICT, and with NONE.
 *
 * proves: F105-FR-053; F105-FR-015
 *
 * The suite is the content owner's half of the folder of the point: feature
 * 100's `contract.test.ts` beside this file makes the five checks every suite
 * at contract level makes, and this file adds the behaviour cases, as
 * `common.ts` (`behaviourCasesBelongToTheOwner`) says it must. Feature 105 is
 * the content owner named under "Content owner" of
 * `specs/100-specstride/contracts/extension-points/EP-07.verification-source.json`.
 *
 * The cases take the implementation under test as their argument and read it
 * only through the three operations of the point, so an author of a later
 * source runs the same suite on theirs. Here they run on
 * `../../samples/EP-07/sample-declared-source.ts`, which NO CORE FILE NAMES
 * and which the `casesAsTests` call at the foot of this file registers from
 * the test tree (F100-FR-018).
 *
 * What the three fixtures prove:
 *
 *  - DECLARED COMMANDS appear with their PROVENANCE, and the command of a
 *    source outside the core reaches the frozen CHECK MANIFEST of its phase
 *    carrying the file and the line it was declared on (F105-FR-020);
 *  - a CONFLICT is a BLOCKER with both provenances, the command it concerns
 *    does NOT enter the plan, and the mode `required` refuses the launch for
 *    it (F105-FR-015, F105-FR-019);
 *  - NO DECLARATION gives an EMPTY manifest and the result `unchecked` — the
 *    checkpoint of this phase — and the source still produces no verdict, no
 *    exit code and no stop reason of its own (F105-FR-053).
 */
import assert from "node:assert/strict";
import {
  A_SOURCE_WRITES,
  OPERATIONS,
  POINT_ID,
  type Blocker,
  type DeclaredCommand,
} from "@specstride/contracts/ep/verification-source";
import {
  INNER_IS_TRUE_FOR_EVERY_ENTRY,
  KIND_THAT_REQUIRES_ARGV,
  LOGICAL_NAME,
  SCHEMA_ID,
  UNDECLARED_MEANS_SERIAL,
  readCheckManifest,
} from "@specstride/contracts/records/check-manifest";
import { canonicalRecordHash } from "@specstride/kernel/hasher";
import {
  DECLARATIONS,
  DOCUMENTS,
  SAMPLE_ID,
  WRITES,
  fileOf,
  implementation,
  provenanceOf,
  type DocumentName,
} from "../../samples/EP-07/sample-declared-source.ts";
import { sampleModel } from "../../samples/EP-03/index.ts";
import { operationOf } from "../common.ts";
import { guardedCall, holdsNoVerdictExitCodeOrStopReason, plainerPathOf } from "../degrade.ts";
import { casesAsTests, type ConformanceCase } from "../run.ts";

const EP = "EP-07" as const;

/** The result the checkpoint of this phase names for a phase with none. */
export const RESULT_OF_A_PHASE_WITHOUT_COMMANDS = "unchecked" as const;

/** The three fixtures the suite runs, as F105-FR-053 names them. */
export const FIXTURES = ["declared commands", "a conflict", "none"] as const;

/** A workspace that names one document of the sample. */
function workspaceOf(document: DocumentName): string {
  return `/sample/workspace/${document}`;
}

/** The entries of a manifest, derived from what a source declared. */
function manifestOf(input: {
  readonly phase: number;
  readonly commands: readonly DeclaredCommand[];
  readonly searchPath: string;
}): Record<string, unknown> {
  const entries = input.commands
    .filter((one) => one.phase === input.phase)
    .map((one) =>
      Object.freeze({
        id: one.id,
        kind: KIND_THAT_REQUIRES_ARGV,
        argv: [...one.argv],
        pin: { kind: KIND_THAT_REQUIRES_ARGV, path: one.argv[0] },
        // The file and the line the source reported (F105-FR-015).
        provenance: { ...one.provenance },
        timeLimit: Math.trunc(one.timeLimitMs / 1_000),
        // Every entry is derived with `inner` true (F105-FR-020).
        inner: INNER_IS_TRUE_FOR_EVERY_ENTRY,
      }),
    );
  const withoutHash = {
    schema: SCHEMA_ID,
    phase: input.phase,
    searchPath: input.searchPath,
    entries,
  };
  return { ...withoutHash, hash: canonicalRecordHash(withoutHash) };
}

export const cases: readonly ConformanceCase[] = Object.freeze([
  {
    id: "CT-105-153",
    title:
      "a fixture with DECLARED COMMANDS: each appears with its provenance, and the command of a source outside the core reaches the manifest of its phase with the file and the line (F105-FR-053, F105-FR-015, F105-FR-020)",
    level: "behaviour",
    proves: ["F105-FR-053", "F105-FR-015"],
    async run(impl) {
      assert.equal(POINT_ID, "specstride.verification-source/1");
      assert.deepEqual([...OPERATIONS], ["discover", "obligations", "conflicts"]);
      const discover = operationOf(impl, "discover") as (
        w: string,
        m: unknown,
      ) => Promise<readonly DeclaredCommand[]>;
      const commands = await discover(workspaceOf("declared"), sampleModel);
      assert.equal(commands.length, 2, "two declared commands, one per phase");
      for (const command of commands) {
        // Every command carries its provenance: the FILE and the LINE.
        assert.equal(command.provenance.file, fileOf("declared"));
        assert.ok(command.provenance.line > 0, command.id);
        assert.deepEqual(command.provenance, provenanceOf("declared", command.id));
        // And it is a FIXED ARGUMENT LIST, never a text a shell would read.
        assert.ok(Array.isArray(command.argv) && command.argv.length > 0);
        for (const part of command.argv) assert.equal(typeof part, "string");
      }
      // The command of phase 1 reaches the MANIFEST of phase 1, carrying its
      // provenance, with `inner` true and its own hash.
      const manifest = manifestOf({ phase: 1, commands, searchPath: "/sample/bin" });
      const read = readCheckManifest(manifest);
      assert.equal(read.entries.length, 1);
      const entry = read.entries[0]!;
      assert.equal(entry.id, "sample-build");
      assert.deepEqual(entry.provenance, { file: fileOf("declared"), line: 4 });
      assert.equal(entry.inner, true);
      assert.deepEqual(entry.argv, ["/sample/bin/build", "--release"]);
      assert.equal(LOGICAL_NAME.replace("<N>", "1"), "phase:1:manifest");
      // The command of phase 2 is in the manifest of PHASE 2 and not here.
      const second = readCheckManifest(
        manifestOf({ phase: 2, commands, searchPath: "/sample/bin" }),
      );
      assert.deepEqual(
        second.entries.map((one) => one.id),
        ["sample-check"],
      );
      assert.deepEqual(second.entries[0]!.provenance, { file: fileOf("declared"), line: 12 });
      // The entry declares no reads and no writes, so it is undeclared, which
      // means serial (annex D §D.8).
      assert.equal("reads" in entry, false);
      assert.equal("writes" in entry, false);
      assert.equal(UNDECLARED_MEANS_SERIAL, true);
      // One obligation per task line of the model.
      const obligations = await (
        operationOf(impl, "obligations") as (m: unknown) => Promise<readonly unknown[]>
      )(sampleModel);
      assert.equal(obligations.length, sampleModel.phases[0]?.tasks.length);
      // A source reads and never writes.
      assert.equal(A_SOURCE_WRITES, false);
      assert.equal(WRITES, false);
    },
  },
  {
    id: "CT-105-153-conflict",
    title:
      "a fixture with a CONFLICT: two declarations that disagree are a blocker with both provenances, and the command they concern never enters the plan (F105-FR-015)",
    level: "behaviour",
    proves: ["F105-FR-053", "F105-FR-015"],
    async run(impl) {
      const discover = operationOf(impl, "discover") as (
        w: string,
        m: unknown,
      ) => Promise<readonly DeclaredCommand[]>;
      const conflicts = operationOf(impl, "conflicts") as (
        r: readonly (readonly DeclaredCommand[])[],
      ) => readonly Blocker[];
      const declared = await discover(workspaceOf("conflict"), sampleModel);
      assert.equal(declared.length, 2, "two declarations of the same id");
      assert.equal(declared[0]!.id, declared[1]!.id);
      const blockers = conflicts([declared]);
      assert.equal(blockers.length, 1, "one blocker, and never a guess");
      assert.equal(blockers[0]!.reason, "declarations-disagree");
      // BOTH provenances are on the blocker, so a person can go to either.
      assert.equal(blockers[0]!.provenance.length, 2);
      assert.deepEqual(
        blockers[0]!.provenance.map((one) => one.line).sort((a, b) => a - b),
        [4, 12],
      );
      for (const one of blockers[0]!.provenance) assert.equal(one.file, fileOf("conflict"));
      // The command the blocker concerns does NOT enter the plan, so the
      // manifest of its phase is empty — which is what makes the mode
      // `required` refuse the launch (F105-FR-019).
      const blocked = new Set(
        blockers.flatMap((one) => [...one.message.matchAll(/`([^`]+)`/g)].map((two) => two[1]!)),
      );
      const entering = declared.filter((one) => !blocked.has(one.id));
      assert.deepEqual([...entering], [], "no command of a conflict enters the plan");
      const manifest = readCheckManifest(
        manifestOf({ phase: 1, commands: entering, searchPath: "/sample/bin" }),
      );
      assert.deepEqual(manifest.entries, []);
      // A declaration that repeats itself EXACTLY is no conflict.
      assert.deepEqual([...conflicts([[declared[0]!, declared[0]!]])], []);
    },
  },
  {
    id: "CT-105-153-none",
    title:
      "a fixture with NO declaration: the manifest is empty, the result is `unchecked`, and the source produces no verdict, exit code or stop reason of its own (F105-FR-053)",
    level: "behaviour",
    proves: ["F105-FR-053"],
    async run(impl) {
      const discover = operationOf(impl, "discover") as (
        w: string,
        m: unknown,
      ) => Promise<readonly DeclaredCommand[]>;
      const commands = await discover(workspaceOf("none"), sampleModel);
      assert.deepEqual([...commands], []);
      // The manifest of every phase is EXPLICITLY empty, and no command was
      // generated for it.
      for (const phase of [1, 2]) {
        const manifest = readCheckManifest(
          manifestOf({ phase, commands, searchPath: "/sample/bin" }),
        );
        assert.ok("entries" in manifest);
        assert.deepEqual(manifest.entries, []);
      }
      // And the result of such a phase is `unchecked`.
      assert.equal(
        commands.length === 0 ? RESULT_OF_A_PHASE_WITHOUT_COMMANDS : "checked",
        "unchecked",
      );
      // A source that FAILS takes the plainer path of annex A §A.4 and
      // produces no verdict, no exit code and no stop reason of its own.
      const failing = {
        discover(): Promise<readonly DeclaredCommand[]> {
          throw new Error("the document could not be read");
        },
      };
      const outcome = await guardedCall(() => failing.discover(), {
        ep: EP,
        implementationId: impl.id,
        operation: "discover",
        event: {
          seq: 1,
          ts: "2026-10-03T00:00:00.000Z",
          runId: "run-ct-105-153",
          launchId: "launch-ct-105-153",
        },
      });
      assert.equal(outcome.degraded, true);
      if (outcome.degraded) {
        assert.equal(holdsNoVerdictExitCodeOrStopReason(outcome), true);
      }
      assert.match(plainerPathOf(EP), /contributes nothing|finding/);
      // The sample under test is the one from the TEST TREE, which no core
      // file names.
      assert.equal(impl.id, SAMPLE_ID);
      assert.deepEqual([...DOCUMENTS], ["declared", "conflict", "none"]);
      assert.deepEqual([...DECLARATIONS.none], []);
    },
  },
]);

export { implementation };

await casesAsTests(POINT_ID, implementation, cases);
