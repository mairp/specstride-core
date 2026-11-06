/**
 * T260 — the static test "Schema field" (annex X, §X.10; F100-FR-225;
 * F100-SC-003, F100-SC-007; quickstart.md scenario 3, the row "Schema field").
 *
 * Every logical name of the control plane (root `control` in
 * `data/layout.json`) whose content is a record has a schema file under
 * `schemas/` with a required `schema` property, or a row of
 * `data/further-schema-ids.json`, or is the read model of EP-09 whose schema
 * feature 129 delivers (`specstride.view/1`, annex G §G.6). The one stated
 * exception is `specstride.inbox/1`, whose empty stop request carries no
 * field (annex B §B.11, F100-FR-065). And every validator of the package
 * refuses a different major.
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { readRecord, schemaIdOfLogicalName } from "@specstride/contracts/records/validate";
import {
  ROOT,
  contractsData,
  finding,
  readJson,
  type CheckOptions,
  type Finding,
  type StaticCheck,
} from "./kit.ts";

/** The data file of the table of §B.5. */
export const LAYOUT_FILE = "packages/contracts/data/layout.json";
/** The data file of the further schema ids of §B.20. */
export const FURTHER_IDS_FILE = "packages/contracts/data/further-schema-ids.json";

/** The read model of EP-09; feature 129 delivers its schema (annex G §G.6). */
export const EP_09_READ_MODEL = "specstride.view/1" as const;

/**
 * The one stated exception: the empty stop request of `specstride.inbox/1`
 * carries no field (annex B §B.11, F100-FR-065).
 */
export const EMPTY_STOP_REQUEST_SCHEMA = "specstride.inbox/1" as const;

type Layout = {
  logicalNames: { logicalName: string; root: string; content: string }[];
};
type FurtherIds = { schemaIds: { "Schema id": string }[] };

/** A content cell that names a schema id: the content is a record. */
const SCHEMA_ID_IN_CONTENT = /`(specstride[.-][a-z-]+\/[a-z]?\d+)`/;

/**
 * The property of a schema that carries the schema id. It is `schema` for
 * every record of annex B (F100-FR-048); a record that keeps its as-is name
 * names it otherwise — the yield artifact `specstride-pass-yield/v1` of annex
 * D §D.6 carries it in `contract`. The property is found in the schema itself:
 * it is the one whose `description` is "Schema id".
 */
export const DEFAULT_SCHEMA_ID_PROPERTY = "schema" as const;

export function schemaIdProperty(schema: {
  properties?: Record<string, { description?: string }>;
}): string {
  for (const [name, property] of Object.entries(schema.properties ?? {})) {
    if (String(property.description ?? "").trim() === "Schema id") return name;
  }
  return DEFAULT_SCHEMA_ID_PROPERTY;
}

/** Every schema file of the package, with its required properties. */
export function schemaFiles(
  root: string = ROOT,
): Map<string, { required: string[]; file: string; idProperty: string }> {
  const out = new Map<string, { required: string[]; file: string; idProperty: string }>();
  const dir = join(root, "packages", "contracts", "schemas");
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of names) {
    if (!name.endsWith(".schema.json")) continue;
    const schema = readJson<{
      "x-schema-id"?: string;
      required?: string[];
      properties?: Record<string, { description?: string }>;
    }>(join(dir, name));
    const id = schema["x-schema-id"];
    if (id === undefined) continue;
    out.set(id, {
      required: schema.required ?? [],
      file: `packages/contracts/schemas/${name}`,
      idProperty: schemaIdProperty(schema),
    });
  }
  return out;
}

/** F100-FR-225 — the schema field of every record of the control plane. */
export function checkSchemaField(options: CheckOptions = {}): readonly Finding[] {
  const root = options.root ?? ROOT;
  const findings: Finding[] = [];
  const layout = contractsData<Layout>("layout.json", root);
  const further = new Set(
    contractsData<FurtherIds>("further-schema-ids.json", root).schemaIds.map((r) =>
      r["Schema id"].replace(/`/g, "").trim(),
    ),
  );
  const schemas = schemaFiles(root);

  for (const row of layout.logicalNames) {
    if (!row.root.startsWith("control")) continue;
    const id = SCHEMA_ID_IN_CONTENT.exec(row.content)?.[1];
    if (id === undefined) continue; // the content is no record of this package
    if (id === EP_09_READ_MODEL) continue; // feature 129 delivers this schema
    if (id === EMPTY_STOP_REQUEST_SCHEMA) {
      // The stated exception: the empty stop request carries no field. The
      // schema itself still exists and still declares `schema` as a property.
      const schema = schemas.get(id);
      if (schema === undefined) {
        findings.push(
          finding(
            LAYOUT_FILE,
            0,
            `the logical name \`${row.logicalName}\` names the schema \`${id}\`, for ` +
              `which the package holds no schema file (F100-FR-225)`,
            id,
          ),
        );
      }
      continue;
    }
    if (further.has(id)) continue; // a row of §B.20; its owner delivers the file
    const schema = schemas.get(id);
    if (schema === undefined) {
      findings.push(
        finding(
          LAYOUT_FILE,
          0,
          `the logical name \`${row.logicalName}\` of the control plane names the schema ` +
            `\`${id}\`, for which the package holds no schema file and which has no row ` +
            `of \`data/further-schema-ids.json\` (F100-FR-225)`,
          id,
        ),
      );
      continue;
    }
    if (!schema.required.includes(schema.idProperty)) {
      findings.push(
        finding(
          schema.file,
          0,
          `the schema \`${id}\` of the logical name \`${row.logicalName}\` does not ` +
            `require the property \`${schema.idProperty}\` that carries its schema id; ` +
            `every file of the control plane carries it (F100-FR-048, F100-FR-225)`,
          id,
        ),
      );
    }
  }
  return Object.freeze(findings);
}

/**
 * F100-FR-225 — every validator of the package refuses a different major. The
 * check reads a record of every logical name whose content is a record, with
 * its major bumped, and requires the refusal.
 */
export function checkValidatorsRefuseADifferentMajor(): readonly Finding[] {
  const findings: Finding[] = [];
  for (const [logicalName, schemaId] of Object.entries(schemaIdOfLogicalName)) {
    const slash = schemaId.lastIndexOf("/");
    const base = schemaId.slice(0, slash);
    const major = schemaId.slice(slash + 1);
    const next = /^\d+$/.test(major) ? String(Number(major) + 1) : `${major}x`;
    const bumped = `${base}/${next}`;
    let refused = false;
    try {
      readRecord(logicalName, { schema: bumped });
    } catch {
      refused = true;
    }
    if (!refused) {
      findings.push(
        finding(
          "packages/contracts/src/records/validate.ts",
          0,
          `the validator of the logical name \`${logicalName}\` accepted the schema id ` +
            `\`${bumped}\`, whose major differs from the one it supports ` +
            `(F100-FR-049, F100-FR-225)`,
          bumped,
        ),
      );
    }
  }
  return Object.freeze(findings);
}

/** The check the runner of T264 registers. */
export const schemaFieldCheck: StaticCheck = {
  name: "Schema field",
  covers: ["F100-FR-225", "F100-SC-003", "F100-SC-007"],
  run(options: CheckOptions = {}) {
    return Object.freeze([...checkSchemaField(options), ...checkValidatorsRefuseADifferentMajor()]);
  },
};

export default schemaFieldCheck;
