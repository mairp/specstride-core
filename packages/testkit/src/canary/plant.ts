/**
 * T202 — the planting of the canary harness (annex X, §X.9; F100-FR-219;
 * quickstart.md, scenario 7).
 *
 * Seven distinct canary secrets are planted at the seven places F100-FR-219
 * names: the prompt, the reply of the model, tool arguments, tool output, phase
 * evidence, the output of a check and the consumer's comment. The planting
 * drives the two samples the requirement needs — the stub harness of T098
 * (EP-02) and the stub check runner of T105 (EP-05) — and keeps the PLAN of
 * where each value was planted, so that the scan of T285 can name the place of
 * every hit.
 *
 * The planting itself never redacts. It hands the raw artefacts to the one
 * point of redaction (the redactor of T200, the stub of T284 in this suite) and
 * the sinks receive the redacted form only, which is what F100-FR-205 promises
 * and what the scan checks.
 */
import { operations as harnessSample } from "../samples/EP-02/index.ts";
import { operations as checkRunnerSample } from "../samples/EP-05/index.ts";
import type {
  CompleteInput,
  CompleteResult,
  PassHandle,
  StartPassInput,
} from "@specstride/contracts/ep/harness";
import type {
  CheckHandle,
  CheckResult,
  ManifestEntry,
  StartInput,
} from "@specstride/contracts/ep/check-runner";
import type { StubRedactor } from "./stub-redactor.ts";

/** The section of annex X the harness answers to. */
export const ANNEX_SECTION = "annex X, §X.9" as const;

/** The requirement the harness proves. */
export const REQUIREMENT = "F100-FR-219" as const;

/**
 * The seven places F100-FR-219 names, in the order of the requirement. Seven
 * distinct canary secrets: one per place.
 */
export const CANARY_PLACES = [
  "prompt",
  "reply",
  "tool-arguments",
  "tool-output",
  "phase-evidence",
  "check-output",
  "comment",
] as const;
export type CanaryPlace = (typeof CANARY_PLACES)[number];

/** How many canaries the harness plants (F100-FR-219). */
export const CANARY_COUNT = CANARY_PLACES.length;

/** One planted canary: its place, its value and where it was planted. */
export type PlantedCanary = {
  /** The place of F100-FR-219 the value was planted at. */
  readonly place: CanaryPlace;
  /** The value, which appears nowhere else in the fixture. */
  readonly value: string;
  /** Where it was planted, in words, for the report of the scan. */
  readonly where: string;
};

/** The plan of the planting: one entry per place (T202). */
export type Planting = {
  /** The plan, in the order of F100-FR-219. */
  readonly plan: readonly PlantedCanary[];
  /** The values, in the order of the plan. */
  readonly values: readonly string[];
  /** The value planted at a place. */
  valueOf(place: CanaryPlace): string;
  /** The place a value was planted at, or `undefined`. */
  placeOf(value: string): CanaryPlace | undefined;
};

/** Where each place of F100-FR-219 is planted, in words, for the report. */
export const WHERE: Readonly<Record<CanaryPlace, string>> = Object.freeze({
  prompt: "the prompt the engine assembled for the pass",
  reply: "the reply of the model, as the harness returned it",
  "tool-arguments": "the arguments of a tool call of the pass",
  "tool-output": "the output of a tool call of the pass",
  "phase-evidence": "the phase evidence the proposer wrote",
  "check-output": "the output of a check the check runner ran",
  comment: "the consumer's comment",
});

/**
 * The prefix of every canary value. A value is `CANARY-<place>-<salt>`: the
 * place is in the value, so a hit names its own origin even without the plan,
 * and the salt makes the seven values distinct from each other and from
 * anything else in the fixture.
 */
export const CANARY_PREFIX = "CANARY" as const;

/**
 * Plant the seven canaries (T202). `salt` makes the values of one run distinct
 * from those of another; the default is fixed, so that a failing run is
 * reproducible (no clock and no randomness: a fixture of the test kit).
 */
