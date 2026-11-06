/**
 * T063 — the archive module follows
 * `specs/122-detached-runtime/contracts/state-archive.schema.json`
 * (schema id `specstride.state-archive/1`, feature 100 annex B §B.20).
 *
 * `packages/runtime/src/state/archive.ts` carries the schema's rules as code
 * rather than loading the schema file, because the product must not reach into
 * `specs/` at run time. This test is the link that makes that safe: it reads
 * the CONTRACT and compares it with what the module declares, so that a change
 * to the contract that the module does not follow turns the suite red.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ARCHIVE_REQUIRED_FIELDS,
  ARCHIVE_SCHEMA_FILE,
  ARCHIVE_SCHEMA_ID,
  MANIFEST_REQUIRED_FIELDS,
  MEMBER_NAMES,
  MEMBER_NAMES_REQUIRED,
  buildArchive,
  compressArchive,
  decompressArchive,
  validateArchive,
  verifyArchive,
} from "../../src/state/archive.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
/** `packages/runtime/test/unit` → the repository root. */
const REPO = resolve(HERE, "..", "..", "..", "..");

type Schema = {
  readonly $id: string;
  readonly required: readonly string[];
  readonly additionalProperties: boolean;
  readonly properties: Record<string, Record<string, unknown>>;
};

function theContract(): Schema {
  return JSON.parse(readFileSync(join(REPO, ARCHIVE_SCHEMA_FILE), "utf8")) as Schema;
}

test("T063 — the archive module declares exactly what the contract schema requires", () => {
  const schema = theContract();
  assert.equal(
    ARCHIVE_SCHEMA_FILE,
    "specs/122-detached-runtime/contracts/state-archive.schema.json",
    "the module names the contract it is written from",
  );
  assert.equal(schema.$id, `urn:specstride:schema:${ARCHIVE_SCHEMA_ID}`);
  assert.equal(
    (schema.properties["schema"] as { const?: string }).const,
    ARCHIVE_SCHEMA_ID,
    "the `schema` field of the contract is the const the module uses",
  );
  assert.deepEqual([...ARCHIVE_REQUIRED_FIELDS], [...schema.required]);
  assert.equal(
    schema.additionalProperties,
    false,
    "the contract allows no further top-level field",
  );

  const manifest = schema.properties["manifest"] as { required: readonly string[] };
  assert.deepEqual([...MANIFEST_REQUIRED_FIELDS], [...manifest.required]);

  const members = schema.properties["members"] as {
    required: readonly string[];
    properties: Record<string, unknown>;
  };
  assert.deepEqual([...MEMBER_NAMES_REQUIRED], [...members.required]);
  assert.deepEqual([...MEMBER_NAMES].sort(), Object.keys(members.properties).sort());
});

test("T063 — a document that satisfies the contract validates, and each missing piece is refused", () => {
  const archive = buildArchive({
    feature: "122-detached-runtime",
    workspaceId: "w".repeat(32),
    productVersion: "1.0.0",
    createdAt: "2026-10-03T00:00:00.000Z",
    members: {
      approvals: [],
      ledger: [],
      learning: { decisions: "{}", events: "" },
      keys: { approval: "k" },
    },
    approvalKey: "k",
  });
  assert.ok(validateArchive(archive).ok);
  assert.ok(verifyArchive(archive).ok, JSON.stringify(verifyArchive(archive).failures));

  for (const field of ARCHIVE_REQUIRED_FIELDS) {
    const without = { ...(archive as unknown as Record<string, unknown>) };
    delete without[field];
    const read = validateArchive(without);
    assert.equal(read.ok, false, `without \`${field}\` the archive is refused`);
  }
  for (const field of MANIFEST_REQUIRED_FIELDS) {
    const manifest = { ...(archive.manifest as unknown as Record<string, unknown>) };
    delete manifest[field];
    assert.equal(
      validateArchive({ ...archive, manifest }).ok,
      false,
      `a manifest without \`${field}\` is refused`,
    );
  }
  for (const name of MEMBER_NAMES_REQUIRED) {
    const members = { ...(archive.members as unknown as Record<string, unknown>) };
    delete members[name];
    assert.equal(
      validateArchive({ ...archive, members }).ok,
      false,
      `members without \`${name}\` are refused`,
    );
  }
  assert.equal(
    validateArchive({ ...archive, invented: 1 }).ok,
    false,
    "a further top-level field is refused (`additionalProperties: false`)",
  );
});

test("T063 — compression is a round trip, and the bytes are not the document", () => {
  const archive = buildArchive({
    feature: "f",
    workspaceId: "w",
    productVersion: "1",
    createdAt: "2026-10-03T00:00:00.000Z",
    members: { approvals: [], ledger: [], learning: {}, keys: { approval: "k" } },
    approvalKey: "k",
  });
  const bytes = compressArchive(archive);
  assert.notEqual(bytes.toString("utf8"), JSON.stringify(archive));
  const read = decompressArchive(bytes);
  assert.ok(read.ok);
  if (!read.ok) return;
  assert.equal(read.archive.sig, archive.sig);
  assert.deepEqual(read.archive.manifest.hashes, archive.manifest.hashes);
  // Two builds of the same state give the same bytes: the text is canonical.
  assert.equal(compressArchive(archive).toString("base64"), bytes.toString("base64"));
});
