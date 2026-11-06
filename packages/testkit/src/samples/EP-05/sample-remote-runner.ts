/**
 * T032 of feature 148 — a SAMPLE check runner outside the core, registered
 * from the test tree (F148-FR-018; feature 100, annex A §A.4, F100-FR-018).
 *
 * It is the runner of user story 3 of `specs/148-check-runner/spec.md`: *"The
 * author of a later runner, for example one that runs checks on another
 * machine, registers it behind EP-05."* So this sample serves a KIND of
 * identity the core does not know — `sample-remote` — and no file of a core
 * package names it. The "other machine" is a transport function with an
 * in-process default: nothing leaves the process, nothing is scheduled, and
 * the sample needs no network and no executable on disk.
 *
 * What it proves, against the suite of `../../conformance/EP-05/commands.test.ts`:
 *
 * | Scripted command of §C.8, "Proving test" | What this runner reports |
 * |---|---|
 * | pass | exit code 0, `passed`, no condition, stated as a pass |
 * | fail at step n | exit code n — the number of the failed required step — and the steps up to it |
 * | slow | exit code 0 under a time limit above its duration; the time-limit result under one below it |
 * | never ending | `running` until the time limit, then no exit code and the signal `TIMEOUT`; `cancel` gives `interrupted` |
 * | very large output | exit code 0 with each stream cut to the first 64000 characters |
 *
 * A note for the owner, recorded rather than repaired here: `ManifestEntry`
 * and `PinnedIdentity` of `@specstride/contracts/ep/check-runner` type `kind`
 * as the CLOSED union `IdentityKind` (`command`, `steps`), while
 * `spec.md`, "Closed sets", and the registry of feature 148 both treat the
 * kinds of identity as an OPEN registry. An author of a new kind must
 * therefore widen the type at the seam, which is what `SampleEntry` and
 * `SamplePin` below do. The contracts package belongs to feature 100 and is
 * not edited from here.
 */
import type { Implementation } from "../../conformance/frame.ts";

/** The kind of identity this sample serves. No core file names it. */
export const SAMPLE_KIND = "sample-remote" as const;

/** The id the registry of EP-05 records for this sample. */
export const SAMPLE_ID = "sample-remote-check-runner" as const;

/** The point this sample implements. */
export const SAMPLE_POINT_ID = "specstride.check-runner/1" as const;

/** The cap of each captured stream, in characters, as EP-05 documents it. */
export const SAMPLE_OUTPUT_CAP = 64_000;

/** The signal a job that was ended at its time limit carries. */
export const SAMPLE_TIMEOUT_SIGNAL = "TIMEOUT" as const;

/** The signal a job that could not be handed to the machine carries. */
export const SAMPLE_EXEC_ERROR_SIGNAL = "EXEC_ERROR" as const;

/** The machine this sample pretends to run on. It is a label, not a host. */
export const SAMPLE_MACHINE = "machine-a" as const;

/**
 * An entry of a check manifest of a kind the core does not know. It is the
 * shape of `ManifestEntry` with `kind` widened to a string, because the kinds
 * of identity are an open registry (see the note in the file comment).
 */
export type SampleEntry = {
  readonly id: string;
  readonly kind: string;
  readonly argv: readonly string[];
  readonly phase: number;
  readonly timeLimitMs: number;
  readonly env?: Readonly<Record<string, string>>;
};

/** The identity record `pin` returns for a job of the kind `sample-remote`. */
export type SamplePin = {
  readonly kind: string;
  /** The job on the machine, not a path on this one. */
  readonly executable: string;
  readonly size: number;
  readonly hash: string;
  readonly argv: readonly string[];
  /** The machine the job was pinned to; a later `start` uses no other. */
  readonly machine: string;
};

/** The handle `start` returns. It is opaque: only this runner reads it. */
export type SampleHandle = { readonly id: string };

/** `poll` of EP-05: the job runs, or it has ended. */
export type SamplePoll = { readonly state: "running" | "ended" };

/** One step of a job, for the scripted command "fail at step n". */
export type SampleStep = {
  readonly id: string;
  readonly required: boolean;
  readonly exitCode: number;
};

