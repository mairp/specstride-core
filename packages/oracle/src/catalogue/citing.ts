/**
 * T024 — the citing rules for authors of tests: the generator of
 * `packages/oracle/CITING.md` (F141-FR-027).
 *
 * `CITING.md` is the page an author of a feature reads when a task of theirs
 * says "cites feature 141". It is `spec.md` §O.1 to §O.7, and it is
 * GENERATED: every id, family, status, variant, scenario, pattern member, end
 * on the reference, stub, verb, surface, result and declaration field in it is
 * read out of `packages/oracle/data/` — the same data the declaration check of
 * `src/catalogue/declarations.ts` and the catalogue of `src/catalogue/catalogue.ts`
 * read. A row of the page therefore cannot disagree with the check that enforces
 * it: there is one source for both.
 *
 * Three kinds of content are NOT in the data files, because §O.2 to §O.4 are
 * tables and §O.1, §O.5 and §O.6 are prose rules: the eight rules in short, the
 * seven rules of normalization and waivers, and the field table of a
 * declaration. Those are carried here as the text of the specification, in the
 * constants `RULES_IN_SHORT`, `RESULT_RULES` and `DECLARATION_FIELDS`, with the
 * section each one comes from. `test/catalogue/citing.test.ts` reads
 * `spec.md` §O.1 to §O.7 where the specification tree is present and holds every
 * one of them to it, and skips with its reason where it is absent.
 *
 * `npm run oracle -- write-citing` writes the page; `npm run oracle -- check-citing`
 * compares the page on disk with what the data gives now and fails when they
 * differ, so the page cannot go stale.
 */
import {
  OWNING_FEATURE,
  activeFamilyIds,
  families,
  familyIds,
  retiredFamilyIds,
} from "./catalogue.ts";
import { oracleData } from "./data.ts";
import {
  CHARACTERIZATION_TEST_NAME,
  PARITY_TEST_NAME,
  behaviourWithNoReference,
  genericStubName,
  harnessesWithATestedAdapter,
  harnessesWithNoReference,
  piStubName,
} from "./declarations.ts";

/** Where the page lies, relative to the package. */
export const CITING_PAGE = "CITING.md" as const;

/** §O.1 — the eight rules in short, as `spec.md` §O.1 writes them. */
export const RULES_IN_SHORT: readonly string[] = Object.freeze([
  "A parity test runs one or more scenarios of fixture families of §O.2 and compares the surfaces of §O.4 that it names",
  "A parity test declares `proves:`, `fixture:` and `surfaces:` as in §O.6. A test without all three is not a parity test",
  "A feature cites a family by its id. It may cite a scenario as `FX-nn/<scenario>`. It never cites a file of the oracle",
  "A feature may add a scenario to a family, inside the scope the catalogue states for that family, using only the stub verbs of §O.3 and the surfaces of §O.4 (F141-FR-030)",
  "A feature never adds a fixture family, a stub verb, a surface, a normalization rule or a waiver by itself. It reports the need; families, verbs and surfaces are added here, rules in feature 100, waivers only with a register row",
  "A test may claim a behaviour item only if its fixture executed the evidence line of that item on the reference (§O.6, F141-FR-032)",
  "A result other than `equal` or `waived (<register row>)` blocks a release (§O.5)",
  "Behaviour with no reference has no parity test. §O.7 says what it has instead",
]);

/** §O.5 — the seven rules of results, normalization rules and waivers. */
export const RESULT_RULES: readonly string[] = Object.freeze([
  "A release is blocked on any `different`",
  "A normalization rule that replaces nothing in any fixture fails the suite",
  "A waiver that matches no difference fails the suite",
  "A normalization rule is added only with a row of the divergence register, or with a statement that the value is not deterministic in the reference itself; it is added in feature 100",
  'A waiver is added only with a row of the divergence register whose oracle handling says "waiver"',
  "No rule and no waiver hides a line that exists only in the port (DV-034)",
  "The comparator reports, per fixture, how many values each rule replaced",
]);

