/**
 * T009 of feature 129 — a SAMPLE RENDERER that takes the JSON of a view and NO
 * FILE HANDLE (F129-FR-032, F129-FR-036).
 *
 * It is the proof that a renderer needs nothing but the record: it opens no
 * file, it imports no event reader and no state reader, and it derives no lane
 * and no attention item of its own — every one of those is already in the view.
 * Its only input is the canonical JSON text of a view.
 *
 * A renderer that fails prints ONE line that names the command `status --json`
 * and changes no state (F129-FR-032).
 */

/** The one line a renderer prints when it cannot render (F129-FR-032). */
export const FAILURE_LINE =
  "specstride: the view could not be rendered; run `status --json`" as const;

/** What the sample renderer produced. */
export type RenderOutcome =
  | { readonly ok: true; readonly lines: readonly string[] }
  | { readonly ok: false; readonly lines: readonly [typeof FAILURE_LINE] };

type ViewLike = {
  runId?: unknown;
  display?: unknown;
  schema?: unknown;
  progress?: { phase?: unknown; phases?: unknown };
  lanes?: readonly { lane?: unknown; cards?: readonly unknown[] }[];
  attention?: readonly { kind?: unknown; next?: unknown }[];
  budget?: readonly { scope?: unknown; role?: unknown; costClass?: unknown; level?: unknown }[];
};

/**
 * Render the JSON TEXT of a view. The signature takes a string and nothing
 * else: there is no parameter a file handle could be passed in.
 */
export function renderViewJson(json: string): RenderOutcome {
  try {
    const view = JSON.parse(json) as ViewLike;
    if (typeof view !== "object" || view === null || typeof view.schema !== "string") {
      return Object.freeze({ ok: false, lines: [FAILURE_LINE] as const });
    }
    const lines: string[] = [];
    lines.push(`run=${String(view.runId)} st=${String(view.display)}`);
    const phase = view.progress?.phase;
    const phases = view.progress?.phases;
    if (typeof phase === "number" && typeof phases === "number")
      lines.push(`phase ${phase}/${phases}`);
    for (const lane of view.lanes ?? []) {
      lines.push(`lane ${String(lane.lane)}: ${(lane.cards ?? []).length} card(s)`);
    }
    for (const item of view.attention ?? []) {
      lines.push(`attention ${String(item.kind)} -> ${String(item.next)}`);
    }
    for (const row of view.budget ?? []) {
      lines.push(
        `budget ${String(row.scope)}/${String(row.role)}/${String(row.costClass)}: ${String(row.level)}`,
      );
    }
    return Object.freeze({ ok: true, lines: Object.freeze(lines) });
  } catch {
    return Object.freeze({ ok: false, lines: [FAILURE_LINE] as const });
  }
}

/** The names a renderer may NOT import (F129-FR-032); read by the static test. */
export const FORBIDDEN_IMPORTS_OF_A_RENDERER = [
  "node:fs",
  "node:fs/promises",
  "@specstride/cli/status/event-reader",
] as const;
