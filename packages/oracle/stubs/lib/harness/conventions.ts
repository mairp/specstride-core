/**
 * T120 — the calling convention of a harness stub (F141-FR-006, F141-FR-010).
 *
 * "The oracle MUST offer the harness stubs of §O.3 for Claude, dsh, Codex, prime
 * and pi, and the generic stub. Each MUST follow the calling convention of its
 * harness as the table states it and MUST record what the table states. The pi
 * stub MUST be used on the port side only. A further harness stub MUST be added
 * by data: a name, a calling convention and a stream format, with no change to
 * the comparator or the normalizer."
 *
 * A convention answers three questions about one call, and nothing else:
 *
 * | Question | Field |
 * |---|---|
 * | where did the prompt arrive, and what is it? | `prompt(call)` |
 * | what does this harness record besides the argument list? | `records(call)` |
 * | which side may use the stub, and what stream format does it speak? | `sides`, `streamFormat` |
 *
 * Every field that the data of `stub-vocabulary.json` can state is READ from
 * there and never written here, so the last sentence of F141-FR-010 holds by
 * construction: `conventionFromEntry` turns a new entry of `harnessStubs` into a
 * working convention — a name, a calling convention and a stream format — with
 * no change to this module, to the comparator or to the normalizer.
 * `conventionOf` prefers the hand-written convention of a harness whose as-is
 * call shape the data cannot state (dsh's chunked critic task, the subcommand of
 * Codex), and falls back to the data-driven one for every other name.
 */
import { stubVocabulary } from "../../../src/catalogue/data.ts";

/** One call of a harness stub, as the process received it. */
export type HarnessCall = {
  readonly executable: string;
  readonly argv: readonly string[];
  readonly stdin: string;
  readonly env: Readonly<Record<string, string | undefined>>;
};

/** Where a prompt arrived and what it was. */
export type PromptOfCall = {
  readonly prompt: string;
  readonly promptChannel: "stdin" | "argument";
};

/** The calling convention of one harness. */
export type HarnessConvention = {
  readonly harness: string;
  /** The as-is commands of the harness, from the data. */
  readonly executables: readonly string[];
  /** Where the prompt arrives, as the `prompt` cell of the data states it. */
  readonly promptChannel: "stdin" | "argument";
  /** The stream format of the harness, from the data. */
  readonly streamFormat: string;
  /** Which sides may use the stub, from the data (`both`, or the port only). */
  readonly sides: string;
  /** What the data says this harness records, in the words of the table. */
  readonly recordNames: readonly string[];
  /** The prompt of this call and the channel it arrived on. */
  readonly prompt: (call: HarnessCall) => PromptOfCall;
  /** What the stub records besides the argument list, or nothing. */
  readonly records: (call: HarnessCall) => Readonly<Record<string, unknown>> | undefined;
};

/** One entry of `harnessStubs` of `stub-vocabulary.json`. */
export type HarnessStubEntry = {
  readonly harness: string;
  readonly executables: readonly string[];
  readonly roles: Readonly<Record<string, string>>;
  readonly prompt: string;
  readonly streamFormat: string;
  readonly records?: readonly string[];
  readonly sides: string;
};

/** A call the convention of its harness cannot answer. */
export class HarnessConventionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HarnessConventionError";
  }
}

/** The entries of `harnessStubs`, which are the data form of the table of §O.3. */
export function harnessStubEntries(): readonly HarnessStubEntry[] {
  return stubVocabulary().harnessStubs as unknown as readonly HarnessStubEntry[];
}

/** The entry of one harness, or nothing where the data has no such name. */
export function harnessStubEntry(
  harness: string,
  entries: readonly HarnessStubEntry[] = harnessStubEntries(),
): HarnessStubEntry | undefined {
  return entries.find((entry) => entry.harness === harness);
}

/** Where the prompt of a harness arrives, as the `prompt` cell of its entry says. */
export function promptChannelOfEntry(entry: HarnessStubEntry | undefined): "stdin" | "argument" {
  const said = (entry?.prompt ?? "").toLowerCase();
  if (said.includes("standard input")) return "stdin";
  if (said.includes("positional")) return "argument";
  // Claude's prompt goes in on standard input at the baseline (`claude -p` with no
  // positional prompt), and a descriptor-driven harness says which it is; a cell
  // that names neither channel therefore means standard input.
  return "stdin";
}

/** The positional arguments of a call: everything that is no option and no option value. */
export function positionalArguments(argv: readonly string[]): readonly string[] {
  return Object.freeze(argv.filter((argument) => !argument.startsWith("-")));
}

/**
 * The prompt of a call whose harness states no shape of its own: standard input
 * where the channel is standard input and something arrived there, otherwise the
 * LAST positional argument — the place every as-is command of §O.3 that takes its
 * prompt as an argument puts it, after its subcommand and its options.
 */
export function promptFromTheCall(call: HarnessCall, channel: "stdin" | "argument"): PromptOfCall {
  if (channel === "stdin" && call.stdin !== "") {
    return Object.freeze({ prompt: call.stdin, promptChannel: "stdin" as const });
  }
  const positional = positionalArguments(call.argv);
  if (positional.length > 0) {
    return Object.freeze({
      prompt: positional[positional.length - 1] as string,
      promptChannel: "argument" as const,
    });
  }
  return Object.freeze({
    prompt: call.stdin,
    promptChannel: call.stdin === "" ? ("argument" as const) : ("stdin" as const),
  });
}

/**
 * The convention of a harness that the DATA states, and nothing more: the name,
 * the calling convention and the stream format of F141-FR-010's last sentence.
 * A harness added by a new entry of `harnessStubs` is served by this and needs no
 * module of its own.
 */
export function conventionFromEntry(entry: HarnessStubEntry): HarnessConvention {
  const channel = promptChannelOfEntry(entry);
  return Object.freeze({
    harness: entry.harness,
    executables: Object.freeze([...entry.executables]),
    promptChannel: channel,
    streamFormat: entry.streamFormat,
    sides: entry.sides,
    recordNames: Object.freeze([...(entry.records ?? [])]),
    prompt: (call: HarnessCall): PromptOfCall => promptFromTheCall(call, channel),
    // A harness whose entry names no record records nothing beyond the argument
    // list, the names of the variables and the prompt, which every stub records.
    records: (): undefined => undefined,
  });
}

/**
 * The convention of a harness the data must hold, with the readings its as-is
 * call shape needs on top of the data. A name the data does not hold is an error:
 * the modules of `harness/` carry no name of their own, so a harness that is
 * taken out of the data must not keep a convention here.
 */
export function conventionOfKnownHarness(
  harness: string,
  readings: Partial<Pick<HarnessConvention, "prompt" | "records">>,
  entries: readonly HarnessStubEntry[] = harnessStubEntries(),
): HarnessConvention {
  const entry = harnessStubEntry(harness, entries);
  if (entry === undefined) {
    throw new HarnessConventionError(
      `${harness} is no entry of harnessStubs of stub-vocabulary.json, and a calling convention ` +
        `of the oracle holds no harness the data does not (F141-FR-010)`,
    );
  }
  return Object.freeze({ ...conventionFromEntry(entry), ...readings });
}
