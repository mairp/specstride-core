/**
 * T101 — the sample implementation of EP-03, the spec-format adapter, outside
 * the core, registered from the test tree (annex A, §A.4, F100-FR-018; annex
 * X, §X.10, F100-FR-222).
 *
 * A sample format that parses one fixture into the canonical spec model of
 * annex C §C.7. `parse` is a pure function of the files it is handed and
 * `tick` changes checkboxes only.
 */
import { resolveFormatName } from "@specstride/contracts/ep/spec-format";
import type {
  DetectInput,
  DetectResult,
  SourceInput,
  SpecFinding,
  TickRequest,
  TickResult,
} from "@specstride/contracts/ep/spec-format";
import type { CanonicalSpecModel } from "@specstride/contracts/records/canonical-spec-model";
import type { Implementation } from "../../conformance/frame.ts";

/** The id of the sample format; it is no format of the baseline. */
export const FORMAT = "sample-format" as const;

const model: CanonicalSpecModel = Object.freeze({
  format: FORMAT,
  feature: "000-sample",
  sources: Object.freeze([
    Object.freeze({
      kind: "spec" as const,
      path: "spec.md",
      contentHash: "0".repeat(64),
    }),
    Object.freeze({
      kind: "tasks" as const,
      path: "tasks.md",
      contentHash: "1".repeat(64),
      hashIgnoringCheckboxes: "2".repeat(64),
    }),
  ]),
  phases: Object.freeze([
    Object.freeze({
      number: 1,
      title: "The one phase of the sample",
      section: "## Phase 1",
      criteria: Object.freeze(["the sample parses"]),
      tasks: Object.freeze([
        Object.freeze({
          id: "T001",
          markers: Object.freeze(["[P]"]),
          text: "the one task of the sample",
          ticked: false,
          line: 7,
        }),
      ]),
    }),
  ]),
});

export const operations = Object.freeze({
  detect(input: DetectInput): DetectResult {
    const claims = input.path.endsWith(".sample.md") || input.head.startsWith("# sample-format");
    return Object.freeze({ claims, priority: 900 });
  },
  parse(_files: readonly string[]): CanonicalSpecModel {
    return model;
  },
  validate(candidate: CanonicalSpecModel): readonly SpecFinding[] {
    if (resolveFormatName(candidate.format) === undefined && candidate.format !== FORMAT) {
      return Object.freeze([
        Object.freeze({
          severity: "fail" as const,
          message: `unknown format \`${candidate.format}\``,
        }),
      ]);
    }
    return Object.freeze([]);
  },
  tick(request: TickRequest): TickResult {
    const ids =
      "taskIds" in request
        ? request.taskIds
        : model.phases
            .filter((p) => p.number === request.phase)
            .flatMap((p) => p.tasks.map((t) => t.id));
    return Object.freeze({
      ticked: Object.freeze(ids.map((id) => Object.freeze({ taskId: id, line: 7 }))),
      otherBytesChanged: false as const,
    });
  },
  inputs(): readonly SourceInput[] {
    return model.sources;
  },
});

/** The model the sample parses, for the suite to compare with the schema. */
export const sampleModel = model;

export const implementation: Implementation = Object.freeze({
  ep: "EP-03",
  pointId: "specstride.spec-format/1",
  id: "sample-spec-format",
  implementationClass: "first-party",
  majors: [1],
  provenance: "default",
  operations,
});
