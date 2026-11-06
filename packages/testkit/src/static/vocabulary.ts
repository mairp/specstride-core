/**
 * T263 — the static test "Vocabulary" (annex X, §X.10; F100-FR-226;
 * F100-SC-003; quickstart.md scenario 3, the row "Vocabulary").
 *
 * No file under the feature directories of `specs` names an exit code (in the
 * form `exit N` beside a command), a stop reason, a run state, a logical name,
 * an envelope field or a rank that the data files do not hold. The test names
 * the file, the line and the value.
 *
 * The test reads the data files directly, so that it stands inside user story
 * 1: `data/exit-codes.json` (`engine`, `perCommand`,
 * `runtimeRootAndPipelineEntry`), `data/run-state-machine.json` (`states`),
 * `data/stop-reasons.json` (`stopReasons`), `data/layout.json`
 * (`logicalNames`), `data/config-ranks.json` and
 * `schemas/event-envelope.schema.json` (its `properties`).
 *
 * Each of the six values has a syntactic anchor, so that the test names a
 * value only where the specification uses it as that kind of value:
 *
 * - an exit code: the words `exit N` in prose, code spans stripped, so that a
 *   quoted as-is message of a baseline is not read as a statement of the
 *   product;
 * - a stop reason: a snake-case literal that follows the words "stop reason";
 * - a run state: a literal that follows the words "run state";
 * - a logical name: a literal whose first segment is a namespace of the table
 *   of annex B §B.5, compared shape by shape, so that an instantiated
 *   parameter matches its template;
 * - an envelope field: a literal that follows the words "envelope field";
 * - a rank: the words "rank N" in prose.
 *
 * A line that records the withdrawal of a name states that the name is not in
 * use; it is not a use of it.
 */
import {
  ROOT,
  contractsData,
  contractsSchema,
  finding,
  linesOf,
  prose,
  rel,
  specFiles,
  type CheckOptions,
  type Finding,
  type StaticCheck,
} from "./kit.ts";

const un = (s: string): string => String(s).replace(/`/g, "").trim();

type ExitCodes = {
  engine: { process: string; rows: Record<string, string | null>[] }[];
  runtimeRootAndPipelineEntry: { Code: string }[];
  perCommand: { Command: string; Codes: string }[];
  collisions?: { Value: string }[];
};
type StateMachine = { states: { State: string }[]; blockedReasons: { "Blocked reason": string }[] };
type StopReasons = { stopReasons: { literal: string }[] };
type Layout = { logicalNames: { logicalName: string; content: string }[] };
type Ranks = { ranks: { Rank: string }[] };
type Envelope = { properties: Record<string, unknown> };

/** Strip the identifiers and parentheticals of a cell before reading numbers. */
function numbersOf(cell: string): string[] {
  return [
    ...cell
      .replace(/\([^)]*\)/g, " ")
      .replace(/\b[A-Z][A-Za-z]*-?\d{2,}\b/g, " ")
      .replace(/§[A-Z]\.\d+/g, " ")
      .matchAll(/\b\d{1,3}\b/g),
  ].map((m) => m[0] as string);
}

/** Every exit code the data files hold, and the signal codes 128+N. */
export function exitCodes(root: string = ROOT): ReadonlySet<string> {
  const data = contractsData<ExitCodes>("exit-codes.json", root);
  const out = new Set<string>();
  for (const group of data.engine) {
    for (const row of group.rows) {
      for (const value of Object.values(row)) {
        if (typeof value !== "string") continue;
        if (/^\d{1,3}$/.test(value.trim())) out.add(value.trim());
      }
    }
  }
  for (const row of data.runtimeRootAndPipelineEntry) {
    for (const n of numbersOf(String(row.Code))) out.add(n);
  }
  for (const row of data.perCommand) for (const n of numbersOf(String(row.Codes))) out.add(n);
  for (const row of data.collisions ?? []) out.add(String(row.Value).trim());
  // A signal end is `128+N`: the table names it, and N is a signal number.
  for (let n = 1; n <= 64; n++) out.add(String(128 + n));
  return out;
}

/** The written run states and the blocked reasons of the run-state machine. */
export function runStates(root: string = ROOT): ReadonlySet<string> {
  const data = contractsData<StateMachine>("run-state-machine.json", root);
  const out = new Set<string>();
  for (const s of data.states) out.add(un(s.State).replace(/ \(derived\)$/, ""));
  for (const s of data.blockedReasons) out.add(un(s["Blocked reason"]));
  // The derived run conditions of annex X §X.6 row 2.
  for (const c of ["dead", "stale", "launch-abandoned", "unknown"]) out.add(c);
  return out;
}

/** The 15 stop reasons of annex E §E.3. */
export function stopReasons(root: string = ROOT): ReadonlySet<string> {
  return new Set(
    contractsData<StopReasons>("stop-reasons.json", root).stopReasons.map((r) => r.literal),
  );
}

/** The fields of the event envelope. */
export function envelopeFields(root: string = ROOT): ReadonlySet<string> {
  return new Set(
    Object.keys(contractsSchema<Envelope>("event-envelope.schema.json", root).properties),
  );
}

/** The ranks of configuration, 1 to 8. */
export function ranks(root: string = ROOT): ReadonlySet<string> {
  return new Set(contractsData<Ranks>("config-ranks.json", root).ranks.map((r) => un(r.Rank)));
}

/** The templates of the logical names, as segment lists, with their aliases. */
export function logicalNamePatterns(root: string = ROOT): {
  patterns: readonly (readonly string[])[];
  namespaces: ReadonlySet<string>;
} {
  const data = contractsData<Layout>("layout.json", root).logicalNames;
  const names = data.map((n) => n.logicalName);
  // A row may state a long form of its name: "Short for `feature:<slug>:…`".
  const aliases: string[] = [];
  for (const row of data) {
    for (const m of String(row.content ?? "").matchAll(/Short for `([^`]+)`/g)) {
      aliases.push(m[1] as string);
    }
  }
  return {
    patterns: [...names, ...aliases].map((n) => n.split(":")),
    namespaces: new Set(names.map((n) => n.split(":")[0] as string)),
  };
}

