import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fixture154 } from "/root/specstride-core/tests/inertness/154/helpers.ts";
const f = fixture154();
const home = process.env.HOME!;
const child = spawnSync(process.execPath, ["/root/specstride-core/packages/cli/bin/specstride", "run"], {
  cwd: f.work,
  env: { ...process.env, SPECSTRIDE_HOST_LIMITS: "on", SPECSTRIDE_HOST_CHECKS_CONCURRENT: "1" },
  encoding: "utf8",
  timeout: 120000,
});
console.log("EXIT", child.status);
const say = (child.stdout ?? "") + (child.stderr ?? "");
console.log("SAY-HEAD", say.split("\n").slice(0, 14).join(" | "));
console.log(say.split("\n").filter(l => l.includes("host limits") || l.includes("temporary root")).join("\n"));
const walk = (dir: string): string[] => {
  let out: string[] = [];
  let entries: string[] = [];
  try { entries = readdirSync(dir).sort(); } catch { return out; }
  for (const e of entries) {
    const full = join(dir, e);
    if (e === "events.jsonl") out.push(full);
    else out = out.concat(walk(full));
  }
  return out;
};
for (const file of walk(home)) {
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (line.trim() === "") continue;
    const rec = JSON.parse(line);
    if (String(rec.type).includes("slot") || rec.type === "verification.started") console.log("EVT", rec.type, JSON.stringify(rec.data).slice(0, 140));
  }
}
f.restore();