/** The result `result` returns. The conditions are fields of their own. */
export type SampleResult = {
  readonly commandId: string;
  readonly executable: string;
  readonly args: readonly string[];
  readonly cwd: string;
  readonly exitCode: number | null;
  readonly signal: string | null;
  readonly durationMs: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly passed: boolean;
  readonly tainted: boolean;
  readonly cached: boolean;
  readonly flaky: boolean;
  readonly interrupted: boolean;
  readonly unchecked: boolean;
  readonly reason: string | null;
  readonly error: string | null;
  readonly batch: number | null;
  readonly slot: number | null;
  readonly concurrent: boolean;
  readonly steps: {
    readonly state: "full" | "partial";
    readonly steps: readonly SampleStep[];
  } | null;
  readonly rerun: SampleResult | null;
  readonly unknownConditions: readonly string[];
  /** The machine the job ran on, which is this kind's own field. */
  readonly machine: string;
};

/**
 * One scripted command of the "Proving test" of EP-05, as data: what the job
 * does on the machine, and what any conforming runner must report for it.
 */
export type ScriptedJob = {
  /** The name the "Proving test" of EP-05 gives the command. */
  readonly name: string;
  /** The argument the sample reads; it is the name of the job on the machine. */
  readonly job: string;
  /** What the job exits with when it is left to run to its end. */
  readonly exitCode: number;
  /** How long the job takes on the machine; `null` means it never ends. */
  readonly durationMs: number | null;
  /** The characters the job writes to standard output BEFORE the cap. */
  readonly stdoutChars: number;
  /** The steps the job runs, for "fail at step n". */
  readonly steps: readonly SampleStep[];
};

/**
 * The steps of the job "fail at step n": every step up to and including the
 * one that failed, each required, the last one carrying its own number as its
 * exit code. The job stops there, so no later step is in the list.
 */
export function stepsUpTo(failAt: number): readonly SampleStep[] {
  return Object.freeze(
    Array.from({ length: failAt }, (_unused, i) => {
      const n = i + 1;
      return Object.freeze({ id: `step-${n}`, required: true, exitCode: n === failAt ? n : 0 });
    }),
  );
}

/**
 * A stand-in digest for a job on the machine: deterministic, 64 hexadecimal
 * characters, and no import, so the sample needs nothing of the platform.
 */
export function digestOf(text: string): string {
  let a = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    a = (a ^ text.charCodeAt(i)) * 0x01000193;
    a >>>= 0;
  }
  return a.toString(16).padStart(8, "0").repeat(8);
}

/** The job on the machine a pinned identity of this kind names. */
export function jobUri(job: string): string {
  return `${SAMPLE_KIND}://${SAMPLE_MACHINE}/${job}`;
}

/** The five scripted commands of the "Proving test" of EP-05 (F148-FR-018). */
export const SCRIPTED_JOBS: Readonly<Record<string, ScriptedJob>> = Object.freeze({
  pass: Object.freeze({
    name: "pass",
    job: "pass",
    exitCode: 0,
    durationMs: 1,
    stdoutChars: 5,
    steps: Object.freeze([]),
  }),
  "fail-at-step": Object.freeze({
    name: "fail at step n",
    job: "fail-at-step",
    exitCode: 35,
    durationMs: 2,
    stdoutChars: 40,
    steps: stepsUpTo(35),
  }),
  slow: Object.freeze({
    name: "slow",
    job: "slow",
    exitCode: 0,
    durationMs: 50,
    stdoutChars: 4,
    steps: Object.freeze([]),
  }),
  "never-ending": Object.freeze({
    name: "never ending",
    job: "never-ending",
    exitCode: 0,
    durationMs: null,
    stdoutChars: 7,
    steps: Object.freeze([]),
  }),
  "very-large-output": Object.freeze({
    name: "very large output",
    job: "very-large-output",
    exitCode: 0,
    durationMs: 3,
    stdoutChars: 10 * 1024 * 1024,
    steps: Object.freeze([]),
  }),
});

/** The names of the five scripted commands, in the order the annex states them. */
export const SCRIPTED_JOB_NAMES: readonly string[] = Object.freeze([
  "pass",
  "fail-at-step",
  "slow",
  "never-ending",
  "very-large-output",
]);

/** The job a pinned identity names, or the job `pass` where the name is unknown. */
export function jobOf(name: string): ScriptedJob {
  return SCRIPTED_JOBS[name] ?? (SCRIPTED_JOBS["pass"] as ScriptedJob);
}

