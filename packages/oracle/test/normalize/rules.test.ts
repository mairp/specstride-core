/**
 * CT-141-120 — the normalizer (T032, T052 to T057; F141-FR-020).
 *
 * What the test proves.
 *
 * - **one test per rule N-01 to N-29**: there is a named test for every one of the
 *   twenty-nine rules, each on RECORDED INPUT OF THE REFERENCE — the event lines,
 *   the standard output, the file names and the state of a real run of the
 *   Specstride and mixture-of-loops baselines at their pinned commits, written into
 *   this file as data;
 * - **the two rules that act on the capture of the port alone**: N-12 and N-29 are
 *   driven on input in the PORT's form that this test holds, and are shown to count
 *   nothing on the reference side;
 * - **counts per rule as F141-FR-020 defines them**: `replaced`, `left out` and
 *   `applied to`, each rule with the kind the requirement gives it;
 * - **a rule that replaces nothing fails the suite**: the report of a suite names
 *   the rule whose total is zero and the suite fails;
 * - **no table of its own**: every table the normalizer uses is read from feature
 *   100 (`@specstride/contracts`) or from `packages/oracle/reference/`, and the set
 *   of rules is exactly the set of `normalization.json` of feature 100, in its
 *   order, checked in both directions.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { RULES, assertTheRulesAreThoseOfFeature100, normalize } from "../../src/normalize/index.ts";
import {
  COUNT_KINDS,
  NormalizationError,
  RULES_THAT_COMPARE_AS_WRITTEN,
  RULES_THAT_LEAVE_OUT,
  countKindOf,
  ruleIds,
  rulesOfFeature100,
  type MutableCapture,
  type NormalizeContext,
  type Rule,
} from "../../src/normalize/types.ts";
import {
  assertEveryRuleEarnedItsPlace,
  reportAsText,
  suiteReport,
} from "../../src/normalize/report.ts";
import { N01, realRoot, replaceRoots, rootsLongestFirst } from "../../src/normalize/paths.ts";
import { logicalNamesByPath } from "../../src/normalize/state-layout.ts";
import { RUN_ID_PATTERNS } from "../../src/normalize/run-id.ts";
import { TIME_PLACEHOLDER, timeValuesOf } from "../../src/normalize/timestamps.ts";
import {
  DURATION_PLACEHOLDER,
  withoutTheKilledPassElapsed,
} from "../../src/normalize/durations.ts";
import { boundNoncesOf, noncesOf } from "../../src/normalize/nonce.ts";
import { TEMPORARY_NAME_PLACEHOLDER } from "../../src/normalize/temporary-names.ts";
import { sha256 } from "../../src/normalize/hashes.ts";
import { PRIMARY_MARKER, WRITER_CLASSES, writerClassOf } from "../../src/normalize/events.ts";
import {
  componentOfGeneratingTool,
  GENERATED_BY_FIELDS,
  OLD_LANGUAGE_LITERALS,
  OUTPUT_LABELS,
  componentFiles,
  componentTable,
  lineClassOf,
} from "../../src/normalize/text.ts";
import {
  COUNTER_FILE_PATTERN,
  LANGUAGE_CACHE_PATTERN,
  LEGACY_MARKERS,
  REVERSE_INVENTORY_SCHEMA_FIELD,
  REVERSE_INVENTORY_SCHEMA_ID,
  RULES_ON_THE_PORT_ALONE,
} from "../../src/normalize/rest.ts";
import {
  RULE_COUNT,
  A_RULE_THAT_REPLACES_NOTHING_FAILS_THE_SUITE,
  FIRST_RULE,
  LAST_RULE,
  rules as rulesOfTheProfile,
} from "@specstride/contracts/profile/normalization";

// ---------------------------------------------------------------------------
// Recorded input of the reference
//
// Every value below was recorded from a run of a reference tree at its pinned
// commit, driven by the oracle's own driver on the stubs: the Specstride baseline
// at 9cab15d on FX-01 `three-phases`, and the mixture-of-loops baseline at
// 9c88f86 on FX-32 `greeting-ready`. Paths, run ids, times, nonces and file names
// are as the reference wrote them.
// ---------------------------------------------------------------------------

/** The roots of the recorded run. */
const WORK = "/tmp/oracle-run-D8067A/work";
const RUN = "/tmp/oracle-run-D8067A";
const IMPL = "/tmp/oracle-scratch-eHls2F/ref/specstride";

/** The first event line the Specstride reference wrote, as it wrote it. */
const RECORDED_RUN_START =
  '{"ts":"1790890335.544232833","time":"2026-10-01T21:32:15+00:00","event":"run_start",' +
  '"run_id":"20261001-213215-130508","task":"work","backend":"prop:dsh/crit:claude",' +
  '"feature":"three-phases","workdir":"/tmp/oracle-run-D8067A/work","phases":"3"}';

/** The verdict line of the first critic call, as the reference printed it. */
const RECORDED_VERDICT = "    VERDICT 02653c9feabeaf1b: APPROVED";

/** The name of a verdict file of the reference: a compact stamp, and no process id. */
const RECORDED_VERDICT_FILE =
  ".specstride/features/three-phases/verdicts/phase1.attempt1.20261001-214754.txt";

/**
 * The as-is file of the pipeline runtime of the mixture-of-loops baseline, read from
 * the component-name table rather than written out here: F100-FR-026 reserves that
 * name to `packages/contracts/data/layout-old-side.json`.
 */
const AS_IS_PIPELINE_RUNTIME = (
  componentFiles().find((row) => row.asIs === "The pipeline runtime of mixture-of-loops")?.files ??
  []
).find((file) => !file.includes("/")) as string;

const CONTEXT: NormalizeContext = {
  scenario: "FX-01/three-phases",
  side: "reference",
  roots: [
    { placeholder: "<WORK>", path: WORK },
    { placeholder: "<RUN>", path: RUN },
    { placeholder: "<IMPL>", path: IMPL },
  ],
  statePaths: {
    "<workspace-part>/features/<slug>/PROGRESS.md": `${WORK}/.specstride/features/three-phases/PROGRESS.md`,
  },
  durationsUnderTest: [],
  slug: "three-phases",
};

/** Apply ONE rule to a capture of surfaces and give back what it did. */
function one(
  id: string,
  surfaces: Record<string, unknown>,
  context: Partial<NormalizeContext> = {},
): {
  readonly count: number;
  readonly surfaces: Record<string, unknown>;
  readonly findings: readonly string[];
} {
  const rule = RULES.find((r) => r.id === id) as Rule;
  assert.ok(rule !== undefined, `${id} is a rule of the normalizer`);
  const capture: MutableCapture = {
    scenario: "FX-01/three-phases",
    side: context.side ?? "reference",
    surfaces: JSON.parse(JSON.stringify(surfaces)) as Record<string, unknown>,
    findings: [],
  };
  const count = rule.apply(capture, { ...CONTEXT, ...context });
  return { count, surfaces: capture.surfaces, findings: capture.findings };
}

