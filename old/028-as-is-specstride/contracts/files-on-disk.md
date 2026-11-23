# Contract: Files on disk

**Surface**: the files Specstride reads from and writes to a project workdir. All generated state lives under `<workdir>/.specstride/`. The one exception is the verification artifacts under `<workdir>/testautomation/<slug>/`. The field-level shapes are in `../data-model.md`.

## Inputs read

<!-- evidence: orchestrator.sh:354-430, lib/specstride_spec.py:397-420 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

- The spec, taken from `-s`, then `<workdir>/SPECS.md`, then `.specify/feature.json` → `feature_directory/tasks.md`, then a single `specs/*/tasks.md` or `openspec/changes/*/tasks.md`. Its format is `native`, `speckit-tasks` or `openspec-change`.
- `.env` in the Specstride install root, if present (`.env.example` documents it).

## State written (layout)

<!-- evidence: orchestrator.sh:448-489 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

```text
<workdir>/.specstride/
├── lock | lock.d/owner          # one run per workdir
├── stop.flag                    # written by `specstride stop`
├── proposer.pid                 # the in-flight pass, read by `stop --now`
├── last-run.conf                # the active-feature pointer for bare `resume`
├── run.log -> features/<slug>/runs/<run-id>/run.log
├── events.jsonl -> features/<slug>/runs/<run-id>/events.jsonl
└── features/<slug>/
    ├── PROGRESS.md
    ├── last-run.conf
    ├── gates/   GATE<N>-EVIDENCE.md  GATE<N>-APPROVED  GATE<N>-FEEDBACK.md
    │            GATE<N>-HINT.md  GATE<N>-ACCELERATION.md  .diagnosed-phase<N>  proofs/
    ├── attempts/phase<N>/attempt<M>[-<run-id>]/
    ├── verdicts/phase<N>.attempt<M>.<ts>.txt
    ├── yield/phase<N>-attempt<M>-<run-id>.json
    ├── learning/applied.json
    └── runs/<run-id>/{run.log, events.jsonl, verification/verification-plan.json}
<workdir>/testautomation/<slug>/{TEST_PLAN.md, generated/}   # unless --verification off
```

## Write discipline

<!-- evidence: proposer.sh:1186-1188, lib/critic.py:2750-2752 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->

- The proposer writes evidence and yield artifacts atomically (tmp file, then `mv`). The prompt tells it to. The orchestrator waits for `GATE<N>-EVIDENCE.md` to exist.
- The critic alone writes `GATE<N>-APPROVED` (empty) and `GATE<N>-FEEDBACK.md`.

## Reverse-run files

<!-- evidence: lib/reverse.py:199-229, lib/reverse_inventory.py:821-839 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

`<SRC>/.specstride/reverse/<slug>/` holds `inventory.json` and `INVENTORY.md`, plus the driver spec and verification commands. The output is `<SRC>/specs/NNN-as-is-<slug>/` (by default). It is refused at the source root, outside the source, inside `.git/`, the state directory or `.specify/`, or in a non-empty directory.

## Backend overlay trees (outside the workdir)

<!-- evidence: lib/backend_overlay.py:262-273, lib/backend_overlay.py:537-554, lib/backend_overlay.py:682-701, proposer.sh:465-489 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->

When a backend declares an overlay and its scope is not `none`, a disposable tree `specstride-overlay.<key>.*` is created in the real temp directory (`$TMPDIR` or `/tmp`). It holds `specstride-overlay.json` (marker, contract `specstride-overlay/v1`), `specstride-overlay.env`, `specstride-overlay.gitconfig` and one `0700` directory per declared variable. It is removed after the pass or critic call; stale trees whose owner is gone are swept at proposer startup. In the shipped tree no backend declares an overlay, so no such tree is written.
