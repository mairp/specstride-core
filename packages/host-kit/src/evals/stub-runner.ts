/**
 * The STUB of a host's suite runner, with RECORDED results. The host's own
 * suite runner is a full child of the host on the consumer's credential: each
 * of its runs calls a model, so the build never starts it (a job of the build
 * that would is refused by the static check, `./static-check.ts`). The stub
 * replays the recorded results instead, among them an INTERRUPTED run and a
 * run ended by the USAGE LIMIT, which the driver (`./eval-driver.ts`) reports
 * as not scored.
 *
 * Moved once out of `packages/host-claude-code/src/evals/stub-runner.ts` (the
 * split of the monorepo, U-1 and U-2 of `specs/120-host-dsh`), which keeps the
 * old path and binds it to its own record.
 *
 * A HOST SUPPLIES ITS RECORD; THE KIT REPLAYS IT. The recorded results are
 * keyed by the case ids of the host's suite files and name the skills the host
 * invoked — facts of ONE host — and travel in the required `results` input of
 * `stubSuiteRunner`, with no default anywhere. The stub holds no model id and
 * makes no call of any kind: it is a table.
 */
import type { RecordedCaseResult, SuiteRunner } from "./eval-driver.ts";
import type { TriggerCase } from "./suite-file.ts";

/**
 * The stub of a host's suite runner over the GIVEN record: it replays the
 * record and calls nothing, refusing a case the record does not hold.
 */
export function stubSuiteRunner(
  results: Readonly<Record<string, RecordedCaseResult>>,
): SuiteRunner {
  return {
    kind: "stub",
    runCase(entry: TriggerCase): RecordedCaseResult {
      const recorded = results[entry.id];
      if (recorded === undefined) {
        throw new Error(`the stub of the host's suite runner holds no record for ${entry.id}`);
      }
      return recorded;
    },
  };
}
