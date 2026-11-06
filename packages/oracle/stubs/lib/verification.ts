/**
 * T042 — the verification command stubs, and the plugin installer stub
 * (F141-FR-009).
 *
 * "Verification command stubs (V). Small commands of the fixture." Their four
 * verbs are `pass`, `fail`, `slow` and `write-result`. A verification command is
 * what the gate of a phase executes with a fixed argument list; the oracle needs
 * one that can pass, fail at a named step with the output of the fixture, take a
 * number of ticks, and write a result file for a pre-staged or detached command.
 *
 * The plugin installer stub (I) answers the installer call of the dsh plugin
 * request protocol with `install`, `fail` and `hang`. It is the dsh stub called
 * with the installer's arguments, so it lives beside the verification commands
 * rather than in a module of its own.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import process from "node:process";

import { verbsOf, type ScriptStep } from "./script.ts";

/** The four verbs of a verification command stub (`kinds.verification-command`). */
export const VERIFICATION_VERBS: readonly string[] = verbsOf("verification-command") ?? [];

/** The three verbs of the plugin installer stub (`kinds.plugin-installer`). */
export const INSTALLER_VERBS: readonly string[] = verbsOf("plugin-installer") ?? [];

/** A call of one of these stubs outside the vocabulary of §O.3. */
export class VerificationStubError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VerificationStubError";
  }
}

/** What one call of a verification command stub was given. */
export type VerificationContext = {
  readonly workdir: string;
  readonly tickMilliseconds: number;
  readonly stdout?: (text: string) => void;
  readonly stderr?: (text: string) => void;
};

function inside(root: string, path: string, verb: string): string {
  if (isAbsolute(path)) {
    throw new VerificationStubError(
      `${verb}: ${path} is a path outside the fixture (§O.3, rule 5)`,
    );
  }
  const target = resolve(join(root, path));
  if (!target.startsWith(`${resolve(root)}/`)) {
    throw new VerificationStubError(`${verb}: ${path} leaves ${root}`);
  }
  return target;
}

function waitTicks(ticks: number, tickMilliseconds: number): void {
  const milliseconds = Math.max(0, Math.trunc(ticks * tickMilliseconds));
  if (milliseconds > 0) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
  }
}

/**
 * Carry out one step of a verification command script. Returns the exit code the
 * command ends with.
 */
export function carryOutVerificationStep(step: ScriptStep, context: VerificationContext): number {
  const args = (step.args ?? {}) as Record<string, unknown>;
  const out = context.stdout ?? ((t: string): void => void process.stdout.write(t));
  const err = context.stderr ?? ((t: string): void => void process.stderr.write(t));
  let code = 0;
  for (const verb of step.verbs) {
    if (!VERIFICATION_VERBS.includes(verb)) {
      throw new VerificationStubError(
        `${verb} is no verb of a verification command stub; §O.3 names ` +
          `${VERIFICATION_VERBS.join(", ")}`,
      );
    }
    switch (verb) {
      case "pass":
        out(String(args["text"] ?? "the verification command of the fixture passed\n"));
        break;
      case "fail": {
        // Fail at step n, with the output of the fixture.
        const step_ = args["step"] === undefined ? 1 : Math.trunc(Number(args["step"]));
        err(
          String(
            args["text"] ??
              `the verification command of the fixture failed at step ${String(step_)}\n`,
          ),
        );
        code = Math.trunc(Number(args["code"] ?? 1));
        break;
      }
      case "slow":
        waitTicks(Number(args["ticks"] ?? 1), context.tickMilliseconds);
        if (args["then"] === "fail") {
          err("the slow verification command of the fixture failed\n");
          code = Math.trunc(Number(args["code"] ?? 1));
        } else {
          out("the slow verification command of the fixture passed\n");
        }
        break;
      case "write-result": {
        // A result file, for pre-staged and detached commands.
        const target = inside(context.workdir, String(args["path"] ?? "result.json"), verb);
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(
          target,
          String(args["content"] ?? `${JSON.stringify({ result: "passed" })}\n`),
          "utf8",
        );
        break;
      }
      default:
        throw new VerificationStubError(`${verb} is in the vocabulary and this module does not`);
    }
  }
  return code;
}

/** What one call of the plugin installer stub was given. */
export type InstallerContext = {
  /** The hermetic home the profile entry is written into. */
  readonly home: string;
  readonly fixtureDir: string;
  readonly tickMilliseconds: number;
  readonly stdout?: (text: string) => void;
  readonly stderr?: (text: string) => void;
};

/**
 * Carry out one step of the plugin installer stub: `install` writes the profile
 * entry of the fixture into the hermetic home and exits 0; `fail` exits with a
 * given code and text; `hang` never returns, for the installer timeout.
 */
export function carryOutInstallerStep(step: ScriptStep, context: InstallerContext): number {
  const args = (step.args ?? {}) as Record<string, unknown>;
  const out = context.stdout ?? ((t: string): void => void process.stdout.write(t));
  const err = context.stderr ?? ((t: string): void => void process.stderr.write(t));
  let code = 0;
  for (const verb of step.verbs) {
    if (!INSTALLER_VERBS.includes(verb)) {
      throw new VerificationStubError(
        `${verb} is no verb of the plugin installer stub; §O.3 names ${INSTALLER_VERBS.join(", ")}`,
      );
    }
    switch (verb) {
      case "install": {
        const target = inside(context.home, String(args["into"] ?? ".dsh/profile.json"), verb);
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(
          target,
          String(args["content"] ?? `${JSON.stringify({ plugin: "installed" })}\n`),
          "utf8",
        );
        out("the plugin installer stub installed the profile entry of the fixture\n");
        break;
      }
      case "fail":
        err(String(args["text"] ?? "the plugin installer stub failed\n"));
        code = Math.trunc(Number(args["code"] ?? 7));
        break;
      case "hang":
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Number.POSITIVE_INFINITY);
        break;
      default:
        throw new VerificationStubError(`${verb} is in the vocabulary and this module does not`);
    }
  }
  return code;
}
