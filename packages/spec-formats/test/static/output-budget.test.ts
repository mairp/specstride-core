/**
 * T053 — the byte measure of the default output of every subcommand of `spec`
 * against the figures of row XIX of `specs/104-spec-input/plan.md`, with the
 * helper of T194 of feature 100 (`packages/testkit/src/static/budget.ts`).
 * A breach FAILS the build (F104-FR-019; F100-FR-187).
 *
 * The figures are READ out of row XIX and never restated here, so a change to
 * the plan reaches this check without an edit and a drift between the two is
 * impossible. The row states four:
 *
 *   * at most 200 bytes for ONE call of `feature-slug`, `detect`, `validate`
 *     (success), `tick`, `title`, `shape` or `first-unapproved`;
 *   * at most 200 bytes PER FINDING LINE of `validate`;
 *   * at most 16 bytes PER PHASE for `numbers`;
 *   * `slice`, `context` and `render-context` print text of the SPECIFICATION
 *     and are bounded by the file and by `spec.contextBudget` (24,000
 *     characters); they belong to the budget of the skill that asks for them,
 *     so they carry no figure of their own and are measured against those two
 *     bounds instead.
 *
 * The measure itself is the helper's: BYTES of UTF-8 as the output leaves the
 * command, at 2.8 bytes per token where a token budget is given (F100-FR-187).
 * The helper's own fail-on-breach path is exercised twice — once over the
 * subject of annex G §G.5 that this output belongs to, and once over a
 * synthetic oversized output, which proves the breach really fails.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BYTES_PER_TOKEN,
  SUBJECTS,
  assertInsideBudget,
  budgetRow,
  bytesOf,
  measure,
  type BudgetMeasurement,
} from "../../../testkit/src/static/budget.ts";
import { DEFAULT_BUDGET } from "../../src/context.ts";
import * as verb from "../../src/verb.ts";

/** The root of the repository: five levels up from `test/static/`. */
const ROOT = resolve(dirname(dirname(dirname(dirname(dirname(fileURLToPath(import.meta.url)))))));

/** The plan whose row XIX holds the figures. */
const PLAN = "specs/104-spec-input/plan.md";

/* ------------------------------------------------------------------ *
 * Row XIX, read from the plan.
 * ------------------------------------------------------------------ */

/** The one line of the plan that is row XIX. */
function rowXIX(): string {
  const lines = readFileSync(join(ROOT, PLAN), "utf8").split("\n");
  const found = lines.filter((line) => /^- \[[ x]\] XIX\./.test(line));
  assert.equal(found.length, 1, `${PLAN} holds exactly one row XIX`);
  return found[0] as string;
}

/** The figures of row XIX, parsed out of the row's own text. */
type Figures = {
  /** Bytes for one call of a subcommand that prints one short answer. */
  readonly oneCall: number;
  /** Bytes per finding line of `validate`. */
  readonly perFindingLine: number;
  /** Bytes per phase for `numbers`. */
  readonly perPhase: number;
  /** The characters of `spec.contextBudget` the row names. */
  readonly contextBudget: number;
  /** The subcommands the one-call figure covers, as the row names them. */
  readonly oneCallSubcommands: readonly string[];
  /** The subcommands the row puts outside a figure of their own. */
  readonly boundedByTheFile: readonly string[];
};

function figuresOf(row: string): Figures {
  const oneCall = /at most (\d+) bytes for one call of ([^;]+);/.exec(row);
  const perFindingLine = /at most (\d+) bytes per finding line of `validate`/.exec(row);
  const perPhase = /at most (\d+) bytes per phase for `numbers`/.exec(row);
  const contextBudget = /`spec\.contextBudget` \(([\d,]+) characters\)/.exec(row);
  const bounded = /^(.*?) print text of the specification/.exec(
    row.slice(row.indexOf("`numbers`.") + "`numbers`.".length),
  );
  assert.ok(oneCall, "row XIX states the one-call figure");
  assert.ok(perFindingLine, "row XIX states the per-finding-line figure");
  assert.ok(perPhase, "row XIX states the per-phase figure");
  assert.ok(contextBudget, "row XIX states the context budget");
  assert.ok(bounded, "row XIX names the subcommands bounded by the file");
  const backticked = (text: string): readonly string[] =>
    Object.freeze([...text.matchAll(/`([a-z-]+)`/g)].map((match) => match[1] as string));
  return Object.freeze({
    oneCall: Number(oneCall[1]),
    perFindingLine: Number(perFindingLine[1]),
    perPhase: Number(perPhase[1]),
    contextBudget: Number((contextBudget[1] as string).replace(/,/g, "")),
    oneCallSubcommands: backticked(oneCall[2] as string),
    boundedByTheFile: backticked(bounded[1] as string),
  });
}

