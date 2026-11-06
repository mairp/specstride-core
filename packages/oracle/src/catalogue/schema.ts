/**
 * T005 — the schema checker of the data files of the oracle (F141-FR-013).
 *
 * The schemas of `packages/oracle/data/schemas/` are development interfaces of
 * the oracle and no contracts of the product: they carry
 * `urn:specstride:schema:internal:141:<name>/<major>` and the package is never
 * shipped (W-100-16). They use a small, closed part of JSON Schema 2020-12, and
 * this module implements exactly that part.
 *
 * Why not a general validator: the oracle is a development tool at layer `dev`
 * and the check must be able to say that it checked everything. A general
 * validator that meets an unknown keyword ignores it and reports a pass;
 * `assertSupported` here refuses the schema instead, so a keyword that arrives
 * with a later schema cannot pass unchecked. The keywords are those the six
 * schema files use, and the six are checked against this list at load
 * (`data.ts`, `loadOracleData`).
 */

/** The keywords this checker implements. A schema that uses another is refused. */
export const SUPPORTED_KEYWORDS = [
  "$schema",
  "$id",
  "title",
  "description",
  "type",
  "const",
  "enum",
  "pattern",
  "minimum",
  "required",
  "properties",
  "additionalProperties",
  "items",
  "minItems",
  "maxItems",
] as const;

/** The types the checker knows. */
export const SUPPORTED_TYPES = [
  "object",
  "array",
  "string",
  "integer",
  "number",
  "boolean",
  "null",
] as const;

export type JsonSchema = Record<string, unknown>;

/** A schema the checker cannot carry out, which is an error and never a pass. */
export class SchemaUnsupportedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SchemaUnsupportedError";
  }
}

/** One thing a value got wrong, with the path inside the value. */
export type SchemaViolation = {
  /** `(root)`, or `/pins/0/commit`. */
  readonly path: string;
  /** The keyword that was not met. */
  readonly keyword: string;
  /** What is wrong, in words. */
  readonly message: string;
};

/**
 * Refuse a schema that uses a keyword or a type this checker does not
 * implement, at every depth. Called on every schema file at load, so an
 * unchecked keyword can never reach a validation.
 */
export function assertSupported(schema: unknown, at = "(root)"): void {
  if (schema === true || schema === false) return;
  if (typeof schema !== "object" || schema === null || Array.isArray(schema)) {
    throw new SchemaUnsupportedError(`${at}: a schema is an object`);
  }
  const node = schema as JsonSchema;
  for (const keyword of Object.keys(node)) {
    if (!(SUPPORTED_KEYWORDS as readonly string[]).includes(keyword)) {
      throw new SchemaUnsupportedError(
        `${at}: the keyword "${keyword}" is not one the checker of the oracle implements ` +
          `(${SUPPORTED_KEYWORDS.join(", ")})`,
      );
    }
  }
  const type = node["type"];
  if (type !== undefined) {
    const types = Array.isArray(type) ? type : [type];
    for (const one of types) {
      if (typeof one !== "string" || !(SUPPORTED_TYPES as readonly string[]).includes(one)) {
        throw new SchemaUnsupportedError(`${at}: the type ${JSON.stringify(one)} is not known`);
      }
    }
  }
  const properties = node["properties"];
  if (properties !== undefined) {
    if (typeof properties !== "object" || properties === null) {
      throw new SchemaUnsupportedError(`${at}/properties: an object of schemas`);
    }
    for (const [name, sub] of Object.entries(properties as Record<string, unknown>)) {
      assertSupported(sub, `${at}/properties/${name}`);
    }
  }
  const additional = node["additionalProperties"];
  if (additional !== undefined && typeof additional !== "boolean") {
    assertSupported(additional, `${at}/additionalProperties`);
  }
  if (node["items"] !== undefined) assertSupported(node["items"], `${at}/items`);
  const required = node["required"];
  if (required !== undefined && !Array.isArray(required)) {
    throw new SchemaUnsupportedError(`${at}/required: a list of names`);
  }
}

