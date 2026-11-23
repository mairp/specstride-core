#!/usr/bin/env node
/**
 * T002 — the extractor of the built-in defaults of the Specstride baseline at
 * `9cab15d` (F110-FR-006).
 *
 *     node packages/config/tools/baseline-defaults-extract.ts <checkout>
 *
 * It prints one row per as-is variable that the baseline gives a built-in
 * default, with the default and the file and line that holds it, in the shape
 * of the first three columns of `packages/config/data/baseline-defaults.tsv`.
 * `orchestrator.sh` is the reference: where another source of the baseline
 * also defaults a variable, the orchestrator's value stands.
 *
 * It is the re-runnable source of the committed snapshot, so the snapshot
 * cannot drift from the baseline text without the check of
 * `tests/unit/baseline-defaults.test.ts` saying so.
 *
 * It reads only; it writes nothing.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/** A built-in default the baseline holds. */
export interface BaselineDefault {
  variable: string;
  /** The default as the baseline writes it; `` for "empty = unset". */
  value: string;
  /** `<file>:<line>` inside the checkout. */
  source: string;
}

/** `${NAME:-default}` and `${NAME:=default}` of a shell file. */
const SHELL =
  /\$\{((?:SPECSTRIDE|RALPH|WIGGUM|OPENAI|ANTHROPIC|DSH)_[A-Z0-9_]+):[-=]((?:[^{}]|\$\{[^{}]*\})*)\}/g;
/** `os.environ.get("NAME", default)` and `os.getenv("NAME", default)`. */
const PYTHON =
  /(?:os\.environ\.get|os\.getenv)\(\s*["']((?:SPECSTRIDE|RALPH|WIGGUM|OPENAI|ANTHROPIC|DSH)_[A-Z0-9_]+)["']\s*,\s*([^)]*?)\s*\)/g;

/** Directories of the baseline that hold no product source. */
const SKIP = ["lib/fixtures", "wiki", "docs", ".git", "telemetry"];

function sourceFiles(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      const rel = relative(root, full);
      if (SKIP.some((s) => rel === s || rel.startsWith(`${s}/`))) continue;
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      const isScript = /\.(sh|py)$/.test(entry.name) || ["specstride", "wiggum"].includes(entry.name);
      if (!isScript) continue;
      if (/^(test_|conftest)/.test(entry.name)) continue;
      out.push(full);
    }
  };
  walk(root);
  return out.sort();
}

/** Strip the quoting a Python or shell default is written with. */
export function normalizeValue(raw: string): string {
  const t = raw.trim();
  if (/^".*"$/.test(t) || /^'.*'$/.test(t)) return t.slice(1, -1);
  return t;
}

/**
 * Every built-in default of the baseline checkout. Where two sources default
 * the same variable, `orchestrator.sh` wins; otherwise the first file in
 * lexical order wins, and every source is kept in `alternatives`.
 */
export function extract(root: string): {
  defaults: BaselineDefault[];
  alternatives: Map<string, BaselineDefault[]>;
} {
  const all = new Map<string, BaselineDefault[]>();
  for (const file of sourceFiles(root)) {
    const rel = relative(root, file);
    const lines = readFileSync(file, "utf8").split("\n");
    for (let i = 0; i < lines.length; i++) {
      for (const m of lines[i].matchAll(SHELL)) {
        all.set(m[1], [
          ...(all.get(m[1]) ?? []),
          { variable: m[1], value: normalizeValue(m[2]), source: `${rel}:${i + 1}` },
        ]);
      }
      for (const m of lines[i].matchAll(PYTHON)) {
        all.set(m[1], [
          ...(all.get(m[1]) ?? []),
          { variable: m[1], value: normalizeValue(m[2]), source: `${rel}:${i + 1}` },
        ]);
      }
    }
  }
  const defaults: BaselineDefault[] = [];
  for (const [variable, rows] of [...all].sort(([a], [b]) => a.localeCompare(b))) {
    const orchestrator = rows.find((r) => r.source.startsWith("orchestrator.sh:"));
    defaults.push(orchestrator ?? rows[0]);
    void variable;
  }
  return { defaults, alternatives: all };
}

if (process.argv[1] && process.argv[1].endsWith("baseline-defaults-extract.ts")) {
  const root = process.argv[2];
  if (!root) {
    process.stderr.write("usage: baseline-defaults-extract.ts <baseline checkout at 9cab15d>\n");
    process.exit(2);
  }
  statSync(root);
  const { defaults } = extract(root);
  process.stdout.write("as_is_variable\tbaseline_default\tsource\n");
  for (const d of defaults) process.stdout.write(`${d.variable}\t${d.value}\t${d.source}\n`);
}