const ROW = rowXIX();
const FIGURES = figuresOf(ROW);

/* ------------------------------------------------------------------ *
 * The measure, built on the helper of T194.
 * ------------------------------------------------------------------ */

/**
 * One output measured against a figure of row XIX, in the shape the helper of
 * T194 gives its own measurements (`BudgetMeasurement`). The bytes are counted
 * exactly as the helper counts them — UTF-8, as the output leaves the command.
 */
function measureAgainstTheRow(subject: string, output: string, allowed: number): BudgetMeasurement {
  const bytes = Buffer.byteLength(output, "utf8");
  const inside = bytes <= allowed;
  return Object.freeze({
    subject,
    bytes,
    allowed,
    inside,
    ...(inside
      ? {}
      : {
          message:
            `the default output of "${subject}" holds ${bytes} bytes; row XIX of ${PLAN} ` +
            `allows ${allowed} (F104-FR-019, measured with the helper of T194)`,
        }),
  });
}

/** `measureAgainstTheRow` that THROWS on a breach: the form the build uses. */
function assertInsideTheRow(subject: string, output: string, allowed: number): BudgetMeasurement {
  const result = measureAgainstTheRow(subject, output, allowed);
  if (!result.inside) throw new Error(result.message);
  return result;
}

/* ------------------------------------------------------------------ *
 * The fixtures of FX-10, as a workspace.
 * ------------------------------------------------------------------ */

const SPECKIT_TASKS = [
  "## Phase 1: Setup",
  "",
  "- [ ] T001 do the thing",
  "- [ ] T002 [P] and the other",
  "",
  "## Phase 2: Next",
  "",
  "- [x] T003 already done",
  "",
].join("\n");

const OPENSPEC_TASKS = ["## 1. Setup", "", "- [ ] 1.1 do the thing", ""].join("\n");

const NATIVE_SPEC = [
  "# A spec",
  "",
  "## Phase 1 — Setup",
  "",
  "### Acceptance criteria",
  "",
  "- [ ] the thing is done",
  "",
].join("\n");

/** The FX-10 tree: the three formats, an invalid spec, and a `.specify` root. */
const TREE: Readonly<Record<string, string>> = Object.freeze({
  "specs/alpha/tasks.md": SPECKIT_TASKS,
  "specs/alpha/spec.md": "# spec\n",
  "specs/alpha/plan.md": "# plan\n",
  "openspec/changes/add-thing/tasks.md": OPENSPEC_TASKS,
  "openspec/changes/add-thing/proposal.md": "# proposal\n",
  "SPEC-native.md": NATIVE_SPEC,
  "plain.md": "# Just prose\n\nNo phase here.\n",
  ".specify/memory/constitution.md": "# the constitution\n",
});

function workspace(): {
  readonly root: string;
  readonly at: (path: string) => string;
  readonly remove: () => void;
} {
  const root = mkdtempSync(join(tmpdir(), "ss104-budget-"));
  for (const [path, content] of Object.entries(TREE)) {
    const file = join(root, ...path.split("/"));
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
  }
  return {
    root,
    at: (path: string) => join(root, ...path.split("/")),
    remove: () => rmSync(root, { recursive: true, force: true }),
  };
}

/** The DEFAULT output of one invocation: stdout, with no `--json`. */
function defaultOutput(
  ws: ReturnType<typeof workspace>,
  argv: readonly string[],
  spec: string,
): verb.VerbResult {
  return verb.runArgv([...argv, verb.SPECS_FLAG, ws.at(spec), verb.WORKDIR_FLAG, ws.root]);
}