/** The first `cap` characters of a stream; nothing beyond is kept. */
export function cutToTheCap(text: string, cap: number = SAMPLE_OUTPUT_CAP): string {
  return text.length <= cap ? text : text.slice(0, cap);
}

/** What the machine says about one job. The transport returns this. */
export type MachineOutcome = {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly steps: readonly SampleStep[];
};

/** The transport to the machine. The default runs the job in this process. */
export type Transport = (pin: SamplePin, entry: SampleEntry) => MachineOutcome;

/** The default transport: the job as the scripted table describes it. */
export const inProcessTransport: Transport = (pin) => {
  const job = jobOf(pin.executable.split("/").pop() ?? "pass");
  return Object.freeze({
    exitCode: job.exitCode,
    stdout: "o".repeat(Math.min(job.stdoutChars, SAMPLE_OUTPUT_CAP * 2)),
    stderr: job.exitCode === 0 ? "" : `job ${job.job} failed at step ${job.exitCode}\n`,
    steps: job.steps,
  });
};

/** A job this runner started: everything `poll`, `result` and `cancel` read. */
type LiveJob = {
  readonly handle: SampleHandle;
  readonly pin: SamplePin;
  readonly entry: SampleEntry;
  readonly job: ScriptedJob;
  readonly startedAt: number;
  readonly timeLimitMs: number;
  cancelled: boolean;
  settled: SampleResult | null;
};

/** What one instance of the sample runner needs. Both have a default. */
export type SampleRunnerOptions = {
  /** The clock the runner reads. A test may hand it a clock of its own. */
  readonly now?: () => number;
  readonly transport?: Transport;
};

/**
 * F148-FR-018 — the sample check runner. It is built by a factory, so that a
 * test can give it a clock and a transport of its own; `operations` below is
 * the instance the conformance suite registers.
 */
