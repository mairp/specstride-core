/**
 * CT-147-114 — the conformance cases of feature 147, the CONTENT OWNER of
 * EP-11, `specstride.terms/1` (annex A, §A.4; F147-FR-014).
 *
 * Feature 100 owns the contract-level case of the point (CT-100-208, in
 * `./contract.test.ts`); this file holds the cases of the content owner in
 * the same folder: the TABLE TESTS GENERATED FROM THE MATRIX of R8v
 * (`docs/ecosystem/research/R8v-terms-verification.md`, 42 cells), one check
 * per cell, run against BOTH the terms gate of the product
 * (`@specstride/policy/terms`) and the implementation of the test overlay —
 * and, beside the matrix, the fictional provider that §C.12 "Proving test"
 * names, which changes the decision with no code change.
 *
 * F147-SC-002: the decision the gate returns differs from the matrix in 0
 * cells. F147-SC-003: no Tier 3 row of the shipped data is `allowed`.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  A_FRONT_HARNESS_IS_GATED_BY_ITS_BACK_END,
  AUTH_TIERS,
  POINT_ID,
  STATUSES,
  noRowOutcome,
} from "@specstride/contracts/ep/terms";
import type { AuthTier, TermsDecision, TermsQuery } from "@specstride/contracts/ep/terms";
import * as terms from "@specstride/policy/terms";
import {
  PROVIDER as OVERLAY_PROVIDER,
  implementation as overlay,
} from "../../samples/EP-11/index.ts";

type Audience = "personal" | "distributed";

/** One cell of the corrected matrix of R8v (docs/ecosystem/research/R8v-terms-verification.md). */
type Cell = {
  /** The row number in R8v's table. */
  row: number;
  provider: string;
  authTier: AuthTier;
  audience: Audience;
  /** The status of the cell after R8v's correction, as the shipped row carries it. */
  status: "allowed" | "conditional" | "personal-only" | "refused" | null;
  /** The decision the gate must return for the cell (no acknowledgement). */
  decision: TermsDecision["decision"];
  /** The decision the gate must return when the consumer acknowledges the path. */
  acknowledged?: TermsDecision["decision"];
  /** True for the four cells of pi, which has no row of its own (F147-FR-011). */
  front?: true;
};

/** The statuses the four kinds of matrix cell produce, as the spec fixes them. */
const DECISION_OF = {
  allowed: "allowed",
  conditional: "refused",
  "personal-only": "refused",
  refused: "refused",
} as const;

const ANTHROPIC = "anthropic" as const;

