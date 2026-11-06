/**
 * The `stub-bin` links are relative.
 *
 * What the test proves.
 *
 * - **the driver writes a relative link**: `buildStubBin` links each stub by a path
 *   relative to the `stub-bin`, and a second build over the same directory leaves
 *   such a link as it is;
 * - **no committed fixture link is absolute**: every symbolic link git tracks under
 *   `fixtures/` has a relative target that resolves, so a fixture works in every
 *   checkout and not only in the one that recorded it.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, lstatSync, mkdtempSync, readlinkSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";

import { ORACLE_ROOT } from "../../src/index.ts";
import { buildStubBin } from "../../src/run/driver.ts";
import { stubExecutableNames } from "../../stubs/lib/names.ts";

test("buildStubBin links each stub by a relative path, and keeps such a link", () => {
  const source = mkdtempSync(join(tmpdir(), "oracle-stub-source-"));
  for (const name of stubExecutableNames())
    writeFileSync(join(source, name), "#!/usr/bin/env node\n");
  const stubBin = mkdtempSync(join(tmpdir(), "oracle-bin-relative-"));
  const linked = buildStubBin(stubBin, source, "reference");
  assert.ok(linked.length > 0);
  const before = linked.map((link) => [link, lstatSync(link).ino] as const);
  for (const link of linked) {
    const target = readlinkSync(link);
    assert.ok(!isAbsolute(target), `${link} -> ${target} is absolute`);
    assert.equal(resolve(dirname(link), target), join(source, link.slice(stubBin.length + 1)));
  }
  buildStubBin(stubBin, source, "reference");
  for (const [link, ino] of before) assert.equal(lstatSync(link).ino, ino, `${link} was re-linked`);
});

test("no symbolic link git tracks under fixtures/ is absolute or dangling", () => {
  const listed = spawnSync("git", ["ls-files", "-s", "fixtures"], {
    cwd: ORACLE_ROOT,
    encoding: "utf8",
  });
  assert.equal(listed.status, 0, listed.stderr);
  const links = listed.stdout
    .split("\n")
    .filter((line) => line.startsWith("120000 "))
    .map((line) => join(ORACLE_ROOT, line.slice(line.indexOf("\t") + 1)));
  assert.ok(links.length > 0, "the fixtures hold stub-bin links");
  const wrong = links.filter((link) => isAbsolute(readlinkSync(link)) || !existsSync(link));
  assert.deepEqual(wrong.slice(0, 5), [], `${wrong.length} fixture links are absolute or dangling`);
});
