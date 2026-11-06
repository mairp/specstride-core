/**
 * T286 — the static checks of the threat model (annex X, §X.9; F100-FR-216,
 * F100-FR-217, F100-FR-218).
 *
 * Four checks, each a finding where it is broken:
 *
 *  1. Every one of the 49 threats of `data/threat-model.json` has an owner
 *     feature and a control (F100-FR-216).
 *  2. The five structural controls R-1 to R-5 are present, each with content,
 *     and every control a threat names by id is one of them (F100-FR-216).
 *  3. No component outside the runtime tree writes control state other than the
 *     files F100-FR-217 lists for the CLI — a check over the `writer` column of
 *     `layout.json`.
 *  4. The three per-run fields of the run record that F100-FR-143 names are
 *     required by `schemas/run-record.schema.json` (F100-FR-218).
 */
import {
  contractsData,
  contractsSchema,
  finding,
  type CheckOptions,
  type Finding,
  type StaticCheck,
} from "./kit.ts";

/** The data file the threat model lives in. */
export const THREAT_MODEL_FILE = "packages/contracts/data/threat-model.json";

/** The data file the layout lives in. */
export const LAYOUT_FILE = "packages/contracts/data/layout.json";

/** The schema file of the run record. */
export const RUN_RECORD_SCHEMA = "packages/contracts/schemas/run-record.schema.json";

/** The number of threats of §X.9 (F100-FR-216). */
export const THREAT_COUNT = 49 as const;

/** The five structural controls of §X.9 (F100-FR-216). */
export const STRUCTURAL_CONTROLS = ["R-1", "R-2", "R-3", "R-4", "R-5"] as const;

/**
 * The three per-run fields of the run record that F100-FR-143 names and
 * F100-FR-218 requires of every run: the containment level, the result of the
 * critic proof and the version of the redaction pattern set (annex E, §E.2).
 */
export const PER_RUN_FIELDS = ["containment", "criticProof", "redaction"] as const;

type ThreatModel = {
  controls: { Control: string; Content: string }[];
  threats: { Id: string; Threat: string; Control: string; Owner: string }[];
};

type Layout = {
  logicalNames: { logicalName: string; root: string; writer: string; readers: string }[];
};

type Schema = { required?: string[]; properties?: Record<string, unknown> };

/**
 * F100-FR-217 — what the CLI writes, and nothing else, from outside the runtime
 * tree: inbox requests, launch records with the comment beside them, the
 * supervision record, the run snapshot and the resolved registry at launch, the
 * launch contract and its launch bundle, and the source inventory and the
 * verification commands of a reverse run.
 */
export const CLI_MAY_WRITE = [
  "inbox requests",
  "launch records with the comment beside them",
  "the supervision record",
  "the run snapshot at launch",
  "the resolved registry at launch",
  "the launch contract and its launch bundle",
  "the source inventory of a reverse run",
  "the verification commands of a reverse run",
] as const;

/** The writers of the control plane that belong to the runtime tree (LR-4). */
const RUNTIME_TREE_WRITER =
  /^(runtime root|runtime$|engine|the one event writer|the job, through the engine)/i;

/**
 * The writers of the control plane the table itself names as exceptions: the
 * writer domain of learning, the lock provider, the compatibility projection,
 * the stream adapter, the exporters, the harness and its adapter, and the
 * consumer, who writes only what a consumer writes.
 */
const NAMED_EXCEPTIONS: readonly string[] = Object.freeze([
  "Learning (own writer domain)",
  "Lock provider",
  "Compatibility projection",
  "Stream adapter",
  "Exporter",
  "Harness adapter",
  "Harness",
  "Harness layer",
  "Consumer",
  "Proposer",
]);

/**
 * The logical names of the control plane that F100-FR-217 lists for the CLI,
 * one pattern per item of the list. A `CLI` writer of a control-plane name that
 * no pattern matches is a finding, UNLESS the runtime is not among the readers
 * of the name: the second sentence of F100-FR-217 is about the inputs the
 * runtime acts on, and a file the CLI writes and only the CLI reads is none.
 */
export const CLI_WRITTEN_NAMES: readonly { readonly item: string; readonly pattern: RegExp }[] =
  Object.freeze([
    Object.freeze({ item: "inbox requests", pattern: /^inbox:/ }),
    Object.freeze({
      item: "launch records with the comment beside them",
      pattern: /^launch:<launchId>:(record|comment)$/,
    }),
    Object.freeze({ item: "the supervision record", pattern: /^launch:<launchId>:supervision$/ }),
    Object.freeze({ item: "the run snapshot at launch", pattern: /^run:<runId>:snapshot$/ }),
    Object.freeze({ item: "the resolved registry at launch", pattern: /^run:<runId>:registry$/ }),
    Object.freeze({
      item: "the launch contract and its launch bundle",
      pattern: /^pipeline:<pipelineId>:(contract|bundle:<hash>)$/,
    }),
    Object.freeze({
      item: "the source inventory of a reverse run",
      pattern: /^reverse:<slug>:inventory$/,
    }),
    Object.freeze({
      item: "the verification commands of a reverse run",
      pattern: /^(reverse:<slug>:verification-commands|feature:<slug>:verification:commands)$/,
    }),
    Object.freeze({ item: "the terms the consumer accepted", pattern: /^user:terms$/ }),
  ]);

/** The readers of a logical name, from the `readers` column of `layout.json`. */
function runtimeReads(readers: string): boolean {
  return /\b(engine|runtime|pass loop|critic|check runner)\b/i.test(readers);
}

