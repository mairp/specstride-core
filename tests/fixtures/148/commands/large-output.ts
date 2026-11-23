#!/usr/bin/env node
// T005 — "very large output": writes FIXTURE_OUTPUT_CHARS characters (default
// 200000, well past the 64000-character cap) to standard output and the same
// to standard error, then exits 0. What lies beyond the cap must not be kept
// (F148-FR-002, `research.md` D-9; threat T-25).
//
// The text is a repeated 64-character block with no newline inside it, so the
// cut falls in the middle of a line and the caller can count characters
// exactly rather than lines.
import process from "node:process";

const value = Number(process.env["FIXTURE_OUTPUT_CHARS"]);
const total = Number.isInteger(value) && value > 0 ? value : 200_000;
const block = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWX".padEnd(64, ".");
let text = "";
while (text.length < total) text += block;
text = text.slice(0, total);
process.stdout.write(text);
process.stderr.write(text);
process.exit(0);
