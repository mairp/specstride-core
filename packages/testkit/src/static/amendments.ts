/**
 * T223 — the three static checks of the amendments (annex X, §X.7 and §X.8;
 * F100-FR-208, F100-FR-211, F100-FR-214).
 *
 *  1 Every key of annex X §X.7 is in the key list of feature 110. For every
 *    switch of the product the profile holds a value (F100-FR-211); a key of a
 *    row that the catalogue of feature 110 does not hold is a key no feature
 *    owns, and the check fails on it.
 *  2 Every alias of the environment alias table of annex X §X.8 names a key of
 *    that list (F100-FR-214). A cell that names no key — "No key: …", "Not
 *    carried", "Accepted and without effect" — names none by design and is
 *    reported as such, not as a failure.
 *  3 Every closed set of a feature's section "Closed sets" has a row in
 *    `closed-sets.json` with the same members (F100-FR-208).
 *
 * The key list of feature 110 is the file its `contracts/` directory publishes,
 * `specs/110-config-and-terms/contracts/config-keys.tsv`, and that file only.
 * The sections "Closed sets" are those of the specification of every feature
 * whose directory name opens with 1 (`specs/1...` / `spec.md`), each section
 * only.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

/** The annex sections the three checks read. */
export const ANNEX_SECTIONS = ["annex X, §X.7", "annex X, §X.8", "annex X, §X.6"] as const;

/** The requirements the three checks prove. */
export const REQUIREMENTS = ["F100-FR-208", "F100-FR-211", "F100-FR-214"] as const;

/** The one file of feature 110 that publishes the key list. */
export const KEY_LIST_FILE = "specs/110-config-and-terms/contracts/config-keys.tsv" as const;

/** The heading of the section every feature states its closed sets under. */
export const CLOSED_SETS_HEADING = "## Closed sets" as const;

/** One finding of a check: what failed, where, and the value. */
export type AmendmentFinding = {
  /** The check that found it. */
  readonly check: "profile-keys" | "alias-keys" | "closed-sets";
  /** The file the finding is in. */
  readonly file: string;
  /** The subject: a row number, a key, a set name. */
  readonly subject: string;
  readonly message: string;
};

/* ------------------------------------------------------------------ *
 * The key list of feature 110.
 * ------------------------------------------------------------------ */

/** The keys of the catalogue of feature 110, from the file it publishes. */
export function loadKeyList(root: string): readonly string[] {
  const path = join(root, KEY_LIST_FILE);
  if (!existsSync(path)) {
    throw new Error(
      `the key list of feature 110 is ${KEY_LIST_FILE}; it is not in the tree, so the ` +
        `checks of annex X §X.7 and §X.8 cannot run (F100-FR-211, F100-FR-214)`,
    );
  }
  const lines = readFileSync(path, "utf8").trim().split("\n");
  return Object.freeze(
    lines
      .slice(1) // the header row
      .map((line) => (line.split("\t")[0] ?? "").trim())
      .filter((key) => key !== ""),
  );
}

/**
 * Whether a key of an annex matches a key of the catalogue. A segment written
 * as a placeholder on either side stands for any segment: the catalogue holds
 * `harnesses.<id>.bin` and an annex may name `harnesses.prime.bin`, and the
 * catalogue holds `roles.critic.model` where an annex names `roles.<role>.model`.
 */
export function keyMatches(key: string, catalogueKey: string): boolean {
  const a = key.split(".");
  const b = catalogueKey.split(".");
  if (a.length !== b.length) return false;
  return a.every((segment, i) => {
    const other = b[i] ?? "";
    if (segment === other) return true;
    return /^<.+>$/.test(segment) || /^<.+>$/.test(other);
  });
}

/** True when the catalogue holds the key, by name or by template. */
export function catalogueHolds(key: string, keys: readonly string[]): boolean {
  return keys.some((candidate) => keyMatches(key, candidate));
}

/** True when the catalogue holds at least one key of a family (`loop.yield.*`). */
export function catalogueHoldsFamily(prefix: string, keys: readonly string[]): boolean {
  return keys.some((candidate) => candidate.startsWith(prefix));
}

