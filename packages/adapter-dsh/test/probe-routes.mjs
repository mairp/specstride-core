// Probe of the two model routes of spec 154's run, through the adapter's own overlay.
// Usage: node packages/adapter-dsh/test/probe-routes.mjs  (from the repository root)
import { spawnSync } from "node:child_process";
import { homedir } from "node:os";
import { buildOverlay } from "../src/overlay/index.ts";

const realHome = process.env.DSH_HOME ?? `${homedir()}/.dsh`;
const routes = [
  { role: "proposer", provider: "zai", model: "glm-5.3-flash", effort: "max" },
  { role: "critic", provider: "compass-gpt5-high", model: "gpt-5", effort: null },
];
let failed = 0;
for (const r of routes) {
  const overlay = buildOverlay({
    realHome,
    reference: { provider: r.provider, model: r.model },
    effort: r.effort,
  });
  const started = Date.now();
  const run = spawnSync(
    "dsh",
    ["--profile", "headless", "Reply with exactly the word OK and nothing else."],
    {
      env: { ...process.env, DSH_HOME: overlay.home },
      encoding: "utf8",
      timeout: 180_000,
    },
  );
  const out = (run.stdout ?? "").trim().replace(/\s+/g, " ").slice(0, 120);
  const err = (run.stderr ?? "").trim().replace(/\s+/g, " ").slice(0, 160);
  const ok = run.status === 0 && /OK/i.test(out);
  if (!ok) failed += 1;
  console.log(
    `[PROBE] ${r.role} ${r.provider}/${r.model} status=${run.status} ${Date.now() - started}ms ok=${ok} out=${JSON.stringify(out)}${ok ? "" : ` err=${JSON.stringify(err)}`}`,
  );
  overlay.remove();
}
process.exit(failed === 0 ? 0 : 1);