/** The 42 cells of R8v's corrected matrix, in the order of its table. */
export const MATRIX: readonly Cell[] = Object.freeze([
  {
    row: 1,
    provider: ANTHROPIC,
    authTier: 1,
    audience: "personal",
    status: "allowed",
    decision: "allowed",
  },
  {
    row: 2,
    provider: ANTHROPIC,
    authTier: 1,
    audience: "distributed",
    status: "personal-only",
    decision: "refused",
    acknowledged: "allowed-with-warning",
  },
  {
    row: 3,
    provider: ANTHROPIC,
    authTier: 2,
    audience: "personal",
    status: "allowed",
    decision: "allowed",
  },
  {
    row: 4,
    provider: ANTHROPIC,
    authTier: 2,
    audience: "distributed",
    status: "allowed",
    decision: "allowed",
  },
  {
    row: 5,
    provider: ANTHROPIC,
    authTier: 3,
    audience: "personal",
    status: "refused",
    decision: "refused",
  },
  {
    row: 6,
    provider: ANTHROPIC,
    authTier: 3,
    audience: "distributed",
    status: "refused",
    decision: "refused",
  },
  {
    row: 7,
    provider: "openai",
    authTier: 1,
    audience: "personal",
    status: "conditional",
    decision: "refused",
    acknowledged: "allowed",
  },
  {
    row: 8,
    provider: "openai",
    authTier: 1,
    audience: "distributed",
    status: "personal-only",
    decision: "refused",
    acknowledged: "allowed-with-warning",
  },
  {
    row: 9,
    provider: "openai",
    authTier: 2,
    audience: "personal",
    status: "allowed",
    decision: "allowed",
  },
  {
    row: 10,
    provider: "openai",
    authTier: 2,
    audience: "distributed",
    status: "allowed",
    decision: "allowed",
  },
  {
    row: 11,
    provider: "openai",
    authTier: 3,
    audience: "personal",
    status: "refused",
    decision: "refused",
  },
  {
    row: 12,
    provider: "openai",
    authTier: 3,
    audience: "distributed",
    status: "refused",
    decision: "refused",
  },
  {
    row: 13,
    provider: "google",
    authTier: 1,
    audience: "personal",
    status: "conditional",
    decision: "refused",
    acknowledged: "allowed",
  },
  {
    row: 14,
    provider: "google",
    authTier: 1,
    audience: "distributed",
    status: "conditional",
    decision: "refused",
    acknowledged: "allowed",
  },
  {
    row: 15,
    provider: "google",
    authTier: 2,
    audience: "personal",
    status: "allowed",
    decision: "allowed",
  },
  {
    row: 16,
    provider: "google",
    authTier: 2,
    audience: "distributed",
    status: "allowed",
    decision: "allowed",
  },
  {
    row: 17,
    provider: "google",
    authTier: 3,
    audience: "personal",
    status: "refused",
    decision: "refused",
  },
  {
    row: 18,
    provider: "google",
    authTier: 3,
    audience: "distributed",
    status: "refused",
    decision: "refused",
  },
  {
    row: 19,
    provider: "github-copilot",
    authTier: 1,
    audience: "personal",
    status: "allowed",
    decision: "allowed",
  },
  {
    row: 20,
    provider: "github-copilot",
    authTier: 1,
    audience: "distributed",
    status: "allowed",
    decision: "allowed",
  },
  {
    row: 21,
    provider: "github-copilot",
    authTier: 2,
    audience: "personal",
    status: "allowed",
    decision: "allowed",
  },
  {
    row: 22,
    provider: "github-copilot",
    authTier: 2,
    audience: "distributed",
    status: "allowed",
    decision: "allowed",
  },
  {
    row: 23,
    provider: "github-copilot",
    authTier: 3,
    audience: "personal",
    status: "refused",
    decision: "refused",
  },
  {
    row: 24,
    provider: "github-copilot",
    authTier: 3,
    audience: "distributed",
    status: "refused",
    decision: "refused",
  },
  {
    row: 25,
    provider: "openrouter",
    authTier: 2,
    audience: "personal",
    status: "allowed",
    decision: "allowed",
  },
  {
    row: 26,
    provider: "openrouter",
    authTier: 2,
    audience: "distributed",
    status: "allowed",
    decision: "allowed",
  },
  {
    row: 27,
    provider: "zai-coding-plan",
    authTier: 1,
    audience: "personal",
    status: "conditional",
    decision: "refused",
    acknowledged: "allowed",
  },
  {
    row: 28,
    provider: "zai-coding-plan",
    authTier: 1,
    audience: "distributed",
    status: "personal-only",
    decision: "refused",
    acknowledged: "allowed-with-warning",
  },
  {
    row: 29,
    provider: "zai-api",
    authTier: 2,
    audience: "personal",
    status: "allowed",
    decision: "allowed",
  },
  {
    row: 30,
    provider: "zai-api",
    authTier: 2,
    audience: "distributed",
    status: "allowed",
    decision: "allowed",
  },
  {
    row: 31,
    provider: "zai",
    authTier: 3,
    audience: "personal",
    status: "refused",
    decision: "refused",
  },
  {
    row: 32,
    provider: "zai",
    authTier: 3,
    audience: "distributed",
    status: "refused",
    decision: "refused",
  },
  {
    row: 33,
    provider: "opencode",
    authTier: 1,
    audience: "personal",
    status: "conditional",
    decision: "refused",
    acknowledged: "allowed",
  },
  {
    row: 34,
    provider: "opencode",
    authTier: 1,
    audience: "distributed",
    status: "conditional",
    decision: "refused",
    acknowledged: "allowed",
  },
  {
    row: 35,
    provider: "opencode",
    authTier: 3,
    audience: "personal",
    status: "refused",
    decision: "refused",
  },
  {
    row: 36,
    provider: "opencode",
    authTier: 3,
    audience: "distributed",
    status: "refused",
    decision: "refused",
  },
  // pi: no row of its own — the row of the provider in use governs
  // (F147-FR-011; the facts of rows 37 to 40 travel with the data).
  {
    row: 37,
    provider: "pi",
    authTier: 1,
    audience: "personal",
    status: null,
    decision: "allowed",
    front: true,
  },
  {
    row: 38,
    provider: "pi",
    authTier: 1,
    audience: "distributed",
    status: null,
    decision: "refused",
    front: true,
  },
  {
    row: 39,
    provider: "pi",
    authTier: 3,
    audience: "personal",
    status: null,
    decision: "refused",
    front: true,
  },
  {
    row: 40,
    provider: "pi",
    authTier: 3,
    audience: "distributed",
    status: null,
    decision: "refused",
    front: true,
  },
  {
    row: 41,
    provider: "deepseek",
    authTier: 2,
    audience: "personal",
    status: "allowed",
    decision: "allowed",
  },
  {
    row: 42,
    provider: "deepseek",
    authTier: 2,
    audience: "distributed",
    status: "allowed",
    decision: "allowed",
  },
]);