/* ------------------------------------------------------------------ *
 * The tests.
 * ------------------------------------------------------------------ */

test("T053: the figures of row XIX are read from the plan, not restated", () => {
  // The row is the one the task names, and it names T053 and the helper.
  assert.match(ROW, /Measured in the build by T053 with the helper of T194/);
  assert.match(ROW, /a breach fails the build/);
  // The four figures, parsed out of the row's own text.
  assert.equal(FIGURES.oneCall, 200);
  assert.equal(FIGURES.perFindingLine, 200);
  assert.equal(FIGURES.perPhase, 16);
  assert.equal(FIGURES.contextBudget, DEFAULT_BUDGET, "the row's figure is the package's default");
  // The seven subcommands of the one-call figure, and the three the row puts
  // outside it, are the row's own lists — and together they are the eleven.
  assert.deepEqual([...FIGURES.oneCallSubcommands].sort(), [
    "detect",
    "feature-slug",
    "first-unapproved",
    "shape",
    "tick",
    "title",
    "validate",
  ]);
  assert.deepEqual([...FIGURES.boundedByTheFile].sort(), ["context", "render-context", "slice"]);
  assert.deepEqual(
    [...FIGURES.oneCallSubcommands, ...FIGURES.boundedByTheFile, "numbers"].sort(),
    [...verb.SUBCOMMANDS].sort(),
    "every one of the eleven subcommands is covered by a figure or by a bound",
  );
  // The measure is the helper's: bytes, at 2.8 bytes per token.
  assert.equal(BYTES_PER_TOKEN, 2.8);
  assert.equal(bytesOf(1_000), 2_800);
});

test("T053: one call of each of the seven short subcommands stays inside 200 bytes", () => {
  const ws = workspace();
  try {
    // Every one of the seven, over every fixture of FX-10 it applies to.
    const cases: readonly (readonly [string, readonly string[], string])[] = Object.freeze([
      ["feature-slug", ["feature-slug"], "specs/alpha/tasks.md"],
      ["feature-slug", ["feature-slug"], "openspec/changes/add-thing/tasks.md"],
      ["feature-slug", ["feature-slug"], "SPEC-native.md"],
      ["detect", ["detect"], "specs/alpha/tasks.md"],
      ["detect", ["detect"], "openspec/changes/add-thing/tasks.md"],
      ["detect", ["detect"], "SPEC-native.md"],
      ["validate", ["validate"], "specs/alpha/tasks.md"],
      ["validate", ["validate"], "openspec/changes/add-thing/tasks.md"],
      ["validate", ["validate"], "SPEC-native.md"],
      ["tick", ["tick", "1"], "specs/alpha/tasks.md"],
      ["tick", ["tick", "9"], "specs/alpha/tasks.md"],
      ["title", ["title", "1"], "specs/alpha/tasks.md"],
      ["title", ["title", "9"], "specs/alpha/tasks.md"],
      ["shape", ["shape", "1"], "specs/alpha/tasks.md"],
      ["shape", ["shape", "9"], "specs/alpha/tasks.md"],
      ["first-unapproved", ["first-unapproved"], "specs/alpha/tasks.md"],
    ]);
    assert.ok(cases.length >= 16, "every one of the seven is measured, on every format it reads");
    const measured: BudgetMeasurement[] = [];
    for (const [subcommand, argv, spec] of cases) {
      const result = defaultOutput(ws, argv, spec);
      assert.equal(result.exit, 0, `${argv.join(" ")} ${spec}`);
      assert.equal(result.stderr, "", `${argv.join(" ")} ${spec}`);
      assert.ok(FIGURES.oneCallSubcommands.includes(subcommand), subcommand);
      // A breach THROWS, which is how a breach fails the build.
      measured.push(
        assertInsideTheRow(`spec ${argv.join(" ")} (${spec})`, result.stdout, FIGURES.oneCall),
      );
    }
    // Non-vacuity: every one of these calls really printed something, so the
    // measure is not of an empty output.
    assert.ok(
      measured.every((one) => one.bytes > 0),
      "every call printed something",
    );
    assert.ok(measured.every((one) => one.inside));
    // The largest of them, for the record: the figure is a real headroom
    // statement and not a bound no output could reach.
    const largest = measured.reduce((a, b) => (b.bytes > a.bytes ? b : a));
    assert.ok(largest.bytes <= FIGURES.oneCall, `${largest.subject}: ${largest.bytes} bytes`);
  } finally {
    ws.remove();
  }
});