function typeOf(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "number") return Number.isInteger(value) ? "integer" : "number";
  return typeof value;
}

function matchesType(value: unknown, type: string): boolean {
  const actual = typeOf(value);
  if (type === "number") return actual === "number" || actual === "integer";
  return actual === type;
}

/**
 * Check a value against a schema of the supported part. Returns the list of
 * violations; an empty list is a pass.
 */
export function check(schema: unknown, value: unknown, at = "(root)"): SchemaViolation[] {
  if (schema === true || schema === undefined) return [];
  if (schema === false) {
    return [{ path: at, keyword: "false", message: "no value is allowed here" }];
  }
  const node = schema as JsonSchema;
  const out: SchemaViolation[] = [];

  const type = node["type"];
  if (type !== undefined) {
    const types = (Array.isArray(type) ? type : [type]) as string[];
    if (!types.some((one) => matchesType(value, one))) {
      out.push({
        path: at,
        keyword: "type",
        message: `expected ${types.join(" or ")}, found ${typeOf(value)}`,
      });
      return out;
    }
  }

  if ("const" in node && JSON.stringify(value) !== JSON.stringify(node["const"])) {
    out.push({
      path: at,
      keyword: "const",
      message: `expected ${JSON.stringify(node["const"])}, found ${JSON.stringify(value)}`,
    });
  }

  const choices = node["enum"];
  if (Array.isArray(choices)) {
    const texts = choices.map((c) => JSON.stringify(c));
    if (!texts.includes(JSON.stringify(value))) {
      out.push({
        path: at,
        keyword: "enum",
        message: `${JSON.stringify(value)} is not one of ${texts.join(", ")}`,
      });
    }
  }

  if (typeof value === "string") {
    const pattern = node["pattern"];
    if (typeof pattern === "string" && !new RegExp(pattern, "u").test(value)) {
      out.push({
        path: at,
        keyword: "pattern",
        message: `${JSON.stringify(value)} does not match ${pattern}`,
      });
    }
  }

  if (typeof value === "number" && typeof node["minimum"] === "number" && value < node["minimum"]) {
    out.push({ path: at, keyword: "minimum", message: `${value} is below ${node["minimum"]}` });
  }

  if (Array.isArray(value)) {
    const min = node["minItems"];
    if (typeof min === "number" && value.length < min) {
      out.push({
        path: at,
        keyword: "minItems",
        message: `${value.length} entries, at least ${min}`,
      });
    }
    const max = node["maxItems"];
    if (typeof max === "number" && value.length > max) {
      out.push({
        path: at,
        keyword: "maxItems",
        message: `${value.length} entries, at most ${max}`,
      });
    }
    if (node["items"] !== undefined) {
      value.forEach((entry, i) => out.push(...check(node["items"], entry, `${at}/${String(i)}`)));
    }
  }

  if (typeOf(value) === "object") {
    const object = value as Record<string, unknown>;
    const properties = (node["properties"] ?? {}) as Record<string, unknown>;
    for (const name of (node["required"] ?? []) as string[]) {
      if (!(name in object)) {
        out.push({ path: at, keyword: "required", message: `the field "${name}" is missing` });
      }
    }
    for (const [name, entry] of Object.entries(object)) {
      const sub = properties[name];
      if (sub !== undefined) {
        out.push(...check(sub, entry, `${at}/${name}`));
        continue;
      }
      const additional = node["additionalProperties"];
      if (additional === false) {
        out.push({
          path: at,
          keyword: "additionalProperties",
          message: `the field "${name}" is not known`,
        });
      } else if (additional !== undefined && additional !== true) {
        out.push(...check(additional, entry, `${at}/${name}`));
      }
    }
  }

  return out;
}

/** `check`, as one line per violation, for a message. */
export function violationsAsText(violations: readonly SchemaViolation[]): string {
  return violations.map((v) => `${v.path}: ${v.message} (${v.keyword})`).join("; ");
}
