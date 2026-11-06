/**
 * T041 — the critic stub as a CLI, and the verdict every form of the critic
 * stub gives (F141-FR-008).
 *
 * "The critic stub MUST exist over HTTP, in the two request shapes the
 * reference uses, and as a CLI, and MUST offer exactly the verbs of the critic
 * table of §O.3. It MUST take the nonce from the prompt it receives. It MUST
 * serve both forms of the `completion` level with the same script. A call whose
 * prompt holds no nonce MUST be answered as a call of the diagnostician, with
 * the verbs `hint` and `fail`."
 *
 * CC is an executable named after the as-is command of a harness whose critic
 * is a CLI (dsh, prime, pi, and the generic `stub-harness`). It is this module.
 * The HTTP form, `stubs/critic-http/server.ts`, is the same script and the same
 * verdict text in the two request shapes the reference uses; it imports
 * `nonceFromPrompt` and `replyFor` from here, so the two transports can never
 * answer the same prompt differently — which is what makes the transcript
 * comparable in a form neutral to the transport (F141-FR-011).
 *
 * The nonce comes from the PROMPT and never from the script (§O.3, rule 5): the
 * reference makes a fresh nonce per call, so a script that held one would
 * compare nothing.
 */
import process from "node:process";

import { verbsOf } from "./script.ts";

/** The verbs of the critic stub as a CLI (`kinds.critic-cli` of the data form of §O.3). */
export const CRITIC_CLI_VERBS: readonly string[] = verbsOf("critic-cli") ?? [];

/** The verbs of the critic stub over HTTP (`kinds.critic-http`). */
export const CRITIC_HTTP_VERBS: readonly string[] = verbsOf("critic-http") ?? [];

/** The verbs of the diagnostician stub (`kinds.diagnostician`). */
export const DIAGNOSTICIAN_VERBS: readonly string[] = verbsOf("diagnostician") ?? [];

/**
 * The form of a nonce the reference makes: sixteen hexadecimal characters
 * (`secrets.token_hex(8)` of the critic module of the Specstride baseline).
 * The comparator asserts the form before it normalizes (N-06, F141-FR-021).
 */
export const NONCE_PATTERN = /\b([0-9a-f]{16})\b/;

/** The line the reference reads a verdict from (`VERDICT <nonce>: APPROVED`). */
export const VERDICT_LINE = (nonce: string, verdict: "APPROVED" | "REJECTED"): string =>
  `VERDICT ${nonce}: ${verdict}`;

/** A call of the critic stub outside the vocabulary of §O.3. */
export class CriticStubError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CriticStubError";
  }
}

/**
 * The VERDICT CONTRACT of a prompt: the instruction that tells the call which
 * nonce it must bind. The Specstride baseline writes it as "end with the single
 * line `VERDICT <nonce>: APPROVED`", and it is the only place a nonce belongs to
 * THIS call.
 */
