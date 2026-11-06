/**
 * T239 — the static checks of the critic session and of the platform marks
 * (annex A, §A.5; F100-FR-024, F100-FR-025).
 *
 * F100-FR-024: the critic never approves its own session; every critic call
 * runs in a fresh session. At contract level this is the EP-02 contract file
 * of feature 100 — its `complete` operation takes a minted session id and the
 * guarantees of the core say that every critic-class call is a fresh session —
 * together with the closed set of the diversity test (annex X §X.6 row 183),
 * which holds `same-model` and `unverified`: both raise the warning.
 *
 * F100-FR-025: every macOS statement of the specification carries
 * `unverified` until the macOS runner has passed the parity oracle (T206),
 * and no specification names Windows or WSL as supported. The record that the
 * runner passed is a file of `tests/release/100/`; while it is absent, the
 * mark is required.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  ROOT,
  contractsData,
  finding,
  linesOf,
  readJson,
  rel,
  requirementBlocks,
  referenceSpecificationFiles,
  type CheckOptions,
  type Finding,
  type StaticCheck,
} from "./kit.ts";

/** The EP-02 contract file of feature 100 (annex C, §C.1). */
export const EP_02_FILE = "specs/100-specstride/contracts/extension-points/EP-02.harness.json";

/** The operation of EP-02 that the critic strategy calls. */
export const CRITIC_OPERATION = "complete" as const;

/** The number of the closed set of the results of the diversity test (§X.6). */
export const DIVERSITY_SET = 183 as const;

/** The two members of the diversity set that raise the warning (F100-FR-024). */
export const MEMBERS_THAT_RAISE_THE_WARNING = ["same-model", "unverified"] as const;

/**
 * The record that the macOS runner has passed the parity oracle (T206). While
 * this file is absent, every macOS statement carries `unverified`.
 */
export const MACOS_VERIFIED_RECORD = "tests/release/100/macos-verified.json";

/** True when T206 has passed: the record of the macOS runner exists. */
export function macosRunnerHasPassed(root: string = ROOT): boolean {
  return existsSync(join(root, MACOS_VERIFIED_RECORD));
}

type ClosedSetsFile = {
  closedSets: { number: number; name: string; literals: string[] }[];
};

/** F100-FR-024 at contract level: a fresh session per `complete` call. */
export function checkCriticSession(options: CheckOptions = {}): readonly Finding[] {
  const root = options.root ?? ROOT;
  const findings: Finding[] = [];
  const path = join(root, EP_02_FILE);
  if (!existsSync(path)) {
    return Object.freeze([
      finding(EP_02_FILE, 0, `the EP-02 contract file is missing (F100-FR-024)`),
    ]);
  }
  const contract = readJson<{
    operations?: string[];
    sections?: Record<string, unknown>;
  }>(path);
  if (!(contract.operations ?? []).includes(CRITIC_OPERATION)) {
    findings.push(
      finding(
        EP_02_FILE,
        0,
        `the EP-02 contract file names no operation \`${CRITIC_OPERATION}\`; the critic ` +
          `strategy calls it (F100-FR-024)`,
        CRITIC_OPERATION,
      ),
    );
  }
  const text = JSON.stringify(contract.sections ?? {});
  if (!/fresh session/i.test(text)) {
    findings.push(
      finding(
        EP_02_FILE,
        0,
        `the EP-02 contract file does not require a fresh session for every ` +
          `critic-class call (F100-FR-024)`,
        "fresh session",
      ),
    );
  }
  const inputs = JSON.stringify(
    (contract.sections as { Inputs?: unknown } | undefined)?.Inputs ?? {},
  );
  if (!/session id/i.test(inputs)) {
    findings.push(
      finding(
        EP_02_FILE,
        0,
        `the inputs of \`${CRITIC_OPERATION}\` in the EP-02 contract file name no ` +
          `minted session id, so a call cannot be proved to run in a fresh session ` +
          `(F100-FR-024)`,
        "the minted session id",
      ),
    );
  }
  const row = contractsData<ClosedSetsFile>("closed-sets.json", root).closedSets.find(
    (r) => r.number === DIVERSITY_SET,
  );
  if (row === undefined) {
    findings.push(
      finding(
        "packages/contracts/data/closed-sets.json",
        0,
        `row ${DIVERSITY_SET} of annex X §X.6 (the results of the diversity test) is ` +
          `missing (F100-FR-024)`,
      ),
    );
  } else {
    for (const member of MEMBERS_THAT_RAISE_THE_WARNING) {
      if (!row.literals.includes(member)) {
        findings.push(
          finding(
            "packages/contracts/data/closed-sets.json",
            0,
            `the closed set of the results of the diversity test (row ${DIVERSITY_SET}) ` +
              `does not hold \`${member}\`; the critic-diversity warning is raised for ` +
              `it (F100-FR-024)`,
            member,
          ),
        );
      }
    }
  }
  return Object.freeze(findings);
}