export function plantCanaries(salt: string = "0f1e2d3c4b5a6978"): Planting {
  const plan: readonly PlantedCanary[] = Object.freeze(
    CANARY_PLACES.map((place) =>
      Object.freeze({
        place,
        value: `${CANARY_PREFIX}-${place.toUpperCase()}-${salt}`,
        where: WHERE[place],
      }),
    ),
  );
  const byPlace = new Map(plan.map((c) => [c.place, c.value]));
  const byValue = new Map(plan.map((c) => [c.value, c.place]));
  return Object.freeze({
    plan,
    values: Object.freeze(plan.map((c) => c.value)),
    valueOf(place: CanaryPlace): string {
      const value = byPlace.get(place);
      if (value === undefined) throw new Error(`no canary is planted at "${place}"`);
      return value;
    },
    placeOf(value: string): CanaryPlace | undefined {
      return byValue.get(value);
    },
  });
}

/**
 * Register every planted value with the redactor, as the runtime registers a
 * secret it resolved (annex X §X.4, the operation `register`). The canary
 * harness plants values that the runtime HAS resolved, so registering them is
 * part of the fixture and not part of what is under test.
 */
export function registerCanaries(redactor: StubRedactor, planting: Planting): void {
  for (const canary of planting.plan) redactor.register(canary.value);
}

/* ------------------------------------------------------------------ *
 * The stub harness: the sample of T098 with the canaries planted.
 * ------------------------------------------------------------------ */

/** One tool call of a pass, as the stub harness reports it. */
export type ToolCall = {
  readonly name: string;
  /** The arguments of the call, with the canary of `tool-arguments`. */
  readonly arguments: string;
  /** The output of the call, with the canary of `tool-output`. */
  readonly output: string;
};

/** What the stub harness returns beside the result of the sample. */
export type StubHarnessPass = {
  /** The prompt the pass was given, with the canary of `prompt`. */
  readonly prompt: string;
  /** The reply of the model, with the canary of `reply`. */
  readonly reply: string;
  /** The tool calls of the pass. */
  readonly toolCalls: readonly ToolCall[];
  /** The handle the sample returned, so that the seam is the real one. */
  readonly handle: PassHandle;
  /** The result of `complete` of the sample, with the planted reply. */
  readonly completion: CompleteResult;
};

/** The stub harness of the canary suite. */
export type StubHarness = {
  /** Assemble the prompt of a pass, with the canary of `prompt` planted. */
  prompt(body: string): string;
  /** Run one pass through the sample of T098 and plant the four canaries. */
  runPass(input: { readonly promptBody: string }): Promise<StubHarnessPass>;
};

/**
 * The stub harness of the test kit: the sample implementation of EP-02 (T098),
 * with the canaries of `prompt`, `reply`, `tool-arguments` and `tool-output`
 * planted around it. It starts no process and makes no paid call, because the
 * sample does not.
 */
export function createStubHarness(planting: Planting): StubHarness {
  const prompt = (body: string): string =>
    `${body}\n\n[fixture] resolved secret: ${planting.valueOf("prompt")}\n`;

  return Object.freeze({
    prompt,
    async runPass(input: { readonly promptBody: string }): Promise<StubHarnessPass> {
      const text = prompt(input.promptBody);
      const startInput = {
        prompt: text,
        session: { kind: "fresh" as const },
        role: "proposer",
        timeLimitMs: 1000,
      } as unknown as StartPassInput;
      const handle = await harnessSample.startPass(startInput);
      const completion = await harnessSample.complete({
        prompt: text,
        sessionId: "canary-session",
      } as unknown as CompleteInput);
      const reply = `${completion.reply}\nresolved secret: ${planting.valueOf("reply")}`;
      const toolCalls: readonly ToolCall[] = Object.freeze([
        Object.freeze({
          name: "Bash",
          arguments: `{"command":"printf %s ${planting.valueOf("tool-arguments")}"}`,
          output: `${planting.valueOf("tool-output")}\n`,
        }),
      ]);
      return Object.freeze({ prompt: text, reply, toolCalls, handle, completion });
    },
  });
}

/* ------------------------------------------------------------------ *
 * The stub check runner: the sample of T105 with the canary planted.
 * ------------------------------------------------------------------ */

