/**
 * CT-152-27 — the counters of the commit gate never decide a retry or a halt
 * (F152-FR-015, F152-FR-022; Principle I).
 *
 * The facts of a block are read from the durable block records of the control
 * plane; the in-memory counters exist only to report. This test parses
 * `run-feature.ts` with the TypeScript compiler API and enforces the intended
 * usage of `commitsBlocked` (digest line only) and `commitsLeftUncommitted`
 * (the end-of-run exit ternary and its warning line only) on the AST, so no
 * later edit can put either counter into a branch that decides control flow.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..", "..", "..");
const SOURCE = join(ROOT, "packages", "cli", "src", "engine", "run-feature.ts");

const COUNTERS = ["commitsBlocked", "commitsLeftUncommitted"] as const;

function parse(): ts.SourceFile {
  const text = readFileSync(SOURCE, "utf8");
  return ts.createSourceFile(SOURCE, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

/** A short slice of source around the node, for the failure message. */
function slice(file: ts.SourceFile, node: ts.Node): string {
  const start = Math.max(0, node.getStart(file) - 20);
  const end = Math.min(file.text.length, node.getEnd() + 20);
  return file.text.slice(start, end).replace(/\s+/g, " ");
}

/** True when the node is an identifier that names one of the two counters. */
function isCounterIdentifier(node: ts.Node): boolean {
  return ts.isIdentifier(node) && (COUNTERS as readonly string[]).includes(node.text);
}

/** True when the subtree holds a template literal (the digest line). */
function subtreeContainsTemplateSpan(node: ts.Node): boolean {
  let found = false;
  const walk = (inner: ts.Node): void => {
    if (found) return;
    if (ts.isTemplateExpression(inner) || ts.isStringLiteral(inner)) {
      found = true;
      return;
    }
    ts.forEachChild(inner, walk);
  };
  walk(node);
  return found;
}

/** True when a counter identifier appears anywhere in the node's subtree. */
function subtreeReferencesACounter(node: ts.Node): boolean {
  let found = false;
  const walk = (inner: ts.Node): void => {
    if (found) return;
    if (isCounterIdentifier(inner)) {
      found = true;
      return;
    }
    ts.forEachChild(inner, walk);
  };
  walk(node);
  return found;
}

test("the counters of the commit gate never decide control flow (F152-FR-015, T158)", () => {
  const file = parse();
  const offences: string[] = [];

  const walk = (node: ts.Node): void => {
    if (ts.isIfStatement(node) && subtreeReferencesACounter(node.expression)) {
      // Allowed: the end-of-run safety-net warning (F152-FR-022) — nothing else.
      const saysTheSafetyNet = node.thenStatement
        .getText()
        .includes("commit(s) were blocked by the secret gate");
      if (!saysTheSafetyNet) {
        offences.push(
          `IfStatement test references a counter: ${slice(file, node.expression)}`,
        );
      }
    } else if (ts.isConditionalExpression(node) && subtreeReferencesACounter(node.condition)) {
      // Allowed: the exit ternary, whose whole expression initialises
      // `exitCode` (CQ-152-05 A: the safety net moves the exit code only).
      const parent = node.parent;
      const initializesExitCode =
        ts.isVariableDeclaration(parent) &&
        ts.isIdentifier(parent.name) &&
        parent.name.text === "exitCode";
      if (!initializesExitCode) {
        offences.push(
          `ConditionalExpression condition references a counter: ${slice(file, node.condition)}`,
        );
      }
    } else if (ts.isSwitchStatement(node) && subtreeReferencesACounter(node.expression)) {
      offences.push(
        `SwitchStatement expression references a counter: ${slice(file, node.expression)}`,
      );
    } else if (
      (ts.isForStatement(node) || ts.isWhileStatement(node) || ts.isDoStatement(node)) &&
      node.expression !== undefined &&
      subtreeReferencesACounter(node.expression)
    ) {
      const expression = (node as ts.ForStatement | ts.WhileStatement | ts.DoStatement)
        .expression as ts.Expression;
      offences.push(`loop test references a counter: ${slice(file, expression)}`);
    }
    ts.forEachChild(node, walk);
  };
  walk(file);

  assert.equal(
    offences.length,
    0,
    `a counter of the commit gate decides control flow in run-feature.ts ` +
      `(Principle I: the decision reads the control plane, not memory):\n` +
      offences.join("\n"),
  );
});

test("every reference of commitsBlocked is an increment or sits in the digest line (T158)", () => {
  const file = parse();
  const uses: string[] = [];

  const walk = (node: ts.Node): void => {
    if (isCounterIdentifier(node) && node.text === "commitsBlocked") {
      const parent = node.parent;
      const isIncrement =
        ts.isPrefixUnaryExpression(parent) ||
        ts.isPostfixUnaryExpression(parent) ||
        (ts.isBinaryExpression(parent) &&
          parent.operatorToken.kind === ts.SyntaxKind.PlusEqualsToken);
      const inTemplate =
        ts.isTemplateSpan(parent) ||
        ts.isStringLiteral(parent) ||
        ts.isNoSubstitutionTemplateLiteral(parent);
      // The initialiser `let commitsBlocked = 0` and the digest line's
      // `String(commitsBlocked)` (an argument, not a condition) are report
      // uses too.
      const isInitialiser =
        ts.isVariableDeclaration(parent) && parent.initializer !== undefined;
      const isDigestArgument =
        ts.isCallExpression(parent) &&
        (ts.isTemplateSpan(parent.parent) ||
          subtreeContainsTemplateSpan(parent));
      if (!isIncrement && !inTemplate && !isInitialiser && !isDigestArgument) {
        uses.push(`${slice(file, parent)} [${ts.SyntaxKind[parent.kind]}]`);
      }
    }
    ts.forEachChild(node, walk);
  };
  walk(file);

  assert.equal(
    uses.length,
    0,
    `commitsBlocked is read outside the digest report (it must inform only):\n` +
      uses.join("\n"),
  );
});