/* ------------------------------------------------------------------ *
 * Check 1 — every key of annex X §X.7 is in the key list of feature 110.
 * ------------------------------------------------------------------ */

type ProfileRow = { number: number; keys: string[] };

/** Every key the profile of annex X §X.7 holds, with the row that holds it. */
export function profileKeys(root: string): readonly { row: number; key: string }[] {
  const file = join(root, "packages/contracts/data/parity-profile.json");
  const data = JSON.parse(readFileSync(file, "utf8")) as { switches: ProfileRow[] };
  return Object.freeze(
    data.switches.flatMap((row) => row.keys.map((key) => ({ row: row.number, key }))),
  );
}

/**
 * F100-FR-211 — for every switch of the product the profile holds a value, and
 * the key of every row is a configuration key of the catalogue of feature 110.
 */
export function checkProfileKeys(root: string): readonly AmendmentFinding[] {
  const keys = loadKeyList(root);
  const findings: AmendmentFinding[] = [];
  for (const { row, key } of profileKeys(root)) {
    if (!catalogueHolds(key, keys)) {
      findings.push({
        check: "profile-keys",
        file: "packages/contracts/data/parity-profile.json",
        subject: `row ${String(row)}, \`${key}\``,
        message:
          `row ${String(row)} of annex X §X.7 names the key \`${key}\`, which the key list ` +
          `of feature 110 (${KEY_LIST_FILE}) does not hold (F100-FR-211)`,
      });
    }
  }
  return Object.freeze(findings);
}

/* ------------------------------------------------------------------ *
 * Check 2 — every alias of annex X §X.8 names a key of that list.
 * ------------------------------------------------------------------ */

/** A cell of the column "Key" that names no key, by the head of §X.8. */
export const CELLS_THAT_NAME_NO_KEY = [
  /^No key\b/i,
  /^Not carried\b/i,
  /^Accepted and without effect\b/i,
] as const;

/** True when the cell names no key by design. */
export function namesNoKey(cell: string): boolean {
  return CELLS_THAT_NAME_NO_KEY.some((pattern) => pattern.test(cell.trim()));
}

/**
 * The keys a cell of the column "Key" names. Only a token that is key-shaped
 * counts: lower-case, dot-separated, with placeholders in angle brackets. A
 * profile name, an environment variable and a logical name are not keys and are
 * left out. A token that opens with a dot continues the key before it in the
 * same cell (`roles.proposer.idleTimeoutSec`, `.progressTimeoutSec`).
 */