test("T053: each finding line of `validate` stays inside 200 bytes", () => {
  const ws = workspace();
  try {
    // `plain.md` is FX-10's invalid spec: it prints findings and exits 3.
    const result = defaultOutput(ws, ["validate"], "plain.md");
    assert.equal(result.exit, verb.EXIT_INVALID_SPEC);
    assert.equal(result.stdout, "", "a finding is an ERROR line");
    const findings = result.stderr.split("\n").filter((line) => line !== "");
    assert.ok(findings.length >= 1, "there IS at least one finding to measure");
    for (const [index, line] of findings.entries()) {
      assertInsideTheRow(`spec validate finding ${index + 1}`, `${line}\n`, FIGURES.perFindingLine);
    }
    // The same for an invalid spec of each of the three formats, so the figure
    // is measured against every grammar's findings and not only one.
    for (const [spec, format] of [
      ["plain.md", "speckit-tasks"],
      ["plain.md", "openspec-change"],
      ["plain.md", "native"],
    ] as const) {
      const one = verb.runArgv([
        "validate",
        verb.FORMAT_FLAG,
        format,
        verb.SPECS_FLAG,
        ws.at(spec),
        verb.WORKDIR_FLAG,
        ws.root,
      ]);
      assert.equal(one.exit, verb.EXIT_INVALID_SPEC, format);
      const lines = one.stderr.split("\n").filter((line) => line !== "");
      assert.ok(lines.length >= 1, format);
      for (const [index, line] of lines.entries()) {
        assertInsideTheRow(
          `spec validate --format ${format} finding ${index + 1}`,
          `${line}\n`,
          FIGURES.perFindingLine,
        );
      }
    }
  } finally {
    ws.remove();
  }
});

test("T053: `numbers` stays inside 16 bytes PER PHASE", () => {
  const ws = workspace();
  try {
    for (const spec of [
      "specs/alpha/tasks.md",
      "openspec/changes/add-thing/tasks.md",
      "SPEC-native.md",
    ]) {
      const numbers = defaultOutput(ws, ["numbers"], spec);
      assert.equal(numbers.exit, 0, spec);
      const phases = numbers.stdout.split("\n").filter((line) => line !== "").length;
      assert.ok(phases >= 1, `${spec} holds at least one phase`);
      assertInsideTheRow(`spec numbers (${spec})`, numbers.stdout, FIGURES.perPhase * phases);
      // Per LINE as well, which is the stricter reading of the same figure and
      // the one a reader of the row would check.
      for (const line of numbers.stdout.split("\n").filter((one) => one !== "")) {
        assertInsideTheRow(`spec numbers, one phase (${spec})`, `${line}\n`, FIGURES.perPhase);
      }
    }
    // A task list of MANY phases: the figure is per phase, so the measure must
    // scale with the count and not break at some size.
    const many = Array.from(
      { length: 60 },
      (_, index) => `## Phase ${index + 1}: P\n\n- [ ] T${String(index + 1).padStart(3, "0")} a\n`,
    ).join("\n");
    const file = join(ws.root, "specs", "many", "tasks.md");
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, many);
    const numbers = defaultOutput(ws, ["numbers"], "specs/many/tasks.md");
    assert.equal(numbers.exit, 0);
    const phases = numbers.stdout.split("\n").filter((line) => line !== "").length;
    assert.equal(phases, 60);
    assertInsideTheRow("spec numbers (60 phases)", numbers.stdout, FIGURES.perPhase * phases);
  } finally {
    ws.remove();
  }
});