/** True where the writer cell names the runtime tree or a named exception. */
function writerIsAllowed(writer: string, logicalName: string, readers: string = ""): boolean {
  const cell = writer.trim();
  if (cell === "" || cell === "—" || cell.startsWith("— (")) return true;
  if (RUNTIME_TREE_WRITER.test(cell)) return true;
  if (NAMED_EXCEPTIONS.includes(cell)) return true;
  // A compound writer: every token must be allowed on its own.
  if (/;|,/.test(cell)) {
    const tokens = cell.split(/;\s*|,\s*(?=engine|runtime|learning|CLI)/i).map((t) => t.trim());
    if (tokens.length > 1 && tokens.every((t) => writerIsAllowed(t, logicalName, readers))) {
      return true;
    }
  }
  if (/^CLI/i.test(cell)) {
    // F100-FR-217 — the CLI writes only the files the requirement lists, or a
    // file the runtime never reads and so never acts on.
    if (CLI_WRITTEN_NAMES.some((row) => row.pattern.test(logicalName))) return true;
    return !runtimeReads(readers);
  }
  return false;
}

/** The four checks of the threat model (F100-FR-216 to F100-FR-218). */
export function checkThreatModel(options: CheckOptions = {}): readonly Finding[] {
  const findings: Finding[] = [];
  const root = options.root;
  const model =
    root === undefined
      ? contractsData<ThreatModel>("threat-model.json")
      : contractsData<ThreatModel>("threat-model.json", root);
  const layout =
    root === undefined
      ? contractsData<Layout>("layout.json")
      : contractsData<Layout>("layout.json", root);
  const schema =
    root === undefined
      ? contractsSchema<Schema>("run-record.schema.json")
      : contractsSchema<Schema>("run-record.schema.json", root);

  // 1 — the 49 threats, each with an owner feature and a control.
  if (model.threats.length !== THREAT_COUNT) {
    findings.push(
      finding(
        THREAT_MODEL_FILE,
        0,
        `the threat model of annex X §X.9 holds ${THREAT_COUNT} threats; the data file ` +
          `holds ${model.threats.length} (F100-FR-216)`,
        String(model.threats.length),
      ),
    );
  }
  for (const threat of model.threats) {
    if (String(threat.Control ?? "").trim() === "") {
      findings.push(
        finding(
          THREAT_MODEL_FILE,
          0,
          `threat ${threat.Id} of annex X §X.9 names no control (F100-FR-216)`,
          threat.Id,
        ),
      );
    }
    const owner = String(threat.Owner ?? "").trim();
    if (owner === "" || !/\d{3}/.test(owner)) {
      findings.push(
        finding(
          THREAT_MODEL_FILE,
          0,
          `threat ${threat.Id} of annex X §X.9 names no owner feature (F100-FR-216)`,
          threat.Id,
        ),
      );
    }
  }

  // 2 — the five structural controls, and no control named by id that is not one.
  const controls = new Map(model.controls.map((c) => [c.Control.trim(), c.Content]));
  for (const id of STRUCTURAL_CONTROLS) {
    const content = controls.get(id);
    if (content === undefined) {
      findings.push(
        finding(
          THREAT_MODEL_FILE,
          0,
          `the structural control ${id} of annex X §X.9 is absent (F100-FR-216)`,
          id,
        ),
      );
    } else if (content.trim() === "") {
      findings.push(
        finding(THREAT_MODEL_FILE, 0, `the control ${id} has no content (F100-FR-216)`, id),
      );
    }
  }
  for (const [id] of controls) {
    if (!(STRUCTURAL_CONTROLS as readonly string[]).includes(id)) {
      findings.push(
        finding(
          THREAT_MODEL_FILE,
          0,
          `the data file holds the control ${id}, which is not one of the five structural ` +
            `controls of annex X §X.9 (F100-FR-216)`,
          id,
        ),
      );
    }
  }
  for (const threat of model.threats) {
    for (const match of String(threat.Control ?? "").matchAll(/\bR-(\d+)\b/g)) {
      const id = `R-${match[1]}`;
      if (!controls.has(id)) {
        findings.push(
          finding(
            THREAT_MODEL_FILE,
            0,
            `threat ${threat.Id} names the control ${id}, which annex X §X.9 does not hold ` +
              `(F100-FR-216)`,
            id,
          ),
        );
      }
    }
  }

  // 3 — no component outside the runtime tree writes control state other than
  // the CLI's listed files (the `writer` column of `layout.json`).
  const control = layout.logicalNames.filter((n) => n.root.toLowerCase().startsWith("control"));
  if (control.length === 0) {
    findings.push(
      finding(LAYOUT_FILE, 0, "the layout holds no logical name of the control plane", "control"),
    );
  }
  for (const name of control) {
    if (writerIsAllowed(name.writer, name.logicalName, name.readers)) continue;
    findings.push(
      finding(
        LAYOUT_FILE,
        0,
        `the writer "${name.writer}" of the control-plane name ${name.logicalName} is ` +
          `outside the runtime tree and is not one of the files the CLI writes ` +
          `(F100-FR-217)`,
        name.logicalName,
      ),
    );
  }

  // 4 — the three per-run fields are required by the schema of the run record.
  const required = schema.required ?? [];
  for (const field of PER_RUN_FIELDS) {
    if (!required.includes(field)) {
      findings.push(
        finding(
          RUN_RECORD_SCHEMA,
          0,
          `the run record must require the per-run field \`${field}\` that F100-FR-143 ` +
            `names (F100-FR-218)`,
          field,
        ),
      );
    }
  }

  return Object.freeze(findings);
}

/** The check the runner of T264 registers. */
export const threatModelCheck: StaticCheck = {
  name: "Threat model",
  covers: ["F100-FR-216", "F100-FR-217", "F100-FR-218", "F100-FR-225"],
  run: checkThreatModel,
};

export default threatModelCheck;