export function createSampleRemoteRunner(options: SampleRunnerOptions = {}) {
  const now = options.now ?? (() => Date.now());
  /** True where a test drives the clock; then `result` waits on no real timer. */
  const clockIsDriven = options.now !== undefined;
  const transport = options.transport ?? inProcessTransport;
  const live = new Map<string, LiveJob>();
  let issued = 0;

  const jobOfAHandle = (handle: SampleHandle): LiveJob => {
    const found = live.get(handle.id);
    if (found === undefined) {
      throw new Error(`no job of this runner carries the handle \`${handle.id}\` (F148-FR-001)`);
    }
    return found;
  };

  const overItsTimeLimit = (one: LiveJob): boolean => {
    const elapsed = now() - one.startedAt;
    if (one.job.durationMs === null) return elapsed >= one.timeLimitMs;
    return one.job.durationMs > one.timeLimitMs && elapsed >= one.timeLimitMs;
  };

  const hasEnded = (one: LiveJob): boolean => {
    if (one.cancelled || one.settled !== null) return true;
    if (one.job.durationMs === null) return overItsTimeLimit(one);
    if (one.job.durationMs > one.timeLimitMs) return overItsTimeLimit(one);
    return now() - one.startedAt >= 0;
  };

  const resultOfAJob = (one: LiveJob): SampleResult => {
    if (one.settled !== null) return one.settled;
    const common = {
      commandId: one.entry.id,
      executable: one.pin.executable,
      args: one.pin.argv,
      cwd: "/sample/workspace",
      batch: null,
      slot: null,
      concurrent: false,
      rerun: null,
      unknownConditions: Object.freeze([]),
      cached: false,
      flaky: false,
      tainted: false,
      machine: one.pin.machine,
    };
    let settled: SampleResult;
    if (one.cancelled) {
      // `cancel` ends the job: no exit code, and the condition `interrupted`.
      settled = Object.freeze({
        ...common,
        exitCode: null,
        signal: null,
        durationMs: Math.max(0, now() - one.startedAt),
        stdout: "",
        stderr: "",
        passed: false,
        interrupted: true,
        unchecked: false,
        reason: null,
        error: "interrupted",
        steps: null,
      });
    } else if (overItsTimeLimit(one) || (one.job.durationMs ?? Infinity) > one.timeLimitMs) {
      // The time limit of the job: no exit code and the signal `TIMEOUT`.
      settled = Object.freeze({
        ...common,
        exitCode: null,
        signal: SAMPLE_TIMEOUT_SIGNAL,
        durationMs: one.timeLimitMs,
        stdout: "",
        stderr: cutToTheCap(`job ${one.job.job} ran over its time limit\n`),
        passed: false,
        interrupted: false,
        unchecked: false,
        reason: null,
        error: "timeout",
        steps: null,
      });
    } else {
      let outcome: MachineOutcome;
      try {
        outcome = transport(one.pin, one.entry);
      } catch (thrown) {
        // The machine could not take the job: the plainer path of EP-05 is
        // `cannot-start`, and the result is never a pass.
        settled = Object.freeze({
          ...common,
          exitCode: null,
          signal: SAMPLE_EXEC_ERROR_SIGNAL,
          durationMs: 0,
          stdout: "",
          stderr: thrown instanceof Error ? thrown.message : String(thrown),
          passed: false,
          interrupted: false,
          unchecked: false,
          reason: null,
          error: "cannot-start",
          steps: null,
        });
        one.settled = settled;
        return settled;
      }
      settled = Object.freeze({
        ...common,
        exitCode: outcome.exitCode,
        signal: null,
        durationMs: one.job.durationMs ?? 0,
        stdout: cutToTheCap(outcome.stdout),
        stderr: cutToTheCap(outcome.stderr),
        passed: outcome.exitCode === 0,
        interrupted: false,
        unchecked: false,
        reason: null,
        error: null,
        steps:
          outcome.steps.length === 0
            ? null
            : Object.freeze({ state: "full" as const, steps: outcome.steps }),
      });
    }
    one.settled = settled;
    return settled;
  };

  /** The six operations of EP-05, as this kind serves them. */
  const operations = Object.freeze({
    /** `pin` at launch: the job on the machine, with its size and its digest. */
    pin(entry: SampleEntry): Promise<SamplePin> {
      const named = entry.argv[0];
      if (named === undefined || named === "") {
        return Promise.reject(
          new Error(`the entry \`${entry.id}\` names no job on the machine (F148-FR-001)`),
        );
      }
      const job = jobOf(named);
      const executable = jobUri(job.job);
      return Promise.resolve(
        Object.freeze({
          kind: SAMPLE_KIND,
          executable,
          size: job.stdoutChars,
          hash: digestOf(executable),
          argv: Object.freeze(entry.argv.slice(1)),
          machine: SAMPLE_MACHINE,
        }),
      );
    },

    /** `start`: the job is handed to the machine and a handle comes back. */
    start(input: {
      readonly identity: SamplePin;
      readonly workingDirectory?: string;
      readonly environmentAllowList?: readonly string[];
      readonly timeLimitMs: number;
      readonly containment?: string;
      readonly entry?: SampleEntry;
    }): Promise<SampleHandle> {
      const name = input.identity.executable.split("/").pop() ?? "pass";
      const job = jobOf(name);
      const handle: SampleHandle = Object.freeze({ id: `${SAMPLE_KIND}-${(issued += 1)}` });
      const entry: SampleEntry =
        input.entry ??
        Object.freeze({
          id: job.job,
          kind: SAMPLE_KIND,
          argv: Object.freeze([job.job, ...input.identity.argv]),
          phase: 1,
          timeLimitMs: input.timeLimitMs,
        });
      live.set(handle.id, {
        handle,
        pin: input.identity,
        entry,
        job,
        startedAt: now(),
        timeLimitMs: input.timeLimitMs,
        cancelled: false,
        settled: null,
      });
      return Promise.resolve(handle);
    },

    /** `poll`: `running` or `ended`, without waiting. */
    poll(handle: SampleHandle): Promise<SamplePoll> {
      const one = jobOfAHandle(handle);
      return Promise.resolve(Object.freeze({ state: hasEnded(one) ? "ended" : "running" }));
    },

    /**
     * `result`: the result of the job, once it has ENDED. A job that never ends
     * on its own is waited for until its time limit and no longer; with a clock
     * a test drives, no real timer is used at all.
     */
    async result(handle: SampleHandle): Promise<SampleResult> {
      const one = jobOfAHandle(handle);
      if (one.settled === null && !one.cancelled && !hasEnded(one) && !clockIsDriven) {
        const remaining = Math.max(0, one.timeLimitMs - (now() - one.startedAt));
        if (remaining > 0) {
          await new Promise<void>((resolve) => {
            setTimeout(resolve, remaining);
          });
        }
      }
      return resultOfAJob(one);
    },

    /** `cancel`: the job on the machine is ended; the result is `interrupted`. */
    cancel(handle: SampleHandle): Promise<void> {
      const one = jobOfAHandle(handle);
      if (one.settled === null) one.cancelled = true;
      return Promise.resolve();
    },

    /**
     * `environment`: the variables the job would get, without starting it. The
     * allow-list of this kind holds no provider credential, and the entry's
     * own `env` is overlaid on it.
     */
    environment(entry: SampleEntry): Readonly<Record<string, string>> {
      return Object.freeze({
        PATH: "/usr/bin:/bin",
        LC_ALL: "C",
        SAMPLE_REMOTE_MACHINE: SAMPLE_MACHINE,
        ...(entry.env ?? {}),
      });
    },
  });

  return Object.freeze({
    kind: SAMPLE_KIND,
    operations,
    /** The handles this instance issued, for a test of its own bookkeeping. */
    handles: (): readonly string[] => Object.freeze([...live.keys()]),
  });
}