export const VERDICT_CONTRACT = /end with the single line\s*`?VERDICT\s+([0-9a-f]{16})/i;

/**
 * How a prompt of the baseline NAMES the role it is written for. Both baselines
 * open every prompt with such a line, and it is the only signal that does not
 * depend on what the prompt quotes: the accelerator prompt carries the archived
 * evidence and the critic feedback, so it holds a verdict line of an earlier call,
 * and the diagnostician prompt holds the verdict line of the rejection it is asked
 * about.
 */
export const ROLE_MARKERS: readonly { readonly marker: RegExp; readonly role: string }[] =
  Object.freeze([
    { marker: /You are the DIAGNOSTICIAN/, role: "diagnostician" },
    { marker: /You are the CRITIC/, role: "critic" },
    { marker: /You are the PROPOSER/, role: "proposer" },
    { marker: /You are the ACCELERATOR/, role: "proposer" },
  ]);

/** The role a prompt names, where it names one. */
export function roleNamedByThePrompt(prompt: string): string | undefined {
  return ROLE_MARKERS.find((entry) => entry.marker.test(prompt))?.role;
}

/** How the baseline's own diagnostician prompt names its role. */
export const DIAGNOSTICIAN_MARKER = /You are the DIAGNOSTICIAN/;

/** The nonce this call is asked to bind, or `undefined` where it is asked for none. */
export function nonceOfTheVerdictContract(prompt: string): string | undefined {
  return VERDICT_CONTRACT.exec(prompt)?.[1];
}

/**
 * The nonce of the prompt this call received, or `undefined` where the prompt
 * holds none. The nonce of the verdict CONTRACT comes first: a diagnostician
 * prompt QUOTES the verdict line of the rejection it is asked about, so a bare
 * `VERDICT <nonce>` anywhere in the text is not this call's nonce.
 */
export function nonceFromPrompt(prompt: string): string | undefined {
  const contract = nonceOfTheVerdictContract(prompt);
  if (contract !== undefined) return contract;
  // A prompt that names a role other than the critic's binds no nonce, whatever
  // verdict line it quotes.
  const named = roleNamedByThePrompt(prompt);
  if (named !== undefined && named !== "critic") return undefined;
  const bound = /VERDICT\s+([0-9a-f]{16})/.exec(prompt);
  if (bound !== null) return bound[1];
  const bare = NONCE_PATTERN.exec(prompt);
  return bare?.[1];
}

/**
 * True when the prompt asks this call to bind no nonce, so the call is the
 * diagnostician's (F141-FR-008). The Specstride baseline reaches the
 * diagnostician through the same provider with `--diagnose`; its prompt names the
 * role and carries no verdict contract of its own, and the verdict line it quotes
 * belongs to the critic call that was rejected.
 */
export function isDiagnosticianCall(prompt: string): boolean {
  const named = roleNamedByThePrompt(prompt);
  if (named === "diagnostician") return true;
  if (named === "critic") return false;
  return nonceOfTheVerdictContract(prompt) === undefined && nonceFromPrompt(prompt) === undefined;
}

/**
 * The two forms of the `completion` level: tool-less, and read-only tools. The
 * form changes nothing in the script (F141-FR-008) — it is recorded and the
 * same verdict is given.
 */
export const COMPLETION_FORMS = ["tool-less", "read-only-tools"] as const;
export type CompletionForm = (typeof COMPLETION_FORMS)[number];

/** Which form of the `completion` level this call was made in. */
export function completionFormOf(options: {
  readonly tools?: unknown;
  readonly env?: Readonly<Record<string, string | undefined>>;
}): CompletionForm {
  if (Array.isArray(options.tools) && options.tools.length > 0) return "read-only-tools";
  if ((options.env?.["SPECSTRIDE_CRITIC_TOOLS"] ?? "") !== "") return "read-only-tools";
  return "tool-less";
}

/** What one verb of the critic stub answers with. */
export type CriticReply = {
  /** The text of the reply; empty where the verb replies with nothing. */
  readonly text: string;
  /** The exit code (CC) or the status code (CH) the call fails with, where it fails. */
  readonly failWith?: number;
  /** The stream the text goes to for a CLI: `stdout` or `stderr`. */
  readonly stream?: "stdout" | "stderr";
  /** True where the call never replies. */
  readonly hang?: boolean;
  /** True where the second request shape replies with an empty list of choices. */
  readonly choicesNone?: boolean;
};

/**
 * The reply of one verb. `nonce` is the nonce of the prompt; a verb that needs
 * one and got none is a call of the diagnostician and is refused here, so the
 * two parts of the script can never answer for each other.
 */
export function replyFor(
  verb: string,
  nonce: string | undefined,
  args: Readonly<Record<string, unknown>> = {},
): CriticReply {
  switch (verb) {
    case "approve": {
      if (nonce === undefined) throw new CriticStubError("approve: the prompt holds no nonce");
      return { text: `The evidence is grounded.\n${VERDICT_LINE(nonce, "APPROVED")}\n` };
    }
    case "reject": {
      if (nonce === undefined) throw new CriticStubError("reject: the prompt holds no nonce");
      // The text names criterion or task ids of the fixture (§O.3).
      const ids = (args["ids"] as readonly string[] | undefined) ?? ["T001"];
      return {
        text: `These are not met: ${ids.join(", ")}.\n` + `${VERDICT_LINE(nonce, "REJECTED")}\n`,
      };
    }
    case "malformed-none":
      return { text: "I read the evidence and have nothing to say.\n" };
    case "malformed-wrong-nonce":
      // Another nonce: sixteen hexadecimal characters that are not this call's.
      return { text: `${VERDICT_LINE("0123456789abcdef", "APPROVED")}\n` };
    case "malformed-duplicate": {
      if (nonce === undefined) throw new CriticStubError("malformed-duplicate: no nonce");
      return {
        text: `${VERDICT_LINE(nonce, "APPROVED")}\n${VERDICT_LINE(nonce, "REJECTED")}\n`,
      };
    }
    case "empty":
      // With the argument `choices: none`, over HTTP in the second request
      // shape: an empty list of choices. Otherwise: nothing at all.
      return { text: "", choicesNone: args["choices"] === "none" };
    case "http-error":
      return { text: "", failWith: Number(args["status"] ?? 500) };
    case "exit":
      return {
        text: String(args["text"] ?? "the critic stub failed this call\n"),
        failWith: Number(args["code"] ?? 1),
        stream: args["stream"] === "stdout" ? "stdout" : "stderr",
      };
    case "hang":
      return { text: "", hang: true };
    case "hint":
      return { text: String(args["hint"] ?? "the evidence cites no file that holds the symbol\n") };
    case "fail":
      return {
        text: String(args["text"] ?? "the diagnostician stub failed this call\n"),
        failWith: Number(args["code"] ?? 1),
        stream: "stderr",
      };
    default:
      throw new CriticStubError(
        `${verb} is no verb of the critic stub or the diagnostician stub; §O.3 names ` +
          `${[...new Set([...CRITIC_HTTP_VERBS, ...CRITIC_CLI_VERBS, ...DIAGNOSTICIAN_VERBS])].join(", ")}`,
      );
  }
}

/** The role a call of a critic stub plays: the critic, or the diagnostician. */
export function roleOfCall(prompt: string): "critic" | "diagnostician" {
  return isDiagnosticianCall(prompt) ? "diagnostician" : "critic";
}

/**
 * The role of ONE call of a harness stub, from the prompt alone. The role a prompt
 * NAMES decides; a prompt that names none is a critic call when it carries a
 * verdict contract, the diagnostician's when it carries none, and a proposer pass
 * otherwise.
 */
export function roleOfPrompt(prompt: string): "proposer" | "critic" | "diagnostician" {
  const named = roleNamedByThePrompt(prompt);
  if (named === "critic") return "critic";
  if (named === "diagnostician") return "diagnostician";
  if (named === "proposer") return "proposer";
  if (nonceOfTheVerdictContract(prompt) !== undefined) return "critic";
  return "proposer";
}

/**
 * Answer one call of the critic stub as a CLI: the text on its stream, and the
 * exit code. A verb outside `CRITIC_CLI_VERBS` (and outside the two verbs of
 * the diagnostician) is refused — `http-error` is a verb of the HTTP form only.
 */
export function answerAsCli(
  verbs: readonly string[],
  prompt: string,
  args: Readonly<Record<string, unknown>> = {},
  out: { stdout: (t: string) => void; stderr: (t: string) => void } = {
    stdout: (t) => void process.stdout.write(t),
    stderr: (t) => void process.stderr.write(t),
  },
): number {
  const nonce = nonceFromPrompt(prompt);
  const role = roleOfCall(prompt);
  const allowed = role === "diagnostician" ? DIAGNOSTICIAN_VERBS : CRITIC_CLI_VERBS;
  let code = 0;
  for (const verb of verbs) {
    if (!allowed.includes(verb)) {
      throw new CriticStubError(
        `${verb} is no verb of the ${role} part of the critic stub as a CLI; §O.3 names ` +
          `${allowed.join(", ")}`,
      );
    }
    const reply = replyFor(verb, nonce, args);
    if (reply.hang === true) {
      // Never reply. The caller's own timeout ends the call.
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Number.POSITIVE_INFINITY);
    }
    // `exit` names the stream its text goes to; every other verb answers on
    // standard output, which is where the reference reads the reply from.
    if (reply.text !== "") (reply.stream === "stderr" ? out.stderr : out.stdout)(reply.text);
    if (reply.failWith !== undefined) code = reply.failWith;
  }
  return code;
}
