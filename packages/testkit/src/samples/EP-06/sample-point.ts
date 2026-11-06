/**
 * T081 — the sample decision point of EP-06, outside the core, registered
 * from the test tree (annex A §A.4; annex X §X.10). The sample extends the
 * shipped table of feature 115 with two rows of its own at the decision
 * point `tools`, and evaluates with the one evaluator of the graph — the
 * table evaluator of the kernel. No core file names the sample; adding or
 * removing it changes no core file.
 */
import { loadTable, type LoadedTable } from "@specstride/kernel";
import shippedData from "@specstride/contracts/data/router-table-115.json" with { type: "json" };

/**
 * The two rows of the sample, added before the rows of the shipped table at
 * the point `tools`. They read two signals of their own (`commandCached`,
 * `commandAuthorized`) that the shipped table does not know.
 */
export const SAMPLE_POINT_TABLE = {
  schema: "specstride.table/1",
  id: "sample-router-rules-115-tools",
  version: "1",
  points: {
    tools: {
      signals: {
        commandCached: "boolean",
        commandAuthorized: "boolean",
        commandFlaky: "boolean",
        commandDurationOverLimit: "boolean",
        checkShare: "number",
        cycle: "number",
        commandSlowest: "boolean",
      },
      choices: ["run", "exclude:flaky", "exclude:slow", "exclude:budget"],
    },
    loop: shippedData.points.loop,
    escalation: shippedData.points.escalation,
  },
  rows: {
    tools: [
      {
        ruleId: "sample-tools-cached-first",
        when: { op: "equal", signal: "commandCached", value: true },
        choice: "exclude:flaky",
      },
      {
        ruleId: "sample-tools-unauthorized-run",
        when: { op: "equal", signal: "commandAuthorized", value: false },
        choice: "run",
      },
      ...shippedData.rows.tools,
    ],
    loop: shippedData.rows.loop,
    escalation: shippedData.rows.escalation,
  },
} as const;

/** The sample point table as the one evaluator loaded it. */
export function samplePointTable(): LoadedTable {
  return loadTable(SAMPLE_POINT_TABLE);
}

/** The loaded table, once. */
let loaded: LoadedTable | undefined;

/** The loaded sample point table (memoized). */
export function loadedSamplePoint(): LoadedTable {
  loaded ??= samplePointTable();
  return loaded;
}