/** §O.5 — the three results, and what each one means. */
export const RESULTS: readonly { readonly result: string; readonly meaning: string }[] =
  Object.freeze([
    { result: "`equal`", meaning: "After normalization the two captures are the same" },
    {
      result: "`waived (<register row>)`",
      meaning:
        "The captures differ, and every difference is matched by a waiver keyed to the named row of the divergence register",
    },
    {
      result: "`different`",
      meaning: "Anything else, including a capture that could not be made or read",
    },
  ]);

/** §O.6 — the three fields a parity test declares, and the rule for each one. */
export const DECLARATION_FIELDS: readonly {
  readonly field: string;
  readonly content: string;
  readonly rule: string;
}[] = Object.freeze([
  {
    field: "`proves:`",
    content: "Full ids separated by `;`: `028 FR-005`, `011 SC-003`, `C-101`, `B-0042`",
    rule: "Every id exists and is assigned to the feature of the test with a kept disposition",
  },
  {
    field: "`fixture:`",
    content:
      "Family ids separated by `,`; optionally `FX-nn/<scenario>`; for FX-35 and FX-36 optionally `@engine-stub` or `@full-stack`",
    rule: "Every family is in the catalogue and is not retired. A scenario is one the catalogue holds, of this feature or of another. A pattern name stands for all its members",
  },
  {
    field: "`surfaces:`",
    content: "Names of §O.4 separated by `,`",
    rule: "Every name exists and belongs to the surfaces of the family",
  },
]);

/** §O.6 — the three kinds of test name. */
export const TEST_NAMES: readonly {
  readonly kind: string;
  readonly name: string;
  readonly proves: string;
}[] = Object.freeze([
  {
    kind: "Parity test of an as-is requirement or success criterion",
    name: "`PT-<feature>-<origin>-<slug>`, the origin without spaces and hyphens: `PT-104-028FR001-detection-order`",
    proves: "One or more as-is ids",
  },
  {
    kind: "Parity test of a cluster of behaviour items",
    name: "`PT-<feature>-<cluster>-<slug>`: `PT-130-C-040-request-schema`",
    proves: "Items of the cluster that the traceability files assign to the feature",
  },
  {
    kind: "Characterization test",
    name: "`CT-<feature>-<n>`: `CT-134-3`",
    proves:
      "A kept Lisa behaviour, a fixed defect, a behaviour with no reference, or a new requirement",
  },
]);

const cell = (value: string): string => value.replace(/\|/g, "\\|").replace(/\n/g, " ");

/** One markdown table: a header row, the rule row, then the body. */
function table(
  headers: readonly string[],
  rows: ReadonlyArray<readonly string[]>,
): readonly string[] {
  return [
    `| ${headers.join(" | ")} |`,
    `|${headers.map(() => "---").join("|")}|`,
    ...rows.map((row) => `| ${row.map(cell).join(" | ")} |`),
  ];
}

/** §O.1 — the rules in short. */
function sectionO1(): readonly string[] {
  return [
    "### §O.1 The rules in short",
    "",
    ...table(
      ["#", "Rule"],
      RULES_IN_SHORT.map((rule, index) => [String(index + 1), rule]),
    ),
  ];
}

