#!/usr/bin/env node
// T005 — "prints its environment": writes every name of its environment, one
// per line, sorted, as `name=value`, and exits 0. The command of F148-SC-002
// and of quickstart.md scenario 3: with planted provider credentials in the
// environment of the runtime, none of them is printed outside the `parity`
// profile, and all of them are printed under it.
//
// The VALUES are printed too, so a test can assert that a planted value does
// not appear anywhere in the captured output, not merely that the name is
// absent.
import process from "node:process";
const names = Object.keys(process.env).sort();
for (const name of names) process.stdout.write(`${name}=${process.env[name] ?? ""}\n`);
process.stdout.write(`fixture:print-environment ${names.length} name(s)\n`);
process.exit(0);