/** The whole capture as one string, for an assertion about what survived. */
const asText = (surfaces: Record<string, unknown>): string => JSON.stringify(surfaces);

// ---------------------------------------------------------------------------
// The set of rules, and the tables
// ---------------------------------------------------------------------------

test("CT-141-120: the rules are exactly those of feature 100, in its order", () => {
  assert.equal(RULES.length, 29);
  assert.deepEqual(
    RULES.map((r) => r.id),
    [...ruleIds()],
  );
  assert.deepEqual(
    RULES.map((r) => r.id),
    rulesOfTheProfile.map((r) => r.id),
  );
  assert.equal(RULES.length, RULE_COUNT);
  assert.equal(RULES[0]?.id, FIRST_RULE);
  assert.equal(RULES[RULES.length - 1]?.id, LAST_RULE);
  // Feature 100 is where "a rule that replaces nothing fails the suite" is stated.
  assert.equal(A_RULE_THAT_REPLACES_NOTHING_FAILS_THE_SUITE, true);
  // Both directions: a rule here that feature 100 does not have, and a rule of
  // feature 100 with no rule here, each fail.
  assertTheRulesAreThoseOfFeature100();
  assert.throws(() => assertTheRulesAreThoseOfFeature100(RULES.slice(0, 28)), NormalizationError);
  assert.throws(
    () =>
      assertTheRulesAreThoseOfFeature100([
        ...RULES,
        { id: "N-30", subject: "invented here", surfaces: [], apply: () => 0 },
      ]),
    NormalizationError,
  );
  // Each rule's subject is the subject feature 100 gives it.
  for (const rule of rulesOfFeature100()) {
    assert.equal(
      RULES.find((r) => r.id === rule.id)?.subject,
      rule.subject,
      `${rule.id} has the subject of feature 100`,
    );
  }
});

test("CT-141-120: the normalizer holds no table of its own", () => {
  // The component table comes from `packages/oracle/reference/component-files.json`,
  // which is a reading of the two baselines, and every row of it is used.
  assert.ok(componentFiles().length > 0);
  // Every file of every row of that reading is in the table the rules use, and the
  // table adds nothing of its own.
  const named = componentFiles().flatMap((row) => row.files);
  for (const file of named) {
    assert.ok(
      componentTable().some((r) => r.asIs === file || r.asIs.endsWith(`/${file}`)),
      `${file} of the reading is in the component table`,
    );
  }
  for (const row of componentTable()) {
    assert.ok(
      named.some((file) => row.asIs === file || row.asIs.endsWith(`/${file}`)),
      `${row.asIs} of the table comes from the reading`,
    );
  }
  // The rules themselves, the count kinds and the two lists of F141-FR-020 are
  // data, not literals of a module: the ids come from feature 100.
  assert.deepEqual([...COUNT_KINDS], ["replaced", "left out", "applied to"]);
  for (const id of [...RULES_THAT_LEAVE_OUT, ...RULES_THAT_COMPARE_AS_WRITTEN]) {
    assert.ok(ruleIds().includes(id), `${id} is a rule of feature 100`);
  }
});

test("CT-141-120: the count of every rule is of the kind F141-FR-020 gives it", () => {
  for (const id of ruleIds()) {
    const kind = countKindOf(id);
    assert.ok(COUNT_KINDS.includes(kind));
    if (RULES_THAT_LEAVE_OUT.includes(id)) assert.equal(kind, "left out");
    else if (RULES_THAT_COMPARE_AS_WRITTEN.includes(id)) assert.equal(kind, "applied to");
    else assert.equal(kind, "replaced");
  }
  assert.deepEqual([...RULES_THAT_LEAVE_OUT], ["N-25", "N-28"]);
  assert.equal(countKindOf("N-25"), "left out");
  assert.equal(countKindOf("N-09"), "applied to");
  assert.equal(countKindOf("N-01"), "replaced");
});

// ---------------------------------------------------------------------------
// One test per rule
// ---------------------------------------------------------------------------

test("CT-141-120 / N-01: absolute paths become the placeholders of the roots", () => {
  const result = one("N-01", { events: { raw: RECORDED_RUN_START } });
  assert.ok(result.count >= 1);
  assert.ok(!asText(result.surfaces).includes(WORK));
  assert.ok(asText(result.surfaces).includes("<WORK>"));
  // The longest root first, so the run root never swallows the working directory.
  assert.deepEqual(
    rootsLongestFirst([
      { placeholder: "<RUN>", path: RUN },
      { placeholder: "<WORK>", path: WORK },
    ]).map((r) => r.placeholder),
    ["<WORK>", "<RUN>"],
  );
  assert.equal(replaceRoots(`${WORK}/one.txt`, CONTEXT.roots), "<WORK>/one.txt");
  assert.equal(realRoot("/"), "/");
  // A capture with no root to replace counts nothing, and N-01 is still a rule.
  assert.equal(one("N-01", { exit: { exitCode: 0 } }).count, 0);
  assert.equal(N01.id, "N-01");
});

test("CT-141-120 / N-02: a physical path of a file of state becomes its logical name", () => {
  const recorded = `proposer.sh: wrote ${CONTEXT.statePaths["<workspace-part>/features/<slug>/PROGRESS.md"] as string}`;
  const result = one("N-02", { stdout: { text: recorded } });
  assert.equal(result.count, 1);
  assert.match(
    (result.surfaces["stdout"] as { text: string }).text,
    /<state:<workspace-part>\/features\/<slug>\/PROGRESS\.md>/,
  );
  // Longest path first, so a directory never swallows a file inside it.
  assert.deepEqual(
    logicalNamesByPath({ "<a>": "/x", "<b>": "/x/y" }).map((r) => r.logicalName),
    ["<b>", "<a>"],
  );
  // A side with no file of state counts nothing.
  assert.equal(one("N-02", { stdout: { text: recorded } }, { statePaths: {} }).count, 0);
});

