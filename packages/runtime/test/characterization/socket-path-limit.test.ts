/**
 * T009 — the path length limit of a local stream socket, measured
 * (F122-FR-021; research D-3).
 *
 * D-3 places the liveness endpoint of the lock provider at a short path and
 * has the provider refuse, with `unknown`, a path of more than 100 bytes. Its
 * rationale said the limit "is about 104 bytes on macOS and 108 on Linux, from
 * general knowledge, not measured. A task measures it." This is that task.
 *
 * What the measurement found on Linux, and what this test pins:
 *
 *   1. There IS a limit, and it is a property of the platform and not of the
 *      length of the directory the socket sits in: the test walks the length
 *      upwards inside one short directory and finds the largest path at which
 *      the socket is created WHERE IT WAS ASKED FOR.
 *   2. Past that limit the failure is SILENT, which D-3 did not know. `listen`
 *      reports success, `connect` reports success, and yet no socket exists at
 *      the path that was asked for: the platform truncated the path to the
 *      limit and bound there.
 *   3. So two endpoints whose paths are both over the limit and share their
 *      first `limit` bytes are THE SAME endpoint. The second `listen` is
 *      refused with `EADDRINUSE`, and had it been a different workspace, one
 *      run's liveness would have answered for another's — the probe would say
 *      `held-live` about an owner that is not there.
 *
 * That is what makes the guard of D-3 a guard and not a nicety: the length has
 * to be checked BEFORE the bind, because the platform will not report it. The
 * last test here asserts that the 100-byte rule of D-3 sits at or below the
 * measured limit, so the rule is sound on this platform with margin to spare.
 *
 * macOS: a skip with its reason. No macOS machine exists in this lane (the
 * owner's out-of-band ruling of 2026-09-30), so the macOS value is recorded
 * `unverified` in `specs/122-detached-runtime/research.md` under D-3 and in
 * `specs/122-detached-runtime/verification-record.md`. It is never guessed
 * here: a number from general knowledge is not a measurement.
 *
 * The measured values are written back into research.md under D-3 by hand and
 * this test fails if that record and the measurement disagree, so the research
 * file cannot drift away from the platform.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { connect, createServer } from "node:net";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..", "..", "..", "..");
const RESEARCH = join(REPO, "specs", "122-detached-runtime", "research.md");

/** The guard D-3 puts in the provider: a path over this many bytes is refused. */
const D3_GUARD_BYTES = 100;

/**
 * How far the walk goes. Well past any plausible `sun_path` of about 108
 * bytes, and well under `NAME_MAX` (255 bytes for one path component), so the
 * walk measures the socket limit and never the file-name limit.
 */
const WALK_TO = 200;

/** The reason the macOS branch of this measurement is a skip. */
const NO_MACOS_RUNNER =
  "no macOS machine: the path length limit of a local stream socket on macOS is " +
  "`unverified` (research D-3; the owner's out-of-band ruling of 2026-09-30)";

const ON_LINUX = process.platform === "linux";
const ON_MACOS = process.platform === "darwin";

/** One attempt to bind a socket at a path of exactly `totalBytes` bytes. */
type Attempt = {
  /** The path that was asked for. */
  readonly asked: string;
  /** Whether `listen` reported success. */
  readonly listened: boolean;
  /** Whether a socket exists at the path that was asked for. */
  readonly atTheAskedPath: boolean;
  /** The path of the socket that was really created, where one was. */
  readonly created: string | null;
  /** The error code, where `listen` failed. */
  readonly code: string | null;
};

/**
 * Bind one socket at a path of exactly `totalBytes` bytes inside `dir`, look
 * at what really happened, and take it down again.
 *
 * The answer is read from the FILE SYSTEM and not from the return of `listen`,
 * because the whole point of the measurement is that the two disagree past the
 * limit.
 */
async function attempt(dir: string, totalBytes: number): Promise<Attempt> {
  const prefix = `${dir}/`;
  assert.ok(
    totalBytes > Buffer.byteLength(prefix),
    `the scratch directory ${prefix} is already ${Buffer.byteLength(prefix)} bytes, so a path ` +
      `of ${totalBytes} bytes cannot be built inside it`,
  );
  // The name is ASCII, so one character is one byte and the length is exact.
  const asked = prefix + "s".repeat(totalBytes - Buffer.byteLength(prefix));
  assert.equal(Buffer.byteLength(asked), totalBytes, "the probe path is not the length asked for");

  const before = new Set(socketsIn(dir));
  const server = createServer();
  let code: string | null = null;
  let listened = false;
  try {
    await new Promise<void>((done, failed) => {
      server.once("error", failed);
      server.listen(asked, () => done());
    });
    listened = true;
  } catch (error) {
    code = (error as NodeJS.ErrnoException).code ?? (error as Error).message;
  }

  const atTheAskedPath = listened && existsSync(asked) && statSync(asked).isSocket();
  const appeared = listened ? socketsIn(dir).filter((p) => !before.has(p)) : [];
  const created = appeared.length === 1 ? (appeared[0] as string) : null;

  if (listened) await new Promise<void>((done) => server.close(() => done()));
  else server.close();
  for (const path of [asked, ...appeared]) {
    try {
      rmSync(path, { force: true });
    } catch {
      // `force` swallows a missing file but not `ENAMETOOLONG`, which a probe
      // path longer than one path component may legally raise. There is
      // nothing to remove in that case: nothing was created at that path.
    }
  }

  return Object.freeze({ asked, listened, atTheAskedPath, created, code });
}

