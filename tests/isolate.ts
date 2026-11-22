/**
 * Runs a test command in its own PID namespace when it runs as root on Linux.
 *
 * Tests of this repository start and signal process groups. A wrong group id (0, 1 or
 * -1) sent as root on the host kills every process, Proxmox's watchdog-mux with them,
 * and the host resets (2026-10-02). Inside the namespace, `kill -1` reaches only the
 * processes of this run. A nested call (a workspace script under the root `npm test`)
 * runs in the namespace already. SPECSTRIDE_TEST_NO_ISOLATE=1 skips the namespace;
 * never set it as root on a shared host.
 *
 * Usage: node <path>/tests/isolate.ts <command> [args...]
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// The private tmpfs of the namespace covers the runs that get one. The fallback
// runs — non-root hosts, sandboxes without the mount, SPECSTRIDE_TEST_NO_ISOLATE=1
// — still build their mkdtemp fixtures in the shared /tmp, and a suite that dies
// there leaks its directories into the host's tmp forever: nothing else sweeps
// tmp, and the leaks accumulate (2026-11-17 01:23–01:31Z: ~2234 stale
// `specstride-*` directories pushed /tmp inodes toward ENOSPC and stalled the
// running engine's own fixture creation). Before every command, the entries that
// match the repository's mkdtemp shapes AND are older than the age floor are
// removed. The floor keeps every live suite's directories — this run's included
// — untouched: a suite's own fixtures are minutes old, and the concurrently
// running fixtures of other runs stay under the floor too.
//
// Shapes: the repository's fixtures always end in mkdtemp's six random
// characters appended to a lowercase kebab prefix from a known family
// (`specstride-*`, `par`/`par<N>-*`). Nothing outside the family, no files,
// no symlinks, nothing outside tmpdir, and never when tmpdir itself does not
// look like a temporary directory.
const REAP_PATTERNS = [/^specstride-[a-z0-9-]+-[A-Za-z0-9]{6}$/, /^par[0-9]*-[a-z0-9-]+-[A-Za-z0-9]{6}$/];
const REAP_MIN_AGE_MS = Number(process.env.SPECSTRIDE_TEST_REAP_MIN_AGE_MS ?? 30 * 60 * 1000);
// Test-only override of the swept directory; production always sweeps tmpdir.
const REAP_DIR = process.env.SPECSTRIDE_TEST_REAP_DIR ?? tmpdir();

const reapStaleFixtureDirectories = (): void => {
  if (REAP_MIN_AGE_MS < 0) return;
  if (!/^\//.test(REAP_DIR)) return;
  if (REAP_DIR !== tmpdir() && !REAP_DIR.startsWith(`${tmpdir()}/`)) {
    // The override is for tests: refuse to sweep anywhere but under tmpdir.
    return;
  }
  let entries: string[];
  try {
    entries = readdirSync(REAP_DIR);
  } catch {
    return;
  }
  const cutoff = Date.now() - REAP_MIN_AGE_MS;
  for (const name of entries) {
    if (!REAP_PATTERNS.some((pattern) => pattern.test(name))) continue;
    const path = join(REAP_DIR, name);
    let stat;
    try {
      stat = statSync(path); // follows symlinks: a symlink is reaped as itself, never recursed
    } catch {
      continue;
    }
    if (!stat.isDirectory() || stat.mtimeMs > cutoff) continue;
    try {
      rmSync(path, { recursive: true, force: true });
      process.stderr.write(`isolate.ts: reaped stale fixture ${path}\n`);
    } catch (error) {
      process.stderr.write(`isolate.ts: could not reap ${path}: ${String(error)}\n`);
    }
  }
};

const argv = process.argv.slice(2);
if (argv.length === 0) {
  process.stderr.write("isolate.ts: no command given\n");
  process.exit(2);
}

const isRoot = typeof process.getuid === "function" && process.getuid() === 0;
const wanted =
  process.platform === "linux" &&
  isRoot &&
  !process.env.SPECSTRIDE_TEST_NO_ISOLATE &&
  !process.env.SPECSTRIDE_TEST_ISOLATED;

// The first process of a PID namespace is its init: orphans are re-parented to it and
// stay zombies until it reaps them. A test runner as PID 1 does not reap, so a process
// group a test ended can still look alive to `kill(-group, 0)`. tini reaps; without it
// the command is PID 1 itself.
const reaper = ["/usr/bin/tini", "/usr/sbin/tini", "/sbin/tini"].find((path) => existsSync(path));
const init = reaper === undefined ? [] : [reaper, "-s", "--"];

// Each isolated run also gets a PRIVATE /tmp: a fresh tmpfs mounted over the host's
// inside the same mount namespace `--mount-proc` already built. The suites build
// mkdtemp fixtures by the hundreds and cannot reap them on every failure path; on an
// unattended campaign the leftovers accumulated into the millions and the host's tmpfs
// ran out of inodes — ENOSPC on every small write (2026-11-17: 4.19M/4.19M inodes, the
// engine's agent and critic calls died of it mid-campaign). A namespace-private tmpfs
// ends the leak at the source: whatever a run leaves behind is unmounted and freed
// with the namespace at its end, and nothing outside the run can be touched. If the
// mount is refused, the run falls back to the shared /tmp exactly as before.
const mountPrivateTmp =
  'mount -t tmpfs -o size=4g,mode=1777 tmpfs /tmp 2>/dev/null || true; exec "$0" "$@"';

const [command, args] = wanted
  ? [
      "unshare",
      [
        "--fork",
        "--pid",
        "--mount-proc",
        "--kill-child",
        "--",
        ...init,
        "/bin/sh",
        "-c",
        mountPrivateTmp,
        ...argv,
      ],
    ]
  : [argv[0], argv.slice(1)];

// The tests are hermetic: the run-selection variables of the host (the engine
// sets them for its own passes) must not choose a feature, a model or a critic
// inside a test that builds its own fixture. The limits switch belongs in the
// same company: `SPECSTRIDE_LIMITS=off` is a ruling of the OPERATOR's launch —
// under it the engine refuses to arm its pass watchdog by contract
// (`packages/kernel/src/limits`) — and a test that verifies the watchdog must
// not inherit the operator's launch. Without the strip, every campaign that
// runs under limits-off (the owner's ruling) fails its own verification suite
// on the ceiling-enforcement tests forever (152 phase 1, 2026-11-11: three
// attempts × `npm test -> failed`, the hung-pass stub never signalled).
const env: NodeJS.ProcessEnv = { ...process.env };
for (const name of [
  "SPECSTRIDE_FEATURE",
  "SPECSTRIDE_MODEL",
  "SPECSTRIDE_CRITIC",
  "SPECSTRIDE_PROPOSER",
  "SPECSTRIDE_BIN",
  "SPECSTRIDE_LIMITS",
]) {
  delete env[name];
}

reapStaleFixtureDirectories();

const result = spawnSync(command, args, {
  stdio: "inherit",
  env: wanted ? { ...env, SPECSTRIDE_TEST_ISOLATED: "1" } : env,
});

if (result.error) {
  const why = wanted ? "refusing to run the tests as root without unshare(1)" : "cannot start";
  process.stderr.write(`isolate.ts: ${why}: ${result.error.message}\n`);
  process.exit(2);
}
if (result.signal) process.kill(process.pid, result.signal);
process.exit(result.status ?? 1);