test("CT-141-120 / N-03: the as-is run id becomes a numbered placeholder", () => {
  const result = one("N-03", {
    events: { raw: RECORDED_RUN_START },
    tree: { entries: [{ path: "runs/20261001-213215-130508/run.log" }] },
  });
  assert.ok(result.count >= 2);
  const text = asText(result.surfaces);
  assert.ok(!text.includes("20261001-213215-130508"));
  // Numbered, and the SAME id is the same number everywhere.
  assert.equal(text.match(/<run-id-1>/g)?.length, 2);
  // The two forms the baselines write.
  assert.ok((RUN_ID_PATTERNS[0] as RegExp).test("20261001-213215-130508"));
  assert.ok((RUN_ID_PATTERNS[1] as RegExp).test("run-0a1b2c3d"));
  // Numbered by FIRST APPEARANCE, so which run id is the first is still compared.
  const two = one("N-03", {
    stdout: { text: "first 20261001-213215-130508 then 20261002-090000-222222" },
  });
  assert.match((two.surfaces["stdout"] as { text: string }).text, /<run-id-1>.*<run-id-2>/);
  // The invocation id the pass loop makes for itself when the front door hands it
  // no base: `inv-<iteration:06d>-<secrets.token_hex(4)>` (`proposer.sh:1650`).
  // Nondeterministic on every call, so the rule has to reach it — and the
  // iteration of the path it stands in is still compared.
  const invocation = one("N-03", {
    tree: {
      entries: [
        { path: "debug/invocations/r/proposer/phase-1/attempt-1/iter-2/inv-000002-82878524" },
      ],
    },
  });
  const invocationText = asText(invocation.surfaces);
  assert.ok(!invocationText.includes("82878524"));
  assert.ok(invocationText.includes("iter-2/<run-id-1>"));
  assert.ok((RUN_ID_PATTERNS[3] as RegExp).test("inv-000001-a9dc6a91"));
  // A value that is no invocation id of that form is left alone.
  assert.equal(one("N-03", { stdout: { text: "inv-1-abcd" } }).count, 0);
});

test("CT-141-120 / N-04: every time becomes a placeholder, and the order is asserted first", () => {
  const result = one("N-04", {
    events: { raw: RECORDED_RUN_START },
    tree: { entries: [{ path: RECORDED_VERDICT_FILE }] },
  });
  assert.ok(result.count >= 2);
  const text = asText(result.surfaces);
  // The epoch stamp WITH its fraction, the ISO time, and the compact stamp of a
  // file name are all one placeholder each.
  assert.ok(!text.includes("1790890335.544232833"));
  assert.ok(!text.includes("544232833"));
  assert.ok(!text.includes("2026-10-01T21:32:15+00:00"));
  assert.ok(!text.includes("20261001-214754"));
  assert.ok(text.includes(TIME_PLACEHOLDER));
  // The order is an ASSERTION and is made before the replacement: the values are
  // still readable here.
  assert.deepEqual(
    [...timeValuesOf({ a: "2026-10-01T10:00:00+00:00", b: "2026-10-01T10:00:01+00:00" })],
    ["2026-10-01T10:00:00+00:00", "2026-10-01T10:00:01+00:00"],
  );
  // The file stamp of an archived dsh plugin request and of its receipt,
  // `started.strftime("%Y%m%dT%H%M%S.%fZ")` (`lib/dsh_plugin_requests.py:108`).
  const archived = one("N-04", {
    tree: {
      entries: [
        { path: "plugin-requests/archive/20261002T110740.402031Z.request.json" },
        { path: "plugin-requests/archive/20261002T110740.402031Z.receipt.json" },
      ],
    },
  });
  const archivedText = asText(archived.surfaces);
  assert.ok(!archivedText.includes("20261002T110740"));
  assert.ok(!archivedText.includes("402031"));
  assert.ok(archivedText.includes(`${TIME_PLACEHOLDER}.receipt.json`));
});

test("CT-141-120 / N-05: a duration becomes a placeholder unless the fixture tests it", () => {
  const recorded = "      pass ceiling: 1800s (global); yield poll: 1s (override)";
  const result = one("N-05", { stdout: { text: recorded } });
  assert.ok(result.count >= 1);
  assert.ok(!(result.surfaces["stdout"] as { text: string }).text.includes("1800s"));
  assert.ok((result.surfaces["stdout"] as { text: string }).text.includes(DURATION_PLACEHOLDER));
  // The value the fixture declares as the behaviour under test stays.
  const underTest = one("N-05", { stdout: { text: recorded } }, { durationsUnderTest: ["1800s"] });
  assert.ok((underTest.surfaces["stdout"] as { text: string }).text.includes("1800s"));
  assert.ok(!(underTest.surfaces["stdout"] as { text: string }).text.includes("1s (override)"));
  // The same four names as a KEY of a JSON object. The producer contract of the
  // structured path of the pass loop is a file of state that carries
  // `"duration_ms": 1074`, and the number differs run to run: a capture of a
  // fixture whose proposer takes the structured path is not reproducible until the
  // rule reaches it (F141-FR-020, "every duration").
  const contract = one("N-05", {
    state: {
      files: [
        {
          logicalName: "run:<runId>:procs",
          content:
            '{\n  "contract": "specstride-producer/v1",\n  "duration_ms": 1074,\n  "elapsed": 2\n}\n',
        },
      ],
    },
  });
  const asJson = JSON.stringify(contract.surfaces["state"]);
  assert.ok(!asJson.includes("1074"), asJson);
  assert.ok(!/"elapsed":\s*2/.test(asJson), asJson);
  assert.ok(asJson.includes(DURATION_PLACEHOLDER));
  assert.ok(contract.count >= 1);
  // A measured span whose name holds neither `duration` nor `elapsed`: the pass loop
  // writes how long a yield WAITED as `waited_sec`, in the raw line of an event and in
  // the copy of that line the surface `tree` carries. The CONFIGURED span beside it
  // (`deadline_sec`) is the subject of the scenario and stays.
  const waited = one("N-05", {
    tree: {
      entries: [
        {
          path: "a/events.jsonl",
          content: '{"event":"yield_timeout","waited_sec":"3","deadline_sec":"3"}\n',
        },
      ],
    },
  });
  const waitedText = JSON.stringify(waited.surfaces["tree"]);
  assert.match(waitedText, /waited_sec\\":\\"<duration>/);
  assert.match(waitedText, /deadline_sec\\":\\"3/);
  // The sidecar of a watchdog kill is `reason|elapsed|detail` and no key names the
  // second field: the NAME of the file is what says it is a span (`proposer.sh:991`).
  const sidecar = one("N-05", {
    tree: {
      entries: [
        { path: ".specstride/.last-watchdog-kill", content: "hard_cap|4|\n" },
        { path: ".specstride/.last-watchdog-kill.path", content: "<WORK>/a/checkpoint.md\n" },
      ],
    },
  });
  const entries = (sidecar.surfaces["tree"] as { entries: { path: string; content: string }[] })
    .entries;
  assert.equal(entries[0]?.content, `hard_cap|${DURATION_PLACEHOLDER}|\n`);
  // The `.path` beside it is not the sidecar and keeps its content.
  assert.equal(entries[1]?.content, "<WORK>/a/checkpoint.md\n");
  // A reason with no elapsed field at all is left exactly as it is.
  assert.equal(withoutTheKilledPassElapsed("hard_cap|\n"), "hard_cap|\n");
  assert.equal(withoutTheKilledPassElapsed("hard_cap|not-a-number|x"), "hard_cap|not-a-number|x");
});