/** §O.2 — the catalogue of fixture families, from `data/fixture-catalogue.json`. */
function sectionO2(): readonly string[] {
  const lines: string[] = ["### §O.2 Catalogue of fixture families", ""];
  lines.push(
    `${familyIds().length} family ids, ${activeFamilyIds().length} active. An id is never reused ` +
      `and never renamed. Retired: ${retiredFamilyIds().join(", ")} — a retired family keeps its ` +
      "id, has no scenario, and a test that cites it is refused (F141-FR-013).",
    "",
  );
  lines.push(
    ...table(
      ["Id", "Name", "Status", "Exercises", "Reference", "Stubs", "Surfaces", "Features covered"],
      families().map((f) => [
        f.id,
        f.name,
        f.status,
        f.exercises,
        f.reference,
        f.stubs.length === 0 ? "—" : f.stubs.join(", "),
        f.surfaces.length === 0 ? "—" : f.surfaces.join(", "),
        f.features.length === 0 ? "none" : f.features.join(", "),
      ]),
    ),
  );

  const withAReservation = families().filter((f) => f.answersReservation !== undefined);
  if (withAReservation.length > 0) {
    lines.push("", "**New families and the reservation each answers.**", "");
    lines.push(
      ...table(
        ["Family", "Reservation of `traceability.md` section 5"],
        withAReservation.map((f) => [f.id, String(f.answersReservation)]),
      ),
    );
  }

  const withVariants = families().filter((f) => f.variants.length > 0);
  if (withVariants.length > 0) {
    lines.push("", "**Variants.** A citation may name a variant of these families only.", "");
    lines.push(
      ...table(
        ["Family", "Variants"],
        withVariants.map((f) => [f.id, f.variants.join(", ")]),
      ),
    );
  }

  lines.push(
    "",
    "**Scenarios.** `Scenario of` names the feature that writes and keeps the scenario.",
    "",
  );
  lines.push(
    ...table(
      ["Family", "Scenario", "Scenario of", "Test of", "Waiver"],
      families().flatMap((f) =>
        f.scenarios.map((s) => [
          f.id,
          s.pattern ? `${s.name} (pattern)` : s.name,
          s.scenarioOf,
          s.testOf ?? "—",
          s.waiver ?? "—",
        ]),
      ),
    ),
  );

  const patterns = families().flatMap((f) =>
    f.scenarios.filter((s) => s.pattern).map((s) => ({ family: f.id, scenario: s })),
  );
  lines.push(
    "",
    `**Members of the pattern names.** ${patterns.length} pattern names; a pattern name stands for ` +
      "all its members.",
    "",
  );
  lines.push(
    ...table(
      ["Family", "Pattern", "Members", "Closed set, owner and baseline"],
      patterns.map(({ family: id, scenario }) => [
        id,
        scenario.name,
        (scenario.members ?? []).join("; "),
        scenario.source ?? "—",
      ]),
    ),
  );

  const ends = families().flatMap((f) =>
    f.scenarios
      .filter((s) => s.endOnReference !== undefined)
      .map((s) => ({ family: f.id, scenario: s })),
  );
  lines.push(
    "",
    "**Ends on the reference.** A record of the reference and no expectation of its own: where a " +
      "capture of the reference differs from it, the capture stands and the table is corrected " +
      "(F141-FR-013).",
    "",
  );
  lines.push(
    ...table(
      [
        "Scenario",
        "Entry point",
        "End of the driven command",
        "Stop reason",
        "Evidence at the baseline",
        "Known by",
      ],
      ends.map(({ family: id, scenario }) => {
        const end = scenario.endOnReference;
        return [
          `\`${id}/${scenario.name}\``,
          end?.entryPoint ?? "",
          end?.end ?? "",
          end?.stopReason ?? "",
          end?.evidence ?? "",
          end?.knownBy ?? "",
        ];
      }),
    ),
  );

  const reserved = oracleData.fixtureCatalogue.reservedNames;
  if (reserved.length > 0) {
    lines.push("", "**Reserved names.**", "");
    lines.push(
      ...table(
        ["Families", "Names", "Reserved by", "Note"],
        reserved.map((row) => [
          (row["families"] as string[]).join(", "),
          String(row["names"]),
          String(row["reservedBy"]),
          String(row["note"] ?? ""),
        ]),
      ),
    );
  }

  const notScenarios = oracleData.fixtureCatalogue.notScenarios;
  if (notScenarios.length > 0) {
    lines.push("", "**Requests that are not scenarios of a family.**", "");
    lines.push(
      ...table(
        ["Families", "What was asked", "Asked by", "Why it is no scenario of the family"],
        notScenarios.map((row) => [
          (row["families"] as string[]).join(", "),
          String(row["asked"]),
          String(row["askedBy"]),
          String(row["why"]),
        ]),
      ),
    );
  }
  return lines;
}