/** The socket files directly inside a directory, as full paths. */
function socketsIn(dir: string): readonly string[] {
  return readdirSync(dir)
    .map((entry) => join(dir, entry))
    .filter((path) => {
      try {
        return statSync(path).isSocket();
      } catch {
        return false;
      }
    });
}

/** A short scratch directory, removed when the test that made it is done. */
function scratch(label: string): string {
  const dir = mkdtempSync(join(tmpdir(), `sp-${label}-`));
  return dir;
}

/**
 * The measurement itself: the largest path, in bytes, at which the socket is
 * created where it was asked for. Searched by walking upwards from a length
 * that is certainly fine, so the answer is the platform's and not a guess.
 */
async function measureLimit(dir: string): Promise<number> {
  const from = Buffer.byteLength(`${dir}/`) + 1;
  let largest = 0;
  // `WALK_TO` is far past any limit a system with a `sun_path` of about 108
  // bytes could have, and still inside one path component, so the walk never
  // trips over `NAME_MAX` instead of the limit it is looking for. The walk
  // does not stop at the first length that is not honoured — it keeps going to
  // the end, so the answer is a limit and not the first hiccup.
  for (let total = from; total <= WALK_TO; total += 1) {
    const result = await attempt(dir, total);
    if (result.atTheAskedPath) largest = total;
  }
  assert.ok(largest > 0, "no path length at all produced a socket where it was asked for");
  return largest;
}

/* ------------------------------------------------------------------ *
 * Linux: the measurement.
 * ------------------------------------------------------------------ */

/**
 * The value this lane measured on Linux, and the value research.md records
 * under D-3. It is asserted and not merely reported: this is a
 * characterization test, so a platform that answers differently is a change
 * the record has to be told about, not a test that bends to it.
 */
const MEASURED_ON_LINUX = 108;