test("CT-141-120 / N-06: the nonce of each critic call becomes a numbered placeholder", () => {
  const result = one("N-06", {
    stdout: { text: RECORDED_VERDICT },
    transcript: [{ role: "critic", call: 1, prompt: `VERDICT 02653c9feabeaf1b: APPROVED` }],
  });
  assert.ok(result.count >= 2);
  assert.ok(!asText(result.surfaces).includes("02653c9feabeaf1b"));
  assert.ok(asText(result.surfaces).includes("<nonce-1>"));
  // The assertion of the form and of uniqueness is made first, on these values.
  assert.deepEqual([...boundNoncesOf({ a: RECORDED_VERDICT })], ["02653c9feabeaf1b"]);
  assert.deepEqual([...noncesOf({ a: RECORDED_VERDICT })], ["02653c9feabeaf1b"]);
});

test("CT-141-120 / N-07: process ids, group ids and lock owners become placeholders", () => {
  const result = one("N-07", {
    stdout: { text: "lock_owner: 130508 and pid=130509 and process 130510" },
    processes: {
      count: 1,
      entries: [{ pid: 130511, processGroup: 130508, command: ["sleep", "1"] }],
    },
  });
  assert.ok(result.count >= 3);
  const text = asText(result.surfaces);
  for (const id of ["130508", "130509", "130510", "130511"]) assert.ok(!text.includes(id), id);
  // Numbered, so the lock owner that IS the process that took the lock reads as one
  // number on both sides.
  assert.equal(
    (result.surfaces["stdout"] as { text: string }).text,
    "lock_owner: <pid-1> and pid=<pid-2> and process <pid-3>",
  );
  assert.equal(
    (result.surfaces["processes"] as { entries: { processGroup: string }[] }).entries[0]
      ?.processGroup,
    "<pid-1>",
  );
  // The rule rebuilds the surface `processes` to number its ids, and it carries
  // every other field over: a rule replaces what it names and never DROPS a field
  // it does not touch, or it would delete a real difference along with it.
  const withMore = one("N-07", {
    processes: {
      count: 1,
      entries: [{ pid: 130511, processGroup: 130508, command: ["sleep", "1"] }],
      somethingOnlyOneSideHas: "one value the other side does not have",
    },
  });
  assert.equal(
    (withMore.surfaces["processes"] as Record<string, unknown>)["somethingOnlyOneSideHas"],
    "one value the other side does not have",
  );
  // A SESSION id is of the same class: `proposer.sh:1464-1513` at the pinned commit
  // reads `ps -o sid=` and writes the session of a yield job as the field `sid` of
  // `yield_job_start`, and a session id IS the process id of the session leader. Both
  // forms are reached — the text of a log line and the PAIR of a projected event,
  // whose value on its own carries nothing that names it.
  const withSession = one("N-07", {
    tree: { entries: [{ path: "a/yield.log", content: 'sid="2060092" job_sid=2060092\n' }] },
    events: {
      records: [
        {
          line: '{"event":"yield_job_start","sid":"2060092"}',
          pairs: [
            { key: "event", value: "yield_job_start", type: "string" },
            { key: "sid", value: "2060092", type: "string" },
          ],
        },
      ],
    },
  });
  const sessionText = asText(withSession.surfaces);
  assert.ok(!sessionText.includes("2060092"), "the session id is gone");
  assert.equal(
    (withSession.surfaces["events"] as { records: { pairs: { key: string; value: string }[] }[] })
      .records[0]?.pairs[1]?.value,
    "<pid-1>",
  );
  // A span id is NOT a process id and the rule leaves it: it is hex and its key ends
  // in `_id` (`lib/ralph_otel_spans.py`), not in `sid`.
  const withSpan = one("N-07", {
    stdout: { text: '{"span_id":"a1b2c3d4e5f60718"}' },
  });
  assert.ok(asText(withSpan.surfaces).includes("a1b2c3d4e5f60718"));
  // The fourth form: the sentence the supervisor of mixture-of-loops writes when the
  // operator asked it to stop a run (`supervisor_lib.py:695-696` at `9c88f86`). The
  // number is `record['pgid']`; no key names it and the word before it is neither
  // `pgid=` nor a signal name, so the three forms above cannot reach it. Every
  // scenario of FX-36 that stops a run left it in the capture and differed between two
  // runs of ONE side.
  const withGroup = one("N-07", {
    stdout: {
      text:
        '[MOL-STOP] pipeline=001-greeting sent=true detail="sent SIGTERM to process group 172480"\n' +
        "cannot signal process group 172480: [Errno 3] No such process\n",
    },
  });
  const groupText = asText(withGroup.surfaces);
  assert.ok(!groupText.includes("172480"), "the process group of the stop message is gone");
  // One process, one number: the two lines name the same group.
  assert.equal(groupText.split("<pid-1>").length - 1, 2);
});

test("CT-141-120 / N-08: a generated suffix and a temporary name become a placeholder", () => {
  const result = one("N-08", {
    tree: {
      entries: [
        { path: "tmp.54RqdSeA0b/launch-contract.json" },
        { path: "specstride-gate.ab12cd34.tmp" },
      ],
    },
  });
  assert.ok(result.count >= 2);
  const text = asText(result.surfaces);
  assert.ok(!text.includes("54RqdSeA0b"));
  assert.ok(text.includes(TEMPORARY_NAME_PLACEHOLDER));
});

test("CT-141-120 / N-08: the generated bundle name is replaced where it stands alone", () => {
  // `cmdline_markers` of the launch record of mixture-of-loops is
  // `[str(bundle.launcher), bundle.bundle.name]` (`supervisor_lib.py:620` at `9c88f86`):
  // the second marker is the BARE name of the content-addressed bundle directory, and
  // the directory is named by a digest of a contract that holds the absolute root of
  // the launch directory, so it differs in every run of one scenario.
  const digest = sha256("the launch contract of this run");
  const name = digest.slice(0, 20);
  const result = one("N-08", {
    pipeline: {
      records: [
        {
          name: "harness-run.json",
          content:
            `{"bundle": "<WORK>/.mixture-of-loops/generated/001-greeting/${name}",` +
            `"cmdline_markers": ["<WORK>/launch.sh", "${name}"],` +
            `"contract_digest": "${digest}"}`,
        },
      ],
    },
  });
  const text = asText(result.surfaces);
  assert.ok(!text.includes(`"${name}"`), "the bare bundle name is gone");
  assert.equal(text.split(TEMPORARY_NAME_PLACEHOLDER).length - 1, 2);
  // The DIGEST the name is a prefix of is left whole: it is the subject of N-09 to
  // N-11, and cutting its first twenty characters would hide it from them.
  assert.ok(text.includes(digest), "the contract digest is untouched");
});

