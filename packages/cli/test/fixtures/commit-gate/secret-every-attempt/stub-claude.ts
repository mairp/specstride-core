#!/usr/bin/env node
// Fixture `secret-every-attempt` (specs/152-commit-backpressure quickstart.md,
// scenario 3): the proposer plants THE SAME `ghp_` + 36 characters in
// `config.ts` on EVERY attempt, and the critic approves every time — so the
// commit gate blocks twice with the same signature and the run must halt
// blocked on a human after exactly 2 phase attempts (F152-FR-006, SC-003).
//
// The stub writes the prompts it saw to `STUB_DIR`, outside the work tree.
const fs = require("node:fs");
const path = require("node:path");
const argv = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
const out = process.env.STUB_DIR || ".";
if (process.env.STUB_LOG) fs.appendFileSync(path.join(out, "stub-argv.log"), JSON.stringify(process.argv) + "\n");
const write_ = (name, text) => fs.writeFileSync(path.join(out, name), text);
const session = argv[argv.indexOf("--session-id") + 1];
const critic = argv.includes("--max-turns");
console.log(
  JSON.stringify({
    type: "system",
    subtype: "init",
    tools: critic ? [] : ["Read"],
    session_id: session,
  }),
);
if (prompt.includes("Diagnostician")) {
  console.log(
    JSON.stringify({
      type: "result",
      result: "CASE: GROUNDING\nName the missing test of T001.",
    }),
  );
} else if (critic) {
  const criticCall =
    Number(
      fs.existsSync(path.join(out, "stub-critic-count"))
        ? fs.readFileSync(path.join(out, "stub-critic-count"), "utf8")
        : "0",
      10,
    ) + 1;
  write_("stub-critic-count", String(criticCall));
  write_(`seen-by-critic-${String(criticCall)}.txt`, prompt);
  const allNonces = [...prompt.matchAll(/VERDICT ([0-9a-f]+)/g)];
  const nonce = allNonces.length > 0 ? allNonces[allNonces.length - 1][1] : "0".repeat(16);
  console.log(
    JSON.stringify({
      type: "result",
      result: "T001 judged.\nVERDICT " + nonce + ": APPROVED",
    }),
  );
} else {
  const attempt = Number(/This is attempt (\d+)/.exec(prompt)?.[1] ?? "1");
  write_(`seen-by-proposer-${String(attempt)}.txt`, prompt);
  write_(`session-${String(attempt)}.txt`, session ?? "");
  const evidence = /write (\.\S*?specstride\S+?):/i.exec(prompt)[1];
  fs.mkdirSync(path.dirname(evidence), { recursive: true });
  fs.writeFileSync(evidence, "T001 done\n");
  // THE SAME secret, THE SAME file, every attempt: the signature never moves.
  fs.writeFileSync("config.ts", `token = ${process.env.STUB_SECRET ?? ""}\n`);
  const tasks = "specs/001-one/tasks.md";
  fs.writeFileSync(tasks, fs.readFileSync(tasks, "utf8").replace("- [ ]", "- [x]"));
  console.log(JSON.stringify({ type: "result", result: "ok" }));
}
