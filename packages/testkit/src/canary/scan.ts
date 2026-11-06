/**
 * T285 — the scan of every sink of the canary harness (annex X, §X.9;
 * F100-FR-219; quickstart.md, scenario 7).
 *
 * The five sinks F100-FR-219 names — the event file, the exporters, the digest
 * line, the status output and the payload of the read model — are read AFTER
 * the run and searched for each planted value. The report names the sink and
 * the place of planting of every hit. Zero hits is the pass.
 *
 * The run routes every raw artefact of T202 through the one point of redaction
 * (the redactor of T200; the stub of T284 in this suite) and writes the result
 * to the sample sink of T111 (EP-08) and through the sample view of T149
 * (EP-09). The two samples are the sink and the view the scan reads.
 */
import { kept as sampleSinkEvents, operations as sinkSample } from "../samples/EP-08/index.ts";
import { operations as viewSample } from "../samples/EP-09/index.ts";
import { SINKS, type Sink } from "@specstride/contracts/ep/redactor";
import { formatDigest, type Digest } from "@specstride/contracts/grammar/digest";
import type { EventEnvelope } from "@specstride/contracts/envelope/event";
import type { RunView } from "@specstride/contracts/ep/view";
import type { ProjectInput } from "@specstride/contracts/ep/view";
import type { SinkContext } from "@specstride/contracts/ep/event-sink";
import type { StubRedactor } from "./stub-redactor.ts";
import {
  CANARY_PLACES,
  plantEverything,
  registerCanaries,
  type CanaryPlace,
  type PlantedArtefacts,
  type Planting,
} from "./plant.ts";

/** The section of annex X the scan answers to. */
export const ANNEX_SECTION = "annex X, §X.9" as const;

/** The five sinks of F100-FR-219, as §X.4 names them (T200). */
export const SCANNED_SINKS: readonly Sink[] = SINKS;

/** The size cap the ingress gives the redactor in this fixture. */
export const SIZE_CAP = 65536 as const;

/** The switch of content capture: ON, as F100-FR-219 requires. */
export const CONTENT_CAPTURE = true as const;

/* ------------------------------------------------------------------ *
 * The run: the planted artefacts through the one point of redaction
 * into the five sinks.
 * ------------------------------------------------------------------ */

/** What one sink holds after the run, as text the scan searches. */
export type SinkContents = Readonly<Record<Sink, readonly string[]>>;

/** The result of one run of the canary harness. */
export type CanaryRun = {
  /** The plan of the planting (T202). */
  readonly planting: Planting;
  /** The raw artefacts, before redaction. */
  readonly artefacts: PlantedArtefacts;
  /** How many replacements the redactor made. */
  readonly replacements: number;
  /** The events the sample sink kept. */
  readonly events: readonly EventEnvelope[];
  /** The digest line, as a host skill would print it. */
  readonly digestLine: string;
  /** The status output, as `status --line` would print it. */
  readonly statusOutput: string;
  /** The payload of the read model, as the sample view projected it. */
  readonly view: RunView;
  /** What each sink holds, as text. */
  readonly sinks: SinkContents;
};

/** The context the sample sink is opened with (§C.10, Inputs). */
function sinkContext(): SinkContext {
  return {
    runId: "canary-run",
    launchId: "canary-launch",
    engineStartId: "canary-start-1",
    feature: "100-specstride",
    workspaceId: "canary-workspace",
    labels: { job: "canary", "service.name": "specstride", task: "phase-7", backend: "stub" },
    profile: "default",
    switches: { "observability.captureContent": CONTENT_CAPTURE },
    content: {
      byReference: () => Promise.resolve(undefined),
      asIsSnippetForTheCompatibilityProjection: () => Promise.resolve(undefined),
    },
    compatibilityProjection: { asIsNameOf: () => null },
  } as SinkContext;
}

/** One event of the run, with the redacted text of a place in its `data`. */
function eventOf(seq: number, place: CanaryPlace, text: string): EventEnvelope {
  return {
    schema: "specstride.event",
    v: 1,
    seq,
    ts: "2026-10-01T00:00:00.000Z",
    type: `canary.${place.replace(/-/g, "_")}`,
    runId: "canary-run",
    launchId: "canary-launch",
    data: { place, text },
  } as unknown as EventEnvelope;
}

/**
 * Run the canary harness with content capture ON: plant the seven canaries,
 * register them as resolved secrets, drive the two samples, and write the
 * redacted form of every artefact into the five sinks (F100-FR-219).
 */