test("CT-141-120 / N-08: a bare run of hexadecimal that is no bundle name stays", () => {
  // The replacement fires only where the SAME name was seen as a generated bundle
  // DIRECTORY in the same capture. Nothing here names one, so nothing is replaced.
  const result = one("N-08", {
    pipeline: {
      records: [
        { name: "harness-run.json", content: '{"cmdline_markers": ["0807cb237d0c6bbc3111"]}' },
      ],
    },
  });
  assert.ok(asText(result.surfaces).includes("0807cb237d0c6bbc3111"));
});

test("CT-141-120 / N-09: a hash over fixture content is compared as it is, and counted", () => {
  const recorded = sha256("the evidence of the phase, written by the proposer stub\n");
  const result = one("N-09", {
    state: { entries: [{ logicalName: "<a>", hashClass: "same", hash: recorded }] },
  });
  assert.ok(result.count >= 1);
  // Nothing was replaced: the value is still the hash of the fixture's content.
  assert.ok(asText(result.surfaces).includes(recorded));
  assert.equal(countKindOf("N-09"), "applied to");
});

test("CT-141-120 / N-10: a hash whose input holds an absolute path is recomputed and replaced", () => {
  const surfaces = {
    state: {
      entries: [
        { hashClass: "path", covers: "the workspace root", input: WORK, hash: sha256(WORK) },
      ],
    },
  };
  const result = one("N-10", surfaces);
  assert.equal(result.count, 1);
  assert.ok(!asText(result.surfaces).includes(sha256(WORK)));
  assert.ok(asText(result.surfaces).includes("<hash-path-1>"));
  // The input stays and is compared; N-01 has already turned it into a placeholder
  // by the time this rule runs in the normalizer.
  const whole = normalize({ scenario: "x", side: "reference", surfaces }, CONTEXT);
  assert.ok(asText(whole.surfaces as Record<string, unknown>).includes("<WORK>"));
});

test("CT-141-120 / N-11: a hash over bytes of the implementation becomes a placeholder", () => {
  const recorded = sha256("#!/usr/bin/env bash\n# proposer.sh of the baseline\n");
  const result = one("N-11", {
    state: {
      entries: [
        {
          hashClass: "implementation",
          covers: "proposer.sh",
          hash: recorded,
          content: "the bytes",
        },
      ],
    },
  });
  assert.equal(result.count, 1);
  const entry = (result.surfaces["state"] as { entries: Record<string, unknown>[] }).entries[0];
  assert.equal(entry?.["hash"], "<hash-impl-1>");
  // The content is NOT compared.
  assert.equal(entry?.["content"], undefined);
  assert.equal(entry?.["contentNotCompared"], true);
  // A bare hash that nothing says the class of is of this class too.
  const bare = one("N-11", { stdout: { text: `digest ${recorded}` } });
  assert.equal(bare.count, 1);
  assert.ok(!asText(bare.surfaces).includes(recorded));
});

test("CT-141-120 / N-12: the compatibility projection of the PORT is what is compared", () => {
  // Input in the port's form, which this test holds: the primary stream beside the
  // projection.
  const portEvents = {
    events: {
      files: ["events.jsonl", "events.primary.jsonl"],
      records: [
        {
          file: "events.jsonl",
          raw: '{"event":"run_start"}',
          pairs: [{ key: "event", value: "run_start" }],
        },
        {
          file: "events.primary.jsonl",
          raw: '{"event":"run.started","stream":"primary"}',
          pairs: [
            { key: "event", value: "run.started" },
            { key: "stream", value: PRIMARY_MARKER },
          ],
        },
      ],
    },
  };
  const onThePort = one("N-12", portEvents, { side: "port" });
  // The count is the records it was applied to: the projection it kept plus the
  // primary records it left out.
  assert.equal(onThePort.count, 2);
  const events = onThePort.surfaces["events"] as {
    files: string[];
    records: { file: string }[];
    comparedStream: string;
  };
  assert.deepEqual([...events.files], ["events.jsonl"]);
  assert.deepEqual(
    events.records.map((r) => r.file),
    ["events.jsonl"],
  );
  assert.equal(events.comparedStream, "compatibility projection");
  // On the REFERENCE the rule acts on nothing and counts nothing.
  assert.equal(one("N-12", portEvents, { side: "reference" }).count, 0);
  assert.deepEqual([...RULES_ON_THE_PORT_ALONE], ["N-12", "N-29"]);
});

test("CT-141-120 / N-13: a line is read as ordered pairs with the types kept", () => {
  const recorded = {
    events: {
      records: [
        {
          file: "events.jsonl",
          raw: RECORDED_RUN_START,
          pairs: [
            { key: "ts", value: "1790890335.544232833" },
            { key: "event", value: "run_start" },
            { key: "phases", value: "3" },
          ],
        },
      ],
    },
  };
  assert.equal(one("N-13", recorded).count, 1);
  // A capture that is NOT in that form fails the rule rather than comparing text
  // against text.
  assert.throws(
    () => one("N-13", { events: { records: [{ file: "events.jsonl", raw: RECORDED_RUN_START }] } }),
    /N-13: the capture of an event record is not in the form the rule compares/,
  );
});

test("CT-141-120 / N-14: order is compared inside each class of writer", () => {
  const recorded = {
    events: {
      records: [
        { file: "events.jsonl", raw: "a", pairs: [{ key: "event", value: "run_start" }] },
        { file: "proposer.jsonl", raw: "b", pairs: [{ key: "event", value: "pass_start" }] },
        { file: "events.jsonl", raw: "c", pairs: [{ key: "event", value: "run_stop" }] },
      ],
    },
  };
  const result = one("N-14", recorded);
  assert.equal(result.count, 3);
  const events = result.surfaces["events"] as {
    byWriterClass: Record<string, { raw: string }[]>;
    orderComparedInside: string;
  };
  assert.deepEqual(Object.keys(events.byWriterClass).sort(), ["orchestrator", "proposer"]);
  // The order INSIDE a class is kept; the interleaving between classes is gone.
  assert.deepEqual(
    events.byWriterClass["orchestrator"]?.map((r) => r.raw),
    ["a", "c"],
  );
  assert.equal(events.orderComparedInside, "each class of writer");
  assert.ok(WRITER_CLASSES.includes("orchestrator"));
  assert.equal(
    writerClassOf({ file: "events.jsonl", raw: "", pairs: [] } as never),
    "orchestrator",
  );
});

