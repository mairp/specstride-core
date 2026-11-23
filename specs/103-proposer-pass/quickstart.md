# Quickstart: validating feature 103

How a reviewer, and later an implementer, checks this feature. Nothing here calls a model.

## 1. Read the specification against the traceability files

```text
python3 docs/ecosystem/check-traceability.py
```

Look only at lines that start with `[h` and name `103-proposer-pass` or an id `F103-…`. None may appear: every row of the traceability files with a kept disposition (028 FR-018 and the 106 behaviour items) is in the `origin:` of a requirement, and every id of a `proves:` line of `tasks.md` exists.

## 2. Check the ids

```text
grep -rho 'F[0-9]\{3\}-\(FR\|SC\)-[0-9]\{3\}' specs/103-proposer-pass | sort -u | grep -v '^F103-\|^F100-\|^F141-'
```

The command prints nothing. Every requirement of this feature starts with `F103-`.

## 3. Run the parity tests (after the port exists)

```text
node --test tests/parity/103/
```

Each test names its fixture family and surfaces. FX-17 (pass limit), FX-18 (consecutive errors, both paths), FX-19 (no progress, both paths), FX-20 (cap kills) and FX-24 (short-pass nudge) run under the profile `parity`. Every surface is `equal` or `waived (DV-…)`.

## 4. Run the own tests

```text
node --test tests/characterization/103/
```

They cover: the index regenerated from the plan equals the stored one; an invalid ledger switches the layers off and stops nothing; a continued session is dropped at each of the eleven rules; the text of the task list edited between two passes stops the run before the next pass with the file named, and a tick does not; the start-up measured with prompts from 20 kB to 320 kB grows no faster than the prompt.

## 5. Check the layer interface

```text
node --test packages/testkit/src/conformance/EP-04/ packages/testkit/src/conformance/EP-15/
```

The sample layer `noop` passes the whole oracle. A second sample layer stacked above it requests a group of two stub passes and integrates them; the whole oracle passes with it unregistered. A layer that declares a directive the engine does not offer is refused. The static check finds no import of a writer of the phase gate in any layer package, and no core file that names `micro` or `parallel`.

## 6. Check the start-up

Measure the time from the decision to start a pass to the start of the harness process for prompts of 20, 40, 80, 160 and 320 kB. The curve grows no faster than the size of the prompt, and 320 kB takes under 1 s of processor time on the reference machine. The figures are `unverified` on macOS.

## 7. Expected sizes

| Item | Count |
|---|---|
| Functional requirements | 43 |
| Success criteria | 9 |
| As-is requirements carried | 1 (028 FR-018) |
| Behaviour items carried | 106 in 20 clusters |
| Register rows cited | DV-005, 006, 007, 010, 011, 012, 013, 014, 015, 018, 020, 027, 036, 045, 046, 053, 066, 067, 080, 082, 087, 092, 094 |
