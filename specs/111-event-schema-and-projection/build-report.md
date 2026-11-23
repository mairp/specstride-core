# Report of the build: feature 111 (Event schema)

This is the report of the build of feature 111. It records the result of running
`specs/111-event-schema-and-projection/quickstart.md` end to end on the fixtures
(task **T066**, which covers **F111-FR-017**).

The result below is **not** a remembered one. The build runs the same four steps
on every `npm test`, from `tests/release/111/quickstart.test.ts` through
`tests/release/111/quickstart.ts`, and that test compares the recorded table
with the fresh run. A report that no longer reproduces fails the build.

- Runner: `tests/release/111/quickstart.ts`
- Test that runs it and holds this report to it: `tests/release/111/quickstart.test.ts`
- Run on 2026-10-01, Linux (`Linux 7.0.14-15-pve`), Node.js v22, `python3` 3.13

## Result

<!-- quickstart-result:begin -->

| Step | What `quickstart.md` asks for | Outcome |
|---|---|---|
| 1 | read spec.md: F111-FR-001 to F111-FR-038, F111-FR-050 and F111-FR-051 | pass |
| 2 | check the data: partners, types in spec.md, marked fields, no `data` field named `cause` | pass |
| 3 | run `python3 docs/ecosystem/check-traceability.py --require-all` and read the `[h` lines of 111 | pass |
| 4 | run the three sink fixtures; run the canary test with capture on and off | pass |

<!-- quickstart-result:end -->

The quickstart passed end to end: **4 of 4 steps pass, 0 fail.**

## What each step observed

### Step 1 — the requirements of `spec.md`

Source: `specs/111-event-schema-and-projection/spec.md`.

- 40 requirements are named by the quickstart (F111-FR-001 to F111-FR-038, plus
  F111-FR-050 and F111-FR-051), and `spec.md` holds exactly 40 requirement
  bullets — no more and no fewer.
- 40 of 40 name a `test:`.
- The 12 retired ids are absent, as they must be: F111-FR-039 to F111-FR-049
  moved to feature 144 with group G5, and F111-FR-052 was retired on 2026-09-30
  (second pass, item C8).

### Step 2 — the four checks of the data

Source: `specs/111-event-schema-and-projection/contracts/event-catalogue.tsv`,
read by a reader written for the runner alone, not by the product's own loader
in `packages/observability/src/catalogue/`.

- 123 rows read.
- 33 rows name a partner; every partner is itself a type of the catalogue.
- 123 of 123 types are written in `spec.md`.
- 73 free-text marks; every marked field is a `data` field of its own type, and
  every mark names an ingress class.
- No type has a `data` field named `cause`, which is a field of the envelope
  (annex X §X.1).

### Step 3 — the traceability check

Command: `python3 docs/ecosystem/check-traceability.py --require-all`, from the
root of the workdir.

- Exit **0**; the script reports `PASSED: checks a to h`.
- **0** lines start with `[h`, and so **0** name feature 111. The script reports
  a failure of a check as `[<letter>] <message>` (`fail()` in that file); check
  h is the per-feature check of `spec.md` and of the requirement ids. No `[h`
  line naming 111 is therefore the pass the quickstart asks the reader to look
  for, not a missing output.
- The destination line of this feature in the table of the script:
  `111-event-schema-and-projection   22   22` — 22 items, 22 kept.

### Step 4 — the three sink fixtures, and the canary with capture on and off

Commands: `node --test packages/testkit/src/conformance/EP-08/suite.test.ts`
and `node --test tests/security/111/canary.test.ts`, from the root of the
workdir.

- The three sink fixtures (`packages/testkit/src/conformance/EP-08/suite.test.ts`):
  exit **0**, 13 passing cases, 0 failing, 0 skipped. Each of the slow sink, the
  throwing sink and the dead collector reports its own passing cases; a skipped
  case would be a finding here and never a pass.
- The canary test (`tests/security/111/canary.test.ts`): exit **0**, 10 cases, 9
  pass, 0 fail, **1 skipped with its reason**. Both the `capture ON` case and
  the `capture OFF` case pass.

## What is honestly not claimed

- The one skip of step 4 is the canary's projection case: the compatibility
  projection is feature 144 and is not built, so its files cannot be searched.
  The surfaces a projection reads — the redacted event and the accessor's
  snippet — are searched in its place. It is recorded as a skip with its reason
  and is never counted as a pass.
- Step 3 asks the reader to look at "the lines that start with `[h` and name
  feature 111". In this version of `docs/ecosystem/check-traceability.py` such a
  line is only ever printed for a FAILURE of check h; there are none, so the
  observation above is an absence. The script's per-feature output is the
  destination line quoted in step 3 instead. The script belongs to feature 100's
  ecosystem documents and was not edited.
- The quickstart is **not** claimed as the proof of F111-FR-017. What step 4
  contributes is that the three sink fixtures exercise the REAL primary writer
  end to end: they open `PrimaryWriter` of
  `packages/observability/src/writer/writer.ts` and read the primary event file
  back from disk, so a writer that gave no `seq`, or that wrote after the sinks,
  could not pass them. The requirement's own test is CT-111-117 in
  `packages/observability/test/writer-lock.test.ts`, and the half about the
  writer being part of the core and not replaceable is a property of the package
  graph, held by T001's boundary check (`npm run check:imports`). The test of
  T066 asserts that both of those are in the build rather than restating them
  here.
- macOS is not covered here. Every macOS statement of this feature stays
  `unverified`; T075 is the out-of-band task that carries it.