test("CT-141-120 / N-15: a prefix that names an implementation file becomes a component name", () => {
  const recorded =
    "proposer.sh: evidence appeared after pass 1 (/tmp/oracle-run-D8067A/work/.specstride/features/three-phases/gates/GATE1-EVIDENCE.md).";
  const result = one("N-15", { stdout: { text: recorded } });
  assert.ok(result.count >= 1);
  const text = (result.surfaces["stdout"] as { text: string }).text;
  assert.ok(!text.startsWith("proposer.sh:"), text);
  // The message AFTER the prefix is left exactly as it was and must be equal.
  assert.ok(text.includes("evidence appeared after pass 1"));
  // The mapping is the component table, read from the baselines.
  const row = componentTable().find((r) => r.asIs === "proposer.sh");
  assert.ok(row !== undefined);
  assert.ok(text.startsWith(`${row.logical}:`));

  // The SECOND form of the rule: an implementation file named as a FILE — in the
  // path of a captured tree, or in the body of a generated file — becomes
  // `<component:…>`. The port's launch bundle holds its own implementation under
  // its own name, so comparing the two NAMES would compare two implementations.
  const inATree = one("N-15", {
    tree: {
      entries: [
        { path: `.mixture-of-loops/generated/001-greeting/<generated>/${AS_IS_PIPELINE_RUNTIME}` },
        { path: "one.txt", content: `exec python3 "$DIR/${AS_IS_PIPELINE_RUNTIME}" "$@"\n` },
        { path: `${AS_IS_PIPELINE_RUNTIME}.note`, content: "a file merely named like one\n" },
      ],
    },
  });
  const treeText = asText(inATree.surfaces);
  assert.ok(!treeText.includes(`/${AS_IS_PIPELINE_RUNTIME}"`), treeText);
  assert.ok(treeText.includes("<component:pipeline-runtime>"));
  // A file whose name merely STARTS with an as-is name is left alone.
  assert.ok(treeText.includes(`${AS_IS_PIPELINE_RUNTIME}.note`));
  // The front-door script of the Specstride baseline has no extension and its name
  // is a path component of the state layout of BOTH sides; it is never replaced as
  // a file name.
  const frontDoor = one("N-15", { tree: { entries: [{ path: ".specstride/features/x/state" }] } });
  assert.ok(
    (frontDoor.surfaces["tree"] as { entries: { path: string }[] }).entries[0]?.path ===
      ".specstride/features/x/state",
  );
});

test("CT-141-120 / N-16: a field that names the generating tool compares through the table", () => {
  const recorded = { state: { entries: [{ generated_by: "bootstrap_contract.py" }] } };
  const result = one("N-16", recorded);
  assert.ok(result.count >= 1);
  const value = (result.surfaces["state"] as { entries: Record<string, unknown>[] }).entries[0];
  assert.notEqual(value?.["generated_by"], "bootstrap_contract.py");
  assert.ok(GENERATED_BY_FIELDS.includes("generated_by"));
  // A field of the same name whose value names no implementation file is left alone.
  const other = one("N-16", { state: { entries: [{ generated_by: "a person" }] } });
  assert.equal(
    (other.surfaces["state"] as { entries: Record<string, unknown>[] }).entries[0]?.[
      "generated_by"
    ],
    "a person",
  );
  // Register row DV-066 names N-15 AND N-16 as the handling of `generated_by.tool`,
  // and the three forms the field reaches the oracle in are ONE component. The
  // launch contract of mixture-of-loops is carried as the TEXT of a captured file,
  // which is the form the parsed walk above cannot see.
  const asIs = `{\n  "generated_by": {\n    "tool": "mixture-of-loops/bootstrap_contract.py",\n    "version": "1.0"\n  }\n}`;
  const inText = one("N-16", {
    tree: { entries: [{ path: "launch-contract.json", content: asIs }] },
  });
  const content = (inText.surfaces["tree"] as { entries: { content: string }[] }).entries[0]
    ?.content as string;
  assert.match(content, /"tool": "contract-derive"/);
  assert.ok(inText.count >= 1, "the rule reports what it replaced");
  // The same value after N-15 has already replaced the FILE NAME inside the text
  // (N-15 runs first), and the LOGICAL component name itself, which is what
  // F107-FR-005 obliges the product to write: both give the same value, so a
  // conformant port and the baseline agree on the field.
  for (const value of ["mixture-of-loops/<component:contract-derive>", "contract-derive"]) {
    const form = one("N-16", {
      tree: { entries: [{ path: "launch-contract.json", content: `{"tool": "${value}"}` }] },
    });
    assert.equal(
      (form.surfaces["tree"] as { entries: { content: string }[] }).entries[0]?.content,
      `{"tool": "contract-derive"}`,
      `the form ${value} names the component`,
    );
  }
  assert.equal(componentOfGeneratingTool("contract-derive"), "contract-derive");
  assert.equal(componentOfGeneratingTool("a person"), undefined);
});

test("CT-141-120 / N-17: the launcher is compared as a logical record and not as text", () => {
  const recorded = {
    launcher: {
      launcher: {
        name: "launch.sh",
        exists: true,
        markerPresent: true,
        hashValid: true,
        bundleResolves: true,
        argumentsPassedThrough: ["--contract", "--launch-dir"],
        body: `#!/bin/sh\n# mixture-of-loops launcher\nexec python3 ${AS_IS_PIPELINE_RUNTIME} ...\n`,
      },
      bundle: [{ name: "launch-contract.json", content: "{}" }],
    },
  };
  const result = one("N-17", recorded);
  assert.equal(result.count, 1);
  const launcher = (result.surfaces["launcher"] as { launcher: Record<string, unknown> }).launcher;
  assert.equal(launcher["comparedAs"], "a logical record, not as text");
  // The four facts stay and the body is gone: no later comparison can fall back on
  // the text.
  assert.equal(launcher["markerPresent"], true);
  assert.equal(launcher["hashValid"], true);
  assert.equal(launcher["bundleResolves"], true);
  assert.deepEqual(launcher["argumentsPassedThrough"], ["--contract", "--launch-dir"]);
  assert.equal(launcher["body"], undefined);
  assert.ok(!asText(result.surfaces).includes("exec python3"));
  // The record is rebuilt from the facts; every other field of the SURFACE is
  // carried over, so a difference beside the record is not deleted with the body.
  const withMore = one("N-17", {
    launcher: {
      ...(recorded["launcher"] as Record<string, unknown>),
      somethingOnlyOneSideHas: "one value the other side does not have",
    },
  });
  assert.equal(
    (withMore.surfaces["launcher"] as Record<string, unknown>)["somethingOnlyOneSideHas"],
    "one value the other side does not have",
  );
});

test("CT-141-120 / N-18: a message of an old interpreter compares by class, not by wording", () => {
  const recorded =
    "Traceback (most recent call last):\n" +
    '  File "/tmp/oracle-scratch-eHls2F/ref/specstride/lib/critic.py", line 212, in main\n' +
    "    raise SystemExit(1)\n" +
    "SystemExit: 1\n" +
    "the next line is not part of the message";
  const result = one("N-18", { stderr: { text: recorded, perCommand: [recorded], bytes: "x" } });
  assert.ok(result.count >= 1);
  const text = (result.surfaces["stderr"] as { text: string }).text;
  assert.match(text, /<old-interpreter-message class=traceback>/);
  assert.ok(!text.includes("critic.py"), text);
  assert.ok(text.includes("the next line is not part of the message"));
  // The classes are read off the first line.
  assert.equal(lineClassOf("usage: specstride run"), "usage");
  assert.equal(lineClassOf("sh: 1: dsh: not found"), "shell-not-found");
  assert.equal(lineClassOf("an ordinary line"), undefined);
  // The bytes and the per-command text are dropped with the wording, so nothing can
  // fall back on them.
  assert.equal((result.surfaces["stderr"] as Record<string, unknown>)["bytes"], undefined);
});

