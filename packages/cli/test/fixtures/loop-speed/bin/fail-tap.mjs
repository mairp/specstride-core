#!/usr/bin/env node
// Fake TAP producer for the loop-speed fixtures (spec 153, task T003).
// Models `node --test` output: 100 TAP lines with the failures LAST (a suite
// prints its failures at the end). The failing lines start with `not ok `,
// which no prefix of MARKER_PREFIXES (`FAILED `, `ERROR `, `E `) lists —
// tracked limitation L-5 of spec.md.
console.log("TAP version 14");
console.log("1..100");
for (let n = 1; n <= 98; n++) console.log(`ok ${n} - passing test ${n}`);
console.log("not ok 99 a broken test");
console.log("not ok 100 a broken test");
process.exit(1);