/** `Windows` as the platform, not "context windows". */
const WINDOWS_OR_WSL = /(?<!context )\bWindows\b|\bWSL\b/;
const CONTEXT_WINDOWS = /context ?[Ww]indows?/;
/** A line that presents a platform as supported. */
const AS_SUPPORTED =
  /(Windows|WSL)[^.]{0,120}\b(is supported|are supported|supported|first-class|validated)\b/i;
/** A line that records the platform as not validated is the required form. */
const AS_UNVALIDATED = /\b(unvalidated|unsupported|not supported|never supported|unverified)\b/i;

/** A requirement names macOS as a runner or a test tier, not as behaviour. */
const MACOS_AS_A_RUNNER = /macOS\s+(runner|runners|job|jobs|tier)/g;

/** F100-FR-025: the platform marks. */
export function checkPlatformMarks(options: CheckOptions = {}): readonly Finding[] {
  const root = options.root ?? ROOT;
  const findings: Finding[] = [];
  // T305 — F100-FR-025 is a statement about EVERY specification of the product
  // ("in any specification"), so this check is not scoped: it reads every folder
  // of `specs/1*` as reference. The scope of T305 narrows the four checks that
  // annex X §X.10 names as scoped, and this is not one of them.
  const files = referenceSpecificationFiles(options);

  // Windows and WSL are never named as supported, in any specification.
  for (const file of files) {
    const path = rel(file, root);
    const lines = linesOf(file);
    for (let i = 0; i < lines.length; i++) {
      const line = (lines[i] as string).replace(CONTEXT_WINDOWS, " ");
      if (!WINDOWS_OR_WSL.test(line)) continue;
      if (AS_SUPPORTED.test(line) && !AS_UNVALIDATED.test(line)) {
        findings.push(
          finding(
            path,
            i + 1,
            `the specification names Windows or WSL as supported; the doctor reports ` +
              `them as unvalidated (F100-FR-025)`,
            line.trim().slice(0, 120),
          ),
        );
      }
    }
  }

  // Every spec.md records the constraint: Windows and WSL are unvalidated.
  for (const file of files.filter((f) => /(^|\/)spec\.md$/.test(f))) {
    const path = rel(file, root);
    const text = linesOf(file).join("\n");
    if (!/Windows and WSL are recorded as unvalidated/i.test(text)) {
      findings.push(
        finding(
          path,
          0,
          `the specification does not record that Windows and WSL are unvalidated ` +
            `(F100-FR-025)`,
        ),
      );
    }
  }

  // Every macOS statement of the specification of feature 100 carries
  // `unverified` until T206 has passed.
  if (!macosRunnerHasPassed(root)) {
    const own = files.filter((f) => f.includes("100-specstride"));
    for (const file of own) {
      for (const block of requirementBlocks(file, root)) {
        const statement = block.text.replace(MACOS_AS_A_RUNNER, " ");
        if (!/macOS/.test(statement)) continue;
        if (/unverified/.test(block.block)) continue;
        findings.push(
          finding(
            block.file,
            block.line,
            `${block.id} states behaviour on macOS and carries no \`unverified\` mark; ` +
              `every statement about macOS is unverified until a macOS runner has ` +
              `passed the parity oracle (F100-FR-025)`,
            block.id,
          ),
        );
      }
    }
  }
  return Object.freeze(findings);
}

/** The check the runner of T264 registers. */
export const platformAndCriticSessionCheck: StaticCheck = {
  name: "Product-wide rules: the critic session and the platform marks",
  covers: ["F100-FR-024", "F100-FR-025"],
  run(options: CheckOptions = {}) {
    return Object.freeze([...checkCriticSession(options), ...checkPlatformMarks(options)]);
  },
};

export default platformAndCriticSessionCheck;