test("CT-141-120 / N-19: a literal of the old language is compared as written", () => {
  const result = one("N-19", { stdout: { text: RECORDED_VERDICT } });
  assert.ok(result.count >= 1);
  // Nothing is hidden: the literal survives this rule and every other.
  assert.ok(asText(result.surfaces).includes("APPROVED"));
  const whole = normalize(
    { scenario: "x", side: "reference", surfaces: { stdout: { text: RECORDED_VERDICT } } },
    CONTEXT,
  );
  assert.ok(asText(whole.surfaces as Record<string, unknown>).includes("APPROVED"));
  assert.ok(asText(whole.surfaces as Record<string, unknown>).includes("VERDICT"));
  for (const literal of OLD_LANGUAGE_LITERALS) assert.equal(typeof literal, "string");
  assert.equal(countKindOf("N-19"), "applied to");
});

test("CT-141-120 / N-20: the supervisor lines and the digest are compared as written", () => {
  const recorded = "===== PHASE 1 — The first file  (2026-10-01T21:32:16+00:00) =====";
  const result = one("N-20", { stdout: { text: recorded } });
  assert.equal(result.count, 1);
  assert.ok(asText(result.surfaces).includes("PHASE"));
  assert.ok(OUTPUT_LABELS.includes("PHASE"));
  // A surface the rule does not act on is not counted.
  assert.equal(one("N-20", { state: { entries: [{ content: "PHASE" }] } }).count, 0);
});

test("CT-141-120 / N-21: a capture runs with colour off; an escape sequence is a finding", () => {
  const withColour = one("N-21", { stdout: { text: "\u001B[32m[DRY-RUN]\u001B[0m contract" } });
  assert.equal(withColour.count, 1);
  assert.equal(withColour.findings.length, 1);
  assert.match(
    withColour.findings[0] as string,
    /hold an escape sequence while the fixture does not test colour/,
  );
  // The sequences are compared AS WRITTEN: nothing was replaced.
  assert.ok(asText(withColour.surfaces).includes("[32m"));
  // A fixture that TESTS colour reports no finding.
  const tested = one(
    "N-21",
    { stdout: { text: "\u001B[32m[DRY-RUN]\u001B[0m contract" } },
    { testsColour: true },
  );
  assert.equal(tested.count, 1);
  assert.deepEqual([...tested.findings], []);
});

test("CT-141-120 / N-22: the hash of a commit becomes a numbered placeholder", () => {
  const recorded = "9cab15d2d08f6c54644985f7251700bbdbcab282";
  const result = one("N-22", {
    repository: {
      commits: [{ message: `specstride: phase 1 approved (${recorded})`, tree: ["one.txt"] }],
      remotes: [],
      nothingWasPushed: true,
    },
  });
  assert.equal(result.count, 1);
  const text = asText(result.surfaces);
  assert.ok(!text.includes(recorded));
  assert.ok(text.includes("<commit-1>"));
  // The message, the content of the tree and the absence of a push stay.
  assert.ok(text.includes("specstride: phase 1 approved"));
  assert.ok(text.includes("one.txt"));
  assert.ok(text.includes('"nothingWasPushed":true'));
});

test("CT-141-120 / N-23: a counter file of a stub is left out of the tree", () => {
  const result = one("N-23", {
    tree: { entries: [{ path: "one.txt" }, { path: "stub-state/proposer.dsh.count" }] },
    home: { home: [{ path: "engine.attempts" }], temporaryDirectory: [] },
  });
  assert.equal(result.count, 2);
  const text = asText(result.surfaces);
  assert.ok(!text.includes(".count"));
  assert.ok(!text.includes(".attempts"));
  assert.ok(text.includes("one.txt"));
  assert.ok(COUNTER_FILE_PATTERN.test("proposer.dsh.count"));
  assert.equal(countKindOf("N-23"), "replaced");
});

test("CT-141-120 / N-24: a prompt is compared in full after N-01 to N-08", () => {
  const recorded = [
    { role: "proposer", call: 1, prompt: `You are operating in: ${WORK}\nWrite your evidence …` },
    { role: "critic", call: 1, prompt: RECORDED_VERDICT },
  ];
  const result = one("N-24", { transcript: recorded });
  assert.equal(result.count, 2);
  // Nothing was replaced by this rule: "in full" is the point.
  assert.ok(asText(result.surfaces).includes("Write your evidence"));
  // After the whole normalizer the path of the prompt is a placeholder and the rest
  // of it is still there, in full.
  const whole = normalize(
    { scenario: "x", side: "reference", surfaces: { transcript: recorded } },
    CONTEXT,
  );
  const text = asText(whole.surfaces as Record<string, unknown>);
  assert.ok(text.includes("<WORK>"));
  assert.ok(!text.includes(WORK));
  assert.ok(text.includes("Write your evidence"));
});

test("CT-141-120 / N-25: a cache of a language is left out, and inside the workdir is a failure", () => {
  const result = one("N-25", {
    tree: { entries: [{ path: "one.txt" }, { path: "lib/__pycache__/critic.cpython-311.pyc" }] },
    home: { home: [{ path: ".cache/x.pyc" }], temporaryDirectory: [] },
  });
  assert.equal(result.count, 2);
  assert.ok(!asText(result.surfaces).includes("__pycache__"));
  assert.ok(!asText(result.surfaces).includes(".pyc"));
  // Its presence INSIDE the working directory is a failure, and the finding says so.
  assert.equal(result.findings.length, 1);
  assert.match(result.findings[0] as string, /lie inside the working directory/);
  assert.ok(LANGUAGE_CACHE_PATTERN.test("lib/__pycache__/x.pyc"));
  assert.equal(countKindOf("N-25"), "left out");
  // A cache in the HOME alone is left out and is no failure.
  const inHome = one("N-25", {
    home: { home: [{ path: ".cache/x.pyc" }], temporaryDirectory: [] },
  });
  assert.equal(inHome.count, 1);
  assert.deepEqual([...inHome.findings], []);
});

