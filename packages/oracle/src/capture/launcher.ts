/**
 * T049 — the surface `launcher` (S-12, F141-FR-019).
 *
 * "The launcher and the launch bundle as a logical record." Not as text: N-17
 * says the body of the launcher is compared as a logical record — "marker
 * present, hash valid, reference to the launch bundle resolves, arguments passed
 * through" — because the generated body of the reference and of the port are two
 * renderings of one contract and comparing them as text would compare the
 * renderer.
 *
 * So the capture reads the four facts of the record and the launch bundle it
 * points at, and keeps the body only as its own hash, which N-10 and N-11 handle
 * (the hash classes of the path and of the implementation).
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, lstatSync } from "node:fs";
import { join } from "node:path";

import { assertTheRunHasEnded, type CaptureContext, type SurfaceCapture } from "./types.ts";

/** The marker a generated launcher carries, as the reference writes it. */
export const LAUNCHER_MARKER = /mixture-of-loops|specstride/i;

/** The logical record of a launcher (N-17). */
export type LauncherRecord = {
  readonly name: string;
  readonly exists: boolean;
  /** The marker that says the file is a generated launcher. */
  readonly markerPresent: boolean;
  /** The hash the launcher carries over its own bundle, where it carries one. */
  readonly hashInBody?: string;
  /** Whether that hash is the hash of the bundle it points at. */
  readonly hashValid?: boolean;
  /** The reference to the launch bundle, and whether it resolves. */
  readonly bundleReference?: string;
  readonly bundleResolves?: boolean;
  /** The arguments the launcher passes through to the engine. */
  readonly argumentsPassedThrough: readonly string[];
  /** The hash of the body itself; the body is not compared as text (N-17, N-11). */
  readonly bodyHash: string;
};

/** The value of the surface `launcher`. */
export type LauncherCapture = {
  readonly launcher: LauncherRecord;
  /** The launch bundle: every file by name, with its content. */
  readonly bundle: readonly { readonly name: string; readonly content: string }[];
};

/** The hash of a body, as the oracle computes it: sha-256 over the bytes. */
export function bodyHash(bytes: Uint8Array | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/** The arguments a generated launcher passes through, read off its body. */
export function argumentsPassedThrough(body: string): readonly string[] {
  const found = new Set<string>();
  for (const match of body.matchAll(/(--[a-z][a-z0-9-]*)/g)) found.add(match[1] as string);
  return Object.freeze([...found].sort());
}

/** The reference to the launch bundle a launcher carries. */
export function bundleReferenceOf(body: string): string | undefined {
  const match = /([\w./-]*(?:launch-contract|contract)\.(?:json|yaml|yml))/.exec(body);
  return match?.[1];
}

/** The hash a launcher carries in its body over the contract it was rendered from. */
export function hashInBody(body: string): string | undefined {
  return /\b([0-9a-f]{64})\b/.exec(body)?.[1];
}

/** Capture the surface `launcher`: the launcher and the launch bundle. */
export function captureLauncher(
  context: CaptureContext,
  options: { readonly launcher?: string; readonly bundle?: string } = {},
): SurfaceCapture & { readonly value: LauncherCapture } {
  assertTheRunHasEnded(context, "launcher");
  const root = context.launcherRoot ?? context.workdir;
  const name = options.launcher ?? "launch.sh";
  const file = join(root, name);
  if (!existsSync(file)) {
    return {
      surface: "launcher",
      id: "S-12",
      value: {
        launcher: {
          name,
          exists: false,
          markerPresent: false,
          argumentsPassedThrough: [],
          bodyHash: bodyHash(""),
        },
        bundle: [],
      },
    };
  }
  const body = readFileSync(file, "utf8");
  const bundleDir = join(root, options.bundle ?? "launch");
  const bundle: { name: string; content: string }[] = [];
  if (existsSync(bundleDir) && lstatSync(bundleDir).isDirectory()) {
    for (const entry of readdirSync(bundleDir).sort()) {
      const path = join(bundleDir, entry);
      if (lstatSync(path).isFile())
        bundle.push({ name: entry, content: readFileSync(path, "utf8") });
    }
  }
  const reference = bundleReferenceOf(body);
  const carried = hashInBody(body);
  const bundleFile = reference === undefined ? undefined : join(root, reference);
  const bundleBytes =
    bundleFile !== undefined && existsSync(bundleFile) ? readFileSync(bundleFile) : undefined;
  return {
    surface: "launcher",
    id: "S-12",
    value: {
      launcher: {
        name,
        exists: true,
        markerPresent: LAUNCHER_MARKER.test(body),
        ...(carried === undefined ? {} : { hashInBody: carried }),
        ...(carried === undefined || bundleBytes === undefined
          ? {}
          : { hashValid: bodyHash(bundleBytes) === carried }),
        ...(reference === undefined ? {} : { bundleReference: reference }),
        ...(bundleFile === undefined ? {} : { bundleResolves: existsSync(bundleFile) }),
        argumentsPassedThrough: argumentsPassedThrough(body),
        bodyHash: bodyHash(body),
      },
      bundle: Object.freeze(bundle),
    },
  };
}
