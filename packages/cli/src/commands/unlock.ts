/**
 * `specstride unlock --stale` — the safe way out of a lock no run owns
 * (F123-FR-021, F123-FR-022; EP-13).
 *
 * The launch check `run-directory-free` refuses `stale-lock` when the owner of
 * the workspace lock is dead, and `foreign-lock` when the lock is not one this
 * engine wrote (the bash orchestrator's one-line file). Before this verb the
 * only way out was a hand `mv`. It moves the lock into `<control>/backups/` —
 * never deletes it — and only when the owner is provably gone; a lock held by
 * a live owner, a lock of another host, and a lock whose writer cannot be
 * named are refused and left where they are.
 */
import {
  unlockStale,
  lockDetail,
  type InspectDependencies,
} from "../../../runtime/src/lock/inspect.ts";

/** The exit codes of `unlock`: moved, refused, usage. */
export const UNLOCK_EXIT = Object.freeze({ moved: 0, refused: 24, usage: 2 });

/** The `next=` of each refusal of `unlock --stale`. */
const NEXT: Readonly<Record<string, string>> = Object.freeze({
  "no-lock": "nothing to do; `specstride launch --mode run` starts the run",
  "lock-held": "a live run owns the lock; `specstride wait --until-change` watches it",
  "owner-alive": "the process that wrote the lock still lives; stop it first",
  "owner-unprovable":
    "the writer of the lock cannot be proven gone; move the lock to .specstride/backups/ by hand once you are sure",
});

/** Run `unlock` on the arguments after its word. */
export async function unlockCommand(
  argv: readonly string[],
  place: { controlRoot: string; workspaceRealPath: string },
  print: (line: string) => void,
  dependencies: InspectDependencies = {},
): Promise<number> {
  if (argv.length !== 1 || argv[0] !== "--stale") {
    print(
      `[SPECSTRIDE-REFUSE] action=unlock reason=usage next=${JSON.stringify("specstride unlock --stale")}`,
    );
    return UNLOCK_EXIT.usage;
  }
  const outcome = await unlockStale(place, dependencies);
  if (outcome.moved) {
    print(
      `[SPECSTRIDE-UNLOCK] state=${outcome.inspection.state} ${lockDetail(outcome.inspection)} moved-to=${outcome.to}`,
    );
    return UNLOCK_EXIT.moved;
  }
  print(
    `[SPECSTRIDE-REFUSE] action=unlock reason=${outcome.reason} state=${outcome.inspection.state} ${lockDetail(
      outcome.inspection,
    )} next=${JSON.stringify(NEXT[outcome.reason] ?? "")}`,
  );
  return UNLOCK_EXIT.refused;
}