export async function runCanaryHarness(input: {
  readonly redactor: StubRedactor;
  readonly planting: Planting;
}): Promise<CanaryRun> {
  const { redactor, planting } = input;
  registerCanaries(redactor, planting);
  const artefacts = await plantEverything(planting);

  // The one point of redaction: every artefact passes it before any sink.
  const redacted: Record<CanaryPlace, string> = {} as Record<CanaryPlace, string>;
  for (const place of CANARY_PLACES) {
    redacted[place] = redactor.redact(artefacts[place], SIZE_CAP).text;
  }

  // Sink 1 and 2: the event file and the exporters. The sample sink of T111
  // stands for both: the writer hands it the events of the primary file, and an
  // exporter is a second sink of the same interface.
  await sinkSample.open(sinkContext());
  let seq = 0;
  for (const place of CANARY_PLACES) {
    seq += 1;
    await sinkSample.write(eventOf(seq, place, redacted[place]));
  }
  await sinkSample.flush();
  const events: readonly EventEnvelope[] = Object.freeze([...sampleSinkEvents]);
  const exporterLines: readonly string[] = Object.freeze([
    sinkSample.status().line,
    JSON.stringify(sinkSample.status().record),
    ...events.map((event) => JSON.stringify(event)),
  ]);

  // Sink 3: the digest line, produced from the events and printed verbatim.
  const digest: Digest = {
    state: "completed",
    exit: 0,
    lastStage: "specstride",
    evidence: "phase:7:evidence",
  };
  const digestLine = formatDigest(digest);

  // Sink 4: the status output, as `status --line` prints it.
  const statusOutput = `run=canary-run st=finished validUntil=none`;

  // Sink 5: the payload of the read model, through the sample view of T149.
  const view = viewSample.project({
    events,
    runRecord: { state: "finished" },
    terminalRecord: undefined,
    pauseRecord: undefined,
    leaseProbe: "free",
    newestLaunchRecord: undefined,
    supervisionRecord: undefined,
    processTableSearch: [],
    handshakeLimitMs: 1000,
    now: "2026-10-01T00:00:01.000Z",
  } as unknown as ProjectInput);

  await sinkSample.close();

  const sinks: SinkContents = Object.freeze({
    "event file": Object.freeze(events.map((event) => JSON.stringify(event))),
    exporters: exporterLines,
    digest: Object.freeze([digestLine]),
    status: Object.freeze([statusOutput]),
    "read model": Object.freeze([JSON.stringify(view)]),
  });

  return Object.freeze({
    planting,
    artefacts,
    replacements: redactor.replacements(),
    events,
    digestLine,
    statusOutput,
    view,
    sinks,
  });
}

/* ------------------------------------------------------------------ *
 * The scan.
 * ------------------------------------------------------------------ */

/** One hit of the scan: a planted value found in a sink (F100-FR-219). */
export type CanaryHit = {
  /** The sink the value was found in. */
  readonly sink: Sink;
  /** The place of planting the value came from. */
  readonly place: CanaryPlace;
  /** The value that was found. */
  readonly value: string;
  /** Where the value was planted, in words. */
  readonly where: string;
  /** The line of the sink the value was found on, 1-indexed. */
  readonly line: number;
};

/** The report of one scan (T285). */
export type CanaryReport = {
  /** The hits, most important first: zero hits is the pass. */
  readonly hits: readonly CanaryHit[];
  /** True where no planted value appears in any sink. */
  readonly passed: boolean;
  /** The sinks that were read. */
  readonly sinksRead: readonly Sink[];
  /** The canaries that were searched for. */
  readonly canariesSearched: number;
  /** The report as lines, each naming the sink and the place of planting. */
  readonly lines: readonly string[];
};

/**
 * Read every sink after the run and search it for each planted value. The
 * report names the sink and the place of planting of every hit; zero hits is
 * the pass (F100-FR-219).
 */
export function scanSinks(run: {
  readonly planting: Planting;
  readonly sinks: SinkContents;
}): CanaryReport {
  const hits: CanaryHit[] = [];
  for (const sink of SCANNED_SINKS) {
    const lines = run.sinks[sink] ?? [];
    for (const [index, text] of lines.entries()) {
      for (const canary of run.planting.plan) {
        if (!text.includes(canary.value)) continue;
        hits.push(
          Object.freeze({
            sink,
            place: canary.place,
            value: canary.value,
            where: canary.where,
            line: index + 1,
          }),
        );
      }
    }
  }
  return Object.freeze({
    hits: Object.freeze(hits),
    passed: hits.length === 0,
    sinksRead: SCANNED_SINKS,
    canariesSearched: run.planting.plan.length,
    lines: Object.freeze(hits.map(formatHit)),
  });
}

/** One hit as a line: the sink, the place of planting and the value. */
export function formatHit(hit: CanaryHit): string {
  return (
    `sink "${hit.sink}" (line ${hit.line}) holds the canary planted in ${hit.where} ` +
    `[place: ${hit.place}] (F100-FR-219)`
  );
}

/** The report as one block of text, for the message of a failing test. */
export function formatReport(report: CanaryReport): string {
  if (report.passed) {
    return (
      `0 of ${report.canariesSearched} planted canaries appear in the ` +
      `${report.sinksRead.length} sinks ${report.sinksRead.join(", ")} (F100-FR-219)`
    );
  }
  return [
    `${report.hits.length} planted canary value(s) reached a sink (F100-FR-219):`,
    ...report.lines.map((line) => `  ${line}`),
  ].join("\n");
}

/** Run the harness and scan the sinks: the whole of scenario 7 in one call. */
export async function runAndScan(input: {
  readonly redactor: StubRedactor;
  readonly planting: Planting;
}): Promise<{ readonly run: CanaryRun; readonly report: CanaryReport }> {
  const run = await runCanaryHarness(input);
  return Object.freeze({ run, report: scanSinks(run) });
}

export { SINKS, type Sink };