/** The instance the conformance suite of EP-05 registers from the test tree. */
export const sampleRemoteRunner = createSampleRemoteRunner();

/** The six operations of the sample, as the registry of EP-05 reads them. */
export const operations = sampleRemoteRunner.operations;

/**
 * F100-FR-018 — the sample as the registry of the frame takes it: the class
 * `first-party`, the major 1, the rank `default`. It is registered FROM THE
 * TEST TREE, by `../../conformance/EP-05/commands.test.ts`.
 */
export const implementation: Implementation = Object.freeze({
  ep: "EP-05",
  pointId: SAMPLE_POINT_ID,
  id: SAMPLE_ID,
  implementationClass: "first-party",
  majors: [1],
  provenance: "default",
  operations,
});

/**
 * The sample as the registry of feature 148 takes a KIND: `pin`, `start` and
 * `environment` of one kind of identity, which `CheckRunnerRegistry.register`
 * accepts. The shape is duck-typed on purpose — the test kit holds no
 * dependency on `@specstride/check-runner`, which is how an author outside the
 * core registers a kind without the core naming the sample.
 */
export const runnerKind = Object.freeze({
  kind: SAMPLE_KIND,
  pin: (entry: SampleEntry): SamplePin => {
    const named = entry.argv[0];
    if (named === undefined || named === "") {
      throw new Error(`the entry \`${entry.id}\` names no job on the machine (F148-FR-001)`);
    }
    const job = jobOf(named);
    const executable = jobUri(job.job);
    return Object.freeze({
      kind: SAMPLE_KIND,
      executable,
      size: job.stdoutChars,
      hash: digestOf(executable),
      argv: Object.freeze(entry.argv.slice(1)),
      machine: SAMPLE_MACHINE,
    });
  },
  /**
   * `start` of the kind, as the registry of feature 148 calls it: it is handed
   * the resolved entry and must return a running command. The sample's own
   * instance does the work; the fields of the returned object are the ones the
   * registry reads (`running`, `settled`, `cancel`, the group and the pid).
   */
  start: (input: {
    readonly entry: SampleEntry;
    readonly identity: SamplePin;
    readonly workingDirectory: string;
    readonly timeLimitMs: number;
  }) => {
    const runner = createSampleRemoteRunner();
    const started = runner.operations
      .start({
        identity: input.identity,
        timeLimitMs: input.timeLimitMs,
        entry: input.entry,
      })
      .then((handle) => handle);
    const settled = started.then((handle) => runner.operations.result(handle));
    let ended = false;
    void settled.then(() => {
      ended = true;
    });
    return Object.freeze({
      commandId: input.entry.id,
      executable: input.identity.executable,
      args: input.identity.argv,
      cwd: input.workingDirectory,
      // A job on another machine has no process group and no pid HERE.
      processGroup: null,
      pid: null,
      startedAt: Date.now(),
      containment: "C1",
      running: () => !ended,
      endCause: () => (ended ? ("exit" as const) : null),
      settled,
      cancel: () => {
        void started.then((handle) => runner.operations.cancel(handle));
      },
    });
  },
  environment: (entry: SampleEntry): Readonly<Record<string, string>> =>
    operations.environment(entry),
});
