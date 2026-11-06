/**
 * T054 — a SAMPLE plan source of EP-07 OUTSIDE THE CORE, whose command
 * appears in the check manifest WITH ITS PROVENANCE (F105-FR-053).
 *
 * No core file names this module: it lives in the test tree and is registered
 * from there, as annex A §A.4 and F100-FR-018 ask. `index.ts` beside it is
 * feature 100's own sample (T108), which proves that the three operations of
 * the point exist; this one is feature 105's, and it proves the thing the
 * CONTENT owner cares about — that a command a source outside the core
 * declared reaches the frozen manifest of its phase, carrying the file and the
 * line it was declared on.
 *
 * It reads ONE file it names, a verification-commands document, and writes
 * nothing (§C.9, `A_SOURCE_WRITES === false`). Three documents drive it:
 *
 *  - `declared`: two commands, one per phase, each with its provenance;
 *  - `conflict`: two declarations of ONE id that DISAGREE, which is a blocker
 *    and never a guess (F105-FR-015);
 *  - `none`: no declaration at all, which gives an EMPTY manifest and the
 *    result `unchecked` (the checkpoint of phase 4 of `tasks.md`).
 */
import type {
  Blocker,
  DeclaredCommand,
  Provenance,
  VerificationObligation,
} from "@specstride/contracts/ep/verification-source";
import type { Implementation } from "../../conformance/frame.ts";

/** The id this sample registers under; the core knows no such id. */
export const SAMPLE_ID = "sample-declared-verification-source" as const;

/** The three documents the sample reads, by name. */
export const DOCUMENTS = ["declared", "conflict", "none"] as const;
export type DocumentName = (typeof DOCUMENTS)[number];

/** The place a document of this sample is declared in, for its provenance. */
export function fileOf(document: DocumentName): string {
  return `sample-${document}-commands.json`;
}

/** The commands of each document, with the file and the line of each. */
export const DECLARATIONS: Readonly<Record<DocumentName, readonly DeclaredCommand[]>> =
  Object.freeze({
    declared: Object.freeze([
      Object.freeze({
        id: "sample-build",
        argv: Object.freeze(["/sample/bin/build", "--release"]),
        provenance: Object.freeze({ file: fileOf("declared"), line: 4 }),
        phase: 1,
        timeLimitMs: 1_800_000,
      }),
      Object.freeze({
        id: "sample-check",
        argv: Object.freeze(["/sample/bin/check", "--all"]),
        provenance: Object.freeze({ file: fileOf("declared"), line: 12 }),
        phase: 2,
        timeLimitMs: 900_000,
      }),
    ]),
    conflict: Object.freeze([
      Object.freeze({
        id: "sample-check",
        argv: Object.freeze(["/sample/bin/check", "--all"]),
        provenance: Object.freeze({ file: fileOf("conflict"), line: 4 }),
        phase: 1,
        timeLimitMs: 900_000,
      }),
      Object.freeze({
        id: "sample-check",
        argv: Object.freeze(["/sample/bin/check", "--only-fast"]),
        provenance: Object.freeze({ file: fileOf("conflict"), line: 12 }),
        phase: 1,
        timeLimitMs: 60_000,
      }),
    ]),
    none: Object.freeze([]),
  });

/** Which document a workspace names; the sample reads nothing else. */
export function documentOfWorkspace(workspace: string): DocumentName {
  for (const name of DOCUMENTS) if (workspace.includes(name)) return name;
  return "none";
}

/** The three operations of EP-07, as this sample implements them. */
export const operations = Object.freeze({
  discover(workspace: string, _model: unknown): Promise<readonly DeclaredCommand[]> {
    return Promise.resolve(DECLARATIONS[documentOfWorkspace(workspace)]);
  },
  obligations(model: unknown): Promise<readonly VerificationObligation[]> {
    const tasks =
      (model as { phases?: { tasks?: { id: string }[] }[] } | undefined)?.phases?.flatMap(
        (phase) => phase.tasks ?? [],
      ) ?? [];
    return Promise.resolve(
      Object.freeze(
        tasks.map((task) =>
          Object.freeze({
            obligationId: `VO-sample-declared-${task.id}`,
            taskId: task.id,
            level: "contract",
            kind: "positive",
            oracle: "the sample declared source",
          }),
        ),
      ),
    );
  },
  /**
   * Two declarations of one id that disagree are a BLOCKER with BOTH
   * provenances, and never a guess (F105-FR-015). A declaration that repeats
   * itself exactly is no conflict.
   */
  conflicts(resultsOfEverySource: readonly (readonly DeclaredCommand[])[]): readonly Blocker[] {
    const seen = new Map<string, DeclaredCommand>();
    const out: Blocker[] = [];
    for (const commands of resultsOfEverySource) {
      for (const command of commands) {
        const earlier = seen.get(command.id);
        if (earlier !== undefined && identityOf(earlier) !== identityOf(command)) {
          out.push(
            Object.freeze({
              reason: "declarations-disagree" as const,
              message: `two declarations of \`${command.id}\` disagree`,
              provenance: Object.freeze([earlier.provenance, command.provenance]),
            }),
          );
          continue;
        }
        seen.set(command.id, command);
      }
    }
    return Object.freeze(out);
  },
});

/** What two declarations must agree on: the argument list and the limit. */
export function identityOf(command: DeclaredCommand): string {
  return JSON.stringify([[...command.argv], command.phase, command.timeLimitMs]);
}

/** The provenance of one command of a document, for a reader of a manifest. */
export function provenanceOf(document: DocumentName, id: string): Provenance | undefined {
  return DECLARATIONS[document].find((one) => one.id === id)?.provenance;
}

/** A source reads and never writes: this sample touches no file at all. */
export const WRITES = false as const;

export const implementation: Implementation = Object.freeze({
  ep: "EP-07",
  pointId: "specstride.verification-source/1",
  id: SAMPLE_ID,
  implementationClass: "first-party",
  majors: [1],
  // The rank the registration came from (annex X §X.2): the test tree
  // registers through user configuration, as feature 100's own sample does.
  provenance: "user-configuration",
  operations,
});