export function keysOfAliasCell(cell: string): readonly string[] {
  const tokens = [...cell.matchAll(/`([^`]+)`/g)].map((m) => m[1] ?? "");
  const keys: string[] = [];
  for (const token of tokens) {
    if (token.startsWith(".")) {
      const previous = keys[keys.length - 1];
      if (previous === undefined) continue;
      const prefix = previous.slice(0, previous.lastIndexOf("."));
      keys.push(`${prefix}${token}`);
      continue;
    }
    if (!isKeyShaped(token)) continue;
    keys.push(token);
  }
  return Object.freeze(keys);
}

/** True when a token is shaped like a configuration key of feature 110. */
export function isKeyShaped(token: string): boolean {
  if (token.includes(":") || token.includes(" ") || token.includes("/")) return false;
  if (!token.includes(".")) return false;
  const segments = token.split(".");
  return segments.every(
    (segment) =>
      /^[a-z][A-Za-z0-9_]*$/.test(segment) || /^<[^<>]+>$/.test(segment) || segment === "*",
  );
}

type AliasRow = Record<string, string>;

/** The rows of the environment alias table of annex X §X.8. */
export function aliasRows(root: string): readonly AliasRow[] {
  const file = join(root, "packages/contracts/data/normalization.json");
  const data = JSON.parse(readFileSync(file, "utf8")) as { environmentAliases: AliasRow[] };
  return Object.freeze(data.environmentAliases);
}

/** What the alias check saw, so that a reader knows how much it compared. */
export type AliasCoverage = {
  readonly rows: number;
  /** Rows whose cell names at least one key, which the check compared. */
  readonly compared: number;
  /** Rows whose cell names no key by design ("No key: …", "Not carried"). */
  readonly nameNoKey: number;
  /** Keys compared, counted over every row. */
  readonly keys: number;
};

/** F100-FR-214 — every alias of §X.8 names a key of the list of feature 110. */
export function checkAliasKeys(root: string): {
  readonly findings: readonly AmendmentFinding[];
  readonly coverage: AliasCoverage;
} {
  const keys = loadKeyList(root);
  const findings: AmendmentFinding[] = [];
  let compared = 0;
  let nameNoKey = 0;
  let counted = 0;
  const rows = aliasRows(root);
  for (const [index, row] of rows.entries()) {
    const variable = row["As-is variable"] ?? "";
    const cell = row["Key"] ?? "";
    if (namesNoKey(cell)) {
      nameNoKey += 1;
      continue;
    }
    const named = keysOfAliasCell(cell);
    if (named.length === 0) {
      findings.push({
        check: "alias-keys",
        file: "packages/contracts/data/normalization.json",
        subject: variable,
        message:
          `the alias row ${String(index + 1)} of annex X §X.8 (${variable}) names no key and ` +
          `does not say that it names none ("No key: …", "Not carried", "Accepted and ` +
          `without effect") (F100-FR-214)`,
      });
      continue;
    }
    compared += 1;
    for (const key of named) {
      counted += 1;
      const held = key.endsWith(".*")
        ? catalogueHoldsFamily(key.slice(0, -1), keys)
        : catalogueHolds(key, keys);
      if (!held) {
        findings.push({
          check: "alias-keys",
          file: "packages/contracts/data/normalization.json",
          subject: `${variable} → \`${key}\``,
          message:
            `the alias row ${String(index + 1)} of annex X §X.8 names the key \`${key}\`, ` +
            `which the key list of feature 110 (${KEY_LIST_FILE}) does not hold ` +
            `(F100-FR-214)`,
        });
      }
    }
  }
  return Object.freeze({
    findings: Object.freeze(findings),
    coverage: Object.freeze({ rows: rows.length, compared, nameNoKey, keys: counted }),
  });
}

/* ------------------------------------------------------------------ *
 * Check 3 — every closed set of a feature has a row with the same members.
 * ------------------------------------------------------------------ */

type ClosedSetRow = { number: number; name: string; members: string; literals: string[] };

/** The table of annex X §X.6, as the `contracts` package ships it. */
export function closedSetTable(root: string): readonly ClosedSetRow[] {
  const file = join(root, "packages/contracts/data/closed-sets.json");
  return (JSON.parse(readFileSync(file, "utf8")) as { closedSets: ClosedSetRow[] }).closedSets;
}