/** What the stub check runner returns beside the result of the sample. */
export type StubCheckRun = {
  /** The id of the entry that ran. */
  readonly entryId: string;
  /** The output of the check, with the canary of `check-output`. */
  readonly output: string;
  /** The result of the sample, whose `output` is a reference and no content. */
  readonly result: CheckResult;
};

/** The stub check runner of the canary suite. */
export type StubCheckRunner = {
  /** Run one entry of the manifest through the sample of T105. */
  run(entryId?: string): Promise<StubCheckRun>;
};

/**
 * The stub check runner of the test kit: the sample implementation of EP-05
 * (T105), with the canary of `check-output` planted in the output of the
 * command. The sample starts no process.
 */
export function createStubCheckRunner(planting: Planting): StubCheckRunner {
  return Object.freeze({
    async run(entryId: string = "pass"): Promise<StubCheckRun> {
      const entry = {
        id: entryId,
        kind: "command",
        argv: ["/sample/bin/" + entryId],
        phase: 1,
        timeLimitMs: 1000,
      } as unknown as ManifestEntry;
      const identity = await checkRunnerSample.pin(entry);
      const handle: CheckHandle = await checkRunnerSample.start({
        identity,
        timeLimitMs: 1000,
      } as unknown as StartInput);
      await checkRunnerSample.poll(handle);
      const result = await checkRunnerSample.result(handle);
      const output =
        `running ${entryId}\n` +
        `token in the environment of the check: ${planting.valueOf("check-output")}\n`;
      return Object.freeze({ entryId, output, result });
    },
  });
}

/* ------------------------------------------------------------------ *
 * The two artefacts the run writes itself.
 * ------------------------------------------------------------------ */

/** The phase evidence of the fixture, with the canary of `phase-evidence`. */
export function plantedPhaseEvidence(planting: Planting): string {
  return [
    "# Evidence of the phase",
    "",
    "The pass ran the command and recorded its output.",
    `The resolved credential was ${planting.valueOf("phase-evidence")}.`,
    "",
  ].join("\n");
}

/** The consumer's comment of the fixture, with the canary of `comment`. */
export function plantedComment(planting: Planting): string {
  return `use the staging endpoint with ${planting.valueOf("comment")}`;
}

/** Every raw artefact of the planting, by its place (T202). */
export type PlantedArtefacts = Readonly<Record<CanaryPlace, string>>;

/**
 * Drive the two samples and collect the raw text planted at each of the seven
 * places. Nothing here is redacted: the run of T285 hands these texts to the
 * one point of redaction and the sinks see the redacted form only.
 */
export async function plantEverything(planting: Planting): Promise<PlantedArtefacts> {
  const harness = createStubHarness(planting);
  const runner = createStubCheckRunner(planting);
  const pass = await harness.runPass({ promptBody: "Do the work of phase 7." });
  const check = await runner.run("pass");
  const call = pass.toolCalls[0];
  return Object.freeze({
    prompt: pass.prompt,
    reply: pass.reply,
    "tool-arguments": call?.arguments ?? "",
    "tool-output": call?.output ?? "",
    "phase-evidence": plantedPhaseEvidence(planting),
    "check-output": check.output,
    comment: plantedComment(planting),
  });
}

/**
 * The check of the planting itself: every place holds its own canary, and no
 * place holds the canary of another. A planting that fails this check would
 * make the scan of T285 meaningless.
 */
export function plantingIsSound(
  planting: Planting,
  artefacts: PlantedArtefacts,
): { readonly sound: boolean; readonly problems: readonly string[] } {
  const problems: string[] = [];
  const values = new Set(planting.values);
  if (values.size !== CANARY_COUNT) {
    problems.push(`the ${CANARY_COUNT} canaries are not distinct (F100-FR-219)`);
  }
  for (const canary of planting.plan) {
    const text = artefacts[canary.place];
    if (!text.includes(canary.value)) {
      problems.push(`the canary of "${canary.place}" was not planted in ${canary.where}`);
    }
    for (const other of planting.plan) {
      if (other.place === canary.place) continue;
      if (text.includes(other.value)) {
        problems.push(
          `the canary of "${other.place}" also appears in ${canary.where}; the seven ` +
            "places must be told apart",
        );
      }
    }
  }
  return Object.freeze({ sound: problems.length === 0, problems: Object.freeze(problems) });
}