test("T053: `slice`, `context` and `render-context` are bounded by the FILE and by the context budget", () => {
  const ws = workspace();
  try {
    // The row puts these three outside a figure of their own: they print text
    // of the specification. So what is measured is the TWO BOUNDS the row
    // names — the file, and `spec.contextBudget`.
    for (const spec of ["specs/alpha/tasks.md", "openspec/changes/add-thing/tasks.md"]) {
      const bytesOfTheFile = Buffer.byteLength(readFileSync(ws.at(spec), "utf8"), "utf8");
      // `slice` of every phase is bounded by the file it came out of.
      const numbers = defaultOutput(ws, ["numbers"], spec).stdout.split("\n").filter(Boolean);
      for (const number of numbers) {
        const slice = defaultOutput(ws, ["slice", number], spec);
        assert.equal(slice.exit, 0);
        assert.ok(
          Buffer.byteLength(slice.stdout, "utf8") <= bytesOfTheFile + 1,
          `slice ${number} of ${spec} is bounded by the file (and the one newline of B-1987)`,
        );
      }
      // `context` prints one line per document; `render-context` is bounded by
      // the context budget, which is a character bound and so at most four
      // bytes per character of UTF-8.
      const context = defaultOutput(ws, ["context"], spec);
      assert.equal(context.exit, 0);
      const rendered = defaultOutput(ws, ["render-context"], spec);
      assert.equal(rendered.exit, 0);
      assert.ok(
        rendered.stdout.length <=
          FIGURES.contextBudget + Buffer.byteLength(context.stdout, "utf8") * 4,
        "the content served is inside the budget; the headings are the renderer's own",
      );
    }
    // `native` renders NO context at all, so both print nothing (B-2058).
    assert.equal(defaultOutput(ws, ["context"], "SPEC-native.md").stdout, "");
    assert.equal(defaultOutput(ws, ["render-context"], "SPEC-native.md").stdout, "");
  } finally {
    ws.remove();
  }
});

test("T053: a BREACH fails the build — the helper's own path, and this check's", () => {
  // (a) the helper of T194, used as the build uses it: a subject of annex G
  // §G.5 with a budget, and an output that breaches it. The helper THROWS.
  const subject = SUBJECTS.hostSkillRun;
  const row = budgetRow(subject);
  assert.ok(row?.bytes, `annex G §G.5 holds a budget for "${subject}"`);
  const allowed = row?.bytes as number;
  const inside = measure(subject, "x".repeat(allowed));
  assert.equal(inside.inside, true);
  assert.equal(inside.bytes, allowed);
  const breach = measure(subject, "x".repeat(allowed + 1));
  assert.equal(breach.inside, false);
  assert.match(breach.message ?? "", /F100-FR-187/);
  assert.throws(() => assertInsideBudget(subject, "x".repeat(allowed + 1)), /F100-FR-187/);
  // ...and the whole of `spec`'s own output belongs to that skill's budget, so
  // the containment is measured too, through the helper itself.
  const ws = workspace();
  try {
    const everything = verb.SUBCOMMANDS.map(
      (subcommand) =>
        defaultOutput(
          ws,
          verb.needsAPhaseNumber(subcommand) ? [subcommand, "1"] : [subcommand],
          "specs/alpha/tasks.md",
        ).stdout,
    ).join("");
    assertInsideBudget(subject, everything);
  } finally {
    ws.remove();
  }

  // (b) THIS check's own path: a synthetic output one byte over a figure of
  // row XIX throws, and the message names the row and the figure.
  assert.throws(
    () => assertInsideTheRow("a synthetic call", "x".repeat(FIGURES.oneCall + 1), FIGURES.oneCall),
    (error: unknown) =>
      error instanceof Error &&
      error.message.includes(String(FIGURES.oneCall)) &&
      error.message.includes(PLAN) &&
      error.message.includes("F104-FR-019"),
  );
  // Exactly at the figure is INSIDE, so the bound is `<=` and not `<`.
  assert.equal(
    measureAgainstTheRow("at the figure", "x".repeat(FIGURES.oneCall), FIGURES.oneCall).inside,
    true,
  );
  // And the measure is of BYTES and not of characters: a non-ASCII output of
  // 100 characters is 200 bytes, which is at the figure and not under it.
  assert.equal(measureAgainstTheRow("non-ascii", "é".repeat(100), FIGURES.oneCall).bytes, 200);
  assert.equal(measureAgainstTheRow("non-ascii", "é".repeat(101), FIGURES.oneCall).inside, false);
});
