# Parity baseline (F154-SC-012, T015)

The recorded `events.jsonl` of one stub-engine run over `tests/fixtures/154/groups/`
under the `parity` profile (`SPECSTRIDE_PROFILE=parity`), with the feature absent:
recorded on `main` @ `aafb367f` — the commit the feature branch carries before any
behaviour of spec 154 is wired (recorded 2026-11-25, Node v22.23.2). The engine code
is the one of that commit (a separate git worktree of `aafb367f`); the fixture and
the harness of `tests/inertness/154/helpers.ts` are copied in unchanged.

## Command

The recorder is the harness itself: `fixture154()` of `tests/inertness/154/helpers.ts`
builds the working directory, pins the environment, puts the stub `claude` on `PATH`
and calls `runFeature`; then `SPECSTRIDE_PROFILE=parity` is set and the engine runs
once; the run's `events.jsonl` under the user-state root is copied out verbatim. Two
recordings of the baseline differ only in the run-varying fields listed below —
verified by diffing the two recordings.

## Format

`events-00.json` holds `{ "note", "lines" }`, where `lines` are the raw lines of the
recorded `events.jsonl`, in file order. `tests/inertness/154/parity.test.ts` joins
them with `\n` (plus the trailing newline) to reconstruct the recorded bytes, so the
file stays within the `.json` fixture formats of CT-100-130; the mapping to the event
file is one JSON array member per event file line. The comparison normalises only the
run-varying fields, on both sides with the one function `normalise` of the test:

- `at` — the wall-clock timestamps → `"@at"`
- `manifestHashes` — the content hash of the run's manifest, keyed on the temporary
  paths of the run → `["@manifest"]`
- `checkId` — the content hash `CMD-<hash>` → `CMD-@id`
- `durationMs`, `latencyMs` → `@ms`
- `planRef` — its content hash `verification-<hash>` → `verification-@ref`
- `/tmp/specstride-inert-154-<suffix>` — the temporary root of the run → `@root`
- the run id `<YYYYMMDD>-<HHMMSS>-<micros>` inside the paths of `run.started`,
  `verification.*` and `verdict.recorded` → `@run`

Every event is kept, in order; no event type is filtered. The baseline holds no event
of spec 154 (the run was recorded before any behaviour of the feature is wired), so a
parity run on the feature branch that emits one fails the byte comparison.