const normalise = (text: string): string =>
  text.toLowerCase().replace(/`/g, "").replace(/\s+/g, " ").trim();

/** One row of a feature's section "Closed sets". */
export type FeatureClosedSet = {
  readonly feature: string;
  readonly file: string;
  /** The name of the set, without the "(row N)" the feature may add. */
  readonly name: string;
  /** The members cell, verbatim. */
  readonly members: string;
  /** The row of annex X §X.6 the set joins to, where it joins to one. */
  readonly row: number | undefined;
  /** How the join was made, for the report. */
  readonly joinedBy: "row-column" | "row-in-name" | "name" | "name-part" | "name-prefix" | "none";
};

/** The members a cell states, where it states a plain list of them. */
export function membersOfCell(cell: string): readonly string[] | undefined {
  const text = cell.trim();
  if (text === "" || text === "—") return undefined;
  const ticked = [...text.matchAll(/`([^`]+)`/g)].map((m) => m[1] ?? "");
  if (ticked.length === 0) {
    // A list of bare words in capitals, as feature 101 writes the verdicts.
    return /^[A-Z][A-Za-z0-9_]*(,\s*[A-Z][A-Za-z0-9_]*)+$/.test(text)
      ? Object.freeze(text.split(",").map((m) => m.trim()))
      : undefined;
  }
  // A cell is a plain list only when nothing but the members and the
  // separators is in it. A cell with prose points at a requirement or an annex
  // for its members, and the members are compared where that text lives.
  const rest = text.replace(/`[^`]+`/g, "").replace(/[,;.\s]|\band\b|\bor\b/g, "");
  return rest === "" ? Object.freeze(ticked) : undefined;
}

/** The tables of a feature's section "Closed sets", with their header row. */
function tablesOfSection(lines: readonly string[]): readonly {
  cols: readonly string[];
  rows: readonly (readonly string[])[];
}[] {
  const pipes = lines.filter((l) => l.trim().startsWith("|"));
  const cells = (line: string): string[] =>
    line
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());
  // A header is the line above a separator row; every other line is data.
  const headerAt = new Set<number>();
  for (const [i, line] of pipes.entries()) {
    const c = cells(line);
    if (c.length > 0 && c.every((x) => /^:?-+:?$/.test(x))) headerAt.add(i - 1);
  }
  const tables: { cols: readonly string[]; rows: (readonly string[])[] }[] = [];
  let current: { cols: readonly string[]; rows: (readonly string[])[] } | undefined;
  for (const [i, line] of pipes.entries()) {
    const c = cells(line);
    if (headerAt.has(i)) {
      current = { cols: Object.freeze(c), rows: [] };
      tables.push(current);
      continue;
    }
    if (c.length > 0 && c.every((x) => /^:?-+:?$/.test(x))) continue; // the separator
    if (current !== undefined && c.length === current.cols.length) {
      current.rows.push(Object.freeze(c));
    }
  }
  return Object.freeze(tables);
}

/** The closed sets a feature states under its heading "Closed sets". */
export function featureClosedSets(
  root: string,
  feature: string,
  table: readonly ClosedSetRow[],
): readonly FeatureClosedSet[] {
  const relative = `specs/${feature}/spec.md`;
  const path = join(root, relative);
  if (!existsSync(path)) return [];
  const lines = readFileSync(path, "utf8").split("\n");
  const start = lines.findIndex((l) => l.trim() === CLOSED_SETS_HEADING);
  if (start < 0) return [];
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^## /.test(lines[i] ?? "")) {
      end = i;
      break;
    }
  }
  const out: FeatureClosedSet[] = [];
  for (const t of tablesOfSection(lines.slice(start, end))) {
    const iName = t.cols.findIndex((h) => /^(closed set|set)$/i.test(h));
    const iMembers = t.cols.findIndex((h) => /^members$/i.test(h));
    const iRow = t.cols.findIndex((h) => /^row\b/i.test(h));
    // A table of the section that is not a closed-set table (no column "Set"
    // and no column "Members") is a supplementary table and is left alone.
    if (iName < 0 || iMembers < 0) continue;
    for (const cells of t.rows) {
      const nameCell = cells[iName] ?? "";
      const members = cells[iMembers] ?? "";
      const joined = joinToTheAnnex(nameCell, iRow >= 0 ? cells[iRow] : undefined, table);
      out.push(
        Object.freeze({
          feature,
          file: relative,
          name: joined.name,
          members,
          row: joined.row,
          joinedBy: joined.joinedBy,
        }),
      );
    }
  }
  return Object.freeze(out);
}

/**
 * Join a feature's row to its row of annex X §X.6: by the number the feature
 * gives, in a column of its own or in the name; else by the name of the set,
 * whole, as one part of a compound annex name, or as the opening of one.
 */
function joinToTheAnnex(
  nameCell: string,
  rowCell: string | undefined,
  table: readonly ClosedSetRow[],
): { row: number | undefined; name: string; joinedBy: FeatureClosedSet["joinedBy"] } {
  const bare = nameCell.replace(/\s*\([^)]*\)\s*$/, "").trim();
  const fromColumn = Number.parseInt(rowCell ?? "", 10);
  if (Number.isFinite(fromColumn)) {
    return { row: fromColumn, name: bare, joinedBy: "row-column" };
  }
  const inName = nameCell.match(/row\s+(\d+)/i);
  if (inName?.[1] !== undefined) {
    return { row: Number.parseInt(inName[1], 10), name: bare, joinedBy: "row-in-name" };
  }
  const key = normalise(bare);
  const whole = table.filter((r) => normalise(r.name) === key);
  if (whole.length === 1) return { row: whole[0]?.number, name: bare, joinedBy: "name" };
  const part = table.filter((r) => r.name.split(";").some((p) => normalise(p) === key));
  if (part.length === 1) return { row: part[0]?.number, name: bare, joinedBy: "name-part" };
  const prefix = table.filter((r) =>
    r.name.split(";").some((p) => normalise(p).startsWith(`${key} `)),
  );
  if (prefix.length === 1) return { row: prefix[0]?.number, name: bare, joinedBy: "name-prefix" };
  return { row: undefined, name: bare, joinedBy: "none" };
}

/**
 * The feature rows that no number and no name of annex X §X.6 joins. Each is a
 * row of another feature's specification, so this check reports them and the
 * owner repairs the name; the list is pinned by the test, which fails when it
 * grows.
 */
export type ClosedSetCoverage = {
  /** Every row of every feature's section. */
  readonly rows: number;
  /** Rows joined to a row of annex X §X.6. */
  readonly joined: number;
  /** Rows whose members were compared, both cells being a plain list. */
  readonly compared: number;
  /** Rows whose members one cell states by reference, so nothing was compared. */
  readonly deferred: number;
  /** The rows no number and no name joined, as `<feature>::<set>`. */
  readonly unjoined: readonly string[];
};

/** F100-FR-208 — every closed set of a feature has a row with the same members. */
export function checkClosedSets(root: string): {
  readonly findings: readonly AmendmentFinding[];
  readonly coverage: ClosedSetCoverage;
} {
  const table = closedSetTable(root);
  const byNumber = new Map(table.map((r) => [r.number, r]));
  const features = readdirSync(join(root, "specs"))
    .filter((d) => /^1/.test(d))
    .sort();
  const findings: AmendmentFinding[] = [];
  const unjoined: string[] = [];
  const groups = new Map<number, FeatureClosedSet[]>();
  let rows = 0;
  for (const feature of features) {
    for (const set of featureClosedSets(root, feature, table)) {
      rows += 1;
      if (set.row === undefined) {
        unjoined.push(`${feature}::${set.name}`);
        continue;
      }
      const annex = byNumber.get(set.row);
      if (annex === undefined) {
        findings.push({
          check: "closed-sets",
          file: set.file,
          subject: set.name,
          message:
            `the closed set "${set.name}" of ${feature} names row ${String(set.row)} of ` +
            `annex X §X.6, and the table holds no such row (F100-FR-208)`,
        });
        continue;
      }
      const list = groups.get(set.row) ?? [];
      list.push(set);
      groups.set(set.row, list);
    }
  }
  let compared = 0;
  let deferred = 0;
  for (const [number, sets] of [...groups].sort((a, b) => a[0] - b[0])) {
    const annex = byNumber.get(number);
    if (annex === undefined) continue;
    const annexMembers = membersOfCell(annex.members);
    const featureMembers = sets.map((s) => membersOfCell(s.members));
    if (annexMembers === undefined || featureMembers.some((m) => m === undefined)) {
      deferred += 1;
      continue;
    }
    compared += 1;
    // Where more than one feature cites one row, the row is the union of what
    // they state: row 5 is `cause` and `causedBy`, and feature 101 states both.
    const stated = new Set(featureMembers.flatMap((m) => [...(m ?? [])]));
    const held = new Set(annexMembers);
    const extra = [...stated].filter((m) => !held.has(m));
    const missing = annexMembers.filter((m) => !stated.has(m));
    if (extra.length > 0 || missing.length > 0) {
      findings.push({
        check: "closed-sets",
        file: sets.map((s) => s.file).join(", "),
        subject: `row ${String(number)} ${annex.name}`,
        message:
          `the members of row ${String(number)} of annex X §X.6 ("${annex.name}") and the ` +
          `members ${sets.map((s) => s.feature).join(", ")} state differ: ` +
          `${extra.length > 0 ? `only in the specification: ${extra.join(", ")}; ` : ""}` +
          `${missing.length > 0 ? `only in the annex: ${missing.join(", ")}` : ""}` +
          ` (F100-FR-208)`,
      });
    }
  }
  return Object.freeze({
    findings: Object.freeze(findings),
    coverage: Object.freeze({
      rows,
      joined: rows - unjoined.length,
      compared,
      deferred,
      unjoined: Object.freeze(unjoined.sort()),
    }),
  });
}