test("CT-141-120 / N-26: the payloads are compared at the stub sink after N-03, N-04 and N-07", () => {
  const result = one("N-26", {
    telemetry: {
      count: 1,
      payloads: [
        { path: "/loki/api/v1/push", body: { streams: [{ values: [["1790890335", "x"]] }] } },
      ],
    },
  });
  assert.equal(result.count, 1);
  assert.deepEqual((result.surfaces["telemetry"] as { comparedAfter: string[] }).comparedAfter, [
    "N-03",
    "N-04",
    "N-07",
  ]);
  // In the whole normalizer the time inside the payload is a placeholder by then.
  const whole = normalize(
    {
      scenario: "x",
      side: "reference",
      surfaces: {
        telemetry: { count: 1, payloads: [{ path: "/p", body: { ts: "1790890335.544232833" } }] },
      },
    },
    CONTEXT,
  );
  assert.ok(!asText(whole.surfaces as Record<string, unknown>).includes("1790890335"));
  // A scenario with no sink counts nothing.
  assert.equal(
    one("N-26", { telemetry: { count: 0, payloads: undefined, noSink: true } }).count,
    0,
  );
});

test("CT-141-120 / N-27: both sides run with the same locale and nothing is sorted for them", () => {
  const recorded = { tree: { entries: [{ path: "B.txt" }, { path: "a.txt" }] } };
  const result = one("N-27", recorded);
  assert.ok(result.count >= 1);
  // The order is the behaviour: the rule sorted nothing.
  assert.deepEqual(
    (result.surfaces["tree"] as { entries: { path: string }[] }).entries.map((e) => e.path),
    ["B.txt", "a.txt"],
  );
  assert.equal(countKindOf("N-27"), "applied to");
});

test("CT-141-120 / N-28: the legacy names and the pre-v2 layout are not compared", () => {
  const result = one("N-28", {
    state: { entries: [{ logicalName: "<a>", content: "RALPH_MAX_ITER=3\n" }] },
    tree: { entries: [{ path: ".ralph/state.json" }, { path: "one.txt" }] },
  });
  assert.ok(result.count >= 2);
  const text = asText(result.surfaces);
  assert.ok(!text.includes("RALPH_MAX_ITER"));
  assert.ok(!text.includes(".ralph/"));
  assert.ok(text.includes("<legacy, not compared>"));
  assert.ok(text.includes("one.txt"));
  assert.ok(LEGACY_MARKERS.includes("RALPH_"));
  assert.equal(countKindOf("N-28"), "left out");
});

test("CT-141-120 / N-29: the field `schema` is removed from the inventory of the PORT", () => {
  // Input in the port's form, which this test holds: the as-is inventory carries
  // `schema_version` and no `schema` (DV-116).
  const asARecord = {
    state: {
      entries: [
        {
          logicalName: "<workspace-part>/reverse/inventory.json",
          inventory: { [REVERSE_INVENTORY_SCHEMA_FIELD]: REVERSE_INVENTORY_SCHEMA_ID, sources: [] },
        },
      ],
    },
  };
  const onThePort = one("N-29", asARecord, { side: "port" });
  assert.equal(onThePort.count, 1);
  assert.ok(!asText(onThePort.surfaces).includes(REVERSE_INVENTORY_SCHEMA_ID));
  assert.ok(asText(onThePort.surfaces).includes('"sources"'));
  // On the REFERENCE the rule acts on nothing.
  assert.equal(one("N-29", asARecord, { side: "reference" }).count, 0);
  // The inventory may also be the TEXT of a file of state.
  const asText_ = {
    state: {
      entries: [
        {
          logicalName: "<a>",
          content: `{"${REVERSE_INVENTORY_SCHEMA_FIELD}": "${REVERSE_INVENTORY_SCHEMA_ID}", "sources": []}`,
        },
      ],
    },
  };
  const fromText = one("N-29", asText_, { side: "port" });
  assert.ok(fromText.count >= 1);
  assert.ok(!asText(fromText.surfaces).includes(REVERSE_INVENTORY_SCHEMA_ID));
});

// ---------------------------------------------------------------------------
// The counts, and the rule that replaced nothing
// ---------------------------------------------------------------------------

test("CT-141-120: the normalizer reports one count per rule, for every rule", () => {
  const normalized = normalize(
    {
      scenario: "FX-01/three-phases",
      side: "reference",
      surfaces: { events: { raw: RECORDED_RUN_START }, stdout: { text: RECORDED_VERDICT } },
    },
    CONTEXT,
  );
  assert.deepEqual(Object.keys(normalized.counts), [...ruleIds()]);
  assert.equal(Object.keys(normalized.counts).length, 29);
  // The capture that went in was not changed.
  assert.ok(normalized.counts["N-01"] !== undefined);
});

test("CT-141-120: a rule that replaced nothing in any fixture fails the suite, by name", () => {
  const everyRuleFired = Object.fromEntries(ruleIds().map((id) => [id, 1]));
  const good = suiteReport([
    { scenario: "FX-01/three-phases", side: "reference", counts: everyRuleFired },
  ]);
  assert.deepEqual([...good.replacedNothing], []);
  assertEveryRuleEarnedItsPlace(good);
  assert.equal(good.rows.length, 29);

  // One rule at zero over the whole suite: the suite fails and names it.
  const idle = { ...everyRuleFired, "N-17": 0, "N-22": 0 };
  const bad = suiteReport([
    { scenario: "FX-01/three-phases", side: "reference", counts: idle },
    { scenario: "FX-01/three-phases", side: "port", counts: idle },
  ]);
  assert.deepEqual([...bad.replacedNothing], ["N-17", "N-22"]);
  assert.throws(
    () => assertEveryRuleEarnedItsPlace(bad),
    (error: unknown) =>
      error instanceof NormalizationError &&
      /2 normalization rule\(s\) replaced nothing in any/.test(error.message) &&
      error.message.includes("N-17") &&
      error.message.includes("N-22"),
  );
  // A rule that fired in ONE fixture of the suite is enough.
  const onlyInOne = suiteReport([
    { scenario: "a", side: "reference", counts: { ...everyRuleFired, "N-17": 0 } },
    { scenario: "b", side: "reference", counts: everyRuleFired },
  ]);
  assert.deepEqual([...onlyInOne.replacedNothing], []);
});

test("CT-141-120: the report names every rule, its count kind and where it fired", () => {
  const report = suiteReport([
    {
      scenario: "FX-01/three-phases",
      side: "reference",
      counts: {
        ...Object.fromEntries(ruleIds().map((id) => [id, 0])),
        "N-01": 38,
        "N-25": 2,
        "N-09": 5,
      },
    },
  ]);
  const text = reportAsText(report);
  for (const id of ruleIds()) assert.ok(text.includes(id), `${id} is in the report`);
  assert.match(text, /N-01\s+38\s+replaced/);
  assert.match(text, /N-25\s+2\s+left out/);
  assert.match(text, /N-09\s+5\s+applied to/);
  // A rule whose total is zero is named as such in the report, and the report says
  // the suite fails.
  assert.match(text, /N-02\s+0\s+replaced\s+REPLACED NOTHING/);
  assert.match(text, /the suite fails: .*N-02/);
  assert.deepEqual(
    [...(report.rows.find((r) => r.id === "N-01")?.fixtures ?? [])],
    ["FX-01/three-phases (reference)"],
  );
});