/** True when a token matches a template of the table, segment by segment. */
export function matchesALogicalName(
  token: string,
  patterns: readonly (readonly string[])[],
): boolean {
  const segments = token.split(":");
  return patterns.some(
    (pattern) =>
      pattern.length === segments.length &&
      pattern.every((part, i) => {
        const segment = segments[i] as string;
        return part.startsWith("<") || segment.startsWith("<") || part === segment;
      }),
  );
}

/** A line that records a withdrawal is no use of the name it records. */
const RECORDS_A_WITHDRAWAL = /withdraw/i;

const EXIT = /\bexit (\d{1,3})\b/gi;
const RANK = /\brank (\d{1,2})\b/gi;
const STOP_REASON = /stop reasons?\s+(?:is\s+|of\s+|the\s+|are\s+)?`([a-z]+(?:_[a-z]+)+)`/gi;
const RUN_STATE = /\brun state\s+`([^`]+)`/gi;
const ENVELOPE_FIELD = /(?:envelope field|field of the envelope)\s+`([A-Za-z][A-Za-z0-9]*)`/gi;
const LOGICAL_NAME = /`([a-z][a-z0-9-]*)((?::(?:[a-z0-9-]+|<[A-Za-z]+>))+)`/g;

/** F100-FR-226 — the six vocabularies over the specifications. */
export function checkVocabulary(options: CheckOptions = {}): readonly Finding[] {
  const root = options.root ?? ROOT;
  const codes = exitCodes(root);
  const states = runStates(root);
  const reasons = stopReasons(root);
  const fields = envelopeFields(root);
  const rankValues = ranks(root);
  const { patterns, namespaces } = logicalNamePatterns(root);
  const findings: Finding[] = [];

  for (const file of specFiles(options)) {
    const path = rel(file, root);
    const lines = linesOf(file);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] as string;
      if (RECORDS_A_WITHDRAWAL.test(line)) continue;
      const text = prose(line);
      const at = i + 1;

      EXIT.lastIndex = 0;
      for (let m = EXIT.exec(text); m !== null; m = EXIT.exec(text)) {
        const code = m[1] as string;
        if (codes.has(code)) continue;
        findings.push(
          finding(path, at, `the exit code ${code} is in no exit-code table (F100-FR-226)`, code),
        );
      }

      RANK.lastIndex = 0;
      for (let m = RANK.exec(text); m !== null; m = RANK.exec(text)) {
        const rank = m[1] as string;
        if (rankValues.has(rank)) continue;
        findings.push(
          finding(
            path,
            at,
            `the configuration rank ${rank} is in no rank table (F100-FR-226)`,
            rank,
          ),
        );
      }

      STOP_REASON.lastIndex = 0;
      for (let m = STOP_REASON.exec(line); m !== null; m = STOP_REASON.exec(line)) {
        const reason = m[1] as string;
        if (reasons.has(reason)) continue;
        findings.push(
          finding(
            path,
            at,
            `the stop reason \`${reason}\` is in no closed set (F100-FR-226)`,
            reason,
          ),
        );
      }

      RUN_STATE.lastIndex = 0;
      for (let m = RUN_STATE.exec(line); m !== null; m = RUN_STATE.exec(line)) {
        const state = un(m[1] as string);
        if (states.has(state)) continue;
        findings.push(
          finding(path, at, `the run state \`${state}\` is in no state table (F100-FR-226)`, state),
        );
      }

      ENVELOPE_FIELD.lastIndex = 0;
      for (let m = ENVELOPE_FIELD.exec(line); m !== null; m = ENVELOPE_FIELD.exec(line)) {
        const field = m[1] as string;
        if (fields.has(field)) continue;
        findings.push(
          finding(
            path,
            at,
            `the envelope field \`${field}\` is in no event envelope (F100-FR-226)`,
            field,
          ),
        );
      }

      LOGICAL_NAME.lastIndex = 0;
      for (let m = LOGICAL_NAME.exec(line); m !== null; m = LOGICAL_NAME.exec(line)) {
        const head = m[1] as string;
        if (!namespaces.has(head)) continue; // no namespace of the table: no logical name
        const token = head + (m[2] as string);
        if (matchesALogicalName(token, patterns)) continue;
        findings.push(
          finding(
            path,
            at,
            `the logical name \`${token}\` is not in the table of annex B §B.5 ` + `(F100-FR-226)`,
            token,
          ),
        );
      }
    }
  }
  return Object.freeze(findings);
}

/** The check the runner of T264 registers. */
export const vocabularyCheck: StaticCheck = {
  name: "Vocabulary",
  covers: ["F100-FR-226", "F100-SC-003"],
  run: checkVocabulary,
};

export default vocabularyCheck;
