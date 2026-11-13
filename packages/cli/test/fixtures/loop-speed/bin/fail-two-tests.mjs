#!/usr/bin/env node
// Fake failing check for the loop-speed fixtures (spec 153, task T002).
// Prints two failing test lines with the `FAILED ` marker prefix of
// MARKER_PREFIXES (packages/verification/src/summary/failure-summary.ts:60)
// among 100 other lines, a 50-line stack on standard error, and exits 1.
const lines = [];
// 100 filler lines; the two FAILED lines sit mid-stream and late-stream.
for (let i = 1; i <= 50; i++) lines.push(`ok ${i} - filler line ${i}`);
lines.push("FAILED test_alpha - expected 1");
for (let i = 51; i <= 100; i++) lines.push(`ok ${i} - filler line ${i}`);
lines.push("FAILED test_beta - expected 2");
for (const line of lines) console.log(line);
for (let i = 1; i <= 50; i++) console.error(`    at frame ${i} (fake-stack.ts:${i}:${i})`);
process.exit(1);