/** The gate under test, as a function the cases call. */
type GateFn = (query: TermsQuery) => TermsDecision;

/** The provider the cell's decision is taken for: pi has no row of its own,
 * so the row of the provider in use (Anthropic, per R8v rows 37 to 40)
 * governs (F147-FR-011). */
function gateProvider(cell: Cell): string {
  return cell.front ? ANTHROPIC : cell.provider;
}

function queryOf(cell: Cell, acknowledged: boolean): TermsQuery {
  return {
    provider: gateProvider(cell),
    authTier: cell.authTier,
    audience: cell.audience,
    acknowledgements: acknowledged ? [`${gateProvider(cell)}:${cell.authTier}`] : [],
  };
}

/** The decision the matrix says the gate must return for one cell. */
function expectedOf(cell: Cell, acknowledged: boolean): TermsDecision["decision"] {
  if (cell.front) {
    // The provider in use is Anthropic (rows 37 to 40 inherit rows 1, 2, 5
    // and 11): the decision is the one the anthropic row of the same tier
    // and audience carries.
    const inUse = MATRIX.find(
      (c) =>
        c.provider === ANTHROPIC && c.authTier === cell.authTier && c.audience === cell.audience,
    ) as Cell;
    return acknowledged && inUse.acknowledged
      ? inUse.acknowledged
      : DECISION_OF[inUse.status as "allowed"];
  }
  if (acknowledged && cell.acknowledged !== undefined) return cell.acknowledged;
  return DECISION_OF[cell.status as "allowed"];
}

/** The one table test of the matrix: 42 cells, and the count of differences. */
export function runMatrix(gate: GateFn, label: string): number {
  let differing = 0;
  for (const cell of MATRIX) {
    const decision = gate(queryOf(cell, false));
    if (decision.decision !== expectedOf(cell, false)) differing++;
    if (
      cell.acknowledged !== undefined ||
      (cell.front && cell.authTier === 1 && cell.audience === "distributed")
    ) {
      const acked = gate(queryOf(cell, true));
      const ackedExpected = expectedOf(cell, true);
      if (acked.decision !== ackedExpected) differing++;
    }
    // Where the cell has a shipped row, the decision carries that row.
    if (cell.status !== null) {
      const decision2 = gate(queryOf(cell, false));
      assert.equal(
        (decision2 as TermsDecision & { row?: { provider: string } | null }).row?.status,
        cell.status,
        `${label} cell ${cell.row}: the decision carries the row of the cell`,
      );
    }
  }
  return differing;
}

