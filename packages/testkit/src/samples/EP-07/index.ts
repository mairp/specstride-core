/**
 * T108 — the sample implementation of EP-07, the verification-plan source,
 * outside the core, registered from the test tree (annex A, §A.4,
 * F100-FR-018; annex X, §X.10, F100-FR-222).
 *
 * A source that contributes one command with its provenance, one obligation
 * per task line, and no blocker. It reads and never writes, and it reports
 * only what a file it names declares.
 */
import type {
  Blocker,
  DeclaredCommand,
  VerificationObligation,
} from "@specstride/contracts/ep/verification-source";
import type { Implementation } from "../../conformance/frame.ts";

/** The one command the sample declares, with the file and the line. */
export const DECLARED: DeclaredCommand = Object.freeze({
  id: "sample-check",
  argv: Object.freeze(["/sample/bin/check", "--all"]),
  provenance: Object.freeze({ file: "verification-commands.md", line: 12 }),
  phase: 1,
  timeLimitMs: 60_000,
});

export const operations = Object.freeze({
  discover(_workspace: string, _model: unknown): Promise<readonly DeclaredCommand[]> {
    return Promise.resolve(Object.freeze([DECLARED]));
  },
  obligations(model: unknown): Promise<readonly VerificationObligation[]> {
    const tasks =
      (model as { phases?: { tasks?: { id: string }[] }[] } | undefined)?.phases?.flatMap(
        (p) => p.tasks ?? [],
      ) ?? [];
    return Promise.resolve(
      Object.freeze(
        tasks.map((task) =>
          Object.freeze({
            obligationId: `VO-sample-${task.id}`,
            taskId: task.id,
            level: "contract",
            kind: "positive",
            oracle: "the sample source",
          }),
        ),
      ),
    );
  },
  conflicts(resultsOfEverySource: readonly (readonly DeclaredCommand[])[]): readonly Blocker[] {
    const byId = new Map<string, DeclaredCommand>();
    const out: Blocker[] = [];
    for (const commands of resultsOfEverySource) {
      for (const command of commands) {
        const seen = byId.get(command.id);
        if (seen !== undefined && seen.argv.join(" ") !== command.argv.join(" ")) {
          out.push(
            Object.freeze({
              reason: "declarations-disagree" as const,
              message: `two declarations of \`${command.id}\` disagree`,
              provenance: Object.freeze([seen.provenance, command.provenance]),
            }),
          );
        }
        byId.set(command.id, command);
      }
    }
    return Object.freeze(out);
  },
});

export const implementation: Implementation = Object.freeze({
  ep: "EP-07",
  pointId: "specstride.verification-source/1",
  id: "sample-verification-source",
  implementationClass: "first-party",
  majors: [1],
  provenance: "default",
  operations,
});