/** §O.3 — the stubs, their rules and their verbs, from `data/stub-vocabulary.json`. */
function sectionO3(): readonly string[] {
  const vocabulary = oracleData.stubVocabulary;
  const lines: string[] = ["### §O.3 Stubs", ""];
  lines.push("Every stub obeys these rules (F141-FR-005):", "");
  lines.push(
    ...table(
      ["#", "Rule"],
      vocabulary.rules.map((rule, index) => [String(index + 1), rule]),
    ),
  );
  lines.push(
    "",
    "A script is a list of steps, one per invocation index of the stub. A step names one or more " +
      `verbs. A call beyond the last step of the script fails with the exit code ` +
      `${vocabulary.overrunExitCode} and is recorded.`,
    "",
    "**Verbs per kind of stub.** A fixture that names a verb outside the row of its stub is refused.",
    "",
  );
  lines.push(
    ...table(
      ["Kind of stub", "Verbs"],
      Object.entries(vocabulary.kinds).map(([kind, row]) => [
        `\`${kind}\``,
        row.verbs.map((v) => `\`${v}\``).join(", "),
      ]),
    ),
  );
  lines.push("", "**Harness stubs.**", "");
  lines.push(
    ...table(
      ["Harness", "Executables", "Roles", "Prompt", "Stream format", "Sides"],
      vocabulary.harnessStubs.map((h) => [
        String(h["harness"]),
        (h["executables"] as string[]).map((e) => `\`${e}\``).join(", "),
        Object.entries(h["roles"] as Record<string, string>)
          .map(([role, kind]) => `${role}: ${kind}`)
          .join("; "),
        String(h["prompt"]),
        String(h["streamFormat"]),
        String(h["sides"]),
      ]),
    ),
  );
  lines.push(
    "",
    `**Names of stub executables.** A stub executable has the name of the as-is command of a ` +
      `harness with as-is behaviour, the name of the as-is engine command (\`${vocabulary.engineExecutable}\`), ` +
      `or the one generic name \`${genericStubName()}\` for a descriptor-driven harness. The ` +
      "harnesses named here are those that have as-is behaviour or a Wave 1 harness adapter; the " +
      "list is not a list of the harnesses the product supports, which is the registry.",
  );
  return lines;
}

/** §O.4 — the compared surfaces, from `data/surfaces.json`. */
function sectionO4(): readonly string[] {
  const surfaces = oracleData.surfaces;
  const lines: string[] = ["### §O.4 Compared surfaces", ""];
  lines.push(
    ...table(
      ["Id", "Name to cite", "Suites"],
      surfaces.surfaces.map((s) => [s.id, `\`${s.name}\``, s.suites]),
    ),
  );
  lines.push(
    "",
    `**Run set** means ${surfaces.runSet.map((n) => `\`${n}\``).join(", ")}.`,
    "",
    "The surface `transcript` is citable per role: " +
      surfaces.transcriptRoles.map((r) => `\`transcript.${r}\``).join(", ") +
      ".",
    "",
    "A parity test cites surfaces by name. A test that cites no surface is refused.",
  );
  return lines;
}

/** §O.5 — results, normalization rules and waivers. */
function sectionO5(): readonly string[] {
  return [
    "### §O.5 Results, normalization rules and waivers",
    "",
    "Per fixture and per surface the comparator gives exactly one result:",
    "",
    ...table(
      ["Result", "Meaning"],
      RESULTS.map((row) => [row.result, row.meaning]),
    ),
    "",
    ...table(
      ["#", "Rule"],
      RESULT_RULES.map((rule, index) => [String(index + 1), rule]),
    ),
  ];
}

/** §O.6 — naming and declarations of tests. */
function sectionO6(): readonly string[] {
  return [
    "### §O.6 Naming and declarations of tests",
    "",
    ...table(
      ["Kind", "Name", "Proves"],
      TEST_NAMES.map((row) => [row.kind, row.name, row.proves]),
    ),
    "",
    "`<feature>` is the three-digit number of the feature that owns the test. `<slug>` is lower " +
      "case with hyphens. The two names are checked against these expressions, which " +
      "`src/catalogue/declarations.ts` holds:",
    "",
    ...table(
      ["Kind", "Expression"],
      [
        ["Parity test", `\`${PARITY_TEST_NAME.source}\``],
        ["Characterization test", `\`${CHARACTERIZATION_TEST_NAME.source}\``],
      ],
    ),
    "",
    "A parity test declares, in its task of `tasks.md` and in the test itself:",
    "",
    ...table(
      ["Field", "Content", "Rule"],
      DECLARATION_FIELDS.map((row) => [row.field, row.content, row.rule]),
    ),
    "",
    "`surfaces:` is required in the test and in the fixture declaration. In a task of `tasks.md` " +
      "it may be left out; the test then compares every surface of the family.",
    "",
    "A characterization test declares `proves:`. It declares no `fixture:` unless it uses the " +
      "stubs of the oracle, and it is never counted as a parity test.",
  ];
}

