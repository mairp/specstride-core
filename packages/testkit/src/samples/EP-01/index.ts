/**
 * T156 — the sample implementation of EP-01, the host port, outside the core,
 * registered from the test tree (annex A, §A.4, F100-FR-018; annex X, §X.10,
 * F100-FR-222).
 *
 * The plain shell, which annex H §H.1 names as the test host. It declares
 * every capability of the table of `data/host-capabilities.json` and renders
 * artifacts of its own, and no file of a core package names it.
 */
import { CAPABILITIES, capabilityRows, HOST_SKILL_IDS } from "@specstride/contracts/ep/host";
import type {
  HostDescription,
  HostArtifact,
  SkillSource,
  TriggerCase,
  TriggerResult,
} from "@specstride/contracts/ep/host";
import type { Implementation } from "../../conformance/frame.ts";

/** Every capability of the table of §H.1 is declared; none is absent. */
const description: HostDescription = Object.freeze({
  skillNaming: { rule: "lower-case with hyphens", descriptionCap: 200 },
  hooks: Object.freeze([]),
  background: null,
  statusSurface: "the terminal",
  evals: "the session-log driver",
  packagingForm: "a directory of shell scripts",
  stateRootWritable: true,
  model: false,
});

export const operations = Object.freeze({
  describe(): HostDescription {
    return description;
  },
  renderSkill(source: SkillSource): HostArtifact {
    const content = `#!/bin/sh\n# ${source.logicalId}\n${source.body}\n`;
    return Object.freeze({
      path: `skills/${source.logicalId}.sh`,
      bytes: Buffer.byteLength(content, "utf8"),
      content,
    });
  },
  renderEntry(logicalId: string): string {
    return `specstride ${logicalId}`;
  },
  renderStatusHooks(statusLineLogicalName: string): readonly HostArtifact[] {
    const content = `#!/bin/sh\ncat "$1" # ${statusLineLogicalName}\n`;
    return Object.freeze([
      Object.freeze({
        path: "hooks/status.sh",
        bytes: Buffer.byteLength(content, "utf8"),
        content,
      }),
    ]);
  },
  evalDriver: Object.freeze({
    run(suite: readonly TriggerCase[]): Promise<readonly TriggerResult[]> {
      return Promise.resolve(
        Object.freeze(
          suite.map((one) =>
            Object.freeze({
              id: one.id,
              matched: one.prompt.includes(one.expected),
              detail: "the session-log driver of the plain shell",
            }),
          ),
        ),
      );
    },
  }),
});

/** The capabilities the sample declares, for the suite to compare with §H.1. */
export const declaredCapabilities = Object.freeze([...CAPABILITIES]);
export const capabilityTable = capabilityRows;
export const skillIds = HOST_SKILL_IDS;

export const implementation: Implementation = Object.freeze({
  ep: "EP-01",
  pointId: "specstride.host/1",
  id: "sample-host-plain-shell",
  implementationClass: "first-party",
  majors: [1],
  provenance: "default",
  operations,
});
