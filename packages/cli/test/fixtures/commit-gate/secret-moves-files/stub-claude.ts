#!/usr/bin/env node
// Fixture `secret-moves-files` (specs/152-commit-backpressure quickstart.md,
// scenario 4): the proposer plants the secret in `a.ts` on attempt 1, `b.ts`
// on attempt 2 and `c.ts` on attempt 3 (and on every later attempt), and the
// critic approves every time — so each blocked attempt has a DIFFERENT
// signature, no halt of the commit-gate table fires, and the reject limit
// alone bounds the retries (F152-FR-005).
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
  // The secret MOVES: a different file per attempt, so a different signature.
  const files = ["a.ts", "b.ts", "c.ts"];
  for (const file of files) fs.rmSync(file, { force: true });
  const target = files[Math.min(attempt - 1, files.length - 1)];
  fs.writeFileSync(target, `token = ${process.env.STUB_SECRET ?? ""}\n`);
  const tasks = "specs/001-one/tasks.md";
  fs.writeFileSync(tasks, fs.readFileSync(tasks, "utf8").replace("- [ ]", "- [x]"));
  console.log(JSON.stringify({ type: "result", result: "ok" }));
}