test("CT-122-21 — the path length limit of a local stream socket, measured", async (t) => {
  if (!ON_LINUX) {
    t.skip(ON_MACOS ? "measured in the macOS test below" : NO_MACOS_RUNNER);
    return;
  }
  const dir = scratch("limit");
  try {
    const limit = await measureLimit(dir);
    assert.equal(
      limit,
      MEASURED_ON_LINUX,
      `the largest local stream socket path this Linux machine honours is ${limit} bytes, ` +
        `and D-3 of specs/122-detached-runtime/research.md records ${MEASURED_ON_LINUX}. ` +
        `Record the new measurement in D-3 rather than changing this number alone`,
    );
    // One byte over the limit is where the silence starts.
    const over = await attempt(dir, limit + 1);
    assert.equal(over.listened, true, "a path one byte over the limit did not even listen");
    assert.equal(
      over.atTheAskedPath,
      false,
      "a path one byte over the limit produced a socket where it was asked for, so the limit " +
        "measured above is not the limit",
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CT-122-21 — past the limit the failure is SILENT: the path is truncated", async (t) => {
  if (!ON_LINUX) {
    t.skip(NO_MACOS_RUNNER);
    return;
  }
  const dir = scratch("truncate");
  try {
    const over = await attempt(dir, MEASURED_ON_LINUX + 22);
    assert.equal(over.listened, true, "`listen` reported a failure; the point is that it does not");
    assert.equal(over.code, null);
    assert.equal(
      over.atTheAskedPath,
      false,
      "no socket must exist at the path that was asked for: it is over the limit",
    );
    assert.notEqual(over.created, null, "a socket was created somewhere; the test must find it");
    const created = over.created as string;
    assert.equal(
      Buffer.byteLength(created),
      MEASURED_ON_LINUX,
      "the socket that was really created is not the length of the limit, so the platform did " +
        "something other than truncate",
    );
    assert.ok(
      over.asked.startsWith(created),
      "the socket that was really created is not a prefix of the path that was asked for",
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CT-122-21 — two paths over the limit that share a prefix are ONE endpoint", async (t) => {
  if (!ON_LINUX) {
    t.skip(NO_MACOS_RUNNER);
    return;
  }
  const dir = scratch("collide");
  const total = MEASURED_ON_LINUX + 20;
  const prefix = `${dir}/`;
  const stem = "c".repeat(MEASURED_ON_LINUX - Buffer.byteLength(prefix));
  // Two DIFFERENT paths of the same length that agree on their first
  // `MEASURED_ON_LINUX` bytes and differ after them.
  const first = prefix + stem + "a".repeat(total - MEASURED_ON_LINUX);
  const second = prefix + stem + "b".repeat(total - MEASURED_ON_LINUX);
  assert.notEqual(first, second, "the two probe paths must differ");
  assert.equal(
    first.slice(0, MEASURED_ON_LINUX),
    second.slice(0, MEASURED_ON_LINUX),
    "the two probe paths must agree on their first `limit` bytes",
  );

  const one = createServer();
  const two = createServer();
  try {
    await new Promise<void>((done, failed) => {
      one.once("error", failed);
      one.listen(first, () => done());
    });
    const outcome = await new Promise<string>((done) => {
      two.once("error", (error) => done((error as NodeJS.ErrnoException).code ?? "error"));
      two.listen(second, () => done("bound as well"));
    });
    assert.equal(
      outcome,
      "EADDRINUSE",
      "a second socket at a DIFFERENT path over the limit was accepted; it must collide with " +
        "the first, because both truncate to the same bytes. If this ever stops being true the " +
        "collision is gone and D-3 may be relaxed",
    );
    // And a connection to the second path reaches the FIRST owner, which is
    // the mis-answer the guard of D-3 exists to prevent.
    const reached = await new Promise<boolean>((done) => {
      const client = connect(second, () => {
        client.end();
        done(true);
      });
      client.once("error", () => done(false));
    });
    assert.equal(
      reached,
      true,
      "a connection to the second path did not reach the first owner; the collision would then " +
        "be noisy rather than silent",
    );
  } finally {
    try {
      two.close();
    } catch {
      /* it never bound */
    }
    await new Promise<void>((done) => one.close(() => done()));
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CT-122-21 — the 100-byte guard of D-3 sits at or below the measured limit", async (t) => {
  if (!ON_LINUX) {
    t.skip(NO_MACOS_RUNNER);
    return;
  }
  const dir = scratch("guard");
  try {
    assert.ok(
      D3_GUARD_BYTES <= MEASURED_ON_LINUX,
      `D-3 refuses a path of more than ${D3_GUARD_BYTES} bytes, which is above the measured ` +
        `limit of ${MEASURED_ON_LINUX}: the guard would let a path through that the platform ` +
        `truncates`,
    );
    // The guard is sound with margin: a path AT the guard really binds.
    const atTheGuard = await attempt(dir, D3_GUARD_BYTES);
    assert.equal(
      atTheGuard.atTheAskedPath,
      true,
      `a path of exactly ${D3_GUARD_BYTES} bytes — the largest D-3 allows — did not produce a ` +
        `socket where it was asked for, so the guard is too generous`,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

/* ------------------------------------------------------------------ *
 * macOS: a skip with its reason, because no machine exists.
 * ------------------------------------------------------------------ */

test(
  "CT-122-21 — the path length limit on macOS",
  { skip: ON_MACOS ? false : NO_MACOS_RUNNER },
  async () => {
    // Runs only on a macOS machine. On every other platform it is a skip with
    // the reason above, and the macOS value stays `unverified` in D-3. Nothing
    // here guesses a number: the measurement is the same walk as on Linux.
    const dir = scratch("macos");
    try {
      const limit = await measureLimit(dir);
      assert.ok(limit > D3_GUARD_BYTES, `the macOS limit measured ${limit} bytes`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  },
);

/* ------------------------------------------------------------------ *
 * The record in research.md cannot drift from the measurement.
 * ------------------------------------------------------------------ */

test("CT-122-21 — D-3 of research.md records the measurement and the macOS skip", () => {
  const text = readFileSync(RESEARCH, "utf8");
  const d3 = text.slice(text.indexOf("### D-3"), text.indexOf("### D-4"));
  assert.ok(d3.length > 0, "D-3 was not found in specs/122-detached-runtime/research.md");

  assert.match(
    d3,
    new RegExp(`${MEASURED_ON_LINUX}\\s*bytes`),
    `D-3 does not record the measured Linux limit of ${MEASURED_ON_LINUX} bytes`,
  );
  assert.match(d3, /\bmeasured\b/, "D-3 does not say that the Linux value was measured");
  assert.match(
    d3,
    /truncat/i,
    "D-3 does not record that a path over the limit is silently truncated, which is the reason " +
      "the length has to be checked before the bind",
  );
  assert.match(
    d3,
    /macOS[^.]*unverified|unverified[^.]*macOS/,
    "D-3 does not record the macOS value as `unverified`",
  );
  assert.match(
    d3,
    /no macOS machine|no macOS runner/,
    "D-3 does not give the reason the macOS value is unverified",
  );
  assert.ok(
    d3.includes(`${D3_GUARD_BYTES} bytes`),
    `D-3 no longer states the ${D3_GUARD_BYTES}-byte guard this test checks`,
  );
});
