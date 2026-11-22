#!/usr/bin/env node
// The stub `claude` of the fixture "critic rejects then approves" (feature 153,
// US4). Proposer: writes the evidence and src/a.ts, src/b.ts, src/c.ts; once
// the critic has been called, the action named by STUB_ATTEMPT2 ("change-a",
// "delete-b", "pins-dir" or none) is applied. Critic: call 1 rejects naming
// only T004 as unmet, later calls approve (STUB_CRITIC=malformed: no verdict
// line at all). Before it answers, the critic copies the pins record it finds
// under $HOME/.specstride to $HOME/pins-at-critic-<n>.json.
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
const session = argv[argv.indexOf("--session-id") + 1];
const critic = argv.includes("--max-turns") || prompt.startsWith("You are the CRITIC"); // the parity profile argv carries no --max-turns (F125-FR-009)
const role = prompt.includes("Diagnostician") ? "diagnostician" : critic ? "critic" : "proposer";
fs.appendFileSync("prompts.jsonl", JSON.stringify({ role, prompt }) + "\n");
console.log(JSON.stringify({ type: "system", subtype: "init", tools: critic ? [] : ["Read"], session_id: session }));
const find = (dir) => {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return undefined; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isFile() && e.name === "verdict-pins.json") return p;
    if (e.isDirectory()) { const r = find(p); if (r) return r; }
  }
  return undefined;
};
if (role === "diagnostician") {
  console.log(JSON.stringify({ type: "result", result: "CASE: GROUNDING\nName the missing test of T004." }));
} else if (critic) {
  const nonce = /VERDICT ([0-9a-f]+): APPROVED/.exec(prompt)[1];
  const counter = path.join(process.env.HOME, "critic-calls.txt");
  const n = fs.existsSync(counter) ? Number(fs.readFileSync(counter, "utf8")) : 0;
  fs.writeFileSync(counter, String(n + 1));
  const pins = find(path.join(process.env.HOME, ".specstride"));
  if (pins) fs.copyFileSync(pins, path.join(process.env.HOME, `pins-at-critic-${n + 1}.json`));
  const text = process.env.STUB_CRITIC === "malformed"
    ? "T004: UNMET the assertion for src/c.ts is missing."
    : n === 0
    ? "T004: UNMET the assertion for src/c.ts is missing.\nVERDICT " + nonce + ": REJECTED"
    : "The work is done.\nVERDICT " + nonce + ": APPROVED";
  console.log(JSON.stringify({ type: "result", result: text }));
} else {
  const evidence = (/Write your evidence to (\.specstride\S+?) \(/i.exec(prompt) ?? /write (\.specstride\S+?):/i.exec(prompt))[1];
  fs.mkdirSync(path.dirname(evidence), { recursive: true });
  fs.writeFileSync(evidence, "T001 T002 T004 done\n");
  fs.mkdirSync("src", { recursive: true });
  const counter = path.join(process.env.HOME, "critic-calls.txt");
  const later = fs.existsSync(counter) && Number(fs.readFileSync(counter, "utf8")) >= 1;
  if (!later) {
    for (const f of ["a", "b", "c"]) fs.writeFileSync(`src/${f}.ts`, `export const ${f} = 1;\n`);
  } else if (process.env.STUB_ATTEMPT2 === "change-a") {
    fs.writeFileSync("src/a.ts", "export const a = 2;\n");
  } else if (process.env.STUB_ATTEMPT2 === "delete-b") {
    fs.rmSync("src/b.ts");
  } else if (process.env.STUB_ATTEMPT2 === "pins-dir") {
    const pins = find(path.join(process.env.HOME, ".specstride"));
    if (pins) { fs.rmSync(pins); fs.mkdirSync(pins); }
  }
  console.log(JSON.stringify({ type: "result", result: "ok" }));
}