test("CT-147-114: table tests generated from the matrix — 42 cells, 0 decisions that differ (F147-FR-014, F147-SC-002)", () => {
  assert.equal(MATRIX.length, 42, "the corrected matrix of R8v holds 42 cells");
  // Against the terms gate of the product.
  const productDifferences = runMatrix((query) => terms.evaluate(query), "product");
  assert.equal(productDifferences, 0, "F147-SC-002: 0 decisions that differ from the matrix");
  // Against the implementation of the test overlay, which holds only its
  // fictional provider: every shipped cell is unknown terms there, so the
  // matrix itself cannot differ — and the gate of the overlay is held to
  // the same rules (annex A §A.4).
  const overlayEvaluate = (overlay.operations as unknown as { evaluate: GateFn }).evaluate;
  for (const cell of MATRIX) {
    if (cell.front) continue;
    const decision = overlayEvaluate(queryOf(cell, false));
    if (cell.provider === OVERLAY_PROVIDER) continue;
    assert.deepEqual(decision, noRowOutcome(cell.authTier), `overlay cell ${cell.row}`);
  }
  // The point: one operation, `evaluate`; the closed sets of §C.12.
  assert.equal(POINT_ID, "specstride.terms/1");
  assert.deepEqual([...AUTH_TIERS], [1, 2, 3]);
  assert.deepEqual([...STATUSES], ["allowed", "conditional", "personal-only", "refused"]);
  assert.equal(A_FRONT_HARNESS_IS_GATED_BY_ITS_BACK_END, true);
});

test("CT-147-114: no Tier 3 row of the shipped data is `allowed` (F147-SC-003)", () => {
  const shipped = terms.shippedData();
  const tier3 = shipped.rows.filter((r) => r.authTier === 3);
  assert.ok(tier3.length > 0, "the shipped data holds tier 3 rows");
  for (const row of tier3) {
    assert.equal(row.status, "refused", `${row.provider} tier 3 ${row.audience}: ships refused`);
  }
  // And through the gate: tier 3 is refused for every shipped provider.
  for (const provider of new Set(shipped.rows.map((r) => r.provider))) {
    for (const audience of ["personal", "distributed"] as const) {
      assert.equal(
        terms.evaluate({ provider, authTier: 3, audience, acknowledgements: [] }).decision,
        "refused",
      );
    }
  }
});

test("CT-147-114: a fictional provider in a test overlay changes the decision with no code change (annex C §C.12, Proving test)", () => {
  // The overlay provider is in no shipped row (F147-FR-008 applies to the
  // product), yet the overlay implementation decides `allowed` for it from
  // its data alone — the decision changed, no code changed.
  assert.equal(
    terms.shippedData().rows.find((r) => r.provider === OVERLAY_PROVIDER),
    undefined,
    "the fictional provider is in no shipped row",
  );
  const overlayEvaluate = (overlay.operations as unknown as { evaluate: GateFn }).evaluate;
  const overlayDecision = overlayEvaluate({
    provider: OVERLAY_PROVIDER,
    authTier: 1,
    audience: "personal",
    acknowledgements: [],
  });
  assert.equal(overlayDecision.decision, "allowed", "the overlay decides from its row");
  const productDecision = terms.evaluate({
    provider: OVERLAY_PROVIDER,
    authTier: 1,
    audience: "personal",
    acknowledgements: [],
  });
  assert.equal(productDecision.decision, "allowed-with-warning", "the product reads unknown terms");
  assert.notEqual(productDecision.decision, overlayDecision.decision);
  // The same shift for the distributed audience, where the overlay row says
  // `personal-only` and the gate refuses.
  const distributed = overlayEvaluate({
    provider: OVERLAY_PROVIDER,
    authTier: 1,
    audience: "distributed",
    acknowledgements: [],
  });
  assert.equal(distributed.decision, "refused");
});