/** §O.7 — behaviour with no reference, from the stub vocabulary and the pins. */
function sectionO7(): readonly string[] {
  const lines: string[] = ["### §O.7 Behaviour with no reference", ""];
  lines.push(
    `The harnesses with as-is behaviour and a tested harness adapter are ` +
      `${harnessesWithATestedAdapter().join(", ")}. A parity test is possible for those and for no ` +
      `other. The harness stubs that run on the port side only are ` +
      `${harnessesWithNoReference().join(", ")}; the descriptor-driven stub is ` +
      `\`${genericStubName()}\` and the pi stub is \`${piStubName()}\`.`,
    "",
  );
  lines.push(
    ...table(
      ["Subject", "Parity test?", "What it has instead", "Stubs offered", "Scenarios offered"],
      behaviourWithNoReference().map((row) => [
        row.subject,
        "None",
        `${row.why}. ${row.instead.join("; ")}`,
        row.stubs.map((s) => `\`${s}\``).join(", "),
        row.scenarios.length === 0 ? "—" : row.scenarios.map((s) => `\`${s}\``).join(", "),
      ]),
    ),
  );
  lines.push(
    "",
    "Two further rows of §O.7 are not about a harness and have no entry in the data files: a fixed " +
      "defect and a behaviour that is new have a characterization test of the new behaviour, and " +
      "the as-is side is a waiver, a mapping or a switch, as its register row says; a behaviour " +
      "item that no fixture can execute has a characterization test or a register row, by a " +
      "correction of the traceability files (F141-FR-033). The locally registered backend of the " +
      "baseline has none of these: no fixture, no stub name, no imported asset, and its name is " +
      "found at run time and stored in no file of the oracle (F141-FR-029).",
  );
  return lines;
}

/**
 * The whole page. The text is deterministic: it reads `data/` and nothing else —
 * no clock, no environment, no path of the machine — so two runs give the same
 * bytes and `check-citing` is a byte comparison.
 */
export function renderCiting(): string {
  const lines: string[] = [
    "# How a feature cites the oracle",
    "",
    "<!-- Generated by `npm run oracle -- write-citing` from `packages/oracle/data/`.",
    "     Do not edit by hand: `npm run oracle -- check-citing` fails when this page and the data",
    `     differ. This page is \`specs/${OWNING_FEATURE}-parity-oracle/spec.md\` §O.1 to §O.7, which`,
    "     stands where the two differ. -->",
    "",
    "This page is normative for the author of a feature that cites the oracle of feature " +
      `${OWNING_FEATURE}. Its subsections have the stable numbers of \`spec.md\` §O.1 to §O.7. An id ` +
      "given here — a fixture family, a scenario, a stub verb, a surface — is never reused and " +
      "never renamed.",
    "",
    'How to cite: "feature 141, §O.2, FX-12" for a family; "feature 141, §O.4, `transcript`" ' +
      'for a surface; "feature 141, §O.3, proposer verb `yield`" for a stub verb.',
    "",
    "What checks what you write here: `npm run oracle -- check-declarations` reads the `tasks.md` " +
      "of every feature and the tests under `tests/parity/` and runs the rules of §O.6 over every " +
      "declaration it finds (F141-FR-027, F141-FR-028).",
    "",
    ...sectionO1(),
    "",
    ...sectionO2(),
    "",
    ...sectionO3(),
    "",
    ...sectionO4(),
    "",
    ...sectionO5(),
    "",
    ...sectionO6(),
    "",
    ...sectionO7(),
    "",
  ];
  return lines.join("\n");
}

/** The sections the page holds, in order. A reader and the test both use this. */
export const CITING_SECTIONS = [
  "§O.1 The rules in short",
  "§O.2 Catalogue of fixture families",
  "§O.3 Stubs",
  "§O.4 Compared surfaces",
  "§O.5 Results, normalization rules and waivers",
  "§O.6 Naming and declarations of tests",
  "§O.7 Behaviour with no reference",
] as const;
